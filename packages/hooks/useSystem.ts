/**
 * useSystem - Hooks for system operations.
 *
 * This module provides React Query hooks for OS-level operations,
 * such as opening files in editors and revealing files in the system explorer.
 *
 * Features:
 * - Full logging at DEBUG/INFO/ERROR levels
 * - Toast notifications for user feedback on mutations
 * - Proper error handling with try/catch patterns
 */

import { systemQueries } from '@openflow/queries';
import { createLogger } from '@openflow/utils';
import { type UseMutationResult, useMutation } from '@tanstack/react-query';
import { useToast } from './useToast';

// ============================================================================
// Logger
// ============================================================================

const logger = createLogger('useSystem');

// ============================================================================
// Types
// ============================================================================

/**
 * Input for opening a path in the editor.
 */
export interface OpenInEditorInput {
  /** The file or directory path to open */
  path: string;
  /** Optional display name for toast messages (defaults to path) */
  displayName?: string;
}

/**
 * Input for revealing a path in the file explorer.
 */
export interface RevealInExplorerInput {
  /** The file or directory path to reveal */
  path: string;
  /** Optional display name for toast messages (defaults to path) */
  displayName?: string;
}

// ============================================================================
// Mutation Hooks
// ============================================================================

/**
 * Hook for opening files/directories in the default system application.
 *
 * Opens the specified path in the system's default application:
 * - For directories, typically opens a file manager or IDE
 * - For files, opens the associated application
 *
 * @returns Mutation for opening paths in the editor
 *
 * @example
 * ```tsx
 * function ProjectActions({ projectPath, projectName }: Props) {
 *   const openInEditor = useOpenInEditor();
 *
 *   const handleOpenInIDE = () => {
 *     openInEditor.mutate({
 *       path: projectPath,
 *       displayName: projectName,
 *     });
 *   };
 *
 *   return (
 *     <button
 *       onClick={handleOpenInIDE}
 *       disabled={openInEditor.isPending}
 *     >
 *       {openInEditor.isPending ? 'Opening...' : 'Open in IDE'}
 *     </button>
 *   );
 * }
 * ```
 *
 * @example
 * ```tsx
 * // Simple usage with just path
 * const openInEditor = useOpenInEditor();
 * openInEditor.mutate({ path: '/path/to/project' });
 * ```
 */
export function useOpenInEditor(): UseMutationResult<void, Error, OpenInEditorInput> {
  const toast = useToast();

  logger.debug('useOpenInEditor hook initialized');

  return useMutation({
    mutationFn: async (input: OpenInEditorInput) => {
      const { path, displayName } = input;
      logger.debug('Opening path in editor', {
        path,
        displayName: displayName ?? path,
      });

      try {
        await systemQueries.openInEditor(path);
        logger.info('Opened path in editor successfully', {
          path,
        });
      } catch (error) {
        logger.error('Failed to open path in editor', {
          path,
          error: error instanceof Error ? error.message : String(error),
        });
        throw error;
      }
    },
    onSuccess: (_data, input) => {
      const displayName = input.displayName ?? getShortPath(input.path);
      toast.success('Opened in Editor', `Opened "${displayName}" in your IDE.`);
    },
    onError: (error, input) => {
      const displayName = input.displayName ?? getShortPath(input.path);
      toast.error(
        'Failed to Open in Editor',
        `Could not open "${displayName}". ${error instanceof Error ? error.message : 'Please try again.'}`
      );
    },
  });
}

/**
 * Hook for revealing files/directories in the system file explorer.
 *
 * Opens the parent directory and selects the specified item.
 * On macOS this opens Finder, on Windows Explorer, on Linux the default file manager.
 *
 * @returns Mutation for revealing paths in the explorer
 *
 * @example
 * ```tsx
 * function FileActions({ filePath, fileName }: Props) {
 *   const revealInExplorer = useRevealInExplorer();
 *
 *   const handleReveal = () => {
 *     revealInExplorer.mutate({
 *       path: filePath,
 *       displayName: fileName,
 *     });
 *   };
 *
 *   return (
 *     <button
 *       onClick={handleReveal}
 *       disabled={revealInExplorer.isPending}
 *     >
 *       {revealInExplorer.isPending ? 'Opening...' : 'Reveal in Explorer'}
 *     </button>
 *   );
 * }
 * ```
 *
 * @example
 * ```tsx
 * // Simple usage with just path
 * const revealInExplorer = useRevealInExplorer();
 * revealInExplorer.mutate({ path: '/path/to/file.txt' });
 * ```
 */
export function useRevealInExplorer(): UseMutationResult<void, Error, RevealInExplorerInput> {
  const toast = useToast();

  logger.debug('useRevealInExplorer hook initialized');

  return useMutation({
    mutationFn: async (input: RevealInExplorerInput) => {
      const { path, displayName } = input;
      logger.debug('Revealing path in file explorer', {
        path,
        displayName: displayName ?? path,
      });

      try {
        await systemQueries.revealInExplorer(path);
        logger.info('Revealed path in file explorer successfully', {
          path,
        });
      } catch (error) {
        logger.error('Failed to reveal path in file explorer', {
          path,
          error: error instanceof Error ? error.message : String(error),
        });
        throw error;
      }
    },
    onSuccess: (_data, input) => {
      const displayName = input.displayName ?? getShortPath(input.path);
      toast.success('Revealed in Explorer', `Opened folder containing "${displayName}".`);
    },
    onError: (error, input) => {
      const displayName = input.displayName ?? getShortPath(input.path);
      toast.error(
        'Failed to Reveal in Explorer',
        `Could not reveal "${displayName}". ${error instanceof Error ? error.message : 'Please try again.'}`
      );
    },
  });
}

// ============================================================================
// Utilities
// ============================================================================

/**
 * Get the short display name from a path.
 * Extracts the filename or last directory name.
 *
 * @internal
 */
function getShortPath(path: string): string {
  // Handle both Unix and Windows paths
  const normalized = path.replace(/\\/g, '/');
  const parts = normalized.split('/').filter(Boolean);
  return parts.length > 0 ? (parts[parts.length - 1] ?? path) : path;
}
