/**
 * SkeletonCard Molecule - Loading placeholder for card layouts
 *
 * Provides visual loading indication while card content is being fetched.
 * Matches the general Card component layout with flexible content areas.
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

/** Skeleton card size variants */
export type SkeletonCardSize = 'sm' | 'md' | 'lg';

/** Breakpoint names for responsive values - re-exported for convenience */
export type SkeletonCardBreakpoint = Breakpoint;

/**
 * SkeletonCard component props
 */
export interface SkeletonCardProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  /** Whether to show action button skeletons */
  showActions?: boolean;
  /** Whether to show an avatar/icon skeleton */
  showAvatar?: boolean;
  /** Number of text lines to show (title + description) */
  lines?: 1 | 2 | 3;
  /**
   * Size variant for the skeleton card
   * - 'sm': Compact spacing (12px padding, smaller elements)
   * - 'md': Standard spacing (16px padding) - default
   * - 'lg': Larger spacing (20px padding, larger elements)
   */
  size?: ResponsiveValue<SkeletonCardSize>;
  /** Data attribute for testing */
  'data-testid'?: string;
}

/** Base classes for the skeleton card container */
export const SKELETON_CARD_BASE_CLASSES =
  'rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--card))]';

/** Size-specific classes for card padding */
export const SKELETON_CARD_PADDING_CLASSES: Record<SkeletonCardSize, string> = {
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-5',
};

/** Size-specific classes for header gap (between avatar and text) */
export const SKELETON_CARD_HEADER_GAP_CLASSES: Record<SkeletonCardSize, string> = {
  sm: 'gap-2',
  md: 'gap-3',
  lg: 'gap-4',
};

/** Size-specific classes for avatar dimensions */
export const SKELETON_CARD_AVATAR_CLASSES: Record<
  SkeletonCardSize,
  { width: number; height: number }
> = {
  sm: { width: 32, height: 32 },
  md: { width: 40, height: 40 },
  lg: { width: 48, height: 48 },
};

/** Size-specific classes for title skeleton */
export const SKELETON_CARD_TITLE_CLASSES: Record<SkeletonCardSize, string> = {
  sm: 'h-3.5',
  md: 'h-4',
  lg: 'h-5',
};

/** Size-specific classes for description skeleton */
export const SKELETON_CARD_DESCRIPTION_CLASSES: Record<SkeletonCardSize, string> = {
  sm: 'h-2.5',
  md: 'h-3',
  lg: 'h-3.5',
};

/** Size-specific classes for action button skeletons */
export const SKELETON_CARD_ACTION_CLASSES: Record<SkeletonCardSize, string> = {
  sm: 'h-7 w-16',
  md: 'h-8 w-20',
  lg: 'h-9 w-24',
};

/** Size-specific classes for actions container gap */
export const SKELETON_CARD_ACTIONS_GAP_CLASSES: Record<SkeletonCardSize, string> = {
  sm: 'gap-1.5',
  md: 'gap-2',
  lg: 'gap-2.5',
};

/** Size-specific classes for actions container margin top */
export const SKELETON_CARD_ACTIONS_MARGIN_CLASSES: Record<SkeletonCardSize, string> = {
  sm: 'mt-3',
  md: 'mt-4',
  lg: 'mt-5',
};

/** Size-specific classes for text content gap */
export const SKELETON_CARD_CONTENT_GAP_CLASSES: Record<SkeletonCardSize, string> = {
  sm: 'space-y-1.5',
  md: 'space-y-2',
  lg: 'space-y-2.5',
};

/** Breakpoint order for responsive values */
const BREAKPOINT_ORDER: Breakpoint[] = ['base', 'sm', 'md', 'lg', 'xl', '2xl'];

/** Type for responsive size object */
type ResponsiveSizeObject = Partial<Record<Breakpoint, SkeletonCardSize>>;

/**
 * Check if value is a responsive object (not a string size)
 */
