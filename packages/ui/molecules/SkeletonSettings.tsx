import { cn } from '@openflow/utils';
import { Skeleton } from '../atoms/Skeleton';

export interface SkeletonSettingsProps {
  /** Number of settings sections to render */
  sectionCount?: number;
  /** Number of fields per section */
  fieldsPerSection?: number;
  /** Additional CSS classes */
  className?: string;
}

/**
 * SkeletonSettings component for settings page loading placeholders.
 * Matches the settings Card section layout with form fields.
 *
 * @example
 * // Default 2 sections with 2 fields each
 * <SkeletonSettings />
 *
 * @example
 * // Custom counts
 * <SkeletonSettings sectionCount={3} fieldsPerSection={3} />
 */
export function SkeletonSettings({
  sectionCount = 2,
  fieldsPerSection = 2,
  className,
}: SkeletonSettingsProps) {
  return (
    <div className={cn('space-y-6', className)} aria-hidden="true">
      {Array.from({ length: sectionCount }).map((_, sectionIndex) => (
        <div
          key={`skeleton-section-${sectionIndex}`}
          className="rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--card))] overflow-hidden"
        >
          {/* Section header */}
          <div className="border-b border-[rgb(var(--border))] bg-[rgb(var(--muted))]/50 px-4 py-3">
            <div className="flex items-center gap-2">
              <Skeleton variant="circular" width={16} height={16} />
              <Skeleton variant="text" className="h-5 w-32" />
            </div>
            <Skeleton variant="text" className="mt-1 h-3 w-48" />
          </div>

          {/* Section content */}
          <div className="p-4 space-y-4">
            {Array.from({ length: fieldsPerSection }).map((_, fieldIndex) => (
              <div key={`skeleton-field-${sectionIndex}-${fieldIndex}`} className="space-y-1.5">
                <Skeleton variant="text" className="h-4 w-24" />
                <Skeleton className="h-10 w-full rounded-md" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

SkeletonSettings.displayName = 'SkeletonSettings';
