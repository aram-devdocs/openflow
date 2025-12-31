/**
 * ProjectDetailPageComponents - UI components for the Project Detail page
 *
 * These are stateless components that compose the project detail page UI.
 * All state and logic is handled by useProjectDetailSession hook.
 */

import type { Project, Task, TaskStatus, WorkflowTemplate } from '@openflow/generated';
import { ChevronLeft, FolderGit2, Plus, Settings } from 'lucide-react';
import type { ReactNode } from 'react';

import { Button } from '../atoms/Button';
import { Input } from '../atoms/Input';
import { Label } from '../atoms/Label';
import { Skeleton } from '../atoms/Skeleton';
import { Textarea } from '../atoms/Textarea';
import { Dialog } from '../molecules/Dialog';
import { FormField } from '../molecules/FormField';
import { SkeletonTaskCard } from '../molecules/SkeletonTaskCard';
import { AppLayout } from '../templates/AppLayout';
import { Header } from './Header';
import { Sidebar, type StatusFilter } from './Sidebar';
import { TaskList } from './TaskList';
import { WorkflowPreview } from './WorkflowPreview';
import { WorkflowSelector } from './WorkflowSelector';

// ============================================================================
// Types
// ============================================================================

export interface ProjectDetailLayoutProps {
  /** Whether sidebar is collapsed */
  sidebarCollapsed: boolean;
  /** The sidebar content */
  sidebar: ReactNode;
  /** The header content */
  header: ReactNode;
  /** Main content children */
  children: ReactNode;
}

export interface ProjectDetailSidebarProps {
  /** All projects for sidebar */
  projects: Project[];
  /** Tasks for sidebar */
  tasks: Task[];
  /** Selected project ID */
  projectId: string;
  /** Current status filter */
  statusFilter: StatusFilter;
  /** Whether sidebar is collapsed */
  isCollapsed: boolean;
  /** Callback when project is selected */
  onSelectProject: (projectId: string) => void;
  /** Callback when task is selected */
  onSelectTask: (taskId: string) => void;
  /** Callback for new task */
  onNewTask: () => void;
  /** Callback for new project */
  onNewProject: () => void;
  /** Callback for status filter change */
  onStatusFilter: (status: StatusFilter) => void;
  /** Callback for task status change */
  onTaskStatusChange: (taskId: string, status: TaskStatus) => void;
  /** Callback for settings click */
  onSettingsClick: () => void;
  /** Callback for archive click */
  onArchiveClick: () => void;
  /** Callback for sidebar toggle */
  onToggleCollapse: () => void;
}

export interface ProjectDetailHeaderProps {
  /** The project to display */
  project: Project;
  /** Callback for search */
  onSearch: () => void;
  /** Callback for new task */
  onNewTask: () => void;
}

export interface ProjectDetailLoadingSkeletonProps {
  /** Callback for search (even in loading state) */
  onSearch?: () => void;
}

export interface ProjectNotFoundProps {
  /** Callback to go back to projects */
  onBack: () => void;
  /** Callback for search */
  onSearch: () => void;
}

export interface ProjectDetailInfoBarProps {
  /** The project */
  project: Project;
  /** Callback to go back */
  onBack: () => void;
  /** Callback for settings */
  onSettings: () => void;
  /** Callback for new task */
  onNewTask: () => void;
}

export interface ProjectDetailContentProps {
  /** Whether tasks are loading */
  isLoading: boolean;
  /** Filtered tasks to display */
  tasks: Task[];
  /** Callback when task is selected */
  onSelectTask: (taskId: string) => void;
  /** Callback for task status change */
  onTaskStatusChange: (taskId: string, status: TaskStatus) => void;
  /** Callback for new task */
  onNewTask: () => void;
}

