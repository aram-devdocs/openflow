/**
 * ArchivePageComponents - UI components for the Archive page
 *
 * These components are purely presentational and receive all data and callbacks
 * as props from the useArchiveSession hook.
 */

import type { Chat, Project, Task } from '@openflow/generated';
import { cn } from '@openflow/utils';
import { Archive, ArrowLeft, Folder, MessageSquare, RotateCcw, Trash2 } from 'lucide-react';
import { EmptyState } from '../molecules/EmptyState';
import { SkeletonArchiveList } from '../molecules/SkeletonArchiveList';
import { AppLayout } from '../templates/AppLayout';
import { Header } from './Header';

// ============================================================================
// Types
// ============================================================================

export type ArchiveTab = 'tasks' | 'chats' | 'projects';

export interface ArchiveLayoutProps {
  /** Page header element */
  header: React.ReactNode;
  /** Page content */
  children: React.ReactNode;
}

export interface ArchiveHeaderProps {
  /** Count of items in the active tab */
  archivedCount: number;
  /** Currently active tab */
  activeTab: ArchiveTab;
  /** Search handler */
  onSearch: () => void;
}

export interface ArchiveTabBarProps {
  /** Currently active tab */
  activeTab: ArchiveTab;
  /** Tab change handler */
  onTabChange: (tab: ArchiveTab) => void;
  /** Counts per tab */
  taskCount: number;
  chatCount: number;
  projectCount: number;
  /** Back button handler */
  onBack: () => void;
}

export interface ArchivedTaskItemProps {
  task: Task;
  isSelected: boolean;
  isRestoring: boolean;
  projectName: string;
  archivedDate: string;
  onSelect: () => void;
  onRestore: () => void;
  onDelete: () => void;
}

export interface ArchivedChatItemProps {
  chat: Chat;
  isSelected: boolean;
  isRestoring: boolean;
  projectName: string;
  taskTitle: string | null;
  archivedDate: string;
  onSelect: () => void;
  onRestore: () => void;
  onDelete: () => void;
}

export interface ArchivedProjectItemProps {
  project: Project;
  isSelected: boolean;
  isRestoring: boolean;
  archivedDate: string;
  onSelect: () => void;
  onRestore: () => void;
  onDelete: () => void;
}

export interface ArchiveContentProps {
  activeTab: ArchiveTab;
  isLoading: boolean;
  // Tasks
  archivedTasks: Task[];
  selectedTask: Task | null;
  isRestoringTask: boolean;
  // Chats
  archivedChats: Chat[];
  selectedChat: Chat | null;
  isRestoringChat: boolean;
  // Projects
  archivedProjects: Project[];
  selectedProject: Project | null;
  isRestoringProject: boolean;
  // Helpers
  getProjectName: (projectId: string) => string;
  getTaskTitle: (taskId: string | null | undefined) => string | null;
  formatDate: (dateString: string | null | undefined) => string;
  // Handlers
  onSelectTask: (task: Task) => void;
  onSelectChat: (chat: Chat) => void;
  onSelectProject: (project: Project) => void;
  onRestoreTask: (task: Task) => void;
  onRestoreChat: (chat: Chat) => void;
  onRestoreProject: (project: Project) => void;
  onDeleteTask: (task: Task) => void;
  onDeleteChat: (chat: Chat) => void;
  onDeleteProject: (project: Project) => void;
}

// ============================================================================
// Components
// ============================================================================

/**
 * Layout wrapper for the archive page
 */
export function ArchiveLayout({ header, children }: ArchiveLayoutProps) {
  return (
    <AppLayout sidebarCollapsed={true} sidebar={null} header={header}>
      <div className="flex h-full flex-col">{children}</div>
    </AppLayout>
  );
}

/**
 * Header for the archive page
 */
export function ArchiveHeader({ archivedCount, activeTab, onSearch }: ArchiveHeaderProps) {
  const entityName = activeTab === 'tasks' ? 'task' : activeTab === 'chats' ? 'chat' : 'project';
  const subtitle = `${archivedCount} archived ${entityName}${archivedCount === 1 ? '' : 's'}`;

  return <Header title="Archive" subtitle={subtitle} onSearch={onSearch} />;
}

