/**
 * DashboardPageComponents - Stateless UI components for the Dashboard page
 *
 * These components are pure functions of their props, receiving data and callbacks
 * from the useDashboardSession hook. They render UI and call callbacks on user interaction.
 *
 * Accessibility:
 * - Uses primitives (Heading, Text, VisuallyHidden, Flex) for semantic HTML
 * - Proper heading hierarchy (h1 for page title, h2 for sections, h3 for widgets)
 * - Loading states with aria-busy and role="status"
 * - Error states with role="alert" and aria-live="assertive"
 * - Touch targets ≥44px for mobile (WCAG 2.5.5)
 * - Focus rings with ring-offset for visibility
 * - Screen reader announcements for state changes
 * - Proper list semantics with role="list" and role="listitem"
 *
 * Features:
 * - StatCard widgets for displaying metrics
 * - StatusBadge for task status indicators
 * - Loading skeleton states
 * - Error state with retry
 * - Empty state with call-to-action
 * - Responsive grid layout
 * - forwardRef support for all components
 */

import type {
  Chat,
  ExecutorProfile,
  Project,
  SearchResult,
  Task,
  TaskStatus,
  WorkflowTemplate,
} from '@openflow/generated';
import { SearchResultType } from '@openflow/generated';
import {
  type A11yProps,
  Box,
  type Breakpoint,
  Flex,
  Heading,
  List,
  ListItem,
  type ResponsiveValue,
  Text,
  VisuallyHidden,
} from '@openflow/primitives';
import { cn } from '@openflow/utils';
import {
  AlertCircle,
  Archive,
  FolderOpen,
  FolderPlus,
  Keyboard,
  Plus,
  Settings,
} from 'lucide-react';
import { type HTMLAttributes, type ReactNode, forwardRef, useId } from 'react';
import { Button } from '../atoms/Button';
import { Icon } from '../atoms/Icon';
import { Input } from '../atoms/Input';
import { Skeleton } from '../atoms/Skeleton';
import { Dialog } from '../molecules/Dialog';
import { EmptyState } from '../molecules/EmptyState';
import { FormField } from '../molecules/FormField';
import { SkeletonStats } from '../molecules/SkeletonStats';
import { SkeletonTaskCard } from '../molecules/SkeletonTaskCard';
import { AppLayout } from '../templates/AppLayout';
import type { CommandAction, RecentItem } from './CommandPalette';
import { CommandPalette } from './CommandPalette';
import { Header } from './Header';
import { NewChatDialog } from './NewChatDialog';
import { Sidebar, type StatusFilter } from './Sidebar';
import { WorkflowSelector } from './WorkflowSelector';

// ============================================================================
// Types
// ============================================================================

/** Breakpoint names for responsive values */
export type DashboardBreakpoint = Breakpoint;

/** Size variants for dashboard components */
export type DashboardSize = 'sm' | 'md' | 'lg';

/** Helper type to omit conflicting aria and children props when using primitives */
type SafeHTMLDivAttributes = Omit<HTMLAttributes<HTMLDivElement>, 'children' | keyof A11yProps>;

/** Helper type for span elements */
type SafeHTMLSpanAttributes = Omit<HTMLAttributes<HTMLSpanElement>, 'children' | keyof A11yProps>;

/** Props for StatCard component */
export interface StatCardProps extends SafeHTMLDivAttributes {
  /** Label displayed above the value */
  label: string;
  /** Numeric value to display */
  value: number;
  /** Color variant for the card */
  variant?: 'default' | 'info' | 'warning' | 'success';
  /** Size variant for responsive sizing */
  size?: ResponsiveValue<DashboardSize>;
  /** Data test ID for automated testing */
  'data-testid'?: string;
}

/** Props for StatusBadge component */
export interface StatusBadgeProps extends SafeHTMLSpanAttributes {
  /** Task status to display */
  status: TaskStatus;
  /** Size variant for responsive sizing */
  size?: ResponsiveValue<DashboardSize>;
  /** Data test ID for automated testing */
  'data-testid'?: string;
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
  /** Callback when task context menu is triggered */
  onTaskContextMenu?: (taskId: string, event: React.MouseEvent) => void;
  /** Callback when chat context menu is triggered */
  onChatContextMenu?: (chatId: string, event: React.MouseEvent) => void;
  /** Callback to navigate to all chats page */
  onViewAllChats?: () => void;
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
  /** Current resolved theme for theme toggle */
  resolvedTheme?: 'light' | 'dark';
  /** Callback when theme toggle is clicked */
  onThemeToggle?: () => void;
}

