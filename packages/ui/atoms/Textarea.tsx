import { Box, type ResponsiveValue, Text, VisuallyHidden } from '@openflow/primitives';
import { cn } from '@openflow/utils';
import { type TextareaHTMLAttributes, forwardRef, useId, useMemo } from 'react';

export type TextareaSize = 'sm' | 'md' | 'lg';
export type TextareaResize = 'none' | 'vertical' | 'horizontal' | 'both';

export interface TextareaProps extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'size'> {
  /** Visual size of the textarea - supports responsive values */
  size?: ResponsiveValue<TextareaSize>;
  /** Show error styling */
  error?: boolean;
  /** ID of the error message element for aria-describedby */
  errorMessageId?: string;
  /** Control resize behavior */
  resize?: TextareaResize;
  /** Show character count (requires maxLength) */
  showCharacterCount?: boolean;
  /** Current character count (for controlled components) */
  characterCount?: number;
  /** Data test id for testing */
  'data-testid'?: string;
}

/**
 * Size to Tailwind classes mapping.
 * Touch targets: 44px minimum on touch devices for WCAG 2.5.5 compliance.
 */
const sizeClasses: Record<TextareaSize, string> = {
  sm: 'min-h-[80px] px-3 py-2 text-xs sm:min-h-[80px]',
  md: 'min-h-[80px] px-3 py-2 text-sm sm:min-h-[80px]',
  lg: 'min-h-[100px] px-4 py-3 text-base sm:min-h-[100px]',
};

/**
 * Breakpoint order for responsive class generation
 */
const BREAKPOINT_ORDER = ['base', 'sm', 'md', 'lg', 'xl', '2xl'] as const;
type Breakpoint = (typeof BREAKPOINT_ORDER)[number];

/**
 * Resize mode to Tailwind class mapping
 */
const resizeClasses: Record<TextareaResize, string> = {
  none: 'resize-none',
  vertical: 'resize-y',
  horizontal: 'resize-x',
  both: 'resize',
};

/**
 * Get size classes for the given size prop
 */
export function getSizeClasses(size: ResponsiveValue<TextareaSize>): string[] {
  const classes: string[] = [];

  if (typeof size === 'string') {
    classes.push(...sizeClasses[size].split(' '));
  } else if (typeof size === 'object' && size !== null) {
    for (const breakpoint of BREAKPOINT_ORDER) {
      const breakpointValue = (size as Partial<Record<Breakpoint, TextareaSize>>)[breakpoint];
      if (breakpointValue !== undefined) {
        const sizeClass = sizeClasses[breakpointValue];
        if (breakpoint === 'base') {
          classes.push(...sizeClass.split(' '));
        } else {
          classes.push(...sizeClass.split(' ').map((c) => `${breakpoint}:${c}`));
        }
      }
    }
  }

  return classes;
}

/**
 * Get the base size for internal calculations
 */
export function getBaseSize(size: ResponsiveValue<TextareaSize>): TextareaSize {
  if (typeof size === 'string') {
    return size;
  }
  if (typeof size === 'object' && size !== null) {
    return (size as Partial<Record<Breakpoint, TextareaSize>>).base ?? 'md';
  }
  return 'md';
}

/**
 * Character count text size based on textarea size
 */
const charCountTextSizes: Record<TextareaSize, string> = {
  sm: 'text-xs',
  md: 'text-xs',
  lg: 'text-sm',
};

/**
 * Base classes for the textarea element
 */
export const TEXTAREA_BASE_CLASSES = [
  'flex',
  'w-full',
  'rounded-md',
  'bg-[rgb(var(--background))]',
  'text-[rgb(var(--foreground))]',
  'border',
  'border-[rgb(var(--input))]',
  'motion-safe:transition-colors',
  'motion-safe:duration-150',
  'placeholder:text-[rgb(var(--muted-foreground))]',
  'focus-visible:outline-none',
  'focus-visible:ring-2',
  'focus-visible:ring-[rgb(var(--ring))]',
  'focus-visible:ring-offset-2',
  'focus-visible:ring-offset-[rgb(var(--background))]',
] as const;

