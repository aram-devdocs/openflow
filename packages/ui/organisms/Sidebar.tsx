import type { Chat, Project, Task, TaskStatus } from '@openflow/generated';
import { Box, type ResponsiveValue, Text, VisuallyHidden } from '@openflow/primitives';
import { cn } from '@openflow/utils';
import {
  Archive,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  ListFilter,
  MessageSquare,
  MoreVertical,
  Plus,
  Settings,
} from 'lucide-react';
import {
  type HTMLAttributes,
  forwardRef,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
} from 'react';
import { Button } from '../atoms/Button';
import { Icon } from '../atoms/Icon';
import { Skeleton } from '../atoms/Skeleton';
import { EmptyState } from '../molecules/EmptyState';
import { ProjectSelector } from './ProjectSelector';
import { TaskCard } from './TaskCard';

// ============================================================================
// Types
// ============================================================================

/** Status filter options for the task list */
export type StatusFilter = TaskStatus | 'all';

export type SidebarSize = 'sm' | 'md' | 'lg';
export type SidebarBreakpoint = 'base' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

export interface SidebarProps
  extends Omit<
    HTMLAttributes<HTMLElement>,
    | 'role'
    | 'aria-hidden'
    | 'aria-busy'
    | 'aria-checked'
    | 'aria-disabled'
    | 'aria-expanded'
    | 'aria-grabbed'
    | 'aria-haspopup'
    | 'aria-invalid'
    | 'aria-pressed'
    | 'aria-readonly'
    | 'aria-required'
    | 'aria-selected'
  > {
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
  /** Callback when task context menu is triggered (right-click or more button) */
  onTaskContextMenu?: (taskId: string, event: React.MouseEvent) => void;
  /** Callback when chat context menu is triggered (right-click or more button) */
  onChatContextMenu?: (chatId: string, event: React.MouseEvent) => void;
  /** Callback to navigate to all chats page */
  onViewAllChats?: () => void;
  /** Callback when Settings link is clicked */
  onSettingsClick?: () => void;
  /** Callback when Archive link is clicked */
  onArchiveClick?: () => void;
  /** Whether the sidebar is collapsed */
  isCollapsed?: boolean;
  /** Callback when sidebar collapse state is toggled */
  onToggleCollapse?: () => void;
  /** Responsive size variant */
  size?: ResponsiveValue<SidebarSize>;
  /** Accessible label for the sidebar navigation */
  'aria-label'?: string;
  /** Data attributes for testing */
  'data-testid'?: string;
}

export interface SidebarSkeletonProps
  extends Omit<
    HTMLAttributes<HTMLDivElement>,
    | 'role'
    | 'aria-hidden'
    | 'aria-busy'
    | 'aria-checked'
    | 'aria-disabled'
    | 'aria-expanded'
    | 'aria-grabbed'
    | 'aria-haspopup'
    | 'aria-invalid'
    | 'aria-pressed'
    | 'aria-readonly'
    | 'aria-required'
    | 'aria-selected'
  > {
  /** Number of task skeleton items to show */
  taskCount?: number;
  /** Number of chat skeleton items to show */
  chatCount?: number;
  /** Whether the sidebar is collapsed */
  isCollapsed?: boolean;
  /** Responsive size variant */
  size?: ResponsiveValue<SidebarSize>;
  /** Data attributes for testing */
  'data-testid'?: string;
}

// ============================================================================
// Constants
// ============================================================================

/**
 * Breakpoint order for responsive class generation
 */
const BREAKPOINT_ORDER: readonly SidebarBreakpoint[] = [
  'base',
  'sm',
  'md',
  'lg',
  'xl',
  '2xl',
] as const;

/**
 * Default accessible label for the sidebar navigation
 */
export const DEFAULT_SIDEBAR_LABEL = 'Main navigation';

/**
 * Default label for expanding the sidebar
 */
export const DEFAULT_EXPAND_LABEL = 'Expand sidebar';

/**
 * Default label for collapsing the sidebar
 */
export const DEFAULT_COLLAPSE_LABEL = 'Collapse sidebar';

/**
 * Default label for new task button
 */
export const DEFAULT_NEW_TASK_LABEL = 'Create new task';

/**
 * Default label for new chat button
 */
export const DEFAULT_NEW_CHAT_LABEL = 'Create new chat';

/**
 * Default label for archive button
 */
export const DEFAULT_ARCHIVE_LABEL = 'View archive';

/**
 * Default label for settings button
 */
export const DEFAULT_SETTINGS_LABEL = 'Open settings';

/**
 * Default label for view all chats button
 */
export const DEFAULT_VIEW_ALL_CHATS_LABEL = 'View all chats';

/**
 * Default empty tasks title
 */
export const DEFAULT_EMPTY_TASKS_TITLE = 'No tasks yet';

/**
 * Default empty tasks description
 */
export const DEFAULT_EMPTY_TASKS_DESCRIPTION = 'Create a new task to get started';

/**
 * Default empty chats title
 */
export const DEFAULT_EMPTY_CHATS_TITLE = 'No chats yet';

/**
 * Default label for filter section
 */
export const DEFAULT_FILTER_LABEL = 'Filter by Status';

/**
 * Default count of skeleton tasks
 */
export const DEFAULT_SKELETON_TASK_COUNT = 4;

/**
 * Default count of skeleton chats
 */
export const DEFAULT_SKELETON_CHAT_COUNT = 3;

