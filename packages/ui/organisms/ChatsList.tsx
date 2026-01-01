/**
 * ChatsList Organism - Filterable list of chat sessions
 *
 * A complete chat list interface with filtering by type (all/standalone/task-linked).
 * Supports loading, empty, and error states with proper accessibility.
 *
 * Accessibility:
 * - ARIA tablist/tab pattern for filter buttons with keyboard navigation
 * - Proper list semantics (role="list", role="listitem")
 * - Screen reader announcements for filter changes
 * - Focus management with visible focus rings
 * - Touch targets ≥44px for mobile (WCAG 2.5.5)
 * - aria-live for dynamic content updates
 *
 * Features:
 * - Filter tabs for all/standalone/task-linked chats
 * - Loading skeleton state
 * - Error state with retry
 * - Empty state per filter type
 * - Keyboard navigation (Arrow keys for tabs)
 * - Context menu support
 * - Responsive sizing support
 */

import type { Chat } from '@openflow/generated';
import { type Breakpoint, type ResponsiveValue, Text, VisuallyHidden } from '@openflow/primitives';
import { cn } from '@openflow/utils';
import { AlertCircle, MessageSquare } from 'lucide-react';
import {
  type HTMLAttributes,
  type KeyboardEvent,
  forwardRef,
  useCallback,
  useId,
  useRef,
  useState,
} from 'react';
import { Button } from '../atoms/Button';
import { Icon } from '../atoms/Icon';
import { Skeleton } from '../atoms/Skeleton';
import { EmptyState } from '../molecules/EmptyState';
import { ChatCard } from './ChatCard';

// ============================================================================
// Types
// ============================================================================

/** Chat filter types */
export type ChatFilter = 'all' | 'standalone' | 'task-linked';

/** Breakpoint names for responsive values */
export type ChatsListBreakpoint = Breakpoint;

/** Size variants for ChatsList */
export type ChatsListSize = 'sm' | 'md' | 'lg';

export interface ChatsListProps
  extends Omit<HTMLAttributes<HTMLDivElement>, 'children' | 'onContextMenu'> {
  /** Chats to display */
  chats: Chat[];
  /** Project names lookup by project ID */
  projectNames?: Record<string, string>;
  /** Task titles lookup by task ID */
  taskTitles?: Record<string, string>;
  /** Currently selected chat ID */
  selectedChatId?: string;
  /** Current filter */
  filter?: ChatFilter;
  /** Callback when filter changes */
  onFilterChange?: (filter: ChatFilter) => void;
  /** Callback when a chat is selected */
  onSelectChat?: (id: string) => void;
  /** Callback when more options is clicked on a chat */
  onMoreClick?: (id: string, event: React.MouseEvent) => void;
  /** Callback when context menu is triggered on a chat */
  onChatContextMenu?: (id: string, event: React.MouseEvent) => void;
  /** Whether the list is loading */
  isLoading?: boolean;
  /** Size variant for responsive sizing */
  size?: ResponsiveValue<ChatsListSize>;
  /** Data test ID for automated testing */
  'data-testid'?: string;
  /** Accessible label for the chat list region */
  listLabel?: string;
  /** Accessible label for the filter tabs */
  filterLabel?: string;
}

export interface ChatsListSkeletonProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  /** Number of skeleton items to display */
  count?: number;
  /** Whether to show filter tabs skeleton */
  showFilterSkeleton?: boolean;
  /** Size variant for responsive sizing */
  size?: ResponsiveValue<ChatsListSize>;
  /** Data test ID for automated testing */
  'data-testid'?: string;
}

export interface ChatsListErrorProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  /** Error message to display */
  message?: string;
  /** Callback to retry loading */
  onRetry?: () => void;
  /** Size variant for responsive sizing */
  size?: ResponsiveValue<ChatsListSize>;
  /** Data test ID for automated testing */
  'data-testid'?: string;
  /** Custom error title */
  errorTitle?: string;
  /** Custom retry button label */
  retryLabel?: string;
}

// ============================================================================
// Constants
// ============================================================================

