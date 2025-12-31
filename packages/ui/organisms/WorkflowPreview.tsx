import type { WorkflowStep, WorkflowTemplate } from '@openflow/generated';
import { WorkflowStepStatus } from '@openflow/generated';
import { cn } from '@openflow/utils';
import { CheckCircle, Circle, Loader2, SkipForward } from 'lucide-react';
import { Icon } from '../atoms/Icon';

export interface WorkflowPreviewProps {
  /** Workflow template to preview */
  workflow: WorkflowTemplate;
  /** Maximum number of steps to show (remaining shown as "+N more") */
  maxSteps?: number;
  /** Whether to show step descriptions */
  showDescriptions?: boolean;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Get the icon component for a step based on its status
 */
function getStepIcon(status: WorkflowStepStatus) {
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
function getStepIconClass(status: WorkflowStepStatus): string {
  switch (status) {
    case WorkflowStepStatus.Completed:
      return 'text-[rgb(var(--success))]';
    case WorkflowStepStatus.InProgress:
      return 'text-[rgb(var(--primary))] motion-safe:animate-spin';
    default:
      return 'text-[rgb(var(--muted-foreground))]';
  }
}

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
 *
 * @example
 * <WorkflowPreview workflow={selectedWorkflow} />
 *
 * @example
 * <WorkflowPreview
 *   workflow={workflow}
 *   maxSteps={5}
 *   showDescriptions={true}
 * />
 */
export function WorkflowPreview({
  workflow,
  maxSteps,
  showDescriptions = false,
  className,
}: WorkflowPreviewProps) {
  const { steps } = workflow;
  const hasMore = maxSteps !== undefined && steps.length > maxSteps;
  const visibleSteps = hasMore ? steps.slice(0, maxSteps) : steps;
  const remainingCount = hasMore ? steps.length - maxSteps : 0;

  return (
    <div className={cn('space-y-3', className)}>
      {/* Workflow name */}
      <h4 className="font-medium text-[rgb(var(--foreground))]">{workflow.name}</h4>

      {/* Description if available */}
      {workflow.description && (
        <p className="text-sm text-[rgb(var(--muted-foreground))]">{workflow.description}</p>
      )}

      {/* Steps list */}
      <ol className="space-y-2" role="list" aria-label={`Steps in ${workflow.name}`}>
        {visibleSteps.map((step, index) => (
          <StepItem
            key={step.index}
            step={step}
            stepNumber={index + 1}
            showDescription={showDescriptions}
          />
        ))}
      </ol>

      {/* Show remaining count if collapsed */}
      {hasMore && (
        <p className="text-xs text-[rgb(var(--muted-foreground))] pl-7">
          +{remainingCount} more step{remainingCount !== 1 ? 's' : ''}
        </p>
      )}
    </div>
  );
}

WorkflowPreview.displayName = 'WorkflowPreview';

/**
 * Internal component for individual step items
 */
interface StepItemProps {
  step: WorkflowStep;
  stepNumber: number;
  showDescription?: boolean;
}

function StepItem({ step, stepNumber, showDescription = false }: StepItemProps) {
  const StepIcon = getStepIcon(step.status);
  const iconClass = getStepIconClass(step.status);
  const isCompleted = step.status === WorkflowStepStatus.Completed;

  return (
    <li className="flex items-start gap-2">
      {/* Status icon */}
      <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center">
        <Icon icon={StepIcon} size="sm" className={iconClass} aria-hidden="true" />
      </div>

      {/* Step content */}
      <div className="flex-1 min-w-0">
        <span
          className={cn(
            'text-sm font-medium',
            isCompleted
              ? 'text-[rgb(var(--muted-foreground))] line-through'
              : 'text-[rgb(var(--foreground))]'
          )}
        >
          {stepNumber}. {step.name}
        </span>

        {/* Step description (truncated) */}
        {showDescription && step.description && (
          <p className="mt-1 text-xs text-[rgb(var(--muted-foreground))] line-clamp-2">
            {step.description}
          </p>
        )}
      </div>
    </li>
  );
}
