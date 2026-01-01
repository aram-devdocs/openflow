/**
 * TaskLayout Template - Task detail page layout with header, tabs, and panel layout
 *
 * This template provides the structure for task detail pages with:
 * - A task header with title, status, and actions
 * - A branch indicator
 * - Tabs for switching between Steps, Changes, and Commits views
 * - A split pane layout with steps panel on left and main panel on right
 * - Collapsible mobile steps panel
 *
 * Accessibility features:
 * - Proper landmark structure (header, main, regions)
 * - Screen reader announcements for state changes
 * - Focus management with accessible controls
 * - Touch targets ≥44px (WCAG 2.5.5)
 * - Focus rings with ring-offset for visibility
 * - motion-safe transitions for reduced motion support
 * - Keyboard navigation for all interactive elements
 *
 * @example
 * <TaskLayout
 *   task={task}
 *   chats={chats}
 *   stepsPanel={<StepsPanel steps={steps} />}
 *   mainPanel={<ChatPanel messages={messages} />}
 *   tabs={tabs}
 *   activeTab={activeTab}
 *   onTabChange={setActiveTab}
 *   onStatusChange={handleStatusChange}
 *   onCreatePR={handleCreatePR}
 * />
 */

import type { Chat, Task, TaskStatus } from '@openflow/generated';
import {
  Header as HeaderPrimitive,
  Main,
  type ResponsiveValue,
  VisuallyHidden,
} from '@openflow/primitives';
import { cn } from '@openflow/utils';
import {
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  GitBranch,
  MoreHorizontal,
  Pencil,
} from 'lucide-react';
import {
  type HTMLAttributes,
  type KeyboardEvent,
  type ReactNode,
  forwardRef,
  useCallback,
  useId,
  useRef,
  useState,
} from 'react';
import { Badge, taskStatusToLabel, taskStatusToVariant } from '../atoms/Badge';
import { Button } from '../atoms/Button';
import { Icon } from '../atoms/Icon';
import { Skeleton } from '../atoms/Skeleton';
import { Dropdown, type DropdownOption } from '../molecules/Dropdown';
import { type Tab, Tabs } from '../molecules/Tabs';
import { Tooltip } from '../molecules/Tooltip';

// ============================================================================
// Types
// ============================================================================

export type TaskLayoutSize = 'sm' | 'md' | 'lg';
export type TaskLayoutBreakpoint = 'base' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

export interface TaskLayoutProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  /** The task being displayed */
  task: Task;
  /** Chats associated with this task */
  chats: Chat[];
  /** Callback when back button is clicked */
  onBack?: () => void;
  /** Content for the steps/sidebar panel */
  stepsPanel: ReactNode;
  /** Content for the main panel (chat interface) */
  mainPanel: ReactNode;
  /** Tabs configuration */
  tabs: Tab[];
  /** Currently active tab ID */
  activeTab: string;
  /** Callback when tab changes */
  onTabChange: (tabId: string) => void;
  /** Callback when status changes */
  onStatusChange?: (status: TaskStatus) => void;
  /** Callback when title is edited */
  onTitleChange?: (title: string) => void;
  /** Callback when title edit mode is toggled */
  onTitleEditToggle?: () => void;
  /** Whether title is currently being edited */
  isTitleEditing?: boolean;
  /** Title input value when editing */
  titleInputValue?: string;
  /** Callback when title input changes */
  onTitleInputChange?: (value: string) => void;
  /** Callback when title edit is submitted */
  onTitleEditSubmit?: () => void;
  /** Callback when title edit is cancelled */
  onTitleEditCancel?: () => void;
  /** Callback to create PR */
  onCreatePR?: () => void;
  /** Callback for more actions menu */
  onMoreActions?: () => void;
  /** Content for the current tab panel (below tabs) */
  tabContent?: ReactNode;
  /** Width of the steps panel (left side) */
  stepsPanelWidth?: string;
  /** Whether the task is loading */
  isLoading?: boolean;
  /** Size variant (affects padding and spacing) */
  size?: ResponsiveValue<TaskLayoutSize>;
  /** Accessible label for the header region */
  headerLabel?: string;
  /** Accessible label for the main content region */
  mainLabel?: string;
  /** Accessible label for the steps panel region */
  stepsPanelLabel?: string;
  /** Additional CSS classes */
  className?: string;
  /** Data attributes for testing */
  'data-testid'?: string;
}

export interface TaskLayoutSkeletonProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  /** Size variant (affects padding and spacing) */
  size?: ResponsiveValue<TaskLayoutSize>;
  /** Accessible label for the loading skeleton */
  loadingLabel?: string;
  /** Data attributes for testing */
  'data-testid'?: string;
}

// ============================================================================
// Constants
// ============================================================================

/**
 * Breakpoint order for responsive class generation
 */
const BREAKPOINT_ORDER: readonly TaskLayoutBreakpoint[] = [
  'base',
  'sm',
  'md',
  'lg',
  'xl',
  '2xl',
] as const;

/**
 * Status options for the dropdown
 */
export const STATUS_OPTIONS: DropdownOption[] = [
  { value: 'todo', label: 'To Do' },
  { value: 'inprogress', label: 'In Progress' },
  { value: 'inreview', label: 'In Review' },
  { value: 'done', label: 'Done' },
  { value: 'cancelled', label: 'Cancelled' },
];

/**
 * Default header label for screen readers
 */
export const DEFAULT_HEADER_LABEL = 'Task header';

/**
 * Default main content label for screen readers
 */
export const DEFAULT_MAIN_LABEL = 'Task content';

/**
 * Default steps panel label for screen readers
 */
export const DEFAULT_STEPS_PANEL_LABEL = 'Workflow steps';

/**
 * Default steps panel width
 */
export const DEFAULT_STEPS_PANEL_WIDTH = '320px';

/**
 * Screen reader announcement for loading state
 */
export const SR_LOADING = 'Loading task details...';

/**
 * Screen reader announcement when steps panel expands
 */
export const SR_STEPS_EXPANDED = 'Workflow steps panel expanded';

/**
 * Screen reader announcement when steps panel collapses
 */
export const SR_STEPS_COLLAPSED = 'Workflow steps panel collapsed';

/**
 * Screen reader announcement for tab change
 */
export const SR_TAB_CHANGED = 'Switched to';

/**
 * Screen reader announcement for title edit mode
 */
export const SR_TITLE_EDITING = 'Editing task title. Press Enter to save, Escape to cancel.';

/**
 * Screen reader announcement for title saved
 */
export const SR_TITLE_SAVED = 'Task title saved';

/**
 * Screen reader announcement for status change
 */
export const SR_STATUS_CHANGED = 'Task status changed to';

/**
 * Screen reader label for back button
 */
export const DEFAULT_BACK_LABEL = 'Go back to task list';

/**
 * Screen reader label for edit title button
 */
export const DEFAULT_EDIT_TITLE_LABEL = 'Edit task title';

/**
 * Screen reader label for more actions button
 */
export const DEFAULT_MORE_ACTIONS_LABEL = 'More actions';

/**
 * Screen reader label for create PR button
 */
export const DEFAULT_CREATE_PR_LABEL = 'Create pull request';

/**
 * Base classes for the task layout container
 */
export const TASK_LAYOUT_CONTAINER_CLASSES = [
  'flex h-full flex-col',
  'bg-[rgb(var(--background))]',
].join(' ');

/**
 * Size-based padding classes
 */
export const TASK_LAYOUT_SIZE_CLASSES: Record<
  TaskLayoutSize,
  {
    headerPadding: string;
    tabsPadding: string;
    stepsPanelWidth: string;
  }
> = {
  sm: {
    headerPadding: 'px-2 py-1.5 md:px-3 md:py-2',
    tabsPadding: 'px-2 md:px-3',
    stepsPanelWidth: '280px',
  },
  md: {
    headerPadding: 'px-3 py-2 md:px-4 md:py-3',
    tabsPadding: 'px-3 md:px-4',
    stepsPanelWidth: '320px',
  },
  lg: {
    headerPadding: 'px-4 py-3 md:px-6 md:py-4',
    tabsPadding: 'px-4 md:px-6',
    stepsPanelWidth: '360px',
  },
};

/**
 * Classes for the task header
 */
export const TASK_LAYOUT_HEADER_CLASSES = ['shrink-0 border-b border-[rgb(var(--border))]'].join(
  ' '
);

/**
 * Classes for the header row
 */
export const TASK_LAYOUT_HEADER_ROW_CLASSES = [
  'flex flex-col gap-2',
  'md:flex-row md:items-center md:justify-between md:gap-4',
].join(' ');

/**
 * Classes for the left side of header
 */
export const TASK_LAYOUT_HEADER_LEFT_CLASSES = [
  'flex min-w-0 flex-1 items-center gap-2 md:gap-3',
].join(' ');

