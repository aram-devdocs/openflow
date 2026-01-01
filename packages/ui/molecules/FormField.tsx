/**
 * FormField Molecule - Form field container with label, input, and messages
 *
 * Combines Label atom with any form input (Input, Textarea, Checkbox, etc.)
 * and provides proper accessibility through:
 * - htmlFor/id linking between label and input
 * - aria-describedby linking for helper text and error messages
 * - Required indicator with aria-required support
 * - Screen reader announcements for error states
 * - Responsive spacing
 *
 * @example
 * // Basic usage with Input
 * <FormField label="Email" htmlFor="email">
 *   <Input id="email" type="email" />
 * </FormField>
 *
 * @example
 * // Required field with error
 * <FormField label="Username" htmlFor="username" required error="Username is required">
 *   <Input id="username" error aria-required="true" />
 * </FormField>
 *
 * @example
 * // With helper text
 * <FormField label="Password" htmlFor="password" helperText="Min 8 characters">
 *   <Input id="password" type="password" aria-describedby="password-helper" />
 * </FormField>
 */

import { Box, type ResponsiveValue, Text, VisuallyHidden } from '@openflow/primitives';
import { cn } from '@openflow/utils';
import { type HTMLAttributes, type ReactNode, forwardRef, useId } from 'react';
import { Label, type LabelSize } from '../atoms/Label';

// =============================================================================
// Types
// =============================================================================

type Breakpoint = 'base' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

/**
 * FormField spacing size options
 */
export type FormFieldSpacing = 'sm' | 'md' | 'lg';

/**
 * Props for the FormField component
 */
export interface FormFieldProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  /** Label text for the field */
  label: string;
  /** Error message to display */
  error?: string;
  /** Mark field as required (shows indicator, announces to screen readers) */
  required?: boolean;
  /** Additional helper text shown below input (hidden when error is present) */
  helperText?: string;
  /** Disable styling for the entire field */
  disabled?: boolean;
  /** The form input element (Input, Textarea, Checkbox, etc.) */
  children: ReactNode;
  /** Custom id for linking label to input - if not provided, one will be generated */
  htmlFor?: string;
  /** Label size (responsive) - defaults to 'sm' */
  labelSize?: ResponsiveValue<LabelSize>;
  /** Gap between label and input (responsive) - defaults to 'sm' */
  spacing?: ResponsiveValue<FormFieldSpacing>;
  /** Data attribute for testing */
  'data-testid'?: string;
}

// =============================================================================
// Constants
// =============================================================================

/**
 * Base classes for the FormField container
 */
export const FORM_FIELD_BASE_CLASSES = ['flex', 'flex-col'] as const;

/**
 * Spacing classes mapping
 */
export const FORM_FIELD_SPACING_CLASSES: Record<FormFieldSpacing, string> = {
  sm: 'gap-1',
  md: 'gap-1.5',
  lg: 'gap-2',
};

/**
 * Helper text classes (muted, smaller text)
 */
export const HELPER_TEXT_CLASSES = ['text-xs', 'text-[rgb(var(--muted-foreground))]'] as const;

/**
 * Error text classes (destructive color, smaller text)
 */
export const ERROR_TEXT_CLASSES = ['text-xs', 'text-[rgb(var(--destructive))]'] as const;

/**
 * Breakpoint order for responsive class generation
 */
const BREAKPOINT_ORDER: Breakpoint[] = ['base', 'sm', 'md', 'lg', 'xl', '2xl'];

// =============================================================================
// Utility Functions
// =============================================================================

/**
 * Get the base spacing value from a responsive spacing prop
 */
export function getBaseSpacing(spacing: ResponsiveValue<FormFieldSpacing>): FormFieldSpacing {
  if (typeof spacing === 'string') {
    return spacing;
  }
  if (typeof spacing === 'object' && spacing !== null) {
    return (spacing as Partial<Record<Breakpoint, FormFieldSpacing>>).base ?? 'sm';
  }
  return 'sm';
}

/**
 * Get responsive spacing classes for the FormField
 */
