/**
 * TaskPage - Stateless Page Component for the Task Detail View
 *
 * This is a top-level stateless component that composes the entire task detail view.
 * It receives all required data and callbacks via props, making it fully
 * testable in Storybook with mocked data representing different page states.
 *
 * The component composes:
 * - TaskLayout (header with title/status, tabs, split pane layout)
 * - TaskStepsPanel (workflow steps sidebar)
 * - TaskMainPanel (output display and chat input)
 * - TaskArtifactsTab (artifacts list tab content)
 * - TaskChangesTab (diff viewer tab content)
 * - TaskCommitsTab (commit list tab content)
 * - AddStepDialog (dialog for adding new workflow steps)
 * - ArtifactPreviewDialog (preview file contents)
 * - EntityContextMenu (more actions menu)
 * - ConfirmDialog (confirmation for destructive actions)
 * - SkeletonTaskDetail (loading state)
 * - TaskNotFound (not found state)
 */

import type {
  Chat,
  Commit,
  ExecutorProfile,
  FileDiff,
  Message,
  Task,
  TaskStatus,
  WorkflowStep,
} from '@openflow/generated';
import type { LucideIcon } from 'lucide-react';
import { EntityContextMenu, SkeletonTaskDetail } from '../molecules';
import type { MenuPosition } from '../molecules/Menu';
import type { Tab } from '../molecules/Tabs';
import {
  AddStepDialog,
  ArtifactPreviewDialog,
  ConfirmDialog,
  TaskArtifactsTab,
  TaskChangesTab,
  TaskCommitsTab,
  TaskMainPanel,
  TaskNotFound,
  TaskStepsPanel,
} from '../organisms';
import type { ArtifactFile } from '../organisms/ArtifactsPanel';
import type { ClaudeEvent } from '../organisms/ClaudeEventRenderer';
import { TaskLayout } from '../templates';

// ============================================================================
// Types
// ============================================================================

/** Props for the task header section */
export interface TaskPageHeaderProps {
  /** Callback when back button is clicked */
  onBack: () => void;
  /** Callback when status changes */
  onStatusChange: (status: TaskStatus) => void;
  /** Callback when title edit mode is toggled */
  onTitleEditToggle: () => void;
  /** Whether title is currently being edited */
  isTitleEditing: boolean;
  /** Title input value when editing */
  titleInputValue: string;
  /** Callback when title input changes */
  onTitleInputChange: (value: string) => void;
  /** Callback when title edit is submitted */
  onTitleEditSubmit: () => void;
  /** Callback when title edit is cancelled */
  onTitleEditCancel: () => void;
  /** Callback to create PR (only shown if task has a branch) */
  onCreatePR?: () => void;
  /** Callback for more actions menu */
  onMoreActions: () => void;
}

/** Tab with icon for the tabs bar */
export interface TaskPageTab {
  /** Unique identifier for the tab */
  id: string;
  /** Display label */
  label: string;
  /** Optional icon */
  icon?: LucideIcon;
  /** Optional badge count */
  badge?: number;
}

/** Props for the tabs section */
export interface TaskPageTabsProps {
  /** Available tabs */
  tabs: TaskPageTab[];
  /** Currently active tab ID */
  activeTab: string;
  /** Callback when tab changes */
  onTabChange: (tabId: string) => void;
}

/** Props for the steps panel section */
export interface TaskPageStepsPanelProps {
  /** Workflow steps */
  steps: WorkflowStep[];
  /** Index of the currently active step */
  activeStepIndex: number;
  /** Callback to start a step */
  onStartStep: (stepIndex: number) => void;
  /** Callback to toggle step completion */
  onToggleStep: (stepIndex: number, completed: boolean) => void;
  /** Callback when a step is selected */
  onSelectStep: (stepIndex: number) => void;
  /** Callback to add a new step */
  onAddStep: () => void;
  /** Whether auto-start is enabled */
  autoStart: boolean;
  /** Callback when auto-start changes */
  onAutoStartChange: (value: boolean) => void;
}

/** Props for the main panel section */
export interface TaskPageMainPanelProps {
  /** Claude streaming events */
  claudeEvents: ClaudeEvent[];
  /** Raw output lines */
  rawOutput: string[];
  /** Whether an executor is running */
  isRunning: boolean;
  /** Whether to show raw output view */
  showRawOutput: boolean;
  /** Callback to toggle raw output view */
  onToggleRawOutput: () => void;
  /** Chat messages */
  messages: Message[];
  /** Callback to send a message */
  onSendMessage: (content: string) => void;
  /** Whether a message is being processed */
  isProcessing: boolean;
  /** Callback to stop the process */
  onStopProcess: () => void;
  /** Available executor profiles */
  executorProfiles: ExecutorProfile[];
  /** Currently selected executor profile ID */
  selectedExecutorProfileId: string;
}

