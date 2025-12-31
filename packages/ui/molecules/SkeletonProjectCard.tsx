import { cn } from '@openflow/utils';
import { Skeleton } from '../atoms/Skeleton';

export interface SkeletonProjectCardProps {
  /** Additional CSS classes */
  className?: string;
}

/**
 * SkeletonProjectCard component for project card loading placeholders.
 * Matches the ProjectCard layout in the projects list.
 *
 * @example
 * // Single loading project card
 * <SkeletonProjectCard />
 *
 * @example
 * // Multiple loading project cards
 * {Array.from({ length: 4 }).map((_, i) => (
 *   <SkeletonProjectCard key={i} />
 * ))}
 */
export function SkeletonProjectCard({ className }: SkeletonProjectCardProps) {
  return (
    <div
      className={cn(
        'flex flex-col rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4',
        className
      )}
      aria-hidden="true"
    >
      {/* Icon */}
      <Skeleton className="mb-3 h-10 w-10 rounded-lg" />

      {/* Name */}
      <Skeleton variant="text" className="h-5 w-3/4 mb-1" />

      {/* Path */}
      <Skeleton variant="text" className="h-3 w-full" />
    </div>
  );
}

SkeletonProjectCard.displayName = 'SkeletonProjectCard';
