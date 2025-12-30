import type {
  Chat,
  ChatWithMessages,
  CreateChatRequest,
  ExecutionProcess,
  UpdateChatRequest,
} from '@openflow/generated';
import { chatQueries } from '@openflow/queries';
import {
  type UseMutationResult,
  type UseQueryResult,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { taskKeys } from './useTasks';

/**
 * Query key factory for chats.
 * Provides structured, hierarchical keys for cache management.
 */
export const chatKeys = {
  all: ['chats'] as const,
  lists: () => [...chatKeys.all, 'list'] as const,
  list: (taskId: string) => [...chatKeys.lists(), { taskId }] as const,
  standalone: (projectId: string) => [...chatKeys.lists(), 'standalone', { projectId }] as const,
  byProject: (projectId: string) => [...chatKeys.lists(), 'project', { projectId }] as const,
  archived: () => [...chatKeys.lists(), 'archived'] as const,
  details: () => [...chatKeys.all, 'detail'] as const,
  detail: (id: string) => [...chatKeys.details(), id] as const,
};

/**
 * Fetch all chats for a task.
 *
 * @param taskId - Task ID to filter chats
 * @returns Query result with array of chats
 */
export function useChats(taskId: string): UseQueryResult<Chat[]> {
  return useQuery({
    queryKey: chatKeys.list(taskId),
    queryFn: () => chatQueries.list(taskId),
    enabled: Boolean(taskId),
  });
}

/**
 * Fetch standalone chats for a project (chats without a task).
 *
 * @param projectId - Project ID to filter chats
 * @returns Query result with array of standalone chats
 */
export function useStandaloneChats(projectId: string): UseQueryResult<Chat[]> {
  return useQuery({
    queryKey: chatKeys.standalone(projectId),
    queryFn: () => chatQueries.listStandalone(projectId),
    enabled: Boolean(projectId),
  });
}

/**
 * Fetch all chats for a project (both task-linked and standalone).
 *
 * @param projectId - Project ID to filter chats
 * @returns Query result with array of all chats
 */
export function useChatsByProject(projectId: string): UseQueryResult<Chat[]> {
  return useQuery({
    queryKey: chatKeys.byProject(projectId),
    queryFn: () => chatQueries.listByProject(projectId),
    enabled: Boolean(projectId),
  });
}

/**
 * Fetch all archived chats across all projects.
 *
 * @returns Query result with array of archived chats
 */
export function useArchivedChats(): UseQueryResult<Chat[]> {
  return useQuery({
    queryKey: chatKeys.archived(),
    queryFn: () => chatQueries.listArchived(),
  });
}

/**
 * Fetch a single chat by ID with its messages.
 *
 * @param id - Chat ID to fetch
 * @returns Query result with chat and messages data
 */
export function useChat(id: string): UseQueryResult<ChatWithMessages> {
  return useQuery({
    queryKey: chatKeys.detail(id),
    queryFn: () => chatQueries.get(id),
    enabled: Boolean(id),
  });
}

/**
 * Create a new chat.
 *
 * @returns Mutation for creating a chat
 */
export function useCreateChat(): UseMutationResult<Chat, Error, CreateChatRequest> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: CreateChatRequest) => {
      if (import.meta.env.DEV) {
        console.log('[useCreateChat] Creating chat:', {
          projectId: request.projectId,
          taskId: request.taskId,
          title: request.title,
          isStandalone: !request.taskId,
        });
      }
      return chatQueries.create(request);
    },
    onSuccess: (data) => {
      if (import.meta.env.DEV) {
        console.log('[useCreateChat] Chat created:', {
          id: data.id,
          projectId: data.projectId,
          taskId: data.taskId,
          isStandalone: !data.taskId,
        });
      }
      // Invalidate task-specific list if this is a task-linked chat
      if (data.taskId) {
        queryClient.invalidateQueries({ queryKey: chatKeys.list(data.taskId) });
        queryClient.invalidateQueries({ queryKey: taskKeys.detail(data.taskId) });
      }
      // Always invalidate project-level lists
      queryClient.invalidateQueries({ queryKey: chatKeys.standalone(data.projectId) });
      queryClient.invalidateQueries({ queryKey: chatKeys.byProject(data.projectId) });
    },
    onError: (error) => {
      if (import.meta.env.DEV) {
        console.error('[useCreateChat] Failed to create chat:', error);
      }
    },
  });
}

