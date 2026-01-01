import { Box, Flex, type ResponsiveValue, Text, VisuallyHidden } from '@openflow/primitives';
import { cn } from '@openflow/utils';
import { AlertCircle, CheckCircle, Info, X, XCircle } from 'lucide-react';
import { type HTMLAttributes, type ReactNode, forwardRef } from 'react';

// ============================================================================
// Types
// ============================================================================

export type ToastVariant = 'success' | 'error' | 'warning' | 'info';
export type ToastSize = 'sm' | 'md' | 'lg';

export interface ToastAction {
  /** Button label */
  label: string;
  /** Click handler */
  onClick: () => void;
  /** Optional aria-label for the action button (defaults to label) */
  'aria-label'?: string;
}

export interface ToastProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  /** Unique identifier for the toast */
  id: string;
  /** Visual style variant */
  variant?: ToastVariant;
  /** Size of the toast - supports responsive values */
  size?: ResponsiveValue<ToastSize>;
  /** Title text */
  title: string;
  /** Optional description text */
  description?: string;
  /** Callback when toast is dismissed */
  onDismiss?: (id: string) => void;
  /** Optional action button */
  action?: ToastAction;
  /** Optional custom action element (for backwards compatibility) */
  actionElement?: ReactNode;
  /** Custom aria-label for dismiss button (defaults to "Dismiss notification") */
  dismissLabel?: string;
  /** Data attribute for testing */
  'data-testid'?: string;
}

// ============================================================================
// Constants
// ============================================================================

/**
 * Variant to Tailwind classes mapping.
 * Colors use 20% opacity backgrounds with full color accents for sufficient contrast.
 */
export const VARIANT_CLASSES: Record<ToastVariant, string> = {
  success: 'border-success/50 bg-success/10',
  error: 'border-error/50 bg-error/10',
  warning: 'border-warning/50 bg-warning/10',
  info: 'border-info/50 bg-info/10',
};

/**
 * Icon component mapping for each variant.
 */
export const VARIANT_ICONS: Record<ToastVariant, typeof CheckCircle> = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertCircle,
  info: Info,
};

/**
 * Icon color classes for each variant.
 */
export const VARIANT_ICON_COLORS: Record<ToastVariant, string> = {
  success: 'text-success',
  error: 'text-error',
  warning: 'text-warning',
  info: 'text-info',
};

/**
 * Size to Tailwind classes mapping.
 */
export const SIZE_CLASSES: Record<
  ToastSize,
  { container: string; icon: string; title: string; description: string }
> = {
  sm: {
    container: 'max-w-xs p-3 gap-2',
    icon: 'h-4 w-4',
    title: 'text-xs',
    description: 'text-xs',
  },
  md: {
    container: 'max-w-sm p-4 gap-3',
    icon: 'h-5 w-5',
    title: 'text-sm',
    description: 'text-sm',
  },
  lg: {
    container: 'max-w-md p-5 gap-4',
    icon: 'h-6 w-6',
    title: 'text-base',
    description: 'text-base',
  },
};

/**
 * Base toast classes that don't change with variant or size.
 */
export const TOAST_BASE_CLASSES = cn(
  'pointer-events-auto flex w-full items-start rounded-lg border shadow-lg',
  'bg-[rgb(var(--card))] text-[rgb(var(--foreground))]',
  // Motion-safe transitions
  'motion-safe:transition-all motion-safe:duration-200'
);

/**
 * Default dismiss button label
 */
export const DEFAULT_DISMISS_LABEL = 'Dismiss notification';

/**
 * Breakpoint order for responsive class generation
 */
const BREAKPOINT_ORDER = ['base', 'sm', 'md', 'lg', 'xl', '2xl'] as const;
type Breakpoint = (typeof BREAKPOINT_ORDER)[number];

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Get size-related classes for responsive size prop
 * @param size - Size value or responsive object
 * @returns Object with container, icon, title, and description class strings
 */
