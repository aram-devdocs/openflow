import type { Commit, FileDiff } from '@openflow/generated';
import { gitQueries } from '@openflow/queries';
import { type UseQueryResult, useQuery } from '@tanstack/react-query';

/**
 * Query key factory for git operations.
 * Provides structured keys for cache management.
 */
export const gitKeys = {
  all: ['git'] as const,
  taskDiffs: () => [...gitKeys.all, 'taskDiff'] as const,
  taskDiff: (taskId: string) => [...gitKeys.taskDiffs(), taskId] as const,
  taskCommits: () => [...gitKeys.all, 'taskCommits'] as const,
  taskCommit: (taskId: string, limit?: number) =>
    [...gitKeys.taskCommits(), { taskId, limit }] as const,
};

/**
 * Options for useTaskDiff hook.
 */
export interface UseTaskDiffOptions {
  /** Whether the query should execute (default: true) */
  enabled?: boolean;
  /** Refetch interval in milliseconds (default: undefined - no auto-refetch) */
  refetchInterval?: number;
  /** Stale time in milliseconds (default: 5000) */
  staleTime?: number;
}

/**
 * Fetch git diff for a task's worktree.
 *
 * Retrieves all uncommitted changes in the task's associated worktree.
 * Useful for showing file changes in the task's Changes tab.
 *
 * @param taskId - The task ID to get diff for
 * @param options - Optional query configuration
 * @returns Query result with array of file diffs
 *
 * @example
 * ```tsx
 * // Basic usage
 * const { data: diffs } = useTaskDiff(taskId);
 *
 * // Only fetch when Changes tab is active
 * const { data: diffs } = useTaskDiff(taskId, {
 *   enabled: activeTab === 'changes',
 * });
 *
 * // With auto-refresh
 * const { data: diffs } = useTaskDiff(taskId, {
 *   refetchInterval: 5000, // Refresh every 5 seconds
 * });
 * ```
 */
export function useTaskDiff(
  taskId: string,
  options: UseTaskDiffOptions = {}
): UseQueryResult<FileDiff[]> {
  const { enabled = true, refetchInterval, staleTime = 5000 } = options;

  return useQuery({
    queryKey: gitKeys.taskDiff(taskId),
    queryFn: () => gitQueries.getTaskDiff(taskId),
    enabled: enabled && !!taskId,
    refetchInterval,
    staleTime,
  });
}

/**
 * Options for useTaskCommits hook.
 */
export interface UseTaskCommitsOptions {
  /** Whether the query should execute (default: true) */
  enabled?: boolean;
  /** Maximum number of commits to return (default: 50) */
  limit?: number;
  /** Stale time in milliseconds (default: 30000) */
  staleTime?: number;
}

/**
 * Fetch git commits for a task's worktree/branch.
 *
 * Retrieves the commit history for the task's branch.
 * Useful for showing commits in the task's Commits tab.
 *
 * @param taskId - The task ID to get commits for
 * @param options - Optional query configuration
 * @returns Query result with array of commits
 *
 * @example
 * ```tsx
 * // Basic usage
 * const { data: commits } = useTaskCommits(taskId);
 *
 * // Only fetch when Commits tab is active
 * const { data: commits } = useTaskCommits(taskId, {
 *   enabled: activeTab === 'commits',
 * });
 *
 * // With custom limit
 * const { data: commits } = useTaskCommits(taskId, { limit: 100 });
 * ```
 */
export function useTaskCommits(
  taskId: string,
  options: UseTaskCommitsOptions = {}
): UseQueryResult<Commit[]> {
  const { enabled = true, limit, staleTime = 30000 } = options;

  return useQuery({
    queryKey: gitKeys.taskCommit(taskId, limit),
    queryFn: () => gitQueries.getTaskCommits(taskId, limit),
    enabled: enabled && !!taskId,
    staleTime,
  });
}
