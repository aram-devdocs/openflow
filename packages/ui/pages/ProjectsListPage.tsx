/**
 * ProjectsListPage - Stateless Page Component for the Projects List
 *
 * This is a top-level stateless component that composes the entire projects list view.
 * It receives all required data and callbacks via props, making it fully
 * testable in Storybook with mocked data representing different page states.
 *
 * Accessibility Features:
 * - Proper page landmark structure with main role
 * - h1 heading for page title with proper hierarchy (via ProjectsListHeader)
 * - Screen reader announcements for loading, error, and state changes
 * - Focus management with forwardRef support
 * - Responsive layout for all screen sizes
 * - Touch targets ≥44px for mobile (WCAG 2.5.5)
 * - Error boundary integration for graceful error handling
 * - Responsive grid for project cards
 *
 * The component composes:
 * - ProjectsListLayout (page structure with header)
 * - ProjectsListHeader (title and create button)
 * - ProjectsListContent (loading/empty/grid states)
 * - ProjectsListCreateDialog (create project dialog)
 * - ProjectsListConfirmDialog (delete confirmation)
 *
 * @module pages/ProjectsListPage
 */

import type { Project } from '@openflow/generated';
import {
  Box,
  Flex,
  Heading,
  type ResponsiveValue,
  Text,
  VisuallyHidden,
} from '@openflow/primitives';
import { cn } from '@openflow/utils';
import { AlertTriangle, FolderOpen, RefreshCw } from 'lucide-react';
import { forwardRef, useId } from 'react';
import { Button } from '../atoms/Button';
import { Icon } from '../atoms/Icon';
import { Skeleton } from '../atoms/Skeleton';
import type { ConfirmDialogProps } from '../organisms/ConfirmDialog';
import {
  ProjectsListConfirmDialog,
  ProjectsListContent,
  ProjectsListCreateDialog,
  ProjectsListHeader,
  ProjectsListLayout,
} from '../organisms/ProjectsListPageComponents';

// ============================================================================
// Types
// ============================================================================

/** Size variants for responsive layout */
export type ProjectsListPageSize = 'sm' | 'md' | 'lg';

/** Breakpoints supported for responsive sizing */
export type ProjectsListPageBreakpoint = 'base' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

/** Props for the header section */
export interface ProjectsListPageHeaderProps {
  /** Callback to open create dialog */
  onCreateProject: () => void;
}

/** Props for the content section */
export interface ProjectsListPageContentProps {
  /** Loading state */
  isLoading: boolean;
  /** List of projects */
  projects: Project[];
  /** Callback to create project */
  onCreateProject: () => void;
  /** Callback when project is selected */
  onSelectProject: (projectId: string) => void;
  /** Callback to open project settings */
  onProjectSettings: (projectId: string) => void;
  /** Callback to delete project */
  onDeleteProject: (projectId: string, projectName: string) => void;
}

/** Props for the create project dialog */
export interface ProjectsListPageCreateDialogProps {
  /** Whether dialog is open */
  isOpen: boolean;
  /** Callback to close dialog */
  onClose: () => void;
  /** Project name value */
  projectName: string;
  /** Project name change callback */
  onProjectNameChange: (name: string) => void;
  /** Project path value */
  projectPath: string;
  /** Project path change callback */
  onProjectPathChange: (path: string) => void;
  /** Callback to browse for folder */
  onBrowseFolder: () => Promise<void>;
  /** Callback to create project */
  onCreate: () => void;
  /** Whether creation is pending */
  isPending: boolean;
  /** Error message */
  error: string | null;
}

/** Error state props for the page */
export interface ProjectsListPageErrorProps {
  /** The error that occurred */
  error: Error;
  /** Callback to retry the failed operation */
  onRetry: () => void;
}

/** Props for ProjectsListPageSkeleton */
export interface ProjectsListPageSkeletonProps {
  /** Number of skeleton project cards to show */
  projectCount?: number;
  /** Responsive sizing */
  size?: ResponsiveValue<ProjectsListPageSize>;
  /** Data attributes for testing */
  'data-testid'?: string;
}

