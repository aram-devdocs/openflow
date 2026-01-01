/**
 * Tasks List Page Components
 *
 * Stateless UI components for the tasks list page.
 * These are composed in the route to create the full tasks list experience.
 *
 * Accessibility:
 * - Uses primitives (Flex, Text, VisuallyHidden) for semantic HTML
 * - ARIA tablist pattern for filter bar with keyboard navigation
 * - Loading states with aria-busy and role="status"
 * - Error states with role="alert" and aria-live="assertive"
 * - Touch targets ≥44px for mobile (WCAG 2.5.5)
 * - Focus rings with ring-offset for visibility
 * - Screen reader announcements for state changes
 * - Proper list semantics with role="list" and role="listitem"
 *
 * Features:
 * - TasksFilterBar with accessible tab pattern
 * - TasksListLoading with skeleton placeholders
 * - TasksListEmpty with call-to-action
 * - TasksListError with retry option
 * - TasksListContent for state management
 * - TasksListLayout for page structure
 * - forwardRef support for all components
 */

import type { Task, TaskStatus } from '@openflow/generated';
import { type Breakpoint, type ResponsiveValue, Text, VisuallyHidden } from '@openflow/primitives';
import { cn } from '@openflow/utils';
import { AlertTriangle, ListTodo, RefreshCw } from 'lucide-react';
import {
  type HTMLAttributes,
  type KeyboardEvent,
  forwardRef,
  useCallback,
  useId,
  useRef,
  useState,
} from 'react';
import { Button } from '../atoms/Button';
import { Icon } from '../atoms/Icon';
import { EmptyState } from '../molecules/EmptyState';
import { SkeletonTaskCard } from '../molecules/SkeletonTaskCard';
import { TaskList } from './TaskList';

// ============================================================================
// Types
// ============================================================================

/** Breakpoint names for responsive values */
export type TasksListBreakpoint = Breakpoint;

/** Size variants for tasks list components */
export type TasksListSize = 'sm' | 'md' | 'lg';

/** Filter type for task status */
export type StatusFilter = 'all' | TaskStatus;

/** Filter option for the filter bar */
export interface StatusFilterOption {
  /** Display label */
  label: string;
  /** Filter value */
  value: StatusFilter;
  /** Optional count to display */
  count?: number;
}

/** Props for TasksFilterBar */
export interface TasksFilterBarProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  /** Available status filters */
  filters: StatusFilterOption[];
  /** Currently selected filter */
  selectedFilter: StatusFilter;
  /** Callback when filter changes */
  onFilterChange: (filter: StatusFilter) => void;
  /** Size variant for responsive sizing */
  size?: ResponsiveValue<TasksListSize>;
  /** Accessible label for filter bar */
  'aria-label'?: string;
  /** Data test ID for automated testing */
  'data-testid'?: string;
}

/** Props for TasksListLoading */
export interface TasksListLoadingProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  /** Number of skeleton cards to show */
  count?: number;
  /** Size variant for responsive sizing */
  size?: ResponsiveValue<TasksListSize>;
  /** Data test ID for automated testing */
  'data-testid'?: string;
}

/** Props for TasksListEmpty */
export interface TasksListEmptyProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  /** Current filter value */
  filter: StatusFilter;
  /** Callback for creating a new task (optional) */
  onCreateTask?: () => void;
  /** Size variant for responsive sizing */
  size?: ResponsiveValue<TasksListSize>;
  /** Data test ID for automated testing */
  'data-testid'?: string;
}

/** Props for TasksListError */
export interface TasksListErrorProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  /** Error message to display */
  message?: string;
  /** Callback to retry loading */
  onRetry?: () => void;
  /** Size variant for responsive sizing */
  size?: ResponsiveValue<TasksListSize>;
  /** Data test ID for automated testing */
  'data-testid'?: string;
}

/** Props for TasksListContent */
export interface TasksListContentProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  /** Whether data is loading */
  isLoading: boolean;
  /** Filtered tasks to display */
  tasks: Task[];
  /** Current filter for empty state message */
  filter: StatusFilter;
  /** Callback when task is selected */
  onSelectTask: (taskId: string) => void;
  /** Callback when task status changes */
  onStatusChange: (taskId: string, status: TaskStatus) => void;
  /** Callback for creating a new task (optional) */
  onCreateTask?: () => void;
  /** Error message if loading failed */
  error?: string | null;
  /** Callback to retry loading */
  onRetry?: () => void;
  /** Size variant for responsive sizing */
  size?: ResponsiveValue<TasksListSize>;
  /** Data test ID for automated testing */
  'data-testid'?: string;
}