/** Props for DashboardEmptyState component */
export interface DashboardEmptyStateProps extends SafeHTMLDivAttributes {
  /** Callback for creating new project */
  onNewProject: () => void;
  /** Size variant for responsive sizing */
  size?: ResponsiveValue<DashboardSize>;
  /** Data test ID for automated testing */
  'data-testid'?: string;
}

/** Props for DashboardLoadingSkeleton component */
export interface DashboardLoadingSkeletonProps extends SafeHTMLDivAttributes {
  /** Size variant for responsive sizing */
  size?: ResponsiveValue<DashboardSize>;
  /** Data test ID for automated testing */
  'data-testid'?: string;
}

/** Props for DashboardErrorState component */
export interface DashboardErrorStateProps extends SafeHTMLDivAttributes {
  /** Error message to display */
  message?: string;
  /** Callback to retry loading */
  onRetry?: () => void;
  /** Size variant for responsive sizing */
  size?: ResponsiveValue<DashboardSize>;
  /** Data test ID for automated testing */
  'data-testid'?: string;
  /** Custom error title */
  errorTitle?: string;
  /** Custom retry button label */
  retryLabel?: string;
}

/** Props for DashboardStatsGrid component */
export interface DashboardStatsGridProps extends SafeHTMLDivAttributes {
  /** All tasks for the project */
  tasks: Task[];
  /** Size variant for responsive sizing */
  size?: ResponsiveValue<DashboardSize>;
  /** Data test ID for automated testing */
  'data-testid'?: string;
  /** Accessible label for the stats region */
  statsLabel?: string;
}

