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
import {
  ProjectCreateTaskDialog,
  ProjectDetailContent,
  ProjectDetailHeader,
  ProjectDetailInfoBar,
  ProjectDetailLayout,
  ProjectDetailLoadingSkeleton,
  ProjectDetailSidebar,
  ProjectNotFound,
} from '@openflow/ui';
import { createFileRoute, useNavigate } from '@tanstack/react-router';

export const Route = createFileRoute('/_app/projects/$projectId')({
  component: ProjectDetailPage,
});

function ProjectDetailPage() {
  const { projectId } = Route.useParams();
  const navigate = useNavigate();

  const session = useProjectDetailSession({
    projectId,
    navigate: ({ to, params, search }) =>
      navigate({ to, params, search } as Parameters<typeof navigate>[0]),
  });

  // Loading state
  if (session.isLoadingProject) {
    return <ProjectDetailLoadingSkeleton onSearch={session.handleSearch} />;
  }

  // Not found state
  if (!session.project) {
    return (
      <ProjectNotFound onBack={session.handleBackToProjects} onSearch={session.handleSearch} />
    );
  }

  return (
    <ProjectDetailLayout
      sidebarCollapsed={session.sidebarCollapsed}
      sidebar={
        <ProjectDetailSidebar
          projects={session.projects}
          tasks={session.tasks}
          projectId={projectId}
          statusFilter={session.statusFilter}
          isCollapsed={session.sidebarCollapsed}
          onSelectProject={session.handleSelectProject}
          onSelectTask={session.handleSelectTask}
          onNewTask={session.handleNewTask}
          onNewProject={session.handleNewProject}
          onStatusFilter={session.handleStatusFilter}
          onTaskStatusChange={session.handleTaskStatusChange}
          onSettingsClick={session.handleSettingsClick}
          onArchiveClick={session.handleArchiveClick}
          onToggleCollapse={session.handleToggleSidebar}
        />
      }
      header={
        <ProjectDetailHeader
          project={session.project}
          onSearch={session.handleSearch}
          onNewTask={session.handleNewTask}
        />
      }
    >
      <div className="flex h-full flex-col">
        <ProjectDetailInfoBar
          project={session.project}
          onBack={session.handleBackToProjects}
          onSettings={session.handleProjectSettings}
          onNewTask={session.handleNewTask}
        />
        <ProjectDetailContent
          isLoading={session.isLoadingTasks}
          tasks={session.filteredTasks}
          onSelectTask={session.handleSelectTask}
          onTaskStatusChange={session.handleTaskStatusChange}
          onNewTask={session.handleNewTask}
        />
      </div>

      <ProjectCreateTaskDialog
        isOpen={session.isCreateTaskDialogOpen}
        taskTitle={session.newTaskTitle}
        taskDescription={session.newTaskDescription}
        selectedWorkflow={session.selectedWorkflow}
        workflows={session.workflows}
        isLoadingWorkflows={session.isLoadingWorkflows}
        isCreating={session.isCreatingTask}
        error={session.createError}
        onClose={session.handleCloseCreateTaskDialog}
        onCreate={session.handleCreateTask}
        onTitleChange={session.setNewTaskTitle}
        onDescriptionChange={session.setNewTaskDescription}
        onWorkflowSelect={session.setSelectedWorkflow}
      />
    </ProjectDetailLayout>
  );
}
