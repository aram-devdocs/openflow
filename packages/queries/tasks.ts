import { invoke } from '@tauri-apps/api/core';
import type {
  Task,
  TaskStatus,
  TaskWithChats,
  CreateTaskRequest,
  UpdateTaskRequest,
} from '@openflow/generated';

/**
 * Task query wrappers for Tauri IPC.
 * Thin wrappers around invoke() calls with type safety.
 */
export const taskQueries = {
  /**
   * List tasks for a project with optional filtering.
   * @param projectId - Project ID to filter tasks
   * @param status - Optional status filter
   * @param includeArchived - Whether to include archived tasks (default: false)
   */
  list: (
    projectId: string,
    status?: TaskStatus,
    includeArchived?: boolean
  ): Promise<Task[]> =>
    invoke('list_tasks', { projectId, status, includeArchived }),

  /**
   * Get a single task by ID with its associated chats.
   */
  get: (id: string): Promise<TaskWithChats> => invoke('get_task', { id }),

  /**
   * Create a new task.
   */
  create: (request: CreateTaskRequest): Promise<Task> =>
    invoke('create_task', { request }),

  /**
   * Update an existing task.
   */
  update: (id: string, request: UpdateTaskRequest): Promise<Task> =>
    invoke('update_task', { id, request }),

  /**
   * Archive a task (soft delete).
   */
  archive: (id: string): Promise<Task> => invoke('archive_task', { id }),

  /**
   * Unarchive a task (restore from archive).
   */
  unarchive: (id: string): Promise<Task> => invoke('unarchive_task', { id }),

  /**
   * Permanently delete a task.
   */
  delete: (id: string): Promise<void> => invoke('delete_task', { id }),
};
