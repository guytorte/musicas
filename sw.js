// Service Worker v3 - Core Caching Only
const CACHE_VERSION = 'v3';
const CACHE_NAME = `music-player-core-${CACHE_VERSION}`;

// Core assets to cache (update when files change)
const CORE_ASSETS = [
  '/',
  '/index.html',
  '/styles.css',
  '/script.js',
  '/manifest.json',
  '/musicas.json'
];

// Install - Cache core assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[SW] Caching core assets');
        return cache.addAll(CORE_ASSETS);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate - Clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cache => {
          if (cache !== CACHE_NAME) {
            console.log('[SW] Removing old cache:', cache);
            return caches.delete(cache);
          }
        })
      );
    })
    .then(() => self.clients.claim())
  );
});

// Fetch - Cache-first for core, network-first for others
self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Cache-first for core assets
  if (CORE_ASSETS.some(asset => request.url.endsWith(asset))) {
    event.respondWith(
      caches.match(request)
        .then(cached => cached || fetch(request))
    );
    return;
  }

  // Network-first for other requests
  event.respondWith(
    fetch(request)
      .then(response => {
        // Cache dynamic content (except media)
        if (response.ok && !isMediaRequest(request)) {
          const clone = response.clone();
          caches.open(CACHE_NAME)
            .then(cache => cache.put(request, clone));
        }
        return response;
      })
      .catch(() => caches.match(request))
  );
});

// Helper - Check if request is for media
function isMediaRequest(request) {
  const mediaPaths = ['/audio/', '/thumb/', '/capa/'];
  return mediaPaths.some(path => request.url.includes(path));
}

// Message handling
self.addEventListener('message', (event) => {
  if (event.data.action === 'skipWaiting') {
    self.skipWaiting();
  }
});
