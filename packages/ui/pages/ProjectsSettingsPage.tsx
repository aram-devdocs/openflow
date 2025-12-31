/**
 * ProjectsSettingsPage - Stateless Page Component for Project Settings
 *
 * This is a top-level stateless component that composes the project settings view.
 * It receives all required data and callbacks via props, making it fully
 * testable in Storybook with mocked data representing different page states.
 *
 * The component composes:
 * - ProjectSettingsLayout (main layout wrapper)
 * - ProjectSettingsSelector (project dropdown)
 * - ProjectSettingsForm (settings form with all sections)
 * - ProjectSettingsLoadingSkeleton (loading states)
 * - ProjectSettingsEmptyState (no projects state)
 */

import type { Project } from '@openflow/generated';
import {
  ProjectSettingsEmptyState,
  ProjectSettingsForm,
  type ProjectSettingsFormData,
  ProjectSettingsLayout,
  ProjectSettingsLoadingSkeleton,
  ProjectSettingsSelector,
} from '../organisms/ProjectSettingsPageComponents';

// ============================================================================
// Types
// ============================================================================

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

/**
 * Complete props for the ProjectsSettingsPage component.
 *
 * This interface defines all data and callbacks needed to render the project settings.
 * The route component is responsible for providing these props from hooks.
 */
export interface ProjectsSettingsPageProps {
  /** Page state: 'loading' | 'empty' | 'loading-project' | 'ready' */
  state: 'loading' | 'empty' | 'loading-project' | 'ready';

  /** Selector props (required for all states except 'loading' and 'empty') */
  selector?: ProjectsSettingsPageSelectorProps;

  /** Selected project (required when state is 'ready') */
  project?: Project;

  /** Form props (required when state is 'ready') */
  form?: ProjectsSettingsPageFormProps;
}

// ============================================================================
// Component
// ============================================================================

/**
 * ProjectsSettingsPage - Complete stateless project settings page component.
 *
 * This component receives all data and callbacks via props. It is purely
 * presentational, making it fully testable in Storybook with mocked data.
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
export function ProjectsSettingsPage({
  state,
  selector,
  project,
  form,
}: ProjectsSettingsPageProps) {
  // Loading projects state
  if (state === 'loading') {
    return <ProjectSettingsLoadingSkeleton sectionCount={4} fieldsPerSection={3} />;
  }

  // Empty state (no projects)
  if (state === 'empty') {
    return <ProjectSettingsEmptyState />;
  }

  // Loading selected project state
  if (state === 'loading-project') {
    if (!selector) {
      return <ProjectSettingsLoadingSkeleton sectionCount={4} fieldsPerSection={3} />;
    }

    return (
      <ProjectSettingsLayout>
        <ProjectSettingsSelector
          options={selector.options}
          selectedProjectId={selector.selectedProjectId}
          onSelect={selector.onSelect}
          hasChanges={selector.hasChanges}
          saveSuccess={selector.saveSuccess}
        />
        <ProjectSettingsLoadingSkeleton sectionCount={4} fieldsPerSection={3} />
      </ProjectSettingsLayout>
    );
  }

  // Ready state - all props should be defined
  if (!selector || !project || !form) {
    // Fallback if props are missing in ready state (shouldn't happen in practice)
    return <ProjectSettingsEmptyState />;
  }

  return (
    <ProjectSettingsLayout>
      {/* Project selector */}
      <ProjectSettingsSelector
        options={selector.options}
        selectedProjectId={selector.selectedProjectId}
        onSelect={selector.onSelect}
        hasChanges={selector.hasChanges}
        saveSuccess={selector.saveSuccess}
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
      />
    </ProjectSettingsLayout>
  );
}

ProjectsSettingsPage.displayName = 'ProjectsSettingsPage';
