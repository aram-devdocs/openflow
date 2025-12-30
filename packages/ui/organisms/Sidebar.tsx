import type { Chat, Project, Task, TaskStatus } from '@openflow/generated';
import { cn } from '@openflow/utils';
import {
  Archive,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  ListFilter,
  MessageSquare,
  Plus,
  Settings,
} from 'lucide-react';
import { useState } from 'react';
import { Button } from '../atoms/Button';
import { Icon } from '../atoms/Icon';
import { EmptyState } from '../molecules/EmptyState';
import { ProjectSelector } from './ProjectSelector';
import { TaskCard } from './TaskCard';

/** Status filter options for the task list */
export type StatusFilter = TaskStatus | 'all';

export interface SidebarProps {
  /** Array of projects for the project selector */
  projects: Project[];
  /** Array of tasks to display in the sidebar */
  tasks: Task[];
  /** Array of standalone chats to display in the sidebar */
  chats?: Chat[];
  /** Currently selected project ID */
  selectedProjectId?: string;
  /** Currently selected task ID */
  selectedTaskId?: string;
  /** Currently selected chat ID */
  selectedChatId?: string;
  /** Current status filter */
  statusFilter?: StatusFilter;
  /** Callback when a project is selected */
  onSelectProject?: (projectId: string) => void;
  /** Callback when a task is selected */
  onSelectTask?: (taskId: string) => void;
  /** Callback when a chat is selected */
  onSelectChat?: (chatId: string) => void;
  /** Callback when the "New Task" button is clicked */
  onNewTask?: () => void;
  /** Callback when the "New Chat" button is clicked */
  onNewChat?: () => void;
  /** Callback when the "New Project" button is clicked */
  onNewProject?: () => void;
  /** Callback when the status filter is changed */
  onStatusFilter?: (status: StatusFilter) => void;
  /** Callback when task status is changed */
  onTaskStatusChange?: (taskId: string, status: TaskStatus) => void;
  /** Callback when Settings link is clicked */
  onSettingsClick?: () => void;
  /** Callback when Archive link is clicked */
  onArchiveClick?: () => void;
  /** Whether the sidebar is collapsed */
  isCollapsed?: boolean;
  /** Callback when sidebar collapse state is toggled */
  onToggleCollapse?: () => void;
  /** Additional CSS classes */
  className?: string;
}

/** Available status filter options */
const STATUS_FILTER_OPTIONS: readonly { value: StatusFilter; label: string }[] = [
  { value: 'all' as const, label: 'All Tasks' },
  { value: 'todo' as StatusFilter, label: 'To Do' },
  { value: 'inprogress' as StatusFilter, label: 'In Progress' },
  { value: 'inreview' as StatusFilter, label: 'In Review' },
  { value: 'done' as StatusFilter, label: 'Done' },
  { value: 'cancelled' as StatusFilter, label: 'Cancelled' },
] as const;

/**
 * Filters tasks by status.
 */
function filterTasksByStatus(tasks: Task[], filter: StatusFilter): Task[] {
  if (filter === 'all') {
    return tasks;
  }
  return tasks.filter((task) => task.status === filter);
}

/**
 * Status filter button component.
 */
function StatusFilterButton({
  filter,
  currentFilter,
  count,
  onClick,
}: {
  filter: StatusFilter;
  currentFilter: StatusFilter;
  count: number;
  onClick: () => void;
}) {
  const isActive = filter === currentFilter;
  const option = STATUS_FILTER_OPTIONS.find((opt) => opt.value === filter);

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex items-center justify-between gap-2 rounded-md px-2 py-1.5 text-sm',
        'transition-colors duration-150',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--ring))] focus-visible:ring-offset-2 focus-visible:ring-offset-[rgb(var(--background))]',
        isActive
          ? 'bg-[rgb(var(--accent))] text-[rgb(var(--accent-foreground))]'
          : 'text-[rgb(var(--muted-foreground))] hover:bg-[rgb(var(--muted))] hover:text-[rgb(var(--foreground))]'
      )}
    >
      <span className="truncate">{option?.label ?? filter}</span>
      <span
        className={cn(
          'rounded-full px-1.5 py-0.5 text-xs',
          isActive
            ? 'bg-[rgb(var(--background))] text-[rgb(var(--foreground))]'
            : 'bg-[rgb(var(--muted))] text-[rgb(var(--muted-foreground))]'
        )}
      >
        {count}
      </span>
    </button>
  );
}

