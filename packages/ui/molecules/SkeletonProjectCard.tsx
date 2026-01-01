/**
 * SkeletonProjectCard Molecule - Loading placeholder for project card layouts
 *
 * Provides visual loading indication while project card content is being fetched.
 * Matches the ProjectCard component layout in the projects list.
 *
 * Features:
 * - Uses Skeleton atom for consistent loading placeholders
 * - Responsive sizing support via ResponsiveValue
 * - Properly hidden from screen readers (aria-hidden={true})
 * - forwardRef support for ref forwarding
 * - data-testid support for testing
 */

import { Box, type Breakpoint, type ResponsiveValue } from '@openflow/primitives';
import { cn } from '@openflow/utils';
import { type HTMLAttributes, forwardRef } from 'react';
import { Skeleton } from '../atoms/Skeleton';

/** Skeleton project card size variants */
export type SkeletonProjectCardSize = 'sm' | 'md' | 'lg';

/** Breakpoint names for responsive values - re-exported for convenience */
export type SkeletonProjectCardBreakpoint = Breakpoint;

/**
 * SkeletonProjectCard component props
 */
export interface SkeletonProjectCardProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  /**
   * Size variant for the skeleton project card
   * - 'sm': Compact spacing (12px padding, smaller elements)
   * - 'md': Standard spacing (16px padding) - default
   * - 'lg': Larger spacing (20px padding, larger elements)
   */
  size?: ResponsiveValue<SkeletonProjectCardSize>;
  /** Whether to show description/path line skeleton */
  showDescription?: boolean;
  /** Data attribute for testing */
  'data-testid'?: string;
}

/** Base classes for the skeleton project card container */
export const SKELETON_PROJECT_CARD_BASE_CLASSES =
  'flex flex-col rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--card))]';

/** Size-specific classes for card padding */
export const SKELETON_PROJECT_CARD_PADDING_CLASSES: Record<SkeletonProjectCardSize, string> = {
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-5',
};

/** Size-specific classes for icon dimensions */
export const SKELETON_PROJECT_CARD_ICON_CLASSES: Record<
  SkeletonProjectCardSize,
  { width: number; height: number }
> = {
  sm: { width: 32, height: 32 },
  md: { width: 40, height: 40 },
  lg: { width: 48, height: 48 },
};

/** Size-specific classes for icon margin bottom */
export const SKELETON_PROJECT_CARD_ICON_MARGIN_CLASSES: Record<SkeletonProjectCardSize, string> = {
  sm: 'mb-2',
  md: 'mb-3',
  lg: 'mb-4',
};

/** Size-specific classes for title skeleton */
export const SKELETON_PROJECT_CARD_TITLE_CLASSES: Record<SkeletonProjectCardSize, string> = {
  sm: 'h-4',
  md: 'h-5',
  lg: 'h-6',
};

/** Size-specific classes for title margin bottom */
export const SKELETON_PROJECT_CARD_TITLE_MARGIN_CLASSES: Record<SkeletonProjectCardSize, string> = {
  sm: 'mb-0.5',
  md: 'mb-1',
  lg: 'mb-1.5',
};

/** Size-specific classes for description/path skeleton */
export const SKELETON_PROJECT_CARD_DESCRIPTION_CLASSES: Record<SkeletonProjectCardSize, string> = {
  sm: 'h-2.5',
  md: 'h-3',
  lg: 'h-3.5',
};

/** Breakpoint order for responsive values */
const BREAKPOINT_ORDER: Breakpoint[] = ['base', 'sm', 'md', 'lg', 'xl', '2xl'];

/** Type for responsive size object */
type ResponsiveSizeObject = Partial<Record<Breakpoint, SkeletonProjectCardSize>>;

/**
 * Check if value is a responsive object (not a string size)
 */
function isResponsiveObject(
  value: ResponsiveValue<SkeletonProjectCardSize>
): value is ResponsiveSizeObject {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Get base size from responsive value
 */
export function getBaseSize(
  size: ResponsiveValue<SkeletonProjectCardSize>
): SkeletonProjectCardSize {
  if (!isResponsiveObject(size)) {
    return size;
  }
  return size.base ?? 'md';
}

/**
 * Get responsive size classes for a given class map
 */
export function getResponsiveSizeClasses(
  size: ResponsiveValue<SkeletonProjectCardSize>,
  classMap: Record<SkeletonProjectCardSize, string>
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
export function getIconDimensions(size: ResponsiveValue<SkeletonProjectCardSize>): {
  width: number;
  height: number;
} {
  const baseSize = getBaseSize(size);
  return SKELETON_PROJECT_CARD_ICON_CLASSES[baseSize];
}

/**
 * SkeletonProjectCard - Loading placeholder for project card layouts
 *
 * Provides visual loading indication while project card content is being fetched.
 * Matches the ProjectCard component layout.
 *
 * @example
 * // Basic project card skeleton
 * <SkeletonProjectCard />
 *
 * @example
 * // Without description line
 * <SkeletonProjectCard showDescription={false} />
 *
 * @example
 * // Small size
 * <SkeletonProjectCard size="sm" />
 *
 * @example
 * // Responsive sizing
 * <SkeletonProjectCard size={{ base: 'sm', md: 'md', lg: 'lg' }} />
 */
export const SkeletonProjectCard = forwardRef<HTMLDivElement, SkeletonProjectCardProps>(
  function SkeletonProjectCard(
    { className, size = 'md', showDescription = true, 'data-testid': dataTestId, ...props },
    ref
  ) {
    const paddingClasses = getResponsiveSizeClasses(size, SKELETON_PROJECT_CARD_PADDING_CLASSES);
    const iconMarginClasses = getResponsiveSizeClasses(
      size,
      SKELETON_PROJECT_CARD_ICON_MARGIN_CLASSES
    );
    const titleClasses = getResponsiveSizeClasses(size, SKELETON_PROJECT_CARD_TITLE_CLASSES);
    const titleMarginClasses = getResponsiveSizeClasses(
      size,
      SKELETON_PROJECT_CARD_TITLE_MARGIN_CLASSES
    );
    const descriptionClasses = getResponsiveSizeClasses(
      size,
      SKELETON_PROJECT_CARD_DESCRIPTION_CLASSES
    );
    const iconDimensions = getIconDimensions(size);

    return (
      <Box
        ref={ref}
        className={cn(SKELETON_PROJECT_CARD_BASE_CLASSES, paddingClasses, className)}
        aria-hidden={true}
        role="presentation"
        data-testid={dataTestId}
        data-size={typeof size === 'string' ? size : 'responsive'}
        data-show-description={showDescription}
        {...props}
      >
        {/* Icon skeleton */}
        <Skeleton
          className={cn('rounded-lg', iconMarginClasses)}
          width={iconDimensions.width}
          height={iconDimensions.height}
          data-testid={dataTestId ? `${dataTestId}-icon` : undefined}
        />

        {/* Name/title skeleton */}
        <Skeleton
          variant="text"
          className={cn(titleClasses, 'w-3/4', showDescription ? titleMarginClasses : '')}
          data-testid={dataTestId ? `${dataTestId}-title` : undefined}
        />

        {/* Path/description skeleton */}
        {showDescription && (
          <Skeleton
            variant="text"
            className={cn(descriptionClasses, 'w-full')}
            data-testid={dataTestId ? `${dataTestId}-description` : undefined}
          />
        )}
      </Box>
    );
  }
);

SkeletonProjectCard.displayName = 'SkeletonProjectCard';
