import { cn } from '@openflow/utils';
import { AlertCircle, CheckCircle, Info, X, XCircle } from 'lucide-react';
import type { ReactNode } from 'react';

export type ToastVariant = 'success' | 'error' | 'warning' | 'info';

export interface ToastAction {
  /** Button label */
  label: string;
  /** Click handler */
  onClick: () => void;
}

export interface ToastProps {
  /** Unique identifier for the toast */
  id: string;
  /** Visual style variant */
  variant?: ToastVariant;
  /** Title text */
  title: string;
  /** Optional description text */
  description?: string;
  /** Callback when toast is dismissed */
  onDismiss?: (id: string) => void;
  /** Optional action button */
  action?: ToastAction;
  /** Optional custom action element (for backwards compatibility) */
  actionElement?: ReactNode;
}

const variantClasses: Record<ToastVariant, string> = {
  success: 'border-success/50 bg-success/10',
  error: 'border-error/50 bg-error/10',
  warning: 'border-warning/50 bg-warning/10',
  info: 'border-info/50 bg-info/10',
};

const variantIcons: Record<ToastVariant, typeof CheckCircle> = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertCircle,
  info: Info,
};

const variantIconColors: Record<ToastVariant, string> = {
  success: 'text-success',
  error: 'text-error',
  warning: 'text-warning',
  info: 'text-info',
};

/**
 * Toast notification component.
 * Displays a brief message that auto-dismisses or can be manually closed.
 * Uses ARIA live regions for screen reader accessibility.
 *
 * @example
 * <Toast
 *   id="1"
 *   variant="success"
 *   title="Project created"
 *   description="Your project has been successfully created."
 *   onDismiss={handleDismiss}
 * />
 *
 * @example With action button
 * <Toast
 *   id="2"
 *   variant="error"
 *   title="Failed to save"
 *   action={{ label: 'Retry', onClick: handleRetry }}
 *   onDismiss={handleDismiss}
 * />
 */
export function Toast({
  id,
  variant = 'info',
  title,
  description,
  onDismiss,
  action,
  actionElement,
}: ToastProps) {
  const Icon = variantIcons[variant];

  // Error toasts use assertive to immediately interrupt screen readers
  // Other variants use polite to wait for a pause in speech
  const ariaLive = variant === 'error' ? 'assertive' : 'polite';

  return (
    <div
      role="alert"
      aria-live={ariaLive}
      aria-atomic="true"
      className={cn(
        'pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-lg border p-4 shadow-lg',
        'bg-[rgb(var(--card))] text-[rgb(var(--foreground))]',
        variantClasses[variant]
      )}
    >
      <Icon className={cn('h-5 w-5 shrink-0', variantIconColors[variant])} aria-hidden="true" />
      <div className="flex-1 space-y-1">
        <p className="text-sm font-medium">{title}</p>
        {description && (
          <p className="text-sm text-[rgb(var(--muted-foreground))]">{description}</p>
        )}
        {action && (
          <button
            type="button"
            onClick={action.onClick}
            className="mt-2 text-sm font-medium text-[rgb(var(--primary))] underline underline-offset-2 hover:no-underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--ring))] focus-visible:ring-offset-2"
          >
            {action.label}
          </button>
        )}
        {actionElement && <div className="mt-2">{actionElement}</div>}
      </div>
      {onDismiss && (
        <button
          type="button"
          onClick={() => onDismiss(id)}
          className="shrink-0 rounded p-1 text-[rgb(var(--muted-foreground))] hover:bg-[rgb(var(--muted))] hover:text-[rgb(var(--foreground))] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--ring))]"
          aria-label="Dismiss notification"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      )}
    </div>
  );
}
