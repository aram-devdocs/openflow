/**
 * SkeletonArchiveList Molecule - Loading placeholder for archive list
 *
 * Provides visual loading indication while archive content is being fetched.
 * Matches the layout of ArchivedTaskItem, ArchivedChatItem, and ArchivedProjectItem
 * components from ArchivePageComponents.
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

/** Skeleton archive list size variants */
export type SkeletonArchiveListSize = 'sm' | 'md' | 'lg';

/** Breakpoint names for responsive values - re-exported for convenience */
export type SkeletonArchiveListBreakpoint = Breakpoint;

/**
 * SkeletonArchiveList component props
 */
export interface SkeletonArchiveListProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  /** Number of archive items to render */
  count?: number;
  /**
   * Size variant for the skeleton items
   * - 'sm': Compact spacing (12px gap, 12px padding)
   * - 'md': Standard spacing (16px gap, 16px padding) - default
   * - 'lg': Larger spacing (20px gap, 20px padding)
   */
  size?: ResponsiveValue<SkeletonArchiveListSize>;
  /** Data attribute for testing */
  'data-testid'?: string;
}

/** Default count of skeleton items */
export const DEFAULT_SKELETON_COUNT = 5;

/** Base classes for the skeleton container */
export const SKELETON_ARCHIVE_LIST_BASE_CLASSES = 'flex flex-col';

/** Size-specific classes for spacing between items */
export const SKELETON_ARCHIVE_LIST_SIZE_CLASSES: Record<SkeletonArchiveListSize, string> = {
  sm: 'gap-2',
  md: 'gap-2',
  lg: 'gap-3',
};

/** Size-specific classes for item container */
export const SKELETON_ITEM_CONTAINER_CLASSES: Record<SkeletonArchiveListSize, string> = {
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-5',
};

/** Size-specific classes for title skeleton */
export const SKELETON_TITLE_CLASSES: Record<SkeletonArchiveListSize, string> = {
  sm: 'h-4 w-1/2',
  md: 'h-5 w-2/3',
  lg: 'h-6 w-3/4',
};

/** Size-specific classes for metadata skeleton */
export const SKELETON_METADATA_CLASSES: Record<SkeletonArchiveListSize, string> = {
  sm: 'h-2.5 w-20',
  md: 'h-3 w-24',
  lg: 'h-3.5 w-28',
};

/** Size-specific classes for secondary metadata skeleton */
export const SKELETON_SECONDARY_METADATA_CLASSES: Record<SkeletonArchiveListSize, string> = {
  sm: 'h-2.5 w-28',
  md: 'h-3 w-32',
  lg: 'h-3.5 w-36',
};

/** Size-specific classes for action button skeletons */
export const SKELETON_ACTION_BUTTON_CLASSES: Record<SkeletonArchiveListSize, string> = {
  sm: 'h-7 w-16',
  md: 'h-8 w-20',
  lg: 'h-9 w-24',
};

/** Size-specific classes for secondary action button skeletons */
export const SKELETON_SECONDARY_ACTION_CLASSES: Record<SkeletonArchiveListSize, string> = {
  sm: 'h-7 w-14',
  md: 'h-8 w-16',
  lg: 'h-9 w-20',
};

/** Breakpoint order for responsive values */
const BREAKPOINT_ORDER: Breakpoint[] = ['base', 'sm', 'md', 'lg', 'xl', '2xl'];

/** Type for responsive size object */
type ResponsiveSizeObject = Partial<Record<Breakpoint, SkeletonArchiveListSize>>;

/**
 * Check if value is a responsive object (not a string size)
 */
