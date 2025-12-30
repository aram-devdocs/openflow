import type { Task, TaskStatus } from '@openflow/generated';
import { cn } from '@openflow/utils';
import { AlertCircle, MoreVertical } from 'lucide-react';
import { Badge, taskStatusToLabel, taskStatusToVariant } from '../atoms/Badge';
import { Icon } from '../atoms/Icon';
import { Card, CardContent } from '../molecules/Card';
import { Dropdown, type DropdownOption } from '../molecules/Dropdown';

export interface TaskCardProps {
  /** Task data to display */
  task: Task;
  /** Whether the card is in a selected state */
  isSelected?: boolean;
  /** Callback when the card is clicked/selected */
  onSelect?: (id: string) => void;
  /** Callback when the task status is changed */
  onStatusChange?: (id: string, status: TaskStatus) => void;
  /** Additional CSS classes */
  className?: string;
}

/** Status options for the dropdown */
const statusOptions: DropdownOption[] = [
  { value: 'todo', label: 'To Do' },
  { value: 'inprogress', label: 'In Progress' },
  { value: 'inreview', label: 'In Review' },
  { value: 'done', label: 'Done' },
  { value: 'cancelled', label: 'Cancelled' },
];

/**
 * TaskCard component for displaying task information.
 * Stateless - receives all data via props, emits actions via callbacks.
 *
 * Features:
 * - Task title and description preview
 * - Status badge with color coding
 * - Actions required indicator when count > 0
 * - Status dropdown for quick status changes
 *
 * @example
 * <TaskCard
 *   task={task}
 *   isSelected={selectedTaskId === task.id}
 *   onSelect={(id) => setSelectedTaskId(id)}
 *   onStatusChange={(id, status) => updateTaskStatus(id, status)}
 * />
 */
export function TaskCard({
  task,
  isSelected = false,
  onSelect,
  onStatusChange,
  className,
}: TaskCardProps) {
  const handleClick = () => {
    onSelect?.(task.id);
  };

  const handleStatusChange = (value: string) => {
    onStatusChange?.(task.id, value as TaskStatus);
  };

  const handleStatusClick = (e: React.MouseEvent) => {
    // Prevent card selection when clicking on status dropdown
    e.stopPropagation();
  };

  const hasActionsRequired = task.actionsRequiredCount > 0;

  return (
    <Card
      isSelected={isSelected}
      isClickable={Boolean(onSelect)}
      onClick={onSelect ? handleClick : undefined}
      className={cn('group', className)}
    >
      <CardContent className="p-4">
        {/* Header: Title and Status */}
        <div className="flex items-start justify-between gap-2">
          <h3
            className={cn(
              'flex-1 font-medium leading-tight',
              'line-clamp-2',
              task.status === 'cancelled' && 'text-[rgb(var(--muted-foreground))] line-through'
            )}
          >
            {task.title}
          </h3>

          {/* Status dropdown or badge */}
          {/* biome-ignore lint/a11y/useKeyWithClickEvents: Click handler only prevents event propagation, keyboard handling is done by Dropdown child */}
          <div onClick={handleStatusClick} className="shrink-0">
            {onStatusChange ? (
              <Dropdown
                options={statusOptions}
                value={task.status}
                onChange={handleStatusChange}
                aria-label="Change task status"
                className={cn(
                  'h-auto min-w-0 border-0 px-2 py-0.5 text-xs',
                  'bg-transparent hover:bg-transparent'
                )}
              />
            ) : (
              <Badge variant={taskStatusToVariant(task.status)} size="sm">
                {taskStatusToLabel(task.status)}
              </Badge>
            )}
          </div>
        </div>

        {/* Description preview */}
        {task.description && (
          <p className={cn('mt-2 text-sm text-[rgb(var(--muted-foreground))]', 'line-clamp-2')}>
            {task.description}
          </p>
        )}

        {/* Footer: Metadata and indicators */}
        <div className="mt-4 flex items-center justify-between">
          {/* Actions required badge */}
          {hasActionsRequired ? (
            <Badge variant="warning" size="sm">
              <Icon icon={AlertCircle} size="xs" className="mr-1" />
              {task.actionsRequiredCount} action
              {task.actionsRequiredCount !== 1 && 's'} required
            </Badge>
          ) : (
            <span />
          )}

          {/* Context menu placeholder - visible on hover */}
          <button
            type="button"
            className={cn(
              'rounded p-1 text-[rgb(var(--muted-foreground))]',
              'opacity-0 transition-opacity group-hover:opacity-100',
              'hover:bg-[rgb(var(--accent))] hover:text-[rgb(var(--accent-foreground))]',
              'focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--ring))]'
            )}
            onClick={(e) => {
              e.stopPropagation();
              // Context menu will be handled by parent
            }}
            aria-label="Task options"
          >
            <Icon icon={MoreVertical} size="sm" />
          </button>
        </div>
      </CardContent>
    </Card>
  );
}

TaskCard.displayName = 'TaskCard';
