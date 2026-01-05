/**
 * TaskExecutionView - Task Execution Page Component
 *
 * This component displays a task with its execution steps using the new
 * agent orchestration system. It uses the useTaskWithSteps hook to fetch
 * task data with steps, and provides controls for starting, pausing,
 * resuming, and cancelling task execution.
 *
 * Architecture:
 * - Pure view layer - all state comes from TanStack Query hooks
 * - Uses event subscriptions to invalidate queries on backend events
 * - Displays step progress with live agent events
 * - Handles permission requests from agents
 *
 * @module TaskExecutionView
 */

import type {
  Permission,
  StepStatus,
  Task,
  TaskStatus,
  TaskStep,
  TaskWithSteps,
} from '@openflow/generated';
import { Box, Flex, Heading, Text, VisuallyHidden } from '@openflow/primitives';
import { cn } from '@openflow/utils';
import {
  AlertTriangle,
  CheckCircle,
  Circle,
  Loader2,
  Pause,
  Play,
  RefreshCw,
  SkipForward,
  Square,
  XCircle,
} from 'lucide-react';
import { type HTMLAttributes, forwardRef, useMemo } from 'react';
import { Button } from '../atoms/Button';
import { Icon } from '../atoms/Icon';

// ============================================================================
// Types
// ============================================================================

/** Props for TaskExecutionHeader */
export interface TaskExecutionHeaderProps {
  task: Task;
  onBack?: () => void;
  onStart?: () => void;
  onPause?: () => void;
  onResume?: () => void;
  onCancel?: () => void;
  isStarting?: boolean;
  isPausing?: boolean;
  isResuming?: boolean;
  isCancelling?: boolean;
}

/** Props for TaskStepItem */
export interface TaskStepItemProps {
  step: TaskStep;
  isActive: boolean;
  onClick?: () => void;
}

/** Props for TaskStepList */
export interface TaskStepListProps {
  steps: TaskStep[];
  currentStepIndex: number;
  onStepClick?: (step: TaskStep) => void;
}

/** Props for PermissionPrompt */
export interface PermissionPromptProps {
  permission: Permission;
  onApprove: () => void;
  onDeny: () => void;
  isResponding?: boolean;
}

/** Props for TaskExecutionView */
export interface TaskExecutionViewProps
  extends Omit<HTMLAttributes<HTMLDivElement>, 'children' | 'title'> {
  /** Page state */
  state: 'loading' | 'not-found' | 'error' | 'ready';
  /** Error message (for error state) */
  errorMessage?: string;
  /** Retry callback (for error state) */
  onRetry?: () => void;
  /** Back callback */
  onBack?: () => void;
  /** Task with steps data (for ready state) */
  taskWithSteps?: TaskWithSteps;
  /** Whether task is currently running in executor */
  isRunning?: boolean;
  /** Pending permission (if any) */
  pendingPermission?: Permission | null;
  /** Start task callback */
  onStart?: () => void;
  /** Pause task callback */
  onPause?: () => void;
  /** Resume task callback */
  onResume?: () => void;
  /** Cancel task callback */
  onCancel?: () => void;
  /** Approve permission callback */
  onApprovePermission?: () => void;
  /** Deny permission callback */
  onDenyPermission?: () => void;
  /** Step click callback */
  onStepClick?: (step: TaskStep) => void;
  /** Mutation loading states */
  isStarting?: boolean;
  isPausing?: boolean;
  isResuming?: boolean;
  isCancelling?: boolean;
  isRespondingPermission?: boolean;
  /** Test ID */
  'data-testid'?: string;
}

// ============================================================================
// Constants
// ============================================================================

const STEP_STATUS_ICONS: Record<StepStatus, typeof Circle> = {
  pending: Circle,
  running: Loader2,
  completed: CheckCircle,
  failed: XCircle,
  skipped: SkipForward,
};

const STEP_STATUS_COLORS: Record<StepStatus, string> = {
  pending: 'text-muted-foreground',
  running: 'text-primary animate-spin',
  completed: 'text-success',
  failed: 'text-destructive',
  skipped: 'text-muted-foreground',
};

const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  pending: 'Pending',
  running: 'Running',
  paused: 'Paused',
  completed: 'Completed',
  failed: 'Failed',
  cancelled: 'Cancelled',
};

const TASK_STATUS_COLORS: Record<TaskStatus, string> = {
  pending: 'bg-muted text-muted-foreground',
  running: 'bg-primary/10 text-primary',
  paused: 'bg-warning/10 text-warning',
  completed: 'bg-success/10 text-success',
  failed: 'bg-destructive/10 text-destructive',
  cancelled: 'bg-muted text-muted-foreground',
};

