/**
 * ArchivePageComponents - UI components for the Archive page
 *
 * These components are purely presentational and receive all data and callbacks
 * as props from the useArchiveSession hook.
 *
 * Accessibility Features:
 * - ARIA tablist pattern for tab navigation
 * - Proper list semantics with role="list" and role="listitem"
 * - Screen reader announcements for state changes
 * - Touch targets ≥44px for all interactive elements (WCAG 2.5.5)
 * - Focus ring with offset for visibility on all backgrounds
 * - motion-safe transitions for reduced motion support
 *
 * @module organisms/ArchivePageComponents
 */

import type { Chat, Project, Task } from '@openflow/generated';
import { Flex, Heading, type ResponsiveValue, Text, VisuallyHidden } from '@openflow/primitives';
import { cn } from '@openflow/utils';
import { Archive, ArrowLeft, Folder, MessageSquare, RotateCcw, Trash2 } from 'lucide-react';
import { type HTMLAttributes, type KeyboardEvent, forwardRef, useCallback, useId } from 'react';
import { Button } from '../atoms/Button';
import { Icon } from '../atoms/Icon';
import { EmptyState } from '../molecules/EmptyState';
import { SkeletonArchiveList } from '../molecules/SkeletonArchiveList';
import { AppLayout } from '../templates/AppLayout';
import { Header } from './Header';

// ============================================================================
// Types
// ============================================================================

export type ArchiveTab = 'tasks' | 'chats' | 'projects';

/** Size variants for responsive layout */
export type ArchiveItemSize = 'sm' | 'md' | 'lg';

/** Breakpoints supported for responsive sizing */
export type ArchiveBreakpoint = 'base' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

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

export interface ArchiveTabBarProps extends Omit<HTMLAttributes<HTMLDivElement>, 'onChange'> {
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
  /** Test ID for testing */
  'data-testid'?: string;
}

export interface ArchivedTaskItemProps extends Omit<HTMLAttributes<HTMLDivElement>, 'onSelect'> {
  task: Task;
  isSelected: boolean;
  isRestoring: boolean;
  projectName: string;
  archivedDate: string;
  onSelect: () => void;
  onRestore: () => void;
  onDelete: () => void;
  /** Test ID for testing */
  'data-testid'?: string;
}

export interface ArchivedChatItemProps extends Omit<HTMLAttributes<HTMLDivElement>, 'onSelect'> {
  chat: Chat;
  isSelected: boolean;
  isRestoring: boolean;
  projectName: string;
  taskTitle: string | null;
  archivedDate: string;
  onSelect: () => void;
  onRestore: () => void;
  onDelete: () => void;
  /** Test ID for testing */
  'data-testid'?: string;
}

export interface ArchivedProjectItemProps extends Omit<HTMLAttributes<HTMLDivElement>, 'onSelect'> {
  project: Project;
  isSelected: boolean;
  isRestoring: boolean;
  archivedDate: string;
  onSelect: () => void;
  onRestore: () => void;
  onDelete: () => void;
  /** Test ID for testing */
  'data-testid'?: string;
}

export interface ArchiveContentProps extends Omit<HTMLAttributes<HTMLDivElement>, 'onSelect'> {
  activeTab: ArchiveTab;
  isLoading: boolean;
  /** Error state */
  error?: Error | null;
  /** Retry handler for errors */
  onRetry?: () => void;
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
  /** Responsive sizing for list items */
  itemSize?: ResponsiveValue<ArchiveItemSize>;
  /** Test ID for testing */
  'data-testid'?: string;
}

// ============================================================================
// Constants - Exported for testability
// ============================================================================

/** Tab definitions with labels and icons */
export const ARCHIVE_TABS: Array<{ id: ArchiveTab; label: string }> = [
  { id: 'tasks', label: 'Tasks' },
  { id: 'chats', label: 'Chats' },
  { id: 'projects', label: 'Projects' },
];

