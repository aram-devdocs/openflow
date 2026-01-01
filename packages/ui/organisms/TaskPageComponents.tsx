/**
 * TaskPageComponents - UI components for the Task Detail Page
 *
 * Features:
 * - Uses atoms/molecules only (no raw HTML elements)
 * - Loading/error states (TaskPageSkeleton, TaskPageError)
 * - Proper heading hierarchy (h1 for page title, h2 for sections)
 * - Responsive layout via ResponsiveValue
 * - forwardRef support for all components
 * - Full accessibility compliance (WCAG 2.1 AA)
 * - axe-core compliant
 *
 * These components are stateless and receive all data/callbacks via props.
 * They are composed by the route to build the task detail page.
 */

import type { Commit, ExecutorProfile, FileDiff, Message, WorkflowStep } from '@openflow/generated';
import { Flex, Heading, type ResponsiveValue, Text, VisuallyHidden } from '@openflow/primitives';
import { cn } from '@openflow/utils';
import { AlertCircle, AlertTriangle, RefreshCw, Terminal } from 'lucide-react';
import { type HTMLAttributes, forwardRef, useId } from 'react';
import { Button } from '../atoms/Button';
import { Icon } from '../atoms/Icon';
import { Input } from '../atoms/Input';
// Label not used currently but kept for form patterns
import { Skeleton } from '../atoms/Skeleton';
import { Textarea } from '../atoms/Textarea';
import { Dialog, DialogContent, DialogFooter } from '../molecules/Dialog';
import { FormField } from '../molecules/FormField';
import type { ArtifactFile } from './ArtifactsPanel';
import { ArtifactsPanel } from './ArtifactsPanel';
import { ChatPanel } from './ChatPanel';
import type { ClaudeEvent } from './ClaudeEventRenderer';
import { ClaudeEventRenderer } from './ClaudeEventRenderer';
import { CommitList } from './CommitList';
import { DiffViewer } from './DiffViewer';
import { StepsPanel } from './StepsPanel';

// ============================================================================
// Types
// ============================================================================

export type TaskPageSize = 'sm' | 'md' | 'lg';

export type TaskPageBreakpoint = 'base' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

export interface TaskNotFoundProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  /** Callback when back button is clicked */
  onBack: () => void;
  /** Custom title for not found message */
  title?: string;
  /** Custom description for not found message */
  description?: string;
  /** Responsive size */
  size?: ResponsiveValue<TaskPageSize>;
  /** Data attribute for testing */
  'data-testid'?: string;
}

export interface TaskPageErrorProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  /** Error message to display */
  message?: string;
  /** Callback when retry button is clicked */
  onRetry?: () => void;
  /** Responsive size */
  size?: ResponsiveValue<TaskPageSize>;
  /** Data attribute for testing */
  'data-testid'?: string;
}

export interface TaskPageSkeletonProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  /** Whether to show steps panel skeleton */
  showStepsPanel?: boolean;
  /** Whether to show tabs skeleton */
  showTabs?: boolean;
  /** Responsive size */
  size?: ResponsiveValue<TaskPageSize>;
  /** Data attribute for testing */
  'data-testid'?: string;
}

export interface TaskOutputPanelProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  /** Claude streaming events */
  claudeEvents: ClaudeEvent[];
  /** Raw terminal output */
  rawOutput: string[];
  /** Whether the process is running */
  isRunning: boolean;
  /** Whether to show raw output mode */
  showRawOutput: boolean;
  /** Toggle raw output callback */
  onToggleRawOutput: () => void;
  /** Responsive size */
  size?: ResponsiveValue<TaskPageSize>;
  /** Data attribute for testing */
  'data-testid'?: string;
}

export interface TaskMainPanelProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  /** Claude streaming events */
  claudeEvents: ClaudeEvent[];
  /** Raw terminal output */
  rawOutput: string[];
  /** Whether the process is running */
  isRunning: boolean;
  /** Whether to show raw output mode */
  showRawOutput: boolean;
  /** Toggle raw output callback */
  onToggleRawOutput: () => void;
  /** Chat messages */
  messages: Message[];
  /** Send message callback */
  onSendMessage: (content: string) => void;
  /** Whether processing a message */
  isProcessing: boolean;
  /** Stop processing callback */
  onStopProcess: () => void;
  /** Available executor profiles */
  executorProfiles: ExecutorProfile[];
  /** Currently selected executor profile ID */
  selectedExecutorProfileId: string;
  /** Responsive size */
  size?: ResponsiveValue<TaskPageSize>;
  /** Data attribute for testing */
  'data-testid'?: string;
}

