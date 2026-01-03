/**
 * useGitHub - Hooks for GitHub CLI operations
 *
 * This module provides React Query hooks for GitHub-related operations,
 * including checking CLI installation, authentication status, and creating PRs.
 *
 * Features:
 * - Full logging at DEBUG/INFO/ERROR levels
 * - Toast notifications for user feedback on mutations
 * - Proper error handling with try/catch patterns
 */

import type { AuthStatusResponse, PullRequestResult } from '@openflow/generated';
import { type CreatePullRequestInput, githubQueries } from '@openflow/queries';
import { createLogger } from '@openflow/utils';
import {
  type UseMutationResult,
  type UseQueryResult,
  useMutation,
  useQuery,
} from '@tanstack/react-query';
import { useToast } from './useToast';

// ============================================================================
// Logger
// ============================================================================

const logger = createLogger('useGitHub');

// ============================================================================
// Query Keys
// ============================================================================

/**
 * Query key factory for GitHub operations.
 * Provides structured keys for cache management.
 */
export const githubKeys = {
  all: ['github'] as const,
  ghCliInstalled: () => [...githubKeys.all, 'ghCliInstalled'] as const,
  ghAuthStatus: () => [...githubKeys.all, 'ghAuthStatus'] as const,
};

// ============================================================================
// Query Hooks
// ============================================================================

/**
 * Check if the GitHub CLI is installed.
 *
 * Returns whether the `gh` CLI is installed and executable on the system.
 * This is useful for determining whether to show GitHub-related features.
 *
 * @returns Query result with boolean indicating if gh CLI is installed
 *
 * @example
 * ```tsx
 * function GitHubIntegration() {
 *   const { data: isInstalled } = useGhCliInstalled();
 *
 *   if (!isInstalled) {
 *     return <p>Install GitHub CLI to enable PR creation</p>;
 *   }
 *
 *   return <CreatePRButton />;
 * }
 * ```
 */
export function useGhCliInstalled(): UseQueryResult<boolean> {
  logger.debug('useGhCliInstalled hook called');

  return useQuery({
    queryKey: githubKeys.ghCliInstalled(),
    queryFn: async () => {
      logger.debug('Checking if GitHub CLI is installed');
      try {
        const isInstalled = await githubQueries.checkGhCliInstalled();
        logger.info('GitHub CLI installation check complete', {
          isInstalled,
        });
        return isInstalled;
      } catch (error) {
        logger.error('Failed to check GitHub CLI installation', {
          error: error instanceof Error ? error.message : String(error),
        });
        throw error;
      }
    },
    staleTime: Number.POSITIVE_INFINITY, // CLI installation won't change during session
  });
}

/**
 * Check if the user is authenticated with GitHub CLI.
 *
 * Returns success if authenticated, error if not.
 * This is useful for prompting the user to authenticate before PR operations.
 *
 * @returns Query result with void on success, error if not authenticated
 *
 * @example
 * ```tsx
 * function GitHubAuth() {
 *   const { isError, error } = useGhAuthStatus();
 *
 *   if (isError) {
 *     return (
 *       <div>
 *         <p>Not authenticated: {error.message}</p>
 *         <p>Run `gh auth login` to authenticate</p>
 *       </div>
 *     );
 *   }
 *
 *   return <p>Authenticated with GitHub</p>;
 * }
 * ```
 */
export function useGhAuthStatus(): UseQueryResult<AuthStatusResponse> {
  logger.debug('useGhAuthStatus hook called');

  return useQuery({
    queryKey: githubKeys.ghAuthStatus(),
    queryFn: async () => {
      logger.debug('Checking GitHub CLI authentication status');
      try {
        const result = await githubQueries.checkGhAuthStatus();
        logger.info('GitHub CLI authentication check passed', {
          authenticated: result.authenticated,
        });
        return result;
      } catch (error) {
        logger.warn('GitHub CLI authentication check failed', {
          error: error instanceof Error ? error.message : String(error),
        });
        throw error;
      }
    },
    staleTime: 60 * 1000, // Re-check auth status every minute
    retry: false, // Don't retry auth check failures
  });
}

// ============================================================================
// Mutation Hooks
// ============================================================================

/**
 * Create a pull request for a task.
 *
 * Uses the GitHub CLI to create a PR from the task's worktree branch.
 * This will push the branch to the remote and create the PR.
 *
 * @returns Mutation for creating a pull request
 *
 * @example
 * ```tsx
 * function CreatePRButton({ taskId }: { taskId: string }) {
 *   const createPR = useCreatePullRequest();
 *
 *   const handleCreatePR = async () => {
 *     try {
 *       const result = await createPR.mutateAsync({
 *         taskId,
 *         title: 'Add new feature',
 *         body: 'This PR adds...',
 *       });
 *       console.log('PR created:', result.url);
 *       window.open(result.url, '_blank');
 *     } catch (error) {
 *       console.error('Failed to create PR:', error);
 *     }
 *   };
 *
 *   return (
 *     <button
 *       onClick={handleCreatePR}
 *       disabled={createPR.isPending}
 *     >
 *       {createPR.isPending ? 'Creating PR...' : 'Create Pull Request'}
 *     </button>
 *   );
 * }
 * ```
 */
export function useCreatePullRequest(): UseMutationResult<
  PullRequestResult,
  Error,
  CreatePullRequestInput
> {
  const toast = useToast();

  logger.debug('useCreatePullRequest hook initialized');

  return useMutation({
    mutationFn: async (input: CreatePullRequestInput) => {
      logger.debug('Creating pull request', {
        taskId: input.taskId,
        title: input.title,
        hasBody: Boolean(input.body),
      });
      try {
        const result = await githubQueries.createPullRequest(input);
        logger.info('Pull request created successfully', {
          taskId: input.taskId,
          prNumber: result.number,
          prUrl: result.url,
        });
        return result;
      } catch (error) {
        logger.error('Failed to create pull request', {
          taskId: input.taskId,
          title: input.title,
          error: error instanceof Error ? error.message : String(error),
        });
        throw error;
      }
    },
    onSuccess: (data, input) => {
      toast.success(
        'Pull Request Created',
        `PR #${data.number} "${input.title}" has been created.`
      );
    },
    onError: (error) => {
      toast.error(
        'Failed to Create Pull Request',
        error instanceof Error ? error.message : 'Please try again.'
      );
    },
  });
}