export function getSizeClasses(size: ResponsiveValue<ToastSize>): {
  container: string;
  icon: string;
  title: string;
  description: string;
} {
  if (typeof size === 'string') {
    return SIZE_CLASSES[size];
  }

  if (typeof size === 'object' && size !== null) {
    const containerClasses: string[] = [];
    const iconClasses: string[] = [];
    const titleClasses: string[] = [];
    const descriptionClasses: string[] = [];

    for (const breakpoint of BREAKPOINT_ORDER) {
      const breakpointValue = (size as Partial<Record<Breakpoint, ToastSize>>)[breakpoint];
      if (breakpointValue !== undefined) {
        const sizeClass = SIZE_CLASSES[breakpointValue];
        const prefix = breakpoint === 'base' ? '' : `${breakpoint}:`;

        // For responsive, we need to apply classes individually
        containerClasses.push(...sizeClass.container.split(' ').map((c) => `${prefix}${c}`));
        iconClasses.push(...sizeClass.icon.split(' ').map((c) => `${prefix}${c}`));
        titleClasses.push(...sizeClass.title.split(' ').map((c) => `${prefix}${c}`));
        descriptionClasses.push(...sizeClass.description.split(' ').map((c) => `${prefix}${c}`));
      }
    }

    return {
      container: containerClasses.join(' '),
      icon: iconClasses.join(' '),
      title: titleClasses.join(' '),
      description: descriptionClasses.join(' '),
    };
  }

  // Default to md
  return SIZE_CLASSES.md;
}

/**
 * Get the base (non-responsive) size for calculations
 */
export function getBaseSize(size: ResponsiveValue<ToastSize>): ToastSize {
  if (typeof size === 'string') {
    return size;
  }
  if (typeof size === 'object' && size !== null) {
    // Return base or first defined breakpoint
    const responsiveSize = size as Partial<Record<Breakpoint, ToastSize>>;
    for (const breakpoint of BREAKPOINT_ORDER) {
      if (responsiveSize[breakpoint] !== undefined) {
        return responsiveSize[breakpoint];
      }
    }
  }
  return 'md';
}

/**
 * Get the ARIA role based on variant
 * - Errors use role="alert" (assertive, immediate)
 * - Other variants use role="status" (polite, waits for pause)
 */
export function getAriaRole(variant: ToastVariant): 'alert' | 'status' {
  return variant === 'error' ? 'alert' : 'status';
}

/**
 * Get the aria-live politeness level based on variant
 * - Errors use "assertive" to immediately interrupt screen readers
 * - Other variants use "polite" to wait for a pause in speech
 */
export function getAriaLive(variant: ToastVariant): 'assertive' | 'polite' {
  return variant === 'error' ? 'assertive' : 'polite';
}

// ============================================================================
// Component
// ============================================================================

/**
 * Toast notification component.
 * Displays a brief message that auto-dismisses or can be manually closed.
 *
 * ## Accessibility Features
 * - Uses `role="alert"` for errors (assertive) and `role="status"` for others (polite)
 * - `aria-live` region for screen reader announcements
 * - `aria-atomic="true"` ensures entire toast is read as a unit
 * - Dismiss button has proper accessible label
 * - Touch target ≥44px on mobile (WCAG 2.5.5)
 * - Icons are decorative (aria-hidden)
 * - Status conveyed beyond color through icons
 *
 * ## Responsive
 * - Supports responsive sizes via ResponsiveValue<ToastSize>
 * - Proper stacking on mobile screens
 *
 * @example Basic usage
 * ```tsx
 * <Toast
 *   id="1"
 *   variant="success"
 *   title="Project created"
 *   description="Your project has been successfully created."
 *   onDismiss={handleDismiss}
 * />
 * ```
 *
 * @example With action button
 * ```tsx
 * <Toast
 *   id="2"
 *   variant="error"
 *   title="Failed to save"
 *   action={{ label: 'Retry', onClick: handleRetry }}
 *   onDismiss={handleDismiss}
 * />
 * ```
 *
 * @example Responsive size
 * ```tsx
 * <Toast
 *   id="3"
 *   variant="info"
 *   size={{ base: 'sm', md: 'md', lg: 'lg' }}
 *   title="Responsive toast"
 *   onDismiss={handleDismiss}
 * />
 * ```
 */
