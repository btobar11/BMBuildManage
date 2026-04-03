/**
 * BM Build Manage - PWA Entry Point
 * Configured for offline-first architecture with:
 * - React Query persistence to localStorage
 * - Extended cache times for field work
 * - Service Worker registration (manual)
 */

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient } from '@tanstack/react-query'
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client'
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister'
import { compress, decompress } from 'lz-string'
import { AuthProvider } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import './index.css'
import App from './App'

console.log('MAIN.TSX STARTING WITH OFFLINE-FIRST CONFIGURATION');

// ============================================
// QUERY CLIENT CONFIGURATION
// ============================================
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Extended stale time: 5 minutes before considering data stale
      // Critical for field work where connection is intermittent
      staleTime: 5 * 60 * 1000,

      // Extended garbage collection: 24 hours
      // Prevents cached data from being removed too quickly
      gcTime: 24 * 60 * 60 * 1000,

      // Retry configuration for unstable connections
      retry: (failureCount, error) => {
        // Don't retry on 4xx errors (client errors)
        if (error instanceof Error) {
          const status = (error as unknown as { status?: number }).status;
          if (status && status >= 400 && status < 500) return false;
        }
        // Retry up to 3 times for network errors
        return failureCount < 3;
      },

      // Exponential backoff for retries
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),

      // Refetch on window focus only when online
      refetchOnWindowFocus: 'always',

      // Refetch on reconnect
      refetchOnReconnect: true,

      // Network mode: always try to fetch, fallback to cache
      networkMode: 'offlineFirst',
    },
    mutations: {
      // Retry mutations once (for transient network issues)
      retry: 1,
      retryDelay: 1000,
    },
  },
})

// ============================================
// PERSISTENCE LAYER
// ============================================
const localStoragePersister = createAsyncStoragePersister({
  storage: window.localStorage,
  key: 'BM_QUERY_CACHE',

  // Compression for large datasets (budgets with many items)
  serialize: (data) => compress(JSON.stringify(data)) ?? '',
  deserialize: (data) => JSON.parse(decompress(data as string) ?? '{}'),
});

// ============================================
// SERVICE WORKER REGISTRATION (Manual)
// ============================================
async function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
      });

      console.log('[SW] Service Worker registered:', registration.scope);

      // Handle updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              console.log('[SW] New version available');
              // Auto-activate for seamless updates
              newWorker.postMessage({ type: 'SKIP_WAITING' });
            }
          });
        }
      });

      // Check for pending mutations on load
      if (registration.active) {
        registration.active.postMessage({ type: 'GET_PENDING_COUNT' });
      }

    } catch (error) {
      console.warn('[SW] Registration failed (expected in development):', error);
    }
  }
}

// ============================================
// NETWORK STATUS TRACKING
// ============================================
function setupNetworkTracking() {
  const updateNetworkStatus = () => {
    document.documentElement.classList.toggle('offline', !navigator.onLine);

    // Dispatch custom event for components to listen
    window.dispatchEvent(new CustomEvent('network-change', {
      detail: { online: navigator.onLine }
    }));
  };

  window.addEventListener('online', updateNetworkStatus);
  window.addEventListener('offline', updateNetworkStatus);

  // Initial state
  updateNetworkStatus();
}

// ============================================
// INITIALIZE APP
// ============================================
setupNetworkTracking();

// Register Service Worker
registerServiceWorker();

// Render app with persistence
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{
        persister: localStoragePersister,

        // Debounce persistence to avoid excessive writes
        dehydrateOptions: {
          shouldDehydrateQuery: (query) => {
            // Only persist successful queries
            return query.state.status === 'success';
          },
        },

        // Max age for persisted data: 7 days
        maxAge: 7 * 24 * 60 * 60 * 1000,
      }}
    >
      <AuthProvider>
        <ThemeProvider>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </ThemeProvider>
      </AuthProvider>
    </PersistQueryClientProvider>
  </StrictMode>
);

// Export for testing
export { queryClient };