/**
 * Classes for the right side of header
 */
export const TASK_LAYOUT_HEADER_RIGHT_CLASSES = ['flex items-center gap-2 overflow-x-auto'].join(
  ' '
);

/**
 * Classes for the title display
 */
export const TASK_LAYOUT_TITLE_CLASSES = [
  'truncate text-base font-semibold',
  'text-[rgb(var(--foreground))]',
  'md:text-lg',
].join(' ');

/**
 * Classes for the title input
 */
export const TASK_LAYOUT_TITLE_INPUT_CLASSES = [
  'flex-1 min-w-0 px-2 py-1 text-base font-semibold md:text-lg',
  'bg-[rgb(var(--background))] text-[rgb(var(--foreground))]',
  'border border-[rgb(var(--ring))] rounded-md',
  'focus:outline-none focus:ring-2 focus:ring-[rgb(var(--ring))]',
  'focus:ring-offset-2 focus:ring-offset-[rgb(var(--background))]',
].join(' ');

/**
 * Classes for the edit title button
 */
export const TASK_LAYOUT_EDIT_TITLE_BUTTON_CLASSES = [
  'p-1 rounded opacity-0 group-hover:opacity-100',
  'min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0', // Touch target on mobile
  'text-[rgb(var(--muted-foreground))]',
  'hover:text-[rgb(var(--foreground))]',
  'hover:bg-[rgb(var(--muted))]',
  'motion-safe:transition-opacity motion-safe:duration-150',
  'focus-visible:opacity-100',
  'focus-visible:outline-none focus-visible:ring-2',
  'focus-visible:ring-[rgb(var(--ring))]',
  'focus-visible:ring-offset-2 focus-visible:ring-offset-[rgb(var(--background))]',
].join(' ');

/**
 * Classes for the branch indicator container
 */
export const TASK_LAYOUT_BRANCH_CLASSES = [
  'hidden items-center gap-1.5 px-2 py-1 rounded-md',
  'bg-[rgb(var(--muted))] text-sm sm:flex',
].join(' ');

/**
 * Classes for the tabs container
 */
export const TASK_LAYOUT_TABS_CLASSES = [
  'shrink-0 overflow-x-auto scrollbar-hidden',
  'border-b border-[rgb(var(--border))]',
].join(' ');

/**
 * Classes for the main content area
 */
export const TASK_LAYOUT_MAIN_CLASSES = ['flex min-h-0 flex-1 flex-col lg:flex-row'].join(' ');

/**
 * Classes for mobile steps toggle button
 */
export const TASK_LAYOUT_MOBILE_STEPS_TOGGLE_CLASSES = [
  'flex w-full items-center justify-between',
  'px-4 py-3 min-h-[48px]', // Touch target
  'border-b border-[rgb(var(--border))]',
  'bg-[rgb(var(--surface-1))]',
  'text-sm font-medium text-[rgb(var(--foreground))]',
  'focus-visible:outline-none focus-visible:ring-2',
  'focus-visible:ring-[rgb(var(--ring))]',
  'focus-visible:ring-offset-2 focus-visible:ring-offset-[rgb(var(--background))]',
  'motion-safe:transition-colors motion-safe:duration-150',
].join(' ');

/**
 * Classes for mobile steps panel
 */
export const TASK_LAYOUT_MOBILE_STEPS_PANEL_CLASSES = [
  'max-h-64 overflow-y-auto scrollbar-thin',
  'border-b border-[rgb(var(--border))]',
].join(' ');

/**
 * Classes for desktop steps panel
 */
export const TASK_LAYOUT_DESKTOP_STEPS_PANEL_CLASSES = [
  'hidden shrink-0 border-r border-[rgb(var(--border))]',
  'overflow-y-auto scrollbar-thin lg:block',
].join(' ');

/**
 * Classes for the main panel
 */
export const TASK_LAYOUT_MAIN_PANEL_CLASSES = [
  'flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden',
].join(' ');

/**
 * Classes for tab content panel
 */
export const TASK_LAYOUT_TAB_CONTENT_CLASSES = ['flex-1 overflow-auto scrollbar-thin'].join(' ');

/**
 * Classes for loading overlay
 */
export const TASK_LAYOUT_LOADING_OVERLAY_CLASSES = [
  'absolute inset-0 flex items-center justify-center z-10',
  'bg-[rgb(var(--background))]/80 backdrop-blur-sm',
].join(' ');

