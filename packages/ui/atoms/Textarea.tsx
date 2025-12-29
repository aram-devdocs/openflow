import { forwardRef, type TextareaHTMLAttributes } from 'react';
import { cn } from '@openflow/utils';

export type TextareaResize = 'none' | 'vertical' | 'horizontal' | 'both';

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  /** Show error styling */
  error?: boolean;
  /** Control resize behavior */
  resize?: TextareaResize;
}

/**
 * Textarea component for multi-line text entry.
 * Stateless - receives all data via props, emits actions via callbacks.
 *
 * @example
 * <Textarea placeholder="Enter description" onChange={handleChange} />
 *
 * @example
 * <Textarea error resize="vertical" aria-describedby="desc-error" />
 */
export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, disabled, resize = 'vertical', ...props }, ref) => {
    const resizeClass = {
      none: 'resize-none',
      vertical: 'resize-y',
      horizontal: 'resize-x',
      both: 'resize',
    }[resize];

    return (
      <textarea
        ref={ref}
        disabled={disabled}
        className={cn(
          // Base styles
          'flex min-h-[80px] w-full rounded-md px-3 py-2 text-sm',
          'bg-[rgb(var(--background))] text-[rgb(var(--foreground))]',
          'border border-[rgb(var(--input))]',
          'transition-colors duration-150',
          // Placeholder
          'placeholder:text-[rgb(var(--muted-foreground))]',
          // Focus state
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--ring))] focus-visible:ring-offset-2 focus-visible:ring-offset-[rgb(var(--background))]',
          // Error state
          error && 'border-[rgb(var(--destructive))] focus-visible:ring-[rgb(var(--destructive))]',
          // Disabled state
          disabled && 'cursor-not-allowed opacity-50',
          // Resize control
          resizeClass,
          className
        )}
        aria-invalid={error ? 'true' : undefined}
        {...props}
      />
    );
  }
);

Textarea.displayName = 'Textarea';
