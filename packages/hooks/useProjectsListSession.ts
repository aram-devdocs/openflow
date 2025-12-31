/**
 * useProjectsListSession - Hook for managing Projects List page state
 *
 * This hook encapsulates all the state management, data fetching, and
 * callbacks for the Projects List page, keeping the route component pure.
 */

import type { CreateProjectRequest, Project } from '@openflow/generated';
import { open } from '@tauri-apps/plugin-dialog';
import { useCallback, useState } from 'react';
import { useConfirmDialog } from './useConfirmDialog';
import { useKeyboardShortcuts } from './useKeyboardShortcuts';
import { useCreateProject, useDeleteProject, useProjects } from './useProjects';

// ============================================================================
// Types
// ============================================================================

export interface UseProjectsListSessionOptions {
  /** Callback for navigation */
  navigate: (opts: {
    to: string;
    params?: Record<string, string>;
    search?: Record<string, string>;
  }) => void;
  /** Toast notification callbacks */
  toast: {
    success: (title: string, description?: string) => void;
    error: (title: string, description?: string) => void;
  };
}

export interface ProjectsListSessionState {
  // Data
  projects: Project[];
  isLoading: boolean;

  // Create dialog state
  isCreateDialogOpen: boolean;
  newProjectName: string;
  newProjectPath: string;
  createError: string | null;
  isCreating: boolean;

  // Dialog props for ConfirmDialog
  confirmDialogProps: ReturnType<typeof useConfirmDialog>['dialogProps'];

  // Actions
  handleSearch: () => void;
  handleSelectProject: (projectId: string) => void;
  handleProjectSettings: (projectId: string) => void;
  handleDeleteProject: (projectId: string, projectName: string) => void;
  handleOpenCreateDialog: () => void;
  handleCloseCreateDialog: () => void;
  handleProjectNameChange: (name: string) => void;
  handleProjectPathChange: (path: string) => void;
  handleBrowseFolder: () => Promise<void>;
  handleCreateProject: () => void;
}

// ============================================================================
// Hook Implementation
// ============================================================================

/**
 * useProjectsListSession hook for managing Projects List page state.
 *
 * Encapsulates:
 * - Data fetching (projects)
 * - UI state (create dialog)
 * - All user interaction callbacks
 * - Confirmation dialogs for delete actions
 *
 * @example
 * ```tsx
 * function ProjectsPage() {
 *   const navigate = useNavigate();
 *   const toast = useToast();
 *   const session = useProjectsListSession({ navigate, toast });
 *
 *   return (
 *     <ProjectsListLayout {...session}>
 *       <ProjectsListContent {...session} />
 *       <CreateProjectDialog {...session} />
 *       <ConfirmDialog {...session.confirmDialogProps} />
 *     </ProjectsListLayout>
 *   );
 * }
 * ```
 */
export function useProjectsListSession({
  navigate,
  toast,
}: UseProjectsListSessionOptions): ProjectsListSessionState {
  // UI state
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectPath, setNewProjectPath] = useState('');
  const [createError, setCreateError] = useState<string | null>(null);

  // Confirm dialog
  const { dialogProps, confirm } = useConfirmDialog();

  // Data fetching
  const { data: projects = [], isLoading } = useProjects();

  // Mutations
  const createProject = useCreateProject();
  const deleteProject = useDeleteProject();

  // Keyboard shortcuts
  useKeyboardShortcuts([
    {
      key: 'n',
      meta: true,
      action: () => setIsCreateDialogOpen(true),
    },
    {
      key: 'Escape',
      action: () => setIsCreateDialogOpen(false),
    },
  ]);

  // ============================================================================
  // Actions
  // ============================================================================

  const handleSearch = useCallback(() => {
    // TODO: Open command palette for search
    console.log('Search clicked');
  }, []);

  const handleSelectProject = useCallback(
    (projectId: string) => {
      navigate({ to: '/projects/$projectId', params: { projectId } });
    },
    [navigate]
  );

  const handleProjectSettings = useCallback(
    (projectId: string) => {
      navigate({
        to: '/settings/projects',
        search: { projectId },
      });
    },
    [navigate]
  );

  const handleDeleteProject = useCallback(
    (projectId: string, projectName: string) => {
      confirm({
        title: 'Delete Project',
        description: `Are you sure you want to delete "${projectName}"? This action cannot be undone.`,
        confirmLabel: 'Delete',
        variant: 'destructive',
        onConfirm: async () => {
          await deleteProject.mutateAsync(projectId);
          toast.success('Project deleted', 'The project has been deleted.');
        },
      });
    },
    [confirm, deleteProject, toast]
  );

  const handleOpenCreateDialog = useCallback(() => {
    setCreateError(null);
    setNewProjectName('');
    setNewProjectPath('');
    setIsCreateDialogOpen(true);
  }, []);

  const handleCloseCreateDialog = useCallback(() => {
    setIsCreateDialogOpen(false);
  }, []);

  const handleProjectNameChange = useCallback((name: string) => {
    setNewProjectName(name);
  }, []);

  const handleProjectPathChange = useCallback((path: string) => {
    setNewProjectPath(path);
  }, []);

  const handleBrowseFolder = useCallback(async () => {
    try {
      const selected = await open({
        directory: true,
        multiple: false,
        title: 'Select Git Repository',
      });
      if (selected && typeof selected === 'string') {
        setNewProjectPath(selected);
        // Try to auto-fill project name from folder name if not set
        if (!newProjectName.trim()) {
          const folderName = selected.split('/').pop() || '';
          setNewProjectName(folderName);
        }
      }
    } catch (error) {
      console.error('Failed to open folder picker:', error);
      setCreateError('Failed to open folder picker. Please enter the path manually.');
    }
  }, [newProjectName]);

  const handleCreateProject = useCallback(() => {
    setCreateError(null);

    if (!newProjectName.trim()) {
      setCreateError('Project name is required');
      return;
    }

    if (!newProjectPath.trim()) {
      setCreateError('Git repository path is required');
      return;
    }

    const request: CreateProjectRequest = {
      name: newProjectName.trim(),
      gitRepoPath: newProjectPath.trim(),
    };

    createProject.mutate(request, {
      onSuccess: (project) => {
        setIsCreateDialogOpen(false);
        setNewProjectName('');
        setNewProjectPath('');
        toast.success('Project created', `"${project.name}" has been created successfully.`);
        navigate({ to: '/projects/$projectId', params: { projectId: project.id } });
      },
      onError: (error) => {
        setCreateError(error.message);
        toast.error('Failed to create project', error.message);
      },
    });
  }, [newProjectName, newProjectPath, createProject, navigate, toast]);

  return {
    // Data
    projects,
    isLoading,

    // Create dialog state
    isCreateDialogOpen,
    newProjectName,
    newProjectPath,
    createError,
    isCreating: createProject.isPending,

    // Dialog props for ConfirmDialog
    confirmDialogProps: dialogProps,

    // Actions
    handleSearch,
    handleSelectProject,
    handleProjectSettings,
    handleDeleteProject,
    handleOpenCreateDialog,
    handleCloseCreateDialog,
    handleProjectNameChange,
    handleProjectPathChange,
    handleBrowseFolder,
    handleCreateProject,
  };
}