/**
 * Classes for loading spinner
 */
export const TASK_LAYOUT_LOADING_SPINNER_CLASSES = [
  'h-5 w-5 motion-safe:animate-spin rounded-full',
  'border-2 border-current border-t-transparent',
].join(' ');

/**
 * Classes for icon-only button
 */
export const TASK_LAYOUT_ICON_BUTTON_CLASSES = [
  'h-8 w-8 shrink-0 p-0',
  'min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0', // Touch target on mobile
].join(' ');

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Get base size from responsive value
 */
export function getBaseSize(size: ResponsiveValue<TaskLayoutSize> | undefined): TaskLayoutSize {
  if (size === undefined) {
    return 'md';
  }

  if (typeof size === 'string') {
    return size;
  }

  if (typeof size === 'object' && size !== null) {
    const sizeObj = size as Partial<Record<TaskLayoutBreakpoint, TaskLayoutSize>>;
    // Return base if specified, otherwise first defined value, otherwise default
    if (sizeObj.base) return sizeObj.base;
    for (const bp of BREAKPOINT_ORDER) {
      if (sizeObj[bp]) return sizeObj[bp] as TaskLayoutSize;
    }
  }

  return 'md';
}

/**
 * Generate responsive size classes for a specific property
 */
export function getResponsiveSizeClasses(
  size: ResponsiveValue<TaskLayoutSize> | undefined,
  property: keyof typeof TASK_LAYOUT_SIZE_CLASSES.md
): string {
  const baseSize = getBaseSize(size);
  return TASK_LAYOUT_SIZE_CLASSES[baseSize][property];
}

/**
 * Get the current branch name from chats
 */
export function getCurrentBranch(chats: Chat[]): string | null {
  // Find the main chat or first chat with a branch
  const mainChat = chats.find((chat) => chat.chatRole === 'main');
  if (mainChat?.branch) return mainChat.branch;

  // Fallback to any chat with a branch
  const chatWithBranch = chats.find((chat) => chat.branch);
  return chatWithBranch?.branch ?? null;
}

/**
 * Build accessible label for task header
 */
export function buildTaskHeaderAccessibleLabel(
  title: string,
  status: TaskStatus,
  actionsRequired: number
): string {
  const statusLabel = taskStatusToLabel(status);
  const parts = [`Task: ${title}`, `Status: ${statusLabel}`];

  if (actionsRequired > 0) {
    parts.push(`${actionsRequired} action${actionsRequired > 1 ? 's' : ''} required`);
  }

  return parts.join('. ');
}

/**
 * Build screen reader announcement for steps panel toggle
 */
export function buildStepsPanelAnnouncement(isCollapsed: boolean): string {
  return isCollapsed ? SR_STEPS_COLLAPSED : SR_STEPS_EXPANDED;
}

/**
 * Build screen reader announcement for tab change
 */
export function buildTabChangeAnnouncement(tabLabel: string): string {
  return `${SR_TAB_CHANGED} ${tabLabel} tab`;
}

/**
 * Build screen reader announcement for status change
 */
export function buildStatusChangeAnnouncement(status: TaskStatus): string {
  const statusLabel = taskStatusToLabel(status);
  return `${SR_STATUS_CHANGED} ${statusLabel}`;
}

/**
 * Get the ID for the steps panel element
 */
export function getStepsPanelId(prefix: string): string {
  return `${prefix}-steps-panel`;
}

/**
 * Get the ID for the main panel element
 */
export function getMainPanelId(prefix: string): string {
  return `${prefix}-main-panel`;
}

// ============================================================================
// TaskLayoutSkeleton Component
// ============================================================================

/**
 * Skeleton loading state for TaskLayout
 */
