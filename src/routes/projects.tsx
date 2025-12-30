/**
 * Projects List Page Route
 *
 * Displays all projects in a grid layout with quick actions.
 * Users can:
 * - View all projects
 * - Create a new project
 * - Navigate to project details
 *
 * Follows the orchestration pattern: connects hooks to UI components.
 * Keeps page logic minimal (<200 lines) by delegating to UI components.
 */

import type { CreateProjectRequest } from '@openflow/generated';
import {
  useCreateProject,
  useDeleteProject,
  useKeyboardShortcuts,
  useProjects,
} from '@openflow/hooks';
import { AppLayout, Button, Dialog, FormField, Header, Input, useToast } from '@openflow/ui';
import { Outlet, createFileRoute, useNavigate } from '@tanstack/react-router';
import { open } from '@tauri-apps/plugin-dialog';
import { ChevronRight, FolderGit2, FolderOpen, Plus, Settings } from 'lucide-react';
import { useCallback, useState } from 'react';

export const Route = createFileRoute('/projects')({
  component: ProjectsPage,
});

function ProjectsPage() {
  const navigate = useNavigate();
  const toast = useToast();

  // UI state
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectPath, setNewProjectPath] = useState('');
  const [createError, setCreateError] = useState<string | null>(null);

  // Data fetching
  const { data: projects = [], isLoading } = useProjects();
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

  // Callbacks
  const handleSelectProject = useCallback(
    (projectId: string) => {
      navigate({ to: '/projects/$projectId', params: { projectId } });
    },
    [navigate]
  );

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

  const handleDeleteProject = useCallback(
    (projectId: string) => {
      if (confirm('Are you sure you want to delete this project?')) {
        deleteProject.mutate(projectId, {
          onSuccess: () => {
            toast.success('Project deleted', 'The project has been deleted.');
          },
          onError: (error) => {
            toast.error('Failed to delete project', error.message);
          },
        });
      }
    },
    [deleteProject, toast]
  );

  const handleOpenCreateDialog = useCallback(() => {
    setCreateError(null);
    setNewProjectName('');
    setNewProjectPath('');
    setIsCreateDialogOpen(true);
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

  const handleCloseCreateDialog = useCallback(() => {
    setIsCreateDialogOpen(false);
  }, []);

  const handleSearch = useCallback(() => {
    // TODO: Open command palette for search
    console.log('Search clicked');
  }, []);

  return (
    <AppLayout
      sidebarCollapsed={true}
      sidebar={null}
      header={
        <Header
          title="Projects"
          subtitle={`${projects.length} project${projects.length === 1 ? '' : 's'}`}
          onSearch={handleSearch}
        />
      }
    >
      <div className="flex h-full flex-col p-6">
        {/* Header with create button */}
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-[rgb(var(--foreground))]">All Projects</h1>
          <Button variant="primary" onClick={handleOpenCreateDialog}>
            <Plus className="mr-2 h-4 w-4" />
            New Project
          </Button>
        </div>

        {/* Loading state */}
        {isLoading && (
          <div className="flex flex-1 items-center justify-center">
            <div className="text-sm text-[rgb(var(--muted-foreground))]">Loading projects...</div>
          </div>
        )}

        {/* Empty state */}
        {!isLoading && projects.length === 0 && (
          <div className="flex flex-1 flex-col items-center justify-center p-8">
            <FolderGit2 className="mb-4 h-16 w-16 text-[rgb(var(--muted-foreground))]" />
            <h2 className="text-lg font-semibold text-[rgb(var(--foreground))]">No projects yet</h2>
            <p className="mt-2 text-center text-sm text-[rgb(var(--muted-foreground))]">
              Get started by creating your first project.
              <br />
              Projects link to your local git repositories.
            </p>
            <Button variant="primary" className="mt-4" onClick={handleOpenCreateDialog}>
              <Plus className="mr-2 h-4 w-4" />
              Create Project
            </Button>
          </div>
        )}

        {/* Projects grid */}
        {!isLoading && projects.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {projects.map((project) => (
              <ProjectCard
                key={project.id}
                name={project.name}
                path={project.gitRepoPath}
                icon={project.icon}
                onSelect={() => handleSelectProject(project.id)}
                onSettings={() =>
                  navigate({
                    to: '/settings/projects' as string,
                    search: { projectId: project.id } as Record<string, string>,
                  })
                }
                onDelete={() => handleDeleteProject(project.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Create project dialog */}
      <Dialog
        isOpen={isCreateDialogOpen}
        onClose={handleCloseCreateDialog}
        title="Create New Project"
      >
        <div className="space-y-4">
          <FormField
            label="Project Name"
            required
            {...(!newProjectName.trim() && createError ? { error: 'Required' } : {})}
          >
            <Input
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              placeholder="My Awesome Project"
              autoFocus
            />
          </FormField>

          <FormField
            label="Git Repository Path"
            required
            {...(!newProjectPath.trim() && createError ? { error: 'Required' } : {})}
          >
            <div className="flex gap-2">
              <Input
                value={newProjectPath}
                onChange={(e) => setNewProjectPath(e.target.value)}
                placeholder="/path/to/your/repo"
                className="flex-1"
              />
              <Button variant="secondary" onClick={handleBrowseFolder} type="button">
                <FolderOpen className="h-4 w-4" />
              </Button>
            </div>
          </FormField>

          {createError && <p className="text-sm text-error">{createError}</p>}

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="ghost" onClick={handleCloseCreateDialog}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleCreateProject}
              loading={createProject.isPending}
            >
              Create Project
            </Button>
          </div>
        </div>
      </Dialog>

      {/* Outlet for nested routes */}
      <Outlet />
    </AppLayout>
  );
}

// Helper component for project cards
interface ProjectCardProps {
  name: string;
  path: string;
  icon: string;
  onSelect: () => void;
  onSettings: () => void;
  onDelete: () => void;
}

function ProjectCard({ name, path, icon, onSelect, onSettings }: ProjectCardProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className="group relative flex flex-col rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4 text-left transition-all hover:border-[rgb(var(--primary))]/50 hover:bg-[rgb(var(--muted))]"
    >
      {/* Icon */}
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-[rgb(var(--primary))]/10">
        {icon === 'folder' ? (
          <FolderGit2 className="h-5 w-5 text-[rgb(var(--primary))]" />
        ) : (
          <span className="text-lg">{icon}</span>
        )}
      </div>

      {/* Name */}
      <h3 className="font-medium text-[rgb(var(--foreground))]">{name}</h3>

      {/* Path */}
      <p className="mt-1 truncate text-xs text-[rgb(var(--muted-foreground))]">{path}</p>

      {/* Actions */}
      <div className="absolute right-2 top-2 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onSettings();
          }}
          className="rounded p-1 text-[rgb(var(--muted-foreground))] hover:bg-[rgb(var(--muted))] hover:text-[rgb(var(--foreground))]"
          aria-label="Project settings"
        >
          <Settings className="h-4 w-4" />
        </button>
      </div>

      {/* Chevron indicator */}
      <ChevronRight className="absolute bottom-4 right-4 h-4 w-4 text-[rgb(var(--muted-foreground))] opacity-0 transition-opacity group-hover:opacity-100" />
    </button>
  );
}
