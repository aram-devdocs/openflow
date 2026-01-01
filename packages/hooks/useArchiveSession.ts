/**
 * useArchiveSession - Hook for managing Archive page state
 *
 * This hook encapsulates all the state management, data fetching, and
 * callbacks for the Archive page, keeping the route component pure.
 *
 * Features:
 * - Full logging at DEBUG/INFO/ERROR levels
 * - Toast notifications for user feedback on actions
 * - Proper error handling with try/catch patterns
 */

import type { Chat, Project, Task } from '@openflow/generated';
import { createLogger } from '@openflow/utils';
import { useCallback, useMemo, useState } from 'react';
import { useArchivedChats, useDeleteChat, useUnarchiveChat } from './useChats';
import { useConfirmDialog } from './useConfirmDialog';
import { useKeyboardShortcuts } from './useKeyboardShortcuts';
import {
  useArchivedProjects,
  useDeleteProject,
  useProjects,
  useUnarchiveProject,
} from './useProjects';
import { useArchivedTasks, useDeleteTask, useRestoreTask, useTasks } from './useTasks';
import { useToast } from './useToast';

// ============================================================================
// Logger
// ============================================================================

const logger = createLogger('useArchiveSession');

// ============================================================================
// Types
// ============================================================================

export type ArchiveTab = 'tasks' | 'chats' | 'projects';

export interface UseArchiveSessionOptions {
  /** Callback for navigation */
  navigate: (opts: { to: string; params?: Record<string, string> }) => void;
}

export interface ArchiveSessionState {
  // Tab state
  activeTab: ArchiveTab;
  setActiveTab: (tab: ArchiveTab) => void;

  // Selection state
  selectedTask: Task | null;
  selectedChat: Chat | null;
  selectedProject: Project | null;

  // Data
  archivedTasks: Task[];
  archivedChats: Chat[];
  archivedProjects: Project[];
  projects: Project[];

  // Loading states
  isLoading: boolean;
  isLoadingTasks: boolean;
  isLoadingChats: boolean;
  isLoadingProjects: boolean;

  // Pending states
  isRestoringTask: boolean;
  isRestoringChat: boolean;
  isRestoringProject: boolean;

  // Computed values
  archivedCount: number;

  // Dialog state
  confirmDialogProps: ReturnType<typeof useConfirmDialog>['dialogProps'];

  // Helper functions
  getProjectName: (projectId: string) => string;
  getTaskTitle: (taskId: string | null | undefined) => string | null;
  formatDate: (dateString: string | null | undefined) => string;

  // Actions
  handleBack: () => void;
  handleSearch: () => void;
  handleSelectTask: (task: Task) => void;
  handleSelectChat: (chat: Chat) => void;
  handleSelectProject: (project: Project) => void;
  handleRestoreTask: (task: Task) => void;
  handleRestoreChat: (chat: Chat) => void;
  handleRestoreProject: (project: Project) => void;
  handleDeleteTask: (task: Task) => void;
  handleDeleteChat: (chat: Chat) => void;
  handleDeleteProject: (project: Project) => void;
}

// ============================================================================
// Hook Implementation
// ============================================================================

/**
 * useArchiveSession hook for managing Archive page state.
 *
 * Encapsulates:
 * - Data fetching (archived tasks, chats, projects)
 * - UI state (tabs, selections)
 * - All user interaction callbacks
 * - Confirmation dialogs for delete actions
 *
 * @example
 * ```tsx
 * function ArchivePage() {
 *   const navigate = useNavigate();
 *   const session = useArchiveSession({ navigate });
 *
 *   return (
 *     <ArchiveLayout
 *       header={<ArchiveHeader {...session} />}
 *     >
 *       <ArchiveTabBar {...session} />
 *       <ArchiveContent {...session} />
 *       <ConfirmDialog {...session.confirmDialogProps} />
 *     </ArchiveLayout>
 *   );
 * }
 * ```
 */
