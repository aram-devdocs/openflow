/**
 * useMessages - Hooks for message operations
 *
 * This module provides React Query hooks for fetching and creating messages
 * within chat sessions.
 *
 * Features:
 * - Full logging at DEBUG/INFO/ERROR levels
 * - Proper error handling with try/catch patterns
 * - Toast notifications for mutations
 * - Structured query keys for cache management
 */

import type { CreateMessageRequest, Message } from '@openflow/generated';
import { messageQueries } from '@openflow/queries';
import { createLogger } from '@openflow/utils';
import {
  type UseMutationResult,
  type UseQueryResult,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { chatKeys } from './useChats';
import { useToast } from './useToast';

// ============================================================================
// Logger
// ============================================================================

const logger = createLogger('useMessages');

// ============================================================================
// Query Keys
// ============================================================================

/**
 * Query key factory for messages.
 * Provides structured, hierarchical keys for cache management.
 */
export const messageKeys = {
  all: ['messages'] as const,
  lists: () => [...messageKeys.all, 'list'] as const,
  list: (chatId: string) => [...messageKeys.lists(), { chatId }] as const,
};

// ============================================================================
// Hook Options
// ============================================================================

/**
 * Options for useMessages hook.
 */
export interface UseMessagesOptions {
  /** Whether the query should execute (default: true when chatId is provided) */
  enabled?: boolean;
  /** Stale time in milliseconds (default: 5000) */
  staleTime?: number;
}

// ============================================================================
// Hooks
// ============================================================================

/**
 * Fetch all messages for a chat.
 *
 * Retrieves the message history for a specific chat session.
 * Messages are cached and can be configured with stale time.
 *
 * @param chatId - Chat ID to filter messages
 * @param options - Optional query configuration
 * @returns Query result with array of messages
 *
 * @example
 * ```tsx
 * // Basic usage
 * const { data: messages, isLoading } = useMessages(chatId);
 *
 * // With custom options
 * const { data: messages } = useMessages(chatId, {
 *   enabled: Boolean(chatId) && isActive,
 *   staleTime: 10000,
 * });
 * ```
 */
export function useMessages(
  chatId: string,
  options: UseMessagesOptions = {}
): UseQueryResult<Message[]> {
  const { enabled = true, staleTime = 5000 } = options;

  logger.debug('useMessages hook called', {
    chatId,
    enabled: enabled && Boolean(chatId),
    staleTime,
  });

  return useQuery({
    queryKey: messageKeys.list(chatId),
    queryFn: async () => {
      logger.debug('Fetching messages for chat', { chatId });
      try {
        const messages = await messageQueries.list(chatId);
        logger.info('Messages fetched successfully', {
          chatId,
          messageCount: messages.length,
          // Log role distribution for debugging
          roleBreakdown: messages.reduce(
            (acc, msg) => {
              acc[msg.role] = (acc[msg.role] || 0) + 1;
              return acc;
            },
            {} as Record<string, number>
          ),
        });
        return messages;
      } catch (error) {
        logger.error('Failed to fetch messages', {
          chatId,
          error: error instanceof Error ? error.message : String(error),
        });
        throw error; // Re-throw for React Query to handle
      }
    },
    enabled: enabled && Boolean(chatId),
    staleTime,
  });
}

/**
 * Create a new message.
 *
 * Creates a message in a chat session. On success, invalidates both
 * the message list and the chat detail to ensure UI consistency.
 *
 * @returns Mutation for creating a message
 *
 * @example
 * ```tsx
 * const createMessage = useCreateMessage();
 *
 * const handleSend = async (content: string) => {
 *   await createMessage.mutateAsync({
 *     chatId,
 *     role: 'user',
 *     content,
 *   });
 * };
 * ```
 */
export function useCreateMessage(): UseMutationResult<Message, Error, CreateMessageRequest> {
  const queryClient = useQueryClient();
  const toast = useToast();

  logger.debug('useCreateMessage hook initialized');

  return useMutation({
    mutationFn: async (request: CreateMessageRequest) => {
      logger.debug('Creating message', {
        chatId: request.chatId,
        role: request.role,
        contentLength: request.content?.length ?? 0,
      });
      try {
        const message = await messageQueries.create(request);
        logger.info('Message created successfully', {
          messageId: message.id,
          chatId: message.chatId,
          role: message.role,
        });
        return message;
      } catch (error) {
        logger.error('Failed to create message', {
          chatId: request.chatId,
          role: request.role,
          error: error instanceof Error ? error.message : String(error),
        });
        throw error; // Re-throw for React Query to handle
      }
    },
    onSuccess: (data) => {
      logger.debug('Invalidating message and chat queries', {
        chatId: data.chatId,
      });
      queryClient.invalidateQueries({ queryKey: messageKeys.list(data.chatId) });
      queryClient.invalidateQueries({ queryKey: chatKeys.detail(data.chatId) });
    },
    onError: (error) => {
      toast.error(
        'Failed to send message',
        error instanceof Error ? error.message : 'Unknown error'
      );
    },
  });
}