/** Props for RecentTasksList component */
export interface RecentTasksListProps extends SafeHTMLDivAttributes {
  /** Tasks to display (up to 5) */
  tasks: Task[];
  /** Callback when task is clicked */
  onSelectTask: (taskId: string) => void;
  /** Size variant for responsive sizing */
  size?: ResponsiveValue<DashboardSize>;
  /** Data test ID for automated testing */
  'data-testid'?: string;
  /** Accessible label for the list */
  listLabel?: string;
  /** Custom empty message */
  emptyMessage?: string;
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
  /** Size variant for responsive sizing */
  size?: ResponsiveValue<DashboardSize>;
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
  /** Available workflow templates */
  workflows?: WorkflowTemplate[];
  /** Whether workflows are loading */
  isLoadingWorkflows?: boolean;
  /** Currently selected workflow template */
  selectedWorkflow?: WorkflowTemplate | null;
  /** Callback when a workflow is selected */
  onSelectWorkflow?: (workflow: WorkflowTemplate | null) => void;
  /** Size variant for responsive sizing */
  size?: ResponsiveValue<DashboardSize>;
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
export interface DashboardContentProps extends SafeHTMLDivAttributes {
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
  /** Error message if loading failed */
  error?: string | null;
  /** Callback to retry loading */
  onRetry?: () => void;
  /** Size variant for responsive sizing */
  size?: ResponsiveValue<DashboardSize>;
  /** Data test ID for automated testing */
  'data-testid'?: string;
}

// ============================================================================
// Constants
// ============================================================================

/** Default labels */
export const DEFAULT_WELCOME_TITLE = 'Welcome to OpenFlow';
export const DEFAULT_WELCOME_DESCRIPTION =
  'Get started by creating a project or selecting one from the sidebar.';
export const DEFAULT_CREATE_PROJECT_LABEL = 'Create Project';
export const DEFAULT_ERROR_TITLE = 'Failed to load dashboard';
export const DEFAULT_ERROR_RETRY_LABEL = 'Retry';
export const DEFAULT_RECENT_TASKS_LABEL = 'Recent Tasks';
export const DEFAULT_RECENT_TASKS_EMPTY = 'No tasks yet. Create one to get started!';
export const DEFAULT_STATS_LABEL = 'Project statistics';

/** Screen reader announcements */
export const SR_LOADING = 'Loading dashboard...';
export const SR_ERROR = 'Error loading dashboard';
export const SR_EMPTY = 'No project selected. Create a new project to get started.';
export const SR_PROJECT_LOADED = 'Dashboard loaded with project statistics';
export const SR_TASK_COUNT = 'tasks';
export const SR_IN_PROGRESS = 'in progress';
export const SR_IN_REVIEW = 'in review';
export const SR_COMPLETED = 'completed';

/** Status labels for screen readers */
export const STATUS_LABELS: Record<TaskStatus, string> = {
  todo: 'To Do',
  inprogress: 'In Progress',
  inreview: 'In Review',
  done: 'Done',
  cancelled: 'Cancelled',
};

/** Status styles for visual display */
export const STATUS_STYLES: Record<TaskStatus, string> = {
  todo: 'bg-status-todo/20 text-status-todo',
  inprogress: 'bg-status-inprogress/20 text-status-inprogress',
  inreview: 'bg-status-inreview/20 text-status-inreview',
  done: 'bg-status-done/20 text-status-done',
  cancelled: 'bg-status-cancelled/20 text-status-cancelled',
};

/** Variant styles for StatCard */
export const STAT_CARD_VARIANT_STYLES: Record<'default' | 'info' | 'warning' | 'success', string> =
  {
    default: 'border-border',
    info: 'border-info/30 bg-info/5',
    warning: 'border-warning/30 bg-warning/5',
    success: 'border-success/30 bg-success/5',
  };

export const STAT_CARD_VALUE_STYLES: Record<'default' | 'info' | 'warning' | 'success', string> = {
  default: 'text-foreground',
  info: 'text-info',
  warning: 'text-warning',
  success: 'text-success',
};

/** Size-specific classes */
export const STAT_CARD_SIZE_CLASSES: Record<DashboardSize, string> = {
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-5',
};

export const STAT_CARD_LABEL_SIZE_CLASSES: Record<DashboardSize, string> = {
  sm: 'text-xs',
  md: 'text-xs',
  lg: 'text-sm',
};

export const STAT_CARD_VALUE_SIZE_CLASSES: Record<DashboardSize, string> = {
  sm: 'text-xl',
  md: 'text-2xl',
  lg: 'text-3xl',
};

export const STATUS_BADGE_SIZE_CLASSES: Record<DashboardSize, string> = {
  sm: 'px-1.5 py-0.5 text-xs',
  md: 'px-2 py-0.5 text-xs',
  lg: 'px-2.5 py-1 text-sm',
};

export const TASK_ITEM_SIZE_CLASSES: Record<DashboardSize, string> = {
  sm: 'px-2 py-1.5 min-h-[40px]',
  md: 'px-3 py-2 min-h-[44px]',
  lg: 'px-4 py-3 min-h-[48px]',
};

export const DASHBOARD_PADDING_CLASSES: Record<DashboardSize, string> = {
  sm: 'p-3',
  md: 'p-4 md:p-6',
  lg: 'p-6 md:p-8',
};

export const STATS_GRID_GAP_CLASSES: Record<DashboardSize, string> = {
  sm: 'gap-3',
  md: 'gap-4',
  lg: 'gap-5',
};

/** Base classes */
export const STAT_CARD_BASE_CLASSES =
  'rounded-lg border bg-[rgb(var(--card))] motion-safe:transition-colors';

export const STATUS_BADGE_BASE_CLASSES = 'shrink-0 rounded-full font-medium';

export const RECENT_TASKS_CONTAINER_CLASSES =
  'rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--card))]';

export const RECENT_TASKS_HEADER_CLASSES = 'border-b border-[rgb(var(--border))] px-4 py-3';

export const TASK_ITEM_BASE_CLASSES =
  'flex w-full items-center justify-between rounded-md text-left motion-safe:transition-colors hover:bg-[rgb(var(--muted))] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--ring))] focus-visible:ring-offset-2';

export const EMPTY_STATE_CONTAINER_CLASSES = 'flex flex-1 flex-col items-center justify-center p-8';

export const LOADING_CONTAINER_CLASSES = 'flex-1 overflow-auto';

export const ERROR_STATE_CLASSES =
  'flex flex-1 flex-col items-center justify-center p-8 text-center';

export const ERROR_ICON_CONTAINER_CLASSES =
  'flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive mb-4';

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Get the base size from a responsive value
 */
export function getBaseSize(size: ResponsiveValue<DashboardSize>): DashboardSize {
  if (typeof size === 'string') {
    return size;
  }
  return size.base ?? 'md';
}

/**
 * Generate responsive classes from a size value
 */
export function getResponsiveSizeClasses(
  size: ResponsiveValue<DashboardSize>,
  classMap: Record<DashboardSize, string>
): string {
  if (typeof size === 'string') {
    return classMap[size];
  }

  const classes: string[] = [];
  const breakpointOrder: DashboardBreakpoint[] = ['base', 'sm', 'md', 'lg', 'xl', '2xl'];

  for (const breakpoint of breakpointOrder) {
    const sizeValue = size[breakpoint];
    if (sizeValue) {
      const sizeClass = classMap[sizeValue];
      if (breakpoint === 'base') {
        classes.push(sizeClass);
      } else {
        // Split classes and add breakpoint prefix to each
        const splitClasses = sizeClass.split(' ').map((c) => `${breakpoint}:${c}`);
        classes.push(...splitClasses);
      }
    }
  }

  return classes.join(' ');
}

/**
 * Build stats announcement for screen readers
 */
export function buildStatsAnnouncement(tasks: Task[]): string {
  const total = tasks.length;
  const inProgress = tasks.filter((t) => t.status === 'inprogress').length;
  const inReview = tasks.filter((t) => t.status === 'inreview').length;
  const done = tasks.filter((t) => t.status === 'done').length;

  return `${total} ${SR_TASK_COUNT}: ${inProgress} ${SR_IN_PROGRESS}, ${inReview} ${SR_IN_REVIEW}, ${done} ${SR_COMPLETED}`;
}

/**
 * Build task item accessible label
 */
export function buildTaskAccessibleLabel(task: Task): string {
  return `${task.title}, Status: ${STATUS_LABELS[task.status]}`;
}

/**
 * Build header subtitle based on task counts
 */
export function buildHeaderSubtitle(tasks: Task[], isLoading: boolean): string | undefined {
  if (isLoading) return undefined;
  const inProgressCount = tasks.filter((t) => t.status === 'inprogress').length;
  if (inProgressCount === 0) return `${tasks.length} tasks`;
  return `${inProgressCount} task${inProgressCount === 1 ? '' : 's'} in progress`;
}

// ============================================================================
// StatCard Component
// ============================================================================

/**
 * StatCard - Displays a single statistic with label and value
 *
 * @example
 * <StatCard label="Total Tasks" value={42} variant="default" />
 * <StatCard label="In Progress" value={5} variant="info" />
 */
export const StatCard = forwardRef<HTMLDivElement, StatCardProps>(function StatCard(
  { label, value, variant = 'default', size = 'md', className, 'data-testid': testId, ...props },
  ref
) {
  const baseSize = getBaseSize(size);
  const paddingClasses = getResponsiveSizeClasses(size, STAT_CARD_SIZE_CLASSES);
  const labelSizeClasses = getResponsiveSizeClasses(size, STAT_CARD_LABEL_SIZE_CLASSES);
  const valueSizeClasses = getResponsiveSizeClasses(size, STAT_CARD_VALUE_SIZE_CLASSES);

  return (
    <Box
      ref={ref}
      className={cn(
        STAT_CARD_BASE_CLASSES,
        STAT_CARD_VARIANT_STYLES[variant],
        paddingClasses,
        className
      )}
      data-testid={testId}
      data-variant={variant}
      data-size={baseSize}
      {...props}
    >
      <Text
        size="xs"
        weight="medium"
        color="muted-foreground"
        className={labelSizeClasses}
        aria-hidden={true}
      >
        {label}
      </Text>
      <Text
        size="2xl"
        weight="semibold"
        className={cn('mt-1', valueSizeClasses, STAT_CARD_VALUE_STYLES[variant])}
        aria-label={`${label}: ${value}`}
      >
        {value}
      </Text>
      <VisuallyHidden>{`${label}: ${value}`}</VisuallyHidden>
    </Box>
  );
});

// ============================================================================
// StatusBadge Component
// ============================================================================

/**
 * StatusBadge - Displays a task status as a colored badge
 *
 * @example
 * <StatusBadge status="inprogress" />
 */
export const StatusBadge = forwardRef<HTMLSpanElement, StatusBadgeProps>(function StatusBadge(
  { status, size = 'md', className, 'data-testid': testId, ...props },
  ref
) {
  const baseSize = getBaseSize(size);
  const sizeClasses = getResponsiveSizeClasses(size, STATUS_BADGE_SIZE_CLASSES);

  return (
    <Text
      as="span"
      ref={ref}
      className={cn(STATUS_BADGE_BASE_CLASSES, STATUS_STYLES[status], sizeClasses, className)}
      data-testid={testId}
      data-status={status}
      data-size={baseSize}
      role="status"
      aria-label={`Status: ${STATUS_LABELS[status]}`}
      {...props}
    >
      {STATUS_LABELS[status]}
    </Text>
  );
});

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
  onTaskContextMenu,
  onChatContextMenu,
  onViewAllChats,
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
      onTaskContextMenu={onTaskContextMenu}
      onChatContextMenu={onChatContextMenu}
      onViewAllChats={onViewAllChats}
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
  resolvedTheme,
  onThemeToggle,
}: DashboardHeaderProps) {
  return (
    <Header
      title={title}
      subtitle={subtitle}
      onSearch={onSearch}
      onNewChat={onNewChat}
      onNewTerminal={onNewTerminal}
      resolvedTheme={resolvedTheme}
      onThemeToggle={onThemeToggle}
    />
  );
}