/** Default item size */
export const DEFAULT_ITEM_SIZE: ArchiveItemSize = 'md';

/** Base classes for the archive layout container */
export const ARCHIVE_LAYOUT_CLASSES = 'flex h-full flex-col';

/** Tab bar container base classes */
export const ARCHIVE_TAB_BAR_CLASSES = 'border-b border-[rgb(var(--border))] px-4 py-3 md:px-6';

/** Tab container classes (the pill group) */
export const ARCHIVE_TAB_CONTAINER_CLASSES = 'flex gap-1 rounded-lg bg-[rgb(var(--muted))] p-1';

/** Tab button base classes */
export const ARCHIVE_TAB_BASE_CLASSES = [
  'rounded-md px-3 py-1.5 text-sm font-medium',
  'motion-safe:transition-colors motion-safe:duration-150',
  'focus-visible:outline-none focus-visible:ring-2',
  'focus-visible:ring-[rgb(var(--ring))] focus-visible:ring-offset-2',
  'focus-visible:ring-offset-[rgb(var(--background))]',
  'min-h-[44px] sm:min-h-8', // Touch target on mobile
].join(' ');

/** Tab button active classes */
export const ARCHIVE_TAB_ACTIVE_CLASSES =
  'bg-[rgb(var(--background))] text-[rgb(var(--foreground))] shadow-sm';

/** Tab button inactive classes */
export const ARCHIVE_TAB_INACTIVE_CLASSES =
  'text-[rgb(var(--muted-foreground))] hover:text-[rgb(var(--foreground))]';

/** Back button classes */
export const ARCHIVE_BACK_BUTTON_CLASSES = [
  'inline-flex items-center gap-2 text-sm',
  'text-[rgb(var(--muted-foreground))] hover:text-[rgb(var(--foreground))]',
  'motion-safe:transition-colors motion-safe:duration-150',
  'focus-visible:outline-none focus-visible:ring-2',
  'focus-visible:ring-[rgb(var(--ring))] focus-visible:ring-offset-2',
  'focus-visible:ring-offset-[rgb(var(--background))]',
  'rounded-md px-2 py-1',
  'min-h-[44px] sm:min-h-8', // Touch target on mobile
].join(' ');

/** Default back button label */
export const DEFAULT_BACK_LABEL = 'Back to Dashboard';

/** Item container base classes */
export const ARCHIVE_ITEM_BASE_CLASSES = [
  'group flex items-center justify-between rounded-lg border p-4',
  'motion-safe:transition-colors motion-safe:duration-150',
].join(' ');

/** Item selected classes */
export const ARCHIVE_ITEM_SELECTED_CLASSES =
  'border-[rgb(var(--primary))] bg-[rgb(var(--primary))]/5';

/** Item unselected classes */
export const ARCHIVE_ITEM_UNSELECTED_CLASSES =
  'border-[rgb(var(--border))] bg-[rgb(var(--card))] hover:bg-[rgb(var(--muted))]';

/** Item content button classes */
export const ARCHIVE_ITEM_CONTENT_CLASSES = [
  'flex flex-1 flex-col items-start gap-1 text-left',
  'focus-visible:outline-none focus-visible:ring-2',
  'focus-visible:ring-[rgb(var(--ring))] focus-visible:ring-offset-2',
  'focus-visible:ring-offset-[rgb(var(--background))]',
  'rounded-md px-2 py-1 -ml-2',
  'min-h-[44px]', // Touch target
].join(' ');

/** Action buttons container classes */
export const ARCHIVE_ACTIONS_CLASSES =
  'flex items-center gap-2 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 motion-safe:transition-opacity';

/** Content container classes */
export const ARCHIVE_CONTENT_CLASSES = 'flex-1 overflow-auto p-4 md:p-6';

/** List container classes */
export const ARCHIVE_LIST_CLASSES = 'space-y-2';

