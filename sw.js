const CACHE = "fbm-v2";
const BASE = [
  "./", "./index.html", "./manifest.json",
  "./assets/logo.svg", "./assets/ainm.svg",
  "./assets/icon-192.png", "./assets/icon-512.png"
];

self.addEventListener("install", e => {
  e.waitUntil(
    caches.open(CACHE).then(c =>
      Promise.all(BASE.map(u => c.add(u).catch(() => {})))
    )
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

function reseauAvecDelai(req, ms) {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error("delai")), ms);
    fetch(req).then(
      r => { clearTimeout(t); resolve(r); },
      err => { clearTimeout(t); reject(err); }
    );
  });
}

self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);

  // Les données Supabase ne passent jamais par le cache
  if (url.hostname.endsWith("supabase.co")) return;

  // Réseau d'abord (toujours la dernière version), cache en secours
  e.respondWith(
    reseauAvecDelai(req, 4000)
      .then(res => {
        if (res && (res.ok || res.type === "opaque")) {
          const copie = res.clone();
          caches.open(CACHE).then(c => c.put(req, copie)).catch(() => {});
        }
        return res;
      })
      .catch(() =>
        caches.match(req, { ignoreSearch: true }).then(c =>
          c || (req.mode === "navigate" ? caches.match("./index.html") : Response.error())
        )
      )
  );
});