// Screen reader announcements
export const SR_SIDEBAR_EXPANDED = 'Sidebar expanded';
export const SR_SIDEBAR_COLLAPSED = 'Sidebar collapsed';
export const SR_FILTER_CHANGED = 'Filter changed to';
export const SR_CHATS_SECTION_EXPANDED = 'Chats section expanded';
export const SR_CHATS_SECTION_COLLAPSED = 'Chats section collapsed';

/**
 * Available status filter options
 */
export const STATUS_FILTER_OPTIONS: readonly { value: StatusFilter; label: string }[] = [
  { value: 'all' as const, label: 'All Tasks' },
  { value: 'todo' as StatusFilter, label: 'To Do' },
  { value: 'inprogress' as StatusFilter, label: 'In Progress' },
  { value: 'inreview' as StatusFilter, label: 'In Review' },
  { value: 'done' as StatusFilter, label: 'Done' },
  { value: 'cancelled' as StatusFilter, label: 'Cancelled' },
] as const;

// ============================================================================
// Base Classes
// ============================================================================

/**
 * Base classes for the sidebar container (expanded)
 */
export const SIDEBAR_BASE_CLASSES = [
  'flex flex-col',
  'border-r border-[rgb(var(--border))]',
  'bg-[rgb(var(--background))]',
].join(' ');

/**
 * Width classes by collapsed state
 */
export const SIDEBAR_WIDTH_CLASSES = {
  expanded: 'w-72',
  collapsed: 'w-14',
};

/**
 * Section padding classes by size
 */
export const SIDEBAR_PADDING_CLASSES: Record<SidebarSize, string> = {
  sm: 'p-2',
  md: 'p-3',
  lg: 'p-4',
};

/**
 * Gap between filter buttons
 */
export const SIDEBAR_FILTER_GAP_CLASSES = 'gap-0.5';

/**
 * Header section classes (with project selector)
 */
export const SIDEBAR_HEADER_CLASSES = [
  'flex items-center gap-2',
  'border-b border-[rgb(var(--border))]',
].join(' ');

/**
 * Footer section classes (settings/archive)
 */
export const SIDEBAR_FOOTER_CLASSES = [
  'flex items-center justify-between',
  'border-t border-[rgb(var(--border))]',
].join(' ');

/**
 * Scrollable content area classes
 */
export const SIDEBAR_CONTENT_CLASSES = 'flex-1 overflow-y-auto scrollbar-thin';

/**
 * Icon button base classes (for collapsed sidebar and actions)
 */
export const SIDEBAR_ICON_BUTTON_CLASSES = [
  'flex items-center justify-center rounded-md',
  'min-h-[44px] min-w-[44px]',
  'text-[rgb(var(--muted-foreground))]',
  'hover:bg-[rgb(var(--muted))] hover:text-[rgb(var(--foreground))]',
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--ring))] focus-visible:ring-offset-2 focus-visible:ring-offset-[rgb(var(--background))]',
  'motion-safe:transition-colors motion-safe:duration-150',
].join(' ');

/**
 * Status filter button base classes
 */
export const SIDEBAR_FILTER_BUTTON_BASE_CLASSES = [
  'flex items-center justify-between gap-2 rounded-md px-3 py-2 text-sm',
  'min-h-[44px] sm:min-h-0',
  'motion-safe:transition-colors motion-safe:duration-150',
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--ring))] focus-visible:ring-offset-2 focus-visible:ring-offset-[rgb(var(--background))]',
].join(' ');

/**
 * Status filter button active state classes
 */
export const SIDEBAR_FILTER_BUTTON_ACTIVE_CLASSES =
  'bg-[rgb(var(--accent))] text-[rgb(var(--accent-foreground))]';

/**
 * Status filter button inactive state classes
 */
export const SIDEBAR_FILTER_BUTTON_INACTIVE_CLASSES =
  'text-[rgb(var(--muted-foreground))] hover:bg-[rgb(var(--muted))] hover:text-[rgb(var(--foreground))]';

/**
 * Filter count badge classes
 */
export const SIDEBAR_FILTER_COUNT_BASE_CLASSES = 'rounded-full px-1.5 py-0.5 text-xs';

/**
 * Filter count active state classes
 */
export const SIDEBAR_FILTER_COUNT_ACTIVE_CLASSES =
  'bg-[rgb(var(--background))] text-[rgb(var(--foreground))]';

/**
 * Filter count inactive state classes
 */
export const SIDEBAR_FILTER_COUNT_INACTIVE_CLASSES =
  'bg-[rgb(var(--muted))] text-[rgb(var(--muted-foreground))]';

/**
 * Chats section header button classes
 */
export const SIDEBAR_CHATS_HEADER_CLASSES = [
  'flex flex-1 items-center gap-2 rounded-md px-3 py-2 text-xs font-medium',
  'min-h-[44px] sm:min-h-0',
  'text-[rgb(var(--muted-foreground))]',
  'hover:text-[rgb(var(--foreground))]',
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--ring))] focus-visible:ring-offset-2 focus-visible:ring-offset-[rgb(var(--background))]',
].join(' ');

/**
 * Chat item container classes
 */
export const SIDEBAR_CHAT_ITEM_CLASSES = [
  'group flex items-center gap-1 rounded-md',
  'motion-safe:transition-colors motion-safe:duration-150',
].join(' ');

/**
 * Chat item button classes
 */
export const SIDEBAR_CHAT_BUTTON_CLASSES = [
  'flex flex-1 items-center gap-2 rounded-md px-3 py-2 text-left text-sm',
  'min-h-[44px] sm:min-h-0',
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--ring))] focus-visible:ring-offset-2 focus-visible:ring-offset-[rgb(var(--background))]',
].join(' ');

/**
 * Chat more button classes
 */
