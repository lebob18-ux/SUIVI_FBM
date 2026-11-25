/* Photos de la fiche FBM. Stockage, identité et documents du Journal uniquement. */
(() => {
  'use strict';
  const MAX_BYTES = 48 * 1024 * 1024;
  const PHASES = {fouille: 'Fouille', beton: 'Béton', matage: 'Matage'};
  const PATHS = {phase: 'Documents / FBM / Photos', bl: 'Documents / B.L', slump: 'Documents / Slump'};
  const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  const EXT = {'image/jpeg':'jpg', 'image/png':'png', 'image/webp':'webp', 'image/heic':'heic', 'image/heif':'heif', 'image/avif':'avif'};
  const QUEUE = 'photos';
  let opening;

  function openQueue() {
    if (!opening) {
      opening = new Promise((resolve, reject) => {
        const request = indexedDB.open('jdc-fbm-photo-queue-v1', 1);
        request.onupgradeneeded = () => {
          const store = request.result.createObjectStore(QUEUE, {keyPath:['siteId','userId','id']});
          store.createIndex('scope', ['siteId','userId']);
        };
        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
          const db = request.result;
          db.onversionchange = () => { db.close(); opening = null; };
          resolve(db);
        };
      }).catch(error => { opening = null; throw error; });
    }
    return opening;
  }

  async function transaction(mode, run) {
    const db = await openQueue();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(QUEUE, mode);
      let result;
      tx.oncomplete = () => resolve(result);
      tx.onabort = () => reject(tx.error || new Error('Stockage local indisponible.'));
      tx.onerror = () => reject(tx.error || new Error('Écriture locale impossible.'));
      run(tx.objectStore(QUEUE), value => { result = value; });
    });
  }

  function putOnce(job) {
    return transaction('readwrite', (store, done) => {
      const read = store.get([job.siteId, job.userId, job.id]);
      read.onsuccess = () => {
        if (!read.result) store.add(job);
        done(read.result || job);
      };
    });
  }

  async function imageFormat(file) {
    if (!file || typeof file.slice !== 'function' || !file.size || file.size > MAX_BYTES)
      throw new Error('La photo doit peser entre 1 octet et 48 Mio.');
    const b = new Uint8Array(await file.slice(0, 128).arrayBuffer());
    const ascii = (i, n) => String.fromCharCode(...b.slice(i,i+n));
    if (b[0] === 255 && b[1] === 216 && b[2] === 255) return 'image/jpeg';
    if (b[0] === 137 && ascii(1,7) === 'PNG\r\n\x1a\n') return 'image/png';
    if (ascii(0,4) === 'RIFF' && ascii(8,4) === 'WEBP') return 'image/webp';
    if (ascii(4,4) === 'ftyp') {
      const brands = [ascii(8,4)];
      const end = Math.min(b.length, new DataView(b.buffer).getUint32(0));
      for (let i = 16; i + 4 <= end; i += 4) brands.push(ascii(i,4));
      if (brands.some(brand => ['avif','avis'].includes(brand))) return 'image/avif';
      if (brands.some(brand => ['heic','heix','hevc','hevx'].includes(brand))) return 'image/heic';
      if (brands.some(brand => ['mif1','msf1'].includes(brand))) return 'image/heif';
    }
    throw new Error('Choisissez une photo JPEG, PNG, WebP, HEIC, HEIF ou AVIF.');
  }

  function text(value, max = 180) {
    const s = String(value ?? '').trim();
    if (s.length > max || /[\u0000-\u001f\u007f]/.test(s)) throw new Error('Une référence FBM est invalide.');
    return s;
  }

  function supportKey(value) {
    const chantier = text(value?.chantier), support = text(value?.support);
    if (!chantier || !support) throw new Error('Sélectionnez le chantier et le support dans la fiche FBM.');
    return {chantier, support};
  }

  function metadata(raw) {
    const m = {...supportKey(raw)};
    for (const key of ['id','installation','supportId','rj','phase','kind','bl','destination','phaseDate',
      'pourDate','capturedAt','timeSource','slump','classeSlump']) m[key] = text(raw[key]);
    if (!UUID.test(m.id) || !Object.hasOwn(PHASES,m.phase) || !Object.hasOwn(PATHS,m.kind))
      throw new Error('La référence ou la phase de la photo FBM est invalide.');
    if ((m.kind !== 'phase' && (!m.bl || m.phase !== 'beton')) ||
        !['','massif','carotte'].includes(m.destination)) throw new Error('Bon de livraison ou destination béton manquant.');
    for (const d of [m.phaseDate,m.pourDate]) {
      if (d && (!/^\d{4}-\d\d-\d\d$/.test(d) || !Number.isFinite(Date.parse(d)) ||
          new Date(d).toISOString().slice(0,10) !== d)) throw new Error('Date de phase FBM invalide.');
    }
    if (!['camera','import'].includes(m.timeSource) || !Number.isFinite(Date.parse(m.capturedAt)))
      throw new Error('Horodatage de la photo invalide.');
    m.id = m.id.toLowerCase();
    m.capturedAt = new Date(m.capturedAt).toISOString();
    return m;
  }

  function part(s) {
    return s.normalize('NFC').replace(/[\\/:*?"<>|\s]+/g,'-').replace(/^[.\-]+|[.\-]+$/g,'') || 'ref';
  }

  function filename(m, mime) {
    const t = new Date(m.capturedAt);
    const two = n => String(n).padStart(2,'0');
    const stamp = [t.getFullYear(),two(t.getMonth()+1),two(t.getDate())].join('-') + '_' +
      [two(t.getHours()),two(t.getMinutes()),two(t.getSeconds())].join('-');
    const fields = ['FBM','Support-' + part(m.support).slice(0,55), PHASES[m.phase]];
    if (m.kind !== 'phase') fields.push((m.kind === 'bl' ? 'BL-' : 'Slump-BL-') + part(m.bl).slice(0,40));
    if (m.destination) fields.push(m.destination === 'carotte' ? 'Carotte' : 'Massif');
    if (m.phaseDate) fields.push('Phase-' + m.phaseDate);
    const suffix = '_' + stamp + '_' + m.id.slice(0,8) + '.' + EXT[mime];
    return [...fields.join('_')].slice(0,180-suffix.length).join('') + suffix;
  }

  function reason(error) {
    if (error?.code === 'PGRST202' || error?.code === '42703')
      return 'La mise à jour de la base Journal de chantier reste à appliquer.';
    if (error?.code === '42501' || /row.level security/i.test(error?.message || ''))
      return 'Vérifiez votre droit de contribution et l’activation des photos sur ce Journal.';
    return String(error?.message || error || 'Connexion indisponible.').slice(0,180);
  }

  function attach({frame,token,site,userId,db,valid,notify,refresh}) {
    const scope = [site.id,userId];
    const inflight = new Map();
    const approvedSources = new Set();
    let closed = false, draining = null;

    function check() {
      if (closed || !valid()) throw new Error('Le compte ou le chantier Journal a changé. Rouvrez FBM depuis le chantier concerné.');
    }
    function session(source, expected) {
      check();
      if (source !== frame.contentWindow || expected !== token)
        throw new Error('La session photo FBM a changé. Rouvrez la fiche depuis le Journal.');
    }
    function checkRoute(part) {
      const {chantier} = supportKey(part);
      const normalize = name => String(name || '').trim().normalize('NFC').toLocaleLowerCase('fr');
      if (normalize(chantier) === normalize(site.name) || approvedSources.has(chantier)) return;
      if (!window.confirm('Le chantier FBM « ' + chantier + ' » et le chantier du Journal « ' + site.name +
          ' » ont des noms différents. Classer les photos de cette fiche dans « ' + site.name + ' » ?'))
        throw new Error('Classement annulé. Ouvrez FBM depuis le chantier Journal souhaité.');
      approvedSources.add(chantier);
    }
    function feedback(message, pending) {
      if (!closed && valid()) notify(message,pending);
    }
    async function deliver(job) {
      check();
      if (navigator.onLine === false) throw new Error('Hors connexion. Reprise à la reconnexion ou à la réouverture de FBM.');

      const p = job.meta, path = 'documents/' + site.id + '/' + job.id + '/fbm-' + userId + '-photo.' + EXT[job.mime];
      const {error: upload} = await db.storage.from('chantier-documents').upload(path, job.file, {contentType:job.mime, upsert:false});
      if (upload && !(String(upload.statusCode || upload.status || upload.code) === '409' ||
          /resourcealreadyexists|already exists|duplicate/i.test(String(upload.message)))) throw upload;
      check();
      const {data: doc,error} = await db.rpc('finalize_journal_fbm_photo',{
        p_chantier_id:site.id, p_photo_id:job.id, p_metadata:p, p_filename:job.name,
        p_mime:job.mime, p_bytes:job.file.size
      });
      if (error) throw error;
      if (!doc || doc.id !== job.id || doc.chantier_id !== site.id || !doc.folder_id || doc.storage_path !== path)
        throw new Error("Le Journal n’a pas confirmé l’archivage de la photo.");
      // The document is committed. A leftover queue entry is safe to replay.
      if (job.durable) {
        try { await transaction('readwrite', store => store.delete([...scope,job.id])); } catch (_) {}
      }
      if (!closed && valid()) Promise.resolve().then(refresh).catch(() => {});
      return {status:'saved',name:doc.file_name || job.name,savedTo:PATHS[p.kind],id:job.id};
    }
    function send(job) {
      if (inflight.has(job.id)) return inflight.get(job.id);
      const request = deliver(job).finally(() => inflight.delete(job.id));
      inflight.set(job.id,request);
      return request;
    }
    async function save(source,expected,raw,file) {
      session(source,expected);
      const meta = metadata(raw);
      checkRoute(meta);
      const mime = await imageFormat(file);
      session(source,expected);
      let job = {siteId:site.id,userId,id:meta.id,meta,mime,file,name:filename(meta,mime),durable:true};
      try { job = await putOnce(job); } catch (_) { job.durable = false; }
      try {
        const result = await send(job);
        feedback('Photo classée dans ' + result.savedTo + ' · ' + result.name, false);
        return result;
      } catch (error) {
        if (!job.durable) throw new Error('Photo non archivée, copie locale indisponible. ' + reason(error));
        const message = reason(error);
        feedback('Photo conservée sur cet appareil · ' + message,true);
        return {status:'pending',name:job.name,savedTo:PATHS[job.meta.kind],id:job.id,reason:message};
      }
    }

    function retry() {
      if (draining) return draining;
      draining = (async () => {
        check();
        const keys = await transaction('readonly', (store,done) => {
          const q = store.index('scope').getAllKeys(IDBKeyRange.only(scope));
          q.onsuccess = () => done(q.result);
        });
        let count = 0, lastError = '', sent = 0;
        for (const key of keys) {
          check();
          const job = await transaction('readonly',(store,done) => {
            const q = store.get(key); q.onsuccess = () => done(q.result);
          });
          if (!job) continue;
          try { await send(job); sent++; }
          catch (error) { count++; lastError = reason(error); }
        }
        if (count) feedback(count + ' photo(s) conservée(s) sur cet appareil · ' + lastError,true);
        else if (sent) feedback(sent + ' photo(s) classée(s) dans les documents du chantier.',false);
      })().catch(error => {
        // Some private browsers disable IndexedDB. Direct online saves still work.
        if (!closed && valid() && navigator.onLine === false)
          feedback('Photos hors connexion indisponibles sur cet appareil. ' + reason(error),true);
      }).finally(() => { draining = null; });
      return draining;
    }

    function documentQuery(part,columns) {
      return db.from('chantier_documents').select(columns).eq('chantier_id',site.id)
        .contains('fbm_photo',supportKey(part));
    }
    async function list(source,expected,part) {
      session(source,expected);
      const rows = [];
      const pageSize = 100;
      for (let i = 0; ; i += pageSize) {
        const {data,error} = await documentQuery(part,'id,file_name,fbm_photo,created_at')
          .order('created_at',{ascending:false}).order('id',{ascending:true}).range(i,i+pageSize-1);
        session(source,expected);
        if (error) throw new Error(reason(error));
        for (const row of data || []) rows.push({id:row.id,name:row.file_name,phase:row.fbm_photo.phase,
          kind:row.fbm_photo.kind,createdAt:row.fbm_photo.capturedAt || row.created_at});
        if (!data || data.length < pageSize) return rows;
      }
    }
    async function open(source,expected,part,id) {
      session(source,expected);
      if (!UUID.test(id)) throw new Error('Photo inconnue.');
      const {data:doc,error} = await documentQuery(part,'storage_path').eq('id',id).maybeSingle();
      session(source,expected);
      if (error || !doc?.storage_path) throw new Error(error ? reason(error) : 'Photo indisponible pour ce support.');
      const signed = await db.storage.from('chantier-documents').createSignedUrl(doc.storage_path,600);
      session(source,expected);
      if (signed.error || !signed.data?.signedUrl) throw new Error(reason(signed.error));
      return signed.data.signedUrl;
    }

    const api = {context(source,part) {
      session(source,token);
      if (part) checkRoute(part);
      return token;
    },siteName(source,expected) { session(source,expected); return site.name; },save,list,open};
    window.JDCFBMPhotos = api;
    window.addEventListener('online',retry);
    retry();
    return {retry, close() {
      closed = true;
      window.removeEventListener('online',retry);
      if (window.JDCFBMPhotos === api) delete window.JDCFBMPhotos;
    }};
  }
  window.JDCFBMPhotoArchive = {attach};
})();