/** Props for ProjectsListPageError */
export interface ProjectsListPageErrorStateProps {
  /** The error that occurred */
  error: Error;
  /** Retry handler */
  onRetry: () => void;
  /** Responsive sizing */
  size?: ResponsiveValue<ProjectsListPageSize>;
  /** Data attributes for testing */
  'data-testid'?: string;
}

/**
 * Complete props for the ProjectsListPage component.
 *
 * This interface defines all data and callbacks needed to render the projects list.
 * The route component is responsible for providing these props from hooks.
 */
export interface ProjectsListPageProps {
  /** Page state: 'loading' | 'error' | 'ready' */
  state: 'loading' | 'error' | 'ready';

  /** Error for error state */
  error?: Error | null;

  /** Retry callback for error state */
  onRetry?: () => void;

  // The following props are only required when state is 'ready'

  /** Number of projects (for subtitle) */
  projectCount?: number;

  /** Callback for search action */
  onSearch?: () => void;

  /** Header props */
  header?: ProjectsListPageHeaderProps;

  /** Content props */
  content?: ProjectsListPageContentProps;

  /** Create dialog props */
  createDialog?: ProjectsListPageCreateDialogProps;

  /** Confirm dialog props for delete actions */
  confirmDialog?: ConfirmDialogProps;

  /** Responsive sizing */
  size?: ResponsiveValue<ProjectsListPageSize>;

  /** Custom aria-label for the page */
  'aria-label'?: string;

  /** Data attributes for testing */
  'data-testid'?: string;
}

// ============================================================================
// Constants
// ============================================================================

/** Default skeleton project count */
export const DEFAULT_SKELETON_PROJECT_COUNT = 6;

/** Default page size */
export const DEFAULT_PAGE_SIZE: ProjectsListPageSize = 'md';

/** Default page label */
export const DEFAULT_PAGE_LABEL = 'Projects list';

/** Default error title */
export const DEFAULT_ERROR_TITLE = 'Failed to load projects';

/** Default error description */
export const DEFAULT_ERROR_DESCRIPTION = 'Something went wrong while loading your projects.';

/** Default retry button label */
export const DEFAULT_RETRY_LABEL = 'Try Again';

/** Screen reader announcement for loading state */
export const SR_LOADING = 'Loading projects. Please wait.';

/** Screen reader announcement for error state */
export const SR_ERROR_PREFIX = 'Error loading projects:';

/** Screen reader announcement for empty state */
export const SR_EMPTY = 'No projects found. Create your first project to get started.';

/** Screen reader announcement for loaded state */
export const SR_LOADED_PREFIX = 'Projects loaded.';

/** Page container base classes */
export const PROJECTS_LIST_PAGE_BASE_CLASSES = 'relative flex flex-col h-full w-full';

/** Error container classes */
export const PROJECTS_LIST_PAGE_ERROR_CLASSES = [
  'flex flex-col items-center justify-center gap-4 p-6',
  'text-center min-h-[300px]',
].join(' ');

/** Skeleton container classes */
export const PROJECTS_LIST_PAGE_SKELETON_CLASSES = 'flex flex-col h-full';

/** Skeleton header classes */
export const PROJECTS_LIST_PAGE_SKELETON_HEADER_CLASSES =
  'border-b border-[rgb(var(--border))] p-4 md:p-6';

/** Skeleton grid classes */
export const PROJECTS_LIST_PAGE_SKELETON_GRID_CLASSES = [
  'flex-1 p-4 md:p-6',
  'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4',
  'auto-rows-max overflow-auto',
].join(' ');

/** Skeleton card classes */
export const PROJECTS_LIST_PAGE_SKELETON_CARD_CLASSES = [
  'rounded-lg border border-[rgb(var(--border))]',
  'bg-[rgb(var(--card))] p-4',
  'flex flex-col gap-3',
].join(' ');

/** Size-based container padding */
export const PAGE_SIZE_PADDING: Record<ProjectsListPageSize, string> = {
  sm: 'p-3',
  md: 'p-4 md:p-6',
  lg: 'p-6 md:p-8',
};

