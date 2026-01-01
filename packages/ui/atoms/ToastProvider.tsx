import { Box, type ResponsiveValue, VisuallyHidden } from '@openflow/primitives';
import { cn } from '@openflow/utils';
import {
  type ReactNode,
  createContext,
  forwardRef,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { Toast, type ToastAction, type ToastSize, type ToastVariant } from './Toast';

// ============================================================================
// Types
// ============================================================================

export type ToastPosition =
  | 'top-left'
  | 'top-center'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-center'
  | 'bottom-right';

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

// ============================================================================
// Constants
// ============================================================================

/**
 * Default auto-dismiss duration for non-error toasts (5 seconds)
 */
export const DEFAULT_DURATION = 5000;

/**
 * Default auto-dismiss duration for error toasts (8 seconds)
 */
export const DEFAULT_ERROR_DURATION = 8000;

/**
 * Maximum number of toasts to display at once
 */
export const DEFAULT_MAX_TOASTS = 5;

/**
 * Default position for toast container
 */
export const DEFAULT_POSITION: ToastPosition = 'bottom-right';

/**
 * Position to Tailwind classes mapping
 */
export const POSITION_CLASSES: Record<ToastPosition, string> = {
  'top-left': 'top-0 left-0 flex-col-reverse',
  'top-center': 'top-0 left-1/2 -translate-x-1/2 flex-col-reverse items-center',
  'top-right': 'top-0 right-0 flex-col-reverse items-end',
  'bottom-left': 'bottom-0 left-0 flex-col',
  'bottom-center': 'bottom-0 left-1/2 -translate-x-1/2 flex-col items-center',
  'bottom-right': 'bottom-0 right-0 flex-col items-end',
};

/**
 * Base classes for the toast container
 */
export const TOAST_CONTAINER_BASE_CLASSES = cn(
  'pointer-events-none fixed z-50 flex max-h-screen w-full gap-2 p-4',
  'sm:max-w-md'
);

/**
 * Default accessible label for the toast region
 */
export const DEFAULT_REGION_LABEL = 'Notifications';

// ============================================================================
// Context
// ============================================================================

const ToastContext = createContext<ToastContextValue | null>(null);

// ============================================================================
// ID Generation
// ============================================================================

let toastIdCounter = 0;

function generateToastId(): string {
  return `toast-${++toastIdCounter}-${Date.now()}`;
}

/**
 * Reset toast ID counter (for testing purposes)
 */
export function resetToastIdCounter(): void {
  toastIdCounter = 0;
}

// ============================================================================
// Props
// ============================================================================

export interface ToastProviderProps {
  /** Child components to render */
  children: ReactNode;
  /** Position of the toast container - supports responsive values */
  position?: ResponsiveValue<ToastPosition>;
  /** Maximum number of toasts to display at once */
  maxToasts?: number;
  /** Size for all toasts - supports responsive values */
  toastSize?: ResponsiveValue<ToastSize>;
  /** Custom aria-label for the notifications region */
  regionLabel?: string;
  /** Data attribute for testing */
  'data-testid'?: string;
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Get position classes for responsive position prop
 */
export function getPositionClasses(position: ResponsiveValue<ToastPosition>): string {
  if (typeof position === 'string') {
    return POSITION_CLASSES[position];
  }

  if (typeof position === 'object' && position !== null) {
    const classes: string[] = [];
    const breakpoints = ['base', 'sm', 'md', 'lg', 'xl', '2xl'] as const;

    for (const breakpoint of breakpoints) {
      const value = (position as Partial<Record<typeof breakpoint, ToastPosition>>)[breakpoint];
      if (value !== undefined) {
        const positionClass = POSITION_CLASSES[value];
        const prefix = breakpoint === 'base' ? '' : `${breakpoint}:`;
        classes.push(...positionClass.split(' ').map((c) => `${prefix}${c}`));
      }
    }

    return classes.join(' ');
  }

  return POSITION_CLASSES[DEFAULT_POSITION];
}

// ============================================================================
// Component
// ============================================================================

/**
 * ToastProvider manages toast notifications across the application.
 * Wrap your app with this provider to enable toast functionality.
 *
 * ## Accessibility Features
 * - Uses `role="region"` for the container landmark
 * - Each toast has its own `role="alert"` or `role="status"` based on variant
 * - Screen reader announcements via aria-live regions in individual toasts
 * - Container labeled with `aria-label` for assistive technology navigation
 *
 * ## Responsive Features
 * - Supports responsive position via ResponsiveValue<ToastPosition>
 * - Toast sizes can be configured responsively
 * - Container adapts to screen size (full width on mobile, max-w-md on desktop)
 *
 * @example Basic usage
 * ```tsx
 * <ToastProvider>
 *   <App />
 * </ToastProvider>
 * ```
 *
 * @example With custom position
 * ```tsx
 * <ToastProvider position="top-center">
 *   <App />
 * </ToastProvider>
 * ```
 *
 * @example With responsive position
 * ```tsx
 * <ToastProvider position={{ base: 'bottom-center', md: 'bottom-right' }}>
 *   <App />
 * </ToastProvider>
 * ```
 *
 * @example With configuration
 * ```tsx
 * <ToastProvider
 *   position="top-right"
 *   maxToasts={3}
 *   toastSize="sm"
 *   regionLabel="Application notifications"
 * >
 *   <App />
 * </ToastProvider>
 * ```
 */
export const ToastProvider = forwardRef<HTMLDivElement, ToastProviderProps>(function ToastProvider(
  {
    children,
    position = DEFAULT_POSITION,
    maxToasts = DEFAULT_MAX_TOASTS,
    toastSize = 'md',
    regionLabel = DEFAULT_REGION_LABEL,
    'data-testid': testId,
  },
  ref
) {
  const [toasts, setToasts] = useState<ToastData[]>([]);
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const [activeToastCount, setActiveToastCount] = useState(0);

  // Cleanup timers on unmount
  useEffect(() => {
    const timers = timersRef.current;
    return () => {
      for (const timer of timers.values()) {
        clearTimeout(timer);
      }
      timers.clear();
    };
  }, []);

  const removeToast = useCallback((id: string) => {
    // Clear any existing timer for this toast
    const timer = timersRef.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timersRef.current.delete(id);
    }

    setToasts((prev) => {
      const newToasts = prev.filter((toast) => toast.id !== id);
      setActiveToastCount(newToasts.length);
      return newToasts;
    });
  }, []);

  const addToast = useCallback(
    (toast: Omit<ToastData, 'id'>): string => {
      const id = generateToastId();
      const newToast: ToastData = { ...toast, id };

      setToasts((prev) => {
        // Limit the number of toasts
        const limitedPrev = prev.length >= maxToasts ? prev.slice(1) : prev;
        const newToasts = [...limitedPrev, newToast];
        setActiveToastCount(newToasts.length);
        return newToasts;
      });

      // Auto-dismiss after duration
      const duration = toast.duration ?? DEFAULT_DURATION;
      if (duration > 0) {
        const timer = setTimeout(() => {
          removeToast(id);
        }, duration);
        timersRef.current.set(id, timer);
      }

      return id;
    },
    [maxToasts, removeToast]
  );

  const success = useCallback(
    (title: string, description?: string) => addToast({ variant: 'success', title, description }),
    [addToast]
  );

  const error = useCallback(
    (title: string, description?: string) =>
      addToast({ variant: 'error', title, description, duration: DEFAULT_ERROR_DURATION }),
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
      const finalDuration =
        duration ?? (variant === 'error' ? DEFAULT_ERROR_DURATION : DEFAULT_DURATION);
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

  const positionClasses = getPositionClasses(position);

  return (
    <ToastContext.Provider value={value}>
      {children}
      {/* Toast container - uses Box primitive with accessibility region */}
      <Box
        ref={ref}
        as="section"
        role="region"
        aria-label={regionLabel}
        aria-live="polite"
        aria-relevant="additions removals"
        data-testid={testId}
        data-toast-count={activeToastCount}
        className={cn(TOAST_CONTAINER_BASE_CLASSES, positionClasses)}
      >
        {/* Screen reader announcement for toast count changes */}
        <VisuallyHidden aria-live="polite" aria-atomic="true">
          {activeToastCount === 0
            ? 'No notifications'
            : `${activeToastCount} notification${activeToastCount === 1 ? '' : 's'}`}
        </VisuallyHidden>

        {toasts.map((t) => (
          <Toast
            key={t.id}
            id={t.id}
            variant={t.variant}
            title={t.title}
            description={t.description}
            action={t.action}
            size={toastSize}
            onDismiss={removeToast}
            data-testid={testId ? `${testId}-toast-${t.id}` : undefined}
          />
        ))}
      </Box>
    </ToastContext.Provider>
  );
});

ToastProvider.displayName = 'ToastProvider';

// ============================================================================
// Hook
// ============================================================================

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
 *
 * @example Full options
 * const { toast } = useToast();
 *
 * toast({
 *   variant: 'warning',
 *   title: 'Session expiring',
 *   description: 'Your session will expire in 5 minutes.',
 *   duration: 10000,
 *   action: {
 *     label: 'Extend',
 *     onClick: extendSession,
 *   },
 * });
 */
export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
