// sw.js (robust für GitHub Pages)
const CACHE_NAME = 'giap-offline-v2';

// Basis-URL aus dem Service-Worker-Scope ermitteln, z.B. "/GIAP-global-idea-addressing-protocol/"
const BASE = new URL(self.registration.scope).pathname.replace(/\/+$/, '') + '/';

// Hilfsfunktion, um sichere absolute Pfade zu bauen
const U = p => BASE + p.replace(/^\/+/, '');

const ASSETS = [
  U(''),                    // die Start-URL ("/repo/")
  U('index.html'),
  U('launch.html'),
  U('manifest.webmanifest'),
  U('icon-192.png'),
  U('icon-512.png'),
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
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

// Network falling back to cache for normal requests,
// aber: Für Navigationsanfragen erst Cache -> dann Netz -> Fallback index.html
self.addEventListener('fetch', event => {
  const req = event.request;

  // 1) Navigationen immer auf gecachte index.html mappen (SPA/Pages-Redirects, Querystrings etc.)
  if (req.mode === 'navigate') {
    event.respondWith(
      caches.match(U('index.html'), { ignoreSearch: true })
        .then(hit => hit || fetch(req))
        .catch(() => caches.match(U('index.html')))
    );
    return;
  }

  // 2) Für alle anderen GET-Requests: Cache-First, dann Netz, Netz-Erfolg in Cache kopieren
  if (req.method === 'GET') {
    event.respondWith(
      caches.match(req, { ignoreSearch: true }).then(hit => {
        if (hit) return hit;
        return fetch(req).then(res => {
          // Erfolgreiche Antworten cachen
          if (res && res.ok) {
            const copy = res.clone();
            caches.open(CACHE_NAME).then(c => c.put(req, copy));
          }
          return res;
        });
      }).catch(err => {
        console.warn('[SW] fetch failed offline', err);
        return undefined; // kein spezieller Fallback für Nicht-Navigationen
      })
    );
  }
});