/** Error container classes */
export const ARCHIVE_ERROR_CLASSES = 'flex flex-col items-center justify-center h-full gap-4';

/** Size-specific classes for items */
export const ARCHIVE_ITEM_SIZE_CLASSES: Record<ArchiveItemSize, string> = {
  sm: 'p-3 gap-1',
  md: 'p-4 gap-2',
  lg: 'p-5 gap-3',
};

// ============================================================================
// Utility Functions - Exported for testability
// ============================================================================

/**
 * Get the label for an archive tab
 */
export function getTabLabel(tab: ArchiveTab): string {
  const tabDef = ARCHIVE_TABS.find((t) => t.id === tab);
  return tabDef?.label ?? tab;
}

/**
 * Get entity name singular/plural for a tab
 */
export function getEntityName(tab: ArchiveTab, count: number): string {
  const base = tab === 'tasks' ? 'task' : tab === 'chats' ? 'chat' : 'project';
  return count === 1 ? base : `${base}s`;
}

/**
 * Generate subtitle text for the header
 */
export function getArchiveSubtitle(count: number, tab: ArchiveTab): string {
  return `${count} archived ${getEntityName(tab, count)}`;
}

/**
 * Resolves a ResponsiveValue to its base size
 */
export function getBaseSize(size: ResponsiveValue<ArchiveItemSize> | undefined): ArchiveItemSize {
  if (!size) return DEFAULT_ITEM_SIZE;
  if (typeof size === 'string') return size;
  return size.base ?? DEFAULT_ITEM_SIZE;
}

/**
 * Generates responsive Tailwind classes for the size prop
 */
export function getResponsiveSizeClasses(
  size: ResponsiveValue<ArchiveItemSize> | undefined
): string {
  if (!size) return ARCHIVE_ITEM_SIZE_CLASSES[DEFAULT_ITEM_SIZE];

  if (typeof size === 'string') {
    return ARCHIVE_ITEM_SIZE_CLASSES[size];
  }

  const classes: string[] = [];
  const breakpointPrefixes: Record<Exclude<ArchiveBreakpoint, 'base'>, string> = {
    sm: 'sm:',
    md: 'md:',
    lg: 'lg:',
    xl: 'xl:',
    '2xl': '2xl:',
  };

  // Base size
  if (size.base) {
    classes.push(ARCHIVE_ITEM_SIZE_CLASSES[size.base]);
  } else {
    classes.push(ARCHIVE_ITEM_SIZE_CLASSES[DEFAULT_ITEM_SIZE]);
  }

  // Responsive overrides
  for (const [breakpoint, prefix] of Object.entries(breakpointPrefixes)) {
    const bp = breakpoint as Exclude<ArchiveBreakpoint, 'base'>;
    if (size[bp]) {
      const sizeClasses = ARCHIVE_ITEM_SIZE_CLASSES[size[bp] as ArchiveItemSize];
      const prefixedClasses = sizeClasses
        .split(' ')
        .map((cls) => `${prefix}${cls}`)
        .join(' ');
      classes.push(prefixedClasses);
    }
  }

  return classes.join(' ');
}

/**
 * Get screen reader announcement for tab change
 */
export function getTabChangeAnnouncement(tab: ArchiveTab, count: number): string {
  return `${getTabLabel(tab)} tab selected. ${count} ${getEntityName(tab, count)} in archive.`;
}

/**
 * Get screen reader announcement for item restoration
 */
export function getRestoreAnnouncement(
  entityType: 'task' | 'chat' | 'project',
  title: string
): string {
  return `Restoring ${entityType}: ${title}`;
}

/**
 * Get screen reader announcement for selected item
 */
export function getSelectedAnnouncement(
  entityType: 'task' | 'chat' | 'project',
  title: string,
  isSelected: boolean
): string {
  return isSelected ? `${title} ${entityType} selected` : `${title} ${entityType}`;
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
      <div className={ARCHIVE_LAYOUT_CLASSES}>{children}</div>
    </AppLayout>
  );
}

