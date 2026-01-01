import {
  Box,
  Heading,
  List,
  ListItem,
  type ResponsiveValue,
  Text,
  VisuallyHidden,
} from '@openflow/primitives';
import { cn } from '@openflow/utils';
import { AlertCircle, ExternalLink, Eye, File, FileText, Folder, RefreshCw } from 'lucide-react';
import { type ForwardedRef, type HTMLAttributes, forwardRef, useId, useMemo } from 'react';
import { Button } from '../atoms/Button';
import { Icon } from '../atoms/Icon';
import { Skeleton } from '../atoms/Skeleton';
import { EmptyState } from '../molecules/EmptyState';
import { Tooltip } from '../molecules/Tooltip';

// ============================================================================
// Types
// ============================================================================

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

/** Size variants for the ArtifactsPanel */
export type ArtifactsPanelSize = 'sm' | 'md' | 'lg';

/** Breakpoints for responsive values */
export type ArtifactsPanelBreakpoint = 'base' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

export interface ArtifactsPanelProps extends Omit<HTMLAttributes<HTMLDivElement>, 'onError'> {
  /** Array of artifact files to display */
  artifacts: ArtifactFile[];
  /** Callback when an artifact is opened in external editor */
  onOpenArtifact: (artifact: ArtifactFile) => void;
  /** Callback when an artifact is previewed */
  onPreviewArtifact?: (artifact: ArtifactFile) => void;
  /** Whether the panel is in a loading state */
  loading?: boolean;
  /** Error message to display */
  error?: string;
  /** Callback when retry is clicked (only shown if error is set) */
  onRetry?: () => void;
  /** Size variant - affects padding, font sizes, and icon sizes */
  size?: ResponsiveValue<ArtifactsPanelSize>;
  /** Custom heading for the panel */
  heading?: string;
  /** Custom empty state title */
  emptyTitle?: string;
  /** Custom empty state description */
  emptyDescription?: string;
  /** Custom error title */
  errorTitle?: string;
  /** Number of skeleton items to show when loading */
  skeletonCount?: number;
  /** Additional CSS classes */
  className?: string;
  /** Test ID for automated testing */
  'data-testid'?: string;
}

export interface ArtifactsPanelSkeletonProps {
  /** Number of skeleton items to show */
  count?: number;
  /** Size variant */
  size?: ResponsiveValue<ArtifactsPanelSize>;
  /** Additional CSS classes */
  className?: string;
  /** Test ID for automated testing */
  'data-testid'?: string;
}

// ============================================================================
// Constants
// ============================================================================

/** Default number of skeleton items to show */
export const DEFAULT_SKELETON_COUNT = 3;

/** Default heading text */
export const DEFAULT_HEADING = 'Artifacts';

/** Default empty state title */
export const DEFAULT_EMPTY_TITLE = 'No artifacts';

/** Default empty state description */
export const DEFAULT_EMPTY_DESCRIPTION = 'Task artifacts will appear here as they are created.';

/** Default error title */
export const DEFAULT_ERROR_TITLE = 'Failed to load artifacts';

/** Default retry button label */
export const DEFAULT_RETRY_LABEL = 'Retry';

/** Size-specific classes for the panel container */
export const ARTIFACTS_PANEL_SIZE_CLASSES: Record<ArtifactsPanelSize, string> = {
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-6',
};

/** Size-specific classes for list item padding */
export const ARTIFACTS_ITEM_SIZE_CLASSES: Record<ArtifactsPanelSize, string> = {
  sm: 'px-2 py-1.5',
  md: 'px-3 py-2',
  lg: 'px-4 py-3',
};

/** Size-specific classes for heading margin */
export const ARTIFACTS_HEADING_MARGIN_CLASSES: Record<ArtifactsPanelSize, string> = {
  sm: 'mb-3',
  md: 'mb-4',
  lg: 'mb-6',
};

/** Size-specific classes for list gap */
export const ARTIFACTS_LIST_GAP_CLASSES: Record<ArtifactsPanelSize, string> = {
  sm: 'space-y-0.5',
  md: 'space-y-1',
  lg: 'space-y-2',
};

