import type { TaskStatus } from '@openflow/generated';
import { cn } from '@openflow/utils';
import type { ReactNode } from 'react';

export type BadgeVariant =
  | 'default'
  | 'success'
  | 'warning'
  | 'error'
  | 'info'
  | 'todo'
  | 'inprogress'
  | 'inreview'
  | 'done'
  | 'cancelled';

export type BadgeSize = 'sm' | 'md';

export interface BadgeProps {
  /** Visual style variant */
  variant?: BadgeVariant;
  /** Size of the badge */
  size?: BadgeSize;
  /** Badge content */
  children: ReactNode;
  /** Additional CSS classes */
  className?: string;
}

const variantClasses: Record<BadgeVariant, string> = {
  default: 'bg-muted text-muted-foreground',
  success: 'bg-success/20 text-success',
  warning: 'bg-warning/20 text-warning',
  error: 'bg-error/20 text-error',
  info: 'bg-info/20 text-info',
  // Task status variants using semantic status colors
  todo: 'bg-status-todo/20 text-status-todo',
  inprogress: 'bg-status-inprogress/20 text-status-inprogress',
  inreview: 'bg-status-inreview/20 text-status-inreview',
  done: 'bg-status-done/20 text-status-done',
  cancelled: 'bg-status-cancelled/20 text-status-cancelled',
};

const sizeClasses: Record<BadgeSize, string> = {
  sm: 'px-1.5 py-0.5 text-xs',
  md: 'px-2 py-0.5 text-xs',
};

/**
 * Map TaskStatus enum values to badge variants.
 * Useful for rendering badges based on task status.
 */
export function taskStatusToVariant(status: TaskStatus): BadgeVariant {
  const statusMap: Record<TaskStatus, BadgeVariant> = {
    todo: 'todo',
    inprogress: 'inprogress',
    inreview: 'inreview',
    done: 'done',
    cancelled: 'cancelled',
  };
  return statusMap[status] ?? 'default';
}

/**
 * Map TaskStatus enum values to display labels.
 */
export function taskStatusToLabel(status: TaskStatus): string {
  const labelMap: Record<TaskStatus, string> = {
    todo: 'To Do',
    inprogress: 'In Progress',
    inreview: 'In Review',
    done: 'Done',
    cancelled: 'Cancelled',
  };
  return labelMap[status] ?? status;
}

/**
 * Badge component for displaying status and labels.
 * Stateless - receives all data via props.
 *
 * @example
 * <Badge variant="success">Completed</Badge>
 *
 * @example
 * <Badge variant="inprogress">In Progress</Badge>
 *
 * @example
 * // With task status
 * <Badge variant={taskStatusToVariant(task.status)}>
 *   {taskStatusToLabel(task.status)}
 * </Badge>
 */
export function Badge({ variant = 'default', size = 'md', className, children }: BadgeProps) {
  return (
    <span
      className={cn(
        // Base styles
        'inline-flex items-center justify-center rounded font-medium',
        'whitespace-nowrap',
        // Variant and size
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
    >
      {children}
    </span>
  );
}
