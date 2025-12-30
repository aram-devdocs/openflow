import { cn } from '@openflow/utils';
import { Skeleton } from '../atoms/Skeleton';

export interface SkeletonArchiveListProps {
  /** Number of archive items to render */
  count?: number;
  /** Additional CSS classes */
  className?: string;
}

/**
 * SkeletonArchiveList component for archive page loading placeholders.
 * Matches the archived task row layout.
 *
 * @example
 * // Default 5 items
 * <SkeletonArchiveList />
 *
 * @example
 * // Custom count
 * <SkeletonArchiveList count={3} />
 */
export function SkeletonArchiveList({ count = 5, className }: SkeletonArchiveListProps) {
  return (
    <div className={cn('space-y-2', className)} aria-hidden="true">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={`skeleton-archive-${i}`}
          className="flex items-center justify-between rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4"
        >
          <div className="flex-1 space-y-1">
            <Skeleton variant="text" className="h-5 w-2/3" />
            <div className="flex items-center gap-2">
              <Skeleton variant="text" className="h-3 w-24" />
              <Skeleton variant="text" className="h-3 w-32" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-20 rounded-md" />
            <Skeleton className="h-8 w-16 rounded-md" />
          </div>
        </div>
      ))}
    </div>
  );
}

SkeletonArchiveList.displayName = 'SkeletonArchiveList';
