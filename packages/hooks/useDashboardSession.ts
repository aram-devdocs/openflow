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
  Task,
  TaskStatus,
} from '@openflow/generated';
import { ChatRole, SearchResultType } from '@openflow/generated';
import type {
  ExecutorProfile,
  SearchResultType as SearchResultTypeEnum,
} from '@openflow/generated';
import { open } from '@tauri-apps/plugin-dialog';
import { Archive, FolderPlus, Keyboard, Plus, Settings } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';

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
import { useCreateChat, useStandaloneChats } from './useChats';
import { useExecutorProfiles } from './useExecutorProfiles';
import { useKeyboardShortcuts } from './useKeyboardShortcuts';
import { useKeyboardShortcutsDialog } from './useKeyboardShortcutsDialog';
import { useCreateProject, useProjects } from './useProjects';
import { useCreateTask, useTasks, useUpdateTask } from './useTasks';

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
  sidebarCollapsed: boolean;
  isMobileDrawerOpen: boolean;
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

  // Sidebar actions
  handleSelectProject: (projectId: string) => void;
  handleSelectTask: (taskId: string) => void;
  handleNewTask: () => void;
  handleNewProject: () => void;
  handleStatusFilter: (status: StatusFilter) => void;
  handleTaskStatusChange: (taskId: string, status: TaskStatus) => void;
  handleSettingsClick: () => void;
  handleArchiveClick: () => void;
  handleToggleSidebar: () => void;

  // Header actions
  handleSearch: () => void;
  handleNewChat: () => void;
  handleNewTerminal: () => void;

  // Mobile drawer
  handleMobileDrawerToggle: (open: boolean) => void;
  handleSelectTaskWithDrawerClose: (taskId: string) => void;
  handleSelectChatWithDrawerClose: (chatId: string) => void;

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
  const keyboardShortcutsDialog = useKeyboardShortcutsDialog();

  // UI state
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isMobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string | undefined>(undefined);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  // Dialog state
  const [isCreateProjectDialogOpen, setIsCreateProjectDialogOpen] = useState(false);
  const [isCreateTaskDialogOpen, setIsCreateTaskDialogOpen] = useState(false);
  const [isNewChatDialogOpen, setIsNewChatDialogOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectPath, setNewProjectPath] = useState('');
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDescription, setNewTaskDescription] = useState('');
  const [createError, setCreateError] = useState<string | null>(null);

  // Data fetching
  const { data: projects = [], isLoading: isLoadingProjects } = useProjects();
  const { data: tasks = [], isLoading: isLoadingTasks } = useTasks(selectedProjectId ?? '');
  const { data: standaloneChats = [] } = useStandaloneChats(selectedProjectId ?? '');
  const { data: executorProfiles = [] } = useExecutorProfiles();

  // Mutations
  const updateTask = useUpdateTask();
  const createProject = useCreateProject();
  const createTask = useCreateTask();
  const createChat = useCreateChat();

  // Auto-select first project if none selected
  const activeProjectId = selectedProjectId ?? projects[0]?.id;
  const activeProject = projects.find((p) => p.id === activeProjectId);

  // Keyboard shortcuts
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

  // ============================================================================
  // Sidebar Actions
  // ============================================================================

  const handleSelectProject = useCallback((projectId: string) => {
    setSelectedProjectId(projectId);
  }, []);

  const handleSelectTask = useCallback(
    (taskId: string) => {
      navigate({ to: '/tasks/$taskId', params: { taskId } });
    },
    [navigate]
  );

  const handleNewTask = useCallback(() => {
    setCreateError(null);
    setNewTaskTitle('');
    setNewTaskDescription('');
    setIsCreateTaskDialogOpen(true);
  }, []);

  const handleNewProject = useCallback(() => {
    setCreateError(null);
    setNewProjectName('');
    setNewProjectPath('');
    setIsCreateProjectDialogOpen(true);
  }, []);

  const handleStatusFilter = useCallback((status: StatusFilter) => {
    setStatusFilter(status);
  }, []);

  const handleTaskStatusChange = useCallback(
    (taskId: string, status: TaskStatus) => {
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

  const handleToggleSidebar = useCallback(() => {
    setSidebarCollapsed((prev) => !prev);
  }, []);

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
    // TODO: Open new terminal
    console.log('New terminal clicked');
  }, []);

  // ============================================================================
  // Mobile Drawer Actions
  // ============================================================================

  const handleMobileDrawerToggle = useCallback((open: boolean) => {
    setMobileDrawerOpen(open);
  }, []);

  const handleSelectTaskWithDrawerClose = useCallback(
    (taskId: string) => {
      setMobileDrawerOpen(false);
      navigate({ to: '/tasks/$taskId', params: { taskId } });
    },
    [navigate]
  );

  const handleSelectChatWithDrawerClose = useCallback(
    (chatId: string) => {
      setMobileDrawerOpen(false);
      navigate({ to: '/chats/$chatId', params: { chatId } });
    },
    [navigate]
  );

  // ============================================================================
  // Create Project Dialog Actions
  // ============================================================================

  const handleBrowseFolder = useCallback(async () => {
    try {
      const selected = await open({
        directory: true,
        multiple: false,
        title: 'Select Git Repository',
      });
      if (selected && typeof selected === 'string') {
        setNewProjectPath(selected);
        // Try to auto-fill project name from folder name if not set
        if (!newProjectName.trim()) {
          const folderName = selected.split('/').pop() || '';
          setNewProjectName(folderName);
        }
      }
    } catch (error) {
      console.error('Failed to open folder picker:', error);
      setCreateError('Failed to open folder picker. Please enter the path manually.');
    }
  }, [newProjectName]);

  const handleCloseCreateProjectDialog = useCallback(() => {
    setIsCreateProjectDialogOpen(false);
  }, []);

  const handleCreateProject = useCallback(() => {
    setCreateError(null);

    if (!newProjectName.trim()) {
      setCreateError('Project name is required');
      return;
    }

    if (!newProjectPath.trim()) {
      setCreateError('Git repository path is required');
      return;
    }

    const request: CreateProjectRequest = {
      name: newProjectName.trim(),
      gitRepoPath: newProjectPath.trim(),
    };

    createProject.mutate(request, {
      onSuccess: (project) => {
        setIsCreateProjectDialogOpen(false);
        setNewProjectName('');
        setNewProjectPath('');
        setSelectedProjectId(project.id);
        onSuccess?.('Project created', `"${project.name}" has been created successfully.`);
      },
      onError: (error) => {
        setCreateError(error.message);
        onError?.('Failed to create project', error.message);
      },
    });
  }, [newProjectName, newProjectPath, createProject, onSuccess, onError]);

  // ============================================================================
  // Create Task Dialog Actions
  // ============================================================================

  const handleCloseCreateTaskDialog = useCallback(() => {
    setIsCreateTaskDialogOpen(false);
  }, []);

  const handleCreateTask = useCallback(() => {
    setCreateError(null);

    if (!activeProjectId) {
      setCreateError('Please select or create a project first');
      return;
    }

    if (!newTaskTitle.trim()) {
      setCreateError('Task title is required');
      return;
    }

    const request: CreateTaskRequest = {
      projectId: activeProjectId,
      title: newTaskTitle.trim(),
      description: newTaskDescription.trim() || undefined,
    };

    createTask.mutate(request, {
      onSuccess: (task) => {
        setIsCreateTaskDialogOpen(false);
        setNewTaskTitle('');
        setNewTaskDescription('');
        onSuccess?.('Task created', `"${task.title}" has been created.`);

        // Auto-create an initial chat/step for the task
        const defaultExecutorProfile =
          executorProfiles.find((p) => p.isDefault) ?? executorProfiles[0];
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
              navigate({ to: '/tasks/$taskId', params: { taskId: task.id } });
            },
            onError: () => {
              // Still navigate even if chat creation fails
              navigate({ to: '/tasks/$taskId', params: { taskId: task.id } });
            },
          }
        );
      },
      onError: (error) => {
        setCreateError(error.message);
        onError?.('Failed to create task', error.message);
      },
    });
  }, [
    activeProjectId,
    newTaskTitle,
    newTaskDescription,
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
      createChat.mutate(
        {
          projectId: data.projectId,
          title: data.title,
          chatRole: ChatRole.Main,
          executorProfileId: data.executorProfileId,
        },
        {
          onSuccess: (chat) => {
            setIsNewChatDialogOpen(false);
            onSuccess?.('Chat created', 'New chat session started.');
            navigate({ to: '/chats/$chatId', params: { chatId: chat.id } });

            if (import.meta.env.DEV) {
              console.log('[Dashboard] Created standalone chat:', chat.id);
            }
          },
          onError: (error) => {
            onError?.('Failed to create chat', error.message);
          },
        }
      );
    },
    [createChat, navigate, onSuccess, onError]
  );

  // ============================================================================
  // Command Palette Actions
  // ============================================================================

  const handleCommandSearch = useCallback((_query: string) => {
    // TODO: Implement search via searchQueries
  }, []);

  const handleCloseCommandPalette = useCallback(() => {
    setCommandPaletteOpen(false);
  }, []);

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

  // Build recent items for the command palette
  const recentItems: RecentItem[] = tasks.slice(0, 5).map((task) => {
    const item: RecentItem = {
      id: task.id,
      type: SearchResultType.Task,
      title: task.title,
    };
    if (activeProject?.name) {
      item.subtitle = activeProject.name;
    }
    return item;
  });

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
    sidebarCollapsed,
    isMobileDrawerOpen,
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

    // Sidebar actions
    handleSelectProject,
    handleSelectTask,
    handleNewTask,
    handleNewProject,
    handleStatusFilter,
    handleTaskStatusChange,
    handleSettingsClick,
    handleArchiveClick,
    handleToggleSidebar,

    // Header actions
    handleSearch,
    handleNewChat,
    handleNewTerminal,

    // Mobile drawer
    handleMobileDrawerToggle,
    handleSelectTaskWithDrawerClose,
    handleSelectChatWithDrawerClose,

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

    // Dialog actions - New Chat
    handleCloseNewChatDialog,
    handleCreateChatFromDialog,

    // Command palette actions
    handleCommandSearch,
    handleCloseCommandPalette,
  };
}
