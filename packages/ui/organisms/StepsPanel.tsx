import type { WorkflowStep } from '@openflow/generated';
import { WorkflowStepStatus } from '@openflow/generated';
import { cn } from '@openflow/utils';
import { Check, Circle, ListTodo, Loader2, Play, Plus, SkipForward } from 'lucide-react';
import { useCallback } from 'react';
import { Button } from '../atoms/Button';
import { Checkbox } from '../atoms/Checkbox';
import { Icon } from '../atoms/Icon';
import { EmptyState } from '../molecules/EmptyState';
import { Tooltip } from '../molecules/Tooltip';

export interface StepsPanelProps {
  /** Array of workflow steps to display */
  steps: WorkflowStep[];
  /** Currently active step index (0-based) */
  activeStepIndex?: number;
  /** Callback when a step's start button is clicked */
  onStartStep?: (stepIndex: number) => void;
  /** Callback when a step is toggled (marked complete/pending) */
  onToggleStep?: (stepIndex: number, completed: boolean) => void;
  /** Callback when a step is clicked for selection */
  onSelectStep?: (stepIndex: number) => void;
  /** Callback when add step button is clicked */
  onAddStep?: () => void;
  /** Whether auto-start is enabled for the next step */
  autoStart?: boolean;
  /** Callback when auto-start toggle changes */
  onAutoStartChange?: (enabled: boolean) => void;
  /** Whether actions are disabled (e.g., during processing) */
  disabled?: boolean;
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
 * StepsPanel component for displaying and managing workflow steps.
 * Stateless - receives all data via props, emits actions via callbacks.
 *
 * Features:
 * - Step list with status indicators and checkboxes
 * - Start button per step
 * - Add step button
 * - Auto-start toggle for next step automation
 * - Active step highlighting
 * - Keyboard navigation support
 *
 * @example
 * <StepsPanel
 *   steps={workflowSteps}
 *   activeStepIndex={1}
 *   onStartStep={handleStart}
 *   onToggleStep={handleToggle}
 *   onAddStep={handleAdd}
 * />
 *
 * @example
 * <StepsPanel
 *   steps={workflowSteps}
 *   autoStart={isAutoStart}
 *   onAutoStartChange={setAutoStart}
 *   disabled={isProcessing}
 * />
 */
export function StepsPanel({
  steps,
  activeStepIndex,
  onStartStep,
  onToggleStep,
  onSelectStep,
  onAddStep,
  autoStart = false,
  onAutoStartChange,
  disabled = false,
  className,
}: StepsPanelProps) {
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

  // Check if any step is in progress
  const hasInProgressStep = steps.some((step) => step.status === WorkflowStepStatus.InProgress);

  return (
    <div className={cn('flex h-full flex-col', 'bg-[rgb(var(--background))]', className)}>
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[rgb(var(--border))] px-4 py-3">
        <h3 className="text-sm font-semibold text-[rgb(var(--foreground))]">Workflow Steps</h3>
        <span className="text-xs text-[rgb(var(--muted-foreground))]">
          {steps.filter((s) => s.status === WorkflowStepStatus.Completed).length}/{steps.length}{' '}
          completed
        </span>
      </div>

      {/* Steps list */}
      <div className="flex-1 overflow-y-auto">
        <ul className="divide-y divide-[rgb(var(--border))]" role="list">
          {steps.map((step, index) => {
            const isActive = index === activeStepIndex;
            const isCompleted = step.status === WorkflowStepStatus.Completed;
            const isInProgress = step.status === WorkflowStepStatus.InProgress;
            const isSkipped = step.status === WorkflowStepStatus.Skipped;
            const canStart =
              !disabled && !hasInProgressStep && step.status === WorkflowStepStatus.Pending;
            const StepIcon = getStepIcon(step.status);

            return (
              <li
                key={step.index}
                className={cn(
                  'group relative flex items-start gap-3 px-4 py-3',
                  'transition-colors duration-150',
                  'cursor-pointer',
                  isActive && 'bg-[rgb(var(--accent))]',
                  !isActive && 'hover:bg-[rgb(var(--muted))]',
                  disabled && 'opacity-60 cursor-not-allowed'
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
                        isInProgress && 'text-[rgb(var(--primary))] animate-spin',
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
                  {step.description && (
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
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[rgb(var(--primary))] opacity-75" />
                        <span className="relative inline-flex h-2 w-2 rounded-full bg-[rgb(var(--primary))]" />
                      </span>
                      Running...
                    </div>
                  )}
                </div>

                {/* Start button */}
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {canStart && (
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
    </div>
  );
}

StepsPanel.displayName = 'StepsPanel';
