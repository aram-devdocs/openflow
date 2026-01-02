import type {
  Chat,
  ChatWithMessages,
  CreateChatRequest,
  ExecutionProcess,
  UpdateChatRequest,
} from '@openflow/generated';
import { createLogger } from '@openflow/utils';
import { createChatSchema, updateChatSchema } from '@openflow/validation';
import { invoke } from './utils.js';

/**
 * Logger for chat query operations.
 * Logs at DEBUG level for query calls, INFO for successes, ERROR for failures.
 */
const logger = createLogger('queries:chats');

/**
 * Chat query wrappers for Tauri IPC.
 * Thin wrappers around invoke() calls with type safety.
 * Input validation is performed using Zod schemas before invoking Tauri commands.
 *
 * All functions include:
 * - Try/catch error handling with re-throw for React Query
 * - Logging at appropriate levels (DEBUG on call, INFO on success, ERROR on failure)
 * - Input validation via Zod schemas for mutations
 *
 * @example
 * ```ts
 * // List all chats for a task
 * const chats = await chatQueries.list('task-123');
 *
 * // Get a single chat with messages
 * const chat = await chatQueries.get('chat-456');
 *
 * // Create a new chat
 * const newChat = await chatQueries.create({
 *   projectId: 'project-123',
 *   title: 'New Discussion',
 * });
 *
 * // Archive a chat
 * await chatQueries.archive('chat-456');
 * ```
 */
