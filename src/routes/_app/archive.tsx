/**
 * Archive Page Route
 *
 * Displays all archived tasks and chats with options to:
 * - View archived entity details
 * - Restore entities back to active status
 * - Permanently delete entities
 *
 * Pure composition pattern: connects hooks to UI components.
 */

import { useArchiveSession } from '@openflow/hooks';
import { ArchivePage } from '@openflow/ui';
import { createFileRoute, useNavigate } from '@tanstack/react-router';

export const Route = createFileRoute('/_app/archive')({
  component: ArchiveRoute,
});

function ArchiveRoute() {
  const navigate = useNavigate();
  const session = useArchiveSession({ navigate });

  return (
    <ArchivePage
      isLoading={session.isLoading}
      header={{
        archivedCount: session.archivedCount,
        activeTab: session.activeTab,
        onSearch: session.handleSearch,
      }}
      tabBar={{
        activeTab: session.activeTab,
        onTabChange: session.setActiveTab,
        taskCount: session.archivedTasks.length,
        chatCount: session.archivedChats.length,
        projectCount: session.archivedProjects.length,
        onBack: session.handleBack,
      }}
      tasks={{
        archivedTasks: session.archivedTasks,
        selectedTask: session.selectedTask,
        isRestoringTask: session.isRestoringTask,
        onSelectTask: session.handleSelectTask,
        onRestoreTask: session.handleRestoreTask,
        onDeleteTask: session.handleDeleteTask,
      }}
      chats={{
        archivedChats: session.archivedChats,
        selectedChat: session.selectedChat,
        isRestoringChat: session.isRestoringChat,
        onSelectChat: session.handleSelectChat,
        onRestoreChat: session.handleRestoreChat,
        onDeleteChat: session.handleDeleteChat,
      }}
      projects={{
        archivedProjects: session.archivedProjects,
        selectedProject: session.selectedProject,
        isRestoringProject: session.isRestoringProject,
        onSelectProject: session.handleSelectProject,
        onRestoreProject: session.handleRestoreProject,
        onDeleteProject: session.handleDeleteProject,
      }}
      helpers={{
        getProjectName: session.getProjectName,
        getTaskTitle: session.getTaskTitle,
        formatDate: session.formatDate,
      }}
      confirmDialog={session.confirmDialogProps}
    />
  );
}
