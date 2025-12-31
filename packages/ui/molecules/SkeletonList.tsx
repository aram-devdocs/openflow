import { cn } from '@openflow/utils';
import { Skeleton } from '../atoms/Skeleton';

export interface SkeletonListProps {
  /** Number of skeleton items to render */
  count?: number;
  /** Additional CSS classes */
  className?: string;
  /** Whether to show avatar/icon for each item */
  showAvatar?: boolean;
}

/**
 * SkeletonList component for list loading placeholders.
 * Renders multiple skeleton rows for list-type content.
 *
 * @example
 * // Default 5 items
 * <SkeletonList />
 *
 * @example
 * // Custom count
 * <SkeletonList count={3} />
 *
 * @example
 * // Without avatars
 * <SkeletonList showAvatar={false} />
 */
export function SkeletonList({ count = 5, className, showAvatar = true }: SkeletonListProps) {
  return (
    <div className={cn('space-y-2', className)} aria-hidden="true">
      {Array.from({ length: count }).map((_, i) => (
        <div key={`skeleton-list-item-${i}`} className="flex items-center gap-3 rounded-md p-2">
          {showAvatar && <Skeleton variant="circular" width={32} height={32} />}
          <div className="flex-1 space-y-1">
            <Skeleton variant="text" className="w-2/3" />
            <Skeleton variant="text" className="h-3 w-1/3" />
          </div>
        </div>
      ))}
    </div>
  );
}

SkeletonList.displayName = 'SkeletonList';
