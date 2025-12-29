import { cn } from '@openflow/utils';
import { type InputHTMLAttributes, forwardRef } from 'react';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  /** Show error styling */
  error?: boolean;
}

/**
 * Input component for text entry.
 * Stateless - receives all data via props, emits actions via callbacks.
 *
 * @example
 * <Input placeholder="Enter your name" onChange={handleChange} />
 *
 * @example
 * <Input type="email" error aria-describedby="email-error" />
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, disabled, type = 'text', ...props }, ref) => {
    return (
      <input
        type={type}
        ref={ref}
        disabled={disabled}
        className={cn(
          // Base styles
          'flex h-9 w-full rounded-md px-3 py-2 text-sm',
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
          // File input specific
          type === 'file' &&
            'file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-[rgb(var(--foreground))]',
          className
        )}
        aria-invalid={error ? 'true' : undefined}
        {...props}
      />
    );
  }
);

Input.displayName = 'Input';
