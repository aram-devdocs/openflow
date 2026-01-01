import type { WorkflowStep } from '@openflow/generated';
import { WorkflowStepStatus } from '@openflow/generated';
import { Box, type ResponsiveValue, Text, VisuallyHidden } from '@openflow/primitives';
import { cn } from '@openflow/utils';
import {
  AlertTriangle,
  Check,
  ChevronDown,
  ChevronRight,
  Circle,
  ListTodo,
  Loader2,
  MessageSquare,
  Play,
  Plus,
  RefreshCw,
  SkipForward,
} from 'lucide-react';
import { type HTMLAttributes, forwardRef, useCallback, useId, useState } from 'react';
import { Button } from '../atoms/Button';
import { Checkbox } from '../atoms/Checkbox';
import { Icon } from '../atoms/Icon';
import { Skeleton } from '../atoms/Skeleton';
import { EmptyState } from '../molecules/EmptyState';
import { Tooltip } from '../molecules/Tooltip';

// ============================================================================
// Types
// ============================================================================

export type StepsPanelSize = 'sm' | 'md' | 'lg';
export type StepsPanelBreakpoint = 'base' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

export interface StepsPanelProps extends Omit<HTMLAttributes<HTMLElement>, 'role'> {
  /** Array of workflow steps to display */
  steps: WorkflowStep[];
  /** Currently active step index (0-based) */
  activeStepIndex?: number;
  /** Callback when a step's start button is clicked */
  onStartStep?: (stepIndex: number) => void;
  /** Callback when a step is marked as complete */
  onCompleteStep?: (stepIndex: number) => void;
  /** Callback when a step is skipped */
  onSkipStep?: (stepIndex: number) => void;
  /** Callback when a step is toggled (marked complete/pending) */
  onToggleStep?: (stepIndex: number, completed: boolean) => void;
  /** Callback when a step is clicked for selection */
  onSelectStep?: (stepIndex: number) => void;
  /** Callback when view chat button is clicked */
  onViewChat?: (chatId: string) => void;
  /** Callback when add step button is clicked */
  onAddStep?: () => void;
  /** Whether auto-start is enabled for the next step */
  autoStart?: boolean;
  /** Callback when auto-start toggle changes */
  onAutoStartChange?: (enabled: boolean) => void;
  /** Whether actions are disabled (e.g., during processing) */
  disabled?: boolean;
  /** Whether the panel is in a loading state */
  loading?: boolean;
  /** Whether there is an error */
  error?: boolean;
  /** Error message to display */
  errorMessage?: string;
  /** Callback when retry is clicked in error state */
  onRetry?: () => void;
  /** Responsive size variant */
  size?: ResponsiveValue<StepsPanelSize>;
  /** Accessible label for the steps panel */
  'aria-label'?: string;
  /** Data attributes for testing */
  'data-testid'?: string;
}

export interface StepsPanelSkeletonProps extends Omit<HTMLAttributes<HTMLDivElement>, 'role'> {
  /** Number of step skeleton items to show */
  stepCount?: number;
  /** Responsive size variant */
  size?: ResponsiveValue<StepsPanelSize>;
  /** Data attributes for testing */
  'data-testid'?: string;
}

export interface StepsPanelErrorProps extends Omit<HTMLAttributes<HTMLDivElement>, 'role'> {
  /** Error message to display */
  message?: string;
  /** Callback when retry is clicked */
  onRetry?: () => void;
  /** Whether retry is in progress */
  retrying?: boolean;
  /** Responsive size variant */
  size?: ResponsiveValue<StepsPanelSize>;
  /** Data attributes for testing */
  'data-testid'?: string;
}

// ============================================================================
// Constants
// ============================================================================

/**
 * Breakpoint order for responsive class generation
 */
const BREAKPOINT_ORDER: readonly StepsPanelBreakpoint[] = [
  'base',
  'sm',
  'md',
  'lg',
  'xl',
  '2xl',
] as const;

/**
 * Default accessible label for the steps panel
 */
export const DEFAULT_STEPS_PANEL_LABEL = 'Workflow steps';

/**
 * Default label for loading state
 */
export const DEFAULT_LOADING_LABEL = 'Loading workflow steps';

/**
 * Default label for add step button
 */
export const DEFAULT_ADD_STEP_LABEL = 'Add step';

/**
 * Default label for auto-start checkbox
 */
export const DEFAULT_AUTO_START_LABEL = 'Auto-start next step';

/**
 * Default label for start step button
 */
