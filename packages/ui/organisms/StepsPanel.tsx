import type { WorkflowStep } from '@openflow/generated';
import { WorkflowStepStatus } from '@openflow/generated';
import { cn } from '@openflow/utils';
import {
  Check,
  ChevronDown,
  ChevronRight,
  Circle,
  ListTodo,
  Loader2,
  MessageSquare,
  Play,
  Plus,
  SkipForward,
} from 'lucide-react';
import { useCallback, useState } from 'react';
import { Button } from '../atoms/Button';
import { Checkbox } from '../atoms/Checkbox';
import { Icon } from '../atoms/Icon';
import { Skeleton } from '../atoms/Skeleton';
import { EmptyState } from '../molecules/EmptyState';
import { Tooltip } from '../molecules/Tooltip';

export interface StepsPanelProps {
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
  /** Additional CSS classes */
  className?: string;
}

/**
 * Get the icon component for a step based on its status
 */
function getStepIcon(status: WorkflowStepStatus) {
  switch (status) {
    case WorkflowStepStatus.Completed:
      return Check;
    case WorkflowStepStatus.InProgress:
      return Loader2;
    case WorkflowStepStatus.Skipped:
      return SkipForward;
    case WorkflowStepStatus.Pending:
      return Circle;
    default:
      return Circle;
  }
}

/**
 * Get the status label for display
 */
function getStatusLabel(status: WorkflowStepStatus): string {
  switch (status) {
    case WorkflowStepStatus.Completed:
      return 'Completed';
    case WorkflowStepStatus.InProgress:
      return 'In Progress';
    case WorkflowStepStatus.Skipped:
      return 'Skipped';
    case WorkflowStepStatus.Pending:
      return 'Pending';
    default:
      return 'Pending';
  }
}

/**
 * Loading skeleton for the StepsPanel
 */
