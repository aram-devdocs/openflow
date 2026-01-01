import type { Commit, FileDiff } from '@openflow/generated';
import { createLogger } from '@openflow/utils';
import { invoke } from './utils.js';

/**
 * Logger for git query operations.
 * Logs at DEBUG level for query calls, INFO for successes, ERROR for failures.
 */
const logger = createLogger('queries:git');

/**
 * Git query wrappers for Tauri IPC.
 * Thin wrappers around invoke() calls for git worktree and repository operations.
 *
 * All functions include:
 * - Try/catch error handling with re-throw for React Query
 * - Logging at appropriate levels (DEBUG on call, INFO on success, ERROR on failure)
 *
 * @example
 * ```ts
 * // Create a worktree for a chat
 * const worktreePath = await gitQueries.createWorktree('chat-123', 'feature-branch', 'main');
 *
 * // Get diff for a chat's worktree
 * const diffs = await gitQueries.getDiff('chat-123');
 *
 * // Get recent commits
 * const commits = await gitQueries.getCommits('chat-123', 10);
 *
 * // Get task-level diff (aggregated from all chats)
 * const taskDiffs = await gitQueries.getTaskDiff('task-456');
 * ```
 */
export const gitQueries = {
  /**
   * Create a new git worktree for a chat.
   * @param chatId - The chat ID to associate with the worktree
   * @param branchName - Name for the new branch
   * @param baseBranch - Base branch to create from (e.g., 'main')
   * @returns The path to the created worktree
   * @throws Error if the query fails (re-thrown for React Query)
   */
  createWorktree: async (
    chatId: string,
    branchName: string,
    baseBranch: string
  ): Promise<string> => {
    logger.debug('Creating worktree', { chatId, branchName, baseBranch });

    try {
      const worktreePath = await invoke<string>('create_worktree', {
        chatId,
        branchName,
        baseBranch,
      });

      logger.info('Worktree created successfully', {
        chatId,
        branchName,
        baseBranch,
        worktreePath,
      });

      return worktreePath;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Failed to create worktree', {
        chatId,
        branchName,
        baseBranch,
        error: errorMessage,
      });
      throw error;
    }
  },

  /**
   * Delete a git worktree associated with a chat.
   * @param chatId - The chat ID whose worktree should be deleted
   * @throws Error if the query fails (re-thrown for React Query)
   */
  deleteWorktree: async (chatId: string): Promise<void> => {
    logger.debug('Deleting worktree', { chatId });

    try {
      await invoke<void>('delete_worktree', { chatId });

      logger.info('Worktree deleted successfully', { chatId });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Failed to delete worktree', {
        chatId,
        error: errorMessage,
      });
      throw error;
    }
  },

  /**
   * Get the diff for a chat's worktree.
   * @param chatId - The chat ID to get diff for
   * @returns Array of file diffs showing changes
   * @throws Error if the query fails (re-thrown for React Query)
   */
  getDiff: async (chatId: string): Promise<FileDiff[]> => {
    logger.debug('Getting diff', { chatId });

    try {
      const diffs = await invoke<FileDiff[]>('get_diff', { chatId });

      logger.info('Diff retrieved successfully', {
        chatId,
        fileCount: diffs.length,
        files: diffs.slice(0, 5).map((d) => d.path),
        hasMore: diffs.length > 5,
      });

      return diffs;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Failed to get diff', {
        chatId,
        error: errorMessage,
      });
      throw error;
    }
  },

  /**
   * Get recent commits for a chat's worktree branch.
   * @param chatId - The chat ID to get commits for
   * @param limit - Optional maximum number of commits to return
   * @returns Array of commits
   * @throws Error if the query fails (re-thrown for React Query)
   */
  getCommits: async (chatId: string, limit?: number): Promise<Commit[]> => {
    logger.debug('Getting commits', { chatId, limit });

    try {
      const commits = await invoke<Commit[]>('get_commits', { chatId, limit });

      logger.info('Commits retrieved successfully', {
        chatId,
        commitCount: commits.length,
        limit,
        recentCommits: commits.slice(0, 3).map((c) => ({
          hash: c.hash?.substring(0, 7),
          message: c.message?.substring(0, 50),
        })),
      });

      return commits;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Failed to get commits', {
        chatId,
        limit,
        error: errorMessage,
      });
      throw error;
    }
  },

  /**
   * Push a chat's branch to the remote repository.
   * @param chatId - The chat ID whose branch should be pushed
   * @throws Error if the query fails (re-thrown for React Query)
   */
  pushBranch: async (chatId: string): Promise<void> => {
    logger.debug('Pushing branch', { chatId });

    try {
      await invoke<void>('push_branch', { chatId });

      logger.info('Branch pushed successfully', { chatId });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Failed to push branch', {
        chatId,
        error: errorMessage,
      });
      throw error;
    }
  },

  /**
   * Get the diff for a task's worktree.
   * Resolves the task's worktree path from its associated chats.
   * @param taskId - The task ID to get diff for
   * @returns Array of file diffs showing changes
   * @throws Error if the query fails (re-thrown for React Query)
   */
  getTaskDiff: async (taskId: string): Promise<FileDiff[]> => {
    logger.debug('Getting task diff', { taskId });

    try {
      const diffs = await invoke<FileDiff[]>('get_task_diff', { taskId });

      logger.info('Task diff retrieved successfully', {
        taskId,
        fileCount: diffs.length,
        files: diffs.slice(0, 5).map((d) => d.path),
        hasMore: diffs.length > 5,
      });

      return diffs;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Failed to get task diff', {
        taskId,
        error: errorMessage,
      });
      throw error;
    }
  },

  /**
   * Get commits for a task's worktree/branch.
   * Resolves the task's worktree path from its associated chats.
   * @param taskId - The task ID to get commits for
   * @param limit - Optional maximum number of commits to return (default: 50)
   * @returns Array of commits, most recent first
   * @throws Error if the query fails (re-thrown for React Query)
   */
  getTaskCommits: async (taskId: string, limit?: number): Promise<Commit[]> => {
    logger.debug('Getting task commits', { taskId, limit });

    try {
      const commits = await invoke<Commit[]>('get_task_commits', { taskId, limit });

      logger.info('Task commits retrieved successfully', {
        taskId,
        commitCount: commits.length,
        limit,
        recentCommits: commits.slice(0, 3).map((c) => ({
          hash: c.hash?.substring(0, 7),
          message: c.message?.substring(0, 50),
        })),
      });

      return commits;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Failed to get task commits', {
        taskId,
        limit,
        error: errorMessage,
      });
      throw error;
    }
  },
};
