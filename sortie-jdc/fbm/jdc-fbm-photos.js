/* Photos de la fiche FBM, lorsque celle-ci est ouverte depuis Journal de chantier. */
(() => {
  'use strict';
  const query = new URLSearchParams(location.search);
  if (window === window.parent || !query.get('journal_session') || query.get('journal_origin') !== location.origin) return;

  const byId = id => document.getElementById(id);
  const value = id => String(byId(id)?.value ?? '').trim();
  const phases = { fouille: 'Fouille', beton: 'Béton', matage: 'Matage' };
  const sections = [
    ['fouille', '', 'bloc-date-fouille'], ['beton', 'massif', 'bloc-date-beton'],
    ['matage', '', 'bloc-date-matage'], ['beton', 'carotte', 'slump-alerte-carotte']
  ];
  function readSupport() {
    const chantier = value('selectChantier');
    const support = value('selectSupport');
    if (!chantier || !support) throw new Error('Choisissez le chantier et le support dans la fiche FBM.');
    const row = typeof baseSupports === 'undefined' ? null : baseSupports.find(item =>
      String(item.chantier ?? item.CHANTIER).trim() === chantier && String(item.support ?? item.SUPPORT).trim() === support
    );
    return {
      chantier, support, supportId: row?.id == null ? '' : String(row.id),
      installation: String(row?.installation || row?.INSTALLATION || row?.TYPE || '').trim(),
      rj: String(window.numeroRJ || '').trim()
    };
  }
  function readDeliveries(destination) {
    const carotte = destination === 'carotte';
    const saved = typeof blsActuels === 'undefined' || !Array.isArray(blsActuels) ? [] : blsActuels;
    const deliveries = new Map();
    for (const item of saved) {
      const number = String(item?.bl || '').trim();
      if (!number || (item.destination === 'carotte') !== carotte) continue;
      deliveries.set(number, {
        bl: number, slump: item.slump ?? '', classeSlump: item.classe_slump || '',
        pourDate: String(item.date_coulage || '').slice(0,10)
      });
    }
    const bl = value(carotte ? 'bl_beton_carotte' : 'bl_beton');
    if (!bl) return {deliveries, selected: deliveries.size === 1 ? deliveries.keys().next().value : ''};
    const existing = deliveries.get(bl);
    const slump = value(carotte ? 'slump-input-carotte' : 'slump-input');
    const classe = carotte
      ? (typeof classeSlumpCarotteActuelle === 'undefined' ? '' : classeSlumpCarotteActuelle)
      : (typeof classeSlumpActuelle === 'undefined' ? '' : classeSlumpActuelle);
    deliveries.set(bl, {
      bl, slump: slump || (existing?.slump ?? ''),
      classeSlump: slump ? classe : existing?.classeSlump || classe,
      pourDate: (carotte && value('date-coulage-bl-carotte')) || existing?.pourDate || ''
    });
    return {deliveries, selected: bl};
  }
  function buildDialog() {
    const dialog = document.createElement('dialog');
    dialog.id = 'jdc-fbm-photo-dialog';
    dialog.className = 'jdc-fbm-photo-dialog';
    dialog.setAttribute('aria-labelledby', 'jdc-fbm-photo-title');
    dialog.innerHTML = `
      <h2 id="jdc-fbm-photo-title">Ajouter une photo</h2>
      <p data-selection></p>
      <p data-journal-site></p>
      <label data-kind>Photo de
        <select name="kind"><option value="phase">La phase béton</option><option value="bl">Bon de livraison</option><option value="slump">Essai de slump</option></select>
      </label>
      <label data-delivery>Bon de livraison <select name="delivery"></select></label>
      <p data-help></p>
      <div data-actions>
        <button type="button" data-pick="camera">Prendre une photo</button>
        <button type="button" data-pick="gallery">Choisir une photo</button>
      </div>
      <input type="file" accept="image/*" capture="environment" data-fbm-input="camera" hidden>
      <input type="file" accept="image/jpeg,image/png,image/webp,image/avif,image/heic,image/heif,.jpg,.jpeg,.png,.webp,.avif,.heic,.heif" data-fbm-input="gallery" hidden>
      <p role="status" aria-live="polite"></p>
      <button type="button" data-retry hidden>Réessayer l’enregistrement</button>
      <button type="button" data-close>Fermer</button>`;
    const style = document.createElement('style');
    style.textContent = `
      .jdc-fbm-photo-open{display:block;background:white;color:#672364;border:1px solid #c89fc9;border-radius:6px;padding:7px 12px;margin:5px 0 8px;font-size:.86rem;min-height:40px}
      .jdc-fbm-photo-dialog{box-sizing:border-box;width:min(92vw,390px);max-height:88dvh;overflow:auto;margin:auto;padding:18px;border:1px solid #d9c7d9;border-radius:12px;background:white;color:#27212a;text-align:left;font:16px system-ui,sans-serif}
      .jdc-fbm-photo-dialog::backdrop{background:rgba(0,0,0,.55)}
      .jdc-fbm-photo-dialog h2{font:700 1.17rem system-ui,sans-serif;margin:0 0 6px}
      .jdc-fbm-photo-dialog p{margin:7px 0 12px;overflow-wrap:anywhere;font-size:.89rem}
      .jdc-fbm-photo-dialog label{display:block;margin:8px 0;color:#453648;font-size:.9rem}
      .jdc-fbm-photo-dialog select{display:block;width:100%;height:40px;margin:4px 0}
      .jdc-fbm-photo-dialog button{min-height:42px;width:100%;margin:3px 0;padding:8px;border:1px solid #bcaabc;border-radius:7px;background:#faf7fa;color:#472044;font:bold .9rem system-ui,sans-serif}
      .jdc-fbm-photo-dialog button[data-pick="camera"]{background:#702269;color:white}
      .jdc-fbm-photo-dialog button:disabled{opacity:.55}
      .jdc-fbm-photo-dialog [hidden]{display:none!important}
      .jdc-fbm-photo-dialog p:empty{display:none}`;
    document.head.append(style);
    document.body.append(dialog);
    return dialog;
  }

  function mountSupportGallery() {
    const anchor = byId('selectSupport')?.closest('.header-row');
    if (!anchor) return;
    const trigger = document.createElement('button');
    trigger.type = 'button';
    trigger.className = 'jdc-fbm-photo-open';
    trigger.dataset.fbmPhotoList = '';
    trigger.textContent = 'Voir les photos du support';
    anchor.after(trigger);

    const dialog = document.createElement('dialog');
    dialog.id = 'jdc-fbm-support-gallery';
    dialog.className = 'jdc-fbm-photo-dialog';
    dialog.setAttribute('aria-labelledby', 'jdc-fbm-gallery-title');
    dialog.innerHTML = `
      <h2 id="jdc-fbm-gallery-title">Photos du support</h2>
      <p data-selection></p><p role="status" aria-live="polite"></p>
      <div data-preview></div><div data-list></div><button type="button" data-close>Fermer</button>`;
    document.body.append(dialog);
    const status = dialog.querySelector('[role="status"]');
    const preview = dialog.querySelector('[data-preview]');
    const list = dialog.querySelector('[data-list]');
    let sequence = 0;
    let previewSequence = 0;
    function close() {
      ++sequence;
      dialog.close();
      preview.replaceChildren();
      list.replaceChildren();
    }
    dialog.querySelector('[data-close]').addEventListener('click', close);
    dialog.addEventListener('cancel', event => { event.preventDefault(); close(); });
    trigger.addEventListener('click', async () => {
      const opening = ++sequence;
      try {
        const support = readSupport();
        const bridge = window.parent.JDCFBMPhotos;
        if (!bridge) throw new Error('Rouvrez FBM depuis le Journal de chantier mis à jour.');
        const token = bridge.context(window);
        dialog.querySelector('[data-selection]').textContent = support.chantier + ' · Support ' + support.support;
        status.textContent = 'Recherche dans les documents du chantier…';
        dialog.showModal();
        const photos = await bridge.list(window, token, support);
        if (opening !== sequence) return;
        status.textContent = photos.length ? '' : 'Aucune photo archivée pour ce support.';
        for (const photo of photos) {
          const button = document.createElement('button');
          button.type = 'button';
          button.textContent = photo.name;
          button.style.cssText = 'overflow-wrap:anywhere;text-align:left';
          list.append(button);
          button.addEventListener('click', async () => {
            const current = ++previewSequence;
            preview.replaceChildren();
            status.textContent = 'Ouverture de la photo…';
            try {
              const url = await bridge.open(window, token, support, photo.id);
              if (opening !== sequence || current !== previewSequence) return;
              const image = document.createElement('img');
              image.alt = photo.name;
              image.style.cssText = 'display:block;width:100%;max-height:55vh;object-fit:contain';
              image.referrerPolicy = 'no-referrer';
              image.addEventListener('error', () => {
                if (opening === sequence && current === previewSequence) {
                  image.hidden = true;
                  status.textContent = 'Aperçu indisponible. Ouvrez la photo originale.';
                }
              });
              image.src = url;
              const link = document.createElement('a');
              link.href = url;
              link.target = '_blank';
              link.rel = 'noopener noreferrer';
              link.textContent = 'Ouvrir la photo originale';
              preview.append(image, link);
              status.textContent = '';
              dialog.scrollTop = 0;
            } catch (error) {
              if (opening === sequence && current === previewSequence) status.textContent = error.message || 'Photo indisponible.';
            }
          });
        }
      } catch (error) {
        if (opening !== sequence) return;
        if (dialog.open) status.textContent = error.message || 'Consultation des photos indisponible.';
        else window.alert(error.message);
      }
    });
  }

  function init() {
    if (byId('jdc-fbm-photo-dialog')) return;
    const dialog = buildDialog();
    mountSupportGallery();
    const el = selector => dialog.querySelector(selector);
    const kind = el('[name="kind"]');
    const delivery = el('[name="delivery"]');
    const status = el('[role="status"]');
    const retry = el('[data-retry]');
    let session;
    let pending;
    let saving = false;
    let chosenMeta;

    function refresh() {
      const needsBL = session.phase === 'beton' && kind.value !== 'phase';
      el('[data-kind]').hidden = session.phase !== 'beton';
      el('[data-delivery]').hidden = !needsBL;
      const missingBL = needsBL && !delivery.value;
      el('[data-help]').textContent = missingBL
        ? (session.deliveries.size ? 'Choisissez le bon associé à cette photo.' : 'Renseignez le numéro de BL dans la fiche, puis rouvrez les photos.') : '';
      for (const button of dialog.querySelectorAll('[data-pick]')) button.disabled = missingBL || saving || !!pending;
      kind.disabled = delivery.disabled = saving || !!pending;
      retry.hidden = !pending || saving;
      el('[data-close]').disabled = saving;
    }
    function open(phase, destination) {
      try {
        const bridge = window.parent.JDCFBMPhotos;
        if (!bridge) throw new Error('Rouvrez FBM depuis le Journal de chantier mis à jour.');
        const support = readSupport();
        const token = bridge.context(window, support);
        if (!token) throw new Error('Rouvrez FBM depuis le chantier à documenter dans le Journal.');
        const choices = phase === 'beton' ? readDeliveries(destination) : {deliveries:new Map(), selected:''};
        session = {
          ...support, token, phase, destination, deliveries: choices.deliveries,
          phaseDate: value('date_saisie_' + phase),
          carotteDate: destination === 'carotte' ? value('date-coulage-bl-carotte') : ''
        };
        kind.value = 'phase';
        delivery.replaceChildren(new Option('Choisir un BL', ''));
        for (const number of session.deliveries.keys()) delivery.add(new Option(number, number));
        delivery.value = choices.selected;
        el('[data-journal-site]').textContent = 'Archivage JDC · ' + bridge.siteName(window, token);
        el('[data-selection]').textContent = ['Fiche FBM · ' + support.chantier, 'Support ' + support.support,
          phases[phase] + (destination === 'carotte' ? ' · Carotte' : ''),
          session.phaseDate ? session.phaseDate.split('-').reverse().join('/') : ''
        ].filter(Boolean).join(' · ');
        status.textContent = '';
        pending = chosenMeta = null;
        refresh();
        dialog.showModal();
      } catch (error) { window.alert(error.message); }
    }
    function snapshot(timeSource) {
      if (value('selectSupport') !== session.support || value('selectChantier') !== session.chantier)
        throw new Error('La sélection FBM a changé. Fermez cette fenêtre et rouvrez-la depuis le support souhaité.');
      const {chantier, support, supportId, installation, rj, destination, phase, phaseDate} = session;
      const item = kind.value === 'phase' ? null : session.deliveries.get(delivery.value);
      if (kind.value !== 'phase' && !item) throw new Error('Choisissez le bon de livraison.');
      return {
        chantier, support, supportId, installation, rj, destination, phase, phaseDate, kind: kind.value,
        bl: item?.bl || '', slump: item?.slump ?? '', classeSlump: item?.classeSlump || '',
        pourDate: item?.pourDate || session.carotteDate, timeSource
      };
    }
    async function save() {
      if (saving || !pending) return;
      saving = true;
      refresh();
      status.textContent = 'Enregistrement dans Journal de chantier…';
      try {
        const result = await window.parent.JDCFBMPhotos.save(window, session.token, pending.meta, pending.file);
        if (!['saved', 'pending'].includes(result?.status)) throw new Error('Le Journal n’a pas confirmé la réception.');
        status.textContent = (result.status === 'pending'
          ? 'Photo conservée sur cet appareil, en attente de synchronisation.'
          : 'Photo archivée ' + (result.savedTo ? 'dans ' + result.savedTo : 'dans les documents du chantier') + '.')
          + (result.name ? ' ' + result.name : '') + (result.reason ? ' ' + result.reason : '');
        pending = null;
      } catch (error) {
        status.textContent = 'Archivage non confirmé. ' + (error.message || 'Gardez cette fenêtre ouverte pour réessayer.');
      } finally {
        saving = false;
        refresh();
      }
    }
    for (const button of dialog.querySelectorAll('[data-pick]')) {
      const source = button.dataset.pick;
      const timeSource = source === 'gallery' ? 'import' : 'camera';
      const input = el('[data-fbm-input="' + source + '"]');
      button.addEventListener('click', () => {
        try {
          chosenMeta = snapshot(timeSource);
          input.click();
        } catch (error) { status.textContent = error.message; }
      });
      input.addEventListener('cancel', () => { chosenMeta = null; });
      input.addEventListener('change', () => {
        const file = input.files[0];
        input.value = '';
        if (!file || saving || pending) return;
        try {
          const meta = chosenMeta || snapshot(timeSource);
          chosenMeta = null;
          if (meta.timeSource !== timeSource) throw new Error('Choisissez de nouveau la photo.');
          pending = {file, meta:{...meta, id:crypto.randomUUID(), capturedAt:new Date().toISOString()}};
          void save();
        } catch (error) { status.textContent = error.message; }
      });
    }
    kind.addEventListener('change', refresh);
    delivery.addEventListener('change', refresh);
    retry.addEventListener('click', save);
    function close() {
      if (saving || (pending && !window.confirm('Quitter sans confirmation d’archivage pour cette photo ?'))) return;
      dialog.close();
      pending = chosenMeta = session = null;
    }
    el('[data-close]').addEventListener('click', close);
    dialog.addEventListener('cancel', event => { event.preventDefault(); close(); });
    for (const [phase, destination, anchorId] of sections) {
      const anchor = byId(anchorId);
      if (!anchor) continue;
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'jdc-fbm-photo-open';
      button.dataset.fbmPhotoPhase = phase;
      button.dataset.fbmPhotoDestination = destination;
      button.textContent = destination === 'carotte' ? 'Photos carotte, BL et slump'
        : phase === 'beton' ? 'Photos béton, BL et slump' : 'Photo de ' + phases[phase].toLowerCase();
      button.addEventListener('click', () => open(phase, destination));
      anchor.after(button);
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, {once:true});
  else init();
})();
