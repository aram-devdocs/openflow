/**
 * WorkflowPreview - Displays a preview of workflow steps with status icons
 *
 * This component renders workflow steps with their current status,
 * showing completed, in-progress, skipped, and pending states visually.
 *
 * Accessibility Features:
 * - Semantic heading hierarchy (h4 for workflow name)
 * - Ordered list (ol) with role="list" for step sequence
 * - Screen reader announcements via VisuallyHidden
 * - Status conveyed beyond color (icon + text status)
 * - aria-current="step" for active step
 * - Proper focus management
 * - motion-safe: prefix for reduced motion support
 * - Responsive sizing via ResponsiveValue
 */

import type { WorkflowStep, WorkflowTemplate } from '@openflow/generated';
import { WorkflowStepStatus } from '@openflow/generated';
import type { ResponsiveValue } from '@openflow/primitives';
import { Box, Heading, List, Text, VisuallyHidden } from '@openflow/primitives';
import { cn } from '@openflow/utils';
import { AlertTriangle, CheckCircle, Circle, Loader2, RefreshCw, SkipForward } from 'lucide-react';
import { type HTMLAttributes, forwardRef, useId } from 'react';
import { Button } from '../atoms/Button';
import { Icon } from '../atoms/Icon';
import { Skeleton } from '../atoms/Skeleton';

// ============================================================================
// Types
// ============================================================================

export type WorkflowPreviewSize = 'sm' | 'md' | 'lg';
export type WorkflowPreviewBreakpoint = 'base' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

export interface WorkflowPreviewProps extends Omit<HTMLAttributes<HTMLDivElement>, 'role'> {
  /** Workflow template to preview */
  workflow: WorkflowTemplate;
  /** Maximum number of steps to show (remaining shown as "+N more") */
  maxSteps?: number;
  /** Whether to show step descriptions */
  showDescriptions?: boolean;
  /** Index of the currently active step (0-based) */
  activeStepIndex?: number;
  /** Whether the component is in a loading state */
  loading?: boolean;
  /** Whether there is an error */
  error?: boolean;
  /** Error message to display */
  errorMessage?: string;
  /** Callback when retry is clicked in error state */
  onRetry?: () => void;
  /** Responsive size variant */
  size?: ResponsiveValue<WorkflowPreviewSize>;
  /** Accessible label for the workflow preview */
  'aria-label'?: string;
  /** Data attributes for testing */
  'data-testid'?: string;
}

export interface WorkflowPreviewSkeletonProps extends Omit<HTMLAttributes<HTMLDivElement>, 'role'> {
  /** Number of step skeleton items to show */
  stepCount?: number;
  /** Whether to show description skeletons */
  showDescriptions?: boolean;
  /** Responsive size variant */
  size?: ResponsiveValue<WorkflowPreviewSize>;
  /** Data attributes for testing */
  'data-testid'?: string;
}

export interface WorkflowPreviewErrorProps extends Omit<HTMLAttributes<HTMLDivElement>, 'role'> {
  /** Error message to display */
  message?: string;
  /** Callback when retry is clicked */
  onRetry?: () => void;
  /** Whether retry is in progress */
  retrying?: boolean;
  /** Responsive size variant */
  size?: ResponsiveValue<WorkflowPreviewSize>;
  /** Data attributes for testing */
  'data-testid'?: string;
}

// ============================================================================
// Constants
// ============================================================================

/**
 * Breakpoint order for responsive class generation
 */
const BREAKPOINT_ORDER: readonly WorkflowPreviewBreakpoint[] = [
  'base',
  'sm',
  'md',
  'lg',
  'xl',
  '2xl',
] as const;

/**
 * Default accessible label for the workflow preview
 */
export const DEFAULT_WORKFLOW_PREVIEW_LABEL = 'Workflow preview';

/**
 * Default label for loading state screen reader announcement
 */
export const DEFAULT_LOADING_LABEL = 'Loading workflow preview';

/**
 * Default error message
 */
export const DEFAULT_ERROR_MESSAGE = 'Failed to load workflow';

/**
 * Default retry button label
 */
export const DEFAULT_RETRY_LABEL = 'Retry';

/**
 * Default step count for skeleton
 */
export const DEFAULT_SKELETON_STEP_COUNT = 3;

/**
 * Screen reader text for step status
 */
