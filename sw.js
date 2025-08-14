// sw.js – robust für GitHub Pages (Repo-Scope)
const CACHE_NAME = 'giap-offline-v5';

// Basis-URL aus dem SW-Scope ermitteln, z.B. "/GIAP-global-idea-addressing-protocol/"
const BASE = new URL(self.registration.scope).pathname.replace(/\/+$/, '') + '/';
const U = p => BASE + p.replace(/^\/+/, '');

const ASSETS = [
  U(''),
  U('index.html'),
  U('manifest.webmanifest'),
  U('icon-192.png'),
  U('icon-512.png'),
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(c => c.addAll(ASSETS))
      .catch(err => console.error('[SW] addAll failed', err))
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.map(k => (k === CACHE_NAME ? Promise.resolve() : caches.delete(k)))))
  );
  self.clients.claim();
});

// Navigation: immer auf index.html (Cache → Netz → Fallback)
self.addEventListener('fetch', event => {
  const req = event.request;

  if (req.mode === 'navigate') {
    event.respondWith(
      caches.match(U('index.html'), { ignoreSearch: true })
        .then(hit => hit || fetch(req))
        .catch(() => caches.match(U('index.html')))
    );
    return;
  }

  if (req.method === 'GET') {
    event.respondWith(
      caches.match(req, { ignoreSearch: true }).then(hit => {
        if (hit) return hit;
        return fetch(req).then(res => {
          if (res && res.ok) {
            const copy = res.clone();
            caches.open(CACHE_NAME).then(c => c.put(req, copy));
          }
          return res;
        });
      }).catch(() => undefined)
    );
  }
});
