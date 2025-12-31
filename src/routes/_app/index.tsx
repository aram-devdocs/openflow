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
 * Navigation state (sidebar, mobile drawer) comes from NavigationContext.
 * All UI components are stateless and imported from @openflow/ui.
 */

import { useDashboardSession, useNavigation } from '@openflow/hooks';
import { DashboardPage, useToast } from '@openflow/ui';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useCallback } from 'react';

export const Route = createFileRoute('/_app/')({
  component: DashboardRoute,
});

function DashboardRoute() {
  const navigate = useNavigate();
  const toast = useToast();
  const navigation = useNavigation();

  const session = useDashboardSession({
    navigate,
    onSuccess: (title, message) => toast.success(title, message),
    onError: (title, message) => toast.error(title, message),
  });

  // Combine navigation context drawer close with session handlers
  const handleSelectTaskWithDrawerClose = useCallback(
    (taskId: string) => {
      navigation.closeMobileDrawer();
      session.handleSelectTaskWithDrawerClose(taskId);
    },
    [navigation, session]
  );

  const handleSelectChatWithDrawerClose = useCallback(
    (chatId: string) => {
      navigation.closeMobileDrawer();
      session.handleSelectChatWithDrawerClose(chatId);
    },
    [navigation, session]
  );

  return (
    <DashboardPage
      sidebarCollapsed={navigation.sidebarCollapsed}
      isMobileDrawerOpen={navigation.isMobileDrawerOpen}
      onMobileDrawerToggle={navigation.setMobileDrawerOpen}
      sidebar={{
        projects: session.projects,
        tasks: session.tasks,
        chats: session.standaloneChats,
        selectedProjectId: session.activeProjectId,
        statusFilter: session.statusFilter,
        onSelectProject: session.handleSelectProject,
        onSelectTask: handleSelectTaskWithDrawerClose,
        onSelectChat: handleSelectChatWithDrawerClose,
        onNewTask: session.handleNewTask,
        onNewChat: session.handleNewChat,
        onNewProject: session.handleNewProject,
        onStatusFilter: session.handleStatusFilter,
        onTaskStatusChange: session.handleTaskStatusChange,
        onSettingsClick: session.handleSettingsClick,
        onArchiveClick: session.handleArchiveClick,
        isCollapsed: navigation.sidebarCollapsed,
        onToggleCollapse: navigation.toggleSidebar,
      }}
      header={{
        title: session.activeProject?.name ?? 'OpenFlow',
        subtitle: session.headerSubtitle,
        onSearch: session.handleSearch,
        onNewChat: session.handleNewChat,
        onNewTerminal: session.handleNewTerminal,
      }}
      content={{
        isLoadingProjects: session.isLoadingProjects,
        isLoadingTasks: session.isLoadingTasks,
        activeProjectId: session.activeProjectId,
        tasks: session.tasks,
        onSelectTask: session.handleSelectTask,
        onNewProject: session.handleNewProject,
      }}
      commandPalette={{
        isOpen: session.commandPaletteOpen,
        onClose: session.handleCloseCommandPalette,
        onSearch: session.handleCommandSearch,
        actions: session.commandActions,
        recentItems: session.recentItems,
      }}
      createProjectDialog={{
        isOpen: session.isCreateProjectDialogOpen,
        onClose: session.handleCloseCreateProjectDialog,
        projectName: session.newProjectName,
        onProjectNameChange: session.setNewProjectName,
        projectPath: session.newProjectPath,
        onProjectPathChange: session.setNewProjectPath,
        onBrowseFolder: session.handleBrowseFolder,
        onCreate: session.handleCreateProject,
        isPending: session.isCreatingProject,
        error: session.createError,
      }}
      createTaskDialog={{
        isOpen: session.isCreateTaskDialogOpen,
        onClose: session.handleCloseCreateTaskDialog,
        taskTitle: session.newTaskTitle,
        onTaskTitleChange: session.setNewTaskTitle,
        taskDescription: session.newTaskDescription,
        onTaskDescriptionChange: session.setNewTaskDescription,
        onCreate: session.handleCreateTask,
        isPending: session.isCreatingTask,
        error: session.createError,
      }}
      newChatDialog={{
        isOpen: session.isNewChatDialogOpen,
        onClose: session.handleCloseNewChatDialog,
        projects: session.projects,
        executorProfiles: session.executorProfiles,
        selectedProjectId: session.activeProjectId,
        isSubmitting: session.isCreatingChat,
        onCreate: session.handleCreateChatFromDialog,
        onNewProject: session.handleNewProject,
      }}
    />
  );
}
