/**
 * CommitList Organism - Git commit history display component
 *
 * Displays a list of git commits with expandable details, statistics,
 * and optional diff viewing. Built for accessibility and responsiveness.
 *
 * Features:
 * - Expandable commit details with keyboard support
 * - Change statistics (files, additions, deletions)
 * - Loading and empty states
 * - Screen reader announcements for state changes
 * - Responsive sizing via ResponsiveValue
 * - Touch targets ≥44px for mobile (WCAG 2.5.5)
 */

import type { Commit } from '@openflow/generated';
import { Flex, type ResponsiveValue, Text, VisuallyHidden } from '@openflow/primitives';
import { cn } from '@openflow/utils';
import {
  ChevronDown,
  ChevronRight,
  Clock,
  FileDiff,
  GitCommit,
  Minus,
  Plus,
  User,
} from 'lucide-react';
import { forwardRef, useCallback, useId, useMemo, useState } from 'react';
import { Button } from '../atoms/Button';
import { Icon } from '../atoms/Icon';
import { Skeleton } from '../atoms/Skeleton';
import { EmptyState } from '../molecules/EmptyState';

// =============================================================================
// Types
// =============================================================================

export type CommitListSize = 'sm' | 'md' | 'lg';
export type CommitListBreakpoint = 'base' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

export interface CommitListProps {
  /** Array of commits to display */
  commits: Commit[];
  /** Set of expanded commit hashes (controls which commits show details) */
  expandedCommits?: Set<string>;
  /** Callback when a commit is expanded or collapsed */
  onCommitToggle?: (hash: string) => void;
  /** Callback when viewing a commit's full diff */
  onViewCommit?: (hash: string) => void;
  /** Whether all commits should be expanded by default (when expandedCommits is not provided) */
  defaultExpanded?: boolean;
  /** Maximum height for the commit list (enables scrolling) */
  maxHeight?: string;
  /** Additional CSS classes */
  className?: string;
  /** Size variant - supports responsive values */
  size?: ResponsiveValue<CommitListSize>;
  /** Test ID for automated testing */
  'data-testid'?: string;
  /** Accessible label for the commit list region */
  'aria-label'?: string;
}

export interface CommitListSkeletonProps {
  /** Number of skeleton items to display */
  count?: number;
  /** Additional CSS classes */
  className?: string;
  /** Size variant - supports responsive values */
  size?: ResponsiveValue<CommitListSize>;
  /** Test ID for automated testing */
  'data-testid'?: string;
}

export interface CommitListErrorProps {
  /** Error message to display */
  message?: string;
  /** Retry callback */
  onRetry?: () => void;
  /** Additional CSS classes */
  className?: string;
  /** Size variant - supports responsive values */
  size?: ResponsiveValue<CommitListSize>;
  /** Test ID for automated testing */
  'data-testid'?: string;
}

// Internal component props
interface CommitStatsProps {
  filesChanged: number;
  additions: number;
  deletions: number;
  size: CommitListSize;
}

interface CommitDetailsProps {
  commit: Commit;
  onViewCommit?: (hash: string) => void;
  size: CommitListSize;
  detailsId: string;
}

interface CommitRowProps {
  commit: Commit;
  isExpanded: boolean;
  onToggle: () => void;
  onViewCommit?: (hash: string) => void;
  size: CommitListSize;
  rowId: string;
  detailsId: string;
}

// =============================================================================
// Constants
// =============================================================================

/** Default number of skeleton items */
export const DEFAULT_SKELETON_COUNT = 5;

/** Default labels */
export const DEFAULT_LIST_LABEL = 'Commit history';
export const DEFAULT_EMPTY_TITLE = 'No commits to display';
export const DEFAULT_EMPTY_DESCRIPTION = 'There are no commits in this branch yet.';
export const DEFAULT_ERROR_TITLE = 'Failed to load commits';
export const DEFAULT_ERROR_RETRY_LABEL = 'Retry';
export const DEFAULT_VIEW_CHANGES_LABEL = 'View changes';
export const DEFAULT_EXPAND_LABEL = 'Expand commit';
export const DEFAULT_COLLAPSE_LABEL = 'Collapse commit';

/** Screen reader announcements */
export const SR_COMMIT_EXPANDED = 'Commit details expanded';
export const SR_COMMIT_COLLAPSED = 'Commit details collapsed';
export const SR_COMMITS_COUNT = 'commits in history';
export const SR_FILES_CHANGED = 'files changed';
export const SR_ADDITIONS = 'additions';
export const SR_DELETIONS = 'deletions';
export const SR_LOADING = 'Loading commits';

