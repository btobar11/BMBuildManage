/**
 * Service Worker para BM Build Manage
 * Implementa estrategia offline-first para uso en campo
 *
 * Estrategias:
 * - Cache First: Assets estaticos
 * - Network First with Cache Fallback: API calls
 * - Background Sync: Mutaciones pendientes
 * - Stale-While-Revalidate: Fuentes y assets secundarios
 */

const CACHE_VERSION = 'bm-v2';
const CACHE_NAME = `${CACHE_VERSION}-static`;
const API_CACHE_NAME = `${CACHE_VERSION}-api`;
const FONT_CACHE_NAME = `${CACHE_VERSION}-fonts`;

// Assets to precache - comprehensive list for field usage
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/favicon.svg',
  '/app-icon.svg',
  '/manifest.webmanifest',
];

// API patterns to cache for offline access
const API_CACHE_PATTERNS = [
  /\/api\/v1\/projects/,
  /\/api\/v1\/budgets/,
  /\/api\/v1\/items/,
  /\/api\/v1\/stages/,
  /\/api\/v1\/resources/,
  /\/api\/v1\/workers/,
  /\/api\/v1\/analytics/,
  /\/api\/v1\/apu/,
];

// Max age for API cache entries (5 minutes)
const API_CACHE_MAX_AGE = 5 * 60 * 1000;

// Max retry attempts for failed syncs
const MAX_SYNC_RETRIES = 5;

// ============================================
// INSTALL EVENT - Precache static assets
// ============================================
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(PRECACHE_ASSETS);
      })
      .then(() => self.skipWaiting())
  );
});

// ============================================
// ACTIVATE EVENT - Clean old caches
// ============================================
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => name.startsWith('bm-') && !name.startsWith(CACHE_VERSION))
            .map((name) => caches.delete(name))
        );
      })
      .then(() => self.clients.claim())
  );
});

// ============================================
// FETCH EVENT - Handle requests
// ============================================
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests for caching (they'll be handled by background sync)
  if (request.method !== 'GET') {
    if (!navigator.onLine && url.pathname.startsWith('/api')) {
      event.respondWith(handleOfflineMutation(request));
      return;
    }
    return;
  }

  // Skip non-http requests
  if (!url.protocol.startsWith('http')) return;

  // Skip chrome-extension and other non-app URLs
  if (!url.origin.includes(self.location.origin) && !url.hostname.includes('fonts')) return;

  // Handle Google Fonts with Stale-While-Revalidate
  if (url.hostname.includes('fonts.googleapis.com') || url.hostname.includes('fonts.gstatic.com')) {
    event.respondWith(staleWhileRevalidate(request, FONT_CACHE_NAME));
    return;
  }

  // Handle API requests with Network First
  if (url.pathname.startsWith('/api')) {
    event.respondWith(networkFirst(request));
    return;
  }

  // Handle static assets with Cache First
  event.respondWith(cacheFirst(request));
});

// ============================================
// CACHING STRATEGIES
// ============================================

/**
 * Cache First - For static assets
 * Returns cached version immediately, updates in background
 */
async function cacheFirst(request) {
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    fetchAndCache(request, CACHE_NAME);
    return cachedResponse;
  }

  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch {
    return new Response('Sin conexión', { status: 503 });
  }
}

/**
 * Network First - For API requests
 * Tries network first, falls back to cache if offline
 */
async function networkFirst(request) {
  const cache = await caches.open(API_CACHE_NAME);

  try {
    const networkResponse = await fetch(request);

    if (networkResponse.ok) {
      // Add timestamp header for cache age tracking
      const responseToCache = new Response(await networkResponse.clone().blob(), {
        status: networkResponse.status,
        statusText: networkResponse.statusText,
        headers: new Headers({
          ...Object.fromEntries(networkResponse.headers.entries()),
          'sw-cached-at': Date.now().toString(),
        }),
      });
      cache.put(request, responseToCache);
    }

    return networkResponse;
  } catch {
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      // Check cache age
      const cachedAt = cachedResponse.headers.get('sw-cached-at');
      const isStale = cachedAt && (Date.now() - parseInt(cachedAt)) > API_CACHE_MAX_AGE;

      // Return cached response with staleness indicator
      const body = await cachedResponse.clone().text();
      return new Response(body, {
        status: 200,
        headers: {
          'Content-Type': cachedResponse.headers.get('Content-Type') || 'application/json',
          'X-From-Cache': 'true',
          'X-Cache-Stale': isStale ? 'true' : 'false',
        },
      });
    }

    return new Response(
      JSON.stringify({
        error: 'offline',
        message: 'Sin conexión a internet. Los datos se mostrarán cuando vuelva la conexión.'
      }),
      {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

/**
 * Stale-While-Revalidate - For fonts and CDN assets
 */
async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);

  const fetchPromise = fetch(request).then((networkResponse) => {
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  }).catch(() => cachedResponse);

  return cachedResponse || fetchPromise;
}

/**
 * Fetch and cache helper
 */
async function fetchAndCache(request, cacheName) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
  } catch {
    // Ignore fetch errors for background updates
  }
}

// ============================================
// OFFLINE MUTATIONS
// ============================================

/**
 * Handle offline mutation by storing in IndexedDB
 */
async function handleOfflineMutation(request) {
  const body = await request.clone().text();

  const mutation = {
    id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    url: request.url,
    method: request.method,
    body: body,
    headers: Object.fromEntries(request.headers.entries()),
    timestamp: Date.now(),
    retryCount: 0,
  };

  await storeMutation(mutation);

  const clients = await self.clients.matchAll();
  clients.forEach(client => {
    client.postMessage({
      type: 'MUTATION_QUEUED',
      mutation: mutation,
    });
  });

  return new Response(
    JSON.stringify({
      queued: true,
      message: 'Sin conexión. Cambios guardados localmente y se sincronizarán automáticamente.'
    }),
    {
      status: 202,
      headers: { 'Content-Type': 'application/json' }
    }
  );
}

