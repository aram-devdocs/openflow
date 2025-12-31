import type { Chat } from '@openflow/generated';
import { cn } from '@openflow/utils';
import { MessageSquare } from 'lucide-react';
import { EmptyState } from '../molecules/EmptyState';
import { ChatCard } from './ChatCard';

export type ChatFilter = 'all' | 'standalone' | 'task-linked';

export interface ChatsListProps {
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
  onContextMenu?: (id: string, event: React.MouseEvent) => void;
  /** Whether the list is loading */
  isLoading?: boolean;
  /** Additional CSS classes */
  className?: string;
}

const FILTER_OPTIONS: { value: ChatFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'standalone', label: 'Standalone' },
  { value: 'task-linked', label: 'Task-linked' },
];

/**
 * ChatsList component for displaying a filterable list of chats.
 * Stateless - receives all data via props, emits actions via callbacks.
 *
 * Features:
 * - Filter tabs for all/standalone/task-linked
 * - ChatCard display for each chat
 * - Empty state when no chats
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
export function ChatsList({
  chats,
  projectNames = {},
  taskTitles = {},
  selectedChatId,
  filter = 'all',
  onFilterChange,
  onSelectChat,
  onMoreClick,
  onContextMenu,
  isLoading = false,
  className,
}: ChatsListProps) {
  // Filter chats based on current filter
  const filteredChats = chats.filter((chat) => {
    if (filter === 'standalone') return !chat.taskId;
    if (filter === 'task-linked') return !!chat.taskId;
    return true; // 'all'
  });

  if (isLoading) {
    return (
      <div className={cn('space-y-3', className)}>
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-24 rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--muted))] animate-pulse"
          />
        ))}
      </div>
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Filter tabs */}
      {onFilterChange && (
        <div className="flex gap-1 rounded-lg bg-[rgb(var(--muted))] p-1">
          {FILTER_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => onFilterChange(option.value)}
              className={cn(
                'flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                filter === option.value
                  ? 'bg-[rgb(var(--background))] text-[rgb(var(--foreground))] shadow-sm'
                  : 'text-[rgb(var(--muted-foreground))] hover:text-[rgb(var(--foreground))]'
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}

      {/* Chat list or empty state */}
      {filteredChats.length === 0 ? (
        <EmptyState
          icon={MessageSquare}
          title="No chats found"
          description={
            filter === 'all'
              ? 'Start a new chat to get going.'
              : filter === 'standalone'
                ? 'No standalone chats yet.'
                : 'No task-linked chats yet.'
          }
        />
      ) : (
        <div className="space-y-3">
          {filteredChats.map((chat) => (
            <ChatCard
              key={chat.id}
              chat={chat}
              projectName={projectNames[chat.projectId]}
              taskTitle={chat.taskId ? taskTitles[chat.taskId] : undefined}
              isSelected={selectedChatId === chat.id}
              onSelect={onSelectChat}
              onMoreClick={onMoreClick}
              onContextMenu={onContextMenu}
            />
          ))}
        </div>
      )}
    </div>
  );
}

ChatsList.displayName = 'ChatsList';