/** Breakpoint order for responsive class generation */
const BREAKPOINT_ORDER: CommitListBreakpoint[] = ['base', 'sm', 'md', 'lg', 'xl', '2xl'];

// =============================================================================
// Size Classes
// =============================================================================

export const COMMIT_LIST_SIZE_CLASSES: Record<CommitListSize, string> = {
  sm: 'text-xs',
  md: 'text-sm',
  lg: 'text-base',
};

export const COMMIT_LIST_PADDING_CLASSES: Record<CommitListSize, string> = {
  sm: 'px-3 py-2',
  md: 'px-4 py-3',
  lg: 'px-5 py-4',
};

export const COMMIT_LIST_HEADER_PADDING_CLASSES: Record<CommitListSize, string> = {
  sm: 'px-3 py-1.5',
  md: 'px-4 py-2',
  lg: 'px-5 py-3',
};

export const COMMIT_LIST_GAP_CLASSES: Record<CommitListSize, string> = {
  sm: 'gap-2',
  md: 'gap-3',
  lg: 'gap-4',
};

export const COMMIT_LIST_ICON_SIZE_MAP: Record<CommitListSize, 'xs' | 'sm' | 'md'> = {
  sm: 'xs',
  md: 'sm',
  lg: 'md',
};

export const COMMIT_LIST_BUTTON_SIZE_MAP: Record<CommitListSize, 'sm' | 'md' | 'lg'> = {
  sm: 'sm',
  md: 'sm',
  lg: 'md',
};

// =============================================================================
// Base Classes
// =============================================================================

export const COMMIT_LIST_BASE_CLASSES = 'flex flex-col bg-[rgb(var(--background))]';

export const COMMIT_LIST_HEADER_CLASSES = cn(
  'flex items-center justify-between',
  'border-b border-[rgb(var(--border))]'
);

export const COMMIT_LIST_CONTENT_CLASSES = 'flex-1 overflow-y-auto scrollbar-thin';

export const COMMIT_ROW_BASE_CLASSES = cn(
  'flex flex-col',
  'border-b border-[rgb(var(--border))]',
  'last:border-b-0'
);

export const COMMIT_ROW_BUTTON_CLASSES = cn(
  'flex items-start w-full text-left',
  'hover:bg-[rgb(var(--muted))]',
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--ring))] focus-visible:ring-offset-2',
  'motion-safe:transition-colors motion-safe:duration-150',
  // Touch target ≥44px on mobile (WCAG 2.5.5)
  'min-h-[44px]'
);

export const COMMIT_ROW_EXPANDED_CLASSES = 'bg-[rgb(var(--muted))]/50';

export const COMMIT_DETAILS_CLASSES = cn(
  'border-t border-[rgb(var(--border))]',
  'bg-[rgb(var(--muted))]/30'
);

export const COMMIT_HASH_CLASSES = cn('font-mono bg-[rgb(var(--muted))] px-1.5 py-0.5 rounded');

export const SKELETON_ROW_CLASSES = cn(
  'flex items-center gap-3 p-4',
  'border-b border-[rgb(var(--border))]',
  'last:border-b-0'
);

export const ERROR_STATE_CLASSES = cn(
  'flex flex-col items-center justify-center py-12',
  'text-center'
);

// =============================================================================
// Utility Functions
// =============================================================================

/**
 * Get base size from responsive value
 */
export function getBaseSize(size: ResponsiveValue<CommitListSize>): CommitListSize {
  if (typeof size === 'string') {
    return size;
  }
  if (typeof size === 'object' && size !== null) {
    return (size as Partial<Record<CommitListBreakpoint, CommitListSize>>).base ?? 'md';
  }
  return 'md';
}

/**
 * Generate responsive classes from size prop
 */
export function getResponsiveSizeClasses(
  size: ResponsiveValue<CommitListSize>,
  classMap: Record<CommitListSize, string>
): string[] {
  const classes: string[] = [];

  if (typeof size === 'string') {
    const classValue = classMap[size];
    classes.push(...classValue.split(' '));
  } else if (typeof size === 'object' && size !== null) {
    for (const breakpoint of BREAKPOINT_ORDER) {
      const sizeValue = (size as Partial<Record<CommitListBreakpoint, CommitListSize>>)[breakpoint];
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
 * Format a date string to a human-readable relative time
 */
export function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffWeeks = Math.floor(diffDays / 7);
  const diffMonths = Math.floor(diffDays / 30);

  if (diffSecs < 60) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffWeeks < 4) return `${diffWeeks}w ago`;
  if (diffMonths < 12) return `${diffMonths}mo ago`;
  return date.toLocaleDateString();
}

/**
 * Format a full date for display and screen readers
 */
export function formatFullDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleString();
}