/** Props for TasksListLayout */
export interface TasksListLayoutProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  /** Filter bar component */
  filterBar: React.ReactNode;
  /** Main content area */
  children: React.ReactNode;
  /** Outlet for nested routes */
  outlet?: React.ReactNode;
  /** Size variant for responsive sizing */
  size?: ResponsiveValue<TasksListSize>;
  /** Data test ID for automated testing */
  'data-testid'?: string;
}

// ============================================================================
// Constants - Default Labels
// ============================================================================

/** Default filter bar label */
export const DEFAULT_FILTER_BAR_LABEL = 'Task status filters';

/** Default loading label */
export const DEFAULT_LOADING_LABEL = 'Loading tasks...';

/** Default empty state title */
export const DEFAULT_EMPTY_TITLE = 'No tasks found';

/** Default empty state description for all tasks */
export const DEFAULT_EMPTY_ALL_DESCRIPTION = 'Create a task from a project to get started.';

/** Template for empty state description when filtered */
export const DEFAULT_EMPTY_FILTERED_TEMPLATE = 'No tasks with status "{status}".';

/** Default create task label */
export const DEFAULT_CREATE_TASK_LABEL = 'Create Task';

/** Default error title */
export const DEFAULT_ERROR_TITLE = 'Failed to load tasks';

/** Default error message */
export const DEFAULT_ERROR_MESSAGE = 'There was a problem loading your tasks. Please try again.';

/** Default retry label */
export const DEFAULT_RETRY_LABEL = 'Retry';

/** Default skeleton count */
export const DEFAULT_SKELETON_COUNT = 5;

// ============================================================================
// Constants - Screen Reader Announcements
// ============================================================================

/** Screen reader announcement for loading */
export const SR_LOADING = 'Loading tasks, please wait.';

/** Screen reader announcement for filter change */
export const SR_FILTER_CHANGED_TEMPLATE = 'Filter changed to {filter}. {count} task{s} shown.';

/** Screen reader announcement for error */
export const SR_ERROR = 'Error loading tasks.';

/** Screen reader announcement for empty */
export const SR_EMPTY = 'No tasks found.';

/** Screen reader announcement for tasks loaded */
export const SR_TASKS_LOADED_TEMPLATE = '{count} task{s} loaded.';

/** Screen reader navigation hint */
export const SR_FILTER_NAVIGATION_HINT = 'Use arrow keys to navigate filters.';

// ============================================================================
// Constants - CSS Class Mappings
// ============================================================================

/** Filter bar container classes */
export const FILTER_BAR_BASE_CLASSES = 'flex items-center border-b border-[rgb(var(--border))]';

/** Filter bar padding by size */
export const FILTER_BAR_PADDING_CLASSES: Record<TasksListSize, string> = {
  sm: 'px-4 py-2 gap-1',
  md: 'px-6 py-3 gap-2',
  lg: 'px-8 py-4 gap-3',
};

/** Filter tab base classes */
export const FILTER_TAB_BASE_CLASSES =
  'rounded-md text-sm font-medium motion-safe:transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--ring))] focus-visible:ring-offset-2';

/** Filter tab size classes */
export const FILTER_TAB_SIZE_CLASSES: Record<TasksListSize, string> = {
  sm: 'px-2 py-1 text-xs min-h-[36px] sm:min-h-0',
  md: 'px-3 py-1.5 text-sm min-h-[44px] sm:min-h-0',
  lg: 'px-4 py-2 text-base min-h-[44px] sm:min-h-0',
};

/** Filter tab selected classes */
export const FILTER_TAB_SELECTED_CLASSES =
  'bg-[rgb(var(--primary))] text-[rgb(var(--primary-foreground))]';

/** Filter tab unselected classes */
export const FILTER_TAB_UNSELECTED_CLASSES =
  'text-[rgb(var(--muted-foreground))] hover:bg-[rgb(var(--muted))] hover:text-[rgb(var(--foreground))]';

/** Filter count badge classes */
export const FILTER_COUNT_BADGE_CLASSES =
  'ml-1.5 rounded-full bg-[rgb(var(--muted))] px-1.5 py-0.5 text-xs text-[rgb(var(--muted-foreground))]';

