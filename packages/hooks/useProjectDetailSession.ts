/**
 * useProjectDetailSession - Hook for managing Project Detail page state
 *
 * This hook encapsulates all the state management, data fetching, and
 * callbacks for the Project Detail page, keeping the route component pure.
 */

import type {
  CreateTaskRequest,
  Project,
  Task,
  TaskStatus,
  WorkflowTemplate,
} from '@openflow/generated';
import { useCallback, useState } from 'react';

// Local type definitions to avoid importing from @openflow/ui (architecture violation)
type StatusFilter = TaskStatus | 'all';

import { useKeyboardShortcuts } from './useKeyboardShortcuts';
import { useProject, useProjects } from './useProjects';
import { useCreateTask, useTasks, useUpdateTask } from './useTasks';
import { useWorkflowTemplates } from './useWorkflows';

// ============================================================================
// Types
// ============================================================================

export interface UseProjectDetailSessionOptions {
  /** The project ID from route params */
  projectId: string;
  /** Callback for navigation */
  navigate: (opts: {
    to: string;
    params?: Record<string, string>;
    search?: Record<string, string>;
  }) => void;
}

export interface ProjectDetailSessionState {
  // Data
  project: Project | undefined;
  projects: Project[];
  tasks: Task[];
  filteredTasks: Task[];
  workflows: WorkflowTemplate[];

  // Loading states
  isLoadingProject: boolean;
  isLoadingTasks: boolean;
  isLoadingWorkflows: boolean;

  // UI state
  sidebarCollapsed: boolean;
  statusFilter: StatusFilter;

  // Create task dialog state
  isCreateTaskDialogOpen: boolean;
  newTaskTitle: string;
  newTaskDescription: string;
  selectedWorkflow: WorkflowTemplate | null;
  createError: string | null;
  isCreatingTask: boolean;

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

  // Header/navigation actions
  handleSearch: () => void;
  handleBackToProjects: () => void;
  handleProjectSettings: () => void;

  // Create task dialog actions
  handleOpenCreateTaskDialog: () => void;
  handleCloseCreateTaskDialog: () => void;
  handleCreateTask: () => void;
  setNewTaskTitle: (title: string) => void;
  setNewTaskDescription: (description: string) => void;
  setSelectedWorkflow: (workflow: WorkflowTemplate | null) => void;
}

// ============================================================================
// Hook Implementation
// ============================================================================

/**
 * useProjectDetailSession hook for managing Project Detail page state.
 *
 * Encapsulates:
 * - Data fetching (project, tasks, workflows)
 * - UI state (sidebar, dialogs)
 * - All user interaction callbacks
 * - Navigation handling
 *
 * @example
 * ```tsx
 * function ProjectDetailPage() {
 *   const { projectId } = Route.useParams();
 *   const navigate = useNavigate();
 *   const session = useProjectDetailSession({ projectId, navigate });
 *
 *   if (session.isLoadingProject) {
 *     return <ProjectDetailLoadingSkeleton />;
 *   }
 *
 *   if (!session.project) {
 *     return <ProjectNotFound onBack={session.handleBackToProjects} />;
 *   }
 *
 *   return (
 *     <ProjectDetailLayout {...session}>
 *       <ProjectDetailContent {...session} />
 *       <CreateTaskDialog {...session} />
 *     </ProjectDetailLayout>
 *   );
 * }
 * ```
 */
