/**
 * Worktree Query Functions
 *
 * Query and mutation functions for database-tracked worktrees.
 * Worktrees enable parallel execution by providing isolated working directories
 * with their own git branches.
 *
 * @example
 * ```ts
 * // List active worktrees for a project
 * const worktrees = await worktreeQueries.listActive('project-123');
 *
 * // Create a new worktree
 * const worktree = await worktreeQueries.create({
 *   projectId: 'project-123',
 *   branchName: 'openflow/task1/step-0',
 *   baseBranch: 'main',
 *   repoPath: '/path/to/repo',
 * });
 *
 * // Merge worktree back to base branch
 * await worktreeQueries.merge({
 *   id: 'worktree-123',
 *   repoPath: '/path/to/repo',
 *   baseBranch: 'main',
 * });
 * ```
 */

import type { DbWorktree, DbWorktreeSummary } from '@openflow/generated';
import { createLogger } from '@openflow/utils';
import { invoke } from './utils.js';

const logger = createLogger('queries:worktree');

// =============================================================================
// Request Types
// =============================================================================

/** Request for creating a worktree */
export interface CreateWorktreeRequest {
  projectId: string;
  branchName: string;
  baseBranch: string;
  worktreePath?: string;
  repoPath: string;
}

/** Request for deleting a worktree */
export interface DeleteWorktreeRequest {
  id: string;
  repoPath: string;
}

/** Request for merging a worktree */
export interface MergeWorktreeRequest {
  id: string;
  repoPath: string;
  baseBranch: string;
}

// =============================================================================
// Query Functions
// =============================================================================

/**
 * Worktree query wrappers for Tauri IPC.
 * These functions provide the interface to the database-tracked worktree system.
 *
 * @example
 * ```ts
 * // Get summaries for UI display
 * const summaries = await worktreeQueries.listSummaries('project-123');
 *
 * // Check active worktree count
 * const count = await worktreeQueries.countActive('project-123');
 *
 * // Clean up stale worktrees
 * const cleaned = await worktreeQueries.cleanupStale('project-123');
 * ```
 */
