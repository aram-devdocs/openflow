/**
 * ProjectsListPageComponents - UI components for the Projects List page
 *
 * These components are pure UI without any data fetching or business logic.
 * All data and callbacks are passed as props from the useProjectsListSession hook.
 *
 * Accessibility:
 * - Uses primitives (Heading, Text, VisuallyHidden, Flex) for semantic HTML
 * - Proper heading hierarchy (h1 for page title, h2 for section)
 * - Loading states with aria-busy and role="status"
 * - Error states with role="alert" and aria-live="assertive"
 * - Touch targets ≥44px for mobile (WCAG 2.5.5)
 * - Focus rings with ring-offset for visibility
 * - Screen reader announcements for state changes
 * - Proper list semantics with role="list" and role="listitem"
 * - Keyboard navigation (Enter/Space to activate cards)
 *
 * Features:
 * - ProjectCard with accessible interactions
 * - ProjectsGrid with responsive layout
 * - Loading skeleton states
 * - Error state with retry
 * - Empty state with call-to-action
 * - forwardRef support for all components
 */

import type { Project } from '@openflow/generated';
import {
  type Breakpoint,
  Heading,
  type ResponsiveValue,
  Text,
  VisuallyHidden,
} from '@openflow/primitives';
import { cn } from '@openflow/utils';
import { AlertCircle, ChevronRight, FolderGit2, Plus, Settings } from 'lucide-react';
import { type HTMLAttributes, type ReactNode, forwardRef, useId } from 'react';
import { Button } from '../atoms/Button';
import { Icon } from '../atoms/Icon';
import { EmptyState } from '../molecules/EmptyState';
import { SkeletonProjectCard } from '../molecules/SkeletonProjectCard';
import { AppLayout } from '../templates/AppLayout';
import { ConfirmDialog, type ConfirmDialogProps } from './ConfirmDialog';
import { CreateProjectDialog } from './DashboardPageComponents';
import { Header } from './Header';

// ============================================================================
// Types
// ============================================================================

/** Breakpoint names for responsive values */
export type ProjectsListBreakpoint = Breakpoint;

/** Size variants for projects list components */
export type ProjectsListSize = 'sm' | 'md' | 'lg';

/** Props for ProjectsListLayout */
export interface ProjectsListLayoutProps {
  /** Number of projects */
  projectCount: number;
  /** Search callback */
  onSearch: () => void;
  /** Children components */
  children: ReactNode;
}

/** Props for ProjectsListHeader */
export interface ProjectsListHeaderProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  /** Callback to open create dialog */
  onCreateProject: () => void;
  /** Size variant for responsive sizing */
  size?: ResponsiveValue<ProjectsListSize>;
  /** Data test ID for automated testing */
  'data-testid'?: string;
}

/** Props for ProjectsListLoadingSkeleton */
export interface ProjectsListLoadingSkeletonProps
  extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  /** Number of skeleton cards to show */
  count?: number;
  /** Size variant for responsive sizing */
  size?: ResponsiveValue<ProjectsListSize>;
  /** Data test ID for automated testing */
  'data-testid'?: string;
}

/** Props for ProjectsListEmptyState */
export interface ProjectsListEmptyStateProps
  extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  /** Callback to create project */
  onCreateProject: () => void;
  /** Size variant for responsive sizing */
  size?: ResponsiveValue<ProjectsListSize>;
  /** Data test ID for automated testing */
  'data-testid'?: string;
}

/** Props for ProjectsListErrorState */
export interface ProjectsListErrorStateProps
  extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  /** Error message to display */
  message?: string;
  /** Callback to retry loading */
  onRetry?: () => void;
  /** Size variant for responsive sizing */
  size?: ResponsiveValue<ProjectsListSize>;
  /** Data test ID for automated testing */
  'data-testid'?: string;
  /** Custom error title */
  errorTitle?: string;
  /** Custom retry button label */
  retryLabel?: string;
}

