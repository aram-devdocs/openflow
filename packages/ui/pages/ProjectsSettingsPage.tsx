/**
 * ProjectsSettingsPage - Stateless Page Component for Project Settings
 *
 * This is a top-level stateless component that composes the project settings view.
 * It receives all required data and callbacks via props, making it fully
 * testable in Storybook with mocked data representing different page states.
 *
 * Accessibility Features:
 * - Proper page landmark structure with region role
 * - Screen reader announcements for loading, error, and empty states
 * - Focus management with forwardRef support
 * - Responsive layout for all screen sizes
 * - WCAG 2.5.5 touch targets (≥44px) on interactive elements
 * - Proper ARIA attributes for form sections
 *
 * The component composes:
 * - ProjectSettingsLayout (main layout wrapper)
 * - ProjectSettingsSelector (project dropdown)
 * - ProjectSettingsForm (settings form with all sections)
 * - ProjectSettingsLoadingSkeleton (loading states)
 * - ProjectSettingsEmptyState (no projects state)
 * - ProjectSettingsErrorState (error state with retry)
 *
 * @module pages/ProjectsSettingsPage
 */

import type { Project } from '@openflow/generated';
import { Box, type ResponsiveValue, VisuallyHidden } from '@openflow/primitives';
import { cn } from '@openflow/utils';
import { forwardRef } from 'react';
import {
  type ProjectSettingsBreakpoint,
  ProjectSettingsEmptyState,
  ProjectSettingsErrorState,
  ProjectSettingsForm,
  type ProjectSettingsFormData,
  ProjectSettingsLayout,
  ProjectSettingsLoadingSkeleton,
  ProjectSettingsSelector,
  type ProjectSettingsSize,
} from '../organisms/ProjectSettingsPageComponents';

// ============================================================================
// Types
// ============================================================================

/** Size variants for responsive layout */
export type ProjectsSettingsPageSize = ProjectSettingsSize;

/** Breakpoints supported for responsive sizing */
export type ProjectsSettingsPageBreakpoint = ProjectSettingsBreakpoint;

/** Option for the project selector */
export interface ProjectSettingsPageSelectorOption {
  value: string;
  label: string;
}

/** Props for the selector section */
export interface ProjectsSettingsPageSelectorProps {
  /** Dropdown options */
  options: ProjectSettingsPageSelectorOption[];
  /** Selected project ID */
  selectedProjectId: string | null;
  /** Callback when project is selected */
  onSelect: (projectId: string) => void;
  /** Whether there are unsaved changes */
  hasChanges: boolean;
  /** Whether save was successful */
  saveSuccess: boolean;
}

/** Props for the form section */
export interface ProjectsSettingsPageFormProps {
  /** Form data */
  formData: ProjectSettingsFormData;
  /** Form change handler */
  onFormChange: (
    field: keyof ProjectSettingsFormData
  ) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  /** Whether save is pending */
  isSaving: boolean;
  /** Whether there are unsaved changes */
  hasChanges: boolean;
  /** Save error message */
  saveError: string | null;
  /** Callback when save button is clicked */
  onSave: () => void;
}

/** Error state props for the page */
export interface ProjectsSettingsPageErrorProps {
  /** The error that occurred */
  error: string;
  /** Callback to retry the failed operation */
  onRetry?: () => void;
}

/** Props for ProjectsSettingsPageSkeleton */
export interface ProjectsSettingsPageSkeletonProps {
  /** Number of skeleton sections to show */
  sectionCount?: number;
  /** Number of fields per section */
  fieldsPerSection?: number;
  /** Responsive sizing */
  size?: ResponsiveValue<ProjectsSettingsPageSize>;
  /** Data attributes for testing */
  'data-testid'?: string;
}

/** Props for ProjectsSettingsPageError */
export interface ProjectsSettingsPageErrorStateProps {
  /** The error message that occurred */
  error: string;
  /** Retry handler */
  onRetry?: () => void;
  /** Responsive sizing */
  size?: ResponsiveValue<ProjectsSettingsPageSize>;
  /** Data attributes for testing */
  'data-testid'?: string;
}

