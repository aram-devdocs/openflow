/**
 * SkeletonTaskCard Molecule - Loading placeholder for task card layouts
 *
 * Provides visual loading indication while task card content is being fetched.
 * Matches the TaskCard component layout in the task list.
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

/** Skeleton task card size variants */
export type SkeletonTaskCardSize = 'sm' | 'md' | 'lg';

/** Breakpoint names for responsive values - re-exported for convenience */
export type SkeletonTaskCardBreakpoint = Breakpoint;

/**
 * SkeletonTaskCard component props
 */
export interface SkeletonTaskCardProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  /**
   * Size variant for the skeleton task card
   * - 'sm': Compact spacing (12px padding, smaller elements)
   * - 'md': Standard spacing (16px padding) - default
   * - 'lg': Larger spacing (20px padding, larger elements)
   */
  size?: ResponsiveValue<SkeletonTaskCardSize>;
  /** Whether to show description lines skeleton */
  showDescription?: boolean;
  /** Whether to show footer metadata skeleton */
  showFooter?: boolean;
  /** Number of description lines to show (1 or 2) */
  descriptionLines?: 1 | 2;
  /** Data attribute for testing */
  'data-testid'?: string;
}

/** Base classes for the skeleton task card container */
export const SKELETON_TASK_CARD_BASE_CLASSES =
  'rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--card))]';

/** Size-specific classes for card padding */
export const SKELETON_TASK_CARD_PADDING_CLASSES: Record<SkeletonTaskCardSize, string> = {
  sm: 'p-2.5',
  md: 'p-3',
  lg: 'p-4',
};

/** Size-specific classes for content spacing */
export const SKELETON_TASK_CARD_SPACING_CLASSES: Record<SkeletonTaskCardSize, string> = {
  sm: 'space-y-2',
  md: 'space-y-3',
  lg: 'space-y-4',
};

/** Size-specific classes for header gap */
export const SKELETON_TASK_CARD_HEADER_GAP_CLASSES: Record<SkeletonTaskCardSize, string> = {
  sm: 'gap-1.5',
  md: 'gap-2',
  lg: 'gap-3',
};

/** Size-specific classes for title skeleton height */
export const SKELETON_TASK_CARD_TITLE_CLASSES: Record<SkeletonTaskCardSize, string> = {
  sm: 'h-4',
  md: 'h-5',
  lg: 'h-6',
};

/** Size-specific classes for status badge skeleton */
export const SKELETON_TASK_CARD_BADGE_CLASSES: Record<
  SkeletonTaskCardSize,
  { height: string; width: string }
> = {
  sm: { height: 'h-5', width: 'w-14' },
  md: { height: 'h-6', width: 'w-16' },
  lg: { height: 'h-7', width: 'w-20' },
};

/** Size-specific classes for description skeleton height */
export const SKELETON_TASK_CARD_DESCRIPTION_CLASSES: Record<SkeletonTaskCardSize, string> = {
  sm: 'h-3',
  md: 'h-3.5',
  lg: 'h-4',
};

/** Size-specific classes for description line spacing */
export const SKELETON_TASK_CARD_DESCRIPTION_GAP_CLASSES: Record<SkeletonTaskCardSize, string> = {
  sm: 'space-y-0.5',
  md: 'space-y-1',
  lg: 'space-y-1.5',
};

/** Size-specific classes for footer skeleton */
export const SKELETON_TASK_CARD_FOOTER_CLASSES: Record<SkeletonTaskCardSize, string> = {
  sm: 'h-2.5',
  md: 'h-3',
  lg: 'h-3.5',
};

/** Size-specific classes for footer gap */
export const SKELETON_TASK_CARD_FOOTER_GAP_CLASSES: Record<SkeletonTaskCardSize, string> = {
  sm: 'gap-3',
  md: 'gap-4',
  lg: 'gap-5',
};

/** Size-specific classes for footer padding top */
export const SKELETON_TASK_CARD_FOOTER_PADDING_CLASSES: Record<SkeletonTaskCardSize, string> = {
  sm: 'pt-1.5',
  md: 'pt-2',
  lg: 'pt-3',
};

/** Breakpoint order for responsive values */
const BREAKPOINT_ORDER: Breakpoint[] = ['base', 'sm', 'md', 'lg', 'xl', '2xl'];

/** Type for responsive size object */
type ResponsiveSizeObject = Partial<Record<Breakpoint, SkeletonTaskCardSize>>;

/**
 * Check if value is a responsive object (not a string size)
 */
