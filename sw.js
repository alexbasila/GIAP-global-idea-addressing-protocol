// GIAP Service Worker – minimal & frisch
const CACHE_NAME = 'giap-offline-v5';

// Basis-URL aus dem SW-Scope (z.B. "/GIAP-global-idea-addressing-protocol/")
const BASE = new URL(self.registration.scope).pathname.replace(/\/+$/, '') + '/';
const U = p => BASE + p.replace(/^\/+/, '');

const ASSETS = [
  U(''),                 // Start-URL ("/repo/")
  U('index.html'),
  U('manifest.webmanifest'),
  U('icon-192.png'),
  U('icon-512.png')
];

self.addEventListener('install', (evt) => {
  evt.waitUntil(caches.open(CACHE_NAME).then(c => c.addAll(ASSETS)).catch(()=>{}));
  self.skipWaiting();
});

self.addEventListener('activate', (evt) => {
  evt.waitUntil(
    caches.keys().then(keys => Promise.all(keys.map(k => (k===CACHE_NAME)?Promise.resolve():caches.delete(k))))
  );
  self.clients.claim();
});

// Navigationen → index.html (Cache first, dann Netz)
self.addEventListener('fetch', (evt) => {
  const req = evt.request;
  if (req.mode === 'navigate') {
    evt.respondWith(
      caches.match(U('index.html'), { ignoreSearch:true })
        .then(hit => hit || fetch(req))
        .catch(() => caches.match(U('index.html')))
    );
    return;
  }
  if (req.method === 'GET') {
    evt.respondWith(
      caches.match(req, { ignoreSearch:true }).then(hit => {
        if (hit) return hit;
        return fetch(req).then(res => {
          if (res && res.ok) caches.open(CACHE_NAME).then(c => c.put(req, res.clone()));
          return res;
        }).catch(()=>undefined);
      })
    );
  }
});