/**
 * Complete props for the ProjectsSettingsPage component.
 *
 * This interface defines all data and callbacks needed to render the project settings.
 * The route component is responsible for providing these props from hooks.
 */
export interface ProjectsSettingsPageProps {
  /** Page state: 'loading' | 'empty' | 'error' | 'loading-project' | 'ready' */
  state: 'loading' | 'empty' | 'error' | 'loading-project' | 'ready';

  /** Selector props (required for all states except 'loading', 'empty', and 'error') */
  selector?: ProjectsSettingsPageSelectorProps;

  /** Selected project (required when state is 'ready') */
  project?: Project;

  /** Form props (required when state is 'ready') */
  form?: ProjectsSettingsPageFormProps;

  /** Error state props (required when state is 'error') */
  error?: ProjectsSettingsPageErrorProps;

  /** Responsive sizing */
  size?: ResponsiveValue<ProjectsSettingsPageSize>;

  /** Custom aria-label for the page */
  'aria-label'?: string;

  /** Data attributes for testing */
  'data-testid'?: string;
}

// ============================================================================
// Constants
// ============================================================================

/** Default skeleton section count */
export const DEFAULT_SKELETON_SECTION_COUNT = 4;

/** Default fields per skeleton section */
export const DEFAULT_SKELETON_FIELDS_PER_SECTION = 3;

/** Default page size */
export const DEFAULT_PAGE_SIZE: ProjectsSettingsPageSize = 'md';

/** Default page label */
export const DEFAULT_PAGE_LABEL = 'Project Settings';

/** Default error title */
export const DEFAULT_ERROR_TITLE = 'Failed to load project settings';

/** Default error description */
export const DEFAULT_ERROR_DESCRIPTION = 'Something went wrong while loading the project settings.';

/** Default retry button label */
export const DEFAULT_RETRY_LABEL = 'Try Again';

/** Screen reader announcement for loading state */
export const SR_LOADING = 'Loading project settings. Please wait.';

/** Screen reader announcement for loading project state */
export const SR_LOADING_PROJECT = 'Loading selected project details. Please wait.';

/** Screen reader announcement for error state */
export const SR_ERROR_PREFIX = 'Error loading project settings:';

/** Screen reader announcement for empty state */
export const SR_EMPTY = 'No projects available. Create a project first to configure its settings.';

/** Screen reader announcement for content loaded */
export const SR_LOADED_PREFIX = 'Project settings loaded.';

/** Screen reader announcement when project is selected */
export const SR_PROJECT_SELECTED = 'Project selected:';

/** Page container base classes */
export const PROJECTS_SETTINGS_PAGE_BASE_CLASSES = 'relative flex flex-col h-full w-full';

/** Error container classes */
export const PROJECTS_SETTINGS_PAGE_ERROR_CLASSES = [
  'flex flex-col items-center justify-center gap-4 p-6',
  'text-center min-h-[300px]',
].join(' ');

/** Skeleton container classes */
export const PROJECTS_SETTINGS_PAGE_SKELETON_CLASSES = 'flex flex-col h-full';

/** Size-based container padding */
export const PAGE_SIZE_PADDING: Record<ProjectsSettingsPageSize, string> = {
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-6',
};

/** Size-based gap classes */
export const PAGE_SIZE_GAP: Record<ProjectsSettingsPageSize, string> = {
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
  size: ResponsiveValue<ProjectsSettingsPageSize> | undefined
): ProjectsSettingsPageSize {
  if (!size) return DEFAULT_PAGE_SIZE;
  if (typeof size === 'string') return size;
  return size.base ?? DEFAULT_PAGE_SIZE;
}

/**
 * Generates responsive Tailwind classes for the size prop
 */