export const DEFAULT_START_STEP_LABEL = 'Start step';

/**
 * Default label for complete step button
 */
export const DEFAULT_COMPLETE_STEP_LABEL = 'Complete step';

/**
 * Default label for skip step button
 */
export const DEFAULT_SKIP_STEP_LABEL = 'Skip step';

/**
 * Default label for view chat button
 */
export const DEFAULT_VIEW_CHAT_LABEL = 'View chat';

/**
 * Default label for expand button
 */
export const DEFAULT_EXPAND_LABEL = 'Expand step details';

/**
 * Default label for collapse button
 */
export const DEFAULT_COLLAPSE_LABEL = 'Collapse step details';

/**
 * Default error title
 */
export const DEFAULT_ERROR_TITLE = 'Failed to load steps';

/**
 * Default error message
 */
export const DEFAULT_ERROR_MESSAGE = 'Unable to load workflow steps. Please try again.';

/**
 * Default retry label
 */
export const DEFAULT_RETRY_LABEL = 'Try again';

/**
 * Default skeleton step count
 */
export const DEFAULT_SKELETON_COUNT = 4;

/**
 * Screen reader announcement for step selected
 */
export const SR_STEP_SELECTED = 'Step selected';

/**
 * Screen reader announcement for step expanded
 */
export const SR_STEP_EXPANDED = 'Step details expanded';

/**
 * Screen reader announcement for step collapsed
 */
export const SR_STEP_COLLAPSED = 'Step details collapsed';

/**
 * Screen reader announcement for step started
 */
export const SR_STEP_STARTED = 'Step started';

/**
 * Screen reader announcement for step completed
 */
export const SR_STEP_COMPLETED = 'Step completed';

/**
 * Screen reader announcement for step skipped
 */
export const SR_STEP_SKIPPED = 'Step skipped';

/**
 * Screen reader announcement for step toggle
 */
export const SR_STEP_TOGGLED = 'Step status toggled';

/**
 * Status icon map for step statuses
 */
export const STATUS_ICON_MAP = {
  [WorkflowStepStatus.Completed]: Check,
  [WorkflowStepStatus.InProgress]: Loader2,
  [WorkflowStepStatus.Skipped]: SkipForward,
  [WorkflowStepStatus.Pending]: Circle,
} as const;

/**
 * Status label map for step statuses
 */
export const STATUS_LABEL_MAP = {
  [WorkflowStepStatus.Completed]: 'Completed',
  [WorkflowStepStatus.InProgress]: 'In Progress',
  [WorkflowStepStatus.Skipped]: 'Skipped',
  [WorkflowStepStatus.Pending]: 'Pending',
} as const;

/**
 * Base classes for the steps panel container
 */
export const STEPS_PANEL_BASE_CLASSES = 'flex h-full flex-col bg-[rgb(var(--background))]';

/**
 * Header classes for the steps panel
 */
export const STEPS_PANEL_HEADER_CLASSES =
  'flex items-center justify-between border-b border-[rgb(var(--border))] px-4 py-3';

/**
 * Title classes for the steps panel header
 */
export const STEPS_PANEL_TITLE_CLASSES = 'text-sm font-semibold text-[rgb(var(--foreground))]';

/**
 * Counter classes for the steps panel header
 */
export const STEPS_PANEL_COUNTER_CLASSES = 'text-xs text-[rgb(var(--muted-foreground))]';

/**
 * List container classes
 */
export const STEPS_PANEL_LIST_CONTAINER_CLASSES = 'scrollbar-thin flex-1 overflow-y-auto';

/**
 * List classes
 */
export const STEPS_PANEL_LIST_CLASSES = 'divide-y divide-[rgb(var(--border))]';

/**
 * Step item base classes
 */
export const STEP_ITEM_BASE_CLASSES =
  'group relative motion-safe:transition-colors motion-safe:duration-150';

/**
 * Step item active classes
 */
export const STEP_ITEM_ACTIVE_CLASSES = 'bg-[rgb(var(--accent))]';

/**
 * Step item inactive hover classes
 */
export const STEP_ITEM_HOVER_CLASSES = 'hover:bg-[rgb(var(--muted))]';

/**
 * Step item disabled classes
 */
export const STEP_ITEM_DISABLED_CLASSES = 'opacity-60';

/**
 * Step indicator bar classes (for active step)
 */
export const STEP_INDICATOR_BAR_CLASSES =
  'absolute left-0 top-0 bottom-0 w-1 bg-[rgb(var(--primary))]';

