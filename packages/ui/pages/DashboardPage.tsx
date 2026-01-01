/**
 * DashboardPage - Stateless Page Component for the Dashboard
 *
 * This is a top-level stateless component that composes the entire dashboard view.
 * It receives all required data and callbacks via props, making it fully
 * testable in Storybook with mocked data representing different page states.
 *
 * Accessibility Features:
 * - Proper page landmark structure with main and region roles
 * - h1 heading for page title with proper hierarchy
 * - Screen reader announcements for loading, error, and empty states
 * - Focus management with forwardRef support
 * - Responsive layout for all screen sizes (sm, md, lg)
 * - Error boundary integration for graceful error handling
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
 *
 * @module pages/DashboardPage
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
import {
  Box,
  Flex,
  Heading,
  type ResponsiveValue,
  Text,
  VisuallyHidden,
} from '@openflow/primitives';
import { cn } from '@openflow/utils';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { forwardRef, useId } from 'react';
import { Button } from '../atoms/Button';
import { Icon } from '../atoms/Icon';
import { Skeleton } from '../atoms/Skeleton';
import { EntityContextMenu } from '../molecules/EntityContextMenu';
import { SkeletonList } from '../molecules/SkeletonList';
import { SkeletonProjectCard } from '../molecules/SkeletonProjectCard';
import { SkeletonStats } from '../molecules/SkeletonStats';
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
import { TerminalPanel } from '../organisms/TerminalPanel';

// ============================================================================
// Types
// ============================================================================

/** Size variants for responsive layout */
export type DashboardPageSize = 'sm' | 'md' | 'lg';

/** Breakpoints supported for responsive sizing */
export type DashboardPageBreakpoint = 'base' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

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
  /** Current resolved theme for theme toggle */
  resolvedTheme?: 'light' | 'dark';
  /** Callback when theme toggle is clicked */
  onThemeToggle?: () => void;
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
  /** Available workflow templates */
  workflows?: WorkflowTemplate[];
  /** Whether workflows are loading */
  isLoadingWorkflows?: boolean;
  /** Currently selected workflow template */
  selectedWorkflow?: WorkflowTemplate | null;
  /** Callback when a workflow is selected */
  onSelectWorkflow?: (workflow: WorkflowTemplate | null) => void;
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

/** Props for the terminal panel */
export interface DashboardPageTerminalProps {
  /** Whether the terminal panel is open */
  isOpen: boolean;
  /** Callback when terminal should be closed */
  onClose: () => void;
  /** Process ID for the terminal session */
  processId: string | null;
  /** Raw output to write to the terminal */
  rawOutput: string;
  /** Callback when user types input in the terminal */
  onInput: (data: string) => void;
  /** Callback when terminal is resized (cols, rows) */
  onResize?: (cols: number, rows: number) => void;
  /** Whether the process is currently running */
  isRunning?: boolean;
  /** Whether the terminal is loading */
  isLoading?: boolean;
}

/** Props for the chat context menu */
export interface DashboardPageChatContextMenuProps {
  /** Whether the menu is open */
  isOpen: boolean;
  /** Position of the menu */
  position: { x: number; y: number };
  /** Callback when menu should close */
  onClose: () => void;
  /** Callback when view is clicked */
  onViewDetails: () => void;
  /** Callback when archive is clicked */
  onArchive: () => void;
  /** Callback when delete is clicked */
  onDelete: () => void;
}

/** Props for the task context menu */
export interface DashboardPageTaskContextMenuProps {
  /** Whether the menu is open */
  isOpen: boolean;
  /** Position of the menu */
  position: { x: number; y: number };
  /** Callback when menu should close */
  onClose: () => void;
  /** Callback when view is clicked */
  onViewDetails: () => void;
  /** Callback when duplicate is clicked */
  onDuplicate: () => void;
  /** Callback when open in IDE is clicked */
  onOpenInIDE?: () => void;
  /** Callback when archive is clicked */
  onArchive: () => void;
  /** Callback when delete is clicked */
  onDelete: () => void;
}

/** Error state props for the page */
export interface DashboardPageErrorProps {
  /** The error that occurred */
  error: Error;
  /** Callback to retry the failed operation */
  onRetry: () => void;
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

  // Loading state
  /** Whether the page is in initial loading state */
  isLoading?: boolean;

  // Error state
  /** Error state - if set, shows error UI instead of content */
  error?: Error | null;

  /** Retry handler for error state */
  onRetry?: () => void;

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

