/**
 * Task Execution Hooks
 *
 * React hooks for the task execution system.
 * Wraps taskExecutionQueries with TanStack Query for:
 * - Automatic caching and refetching
 * - Loading and error states
 * - Cache invalidation after mutations
 * - Polling for live updates
 *
 * @example
 * ```tsx
 * // Get task with steps
 * const { data: taskWithSteps, isLoading } = useTaskWithSteps(taskId);
 *
 * // Start task execution
 * const startTask = useStartTask();
 * startTask.mutate(taskId);
 *
 * // Get live events with polling
 * const { data: events } = useTaskStepEvents(taskId, stepIndex, {
 *   afterSequence: lastSequence,
 *   refetchInterval: 500,
 * });
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
import { taskExecutionQueries } from '@openflow/queries';
import { createLogger } from '@openflow/utils';
import {
  type UseMutationResult,
  type UseQueryResult,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { taskKeys } from './useTasks.js';

const logger = createLogger('useTaskExecution');

// =============================================================================
// Query Key Factory
// =============================================================================

/**
 * Query key factory for task execution.
 * Provides structured, hierarchical keys for cache management.
 *
 * Extends taskKeys from useTasks.ts for consistency.
 */
export const taskExecutionKeys = {
  // Base keys inherit from taskKeys
  all: ['tasks'] as const,

  // Task with steps
  withSteps: () => [...taskExecutionKeys.all, 'withSteps'] as const,
  withStepsDetail: (id: string) => [...taskExecutionKeys.withSteps(), id] as const,

  // Steps
  steps: () => [...taskExecutionKeys.all, 'steps'] as const,
  stepsList: (taskId: string) => [...taskExecutionKeys.steps(), 'list', taskId] as const,
  stepsDetail: (id: string) => [...taskExecutionKeys.steps(), 'detail', id] as const,

  // Events
  events: () => [...taskExecutionKeys.all, 'events'] as const,
  stepEvents: (taskId: string, stepIndex: number, afterSequence?: number) =>
    [...taskExecutionKeys.events(), taskId, stepIndex, { afterSequence }] as const,

  // Permissions
  permissions: () => [...taskExecutionKeys.all, 'permissions'] as const,
  pendingPermission: (taskId: string) =>
    [...taskExecutionKeys.permissions(), 'pending', taskId] as const,

  // Running status
  running: () => [...taskExecutionKeys.all, 'running'] as const,
  isRunning: (id: string) => [...taskExecutionKeys.running(), id] as const,
  runningCount: () => [...taskExecutionKeys.running(), 'count'] as const,
  runningList: () => [...taskExecutionKeys.running(), 'list'] as const,
};

// =============================================================================
// Task with Steps Hooks
// =============================================================================

/**
 * Fetch a task with all its steps.
 *
 * @param id - Task ID
 * @param options - Query options (enabled, etc.)
 * @returns Query result with TaskWithSteps
 *
 * @example
 * ```tsx
 * const { data, isLoading, error } = useTaskWithSteps('task-123');
 *
 * if (isLoading) return <Loading />;
 * if (error) return <Error error={error} />;
 *
 * return (
 *   <div>
 *     <h1>{data.task.title}</h1>
 *     <StepList steps={data.steps} />
 *   </div>
 * );
 * ```
 */
export function useTaskWithSteps(
  id: string,
  options?: { enabled?: boolean }
): UseQueryResult<TaskWithSteps> {
  return useQuery({
    queryKey: taskExecutionKeys.withStepsDetail(id),
    queryFn: () => taskExecutionQueries.getWithSteps(id),
    enabled: Boolean(id) && options?.enabled !== false,
  });
}

// =============================================================================
// Task Execution Control Hooks
// =============================================================================

/**
 * Start executing a task.
 *
 * @returns Mutation for starting a task
 *
 * @example
 * ```tsx
 * const startTask = useStartTask();
 *
 * <button
 *   onClick={() => startTask.mutate('task-123')}
 *   disabled={startTask.isPending}
 * >
 *   {startTask.isPending ? 'Starting...' : 'Start Task'}
 * </button>
 * ```
 */
