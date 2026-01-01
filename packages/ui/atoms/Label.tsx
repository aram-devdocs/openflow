/**
 * Label Component - Form label with required indicator and accessibility support
 *
 * A semantic form label component that:
 * - Uses the Text primitive for consistent typography
 * - Supports required field indicators with screen reader announcements
 * - Supports responsive text sizing
 * - Provides disabled state styling
 * - Properly associates with form controls via htmlFor
 *
 * @example
 * // Basic usage
 * <Label htmlFor="email">Email Address</Label>
 *
 * @example
 * // Required field
 * <Label htmlFor="name" required>Full Name</Label>
 *
 * @example
 * // Responsive sizing
 * <Label htmlFor="bio" size={{ base: 'sm', md: 'base' }}>Bio</Label>
 */

import { Text, type TextSize, VisuallyHidden } from '@openflow/primitives';
import { cn } from '@openflow/utils';
import { type LabelHTMLAttributes, type ReactNode, forwardRef } from 'react';

// =============================================================================
// Types
// =============================================================================

type Breakpoint = 'base' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
type ResponsiveValue<T> = T | Partial<Record<Breakpoint, T>>;

/**
 * Label size options
 */
export type LabelSize = 'xs' | 'sm' | 'base' | 'lg';

/**
 * ARIA attributes that conflict between LabelHTMLAttributes (Booleanish) and
 * Text primitive's A11yProps (strict boolean). These must be omitted and
 * re-declared with correct types.
 */
type ConflictingAriaProps =
  | 'aria-hidden'
  | 'aria-busy'
  | 'aria-expanded'
  | 'aria-pressed'
  | 'aria-selected'
  | 'aria-checked'
  | 'aria-disabled'
  | 'aria-required'
  | 'aria-invalid'
  | 'aria-haspopup'
  | 'aria-current';

/**
 * Props for the Label component
 *
 * Omits conflicting ARIA attributes from LabelHTMLAttributes because the Text
 * primitive expects strict boolean types, not the Booleanish type from HTML
 * attributes. These are re-declared with correct types below.
 */
export interface LabelProps
  extends Omit<LabelHTMLAttributes<HTMLLabelElement>, 'children' | ConflictingAriaProps> {
  /** Label text content */
  children: ReactNode;
  /** Show required indicator (*) with screen reader announcement */
  required?: boolean;
  /** Disable styling for associated disabled input */
  disabled?: boolean;
  /** Text size (responsive) */
  size?: ResponsiveValue<LabelSize>;
  /** Custom required indicator icon/element (defaults to asterisk) */
  requiredIndicator?: ReactNode;
  /** Optional description text shown below the label */
  description?: string;
  /** ID for the description element (for aria-describedby linking) */
  descriptionId?: string;
  /** Data attribute for testing */
  'data-testid'?: string;
  // Re-declare ARIA attributes with strict types matching Text primitive
  'aria-hidden'?: boolean;
  'aria-busy'?: boolean;
  'aria-expanded'?: boolean;
  'aria-pressed'?: boolean | 'mixed';
  'aria-selected'?: boolean;
  'aria-checked'?: boolean | 'mixed';
  'aria-disabled'?: boolean;
  'aria-required'?: boolean;
  'aria-invalid'?: boolean | 'grammar' | 'spelling';
  'aria-haspopup'?: boolean | 'menu' | 'listbox' | 'tree' | 'grid' | 'dialog';
  'aria-current'?: boolean | 'page' | 'step' | 'location' | 'date' | 'time' | 'true' | 'false';
}

// =============================================================================
// Constants
// =============================================================================

const BREAKPOINT_ORDER: Breakpoint[] = ['base', 'sm', 'md', 'lg', 'xl', '2xl'];

/**
 * Label size to TextSize mapping
 */
const SIZE_MAP: Record<LabelSize, TextSize> = {
  xs: 'xs',
  sm: 'sm',
  base: 'base',
  lg: 'lg',
};

// =============================================================================
// Utility Functions
// =============================================================================

/**
 * Get the base size value from a responsive size prop
 * Used to determine the default size for non-responsive contexts
 */
export function getBaseSize(size: ResponsiveValue<LabelSize>): LabelSize {
  if (typeof size === 'string') {
    return size;
  }
  if (typeof size === 'object' && size !== null) {
    return (size as Partial<Record<Breakpoint, LabelSize>>).base ?? 'sm';
  }
  return 'sm';
}

/**
 * Convert LabelSize to TextSize for the Text primitive
 */
export function convertToTextSize(size: ResponsiveValue<LabelSize>): ResponsiveValue<TextSize> {
  if (typeof size === 'string') {
    return SIZE_MAP[size];
  }
  if (typeof size === 'object' && size !== null) {
    const result: Partial<Record<Breakpoint, TextSize>> = {};
    for (const breakpoint of BREAKPOINT_ORDER) {
      const value = (size as Partial<Record<Breakpoint, LabelSize>>)[breakpoint];
      if (value !== undefined) {
        result[breakpoint] = SIZE_MAP[value];
      }
    }
    return result;
  }
  return 'sm';
}

// =============================================================================
// Component
// =============================================================================

/**
 * Label component for form inputs.
 *
 * Stateless - receives all data via props, emits actions via callbacks.
 * Uses the Text primitive for consistent typography styling.
 *
 * Accessibility features:
 * - Semantic <label> element with htmlFor association
 * - Required indicator visible to sighted users
 * - Screen reader announcement of "(required)" status
 * - Supports aria-describedby for descriptions
 *
 * @example
 * // Basic label
 * <Label htmlFor="email">Email Address</Label>
 *
 * @example
 * // Required field
 * <Label htmlFor="name" required>Full Name</Label>
 *
 * @example
 * // With description
 * <Label
 *   htmlFor="password"
 *   required
 *   description="Must be at least 8 characters"
 *   descriptionId="password-desc"
 * >
 *   Password
 * </Label>
 *
 * @example
 * // Responsive sizing
 * <Label htmlFor="bio" size={{ base: 'sm', md: 'base', lg: 'lg' }}>
 *   Biography
 * </Label>
 */
export const Label = forwardRef<HTMLLabelElement, LabelProps>(
  (
    {
      className,
      children,
      required,
      disabled,
      size = 'sm',
      requiredIndicator,
      description,
      descriptionId,
      'data-testid': dataTestId,
      ...props
    },
    ref
  ) => {
    // Convert label size to text size for the Text primitive
    const textSize = convertToTextSize(size);

    return (
      <Text
        as="label"
        ref={ref}
        size={textSize}
        weight="medium"
        leading="none"
        className={cn(
          'text-[rgb(var(--foreground))]',
          // Disabled state
          disabled && 'cursor-not-allowed opacity-70',
          // Peer-disabled support (when used with peer class on input)
          'peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
          className
        )}
        data-testid={dataTestId}
        {...props}
      >
        {children}
        {required && (
          <>
            {requiredIndicator ?? (
              <Text as="span" className="ml-1 text-[rgb(var(--destructive))]" aria-hidden={true}>
                *
              </Text>
            )}
            <VisuallyHidden> (required)</VisuallyHidden>
          </>
        )}
        {description && (
          <Text
            as="span"
            id={descriptionId}
            size="xs"
            color="muted-foreground"
            className="mt-1 block font-normal"
          >
            {description}
          </Text>
        )}
      </Text>
    );
  }
);

Label.displayName = 'Label';
