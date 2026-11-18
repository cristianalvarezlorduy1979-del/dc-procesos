// DC Procesos Service Worker v8
const CACHE_NAME = 'dc-procesos-v8';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((k) => caches.delete(k))
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  // Siempre intentar red primero para evitar pantallas en blanco por assets desactualizados
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});
