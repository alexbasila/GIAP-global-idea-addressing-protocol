// sw.js
const CACHE_NAME = 'giap-offline-v1';
const ASSETS = [
  './',                // Start-URL im Repo
  './index.html',
  './launch.html',
  './manifest.webmanifest',
  './icon-192.png',
  './icon-512.png',
];

// Install: Assets in den Cache legen
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

// Activate: alte Caches aufräumen
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.map(k => (k === CACHE_NAME ? null : caches.delete(k))))
    )
  );
  self.clients.claim();
});

// Fetch: Cache-first, Fallback Netzwerk
self.addEventListener('fetch', (event) => {
  const req = event.request;
  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;
      return fetch(req).then((res) => {
        // GET-Responses optional nach-cachen
        if (req.method === 'GET' && res.ok) {
          const copy = res.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(req, copy));
        }
        return res;
      }).catch(() => {
        // Offline-Fallback (z. B. index.html)
        if (req.mode === 'navigate') return caches.match('./index.html');
      });
    })
  );
});