/**
 * Start a workflow step execution for a chat.
 * Triggers the executor to run on the chat's initial prompt.
 *
 * @returns Mutation for starting a workflow step
 */
export function useStartWorkflowStep(): UseMutationResult<ExecutionProcess, Error, string> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (chatId: string) => chatQueries.startWorkflowStep(chatId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: chatKeys.detail(data.chatId) });
    },
  });
}

/**
 * Update an existing chat.
 *
 * @returns Mutation for updating a chat
 */
export function useUpdateChat(): UseMutationResult<
  Chat,
  Error,
  { id: string; request: UpdateChatRequest }
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, request }) => chatQueries.update(id, request),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: chatKeys.detail(data.id) });
      // Also invalidate list caches
      if (data.taskId) {
        queryClient.invalidateQueries({ queryKey: chatKeys.list(data.taskId) });
      }
      queryClient.invalidateQueries({ queryKey: chatKeys.standalone(data.projectId) });
      queryClient.invalidateQueries({ queryKey: chatKeys.byProject(data.projectId) });
    },
  });
}

/**
 * Delete a chat by ID.
 * This will cascade delete all associated messages.
 *
 * @returns Mutation for deleting a chat
 */
export function useDeleteChat(): UseMutationResult<
  void,
  Error,
  { id: string; projectId: string; taskId?: string }
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id }) => chatQueries.delete(id),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: chatKeys.detail(variables.id) });
      if (variables.taskId) {
        queryClient.invalidateQueries({ queryKey: chatKeys.list(variables.taskId) });
        queryClient.invalidateQueries({ queryKey: taskKeys.detail(variables.taskId) });
      }
      queryClient.invalidateQueries({ queryKey: chatKeys.standalone(variables.projectId) });
      queryClient.invalidateQueries({ queryKey: chatKeys.byProject(variables.projectId) });
    },
  });
}

/**
 * Archive a chat by ID.
 * Archived chats are hidden from list queries.
 *
 * @returns Mutation for archiving a chat
 */
export function useArchiveChat(): UseMutationResult<Chat, Error, string> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => chatQueries.archive(id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: chatKeys.detail(data.id) });
      if (data.taskId) {
        queryClient.invalidateQueries({ queryKey: chatKeys.list(data.taskId) });
        queryClient.invalidateQueries({ queryKey: taskKeys.detail(data.taskId) });
      }
      queryClient.invalidateQueries({ queryKey: chatKeys.standalone(data.projectId) });
      queryClient.invalidateQueries({ queryKey: chatKeys.byProject(data.projectId) });
      queryClient.invalidateQueries({ queryKey: chatKeys.archived() });
    },
  });
}

/**
 * Unarchive a chat by ID.
 * Makes the chat visible in list queries again.
 *
 * @returns Mutation for unarchiving a chat
 */
export function useUnarchiveChat(): UseMutationResult<Chat, Error, string> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => chatQueries.unarchive(id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: chatKeys.detail(data.id) });
      if (data.taskId) {
        queryClient.invalidateQueries({ queryKey: chatKeys.list(data.taskId) });
        queryClient.invalidateQueries({ queryKey: taskKeys.detail(data.taskId) });
      }
      queryClient.invalidateQueries({ queryKey: chatKeys.standalone(data.projectId) });
      queryClient.invalidateQueries({ queryKey: chatKeys.byProject(data.projectId) });
      queryClient.invalidateQueries({ queryKey: chatKeys.archived() });
    },
  });
}
