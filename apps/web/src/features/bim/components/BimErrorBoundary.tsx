/**
 * BimErrorBoundary — React Error Boundary for BIM 3D Viewer
 *
 * Catches JavaScript errors during IFC parsing/rendering to prevent
 * white screen crashes from corrupted IFC files or WebGL failures.
 *
 * Design: Minimalist, clean, modern (Stripe/Linear style)
 * - Light background (bg-gray-50)
 * - Subtle borders
 * - Sans-serif typography hierarchy
 * - Emerald action button (#10b981)
 */
import { Component, type ReactNode, type ErrorInfo } from 'react';
import { RefreshCw, ArrowLeft, FileWarning } from 'lucide-react';

interface BimErrorBoundaryProps {
  children: ReactNode;
  /** Model name for context in error message */
  modelName?: string;
  /** Callback when user clicks retry */
  onRetry?: () => void;
  /** Callback when user clicks back */
  onBack?: () => void;
}

interface BimErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: { componentStack?: string | null } | null;
}

export class BimErrorBoundary extends Component<BimErrorBoundaryProps, BimErrorBoundaryState> {
  constructor(props: BimErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<BimErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[BimErrorBoundary] Caught error:', error);
    console.error('[BimErrorBoundary] Component stack:', errorInfo.componentStack);
    this.setState({ errorInfo });
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    this.props.onRetry?.();
  };

  handleBack = () => {
    this.props.onBack?.();
  };

  render() {
    if (this.state.hasError) {
      const { modelName } = this.props;
      const { error } = this.state;

      // Determine error type for better messaging
      const isParseError = error?.message?.toLowerCase().includes('parse') ||
                           error?.message?.toLowerCase().includes('ifc') ||
                           error?.message?.toLowerCase().includes('geometry');
      const isWebGLError = error?.message?.toLowerCase().includes('webgl') ||
                           error?.message?.toLowerCase().includes('context');

      const errorTitle = isWebGLError
        ? 'Error de WebGL'
        : isParseError
          ? 'Error al procesar el modelo'
          : 'Error inesperado';

      const errorMessage = isWebGLError
        ? 'El navegador no pudo inicializar el contexto 3D. Intente recargar la página o usar otro navegador.'
        : isParseError
          ? 'No se pudo procesar la geometría del modelo. Verifique la exportación IFC desde AutoCAD/Revit y asegúrese de que el archivo no esté corrupto.'
          : 'Ocurrió un error al cargar el visor 3D. Intente nuevamente.';

      return (
        <div className="w-full h-full min-h-[500px] flex items-center justify-center bg-gray-50 dark:bg-[#0c0e12] rounded-2xl border border-border overflow-hidden">
          <div className="max-w-md w-full mx-6">
            {/* Icon Container */}
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 rounded-full bg-red-50 dark:bg-red-500/10 flex items-center justify-center">
                <FileWarning
                  size={32}
                  className="text-red-500"
                  strokeWidth={1.5}
                />
              </div>
            </div>

            {/* Title */}
            <h3 className="text-lg font-semibold text-gray-900 dark:text-foreground text-center mb-2">
              {errorTitle}
            </h3>

            {/* Model name context */}
            {modelName && (
              <p className="text-xs text-gray-500 dark:text-muted-foreground text-center mb-3 font-mono truncate">
                {modelName}
              </p>
            )}

            {/* Error message */}
            <p className="text-sm text-gray-600 dark:text-muted-foreground text-center leading-relaxed mb-6">
              {errorMessage}
            </p>

            {/* Technical details (collapsed by default) */}
            <details className="mb-6 group">
              <summary className="text-xs text-gray-400 dark:text-muted-foreground cursor-pointer hover:text-gray-600 dark:hover:text-foreground transition-colors">
                Ver detalles técnicos
              </summary>
              <div className="mt-2 p-3 bg-gray-100 dark:bg-[#111318] rounded-lg overflow-auto max-h-32">
                <code className="text-[10px] text-gray-500 dark:text-muted-foreground font-mono break-all">
                  {error?.message || 'Error desconocido'}
                </code>
              </div>
            </details>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={this.handleBack}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-gray-600 dark:text-muted-foreground bg-white dark:bg-[#111318] border border-gray-200 dark:border-border hover:bg-gray-50 dark:hover:bg-[#16181d] transition-all active:scale-[0.98]"
              >
                <ArrowLeft size={16} />
                Volver
              </button>
              <button
                onClick={this.handleRetry}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-white bg-[#10b981] hover:bg-[#059669] transition-all active:scale-[0.98] shadow-sm"
              >
                <RefreshCw size={16} />
                Reintentar carga
              </button>
            </div>

            {/* Help link */}
            <p className="text-xs text-gray-400 dark:text-muted-foreground text-center mt-4">
              Si el problema persiste, verifique que el archivo IFC esté correctamente exportado desde su software BIM.
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Wrapper component to reset error boundary state
 * Usage: Wrap BimViewer with this component and provide onRetry prop
 */
interface BimErrorBoundaryWrapperProps {
  children: ReactNode;
  modelName?: string;
  onBack?: () => void;
  onRetry?: () => void;
  /** Key to force re-render when retry is triggered */
  retryKey?: string | number;
}

export function BimErrorBoundaryWrapper({
  children,
  modelName,
  onBack,
  onRetry,
  retryKey,
}: BimErrorBoundaryWrapperProps) {
  // Force re-mount of children when retryKey changes
  return (
    <BimErrorBoundary
      key={retryKey}
      modelName={modelName}
      onBack={onBack}
      onRetry={onRetry}
    >
      {children}
    </BimErrorBoundary>
  );
}