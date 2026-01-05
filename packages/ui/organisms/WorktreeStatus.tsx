/**
 * WorktreeStatus - Display and manage git worktrees for parallel execution
 *
 * This component displays the status of git worktrees for a project, including:
 * - Active worktrees with branch names and paths
 * - Merged/deleted worktrees (optional)
 * - Conflict states requiring resolution
 * - Merge and delete controls
 *
 * Architecture:
 * - Pure view layer - receives all data via props
 * - No direct data fetching - uses hooks from parent component
 * - Works with DbWorktree and DbWorktreeSummary types
 *
 * @module WorktreeStatus
 */

import type { DbWorktreeStatus, DbWorktreeSummary } from '@openflow/generated';
import { Box, Flex, Text, VisuallyHidden } from '@openflow/primitives';
import { cn } from '@openflow/utils';
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle,
  ChevronDown,
  ChevronRight,
  FolderGit,
  GitBranch,
  GitMerge,
  Loader2,
  Trash2,
  XCircle,
} from 'lucide-react';
import { type HTMLAttributes, forwardRef, useId, useState } from 'react';
import { Icon } from '../atoms/Icon';

// ============================================================================
// Types
// ============================================================================

/** Props for WorktreeStatus */
export interface WorktreeStatusProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  /** Active worktrees for the project */
  worktrees: DbWorktreeSummary[];
  /** Whether worktrees are loading */
  isLoading?: boolean;
  /** Callback when merge is requested */
  onMerge?: (worktreeId: string) => void;
  /** Callback when delete is requested */
  onDelete?: (worktreeId: string) => void;
  /** Callback when conflict resolution is requested */
  onResolveConflict?: (worktreeId: string) => void;
  /** ID of worktree currently being merged */
  mergingWorktreeId?: string;
  /** ID of worktree currently being deleted */
  deletingWorktreeId?: string;
  /** Whether to show controls (merge/delete buttons) */
  showControls?: boolean;
  /** Whether to start expanded */
  defaultExpanded?: boolean;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Test ID */
  'data-testid'?: string;
}

/** Props for WorktreeItem */
export interface WorktreeItemProps {
  worktree: DbWorktreeSummary;
  onMerge?: (worktreeId: string) => void;
  onDelete?: (worktreeId: string) => void;
  onResolveConflict?: (worktreeId: string) => void;
  isMerging?: boolean;
  isDeleting?: boolean;
  showControls?: boolean;
  size: 'sm' | 'md' | 'lg';
  'data-testid'?: string;
}

/** Props for WorktreeList */
export interface WorktreeListProps {
  worktrees: DbWorktreeSummary[];
  onMerge?: (worktreeId: string) => void;
  onDelete?: (worktreeId: string) => void;
  onResolveConflict?: (worktreeId: string) => void;
  mergingWorktreeId?: string;
  deletingWorktreeId?: string;
  showControls?: boolean;
  size: 'sm' | 'md' | 'lg';
  'data-testid'?: string;
}

// ============================================================================
// Constants
// ============================================================================

const SIZE_CLASSES = {
  sm: 'text-xs',
  md: 'text-sm',
  lg: 'text-base',
};

const GAP_CLASSES = {
  sm: 'gap-2',
  md: 'gap-3',
  lg: 'gap-4',
};

const PADDING_CLASSES = {
  sm: 'p-2',
  md: 'p-3',
  lg: 'p-4',
};

const STATUS_ICONS: Record<DbWorktreeStatus, typeof CheckCircle> = {
  active: FolderGit,
  merged: CheckCircle,
  deleted: XCircle,
  conflict: AlertTriangle,
};

const STATUS_COLORS: Record<DbWorktreeStatus, string> = {
  active: 'text-primary',
  merged: 'text-success',
  deleted: 'text-muted-foreground',
  conflict: 'text-warning',
};

const STATUS_LABELS: Record<DbWorktreeStatus, string> = {
  active: 'Active',
  merged: 'Merged',
  deleted: 'Deleted',
  conflict: 'Conflict',
};

// ============================================================================
// Sub-components
// ============================================================================

/**
 * Single worktree item display
 */