export function useArchiveSession({ navigate }: UseArchiveSessionOptions): ArchiveSessionState {
  logger.debug('Initializing useArchiveSession hook');

  // UI state
  const [activeTab, setActiveTab] = useState<ArchiveTab>('tasks');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  // Toast notifications
  const toast = useToast();

  // Confirm dialog
  const { dialogProps, confirm } = useConfirmDialog();

  // Data fetching
  const { data: archivedTasks = [], isLoading: isLoadingTasks } = useArchivedTasks();
  const { data: archivedChats = [], isLoading: isLoadingChats } = useArchivedChats();
  const { data: archivedProjects = [], isLoading: isLoadingProjects } = useArchivedProjects();
  const { data: projects = [] } = useProjects();
  const { data: tasks = [] } = useTasks(projects[0]?.id ?? '');

  // Mutations
  const restoreTask = useRestoreTask();
  const deleteTask = useDeleteTask();
  const unarchiveChat = useUnarchiveChat();
  const deleteChat = useDeleteChat();
  const unarchiveProject = useUnarchiveProject();
  const deleteProject = useDeleteProject();

  // Keyboard shortcuts
  useKeyboardShortcuts([
    {
      key: 'Escape',
      action: () => {
        logger.debug('Escape pressed, clearing selection');
        setSelectedTask(null);
        setSelectedChat(null);
        setSelectedProject(null);
      },
    },
  ]);

  // ============================================================================
  // Helper Functions
  // ============================================================================

  const getProjectName = useCallback(
    (projectId: string) => {
      const project = projects.find((p) => p.id === projectId);
      return project?.name ?? 'Unknown Project';
    },
    [projects]
  );

  const getTaskTitle = useCallback(
    (taskId: string | null | undefined) => {
      if (!taskId) return null;
      const task = tasks.find((t) => t.id === taskId);
      return task?.title ?? 'Unknown Task';
    },
    [tasks]
  );

  const formatDate = useCallback((dateString: string | null | undefined) => {
    if (!dateString) return 'Unknown date';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }, []);

  // ============================================================================
  // Computed Values
  // ============================================================================

  const isLoading = useMemo(() => {
    switch (activeTab) {
      case 'tasks':
        return isLoadingTasks;
      case 'chats':
        return isLoadingChats;
      case 'projects':
        return isLoadingProjects;
    }
  }, [activeTab, isLoadingTasks, isLoadingChats, isLoadingProjects]);

  const archivedCount = useMemo(() => {
    switch (activeTab) {
      case 'tasks':
        return archivedTasks.length;
      case 'chats':
        return archivedChats.length;
      case 'projects':
        return archivedProjects.length;
    }
  }, [activeTab, archivedTasks.length, archivedChats.length, archivedProjects.length]);

  // ============================================================================
  // Actions
  // ============================================================================

  const handleBack = useCallback(() => {
    logger.debug('Navigating back to home');
    navigate({ to: '/' });
  }, [navigate]);

  const handleSearch = useCallback(() => {
    logger.debug('Search action triggered');
    // TODO: Open command palette for search
  }, []);

  const handleSelectTask = useCallback((task: Task) => {
    logger.debug('Selecting task', { taskId: task.id, taskTitle: task.title });
    setSelectedTask(task);
  }, []);

  const handleSelectChat = useCallback((chat: Chat) => {
    logger.debug('Selecting chat', { chatId: chat.id, chatTitle: chat.title });
    setSelectedChat(chat);
  }, []);

  const handleSelectProject = useCallback((project: Project) => {
    logger.debug('Selecting project', { projectId: project.id, projectName: project.name });
    setSelectedProject(project);
  }, []);

  const handleRestoreTask = useCallback(
    (task: Task) => {
      logger.debug('Restoring task', { taskId: task.id, taskTitle: task.title });
      restoreTask.mutate(
        { id: task.id },
        {
          onSuccess: () => {
            logger.info('Task restored successfully', { taskId: task.id, taskTitle: task.title });
            toast.success('Task Restored', `"${task.title}" has been restored.`);
            setSelectedTask(null);
          },
          onError: (error) => {
            logger.error('Failed to restore task', {
              taskId: task.id,
              taskTitle: task.title,
              error: error instanceof Error ? error.message : String(error),
            });
            toast.error('Restore Failed', `Failed to restore "${task.title}". Please try again.`);
          },
        }
      );
    },
    [restoreTask, toast]
  );

  const handleRestoreChat = useCallback(
    (chat: Chat) => {
      const chatTitle = chat.title || 'Untitled Chat';
      logger.debug('Restoring chat', { chatId: chat.id, chatTitle });
      unarchiveChat.mutate(chat.id, {
        onSuccess: () => {
          logger.info('Chat restored successfully', { chatId: chat.id, chatTitle });
          toast.success('Chat Restored', `"${chatTitle}" has been restored.`);
          setSelectedChat(null);
        },
        onError: (error) => {
          logger.error('Failed to restore chat', {
            chatId: chat.id,
            chatTitle,
            error: error instanceof Error ? error.message : String(error),
          });
          toast.error('Restore Failed', `Failed to restore "${chatTitle}". Please try again.`);
        },
      });
    },
    [unarchiveChat, toast]
  );

  const handleRestoreProject = useCallback(
    (project: Project) => {
      logger.debug('Restoring project', { projectId: project.id, projectName: project.name });
      unarchiveProject.mutate(
        { id: project.id, name: project.name },
        {
          onSuccess: () => {
            logger.info('Project restored successfully', {
              projectId: project.id,
              projectName: project.name,
            });
            // Toast is handled by useUnarchiveProject hook
            setSelectedProject(null);
          },
          onError: (error) => {
            logger.error('Failed to restore project', {
              projectId: project.id,
              projectName: project.name,
              error: error instanceof Error ? error.message : String(error),
            });
            // Toast is handled by useUnarchiveProject hook
          },
        }
      );
    },
    [unarchiveProject]
  );

  const handleDeleteTask = useCallback(
    (task: Task) => {
      logger.debug('Opening delete confirmation for task', {
        taskId: task.id,
        taskTitle: task.title,
      });
      confirm({
        title: 'Delete Task Permanently',
        description: `Are you sure you want to permanently delete "${task.title}"? This action cannot be undone.`,
        confirmLabel: 'Delete',
        variant: 'destructive',
        onConfirm: async () => {
          logger.debug('Deleting task permanently', { taskId: task.id, taskTitle: task.title });
          try {
            await deleteTask.mutateAsync(task.id);
            logger.info('Task deleted permanently', { taskId: task.id, taskTitle: task.title });
            toast.success('Task Deleted', `"${task.title}" has been permanently deleted.`);
            setSelectedTask(null);
          } catch (error) {
            logger.error('Failed to delete task', {
              taskId: task.id,
              taskTitle: task.title,
              error: error instanceof Error ? error.message : String(error),
            });
            toast.error('Delete Failed', `Failed to delete "${task.title}". Please try again.`);
            throw error; // Re-throw to let the dialog handle the error state
          }
        },
      });
    },
    [confirm, deleteTask, toast]
  );

  const handleDeleteChat = useCallback(
    (chat: Chat) => {
      const chatTitle = chat.title || 'Untitled Chat';
      logger.debug('Opening delete confirmation for chat', { chatId: chat.id, chatTitle });
      confirm({
        title: 'Delete Chat Permanently',
        description: `Are you sure you want to permanently delete "${chatTitle}"? This action cannot be undone.`,
        confirmLabel: 'Delete',
        variant: 'destructive',
        onConfirm: async () => {
          logger.debug('Deleting chat permanently', { chatId: chat.id, chatTitle });
          try {
            await deleteChat.mutateAsync({
              id: chat.id,
              projectId: chat.projectId,
              taskId: chat.taskId ?? undefined,
            });
            logger.info('Chat deleted permanently', { chatId: chat.id, chatTitle });
            toast.success('Chat Deleted', `"${chatTitle}" has been permanently deleted.`);
            setSelectedChat(null);
          } catch (error) {
            logger.error('Failed to delete chat', {
              chatId: chat.id,
              chatTitle,
              error: error instanceof Error ? error.message : String(error),
            });
            toast.error('Delete Failed', `Failed to delete "${chatTitle}". Please try again.`);
            throw error; // Re-throw to let the dialog handle the error state
          }
        },
      });
    },
    [confirm, deleteChat, toast]
  );

  const handleDeleteProject = useCallback(
    (project: Project) => {
      logger.debug('Opening delete confirmation for project', {
        projectId: project.id,
        projectName: project.name,
      });
      confirm({
        title: 'Delete Project Permanently',
        description: `Are you sure you want to permanently delete "${project.name}"? This will delete all tasks, chats, and messages. This action cannot be undone.`,
        confirmLabel: 'Delete',
        variant: 'destructive',
        onConfirm: async () => {
          logger.debug('Deleting project permanently', {
            projectId: project.id,
            projectName: project.name,
          });
          try {
            await deleteProject.mutateAsync({ id: project.id, name: project.name });
            logger.info('Project deleted permanently', {
              projectId: project.id,
              projectName: project.name,
            });
            // Toast is handled by useDeleteProject hook
            setSelectedProject(null);
          } catch (error) {
            logger.error('Failed to delete project', {
              projectId: project.id,
              projectName: project.name,
              error: error instanceof Error ? error.message : String(error),
            });
            // Toast is handled by useDeleteProject hook
            throw error; // Re-throw to let the dialog handle the error state
          }
        },
      });
    },
    [confirm, deleteProject]
  );

  return {
    // Tab state
    activeTab,
    setActiveTab,

    // Selection state
    selectedTask,
    selectedChat,
    selectedProject,

    // Data
    archivedTasks,
    archivedChats,
    archivedProjects,
    projects,

    // Loading states
    isLoading,
    isLoadingTasks,
    isLoadingChats,
    isLoadingProjects,

    // Pending states
    isRestoringTask: restoreTask.isPending,
    isRestoringChat: unarchiveChat.isPending,
    isRestoringProject: unarchiveProject.isPending,

    // Computed values
    archivedCount,

    // Dialog state
    confirmDialogProps: dialogProps,

    // Helper functions
    getProjectName,
    getTaskTitle,
    formatDate,

    // Actions
    handleBack,
    handleSearch,
    handleSelectTask,
    handleSelectChat,
    handleSelectProject,
    handleRestoreTask,
    handleRestoreChat,
    handleRestoreProject,
    handleDeleteTask,
    handleDeleteChat,
    handleDeleteProject,
  };
}