/** Props for ProjectCard */
export interface ProjectCardProps extends Omit<HTMLAttributes<HTMLButtonElement>, 'children'> {
  /** Project ID for unique identification */
  projectId?: string;
  /** Project name */
  name: string;
  /** Git repository path */
  path: string;
  /** Project icon */
  icon: string;
  /** Callback when card is clicked */
  onSelect: () => void;
  /** Callback to open settings */
  onSettings: () => void;
  /** Size variant for responsive sizing */
  size?: ResponsiveValue<ProjectsListSize>;
  /** Data test ID for automated testing */
  'data-testid'?: string;
}

/** Props for ProjectsGrid */
export interface ProjectsGridProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  /** List of projects */
  projects: Project[];
  /** Callback when project is selected */
  onSelectProject: (projectId: string) => void;
  /** Callback to open project settings */
  onProjectSettings: (projectId: string) => void;
  /** Callback to delete project */
  onDeleteProject: (projectId: string, projectName: string) => void;
  /** Size variant for responsive sizing */
  size?: ResponsiveValue<ProjectsListSize>;
  /** Data test ID for automated testing */
  'data-testid'?: string;
  /** Accessible label for the grid */
  gridLabel?: string;
}

/** Props for ProjectsListContent */
export interface ProjectsListContentProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
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
  /** Error message if loading failed */
  error?: string | null;
  /** Callback to retry loading */
  onRetry?: () => void;
  /** Size variant for responsive sizing */
  size?: ResponsiveValue<ProjectsListSize>;
  /** Data test ID for automated testing */
  'data-testid'?: string;
}