export function useStartTask(): UseMutationResult<Task, Error, string> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => taskExecutionQueries.start(id),
    onSuccess: (task) => {
      logger.info('Task started', { taskId: task.id, status: task.status });
      // Invalidate task queries
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
      queryClient.invalidateQueries({ queryKey: taskKeys.detail(task.id) });
      queryClient.invalidateQueries({ queryKey: taskExecutionKeys.withStepsDetail(task.id) });
      queryClient.invalidateQueries({ queryKey: taskExecutionKeys.running() });
    },
    onError: (error, taskId) => {
      logger.error('Failed to start task', { taskId, error: error.message });
    },
  });
}

/**
 * Pause a running task.
 *
 * @returns Mutation for pausing a task
 */
export function usePauseTask(): UseMutationResult<Task, Error, string> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => taskExecutionQueries.pause(id),
    onSuccess: (task) => {
      logger.info('Task paused', { taskId: task.id, status: task.status });
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
      queryClient.invalidateQueries({ queryKey: taskKeys.detail(task.id) });
      queryClient.invalidateQueries({ queryKey: taskExecutionKeys.withStepsDetail(task.id) });
      queryClient.invalidateQueries({ queryKey: taskExecutionKeys.running() });
    },
    onError: (error, taskId) => {
      logger.error('Failed to pause task', { taskId, error: error.message });
    },
  });
}

/**
 * Resume a paused task.
 *
 * @returns Mutation for resuming a task
 */
export function useResumeTask(): UseMutationResult<Task, Error, string> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => taskExecutionQueries.resume(id),
    onSuccess: (task) => {
      logger.info('Task resumed', { taskId: task.id, status: task.status });
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
      queryClient.invalidateQueries({ queryKey: taskKeys.detail(task.id) });
      queryClient.invalidateQueries({ queryKey: taskExecutionKeys.withStepsDetail(task.id) });
      queryClient.invalidateQueries({ queryKey: taskExecutionKeys.running() });
    },
    onError: (error, taskId) => {
      logger.error('Failed to resume task', { taskId, error: error.message });
    },
  });
}

/**
 * Cancel a task.
 *
 * @returns Mutation for cancelling a task
 */
export function useCancelTask(): UseMutationResult<Task, Error, string> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => taskExecutionQueries.cancel(id),
    onSuccess: (task) => {
      logger.info('Task cancelled', { taskId: task.id, status: task.status });
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
      queryClient.invalidateQueries({ queryKey: taskKeys.detail(task.id) });
      queryClient.invalidateQueries({ queryKey: taskExecutionKeys.withStepsDetail(task.id) });
      queryClient.invalidateQueries({ queryKey: taskExecutionKeys.running() });
    },
    onError: (error, taskId) => {
      logger.error('Failed to cancel task', { taskId, error: error.message });
    },
  });
}

/**
 * Check if a task is currently running.
 *
 * @param id - Task ID
 * @param options - Query options
 * @returns Query result with boolean
 */
export function useIsTaskRunning(
  id: string,
  options?: { enabled?: boolean; refetchInterval?: number }
): UseQueryResult<boolean> {
  return useQuery({
    queryKey: taskExecutionKeys.isRunning(id),
    queryFn: () => taskExecutionQueries.isRunning(id),
    enabled: Boolean(id) && options?.enabled !== false,
    refetchInterval: options?.refetchInterval,
  });
}

/**
 * Get count of currently running tasks.
 *
 * @param options - Query options
 * @returns Query result with count
 */
export function useRunningTaskCount(options?: {
  enabled?: boolean;
  refetchInterval?: number;
}): UseQueryResult<number> {
  return useQuery({
    queryKey: taskExecutionKeys.runningCount(),
    queryFn: () => taskExecutionQueries.runningCount(),
    enabled: options?.enabled !== false,
    refetchInterval: options?.refetchInterval,
  });
}

/**
 * List IDs of currently running tasks.
 *
 * @param options - Query options
 * @returns Query result with array of IDs
 */
export function useRunningTasks(options?: {
  enabled?: boolean;
  refetchInterval?: number;
}): UseQueryResult<string[]> {
  return useQuery({
    queryKey: taskExecutionKeys.runningList(),
    queryFn: () => taskExecutionQueries.listRunning(),
    enabled: options?.enabled !== false,
    refetchInterval: options?.refetchInterval,
  });
}

