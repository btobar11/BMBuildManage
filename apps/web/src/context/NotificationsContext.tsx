import { createContext, useContext, useReducer, useCallback, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

// ============================================================
// Types
// ============================================================

export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message?: string;
  duration?: number; // ms, 0 = sticky
  action?: {
    label: string;
    onClick: () => void;
  };
  createdAt: number;
}

type Action =
  | { type: 'ADD'; notification: Notification }
  | { type: 'REMOVE'; id: string }
  | { type: 'CLEAR_ALL' };

// ============================================================
// Reducer
// ============================================================

function reducer(state: Notification[], action: Action): Notification[] {
  switch (action.type) {
    case 'ADD':
      return [...state.slice(-4), action.notification]; // max 5
    case 'REMOVE':
      return state.filter((n) => n.id !== action.id);
    case 'CLEAR_ALL':
      return [];
    default:
      return state;
  }
}

// ============================================================
// Context
// ============================================================

interface NotificationsContextType {
  notifications: Notification[];
  notify: (options: Omit<Notification, 'id' | 'createdAt'>) => string;
  success: (title: string, message?: string) => string;
  error: (title: string, message?: string) => string;
  warning: (title: string, message?: string) => string;
  info: (title: string, message?: string) => string;
  dismiss: (id: string) => void;
  clearAll: () => void;
}

const NotificationsContext = createContext<NotificationsContextType | undefined>(undefined);

// ============================================================
// Provider
// ============================================================

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const [notifications, dispatch] = useReducer(reducer, []);

  const notify = useCallback(
    (options: Omit<Notification, 'id' | 'createdAt'>): string => {
      const id = `notif_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      const duration = options.duration ?? 5000;

      const notification: Notification = {
        ...options,
        id,
        duration,
        createdAt: Date.now(),
      };

      dispatch({ type: 'ADD', notification });

      if (duration > 0) {
        setTimeout(() => {
          dispatch({ type: 'REMOVE', id });
        }, duration);
      }

      return id;
    },
    [],
  );

  const success = useCallback(
    (title: string, message?: string) => notify({ type: 'success', title, message }),
    [notify],
  );
  const error = useCallback(
    (title: string, message?: string) =>
      notify({ type: 'error', title, message, duration: 8000 }),
    [notify],
  );
  const warning = useCallback(
    (title: string, message?: string) =>
      notify({ type: 'warning', title, message, duration: 6000 }),
    [notify],
  );
  const info = useCallback(
    (title: string, message?: string) => notify({ type: 'info', title, message }),
    [notify],
  );
  const dismiss = useCallback(
    (id: string) => dispatch({ type: 'REMOVE', id }),
    [],
  );
  const clearAll = useCallback(() => dispatch({ type: 'CLEAR_ALL' }), []);

  return (
    <NotificationsContext.Provider
      value={{ notifications, notify, success, error, warning, info, dismiss, clearAll }}
    >
      {children}
      {createPortal(<NotificationsContainer />, document.body)}
    </NotificationsContext.Provider>
  );
}

// ============================================================
// Hook
// ============================================================

export function useNotifications() {
  const ctx = useContext(NotificationsContext);
  if (!ctx) throw new Error('useNotifications must be used inside NotificationsProvider');
  return ctx;
}

// ============================================================
// UI Components
// ============================================================

const ICONS: Record<NotificationType, string> = {
  success: '✅',
  error: '❌',
  warning: '⚠️',
  info: 'ℹ️',
};

const STYLES: Record<NotificationType, { container: string; icon: string; title: string }> = {
  success: {
    container: 'bg-white border-l-4 border-emerald-500',
    icon: 'text-emerald-500',
    title: 'text-emerald-900',
  },
  error: {
    container: 'bg-white border-l-4 border-red-500',
    icon: 'text-red-500',
    title: 'text-red-900',
  },
  warning: {
    container: 'bg-white border-l-4 border-amber-500',
    icon: 'text-amber-500',
    title: 'text-amber-900',
  },
  info: {
    container: 'bg-white border-l-4 border-blue-500',
    icon: 'text-blue-500',
    title: 'text-blue-900',
  },
};

function NotificationsContainer() {
  const { notifications, dismiss } = useNotifications();

  if (notifications.length === 0) return null;

  return (
    <div
      aria-live="polite"
      aria-atomic="false"
      className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none"
      style={{ maxWidth: '400px', width: 'calc(100vw - 2rem)' }}
    >
      {notifications.map((n) => (
        <NotificationCard key={n.id} notification={n} onDismiss={dismiss} />
      ))}
    </div>
  );
}

interface NotificationCardProps {
  notification: Notification;
  onDismiss: (id: string) => void;
}

function NotificationCard({ notification: n, onDismiss }: NotificationCardProps) {
  const styles = STYLES[n.type];

  return (
    <div
      id={`notification-${n.id}`}
      role="alert"
      className={`
        pointer-events-auto relative flex items-start gap-3 px-4 py-3 rounded-xl shadow-lg
        ${styles.container}
        animate-in slide-in-from-right-5 fade-in duration-300
      `}
      style={{
        animation: 'slideInRight 0.3s ease-out',
      }}
    >
      <span className={`text-lg flex-shrink-0 mt-0.5 ${styles.icon}`}>
        {ICONS[n.type]}
      </span>

      <div className="flex-1 min-w-0">
        <p className={`text-sm font-semibold ${styles.title}`}>{n.title}</p>
        {n.message && (
          <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{n.message}</p>
        )}
        {n.action && (
          <button
            onClick={n.action.onClick}
            className="mt-1.5 text-xs font-medium text-blue-600 hover:text-blue-700 underline"
          >
            {n.action.label}
          </button>
        )}
      </div>

      <button
        onClick={() => onDismiss(n.id)}
        aria-label="Cerrar notificación"
        className="flex-shrink-0 text-slate-300 hover:text-slate-500 transition-colors text-lg leading-none"
      >
        ×
      </button>

      {/* Progress bar for auto-dismiss */}
      {n.duration && n.duration > 0 && (
        <div
          className="absolute bottom-0 left-0 h-0.5 bg-current opacity-20 rounded-full"
          style={{
            animation: `shrink ${n.duration}ms linear forwards`,
            width: '100%',
          }}
        />
      )}
    </div>
  );
}