/** Props for the artifacts tab section */
export interface TaskPageArtifactsTabProps {
  /** List of artifacts */
  artifacts: ArtifactFile[];
  /** Whether artifacts are loading */
  loading: boolean;
  /** Callback to open an artifact in external editor */
  onOpenArtifact: (artifact: ArtifactFile) => void;
  /** Callback to preview an artifact */
  onPreviewArtifact: (artifact: ArtifactFile) => void;
}

/** Props for the changes tab section */
export interface TaskPageChangesTabProps {
  /** File diffs */
  diffs: FileDiff[];
  /** Set of expanded file paths */
  expandedFiles: Set<string>;
  /** Callback when a file is toggled */
  onFileToggle: (path: string) => void;
}

/** Props for the commits tab section */
export interface TaskPageCommitsTabProps {
  /** List of commits */
  commits: Commit[];
  /** Set of expanded commit hashes */
  expandedCommits: Set<string>;
  /** Callback when a commit is toggled */
  onCommitToggle: (hash: string) => void;
  /** Callback to view a commit */
  onViewCommit: (hash: string) => void;
}

/** Props for the add step dialog */
export interface TaskPageAddStepDialogProps {
  /** Whether dialog is open */
  isOpen: boolean;
  /** Callback to close dialog */
  onClose: () => void;
  /** Current step title value */
  title: string;
  /** Current step description value */
  description: string;
  /** Callback when title changes */
  onTitleChange: (value: string) => void;
  /** Callback when description changes */
  onDescriptionChange: (value: string) => void;
  /** Callback to create step (with startImmediately flag) */
  onCreateStep: (startImmediately: boolean) => void;
  /** Whether step creation is in progress */
  isCreating: boolean;
}

/** Props for the artifact preview dialog */
export interface TaskPageArtifactPreviewDialogProps {
  /** Whether dialog is open */
  isOpen: boolean;
  /** Callback to close dialog */
  onClose: () => void;
  /** Name of the file being previewed */
  fileName: string;
  /** Content of the file */
  content: string | null;
  /** Whether content is loading */
  loading: boolean;
}

/** Props for the more actions menu */
export interface TaskPageMoreMenuProps {
  /** Whether menu is open */
  isOpen: boolean;
  /** Menu position */
  position: MenuPosition;
  /** Callback to close menu */
  onClose: () => void;
  /** Callback to archive the task */
  onArchive: () => void;
  /** Callback to delete the task */
  onDelete: () => void;
}

/** Props for the confirm dialog */
export interface TaskPageConfirmDialogProps {
  /** Whether dialog is open */
  isOpen: boolean;
  /** Callback to close dialog */
  onClose: () => void;
  /** Callback when confirmed */
  onConfirm: () => void;
  /** Dialog title */
  title: string;
  /** Dialog description */
  description: string;
  /** Confirm button label */
  confirmLabel?: string;
  /** Cancel button label */
  cancelLabel?: string;
  /** Visual variant */
  variant?: 'default' | 'destructive' | 'warning';
  /** Whether confirm action is in progress */
  loading?: boolean;
}

/**
 * Complete props for the TaskPage component.
 *
 * This interface defines all data and callbacks needed to render the task detail page.
 * The route component is responsible for providing these props from hooks.
 */
export interface TaskPageProps {
  /** Page state: 'loading' | 'not-found' | 'ready' */
  state: 'loading' | 'not-found' | 'ready';

  /** Callback for not-found back button (only needed when state is 'not-found') */
  onNotFoundBack?: () => void;

  // The following props are only required when state is 'ready'

  /** The task being displayed */
  task?: Task;

  /** Chats associated with this task */
  chats?: Chat[];

  /** Header props */
  header?: TaskPageHeaderProps;

  /** Tabs props */
  tabs?: TaskPageTabsProps;

  /** Steps panel props */
  stepsPanel?: TaskPageStepsPanelProps;

  /** Main panel props */
  mainPanel?: TaskPageMainPanelProps;

  /** Artifacts tab props */
  artifactsTab?: TaskPageArtifactsTabProps;

  /** Changes tab props */
  changesTab?: TaskPageChangesTabProps;

  /** Commits tab props */
  commitsTab?: TaskPageCommitsTabProps;

