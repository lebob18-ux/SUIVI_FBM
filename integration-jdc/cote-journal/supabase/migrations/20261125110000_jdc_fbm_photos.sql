-- Journal de chantier : photos d'une installation saisies dans le module FBM.
begin;
set local lock_timeout = '8s';
set local statement_timeout = '60s';

do $$
begin
  if to_regprocedure('public.finalize_journal_fbm(uuid)') is null
     or to_regprocedure('public.journal_can_archive_report(uuid)') is null then
    raise exception 'Cette migration nécessite le projet Journal de chantier et son archive FBM.';
  end if;
end $$;

alter table public.chantier_documents add column if not exists fbm_photo jsonb;
create index if not exists chantier_documents_fbm_photo_lookup
  on public.chantier_documents using gin (fbm_photo jsonb_path_ops)
  where fbm_photo is not null;

drop policy if exists journal_fbm_photo_object_insert on storage.objects;
create policy journal_fbm_photo_object_insert on storage.objects
for insert to authenticated with check (
  bucket_id = 'chantier-documents'
  and split_part(name, '/', 4) ~ ('^fbm-' || (select auth.uid())::text || '-photo\.(jpg|png|webp|heic|heif|avif)$')
  and public.journal_can_archive_report(public.journal_document_path_chantier_id(name))
);

create or replace function public.finalize_journal_fbm_photo(
  p_chantier_id uuid, p_photo_id uuid, p_metadata jsonb, p_filename text, p_mime text, p_bytes bigint
) returns public.chantier_documents
language plpgsql security definer set search_path = '' as $fbm$
declare
  actor uuid := auth.uid();
  doc public.chantier_documents;
  target_root text;
  root_folder uuid;
  target_folder uuid;
  path text;
  ext text;
  who text;
  phase text := p_metadata->>'phase';
  kind text := p_metadata->>'kind';
  meta_key text;
  photo_description text;
