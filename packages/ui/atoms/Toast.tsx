import { cn } from '@openflow/utils';
import { AlertCircle, CheckCircle, Info, X, XCircle } from 'lucide-react';
import type { ReactNode } from 'react';

export type ToastVariant = 'success' | 'error' | 'warning' | 'info';

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
  /** Optional action element */
  action?: ReactNode;
}

const variantClasses: Record<ToastVariant, string> = {
  success: 'border-green-500/50 bg-green-500/10',
  error: 'border-red-500/50 bg-red-500/10',
  warning: 'border-yellow-500/50 bg-yellow-500/10',
  info: 'border-blue-500/50 bg-blue-500/10',
};

const variantIcons: Record<ToastVariant, typeof CheckCircle> = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertCircle,
  info: Info,
};

const variantIconColors: Record<ToastVariant, string> = {
  success: 'text-green-500',
  error: 'text-red-500',
  warning: 'text-yellow-500',
  info: 'text-blue-500',
};

/**
 * Toast notification component.
 * Displays a brief message that auto-dismisses or can be manually closed.
 *
 * @example
 * <Toast
 *   id="1"
 *   variant="success"
 *   title="Project created"
 *   description="Your project has been successfully created."
 *   onDismiss={handleDismiss}
 * />
 */
export function Toast({ id, variant = 'info', title, description, onDismiss, action }: ToastProps) {
  const Icon = variantIcons[variant];

  return (
    <div
      role="alert"
      className={cn(
        'pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-lg border p-4 shadow-lg',
        'bg-[rgb(var(--card))] text-[rgb(var(--foreground))]',
        variantClasses[variant]
      )}
    >
      <Icon className={cn('h-5 w-5 shrink-0', variantIconColors[variant])} />
      <div className="flex-1 space-y-1">
        <p className="text-sm font-medium">{title}</p>
        {description && (
          <p className="text-sm text-[rgb(var(--muted-foreground))]">{description}</p>
        )}
        {action && <div className="mt-2">{action}</div>}
      </div>
      {onDismiss && (
        <button
          type="button"
          onClick={() => onDismiss(id)}
          className="shrink-0 rounded p-1 text-[rgb(var(--muted-foreground))] hover:bg-[rgb(var(--muted))] hover:text-[rgb(var(--foreground))]"
          aria-label="Dismiss notification"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
