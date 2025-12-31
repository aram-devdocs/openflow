/**
 * DashboardPage - Stateless Page Component for the Dashboard
 *
 * This is a top-level stateless component that composes the entire dashboard view.
 * It receives all required data and callbacks via props, making it fully
 * testable in Storybook with mocked data representing different page states.
 *
 * The component composes:
 * - DashboardLayout (sidebar + header + main content area)
 * - DashboardSidebar (project/task navigation)
 * - DashboardHeader (title, search, actions)
 * - DashboardContent (stats, recent tasks, empty/loading states)
 * - DashboardCommandPalette (keyboard-driven command palette)
 * - CreateProjectDialog (create new project)
 * - CreateTaskDialog (create new task)
 * - DashboardNewChatDialog (create new chat)
 */

import type { Chat, ExecutorProfile, Project, Task, TaskStatus } from '@openflow/generated';
import type { CommandAction, RecentItem } from '../organisms/CommandPalette';
import {
  CreateProjectDialog,
  CreateTaskDialog,
  DashboardCommandPalette,
  DashboardContent,
  DashboardHeader,
  DashboardLayout,
  DashboardNewChatDialog,
  DashboardSidebar,
} from '../organisms/DashboardPageComponents';
import type { StatusFilter } from '../organisms/Sidebar';

// ============================================================================
// Types
// ============================================================================

/** Props for the sidebar section */
export interface DashboardPageSidebarProps {
  /** Available projects */
  projects: Project[];
  /** Tasks for selected project */
  tasks: Task[];
  /** Standalone chats (not associated with tasks) */
  chats: Chat[];
  /** Currently selected project ID */
  selectedProjectId?: string;
  /** Current status filter */
  statusFilter: StatusFilter;
  /** Callback when project is selected */
  onSelectProject: (projectId: string) => void;
  /** Callback when task is selected */
  onSelectTask: (taskId: string) => void;
  /** Callback when chat is selected */
  onSelectChat: (chatId: string) => void;
  /** Callback for new task action */
  onNewTask: () => void;
  /** Callback for new chat action */
  onNewChat: () => void;
  /** Callback for new project action */
  onNewProject: () => void;
  /** Callback when status filter changes */
  onStatusFilter: (status: StatusFilter) => void;
  /** Callback when task status changes */
  onTaskStatusChange: (taskId: string, status: TaskStatus) => void;
  /** Callback for settings click */
  onSettingsClick: () => void;
  /** Callback for archive click */
  onArchiveClick: () => void;
  /** Whether sidebar is collapsed */
  isCollapsed: boolean;
  /** Callback to toggle collapse */
  onToggleCollapse: () => void;
}

/** Props for the header section */
export interface DashboardPageHeaderProps {
  /** Header title (project name or app name) */
  title: string;
  /** Optional subtitle (task counts) */
  subtitle?: string;
  /** Callback for search action */
  onSearch: () => void;
  /** Callback for new chat action */
  onNewChat: () => void;
  /** Callback for new terminal action */
  onNewTerminal: () => void;
}

/** Props for the main content section */
export interface DashboardPageContentProps {
  /** Whether projects are loading */
  isLoadingProjects: boolean;
  /** Whether tasks are loading */
  isLoadingTasks: boolean;
  /** Active project ID */
  activeProjectId?: string;
  /** Tasks for the active project */
  tasks: Task[];
  /** Callback when task is selected */
  onSelectTask: (taskId: string) => void;
  /** Callback for new project action */
  onNewProject: () => void;
}

/** Props for the command palette section */
export interface DashboardPageCommandPaletteProps {
  /** Whether palette is open */
  isOpen: boolean;
  /** Callback to close palette */
  onClose: () => void;
  /** Callback for search */
  onSearch: (query: string) => void;
  /** Command actions */
  actions: CommandAction[];
  /** Recent items */
  recentItems: RecentItem[];
}

/** Props for the create project dialog */
export interface DashboardPageCreateProjectDialogProps {
  /** Whether dialog is open */
  isOpen: boolean;
  /** Callback to close dialog */
  onClose: () => void;
  /** Current project name value */
  projectName: string;
  /** Callback when project name changes */
  onProjectNameChange: (name: string) => void;
  /** Current project path value */
  projectPath: string;
  /** Callback when project path changes */
  onProjectPathChange: (path: string) => void;
  /** Callback for browse folder action */
  onBrowseFolder: () => void;
  /** Callback to create project */
  onCreate: () => void;
  /** Whether create is pending */
  isPending: boolean;
  /** Error message if any */
  error: string | null;
}

