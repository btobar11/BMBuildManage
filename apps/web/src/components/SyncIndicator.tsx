/**
 * SyncIndicator - Componente visual de estado de sincronizacion
 *
 * Estados:
 * - Verde (sincronizado): Todo en orden, datos guardados en servidor
 * - Amarillo (offline/pendiente): Sin conexion o datos locales pendientes
 * - Rojo (error): Problemas de sincronizacion
 *
 * Optimizado para uso en campo con alta visibilidad bajo luz solar.
 */

import { useState, useEffect, useCallback } from 'react';
import { Cloud, CloudOff, CloudUpload, RefreshCw, AlertTriangle } from 'lucide-react';
import { cn } from '../utils/cn';

export type SyncStatus = 'synced' | 'offline' | 'syncing' | 'pending' | 'error';

interface StatusConfig {
  icon: typeof Cloud;
  color: string;
  bg: string;
  border: string;
  label: string;
  description: string;
  animate?: boolean;
}

interface SyncIndicatorProps {
  className?: string;
  compact?: boolean;
  showLabel?: boolean;
  onRetry?: () => void;
}

export function SyncIndicator({
  className,
  compact = false,
  showLabel = true,
  onRetry
}: SyncIndicatorProps) {
  const [status, setStatus] = useState<SyncStatus>('synced');
  const [pendingCount, setPendingCount] = useState(0);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [lastSync, setLastSync] = useState<Date | null>(null);

  // Listen for online/offline events
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      // Auto-sync when coming back online
      setStatus('syncing');
      setTimeout(() => {
        if (pendingCount === 0) {
          setStatus('synced');
          setLastSync(new Date());
        } else {
          setStatus('pending');
        }
      }, 1000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setStatus('offline');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [pendingCount]);

  // Listen for Service Worker messages
  useEffect(() => {
    const handleSWMessage = (event: MessageEvent) => {
      const { type } = event.data || {};

      switch (type) {
        case 'MUTATION_QUEUED':
          setPendingCount(prev => prev + 1);
          if (!isOnline) {
            setStatus('pending');
          }
          break;

        case 'MUTATION_SYNCED':
          setPendingCount(prev => Math.max(0, prev - 1));
          setLastSync(new Date());
          break;

        case 'PENDING_COUNT':
          setPendingCount(event.data?.count || 0);
          break;
      }
    };

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', handleSWMessage);

      // Request pending count on mount
      navigator.serviceWorker.ready.then(registration => {
        registration.active?.postMessage({ type: 'GET_PENDING_COUNT' });
      });
    }

    return () => {
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.removeEventListener('message', handleSWMessage);
      }
    };
  }, [isOnline]);

  // Check for pending mutations in localStorage (fallback)
  useEffect(() => {
    const stored = localStorage.getItem('bm-pending-mutations');
    if (stored) {
      try {
        const mutations = JSON.parse(stored);
        setPendingCount(mutations.length);
      } catch {
        // Invalid data, clear it
        localStorage.removeItem('bm-pending-mutations');
      }
    }
  }, []);

  // Determine display status
  const displayStatus: SyncStatus = !isOnline
    ? 'offline'
    : pendingCount > 0
      ? 'pending'
      : status;

  const statusConfig: Record<SyncStatus, StatusConfig> = {
    synced: {
      icon: Cloud,
      color: 'text-green-500',
      bg: 'bg-green-500/10',
      border: 'border-green-500/30',
      label: 'Sincronizado',
      description: 'Todos los datos guardados',
    },
    offline: {
      icon: CloudOff,
      color: 'text-amber-500',
      bg: 'bg-amber-500/10',
      border: 'border-amber-500/30',
      label: 'Sin Conexión',
      description: 'Guardando localmente',
    },
    pending: {
      icon: CloudUpload,
      color: 'text-amber-500',
      bg: 'bg-amber-500/10',
      border: 'border-amber-500/30',
      label: `${pendingCount} pendiente${pendingCount > 1 ? 's' : ''}`,
      description: 'Datos esperando sincronización',
    },
    syncing: {
      icon: RefreshCw,
      color: 'text-blue-500',
      bg: 'bg-blue-500/10',
      border: 'border-blue-500/30',
      label: 'Sincronizando...',
      description: 'Enviando datos al servidor',
      animate: true,
    },
    error: {
      icon: AlertTriangle,
      color: 'text-red-500',
      bg: 'bg-red-500/10',
      border: 'border-red-500/30',
      label: 'Error',
      description: 'Problema de sincronización',
    },
  };

  const config = statusConfig[displayStatus];
  const IconComponent = config.icon;

  const handleRetry = useCallback(() => {
    if (onRetry) {
      onRetry();
    } else if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then(registration => {
        registration.active?.postMessage({ type: 'FORCE_SYNC' });
        setStatus('syncing');
      });
    }
  }, [onRetry]);

  // Keyboard shortcut: R to retry
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'r' && e.ctrlKey && displayStatus === 'error') {
        handleRetry();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [displayStatus, handleRetry]);

  if (compact) {
    return (
      <div
        data-testid="sync-status"
        className={cn(
          'flex items-center gap-1.5 px-2 py-1 rounded-lg border transition-all',
          config.bg,
          config.border,
          className
        )}
        title={`${config.label}: ${config.description}`}
        role="status"
        aria-live="polite"
        aria-label={config.label}
      >
        <IconComponent
          size={14}
          className={cn(
            config.color,
            config.animate && 'animate-spin'
          )}
        />
        {showLabel && (
          <span className={cn('text-xs font-medium', config.color)}>
            {config.label}
          </span>
        )}
      </div>
    );
  }

  return (
    <div
      data-testid="sync-status"
      className={cn(
        'flex items-center gap-3 px-4 py-2.5 rounded-xl border transition-all',
        config.bg,
        config.border,
        className
      )}
      role="status"
      aria-live="polite"
      aria-label={`Estado de sincronización: ${config.label}`}
    >
      <div className={cn(
        'relative flex items-center justify-center w-10 h-10 rounded-full',
        config.bg
      )}>
        <IconComponent
          size={22}
          className={cn(
            config.color,
            config.animate && 'animate-spin'
          )}
        />

        {/* Pulse animation for pending/syncing */}
        {(displayStatus === 'pending' || displayStatus === 'syncing') && (
          <span className={cn(
            'absolute inset-0 rounded-full animate-ping opacity-30',
            config.bg
          )} />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className={cn(
          'text-sm font-semibold',
          config.color
        )}>
          {config.label}
        </div>
        <div className="text-xs text-muted-foreground truncate">
          {config.description}
          {lastSync && displayStatus === 'synced' && (
            <span className="ml-1 opacity-70">
              ({lastSync.toLocaleTimeString()})
            </span>
          )}
        </div>
      </div>

      {/* Retry button for errors */}
      {displayStatus === 'error' && (
        <button
          onClick={handleRetry}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium',
            'bg-red-500/20 hover:bg-red-500/30 text-red-400',
            'border border-red-500/30 transition-colors',
            'focus:outline-none focus:ring-2 focus:ring-red-500/50'
          )}
          aria-label="Reintentar sincronización"
        >
          <RefreshCw size={12} />
          Reintentar
        </button>
      )}

      {/* Pending count badge */}
      {pendingCount > 0 && displayStatus !== 'syncing' && (
        <div className={cn(
          'flex items-center justify-center min-w-[24px] h-6 px-2 rounded-full',
          'bg-amber-500/20 text-amber-400 text-xs font-bold',
          'border border-amber-500/30'
        )}>
          {pendingCount}
        </div>
      )}
    </div>
  );
}