/**
 * Step row classes (clickable header)
 */
export const STEP_ROW_CLASSES =
  'flex items-start gap-3 px-4 py-3 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[rgb(var(--ring))]';

/**
 * Step row disabled classes
 */
export const STEP_ROW_DISABLED_CLASSES = 'cursor-not-allowed';

/**
 * Step content wrapper classes
 */
export const STEP_CONTENT_CLASSES = 'flex-1 min-w-0';

/**
 * Step name classes for completed state
 */
export const STEP_NAME_COMPLETED_CLASSES = 'text-[rgb(var(--muted-foreground))] line-through';

/**
 * Step name classes for skipped state
 */
export const STEP_NAME_SKIPPED_CLASSES = 'text-[rgb(var(--muted-foreground))]';

/**
 * Step name classes for default state
 */
export const STEP_NAME_DEFAULT_CLASSES = 'text-[rgb(var(--foreground))]';

/**
 * Step description classes
 */
export const STEP_DESCRIPTION_CLASSES =
  'mt-1 text-xs line-clamp-2 text-[rgb(var(--muted-foreground))]';

/**
 * Step progress indicator classes
 */
export const STEP_PROGRESS_INDICATOR_CLASSES =
  'mt-2 flex items-center gap-1.5 text-xs text-[rgb(var(--primary))]';

/**
 * Step actions container classes (visible on hover)
 */
export const STEP_ACTIONS_CONTAINER_CLASSES =
  'flex items-center gap-1 opacity-0 group-hover:opacity-100 motion-safe:transition-opacity';

/**
 * Step quick action button classes
 */
export const STEP_QUICK_ACTION_CLASSES =
  'h-7 w-7 p-0 min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0';

/**
 * Expanded content container classes
 */
export const STEP_EXPANDED_CONTENT_CLASSES =
  'border-t border-[rgb(var(--border))] px-4 py-3 pl-12 space-y-3 bg-[rgb(var(--muted))]/50';

/**
 * Expanded description classes
 */
export const STEP_EXPANDED_DESCRIPTION_CLASSES =
  'text-sm text-[rgb(var(--muted-foreground))] whitespace-pre-wrap';

/**
 * Footer classes for the steps panel
 */
export const STEPS_PANEL_FOOTER_CLASSES = 'border-t border-[rgb(var(--border))] px-4 py-3';

/**
 * Auto-start label container classes
 */
export const AUTO_START_LABEL_CLASSES = 'mb-3 flex items-center gap-2 cursor-pointer';

/**
 * Auto-start text classes
 */
export const AUTO_START_TEXT_CLASSES = 'text-xs text-[rgb(var(--muted-foreground))]';

/**
 * Error state container classes
 */
export const STEPS_PANEL_ERROR_CONTAINER_CLASSES =
  'flex flex-col items-center justify-center p-6 text-center';

/**
 * Error icon container classes
 */
export const STEPS_PANEL_ERROR_ICON_CLASSES =
  'mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[rgb(var(--destructive))]/10';

/**
 * Error title classes
 */
export const STEPS_PANEL_ERROR_TITLE_CLASSES =
  'mb-2 text-sm font-medium text-[rgb(var(--foreground))]';

/**
 * Error message classes
 */
export const STEPS_PANEL_ERROR_MESSAGE_CLASSES = 'mb-4 text-xs text-[rgb(var(--muted-foreground))]';

/**
 * Size-specific classes for step panel
 */
export const STEPS_PANEL_SIZE_CLASSES: Record<StepsPanelSize, string> = {
  sm: 'text-xs',
  md: 'text-sm',
  lg: 'text-base',
};

/**
 * Size-specific classes for step name
 */
export const STEP_NAME_SIZE_CLASSES: Record<StepsPanelSize, string> = {
  sm: 'text-xs font-medium truncate',
  md: 'text-sm font-medium truncate',
  lg: 'text-base font-medium truncate',
};

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Get the icon component for a step based on its status
 */
export function getStepIcon(status: WorkflowStepStatus) {
  return STATUS_ICON_MAP[status] || Circle;
}

/**
 * Get the status label for display
 */
export function getStatusLabel(status: WorkflowStepStatus): string {
  return STATUS_LABEL_MAP[status] || 'Pending';
}

/**
 * Get the base size from a responsive value
 */
export function getBaseSize(size: ResponsiveValue<StepsPanelSize>): StepsPanelSize {
  if (typeof size === 'string') {
    return size;
  }
  return size.base ?? 'md';
}