export interface TaskStepsPanelProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  /** Workflow steps */
  steps: WorkflowStep[];
  /** Currently active step index */
  activeStepIndex: number;
  /** Start a step callback */
  onStartStep: (stepIndex: number) => void;
  /** Toggle step completion callback */
  onToggleStep: (stepIndex: number, completed: boolean) => void;
  /** Select a step callback */
  onSelectStep: (stepIndex: number) => void;
  /** Add new step callback */
  onAddStep: () => void;
  /** Whether to auto-start next step */
  autoStart: boolean;
  /** Toggle auto-start callback */
  onAutoStartChange: (value: boolean) => void;
  /** Complete step callback */
  onCompleteStep?: (stepIndex: number) => void;
  /** Skip step callback */
  onSkipStep?: (stepIndex: number) => void;
  /** View chat callback */
  onViewChat?: (chatId: string) => void;
  /** Responsive size */
  size?: ResponsiveValue<TaskPageSize>;
  /** Data attribute for testing */
  'data-testid'?: string;
}

export interface AddStepDialogProps {
  /** Whether dialog is open */
  isOpen: boolean;
  /** Close dialog callback */
  onClose: () => void;
  /** Step title value */
  title: string;
  /** Step description value */
  description: string;
  /** Title change callback */
  onTitleChange: (value: string) => void;
  /** Description change callback */
  onDescriptionChange: (value: string) => void;
  /** Create step callback */
  onCreateStep: (startImmediately: boolean) => void;
  /** Whether step is being created */
  isCreating: boolean;
  /** Title field error message */
  titleError?: string;
  /** Responsive size */
  size?: ResponsiveValue<TaskPageSize>;
  /** Data attribute for testing */
  'data-testid'?: string;
}

export interface TaskArtifactsTabProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  /** Artifact files */
  artifacts: ArtifactFile[];
  /** Whether loading */
  loading: boolean;
  /** Open artifact callback */
  onOpenArtifact: (artifact: ArtifactFile) => void;
  /** Preview artifact callback */
  onPreviewArtifact: (artifact: ArtifactFile) => void;
  /** Responsive size */
  size?: ResponsiveValue<TaskPageSize>;
  /** Data attribute for testing */
  'data-testid'?: string;
}

export interface TaskChangesTabProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  /** File diffs */
  diffs: FileDiff[];
  /** Set of expanded file paths */
  expandedFiles: Set<string>;
  /** Toggle file expansion callback */
  onFileToggle: (path: string) => void;
  /** Responsive size */
  size?: ResponsiveValue<TaskPageSize>;
  /** Data attribute for testing */
  'data-testid'?: string;
}

export interface TaskCommitsTabProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  /** Commits to display */
  commits: Commit[];
  /** Set of expanded commit hashes */
  expandedCommits: Set<string>;
  /** Toggle commit expansion callback */
  onCommitToggle: (hash: string) => void;
  /** View commit callback */
  onViewCommit: (hash: string) => void;
  /** Responsive size */
  size?: ResponsiveValue<TaskPageSize>;
  /** Data attribute for testing */
  'data-testid'?: string;
}

// ============================================================================
// Constants - Labels
// ============================================================================

/** Default not found title */
export const DEFAULT_NOT_FOUND_TITLE = 'Task not found';

/** Default not found description */
export const DEFAULT_NOT_FOUND_DESCRIPTION =
  "The task you're looking for doesn't exist or has been deleted.";

/** Default back button label */
export const DEFAULT_BACK_BUTTON_LABEL = 'Back to Dashboard';

/** Default error title */
export const DEFAULT_ERROR_TITLE = 'Failed to load task';

/** Default error message */
export const DEFAULT_ERROR_MESSAGE = 'There was a problem loading this task. Please try again.';

/** Default retry button label */
export const DEFAULT_RETRY_LABEL = 'Retry';

/** Output panel label when running */
export const OUTPUT_LABEL_RUNNING = 'Running...';

/** Output panel label when complete */
export const OUTPUT_LABEL_COMPLETE = 'Output';

/** Toggle raw output button label */
export const TOGGLE_RAW_LABEL = 'Raw';