/**
 * Header for the archive page
 */
export function ArchiveHeader({ archivedCount, activeTab, onSearch }: ArchiveHeaderProps) {
  const subtitle = getArchiveSubtitle(archivedCount, activeTab);

  return <Header title="Archive" subtitle={subtitle} onSearch={onSearch} />;
}

/**
 * Tab bar with back button and tab selection.
 *
 * Implements ARIA tablist pattern with keyboard navigation:
 * - Arrow Left/Right: Navigate between tabs
 * - Home: Jump to first tab
 * - End: Jump to last tab
 * - Enter/Space: Activate tab (handled via onClick)
 */
export const ArchiveTabBar = forwardRef<HTMLDivElement, ArchiveTabBarProps>(function ArchiveTabBar(
  {
    activeTab,
    onTabChange,
    taskCount,
    chatCount,
    projectCount,
    onBack,
    className,
    'data-testid': dataTestId,
    ...props
  },
  ref
) {
  const tabListId = useId();
  const counts: Record<ArchiveTab, number> = {
    tasks: taskCount,
    chats: chatCount,
    projects: projectCount,
  };

  /**
   * Handle keyboard navigation within the tab list
   */
  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      const currentIndex = ARCHIVE_TABS.findIndex((t) => t.id === activeTab);

      switch (event.key) {
        case 'ArrowLeft':
        case 'ArrowUp': {
          event.preventDefault();
          const prevIndex = currentIndex <= 0 ? ARCHIVE_TABS.length - 1 : currentIndex - 1;
          const prevTab = ARCHIVE_TABS[prevIndex];
          if (prevTab) onTabChange(prevTab.id);
          break;
        }
        case 'ArrowRight':
        case 'ArrowDown': {
          event.preventDefault();
          const nextIndex = currentIndex >= ARCHIVE_TABS.length - 1 ? 0 : currentIndex + 1;
          const nextTab = ARCHIVE_TABS[nextIndex];
          if (nextTab) onTabChange(nextTab.id);
          break;
        }
        case 'Home': {
          event.preventDefault();
          const firstTab = ARCHIVE_TABS[0];
          if (firstTab) onTabChange(firstTab.id);
          break;
        }
        case 'End': {
          event.preventDefault();
          const lastTab = ARCHIVE_TABS[ARCHIVE_TABS.length - 1];
          if (lastTab) onTabChange(lastTab.id);
          break;
        }
      }
    },
    [activeTab, onTabChange]
  );

  return (
    <div
      ref={ref}
      className={cn(ARCHIVE_TAB_BAR_CLASSES, className)}
      data-testid={dataTestId}
      {...props}
    >
      {/* Screen reader announcement for tab changes */}
      <VisuallyHidden>
        <span role="status" aria-live="polite" aria-atomic="true">
          {getTabChangeAnnouncement(activeTab, counts[activeTab])}
        </span>
      </VisuallyHidden>

      <Flex justify="between" align="center">
        {/* Back button */}
        <button
          type="button"
          onClick={onBack}
          className={ARCHIVE_BACK_BUTTON_CLASSES}
          data-testid={dataTestId ? `${dataTestId}-back` : undefined}
        >
          <Icon icon={ArrowLeft} size="sm" />
          <Text as="span" size="sm">
            {DEFAULT_BACK_LABEL}
          </Text>
        </button>

        {/* Tab list */}
        <div
          role="tablist"
          aria-label="Archive categories"
          className={ARCHIVE_TAB_CONTAINER_CLASSES}
          onKeyDown={handleKeyDown}
          id={tabListId}
          data-testid={dataTestId ? `${dataTestId}-tablist` : undefined}
        >
          {ARCHIVE_TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            const count = counts[tab.id];

            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                id={`${tabListId}-tab-${tab.id}`}
                aria-selected={isActive}
                aria-controls={`${tabListId}-panel-${tab.id}`}
                tabIndex={isActive ? 0 : -1}
                onClick={() => onTabChange(tab.id)}
                className={cn(
                  ARCHIVE_TAB_BASE_CLASSES,
                  isActive ? ARCHIVE_TAB_ACTIVE_CLASSES : ARCHIVE_TAB_INACTIVE_CLASSES
                )}
                data-testid={dataTestId ? `${dataTestId}-tab-${tab.id}` : undefined}
                data-state={isActive ? 'active' : 'inactive'}
              >
                {tab.label} ({count})
              </button>
            );
          })}
        </div>
      </Flex>
    </div>
  );
});

