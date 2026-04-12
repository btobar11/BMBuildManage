import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient } from '@tanstack/react-query'
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client'
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister'
import { compress, decompress } from 'lz-string'
import { AuthProvider } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import { NotificationsProvider } from './context/NotificationsContext'
import { GlobalErrorBoundary } from './components/error-boundary/GlobalErrorBoundary'
import './index.css'
import App from './App'

// ============================================
// QUERY CLIENT CONFIGURATION
// ============================================
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 24 * 60 * 60 * 1000,
      retry: (failureCount, error) => {
        if (error instanceof Error) {
          const status = (error as unknown as { status?: number }).status;
          if (status && status >= 400 && status < 500) return false;
        }
        return failureCount < 3;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      refetchOnWindowFocus: 'always',
      refetchOnReconnect: true,
      networkMode: 'offlineFirst',
    },
    mutations: {
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
  serialize: (data) => compress(JSON.stringify(data)) ?? '',
  deserialize: (data) => {
    try {
      if (!data || typeof data !== 'string') return {};
      const decompressed = decompress(data);
      return decompressed ? JSON.parse(decompressed) : {};
    } catch {
      return {};
    }
  },
});

// ============================================
// SERVICE WORKER REGISTRATION
// ============================================
async function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
      });

      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              newWorker.postMessage({ type: 'SKIP_WAITING' });
            }
          });
        }
      });

      if (registration.active) {
        registration.active.postMessage({ type: 'GET_PENDING_COUNT' });
      }
    } catch {
      // Service worker unavailable in this environment
    }
  }
}

// ============================================
// NETWORK STATUS TRACKING
// ============================================
function setupNetworkTracking() {
  const updateNetworkStatus = () => {
    document.documentElement.classList.toggle('offline', !navigator.onLine);
    window.dispatchEvent(new CustomEvent('network-change', {
      detail: { online: navigator.onLine }
    }));
  };

  window.addEventListener('online', updateNetworkStatus);
  window.addEventListener('offline', updateNetworkStatus);
  updateNetworkStatus();
}

// ============================================
// INITIALIZE APP
// ============================================
try {
  setupNetworkTracking();
  registerServiceWorker();

  const container = document.getElementById('root');
  if (!container) throw new Error('Root element not found');

  const root = createRoot(container);
  root.render(
    <StrictMode>
      <PersistQueryClientProvider
        client={queryClient}
        persistOptions={{
          persister: localStoragePersister,
          dehydrateOptions: {
            shouldDehydrateQuery: (query) => query.state.status === 'success',
          },
          maxAge: 7 * 24 * 60 * 60 * 1000,
        }}
      >
        <AuthProvider>
          <ThemeProvider>
            <NotificationsProvider>
              <BrowserRouter>
                <GlobalErrorBoundary>
                  <App />
                </GlobalErrorBoundary>
              </BrowserRouter>
            </NotificationsProvider>
          </ThemeProvider>
        </AuthProvider>
      </PersistQueryClientProvider>
    </StrictMode>
  );

  window.dispatchEvent(new CustomEvent('app-ready'));

} catch {
  window.dispatchEvent(new CustomEvent('app-ready'));
}

// Export for testing
export { queryClient };