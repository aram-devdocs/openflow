import { type ReactNode, useId } from 'react';
import { cn } from '@openflow/utils';
import { Label } from '../atoms/Label';

export interface FormFieldProps {
  /** Label text for the field */
  label: string;
  /** Error message to display */
  error?: string;
  /** Mark field as required */
  required?: boolean;
  /** Additional helper text */
  helperText?: string;
  /** Disable the field */
  disabled?: boolean;
  /** Additional class name for the wrapper */
  className?: string;
  /** The form input element (Input, Textarea, Checkbox, etc.) */
  children: ReactNode;
  /** Custom id for the input - if not provided, one will be generated */
  htmlFor?: string;
}

/**
 * FormField component combining Label + input + error message.
 * Stateless - receives all data via props, emits actions via callbacks.
 *
 * Provides proper accessibility by linking label to input via htmlFor/id,
 * and error messages via aria-describedby.
 *
 * @example
 * <FormField label="Email" required error="Invalid email">
 *   <Input type="email" />
 * </FormField>
 *
 * @example
 * <FormField label="Description" helperText="Max 500 characters">
 *   <Textarea />
 * </FormField>
 */
export function FormField({
  label,
  error,
  required,
  helperText,
  disabled,
  className,
  children,
  htmlFor,
}: FormFieldProps) {
  const generatedId = useId();
  const fieldId = htmlFor ?? generatedId;
  const errorId = `${fieldId}-error`;
  const helperId = `${fieldId}-helper`;
  const hasError = Boolean(error);

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <Label
        htmlFor={fieldId}
        required={required ?? false}
        disabled={disabled ?? false}
      >
        {label}
      </Label>

      {children}

      {helperText && !hasError && (
        <p
          id={helperId}
          className={cn(
            'text-xs text-[rgb(var(--muted-foreground))]',
            disabled && 'opacity-70'
          )}
        >
          {helperText}
        </p>
      )}

      {hasError && (
        <p
          id={errorId}
          className="text-xs text-[rgb(var(--destructive))]"
          role="alert"
          aria-live="polite"
        >
          {error}
        </p>
      )}
    </div>
  );
}

FormField.displayName = 'FormField';
