self.addEventListener('install', (e) => {
  self.skipWaiting();
});

self.addEventListener('fetch', (e) => {
  // Laisse l'application fonctionner normalement en allant chercher sur le réseau
  e.respondWith(fetch(e.request).catch(() => caches.match(e.request)));
});