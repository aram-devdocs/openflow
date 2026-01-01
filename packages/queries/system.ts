import { createLogger } from '@openflow/utils';
import { invoke } from './utils.js';

/**
 * Logger for system query operations.
 * Logs at DEBUG level for query calls, INFO for successes, ERROR for failures.
 */
const logger = createLogger('queries:system');

/**
 * System query wrappers for Tauri IPC.
 * Provides functions for interacting with the operating system,
 * such as opening files and directories in external applications.
 *
 * All functions include:
 * - Try/catch error handling with re-throw for React Query
 * - Logging at appropriate levels (DEBUG on call, INFO on success, ERROR on failure)
 *
 * @example
 * ```ts
 * // Open a file in the default editor
 * await systemQueries.openInEditor('/path/to/file.ts');
 *
 * // Reveal a file in the system file explorer
 * await systemQueries.revealInExplorer('/path/to/file.ts');
 * ```
 */
export const systemQueries = {
  /**
   * Open a file or directory in the default system application.
   * For directories, this typically opens a file manager.
   * For files, it opens the associated application.
   *
   * @param path - The path to open
   * @returns Promise that resolves on success
   * @throws Error if the operation fails (re-thrown for React Query)
   *
   * @example
   * ```ts
   * // Open a TypeScript file in the default editor
   * await systemQueries.openInEditor('/Users/dev/project/src/index.ts');
   *
   * // Open a directory in the file manager
   * await systemQueries.openInEditor('/Users/dev/project');
   * ```
   */
  openInEditor: async (path: string): Promise<void> => {
    logger.debug('Opening in editor', { path });

    try {
      await invoke<void>('open_in_editor', { path });

      logger.info('Opened in editor successfully', { path });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Failed to open in editor', {
        path,
        error: errorMessage,
      });
      throw error;
    }
  },

  /**
   * Reveal a file or directory in the system file explorer.
   * Opens the parent directory and selects the item.
   *
   * @param path - The path to reveal
   * @returns Promise that resolves on success
   * @throws Error if the operation fails (re-thrown for React Query)
   *
   * @example
   * ```ts
   * // Reveal a file in Finder/Explorer
   * await systemQueries.revealInExplorer('/Users/dev/project/package.json');
   * ```
   */
  revealInExplorer: async (path: string): Promise<void> => {
    logger.debug('Revealing in explorer', { path });

    try {
      await invoke<void>('reveal_in_explorer', { path });

      logger.info('Revealed in explorer successfully', { path });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Failed to reveal in explorer', {
        path,
        error: errorMessage,
      });
      throw error;
    }
  },
};