/** Loading container base classes */
export const LOADING_BASE_CLASSES = 'flex flex-col';

/** Loading gap by size */
export const LOADING_GAP_CLASSES: Record<TasksListSize, string> = {
  sm: 'gap-1.5',
  md: 'gap-2',
  lg: 'gap-3',
};

/** Error container base classes */
export const ERROR_BASE_CLASSES =
  'flex flex-col items-center justify-center rounded-lg border border-[rgb(var(--destructive))]/30 bg-[rgb(var(--destructive))]/5';

/** Error padding by size */
export const ERROR_PADDING_CLASSES: Record<TasksListSize, string> = {
  sm: 'p-4 gap-2',
  md: 'p-6 gap-3',
  lg: 'p-8 gap-4',
};

/** Error icon size by component size */
export const ERROR_ICON_SIZE: Record<TasksListSize, 'sm' | 'md' | 'lg' | 'xl'> = {
  sm: 'md',
  md: 'lg',
  lg: 'xl',
};

/** Error text size by component size */
export const ERROR_TEXT_SIZE: Record<TasksListSize, 'xs' | 'sm' | 'base' | 'lg'> = {
  sm: 'sm',
  md: 'base',
  lg: 'lg',
};

/** Error message text size by component size */
export const ERROR_MESSAGE_SIZE: Record<TasksListSize, 'xs' | 'sm' | 'base'> = {
  sm: 'xs',
  md: 'sm',
  lg: 'base',
};

/** Layout container classes */
export const LAYOUT_BASE_CLASSES = 'flex h-full flex-col';

/** Layout content padding by size */
export const LAYOUT_CONTENT_PADDING_CLASSES: Record<TasksListSize, string> = {
  sm: 'p-3',
  md: 'p-4 md:p-6',
  lg: 'p-6 md:p-8',
};

/** Layout content base classes */
export const LAYOUT_CONTENT_BASE_CLASSES = 'flex-1 overflow-auto';

// ============================================================================
// Utility Functions
// ============================================================================

/** Breakpoint order for responsive class generation */
const BREAKPOINT_ORDER: TasksListBreakpoint[] = ['base', 'sm', 'md', 'lg', 'xl', '2xl'];

/**
 * Get base size from responsive value
 */
export function getBaseSize(size: ResponsiveValue<TasksListSize>): TasksListSize {
  if (typeof size === 'string') {
    return size;
  }
  if (typeof size === 'object' && size !== null) {
    const responsiveSize = size as Partial<Record<TasksListBreakpoint, TasksListSize>>;
    if (responsiveSize.base) return responsiveSize.base;
    for (const bp of BREAKPOINT_ORDER) {
      if (responsiveSize[bp]) return responsiveSize[bp] as TasksListSize;
    }
  }
  return 'md';
}

/**
 * Generate responsive classes from a size-to-class mapping
 */
