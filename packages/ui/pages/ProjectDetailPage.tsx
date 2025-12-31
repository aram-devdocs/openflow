/**
 * ProjectDetailPage - Stateless Page Component for the Project Detail View
 *
 * This is a top-level stateless component that composes the entire project detail view.
 * It receives all required data and callbacks via props, making it fully
 * testable in Storybook with mocked data representing different page states.
 *
 * The component composes:
 * - ProjectDetailLayout (sidebar + header + main content)
 * - ProjectDetailSidebar (project/task navigation)
 * - ProjectDetailHeader (project name, actions)
 * - ProjectDetailInfoBar (breadcrumb and quick actions)
 * - ProjectDetailContent (task list)
 * - ProjectCreateTaskDialog (create task with workflow)
 * - Loading and not-found states
 */

import type { Project, Task, TaskStatus, WorkflowTemplate } from '@openflow/generated';
import {
  ProjectCreateTaskDialog,
  ProjectDetailContent,
  ProjectDetailHeader,
  ProjectDetailInfoBar,
  ProjectDetailLayout,
  ProjectDetailLoadingSkeleton,
  ProjectDetailSidebar,
  ProjectNotFound,
} from '../organisms/ProjectDetailPageComponents';
import type { StatusFilter } from '../organisms/Sidebar';

// ============================================================================
// Types
// ============================================================================

/** Props for the sidebar section */
export interface ProjectDetailPageSidebarProps {
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

/** Props for the header section */
export interface ProjectDetailPageHeaderProps {
  /** Callback for search */
  onSearch: () => void;
  /** Callback for new task */
  onNewTask: () => void;
}

/** Props for the info bar section */
export interface ProjectDetailPageInfoBarProps {
  /** Callback to go back */
  onBack: () => void;
  /** Callback for settings */
  onSettings: () => void;
  /** Callback for new task */
  onNewTask: () => void;
}

/** Props for the content section */
export interface ProjectDetailPageContentProps {
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

/** Props for the create task dialog */
export interface ProjectDetailPageCreateTaskDialogProps {
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

/**
 * Complete props for the ProjectDetailPage component.
 *
 * This interface defines all data and callbacks needed to render the project detail page.
 * The route component is responsible for providing these props from hooks.
 */
export interface ProjectDetailPageProps {
  /** Page state: 'loading' | 'not-found' | 'ready' */
  state: 'loading' | 'not-found' | 'ready';

  /** Callback for not-found back button (only needed when state is 'not-found') */
  onNotFoundBack?: () => void;

  /** Callback for search (used in loading/not-found states too) */
  onSearch?: () => void;

  // The following props are only required when state is 'ready'

  /** The project being displayed */
  project?: Project;

  /** Whether sidebar is collapsed */
  sidebarCollapsed?: boolean;

  /** Sidebar props */
  sidebar?: ProjectDetailPageSidebarProps;

  /** Header props */
  header?: ProjectDetailPageHeaderProps;

  /** Info bar props */
  infoBar?: ProjectDetailPageInfoBarProps;

  /** Content props */
  content?: ProjectDetailPageContentProps;