/** Props for the create task dialog */
export interface DashboardPageCreateTaskDialogProps {
  /** Whether dialog is open */
  isOpen: boolean;
  /** Callback to close dialog */
  onClose: () => void;
  /** Current task title value */
  taskTitle: string;
  /** Callback when task title changes */
  onTaskTitleChange: (title: string) => void;
  /** Current task description value */
  taskDescription: string;
  /** Callback when task description changes */
  onTaskDescriptionChange: (description: string) => void;
  /** Callback to create task */
  onCreate: () => void;
  /** Whether create is pending */
  isPending: boolean;
  /** Error message if any */
  error: string | null;
}

/** Props for the new chat dialog */
export interface DashboardPageNewChatDialogProps {
  /** Whether dialog is open */
  isOpen: boolean;
  /** Callback to close dialog */
  onClose: () => void;
  /** Available projects */
  projects: Project[];
  /** Available executor profiles */
  executorProfiles: ExecutorProfile[];
  /** Currently selected project ID */
  selectedProjectId?: string;
  /** Whether create is pending */
  isSubmitting: boolean;
  /** Callback to create chat */
  onCreate: (data: { projectId: string; executorProfileId?: string; title?: string }) => void;
  /** Callback for new project action */
  onNewProject: () => void;
}

/**
 * Complete props for the DashboardPage component.
 *
 * This interface defines all data and callbacks needed to render the dashboard.
 * The route component is responsible for providing these props from hooks.
 */
export interface DashboardPageProps {
  // Layout state
  /** Whether sidebar is collapsed */
  sidebarCollapsed: boolean;
  /** Whether mobile drawer is open */
  isMobileDrawerOpen: boolean;
  /** Callback when mobile drawer toggle changes */
  onMobileDrawerToggle: (open: boolean) => void;

  // Sidebar props
  sidebar: DashboardPageSidebarProps;

  // Header props
  header: DashboardPageHeaderProps;

  // Content props
  content: DashboardPageContentProps;

  // Command palette props
  commandPalette: DashboardPageCommandPaletteProps;

  // Create project dialog props
  createProjectDialog: DashboardPageCreateProjectDialogProps;

  // Create task dialog props
  createTaskDialog: DashboardPageCreateTaskDialogProps;

  // New chat dialog props
  newChatDialog: DashboardPageNewChatDialogProps;
}

// ============================================================================
// Component
// ============================================================================

/**
 * DashboardPage - Complete stateless dashboard page component.
 *
 * This component receives all data and callbacks via props. It is purely
 * presentational, making it fully testable in Storybook with mocked data.
 *
 * @example
 * ```tsx
 * // In route component
 * function DashboardRoute() {
 *   const session = useDashboardSession({ navigate, onSuccess, onError });
 *
 *   return (
 *     <DashboardPage
 *       sidebarCollapsed={session.sidebarCollapsed}
 *       isMobileDrawerOpen={session.isMobileDrawerOpen}
 *       onMobileDrawerToggle={session.handleMobileDrawerToggle}
 *       sidebar={{
 *         projects: session.projects,
 *         tasks: session.tasks,
 *         // ... other sidebar props
 *       }}
 *       header={{
 *         title: session.activeProject?.name ?? 'OpenFlow',
 *         subtitle: session.headerSubtitle,
 *         // ... other header props
 *       }}
 *       content={{
 *         isLoadingProjects: session.isLoadingProjects,
 *         // ... other content props
 *       }}
 *       commandPalette={{
 *         isOpen: session.commandPaletteOpen,
 *         // ... other command palette props
 *       }}
 *       createProjectDialog={{
 *         isOpen: session.isCreateProjectDialogOpen,
 *         // ... other create project dialog props
 *       }}
 *       createTaskDialog={{
 *         isOpen: session.isCreateTaskDialogOpen,
 *         // ... other create task dialog props
 *       }}
 *       newChatDialog={{
 *         isOpen: session.isNewChatDialogOpen,
 *         // ... other new chat dialog props
 *       }}
 *     />
 *   );
 * }
 * ```
 */
