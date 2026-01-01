import {
  type CreateTaskRequest,
  type Task,
  TaskStatus,
  type TaskWithChats,
  type UpdateTaskRequest,
} from '@openflow/generated';
import { createLogger } from '@openflow/utils';
import { createTaskSchema, updateTaskSchema } from '@openflow/validation';
import { invoke } from './utils.js';

/**
 * Logger for task query operations.
 * Logs at DEBUG level for query calls, INFO for successes, ERROR for failures.
 */
const logger = createLogger('queries:tasks');

/**
 * Task query wrappers for Tauri IPC.
 * Thin wrappers around invoke() calls with type safety.
 * Input validation is performed using Zod schemas before invoking Tauri commands.
 *
 * All functions include:
 * - Try/catch error handling with re-throw for React Query
 * - Logging at appropriate levels (DEBUG on call, INFO on success, ERROR on failure)
 * - Input validation via Zod schemas for mutations
 *
 * @example
 * ```ts
 * // List tasks for a project
 * const tasks = await taskQueries.list('project-123');
 *
 * // List tasks with status filter
 * const inProgressTasks = await taskQueries.list('project-123', 'in_progress');
 *
 * // Get a single task with its chats
 * const taskWithChats = await taskQueries.get('task-123');
 *
 * // Create a new task
 * const newTask = await taskQueries.create({
 *   projectId: 'project-123',
 *   title: 'My Task',
 * });
 *
 * // Update a task
 * const updated = await taskQueries.update('task-123', {
 *   title: 'Updated Title',
 *   status: 'in_progress',
 * });
 *
 * // Archive a task
 * const archived = await taskQueries.archive('task-123');
 *
 * // Duplicate a task
 * const duplicated = await taskQueries.duplicate('task-123');
 * ```
 */
