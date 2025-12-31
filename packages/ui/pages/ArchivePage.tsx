/**
 * ArchivePage - Stateless Page Component for the Archive
 *
 * This is a top-level stateless component that composes the entire archive view.
 * It receives all required data and callbacks via props, making it fully
 * testable in Storybook with mocked data representing different page states.
 *
 * The component composes:
 * - ArchiveLayout (page structure with header)
 * - ArchiveHeader (title, search, item count)
 * - ArchiveTabBar (tab navigation between tasks/chats/projects)
 * - ArchiveContent (lists of archived items per tab)
 * - ConfirmDialog (confirmation for delete actions)
 */

import type { Chat, Project, Task } from '@openflow/generated';
import {
  ArchiveContent,
  ArchiveHeader,
  ArchiveLayout,
  ArchiveTabBar,
  ConfirmDialog,
} from '../organisms';

// ============================================================================
// Types
// ============================================================================

// Re-use the ArchiveTab type from organisms to avoid duplication
import type { ArchiveTab } from '../organisms/ArchivePageComponents';

/** Props for the header section */
export interface ArchivePageHeaderProps {
  /** Count of items in the active tab */
  archivedCount: number;
  /** Currently active tab */
  activeTab: ArchiveTab;
  /** Callback for search action */
  onSearch: () => void;
}

/** Props for the tab bar section */
export interface ArchivePageTabBarProps {
  /** Currently active tab */
  activeTab: ArchiveTab;
  /** Callback when tab changes */
  onTabChange: (tab: ArchiveTab) => void;
  /** Count of archived tasks */
  taskCount: number;
  /** Count of archived chats */
  chatCount: number;
  /** Count of archived projects */
  projectCount: number;
  /** Callback for back button */
  onBack: () => void;
}

/** Props for the content section - tasks */
export interface ArchivePageTasksProps {
  /** Archived tasks list */
  archivedTasks: Task[];
  /** Currently selected task */
  selectedTask: Task | null;
  /** Whether a task restore is in progress */
  isRestoringTask: boolean;
  /** Callback when task is selected */
  onSelectTask: (task: Task) => void;
  /** Callback to restore a task */
  onRestoreTask: (task: Task) => void;
  /** Callback to delete a task */
  onDeleteTask: (task: Task) => void;
}

/** Props for the content section - chats */
export interface ArchivePageChatsProps {
  /** Archived chats list */
  archivedChats: Chat[];
  /** Currently selected chat */
  selectedChat: Chat | null;
  /** Whether a chat restore is in progress */
  isRestoringChat: boolean;
  /** Callback when chat is selected */
  onSelectChat: (chat: Chat) => void;
  /** Callback to restore a chat */
  onRestoreChat: (chat: Chat) => void;
  /** Callback to delete a chat */
  onDeleteChat: (chat: Chat) => void;
}

/** Props for the content section - projects */
export interface ArchivePageProjectsProps {
  /** Archived projects list */
  archivedProjects: Project[];
  /** Currently selected project */
  selectedProject: Project | null;
  /** Whether a project restore is in progress */
  isRestoringProject: boolean;
  /** Callback when project is selected */
  onSelectProject: (project: Project) => void;
  /** Callback to restore a project */
  onRestoreProject: (project: Project) => void;
  /** Callback to delete a project */
  onDeleteProject: (project: Project) => void;
}

/** Props for helper functions */
export interface ArchivePageHelpersProps {
  /** Get project name by ID */
  getProjectName: (projectId: string) => string;
  /** Get task title by ID */
  getTaskTitle: (taskId: string | null | undefined) => string | null;
  /** Format date string for display */
  formatDate: (dateString: string | null | undefined) => string;
}

/** Props for the confirm dialog */
export interface ArchivePageConfirmDialogProps {
  /** Whether the dialog is open */
  isOpen: boolean;
  /** Callback to close the dialog */
  onClose: () => void;
  /** Callback when user confirms */
  onConfirm: () => void;
  /** Dialog title */
  title: string;
  /** Dialog description */
  description: string;
  /** Confirm button label */
  confirmLabel?: string;
  /** Cancel button label */
  cancelLabel?: string;
  /** Visual variant */
  variant?: 'default' | 'destructive' | 'warning';
  /** Whether confirm action is in progress */
  loading?: boolean;
}

/**
 * Complete props for the ArchivePage component.
 *
 * This interface defines all data and callbacks needed to render the archive.
 * The route component is responsible for providing these props from hooks.
 */
export interface ArchivePageProps {
  /** Whether data is loading */
  isLoading: boolean;

  /** Header props */
  header: ArchivePageHeaderProps;

  /** Tab bar props */
  tabBar: ArchivePageTabBarProps;

  /** Tasks section props */
  tasks: ArchivePageTasksProps;

  /** Chats section props */
  chats: ArchivePageChatsProps;

