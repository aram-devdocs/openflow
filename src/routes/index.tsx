/**
 * Dashboard / Home Page Route
 *
 * The main entry point of the application. Displays:
 * - Project overview with sidebar
 * - Task board for selected project
 * - Recent tasks and quick actions
 *
 * This route is a pure composition of UI components and hooks.
 * All business logic is encapsulated in useDashboardSession.
 * All UI components are stateless and imported from @openflow/ui.
 */

import { useDashboardSession } from '@openflow/hooks';
import {
  CreateProjectDialog,
  CreateTaskDialog,
  DashboardCommandPalette,
  DashboardContent,
  DashboardHeader,
  DashboardLayout,
  DashboardNewChatDialog,
  DashboardSidebar,
  useToast,
} from '@openflow/ui';
import { createFileRoute, useNavigate } from '@tanstack/react-router';

export const Route = createFileRoute('/')({
  component: DashboardPage,
});

function DashboardPage() {
  const navigate = useNavigate();
  const toast = useToast();

  const session = useDashboardSession({
    navigate,
    onSuccess: (title, message) => toast.success(title, message),
    onError: (title, message) => toast.error(title, message),
  });

  return (
    <DashboardLayout
      sidebarCollapsed={session.sidebarCollapsed}
      isMobileDrawerOpen={session.isMobileDrawerOpen}
      onMobileDrawerToggle={session.handleMobileDrawerToggle}
      sidebar={
        <DashboardSidebar
          projects={session.projects}
          tasks={session.tasks}
          chats={session.standaloneChats}
          selectedProjectId={session.activeProjectId}
          statusFilter={session.statusFilter}
          onSelectProject={session.handleSelectProject}
          onSelectTask={session.handleSelectTaskWithDrawerClose}
          onSelectChat={session.handleSelectChatWithDrawerClose}
          onNewTask={session.handleNewTask}
          onNewChat={session.handleNewChat}
          onNewProject={session.handleNewProject}
          onStatusFilter={session.handleStatusFilter}
          onTaskStatusChange={session.handleTaskStatusChange}
          onSettingsClick={session.handleSettingsClick}
          onArchiveClick={session.handleArchiveClick}
          isCollapsed={session.sidebarCollapsed}
          onToggleCollapse={session.handleToggleSidebar}
        />
      }
      header={
        <DashboardHeader
          title={session.activeProject?.name ?? 'OpenFlow'}
          subtitle={session.headerSubtitle}
          onSearch={session.handleSearch}
          onNewChat={session.handleNewChat}
          onNewTerminal={session.handleNewTerminal}
        />
      }
    >
      {/* Main content area - switches between empty/loading/content states */}
      <div className="flex h-full flex-col">
        <DashboardContent
          isLoadingProjects={session.isLoadingProjects}
          isLoadingTasks={session.isLoadingTasks}
          activeProjectId={session.activeProjectId}
          tasks={session.tasks}
          onSelectTask={session.handleSelectTask}
          onNewProject={session.handleNewProject}
        />
      </div>

      {/* Command palette overlay */}
      <DashboardCommandPalette
        isOpen={session.commandPaletteOpen}
        onClose={session.handleCloseCommandPalette}
        onSearch={session.handleCommandSearch}
        actions={session.commandActions}
        recentItems={session.recentItems}
      />

      {/* Create project dialog */}
      <CreateProjectDialog
        isOpen={session.isCreateProjectDialogOpen}
        onClose={session.handleCloseCreateProjectDialog}
        projectName={session.newProjectName}
        onProjectNameChange={session.setNewProjectName}
        projectPath={session.newProjectPath}
        onProjectPathChange={session.setNewProjectPath}
        onBrowseFolder={session.handleBrowseFolder}
        onCreate={session.handleCreateProject}
        isPending={session.isCreatingProject}
        error={session.createError}
      />

      {/* Create task dialog */}
      <CreateTaskDialog
        isOpen={session.isCreateTaskDialogOpen}
        onClose={session.handleCloseCreateTaskDialog}
        taskTitle={session.newTaskTitle}
        onTaskTitleChange={session.setNewTaskTitle}
        taskDescription={session.newTaskDescription}
        onTaskDescriptionChange={session.setNewTaskDescription}
        onCreate={session.handleCreateTask}
        isPending={session.isCreatingTask}
        error={session.createError}
      />

      {/* New Chat dialog */}
      <DashboardNewChatDialog
        isOpen={session.isNewChatDialogOpen}
        onClose={session.handleCloseNewChatDialog}
        projects={session.projects}
        executorProfiles={session.executorProfiles}
        selectedProjectId={session.activeProjectId}
        isSubmitting={session.isCreatingChat}
        onCreate={session.handleCreateChatFromDialog}
        onNewProject={session.handleNewProject}
      />
    </DashboardLayout>
  );
}
