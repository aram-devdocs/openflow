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
import type { CreateProjectRequest, CreateTaskRequest, TaskStatus } from '@openflow/generated';
import { ChatRole } from '@openflow/generated';
import {
  useCreateChat,
  useCreateProject,
  useCreateTask,
  useExecutorProfiles,
  useKeyboardShortcuts,
  useKeyboardShortcutsDialog,
  useProjects,
  useStandaloneChats,
  useTasks,
  useUpdateTask,
} from '@openflow/hooks';
import {
  AppLayout,
  Button,
  CommandPalette,
  Dialog,
  FormField,
  Header,
  Input,
  NewChatDialog,
  Sidebar,
  SkeletonStats,
  SkeletonTaskCard,
  useToast,
} from '@openflow/ui';
import type { CommandAction, RecentItem, StatusFilter } from '@openflow/ui';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { open } from '@tauri-apps/plugin-dialog';
import { Archive, FolderOpen, FolderPlus, Keyboard, Plus, Settings } from 'lucide-react';
import { useCallback, useState } from 'react';

export const Route = createFileRoute('/')({
  component: DashboardPage,
});

function DashboardPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const keyboardShortcutsDialog = useKeyboardShortcutsDialog();

  // UI state
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isMobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string | undefined>(undefined);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  // Dialog state
  const [isCreateProjectDialogOpen, setIsCreateProjectDialogOpen] = useState(false);
  const [isCreateTaskDialogOpen, setIsCreateTaskDialogOpen] = useState(false);
  const [isNewChatDialogOpen, setIsNewChatDialogOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectPath, setNewProjectPath] = useState('');
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDescription, setNewTaskDescription] = useState('');
  const [createError, setCreateError] = useState<string | null>(null);

  // Data fetching
  const { data: projects = [], isLoading: isLoadingProjects } = useProjects();
  const { data: tasks = [], isLoading: isLoadingTasks } = useTasks(selectedProjectId ?? '');
  const { data: standaloneChats = [] } = useStandaloneChats(selectedProjectId ?? '');
  const { data: executorProfiles = [] } = useExecutorProfiles();
  const updateTask = useUpdateTask();
  const createProject = useCreateProject();
  const createTask = useCreateTask();
  const createChat = useCreateChat();

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
    setCreateError(null);
    setNewTaskTitle('');
    setNewTaskDescription('');
    setIsCreateTaskDialogOpen(true);
  }, []);

  const handleNewProject = useCallback(() => {
    setCreateError(null);
    setNewProjectName('');
    setNewProjectPath('');
    setIsCreateProjectDialogOpen(true);
  }, []);

  const handleBrowseFolder = useCallback(async () => {
    try {
      const selected = await open({
        directory: true,
        multiple: false,
        title: 'Select Git Repository',
      });
      if (selected && typeof selected === 'string') {
        setNewProjectPath(selected);
        // Try to auto-fill project name from folder name if not set
        if (!newProjectName.trim()) {
          const folderName = selected.split('/').pop() || '';
          setNewProjectName(folderName);
        }
      }
    } catch (error) {
      console.error('Failed to open folder picker:', error);
      setCreateError('Failed to open folder picker. Please enter the path manually.');
    }
  }, [newProjectName]);

  const handleCloseCreateProjectDialog = useCallback(() => {
    setIsCreateProjectDialogOpen(false);
  }, []);

  const handleCloseCreateTaskDialog = useCallback(() => {
    setIsCreateTaskDialogOpen(false);
  }, []);

  const handleCreateProject = useCallback(() => {
    setCreateError(null);

    if (!newProjectName.trim()) {
      setCreateError('Project name is required');
      return;
    }

    if (!newProjectPath.trim()) {
      setCreateError('Git repository path is required');
      return;
    }

    const request: CreateProjectRequest = {
      name: newProjectName.trim(),
      gitRepoPath: newProjectPath.trim(),
    };

    createProject.mutate(request, {
      onSuccess: (project) => {
        setIsCreateProjectDialogOpen(false);
        setNewProjectName('');
        setNewProjectPath('');
        setSelectedProjectId(project.id);
        toast.success('Project created', `"${project.name}" has been created successfully.`);
      },
      onError: (error) => {
        setCreateError(error.message);
        toast.error('Failed to create project', error.message);
      },
    });
  }, [newProjectName, newProjectPath, createProject, toast]);

  const handleCreateTask = useCallback(() => {
    setCreateError(null);

    if (!activeProjectId) {
      setCreateError('Please select or create a project first');
      return;
    }

    if (!newTaskTitle.trim()) {
      setCreateError('Task title is required');
      return;
    }

    const request: CreateTaskRequest = {
      projectId: activeProjectId,
      title: newTaskTitle.trim(),
      description: newTaskDescription.trim() || undefined,
    };

    createTask.mutate(request, {
      onSuccess: (task) => {
        setIsCreateTaskDialogOpen(false);
        setNewTaskTitle('');
        setNewTaskDescription('');
        toast.success('Task created', `"${task.title}" has been created.`);

        // Auto-create an initial chat/step for the task
        const defaultExecutorProfile =
          executorProfiles.find((p) => p.isDefault) ?? executorProfiles[0];
        createChat.mutate(
          {
            taskId: task.id,
            projectId: task.projectId,
            title: 'Step 1',
            chatRole: ChatRole.Main,
            executorProfileId: defaultExecutorProfile?.id,
            initialPrompt: task.description || task.title,
            workflowStepIndex: 0,
          },
          {
            onSuccess: () => {
              navigate({ to: '/tasks/$taskId', params: { taskId: task.id } });
            },
            onError: () => {
              // Still navigate even if chat creation fails
              navigate({ to: '/tasks/$taskId', params: { taskId: task.id } });
            },
          }
        );
      },
      onError: (error) => {
        setCreateError(error.message);
        toast.error('Failed to create task', error.message);
      },
    });
  }, [
    activeProjectId,
    newTaskTitle,
    newTaskDescription,
    createTask,
    createChat,
    executorProfiles,
    navigate,
    toast,
  ]);

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
    setIsNewChatDialogOpen(true);
  }, []);

  const handleCloseNewChatDialog = useCallback(() => {
    setIsNewChatDialogOpen(false);
  }, []);

  const handleCreateChatFromDialog = useCallback(
    (data: { projectId: string; executorProfileId?: string; title?: string }) => {
      createChat.mutate(
        {
          projectId: data.projectId,
          title: data.title,
          chatRole: ChatRole.Main,
          executorProfileId: data.executorProfileId,
        },
        {
          onSuccess: (chat) => {
            setIsNewChatDialogOpen(false);
            toast.success('Chat created', 'New chat session started.');
            navigate({ to: '/chats/$chatId', params: { chatId: chat.id } });

            if (import.meta.env.DEV) {
              console.log('[Dashboard] Created standalone chat:', chat.id);
            }
          },
          onError: (error) => {
            toast.error('Failed to create chat', error.message);
          },
        }
      );
    },
    [createChat, navigate, toast]
  );

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
      shortcut: '⌘N',
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
      shortcut: '⌘,',
      onSelect: handleSettingsClick,
    },
    {
      id: 'keyboard-shortcuts',
      label: 'Keyboard Shortcuts',
      icon: Keyboard,
      shortcut: '⌘/',
      onSelect: () => {
        handleCloseCommandPalette();
        keyboardShortcutsDialog.open();
      },
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
    if (isLoadingTasks) return undefined; // Let skeleton handle loading
    const inProgressCount = tasks.filter((t) => t.status === 'inprogress').length;
    if (inProgressCount === 0) return `${tasks.length} tasks`;
    return `${inProgressCount} task${inProgressCount === 1 ? '' : 's'} in progress`;
  };

  // Close mobile drawer when navigating
  const handleMobileDrawerToggle = useCallback((open: boolean) => {
    setMobileDrawerOpen(open);
  }, []);

  // Close mobile drawer on navigation
  const handleSelectTaskWithDrawerClose = useCallback(
    (taskId: string) => {
      setMobileDrawerOpen(false);
      navigate({ to: '/tasks/$taskId', params: { taskId } });
    },
    [navigate]
  );

  const handleSelectChatWithDrawerClose = useCallback(
    (chatId: string) => {
      setMobileDrawerOpen(false);
      navigate({ to: '/chats/$chatId', params: { chatId } });
    },
    [navigate]
  );

  return (
    <AppLayout
      sidebarCollapsed={sidebarCollapsed}
      isMobileDrawerOpen={isMobileDrawerOpen}
      onMobileDrawerToggle={handleMobileDrawerToggle}
      sidebar={
        <Sidebar
          projects={projects}
          tasks={tasks}
          chats={standaloneChats}
          {...(activeProjectId ? { selectedProjectId: activeProjectId } : {})}
          statusFilter={statusFilter}
          onSelectProject={handleSelectProject}
          onSelectTask={handleSelectTaskWithDrawerClose}
          onSelectChat={handleSelectChatWithDrawerClose}
          onNewTask={handleNewTask}
          onNewChat={handleNewChat}
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
          <div className="flex-1 overflow-auto p-4 md:p-6">
            {/* Stats skeleton */}
            <SkeletonStats className="mb-6" />

            {/* Recent tasks skeleton */}
            <div className="rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--card))]">
              <div className="border-b border-[rgb(var(--border))] px-4 py-3">
                <div className="h-5 w-24 rounded bg-[rgb(var(--muted))] motion-safe:animate-pulse" />
              </div>
              <div className="p-4 space-y-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <SkeletonTaskCard key={`dashboard-skeleton-${i}`} />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Project overview when project is selected */}
        {activeProjectId && !isLoadingTasks && (
          <div className="flex-1 overflow-auto p-4 md:p-6">
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

      {/* Create project dialog */}
      <Dialog
        isOpen={isCreateProjectDialogOpen}
        onClose={handleCloseCreateProjectDialog}
        title="Create New Project"
      >
        <div className="space-y-4">
          <FormField
            label="Project Name"
            required
            {...(!newProjectName.trim() && createError ? { error: 'Required' } : {})}
          >
            <Input
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              placeholder="My Awesome Project"
              autoFocus
            />
          </FormField>

          <FormField
            label="Git Repository Path"
            required
            {...(!newProjectPath.trim() && createError ? { error: 'Required' } : {})}
          >
            <div className="flex gap-2">
              <Input
                value={newProjectPath}
                onChange={(e) => setNewProjectPath(e.target.value)}
                placeholder="/path/to/your/repo"
                className="flex-1"
              />
              <Button variant="secondary" onClick={handleBrowseFolder} type="button">
                <FolderOpen className="h-4 w-4" />
              </Button>
            </div>
          </FormField>

          {createError && <p className="text-sm text-error">{createError}</p>}

          <div className="flex justify-end gap-2 pt-4">
            <Button
              variant="ghost"
              onClick={handleCloseCreateProjectDialog}
              disabled={createProject.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleCreateProject}
              loading={createProject.isPending}
              loadingText="Creating..."
            >
              Create Project
            </Button>
          </div>
        </div>
      </Dialog>

      {/* Create task dialog */}
      <Dialog
        isOpen={isCreateTaskDialogOpen}
        onClose={handleCloseCreateTaskDialog}
        title="Create New Task"
      >
        <div className="space-y-4">
          <FormField
            label="Task Title"
            required
            {...(!newTaskTitle.trim() && createError ? { error: 'Required' } : {})}
          >
            <Input
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              placeholder="What needs to be done?"
              autoFocus
            />
          </FormField>

          <FormField label="Description">
            <Input
              value={newTaskDescription}
              onChange={(e) => setNewTaskDescription(e.target.value)}
              placeholder="Optional description..."
            />
          </FormField>

          {createError && <p className="text-sm text-error">{createError}</p>}

          <div className="flex justify-end gap-2 pt-4">
            <Button
              variant="ghost"
              onClick={handleCloseCreateTaskDialog}
              disabled={createTask.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleCreateTask}
              loading={createTask.isPending}
              loadingText="Creating..."
            >
              Create Task
            </Button>
          </div>
        </div>
      </Dialog>

      {/* New Chat dialog */}
      <NewChatDialog
        isOpen={isNewChatDialogOpen}
        onClose={handleCloseNewChatDialog}
        projects={projects}
        executorProfiles={executorProfiles}
        selectedProjectId={activeProjectId}
        isSubmitting={createChat.isPending}
        onCreate={handleCreateChatFromDialog}
        onNewProject={handleNewProject}
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
    default: 'border-border',
    info: 'border-info/30 bg-info/5',
    warning: 'border-warning/30 bg-warning/5',
    success: 'border-success/30 bg-success/5',
  };

  const valueStyles = {
    default: 'text-foreground',
    info: 'text-info',
    warning: 'text-warning',
    success: 'text-success',
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
    todo: 'bg-status-todo/20 text-status-todo',
    inprogress: 'bg-status-inprogress/20 text-status-inprogress',
    inreview: 'bg-status-inreview/20 text-status-inreview',
    done: 'bg-status-done/20 text-status-done',
    cancelled: 'bg-status-cancelled/20 text-status-cancelled',
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