  // Terminal panel props (optional - only needed if terminal feature is used)
  terminal?: DashboardPageTerminalProps;

  // Chat context menu props (optional - only needed if chat context menu feature is used)
  chatContextMenu?: DashboardPageChatContextMenuProps;

  // Task context menu props (optional - only needed if task context menu feature is used)
  taskContextMenu?: DashboardPageTaskContextMenuProps;

  // Responsive sizing
  /** Responsive size variant */
  size?: ResponsiveValue<DashboardPageSize>;

  // Accessibility
  /** Custom aria-label for the page */
  'aria-label'?: string;

  // Testing
  /** Data attributes for testing */
  'data-testid'?: string;
}

/** Props for DashboardPageSkeleton */
export interface DashboardPageSkeletonProps {
  /** Number of task skeleton items to show */
  taskCount?: number;
  /** Number of project skeleton items to show */
  projectCount?: number;
  /** Responsive sizing */
  size?: ResponsiveValue<DashboardPageSize>;
  /** Data attributes for testing */
  'data-testid'?: string;
}

/** Props for DashboardPageError */
export interface DashboardPageErrorStateProps {
  /** The error that occurred */
  error: Error;
  /** Retry handler */
  onRetry: () => void;
  /** Responsive sizing */
  size?: ResponsiveValue<DashboardPageSize>;
  /** Data attributes for testing */
  'data-testid'?: string;
}

// ============================================================================
// Constants
// ============================================================================

/** Default task skeleton count */
export const DEFAULT_SKELETON_TASK_COUNT = 5;

/** Default project skeleton count */
export const DEFAULT_SKELETON_PROJECT_COUNT = 3;

/** Default page size */
export const DEFAULT_PAGE_SIZE: DashboardPageSize = 'md';

/** Screen reader announcement for loading state */
export const SR_LOADING = 'Loading dashboard. Please wait.';

/** Screen reader announcement for error state */
export const SR_ERROR_PREFIX = 'Error loading dashboard:';

/** Screen reader announcement for empty state */
export const SR_EMPTY = 'No projects found. Create your first project to get started.';

/** Screen reader announcement for content loaded */
export const SR_LOADED_PREFIX = 'Dashboard loaded.';

/** Default page label */
export const DEFAULT_PAGE_LABEL = 'Dashboard';

/** Default error title */
export const DEFAULT_ERROR_TITLE = 'Failed to load dashboard';

/** Default error description */
export const DEFAULT_ERROR_DESCRIPTION = 'Something went wrong while loading the dashboard.';

/** Default retry button label */
export const DEFAULT_RETRY_LABEL = 'Try Again';

/** Page container base classes */
export const DASHBOARD_PAGE_BASE_CLASSES = 'relative flex flex-col h-full w-full';

/** Error container classes */
export const DASHBOARD_PAGE_ERROR_CLASSES = [
  'flex flex-col items-center justify-center gap-4 p-6',
  'text-center min-h-[300px]',
].join(' ');

/** Skeleton container classes */
export const DASHBOARD_PAGE_SKELETON_CLASSES = 'flex flex-col h-full';

/** Skeleton header classes */
export const DASHBOARD_PAGE_SKELETON_HEADER_CLASSES =
  'border-b border-[rgb(var(--border))] p-4 flex items-center justify-between';

/** Skeleton sidebar classes */
export const DASHBOARD_PAGE_SKELETON_SIDEBAR_CLASSES =
  'w-64 border-r border-[rgb(var(--border))] p-4 hidden md:block';

/** Skeleton main classes */
export const DASHBOARD_PAGE_SKELETON_MAIN_CLASSES = 'flex-1 p-6';

/** Size-based container padding */
export const PAGE_SIZE_PADDING: Record<DashboardPageSize, string> = {
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-6',
};

/** Size-based gap classes */
export const PAGE_SIZE_GAP: Record<DashboardPageSize, string> = {
  sm: 'gap-3',
  md: 'gap-4',
  lg: 'gap-6',
};

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Resolves a ResponsiveValue to its base size
 */
export function getBaseSize(
  size: ResponsiveValue<DashboardPageSize> | undefined
): DashboardPageSize {
  if (!size) return DEFAULT_PAGE_SIZE;
  if (typeof size === 'string') return size;
  return size.base ?? DEFAULT_PAGE_SIZE;
}

/**
 * Generates responsive Tailwind classes for the size prop
 */
