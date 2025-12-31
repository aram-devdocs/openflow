import type { CreateMessageRequest, Message } from '@openflow/generated';
import { messageQueries } from '@openflow/queries';
import {
  type UseMutationResult,
  type UseQueryResult,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { chatKeys } from './useChats';

/**
 * Query key factory for messages.
 * Provides structured, hierarchical keys for cache management.
 */
export const messageKeys = {
  all: ['messages'] as const,
  lists: () => [...messageKeys.all, 'list'] as const,
  list: (chatId: string) => [...messageKeys.lists(), { chatId }] as const,
};

/**
 * Fetch all messages for a chat.
 *
 * @param chatId - Chat ID to filter messages
 * @returns Query result with array of messages
 */
export function useMessages(chatId: string): UseQueryResult<Message[]> {
  return useQuery({
    queryKey: messageKeys.list(chatId),
    queryFn: () => messageQueries.list(chatId),
    enabled: Boolean(chatId),
  });
}

/**
 * Create a new message.
 *
 * @returns Mutation for creating a message
 */
export function useCreateMessage(): UseMutationResult<Message, Error, CreateMessageRequest> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: CreateMessageRequest) => messageQueries.create(request),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: messageKeys.list(data.chatId) });
      queryClient.invalidateQueries({ queryKey: chatKeys.detail(data.chatId) });
    },
  });
}