export const chatQueries = {
  /**
   * List all chats for a task.
   * @param taskId - Task ID to filter chats
   * @returns Promise resolving to array of chats
   * @throws Error if the query fails (re-thrown for React Query)
   */
  list: async (taskId: string): Promise<Chat[]> => {
    logger.debug('Listing chats for task', { taskId });

    try {
      const chats = await invoke<Chat[]>('list_chats', { taskId });

      logger.info('Chats listed successfully', {
        taskId,
        count: chats.length,
        titles: chats.slice(0, 3).map((c) => c.title),
        hasMore: chats.length > 3,
      });

      return chats;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Failed to list chats', {
        taskId,
        error: errorMessage,
      });
      throw error;
    }
  },

  /**
   * List standalone chats for a project (chats without a task).
   * @param projectId - Project ID to filter chats
   * @returns Promise resolving to array of standalone chats
   * @throws Error if the query fails (re-thrown for React Query)
   */
  listStandalone: async (projectId: string): Promise<Chat[]> => {
    logger.debug('Listing standalone chats for project', { projectId });

    try {
      const chats = await invoke<Chat[]>('list_standalone_chats', { projectId });

      logger.info('Standalone chats listed successfully', {
        projectId,
        count: chats.length,
        titles: chats.slice(0, 3).map((c) => c.title),
        hasMore: chats.length > 3,
      });

      return chats;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Failed to list standalone chats', {
        projectId,
        error: errorMessage,
      });
      throw error;
    }
  },

  /**
   * List all chats for a project (both task-linked and standalone).
   * @param projectId - Project ID to filter chats
   * @returns Promise resolving to array of all project chats
   * @throws Error if the query fails (re-thrown for React Query)
   */
  listByProject: async (projectId: string): Promise<Chat[]> => {
    logger.debug('Listing all chats for project', { projectId });

    try {
      const chats = await invoke<Chat[]>('list_chats_by_project', { projectId });

      logger.info('Project chats listed successfully', {
        projectId,
        count: chats.length,
        titles: chats.slice(0, 3).map((c) => c.title),
        hasMore: chats.length > 3,
      });

      return chats;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Failed to list chats by project', {
        projectId,
        error: errorMessage,
      });
      throw error;
    }
  },

  /**
   * Get a single chat by ID with its messages.
   * @param id - Chat ID
   * @returns Promise resolving to chat with messages
   * @throws Error if the query fails (re-thrown for React Query)
   */
  get: async (id: string): Promise<ChatWithMessages> => {
    logger.debug('Getting chat', { id });

    try {
      const result = await invoke<ChatWithMessages>('get_chat', { id });

      logger.info('Chat retrieved successfully', {
        id,
        title: result.title,
        messageCount: result.messages.length,
        hasTask: !!result.taskId,
      });

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Failed to get chat', {
        id,
        error: errorMessage,
      });
      throw error;
    }
  },

  /**
   * Create a new chat.
   * Input is validated against createChatSchema before invoking.
   * @param request - Chat creation request
   * @returns Promise resolving to the created chat
   * @throws Error if validation or query fails (re-thrown for React Query)
   */
  create: async (request: CreateChatRequest): Promise<Chat> => {
    logger.debug('Creating chat', {
      projectId: request.projectId,
      taskId: request.taskId,
      hasTitle: !!request.title,
      hasWorkflowStep: !!request.workflowStepIndex,
    });

    try {
      const validated = createChatSchema.parse(request);
      const chat = await invoke<Chat>('create_chat', { request: validated });

      logger.info('Chat created successfully', {
        id: chat.id,
        title: chat.title,
        projectId: chat.projectId,
        taskId: chat.taskId,
      });

      return chat;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Failed to create chat', {
        projectId: request.projectId,
        taskId: request.taskId,
        error: errorMessage,
      });
      throw error;
    }
  },

  /**
   * Update an existing chat.
   * Input is validated against updateChatSchema before invoking.
   * @param id - Chat ID to update
   * @param request - Update request with fields to change
   * @returns Promise resolving to the updated chat
   * @throws Error if validation or query fails (re-thrown for React Query)
   */
  update: async (id: string, request: UpdateChatRequest): Promise<Chat> => {
    logger.debug('Updating chat', {
      id,
      hasTitle: 'title' in request,
      hasSetupCompleted: 'setupCompletedAt' in request,
    });

    try {
      const validated = updateChatSchema.parse(request);
      const chat = await invoke<Chat>('update_chat', { id, request: validated });

      logger.info('Chat updated successfully', {
        id: chat.id,
        title: chat.title,
      });

      return chat;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Failed to update chat', {
        id,
        error: errorMessage,
      });
      throw error;
    }
  },

  /**
   * Delete a chat by ID.
   * This will cascade delete all associated messages.
   * @param id - Chat ID to delete
   * @returns Promise resolving when deletion is complete
   * @throws Error if the query fails (re-thrown for React Query)
   */
  delete: async (id: string): Promise<void> => {
    logger.debug('Deleting chat', { id });

    try {
      await invoke<void>('delete_chat', { id });

      logger.info('Chat deleted successfully', { id });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Failed to delete chat', {
        id,
        error: errorMessage,
      });
      throw error;
    }
  },

  /**
   * Archive a chat by ID.
   * Archived chats are hidden from list queries.
   * @param id - Chat ID to archive
   * @returns Promise resolving to the archived chat
   * @throws Error if the query fails (re-thrown for React Query)
   */
  archive: async (id: string): Promise<Chat> => {
    logger.debug('Archiving chat', { id });

    try {
      const chat = await invoke<Chat>('archive_chat', { id });

      logger.info('Chat archived successfully', {
        id: chat.id,
        title: chat.title,
      });

      return chat;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Failed to archive chat', {
        id,
        error: errorMessage,
      });
      throw error;
    }
  },

  /**
   * Unarchive a chat by ID.
   * Makes the chat visible in list queries again.
   * @param id - Chat ID to unarchive
   * @returns Promise resolving to the unarchived chat
   * @throws Error if the query fails (re-thrown for React Query)
   */
  unarchive: async (id: string): Promise<Chat> => {
    logger.debug('Unarchiving chat', { id });

    try {
      const chat = await invoke<Chat>('unarchive_chat', { id });

      logger.info('Chat unarchived successfully', {
        id: chat.id,
        title: chat.title,
      });

      return chat;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Failed to unarchive chat', {
        id,
        error: errorMessage,
      });
      throw error;
    }
  },

  /**
   * List all archived chats across all projects.
   * @returns Promise resolving to array of archived chats
   * @throws Error if the query fails (re-thrown for React Query)
   */
  listArchived: async (): Promise<Chat[]> => {
    logger.debug('Listing archived chats');

    try {
      const chats = await invoke<Chat[]>('list_archived_chats');

      logger.info('Archived chats listed successfully', {
        count: chats.length,
        titles: chats.slice(0, 3).map((c) => c.title),
        hasMore: chats.length > 3,
      });

      return chats;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Failed to list archived chats', {
        error: errorMessage,
      });
      throw error;
    }
  },

  /**
   * Start a workflow step execution for a chat.
   * This triggers the executor to run on the chat's initial prompt.
   * @param chatId - The chat ID to start the workflow step for
   * @returns Promise resolving to the execution process
   * @throws Error if the query fails (re-thrown for React Query)
   */
  startWorkflowStep: async (chatId: string): Promise<ExecutionProcess> => {
    logger.debug('Starting workflow step', { chatId });

    try {
      const process = await invoke<ExecutionProcess>('start_workflow_step', { chatId });

      logger.info('Workflow step started successfully', {
        chatId,
        processId: process.id,
        status: process.status,
      });

      return process;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Failed to start workflow step', {
        chatId,
        error: errorMessage,
      });
      throw error;
    }
  },

  /**
   * Toggle the completion status of a workflow step (chat).
   * If the step is incomplete, it will be marked as complete.
   * If the step is complete, it will be marked as incomplete.
   * @param chatId - The chat ID to toggle completion for
   * @returns Promise resolving to the updated chat
   * @throws Error if the query fails (re-thrown for React Query)
   */
  toggleStepComplete: async (chatId: string): Promise<Chat> => {
    logger.debug('Toggling step completion', { chatId });

    try {
      const chat = await invoke<Chat>('toggle_step_complete', { chatId });

      logger.info('Step completion toggled successfully', {
        chatId,
        isComplete: !!chat.setupCompletedAt,
      });

      return chat;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Failed to toggle step completion', {
        chatId,
        error: errorMessage,
      });
      throw error;
    }
  },
};
