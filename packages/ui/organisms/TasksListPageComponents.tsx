/**
 * Tasks List Page Components
 *
 * Stateless UI components for the tasks list page.
 * These are composed in the route to create the full tasks list experience.
 */

import type { Task, TaskStatus } from '@openflow/generated';
import { cn } from '@openflow/utils';
import { ListTodo } from 'lucide-react';
import type React from 'react';
import { EmptyState } from '../molecules/EmptyState';
import { SkeletonTaskCard } from '../molecules/SkeletonTaskCard';
import { TaskList } from './TaskList';

// ============================================================================
// Types
// ============================================================================

/** Filter type for task status */
export type StatusFilter = 'all' | TaskStatus;

/** Filter option for the filter bar */
export interface StatusFilterOption {
  label: string;
  value: StatusFilter;
}

// ============================================================================
// Filter Bar
// ============================================================================

export interface TasksFilterBarProps {
  /** Available status filters */
  filters: StatusFilterOption[];
  /** Currently selected filter */
  selectedFilter: StatusFilter;
  /** Callback when filter changes */
  onFilterChange: (filter: StatusFilter) => void;
  /** Additional CSS classes */
  className?: string;
}

/**
 * TasksFilterBar - Horizontal bar of filter buttons for task status
 */
export function TasksFilterBar({
  filters,
  selectedFilter,
  onFilterChange,
  className,
}: TasksFilterBarProps) {
  return (
    <div
      className={cn(
        'flex items-center gap-2 border-b border-[rgb(var(--border))] px-6 py-3',
        className
      )}
    >
      {filters.map((filter) => (
        <button
          key={filter.value}
          type="button"
          onClick={() => onFilterChange(filter.value)}
          className={cn(
            'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
            selectedFilter === filter.value
              ? 'bg-[rgb(var(--primary))] text-[rgb(var(--primary-foreground))]'
              : 'text-[rgb(var(--muted-foreground))] hover:bg-[rgb(var(--muted))] hover:text-[rgb(var(--foreground))]'
          )}
        >
          {filter.label}
        </button>
      ))}
    </div>
  );
}

TasksFilterBar.displayName = 'TasksFilterBar';

// ============================================================================
// Loading State
// ============================================================================

export interface TasksListLoadingProps {
  /** Number of skeleton cards to show */
  count?: number;
  /** Additional CSS classes */
  className?: string;
}

/**
 * TasksListLoading - Loading state with skeleton cards
 */
export function TasksListLoading({ count = 5, className }: TasksListLoadingProps) {
  return (
    <div className={cn('flex flex-col gap-2', className)}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonTaskCard key={`skeleton-task-${i}`} />
      ))}
    </div>
  );
}

TasksListLoading.displayName = 'TasksListLoading';

// ============================================================================
// Empty State
// ============================================================================

export interface TasksListEmptyProps {
  /** Current filter value */
  filter: StatusFilter;
  /** Additional CSS classes */
  className?: string;
}

/**
 * TasksListEmpty - Empty state when no tasks match the filter
 */
export function TasksListEmpty({ filter, className }: TasksListEmptyProps) {
  const description =
    filter === 'all'
      ? 'Create a task from a project to get started.'
      : `No tasks with status "${filter}".`;

  return (
    <EmptyState
      icon={ListTodo}
      title="No tasks found"
      description={description}
      size="lg"
      className={cn('h-full', className)}
    />
  );
}

TasksListEmpty.displayName = 'TasksListEmpty';

// ============================================================================
// Content Area (handles loading/empty/list states)
// ============================================================================

export interface TasksListContentProps {
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
  /** Additional CSS classes */
  className?: string;
}

/**
 * TasksListContent - Main content area that handles loading/empty/list states
 */
export function TasksListContent({
  isLoading,
  tasks,
  filter,
  onSelectTask,
  onStatusChange,
  className,
}: TasksListContentProps) {
  if (isLoading) {
    return <TasksListLoading className={className} />;
  }

  if (tasks.length === 0) {
    return <TasksListEmpty filter={filter} className={className} />;
  }

  return (
    <TaskList
      tasks={tasks}
      onSelectTask={onSelectTask}
      onStatusChange={onStatusChange}
      className={className}
    />
  );
}

TasksListContent.displayName = 'TasksListContent';

// ============================================================================
// Page Layout
// ============================================================================

export interface TasksListLayoutProps {
  /** Filter bar component */
  filterBar: React.ReactNode;
  /** Main content area */
  children: React.ReactNode;
  /** Outlet for nested routes */
  outlet?: React.ReactNode;
  /** Additional CSS classes */
  className?: string;
}

/**
 * TasksListLayout - Layout wrapper for the tasks list page
 */
export function TasksListLayout({ filterBar, children, outlet, className }: TasksListLayoutProps) {
  return (
    <>
      <div className={cn('flex h-full flex-col', className)}>
        {filterBar}
        <div className="flex-1 overflow-auto p-4 md:p-6">{children}</div>
      </div>
      {outlet}
    </>
  );
}

TasksListLayout.displayName = 'TasksListLayout';
