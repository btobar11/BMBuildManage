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
        <div key={i} className="p-4 rounded-2xl border border-border bg-card/50 animate-pulse">
          <Skeleton className="w-16 h-8 rounded mb-2" />
          <Skeleton className="w-24 h-4 rounded" />
        </div>
      ))}
    </div>
  );
}

export function LoadingScreen({ message = 'Cargando...' }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-32 gap-8">
      <div className="relative">
        <div className="w-16 h-16 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-3 h-3 bg-emerald-500 rounded-full animate-ping" />
        </div>
      </div>
      
      <div className="text-center space-y-3">
        <p className="text-emerald-400 font-bold tracking-widest uppercase text-sm animate-pulse">
          {message}
        </p>
        <div className="w-64 h-1 bg-slate-800 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-transparent via-emerald-500 to-transparent animate-progress-shimmer" />
        </div>
      </div>
    </div>
  );
}

export function LoadingDots({ text = 'Cargando' }: { text?: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-muted-foreground text-sm">{text}</span>
      <div className="flex gap-1">
        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
      </div>
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
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  variant?: 'default' | 'compact' | 'full';
}) {
  const sizeClasses = {
    compact: { wrapper: 'w-16 h-16', icon: 32 },
    default: { wrapper: 'w-24 h-24', icon: 48 },
    full: { wrapper: 'w-32 h-32', icon: 64 }
  };
  
  const { wrapper, icon } = sizeClasses[variant];
  
  return (
    <div className="flex flex-col items-center justify-center py-16 px-8 text-center">
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

export function SkeletonGrid({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  );
}
