import { toast } from 'react-hot-toast';
import { cn } from './cn';

interface ToastAlertProps {
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
}

export function showToast({ type, title, message }: ToastAlertProps) {
  const icons = {
    success: '✓',
    error: '✕',
    warning: '⚠',
    info: 'ℹ',
  };

  const styles = {
    success: 'border-emerald-500 bg-emerald-500/10 text-emerald-500',
    error: 'border-red-500 bg-red-500/10 text-red-500',
    warning: 'border-amber-500 bg-amber-500/10 text-amber-500',
    info: 'border-blue-500 bg-blue-500/10 text-blue-500',
  };

  toast.custom(
    (t) => (
      <div
        className={cn(
          'flex items-start gap-3 p-4 rounded-xl border shadow-xl backdrop-blur-lg max-w-sm',
          styles[type],
          t.visible ? 'animate-in slide-in-from-top-2 fade-in' : 'animate-out fade-out'
        )}
      >
        <span className="text-lg font-bold">{icons[type]}</span>
        <div className="flex-1">
          <p className="font-semibold text-foreground">{title}</p>
          {message && <p className="text-sm text-muted-foreground mt-0.5">{message}</p>}
        </div>
        <button
          onClick={() => toast.dismiss(t.id)}
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          ✕
        </button>
      </div>
    ),
    { duration: 4000 }
  );
}