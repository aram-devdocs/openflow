import type { CreateMessageRequest, Message } from '@openflow/generated';
import { createLogger } from '@openflow/utils';
import { createMessageSchema } from '@openflow/validation';
import { invoke } from './utils.js';

/**
 * Logger for message queries.
 * Uses 'queries:messages' context for filtering and identification.
 */
const logger = createLogger('queries:messages');

/**
 * Message query wrappers for Tauri IPC.
 * Thin wrappers around invoke() calls with type safety.
 * Input validation is performed using Zod schemas before invoking Tauri commands.
 *
 * All functions include:
 * - Try/catch error handling with re-throw for React Query
 * - Logging at DEBUG (call), INFO (success), ERROR (failure) levels
 *
 * @example
 * ```ts
 * // List messages for a chat
 * const messages = await messageQueries.list('chat-123');
 *
 * // Create a new message
 * const message = await messageQueries.create({
 *   chatId: 'chat-123',
 *   role: 'user',
 *   content: 'Hello, world!',
 * });
 * ```
 */
export const messageQueries = {
  /**
   * List all messages for a chat.
   *
   * @param chatId - Chat ID to filter messages
   * @returns Array of messages for the chat, ordered by creation time
   * @throws Error if the query fails
   *
   * @example
   * ```ts
   * const messages = await messageQueries.list('chat-123');
   * console.log(`Found ${messages.length} messages`);
   * ```
   */
  list: async (chatId: string): Promise<Message[]> => {
    logger.debug('Listing messages', { chatId });

    try {
      const messages = await invoke<Message[]>('list_messages', { chatId });

      // Count messages by role for informative logging
      const roleCounts = messages.reduce(
        (acc, msg) => {
          acc[msg.role] = (acc[msg.role] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      );

      logger.info('Listed messages successfully', {
        chatId,
        count: messages.length,
        byRole: roleCounts,
      });

      return messages;
    } catch (error) {
      logger.error('Failed to list messages', {
        chatId,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  },

  /**
   * Create a new message.
   * Input is validated against createMessageSchema before invoking.
   *
   * @param request - Message creation request with chatId, role, and content
   * @returns The newly created message
   * @throws Error if validation fails or the mutation fails
   *
   * @example
   * ```ts
   * const message = await messageQueries.create({
   *   chatId: 'chat-123',
   *   role: 'user',
   *   content: 'What is the weather today?',
   * });
   * console.log(`Created message ${message.id}`);
   * ```
   */
  create: async (request: CreateMessageRequest): Promise<Message> => {
    logger.debug('Creating message', {
      chatId: request.chatId,
      role: request.role,
      contentLength: request.content?.length ?? 0,
    });

    try {
      const validated = createMessageSchema.parse(request);
      const message = await invoke<Message>('create_message', {
        request: validated,
      });

      logger.info('Created message successfully', {
        messageId: message.id,
        chatId: message.chatId,
        role: message.role,
        contentLength: message.content?.length ?? 0,
      });

      return message;
    } catch (error) {
      logger.error('Failed to create message', {
        chatId: request.chatId,
        role: request.role,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  },
};
