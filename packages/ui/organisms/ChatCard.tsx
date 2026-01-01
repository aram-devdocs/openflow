import type { Chat } from '@openflow/generated';
import { Box, type ResponsiveValue, Text, VisuallyHidden } from '@openflow/primitives';
import { cn } from '@openflow/utils';
import { MessageSquare, MoreVertical } from 'lucide-react';
import { type HTMLAttributes, forwardRef } from 'react';
import { Badge } from '../atoms/Badge';
import { Icon } from '../atoms/Icon';
import { Card, CardContent } from '../molecules/Card';

// ============================================================================
// Types
// ============================================================================

export type ChatCardSize = 'sm' | 'md' | 'lg';

export type ChatCardBreakpoint = 'base' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

export interface ChatCardProps
  extends Omit<HTMLAttributes<HTMLDivElement>, 'onSelect' | 'onContextMenu'> {
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
  /** Responsive size - affects padding and typography */
  size?: ResponsiveValue<ChatCardSize>;
  /** Accessible label for the card (defaults to chat title) */
  'aria-label'?: string;
  /** Data attributes for testing */
  'data-testid'?: string;
}

// ============================================================================
// Constants
// ============================================================================

/**
 * Breakpoint order for responsive class generation
 */
const BREAKPOINT_ORDER = ['base', 'sm', 'md', 'lg', 'xl', '2xl'] as const;

/**
 * Default label for untitled chats
 */
export const DEFAULT_UNTITLED_LABEL = 'Untitled Chat';

/**
 * Default label for standalone badge
 */
export const DEFAULT_STANDALONE_LABEL = 'Standalone';

/**
 * Default label for task badge
 */
export const DEFAULT_TASK_LABEL = 'Task';

/**
 * Default label for completed badge
 */
export const DEFAULT_COMPLETED_LABEL = 'Completed';

/**
 * Default label for more options button
 */
export const DEFAULT_MORE_OPTIONS_LABEL = 'Chat options';

/**
 * Default label for selected state screen reader announcement
 */
export const DEFAULT_SELECTED_LABEL = 'Selected';

/**
 * Size classes for ChatCard - padding and spacing
 */
export const CHAT_CARD_SIZE_CLASSES: Record<ChatCardSize, string> = {
  sm: 'p-2',
  md: 'p-3',
  lg: 'p-4',
};

/**
 * Icon container size classes
 */
export const CHAT_CARD_ICON_CONTAINER_CLASSES: Record<ChatCardSize, string> = {
  sm: 'h-6 w-6',
  md: 'h-7 w-7',
  lg: 'h-8 w-8',
};

/**
 * Title text size classes
 */
export const CHAT_CARD_TITLE_SIZE_CLASSES: Record<ChatCardSize, string> = {
  sm: 'text-sm',
  md: 'text-sm',
  lg: 'text-base',
};

/**
 * Badge size mapping
 */
export const CHAT_CARD_BADGE_SIZE_MAP: Record<ChatCardSize, 'sm' | 'md' | 'lg'> = {
  sm: 'sm',
  md: 'sm',
  lg: 'md',
};

/**
 * Metadata text size classes
 */
export const CHAT_CARD_METADATA_SIZE_CLASSES: Record<ChatCardSize, string> = {
  sm: 'text-[10px]',
  md: 'text-xs',
  lg: 'text-xs',
};

/**
 * More button classes for accessibility - touch target ≥44px on mobile
 */
export const CHAT_CARD_MORE_BUTTON_CLASSES = [
  'rounded p-1',
  'text-[rgb(var(--muted-foreground))]',
  'min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0',
  'opacity-0 transition-opacity group-hover:opacity-100',
  'hover:bg-[rgb(var(--accent))] hover:text-[rgb(var(--accent-foreground))]',
  // Focus ring with offset for visibility on all backgrounds
  'focus-visible:opacity-100 focus-visible:outline-none',
  'focus-visible:ring-2 focus-visible:ring-[rgb(var(--ring))]',
  'focus-visible:ring-offset-2 focus-visible:ring-offset-[rgb(var(--background))]',
].join(' ');

/**
 * Icon container base classes
 */
export const CHAT_CARD_ICON_CONTAINER_BASE_CLASSES =
  'flex shrink-0 items-center justify-center rounded-lg bg-[rgb(var(--primary))]/10';

/**
 * Title container classes
 */
export const CHAT_CARD_TITLE_CONTAINER_CLASSES = 'min-w-0 flex-1';

/**
 * Header classes
 */
export const CHAT_CARD_HEADER_CLASSES = 'flex items-start justify-between gap-2';

/**
 * Content wrapper classes
 */
export const CHAT_CARD_CONTENT_WRAPPER_CLASSES = 'flex min-w-0 flex-1 items-center gap-2';

/**
 * Footer classes
 */
export const CHAT_CARD_FOOTER_CLASSES = 'mt-3 flex items-center justify-between';

