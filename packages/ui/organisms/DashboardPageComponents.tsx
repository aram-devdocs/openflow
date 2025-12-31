/**
 * DashboardPageComponents - Stateless UI components for the Dashboard page
 *
 * These components are pure functions of their props, receiving data and callbacks
 * from the useDashboardSession hook. They render UI and call callbacks on user interaction.
 */

import type { Chat, Project, SearchResult, Task, TaskStatus } from '@openflow/generated';
import type { ExecutorProfile } from '@openflow/generated';
import { SearchResultType } from '@openflow/generated';
import { Archive, FolderOpen, FolderPlus, Keyboard, Plus, Settings } from 'lucide-react';
import type { ReactNode } from 'react';
import { Button } from '../atoms/Button';
import { Input } from '../atoms/Input';
import { Dialog } from '../molecules/Dialog';
import { FormField } from '../molecules/FormField';
import { SkeletonStats } from '../molecules/SkeletonStats';
import { SkeletonTaskCard } from '../molecules/SkeletonTaskCard';
import { AppLayout } from '../templates/AppLayout';
import type { CommandAction, RecentItem } from './CommandPalette';
import { CommandPalette } from './CommandPalette';
import { Header } from './Header';
import { NewChatDialog } from './NewChatDialog';
import { Sidebar, type StatusFilter } from './Sidebar';

// ============================================================================
// Types
// ============================================================================

/** Props for StatCard component */
export interface StatCardProps {
  /** Label displayed above the value */
  label: string;
  /** Numeric value to display */
  value: number;
  /** Color variant for the card */
  variant?: 'default' | 'info' | 'warning' | 'success';
}

/** Props for StatusBadge component */
export interface StatusBadgeProps {
  /** Task status to display */
  status: TaskStatus;
}

/** Props for DashboardLayout component */
export interface DashboardLayoutProps {
  /** Whether sidebar is collapsed */
  sidebarCollapsed: boolean;
  /** Whether mobile drawer is open */
  isMobileDrawerOpen: boolean;
  /** Callback when mobile drawer toggle changes */
  onMobileDrawerToggle: (open: boolean) => void;
  /** Sidebar content */
  sidebar: ReactNode;
  /** Header content */
  header: ReactNode;
  /** Main content */
  children: ReactNode;
}

