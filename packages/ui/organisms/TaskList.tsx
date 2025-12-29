import type { Task, TaskStatus } from '@openflow/generated';
import { cn } from '@openflow/utils';
import { Inbox } from 'lucide-react';
import { Icon } from '../atoms/Icon';
import { TaskCard } from './TaskCard';

export interface TaskListProps {
  /** Array of tasks to display */
  tasks: Task[];
  /** Currently selected task ID */
  selectedTaskId?: string;
  /** Callback when a task is selected */
  onSelectTask?: (id: string) => void;
  /** Callback when a task status is changed */
  onStatusChange?: (id: string, status: TaskStatus) => void;
  /** Whether to display tasks grouped by status (kanban view) */
  groupByStatus?: boolean;
  /** Additional CSS classes */
  className?: string;
}

/** Order of status columns for kanban view */
const STATUS_ORDER: TaskStatus[] = [
  'todo' as TaskStatus,
  'inprogress' as TaskStatus,
  'inreview' as TaskStatus,
  'done' as TaskStatus,
  'cancelled' as TaskStatus,
];

/** Labels for status columns */
const STATUS_LABELS: Record<TaskStatus, string> = {
  todo: 'To Do',
  inprogress: 'In Progress',
  inreview: 'In Review',
  done: 'Done',
  cancelled: 'Cancelled',
};

/** Colors for status column headers */
const STATUS_COLORS: Record<TaskStatus, string> = {
  todo: 'text-[rgb(var(--muted-foreground))]',
  inprogress: 'text-blue-500',
  inreview: 'text-purple-500',
  done: 'text-green-500',
  cancelled: 'text-[rgb(var(--muted-foreground))]',
};

/**
 * Groups tasks by their status.
 */
function groupTasksByStatus(tasks: Task[]): Record<TaskStatus, Task[]> {
  const groups: Record<TaskStatus, Task[]> = {
    todo: [],
    inprogress: [],
    inreview: [],
    done: [],
    cancelled: [],
  };

  for (const task of tasks) {
    if (groups[task.status]) {
      groups[task.status].push(task);
    }
  }

  return groups;
}

/**
 * Empty state component for when there are no tasks.
 */
function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <Icon icon={Inbox} size="lg" className="mb-3 text-[rgb(var(--muted-foreground))]" />
      <p className="text-sm text-[rgb(var(--muted-foreground))]">{message}</p>
    </div>
  );
}

/**
 * Column component for kanban view.
 */
function StatusColumn({
  status,
  tasks,
  selectedTaskId,
  onSelectTask,
  onStatusChange,
}: {
  status: TaskStatus;
  tasks: Task[];
  selectedTaskId: string | undefined;
  onSelectTask: ((id: string) => void) | undefined;
  onStatusChange: ((id: string, status: TaskStatus) => void) | undefined;
}) {
  return (
    <div className="flex min-w-64 flex-1 flex-col">
      {/* Column header */}
      <div className="mb-3 flex items-center gap-2">
        <span className={cn('text-sm font-medium', STATUS_COLORS[status])}>
          {STATUS_LABELS[status]}
        </span>
        <span className="rounded-full bg-[rgb(var(--muted))] px-2 py-0.5 text-xs text-[rgb(var(--muted-foreground))]">
          {tasks.length}
        </span>
      </div>

      {/* Tasks in column */}
      <div className="flex flex-1 flex-col gap-2">
        {tasks.length > 0 ? (
          tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              isSelected={selectedTaskId === task.id}
              {...(onSelectTask && { onSelect: onSelectTask })}
              {...(onStatusChange && { onStatusChange })}
            />
          ))
        ) : (
          <div className="flex-1 rounded-lg border border-dashed border-[rgb(var(--border))] bg-[rgb(var(--muted))]/30 p-4">
            <p className="text-center text-xs text-[rgb(var(--muted-foreground))]">No tasks</p>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * TaskList component for displaying tasks.
 * Stateless - receives all data via props, emits actions via callbacks.
 *
 * Features:
 * - Display tasks as a simple list or grouped by status (kanban view)
 * - Task selection with visual feedback
 * - Status change via dropdown on each task
 * - Empty state handling
 *
 * @example
 * // Simple list view
 * <TaskList
 *   tasks={tasks}
 *   selectedTaskId={selectedId}
 *   onSelectTask={(id) => setSelectedId(id)}
 *   onStatusChange={(id, status) => updateStatus(id, status)}
 * />
 *
 * @example
 * // Kanban view grouped by status
 * <TaskList
 *   tasks={tasks}
 *   groupByStatus
 *   onSelectTask={(id) => setSelectedId(id)}
 * />
 */
export function TaskList({
  tasks,
  selectedTaskId,
  onSelectTask,
  onStatusChange,
  groupByStatus = false,
  className,
}: TaskListProps) {
  // Empty state
  if (tasks.length === 0) {
    return (
      <div className={className}>
        <EmptyState message="No tasks yet. Create a new task to get started." />
      </div>
    );
  }

  // Kanban view - group tasks by status
  if (groupByStatus) {
    const groupedTasks = groupTasksByStatus(tasks);

    return (
      <div className={cn('flex gap-4 overflow-x-auto pb-4', className)}>
        {STATUS_ORDER.map((status) => (
          <StatusColumn
            key={status}
            status={status}
            tasks={groupedTasks[status]}
            selectedTaskId={selectedTaskId}
            onSelectTask={onSelectTask}
            onStatusChange={onStatusChange}
          />
        ))}
      </div>
    );
  }

  // Simple list view
  return (
    <div className={cn('flex flex-col gap-2', className)}>
      {tasks.map((task) => (
        <TaskCard
          key={task.id}
          task={task}
          isSelected={selectedTaskId === task.id}
          {...(onSelectTask && { onSelect: onSelectTask })}
          {...(onStatusChange && { onStatusChange })}
        />
      ))}
    </div>
  );
}

TaskList.displayName = 'TaskList';
