/**
 * ProjectDetailPageComponents - UI components for the Project Detail page
 *
 * These are stateless components that compose the project detail page UI.
 * All state and logic is handled by useProjectDetailSession hook.
 *
 * Accessibility:
 * - Uses primitives (Flex, Heading, Text, VisuallyHidden) for semantic HTML
 * - Proper heading hierarchy (h1 for page title, h2 for sections)
 * - Loading states with aria-busy and role="status"
 * - Error states with role="alert" and aria-live="assertive"
 * - Touch targets ≥44px for mobile (WCAG 2.5.5)
 * - Focus rings with ring-offset for visibility
 * - Screen reader announcements for state changes
 * - Proper list semantics with role="list" and role="listitem"
 *
 * Features:
 * - Loading skeleton states
 * - Error state with retry
 * - Not found state
 * - Empty state with call-to-action
 * - Responsive layout
 * - forwardRef support for all components
 */

import type { Project, Task, TaskStatus, WorkflowTemplate } from '@openflow/generated';
import {
  type Breakpoint,
  Flex,
  Heading,
  type ResponsiveValue,
  Text,
  VisuallyHidden,
} from '@openflow/primitives';
import { cn } from '@openflow/utils';
import { AlertCircle, ChevronLeft, FolderGit2, Plus, RefreshCw, Settings } from 'lucide-react';
import { type HTMLAttributes, type ReactNode, forwardRef, useId } from 'react';

import { Button } from '../atoms/Button';
import { Icon } from '../atoms/Icon';
import { Input } from '../atoms/Input';
import { Skeleton } from '../atoms/Skeleton';
import { Textarea } from '../atoms/Textarea';
import { Dialog } from '../molecules/Dialog';
import { EmptyState } from '../molecules/EmptyState';
import { FormField } from '../molecules/FormField';
import { SkeletonTaskCard } from '../molecules/SkeletonTaskCard';
import { AppLayout } from '../templates/AppLayout';
import { Header } from './Header';
import { Sidebar, type StatusFilter } from './Sidebar';
import { TaskList } from './TaskList';
import { WorkflowPreview } from './WorkflowPreview';
import { WorkflowSelector } from './WorkflowSelector';

// ============================================================================
// Types
// ============================================================================

/** Breakpoint names for responsive values */
export type ProjectDetailBreakpoint = Breakpoint;

/** Size variants for project detail components */
export type ProjectDetailSize = 'sm' | 'md' | 'lg';

export interface ProjectDetailLayoutProps {
  /** Whether sidebar is collapsed */
  sidebarCollapsed: boolean;
  /** Whether mobile drawer is open */
  isMobileDrawerOpen?: boolean;
  /** Callback when mobile drawer toggle changes */
  onMobileDrawerToggle?: (open: boolean) => void;
  /** The sidebar content */
  sidebar: ReactNode;
  /** The header content */
  header: ReactNode;
  /** Main content children */
  children: ReactNode;
}

export interface ProjectDetailSidebarProps {
  /** All projects for sidebar */
  projects: Project[];
  /** Tasks for sidebar */
  tasks: Task[];
  /** Selected project ID */
  projectId: string;
  /** Current status filter */
  statusFilter: StatusFilter;
  /** Whether sidebar is collapsed */
  isCollapsed: boolean;
  /** Callback when project is selected */
  onSelectProject: (projectId: string) => void;
  /** Callback when task is selected */
  onSelectTask: (taskId: string) => void;
  /** Callback for new task */
  onNewTask: () => void;
  /** Callback for new project */
  onNewProject: () => void;
  /** Callback for status filter change */
  onStatusFilter: (status: StatusFilter) => void;
  /** Callback for task status change */
  onTaskStatusChange: (taskId: string, status: TaskStatus) => void;
  /** Callback for settings click */
  onSettingsClick: () => void;
  /** Callback for archive click */
  onArchiveClick: () => void;
  /** Callback for sidebar toggle */
  onToggleCollapse: () => void;
}