// ============================================================================
// State Components
// ============================================================================

/**
 * DashboardEmptyState - Empty state when no project is selected
 */
export const DashboardEmptyState = forwardRef<HTMLDivElement, DashboardEmptyStateProps>(
  function DashboardEmptyState(
    { onNewProject, size = 'md', className, 'data-testid': testId, ...props },
    ref
  ) {
    const baseSize = getBaseSize(size);

    return (
      <Box
        ref={ref}
        className={cn(EMPTY_STATE_CONTAINER_CLASSES, className)}
        data-testid={testId}
        data-size={baseSize}
        role="region"
        aria-label="Empty dashboard"
        {...props}
      >
        <VisuallyHidden>
          <Text as="span" role="status" aria-live="polite">
            {SR_EMPTY}
          </Text>
        </VisuallyHidden>
        <EmptyState
          icon={FolderPlus}
          title={DEFAULT_WELCOME_TITLE}
          description={DEFAULT_WELCOME_DESCRIPTION}
          action={{
            label: DEFAULT_CREATE_PROJECT_LABEL,
            onClick: onNewProject,
          }}
          size={baseSize}
        />
      </Box>
    );
  }
);

/**
 * DashboardLoadingSkeleton - Loading state for dashboard content
 */
export const DashboardLoadingSkeleton = forwardRef<HTMLDivElement, DashboardLoadingSkeletonProps>(
  function DashboardLoadingSkeleton(
    { size = 'md', className, 'data-testid': testId, ...props },
    ref
  ) {
    const baseSize = getBaseSize(size);
    const paddingClasses = getResponsiveSizeClasses(size, DASHBOARD_PADDING_CLASSES);

    return (
      <Box
        ref={ref}
        className={cn(LOADING_CONTAINER_CLASSES, paddingClasses, className)}
        data-testid={testId}
        data-size={baseSize}
        role="status"
        aria-busy={true}
        aria-label={SR_LOADING}
        {...props}
      >
        <VisuallyHidden>
          <Text as="span" aria-live="polite">
            {SR_LOADING}
          </Text>
        </VisuallyHidden>

        {/* Stats skeleton */}
        <SkeletonStats className="mb-6" aria-hidden={true} />

        {/* Recent tasks skeleton */}
        <Box
          className="rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--card))]"
          aria-hidden={true}
        >
          <Box className="border-b border-[rgb(var(--border))] px-4 py-3">
            <Skeleton variant="text" width={96} height={20} />
          </Box>
          <Box className="p-4 space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <SkeletonTaskCard key={`dashboard-skeleton-${i}`} />
            ))}
          </Box>
        </Box>
      </Box>
    );
  }
);

