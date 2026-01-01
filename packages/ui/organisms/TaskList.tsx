/**
 * TaskList Organism - Displays a collection of tasks
 *
 * Features:
 * - Uses atoms/molecules only (TaskCard, SkeletonTaskCard, EmptyState, Button, Icon)
 * - Loading state with SkeletonTaskCard (TaskListSkeleton)
 * - Empty state with EmptyState molecule
 * - Error state with retry (TaskListError)
 * - Proper list semantics (role="list", role="listitem")
 * - Keyboard navigation (Arrow keys, Home, End)
 * - Responsive sizing via ResponsiveValue
 * - forwardRef support for ref forwarding
 * - axe-core compliant
 */

import type { Task, TaskStatus } from '@openflow/generated';
import { Box, type ResponsiveValue, Text, VisuallyHidden } from '@openflow/primitives';
import { cn } from '@openflow/utils';
import { AlertTriangle, ClipboardList, RefreshCw } from 'lucide-react';
import {
  type HTMLAttributes,
  type KeyboardEvent,
  forwardRef,
  useCallback,
  useRef,
  useState,
} from 'react';
import { Button } from '../atoms/Button';
import { Icon } from '../atoms/Icon';
import { EmptyState } from '../molecules/EmptyState';
import { SkeletonTaskCard } from '../molecules/SkeletonTaskCard';
import { TaskCard } from './TaskCard';

// ============================================================================
// Types
// ============================================================================

export type TaskListSize = 'sm' | 'md' | 'lg';

export type TaskListBreakpoint = 'base' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

export interface TaskListProps extends Omit<HTMLAttributes<HTMLDivElement>, 'onSelect'> {
  /** Array of tasks to display */
  tasks: Task[];
  /** Currently selected task ID */
  selectedTaskId?: string;
  /** Callback when a task is selected */
  onSelectTask?: (id: string) => void;
  /** Callback when a task status is changed */
  onStatusChange?: (id: string, status: TaskStatus) => void;
  /** Callback when a task's context menu is opened */
  onTaskContextMenu?: (id: string, event: React.MouseEvent) => void;
  /** Callback when a task's more button is clicked */
  onTaskMoreClick?: (id: string, event: React.MouseEvent) => void;
  /** Whether to display tasks grouped by status (kanban view) */
  groupByStatus?: boolean;
  /** Responsive size for list items */
  size?: ResponsiveValue<TaskListSize>;
  /** Accessible label for the list */
  'aria-label'?: string;
  /** Data attribute for testing */
  'data-testid'?: string;
}

export interface TaskListSkeletonProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  /** Number of skeleton items to show */
  count?: number;
  /** Whether to display as kanban view */
  groupByStatus?: boolean;
  /** Responsive size for skeleton items */
  size?: ResponsiveValue<TaskListSize>;
  /** Data attribute for testing */
  'data-testid'?: string;
}

export interface TaskListErrorProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  /** Error message to display */
  message?: string;
  /** Callback when retry button is clicked */
  onRetry?: () => void;
  /** Responsive size for error state */
  size?: ResponsiveValue<TaskListSize>;
  /** Data attribute for testing */
  'data-testid'?: string;
}

// ============================================================================
// Constants
// ============================================================================

/** Breakpoint order for responsive class generation */
const BREAKPOINT_ORDER: TaskListBreakpoint[] = ['base', 'sm', 'md', 'lg', 'xl', '2xl'];

/** Order of status columns for kanban view */
export const STATUS_ORDER: TaskStatus[] = [
  'todo' as TaskStatus,
  'inprogress' as TaskStatus,
  'inreview' as TaskStatus,
  'done' as TaskStatus,
  'cancelled' as TaskStatus,
];

/** Labels for status columns */
export const STATUS_LABELS: Record<TaskStatus, string> = {
  todo: 'To Do',
  inprogress: 'In Progress',
  inreview: 'In Review',
  done: 'Done',
  cancelled: 'Cancelled',
};

