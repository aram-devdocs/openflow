/**
 * useSystem - Hooks for system operations.
 *
 * Provides React hooks for opening files and directories in external applications.
 */

import { systemQueries } from '@openflow/queries';
import { useMutation } from '@tanstack/react-query';

/**
 * Hook for opening files/directories in the default system application.
 *
 * @example
 * ```tsx
 * const { mutate: openInEditor } = useOpenInEditor();
 *
 * const handleOpenInIDE = () => {
 *   openInEditor('/path/to/project');
 * };
 * ```
 */
export function useOpenInEditor() {
  return useMutation({
    mutationFn: (path: string) => systemQueries.openInEditor(path),
  });
}

/**
 * Hook for revealing files/directories in the system file explorer.
 *
 * @example
 * ```tsx
 * const { mutate: revealInExplorer } = useRevealInExplorer();
 *
 * const handleReveal = () => {
 *   revealInExplorer('/path/to/file');
 * };
 * ```
 */
export function useRevealInExplorer() {
  return useMutation({
    mutationFn: (path: string) => systemQueries.revealInExplorer(path),
  });
}
