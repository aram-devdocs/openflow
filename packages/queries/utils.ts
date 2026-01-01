import { createLogger } from '@openflow/utils';
import { invoke as tauriInvoke } from '@tauri-apps/api/core';

/**
 * Logger for query utility operations.
 * Logs at DEBUG level for invoke calls, INFO for successes, ERROR for failures.
 */
const logger = createLogger('queries:utils');

/**
 * Error thrown when Tauri context is not available.
 * This happens when running in browser mode instead of the desktop app.
 *
 * @example
 * ```ts
 * try {
 *   await invoke('some_command', {});
 * } catch (error) {
 *   if (error instanceof TauriContextError) {
 *     console.log('Please run as desktop app');
 *   }
 * }
 * ```
 */
export class TauriContextError extends Error {
  constructor() {
    super(
      'Tauri context is not available. This feature requires the desktop app. Please run with `pnpm dev:mcp` instead of viewing in the browser.'
    );
    this.name = 'TauriContextError';
  }
}

/**
 * Check if we're running in a Tauri context.
 * Uses __TAURI_INTERNALS__ which is always present in Tauri 2,
 * regardless of the withGlobalTauri setting.
 *
 * @returns true if running in a Tauri desktop app, false otherwise
 *
 * @example
 * ```ts
 * if (isTauriContext()) {
 *   // Safe to use Tauri APIs
 *   await invoke('my_command', {});
 * } else {
 *   // Show browser fallback UI
 *   console.log('Running in browser mode');
 * }
 * ```
 */
export function isTauriContext(): boolean {
  const inContext = typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
  logger.debug('Checking Tauri context', { inContext });
  return inContext;
}

/**
 * Safe invoke wrapper that provides a helpful error message when
 * Tauri context is not available (e.g., when running in browser).
 *
 * All Tauri IPC calls should use this wrapper instead of the raw
 * `@tauri-apps/api/core` invoke to ensure consistent error handling
 * and logging across the application.
 *
 * Features:
 * - Checks for Tauri context before invoking
 * - Logs at DEBUG level for command calls
 * - Logs at INFO level for successful commands (with response type)
 * - Logs at ERROR level for failed commands (with error message)
 * - Re-throws errors for React Query error handling
 *
 * @param cmd - The Tauri command to invoke
 * @param args - Optional arguments for the command
 * @returns Promise resolving to the command result
 * @throws TauriContextError if Tauri context is not available
 * @throws Error if the Tauri command fails (re-thrown for React Query)
 *
 * @example
 * ```ts
 * // Simple command without arguments
 * const result = await invoke<string>('get_version');
 *
 * // Command with arguments
 * const project = await invoke<Project>('get_project', { id: 'project-123' });
 *
 * // Handling errors
 * try {
 *   const data = await invoke<Data>('fetch_data', { query: 'test' });
 * } catch (error) {
 *   if (error instanceof TauriContextError) {
 *     // Running in browser - show fallback UI
 *   } else {
 *     // Command failed - handle error
 *   }
 * }
 * ```
 */
export async function invoke<T>(cmd: string, args?: Record<string, unknown>): Promise<T> {
  // Check for Tauri context first
  if (!isTauriContext()) {
    logger.error('Attempted to invoke command outside Tauri context', { cmd });
    throw new TauriContextError();
  }

  // Log the command invocation (sanitize args to avoid logging sensitive data)
  const argKeys = args ? Object.keys(args) : [];
  logger.debug('Invoking Tauri command', {
    cmd,
    argKeys,
    argCount: argKeys.length,
  });

  try {
    const result = await tauriInvoke<T>(cmd, args);

    // Log success with result type info (not the actual data for security)
    const resultType = result === null ? 'null' : Array.isArray(result) ? 'array' : typeof result;
    const resultInfo: Record<string, unknown> = { cmd, resultType };

    // Add array length if applicable (useful for list queries)
    if (Array.isArray(result)) {
      resultInfo.resultLength = result.length;
    }

    logger.info('Tauri command completed successfully', resultInfo);

    return result;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error('Tauri command failed', {
      cmd,
      argKeys,
      error: errorMessage,
    });
    throw error;
  }
}
