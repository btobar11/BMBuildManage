import { AlertTriangle, Settings, ExternalLink } from 'lucide-react';

interface ConfigWarningProps {
  isDemo?: boolean;
}

export function ConfigWarning({ isDemo = false }: ConfigWarningProps) {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="max-w-lg w-full bg-white rounded-2xl shadow-xl p-8 border border-slate-200">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center">
            <AlertTriangle className="w-6 h-6 text-amber-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">
              {isDemo ? 'Modo Demo' : 'Configuración Requerida'}
            </h1>
            <p className="text-sm text-slate-500">
              {isDemo ? 'Estás usando la aplicación sin conexión al servidor' : 'Faltan variables de entorno'}
            </p>
          </div>
        </div>

        {isDemo ? (
          <div className="space-y-4">
            <p className="text-slate-600">
              No se pudo conectar al servidor API. Puedes explorar la interfaz en modo demo, pero los datos no se guardarán.
            </p>
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <h3 className="font-semibold text-amber-800 mb-2">Para producción:</h3>
              <ol className="text-sm text-amber-700 space-y-1 list-decimal list-inside">
                <li>Configura las variables de entorno en Vercel</li>
                <li>VITE_SUPABASE_URL</li>
                <li>VITE_SUPABASE_ANON_KEY</li>
                <li>VITE_API_URL</li>
              </ol>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-slate-600">
              La aplicación necesita configuración de Supabase para funcionar correctamente.
            </p>
            
            <div className="bg-slate-50 rounded-xl p-4 font-mono text-sm space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-slate-400">1.</span>
                <span className="text-slate-700">VITE_SUPABASE_URL</span>
                <span className="text-slate-400">=</span>
                <span className="text-slate-500">https://xxxxx.supabase.co</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-slate-400">2.</span>
                <span className="text-slate-700">VITE_SUPABASE_ANON_KEY</span>
                <span className="text-slate-400">=</span>
                <span className="text-slate-500">eyJ...</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-slate-400">3.</span>
                <span className="text-slate-700">VITE_API_URL</span>
                <span className="text-slate-400">=</span>
                <span className="text-slate-500">https://tu-api.vercel.app</span>
              </div>
            </div>

            <a
              href="https://vercel.com/docs/projects/environment-variables"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              <Settings size={16} />
              Cómo configurar en Vercel
              <ExternalLink size={14} />
            </a>
          </div>
        )}

        <div className="mt-6 pt-6 border-t border-slate-200">
          <button
            onClick={() => window.location.reload()}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors"
          >
            Reintentar conexión
          </button>
        </div>
      </div>
    </div>
  );
}