export function DashboardPage({
  sidebarCollapsed,
  isMobileDrawerOpen,
  onMobileDrawerToggle,
  sidebar,
  header,
  content,
  commandPalette,
  createProjectDialog,
  createTaskDialog,
  newChatDialog,
}: DashboardPageProps) {
  return (
    <DashboardLayout
      sidebarCollapsed={sidebarCollapsed}
      isMobileDrawerOpen={isMobileDrawerOpen}
      onMobileDrawerToggle={onMobileDrawerToggle}
      sidebar={
        <DashboardSidebar
          projects={sidebar.projects}
          tasks={sidebar.tasks}
          chats={sidebar.chats}
          selectedProjectId={sidebar.selectedProjectId}
          statusFilter={sidebar.statusFilter}
          onSelectProject={sidebar.onSelectProject}
          onSelectTask={sidebar.onSelectTask}
          onSelectChat={sidebar.onSelectChat}
          onNewTask={sidebar.onNewTask}
          onNewChat={sidebar.onNewChat}
          onNewProject={sidebar.onNewProject}
          onStatusFilter={sidebar.onStatusFilter}
          onTaskStatusChange={sidebar.onTaskStatusChange}
          onSettingsClick={sidebar.onSettingsClick}
          onArchiveClick={sidebar.onArchiveClick}
          isCollapsed={sidebar.isCollapsed}
          onToggleCollapse={sidebar.onToggleCollapse}
        />
      }
      header={
        <DashboardHeader
          title={header.title}
          subtitle={header.subtitle}
          onSearch={header.onSearch}
          onNewChat={header.onNewChat}
          onNewTerminal={header.onNewTerminal}
        />
      }
    >
      {/* Main content area - switches between empty/loading/content states */}
      <div className="flex h-full flex-col">
        <DashboardContent
          isLoadingProjects={content.isLoadingProjects}
          isLoadingTasks={content.isLoadingTasks}
          activeProjectId={content.activeProjectId}
          tasks={content.tasks}
          onSelectTask={content.onSelectTask}
          onNewProject={content.onNewProject}
        />
      </div>

      {/* Command palette overlay */}
      <DashboardCommandPalette
        isOpen={commandPalette.isOpen}
        onClose={commandPalette.onClose}
        onSearch={commandPalette.onSearch}
        actions={commandPalette.actions}
        recentItems={commandPalette.recentItems}
      />

      {/* Create project dialog */}
      <CreateProjectDialog
        isOpen={createProjectDialog.isOpen}
        onClose={createProjectDialog.onClose}
        projectName={createProjectDialog.projectName}
        onProjectNameChange={createProjectDialog.onProjectNameChange}
        projectPath={createProjectDialog.projectPath}
        onProjectPathChange={createProjectDialog.onProjectPathChange}
        onBrowseFolder={createProjectDialog.onBrowseFolder}
        onCreate={createProjectDialog.onCreate}
        isPending={createProjectDialog.isPending}
        error={createProjectDialog.error}
      />

      {/* Create task dialog */}
      <CreateTaskDialog
        isOpen={createTaskDialog.isOpen}
        onClose={createTaskDialog.onClose}
        taskTitle={createTaskDialog.taskTitle}
        onTaskTitleChange={createTaskDialog.onTaskTitleChange}
        taskDescription={createTaskDialog.taskDescription}
        onTaskDescriptionChange={createTaskDialog.onTaskDescriptionChange}
        onCreate={createTaskDialog.onCreate}
        isPending={createTaskDialog.isPending}
        error={createTaskDialog.error}
      />

      {/* New Chat dialog */}
      <DashboardNewChatDialog
        isOpen={newChatDialog.isOpen}
        onClose={newChatDialog.onClose}
        projects={newChatDialog.projects}
        executorProfiles={newChatDialog.executorProfiles}
        selectedProjectId={newChatDialog.selectedProjectId}
        isSubmitting={newChatDialog.isSubmitting}
        onCreate={newChatDialog.onCreate}
        onNewProject={newChatDialog.onNewProject}
      />
    </DashboardLayout>
  );
}
