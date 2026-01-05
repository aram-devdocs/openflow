/**
 * Worktree Hooks
 *
 * React hooks for worktree management.
 * Wraps worktreeQueries with TanStack Query for:
 * - Automatic caching and refetching
 * - Loading and error states
 * - Cache invalidation after mutations
 *
 * @example
 * ```tsx
 * // Get worktrees for a project
 * const { data: worktrees, isLoading } = useWorktrees(projectId);
 *
 * // Get active worktree count
 * const { data: count } = useActiveWorktreeCount(projectId);
 *
 * // Merge a worktree
 * const mergeWorktree = useMergeWorktree();
 * mergeWorktree.mutate({ id: 'wt-123', repoPath: '/path/to/repo', baseBranch: 'main' });
 * ```
 */

import type { DbWorktree, DbWorktreeSummary } from '@openflow/generated';
import {
  type CreateWorktreeRequest,
  type DeleteWorktreeRequest,
  type MergeWorktreeRequest,
  worktreeQueries,
} from '@openflow/queries';
import { createLogger } from '@openflow/utils';
import {
  type UseMutationResult,
  type UseQueryResult,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';

const logger = createLogger('useWorktree');

// =============================================================================
// Query Key Factory
// =============================================================================

/**
 * Query key factory for worktrees.
 * Provides structured, hierarchical keys for cache management.
 */
export const worktreeKeys = {
  /** Root key for all worktree queries */
  all: ['worktrees'] as const,

  /** Keys for individual worktree queries */
  details: () => [...worktreeKeys.all, 'detail'] as const,
  detail: (id: string) => [...worktreeKeys.details(), id] as const,

  /** Keys for worktree-by-branch queries */
  byBranch: () => [...worktreeKeys.all, 'byBranch'] as const,
  byBranchDetail: (projectId: string, branchName: string) =>
    [...worktreeKeys.byBranch(), projectId, branchName] as const,

  /** Keys for list queries */
  lists: () => [...worktreeKeys.all, 'list'] as const,
  list: (projectId: string, includeDeleted = false) =>
    [...worktreeKeys.lists(), { projectId, includeDeleted }] as const,

  /** Keys for active worktree queries */
  active: () => [...worktreeKeys.all, 'active'] as const,
  activeList: (projectId: string) => [...worktreeKeys.active(), 'list', projectId] as const,
  activeCount: (projectId: string) => [...worktreeKeys.active(), 'count', projectId] as const,

  /** Keys for summary queries */
  summaries: () => [...worktreeKeys.all, 'summaries'] as const,
  summaryList: (projectId: string) => [...worktreeKeys.summaries(), projectId] as const,

  /** Keys for project-scoped queries (for invalidation) */
  forProject: (projectId: string) => [...worktreeKeys.all, 'project', projectId] as const,
};

// =============================================================================
// Query Hooks
// =============================================================================

/**
 * Fetch a worktree by ID.
 *
 * @param id - Worktree ID
 * @param options - Query options
 * @returns Query result with DbWorktree
 */
export function useWorktree(id: string, options?: { enabled?: boolean }): UseQueryResult<DbWorktree> {
  return useQuery({
    queryKey: worktreeKeys.detail(id),
    queryFn: () => worktreeQueries.get(id),
    enabled: Boolean(id) && options?.enabled !== false,
  });
}

/**
 * Fetch a worktree by project and branch name.
 *
 * @param projectId - Project ID
 * @param branchName - Branch name
 * @param options - Query options
 * @returns Query result with DbWorktree
 */
export function useWorktreeByBranch(
  projectId: string,
  branchName: string,
  options?: { enabled?: boolean }
): UseQueryResult<DbWorktree> {
  return useQuery({
    queryKey: worktreeKeys.byBranchDetail(projectId, branchName),
    queryFn: () => worktreeQueries.getByBranch(projectId, branchName),
    enabled: Boolean(projectId) && Boolean(branchName) && options?.enabled !== false,
  });
}

/**
 * List all worktrees for a project.
 *
 * @param projectId - Project ID
 * @param options - Query options including whether to include deleted
 * @returns Query result with array of DbWorktree
 */
export function useWorktrees(
  projectId: string,
  options?: { enabled?: boolean; includeDeleted?: boolean }
): UseQueryResult<DbWorktree[]> {
  return useQuery({
    queryKey: worktreeKeys.list(projectId, options?.includeDeleted),
    queryFn: () => worktreeQueries.list(projectId, options?.includeDeleted),
    enabled: Boolean(projectId) && options?.enabled !== false,
  });
}

/**
 * List active worktrees for a project.
 *
 * @param projectId - Project ID
 * @param options - Query options
 * @returns Query result with array of active DbWorktree
 */
export function useActiveWorktrees(
  projectId: string,
  options?: { enabled?: boolean; refetchInterval?: number }
): UseQueryResult<DbWorktree[]> {
  return useQuery({
    queryKey: worktreeKeys.activeList(projectId),
    queryFn: () => worktreeQueries.listActive(projectId),
    enabled: Boolean(projectId) && options?.enabled !== false,
    refetchInterval: options?.refetchInterval,
  });
}

/**
 * Get lightweight summaries for worktrees in a project.
 *
 * @param projectId - Project ID
 * @param options - Query options
 * @returns Query result with array of DbWorktreeSummary
 */
export function useWorktreeSummaries(
  projectId: string,
  options?: { enabled?: boolean }
): UseQueryResult<DbWorktreeSummary[]> {
  return useQuery({
    queryKey: worktreeKeys.summaryList(projectId),
    queryFn: () => worktreeQueries.listSummaries(projectId),
    enabled: Boolean(projectId) && options?.enabled !== false,
  });
}

/**
 * Count active worktrees for a project.
 *
 * @param projectId - Project ID
 * @param options - Query options
 * @returns Query result with count
 */
export function useActiveWorktreeCount(
  projectId: string,
  options?: { enabled?: boolean; refetchInterval?: number }
): UseQueryResult<number> {
  return useQuery({
    queryKey: worktreeKeys.activeCount(projectId),
    queryFn: () => worktreeQueries.countActive(projectId),
    enabled: Boolean(projectId) && options?.enabled !== false,
    refetchInterval: options?.refetchInterval,
  });
}

// =============================================================================
// Mutation Hooks
// =============================================================================

/**
 * Create a new worktree.
 *
 * @returns Mutation for creating a worktree
 *
 * @example
 * ```tsx
 * const createWorktree = useCreateWorktree();
 *
 * createWorktree.mutate({
 *   projectId: 'proj-123',
 *   branchName: 'openflow/task1/step-0',
 *   baseBranch: 'main',
 *   repoPath: '/path/to/repo',
 * });
 * ```
 */
export function useCreateWorktree(): UseMutationResult<
  DbWorktree,
  Error,
  CreateWorktreeRequest
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request) => worktreeQueries.create(request),
    onSuccess: (worktree) => {
      logger.info('Worktree created', { id: worktree.id, branchName: worktree.branchName });
      // Invalidate project-scoped queries
      queryClient.invalidateQueries({ queryKey: worktreeKeys.lists() });
      queryClient.invalidateQueries({ queryKey: worktreeKeys.active() });
      queryClient.invalidateQueries({ queryKey: worktreeKeys.summaries() });
    },
    onError: (error, variables) => {
      logger.error('Failed to create worktree', {
        projectId: variables.projectId,
        branchName: variables.branchName,
        error: error.message,
      });
    },
  });
}