export interface ProjectDetailHeaderProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  /** The project to display */
  project: Project;
  /** Callback for search */
  onSearch: () => void;
  /** Callback for new task */
  onNewTask: () => void;
  /** Size variant for responsive sizing */
  size?: ResponsiveValue<ProjectDetailSize>;
  /** Data test ID for automated testing */
  'data-testid'?: string;
}

export interface ProjectDetailLoadingSkeletonProps
  extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  /** Callback for search (even in loading state) */
  onSearch?: () => void;
  /** Number of skeleton task cards to show */
  skeletonCount?: number;
  /** Size variant for responsive sizing */
  size?: ResponsiveValue<ProjectDetailSize>;
  /** Data test ID for automated testing */
  'data-testid'?: string;
}

export interface ProjectNotFoundProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  /** Callback to go back to projects */
  onBack: () => void;
  /** Callback for search */
  onSearch: () => void;
  /** Size variant for responsive sizing */
  size?: ResponsiveValue<ProjectDetailSize>;
  /** Data test ID for automated testing */
  'data-testid'?: string;
}

export interface ProjectDetailErrorStateProps
  extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  /** Error message to display */
  message?: string;
  /** Callback to retry loading */
  onRetry?: () => void;
  /** Callback to go back */
  onBack?: () => void;
  /** Callback for search */
  onSearch?: () => void;
  /** Size variant for responsive sizing */
  size?: ResponsiveValue<ProjectDetailSize>;
  /** Data test ID for automated testing */
  'data-testid'?: string;
  /** Custom error title */
  errorTitle?: string;
  /** Custom retry button label */
  retryLabel?: string;
}

export interface ProjectDetailInfoBarProps
  extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  /** The project */
  project: Project;
  /** Callback to go back */
  onBack: () => void;
  /** Callback for settings */
  onSettings: () => void;
  /** Callback for new task */
  onNewTask: () => void;
  /** Size variant for responsive sizing */
  size?: ResponsiveValue<ProjectDetailSize>;
  /** Data test ID for automated testing */
  'data-testid'?: string;
}

export interface ProjectDetailContentProps
  extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  /** Whether tasks are loading */
  isLoading: boolean;
  /** Filtered tasks to display */
  tasks: Task[];
  /** Callback when task is selected */
  onSelectTask: (taskId: string) => void;
  /** Callback for task status change */
  onTaskStatusChange: (taskId: string, status: TaskStatus) => void;
  /** Callback for new task */
  onNewTask: () => void;
  /** Error message if loading failed */
  error?: string | null;
  /** Callback to retry loading */
  onRetry?: () => void;
  /** Size variant for responsive sizing */
  size?: ResponsiveValue<ProjectDetailSize>;
  /** Data test ID for automated testing */
  'data-testid'?: string;
}

export interface ProjectCreateTaskDialogProps {
  /** Whether dialog is open */
  isOpen: boolean;
  /** Task title input value */
  taskTitle: string;
  /** Task description input value */
  taskDescription: string;
  /** Selected workflow template */
  selectedWorkflow: WorkflowTemplate | null;
  /** Available workflow templates */
  workflows: WorkflowTemplate[];
  /** Whether workflows are loading */
  isLoadingWorkflows: boolean;
  /** Whether task is being created */
  isCreating: boolean;
  /** Error message if any */
  error: string | null;
  /** Callback to close dialog */
  onClose: () => void;
  /** Callback to create task */
  onCreate: () => void;
  /** Callback when title changes */
  onTitleChange: (title: string) => void;
  /** Callback when description changes */
  onDescriptionChange: (description: string) => void;
  /** Callback when workflow is selected */
  onWorkflowSelect: (workflow: WorkflowTemplate | null) => void;
  /** Size variant for responsive sizing */
  size?: ResponsiveValue<ProjectDetailSize>;
}