/**
 * Tab bar with back button and tab selection
 */
export function ArchiveTabBar({
  activeTab,
  onTabChange,
  taskCount,
  chatCount,
  projectCount,
  onBack,
}: ArchiveTabBarProps) {
  return (
    <div className="border-b border-[rgb(var(--border))] px-4 py-3 md:px-6">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 text-sm text-[rgb(var(--muted-foreground))] hover:text-[rgb(var(--foreground))] transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </button>

        <div className="flex gap-1 rounded-lg bg-[rgb(var(--muted))] p-1">
          <TabButton
            active={activeTab === 'tasks'}
            onClick={() => onTabChange('tasks')}
            label="Tasks"
            count={taskCount}
          />
          <TabButton
            active={activeTab === 'chats'}
            onClick={() => onTabChange('chats')}
            label="Chats"
            count={chatCount}
          />
          <TabButton
            active={activeTab === 'projects'}
            onClick={() => onTabChange('projects')}
            label="Projects"
            count={projectCount}
          />
        </div>
      </div>
    </div>
  );
}

interface TabButtonProps {
  active: boolean;
  onClick: () => void;
  label: string;
  count: number;
}

function TabButton({ active, onClick, label, count }: TabButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
        active
          ? 'bg-[rgb(var(--background))] text-[rgb(var(--foreground))] shadow-sm'
          : 'text-[rgb(var(--muted-foreground))] hover:text-[rgb(var(--foreground))]'
      )}
    >
      {label} ({count})
    </button>
  );
}

/**
 * A single archived task item in the list
 */
export function ArchivedTaskItem({
  task,
  isSelected,
  isRestoring,
  projectName,
  archivedDate,
  onSelect,
  onRestore,
  onDelete,
}: ArchivedTaskItemProps) {
  return (
    <div
      className={cn(
        'group flex items-center justify-between rounded-lg border p-4 transition-colors',
        isSelected
          ? 'border-[rgb(var(--primary))] bg-[rgb(var(--primary))]/5'
          : 'border-[rgb(var(--border))] bg-[rgb(var(--card))] hover:bg-[rgb(var(--muted))]'
      )}
    >
      <button
        type="button"
        onClick={onSelect}
        className="flex flex-1 flex-col items-start gap-1 text-left"
      >
        <span className="font-medium text-[rgb(var(--foreground))]">{task.title}</span>
        <div className="flex items-center gap-2 text-xs text-[rgb(var(--muted-foreground))]">
          <span>{projectName}</span>
          <span>-</span>
          <span>Archived {archivedDate}</span>
        </div>
      </button>

      <ActionButtons
        isRestoring={isRestoring}
        onRestore={onRestore}
        onDelete={onDelete}
        restoreLabel="Restore"
        deleteLabel="Delete"
      />
    </div>
  );
}

/**
 * A single archived chat item in the list
 */
export function ArchivedChatItem({
  chat,
  isSelected,
  isRestoring,
  projectName,
  taskTitle,
  archivedDate,
  onSelect,
  onRestore,
  onDelete,
}: ArchivedChatItemProps) {
  return (
    <div
      className={cn(
        'group flex items-center justify-between rounded-lg border p-4 transition-colors',
        isSelected
          ? 'border-[rgb(var(--primary))] bg-[rgb(var(--primary))]/5'
          : 'border-[rgb(var(--border))] bg-[rgb(var(--card))] hover:bg-[rgb(var(--muted))]'
      )}
    >
      <button
        type="button"
        onClick={onSelect}
        className="flex flex-1 flex-col items-start gap-1 text-left"
      >
        <span className="font-medium text-[rgb(var(--foreground))]">
          {chat.title || 'Untitled Chat'}
        </span>
        <div className="flex items-center gap-2 text-xs text-[rgb(var(--muted-foreground))]">
          <span>{projectName}</span>
          {taskTitle && (
            <>
              <span>-</span>
              <span>{taskTitle}</span>
            </>
          )}
          <span>-</span>
          <span>Archived {archivedDate}</span>
        </div>
      </button>

      <ActionButtons
        isRestoring={isRestoring}
        onRestore={onRestore}
        onDelete={onDelete}
        restoreLabel="Restore"
        deleteLabel="Delete"
      />
    </div>
  );
}

