import { type ResponsiveValue, VisuallyHidden } from '@openflow/primitives';
import { cn } from '@openflow/utils';
import type { LucideIcon, LucideProps } from 'lucide-react';
import { forwardRef } from 'react';

export type IconSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export interface IconProps extends Omit<LucideProps, 'size' | 'ref'> {
  /** The Lucide icon component to render */
  icon: LucideIcon;
  /** Size of the icon - supports responsive values */
  size?: ResponsiveValue<IconSize>;
  /** Additional CSS classes */
  className?: string;
  /**
   * Accessible label for meaningful icons.
   * When provided, the icon is considered meaningful and announced by screen readers.
   * When omitted, aria-hidden={true} is applied (decorative icon).
   */
  'aria-label'?: string;
  /** Data attribute for testing */
  'data-testid'?: string;
}

/**
 * Size to Tailwind classes mapping
 */
const sizeClasses: Record<IconSize, string> = {
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
 * Generate responsive classes for size prop
 */
export function getResponsiveSizeClasses(size: ResponsiveValue<IconSize>): string[] {
  const classes: string[] = [];

  if (typeof size === 'string') {
    classes.push(sizeClasses[size]);
  } else if (typeof size === 'object' && size !== null) {
    for (const breakpoint of BREAKPOINT_ORDER) {
      const breakpointValue = (size as Partial<Record<Breakpoint, IconSize>>)[breakpoint];
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
 * Icon component - wrapper around Lucide React icons with standardized sizing.
 *
 * Built on @openflow/primitives for accessibility and responsiveness:
 * - Uses VisuallyHidden for screen reader labels when icon is meaningful
 * - Supports responsive sizing via ResponsiveValue
 * - Default aria-hidden={true} for decorative icons
 * - aria-label prop for meaningful icons (removes aria-hidden)
 *
 * Accessibility:
 * - **Decorative icons** (no aria-label): Hidden from screen readers with aria-hidden={true}
 * - **Meaningful icons** (with aria-label): Announced by screen readers, aria-hidden removed
 * - When inside a button/link with visible text, icons should remain decorative
 * - When icon-only buttons are used, provide aria-label on the button instead
 *
 * @example
 * // Decorative icon (default - hidden from screen readers)
 * import { Search, Plus, Settings } from 'lucide-react';
 * <Icon icon={Search} size="md" />
 *
 * @example
 * // Meaningful icon with accessible label
 * <Icon icon={AlertCircle} size="lg" aria-label="Warning" />
 *
 * @example
 * // Responsive sizing
 * <Icon icon={Menu} size={{ base: 'md', lg: 'lg' }} />
 *
 * @example
 * // Icon inside button (keep decorative, label on button)
 * <Button aria-label="Add item">
 *   <Icon icon={Plus} />
 * </Button>
 *
 * @example
 * // Custom color
 * <Icon icon={Check} size="md" className="text-green-500" />
 */
export const Icon = forwardRef<SVGSVGElement, IconProps>(function Icon(
  {
    icon: LucideIconComponent,
    size = 'md',
    className,
    'aria-label': ariaLabel,
    'data-testid': dataTestId,
    ...props
  },
  ref
) {
  const responsiveSizeClasses = getResponsiveSizeClasses(size);

  // Determine if icon is meaningful or decorative
  const isMeaningful = !!ariaLabel;

  return (
    <>
      {/* VisuallyHidden label for meaningful icons */}
      {isMeaningful && <VisuallyHidden>{ariaLabel}</VisuallyHidden>}

      <LucideIconComponent
        ref={ref}
        className={cn(...responsiveSizeClasses, className)}
        aria-hidden={isMeaningful ? undefined : 'true'}
        aria-label={isMeaningful ? ariaLabel : undefined}
        role={isMeaningful ? 'img' : undefined}
        focusable="false"
        data-testid={dataTestId}
        {...props}
      />
    </>
  );
});

Icon.displayName = 'Icon';
