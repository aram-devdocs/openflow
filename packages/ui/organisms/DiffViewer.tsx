/**
 * DiffViewer Organism - Git diff display component
 *
 * Displays file diffs with syntax highlighting, expandable sections,
 * and full accessibility support. Built for screen readers and keyboard users.
 *
 * Features:
 * - File-by-file diff display with collapsible sections
 * - Line numbers for old and new file versions
 * - Syntax highlighting for additions, deletions, and context
 * - File status indicators (new, deleted, renamed, modified)
 * - Change statistics (additions/deletions count)
 * - Loading and error states
 * - Screen reader announcements for state changes
 * - Responsive sizing via ResponsiveValue
 * - Touch targets ≥44px for mobile (WCAG 2.5.5)
 * - Additions/deletions indicated beyond color (+/- prefix)
 * - Responsive horizontal scroll for wide content
 */

import type { DiffHunk, FileDiff } from '@openflow/generated';
import { Box, Flex, type ResponsiveValue, Text, VisuallyHidden } from '@openflow/primitives';
import { cn } from '@openflow/utils';
import {
  AlertCircle,
  ArrowRight,
  ChevronDown,
  ChevronRight,
  File,
  FileEdit,
  FileMinus,
  FilePlus,
} from 'lucide-react';
import { forwardRef, useCallback, useId, useMemo, useState } from 'react';
import { Badge } from '../atoms/Badge';
import { Button } from '../atoms/Button';
import { Icon } from '../atoms/Icon';
import { Skeleton } from '../atoms/Skeleton';
import { EmptyState } from '../molecules/EmptyState';

// =============================================================================
// Types
// =============================================================================

export type DiffViewerSize = 'sm' | 'md' | 'lg';
export type DiffViewerBreakpoint = 'base' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

export interface DiffViewerProps {
  /** Array of file diffs to display */
  diffs: FileDiff[];
  /** Set of expanded file paths (controls which files are open) */
  expandedFiles?: Set<string>;
  /** Callback when a file is expanded or collapsed */
  onFileToggle?: (path: string) => void;
  /** Whether all files should be expanded by default (when expandedFiles is not provided) */
  defaultExpanded?: boolean;
  /** Whether to show line numbers */
  showLineNumbers?: boolean;
  /** Maximum height for the diff content area (enables scrolling) */
  maxHeight?: string;
  /** Additional CSS classes */
  className?: string;
  /** Size variant - supports responsive values */
  size?: ResponsiveValue<DiffViewerSize>;
  /** Test ID for automated testing */
  'data-testid'?: string;
  /** Accessible label for the diff viewer region */
  'aria-label'?: string;
}

export interface DiffViewerSkeletonProps {
  /** Number of skeleton file items to display */
  count?: number;
  /** Additional CSS classes */
  className?: string;
  /** Size variant - supports responsive values */
  size?: ResponsiveValue<DiffViewerSize>;
  /** Test ID for automated testing */
  'data-testid'?: string;
}

export interface DiffViewerErrorProps {
  /** Error message to display */
  message?: string;
  /** Retry callback */
  onRetry?: () => void;
  /** Additional CSS classes */
  className?: string;
  /** Size variant - supports responsive values */
  size?: ResponsiveValue<DiffViewerSize>;
  /** Test ID for automated testing */
  'data-testid'?: string;
}

/** Parsed diff line with metadata */
export interface DiffLine {
  type: 'context' | 'addition' | 'deletion' | 'header';
  content: string;
  oldLineNumber?: number;
  newLineNumber?: number;
}

// Internal component props
interface FileDiffContentProps {
  diff: FileDiff;
  showLineNumbers: boolean;
  size: DiffViewerSize;
}

interface DiffLineComponentProps {
  line: DiffLine;
  showLineNumbers: boolean;
  size: DiffViewerSize;
}

interface FileHeaderProps {
  diff: FileDiff;
  isExpanded: boolean;
  onToggle: () => void;
  size: DiffViewerSize;
  headerId: string;
  contentId: string;
}

// =============================================================================
// Constants
// =============================================================================

/** Default number of skeleton items */
export const DEFAULT_SKELETON_COUNT = 3;

