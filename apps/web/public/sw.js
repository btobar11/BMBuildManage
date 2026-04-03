/**
 * Service Worker para BM Build Manage
 * Implementa estrategia offline-first para uso en campo
 *
 * Estrategias:
 * - Cache First: Assets estaticos
 * - Network First with Cache Fallback: API calls
 * - Background Sync: Mutaciones pendientes
 */

const CACHE_VERSION = 'bm-v1';
const CACHE_NAME = `${CACHE_VERSION}-static`;
const API_CACHE_NAME = `${CACHE_VERSION}-api`;
const MUTATION_QUEUE_NAME = `${CACHE_VERSION}-mutations`;

// Assets to precache
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/favicon.svg',
  '/logo-icon.png',
];

// API patterns to cache
const API_PATTERNS = [
  /\/api\/budgets/,
  /\/api\/projects/,
  /\/api\/items/,
  /\/api\/stages/,
];

// ============================================
// INSTALL EVENT - Precache static assets
// ============================================
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Precaching static assets');
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
            .filter((name) => name.startsWith('bm-') && name !== CACHE_NAME && name !== API_CACHE_NAME)
            .map((name) => {
              console.log('[SW] Deleting old cache:', name);
              return caches.delete(name);
            })
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
    // Handle mutations offline
    if (!navigator.onLine && url.pathname.startsWith('/api')) {
      event.respondWith(handleOfflineMutation(request));
      return;
    }
    return;
  }

  // Skip non-http requests
  if (!url.protocol.startsWith('http')) return;

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
    // Update cache in background
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
  } catch (error) {
    console.error('[SW] Cache First failed:', error);
    return new Response('Offline', { status: 503 });
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

    // Cache successful responses
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    console.log('[SW] Network failed, trying cache for:', request.url);

    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    // Return offline response
    return new Response(
      JSON.stringify({
        error: 'offline',
        message: 'No hay conexion. Los datos mostrados pueden estar desactualizados.'
      }),
      {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
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

  // Store mutation for later sync
  const mutation = {
    id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    url: request.url,
    method: request.method,
    body: body,
    headers: Object.fromEntries(request.headers.entries()),
    timestamp: Date.now(),
  };

  // Store in IndexedDB
  await storeMutation(mutation);

  // Notify client
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
      message: 'Sin conexion. Cambios guardados localmente y se sincronizaran cuando vuelva la conexion.'
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
// SYNC EVENT - Background sync
// ============================================
self.addEventListener('sync', (event) => {
  if (event.tag === 'bm-sync-mutations') {
    event.waitUntil(syncMutations());
  }
});

/**
 * Sync pending mutations when online
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

        // Notify client
        const clients = await self.clients.matchAll();
        clients.forEach(client => {
          client.postMessage({
            type: 'MUTATION_SYNCED',
            mutationId: mutation.id,
          });
        });
      }
    } catch (error) {
      console.error('[SW] Failed to sync mutation:', mutation.id, error);
    }
  }
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
    case 'GET_PENDING_COUNT':
      const mutations = await getPendingMutations();
      event.source?.postMessage({
        type: 'PENDING_COUNT',
        count: mutations.length,
      });
      break;

    case 'FORCE_SYNC':
      await syncMutations();
      break;

    case 'SKIP_WAITING':
      self.skipWaiting();
      break;
  }
});

// ============================================
// PUSH NOTIFICATIONS (Future)
// ============================================
self.addEventListener('push', (event) => {
  if (!event.data) return;

  const data = event.data.json();
  event.waitUntil(
    self.registration.showNotification(data.title || 'BM Build Manage', {
      body: data.body || 'Nueva actualizacion',
      icon: '/logo-icon.png',
      badge: '/logo-icon.png',
      vibrate: [100, 50, 100],
      data: data.data,
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
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

console.log('[SW] BM Build Manage Service Worker loaded');