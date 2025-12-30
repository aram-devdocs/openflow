import type { CreateMessageRequest, Message } from '@openflow/generated';
import { invoke } from './utils.js';

/**
 * Message query wrappers for Tauri IPC.
 * Thin wrappers around invoke() calls with type safety.
 */
export const messageQueries = {
  /**
   * List all messages for a chat.
   * @param chatId - Chat ID to filter messages
   */
  list: (chatId: string): Promise<Message[]> => invoke('list_messages', { chatId }),

  /**
   * Create a new message.
   */
  create: (request: CreateMessageRequest): Promise<Message> =>
    invoke('create_message', { request }),
};