/** Colors for status column headers */
export const STATUS_COLORS: Record<TaskStatus, string> = {
  todo: 'text-status-todo',
  inprogress: 'text-status-inprogress',
  inreview: 'text-status-inreview',
  done: 'text-status-done',
  cancelled: 'text-status-cancelled',
};

/** Default aria label for task list */
export const DEFAULT_TASK_LIST_LABEL = 'Task list';

/** Default aria label for kanban board */
export const DEFAULT_KANBAN_LABEL = 'Task board grouped by status';

/** Default empty state title */
export const DEFAULT_EMPTY_TITLE = 'No tasks yet';

/** Default empty state description */
export const DEFAULT_EMPTY_DESCRIPTION = 'Create a new task to get started.';

/** Default error title */
export const DEFAULT_ERROR_TITLE = 'Failed to load tasks';

/** Default error message */
export const DEFAULT_ERROR_MESSAGE = 'There was a problem loading your tasks. Please try again.';

/** Default retry button label */
export const DEFAULT_RETRY_LABEL = 'Retry';

/** Default skeleton count */
export const DEFAULT_SKELETON_COUNT = 5;

/** Default kanban skeleton count per column */
export const DEFAULT_KANBAN_SKELETON_COUNT = 2;

/** Screen reader announcement for task count */
export const SR_TASK_COUNT_TEMPLATE = (count: number) =>
  `${count} ${count === 1 ? 'task' : 'tasks'}`;

/** Screen reader announcement for column */
export const SR_COLUMN_TEMPLATE = (label: string, count: number) =>
  `${label}: ${count} ${count === 1 ? 'task' : 'tasks'}`;

/** Screen reader announcement for selection */
export const SR_TASK_SELECTED = 'Task selected';

/** Screen reader announcement for navigation */
export const SR_NAVIGATION_HINT = 'Use arrow keys to navigate, Enter to select';

// ============================================================================
// Class Constants
// ============================================================================

/** Base classes for task list container */
export const TASK_LIST_BASE_CLASSES = 'flex flex-col';

/** Gap classes by size */
export const TASK_LIST_GAP_CLASSES: Record<TaskListSize, string> = {
  sm: 'gap-1.5',
  md: 'gap-2',
  lg: 'gap-3',
};

/** Base classes for kanban container */
export const TASK_LIST_KANBAN_BASE_CLASSES = 'flex overflow-x-auto pb-4';

/** Kanban gap classes by size */
export const TASK_LIST_KANBAN_GAP_CLASSES: Record<TaskListSize, string> = {
  sm: 'gap-3',
  md: 'gap-4',
  lg: 'gap-6',
};

/** Column base classes */
export const TASK_LIST_COLUMN_BASE_CLASSES = 'flex min-w-64 flex-1 flex-col';

/** Column header classes */
export const TASK_LIST_COLUMN_HEADER_CLASSES = 'mb-3 flex items-center gap-2';

/** Column header text classes */
export const TASK_LIST_COLUMN_HEADER_TEXT_CLASSES: Record<TaskListSize, string> = {
  sm: 'text-xs font-medium',
  md: 'text-sm font-medium',
  lg: 'text-base font-medium',
};

/** Column count badge classes */
export const TASK_LIST_COLUMN_COUNT_CLASSES =
  'rounded-full bg-[rgb(var(--muted))] px-2 py-0.5 text-xs text-[rgb(var(--muted-foreground))]';

/** Column content classes */
export const TASK_LIST_COLUMN_CONTENT_CLASSES = 'flex flex-1 flex-col';

/** Column content gap classes */
export const TASK_LIST_COLUMN_CONTENT_GAP_CLASSES: Record<TaskListSize, string> = {
  sm: 'gap-1.5',
  md: 'gap-2',
  lg: 'gap-3',
};

/** Empty column classes */
export const TASK_LIST_EMPTY_COLUMN_CLASSES =
  'flex-1 rounded-lg border border-dashed border-[rgb(var(--border))] bg-[rgb(var(--muted))]/30 p-4';