/**
 * Generate responsive size classes
 */
export function getResponsiveSizeClasses(
  size: ResponsiveValue<StepsPanelSize>,
  classMap: Record<StepsPanelSize, string>
): string {
  if (typeof size === 'string') {
    return classMap[size];
  }

  const classes: string[] = [];

  for (const breakpoint of BREAKPOINT_ORDER) {
    const sizeValue = size[breakpoint];
    if (sizeValue) {
      const sizeClass = classMap[sizeValue];
      if (sizeClass) {
        const classesArray = sizeClass.split(' ');
        if (breakpoint === 'base') {
          classes.push(...classesArray);
        } else {
          classes.push(...classesArray.map((c) => `${breakpoint}:${c}`));
        }
      }
    }
  }

  return classes.join(' ');
}

/**
 * Build accessible label for a step
 */
export function buildStepAccessibleLabel(
  stepIndex: number,
  stepName: string,
  status: WorkflowStepStatus
): string {
  const statusLabel = getStatusLabel(status);
  return `Step ${stepIndex + 1}: ${stepName} - ${statusLabel}`;
}

/**
 * Build screen reader announcement for step action
 */
export function buildStepActionAnnouncement(
  action: 'started' | 'completed' | 'skipped' | 'toggled' | 'selected' | 'expanded' | 'collapsed',
  stepName: string
): string {
  const actionLabels = {
    started: SR_STEP_STARTED,
    completed: SR_STEP_COMPLETED,
    skipped: SR_STEP_SKIPPED,
    toggled: SR_STEP_TOGGLED,
    selected: SR_STEP_SELECTED,
    expanded: SR_STEP_EXPANDED,
    collapsed: SR_STEP_COLLAPSED,
  };
  return `${actionLabels[action]}: ${stepName}`;
}

/**
 * Get progress summary text
 */
export function getProgressSummary(completed: number, total: number): string {
  return `${completed} of ${total} steps completed`;
}

// ============================================================================
// Sub-Components
// ============================================================================

/**
 * Loading skeleton for the StepsPanel
 */
export const StepsPanelSkeleton = forwardRef<HTMLDivElement, StepsPanelSkeletonProps>(
  function StepsPanelSkeleton(
    { stepCount = DEFAULT_SKELETON_COUNT, size = 'md', className, 'data-testid': testId, ...props },
    ref
  ) {
    return (
      <Box
        ref={ref}
        role="status"
        aria-label={DEFAULT_LOADING_LABEL}
        aria-busy="true"
        className={cn(STEPS_PANEL_BASE_CLASSES, className)}
        data-testid={testId}
        data-step-count={stepCount}
        {...props}
      >
        <VisuallyHidden>{DEFAULT_LOADING_LABEL}</VisuallyHidden>

        {/* Header skeleton */}
        <Box className={STEPS_PANEL_HEADER_CLASSES}>
          <Skeleton variant="text" width={120} height={16} />
          <Skeleton variant="text" width={80} height={14} />
        </Box>

        {/* Steps list skeleton */}
        <Box className={STEPS_PANEL_LIST_CONTAINER_CLASSES}>
          <Box as="ul" className={STEPS_PANEL_LIST_CLASSES} role="list" aria-hidden="true">
            {Array.from({ length: stepCount }, (_, i) => (
              <Box as="li" key={i} className="px-4 py-3">
                <Box className="flex items-start gap-3">
                  <Skeleton variant="rectangular" width={16} height={16} className="mt-0.5" />
                  <Box className="flex-1 space-y-2">
                    <Box className="flex items-center gap-2">
                      <Skeleton variant="circular" width={16} height={16} />
                      <Skeleton variant="text" width={`${60 + i * 10}%`} height={16} />
                    </Box>
                    <Skeleton variant="text" width="90%" height={14} />
                  </Box>
                </Box>
              </Box>
            ))}
          </Box>
        </Box>

        {/* Footer skeleton */}
        <Box className={STEPS_PANEL_FOOTER_CLASSES}>
          <Skeleton variant="rectangular" width="100%" height={32} />
        </Box>
      </Box>
    );
  }
);

/**
 * Error state for the StepsPanel
 */
