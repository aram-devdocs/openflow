import { useCallback, useMemo } from 'react';
import type { Commit } from '@openflow/generated';
import { cn } from '@openflow/utils';
import {
  ChevronDown,
  ChevronRight,
  GitCommit,
  User,
  Clock,
  FileDiff,
  Plus,
  Minus,
} from 'lucide-react';
import { Icon } from '../atoms/Icon';

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
}

/**
 * Format a date string to a human-readable relative time
 */
function formatRelativeTime(dateString: string): string {
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
 * Format a full date for tooltip display
 */
function formatFullDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleString();
}

/**
 * Render commit statistics (files changed, additions, deletions)
 */
function CommitStats({
  filesChanged,
  additions,
  deletions,
}: {
  filesChanged: number;
  additions: number;
  deletions: number;
}) {
  return (
    <div className="flex items-center gap-3 text-xs">
      <span className="flex items-center gap-1 text-[rgb(var(--muted-foreground))]">
        <Icon icon={FileDiff} size="sm" />
        {filesChanged} {filesChanged === 1 ? 'file' : 'files'}
      </span>
      {additions > 0 && (
        <span className="flex items-center gap-0.5 text-green-400">
          <Icon icon={Plus} size="sm" />
          {additions}
        </span>
      )}
      {deletions > 0 && (
        <span className="flex items-center gap-0.5 text-red-400">
          <Icon icon={Minus} size="sm" />
          {deletions}
        </span>
      )}
    </div>
  );
}

/**
 * Render commit details (expanded view)
 */