export function getResponsiveSizeClasses(
  size: ResponsiveValue<ProjectsSettingsPageSize> | undefined,
  classMap: Record<ProjectsSettingsPageSize, string>
): string {
  if (!size) return classMap[DEFAULT_PAGE_SIZE];

  if (typeof size === 'string') {
    return classMap[size];
  }

  const classes: string[] = [];
  const breakpointPrefixes: Record<Exclude<ProjectsSettingsPageBreakpoint, 'base'>, string> = {
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
    const bp = breakpoint as Exclude<ProjectsSettingsPageBreakpoint, 'base'>;
    if (size[bp]) {
      const sizeClasses = classMap[size[bp] as ProjectsSettingsPageSize];
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
  projectName: string | null,
  hasChanges: boolean,
  saveSuccess: boolean
): string {
  const parts: string[] = [SR_LOADED_PREFIX];

  if (projectName) {
    parts.push(`${SR_PROJECT_SELECTED} ${projectName}.`);
  }

  if (hasChanges) {
    parts.push('You have unsaved changes.');
  }

  if (saveSuccess) {
    parts.push('Settings saved successfully.');
  }

  return parts.join(' ');
}

/**
 * Build accessible label for the page
 */
export function buildPageAccessibleLabel(state: ProjectsSettingsPageProps['state']): string {
  switch (state) {
    case 'loading':
      return 'Project Settings - Loading';
    case 'empty':
      return 'Project Settings - No projects available';
    case 'error':
      return 'Project Settings - Error loading content';
    case 'loading-project':
      return 'Project Settings - Loading project details';
    case 'ready':
      return 'Project Settings';
    default:
      return 'Project Settings';
  }
}

// ============================================================================
// Sub-Components
// ============================================================================

/**
 * Loading skeleton for the projects settings page
 */
export const ProjectsSettingsPageSkeleton = forwardRef<
  HTMLDivElement,
  ProjectsSettingsPageSkeletonProps
>(function ProjectsSettingsPageSkeleton(
  {
    sectionCount = DEFAULT_SKELETON_SECTION_COUNT,
    fieldsPerSection = DEFAULT_SKELETON_FIELDS_PER_SECTION,
    size,
    'data-testid': testId,
  },
  ref
) {
  return (
    <Box
      ref={ref}
      className={PROJECTS_SETTINGS_PAGE_SKELETON_CLASSES}
      aria-hidden="true"
      role="presentation"
      data-testid={testId ?? 'projects-settings-page-skeleton'}
    >
      {/* Screen reader loading announcement */}
      <VisuallyHidden>
        <Box role="status" aria-live="polite">
          {SR_LOADING}
        </Box>
      </VisuallyHidden>

      <ProjectSettingsLoadingSkeleton
        sectionCount={sectionCount}
        fieldsPerSection={fieldsPerSection}
        size={getBaseSize(size)}
      />
    </Box>
  );
});

/**
 * Error state for the projects settings page
 */
export const ProjectsSettingsPageError = forwardRef<
  HTMLDivElement,
  ProjectsSettingsPageErrorStateProps
>(function ProjectsSettingsPageError({ error, onRetry, size, 'data-testid': testId }, ref) {
  return (
    <Box
      ref={ref}
      className={cn(
        PROJECTS_SETTINGS_PAGE_ERROR_CLASSES,
        getResponsiveSizeClasses(size, PAGE_SIZE_PADDING)
      )}
      data-testid={testId ?? 'projects-settings-page-error'}
    >
      {/* Screen reader announcement */}
      <VisuallyHidden>
        <Box role="status" aria-live="assertive">
          {SR_ERROR_PREFIX} {error}
        </Box>
      </VisuallyHidden>

      <ProjectSettingsErrorState error={error} onRetry={onRetry} size={getBaseSize(size)} />
    </Box>
  );
});

// ============================================================================
// Main Component
// ============================================================================

/**
 * ProjectsSettingsPage - Complete stateless project settings page component.
 *
 * This component receives all data and callbacks via props. It is purely
 * presentational, making it fully testable in Storybook with mocked data.
 *
 * Features:
 * - Page-level loading skeleton
 * - Error state with retry button
 * - Empty state handling
 * - Proper heading hierarchy
 * - Screen reader announcements for state changes
 * - forwardRef support for focus management
 * - Responsive layout for all screen sizes
 *
 * @example
 * ```tsx
 * // In route component
 * function ProjectSettingsRoute() {
 *   const session = useProjectsSettingsSession();
 *
 *   // Loading projects state
 *   if (session.isLoadingProjects) {
 *     return <ProjectsSettingsPage state="loading" />;
 *   }
 *
 *   // Error state
 *   if (session.error) {
 *     return (
 *       <ProjectsSettingsPage
 *         state="error"
 *         error={{
 *           error: session.error.message,
 *           onRetry: session.refetch,
 *         }}
 *       />
 *     );
 *   }
 *
 *   // Empty state
 *   if (session.projects.length === 0) {
 *     return <ProjectsSettingsPage state="empty" />;
 *   }
 *
 *   // Loading selected project state
 *   if (session.isLoadingProject && session.selectedProjectId) {
 *     return (
 *       <ProjectsSettingsPage
 *         state="loading-project"
 *         selector={{
 *           options: session.projectOptions,
 *           selectedProjectId: session.selectedProjectId,
 *           onSelect: session.handleProjectSelect,
 *           hasChanges: session.hasChanges,
 *           saveSuccess: session.saveSuccess,
 *         }}
 *       />
 *     );
 *   }
 *
 *   // Ready state
 *   return (
 *     <ProjectsSettingsPage
 *       state="ready"
 *       selector={{
 *         options: session.projectOptions,
 *         selectedProjectId: session.selectedProjectId,
 *         onSelect: session.handleProjectSelect,
 *         hasChanges: session.hasChanges,
 *         saveSuccess: session.saveSuccess,
 *       }}
 *       project={session.selectedProject}
 *       form={{
 *         formData: session.formData,
 *         onFormChange: session.handleFormChange,
 *         isSaving: session.isSaving,
 *         hasChanges: session.hasChanges,
 *         saveError: session.saveError,
 *         onSave: session.handleSave,
 *       }}
 *     />
 *   );
 * }
 * ```
 */
export const ProjectsSettingsPage = forwardRef<HTMLDivElement, ProjectsSettingsPageProps>(
  function ProjectsSettingsPage(
    { state, selector, project, form, error, size, 'aria-label': ariaLabel, 'data-testid': testId },
    ref
  ) {
    // Generate accessible label
    const computedAriaLabel = ariaLabel ?? buildPageAccessibleLabel(state);
    const baseSize = getBaseSize(size);

    // Loading projects state
    if (state === 'loading') {
      return (
        <Box
          ref={ref}
          className={PROJECTS_SETTINGS_PAGE_BASE_CLASSES}
          aria-label={computedAriaLabel}
          aria-busy="true"
          data-testid={testId ?? 'projects-settings-page'}
          data-state="loading"
          data-size={baseSize}
        >
          <ProjectsSettingsPageSkeleton size={size} />
        </Box>
      );
    }

    // Error state
    if (state === 'error' && error) {
      return (
        <Box
          ref={ref}
          className={PROJECTS_SETTINGS_PAGE_BASE_CLASSES}
          aria-label={computedAriaLabel}
          data-testid={testId ?? 'projects-settings-page'}
          data-state="error"
          data-size={baseSize}
        >
          <ProjectsSettingsPageError error={error.error} onRetry={error.onRetry} size={size} />
        </Box>
      );
    }

    // Empty state (no projects)
    if (state === 'empty') {
      return (
        <Box
          ref={ref}
          className={PROJECTS_SETTINGS_PAGE_BASE_CLASSES}
          aria-label={computedAriaLabel}
          data-testid={testId ?? 'projects-settings-page'}
          data-state="empty"
          data-size={baseSize}
        >
          {/* Screen reader announcement */}
          <VisuallyHidden>
            <Box role="status" aria-live="polite" aria-atomic="true">
              {SR_EMPTY}
            </Box>
          </VisuallyHidden>

          <ProjectSettingsEmptyState size={baseSize} />
        </Box>
      );
    }

    // Loading selected project state
    if (state === 'loading-project') {
      if (!selector) {
        return (
          <Box
            ref={ref}
            className={PROJECTS_SETTINGS_PAGE_BASE_CLASSES}
            aria-label={computedAriaLabel}
            aria-busy="true"
            data-testid={testId ?? 'projects-settings-page'}
            data-state="loading-project"
            data-size={baseSize}
          >
            <ProjectsSettingsPageSkeleton size={size} />
          </Box>
        );
      }

      return (
        <Box
          ref={ref}
          className={PROJECTS_SETTINGS_PAGE_BASE_CLASSES}
          aria-label={computedAriaLabel}
          aria-busy="true"
          data-testid={testId ?? 'projects-settings-page'}
          data-state="loading-project"
          data-size={baseSize}
          data-selected-project={selector.selectedProjectId ?? undefined}
        >
          {/* Screen reader announcement */}
          <VisuallyHidden>
            <Box role="status" aria-live="polite">
              {SR_LOADING_PROJECT}
            </Box>
          </VisuallyHidden>

          <ProjectSettingsLayout size={baseSize}>
            <ProjectSettingsSelector
              options={selector.options}
              selectedProjectId={selector.selectedProjectId}
              onSelect={selector.onSelect}
              hasChanges={selector.hasChanges}
              saveSuccess={selector.saveSuccess}
              size={baseSize}
            />
            <ProjectSettingsLoadingSkeleton
              sectionCount={DEFAULT_SKELETON_SECTION_COUNT}
              fieldsPerSection={DEFAULT_SKELETON_FIELDS_PER_SECTION}
              size={baseSize}
            />
          </ProjectSettingsLayout>
        </Box>
      );
    }

    // Ready state - all props should be defined
    if (!selector || !project || !form) {
      // Fallback if props are missing in ready state (shouldn't happen in practice)
      return (
        <Box
          ref={ref}
          className={PROJECTS_SETTINGS_PAGE_BASE_CLASSES}
          aria-label={computedAriaLabel}
          data-testid={testId ?? 'projects-settings-page'}
          data-state="empty"
          data-size={baseSize}
        >
          <ProjectSettingsEmptyState size={baseSize} />
        </Box>
      );
    }

    // Find selected project name for screen reader announcement
    const selectedOption = selector.options.find((opt) => opt.value === selector.selectedProjectId);

    return (
      <Box
        ref={ref}
        className={PROJECTS_SETTINGS_PAGE_BASE_CLASSES}
        aria-label={computedAriaLabel}
        data-testid={testId ?? 'projects-settings-page'}
        data-state="ready"
        data-size={baseSize}
        data-project-id={project.id}
        data-has-changes={selector.hasChanges || undefined}
        data-save-success={selector.saveSuccess || undefined}
      >
        {/* Screen reader announcements */}
        <VisuallyHidden>
          <Box role="status" aria-live="polite" aria-atomic="true">
            {buildLoadedAnnouncement(
              selectedOption?.label ?? null,
              selector.hasChanges,
              selector.saveSuccess
            )}
          </Box>
        </VisuallyHidden>

        <ProjectSettingsLayout size={baseSize}>
          {/* Project selector */}
          <ProjectSettingsSelector
            options={selector.options}
            selectedProjectId={selector.selectedProjectId}
            onSelect={selector.onSelect}
            hasChanges={selector.hasChanges}
            saveSuccess={selector.saveSuccess}
            size={baseSize}
          />

          {/* Project settings form */}
          <ProjectSettingsForm
            project={project}
            formData={form.formData}
            onFormChange={form.onFormChange}
            isSaving={form.isSaving}
            hasChanges={form.hasChanges}
            saveError={form.saveError}
            onSave={form.onSave}
            size={baseSize}
          />
        </ProjectSettingsLayout>
      </Box>
    );
  }
);

ProjectsSettingsPage.displayName = 'ProjectsSettingsPage';

// Re-export types from organisms for convenience
export type { ProjectSettingsFormData } from '../organisms/ProjectSettingsPageComponents';