ArchiveTabBar.displayName = 'ArchiveTabBar';

/**
 * Action buttons for archive items (Restore and Delete)
 */
interface ActionButtonsProps {
  isRestoring: boolean;
  onRestore: () => void;
  onDelete: () => void;
  restoreLabel?: string;
  deleteLabel?: string;
  entityTitle: string;
  entityType: 'task' | 'chat' | 'project';
  'data-testid'?: string;
}

function ActionButtons({
  isRestoring,
  onRestore,
  onDelete,
  restoreLabel = 'Restore',
  deleteLabel = 'Delete',
  entityTitle,
  entityType,
  'data-testid': dataTestId,
}: ActionButtonsProps) {
  return (
    <Flex gap="2" className={ARCHIVE_ACTIONS_CLASSES}>
      <Button
        variant="primary"
        size="sm"
        onClick={onRestore}
        disabled={isRestoring}
        loading={isRestoring}
        loadingText="Restoring..."
        icon={!isRestoring ? <Icon icon={RotateCcw} size="xs" /> : undefined}
        aria-label={`Restore ${entityType}: ${entityTitle}`}
        data-testid={dataTestId ? `${dataTestId}-restore` : undefined}
      >
        {restoreLabel}
      </Button>
      <Button
        variant="destructive"
        size="sm"
        onClick={onDelete}
        disabled={isRestoring}
        icon={<Icon icon={Trash2} size="xs" />}
        aria-label={`Delete ${entityType} permanently: ${entityTitle}`}
        data-testid={dataTestId ? `${dataTestId}-delete` : undefined}
      >
        {deleteLabel}
      </Button>
    </Flex>
  );
}

/**
 * A single archived task item in the list
 */
export const ArchivedTaskItem = forwardRef<HTMLDivElement, ArchivedTaskItemProps>(
  function ArchivedTaskItem(
    {
      task,
      isSelected,
      isRestoring,
      projectName,
      archivedDate,
      onSelect,
      onRestore,
      onDelete,
      className,
      'data-testid': dataTestId,
      ...props
    },
    ref
  ) {
    const title = task.title || 'Untitled Task';

    return (
      <div
        ref={ref}
        role="listitem"
        className={cn(
          ARCHIVE_ITEM_BASE_CLASSES,
          isSelected ? ARCHIVE_ITEM_SELECTED_CLASSES : ARCHIVE_ITEM_UNSELECTED_CLASSES,
          className
        )}
        data-testid={dataTestId}
        data-selected={isSelected}
        data-restoring={isRestoring}
        aria-selected={isSelected}
        {...props}
      >
        {/* Screen reader announcement for selection */}
        {isSelected && (
          <VisuallyHidden>
            <span role="status" aria-live="polite">
              Selected
            </span>
          </VisuallyHidden>
        )}

        <button
          type="button"
          onClick={onSelect}
          className={ARCHIVE_ITEM_CONTENT_CLASSES}
          aria-pressed={isSelected}
          data-testid={dataTestId ? `${dataTestId}-content` : undefined}
        >
          <Text as="span" weight="medium" className="text-[rgb(var(--foreground))]">
            {title}
          </Text>
          <Flex gap="2" align="center" className="text-xs text-[rgb(var(--muted-foreground))]">
            <Text as="span" size="xs">
              {projectName}
            </Text>
            <Text as="span" size="xs" aria-hidden>
              -
            </Text>
            <Text as="span" size="xs">
              Archived {archivedDate}
            </Text>
          </Flex>
        </button>

        <ActionButtons
          isRestoring={isRestoring}
          onRestore={onRestore}
          onDelete={onDelete}
          entityTitle={title}
          entityType="task"
          data-testid={dataTestId}
        />
      </div>
    );
  }
);