/** Empty column text classes */
export const TASK_LIST_EMPTY_COLUMN_TEXT_CLASSES =
  'text-center text-xs text-[rgb(var(--muted-foreground))]';

/** Error container classes */
export const TASK_LIST_ERROR_BASE_CLASSES =
  'flex flex-col items-center justify-center rounded-lg border border-[rgb(var(--destructive))]/30 bg-[rgb(var(--destructive))]/5';

/** Error padding classes by size */
export const TASK_LIST_ERROR_PADDING_CLASSES: Record<TaskListSize, string> = {
  sm: 'p-4 gap-2',
  md: 'p-6 gap-3',
  lg: 'p-8 gap-4',
};

/** Error icon size by size */
export const TASK_LIST_ERROR_ICON_SIZE: Record<TaskListSize, 'sm' | 'md' | 'lg' | 'xl'> = {
  sm: 'md',
  md: 'lg',
  lg: 'xl',
};

/** Error text size by size */
export const TASK_LIST_ERROR_TEXT_SIZE: Record<TaskListSize, 'xs' | 'sm' | 'base' | 'lg'> = {
  sm: 'sm',
  md: 'base',
  lg: 'lg',
};

/** Error message text size by size */
export const TASK_LIST_ERROR_MESSAGE_SIZE: Record<TaskListSize, 'xs' | 'sm' | 'base'> = {
  sm: 'xs',
  md: 'sm',
  lg: 'base',
};

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Get base size from responsive value
 */
export function getBaseSize(size: ResponsiveValue<TaskListSize>): TaskListSize {
  if (typeof size === 'string') {
    return size;
  }
  if (typeof size === 'object' && size !== null) {
    const responsiveSize = size as Partial<Record<TaskListBreakpoint, TaskListSize>>;
    if (responsiveSize.base) return responsiveSize.base;
    for (const bp of BREAKPOINT_ORDER) {
      if (responsiveSize[bp]) return responsiveSize[bp] as TaskListSize;
    }
  }
  return 'md';
}

/**
 * Generate responsive classes from a size-to-class mapping
 */
export function getResponsiveSizeClasses(
  size: ResponsiveValue<TaskListSize>,
  classMap: Record<TaskListSize, string>
): string {
  if (typeof size === 'string') {
    return classMap[size];
  }

  const classes: string[] = [];
  if (typeof size === 'object' && size !== null) {
    const responsiveSize = size as Partial<Record<TaskListBreakpoint, TaskListSize>>;
    for (const breakpoint of BREAKPOINT_ORDER) {
      const breakpointValue = responsiveSize[breakpoint];
      if (breakpointValue !== undefined) {
        const sizeClass = classMap[breakpointValue];
        const individualClasses = sizeClass.split(' ');
        for (const cls of individualClasses) {
          if (breakpoint === 'base') {
            classes.push(cls);
          } else {
            classes.push(`${breakpoint}:${cls}`);
          }
        }
      }
    }
  }

  return classes.join(' ');
}

/**
 * Groups tasks by their status
 */