const WorktreeItem = forwardRef<HTMLDivElement, WorktreeItemProps>(
  (
    {
      worktree,
      onMerge,
      onDelete,
      onResolveConflict,
      isMerging,
      isDeleting,
      showControls,
      size,
      'data-testid': testId,
    },
    ref
  ) => {
    const StatusIcon = STATUS_ICONS[worktree.status];
    const statusColor = STATUS_COLORS[worktree.status];
    const statusLabel = STATUS_LABELS[worktree.status];
    const isActive = worktree.status === 'active';
    const hasConflict = worktree.status === 'conflict';
    const canMerge = isActive && !isMerging && !isDeleting;
    const canDelete =
      (isActive || hasConflict || worktree.status === 'merged') && !isMerging && !isDeleting;
    const canResolve = hasConflict && !isMerging && !isDeleting;

    // Extract task/step info from branch name if following OpenFlow convention
    // Format: openflow/{task_id}/step-{index}
    let taskInfo = '';
    if (worktree.branchName.startsWith('openflow/')) {
      const parts = worktree.branchName.split('/');
      if (parts.length >= 3) {
        taskInfo = `${parts[1]}/${parts[2]}`;
      }
    }

    return (
      <Flex
        ref={ref}
        direction="column"
        className={cn(
          'rounded-md border border-border bg-card',
          PADDING_CLASSES[size],
          GAP_CLASSES[size]
        )}
        data-testid={testId}
        data-worktree-id={worktree.id}
        data-status={worktree.status}
      >
        {/* Header row */}
        <Flex align="center" className={GAP_CLASSES[size]}>
          <Icon
            icon={isMerging ? Loader2 : isDeleting ? Loader2 : StatusIcon}
            className={cn(
              'h-4 w-4 flex-shrink-0',
              isMerging || isDeleting ? 'animate-spin text-primary' : statusColor
            )}
          />
          <Flex direction="column" className="min-w-0 flex-1">
            <Flex align="center" className="gap-1">
              <Icon icon={GitBranch} className="h-3 w-3 text-muted-foreground" />
              <code className={cn('font-medium truncate', SIZE_CLASSES[size])}>
                {taskInfo || worktree.branchName}
              </code>
            </Flex>
            <Text className={cn('text-muted-foreground truncate', SIZE_CLASSES[size])}>
              {worktree.path}
            </Text>
          </Flex>
          <Text className={cn('flex-shrink-0', statusColor, SIZE_CLASSES[size])}>
            {statusLabel}
          </Text>
        </Flex>

        {/* Conflict warning */}
        {hasConflict && (
          <Flex
            align="center"
            className={cn('bg-warning/10 rounded-md', PADDING_CLASSES[size], GAP_CLASSES[size])}
          >
            <Icon icon={AlertCircle} className="h-4 w-4 text-warning flex-shrink-0" />
            <Text className={cn('text-warning', SIZE_CLASSES[size])}>
              Merge conflicts detected. Please resolve manually then mark as resolved.
            </Text>
          </Flex>
        )}

        {/* Controls */}
        {showControls && (isActive || hasConflict) && (
          <Flex className={cn('border-t border-border pt-2', GAP_CLASSES[size])}>
            {canMerge && onMerge && (
              <button
                type="button"
                onClick={() => onMerge(worktree.id)}
                disabled={isMerging}
                className={cn(
                  'flex items-center gap-1 px-2 py-1 rounded-md text-xs',
                  'bg-primary/10 text-primary hover:bg-primary/20',
                  'disabled:opacity-50 disabled:cursor-not-allowed'
                )}
                aria-label={`Merge ${worktree.branchName}`}
              >
                {isMerging ? (
                  <Icon icon={Loader2} className="h-3 w-3 animate-spin" />
                ) : (
                  <Icon icon={GitMerge} className="h-3 w-3" />
                )}
                <Text as="span">Merge</Text>
              </button>
            )}
            {canResolve && onResolveConflict && (
              <button
                type="button"
                onClick={() => onResolveConflict(worktree.id)}
                className={cn(
                  'flex items-center gap-1 px-2 py-1 rounded-md text-xs',
                  'bg-warning/10 text-warning hover:bg-warning/20'
                )}
                aria-label={`Mark ${worktree.branchName} conflicts as resolved`}
              >
                <Icon icon={CheckCircle} className="h-3 w-3" />
                <Text as="span">Mark Resolved</Text>
              </button>
            )}
            {canDelete && onDelete && (
              <button
                type="button"
                onClick={() => onDelete(worktree.id)}
                disabled={isDeleting}
                className={cn(
                  'flex items-center gap-1 px-2 py-1 rounded-md text-xs ml-auto',
                  'bg-destructive/10 text-destructive hover:bg-destructive/20',
                  'disabled:opacity-50 disabled:cursor-not-allowed'
                )}
                aria-label={`Delete ${worktree.branchName}`}
              >
                {isDeleting ? (
                  <Icon icon={Loader2} className="h-3 w-3 animate-spin" />
                ) : (
                  <Icon icon={Trash2} className="h-3 w-3" />
                )}
                <Text as="span">Delete</Text>
              </button>
            )}
          </Flex>
        )}

        {/* Merged timestamp */}
        {worktree.status === 'merged' && worktree.mergedAt && (
          <Text className={cn('text-muted-foreground', SIZE_CLASSES[size])}>
            Merged at {new Date(worktree.mergedAt).toLocaleString()}
          </Text>
        )}
      </Flex>
    );
  }
);

