/**
 * SkeletonList Molecule - Loading placeholder for generic list content
 *
 * Provides visual loading indication while list content is being fetched.
 * Renders multiple skeleton rows with optional avatar/icon placeholders.
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

/** Skeleton list size variants */
export type SkeletonListSize = 'sm' | 'md' | 'lg';

/** Breakpoint names for responsive values - re-exported for convenience */
export type SkeletonListBreakpoint = Breakpoint;

/**
 * SkeletonList component props
 */
export interface SkeletonListProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  /** Number of skeleton items to render */
  count?: number;
  /**
   * Size variant for the skeleton items
   * - 'sm': Compact spacing (8px gap, small avatars)
   * - 'md': Standard spacing (12px gap, medium avatars) - default
   * - 'lg': Larger spacing (16px gap, large avatars)
   */
  size?: ResponsiveValue<SkeletonListSize>;
  /** Whether to show avatar/icon for each item */
  showAvatar?: boolean;
  /** Number of text lines per item (1, 2, or 3) */
  lines?: 1 | 2 | 3;
  /** Data attribute for testing */
  'data-testid'?: string;
}

/** Default count of skeleton items */
export const DEFAULT_SKELETON_COUNT = 5;

/** Default lines per item */
export const DEFAULT_SKELETON_LINES = 2;

/** Base classes for the skeleton container */
export const SKELETON_LIST_BASE_CLASSES = 'flex flex-col';

/** Size-specific classes for spacing between items */
export const SKELETON_LIST_GAP_CLASSES: Record<SkeletonListSize, string> = {
  sm: 'gap-1.5',
  md: 'gap-2',
  lg: 'gap-3',
};

/** Size-specific classes for item container padding */
export const SKELETON_ITEM_PADDING_CLASSES: Record<SkeletonListSize, string> = {
  sm: 'p-1.5',
  md: 'p-2',
  lg: 'p-3',
};

/** Size-specific classes for item gap (between avatar and text) */
export const SKELETON_ITEM_GAP_CLASSES: Record<SkeletonListSize, string> = {
  sm: 'gap-2',
  md: 'gap-3',
  lg: 'gap-4',
};

/** Size-specific avatar dimensions (width and height in pixels) */
export const SKELETON_AVATAR_DIMENSIONS: Record<SkeletonListSize, number> = {
  sm: 24,
  md: 32,
  lg: 40,
};

/** Size-specific classes for primary text skeleton */
export const SKELETON_PRIMARY_TEXT_CLASSES: Record<SkeletonListSize, string> = {
  sm: 'h-3 w-2/3',
  md: 'h-4 w-2/3',
  lg: 'h-5 w-2/3',
};

/** Size-specific classes for secondary text skeleton */
export const SKELETON_SECONDARY_TEXT_CLASSES: Record<SkeletonListSize, string> = {
  sm: 'h-2.5 w-1/3',
  md: 'h-3 w-1/3',
  lg: 'h-3.5 w-1/3',
};

/** Size-specific classes for tertiary text skeleton */
export const SKELETON_TERTIARY_TEXT_CLASSES: Record<SkeletonListSize, string> = {
  sm: 'h-2 w-1/4',
  md: 'h-2.5 w-1/4',
  lg: 'h-3 w-1/4',
};

/** Size-specific classes for text content gap */
export const SKELETON_TEXT_GAP_CLASSES: Record<SkeletonListSize, string> = {
  sm: 'gap-0.5',
  md: 'gap-1',
  lg: 'gap-1.5',
};

/** Breakpoint order for responsive values */
const BREAKPOINT_ORDER: Breakpoint[] = ['base', 'sm', 'md', 'lg', 'xl', '2xl'];

/** Type for responsive size object */
type ResponsiveSizeObject = Partial<Record<Breakpoint, SkeletonListSize>>;

/**
 * Check if value is a responsive object (not a string size)
 */
