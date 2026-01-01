import { type ResponsiveValue, Text, VisuallyHidden } from '@openflow/primitives';
import { cn } from '@openflow/utils';
import { forwardRef } from 'react';

export type SpinnerSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export interface SpinnerProps {
  /**
   * Size of the spinner - supports responsive values.
   * @default 'md'
   */
  size?: ResponsiveValue<SpinnerSize>;

  /** Additional CSS classes */
  className?: string;

  /**
   * Accessible label for the spinner.
   * @default 'Loading'
   */
  label?: string;

  /**
   * Override aria-label directly (alternative to label prop).
   */
  'aria-label'?: string;

  /**
   * Whether to announce state changes to screen readers.
   * When true, uses aria-live="polite" region for announcements.
   * @default true
   */
  announce?: boolean;

  /** Data attribute for testing */
  'data-testid'?: string;
}

/**
 * Size to Tailwind classes mapping
 */
const sizeClasses: Record<SpinnerSize, string> = {
  xs: 'h-3 w-3',
  sm: 'h-4 w-4',
  md: 'h-5 w-5',
  lg: 'h-6 w-6',
  xl: 'h-8 w-8',
};

/**
 * Breakpoint order for responsive class generation
 */
const BREAKPOINT_ORDER = ['base', 'sm', 'md', 'lg', 'xl', '2xl'] as const;
type Breakpoint = (typeof BREAKPOINT_ORDER)[number];

/**
 * Default label for screen readers
 */
export const DEFAULT_SPINNER_LABEL = 'Loading';

/**
 * Base classes for the spinner SVG
 */
export const SPINNER_BASE_CLASSES = 'motion-safe:animate-spin';

/**
 * Generate responsive classes for size prop
 */
export function getResponsiveSizeClasses(size: ResponsiveValue<SpinnerSize>): string[] {
  const classes: string[] = [];

  if (typeof size === 'string') {
    // Split static size classes for consistency with responsive behavior
    classes.push(...sizeClasses[size].split(' '));
  } else if (typeof size === 'object' && size !== null) {
    for (const breakpoint of BREAKPOINT_ORDER) {
      const breakpointValue = (size as Partial<Record<Breakpoint, SpinnerSize>>)[breakpoint];
      if (breakpointValue !== undefined) {
        const sizeClass = sizeClasses[breakpointValue];
        // Parse individual classes and add breakpoint prefix
        const individualClasses = sizeClass.split(' ');
        for (const cls of individualClasses) {
          if (breakpoint === 'base') {
            classes.push(cls);
          } else {
            classes.push(`${breakpoint}:${cls}`);
          }
        }
      }
    }
  }

  return classes;
}

/**
 * Spinner component for loading states.
 *
 * Built on @openflow/primitives for accessibility and responsiveness:
 * - Uses VisuallyHidden for screen reader announcements
 * - Supports responsive sizing via ResponsiveValue
 * - role="status" indicates dynamic content region
 * - aria-live="polite" announces to screen readers without interrupting
 * - Respects prefers-reduced-motion preferences (motion-safe:animate-spin)
 *
 * Accessibility:
 * - Screen readers announce the spinner label (default: "Loading")
 * - Spinner is announced when it appears via aria-live region
 * - Animation stops for users with prefers-reduced-motion
 * - Spinner has role="status" for semantic meaning
 *
 * @example
 * // Default loading spinner
 * <Spinner />
 *
 * @example
 * // Different sizes
 * <Spinner size="xs" />
 * <Spinner size="sm" />
 * <Spinner size="md" />
 * <Spinner size="lg" />
 * <Spinner size="xl" />
 *
 * @example
 * // Responsive sizing
 * <Spinner size={{ base: 'sm', md: 'md', lg: 'lg' }} />
 *
 * @example
 * // Custom label
 * <Spinner label="Saving your changes" />
 *
 * @example
 * // In a button (use aria-label on button instead)
 * <button disabled aria-busy={true} aria-label="Loading, please wait">
 *   <Spinner size="sm" announce={false} />
 * </button>
 *
 * @example
 * // Custom color
 * <Spinner className="text-blue-500" />
 */
export const Spinner = forwardRef<SVGSVGElement, SpinnerProps>(function Spinner(
  {
    size = 'md',
    className,
    label,
    'aria-label': ariaLabel,
    announce = true,
    'data-testid': dataTestId,
  },
  ref
) {
  const responsiveSizeClasses = getResponsiveSizeClasses(size);
  const accessibleLabel = ariaLabel ?? label ?? DEFAULT_SPINNER_LABEL;

  return (
    <>
      {/* Screen reader announcement via aria-live region */}
      {announce && (
        <VisuallyHidden>
          <Text as="span" role="status" aria-live="polite">
            {accessibleLabel}
          </Text>
        </VisuallyHidden>
      )}

      <svg
        ref={ref}
        className={cn(SPINNER_BASE_CLASSES, ...responsiveSizeClasses, className)}
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        aria-hidden={true}
        focusable="false"
        data-testid={dataTestId}
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
    </>
  );
});

Spinner.displayName = 'Spinner';