/**
 * Store mutation in IndexedDB
 */
async function storeMutation(mutation) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('bm-offline', 1);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const db = request.result;

      if (!db.objectStoreNames.contains('mutations')) {
        db.createObjectStore('mutations', { keyPath: 'id' });
      }

      const transaction = db.transaction('mutations', 'readwrite');
      const store = transaction.objectStore('mutations');
      store.add(mutation);

      transaction.oncomplete = () => resolve(undefined);
      transaction.onerror = () => reject(transaction.error);
    };

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('mutations')) {
        db.createObjectStore('mutations', { keyPath: 'id' });
      }
    };
  });
}

// ============================================
// SYNC EVENT - Background sync with exponential backoff
// ============================================
self.addEventListener('sync', (event) => {
  if (event.tag === 'bm-sync-mutations') {
    event.waitUntil(syncMutations());
  }
});

/**
 * Sync pending mutations when online — with exponential backoff retry
 */
async function syncMutations() {
  const mutations = await getPendingMutations();

  for (const mutation of mutations) {
    try {
      const response = await fetch(mutation.url, {
        method: mutation.method,
        body: mutation.body,
        headers: mutation.headers,
      });

      if (response.ok) {
        await removeMutation(mutation.id);

        const clients = await self.clients.matchAll();
        clients.forEach(client => {
          client.postMessage({
            type: 'MUTATION_SYNCED',
            mutationId: mutation.id,
          });
        });
      } else if (response.status >= 500) {
        // Server error — retry with backoff
        await handleRetry(mutation);
      } else {
        // Client error (4xx) — remove, don't retry
        await removeMutation(mutation.id);
        const clients = await self.clients.matchAll();
        clients.forEach(client => {
          client.postMessage({
            type: 'MUTATION_FAILED',
            mutationId: mutation.id,
            error: `Error ${response.status}: ${response.statusText}`,
          });
        });
      }
    } catch {
      await handleRetry(mutation);
    }
  }
}

/**
 * Handle retry with exponential backoff
 */
async function handleRetry(mutation) {
  const retryCount = (mutation.retryCount || 0) + 1;

  if (retryCount >= MAX_SYNC_RETRIES) {
    await removeMutation(mutation.id);
    const clients = await self.clients.matchAll();
    clients.forEach(client => {
      client.postMessage({
        type: 'MUTATION_FAILED',
        mutationId: mutation.id,
        error: 'Máximo de reintentos alcanzado. El cambio no pudo sincronizarse.',
      });
    });
    return;
  }

  // Update retry count in IndexedDB
  await updateMutationRetry(mutation.id, retryCount);

  // Schedule retry with exponential backoff (2^n seconds)
  const delay = Math.pow(2, retryCount) * 1000;
  await new Promise(resolve => setTimeout(resolve, delay));
}

/**
 * Update mutation retry count
 */
async function updateMutationRetry(id, retryCount) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('bm-offline', 1);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction('mutations', 'readwrite');
      const store = transaction.objectStore('mutations');
      const getReq = store.get(id);

      getReq.onsuccess = () => {
        const mutation = getReq.result;
        if (mutation) {
          mutation.retryCount = retryCount;
          store.put(mutation);
        }
      };

      transaction.oncomplete = () => resolve(undefined);
      transaction.onerror = () => reject(transaction.error);
    };
  });
}

/**
 * Get pending mutations from IndexedDB
 */
async function getPendingMutations() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('bm-offline', 1);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction('mutations', 'readonly');
      const store = transaction.objectStore('mutations');
      const getAll = store.getAll();

      getAll.onsuccess = () => resolve(getAll.result);
      getAll.onerror = () => reject(getAll.error);
    };
  });
}

/**
 * Remove mutation from IndexedDB
 */
async function removeMutation(id) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('bm-offline', 1);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction('mutations', 'readwrite');
      const store = transaction.objectStore('mutations');
      store.delete(id);

      transaction.oncomplete = () => resolve(undefined);
      transaction.onerror = () => reject(transaction.error);
    };
  });
}

// ============================================
// MESSAGE HANDLER
// ============================================
self.addEventListener('message', async (event) => {
  const { type } = event.data || {};

  switch (type) {
    case 'GET_PENDING_COUNT': {
      const mutations = await getPendingMutations();
      event.source?.postMessage({
        type: 'PENDING_COUNT',
        count: mutations.length,
      });
      break;
    }

    case 'FORCE_SYNC':
      await syncMutations();
      break;

    case 'SKIP_WAITING':
      self.skipWaiting();
      break;

    case 'CLEAR_CACHE':
      await caches.keys().then(names =>
        Promise.all(names.filter(n => n.startsWith('bm-')).map(n => caches.delete(n)))
      );
      break;
  }
});

// ============================================
// PUSH NOTIFICATIONS
// ============================================
self.addEventListener('push', (event) => {
  if (!event.data) return;

  const data = event.data.json();
  event.waitUntil(
    self.registration.showNotification(data.title || 'BM Build Manage', {
      body: data.body || 'Nueva actualización disponible',
      icon: '/app-icon.svg',
      badge: '/app-icon.svg',
      vibrate: [100, 50, 100],
      data: data.data,
      actions: [
        { action: 'open', title: 'Abrir' },
        { action: 'dismiss', title: 'Cerrar' },
      ],
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'dismiss') return;

  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then((clients) => {
      for (const client of clients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus();
        }
      }
      return self.clients.openWindow('/');
    })
  );
});