/**
 * Format a date for screen readers with more context
 */
export function formatDateForSR(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleString(undefined, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
  });
}

/**
 * Get ISO date string for datetime attribute
 */
export function getISODateTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toISOString();
}

/**
 * Build accessible label for commit row
 */
export function buildCommitAccessibleLabel(commit: Commit, isExpanded: boolean): string {
  const action = isExpanded ? 'Collapse' : 'Expand';
  const stats = `${commit.filesChanged} files changed, ${commit.additions} additions, ${commit.deletions} deletions`;
  return `${action} commit ${commit.shortHash}: ${commit.message}. By ${commit.author}, ${formatRelativeTime(commit.date)}. ${stats}`;
}

/**
 * Build screen reader announcement for stats
 */
export function buildStatsAnnouncement(
  filesChanged: number,
  additions: number,
  deletions: number
): string {
  const files = `${filesChanged} ${filesChanged === 1 ? 'file' : 'files'} changed`;
  const adds = `${additions} ${additions === 1 ? 'addition' : 'additions'}`;
  const dels = `${deletions} ${deletions === 1 ? 'deletion' : 'deletions'}`;
  return `${files}, ${adds}, ${dels}`;
}

/**
 * Build screen reader announcement for total summary
 */
export function buildSummaryAnnouncement(
  commitCount: number,
  filesChanged: number,
  additions: number,
  deletions: number
): string {
  const commits = `${commitCount} ${commitCount === 1 ? 'commit' : 'commits'}`;
  const files = `${filesChanged} ${filesChanged === 1 ? 'file' : 'files'} changed total`;
  return `${commits}, ${files}, ${additions} total additions, ${deletions} total deletions`;
}

// =============================================================================
// Sub-Components
// =============================================================================

/**
 * Render commit statistics (files changed, additions, deletions)
 */
const CommitStats = forwardRef<HTMLDivElement, CommitStatsProps>(function CommitStats(
  { filesChanged, additions, deletions, size },
  ref
) {
  const iconSize = COMMIT_LIST_ICON_SIZE_MAP[size];

  return (
    <Flex ref={ref} align="center" gap={size === 'sm' ? '2' : '3'}>
      <VisuallyHidden>{buildStatsAnnouncement(filesChanged, additions, deletions)}</VisuallyHidden>

      <div
        className="flex items-center gap-1 text-[rgb(var(--muted-foreground))]"
        aria-hidden="true"
      >
        <Icon icon={FileDiff} size={iconSize} />
        <Text size={size === 'sm' ? 'xs' : 'sm'}>
          {filesChanged} {filesChanged === 1 ? 'file' : 'files'}
        </Text>
      </div>

      {additions > 0 && (
        <div className="flex items-center gap-0.5 text-addition" aria-hidden="true">
          <Icon icon={Plus} size={iconSize} />
          <Text size={size === 'sm' ? 'xs' : 'sm'}>{additions}</Text>
        </div>
      )}

      {deletions > 0 && (
        <div className="flex items-center gap-0.5 text-deletion" aria-hidden="true">
          <Icon icon={Minus} size={iconSize} />
          <Text size={size === 'sm' ? 'xs' : 'sm'}>{deletions}</Text>
        </div>
      )}
    </Flex>
  );
});

CommitStats.displayName = 'CommitStats';

/**
 * Render commit details (expanded view)
 */