WorktreeItem.displayName = 'WorktreeItem';

/**
 * List of worktrees
 */
export const WorktreeList = forwardRef<HTMLDivElement, WorktreeListProps>(
  (
    {
      worktrees,
      onMerge,
      onDelete,
      onResolveConflict,
      mergingWorktreeId,
      deletingWorktreeId,
      showControls,
      size,
      'data-testid': testId,
    },
    ref
  ) => {
    if (worktrees.length === 0) {
      return (
        <Box
          ref={ref}
          className={cn(
            'flex items-center justify-center py-8 text-muted-foreground',
            SIZE_CLASSES[size]
          )}
          role="status"
          data-testid={testId}
        >
          <Icon icon={FolderGit} className="mr-2 h-4 w-4" />
          <Text>No worktrees</Text>
        </Box>
      );
    }

    return (
      <Flex
        ref={ref}
        direction="column"
        className={GAP_CLASSES[size]}
        role="list"
        aria-label="Worktrees"
        data-testid={testId}
        data-worktree-count={worktrees.length}
      >
        {worktrees.map((worktree, index) => (
          <WorktreeItem
            key={worktree.id}
            worktree={worktree}
            onMerge={onMerge}
            onDelete={onDelete}
            onResolveConflict={onResolveConflict}
            isMerging={mergingWorktreeId === worktree.id}
            isDeleting={deletingWorktreeId === worktree.id}
            showControls={showControls}
            size={size}
            data-testid={testId ? `${testId}-item-${index}` : undefined}
          />
        ))}
      </Flex>
    );
  }
);

WorktreeList.displayName = 'WorktreeList';

/**
 * Empty state when no worktrees
 */
const WorktreeStatusEmpty = forwardRef<HTMLDivElement, { size: 'sm' | 'md' | 'lg' }>(
  ({ size }, ref) => {
    return (
      <Flex
        ref={ref}
        direction="column"
        align="center"
        justify="center"
        className={cn('py-8 text-muted-foreground', SIZE_CLASSES[size])}
        role="status"
      >
        <Icon icon={FolderGit} className="h-8 w-8 mb-2" />
        <Text>No active worktrees</Text>
        <Text className="text-xs mt-1">Worktrees are created for parallel task execution</Text>
      </Flex>
    );
  }
);

WorktreeStatusEmpty.displayName = 'WorktreeStatusEmpty';

/**
 * Loading state
 */
const WorktreeStatusLoading = forwardRef<HTMLDivElement, { size: 'sm' | 'md' | 'lg' }>(
  ({ size }, ref) => {
    return (
      <Flex
        ref={ref}
        align="center"
        justify="center"
        className={cn('py-8', GAP_CLASSES[size])}
        role="status"
      >
        <Icon icon={Loader2} className="h-6 w-6 animate-spin text-primary" />
        <Text className={cn('text-muted-foreground', SIZE_CLASSES[size])}>
          Loading worktrees...
        </Text>
      </Flex>
    );
  }
);

WorktreeStatusLoading.displayName = 'WorktreeStatusLoading';

// ============================================================================
// Main Component
// ============================================================================

/**
 * WorktreeStatus - Display and manage git worktrees for parallel execution
 *
 * @example
 * ```tsx
 * function ProjectWorktrees({ projectId }: Props) {
 *   const { data: worktrees, isLoading } = useWorktreeSummaries(projectId);
 *   const mergeWorktree = useMergeWorktree();
 *   const deleteWorktree = useDeleteWorktree();
 *
 *   return (
 *     <WorktreeStatus
 *       worktrees={worktrees ?? []}
 *       isLoading={isLoading}
 *       onMerge={(id) => mergeWorktree.mutate({ id, repoPath, baseBranch })}
 *       onDelete={(id) => deleteWorktree.mutate({ id, repoPath })}
 *       mergingWorktreeId={mergeWorktree.isPending ? mergeWorktree.variables?.id : undefined}
 *       showControls
 *     />
 *   );
 * }
 * ```
 */