export function groupTasksByStatus(tasks: Task[]): Record<TaskStatus, Task[]> {
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
 * Build accessible label for task list
 */
export function buildListAccessibleLabel(
  tasks: Task[],
  isKanban: boolean,
  customLabel?: string
): string {
  if (customLabel) return customLabel;
  const countText = SR_TASK_COUNT_TEMPLATE(tasks.length);
  return isKanban
    ? `${DEFAULT_KANBAN_LABEL}. ${countText}`
    : `${DEFAULT_TASK_LIST_LABEL}. ${countText}`;
}

/**
 * Build screen reader announcement for task selection
 */
export function buildSelectionAnnouncement(taskTitle: string): string {
  return `${taskTitle} ${SR_TASK_SELECTED}`;
}

// ============================================================================
// Sub-Components
// ============================================================================

/**
 * Column component for kanban view
 */
interface StatusColumnProps {
  status: TaskStatus;
  tasks: Task[];
  selectedTaskId?: string;
  onSelectTask?: (id: string) => void;
  onStatusChange?: (id: string, status: TaskStatus) => void;
  onTaskContextMenu?: (id: string, event: React.MouseEvent) => void;
  onTaskMoreClick?: (id: string, event: React.MouseEvent) => void;
  size: TaskListSize;
  focusedTaskId?: string;
  onKeyDown?: (e: KeyboardEvent, taskId: string) => void;
  'data-testid'?: string;
}

function StatusColumn({
  status,
  tasks,
  selectedTaskId,
  onSelectTask,
  onStatusChange,
  onTaskContextMenu,
  onTaskMoreClick,
  size,
  focusedTaskId,
  onKeyDown,
  'data-testid': testId,
}: StatusColumnProps) {
  const headerTextClasses = TASK_LIST_COLUMN_HEADER_TEXT_CLASSES[size];
  const contentGapClasses = TASK_LIST_COLUMN_CONTENT_GAP_CLASSES[size];
  const columnId = `column-${status}`;

  return (
    <Box
      className={TASK_LIST_COLUMN_BASE_CLASSES}
      role="group"
      aria-labelledby={`${columnId}-header`}
      data-testid={testId}
      data-status={status}
      data-task-count={tasks.length}
    >
      {/* Column header */}
      <Box className={TASK_LIST_COLUMN_HEADER_CLASSES} id={`${columnId}-header`}>
        <Text as="span" className={cn(headerTextClasses, STATUS_COLORS[status])}>
          {STATUS_LABELS[status]}
        </Text>
        <Text
          as="span"
          className={TASK_LIST_COLUMN_COUNT_CLASSES}
          aria-label={`${tasks.length} ${tasks.length === 1 ? 'task' : 'tasks'}`}
        >
          {tasks.length}
        </Text>
      </Box>

      {/* Tasks in column */}
      <Box
        className={cn(TASK_LIST_COLUMN_CONTENT_CLASSES, contentGapClasses)}
        role="list"
        aria-label={SR_COLUMN_TEMPLATE(STATUS_LABELS[status], tasks.length)}
      >
        {tasks.length > 0 ? (
          tasks.map((task) => (
            <Box key={task.id} role="listitem" onKeyDown={(e) => onKeyDown?.(e, task.id)}>
              <TaskCard
                task={task}
                isSelected={selectedTaskId === task.id}
                size={size}
                tabIndex={focusedTaskId === task.id ? 0 : -1}
                {...(onSelectTask && { onSelect: onSelectTask })}
                {...(onStatusChange && { onStatusChange })}
                {...(onTaskContextMenu && { onContextMenu: onTaskContextMenu })}
                {...(onTaskMoreClick && { onMoreClick: onTaskMoreClick })}
                data-testid={testId ? `${testId}-task-${task.id}` : undefined}
              />
            </Box>
          ))
        ) : (
          <Box
            className={TASK_LIST_EMPTY_COLUMN_CLASSES}
            role="status"
            aria-label={`No tasks in ${STATUS_LABELS[status]}`}
          >
            <Text as="p" className={TASK_LIST_EMPTY_COLUMN_TEXT_CLASSES}>
              No tasks
            </Text>
          </Box>
        )}
      </Box>
    </Box>
  );
}

// ============================================================================
// TaskListSkeleton Component
// ============================================================================

/**
 * TaskListSkeleton - Loading placeholder for task list
 *
 * Shows skeleton task cards while data is loading.
 *
 * @example
 * <TaskListSkeleton count={5} />
 *
 * @example
 * // Kanban view skeleton
 * <TaskListSkeleton groupByStatus count={2} />
 */
export const TaskListSkeleton = forwardRef<HTMLDivElement, TaskListSkeletonProps>(
  function TaskListSkeleton(
    {
      count = DEFAULT_SKELETON_COUNT,
      groupByStatus = false,
      size = 'md',
      className,
      'data-testid': testId,
      ...props
    },
    ref
  ) {
    const baseSize = getBaseSize(size);
    const gapClasses = groupByStatus
      ? getResponsiveSizeClasses(size, TASK_LIST_KANBAN_GAP_CLASSES)
      : getResponsiveSizeClasses(size, TASK_LIST_GAP_CLASSES);
    const columnGapClasses = getResponsiveSizeClasses(size, TASK_LIST_COLUMN_CONTENT_GAP_CLASSES);

    if (groupByStatus) {
      return (
        <Box
          ref={ref}
          className={cn(TASK_LIST_KANBAN_BASE_CLASSES, gapClasses, className)}
          aria-hidden="true"
          role="presentation"
          data-testid={testId}
          data-size={baseSize}
          data-layout="kanban"
          {...props}
        >
          {STATUS_ORDER.map((status) => (
            <Box key={status} className={TASK_LIST_COLUMN_BASE_CLASSES}>
              <Box className={TASK_LIST_COLUMN_HEADER_CLASSES}>
                <Text
                  as="span"
                  className={cn(
                    TASK_LIST_COLUMN_HEADER_TEXT_CLASSES[baseSize],
                    STATUS_COLORS[status]
                  )}
                >
                  {STATUS_LABELS[status]}
                </Text>
              </Box>
              <Box className={cn(TASK_LIST_COLUMN_CONTENT_CLASSES, columnGapClasses)}>
                {Array.from({ length: count }).map((_, i) => (
                  <SkeletonTaskCard
                    key={`${status}-${i}`}
                    size={size}
                    data-testid={testId ? `${testId}-skeleton-${status}-${i}` : undefined}
                  />
                ))}
              </Box>
            </Box>
          ))}
        </Box>
      );
    }

    return (
      <Box
        ref={ref}
        className={cn(TASK_LIST_BASE_CLASSES, gapClasses, className)}
        aria-hidden="true"
        role="presentation"
        data-testid={testId}
        data-count={count}
        data-size={baseSize}
        data-layout="list"
        {...props}
      >
        {Array.from({ length: count }).map((_, i) => (
          <SkeletonTaskCard
            key={i}
            size={size}
            data-testid={testId ? `${testId}-skeleton-${i}` : undefined}
          />
        ))}
      </Box>
    );
  }
);

TaskListSkeleton.displayName = 'TaskListSkeleton';

// ============================================================================
// TaskListError Component
// ============================================================================

/**
 * TaskListError - Error state for task list
 *
 * Shows an error message with optional retry button.
 *
 * @example
 * <TaskListError message="Failed to load tasks" onRetry={refetch} />
 */
export const TaskListError = forwardRef<HTMLDivElement, TaskListErrorProps>(function TaskListError(
  {
    message = DEFAULT_ERROR_MESSAGE,
    onRetry,
    size = 'md',
    className,
    'data-testid': testId,
    ...props
  },
  ref
) {
  const baseSize = getBaseSize(size);
  const paddingClasses = getResponsiveSizeClasses(size, TASK_LIST_ERROR_PADDING_CLASSES);
  const iconSize = TASK_LIST_ERROR_ICON_SIZE[baseSize];
  const textSize = TASK_LIST_ERROR_TEXT_SIZE[baseSize];
  const messageSize = TASK_LIST_ERROR_MESSAGE_SIZE[baseSize];

  return (
    <Box
      ref={ref}
      className={cn(TASK_LIST_ERROR_BASE_CLASSES, paddingClasses, className)}
      role="alert"
      aria-live="assertive"
      aria-atomic="true"
      data-testid={testId}
      data-size={baseSize}
      {...props}
    >
      <Icon
        icon={AlertTriangle}
        size={iconSize}
        className="text-[rgb(var(--destructive))]"
        aria-hidden="true"
      />
      <Text as="span" size={textSize} weight="medium" className="text-[rgb(var(--foreground))]">
        {DEFAULT_ERROR_TITLE}
      </Text>
      <Text
        as="p"
        size={messageSize}
        className="text-[rgb(var(--muted-foreground))] text-center max-w-sm"
      >
        {message}
      </Text>
      {onRetry && (
        <Button
          variant="secondary"
          size={baseSize}
          onClick={onRetry}
          icon={<RefreshCw className="h-4 w-4" aria-hidden="true" />}
          data-testid={testId ? `${testId}-retry` : undefined}
        >
          {DEFAULT_RETRY_LABEL}
        </Button>
      )}
      <VisuallyHidden>
        <Text as="span" role="status" aria-live="polite">
          {`Error: ${message}`}
        </Text>
      </VisuallyHidden>
    </Box>
  );
});

TaskListError.displayName = 'TaskListError';

// ============================================================================
// TaskList Component
// ============================================================================

/**
 * TaskList component for displaying tasks.
 * Stateless - receives all data via props, emits actions via callbacks.
 *
 * Features:
 * - Display tasks as a simple list or grouped by status (kanban view)
 * - Task selection with visual feedback
 * - Status change via dropdown on each task
 * - Empty state handling
 * - Keyboard navigation (Arrow keys, Home, End)
 * - Proper ARIA list semantics
 * - Responsive sizing via ResponsiveValue
 *
 * Accessibility:
 * - role="list" and role="listitem" for list semantics
 * - Keyboard navigation with roving tabindex
 * - Screen reader announcements for selection changes
 * - Focus management with visible focus rings
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
 *
 * @example
 * // Responsive sizing
 * <TaskList
 *   tasks={tasks}
 *   size={{ base: 'sm', md: 'md', lg: 'lg' }}
 * />
 */
export const TaskList = forwardRef<HTMLDivElement, TaskListProps>(function TaskList(
  {
    tasks,
    selectedTaskId,
    onSelectTask,
    onStatusChange,
    onTaskContextMenu,
    onTaskMoreClick,
    groupByStatus = false,
    size = 'md',
    className,
    'aria-label': ariaLabel,
    'data-testid': testId,
    ...props
  },
  ref
) {
  const baseSize = getBaseSize(size);
  const [focusedTaskId, setFocusedTaskId] = useState<string | undefined>(
    selectedTaskId || tasks[0]?.id
  );
  const [selectionAnnouncement, setSelectionAnnouncement] = useState<string>('');
  const listRef = useRef<HTMLDivElement>(null);

  // Get all task IDs in order for navigation
  const getAllTaskIds = useCallback((): string[] => {
    if (groupByStatus) {
      const grouped = groupTasksByStatus(tasks);
      const ids: string[] = [];
      for (const status of STATUS_ORDER) {
        for (const task of grouped[status]) {
          ids.push(task.id);
        }
      }
      return ids;
    }
    return tasks.map((t) => t.id);
  }, [tasks, groupByStatus]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback(
    (e: KeyboardEvent, currentTaskId: string) => {
      const allIds = getAllTaskIds();
      const currentIndex = allIds.indexOf(currentTaskId);

      let newIndex: number | null = null;

      switch (e.key) {
        case 'ArrowDown':
        case 'ArrowRight':
          e.preventDefault();
          newIndex = currentIndex < allIds.length - 1 ? currentIndex + 1 : 0;
          break;
        case 'ArrowUp':
        case 'ArrowLeft':
          e.preventDefault();
          newIndex = currentIndex > 0 ? currentIndex - 1 : allIds.length - 1;
          break;
        case 'Home':
          e.preventDefault();
          newIndex = 0;
          break;
        case 'End':
          e.preventDefault();
          newIndex = allIds.length - 1;
          break;
        case 'Enter':
        case ' ':
          e.preventDefault();
          if (onSelectTask) {
            onSelectTask(currentTaskId);
            const task = tasks.find((t) => t.id === currentTaskId);
            if (task) {
              setSelectionAnnouncement(buildSelectionAnnouncement(task.title));
              // Clear announcement after a short delay
              setTimeout(() => setSelectionAnnouncement(''), 1000);
            }
          }
          return;
      }

      if (newIndex !== null && allIds[newIndex]) {
        const newId = allIds[newIndex];
        setFocusedTaskId(newId);

        // Focus the new task card
        const container = listRef.current || (ref as React.RefObject<HTMLDivElement>)?.current;
        if (container) {
          const taskCard = container.querySelector(`[data-task-id="${newId}"]`) as HTMLElement;
          taskCard?.focus();
        }
      }
    },
    [getAllTaskIds, onSelectTask, tasks, ref]
  );

  const accessibleLabel = buildListAccessibleLabel(tasks, groupByStatus, ariaLabel);

  // Empty state
  if (tasks.length === 0) {
    return (
      <Box ref={ref} className={className} data-testid={testId} data-empty="true" {...props}>
        <EmptyState
          icon={ClipboardList}
          title={DEFAULT_EMPTY_TITLE}
          description={DEFAULT_EMPTY_DESCRIPTION}
          size={baseSize}
          data-testid={testId ? `${testId}-empty` : undefined}
        />
      </Box>
    );
  }

  // Kanban view - group tasks by status
  if (groupByStatus) {
    const groupedTasks = groupTasksByStatus(tasks);
    const kanbanGapClasses = getResponsiveSizeClasses(size, TASK_LIST_KANBAN_GAP_CLASSES);

    return (
      <Box
        ref={ref}
        className={cn(TASK_LIST_KANBAN_BASE_CLASSES, kanbanGapClasses, className)}
        role="region"
        aria-label={accessibleLabel}
        data-testid={testId}
        data-layout="kanban"
        data-task-count={tasks.length}
        data-size={baseSize}
        {...props}
      >
        {/* Screen reader announcement for selection */}
        {selectionAnnouncement && (
          <VisuallyHidden>
            <Text as="span" role="status" aria-live="polite">
              {selectionAnnouncement}
            </Text>
          </VisuallyHidden>
        )}

        {STATUS_ORDER.map((status) => (
          <StatusColumn
            key={status}
            status={status}
            tasks={groupedTasks[status]}
            selectedTaskId={selectedTaskId}
            onSelectTask={onSelectTask}
            onStatusChange={onStatusChange}
            onTaskContextMenu={onTaskContextMenu}
            onTaskMoreClick={onTaskMoreClick}
            size={baseSize}
            focusedTaskId={focusedTaskId}
            onKeyDown={handleKeyDown}
            data-testid={testId ? `${testId}-column-${status}` : undefined}
          />
        ))}
      </Box>
    );
  }

  // Simple list view
  const listGapClasses = getResponsiveSizeClasses(size, TASK_LIST_GAP_CLASSES);

  return (
    <Box
      ref={(node) => {
        // Handle both refs
        if (typeof ref === 'function') {
          ref(node);
        } else if (ref) {
          ref.current = node;
        }
        (listRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
      }}
      className={cn(TASK_LIST_BASE_CLASSES, listGapClasses, className)}
      role="list"
      aria-label={accessibleLabel}
      data-testid={testId}
      data-layout="list"
      data-task-count={tasks.length}
      data-size={baseSize}
      {...props}
    >
      {/* Screen reader announcement for selection */}
      {selectionAnnouncement && (
        <VisuallyHidden>
          <Text as="span" role="status" aria-live="polite">
            {selectionAnnouncement}
          </Text>
        </VisuallyHidden>
      )}

      {/* Navigation hint for screen readers */}
      <VisuallyHidden>
        <Text as="span">{SR_NAVIGATION_HINT}</Text>
      </VisuallyHidden>

      {tasks.map((task) => (
        <Box key={task.id} role="listitem" onKeyDown={(e) => handleKeyDown(e, task.id)}>
          <TaskCard
            task={task}
            isSelected={selectedTaskId === task.id}
            size={size}
            tabIndex={focusedTaskId === task.id ? 0 : -1}
            {...(onSelectTask && { onSelect: onSelectTask })}
            {...(onStatusChange && { onStatusChange })}
            {...(onTaskContextMenu && { onContextMenu: onTaskContextMenu })}
            {...(onTaskMoreClick && { onMoreClick: onTaskMoreClick })}
            data-testid={testId ? `${testId}-task-${task.id}` : undefined}
          />
        </Box>
      ))}
    </Box>
  );
});

TaskList.displayName = 'TaskList';
