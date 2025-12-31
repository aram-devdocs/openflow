import { cn } from '@openflow/utils';
import { ExternalLink, Eye, File, FileText, Folder } from 'lucide-react';
import { Button } from '../atoms/Button';
import { Icon } from '../atoms/Icon';
import { Skeleton } from '../atoms/Skeleton';
import { EmptyState } from '../molecules/EmptyState';
import { Tooltip } from '../molecules/Tooltip';

/**
 * Represents a file or directory in the task artifacts folder.
 * Duplicated from queries package to maintain UI package independence.
 */
export interface ArtifactFile {
  /** File or directory name */
  name: string;
  /** Full path to the file */
  path: string;
  /** File size in bytes */
  size: number;
  /** Last modified timestamp (ISO string) */
  modifiedAt: string;
  /** Whether this is a directory */
  isDirectory: boolean;
}

export interface ArtifactsPanelProps {
  /** Array of artifact files to display */
  artifacts: ArtifactFile[];
  /** Callback when an artifact is opened in external editor */
  onOpenArtifact: (artifact: ArtifactFile) => void;
  /** Callback when an artifact is previewed */
  onPreviewArtifact?: (artifact: ArtifactFile) => void;
  /** Whether the panel is in a loading state */
  loading?: boolean;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Format file size to human-readable string.
 */
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Get the appropriate icon for an artifact based on its type.
 */
function getFileIcon(artifact: ArtifactFile) {
  if (artifact.isDirectory) return Folder;
  if (artifact.name.endsWith('.md')) return FileText;
  return File;
}

/**
 * Check if a file can be previewed (markdown files).
 */
function canPreview(artifact: ArtifactFile): boolean {
  return !artifact.isDirectory && artifact.name.endsWith('.md');
}

/**
 * Loading skeleton for the ArtifactsPanel.
 */
function ArtifactsPanelSkeleton({ className }: { className?: string }) {
  return (
    <div aria-label="Loading artifacts" aria-busy="true" className={cn('p-4 space-y-2', className)}>
      <Skeleton variant="text" width={80} height={14} className="mb-4" />
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex items-center gap-3 p-2">
          <Skeleton variant="rectangular" width={16} height={16} />
          <div className="flex-1 space-y-1">
            <Skeleton variant="text" width={`${50 + i * 15}%`} height={14} />
            <Skeleton variant="text" width={40} height={12} />
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * ArtifactsPanel component for displaying task artifact files.
 * Stateless - receives all data via props, emits actions via callbacks.
 *
 * Features:
 * - List of artifact files with icons based on file type
 * - File size display
 * - Open in external editor action
 * - Preview markdown files in dialog
 * - Loading skeleton state
 * - Empty state when no artifacts
 *
 * @example
 * <ArtifactsPanel
 *   artifacts={artifacts}
 *   loading={isLoading}
 *   onOpenArtifact={(artifact) => openInEditor(artifact.path)}
 *   onPreviewArtifact={(artifact) => setPreviewFile(artifact)}
 * />
 */
export function ArtifactsPanel({
  artifacts,
  onOpenArtifact,
  onPreviewArtifact,
  loading = false,
  className,
}: ArtifactsPanelProps) {
  // Show loading skeleton
  if (loading) {
    return <ArtifactsPanelSkeleton className={className} />;
  }

  // Show empty state
  if (artifacts.length === 0) {
    return (
      <EmptyState
        icon={File}
        title="No artifacts"
        description="Task artifacts will appear here as they are created."
        size="sm"
        className={className}
      />
    );
  }

  return (
    <div className={cn('p-4', className)}>
      <h3 className="mb-4 text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted-foreground))]">
        Artifacts
      </h3>

      <ul className="space-y-1" role="list" aria-label="Task artifacts">
        {artifacts.map((artifact) => {
          const FileIcon = getFileIcon(artifact);
          const showPreview = canPreview(artifact) && onPreviewArtifact;

          return (
            <li
              key={artifact.path}
              className={cn(
                'group flex items-center gap-3 rounded-md px-3 py-2',
                'hover:bg-[rgb(var(--surface-1))]',
                'transition-colors duration-150'
              )}
            >
              {/* File icon */}
              <Icon
                icon={FileIcon}
                size="sm"
                className="flex-shrink-0 text-[rgb(var(--muted-foreground))]"
              />

              {/* File info */}
              <div className="min-w-0 flex-1">
                <span
                  className="block truncate text-sm font-medium text-[rgb(var(--foreground))]"
                  title={artifact.name}
                >
                  {artifact.name}
                </span>
                <span className="text-xs text-[rgb(var(--muted-foreground))]">
                  {formatFileSize(artifact.size)}
                </span>
              </div>

              {/* Actions - visible on hover */}
              <div
                className={cn(
                  'flex gap-1',
                  'opacity-0 group-hover:opacity-100',
                  'motion-safe:transition-opacity'
                )}
              >
                {showPreview && (
                  <Tooltip content="Preview" position="left">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onPreviewArtifact(artifact)}
                      aria-label={`Preview ${artifact.name}`}
                      className="h-8 w-8 p-0"
                    >
                      <Icon icon={Eye} size="sm" />
                    </Button>
                  </Tooltip>
                )}
                <Tooltip content="Open in editor" position="left">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onOpenArtifact(artifact)}
                    aria-label={`Open ${artifact.name} in editor`}
                    className="h-8 w-8 p-0"
                  >
                    <Icon icon={ExternalLink} size="sm" />
                  </Button>
                </Tooltip>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

ArtifactsPanel.displayName = 'ArtifactsPanel';
