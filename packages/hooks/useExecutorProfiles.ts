import type {
  CreateExecutorProfileRequest,
  ExecutionProcess,
  ExecutorProfile,
  UpdateExecutorProfileRequest,
} from '@openflow/generated';
import { executorProfileQueries } from '@openflow/queries';
import {
  type UseMutationResult,
  type UseQueryResult,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';

/**
 * Query key factory for executor profiles.
 * Provides structured, hierarchical keys for cache management.
 */
export const executorProfileKeys = {
  all: ['executorProfiles'] as const,
  lists: () => [...executorProfileKeys.all, 'list'] as const,
  list: () => [...executorProfileKeys.lists()] as const,
};

/**
 * Fetch all executor profiles.
 *
 * @returns Query result with array of executor profiles
 */
export function useExecutorProfiles(): UseQueryResult<ExecutorProfile[]> {
  return useQuery({
    queryKey: executorProfileKeys.list(),
    queryFn: () => executorProfileQueries.list(),
  });
}

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

  return useMutation({
    mutationFn: (request: CreateExecutorProfileRequest) => executorProfileQueries.create(request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: executorProfileKeys.lists() });
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
  { id: string; request: UpdateExecutorProfileRequest }
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, request }) => executorProfileQueries.update(id, request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: executorProfileKeys.lists() });
    },
  });
}

/**
 * Delete an executor profile.
 *
 * @returns Mutation for deleting an executor profile
 */
export function useDeleteExecutorProfile(): UseMutationResult<void, Error, string> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => executorProfileQueries.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: executorProfileKeys.lists() });
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
  return useMutation({
    mutationFn: ({ chatId, prompt, executorProfileId }) =>
      executorProfileQueries.runExecutor(chatId, prompt, executorProfileId),
  });
}
