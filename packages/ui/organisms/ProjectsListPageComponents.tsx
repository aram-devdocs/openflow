/**
 * ProjectsListPageComponents - UI components for the Projects List page
 *
 * These components are pure UI without any data fetching or business logic.
 * All data and callbacks are passed as props from the useProjectsListSession hook.
 */

import type { Project } from '@openflow/generated';
import { ChevronRight, FolderGit2, Plus, Settings } from 'lucide-react';
import type { ReactNode } from 'react';
import { Button } from '../atoms/Button';
import { EmptyState } from '../molecules/EmptyState';
import { SkeletonProjectCard } from '../molecules/SkeletonProjectCard';
import { AppLayout } from '../templates/AppLayout';
import { ConfirmDialog, type ConfirmDialogProps } from './ConfirmDialog';
import { CreateProjectDialog } from './DashboardPageComponents';
import { Header } from './Header';

// ============================================================================
// Type Definitions
// ============================================================================

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
export interface ProjectsListHeaderProps {
  /** Callback to open create dialog */
  onCreateProject: () => void;
}

/** Props for ProjectsListLoadingSkeleton */
export interface ProjectsListLoadingSkeletonProps {
  /** Number of skeleton cards to show */
  count?: number;
}

/** Props for ProjectsListEmptyState */
export interface ProjectsListEmptyStateProps {
  /** Callback to create project */
  onCreateProject: () => void;
}

/** Props for ProjectCard */
export interface ProjectCardProps {
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
}

/** Props for ProjectsGrid */
export interface ProjectsGridProps {
  /** List of projects */
  projects: Project[];
  /** Callback when project is selected */
  onSelectProject: (projectId: string) => void;
  /** Callback to open project settings */
  onProjectSettings: (projectId: string) => void;
  /** Callback to delete project */
  onDeleteProject: (projectId: string, projectName: string) => void;
}

/** Props for ProjectsListContent */
export interface ProjectsListContentProps {
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
export function ProjectsListHeader({ onCreateProject }: ProjectsListHeaderProps) {
  return (
    <div className="mb-6 flex items-center justify-between">
      <h1 className="text-xl font-semibold text-[rgb(var(--foreground))] md:text-2xl">
        All Projects
      </h1>
      <Button variant="primary" onClick={onCreateProject}>
        <Plus className="mr-2 h-4 w-4" />
        New Project
      </Button>
    </div>
  );
}

// ============================================================================
// Loading Component
// ============================================================================

/**
 * ProjectsListLoadingSkeleton - Loading skeleton for projects grid
 */
export function ProjectsListLoadingSkeleton({ count = 8 }: ProjectsListLoadingSkeletonProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonProjectCard key={`skeleton-project-card-${i}`} />
      ))}
    </div>
  );
}

// ============================================================================
// Empty State Component
// ============================================================================

/**
 * ProjectsListEmptyState - Empty state when no projects exist
 */
export function ProjectsListEmptyState({ onCreateProject }: ProjectsListEmptyStateProps) {
  return (
    <EmptyState
      icon={FolderGit2}
      title="No projects yet"
      description="Get started by creating your first project. Projects link to your local git repositories."
      action={{
        label: 'Create Project',
        onClick: onCreateProject,
      }}
      size="lg"
      className="flex-1"
    />
  );
}

// ============================================================================
// Project Card Component
// ============================================================================

/**
 * ProjectCard - Individual project card with icon, name, path, and actions
 */
export function ProjectCard({ name, path, icon, onSelect, onSettings }: ProjectCardProps) {
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

// ============================================================================
// Projects Grid Component
// ============================================================================

/**
 * ProjectsGrid - Grid of project cards
 */
export function ProjectsGrid({ projects, onSelectProject, onProjectSettings }: ProjectsGridProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {projects.map((project) => (
        <ProjectCard
          key={project.id}
          name={project.name}
          path={project.gitRepoPath}
          icon={project.icon}
          onSelect={() => onSelectProject(project.id)}
          onSettings={() => onProjectSettings(project.id)}
        />
      ))}
    </div>
  );
}

// ============================================================================
// Content Component
// ============================================================================

/**
 * ProjectsListContent - Main content area with conditional rendering
 */
export function ProjectsListContent({
  isLoading,
  projects,
  onCreateProject,
  onSelectProject,
  onProjectSettings,
}: ProjectsListContentProps) {
  if (isLoading) {
    return <ProjectsListLoadingSkeleton />;
  }

  if (projects.length === 0) {
    return <ProjectsListEmptyState onCreateProject={onCreateProject} />;
  }

  return (
    <ProjectsGrid
      projects={projects}
      onSelectProject={onSelectProject}
      onProjectSettings={onProjectSettings}
      onDeleteProject={() => {}}
    />
  );
}

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
