/**
 * Projects List Page Route
 *
 * Displays all projects in a grid layout with quick actions.
 * Users can:
 * - View all projects
 * - Create a new project
 * - Navigate to project details
 *
 * This route is pure composition - all UI in @openflow/ui, all logic in @openflow/hooks.
 */

import { useProjectsListSession } from '@openflow/hooks';
import {
  ProjectsListConfirmDialog,
  ProjectsListContent,
  ProjectsListCreateDialog,
  ProjectsListHeader,
  ProjectsListLayout,
  useToast,
} from '@openflow/ui';
import { Outlet, createFileRoute, useNavigate } from '@tanstack/react-router';

export const Route = createFileRoute('/projects')({
  component: ProjectsPage,
});

function ProjectsPage() {
  const navigate = useNavigate();
  const toast = useToast();

  const session = useProjectsListSession({ navigate, toast });

  return (
    <ProjectsListLayout projectCount={session.projects.length} onSearch={session.handleSearch}>
      <div className="flex h-full flex-col p-4 md:p-6">
        <ProjectsListHeader onCreateProject={session.handleOpenCreateDialog} />

        <ProjectsListContent
          isLoading={session.isLoading}
          projects={session.projects}
          onCreateProject={session.handleOpenCreateDialog}
          onSelectProject={session.handleSelectProject}
          onProjectSettings={session.handleProjectSettings}
          onDeleteProject={session.handleDeleteProject}
        />
      </div>

      <ProjectsListCreateDialog
        isOpen={session.isCreateDialogOpen}
        onClose={session.handleCloseCreateDialog}
        projectName={session.newProjectName}
        onProjectNameChange={session.handleProjectNameChange}
        projectPath={session.newProjectPath}
        onProjectPathChange={session.handleProjectPathChange}
        onBrowseFolder={session.handleBrowseFolder}
        onCreate={session.handleCreateProject}
        isPending={session.isCreating}
        error={session.createError}
      />

      <ProjectsListConfirmDialog dialogProps={session.confirmDialogProps} />

      {/* Outlet for nested routes */}
      <Outlet />
    </ProjectsListLayout>
  );
}
