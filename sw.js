// Service Worker v3 - Music Player
const CACHE_VERSION = 'v3';
const CACHE_NAME = `music-player-${CACHE_VERSION}`;
const DYNAMIC_CACHE = `dynamic-${CACHE_VERSION}`;
const OFFLINE_CACHE = `offline-${CACHE_VERSION}`;

// Core assets to cache on install
const CORE_ASSETS = [
  '/',
  '/index.html',
  '/styles.css',
  '/script.js',
  '/manifest.json',
  '/fallback-thumb.jpg',
  '/fallback-capa.jpg',
  '/offline.html',
  '/audio/fallback.mp3'
];

// File extensions to cache dynamically
const CACHEABLE_EXTENSIONS = [
  '.mp3',
  '.jpg',
  '.png',
  '.webp',
  '.json'
];

// Media paths to handle specially
const MEDIA_PATHS = [
  '/audio/',
  '/thumb/',
  '/capa/'
];

/**
 * INSTALL EVENT - Cache core assets
 */
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[SW] Caching core assets');
        return cache.addAll(CORE_ASSETS);
      })
      .then(() => {
        console.log('[SW] Installation complete');
        return self.skipWaiting();
      })
  );
});

/**
 * ACTIVATE EVENT - Clean old caches
 */
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cache => {
          if (cache !== CACHE_NAME && 
              cache !== DYNAMIC_CACHE && 
              cache !== OFFLINE_CACHE) {
            console.log('[SW] Removing old cache:', cache);
            return caches.delete(cache);
          }
        })
      );
    })
    .then(() => {
      console.log('[SW] Claiming clients');
      return self.clients.claim();
    })
  );
});

/**
 * FETCH EVENT - Custom caching strategy
 */
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests and chrome-extension
  if (request.method !== 'GET' || url.protocol === 'chrome-extension:') {
    return;
  }

  // Cache-first for core assets
  if (isCoreAsset(request)) {
    event.respondWith(
      caches.match(request)
        .then(cached => cached || fetchAndCache(request, CACHE_NAME))
    );
    return;
  }

  // Dynamic caching for media
  if (isMediaRequest(request)) {
    event.respondWith(
      mediaCacheStrategy(request)
    );
    return;
  }

  // Network-first for other requests
  event.respondWith(
    networkFirstStrategy(request)
  );
});

/**
 * Caching Strategies
 */

// Media: Cache with fallback
async function mediaCacheStrategy(request) {
  const cache = await caches.open(DYNAMIC_CACHE);
  
  try {
    // Try network first
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      // Cache the response
      cache.put(request, networkResponse.clone());
      return networkResponse;
    }
    throw new Error('Network response not OK');
  } catch (err) {
    // Fallback to cache
    const cached = await cache.match(request);
    if (cached) return cached;
    
    // Ultimate fallback
    return serveMediaFallback(request);
  }
}

// Network first with cache fallback
async function networkFirstStrategy(request) {
  try {
    const networkResponse = await fetch(request);
    // Update cache in background
    cacheDynamicRequest(request, networkResponse.clone());
    return networkResponse;
  } catch (err) {
    const cached = await caches.match(request);
    return cached || caches.match('/offline.html');
  }
}

// Fetch and cache helper
async function fetchAndCache(request, cacheName = DYNAMIC_CACHE) {
  const response = await fetch(request);
  if (response.ok) {
    const cache = await caches.open(cacheName);
    cache.put(request, response.clone());
  }
  return response;
}

// Cache put helper
function cacheDynamicRequest(request, response, cacheName = DYNAMIC_CACHE) {
  if (shouldCache(request)) {
    caches.open(cacheName)
      .then(cache => cache.put(request, response))
      .catch(console.error);
  }
  return response;
}

// Media fallback handler
function serveMediaFallback(request) {
  if (request.url.includes('/audio/')) {
    return caches.match('/audio/fallback.mp3');
  }
  if (request.url.includes('/thumb/')) {
    return caches.match('/fallback-thumb.jpg');
  }
  if (request.url.includes('/capa/')) {
    return caches.match('/fallback-capa.jpg');
  }
  return Response.error();
}

/**
 * Utility Functions
 */

function isCoreAsset(request) {
  return CORE_ASSETS.some(asset => 
    request.url.endsWith(asset) ||
    request.url.includes('?v=') // Versioned files
  );
}

function isMediaRequest(request) {
  return MEDIA_PATHS.some(path => 
    request.url.includes(path)
  );
}

function shouldCache(request) {
  return CACHEABLE_EXTENSIONS.some(ext => 
    request.url.endsWith(ext)
  );
}

/**
 * Background Sync
 */
self.addEventListener('sync', event => {
  if (event.tag === 'update-cache') {
    event.waitUntil(updateCache());
  }
});

async function updateCache() {
  const cache = await caches.open(DYNAMIC_CACHE);
  const requests = await cache.keys();
  
  await Promise.all(
    requests.map(async request => {
      try {
        const fresh = await fetch(request);
        if (fresh.ok) {
          await cache.put(request, fresh);
        }
      } catch (err) {
        console.log('[SW] Cache update failed:', request.url);
      }
    })
  );
  console.log('[SW] Cache updated');
}

/**
 * Client Messages
 */
self.addEventListener('message', event => {
  switch (event.data.action) {
    case 'skipWaiting':
      self.skipWaiting();
      break;
      
    case 'updateCache':
      updateCache();
      break;
      
    case 'clearCache':
      caches.delete(DYNAMIC_CACHE)
        .then(() => console.log('[SW] Dynamic cache cleared'));
      break;
  }
});
