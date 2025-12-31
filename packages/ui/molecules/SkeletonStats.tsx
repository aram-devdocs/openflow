/**
 * SkeletonStats Molecule - Loading placeholder for stats/metrics dashboard cards
 *
 * Provides visual loading indication while stats data is being fetched.
 * Matches the dashboard StatCard layout with label and value.
 *
 * Features:
 * - Uses Skeleton atom for consistent loading placeholders
 * - Responsive sizing support via ResponsiveValue
 * - Properly hidden from screen readers (aria-hidden="true")
 * - forwardRef support for ref forwarding
 * - data-testid support for testing
 */

import type { Breakpoint, ResponsiveValue } from '@openflow/primitives';
import { cn } from '@openflow/utils';
import { type HTMLAttributes, forwardRef } from 'react';
import { Skeleton } from '../atoms/Skeleton';

/** Skeleton stats size variants */
export type SkeletonStatsSize = 'sm' | 'md' | 'lg';

/** Breakpoint names for responsive values - re-exported for convenience */
export type SkeletonStatsBreakpoint = Breakpoint;

/**
 * SkeletonStats component props
 */
export interface SkeletonStatsProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  /**
   * Size variant for the skeleton stats
   * - 'sm': Compact spacing (12px padding, smaller elements)
   * - 'md': Standard spacing (16px padding) - default
   * - 'lg': Larger spacing (20px padding, larger elements)
   */
  size?: ResponsiveValue<SkeletonStatsSize>;
  /** Number of stat cards to render */
  count?: number;
  /** Whether to show trend indicator skeleton */
  showTrend?: boolean;
  /** Whether to show icon skeleton */
  showIcon?: boolean;
  /** Data attribute for testing */
  'data-testid'?: string;
}

/** Default number of stat cards to display */
export const DEFAULT_STAT_COUNT = 4;

/** Base classes for the skeleton stats container */
export const SKELETON_STATS_BASE_CLASSES = 'grid';

/** Size-specific classes for grid gap */
export const SKELETON_STATS_GAP_CLASSES: Record<SkeletonStatsSize, string> = {
  sm: 'gap-3',
  md: 'gap-4',
  lg: 'gap-6',
};

/** Grid column classes - responsive by default */
export const SKELETON_STATS_GRID_CLASSES = 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4';

/** Size-specific classes for stat card container */
export const SKELETON_STAT_CARD_CLASSES =
  'rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--card))]';

/** Size-specific classes for card padding */
export const SKELETON_STAT_CARD_PADDING_CLASSES: Record<SkeletonStatsSize, string> = {
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-5',
};

/** Size-specific classes for label skeleton */
export const SKELETON_STAT_LABEL_CLASSES: Record<SkeletonStatsSize, string> = {
  sm: 'h-3 w-16',
  md: 'h-3 w-20',
  lg: 'h-4 w-24',
};

/** Size-specific classes for value skeleton */
export const SKELETON_STAT_VALUE_CLASSES: Record<SkeletonStatsSize, string> = {
  sm: 'h-6 w-10',
  md: 'h-8 w-12',
  lg: 'h-10 w-16',
};

/** Size-specific classes for label to value gap */
export const SKELETON_STAT_GAP_CLASSES: Record<SkeletonStatsSize, string> = {
  sm: 'gap-1',
  md: 'gap-2',
  lg: 'gap-3',
};

/** Size-specific classes for trend skeleton */
export const SKELETON_STAT_TREND_CLASSES: Record<SkeletonStatsSize, string> = {
  sm: 'h-3 w-12',
  md: 'h-3.5 w-14',
  lg: 'h-4 w-16',
};

/** Size-specific classes for icon skeleton */
export const SKELETON_STAT_ICON_CLASSES: Record<
  SkeletonStatsSize,
  { width: number; height: number }
> = {
  sm: { width: 16, height: 16 },
  md: { width: 20, height: 20 },
  lg: { width: 24, height: 24 },
};

/** Size-specific classes for icon container margin */
export const SKELETON_STAT_ICON_MARGIN_CLASSES: Record<SkeletonStatsSize, string> = {
  sm: 'mb-2',
  md: 'mb-3',
  lg: 'mb-4',
};

/** Size-specific classes for trend margin */
export const SKELETON_STAT_TREND_MARGIN_CLASSES: Record<SkeletonStatsSize, string> = {
  sm: 'mt-1',
  md: 'mt-2',
  lg: 'mt-3',
};

/** Breakpoint order for responsive values */
const BREAKPOINT_ORDER: Breakpoint[] = ['base', 'sm', 'md', 'lg', 'xl', '2xl'];

/** Type for responsive size object */
type ResponsiveSizeObject = Partial<Record<Breakpoint, SkeletonStatsSize>>;

/**
 * Check if value is a responsive object (not a string size)
 */