export const StepsPanelError = forwardRef<HTMLDivElement, StepsPanelErrorProps>(
  function StepsPanelError(
    {
      message = DEFAULT_ERROR_MESSAGE,
      onRetry,
      retrying = false,
      size = 'md',
      className,
      'data-testid': testId,
      ...props
    },
    ref
  ) {
    return (
      <Box
        ref={ref}
        role="alert"
        aria-live="assertive"
        aria-atomic="true"
        className={cn(STEPS_PANEL_BASE_CLASSES, 'items-center justify-center', className)}
        data-testid={testId}
        data-error="true"
        {...props}
      >
        <Box className={STEPS_PANEL_ERROR_CONTAINER_CLASSES}>
          <Box className={STEPS_PANEL_ERROR_ICON_CLASSES}>
            <Icon icon={AlertTriangle} size="lg" className="text-[rgb(var(--destructive))]" />
          </Box>
          <Text as="h3" className={STEPS_PANEL_ERROR_TITLE_CLASSES}>
            {DEFAULT_ERROR_TITLE}
          </Text>
          <Text as="p" className={STEPS_PANEL_ERROR_MESSAGE_CLASSES}>
            {message}
          </Text>
          {onRetry && (
            <Button
              variant="secondary"
              size="sm"
              onClick={onRetry}
              disabled={retrying}
              loading={retrying}
              aria-label={DEFAULT_RETRY_LABEL}
            >
              {!retrying && <Icon icon={RefreshCw} size="sm" className="mr-1" />}
              {DEFAULT_RETRY_LABEL}
            </Button>
          )}
        </Box>
      </Box>
    );
  }
);

// ============================================================================
// Main Component
// ============================================================================

/**
 * StepsPanel component for displaying and managing workflow steps.
 * Stateless - receives all data via props, emits actions via callbacks.
 *
 * Features:
 * - Step list with status indicators and checkboxes
 * - Expandable step details with full description
 * - Start, Complete, Skip, and View Chat actions
 * - Add step button
 * - Auto-start toggle for next step automation
 * - Active step highlighting
 * - Keyboard navigation support
 * - Loading skeleton state
 * - Error state with retry
 *
 * Accessibility:
 * - role="complementary" on aside element
 * - role="list" with role="listitem" for step list
 * - aria-current="step" for active step
 * - aria-expanded for expandable details
 * - Keyboard navigation (Enter/Space to select)
 * - Screen reader announcements for actions
 * - Touch targets ≥44px (WCAG 2.5.5)
 * - Focus visible rings
 *
 * @example
 * <StepsPanel
 *   steps={workflowSteps}
 *   activeStepIndex={1}
 *   onStartStep={handleStart}
 *   onCompleteStep={handleComplete}
 *   onSkipStep={handleSkip}
 *   onViewChat={handleViewChat}
 * />
 */
