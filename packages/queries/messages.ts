import type { CreateMessageRequest, Message } from '@openflow/generated';
import { createMessageSchema } from '@openflow/validation';
import { invoke } from './utils.js';

/**
 * Message query wrappers for Tauri IPC.
 * Thin wrappers around invoke() calls with type safety.
 * Input validation is performed using Zod schemas before invoking Tauri commands.
 */
export const messageQueries = {
  /**
   * List all messages for a chat.
   * @param chatId - Chat ID to filter messages
   */
  list: (chatId: string): Promise<Message[]> => invoke('list_messages', { chatId }),

  /**
   * Create a new message.
   * Input is validated against createMessageSchema before invoking.
   */
  create: (request: CreateMessageRequest): Promise<Message> => {
    const validated = createMessageSchema.parse(request);
    return invoke('create_message', { request: validated });
  },
};
