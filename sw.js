const CACHE = "fbm-v1";
const FICHIERS = [
  "./", "./index.html", "./style.css",
  "./data.js", "./bl-liste.js", "./email-liste.js",
  "./js/state.js", "./js/ui-sections.js", "./js/calculs.js",
  "./js/chantiers-supports.js", "./js/echantillon-modal.js",
  "./js/partage.js", "./js/pdf-export.js", "./js/pdf-recap.js",
  "./js/bl-beton.js", "./js/autosave.js", "./js/identite.js",
  "./js/rj.js", "./js/recap.js", "./js/ui-events.js",
  "./js/ainm.js", "./js/partage-pdf.js",
  "./assets/logo.svg", "./assets/ainm.svg"
];

self.addEventListener("install", e => {
  e.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(FICHIERS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", e => {
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request))
  );
});
