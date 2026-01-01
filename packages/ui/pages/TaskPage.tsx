/**
 * TaskPage - Stateless Page Component for the Task Detail View
 *
 * This is a top-level stateless component that composes the entire task detail view.
 * It receives all required data and callbacks via props, making it fully
 * testable in Storybook with mocked data representing different page states.
 *
 * Features:
 * - Uses atoms/molecules/organisms only (no raw HTML elements)
 * - Loading skeleton via TaskPageSkeleton (SkeletonTaskDetail)
 * - Error state via TaskPageError with retry functionality
 * - Not found state via TaskNotFound
 * - Document title handling via aria-label
 * - Responsive layout via ResponsiveValue
 * - Full accessibility compliance (WCAG 2.1 AA)
 * - forwardRef support for all components
 * - axe-core compliant
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
import type { Breakpoint, ResponsiveValue } from '@openflow/primitives';
import { Box, Flex, Heading, Text, VisuallyHidden } from '@openflow/primitives';
import { cn } from '@openflow/utils';
import { AlertTriangle, type LucideIcon, RefreshCw } from 'lucide-react';
import { type HTMLAttributes, forwardRef, useId } from 'react';
import { Button } from '../atoms/Button';
import { Icon } from '../atoms/Icon';
import { EntityContextMenu, SkeletonTaskDetail } from '../molecules';
import type { MenuPosition } from '../molecules/Menu';
import type { Tab } from '../molecules/Tabs';
import {
  AddStepDialog,
  ArtifactPreviewDialog,
  ConfirmDialog,
  CreatePRDialog,
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

/** Task page size variants for responsive layouts */
export type TaskPageSize = 'sm' | 'md' | 'lg';

/** Breakpoint names for responsive values */
export type TaskPageBreakpoint = Breakpoint;

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
  /** Callback when a step is marked as complete via the Complete button */
  onCompleteStep?: (stepIndex: number) => void;
  /** Callback when a step is skipped via the Skip button */
  onSkipStep?: (stepIndex: number) => void;
  /** Callback when View Chat button is clicked */
  onViewChat?: (chatId: string) => void;
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

/** Props for the create PR dialog */
export interface TaskPageCreatePRDialogProps {
  /** Whether dialog is open */
  isOpen: boolean;
  /** Callback to close dialog */
  onClose: () => void;
  /** Callback when a PR is created */
  onCreate: (data: {
    title: string;
    body: string;
    base?: string;
    draft?: boolean;
  }) => void;
  /** Pre-filled title (usually from task title) */
  defaultTitle?: string;
  /** Pre-filled body (optional) */
  defaultBody?: string;
  /** Base branch for the PR (e.g., "main", "develop") */
  defaultBase?: string;
  /** Whether the dialog is in a loading/submitting state */
  isSubmitting?: boolean;
  /** Error message to display */
  error?: string | null;
  /** Whether GitHub CLI is installed */
  ghCliInstalled?: boolean;
  /** Whether user is authenticated with GitHub */
  ghAuthenticated?: boolean;
}

/** Props for the TaskPageSkeleton sub-component */
export interface TaskPageSkeletonProps
  extends Omit<HTMLAttributes<HTMLDivElement>, 'children' | 'content' | 'title'> {
  /** Number of skeleton messages to show */
  messageCount?: number;
  /** Number of skeleton steps to show */
  stepCount?: number;
  /** Whether to show steps panel */
  showStepsPanel?: boolean;
  /** Responsive size */
  size?: ResponsiveValue<TaskPageSize>;
  /** Data attribute for testing */
  'data-testid'?: string;
}

/** Props for the TaskPageError sub-component */
export interface TaskPageErrorProps
  extends Omit<HTMLAttributes<HTMLDivElement>, 'children' | 'content' | 'title'> {
  /** Error message to display */
  message?: string;
  /** Callback when retry button is clicked */
  onRetry?: () => void;
  /** Callback when back button is clicked */
  onBack?: () => void;
  /** Responsive size */
  size?: ResponsiveValue<TaskPageSize>;
  /** Data attribute for testing */
  'data-testid'?: string;
}

