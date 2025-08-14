// sw.js
const CACHE_NAME = 'giap-offline-v5';

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const base = new URL(self.registration.scope).pathname.replace(/\/+$/, '') + '/';
    const u = (p) => base + p.replace(/^\/+/, '');
    const cache = await caches.open(CACHE_NAME);
    await cache.addAll([
      u(''),
      u('index.html'),
      u('manifest.webmanifest'),
      u('icon-192.png'),
      u('icon-512.png')
    ]);
  })());
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.map(k => k === CACHE_NAME ? Promise.resolve() : caches.delete(k)));
  })());
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const req = event.request;

  // Navigationsanfragen → index.html (offline-freundlich)
  if (req.mode === 'navigate') {
    event.respondWith((async () => {
      const base = new URL(self.registration.scope).pathname.replace(/\/+$/, '') + '/';
      const u = (p) => base + p.replace(/^\/+/, '');
      const cached = await caches.match(u('index.html'), { ignoreSearch: true });
      try {
        return (await fetch(req)) || cached || Response.error();
      } catch {
        return cached || Response.error();
      }
    })());
    return;
  }

  // Sonst: Cache-First, dann Netz
  if (req.method === 'GET') {
    event.respondWith((async () => {
      const hit = await caches.match(req, { ignoreSearch: true });
      if (hit) return hit;
      try {
        const res = await fetch(req);
        if (res && res.ok) {
          const c = await caches.open(CACHE_NAME);
          c.put(req, res.clone());
        }
        return res;
      } catch {
        return Response.error();
      }
    })());
  }
});
