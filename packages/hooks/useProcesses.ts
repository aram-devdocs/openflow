/**
 * useProcesses - Hooks for managing execution processes
 *
 * This module provides React Query hooks for process lifecycle management,
 * including fetching process details, killing processes, and sending input.
 *
 * Features:
 * - Full logging at DEBUG/INFO/ERROR levels
 * - Toast notifications for user feedback on mutations
 * - Proper error handling with try/catch patterns
 * - Structured query keys for cache management
 */

import type { ExecutionProcess } from '@openflow/generated';
import { processQueries } from '@openflow/queries';
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

const logger = createLogger('useProcesses');

// ============================================================================
// Query Keys
// ============================================================================

/**
 * Query key factory for processes.
 * Provides structured, hierarchical keys for cache management.
 */
export const processKeys = {
  all: ['processes'] as const,
  details: () => [...processKeys.all, 'detail'] as const,
  detail: (id: string) => [...processKeys.details(), id] as const,
};

// ============================================================================
// Hook Options
// ============================================================================

/**
 * Options for useProcess hook.
 */
export interface UseProcessOptions {
  /** Whether the query should execute (default: true when id is provided) */
  enabled?: boolean;
  /** Refetch interval in milliseconds (default: undefined - no auto-refetch) */
  refetchInterval?: number;
  /** Stale time in milliseconds (default: 5000) */
  staleTime?: number;
}

// ============================================================================
// Query Hooks
// ============================================================================

/**
 * Fetch a single execution process by ID.
 *
 * Retrieves the current state of an execution process including its
 * status, output, and any associated metadata.
 *
 * @param id - Process ID to fetch
 * @param options - Optional query configuration
 * @returns Query result with process data
 *
 * @example
 * ```tsx
 * // Basic usage
 * const { data: process } = useProcess(processId);
 *
 * // With polling for active processes
 * const { data: process } = useProcess(processId, {
 *   refetchInterval: process?.status === 'running' ? 1000 : undefined,
 * });
 * ```
 */
export function useProcess(
  id: string,
  options: UseProcessOptions = {}
): UseQueryResult<ExecutionProcess> {
  const { enabled = true, refetchInterval, staleTime = 5000 } = options;

  logger.debug('useProcess hook called', {
    id,
    enabled: enabled && Boolean(id),
    refetchInterval,
    staleTime,
  });

  return useQuery({
    queryKey: processKeys.detail(id),
    queryFn: async () => {
      logger.debug('Fetching process', { id });
      try {
        const process = await processQueries.get(id);
        logger.info('Process fetched successfully', {
          id: process.id,
          status: process.status,
          exitCode: process.exitCode,
        });
        return process;
      } catch (error) {
        logger.error('Failed to fetch process', {
          id,
          error: error instanceof Error ? error.message : String(error),
        });
        throw error; // Re-throw for React Query to handle
      }
    },
    enabled: enabled && Boolean(id),
    refetchInterval,
    staleTime,
  });
}

// ============================================================================
// Mutation Hooks
// ============================================================================

/**
 * Kill a running process.
 *
 * Terminates a running process and returns the updated process state.
 * The process status will be set to 'killed' after successful termination.
 *
 * @returns Mutation for killing a process
 *
 * @example
 * ```tsx
 * function ProcessControls({ processId }: { processId: string }) {
 *   const killProcess = useKillProcess();
 *
 *   const handleStop = () => {
 *     killProcess.mutate(processId);
 *   };
 *
 *   return (
 *     <button
 *       onClick={handleStop}
 *       disabled={killProcess.isPending}
 *     >
 *       Stop Process
 *     </button>
 *   );
 * }
 * ```
 */
export function useKillProcess(): UseMutationResult<ExecutionProcess, Error, string> {
  const queryClient = useQueryClient();
  const toast = useToast();

  logger.debug('useKillProcess hook initialized');

  return useMutation({
    mutationFn: async (id: string) => {
      logger.debug('Killing process', { id });
      try {
        const process = await processQueries.kill(id);
        logger.info('Process killed successfully', {
          id: process.id,
          status: process.status,
          exitCode: process.exitCode,
        });
        return process;
      } catch (error) {
        logger.error('Failed to kill process', {
          id,
          error: error instanceof Error ? error.message : String(error),
        });
        throw error;
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: processKeys.detail(data.id) });
      toast.success('Process stopped', 'The process has been terminated successfully');
    },
    onError: (error, id) => {
      toast.error('Failed to stop process', error.message || `Could not terminate process ${id}`);
    },
  });
}

/**
 * Send input to a running process.
 *
 * Sends stdin input to a running process. Useful for interactive
 * CLI tools that require user input.
 *
 * @returns Mutation for sending input to a process
 *
 * @example
 * ```tsx
 * function ProcessInput({ processId }: { processId: string }) {
 *   const sendInput = useSendInput();
 *   const [input, setInput] = useState('');
 *
 *   const handleSubmit = () => {
 *     sendInput.mutate({ processId, input: input + '\n' });
 *     setInput('');
 *   };
 *
 *   return (
 *     <input
 *       value={input}
 *       onChange={(e) => setInput(e.target.value)}
 *       onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
 *     />
 *   );
 * }
 * ```
 */
export function useSendInput(): UseMutationResult<
  void,
  Error,
  { processId: string; input: string }
> {
  const toast = useToast();

  logger.debug('useSendInput hook initialized');

  return useMutation({
    mutationFn: async ({ processId, input }) => {
      logger.debug('Sending input to process', {
        processId,
        inputLength: input.length,
        inputPreview: input.substring(0, 50) + (input.length > 50 ? '...' : ''),
      });
      try {
        await processQueries.sendInput(processId, input);
        logger.info('Input sent to process successfully', {
          processId,
          inputLength: input.length,
        });
      } catch (error) {
        logger.error('Failed to send input to process', {
          processId,
          inputLength: input.length,
          error: error instanceof Error ? error.message : String(error),
        });
        throw error;
      }
    },
    onError: (error, { processId }) => {
      toast.error(
        'Failed to send input',
        error.message || `Could not send input to process ${processId}`
      );
    },
  });
}
