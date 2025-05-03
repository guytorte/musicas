// sw.js — Service Worker for Music App

const CACHE_NAME = 'music-app-v1';
const CORE_ASSETS = [
  '/',
  '/index.html',
  '/styles.css',
  '/script.js',
  '/manifest.json',
  '/musicas.json'
];

// Identify media requests by URL path
function isMediaRequest(request) {
  return request.url.includes('/audio/') ||
         request.url.includes('/thumb/') ||
         request.url.includes('/capa/');
}

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(CORE_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  const { request } = event;
  if (request.method !== 'GET') return;

  // 1) Bypass media files entirely—let browser handle them
  if (isMediaRequest(request)) {
    event.respondWith(fetch(request));
    return;
  }

  // 2) Cache-first strategy for core assets
  if (CORE_ASSETS.some(asset => request.url.endsWith(asset))) {
    event.respondWith(
      caches.match(request)
        .then(cached => cached || fetch(request))
    );
    return;
  }

  // 3) Network-first for all other GET requests
  event.respondWith(
    fetch(request)
      .then(response => {
        if (response.ok) {
          // Dynamically cache successful responses
          const copy = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(request, copy));
        }
        return response;
      })
      .catch(() => caches.match(request))
  );
});
