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
import {
  ArchiveContent,
  ArchiveHeader,
  ArchiveLayout,
  ArchiveTabBar,
  ConfirmDialog,
} from '@openflow/ui';
import { createFileRoute, useNavigate } from '@tanstack/react-router';

export const Route = createFileRoute('/archive')({
  component: ArchivePage,
});

function ArchivePage() {
  const navigate = useNavigate();
  const session = useArchiveSession({ navigate });

  return (
    <ArchiveLayout
      header={
        <ArchiveHeader
          archivedCount={session.archivedCount}
          activeTab={session.activeTab}
          onSearch={session.handleSearch}
        />
      }
    >
      <ArchiveTabBar
        activeTab={session.activeTab}
        onTabChange={session.setActiveTab}
        taskCount={session.archivedTasks.length}
        chatCount={session.archivedChats.length}
        projectCount={session.archivedProjects.length}
        onBack={session.handleBack}
      />
      <ArchiveContent
        activeTab={session.activeTab}
        isLoading={session.isLoading}
        archivedTasks={session.archivedTasks}
        selectedTask={session.selectedTask}
        isRestoringTask={session.isRestoringTask}
        archivedChats={session.archivedChats}
        selectedChat={session.selectedChat}
        isRestoringChat={session.isRestoringChat}
        archivedProjects={session.archivedProjects}
        selectedProject={session.selectedProject}
        isRestoringProject={session.isRestoringProject}
        getProjectName={session.getProjectName}
        getTaskTitle={session.getTaskTitle}
        formatDate={session.formatDate}
        onSelectTask={session.handleSelectTask}
        onSelectChat={session.handleSelectChat}
        onSelectProject={session.handleSelectProject}
        onRestoreTask={session.handleRestoreTask}
        onRestoreChat={session.handleRestoreChat}
        onRestoreProject={session.handleRestoreProject}
        onDeleteTask={session.handleDeleteTask}
        onDeleteChat={session.handleDeleteChat}
        onDeleteProject={session.handleDeleteProject}
      />
      <ConfirmDialog {...session.confirmDialogProps} />
    </ArchiveLayout>
  );
}