export function getResponsiveSizeClasses(
  size: ResponsiveValue<TasksListSize>,
  classMap: Record<TasksListSize, string>
): string {
  if (typeof size === 'string') {
    return classMap[size];
  }

  const classes: string[] = [];
  if (typeof size === 'object' && size !== null) {
    const responsiveSize = size as Partial<Record<TasksListBreakpoint, TasksListSize>>;
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
 * Build description for empty state based on filter
 */
export function buildEmptyDescription(filter: StatusFilter): string {
  if (filter === 'all') {
    return DEFAULT_EMPTY_ALL_DESCRIPTION;
  }
  return DEFAULT_EMPTY_FILTERED_TEMPLATE.replace('{status}', filter);
}

/**
 * Build screen reader announcement for filter change
 */
export function buildFilterChangeAnnouncement(filter: StatusFilter, count: number): string {
  const filterLabel = filter === 'all' ? 'All' : filter;
  return SR_FILTER_CHANGED_TEMPLATE.replace('{filter}', filterLabel)
    .replace('{count}', String(count))
    .replace('{s}', count === 1 ? '' : 's');
}

/**
 * Build screen reader announcement for tasks loaded
 */
export function buildTasksLoadedAnnouncement(count: number): string {
  return SR_TASKS_LOADED_TEMPLATE.replace('{count}', String(count)).replace(
    '{s}',
    count === 1 ? '' : 's'
  );
}

/**
 * Get filter label for screen readers
 */
export function getFilterAccessibleLabel(option: StatusFilterOption, isSelected: boolean): string {
  const countText = option.count !== undefined ? `, ${option.count} tasks` : '';
  const selectedText = isSelected ? ', selected' : '';
  return `${option.label}${countText}${selectedText}`;
}

// ============================================================================
// TasksFilterBar Component
// ============================================================================

/**
 * TasksFilterBar - Horizontal bar of filter buttons for task status
 *
 * Implements ARIA tablist pattern with keyboard navigation:
 * - Arrow Left/Right: Navigate between filters
 * - Home: Jump to first filter
 * - End: Jump to last filter
 * - Enter/Space: Select focused filter
 *
 * @example
 * <TasksFilterBar
 *   filters={filters}
 *   selectedFilter="all"
 *   onFilterChange={handleFilterChange}
 * />
 */
export const TasksFilterBar = forwardRef<HTMLDivElement, TasksFilterBarProps>(
  function TasksFilterBar(
    {
      filters,
      selectedFilter,
      onFilterChange,
      size = 'md',
      className,
      'aria-label': ariaLabel = DEFAULT_FILTER_BAR_LABEL,
      'data-testid': testId,
      ...props
    },
    ref
  ) {
    const baseSize = getBaseSize(size);
    const paddingClasses = getResponsiveSizeClasses(size, FILTER_BAR_PADDING_CLASSES);
    const tabSizeClasses = getResponsiveSizeClasses(size, FILTER_TAB_SIZE_CLASSES);
    const [focusedIndex, setFocusedIndex] = useState<number>(() =>
      filters.findIndex((f) => f.value === selectedFilter)
    );
    const [announcement, setAnnouncement] = useState('');
    const tabsRef = useRef<(HTMLButtonElement | null)[]>([]);
    const tablistId = useId();

    // Handle keyboard navigation
    const handleKeyDown = useCallback(
      (e: KeyboardEvent<HTMLButtonElement>, index: number) => {
        let newIndex: number | null = null;

        switch (e.key) {
          case 'ArrowLeft':
          case 'ArrowUp':
            e.preventDefault();
            newIndex = index > 0 ? index - 1 : filters.length - 1;
            break;
          case 'ArrowRight':
          case 'ArrowDown':
            e.preventDefault();
            newIndex = index < filters.length - 1 ? index + 1 : 0;
            break;
          case 'Home':
            e.preventDefault();
            newIndex = 0;
            break;
          case 'End':
            e.preventDefault();
            newIndex = filters.length - 1;
            break;
          case 'Enter':
          case ' ':
            e.preventDefault();
            if (filters[index]) {
              onFilterChange(filters[index].value);
            }
            return;
        }

        if (newIndex !== null) {
          setFocusedIndex(newIndex);
          tabsRef.current[newIndex]?.focus();
        }
      },
      [filters, onFilterChange]
    );

    // Handle filter selection
    const handleSelect = useCallback(
      (filter: StatusFilterOption, _index: number) => {
        onFilterChange(filter.value);
        // Announce the change (count is typically passed in props or calculated externally)
        const count = filter.count ?? 0;
        setAnnouncement(buildFilterChangeAnnouncement(filter.value, count));
        setTimeout(() => setAnnouncement(''), 1000);
      },
      [onFilterChange]
    );

    return (
      <div
        ref={ref}
        className={cn(FILTER_BAR_BASE_CLASSES, paddingClasses, className)}
        role="tablist"
        aria-label={ariaLabel}
        data-testid={testId}
        data-size={baseSize}
        data-selected-filter={selectedFilter}
        {...props}
      >
        {/* Screen reader navigation hint */}
        <VisuallyHidden>
          <span>{SR_FILTER_NAVIGATION_HINT}</span>
        </VisuallyHidden>

        {/* Screen reader announcement for filter changes */}
        {announcement && (
          <VisuallyHidden>
            <span role="status" aria-live="polite">
              {announcement}
            </span>
          </VisuallyHidden>
        )}

        {filters.map((filter, index) => {
          const isSelected = selectedFilter === filter.value;
          const tabId = `${tablistId}-tab-${index}`;

          return (
            <button
              key={filter.value}
              ref={(el) => {
                tabsRef.current[index] = el;
              }}
              id={tabId}
              type="button"
              role="tab"
              aria-selected={isSelected}
              aria-label={getFilterAccessibleLabel(filter, isSelected)}
              tabIndex={focusedIndex === index ? 0 : -1}
              onClick={() => handleSelect(filter, index)}
              onKeyDown={(e) => handleKeyDown(e, index)}
              onFocus={() => setFocusedIndex(index)}
              className={cn(
                FILTER_TAB_BASE_CLASSES,
                tabSizeClasses,
                isSelected ? FILTER_TAB_SELECTED_CLASSES : FILTER_TAB_UNSELECTED_CLASSES
              )}
              data-testid={testId ? `${testId}-tab-${filter.value}` : undefined}
              data-selected={isSelected}
            >
              {filter.label}
              {filter.count !== undefined && (
                <span
                  className={cn(
                    FILTER_COUNT_BADGE_CLASSES,
                    isSelected && 'bg-[rgb(var(--primary-foreground))]/20'
                  )}
                  aria-hidden="true"
                >
                  {filter.count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    );
  }
);

TasksFilterBar.displayName = 'TasksFilterBar';

// ============================================================================
// TasksListLoading Component
// ============================================================================

/**
 * TasksListLoading - Loading state with skeleton cards
 *
 * @example
 * <TasksListLoading count={5} />
 */
export const TasksListLoading = forwardRef<HTMLDivElement, TasksListLoadingProps>(
  function TasksListLoading(
    { count = DEFAULT_SKELETON_COUNT, size = 'md', className, 'data-testid': testId, ...props },
    ref
  ) {
    const baseSize = getBaseSize(size);
    const gapClasses = getResponsiveSizeClasses(size, LOADING_GAP_CLASSES);

    return (
      <div
        ref={ref}
        className={cn(LOADING_BASE_CLASSES, gapClasses, className)}
        role="status"
        aria-busy="true"
        aria-label={DEFAULT_LOADING_LABEL}
        data-testid={testId}
        data-count={count}
        data-size={baseSize}
        {...props}
      >
        <VisuallyHidden>
          <span aria-live="polite">{SR_LOADING}</span>
        </VisuallyHidden>
        <div aria-hidden="true">
          {Array.from({ length: count }).map((_, i) => (
            <SkeletonTaskCard
              key={`skeleton-task-${i}`}
              size={size}
              data-testid={testId ? `${testId}-skeleton-${i}` : undefined}
            />
          ))}
        </div>
      </div>
    );
  }
);

TasksListLoading.displayName = 'TasksListLoading';

// ============================================================================
// TasksListEmpty Component
// ============================================================================

/**
 * TasksListEmpty - Empty state when no tasks match the filter
 *
 * @example
 * <TasksListEmpty filter="all" onCreateTask={() => {}} />
 */
export const TasksListEmpty = forwardRef<HTMLDivElement, TasksListEmptyProps>(
  function TasksListEmpty(
    { filter, onCreateTask, size = 'md', className, 'data-testid': testId, ...props },
    ref
  ) {
    const baseSize = getBaseSize(size);
    const description = buildEmptyDescription(filter);

    return (
      <div
        ref={ref}
        className={cn('h-full', className)}
        role="region"
        aria-label="Empty tasks"
        data-testid={testId}
        data-filter={filter}
        data-size={baseSize}
        {...props}
      >
        <VisuallyHidden>
          <span role="status" aria-live="polite">
            {SR_EMPTY}
          </span>
        </VisuallyHidden>
        <EmptyState
          icon={ListTodo}
          title={DEFAULT_EMPTY_TITLE}
          description={description}
          size={baseSize}
          className="h-full"
          {...(onCreateTask && filter === 'all'
            ? {
                action: {
                  label: DEFAULT_CREATE_TASK_LABEL,
                  onClick: onCreateTask,
                  'aria-label': DEFAULT_CREATE_TASK_LABEL,
                },
              }
            : {})}
          data-testid={testId ? `${testId}-empty-state` : undefined}
        />
      </div>
    );
  }
);

TasksListEmpty.displayName = 'TasksListEmpty';

// ============================================================================
// TasksListError Component
// ============================================================================

/**
 * TasksListError - Error state with retry option
 *
 * @example
 * <TasksListError message="Failed to load tasks" onRetry={refetch} />
 */
export const TasksListError = forwardRef<HTMLDivElement, TasksListErrorProps>(
  function TasksListError(
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
    const paddingClasses = getResponsiveSizeClasses(size, ERROR_PADDING_CLASSES);
    const iconSize = ERROR_ICON_SIZE[baseSize];
    const textSize = ERROR_TEXT_SIZE[baseSize];
    const messageSize = ERROR_MESSAGE_SIZE[baseSize];

    return (
      <div
        ref={ref}
        className={cn(ERROR_BASE_CLASSES, paddingClasses, className)}
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
          <span role="status" aria-live="polite">
            {`${SR_ERROR} ${message}`}
          </span>
        </VisuallyHidden>
      </div>
    );
  }
);

TasksListError.displayName = 'TasksListError';

// ============================================================================
// TasksListContent Component
// ============================================================================

/**
 * TasksListContent - Main content area that handles loading/empty/error/list states
 *
 * @example
 * <TasksListContent
 *   isLoading={false}
 *   tasks={tasks}
 *   filter="all"
 *   onSelectTask={handleSelect}
 *   onStatusChange={handleStatusChange}
 * />
 */
export const TasksListContent = forwardRef<HTMLDivElement, TasksListContentProps>(
  function TasksListContent(
    {
      isLoading,
      tasks,
      filter,
      onSelectTask,
      onStatusChange,
      onCreateTask,
      error,
      onRetry,
      size = 'md',
      className,
      'data-testid': testId,
      ...props
    },
    ref
  ) {
    const baseSize = getBaseSize(size);
    const [announcement, setAnnouncement] = useState('');

    // Announce when tasks are loaded
    const prevLoadingRef = useRef(isLoading);
    if (prevLoadingRef.current && !isLoading && !error && tasks.length > 0) {
      const newAnnouncement = buildTasksLoadedAnnouncement(tasks.length);
      if (announcement !== newAnnouncement) {
        setAnnouncement(newAnnouncement);
        setTimeout(() => setAnnouncement(''), 1000);
      }
    }
    prevLoadingRef.current = isLoading;

    // Error state
    if (error) {
      return (
        <TasksListError
          ref={ref}
          message={error}
          onRetry={onRetry}
          size={size}
          className={className}
          data-testid={testId ? `${testId}-error` : undefined}
          {...props}
        />
      );
    }

    // Loading state
    if (isLoading) {
      return (
        <TasksListLoading
          ref={ref}
          size={size}
          className={className}
          data-testid={testId ? `${testId}-loading` : undefined}
          {...props}
        />
      );
    }

    // Empty state
    if (tasks.length === 0) {
      return (
        <TasksListEmpty
          ref={ref}
          filter={filter}
          onCreateTask={onCreateTask}
          size={size}
          className={className}
          data-testid={testId ? `${testId}-empty` : undefined}
          {...props}
        />
      );
    }

    // Task list
    return (
      <div
        ref={ref}
        className={className}
        data-testid={testId}
        data-size={baseSize}
        data-task-count={tasks.length}
        {...props}
      >
        {/* Screen reader announcement for tasks loaded */}
        {announcement && (
          <VisuallyHidden>
            <span role="status" aria-live="polite">
              {announcement}
            </span>
          </VisuallyHidden>
        )}
        <TaskList
          tasks={tasks}
          onSelectTask={onSelectTask}
          onStatusChange={onStatusChange}
          size={size}
          data-testid={testId ? `${testId}-list` : undefined}
        />
      </div>
    );
  }
);

TasksListContent.displayName = 'TasksListContent';

// ============================================================================
// TasksListLayout Component
// ============================================================================

/**
 * TasksListLayout - Layout wrapper for the tasks list page
 *
 * @example
 * <TasksListLayout filterBar={<TasksFilterBar ... />}>
 *   <TasksListContent ... />
 * </TasksListLayout>
 */
export const TasksListLayout = forwardRef<HTMLDivElement, TasksListLayoutProps>(
  function TasksListLayout(
    { filterBar, children, outlet, size = 'md', className, 'data-testid': testId, ...props },
    ref
  ) {
    const baseSize = getBaseSize(size);
    const contentPaddingClasses = getResponsiveSizeClasses(size, LAYOUT_CONTENT_PADDING_CLASSES);

    return (
      <>
        <div
          ref={ref}
          className={cn(LAYOUT_BASE_CLASSES, className)}
          role="region"
          aria-label="Tasks list"
          data-testid={testId}
          data-size={baseSize}
          {...props}
        >
          {filterBar}
          <div className={cn(LAYOUT_CONTENT_BASE_CLASSES, contentPaddingClasses)}>{children}</div>
        </div>
        {outlet}
      </>
    );
  }
);

TasksListLayout.displayName = 'TasksListLayout';