/** Props for ProjectsListCreateDialog */
export interface ProjectsListCreateDialogProps {
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

/** Props for ProjectsListConfirmDialog */
export interface ProjectsListConfirmDialogProps {
  /** Confirm dialog props from useConfirmDialog hook */
  dialogProps: ConfirmDialogProps;
}

// ============================================================================
// Constants
// ============================================================================

/** Default labels */
export const DEFAULT_PAGE_TITLE = 'All Projects';
export const DEFAULT_NEW_PROJECT_LABEL = 'New Project';
export const DEFAULT_EMPTY_TITLE = 'No projects yet';
export const DEFAULT_EMPTY_DESCRIPTION =
  'Get started by creating your first project. Projects link to your local git repositories.';
export const DEFAULT_CREATE_PROJECT_LABEL = 'Create Project';
export const DEFAULT_ERROR_TITLE = 'Failed to load projects';
export const DEFAULT_ERROR_RETRY_LABEL = 'Retry';
export const DEFAULT_GRID_LABEL = 'Projects list';
export const DEFAULT_SKELETON_COUNT = 8;

/** Screen reader announcements */
export const SR_LOADING = 'Loading projects...';
export const SR_ERROR = 'Error loading projects';
export const SR_EMPTY = 'No projects. Create a new project to get started.';
export const SR_PROJECTS_LOADED = 'Projects loaded';
export const SR_PROJECT_COUNT_TEMPLATE = '{count} project{s}';
export const SR_SETTINGS_LABEL = 'Open settings for {name}';
export const SR_PROJECT_CARD_LABEL = 'Project: {name}, Path: {path}. Press Enter to open.';

/** Size class constants */
export const HEADER_MARGIN_CLASSES: Record<ProjectsListSize, string> = {
  sm: 'mb-4',
  md: 'mb-6',
  lg: 'mb-8',
};

export const HEADER_TITLE_SIZE_MAP: Record<ProjectsListSize, 'lg' | 'xl' | '2xl'> = {
  sm: 'lg',
  md: 'xl',
  lg: '2xl',
};

export const GRID_GAP_CLASSES: Record<ProjectsListSize, string> = {
  sm: 'gap-3',
  md: 'gap-4',
  lg: 'gap-5',
};

export const CARD_PADDING_CLASSES: Record<ProjectsListSize, string> = {
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-5',
};

export const CARD_ICON_CONTAINER_CLASSES: Record<ProjectsListSize, string> = {
  sm: 'h-8 w-8 mb-2',
  md: 'h-10 w-10 mb-3',
  lg: 'h-12 w-12 mb-4',
};

export const CARD_ICON_SIZE_CLASSES: Record<ProjectsListSize, string> = {
  sm: 'h-4 w-4',
  md: 'h-5 w-5',
  lg: 'h-6 w-6',
};

export const CARD_TITLE_SIZE_MAP: Record<ProjectsListSize, 'sm' | 'base' | 'lg'> = {
  sm: 'sm',
  md: 'base',
  lg: 'lg',
};

export const BUTTON_SIZE_MAP: Record<ProjectsListSize, 'sm' | 'md' | 'lg'> = {
  sm: 'sm',
  md: 'md',
  lg: 'lg',
};

/** Base class constants */
export const HEADER_CONTAINER_CLASSES = 'flex items-center justify-between';

export const GRID_BASE_CLASSES = 'grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4';

export const CARD_BASE_CLASSES =
  'group relative flex flex-col rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--card))] text-left motion-safe:transition-all hover:border-[rgb(var(--primary))]/50 hover:bg-[rgb(var(--muted))] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--ring))] focus-visible:ring-offset-2 min-h-[44px]';

export const CARD_ICON_CONTAINER_BASE_CLASSES =
  'flex items-center justify-center rounded-lg bg-[rgb(var(--primary))]/10';

export const CARD_SETTINGS_BUTTON_CLASSES =
  'rounded p-1 text-[rgb(var(--muted-foreground))] hover:bg-[rgb(var(--muted))] hover:text-[rgb(var(--foreground))] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--ring))] focus-visible:ring-offset-2 min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0 flex items-center justify-center';

export const CARD_ACTIONS_CONTAINER_CLASSES =
  'absolute right-2 top-2 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100';

export const CARD_CHEVRON_CLASSES =
  'absolute bottom-4 right-4 h-4 w-4 text-[rgb(var(--muted-foreground))] opacity-0 transition-opacity group-hover:opacity-100';

export const LOADING_CONTAINER_CLASSES = 'flex-1';

export const ERROR_STATE_CLASSES =
  'flex flex-1 flex-col items-center justify-center p-8 text-center';

export const ERROR_ICON_CONTAINER_CLASSES =
  'flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive mb-4';

export const SKELETON_GRID_CLASSES = 'grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4';

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Get the base size from a responsive value
 */
export function getBaseSize(size: ResponsiveValue<ProjectsListSize>): ProjectsListSize {
  if (typeof size === 'string') {
    return size;
  }
  return size.base ?? 'md';
}

/**
 * Generate responsive classes from a size value
 */
export function getResponsiveSizeClasses(
  size: ResponsiveValue<ProjectsListSize>,
  classMap: Record<ProjectsListSize, string>
): string {
  if (typeof size === 'string') {
    return classMap[size];
  }

  const classes: string[] = [];
  const breakpointOrder: ProjectsListBreakpoint[] = ['base', 'sm', 'md', 'lg', 'xl', '2xl'];

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
 * Build accessible label for project card
 */
export function buildProjectCardAccessibleLabel(name: string, path: string): string {
  return SR_PROJECT_CARD_LABEL.replace('{name}', name).replace('{path}', path);
}

/**
 * Build settings button accessible label
 */
export function buildSettingsAccessibleLabel(name: string): string {
  return SR_SETTINGS_LABEL.replace('{name}', name);
}

/**
 * Build project count announcement
 */
export function buildProjectCountAnnouncement(count: number): string {
  return SR_PROJECT_COUNT_TEMPLATE.replace('{count}', String(count)).replace(
    '{s}',
    count === 1 ? '' : 's'
  );
}

// ============================================================================
// Layout Component
// ============================================================================

/**
 * ProjectsListLayout - Main layout wrapper for the projects list page
 */
export function ProjectsListLayout({ projectCount, onSearch, children }: ProjectsListLayoutProps) {
  return (
    <AppLayout
      sidebarCollapsed={true}
      sidebar={null}
      header={
        <Header
          title="Projects"
          subtitle={`${projectCount} project${projectCount === 1 ? '' : 's'}`}
          onSearch={onSearch}
        />
      }
    >
      {children}
    </AppLayout>
  );
}

// ============================================================================
// Header Component
// ============================================================================

/**
 * ProjectsListHeader - Header section with title and create button
 */
export const ProjectsListHeader = forwardRef<HTMLDivElement, ProjectsListHeaderProps>(
  function ProjectsListHeader(
    { onCreateProject, size = 'md', className, 'data-testid': testId, ...props },
    ref
  ) {
    const baseSize = getBaseSize(size);
    const marginClasses = getResponsiveSizeClasses(size, HEADER_MARGIN_CLASSES);
    const titleSize = HEADER_TITLE_SIZE_MAP[baseSize];
    const buttonSize = BUTTON_SIZE_MAP[baseSize];

    return (
      <div
        ref={ref}
        className={cn(HEADER_CONTAINER_CLASSES, marginClasses, className)}
        data-testid={testId}
        data-size={baseSize}
        {...props}
      >
        <Heading level={1} size={titleSize} weight="semibold">
          {DEFAULT_PAGE_TITLE}
        </Heading>
        <Button
          variant="primary"
          size={buttonSize}
          onClick={onCreateProject}
          icon={<Icon icon={Plus} size="sm" aria-hidden="true" />}
          aria-label={DEFAULT_NEW_PROJECT_LABEL}
          data-testid={testId ? `${testId}-create-button` : undefined}
        >
          {DEFAULT_NEW_PROJECT_LABEL}
        </Button>
      </div>
    );
  }
);

// ============================================================================
// Loading Component
// ============================================================================

/**
 * ProjectsListLoadingSkeleton - Loading skeleton for projects grid
 */
export const ProjectsListLoadingSkeleton = forwardRef<
  HTMLDivElement,
  ProjectsListLoadingSkeletonProps
>(function ProjectsListLoadingSkeleton(
  { count = DEFAULT_SKELETON_COUNT, size = 'md', className, 'data-testid': testId, ...props },
  ref
) {
  const baseSize = getBaseSize(size);

  return (
    <div
      ref={ref}
      className={cn(LOADING_CONTAINER_CLASSES, className)}
      role="status"
      aria-busy="true"
      aria-label={SR_LOADING}
      data-testid={testId}
      data-size={baseSize}
      data-count={count}
      {...props}
    >
      <VisuallyHidden>
        <span aria-live="polite">{SR_LOADING}</span>
      </VisuallyHidden>
      <div className={SKELETON_GRID_CLASSES} aria-hidden="true">
        {Array.from({ length: count }).map((_, i) => (
          <SkeletonProjectCard key={`skeleton-project-card-${i}`} />
        ))}
      </div>
    </div>
  );
});

// ============================================================================
// Empty State Component
// ============================================================================

/**
 * ProjectsListEmptyState - Empty state when no projects exist
 */
export const ProjectsListEmptyState = forwardRef<HTMLDivElement, ProjectsListEmptyStateProps>(
  function ProjectsListEmptyState(
    { onCreateProject, size = 'md', className, 'data-testid': testId, ...props },
    ref
  ) {
    const baseSize = getBaseSize(size);

    return (
      <div
        ref={ref}
        className={cn('flex flex-1 flex-col', className)}
        role="region"
        aria-label="Empty projects"
        data-testid={testId}
        data-size={baseSize}
        {...props}
      >
        <VisuallyHidden>
          <span role="status" aria-live="polite">
            {SR_EMPTY}
          </span>
        </VisuallyHidden>
        <EmptyState
          icon={FolderGit2}
          title={DEFAULT_EMPTY_TITLE}
          description={DEFAULT_EMPTY_DESCRIPTION}
          action={{
            label: DEFAULT_CREATE_PROJECT_LABEL,
            onClick: onCreateProject,
            'aria-label': DEFAULT_CREATE_PROJECT_LABEL,
          }}
          size={baseSize}
          className="flex-1"
        />
      </div>
    );
  }
);

// ============================================================================
// Error State Component
// ============================================================================

/**
 * ProjectsListErrorState - Error state when loading fails
 */
export const ProjectsListErrorState = forwardRef<HTMLDivElement, ProjectsListErrorStateProps>(
  function ProjectsListErrorState(
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
          <span>{SR_ERROR}</span>
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
        {onRetry && (
          <Button
            variant="primary"
            size={BUTTON_SIZE_MAP[baseSize]}
            onClick={onRetry}
            aria-label={retryLabel}
          >
            {retryLabel}
          </Button>
        )}
      </div>
    );
  }
);

// ============================================================================
// Project Card Component
// ============================================================================

/**
 * ProjectCard - Individual project card with icon, name, path, and actions
 */
export const ProjectCard = forwardRef<HTMLButtonElement, ProjectCardProps>(function ProjectCard(
  {
    projectId,
    name,
    path,
    icon,
    onSelect,
    onSettings,
    size = 'md',
    className,
    'data-testid': testId,
    ...props
  },
  ref
) {
  const baseSize = getBaseSize(size);
  const paddingClasses = getResponsiveSizeClasses(size, CARD_PADDING_CLASSES);
  const iconContainerClasses = getResponsiveSizeClasses(size, CARD_ICON_CONTAINER_CLASSES);
  const iconSizeClasses = getResponsiveSizeClasses(size, CARD_ICON_SIZE_CLASSES);
  const titleSize = CARD_TITLE_SIZE_MAP[baseSize];
  const settingsId = useId();
  const accessibleLabel = buildProjectCardAccessibleLabel(name, path);

  return (
    <button
      ref={ref}
      type="button"
      onClick={onSelect}
      className={cn(CARD_BASE_CLASSES, paddingClasses, className)}
      aria-label={accessibleLabel}
      data-testid={testId}
      data-project-id={projectId}
      data-size={baseSize}
      {...props}
    >
      {/* Icon */}
      <div
        className={cn(CARD_ICON_CONTAINER_BASE_CLASSES, iconContainerClasses)}
        aria-hidden="true"
      >
        {icon === 'folder' ? (
          <FolderGit2 className={cn('text-[rgb(var(--primary))]', iconSizeClasses)} />
        ) : (
          <span className={cn('text-lg', iconSizeClasses)}>{icon}</span>
        )}
      </div>

      {/* Name */}
      <Text as="span" size={titleSize} weight="medium" className="text-[rgb(var(--foreground))]">
        {name}
      </Text>

      {/* Path */}
      <Text
        as="span"
        size="xs"
        color="muted-foreground"
        truncate
        className="mt-1"
        aria-label={`Repository path: ${path}`}
      >
        {path}
      </Text>

      {/* Actions */}
      <div className={CARD_ACTIONS_CONTAINER_CLASSES} role="group" aria-label="Project actions">
        <button
          id={settingsId}
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onSettings();
          }}
          className={CARD_SETTINGS_BUTTON_CLASSES}
          aria-label={buildSettingsAccessibleLabel(name)}
          data-testid={testId ? `${testId}-settings` : undefined}
        >
          <Settings className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>

      {/* Chevron indicator */}
      <ChevronRight className={CARD_CHEVRON_CLASSES} aria-hidden="true" />
    </button>
  );
});