export const SR_STATUS_COMPLETED = 'Completed';
export const SR_STATUS_IN_PROGRESS = 'In progress';
export const SR_STATUS_SKIPPED = 'Skipped';
export const SR_STATUS_PENDING = 'Pending';

/**
 * Screen reader text for remaining steps
 */
export const SR_MORE_STEPS_SINGULAR = 'more step';
export const SR_MORE_STEPS_PLURAL = 'more steps';

/**
 * Base classes for the workflow preview container
 */
export const WORKFLOW_PREVIEW_BASE_CLASSES = 'space-y-3';

/**
 * Size classes for the workflow preview
 */
export const WORKFLOW_PREVIEW_SIZE_CLASSES: Record<
  WorkflowPreviewSize,
  {
    container: string;
    heading: string;
    description: string;
    stepGap: string;
    stepText: string;
    stepDescription: string;
    iconWrapper: string;
    moreText: string;
  }
> = {
  sm: {
    container: 'space-y-2',
    heading: 'text-sm font-medium',
    description: 'text-xs',
    stepGap: 'space-y-1.5',
    stepText: 'text-xs font-medium',
    stepDescription: 'text-[10px] mt-0.5',
    iconWrapper: 'h-4 w-4',
    moreText: 'text-[10px] pl-5',
  },
  md: {
    container: 'space-y-3',
    heading: 'text-base font-medium',
    description: 'text-sm',
    stepGap: 'space-y-2',
    stepText: 'text-sm font-medium',
    stepDescription: 'text-xs mt-1',
    iconWrapper: 'h-5 w-5',
    moreText: 'text-xs pl-7',
  },
  lg: {
    container: 'space-y-4',
    heading: 'text-lg font-medium',
    description: 'text-base',
    stepGap: 'space-y-3',
    stepText: 'text-base font-medium',
    stepDescription: 'text-sm mt-1',
    iconWrapper: 'h-6 w-6',
    moreText: 'text-sm pl-8',
  },
};

/**
 * Classes for step status icons
 */
export const STEP_ICON_CLASSES: Record<WorkflowStepStatus, string> = {
  [WorkflowStepStatus.Completed]: 'text-[hsl(var(--success))]',
  [WorkflowStepStatus.InProgress]: 'text-[hsl(var(--primary))] motion-safe:animate-spin',
  [WorkflowStepStatus.Skipped]: 'text-[hsl(var(--muted-foreground))]',
  [WorkflowStepStatus.Pending]: 'text-[hsl(var(--muted-foreground))]',
};

/**
 * Classes for step text based on completion status
 */
export const STEP_TEXT_COMPLETED_CLASSES = 'text-[hsl(var(--muted-foreground))] line-through';
export const STEP_TEXT_DEFAULT_CLASSES = 'text-[hsl(var(--foreground))]';

/**
 * Classes for skeleton components
 */
export const SKELETON_HEADING_CLASSES = 'h-5 w-32';
export const SKELETON_DESCRIPTION_CLASSES = 'h-4 w-48';
export const SKELETON_STEP_ICON_CLASSES = 'h-5 w-5 rounded-full';
export const SKELETON_STEP_TEXT_CLASSES = 'h-4 w-24';
export const SKELETON_STEP_DESC_CLASSES = 'h-3 w-full mt-1';

/**
 * Error state classes
 */
export const ERROR_CONTAINER_CLASSES = 'flex flex-col items-center justify-center gap-3 py-6';
export const ERROR_ICON_CLASSES = 'text-[hsl(var(--destructive))]';
export const ERROR_MESSAGE_CLASSES = 'text-sm text-center text-[hsl(var(--muted-foreground))]';

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Get the base size value from a ResponsiveValue
 */
export function getBaseSize(
  size: ResponsiveValue<WorkflowPreviewSize> | undefined
): WorkflowPreviewSize {
  if (!size) return 'md';
  if (typeof size === 'string') return size;
  return size.base ?? 'md';
}

/**
 * Get responsive size classes
 */
