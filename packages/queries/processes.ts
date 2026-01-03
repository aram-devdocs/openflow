import type { ExecutionProcess } from '@openflow/generated';
import { createLogger } from '@openflow/utils';
import { invoke } from './utils.js';

/**
 * Logger for process queries.
 * Uses 'queries:processes' context for filtering and identification.
 */
const logger = createLogger('queries:processes');

/**
 * Process query wrappers for Tauri IPC.
 * Thin wrappers around invoke() calls with type safety.
 *
 * All functions include:
 * - Try/catch error handling with re-throw for React Query
 * - Logging at DEBUG (call), INFO (success), ERROR (failure) levels
 *
 * @example
 * ```ts
 * // Get a process by ID
 * const process = await processQueries.get('process-123');
 *
 * // Kill a running process
 * const killedProcess = await processQueries.kill('process-123');
 *
 * // Send input to a process
 * await processQueries.sendInput('process-123', 'y\n');
 * ```
 */
export const processQueries = {
  /**
   * Get a single execution process by ID.
   *
   * @param id - Process ID to retrieve
   * @returns The execution process with status, exit code, and metadata
   * @throws Error if the process is not found or query fails
   *
   * @example
   * ```ts
   * const process = await processQueries.get('process-123');
   * console.log(`Process status: ${process.status}`);
   * ```
   */
  get: async (id: string): Promise<ExecutionProcess> => {
    logger.debug('Getting process', { processId: id });

    try {
      const process = await invoke<ExecutionProcess>('get_process', { id });

      logger.info('Got process successfully', {
        processId: process.id,
        status: process.status,
        exitCode: process.exitCode,
        pid: process.pid,
      });

      return process;
    } catch (error) {
      logger.error('Failed to get process', {
        processId: id,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  },

  /**
   * Kill a running process.
   *
   * @param id - Process ID to kill
   * @returns The updated execution process with killed status
   * @throws Error if the process is not found or kill fails
   *
   * @example
   * ```ts
   * const process = await processQueries.kill('process-123');
   * console.log(`Process killed, status: ${process.status}`);
   * ```
   */
  kill: async (id: string): Promise<ExecutionProcess> => {
    logger.debug('Killing process', { processId: id });

    try {
      const process = await invoke<ExecutionProcess>('kill_process', { id });

      logger.info('Killed process successfully', {
        processId: process.id,
        status: process.status,
        exitCode: process.exitCode,
      });

      return process;
    } catch (error) {
      logger.error('Failed to kill process', {
        processId: id,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  },

  /**
   * Send input to a running process.
   *
   * @param processId - Process ID to send input to
   * @param input - Input string to send (e.g., 'y\n' for confirmation)
   * @returns Promise that resolves when input is sent
   * @throws Error if the process is not found or input fails
   *
   * @example
   * ```ts
   * // Send confirmation to a process prompt
   * await processQueries.sendInput('process-123', 'y\n');
   *
   * // Send a command
   * await processQueries.sendInput('process-123', 'ls -la\n');
   * ```
   */
  sendInput: async (processId: string, input: string): Promise<void> => {
    logger.debug('Sending input to process', {
      processId,
      inputLength: input.length,
      // Don't log actual input content for security/privacy
    });

    try {
      // The command expects `id` as path param and `request` as body
      await invoke<void>('send_process_input', { id: processId, request: { input } });

      logger.info('Sent input to process successfully', {
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
};