function isResponsiveObject(
  value: ResponsiveValue<SkeletonListSize>
): value is ResponsiveSizeObject {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Get base size from responsive value
 */
export function getBaseSize(size: ResponsiveValue<SkeletonListSize>): SkeletonListSize {
  if (!isResponsiveObject(size)) {
    return size;
  }
  return size.base ?? 'md';
}

/**
 * Get responsive size classes for a given class map
 */
export function getResponsiveSizeClasses(
  size: ResponsiveValue<SkeletonListSize>,
  classMap: Record<SkeletonListSize, string>
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
 * Get avatar dimensions for a given size
 */
export function getAvatarDimensions(size: ResponsiveValue<SkeletonListSize>): number {
  const baseSize = getBaseSize(size);
  return SKELETON_AVATAR_DIMENSIONS[baseSize];
}

/**
 * Single skeleton list item
 */
interface SkeletonListItemProps {
  /** Size variant */
  size: ResponsiveValue<SkeletonListSize>;
  /** Unique key index for stable keys */
  index: number;
  /** Whether to show avatar */
  showAvatar: boolean;
  /** Number of text lines */
  lines: 1 | 2 | 3;
}

function SkeletonListItem({ size, index, showAvatar, lines }: SkeletonListItemProps) {
  const paddingClasses = getResponsiveSizeClasses(size, SKELETON_ITEM_PADDING_CLASSES);
  const itemGapClasses = getResponsiveSizeClasses(size, SKELETON_ITEM_GAP_CLASSES);
  const textGapClasses = getResponsiveSizeClasses(size, SKELETON_TEXT_GAP_CLASSES);
  const primaryTextClasses = getResponsiveSizeClasses(size, SKELETON_PRIMARY_TEXT_CLASSES);
  const secondaryTextClasses = getResponsiveSizeClasses(size, SKELETON_SECONDARY_TEXT_CLASSES);
  const tertiaryTextClasses = getResponsiveSizeClasses(size, SKELETON_TERTIARY_TEXT_CLASSES);
  const avatarSize = getAvatarDimensions(size);

  return (
    <Box
      className={cn('flex items-center rounded-md', paddingClasses, itemGapClasses)}
      data-testid={`skeleton-list-item-${index}`}
    >
      {showAvatar && (
        <Skeleton
          variant="circular"
          width={avatarSize}
          height={avatarSize}
          data-testid={`skeleton-avatar-${index}`}
        />
      )}
      <Box className={cn('flex flex-1 flex-col', textGapClasses)}>
        <Skeleton
          variant="text"
          className={primaryTextClasses}
          data-testid={`skeleton-primary-text-${index}`}
        />
        {lines >= 2 && (
          <Skeleton
            variant="text"
            className={secondaryTextClasses}
            data-testid={`skeleton-secondary-text-${index}`}
          />
        )}
        {lines >= 3 && (
          <Skeleton
            variant="text"
            className={tertiaryTextClasses}
            data-testid={`skeleton-tertiary-text-${index}`}
          />
        )}
      </Box>
    </Box>
  );
}

/**
 * SkeletonList - Loading placeholder for generic list content
 *
 * Provides visual loading indication while list content is being fetched.
 * Renders multiple skeleton rows with optional avatar/icon placeholders.
 *
 * @example
 * // Default 5 items with avatars
 * <SkeletonList />
 *
 * @example
 * // Custom count without avatars
 * <SkeletonList count={3} showAvatar={false} />
 *
 * @example
 * // Small size variant with 1 line
 * <SkeletonList size="sm" lines={1} />
 *
 * @example
 * // Responsive sizing
 * <SkeletonList size={{ base: 'sm', md: 'md', lg: 'lg' }} />
 */
export const SkeletonList = forwardRef<HTMLDivElement, SkeletonListProps>(function SkeletonList(
  {
    count = DEFAULT_SKELETON_COUNT,
    size = 'md',
    showAvatar = true,
    lines = DEFAULT_SKELETON_LINES,
    className,
    'data-testid': dataTestId,
    ...props
  },
  ref
) {
  const gapClasses = getResponsiveSizeClasses(size, SKELETON_LIST_GAP_CLASSES);

  return (
    <Box
      ref={ref}
      className={cn(SKELETON_LIST_BASE_CLASSES, gapClasses, className)}
      aria-hidden={true}
      role="presentation"
      data-testid={dataTestId}
      data-count={count}
      data-size={typeof size === 'string' ? size : 'responsive'}
      data-show-avatar={showAvatar}
      data-lines={lines}
      {...props}
    >
      {Array.from({ length: count }).map((_, index) => (
        <SkeletonListItem
          key={`skeleton-list-${index}`}
          size={size}
          index={index}
          showAvatar={showAvatar}
          lines={lines}
        />
      ))}
    </Box>
  );
});

SkeletonList.displayName = 'SkeletonList';
