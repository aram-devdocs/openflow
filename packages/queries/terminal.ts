import type { ExecutionProcess } from '@openflow/generated';
import { createLogger } from '@openflow/utils';
import { invoke } from './utils.js';

/**
 * Logger for terminal query operations.
 * Logs at DEBUG level for query calls, INFO for successes, ERROR for failures.
 */
const logger = createLogger('queries:terminal');

/**
 * Input for spawning a terminal session.
 */
export interface SpawnTerminalInput {
  /** The project ID to spawn the terminal in */
  projectId: string;
  /** Optional chat ID to associate the terminal with */
  chatId?: string;
  /** Optional custom working directory (defaults to project's git_repo_path) */
  cwd?: string;
  /** Optional shell command (defaults to user's shell) */
  shell?: string;
  /** Optional terminal width in columns (defaults to 120) */
  cols?: number;
  /** Optional terminal height in rows (defaults to 30) */
  rows?: number;
}

/**
 * Input for resizing a terminal/process.
 */
export interface ResizeTerminalInput {
  /** The process ID to resize */
  processId: string;
  /** New terminal width in columns */
  cols: number;
  /** New terminal height in rows */
  rows: number;
}

/**
 * Terminal query wrappers for Tauri IPC.
 * Provides functions for managing terminal sessions, including spawning,
 * resizing, and querying the default shell.
 *
 * All functions include:
 * - Try/catch error handling with re-throw for React Query
 * - Logging at appropriate levels (DEBUG on call, INFO on success, ERROR on failure)
 *
 * @example
 * ```ts
 * // Spawn a new terminal session
 * const process = await terminalQueries.spawn({
 *   projectId: 'project-123',
 *   cols: 120,
 *   rows: 30,
 * });
 *
 * // Resize a terminal
 * await terminalQueries.resize({
 *   processId: process.id,
 *   cols: 150,
 *   rows: 40,
 * });
 *
 * // Get the default shell
 * const shell = await terminalQueries.getDefaultShell();
 * ```
 */
export const terminalQueries = {
  /**
   * Spawn a new terminal session.
   *
   * Creates an interactive shell process within the specified project's
   * working directory. Uses the user's default shell or a custom shell.
   *
   * @param input - Terminal spawn configuration
   * @returns The spawned execution process record
   * @throws Error if the spawn operation fails (re-thrown for React Query)
   *
   * @example
   * ```ts
   * const process = await terminalQueries.spawn({
   *   projectId: 'project-123',
   *   chatId: 'chat-456',
   *   cwd: '/custom/working/dir',
   *   shell: '/bin/zsh',
   *   cols: 120,
   *   rows: 30,
   * });
   * console.log('Spawned terminal:', process.id);
   * ```
   */
  spawn: async (input: SpawnTerminalInput): Promise<ExecutionProcess> => {
    logger.debug('Spawning terminal session', {
      projectId: input.projectId,
      chatId: input.chatId,
      cwd: input.cwd,
      shell: input.shell,
      cols: input.cols,
      rows: input.rows,
    });

    try {
      const process = await invoke<ExecutionProcess>('spawn_terminal', {
        request: input,
      });

      logger.info('Terminal session spawned successfully', {
        processId: process.id,
        projectId: input.projectId,
        chatId: input.chatId,
        status: process.status,
        pid: process.pid,
      });

      return process;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Failed to spawn terminal session', {
        projectId: input.projectId,
        chatId: input.chatId,
        error: errorMessage,
      });
      throw error;
    }
  },

  /**
   * Resize a terminal session.
   *
   * Updates the PTY dimensions for proper terminal rendering.
   * Uses the existing resize_process command.
   *
   * @param input - Resize configuration with processId and dimensions
   * @throws Error if the resize operation fails (re-thrown for React Query)
   *
   * @example
   * ```ts
   * await terminalQueries.resize({
   *   processId: 'process-123',
   *   cols: 150,
   *   rows: 40,
   * });
   * ```
   */
  resize: async (input: ResizeTerminalInput): Promise<void> => {
    logger.debug('Resizing terminal session', {
      processId: input.processId,
      cols: input.cols,
      rows: input.rows,
    });

    try {
      // The command expects `id` as path param and `request` as body
      await invoke<void>('resize_process', {
        id: input.processId,
        request: {
          cols: input.cols,
          rows: input.rows,
        },
      });

      logger.info('Terminal session resized successfully', {
        processId: input.processId,
        cols: input.cols,
        rows: input.rows,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Failed to resize terminal session', {
        processId: input.processId,
        cols: input.cols,
        rows: input.rows,
        error: errorMessage,
      });
      throw error;
    }
  },

  /**
   * Get the user's default shell.
   *
   * Returns the shell command that would be used for terminal sessions
   * on the current platform.
   *
   * @returns The shell command path (e.g., "/bin/bash", "cmd.exe")
   * @throws Error if the query fails (re-thrown for React Query)
   *
   * @example
   * ```ts
   * const shell = await terminalQueries.getDefaultShell();
   * console.log('Default shell:', shell); // e.g., "/bin/zsh"
   * ```
   */
  getDefaultShell: async (): Promise<string> => {
    logger.debug('Getting default shell');

    try {
      const shell = await invoke<string>('get_default_shell', {});

      logger.info('Default shell retrieved successfully', { shell });

      return shell;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Failed to get default shell', { error: errorMessage });
      throw error;
    }
  },
};
