import { RefreshCw, AlertCircle, CheckCircle, WifiOff } from 'lucide-react';

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className = '' }: SkeletonProps) {
  return (
    <div className={`bg-gradient-to-r from-slate-800 via-slate-700 to-slate-800 bg-[length:200%_100%] animate-shimmer rounded ${className}`} />
  );
}

export function CardSkeleton() {
  return (
    <div className="bg-card/40 border border-border/50 rounded-2xl p-6">
      <div className="flex items-start justify-between mb-4">
        <Skeleton className="w-12 h-12 rounded-xl" />
        <Skeleton className="w-20 h-6 rounded-lg" />
      </div>
      <Skeleton className="w-3/4 h-5 rounded mb-2" />
      <Skeleton className="w-1/2 h-4 rounded mb-4" />
      <div className="flex gap-2">
        <Skeleton className="w-16 h-6 rounded-full" />
        <Skeleton className="w-16 h-6 rounded-full" />
      </div>
    </div>
  );
}

export function TableRowSkeleton() {
  return (
    <div className="grid grid-cols-[1fr_150px_100px_140px_120px] gap-4 items-center px-8 py-4 border-b border-border">
      <div className="space-y-2">
        <Skeleton className="w-3/4 h-4 rounded" />
        <Skeleton className="w-1/2 h-3 rounded" />
      </div>
      <Skeleton className="w-20 h-6 rounded-full mx-auto" />
      <Skeleton className="w-12 h-6 rounded mx-auto" />
      <Skeleton className="w-24 h-4 rounded ml-auto" />
      <div className="flex gap-2 justify-end">
        <Skeleton className="w-8 h-8 rounded-lg" />
        <Skeleton className="w-8 h-8 rounded-lg" />
      </div>
    </div>
  );
}

export function StatsSkeleton() {
  return (
    <div className="grid grid-cols-4 gap-4">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="p-5 rounded-2xl border border-border bg-card/50">
          <Skeleton className="w-16 h-8 rounded mb-2" />
          <Skeleton className="w-24 h-4 rounded" />
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
    <div className="flex flex-col items-center justify-center py-20 gap-6">
      <div className="relative">
        <div className="w-20 h-20 border-4 border-emerald-500/10 border-t-emerald-500 rounded-full animate-spin" />
        <div className="absolute inset-2 flex items-center justify-center">
          <div className="w-8 h-8 bg-emerald-500/20 rounded-full animate-pulse" />
        </div>
      </div>
      
      <div className="text-center space-y-2">
        <p className="text-emerald-400 font-bold tracking-wide text-sm animate-pulse">
          {message}
        </p>
        {submessage && (
          <p className="text-muted-foreground text-xs">
            {submessage}
          </p>
        )}
      </div>
      
      <div className="w-64 h-1.5 bg-slate-800 rounded-full overflow-hidden">
        <div className="h-full bg-gradient-to-r from-emerald-600 via-emerald-400 to-emerald-600 animate-progress-shimmer rounded-full" />
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
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center animate-fade-in">
      <div className="bg-card border border-border rounded-2xl p-8 flex flex-col items-center gap-4 shadow-2xl">
        <div className="relative">
          <div className="w-12 h-12 border-3 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            <RefreshCw size={20} className="text-emerald-400 animate-spin" style={{ animationDirection: 'reverse' }} />
          </div>
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

export function ErrorState({ 
  error, 
  onRetry, 
  title = 'Algo salió mal',
  message 
}: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center animate-fade-in">
      <div className="w-20 h-20 bg-rose-500/10 rounded-full flex items-center justify-center mb-6 border border-rose-500/20">
        <AlertCircle size={40} className="text-rose-400" />
      </div>
      
      <h3 className="text-xl font-bold text-foreground mb-2">
        {title}
      </h3>
      
      <p className="text-muted-foreground text-sm max-w-md mb-6">
        {message || error?.message || 'No pudimos cargar los datos. Por favor intenta de nuevo.'}
      </p>
      
      <div className="flex gap-3">
        {onRetry && (
          <button
            onClick={onRetry}
            className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl transition-all"
          >
            <RefreshCw size={16} className="animate-spin-once" />
            Reintentar
          </button>
        )}
      </div>
    </div>
  );
}

interface ConnectionErrorProps {
  onRetry?: () => void;
}

export function ConnectionError({ onRetry }: ConnectionErrorProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center animate-fade-in">
      <div className="w-24 h-24 bg-amber-500/10 rounded-full flex items-center justify-center mb-6 border border-amber-500/20 relative">
        <WifiOff size={48} className="text-amber-400" />
        <div className="absolute -top-1 -right-1 w-6 h-6 bg-amber-500 rounded-full flex items-center justify-center">
          <span className="text-white text-xs font-bold">!</span>
        </div>
      </div>
      
      <h3 className="text-xl font-bold text-foreground mb-2">
        Sin conexión
      </h3>
      
      <p className="text-muted-foreground text-sm max-w-md mb-6">
        No pudimos conectarnos al servidor. Verifica tu conexión a internet e intenta nuevamente.
      </p>
      
      <div className="flex gap-3">
        {onRetry && (
          <button
            onClick={onRetry}
            className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl transition-all shadow-lg shadow-emerald-600/20"
          >
            <RefreshCw size={16} />
            Reintentar conexión
          </button>
        )}
      </div>
    </div>
  );
}