export interface ProjectCreateTaskDialogProps {
  /** Whether dialog is open */
  isOpen: boolean;
  /** Task title input value */
  taskTitle: string;
  /** Task description input value */
  taskDescription: string;
  /** Selected workflow template */
  selectedWorkflow: WorkflowTemplate | null;
  /** Available workflow templates */
  workflows: WorkflowTemplate[];
  /** Whether workflows are loading */
  isLoadingWorkflows: boolean;
  /** Whether task is being created */
  isCreating: boolean;
  /** Error message if any */
  error: string | null;
  /** Callback to close dialog */
  onClose: () => void;
  /** Callback to create task */
  onCreate: () => void;
  /** Callback when title changes */
  onTitleChange: (title: string) => void;
  /** Callback when description changes */
  onDescriptionChange: (description: string) => void;
  /** Callback when workflow is selected */
  onWorkflowSelect: (workflow: WorkflowTemplate | null) => void;
}

// ============================================================================
// Components
// ============================================================================

/**
 * Main layout wrapper for project detail page
 */
export function ProjectDetailLayout({
  sidebarCollapsed,
  sidebar,
  header,
  children,
}: ProjectDetailLayoutProps) {
  return (
    <AppLayout sidebarCollapsed={sidebarCollapsed} sidebar={sidebar} header={header}>
      {children}
    </AppLayout>
  );
}

/**
 * Sidebar component for project detail page
 */
export function ProjectDetailSidebar({
  projects,
  tasks,
  projectId,
  statusFilter,
  isCollapsed,
  onSelectProject,
  onSelectTask,
  onNewTask,
  onNewProject,
  onStatusFilter,
  onTaskStatusChange,
  onSettingsClick,
  onArchiveClick,
  onToggleCollapse,
}: ProjectDetailSidebarProps) {
  return (
    <Sidebar
      projects={projects}
      tasks={tasks}
      selectedProjectId={projectId}
      statusFilter={statusFilter}
      onSelectProject={onSelectProject}
      onSelectTask={onSelectTask}
      onNewTask={onNewTask}
      onNewProject={onNewProject}
      onStatusFilter={onStatusFilter}
      onTaskStatusChange={onTaskStatusChange}
      onSettingsClick={onSettingsClick}
      onArchiveClick={onArchiveClick}
      isCollapsed={isCollapsed}
      onToggleCollapse={onToggleCollapse}
    />
  );
}

/**
 * Header component for project detail page
 */
export function ProjectDetailHeader({ project, onSearch, onNewTask }: ProjectDetailHeaderProps) {
  return (
    <Header
      title={project.name}
      subtitle={`Branch: ${project.baseBranch}`}
      onSearch={onSearch}
      onNewChat={onNewTask}
    />
  );
}

/**
 * Loading skeleton for project detail page
 */
export function ProjectDetailLoadingSkeleton(_props: ProjectDetailLoadingSkeletonProps) {
  return (
    <AppLayout
      sidebarCollapsed={true}
      sidebar={null}
      header={
        <div className="flex items-center gap-4 px-4 py-3 border-b border-[rgb(var(--border))]">
          <Skeleton className="h-6 w-48" />
        </div>
      }
    >
      <div className="p-6">
        <div className="flex flex-col gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <SkeletonTaskCard key={`skeleton-project-${i}`} />
          ))}
        </div>
      </div>
    </AppLayout>
  );
}

/**
 * Not found state when project doesn't exist
 */
export function ProjectNotFound({ onBack, onSearch }: ProjectNotFoundProps) {
  return (
    <AppLayout
      sidebarCollapsed={true}
      sidebar={null}
      header={<Header title="Project Not Found" onSearch={onSearch} />}
    >
      <div className="flex h-full flex-col items-center justify-center p-8">
        <FolderGit2 className="mb-4 h-16 w-16 text-[rgb(var(--muted-foreground))]" />
        <h2 className="text-lg font-semibold text-[rgb(var(--foreground))]">Project not found</h2>
        <p className="mt-2 text-sm text-[rgb(var(--muted-foreground))]">
          The project you're looking for doesn't exist or has been deleted.
        </p>
        <Button variant="primary" className="mt-4" onClick={onBack}>
          <ChevronLeft className="mr-2 h-4 w-4" />
          Back to Projects
        </Button>
      </div>
    </AppLayout>
  );
}