export const TaskLayoutSkeleton = forwardRef<HTMLDivElement, TaskLayoutSkeletonProps>(
  function TaskLayoutSkeleton(
    { size = 'md', loadingLabel = SR_LOADING, className, 'data-testid': dataTestId, ...props },
    ref
  ) {
    const baseSize = getBaseSize(size);
    const sizeClasses = TASK_LAYOUT_SIZE_CLASSES[baseSize];

    return (
      <div
        ref={ref}
        className={cn(TASK_LAYOUT_CONTAINER_CLASSES, className)}
        role="status"
        aria-busy="true"
        aria-label={loadingLabel}
        data-testid={dataTestId}
        data-size={baseSize}
        {...props}
      >
        {/* Screen reader announcement */}
        <VisuallyHidden>
          <span aria-live="polite">{loadingLabel}</span>
        </VisuallyHidden>

        {/* Header skeleton */}
        <div className={cn(TASK_LAYOUT_HEADER_CLASSES, sizeClasses.headerPadding)}>
          <div className={TASK_LAYOUT_HEADER_ROW_CLASSES}>
            <div className={TASK_LAYOUT_HEADER_LEFT_CLASSES}>
              <Skeleton variant="rectangular" width={32} height={32} className="rounded-md" />
              <Skeleton variant="text" width="40%" height={24} />
              <Skeleton variant="rectangular" width={100} height={32} className="rounded-md" />
            </div>
            <div className={TASK_LAYOUT_HEADER_RIGHT_CLASSES}>
              <Skeleton
                variant="rectangular"
                width={120}
                height={32}
                className="rounded-md hidden sm:block"
              />
              <Skeleton variant="rectangular" width={80} height={32} className="rounded-md" />
              <Skeleton variant="rectangular" width={32} height={32} className="rounded-md" />
            </div>
          </div>
        </div>

        {/* Tabs skeleton */}
        <div className={cn(TASK_LAYOUT_TABS_CLASSES, sizeClasses.tabsPadding)}>
          <div className="flex gap-4 py-2">
            <Skeleton variant="text" width={60} height={24} />
            <Skeleton variant="text" width={80} height={24} />
            <Skeleton variant="text" width={70} height={24} />
          </div>
        </div>

        {/* Main content skeleton */}
        <div className={TASK_LAYOUT_MAIN_CLASSES}>
          {/* Steps panel skeleton (desktop) */}
          <div
            className={TASK_LAYOUT_DESKTOP_STEPS_PANEL_CLASSES}
            style={{ width: sizeClasses.stepsPanelWidth }}
          >
            <div className="p-4 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-start gap-3">
                  <Skeleton variant="circular" width={24} height={24} />
                  <div className="flex-1 space-y-1">
                    <Skeleton variant="text" width="80%" height={16} />
                    <Skeleton variant="text" width="60%" height={12} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Main panel skeleton */}
          <div className={TASK_LAYOUT_MAIN_PANEL_CLASSES}>
            <div className="flex-1 p-4 space-y-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className={i % 2 === 0 ? 'flex justify-end' : 'flex justify-start'}>
                  <Skeleton
                    variant="rectangular"
                    width="70%"
                    height={i % 2 === 0 ? 60 : 100}
                    className="rounded-lg"
                  />
                </div>
              ))}
            </div>
            {/* Input skeleton */}
            <div className="border-t border-[rgb(var(--border))] p-4">
              <Skeleton variant="rectangular" width="100%" height={44} className="rounded-md" />
            </div>
          </div>
        </div>
      </div>
    );
  }
);

TaskLayoutSkeleton.displayName = 'TaskLayoutSkeleton';

// ============================================================================
// TaskLayout Component
// ============================================================================

/**
 * TaskLayout is the task detail page layout template.
 * Stateless - receives all content via props.
 *
 * It provides the structure for the task detail view with:
 * - A task header with title, status, and actions
 * - A branch indicator
 * - Tabs for switching between Steps, Changes, and Commits views
 * - A split pane layout with steps panel on left and main panel on right
 *
 * The layout adapts to show different content based on the active tab.
 */
