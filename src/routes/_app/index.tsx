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

import {
  useDashboardSession,
  useNavigation,
  useProcessOutput,
  useResizeTerminal,
  useSendInput,
  useTheme,
  useToast,
} from '@openflow/hooks';
import { DashboardPage } from '@openflow/ui';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useCallback } from 'react';

export const Route = createFileRoute('/_app/')({
  component: DashboardRoute,
});

function DashboardRoute() {
  const navigate = useNavigate();
  const toast = useToast();
  const navigation = useNavigation();
  const { resolvedTheme, setTheme } = useTheme();

  const handleThemeToggle = useCallback(() => {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
  }, [resolvedTheme, setTheme]);

  const session = useDashboardSession({
    navigate,
    onSuccess: (title, message) => toast.success(title, message),
    onError: (title, message) => toast.error(title, message),
  });

  // Terminal hooks - only subscribe to output when terminal is open and has a process
  const { rawOutput, isRunning } = useProcessOutput(
    session.terminalOpen && session.terminalProcessId ? session.terminalProcessId : ''
  );
  const sendInput = useSendInput();
  const resizeTerminal = useResizeTerminal();

  // Terminal input handler
  const handleTerminalInput = useCallback(
    (data: string) => {
      if (session.terminalProcessId) {
        sendInput.mutate({ processId: session.terminalProcessId, input: data });
      }
    },
    [session.terminalProcessId, sendInput]
  );

  // Terminal resize handler
  const handleTerminalResize = useCallback(
    (cols: number, rows: number) => {
      if (session.terminalProcessId) {
        resizeTerminal.mutate({ processId: session.terminalProcessId, cols, rows });
      }
    },
    [session.terminalProcessId, resizeTerminal]
  );

  // Combine navigation context drawer close with session handlers
  const handleSelectTaskWithDrawerClose = useCallback(
    (taskId: string) => {
      navigation.closeMobileDrawer();
      session.handleSelectTask(taskId);
    },
    [navigation.closeMobileDrawer, session.handleSelectTask]
  );

  const handleSelectChatWithDrawerClose = useCallback(
    (chatId: string) => {
      navigation.closeMobileDrawer();
      session.handleSelectChat(chatId);
    },
    [navigation.closeMobileDrawer, session.handleSelectChat]
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
        onTaskContextMenu: session.handleTaskContextMenu,
        onChatContextMenu: session.handleChatContextMenu,
        onViewAllChats: session.handleViewAllChats,
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
        resolvedTheme,
        onThemeToggle: handleThemeToggle,
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
        query: session.searchQuery,
        searchResults: session.searchResults,
        isSearching: session.isSearching,
        onSelectResult: session.handleSelectSearchResult,
        onSelectRecent: session.handleSelectRecent,
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
        workflows: session.workflowTemplates,
        isLoadingWorkflows: session.isLoadingWorkflows,
        selectedWorkflow: session.selectedWorkflow,
        onSelectWorkflow: session.handleSelectWorkflow,
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
      terminal={{
        isOpen: session.terminalOpen,
        onClose: session.handleCloseTerminal,
        processId: session.terminalProcessId,
        rawOutput,
        onInput: handleTerminalInput,
        onResize: handleTerminalResize,
        isRunning,
        isLoading: session.isSpawningTerminal,
      }}
      chatContextMenu={
        session.chatContextMenu
          ? {
              isOpen: true,
              position: session.chatContextMenu.position,
              onClose: session.handleCloseChatContextMenu,
              onViewDetails: session.handleViewChat,
              onArchive: session.handleArchiveChat,
              onDelete: session.handleDeleteChat,
            }
          : undefined
      }
      taskContextMenu={
        session.taskContextMenu
          ? {
              isOpen: true,
              position: session.taskContextMenu.position,
              onClose: session.handleCloseTaskContextMenu,
              onViewDetails: session.handleViewTask,
              onDuplicate: session.handleDuplicateTask,
              onOpenInIDE: session.handleOpenInIDE,
              onArchive: session.handleArchiveTaskFromMenu,
              onDelete: session.handleDeleteTaskFromMenu,
            }
          : undefined
      }
    />
  );
}