/** Default labels */
export const DEFAULT_LIST_LABEL = 'Chat sessions';
export const DEFAULT_FILTER_LABEL = 'Filter chats by type';
export const DEFAULT_EMPTY_TITLE = 'No chats found';
export const DEFAULT_EMPTY_TITLE_ALL = 'No chats found';
export const DEFAULT_EMPTY_DESCRIPTION_ALL = 'Start a new chat to get going.';
export const DEFAULT_EMPTY_TITLE_STANDALONE = 'No standalone chats';
export const DEFAULT_EMPTY_DESCRIPTION_STANDALONE = 'No standalone chats yet.';
export const DEFAULT_EMPTY_TITLE_TASK_LINKED = 'No task-linked chats';
export const DEFAULT_EMPTY_DESCRIPTION_TASK_LINKED = 'No task-linked chats yet.';
export const DEFAULT_ERROR_TITLE = 'Failed to load chats';
export const DEFAULT_ERROR_RETRY_LABEL = 'Retry';
export const DEFAULT_SKELETON_COUNT = 3;

/** Screen reader announcements */
export const SR_FILTER_CHANGED = 'Showing';
export const SR_CHATS_COUNT = 'chats';
export const SR_NO_RESULTS = 'No chats match the current filter';
export const SR_LOADING = 'Loading chats...';

/** Filter options configuration */
export const FILTER_OPTIONS: { value: ChatFilter; label: string; ariaLabel: string }[] = [
  { value: 'all', label: 'All', ariaLabel: 'Show all chats' },
  { value: 'standalone', label: 'Standalone', ariaLabel: 'Show standalone chats only' },
  { value: 'task-linked', label: 'Task-linked', ariaLabel: 'Show task-linked chats only' },
];

/** Base classes for ChatsList container */
export const CHATS_LIST_BASE_CLASSES = 'flex flex-col';

/** Size-specific gap classes */
export const CHATS_LIST_GAP_CLASSES: Record<ChatsListSize, string> = {
  sm: 'gap-3',
  md: 'gap-4',
  lg: 'gap-5',
};

/** Size-specific list gap classes */
export const CHATS_LIST_ITEMS_GAP_CLASSES: Record<ChatsListSize, string> = {
  sm: 'gap-2',
  md: 'gap-3',
  lg: 'gap-4',
};

/** Filter tabs container classes */
export const FILTER_TABS_CONTAINER_CLASSES = cn('flex gap-1 rounded-lg bg-[rgb(var(--muted))] p-1');

/** Filter tab base classes */
export const FILTER_TAB_BASE_CLASSES = cn(
  'flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
  'min-h-[44px] sm:min-h-[36px]', // Touch target ≥44px on mobile
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--ring))] focus-visible:ring-offset-2'
);

/** Filter tab active classes */
export const FILTER_TAB_ACTIVE_CLASSES = cn(
  'bg-[rgb(var(--background))] text-[rgb(var(--foreground))] shadow-sm'
);

/** Filter tab inactive classes */
export const FILTER_TAB_INACTIVE_CLASSES = cn(
  'text-[rgb(var(--muted-foreground))] hover:text-[rgb(var(--foreground))]'
);

/** List container classes */
export const LIST_CONTAINER_CLASSES = 'flex flex-col';

/** Empty state container classes */
export const EMPTY_STATE_CONTAINER_CLASSES = 'flex items-center justify-center min-h-[200px]';

/** Error state container classes */
export const ERROR_STATE_CLASSES = cn(
  'flex flex-col items-center justify-center gap-4 p-6',
  'rounded-lg border border-[rgb(var(--destructive)/20)] bg-[rgb(var(--destructive)/5)]'
);

/** Error icon container classes */
export const ERROR_ICON_CONTAINER_CLASSES = cn(
  'flex h-12 w-12 items-center justify-center rounded-full',
  'bg-[rgb(var(--destructive)/10)] text-[rgb(var(--destructive))]'
);

/** Skeleton card classes */
export const SKELETON_CARD_CLASSES = cn(
  'rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4'
);

/** Skeleton card height classes */
export const SKELETON_CARD_HEIGHT_CLASSES: Record<ChatsListSize, string> = {
  sm: 'h-20',
  md: 'h-24',
  lg: 'h-28',
};

// ============================================================================
// Utility Functions
// ============================================================================

/** Breakpoint order for responsive values */
const BREAKPOINT_ORDER: Breakpoint[] = ['base', 'sm', 'md', 'lg', 'xl', '2xl'];

/** Type for responsive size object */
type ResponsiveSizeObject = Partial<Record<Breakpoint, ChatsListSize>>;

/**
 * Check if value is a responsive object (not a string size)
 */
