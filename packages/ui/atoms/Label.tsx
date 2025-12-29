import { forwardRef, type LabelHTMLAttributes } from 'react';
import { cn } from '@openflow/utils';

export interface LabelProps extends LabelHTMLAttributes<HTMLLabelElement> {
  /** Show required indicator (*) */
  required?: boolean;
  /** Disable styling for associated disabled input */
  disabled?: boolean;
}

/**
 * Label component for form inputs.
 * Stateless - receives all data via props, emits actions via callbacks.
 *
 * @example
 * <Label htmlFor="email">Email Address</Label>
 *
 * @example
 * <Label htmlFor="name" required>Full Name</Label>
 */
export const Label = forwardRef<HTMLLabelElement, LabelProps>(
  ({ className, children, required, disabled, ...props }, ref) => {
    return (
      <label
        ref={ref}
        className={cn(
          'text-sm font-medium leading-none',
          'text-[rgb(var(--foreground))]',
          // Disabled state
          disabled && 'cursor-not-allowed opacity-70',
          // Peer-disabled support (when used with peer class on input)
          'peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
          className
        )}
        {...props}
      >
        {children}
        {required && (
          <span
            className="ml-1 text-[rgb(var(--destructive))]"
            aria-hidden="true"
          >
            *
          </span>
        )}
      </label>
    );
  }
);

Label.displayName = 'Label';