/** Size-specific icon sizes */
export const ARTIFACTS_ICON_SIZE_MAP: Record<ArtifactsPanelSize, 'xs' | 'sm' | 'md'> = {
  sm: 'xs',
  md: 'sm',
  lg: 'md',
};

/** Size-specific action button sizes */
export const ARTIFACTS_BUTTON_SIZE_MAP: Record<ArtifactsPanelSize, 'sm' | 'md' | 'lg'> = {
  sm: 'sm',
  md: 'sm',
  lg: 'md',
};

/** Size-specific action button dimensions */
export const ARTIFACTS_BUTTON_DIMENSION_CLASSES: Record<ArtifactsPanelSize, string> = {
  sm: 'h-7 w-7 min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0',
  md: 'h-8 w-8 min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0',
  lg: 'h-10 w-10 min-h-[44px] min-w-[44px]',
};

/** Base classes for the panel container */
export const ARTIFACTS_PANEL_BASE_CLASSES = 'flex flex-col';

/** Base classes for list items */
export const ARTIFACTS_ITEM_BASE_CLASSES = cn(
  'group flex items-center gap-3 rounded-md',
  'hover:bg-[rgb(var(--surface-1))]',
  'focus-within:bg-[rgb(var(--surface-1))]',
  'motion-safe:transition-colors motion-safe:duration-150'
);

/** Classes for the file info container */
export const ARTIFACTS_FILE_INFO_CLASSES = 'min-w-0 flex-1';

/** Classes for the file name */
export const ARTIFACTS_FILE_NAME_CLASSES = 'block truncate';

/** Classes for the actions container */
export const ARTIFACTS_ACTIONS_CLASSES = cn(
  'flex gap-1',
  'opacity-0 group-hover:opacity-100 group-focus-within:opacity-100',
  'motion-safe:transition-opacity'
);

/** Classes for skeleton container */
export const ARTIFACTS_SKELETON_CONTAINER_CLASSES = 'flex items-center gap-3';

/** Classes for skeleton text container */
export const ARTIFACTS_SKELETON_TEXT_CLASSES = 'flex-1 space-y-1';

/** Classes for error container */
export const ARTIFACTS_ERROR_CLASSES = cn(
  'flex flex-col items-center justify-center gap-4 text-center',
  'p-6'
);

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Get the base size value from a responsive size value.
 */
export function getBaseSize(size: ResponsiveValue<ArtifactsPanelSize>): ArtifactsPanelSize {
  if (typeof size === 'string') {
    return size;
  }
  return size.base ?? 'md';
}

/**
 * Generate responsive CSS classes from a size value and class map.
 */
export function getResponsiveSizeClasses(
  size: ResponsiveValue<ArtifactsPanelSize>,
  classMap: Record<ArtifactsPanelSize, string>
): string {
  if (typeof size === 'string') {
    return classMap[size];
  }

  const classes: string[] = [];

  // Base size (no prefix)
  if (size.base) {
    classes.push(classMap[size.base]);
  }

  // Breakpoint-specific sizes
  const breakpoints: ArtifactsPanelBreakpoint[] = ['sm', 'md', 'lg', 'xl', '2xl'];
  for (const bp of breakpoints) {
    const bpSize = size[bp];
    if (bpSize) {
      // Add breakpoint prefix to each class
      const bpClasses = classMap[bpSize].split(' ').map((c) => `${bp}:${c}`);
      classes.push(...bpClasses);
    }
  }

  return classes.join(' ');
}

/**
 * Format file size to human-readable string.
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Get the appropriate icon for an artifact based on its type.
 */
export function getFileIcon(artifact: ArtifactFile): typeof File {
  if (artifact.isDirectory) return Folder;
  if (artifact.name.endsWith('.md')) return FileText;
  return File;
}

/**
 * Check if a file can be previewed (markdown files).
 */
export function canPreview(artifact: ArtifactFile): boolean {
  return !artifact.isDirectory && artifact.name.endsWith('.md');
}

/**
 * Get the file type for screen readers.
 */
export function getFileType(artifact: ArtifactFile): string {
  if (artifact.isDirectory) return 'folder';
  if (artifact.name.endsWith('.md')) return 'markdown file';
  return 'file';
}

