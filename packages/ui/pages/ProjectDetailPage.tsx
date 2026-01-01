/**
 * ProjectDetailPage - Stateless Page Component for the Project Detail View
 *
 * This is a top-level stateless component that composes the entire project detail view.
 * It receives all required data and callbacks via props, making it fully
 * testable in Storybook with mocked data representing different page states.
 *
 * Accessibility:
 * - Uses primitives (VisuallyHidden) for screen reader announcements
 * - Proper heading hierarchy (h1 for page title in sub-components)
 * - Loading states with aria-busy and role="status"
 * - Error states with role="alert" and aria-live="assertive"
 * - Touch targets ≥44px for mobile (WCAG 2.5.5)
 * - Focus rings with ring-offset for visibility
 * - Screen reader announcements for state changes
 *
 * The component composes:
 * - ProjectDetailLayout (sidebar + header + main content)
 * - ProjectDetailSidebar (project/task navigation)
 * - ProjectDetailHeader (project name, actions)
 * - ProjectDetailInfoBar (breadcrumb and quick actions)
 * - ProjectDetailContent (task list)
 * - ProjectCreateTaskDialog (create task with workflow)
 * - Loading and not-found states
 */

import type { Project, Task, TaskStatus, WorkflowTemplate } from '@openflow/generated';
import type { Breakpoint, ResponsiveValue } from '@openflow/primitives';
import { Box, VisuallyHidden } from '@openflow/primitives';
import { cn } from '@openflow/utils';
import { type HTMLAttributes, forwardRef } from 'react';

import {
  ProjectCreateTaskDialog,
  ProjectDetailContent,
  ProjectDetailErrorState,
  ProjectDetailHeader,
  ProjectDetailInfoBar,
  ProjectDetailLayout,
  ProjectDetailLoadingSkeleton,
  ProjectDetailSidebar,
  ProjectNotFound,
} from '../organisms/ProjectDetailPageComponents';
import type { StatusFilter } from '../organisms/Sidebar';

// ============================================================================
// Types
// ============================================================================

/** Breakpoint names for responsive values */
export type ProjectDetailPageBreakpoint = Breakpoint;

/** Size variants for the page */
export type ProjectDetailPageSize = 'sm' | 'md' | 'lg';

/** Props for the sidebar section */
export interface ProjectDetailPageSidebarProps {
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

/** Props for the header section */
export interface ProjectDetailPageHeaderProps {
  /** Callback for search */
  onSearch: () => void;
  /** Callback for new task */
  onNewTask: () => void;
}

/** Props for the info bar section */
export interface ProjectDetailPageInfoBarProps {
  /** Callback to go back */
  onBack: () => void;
  /** Callback for settings */
  onSettings: () => void;
  /** Callback for new task */
  onNewTask: () => void;
}

/** Props for the content section */
export interface ProjectDetailPageContentProps {
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
  /** Error message if any */
  error?: string | null;
  /** Callback to retry on error */
  onRetry?: () => void;
}

/** Props for the create task dialog */
export interface ProjectDetailPageCreateTaskDialogProps {
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
}

/** Error state props */
export interface ProjectDetailPageErrorStateProps
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
  size?: ResponsiveValue<ProjectDetailPageSize>;
  /** Data test ID for automated testing */
  'data-testid'?: string;
}

/** Props for skeleton component */
export interface ProjectDetailPageSkeletonProps
  extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  /** Callback for search (even in loading state) */
  onSearch?: () => void;
  /** Number of skeleton task cards to show */
  skeletonCount?: number;
  /** Size variant for responsive sizing */
  size?: ResponsiveValue<ProjectDetailPageSize>;
  /** Data test ID for automated testing */
  'data-testid'?: string;
}

/**
 * Complete props for the ProjectDetailPage component.
 *
 * This interface defines all data and callbacks needed to render the project detail page.
 * The route component is responsible for providing these props from hooks.
 */
