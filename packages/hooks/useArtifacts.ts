import { type ArtifactFile, artifactQueries } from '@openflow/queries';
import { type UseQueryResult, useMutation, useQuery } from '@tanstack/react-query';

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

/**
 * Fetch artifacts for a task.
 *
 * @param taskId - Task ID to fetch artifacts for
 * @returns Query result with array of artifact files
 */
export function useArtifacts(taskId: string): UseQueryResult<ArtifactFile[]> {
  return useQuery({
    queryKey: artifactKeys.list(taskId),
    queryFn: () => artifactQueries.list(taskId),
    enabled: Boolean(taskId),
  });
}

/**
 * Fetch the content of a specific artifact file.
 *
 * @param taskId - Task ID
 * @param fileName - Name of the file to read
 * @returns Query result with file content as string
 */
export function useArtifactContent(taskId: string, fileName: string): UseQueryResult<string> {
  return useQuery({
    queryKey: artifactKeys.content(taskId, fileName),
    queryFn: () => artifactQueries.read(taskId, fileName),
    enabled: Boolean(taskId) && Boolean(fileName),
  });
}

/**
 * Open an artifact in the system's default editor.
 *
 * @returns Mutation for opening an artifact
 */
export function useOpenArtifact() {
  return useMutation({
    mutationFn: (path: string) => artifactQueries.open(path),
  });
}
