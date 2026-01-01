import { Box, type ResponsiveValue, Text, VisuallyHidden } from '@openflow/primitives';
import { cn } from '@openflow/utils';
import { X } from 'lucide-react';
import { type InputHTMLAttributes, type ReactNode, forwardRef, useId } from 'react';

export type InputSize = 'sm' | 'md' | 'lg';
export type InputVariant = 'default' | 'search';

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  /** Visual size of the input - supports responsive values */
  size?: ResponsiveValue<InputSize>;
  /** Input variant for special styling */
  variant?: InputVariant;
  /** Show error styling */
  error?: boolean;
  /** ID of the error message element for aria-describedby */
  errorMessageId?: string;
  /** Leading icon shown before input */
  leadingIcon?: ReactNode;
  /** Trailing icon shown after input (not shown with clear button) */
  trailingIcon?: ReactNode;
  /** Show clear button when input has value (search variant) */
  showClearButton?: boolean;
  /** Callback when clear button is clicked */
  onClear?: () => void;
  /** Data test id for testing */
  'data-testid'?: string;
}

/**
 * Size to Tailwind classes mapping.
 * Touch targets: 44px minimum on touch devices for WCAG 2.5.5 compliance.
 */
const sizeClasses: Record<InputSize, { input: string; icon: string; iconWrapper: string }> = {
  sm: {
    input: 'h-8 px-3 text-xs min-h-[44px] sm:min-h-8',
    icon: 'h-3.5 w-3.5',
    iconWrapper: 'px-2',
  },
  md: {
    input: 'h-9 px-3 text-sm min-h-[44px] sm:min-h-9',
    icon: 'h-4 w-4',
    iconWrapper: 'px-3',
  },
  lg: {
    input: 'h-10 px-4 text-base min-h-[44px]',
    icon: 'h-5 w-5',
    iconWrapper: 'px-3',
  },
};

/**
 * Breakpoint order for responsive class generation
 */
const BREAKPOINT_ORDER = ['base', 'sm', 'md', 'lg', 'xl', '2xl'] as const;
type Breakpoint = (typeof BREAKPOINT_ORDER)[number];

/**
 * Get size classes for the given size prop
 */
export function getSizeClasses(size: ResponsiveValue<InputSize>): {
  input: string[];
  icon: string[];
  iconWrapper: string[];
} {
  const input: string[] = [];
  const icon: string[] = [];
  const iconWrapper: string[] = [];

  if (typeof size === 'string') {
    const classes = sizeClasses[size];
    input.push(...classes.input.split(' '));
    icon.push(...classes.icon.split(' '));
    iconWrapper.push(...classes.iconWrapper.split(' '));
  } else if (typeof size === 'object' && size !== null) {
    for (const breakpoint of BREAKPOINT_ORDER) {
      const breakpointValue = (size as Partial<Record<Breakpoint, InputSize>>)[breakpoint];
      if (breakpointValue !== undefined) {
        const classes = sizeClasses[breakpointValue];
        if (breakpoint === 'base') {
          input.push(...classes.input.split(' '));
          icon.push(...classes.icon.split(' '));
          iconWrapper.push(...classes.iconWrapper.split(' '));
        } else {
          input.push(...classes.input.split(' ').map((c) => `${breakpoint}:${c}`));
          icon.push(...classes.icon.split(' ').map((c) => `${breakpoint}:${c}`));
          iconWrapper.push(...classes.iconWrapper.split(' ').map((c) => `${breakpoint}:${c}`));
        }
      }
    }
  }

  return { input, icon, iconWrapper };
}

/**
 * Get the base size for internal calculations
 */
export function getBaseSize(size: ResponsiveValue<InputSize>): InputSize {
  if (typeof size === 'string') {
    return size;
  }
  if (typeof size === 'object' && size !== null) {
    return (size as Partial<Record<Breakpoint, InputSize>>).base ?? 'md';
  }
  return 'md';
}

