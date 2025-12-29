/**
 * Project Detail Page Route
 *
 * Displays a single project with its task board.
 * Users can:
 * - View project details and settings
 * - See all tasks for the project in a kanban board
 * - Create new tasks
 * - Navigate to task details
 *
 * Follows the orchestration pattern: connects hooks to UI components.
 * Keeps page logic minimal (<200 lines) by delegating to UI components.
 */

import { useState, useCallback } from 'react';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import {
  Plus,
  Settings,
  FolderGit2,
  ChevronLeft,
} from 'lucide-react';
import {
  AppLayout,
  Header,
  Sidebar,
  TaskList,
  Dialog,
  FormField,
  Button,
  Input,
  Textarea,
} from '@openflow/ui';
import {
  useProject,
  useProjects,
  useTasks,
  useCreateTask,
  useUpdateTask,
  useKeyboardShortcuts,
} from '@openflow/hooks';
import type { TaskStatus, CreateTaskRequest } from '@openflow/generated';
import type { StatusFilter } from '@openflow/ui';

export const Route = createFileRoute('/projects/$projectId')({
  component: ProjectDetailPage,
});

function ProjectDetailPage() {
  const { projectId } = Route.useParams();
  const navigate = useNavigate();

  // UI state
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [isCreateTaskDialogOpen, setIsCreateTaskDialogOpen] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDescription, setNewTaskDescription] = useState('');
  const [createError, setCreateError] = useState<string | null>(null);

  // Data fetching
  const { data: project, isLoading: isLoadingProject } = useProject(projectId);
  const { data: projects = [] } = useProjects();
  const { data: tasks = [], isLoading: isLoadingTasks } = useTasks(projectId);
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();

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

  // Callbacks
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
    };

    createTask.mutate(request, {
      onSuccess: (task) => {
        setIsCreateTaskDialogOpen(false);
        setNewTaskTitle('');
        setNewTaskDescription('');
        navigate({ to: '/tasks/$taskId', params: { taskId: task.id } });
      },
      onError: (error) => {
        setCreateError(error.message);
      },
    });
  }, [projectId, newTaskTitle, newTaskDescription, createTask, navigate]);

  const handleCloseCreateDialog = useCallback(() => {
    setIsCreateTaskDialogOpen(false);
  }, []);

  const handleSearch = useCallback(() => {
    // TODO: Open command palette for search
    console.log('Search clicked');
  }, []);

  const handleBackToProjects = useCallback(() => {
    navigate({ to: '/projects' });
  }, [navigate]);

  // Filter tasks based on status filter
  const filteredTasks =
    statusFilter === 'all'
      ? tasks
      : tasks.filter((task) => task.status === statusFilter);

  // Loading state
  if (isLoadingProject) {
    return (
      <AppLayout
        sidebarCollapsed={true}
        sidebar={null}
        header={<Header title="Loading..." onSearch={handleSearch} />}
      >
        <div className="flex h-full items-center justify-center">
          <div className="text-sm text-[rgb(var(--muted-foreground))]">
            Loading project...
          </div>
        </div>
      </AppLayout>
    );
  }

  // Not found state
  if (!project) {
    return (
      <AppLayout
        sidebarCollapsed={true}
        sidebar={null}
        header={<Header title="Project Not Found" onSearch={handleSearch} />}
      >
        <div className="flex h-full flex-col items-center justify-center p-8">
          <FolderGit2 className="mb-4 h-16 w-16 text-[rgb(var(--muted-foreground))]" />
          <h2 className="text-lg font-semibold text-[rgb(var(--foreground))]">
            Project not found
          </h2>
          <p className="mt-2 text-sm text-[rgb(var(--muted-foreground))]">
            The project you're looking for doesn't exist or has been deleted.
          </p>
          <Button
            variant="primary"
            className="mt-4"
            onClick={handleBackToProjects}
          >
            <ChevronLeft className="mr-2 h-4 w-4" />
            Back to Projects
          </Button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout
      sidebarCollapsed={sidebarCollapsed}
      sidebar={
        <Sidebar
          projects={projects}
          tasks={tasks}
          selectedProjectId={projectId}
          statusFilter={statusFilter}
          onSelectProject={handleSelectProject}
          onSelectTask={handleSelectTask}
          onNewTask={handleNewTask}
          onNewProject={handleNewProject}
          onStatusFilter={handleStatusFilter}
          onTaskStatusChange={handleTaskStatusChange}
          onSettingsClick={handleSettingsClick}
          onArchiveClick={handleArchiveClick}
          isCollapsed={sidebarCollapsed}
          onToggleCollapse={handleToggleSidebar}
        />
      }
      header={
        <Header
          title={project.name}
          subtitle={`Branch: ${project.baseBranch}`}
          onSearch={handleSearch}
          onNewChat={handleNewTask}
        />
      }
    >
      <div className="flex h-full flex-col">
        {/* Project info bar */}
        <div className="flex items-center justify-between border-b border-[rgb(var(--border))] px-6 py-3">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={handleBackToProjects}
              className="flex items-center gap-1 text-sm text-[rgb(var(--muted-foreground))] hover:text-[rgb(var(--foreground))]"
            >
              <ChevronLeft className="h-4 w-4" />
              Projects
            </button>
            <span className="text-[rgb(var(--border))]">/</span>
            <span className="text-sm font-medium text-[rgb(var(--foreground))]">
              {project.name}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => navigate({ to: '/settings/projects' as string, search: { projectId } as Record<string, string> })}>
              <Settings className="h-4 w-4" />
            </Button>
            <Button variant="primary" size="sm" onClick={handleNewTask}>
              <Plus className="mr-1 h-4 w-4" />
              New Task
            </Button>
          </div>
        </div>

        {/* Task board content */}
        <div className="flex-1 overflow-auto p-6">
          {isLoadingTasks ? (
            <div className="flex h-full items-center justify-center">
              <div className="text-sm text-[rgb(var(--muted-foreground))]">
                Loading tasks...
              </div>
            </div>
          ) : filteredTasks.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center">
              <h3 className="text-lg font-medium text-[rgb(var(--foreground))]">
                No tasks yet
              </h3>
              <p className="mt-2 text-sm text-[rgb(var(--muted-foreground))]">
                Create your first task to get started.
              </p>
              <Button
                variant="primary"
                className="mt-4"
                onClick={handleNewTask}
              >
                <Plus className="mr-2 h-4 w-4" />
                Create Task
              </Button>
            </div>
          ) : (
            <TaskList
              tasks={filteredTasks}
              onSelectTask={handleSelectTask}
              onStatusChange={handleTaskStatusChange}
            />
          )}
        </div>
      </div>

      {/* Create task dialog */}
      <Dialog
        isOpen={isCreateTaskDialogOpen}
        onClose={handleCloseCreateDialog}
        title="Create New Task"
      >
        <div className="space-y-4">
          <FormField
            label="Task Title"
            required
            {...(!newTaskTitle.trim() && createError ? { error: 'Required' } : {})}
          >
            <Input
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              placeholder="e.g., Implement user authentication"
              autoFocus
            />
          </FormField>

          <FormField label="Description">
            <Textarea
              value={newTaskDescription}
              onChange={(e) => setNewTaskDescription(e.target.value)}
              placeholder="Describe what needs to be done..."
              rows={4}
            />
          </FormField>

          {createError && (
            <p className="text-sm text-red-400">{createError}</p>
          )}

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="ghost" onClick={handleCloseCreateDialog}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleCreateTask}
              loading={createTask.isPending}
            >
              Create Task
            </Button>
          </div>
        </div>
      </Dialog>
    </AppLayout>
  );
}
