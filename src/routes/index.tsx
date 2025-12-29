/**
 * Dashboard / Home Page Route
 *
 * The main entry point of the application. Displays:
 * - Project overview with sidebar
 * - Task board for selected project
 * - Recent tasks and quick actions
 *
 * Follows the orchestration pattern: connects hooks to UI components.
 * Keeps page logic minimal (<200 lines) by delegating to UI components.
 */

import { SearchResultType } from '@openflow/generated';
import type { TaskStatus } from '@openflow/generated';
import { useKeyboardShortcuts, useProjects, useTasks, useUpdateTask } from '@openflow/hooks';
import { AppLayout, CommandPalette, Header, Sidebar } from '@openflow/ui';
import type { CommandAction, RecentItem, StatusFilter } from '@openflow/ui';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { Archive, FolderPlus, Plus, Settings } from 'lucide-react';
import { useCallback, useState } from 'react';

export const Route = createFileRoute('/')({
  component: DashboardPage,
});

function DashboardPage() {
  const navigate = useNavigate();

  // UI state
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string | undefined>(undefined);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  // Data fetching
  const { data: projects = [], isLoading: isLoadingProjects } = useProjects();
  const { data: tasks = [], isLoading: isLoadingTasks } = useTasks(selectedProjectId ?? '');
  const updateTask = useUpdateTask();

  // Auto-select first project if none selected
  const activeProjectId = selectedProjectId ?? projects[0]?.id;
  const activeProject = projects.find((p) => p.id === activeProjectId);

  // Keyboard shortcuts
  useKeyboardShortcuts([
    {
      key: 'k',
      meta: true,
      action: () => setCommandPaletteOpen(true),
    },
    {
      key: 'Escape',
      action: () => setCommandPaletteOpen(false),
    },
  ]);

  // Callbacks for sidebar actions
  const handleSelectProject = useCallback((projectId: string) => {
    setSelectedProjectId(projectId);
  }, []);

  const handleSelectTask = useCallback(
    (taskId: string) => {
      navigate({ to: '/tasks/$taskId', params: { taskId } });
    },
    [navigate]
  );

  const handleNewTask = useCallback(() => {
    // TODO: Open new task dialog
    console.log('New task clicked');
  }, []);

  const handleNewProject = useCallback(() => {
    // TODO: Open new project dialog
    console.log('New project clicked');
  }, []);

  const handleStatusFilter = useCallback((status: StatusFilter) => {
    setStatusFilter(status);
  }, []);

  const handleTaskStatusChange = useCallback(
    (taskId: string, status: TaskStatus) => {
      updateTask.mutate({ id: taskId, request: { status } });
    },
    [updateTask]
  );

  const handleSettingsClick = useCallback(() => {
    navigate({ to: '/settings' as string });
  }, [navigate]);

  const handleArchiveClick = useCallback(() => {
    navigate({ to: '/archive' as string });
  }, [navigate]);

  const handleToggleSidebar = useCallback(() => {
    setSidebarCollapsed((prev) => !prev);
  }, []);

  // Callbacks for header actions
  const handleSearch = useCallback(() => {
    setCommandPaletteOpen(true);
  }, []);

  const handleNewChat = useCallback(() => {
    // TODO: Open new chat dialog
    console.log('New chat clicked');
  }, []);

  const handleNewTerminal = useCallback(() => {
    // TODO: Open new terminal
    console.log('New terminal clicked');
  }, []);

  // Command palette callbacks
  const handleCommandSearch = useCallback((_query: string) => {
    // TODO: Implement search via searchQueries
  }, []);

  const handleCloseCommandPalette = useCallback(() => {
    setCommandPaletteOpen(false);
  }, []);

  // Build command actions for the palette
  const commandActions: CommandAction[] = [
    {
      id: 'new-task',
      label: 'New Task',
      icon: Plus,
      onSelect: handleNewTask,
    },
    {
      id: 'new-project',
      label: 'New Project',
      icon: FolderPlus,
      onSelect: handleNewProject,
    },
    {
      id: 'settings',
      label: 'Open Settings',
      icon: Settings,
      onSelect: handleSettingsClick,
    },
    {
      id: 'archive',
      label: 'View Archive',
      icon: Archive,
      onSelect: handleArchiveClick,
    },
  ];

  // Build recent items for the command palette
  const recentItems: RecentItem[] = tasks.slice(0, 5).map((task) => {
    const item: RecentItem = {
      id: task.id,
      type: SearchResultType.Task,
      title: task.title,
    };
    if (activeProject?.name) {
      item.subtitle = activeProject.name;
    }
    return item;
  });

  // Build header subtitle
  const getHeaderSubtitle = () => {
    if (isLoadingTasks) return 'Loading tasks...';
    const inProgressCount = tasks.filter((t) => t.status === 'inprogress').length;
    if (inProgressCount === 0) return `${tasks.length} tasks`;
    return `${inProgressCount} task${inProgressCount === 1 ? '' : 's'} in progress`;
  };

  return (
    <AppLayout
      sidebarCollapsed={sidebarCollapsed}
      sidebar={
        <Sidebar
          projects={projects}
          tasks={tasks}
          {...(activeProjectId ? { selectedProjectId: activeProjectId } : {})}
          statusFilter={statusFilter}
          onSelectProject={handleSelectProject}
          onSelectTask={handleSelectTask}
          onNewTask={handleNewTask}
          onNewProject={handleNewProject}
          onStatusFilter={handleStatusFilter}
          onTaskStatusChange={handleTaskStatusChange}
          onSettingsClick={handleSettingsClick}
          onArchiveClick={handleArchiveClick}
          isCollapsed={sidebarCollapsed}
          onToggleCollapse={handleToggleSidebar}
        />
      }
      header={
        <Header
          title={activeProject?.name ?? 'OpenFlow'}
          subtitle={getHeaderSubtitle()}
          onSearch={handleSearch}
          onNewChat={handleNewChat}
          onNewTerminal={handleNewTerminal}
        />
      }
    >
      {/* Main content area - Dashboard view */}
      <div className="flex h-full flex-col">
        {/* Empty state when no project selected */}
        {!activeProjectId && !isLoadingProjects && (
          <div className="flex flex-1 flex-col items-center justify-center p-8">
            <div className="text-center">
              <h2 className="text-lg font-semibold text-[rgb(var(--foreground))]">
                Welcome to OpenFlow
              </h2>
              <p className="mt-2 text-sm text-[rgb(var(--muted-foreground))]">
                Get started by creating a project or selecting one from the sidebar.
              </p>
              <button
                type="button"
                onClick={handleNewProject}
                className="mt-4 inline-flex items-center gap-2 rounded-md bg-[rgb(var(--primary))] px-4 py-2 text-sm font-medium text-[rgb(var(--primary-foreground))] hover:bg-[rgb(var(--primary))]/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--ring))]"
              >
                Create Project
              </button>
            </div>
          </div>
        )}

        {/* Loading state */}
        {(isLoadingProjects || isLoadingTasks) && activeProjectId && (
          <div className="flex flex-1 items-center justify-center">
            <div className="text-sm text-[rgb(var(--muted-foreground))]">Loading...</div>
          </div>
        )}

        {/* Project overview when project is selected */}
        {activeProjectId && !isLoadingTasks && (
          <div className="flex-1 overflow-auto p-6">
            {/* Quick stats */}
            <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard label="Total Tasks" value={tasks.length} variant="default" />
              <StatCard
                label="In Progress"
                value={tasks.filter((t) => t.status === 'inprogress').length}
                variant="info"
              />
              <StatCard
                label="In Review"
                value={tasks.filter((t) => t.status === 'inreview').length}
                variant="warning"
              />
              <StatCard
                label="Completed"
                value={tasks.filter((t) => t.status === 'done').length}
                variant="success"
              />
            </div>

            {/* Recent tasks section */}
            <div className="rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--card))]">
              <div className="border-b border-[rgb(var(--border))] px-4 py-3">
                <h3 className="text-sm font-medium text-[rgb(var(--foreground))]">Recent Tasks</h3>
              </div>
              <div className="p-4">
                {tasks.length === 0 ? (
                  <div className="py-8 text-center">
                    <p className="text-sm text-[rgb(var(--muted-foreground))]">
                      No tasks yet. Create one to get started!
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {tasks.slice(0, 5).map((task) => (
                      <button
                        key={task.id}
                        type="button"
                        onClick={() => handleSelectTask(task.id)}
                        className="flex w-full items-center justify-between rounded-md px-3 py-2 text-left transition-colors hover:bg-[rgb(var(--muted))]"
                      >
                        <span className="truncate text-sm text-[rgb(var(--foreground))]">
                          {task.title}
                        </span>
                        <StatusBadge status={task.status} />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Command palette overlay */}
      <CommandPalette
        isOpen={commandPaletteOpen}
        onClose={handleCloseCommandPalette}
        onSearch={handleCommandSearch}
        actions={commandActions}
        recentItems={recentItems}
      />
    </AppLayout>
  );
}

// Helper components

interface StatCardProps {
  label: string;
  value: number;
  variant?: 'default' | 'info' | 'warning' | 'success';
}

function StatCard({ label, value, variant = 'default' }: StatCardProps) {
  const variantStyles = {
    default: 'border-[rgb(var(--border))]',
    info: 'border-blue-500/30 bg-blue-500/5',
    warning: 'border-yellow-500/30 bg-yellow-500/5',
    success: 'border-green-500/30 bg-green-500/5',
  };

  const valueStyles = {
    default: 'text-[rgb(var(--foreground))]',
    info: 'text-blue-400',
    warning: 'text-yellow-400',
    success: 'text-green-400',
  };

  return (
    <div className={`rounded-lg border p-4 ${variantStyles[variant]} bg-[rgb(var(--card))]`}>
      <p className="text-xs font-medium text-[rgb(var(--muted-foreground))]">{label}</p>
      <p className={`mt-1 text-2xl font-semibold ${valueStyles[variant]}`}>{value}</p>
    </div>
  );
}

interface StatusBadgeProps {
  status: TaskStatus;
}

function StatusBadge({ status }: StatusBadgeProps) {
  const statusStyles: Record<TaskStatus, string> = {
    todo: 'bg-zinc-500/20 text-zinc-400',
    inprogress: 'bg-blue-500/20 text-blue-400',
    inreview: 'bg-yellow-500/20 text-yellow-400',
    done: 'bg-green-500/20 text-green-400',
    cancelled: 'bg-red-500/20 text-red-400',
  };

  const statusLabels: Record<TaskStatus, string> = {
    todo: 'To Do',
    inprogress: 'In Progress',
    inreview: 'In Review',
    done: 'Done',
    cancelled: 'Cancelled',
  };

  return (
    <span
      className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${statusStyles[status]}`}
    >
      {statusLabels[status]}
    </span>
  );
}
