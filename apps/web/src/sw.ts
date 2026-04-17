import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { NetworkFirst, CacheFirst, StaleWhileRevalidate } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';

declare let self: ServiceWorkerGlobalScope;

// Clean old caches
cleanupOutdatedCaches();

// Precaching automatically injected by vite-plugin-pwa
precacheAndRoute(self.__WB_MANIFEST || []);

// 1. Static Assets Handling (Images, Fonts, CSS, JS not covered by precache)
registerRoute(
  ({ request }) => request.destination === 'image' || request.destination === 'font',
  new CacheFirst({
    cacheName: 'bm-assets-cache',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 100,
        maxAgeSeconds: 30 * 24 * 60 * 60, // 30 Days
      }),
    ],
  })
);

// 2. Api Routing for Supabase / Backend (Network First so users get fresh data when online, cache when offline)
registerRoute(
  ({ url }) => url.pathname.startsWith('/api/v1/') || url.origin.includes('supabase.co'),
  new NetworkFirst({
    cacheName: 'bm-api-cache',
    networkTimeoutSeconds: 5,
    plugins: [
      new ExpirationPlugin({
        maxEntries: 150,
        maxAgeSeconds: 7 * 24 * 60 * 60, // 7 Days
      }),
    ],
  })
);

// 3. Fallback for navigation (React Router)
registerRoute(
  ({ request }) => request.mode === 'navigate',
  new NetworkFirst({
    cacheName: 'bm-pages-cache',
  })
);

// Skip waiting and claim clients to update app immediately
self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});