export const SIDEBAR_CHAT_MORE_BUTTON_CLASSES = [
  'mr-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-md',
  'opacity-0 group-hover:opacity-100 focus-visible:opacity-100',
  'text-[rgb(var(--muted-foreground))] hover:text-[rgb(var(--foreground))]',
  'hover:bg-[rgb(var(--accent))]',
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--ring))]',
].join(' ');

/**
 * Footer action button classes
 */
export const SIDEBAR_FOOTER_BUTTON_CLASSES = [
  'flex items-center gap-2 rounded-md px-3 py-2 text-sm',
  'min-h-[44px] sm:min-h-0',
  'text-[rgb(var(--muted-foreground))]',
  'hover:bg-[rgb(var(--muted))] hover:text-[rgb(var(--foreground))]',
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--ring))]',
].join(' ');

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Get base size from responsive value
 */
export function getBaseSize(size: ResponsiveValue<SidebarSize> | undefined): SidebarSize {
  if (size === undefined) {
    return 'md';
  }

  if (typeof size === 'string') {
    return size;
  }

  if (typeof size === 'object' && size !== null) {
    const sizeObj = size as Partial<Record<SidebarBreakpoint, SidebarSize>>;
    if (sizeObj.base) return sizeObj.base;
    for (const bp of BREAKPOINT_ORDER) {
      if (sizeObj[bp]) return sizeObj[bp] as SidebarSize;
    }
  }

  return 'md';
}

/**
 * Generate responsive size classes
 */
export function getResponsiveSizeClasses(
  size: ResponsiveValue<SidebarSize> | undefined,
  classMap: Record<SidebarSize, string>
): string {
  if (size === undefined) {
    return classMap.md;
  }

  if (typeof size === 'string') {
    return classMap[size];
  }

  if (typeof size === 'object' && size !== null) {
    const sizeObj = size as Partial<Record<SidebarBreakpoint, SidebarSize>>;
    const classes: string[] = [];

    for (const breakpoint of BREAKPOINT_ORDER) {
      const sizeValue = sizeObj[breakpoint];
      if (sizeValue !== undefined) {
        const sizeClass = classMap[sizeValue];
        if (breakpoint === 'base') {
          classes.push(sizeClass);
        } else {
          // Add responsive prefix
          classes.push(`${breakpoint}:${sizeClass}`);
        }
      }
    }

    return classes.join(' ');
  }

  return classMap.md;
}

/**
 * Filters tasks by status
 */
export function filterTasksByStatus(tasks: Task[], filter: StatusFilter): Task[] {
  if (filter === 'all') {
    return tasks;
  }
  return tasks.filter((task) => task.status === filter);
}

/**
 * Get task counts by status
 */
export function getTaskCounts(tasks: Task[]): Record<StatusFilter, number> {
  return {
    all: tasks.length,
    todo: tasks.filter((t) => t.status === 'todo').length,
    inprogress: tasks.filter((t) => t.status === 'inprogress').length,
    inreview: tasks.filter((t) => t.status === 'inreview').length,
    done: tasks.filter((t) => t.status === 'done').length,
    cancelled: tasks.filter((t) => t.status === 'cancelled').length,
  };
}

/**
 * Get the label for a status filter
 */
export function getStatusFilterLabel(filter: StatusFilter): string {
  const option = STATUS_FILTER_OPTIONS.find((opt) => opt.value === filter);
  return option?.label ?? filter;
}

/**
 * Build announcement for filter change
 */
export function buildFilterAnnouncement(filter: StatusFilter, count: number): string {
  const label = getStatusFilterLabel(filter);
  return `${SR_FILTER_CHANGED} ${label}, ${count} ${count === 1 ? 'task' : 'tasks'}`;
}

/**
 * Build announcement for chats section toggle
 */
export function buildChatsSectionAnnouncement(isExpanded: boolean, count: number): string {
  const stateText = isExpanded ? SR_CHATS_SECTION_EXPANDED : SR_CHATS_SECTION_COLLAPSED;
  return `${stateText}, ${count} ${count === 1 ? 'chat' : 'chats'}`;
}

/**
 * Build accessible label for a chat item
 */
export function buildChatAccessibleLabel(
  title: string | null | undefined,
  isSelected: boolean
): string {
  const chatTitle = title ?? 'Untitled Chat';
  return isSelected ? `${chatTitle}, selected` : chatTitle;
}

/**
 * Get icon size based on sidebar size
 */
export function getIconSize(size: SidebarSize): 'xs' | 'sm' | 'md' {
  const iconSizeMap: Record<SidebarSize, 'xs' | 'sm' | 'md'> = {
    sm: 'xs',
    md: 'sm',
    lg: 'md',
  };
  return iconSizeMap[size];
}

// ============================================================================
// Sub-components
// ============================================================================

/**
 * Status filter button component with accessibility
 */
interface StatusFilterButtonProps {
  filter: StatusFilter;
  currentFilter: StatusFilter;
  count: number;
  onClick: () => void;
  isHighlighted?: boolean;
  'data-testid'?: string;
}

