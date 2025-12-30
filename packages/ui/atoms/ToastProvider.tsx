import { type ReactNode, createContext, useCallback, useContext, useState } from 'react';
import { Toast, type ToastAction, type ToastVariant } from './Toast';

export interface ToastData {
  id: string;
  variant: ToastVariant;
  title: string;
  description?: string;
  duration?: number;
  /** Optional action button */
  action?: ToastAction;
}

export interface ToastOptions {
  /** Toast title */
  title: string;
  /** Optional description */
  description?: string;
  /** Toast variant - defaults to 'info' */
  variant?: ToastVariant;
  /** Duration in ms before auto-dismiss. Use 0 for infinite. Defaults to 5000ms (8000ms for errors) */
  duration?: number;
  /** Optional action button */
  action?: ToastAction;
}

interface ToastContextValue {
  toasts: ToastData[];
  /** Add a toast with full options */
  toast: (options: ToastOptions) => string;
  /** Add a toast with full options (alias for toast) */
  addToast: (toast: Omit<ToastData, 'id'>) => string;
  /** Remove a toast by id */
  removeToast: (id: string) => void;
  /** Shorthand for success toast */
  success: (title: string, description?: string) => string;
  /** Shorthand for error toast */
  error: (title: string, description?: string) => string;
  /** Shorthand for warning toast */
  warning: (title: string, description?: string) => string;
  /** Shorthand for info toast */
  info: (title: string, description?: string) => string;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const DEFAULT_DURATION = 5000;

let toastIdCounter = 0;

function generateToastId(): string {
  return `toast-${++toastIdCounter}-${Date.now()}`;
}

export interface ToastProviderProps {
  children: ReactNode;
}

/**
 * ToastProvider manages toast notifications across the application.
 * Wrap your app with this provider to enable toast functionality.
 *
 * @example
 * <ToastProvider>
 *   <App />
 * </ToastProvider>
 */
export function ToastProvider({ children }: ToastProviderProps) {
  const [toasts, setToasts] = useState<ToastData[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const addToast = useCallback(
    (toast: Omit<ToastData, 'id'>): string => {
      const id = generateToastId();
      const newToast: ToastData = { ...toast, id };

      setToasts((prev) => [...prev, newToast]);

      // Auto-dismiss after duration
      const duration = toast.duration ?? DEFAULT_DURATION;
      if (duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }

      return id;
    },
    [removeToast]
  );

  const success = useCallback(
    (title: string, description?: string) => addToast({ variant: 'success', title, description }),
    [addToast]
  );

  const error = useCallback(
    (title: string, description?: string) =>
      addToast({ variant: 'error', title, description, duration: 8000 }),
    [addToast]
  );

  const warning = useCallback(
    (title: string, description?: string) => addToast({ variant: 'warning', title, description }),
    [addToast]
  );

  const info = useCallback(
    (title: string, description?: string) => addToast({ variant: 'info', title, description }),
    [addToast]
  );

  // Main toast function that accepts full options
  const toast = useCallback(
    (options: ToastOptions): string => {
      const { variant = 'info', duration, ...rest } = options;
      // Use default duration based on variant if not specified
      const finalDuration = duration ?? (variant === 'error' ? 8000 : DEFAULT_DURATION);
      return addToast({ variant, duration: finalDuration, ...rest });
    },
    [addToast]
  );

  const value: ToastContextValue = {
    toasts,
    toast,
    addToast,
    removeToast,
    success,
    error,
    warning,
    info,
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      {/* Toast container with ARIA live region for accessibility */}
      <div
        role="region"
        aria-label="Notifications"
        className="pointer-events-none fixed bottom-0 right-0 z-50 flex max-h-screen w-full flex-col gap-2 p-4 sm:max-w-md"
      >
        {toasts.map((t) => (
          <Toast
            key={t.id}
            id={t.id}
            variant={t.variant}
            title={t.title}
            description={t.description}
            action={t.action}
            onDismiss={removeToast}
          />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

/**
 * Hook to access toast functionality.
 * Must be used within a ToastProvider.
 *
 * @example
 * const { success, error } = useToast();
 *
 * // In your handler:
 * success('Saved!', 'Your changes have been saved.');
 * error('Failed to save', 'Please try again later.');
 */
export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
