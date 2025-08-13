// sw.js — minimaler Service Worker (macht die Seite installierbar)
self.addEventListener('install', (evt) => self.skipWaiting());
self.addEventListener('activate', (evt) => clients.claim());

// Pflicht-Handler: einfach durchreichen
self.addEventListener('fetch', (evt) => {
  evt.respondWith(fetch(evt.request));
});
