// Cambia il numero quando aggiorni i modelli o i file dell'app: i tablet scaricano la nuova versione.
var CACHE = 'fz3d-v4';

// File dell'app: servono tutti, senza questi l'installazione fallisce.
var CORE = [
  './app.html',
  './san-pietro-mandurino.glb',
  './torre-borraco.glb',
  '../assets/logo.png'
];

// Librerie esterne: se una CDN non risponde l'app si installa lo stesso
// e le librerie vengono messe in cache al primo caricamento riuscito.
var EXTERNAL = [
  'https://unpkg.com/@google/model-viewer@3.5.0/dist/model-viewer.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js'
];

self.addEventListener('install', function(e) {
  e.waitUntil(
    caches.open(CACHE).then(function(cache) {
      return cache.addAll(CORE).then(function() {
        return Promise.all(EXTERNAL.map(function(url) {
          return cache.add(url).catch(function() {});
        }));
      });
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(names) {
      return Promise.all(
        names.filter(function(n) { return n !== CACHE; })
             .map(function(n) { return caches.delete(n); })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', function(e) {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request).then(function(cached) {
      if (cached) return cached;
      return fetch(e.request).then(function(resp) {
        // salva in cache solo risposte complete (non le parziali 206)
        if (resp && (resp.status === 200 || resp.type === 'opaque')) {
          var copy = resp.clone();
          caches.open(CACHE).then(function(c) { c.put(e.request, copy); });
        }
        return resp;
      });
    })
  );
});