/**
 * Collapsed sidebar showing only icons.
 */
function CollapsedSidebar({
  onToggleCollapse,
  onNewTask,
  onNewChat,
  onSettingsClick,
  onArchiveClick,
  className,
}: {
  onToggleCollapse?: (() => void) | undefined;
  onNewTask?: (() => void) | undefined;
  onNewChat?: (() => void) | undefined;
  onSettingsClick?: (() => void) | undefined;
  onArchiveClick?: (() => void) | undefined;
  className?: string | undefined;
}) {
  return (
    <aside
      className={cn(
        'flex w-14 flex-col border-r border-[rgb(var(--border))] bg-[rgb(var(--background))]',
        className
      )}
    >
      {/* Expand button */}
      <div className="flex h-14 items-center justify-center border-b border-[rgb(var(--border))]">
        <button
          type="button"
          onClick={onToggleCollapse}
          className={cn(
            'rounded-md p-2 text-[rgb(var(--muted-foreground))]',
            'hover:bg-[rgb(var(--muted))] hover:text-[rgb(var(--foreground))]',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--ring))]'
          )}
          aria-label="Expand sidebar"
        >
          <Icon icon={ChevronRight} size="sm" />
        </button>
      </div>

      {/* Action buttons */}
      <div className="flex flex-1 flex-col items-center gap-2 p-2">
        {/* New task button */}
        <button
          type="button"
          onClick={onNewTask}
          className={cn(
            'rounded-md p-2 text-[rgb(var(--primary))]',
            'hover:bg-[rgb(var(--muted))]',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--ring))]'
          )}
          aria-label="Create new task"
        >
          <Icon icon={Plus} size="sm" />
        </button>
        {/* New chat button */}
        <button
          type="button"
          onClick={onNewChat}
          className={cn(
            'rounded-md p-2 text-[rgb(var(--muted-foreground))]',
            'hover:bg-[rgb(var(--muted))] hover:text-[rgb(var(--foreground))]',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--ring))]'
          )}
          aria-label="Create new chat"
        >
          <Icon icon={MessageSquare} size="sm" />
        </button>
      </div>

      {/* Footer actions */}
      <div className="flex flex-col items-center gap-2 border-t border-[rgb(var(--border))] p-2">
        <button
          type="button"
          onClick={onArchiveClick}
          className={cn(
            'rounded-md p-2 text-[rgb(var(--muted-foreground))]',
            'hover:bg-[rgb(var(--muted))] hover:text-[rgb(var(--foreground))]',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--ring))]'
          )}
          aria-label="View archive"
        >
          <Icon icon={Archive} size="sm" />
        </button>
        <button
          type="button"
          onClick={onSettingsClick}
          className={cn(
            'rounded-md p-2 text-[rgb(var(--muted-foreground))]',
            'hover:bg-[rgb(var(--muted))] hover:text-[rgb(var(--foreground))]',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--ring))]'
          )}
          aria-label="Open settings"
        >
          <Icon icon={Settings} size="sm" />
        </button>
      </div>
    </aside>
  );
}

/**
 * Sidebar component for navigation.
 * Stateless - receives all data via props, emits actions via callbacks.
 *
 * Features:
 * - Project selector for switching between projects
 * - New task button for quick task creation
 * - Status filter for filtering tasks by status
 * - Task list showing tasks for the selected project
 * - Settings and Archive navigation links
 * - Collapsible to save screen space
 *
 * @example
 * <Sidebar
 *   projects={projects}
 *   tasks={tasks}
 *   selectedProjectId={currentProjectId}
 *   selectedTaskId={currentTaskId}
 *   statusFilter="all"
 *   onSelectProject={(id) => setCurrentProjectId(id)}
 *   onSelectTask={(id) => navigate(`/tasks/${id}`)}
 *   onNewTask={() => openNewTaskDialog()}
 *   onNewProject={() => openNewProjectDialog()}
 *   onStatusFilter={(status) => setStatusFilter(status)}
 *   onSettingsClick={() => navigate('/settings')}
 *   onArchiveClick={() => navigate('/archive')}
 *   isCollapsed={sidebarCollapsed}
 *   onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
 * />
 */
