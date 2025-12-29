import { cn } from '@openflow/utils';
import { Check } from 'lucide-react';
import { type InputHTMLAttributes, forwardRef } from 'react';

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  /** Whether the checkbox is checked */
  checked?: boolean;
  /** Indeterminate state (partially checked) */
  indeterminate?: boolean;
}

/**
 * Checkbox component with custom styling.
 * Stateless - receives all data via props, emits actions via callbacks.
 *
 * @example
 * <Checkbox checked={isChecked} onChange={handleChange} />
 *
 * @example
 * <Checkbox checked={isChecked} disabled aria-label="Select item" />
 */
export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, checked, indeterminate, disabled, ...props }, ref) => {
    return (
      <div className="relative inline-flex items-center">
        <input
          type="checkbox"
          ref={(element) => {
            // Handle both the forwarded ref and indeterminate state
            if (typeof ref === 'function') {
              ref(element);
            } else if (ref) {
              ref.current = element;
            }
            if (element) {
              element.indeterminate = indeterminate ?? false;
            }
          }}
          checked={checked}
          disabled={disabled}
          className={cn(
            'peer h-4 w-4 shrink-0 appearance-none rounded',
            'border border-[rgb(var(--input))]',
            'bg-[rgb(var(--background))]',
            'transition-colors duration-150',
            // Focus state
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--ring))] focus-visible:ring-offset-2 focus-visible:ring-offset-[rgb(var(--background))]',
            // Checked state
            'checked:border-[rgb(var(--primary))] checked:bg-[rgb(var(--primary))]',
            // Indeterminate state
            'indeterminate:border-[rgb(var(--primary))] indeterminate:bg-[rgb(var(--primary))]',
            // Disabled state
            disabled && 'cursor-not-allowed opacity-50',
            className
          )}
          {...props}
        />
        {/* Custom check icon overlay */}
        <Check
          className={cn(
            'pointer-events-none absolute left-0 h-4 w-4 stroke-[3]',
            'text-[rgb(var(--primary-foreground))]',
            'opacity-0 transition-opacity duration-150',
            'peer-checked:opacity-100',
            'peer-indeterminate:hidden'
          )}
          aria-hidden="true"
        />
        {/* Indeterminate dash overlay */}
        <div
          className={cn(
            'pointer-events-none absolute left-1 top-1/2 h-0.5 w-2 -translate-y-1/2',
            'bg-[rgb(var(--primary-foreground))]',
            'opacity-0 transition-opacity duration-150',
            'peer-indeterminate:opacity-100',
            'peer-checked:hidden'
          )}
          aria-hidden="true"
        />
      </div>
    );
  }
);

Checkbox.displayName = 'Checkbox';
