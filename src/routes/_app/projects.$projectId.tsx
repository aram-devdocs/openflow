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
 * Follows the pure composition pattern: connects hooks to UI components.
 * All state and logic lives in useProjectDetailSession hook.
 */

import { useProjectDetailSession } from '@openflow/hooks';
import { ProjectDetailPage } from '@openflow/ui';
import { createFileRoute, useNavigate } from '@tanstack/react-router';

export const Route = createFileRoute('/_app/projects/$projectId')({
  component: ProjectDetailRoute,
});

function ProjectDetailRoute() {
  const { projectId } = Route.useParams();
  const navigate = useNavigate();

  const session = useProjectDetailSession({
    projectId,
    navigate: ({ to, params, search }) =>
      navigate({ to, params, search } as Parameters<typeof navigate>[0]),
  });

  // Loading state
  if (session.isLoadingProject) {
    return <ProjectDetailPage state="loading" onSearch={session.handleSearch} />;
  }

  // Not found state
  if (!session.project) {
    return (
      <ProjectDetailPage
        state="not-found"
        onNotFoundBack={session.handleBackToProjects}
        onSearch={session.handleSearch}
      />
    );
  }

  // Ready state
  return (
    <ProjectDetailPage
      state="ready"
      project={session.project}
      sidebarCollapsed={session.sidebarCollapsed}
      sidebar={{
        projects: session.projects,
        tasks: session.tasks,
        projectId,
        statusFilter: session.statusFilter,
        isCollapsed: session.sidebarCollapsed,
        onSelectProject: session.handleSelectProject,
        onSelectTask: session.handleSelectTask,
        onNewTask: session.handleNewTask,
        onNewProject: session.handleNewProject,
        onStatusFilter: session.handleStatusFilter,
        onTaskStatusChange: session.handleTaskStatusChange,
        onSettingsClick: session.handleSettingsClick,
        onArchiveClick: session.handleArchiveClick,
        onToggleCollapse: session.handleToggleSidebar,
      }}
      header={{
        onSearch: session.handleSearch,
        onNewTask: session.handleNewTask,
      }}
      infoBar={{
        onBack: session.handleBackToProjects,
        onSettings: session.handleProjectSettings,
        onNewTask: session.handleNewTask,
      }}
      content={{
        isLoading: session.isLoadingTasks,
        tasks: session.filteredTasks,
        onSelectTask: session.handleSelectTask,
        onTaskStatusChange: session.handleTaskStatusChange,
        onNewTask: session.handleNewTask,
      }}
      createTaskDialog={{
        isOpen: session.isCreateTaskDialogOpen,
        taskTitle: session.newTaskTitle,
        taskDescription: session.newTaskDescription,
        selectedWorkflow: session.selectedWorkflow,
        workflows: session.workflows,
        isLoadingWorkflows: session.isLoadingWorkflows,
        isCreating: session.isCreatingTask,
        error: session.createError,
        onClose: session.handleCloseCreateTaskDialog,
        onCreate: session.handleCreateTask,
        onTitleChange: session.setNewTaskTitle,
        onDescriptionChange: session.setNewTaskDescription,
        onWorkflowSelect: session.setSelectedWorkflow,
      }}
    />
  );
}