/**
 * Generate screen reader announcement for artifact list.
 */
export function getListAnnouncement(artifacts: ArtifactFile[]): string {
  const count = artifacts.length;
  if (count === 0) return '';
  const fileCount = artifacts.filter((a) => !a.isDirectory).length;
  const folderCount = artifacts.filter((a) => a.isDirectory).length;
  const parts: string[] = [];
  if (fileCount > 0) {
    parts.push(`${fileCount} file${fileCount !== 1 ? 's' : ''}`);
  }
  if (folderCount > 0) {
    parts.push(`${folderCount} folder${folderCount !== 1 ? 's' : ''}`);
  }
  return parts.join(' and ');
}

// ============================================================================
// Components
// ============================================================================

/**
 * Loading skeleton for the ArtifactsPanel.
 */
export const ArtifactsPanelSkeleton = forwardRef(function ArtifactsPanelSkeleton(
  {
    count = DEFAULT_SKELETON_COUNT,
    size = 'md',
    className,
    'data-testid': testId,
  }: ArtifactsPanelSkeletonProps,
  ref: ForwardedRef<HTMLDivElement>
) {
  const baseSize = getBaseSize(size);
  const containerClasses = getResponsiveSizeClasses(size, ARTIFACTS_PANEL_SIZE_CLASSES);
  const listGapClasses = getResponsiveSizeClasses(size, ARTIFACTS_LIST_GAP_CLASSES);
  const itemClasses = getResponsiveSizeClasses(size, ARTIFACTS_ITEM_SIZE_CLASSES);
  const headingMarginClasses = getResponsiveSizeClasses(size, ARTIFACTS_HEADING_MARGIN_CLASSES);
  const iconSize = ARTIFACTS_ICON_SIZE_MAP[baseSize];

  // Icon dimensions based on size
  const iconDimension = iconSize === 'xs' ? 14 : iconSize === 'sm' ? 16 : 20;

  return (
    <Box
      ref={ref}
      role="presentation"
      aria-hidden="true"
      className={cn(ARTIFACTS_PANEL_BASE_CLASSES, containerClasses, className)}
      data-testid={testId}
      data-size={baseSize}
    >
      {/* Heading skeleton */}
      <Skeleton variant="text" width={80} height={14} className={headingMarginClasses} />

      {/* Item skeletons */}
      <Box className={listGapClasses}>
        {Array.from({ length: count }, (_, i) => (
          <Box key={i} className={cn(ARTIFACTS_SKELETON_CONTAINER_CLASSES, itemClasses)}>
            <Skeleton variant="rectangular" width={iconDimension} height={iconDimension} />
            <Box className={ARTIFACTS_SKELETON_TEXT_CLASSES}>
              <Skeleton variant="text" width={`${50 + ((i * 15) % 40)}%`} height={14} />
              <Skeleton variant="text" width={40} height={12} />
            </Box>
          </Box>
        ))}
      </Box>

      <Text as="span" role="status" aria-live="polite">
        <VisuallyHidden>Loading artifacts</VisuallyHidden>
      </Text>
    </Box>
  );
});

ArtifactsPanelSkeleton.displayName = 'ArtifactsPanelSkeleton';

/**
 * Error state for the ArtifactsPanel.
 */
interface ArtifactsPanelErrorProps {
  /** Error message */
  error: string;
  /** Custom error title */
  title?: string;
  /** Callback when retry is clicked */
  onRetry?: () => void;
  /** Size variant */
  size?: ResponsiveValue<ArtifactsPanelSize>;
  /** Additional CSS classes */
  className?: string;
  /** Test ID for automated testing */
  'data-testid'?: string;
}