function StatusFilterButton({
  filter,
  currentFilter,
  count,
  onClick,
  isHighlighted,
  'data-testid': testId,
}: StatusFilterButtonProps) {
  const isActive = filter === currentFilter;
  const label = getStatusFilterLabel(filter);
  const buttonId = useId();

  return (
    <Box
      as="button"
      id={buttonId}
      type="button"
      role="tab"
      aria-selected={isActive}
      aria-controls={`tasks-panel-${filter}`}
      tabIndex={isActive ? 0 : -1}
      onClick={onClick}
      className={cn(
        SIDEBAR_FILTER_BUTTON_BASE_CLASSES,
        isActive ? SIDEBAR_FILTER_BUTTON_ACTIVE_CLASSES : SIDEBAR_FILTER_BUTTON_INACTIVE_CLASSES,
        isHighlighted && 'ring-2 ring-[rgb(var(--ring))]'
      )}
      data-testid={testId}
      data-state={isActive ? 'active' : 'inactive'}
      data-filter={filter}
    >
      <Text as="span" className="truncate">
        {label}
      </Text>
      <Text
        as="span"
        className={cn(
          SIDEBAR_FILTER_COUNT_BASE_CLASSES,
          isActive ? SIDEBAR_FILTER_COUNT_ACTIVE_CLASSES : SIDEBAR_FILTER_COUNT_INACTIVE_CLASSES
        )}
        aria-label={`${count} ${count === 1 ? 'task' : 'tasks'}`}
      >
        {count}
      </Text>
    </Box>
  );
}

/**
 * Collapsed sidebar showing only icons
 */
interface CollapsedSidebarProps {
  onToggleCollapse?: () => void;
  onNewTask?: () => void;
  onNewChat?: () => void;
  onSettingsClick?: () => void;
  onArchiveClick?: () => void;
  size?: ResponsiveValue<SidebarSize>;
  className?: string;
  'aria-label'?: string;
  'data-testid'?: string;
}

const CollapsedSidebar = forwardRef<HTMLElement, CollapsedSidebarProps>(function CollapsedSidebar(
  {
    onToggleCollapse,
    onNewTask,
    onNewChat,
    onSettingsClick,
    onArchiveClick,
    size,
    className,
    'aria-label': ariaLabel,
    'data-testid': testId,
  },
  ref
) {
  const baseSize = getBaseSize(size);
  const iconSize = getIconSize(baseSize);
  const paddingClasses = getResponsiveSizeClasses(size, SIDEBAR_PADDING_CLASSES);
  const navId = useId();

  return (
    <Box
      as="aside"
      ref={ref}
      role="navigation"
      aria-label={ariaLabel || DEFAULT_SIDEBAR_LABEL}
      className={cn(SIDEBAR_BASE_CLASSES, SIDEBAR_WIDTH_CLASSES.collapsed, className)}
      data-testid={testId}
      data-collapsed="true"
      data-size={baseSize}
    >
      {/* Expand button */}
      <Box
        className={cn(
          'flex items-center justify-center border-b border-[rgb(var(--border))]',
          paddingClasses
        )}
      >
        <Box
          as="button"
          type="button"
          onClick={onToggleCollapse}
          className={SIDEBAR_ICON_BUTTON_CLASSES}
          aria-label={DEFAULT_EXPAND_LABEL}
          aria-expanded={false}
          data-testid={testId ? `${testId}-expand-button` : undefined}
        >
          <Icon icon={ChevronRight} size={iconSize} aria-hidden="true" />
        </Box>
      </Box>

      {/* Action buttons */}
      <Box
        as="nav"
        id={navId}
        aria-label="Quick actions"
        className={cn('flex flex-1 flex-col items-center gap-1', paddingClasses)}
      >
        {/* New task button */}
        <Box
          as="button"
          type="button"
          onClick={onNewTask}
          className={cn(SIDEBAR_ICON_BUTTON_CLASSES, 'text-[rgb(var(--primary))]')}
          aria-label={DEFAULT_NEW_TASK_LABEL}
          data-testid={testId ? `${testId}-new-task-button` : undefined}
        >
          <Icon icon={Plus} size={iconSize} aria-hidden="true" />
        </Box>
        {/* New chat button */}
        <Box
          as="button"
          type="button"
          onClick={onNewChat}
          className={SIDEBAR_ICON_BUTTON_CLASSES}
          aria-label={DEFAULT_NEW_CHAT_LABEL}
          data-testid={testId ? `${testId}-new-chat-button` : undefined}
        >
          <Icon icon={MessageSquare} size={iconSize} aria-hidden="true" />
        </Box>
      </Box>

      {/* Footer actions */}
      <Box
        className={cn(
          'flex flex-col items-center gap-1 border-t border-[rgb(var(--border))]',
          paddingClasses
        )}
      >
        <Box
          as="button"
          type="button"
          onClick={onArchiveClick}
          className={SIDEBAR_ICON_BUTTON_CLASSES}
          aria-label={DEFAULT_ARCHIVE_LABEL}
          data-testid={testId ? `${testId}-archive-button` : undefined}
        >
          <Icon icon={Archive} size={iconSize} aria-hidden="true" />
        </Box>
        <Box
          as="button"
          type="button"
          onClick={onSettingsClick}
          className={SIDEBAR_ICON_BUTTON_CLASSES}
          aria-label={DEFAULT_SETTINGS_LABEL}
          data-testid={testId ? `${testId}-settings-button` : undefined}
        >
          <Icon icon={Settings} size={iconSize} aria-hidden="true" />
        </Box>
      </Box>
    </Box>
  );
});

// ============================================================================
// Sidebar Skeleton Component
// ============================================================================

/**
 * Sidebar skeleton for loading state
 */