function isResponsiveObject(
  value: ResponsiveValue<SkeletonArchiveListSize>
): value is ResponsiveSizeObject {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Get base size from responsive value
 */
export function getBaseSize(
  size: ResponsiveValue<SkeletonArchiveListSize>
): SkeletonArchiveListSize {
  if (!isResponsiveObject(size)) {
    return size;
  }
  return size.base ?? 'md';
}

/**
 * Get responsive size classes for a given class map
 */
export function getResponsiveSizeClasses(
  size: ResponsiveValue<SkeletonArchiveListSize>,
  classMap: Record<SkeletonArchiveListSize, string>
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
 * Single skeleton archive item that matches the layout of archived items
 */
interface SkeletonArchiveItemProps {
  /** Size variant */
  size: ResponsiveValue<SkeletonArchiveListSize>;
  /** Unique key index for stable keys */
  index: number;
}

function SkeletonArchiveItem({ size, index }: SkeletonArchiveItemProps) {
  const containerClasses = getResponsiveSizeClasses(size, SKELETON_ITEM_CONTAINER_CLASSES);
  const titleClasses = getResponsiveSizeClasses(size, SKELETON_TITLE_CLASSES);
  const metadataClasses = getResponsiveSizeClasses(size, SKELETON_METADATA_CLASSES);
  const secondaryMetadataClasses = getResponsiveSizeClasses(
    size,
    SKELETON_SECONDARY_METADATA_CLASSES
  );
  const actionClasses = getResponsiveSizeClasses(size, SKELETON_ACTION_BUTTON_CLASSES);
  const secondaryActionClasses = getResponsiveSizeClasses(size, SKELETON_SECONDARY_ACTION_CLASSES);

  return (
    <Box
      className={cn(
        'flex items-center justify-between rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--card))]',
        containerClasses
      )}
      data-testid={`skeleton-archive-item-${index}`}
    >
      {/* Content section - matches the layout of archived item buttons */}
      <Box className="flex flex-1 flex-col gap-1">
        {/* Title skeleton */}
        <Skeleton variant="text" className={titleClasses} data-testid={`skeleton-title-${index}`} />
        {/* Metadata row skeleton - matches project name / archived date layout */}
        <Box className="flex items-center gap-2">
          <Skeleton
            variant="text"
            className={metadataClasses}
            data-testid={`skeleton-metadata-${index}`}
          />
          <Skeleton
            variant="text"
            className={secondaryMetadataClasses}
            data-testid={`skeleton-secondary-metadata-${index}`}
          />
        </Box>
      </Box>

      {/* Action buttons section - matches restore/delete button layout */}
      <Box className="flex items-center gap-2">
        <Skeleton
          className={cn('rounded-md', actionClasses)}
          data-testid={`skeleton-action-primary-${index}`}
        />
        <Skeleton
          className={cn('rounded-md', secondaryActionClasses)}
          data-testid={`skeleton-action-secondary-${index}`}
        />
      </Box>
    </Box>
  );
}

/**
 * SkeletonArchiveList - Loading placeholder for archive list
 *
 * Provides visual loading indication while archive content is being fetched.
 * Matches the layout of ArchivedTaskItem, ArchivedChatItem, and ArchivedProjectItem.
 *
 * @example
 * // Default 5 items with medium size
 * <SkeletonArchiveList />
 *
 * @example
 * // Custom count
 * <SkeletonArchiveList count={3} />
 *
 * @example
 * // Small size variant
 * <SkeletonArchiveList size="sm" />
 *
 * @example
 * // Responsive sizing
 * <SkeletonArchiveList size={{ base: 'sm', md: 'md', lg: 'lg' }} />
 */
export const SkeletonArchiveList = forwardRef<HTMLDivElement, SkeletonArchiveListProps>(
  function SkeletonArchiveList(
    { count = DEFAULT_SKELETON_COUNT, size = 'md', className, 'data-testid': dataTestId, ...props },
    ref
  ) {
    const gapClasses = getResponsiveSizeClasses(size, SKELETON_ARCHIVE_LIST_SIZE_CLASSES);

    return (
      <Box
        ref={ref}
        className={cn(SKELETON_ARCHIVE_LIST_BASE_CLASSES, gapClasses, className)}
        aria-hidden={true}
        role="presentation"
        data-testid={dataTestId}
        data-count={count}
        data-size={typeof size === 'string' ? size : 'responsive'}
        {...props}
      >
        {Array.from({ length: count }).map((_, index) => (
          <SkeletonArchiveItem key={`skeleton-archive-${index}`} size={size} index={index} />
        ))}
      </Box>
    );
  }
);

SkeletonArchiveList.displayName = 'SkeletonArchiveList';