export const WorktreeStatus = forwardRef<HTMLDivElement, WorktreeStatusProps>(
  (
    {
      worktrees,
      isLoading = false,
      onMerge,
      onDelete,
      onResolveConflict,
      mergingWorktreeId,
      deletingWorktreeId,
      showControls = true,
      defaultExpanded = true,
      size = 'md',
      className,
      'data-testid': testId,
      ...props
    },
    ref
  ) => {
    const [expanded, setExpanded] = useState(defaultExpanded);
    const contentId = useId();

    // Separate active/conflict from merged/deleted
    const activeWorktrees = worktrees.filter(
      (wt) => wt.status === 'active' || wt.status === 'conflict'
    );
    const inactiveWorktrees = worktrees.filter(
      (wt) => wt.status === 'merged' || wt.status === 'deleted'
    );
    const conflictCount = worktrees.filter((wt) => wt.status === 'conflict').length;

    return (
      <Box
        ref={ref}
        className={cn('rounded-lg border border-border bg-card/50', className)}
        data-testid={testId}
        data-worktree-count={worktrees.length}
        data-active-count={activeWorktrees.length}
        data-conflict-count={conflictCount}
        {...props}
      >
        {/* Screen reader announcement */}
        <VisuallyHidden>
          <Box as="span" role="status" aria-live="polite">
            {isLoading
              ? 'Loading worktrees'
              : `${activeWorktrees.length} active worktrees${conflictCount > 0 ? `, ${conflictCount} with conflicts` : ''}`}
          </Box>
        </VisuallyHidden>

        {/* Header */}
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className={cn(
            'flex w-full items-center gap-2 text-left hover:bg-accent/50',
            expanded ? 'rounded-t-lg' : 'rounded-lg',
            PADDING_CLASSES[size]
          )}
          aria-expanded={expanded}
          aria-controls={contentId}
        >
          <Icon
            icon={expanded ? ChevronDown : ChevronRight}
            className="h-4 w-4 text-muted-foreground"
          />
          <Icon icon={FolderGit} className="h-4 w-4 text-primary" />
          <Text className={cn('font-medium', SIZE_CLASSES[size])}>Worktrees</Text>
          {activeWorktrees.length > 0 && (
            <Text className={cn('text-muted-foreground', SIZE_CLASSES[size])}>
              ({activeWorktrees.length} active)
            </Text>
          )}
          {conflictCount > 0 && (
            <Flex align="center" className="gap-1 ml-auto">
              <Icon icon={AlertTriangle} className="h-4 w-4 text-warning" />
              <Text className={cn('text-warning', SIZE_CLASSES[size])}>
                {conflictCount} conflict{conflictCount !== 1 && 's'}
              </Text>
            </Flex>
          )}
        </button>

        {/* Expanded content */}
        {expanded && (
          <Flex
            id={contentId}
            direction="column"
            className={cn('border-t border-border', PADDING_CLASSES[size], GAP_CLASSES[size])}
          >
            {isLoading ? (
              <WorktreeStatusLoading size={size} />
            ) : worktrees.length === 0 ? (
              <WorktreeStatusEmpty size={size} />
            ) : (
              <>
                {/* Active worktrees */}
                {activeWorktrees.length > 0 && (
                  <WorktreeList
                    worktrees={activeWorktrees}
                    onMerge={onMerge}
                    onDelete={onDelete}
                    onResolveConflict={onResolveConflict}
                    mergingWorktreeId={mergingWorktreeId}
                    deletingWorktreeId={deletingWorktreeId}
                    showControls={showControls}
                    size={size}
                    data-testid={testId ? `${testId}-active` : undefined}
                  />
                )}

                {/* Inactive worktrees (collapsed by default) */}
                {inactiveWorktrees.length > 0 && (
                  <Box className="border-t border-border pt-2">
                    <Text className={cn('text-muted-foreground mb-2', SIZE_CLASSES[size])}>
                      History ({inactiveWorktrees.length})
                    </Text>
                    <WorktreeList
                      worktrees={inactiveWorktrees}
                      showControls={false}
                      size={size}
                      data-testid={testId ? `${testId}-inactive` : undefined}
                    />
                  </Box>
                )}
              </>
            )}
          </Flex>
        )}
      </Box>
    );
  }
);

WorktreeStatus.displayName = 'WorktreeStatus';

// Export all sub-components
export { WorktreeItem };
