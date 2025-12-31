/**
 * Skeleton Atom - Loading placeholder component
 *
 * Provides visual loading indication while content is being fetched.
 * Uses Box primitive for consistent spacing and accessibility.
 *
 * Features:
 * - Three variants: text, circular, rectangular
 * - Responsive width and height support
 * - Respects prefers-reduced-motion via motion-safe:
 * - Properly hidden from screen readers (aria-hidden="true")
 * - forwardRef support for ref forwarding
 * - data-testid support for testing
 */

import { cn } from '@openflow/utils';
import { type CSSProperties, type HTMLAttributes, forwardRef } from 'react';

/** Skeleton shape variants */
export type SkeletonVariant = 'text' | 'circular' | 'rectangular';

/** Dimension value - number (px), string (any CSS unit), or responsive */
export type SkeletonDimension = string | number;

/** Breakpoint names for responsive values */
export type SkeletonBreakpoint = 'base' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

/** Responsive skeleton dimension value */
export type ResponsiveSkeletonDimension =
  | SkeletonDimension
  | Partial<Record<SkeletonBreakpoint, SkeletonDimension>>;

/**
 * Skeleton component props
 */
export interface SkeletonProps extends Omit<HTMLAttributes<HTMLDivElement>, 'width' | 'height'> {
  /** Shape variant of the skeleton */
  variant?: SkeletonVariant;
  /**
   * Width of the skeleton
   * - number: pixels (e.g., 200 → "200px")
   * - string: any CSS unit (e.g., "100%", "10rem")
   * - responsive: { base: value, md: value, lg: value }
   */
  width?: ResponsiveSkeletonDimension;
  /**
   * Height of the skeleton
   * - number: pixels (e.g., 40 → "40px")
   * - string: any CSS unit (e.g., "100%", "2rem")
   * - responsive: { base: value, md: value, lg: value }
   */
  height?: ResponsiveSkeletonDimension;
  /** Data attribute for testing */
  'data-testid'?: string;
}

/** Breakpoint order for responsive values */
const BREAKPOINT_ORDER: SkeletonBreakpoint[] = ['base', 'sm', 'md', 'lg', 'xl', '2xl'];

/**
 * Convert dimension value to CSS string
 */
function dimensionToCSS(value: SkeletonDimension): string {
  return typeof value === 'number' ? `${value}px` : value;
}

/**
 * Check if value is a responsive object
 */
function isResponsiveObject(
  value: ResponsiveSkeletonDimension
): value is Partial<Record<SkeletonBreakpoint, SkeletonDimension>> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** Extended CSSProperties to allow CSS custom properties */
interface ExtendedCSSProperties extends CSSProperties {
  [key: `--${string}`]: string | undefined;
}

/**
 * Get responsive CSS custom property classes and style object
 *
 * For non-responsive values, returns a style object.
 * For responsive values, generates CSS custom properties with breakpoint classes.
 */
function getResponsiveDimensionStyles(
  propName: 'width' | 'height',
  value: ResponsiveSkeletonDimension | undefined
): { classes: string[]; style: ExtendedCSSProperties } {
  if (value === undefined) {
    return { classes: [], style: {} };
  }

  if (!isResponsiveObject(value)) {
    // Simple value - just use inline style
    return {
      classes: [],
      style: { [propName]: dimensionToCSS(value) },
    };
  }

  // Responsive object - generate CSS custom property with breakpoint overrides
  const cssVar = `--skeleton-${propName}` as const;
  const classes: string[] = [];
  const style: ExtendedCSSProperties = {};

  // Use CSS custom property for the dimension
  style[propName] = `var(${cssVar})`;

  // Set base value as CSS variable
  if (value.base !== undefined) {
    style[cssVar] = dimensionToCSS(value.base);
  }

  // Generate breakpoint-specific classes
  // We use arbitrary properties in Tailwind: [--skeleton-width:200px]
  for (const bp of BREAKPOINT_ORDER) {
    if (bp === 'base') continue; // Already handled in style
    const bpValue = value[bp];
    if (bpValue !== undefined) {
      classes.push(`${bp}:[${cssVar}:${dimensionToCSS(bpValue)}]`);
    }
  }

  return { classes, style };
}

/**
 * Get variant-specific Tailwind classes
 */
export function getVariantClasses(variant: SkeletonVariant): string {
  switch (variant) {
    case 'circular':
      return 'rounded-full';
    case 'text':
      return 'h-4 rounded';
    default:
      return 'rounded-md';
  }
}

/**
 * Base skeleton classes (animation and background)
 */
export const SKELETON_BASE_CLASSES = 'bg-[rgb(var(--muted))] motion-safe:animate-pulse';

/**
 * Skeleton - Loading placeholder component
 *
 * Provides visual loading indication while content is being fetched.
 * Properly hidden from screen readers and respects reduced motion preferences.
 *
 * @example
 * // Basic rectangular skeleton
 * <Skeleton width={200} height={40} />
 *
 * @example
 * // Text skeleton (default height of h-4)
 * <Skeleton variant="text" className="w-3/4" />
 *
 * @example
 * // Circular avatar skeleton
 * <Skeleton variant="circular" width={48} height={48} />
 *
 * @example
 * // Responsive width skeleton
 * <Skeleton
 *   variant="rectangular"
 *   width={{ base: 200, md: 300, lg: 400 }}
 *   height={100}
 * />
 *
 * @example
 * // Full-width responsive skeleton
 * <Skeleton
 *   variant="rectangular"
 *   width="100%"
 *   height={{ base: 100, md: 150, lg: 200 }}
 * />
 */
export const Skeleton = forwardRef<HTMLDivElement, SkeletonProps>(function Skeleton(
  { variant = 'rectangular', width, height, className, style, 'data-testid': dataTestId, ...props },
  ref
) {
  // Get responsive dimension styles and classes
  const widthResult = getResponsiveDimensionStyles('width', width);
  const heightResult = getResponsiveDimensionStyles('height', height);

  // Merge styles
  const computedStyle: ExtendedCSSProperties = {
    ...style,
    ...widthResult.style,
    ...heightResult.style,
  };

  // Merge classes
  const responsiveClasses = [...widthResult.classes, ...heightResult.classes];

  return (
    <div
      ref={ref}
      className={cn(
        SKELETON_BASE_CLASSES,
        getVariantClasses(variant),
        ...responsiveClasses,
        className
      )}
      style={computedStyle}
      aria-hidden={true}
      data-testid={dataTestId}
      {...props}
    />
  );
});

Skeleton.displayName = 'Skeleton';