ArchivedTaskItem.displayName = 'ArchivedTaskItem';

/**
 * A single archived chat item in the list
 */
export const ArchivedChatItem = forwardRef<HTMLDivElement, ArchivedChatItemProps>(
  function ArchivedChatItem(
    {
      chat,
      isSelected,
      isRestoring,
      projectName,
      taskTitle,
      archivedDate,
      onSelect,
      onRestore,
      onDelete,
      className,
      'data-testid': dataTestId,
      ...props
    },
    ref
  ) {
    const title = chat.title || 'Untitled Chat';

    return (
      <div
        ref={ref}
        role="listitem"
        className={cn(
          ARCHIVE_ITEM_BASE_CLASSES,
          isSelected ? ARCHIVE_ITEM_SELECTED_CLASSES : ARCHIVE_ITEM_UNSELECTED_CLASSES,
          className
        )}
        data-testid={dataTestId}
        data-selected={isSelected}
        data-restoring={isRestoring}
        aria-selected={isSelected}
        {...props}
      >
        {/* Screen reader announcement for selection */}
        {isSelected && (
          <VisuallyHidden>
            <span role="status" aria-live="polite">
              Selected
            </span>
          </VisuallyHidden>
        )}

        <button
          type="button"
          onClick={onSelect}
          className={ARCHIVE_ITEM_CONTENT_CLASSES}
          aria-pressed={isSelected}
          data-testid={dataTestId ? `${dataTestId}-content` : undefined}
        >
          <Text as="span" weight="medium" className="text-[rgb(var(--foreground))]">
            {title}
          </Text>
          <Flex gap="2" align="center" className="text-xs text-[rgb(var(--muted-foreground))]">
            <Text as="span" size="xs">
              {projectName}
            </Text>
            {taskTitle && (
              <>
                <Text as="span" size="xs" aria-hidden>
                  -
                </Text>
                <Text as="span" size="xs">
                  {taskTitle}
                </Text>
              </>
            )}
            <Text as="span" size="xs" aria-hidden>
              -
            </Text>
            <Text as="span" size="xs">
              Archived {archivedDate}
            </Text>
          </Flex>
        </button>

        <ActionButtons
          isRestoring={isRestoring}
          onRestore={onRestore}
          onDelete={onDelete}
          entityTitle={title}
          entityType="chat"
          data-testid={dataTestId}
        />
      </div>
    );
  }
);

ArchivedChatItem.displayName = 'ArchivedChatItem';

/**
 * A single archived project item in the list
 */
