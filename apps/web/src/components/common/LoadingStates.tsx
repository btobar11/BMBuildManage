import { RefreshCw, AlertCircle, CheckCircle, WifiOff, Loader2, Package, Calculator } from 'lucide-react';

export function Skeleton({ className = '' }: SkeletonProps) {
  return (
    <div className={`bg-slate-200 dark:bg-slate-800 animate-pulse rounded ${className}`} />
  );
}

interface SkeletonProps {
  className?: string;
}

export function CardSkeleton() {
  return (
    <div className="bg-card/40 border border-border/50 rounded-lg p-4">
      <div className="flex items-start justify-between mb-3">
        <Skeleton className="w-10 h-10 rounded-lg" />
        <Skeleton className="w-16 h-5 rounded" />
      </div>
      <Skeleton className="w-3/4 h-4 rounded mb-2" />
      <Skeleton className="w-1/2 h-3 rounded" />
    </div>
  );
}

export function TableRowSkeleton() {
  return (
    <div className="flex items-center gap-4 py-3 border-b border-border px-2">
      <Skeleton className="flex-1 h-4 rounded" />
      <Skeleton className="w-16 h-6 rounded" />
      <Skeleton className="w-12 h-6 rounded" />
      <Skeleton className="w-20 h-4 rounded" />
    </div>
  );
}

export function StatsSkeleton() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="p-4 rounded-lg border border-border bg-card/50">
          <Skeleton className="w-16 h-8 rounded mb-2" />
          <Skeleton className="w-24 h-3 rounded" />
        </div>
      ))}
    </div>
  );
}

interface LoadingScreenProps {
  message?: string;
  submessage?: string;
}

export function LoadingScreen({ message = 'Cargando...', submessage }: LoadingScreenProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-4 min-h-[200px]">
      <div className="relative">
        <Loader2 size={40} className="text-emerald-500 animate-spin" />
        <div className="absolute inset-0 bg-emerald-500/20 blur-xl rounded-full animate-pulse" />
      </div>
      <div className="text-center">
        <p className="text-foreground font-medium text-lg">{message}</p>
        {submessage && <p className="text-muted-foreground text-sm mt-1">{submessage}</p>}
      </div>
    </div>
  );
}

interface LoadingOverlayProps {
  visible: boolean;
  message?: string;
}

export function LoadingOverlay({ visible, message = 'Procesando...' }: LoadingOverlayProps) {
  if (!visible) return null;
  
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-card border border-border rounded-2xl p-8 flex flex-col items-center gap-4 shadow-2xl">
        <div className="relative">
          <Loader2 size={32} className="text-emerald-500 animate-spin" />
          <div className="absolute inset-0 bg-emerald-500/20 blur-lg rounded-full animate-pulse" />
        </div>
        <p className="text-foreground font-medium">{message}</p>
      </div>
    </div>
  );
}

interface ErrorStateProps {
  error?: Error | null;
  onRetry?: () => void;
  title?: string;
  message?: string;
}

export function ErrorState({ error, onRetry, title = 'Algo salió mal', message }: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center min-h-[200px]">
      <div className="w-16 h-16 bg-rose-100 dark:bg-rose-900/30 rounded-full flex items-center justify-center mb-4">
        <AlertCircle size={32} className="text-rose-500" />
      </div>
      <h3 className="text-xl font-bold text-foreground mb-2">{title}</h3>
      <p className="text-muted-foreground max-w-md mb-6">
        {message || error?.message || 'No pudimos cargar los datos. Por favor intenta de nuevo.'}
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-xl transition-all"
        >
          <RefreshCw size={18} />
          Reintentar
        </button>
      )}
    </div>
  );
}

interface ConnectionErrorProps {
  onRetry?: () => void;
}

export function ConnectionError({ onRetry }: ConnectionErrorProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center min-h-[200px]">
      <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mb-4">
        <WifiOff size={32} className="text-amber-500" />
      </div>
      <h3 className="text-xl font-bold text-foreground mb-2">Sin conexión</h3>
      <p className="text-muted-foreground max-w-md mb-6">
        No pudimos conectar con el servidor. Verifica tu conexión a internet.
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-xl transition-all"
        >
          <RefreshCw size={18} />
          Reintentar
        </button>
      )}
    </div>
  );
}

