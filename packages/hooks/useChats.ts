import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryResult,
  type UseMutationResult,
} from '@tanstack/react-query';
import { chatQueries } from '@openflow/queries';
import type {
  Chat,
  ChatWithMessages,
  CreateChatRequest,
  ExecutionProcess,
} from '@openflow/generated';
import { taskKeys } from './useTasks';

/**
 * Query key factory for chats.
 * Provides structured, hierarchical keys for cache management.
 */
export const chatKeys = {
  all: ['chats'] as const,
  lists: () => [...chatKeys.all, 'list'] as const,
  list: (taskId: string) => [...chatKeys.lists(), { taskId }] as const,
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
export function useCreateChat(): UseMutationResult<
  Chat,
  Error,
  CreateChatRequest
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: CreateChatRequest) => chatQueries.create(request),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: chatKeys.list(data.taskId) });
      queryClient.invalidateQueries({ queryKey: taskKeys.detail(data.taskId) });
    },
  });
}

/**
 * Start a workflow step execution for a chat.
 * Triggers the executor to run on the chat's initial prompt.
 *
 * @returns Mutation for starting a workflow step
 */
export function useStartWorkflowStep(): UseMutationResult<
  ExecutionProcess,
  Error,
  string
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (chatId: string) => chatQueries.startWorkflowStep(chatId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: chatKeys.detail(data.chatId) });
    },
  });
}
