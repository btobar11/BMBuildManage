import { useState, useEffect, useRef, type ReactNode } from 'react';
import { X } from 'lucide-react';
import { cn } from '../utils/cn';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  className?: string;
  showClose?: boolean;
  preventClose?: boolean;
}

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  className,
  showClose = true,
  preventClose = false,
}: ModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !preventClose) {
        onClose();
      }
    };

    if (isOpen) {
      window.addEventListener('keydown', handleEscape);
    }

    return () => {
      window.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose, preventClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={preventClose ? undefined : onClose}
      />
      <div
        className={cn(
          'relative bg-card border border-border rounded-2xl shadow-2xl w-full max-w-lg mx-4 animate-in zoom-in-95 fade-in duration-200',
          className
        )}
      >
        {title && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-border">
            <h2 className="text-lg font-bold text-foreground">{title}</h2>
            {showClose && !preventClose && (
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
              >
                <X size={18} />
              </button>
            )}
          </div>
        )}
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string | ReactNode;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
  isLoading?: boolean;
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  variant = 'info',
  isLoading = false,
}: ConfirmModalProps) {
  const variantStyles = {
    danger: {
      confirm: 'bg-red-600 hover:bg-red-500 text-white shadow-red-600/25',
      icon: 'text-red-500',
      iconBg: 'bg-red-500/10',
    },
    warning: {
      confirm: 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-600/25',
      icon: 'text-amber-500',
      iconBg: 'bg-amber-500/10',
    },
    info: {
      confirm: 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/25',
      icon: 'text-blue-500',
      iconBg: 'bg-blue-500/10',
    },
  };

  const styles = variantStyles[variant];

  return (
    <Modal isOpen={isOpen} onClose={onClose} showClose={false} preventClose={isLoading}>
      <div className="text-center">
        <div
          className={cn(
            'w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4',
            styles.iconBg
          )}
        >
          <svg
            className={cn('w-8 h-8', styles.icon)}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>
        <h3 className="text-xl font-bold text-foreground mb-2">{title}</h3>
        <p className="text-muted-foreground mb-6">{message}</p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="px-6 py-2.5 rounded-xl border border-border text-foreground hover:bg-muted transition-colors font-medium disabled:opacity-50"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className={cn(
              'px-6 py-2.5 rounded-xl font-medium transition-all disabled:opacity-50 shadow-lg',
              styles.confirm
            )}
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Procesando...
              </span>
            ) : (
              confirmText
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
}

interface PromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (value: string) => void;
  title: string;
  message?: string;
  placeholder?: string;
  submitText?: string;
  defaultValue?: string;
  isLoading?: boolean;
}

export function PromptModal({
  isOpen,
  onClose,
  onSubmit,
  title,
  message,
  placeholder = '',
  submitText = 'Crear',
  defaultValue = '',
  isLoading = false,
}: PromptModalProps) {
  const [value, setValue] = useState(() => defaultValue);
  const prevOpenRef = useRef(false);

  useEffect(() => {
    if (isOpen && !prevOpenRef.current) {
      setValue(defaultValue);
    }
    prevOpenRef.current = isOpen;
  }, [isOpen, defaultValue]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (value.trim()) {
      onSubmit(value.trim());
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} showClose={!isLoading} preventClose={isLoading}>
      <form onSubmit={handleSubmit}>
        <h3 className="text-xl font-bold text-foreground mb-2">{title}</h3>
        {message && <p className="text-muted-foreground mb-4">{message}</p>}
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={placeholder}
          disabled={isLoading}
          autoFocus
          className="w-full px-4 py-3 bg-background border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all mb-4 disabled:opacity-50"
        />
        <div className="flex gap-3 justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 rounded-xl border border-border text-foreground hover:bg-muted transition-colors font-medium disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isLoading || !value.trim()}
            className="px-6 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium transition-all shadow-lg shadow-blue-600/25 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Creando...' : submitText}
          </button>
        </div>
      </form>
    </Modal>
  );
}

interface AlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string | ReactNode;
  variant?: 'success' | 'error' | 'info' | 'warning';
  buttonText?: string;
}

export function AlertModal({
  isOpen,
  onClose,
  title,
  message,
  variant = 'info',
  buttonText = 'Entendido',
}: AlertModalProps) {
  const variantStyles = {
    success: {
      bg: 'bg-emerald-500/10',
      text: 'text-emerald-500',
      border: 'border-emerald-500/30',
    },
    error: {
      bg: 'bg-red-500/10',
      text: 'text-red-500',
      border: 'border-red-500/30',
    },
    info: {
      bg: 'bg-blue-500/10',
      text: 'text-blue-500',
      border: 'border-blue-500/30',
    },
    warning: {
      bg: 'bg-amber-500/10',
      text: 'text-amber-500',
      border: 'border-amber-500/30',
    },
  };

  const styles = variantStyles[variant];

  const icons = {
    success: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
      </svg>
    ),
    error: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
      </svg>
    ),
    info: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    warning: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    ),
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="text-center">
        <div className={cn('w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4', styles.bg)}>
          <span className={styles.text}>{icons[variant]}</span>
        </div>
        <h3 className="text-xl font-bold text-foreground mb-2">{title}</h3>
        <div className="text-muted-foreground mb-6">{message}</div>
        <button
          onClick={onClose}
          className={cn(
            'px-6 py-2.5 rounded-xl font-medium transition-all shadow-lg',
            variant === 'success' && 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/25',
            variant === 'error' && 'bg-red-600 hover:bg-red-500 text-white shadow-red-600/25',
            variant === 'info' && 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/25',
            variant === 'warning' && 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-600/25'
          )}
        >
          {buttonText}
        </button>
      </div>
    </Modal>
  );
}