// ============================================================================
// Sub-components
// ============================================================================

/**
 * TaskExecutionHeader - Header with task info and execution controls
 */
export const TaskExecutionHeader = forwardRef<HTMLDivElement, TaskExecutionHeaderProps>(
  (
    {
      task,
      onBack,
      onStart,
      onPause,
      onResume,
      onCancel,
      isStarting,
      isPausing,
      isResuming,
      isCancelling,
    },
    ref
  ) => {
    const canStart = task.status === 'pending';
    const canPause = task.status === 'running';
    const canResume = task.status === 'paused';
    const canCancel = task.status === 'running' || task.status === 'paused';
    const isTerminal =
      task.status === 'completed' || task.status === 'failed' || task.status === 'cancelled';

    return (
      <Flex
        ref={ref}
        direction="column"
        gap="4"
        className="border-b border-border bg-background p-4"
      >
        {/* Title and status row */}
        <Flex align="center" justify="between" gap="4">
          <Flex align="center" gap="3">
            {onBack && (
              <Button variant="ghost" size="sm" onClick={onBack} aria-label="Go back">
                ←
              </Button>
            )}
            <Heading level={1} className="text-xl font-semibold">
              {task.title}
            </Heading>
            <Text
              as="span"
              className={cn(
                'rounded-full px-2 py-0.5 text-xs font-medium',
                TASK_STATUS_COLORS[task.status]
              )}
            >
              {TASK_STATUS_LABELS[task.status]}
            </Text>
          </Flex>

          {/* Execution controls */}
          <Flex gap="2">
            {canStart && (
              <Button
                variant="primary"
                size="sm"
                onClick={onStart}
                disabled={isStarting}
                icon={
                  isStarting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Play className="h-4 w-4" />
                  )
                }
              >
                {isStarting ? 'Starting...' : 'Start'}
              </Button>
            )}
            {canPause && (
              <Button
                variant="secondary"
                size="sm"
                onClick={onPause}
                disabled={isPausing}
                icon={
                  isPausing ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Pause className="h-4 w-4" />
                  )
                }
              >
                {isPausing ? 'Pausing...' : 'Pause'}
              </Button>
            )}
            {canResume && (
              <Button
                variant="primary"
                size="sm"
                onClick={onResume}
                disabled={isResuming}
                icon={
                  isResuming ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Play className="h-4 w-4" />
                  )
                }
              >
                {isResuming ? 'Resuming...' : 'Resume'}
              </Button>
            )}
            {canCancel && (
              <Button
                variant="destructive"
                size="sm"
                onClick={onCancel}
                disabled={isCancelling}
                icon={
                  isCancelling ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Square className="h-4 w-4" />
                  )
                }
              >
                {isCancelling ? 'Cancelling...' : 'Cancel'}
              </Button>
            )}
            {isTerminal && (
              <Text className="text-sm text-muted-foreground">Task {task.status}</Text>
            )}
          </Flex>
        </Flex>

        {/* Description */}
        {task.description && (
          <Text className="text-sm text-muted-foreground">{task.description}</Text>
        )}
      </Flex>
    );
  }
);

TaskExecutionHeader.displayName = 'TaskExecutionHeader';

/**
 * TaskStepItem - Individual step in the step list
 */
export const TaskStepItem = forwardRef<HTMLButtonElement, TaskStepItemProps>(
  ({ step, isActive, onClick }, ref) => {
    const StatusIcon = STEP_STATUS_ICONS[step.status];
    const statusColor = STEP_STATUS_COLORS[step.status];

    return (
      <button
        ref={ref}
        type="button"
        onClick={onClick}
        className={cn(
          'flex w-full items-center gap-3 rounded-md px-3 py-2 text-left transition-colors',
          'hover:bg-accent/50 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
          isActive && 'bg-accent'
        )}
        aria-current={isActive ? 'step' : undefined}
        aria-label={`Step ${step.stepIndex + 1}: ${step.title}. Status: ${step.status}`}
      >
        <Icon icon={StatusIcon} className={cn('h-4 w-4 flex-shrink-0', statusColor)} />
        <Flex direction="column" className="min-w-0 flex-1">
          <Text className="truncate text-sm font-medium">{step.title}</Text>
          <Text className="truncate text-xs text-muted-foreground">{step.providerId}</Text>
        </Flex>
        <Text as="span" className="flex-shrink-0 text-xs text-muted-foreground">{step.stepIndex + 1}</Text>
      </button>
    );
  }
);

