import type { ExecutionProcess } from '@openflow/generated';
import {
  type ResizeTerminalInput,
  type SpawnTerminalInput,
  terminalQueries,
} from '@openflow/queries';
import { createLogger } from '@openflow/utils';
import {
  type UseMutationResult,
  type UseQueryResult,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { processKeys } from './useProcesses';

const logger = createLogger('useTerminal');

/**
 * Query key factory for terminal operations.
 * Provides structured keys for cache management.
 */
export const terminalKeys = {
  all: ['terminal'] as const,
  defaultShell: () => [...terminalKeys.all, 'defaultShell'] as const,
};

/**
 * Fetch the user's default shell.
 *
 * Returns the shell command that would be used for terminal sessions
 * on the current platform. Useful for displaying shell info in UI.
 *
 * @returns Query result with the shell command path
 *
 * @example
 * ```tsx
 * function ShellInfo() {
 *   const { data: shell } = useDefaultShell();
 *   return <p>Default shell: {shell}</p>;
 * }
 * ```
 */
export function useDefaultShell(): UseQueryResult<string> {
  return useQuery({
    queryKey: terminalKeys.defaultShell(),
    queryFn: () => terminalQueries.getDefaultShell(),
    staleTime: Number.POSITIVE_INFINITY, // Shell won't change during session
  });
}

/**
 * Spawn a new terminal session.
 *
 * Creates an interactive shell process within a project's working directory.
 * The terminal uses the user's default shell (or a custom shell if specified)
 * with proper terminal emulation via PTY.
 *
 * @returns Mutation for spawning a terminal
 *
 * @example
 * ```tsx
 * function TerminalLauncher({ projectId }: { projectId: string }) {
 *   const spawnTerminal = useSpawnTerminal();
 *
 *   const handleOpenTerminal = async () => {
 *     try {
 *       const process = await spawnTerminal.mutateAsync({ projectId });
 *       console.log('Terminal started:', process.id);
 *     } catch (error) {
 *       console.error('Failed to start terminal:', error);
 *     }
 *   };
 *
 *   return (
 *     <button onClick={handleOpenTerminal} disabled={spawnTerminal.isPending}>
 *       {spawnTerminal.isPending ? 'Starting...' : 'Open Terminal'}
 *     </button>
 *   );
 * }
 * ```
 */
export function useSpawnTerminal(): UseMutationResult<ExecutionProcess, Error, SpawnTerminalInput> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: SpawnTerminalInput) => terminalQueries.spawn(input),
    onSuccess: (process, input) => {
      logger.info('Terminal spawned', {
        processId: process.id,
        projectId: input.projectId,
        shell: input.shell,
      });
      // Invalidate process queries to include the new terminal
      queryClient.invalidateQueries({ queryKey: processKeys.all });
      queryClient.invalidateQueries({ queryKey: processKeys.detail(process.id) });
    },
    onError: (error, input) => {
      logger.error('Failed to spawn terminal', {
        projectId: input.projectId,
        shell: input.shell,
        error: error.message,
      });
    },
  });
}

/**
 * Resize a terminal session.
 *
 * Updates the PTY dimensions for proper terminal rendering.
 * Call this when the terminal container size changes.
 *
 * @returns Mutation for resizing a terminal
 *
 * @example
 * ```tsx
 * function Terminal({ processId }: { processId: string }) {
 *   const resizeTerminal = useResizeTerminal();
 *   const containerRef = useRef<HTMLDivElement>(null);
 *
 *   useEffect(() => {
 *     if (!containerRef.current) return;
 *
 *     const observer = new ResizeObserver(([entry]) => {
 *       // Calculate cols/rows from container dimensions
 *       const { width, height } = entry.contentRect;
 *       const cols = Math.floor(width / 9); // ~9px per character
 *       const rows = Math.floor(height / 17); // ~17px per line
 *
 *       resizeTerminal.mutate({ processId, cols, rows });
 *     });
 *
 *     observer.observe(containerRef.current);
 *     return () => observer.disconnect();
 *   }, [processId, resizeTerminal]);
 *
 *   return <div ref={containerRef} className="terminal" />;
 * }
 * ```
 */
export function useResizeTerminal(): UseMutationResult<void, Error, ResizeTerminalInput> {
  return useMutation({
    mutationFn: (input: ResizeTerminalInput) => terminalQueries.resize(input),
    onSuccess: (_data, input) => {
      logger.debug('Terminal resized', {
        processId: input.processId,
        cols: input.cols,
        rows: input.rows,
      });
    },
    onError: (error, input) => {
      logger.error('Failed to resize terminal', {
        processId: input.processId,
        cols: input.cols,
        rows: input.rows,
        error: error.message,
      });
    },
  });
}