export const Toast = forwardRef<HTMLDivElement, ToastProps>(function Toast(
  {
    id,
    variant = 'info',
    size = 'md',
    title,
    description,
    onDismiss,
    action,
    actionElement,
    dismissLabel = DEFAULT_DISMISS_LABEL,
    className,
    'data-testid': testId,
    'aria-hidden': _ariaHidden,
    ...props
  },
  ref
) {
  const Icon = VARIANT_ICONS[variant];
  const sizeClasses = getSizeClasses(size);
  const role = getAriaRole(variant);
  const ariaLive = getAriaLive(variant);

  // Exclude all ARIA Booleanish props that conflict with BoxProps strict boolean types
  const {
    'aria-busy': _ariaBusy,
    'aria-atomic': _ariaAtomic,
    'aria-expanded': _ariaExpanded,
    'aria-pressed': _ariaPressed,
    'aria-selected': _ariaSelected,
    'aria-checked': _ariaChecked,
    'aria-disabled': _ariaDisabled,
    'aria-required': _ariaRequired,
    'aria-invalid': _ariaInvalid,
    'aria-haspopup': _ariaHaspopup,
    'aria-current': _ariaCurrent,
    ...restProps
  } = props;

  return (
    <Box
      ref={ref}
      role={role}
      aria-live={ariaLive}
      aria-atomic={true}
      data-testid={testId}
      data-variant={variant}
      className={cn(TOAST_BASE_CLASSES, VARIANT_CLASSES[variant], sizeClasses.container, className)}
      {...restProps}
    >
      {/* Status icon - decorative, status conveyed via text and role */}
      <Icon
        className={cn('shrink-0', sizeClasses.icon, VARIANT_ICON_COLORS[variant])}
        aria-hidden={true}
      />

      {/* Screen reader announcement for variant */}
      <VisuallyHidden>
        {variant === 'error' && 'Error: '}
        {variant === 'warning' && 'Warning: '}
        {variant === 'success' && 'Success: '}
      </VisuallyHidden>

      {/* Content area */}
      <Flex direction="column" gap="1" className="min-w-0 flex-1">
        <Text as="p" className={cn('font-medium', sizeClasses.title)}>
          {title}
        </Text>

        {description && (
          <Text
            as="p"
            className={cn('text-[rgb(var(--muted-foreground))]', sizeClasses.description)}
          >
            {description}
          </Text>
        )}

        {action && (
          <button
            type="button"
            onClick={action.onClick}
            aria-label={action['aria-label'] || action.label}
            className={cn(
              'mt-2 self-start font-medium underline underline-offset-2',
              'text-[rgb(var(--primary))]',
              'hover:no-underline',
              // Focus ring for accessibility
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--ring))] focus-visible:ring-offset-2',
              // Touch target ≥44px on mobile
              'min-h-[44px] sm:min-h-0 flex items-center',
              sizeClasses.description
            )}
          >
            {action.label}
          </button>
        )}

        {actionElement && <Box className="mt-2">{actionElement}</Box>}
      </Flex>

      {/* Dismiss button */}
      {onDismiss && (
        <button
          type="button"
          onClick={() => onDismiss(id)}
          aria-label={dismissLabel}
          data-testid={testId ? `${testId}-dismiss` : undefined}
          className={cn(
            'shrink-0 rounded p-1',
            'text-[rgb(var(--muted-foreground))]',
            'hover:bg-[rgb(var(--muted))] hover:text-[rgb(var(--foreground))]',
            // Focus ring for accessibility
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--ring))] focus-visible:ring-offset-2',
            // Touch target ≥44px on mobile (WCAG 2.5.5)
            'min-h-[44px] min-w-[44px] sm:min-h-8 sm:min-w-8',
            'flex items-center justify-center'
          )}
        >
          <X className="h-4 w-4" aria-hidden={true} />
        </button>
      )}
    </Box>
  );
});

Toast.displayName = 'Toast';
