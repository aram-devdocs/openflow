import type { WorkflowTemplate } from '@openflow/generated';
import { cn } from '@openflow/utils';
import { Check, ChevronRight, FileText } from 'lucide-react';
import { Icon } from '../atoms/Icon';
import { Skeleton } from '../atoms/Skeleton';
import { EmptyState } from '../molecules/EmptyState';

export interface WorkflowSelectorProps {
  /** Available workflow templates to choose from */
  workflows: WorkflowTemplate[];
  /** Currently selected workflow template (null for no template) */
  selectedWorkflow: WorkflowTemplate | null;
  /** Callback when a workflow is selected or deselected */
  onSelectWorkflow: (workflow: WorkflowTemplate | null) => void;
  /** Whether workflows are still loading */
  loading?: boolean;
  /** Whether the selector is disabled */
  disabled?: boolean;
  /** Additional CSS classes */
  className?: string;
}

/**
 * WorkflowSelector component for choosing workflow templates when creating tasks.
 * Stateless - receives all data via props, emits actions via callbacks.
 *
 * Features:
 * - "No template" option for blank tasks
 * - List of available workflow templates
 * - Step count display for each template
 * - Selected state with check icon
 * - Loading skeleton state
 * - Empty state when no templates available
 * - Keyboard accessible
 *
 * @example
 * <WorkflowSelector
 *   workflows={templates}
 *   selectedWorkflow={selected}
 *   onSelectWorkflow={setSelected}
 *   loading={isLoading}
 * />
 */
export function WorkflowSelector({
  workflows,
  selectedWorkflow,
  onSelectWorkflow,
  loading = false,
  disabled = false,
  className,
}: WorkflowSelectorProps) {
  // Loading state with skeletons
  if (loading) {
    return (
      <div className={cn('space-y-2', className)} aria-busy="true" aria-label="Loading workflows">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={`workflow-skeleton-${i}`} className="h-16 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  // Empty state when no workflows available
  if (workflows.length === 0) {
    return (
      <div className={className}>
        {/* Still show the "no template" option */}
        <WorkflowOption
          isSelected={selectedWorkflow === null}
          onClick={() => onSelectWorkflow(null)}
          disabled={disabled}
          title="No template"
          description="Start with a blank task"
        />
        <EmptyState
          icon={FileText}
          title="No workflow templates found"
          description="Add .md files to openflow/workflows/ in your project"
          size="sm"
          className="mt-4"
        />
      </div>
    );
  }

  return (
    <div className={cn('space-y-2', className)} aria-label="Workflow template options">
      {/* No template option */}
      <WorkflowOption
        isSelected={selectedWorkflow === null}
        onClick={() => onSelectWorkflow(null)}
        disabled={disabled}
        title="No template"
        description="Start with a blank task"
      />

      {/* Workflow template options */}
      {workflows.map((workflow) => (
        <WorkflowOption
          key={workflow.id}
          isSelected={selectedWorkflow?.id === workflow.id}
          onClick={() => onSelectWorkflow(workflow)}
          disabled={disabled}
          title={workflow.name}
          description={`${workflow.steps.length} step${workflow.steps.length !== 1 ? 's' : ''}`}
          icon={FileText}
          showArrow={selectedWorkflow?.id !== workflow.id}
        />
      ))}
    </div>
  );
}

WorkflowSelector.displayName = 'WorkflowSelector';

/**
 * Internal component for individual workflow options
 */
interface WorkflowOptionProps {
  isSelected: boolean;
  onClick: () => void;
  disabled?: boolean;
  title: string;
  description: string;
  icon?: typeof FileText;
  showArrow?: boolean;
}

function WorkflowOption({
  isSelected,
  onClick,
  disabled = false,
  title,
  description,
  icon: IconComponent,
  showArrow = false,
}: WorkflowOptionProps) {
  return (
    <button
      type="button"
      role="option"
      aria-selected={isSelected}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'flex w-full items-center gap-3 rounded-lg border p-3 text-left',
        'min-h-[44px]', // Touch target sizing
        'transition-colors duration-150',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--ring))] focus-visible:ring-offset-2 focus-visible:ring-offset-[rgb(var(--background))]',
        isSelected
          ? 'border-[rgb(var(--primary))] bg-[rgb(var(--primary))]/5'
          : 'border-[rgb(var(--border))] hover:border-[rgb(var(--muted-foreground))]',
        disabled && 'cursor-not-allowed opacity-60'
      )}
    >
      {/* Optional leading icon */}
      {IconComponent && (
        <Icon
          icon={IconComponent}
          size="md"
          className="shrink-0 text-[rgb(var(--muted-foreground))]"
        />
      )}

      {/* Content */}
      <div className="flex-1 min-w-0">
        <span className="block font-medium truncate text-[rgb(var(--foreground))]">{title}</span>
        <p className="text-sm text-[rgb(var(--muted-foreground))]">{description}</p>
      </div>

      {/* Selection indicator or arrow */}
      {isSelected ? (
        <Icon
          icon={Check}
          size="md"
          className="shrink-0 text-[rgb(var(--primary))]"
          aria-hidden="true"
        />
      ) : showArrow ? (
        <Icon
          icon={ChevronRight}
          size="md"
          className="shrink-0 text-[rgb(var(--muted-foreground))]"
          aria-hidden="true"
        />
      ) : null}
    </button>
  );
}