export interface ProjectDetailPageProps
  extends Omit<HTMLAttributes<HTMLDivElement>, 'children' | 'content'> {
  /** Page state: 'loading' | 'not-found' | 'error' | 'ready' */
  state: 'loading' | 'not-found' | 'error' | 'ready';

  /** Error message (only used when state is 'error') */
  errorMessage?: string;

  /** Callback for error retry (only used when state is 'error') */
  onErrorRetry?: () => void;

  /** Callback for not-found/error back button */
  onNotFoundBack?: () => void;

  /** Callback for search (used in loading/not-found/error states too) */
  onSearch?: () => void;

  // The following props are only required when state is 'ready'

  /** The project being displayed */
  project?: Project;

  /** Whether sidebar is collapsed */
  sidebarCollapsed?: boolean;

  /** Whether mobile drawer is open */
  isMobileDrawerOpen?: boolean;

  /** Callback when mobile drawer toggle changes */
  onMobileDrawerToggle?: (open: boolean) => void;

  /** Sidebar props */
  sidebar?: ProjectDetailPageSidebarProps;

  /** Header props */
  header?: ProjectDetailPageHeaderProps;

  /** Info bar props */
  infoBar?: ProjectDetailPageInfoBarProps;

  /** Content props */
  content?: ProjectDetailPageContentProps;

  /** Create task dialog props */
  createTaskDialog?: ProjectDetailPageCreateTaskDialogProps;

  /** Size variant for responsive sizing */
  size?: ResponsiveValue<ProjectDetailPageSize>;

  /** Data test ID for automated testing */
  'data-testid'?: string;
}

// ============================================================================
// Constants
// ============================================================================

/** Default number of skeleton task cards */
export const DEFAULT_SKELETON_TASK_COUNT = 5;

/** Default page size */
export const DEFAULT_PAGE_SIZE: ProjectDetailPageSize = 'md';

/** Default labels */
export const DEFAULT_PAGE_LABEL = 'Project Details';
export const DEFAULT_ERROR_TITLE = 'Failed to load project';
export const DEFAULT_ERROR_DESCRIPTION =
  'An error occurred while loading the project. Please try again.';
export const DEFAULT_RETRY_LABEL = 'Retry';
export const DEFAULT_BACK_LABEL = 'Back to Projects';

/** Screen reader announcements */
export const SR_LOADING = 'Loading project details...';
export const SR_NOT_FOUND = 'Project not found';
export const SR_ERROR_PREFIX = 'Error:';
export const SR_EMPTY = 'No tasks found';
export const SR_LOADED_PREFIX = 'Project loaded:';

/** Base CSS classes */
export const PROJECT_DETAIL_PAGE_BASE_CLASSES = 'flex h-full flex-col';

export const PROJECT_DETAIL_PAGE_ERROR_CLASSES =
  'flex h-full flex-col items-center justify-center p-8 text-center';

export const PROJECT_DETAIL_PAGE_SKELETON_CLASSES = 'flex h-full flex-col';

export const PROJECT_DETAIL_PAGE_SKELETON_HEADER_CLASSES =
  'flex items-center gap-4 px-4 py-3 border-b border-[rgb(var(--border))]';

export const PROJECT_DETAIL_PAGE_SKELETON_SIDEBAR_CLASSES =
  'flex h-full w-64 flex-col gap-2 p-4 border-r border-[rgb(var(--border))]';

export const PROJECT_DETAIL_PAGE_SKELETON_MAIN_CLASSES = 'flex-1 overflow-auto p-4';

export const PROJECT_DETAIL_PAGE_SKELETON_CONTENT_CLASSES = 'flex flex-col gap-2';

export const PROJECT_DETAIL_PAGE_ERROR_ICON_CLASSES =
  'flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive mb-4';

/** Size-specific padding classes */
export const PAGE_SIZE_PADDING: Record<ProjectDetailPageSize, string> = {
  sm: 'p-3',
  md: 'p-4 md:p-6',
  lg: 'p-6 md:p-8',
};

/** Size-specific gap classes */
export const PAGE_SIZE_GAP: Record<ProjectDetailPageSize, string> = {
  sm: 'gap-1.5',
  md: 'gap-2',
  lg: 'gap-2.5',
};

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Get the base size from a responsive value
 */
