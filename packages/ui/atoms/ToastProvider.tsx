import { type ReactNode, createContext, useCallback, useContext, useState } from 'react';
import { Toast, type ToastVariant } from './Toast';

export interface ToastData {
  id: string;
  variant: ToastVariant;
  title: string;
  description?: string;
  duration?: number;
}

interface ToastContextValue {
  toasts: ToastData[];
  addToast: (toast: Omit<ToastData, 'id'>) => string;
  removeToast: (id: string) => void;
  success: (title: string, description?: string) => string;
  error: (title: string, description?: string) => string;
  warning: (title: string, description?: string) => string;
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

  const value: ToastContextValue = {
    toasts,
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
      {/* Toast container - fixed position at bottom-right */}
      <div className="pointer-events-none fixed bottom-0 right-0 z-50 flex max-h-screen w-full flex-col gap-2 p-4 sm:max-w-md">
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            id={toast.id}
            variant={toast.variant}
            title={toast.title}
            description={toast.description}
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