// ============================================================================
// Constants
// ============================================================================

/** Default skeleton count */
export const DEFAULT_SKELETON_COUNT = 5;

/** Default labels */
export const DEFAULT_HEADER_TITLE = 'Project Details';
export const DEFAULT_NOT_FOUND_TITLE = 'Project not found';
export const DEFAULT_NOT_FOUND_DESCRIPTION =
  "The project you're looking for doesn't exist or has been deleted.";
export const DEFAULT_BACK_LABEL = 'Back to Projects';
export const DEFAULT_ERROR_TITLE = 'Failed to load project';
export const DEFAULT_ERROR_RETRY_LABEL = 'Retry';
export const DEFAULT_EMPTY_TITLE = 'No tasks yet';
export const DEFAULT_EMPTY_DESCRIPTION = 'Create your first task to get started.';
export const DEFAULT_CREATE_TASK_LABEL = 'Create Task';
export const DEFAULT_NEW_TASK_LABEL = 'New Task';
export const DEFAULT_SETTINGS_LABEL = 'Project settings';
export const DEFAULT_PROJECTS_LABEL = 'Projects';
export const DEFAULT_BREADCRUMB_SEPARATOR = '/';

/** Screen reader announcements */
export const SR_LOADING = 'Loading project details...';
export const SR_NOT_FOUND = 'Project not found';
export const SR_ERROR = 'Error loading project';
export const SR_PROJECT_LOADED = 'Project loaded';
export const SR_TASKS_LOADED = 'tasks loaded';
export const SR_EMPTY = 'No tasks found';
export const SR_CREATING_TASK = 'Creating task...';
export const SR_TASK_CREATED = 'Task created successfully';

/** Size class constants */
export const PROJECT_DETAIL_PADDING_CLASSES: Record<ProjectDetailSize, string> = {
  sm: 'p-3',
  md: 'p-4 md:p-6',
  lg: 'p-6 md:p-8',
};

export const INFO_BAR_PADDING_CLASSES: Record<ProjectDetailSize, string> = {
  sm: 'px-3 py-2',
  md: 'px-4 py-2.5 md:px-6 md:py-3',
  lg: 'px-6 py-3',
};

export const BUTTON_SIZE_MAP: Record<ProjectDetailSize, 'sm' | 'md' | 'lg'> = {
  sm: 'sm',
  md: 'sm',
  lg: 'md',
};

export const ICON_SIZE_MAP: Record<ProjectDetailSize, 'xs' | 'sm' | 'md' | 'lg'> = {
  sm: 'sm',
  md: 'sm',
  lg: 'md',
};

export const SKELETON_TASK_GAP_CLASSES: Record<ProjectDetailSize, string> = {
  sm: 'gap-1.5',
  md: 'gap-2',
  lg: 'gap-2.5',
};

/** Base class constants */
export const INFO_BAR_BASE_CLASSES =
  'flex items-center justify-between border-b border-[rgb(var(--border))]';

export const BREADCRUMB_BUTTON_CLASSES =
  'flex items-center gap-1 text-sm text-[rgb(var(--muted-foreground))] hover:text-[rgb(var(--foreground))] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--ring))] focus-visible:ring-offset-2 rounded motion-safe:transition-colors min-h-[44px] sm:min-h-0';

export const BREADCRUMB_SEPARATOR_CLASSES = 'text-[rgb(var(--border))]';

export const NOT_FOUND_CONTAINER_CLASSES =
  'flex h-full flex-col items-center justify-center p-8 text-center';

export const NOT_FOUND_ICON_CONTAINER_CLASSES =
  'mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[rgb(var(--muted))]/50';

export const ERROR_STATE_CLASSES =
  'flex h-full flex-col items-center justify-center p-8 text-center';

export const ERROR_ICON_CONTAINER_CLASSES =
  'flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive mb-4';

