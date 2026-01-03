/**
 * useChats - Hooks for managing chats
 *
 * This module provides React Query hooks for CRUD operations on chats,
 * including task-linked chats, standalone chats, and archived chats.
 *
 * Features:
 * - Full logging at DEBUG/INFO/ERROR levels
 * - Toast notifications for user feedback on mutations
 * - Proper error handling with try/catch patterns
 */

import type {
  Chat,
  ChatWithMessages,
  CreateChatRequest,
  ExecutionProcess,
  UpdateChatRequest,
} from '@openflow/generated';
import { chatQueries } from '@openflow/queries';
import { createLogger } from '@openflow/utils';
import {
  type UseMutationResult,
  type UseQueryResult,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { taskKeys } from './useTasks';
import { useToast } from './useToast';

// ============================================================================
// Logger
// ============================================================================

const logger = createLogger('useChats');

// ============================================================================
// Query Keys
// ============================================================================

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

// ============================================================================
// Query Hooks
// ============================================================================

/**
 * Fetch all chats for a task.
 *
 * @param taskId - Task ID to filter chats
 * @returns Query result with array of chats
 */
export function useChats(taskId: string): UseQueryResult<Chat[]> {
  logger.debug('useChats hook called', { taskId, enabled: Boolean(taskId) });

  return useQuery({
    queryKey: chatKeys.list(taskId),
    queryFn: async () => {
      logger.debug('Fetching chats for task', { taskId });
      try {
        const chats = await chatQueries.list(taskId);
        logger.info('Chats fetched successfully', {
          taskId,
          count: chats.length,
        });
        return chats;
      } catch (error) {
        logger.error('Failed to fetch chats', {
          taskId,
          error: error instanceof Error ? error.message : String(error),
        });
        throw error;
      }
    },
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
  logger.debug('useStandaloneChats hook called', { projectId, enabled: Boolean(projectId) });

  return useQuery({
    queryKey: chatKeys.standalone(projectId),
    queryFn: async () => {
      logger.debug('Fetching standalone chats', { projectId });
      try {
        const chats = await chatQueries.listStandalone(projectId);
        logger.info('Standalone chats fetched successfully', {
          projectId,
          count: chats.length,
        });
        return chats;
      } catch (error) {
        logger.error('Failed to fetch standalone chats', {
          projectId,
          error: error instanceof Error ? error.message : String(error),
        });
        throw error;
      }
    },
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
  logger.debug('useChatsByProject hook called', { projectId, enabled: Boolean(projectId) });

  return useQuery({
    queryKey: chatKeys.byProject(projectId),
    queryFn: async () => {
      logger.debug('Fetching all chats for project', { projectId });
      try {
        const chats = await chatQueries.listByProject(projectId);
        logger.info('Project chats fetched successfully', {
          projectId,
          count: chats.length,
        });
        return chats;
      } catch (error) {
        logger.error('Failed to fetch project chats', {
          projectId,
          error: error instanceof Error ? error.message : String(error),
        });
        throw error;
      }
    },
    enabled: Boolean(projectId),
  });
}

/**
 * Fetch all archived chats across all projects.
 *
 * @returns Query result with array of archived chats
 */
export function useArchivedChats(): UseQueryResult<Chat[]> {
  logger.debug('useArchivedChats hook called');

  return useQuery({
    queryKey: chatKeys.archived(),
    queryFn: async () => {
      logger.debug('Fetching archived chats');
      try {
        const chats = await chatQueries.listArchived();
        logger.info('Archived chats fetched successfully', {
          count: chats.length,
        });
        return chats;
      } catch (error) {
        logger.error('Failed to fetch archived chats', {
          error: error instanceof Error ? error.message : String(error),
        });
        throw error;
      }
    },
  });
}

/**
 * Fetch a single chat by ID with its messages.
 *
 * @param id - Chat ID to fetch
 * @returns Query result with chat and messages data
 */
export function useChat(id: string): UseQueryResult<ChatWithMessages> {
  logger.debug('useChat hook called', { id, enabled: Boolean(id) });

  return useQuery({
    queryKey: chatKeys.detail(id),
    queryFn: async () => {
      logger.debug('Fetching chat detail', { id });
      try {
        const chat = await chatQueries.get(id);
        logger.info('Chat detail fetched successfully', {
          id,
          title: chat.title,
          messageCount: chat.messages.length,
        });
        return chat;
      } catch (error) {
        logger.error('Failed to fetch chat detail', {
          id,
          error: error instanceof Error ? error.message : String(error),
        });
        throw error;
      }
    },
    enabled: Boolean(id),
  });
}

// ============================================================================
// Mutation Hooks
// ============================================================================

/**
 * Create a new chat.
 *
 * @returns Mutation for creating a chat
 */
export function useCreateChat(): UseMutationResult<Chat, Error, CreateChatRequest> {
  const queryClient = useQueryClient();
  const toast = useToast();

  logger.debug('useCreateChat hook initialized');

  return useMutation({
    mutationFn: async (request: CreateChatRequest) => {
      logger.debug('Creating chat', {
        projectId: request.projectId,
        taskId: request.taskId,
        title: request.title,
        isStandalone: !request.taskId,
      });
      try {
        const chat = await chatQueries.create(request);
        logger.info('Chat created successfully', {
          id: chat.id,
          projectId: chat.projectId,
          taskId: chat.taskId,
          isStandalone: !chat.taskId,
        });
        return chat;
      } catch (error) {
        logger.error('Failed to create chat', {
          projectId: request.projectId,
          taskId: request.taskId,
          title: request.title,
          error: error instanceof Error ? error.message : String(error),
        });
        throw error;
      }
    },
    onSuccess: (data) => {
      // Skip toast for workflow step chats to avoid toast spam when creating tasks with workflows
      if (data.workflowStepIndex === undefined || data.workflowStepIndex === null) {
        toast.success('Chat Created', `"${data.title || 'New chat'}" has been created.`);
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
      toast.error(
        'Failed to Create Chat',
        error instanceof Error ? error.message : 'Please try again.'
      );
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
  const toast = useToast();

  logger.debug('useStartWorkflowStep hook initialized');

  return useMutation({
    mutationFn: async (chatId: string) => {
      logger.debug('Starting workflow step', { chatId });
      try {
        const process = await chatQueries.startWorkflowStep(chatId);
        logger.info('Workflow step started successfully', {
          chatId,
          processId: process.id,
        });
        return process;
      } catch (error) {
        logger.error('Failed to start workflow step', {
          chatId,
          error: error instanceof Error ? error.message : String(error),
        });
        throw error;
      }
    },
    onSuccess: (data) => {
      toast.success('Workflow Started', 'The workflow step has been started.');
      queryClient.invalidateQueries({ queryKey: chatKeys.detail(data.chatId) });
    },
    onError: (error) => {
      toast.error(
        'Failed to Start Workflow',
        error instanceof Error ? error.message : 'Please try again.'
      );
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
  const toast = useToast();

  logger.debug('useUpdateChat hook initialized');

  return useMutation({
    mutationFn: async ({ id, request }) => {
      logger.debug('Updating chat', { id, request });
      try {
        const chat = await chatQueries.update(id, request);
        logger.info('Chat updated successfully', {
          id: chat.id,
          title: chat.title,
        });
        return chat;
      } catch (error) {
        logger.error('Failed to update chat', {
          id,
          request,
          error: error instanceof Error ? error.message : String(error),
        });
        throw error;
      }
    },
    onSuccess: (data) => {
      toast.success('Chat Updated', `"${data.title || 'Chat'}" has been updated.`);
      queryClient.invalidateQueries({ queryKey: chatKeys.detail(data.id) });
      // Also invalidate list caches
      if (data.taskId) {
        queryClient.invalidateQueries({ queryKey: chatKeys.list(data.taskId) });
      }
      queryClient.invalidateQueries({ queryKey: chatKeys.standalone(data.projectId) });
      queryClient.invalidateQueries({ queryKey: chatKeys.byProject(data.projectId) });
    },
    onError: (error) => {
      toast.error(
        'Failed to Update Chat',
        error instanceof Error ? error.message : 'Please try again.'
      );
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
  { id: string; title?: string; projectId: string; taskId?: string }
> {
  const queryClient = useQueryClient();
  const toast = useToast();

  logger.debug('useDeleteChat hook initialized');

  return useMutation({
    mutationFn: async ({ id }) => {
      logger.debug('Deleting chat', { id });
      try {
        await chatQueries.delete(id);
        logger.info('Chat deleted successfully', { id });
      } catch (error) {
        logger.error('Failed to delete chat', {
          id,
          error: error instanceof Error ? error.message : String(error),
        });
        throw error;
      }
    },
    onSuccess: (_, variables) => {
      toast.success('Chat Deleted', `"${variables.title || 'Chat'}" has been deleted.`);
      queryClient.invalidateQueries({ queryKey: chatKeys.detail(variables.id) });
      if (variables.taskId) {
        queryClient.invalidateQueries({ queryKey: chatKeys.list(variables.taskId) });
        queryClient.invalidateQueries({ queryKey: taskKeys.detail(variables.taskId) });
      }
      queryClient.invalidateQueries({ queryKey: chatKeys.standalone(variables.projectId) });
      queryClient.invalidateQueries({ queryKey: chatKeys.byProject(variables.projectId) });
    },
    onError: (error, variables) => {
      toast.error(
        'Failed to Delete Chat',
        `Could not delete "${variables.title || 'chat'}". ${error instanceof Error ? error.message : 'Please try again.'}`
      );
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
  const toast = useToast();

  logger.debug('useArchiveChat hook initialized');

  return useMutation({
    mutationFn: async (id: string) => {
      logger.debug('Archiving chat', { id });
      try {
        const chat = await chatQueries.archive(id);
        logger.info('Chat archived successfully', {
          id: chat.id,
          title: chat.title,
        });
        return chat;
      } catch (error) {
        logger.error('Failed to archive chat', {
          id,
          error: error instanceof Error ? error.message : String(error),
        });
        throw error;
      }
    },
    onSuccess: (data) => {
      toast.success('Chat Archived', `"${data.title || 'Chat'}" has been archived.`);
      queryClient.invalidateQueries({ queryKey: chatKeys.detail(data.id) });
      if (data.taskId) {
        queryClient.invalidateQueries({ queryKey: chatKeys.list(data.taskId) });
        queryClient.invalidateQueries({ queryKey: taskKeys.detail(data.taskId) });
      }
      queryClient.invalidateQueries({ queryKey: chatKeys.standalone(data.projectId) });
      queryClient.invalidateQueries({ queryKey: chatKeys.byProject(data.projectId) });
      queryClient.invalidateQueries({ queryKey: chatKeys.archived() });
    },
    onError: (error) => {
      toast.error(
        'Failed to Archive Chat',
        error instanceof Error ? error.message : 'Please try again.'
      );
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
  const toast = useToast();

  logger.debug('useUnarchiveChat hook initialized');

  return useMutation({
    mutationFn: async (id: string) => {
      logger.debug('Unarchiving chat', { id });
      try {
        const chat = await chatQueries.unarchive(id);
        logger.info('Chat unarchived successfully', {
          id: chat.id,
          title: chat.title,
        });
        return chat;
      } catch (error) {
        logger.error('Failed to unarchive chat', {
          id,
          error: error instanceof Error ? error.message : String(error),
        });
        throw error;
      }
    },
    onSuccess: (data) => {
      toast.success('Chat Restored', `"${data.title || 'Chat'}" has been restored from archive.`);
      queryClient.invalidateQueries({ queryKey: chatKeys.detail(data.id) });
      if (data.taskId) {
        queryClient.invalidateQueries({ queryKey: chatKeys.list(data.taskId) });
        queryClient.invalidateQueries({ queryKey: taskKeys.detail(data.taskId) });
      }
      queryClient.invalidateQueries({ queryKey: chatKeys.standalone(data.projectId) });
      queryClient.invalidateQueries({ queryKey: chatKeys.byProject(data.projectId) });
      queryClient.invalidateQueries({ queryKey: chatKeys.archived() });
    },
    onError: (error) => {
      toast.error(
        'Failed to Restore Chat',
        error instanceof Error ? error.message : 'Please try again.'
      );
    },
  });
}

/**
 * Toggle the completion status of a workflow step (chat).
 * If the step is incomplete, it will be marked as complete.
 * If the step is complete, it will be marked as incomplete.
 *
 * @returns Mutation for toggling step completion
 */
export function useToggleStepComplete(): UseMutationResult<Chat, Error, string> {
  const queryClient = useQueryClient();
  const toast = useToast();

  logger.debug('useToggleStepComplete hook initialized');

  return useMutation({
    mutationFn: async (chatId: string) => {
      logger.debug('Toggling step completion', { chatId });
      try {
        const chat = await chatQueries.toggleStepComplete(chatId);
        const isCompleted = Boolean(chat.setupCompletedAt);
        logger.info('Step completion toggled successfully', {
          chatId: chat.id,
          isCompleted,
        });
        return chat;
      } catch (error) {
        logger.error('Failed to toggle step completion', {
          chatId,
          error: error instanceof Error ? error.message : String(error),
        });
        throw error;
      }
    },
    onSuccess: (data) => {
      const isCompleted = Boolean(data.setupCompletedAt);
      const status = isCompleted ? 'completed' : 'incomplete';
      toast.success('Step Updated', `Step marked as ${status}.`);
      // Invalidate the chat detail cache
      queryClient.invalidateQueries({ queryKey: chatKeys.detail(data.id) });
      // Invalidate task-related caches to update the steps panel
      if (data.taskId) {
        queryClient.invalidateQueries({ queryKey: chatKeys.list(data.taskId) });
        queryClient.invalidateQueries({ queryKey: taskKeys.detail(data.taskId) });
      }
      // Invalidate project-level caches
      queryClient.invalidateQueries({ queryKey: chatKeys.byProject(data.projectId) });
    },
    onError: (error) => {
      toast.error(
        'Failed to Update Step',
        error instanceof Error ? error.message : 'Please try again.'
      );
    },
  });
}
