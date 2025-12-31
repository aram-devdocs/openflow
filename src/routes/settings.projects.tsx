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
import {
  ProjectSettingsEmptyState,
  ProjectSettingsForm,
  ProjectSettingsLayout,
  ProjectSettingsLoadingSkeleton,
  ProjectSettingsSelector,
} from '@openflow/ui';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/settings/projects')({
  component: ProjectSettingsPage,
});

function ProjectSettingsPage() {
  const session = useProjectsSettingsSession();

  // Loading state
  if (session.isLoadingProjects) {
    return <ProjectSettingsLoadingSkeleton sectionCount={4} fieldsPerSection={3} />;
  }

  // Empty state
  if (session.projects.length === 0) {
    return <ProjectSettingsEmptyState />;
  }

  return (
    <ProjectSettingsLayout>
      {/* Project selector */}
      <ProjectSettingsSelector
        options={session.projectOptions}
        selectedProjectId={session.selectedProjectId}
        onSelect={session.handleProjectSelect}
        hasChanges={session.hasChanges}
        saveSuccess={session.saveSuccess}
      />

      {/* Loading project state */}
      {session.isLoadingProject && session.selectedProjectId && (
        <ProjectSettingsLoadingSkeleton sectionCount={4} fieldsPerSection={3} />
      )}

      {/* Project settings form */}
      {session.selectedProject && session.formData && (
        <ProjectSettingsForm
          project={session.selectedProject}
          formData={session.formData}
          onFormChange={session.handleFormChange}
          isSaving={session.isSaving}
          hasChanges={session.hasChanges}
          saveError={session.saveError}
          onSave={session.handleSave}
        />
      )}
    </ProjectSettingsLayout>
  );
}