/** Toggle formatted output button label */
export const TOGGLE_FORMATTED_LABEL = 'Formatted';

/** Add step dialog title */
export const ADD_STEP_DIALOG_TITLE = 'Add New Step';

/** Title field label */
export const TITLE_FIELD_LABEL = 'Title';

/** Title field placeholder */
export const TITLE_FIELD_PLACEHOLDER = 'Step name...';

/** Description field label */
export const DESCRIPTION_FIELD_LABEL = 'Prompt / Instructions';

/** Description field placeholder */
export const DESCRIPTION_FIELD_PLACEHOLDER = 'Describe what this step should accomplish...';

/** Description field helper text */
export const DESCRIPTION_FIELD_HELPER =
  'This will be sent to the AI agent when the step is started.';

/** Cancel button label */
export const CANCEL_BUTTON_LABEL = 'Cancel';

/** Add step button label */
export const ADD_STEP_BUTTON_LABEL = 'Add Step';

/** Add and start button label */
export const ADD_START_BUTTON_LABEL = 'Add & Start';

/** Creating button label */
export const CREATING_BUTTON_LABEL = 'Adding...';

// ============================================================================
// Constants - Screen Reader
// ============================================================================

/** Screen reader announcement for not found */
export const SR_NOT_FOUND_ANNOUNCEMENT = 'Task not found';

/** Screen reader announcement for error */
export const SR_ERROR_ANNOUNCEMENT = 'Error loading task';

/** Screen reader announcement for loading */
export const SR_LOADING_ANNOUNCEMENT = 'Loading task details';

/** Screen reader announcement for output toggle */
export const SR_OUTPUT_TOGGLE_TEMPLATE = (showRaw: boolean) =>
  `Showing ${showRaw ? 'formatted' : 'raw'} output. Press to show ${showRaw ? 'raw' : 'formatted'} output.`;

/** Screen reader announcement for dialog open */
export const SR_DIALOG_OPENED = 'Add new step dialog opened';

/** Screen reader announcement for creating step */
export const SR_CREATING_STEP = 'Creating step';

/** Screen reader announcement for step created */
export const SR_STEP_CREATED = 'Step created';

/** Screen reader announcement for validation error */
export const SR_VALIDATION_ERROR = 'Please provide a step title';

// ============================================================================
// Constants - CSS Classes
// ============================================================================

/** Breakpoint order for responsive class generation */
const BREAKPOINT_ORDER: TaskPageBreakpoint[] = ['base', 'sm', 'md', 'lg', 'xl', '2xl'];

/** Base classes for not found container */
export const NOT_FOUND_BASE_CLASSES =
  'flex h-full flex-col items-center justify-center bg-background';

/** Not found padding classes by size */
export const NOT_FOUND_PADDING_CLASSES: Record<TaskPageSize, string> = {
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
};

/** Not found icon classes by size */
export const NOT_FOUND_ICON_CLASSES: Record<TaskPageSize, string> = {
  sm: 'mb-3 h-12 w-12',
  md: 'mb-4 h-14 w-14',
  lg: 'mb-4 h-16 w-16',
};

/** Not found title classes by size */
export const NOT_FOUND_TITLE_CLASSES: Record<TaskPageSize, string> = {
  sm: 'text-base',
  md: 'text-lg',
  lg: 'text-xl',
};

/** Not found description classes by size */
export const NOT_FOUND_DESCRIPTION_CLASSES: Record<TaskPageSize, string> = {
  sm: 'mt-1.5 text-xs',
  md: 'mt-2 text-sm',
  lg: 'mt-2 text-base',
};

/** Not found button margin classes by size */
export const NOT_FOUND_BUTTON_MARGIN_CLASSES: Record<TaskPageSize, string> = {
  sm: 'mt-3',
  md: 'mt-4',
  lg: 'mt-4',
};

/** Base classes for error container */
export const ERROR_BASE_CLASSES = 'flex h-full flex-col items-center justify-center bg-background';

/** Error padding classes by size */
export const ERROR_PADDING_CLASSES: Record<TaskPageSize, string> = {
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
};

/** Error icon classes by size */
export const ERROR_ICON_CLASSES: Record<TaskPageSize, string> = {
  sm: 'mb-3 h-10 w-10',
  md: 'mb-4 h-12 w-12',
  lg: 'mb-4 h-14 w-14',
};