export function getResponsiveSizeClasses(
  size: ResponsiveValue<WorkflowPreviewSize> | undefined,
  classKey: keyof (typeof WORKFLOW_PREVIEW_SIZE_CLASSES)['md']
): string {
  if (!size) return WORKFLOW_PREVIEW_SIZE_CLASSES.md[classKey];

  if (typeof size === 'string') {
    return WORKFLOW_PREVIEW_SIZE_CLASSES[size][classKey];
  }

  const classes: string[] = [];

  for (const breakpoint of BREAKPOINT_ORDER) {
    const sizeValue = size[breakpoint];
    if (sizeValue) {
      const sizeClasses = WORKFLOW_PREVIEW_SIZE_CLASSES[sizeValue][classKey];
      if (breakpoint === 'base') {
        // Split and add each class individually
        classes.push(...sizeClasses.split(' '));
      } else {
        // Add breakpoint prefix to each class
        classes.push(...sizeClasses.split(' ').map((c) => `${breakpoint}:${c}`));
      }
    }
  }

  return classes.join(' ');
}

/**
 * Get the icon component for a step based on its status
 */
export function getStepIcon(status: WorkflowStepStatus) {
  switch (status) {
    case WorkflowStepStatus.Completed:
      return CheckCircle;
    case WorkflowStepStatus.InProgress:
      return Loader2;
    case WorkflowStepStatus.Skipped:
      return SkipForward;
    default:
      return Circle;
  }
}

/**
 * Get the CSS classes for a step icon based on its status
 */
export function getStepIconClass(status: WorkflowStepStatus): string {
  return STEP_ICON_CLASSES[status] ?? STEP_ICON_CLASSES[WorkflowStepStatus.Pending];
}

/**
 * Get the screen reader text for a step status
 */
export function getStatusLabel(status: WorkflowStepStatus): string {
  switch (status) {
    case WorkflowStepStatus.Completed:
      return SR_STATUS_COMPLETED;
    case WorkflowStepStatus.InProgress:
      return SR_STATUS_IN_PROGRESS;
    case WorkflowStepStatus.Skipped:
      return SR_STATUS_SKIPPED;
    default:
      return SR_STATUS_PENDING;
  }
}

/**
 * Build an accessible label for a step
 */
export function buildStepAccessibleLabel(
  stepNumber: number,
  stepName: string,
  status: WorkflowStepStatus,
  isActive: boolean
): string {
  const statusLabel = getStatusLabel(status);
  const activeLabel = isActive ? ', current step' : '';
  return `Step ${stepNumber}: ${stepName}. Status: ${statusLabel}${activeLabel}`;
}

/**
 * Get the "more steps" text
 */
export function getMoreStepsText(count: number): string {
  return `+${count} ${count === 1 ? SR_MORE_STEPS_SINGULAR : SR_MORE_STEPS_PLURAL}`;
}

/**
 * Build workflow summary for screen readers
 */
export function buildWorkflowSummary(workflow: WorkflowTemplate): string {
  const { steps } = workflow;
  const completed = steps.filter((s) => s.status === WorkflowStepStatus.Completed).length;
  const inProgress = steps.filter((s) => s.status === WorkflowStepStatus.InProgress).length;
  const skipped = steps.filter((s) => s.status === WorkflowStepStatus.Skipped).length;
  const pending = steps.filter((s) => s.status === WorkflowStepStatus.Pending).length;

  const parts: string[] = [`${steps.length} total steps`];
  if (completed > 0) parts.push(`${completed} completed`);
  if (inProgress > 0) parts.push(`${inProgress} in progress`);
  if (skipped > 0) parts.push(`${skipped} skipped`);
  if (pending > 0) parts.push(`${pending} pending`);

  return parts.join(', ');
}

// ============================================================================
// Components
// ============================================================================

/**
 * Internal component for individual step items
 */
interface StepItemProps {
  step: WorkflowStep;
  stepNumber: number;
  showDescription?: boolean;
  isActive?: boolean;
  size?: ResponsiveValue<WorkflowPreviewSize>;
  'data-testid'?: string;
}