const CommitDetails = forwardRef<HTMLDivElement, CommitDetailsProps>(function CommitDetails(
  { commit, onViewCommit, size, detailsId },
  ref
) {
  const iconSize = COMMIT_LIST_ICON_SIZE_MAP[size];
  const buttonSize = COMMIT_LIST_BUTTON_SIZE_MAP[size];
  const paddingClasses = COMMIT_LIST_PADDING_CLASSES[size];

  return (
    <div
      ref={ref}
      id={detailsId}
      className={cn(COMMIT_DETAILS_CLASSES, paddingClasses)}
      role="region"
      aria-label={`Details for commit ${commit.shortHash}`}
    >
      <Flex direction="column" gap={size === 'sm' ? '1' : '2'}>
        {/* Author info */}
        <Flex align="center" gap="2" className="text-[rgb(var(--muted-foreground))]">
          <Icon icon={User} size={iconSize} aria-hidden="true" />
          <Text size={size === 'sm' ? 'xs' : 'sm'}>
            {commit.author} {'<'}
            {commit.authorEmail}
            {'>'}
          </Text>
        </Flex>

        {/* Full commit hash */}
        <Flex align="center" gap="2" className="text-[rgb(var(--muted-foreground))]">
          <Icon icon={GitCommit} size={iconSize} aria-hidden="true" />
          <code className={cn(COMMIT_HASH_CLASSES, size === 'sm' ? 'text-[10px]' : 'text-xs')}>
            {commit.hash}
          </code>
        </Flex>

        {/* Date */}
        <Flex align="center" gap="2" className="text-[rgb(var(--muted-foreground))]">
          <Icon icon={Clock} size={iconSize} aria-hidden="true" />
          <time dateTime={getISODateTime(commit.date)} aria-label={formatDateForSR(commit.date)}>
            <Text size={size === 'sm' ? 'xs' : 'sm'}>{formatFullDate(commit.date)}</Text>
          </time>
        </Flex>

        {/* View diff button */}
        {onViewCommit && (
          <div className="mt-2">
            <Button
              variant="primary"
              size={buttonSize}
              onClick={(e) => {
                e.stopPropagation();
                onViewCommit(commit.hash);
              }}
              aria-label={`${DEFAULT_VIEW_CHANGES_LABEL} for commit ${commit.shortHash}`}
            >
              {DEFAULT_VIEW_CHANGES_LABEL}
            </Button>
          </div>
        )}
      </Flex>
    </div>
  );
});

CommitDetails.displayName = 'CommitDetails';

/**
 * Render a single commit row
 */
