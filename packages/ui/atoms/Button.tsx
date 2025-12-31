import { cn } from '@openflow/utils';
import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Spinner } from './Spinner';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'destructive';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Visual style variant */
  variant?: ButtonVariant;
  /** Size of the button */
  size?: ButtonSize;
  /** Show loading spinner and disable interactions */
  loading?: boolean;
  /** Text to show while loading (replaces children when loading) */
  loadingText?: string;
  /** Button content */
  children: ReactNode;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-[rgb(var(--primary))] text-[rgb(var(--primary-foreground))] hover:bg-[rgb(var(--primary))]/90',
  secondary:
    'bg-[rgb(var(--secondary))] text-[rgb(var(--secondary-foreground))] hover:bg-[rgb(var(--secondary))]/80',
  ghost: 'bg-transparent text-[rgb(var(--foreground))] hover:bg-[rgb(var(--muted))]',
  destructive:
    'bg-[rgb(var(--destructive))] text-[rgb(var(--destructive-foreground))] hover:bg-[rgb(var(--destructive))]/90',
};

const sizeClasses: Record<ButtonSize, string> = {
  // Touch targets: 44px minimum on touch devices, normal sizing on pointer devices
  // Small buttons scale up to 44px height on touch devices for accessibility
  sm: 'h-8 px-3 text-xs min-h-[44px] sm:min-h-8',
  md: 'h-9 px-4 text-sm min-h-[44px] sm:min-h-9',
  lg: 'h-10 px-6 text-base min-h-[44px]',
};

const spinnerSizeMap: Record<ButtonSize, 'sm' | 'md' | 'lg'> = {
  sm: 'sm',
  md: 'sm',
  lg: 'md',
};

/**
 * Button component with multiple variants and loading state.
 * Stateless - receives all data via props, emits actions via callbacks.
 *
 * @example
 * <Button variant="primary" onClick={handleClick}>
 *   Save Changes
 * </Button>
 *
 * @example
 * <Button variant="destructive" loading>
 *   Deleting...
 * </Button>
 */
export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  loadingText,
  disabled,
  className,
  children,
  ...props
}: ButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <button
      type="button"
      disabled={isDisabled}
      aria-busy={loading || undefined}
      aria-disabled={isDisabled || undefined}
      className={cn(
        // Base styles
        'inline-flex items-center justify-center gap-2 rounded-md font-medium',
        'motion-safe:transition-colors motion-safe:duration-150',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--ring))] focus-visible:ring-offset-2 focus-visible:ring-offset-[rgb(var(--background))]',
        // Variant and size
        variantClasses[variant],
        sizeClasses[size],
        // Disabled state
        isDisabled && 'pointer-events-none opacity-50',
        className
      )}
      {...props}
    >
      {loading && <Spinner size={spinnerSizeMap[size]} />}
      {loading && loadingText ? loadingText : children}
    </button>
  );
}