export const ArchivedProjectItem = forwardRef<HTMLDivElement, ArchivedProjectItemProps>(
  function ArchivedProjectItem(
    {
      project,
      isSelected,
      isRestoring,
      archivedDate,
      onSelect,
      onRestore,
      onDelete,
      className,
      'data-testid': dataTestId,
      ...props
    },
    ref
  ) {
    const title = project.name || 'Untitled Project';

    return (
      <div
        ref={ref}
        role="listitem"
        className={cn(
          ARCHIVE_ITEM_BASE_CLASSES,
          isSelected ? ARCHIVE_ITEM_SELECTED_CLASSES : ARCHIVE_ITEM_UNSELECTED_CLASSES,
          className
        )}
        data-testid={dataTestId}
        data-selected={isSelected}
        data-restoring={isRestoring}
        aria-selected={isSelected}
        {...props}
      >
        {/* Screen reader announcement for selection */}
        {isSelected && (
          <VisuallyHidden>
            <span role="status" aria-live="polite">
              Selected
            </span>
          </VisuallyHidden>
        )}

        <button
          type="button"
          onClick={onSelect}
          className={ARCHIVE_ITEM_CONTENT_CLASSES}
          aria-pressed={isSelected}
          data-testid={dataTestId ? `${dataTestId}-content` : undefined}
        >
          <Text as="span" weight="medium" className="text-[rgb(var(--foreground))]">
            {title}
          </Text>
          <Flex gap="2" align="center" className="text-xs text-[rgb(var(--muted-foreground))]">
            <Text
              as="span"
              size="xs"
              className="truncate max-w-[200px]"
              title={project.gitRepoPath}
            >
              {project.gitRepoPath}
            </Text>
            <Text as="span" size="xs" aria-hidden>
              -
            </Text>
            <Text as="span" size="xs">
              Archived {archivedDate}
            </Text>
          </Flex>
        </button>

        <ActionButtons
          isRestoring={isRestoring}
          onRestore={onRestore}
          onDelete={onDelete}
          entityTitle={title}
          entityType="project"
          data-testid={dataTestId}
        />
      </div>
    );
  }
);

