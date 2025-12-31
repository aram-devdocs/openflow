import { cn } from '@openflow/utils';
import { Skeleton } from '../atoms/Skeleton';

export interface SkeletonTaskDetailProps {
  /** Additional CSS classes */
  className?: string;
}

/**
 * SkeletonTaskDetail component for task detail page loading placeholders.
 * Matches the TaskLayout structure with steps panel and main content.
 *
 * @example
 * <SkeletonTaskDetail />
 */
export function SkeletonTaskDetail({ className }: SkeletonTaskDetailProps) {
  return (
    <div className={cn('flex h-full', className)} aria-hidden="true">
      {/* Main content area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="flex items-center gap-4 border-b border-[rgb(var(--border))] bg-[rgb(var(--card))] px-4 py-3">
          <Skeleton variant="circular" width={32} height={32} />
          <div className="flex-1">
            <Skeleton variant="text" className="h-6 w-64 mb-1" />
            <Skeleton variant="text" className="h-3 w-32" />
          </div>
          <Skeleton className="h-8 w-24 rounded-md" />
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-[rgb(var(--border))] px-4 py-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={`skeleton-tab-${i}`} className="h-8 w-20 rounded-md" />
          ))}
        </div>

        {/* Main content */}
        <div className="flex-1 p-4">
          {/* Chat messages skeleton */}
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={`skeleton-msg-${i}`}
                className={cn('flex gap-3', i % 2 === 0 ? 'justify-start' : 'justify-end')}
              >
                {i % 2 === 0 && <Skeleton variant="circular" width={32} height={32} />}
                <div className="max-w-[70%] space-y-2 rounded-lg bg-[rgb(var(--muted))] p-3">
                  <Skeleton variant="text" className="h-4 w-48" />
                  <Skeleton variant="text" className="h-4 w-32" />
                </div>
                {i % 2 !== 0 && <Skeleton variant="circular" width={32} height={32} />}
              </div>
            ))}
          </div>
        </div>

        {/* Input area */}
        <div className="border-t border-[rgb(var(--border))] p-4">
          <Skeleton className="h-12 w-full rounded-xl" />
        </div>
      </div>

      {/* Steps panel */}
      <div className="w-80 border-l border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4">
        <div className="flex items-center justify-between mb-4">
          <Skeleton variant="text" className="h-5 w-24" />
          <Skeleton className="h-8 w-8 rounded-md" />
        </div>
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={`skeleton-step-${i}`}
              className="rounded-lg border border-[rgb(var(--border))] p-3"
            >
              <div className="flex items-center gap-2 mb-2">
                <Skeleton variant="circular" width={20} height={20} />
                <Skeleton variant="text" className="h-4 w-24" />
              </div>
              <Skeleton variant="text" className="h-3 w-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

SkeletonTaskDetail.displayName = 'SkeletonTaskDetail';