export const ArtifactsPanelError = forwardRef(function ArtifactsPanelError(
  {
    error,
    title = DEFAULT_ERROR_TITLE,
    onRetry,
    size = 'md',
    className,
    'data-testid': testId,
  }: ArtifactsPanelErrorProps,
  ref: ForwardedRef<HTMLDivElement>
) {
  const baseSize = getBaseSize(size);
  const iconSize = ARTIFACTS_ICON_SIZE_MAP[baseSize];

  return (
    <Box
      ref={ref}
      role="alert"
      aria-live="assertive"
      className={cn(ARTIFACTS_ERROR_CLASSES, className)}
      data-testid={testId}
    >
      <Icon
        icon={AlertCircle}
        size={iconSize === 'xs' ? 'sm' : iconSize === 'sm' ? 'md' : 'lg'}
        className="text-[rgb(var(--destructive))]"
        aria-hidden="true"
      />
      <Box className="space-y-1">
        <Text weight="medium" className="text-[rgb(var(--foreground))]">
          {title}
        </Text>
        <Text size="sm" className="text-[rgb(var(--muted-foreground))]">
          {error}
        </Text>
      </Box>
      {onRetry && (
        <Button
          variant="secondary"
          size={ARTIFACTS_BUTTON_SIZE_MAP[baseSize]}
          onClick={onRetry}
          icon={
            <Icon icon={RefreshCw} size={ARTIFACTS_ICON_SIZE_MAP[baseSize]} aria-hidden="true" />
          }
          aria-label={`${DEFAULT_RETRY_LABEL}: ${error}`}
        >
          {DEFAULT_RETRY_LABEL}
        </Button>
      )}
    </Box>
  );
});

ArtifactsPanelError.displayName = 'ArtifactsPanelError';

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
 * - Error state with retry option
 * - Responsive sizing (sm, md, lg)
 * - Full keyboard accessibility
 * - Screen reader announcements
 *
 * @example
 * <ArtifactsPanel
 *   artifacts={artifacts}
 *   loading={isLoading}
 *   error={error}
 *   onRetry={refetch}
 *   onOpenArtifact={(artifact) => openInEditor(artifact.path)}
 *   onPreviewArtifact={(artifact) => setPreviewFile(artifact)}
 * />
 */