ArchivedProjectItem.displayName = 'ArchivedProjectItem';

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
  'data-testid'?: string;
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
  'data-testid': dataTestId,
}: TasksListProps) {
  if (tasks.length === 0) {
    return (
      <EmptyState
        icon={Archive}
        title="No archived tasks"
        description="Tasks you archive will appear here."
        size="lg"
        className="h-full"
        data-testid={dataTestId ? `${dataTestId}-empty` : undefined}
      />
    );
  }

  return (
    <div
      role="list"
      aria-label="Archived tasks"
      className={ARCHIVE_LIST_CLASSES}
      data-testid={dataTestId}
    >
      {tasks.map((task) => (
        <ArchivedTaskItem
          key={task.id}
          task={task}
          isSelected={selectedTask?.id === task.id}
          isRestoring={isRestoring && selectedTask?.id === task.id}
          projectName={getProjectName(task.projectId)}
          archivedDate={formatDate(task.archivedAt)}
          onSelect={() => onSelect(task)}
          onRestore={() => onRestore(task)}
          onDelete={() => onDelete(task)}
          data-testid={dataTestId ? `${dataTestId}-item-${task.id}` : undefined}
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
  'data-testid'?: string;
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
  'data-testid': dataTestId,
}: ChatsListProps) {
  if (chats.length === 0) {
    return (
      <EmptyState
        icon={MessageSquare}
        title="No archived chats"
        description="Chats you archive will appear here."
        size="lg"
        className="h-full"
        data-testid={dataTestId ? `${dataTestId}-empty` : undefined}
      />
    );
  }

  return (
    <div
      role="list"
      aria-label="Archived chats"
      className={ARCHIVE_LIST_CLASSES}
      data-testid={dataTestId}
    >
      {chats.map((chat) => (
        <ArchivedChatItem
          key={chat.id}
          chat={chat}
          isSelected={selectedChat?.id === chat.id}
          isRestoring={isRestoring && selectedChat?.id === chat.id}
          projectName={getProjectName(chat.projectId)}
          taskTitle={getTaskTitle(chat.taskId)}
          archivedDate={formatDate(chat.archivedAt)}
          onSelect={() => onSelect(chat)}
          onRestore={() => onRestore(chat)}
          onDelete={() => onDelete(chat)}
          data-testid={dataTestId ? `${dataTestId}-item-${chat.id}` : undefined}
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
  'data-testid'?: string;
}

function ProjectsList({
  projects,
  selectedProject,
  isRestoring,
  formatDate,
  onSelect,
  onRestore,
  onDelete,
  'data-testid': dataTestId,
}: ProjectsListProps) {
  if (projects.length === 0) {
    return (
      <EmptyState
        icon={Folder}
        title="No archived projects"
        description="Projects you archive will appear here."
        size="lg"
        className="h-full"
        data-testid={dataTestId ? `${dataTestId}-empty` : undefined}
      />
    );
  }

  return (
    <div
      role="list"
      aria-label="Archived projects"
      className={ARCHIVE_LIST_CLASSES}
      data-testid={dataTestId}
    >
      {projects.map((project) => (
        <ArchivedProjectItem
          key={project.id}
          project={project}
          isSelected={selectedProject?.id === project.id}
          isRestoring={isRestoring && selectedProject?.id === project.id}
          archivedDate={formatDate(project.archivedAt)}
          onSelect={() => onSelect(project)}
          onRestore={() => onRestore(project)}
          onDelete={() => onDelete(project)}
          data-testid={dataTestId ? `${dataTestId}-item-${project.id}` : undefined}
        />
      ))}
    </div>
  );
}

/**
 * Error state component for the archive content
 */
interface ArchiveErrorProps {
  error: Error;
  onRetry?: () => void;
  'data-testid'?: string;
}

function ArchiveError({ error, onRetry, 'data-testid': dataTestId }: ArchiveErrorProps) {
  return (
    <Flex
      direction="column"
      align="center"
      justify="center"
      gap="4"
      className="h-full"
      role="alert"
      aria-live="assertive"
      data-testid={dataTestId}
    >
      <Icon icon={Archive} size="xl" className="text-[rgb(var(--destructive))]" />
      <Heading level={3} size="lg">
        Failed to load archive
      </Heading>
      <Text color="muted-foreground" className="text-center max-w-md">
        {error.message || 'An error occurred while loading the archived items.'}
      </Text>
      {onRetry && (
        <Button variant="secondary" onClick={onRetry} icon={<Icon icon={RotateCcw} size="sm" />}>
          Try again
        </Button>
      )}
    </Flex>
  );
}

/**
 * Main content area - renders the appropriate list based on active tab
 */
export const ArchiveContent = forwardRef<HTMLDivElement, ArchiveContentProps>(
  function ArchiveContent(
    {
      activeTab,
      isLoading,
      error,
      onRetry,
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
      itemSize,
      className,
      'data-testid': dataTestId,
      ...props
    },
    ref
  ) {
    return (
      <div
        ref={ref}
        role="tabpanel"
        aria-label={`${getTabLabel(activeTab)} archive list`}
        className={cn(ARCHIVE_CONTENT_CLASSES, className)}
        data-testid={dataTestId}
        data-active-tab={activeTab}
        data-loading={isLoading}
        data-error={!!error}
        {...props}
      >
        {/* Loading state */}
        {isLoading ? (
          <SkeletonArchiveList
            count={5}
            data-testid={dataTestId ? `${dataTestId}-skeleton` : undefined}
          />
        ) : /* Error state */
        error ? (
          <ArchiveError
            error={error}
            onRetry={onRetry}
            data-testid={dataTestId ? `${dataTestId}-error` : undefined}
          />
        ) : /* Content based on active tab */
        activeTab === 'tasks' ? (
          <TasksList
            tasks={archivedTasks}
            selectedTask={selectedTask}
            isRestoring={isRestoringTask}
            getProjectName={getProjectName}
            formatDate={formatDate}
            onSelect={onSelectTask}
            onRestore={onRestoreTask}
            onDelete={onDeleteTask}
            data-testid={dataTestId ? `${dataTestId}-tasks` : undefined}
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
            data-testid={dataTestId ? `${dataTestId}-chats` : undefined}
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
            data-testid={dataTestId ? `${dataTestId}-projects` : undefined}
          />
        )}
      </div>
    );
  }
);

ArchiveContent.displayName = 'ArchiveContent';
