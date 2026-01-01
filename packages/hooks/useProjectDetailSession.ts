/**
 * useProjectDetailSession - Hook for managing Project Detail page state
 *
 * This hook encapsulates all the state management, data fetching, and
 * callbacks for the Project Detail page, keeping the route component pure.
 *
 * Features:
 * - Full logging at DEBUG/INFO/WARN/ERROR levels
 * - Toast notifications for user feedback on task creation and status updates
 * - Proper error handling with form validation
 * - Keyboard shortcuts for common actions
 */

import type {
  CreateTaskRequest,
  Project,
  Task,
  TaskStatus,
  WorkflowTemplate,
} from '@openflow/generated';
import { createLogger } from '@openflow/utils';
import { useCallback, useRef, useState } from 'react';

// Local type definitions to avoid importing from @openflow/ui (architecture violation)
type StatusFilter = TaskStatus | 'all';

import { useKeyboardShortcuts } from './useKeyboardShortcuts';
import { useProject, useProjects } from './useProjects';
import { useCreateTask, useTasks, useUpdateTask } from './useTasks';
import { useToast } from './useToast';
import { useWorkflowTemplates } from './useWorkflows';

// ============================================================================
// Logger
// ============================================================================

const logger = createLogger('useProjectDetailSession');

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
  // Track initialization logging
  const hasLoggedInit = useRef(false);
  if (!hasLoggedInit.current) {
    logger.debug('Hook initialized', { projectId });
    hasLoggedInit.current = true;
  }

  // Toast notifications
  const toast = useToast();

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
      action: () => {
        logger.info('Keyboard shortcut activated: Cmd+N (new task)', { projectId });
        setIsCreateTaskDialogOpen(true);
      },
    },
    {
      key: 'Escape',
      action: () => {
        if (isCreateTaskDialogOpen) {
          logger.debug('Keyboard shortcut activated: Escape (close dialog)');
          setIsCreateTaskDialogOpen(false);
        }
      },
    },
  ]);

  // ============================================================================
  // Sidebar Actions
  // ============================================================================

  const handleSelectProject = useCallback(
    (id: string) => {
      logger.debug('Selecting project', { fromProjectId: projectId, toProjectId: id });
      navigate({ to: '/projects/$projectId', params: { projectId: id } });
    },
    [navigate, projectId]
  );

  const handleSelectTask = useCallback(
    (taskId: string) => {
      logger.debug('Selecting task', { projectId, taskId });
      navigate({ to: '/tasks/$taskId', params: { taskId } });
    },
    [navigate, projectId]
  );

  const handleNewTask = useCallback(() => {
    logger.debug('Opening new task dialog', { projectId });
    setCreateError(null);
    setNewTaskTitle('');
    setNewTaskDescription('');
    setSelectedWorkflow(null);
    setIsCreateTaskDialogOpen(true);
  }, [projectId]);

  const handleNewProject = useCallback(() => {
    logger.debug('Navigating to create new project');
    navigate({ to: '/projects' });
  }, [navigate]);

  const handleStatusFilter = useCallback(
    (status: StatusFilter) => {
      logger.debug('Status filter changed', { previousFilter: statusFilter, newFilter: status });
      setStatusFilter(status);
    },
    [statusFilter]
  );

  const handleTaskStatusChange = useCallback(
    (taskId: string, status: TaskStatus) => {
      logger.debug('Updating task status', { projectId, taskId, newStatus: status });
      updateTask.mutate(
        { id: taskId, request: { status } },
        {
          onSuccess: () => {
            logger.info('Task status updated successfully', { projectId, taskId, status });
            toast.success('Status Updated', `Task status changed to ${status}`);
          },
          onError: (error) => {
            logger.error('Failed to update task status', {
              projectId,
              taskId,
              status,
              error: error.message,
            });
            toast.error('Update Failed', `Could not update task status: ${error.message}`);
          },
        }
      );
    },
    [updateTask, projectId, toast]
  );

  const handleSettingsClick = useCallback(() => {
    logger.debug('Navigating to settings');
    navigate({ to: '/settings' as string });
  }, [navigate]);

  const handleArchiveClick = useCallback(() => {
    logger.debug('Navigating to archive');
    navigate({ to: '/archive' as string });
  }, [navigate]);

  const handleToggleSidebar = useCallback(() => {
    setSidebarCollapsed((prev) => {
      const newState = !prev;
      logger.debug('Sidebar toggled', { collapsed: newState });
      return newState;
    });
  }, []);

  // ============================================================================
  // Header/Navigation Actions
  // ============================================================================

  const handleSearch = useCallback(() => {
    logger.debug('Search triggered', { projectId });
    // TODO: Open command palette for search
  }, [projectId]);

  const handleBackToProjects = useCallback(() => {
    logger.debug('Navigating back to projects list');
    navigate({ to: '/projects' });
  }, [navigate]);

  const handleProjectSettings = useCallback(() => {
    logger.debug('Navigating to project settings', { projectId });
    navigate({
      to: '/settings/projects' as string,
      search: { projectId } as Record<string, string>,
    });
  }, [navigate, projectId]);

  // ============================================================================
  // Create Task Dialog Actions
  // ============================================================================

  const handleOpenCreateTaskDialog = useCallback(() => {
    logger.debug('Opening create task dialog', { projectId });
    setCreateError(null);
    setNewTaskTitle('');
    setNewTaskDescription('');
    setSelectedWorkflow(null);
    setIsCreateTaskDialogOpen(true);
  }, [projectId]);

  const handleCloseCreateTaskDialog = useCallback(() => {
    logger.debug('Closing create task dialog');
    setIsCreateTaskDialogOpen(false);
  }, []);

  const handleCreateTask = useCallback(() => {
    setCreateError(null);

    // Validation
    if (!newTaskTitle.trim()) {
      logger.warn('Create task validation failed: missing title', { projectId });
      setCreateError('Task title is required');
      return;
    }

    const request: CreateTaskRequest = {
      projectId,
      title: newTaskTitle.trim(),
      ...(newTaskDescription.trim() ? { description: newTaskDescription.trim() } : {}),
      ...(selectedWorkflow ? { workflowTemplate: selectedWorkflow.id } : {}),
    };

    logger.debug('Creating task', {
      projectId,
      title: request.title,
      hasDescription: !!request.description,
      workflowId: selectedWorkflow?.id,
    });

    createTask.mutate(request, {
      onSuccess: (task) => {
        logger.info('Task created successfully', {
          projectId,
          taskId: task.id,
          title: task.title,
          workflowId: selectedWorkflow?.id,
        });
        toast.success('Task Created', `Created "${task.title}"`);
        setIsCreateTaskDialogOpen(false);
        setNewTaskTitle('');
        setNewTaskDescription('');
        setSelectedWorkflow(null);
        navigate({ to: '/tasks/$taskId', params: { taskId: task.id } });
      },
      onError: (error) => {
        logger.error('Failed to create task', {
          projectId,
          title: newTaskTitle,
          error: error.message,
        });
        toast.error('Creation Failed', `Could not create task: ${error.message}`);
        setCreateError(error.message);
      },
    });
  }, [projectId, newTaskTitle, newTaskDescription, selectedWorkflow, createTask, navigate, toast]);

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