  /** Create task dialog props */
  createTaskDialog?: ProjectDetailPageCreateTaskDialogProps;
}

// ============================================================================
// Component
// ============================================================================

/**
 * ProjectDetailPage - Complete stateless project detail page component.
 *
 * This component receives all data and callbacks via props. It is purely
 * presentational, making it fully testable in Storybook with mocked data.
 *
 * @example
 * ```tsx
 * // In route component
 * function ProjectDetailRoute() {
 *   const { projectId } = Route.useParams();
 *   const navigate = useNavigate();
 *
 *   const session = useProjectDetailSession({
 *     projectId,
 *     navigate: ({ to, params }) => navigate({ to, params }),
 *   });
 *
 *   // Loading state
 *   if (session.isLoadingProject) {
 *     return (
 *       <ProjectDetailPage
 *         state="loading"
 *         onSearch={session.handleSearch}
 *       />
 *     );
 *   }
 *
 *   // Not found state
 *   if (!session.project) {
 *     return (
 *       <ProjectDetailPage
 *         state="not-found"
 *         onNotFoundBack={session.handleBackToProjects}
 *         onSearch={session.handleSearch}
 *       />
 *     );
 *   }
 *
 *   // Ready state
 *   return (
 *     <ProjectDetailPage
 *       state="ready"
 *       project={session.project}
 *       sidebarCollapsed={session.sidebarCollapsed}
 *       sidebar={{
 *         projects: session.projects,
 *         tasks: session.tasks,
 *         projectId,
 *         statusFilter: session.statusFilter,
 *         isCollapsed: session.sidebarCollapsed,
 *         // ... other sidebar props
 *       }}
 *       header={{
 *         onSearch: session.handleSearch,
 *         onNewTask: session.handleNewTask,
 *       }}
 *       infoBar={{
 *         onBack: session.handleBackToProjects,
 *         onSettings: session.handleProjectSettings,
 *         onNewTask: session.handleNewTask,
 *       }}
 *       content={{
 *         isLoading: session.isLoadingTasks,
 *         tasks: session.filteredTasks,
 *         onSelectTask: session.handleSelectTask,
 *         onTaskStatusChange: session.handleTaskStatusChange,
 *         onNewTask: session.handleNewTask,
 *       }}
 *       createTaskDialog={{
 *         isOpen: session.isCreateTaskDialogOpen,
 *         // ... other dialog props
 *       }}
 *     />
 *   );
 * }
 * ```
 */
export function ProjectDetailPage({
  state,
  onNotFoundBack,
  onSearch,
  project,
  sidebarCollapsed,
  sidebar,
  header,
  infoBar,
  content,
  createTaskDialog,
}: ProjectDetailPageProps) {
  // Loading state
  if (state === 'loading') {
    return <ProjectDetailLoadingSkeleton onSearch={onSearch} />;
  }

  // Not found state
  if (state === 'not-found') {
    return (
      <ProjectNotFound onBack={onNotFoundBack ?? (() => {})} onSearch={onSearch ?? (() => {})} />
    );
  }

  // Ready state - all props should be defined
  if (!project || !sidebar || !header || !infoBar || !content) {
    // Fallback if props are missing in ready state (shouldn't happen in practice)
    return (
      <ProjectNotFound onBack={onNotFoundBack ?? (() => {})} onSearch={onSearch ?? (() => {})} />
    );
  }

  return (
    <ProjectDetailLayout
      sidebarCollapsed={sidebarCollapsed ?? false}
      sidebar={
        <ProjectDetailSidebar
          projects={sidebar.projects}
          tasks={sidebar.tasks}
          projectId={sidebar.projectId}
          statusFilter={sidebar.statusFilter}
          isCollapsed={sidebar.isCollapsed}
          onSelectProject={sidebar.onSelectProject}
          onSelectTask={sidebar.onSelectTask}
          onNewTask={sidebar.onNewTask}
          onNewProject={sidebar.onNewProject}
          onStatusFilter={sidebar.onStatusFilter}
          onTaskStatusChange={sidebar.onTaskStatusChange}
          onSettingsClick={sidebar.onSettingsClick}
          onArchiveClick={sidebar.onArchiveClick}
          onToggleCollapse={sidebar.onToggleCollapse}
        />
      }
      header={
        <ProjectDetailHeader
          project={project}
          onSearch={header.onSearch}
          onNewTask={header.onNewTask}
        />
      }
    >
      <div className="flex h-full flex-col">
        <ProjectDetailInfoBar
          project={project}
          onBack={infoBar.onBack}
          onSettings={infoBar.onSettings}
          onNewTask={infoBar.onNewTask}
        />
        <ProjectDetailContent
          isLoading={content.isLoading}
          tasks={content.tasks}
          onSelectTask={content.onSelectTask}
          onTaskStatusChange={content.onTaskStatusChange}
          onNewTask={content.onNewTask}
        />
      </div>

      {createTaskDialog && (
        <ProjectCreateTaskDialog
          isOpen={createTaskDialog.isOpen}
          taskTitle={createTaskDialog.taskTitle}
          taskDescription={createTaskDialog.taskDescription}
          selectedWorkflow={createTaskDialog.selectedWorkflow}
          workflows={createTaskDialog.workflows}
          isLoadingWorkflows={createTaskDialog.isLoadingWorkflows}
          isCreating={createTaskDialog.isCreating}
          error={createTaskDialog.error}
          onClose={createTaskDialog.onClose}
          onCreate={createTaskDialog.onCreate}
          onTitleChange={createTaskDialog.onTitleChange}
          onDescriptionChange={createTaskDialog.onDescriptionChange}
          onWorkflowSelect={createTaskDialog.onWorkflowSelect}
        />
      )}
    </ProjectDetailLayout>
  );
}

ProjectDetailPage.displayName = 'ProjectDetailPage';
