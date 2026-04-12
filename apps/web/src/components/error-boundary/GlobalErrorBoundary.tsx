import { ErrorBoundary, type ErrorBoundaryProps } from 'react-error-boundary';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, RefreshCw } from 'lucide-react';

/**
 * Fallback component for GlobalErrorBoundary
 * Shows a minimal UI when React tree crashes
 */
function ErrorFallback({
  error,
  resetErrorBoundary
}: ErrorBoundaryProps['FallbackProps']) {
  const navigate = useNavigate();

  const handleReload = () => {
    window.location.href = '/';
  };

  const handleLogin = () => {
    // Clear any stale auth state
    localStorage.removeItem('supabase.auth.token');
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="max-w-md w-full bg-card border border-border rounded-xl p-8 text-center shadow-lg">
        <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-destructive/10 flex items-center justify-center">
          <AlertTriangle className="w-8 h-8 text-destructive" />
        </div>
        
        <h1 className="text-xl font-semibold text-foreground mb-2">
          Algo salió mal
        </h1>
        
        <p className="text-sm text-muted-foreground mb-6">
          {error?.message || 'Ha ocurrido un error inesperado. Por favor intenta de nuevo.'}
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={resetErrorBoundary}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium"
          >
            <RefreshCw className="w-4 h-4" />
            Reintentar
          </button>
          
          <button
            onClick={handleReload}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-muted text-foreground rounded-lg hover:bg-muted/80 transition-colors text-sm font-medium"
          >
            Recargar página
          </button>
        </div>

        {error?.message?.includes('401') || error?.message?.includes('403') ? (
          <button
            onClick={handleLogin}
            className="mt-4 text-sm text-primary hover:underline"
          >
            Ir a iniciar sesión
          </button>
        ) : null}
      </div>
    </div>
  );
}

/**
 * Global Error Boundary for the entire React application
 * Catches any unhandled errors that would cause "White Screen of Death"
 */
export function GlobalErrorBoundary({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary
      FallbackComponent={ErrorFallback}
      onError={(error, errorInfo) => {
        console.error('[GlobalErrorBoundary] Uncaught error:', error, errorInfo);
        // Optionally report to error tracking service
      }}
      onReset={() => {
        console.log('[GlobalErrorBoundary] Resetting application state');
      }}
    >
      {children}
    </ErrorBoundary>
  );
}

export default GlobalErrorBoundary;