  /** Add step dialog props */
  addStepDialog?: TaskPageAddStepDialogProps;

  /** Artifact preview dialog props */
  artifactPreviewDialog?: TaskPageArtifactPreviewDialogProps;

  /** More actions menu props */
  moreMenu?: TaskPageMoreMenuProps;

  /** Confirm dialog props */
  confirmDialog?: TaskPageConfirmDialogProps;
}

// ============================================================================
// Component
// ============================================================================

/**
 * TaskPage - Complete stateless task detail page component.
 *
 * This component receives all data and callbacks via props. It is purely
 * presentational, making it fully testable in Storybook with mocked data.
 *
 * @example
 * ```tsx
 * // In route component
 * function TaskDetailRoute() {
 *   const { taskId } = Route.useParams();
 *   const navigate = useNavigate();
 *   const toast = useToast();
 *
 *   const session = useTaskSession({
 *     taskId,
 *     onSuccess: (title, message) => toast.success(title, message),
 *     onError: (title, message) => toast.error(title, message),
 *     onNavigate: (path, params) => navigate({ to: path, params }),
 *   });
 *
 *   // Loading state
 *   if (session.isLoadingTask) {
 *     return <TaskPage state="loading" />;
 *   }
 *
 *   // Not found state
 *   if (!session.task) {
 *     return (
 *       <TaskPage
 *         state="not-found"
 *         onNotFoundBack={() => navigate({ to: '/' })}
 *       />
 *     );
 *   }
 *
 *   // Ready state
 *   return (
 *     <TaskPage
 *       state="ready"
 *       task={session.task}
 *       chats={session.chats}
 *       header={{
 *         onBack: session.handleBack,
 *         onStatusChange: session.handleStatusChange,
 *         // ... other header props
 *       }}
 *       tabs={{
 *         tabs: tabsWithIcons,
 *         activeTab: session.activeTab,
 *         onTabChange: session.setActiveTab,
 *       }}
 *       stepsPanel={{
 *         steps: session.workflowSteps,
 *         activeStepIndex: session.activeStepIndex,
 *         // ... other steps panel props
 *       }}
 *       mainPanel={{
 *         claudeEvents: session.claudeEvents,
 *         messages: session.messages ?? [],
 *         // ... other main panel props
 *       }}
 *       artifactsTab={{
 *         artifacts: session.artifacts,
 *         loading: session.isLoadingArtifacts,
 *         // ... other artifacts tab props
 *       }}
 *       changesTab={{
 *         diffs: session.diffs,
 *         expandedFiles: session.expandedDiffFiles,
 *         onFileToggle: session.handleFileToggle,
 *       }}
 *       commitsTab={{
 *         commits: session.commits,
 *         expandedCommits: session.expandedCommits,
 *         onCommitToggle: session.handleCommitToggle,
 *         onViewCommit: session.handleViewCommit,
 *       }}
 *       addStepDialog={{
 *         isOpen: session.addStepDialog.isOpen,
 *         // ... other add step dialog props
 *       }}
 *       artifactPreviewDialog={{
 *         isOpen: session.previewArtifact !== null,
 *         // ... other preview dialog props
 *       }}
 *       moreMenu={{
 *         isOpen: session.moreMenuState.isOpen,
 *         position: session.moreMenuState.position,
 *         // ... other menu props
 *       }}
 *       confirmDialog={session.confirmDialogProps}
 *     />
 *   );
 * }
 * ```
 */