/**
 * A single archived project item in the list
 */
export function ArchivedProjectItem({
  project,
  isSelected,
  isRestoring,
  archivedDate,
  onSelect,
  onRestore,
  onDelete,
}: ArchivedProjectItemProps) {
  return (
    <div
      className={cn(
        'group flex items-center justify-between rounded-lg border p-4 transition-colors',
        isSelected
          ? 'border-[rgb(var(--primary))] bg-[rgb(var(--primary))]/5'
          : 'border-[rgb(var(--border))] bg-[rgb(var(--card))] hover:bg-[rgb(var(--muted))]'
      )}
    >
      <button
        type="button"
        onClick={onSelect}
        className="flex flex-1 flex-col items-start gap-1 text-left"
      >
        <span className="font-medium text-[rgb(var(--foreground))]">{project.name}</span>
        <div className="flex items-center gap-2 text-xs text-[rgb(var(--muted-foreground))]">
          <span className="truncate max-w-[200px]">{project.gitRepoPath}</span>
          <span>-</span>
          <span>Archived {archivedDate}</span>
        </div>
      </button>

      <ActionButtons
        isRestoring={isRestoring}
        onRestore={onRestore}
        onDelete={onDelete}
        restoreLabel="Restore"
        deleteLabel="Delete"
      />
    </div>
  );
}

interface ActionButtonsProps {
  isRestoring: boolean;
  onRestore: () => void;
  onDelete: () => void;
  restoreLabel: string;
  deleteLabel: string;
}

function ActionButtons({
  isRestoring,
  onRestore,
  onDelete,
  restoreLabel,
  deleteLabel,
}: ActionButtonsProps) {
  return (
    <div className="flex items-center gap-2 opacity-0 transition-opacity group-hover:opacity-100">
      <button
        type="button"
        onClick={onRestore}
        disabled={isRestoring}
        className="inline-flex items-center gap-1.5 rounded-md bg-[rgb(var(--primary))] px-3 py-1.5 text-xs font-medium text-[rgb(var(--primary-foreground))] hover:bg-[rgb(var(--primary))]/90 disabled:opacity-50"
        title="Restore"
      >
        <RotateCcw className="h-3.5 w-3.5" />
        {restoreLabel}
      </button>
      <button
        type="button"
        onClick={onDelete}
        className="inline-flex items-center gap-1.5 rounded-md bg-error/10 px-3 py-1.5 text-xs font-medium text-error hover:bg-error/20"
        title="Delete permanently"
      >
        <Trash2 className="h-3.5 w-3.5" />
        {deleteLabel}
      </button>
    </div>
  );
}

/**
 * Main content area - renders the appropriate list based on active tab
 */
export function ArchiveContent({
  activeTab,
  isLoading,
  archivedTasks,
  selectedTask,
  isRestoringTask,
  archivedChats,
  selectedChat,
  isRestoringChat,
  archivedProjects,
  selectedProject,
  isRestoringProject,
  getProjectName,
  getTaskTitle,
  formatDate,
  onSelectTask,
  onSelectChat,
  onSelectProject,
  onRestoreTask,
  onRestoreChat,
  onRestoreProject,
  onDeleteTask,
  onDeleteChat,
  onDeleteProject,
}: ArchiveContentProps) {
  return (
    <div className="flex-1 overflow-auto p-4 md:p-6">
      {isLoading ? (
        <SkeletonArchiveList />
      ) : activeTab === 'tasks' ? (
        <TasksList
          tasks={archivedTasks}
          selectedTask={selectedTask}
          isRestoring={isRestoringTask}
          getProjectName={getProjectName}
          formatDate={formatDate}
          onSelect={onSelectTask}
          onRestore={onRestoreTask}
          onDelete={onDeleteTask}
        />
      ) : activeTab === 'chats' ? (
        <ChatsList
          chats={archivedChats}
          selectedChat={selectedChat}
          isRestoring={isRestoringChat}
          getProjectName={getProjectName}
          getTaskTitle={getTaskTitle}
          formatDate={formatDate}
          onSelect={onSelectChat}
          onRestore={onRestoreChat}
          onDelete={onDeleteChat}
        />
      ) : (
        <ProjectsList
          projects={archivedProjects}
          selectedProject={selectedProject}
          isRestoring={isRestoringProject}
          formatDate={formatDate}
          onSelect={onSelectProject}
          onRestore={onRestoreProject}
          onDelete={onDeleteProject}
        />
      )}
    </div>
  );
}

