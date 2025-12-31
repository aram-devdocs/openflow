/**
 * Project Settings Route
 *
 * Manages project-specific configurations.
 * Users can:
 * - Edit project details (name, icon)
 * - Configure scripts (setup, dev, cleanup)
 * - Manage workflow settings
 * - Set verification configuration
 *
 * Follows the orchestration pattern: connects hooks to UI components.
 */

import { useProjectsSettingsSession } from '@openflow/hooks';
import { ProjectsSettingsPage } from '@openflow/ui';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/_app/settings/projects')({
  component: ProjectSettingsRoute,
});

function ProjectSettingsRoute() {
  const session = useProjectsSettingsSession();

  // Loading state
  if (session.isLoadingProjects) {
    return <ProjectsSettingsPage state="loading" />;
  }

  // Empty state
  if (session.projects.length === 0) {
    return <ProjectsSettingsPage state="empty" />;
  }

  // Loading selected project state
  if (session.isLoadingProject && session.selectedProjectId) {
    return (
      <ProjectsSettingsPage
        state="loading-project"
        selector={{
          options: session.projectOptions,
          selectedProjectId: session.selectedProjectId,
          onSelect: session.handleProjectSelect,
          hasChanges: session.hasChanges,
          saveSuccess: session.saveSuccess,
        }}
      />
    );
  }

  // Ready state - needs project and formData
  if (!session.selectedProject || !session.formData) {
    return (
      <ProjectsSettingsPage
        state="loading-project"
        selector={{
          options: session.projectOptions,
          selectedProjectId: session.selectedProjectId,
          onSelect: session.handleProjectSelect,
          hasChanges: session.hasChanges,
          saveSuccess: session.saveSuccess,
        }}
      />
    );
  }

  // Ready state
  return (
    <ProjectsSettingsPage
      state="ready"
      selector={{
        options: session.projectOptions,
        selectedProjectId: session.selectedProjectId,
        onSelect: session.handleProjectSelect,
        hasChanges: session.hasChanges,
        saveSuccess: session.saveSuccess,
      }}
      project={session.selectedProject}
      form={{
        formData: session.formData,
        onFormChange: session.handleFormChange,
        isSaving: session.isSaving,
        hasChanges: session.hasChanges,
        saveError: session.saveError,
        onSave: session.handleSave,
      }}
    />
  );
}
