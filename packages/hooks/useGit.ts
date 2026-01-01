/**
 * useGit - Hooks for git operations (diffs, commits)
 *
 * This module provides React Query hooks for fetching git-related data
 * for tasks, including file diffs and commit history.
 *
 * Features:
 * - Full logging at DEBUG/INFO/ERROR levels
 * - Proper error handling with try/catch patterns
 * - Structured query keys for cache management
 */

import type { Commit, FileDiff } from '@openflow/generated';
import { gitQueries } from '@openflow/queries';
import { createLogger } from '@openflow/utils';
import { type UseQueryResult, useQuery } from '@tanstack/react-query';

// ============================================================================
// Logger
// ============================================================================

const logger = createLogger('useGit');

// ============================================================================
// Query Keys
// ============================================================================

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

// ============================================================================
// Hook Options
// ============================================================================

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

// ============================================================================
// Hooks
// ============================================================================

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

  logger.debug('useTaskDiff hook called', {
    taskId,
    enabled: enabled && !!taskId,
    refetchInterval,
    staleTime,
  });

  return useQuery({
    queryKey: gitKeys.taskDiff(taskId),
    queryFn: async () => {
      logger.debug('Fetching task diff', { taskId });
      try {
        const diffs = await gitQueries.getTaskDiff(taskId);
        logger.info('Task diff fetched successfully', {
          taskId,
          fileCount: diffs.length,
          files: diffs.map((d) => d.path),
        });
        return diffs;
      } catch (error) {
        logger.error('Failed to fetch task diff', {
          taskId,
          error: error instanceof Error ? error.message : String(error),
        });
        throw error; // Re-throw for React Query to handle
      }
    },
    enabled: enabled && !!taskId,
    refetchInterval,
    staleTime,
  });
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

  logger.debug('useTaskCommits hook called', {
    taskId,
    enabled: enabled && !!taskId,
    limit,
    staleTime,
  });

  return useQuery({
    queryKey: gitKeys.taskCommit(taskId, limit),
    queryFn: async () => {
      logger.debug('Fetching task commits', { taskId, limit });
      try {
        const commits = await gitQueries.getTaskCommits(taskId, limit);
        logger.info('Task commits fetched successfully', {
          taskId,
          commitCount: commits.length,
          limit,
          // Log the first few commit hashes for debugging
          recentCommits: commits.slice(0, 3).map((c) => ({
            hash: c.hash?.substring(0, 7),
            message: c.message?.substring(0, 50),
          })),
        });
        return commits;
      } catch (error) {
        logger.error('Failed to fetch task commits', {
          taskId,
          limit,
          error: error instanceof Error ? error.message : String(error),
        });
        throw error; // Re-throw for React Query to handle
      }
    },
    enabled: enabled && !!taskId,
    staleTime,
  });
}