function StepsPanelSkeleton({ className }: { className?: string }) {
  return (
    <aside
      aria-label="Loading workflow steps"
      aria-busy="true"
      className={cn('flex h-full flex-col', 'bg-[rgb(var(--background))]', className)}
    >
      {/* Header skeleton */}
      <div className="flex items-center justify-between border-b border-[rgb(var(--border))] px-4 py-3">
        <Skeleton variant="text" width={120} height={16} />
        <Skeleton variant="text" width={80} height={14} />
      </div>

      {/* Steps list skeleton */}
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        <ul className="divide-y divide-[rgb(var(--border))]" role="list">
          {[1, 2, 3, 4].map((i) => (
            <li key={i} className="px-4 py-3">
              <div className="flex items-start gap-3">
                <Skeleton variant="rectangular" width={16} height={16} className="mt-0.5" />
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <Skeleton variant="circular" width={16} height={16} />
                    <Skeleton variant="text" width={`${60 + i * 10}%`} height={16} />
                  </div>
                  <Skeleton variant="text" width="90%" height={14} />
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* Footer skeleton */}
      <div className="border-t border-[rgb(var(--border))] px-4 py-3">
        <Skeleton variant="rectangular" width="100%" height={32} />
      </div>
    </aside>
  );
}

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
export function StepsPanel({
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
  className,
}: StepsPanelProps) {
  // Track which steps are expanded
  const [expandedSteps, setExpandedSteps] = useState<Set<number>>(new Set());

  // Toggle step expansion
  const toggleExpanded = useCallback((stepIndex: number) => {
    setExpandedSteps((prev) => {
      const next = new Set(prev);
      if (next.has(stepIndex)) {
        next.delete(stepIndex);
      } else {
        next.add(stepIndex);
      }
      return next;
    });
  }, []);

  // Handle step checkbox toggle
  const handleToggle = useCallback(
    (stepIndex: number, event: React.ChangeEvent<HTMLInputElement>) => {
      if (disabled) return;
      onToggleStep?.(stepIndex, event.target.checked);
    },
    [disabled, onToggleStep]
  );

  // Handle start button click
  const handleStart = useCallback(
    (stepIndex: number) => {
      if (disabled) return;
      onStartStep?.(stepIndex);
    },
    [disabled, onStartStep]
  );

  // Handle complete button click
  const handleComplete = useCallback(
    (stepIndex: number) => {
      if (disabled) return;
      onCompleteStep?.(stepIndex);
    },
    [disabled, onCompleteStep]
  );

  // Handle skip button click
  const handleSkip = useCallback(
    (stepIndex: number) => {
      if (disabled) return;
      onSkipStep?.(stepIndex);
    },
    [disabled, onSkipStep]
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
    (stepIndex: number) => {
      onSelectStep?.(stepIndex);
    },
    [onSelectStep]
  );

  // Handle keyboard navigation on step row
  const handleKeyDown = useCallback(
    (stepIndex: number, event: React.KeyboardEvent) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        onSelectStep?.(stepIndex);
      }
    },
    [onSelectStep]
  );

  // Show loading skeleton
  if (loading) {
    return <StepsPanelSkeleton className={className} />;
  }

  // Check if any step is in progress
  const hasInProgressStep = steps.some((step) => step.status === WorkflowStepStatus.InProgress);

  const completedCount = steps.filter((s) => s.status === WorkflowStepStatus.Completed).length;

  return (
    <aside
      aria-label="Workflow steps"
      className={cn('flex h-full flex-col', 'bg-[rgb(var(--background))]', className)}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[rgb(var(--border))] px-4 py-3">
        <h3 className="text-sm font-semibold text-[rgb(var(--foreground))]">Workflow Steps</h3>
        <span className="text-xs text-[rgb(var(--muted-foreground))]">
          {completedCount}/{steps.length} completed
        </span>
      </div>

      {/* Steps list */}
      <div className="scrollbar-thin flex-1 overflow-y-auto">
        <ul className="divide-y divide-[rgb(var(--border))]" role="list">
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

            return (
              <li
                key={step.index}
                className={cn(
                  'group relative',
                  'transition-colors duration-150',
                  isActive && 'bg-[rgb(var(--accent))]',
                  !isActive && 'hover:bg-[rgb(var(--muted))]',
                  disabled && 'opacity-60'
                )}
              >
                {/* Current step indicator bar */}
                {isActive && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-[rgb(var(--primary))]" />
                )}

                {/* Step header row */}
                <div
                  className={cn(
                    'flex items-start gap-3 px-4 py-3',
                    'cursor-pointer',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[rgb(var(--ring))]',
                    disabled && 'cursor-not-allowed'
                  )}
                  onClick={() => handleStepClick(index)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  tabIndex={0}
                  role="button"
                  aria-current={isActive ? 'step' : undefined}
                  aria-label={`Step ${index + 1}: ${step.name} - ${getStatusLabel(step.status)}`}
                >
                  {/* Checkbox */}
                  <div className="pt-0.5">
                    <Checkbox
                      checked={isCompleted}
                      indeterminate={isSkipped}
                      disabled={disabled || isInProgress}
                      onChange={(e) => handleToggle(index, e)}
                      onClick={(e) => e.stopPropagation()}
                      aria-label={`Mark step ${index + 1} as ${isCompleted ? 'pending' : 'completed'}`}
                    />
                  </div>

                  {/* Step content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      {/* Status icon */}
                      <Icon
                        icon={StepIcon}
                        size="sm"
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
                      <span
                        className={cn(
                          'text-sm font-medium truncate',
                          isCompleted && 'text-[rgb(var(--muted-foreground))] line-through',
                          isSkipped && 'text-[rgb(var(--muted-foreground))]',
                          !isCompleted && !isSkipped && 'text-[rgb(var(--foreground))]'
                        )}
                      >
                        {step.name}
                      </span>
                    </div>

                    {/* Step description preview (truncated) */}
                    {step.description && !isExpanded && (
                      <p
                        className={cn(
                          'mt-1 text-xs line-clamp-2',
                          'text-[rgb(var(--muted-foreground))]'
                        )}
                      >
                        {step.description}
                      </p>
                    )}

                    {/* In progress indicator */}
                    {isInProgress && (
                      <div className="mt-2 flex items-center gap-1.5 text-xs text-[rgb(var(--primary))]">
                        <span className="relative flex h-2 w-2">
                          <span className="absolute inline-flex h-full w-full motion-safe:animate-ping rounded-full bg-[rgb(var(--primary))] opacity-75" />
                          <span className="relative inline-flex h-2 w-2 rounded-full bg-[rgb(var(--primary))]" />
                        </span>
                        Running...
                      </div>
                    )}
                  </div>

                  {/* Expand/collapse toggle and actions */}
                  <div className="flex items-center gap-1">
                    {/* Quick actions (visible on hover) */}
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 motion-safe:transition-opacity">
                      {canStart && onStartStep && (
                        <Tooltip content="Start this step" position="left">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleStart(index);
                            }}
                            disabled={disabled}
                            className="h-7 w-7 p-0"
                            aria-label={`Start step: ${step.name}`}
                          >
                            <Icon icon={Play} size="sm" />
                          </Button>
                        </Tooltip>
                      )}
                    </div>

                    {/* Expand toggle */}
                    {step.description && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleExpanded(index);
                        }}
                        className="h-7 w-7 p-0"
                        aria-expanded={isExpanded}
                        aria-label={isExpanded ? 'Collapse step details' : 'Expand step details'}
                      >
                        <Icon
                          icon={isExpanded ? ChevronDown : ChevronRight}
                          size="sm"
                          className="text-[rgb(var(--muted-foreground))]"
                        />
                      </Button>
                    )}
                  </div>
                </div>

                {/* Expanded content */}
                {isExpanded && step.description && (
                  <div className="border-t border-[rgb(var(--border))] px-4 py-3 pl-12 space-y-3 bg-[rgb(var(--muted))]/50">
                    {/* Full description */}
                    <p className="text-sm text-[rgb(var(--muted-foreground))] whitespace-pre-wrap">
                      {step.description}
                    </p>

                    {/* Action buttons */}
                    <div className="flex flex-wrap gap-2">
                      {canStart && onStartStep && (
                        <Button
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStart(index);
                          }}
                          disabled={disabled}
                        >
                          <Icon icon={Play} size="sm" className="mr-1" />
                          Start
                        </Button>
                      )}

                      {canComplete && onCompleteStep && (
                        <Button
                          size="sm"
                          variant="primary"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleComplete(index);
                          }}
                          disabled={disabled}
                        >
                          <Icon icon={Check} size="sm" className="mr-1" />
                          Complete
                        </Button>
                      )}

                      {canSkip && onSkipStep && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSkip(index);
                          }}
                          disabled={disabled}
                        >
                          <Icon icon={SkipForward} size="sm" className="mr-1" />
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
                        >
                          <Icon icon={MessageSquare} size="sm" className="mr-1" />
                          View Chat
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </li>
            );
          })}

          {/* Empty state */}
          {steps.length === 0 && (
            <li>
              <EmptyState
                icon={ListTodo}
                title="No steps defined"
                description="Add a step to get started."
                size="sm"
              />
            </li>
          )}
        </ul>
      </div>

      {/* Footer with actions */}
      <div className="border-t border-[rgb(var(--border))] px-4 py-3">
        {/* Auto-start toggle */}
        {onAutoStartChange && (
          // biome-ignore lint/a11y/noLabelWithoutControl: Checkbox is a custom component that wraps an input
          <label className="mb-3 flex items-center gap-2 cursor-pointer">
            <Checkbox
              checked={autoStart}
              onChange={(e) => onAutoStartChange(e.target.checked)}
              disabled={disabled}
              aria-label="Auto-start next step"
            />
            <span className="text-xs text-[rgb(var(--muted-foreground))]">
              Auto-start next step when complete
            </span>
          </label>
        )}

        {/* Add step button */}
        {onAddStep && (
          <Button
            variant="secondary"
            size="sm"
            onClick={onAddStep}
            disabled={disabled}
            className="w-full"
          >
            <Icon icon={Plus} size="sm" />
            <span>Add Step</span>
          </Button>
        )}
      </div>
    </aside>
  );
}

StepsPanel.displayName = 'StepsPanel';
