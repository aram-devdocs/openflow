import type { ExecutionProcess } from '@openflow/generated';
import { invoke } from './utils.js';

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
 * Thin wrappers around invoke() calls for terminal session management.
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
   */
  spawn: (input: SpawnTerminalInput): Promise<ExecutionProcess> =>
    invoke('spawn_terminal', { input }),

  /**
   * Resize a terminal session.
   *
   * Updates the PTY dimensions for proper terminal rendering.
   * Uses the existing resize_process command.
   *
   * @param input - Resize configuration with processId and dimensions
   */
  resize: (input: ResizeTerminalInput): Promise<void> =>
    invoke('resize_process', {
      processId: input.processId,
      cols: input.cols,
      rows: input.rows,
    }),

  /**
   * Get the user's default shell.
   *
   * Returns the shell command that would be used for terminal sessions
   * on the current platform.
   *
   * @returns The shell command path (e.g., "/bin/bash", "cmd.exe")
   */
  getDefaultShell: (): Promise<string> => invoke('get_default_shell', {}),
};