export const TaskLayout = forwardRef<HTMLDivElement, TaskLayoutProps>(function TaskLayout(
  {
    task,
    chats,
    onBack,
    stepsPanel,
    mainPanel,
    tabs,
    activeTab,
    onTabChange,
    onStatusChange,
    onTitleChange: _onTitleChange,
    onTitleEditToggle,
    isTitleEditing = false,
    titleInputValue,
    onTitleInputChange,
    onTitleEditSubmit,
    onTitleEditCancel,
    onCreatePR,
    onMoreActions,
    tabContent,
    stepsPanelWidth,
    isLoading = false,
    size = 'md',
    headerLabel = DEFAULT_HEADER_LABEL,
    mainLabel = DEFAULT_MAIN_LABEL,
    stepsPanelLabel = DEFAULT_STEPS_PANEL_LABEL,
    className,
    'data-testid': dataTestId,
    ...props
  },
  ref
) {
  const id = useId();
  const currentBranch = getCurrentBranch(chats);
  const hasChanges = task.actionsRequiredCount > 0;

  // Mobile steps panel collapse state
  const [isStepsPanelCollapsed, setIsStepsPanelCollapsed] = useState(true);
  const previousStepsPanelState = useRef(isStepsPanelCollapsed);
  const previousTabRef = useRef(activeTab);
  const previousStatusRef = useRef(task.status);
  const titleInputRef = useRef<HTMLInputElement>(null);

  // Track state changes for announcements
  const [announcement, setAnnouncement] = useState<string | null>(null);

  // Get size-based classes
  const baseSize = getBaseSize(size);
  const sizeClasses = TASK_LAYOUT_SIZE_CLASSES[baseSize];
  const effectiveStepsPanelWidth = stepsPanelWidth ?? sizeClasses.stepsPanelWidth;

  // Generate IDs
  const stepsPanelId = getStepsPanelId(id);
  const mainPanelId = getMainPanelId(id);
  const titleInputId = `${id}-title-input`;
  const statusDropdownId = `${id}-status-dropdown`;

  // Handle steps panel toggle
  const handleStepsPanelToggle = useCallback(() => {
    setIsStepsPanelCollapsed((prev) => {
      const newState = !prev;
      setAnnouncement(buildStepsPanelAnnouncement(newState));
      return newState;
    });
  }, []);

  // Handle tab change with announcement
  const handleTabChange = useCallback(
    (tabId: string) => {
      const tab = tabs.find((t) => t.id === tabId);
      if (tab && tabId !== activeTab) {
        setAnnouncement(buildTabChangeAnnouncement(tab.label));
        onTabChange(tabId);
      }
    },
    [tabs, activeTab, onTabChange]
  );

  // Handle status change with announcement
  const handleStatusChange = useCallback(
    (status: TaskStatus) => {
      if (status !== task.status && onStatusChange) {
        setAnnouncement(buildStatusChangeAnnouncement(status));
        onStatusChange(status);
      }
    },
    [task.status, onStatusChange]
  );

  // Handle title edit key events
  const handleTitleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        onTitleEditSubmit?.();
        setAnnouncement(SR_TITLE_SAVED);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onTitleEditCancel?.();
      }
    },
    [onTitleEditSubmit, onTitleEditCancel]
  );

  // Handle title edit toggle
  const handleTitleEditToggle = useCallback(() => {
    onTitleEditToggle?.();
    if (!isTitleEditing) {
      setAnnouncement(SR_TITLE_EDITING);
    }
  }, [onTitleEditToggle, isTitleEditing]);

  // Clear announcement after it's been read
  if (announcement) {
    setTimeout(() => setAnnouncement(null), 1000);
  }

  // Update refs
  previousStepsPanelState.current = isStepsPanelCollapsed;
  previousTabRef.current = activeTab;
  previousStatusRef.current = task.status;

  // Build accessible header label
  const headerAccessibleLabel = buildTaskHeaderAccessibleLabel(
    task.title,
    task.status,
    task.actionsRequiredCount
  );

  return (
    <div
      ref={ref}
      className={cn(TASK_LAYOUT_CONTAINER_CLASSES, className)}
      data-testid={dataTestId}
      data-size={baseSize}
      data-task-id={task.id}
      data-task-status={task.status}
      data-loading={isLoading || undefined}
      {...props}
    >
      {/* Screen reader announcements */}
      {announcement && (
        <VisuallyHidden>
          <span role="status" aria-live="polite" aria-atomic="true">
            {announcement}
          </span>
        </VisuallyHidden>
      )}

      {/* Task Header */}
      <HeaderPrimitive
        aria-label={headerLabel}
        className={cn(TASK_LAYOUT_HEADER_CLASSES, sizeClasses.headerPadding)}
        data-testid={dataTestId ? `${dataTestId}-header` : undefined}
      >
        {/* Accessible description for screen readers */}
        <VisuallyHidden>{headerAccessibleLabel}</VisuallyHidden>

        <div className={TASK_LAYOUT_HEADER_ROW_CLASSES}>
          {/* Left side: Back button, Title and status */}
          <div className={TASK_LAYOUT_HEADER_LEFT_CLASSES}>
            {/* Back button */}
            {onBack && (
              <Tooltip content="Go back">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onBack}
                  className={TASK_LAYOUT_ICON_BUTTON_CLASSES}
                  aria-label={DEFAULT_BACK_LABEL}
                  data-testid={dataTestId ? `${dataTestId}-back-button` : undefined}
                >
                  <Icon icon={ArrowLeft} size="sm" aria-hidden="true" />
                </Button>
              </Tooltip>
            )}

            {/* Title - editable */}
            {isTitleEditing ? (
              <>
                <input
                  ref={titleInputRef}
                  id={titleInputId}
                  type="text"
                  value={titleInputValue ?? task.title}
                  onChange={(e) => onTitleInputChange?.(e.target.value)}
                  onKeyDown={handleTitleKeyDown}
                  onBlur={() => onTitleEditCancel?.()}
                  // biome-ignore lint/a11y/noAutofocus: Required for edit mode UX
                  autoFocus
                  className={TASK_LAYOUT_TITLE_INPUT_CLASSES}
                  aria-label="Task title"
                  aria-describedby={`${titleInputId}-instructions`}
                  data-testid={dataTestId ? `${dataTestId}-title-input` : undefined}
                />
                <span id={`${titleInputId}-instructions`} className="sr-only">
                  Press Enter to save, Escape to cancel
                </span>
              </>
            ) : (
              <div className="flex min-w-0 items-center gap-2 group">
                <h1
                  className={TASK_LAYOUT_TITLE_CLASSES}
                  title={task.title}
                  data-testid={dataTestId ? `${dataTestId}-title` : undefined}
                >
                  {task.title}
                </h1>
                {onTitleEditToggle && (
                  <button
                    type="button"
                    onClick={handleTitleEditToggle}
                    className={TASK_LAYOUT_EDIT_TITLE_BUTTON_CLASSES}
                    aria-label={DEFAULT_EDIT_TITLE_LABEL}
                    data-testid={dataTestId ? `${dataTestId}-edit-title-button` : undefined}
                  >
                    <Icon icon={Pencil} size="sm" aria-hidden="true" />
                  </button>
                )}
              </div>
            )}

            {/* Status dropdown - shrink on mobile */}
            {onStatusChange ? (
              <Dropdown
                id={statusDropdownId}
                options={STATUS_OPTIONS}
                value={task.status}
                onChange={(value) => handleStatusChange(value as TaskStatus)}
                aria-label="Task status"
                className="w-28 md:w-36"
                data-testid={dataTestId ? `${dataTestId}-status-dropdown` : undefined}
              />
            ) : (
              <Badge
                variant={taskStatusToVariant(task.status)}
                data-testid={dataTestId ? `${dataTestId}-status-badge` : undefined}
              >
                {taskStatusToLabel(task.status)}
              </Badge>
            )}

            {/* Actions required indicator */}
            {hasChanges && (
              <Tooltip
                content={`${task.actionsRequiredCount} action${task.actionsRequiredCount > 1 ? 's' : ''} required`}
              >
                <Badge
                  variant="warning"
                  aria-label={`${task.actionsRequiredCount} actions required`}
                  data-testid={dataTestId ? `${dataTestId}-actions-required` : undefined}
                >
                  {task.actionsRequiredCount}
                </Badge>
              </Tooltip>
            )}
          </div>

          {/* Right side: Branch and actions */}
          <div className={TASK_LAYOUT_HEADER_RIGHT_CLASSES}>
            {/* Branch indicator - hidden on mobile, shown on tablet+ */}
            {currentBranch && (
              <Tooltip content={`Branch: ${currentBranch}`}>
                <div
                  className={TASK_LAYOUT_BRANCH_CLASSES}
                  data-testid={dataTestId ? `${dataTestId}-branch` : undefined}
                >
                  <Icon
                    icon={GitBranch}
                    size="sm"
                    aria-hidden="true"
                    className="text-[rgb(var(--muted-foreground))]"
                  />
                  <span
                    className="max-w-[100px] truncate text-[rgb(var(--foreground))] md:max-w-[150px]"
                    aria-label={`Git branch: ${currentBranch}`}
                  >
                    {currentBranch}
                  </span>
                </div>
              </Tooltip>
            )}

            {/* Create PR button - icon only on mobile */}
            {onCreatePR && currentBranch && (
              <Tooltip content="Create Pull Request">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={onCreatePR}
                  aria-label={DEFAULT_CREATE_PR_LABEL}
                  data-testid={dataTestId ? `${dataTestId}-create-pr-button` : undefined}
                >
                  <Icon icon={ExternalLink} size="sm" aria-hidden="true" />
                  <span className="hidden sm:inline">Create PR</span>
                </Button>
              </Tooltip>
            )}

            {/* More actions */}
            {onMoreActions && (
              <Tooltip content="More actions">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onMoreActions}
                  className={TASK_LAYOUT_ICON_BUTTON_CLASSES}
                  aria-label={DEFAULT_MORE_ACTIONS_LABEL}
                  data-testid={dataTestId ? `${dataTestId}-more-actions-button` : undefined}
                >
                  <Icon icon={MoreHorizontal} size="sm" aria-hidden="true" />
                </Button>
              </Tooltip>
            )}
          </div>
        </div>
      </HeaderPrimitive>

      {/* Tabs */}
      <div
        className={cn(TASK_LAYOUT_TABS_CLASSES, sizeClasses.tabsPadding)}
        data-testid={dataTestId ? `${dataTestId}-tabs-container` : undefined}
      >
        <Tabs
          tabs={tabs}
          activeTab={activeTab}
          onTabChange={handleTabChange}
          variant="underline"
          size="sm"
          data-testid={dataTestId ? `${dataTestId}-tabs` : undefined}
        />
      </div>

      {/* Main content area */}
      <Main
        aria-label={mainLabel}
        className={TASK_LAYOUT_MAIN_CLASSES}
        data-testid={dataTestId ? `${dataTestId}-main` : undefined}
      >
        {/* Steps panel - collapsible on mobile, sidebar on desktop */}
        {activeTab === 'steps' && (
          <>
            {/* Mobile: Collapsible steps header */}
            <div className="lg:hidden">
              <button
                type="button"
                onClick={handleStepsPanelToggle}
                className={TASK_LAYOUT_MOBILE_STEPS_TOGGLE_CLASSES}
                aria-expanded={!isStepsPanelCollapsed}
                aria-controls={stepsPanelId}
                data-testid={dataTestId ? `${dataTestId}-mobile-steps-toggle` : undefined}
              >
                <span>{stepsPanelLabel}</span>
                <Icon
                  icon={isStepsPanelCollapsed ? ChevronDown : ChevronUp}
                  size="sm"
                  aria-hidden="true"
                  className="text-[rgb(var(--muted-foreground))]"
                />
              </button>

              {/* Mobile steps panel - collapsible */}
              {!isStepsPanelCollapsed && (
                <div
                  id={stepsPanelId}
                  role="region"
                  aria-label={stepsPanelLabel}
                  className={TASK_LAYOUT_MOBILE_STEPS_PANEL_CLASSES}
                  data-testid={dataTestId ? `${dataTestId}-mobile-steps-panel` : undefined}
                >
                  {stepsPanel}
                </div>
              )}
            </div>

            {/* Desktop: Fixed sidebar */}
            <aside
              id={`${stepsPanelId}-desktop`}
              aria-label={stepsPanelLabel}
              className={TASK_LAYOUT_DESKTOP_STEPS_PANEL_CLASSES}
              style={{ width: effectiveStepsPanelWidth }}
              data-testid={dataTestId ? `${dataTestId}-desktop-steps-panel` : undefined}
            >
              {stepsPanel}
            </aside>

            {/* Main panel (right side on desktop, below steps on mobile) */}
            <div
              id={mainPanelId}
              className={TASK_LAYOUT_MAIN_PANEL_CLASSES}
              data-testid={dataTestId ? `${dataTestId}-main-panel` : undefined}
            >
              {mainPanel}
            </div>
          </>
        )}

        {/* Tab content for other tabs (Changes, Commits) */}
        {activeTab !== 'steps' && (
          <div
            role="tabpanel"
            aria-labelledby={`tab-${activeTab}`}
            className={TASK_LAYOUT_TAB_CONTENT_CLASSES}
            data-testid={dataTestId ? `${dataTestId}-tab-content` : undefined}
          >
            {tabContent}
          </div>
        )}
      </Main>

      {/* Loading overlay */}
      {isLoading && (
        <div
          className={TASK_LAYOUT_LOADING_OVERLAY_CLASSES}
          role="status"
          aria-live="polite"
          data-testid={dataTestId ? `${dataTestId}-loading-overlay` : undefined}
        >
          <div className="flex items-center gap-2 text-[rgb(var(--muted-foreground))]">
            <div className={TASK_LAYOUT_LOADING_SPINNER_CLASSES} aria-hidden="true" />
            <span>Loading task...</span>
          </div>
          {/* Screen reader announcement */}
          <VisuallyHidden>{SR_LOADING}</VisuallyHidden>
        </div>
      )}
    </div>
  );
});

// ============================================================================
// Display Names
// ============================================================================

TaskLayout.displayName = 'TaskLayout';