function isResponsiveObject(
  value: ResponsiveValue<SkeletonTaskCardSize>
): value is ResponsiveSizeObject {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Get base size from responsive value
 */
export function getBaseSize(size: ResponsiveValue<SkeletonTaskCardSize>): SkeletonTaskCardSize {
  if (!isResponsiveObject(size)) {
    return size;
  }
  return size.base ?? 'md';
}

/**
 * Get responsive size classes for a given class map
 */
export function getResponsiveSizeClasses(
  size: ResponsiveValue<SkeletonTaskCardSize>,
  classMap: Record<SkeletonTaskCardSize, string>
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
 * Get badge dimensions based on size (uses base size for responsive objects)
 */
export function getBadgeDimensions(size: ResponsiveValue<SkeletonTaskCardSize>): {
  height: string;
  width: string;
} {
  const baseSize = getBaseSize(size);
  return SKELETON_TASK_CARD_BADGE_CLASSES[baseSize];
}

/**
 * SkeletonTaskCard - Loading placeholder for task card layouts
 *
 * Provides visual loading indication while task card content is being fetched.
 * Matches the TaskCard component layout.
 *
 * Layout matches TaskCard:
 * - Header row: Title skeleton + status badge skeleton
 * - Description: One or two lines of text (optional)
 * - Footer: Metadata skeletons (optional)
 *
 * @example
 * // Basic task card skeleton
 * <SkeletonTaskCard />
 *
 * @example
 * // Without description
 * <SkeletonTaskCard showDescription={false} />
 *
 * @example
 * // Without footer
 * <SkeletonTaskCard showFooter={false} />
 *
 * @example
 * // Small size
 * <SkeletonTaskCard size="sm" />
 *
 * @example
 * // Responsive sizing
 * <SkeletonTaskCard size={{ base: 'sm', md: 'md', lg: 'lg' }} />
 *
 * @example
 * // Multiple loading task cards
 * {Array.from({ length: 5 }).map((_, i) => (
 *   <SkeletonTaskCard key={i} />
 * ))}
 */
export const SkeletonTaskCard = forwardRef<HTMLDivElement, SkeletonTaskCardProps>(
  function SkeletonTaskCard(
    {
      className,
      size = 'md',
      showDescription = true,
      showFooter = true,
      descriptionLines = 2,
      'data-testid': dataTestId,
      ...props
    },
    ref
  ) {
    const paddingClasses = getResponsiveSizeClasses(size, SKELETON_TASK_CARD_PADDING_CLASSES);
    const spacingClasses = getResponsiveSizeClasses(size, SKELETON_TASK_CARD_SPACING_CLASSES);
    const headerGapClasses = getResponsiveSizeClasses(size, SKELETON_TASK_CARD_HEADER_GAP_CLASSES);
    const titleClasses = getResponsiveSizeClasses(size, SKELETON_TASK_CARD_TITLE_CLASSES);
    const descriptionClasses = getResponsiveSizeClasses(
      size,
      SKELETON_TASK_CARD_DESCRIPTION_CLASSES
    );
    const descriptionGapClasses = getResponsiveSizeClasses(
      size,
      SKELETON_TASK_CARD_DESCRIPTION_GAP_CLASSES
    );
    const footerClasses = getResponsiveSizeClasses(size, SKELETON_TASK_CARD_FOOTER_CLASSES);
    const footerGapClasses = getResponsiveSizeClasses(size, SKELETON_TASK_CARD_FOOTER_GAP_CLASSES);
    const footerPaddingClasses = getResponsiveSizeClasses(
      size,
      SKELETON_TASK_CARD_FOOTER_PADDING_CLASSES
    );
    const badgeDimensions = getBadgeDimensions(size);

    return (
      <div
        ref={ref}
        className={cn(SKELETON_TASK_CARD_BASE_CLASSES, paddingClasses, spacingClasses, className)}
        aria-hidden={true}
        role="presentation"
        data-testid={dataTestId}
        data-size={typeof size === 'string' ? size : 'responsive'}
        data-show-description={showDescription}
        data-show-footer={showFooter}
        data-description-lines={descriptionLines}
        {...props}
      >
        {/* Header: Title and Status badge */}
        <div className={cn('flex items-start justify-between', headerGapClasses)}>
          <Skeleton
            variant="text"
            className={cn(titleClasses, 'w-2/3')}
            data-testid={dataTestId ? `${dataTestId}-title` : undefined}
          />
          <Skeleton
            className={cn(badgeDimensions.height, badgeDimensions.width, 'rounded-full shrink-0')}
            data-testid={dataTestId ? `${dataTestId}-badge` : undefined}
          />
        </div>

        {/* Description */}
        {showDescription && (
          <div className={descriptionGapClasses}>
            <Skeleton
              variant="text"
              className={cn(descriptionClasses, 'w-full')}
              data-testid={dataTestId ? `${dataTestId}-description-1` : undefined}
            />
            {descriptionLines >= 2 && (
              <Skeleton
                variant="text"
                className={cn(descriptionClasses, 'w-4/5')}
                data-testid={dataTestId ? `${dataTestId}-description-2` : undefined}
              />
            )}
          </div>
        )}

        {/* Footer: Metadata */}
        {showFooter && (
          <div
            className={cn('flex items-center', footerGapClasses, footerPaddingClasses)}
            data-testid={dataTestId ? `${dataTestId}-footer` : undefined}
          >
            <Skeleton
              variant="text"
              className={cn(footerClasses, 'w-20')}
              data-testid={dataTestId ? `${dataTestId}-metadata-1` : undefined}
            />
            <Skeleton
              variant="text"
              className={cn(footerClasses, 'w-16')}
              data-testid={dataTestId ? `${dataTestId}-metadata-2` : undefined}
            />
          </div>
        )}
      </div>
    );
  }
);

SkeletonTaskCard.displayName = 'SkeletonTaskCard';
