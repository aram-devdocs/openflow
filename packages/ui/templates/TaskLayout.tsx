import type { Chat, Task, TaskStatus } from '@openflow/generated';
import { cn } from '@openflow/utils';
import {
  ChevronDown,
  ChevronUp,
  ExternalLink,
  GitBranch,
  MoreHorizontal,
  Pencil,
} from 'lucide-react';
import type { ReactNode } from 'react';
import { useState } from 'react';
import { Badge, taskStatusToLabel, taskStatusToVariant } from '../atoms/Badge';
import { Button } from '../atoms/Button';
import { Icon } from '../atoms/Icon';
import { Dropdown, type DropdownOption } from '../molecules/Dropdown';
import { type Tab, Tabs } from '../molecules/Tabs';
import { Tooltip } from '../molecules/Tooltip';

export interface TaskLayoutProps {
  /** The task being displayed */
  task: Task;
  /** Chats associated with this task */
  chats: Chat[];
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
  /** Additional CSS classes */
  className?: string;
}

/** Status options for the dropdown */
const STATUS_OPTIONS: DropdownOption[] = [
  { value: 'todo', label: 'To Do' },
  { value: 'inprogress', label: 'In Progress' },
  { value: 'inreview', label: 'In Review' },
  { value: 'done', label: 'Done' },
  { value: 'cancelled', label: 'Cancelled' },
];

/**
 * Get the current branch name from chats
 */
function getCurrentBranch(chats: Chat[]): string | null {
  // Find the main chat or first chat with a branch
  const mainChat = chats.find((chat) => chat.chatRole === 'main');
  if (mainChat?.branch) return mainChat.branch;

  // Fallback to any chat with a branch
  const chatWithBranch = chats.find((chat) => chat.branch);
  return chatWithBranch?.branch ?? null;
}

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
 *
 * @example
 * <TaskLayout
 *   task={task}
 *   chats={chats}
 *   stepsPanel={<StepsPanel steps={steps} />}
 *   mainPanel={<ChatPanel messages={messages} />}
 *   tabs={[
 *     { id: 'steps', label: 'Steps', icon: ListTodo },
 *     { id: 'changes', label: 'Changes', badge: 5 },
 *     { id: 'commits', label: 'Commits' },
 *   ]}
 *   activeTab={activeTab}
 *   onTabChange={setActiveTab}
 *   onStatusChange={handleStatusChange}
 *   onCreatePR={handleCreatePR}
 *   tabContent={
 *     <TabPanel tabId="changes" activeTab={activeTab}>
 *       <DiffViewer diffs={diffs} />
 *     </TabPanel>
 *   }
 * />
 */
