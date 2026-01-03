/**
 * useDashboardSession - Hook for managing Dashboard page state
 *
 * This hook encapsulates all the state management, data fetching, and
 * callbacks for the Dashboard page, keeping the route component pure.
 */

import type {
  Chat,
  CreateProjectRequest,
  CreateTaskRequest,
  Project,
  SearchResult,
  Task,
  TaskStatus,
  WorkflowTemplate,
} from '@openflow/generated';
import { ChatRole, SearchResultType } from '@openflow/generated';
import type {
  ExecutorProfile,
  SearchResultType as SearchResultTypeEnum,
} from '@openflow/generated';
import { createLogger } from '@openflow/utils';
import { open } from '@tauri-apps/plugin-dialog';
import { Archive, FolderPlus, Keyboard, Plus, Settings } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { useArchiveChat, useDeleteChat } from './useChats';
import { useGlobalShortcuts } from './useGlobalShortcuts';
import { useProjectSelection } from './useProjectSelection';

// Create logger for this hook
const logger = createLogger('useDashboardSession');

// Local type definitions to avoid importing from @openflow/ui (architecture violation)
// These types are compatible with the UI layer types

/** Status filter options for the task list */
type StatusFilter = TaskStatus | 'all';

/** An action item that can be executed from the command palette */
interface CommandAction {
  id: string;
  label: string;
  shortcut?: string;
  icon?: LucideIcon;
  onSelect: () => void;
}

/** A recent item for quick access */
interface RecentItem {
  id: string;
  type: SearchResultTypeEnum;
  title: string;
  subtitle?: string;
  icon?: string;
}

/** Position for context menus */
interface MenuPosition {
  x: number;
  y: number;
}

/** State for the chat context menu */
interface ChatContextMenuState {
  chatId: string;
  chat: Chat;
  position: MenuPosition;
}

/** State for the task context menu */
interface TaskContextMenuState {
  taskId: string;
  task: Task;
  position: MenuPosition;
}
import { useCreateChat, useStandaloneChats } from './useChats';
import { useExecutorProfiles } from './useExecutorProfiles';
import { useKeyboardShortcuts } from './useKeyboardShortcuts';
import { useKeyboardShortcutsDialog } from './useKeyboardShortcutsDialog';
import { useCreateProject, useProjects } from './useProjects';
import { useSearch } from './useSearch';
import { useOpenInEditor } from './useSystem';
import {
  useArchiveTask,
  useCreateTask,
  useDeleteTask,
  useDuplicateTask,
  useTasks,
  useUpdateTask,
} from './useTasks';
import { useSpawnTerminal } from './useTerminal';
import { useWorkflowTemplates } from './useWorkflows';

// ============================================================================
// Types
// ============================================================================

export interface UseDashboardSessionOptions {
  /** Callback for navigation */
  navigate: (opts: { to: string; params?: Record<string, string> }) => void;
  /** Callback for showing toast messages */
  onSuccess?: (title: string, message: string) => void;
  /** Callback for showing error messages */
  onError?: (title: string, message: string) => void;
}

export interface DashboardSessionState {
  // Data
  projects: Project[];
  tasks: Task[];
  standaloneChats: Chat[];
  executorProfiles: ExecutorProfile[];
  activeProjectId: string | undefined;
  activeProject: Project | undefined;

  // Loading states
  isLoadingProjects: boolean;
  isLoadingTasks: boolean;

  // UI state
  // Note: sidebarCollapsed and isMobileDrawerOpen are now provided by NavigationContext
  commandPaletteOpen: boolean;
  statusFilter: StatusFilter;

  // Dialog state
  isCreateProjectDialogOpen: boolean;
  isCreateTaskDialogOpen: boolean;
  isNewChatDialogOpen: boolean;
  newProjectName: string;
  newProjectPath: string;
  newTaskTitle: string;
  newTaskDescription: string;
  createError: string | null;

  // Pending states
  isCreatingProject: boolean;
  isCreatingTask: boolean;
  isCreatingChat: boolean;

  // Keyboard shortcuts dialog
  keyboardShortcutsDialog: {
    isOpen: boolean;
    open: () => void;
    close: () => void;
  };

  // Command palette data
  commandActions: CommandAction[];
  recentItems: RecentItem[];
  headerSubtitle: string | undefined;

  // Search state
  searchQuery: string;
  searchResults: SearchResult[];
  isSearching: boolean;

  // Terminal state
  terminalOpen: boolean;
  terminalProcessId: string | null;
  isSpawningTerminal: boolean;
  handleCloseTerminal: () => void;