/**
 * Input component with accessibility, responsive sizing, and enhanced features.
 *
 * Built on @openflow/primitives for accessibility and responsiveness:
 * - Uses VisuallyHidden for screen reader announcements
 * - Touch target meets WCAG 2.5.5 (≥44px on touch devices)
 * - Focus ring visible on all backgrounds
 * - Error state with aria-describedby support
 * - Placeholder with sufficient contrast
 * - Clear button for search variant
 *
 * Accessibility:
 * - `aria-invalid` is set during error state
 * - `aria-describedby` links to error message
 * - Focus ring uses ring-offset for visibility on all backgrounds
 * - Disabled state has proper semantics
 * - Proper autocomplete attributes support
 *
 * @example
 * // Basic usage
 * <Input placeholder="Enter your name" onChange={handleChange} />
 *
 * @example
 * // With error state and error message
 * <Input
 *   error
 *   errorMessageId="email-error"
 *   aria-describedby="email-error"
 * />
 * <span id="email-error">Please enter a valid email</span>
 *
 * @example
 * // Search variant with clear button
 * <Input
 *   variant="search"
 *   showClearButton
 *   value={searchValue}
 *   onClear={() => setSearchValue('')}
 * />
 *
 * @example
 * // With leading icon
 * <Input leadingIcon={<SearchIcon />} placeholder="Search..." />
 *
 * @example
 * // Responsive sizing
 * <Input size={{ base: 'sm', md: 'md', lg: 'lg' }} />
 *
 * @example
 * // With autocomplete
 * <Input type="email" autoComplete="email" />
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  {
    className,
    error,
    errorMessageId,
    disabled,
    type = 'text',
    size = 'md',
    variant = 'default',
    leadingIcon,
    trailingIcon,
    showClearButton = false,
    onClear,
    value,
    defaultValue,
    'data-testid': dataTestId,
    'aria-describedby': ariaDescribedBy,
    ...props
  },
  ref
) {
  // Generate unique ID for announcements
  const uniqueId = useId();
  const errorAnnouncementId = `input-error-${uniqueId}`;

  // Get responsive size classes
  const {
    input: inputClasses,
    icon: iconClasses,
    iconWrapper: iconWrapperClasses,
  } = getSizeClasses(size);

  // Determine if clear button should be shown
  const hasValue = value !== undefined ? Boolean(value) : Boolean(defaultValue);
  const shouldShowClearButton = showClearButton && hasValue && !disabled;

  // Combine aria-describedby with error message ID if provided
  const describedBy =
    [ariaDescribedBy, errorMessageId, error ? errorAnnouncementId : null]
      .filter(Boolean)
      .join(' ') || undefined;

  // Determine if we have icons
  const hasLeadingIcon = Boolean(leadingIcon);
  const hasTrailingIcon = Boolean(trailingIcon) || shouldShowClearButton;

  // Adjust padding based on icons
  const paddingLeftClass = hasLeadingIcon ? 'pl-10' : '';
  const paddingRightClass = hasTrailingIcon ? 'pr-10' : '';

  return (
    <Box as="span" className="relative inline-flex w-full" data-testid={dataTestId}>
      {/* Screen reader error announcement */}
      {error && (
        <VisuallyHidden>
          <Text as="span" id={errorAnnouncementId} aria-live="assertive">
            This field has an error
          </Text>
        </VisuallyHidden>
      )}

      {/* Leading icon */}
      {hasLeadingIcon && (
        <Box
          as="span"
          className={cn(
            'pointer-events-none absolute inset-y-0 left-0 flex items-center',
            'text-[rgb(var(--muted-foreground))]',
            ...iconWrapperClasses
          )}
          aria-hidden={true}
        >
          <Box as="span" className={cn(...iconClasses)}>
            {leadingIcon}
          </Box>
        </Box>
      )}

      <input
        type={type}
        ref={ref}
        disabled={disabled}
        value={value}
        defaultValue={defaultValue}
        className={cn(
          // Base styles
          'flex w-full rounded-md',
          'bg-[rgb(var(--background))] text-[rgb(var(--foreground))]',
          'border border-[rgb(var(--input))]',
          'motion-safe:transition-colors motion-safe:duration-150',
          // Placeholder with sufficient contrast (at least 4.5:1)
          'placeholder:text-[rgb(var(--muted-foreground))]',
          // Focus state with ring-offset for visibility on all backgrounds
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--ring))] focus-visible:ring-offset-2 focus-visible:ring-offset-[rgb(var(--background))]',
          // Error state
          error && 'border-[rgb(var(--destructive))] focus-visible:ring-[rgb(var(--destructive))]',
          // Disabled state
          disabled && 'cursor-not-allowed opacity-50',
          // File input specific
          type === 'file' &&
            'file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-[rgb(var(--foreground))] cursor-pointer file:cursor-pointer',
          // Search variant styling
          variant === 'search' && 'rounded-full',
          // Responsive size classes
          ...inputClasses,
          // Icon padding adjustments
          paddingLeftClass,
          paddingRightClass,
          className
        )}
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={describedBy}
        {...props}
      />

      {/* Trailing icon or clear button */}
      {hasTrailingIcon && (
        <Box
          as="span"
          className={cn('absolute inset-y-0 right-0 flex items-center', ...iconWrapperClasses)}
        >
          {shouldShowClearButton ? (
            <button
              type="button"
              onClick={onClear}
              disabled={disabled}
              className={cn(
                'rounded-full p-1',
                'text-[rgb(var(--muted-foreground))]',
                'hover:text-[rgb(var(--foreground))]',
                'hover:bg-[rgb(var(--muted))]',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--ring))]',
                'motion-safe:transition-colors motion-safe:duration-150',
                disabled && 'pointer-events-none opacity-50'
              )}
              aria-label="Clear input"
            >
              <X className={cn(...iconClasses)} aria-hidden="true" />
            </button>
          ) : trailingIcon ? (
            <Box
              as="span"
              className={cn(
                'pointer-events-none text-[rgb(var(--muted-foreground))]',
                ...iconClasses
              )}
              aria-hidden={true}
            >
              {trailingIcon}
            </Box>
          ) : null}
        </Box>
      )}
    </Box>
  );
});

Input.displayName = 'Input';