/**
 * Complete props for the TaskPage component.
 *
 * This interface defines all data and callbacks needed to render the task detail page.
 * The route component is responsible for providing these props from hooks.
 */
export interface TaskPageProps
  extends Omit<HTMLAttributes<HTMLDivElement>, 'children' | 'content' | 'title'> {
  /** Page state: 'loading' | 'not-found' | 'error' | 'ready' */
  state: 'loading' | 'not-found' | 'error' | 'ready';

  /** Error message (only for error state) */
  errorMessage?: string;

  /** Callback for error retry button */
  onErrorRetry?: () => void;

  /** Callback for not-found back button (only needed when state is 'not-found') */
  onNotFoundBack?: () => void;

  /** Responsive size */
  size?: ResponsiveValue<TaskPageSize>;

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

  /** Create PR dialog props */
  createPRDialog?: TaskPageCreatePRDialogProps;

  /** Data attribute for testing */
  'data-testid'?: string;
}

// ============================================================================
// Constants - Labels
// ============================================================================

/** Default number of skeleton messages */
export const DEFAULT_SKELETON_MESSAGE_COUNT = 3;

/** Default number of skeleton steps */
export const DEFAULT_SKELETON_STEP_COUNT = 4;

/** Default page size */
export const DEFAULT_PAGE_SIZE: TaskPageSize = 'md';

/** Default page label for screen readers */
export const DEFAULT_PAGE_LABEL = 'Task detail page';

/** Default error title */
export const DEFAULT_ERROR_TITLE = 'Failed to load task';

/** Default error description */
export const DEFAULT_ERROR_DESCRIPTION = 'There was a problem loading this task. Please try again.';

/** Default retry button label */
export const DEFAULT_RETRY_LABEL = 'Retry';

/** Default back button label */
export const DEFAULT_BACK_LABEL = 'Back to Dashboard';

// ============================================================================
// Constants - Screen Reader
// ============================================================================

/** Screen reader announcement for loading */
export const SR_LOADING = 'Loading task details';

/** Screen reader announcement for not found */
export const SR_NOT_FOUND = 'Task not found';

/** Screen reader announcement prefix for error */
export const SR_ERROR_PREFIX = 'Error loading task:';

/** Screen reader announcement for ready state */
export const SR_READY_PREFIX = 'Task loaded:';

/** Screen reader announcement for running state */
export const SR_RUNNING = 'Executor is running';

/** Screen reader announcement for processing */
export const SR_PROCESSING = 'Processing message';

// ============================================================================
// Constants - CSS Classes
// ============================================================================

/** Breakpoint order for responsive class generation */
const BREAKPOINT_ORDER: TaskPageBreakpoint[] = ['base', 'sm', 'md', 'lg', 'xl', '2xl'];

/** Base classes for task page container */
export const TASK_PAGE_BASE_CLASSES = 'flex h-full w-full flex-col';

/** Task page error classes */
export const TASK_PAGE_ERROR_CLASSES =
  'flex h-full flex-col items-center justify-center bg-background';

/** Error padding by size */
export const TASK_PAGE_ERROR_PADDING: Record<TaskPageSize, string> = {
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
};

/** Error icon classes by size */
export const TASK_PAGE_ERROR_ICON_CLASSES: Record<TaskPageSize, string> = {
  sm: 'mb-3 h-10 w-10',
  md: 'mb-4 h-12 w-12',
  lg: 'mb-4 h-14 w-14',
};

/** Error text classes by size */
export const TASK_PAGE_ERROR_TEXT_CLASSES: Record<TaskPageSize, string> = {
  sm: 'text-base',
  md: 'text-lg',
  lg: 'text-xl',
};