export function getResponsiveSizeClasses(
  size: ResponsiveValue<DashboardPageSize> | undefined,
  classMap: Record<DashboardPageSize, string>
): string {
  if (!size) return classMap[DEFAULT_PAGE_SIZE];

  if (typeof size === 'string') {
    return classMap[size];
  }

  const classes: string[] = [];
  const breakpointPrefixes: Record<Exclude<DashboardPageBreakpoint, 'base'>, string> = {
    sm: 'sm:',
    md: 'md:',
    lg: 'lg:',
    xl: 'xl:',
    '2xl': '2xl:',
  };

  // Base size
  if (size.base) {
    classes.push(classMap[size.base]);
  } else {
    classes.push(classMap[DEFAULT_PAGE_SIZE]);
  }

  // Responsive overrides
  for (const [breakpoint, prefix] of Object.entries(breakpointPrefixes)) {
    const bp = breakpoint as Exclude<DashboardPageBreakpoint, 'base'>;
    if (size[bp]) {
      const sizeClasses = classMap[size[bp] as DashboardPageSize];
      const prefixedClasses = sizeClasses
        .split(' ')
        .map((cls) => `${prefix}${cls}`)
        .join(' ');
      classes.push(prefixedClasses);
    }
  }

  return classes.join(' ');
}

/**
 * Build screen reader announcement for loaded state
 */
export function buildLoadedAnnouncement(
  projectCount: number,
  taskCount: number,
  hasActiveProject: boolean
): string {
  if (projectCount === 0) {
    return SR_EMPTY;
  }

  const projectLabel = projectCount === 1 ? 'project' : 'projects';
  const taskLabel = taskCount === 1 ? 'task' : 'tasks';

  if (hasActiveProject) {
    return `${SR_LOADED_PREFIX} ${projectCount} ${projectLabel} available. ${taskCount} ${taskLabel} in current project.`;
  }

  return `${SR_LOADED_PREFIX} ${projectCount} ${projectLabel} available. Select a project to view tasks.`;
}

/**
 * Build accessible label for the page
 */
export function buildPageAccessibleLabel(
  isLoading: boolean,
  hasError: boolean,
  projectName?: string
): string {
  if (hasError) return 'Dashboard - Error loading content';
  if (isLoading) return 'Dashboard - Loading';
  if (projectName) return `Dashboard - ${projectName}`;
  return DEFAULT_PAGE_LABEL;
}

// ============================================================================
// Sub-Components
// ============================================================================

/**
 * Loading skeleton for the dashboard page
 */
export const DashboardPageSkeleton = forwardRef<HTMLDivElement, DashboardPageSkeletonProps>(
  function DashboardPageSkeleton(
    {
      taskCount = DEFAULT_SKELETON_TASK_COUNT,
      projectCount = DEFAULT_SKELETON_PROJECT_COUNT,
      size,
      'data-testid': testId,
    },
    ref
  ) {
    return (
      <Box
        ref={ref}
        className={DASHBOARD_PAGE_SKELETON_CLASSES}
        aria-hidden={true}
        role="presentation"
        data-testid={testId ?? 'dashboard-page-skeleton'}
      >
        {/* Screen reader loading announcement */}
        <VisuallyHidden>
          <Box role="status" aria-live="polite">
            {SR_LOADING}
          </Box>
        </VisuallyHidden>

        {/* Header skeleton */}
        <Box className={DASHBOARD_PAGE_SKELETON_HEADER_CLASSES}>
          <Flex gap="4" align="center">
            <Skeleton width={40} height={40} variant="circular" />
            <Flex direction="column" gap="1">
              <Skeleton width={150} height={24} variant="text" />
              <Skeleton width={100} height={16} variant="text" />
            </Flex>
          </Flex>
          <Flex gap="2">
            <Skeleton width={36} height={36} />
            <Skeleton width={36} height={36} />
            <Skeleton width={36} height={36} />
          </Flex>
        </Box>

        {/* Main content area with sidebar */}
        <Flex className="flex-1">
          {/* Sidebar skeleton */}
          <Box className={DASHBOARD_PAGE_SKELETON_SIDEBAR_CLASSES}>
            <Flex direction="column" gap="4">
              {/* Projects section */}
              <Flex direction="column" gap="2">
                <Skeleton width={80} height={16} variant="text" />
                {Array.from({ length: projectCount }).map((_, i) => (
                  <SkeletonProjectCard key={i} size={size} showDescription={false} />
                ))}
              </Flex>

              {/* Tasks section */}
              <Flex direction="column" gap="2" className="mt-4">
                <Skeleton width={60} height={16} variant="text" />
                <SkeletonList count={taskCount} size={size} lines={2} showAvatar={false} />
              </Flex>
            </Flex>
          </Box>

          {/* Main content skeleton */}
          <Box className={DASHBOARD_PAGE_SKELETON_MAIN_CLASSES}>
            <Flex direction="column" gap="6">
              {/* Stats skeleton */}
              <SkeletonStats count={4} size={size} showIcon showTrend />

              {/* Content skeleton */}
              <Flex direction="column" gap="4">
                <Skeleton width={120} height={24} variant="text" />
                <SkeletonList count={taskCount} size={size} lines={2} showAvatar />
              </Flex>
            </Flex>
          </Box>
        </Flex>
      </Box>
    );
  }
);