/**
 * Delete a worktree.
 *
 * @returns Mutation for deleting a worktree
 */
export function useDeleteWorktree(): UseMutationResult<void, Error, DeleteWorktreeRequest> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request) => worktreeQueries.delete(request),
    onSuccess: (_data, variables) => {
      logger.info('Worktree deleted', { id: variables.id });
      // Invalidate all worktree queries
      queryClient.invalidateQueries({ queryKey: worktreeKeys.all });
    },
    onError: (error, variables) => {
      logger.error('Failed to delete worktree', {
        id: variables.id,
        error: error.message,
      });
    },
  });
}

/**
 * Merge a worktree back to its base branch.
 *
 * If merge conflicts occur, the worktree status will be set to 'conflict'.
 *
 * @returns Mutation for merging a worktree
 */
export function useMergeWorktree(): UseMutationResult<void, Error, MergeWorktreeRequest> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request) => worktreeQueries.merge(request),
    onSuccess: (_data, variables) => {
      logger.info('Worktree merged', { id: variables.id, baseBranch: variables.baseBranch });
      // Invalidate all worktree queries
      queryClient.invalidateQueries({ queryKey: worktreeKeys.all });
    },
    onError: (error, variables) => {
      logger.error('Failed to merge worktree', {
        id: variables.id,
        baseBranch: variables.baseBranch,
        error: error.message,
      });
    },
  });
}

/**
 * Resolve conflicts in a worktree.
 *
 * @returns Mutation for resolving conflicts
 */
export function useResolveWorktreeConflict(): UseMutationResult<void, Error, string> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id) => worktreeQueries.resolveConflict(id),
    onSuccess: (_data, id) => {
      logger.info('Worktree conflict resolved', { id });
      // Invalidate all worktree queries
      queryClient.invalidateQueries({ queryKey: worktreeKeys.all });
    },
    onError: (error, id) => {
      logger.error('Failed to resolve worktree conflict', {
        id,
        error: error.message,
      });
    },
  });
}

/**
 * Clean up stale worktrees.
 *
 * @returns Mutation for cleaning up stale worktrees
 */
export function useCleanupStaleWorktrees(): UseMutationResult<number, Error, string> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (projectId) => worktreeQueries.cleanupStale(projectId),
    onSuccess: (count, projectId) => {
      logger.info('Stale worktrees cleaned up', { projectId, count });
      // Invalidate all worktree queries
      queryClient.invalidateQueries({ queryKey: worktreeKeys.all });
    },
    onError: (error, projectId) => {
      logger.error('Failed to clean up stale worktrees', {
        projectId,
        error: error.message,
      });
    },
  });
}

// =============================================================================
// Re-exports
// =============================================================================

export type {
  CreateWorktreeRequest,
  DeleteWorktreeRequest,
  MergeWorktreeRequest,
} from '@openflow/queries';
