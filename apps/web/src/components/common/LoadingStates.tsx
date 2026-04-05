import { RefreshCw, AlertCircle, CheckCircle, WifiOff, Database, Server } from 'lucide-react';

export function Skeleton({ className = '' }: SkeletonProps) {
  return (
    <div className={`bg-gradient-to-r from-slate-800 via-slate-700 to-slate-800 bg-[length:200%_100%] animate-shimmer rounded ${className}`} />
  );
}

interface SkeletonProps {
  className?: string;
}

export function CardSkeleton() {
  return (
    <div className="bg-card/40 border border-border/50 rounded-2xl p-6 animate-pulse">
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
        <div key={i} className="p-5 rounded-2xl border border-border bg-card/50 animate-pulse">
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
    <div className="flex flex-col items-center justify-center py-24 gap-8">
      {/* Animated icon */}
      <div className="relative">
        <div className="w-24 h-24 rounded-full border-4 border-emerald-500/20 flex items-center justify-center animate-spin-slow">
          <div className="w-full h-full rounded-full border-4 border-transparent border-t-emerald-500" />
        </div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-14 h-14 bg-gradient-to-br from-emerald-500/30 to-emerald-600/30 rounded-full flex items-center justify-center animate-pulse-glow">
            <Database className="w-7 h-7 text-emerald-400 animate-bounce-subtle" />
          </div>
        </div>
        {/* Orbiting dots */}
        <div className="absolute inset-0 animate-orbit">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3 h-3 bg-emerald-400 rounded-full shadow-lg shadow-emerald-500/50" />
        </div>
      </div>
      
      {/* Text content */}
      <div className="text-center space-y-3">
        <p className="text-emerald-400 font-bold text-lg tracking-wide animate-pulse">
          {message}
        </p>
        {submessage && (
          <p className="text-slate-500 text-sm animate-pulse-subtle">
            {submessage}
          </p>
        )}
      </div>
      
      {/* Progress bar */}
      <div className="w-72 h-2 bg-slate-800 rounded-full overflow-hidden shadow-inner">
        <div className="h-full bg-gradient-to-r from-emerald-600 via-emerald-400 to-emerald-600 rounded-full animate-progress-bar" />
      </div>
      
      {/* Loading dots */}
      <div className="flex gap-2">
        <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-loading-dot" style={{ animationDelay: '0ms' }} />
        <span className="w-2.5 h-2.5 bg-emerald-400 rounded-full animate-loading-dot" style={{ animationDelay: '150ms' }} />
        <span className="w-2.5 h-2.5 bg-emerald-300 rounded-full animate-loading-dot" style={{ animationDelay: '300ms' }} />
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
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center animate-fade-in">
      <div className="bg-card border-2 border-emerald-500/30 rounded-3xl p-10 flex flex-col items-center gap-6 shadow-2xl shadow-emerald-500/10 animate-scale-in">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
          <Server className="absolute inset-0 m-auto w-8 h-8 text-emerald-400 animate-pulse" style={{ animationDuration: '1.5s' }} />
        </div>
        <p className="text-foreground font-bold text-lg animate-pulse">{message}</p>
        <div className="w-48 h-1.5 bg-slate-800 rounded-full overflow-hidden">
          <div className="h-full bg-emerald-500 rounded-full animate-progress-bar" />
        </div>
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
    <div className="flex flex-col items-center justify-center py-16 text-center animate-fade-in">
      <div className="w-24 h-24 bg-rose-500/10 rounded-full flex items-center justify-center mb-6 border-2 border-rose-500/20 animate-shake">
        <AlertCircle size={48} className="text-rose-400" />
      </div>
      
      <h3 className="text-2xl font-bold text-foreground mb-2">{title}</h3>
      
      <p className="text-slate-400 text-sm max-w-md mb-8">
        {message || error?.message || 'No pudimos cargar los datos. Por favor intenta de nuevo.'}
      </p>
      
      {onRetry && (
        <button
          onClick={onRetry}
          className="flex items-center gap-3 px-6 py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-2xl transition-all shadow-lg shadow-emerald-600/30 hover:scale-105 active:scale-95"
        >
          <RefreshCw size={18} className="animate-spin-once" />
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
    <div className="flex flex-col items-center justify-center py-16 text-center animate-fade-in">
      <div className="w-28 h-28 bg-amber-500/10 rounded-full flex items-center justify-center mb-6 border-2 border-amber-500/20 relative animate-pulse">
        <WifiOff size={56} className="text-amber-400" />
        <div className="absolute -top-2 -right-2 w-8 h-8 bg-amber-500 rounded-full flex items-center justify-center animate-bounce">
          <span className="text-white font-bold text-sm">!</span>
        </div>
      </div>
      
      <h3 className="text-2xl font-bold text-foreground mb-2">Sin conexión al servidor</h3>
      
      <p className="text-slate-400 text-sm max-w-md mb-8">
        No pudimos conectar con el servidor. Verifica tu conexión a internet e intenta nuevamente.
      </p>
      
      {onRetry && (
        <button
          onClick={onRetry}
          className="flex items-center gap-3 px-8 py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-2xl transition-all shadow-lg shadow-emerald-600/30 hover:scale-105 active:scale-95"
        >
          <RefreshCw size={20} />
          Reintentar conexión
        </button>
      )}
    </div>
  );
}

export function SuccessMessage({ message = '¡Listo!', onDismiss }: SuccessMessageProps) {
  return (
    <div className="fixed bottom-6 right-6 bg-emerald-600 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 animate-slide-up z-50">
      <CheckCircle size={22} className="animate-bounce-subtle" />
      <span className="font-bold">{message}</span>
      {onDismiss && (
        <button onClick={onDismiss} className="ml-2 hover:bg-emerald-500 rounded-lg p-1 transition-colors">
          <span className="text-xl">×</span>
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
      <span className="text-slate-400 text-sm">{text}</span>
      <div className="flex gap-1.5">
        <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-loading-dot" style={{ animationDelay: '0ms' }} />
        <span className="w-2.5 h-2.5 bg-emerald-400 rounded-full animate-loading-dot" style={{ animationDelay: '150ms' }} />
        <span className="w-2.5 h-2.5 bg-emerald-300 rounded-full animate-loading-dot" style={{ animationDelay: '300ms' }} />
      </div>
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

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  variant = 'default'
}: EmptyStateProps) {
  const sizes = {
    compact: { wrapper: 'w-16 h-16', icon: 32 },
    default: { wrapper: 'w-24 h-24', icon: 48 },
    full: { wrapper: 'w-32 h-32', icon: 64 }
  };
  
  const { wrapper, icon } = sizes[variant];
  
  return (
    <div className="flex flex-col items-center justify-center py-16 px-8 text-center animate-fade-in">
      <div className={`${wrapper} bg-gradient-to-br from-slate-800 to-slate-900 rounded-3xl flex items-center justify-center mb-6 border border-slate-700 shadow-2xl shadow-emerald-500/5 animate-float`}>
        <Icon size={icon} className="text-emerald-500/60" />
      </div>
      
      <h3 className="text-2xl font-bold text-foreground mb-2">{title}</h3>
      
      <p className="text-slate-400 text-sm max-w-md mb-8">{description}</p>
      
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="px-8 py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-2xl shadow-lg shadow-emerald-600/30 transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
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