/** Default labels */
export const DEFAULT_REGION_LABEL = 'File changes';
export const DEFAULT_EMPTY_TITLE = 'No changes to display';
export const DEFAULT_EMPTY_DESCRIPTION = 'There are no file changes to show.';
export const DEFAULT_ERROR_TITLE = 'Failed to load changes';
export const DEFAULT_ERROR_RETRY_LABEL = 'Retry';
export const DEFAULT_EXPAND_LABEL = 'Expand file';
export const DEFAULT_COLLAPSE_LABEL = 'Collapse file';
export const DEFAULT_BINARY_MESSAGE = 'Binary file - diff not available';
export const DEFAULT_NO_CHANGES_MESSAGE = 'No changes';

/** Screen reader announcements */
export const SR_FILE_EXPANDED = 'File diff expanded';
export const SR_FILE_COLLAPSED = 'File diff collapsed';
export const SR_FILES_COUNT = 'files changed';
export const SR_ADDITIONS = 'additions';
export const SR_DELETIONS = 'deletions';
export const SR_NEW_FILE = 'new file';
export const SR_DELETED_FILE = 'deleted file';
export const SR_RENAMED_FILE = 'file renamed';
export const SR_BINARY_FILE = 'binary file';
export const SR_LOADING = 'Loading file changes';
export const SR_ADDITION_PREFIX = 'addition';
export const SR_DELETION_PREFIX = 'deletion';
export const SR_CONTEXT_PREFIX = 'unchanged';

/** Status labels for badges */
export const STATUS_LABELS = {
  new: 'new',
  deleted: 'deleted',
  renamed: 'renamed',
  binary: 'binary',
} as const;

/** Breakpoint order for responsive class generation */
const BREAKPOINT_ORDER: DiffViewerBreakpoint[] = ['base', 'sm', 'md', 'lg', 'xl', '2xl'];

// =============================================================================
// Size Classes
// =============================================================================

export const DIFF_VIEWER_SIZE_CLASSES: Record<DiffViewerSize, string> = {
  sm: 'text-xs',
  md: 'text-sm',
  lg: 'text-base',
};

export const DIFF_VIEWER_PADDING_CLASSES: Record<DiffViewerSize, string> = {
  sm: 'px-3 py-2',
  md: 'px-4 py-2.5',
  lg: 'px-5 py-3',
};

export const DIFF_VIEWER_HEADER_PADDING_CLASSES: Record<DiffViewerSize, string> = {
  sm: 'px-3 py-1.5',
  md: 'px-4 py-2',
  lg: 'px-5 py-2.5',
};

export const DIFF_VIEWER_GAP_CLASSES: Record<DiffViewerSize, string> = {
  sm: 'gap-1.5',
  md: 'gap-2',
  lg: 'gap-3',
};

export const DIFF_VIEWER_LINE_HEIGHT_CLASSES: Record<DiffViewerSize, string> = {
  sm: 'leading-5',
  md: 'leading-6',
  lg: 'leading-7',
};

export const DIFF_VIEWER_LINE_NUMBER_WIDTH_CLASSES: Record<DiffViewerSize, string> = {
  sm: 'w-10',
  md: 'w-12',
  lg: 'w-14',
};

export const DIFF_VIEWER_ICON_SIZE_MAP: Record<DiffViewerSize, 'xs' | 'sm' | 'md'> = {
  sm: 'xs',
  md: 'sm',
  lg: 'md',
};

export const DIFF_VIEWER_BUTTON_SIZE_MAP: Record<DiffViewerSize, 'sm' | 'md' | 'lg'> = {
  sm: 'sm',
  md: 'sm',
  lg: 'md',
};

export const DIFF_VIEWER_BADGE_SIZE_MAP: Record<DiffViewerSize, 'sm' | 'md' | 'lg'> = {
  sm: 'sm',
  md: 'sm',
  lg: 'md',
};

// =============================================================================
// Base Classes
// =============================================================================

export const DIFF_VIEWER_BASE_CLASSES = 'flex flex-col bg-[rgb(var(--background))]';

export const DIFF_VIEWER_SUMMARY_CLASSES = cn(
  'flex items-center justify-between',
  'border-b border-[rgb(var(--border))]'
);

export const DIFF_VIEWER_CONTENT_CLASSES = 'flex-1 overflow-y-auto scrollbar-thin';

export const DIFF_VIEWER_FILE_CONTAINER_CLASSES = cn(
  'flex flex-col',
  'divide-y divide-[rgb(var(--border))]'
);