interface SuccessMessageProps {
  message?: string;
  onDismiss?: () => void;
}

export function SuccessMessage({ message = '¡Listo!', onDismiss }: SuccessMessageProps) {
  return (
    <div className="fixed bottom-6 right-6 bg-emerald-600 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 animate-slide-up z-50">
      <CheckCircle size={20} />
      <span className="font-semibold">{message}</span>
      {onDismiss && (
        <button onClick={onDismiss} className="ml-2 hover:bg-emerald-500 rounded-lg p-1 transition-colors">
          <span>×</span>
        </button>
      )}
    </div>
  );
}

interface LoadingDotsProps {
  text?: string;
}

export function LoadingDots({ text = 'Cargando' }: LoadingDotsProps) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-muted-foreground text-sm">{text}</span>
      <div className="flex gap-1">
        <span className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
        <span className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
        <span className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
      </div>
    </div>
  );
}

interface EmptyStateProps {
  icon: React.ElementType;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  variant?: 'default' | 'compact' | 'full';
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  variant = 'default'
}: EmptyStateProps) {
  const sizeClasses = {
    compact: { wrapper: 'w-16 h-16', icon: 32 },
    default: { wrapper: 'w-24 h-24', icon: 48 },
    full: { wrapper: 'w-32 h-32', icon: 64 }
  };
  
  const { wrapper, icon } = sizeClasses[variant];
  
  return (
    <div className="flex flex-col items-center justify-center py-16 px-8 text-center animate-fade-in">
      <div className={`${wrapper} bg-gradient-to-br from-slate-800 to-slate-900 rounded-3xl flex items-center justify-center mb-6 border border-border/50 shadow-2xl shadow-emerald-500/5`}>
        <Icon size={icon} className="text-emerald-500/50" />
      </div>
      
      <h3 className="text-xl font-bold text-foreground mb-2">
        {title}
      </h3>
      
      <p className="text-muted-foreground text-sm max-w-md mb-8">
        {description}
      </p>
      
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-2xl shadow-lg shadow-emerald-600/20 transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
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
      <div className="bg-card/30 rounded-3xl border border-border overflow-hidden">
        <div className="grid grid-cols-[1fr_150px_100px_140px_120px] gap-4 px-6 py-3 border-b border-border">
          {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-3 rounded" />)}
        </div>
        {Array.from({ length: count }).map((_, i) => (
          <TableRowSkeleton key={i} />
        ))}
      </div>
    );
  }
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  );
}
