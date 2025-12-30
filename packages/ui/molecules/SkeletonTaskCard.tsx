import { cn } from '@openflow/utils';
import { Skeleton } from '../atoms/Skeleton';

export interface SkeletonTaskCardProps {
  /** Additional CSS classes */
  className?: string;
}

/**
 * SkeletonTaskCard component for TaskCard loading placeholders.
 * Matches the exact layout of the TaskCard component.
 *
 * Layout matches TaskCard:
 * - Header row: Title skeleton + status badge skeleton
 * - Description: Two lines of text
 * - Footer: Metadata skeletons
 *
 * @example
 * // Single loading task card
 * <SkeletonTaskCard />
 *
 * @example
 * // Multiple loading task cards
 * {Array.from({ length: 5 }).map((_, i) => (
 *   <SkeletonTaskCard key={i} />
 * ))}
 */
export function SkeletonTaskCard({ className }: SkeletonTaskCardProps) {
  return (
    <div
      className={cn(
        'rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-3 space-y-3',
        className
      )}
      aria-hidden="true"
    >
      {/* Header: Title and Status badge */}
      <div className="flex items-start justify-between gap-2">
        <Skeleton variant="text" className="h-5 w-2/3" />
        <Skeleton className="h-6 w-16 rounded-full shrink-0" />
      </div>

      {/* Description */}
      <div className="space-y-1">
        <Skeleton variant="text" className="w-full" />
        <Skeleton variant="text" className="w-4/5" />
      </div>

      {/* Footer: Metadata */}
      <div className="flex items-center gap-4 pt-2">
        <Skeleton variant="text" className="h-3 w-20" />
        <Skeleton variant="text" className="h-3 w-16" />
      </div>
    </div>
  );
}

SkeletonTaskCard.displayName = 'SkeletonTaskCard';
