/**
 * System queries - Tauri invoke wrappers for system operations.
 *
 * Provides functions for interacting with the operating system,
 * such as opening files and directories in external applications.
 */

import { invoke } from '@tauri-apps/api/core';

/**
 * System query functions for OS-level operations.
 */
export const systemQueries = {
  /**
   * Open a file or directory in the default system application.
   * For directories, this typically opens a file manager.
   * For files, it opens the associated application.
   *
   * @param path - The path to open
   * @returns Promise that resolves on success
   */
  openInEditor: (path: string): Promise<void> => invoke('open_in_editor', { path }),

  /**
   * Reveal a file or directory in the system file explorer.
   * Opens the parent directory and selects the item.
   *
   * @param path - The path to reveal
   * @returns Promise that resolves on success
   */
  revealInExplorer: (path: string): Promise<void> => invoke('reveal_in_explorer', { path }),
};