/** Error text classes by size */
export const ERROR_TEXT_CLASSES: Record<TaskPageSize, string> = {
  sm: 'text-base',
  md: 'text-lg',
  lg: 'text-xl',
};

/** Error message classes by size */
export const ERROR_MESSAGE_CLASSES: Record<TaskPageSize, string> = {
  sm: 'mt-1.5 text-xs max-w-xs',
  md: 'mt-2 text-sm max-w-sm',
  lg: 'mt-2 text-base max-w-md',
};

/** Error button margin classes by size */
export const ERROR_BUTTON_MARGIN_CLASSES: Record<TaskPageSize, string> = {
  sm: 'mt-3',
  md: 'mt-4',
  lg: 'mt-4',
};

/** Base classes for skeleton container */
export const SKELETON_BASE_CLASSES = 'flex h-full';

/** Skeleton main panel classes */
export const SKELETON_MAIN_PANEL_CLASSES = 'flex flex-1 flex-col';

/** Skeleton steps panel classes by size */
export const SKELETON_STEPS_PANEL_CLASSES: Record<TaskPageSize, string> = {
  sm: 'w-56 border-r border-border p-3',
  md: 'w-64 border-r border-border p-4',
  lg: 'w-72 border-r border-border p-5',
};

/** Skeleton header classes by size */
export const SKELETON_HEADER_CLASSES: Record<TaskPageSize, string> = {
  sm: 'border-b border-border p-3',
  md: 'border-b border-border p-4',
  lg: 'border-b border-border p-5',
};

/** Skeleton tabs gap classes by size */
export const SKELETON_TABS_GAP_CLASSES: Record<TaskPageSize, string> = {
  sm: 'gap-3',
  md: 'gap-4',
  lg: 'gap-5',
};

/** Skeleton content classes by size */
export const SKELETON_CONTENT_CLASSES: Record<TaskPageSize, string> = {
  sm: 'flex-1 p-3',
  md: 'flex-1 p-4',
  lg: 'flex-1 p-5',
};

/** Base classes for output panel */
export const OUTPUT_PANEL_BASE_CLASSES = 'flex-1 overflow-auto border-b border-border';

/** Output panel header classes */
export const OUTPUT_PANEL_HEADER_CLASSES =
  'flex items-center justify-between border-b border-border';

/** Output panel header padding by size */
export const OUTPUT_PANEL_HEADER_PADDING: Record<TaskPageSize, string> = {
  sm: 'px-3 py-1.5',
  md: 'px-4 py-2',
  lg: 'px-5 py-2.5',
};

/** Output panel content padding by size */
export const OUTPUT_PANEL_CONTENT_PADDING: Record<TaskPageSize, string> = {
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-5',
};

/** Main panel base classes */
export const MAIN_PANEL_BASE_CLASSES = 'flex h-full flex-col';

/** Tab content padding by size */
export const TAB_CONTENT_PADDING: Record<TaskPageSize, string> = {
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-5',
};

