/* Cache statique de ce module Journal de chantier. Les octets proviennent du manifeste de la livraison. */
const OWN = 'jdc-module-securise:' + self.registration.scope + ':';
const CACHE = OWN + '16.4.16-fbm-photos';
const ASSETS = {
  "../briefing/vendor/jspdf.umd.min.js": "e6551fcdc32f09d6853b2c5126d18d01d9447e0da618a41a11ebeee0f6c20d54",
  "../config.js": "fc074ca402cd9722179dab2078cb71b222badba494cd7382d3b83a16ce1f5aa9",
  "assets/ainm.svg": "74e6521e23a06be59c8da4822274284f3060cb1419e9b4e246622284c0bd2e66",
  "assets/icon-192.png": "cf85b31812eb071a42b44a60d8963da2812400d51713717328643e36ded5f88b",
  "assets/icon-512.png": "d234c628efc43e1a8e614416d7ac5fbba70a1e2f77621a05b0fde14be2017ad9",
  "assets/logo.svg": "05b58d1a07aa7fc42eab5053ada3857524f890248978c02502dc4f9afacfbf10",
  "index.html": "92445d69149752c31f2485a66f752f789a5f3f8f69d56938b526fc94603d213b",
  "iphone-layout-v1614.css": "7db96329aa5f23dc5dcfdcad383b8a77b51252d0ba1ff5157d33cf26a916ce4c",
  "journal-bridge.js": "1aa977a3273292de8b3144c884aa731d2cd11c4d37689837d48a11bfd3cbf8e2",
  "manifest.json": "238009a98e252c279505e9d5228ae3a0ae464226e287ee181344ca66df010f17",
  "../journal-dialogs.js": "e5a656eec13e839db0cfe3ab7a410ebfdc308aac8eccfeef198b54609546704c",
  "../supabase.js": "04b957f2563a40dcb02b1d9d6f7a7a23973bf8ebe4c1435be5feaf24bff91134",
  "../vendor/jdc-securite/autotable-5.0.9.min.js": "83dd8e5ae29436bd3d3ef4f4a915125b3951264994c25de0359d3fbd105abe15",
  "../vendor/jdc-securite/identite-modules.js": "1f18079eaee46aa5adea39d2e7c37cc8a6e067afc0f9c3c093337fc638c1519f",
  "../vendor/jdc-securite/jsqr-1.4.0.js": "bc40c8a15196236b2314db0856f72ca0b49980cd5413b8c852a7349f5fee0859",
  "jdc-fbm-photos.js": "f0bc4230d152f259e67f3bf26dc097d22ff09078e211cb8bf5868ea9d6a962be",
  "../journal-v154.css": "6b54e66238e1cde6d3bf7ed8366c73ddd5d4af439fc2d67be494b89c925551c7"
};
const SCOPE = new URL(self.registration.scope);
const FILES = new Map(Object.entries(ASSETS).map(([name, hash]) => [new URL(name, SCOPE).href, hash]));
const LEGACY = 'fbm-jdc-';
async function verified(url, hash) {
  const response = await fetch(new Request(url, {cache:'no-store', credentials:'omit', redirect:'error'}));
  if (!response.ok) throw Error('Ressource indisponible');
  const bytes = await response.clone().arrayBuffer();
  const actual = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)), x=>x.toString(16).padStart(2,'0')).join('');
  if (actual !== hash) throw Error('Empreinte différente');
  return response;
}
self.addEventListener('install', event => event.waitUntil((async () => {
  const cache = await caches.open(CACHE);
  const critical = new Set(['index.html', 'journal-bridge.js', 'jdc-fbm-photos.js'].map(name => new URL(name, SCOPE).href));
  for (const url of critical) await cache.put(url, await verified(url, FILES.get(url)));
  const queue = [...FILES].filter(([url]) => !critical.has(url));
  let cursor = 0;
  await Promise.all(Array.from({length:3}, async () => {
    while (cursor < queue.length) {
      const [url, hash] = queue[cursor++];
      try { await cache.put(url, await verified(url, hash)); } catch (_) { /* réessai à la lecture */ }
    }
  }));
  await self.skipWaiting();
})()));
self.addEventListener('activate', event => event.waitUntil((async () => {
  for (const name of await caches.keys()) {
    if (name.startsWith(OWN) && name !== CACHE) await caches.delete(name);
    if (LEGACY && name.startsWith(LEGACY)) {
      // Préserver les autres applications éventuellement hébergées sur cette même origine.
      const cache = await caches.open(name);
      for (const req of await cache.keys()) {
        const old = new URL(req.url);
        if (old.origin === SCOPE.origin && old.pathname.startsWith(SCOPE.pathname)) await cache.delete(req);
      }
      if (!(await cache.keys()).length) await caches.delete(name);
    }
  }
  await self.clients.claim();
})()));
self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET' || req.headers.has('Authorization') || req.headers.has('Range')) return;
  const url = new URL(req.url);
  if (url.origin !== SCOPE.origin) return;
  if (url.pathname === SCOPE.pathname) url.pathname += 'index.html';
  url.search = ''; url.hash = '';
  const hash = FILES.get(url.href);
  if (!hash) return;
  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const saved = await cache.match(url.href);
    if (saved) return saved;
    try {
      const response = await verified(url.href, hash);
      await cache.put(url.href,response.clone());
      return response;
    } catch {
      return new Response('Ressource indisponible. Reconnectez ce téléphone et réessayez.',{status:503,headers:{'Cache-Control':'no-store'}});
    }
  })());
});
