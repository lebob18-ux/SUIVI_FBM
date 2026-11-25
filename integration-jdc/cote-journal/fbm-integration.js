/* Journal de chantier ↔ FBM. Aucune connexion au projet Supabase du collègue
   n'est créée ici : cette passerelle utilise uniquement la session JDC. */
(() => {
  'use strict';
  const MAX_DRAFT_CHARS = 150000;
  const MAX_PDF_BYTES = 48 * 1024 * 1024;
  function safeFilename(name) {
    return (String(name || 'Rapport_FBM.pdf')
      .replace(/[\\/\x00-\x1f]/g, '_').slice(0, 175).replace(/\.pdf$/i, '') + '.pdf');
  }
  function readableError(error) {
    return String(error?.message || error || 'Enregistrement indisponible').slice(0, 250);
  }
  function getKey(data) {
    const source = String(data?.fbmChantier || '').trim();
    const support = String(data?.fbmSupport || '').trim();
    if (!source || !support || source.length > 180 || support.length > 180) {
      throw new Error('Sélectionnez un chantier et un support dans FBM.');
    }
    return {source, support};
  }
  function withTimeout(promise, ms, label) {
    let timer;
    const timeout = new Promise((_, reject) => {
      timer = setTimeout(() => reject(new Error(label + ' : délai dépassé.')), ms);
    });
    return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
  }
  async function sha256(blob) {
    const digest = await crypto.subtle.digest('SHA-256', await blob.arrayBuffer());
    return [...new Uint8Array(digest)].map(v => v.toString(16).padStart(2, '0')).join('');
  }

  window.JournalFBM = {
    open(adapter) {
      if (document.querySelector('[data-jdc-fbm-overlay]')) return;
      const current = adapter.context();
      if (!current.ready || !current.userId || !current.chantier || !current.db) {
        adapter.toast('Connectez-vous et sélectionnez un chantier.', 'warning');
        return;
      }
      const userId = current.userId;
      const db = current.db;
      const site = {id: current.chantier.id, name: current.chantier.name};
      const token = crypto.randomUUID();
      const valid = () => {
        const c = adapter.context();
        return Boolean(c.ready && c.db === db && c.userId === userId && c.chantier?.id === site.id);
      };
      const overlay = document.createElement('section');
      overlay.dataset.jdcFbmOverlay = '';
      overlay.setAttribute('role', 'dialog');
      overlay.setAttribute('aria-label', 'Formulaire FBM intégré');
      overlay.style.cssText = 'position:fixed;inset:0;z-index:100000;background:white;display:flex;flex-direction:column';
      const iphonePwa = /iPhone|iPod/i.test(navigator.userAgent || '') &&
        (navigator.standalone === true || Boolean(window.matchMedia?.('(display-mode: standalone)')?.matches));
      const bar = document.createElement('header');
      bar.style.cssText = 'background:#173a50;color:white;padding:10px 12px;display:flex;align-items:center;gap:12px;flex-wrap:wrap;box-shadow:0 2px 8px #0002';
      if (iphonePwa) {
        // The translucent iOS status bar sits ABOVE fixed full-screen overlays.
        // env(safe-area-inset-top) can report 0 in an installed PWA iframe context.
        bar.style.paddingTop = 'max(64px, calc(env(safe-area-inset-top, 0px) + 12px))';
        bar.style.flexDirection = 'column';
        bar.style.alignItems = 'stretch';
        bar.style.flexWrap = 'nowrap';
      }
      const leave = document.createElement('button');
      leave.type = 'button';
      leave.textContent = '← Retourner au Journal de chantier';
      leave.style.cssText = 'padding:14px 18px;min-height:54px;border:2px solid #fff;background:#fff;color:#173a50;font-size:16px;font-weight:800;border-radius:10px;cursor:pointer;flex:0 1 auto';
      if (iphonePwa) {
        leave.style.width = '100%';
        leave.style.maxWidth = '100%';
        leave.style.whiteSpace = 'normal';
        leave.style.lineHeight = '1.3';
        leave.style.textAlign = 'center';
      }
      const status = document.createElement('span');
      status.setAttribute('role', 'status');
      status.style.cssText = 'font-size:13px;line-height:1.4;flex:1;min-width:140px';
      if (iphonePwa) status.style.minWidth = '0';
      status.textContent = 'FBM · ' + site.name + ' · sauvegarde en attente';
      bar.append(leave, status);
      const frame = document.createElement('iframe');
      frame.title = 'Saisie FBM - ' + site.name;
      frame.style.cssText = 'width:100%;flex:1;min-height:0;border:0;background:white';
      const url = new URL('./fbm/index.html', location.href);
      url.searchParams.set('journal_session', token);
      url.searchParams.set('journal_origin', location.origin);
      frame.src = url.href;
      overlay.append(bar, frame);
      document.body.append(overlay);

      let closing = false;
      let archiving = false;
      let saveQueue = Promise.resolve();
      const responses = new Map();
      let pendingClose = null;
      const send = message => {
        if (frame.contentWindow) frame.contentWindow.postMessage({...message, token}, location.origin);
      };
      const setStatus = message => { status.textContent = 'FBM · ' + site.name + ' · ' + message; };
      const reply = (id, result) => send({type: 'jdc-fbm-reply', id, ...result});
      const photoRetry = document.createElement('button');
      photoRetry.type = 'button'; photoRetry.textContent = 'Renvoyer les photos en attente';
      photoRetry.hidden = true;
      const photoStatus = document.createElement('span');
      photoStatus.setAttribute('role', 'status'); photoStatus.hidden = true;
      photoStatus.style.cssText = 'font-size:13px;overflow-wrap:anywhere';
      bar.append(photoStatus, photoRetry);
      const photos = window.JDCFBMPhotoArchive?.attach({
        frame, token, site, userId, db, valid, refresh: adapter.refresh,
        notify(message, pending) {
          photoStatus.hidden = false; photoStatus.textContent = message;
          photoRetry.hidden = !pending;
        }
      });
      photoRetry.addEventListener('click', () => photos?.retry());
      const cleanup = () => {
        photos?.close();
        window.removeEventListener('message', onMessage);
        overlay.remove();
      };
      const saveDraft = async data => {
        if (!valid()) throw new Error('Le compte ou le chantier Journal a changé.');
        const {source, support} = getKey(data);
        if (!data.payload || typeof data.payload !== 'object' || Array.isArray(data.payload)) {
          throw new Error('Brouillon FBM invalide.');
        }
        const serialized = JSON.stringify(data.payload);
        if (!serialized || serialized.length > MAX_DRAFT_CHARS) throw new Error('Brouillon trop volumineux.');
        const {data: saved, error} = await withTimeout(db.rpc('save_journal_fbm_draft', {
          p_chantier_id: site.id, p_fbm_chantier: source,
          p_fbm_support: support, p_payload: data.payload
        }), 15000, 'Enregistrement Journal');
        if (error) throw error;
        return {updatedAt: saved?.updated_at || null};
      };
      const queueDraft = data => {
        const work = saveQueue.catch(() => {}).then(() => saveDraft(data));
        saveQueue = work;
        return work;
      };
      async function archivePdf(data) {
        if (!valid()) throw new Error('Le compte ou le chantier Journal a changé.');
        if (archiving) throw new Error('Un archivage FBM est déjà en cours.');
        archiving = true; leave.disabled = true; setStatus('Archivage PDF en cours…');
        try {
          const blob = data.blob;
          // Un Blob créé dans une iframe peut provenir d'un autre realm JS.
          // Valider son contenu au lieu d'un instanceof dépendant du realm.
          if (!blob || typeof blob.arrayBuffer !== 'function' ||
              typeof blob.slice !== 'function' ||
              blob.type !== 'application/pdf' ||
              blob.size < 5 || blob.size > MAX_PDF_BYTES ||
              await blob.slice(0, 5).text() !== '%PDF-') {
            throw new Error('Fichier PDF FBM invalide.');
          }
          // Ne finaliser qu'après l'acquittement des brouillons déjà en cours.
          await saveQueue;
          const hash = await sha256(blob);
          const {data: reserved, error: reserveError} = await db.rpc('reserve_journal_fbm', {
            p_chantier_id: site.id, p_sha256: hash,
            p_file_name: safeFilename(data.filename), p_bytes: blob.size
          });
          if (reserveError) throw reserveError;
          if (!reserved?.id || !reserved.storage_path || !valid()) throw new Error('Réservation invalide.');
          const {error: uploadError} = await db.storage.from('chantier-documents').upload(
            reserved.storage_path, blob, {contentType: 'application/pdf', upsert: false}
          );
          const duplicate = uploadError && (/409/.test(String(uploadError.statusCode || uploadError.code)) ||
            /resourcealreadyexists|already exists|duplicate/i.test(String(uploadError.message)));
          if (uploadError && !duplicate) throw uploadError;
          const {data: document, error: finalizeError} = await db.rpc('finalize_journal_fbm', {
            p_upload_id: reserved.id
          });
          if (finalizeError) throw finalizeError;
          setStatus('PDF enregistré dans Documents › FBM et publié dans le fil ✓');
          Promise.resolve().then(() => adapter.refresh()).catch(() => {});
          if (!document?.id || document.chantier_id !== site.id) {
            throw new Error('Archivage PDF non confirmé pour ce chantier.');
          }
          return {ok: true, documentId: document.id, savedTo: 'Documents / FBM', feed: true};
        } finally {
          archiving = false; leave.disabled = closing;
        }
      }
      function requestClose() {
        if (closing || archiving) return;
        // The photo dialog handles in-flight captures and unconfirmed local copies.
        const photoDialog = frame.contentDocument?.getElementById('jdc-fbm-photo-dialog');
        if (photoDialog?.open) {
          photoDialog.querySelector('[data-close]')?.click();
          if (photoDialog.open) return;
        }
        closing = true; leave.disabled = true; setStatus('Sauvegarde du formulaire avant retour…');
        const id = crypto.randomUUID();
        pendingClose = {id, timeout: setTimeout(() => {
          if (pendingClose?.id !== id) return;
          pendingClose = null; closing = false; leave.disabled = false;
          setStatus('Pas de confirmation de sauvegarde. Réessayez.');
        }, 12000)};
        send({type: 'jdc-fbm-capture-before-close', id});
      }
      leave.addEventListener('click', requestClose);
      async function onMessage(event) {
        const d = event.data;
        if (event.origin !== location.origin || event.source !== frame.contentWindow ||
            !d || d.token !== token || typeof d.type !== 'string') return;
        if (d.type === 'jdc-fbm-ready') {
          if (valid()) send({type: 'jdc-fbm-context', chantier: site, userId});
          return;
        }
        if (d.type === 'jdc-fbm-close') { requestClose(); return; }
        if (d.type === 'jdc-fbm-close-capture') {
          if (!pendingClose || d.id !== pendingClose.id) return;
          clearTimeout(pendingClose.timeout); pendingClose = null;
          if (!d.localOk) {
            setStatus('La sauvegarde locale a échoué. Corrigez le problème avant de quitter.');
            closing = false; leave.disabled = false; return;
          }
          if (!d.snapshot) { cleanup(); return; }
          try {
            await queueDraft(d.snapshot);
            setStatus('Sauvegardé dans Journal de chantier ✓');
            send({type: 'jdc-fbm-close-ok'});
            cleanup();
          } catch (error) {
            setStatus('Sauvegarde Journal non confirmée : ' + readableError(error));
            closing = false; leave.disabled = false;
            // L'utilisateur peut décider de quitter avec le brouillon local,
            // mais l'interface n'affirme jamais qu'il est archivé sur Supabase.
            if (await window.JournalDialogs.confirm('La sauvegarde sur Journal de chantier n’a pas été confirmée. Les données sont conservées localement sur cet appareil. Retourner au Journal quand même ?', {title:'Sauvegarde non confirmée',accept:'Retourner au Journal'})) cleanup();
          }
          return;
        }
        if (d.type === 'jdc-fbm-draft-delete') {
          if (!d.id) return;
          try {
            if (!valid()) throw new Error('Session Journal interrompue.');
            const {source, support} = getKey(d);
            await saveQueue.catch(() => {});
            const {error} = await db.rpc('delete_journal_fbm_draft', {
              p_chantier_id: site.id, p_fbm_chantier: source, p_fbm_support: support
            });
            if (error) throw error;
            setStatus('Brouillon de ce support réinitialisé');
            reply(d.id, {ok:true});
          } catch (error) { reply(d.id, {ok:false,error:readableError(error)}); }
          return;
        }
        if (d.type === 'jdc-fbm-draft-save') {
          if (!d.id) return;
          try {
            const result = await queueDraft(d);
            setStatus('Brouillon sauvegardé dans Journal ✓');
            reply(d.id, {ok: true, ...result});
          } catch (error) {
            setStatus('Sauvegarde Journal en attente · copie locale conservée');
            reply(d.id, {ok: false, error: readableError(error)});
          }
          return;
        }
        if (d.type === 'jdc-fbm-draft-load') {
          if (!d.id) return;
          try {
            if (!valid()) throw new Error('Session Journal interrompue.');
            const {source, support} = getKey(d);
            const {data: row, error} = await db.from('journal_fbm_drafts')
              .select('payload,updated_at')
              .eq('chantier_id', site.id).eq('user_id', userId)
              .eq('fbm_chantier', source).eq('fbm_support', support).maybeSingle();
            if (error) throw error;
            reply(d.id, {ok: true, payload: row?.payload || null, updatedAt: row?.updated_at || null});
          } catch (error) {
            reply(d.id, {ok: false, error: readableError(error)});
          }
          return;
        }
        if (d.type === 'jdc-fbm-pdf') {
          if (!d.id) return;
          if (responses.has(d.id)) {reply(d.id, responses.get(d.id)); return;}
          try {
            const result = await archivePdf(d);
            responses.set(d.id, result); reply(d.id, result);
          } catch (error) {
            setStatus('PDF non archivé · téléchargement de secours disponible');
            reply(d.id, {ok: false, error: readableError(error)});
          }
        }
      }
      window.addEventListener('message', onMessage);
    }
  };
})();