export const FILE_HEADER_BUTTON_CLASSES = cn(
  'flex items-center w-full text-left',
  'hover:bg-[rgb(var(--muted))]',
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--ring))] focus-visible:ring-offset-2',
  'motion-safe:transition-colors motion-safe:duration-150',
  // Touch target ≥44px on mobile (WCAG 2.5.5)
  'min-h-[44px]'
);

export const FILE_HEADER_EXPANDED_CLASSES = 'bg-[rgb(var(--muted))]/50';

export const FILE_CONTENT_CONTAINER_CLASSES = cn(
  'border-t border-[rgb(var(--border))]',
  'bg-[rgb(var(--background))]',
  'overflow-x-auto'
);

export const DIFF_LINE_BASE_CLASSES = cn('flex font-mono', 'hover:bg-[rgb(var(--accent))]/50');

export const DIFF_LINE_ADDITION_CLASSES = 'bg-addition/10';
export const DIFF_LINE_DELETION_CLASSES = 'bg-deletion/10';

export const DIFF_LINE_NUMBER_CLASSES = cn(
  'flex-shrink-0 select-none px-2 text-right',
  'text-[rgb(var(--muted-foreground))]',
  'border-r border-[rgb(var(--border))]'
);

export const DIFF_LINE_PREFIX_CLASSES = 'w-6 flex-shrink-0 select-none text-center';

export const DIFF_LINE_CONTENT_CLASSES = 'flex-1 whitespace-pre-wrap break-all px-2';

export const DIFF_HUNK_HEADER_CLASSES = cn(
  'bg-[rgb(var(--muted))] px-4 py-1',
  'text-[rgb(var(--muted-foreground))] font-mono'
);

export const DIFF_BINARY_MESSAGE_CLASSES = cn(
  'px-4 py-3 italic',
  'text-[rgb(var(--muted-foreground))]'
);

export const SKELETON_FILE_CLASSES = cn(
  'flex items-center gap-3 p-4',
  'border-b border-[rgb(var(--border))]',
  'last:border-b-0'
);

export const ERROR_STATE_CLASSES = cn(
  'flex flex-col items-center justify-center py-12',
  'text-center'
);

export const ERROR_ICON_CONTAINER_CLASSES = cn(
  'rounded-full bg-[rgb(var(--destructive))]/10 p-3 mb-4'
);

// =============================================================================
// Utility Functions
// =============================================================================

/**
 * Get base size from responsive value
 */
export function getBaseSize(size: ResponsiveValue<DiffViewerSize>): DiffViewerSize {
  if (typeof size === 'string') {
    return size;
  }
  if (typeof size === 'object' && size !== null) {
    return (size as Partial<Record<DiffViewerBreakpoint, DiffViewerSize>>).base ?? 'md';
  }
  return 'md';
}

/**
 * Generate responsive classes from size prop
 */
export function getResponsiveSizeClasses(
  size: ResponsiveValue<DiffViewerSize>,
  classMap: Record<DiffViewerSize, string>
): string[] {
  const classes: string[] = [];

  if (typeof size === 'string') {
    const classValue = classMap[size];
    classes.push(...classValue.split(' '));
  } else if (typeof size === 'object' && size !== null) {
    for (const breakpoint of BREAKPOINT_ORDER) {
      const sizeValue = (size as Partial<Record<DiffViewerBreakpoint, DiffViewerSize>>)[breakpoint];
      if (sizeValue !== undefined) {
        const classValue = classMap[sizeValue];
        for (const cls of classValue.split(' ')) {
          if (breakpoint === 'base') {
            classes.push(cls);
          } else {
            classes.push(`${breakpoint}:${cls}`);
          }
        }
      }
    }
  }

  return classes;
}

/**
 * Get the appropriate icon for a file based on its diff status
 */
export function getFileIcon(diff: FileDiff): typeof FilePlus {
  if (diff.isNew) return FilePlus;
  if (diff.isDeleted) return FileMinus;
  return FileEdit;
}

/**
 * Get the color class for a file icon based on its diff status
 */
export function getFileIconColor(diff: FileDiff): string {
  if (diff.isNew) return 'text-[rgb(var(--success))]';
  if (diff.isDeleted) return 'text-[rgb(var(--destructive))]';
  return 'text-[rgb(var(--warning))]';
}

