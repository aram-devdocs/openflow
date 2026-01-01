import {
  Box,
  type ResponsiveValue,
  Text,
  VisuallyHidden,
  generateResponsiveClasses,
  getResponsiveBaseValue,
} from '@openflow/primitives';
import { cn } from '@openflow/utils';
import { type ButtonHTMLAttributes, type ReactNode, forwardRef } from 'react';
import { Spinner } from './Spinner';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'destructive';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Visual style variant */
  variant?: ButtonVariant;
  /** Size of the button - supports responsive values */
  size?: ResponsiveValue<ButtonSize>;
  /** Show loading spinner and disable interactions */
  loading?: boolean;
  /** Text to show while loading (replaces children when loading) */
  loadingText?: string;
  /** Icon to show before the button text */
  icon?: ReactNode;
  /** Icon to show after the button text */
  iconAfter?: ReactNode;
  /** Make the button full width */
  fullWidth?: boolean;
  /** Button content */
  children: ReactNode;
}

/**
 * Variant to Tailwind classes mapping.
 * Colors are designed to meet WCAG 2.1 AA contrast requirements.
 */
const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-[rgb(var(--primary))] text-[rgb(var(--primary-foreground))] hover:bg-[rgb(var(--primary))]/90',
  secondary:
    'bg-[rgb(var(--secondary))] text-[rgb(var(--secondary-foreground))] hover:bg-[rgb(var(--secondary))]/80',
  ghost: 'bg-transparent text-[rgb(var(--foreground))] hover:bg-[rgb(var(--muted))]',
  destructive:
    'bg-[rgb(var(--destructive))] text-[rgb(var(--destructive-foreground))] hover:bg-[rgb(var(--destructive))]/90',
};

/**
 * Size to Tailwind classes mapping.
 * Touch targets: 44px minimum on touch devices for WCAG 2.5.5 compliance.
 * Small buttons scale up to 44px height on touch devices.
 */
const sizeClasses: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-xs min-h-[44px] sm:min-h-8',
  md: 'h-9 px-4 text-sm min-h-[44px] sm:min-h-9',
  lg: 'h-10 px-6 text-base min-h-[44px]',
};

/**
 * Map button size to spinner size
 */
const spinnerSizeMap: Record<ButtonSize, 'sm' | 'md' | 'lg'> = {
  sm: 'sm',
  md: 'sm',
  lg: 'md',
};

/**
 * Generate responsive classes for size prop.
 * Uses shared utility from @openflow/primitives.
 */
function getResponsiveSizeClasses(size: ResponsiveValue<ButtonSize>): string[] {
  return generateResponsiveClasses(size, sizeClasses, 'md');
}

/**
 * Get the base size for spinner selection.
 * Uses shared utility from @openflow/primitives.
 */
function getBaseSize(size: ResponsiveValue<ButtonSize>): ButtonSize {
  return getResponsiveBaseValue(size, 'md');
}

/**
 * Button component with multiple variants, loading state, and accessibility.
 *
 * Built on @openflow/primitives for accessibility and responsiveness:
 * - Uses VisuallyHidden for screen reader loading announcements
 * - Supports responsive sizing via ResponsiveValue
 * - Focus ring visible on all backgrounds (ring-offset-2)
 * - Touch target meets WCAG 2.5.5 (≥44px on touch devices)
 *
 * Accessibility:
 * - `aria-busy` is set during loading state
 * - `aria-disabled` reflects disabled/loading state
 * - Screen readers announce "Loading" during loading state
 * - Focus ring uses ring-offset for visibility on all backgrounds
 *
 * @example
 * // Basic usage
 * <Button variant="primary" onClick={handleClick}>
 *   Save Changes
 * </Button>
 *
 * @example
 * // Loading state with custom text
 * <Button variant="primary" loading loadingText="Saving...">
 *   Save Changes
 * </Button>
 *
 * @example
 * // With icon
 * <Button icon={<PlusIcon />}>Add Item</Button>
 *
 * @example
 * // Responsive sizing
 * <Button size={{ base: 'sm', md: 'md', lg: 'lg' }}>
 *   Responsive Button
 * </Button>
 *
 * @example
 * // Full width button
 * <Button fullWidth>Submit</Button>
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = 'primary',
    size = 'md',
    loading = false,
    loadingText,
    icon,
    iconAfter,
    fullWidth = false,
    disabled,
    className,
    children,
    type = 'button',
    ...props
  },
  ref
) {
  const isDisabled = disabled || loading;
  const responsiveSizeClasses = getResponsiveSizeClasses(size);
  const baseSize = getBaseSize(size);

  return (
    <button
      ref={ref}
      type={type}
      disabled={isDisabled}
      aria-busy={loading || undefined}
      aria-disabled={isDisabled || undefined}
      className={cn(
        // Base styles
        'inline-flex items-center justify-center gap-2 rounded-md font-medium',
        'motion-safe:transition-colors motion-safe:duration-150',
        // Focus ring with offset for visibility on all backgrounds
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--ring))] focus-visible:ring-offset-2 focus-visible:ring-offset-[rgb(var(--background))]',
        // Variant styling
        variantClasses[variant],
        // Responsive sizing
        ...responsiveSizeClasses,
        // Full width option
        fullWidth && 'w-full',
        // Disabled/loading state
        isDisabled && 'pointer-events-none opacity-50',
        className
      )}
      {...props}
    >
      {/* Screen reader announcement for loading state */}
      {loading && (
        <VisuallyHidden>
          <Text as="span" aria-live="polite">
            Loading
          </Text>
        </VisuallyHidden>
      )}

      {/* Loading spinner or leading icon */}
      {loading ? (
        <Spinner size={spinnerSizeMap[baseSize]} />
      ) : icon ? (
        <Box as="span" className="shrink-0" aria-hidden={true}>
          {icon}
        </Box>
      ) : null}

      {/* Button text content */}
      {loading && loadingText ? loadingText : children}

      {/* Trailing icon (hidden during loading) */}
      {!loading && iconAfter && (
        <Box as="span" className="shrink-0" aria-hidden={true}>
          {iconAfter}
        </Box>
      )}
    </button>
  );
});

Button.displayName = 'Button';