// ============================================================================
// List Components
// ============================================================================

interface TasksListProps {
  tasks: Task[];
  selectedTask: Task | null;
  isRestoring: boolean;
  getProjectName: (projectId: string) => string;
  formatDate: (dateString: string | null | undefined) => string;
  onSelect: (task: Task) => void;
  onRestore: (task: Task) => void;
  onDelete: (task: Task) => void;
}

function TasksList({
  tasks,
  selectedTask,
  isRestoring,
  getProjectName,
  formatDate,
  onSelect,
  onRestore,
  onDelete,
}: TasksListProps) {
  if (tasks.length === 0) {
    return (
      <EmptyState
        icon={Archive}
        title="No archived tasks"
        description="Tasks you archive will appear here."
        size="lg"
        className="h-full"
      />
    );
  }

  return (
    <div className="space-y-2">
      {tasks.map((task) => (
        <ArchivedTaskItem
          key={task.id}
          task={task}
          isSelected={selectedTask?.id === task.id}
          isRestoring={isRestoring}
          projectName={getProjectName(task.projectId)}
          archivedDate={formatDate(task.archivedAt)}
          onSelect={() => onSelect(task)}
          onRestore={() => onRestore(task)}
          onDelete={() => onDelete(task)}
        />
      ))}
    </div>
  );
}

interface ChatsListProps {
  chats: Chat[];
  selectedChat: Chat | null;
  isRestoring: boolean;
  getProjectName: (projectId: string) => string;
  getTaskTitle: (taskId: string | null | undefined) => string | null;
  formatDate: (dateString: string | null | undefined) => string;
  onSelect: (chat: Chat) => void;
  onRestore: (chat: Chat) => void;
  onDelete: (chat: Chat) => void;
}

function ChatsList({
  chats,
  selectedChat,
  isRestoring,
  getProjectName,
  getTaskTitle,
  formatDate,
  onSelect,
  onRestore,
  onDelete,
}: ChatsListProps) {
  if (chats.length === 0) {
    return (
      <EmptyState
        icon={MessageSquare}
        title="No archived chats"
        description="Chats you archive will appear here."
        size="lg"
        className="h-full"
      />
    );
  }

  return (
    <div className="space-y-2">
      {chats.map((chat) => (
        <ArchivedChatItem
          key={chat.id}
          chat={chat}
          isSelected={selectedChat?.id === chat.id}
          isRestoring={isRestoring}
          projectName={getProjectName(chat.projectId)}
          taskTitle={getTaskTitle(chat.taskId)}
          archivedDate={formatDate(chat.archivedAt)}
          onSelect={() => onSelect(chat)}
          onRestore={() => onRestore(chat)}
          onDelete={() => onDelete(chat)}
        />
      ))}
    </div>
  );
}

interface ProjectsListProps {
  projects: Project[];
  selectedProject: Project | null;
  isRestoring: boolean;
  formatDate: (dateString: string | null | undefined) => string;
  onSelect: (project: Project) => void;
  onRestore: (project: Project) => void;
  onDelete: (project: Project) => void;
}

function ProjectsList({
  projects,
  selectedProject,
  isRestoring,
  formatDate,
  onSelect,
  onRestore,
  onDelete,
}: ProjectsListProps) {
  if (projects.length === 0) {
    return (
      <EmptyState
        icon={Folder}
        title="No archived projects"
        description="Projects you archive will appear here."
        size="lg"
        className="h-full"
      />
    );
  }

  return (
    <div className="space-y-2">
      {projects.map((project) => (
        <ArchivedProjectItem
          key={project.id}
          project={project}
          isSelected={selectedProject?.id === project.id}
          isRestoring={isRestoring}
          archivedDate={formatDate(project.archivedAt)}
          onSelect={() => onSelect(project)}
          onRestore={() => onRestore(project)}
          onDelete={() => onDelete(project)}
        />
      ))}
    </div>
  );
}