/**
 * Get the status label for a file
 */
export function getFileStatusLabel(diff: FileDiff): string | null {
  if (diff.isNew) return SR_NEW_FILE;
  if (diff.isDeleted) return SR_DELETED_FILE;
  if (diff.isRenamed) return SR_RENAMED_FILE;
  if (diff.isBinary) return SR_BINARY_FILE;
  return null;
}

/**
 * Parse a diff hunk content into individual lines with metadata
 */
export function parseDiffHunk(hunk: DiffHunk): DiffLine[] {
  const lines: DiffLine[] = [];
  const contentLines = hunk.content.split('\n');

  let oldLine = hunk.oldStart;
  let newLine = hunk.newStart;

  for (const line of contentLines) {
    if (line.startsWith('@@')) {
      lines.push({ type: 'header', content: line });
      continue;
    }

    if (line.startsWith('+')) {
      lines.push({
        type: 'addition',
        content: line.substring(1),
        newLineNumber: newLine,
      });
      newLine++;
    } else if (line.startsWith('-')) {
      lines.push({
        type: 'deletion',
        content: line.substring(1),
        oldLineNumber: oldLine,
      });
      oldLine++;
    } else if (line.startsWith(' ') || line === '') {
      // Context line (or empty line at end)
      const content = line.startsWith(' ') ? line.substring(1) : line;
      if (line !== '' || lines.length > 0) {
        lines.push({
          type: 'context',
          content,
          oldLineNumber: oldLine,
          newLineNumber: newLine,
        });
        oldLine++;
        newLine++;
      }
    }
  }

  return lines;
}

/**
 * Get the screen reader announcement for a line type
 */
export function getLineTypeAnnouncement(type: DiffLine['type']): string {
  switch (type) {
    case 'addition':
      return SR_ADDITION_PREFIX;
    case 'deletion':
      return SR_DELETION_PREFIX;
    case 'context':
      return SR_CONTEXT_PREFIX;
    case 'header':
      return '';
  }
}

/**
 * Build accessible label for file header
 */
export function buildFileAccessibleLabel(diff: FileDiff, isExpanded: boolean): string {
  const action = isExpanded ? 'Collapse' : 'Expand';
  const status = getFileStatusLabel(diff);
  const statusText = status ? `, ${status}` : '';
  const stats = `${diff.additions} additions, ${diff.deletions} deletions`;
  const renamedText = diff.isRenamed && diff.oldPath ? `, renamed from ${diff.oldPath}` : '';

  return `${action} ${diff.path}${statusText}${renamedText}. ${stats}`;
}

/**
 * Build screen reader announcement for diff stats
 */
export function buildStatsAnnouncement(
  filesCount: number,
  additions: number,
  deletions: number
): string {
  const files = `${filesCount} ${filesCount === 1 ? 'file' : 'files'} changed`;
  return `${files}, ${additions} ${additions === 1 ? 'addition' : 'additions'}, ${deletions} ${deletions === 1 ? 'deletion' : 'deletions'}`;
}

// =============================================================================
// Sub-Components
// =============================================================================

/**
 * Render a single diff line with accessibility support
 */