begin
  if actor is null or p_chantier_id is null or not coalesce(public.journal_can_archive_report(p_chantier_id),false) then
    raise exception 'Droit de contribution au chantier requis.' using errcode='42501';
  end if;
  ext := case p_mime when 'image/jpeg' then 'jpg' when 'image/png' then 'png'
      when 'image/webp' then 'webp' when 'image/heic' then 'heic' when 'image/heif' then 'heif'
      when 'image/avif' then 'avif' end;
  if ext is null or p_photo_id is null or p_bytes is null or p_bytes not between 1 and 50331648
     or p_filename is null or length(p_filename) not between 5 and 180
     or p_filename ~ '[[:cntrl:]/\\]' or right(lower(p_filename),length(ext)+1) <> '.' || ext then
    raise exception 'Nom, taille ou type de photo FBM incorrect.';
  end if;
  if jsonb_typeof(p_metadata) is distinct from 'object' or octet_length(p_metadata::text)>8192
     or p_metadata->>'id' is distinct from p_photo_id::text
     or coalesce(length(btrim(p_metadata->>'chantier')),0) not between 1 and 180
     or coalesce(length(btrim(p_metadata->>'support')),0) not between 1 and 180
     or coalesce(phase,'') not in ('fouille','beton','matage')
     or coalesce(kind,'') not in ('phase','bl','slump')
     or coalesce(p_metadata->>'timeSource','') not in ('camera','import')
     or coalesce(p_metadata->>'destination','') not in ('','massif','carotte')
     or coalesce(p_metadata->>'capturedAt','') !~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}(\.[0-9]{1,6})?Z$'
     or (kind <> 'phase' and (phase <> 'beton' or coalesce(length(btrim(p_metadata->>'bl')),0)=0)) then
    raise exception 'Chantier FBM, support, phase ou référence de photo incorrects.';
  end if;
  for meta_key in select jsonb_object_keys(p_metadata) loop
    if meta_key not in ('id','chantier','support','supportId','installation','rj','phase','kind','bl','destination',
                        'phaseDate','pourDate','capturedAt','timeSource','slump','classeSlump')
       or jsonb_typeof(p_metadata->meta_key) not in ('string','number','null')
       or coalesce(length(p_metadata->>meta_key),0)>256 then
      raise exception 'Champ photo FBM incorrect.';
    end if;
  end loop;
  perform (p_metadata->>'capturedAt')::timestamptz;
  foreach meta_key in array array['phaseDate','pourDate'] loop
    if nullif(p_metadata->>meta_key,'') is not null then
      if p_metadata->>meta_key !~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$' then
        raise exception 'Date FBM incorrecte.';
      end if;
      perform (p_metadata->>meta_key)::date;
    end if;
  end loop;

  path := 'documents/'||p_chantier_id||'/'||p_photo_id||'/fbm-'||actor||'-photo.'||ext;
  if not exists (select 1 from storage.objects o where o.bucket_id='chantier-documents' and o.name=path
      and o.owner_id=actor::text and lower(o.metadata->>'mimetype')=p_mime and (o.metadata->>'size')::bigint=p_bytes) then
    raise exception 'Le transfert de cette photo par cet agent n’est pas confirmé.';
  end if;

  -- Le PDF et les photos prennent le même verrou à la création du dossier FBM.
  perform 1 from public.chantiers where id=p_chantier_id for update;
  if not found then raise exception 'Chantier introuvable.'; end if;
  select * into doc from public.chantier_documents where id=p_photo_id;
  if found then
    if doc.chantier_id=p_chantier_id and doc.created_by=actor and doc.storage_path=path
       and doc.fbm_photo=p_metadata and doc.bytes=p_bytes and doc.mime_type=p_mime then return doc; end if;
    raise exception 'Cet identifiant correspond déjà à un autre document.';
  end if;

  select coalesce(nullif(btrim(p.full_name),''),p.email) into who from public.profiles p where p.id=actor;
  who := coalesce(who,'Contributeur');
  target_root := case kind when 'bl' then 'B.L' when 'slump' then 'Slump' else 'FBM' end;
  select id into root_folder from public.chantier_document_folders
    where chantier_id=p_chantier_id and is_root and parent_id is null and root_code='personnalise'
      and lower(name)=lower(target_root) order by created_at,id limit 1;
  if root_folder is null and target_root='FBM' then
    select id into root_folder from public.chantier_document_folders
      where chantier_id=p_chantier_id and is_root and root_code='personnalise' and name='Rapports FBM'
      order by created_at,id limit 1;
    if root_folder is not null then
      update public.chantier_document_folders set name='FBM' where id=root_folder;
    end if;
  end if;
  if root_folder is null then
    insert into public.chantier_document_folders (chantier_id,root_code,name,is_root,created_by,created_by_name)
      values (p_chantier_id,'personnalise',target_root,true,actor,who) returning id into root_folder;
  end if;
  target_folder := root_folder;
  if kind='phase' then
    select id into target_folder from public.chantier_document_folders
      where chantier_id=p_chantier_id and parent_id=root_folder and lower(name)='photos'
      order by created_at,id limit 1;
    if target_folder is null then
      insert into public.chantier_document_folders (chantier_id,parent_id,root_code,name,is_root,created_by,created_by_name)
        values (p_chantier_id,root_folder,'personnalise','Photos',false,actor,who) returning id into target_folder;
    end if;
  end if;
  photo_description := concat_ws(' · ', 'Photo FBM', p_metadata->>'chantier','Support '||(p_metadata->>'support'),
    nullif(p_metadata->>'installation',''),
    case phase when 'beton' then 'Béton' when 'matage' then 'Matage' else 'Fouille' end,
    nullif(p_metadata->>'destination',''),nullif(p_metadata->>'phaseDate',''),
    'BL '||nullif(p_metadata->>'bl',''),'RJ '||nullif(p_metadata->>'rj',''),
    'Slump '||nullif(p_metadata->>'slump',''),nullif(p_metadata->>'classeSlump',''));
  insert into public.chantier_documents
    (id,chantier_id,folder_id,storage_path,file_name,mime_type,bytes,description,created_by,created_by_name,fbm_photo)
    values(p_photo_id,p_chantier_id,target_folder,path,p_filename,p_mime,p_bytes,photo_description,actor,who,p_metadata)
    returning * into doc;
  return doc;
end;
$fbm$;
revoke all on function public.finalize_journal_fbm_photo(uuid,uuid,jsonb,text,text,bigint) from public,anon;
grant execute on function public.finalize_journal_fbm_photo(uuid,uuid,jsonb,text,text,bigint) to authenticated;
notify pgrst, 'reload schema';
commit;