export const StepsPanel = forwardRef<HTMLElement, StepsPanelProps>(function StepsPanel(
  {
    steps,
    activeStepIndex,
    onStartStep,
    onCompleteStep,
    onSkipStep,
    onToggleStep,
    onSelectStep,
    onViewChat,
    onAddStep,
    autoStart = false,
    onAutoStartChange,
    disabled = false,
    loading = false,
    error = false,
    errorMessage,
    onRetry,
    size = 'md',
    className,
    'aria-label': ariaLabel = DEFAULT_STEPS_PANEL_LABEL,
    'data-testid': testId,
    ...props
  },
  ref
) {
  // Generate unique IDs for ARIA relationships
  const baseId = useId();
  const listId = `${baseId}-list`;
  const headingId = `${baseId}-heading`;

  // Track which steps are expanded
  const [expandedSteps, setExpandedSteps] = useState<Set<number>>(new Set());

  // Track screen reader announcements
  const [announcement, setAnnouncement] = useState<string>('');

  // Announce to screen readers
  const announce = useCallback((message: string) => {
    setAnnouncement(message);
    // Clear after announcement
    setTimeout(() => setAnnouncement(''), 1000);
  }, []);

  // Toggle step expansion
  const toggleExpanded = useCallback(
    (stepIndex: number, stepName: string) => {
      setExpandedSteps((prev) => {
        const next = new Set(prev);
        const isExpanding = !next.has(stepIndex);
        if (isExpanding) {
          next.add(stepIndex);
          announce(buildStepActionAnnouncement('expanded', stepName));
        } else {
          next.delete(stepIndex);
          announce(buildStepActionAnnouncement('collapsed', stepName));
        }
        return next;
      });
    },
    [announce]
  );

  // Handle step checkbox toggle
  const handleToggle = useCallback(
    (stepIndex: number, stepName: string, event: React.ChangeEvent<HTMLInputElement>) => {
      if (disabled) return;
      onToggleStep?.(stepIndex, event.target.checked);
      announce(buildStepActionAnnouncement('toggled', stepName));
    },
    [disabled, onToggleStep, announce]
  );

  // Handle start button click
  const handleStart = useCallback(
    (stepIndex: number, stepName: string) => {
      if (disabled) return;
      onStartStep?.(stepIndex);
      announce(buildStepActionAnnouncement('started', stepName));
    },
    [disabled, onStartStep, announce]
  );

  // Handle complete button click
  const handleComplete = useCallback(
    (stepIndex: number, stepName: string) => {
      if (disabled) return;
      onCompleteStep?.(stepIndex);
      announce(buildStepActionAnnouncement('completed', stepName));
    },
    [disabled, onCompleteStep, announce]
  );

  // Handle skip button click
  const handleSkip = useCallback(
    (stepIndex: number, stepName: string) => {
      if (disabled) return;
      onSkipStep?.(stepIndex);
      announce(buildStepActionAnnouncement('skipped', stepName));
    },
    [disabled, onSkipStep, announce]
  );

  // Handle view chat button click
  const handleViewChat = useCallback(
    (chatId: string) => {
      onViewChat?.(chatId);
    },
    [onViewChat]
  );

  // Handle step row click for selection
  const handleStepClick = useCallback(
    (stepIndex: number, stepName: string) => {
      onSelectStep?.(stepIndex);
      announce(buildStepActionAnnouncement('selected', stepName));
    },
    [onSelectStep, announce]
  );

  // Handle keyboard navigation on step row
  const handleKeyDown = useCallback(
    (stepIndex: number, stepName: string, event: React.KeyboardEvent) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        handleStepClick(stepIndex, stepName);
      }
    },
    [handleStepClick]
  );

  // Show loading skeleton
  if (loading) {
    return (
      <StepsPanelSkeleton
        className={className}
        size={size}
        data-testid={testId ? `${testId}-skeleton` : undefined}
      />
    );
  }

  // Show error state
  if (error) {
    return (
      <StepsPanelError
        message={errorMessage}
        onRetry={onRetry}
        size={size}
        className={className}
        data-testid={testId ? `${testId}-error` : undefined}
      />
    );
  }

  // Check if any step is in progress
  const hasInProgressStep = steps.some((step) => step.status === WorkflowStepStatus.InProgress);

  const completedCount = steps.filter((s) => s.status === WorkflowStepStatus.Completed).length;

  const progressSummary = getProgressSummary(completedCount, steps.length);

  return (
    <Box
      as="aside"
      ref={ref}
      role="complementary"
      aria-label={ariaLabel}
      aria-labelledby={headingId}
      className={cn(STEPS_PANEL_BASE_CLASSES, className)}
      data-testid={testId}
      data-step-count={steps.length}
      data-completed-count={completedCount}
      data-disabled={disabled || undefined}
      {...props}
    >
      {/* Screen reader announcements */}
      <VisuallyHidden aria-live="polite" aria-atomic="true">
        {announcement}
      </VisuallyHidden>

      {/* Header */}
      <Box className={STEPS_PANEL_HEADER_CLASSES}>
        <Text as="h3" id={headingId} className={STEPS_PANEL_TITLE_CLASSES}>
          Workflow Steps
        </Text>
        <Text as="span" className={STEPS_PANEL_COUNTER_CLASSES} aria-label={progressSummary}>
          {completedCount}/{steps.length} completed
        </Text>
      </Box>

      {/* Steps list */}
      <Box className={STEPS_PANEL_LIST_CONTAINER_CLASSES}>
        <Box
          as="ul"
          id={listId}
          className={STEPS_PANEL_LIST_CLASSES}
          role="list"
          aria-label="Workflow steps list"
        >
          {steps.map((step, index) => {
            const isActive = index === activeStepIndex;
            const isCompleted = step.status === WorkflowStepStatus.Completed;
            const isInProgress = step.status === WorkflowStepStatus.InProgress;
            const isSkipped = step.status === WorkflowStepStatus.Skipped;
            const isPending = step.status === WorkflowStepStatus.Pending;
            const canStart = !disabled && !hasInProgressStep && isPending;
            const canComplete = !disabled && isInProgress;
            const canSkip = !disabled && (isPending || isInProgress);
            const isExpanded = expandedSteps.has(index);
            const StepIcon = getStepIcon(step.status);
            const stepRowId = `${baseId}-step-${index}`;
            const stepContentId = `${baseId}-step-${index}-content`;

            return (
              <Box
                as="li"
                key={step.index}
                role="listitem"
                className={cn(
                  STEP_ITEM_BASE_CLASSES,
                  isActive && STEP_ITEM_ACTIVE_CLASSES,
                  !isActive && STEP_ITEM_HOVER_CLASSES,
                  disabled && STEP_ITEM_DISABLED_CLASSES
                )}
                data-step-index={index}
                data-step-status={step.status}
                data-active={isActive || undefined}
              >
                {/* Current step indicator bar */}
                {isActive && <Box className={STEP_INDICATOR_BAR_CLASSES} aria-hidden="true" />}

                {/* Step header row */}
                <Box
                  id={stepRowId}
                  className={cn(
                    STEP_ROW_CLASSES,
                    disabled && STEP_ROW_DISABLED_CLASSES,
                    // Touch target compliance
                    'min-h-[44px] sm:min-h-0'
                  )}
                  onClick={() => handleStepClick(index, step.name)}
                  onKeyDown={(e) => handleKeyDown(index, step.name, e)}
                  tabIndex={disabled ? -1 : 0}
                  role="button"
                  aria-current={isActive ? 'step' : undefined}
                  aria-label={buildStepAccessibleLabel(index, step.name, step.status)}
                  aria-expanded={step.description ? isExpanded : undefined}
                  aria-controls={step.description ? stepContentId : undefined}
                >
                  {/* Checkbox */}
                  <Box className="pt-0.5">
                    <Checkbox
                      checked={isCompleted}
                      indeterminate={isSkipped}
                      disabled={disabled || isInProgress}
                      onChange={(e) => handleToggle(index, step.name, e)}
                      onClick={(e) => e.stopPropagation()}
                      aria-label={`Mark step ${index + 1} as ${isCompleted ? 'pending' : 'completed'}`}
                    />
                  </Box>

                  {/* Step content */}
                  <Box className={STEP_CONTENT_CLASSES}>
                    <Box className="flex items-center gap-2">
                      {/* Status icon */}
                      <Icon
                        icon={StepIcon}
                        size="sm"
                        aria-hidden="true"
                        className={cn(
                          isCompleted && 'text-[rgb(var(--success))]',
                          isInProgress && 'text-[rgb(var(--primary))] motion-safe:animate-spin',
                          isSkipped && 'text-[rgb(var(--muted-foreground))]',
                          !isCompleted &&
                            !isInProgress &&
                            !isSkipped &&
                            'text-[rgb(var(--muted-foreground))]'
                        )}
                      />

                      {/* Step name */}
                      <Text
                        as="span"
                        className={cn(
                          STEP_NAME_SIZE_CLASSES[getBaseSize(size)],
                          isCompleted && STEP_NAME_COMPLETED_CLASSES,
                          isSkipped && STEP_NAME_SKIPPED_CLASSES,
                          !isCompleted && !isSkipped && STEP_NAME_DEFAULT_CLASSES
                        )}
                      >
                        {step.name}
                      </Text>
                    </Box>

                    {/* Step description preview (truncated) */}
                    {step.description && !isExpanded && (
                      <Text as="p" className={STEP_DESCRIPTION_CLASSES}>
                        {step.description}
                      </Text>
                    )}

                    {/* In progress indicator */}
                    {isInProgress && (
                      <Box
                        className={STEP_PROGRESS_INDICATOR_CLASSES}
                        role="status"
                        aria-label="Step in progress"
                      >
                        <Text as="span" className="relative flex h-2 w-2" aria-hidden="true">
                          <Text
                            as="span"
                            className="absolute inline-flex h-full w-full motion-safe:animate-ping rounded-full bg-[rgb(var(--primary))] opacity-75"
                          />
                          <Text
                            as="span"
                            className="relative inline-flex h-2 w-2 rounded-full bg-[rgb(var(--primary))]"
                          />
                        </Text>
                        <Text as="span">Running...</Text>
                      </Box>
                    )}
                  </Box>

                  {/* Expand/collapse toggle and actions */}
                  <Box className="flex items-center gap-1">
                    {/* Quick actions (visible on hover) */}
                    <Box className={STEP_ACTIONS_CONTAINER_CLASSES}>
                      {canStart && onStartStep && (
                        <Tooltip content={DEFAULT_START_STEP_LABEL} position="left">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleStart(index, step.name);
                            }}
                            disabled={disabled}
                            className={STEP_QUICK_ACTION_CLASSES}
                            aria-label={`${DEFAULT_START_STEP_LABEL}: ${step.name}`}
                          >
                            <Icon icon={Play} size="sm" aria-hidden="true" />
                          </Button>
                        </Tooltip>
                      )}
                    </Box>

                    {/* Expand toggle */}
                    {step.description && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleExpanded(index, step.name);
                        }}
                        className={STEP_QUICK_ACTION_CLASSES}
                        aria-expanded={isExpanded}
                        aria-controls={stepContentId}
                        aria-label={isExpanded ? DEFAULT_COLLAPSE_LABEL : DEFAULT_EXPAND_LABEL}
                      >
                        <Icon
                          icon={isExpanded ? ChevronDown : ChevronRight}
                          size="sm"
                          className="text-[rgb(var(--muted-foreground))]"
                          aria-hidden="true"
                        />
                      </Button>
                    )}
                  </Box>
                </Box>

                {/* Expanded content */}
                {isExpanded && step.description && (
                  <Box
                    id={stepContentId}
                    className={STEP_EXPANDED_CONTENT_CLASSES}
                    aria-labelledby={stepRowId}
                  >
                    {/* Full description */}
                    <Text as="p" className={STEP_EXPANDED_DESCRIPTION_CLASSES}>
                      {step.description}
                    </Text>

                    {/* Action buttons */}
                    <Box className="flex flex-wrap gap-2" role="group" aria-label="Step actions">
                      {canStart && onStartStep && (
                        <Button
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStart(index, step.name);
                          }}
                          disabled={disabled}
                          aria-label={`${DEFAULT_START_STEP_LABEL}: ${step.name}`}
                        >
                          <Icon icon={Play} size="sm" className="mr-1" aria-hidden="true" />
                          Start
                        </Button>
                      )}

                      {canComplete && onCompleteStep && (
                        <Button
                          size="sm"
                          variant="primary"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleComplete(index, step.name);
                          }}
                          disabled={disabled}
                          aria-label={`${DEFAULT_COMPLETE_STEP_LABEL}: ${step.name}`}
                        >
                          <Icon icon={Check} size="sm" className="mr-1" aria-hidden="true" />
                          Complete
                        </Button>
                      )}

                      {canSkip && onSkipStep && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSkip(index, step.name);
                          }}
                          disabled={disabled}
                          aria-label={`${DEFAULT_SKIP_STEP_LABEL}: ${step.name}`}
                        >
                          <Icon icon={SkipForward} size="sm" className="mr-1" aria-hidden="true" />
                          Skip
                        </Button>
                      )}

                      {step.chatId && onViewChat && (
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (step.chatId) {
                              handleViewChat(step.chatId);
                            }
                          }}
                          aria-label={`${DEFAULT_VIEW_CHAT_LABEL} for ${step.name}`}
                        >
                          <Icon
                            icon={MessageSquare}
                            size="sm"
                            className="mr-1"
                            aria-hidden="true"
                          />
                          View Chat
                        </Button>
                      )}
                    </Box>
                  </Box>
                )}
              </Box>
            );
          })}

          {/* Empty state */}
          {steps.length === 0 && (
            <Box as="li" role="listitem">
              <EmptyState
                icon={ListTodo}
                title="No steps defined"
                description="Add a step to get started."
                size="sm"
              />
            </Box>
          )}
        </Box>
      </Box>

      {/* Footer with actions */}
      <Box className={STEPS_PANEL_FOOTER_CLASSES}>
        {/* Auto-start toggle */}
        {onAutoStartChange && (
          <Box as="label" className={AUTO_START_LABEL_CLASSES}>
            <Checkbox
              checked={autoStart}
              onChange={(e) => onAutoStartChange(e.target.checked)}
              disabled={disabled}
              aria-describedby={`${baseId}-auto-start-desc`}
            />
            <Text as="span" id={`${baseId}-auto-start-desc`} className={AUTO_START_TEXT_CLASSES}>
              Auto-start next step when complete
            </Text>
          </Box>
        )}

        {/* Add step button */}
        {onAddStep && (
          <Button
            variant="secondary"
            size="sm"
            onClick={onAddStep}
            disabled={disabled}
            className="w-full"
            aria-label={DEFAULT_ADD_STEP_LABEL}
          >
            <Icon icon={Plus} size="sm" aria-hidden="true" />
            <Text as="span">Add Step</Text>
          </Button>
        )}
      </Box>
    </Box>
  );
});

StepsPanel.displayName = 'StepsPanel';
StepsPanelSkeleton.displayName = 'StepsPanelSkeleton';
StepsPanelError.displayName = 'StepsPanelError';