function isResponsiveObject(
  value: ResponsiveValue<SkeletonCardSize>
): value is ResponsiveSizeObject {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Get base size from responsive value
 */
export function getBaseSize(size: ResponsiveValue<SkeletonCardSize>): SkeletonCardSize {
  if (!isResponsiveObject(size)) {
    return size;
  }
  return size.base ?? 'md';
}

/**
 * Get responsive size classes for a given class map
 */
export function getResponsiveSizeClasses(
  size: ResponsiveValue<SkeletonCardSize>,
  classMap: Record<SkeletonCardSize, string>
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
 * Get avatar dimensions based on size (uses base size for responsive objects)
 */
export function getAvatarDimensions(size: ResponsiveValue<SkeletonCardSize>): {
  width: number;
  height: number;
} {
  const baseSize = getBaseSize(size);
  return SKELETON_CARD_AVATAR_CLASSES[baseSize];
}

/**
 * SkeletonCard - Loading placeholder for card layouts
 *
 * Provides visual loading indication while card content is being fetched.
 * Matches the general Card component layout.
 *
 * @example
 * // Basic card skeleton
 * <SkeletonCard />
 *
 * @example
 * // Card skeleton with actions
 * <SkeletonCard showActions />
 *
 * @example
 * // Card skeleton without avatar
 * <SkeletonCard showAvatar={false} />
 *
 * @example
 * // Small size with 3 lines
 * <SkeletonCard size="sm" lines={3} />
 *
 * @example
 * // Responsive sizing
 * <SkeletonCard size={{ base: 'sm', md: 'md', lg: 'lg' }} />
 */
export const SkeletonCard = forwardRef<HTMLDivElement, SkeletonCardProps>(function SkeletonCard(
  {
    className,
    showActions = false,
    showAvatar = true,
    lines = 2,
    size = 'md',
    'data-testid': dataTestId,
    ...props
  },
  ref
) {
  const paddingClasses = getResponsiveSizeClasses(size, SKELETON_CARD_PADDING_CLASSES);
  const headerGapClasses = getResponsiveSizeClasses(size, SKELETON_CARD_HEADER_GAP_CLASSES);
  const titleClasses = getResponsiveSizeClasses(size, SKELETON_CARD_TITLE_CLASSES);
  const descriptionClasses = getResponsiveSizeClasses(size, SKELETON_CARD_DESCRIPTION_CLASSES);
  const actionClasses = getResponsiveSizeClasses(size, SKELETON_CARD_ACTION_CLASSES);
  const actionsGapClasses = getResponsiveSizeClasses(size, SKELETON_CARD_ACTIONS_GAP_CLASSES);
  const actionsMarginClasses = getResponsiveSizeClasses(size, SKELETON_CARD_ACTIONS_MARGIN_CLASSES);
  const contentGapClasses = getResponsiveSizeClasses(size, SKELETON_CARD_CONTENT_GAP_CLASSES);
  const avatarDimensions = getAvatarDimensions(size);

  return (
    <div
      ref={ref}
      className={cn(SKELETON_CARD_BASE_CLASSES, paddingClasses, className)}
      aria-hidden={true}
      role="presentation"
      data-testid={dataTestId}
      data-size={typeof size === 'string' ? size : 'responsive'}
      data-show-avatar={showAvatar}
      data-show-actions={showActions}
      data-lines={lines}
      {...props}
    >
      <div className={cn('flex items-start', headerGapClasses)}>
        {showAvatar && (
          <Skeleton
            variant="circular"
            width={avatarDimensions.width}
            height={avatarDimensions.height}
            data-testid={dataTestId ? `${dataTestId}-avatar` : undefined}
          />
        )}
        <div className={cn('flex-1', contentGapClasses)}>
          {/* Title skeleton - always shown */}
          <Skeleton
            variant="text"
            className={cn(titleClasses, 'w-3/4')}
            data-testid={dataTestId ? `${dataTestId}-title` : undefined}
          />
          {/* Description lines */}
          {lines >= 2 && (
            <Skeleton
              variant="text"
              className={cn(descriptionClasses, 'w-1/2')}
              data-testid={dataTestId ? `${dataTestId}-description-1` : undefined}
            />
          )}
          {lines >= 3 && (
            <Skeleton
              variant="text"
              className={cn(descriptionClasses, 'w-2/3')}
              data-testid={dataTestId ? `${dataTestId}-description-2` : undefined}
            />
          )}
        </div>
      </div>
      {showActions && (
        <div className={cn('flex', actionsGapClasses, actionsMarginClasses)}>
          <Skeleton
            className={cn('rounded-md', actionClasses)}
            data-testid={dataTestId ? `${dataTestId}-action-primary` : undefined}
          />
          <Skeleton
            className={cn('rounded-md', actionClasses)}
            data-testid={dataTestId ? `${dataTestId}-action-secondary` : undefined}
          />
        </div>
      )}
    </div>
  );
});

SkeletonCard.displayName = 'SkeletonCard';