TaskStepItem.displayName = 'TaskStepItem';

/**
 * TaskStepList - List of task steps with progress indication
 */
export const TaskStepList = forwardRef<HTMLDivElement, TaskStepListProps>(
  ({ steps, currentStepIndex, onStepClick }, ref) => {
    const completedCount = useMemo(
      () => steps.filter((s) => s.status === 'completed').length,
      [steps]
    );
    const progressPercent = steps.length > 0 ? (completedCount / steps.length) * 100 : 0;

    return (
      <Flex ref={ref} direction="column" gap="3" className="p-4">
        {/* Progress bar */}
        <Flex direction="column" gap="1">
          <Flex justify="between" className="text-xs text-muted-foreground">
            <Text as="span">Progress</Text>
            <Text as="span">
              {completedCount}/{steps.length} steps
            </Text>
          </Flex>
          <Box className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <Box
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </Box>
        </Flex>

        {/* Step list */}
        <Flex direction="column" gap="1" role="list" aria-label="Task steps">
          {steps.length === 0 ? (
            <Text className="py-8 text-center text-sm text-muted-foreground">
              No steps defined for this task
            </Text>
          ) : (
            steps.map((step) => (
              <TaskStepItem
                key={step.id}
                step={step}
                isActive={step.stepIndex === currentStepIndex}
                onClick={() => onStepClick?.(step)}
              />
            ))
          )}
        </Flex>
      </Flex>
    );
  }
);

TaskStepList.displayName = 'TaskStepList';

/**
 * PermissionPrompt - Dialog for agent permission requests
 */
export const PermissionPrompt = forwardRef<HTMLDivElement, PermissionPromptProps>(
  ({ permission, onApprove, onDeny, isResponding }, ref) => {
    return (
      <Flex
        ref={ref}
        direction="column"
        gap="3"
        className="rounded-lg border border-warning bg-warning/5 p-4"
        role="alertdialog"
        aria-labelledby="permission-title"
        aria-describedby="permission-description"
      >
        <Flex align="center" gap="2">
          <Icon icon={AlertTriangle} className="h-5 w-5 text-warning" />
          <Heading level={3} id="permission-title" className="text-sm font-semibold">
            Permission Required
          </Heading>
        </Flex>

        <Box id="permission-description">
          <Text className="text-sm">
            <strong>{permission.toolName}</strong>: {permission.description}
          </Text>
          {permission.filePath && (
            <Text className="mt-1 font-mono text-xs text-muted-foreground">
              {permission.filePath}
            </Text>
          )}
        </Box>

        <Flex gap="2" justify="end">
          <Button variant="ghost" size="sm" onClick={onDeny} disabled={isResponding}>
            Deny
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={onApprove}
            disabled={isResponding}
            icon={isResponding ? <Loader2 className="h-4 w-4 animate-spin" /> : undefined}
          >
            {isResponding ? 'Approving...' : 'Approve'}
          </Button>
        </Flex>
      </Flex>
    );
  }
);

PermissionPrompt.displayName = 'PermissionPrompt';

/**
 * TaskExecutionSkeleton - Loading skeleton
 */
export const TaskExecutionSkeleton = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    return (
      <Flex
        ref={ref}
        direction="column"
        className={cn('h-full w-full animate-pulse', className)}
        role="status"
        aria-label="Loading task"
        {...props}
      >
        {/* Header skeleton */}
        <Flex direction="column" gap="4" className="border-b border-border p-4">
          <Flex align="center" gap="3">
            <Box className="h-8 w-8 rounded bg-muted" />
            <Box className="h-6 w-48 rounded bg-muted" />
            <Box className="h-5 w-16 rounded-full bg-muted" />
          </Flex>
          <Box className="h-4 w-96 rounded bg-muted" />
        </Flex>

        {/* Steps skeleton */}
        <Flex direction="column" gap="3" className="p-4">
          <Box className="h-1.5 w-full rounded-full bg-muted" />
          {[1, 2, 3].map((i) => (
            <Flex key={i} align="center" gap="3" className="rounded-md p-2">
              <Box className="h-4 w-4 rounded-full bg-muted" />
              <Box className="h-4 flex-1 rounded bg-muted" />
            </Flex>
          ))}
        </Flex>
      </Flex>
    );
  }
);

TaskExecutionSkeleton.displayName = 'TaskExecutionSkeleton';

