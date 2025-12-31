/**
 * ProjectsListPage - Stateless Page Component for the Projects List
 *
 * This is a top-level stateless component that composes the entire projects list view.
 * It receives all required data and callbacks via props, making it fully
 * testable in Storybook with mocked data representing different page states.
 *
 * The component composes:
 * - ProjectsListLayout (page structure with header)
 * - ProjectsListHeader (title and create button)
 * - ProjectsListContent (loading/empty/grid states)
 * - ProjectsListCreateDialog (create project dialog)
 * - ProjectsListConfirmDialog (delete confirmation)
 */

import type { Project } from '@openflow/generated';
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

/**
 * Complete props for the ProjectsListPage component.
 *
 * This interface defines all data and callbacks needed to render the projects list.
 * The route component is responsible for providing these props from hooks.
 */
export interface ProjectsListPageProps {
  /** Number of projects (for subtitle) */
  projectCount: number;

  /** Callback for search action */
  onSearch: () => void;

  /** Header props */
  header: ProjectsListPageHeaderProps;

  /** Content props */
  content: ProjectsListPageContentProps;

  /** Create dialog props */
  createDialog: ProjectsListPageCreateDialogProps;

  /** Confirm dialog props for delete actions */
  confirmDialog: ConfirmDialogProps;
}

// ============================================================================
// Component
// ============================================================================

/**
 * ProjectsListPage - Complete stateless projects list page component.
 *
 * This component receives all data and callbacks via props. It is purely
 * presentational, making it fully testable in Storybook with mocked data.
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
 *   return (
 *     <ProjectsListPage
 *       projectCount={session.projects.length}
 *       onSearch={session.handleSearch}
 *       header={{
 *         onCreateProject: session.handleOpenCreateDialog,
 *       }}
 *       content={{
 *         isLoading: session.isLoading,
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
export function ProjectsListPage({
  projectCount,
  onSearch,
  header,
  content,
  createDialog,
  confirmDialog,
}: ProjectsListPageProps) {
  return (
    <ProjectsListLayout projectCount={projectCount} onSearch={onSearch}>
      <div className="flex h-full flex-col p-4 md:p-6">
        <ProjectsListHeader onCreateProject={header.onCreateProject} />

        <ProjectsListContent
          isLoading={content.isLoading}
          projects={content.projects}
          onCreateProject={content.onCreateProject}
          onSelectProject={content.onSelectProject}
          onProjectSettings={content.onProjectSettings}
          onDeleteProject={content.onDeleteProject}
        />
      </div>

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
  );
}

ProjectsListPage.displayName = 'ProjectsListPage';
