/**
 * Task Execution Query Functions
 *
 * Query and mutation functions for the task execution system.
 * These wrap backend commands for:
 * - Task execution control (start, pause, resume, cancel)
 * - Task step management (create, list, delete)
 * - Agent event queries
 * - Permission handling
 *
 * @example
 * ```ts
 * // Get task with all steps
 * const taskWithSteps = await taskExecutionQueries.getWithSteps('task-123');
 *
 * // Start task execution
 * await taskExecutionQueries.start('task-123');
 *
 * // Create a step
 * await taskExecutionQueries.createStep('task-123', {
 *   stepIndex: 0,
 *   title: 'Implement feature',
 *   prompt: 'Create a new component',
 *   providerId: 'claude-code',
 * });
 *
 * // Get events for a step
 * const events = await taskExecutionQueries.getStepEvents('task-123', 0);
 * ```
 */

import type {
  AgentEventRecord,
  CreateStepRequest,
  Permission,
  Task,
  TaskStep,
  TaskWithSteps,
} from '@openflow/generated';
import { createLogger } from '@openflow/utils';
import { invoke } from './utils.js';

const logger = createLogger('queries:taskExecution');

// =============================================================================
// Task Execution Queries
// =============================================================================

/**
 * Task execution query wrappers for Tauri IPC.
 * These functions provide the interface to the new agent orchestration system.
 *
 * @example
 * ```ts
 * // Full task execution flow
 * const task = await taskExecutionQueries.getWithSteps('task-123');
 * console.log(`Task has ${task.steps.length} steps`);
 *
 * // Start execution (runs autonomously in background)
 * await taskExecutionQueries.start('task-123');
 *
 * // Check if running
 * const running = await taskExecutionQueries.isRunning('task-123');
 *
 * // Get live events for current step
 * const events = await taskExecutionQueries.getStepEvents('task-123', 0);
 *
 * // Handle permission if needed
 * const permission = await taskExecutionQueries.getPendingPermission('task-123');
 * if (permission) {
 *   await taskExecutionQueries.respondToPermission('task-123', permission.id, true);
 * }
 * ```
 */
