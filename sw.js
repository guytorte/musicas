const CACHE_NAME = 'music-player-v6';
const DYNAMIC_CACHE = 'dynamic-music-cache-v1';
const ASSETS = [
  '/',
  '/index.html',
  '/styles.css',
  '/script.js',
  '/musicas.json',
  '/icons/icon-72x72.png',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/fallback.json'
];

// Estratégia: Cache First, com fallback
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Cache instalado');
        return cache.addAll(ASSETS);
      })
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(key => key !== CACHE_NAME && key !== DYNAMIC_CACHE)
          .map(key => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Estratégia para arquivos de mídia
  if (request.url.includes('/audio/') || request.url.includes('/images/')) {
    event.respondWith(
      caches.match(request).then(cachedResponse => {
        return cachedResponse || fetch(request).then(response => {
          return caches.open(DYNAMIC_CACHE).then(cache => {
            cache.put(request, response.clone());
            return response;
          });
        }).catch(() => {
          if (request.url.includes('/audio/')) {
            return caches.match('/audio/fallback.mp3');
          }
          return caches.match('/images/fallback.jpg');
        });
      })
    );
    return;
  }

  // Para outros recursos
  event.respondWith(
    caches.match(request).then(cachedResponse => {
      return cachedResponse || fetch(request).catch(() => {
        if (request.headers.get('accept').includes('text/html')) {
          return caches.match('/offline.html');
        }
      });
    })
  );
});

// Atualização em segundo plano
self.addEventListener('message', (event) => {
  if (event.data.action === 'skipWaiting') {
    self.skipWaiting();
  }
});