const DiffLineComponent = forwardRef<HTMLDivElement, DiffLineComponentProps>(
  function DiffLineComponent({ line, showLineNumbers, size }, ref) {
    const lineHeightClasses = DIFF_VIEWER_LINE_HEIGHT_CLASSES[size];
    const lineNumberWidthClasses = DIFF_VIEWER_LINE_NUMBER_WIDTH_CLASSES[size];

    // Hunk header rendering
    if (line.type === 'header') {
      return (
        <Box
          ref={ref}
          className={cn(DIFF_HUNK_HEADER_CLASSES, DIFF_VIEWER_SIZE_CLASSES[size])}
          role="separator"
          aria-label="Diff hunk header"
        >
          <Box as="code">{line.content}</Box>
        </Box>
      );
    }

    const bgClass =
      line.type === 'addition'
        ? DIFF_LINE_ADDITION_CLASSES
        : line.type === 'deletion'
          ? DIFF_LINE_DELETION_CLASSES
          : '';

    const textClass =
      line.type === 'addition'
        ? 'text-addition'
        : line.type === 'deletion'
          ? 'text-deletion'
          : 'text-foreground';

    // Visual prefix (+/-/space) - these are critical for accessibility beyond color
    const prefix = line.type === 'addition' ? '+' : line.type === 'deletion' ? '-' : ' ';

    // Screen reader announcement for line type
    const srAnnouncement = getLineTypeAnnouncement(line.type);

    return (
      <Box
        ref={ref}
        className={cn(
          DIFF_LINE_BASE_CLASSES,
          DIFF_VIEWER_SIZE_CLASSES[size],
          lineHeightClasses,
          bgClass
        )}
        role="row"
        aria-label={
          srAnnouncement ? `${srAnnouncement}: ${line.content || 'empty line'}` : undefined
        }
      >
        {showLineNumbers && (
          <>
            <Text
              as="span"
              className={cn(DIFF_LINE_NUMBER_CLASSES, lineNumberWidthClasses)}
              role="cell"
              aria-label={
                line.type !== 'addition' && line.oldLineNumber
                  ? `old line ${line.oldLineNumber}`
                  : undefined
              }
            >
              {line.type !== 'addition' ? line.oldLineNumber : ''}
            </Text>
            <Text
              as="span"
              className={cn(DIFF_LINE_NUMBER_CLASSES, lineNumberWidthClasses)}
              role="cell"
              aria-label={
                line.type !== 'deletion' && line.newLineNumber
                  ? `new line ${line.newLineNumber}`
                  : undefined
              }
            >
              {line.type !== 'deletion' ? line.newLineNumber : ''}
            </Text>
          </>
        )}
        {/* Visual prefix for color-blind users - always shown */}
        <Text as="span" className={cn(DIFF_LINE_PREFIX_CLASSES, textClass)} aria-hidden={true}>
          {prefix}
        </Text>
        <Box as="pre" className={cn(DIFF_LINE_CONTENT_CLASSES, textClass)} role="cell">
          <Box as="code">{line.content || ' '}</Box>
        </Box>
      </Box>
    );
  }
);

DiffLineComponent.displayName = 'DiffLineComponent';

/**
 * Render a single file's diff content
 */
const FileDiffContent = forwardRef<HTMLDivElement, FileDiffContentProps>(function FileDiffContent(
  { diff, showLineNumbers, size },
  ref
) {
  const allLines = useMemo(() => {
    return diff.hunks.flatMap((hunk) => parseDiffHunk(hunk));
  }, [diff.hunks]);

  if (diff.isBinary) {
    return (
      <Box
        ref={ref}
        className={cn(DIFF_BINARY_MESSAGE_CLASSES, DIFF_VIEWER_SIZE_CLASSES[size])}
        role="status"
      >
        {DEFAULT_BINARY_MESSAGE}
      </Box>
    );
  }

  if (allLines.length === 0) {
    return (
      <Box
        ref={ref}
        className={cn(DIFF_BINARY_MESSAGE_CLASSES, DIFF_VIEWER_SIZE_CLASSES[size])}
        role="status"
      >
        {DEFAULT_NO_CHANGES_MESSAGE}
      </Box>
    );
  }

  // Create lines with stable keys based on line number and type
  const linesWithKeys = allLines.map((line, idx) => ({
    ...line,
    key:
      line.type === 'header'
        ? `header-${idx}`
        : `${line.type}-${line.oldLineNumber ?? 'new'}-${line.newLineNumber ?? 'old'}-${idx}`,
  }));

  return (
    <Box
      ref={ref}
      className={FILE_CONTENT_CONTAINER_CLASSES}
      role="table"
      aria-label={`Diff for ${diff.path}`}
    >
      <Box role="rowgroup">
        {linesWithKeys.map((line) => (
          <DiffLineComponent
            key={line.key}
            line={line}
            showLineNumbers={showLineNumbers}
            size={size}
          />
        ))}
      </Box>
    </Box>
  );
});

FileDiffContent.displayName = 'FileDiffContent';

/**
 * Render file header with expand/collapse button
 */