/**
 * TaskExecutionError - Error state
 */
export const TaskExecutionError = forwardRef<
  HTMLDivElement,
  { message?: string; onRetry?: () => void; onBack?: () => void }
>(({ message = 'Failed to load task', onRetry, onBack }, ref) => {
  return (
    <Flex
      ref={ref}
      direction="column"
      align="center"
      justify="center"
      gap="4"
      className="h-full w-full"
      role="alert"
    >
      <Icon icon={AlertTriangle} className="h-12 w-12 text-destructive" />
      <Heading level={2} className="text-lg font-semibold">
        Error
      </Heading>
      <Text className="text-center text-muted-foreground">{message}</Text>
      <Flex gap="2">
        {onBack && (
          <Button variant="ghost" onClick={onBack}>
            Back
          </Button>
        )}
        {onRetry && (
          <Button variant="primary" onClick={onRetry} icon={<RefreshCw className="h-4 w-4" />}>
            Retry
          </Button>
        )}
      </Flex>
    </Flex>
  );
});

TaskExecutionError.displayName = 'TaskExecutionError';

/**
 * TaskExecutionNotFound - Not found state
 */
export const TaskExecutionNotFound = forwardRef<HTMLDivElement, { onBack?: () => void }>(
  ({ onBack }, ref) => {
    return (
      <Flex
        ref={ref}
        direction="column"
        align="center"
        justify="center"
        gap="4"
        className="h-full w-full"
      >
        <Icon icon={AlertTriangle} className="h-12 w-12 text-muted-foreground" />
        <Heading level={2} className="text-lg font-semibold">
          Task Not Found
        </Heading>
        <Text className="text-center text-muted-foreground">
          The task you're looking for doesn't exist or has been deleted.
        </Text>
        {onBack && (
          <Button variant="primary" onClick={onBack}>
            Back to Tasks
          </Button>
        )}
      </Flex>
    );
  }
);

TaskExecutionNotFound.displayName = 'TaskExecutionNotFound';

// ============================================================================
// Main Component
// ============================================================================

/**
 * TaskExecutionView - Complete task execution view component
 *
 * Displays a task with its execution steps, providing controls for
 * starting, pausing, resuming, and cancelling task execution.
 *
 * @example
 * ```tsx
 * function TaskExecutionRoute() {
 *   const { taskId } = Route.useParams();
 *   const { data: taskWithSteps, isLoading, error, refetch } = useTaskWithSteps(taskId);
 *   const { data: isRunning } = useIsTaskRunning(taskId);
 *   const { data: permission } = usePendingPermission(taskId, {
 *     refetchInterval: isRunning ? 1000 : false,
 *   });
 *
 *   // Subscribe to live updates
 *   useTaskSubscription(taskId);
 *
 *   const startTask = useStartTask();
 *   const pauseTask = usePauseTask();
 *   const resumeTask = useResumeTask();
 *   const cancelTask = useCancelTask();
 *   const respondToPermission = useRespondToPermission();
 *
 *   if (isLoading) return <TaskExecutionView state="loading" />;
 *   if (error) return <TaskExecutionView state="error" errorMessage={error.message} onRetry={refetch} />;
 *   if (!taskWithSteps) return <TaskExecutionView state="not-found" />;
 *
 *   return (
 *     <TaskExecutionView
 *       state="ready"
 *       taskWithSteps={taskWithSteps}
 *       isRunning={isRunning}
 *       pendingPermission={permission}
 *       onStart={() => startTask.mutate(taskId)}
 *       onPause={() => pauseTask.mutate(taskId)}
 *       onResume={() => resumeTask.mutate(taskId)}
 *       onCancel={() => cancelTask.mutate(taskId)}
 *       onApprovePermission={() => permission && respondToPermission.mutate({
 *         taskId,
 *         permissionId: permission.id,
 *         approved: true,
 *       })}
 *       onDenyPermission={() => permission && respondToPermission.mutate({
 *         taskId,
 *         permissionId: permission.id,
 *         approved: false,
 *       })}
 *       isStarting={startTask.isPending}
 *       isPausing={pauseTask.isPending}
 *       isResuming={resumeTask.isPending}
 *       isCancelling={cancelTask.isPending}
 *       isRespondingPermission={respondToPermission.isPending}
 *     />
 *   );
 * }
 * ```
 */
