import type {
  Chat,
  ChatWithMessages,
  CreateChatRequest,
  ExecutionProcess,
  UpdateChatRequest,
} from '@openflow/generated';
import { createChatSchema, updateChatSchema } from '@openflow/validation';
import { invoke } from './utils.js';

/**
 * Chat query wrappers for Tauri IPC.
 * Thin wrappers around invoke() calls with type safety.
 * Input validation is performed using Zod schemas before invoking Tauri commands.
 */
export const chatQueries = {
  /**
   * List all chats for a task.
   * @param taskId - Task ID to filter chats
   */
  list: (taskId: string): Promise<Chat[]> => invoke('list_chats', { taskId }),

  /**
   * List standalone chats for a project (chats without a task).
   * @param projectId - Project ID to filter chats
   */
  listStandalone: (projectId: string): Promise<Chat[]> =>
    invoke('list_standalone_chats', { projectId }),

  /**
   * List all chats for a project (both task-linked and standalone).
   * @param projectId - Project ID to filter chats
   */
  listByProject: (projectId: string): Promise<Chat[]> =>
    invoke('list_chats_by_project', { projectId }),

  /**
   * Get a single chat by ID with its messages.
   */
  get: (id: string): Promise<ChatWithMessages> => invoke('get_chat', { id }),

  /**
   * Create a new chat.
   * Input is validated against createChatSchema before invoking.
   */
  create: (request: CreateChatRequest): Promise<Chat> => {
    const validated = createChatSchema.parse(request);
    return invoke('create_chat', { request: validated });
  },

  /**
   * Update an existing chat.
   * Input is validated against updateChatSchema before invoking.
   */
  update: (id: string, request: UpdateChatRequest): Promise<Chat> => {
    const validated = updateChatSchema.parse(request);
    return invoke('update_chat', { id, request: validated });
  },

  /**
   * Delete a chat by ID.
   * This will cascade delete all associated messages.
   */
  delete: (id: string): Promise<void> => invoke('delete_chat', { id }),

  /**
   * Archive a chat by ID.
   * Archived chats are hidden from list queries.
   */
  archive: (id: string): Promise<Chat> => invoke('archive_chat', { id }),

  /**
   * Unarchive a chat by ID.
   * Makes the chat visible in list queries again.
   */
  unarchive: (id: string): Promise<Chat> => invoke('unarchive_chat', { id }),

  /**
   * List all archived chats across all projects.
   */
  listArchived: (): Promise<Chat[]> => invoke('list_archived_chats'),

  /**
   * Start a workflow step execution for a chat.
   * This triggers the executor to run on the chat's initial prompt.
   * @param chatId - The chat ID to start the workflow step for
   */
  startWorkflowStep: (chatId: string): Promise<ExecutionProcess> =>
    invoke('start_workflow_step', { chatId }),

  /**
   * Toggle the completion status of a workflow step (chat).
   * If the step is incomplete, it will be marked as complete.
   * If the step is complete, it will be marked as incomplete.
   * @param chatId - The chat ID to toggle completion for
   */
  toggleStepComplete: (chatId: string): Promise<Chat> => invoke('toggle_step_complete', { chatId }),
};