const FileHeader = forwardRef<HTMLButtonElement, FileHeaderProps>(function FileHeader(
  { diff, isExpanded, onToggle, size, headerId, contentId },
  ref
) {
  const iconSize = DIFF_VIEWER_ICON_SIZE_MAP[size];
  const badgeSize = DIFF_VIEWER_BADGE_SIZE_MAP[size];
  const paddingClasses = DIFF_VIEWER_PADDING_CLASSES[size];
  const gapClasses = DIFF_VIEWER_GAP_CLASSES[size];
  const [announced, setAnnounced] = useState(false);

  const FileIconComponent = getFileIcon(diff);
  const iconColor = getFileIconColor(diff);

  const handleToggle = useCallback(() => {
    onToggle();
    setAnnounced(true);
    setTimeout(() => setAnnounced(false), 1000);
  }, [onToggle]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleToggle();
      }
    },
    [handleToggle]
  );

  return (
    <>
      {/* Screen reader announcement */}
      {announced && (
        <VisuallyHidden>
          <Text as="span" aria-live="polite">
            {isExpanded ? SR_FILE_EXPANDED : SR_FILE_COLLAPSED}
          </Text>
        </VisuallyHidden>
      )}

      <Box
        as="button"
        ref={ref}
        type="button"
        id={headerId}
        className={cn(
          FILE_HEADER_BUTTON_CLASSES,
          paddingClasses,
          gapClasses,
          isExpanded && FILE_HEADER_EXPANDED_CLASSES
        )}
        onClick={handleToggle}
        onKeyDown={handleKeyDown}
        aria-expanded={isExpanded}
        aria-controls={contentId}
        aria-label={buildFileAccessibleLabel(diff, isExpanded)}
      >
        {/* Expand/collapse chevron */}
        <Icon
          icon={isExpanded ? ChevronDown : ChevronRight}
          size={iconSize}
          className="text-[rgb(var(--muted-foreground))] flex-shrink-0"
          aria-hidden={true}
        />

        {/* File icon */}
        <Icon
          icon={FileIconComponent}
          size={iconSize}
          className={cn('flex-shrink-0', iconColor)}
          aria-hidden={true}
        />

        {/* File path */}
        <Text as="span" className="flex-1 min-w-0 font-mono truncate text-[rgb(var(--foreground))]">
          {diff.isRenamed && diff.oldPath ? (
            <>
              <Text as="span" className="text-[rgb(var(--muted-foreground))]">
                {diff.oldPath}
              </Text>
              <Icon
                icon={ArrowRight}
                size={iconSize}
                className="inline mx-1 text-[rgb(var(--muted-foreground))]"
                aria-hidden={true}
              />
              {diff.path}
            </>
          ) : (
            diff.path
          )}
        </Text>

        {/* Status badges */}
        <Flex align="center" gap="2" className="flex-shrink-0" aria-hidden>
          {diff.isNew && (
            <Badge variant="success" size={badgeSize} aria-label={SR_NEW_FILE}>
              {STATUS_LABELS.new}
            </Badge>
          )}
          {diff.isDeleted && (
            <Badge variant="error" size={badgeSize} aria-label={SR_DELETED_FILE}>
              {STATUS_LABELS.deleted}
            </Badge>
          )}
          {diff.isRenamed && (
            <Badge variant="warning" size={badgeSize} aria-label={SR_RENAMED_FILE}>
              {STATUS_LABELS.renamed}
            </Badge>
          )}
          {diff.isBinary && (
            <Badge variant="default" size={badgeSize} aria-label={SR_BINARY_FILE}>
              {STATUS_LABELS.binary}
            </Badge>
          )}
        </Flex>

        {/* Change stats */}
        <Flex align="center" gap="2" className="flex-shrink-0" aria-hidden>
          {diff.additions > 0 && (
            <Text size={size === 'sm' ? 'xs' : 'sm'} className="text-addition">
              +{diff.additions}
            </Text>
          )}
          {diff.deletions > 0 && (
            <Text size={size === 'sm' ? 'xs' : 'sm'} className="text-deletion">
              -{diff.deletions}
            </Text>
          )}
        </Flex>
      </Box>
    </>
  );
});

FileHeader.displayName = 'FileHeader';

// =============================================================================
// Loading Skeleton
// =============================================================================

/**
 * Loading skeleton for DiffViewer
 */
