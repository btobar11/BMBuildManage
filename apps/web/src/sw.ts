/// <reference lib="webworker" />
import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { NetworkOnly, CacheFirst, StaleWhileRevalidate } from 'workbox-strategies';
import { BackgroundSyncPlugin } from 'workbox-background-sync';
import { ExpirationPlugin } from 'workbox-expiration';
import { CacheableResponsePlugin } from 'workbox-cacheable-response';

declare let self: ServiceWorkerGlobalScope;

// 1. PRECACHE STATIC ASSETS
// @ts-ignore - __WB_MANIFEST is injected by VitePWA
precacheAndRoute(self.__WB_MANIFEST);
cleanupOutdatedCaches();

// 2. CACHE IMAGES
registerRoute(
  ({ request }) => request.destination === 'image',
  new CacheFirst({
    cacheName: 'images',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 60,
        maxAgeSeconds: 30 * 24 * 60 * 60, // 30 Days
      }),
    ],
  })
);

// 3. CACHE API READS (STALE-WHILE-REVALIDATE)
// For budgets, projects, etc.
registerRoute(
  ({ url }) => url.pathname.startsWith('/api/') && !url.pathname.includes('/auth/'),
  new StaleWhileRevalidate({
    cacheName: 'api-cache',
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
      new ExpirationPlugin({
        maxEntries: 100,
        maxAgeSeconds: 24 * 60 * 60, // 24 Hours
      }),
    ],
  })
);

// 4. BACKGROUND SYNC FOR MUTATIONS
const bgSyncPlugin = new BackgroundSyncPlugin('api-mutation-queue', {
  maxRetentionTime: 24 * 60, // Retry for up to 24 hours
  onSync: async ({ queue }) => {
    console.log('[SW] Background Sync triggered. Processing queue...');
    try {
      await queue.replayRequests();
      console.log('[SW] Queue processed successfully');
      
      // Notify main thread
      const clients = await self.clients.matchAll();
      clients.forEach(client => client.postMessage({ type: 'SYNC_COMPLETED' }));
    } catch (error) {
      console.error('[SW] Queue replay failed:', error);
    }
  },
});

registerRoute(
  ({ url, request }) => 
    url.pathname.startsWith('/api/') && 
    ['POST', 'PATCH', 'PUT', 'DELETE'].includes(request.method),
  new NetworkOnly({
    plugins: [
      bgSyncPlugin,
      {
        fetchDidFail: async ({ request }) => {
          console.log('[SW] Fetch failed, queuing mutation:', request.url);
          // Notify main thread that a mutation has been queued
          const clients = await self.clients.matchAll();
          clients.forEach(client => client.postMessage({ 
            type: 'MUTATION_QUEUED',
            url: request.url,
            method: request.method
          }));
        }
      }
    ],
  })
);

// 5. MESSAGE HANDLERS
self.addEventListener('message', async (event) => {
  if (event.data && event.data.type === 'GET_PENDING_COUNT') {
    try {
      // Import dynamically or use the already instantiated queue if available
      // For this project, we can just check IndexedDB directly or use a helper
      const dbRequest = indexedDB.open('workbox-background-sync');
      dbRequest.onsuccess = () => {
        const db = dbRequest.result;
        try {
          const transaction = db.transaction('requests', 'readonly');
          const store = transaction.objectStore('requests');
          const countRequest = store.count();
          countRequest.onsuccess = () => {
            event.source?.postMessage({
              type: 'MUTATION_QUEUED', // Re-use this type to trigger increment or just set initial
              count: countRequest.result
            });
          };
        } catch (e) {
          // If store doesn't exist yet, return 0
          event.source?.postMessage({ type: 'MUTATION_QUEUED', count: 0 });
        }
      };
    } catch (error) {
      console.error('[SW] Error getting queue count:', error);
    }
  }

  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

console.log('[SW] Service Worker initialization complete');