/**
 * Error state for the dashboard page
 */
export const DashboardPageError = forwardRef<HTMLDivElement, DashboardPageErrorStateProps>(
  function DashboardPageError({ error, onRetry, size, 'data-testid': testId }, ref) {
    const headingId = useId();
    const descriptionId = useId();

    return (
      <Box
        ref={ref}
        role="alert"
        aria-live="assertive"
        aria-atomic="true"
        aria-labelledby={headingId}
        aria-describedby={descriptionId}
        className={cn(
          DASHBOARD_PAGE_ERROR_CLASSES,
          getResponsiveSizeClasses(size, PAGE_SIZE_PADDING)
        )}
        data-testid={testId ?? 'dashboard-page-error'}
      >
        {/* Screen reader announcement */}
        <VisuallyHidden>
          <Box role="status" aria-live="assertive">
            {SR_ERROR_PREFIX} {error.message}
          </Box>
        </VisuallyHidden>

        <Icon
          icon={AlertTriangle}
          size="xl"
          className="text-[rgb(var(--destructive))]"
          aria-hidden={true}
        />

        <Heading id={headingId} level={2} size="lg" className="text-[rgb(var(--foreground))]">
          {DEFAULT_ERROR_TITLE}
        </Heading>

        <Text id={descriptionId} color="muted-foreground" className="max-w-md">
          {error.message || DEFAULT_ERROR_DESCRIPTION}
        </Text>

        <Button
          onClick={onRetry}
          icon={<Icon icon={RefreshCw} size="sm" aria-hidden={true} />}
          className="min-h-[44px] min-w-[44px]"
        >
          {DEFAULT_RETRY_LABEL}
        </Button>
      </Box>
    );
  }
);

// ============================================================================
// Main Component
// ============================================================================

