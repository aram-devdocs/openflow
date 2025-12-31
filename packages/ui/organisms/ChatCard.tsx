import type { Chat } from '@openflow/generated';
import { cn } from '@openflow/utils';
import { MessageSquare, MoreVertical } from 'lucide-react';
import { Badge } from '../atoms/Badge';
import { Icon } from '../atoms/Icon';
import { Card, CardContent } from '../molecules/Card';

export interface ChatCardProps {
  /** Chat data to display */
  chat: Chat;
  /** Optional project name to display */
  projectName?: string;
  /** Optional task title (if chat is linked to a task) */
  taskTitle?: string;
  /** Whether the card is in a selected state */
  isSelected?: boolean;
  /** Callback when the card is clicked/selected */
  onSelect?: (id: string) => void;
  /** Callback when more options button is clicked (for context menu) */
  onMoreClick?: (id: string, event: React.MouseEvent) => void;
  /** Callback when context menu is triggered (right-click) */
  onContextMenu?: (id: string, event: React.MouseEvent) => void;
  /** Additional CSS classes */
  className?: string;
}

/**
 * ChatCard component for displaying chat information.
 * Stateless - receives all data via props, emits actions via callbacks.
 *
 * Features:
 * - Chat title with icon
 * - Project and task context display
 * - Standalone vs task-linked indicator
 * - Context menu support
 *
 * @example
 * <ChatCard
 *   chat={chat}
 *   projectName="My Project"
 *   taskTitle="Implement feature"
 *   isSelected={selectedChatId === chat.id}
 *   onSelect={(id) => setSelectedChatId(id)}
 *   onMoreClick={(id, e) => openContextMenu(id, e)}
 * />
 */
export function ChatCard({
  chat,
  projectName,
  taskTitle,
  isSelected = false,
  onSelect,
  onMoreClick,
  onContextMenu,
  className,
}: ChatCardProps) {
  const handleClick = () => {
    onSelect?.(chat.id);
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    if (onContextMenu) {
      e.preventDefault();
      e.stopPropagation();
      onContextMenu(chat.id, e);
    }
  };

  const handleMoreClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onMoreClick?.(chat.id, e);
  };

  const isStandalone = !chat.taskId;
  const displayTitle = chat.title || 'Untitled Chat';

  // Format timestamp for display
  const formattedDate = new Date(chat.createdAt).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });

  return (
    <Card
      isSelected={isSelected}
      isClickable={Boolean(onSelect)}
      onClick={onSelect ? handleClick : undefined}
      onContextMenu={handleContextMenu}
      className={cn('group', className)}
    >
      <CardContent className="p-4">
        {/* Header: Icon, Title, and More button */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[rgb(var(--primary))]/10">
              <Icon icon={MessageSquare} size="sm" className="text-[rgb(var(--primary))]" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="truncate font-medium leading-tight">{displayTitle}</h3>
              {/* Context: Project and/or Task */}
              <div className="mt-0.5 flex items-center gap-1.5 text-xs text-[rgb(var(--muted-foreground))]">
                {projectName && <span className="truncate">{projectName}</span>}
                {projectName && taskTitle && <span>/</span>}
                {taskTitle && <span className="truncate">{taskTitle}</span>}
              </div>
            </div>
          </div>

          {/* More options button - visible on hover */}
          <button
            type="button"
            className={cn(
              'rounded p-1 text-[rgb(var(--muted-foreground))]',
              'opacity-0 transition-opacity group-hover:opacity-100',
              'hover:bg-[rgb(var(--accent))] hover:text-[rgb(var(--accent-foreground))]',
              'focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--ring))]'
            )}
            onClick={handleMoreClick}
            aria-label="Chat options"
          >
            <Icon icon={MoreVertical} size="sm" />
          </button>
        </div>

        {/* Footer: Metadata */}
        <div className="mt-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isStandalone ? (
              <Badge variant="info" size="sm">
                Standalone
              </Badge>
            ) : (
              <Badge variant="default" size="sm">
                Task
              </Badge>
            )}
            {chat.setupCompletedAt && (
              <Badge variant="success" size="sm">
                Completed
              </Badge>
            )}
          </div>
          <span className="text-xs text-[rgb(var(--muted-foreground))]">{formattedDate}</span>
        </div>
      </CardContent>
    </Card>
  );
}

ChatCard.displayName = 'ChatCard';