/** Size-based gap classes */
export const PAGE_SIZE_GAP: Record<ProjectsListPageSize, string> = {
  sm: 'gap-3',
  md: 'gap-4',
  lg: 'gap-6',
};

/** Size-based icon dimensions */
export const SKELETON_ICON_DIMENSIONS: Record<ProjectsListPageSize, number> = {
  sm: 32,
  md: 40,
  lg: 48,
};

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Resolves a ResponsiveValue to its base size
 */
export function getBaseSize(
  size: ResponsiveValue<ProjectsListPageSize> | undefined
): ProjectsListPageSize {
  if (!size) return DEFAULT_PAGE_SIZE;
  if (typeof size === 'string') return size;
  return size.base ?? DEFAULT_PAGE_SIZE;
}

/**
 * Generates responsive Tailwind classes for the size prop
 */
export function getResponsiveSizeClasses(
  size: ResponsiveValue<ProjectsListPageSize> | undefined,
  classMap: Record<ProjectsListPageSize, string>
): string {
  if (!size) return classMap[DEFAULT_PAGE_SIZE];

  if (typeof size === 'string') {
    return classMap[size];
  }

  const classes: string[] = [];
  const breakpointPrefixes: Record<Exclude<ProjectsListPageBreakpoint, 'base'>, string> = {
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
    const bp = breakpoint as Exclude<ProjectsListPageBreakpoint, 'base'>;
    if (size[bp]) {
      const sizeClasses = classMap[size[bp] as ProjectsListPageSize];
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
 * Get skeleton icon dimensions for a size
 */
export function getSkeletonIconDimensions(
  size: ResponsiveValue<ProjectsListPageSize> | undefined
): number {
  const baseSize = getBaseSize(size);
  return SKELETON_ICON_DIMENSIONS[baseSize];
}

/**
 * Build screen reader announcement for loaded state
 */
export function buildLoadedAnnouncement(projectCount: number): string {
  if (projectCount === 0) {
    return SR_EMPTY;
  }

  const projectLabel = projectCount === 1 ? 'project' : 'projects';
  return `${SR_LOADED_PREFIX} ${projectCount} ${projectLabel}.`;
}

/**
 * Build accessible label for the page
 */
export function buildPageAccessibleLabel(
  state: 'loading' | 'error' | 'ready',
  projectCount?: number
): string {
  const baseLabel = DEFAULT_PAGE_LABEL;

  switch (state) {
    case 'loading':
      return `${baseLabel} - Loading`;
    case 'error':
      return `${baseLabel} - Error loading`;
    case 'ready':
      if (projectCount !== undefined && projectCount > 0) {
        const projectLabel = projectCount === 1 ? 'project' : 'projects';
        return `${baseLabel} - ${projectCount} ${projectLabel}`;
      }
      return baseLabel;
  }
}

// ============================================================================
// Sub-Components
// ============================================================================

/**
 * Loading skeleton for the projects list page
 */
export const ProjectsListPageSkeleton = forwardRef<HTMLDivElement, ProjectsListPageSkeletonProps>(
  function ProjectsListPageSkeleton(
    { projectCount = DEFAULT_SKELETON_PROJECT_COUNT, size, 'data-testid': testId },
    ref
  ) {
    const iconSize = getSkeletonIconDimensions(size);

    // Generate project card skeletons
    const projects = Array.from({ length: projectCount }, (_, i) => ({
      id: `skeleton-project-${i}`,
    }));

    return (
      <Box
        ref={ref}
        className={PROJECTS_LIST_PAGE_SKELETON_CLASSES}
        aria-hidden={true}
        role="presentation"
        data-testid={testId ?? 'projects-list-page-skeleton'}
        data-count={projectCount}
      >
        {/* Screen reader loading announcement */}
        <VisuallyHidden>
          <Box role="status" aria-live="polite">
            {SR_LOADING}
          </Box>
        </VisuallyHidden>

        {/* Header skeleton */}
        <Box className={PROJECTS_LIST_PAGE_SKELETON_HEADER_CLASSES}>
          <Flex direction="row" justify="between" align="center">
            <Flex direction="column" gap="2">
              <Skeleton width={180} height={28} variant="text" />
              <Skeleton width={120} height={16} variant="text" />
            </Flex>
            <Skeleton width={140} height={40} />
          </Flex>
        </Box>

        {/* Grid skeleton - project cards */}
        <Box className={PROJECTS_LIST_PAGE_SKELETON_GRID_CLASSES}>
          {projects.map((project) => (
            <Box key={project.id} className={PROJECTS_LIST_PAGE_SKELETON_CARD_CLASSES}>
              {/* Icon */}
              <Skeleton width={iconSize} height={iconSize} variant="circular" />
              {/* Title */}
              <Skeleton width="70%" height={20} variant="text" />
              {/* Path */}
              <Skeleton width="100%" height={14} variant="text" />
            </Box>
          ))}
        </Box>
      </Box>
    );
  }
);

/**
 * Error state for the projects list page
 */
export const ProjectsListPageError = forwardRef<HTMLDivElement, ProjectsListPageErrorStateProps>(
  function ProjectsListPageError({ error, onRetry, size, 'data-testid': testId }, ref) {
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
          PROJECTS_LIST_PAGE_ERROR_CLASSES,
          getResponsiveSizeClasses(size, PAGE_SIZE_PADDING)
        )}
        data-testid={testId ?? 'projects-list-page-error'}
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

        <Heading id={headingId} level={1} size="lg" className="text-[rgb(var(--foreground))]">
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
 * ProjectsListPage - Complete stateless projects list page component.
 *
 * This component receives all data and callbacks via props. It is purely
 * presentational, making it fully testable in Storybook with mocked data.
 *
 * Features:
 * - Page-level loading skeleton grid
 * - Error state with retry button
 * - Empty state handling (delegated to ProjectsListContent)
 * - Proper heading hierarchy (h1 for title via ProjectsListHeader)
 * - Screen reader announcements for state changes
 * - forwardRef support for focus management
 * - Responsive grid layout for project cards
 * - Touch targets ≥44px (WCAG 2.5.5)
 *
 * @example
 * ```tsx
 * // In route component
 * function ProjectsRoute() {
 *   const navigate = useNavigate();
 *   const toast = useToast();
 *
 *   const session = useProjectsListSession({ navigate, toast });
 *
 *   // Loading state
 *   if (session.isLoading) {
 *     return <ProjectsListPage state="loading" />;
 *   }
 *
 *   // Error state
 *   if (session.error) {
 *     return (
 *       <ProjectsListPage
 *         state="error"
 *         error={session.error}
 *         onRetry={session.refetch}
 *       />
 *     );
 *   }
 *
 *   // Ready state
 *   return (
 *     <ProjectsListPage
 *       state="ready"
 *       projectCount={session.projects.length}
 *       onSearch={session.handleSearch}
 *       header={{
 *         onCreateProject: session.handleOpenCreateDialog,
 *       }}
 *       content={{
 *         isLoading: false,
 *         projects: session.projects,
 *         onCreateProject: session.handleOpenCreateDialog,
 *         onSelectProject: session.handleSelectProject,
 *         onProjectSettings: session.handleProjectSettings,
 *         onDeleteProject: session.handleDeleteProject,
 *       }}
 *       createDialog={{
 *         isOpen: session.isCreateDialogOpen,
 *         onClose: session.handleCloseCreateDialog,
 *         projectName: session.newProjectName,
 *         onProjectNameChange: session.handleProjectNameChange,
 *         projectPath: session.newProjectPath,
 *         onProjectPathChange: session.handleProjectPathChange,
 *         onBrowseFolder: session.handleBrowseFolder,
 *         onCreate: session.handleCreateProject,
 *         isPending: session.isCreating,
 *         error: session.createError,
 *       }}
 *       confirmDialog={session.confirmDialogProps}
 *     />
 *   );
 * }
 * ```
 */
export const ProjectsListPage = forwardRef<HTMLDivElement, ProjectsListPageProps>(
  function ProjectsListPage(
    {
      state,
      error,
      onRetry,
      projectCount = 0,
      onSearch,
      header,
      content,
      createDialog,
      confirmDialog,
      size,
      'aria-label': ariaLabel,
      'data-testid': testId,
    },
    ref
  ) {
    // Compute accessible label
    const computedAriaLabel = ariaLabel ?? buildPageAccessibleLabel(state, projectCount);

    // Calculate if we have projects for announcements
    const hasProjects = projectCount > 0;

    // Loading state
    if (state === 'loading') {
      return (
        <Box
          ref={ref}
          className={PROJECTS_LIST_PAGE_BASE_CLASSES}
          aria-label={computedAriaLabel}
          aria-busy={true}
          data-testid={testId ?? 'projects-list-page'}
          data-state="loading"
        >
          <ProjectsListPageSkeleton size={size} />
        </Box>
      );
    }

    // Error state
    if (state === 'error' && error && onRetry) {
      return (
        <Box
          ref={ref}
          className={PROJECTS_LIST_PAGE_BASE_CLASSES}
          aria-label={computedAriaLabel}
          data-testid={testId ?? 'projects-list-page'}
          data-state="error"
        >
          <ProjectsListPageError error={error} onRetry={onRetry} size={size} />
        </Box>
      );
    }

    // Ready state - validate required props
    if (!header || !content || !createDialog || !confirmDialog) {
      // Fallback for missing props - show empty page with error
      return (
        <Box
          ref={ref}
          className={PROJECTS_LIST_PAGE_BASE_CLASSES}
          aria-label={computedAriaLabel}
          data-testid={testId ?? 'projects-list-page'}
          data-state="error"
        >
          <Box className={PROJECTS_LIST_PAGE_ERROR_CLASSES}>
            <Icon
              icon={FolderOpen}
              size="xl"
              className="text-[rgb(var(--muted-foreground))]"
              aria-hidden={true}
            />
            <Heading level={1} size="lg" className="text-[rgb(var(--foreground))]">
              Unable to load projects
            </Heading>
            <Text color="muted-foreground">Required page configuration is missing.</Text>
          </Box>
        </Box>
      );
    }

    return (
      <Box
        ref={ref}
        className={PROJECTS_LIST_PAGE_BASE_CLASSES}
        aria-label={computedAriaLabel}
        data-testid={testId ?? 'projects-list-page'}
        data-state={hasProjects ? 'ready' : 'empty'}
        data-project-count={projectCount}
      >
        {/* Screen reader announcements */}
        <VisuallyHidden>
          <Box role="status" aria-live="polite" aria-atomic="true">
            {buildLoadedAnnouncement(projectCount)}
          </Box>
        </VisuallyHidden>

        <ProjectsListLayout projectCount={projectCount} onSearch={onSearch ?? (() => {})}>
          <Box className="flex h-full flex-col p-4 md:p-6">
            <ProjectsListHeader onCreateProject={header.onCreateProject} />

            <ProjectsListContent
              isLoading={content.isLoading}
              projects={content.projects}
              onCreateProject={content.onCreateProject}
              onSelectProject={content.onSelectProject}
              onProjectSettings={content.onProjectSettings}
              onDeleteProject={content.onDeleteProject}
            />
          </Box>

          <ProjectsListCreateDialog
            isOpen={createDialog.isOpen}
            onClose={createDialog.onClose}
            projectName={createDialog.projectName}
            onProjectNameChange={createDialog.onProjectNameChange}
            projectPath={createDialog.projectPath}
            onProjectPathChange={createDialog.onProjectPathChange}
            onBrowseFolder={createDialog.onBrowseFolder}
            onCreate={createDialog.onCreate}
            isPending={createDialog.isPending}
            error={createDialog.error}
          />

          <ProjectsListConfirmDialog dialogProps={confirmDialog} />
        </ProjectsListLayout>
      </Box>
    );
  }
);

ProjectsListPage.displayName = 'ProjectsListPage';
