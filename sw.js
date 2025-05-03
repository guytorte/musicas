// CONFIGURAÇÕES DE CACHE
const CACHE_VERSION = 'v2';
const STATIC_CACHE = `static-${CACHE_VERSION}`;
const DYNAMIC_CACHE = `dynamic-${CACHE_VERSION}`;
const OFFLINE_CACHE = `offline-${CACHE_VERSION}`;

// ARQUIVOS ESSENCIAIS (SUBSTITUA COM SEUS PATHS)
const CORE_ASSETS = [
  '/',
  '/index.html',
  '/styles.css',
  '/script.js',
  '/manifest.json',
  '/fallback-thumb.jpg',
  '/fallback-capa.jpg',
  '/offline.html'
];

// ARQUIVOS DE MÍDIA (PREFIXOS DE CAMINHO)
const MEDIA_PATHS = [
  '/audio/',
  '/thumb/',
  '/capa/'
];

/**
 * INSTALAÇÃO - CACHE DOS RECURSOS ESSENCIAIS
 */
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => {
        console.log('[SW] Cache estático instalado');
        return cache.addAll(CORE_ASSETS);
      })
      .then(() => self.skipWaiting())
  );
});

/**
 * ATIVAÇÃO - LIMPEZA DE CACHES ANTIGOS
 */
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(key => 
          key !== STATIC_CACHE && 
          key !== DYNAMIC_CACHE && 
          key !== OFFLINE_CACHE
        ).map(key => caches.delete(key))
      );
    }).then(() => {
      console.log('[SW] Caches antigos removidos');
      return self.clients.claim();
    })
  );
});

/**
 * ESTRATÉGIA DE FETCH - CACHE COM FALLBACK
 */
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // 1. PARA ARQUIVOS ESSENCIAIS: CACHE-FIRST
  if (isCoreAsset(request)) {
    event.respondWith(
      caches.match(request)
        .then(cached => cached || fetchAndCache(request, STATIC_CACHE))
    );
    return;
  }

  // 2. PARA MÍDIA: CACHE DINÂMICO + FALLBACK
  if (isMediaRequest(request)) {
    event.respondWith(
      caches.match(request).then(cached => {
        // Tentar rede primeiro para mídia
        return cached || fetchAndCache(request, DYNAMIC_CACHE)
          .catch(() => serveMediaFallback(request));
      })
    );
    return;
  }

  // 3. PARA DEMANDAS: NETWORK-FIRST COM FALLBACK OFFLINE
  event.respondWith(
    fetch(request)
      .then(networkResponse => {
        // Atualiza cache dinâmico
        cacheDynamicRequest(request, networkResponse.clone());
        return networkResponse;
      })
      .catch(() => caches.match('/offline.html'))
  );
});

/**
 * FUNÇÕES AUXILIARES
 */

// Verifica se é um arquivo essencial
function isCoreAsset(request) {
  return CORE_ASSETS.some(asset => 
    request.url.endsWith(asset) ||
    request.url.includes('?v=') // Versões de arquivos
  );
}

// Verifica se é uma requisição de mídia
function isMediaRequest(request) {
  return MEDIA_PATHS.some(path => 
    request.url.includes(path)
  );
}

// Busca e armazena em cache
function fetchAndCache(request, cacheName) {
  return fetch(request).then(response => {
    // Só armazena respostas válidas
    if (!response.ok) throw Error('Resposta inválida');
    return cacheDynamicRequest(request, response, cacheName);
  });
}

// Armazena requisição no cache dinâmico
function cacheDynamicRequest(request, response, cacheName = DYNAMIC_CACHE) {
  const clone = response.clone();
  caches.open(cacheName).then(cache => cache.put(request, clone));
  return response;
}

// Fallback para mídia
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
 * SINCRONIZAÇÃO EM SEGUNDO PLANO
 */
self.addEventListener('sync', (event) => {
  if (event.tag === 'update-cache') {
    event.waitUntil(updateCache());
  }
});

// Atualização periódica do cache
async function updateCache() {
  const cache = await caches.open(DYNAMIC_CACHE);
  const requests = await cache.keys();
  
  return Promise.all(
    requests.map(async request => {
      try {
        const fresh = await fetch(request);
        return cache.put(request, fresh);
      } catch (err) {
        console.log(`[SW] Falha ao atualizar: ${request.url}`);
      }
    })
  );
}

/**
 * MENSAGENS DO CLIENTE
 */
self.addEventListener('message', (event) => {
  if (event.data.action === 'skipWaiting') {
    self.skipWaiting();
  }
  
  if (event.data.action === 'updateCache') {
    updateCache();
  }
});