// ============================================================================
// Projects Grid Component
// ============================================================================

/**
 * ProjectsGrid - Grid of project cards
 */
export const ProjectsGrid = forwardRef<HTMLDivElement, ProjectsGridProps>(function ProjectsGrid(
  {
    projects,
    onSelectProject,
    onProjectSettings,
    size = 'md',
    className,
    'data-testid': testId,
    gridLabel = DEFAULT_GRID_LABEL,
    ...props
  },
  ref
) {
  const baseSize = getBaseSize(size);
  const gapClasses = getResponsiveSizeClasses(size, GRID_GAP_CLASSES);
  const listId = useId();
  const headingId = useId();

  return (
    <div
      ref={ref}
      className={cn('flex-1', className)}
      data-testid={testId}
      data-size={baseSize}
      data-project-count={projects.length}
      role="region"
      aria-labelledby={headingId}
      {...props}
    >
      <VisuallyHidden>
        <h2 id={headingId}>{gridLabel}</h2>
        <span role="status" aria-live="polite">
          {buildProjectCountAnnouncement(projects.length)}
        </span>
      </VisuallyHidden>
      <ul
        id={listId}
        role="list"
        aria-label={gridLabel}
        className={cn(GRID_BASE_CLASSES, gapClasses)}
      >
        {projects.map((project) => (
          <li key={project.id} role="listitem">
            <ProjectCard
              projectId={project.id}
              name={project.name}
              path={project.gitRepoPath}
              icon={project.icon}
              onSelect={() => onSelectProject(project.id)}
              onSettings={() => onProjectSettings(project.id)}
              size={size}
              data-testid={testId ? `${testId}-card-${project.id}` : undefined}
            />
          </li>
        ))}
      </ul>
    </div>
  );
});