export const SidebarSkeleton = forwardRef<HTMLDivElement, SidebarSkeletonProps>(
  function SidebarSkeleton(
    {
      taskCount = DEFAULT_SKELETON_TASK_COUNT,
      chatCount = DEFAULT_SKELETON_CHAT_COUNT,
      isCollapsed = false,
      size,
      className,
      'data-testid': testId,
      ...props
    },
    ref
  ) {
    const baseSize = getBaseSize(size);
    const paddingClasses = getResponsiveSizeClasses(size, SIDEBAR_PADDING_CLASSES);

    if (isCollapsed) {
      return (
        <Box
          ref={ref}
          role="presentation"
          aria-hidden={true}
          className={cn(SIDEBAR_BASE_CLASSES, SIDEBAR_WIDTH_CLASSES.collapsed, className)}
          data-testid={testId}
          data-collapsed="true"
          data-size={baseSize}
          {...props}
        >
          {/* Expand button skeleton */}
          <Box
            className={cn(
              'flex items-center justify-center border-b border-[rgb(var(--border))]',
              paddingClasses
            )}
          >
            <Skeleton className="h-11 w-11 rounded-md" />
          </Box>
          {/* Action buttons skeleton */}
          <Box className={cn('flex flex-1 flex-col items-center gap-1', paddingClasses)}>
            <Skeleton className="h-11 w-11 rounded-md" />
            <Skeleton className="h-11 w-11 rounded-md" />
          </Box>
          {/* Footer skeleton */}
          <Box
            className={cn(
              'flex flex-col items-center gap-1 border-t border-[rgb(var(--border))]',
              paddingClasses
            )}
          >
            <Skeleton className="h-11 w-11 rounded-md" />
            <Skeleton className="h-11 w-11 rounded-md" />
          </Box>
        </Box>
      );
    }

    return (
      <Box
        ref={ref}
        role="presentation"
        aria-hidden={true}
        className={cn(SIDEBAR_BASE_CLASSES, SIDEBAR_WIDTH_CLASSES.expanded, className)}
        data-testid={testId}
        data-collapsed="false"
        data-size={baseSize}
        data-task-count={taskCount}
        data-chat-count={chatCount}
        {...props}
      >
        {/* Header skeleton */}
        <Box className={cn(SIDEBAR_HEADER_CLASSES, paddingClasses)}>
          <Skeleton className="h-10 flex-1 rounded-md" />
          <Skeleton className="h-11 w-11 shrink-0 rounded-md" />
        </Box>

        {/* New task button skeleton */}
        <Box className={paddingClasses}>
          <Skeleton className="h-9 w-full rounded-md" />
        </Box>

        {/* Status filter skeleton */}
        <Box className={cn('border-b border-[rgb(var(--border))]', paddingClasses)}>
          <Box className="mb-2 flex items-center gap-2">
            <Skeleton className="h-3 w-3 rounded" />
            <Skeleton className="h-3 w-24" />
          </Box>
          <Box className="flex flex-col gap-0.5">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full rounded-md" />
            ))}
          </Box>
        </Box>

        {/* Tasks skeleton */}
        <Box className={cn(SIDEBAR_CONTENT_CLASSES, paddingClasses)}>
          <Box className="flex flex-col gap-2">
            {Array.from({ length: taskCount }).map((_, i) => (
              <Skeleton key={i} className="h-20 w-full rounded-lg" />
            ))}
          </Box>

          {/* Chats section skeleton */}
          <Box className="mt-4 border-t border-[rgb(var(--border))] pt-3">
            <Box className="mb-2 flex items-center gap-2">
              <Skeleton className="h-3 w-3 rounded" />
              <Skeleton className="h-3 w-3 rounded" />
              <Skeleton className="h-3 w-12" />
              <Skeleton className="ml-auto h-5 w-6 rounded-full" />
            </Box>
            <Box className="flex flex-col gap-1">
              {Array.from({ length: chatCount }).map((_, i) => (
                <Skeleton key={i} className="h-11 w-full rounded-md" />
              ))}
            </Box>
          </Box>
        </Box>

        {/* Footer skeleton */}
        <Box className={cn(SIDEBAR_FOOTER_CLASSES, paddingClasses)}>
          <Skeleton className="h-11 w-24 rounded-md" />
          <Skeleton className="h-11 w-24 rounded-md" />
        </Box>
      </Box>
    );
  }
);

// ============================================================================
// Main Component
// ============================================================================

/**
 * Sidebar component for main navigation with role="navigation" landmark.
 * Stateless - receives all data via props, emits actions via callbacks.
 *
 * Features:
 * - role="navigation" landmark for accessibility
 * - Project selector for switching between projects
 * - New task button for quick task creation
 * - Status filter with tablist pattern and keyboard navigation
 * - Task list showing tasks for the selected project
 * - Collapsible chats section
 * - Settings and Archive navigation links
 * - Collapsible to save screen space
 * - Screen reader announcements for state changes
 * - Touch targets ≥44px (WCAG 2.5.5)
 *
 * @example
 * <Sidebar
 *   projects={projects}
 *   tasks={tasks}
 *   chats={chats}
 *   selectedProjectId={currentProjectId}
 *   selectedTaskId={currentTaskId}
 *   statusFilter="all"
 *   onSelectProject={(id) => setCurrentProjectId(id)}
 *   onSelectTask={(id) => navigate(`/tasks/${id}`)}
 *   onSelectChat={(id) => navigate(`/chats/${id}`)}
 *   onNewTask={() => openNewTaskDialog()}
 *   onNewProject={() => openNewProjectDialog()}
 *   onStatusFilter={(status) => setStatusFilter(status)}
 *   onSettingsClick={() => navigate('/settings')}
 *   onArchiveClick={() => navigate('/archive')}
 *   isCollapsed={sidebarCollapsed}
 *   onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
 * />
 */