export function getResponsiveSpacingClasses(spacing: ResponsiveValue<FormFieldSpacing>): string[] {
  const classes: string[] = [];

  if (typeof spacing === 'string') {
    classes.push(FORM_FIELD_SPACING_CLASSES[spacing]);
  } else if (typeof spacing === 'object' && spacing !== null) {
    for (const breakpoint of BREAKPOINT_ORDER) {
      const value = (spacing as Partial<Record<Breakpoint, FormFieldSpacing>>)[breakpoint];
      if (value !== undefined) {
        const spacingClass = FORM_FIELD_SPACING_CLASSES[value];
        if (breakpoint === 'base') {
          classes.push(spacingClass);
        } else {
          classes.push(`${breakpoint}:${spacingClass}`);
        }
      }
    }
  }

  return classes;
}

// =============================================================================
// Component
// =============================================================================

/**
 * FormField component combining Label + input + error/helper messages.
 *
 * Stateless - receives all data via props, emits actions via callbacks.
 * Uses atoms and primitives for consistent styling and accessibility.
 *
 * Accessibility features:
 * - Label linked to input via htmlFor/id
 * - Error message has role="alert" and aria-live="assertive" for immediate announcement
 * - Helper text and error linked via aria-describedby (consumer should add to input)
 * - Required indicator visible and announced to screen readers
 * - Screen reader announcement when error state changes
 *
 * Usage patterns:
 *
 * 1. Basic field:
 * ```tsx
 * <FormField label="Email" htmlFor="email">
 *   <Input id="email" type="email" />
 * </FormField>
 * ```
 *
 * 2. With aria-describedby (recommended for helper/error):
 * ```tsx
 * <FormField
 *   label="Password"
 *   htmlFor="password"
 *   helperText="Min 8 characters"
 * >
 *   <Input
 *     id="password"
 *     type="password"
 *     aria-describedby="password-helper"
 *   />
 * </FormField>
 * ```
 *
 * 3. With error:
 * ```tsx
 * <FormField
 *   label="Username"
 *   htmlFor="username"
 *   required
 *   error="Username is required"
 * >
 *   <Input
 *     id="username"
 *     error
 *     aria-required="true"
 *     aria-describedby="username-error"
 *   />
 * </FormField>
 * ```
 */
export const FormField = forwardRef<HTMLDivElement, FormFieldProps>(
  (
    {
      label,
      error,
      required,
      helperText,
      disabled,
      className,
      children,
      htmlFor,
      labelSize = 'sm',
      spacing = 'sm',
      'data-testid': dataTestId,
      ...props
    },
    ref
  ) => {
    // Generate IDs for accessibility linking
    const generatedId = useId();
    const fieldId = htmlFor ?? generatedId;
    const errorId = `${fieldId}-error`;
    const helperId = `${fieldId}-helper`;
    const hasError = Boolean(error);

    // Get responsive spacing classes
    const spacingClasses = getResponsiveSpacingClasses(spacing);

    return (
      <Box
        ref={ref}
        className={cn(...FORM_FIELD_BASE_CLASSES, ...spacingClasses, className)}
        data-testid={dataTestId}
        data-error={hasError ? 'true' : undefined}
        data-disabled={disabled ? 'true' : undefined}
        {...props}
      >
        {/* Screen reader announcement for error state change */}
        {hasError && (
          <VisuallyHidden>
            <Text as="span" aria-live="assertive">
              Error: {error}
            </Text>
          </VisuallyHidden>
        )}

        {/* Label with optional required indicator */}
        <Label
          htmlFor={fieldId}
          required={required ?? false}
          disabled={disabled ?? false}
          size={labelSize}
        >
          {label}
        </Label>

        {/* Form input (passed as children) */}
        {children}

        {/* Helper text - hidden when error is present */}
        {helperText && !hasError && (
          <Text
            as="span"
            id={helperId}
            size="xs"
            color="muted-foreground"
            className={cn(disabled && 'opacity-70')}
          >
            {helperText}
          </Text>
        )}

        {/* Error message with alert role for screen readers */}
        {hasError && (
          <Text
            as="span"
            id={errorId}
            size="xs"
            color="destructive"
            role="alert"
            aria-live="assertive"
            aria-atomic="true"
          >
            {error}
          </Text>
        )}
      </Box>
    );
  }
);

FormField.displayName = 'FormField';
