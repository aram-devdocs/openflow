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
  default: 'bg-[rgb(var(--muted))] text-[rgb(var(--muted-foreground))]',
  success: 'bg-green-500/20 text-green-400',
  warning: 'bg-yellow-500/20 text-yellow-400',
  error: 'bg-red-500/20 text-red-400',
  info: 'bg-blue-500/20 text-blue-400',
  // Task status variants using CSS variables
  todo: 'bg-[rgb(var(--status-todo))]/20 text-[rgb(var(--status-todo))]',
  inprogress: 'bg-[rgb(var(--status-inprogress))]/20 text-[rgb(var(--status-inprogress))]',
  inreview: 'bg-[rgb(var(--status-inreview))]/20 text-[rgb(var(--status-inreview))]',
  done: 'bg-[rgb(var(--status-done))]/20 text-[rgb(var(--status-done))]',
  cancelled: 'bg-[rgb(var(--status-cancelled))]/20 text-[rgb(var(--status-cancelled))]',
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