/**
 * Textarea component with accessibility, responsive sizing, and enhanced features.
 *
 * Built on @openflow/primitives for accessibility and responsiveness:
 * - Uses VisuallyHidden for screen reader announcements
 * - Error state with aria-describedby support
 * - Placeholder with sufficient contrast
 * - Optional character count display
 * - Focus ring visible on all backgrounds
 *
 * Accessibility:
 * - `aria-invalid` is set during error state
 * - `aria-describedby` links to error message and character count
 * - Focus ring uses ring-offset for visibility on all backgrounds
 * - Disabled state has proper semantics
 * - Character count announced to screen readers
 *
 * @example
 * // Basic usage
 * <Textarea placeholder="Enter description" onChange={handleChange} />
 *
 * @example
 * // With error state and error message
 * <Textarea
 *   error
 *   errorMessageId="desc-error"
 *   aria-describedby="desc-error"
 * />
 * <span id="desc-error">Description is required</span>
 *
 * @example
 * // With character count
 * <Textarea
 *   maxLength={500}
 *   showCharacterCount
 *   value={value}
 *   onChange={(e) => setValue(e.target.value)}
 * />
 *
 * @example
 * // Responsive sizing
 * <Textarea size={{ base: 'sm', md: 'md', lg: 'lg' }} />
 */
export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  {
    className,
    error,
    errorMessageId,
    disabled,
    size = 'md',
    resize = 'vertical',
    maxLength,
    showCharacterCount = false,
    characterCount,
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
  const errorAnnouncementId = `textarea-error-${uniqueId}`;
  const charCountId = `textarea-charcount-${uniqueId}`;

  // Get responsive size classes
  const textareaSizeClasses = getSizeClasses(size);
  const baseSize = getBaseSize(size);

  // Calculate current character count
  const currentCount = useMemo(() => {
    if (characterCount !== undefined) {
      return characterCount;
    }
    if (typeof value === 'string') {
      return value.length;
    }
    if (typeof defaultValue === 'string') {
      return defaultValue.length;
    }
    return 0;
  }, [characterCount, value, defaultValue]);

  // Determine if character count should be shown
  const shouldShowCharCount = showCharacterCount && maxLength !== undefined;

  // Character count status for screen readers
  const charCountStatus = useMemo(() => {
    if (!shouldShowCharCount || maxLength === undefined) return null;
    const remaining = maxLength - currentCount;
    if (remaining <= 0) {
      return 'Character limit reached';
    }
    if (remaining <= 10) {
      return `${remaining} characters remaining`;
    }
    return null;
  }, [shouldShowCharCount, maxLength, currentCount]);

  // Combine aria-describedby with error message ID and character count
  const describedBy =
    [
      ariaDescribedBy,
      errorMessageId,
      error ? errorAnnouncementId : null,
      shouldShowCharCount ? charCountId : null,
    ]
      .filter(Boolean)
      .join(' ') || undefined;

  // Resize class
  const resizeClass = resizeClasses[resize];

  return (
    <Box as="span" className="relative flex w-full flex-col" data-testid={dataTestId}>
      {/* Screen reader error announcement */}
      {error && (
        <VisuallyHidden>
          <Text as="span" id={errorAnnouncementId} aria-live="assertive">
            This field has an error
          </Text>
        </VisuallyHidden>
      )}

      {/* Screen reader character count announcement */}
      {charCountStatus && (
        <VisuallyHidden>
          <Text as="span" aria-live="polite" aria-atomic="true">
            {charCountStatus}
          </Text>
        </VisuallyHidden>
      )}

      <textarea
        ref={ref}
        disabled={disabled}
        maxLength={maxLength}
        value={value}
        defaultValue={defaultValue}
        className={cn(
          // Base styles
          ...TEXTAREA_BASE_CLASSES,
          // Error state
          error && 'border-[rgb(var(--destructive))] focus-visible:ring-[rgb(var(--destructive))]',
          // Disabled state
          disabled && 'cursor-not-allowed opacity-50',
          // Resize control
          resizeClass,
          // Responsive size classes
          ...textareaSizeClasses,
          className
        )}
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={describedBy}
        {...props}
      />

      {/* Visual character count */}
      {shouldShowCharCount && maxLength !== undefined && (
        <Text
          as="span"
          id={charCountId}
          className={cn(
            'mt-1 text-right',
            charCountTextSizes[baseSize],
            currentCount >= maxLength
              ? 'text-[rgb(var(--destructive))]'
              : 'text-[rgb(var(--muted-foreground))]'
          )}
          aria-hidden={true}
        >
          {currentCount}/{maxLength}
        </Text>
      )}
    </Box>
  );
});

Textarea.displayName = 'Textarea';
