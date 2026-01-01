/**
 * useArtifacts - Hooks for managing task artifacts
 *
 * This module provides React Query hooks for fetching and interacting with
 * task artifacts (files in the task's artifacts folder).
 *
 * Features:
 * - Full logging at DEBUG/INFO/ERROR levels
 * - Toast notifications for user feedback on actions
 * - Proper error handling with try/catch patterns
 */

import { type ArtifactFile, artifactQueries } from '@openflow/queries';
import { createLogger } from '@openflow/utils';
import { type UseQueryResult, useMutation, useQuery } from '@tanstack/react-query';
import { useToast } from './useToast';

// ============================================================================
// Logger
// ============================================================================

const logger = createLogger('useArtifacts');

// ============================================================================
// Query Keys
// ============================================================================

/**
 * Query key factory for artifacts.
 * Provides structured, hierarchical keys for cache management.
 */
export const artifactKeys = {
  all: ['artifacts'] as const,
  lists: () => [...artifactKeys.all, 'list'] as const,
  list: (taskId: string) => [...artifactKeys.lists(), taskId] as const,
  contents: () => [...artifactKeys.all, 'content'] as const,
  content: (taskId: string, fileName: string) =>
    [...artifactKeys.contents(), taskId, fileName] as const,
};

// ============================================================================
// Hooks
// ============================================================================

/**
 * Fetch artifacts for a task.
 *
 * @param taskId - Task ID to fetch artifacts for
 * @returns Query result with array of artifact files
 *
 * @example
 * ```tsx
 * function ArtifactsList({ taskId }: { taskId: string }) {
 *   const { data: artifacts, isLoading, error } = useArtifacts(taskId);
 *
 *   if (isLoading) return <Spinner />;
 *   if (error) return <ErrorMessage error={error} />;
 *
 *   return (
 *     <ul>
 *       {artifacts?.map(file => (
 *         <li key={file.path}>{file.name}</li>
 *       ))}
 *     </ul>
 *   );
 * }
 * ```
 */
export function useArtifacts(taskId: string): UseQueryResult<ArtifactFile[]> {
  logger.debug('useArtifacts hook called', { taskId, enabled: Boolean(taskId) });

  return useQuery({
    queryKey: artifactKeys.list(taskId),
    queryFn: async () => {
      logger.debug('Fetching artifacts list', { taskId });
      try {
        const artifacts = await artifactQueries.list(taskId);
        logger.info('Artifacts fetched successfully', {
          taskId,
          count: artifacts.length,
          artifacts: artifacts.map((a) => a.name),
        });
        return artifacts;
      } catch (error) {
        logger.error('Failed to fetch artifacts', {
          taskId,
          error: error instanceof Error ? error.message : String(error),
        });
        throw error; // Re-throw for React Query to handle
      }
    },
    enabled: Boolean(taskId),
  });
}

/**
 * Fetch the content of a specific artifact file.
 *
 * @param taskId - Task ID
 * @param fileName - Name of the file to read
 * @returns Query result with file content as string
 *
 * @example
 * ```tsx
 * function ArtifactViewer({ taskId, fileName }: Props) {
 *   const { data: content, isLoading, error } = useArtifactContent(taskId, fileName);
 *
 *   if (isLoading) return <Spinner />;
 *   if (error) return <ErrorMessage error={error} />;
 *
 *   return <pre>{content}</pre>;
 * }
 * ```
 */
export function useArtifactContent(taskId: string, fileName: string): UseQueryResult<string> {
  logger.debug('useArtifactContent hook called', {
    taskId,
    fileName,
    enabled: Boolean(taskId) && Boolean(fileName),
  });

  return useQuery({
    queryKey: artifactKeys.content(taskId, fileName),
    queryFn: async () => {
      logger.debug('Fetching artifact content', { taskId, fileName });
      try {
        const content = await artifactQueries.read(taskId, fileName);
        logger.info('Artifact content fetched successfully', {
          taskId,
          fileName,
          contentLength: content.length,
        });
        return content;
      } catch (error) {
        logger.error('Failed to fetch artifact content', {
          taskId,
          fileName,
          error: error instanceof Error ? error.message : String(error),
        });
        throw error; // Re-throw for React Query to handle
      }
    },
    enabled: Boolean(taskId) && Boolean(fileName),
  });
}

/**
 * Open an artifact in the system's default editor.
 *
 * This hook provides a mutation for opening artifacts with proper logging
 * and toast notifications for success/error states.
 *
 * @returns Mutation for opening an artifact
 *
 * @example
 * ```tsx
 * function ArtifactItem({ file }: { file: ArtifactFile }) {
 *   const openArtifact = useOpenArtifact();
 *
 *   return (
 *     <button
 *       onClick={() => openArtifact.mutate({ path: file.path, fileName: file.name })}
 *       disabled={openArtifact.isPending}
 *     >
 *       {openArtifact.isPending ? 'Opening...' : 'Open'}
 *     </button>
 *   );
 * }
 * ```
 */
export function useOpenArtifact() {
  const toast = useToast();

  logger.debug('useOpenArtifact hook initialized');

  return useMutation({
    mutationFn: async ({ path, fileName }: { path: string; fileName: string }) => {
      logger.debug('Opening artifact', { path, fileName });
      try {
        await artifactQueries.open(path);
        logger.info('Artifact opened successfully', { path, fileName });
      } catch (error) {
        logger.error('Failed to open artifact', {
          path,
          fileName,
          error: error instanceof Error ? error.message : String(error),
        });
        throw error; // Re-throw for mutation error handling
      }
    },
    onSuccess: (_data, variables) => {
      toast.success('File Opened', `"${variables.fileName}" opened in default editor.`);
    },
    onError: (error, variables) => {
      toast.error(
        'Failed to Open File',
        `Could not open "${variables.fileName}". ${error instanceof Error ? error.message : 'Please try again.'}`
      );
    },
  });
}

/**
 * Legacy open artifact mutation (deprecated).
 * Use `useOpenArtifact` instead for better UX with toast notifications.
 *
 * @deprecated Use `useOpenArtifact` with `{ path, fileName }` instead
 */
export function useOpenArtifactLegacy() {
  logger.debug('useOpenArtifactLegacy hook initialized (deprecated)');

  return useMutation({
    mutationFn: async (path: string) => {
      logger.debug('Opening artifact (legacy)', { path });
      try {
        await artifactQueries.open(path);
        logger.info('Artifact opened successfully (legacy)', { path });
      } catch (error) {
        logger.error('Failed to open artifact (legacy)', {
          path,
          error: error instanceof Error ? error.message : String(error),
        });
        throw error;
      }
    },
  });
}
