import type {
  CreateTaskRequest,
  Task,
  TaskStatus,
  TaskWithChats,
  UpdateTaskRequest,
} from '@openflow/generated';
import { createTaskSchema, updateTaskSchema } from '@openflow/validation';
import { invoke } from './utils.js';

/**
 * Task query wrappers for Tauri IPC.
 * Thin wrappers around invoke() calls with type safety.
 * Input validation is performed using Zod schemas before invoking Tauri commands.
 */
export const taskQueries = {
  /**
   * List tasks for a project with optional filtering.
   * @param projectId - Project ID to filter tasks
   * @param status - Optional status filter
   * @param includeArchived - Whether to include archived tasks (default: false)
   */
  list: (projectId: string, status?: TaskStatus, includeArchived?: boolean): Promise<Task[]> =>
    invoke('list_tasks', { projectId, status, includeArchived }),

  /**
   * Get a single task by ID with its associated chats.
   */
  get: (id: string): Promise<TaskWithChats> => invoke('get_task', { id }),

  /**
   * Create a new task.
   * Input is validated against createTaskSchema before invoking.
   */
  create: (request: CreateTaskRequest): Promise<Task> => {
    const validated = createTaskSchema.parse(request);
    return invoke('create_task', { request: validated });
  },

  /**
   * Update an existing task.
   * Input is validated against updateTaskSchema before invoking.
   */
  update: (id: string, request: UpdateTaskRequest): Promise<Task> => {
    const validated = updateTaskSchema.parse(request);
    return invoke('update_task', { id, request: validated });
  },

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

  /**
   * Duplicate an existing task.
   * Creates a copy with "(copy)" appended to the title and status reset to "todo".
   */
  duplicate: (id: string): Promise<Task> => invoke('duplicate_task', { id }),
};