/**
 * DashboardErrorState - Error state when loading fails
 */
export const DashboardErrorState = forwardRef<HTMLDivElement, DashboardErrorStateProps>(
  function DashboardErrorState(
    {
      message,
      onRetry,
      size = 'md',
      className,
      'data-testid': testId,
      errorTitle = DEFAULT_ERROR_TITLE,
      retryLabel = DEFAULT_ERROR_RETRY_LABEL,
      ...props
    },
    ref
  ) {
    const baseSize = getBaseSize(size);

    return (
      <Box
        ref={ref}
        className={cn(ERROR_STATE_CLASSES, className)}
        data-testid={testId}
        data-size={baseSize}
        role="alert"
        aria-live="assertive"
        {...props}
      >
        <VisuallyHidden>
          <Text as="span">{SR_ERROR}</Text>
        </VisuallyHidden>
        <Box className={ERROR_ICON_CONTAINER_CLASSES}>
          <Icon icon={AlertCircle} size="lg" aria-hidden={true} />
        </Box>
        <Heading level={2} size="lg" weight="semibold" className="mb-2">
          {errorTitle}
        </Heading>
        {message && (
          <Text color="muted-foreground" className="mb-4 max-w-md">
            {message}
          </Text>
        )}
        {onRetry && (
          <Button variant="primary" onClick={onRetry} aria-label={retryLabel}>
            {retryLabel}
          </Button>
        )}
      </Box>
    );
  }
);