/** Props for DashboardSidebar component */
export interface DashboardSidebarProps {
  /** Available projects */
  projects: Project[];
  /** Tasks for selected project */
  tasks: Task[];
  /** Standalone chats */
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

/** Props for DashboardHeader component */
export interface DashboardHeaderProps {
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

/** Props for DashboardEmptyState component */
export interface DashboardEmptyStateProps {
  /** Callback for creating new project */
  onNewProject: () => void;
}

/** Props for DashboardLoadingSkeleton component */
export interface DashboardLoadingSkeletonProps {
  /** Additional class name */
  className?: string;
}

/** Props for DashboardStatsGrid component */
export interface DashboardStatsGridProps {
  /** All tasks for the project */
  tasks: Task[];
}

/** Props for RecentTasksList component */
export interface RecentTasksListProps {
  /** Tasks to display (up to 5) */
  tasks: Task[];
  /** Callback when task is clicked */
  onSelectTask: (taskId: string) => void;
}

/** Props for CreateProjectDialog component */
export interface CreateProjectDialogProps {
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

/** Props for CreateTaskDialog component */
export interface CreateTaskDialogProps {
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

/** Props for DashboardCommandPalette component */
export interface DashboardCommandPaletteProps {
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
  /** Current search query */
  query?: string;
  /** Search results to display */
  searchResults?: SearchResult[];
  /** Whether search is loading */
  isSearching?: boolean;
  /** Callback when a search result is selected */
  onSelectResult?: (result: SearchResult) => void;
  /** Callback when a recent item is selected */
  onSelectRecent?: (item: RecentItem) => void;
}

/** Props for DashboardContent component */
export interface DashboardContentProps {
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

// ============================================================================
// Utility Components
// ============================================================================

/**
 * StatCard - Displays a single statistic with label and value
 *
 * @example
 * <StatCard label="Total Tasks" value={42} variant="default" />
 * <StatCard label="In Progress" value={5} variant="info" />
 */
export function StatCard({ label, value, variant = 'default' }: StatCardProps) {
  const variantStyles = {
    default: 'border-border',
    info: 'border-info/30 bg-info/5',
    warning: 'border-warning/30 bg-warning/5',
    success: 'border-success/30 bg-success/5',
  };

  const valueStyles = {
    default: 'text-foreground',
    info: 'text-info',
    warning: 'text-warning',
    success: 'text-success',
  };

  return (
    <div className={`rounded-lg border p-4 ${variantStyles[variant]} bg-[rgb(var(--card))]`}>
      <p className="text-xs font-medium text-[rgb(var(--muted-foreground))]">{label}</p>
      <p className={`mt-1 text-2xl font-semibold ${valueStyles[variant]}`}>{value}</p>
    </div>
  );
}

/**
 * StatusBadge - Displays a task status as a colored badge
 *
 * @example
 * <StatusBadge status="inprogress" />
 */
export function StatusBadge({ status }: StatusBadgeProps) {
  const statusStyles: Record<TaskStatus, string> = {
    todo: 'bg-status-todo/20 text-status-todo',
    inprogress: 'bg-status-inprogress/20 text-status-inprogress',
    inreview: 'bg-status-inreview/20 text-status-inreview',
    done: 'bg-status-done/20 text-status-done',
    cancelled: 'bg-status-cancelled/20 text-status-cancelled',
  };

  const statusLabels: Record<TaskStatus, string> = {
    todo: 'To Do',
    inprogress: 'In Progress',
    inreview: 'In Review',
    done: 'Done',
    cancelled: 'Cancelled',
  };

  return (
    <span
      className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${statusStyles[status]}`}
    >
      {statusLabels[status]}
    </span>
  );
}

// ============================================================================
// Layout Components
// ============================================================================

/**
 * DashboardLayout - Main layout wrapper for dashboard page
 *
 * Wraps content in AppLayout with sidebar and header slots.
 */
export function DashboardLayout({
  sidebarCollapsed,
  isMobileDrawerOpen,
  onMobileDrawerToggle,
  sidebar,
  header,
  children,
}: DashboardLayoutProps) {
  return (
    <AppLayout
      sidebarCollapsed={sidebarCollapsed}
      isMobileDrawerOpen={isMobileDrawerOpen}
      onMobileDrawerToggle={onMobileDrawerToggle}
      sidebar={sidebar}
      header={header}
    >
      {children}
    </AppLayout>
  );
}

/**
 * DashboardSidebar - Sidebar component for dashboard navigation
 */
export function DashboardSidebar({
  projects,
  tasks,
  chats,
  selectedProjectId,
  statusFilter,
  onSelectProject,
  onSelectTask,
  onSelectChat,
  onNewTask,
  onNewChat,
  onNewProject,
  onStatusFilter,
  onTaskStatusChange,
  onSettingsClick,
  onArchiveClick,
  isCollapsed,
  onToggleCollapse,
}: DashboardSidebarProps) {
  return (
    <Sidebar
      projects={projects}
      tasks={tasks}
      chats={chats}
      {...(selectedProjectId ? { selectedProjectId } : {})}
      statusFilter={statusFilter}
      onSelectProject={onSelectProject}
      onSelectTask={onSelectTask}
      onSelectChat={onSelectChat}
      onNewTask={onNewTask}
      onNewChat={onNewChat}
      onNewProject={onNewProject}
      onStatusFilter={onStatusFilter}
      onTaskStatusChange={onTaskStatusChange}
      onSettingsClick={onSettingsClick}
      onArchiveClick={onArchiveClick}
      isCollapsed={isCollapsed}
      onToggleCollapse={onToggleCollapse}
    />
  );
}

/**
 * DashboardHeader - Header component for dashboard
 */
export function DashboardHeader({
  title,
  subtitle,
  onSearch,
  onNewChat,
  onNewTerminal,
}: DashboardHeaderProps) {
  return (
    <Header
      title={title}
      subtitle={subtitle}
      onSearch={onSearch}
      onNewChat={onNewChat}
      onNewTerminal={onNewTerminal}
    />
  );
}

// ============================================================================
// State Components
// ============================================================================

/**
 * DashboardEmptyState - Empty state when no project is selected
 */
export function DashboardEmptyState({ onNewProject }: DashboardEmptyStateProps) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center p-8">
      <div className="text-center">
        <h2 className="text-lg font-semibold text-[rgb(var(--foreground))]">Welcome to OpenFlow</h2>
        <p className="mt-2 text-sm text-[rgb(var(--muted-foreground))]">
          Get started by creating a project or selecting one from the sidebar.
        </p>
        <button
          type="button"
          onClick={onNewProject}
          className="mt-4 inline-flex items-center gap-2 rounded-md bg-[rgb(var(--primary))] px-4 py-2 text-sm font-medium text-[rgb(var(--primary-foreground))] hover:bg-[rgb(var(--primary))]/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--ring))]"
        >
          Create Project
        </button>
      </div>
    </div>
  );
}

/**
 * DashboardLoadingSkeleton - Loading state for dashboard content
 */
export function DashboardLoadingSkeleton({ className }: DashboardLoadingSkeletonProps) {
  return (
    <div className={`flex-1 overflow-auto p-4 md:p-6 ${className ?? ''}`}>
      {/* Stats skeleton */}
      <SkeletonStats className="mb-6" />

      {/* Recent tasks skeleton */}
      <div className="rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--card))]">
        <div className="border-b border-[rgb(var(--border))] px-4 py-3">
          <div className="h-5 w-24 rounded bg-[rgb(var(--muted))] motion-safe:animate-pulse" />
        </div>
        <div className="p-4 space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <SkeletonTaskCard key={`dashboard-skeleton-${i}`} />
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Content Components
// ============================================================================

/**
 * DashboardStatsGrid - Grid of stat cards showing task metrics
 */
export function DashboardStatsGrid({ tasks }: DashboardStatsGridProps) {
  return (
    <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard label="Total Tasks" value={tasks.length} variant="default" />
      <StatCard
        label="In Progress"
        value={tasks.filter((t) => t.status === 'inprogress').length}
        variant="info"
      />
      <StatCard
        label="In Review"
        value={tasks.filter((t) => t.status === 'inreview').length}
        variant="warning"
      />
      <StatCard
        label="Completed"
        value={tasks.filter((t) => t.status === 'done').length}
        variant="success"
      />
    </div>
  );
}

/**
 * RecentTasksList - List of recent tasks with click-to-navigate
 */
export function RecentTasksList({ tasks, onSelectTask }: RecentTasksListProps) {
  return (
    <div className="rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--card))]">
      <div className="border-b border-[rgb(var(--border))] px-4 py-3">
        <h3 className="text-sm font-medium text-[rgb(var(--foreground))]">Recent Tasks</h3>
      </div>
      <div className="p-4">
        {tasks.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-sm text-[rgb(var(--muted-foreground))]">
              No tasks yet. Create one to get started!
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {tasks.slice(0, 5).map((task) => (
              <button
                key={task.id}
                type="button"
                onClick={() => onSelectTask(task.id)}
                className="flex w-full items-center justify-between rounded-md px-3 py-2 text-left transition-colors hover:bg-[rgb(var(--muted))]"
              >
                <span className="truncate text-sm text-[rgb(var(--foreground))]">{task.title}</span>
                <StatusBadge status={task.status} />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * DashboardContent - Main content area that switches between states
 */
export function DashboardContent({
  isLoadingProjects,
  isLoadingTasks,
  activeProjectId,
  tasks,
  onSelectTask,
  onNewProject,
}: DashboardContentProps) {
  // Empty state when no project selected
  if (!activeProjectId && !isLoadingProjects) {
    return <DashboardEmptyState onNewProject={onNewProject} />;
  }

  // Loading state
  if ((isLoadingProjects || isLoadingTasks) && activeProjectId) {
    return <DashboardLoadingSkeleton />;
  }

  // Project overview
  if (activeProjectId && !isLoadingTasks) {
    return (
      <div className="flex-1 overflow-auto p-4 md:p-6">
        <DashboardStatsGrid tasks={tasks} />
        <RecentTasksList tasks={tasks} onSelectTask={onSelectTask} />
      </div>
    );
  }

  return null;
}

// ============================================================================
// Dialog Components
// ============================================================================

/**
 * CreateProjectDialog - Dialog for creating a new project
 */
export function CreateProjectDialog({
  isOpen,
  onClose,
  projectName,
  onProjectNameChange,
  projectPath,
  onProjectPathChange,
  onBrowseFolder,
  onCreate,
  isPending,
  error,
}: CreateProjectDialogProps) {
  return (
    <Dialog isOpen={isOpen} onClose={onClose} title="Create New Project">
      <div className="space-y-4">
        <FormField
          label="Project Name"
          required
          {...(!projectName.trim() && error ? { error: 'Required' } : {})}
        >
          <Input
            value={projectName}
            onChange={(e) => onProjectNameChange(e.target.value)}
            placeholder="My Awesome Project"
            autoFocus
          />
        </FormField>

        <FormField
          label="Git Repository Path"
          required
          {...(!projectPath.trim() && error ? { error: 'Required' } : {})}
        >
          <div className="flex gap-2">
            <Input
              value={projectPath}
              onChange={(e) => onProjectPathChange(e.target.value)}
              placeholder="/path/to/your/repo"
              className="flex-1"
            />
            <Button variant="secondary" onClick={onBrowseFolder} type="button">
              <FolderOpen className="h-4 w-4" />
            </Button>
          </div>
        </FormField>

        {error && <p className="text-sm text-error">{error}</p>}

        <div className="flex justify-end gap-2 pt-4">
          <Button variant="ghost" onClick={onClose} disabled={isPending}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={onCreate}
            loading={isPending}
            loadingText="Creating..."
          >
            Create Project
          </Button>
        </div>
      </div>
    </Dialog>
  );
}

/**
 * CreateTaskDialog - Dialog for creating a new task
 */
export function CreateTaskDialog({
  isOpen,
  onClose,
  taskTitle,
  onTaskTitleChange,
  taskDescription,
  onTaskDescriptionChange,
  onCreate,
  isPending,
  error,
}: CreateTaskDialogProps) {
  return (
    <Dialog isOpen={isOpen} onClose={onClose} title="Create New Task">
      <div className="space-y-4">
        <FormField
          label="Task Title"
          required
          {...(!taskTitle.trim() && error ? { error: 'Required' } : {})}
        >
          <Input
            value={taskTitle}
            onChange={(e) => onTaskTitleChange(e.target.value)}
            placeholder="What needs to be done?"
            autoFocus
          />
        </FormField>

        <FormField label="Description">
          <Input
            value={taskDescription}
            onChange={(e) => onTaskDescriptionChange(e.target.value)}
            placeholder="Optional description..."
          />
        </FormField>

        {error && <p className="text-sm text-error">{error}</p>}

        <div className="flex justify-end gap-2 pt-4">
          <Button variant="ghost" onClick={onClose} disabled={isPending}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={onCreate}
            loading={isPending}
            loadingText="Creating..."
          >
            Create Task
          </Button>
        </div>
      </div>
    </Dialog>
  );
}

/**
 * DashboardCommandPalette - Command palette overlay
 */
export function DashboardCommandPalette({
  isOpen,
  onClose,
  onSearch,
  actions,
  recentItems,
  query,
  searchResults,
  isSearching,
  onSelectResult,
  onSelectRecent,
}: DashboardCommandPaletteProps) {
  return (
    <CommandPalette
      isOpen={isOpen}
      onClose={onClose}
      onSearch={onSearch}
      actions={actions}
      recentItems={recentItems}
      query={query}
      searchResults={searchResults}
      isSearching={isSearching}
      onSelectResult={onSelectResult}
      onSelectRecent={onSelectRecent}
    />
  );
}

/** Props for DashboardNewChatDialog */
export interface DashboardNewChatDialogProps {
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
 * DashboardNewChatDialog - Dialog for creating a new chat
 */
export function DashboardNewChatDialog({
  isOpen,
  onClose,
  projects,
  executorProfiles,
  selectedProjectId,
  isSubmitting,
  onCreate,
  onNewProject,
}: DashboardNewChatDialogProps) {
  return (
    <NewChatDialog
      isOpen={isOpen}
      onClose={onClose}
      projects={projects}
      executorProfiles={executorProfiles}
      selectedProjectId={selectedProjectId}
      isSubmitting={isSubmitting}
      onCreate={onCreate}
      onNewProject={onNewProject}
    />
  );
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Build command actions for the command palette
 */
export function buildCommandActions(handlers: {
  onNewTask: () => void;
  onNewProject: () => void;
  onSettingsClick: () => void;
  onKeyboardShortcuts: () => void;
  onArchiveClick: () => void;
}): CommandAction[] {
  return [
    {
      id: 'new-task',
      label: 'New Task',
      icon: Plus,
      shortcut: '⌘N',
      onSelect: handlers.onNewTask,
    },
    {
      id: 'new-project',
      label: 'New Project',
      icon: FolderPlus,
      onSelect: handlers.onNewProject,
    },
    {
      id: 'settings',
      label: 'Open Settings',
      icon: Settings,
      shortcut: '⌘,',
      onSelect: handlers.onSettingsClick,
    },
    {
      id: 'keyboard-shortcuts',
      label: 'Keyboard Shortcuts',
      icon: Keyboard,
      shortcut: '⌘/',
      onSelect: handlers.onKeyboardShortcuts,
    },
    {
      id: 'archive',
      label: 'View Archive',
      icon: Archive,
      onSelect: handlers.onArchiveClick,
    },
  ];
}

/**
 * Build recent items for the command palette
 */
export function buildRecentItems(tasks: Task[], projectName?: string): RecentItem[] {
  return tasks.slice(0, 5).map((task) => {
    const item: RecentItem = {
      id: task.id,
      type: SearchResultType.Task,
      title: task.title,
    };
    if (projectName) {
      item.subtitle = projectName;
    }
    return item;
  });
}

/**
 * Build header subtitle based on task counts
 */
export function buildHeaderSubtitle(tasks: Task[], isLoading: boolean): string | undefined {
  if (isLoading) return undefined; // Let skeleton handle loading
  const inProgressCount = tasks.filter((t) => t.status === 'inprogress').length;
  if (inProgressCount === 0) return `${tasks.length} tasks`;
  return `${inProgressCount} task${inProgressCount === 1 ? '' : 's'} in progress`;
}
