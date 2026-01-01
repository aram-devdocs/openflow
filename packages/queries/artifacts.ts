import { createLogger } from '@openflow/utils';
import { invoke } from './utils.js';

/**
 * Logger for artifact query operations.
 * Logs at DEBUG level for query calls, INFO for successes, ERROR for failures.
 */
const logger = createLogger('queries:artifacts');

/**
 * Represents a file or directory in the task artifacts folder.
 */
export interface ArtifactFile {
  /** File or directory name */
  name: string;
  /** Full path to the file */
  path: string;
  /** File size in bytes */
  size: number;
  /** Last modified timestamp (ISO string) */
  modifiedAt: string;
  /** Whether this is a directory */
  isDirectory: boolean;
}

/**
 * Artifact query wrappers for Tauri IPC.
 * Thin wrappers around invoke() calls with type safety.
 *
 * All functions include:
 * - Try/catch error handling with re-throw for React Query
 * - Logging at appropriate levels (DEBUG on call, INFO on success, ERROR on failure)
 *
 * @example
 * ```ts
 * // List all artifacts for a task
 * const files = await artifactQueries.list('task-123');
 *
 * // Read artifact content
 * const content = await artifactQueries.read('task-123', 'spec.md');
 *
 * // Open artifact in system editor
 * await artifactQueries.open('/path/to/artifact.md');
 * ```
 */
export const artifactQueries = {
  /**
   * List all artifacts for a task.
   * @param taskId - Task ID to list artifacts for
   * @returns Promise resolving to array of artifact files
   * @throws Error if the query fails (re-thrown for React Query)
   */
  list: async (taskId: string): Promise<ArtifactFile[]> => {
    logger.debug('Listing artifacts', { taskId });

    try {
      const artifacts = await invoke<ArtifactFile[]>('artifacts_list', { taskId });

      logger.info('Artifacts listed successfully', {
        taskId,
        count: artifacts.length,
        names: artifacts.slice(0, 5).map((a) => a.name),
        hasMore: artifacts.length > 5,
      });

      return artifacts;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Failed to list artifacts', {
        taskId,
        error: errorMessage,
      });
      throw error;
    }
  },

  /**
   * Read the content of an artifact file.
   * @param taskId - Task ID
   * @param fileName - Name of the file to read
   * @returns Promise resolving to file content as string
   * @throws Error if the query fails (re-thrown for React Query)
   */
  read: async (taskId: string, fileName: string): Promise<string> => {
    logger.debug('Reading artifact', { taskId, fileName });

    try {
      const content = await invoke<string>('artifact_read', { taskId, fileName });

      logger.info('Artifact read successfully', {
        taskId,
        fileName,
        contentLength: content.length,
      });

      return content;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Failed to read artifact', {
        taskId,
        fileName,
        error: errorMessage,
      });
      throw error;
    }
  },

  /**
   * Open an artifact in the system's default editor.
   * @param path - Full path to the file
   * @returns Promise resolving when the file is opened
   * @throws Error if the query fails (re-thrown for React Query)
   */
  open: async (path: string): Promise<void> => {
    logger.debug('Opening artifact', { path });

    try {
      await invoke<void>('shell_open', { path });

      logger.info('Artifact opened successfully', { path });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Failed to open artifact', {
        path,
        error: errorMessage,
      });
      throw error;
    }
  },
};