const StepItem = forwardRef<HTMLLIElement, StepItemProps>(function StepItem(
  { step, stepNumber, showDescription = false, isActive = false, size, 'data-testid': testId },
  ref
) {
  const StepIcon = getStepIcon(step.status);
  const iconClass = getStepIconClass(step.status);
  const isCompleted = step.status === WorkflowStepStatus.Completed;
  const statusLabel = getStatusLabel(step.status);

  return (
    <Box
      as="li"
      ref={ref}
      className="flex items-start gap-2"
      aria-current={isActive ? 'step' : undefined}
      data-testid={testId}
      data-step-index={step.index}
      data-step-status={step.status}
    >
      {/* Status icon */}
      <Box
        className={cn(
          'mt-0.5 flex shrink-0 items-center justify-center',
          getResponsiveSizeClasses(size, 'iconWrapper')
        )}
      >
        <Icon icon={StepIcon} size="sm" className={iconClass} aria-hidden={true} />
      </Box>

      {/* Step content */}
      <Box className="flex-1 min-w-0">
        <Text
          as="span"
          className={cn(
            getResponsiveSizeClasses(size, 'stepText'),
            isCompleted ? STEP_TEXT_COMPLETED_CLASSES : STEP_TEXT_DEFAULT_CLASSES
          )}
        >
          {stepNumber}. {step.name}
        </Text>

        {/* Screen reader status announcement */}
        <VisuallyHidden> - {statusLabel}</VisuallyHidden>

        {/* Step description (truncated) */}
        {showDescription && step.description && (
          <Text
            as="p"
            className={cn(
              'text-[hsl(var(--muted-foreground))] line-clamp-2',
              getResponsiveSizeClasses(size, 'stepDescription')
            )}
          >
            {step.description}
          </Text>
        )}
      </Box>
    </Box>
  );
});

StepItem.displayName = 'StepItem';

/**
 * WorkflowPreviewSkeleton - Loading skeleton for workflow preview
 */
export const WorkflowPreviewSkeleton = forwardRef<HTMLDivElement, WorkflowPreviewSkeletonProps>(
  function WorkflowPreviewSkeleton(
    {
      stepCount = DEFAULT_SKELETON_STEP_COUNT,
      showDescriptions = false,
      size,
      className,
      'data-testid': testId,
      ...props
    },
    ref
  ) {
    return (
      <Box
        ref={ref}
        className={cn(
          WORKFLOW_PREVIEW_BASE_CLASSES,
          getResponsiveSizeClasses(size, 'container'),
          className
        )}
        role="presentation"
        aria-hidden={true}
        data-testid={testId ?? 'workflow-preview-skeleton'}
        data-step-count={stepCount}
        {...props}
      >
        {/* Workflow name skeleton */}
        <Skeleton className={SKELETON_HEADING_CLASSES} />

        {/* Description skeleton (optional) */}
        {showDescriptions && <Skeleton className={SKELETON_DESCRIPTION_CLASSES} />}

        {/* Steps list skeleton */}
        <Box className={getResponsiveSizeClasses(size, 'stepGap')}>
          {Array.from({ length: stepCount }).map((_, index) => (
            <Box key={index} className="flex items-start gap-2">
              <Skeleton className={SKELETON_STEP_ICON_CLASSES} />
              <Box className="flex-1">
                <Skeleton className={SKELETON_STEP_TEXT_CLASSES} />
                {showDescriptions && <Skeleton className={SKELETON_STEP_DESC_CLASSES} />}
              </Box>
            </Box>
          ))}
        </Box>
      </Box>
    );
  }
);

WorkflowPreviewSkeleton.displayName = 'WorkflowPreviewSkeleton';

/**
 * WorkflowPreviewError - Error state for workflow preview
 */
export const WorkflowPreviewError = forwardRef<HTMLDivElement, WorkflowPreviewErrorProps>(
  function WorkflowPreviewError(
    {
      message = DEFAULT_ERROR_MESSAGE,
      onRetry,
      retrying = false,
      size,
      className,
      'data-testid': testId,
      ...props
    },
    ref
  ) {
    const baseSize = getBaseSize(size);
    const iconSize = baseSize === 'sm' ? 'md' : baseSize === 'lg' ? 'xl' : 'lg';

    return (
      <Box
        ref={ref}
        className={cn(ERROR_CONTAINER_CLASSES, className)}
        role="alert"
        aria-live="assertive"
        data-testid={testId ?? 'workflow-preview-error'}
        {...props}
      >
        <Icon
          icon={AlertTriangle}
          size={iconSize}
          className={ERROR_ICON_CLASSES}
          aria-hidden={true}
        />
        <Text as="p" className={ERROR_MESSAGE_CLASSES}>
          {message}
        </Text>
        {onRetry && (
          <Button
            variant="secondary"
            size="sm"
            onClick={onRetry}
            disabled={retrying}
            loading={retrying}
            loadingText="Retrying"
            icon={<Icon icon={RefreshCw} size="sm" aria-hidden={true} />}
            aria-label={retrying ? 'Retrying' : DEFAULT_RETRY_LABEL}
            className="min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0"
          >
            {DEFAULT_RETRY_LABEL}
          </Button>
        )}
      </Box>
    );
  }
);