export const DiffViewerSkeleton = forwardRef<HTMLDivElement, DiffViewerSkeletonProps>(
  function DiffViewerSkeleton(
    { count = DEFAULT_SKELETON_COUNT, className, size = 'md', 'data-testid': testId },
    ref
  ) {
    const baseSize = getBaseSize(size);
    const paddingClasses = DIFF_VIEWER_PADDING_CLASSES[baseSize];
    const headerPaddingClasses = DIFF_VIEWER_HEADER_PADDING_CLASSES[baseSize];

    return (
      <Box
        ref={ref}
        className={cn(DIFF_VIEWER_BASE_CLASSES, className)}
        aria-hidden={true}
        role="presentation"
        data-testid={testId}
        data-skeleton-count={count}
      >
        <VisuallyHidden>
          <Text as="span" aria-live="polite">
            {SR_LOADING}
          </Text>
        </VisuallyHidden>

        {/* Summary header skeleton */}
        <Box className={cn(DIFF_VIEWER_SUMMARY_CLASSES, headerPaddingClasses)}>
          <Skeleton variant="text" width={120} height={16} />
          <Flex gap="3">
            <Skeleton variant="text" width={50} height={14} />
            <Skeleton variant="text" width={40} height={14} />
          </Flex>
        </Box>

        {/* File skeletons */}
        {Array.from({ length: count }, (_, i) => (
          <Box key={i} className={cn(SKELETON_FILE_CLASSES, paddingClasses)}>
            <Skeleton variant="circular" width={16} height={16} />
            <Skeleton variant="circular" width={16} height={16} />
            <Flex direction="column" gap="1" className="flex-1">
              <Skeleton variant="text" width="60%" height={14} />
            </Flex>
            <Skeleton variant="text" width={40} height={14} />
            <Skeleton variant="text" width={40} height={14} />
          </Box>
        ))}
      </Box>
    );
  }
);

DiffViewerSkeleton.displayName = 'DiffViewerSkeleton';

// =============================================================================
// Error State
// =============================================================================

/**
 * Error state for DiffViewer
 */
export const DiffViewerError = forwardRef<HTMLDivElement, DiffViewerErrorProps>(
  function DiffViewerError(
    { message, onRetry, className, size = 'md', 'data-testid': testId },
    ref
  ) {
    const baseSize = getBaseSize(size);
    const buttonSize = DIFF_VIEWER_BUTTON_SIZE_MAP[baseSize];

    return (
      <Box
        ref={ref}
        className={cn(ERROR_STATE_CLASSES, className)}
        role="alert"
        aria-live="assertive"
        data-testid={testId}
      >
        <Box className={ERROR_ICON_CONTAINER_CLASSES}>
          <Icon
            icon={AlertCircle}
            size="lg"
            className="text-[rgb(var(--destructive))]"
            aria-hidden={true}
          />
        </Box>
        <Text size="lg" weight="medium" color="foreground" className="mb-1">
          {DEFAULT_ERROR_TITLE}
        </Text>
        {message && (
          <Text size="sm" color="muted-foreground" className="mb-4 max-w-sm">
            {message}
          </Text>
        )}
        {onRetry && (
          <Button variant="primary" size={buttonSize} onClick={onRetry}>
            {DEFAULT_ERROR_RETRY_LABEL}
          </Button>
        )}
      </Box>
    );
  }
);

DiffViewerError.displayName = 'DiffViewerError';

// =============================================================================
// Main Component
// =============================================================================

/**
 * DiffViewer component for displaying git diffs.
 * Stateless - receives all data via props, emits actions via callbacks.
 *
 * Features:
 * - File-by-file diff display with collapsible sections
 * - Line numbers for old and new file versions
 * - Syntax highlighting for additions, deletions, and context
 * - File status indicators (new, deleted, renamed, modified)
 * - Change statistics (additions/deletions count)
 * - Loading and error states
 * - Full keyboard navigation support
 * - Screen reader announcements
 *
 * Accessibility:
 * - role="region" for the diff viewer container
 * - aria-expanded on expandable file headers
 * - aria-controls linking headers to content
 * - aria-live announcements for state changes
 * - role="table" for diff content with proper row/cell semantics
 * - Visual +/- prefixes for color-blind accessibility
 * - Touch targets ≥44px (WCAG 2.5.5)
 * - Focus visible indicators
 *
 * @example
 * <DiffViewer
 *   diffs={fileDiffs}
 *   expandedFiles={expandedSet}
 *   onFileToggle={handleToggle}
 * />
 *
 * @example
 * <DiffViewer
 *   diffs={fileDiffs}
 *   defaultExpanded
 *   showLineNumbers
 * />
 *
 * @example
 * // Responsive sizing
 * <DiffViewer
 *   diffs={fileDiffs}
 *   size={{ base: 'sm', md: 'md', lg: 'lg' }}
 * />
 */
