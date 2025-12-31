/**
 * Toast management hook with context provider pattern.
 *
 * Follows the same pattern as useTheme:
 * - useToastProvider(): Stateful hook for provider component
 * - ToastContext: Context for sharing state
 * - useToast(): Consumer hook for accessing toast functionality
 *
 * The ToastProvider component in src/providers/ uses useToastProvider
 * and renders the actual Toast UI components from @openflow/ui.
 */
import { createContext, useCallback, useContext, useState } from 'react';

/** Toast variant types */
export type ToastVariant = 'success' | 'error' | 'warning' | 'info';

/** Action button configuration for toasts */
export interface ToastAction {
  label: string;
  onClick: () => void;
}

/** Data for a single toast notification */
export interface ToastData {
  id: string;
  variant: ToastVariant;
  title: string;
  description?: string;
  duration?: number;
  /** Optional action button */
  action?: ToastAction;
}

/** Options for creating a toast */
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

/** Context value provided by ToastProvider */
export interface ToastContextValue {
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

/** Context for toast values */
export const ToastContext = createContext<ToastContextValue | null>(null);

const DEFAULT_DURATION = 5000;

let toastIdCounter = 0;

function generateToastId(): string {
  return `toast-${++toastIdCounter}-${Date.now()}`;
}

/**
 * Provider hook that manages toast state.
 * Use this in your ToastProvider component.
 *
 * @example
 * function ToastProvider({ children }: Props) {
 *   const value = useToastProvider();
 *   return (
 *     <ToastContext.Provider value={value}>
 *       {children}
 *       <ToastContainer toasts={value.toasts} onDismiss={value.removeToast} />
 *     </ToastContext.Provider>
 *   );
 * }
 */
export function useToastProvider(): ToastContextValue {
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

  return {
    toasts,
    toast,
    addToast,
    removeToast,
    success,
    error,
    warning,
    info,
  };
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