/**
 * DashboardPage - Complete stateless dashboard page component.
 *
 * This component receives all data and callbacks via props. It is purely
 * presentational, making it fully testable in Storybook with mocked data.
 *
 * Features:
 * - Page-level loading skeleton
 * - Error state with retry button
 * - Empty state handling (delegated to DashboardContent)
 * - Proper heading hierarchy (h1 for title via Header component)
 * - Screen reader announcements for state changes
 * - forwardRef support for focus management
 * - Responsive layout for all screen sizes
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
 *       isLoading={session.isLoading}
 *       error={session.error}
 *       onRetry={session.refetch}
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
export const DashboardPage = forwardRef<HTMLDivElement, DashboardPageProps>(function DashboardPage(
  {
    sidebarCollapsed,
    isMobileDrawerOpen,
    onMobileDrawerToggle,
    isLoading = false,
    error,
    onRetry,
    sidebar,
    header,
    content,
    commandPalette,
    createProjectDialog,
    createTaskDialog,
    newChatDialog,
    terminal,
    chatContextMenu,
    taskContextMenu,
    size,
    'aria-label': ariaLabel,
    'data-testid': testId,
  },
  ref
) {
  const hasError = !!error;
  const projectCount = sidebar.projects.length;
  const taskCount = content.tasks.length;
  const hasActiveProject = !!content.activeProjectId;
  const isEmpty = projectCount === 0;

  // Generate accessible label
  const computedAriaLabel =
    ariaLabel ?? buildPageAccessibleLabel(isLoading, hasError, header.title);

  // Loading state - show skeleton
  if (isLoading) {
    return (
      <Box
        ref={ref}
        className={DASHBOARD_PAGE_BASE_CLASSES}
        aria-label={computedAriaLabel}
        aria-busy={true}
        data-testid={testId ?? 'dashboard-page'}
        data-state="loading"
      >
        <DashboardPageSkeleton size={size} />
      </Box>
    );
  }

  // Error state - show error UI
  if (hasError && error && onRetry) {
    return (
      <Box
        ref={ref}
        className={DASHBOARD_PAGE_BASE_CLASSES}
        aria-label={computedAriaLabel}
        data-testid={testId ?? 'dashboard-page'}
        data-state="error"
      >
        <DashboardPageError error={error} onRetry={onRetry} size={size} />
      </Box>
    );
  }

  // Normal state - show content
  return (
    <Box
      ref={ref}
      className={DASHBOARD_PAGE_BASE_CLASSES}
      aria-label={computedAriaLabel}
      data-testid={testId ?? 'dashboard-page'}
      data-state={isEmpty ? 'empty' : 'loaded'}
      data-project-count={projectCount}
      data-task-count={taskCount}
      data-sidebar-collapsed={sidebarCollapsed}
      data-mobile-drawer-open={isMobileDrawerOpen}
    >
      {/* Screen reader announcements */}
      <VisuallyHidden>
        <Box role="status" aria-live="polite" aria-atomic="true">
          {buildLoadedAnnouncement(projectCount, taskCount, hasActiveProject)}
        </Box>
      </VisuallyHidden>

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
            onTaskContextMenu={sidebar.onTaskContextMenu}
            onChatContextMenu={sidebar.onChatContextMenu}
            onViewAllChats={sidebar.onViewAllChats}
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
            resolvedTheme={header.resolvedTheme}
            onThemeToggle={header.onThemeToggle}
          />
        }
      >
        {/* Main content area - switches between empty/loading/content states */}
        <Box className="flex h-full flex-col">
          <DashboardContent
            isLoadingProjects={content.isLoadingProjects}
            isLoadingTasks={content.isLoadingTasks}
            activeProjectId={content.activeProjectId}
            tasks={content.tasks}
            onSelectTask={content.onSelectTask}
            onNewProject={content.onNewProject}
          />
        </Box>

        {/* Command palette overlay */}
        <DashboardCommandPalette
          isOpen={commandPalette.isOpen}
          onClose={commandPalette.onClose}
          onSearch={commandPalette.onSearch}
          actions={commandPalette.actions}
          recentItems={commandPalette.recentItems}
          query={commandPalette.query}
          searchResults={commandPalette.searchResults}
          isSearching={commandPalette.isSearching}
          onSelectResult={commandPalette.onSelectResult}
          onSelectRecent={commandPalette.onSelectRecent}
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
          workflows={createTaskDialog.workflows}
          isLoadingWorkflows={createTaskDialog.isLoadingWorkflows}
          selectedWorkflow={createTaskDialog.selectedWorkflow}
          onSelectWorkflow={createTaskDialog.onSelectWorkflow}
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

        {/* Terminal panel - optional, only render if terminal props provided */}
        {terminal && (
          <TerminalPanel
            isOpen={terminal.isOpen}
            onClose={terminal.onClose}
            processId={terminal.processId}
            rawOutput={terminal.rawOutput}
            onInput={terminal.onInput}
            onResize={terminal.onResize}
            isRunning={terminal.isRunning}
            isLoading={terminal.isLoading}
          />
        )}

        {/* Chat context menu - optional, only render if chatContextMenu props provided */}
        {chatContextMenu && (
          <EntityContextMenu
            entityType="chat"
            isOpen={chatContextMenu.isOpen}
            position={chatContextMenu.position}
            onClose={chatContextMenu.onClose}
            onViewDetails={chatContextMenu.onViewDetails}
            onArchive={chatContextMenu.onArchive}
            onDelete={chatContextMenu.onDelete}
          />
        )}

        {/* Task context menu - optional, only render if taskContextMenu props provided */}
        {taskContextMenu && (
          <EntityContextMenu
            entityType="task"
            isOpen={taskContextMenu.isOpen}
            position={taskContextMenu.position}
            onClose={taskContextMenu.onClose}
            onViewDetails={taskContextMenu.onViewDetails}
            onDuplicate={taskContextMenu.onDuplicate}
            onOpenInIDE={taskContextMenu.onOpenInIDE}
            onArchive={taskContextMenu.onArchive}
            onDelete={taskContextMenu.onDelete}
          />
        )}
      </DashboardLayout>
    </Box>
  );
});