// =============================================================================
// Task Step Hooks
// =============================================================================

/**
 * Create a step for a task.
 *
 * @returns Mutation for creating a step
 *
 * @example
 * ```tsx
 * const createStep = useCreateTaskStep();
 *
 * createStep.mutate({
 *   taskId: 'task-123',
 *   request: {
 *     stepIndex: 0,
 *     title: 'Implement feature',
 *     prompt: 'Create a new component',
 *     providerId: 'claude-code',
 *   },
 * });
 * ```
 */
export function useCreateTaskStep(): UseMutationResult<
  TaskStep,
  Error,
  { taskId: string; request: CreateStepRequest }
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ taskId, request }) => taskExecutionQueries.createStep(taskId, request),
    onSuccess: (step) => {
      logger.info('Task step created', {
        stepId: step.id,
        taskId: step.taskId,
        stepIndex: step.stepIndex,
      });
      queryClient.invalidateQueries({
        queryKey: taskExecutionKeys.stepsList(step.taskId),
      });
      queryClient.invalidateQueries({
        queryKey: taskExecutionKeys.withStepsDetail(step.taskId),
      });
    },
    onError: (error, variables) => {
      logger.error('Failed to create task step', {
        taskId: variables.taskId,
        error: error.message,
      });
    },
  });
}

/**
 * Get a specific step by ID.
 *
 * @param id - Step ID
 * @param options - Query options
 * @returns Query result with TaskStep
 */
export function useTaskStep(id: string, options?: { enabled?: boolean }): UseQueryResult<TaskStep> {
  return useQuery({
    queryKey: taskExecutionKeys.stepsDetail(id),
    queryFn: () => taskExecutionQueries.getStep(id),
    enabled: Boolean(id) && options?.enabled !== false,
  });
}

/**
 * List all steps for a task.
 *
 * @param taskId - Task ID
 * @param options - Query options
 * @returns Query result with array of TaskStep
 */
export function useTaskSteps(
  taskId: string,
  options?: { enabled?: boolean }
): UseQueryResult<TaskStep[]> {
  return useQuery({
    queryKey: taskExecutionKeys.stepsList(taskId),
    queryFn: () => taskExecutionQueries.listSteps(taskId),
    enabled: Boolean(taskId) && options?.enabled !== false,
  });
}

/**
 * Delete a specific step.
 *
 * @returns Mutation for deleting a step
 */
export function useDeleteTaskStep(): UseMutationResult<
  void,
  Error,
  { id: string; taskId: string }
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id }) => taskExecutionQueries.deleteStep(id),
    onSuccess: (_data, variables) => {
      logger.info('Task step deleted', { stepId: variables.id });
      queryClient.invalidateQueries({
        queryKey: taskExecutionKeys.stepsList(variables.taskId),
      });
      queryClient.invalidateQueries({
        queryKey: taskExecutionKeys.withStepsDetail(variables.taskId),
      });
      queryClient.removeQueries({
        queryKey: taskExecutionKeys.stepsDetail(variables.id),
      });
    },
    onError: (error, variables) => {
      logger.error('Failed to delete task step', {
        stepId: variables.id,
        error: error.message,
      });
    },
  });
}

/**
 * Delete all steps for a task.
 *
 * @returns Mutation for deleting all steps
 */
export function useDeleteAllTaskSteps(): UseMutationResult<number, Error, string> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (taskId: string) => taskExecutionQueries.deleteAllSteps(taskId),
    onSuccess: (count, taskId) => {
      logger.info('All task steps deleted', { taskId, count });
      queryClient.invalidateQueries({
        queryKey: taskExecutionKeys.stepsList(taskId),
      });
      queryClient.invalidateQueries({
        queryKey: taskExecutionKeys.withStepsDetail(taskId),
      });
    },
    onError: (error, taskId) => {
      logger.error('Failed to delete all task steps', { taskId, error: error.message });
    },
  });
}

// =============================================================================
// Task Event Hooks
// =============================================================================

/**
 * Options for useTaskStepEvents hook.
 */