const CommitRow = forwardRef<HTMLDivElement, CommitRowProps>(function CommitRow(
  { commit, isExpanded, onToggle, onViewCommit, size, rowId, detailsId },
  ref
) {
  const iconSize = COMMIT_LIST_ICON_SIZE_MAP[size];
  const paddingClasses = COMMIT_LIST_PADDING_CLASSES[size];
  const gapClasses = COMMIT_LIST_GAP_CLASSES[size];
  const [announced, setAnnounced] = useState(false);

  const handleToggle = useCallback(() => {
    onToggle();
    setAnnounced(true);
    // Reset announcement after a delay
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
    <div ref={ref} className={COMMIT_ROW_BASE_CLASSES} data-commit-hash={commit.hash}>
      {/* Screen reader announcement */}
      {announced && (
        <VisuallyHidden>
          <Text as="span" aria-live="polite">
            {isExpanded ? SR_COMMIT_EXPANDED : SR_COMMIT_COLLAPSED}
          </Text>
        </VisuallyHidden>
      )}

      {/* Commit header button */}
      <button
        type="button"
        id={rowId}
        className={cn(
          COMMIT_ROW_BUTTON_CLASSES,
          paddingClasses,
          gapClasses,
          isExpanded && COMMIT_ROW_EXPANDED_CLASSES
        )}
        onClick={handleToggle}
        onKeyDown={handleKeyDown}
        aria-expanded={isExpanded}
        aria-controls={detailsId}
        aria-label={buildCommitAccessibleLabel(commit, isExpanded)}
      >
        {/* Expand/collapse chevron */}
        <Icon
          icon={isExpanded ? ChevronDown : ChevronRight}
          size={iconSize}
          className="text-[rgb(var(--muted-foreground))] flex-shrink-0 mt-0.5"
          aria-hidden="true"
        />

        {/* Commit icon and hash */}
        <Flex align="center" gap="2" className="flex-shrink-0">
          <Icon
            icon={GitCommit}
            size={iconSize}
            className="text-[rgb(var(--primary))]"
            aria-hidden="true"
          />
          <code
            className={cn(
              'font-mono text-[rgb(var(--primary))]',
              size === 'sm' ? 'text-[10px]' : 'text-xs'
            )}
          >
            {commit.shortHash}
          </code>
        </Flex>

        {/* Message and meta info */}
        <Flex direction="column" className="flex-1 min-w-0">
          {/* Commit message */}
          <Text
            size={size === 'sm' ? 'xs' : 'sm'}
            color="foreground"
            truncate
            className="text-left"
          >
            {commit.message}
          </Text>

          {/* Meta line: author, time, stats */}
          <Flex align="center" gap={size === 'sm' ? '2' : '4'} className="mt-1 flex-wrap">
            <Text size="xs" color="muted-foreground">
              {commit.author}
            </Text>
            <time dateTime={getISODateTime(commit.date)} aria-label={formatDateForSR(commit.date)}>
              <Text size="xs" color="muted-foreground">
                {formatRelativeTime(commit.date)}
              </Text>
            </time>
            <CommitStats
              filesChanged={commit.filesChanged}
              additions={commit.additions}
              deletions={commit.deletions}
              size={size}
            />
          </Flex>
        </Flex>
      </button>

      {/* Expanded details */}
      {isExpanded && (
        <CommitDetails
          commit={commit}
          onViewCommit={onViewCommit}
          size={size}
          detailsId={detailsId}
        />
      )}
    </div>
  );
});

CommitRow.displayName = 'CommitRow';

// =============================================================================
// Loading Skeleton
// =============================================================================

/**
 * Loading skeleton for CommitList
 */
export const CommitListSkeleton = forwardRef<HTMLDivElement, CommitListSkeletonProps>(
  function CommitListSkeleton(
    { count = DEFAULT_SKELETON_COUNT, className, size = 'md', 'data-testid': testId },
    ref
  ) {
    const baseSize = getBaseSize(size);
    const paddingClasses = COMMIT_LIST_PADDING_CLASSES[baseSize];

    return (
      <div
        ref={ref}
        className={cn(COMMIT_LIST_BASE_CLASSES, className)}
        aria-hidden="true"
        role="presentation"
        data-testid={testId}
      >
        <VisuallyHidden>
          <Text as="span" aria-live="polite">
            {SR_LOADING}
          </Text>
        </VisuallyHidden>

        {/* Header skeleton */}
        <div className={cn(COMMIT_LIST_HEADER_CLASSES, paddingClasses)}>
          <Skeleton variant="text" width={100} height={16} />
          <Flex gap="3">
            <Skeleton variant="text" width={60} height={14} />
            <Skeleton variant="text" width={40} height={14} />
            <Skeleton variant="text" width={40} height={14} />
          </Flex>
        </div>

        {/* Row skeletons */}
        {Array.from({ length: count }, (_, i) => (
          <div key={i} className={cn(SKELETON_ROW_CLASSES, paddingClasses)}>
            <Skeleton variant="circular" width={16} height={16} />
            <Skeleton variant="text" width={60} height={14} />
            <Flex direction="column" gap="1" className="flex-1">
              <Skeleton variant="text" width="80%" height={16} />
              <Flex gap="4">
                <Skeleton variant="text" width={80} height={12} />
                <Skeleton variant="text" width={50} height={12} />
                <Skeleton variant="text" width={70} height={12} />
              </Flex>
            </Flex>
          </div>
        ))}
      </div>
    );
  }
);

CommitListSkeleton.displayName = 'CommitListSkeleton';

// =============================================================================
// Error State
// =============================================================================

/**
 * Error state for CommitList
 */
export const CommitListError = forwardRef<HTMLDivElement, CommitListErrorProps>(
  function CommitListError(
    { message, onRetry, className, size = 'md', 'data-testid': testId },
    ref
  ) {
    const baseSize = getBaseSize(size);
    const buttonSize = COMMIT_LIST_BUTTON_SIZE_MAP[baseSize];

    return (
      <div
        ref={ref}
        className={cn(ERROR_STATE_CLASSES, className)}
        role="alert"
        aria-live="assertive"
        data-testid={testId}
      >
        <div className="rounded-full bg-[rgb(var(--destructive))]/10 p-3 mb-4">
          <Icon
            icon={GitCommit}
            size="lg"
            className="text-[rgb(var(--destructive))]"
            aria-hidden="true"
          />
        </div>
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
      </div>
    );
  }
);

CommitListError.displayName = 'CommitListError';

// =============================================================================
// Main Component
// =============================================================================

/**
 * CommitList component for displaying git commit history.
 * Stateless - receives all data via props, emits actions via callbacks.
 *
 * Features:
 * - Commit list with expandable details
 * - Short hash, message, author, and relative time
 * - Change statistics (files, additions, deletions)
 * - Full commit details on expand (full hash, email, exact date)
 * - Optional view diff callback
 * - Loading and empty states
 * - Full keyboard navigation support
 * - Screen reader announcements
 *
 * Accessibility:
 * - role="region" for the commit list container
 * - aria-expanded on expandable rows
 * - aria-controls linking rows to details
 * - aria-live announcements for state changes
 * - Semantic time elements with datetime attributes
 * - Touch targets ≥44px (WCAG 2.5.5)
 * - Focus visible indicators
 *
 * @example
 * <CommitList
 *   commits={commits}
 *   onViewCommit={handleViewCommit}
 * />
 *
 * @example
 * // With controlled expand/collapse
 * <CommitList
 *   commits={commits}
 *   expandedCommits={expandedSet}
 *   onCommitToggle={handleToggle}
 *   onViewCommit={handleViewCommit}
 * />
 *
 * @example
 * // Responsive sizing
 * <CommitList
 *   commits={commits}
 *   size={{ base: 'sm', md: 'md', lg: 'lg' }}
 * />
 */
export const CommitList = forwardRef<HTMLDivElement, CommitListProps>(function CommitList(
  {
    commits,
    expandedCommits,
    onCommitToggle,
    onViewCommit,
    defaultExpanded = false,
    maxHeight,
    className,
    size = 'md',
    'data-testid': testId,
    'aria-label': ariaLabel = DEFAULT_LIST_LABEL,
  },
  ref
) {
  const baseSize = getBaseSize(size);
  const listId = useId();
  const sizeClasses = getResponsiveSizeClasses(size, COMMIT_LIST_SIZE_CLASSES);
  const headerPaddingClasses = COMMIT_LIST_HEADER_PADDING_CLASSES[baseSize];

  // Determine if a commit is expanded
  const isExpanded = useCallback(
    (hash: string) => {
      if (expandedCommits !== undefined) {
        return expandedCommits.has(hash);
      }
      return defaultExpanded;
    },
    [expandedCommits, defaultExpanded]
  );

  const handleToggle = useCallback(
    (hash: string) => {
      onCommitToggle?.(hash);
    },
    [onCommitToggle]
  );

  // Calculate totals
  const totals = useMemo(() => {
    return commits.reduce(
      (acc, commit) => ({
        additions: acc.additions + commit.additions,
        deletions: acc.deletions + commit.deletions,
        filesChanged: acc.filesChanged + commit.filesChanged,
      }),
      { additions: 0, deletions: 0, filesChanged: 0 }
    );
  }, [commits]);

  // Empty state
  if (commits.length === 0) {
    return (
      <EmptyState
        icon={GitCommit}
        title={DEFAULT_EMPTY_TITLE}
        description={DEFAULT_EMPTY_DESCRIPTION}
        size={baseSize}
        className={className}
        data-testid={testId}
      />
    );
  }

  return (
    <div
      ref={ref}
      className={cn(COMMIT_LIST_BASE_CLASSES, ...sizeClasses, className)}
      style={{ maxHeight }}
      role="region"
      aria-label={ariaLabel}
      data-testid={testId}
      data-commit-count={commits.length}
      data-size={baseSize}
    >
      {/* Screen reader summary announcement */}
      <VisuallyHidden>
        <Text as="span">
          {buildSummaryAnnouncement(
            commits.length,
            totals.filesChanged,
            totals.additions,
            totals.deletions
          )}
        </Text>
      </VisuallyHidden>

      {/* Summary header */}
      <header className={cn(COMMIT_LIST_HEADER_CLASSES, headerPaddingClasses)}>
        <Text size={baseSize === 'sm' ? 'xs' : 'sm'} color="foreground">
          {commits.length} {commits.length === 1 ? 'commit' : 'commits'}
        </Text>
        <div className="flex items-center gap-3" aria-hidden="true">
          <Text size="xs" color="muted-foreground">
            {totals.filesChanged} {totals.filesChanged === 1 ? 'file' : 'files'}
          </Text>
          <Text size="xs" className="text-addition">
            +{totals.additions}
          </Text>
          <Text size="xs" className="text-deletion">
            -{totals.deletions}
          </Text>
        </div>
      </header>

      {/* Commit list */}
      <div
        className={COMMIT_LIST_CONTENT_CLASSES}
        role="list"
        aria-label={`${commits.length} ${commits.length === 1 ? 'commit' : 'commits'}`}
      >
        {commits.map((commit, index) => {
          const rowId = `${listId}-row-${index}`;
          const detailsId = `${listId}-details-${index}`;

          return (
            <div key={commit.hash} role="listitem">
              <CommitRow
                commit={commit}
                isExpanded={isExpanded(commit.hash)}
                onToggle={() => handleToggle(commit.hash)}
                onViewCommit={onViewCommit}
                size={baseSize}
                rowId={rowId}
                detailsId={detailsId}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
});

CommitList.displayName = 'CommitList';
