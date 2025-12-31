/**
 * Tasks List Page Route
 *
 * Displays all tasks across all projects in a kanban-style board.
 * Users can:
 * - View all tasks organized by status columns
 * - Filter tasks by status
 * - Navigate to task details
 *
 * Follows the orchestration pattern: connects hooks to UI components.
 * Keeps page logic minimal by delegating to UI components.
 */

import { TaskStatus } from '@openflow/generated';
import { useKeyboardShortcuts, useProjects, useTasks, useUpdateTask } from '@openflow/hooks';
import {
  AppLayout,
  Header,
  TasksFilterBar,
  TasksListContent,
  TasksListLayout,
  type TasksStatusFilter,
  type TasksStatusFilterOption,
} from '@openflow/ui';
import { Outlet, createFileRoute, useNavigate } from '@tanstack/react-router';
import { useCallback, useState } from 'react';

export const Route = createFileRoute('/tasks')({
  component: TasksPage,
});

/** Status filter options for the filter bar */
const STATUS_FILTERS: TasksStatusFilterOption[] = [
  { label: 'All', value: 'all' },
  { label: 'To Do', value: TaskStatus.Todo },
  { label: 'In Progress', value: TaskStatus.Inprogress },
  { label: 'In Review', value: TaskStatus.Inreview },
  { label: 'Done', value: TaskStatus.Done },
];

function TasksPage() {
  const navigate = useNavigate();

  // UI state
  const [statusFilter, setStatusFilter] = useState<TasksStatusFilter>('all');

  // Data fetching - fetch first project's tasks as default
  const { data: projects = [] } = useProjects();
  const firstProjectId = projects[0]?.id ?? '';
  const { data: tasks = [], isLoading } = useTasks(firstProjectId);
  const updateTask = useUpdateTask();

  // Keyboard shortcuts
  useKeyboardShortcuts([
    {
      key: 'Escape',
      action: () => setStatusFilter('all'),
    },
  ]);

  // Callbacks
  const handleSelectTask = useCallback(
    (taskId: string) => {
      navigate({ to: '/tasks/$taskId', params: { taskId } });
    },
    [navigate]
  );

  const handleTaskStatusChange = useCallback(
    (taskId: string, status: TaskStatus) => {
      updateTask.mutate({ id: taskId, request: { status } });
    },
    [updateTask]
  );

  const handleSearch = useCallback(() => {
    // TODO: Open command palette for search
    console.log('Search clicked');
  }, []);

  // Filter tasks based on status filter
  const filteredTasks =
    statusFilter === 'all' ? tasks : tasks.filter((task) => task.status === statusFilter);

  return (
    <AppLayout
      sidebarCollapsed={true}
      sidebar={null}
      header={
        <Header
          title="All Tasks"
          subtitle={`${tasks.length} task${tasks.length === 1 ? '' : 's'}`}
          onSearch={handleSearch}
        />
      }
    >
      <TasksListLayout
        filterBar={
          <TasksFilterBar
            filters={STATUS_FILTERS}
            selectedFilter={statusFilter}
            onFilterChange={setStatusFilter}
          />
        }
        outlet={<Outlet />}
      >
        <TasksListContent
          isLoading={isLoading}
          tasks={filteredTasks}
          filter={statusFilter}
          onSelectTask={handleSelectTask}
          onStatusChange={handleTaskStatusChange}
        />
      </TasksListLayout>
    </AppLayout>
  );
}