export const TaskExecutionView = forwardRef<HTMLDivElement, TaskExecutionViewProps>(
  (
    {
      state,
      errorMessage,
      onRetry,
      onBack,
      taskWithSteps,
      isRunning,
      pendingPermission,
      onStart,
      onPause,
      onResume,
      onCancel,
      onApprovePermission,
      onDenyPermission,
      onStepClick,
      isStarting,
      isPausing,
      isResuming,
      isCancelling,
      isRespondingPermission,
      className,
      'data-testid': testId,
      ...props
    },
    ref
  ) => {
    // Loading state
    if (state === 'loading') {
      return (
        <TaskExecutionSkeleton ref={ref} className={className} data-testid={testId} {...props} />
      );
    }

    // Error state
    if (state === 'error') {
      return (
        <TaskExecutionError ref={ref} message={errorMessage} onRetry={onRetry} onBack={onBack} />
      );
    }

    // Not found state
    if (state === 'not-found') {
      return <TaskExecutionNotFound ref={ref} onBack={onBack} />;
    }

    // Ready state - validate required data
    if (!taskWithSteps) {
      return <TaskExecutionNotFound ref={ref} onBack={onBack} />;
    }

    const { task, steps } = taskWithSteps;

    return (
      <Flex
        ref={ref}
        direction="column"
        className={cn('h-full w-full bg-background', className)}
        data-testid={testId}
        data-state="ready"
        data-task-id={task.id}
        data-task-status={task.status}
        data-running={isRunning}
        {...props}
      >
        {/* Screen reader announcement */}
        <VisuallyHidden>
          <Box as="span" role="status" aria-live="polite">
            Task: {task.title}. Status: {task.status}. {steps.length} steps,{' '}
            {steps.filter((s) => s.status === 'completed').length} completed.
          </Box>
        </VisuallyHidden>

        {/* Header with controls */}
        <TaskExecutionHeader
          task={task}
          onBack={onBack}
          onStart={onStart}
          onPause={onPause}
          onResume={onResume}
          onCancel={onCancel}
          isStarting={isStarting}
          isPausing={isPausing}
          isResuming={isResuming}
          isCancelling={isCancelling}
        />

        {/* Main content */}
        <Flex className="min-h-0 flex-1">
          {/* Steps sidebar */}
          <Box className="w-80 shrink-0 overflow-y-auto border-r border-border">
            <TaskStepList
              steps={steps}
              currentStepIndex={task.currentStepIndex}
              onStepClick={onStepClick}
            />
          </Box>

          {/* Main panel - step progress/details */}
          <Flex direction="column" className="min-w-0 flex-1 p-4">
            {/* Permission prompt */}
            {pendingPermission && (
              <PermissionPrompt
                permission={pendingPermission}
                onApprove={onApprovePermission ?? (() => {})}
                onDeny={onDenyPermission ?? (() => {})}
                isResponding={isRespondingPermission}
              />
            )}

            {/* Current step info */}
            {steps.length > 0 && task.currentStepIndex < steps.length ? (
              <Flex direction="column" gap="4" className="flex-1">
                <Flex direction="column" gap="2">
                  <Heading level={2} className="text-lg font-semibold">
                    {steps[task.currentStepIndex].title}
                  </Heading>
                  <Text className="text-sm text-muted-foreground">
                    Step {task.currentStepIndex + 1} of {steps.length} • Provider:{' '}
                    {steps[task.currentStepIndex].providerId}
                  </Text>
                </Flex>

                {/* Prompt preview */}
                <Box className="rounded-md bg-muted/50 p-3">
                  <Text className="text-xs font-medium text-muted-foreground">Prompt:</Text>
                  <Text className="mt-1 whitespace-pre-wrap text-sm">
                    {steps[task.currentStepIndex].prompt}
                  </Text>
                </Box>

                {/* Step progress will be implemented in P7.7 */}
                <Box className="flex-1 rounded-md border border-dashed border-border p-4">
                  <Text className="text-center text-sm text-muted-foreground">
                    {task.status === 'running'
                      ? 'Step progress will appear here...'
                      : task.status === 'pending'
                        ? 'Start the task to begin execution'
                        : task.status === 'paused'
                          ? 'Task is paused. Resume to continue.'
                          : 'Task execution finished'}
                  </Text>
                </Box>
              </Flex>
            ) : (
              <Flex align="center" justify="center" className="flex-1">
                <Text className="text-muted-foreground">
                  {steps.length === 0 ? 'No steps defined for this task' : 'All steps completed'}
                </Text>
              </Flex>
            )}
          </Flex>
        </Flex>
      </Flex>
    );
  }
);

TaskExecutionView.displayName = 'TaskExecutionView';