/** Form field gap classes by size */
export const FORM_FIELD_GAP_CLASSES: Record<TaskPageSize, string> = {
  sm: 'space-y-3',
  md: 'space-y-4',
  lg: 'space-y-5',
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
  return size.base ?? size.sm ?? size.md ?? size.lg ?? size.xl ?? size['2xl'] ?? 'md';
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
 * Build accessible label for output panel
 */
export function buildOutputPanelAccessibleLabel(isRunning: boolean, eventCount: number): string {
  const status = isRunning ? 'Running' : 'Complete';
  return `Output panel. Status: ${status}. ${eventCount} ${eventCount === 1 ? 'event' : 'events'}.`;
}

/**
 * Build accessible label for add step dialog
 */
export function buildAddStepDialogAccessibleLabel(title: string, description: string): string {
  const hasTitle = title.trim().length > 0;
  const hasDescription = description.trim().length > 0;
  if (hasTitle && hasDescription) {
    return `Add new step dialog. Title: ${title}. Description provided.`;
  }
  if (hasTitle) {
    return `Add new step dialog. Title: ${title}. No description.`;
  }
  return 'Add new step dialog. No title entered.';
}

/**
 * Build screen reader announcement for dialog state
 */
export function buildDialogAnnouncement(isCreating: boolean, titleError?: string): string {
  if (isCreating) {
    return SR_CREATING_STEP;
  }
  if (titleError) {
    return titleError;
  }
  return '';
}

// ============================================================================
// Components
// ============================================================================

/**
 * TaskNotFound - Display when task is not found
 */
export const TaskNotFound = forwardRef<HTMLDivElement, TaskNotFoundProps>(
  (
    {
      onBack,
      title = DEFAULT_NOT_FOUND_TITLE,
      description = DEFAULT_NOT_FOUND_DESCRIPTION,
      size = 'md',
      className,
      'data-testid': testId,
    },
    ref
  ) => {
    const headingId = useId();
    const descriptionId = useId();

    return (
      <Flex
        ref={ref}
        role="alert"
        aria-labelledby={headingId}
        aria-describedby={descriptionId}
        aria-live="polite"
        direction="column"
        align="center"
        justify="center"
        className={cn(
          NOT_FOUND_BASE_CLASSES,
          getResponsiveSizeClasses(size, NOT_FOUND_PADDING_CLASSES),
          className
        )}
        data-testid={testId}
      >
        {/* Screen reader announcement */}
        <VisuallyHidden>
          <Text as="span" role="status" aria-live="polite">
            {SR_NOT_FOUND_ANNOUNCEMENT}
          </Text>
        </VisuallyHidden>

        <Icon
          icon={AlertCircle}
          aria-hidden="true"
          className={cn(
            'text-muted-foreground',
            getResponsiveSizeClasses(size, NOT_FOUND_ICON_CLASSES)
          )}
        />

        <Heading
          id={headingId}
          level={2}
          className={cn(
            'text-foreground font-semibold',
            getResponsiveSizeClasses(size, NOT_FOUND_TITLE_CLASSES)
          )}
        >
          {title}
        </Heading>

        <Text
          id={descriptionId}
          className={cn(
            'text-muted-foreground text-center',
            getResponsiveSizeClasses(size, NOT_FOUND_DESCRIPTION_CLASSES)
          )}
        >
          {description}
        </Text>

        <Button
          variant="primary"
          onClick={onBack}
          className={cn(
            'min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0',
            getResponsiveSizeClasses(size, NOT_FOUND_BUTTON_MARGIN_CLASSES)
          )}
        >
          {DEFAULT_BACK_BUTTON_LABEL}
        </Button>
      </Flex>
    );
  }
);

TaskNotFound.displayName = 'TaskNotFound';

/**
 * TaskPageError - Error state for task page
 */
export const TaskPageError = forwardRef<HTMLDivElement, TaskPageErrorProps>(
  (
    { message = DEFAULT_ERROR_MESSAGE, onRetry, size = 'md', className, 'data-testid': testId },
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
          ERROR_BASE_CLASSES,
          getResponsiveSizeClasses(size, ERROR_PADDING_CLASSES),
          className
        )}
        data-testid={testId}
      >
        {/* Screen reader announcement */}
        <VisuallyHidden>
          <Text as="span" role="status" aria-live="assertive">
            {SR_ERROR_ANNOUNCEMENT}
          </Text>
        </VisuallyHidden>

        <Icon
          icon={AlertTriangle}
          aria-hidden="true"
          className={cn('text-destructive', getResponsiveSizeClasses(size, ERROR_ICON_CLASSES))}
        />

        <Heading
          id={headingId}
          level={2}
          className={cn(
            'text-foreground font-semibold',
            getResponsiveSizeClasses(size, ERROR_TEXT_CLASSES)
          )}
        >
          {DEFAULT_ERROR_TITLE}
        </Heading>

        <Text
          id={messageId}
          className={cn(
            'text-muted-foreground text-center',
            getResponsiveSizeClasses(size, ERROR_MESSAGE_CLASSES)
          )}
        >
          {message}
        </Text>

        {onRetry && (
          <Button
            variant="primary"
            onClick={onRetry}
            icon={<RefreshCw className="h-4 w-4" aria-hidden="true" />}
            className={cn(
              'min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0',
              getResponsiveSizeClasses(size, ERROR_BUTTON_MARGIN_CLASSES)
            )}
          >
            {DEFAULT_RETRY_LABEL}
          </Button>
        )}
      </Flex>
    );
  }
);

TaskPageError.displayName = 'TaskPageError';

/**
 * TaskPageSkeleton - Loading skeleton for task page
 */