export function TaskPage({
  state,
  onNotFoundBack,
  task,
  chats,
  header,
  tabs,
  stepsPanel,
  mainPanel,
  artifactsTab,
  changesTab,
  commitsTab,
  addStepDialog,
  artifactPreviewDialog,
  moreMenu,
  confirmDialog,
}: TaskPageProps) {
  // Loading state
  if (state === 'loading') {
    return <SkeletonTaskDetail />;
  }

  // Not found state
  if (state === 'not-found') {
    return <TaskNotFound onBack={onNotFoundBack ?? (() => {})} />;
  }

  // Ready state - all props should be defined
  if (!task || !chats || !header || !tabs || !stepsPanel || !mainPanel) {
    // Fallback if props are missing in ready state (shouldn't happen in practice)
    return <TaskNotFound onBack={onNotFoundBack ?? (() => {})} />;
  }

  // Render tab content based on active tab
  const renderTabContent = () => {
    switch (tabs.activeTab) {
      case 'artifacts':
        if (!artifactsTab) return null;
        return (
          <TaskArtifactsTab
            artifacts={artifactsTab.artifacts}
            loading={artifactsTab.loading}
            onOpenArtifact={artifactsTab.onOpenArtifact}
            onPreviewArtifact={artifactsTab.onPreviewArtifact}
          />
        );
      case 'changes':
        if (!changesTab) return null;
        return (
          <TaskChangesTab
            diffs={changesTab.diffs}
            expandedFiles={changesTab.expandedFiles}
            onFileToggle={changesTab.onFileToggle}
          />
        );
      case 'commits':
        if (!commitsTab) return null;
        return (
          <TaskCommitsTab
            commits={commitsTab.commits}
            expandedCommits={commitsTab.expandedCommits}
            onCommitToggle={commitsTab.onCommitToggle}
            onViewCommit={commitsTab.onViewCommit}
          />
        );
      default:
        return null;
    }
  };

  return (
    <>
      <TaskLayout
        task={task}
        chats={chats}
        onBack={header.onBack}
        tabs={tabs.tabs as Tab[]}
        activeTab={tabs.activeTab}
        onTabChange={tabs.onTabChange}
        onStatusChange={header.onStatusChange}
        onTitleEditToggle={header.onTitleEditToggle}
        isTitleEditing={header.isTitleEditing}
        titleInputValue={header.titleInputValue}
        onTitleInputChange={header.onTitleInputChange}
        onTitleEditSubmit={header.onTitleEditSubmit}
        onTitleEditCancel={header.onTitleEditCancel}
        {...(header.onCreatePR && { onCreatePR: header.onCreatePR })}
        onMoreActions={header.onMoreActions}
        stepsPanel={
          <TaskStepsPanel
            steps={stepsPanel.steps}
            activeStepIndex={stepsPanel.activeStepIndex}
            onStartStep={stepsPanel.onStartStep}
            onToggleStep={stepsPanel.onToggleStep}
            onSelectStep={stepsPanel.onSelectStep}
            onAddStep={stepsPanel.onAddStep}
            autoStart={stepsPanel.autoStart}
            onAutoStartChange={stepsPanel.onAutoStartChange}
          />
        }
        mainPanel={
          <TaskMainPanel
            claudeEvents={mainPanel.claudeEvents}
            rawOutput={mainPanel.rawOutput}
            isRunning={mainPanel.isRunning}
            showRawOutput={mainPanel.showRawOutput}
            onToggleRawOutput={mainPanel.onToggleRawOutput}
            messages={mainPanel.messages}
            onSendMessage={mainPanel.onSendMessage}
            isProcessing={mainPanel.isProcessing}
            onStopProcess={mainPanel.onStopProcess}
            executorProfiles={mainPanel.executorProfiles}
            selectedExecutorProfileId={mainPanel.selectedExecutorProfileId}
          />
        }
        tabContent={renderTabContent()}
      />

      {/* Add Step Dialog */}
      {addStepDialog && (
        <AddStepDialog
          isOpen={addStepDialog.isOpen}
          onClose={addStepDialog.onClose}
          title={addStepDialog.title}
          description={addStepDialog.description}
          onTitleChange={addStepDialog.onTitleChange}
          onDescriptionChange={addStepDialog.onDescriptionChange}
          onCreateStep={addStepDialog.onCreateStep}
          isCreating={addStepDialog.isCreating}
        />
      )}

      {/* Artifact Preview Dialog */}
      {artifactPreviewDialog && (
        <ArtifactPreviewDialog
          isOpen={artifactPreviewDialog.isOpen}
          onClose={artifactPreviewDialog.onClose}
          fileName={artifactPreviewDialog.fileName}
          content={artifactPreviewDialog.content}
          loading={artifactPreviewDialog.loading}
        />
      )}

      {/* More actions context menu */}
      {moreMenu && (
        <EntityContextMenu
          entityType="task"
          isOpen={moreMenu.isOpen}
          position={moreMenu.position}
          onClose={moreMenu.onClose}
          onArchive={moreMenu.onArchive}
          onDelete={moreMenu.onDelete}
        />
      )}

      {/* Confirm dialog */}
      {confirmDialog && (
        <ConfirmDialog
          isOpen={confirmDialog.isOpen}
          onClose={confirmDialog.onClose}
          onConfirm={confirmDialog.onConfirm}
          title={confirmDialog.title}
          description={confirmDialog.description}
          confirmLabel={confirmDialog.confirmLabel}
          cancelLabel={confirmDialog.cancelLabel}
          variant={confirmDialog.variant}
          loading={confirmDialog.loading}
        />
      )}
    </>
  );
}

TaskPage.displayName = 'TaskPage';