export function Sidebar({
  projects,
  tasks,
  chats = [],
  selectedProjectId,
  selectedTaskId,
  selectedChatId,
  statusFilter = 'all',
  onSelectProject,
  onSelectTask,
  onSelectChat,
  onNewTask,
  onNewChat,
  onNewProject,
  onStatusFilter,
  onTaskStatusChange,
  onSettingsClick,
  onArchiveClick,
  isCollapsed = false,
  onToggleCollapse,
  className,
}: SidebarProps) {
  // Local state for collapsible sections
  const [isChatsExpanded, setIsChatsExpanded] = useState(true);

  // Render collapsed sidebar if collapsed
  if (isCollapsed) {
    return (
      <CollapsedSidebar
        onToggleCollapse={onToggleCollapse}
        onNewTask={onNewTask}
        onNewChat={onNewChat}
        onSettingsClick={onSettingsClick}
        onArchiveClick={onArchiveClick}
        className={className}
      />
    );
  }

  // Filter tasks by current status filter
  const filteredTasks = filterTasksByStatus(tasks, statusFilter);

  // Count tasks per status for filter display
  const taskCounts: Record<StatusFilter, number> = {
    all: tasks.length,
    todo: tasks.filter((t) => t.status === 'todo').length,
    inprogress: tasks.filter((t) => t.status === 'inprogress').length,
    inreview: tasks.filter((t) => t.status === 'inreview').length,
    done: tasks.filter((t) => t.status === 'done').length,
    cancelled: tasks.filter((t) => t.status === 'cancelled').length,
  };

  return (
    <aside
      className={cn(
        'flex w-72 flex-col border-r border-[rgb(var(--border))] bg-[rgb(var(--background))]',
        className
      )}
    >
      {/* Header: Project selector and collapse button */}
      <div className="flex items-center gap-2 border-b border-[rgb(var(--border))] p-3">
        <ProjectSelector
          projects={projects}
          {...(selectedProjectId && { selectedProjectId })}
          {...(onSelectProject && { onSelectProject })}
          {...(onNewProject && { onNewProject })}
          className="flex-1"
        />
        <button
          type="button"
          onClick={onToggleCollapse}
          className={cn(
            'shrink-0 rounded-md p-2 text-[rgb(var(--muted-foreground))]',
            'hover:bg-[rgb(var(--muted))] hover:text-[rgb(var(--foreground))]',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--ring))]'
          )}
          aria-label="Collapse sidebar"
        >
          <Icon icon={ChevronLeft} size="sm" />
        </button>
      </div>

      {/* New task button */}
      <div className="p-3">
        <Button variant="primary" size="sm" onClick={onNewTask} className="w-full">
          <Icon icon={Plus} size="sm" />
          New Task
        </Button>
      </div>

      {/* Status filter */}
      <div className="border-b border-[rgb(var(--border))] px-3 pb-3">
        <div className="mb-2 flex items-center gap-2 text-xs font-medium text-[rgb(var(--muted-foreground))]">
          <Icon icon={ListFilter} size="xs" />
          <span>Filter by Status</span>
        </div>
        <div className="flex flex-col gap-0.5">
          {STATUS_FILTER_OPTIONS.map((option) => (
            <StatusFilterButton
              key={option.value}
              filter={option.value}
              currentFilter={statusFilter}
              count={taskCounts[option.value]}
              onClick={() => onStatusFilter?.(option.value)}
            />
          ))}
        </div>
      </div>

      {/* Scrollable content: Tasks and Chats */}
      <div className="flex-1 overflow-y-auto">
        {/* Task list */}
        <div className="p-3">
          {filteredTasks.length > 0 ? (
            <div className="flex flex-col gap-2">
              {filteredTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  isSelected={selectedTaskId === task.id}
                  {...(onSelectTask && { onSelect: onSelectTask })}
                  {...(onTaskStatusChange && { onStatusChange: onTaskStatusChange })}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={ClipboardList}
              title={
                tasks.length === 0
                  ? 'No tasks yet'
                  : `No ${statusFilter === 'all' ? '' : statusFilter} tasks`
              }
              description={tasks.length === 0 ? 'Create a new task to get started' : undefined}
              size="sm"
            />
          )}
        </div>

        {/* Chats section */}
        <div className="border-t border-[rgb(var(--border))] p-3">
          {/* Collapsible header */}
          <button
            type="button"
            onClick={() => setIsChatsExpanded(!isChatsExpanded)}
            className={cn(
              'mb-2 flex w-full items-center gap-2 rounded-md text-xs font-medium',
              'text-[rgb(var(--muted-foreground))]',
              'hover:text-[rgb(var(--foreground))]',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--ring))] focus-visible:ring-offset-2 focus-visible:ring-offset-[rgb(var(--background))]'
            )}
          >
            <Icon
              icon={ChevronDown}
              size="xs"
              className={cn('transition-transform', !isChatsExpanded && '-rotate-90')}
            />
            <Icon icon={MessageSquare} size="xs" />
            <span>Chats</span>
            <span className="ml-auto rounded-full bg-[rgb(var(--muted))] px-1.5 py-0.5 text-xs">
              {chats.length}
            </span>
          </button>

          {/* Chat list */}
          {isChatsExpanded && (
            <div className="flex flex-col gap-1">
              {chats.length > 0 ? (
                chats.map((chat) => (
                  <button
                    key={chat.id}
                    type="button"
                    onClick={() => onSelectChat?.(chat.id)}
                    className={cn(
                      'flex items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm',
                      'transition-colors duration-150',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--ring))] focus-visible:ring-offset-2 focus-visible:ring-offset-[rgb(var(--background))]',
                      selectedChatId === chat.id
                        ? 'bg-[rgb(var(--accent))] text-[rgb(var(--accent-foreground))]'
                        : 'text-[rgb(var(--muted-foreground))] hover:bg-[rgb(var(--muted))] hover:text-[rgb(var(--foreground))]'
                    )}
                  >
                    <Icon icon={MessageSquare} size="xs" className="shrink-0" />
                    <span className="truncate">{chat.title ?? 'Untitled Chat'}</span>
                  </button>
                ))
              ) : (
                <EmptyState icon={MessageSquare} title="No chats yet" size="sm" />
              )}
              {/* New chat button */}
              <button
                type="button"
                onClick={onNewChat}
                className={cn(
                  'flex items-center gap-2 rounded-md px-2 py-1.5 text-sm',
                  'text-[rgb(var(--primary))]',
                  'hover:bg-[rgb(var(--muted))]',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--ring))] focus-visible:ring-offset-2 focus-visible:ring-offset-[rgb(var(--background))]'
                )}
              >
                <Icon icon={Plus} size="xs" />
                <span>New Chat</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Footer: Settings and Archive links */}
      <div className="flex items-center justify-between border-t border-[rgb(var(--border))] p-3">
        <button
          type="button"
          onClick={onArchiveClick}
          className={cn(
            'flex items-center gap-2 rounded-md px-2 py-1.5 text-sm',
            'text-[rgb(var(--muted-foreground))]',
            'hover:bg-[rgb(var(--muted))] hover:text-[rgb(var(--foreground))]',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--ring))]'
          )}
        >
          <Icon icon={Archive} size="sm" />
          <span>Archive</span>
        </button>
        <button
          type="button"
          onClick={onSettingsClick}
          className={cn(
            'flex items-center gap-2 rounded-md px-2 py-1.5 text-sm',
            'text-[rgb(var(--muted-foreground))]',
            'hover:bg-[rgb(var(--muted))] hover:text-[rgb(var(--foreground))]',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--ring))]'
          )}
        >
          <Icon icon={Settings} size="sm" />
          <span>Settings</span>
        </button>
      </div>
    </aside>
  );
}

Sidebar.displayName = 'Sidebar';
