// sw.js – GIAP PWA (GitHub Pages-sicher)
const CACHE_NAME = 'giap-offline-v5';

// Basis-URL aus dem SW-Scope (z.B. "/GIAP-global-idea-addressing-protocol/")
const BASE = new URL(self.registration.scope).pathname.replace(/\/+$/, '') + '/';
const U = p => BASE + p.replace(/^\/+/, '');

const ASSETS = [
  U(''),              // Start-URL ("/repo/")
  U('index.html'),
  U('manifest.webmanifest') // keine PNGs eintragen → SVGs sind inline im Manifest
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(c => c.addAll(ASSETS))
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

// Navigationen → index.html; andere GETs: Cache-First, dann Netz
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