// Minimal inline version for headers
export function SyncIndicatorInline({ className }: { className?: string }) {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingCount, setPendingCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const handleSWMessage = (event: MessageEvent) => {
      const { type, count } = event.data || {};
      if (type === 'SYNC_COMPLETED' || type === 'MUTATION_SYNCED') {
        setPendingCount(0);
        setIsSyncing(false);
      } else if (type === 'MUTATION_QUEUED') {
        if (typeof count === 'number') {
          setPendingCount(count);
        } else {
          setPendingCount(prev => prev + 1);
        }
      }
    };

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', handleSWMessage);
      
      // Request initial count
      navigator.serviceWorker.ready.then(reg => {
        reg.active?.postMessage({ type: 'GET_PENDING_COUNT' });
      });
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.removeEventListener('message', handleSWMessage);
      }
    };
  }, []);

  const status = !isOnline ? 'offline' : pendingCount > 0 ? 'pending' : isSyncing ? 'syncing' : 'synced';

  const colors = {
    synced: 'text-green-500',
    offline: 'text-amber-500',
    pending: 'text-amber-400',
    syncing: 'text-blue-500',
  };

  const icons = {
    synced: Cloud,
    offline: CloudOff,
    pending: CloudUpload,
    syncing: RefreshCw,
  };

  const Icon = icons[status];

  return (
    <div
      data-testid="sync-status"
      className={cn('flex items-center gap-1.5 px-2 py-1 rounded-lg border border-transparent hover:bg-muted/50 transition-colors', className)}
      role="status"
      title={status === 'offline' ? 'Sin conexión: Cambios pendientes' : status === 'pending' ? 'Sincronización pendiente' : 'Sincronizado'}
    >
      <Icon size={16} className={cn(colors[status], status === 'syncing' && 'animate-spin')} />
      {pendingCount > 0 && (
        <span className={cn('text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20', colors[status])}>
          {pendingCount}
        </span>
      )}
    </div>
  );
}

export default SyncIndicator;