/** Error message classes by size */
export const TASK_PAGE_ERROR_MESSAGE_CLASSES: Record<TaskPageSize, string> = {
  sm: 'mt-1.5 text-xs max-w-xs',
  md: 'mt-2 text-sm max-w-sm',
  lg: 'mt-2 text-base max-w-md',
};

/** Error button margin classes by size */
export const TASK_PAGE_ERROR_BUTTON_MARGIN_CLASSES: Record<TaskPageSize, string> = {
  sm: 'mt-3',
  md: 'mt-4',
  lg: 'mt-4',
};

/** Page size padding */
export const PAGE_SIZE_PADDING: Record<TaskPageSize, string> = {
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-6',
};

/** Page size gap */
export const PAGE_SIZE_GAP: Record<TaskPageSize, string> = {
  sm: 'gap-3',
  md: 'gap-4',
  lg: 'gap-6',
};

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Get base size from ResponsiveValue (first value)
 */
export function getBaseSize(size: ResponsiveValue<TaskPageSize>): TaskPageSize {
  if (typeof size === 'string') {
    return size;
  }
  return size.base ?? size.sm ?? size.md ?? size.lg ?? size.xl ?? size['2xl'] ?? DEFAULT_PAGE_SIZE;
}

/**
 * Generate responsive classes from a size map
 */
export function getResponsiveSizeClasses(
  size: ResponsiveValue<TaskPageSize>,
  classMap: Record<TaskPageSize, string>
): string {
  if (typeof size === 'string') {
    return classMap[size];
  }

  const classes: string[] = [];

  for (const bp of BREAKPOINT_ORDER) {
    const sizeValue = size[bp as keyof typeof size];
    if (sizeValue) {
      const sizeClasses = classMap[sizeValue];
      if (bp === 'base') {
        classes.push(sizeClasses);
      } else {
        // Add breakpoint prefix to each class
        const prefixedClasses = sizeClasses
          .split(' ')
          .map((c) => `${bp}:${c}`)
          .join(' ');
        classes.push(prefixedClasses);
      }
    }
  }

  return classes.join(' ');
}

/**
 * Build accessible label for task page
 */
export function buildPageAccessibleLabel(taskTitle?: string, taskStatus?: string): string {
  if (!taskTitle) {
    return DEFAULT_PAGE_LABEL;
  }
  if (taskStatus) {
    return `Task: ${taskTitle}. Status: ${taskStatus}`;
  }
  return `Task: ${taskTitle}`;
}

/**
 * Build loaded announcement for screen readers
 */
export function buildLoadedAnnouncement(
  taskTitle: string,
  stepCount: number,
  activeTab: string
): string {
  return `${SR_READY_PREFIX} ${taskTitle}. ${stepCount} workflow ${stepCount === 1 ? 'step' : 'steps'}. Showing ${activeTab} tab.`;
}

// ============================================================================
// Sub-components
// ============================================================================

/**
 * TaskPageSkeleton - Loading skeleton for task page
 *
 * Uses SkeletonTaskDetail molecule for consistent loading appearance.
 */
export const TaskPageSkeleton = forwardRef<HTMLDivElement, TaskPageSkeletonProps>(
  (
    {
      messageCount = DEFAULT_SKELETON_MESSAGE_COUNT,
      stepCount = DEFAULT_SKELETON_STEP_COUNT,
      showStepsPanel = true,
      size = DEFAULT_PAGE_SIZE,
      className,
      'data-testid': testId,
    },
    ref
  ) => {
    const baseSize = getBaseSize(size);

    return (
      <Flex
        ref={ref}
        direction="column"
        role="status"
        aria-label={SR_LOADING}
        aria-busy={true}
        className={cn(TASK_PAGE_BASE_CLASSES, className)}
        data-testid={testId}
        data-state="loading"
        data-size={baseSize}
      >
        {/* Screen reader announcement */}
        <VisuallyHidden>
          <Box as="span" role="status" aria-live="polite">
            {SR_LOADING}
          </Box>
        </VisuallyHidden>

        <SkeletonTaskDetail
          messageCount={messageCount}
          stepCount={stepCount}
          showStepsPanel={showStepsPanel}
          size={baseSize}
          data-testid={testId ? `${testId}-skeleton` : undefined}
        />
      </Flex>
    );
  }
);