export const CONTENT_CONTAINER_CLASSES = 'flex-1 overflow-auto';

export const EMPTY_STATE_CONTAINER_CLASSES = 'flex h-full flex-col items-center justify-center p-8';

export const SKELETON_CONTAINER_CLASSES = 'flex flex-col';

export const SKELETON_HEADER_CLASSES =
  'flex items-center gap-4 px-4 py-3 border-b border-[rgb(var(--border))]';

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Get the base size from a responsive value
 */
export function getBaseSize(size: ResponsiveValue<ProjectDetailSize>): ProjectDetailSize {
  if (typeof size === 'string') {
    return size;
  }
  return size.base ?? 'md';
}

/**
 * Generate responsive classes from a size value
 */
export function getResponsiveSizeClasses(
  size: ResponsiveValue<ProjectDetailSize>,
  classMap: Record<ProjectDetailSize, string>
): string {
  if (typeof size === 'string') {
    return classMap[size];
  }

  const classes: string[] = [];
  const breakpointOrder: ProjectDetailBreakpoint[] = ['base', 'sm', 'md', 'lg', 'xl', '2xl'];

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
 * Build accessible label for the info bar breadcrumb
 */
export function buildBreadcrumbAccessibleLabel(projectName: string): string {
  return `Navigate back to ${DEFAULT_PROJECTS_LABEL}. Current: ${projectName}`;
}

/**
 * Build accessible label for the header
 */
export function buildHeaderAccessibleLabel(project: Project): string {
  return `${project.name} on branch ${project.baseBranch}`;
}

/**
 * Build task count announcement for screen readers
 */
export function buildTaskCountAnnouncement(count: number): string {
  return `${count} ${count === 1 ? 'task' : 'tasks'} ${SR_TASKS_LOADED}`;
}

// ============================================================================
// Components
// ============================================================================

/**
 * Main layout wrapper for project detail page
 */
export function ProjectDetailLayout({
  sidebarCollapsed,
  isMobileDrawerOpen,
  onMobileDrawerToggle,
  sidebar,
  header,
  children,
}: ProjectDetailLayoutProps) {
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
 * Sidebar component for project detail page
 */
export function ProjectDetailSidebar({
  projects,
  tasks,
  projectId,
  statusFilter,
  isCollapsed,
  onSelectProject,
  onSelectTask,
  onNewTask,
  onNewProject,
  onStatusFilter,
  onTaskStatusChange,
  onSettingsClick,
  onArchiveClick,
  onToggleCollapse,
}: ProjectDetailSidebarProps) {
  return (
    <Sidebar
      projects={projects}
      tasks={tasks}
      selectedProjectId={projectId}
      statusFilter={statusFilter}
      onSelectProject={onSelectProject}
      onSelectTask={onSelectTask}
      onNewTask={onNewTask}
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
 * Header component for project detail page
 */
export const ProjectDetailHeader = forwardRef<HTMLDivElement, ProjectDetailHeaderProps>(
  function ProjectDetailHeader(
    { project, onSearch, onNewTask, size = 'md', className, 'data-testid': testId, ...props },
    ref
  ) {
    const baseSize = getBaseSize(size);

    return (
      <div ref={ref} className={className} data-testid={testId} data-size={baseSize} {...props}>
        <VisuallyHidden>
          <span role="status" aria-live="polite">
            {buildHeaderAccessibleLabel(project)}
          </span>
        </VisuallyHidden>
        <Header
          title={project.name}
          subtitle={`Branch: ${project.baseBranch}`}
          onSearch={onSearch}
          onNewChat={onNewTask}
        />
      </div>
    );
  }
);

/**
 * Loading skeleton for project detail page
 */
export const ProjectDetailLoadingSkeleton = forwardRef<
  HTMLDivElement,
  ProjectDetailLoadingSkeletonProps
>(function ProjectDetailLoadingSkeleton(
  {
    onSearch,
    skeletonCount = DEFAULT_SKELETON_COUNT,
    size = 'md',
    className,
    'data-testid': testId,
    ...props
  },
  ref
) {
  const baseSize = getBaseSize(size);
  const paddingClasses = getResponsiveSizeClasses(size, PROJECT_DETAIL_PADDING_CLASSES);
  const gapClasses = getResponsiveSizeClasses(size, SKELETON_TASK_GAP_CLASSES);

  return (
    <AppLayout
      sidebarCollapsed={true}
      sidebar={null}
      header={
        <div className={SKELETON_HEADER_CLASSES} aria-hidden="true">
          <Skeleton className="h-6 w-48" />
        </div>
      }
    >
      <div
        ref={ref}
        className={cn(paddingClasses, className)}
        data-testid={testId}
        data-size={baseSize}
        data-skeleton-count={skeletonCount}
        role="status"
        aria-busy="true"
        aria-label={SR_LOADING}
        {...props}
      >
        <VisuallyHidden>
          <span aria-live="polite">{SR_LOADING}</span>
        </VisuallyHidden>
        <div className={cn(SKELETON_CONTAINER_CLASSES, gapClasses)} aria-hidden="true">
          {Array.from({ length: skeletonCount }).map((_, i) => (
            <SkeletonTaskCard key={`skeleton-project-${i}`} />
          ))}
        </div>
      </div>
    </AppLayout>
  );
});

/**
 * Not found state when project doesn't exist
 */
export const ProjectNotFound = forwardRef<HTMLDivElement, ProjectNotFoundProps>(
  function ProjectNotFound(
    { onBack, onSearch, size = 'md', className, 'data-testid': testId, ...props },
    ref
  ) {
    const baseSize = getBaseSize(size);
    const iconSize = ICON_SIZE_MAP[baseSize];

    return (
      <AppLayout
        sidebarCollapsed={true}
        sidebar={null}
        header={<Header title={DEFAULT_NOT_FOUND_TITLE} onSearch={onSearch} />}
      >
        <div
          ref={ref}
          className={cn(NOT_FOUND_CONTAINER_CLASSES, className)}
          data-testid={testId}
          data-size={baseSize}
          role="region"
          aria-label={DEFAULT_NOT_FOUND_TITLE}
          {...props}
        >
          <VisuallyHidden>
            <span role="status" aria-live="polite">
              {SR_NOT_FOUND}. {DEFAULT_NOT_FOUND_DESCRIPTION}
            </span>
          </VisuallyHidden>
          <div className={NOT_FOUND_ICON_CONTAINER_CLASSES}>
            <Icon
              icon={FolderGit2}
              size="xl"
              className="text-[rgb(var(--muted-foreground))]"
              aria-hidden="true"
            />
          </div>
          <Heading level={2} size="lg" weight="semibold" className="mb-2">
            {DEFAULT_NOT_FOUND_TITLE}
          </Heading>
          <Text color="muted-foreground" size="sm" className="max-w-md">
            {DEFAULT_NOT_FOUND_DESCRIPTION}
          </Text>
          <Button
            variant="primary"
            className="mt-6 min-h-[44px] sm:min-h-0"
            onClick={onBack}
            size={BUTTON_SIZE_MAP[baseSize]}
            icon={<Icon icon={ChevronLeft} size={iconSize} aria-hidden="true" />}
            aria-label={DEFAULT_BACK_LABEL}
          >
            {DEFAULT_BACK_LABEL}
          </Button>
        </div>
      </AppLayout>
    );
  }
);

/**
 * Error state when loading fails
 */
export const ProjectDetailErrorState = forwardRef<HTMLDivElement, ProjectDetailErrorStateProps>(
  function ProjectDetailErrorState(
    {
      message,
      onRetry,
      onBack,
      onSearch,
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
      <AppLayout
        sidebarCollapsed={true}
        sidebar={null}
        header={onSearch ? <Header title={errorTitle} onSearch={onSearch} /> : null}
      >
        <div
          ref={ref}
          className={cn(ERROR_STATE_CLASSES, className)}
          data-testid={testId}
          data-size={baseSize}
          role="alert"
          aria-live="assertive"
          {...props}
        >
          <VisuallyHidden>
            <span>
              {SR_ERROR}. {message || errorTitle}
            </span>
          </VisuallyHidden>
          <div className={ERROR_ICON_CONTAINER_CLASSES}>
            <Icon icon={AlertCircle} size="lg" aria-hidden="true" />
          </div>
          <Heading level={2} size="lg" weight="semibold" className="mb-2">
            {errorTitle}
          </Heading>
          {message && (
            <Text color="muted-foreground" className="mb-4 max-w-md">
              {message}
            </Text>
          )}
          <Flex gap="3" className="mt-2">
            {onBack && (
              <Button
                variant="ghost"
                onClick={onBack}
                size={BUTTON_SIZE_MAP[baseSize]}
                className="min-h-[44px] sm:min-h-0"
                icon={<Icon icon={ChevronLeft} size={ICON_SIZE_MAP[baseSize]} aria-hidden="true" />}
              >
                Back
              </Button>
            )}
            {onRetry && (
              <Button
                variant="primary"
                onClick={onRetry}
                size={BUTTON_SIZE_MAP[baseSize]}
                className="min-h-[44px] sm:min-h-0"
                icon={<Icon icon={RefreshCw} size={ICON_SIZE_MAP[baseSize]} aria-hidden="true" />}
                aria-label={retryLabel}
              >
                {retryLabel}
              </Button>
            )}
          </Flex>
        </div>
      </AppLayout>
    );
  }
);

/**
 * Info bar showing project breadcrumb and actions
 */
export const ProjectDetailInfoBar = forwardRef<HTMLDivElement, ProjectDetailInfoBarProps>(
  function ProjectDetailInfoBar(
    {
      project,
      onBack,
      onSettings,
      onNewTask,
      size = 'md',
      className,
      'data-testid': testId,
      ...props
    },
    ref
  ) {
    const baseSize = getBaseSize(size);
    const paddingClasses = getResponsiveSizeClasses(size, INFO_BAR_PADDING_CLASSES);
    const buttonSize = BUTTON_SIZE_MAP[baseSize];
    const iconSize = ICON_SIZE_MAP[baseSize];

    return (
      <nav
        ref={ref}
        className={cn(INFO_BAR_BASE_CLASSES, paddingClasses, className)}
        data-testid={testId}
        data-size={baseSize}
        aria-label="Breadcrumb navigation"
        {...props}
      >
        <Flex align="center" gap="4">
          <button
            type="button"
            onClick={onBack}
            className={BREADCRUMB_BUTTON_CLASSES}
            aria-label={buildBreadcrumbAccessibleLabel(project.name)}
          >
            <Icon icon={ChevronLeft} size="sm" aria-hidden="true" />
            <Text
              size="sm"
              color="muted-foreground"
              className="hover:text-[rgb(var(--foreground))]"
            >
              {DEFAULT_PROJECTS_LABEL}
            </Text>
          </button>
          <Text as="span" className={BREADCRUMB_SEPARATOR_CLASSES} aria-hidden={true}>
            {DEFAULT_BREADCRUMB_SEPARATOR}
          </Text>
          <Text size="sm" weight="medium" aria-current="page">
            {project.name}
          </Text>
        </Flex>
        <Flex align="center" gap="2">
          <Button
            variant="ghost"
            size={buttonSize}
            onClick={onSettings}
            className="min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0"
            aria-label={DEFAULT_SETTINGS_LABEL}
            data-testid={testId ? `${testId}-settings` : undefined}
          >
            <Icon icon={Settings} size={iconSize} aria-hidden="true" />
          </Button>
          <Button
            variant="primary"
            size={buttonSize}
            onClick={onNewTask}
            className="min-h-[44px] sm:min-h-0"
            icon={<Icon icon={Plus} size={iconSize} aria-hidden="true" />}
            data-testid={testId ? `${testId}-new-task` : undefined}
          >
            {DEFAULT_NEW_TASK_LABEL}
          </Button>
        </Flex>
      </nav>
    );
  }
);

/**
 * Main content area showing tasks
 */
export const ProjectDetailContent = forwardRef<HTMLDivElement, ProjectDetailContentProps>(
  function ProjectDetailContent(
    {
      isLoading,
      tasks,
      onSelectTask,
      onTaskStatusChange,
      onNewTask,
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
    const paddingClasses = getResponsiveSizeClasses(size, PROJECT_DETAIL_PADDING_CLASSES);
    const gapClasses = getResponsiveSizeClasses(size, SKELETON_TASK_GAP_CLASSES);
    const contentId = useId();

    // Error state
    if (error) {
      return (
        <div
          ref={ref}
          className={cn(ERROR_STATE_CLASSES, className)}
          data-testid={testId ? `${testId}-error` : undefined}
          data-size={baseSize}
          role="alert"
          aria-live="assertive"
          {...props}
        >
          <VisuallyHidden>
            <span>
              {SR_ERROR}. {error}
            </span>
          </VisuallyHidden>
          <div className={ERROR_ICON_CONTAINER_CLASSES}>
            <Icon icon={AlertCircle} size="lg" aria-hidden="true" />
          </div>
          <Heading level={2} size="lg" weight="semibold" className="mb-2">
            {DEFAULT_ERROR_TITLE}
          </Heading>
          <Text color="muted-foreground" className="mb-4 max-w-md">
            {error}
          </Text>
          {onRetry && (
            <Button
              variant="primary"
              onClick={onRetry}
              className="min-h-[44px] sm:min-h-0"
              icon={<Icon icon={RefreshCw} size={ICON_SIZE_MAP[baseSize]} aria-hidden="true" />}
            >
              {DEFAULT_ERROR_RETRY_LABEL}
            </Button>
          )}
        </div>
      );
    }

    // Loading state
    if (isLoading) {
      return (
        <div
          ref={ref}
          className={cn(CONTENT_CONTAINER_CLASSES, paddingClasses, className)}
          data-testid={testId ? `${testId}-loading` : undefined}
          data-size={baseSize}
          role="status"
          aria-busy="true"
          aria-label={SR_LOADING}
          {...props}
        >
          <VisuallyHidden>
            <span aria-live="polite">{SR_LOADING}</span>
          </VisuallyHidden>
          <div className={cn(SKELETON_CONTAINER_CLASSES, gapClasses)} aria-hidden="true">
            {Array.from({ length: DEFAULT_SKELETON_COUNT }).map((_, i) => (
              <SkeletonTaskCard key={`skeleton-tasks-${i}`} />
            ))}
          </div>
        </div>
      );
    }

    // Empty state
    if (tasks.length === 0) {
      return (
        <div
          ref={ref}
          className={cn(CONTENT_CONTAINER_CLASSES, paddingClasses, className)}
          data-testid={testId ? `${testId}-empty` : undefined}
          data-size={baseSize}
          {...props}
        >
          <div className={EMPTY_STATE_CONTAINER_CLASSES}>
            <VisuallyHidden>
              <span role="status" aria-live="polite">
                {SR_EMPTY}. {DEFAULT_EMPTY_DESCRIPTION}
              </span>
            </VisuallyHidden>
            <EmptyState
              icon={Plus}
              title={DEFAULT_EMPTY_TITLE}
              description={DEFAULT_EMPTY_DESCRIPTION}
              action={{
                label: DEFAULT_CREATE_TASK_LABEL,
                onClick: onNewTask,
              }}
              size={baseSize}
            />
          </div>
        </div>
      );
    }

    // Tasks list
    return (
      <div
        ref={ref}
        className={cn(CONTENT_CONTAINER_CLASSES, paddingClasses, className)}
        data-testid={testId}
        data-size={baseSize}
        data-task-count={tasks.length}
        role="region"
        aria-labelledby={contentId}
        {...props}
      >
        <VisuallyHidden>
          <h2 id={contentId}>Tasks</h2>
          <span role="status" aria-live="polite">
            {buildTaskCountAnnouncement(tasks.length)}
          </span>
        </VisuallyHidden>
        <TaskList tasks={tasks} onSelectTask={onSelectTask} onStatusChange={onTaskStatusChange} />
      </div>
    );
  }
);

/**
 * Dialog for creating a new task with workflow template selection
 */
export function ProjectCreateTaskDialog({
  isOpen,
  taskTitle,
  taskDescription,
  selectedWorkflow,
  workflows,
  isLoadingWorkflows,
  isCreating,
  error,
  onClose,
  onCreate,
  onTitleChange,
  onDescriptionChange,
  onWorkflowSelect,
  size = 'md',
}: ProjectCreateTaskDialogProps) {
  const baseSize = getBaseSize(size);
  const errorId = useId();
  const formId = useId();

  return (
    <Dialog isOpen={isOpen} onClose={onClose} title="Create New Task">
      <form
        id={formId}
        className="space-y-4"
        data-size={baseSize}
        onSubmit={(e) => {
          e.preventDefault();
          onCreate();
        }}
        role="form"
        aria-label="Create new task form"
      >
        {/* Screen reader announcement for dialog */}
        <VisuallyHidden>
          <span role="status" aria-live="polite">
            {isCreating
              ? SR_CREATING_TASK
              : 'Create new task dialog. Enter task title and select a workflow template.'}
          </span>
        </VisuallyHidden>

        <FormField
          label="Task Title"
          required
          error={!taskTitle.trim() && error ? 'Required' : undefined}
        >
          <Input
            value={taskTitle}
            onChange={(e) => onTitleChange(e.target.value)}
            placeholder="e.g., Implement user authentication"
            autoFocus
            error={!!(!taskTitle.trim() && error)}
            aria-required="true"
          />
        </FormField>

        <FormField label="Description">
          <Textarea
            value={taskDescription}
            onChange={(e) => onDescriptionChange(e.target.value)}
            placeholder="Describe what needs to be done..."
            rows={3}
          />
        </FormField>

        {/* Workflow template selector */}
        <FormField label="Workflow Template (optional)">
          <WorkflowSelector
            workflows={workflows}
            selectedWorkflow={selectedWorkflow}
            onSelectWorkflow={onWorkflowSelect}
            loading={isLoadingWorkflows}
            disabled={isCreating}
          />
        </FormField>

        {/* Preview selected workflow */}
        {selectedWorkflow && (
          <div
            className="rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--surface-1))] p-4"
            role="region"
            aria-label={`Selected workflow: ${selectedWorkflow.name}`}
          >
            <WorkflowPreview workflow={selectedWorkflow} maxSteps={5} showDescriptions />
          </div>
        )}

        {error && (
          <Text id={errorId} color="destructive" size="sm" role="alert" aria-live="assertive">
            {error}
          </Text>
        )}

        <Flex justify="end" gap="2" className="pt-4">
          <Button
            variant="ghost"
            onClick={onClose}
            disabled={isCreating}
            type="button"
            className="min-h-[44px] sm:min-h-0"
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            type="submit"
            loading={isCreating}
            loadingText="Creating..."
            aria-busy={isCreating}
            className="min-h-[44px] sm:min-h-0"
          >
            Create Task
          </Button>
        </Flex>
      </form>
    </Dialog>
  );
}
