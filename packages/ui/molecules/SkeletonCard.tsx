import { cn } from '@openflow/utils';
import { Skeleton } from '../atoms/Skeleton';

export interface SkeletonCardProps {
  /** Additional CSS classes */
  className?: string;
  /** Whether to show action button skeletons */
  showActions?: boolean;
  /** Whether to show an avatar/icon skeleton */
  showAvatar?: boolean;
}

/**
 * SkeletonCard component for card loading placeholders.
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
 * // Card skeleton with avatar
 * <SkeletonCard showAvatar />
 */
export function SkeletonCard({
  className,
  showActions = false,
  showAvatar = true,
}: SkeletonCardProps) {
  return (
    <div
      className={cn(
        'rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4',
        className
      )}
      aria-hidden="true"
    >
      <div className="flex items-start gap-3">
        {showAvatar && <Skeleton variant="circular" width={40} height={40} />}
        <div className="flex-1 space-y-2">
          <Skeleton variant="text" className="w-3/4" />
          <Skeleton variant="text" className="w-1/2" />
        </div>
      </div>
      {showActions && (
        <div className="mt-4 flex gap-2">
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-8 w-20" />
        </div>
      )}
    </div>
  );
}

SkeletonCard.displayName = 'SkeletonCard';
