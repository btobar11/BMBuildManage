import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertCircle, RefreshCcw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  private handleReset = async () => {
    // Clear all caches
    localStorage.removeItem('BM_QUERY_CACHE');
    localStorage.removeItem('supabase.auth.token');
    sessionStorage.clear();
    
    // Unregister service workers to clear PWA cache
    if ('serviceWorker' in navigator) {
      try {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (const registration of registrations) {
          await registration.unregister();
        }
      } catch (e) {
        console.error('Failed to unregister service workers:', e);
      }
    }
    
    // Clear all localStorage keys related to the app
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('BM_') || key.includes('cache') || key.includes('query')) {
        localStorage.removeItem(key);
      }
    });
    
    window.location.reload();
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 border border-red-100 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="text-red-600 w-8 h-8" />
            </div>
            
            <h1 className="text-2xl font-bold text-slate-900 mb-2">Ups, algo salió mal</h1>
            <p className="text-slate-600 mb-8">
              La aplicación encontró un error inesperado al cargar. Esto puede deberse a datos antiguos en el navegador.
            </p>

            <div className="space-y-3">
              <button
                onClick={this.handleReset}
                className="w-full flex items-center justify-center gap-2 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors shadow-lg shadow-blue-200"
              >
                <RefreshCcw size={18} />
                Limpiar caché y reintentar
              </button>
              
              <button
                onClick={this.handleGoHome}
                className="w-full flex items-center justify-center gap-2 py-3 bg-white hover:bg-slate-50 text-slate-700 font-semibold rounded-xl border border-slate-200 transition-colors"
              >
                <Home size={18} />
                Volver al inicio
              </button>
            </div>

            {true && (
              <div className="mt-8 p-4 bg-slate-100 rounded-lg text-left overflow-auto max-h-40">
                <p className="text-xs font-mono text-red-600 break-all">
                  {this.state.error?.toString()}
                </p>
              </div>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
