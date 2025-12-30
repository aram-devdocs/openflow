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

import { TaskStatus } from '@openflow/generated';
import { useKeyboardShortcuts, useProjects, useTasks, useUpdateTask } from '@openflow/hooks';
import { AppLayout, EmptyState, Header, SkeletonTaskCard, TaskList } from '@openflow/ui';
import type { StatusFilter } from '@openflow/ui';
import { Outlet, createFileRoute, useNavigate } from '@tanstack/react-router';
import { ListTodo } from 'lucide-react';
import { useCallback, useState } from 'react';

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
    statusFilter === 'all' ? tasks : tasks.filter((task) => task.status === statusFilter);

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
        <div className="flex-1 overflow-auto p-4 md:p-6">
          {isLoading ? (
            <div className="flex flex-col gap-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <SkeletonTaskCard key={`skeleton-task-${i}`} />
              ))}
            </div>
          ) : filteredTasks.length === 0 ? (
            <EmptyState
              icon={ListTodo}
              title="No tasks found"
              description={
                statusFilter === 'all'
                  ? 'Create a task from a project to get started.'
                  : `No tasks with status "${statusFilter}".`
              }
              size="lg"
              className="h-full"
            />
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
