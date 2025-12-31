/**
 * useArchiveSession - Hook for managing Archive page state
 *
 * This hook encapsulates all the state management, data fetching, and
 * callbacks for the Archive page, keeping the route component pure.
 */

import type { Chat, Project, Task } from '@openflow/generated';
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
  // UI state
  const [activeTab, setActiveTab] = useState<ArchiveTab>('tasks');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

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
    navigate({ to: '/' });
  }, [navigate]);

  const handleSearch = useCallback(() => {
    // TODO: Open command palette for search
    console.log('Search clicked');
  }, []);

  const handleSelectTask = useCallback((task: Task) => {
    setSelectedTask(task);
  }, []);

  const handleSelectChat = useCallback((chat: Chat) => {
    setSelectedChat(chat);
  }, []);

  const handleSelectProject = useCallback((project: Project) => {
    setSelectedProject(project);
  }, []);

  const handleRestoreTask = useCallback(
    (task: Task) => {
      restoreTask.mutate(
        { id: task.id },
        {
          onSuccess: () => {
            setSelectedTask(null);
          },
        }
      );
    },
    [restoreTask]
  );

  const handleRestoreChat = useCallback(
    (chat: Chat) => {
      unarchiveChat.mutate(chat.id, {
        onSuccess: () => {
          setSelectedChat(null);
        },
      });
    },
    [unarchiveChat]
  );

  const handleRestoreProject = useCallback(
    (project: Project) => {
      unarchiveProject.mutate(project.id, {
        onSuccess: () => {
          setSelectedProject(null);
        },
      });
    },
    [unarchiveProject]
  );

  const handleDeleteTask = useCallback(
    (task: Task) => {
      confirm({
        title: 'Delete Task Permanently',
        description: `Are you sure you want to permanently delete "${task.title}"? This action cannot be undone.`,
        confirmLabel: 'Delete',
        variant: 'destructive',
        onConfirm: async () => {
          await deleteTask.mutateAsync(task.id);
          setSelectedTask(null);
        },
      });
    },
    [confirm, deleteTask]
  );

  const handleDeleteChat = useCallback(
    (chat: Chat) => {
      confirm({
        title: 'Delete Chat Permanently',
        description: `Are you sure you want to permanently delete "${chat.title || 'Untitled Chat'}"? This action cannot be undone.`,
        confirmLabel: 'Delete',
        variant: 'destructive',
        onConfirm: async () => {
          await deleteChat.mutateAsync({
            id: chat.id,
            projectId: chat.projectId,
            taskId: chat.taskId ?? undefined,
          });
          setSelectedChat(null);
        },
      });
    },
    [confirm, deleteChat]
  );

  const handleDeleteProject = useCallback(
    (project: Project) => {
      confirm({
        title: 'Delete Project Permanently',
        description: `Are you sure you want to permanently delete "${project.name}"? This will delete all tasks, chats, and messages. This action cannot be undone.`,
        confirmLabel: 'Delete',
        variant: 'destructive',
        onConfirm: async () => {
          await deleteProject.mutateAsync(project.id);
          setSelectedProject(null);
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