WorkflowPreviewError.displayName = 'WorkflowPreviewError';

/**
 * WorkflowPreview component for displaying a preview of workflow steps.
 * Stateless - receives all data via props.
 *
 * Features:
 * - Workflow name as header
 * - Ordered list of steps with status icons
 * - Optional step descriptions (truncated)
 * - Collapse to max steps with "+N more" indicator
 * - Proper ARIA semantics
 * - Loading and error states
 * - Responsive sizing
 *
 * @example
 * <WorkflowPreview workflow={selectedWorkflow} />
 *
 * @example
 * <WorkflowPreview
 *   workflow={workflow}
 *   maxSteps={5}
 *   showDescriptions={true}
 *   activeStepIndex={2}
 * />
 */
export const WorkflowPreview = forwardRef<HTMLDivElement, WorkflowPreviewProps>(
  function WorkflowPreview(
    {
      workflow,
      maxSteps,
      showDescriptions = false,
      activeStepIndex,
      loading = false,
      error = false,
      errorMessage,
      onRetry,
      size,
      className,
      'aria-label': ariaLabel,
      'data-testid': testId,
      ...props
    },
    ref
  ) {
    const headingId = useId();
    const listId = useId();

    // Handle loading state
    if (loading) {
      return (
        <WorkflowPreviewSkeleton
          stepCount={maxSteps ?? DEFAULT_SKELETON_STEP_COUNT}
          showDescriptions={showDescriptions}
          size={size}
          className={className}
          data-testid={testId ? `${testId}-skeleton` : undefined}
        />
      );
    }

    // Handle error state
    if (error) {
      return (
        <WorkflowPreviewError
          message={errorMessage}
          onRetry={onRetry}
          size={size}
          className={className}
          data-testid={testId ? `${testId}-error` : undefined}
        />
      );
    }

    const { steps } = workflow;
    const hasMore = maxSteps !== undefined && steps.length > maxSteps;
    const visibleSteps = hasMore ? steps.slice(0, maxSteps) : steps;
    const remainingCount = hasMore ? steps.length - maxSteps : 0;
    const workflowSummary = buildWorkflowSummary(workflow);

    return (
      <Box
        ref={ref}
        className={cn(
          WORKFLOW_PREVIEW_BASE_CLASSES,
          getResponsiveSizeClasses(size, 'container'),
          className
        )}
        role="region"
        aria-label={ariaLabel ?? `${workflow.name} workflow preview`}
        aria-describedby={headingId}
        data-testid={testId}
        data-workflow-id={workflow.id}
        data-step-count={steps.length}
        data-visible-steps={visibleSteps.length}
        {...props}
      >
        {/* Screen reader summary */}
        <VisuallyHidden>
          <Text as="span" role="status" aria-live="polite">
            {workflow.name} workflow: {workflowSummary}
          </Text>
        </VisuallyHidden>

        {/* Workflow name */}
        <Heading
          level={4}
          id={headingId}
          className={cn('text-[hsl(var(--foreground))]', getResponsiveSizeClasses(size, 'heading'))}
        >
          {workflow.name}
        </Heading>

        {/* Description if available */}
        {workflow.description && (
          <Text
            as="p"
            className={cn(
              'text-[hsl(var(--muted-foreground))]',
              getResponsiveSizeClasses(size, 'description')
            )}
          >
            {workflow.description}
          </Text>
        )}

        {/* Steps list */}
        <List
          ordered
          id={listId}
          className={getResponsiveSizeClasses(size, 'stepGap')}
          aria-label={`Steps in ${workflow.name}`}
        >
          {visibleSteps.map((step, index) => (
            <StepItem
              key={step.index}
              step={step}
              stepNumber={index + 1}
              showDescription={showDescriptions}
              isActive={activeStepIndex === step.index}
              size={size}
              data-testid={testId ? `${testId}-step-${index}` : undefined}
            />
          ))}
        </List>

        {/* Show remaining count if collapsed */}
        {hasMore && (
          <Text
            as="p"
            className={cn(
              'text-[hsl(var(--muted-foreground))]',
              getResponsiveSizeClasses(size, 'moreText')
            )}
            aria-label={`${remainingCount} additional steps not shown`}
          >
            {getMoreStepsText(remainingCount)}
          </Text>
        )}
      </Box>
    );
  }
);

WorkflowPreview.displayName = 'WorkflowPreview';
