/**
 * useProjectsListSession - Hook for managing Projects List page state
 *
 * This hook encapsulates all the state management, data fetching, and
 * callbacks for the Projects List page, keeping the route component pure.
 *
 * Features:
 * - Full logging at DEBUG/INFO/WARN/ERROR levels
 * - Toast notifications for user feedback (handled by useProjects hooks)
 * - Proper error handling with form validation
 * - Keyboard shortcuts for common actions
 */

import type { CreateProjectRequest, Project } from '@openflow/generated';
import { createLogger } from '@openflow/utils';
import { open } from '@tauri-apps/plugin-dialog';
import { useCallback, useRef, useState } from 'react';
import { useConfirmDialog } from './useConfirmDialog';
import { useKeyboardShortcuts } from './useKeyboardShortcuts';
import { useCreateProject, useDeleteProject, useProjects } from './useProjects';

// ============================================================================
// Logger
// ============================================================================

const logger = createLogger('useProjectsListSession');

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
  /**
   * Toast notification callbacks (optional - toasts are handled by useProjects hooks)
   * @deprecated Toasts are now handled internally by the mutation hooks
   */
  toast?: {
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
 *   const session = useProjectsListSession({ navigate });
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
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- Deprecated, toasts handled by hooks
  toast: _toast,
}: UseProjectsListSessionOptions): ProjectsListSessionState {
  // Track initialization logging
  const hasLoggedInit = useRef(false);
  if (!hasLoggedInit.current) {
    logger.debug('Hook initialized');
    hasLoggedInit.current = true;
  }

  // UI state
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectPath, setNewProjectPath] = useState('');
  const [createError, setCreateError] = useState<string | null>(null);

  // Confirm dialog
  const { dialogProps, confirm } = useConfirmDialog();

  // Data fetching
  const { data: projects = [], isLoading } = useProjects();

  // Mutations (toasts are handled internally by these hooks)
  const createProject = useCreateProject();
  const deleteProject = useDeleteProject();

  // Keyboard shortcuts
  useKeyboardShortcuts([
    {
      key: 'n',
      meta: true,
      action: () => {
        logger.info('Keyboard shortcut activated: Cmd+N (create project)');
        setIsCreateDialogOpen(true);
      },
    },
    {
      key: 'Escape',
      action: () => {
        if (isCreateDialogOpen) {
          logger.debug('Keyboard shortcut activated: Escape (close dialog)');
          setIsCreateDialogOpen(false);
        }
      },
    },
  ]);

  // ============================================================================
  // Actions
  // ============================================================================

  const handleSearch = useCallback(() => {
    logger.debug('Search clicked');
    // TODO: Open command palette for search
  }, []);

  const handleSelectProject = useCallback(
    (projectId: string) => {
      logger.debug('Project selected', { projectId });
      navigate({ to: '/projects/$projectId', params: { projectId } });
    },
    [navigate]
  );

  const handleProjectSettings = useCallback(
    (projectId: string) => {
      logger.debug('Project settings clicked', { projectId });
      navigate({
        to: '/settings/projects',
        search: { projectId },
      });
    },
    [navigate]
  );

  const handleDeleteProject = useCallback(
    (projectId: string, projectName: string) => {
      logger.debug('Delete project requested', { projectId, projectName });
      confirm({
        title: 'Delete Project',
        description: `Are you sure you want to delete "${projectName}"? This action cannot be undone.`,
        confirmLabel: 'Delete',
        variant: 'destructive',
        onConfirm: async () => {
          try {
            logger.debug('Deleting project', { projectId, projectName });
            await deleteProject.mutateAsync({ id: projectId, name: projectName });
            logger.info('Project deleted successfully', { projectId, projectName });
            // Toast is handled by useDeleteProject hook
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            logger.error('Failed to delete project', {
              projectId,
              projectName,
              error: errorMessage,
            });
            // Toast is handled by useDeleteProject hook
            // Re-throw to let useConfirmDialog handle the error state
            throw error;
          }
        },
      });
    },
    [confirm, deleteProject]
  );

  const handleOpenCreateDialog = useCallback(() => {
    logger.debug('Create dialog opened');
    setCreateError(null);
    setNewProjectName('');
    setNewProjectPath('');
    setIsCreateDialogOpen(true);
  }, []);

  const handleCloseCreateDialog = useCallback(() => {
    logger.debug('Create dialog closed');
    setIsCreateDialogOpen(false);
  }, []);

  const handleProjectNameChange = useCallback((name: string) => {
    logger.debug('Project name changed', { name });
    setNewProjectName(name);
  }, []);

  const handleProjectPathChange = useCallback((path: string) => {
    logger.debug('Project path changed', { path });
    setNewProjectPath(path);
  }, []);

  const handleBrowseFolder = useCallback(async () => {
    logger.debug('Folder picker opened');
    try {
      const selected = await open({
        directory: true,
        multiple: false,
        title: 'Select Git Repository',
      });
      if (selected && typeof selected === 'string') {
        logger.info('Folder selected', { path: selected });
        setNewProjectPath(selected);
        // Try to auto-fill project name from folder name if not set
        if (!newProjectName.trim()) {
          const folderName = selected.split('/').pop() || '';
          logger.debug('Auto-filled project name from folder', { folderName });
          setNewProjectName(folderName);
        }
      } else {
        logger.debug('Folder picker cancelled');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Failed to open folder picker', { error: errorMessage });
      setCreateError('Failed to open folder picker. Please enter the path manually.');
    }
  }, [newProjectName]);

  const handleCreateProject = useCallback(() => {
    setCreateError(null);

    // Validation
    if (!newProjectName.trim()) {
      logger.warn('Validation failed: missing project name');
      setCreateError('Project name is required');
      return;
    }

    if (!newProjectPath.trim()) {
      logger.warn('Validation failed: missing project path');
      setCreateError('Git repository path is required');
      return;
    }

    const request: CreateProjectRequest = {
      name: newProjectName.trim(),
      gitRepoPath: newProjectPath.trim(),
    };

    logger.debug('Creating project', { name: request.name, path: request.gitRepoPath });

    createProject.mutate(request, {
      onSuccess: (project) => {
        logger.info('Project created successfully', { projectId: project.id, name: project.name });
        setIsCreateDialogOpen(false);
        setNewProjectName('');
        setNewProjectPath('');
        // Toast is handled by useCreateProject hook
        navigate({ to: '/projects/$projectId', params: { projectId: project.id } });
      },
      onError: (error) => {
        const errorMessage = error instanceof Error ? error.message : String(error);
        logger.error('Failed to create project', { name: request.name, error: errorMessage });
        setCreateError(error.message);
        // Toast is handled by useCreateProject hook
      },
    });
  }, [newProjectName, newProjectPath, createProject, navigate]);

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