  /** Projects section props */
  projects: ArchivePageProjectsProps;

  /** Helper functions */
  helpers: ArchivePageHelpersProps;

  /** Confirm dialog props */
  confirmDialog: ArchivePageConfirmDialogProps;
}

// ============================================================================
// Component
// ============================================================================

/**
 * ArchivePage - Complete stateless archive page component.
 *
 * This component receives all data and callbacks via props. It is purely
 * presentational, making it fully testable in Storybook with mocked data.
 *
 * @example
 * ```tsx
 * // In route component
 * function ArchiveRoute() {
 *   const navigate = useNavigate();
 *   const session = useArchiveSession({ navigate });
 *
 *   return (
 *     <ArchivePage
 *       isLoading={session.isLoading}
 *       header={{
 *         archivedCount: session.archivedCount,
 *         activeTab: session.activeTab,
 *         onSearch: session.handleSearch,
 *       }}
 *       tabBar={{
 *         activeTab: session.activeTab,
 *         onTabChange: session.setActiveTab,
 *         taskCount: session.archivedTasks.length,
 *         chatCount: session.archivedChats.length,
 *         projectCount: session.archivedProjects.length,
 *         onBack: session.handleBack,
 *       }}
 *       tasks={{
 *         archivedTasks: session.archivedTasks,
 *         selectedTask: session.selectedTask,
 *         isRestoringTask: session.isRestoringTask,
 *         onSelectTask: session.handleSelectTask,
 *         onRestoreTask: session.handleRestoreTask,
 *         onDeleteTask: session.handleDeleteTask,
 *       }}
 *       chats={{
 *         archivedChats: session.archivedChats,
 *         selectedChat: session.selectedChat,
 *         isRestoringChat: session.isRestoringChat,
 *         onSelectChat: session.handleSelectChat,
 *         onRestoreChat: session.handleRestoreChat,
 *         onDeleteChat: session.handleDeleteChat,
 *       }}
 *       projects={{
 *         archivedProjects: session.archivedProjects,
 *         selectedProject: session.selectedProject,
 *         isRestoringProject: session.isRestoringProject,
 *         onSelectProject: session.handleSelectProject,
 *         onRestoreProject: session.handleRestoreProject,
 *         onDeleteProject: session.handleDeleteProject,
 *       }}
 *       helpers={{
 *         getProjectName: session.getProjectName,
 *         getTaskTitle: session.getTaskTitle,
 *         formatDate: session.formatDate,
 *       }}
 *       confirmDialog={session.confirmDialogProps}
 *     />
 *   );
 * }
 * ```
 */
export function ArchivePage({
  isLoading,
  header,
  tabBar,
  tasks,
  chats,
  projects,
  helpers,
  confirmDialog,
}: ArchivePageProps) {
  return (
    <ArchiveLayout
      header={
        <ArchiveHeader
          archivedCount={header.archivedCount}
          activeTab={header.activeTab}
          onSearch={header.onSearch}
        />
      }
    >
      <ArchiveTabBar
        activeTab={tabBar.activeTab}
        onTabChange={tabBar.onTabChange}
        taskCount={tabBar.taskCount}
        chatCount={tabBar.chatCount}
        projectCount={tabBar.projectCount}
        onBack={tabBar.onBack}
      />
      <ArchiveContent
        activeTab={header.activeTab}
        isLoading={isLoading}
        archivedTasks={tasks.archivedTasks}
        selectedTask={tasks.selectedTask}
        isRestoringTask={tasks.isRestoringTask}
        archivedChats={chats.archivedChats}
        selectedChat={chats.selectedChat}
        isRestoringChat={chats.isRestoringChat}
        archivedProjects={projects.archivedProjects}
        selectedProject={projects.selectedProject}
        isRestoringProject={projects.isRestoringProject}
        getProjectName={helpers.getProjectName}
        getTaskTitle={helpers.getTaskTitle}
        formatDate={helpers.formatDate}
        onSelectTask={tasks.onSelectTask}
        onSelectChat={chats.onSelectChat}
        onSelectProject={projects.onSelectProject}
        onRestoreTask={tasks.onRestoreTask}
        onRestoreChat={chats.onRestoreChat}
        onRestoreProject={projects.onRestoreProject}
        onDeleteTask={tasks.onDeleteTask}
        onDeleteChat={chats.onDeleteChat}
        onDeleteProject={projects.onDeleteProject}
      />
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={confirmDialog.onClose}
        onConfirm={confirmDialog.onConfirm}
        title={confirmDialog.title}
        description={confirmDialog.description}
        confirmLabel={confirmDialog.confirmLabel}
        cancelLabel={confirmDialog.cancelLabel}
        variant={confirmDialog.variant}
        loading={confirmDialog.loading}
      />
    </ArchiveLayout>
  );
}