export const worktreeQueries = {
  // ===========================================================================
  // Read Operations
  // ===========================================================================

  /**
   * Get a worktree by ID.
   *
   * @param id - Worktree ID
   * @returns Promise resolving to the worktree
   * @throws Error if worktree not found
   */
  get: async (id: string): Promise<DbWorktree> => {
    logger.debug('Getting worktree', { id });

    try {
      const result = await invoke<DbWorktree>('get_db_worktree', { id });

      logger.debug('Worktree retrieved', {
        id: result.id,
        branchName: result.branchName,
        status: result.status,
      });

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Failed to get worktree', { id, error: errorMessage });
      throw error;
    }
  },

  /**
   * Get a worktree by project and branch name.
   *
   * @param projectId - Project ID
   * @param branchName - Branch name
   * @returns Promise resolving to the worktree
   * @throws Error if worktree not found
   */
  getByBranch: async (projectId: string, branchName: string): Promise<DbWorktree> => {
    logger.debug('Getting worktree by branch', { projectId, branchName });

    try {
      const result = await invoke<DbWorktree>('get_db_worktree_by_branch', {
        projectId,
        branchName,
      });

      logger.debug('Worktree retrieved by branch', {
        id: result.id,
        branchName: result.branchName,
        status: result.status,
      });

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Failed to get worktree by branch', { projectId, branchName, error: errorMessage });
      throw error;
    }
  },

  /**
   * List all worktrees for a project.
   *
   * @param projectId - Project ID
   * @param includeDeleted - Whether to include deleted worktrees (default: false)
   * @returns Promise resolving to array of worktrees
   */
  list: async (projectId: string, includeDeleted = false): Promise<DbWorktree[]> => {
    logger.debug('Listing worktrees', { projectId, includeDeleted });

    try {
      const worktrees = await invoke<DbWorktree[]>('list_db_worktrees', {
        projectId,
        includeDeleted,
      });

      logger.debug('Worktrees listed', {
        projectId,
        count: worktrees.length,
      });

      return worktrees;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Failed to list worktrees', { projectId, error: errorMessage });
      throw error;
    }
  },

  /**
   * List active worktrees for a project.
   *
   * @param projectId - Project ID
   * @returns Promise resolving to array of active worktrees
   */
  listActive: async (projectId: string): Promise<DbWorktree[]> => {
    logger.debug('Listing active worktrees', { projectId });

    try {
      const worktrees = await invoke<DbWorktree[]>('list_active_db_worktrees', { projectId });

      logger.debug('Active worktrees listed', {
        projectId,
        count: worktrees.length,
      });

      return worktrees;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Failed to list active worktrees', { projectId, error: errorMessage });
      throw error;
    }
  },

  /**
   * Get lightweight summaries for worktrees in a project.
   *
   * Use this for list views where full details aren't needed.
   *
   * @param projectId - Project ID
   * @returns Promise resolving to array of worktree summaries
   */
  listSummaries: async (projectId: string): Promise<DbWorktreeSummary[]> => {
    logger.debug('Listing worktree summaries', { projectId });

    try {
      const summaries = await invoke<DbWorktreeSummary[]>('list_db_worktree_summaries', {
        projectId,
      });

      logger.debug('Worktree summaries listed', {
        projectId,
        count: summaries.length,
      });

      return summaries;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Failed to list worktree summaries', { projectId, error: errorMessage });
      throw error;
    }
  },

  /**
   * Count active worktrees for a project.
   *
   * @param projectId - Project ID
   * @returns Promise resolving to the count
   */
  countActive: async (projectId: string): Promise<number> => {
    logger.debug('Counting active worktrees', { projectId });

    try {
      const count = await invoke<number>('count_active_db_worktrees', { projectId });

      logger.debug('Active worktree count', { projectId, count });

      return count;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Failed to count active worktrees', { projectId, error: errorMessage });
      throw error;
    }
  },

  // ===========================================================================
  // Write Operations
  // ===========================================================================

  /**
   * Create a new worktree.
   *
   * Creates both the database record and the git worktree on disk.
   *
   * @param request - Creation request with project, branch, and repo details
   * @returns Promise resolving to the created worktree
   */
  create: async (request: CreateWorktreeRequest): Promise<DbWorktree> => {
    logger.debug('Creating worktree', {
      projectId: request.projectId,
      branchName: request.branchName,
      baseBranch: request.baseBranch,
    });

    try {
      const worktree = await invoke<DbWorktree>('create_db_worktree', {
        projectId: request.projectId,
        branchName: request.branchName,
        baseBranch: request.baseBranch,
        worktreePath: request.worktreePath,
        repoPath: request.repoPath,
      });

      logger.info('Worktree created', {
        id: worktree.id,
        branchName: worktree.branchName,
        path: worktree.path,
      });

      return worktree;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Failed to create worktree', {
        projectId: request.projectId,
        branchName: request.branchName,
        error: errorMessage,
      });
      throw error;
    }
  },

  /**
   * Delete a worktree.
   *
   * Removes the worktree from disk and marks the database record as deleted.
   *
   * @param request - Deletion request with worktree ID and repo path
   * @returns Promise resolving when deletion is complete
   */
  delete: async (request: DeleteWorktreeRequest): Promise<void> => {
    logger.debug('Deleting worktree', { id: request.id });

    try {
      await invoke<void>('delete_db_worktree', {
        id: request.id,
        repoPath: request.repoPath,
      });

      logger.info('Worktree deleted', { id: request.id });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Failed to delete worktree', { id: request.id, error: errorMessage });
      throw error;
    }
  },

  /**
   * Merge a worktree back to its base branch.
   *
   * If merge conflicts occur, the worktree status will be set to 'conflict'.
   *
   * @param request - Merge request with worktree ID, repo path, and base branch
   * @returns Promise resolving when merge is complete
   * @throws Error with conflict details if merge conflicts occur
   */
  merge: async (request: MergeWorktreeRequest): Promise<void> => {
    logger.debug('Merging worktree', {
      id: request.id,
      baseBranch: request.baseBranch,
    });

    try {
      await invoke<void>('merge_db_worktree', {
        id: request.id,
        repoPath: request.repoPath,
        baseBranch: request.baseBranch,
      });

      logger.info('Worktree merged', {
        id: request.id,
        baseBranch: request.baseBranch,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Failed to merge worktree', {
        id: request.id,
        baseBranch: request.baseBranch,
        error: errorMessage,
      });
      throw error;
    }
  },

  /**
   * Resolve conflicts in a worktree and mark it as merged.
   *
   * Call this after manually resolving merge conflicts.
   *
   * @param id - Worktree ID
   * @returns Promise resolving when resolution is complete
   */
  resolveConflict: async (id: string): Promise<void> => {
    logger.debug('Resolving worktree conflict', { id });

    try {
      await invoke<void>('resolve_db_worktree_conflict', { id });

      logger.info('Worktree conflict resolved', { id });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Failed to resolve worktree conflict', { id, error: errorMessage });
      throw error;
    }
  },

  /**
   * Clean up stale worktrees.
   *
   * Finds worktrees that exist in the database but not on disk,
   * and marks them as deleted.
   *
   * @param projectId - Project ID
   * @returns Promise resolving to the number of worktrees cleaned up
   */
  cleanupStale: async (projectId: string): Promise<number> => {
    logger.debug('Cleaning up stale worktrees', { projectId });

    try {
      const count = await invoke<number>('cleanup_stale_db_worktrees', { projectId });

      logger.info('Stale worktrees cleaned up', { projectId, count });

      return count;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Failed to clean up stale worktrees', { projectId, error: errorMessage });
      throw error;
    }
  },
};