export const TaskPageSkeleton = forwardRef<HTMLDivElement, TaskPageSkeletonProps>(
  (
    { showStepsPanel = true, showTabs = true, size = 'md', className, 'data-testid': testId },
    ref
  ) => {
    return (
      <Flex
        ref={ref}
        role="status"
        aria-label={SR_LOADING_ANNOUNCEMENT}
        aria-busy={true}
        aria-hidden={true}
        className={cn(SKELETON_BASE_CLASSES, className)}
        data-testid={testId}
      >
        {/* Steps panel skeleton */}
        {showStepsPanel && (
          <Flex
            direction="column"
            gap="4"
            className={getResponsiveSizeClasses(size, SKELETON_STEPS_PANEL_CLASSES)}
          >
            <Skeleton variant="text" width="60%" height={20} />
            <Flex direction="column" gap="2">
              <Skeleton variant="rectangular" width="100%" height={48} />
              <Skeleton variant="rectangular" width="100%" height={48} />
              <Skeleton variant="rectangular" width="100%" height={48} />
            </Flex>
          </Flex>
        )}

        {/* Main content skeleton */}
        <Flex direction="column" className={SKELETON_MAIN_PANEL_CLASSES}>
          {/* Header skeleton */}
          <Flex
            direction="column"
            gap="2"
            className={getResponsiveSizeClasses(size, SKELETON_HEADER_CLASSES)}
          >
            <Skeleton variant="text" width="40%" height={24} />
            {showTabs && (
              <Flex gap="2" className={getResponsiveSizeClasses(size, SKELETON_TABS_GAP_CLASSES)}>
                <Skeleton variant="rectangular" width={80} height={32} />
                <Skeleton variant="rectangular" width={80} height={32} />
                <Skeleton variant="rectangular" width={80} height={32} />
              </Flex>
            )}
          </Flex>

          {/* Content skeleton */}
          <Flex
            direction="column"
            gap="4"
            className={getResponsiveSizeClasses(size, SKELETON_CONTENT_CLASSES)}
          >
            <Skeleton variant="rectangular" width="100%" height={120} />
            <Skeleton variant="rectangular" width="100%" height={200} />
          </Flex>
        </Flex>
      </Flex>
    );
  }
);

TaskPageSkeleton.displayName = 'TaskPageSkeleton';

/**
 * TaskOutputPanel - Claude streaming output display with toggle
 */
export const TaskOutputPanel = forwardRef<HTMLDivElement, TaskOutputPanelProps>(
  (
    {
      claudeEvents,
      rawOutput,
      isRunning,
      showRawOutput,
      onToggleRawOutput,
      size = 'md',
      className,
      'data-testid': testId,
    },
    ref
  ) => {
    const hasOutput = claudeEvents.length > 0 || isRunning || rawOutput.length > 0;
    const panelId = useId();

    if (!hasOutput) return null;

    const accessibleLabel = buildOutputPanelAccessibleLabel(isRunning, claudeEvents.length);

    return (
      <Flex
        ref={ref}
        direction="column"
        role="region"
        aria-label={accessibleLabel}
        aria-busy={isRunning}
        className={cn(OUTPUT_PANEL_BASE_CLASSES, className)}
        data-testid={testId}
      >
        {/* Output header with view toggle */}
        <Flex
          align="center"
          justify="between"
          className={cn(
            OUTPUT_PANEL_HEADER_CLASSES,
            getResponsiveSizeClasses(size, OUTPUT_PANEL_HEADER_PADDING)
          )}
        >
          <Text
            as="span"
            size="xs"
            weight="medium"
            className="text-muted-foreground"
            aria-live="polite"
          >
            {isRunning ? OUTPUT_LABEL_RUNNING : OUTPUT_LABEL_COMPLETE}
          </Text>

          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleRawOutput}
            aria-pressed={showRawOutput}
            aria-label={SR_OUTPUT_TOGGLE_TEMPLATE(showRawOutput)}
            className="h-7 gap-1.5 px-2 text-xs min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0"
          >
            <Icon icon={Terminal} size="sm" aria-hidden="true" />
            {showRawOutput ? TOGGLE_FORMATTED_LABEL : TOGGLE_RAW_LABEL}
          </Button>
        </Flex>

        <Flex
          id={panelId}
          direction="column"
          className={getResponsiveSizeClasses(size, OUTPUT_PANEL_CONTENT_PADDING)}
        >
          <ClaudeEventRenderer
            events={claudeEvents}
            isStreaming={isRunning}
            showRawOutput={showRawOutput}
            rawOutput={rawOutput}
          />
        </Flex>
      </Flex>
    );
  }
);