// ============================================================================
// Content Component
// ============================================================================

/**
 * ProjectsListContent - Main content area with conditional rendering
 */
export const ProjectsListContent = forwardRef<HTMLDivElement, ProjectsListContentProps>(
  function ProjectsListContent(
    {
      isLoading,
      projects,
      onCreateProject,
      onSelectProject,
      onProjectSettings,
      onDeleteProject,
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

    // Error state
    if (error) {
      return (
        <ProjectsListErrorState
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

    // Loading state
    if (isLoading) {
      return (
        <ProjectsListLoadingSkeleton
          ref={ref}
          size={size}
          className={className}
          data-testid={testId ? `${testId}-loading` : undefined}
          {...props}
        />
      );
    }

    // Empty state
    if (projects.length === 0) {
      return (
        <ProjectsListEmptyState
          ref={ref}
          onCreateProject={onCreateProject}
          size={size}
          className={className}
          data-testid={testId ? `${testId}-empty` : undefined}
          {...props}
        />
      );
    }

    // Projects grid
    return (
      <div
        ref={ref}
        className={cn('flex-1', className)}
        data-testid={testId}
        data-size={baseSize}
        {...props}
      >
        <VisuallyHidden>
          <span role="status" aria-live="polite">
            {SR_PROJECTS_LOADED}. {buildProjectCountAnnouncement(projects.length)}
          </span>
        </VisuallyHidden>
        <ProjectsGrid
          projects={projects}
          onSelectProject={onSelectProject}
          onProjectSettings={onProjectSettings}
          onDeleteProject={onDeleteProject}
          size={size}
          data-testid={testId ? `${testId}-grid` : undefined}
        />
      </div>
    );
  }
);

// ============================================================================
// Dialog Components
// ============================================================================

/**
 * ProjectsListCreateDialog - Wrapper for create project dialog
 */
export function ProjectsListCreateDialog({
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
}: ProjectsListCreateDialogProps) {
  return (
    <CreateProjectDialog
      isOpen={isOpen}
      onClose={onClose}
      projectName={projectName}
      onProjectNameChange={onProjectNameChange}
      projectPath={projectPath}
      onProjectPathChange={onProjectPathChange}
      onBrowseFolder={onBrowseFolder}
      onCreate={onCreate}
      isPending={isPending}
      error={error}
    />
  );
}

/**
 * ProjectsListConfirmDialog - Wrapper for confirm dialog
 */
export function ProjectsListConfirmDialog({ dialogProps }: ProjectsListConfirmDialogProps) {
  return <ConfirmDialog {...dialogProps} />;
}
