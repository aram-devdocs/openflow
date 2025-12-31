import type { PullRequestResult } from '@openflow/generated';
import { invoke } from './utils.js';

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
   */
  createPullRequest: (input: CreatePullRequestInput): Promise<PullRequestResult> =>
    invoke('create_pull_request', { input }),

  /**
   * Check if the GitHub CLI is installed and available.
   *
   * @returns `true` if the `gh` CLI is installed and executable
   */
  checkGhCliInstalled: (): Promise<boolean> => invoke('check_gh_cli_installed', {}),

  /**
   * Check if the user is authenticated with GitHub CLI.
   *
   * @throws Error if not authenticated
   */
  checkGhAuthStatus: (): Promise<void> => invoke('check_gh_auth_status', {}),
};