function isResponsiveObject(value: ResponsiveValue<ChatsListSize>): value is ResponsiveSizeObject {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Get base size from responsive value
 */
export function getBaseSize(size: ResponsiveValue<ChatsListSize>): ChatsListSize {
  if (!isResponsiveObject(size)) {
    return size;
  }
  return size.base ?? 'md';
}

/**
 * Get responsive size classes for a given class map
 */
export function getResponsiveSizeClasses(
  size: ResponsiveValue<ChatsListSize>,
  classMap: Record<ChatsListSize, string>
): string {
  if (!isResponsiveObject(size)) {
    return classMap[size];
  }

  const classes: string[] = [];

  for (const bp of BREAKPOINT_ORDER) {
    const sizeValue = size[bp];
    if (sizeValue && classMap[sizeValue]) {
      const sizeClasses = classMap[sizeValue].split(' ');
      if (bp === 'base') {
        classes.push(...sizeClasses);
      } else {
        classes.push(...sizeClasses.map((cls) => `${bp}:${cls}`));
      }
    }
  }

  return classes.join(' ');
}

/**
 * Get empty state content based on filter
 */
export function getEmptyStateContent(filter: ChatFilter): { title: string; description: string } {
  switch (filter) {
    case 'standalone':
      return {
        title: DEFAULT_EMPTY_TITLE_STANDALONE,
        description: DEFAULT_EMPTY_DESCRIPTION_STANDALONE,
      };
    case 'task-linked':
      return {
        title: DEFAULT_EMPTY_TITLE_TASK_LINKED,
        description: DEFAULT_EMPTY_DESCRIPTION_TASK_LINKED,
      };
    default:
      return {
        title: DEFAULT_EMPTY_TITLE_ALL,
        description: DEFAULT_EMPTY_DESCRIPTION_ALL,
      };
  }
}

/**
 * Get filter announcement for screen readers
 */
export function getFilterAnnouncement(filter: ChatFilter, count: number): string {
  const filterLabel =
    FILTER_OPTIONS.find((opt) => opt.value === filter)?.label.toLowerCase() ?? filter;
  if (count === 0) {
    return SR_NO_RESULTS;
  }
  return `${SR_FILTER_CHANGED} ${count} ${filterLabel} ${SR_CHATS_COUNT}`;
}

/**
 * Get chat list accessible label
 */
export function buildListAccessibleLabel(filter: ChatFilter, count: number): string {
  const filterLabel = FILTER_OPTIONS.find((opt) => opt.value === filter)?.label ?? 'All';
  return `${filterLabel} chats, ${count} items`;
}

// ============================================================================
// ChatsListSkeleton Component
// ============================================================================

/**
 * Skeleton loading state for ChatsList
 */
export const ChatsListSkeleton = forwardRef<HTMLDivElement, ChatsListSkeletonProps>(
  (
    {
      count = DEFAULT_SKELETON_COUNT,
      showFilterSkeleton = true,
      size = 'md',
      className,
      'data-testid': testId,
      ...props
    },
    ref
  ) => {
    const baseSize = getBaseSize(size);

    return (
      <div
        ref={ref}
        role="status"
        aria-label={SR_LOADING}
        aria-busy="true"
        className={cn(
          CHATS_LIST_BASE_CLASSES,
          getResponsiveSizeClasses(size, CHATS_LIST_GAP_CLASSES),
          className
        )}
        data-testid={testId}
        data-size={baseSize}
        {...props}
      >
        <VisuallyHidden>{SR_LOADING}</VisuallyHidden>

        {/* Filter tabs skeleton */}
        {showFilterSkeleton && (
          <div aria-hidden="true" className="flex gap-1 rounded-lg bg-[rgb(var(--muted))] p-1">
            {FILTER_OPTIONS.map((option) => (
              <Skeleton key={option.value} className="h-9 flex-1 rounded-md" aria-hidden="true" />
            ))}
          </div>
        )}

        {/* Chat cards skeleton */}
        <div
          aria-hidden="true"
          className={cn(
            LIST_CONTAINER_CLASSES,
            getResponsiveSizeClasses(size, CHATS_LIST_ITEMS_GAP_CLASSES)
          )}
        >
          {Array.from({ length: count }).map((_, index) => (
            <div
              key={index}
              className={cn(
                SKELETON_CARD_CLASSES,
                getResponsiveSizeClasses(size, SKELETON_CARD_HEIGHT_CLASSES)
              )}
            >
              <div className="flex items-start gap-3">
                {/* Icon skeleton */}
                <Skeleton className="h-10 w-10 shrink-0 rounded-lg" aria-hidden="true" />
                {/* Content skeleton */}
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-2/3" aria-hidden="true" />
                  <Skeleton className="h-3 w-1/2" aria-hidden="true" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }
);

ChatsListSkeleton.displayName = 'ChatsListSkeleton';

// ============================================================================
// ChatsListError Component
// ============================================================================

/**
 * Error state for ChatsList
 */
export const ChatsListError = forwardRef<HTMLDivElement, ChatsListErrorProps>(
  (
    {
      message,
      onRetry,
      size = 'md',
      className,
      'data-testid': testId,
      errorTitle = DEFAULT_ERROR_TITLE,
      retryLabel = DEFAULT_ERROR_RETRY_LABEL,
      ...props
    },
    ref
  ) => {
    const baseSize = getBaseSize(size);

    return (
      <div
        ref={ref}
        role="alert"
        aria-live="assertive"
        className={cn(ERROR_STATE_CLASSES, className)}
        data-testid={testId}
        data-size={baseSize}
        {...props}
      >
        <div className={ERROR_ICON_CONTAINER_CLASSES}>
          <Icon icon={AlertCircle} size="lg" aria-hidden="true" />
        </div>
        <Text size="base" weight="semibold" color="foreground" className="text-center">
          {errorTitle}
        </Text>
        {message && (
          <Text size="sm" color="muted-foreground" className="text-center max-w-xs">
            {message}
          </Text>
        )}
        {onRetry && (
          <Button variant="primary" size="sm" onClick={onRetry} aria-label={retryLabel}>
            {retryLabel}
          </Button>
        )}
      </div>
    );
  }
);

ChatsListError.displayName = 'ChatsListError';

// ============================================================================
// ChatsList Component
// ============================================================================

/**
 * ChatsList component for displaying a filterable list of chats.
 * Stateless - receives all data via props, emits actions via callbacks.
 *
 * Features:
 * - Filter tabs for all/standalone/task-linked
 * - ChatCard display for each chat
 * - Empty state when no chats
 * - Loading skeleton state
 * - Error state with retry
 * - Context menu support
 *
 * @example
 * <ChatsList
 *   chats={chats}
 *   projectNames={projectMap}
 *   taskTitles={taskMap}
 *   filter={filter}
 *   onFilterChange={setFilter}
 *   onSelectChat={handleSelectChat}
 * />
 */
export const ChatsList = forwardRef<HTMLDivElement, ChatsListProps>(
  (
    {
      chats,
      projectNames = {},
      taskTitles = {},
      selectedChatId,
      filter = 'all',
      onFilterChange,
      onSelectChat,
      onMoreClick,
      onChatContextMenu,
      isLoading = false,
      size = 'md',
      className,
      'data-testid': testId,
      listLabel = DEFAULT_LIST_LABEL,
      filterLabel = DEFAULT_FILTER_LABEL,
      ...props
    },
    ref
  ) => {
    const componentId = useId();
    const tabsRef = useRef<HTMLDivElement>(null);
    const [announcement, setAnnouncement] = useState('');
    const baseSize = getBaseSize(size);

    // Filter chats based on current filter
    const filteredChats = chats.filter((chat) => {
      if (filter === 'standalone') return !chat.taskId;
      if (filter === 'task-linked') return !!chat.taskId;
      return true; // 'all'
    });

    // Handle filter change with announcement
    const handleFilterChange = useCallback(
      (newFilter: ChatFilter) => {
        if (onFilterChange) {
          onFilterChange(newFilter);
          // Announce filter change for screen readers
          const newFilteredCount = chats.filter((chat) => {
            if (newFilter === 'standalone') return !chat.taskId;
            if (newFilter === 'task-linked') return !!chat.taskId;
            return true;
          }).length;
          setAnnouncement(getFilterAnnouncement(newFilter, newFilteredCount));
        }
      },
      [chats, onFilterChange]
    );

    // Keyboard navigation for tabs
    const handleTabKeyDown = useCallback(
      (event: KeyboardEvent<HTMLButtonElement>, currentIndex: number) => {
        if (!onFilterChange) return;

        let newIndex = currentIndex;
        const tabCount = FILTER_OPTIONS.length;

        switch (event.key) {
          case 'ArrowLeft':
          case 'ArrowUp':
            event.preventDefault();
            newIndex = currentIndex === 0 ? tabCount - 1 : currentIndex - 1;
            break;
          case 'ArrowRight':
          case 'ArrowDown':
            event.preventDefault();
            newIndex = currentIndex === tabCount - 1 ? 0 : currentIndex + 1;
            break;
          case 'Home':
            event.preventDefault();
            newIndex = 0;
            break;
          case 'End':
            event.preventDefault();
            newIndex = tabCount - 1;
            break;
          default:
            return;
        }

        // Focus and select new tab
        const tabs = tabsRef.current?.querySelectorAll('[role="tab"]');
        const newOption = FILTER_OPTIONS[newIndex];
        if (tabs?.[newIndex] && newOption) {
          (tabs[newIndex] as HTMLButtonElement).focus();
          handleFilterChange(newOption.value);
        }
      },
      [handleFilterChange, onFilterChange]
    );

    // Loading state
    if (isLoading) {
      return (
        <ChatsListSkeleton
          count={DEFAULT_SKELETON_COUNT}
          showFilterSkeleton={!!onFilterChange}
          size={size}
          className={className}
          data-testid={testId ? `${testId}-skeleton` : undefined}
        />
      );
    }

    const listId = `${componentId}-list`;
    const tabListId = `${componentId}-tabs`;
    const selectedTabId = `${componentId}-tab-${filter}`;

    return (
      <div
        ref={ref}
        className={cn(
          CHATS_LIST_BASE_CLASSES,
          getResponsiveSizeClasses(size, CHATS_LIST_GAP_CLASSES),
          className
        )}
        data-testid={testId}
        data-filter={filter}
        data-size={baseSize}
        data-chat-count={filteredChats.length}
        {...props}
      >
        {/* Screen reader announcements */}
        <VisuallyHidden>
          <div role="status" aria-live="polite" aria-atomic="true">
            {announcement}
          </div>
        </VisuallyHidden>

        {/* Filter tabs */}
        {onFilterChange && (
          <div
            ref={tabsRef}
            role="tablist"
            aria-label={filterLabel}
            id={tabListId}
            className={FILTER_TABS_CONTAINER_CLASSES}
          >
            {FILTER_OPTIONS.map((option, index) => {
              const isSelected = filter === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  role="tab"
                  id={`${componentId}-tab-${option.value}`}
                  aria-selected={isSelected}
                  aria-controls={listId}
                  aria-label={option.ariaLabel}
                  tabIndex={isSelected ? 0 : -1}
                  onClick={() => handleFilterChange(option.value)}
                  onKeyDown={(e) => handleTabKeyDown(e, index)}
                  className={cn(
                    FILTER_TAB_BASE_CLASSES,
                    isSelected ? FILTER_TAB_ACTIVE_CLASSES : FILTER_TAB_INACTIVE_CLASSES
                  )}
                  data-testid={testId ? `${testId}-tab-${option.value}` : undefined}
                  data-selected={isSelected}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        )}

        {/* Chat list or empty state */}
        {filteredChats.length === 0 ? (
          <div className={EMPTY_STATE_CONTAINER_CLASSES}>
            <EmptyState
              icon={MessageSquare}
              title={getEmptyStateContent(filter).title}
              description={getEmptyStateContent(filter).description}
              aria-label={getEmptyStateContent(filter).title}
              data-testid={testId ? `${testId}-empty` : undefined}
            />
          </div>
        ) : (
          <div
            role="list"
            id={listId}
            aria-labelledby={onFilterChange ? selectedTabId : undefined}
            aria-label={buildListAccessibleLabel(filter, filteredChats.length)}
            className={cn(
              LIST_CONTAINER_CLASSES,
              getResponsiveSizeClasses(size, CHATS_LIST_ITEMS_GAP_CLASSES)
            )}
            data-testid={testId ? `${testId}-list` : undefined}
          >
            {filteredChats.map((chat) => (
              <div
                key={chat.id}
                role="listitem"
                data-testid={testId ? `${testId}-item-${chat.id}` : undefined}
              >
                <ChatCard
                  chat={chat}
                  projectName={projectNames[chat.projectId]}
                  taskTitle={chat.taskId ? taskTitles[chat.taskId] : undefined}
                  isSelected={selectedChatId === chat.id}
                  onSelect={onSelectChat}
                  onMoreClick={onMoreClick}
                  onContextMenu={onChatContextMenu}
                  size={size}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }
);

ChatsList.displayName = 'ChatsList';