TaskOutputPanel.displayName = 'TaskOutputPanel';

/**
 * TaskMainPanel - Combined output and chat input
 */
export const TaskMainPanel = forwardRef<HTMLDivElement, TaskMainPanelProps>(
  (
    {
      claudeEvents,
      rawOutput,
      isRunning,
      showRawOutput,
      onToggleRawOutput,
      messages,
      onSendMessage,
      isProcessing,
      onStopProcess,
      executorProfiles,
      selectedExecutorProfileId,
      size = 'md',
      className,
      'data-testid': testId,
    },
    ref
  ) => {
    return (
      <Flex
        ref={ref}
        direction="column"
        className={cn(MAIN_PANEL_BASE_CLASSES, className)}
        data-testid={testId}
      >
        <TaskOutputPanel
          claudeEvents={claudeEvents}
          rawOutput={rawOutput}
          isRunning={isRunning}
          showRawOutput={showRawOutput}
          onToggleRawOutput={onToggleRawOutput}
          size={size}
          data-testid={testId ? `${testId}-output` : undefined}
        />
        <ChatPanel
          messages={messages}
          onSendMessage={onSendMessage}
          isProcessing={isProcessing}
          onStopProcess={onStopProcess}
          executorProfiles={executorProfiles}
          selectedExecutorProfileId={selectedExecutorProfileId}
          showExecutorSelector={executorProfiles.length > 1}
          placeholder="Type a message or instruction..."
        />
      </Flex>
    );
  }
);

TaskMainPanel.displayName = 'TaskMainPanel';

/**
 * TaskStepsPanel - Wrapper for StepsPanel with consistent props
 */
export const TaskStepsPanel = forwardRef<HTMLDivElement, TaskStepsPanelProps>(
  (
    {
      steps,
      activeStepIndex,
      onStartStep,
      onToggleStep,
      onSelectStep,
      onAddStep,
      autoStart,
      onAutoStartChange,
      onCompleteStep,
      onSkipStep,
      onViewChat,
      className,
      'data-testid': testId,
    },
    ref
  ) => {
    return (
      <Flex ref={ref} direction="column" className={className} data-testid={testId}>
        <StepsPanel
          steps={steps}
          activeStepIndex={activeStepIndex}
          onStartStep={onStartStep}
          onToggleStep={onToggleStep}
          onSelectStep={onSelectStep}
          onAddStep={onAddStep}
          autoStart={autoStart}
          onAutoStartChange={onAutoStartChange}
          onCompleteStep={onCompleteStep}
          onSkipStep={onSkipStep}
          onViewChat={onViewChat}
        />
      </Flex>
    );
  }
);

TaskStepsPanel.displayName = 'TaskStepsPanel';

/**
 * AddStepDialog - Dialog for adding a new workflow step
 */