export const taskExecutionQueries = {
  // ===========================================================================
  // Task with Steps Queries
  // ===========================================================================

  /**
   * Get a task with all its steps.
   *
   * Returns the task along with all associated steps ordered by step_index.
   * This is the primary query for the task execution UI.
   *
   * @param id - Task ID
   * @returns Promise resolving to task with steps
   * @throws Error if task not found
   */
  getWithSteps: async (id: string): Promise<TaskWithSteps> => {
    logger.debug('Getting task with steps', { id });

    try {
      const result = await invoke<TaskWithSteps>('get_task_with_steps', { id });

      logger.info('Task with steps retrieved', {
        id: result.task.id,
        title: result.task.title,
        status: result.task.status,
        stepCount: result.steps.length,
        currentStepIndex: result.task.currentStepIndex,
      });

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Failed to get task with steps', { id, error: errorMessage });
      throw error;
    }
  },

  // ===========================================================================
  // Task Execution Control
  // ===========================================================================

  /**
   * Start executing a task.
   *
   * Validates the task can be started and spawns background execution.
   * The task will continue running autonomously until completion or failure.
   * Monitor progress via events or polling.
   *
   * @param id - Task ID to start
   * @returns Promise resolving to the updated task
   * @throws Error if task is not in a startable state
   */
  start: async (id: string): Promise<Task> => {
    logger.debug('Starting task', { id });

    try {
      const task = await invoke<Task>('start_task', { id });

      logger.info('Task started', {
        id: task.id,
        title: task.title,
        status: task.status,
      });

      return task;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Failed to start task', { id, error: errorMessage });
      throw error;
    }
  },

  /**
   * Pause a running task.
   *
   * Kills the current agent if running and marks the task as paused.
   * The current step will be marked as failed (interrupted).
   * Use resume() to continue execution.
   *
   * @param id - Task ID to pause
   * @returns Promise resolving to the updated task
   * @throws Error if task is not running
   */
  pause: async (id: string): Promise<Task> => {
    logger.debug('Pausing task', { id });

    try {
      const task = await invoke<Task>('pause_task', { id });

      logger.info('Task paused', {
        id: task.id,
        title: task.title,
        status: task.status,
      });

      return task;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Failed to pause task', { id, error: errorMessage });
      throw error;
    }
  },

  /**
   * Resume a paused task.
   *
   * Continues execution from the current step.
   * If the current step was marked as failed during pause,
   * it will be reset to pending and re-executed.
   *
   * @param id - Task ID to resume
   * @returns Promise resolving to the updated task
   * @throws Error if task is not paused
   */
  resume: async (id: string): Promise<Task> => {
    logger.debug('Resuming task', { id });

    try {
      const task = await invoke<Task>('resume_task', { id });

      logger.info('Task resumed', {
        id: task.id,
        title: task.title,
        status: task.status,
      });

      return task;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Failed to resume task', { id, error: errorMessage });
      throw error;
    }
  },

  /**
   * Cancel a task.
   *
   * Kills the current agent if running and marks the task as cancelled.
   * Remaining pending steps will be marked as skipped.
   * This is a terminal state - the task cannot be resumed.
   *
   * @param id - Task ID to cancel
   * @returns Promise resolving to the updated task
   * @throws Error if task is already in a terminal state
   */
  cancel: async (id: string): Promise<Task> => {
    logger.debug('Cancelling task', { id });

    try {
      const task = await invoke<Task>('cancel_task', { id });

      logger.info('Task cancelled', {
        id: task.id,
        title: task.title,
        status: task.status,
      });

      return task;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Failed to cancel task', { id, error: errorMessage });
      throw error;
    }
  },

  /**
   * Check if a task is currently running.
   *
   * @param id - Task ID to check
   * @returns Promise resolving to true if running
   */
  isRunning: async (id: string): Promise<boolean> => {
    logger.debug('Checking if task is running', { id });

    try {
      const running = await invoke<boolean>('is_task_running', { id });

      logger.debug('Task running status', { id, running });

      return running;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Failed to check task running status', { id, error: errorMessage });
      throw error;
    }
  },

  /**
   * Get count of currently running tasks.
   *
   * @returns Promise resolving to the count
   */
  runningCount: async (): Promise<number> => {
    logger.debug('Getting running task count');

    try {
      const count = await invoke<number>('running_task_count');

      logger.debug('Running task count', { count });

      return count;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Failed to get running task count', { error: errorMessage });
      throw error;
    }
  },

  /**
   * List IDs of currently running tasks.
   *
   * @returns Promise resolving to array of task IDs
   */
  listRunning: async (): Promise<string[]> => {
    logger.debug('Listing running tasks');

    try {
      const ids = await invoke<string[]>('list_running_tasks');

      logger.debug('Running tasks listed', { count: ids.length });

      return ids;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Failed to list running tasks', { error: errorMessage });
      throw error;
    }
  },

  // ===========================================================================
  // Task Step Queries
  // ===========================================================================

  /**
   * Create a step for a task.
   *
   * Steps define the execution sequence for a task.
   * Each step has a prompt that will be sent to the configured provider.
   *
   * @param taskId - Parent task ID
   * @param request - Step creation request
   * @returns Promise resolving to the created step
   */
  createStep: async (taskId: string, request: CreateStepRequest): Promise<TaskStep> => {
    logger.debug('Creating task step', {
      taskId,
      stepIndex: request.stepIndex,
      title: request.title,
      providerId: request.providerId,
    });

    try {
      const step = await invoke<TaskStep>('create_task_step', { taskId, request });

      logger.info('Task step created', {
        id: step.id,
        taskId: step.taskId,
        stepIndex: step.stepIndex,
        title: step.title,
      });

      return step;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Failed to create task step', { taskId, error: errorMessage });
      throw error;
    }
  },

  /**
   * Get a specific step by ID.
   *
   * @param id - Step ID
   * @returns Promise resolving to the step
   * @throws Error if step not found
   */
  getStep: async (id: string): Promise<TaskStep> => {
    logger.debug('Getting task step', { id });

    try {
      const step = await invoke<TaskStep>('get_task_step', { id });

      logger.debug('Task step retrieved', {
        id: step.id,
        taskId: step.taskId,
        stepIndex: step.stepIndex,
        status: step.status,
      });

      return step;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Failed to get task step', { id, error: errorMessage });
      throw error;
    }
  },

  /**
   * List all steps for a task.
   *
   * Returns steps ordered by step_index (ascending).
   *
   * @param taskId - Task ID
   * @returns Promise resolving to array of steps
   */
  listSteps: async (taskId: string): Promise<TaskStep[]> => {
    logger.debug('Listing task steps', { taskId });

    try {
      const steps = await invoke<TaskStep[]>('list_task_steps', { taskId });

      logger.debug('Task steps listed', {
        taskId,
        count: steps.length,
        statuses: steps.reduce(
          (acc, s) => {
            acc[s.status] = (acc[s.status] || 0) + 1;
            return acc;
          },
          {} as Record<string, number>
        ),
      });

      return steps;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Failed to list task steps', { taskId, error: errorMessage });
      throw error;
    }
  },

  /**
   * Delete a specific step.
   *
   * @param id - Step ID to delete
   * @returns Promise resolving when deletion is complete
   * @throws Error if step not found
   */
  deleteStep: async (id: string): Promise<void> => {
    logger.debug('Deleting task step', { id });

    try {
      await invoke<void>('delete_task_step', { id });

      logger.info('Task step deleted', { id });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Failed to delete task step', { id, error: errorMessage });
      throw error;
    }
  },

  /**
   * Delete all steps for a task.
   *
   * @param taskId - Task ID
   * @returns Promise resolving to the number of steps deleted
   */
  deleteAllSteps: async (taskId: string): Promise<number> => {
    logger.debug('Deleting all task steps', { taskId });

    try {
      const count = await invoke<number>('delete_all_task_steps', { taskId });

      logger.info('All task steps deleted', { taskId, count });

      return count;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Failed to delete all task steps', { taskId, error: errorMessage });
      throw error;
    }
  },

  // ===========================================================================
  // Task Event Queries
  // ===========================================================================

  /**
   * Get agent events for a task step.
   *
   * Returns events for the session linked to the step at the given index.
   * Use afterSequence to get only new events since the last fetch (for polling).
   *
   * @param taskId - Task ID
   * @param stepIndex - Step index (0-based)
   * @param afterSequence - Only return events with sequence > this value
   * @returns Promise resolving to array of events
   */
  getStepEvents: async (
    taskId: string,
    stepIndex: number,
    afterSequence?: number
  ): Promise<AgentEventRecord[]> => {
    logger.debug('Getting task step events', { taskId, stepIndex, afterSequence });

    try {
      const events = await invoke<AgentEventRecord[]>('get_task_step_events', {
        taskId,
        stepIndex,
        afterSequence,
      });

      logger.debug('Task step events retrieved', {
        taskId,
        stepIndex,
        count: events.length,
        latestSequence: events.length > 0 ? events[events.length - 1]?.sequence : null,
      });

      return events;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Failed to get task step events', {
        taskId,
        stepIndex,
        error: errorMessage,
      });
      throw error;
    }
  },

  // ===========================================================================
  // Permission Queries
  // ===========================================================================

  /**
   * Get the pending permission for a running task.
   *
   * Returns the current pending permission request if one exists.
   * Used to show permission UI when agent requests user approval.
   *
   * @param taskId - Task ID
   * @returns Promise resolving to the permission or null if none pending
   */
  getPendingPermission: async (taskId: string): Promise<Permission | null> => {
    logger.debug('Getting pending permission', { taskId });

    try {
      const permission = await invoke<Permission | null>('get_task_pending_permission', {
        taskId,
      });

      if (permission) {
        logger.debug('Pending permission found', {
          taskId,
          permissionId: permission.id,
          toolName: permission.toolName,
        });
      } else {
        logger.debug('No pending permission', { taskId });
      }

      return permission;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Failed to get pending permission', { taskId, error: errorMessage });
      throw error;
    }
  },

  /**
   * Respond to a permission request.
   *
   * Approves or denies the permission request and sends the response
   * to the agent. The agent will continue or abort based on the response.
   *
   * @param taskId - Task ID
   * @param permissionId - Permission request ID
   * @param approved - Whether to approve (true) or deny (false)
   * @returns Promise resolving to the updated permission
   */
  respondToPermission: async (
    taskId: string,
    permissionId: string,
    approved: boolean
  ): Promise<Permission> => {
    logger.debug('Responding to permission', { taskId, permissionId, approved });

    try {
      const permission = await invoke<Permission>('respond_to_task_permission', {
        taskId,
        permissionId,
        approved,
      });

      logger.info('Permission response sent', {
        taskId,
        permissionId,
        approved,
        status: permission.status,
      });

      return permission;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Failed to respond to permission', {
        taskId,
        permissionId,
        approved,
        error: errorMessage,
      });
      throw error;
    }
  },
};
