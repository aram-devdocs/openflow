/**
 * useExecutorProfiles - Hooks for managing executor profiles
 *
 * This module provides React Query hooks for CRUD operations on executor profiles,
 * including creating, updating, deleting, and running executors.
 *
 * Features:
 * - Full logging at DEBUG/INFO/ERROR levels
 * - Toast notifications for user feedback on mutations
 * - Proper error handling with try/catch patterns
 */

import type {
  CreateExecutorProfileRequest,
  ExecutionProcess,
  ExecutorProfile,
  UpdateExecutorProfileRequest,
} from '@openflow/generated';
import { executorProfileQueries } from '@openflow/queries';
import { createLogger } from '@openflow/utils';
import {
  type UseMutationResult,
  type UseQueryResult,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { useToast } from './useToast';

// ============================================================================
// Logger
// ============================================================================

const logger = createLogger('useExecutorProfiles');

// ============================================================================
// Query Keys
// ============================================================================

/**
 * Query key factory for executor profiles.
 * Provides structured, hierarchical keys for cache management.
 */
export const executorProfileKeys = {
  all: ['executorProfiles'] as const,
  lists: () => [...executorProfileKeys.all, 'list'] as const,
  list: () => [...executorProfileKeys.lists()] as const,
};

// ============================================================================
// Query Hooks
// ============================================================================

/**
 * Fetch all executor profiles.
 *
 * @returns Query result with array of executor profiles
 */
export function useExecutorProfiles(): UseQueryResult<ExecutorProfile[]> {
  logger.debug('useExecutorProfiles hook called');

  return useQuery({
    queryKey: executorProfileKeys.list(),
    queryFn: async () => {
      logger.debug('Fetching executor profiles');
      try {
        const profiles = await executorProfileQueries.list();
        logger.info('Executor profiles fetched successfully', {
          count: profiles.length,
          profileNames: profiles.map((p) => p.name),
        });
        return profiles;
      } catch (error) {
        logger.error('Failed to fetch executor profiles', {
          error: error instanceof Error ? error.message : String(error),
        });
        throw error;
      }
    },
  });
}

// ============================================================================
// Mutation Hooks
// ============================================================================

/**
 * Create a new executor profile.
 *
 * @returns Mutation for creating an executor profile
 */
export function useCreateExecutorProfile(): UseMutationResult<
  ExecutorProfile,
  Error,
  CreateExecutorProfileRequest
> {
  const queryClient = useQueryClient();
  const toast = useToast();

  logger.debug('useCreateExecutorProfile hook initialized');

  return useMutation({
    mutationFn: async (request: CreateExecutorProfileRequest) => {
      logger.debug('Creating executor profile', {
        name: request.name,
        command: request.command,
      });
      try {
        const profile = await executorProfileQueries.create(request);
        logger.info('Executor profile created successfully', {
          id: profile.id,
          name: profile.name,
          command: profile.command,
        });
        return profile;
      } catch (error) {
        logger.error('Failed to create executor profile', {
          name: request.name,
          command: request.command,
          error: error instanceof Error ? error.message : String(error),
        });
        throw error;
      }
    },
    onSuccess: (profile) => {
      queryClient.invalidateQueries({ queryKey: executorProfileKeys.lists() });
      toast.success('Profile created', `Executor profile "${profile.name}" created successfully`);
    },
    onError: (error, request) => {
      toast.error(
        'Failed to create profile',
        error.message || `Could not create "${request.name}"`
      );
    },
  });
}

/**
 * Update an existing executor profile.
 *
 * @returns Mutation for updating an executor profile
 */
export function useUpdateExecutorProfile(): UseMutationResult<
  ExecutorProfile,
  Error,
  { id: string; request: UpdateExecutorProfileRequest; name?: string }
> {
  const queryClient = useQueryClient();
  const toast = useToast();

  logger.debug('useUpdateExecutorProfile hook initialized');

  return useMutation({
    mutationFn: async ({ id, request }) => {
      logger.debug('Updating executor profile', {
        id,
        updates: request,
      });
      try {
        const profile = await executorProfileQueries.update(id, request);
        logger.info('Executor profile updated successfully', {
          id: profile.id,
          name: profile.name,
          command: profile.command,
        });
        return profile;
      } catch (error) {
        logger.error('Failed to update executor profile', {
          id,
          updates: request,
          error: error instanceof Error ? error.message : String(error),
        });
        throw error;
      }
    },
    onSuccess: (profile) => {
      queryClient.invalidateQueries({ queryKey: executorProfileKeys.lists() });
      toast.success('Profile updated', `Executor profile "${profile.name}" updated successfully`);
    },
    onError: (error, { name }) => {
      const profileName = name || 'profile';
      toast.error('Failed to update profile', error.message || `Could not update "${profileName}"`);
    },
  });
}

/**
 * Delete an executor profile.
 *
 * @returns Mutation for deleting an executor profile
 */
export function useDeleteExecutorProfile(): UseMutationResult<
  void,
  Error,
  { id: string; name?: string }
> {
  const queryClient = useQueryClient();
  const toast = useToast();

  logger.debug('useDeleteExecutorProfile hook initialized');

  return useMutation({
    mutationFn: async ({ id }) => {
      logger.debug('Deleting executor profile', { id });
      try {
        await executorProfileQueries.delete(id);
        logger.info('Executor profile deleted successfully', { id });
      } catch (error) {
        logger.error('Failed to delete executor profile', {
          id,
          error: error instanceof Error ? error.message : String(error),
        });
        throw error;
      }
    },
    onSuccess: (_, { name }) => {
      queryClient.invalidateQueries({ queryKey: executorProfileKeys.lists() });
      const message = name
        ? `Executor profile "${name}" deleted successfully`
        : 'Executor profile deleted successfully';
      toast.success('Profile deleted', message);
    },
    onError: (error, { name }) => {
      const profileName = name || 'profile';
      toast.error('Failed to delete profile', error.message || `Could not delete "${profileName}"`);
    },
  });
}

/**
 * Run an executor for a chat with a given prompt.
 * Starts a new process using the specified or default executor profile.
 *
 * @returns Mutation for running an executor
 *
 * @example
 * ```tsx
 * function ChatInput({ chatId }: { chatId: string }) {
 *   const runExecutor = useRunExecutor();
 *   const [processId, setProcessId] = useState<string | null>(null);
 *   const { events, isComplete } = useClaudeEvents(processId);
 *
 *   const handleSend = async (content: string) => {
 *     const process = await runExecutor.mutateAsync({
 *       chatId,
 *       prompt: content,
 *     });
 *     setProcessId(process.id);
 *   };
 *
 *   return (
 *     <div>
 *       <input onSubmit={handleSend} />
 *       {events.map(e => <EventRenderer event={e} />)}
 *     </div>
 *   );
 * }
 * ```
 */
export function useRunExecutor(): UseMutationResult<
  ExecutionProcess,
  Error,
  { chatId: string; prompt: string; executorProfileId?: string }
> {
  const toast = useToast();

  logger.debug('useRunExecutor hook initialized');

  return useMutation({
    mutationFn: async ({ chatId, prompt, executorProfileId }) => {
      logger.debug('Running executor', {
        chatId,
        promptLength: prompt.length,
        executorProfileId: executorProfileId || 'default',
      });
      try {
        const process = await executorProfileQueries.runExecutor(chatId, prompt, executorProfileId);
        logger.info('Executor started successfully', {
          processId: process.id,
          chatId,
          status: process.status,
        });
        return process;
      } catch (error) {
        logger.error('Failed to run executor', {
          chatId,
          executorProfileId: executorProfileId || 'default',
          error: error instanceof Error ? error.message : String(error),
        });
        throw error;
      }
    },
    onError: (error) => {
      toast.error('Failed to start executor', error.message || 'Could not start the AI assistant');
    },
  });
}
