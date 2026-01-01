import type { PullRequestResult } from '@openflow/generated';
import { createLogger } from '@openflow/utils';
import { invoke } from './utils.js';

/**
 * Logger for GitHub query operations.
 * Logs at DEBUG level for query calls, INFO for successes, ERROR for failures.
 */
const logger = createLogger('queries:github');

/**
 * Input for creating a pull request.
 */
export interface CreatePullRequestInput {
  /** The task ID to create a PR for */
  taskId: string;
  /** PR title (defaults to task title if not provided) */
  title?: string;
  /** PR body/description */
  body?: string;
  /** Base branch to merge into (defaults to project's base_branch or "main") */
  base?: string;
  /** Whether to create as a draft PR */
  draft?: boolean;
}

/**
 * GitHub query wrappers for Tauri IPC.
 * Thin wrappers around invoke() calls for GitHub operations.
 *
 * All functions include:
 * - Try/catch error handling with re-throw for React Query
 * - Logging at appropriate levels (DEBUG on call, INFO on success, ERROR on failure)
 *
 * @example
 * ```ts
 * // Check if GitHub CLI is available
 * const isInstalled = await githubQueries.checkGhCliInstalled();
 *
 * // Check authentication status
 * await githubQueries.checkGhAuthStatus();
 *
 * // Create a pull request
 * const result = await githubQueries.createPullRequest({
 *   taskId: 'task-123',
 *   title: 'Add new feature',
 *   body: 'This PR adds...',
 *   draft: false,
 * });
 * console.log(`PR created: ${result.url}`);
 * ```
 */
export const githubQueries = {
  /**
   * Create a pull request for a task using the GitHub CLI.
   *
   * This will:
   * 1. Verify the GitHub CLI is installed and authenticated
   * 2. Get the task's worktree path
   * 3. Push the branch to the remote
   * 4. Create the PR using `gh pr create`
   *
   * @param input - Pull request creation options
   * @returns The result containing the PR URL, number, and branch name
   * @throws Error if the query fails (re-thrown for React Query)
   */
  createPullRequest: async (input: CreatePullRequestInput): Promise<PullRequestResult> => {
    logger.debug('Creating pull request', {
      taskId: input.taskId,
      hasTitle: !!input.title,
      hasBody: !!input.body,
      base: input.base,
      draft: input.draft,
    });

    try {
      const result = await invoke<PullRequestResult>('create_pull_request', { input });

      logger.info('Pull request created successfully', {
        taskId: input.taskId,
        prNumber: result.number,
        prUrl: result.url,
        branchName: result.branch,
        isDraft: input.draft,
      });

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Failed to create pull request', {
        taskId: input.taskId,
        title: input.title,
        base: input.base,
        draft: input.draft,
        error: errorMessage,
      });
      throw error;
    }
  },

  /**
   * Check if the GitHub CLI is installed and available.
   *
   * @returns `true` if the `gh` CLI is installed and executable
   * @throws Error if the query fails (re-thrown for React Query)
   */
  checkGhCliInstalled: async (): Promise<boolean> => {
    logger.debug('Checking if GitHub CLI is installed');

    try {
      const isInstalled = await invoke<boolean>('check_gh_cli_installed', {});

      logger.info('GitHub CLI installation check completed', {
        isInstalled,
      });

      return isInstalled;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Failed to check GitHub CLI installation', {
        error: errorMessage,
      });
      throw error;
    }
  },

  /**
   * Check if the user is authenticated with GitHub CLI.
   *
   * @throws Error if not authenticated or if the query fails (re-thrown for React Query)
   */
  checkGhAuthStatus: async (): Promise<void> => {
    logger.debug('Checking GitHub CLI authentication status');

    try {
      await invoke<void>('check_gh_auth_status', {});

      logger.info('GitHub CLI authentication check passed');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('GitHub CLI authentication check failed', {
        error: errorMessage,
      });
      throw error;
    }
  },
};
