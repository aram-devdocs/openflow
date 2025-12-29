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
 * Keeps page logic minimal (<200 lines) by delegating to UI components.
 */

import { useState, useCallback } from 'react';
import { createFileRoute, useNavigate, Outlet } from '@tanstack/react-router';
import { ListTodo } from 'lucide-react';
import { AppLayout, Header, TaskList } from '@openflow/ui';
import {
  useProjects,
  useTasks,
  useUpdateTask,
  useKeyboardShortcuts,
} from '@openflow/hooks';
import { TaskStatus } from '@openflow/generated';
import type { StatusFilter } from '@openflow/ui';

export const Route = createFileRoute('/tasks')({
  component: TasksPage,
});

function TasksPage() {
  const navigate = useNavigate();

  // UI state
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

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
    statusFilter === 'all'
      ? tasks
      : tasks.filter((task) => task.status === statusFilter);

  // Status filter buttons
  const statusFilters: { label: string; value: StatusFilter }[] = [
    { label: 'All', value: 'all' },
    { label: 'To Do', value: TaskStatus.Todo },
    { label: 'In Progress', value: TaskStatus.Inprogress },
    { label: 'In Review', value: TaskStatus.Inreview },
    { label: 'Done', value: TaskStatus.Done },
  ];

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
      <div className="flex h-full flex-col">
        {/* Filter bar */}
        <div className="flex items-center gap-2 border-b border-[rgb(var(--border))] px-6 py-3">
          {statusFilters.map((filter) => (
            <button
              key={filter.value}
              type="button"
              onClick={() => setStatusFilter(filter.value)}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                statusFilter === filter.value
                  ? 'bg-[rgb(var(--primary))] text-[rgb(var(--primary-foreground))]'
                  : 'text-[rgb(var(--muted-foreground))] hover:bg-[rgb(var(--muted))] hover:text-[rgb(var(--foreground))]'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>

        {/* Task content */}
        <div className="flex-1 overflow-auto p-6">
          {isLoading ? (
            <div className="flex h-full items-center justify-center">
              <div className="text-sm text-[rgb(var(--muted-foreground))]">
                Loading tasks...
              </div>
            </div>
          ) : filteredTasks.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center">
              <ListTodo className="mb-4 h-16 w-16 text-[rgb(var(--muted-foreground))]" />
              <h3 className="text-lg font-medium text-[rgb(var(--foreground))]">
                No tasks found
              </h3>
              <p className="mt-2 text-sm text-[rgb(var(--muted-foreground))]">
                {statusFilter === 'all'
                  ? 'Create a task from a project to get started.'
                  : `No tasks with status "${statusFilter}".`}
              </p>
            </div>
          ) : (
            <TaskList
              tasks={filteredTasks}
              onSelectTask={handleSelectTask}
              onStatusChange={handleTaskStatusChange}
            />
          )}
        </div>
      </div>

      {/* Outlet for nested routes (task detail) */}
      <Outlet />
    </AppLayout>
  );
}