export function TaskLayout({
  task,
  chats,
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
  stepsPanelWidth = '320px',
  isLoading = false,
  className,
}: TaskLayoutProps) {
  const currentBranch = getCurrentBranch(chats);
  const hasChanges = task.actionsRequiredCount > 0;

  // Mobile steps panel collapse state
  const [isStepsPanelCollapsed, setIsStepsPanelCollapsed] = useState(true);

  // Handle title edit key events
  const handleTitleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      onTitleEditSubmit?.();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onTitleEditCancel?.();
    }
  };

  return (
    <div className={cn('flex h-full flex-col', 'bg-[rgb(var(--background))]', className)}>
      {/* Task Header - responsive layout */}
      <header className="shrink-0 border-b border-[rgb(var(--border))] px-3 py-2 md:px-4 md:py-3">
        {/* Mobile: Stack title and controls */}
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between md:gap-4">
          {/* Left side: Title and status */}
          <div className="flex min-w-0 flex-1 items-center gap-2 md:gap-3">
            {/* Title - editable */}
            {isTitleEditing ? (
              <input
                type="text"
                value={titleInputValue ?? task.title}
                onChange={(e) => onTitleInputChange?.(e.target.value)}
                onKeyDown={handleTitleKeyDown}
                onBlur={() => onTitleEditCancel?.()}
                autoFocus
                className={cn(
                  'flex-1 min-w-0 px-2 py-1 text-base font-semibold md:text-lg',
                  'bg-[rgb(var(--background))] text-[rgb(var(--foreground))]',
                  'border border-[rgb(var(--ring))] rounded-md',
                  'focus:outline-none focus:ring-2 focus:ring-[rgb(var(--ring))]'
                )}
                aria-label="Task title"
              />
            ) : (
              <div className="flex min-w-0 items-center gap-2 group">
                <h1
                  className="truncate text-base font-semibold text-[rgb(var(--foreground))] md:text-lg"
                  title={task.title}
                >
                  {task.title}
                </h1>
                {onTitleEditToggle && (
                  <button
                    type="button"
                    onClick={onTitleEditToggle}
                    className={cn(
                      'p-1 rounded opacity-0 group-hover:opacity-100',
                      'text-[rgb(var(--muted-foreground))] hover:text-[rgb(var(--foreground))]',
                      'hover:bg-[rgb(var(--muted))]',
                      'transition-opacity duration-150'
                    )}
                    aria-label="Edit task title"
                  >
                    <Icon icon={Pencil} size="sm" />
                  </button>
                )}
              </div>
            )}

            {/* Status dropdown - shrink on mobile */}
            {onStatusChange ? (
              <Dropdown
                options={STATUS_OPTIONS}
                value={task.status}
                onChange={(value) => onStatusChange(value as TaskStatus)}
                aria-label="Task status"
                className="w-28 md:w-36"
              />
            ) : (
              <Badge variant={taskStatusToVariant(task.status)}>
                {taskStatusToLabel(task.status)}
              </Badge>
            )}

            {/* Actions required indicator */}
            {hasChanges && (
              <Tooltip
                content={`${task.actionsRequiredCount} action${task.actionsRequiredCount > 1 ? 's' : ''} required`}
              >
                <Badge variant="warning">{task.actionsRequiredCount}</Badge>
              </Tooltip>
            )}
          </div>

          {/* Right side: Branch and actions - wrap on mobile */}
          <div className="flex items-center gap-2 overflow-x-auto">
            {/* Branch indicator - hidden on mobile, shown on tablet+ */}
            {currentBranch && (
              <Tooltip content={`Branch: ${currentBranch}`}>
                <div className="hidden items-center gap-1.5 px-2 py-1 rounded-md bg-[rgb(var(--muted))] text-sm sm:flex">
                  <Icon
                    icon={GitBranch}
                    size="sm"
                    className="text-[rgb(var(--muted-foreground))]"
                  />
                  <span className="max-w-[100px] truncate text-[rgb(var(--foreground))] md:max-w-[150px]">
                    {currentBranch}
                  </span>
                </div>
              </Tooltip>
            )}

            {/* Create PR button - icon only on mobile */}
            {onCreatePR && currentBranch && (
              <Tooltip content="Create Pull Request">
                <Button variant="secondary" size="sm" onClick={onCreatePR}>
                  <Icon icon={ExternalLink} size="sm" />
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
                  className="h-8 w-8 p-0"
                  aria-label="More actions"
                >
                  <Icon icon={MoreHorizontal} size="sm" />
                </Button>
              </Tooltip>
            )}
          </div>
        </div>
      </header>

      {/* Tabs - horizontal scroll on mobile */}
      <div className="shrink-0 overflow-x-auto scrollbar-hidden border-b border-[rgb(var(--border))] px-3 md:px-4">
        <Tabs
          tabs={tabs}
          activeTab={activeTab}
          onTabChange={onTabChange}
          variant="underline"
          size="sm"
        />
      </div>

      {/* Main content area - responsive layout */}
      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        {/* Steps panel - collapsible on mobile, sidebar on desktop */}
        {activeTab === 'steps' && (
          <>
            {/* Mobile: Collapsible steps header */}
            <div className="lg:hidden">
              <button
                type="button"
                onClick={() => setIsStepsPanelCollapsed(!isStepsPanelCollapsed)}
                className={cn(
                  'flex w-full items-center justify-between px-4 py-3',
                  'border-b border-[rgb(var(--border))] bg-[rgb(var(--surface-1))]',
                  'text-sm font-medium text-[rgb(var(--foreground))]'
                )}
                aria-expanded={!isStepsPanelCollapsed}
                aria-controls="mobile-steps-panel"
              >
                <span>Workflow Steps</span>
                <Icon
                  icon={isStepsPanelCollapsed ? ChevronDown : ChevronUp}
                  size="sm"
                  className="text-[rgb(var(--muted-foreground))]"
                />
              </button>

              {/* Mobile steps panel - collapsible */}
              {!isStepsPanelCollapsed && (
                <div
                  id="mobile-steps-panel"
                  className="max-h-64 overflow-y-auto scrollbar-thin border-b border-[rgb(var(--border))]"
                >
                  {stepsPanel}
                </div>
              )}
            </div>

            {/* Desktop: Fixed sidebar */}
            <div
              className="hidden shrink-0 border-r border-[rgb(var(--border))] overflow-y-auto scrollbar-thin lg:block"
              style={{ width: stepsPanelWidth }}
            >
              {stepsPanel}
            </div>

            {/* Main panel (right side on desktop, below steps on mobile) - chat interface */}
            <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">{mainPanel}</div>
          </>
        )}

        {/* Tab content for other tabs (Changes, Commits) */}
        {activeTab !== 'steps' && (
          <div className="flex-1 overflow-auto scrollbar-thin">{tabContent}</div>
        )}
      </div>

      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-[rgb(var(--background))]/80 z-10">
          <div className="flex items-center gap-2 text-[rgb(var(--muted-foreground))]">
            <div className="h-5 w-5 motion-safe:animate-spin rounded-full border-2 border-current border-t-transparent" />
            <span>Loading task...</span>
          </div>
        </div>
      )}
    </div>
  );
}

TaskLayout.displayName = 'TaskLayout';