  // Chat context menu state
  chatContextMenu: ChatContextMenuState | null;
  isArchivingChat: boolean;
  isDeletingChat: boolean;
  handleChatContextMenu: (chatId: string, event: React.MouseEvent) => void;
  handleCloseChatContextMenu: () => void;
  handleArchiveChat: () => void;
  handleDeleteChat: () => void;
  handleViewChat: () => void;

  // Task context menu state
  taskContextMenu: TaskContextMenuState | null;
  isArchivingTask: boolean;
  isDeletingTask: boolean;
  isDuplicatingTask: boolean;
  isOpeningInIDE: boolean;
  handleTaskContextMenu: (taskId: string, event: React.MouseEvent) => void;
  handleCloseTaskContextMenu: () => void;
  handleArchiveTaskFromMenu: () => void;
  handleDeleteTaskFromMenu: () => void;
  handleDuplicateTask: () => void;
  handleOpenInIDE: () => void;
  handleViewTask: () => void;

  // Sidebar actions
  // Note: handleToggleSidebar is now provided by NavigationContext (via toggleSidebar)
  handleSelectProject: (projectId: string) => void;
  handleSelectTask: (taskId: string) => void;
  handleNewTask: () => void;
  handleNewProject: () => void;
  handleStatusFilter: (status: StatusFilter) => void;
  handleTaskStatusChange: (taskId: string, status: TaskStatus) => void;
  handleSettingsClick: () => void;
  handleArchiveClick: () => void;
  handleViewAllChats: () => void;

  // Header actions
  handleSearch: () => void;
  handleNewChat: () => void;
  handleNewTerminal: () => void;

  // Mobile drawer
  // Note: handleMobileDrawerToggle is now provided by NavigationContext (via setMobileDrawerOpen)
  handleSelectChat: (chatId: string) => void;

  // Dialog actions - Create Project
  handleBrowseFolder: () => Promise<void>;
  handleCloseCreateProjectDialog: () => void;
  handleCreateProject: () => void;
  setNewProjectName: (name: string) => void;
  setNewProjectPath: (path: string) => void;

  // Dialog actions - Create Task
  handleCloseCreateTaskDialog: () => void;
  handleCreateTask: () => void;
  setNewTaskTitle: (title: string) => void;
  setNewTaskDescription: (description: string) => void;

  // Workflow selection for Create Task dialog
  workflowTemplates: WorkflowTemplate[];
  isLoadingWorkflows: boolean;
  selectedWorkflow: WorkflowTemplate | null;
  handleSelectWorkflow: (workflow: WorkflowTemplate | null) => void;

  // Dialog actions - New Chat
  handleCloseNewChatDialog: () => void;
  handleCreateChatFromDialog: (data: {
    projectId: string;
    executorProfileId?: string;
    title?: string;
  }) => void;

  // Command palette actions
  handleCommandSearch: (query: string) => void;
  handleCloseCommandPalette: () => void;
  handleSelectSearchResult: (result: SearchResult) => void;
  handleSelectRecent: (item: RecentItem) => void;
}

// ============================================================================
// Hook Implementation
// ============================================================================

/**
 * useDashboardSession hook for managing Dashboard page state.
 *
 * Encapsulates:
 * - Data fetching (projects, tasks, chats, executor profiles)
 * - UI state (sidebar, dialogs, command palette)
 * - All user interaction callbacks
 * - Navigation handling
 *
 * @example
 * ```tsx
 * function DashboardPage() {
 *   const navigate = useNavigate();
 *   const toast = useToast();
 *   const session = useDashboardSession({
 *     navigate,
 *     onSuccess: (title, message) => toast.success(title, message),
 *     onError: (title, message) => toast.error(title, message),
 *   });
 *
 *   return (
 *     <DashboardLayout
 *       sidebar={<DashboardSidebar {...session} />}
 *       header={<DashboardHeader {...session} />}
 *     >
 *       <DashboardContent {...session} />
 *       <DashboardDialogs {...session} />
 *     </DashboardLayout>
 *   );
 * }
 * ```
 */
