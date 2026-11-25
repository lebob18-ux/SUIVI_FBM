/* Pont FBM ↔ Journal de chantier. Ne modifie pas la base ni le client Supabase FBM. */
(() => {
  'use strict';
  const params = new URLSearchParams(location.search);
  const token = params.get('journal_session');
  const origin = params.get('journal_origin');
  const integrated = Boolean(token && origin === location.origin && window.parent !== window);
  if (!integrated) return;
  let journalContext = null;
  let active = null;
  let restoreSequence = 0;
  let saveTimer = null;
  const pending = new Map();
  const scopedPrefix = 'fbm_journal_v2_';

  function scope() {
    if (!journalContext?.userId || !journalContext?.chantier?.id) return null;
    return {userId: String(journalContext.userId), siteId: String(journalContext.chantier.id)};
  }
  function selects() {
    return {
      fbmChantier: String(document.getElementById('selectChantier')?.value || '').trim(),
      fbmSupport: String(document.getElementById('selectSupport')?.value || '').trim()
    };
  }
  function same(a, b) {
    return Boolean(a && b && a.fbmChantier === b.fbmChantier && a.fbmSupport === b.fbmSupport);
  }
  function key(part) {
    const s = scope();
    if (!s || !part?.fbmChantier || !part?.fbmSupport) return null;
    return scopedPrefix + [s.siteId, s.userId, part.fbmChantier, part.fbmSupport]
      .map(encodeURIComponent).join('_');
  }
  function status(message, error = false) {
    const el = document.getElementById('fbmOfflineStatus');
    if (!el) return;
    el.style.display = 'block';
    el.style.background = error ? '#fff3cd' : '#d1e7dd';
    el.style.color = error ? '#856404' : '#0f5132';
    el.textContent = message;
  }
  function capture(part = active) {
    if (!key(part)) return null;
    const page = document.getElementById('fbmPage');
    if (!page) return null;
    const fields = {};
    page.querySelectorAll('input[id], select[id], textarea[id]').forEach(el => {
      if (!el.id || el.id === 'selectChantier' || el.id === 'selectSupport' ||
          el.readOnly || el.disabled || el.type === 'password' || el.type === 'file') return;
      if (el.type === 'checkbox' || el.type === 'radio') {
        fields[el.id] = {kind: el.type, checked: Boolean(el.checked)};
      } else {
        fields[el.id] = {kind: 'value', value: el.value};
      }
    });
    return {
      version: 2, fbmChantier: part.fbmChantier, fbmSupport: part.fbmSupport,
      fields, bls: typeof blsActuels !== 'undefined' && Array.isArray(blsActuels)
        ? JSON.parse(JSON.stringify(blsActuels)) : []
    };
  }
  function readStored(part) {
    try { const raw = key(part) && localStorage.getItem(key(part)); return raw ? JSON.parse(raw) : null; }
    catch (_) { return null; }
  }
  function saveLocal(part = active) {
    const payload = capture(part);
    if (!payload) return {ok: true, snapshot: null};
    try {
      const previous = readStored(part);
      const previousJson = previous?.payload ? JSON.stringify(previous.payload) : '';
      const changed = previousJson !== JSON.stringify(payload);
      const stored = {
        payload, dirty: Boolean(previous?.dirty || changed || !previous),
        cloudUpdatedAt: previous?.cloudUpdatedAt || null,
        editedAt: Date.now()
      };
      localStorage.setItem(key(part), JSON.stringify(stored));
      return {ok: true, snapshot: payload};
    } catch (error) {
      status('⚠️ Stockage local saturé : ' + String(error.message).slice(0, 100), true);
      return {ok: false, snapshot: payload};
    }
  }
  function applyPayload(payload) {
    if (!payload?.fields || typeof payload.fields !== 'object') return;
    for (const phase of ['fouille', 'beton', 'matage']) {
      const id = 'check_' + phase;
      const el = document.getElementById(id);
      const field = payload.fields[id];
      if (el && !el.disabled && field?.kind === 'checkbox') el.checked = Boolean(field.checked);
    }
    if (typeof synchroniserEtatDatesPhases === 'function') synchroniserEtatDatesPhases();
    for (const [id, field] of Object.entries(payload.fields)) {
      if (id === 'selectChantier' || id === 'selectSupport') continue;
      const el = document.getElementById(id);
      if (!el || el.readOnly || el.disabled) continue;
      if (field?.kind === 'checkbox' || field?.kind === 'radio') {
        el.checked = Boolean(field.checked);
      } else if (field?.kind === 'value' && field.value !== undefined) {
        el.value = field.value;
      }
    }
    if (Array.isArray(payload.bls) && typeof blsActuels !== 'undefined') {
      blsActuels = JSON.parse(JSON.stringify(payload.bls));
      if (typeof afficherBLs === 'function') afficherBLs();
      if (typeof sauvegarderBLs === 'function') sauvegarderBLs();
    }
    if (typeof refreshBlocs === 'function') refreshBlocs();
    if (typeof calculer === 'function') calculer();
    if (typeof mettreAJourBoutonsSupportsSidebar === 'function') mettreAJourBoutonsSupportsSidebar();
  }
  function call(type, extra, timeoutMs = 20000) {
    const id = crypto.randomUUID();
    return new Promise(resolve => {
      const timer = setTimeout(() => {pending.delete(id); resolve({ok:false,error:'Délai de synchronisation dépassé.'});}, timeoutMs);
      pending.set(id, result => {clearTimeout(timer);resolve(result)});
      window.parent.postMessage({type, token, id, ...extra}, origin);
    });
  }
  async function pushSnapshot(part, snapshot = null) {
    const stored = readStored(part);
    const payload = snapshot || stored?.payload;
    if (!payload) return {ok: false, error: 'Brouillon introuvable.'};
    const result = await call('jdc-fbm-draft-save', {...part, payload}, 30000);
    if (result.ok) {
      const latest = readStored(part);
      if (latest?.payload && JSON.stringify(latest.payload) === JSON.stringify(payload)) {
        try { localStorage.setItem(key(part), JSON.stringify({
          ...latest, dirty:false, cloudUpdatedAt: result.updatedAt || latest.cloudUpdatedAt
        })); } catch (_) { /* la sauvegarde serveur est déjà acquittée */ }
      }
      status('✓ FBM enregistré dans Journal de chantier');
    } else {
      status('📴 Sauvegarde locale conservée · Journal non synchronisé', true);
    }
    return result;
  }
  function schedulePush(part) {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {saveTimer = null; void pushSnapshot(part);}, 1800);
  }
  async function loadCloud(part, seq) {
    const result = await call('jdc-fbm-draft-load', part, 20000);
    if (!result.ok || !result.payload || seq !== restoreSequence || !same(active, part)) return;
    const local = readStored(part);
    // Un brouillon local jamais confirmé ne doit pas être remplacé par une copie serveur.
    if (local?.dirty) return;
    if (local?.cloudUpdatedAt && result.updatedAt &&
        Date.parse(result.updatedAt) <= Date.parse(local.cloudUpdatedAt)) return;
    try {
      applyPayload(result.payload);
      localStorage.setItem(key(part), JSON.stringify({
        payload: result.payload, dirty: false,
        cloudUpdatedAt: result.updatedAt, editedAt: Date.now()
      }));
      status('✓ Brouillon récupéré depuis Journal de chantier');
    } catch (error) {
      status('Brouillon serveur disponible, restauration locale incomplète.', true);
    }
  }
  function activate() {
    const selection = selects();
    const part = selection.fbmChantier && selection.fbmSupport ? selection : null;
    active = part;
    const seq = ++restoreSequence;
    if (!part || !scope()) return;
    const local = readStored(part);
    if (local?.payload) {
      applyPayload(local.payload);
      status(local.dirty ? '📴 Brouillon local à synchroniser' : '✓ Brouillon local restauré', Boolean(local.dirty));
      if (local.dirty) schedulePush(part);
    }
    void loadCloud(part, seq);
  }
  function commitBeforeSwitch() {
    if (!active) return;
    const previous = active;
    const saved = saveLocal(previous);
    if (saved.ok && saved.snapshot) {
      clearTimeout(saveTimer); saveTimer = null;
      void pushSnapshot(previous, saved.snapshot);
    }
  }
  let resetting = false;
  const originalChargerSupport = window.chargerSupport;
  if (typeof originalChargerSupport === 'function') {
    window.chargerSupport = function (...args) {
      if (!resetting) commitBeforeSwitch();
      const result = originalChargerSupport.apply(this, args);
      activate();
      return result;
    };
  }
  // Sur changement de chantier, FBM efface immédiatement les champs : on capture AVANT.
  document.addEventListener('change', event => {
    if (event.target?.id !== 'selectChantier') return;
    commitBeforeSwitch();
    active = null; ++restoreSequence;
  }, true);
  function editEvent(event) {
    if (!event.target?.closest?.('#fbmPage')) return;
    if (event.target.id === 'selectChantier' || event.target.id === 'selectSupport') return;
    if (!active || !same(active, selects())) return;
    const saved = saveLocal();
    if (saved.ok && saved.snapshot) schedulePush(active);
  }
  document.addEventListener('input', editEvent, true);
  document.addEventListener('change', editEvent, true);
  // Les BL peuvent être ajoutés/supprimés sans événement input sur leur tableau.
  for (const method of ['ajouterBL', 'supprimerBL', 'ajouterBLCarotte']) {
    const original = window[method];
    if (typeof original !== 'function') continue;
    window[method] = function (...args) {
      const part = active;
      const result = original.apply(this, args);
      const after = () => {
        if (part && same(active, part) && same(part, selects())) {
          const saved = saveLocal(part);
          if (saved.ok && saved.snapshot) schedulePush(part);
        }
      };
      if (result && typeof result.then === 'function') return result.then(value => {after(); return value;});
      after();
      return result;
    };
  }
  // Le bouton corbeille d'origine doit aussi effacer le brouillon serveur,
  // sinon l'ancienne saisie reviendrait automatiquement au prochain chargement.
  if (typeof window.resetSauvegardeSupport === 'function') {
    window.resetSauvegardeSupport = async function () {
      if (!active || !scope()) {
        alert('Sélectionnez d’abord un chantier et un support FBM.'); return;
      }
      const part = {...active};
      if (!await JournalDialogs.confirm('Réinitialiser les saisies de ce support sur cet appareil ET dans Journal de chantier ? Les PDF déjà archivés seront conservés.')) return;
      clearTimeout(saveTimer); saveTimer = null;
      const result = await call('jdc-fbm-draft-delete', part);
      if (!result.ok) {
        alert('Impossible de confirmer la suppression sur Journal : ' + result.error); return;
      }
      try {
        localStorage.removeItem(key(part));
        if (typeof cleAutosave === 'function' && cleAutosave()) localStorage.removeItem(cleAutosave());
      } catch (error) {
        alert('Suppression locale incomplète : ' + error.message); return;
      }
      resetting = true;
      try { if (typeof originalChargerSupport === 'function') originalChargerSupport(); }
      finally { resetting = false; }
      activate();
      status('Saisies FBM réinitialisées pour ce support.');
    };
  }
  const flushLocal = () => {if (active) saveLocal(active);};
  window.addEventListener('pagehide', flushLocal);
  document.addEventListener('visibilitychange', () => {if (document.hidden) flushLocal();});
  window.addEventListener('online', () => {
    if (active && readStored(active)?.dirty) schedulePush(active);
  });
  window.addEventListener('message', event => {
    if (event.origin !== origin || event.source !== window.parent || event.data?.token !== token) return;
    const d = event.data;
    if (d.type === 'jdc-fbm-context') {
      journalContext = {chantier: d.chantier, userId: d.userId};
      if (selects().fbmSupport) activate();
      return;
    }
    if (d.type === 'jdc-fbm-reply') {
      const cb = pending.get(d.id);
      if (cb) {pending.delete(d.id);cb(d);}
      return;
    }
    if (d.type === 'jdc-fbm-capture-before-close') {
      clearTimeout(saveTimer);saveTimer = null;
      const result = saveLocal();
      window.parent.postMessage({type:'jdc-fbm-close-capture',token,id:d.id,
        localOk:result.ok,snapshot:result.snapshot ? {...active,payload:result.snapshot} : null}, origin);
      return;
    }
  });
  async function persistBeforeArchive() {
    clearTimeout(saveTimer); saveTimer = null;
    const part = selects();
    if (!part.fbmChantier || !part.fbmSupport || !scope()) {
      return {ok:false, error:'Sélectionnez un chantier et un support FBM.'};
    }
    active = part;
    const captured = saveLocal(part);
    if (!captured.ok || !captured.snapshot) {
      return {ok:false, error:'Impossible de préserver les saisies locales.'};
    }
    return pushSnapshot(part, captured.snapshot);
  }
  window.JournalFBMChild = {
    integrated: true, getScope: scope,
    persistBeforeArchive,
    archive(blob, filename) {return call('jdc-fbm-pdf', {blob, filename}, 120000);},
    requestClose() {window.parent.postMessage({type:'jdc-fbm-close',token}, origin);}
  };
  window.parent.postMessage({type:'jdc-fbm-ready', token}, origin);
})();
