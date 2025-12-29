import { invoke } from '@tauri-apps/api/core';
import type {
  Chat,
  ChatWithMessages,
  CreateChatRequest,
  ExecutionProcess,
} from '@openflow/generated';

/**
 * Chat query wrappers for Tauri IPC.
 * Thin wrappers around invoke() calls with type safety.
 */
export const chatQueries = {
  /**
   * List all chats for a task.
   * @param taskId - Task ID to filter chats
   */
  list: (taskId: string): Promise<Chat[]> =>
    invoke('list_chats', { taskId }),

  /**
   * Get a single chat by ID with its messages.
   */
  get: (id: string): Promise<ChatWithMessages> => invoke('get_chat', { id }),

  /**
   * Create a new chat.
   */
  create: (request: CreateChatRequest): Promise<Chat> =>
    invoke('create_chat', { request }),

  /**
   * Start a workflow step execution for a chat.
   * This triggers the executor to run on the chat's initial prompt.
   * @param chatId - The chat ID to start the workflow step for
   */
  startWorkflowStep: (chatId: string): Promise<ExecutionProcess> =>
    invoke('start_workflow_step', { chatId }),
};