export function getBaseSize(size: ResponsiveValue<ProjectDetailPageSize>): ProjectDetailPageSize {
  if (typeof size === 'string') {
    return size;
  }
  return size.base ?? DEFAULT_PAGE_SIZE;
}

/**
 * Generate responsive classes from a size value
 */
export function getResponsiveSizeClasses(
  size: ResponsiveValue<ProjectDetailPageSize>,
  classMap: Record<ProjectDetailPageSize, string>
): string {
  if (typeof size === 'string') {
    return classMap[size];
  }

  const classes: string[] = [];
  const breakpointOrder: ProjectDetailPageBreakpoint[] = ['base', 'sm', 'md', 'lg', 'xl', '2xl'];

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
 * Build loaded announcement for screen readers
 */
export function buildLoadedAnnouncement(project: Project, taskCount: number): string {
  const taskText = taskCount === 1 ? 'task' : 'tasks';
  return `${SR_LOADED_PREFIX} ${project.name} with ${taskCount} ${taskText}`;
}

/**
 * Build accessible label for the page
 */
export function buildPageAccessibleLabel(
  state: ProjectDetailPageProps['state'],
  project?: Project
): string {
  switch (state) {
    case 'loading':
      return SR_LOADING;
    case 'not-found':
      return SR_NOT_FOUND;
    case 'error':
      return DEFAULT_ERROR_TITLE;
    case 'ready':
      return project ? `${DEFAULT_PAGE_LABEL}: ${project.name}` : DEFAULT_PAGE_LABEL;
  }
}

// ============================================================================
// Sub-Components
// ============================================================================

/**
 * ProjectDetailPageSkeleton - Loading skeleton for the project detail page
 */
export const ProjectDetailPageSkeleton = forwardRef<HTMLDivElement, ProjectDetailPageSkeletonProps>(
  function ProjectDetailPageSkeleton(
    {
      onSearch,
      skeletonCount = DEFAULT_SKELETON_TASK_COUNT,
      size = DEFAULT_PAGE_SIZE,
      className,
      'data-testid': testId,
      ...props
    },
    ref
  ) {
    const baseSize = getBaseSize(size);

    return (
      <ProjectDetailLoadingSkeleton
        ref={ref}
        onSearch={onSearch}
        skeletonCount={skeletonCount}
        size={baseSize}
        className={className}
        data-testid={testId ?? 'project-detail-page-skeleton'}
        {...props}
      />
    );
  }
);

/**
 * ProjectDetailPageError - Error state for the project detail page
 */
export const ProjectDetailPageError = forwardRef<HTMLDivElement, ProjectDetailPageErrorStateProps>(
  function ProjectDetailPageError(
    {
      message,
      onRetry,
      onBack,
      onSearch,
      size = DEFAULT_PAGE_SIZE,
      className,
      'data-testid': testId,
      ...props
    },
    ref
  ) {
    const baseSize = getBaseSize(size);

    return (
      <ProjectDetailErrorState
        ref={ref}
        message={message}
        onRetry={onRetry}
        onBack={onBack}
        onSearch={onSearch}
        size={baseSize}
        className={className}
        data-testid={testId ?? 'project-detail-page-error'}
        {...props}
      />
    );
  }
);

// ============================================================================
// Main Component
// ============================================================================

/**
 * ProjectDetailPage - Complete stateless project detail page component.
 *
 * This component receives all data and callbacks via props. It is purely
 * presentational, making it fully testable in Storybook with mocked data.
 *
 * @example
 * ```tsx
 * // In route component
 * function ProjectDetailRoute() {
 *   const { projectId } = Route.useParams();
 *   const navigate = useNavigate();
 *
 *   const session = useProjectDetailSession({
 *     projectId,
 *     navigate: ({ to, params }) => navigate({ to, params }),
 *   });
 *
 *   // Loading state
 *   if (session.isLoadingProject) {
 *     return (
 *       <ProjectDetailPage
 *         state="loading"
 *         onSearch={session.handleSearch}
 *       />
 *     );
 *   }
 *
 *   // Error state
 *   if (session.error) {
 *     return (
 *       <ProjectDetailPage
 *         state="error"
 *         errorMessage={session.error.message}
 *         onErrorRetry={session.handleRetry}
 *         onNotFoundBack={session.handleBackToProjects}
 *         onSearch={session.handleSearch}
 *       />
 *     );
 *   }
 *
 *   // Not found state
 *   if (!session.project) {
 *     return (
 *       <ProjectDetailPage
 *         state="not-found"
 *         onNotFoundBack={session.handleBackToProjects}
 *         onSearch={session.handleSearch}
 *       />
 *     );
 *   }
 *
 *   // Ready state
 *   return (
 *     <ProjectDetailPage
 *       state="ready"
 *       project={session.project}
 *       sidebarCollapsed={session.sidebarCollapsed}
 *       sidebar={{...}}
 *       header={{...}}
 *       infoBar={{...}}
 *       content={{...}}
 *       createTaskDialog={{...}}
 *     />
 *   );
 * }
 * ```
 */
export const ProjectDetailPage = forwardRef<HTMLDivElement, ProjectDetailPageProps>(
  function ProjectDetailPage(
    {
      state,
      errorMessage,
      onErrorRetry,
      onNotFoundBack,
      onSearch,
      project,
      sidebarCollapsed,
      isMobileDrawerOpen,
      onMobileDrawerToggle,
      sidebar,
      header,
      infoBar,
      content,
      createTaskDialog,
      size = DEFAULT_PAGE_SIZE,
      className,
      'data-testid': testId,
      ...props
    },
    ref
  ) {
    const baseSize = getBaseSize(size);
    const accessibleLabel = buildPageAccessibleLabel(state, project);

    // Compute task count for announcements
    const taskCount = content?.tasks.length ?? 0;

    // Loading state
    if (state === 'loading') {
      return (
        <Box
          ref={ref}
          className={cn(PROJECT_DETAIL_PAGE_BASE_CLASSES, className)}
          data-testid={testId ?? 'project-detail-page'}
          data-state="loading"
          data-size={baseSize}
          aria-label={accessibleLabel}
          {...props}
        >
          <VisuallyHidden>
            <Box as="span" role="status" aria-live="polite">
              {SR_LOADING}
            </Box>
          </VisuallyHidden>
          <ProjectDetailLoadingSkeleton onSearch={onSearch} size={baseSize} />
        </Box>
      );
    }

    // Error state
    if (state === 'error') {
      return (
        <Box
          ref={ref}
          className={cn(PROJECT_DETAIL_PAGE_BASE_CLASSES, className)}
          data-testid={testId ?? 'project-detail-page'}
          data-state="error"
          data-size={baseSize}
          aria-label={accessibleLabel}
          {...props}
        >
          <VisuallyHidden>
            <Box as="span" role="status" aria-live="assertive">
              {SR_ERROR_PREFIX} {errorMessage || DEFAULT_ERROR_DESCRIPTION}
            </Box>
          </VisuallyHidden>
          <ProjectDetailErrorState
            message={errorMessage}
            onRetry={onErrorRetry}
            onBack={onNotFoundBack}
            onSearch={onSearch}
            size={baseSize}
          />
        </Box>
      );
    }

    // Not found state
    if (state === 'not-found') {
      return (
        <Box
          ref={ref}
          className={cn(PROJECT_DETAIL_PAGE_BASE_CLASSES, className)}
          data-testid={testId ?? 'project-detail-page'}
          data-state="not-found"
          data-size={baseSize}
          aria-label={accessibleLabel}
          {...props}
        >
          <VisuallyHidden>
            <Box as="span" role="status" aria-live="polite">
              {SR_NOT_FOUND}
            </Box>
          </VisuallyHidden>
          <ProjectNotFound
            onBack={onNotFoundBack ?? (() => {})}
            onSearch={onSearch ?? (() => {})}
            size={baseSize}
          />
        </Box>
      );
    }

    // Ready state - all props should be defined
    if (!project || !sidebar || !header || !infoBar || !content) {
      // Fallback if props are missing in ready state (shouldn't happen in practice)
      return (
        <Box
          ref={ref}
          className={cn(PROJECT_DETAIL_PAGE_BASE_CLASSES, className)}
          data-testid={testId ?? 'project-detail-page'}
          data-state="error"
          data-size={baseSize}
          aria-label={DEFAULT_ERROR_TITLE}
          {...props}
        >
          <ProjectNotFound
            onBack={onNotFoundBack ?? (() => {})}
            onSearch={onSearch ?? (() => {})}
            size={baseSize}
          />
        </Box>
      );
    }

    return (
      <Box
        ref={ref}
        className={cn(PROJECT_DETAIL_PAGE_BASE_CLASSES, className)}
        data-testid={testId ?? 'project-detail-page'}
        data-state="ready"
        data-size={baseSize}
        data-task-count={taskCount}
        data-sidebar-collapsed={sidebarCollapsed}
        data-mobile-drawer-open={isMobileDrawerOpen}
        aria-label={accessibleLabel}
        {...props}
      >
        <VisuallyHidden>
          <Box as="span" role="status" aria-live="polite">
            {buildLoadedAnnouncement(project, taskCount)}
          </Box>
        </VisuallyHidden>
        <ProjectDetailLayout
          sidebarCollapsed={sidebarCollapsed ?? false}
          isMobileDrawerOpen={isMobileDrawerOpen}
          onMobileDrawerToggle={onMobileDrawerToggle}
          sidebar={
            <ProjectDetailSidebar
              projects={sidebar.projects}
              tasks={sidebar.tasks}
              projectId={sidebar.projectId}
              statusFilter={sidebar.statusFilter}
              isCollapsed={sidebar.isCollapsed}
              onSelectProject={sidebar.onSelectProject}
              onSelectTask={sidebar.onSelectTask}
              onNewTask={sidebar.onNewTask}
              onNewProject={sidebar.onNewProject}
              onStatusFilter={sidebar.onStatusFilter}
              onTaskStatusChange={sidebar.onTaskStatusChange}
              onSettingsClick={sidebar.onSettingsClick}
              onArchiveClick={sidebar.onArchiveClick}
              onToggleCollapse={sidebar.onToggleCollapse}
            />
          }
          header={
            <ProjectDetailHeader
              project={project}
              onSearch={header.onSearch}
              onNewTask={header.onNewTask}
              size={baseSize}
            />
          }
        >
          <Box className="flex h-full flex-col">
            <ProjectDetailInfoBar
              project={project}
              onBack={infoBar.onBack}
              onSettings={infoBar.onSettings}
              onNewTask={infoBar.onNewTask}
              size={baseSize}
            />
            <ProjectDetailContent
              isLoading={content.isLoading}
              tasks={content.tasks}
              onSelectTask={content.onSelectTask}
              onTaskStatusChange={content.onTaskStatusChange}
              onNewTask={content.onNewTask}
              error={content.error}
              onRetry={content.onRetry}
              size={baseSize}
            />
          </Box>

          {createTaskDialog && (
            <ProjectCreateTaskDialog
              isOpen={createTaskDialog.isOpen}
              taskTitle={createTaskDialog.taskTitle}
              taskDescription={createTaskDialog.taskDescription}
              selectedWorkflow={createTaskDialog.selectedWorkflow}
              workflows={createTaskDialog.workflows}
              isLoadingWorkflows={createTaskDialog.isLoadingWorkflows}
              isCreating={createTaskDialog.isCreating}
              error={createTaskDialog.error}
              onClose={createTaskDialog.onClose}
              onCreate={createTaskDialog.onCreate}
              onTitleChange={createTaskDialog.onTitleChange}
              onDescriptionChange={createTaskDialog.onDescriptionChange}
              onWorkflowSelect={createTaskDialog.onWorkflowSelect}
              size={baseSize}
            />
          )}
        </ProjectDetailLayout>
      </Box>
    );
  }
);

ProjectDetailPage.displayName = 'ProjectDetailPage';
