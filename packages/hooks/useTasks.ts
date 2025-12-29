import type {
  CreateTaskRequest,
  Task,
  TaskStatus,
  TaskWithChats,
  UpdateTaskRequest,
} from '@openflow/generated';
import { taskQueries } from '@openflow/queries';
import {
  type UseMutationResult,
  type UseQueryResult,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';

/**
 * Query key factory for tasks.
 * Provides structured, hierarchical keys for cache management.
 */
export const taskKeys = {
  all: ['tasks'] as const,
  lists: () => [...taskKeys.all, 'list'] as const,
  list: (projectId: string, status?: TaskStatus) =>
    [...taskKeys.lists(), { projectId, status }] as const,
  details: () => [...taskKeys.all, 'detail'] as const,
  detail: (id: string) => [...taskKeys.details(), id] as const,
};

/**
 * Fetch tasks for a project with optional status filtering.
 *
 * @param projectId - Project ID to filter tasks
 * @param status - Optional status filter
 * @returns Query result with array of tasks
 */
export function useTasks(projectId: string, status?: TaskStatus): UseQueryResult<Task[]> {
  return useQuery({
    queryKey: taskKeys.list(projectId, status),
    queryFn: () => taskQueries.list(projectId, status),
    enabled: Boolean(projectId),
  });
}

/**
 * Fetch a single task by ID with its associated chats.
 *
 * @param id - Task ID to fetch
 * @returns Query result with task and chats data
 */
export function useTask(id: string): UseQueryResult<TaskWithChats> {
  return useQuery({
    queryKey: taskKeys.detail(id),
    queryFn: () => taskQueries.get(id),
    enabled: Boolean(id),
  });
}

/**
 * Create a new task.
 *
 * @returns Mutation for creating a task
 */
export function useCreateTask(): UseMutationResult<Task, Error, CreateTaskRequest> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: CreateTaskRequest) => taskQueries.create(request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
    },
  });
}

/**
 * Update an existing task.
 *
 * @returns Mutation for updating a task
 */
export function useUpdateTask(): UseMutationResult<
  Task,
  Error,
  { id: string; request: UpdateTaskRequest }
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, request }) => taskQueries.update(id, request),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
      queryClient.invalidateQueries({ queryKey: taskKeys.detail(data.id) });
    },
  });
}

/**
 * Archive a task (soft delete).
 *
 * @returns Mutation for archiving a task
 */
export function useArchiveTask(): UseMutationResult<Task, Error, string> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => taskQueries.archive(id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
      queryClient.invalidateQueries({ queryKey: taskKeys.detail(data.id) });
    },
  });
}

/**
 * Permanently delete a task.
 *
 * @returns Mutation for deleting a task
 */
export function useDeleteTask(): UseMutationResult<void, Error, string> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => taskQueries.delete(id),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
      queryClient.removeQueries({ queryKey: taskKeys.detail(id) });
    },
  });
}

/**
 * Fetch archived tasks across all projects or for a specific project.
 *
 * @param projectId - Optional project ID to filter archived tasks
 * @returns Query result with array of archived tasks
 */
export function useArchivedTasks(projectId?: string): UseQueryResult<Task[]> {
  return useQuery({
    queryKey: [...taskKeys.lists(), { archived: true, projectId }] as const,
    queryFn: () => taskQueries.list(projectId ?? '', undefined, true),
  });
}

/**
 * Restore an archived task.
 *
 * @returns Mutation for restoring an archived task
 */
export function useRestoreTask(): UseMutationResult<Task, Error, { id: string }> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id }) => taskQueries.unarchive(id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
      queryClient.invalidateQueries({ queryKey: taskKeys.detail(data.id) });
    },
  });
}