export interface UseTaskStepEventsOptions {
  /** Only return events with sequence > this value */
  afterSequence?: number;
  /** Whether to enable the query */
  enabled?: boolean;
  /** Polling interval in ms (default: disabled) */
  refetchInterval?: number | false;
}

/**
 * Get agent events for a task step.
 *
 * Supports polling for live updates by setting refetchInterval.
 *
 * @param taskId - Task ID
 * @param stepIndex - Step index (0-based)
 * @param options - Query options
 * @returns Query result with array of AgentEventRecord
 *
 * @example
 * ```tsx
 * const [lastSequence, setLastSequence] = useState<number | undefined>();
 *
 * const { data: events } = useTaskStepEvents(taskId, stepIndex, {
 *   afterSequence: lastSequence,
 *   refetchInterval: isRunning ? 500 : false,
 * });
 *
 * // Update lastSequence when new events arrive
 * useEffect(() => {
 *   if (events?.length) {
 *     setLastSequence(events[events.length - 1].sequence);
 *   }
 * }, [events]);
 * ```
 */
export function useTaskStepEvents(
  taskId: string,
  stepIndex: number,
  options?: UseTaskStepEventsOptions
): UseQueryResult<AgentEventRecord[]> {
  return useQuery({
    queryKey: taskExecutionKeys.stepEvents(taskId, stepIndex, options?.afterSequence),
    queryFn: () => taskExecutionQueries.getStepEvents(taskId, stepIndex, options?.afterSequence),
    enabled: Boolean(taskId) && stepIndex >= 0 && options?.enabled !== false,
    refetchInterval: options?.refetchInterval,
  });
}

// =============================================================================
// Permission Hooks
// =============================================================================

/**
 * Get pending permission for a running task.
 *
 * @param taskId - Task ID
 * @param options - Query options
 * @returns Query result with Permission or null
 *
 * @example
 * ```tsx
 * const { data: permission } = usePendingPermission(taskId, {
 *   refetchInterval: isRunning ? 1000 : false,
 * });
 *
 * if (permission) {
 *   return <PermissionDialog permission={permission} />;
 * }
 * ```
 */
export function usePendingPermission(
  taskId: string,
  options?: { enabled?: boolean; refetchInterval?: number | false }
): UseQueryResult<Permission | null> {
  return useQuery({
    queryKey: taskExecutionKeys.pendingPermission(taskId),
    queryFn: () => taskExecutionQueries.getPendingPermission(taskId),
    enabled: Boolean(taskId) && options?.enabled !== false,
    refetchInterval: options?.refetchInterval,
  });
}

/**
 * Respond to a permission request.
 *
 * @returns Mutation for responding to permission
 *
 * @example
 * ```tsx
 * const respondToPermission = useRespondToPermission();
 *
 * <div>
 *   <button onClick={() => respondToPermission.mutate({
 *     taskId,
 *     permissionId: permission.id,
 *     approved: true,
 *   })}>
 *     Approve
 *   </button>
 *   <button onClick={() => respondToPermission.mutate({
 *     taskId,
 *     permissionId: permission.id,
 *     approved: false,
 *   })}>
 *     Deny
 *   </button>
 * </div>
 * ```
 */
export function useRespondToPermission(): UseMutationResult<
  Permission,
  Error,
  { taskId: string; permissionId: string; approved: boolean }
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ taskId, permissionId, approved }) =>
      taskExecutionQueries.respondToPermission(taskId, permissionId, approved),
    onSuccess: (permission, variables) => {
      logger.info('Permission response sent', {
        taskId: variables.taskId,
        permissionId: variables.permissionId,
        approved: variables.approved,
        status: permission.status,
      });
      // Invalidate pending permission query
      queryClient.invalidateQueries({
        queryKey: taskExecutionKeys.pendingPermission(variables.taskId),
      });
      // Also invalidate events as agent may produce new output
      queryClient.invalidateQueries({
        queryKey: taskExecutionKeys.events(),
      });
    },
    onError: (error, variables) => {
      logger.error('Failed to respond to permission', {
        taskId: variables.taskId,
        permissionId: variables.permissionId,
        error: error.message,
      });
    },
  });
}