export const ArtifactsPanel = forwardRef(function ArtifactsPanel(
  {
    artifacts,
    onOpenArtifact,
    onPreviewArtifact,
    loading = false,
    error,
    onRetry,
    size = 'md',
    heading = DEFAULT_HEADING,
    emptyTitle = DEFAULT_EMPTY_TITLE,
    emptyDescription = DEFAULT_EMPTY_DESCRIPTION,
    errorTitle = DEFAULT_ERROR_TITLE,
    skeletonCount = DEFAULT_SKELETON_COUNT,
    className,
    'data-testid': testId,
    ...props
  }: ArtifactsPanelProps,
  ref: ForwardedRef<HTMLDivElement>
) {
  const listId = useId();
  const headingId = useId();
  const baseSize = getBaseSize(size);

  // Memoize computed classes
  const containerClasses = useMemo(
    () => getResponsiveSizeClasses(size, ARTIFACTS_PANEL_SIZE_CLASSES),
    [size]
  );
  const listGapClasses = useMemo(
    () => getResponsiveSizeClasses(size, ARTIFACTS_LIST_GAP_CLASSES),
    [size]
  );
  const itemClasses = useMemo(
    () => getResponsiveSizeClasses(size, ARTIFACTS_ITEM_SIZE_CLASSES),
    [size]
  );
  const headingMarginClasses = useMemo(
    () => getResponsiveSizeClasses(size, ARTIFACTS_HEADING_MARGIN_CLASSES),
    [size]
  );
  const buttonDimensionClasses = useMemo(
    () => ARTIFACTS_BUTTON_DIMENSION_CLASSES[baseSize],
    [baseSize]
  );

  const iconSize = ARTIFACTS_ICON_SIZE_MAP[baseSize];
  const buttonSize = ARTIFACTS_BUTTON_SIZE_MAP[baseSize];

  // Screen reader announcement
  const listAnnouncement = useMemo(() => getListAnnouncement(artifacts), [artifacts]);

  // Show loading skeleton
  if (loading) {
    return (
      <ArtifactsPanelSkeleton
        ref={ref}
        count={skeletonCount}
        size={size}
        className={className}
        data-testid={testId ? `${testId}-skeleton` : undefined}
      />
    );
  }

  // Show error state
  if (error) {
    return (
      <ArtifactsPanelError
        ref={ref}
        error={error}
        title={errorTitle}
        onRetry={onRetry}
        size={size}
        className={className}
        data-testid={testId ? `${testId}-error` : undefined}
      />
    );
  }

  // Show empty state
  if (artifacts.length === 0) {
    return (
      <EmptyState
        icon={File}
        title={emptyTitle}
        description={emptyDescription}
        size={baseSize}
        className={className}
        data-testid={testId ? `${testId}-empty` : undefined}
      />
    );
  }

  return (
    <Box
      ref={ref}
      className={cn(ARTIFACTS_PANEL_BASE_CLASSES, containerClasses, className)}
      data-testid={testId}
      data-size={baseSize}
      data-count={artifacts.length}
      {...props}
    >
      {/* Heading */}
      <Heading
        level={3}
        id={headingId}
        size="xs"
        weight="semibold"
        className={cn(
          headingMarginClasses,
          'uppercase tracking-wide text-[rgb(var(--muted-foreground))]'
        )}
      >
        {heading}
      </Heading>

      {/* Screen reader announcement */}
      <Text as="span" role="status" aria-live="polite">
        <VisuallyHidden>{listAnnouncement}</VisuallyHidden>
      </Text>

      {/* Artifacts list */}
      <List id={listId} aria-labelledby={headingId} className={listGapClasses}>
        {artifacts.map((artifact) => {
          const FileIcon = getFileIcon(artifact);
          const showPreview = canPreview(artifact) && onPreviewArtifact;
          const fileType = getFileType(artifact);
          const itemId = `artifact-${artifact.path.replace(/[^a-zA-Z0-9]/g, '-')}`;

          return (
            <ListItem
              key={artifact.path}
              id={itemId}
              className={cn(ARTIFACTS_ITEM_BASE_CLASSES, itemClasses)}
              data-testid={testId ? `${testId}-item` : undefined}
              data-path={artifact.path}
              data-type={artifact.isDirectory ? 'directory' : 'file'}
            >
              {/* File icon */}
              <Icon
                icon={FileIcon}
                size={iconSize}
                className="flex-shrink-0 text-[rgb(var(--muted-foreground))]"
                aria-hidden="true"
              />

              {/* File info */}
              <Box className={ARTIFACTS_FILE_INFO_CLASSES}>
                <Text
                  as="span"
                  size="sm"
                  weight="medium"
                  className={cn(ARTIFACTS_FILE_NAME_CLASSES, 'text-[rgb(var(--foreground))]')}
                  title={artifact.name}
                >
                  {artifact.name}
                </Text>
                <Text as="span" size="xs" className="block text-[rgb(var(--muted-foreground))]">
                  {formatFileSize(artifact.size)}
                  <VisuallyHidden>, {fileType}</VisuallyHidden>
                </Text>
              </Box>

              {/* Actions - visible on hover/focus */}
              <Box className={ARTIFACTS_ACTIONS_CLASSES}>
                {showPreview && (
                  <Tooltip content="Preview" position="left">
                    <Button
                      size={buttonSize}
                      variant="ghost"
                      onClick={() => onPreviewArtifact(artifact)}
                      aria-label={`Preview ${artifact.name}`}
                      className={cn('p-0', buttonDimensionClasses)}
                      data-testid={testId ? `${testId}-preview-button` : undefined}
                    >
                      <Icon icon={Eye} size={iconSize} aria-hidden="true" />
                    </Button>
                  </Tooltip>
                )}
                <Tooltip content="Open in editor" position="left">
                  <Button
                    size={buttonSize}
                    variant="ghost"
                    onClick={() => onOpenArtifact(artifact)}
                    aria-label={`Open ${artifact.name} in editor`}
                    className={cn('p-0', buttonDimensionClasses)}
                    data-testid={testId ? `${testId}-open-button` : undefined}
                  >
                    <Icon icon={ExternalLink} size={iconSize} aria-hidden="true" />
                  </Button>
                </Tooltip>
              </Box>
            </ListItem>
          );
        })}
      </List>
    </Box>
  );
});

ArtifactsPanel.displayName = 'ArtifactsPanel';
