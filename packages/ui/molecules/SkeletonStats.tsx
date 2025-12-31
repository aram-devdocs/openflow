import { cn } from '@openflow/utils';
import { Skeleton } from '../atoms/Skeleton';

export interface SkeletonStatsProps {
  /** Number of stat cards to render */
  count?: number;
  /** Additional CSS classes */
  className?: string;
}

/**
 * SkeletonStats component for stat card loading placeholders.
 * Matches the dashboard StatCard layout.
 *
 * @example
 * // Default 4 stats
 * <SkeletonStats />
 *
 * @example
 * // Custom count
 * <SkeletonStats count={3} />
 */
export function SkeletonStats({ count = 4, className }: SkeletonStatsProps) {
  return (
    <div className={cn('grid gap-4 sm:grid-cols-2 lg:grid-cols-4', className)} aria-hidden="true">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={`skeleton-stat-${i}`}
          className="rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4"
        >
          <Skeleton variant="text" className="h-3 w-20 mb-2" />
          <Skeleton className="h-8 w-12" />
        </div>
      ))}
    </div>
  );
}

SkeletonStats.displayName = 'SkeletonStats';
