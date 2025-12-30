/**
 * Archive Page Route
 *
 * Displays all archived tasks and chats with options to:
 * - View archived entity details
 * - Restore entities back to active status
 * - Permanently delete entities
 *
 * Follows the orchestration pattern: connects hooks to UI components.
 * Keeps page logic minimal (<200 lines) by delegating to UI components.
 */

import type { Chat, Project, Task } from '@openflow/generated';
import {
  useArchivedChats,
  useArchivedProjects,
  useArchivedTasks,
  useConfirmDialog,
  useDeleteChat,
  useDeleteProject,
  useDeleteTask,
  useKeyboardShortcuts,
  useProjects,
  useRestoreTask,
  useTasks,
  useUnarchiveChat,
  useUnarchiveProject,
} from '@openflow/hooks';
import { AppLayout, ConfirmDialog, EmptyState, Header, SkeletonArchiveList } from '@openflow/ui';
import { cn } from '@openflow/utils';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { Archive, ArrowLeft, Folder, MessageSquare, RotateCcw, Trash2 } from 'lucide-react';
import { useCallback, useState } from 'react';

type ArchiveTab = 'tasks' | 'chats' | 'projects';

export const Route = createFileRoute('/archive')({
  component: ArchivePage,
});

function ArchivePage() {
  const navigate = useNavigate();

  // UI state
  const [activeTab, setActiveTab] = useState<ArchiveTab>('tasks');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  // Confirm dialog
  const { dialogProps, confirm } = useConfirmDialog();

  // Data fetching
  const { data: archivedTasks = [], isLoading: isLoadingTasks } = useArchivedTasks();
  const { data: archivedChats = [], isLoading: isLoadingChats } = useArchivedChats();
  const { data: archivedProjects = [], isLoading: isLoadingProjects } = useArchivedProjects();
  const { data: projects = [] } = useProjects();
  const { data: tasks = [] } = useTasks(projects[0]?.id ?? '');

  // Mutations
  const restoreTask = useRestoreTask();
  const deleteTask = useDeleteTask();
  const unarchiveChat = useUnarchiveChat();
  const deleteChat = useDeleteChat();
  const unarchiveProject = useUnarchiveProject();
  const deleteProject = useDeleteProject();

  // Keyboard shortcuts
  useKeyboardShortcuts([
    {
      key: 'Escape',
      action: () => {
        setSelectedTask(null);
        setSelectedChat(null);
        setSelectedProject(null);
      },
    },
  ]);

  // Get project name by ID
  const getProjectName = useCallback(
    (projectId: string) => {
      const project = projects.find((p) => p.id === projectId);
      return project?.name ?? 'Unknown Project';
    },
    [projects]
  );

  // Get task title by ID
  const getTaskTitle = useCallback(
    (taskId: string | null | undefined) => {
      if (!taskId) return null;
      const task = tasks.find((t) => t.id === taskId);
      return task?.title ?? 'Unknown Task';
    },
    [tasks]
  );

  // Callbacks
  const handleBack = useCallback(() => {
    navigate({ to: '/' });
  }, [navigate]);

  const handleSelectTask = useCallback((task: Task) => {
    setSelectedTask(task);
  }, []);

  const handleSelectChat = useCallback((chat: Chat) => {
    setSelectedChat(chat);
  }, []);

  const handleRestoreTask = useCallback(
    (task: Task) => {
      restoreTask.mutate(
        { id: task.id },
        {
          onSuccess: () => {
            setSelectedTask(null);
          },
        }
      );
    },
    [restoreTask]
  );

  const handleRestoreChat = useCallback(
    (chat: Chat) => {
      unarchiveChat.mutate(chat.id, {
        onSuccess: () => {
          setSelectedChat(null);
        },
      });
    },
    [unarchiveChat]
  );

  const handleDeleteTaskClick = useCallback(
    (task: Task) => {
      confirm({
        title: 'Delete Task Permanently',
        description: `Are you sure you want to permanently delete "${task.title}"? This action cannot be undone.`,
        confirmLabel: 'Delete',
        variant: 'destructive',
        onConfirm: async () => {
          await deleteTask.mutateAsync(task.id);
          setSelectedTask(null);
        },
      });
    },
    [confirm, deleteTask]
  );

  const handleDeleteChatClick = useCallback(
    (chat: Chat) => {
      confirm({
        title: 'Delete Chat Permanently',
        description: `Are you sure you want to permanently delete "${chat.title || 'Untitled Chat'}"? This action cannot be undone.`,
        confirmLabel: 'Delete',
        variant: 'destructive',
        onConfirm: async () => {
          await deleteChat.mutateAsync({
            id: chat.id,
            projectId: chat.projectId,
            taskId: chat.taskId ?? undefined,
          });
          setSelectedChat(null);
        },
      });
    },
    [confirm, deleteChat]
  );

  const handleSelectProject = useCallback((project: Project) => {
    setSelectedProject(project);
  }, []);

  const handleRestoreProject = useCallback(
    (project: Project) => {
      unarchiveProject.mutate(project.id, {
        onSuccess: () => {
          setSelectedProject(null);
        },
      });
    },
    [unarchiveProject]
  );

  const handleDeleteProjectClick = useCallback(
    (project: Project) => {
      confirm({
        title: 'Delete Project Permanently',
        description: `Are you sure you want to permanently delete "${project.name}"? This will delete all tasks, chats, and messages. This action cannot be undone.`,
        confirmLabel: 'Delete',
        variant: 'destructive',
        onConfirm: async () => {
          await deleteProject.mutateAsync(project.id);
          setSelectedProject(null);
        },
      });
    },
    [confirm, deleteProject]
  );

  const handleSearch = useCallback(() => {
    // TODO: Open command palette for search
    console.log('Search clicked');
  }, []);

  const isLoading =
    activeTab === 'tasks'
      ? isLoadingTasks
      : activeTab === 'chats'
        ? isLoadingChats
        : isLoadingProjects;
  const archivedCount =
    activeTab === 'tasks'
      ? archivedTasks.length
      : activeTab === 'chats'
        ? archivedChats.length
        : archivedProjects.length;

  // Format date for display
  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'Unknown date';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <AppLayout
      sidebarCollapsed={true}
      sidebar={null}
      header={
        <Header
          title="Archive"
          subtitle={`${archivedCount} archived ${activeTab === 'tasks' ? 'task' : activeTab === 'chats' ? 'chat' : 'project'}${archivedCount === 1 ? '' : 's'}`}
          onSearch={handleSearch}
        />
      }
    >
      <div className="flex h-full flex-col">
        {/* Back button and tabs */}
        <div className="border-b border-[rgb(var(--border))] px-4 py-3 md:px-6">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={handleBack}
              className="inline-flex items-center gap-2 text-sm text-[rgb(var(--muted-foreground))] hover:text-[rgb(var(--foreground))] transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </button>

            {/* Tabs */}
            <div className="flex gap-1 rounded-lg bg-[rgb(var(--muted))] p-1">
              <button
                type="button"
                onClick={() => setActiveTab('tasks')}
                className={cn(
                  'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                  activeTab === 'tasks'
                    ? 'bg-[rgb(var(--background))] text-[rgb(var(--foreground))] shadow-sm'
                    : 'text-[rgb(var(--muted-foreground))] hover:text-[rgb(var(--foreground))]'
                )}
              >
                Tasks ({archivedTasks.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('chats')}
                className={cn(
                  'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                  activeTab === 'chats'
                    ? 'bg-[rgb(var(--background))] text-[rgb(var(--foreground))] shadow-sm'
                    : 'text-[rgb(var(--muted-foreground))] hover:text-[rgb(var(--foreground))]'
                )}
              >
                Chats ({archivedChats.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('projects')}
                className={cn(
                  'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                  activeTab === 'projects'
                    ? 'bg-[rgb(var(--background))] text-[rgb(var(--foreground))] shadow-sm'
                    : 'text-[rgb(var(--muted-foreground))] hover:text-[rgb(var(--foreground))]'
                )}
              >
                Projects ({archivedProjects.length})
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-4 md:p-6">
          {isLoading ? (
            <SkeletonArchiveList />
          ) : activeTab === 'tasks' ? (
            /* Tasks List */
            archivedTasks.length === 0 ? (
              <EmptyState
                icon={Archive}
                title="No archived tasks"
                description="Tasks you archive will appear here."
                size="lg"
                className="h-full"
              />
            ) : (
              <div className="space-y-2">
                {archivedTasks.map((task) => (
                  <div
                    key={task.id}
                    className={`group flex items-center justify-between rounded-lg border p-4 transition-colors ${
                      selectedTask?.id === task.id
                        ? 'border-[rgb(var(--primary))] bg-[rgb(var(--primary))]/5'
                        : 'border-[rgb(var(--border))] bg-[rgb(var(--card))] hover:bg-[rgb(var(--muted))]'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => handleSelectTask(task)}
                      className="flex flex-1 flex-col items-start gap-1 text-left"
                    >
                      <span className="font-medium text-[rgb(var(--foreground))]">
                        {task.title}
                      </span>
                      <div className="flex items-center gap-2 text-xs text-[rgb(var(--muted-foreground))]">
                        <span>{getProjectName(task.projectId)}</span>
                        <span>-</span>
                        <span>Archived {formatDate(task.archivedAt)}</span>
                      </div>
                    </button>

                    {/* Action buttons */}
                    <div className="flex items-center gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                      <button
                        type="button"
                        onClick={() => handleRestoreTask(task)}
                        disabled={restoreTask.isPending}
                        className="inline-flex items-center gap-1.5 rounded-md bg-[rgb(var(--primary))] px-3 py-1.5 text-xs font-medium text-[rgb(var(--primary-foreground))] hover:bg-[rgb(var(--primary))]/90 disabled:opacity-50"
                        title="Restore task"
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                        Restore
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteTaskClick(task)}
                        className="inline-flex items-center gap-1.5 rounded-md bg-error/10 px-3 py-1.5 text-xs font-medium text-error hover:bg-error/20"
                        title="Delete permanently"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : activeTab === 'chats' ? (
            /* Chats List */
            archivedChats.length === 0 ? (
              <EmptyState
                icon={MessageSquare}
                title="No archived chats"
                description="Chats you archive will appear here."
                size="lg"
                className="h-full"
              />
            ) : (
              <div className="space-y-2">
                {archivedChats.map((chat) => (
                  <div
                    key={chat.id}
                    className={`group flex items-center justify-between rounded-lg border p-4 transition-colors ${
                      selectedChat?.id === chat.id
                        ? 'border-[rgb(var(--primary))] bg-[rgb(var(--primary))]/5'
                        : 'border-[rgb(var(--border))] bg-[rgb(var(--card))] hover:bg-[rgb(var(--muted))]'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => handleSelectChat(chat)}
                      className="flex flex-1 flex-col items-start gap-1 text-left"
                    >
                      <span className="font-medium text-[rgb(var(--foreground))]">
                        {chat.title || 'Untitled Chat'}
                      </span>
                      <div className="flex items-center gap-2 text-xs text-[rgb(var(--muted-foreground))]">
                        <span>{getProjectName(chat.projectId)}</span>
                        {chat.taskId && (
                          <>
                            <span>-</span>
                            <span>{getTaskTitle(chat.taskId)}</span>
                          </>
                        )}
                        <span>-</span>
                        <span>Archived {formatDate(chat.archivedAt)}</span>
                      </div>
                    </button>

                    {/* Action buttons */}
                    <div className="flex items-center gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                      <button
                        type="button"
                        onClick={() => handleRestoreChat(chat)}
                        disabled={unarchiveChat.isPending}
                        className="inline-flex items-center gap-1.5 rounded-md bg-[rgb(var(--primary))] px-3 py-1.5 text-xs font-medium text-[rgb(var(--primary-foreground))] hover:bg-[rgb(var(--primary))]/90 disabled:opacity-50"
                        title="Restore chat"
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                        Restore
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteChatClick(chat)}
                        className="inline-flex items-center gap-1.5 rounded-md bg-error/10 px-3 py-1.5 text-xs font-medium text-error hover:bg-error/20"
                        title="Delete permanently"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : /* Projects List */
          archivedProjects.length === 0 ? (
            <EmptyState
              icon={Folder}
              title="No archived projects"
              description="Projects you archive will appear here."
              size="lg"
              className="h-full"
            />
          ) : (
            <div className="space-y-2">
              {archivedProjects.map((project) => (
                <div
                  key={project.id}
                  className={`group flex items-center justify-between rounded-lg border p-4 transition-colors ${
                    selectedProject?.id === project.id
                      ? 'border-[rgb(var(--primary))] bg-[rgb(var(--primary))]/5'
                      : 'border-[rgb(var(--border))] bg-[rgb(var(--card))] hover:bg-[rgb(var(--muted))]'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => handleSelectProject(project)}
                    className="flex flex-1 flex-col items-start gap-1 text-left"
                  >
                    <span className="font-medium text-[rgb(var(--foreground))]">
                      {project.name}
                    </span>
                    <div className="flex items-center gap-2 text-xs text-[rgb(var(--muted-foreground))]">
                      <span className="truncate max-w-[200px]">{project.gitRepoPath}</span>
                      <span>-</span>
                      <span>Archived {formatDate(project.archivedAt)}</span>
                    </div>
                  </button>

                  {/* Action buttons */}
                  <div className="flex items-center gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                    <button
                      type="button"
                      onClick={() => handleRestoreProject(project)}
                      disabled={unarchiveProject.isPending}
                      className="inline-flex items-center gap-1.5 rounded-md bg-[rgb(var(--primary))] px-3 py-1.5 text-xs font-medium text-[rgb(var(--primary-foreground))] hover:bg-[rgb(var(--primary))]/90 disabled:opacity-50"
                      title="Restore project"
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                      Restore
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteProjectClick(project)}
                      className="inline-flex items-center gap-1.5 rounded-md bg-error/10 px-3 py-1.5 text-xs font-medium text-error hover:bg-error/20"
                      title="Delete permanently"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Confirm delete dialog */}
      <ConfirmDialog {...dialogProps} />
    </AppLayout>
  );
}