TaskPageSkeleton.displayName = 'TaskPageSkeleton';

/**
 * TaskPageError - Error state for task page
 *
 * Displays error message with retry option.
 */
export const TaskPageError = forwardRef<HTMLDivElement, TaskPageErrorProps>(
  (
    {
      message = DEFAULT_ERROR_DESCRIPTION,
      onRetry,
      onBack,
      size = DEFAULT_PAGE_SIZE,
      className,
      'data-testid': testId,
    },
    ref
  ) => {
    const headingId = useId();
    const messageId = useId();

    return (
      <Flex
        ref={ref}
        role="alert"
        aria-labelledby={headingId}
        aria-describedby={messageId}
        aria-live="assertive"
        direction="column"
        align="center"
        justify="center"
        className={cn(
          TASK_PAGE_ERROR_CLASSES,
          getResponsiveSizeClasses(size, TASK_PAGE_ERROR_PADDING),
          className
        )}
        data-testid={testId}
        data-state="error"
      >
        {/* Screen reader announcement */}
        <VisuallyHidden>
          <Box as="span" role="status" aria-live="assertive">
            {SR_ERROR_PREFIX} {message}
          </Box>
        </VisuallyHidden>

        <Icon
          icon={AlertTriangle}
          aria-hidden={true}
          className={cn(
            'text-destructive',
            getResponsiveSizeClasses(size, TASK_PAGE_ERROR_ICON_CLASSES)
          )}
        />

        <Heading
          id={headingId}
          level={2}
          className={cn(
            'text-foreground font-semibold',
            getResponsiveSizeClasses(size, TASK_PAGE_ERROR_TEXT_CLASSES)
          )}
        >
          {DEFAULT_ERROR_TITLE}
        </Heading>

        <Text
          id={messageId}
          className={cn(
            'text-muted-foreground text-center',
            getResponsiveSizeClasses(size, TASK_PAGE_ERROR_MESSAGE_CLASSES)
          )}
        >
          {message}
        </Text>

        <Flex
          gap="3"
          className={getResponsiveSizeClasses(size, TASK_PAGE_ERROR_BUTTON_MARGIN_CLASSES)}
        >
          {onBack && (
            <Button
              variant="ghost"
              onClick={onBack}
              className="min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0"
            >
              {DEFAULT_BACK_LABEL}
            </Button>
          )}
          {onRetry && (
            <Button
              variant="primary"
              onClick={onRetry}
              icon={<RefreshCw className="h-4 w-4" aria-hidden={true} />}
              className="min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0"
            >
              {DEFAULT_RETRY_LABEL}
            </Button>
          )}
        </Flex>
      </Flex>
    );
  }
);

TaskPageError.displayName = 'TaskPageError';