export function useDashboardSession({
  navigate,
  onSuccess,
  onError,
}: UseDashboardSessionOptions): DashboardSessionState {
  logger.debug('Hook initialized');

  const keyboardShortcutsDialog = useKeyboardShortcutsDialog();

  // Project selection from context (persisted to localStorage)
  const { selectedProjectId, setSelectedProjectId } = useProjectSelection();

  // UI state
  // Note: sidebarCollapsed and isMobileDrawerOpen are now provided by NavigationContext
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Dialog state
  const [isCreateProjectDialogOpen, setIsCreateProjectDialogOpen] = useState(false);
  const [isCreateTaskDialogOpen, setIsCreateTaskDialogOpen] = useState(false);
  const [isNewChatDialogOpen, setIsNewChatDialogOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectPath, setNewProjectPath] = useState('');
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDescription, setNewTaskDescription] = useState('');
  const [createError, setCreateError] = useState<string | null>(null);
  const [selectedWorkflow, setSelectedWorkflow] = useState<WorkflowTemplate | null>(null);

  // Terminal state
  const [terminalOpen, setTerminalOpen] = useState(false);
  const [terminalProcessId, setTerminalProcessId] = useState<string | null>(null);

  // Chat context menu state
  const [chatContextMenu, setChatContextMenu] = useState<ChatContextMenuState | null>(null);

  // Task context menu state
  const [taskContextMenu, setTaskContextMenu] = useState<TaskContextMenuState | null>(null);

  // Data fetching - projects first to compute activeProjectId
  const { data: projects = [], isLoading: isLoadingProjects } = useProjects();

  // Auto-select first project if none selected (must come before other queries that depend on it)
  const activeProjectId = selectedProjectId ?? projects[0]?.id;
  const activeProject = projects.find((p) => p.id === activeProjectId);

  // Fetch tasks and chats for the active project
  const { data: tasks = [], isLoading: isLoadingTasks } = useTasks(activeProjectId ?? '');
  const { data: standaloneChats = [] } = useStandaloneChats(activeProjectId ?? '');
  const { data: executorProfiles = [] } = useExecutorProfiles();

  // Workflow templates - only fetch when Create Task dialog is open and project is selected
  const { data: workflowTemplates = [], isLoading: isLoadingWorkflows } = useWorkflowTemplates(
    activeProjectId ?? '',
    { enabled: isCreateTaskDialogOpen && !!activeProjectId }
  );

  // Mutations
  const updateTask = useUpdateTask();
  const createProject = useCreateProject();
  const createTask = useCreateTask();
  const createChat = useCreateChat();
  const spawnTerminal = useSpawnTerminal();
  const archiveChat = useArchiveChat();
  const deleteChat = useDeleteChat();
  const archiveTask = useArchiveTask();
  const deleteTask = useDeleteTask();
  const duplicateTask = useDuplicateTask();
  const openInEditor = useOpenInEditor();

  // Search - scoped to active project if one is selected
  const { data: searchResults = [], isLoading: isSearching } = useSearch(searchQuery, {
    projectId: activeProjectId,
    staleTime: 1000,
  });

  // Keyboard shortcuts (local to this page)
  useKeyboardShortcuts([
    {
      key: 'k',
      meta: true,
      action: () => setCommandPaletteOpen(true),
    },
    {
      key: 'Escape',
      action: () => setCommandPaletteOpen(false),
    },
  ]);

  // Global shortcuts (Cmd+N, Cmd+,) - register handlers for this page
  const { registerNewTaskHandler, registerSettingsHandler } = useGlobalShortcuts();

  useEffect(() => {
    const unregisterNewTask = registerNewTaskHandler(() => {
      setCreateError(null);
      setNewTaskTitle('');
      setNewTaskDescription('');
      setIsCreateTaskDialogOpen(true);
    });

    const unregisterSettings = registerSettingsHandler(() => {
      navigate({ to: '/settings' as string });
    });

    return () => {
      unregisterNewTask();
      unregisterSettings();
    };
  }, [registerNewTaskHandler, registerSettingsHandler, navigate]);

  // ============================================================================
  // Sidebar Actions
  // ============================================================================

  const handleSelectProject = useCallback(
    (projectId: string) => {
      logger.debug('Project selected', { projectId });
      setSelectedProjectId(projectId);
    },
    [setSelectedProjectId]
  );

  const handleSelectTask = useCallback(
    (taskId: string) => {
      logger.debug('Task selected, navigating', { taskId });
      navigate({ to: '/tasks/$taskId', params: { taskId } });
    },
    [navigate]
  );

  const handleNewTask = useCallback(() => {
    logger.debug('Opening new task dialog');
    setCreateError(null);
    setNewTaskTitle('');
    setNewTaskDescription('');
    setIsCreateTaskDialogOpen(true);
  }, []);

  const handleNewProject = useCallback(() => {
    logger.debug('Opening new project dialog');
    setCreateError(null);
    setNewProjectName('');
    setNewProjectPath('');
    setIsCreateProjectDialogOpen(true);
  }, []);

  const handleStatusFilter = useCallback((status: StatusFilter) => {
    logger.debug('Status filter changed', { status });
    setStatusFilter(status);
  }, []);

  const handleTaskStatusChange = useCallback(
    (taskId: string, status: TaskStatus) => {
      logger.debug('Task status change requested', { taskId, status });
      updateTask.mutate({ id: taskId, request: { status } });
    },
    [updateTask]
  );

  const handleSettingsClick = useCallback(() => {
    navigate({ to: '/settings' as string });
  }, [navigate]);

  const handleArchiveClick = useCallback(() => {
    navigate({ to: '/archive' as string });
  }, [navigate]);

  const handleViewAllChats = useCallback(() => {
    navigate({ to: '/chats' as string });
  }, [navigate]);

  // Note: handleToggleSidebar is now provided by NavigationContext (via toggleSidebar)

  // ============================================================================
  // Header Actions
  // ============================================================================

  const handleSearch = useCallback(() => {
    setCommandPaletteOpen(true);
  }, []);

  const handleNewChat = useCallback(() => {
    setIsNewChatDialogOpen(true);
  }, []);

  const handleNewTerminal = useCallback(() => {
    logger.debug('Opening new terminal', { activeProjectId });

    if (!activeProjectId) {
      logger.warn('Cannot open terminal: no project selected');
      onError?.(
        'No project selected',
        'Please select or create a project first to open a terminal.'
      );
      return;
    }

    spawnTerminal.mutate(
      { projectId: activeProjectId },
      {
        onSuccess: (process) => {
          setTerminalProcessId(process.id);
          setTerminalOpen(true);
          logger.info('Terminal spawned successfully', {
            processId: process.id,
            projectId: activeProjectId,
          });
        },
        onError: (error) => {
          logger.error('Failed to spawn terminal', {
            projectId: activeProjectId,
            error: error.message,
          });
          onError?.('Failed to open terminal', error.message);
        },
      }
    );
  }, [activeProjectId, spawnTerminal, onError]);

  const handleCloseTerminal = useCallback(() => {
    setTerminalOpen(false);
    // Don't clear processId immediately - let the terminal clean up gracefully
  }, []);

  // ============================================================================
  // Chat Context Menu Actions
  // ============================================================================

  const handleChatContextMenu = useCallback(
    (chatId: string, event: React.MouseEvent) => {
      event.preventDefault();
      const chat = standaloneChats.find((c) => c.id === chatId);
      if (!chat) return;

      setChatContextMenu({
        chatId,
        chat,
        position: { x: event.clientX, y: event.clientY },
      });
    },
    [standaloneChats]
  );

  const handleCloseChatContextMenu = useCallback(() => {
    setChatContextMenu(null);
  }, []);

  const handleArchiveChat = useCallback(() => {
    if (!chatContextMenu) return;

    const { chatId, chat } = chatContextMenu;
    logger.debug('Archiving chat', { chatId, title: chat.title });

    archiveChat.mutate(chatId, {
      onSuccess: () => {
        logger.info('Chat archived successfully', { chatId, title: chat.title });
        // Note: Toast is shown by useArchiveChat mutation hook
        setChatContextMenu(null);
      },
      onError: (error) => {
        logger.error('Failed to archive chat', { chatId, error: error.message });
        onError?.('Failed to archive chat', error.message);
      },
    });
  }, [chatContextMenu, archiveChat, onError]);

  const handleDeleteChat = useCallback(() => {
    if (!chatContextMenu) return;

    const { chat } = chatContextMenu;
    logger.debug('Deleting chat', { chatId: chat.id, title: chat.title });

    deleteChat.mutate(
      { id: chat.id, projectId: chat.projectId, taskId: chat.taskId ?? undefined },
      {
        onSuccess: () => {
          logger.info('Chat deleted successfully', { chatId: chat.id, title: chat.title });
          // Note: Toast is shown by useDeleteChat mutation hook
          setChatContextMenu(null);
        },
        onError: (error) => {
          logger.error('Failed to delete chat', { chatId: chat.id, error: error.message });
          onError?.('Failed to delete chat', error.message);
        },
      }
    );
  }, [chatContextMenu, deleteChat, onError]);

  const handleViewChat = useCallback(() => {
    if (!chatContextMenu) return;
    navigate({ to: '/chats/$chatId', params: { chatId: chatContextMenu.chatId } });
    setChatContextMenu(null);
  }, [chatContextMenu, navigate]);

  // ============================================================================
  // Chat Navigation
  // ============================================================================

  const handleSelectChat = useCallback(
    (chatId: string) => {
      navigate({ to: '/chats/$chatId', params: { chatId } });
    },
    [navigate]
  );

  // ============================================================================
  // Task Context Menu Actions
  // ============================================================================

  const handleTaskContextMenu = useCallback(
    (taskId: string, event: React.MouseEvent) => {
      event.preventDefault();
      const task = tasks.find((t) => t.id === taskId);
      if (!task) return;

      setTaskContextMenu({
        taskId,
        task,
        position: { x: event.clientX, y: event.clientY },
      });
    },
    [tasks]
  );

  const handleCloseTaskContextMenu = useCallback(() => {
    setTaskContextMenu(null);
  }, []);

  const handleArchiveTaskFromMenu = useCallback(() => {
    if (!taskContextMenu) return;

    const { taskId, task } = taskContextMenu;
    logger.debug('Archiving task', { taskId, title: task.title });

    archiveTask.mutate(taskId, {
      onSuccess: () => {
        logger.info('Task archived successfully', { taskId, title: task.title });
        onSuccess?.('Task archived', 'The task has been moved to the archive.');
        setTaskContextMenu(null);
      },
      onError: (error) => {
        logger.error('Failed to archive task', { taskId, error: error.message });
        onError?.('Failed to archive task', error.message);
      },
    });
  }, [taskContextMenu, archiveTask, onSuccess, onError]);

  const handleDeleteTaskFromMenu = useCallback(() => {
    if (!taskContextMenu) return;

    const { taskId, task } = taskContextMenu;
    logger.debug('Deleting task', { taskId, title: task.title });

    deleteTask.mutate(taskId, {
      onSuccess: () => {
        logger.info('Task deleted successfully', { taskId, title: task.title });
        onSuccess?.('Task deleted', 'The task has been permanently deleted.');
        setTaskContextMenu(null);
      },
      onError: (error) => {
        logger.error('Failed to delete task', { taskId, error: error.message });
        onError?.('Failed to delete task', error.message);
      },
    });
  }, [taskContextMenu, deleteTask, onSuccess, onError]);

  const handleDuplicateTask = useCallback(() => {
    if (!taskContextMenu) return;

    const { taskId, task } = taskContextMenu;
    logger.debug('Duplicating task', { taskId, title: task.title });

    duplicateTask.mutate(taskId, {
      onSuccess: (newTask) => {
        logger.info('Task duplicated successfully', {
          originalTaskId: taskId,
          newTaskId: newTask.id,
          newTitle: newTask.title,
        });
        onSuccess?.('Task duplicated', `"${newTask.title}" has been created.`);
        setTaskContextMenu(null);
      },
      onError: (error) => {
        logger.error('Failed to duplicate task', { taskId, error: error.message });
        onError?.('Failed to duplicate task', error.message);
      },
    });
  }, [taskContextMenu, duplicateTask, onSuccess, onError]);

  const handleOpenInIDE = useCallback(() => {
    if (!taskContextMenu || !activeProject) return;

    logger.debug('Opening project in IDE', {
      projectId: activeProject.id,
      projectName: activeProject.name,
      path: activeProject.gitRepoPath,
    });

    // Open the project's git repo path in the system's default editor
    // Note: Toast notifications are handled by useOpenInEditor hook internally
    openInEditor.mutate(
      {
        path: activeProject.gitRepoPath,
        displayName: activeProject.name,
      },
      {
        onSuccess: () => {
          logger.info('Opened project in IDE successfully', { projectName: activeProject.name });
          setTaskContextMenu(null);
        },
        onError: (error) => {
          logger.error('Failed to open in IDE', {
            projectId: activeProject.id,
            error: error.message,
          });
        },
      }
    );
  }, [taskContextMenu, activeProject, openInEditor]);

  const handleViewTask = useCallback(() => {
    if (!taskContextMenu) return;
    navigate({ to: '/tasks/$taskId', params: { taskId: taskContextMenu.taskId } });
    setTaskContextMenu(null);
  }, [taskContextMenu, navigate]);

  // ============================================================================
  // Create Project Dialog Actions
  // ============================================================================

  const handleBrowseFolder = useCallback(async () => {
    logger.debug('Opening folder picker for project path');

    try {
      const selected = await open({
        directory: true,
        multiple: false,
        title: 'Select Git Repository',
      });
      if (selected && typeof selected === 'string') {
        logger.debug('Folder selected', { path: selected });
        setNewProjectPath(selected);
        // Try to auto-fill project name from folder name if not set
        if (!newProjectName.trim()) {
          const folderName = selected.split('/').pop() || '';
          setNewProjectName(folderName);
          logger.debug('Auto-filled project name from folder', { folderName });
        }
      } else {
        logger.debug('Folder picker cancelled');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Failed to open folder picker', { error: errorMessage });
      setCreateError('Failed to open folder picker. Please enter the path manually.');
    }
  }, [newProjectName]);

  const handleCloseCreateProjectDialog = useCallback(() => {
    setIsCreateProjectDialogOpen(false);
  }, []);

  const handleCreateProject = useCallback(() => {
    setCreateError(null);

    if (!newProjectName.trim()) {
      logger.warn('Create project validation failed: name required');
      setCreateError('Project name is required');
      return;
    }

    if (!newProjectPath.trim()) {
      logger.warn('Create project validation failed: path required');
      setCreateError('Git repository path is required');
      return;
    }

    const request: CreateProjectRequest = {
      name: newProjectName.trim(),
      gitRepoPath: newProjectPath.trim(),
    };

    logger.debug('Creating project', { name: request.name, path: request.gitRepoPath });

    createProject.mutate(request, {
      onSuccess: (project) => {
        logger.info('Project created successfully', { projectId: project.id, name: project.name });
        setIsCreateProjectDialogOpen(false);
        setNewProjectName('');
        setNewProjectPath('');
        setSelectedProjectId(project.id);
        // Note: Toast is shown by useCreateProject mutation hook
      },
      onError: (error) => {
        logger.error('Failed to create project', { name: request.name, error: error.message });
        setCreateError(error.message);
        onError?.('Failed to create project', error.message);
      },
    });
  }, [newProjectName, newProjectPath, createProject, setSelectedProjectId, onError]);

  // ============================================================================
  // Create Task Dialog Actions
  // ============================================================================

  const handleCloseCreateTaskDialog = useCallback(() => {
    setIsCreateTaskDialogOpen(false);
    setSelectedWorkflow(null);
  }, []);

  const handleSelectWorkflow = useCallback((workflow: WorkflowTemplate | null) => {
    setSelectedWorkflow(workflow);
  }, []);

  const handleCreateTask = useCallback(() => {
    setCreateError(null);

    if (!activeProjectId) {
      logger.warn('Create task validation failed: no project selected');
      setCreateError('Please select or create a project first');
      return;
    }

    if (!newTaskTitle.trim()) {
      logger.warn('Create task validation failed: title required');
      setCreateError('Task title is required');
      return;
    }

    const request: CreateTaskRequest = {
      projectId: activeProjectId,
      title: newTaskTitle.trim(),
      description: newTaskDescription.trim() || undefined,
      workflowTemplate: selectedWorkflow?.id,
    };

    logger.debug('Creating task', {
      projectId: request.projectId,
      title: request.title,
      workflowId: request.workflowTemplate,
    });

    createTask.mutate(request, {
      onSuccess: (task) => {
        logger.info('Task created successfully', { taskId: task.id, title: task.title });
        setIsCreateTaskDialogOpen(false);
        setNewTaskTitle('');
        setNewTaskDescription('');
        setSelectedWorkflow(null);
        onSuccess?.('Task created', `"${task.title}" has been created.`);

        // Get the default executor profile
        const defaultExecutorProfile =
          executorProfiles.find((p) => p.isDefault) ?? executorProfiles[0];

        // If a workflow is selected, create chats for each step
        if (selectedWorkflow && selectedWorkflow.steps.length > 0) {
          logger.debug('Creating workflow step chats', {
            taskId: task.id,
            stepCount: selectedWorkflow.steps.length,
            workflowName: selectedWorkflow.name,
          });

          // Create chats for each workflow step sequentially
          const createStepChats = async () => {
            const steps = selectedWorkflow.steps;
            const errors: string[] = [];

            for (let i = 0; i < steps.length; i++) {
              const step = steps[i];
              if (!step) continue;
              await new Promise<void>((resolve) => {
                createChat.mutate(
                  {
                    taskId: task.id,
                    projectId: task.projectId,
                    title: step.name,
                    chatRole: ChatRole.Main,
                    executorProfileId: defaultExecutorProfile?.id,
                    initialPrompt: step.description || step.name,
                    workflowStepIndex: i,
                  },
                  {
                    onSuccess: () => {
                      logger.debug('Workflow step chat created', {
                        stepIndex: i,
                        stepName: step.name,
                      });
                      resolve();
                    },
                    onError: (error) => {
                      logger.error('Failed to create workflow step chat', {
                        stepIndex: i,
                        stepName: step.name,
                        error: error.message,
                      });
                      errors.push(`Step ${i + 1} "${step.name}": ${error.message}`);
                      resolve(); // Continue with remaining steps
                    },
                  }
                );
              });
            }

            // Report any errors that occurred during step creation
            if (errors.length > 0) {
              logger.warn('Some workflow steps failed to create', { errorCount: errors.length });
              onError?.('Some workflow steps failed to create', errors.join('\n'));
            } else {
              logger.info('All workflow step chats created', {
                taskId: task.id,
                stepCount: steps.length,
              });
            }

            navigate({ to: '/tasks/$taskId', params: { taskId: task.id } });
          };
          createStepChats();
        } else {
          // No workflow selected - create a single default step
          logger.debug('Creating default step chat', { taskId: task.id });
          createChat.mutate(
            {
              taskId: task.id,
              projectId: task.projectId,
              title: 'Step 1',
              chatRole: ChatRole.Main,
              executorProfileId: defaultExecutorProfile?.id,
              initialPrompt: task.description || task.title,
              workflowStepIndex: 0,
            },
            {
              onSuccess: () => {
                logger.debug('Default step chat created', { taskId: task.id });
                navigate({ to: '/tasks/$taskId', params: { taskId: task.id } });
              },
              onError: (error) => {
                logger.error('Failed to create default step chat', {
                  taskId: task.id,
                  error: error.message,
                });
                // Still navigate even if chat creation fails
                navigate({ to: '/tasks/$taskId', params: { taskId: task.id } });
              },
            }
          );
        }
      },
      onError: (error) => {
        logger.error('Failed to create task', { title: request.title, error: error.message });
        setCreateError(error.message);
        onError?.('Failed to create task', error.message);
      },
    });
  }, [
    activeProjectId,
    newTaskTitle,
    newTaskDescription,
    selectedWorkflow,
    createTask,
    createChat,
    executorProfiles,
    navigate,
    onSuccess,
    onError,
  ]);

  // ============================================================================
  // New Chat Dialog Actions
  // ============================================================================

  const handleCloseNewChatDialog = useCallback(() => {
    setIsNewChatDialogOpen(false);
  }, []);

  const handleCreateChatFromDialog = useCallback(
    (data: { projectId: string; executorProfileId?: string; title?: string }) => {
      logger.debug('Creating standalone chat', {
        projectId: data.projectId,
        executorProfileId: data.executorProfileId,
        title: data.title,
      });

      createChat.mutate(
        {
          projectId: data.projectId,
          title: data.title,
          chatRole: ChatRole.Main,
          executorProfileId: data.executorProfileId,
        },
        {
          onSuccess: (chat) => {
            logger.info('Standalone chat created successfully', {
              chatId: chat.id,
              title: chat.title,
            });
            setIsNewChatDialogOpen(false);
            // Note: Toast is shown by useCreateChat mutation hook
            navigate({ to: '/chats/$chatId', params: { chatId: chat.id } });
          },
          onError: (error) => {
            logger.error('Failed to create standalone chat', {
              projectId: data.projectId,
              error: error.message,
            });
            onError?.('Failed to create chat', error.message);
          },
        }
      );
    },
    [createChat, navigate, onError]
  );

  // ============================================================================
  // Command Palette Actions
  // ============================================================================

  const handleCommandSearch = useCallback((query: string) => {
    logger.debug('Command palette search', { query: query.substring(0, 50) }); // Truncate for privacy
    setSearchQuery(query);
  }, []);

  const handleCloseCommandPalette = useCallback(() => {
    setCommandPaletteOpen(false);
    setSearchQuery(''); // Clear search when closing
  }, []);

  const handleSelectSearchResult = useCallback(
    (result: SearchResult) => {
      handleCloseCommandPalette();
      switch (result.resultType) {
        case SearchResultType.Task:
          navigate({ to: '/tasks/$taskId', params: { taskId: result.id } });
          break;
        case SearchResultType.Project:
          // Select the project in the sidebar
          setSelectedProjectId(result.id);
          break;
        case SearchResultType.Chat:
        case SearchResultType.Message:
          navigate({ to: '/chats/$chatId', params: { chatId: result.id } });
          break;
      }
    },
    [handleCloseCommandPalette, navigate, setSelectedProjectId]
  );

  const handleSelectRecent = useCallback(
    (item: RecentItem) => {
      handleCloseCommandPalette();
      switch (item.type) {
        case SearchResultType.Task:
          navigate({ to: '/tasks/$taskId', params: { taskId: item.id } });
          break;
        case SearchResultType.Project:
          setSelectedProjectId(item.id);
          break;
        case SearchResultType.Chat:
        case SearchResultType.Message:
          navigate({ to: '/chats/$chatId', params: { chatId: item.id } });
          break;
      }
    },
    [handleCloseCommandPalette, navigate, setSelectedProjectId]
  );

  // Build command actions for the palette
  const commandActions: CommandAction[] = useMemo(
    () => [
      {
        id: 'new-task',
        label: 'New Task',
        icon: Plus,
        shortcut: '⌘N',
        onSelect: handleNewTask,
      },
      {
        id: 'new-project',
        label: 'New Project',
        icon: FolderPlus,
        onSelect: handleNewProject,
      },
      {
        id: 'settings',
        label: 'Open Settings',
        icon: Settings,
        shortcut: '⌘,',
        onSelect: handleSettingsClick,
      },
      {
        id: 'keyboard-shortcuts',
        label: 'Keyboard Shortcuts',
        icon: Keyboard,
        shortcut: '⌘/',
        onSelect: () => {
          handleCloseCommandPalette();
          keyboardShortcutsDialog.open();
        },
      },
      {
        id: 'archive',
        label: 'View Archive',
        icon: Archive,
        onSelect: handleArchiveClick,
      },
    ],
    [
      handleNewTask,
      handleNewProject,
      handleSettingsClick,
      handleCloseCommandPalette,
      keyboardShortcutsDialog,
      handleArchiveClick,
    ]
  );

  // Build recent items for the command palette (memoized to prevent unnecessary re-renders)
  const recentItems: RecentItem[] = useMemo(
    () =>
      tasks.slice(0, 5).map((task) => {
        const item: RecentItem = {
          id: task.id,
          type: SearchResultType.Task,
          title: task.title,
        };
        if (activeProject?.name) {
          item.subtitle = activeProject.name;
        }
        return item;
      }),
    [tasks, activeProject?.name]
  );

  // Build header subtitle
  const getHeaderSubtitle = (): string | undefined => {
    if (isLoadingTasks) return undefined; // Let skeleton handle loading
    const inProgressCount = tasks.filter((t) => t.status === 'inprogress').length;
    if (inProgressCount === 0) return `${tasks.length} tasks`;
    return `${inProgressCount} task${inProgressCount === 1 ? '' : 's'} in progress`;
  };

  return {
    // Data
    projects,
    tasks,
    standaloneChats,
    executorProfiles,
    activeProjectId,
    activeProject,

    // Loading states
    isLoadingProjects,
    isLoadingTasks,

    // UI state
    // Note: sidebarCollapsed and isMobileDrawerOpen are now provided by NavigationContext
    commandPaletteOpen,
    statusFilter,

    // Dialog state
    isCreateProjectDialogOpen,
    isCreateTaskDialogOpen,
    isNewChatDialogOpen,
    newProjectName,
    newProjectPath,
    newTaskTitle,
    newTaskDescription,
    createError,

    // Pending states
    isCreatingProject: createProject.isPending,
    isCreatingTask: createTask.isPending,
    isCreatingChat: createChat.isPending,

    // Keyboard shortcuts dialog
    keyboardShortcutsDialog,

    // Command palette data
    commandActions,
    recentItems,
    headerSubtitle: getHeaderSubtitle(),

    // Search state
    searchQuery,
    searchResults,
    isSearching,

    // Terminal state
    terminalOpen,
    terminalProcessId,
    isSpawningTerminal: spawnTerminal.isPending,
    handleCloseTerminal,

    // Chat context menu state
    chatContextMenu,
    isArchivingChat: archiveChat.isPending,
    isDeletingChat: deleteChat.isPending,
    handleChatContextMenu,
    handleCloseChatContextMenu,
    handleArchiveChat,
    handleDeleteChat,
    handleViewChat,

    // Task context menu state
    taskContextMenu,
    isArchivingTask: archiveTask.isPending,
    isDeletingTask: deleteTask.isPending,
    isDuplicatingTask: duplicateTask.isPending,
    isOpeningInIDE: openInEditor.isPending,
    handleTaskContextMenu,
    handleCloseTaskContextMenu,
    handleArchiveTaskFromMenu,
    handleDeleteTaskFromMenu,
    handleDuplicateTask,
    handleOpenInIDE,
    handleViewTask,

    // Sidebar actions
    // Note: handleToggleSidebar is now provided by NavigationContext (via toggleSidebar)
    handleSelectProject,
    handleSelectTask,
    handleNewTask,
    handleNewProject,
    handleStatusFilter,
    handleTaskStatusChange,
    handleSettingsClick,
    handleArchiveClick,
    handleViewAllChats,

    // Header actions
    handleSearch,
    handleNewChat,
    handleNewTerminal,

    // Chat navigation
    handleSelectChat,

    // Dialog actions - Create Project
    handleBrowseFolder,
    handleCloseCreateProjectDialog,
    handleCreateProject,
    setNewProjectName,
    setNewProjectPath,

    // Dialog actions - Create Task
    handleCloseCreateTaskDialog,
    handleCreateTask,
    setNewTaskTitle,
    setNewTaskDescription,

    // Workflow selection for Create Task dialog
    workflowTemplates,
    isLoadingWorkflows,
    selectedWorkflow,
    handleSelectWorkflow,

    // Dialog actions - New Chat
    handleCloseNewChatDialog,
    handleCreateChatFromDialog,

    // Command palette actions
    handleCommandSearch,
    handleCloseCommandPalette,
    handleSelectSearchResult,
    handleSelectRecent,
  };
}