/**
 * Info bar showing project breadcrumb and actions
 */
export function ProjectDetailInfoBar({
  project,
  onBack,
  onSettings,
  onNewTask,
}: ProjectDetailInfoBarProps) {
  return (
    <div className="flex items-center justify-between border-b border-[rgb(var(--border))] px-6 py-3">
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1 text-sm text-[rgb(var(--muted-foreground))] hover:text-[rgb(var(--foreground))]"
        >
          <ChevronLeft className="h-4 w-4" />
          Projects
        </button>
        <span className="text-[rgb(var(--border))]">/</span>
        <span className="text-sm font-medium text-[rgb(var(--foreground))]">{project.name}</span>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={onSettings}>
          <Settings className="h-4 w-4" />
        </Button>
        <Button variant="primary" size="sm" onClick={onNewTask}>
          <Plus className="mr-1 h-4 w-4" />
          New Task
        </Button>
      </div>
    </div>
  );
}

/**
 * Main content area showing tasks
 */
export function ProjectDetailContent({
  isLoading,
  tasks,
  onSelectTask,
  onTaskStatusChange,
  onNewTask,
}: ProjectDetailContentProps) {
  if (isLoading) {
    return (
      <div className="flex-1 overflow-auto p-6">
        <div className="flex flex-col gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <SkeletonTaskCard key={`skeleton-tasks-${i}`} />
          ))}
        </div>
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <div className="flex-1 overflow-auto p-6">
        <div className="flex h-full flex-col items-center justify-center">
          <h3 className="text-lg font-medium text-[rgb(var(--foreground))]">No tasks yet</h3>
          <p className="mt-2 text-sm text-[rgb(var(--muted-foreground))]">
            Create your first task to get started.
          </p>
          <Button variant="primary" className="mt-4" onClick={onNewTask}>
            <Plus className="mr-2 h-4 w-4" />
            Create Task
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto p-6">
      <TaskList tasks={tasks} onSelectTask={onSelectTask} onStatusChange={onTaskStatusChange} />
    </div>
  );
}

/**
 * Dialog for creating a new task with workflow template selection
 */
export function ProjectCreateTaskDialog({
  isOpen,
  taskTitle,
  taskDescription,
  selectedWorkflow,
  workflows,
  isLoadingWorkflows,
  isCreating,
  error,
  onClose,
  onCreate,
  onTitleChange,
  onDescriptionChange,
  onWorkflowSelect,
}: ProjectCreateTaskDialogProps) {
  return (
    <Dialog isOpen={isOpen} onClose={onClose} title="Create New Task">
      <div className="space-y-4">
        <FormField
          label="Task Title"
          required
          {...(!taskTitle.trim() && error ? { error: 'Required' } : {})}
        >
          <Input
            value={taskTitle}
            onChange={(e) => onTitleChange(e.target.value)}
            placeholder="e.g., Implement user authentication"
            autoFocus
          />
        </FormField>

        <FormField label="Description">
          <Textarea
            value={taskDescription}
            onChange={(e) => onDescriptionChange(e.target.value)}
            placeholder="Describe what needs to be done..."
            rows={3}
          />
        </FormField>

        {/* Workflow template selector */}
        <div className="space-y-2">
          <Label>Workflow Template (optional)</Label>
          <WorkflowSelector
            workflows={workflows}
            selectedWorkflow={selectedWorkflow}
            onSelectWorkflow={onWorkflowSelect}
            loading={isLoadingWorkflows}
            disabled={isCreating}
          />
        </div>

        {/* Preview selected workflow */}
        {selectedWorkflow && (
          <div className="rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--surface-1))] p-4">
            <WorkflowPreview workflow={selectedWorkflow} maxSteps={5} showDescriptions />
          </div>
        )}

        {error && <p className="text-sm text-error">{error}</p>}

        <div className="flex justify-end gap-2 pt-4">
          <Button variant="ghost" onClick={onClose} disabled={isCreating}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={onCreate}
            loading={isCreating}
            loadingText="Creating..."
          >
            Create Task
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