// ============================================================================
// Main Component
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
 *   // Error state
 *   if (session.error) {
 *     return (
 *       <TaskPage
 *         state="error"
 *         errorMessage={session.error.message}
 *         onErrorRetry={session.refetch}
 *         onNotFoundBack={() => navigate({ to: '/' })}
 *       />
 *     );
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
 *       // ... other props
 *     />
 *   );
 * }
 * ```
 */
export const TaskPage = forwardRef<HTMLDivElement, TaskPageProps>(
  (
    {
      state,
      errorMessage,
      onErrorRetry,
      onNotFoundBack,
      size = DEFAULT_PAGE_SIZE,
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
      createPRDialog,
      className,
      'data-testid': testId,
      ...props
    },
    ref
  ) => {
    const baseSize = getBaseSize(size);
    const accessibleLabel = buildPageAccessibleLabel(task?.title, task?.status);

    // Loading state
    if (state === 'loading') {
      return (
        <TaskPageSkeleton
          ref={ref}
          size={size}
          className={className}
          data-testid={testId}
          {...props}
        />
      );
    }

    // Error state
    if (state === 'error') {
      return (
        <TaskPageError
          ref={ref}
          message={errorMessage}
          onRetry={onErrorRetry}
          onBack={onNotFoundBack}
          size={size}
          className={className}
          data-testid={testId}
          {...props}
        />
      );
    }

    // Not found state
    if (state === 'not-found') {
      return (
        <Flex
          ref={ref}
          direction="column"
          className={cn(TASK_PAGE_BASE_CLASSES, className)}
          data-testid={testId}
          data-state="not-found"
        >
          {/* Screen reader announcement */}
          <VisuallyHidden>
            <Box as="span" role="status" aria-live="polite">
              {SR_NOT_FOUND}
            </Box>
          </VisuallyHidden>

          <TaskNotFound onBack={onNotFoundBack ?? (() => {})} size={size} />
        </Flex>
      );
    }

    // Ready state - all props should be defined
    if (!task || !chats || !header || !tabs || !stepsPanel || !mainPanel) {
      // Fallback if props are missing in ready state (shouldn't happen in practice)
      return (
        <TaskNotFound onBack={onNotFoundBack ?? (() => {})} size={size} data-testid={testId} />
      );
    }

    // Build loaded announcement
    const loadedAnnouncement = buildLoadedAnnouncement(
      task.title,
      stepsPanel.steps.length,
      tabs.activeTab
    );

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
      <Flex
        ref={ref}
        direction="column"
        aria-label={accessibleLabel}
        className={cn(TASK_PAGE_BASE_CLASSES, className)}
        data-testid={testId}
        data-state="ready"
        data-task-id={task.id}
        data-task-status={task.status}
        data-active-tab={tabs.activeTab}
        data-step-count={stepsPanel.steps.length}
        data-chat-count={chats.length}
        data-size={baseSize}
        data-running={mainPanel.isRunning}
        data-processing={mainPanel.isProcessing}
      >
        {/* Screen reader announcement for loaded state */}
        <VisuallyHidden>
          <Box as="span" role="status" aria-live="polite">
            {loadedAnnouncement}
          </Box>
        </VisuallyHidden>

        {/* Screen reader announcement for running state */}
        {mainPanel.isRunning && (
          <VisuallyHidden>
            <Box as="span" role="status" aria-live="polite">
              {SR_RUNNING}
            </Box>
          </VisuallyHidden>
        )}

        {/* Screen reader announcement for processing state */}
        {mainPanel.isProcessing && !mainPanel.isRunning && (
          <VisuallyHidden>
            <Box as="span" role="status" aria-live="polite">
              {SR_PROCESSING}
            </Box>
          </VisuallyHidden>
        )}

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
              onCompleteStep={stepsPanel.onCompleteStep}
              onSkipStep={stepsPanel.onSkipStep}
              onViewChat={stepsPanel.onViewChat}
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

        {/* Create PR dialog */}
        {createPRDialog && (
          <CreatePRDialog
            isOpen={createPRDialog.isOpen}
            onClose={createPRDialog.onClose}
            onCreate={createPRDialog.onCreate}
            defaultTitle={createPRDialog.defaultTitle}
            defaultBody={createPRDialog.defaultBody}
            defaultBase={createPRDialog.defaultBase}
            isSubmitting={createPRDialog.isSubmitting}
            error={createPRDialog.error}
            ghCliInstalled={createPRDialog.ghCliInstalled}
            ghAuthenticated={createPRDialog.ghAuthenticated}
          />
        )}
      </Flex>
    );
  }
);

TaskPage.displayName = 'TaskPage';