export function useProjectDetailSession({
  projectId,
  navigate,
}: UseProjectDetailSessionOptions): ProjectDetailSessionState {
  // UI state
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  // Create task dialog state
  const [isCreateTaskDialogOpen, setIsCreateTaskDialogOpen] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDescription, setNewTaskDescription] = useState('');
  const [selectedWorkflow, setSelectedWorkflow] = useState<WorkflowTemplate | null>(null);
  const [createError, setCreateError] = useState<string | null>(null);

  // Data fetching
  const { data: project, isLoading: isLoadingProject } = useProject(projectId);
  const { data: projects = [] } = useProjects();
  const { data: tasks = [], isLoading: isLoadingTasks } = useTasks(projectId);
  const { data: workflows = [], isLoading: isLoadingWorkflows } = useWorkflowTemplates(projectId);

  // Mutations
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();

  // Filter tasks based on status filter
  const filteredTasks =
    statusFilter === 'all' ? tasks : tasks.filter((task) => task.status === statusFilter);

  // Keyboard shortcuts
  useKeyboardShortcuts([
    {
      key: 'n',
      meta: true,
      action: () => setIsCreateTaskDialogOpen(true),
    },
    {
      key: 'Escape',
      action: () => setIsCreateTaskDialogOpen(false),
    },
  ]);

  // ============================================================================
  // Sidebar Actions
  // ============================================================================

  const handleSelectProject = useCallback(
    (id: string) => {
      navigate({ to: '/projects/$projectId', params: { projectId: id } });
    },
    [navigate]
  );

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
    setSelectedWorkflow(null);
    setIsCreateTaskDialogOpen(true);
  }, []);

  const handleNewProject = useCallback(() => {
    navigate({ to: '/projects' });
  }, [navigate]);

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
  // Header/Navigation Actions
  // ============================================================================

  const handleSearch = useCallback(() => {
    // TODO: Open command palette for search
    console.log('Search clicked');
  }, []);

  const handleBackToProjects = useCallback(() => {
    navigate({ to: '/projects' });
  }, [navigate]);

  const handleProjectSettings = useCallback(() => {
    navigate({
      to: '/settings/projects' as string,
      search: { projectId } as Record<string, string>,
    });
  }, [navigate, projectId]);

  // ============================================================================
  // Create Task Dialog Actions
  // ============================================================================

  const handleOpenCreateTaskDialog = useCallback(() => {
    setCreateError(null);
    setNewTaskTitle('');
    setNewTaskDescription('');
    setSelectedWorkflow(null);
    setIsCreateTaskDialogOpen(true);
  }, []);

  const handleCloseCreateTaskDialog = useCallback(() => {
    setIsCreateTaskDialogOpen(false);
  }, []);

  const handleCreateTask = useCallback(() => {
    setCreateError(null);

    if (!newTaskTitle.trim()) {
      setCreateError('Task title is required');
      return;
    }

    const request: CreateTaskRequest = {
      projectId,
      title: newTaskTitle.trim(),
      ...(newTaskDescription.trim() ? { description: newTaskDescription.trim() } : {}),
      ...(selectedWorkflow ? { workflowTemplate: selectedWorkflow.id } : {}),
    };

    createTask.mutate(request, {
      onSuccess: (task) => {
        setIsCreateTaskDialogOpen(false);
        setNewTaskTitle('');
        setNewTaskDescription('');
        setSelectedWorkflow(null);
        navigate({ to: '/tasks/$taskId', params: { taskId: task.id } });
      },
      onError: (error) => {
        setCreateError(error.message);
      },
    });
  }, [projectId, newTaskTitle, newTaskDescription, selectedWorkflow, createTask, navigate]);

  return {
    // Data
    project,
    projects,
    tasks,
    filteredTasks,
    workflows,

    // Loading states
    isLoadingProject,
    isLoadingTasks,
    isLoadingWorkflows,

    // UI state
    sidebarCollapsed,
    statusFilter,

    // Create task dialog state
    isCreateTaskDialogOpen,
    newTaskTitle,
    newTaskDescription,
    selectedWorkflow,
    createError,
    isCreatingTask: createTask.isPending,

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

    // Header/navigation actions
    handleSearch,
    handleBackToProjects,
    handleProjectSettings,

    // Create task dialog actions
    handleOpenCreateTaskDialog,
    handleCloseCreateTaskDialog,
    handleCreateTask,
    setNewTaskTitle,
    setNewTaskDescription,
    setSelectedWorkflow,
  };
}