// ============================================================================
// Content Components
// ============================================================================

/**
 * DashboardStatsGrid - Grid of stat cards showing task metrics
 */
export const DashboardStatsGrid = forwardRef<HTMLDivElement, DashboardStatsGridProps>(
  function DashboardStatsGrid(
    {
      tasks,
      size = 'md',
      className,
      'data-testid': testId,
      statsLabel = DEFAULT_STATS_LABEL,
      ...props
    },
    ref
  ) {
    const baseSize = getBaseSize(size);
    const gapClasses = getResponsiveSizeClasses(size, STATS_GRID_GAP_CLASSES);
    const statsId = useId();

    const inProgressCount = tasks.filter((t) => t.status === 'inprogress').length;
    const inReviewCount = tasks.filter((t) => t.status === 'inreview').length;
    const doneCount = tasks.filter((t) => t.status === 'done').length;

    return (
      <Box
        ref={ref}
        className={cn('mb-6 grid sm:grid-cols-2 lg:grid-cols-4', gapClasses, className)}
        data-testid={testId}
        data-size={baseSize}
        role="region"
        aria-labelledby={statsId}
        {...props}
      >
        <VisuallyHidden>
          <Heading level={2} id={statsId}>
            {statsLabel}
          </Heading>
          <Text as="span" role="status" aria-live="polite">
            {buildStatsAnnouncement(tasks)}
          </Text>
        </VisuallyHidden>
        <StatCard
          label="Total Tasks"
          value={tasks.length}
          variant="default"
          size={size}
          data-testid={testId ? `${testId}-total` : undefined}
        />
        <StatCard
          label="In Progress"
          value={inProgressCount}
          variant="info"
          size={size}
          data-testid={testId ? `${testId}-inprogress` : undefined}
        />
        <StatCard
          label="In Review"
          value={inReviewCount}
          variant="warning"
          size={size}
          data-testid={testId ? `${testId}-inreview` : undefined}
        />
        <StatCard
          label="Completed"
          value={doneCount}
          variant="success"
          size={size}
          data-testid={testId ? `${testId}-done` : undefined}
        />
      </Box>
    );
  }
);

/**
 * RecentTasksList - List of recent tasks with click-to-navigate
 */
