import type { Commit, FileDiff } from '@openflow/generated';
import { invoke } from './utils.js';

/**
 * Git query wrappers for Tauri IPC.
 * Thin wrappers around invoke() calls for git worktree and repository operations.
 */
export const gitQueries = {
  /**
   * Create a new git worktree for a chat.
   * @param chatId - The chat ID to associate with the worktree
   * @param branchName - Name for the new branch
   * @param baseBranch - Base branch to create from (e.g., 'main')
   * @returns The path to the created worktree
   */
  createWorktree: (chatId: string, branchName: string, baseBranch: string): Promise<string> =>
    invoke('create_worktree', { chatId, branchName, baseBranch }),

  /**
   * Delete a git worktree associated with a chat.
   * @param chatId - The chat ID whose worktree should be deleted
   */
  deleteWorktree: (chatId: string): Promise<void> => invoke('delete_worktree', { chatId }),

  /**
   * Get the diff for a chat's worktree.
   * @param chatId - The chat ID to get diff for
   * @returns Array of file diffs showing changes
   */
  getDiff: (chatId: string): Promise<FileDiff[]> => invoke('get_diff', { chatId }),

  /**
   * Get recent commits for a chat's worktree branch.
   * @param chatId - The chat ID to get commits for
   * @param limit - Optional maximum number of commits to return
   * @returns Array of commits
   */
  getCommits: (chatId: string, limit?: number): Promise<Commit[]> =>
    invoke('get_commits', { chatId, limit }),

  /**
   * Push a chat's branch to the remote repository.
   * @param chatId - The chat ID whose branch should be pushed
   */
  pushBranch: (chatId: string): Promise<void> => invoke('push_branch', { chatId }),

  /**
   * Get the diff for a task's worktree.
   * Resolves the task's worktree path from its associated chats.
   * @param taskId - The task ID to get diff for
   * @returns Array of file diffs showing changes
   */
  getTaskDiff: (taskId: string): Promise<FileDiff[]> => invoke('get_task_diff', { taskId }),

  /**
   * Get commits for a task's worktree/branch.
   * Resolves the task's worktree path from its associated chats.
   * @param taskId - The task ID to get commits for
   * @param limit - Optional maximum number of commits to return (default: 50)
   * @returns Array of commits, most recent first
   */
  getTaskCommits: (taskId: string, limit?: number): Promise<Commit[]> =>
    invoke('get_task_commits', { taskId, limit }),
};