export const taskQueries = {
  /**
   * List tasks for a project with optional filtering.
   * @param projectId - Project ID to filter tasks
   * @param status - Optional status filter (todo, in_progress, completed, blocked)
   * @param includeArchived - Whether to include archived tasks (default: false)
   * @returns Promise resolving to array of tasks
   * @throws Error if the query fails (re-thrown for React Query)
   */
  list: async (
    projectId: string,
    status?: TaskStatus,
    includeArchived?: boolean
  ): Promise<Task[]> => {
    logger.debug('Listing tasks', {
      projectId,
      status: status ?? 'all',
      includeArchived: includeArchived ?? false,
    });

    try {
      const tasks = await invoke<Task[]>('list_tasks', { projectId, status, includeArchived });

      logger.info('Tasks listed successfully', {
        projectId,
        count: tasks.length,
        titles: tasks.slice(0, 3).map((t) => t.title),
        hasMore: tasks.length > 3,
        byStatus: {
          todo: tasks.filter((t) => t.status === TaskStatus.Todo).length,
          inprogress: tasks.filter((t) => t.status === TaskStatus.Inprogress).length,
          inreview: tasks.filter((t) => t.status === TaskStatus.Inreview).length,
          done: tasks.filter((t) => t.status === TaskStatus.Done).length,
          cancelled: tasks.filter((t) => t.status === TaskStatus.Cancelled).length,
        },
      });

      return tasks;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Failed to list tasks', {
        projectId,
        status,
        includeArchived,
        error: errorMessage,
      });
      throw error;
    }
  },

  /**
   * Get a single task by ID with its associated chats.
   * @param id - Task ID
   * @returns Promise resolving to the task with its chats
   * @throws Error if the query fails (re-thrown for React Query)
   */
  get: async (id: string): Promise<TaskWithChats> => {
    logger.debug('Getting task', { id });

    try {
      const taskWithChats = await invoke<TaskWithChats>('get_task', { id });

      logger.info('Task retrieved successfully', {
        id: taskWithChats.task.id,
        title: taskWithChats.task.title,
        status: taskWithChats.task.status,
        chatCount: taskWithChats.chats?.length ?? 0,
        projectId: taskWithChats.task.projectId,
      });

      return taskWithChats;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Failed to get task', {
        id,
        error: errorMessage,
      });
      throw error;
    }
  },

  /**
   * Create a new task.
   * Input is validated against createTaskSchema before invoking.
   * @param request - Task creation request with projectId and title
   * @returns Promise resolving to the created task
   * @throws Error if validation or query fails (re-thrown for React Query)
   */
  create: async (request: CreateTaskRequest): Promise<Task> => {
    logger.debug('Creating task', {
      projectId: request.projectId,
      title: request.title,
      hasWorkflowId: 'workflowId' in request && !!request.workflowId,
    });

    try {
      const validated = createTaskSchema.parse(request);
      const task = await invoke<Task>('create_task', { request: validated });

      logger.info('Task created successfully', {
        id: task.id,
        title: task.title,
        projectId: task.projectId,
        status: task.status,
      });

      return task;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Failed to create task', {
        projectId: request.projectId,
        title: request.title,
        error: errorMessage,
      });
      throw error;
    }
  },

  /**
   * Update an existing task.
   * Input is validated against updateTaskSchema before invoking.
   * @param id - Task ID to update
   * @param request - Update request with fields to change
   * @returns Promise resolving to the updated task
   * @throws Error if validation or query fails (re-thrown for React Query)
   */
  update: async (id: string, request: UpdateTaskRequest): Promise<Task> => {
    logger.debug('Updating task', {
      id,
      hasTitle: 'title' in request,
      hasStatus: 'status' in request,
      hasDescription: 'description' in request,
    });

    try {
      const validated = updateTaskSchema.parse(request);
      const task = await invoke<Task>('update_task', { id, request: validated });

      logger.info('Task updated successfully', {
        id: task.id,
        title: task.title,
        status: task.status,
      });

      return task;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Failed to update task', {
        id,
        error: errorMessage,
      });
      throw error;
    }
  },

  /**
   * Archive a task (soft delete).
   * Archived tasks are hidden from list queries by default.
   * @param id - Task ID to archive
   * @returns Promise resolving to the archived task
   * @throws Error if the query fails (re-thrown for React Query)
   */
  archive: async (id: string): Promise<Task> => {
    logger.debug('Archiving task', { id });

    try {
      const task = await invoke<Task>('archive_task', { id });

      logger.info('Task archived successfully', {
        id: task.id,
        title: task.title,
      });

      return task;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Failed to archive task', {
        id,
        error: errorMessage,
      });
      throw error;
    }
  },

  /**
   * Unarchive a task (restore from archive).
   * Makes the task visible in list queries again.
   * @param id - Task ID to unarchive
   * @returns Promise resolving to the unarchived task
   * @throws Error if the query fails (re-thrown for React Query)
   */
  unarchive: async (id: string): Promise<Task> => {
    logger.debug('Unarchiving task', { id });

    try {
      const task = await invoke<Task>('unarchive_task', { id });

      logger.info('Task unarchived successfully', {
        id: task.id,
        title: task.title,
      });

      return task;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Failed to unarchive task', {
        id,
        error: errorMessage,
      });
      throw error;
    }
  },

  /**
   * Permanently delete a task.
   * This will cascade delete all associated chats and messages.
   * @param id - Task ID to delete
   * @returns Promise resolving when deletion is complete
   * @throws Error if the query fails (re-thrown for React Query)
   */
  delete: async (id: string): Promise<void> => {
    logger.debug('Deleting task', { id });

    try {
      await invoke<void>('delete_task', { id });

      logger.info('Task deleted successfully', { id });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Failed to delete task', {
        id,
        error: errorMessage,
      });
      throw error;
    }
  },

  /**
   * Duplicate an existing task.
   * Creates a copy with "(copy)" appended to the title and status reset to "todo".
   * @param id - Task ID to duplicate
   * @returns Promise resolving to the duplicated task
   * @throws Error if the query fails (re-thrown for React Query)
   */
  duplicate: async (id: string): Promise<Task> => {
    logger.debug('Duplicating task', { id });

    try {
      const task = await invoke<Task>('duplicate_task', { id });

      logger.info('Task duplicated successfully', {
        originalId: id,
        newId: task.id,
        title: task.title,
        projectId: task.projectId,
      });

      return task;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Failed to duplicate task', {
        id,
        error: errorMessage,
      });
      throw error;
    }
  },
};