export const RecentTasksList = forwardRef<HTMLDivElement, RecentTasksListProps>(
  function RecentTasksList(
    {
      tasks,
      onSelectTask,
      size = 'md',
      className,
      'data-testid': testId,
      listLabel = DEFAULT_RECENT_TASKS_LABEL,
      emptyMessage = DEFAULT_RECENT_TASKS_EMPTY,
      ...props
    },
    ref
  ) {
    const baseSize = getBaseSize(size);
    const itemSizeClasses = getResponsiveSizeClasses(size, TASK_ITEM_SIZE_CLASSES);
    const headingId = useId();
    const listId = useId();

    return (
      <Box
        ref={ref}
        className={cn(RECENT_TASKS_CONTAINER_CLASSES, className)}
        data-testid={testId}
        data-size={baseSize}
        data-task-count={tasks.length}
        role="region"
        aria-labelledby={headingId}
        {...props}
      >
        <Box className={RECENT_TASKS_HEADER_CLASSES}>
          <Heading level={3} size="sm" weight="medium" id={headingId}>
            {listLabel}
          </Heading>
        </Box>
        <Box className="p-4">
          {tasks.length === 0 ? (
            <Box className="py-8 text-center">
              <Text color="muted-foreground" size="sm">
                {emptyMessage}
              </Text>
            </Box>
          ) : (
            <List id={listId} role="list" aria-label={`${listLabel} list`} className="space-y-2">
              {tasks.slice(0, 5).map((task) => (
                <ListItem key={task.id} role="listitem">
                  <Box
                    as="button"
                    type="button"
                    onClick={() => onSelectTask(task.id)}
                    className={cn(TASK_ITEM_BASE_CLASSES, itemSizeClasses)}
                    aria-label={buildTaskAccessibleLabel(task)}
                    data-testid={testId ? `${testId}-item-${task.id}` : undefined}
                  >
                    <Text size="sm" truncate className="flex-1">
                      {task.title}
                    </Text>
                    <StatusBadge status={task.status} size={size} />
                  </Box>
                </ListItem>
              ))}
            </List>
          )}
        </Box>
      </Box>
    );
  }
);

/**
 * DashboardContent - Main content area that switches between states
 */