function CommitDetails({
  commit,
  onViewCommit,
}: {
  commit: Commit;
  onViewCommit?: (hash: string) => void;
}) {
  return (
    <div className="px-4 py-3 border-t border-[rgb(var(--border))] bg-[rgb(var(--muted))]/30">
      <div className="space-y-2 text-sm">
        {/* Author info */}
        <div className="flex items-center gap-2 text-[rgb(var(--muted-foreground))]">
          <Icon icon={User} size="sm" />
          <span>
            {commit.author} {'<'}
            {commit.authorEmail}
            {'>'}
          </span>
        </div>

        {/* Full commit hash */}
        <div className="flex items-center gap-2 text-[rgb(var(--muted-foreground))]">
          <Icon icon={GitCommit} size="sm" />
          <code className="font-mono text-xs bg-[rgb(var(--muted))] px-1.5 py-0.5 rounded">
            {commit.hash}
          </code>
        </div>

        {/* Date */}
        <div className="flex items-center gap-2 text-[rgb(var(--muted-foreground))]">
          <Icon icon={Clock} size="sm" />
          <span>{formatFullDate(commit.date)}</span>
        </div>

        {/* View diff button */}
        {onViewCommit && (
          <button
            type="button"
            className={cn(
              'mt-2 px-3 py-1.5 text-xs rounded',
              'bg-[rgb(var(--primary))] text-[rgb(var(--primary-foreground))]',
              'hover:bg-[rgb(var(--primary))]/90',
              'transition-colors duration-150'
            )}
            onClick={(e) => {
              e.stopPropagation();
              onViewCommit(commit.hash);
            }}
          >
            View changes
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * Render a single commit row
 */
function CommitRow({
  commit,
  isExpanded,
  onToggle,
  onViewCommit,
}: {
  commit: Commit;
  isExpanded: boolean;
  onToggle: () => void;
  onViewCommit?: (hash: string) => void;
}) {
  return (
    <div className="flex flex-col border-b border-[rgb(var(--border))] last:border-b-0">
      {/* Commit header */}
      <button
        type="button"
        className={cn(
          'flex items-start gap-3 px-4 py-3',
          'hover:bg-[rgb(var(--muted))]',
          'transition-colors duration-150',
          'text-left w-full',
          isExpanded && 'bg-[rgb(var(--muted))]/50'
        )}
        onClick={onToggle}
        aria-expanded={isExpanded}
        aria-label={`${isExpanded ? 'Collapse' : 'Expand'} commit ${commit.shortHash}`}
      >
        {/* Expand/collapse chevron */}
        <Icon
          icon={isExpanded ? ChevronDown : ChevronRight}
          size="sm"
          className="text-[rgb(var(--muted-foreground))] flex-shrink-0 mt-0.5"
        />

        {/* Commit icon and hash */}
        <div className="flex-shrink-0 flex items-center gap-2">
          <Icon
            icon={GitCommit}
            size="sm"
            className="text-[rgb(var(--primary))]"
          />
          <code className="font-mono text-xs text-[rgb(var(--primary))]">
            {commit.shortHash}
          </code>
        </div>

        {/* Message and meta info */}
        <div className="flex-1 min-w-0">
          {/* Commit message */}
          <p
            className={cn(
              'text-sm text-[rgb(var(--foreground))]',
              'truncate'
            )}
            title={commit.message}
          >
            {commit.message}
          </p>

          {/* Meta line: author, time, stats */}
          <div className="flex items-center gap-4 mt-1 flex-wrap">
            <span className="text-xs text-[rgb(var(--muted-foreground))]">
              {commit.author}
            </span>
            <span
              className="text-xs text-[rgb(var(--muted-foreground))]"
              title={formatFullDate(commit.date)}
            >
              {formatRelativeTime(commit.date)}
            </span>
            <CommitStats
              filesChanged={commit.filesChanged}
              additions={commit.additions}
              deletions={commit.deletions}
            />
          </div>
        </div>
      </button>

      {/* Expanded details */}
      {isExpanded && (
        <CommitDetails
          commit={commit}
          {...(onViewCommit && { onViewCommit })}
        />
      )}
    </div>
  );
}

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
 *
 * @example
 * <CommitList
 *   commits={commits}
 *   onViewCommit={handleViewCommit}
 * />
 *
 * @example
 * <CommitList
 *   commits={commits}
 *   expandedCommits={expandedSet}
 *   onCommitToggle={handleToggle}
 *   onViewCommit={handleViewCommit}
 * />
 */
export function CommitList({
  commits,
  expandedCommits,
  onCommitToggle,
  onViewCommit,
  defaultExpanded = false,
  maxHeight,
  className,
}: CommitListProps) {
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

  if (commits.length === 0) {
    return (
      <div
        className={cn(
          'flex flex-col items-center justify-center py-12',
          'text-[rgb(var(--muted-foreground))]',
          className
        )}
      >
        <Icon icon={GitCommit} size="lg" className="mb-3 opacity-50" />
        <p className="text-sm">No commits to display</p>
      </div>
    );
  }

  return (
    <div
      className={cn('flex flex-col', 'bg-[rgb(var(--background))]', className)}
      style={{ maxHeight }}
    >
      {/* Summary header */}
      <div className="flex items-center justify-between border-b border-[rgb(var(--border))] px-4 py-2">
        <span className="text-sm text-[rgb(var(--foreground))]">
          {commits.length} {commits.length === 1 ? 'commit' : 'commits'}
        </span>
        <div className="flex items-center gap-3 text-xs">
          <span className="text-[rgb(var(--muted-foreground))]">
            {totals.filesChanged} {totals.filesChanged === 1 ? 'file' : 'files'}
          </span>
          <span className="text-green-400">+{totals.additions}</span>
          <span className="text-red-400">-{totals.deletions}</span>
        </div>
      </div>

      {/* Commit list */}
      <div className="flex-1 overflow-y-auto">
        {commits.map((commit) => (
          <CommitRow
            key={commit.hash}
            commit={commit}
            isExpanded={isExpanded(commit.hash)}
            onToggle={() => handleToggle(commit.hash)}
            {...(onViewCommit && { onViewCommit })}
          />
        ))}
      </div>
    </div>
  );
}

CommitList.displayName = 'CommitList';