/**
 * Footer margin classes by size
 */
export const CHAT_CARD_FOOTER_MARGIN_CLASSES: Record<ChatCardSize, string> = {
  sm: 'mt-2',
  md: 'mt-2.5',
  lg: 'mt-3',
};

/**
 * Context metadata classes
 */
export const CHAT_CARD_CONTEXT_CLASSES =
  'mt-0.5 flex items-center gap-1.5 text-[rgb(var(--muted-foreground))]';

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Get base size from ResponsiveValue (for when we just need the base size)
 */
export function getBaseSize(size: ResponsiveValue<ChatCardSize> | undefined): ChatCardSize {
  if (size === undefined) return 'md';
  if (typeof size === 'string') return size;
  if (typeof size === 'object' && size !== null) {
    return (size as Partial<Record<ChatCardBreakpoint, ChatCardSize>>).base ?? 'md';
  }
  return 'md';
}

/**
 * Generate responsive classes from a size map
 */
export function getResponsiveSizeClasses(
  size: ResponsiveValue<ChatCardSize> | undefined,
  classMap: Record<ChatCardSize, string>
): string {
  if (size === undefined) {
    return classMap.md;
  }

  if (typeof size === 'string') {
    return classMap[size];
  }

  if (typeof size === 'object' && size !== null) {
    const classes: string[] = [];
    for (const breakpoint of BREAKPOINT_ORDER) {
      const breakpointValue = (size as Partial<Record<ChatCardBreakpoint, ChatCardSize>>)[
        breakpoint
      ];
      if (breakpointValue !== undefined) {
        const sizeClasses = classMap[breakpointValue];
        if (breakpoint === 'base') {
          classes.push(sizeClasses);
        } else {
          // Add breakpoint prefix to each class
          const prefixedClasses = sizeClasses
            .split(' ')
            .map((cls) => `${breakpoint}:${cls}`)
            .join(' ');
          classes.push(prefixedClasses);
        }
      }
    }
    return classes.join(' ');
  }

  return classMap.md;
}

/**
 * Format timestamp for display
 */