function isResponsiveObject(
  value: ResponsiveValue<SkeletonStatsSize>
): value is ResponsiveSizeObject {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Get base size from responsive value
 */
export function getBaseSize(size: ResponsiveValue<SkeletonStatsSize>): SkeletonStatsSize {
  if (!isResponsiveObject(size)) {
    return size;
  }
  return size.base ?? 'md';
}

/**
 * Get responsive size classes for a given class map
 */
export function getResponsiveSizeClasses(
  size: ResponsiveValue<SkeletonStatsSize>,
  classMap: Record<SkeletonStatsSize, string>
): string {
  if (!isResponsiveObject(size)) {
    return classMap[size];
  }

  const classes: string[] = [];

  for (const bp of BREAKPOINT_ORDER) {
    const sizeValue = size[bp];
    if (sizeValue !== undefined) {
      const sizeClasses = classMap[sizeValue];
      if (bp === 'base') {
        // Base classes without breakpoint prefix
        classes.push(sizeClasses);
      } else {
        // Add breakpoint prefix to each class
        const prefixedClasses = sizeClasses
          .split(' ')
          .map((c) => `${bp}:${c}`)
          .join(' ');
        classes.push(prefixedClasses);
      }
    }
  }

  return classes.join(' ');
}

/**
 * Get icon dimensions based on size (uses base size for responsive objects)
 */
export function getIconDimensions(size: ResponsiveValue<SkeletonStatsSize>): {
  width: number;
  height: number;
} {
  const baseSize = getBaseSize(size);
  return SKELETON_STAT_ICON_CLASSES[baseSize];
}

/**
 * SkeletonStats - Loading placeholder for stats/metrics dashboard cards
 *
 * Provides visual loading indication while stats data is being fetched.
 * Matches the dashboard StatCard layout with label and value.
 *
 * @example
 * // Default 4 stats
 * <SkeletonStats />
 *
 * @example
 * // Custom count
 * <SkeletonStats count={3} />
 *
 * @example
 * // With trend indicators
 * <SkeletonStats showTrend />
 *
 * @example
 * // With icons
 * <SkeletonStats showIcon />
 *
 * @example
 * // Small size
 * <SkeletonStats size="sm" />
 *
 * @example
 * // Responsive sizing
 * <SkeletonStats size={{ base: 'sm', md: 'md', lg: 'lg' }} />
 */
export const SkeletonStats = forwardRef<HTMLDivElement, SkeletonStatsProps>(function SkeletonStats(
  {
    className,
    size = 'md',
    count = DEFAULT_STAT_COUNT,
    showTrend = false,
    showIcon = false,
    'data-testid': dataTestId,
    ...props
  },
  ref
) {
  const gapClasses = getResponsiveSizeClasses(size, SKELETON_STATS_GAP_CLASSES);
  const cardPaddingClasses = getResponsiveSizeClasses(size, SKELETON_STAT_CARD_PADDING_CLASSES);
  const labelClasses = getResponsiveSizeClasses(size, SKELETON_STAT_LABEL_CLASSES);
  const valueClasses = getResponsiveSizeClasses(size, SKELETON_STAT_VALUE_CLASSES);
  const contentGapClasses = getResponsiveSizeClasses(size, SKELETON_STAT_GAP_CLASSES);
  const trendClasses = getResponsiveSizeClasses(size, SKELETON_STAT_TREND_CLASSES);
  const trendMarginClasses = getResponsiveSizeClasses(size, SKELETON_STAT_TREND_MARGIN_CLASSES);
  const iconMarginClasses = getResponsiveSizeClasses(size, SKELETON_STAT_ICON_MARGIN_CLASSES);
  const iconDimensions = getIconDimensions(size);

  return (
    <div
      ref={ref}
      className={cn(
        SKELETON_STATS_BASE_CLASSES,
        SKELETON_STATS_GRID_CLASSES,
        gapClasses,
        className
      )}
      aria-hidden={true}
      role="presentation"
      data-testid={dataTestId}
      data-count={count}
      data-size={typeof size === 'string' ? size : 'responsive'}
      data-show-trend={showTrend}
      data-show-icon={showIcon}
      {...props}
    >
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={`skeleton-stat-${index}`}
          className={cn(SKELETON_STAT_CARD_CLASSES, cardPaddingClasses)}
          data-testid={dataTestId ? `${dataTestId}-stat-${index}` : undefined}
        >
          {/* Icon skeleton */}
          {showIcon && (
            <Skeleton
              variant="circular"
              width={iconDimensions.width}
              height={iconDimensions.height}
              className={iconMarginClasses}
              data-testid={dataTestId ? `${dataTestId}-stat-${index}-icon` : undefined}
            />
          )}

          {/* Content: label and value */}
          <div className={cn('flex flex-col', contentGapClasses)}>
            <Skeleton
              variant="text"
              className={labelClasses}
              data-testid={dataTestId ? `${dataTestId}-stat-${index}-label` : undefined}
            />
            <Skeleton
              className={valueClasses}
              data-testid={dataTestId ? `${dataTestId}-stat-${index}-value` : undefined}
            />
          </div>

          {/* Trend skeleton */}
          {showTrend && (
            <Skeleton
              variant="text"
              className={cn(trendClasses, trendMarginClasses)}
              data-testid={dataTestId ? `${dataTestId}-stat-${index}-trend` : undefined}
            />
          )}
        </div>
      ))}
    </div>
  );
});

SkeletonStats.displayName = 'SkeletonStats';