export const DiffViewer = forwardRef<HTMLDivElement, DiffViewerProps>(function DiffViewer(
  {
    diffs,
    expandedFiles,
    onFileToggle,
    defaultExpanded = false,
    showLineNumbers = true,
    maxHeight,
    className,
    size = 'md',
    'data-testid': testId,
    'aria-label': ariaLabel = DEFAULT_REGION_LABEL,
  },
  ref
) {
  const baseSize = getBaseSize(size);
  const viewerId = useId();
  const sizeClasses = getResponsiveSizeClasses(size, DIFF_VIEWER_SIZE_CLASSES);
  const headerPaddingClasses = DIFF_VIEWER_HEADER_PADDING_CLASSES[baseSize];

  // Determine if a file is expanded
  const isExpanded = useCallback(
    (path: string) => {
      if (expandedFiles !== undefined) {
        return expandedFiles.has(path);
      }
      return defaultExpanded;
    },
    [expandedFiles, defaultExpanded]
  );

  const handleToggle = useCallback(
    (path: string) => {
      onFileToggle?.(path);
    },
    [onFileToggle]
  );

  // Calculate totals
  const totals = useMemo(() => {
    return diffs.reduce(
      (acc, diff) => ({
        additions: acc.additions + diff.additions,
        deletions: acc.deletions + diff.deletions,
        files: acc.files + 1,
      }),
      { additions: 0, deletions: 0, files: 0 }
    );
  }, [diffs]);

  // Empty state
  if (diffs.length === 0) {
    return (
      <EmptyState
        icon={File}
        title={DEFAULT_EMPTY_TITLE}
        description={DEFAULT_EMPTY_DESCRIPTION}
        size={baseSize}
        className={className}
        data-testid={testId}
      />
    );
  }

  return (
    <Box
      ref={ref}
      className={cn(DIFF_VIEWER_BASE_CLASSES, ...sizeClasses, className)}
      style={{ maxHeight }}
      role="region"
      aria-label={ariaLabel}
      data-testid={testId}
      data-file-count={diffs.length}
      data-size={baseSize}
    >
      {/* Screen reader summary announcement */}
      <VisuallyHidden>
        <Text as="span">
          {buildStatsAnnouncement(totals.files, totals.additions, totals.deletions)}
        </Text>
      </VisuallyHidden>

      {/* Summary header */}
      <Box as="header" className={cn(DIFF_VIEWER_SUMMARY_CLASSES, headerPaddingClasses)}>
        <Text size={baseSize === 'sm' ? 'xs' : 'sm'} color="foreground">
          {totals.files} {totals.files === 1 ? 'file' : 'files'} changed
        </Text>
        <Flex align="center" gap="3" aria-hidden>
          <Text size="xs" className="text-addition">
            +{totals.additions}
          </Text>
          <Text size="xs" className="text-deletion">
            -{totals.deletions}
          </Text>
        </Flex>
      </Box>

      {/* File list */}
      <Box
        className={DIFF_VIEWER_CONTENT_CLASSES}
        role="list"
        aria-label={`${diffs.length} ${diffs.length === 1 ? 'file' : 'files'}`}
      >
        {diffs.map((diff, index) => {
          const expanded = isExpanded(diff.path);
          const headerId = `${viewerId}-header-${index}`;
          const contentId = `${viewerId}-content-${index}`;

          return (
            <Box
              key={diff.path}
              className="flex flex-col border-b border-[rgb(var(--border))] last:border-b-0"
              role="listitem"
              data-file-path={diff.path}
            >
              <FileHeader
                diff={diff}
                isExpanded={expanded}
                onToggle={() => handleToggle(diff.path)}
                size={baseSize}
                headerId={headerId}
                contentId={contentId}
              />

              {expanded && (
                <Box id={contentId} aria-labelledby={headerId}>
                  <FileDiffContent diff={diff} showLineNumbers={showLineNumbers} size={baseSize} />
                </Box>
              )}
            </Box>
          );
        })}
      </Box>
    </Box>
  );
});

DiffViewer.displayName = 'DiffViewer';