export const Sidebar = forwardRef<HTMLElement, SidebarProps>(function Sidebar(
  {
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
    onTaskContextMenu,
    onChatContextMenu,
    onViewAllChats,
    onSettingsClick,
    onArchiveClick,
    isCollapsed = false,
    onToggleCollapse,
    size,
    'aria-label': ariaLabel,
    'data-testid': testId,
    className,
    ...props
  },
  ref
) {
  const baseSize = getBaseSize(size);
  const iconSize = getIconSize(baseSize);
  const paddingClasses = getResponsiveSizeClasses(size, SIDEBAR_PADDING_CLASSES);

  // IDs for ARIA relationships
  const filterTablistId = useId();
  const tasksPanelId = useId();
  const chatsSectionId = useId();
  const chatsListId = useId();

  // Local state for collapsible sections
  const [isChatsExpanded, setIsChatsExpanded] = useState(true);

  // Track state for announcements
  const [announcement, setAnnouncement] = useState<string | null>(null);
  const prevCollapsedRef = useRef(isCollapsed);
  const prevFilterRef = useRef(statusFilter);
  const prevChatsExpandedRef = useRef(isChatsExpanded);

  // Ref for keyboard navigation in filter tablist
  const filterButtonsRef = useRef<HTMLButtonElement[]>([]);
  const [highlightedFilterIndex, setHighlightedFilterIndex] = useState<number>(-1);

  // Announce collapse state changes
  useEffect(() => {
    if (prevCollapsedRef.current !== isCollapsed) {
      prevCollapsedRef.current = isCollapsed;
      setAnnouncement(isCollapsed ? SR_SIDEBAR_COLLAPSED : SR_SIDEBAR_EXPANDED);
      const timer = setTimeout(() => setAnnouncement(null), 1000);
      return () => clearTimeout(timer);
    }
  }, [isCollapsed]);

  // Announce filter changes
  useEffect(() => {
    if (prevFilterRef.current !== statusFilter) {
      prevFilterRef.current = statusFilter;
      const taskCounts = getTaskCounts(tasks);
      setAnnouncement(buildFilterAnnouncement(statusFilter, taskCounts[statusFilter]));
      const timer = setTimeout(() => setAnnouncement(null), 1000);
      return () => clearTimeout(timer);
    }
  }, [statusFilter, tasks]);

  // Announce chats section toggle
  useEffect(() => {
    if (prevChatsExpandedRef.current !== isChatsExpanded) {
      prevChatsExpandedRef.current = isChatsExpanded;
      setAnnouncement(buildChatsSectionAnnouncement(isChatsExpanded, chats.length));
      const timer = setTimeout(() => setAnnouncement(null), 1000);
      return () => clearTimeout(timer);
    }
  }, [isChatsExpanded, chats.length]);

  // Handle keyboard navigation in filter tablist
  const handleFilterKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      const currentIndex = STATUS_FILTER_OPTIONS.findIndex((opt) => opt.value === statusFilter);
      let newIndex = currentIndex;

      switch (e.key) {
        case 'ArrowDown':
        case 'ArrowRight':
          e.preventDefault();
          newIndex = (currentIndex + 1) % STATUS_FILTER_OPTIONS.length;
          break;
        case 'ArrowUp':
        case 'ArrowLeft':
          e.preventDefault();
          newIndex =
            (currentIndex - 1 + STATUS_FILTER_OPTIONS.length) % STATUS_FILTER_OPTIONS.length;
          break;
        case 'Home':
          e.preventDefault();
          newIndex = 0;
          break;
        case 'End':
          e.preventDefault();
          newIndex = STATUS_FILTER_OPTIONS.length - 1;
          break;
        default:
          return;
      }

      if (newIndex !== currentIndex) {
        setHighlightedFilterIndex(newIndex);
        const option = STATUS_FILTER_OPTIONS[newIndex];
        if (option) {
          onStatusFilter?.(option.value);
        }
        filterButtonsRef.current[newIndex]?.focus();
      }
    },
    [statusFilter, onStatusFilter]
  );

  // Handle chats section toggle
  const handleChatsToggle = useCallback(() => {
    setIsChatsExpanded((prev) => !prev);
  }, []);

  // Render collapsed sidebar if collapsed
  if (isCollapsed) {
    return (
      <>
        {/* Screen reader announcement */}
        {announcement && (
          <VisuallyHidden>
            <Text as="span" role="status" aria-live="polite" aria-atomic="true">
              {announcement}
            </Text>
          </VisuallyHidden>
        )}
        <CollapsedSidebar
          ref={ref as React.Ref<HTMLElement>}
          onToggleCollapse={onToggleCollapse}
          onNewTask={onNewTask}
          onNewChat={onNewChat}
          onSettingsClick={onSettingsClick}
          onArchiveClick={onArchiveClick}
          size={size}
          aria-label={ariaLabel}
          data-testid={testId}
          className={className}
        />
      </>
    );
  }

  // Filter tasks by current status filter
  const filteredTasks = filterTasksByStatus(tasks, statusFilter);
  const taskCounts = getTaskCounts(tasks);

  return (
    <Box
      as="aside"
      ref={ref}
      role="navigation"
      aria-label={ariaLabel || DEFAULT_SIDEBAR_LABEL}
      className={cn(SIDEBAR_BASE_CLASSES, SIDEBAR_WIDTH_CLASSES.expanded, className)}
      data-testid={testId}
      data-collapsed="false"
      data-size={baseSize}
      data-filter={statusFilter}
      data-task-count={tasks.length}
      data-chat-count={chats.length}
      {...props}
    >
      {/* Screen reader announcement */}
      {announcement && (
        <VisuallyHidden>
          <Text as="span" role="status" aria-live="polite" aria-atomic="true">
            {announcement}
          </Text>
        </VisuallyHidden>
      )}

      {/* Header: Project selector and collapse button */}
      <Box className={cn(SIDEBAR_HEADER_CLASSES, paddingClasses)}>
        <ProjectSelector
          projects={projects}
          {...(selectedProjectId && { selectedProjectId })}
          {...(onSelectProject && { onSelectProject })}
          {...(onNewProject && { onNewProject })}
          className="flex-1"
          data-testid={testId ? `${testId}-project-selector` : undefined}
        />
        <Box
          as="button"
          type="button"
          onClick={onToggleCollapse}
          className={cn(SIDEBAR_ICON_BUTTON_CLASSES, 'h-11 w-11 shrink-0')}
          aria-label={DEFAULT_COLLAPSE_LABEL}
          aria-expanded={true}
          data-testid={testId ? `${testId}-collapse-button` : undefined}
        >
          <Icon icon={ChevronLeft} size={iconSize} aria-hidden="true" />
        </Box>
      </Box>

      {/* New task button */}
      <Box className={paddingClasses}>
        <Button
          variant="primary"
          size="sm"
          onClick={onNewTask}
          className="w-full"
          aria-label={DEFAULT_NEW_TASK_LABEL}
          data-testid={testId ? `${testId}-new-task-button` : undefined}
        >
          <Icon icon={Plus} size="sm" aria-hidden="true" />
          New Task
        </Button>
      </Box>

      {/* Status filter with tablist pattern */}
      <Box className={cn('border-b border-[rgb(var(--border))]', paddingClasses)}>
        <Box className="mb-2 flex items-center gap-2 text-xs font-medium text-[rgb(var(--muted-foreground))]">
          <Icon icon={ListFilter} size="xs" aria-hidden="true" />
          <Text as="span" id={filterTablistId}>
            {DEFAULT_FILTER_LABEL}
          </Text>
        </Box>
        <Box
          role="tablist"
          aria-labelledby={filterTablistId}
          aria-orientation="vertical"
          className={cn('flex flex-col', SIDEBAR_FILTER_GAP_CLASSES)}
          onKeyDown={handleFilterKeyDown}
          data-testid={testId ? `${testId}-filter-tablist` : undefined}
        >
          {STATUS_FILTER_OPTIONS.map((option, index) => (
            <StatusFilterButton
              key={option.value}
              filter={option.value}
              currentFilter={statusFilter}
              count={taskCounts[option.value]}
              onClick={() => onStatusFilter?.(option.value)}
              isHighlighted={highlightedFilterIndex === index}
              data-testid={testId ? `${testId}-filter-${option.value}` : undefined}
            />
          ))}
        </Box>
      </Box>

      {/* Scrollable content: Tasks and Chats */}
      <Box className={SIDEBAR_CONTENT_CLASSES}>
        {/* Task list */}
        <Box
          id={tasksPanelId}
          role="tabpanel"
          aria-labelledby={filterTablistId}
          className={paddingClasses}
          data-testid={testId ? `${testId}-tasks-panel` : undefined}
        >
          {filteredTasks.length > 0 ? (
            <Box
              as="ul"
              role="list"
              aria-label={`${getStatusFilterLabel(statusFilter)}, ${filteredTasks.length} ${filteredTasks.length === 1 ? 'task' : 'tasks'}`}
              className="flex flex-col gap-2"
              data-testid={testId ? `${testId}-tasks-list` : undefined}
            >
              {filteredTasks.map((task) => (
                <Box as="li" key={task.id} role="listitem">
                  <TaskCard
                    task={task}
                    isSelected={selectedTaskId === task.id}
                    {...(onSelectTask && { onSelect: onSelectTask })}
                    {...(onTaskStatusChange && { onStatusChange: onTaskStatusChange })}
                    {...(onTaskContextMenu && { onMoreClick: onTaskContextMenu })}
                    {...(onTaskContextMenu && { onContextMenu: onTaskContextMenu })}
                    data-testid={testId ? `${testId}-task-${task.id}` : undefined}
                  />
                </Box>
              ))}
            </Box>
          ) : (
            <EmptyState
              icon={ClipboardList}
              title={
                tasks.length === 0
                  ? DEFAULT_EMPTY_TASKS_TITLE
                  : `No ${statusFilter === 'all' ? '' : getStatusFilterLabel(statusFilter).toLowerCase()} tasks`
              }
              description={tasks.length === 0 ? DEFAULT_EMPTY_TASKS_DESCRIPTION : undefined}
              size="sm"
              data-testid={testId ? `${testId}-empty-tasks` : undefined}
            />
          )}
        </Box>

        {/* Chats section */}
        <Box
          id={chatsSectionId}
          className={cn('border-t border-[rgb(var(--border))]', paddingClasses)}
          data-testid={testId ? `${testId}-chats-section` : undefined}
        >
          {/* Collapsible header with View All link */}
          <Box className="mb-2 flex items-center gap-1">
            <Box
              as="button"
              type="button"
              onClick={handleChatsToggle}
              aria-expanded={isChatsExpanded}
              aria-controls={chatsListId}
              aria-label={`Chats section, ${chats.length} ${chats.length === 1 ? 'chat' : 'chats'}`}
              className={SIDEBAR_CHATS_HEADER_CLASSES}
              data-testid={testId ? `${testId}-chats-toggle` : undefined}
              data-state={isChatsExpanded ? 'expanded' : 'collapsed'}
            >
              <Icon
                icon={ChevronDown}
                size="xs"
                className={cn('motion-safe:transition-transform', !isChatsExpanded && '-rotate-90')}
                aria-hidden="true"
              />
              <Icon icon={MessageSquare} size="xs" aria-hidden="true" />
              <Text as="span">Chats</Text>
              <Text
                as="span"
                className="ml-auto rounded-full bg-[rgb(var(--muted))] px-1.5 py-0.5 text-xs"
                aria-hidden={true}
              >
                {chats.length}
              </Text>
            </Box>
            {/* View All link */}
            {onViewAllChats && chats.length > 0 && (
              <Box
                as="button"
                type="button"
                onClick={onViewAllChats}
                className={cn(
                  'rounded-md px-2 py-1 text-xs',
                  'text-[rgb(var(--primary))]',
                  'hover:bg-[rgb(var(--muted))]',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--ring))]'
                )}
                aria-label={DEFAULT_VIEW_ALL_CHATS_LABEL}
                data-testid={testId ? `${testId}-view-all-chats` : undefined}
              >
                View All
              </Box>
            )}
          </Box>

          {/* Chat list */}
          {isChatsExpanded && (
            <Box
              id={chatsListId}
              className="flex flex-col gap-1"
              data-testid={testId ? `${testId}-chats-list` : undefined}
            >
              {chats.length > 0 ? (
                <Box
                  as="ul"
                  role="list"
                  aria-label={`${chats.length} ${chats.length === 1 ? 'chat' : 'chats'}`}
                >
                  {chats.map((chat) => {
                    const isSelected = selectedChatId === chat.id;
                    const chatTitle = chat.title ?? 'Untitled Chat';

                    return (
                      <Box
                        as="li"
                        key={chat.id}
                        role="listitem"
                        className={cn(
                          SIDEBAR_CHAT_ITEM_CLASSES,
                          isSelected ? 'bg-[rgb(var(--accent))]' : 'hover:bg-[rgb(var(--muted))]'
                        )}
                        onContextMenu={(e) => {
                          e.preventDefault();
                          onChatContextMenu?.(chat.id, e);
                        }}
                        data-testid={testId ? `${testId}-chat-${chat.id}` : undefined}
                        data-selected={isSelected}
                      >
                        <Box
                          as="button"
                          type="button"
                          onClick={() => onSelectChat?.(chat.id)}
                          aria-label={buildChatAccessibleLabel(chat.title, isSelected)}
                          aria-current={isSelected ? 'true' : undefined}
                          className={cn(
                            SIDEBAR_CHAT_BUTTON_CLASSES,
                            isSelected
                              ? 'text-[rgb(var(--accent-foreground))]'
                              : 'text-[rgb(var(--muted-foreground))] hover:text-[rgb(var(--foreground))]'
                          )}
                          data-testid={testId ? `${testId}-chat-${chat.id}-button` : undefined}
                        >
                          <Icon
                            icon={MessageSquare}
                            size="xs"
                            className="shrink-0"
                            aria-hidden="true"
                          />
                          <Text as="span" className="truncate">
                            {chatTitle}
                          </Text>
                        </Box>
                        {/* More button for context menu */}
                        {onChatContextMenu && (
                          <Box
                            as="button"
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onChatContextMenu(chat.id, e);
                            }}
                            className={SIDEBAR_CHAT_MORE_BUTTON_CLASSES}
                            aria-label={`More actions for ${chatTitle}`}
                            data-testid={testId ? `${testId}-chat-${chat.id}-more` : undefined}
                          >
                            <Icon icon={MoreVertical} size="xs" aria-hidden="true" />
                          </Box>
                        )}
                      </Box>
                    );
                  })}
                </Box>
              ) : (
                <EmptyState
                  icon={MessageSquare}
                  title={DEFAULT_EMPTY_CHATS_TITLE}
                  size="sm"
                  data-testid={testId ? `${testId}-empty-chats` : undefined}
                />
              )}
              {/* New chat button */}
              <Box
                as="button"
                type="button"
                onClick={onNewChat}
                className={cn(
                  SIDEBAR_CHAT_BUTTON_CLASSES,
                  'text-[rgb(var(--primary))]',
                  'hover:bg-[rgb(var(--muted))]'
                )}
                aria-label={DEFAULT_NEW_CHAT_LABEL}
                data-testid={testId ? `${testId}-new-chat-button` : undefined}
              >
                <Icon icon={Plus} size="xs" aria-hidden="true" />
                <Text as="span">New Chat</Text>
              </Box>
            </Box>
          )}
        </Box>
      </Box>

      {/* Footer: Settings and Archive links */}
      <Box className={cn(SIDEBAR_FOOTER_CLASSES, paddingClasses)}>
        <Box
          as="button"
          type="button"
          onClick={onArchiveClick}
          className={SIDEBAR_FOOTER_BUTTON_CLASSES}
          aria-label={DEFAULT_ARCHIVE_LABEL}
          data-testid={testId ? `${testId}-archive-button` : undefined}
        >
          <Icon icon={Archive} size={iconSize} aria-hidden="true" />
          <Text as="span">Archive</Text>
        </Box>
        <Box
          as="button"
          type="button"
          onClick={onSettingsClick}
          className={SIDEBAR_FOOTER_BUTTON_CLASSES}
          aria-label={DEFAULT_SETTINGS_LABEL}
          data-testid={testId ? `${testId}-settings-button` : undefined}
        >
          <Icon icon={Settings} size={iconSize} aria-hidden="true" />
          <Text as="span">Settings</Text>
        </Box>
      </Box>
    </Box>
  );
});

Sidebar.displayName = 'Sidebar';