export function SuccessMessage({ message = '¡Listo!', onDismiss }: SuccessMessageProps) {
  return (
    <div className="fixed bottom-6 right-6 bg-emerald-600 text-white px-5 py-3 rounded-xl shadow-xl flex items-center gap-3 z-50 animate-in slide-in-from-bottom-2 fade-in">
      <CheckCircle size={20} />
      <span className="font-medium">{message}</span>
      {onDismiss && (
        <button onClick={onDismiss} className="ml-2 hover:bg-emerald-500 rounded-lg p-1 transition-colors">
          ×
        </button>
      )}
    </div>
  );
}

interface SuccessMessageProps {
  message?: string;
  onDismiss?: () => void;
}

export function LoadingDots({ text = 'Cargando' }: LoadingDotsProps) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-muted-foreground">{text}</span>
      <span className="flex gap-1.5">
        <span className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
        <span className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
        <span className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
      </span>
    </div>
  );
}

interface LoadingDotsProps {
  text?: string;
}

interface EmptyStateProps {
  icon: React.ElementType;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  variant?: 'default' | 'compact' | 'full';
}

interface CatalogEmptyStateProps {
  title?: string;
  description?: string;
  variant?: 'default' | 'compact' | 'full';
}

export function CatalogEmptyState({
  title = 'Tu catálogo se está configurando',
  description = 'Muy pronto tendrás acceso a los APUs base de la industria',
  variant = 'default'
}: CatalogEmptyStateProps) {
  const sizes = {
    compact: { wrapper: 'w-12 h-12', icon: 24 },
    default: { wrapper: 'w-16 h-16', icon: 32 },
    full: { wrapper: 'w-20 h-20', icon: 40 }
  };
  
  const { wrapper, icon } = sizes[variant];
  
  return (
    <div className="flex flex-col items-center justify-center py-16 px-8 text-center min-h-[200px]">
      <div className={`${wrapper} bg-gradient-to-br from-emerald-500/10 to-blue-500/10 border border-emerald-500/20 rounded-2xl flex items-center justify-center mb-4 animate-pulse`}>
        <RefreshCw size={icon} className="text-emerald-400" />
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-1">{title}</h3>
      <p className="text-muted-foreground text-sm max-w-sm">{description}</p>
    </div>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  variant = 'default'
}: EmptyStateProps) {
  const sizes = {
    compact: { wrapper: 'w-12 h-12', icon: 24 },
    default: { wrapper: 'w-16 h-16', icon: 32 },
    full: { wrapper: 'w-20 h-20', icon: 40 }
  };
  
  const { wrapper, icon } = sizes[variant];
  
  return (
    <div className="flex flex-col items-center justify-center py-16 px-8 text-center min-h-[200px]">
      <div className={`${wrapper} bg-muted rounded-2xl flex items-center justify-center mb-4`}>
        <Icon size={icon} className="text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-1">{title}</h3>
      <p className="text-muted-foreground text-sm max-w-sm mb-6">{description}</p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-xl transition-colors"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}

interface SkeletonGridProps {
  count?: number;
  variant?: 'cards' | 'rows';
}

export function SkeletonGrid({ count = 6, variant = 'cards' }: SkeletonGridProps) {
  if (variant === 'rows') {
    return (
      <div className="bg-card/30 rounded-lg border border-border overflow-hidden">
        {Array.from({ length: count }).map((_, i) => (
          <TableRowSkeleton key={i} />
        ))}
      </div>
    );
  }
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  );
}

interface InlineLoadingProps {
  text?: string;
}

export function InlineLoading({ text = 'Cargando...' }: InlineLoadingProps) {
  return (
    <div className="flex items-center gap-2 py-4">
      <Loader2 size={16} className="text-emerald-500 animate-spin" />
      <span className="text-muted-foreground text-sm">{text}</span>
    </div>
  );
}