export const AddStepDialog = forwardRef<HTMLDivElement, AddStepDialogProps>(
  (
    {
      isOpen,
      onClose,
      title,
      description,
      onTitleChange,
      onDescriptionChange,
      onCreateStep,
      isCreating,
      titleError,
      size = 'md',
      'data-testid': testId,
    },
    ref
  ) => {
    const titleFieldId = useId();
    const descriptionFieldId = useId();
    const titleErrorId = useId();
    const baseSize = getBaseSize(size);

    const announcement = buildDialogAnnouncement(isCreating, titleError);

    return (
      <Dialog
        isOpen={isOpen}
        onClose={onClose}
        title={ADD_STEP_DIALOG_TITLE}
        size="md"
        data-testid={testId}
      >
        {/* Screen reader announcement for state changes */}
        {announcement && (
          <VisuallyHidden>
            <Text as="span" role="status" aria-live="polite">
              {announcement}
            </Text>
          </VisuallyHidden>
        )}

        <DialogContent ref={ref} data-size={baseSize}>
          <Flex
            direction="column"
            role="form"
            aria-label={ADD_STEP_DIALOG_TITLE}
            className={getResponsiveSizeClasses(size, FORM_FIELD_GAP_CLASSES)}
          >
            <FormField htmlFor={titleFieldId} label={TITLE_FIELD_LABEL} required error={titleError}>
              <Input
                id={titleFieldId}
                value={title}
                onChange={(e) => onTitleChange(e.target.value)}
                placeholder={TITLE_FIELD_PLACEHOLDER}
                aria-invalid={!!titleError}
                aria-describedby={titleError ? titleErrorId : undefined}
                disabled={isCreating}
                data-testid={testId ? `${testId}-title-input` : undefined}
              />
            </FormField>

            <FormField
              htmlFor={descriptionFieldId}
              label={DESCRIPTION_FIELD_LABEL}
              helperText={DESCRIPTION_FIELD_HELPER}
            >
              <Textarea
                id={descriptionFieldId}
                value={description}
                onChange={(e) => onDescriptionChange(e.target.value)}
                placeholder={DESCRIPTION_FIELD_PLACEHOLDER}
                rows={5}
                disabled={isCreating}
                data-testid={testId ? `${testId}-description-input` : undefined}
              />
            </FormField>
          </Flex>
        </DialogContent>

        <DialogFooter>
          <Button
            variant="ghost"
            onClick={onClose}
            disabled={isCreating}
            className="min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0"
          >
            {CANCEL_BUTTON_LABEL}
          </Button>
          <Button
            variant="secondary"
            onClick={() => onCreateStep(false)}
            disabled={!title.trim() || isCreating}
            loading={isCreating}
            loadingText={CREATING_BUTTON_LABEL}
            className="min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0"
          >
            {ADD_STEP_BUTTON_LABEL}
          </Button>
          <Button
            variant="primary"
            onClick={() => onCreateStep(true)}
            disabled={!title.trim() || isCreating}
            loading={isCreating}
            loadingText={CREATING_BUTTON_LABEL}
            className="min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0"
          >
            {ADD_START_BUTTON_LABEL}
          </Button>
        </DialogFooter>
      </Dialog>
    );
  }
);

AddStepDialog.displayName = 'AddStepDialog';

/**
 * TaskArtifactsTab - Artifacts panel tab content
 */
export const TaskArtifactsTab = forwardRef<HTMLDivElement, TaskArtifactsTabProps>(
  (
    { artifacts, loading, onOpenArtifact, onPreviewArtifact, className, 'data-testid': testId },
    ref
  ) => {
    return (
      <Flex
        ref={ref}
        direction="column"
        role="tabpanel"
        aria-label="Artifacts"
        className={className}
        data-testid={testId}
      >
        <ArtifactsPanel
          artifacts={artifacts}
          loading={loading}
          onOpenArtifact={onOpenArtifact}
          onPreviewArtifact={onPreviewArtifact}
        />
      </Flex>
    );
  }
);

TaskArtifactsTab.displayName = 'TaskArtifactsTab';

/**
 * TaskChangesTab - Diff viewer tab content
 */
export const TaskChangesTab = forwardRef<HTMLDivElement, TaskChangesTabProps>(
  ({ diffs, expandedFiles, onFileToggle, size = 'md', className, 'data-testid': testId }, ref) => {
    return (
      <Flex
        ref={ref}
        direction="column"
        role="tabpanel"
        aria-label="File changes"
        className={cn(getResponsiveSizeClasses(size, TAB_CONTENT_PADDING), className)}
        data-testid={testId}
      >
        <DiffViewer
          diffs={diffs}
          expandedFiles={expandedFiles}
          onFileToggle={onFileToggle}
          showLineNumbers
        />
      </Flex>
    );
  }
);

TaskChangesTab.displayName = 'TaskChangesTab';

/**
 * TaskCommitsTab - Commit list tab content
 */
export const TaskCommitsTab = forwardRef<HTMLDivElement, TaskCommitsTabProps>(
  (
    {
      commits,
      expandedCommits,
      onCommitToggle,
      onViewCommit,
      size = 'md',
      className,
      'data-testid': testId,
    },
    ref
  ) => {
    return (
      <Flex
        ref={ref}
        direction="column"
        role="tabpanel"
        aria-label="Commits"
        className={cn(getResponsiveSizeClasses(size, TAB_CONTENT_PADDING), className)}
        data-testid={testId}
      >
        <CommitList
          commits={commits}
          expandedCommits={expandedCommits}
          onCommitToggle={onCommitToggle}
          onViewCommit={onViewCommit}
        />
      </Flex>
    );
  }
);

TaskCommitsTab.displayName = 'TaskCommitsTab';