export const DashboardContent = forwardRef<HTMLDivElement, DashboardContentProps>(
  function DashboardContent(
    {
      isLoadingProjects,
      isLoadingTasks,
      activeProjectId,
      tasks,
      onSelectTask,
      onNewProject,
      error,
      onRetry,
      size = 'md',
      className,
      'data-testid': testId,
      ...props
    },
    ref
  ) {
    const baseSize = getBaseSize(size);
    const paddingClasses = getResponsiveSizeClasses(size, DASHBOARD_PADDING_CLASSES);

    // Error state
    if (error) {
      return (
        <DashboardErrorState
          ref={ref}
          message={error}
          onRetry={onRetry}
          size={size}
          className={className}
          data-testid={testId ? `${testId}-error` : undefined}
          {...props}
        />
      );
    }

    // Empty state when no project selected
    if (!activeProjectId && !isLoadingProjects) {
      return (
        <DashboardEmptyState
          ref={ref}
          onNewProject={onNewProject}
          size={size}
          className={className}
          data-testid={testId ? `${testId}-empty` : undefined}
          {...props}
        />
      );
    }

    // Loading state
    if ((isLoadingProjects || isLoadingTasks) && activeProjectId) {
      return (
        <DashboardLoadingSkeleton
          ref={ref}
          size={size}
          className={className}
          data-testid={testId ? `${testId}-loading` : undefined}
          {...props}
        />
      );
    }

    // Project overview
    if (activeProjectId && !isLoadingTasks) {
      return (
        <Box
          ref={ref}
          className={cn('flex-1 overflow-auto', paddingClasses, className)}
          data-testid={testId}
          data-size={baseSize}
          data-project-id={activeProjectId}
          {...props}
        >
          <VisuallyHidden>
            <Text as="span" role="status" aria-live="polite">
              {SR_PROJECT_LOADED}
            </Text>
          </VisuallyHidden>
          <DashboardStatsGrid
            tasks={tasks}
            size={size}
            data-testid={testId ? `${testId}-stats` : undefined}
          />
          <RecentTasksList
            tasks={tasks}
            onSelectTask={onSelectTask}
            size={size}
            data-testid={testId ? `${testId}-tasks` : undefined}
          />
        </Box>
      );
    }

    return null;
  }
);

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
  size = 'md',
}: CreateProjectDialogProps) {
  const baseSize = getBaseSize(size);
  const errorId = useId();

  return (
    <Dialog isOpen={isOpen} onClose={onClose} title="Create New Project">
      <Box className="space-y-4" data-size={baseSize}>
        {/* Screen reader announcement for dialog */}
        <VisuallyHidden>
          <Text as="span" role="status" aria-live="polite">
            Create new project dialog. Enter project name and repository path.
          </Text>
        </VisuallyHidden>

        <FormField
          label="Project Name"
          required
          error={!projectName.trim() && error ? 'Required' : undefined}
        >
          <Input
            value={projectName}
            onChange={(e) => onProjectNameChange(e.target.value)}
            placeholder="My Awesome Project"
            autoFocus
            error={!!(!projectName.trim() && error)}
          />
        </FormField>

        <FormField
          label="Git Repository Path"
          required
          error={!projectPath.trim() && error ? 'Required' : undefined}
        >
          <Flex gap="2">
            <Input
              value={projectPath}
              onChange={(e) => onProjectPathChange(e.target.value)}
              placeholder="/path/to/your/repo"
              className="flex-1"
              error={!!(!projectPath.trim() && error)}
            />
            <Button
              variant="secondary"
              onClick={onBrowseFolder}
              type="button"
              aria-label="Browse for folder"
            >
              <Icon icon={FolderOpen} size="sm" aria-hidden={true} />
            </Button>
          </Flex>
        </FormField>

        {error && (
          <Text id={errorId} color="destructive" size="sm" role="alert" aria-live="assertive">
            {error}
          </Text>
        )}

        <Flex justify="end" gap="2" className="pt-4">
          <Button variant="ghost" onClick={onClose} disabled={isPending}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={onCreate}
            loading={isPending}
            loadingText="Creating..."
            aria-busy={isPending}
          >
            Create Project
          </Button>
        </Flex>
      </Box>
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
  workflows = [],
  isLoadingWorkflows = false,
  selectedWorkflow = null,
  onSelectWorkflow,
  size = 'md',
}: CreateTaskDialogProps) {
  const baseSize = getBaseSize(size);
  const errorId = useId();

  return (
    <Dialog isOpen={isOpen} onClose={onClose} title="Create New Task">
      <Box className="space-y-4" data-size={baseSize}>
        {/* Screen reader announcement for dialog */}
        <VisuallyHidden>
          <Text as="span" role="status" aria-live="polite">
            Create new task dialog. Enter task title and optional description.
          </Text>
        </VisuallyHidden>

        <FormField
          label="Task Title"
          required
          error={!taskTitle.trim() && error ? 'Required' : undefined}
        >
          <Input
            value={taskTitle}
            onChange={(e) => onTaskTitleChange(e.target.value)}
            placeholder="What needs to be done?"
            autoFocus
            error={!!(!taskTitle.trim() && error)}
          />
        </FormField>

        <FormField label="Description">
          <Input
            value={taskDescription}
            onChange={(e) => onTaskDescriptionChange(e.target.value)}
            placeholder="Optional description..."
          />
        </FormField>

        {/* Workflow template selector */}
        {onSelectWorkflow && (
          <FormField label="Workflow Template">
            <WorkflowSelector
              workflows={workflows}
              selectedWorkflow={selectedWorkflow}
              onSelectWorkflow={onSelectWorkflow}
              loading={isLoadingWorkflows}
              disabled={isPending}
            />
          </FormField>
        )}

        {error && (
          <Text id={errorId} color="destructive" size="sm" role="alert" aria-live="assertive">
            {error}
          </Text>
        )}

        <Flex justify="end" gap="2" className="pt-4">
          <Button variant="ghost" onClick={onClose} disabled={isPending}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={onCreate}
            loading={isPending}
            loadingText="Creating..."
            aria-busy={isPending}
          >
            Create Task
          </Button>
        </Flex>
      </Box>
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
