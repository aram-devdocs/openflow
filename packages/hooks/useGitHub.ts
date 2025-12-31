import type { PullRequestResult } from '@openflow/generated';
import { type CreatePullRequestInput, githubQueries } from '@openflow/queries';
import {
  type UseMutationResult,
  type UseQueryResult,
  useMutation,
  useQuery,
} from '@tanstack/react-query';

/**
 * Query key factory for GitHub operations.
 * Provides structured keys for cache management.
 */
export const githubKeys = {
  all: ['github'] as const,
  ghCliInstalled: () => [...githubKeys.all, 'ghCliInstalled'] as const,
  ghAuthStatus: () => [...githubKeys.all, 'ghAuthStatus'] as const,
};

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
  return useQuery({
    queryKey: githubKeys.ghCliInstalled(),
    queryFn: () => githubQueries.checkGhCliInstalled(),
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
export function useGhAuthStatus(): UseQueryResult<void> {
  return useQuery({
    queryKey: githubKeys.ghAuthStatus(),
    queryFn: () => githubQueries.checkGhAuthStatus(),
    staleTime: 60 * 1000, // Re-check auth status every minute
    retry: false, // Don't retry auth check failures
  });
}

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
  return useMutation({
    mutationFn: (input: CreatePullRequestInput) => githubQueries.createPullRequest(input),
  });
}
