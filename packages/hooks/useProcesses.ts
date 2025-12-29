import type { ExecutionProcess } from '@openflow/generated';
import { processQueries } from '@openflow/queries';
import {
  type UseMutationResult,
  type UseQueryResult,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';

/**
 * Query key factory for processes.
 * Provides structured, hierarchical keys for cache management.
 */
export const processKeys = {
  all: ['processes'] as const,
  details: () => [...processKeys.all, 'detail'] as const,
  detail: (id: string) => [...processKeys.details(), id] as const,
};

/**
 * Fetch a single execution process by ID.
 *
 * @param id - Process ID to fetch
 * @returns Query result with process data
 */
export function useProcess(id: string): UseQueryResult<ExecutionProcess> {
  return useQuery({
    queryKey: processKeys.detail(id),
    queryFn: () => processQueries.get(id),
    enabled: Boolean(id),
  });
}

/**
 * Kill a running process.
 *
 * @returns Mutation for killing a process
 */
export function useKillProcess(): UseMutationResult<ExecutionProcess, Error, string> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => processQueries.kill(id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: processKeys.detail(data.id) });
    },
  });
}

/**
 * Send input to a running process.
 *
 * @returns Mutation for sending input to a process
 */
export function useSendInput(): UseMutationResult<
  void,
  Error,
  { processId: string; input: string }
> {
  return useMutation({
    mutationFn: ({ processId, input }) => processQueries.sendInput(processId, input),
  });
}