export function formatTimestamp(dateString: string): string {
  return new Date(dateString).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Format timestamp for screen readers (more descriptive)
 */
export function formatTimestampForSR(dateString: string): string {
  return new Date(dateString).toLocaleDateString(undefined, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Build accessible label for the chat card
 */
export function buildAccessibleLabel(
  title: string,
  projectName?: string,
  taskTitle?: string,
  isStandalone?: boolean,
  isCompleted?: boolean
): string {
  const parts: string[] = [title];

  if (projectName || taskTitle) {
    const context = [projectName, taskTitle].filter(Boolean).join(', ');
    parts.push(`in ${context}`);
  }

  if (isStandalone) {
    parts.push('standalone chat');
  } else {
    parts.push('task chat');
  }

  if (isCompleted) {
    parts.push('completed');
  }

  return parts.join('. ');
}

/**
 * Get the ISO datetime for the time element
 */
export function getISODateTime(dateString: string): string {
  return new Date(dateString).toISOString();
}

// ============================================================================
// ChatCard Component
// ============================================================================

/**
 * ChatCard component for displaying chat information.
 * Stateless - receives all data via props, emits actions via callbacks.
 *
 * Accessibility features:
 * - Interactive cards are keyboard navigable (Enter/Space activation)
 * - Selected state announced via VisuallyHidden for screen readers
 * - Touch targets ≥44px on mobile for more button (WCAG 2.5.5)
 * - Focus rings visible on all backgrounds with ring-offset
 * - Semantic time element with datetime attribute
 * - Screen reader accessible labels for badges and actions
 * - aria-label provides full context for screen readers
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
export const ChatCard = forwardRef<HTMLDivElement, ChatCardProps>(function ChatCard(
  {
    chat,
    projectName,
    taskTitle,
    isSelected = false,
    onSelect,
    onMoreClick,
    onContextMenu,
    size = 'md',
    className,
    'aria-label': ariaLabel,
    'data-testid': dataTestId,
    ...props
  },
  ref
) {
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
  const isCompleted = Boolean(chat.setupCompletedAt);
  const displayTitle = chat.title || DEFAULT_UNTITLED_LABEL;

  // Responsive size classes
  const baseSize = getBaseSize(size);
  const paddingClasses = getResponsiveSizeClasses(size, CHAT_CARD_SIZE_CLASSES);
  const iconContainerClasses = getResponsiveSizeClasses(size, CHAT_CARD_ICON_CONTAINER_CLASSES);
  const titleSizeClasses = getResponsiveSizeClasses(size, CHAT_CARD_TITLE_SIZE_CLASSES);
  const metadataSizeClasses = getResponsiveSizeClasses(size, CHAT_CARD_METADATA_SIZE_CLASSES);
  const footerMarginClasses = getResponsiveSizeClasses(size, CHAT_CARD_FOOTER_MARGIN_CLASSES);

  // Badge size based on base size
  const badgeSize = CHAT_CARD_BADGE_SIZE_MAP[baseSize];

  // Build accessible label
  const accessibleLabel =
    ariaLabel ||
    buildAccessibleLabel(displayTitle, projectName, taskTitle, isStandalone, isCompleted);

  // Format dates
  const formattedDate = formatTimestamp(chat.createdAt);
  const formattedDateSR = formatTimestampForSR(chat.createdAt);
  const isoDateTime = getISODateTime(chat.createdAt);

  return (
    <Card
      ref={ref}
      isSelected={isSelected}
      isClickable={Boolean(onSelect)}
      onClick={onSelect ? handleClick : undefined}
      onContextMenu={handleContextMenu}
      aria-label={accessibleLabel}
      data-testid={dataTestId}
      data-chat-id={chat.id}
      data-standalone={isStandalone ? 'true' : undefined}
      data-completed={isCompleted ? 'true' : undefined}
      className={cn('group', className)}
      {...props}
    >
      {/* Screen reader announcement for selected state */}
      {isSelected && (
        <VisuallyHidden>
          <Text as="span" role="status" aria-live="polite">
            {DEFAULT_SELECTED_LABEL}
          </Text>
        </VisuallyHidden>
      )}

      <CardContent
        className={paddingClasses}
        data-testid={dataTestId ? `${dataTestId}-content` : undefined}
      >
        {/* Header: Icon, Title, and More button */}
        <Box className={CHAT_CARD_HEADER_CLASSES}>
          <Box className={CHAT_CARD_CONTENT_WRAPPER_CLASSES}>
            <Box
              className={cn(CHAT_CARD_ICON_CONTAINER_BASE_CLASSES, iconContainerClasses)}
              aria-hidden={true}
            >
              <Icon
                icon={MessageSquare}
                size={baseSize === 'lg' ? 'sm' : 'xs'}
                className="text-[rgb(var(--primary))]"
              />
            </Box>
            <Box className={CHAT_CARD_TITLE_CONTAINER_CLASSES}>
              <Text
                as="span"
                weight="medium"
                className={cn('block truncate leading-tight', titleSizeClasses)}
              >
                {displayTitle}
              </Text>
              {/* Context: Project and/or Task */}
              {(projectName || taskTitle) && (
                <Box className={cn(CHAT_CARD_CONTEXT_CLASSES, metadataSizeClasses)}>
                  {projectName && (
                    <Text as="span" className="truncate">
                      {projectName}
                    </Text>
                  )}
                  {projectName && taskTitle && (
                    <Text as="span" aria-hidden>
                      /
                    </Text>
                  )}
                  {taskTitle && (
                    <Text as="span" className="truncate">
                      {taskTitle}
                    </Text>
                  )}
                </Box>
              )}
            </Box>
          </Box>

          {/* More options button - visible on hover, touch target ≥44px on mobile */}
          {onMoreClick && (
            <Box
              as="button"
              type="button"
              className={CHAT_CARD_MORE_BUTTON_CLASSES}
              onClick={handleMoreClick}
              aria-label={DEFAULT_MORE_OPTIONS_LABEL}
              data-testid={dataTestId ? `${dataTestId}-more-button` : undefined}
            >
              <Icon icon={MoreVertical} size={baseSize === 'lg' ? 'sm' : 'xs'} aria-hidden={true} />
            </Box>
          )}
        </Box>

        {/* Footer: Metadata */}
        <Box className={cn(CHAT_CARD_FOOTER_CLASSES, footerMarginClasses)}>
          <Box className="flex items-center gap-2" role="list" aria-label="Chat attributes">
            {isStandalone ? (
              <Box role="listitem">
                <Badge
                  variant="info"
                  size={badgeSize}
                  aria-label={`Type: ${DEFAULT_STANDALONE_LABEL}`}
                >
                  {DEFAULT_STANDALONE_LABEL}
                </Badge>
              </Box>
            ) : (
              <Box role="listitem">
                <Badge
                  variant="default"
                  size={badgeSize}
                  aria-label={`Type: ${DEFAULT_TASK_LABEL}`}
                >
                  {DEFAULT_TASK_LABEL}
                </Badge>
              </Box>
            )}
            {isCompleted && (
              <Box role="listitem">
                <Badge
                  variant="success"
                  size={badgeSize}
                  aria-label={`Status: ${DEFAULT_COMPLETED_LABEL}`}
                >
                  {DEFAULT_COMPLETED_LABEL}
                </Badge>
              </Box>
            )}
          </Box>
          <Box
            as="time"
            dateTime={isoDateTime}
            className={cn('text-[rgb(var(--muted-foreground))]', metadataSizeClasses)}
            aria-label={`Created on ${formattedDateSR}`}
          >
            {formattedDate}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
});

ChatCard.displayName = 'ChatCard';
