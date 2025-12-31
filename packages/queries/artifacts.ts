import { invoke } from './utils.js';

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
 */
export const artifactQueries = {
  /**
   * List all artifacts for a task.
   * @param taskId - Task ID to list artifacts for
   */
  list: (taskId: string): Promise<ArtifactFile[]> => invoke('artifacts_list', { taskId }),

  /**
   * Read the content of an artifact file.
   * @param taskId - Task ID
   * @param fileName - Name of the file to read
   */
  read: (taskId: string, fileName: string): Promise<string> =>
    invoke('artifact_read', { taskId, fileName }),

  /**
   * Open an artifact in the system's default editor.
   * @param path - Full path to the file
   */
  open: (path: string): Promise<void> => invoke('shell_open', { path }),
};
