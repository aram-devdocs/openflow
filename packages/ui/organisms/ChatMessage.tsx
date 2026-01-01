/**
 * ChatMessage component for displaying a single message in a chat conversation.
 * Stateless - receives all data via props, no hooks or data fetching.
 *
 * Accessibility:
 * - Proper semantic structure with article/heading for messages
 * - Role-based ARIA labels for screen readers ("You said", "Assistant said", etc.)
 * - Timestamps use semantic time elements with datetime
 * - Tool calls section has proper list semantics
 * - Streaming state announced via aria-live region
 * - Focus visible on interactive elements
 */

import type { Message, MessageRole } from '@openflow/generated';
import { Box, Flex, List, ListItem, Text, VisuallyHidden } from '@openflow/primitives';
import { cn } from '@openflow/utils';
import { formatCompact } from '@openflow/utils';
import { Bot, Settings, User, Wrench } from 'lucide-react';
import { type HTMLAttributes, forwardRef, useId } from 'react';
import { Icon } from '../atoms/Icon';
import { Spinner } from '../atoms/Spinner';

// ============================================================================
// Types
// ============================================================================

/** Responsive size values */
export type ChatMessageBreakpoint = 'base' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
export type ResponsiveValue<T> = T | Partial<Record<ChatMessageBreakpoint, T>>;
export type ChatMessageSize = 'sm' | 'md' | 'lg';

export interface ChatMessageProps extends Omit<HTMLAttributes<HTMLElement>, 'role'> {
  /** Message data to display */
  message: Message;
  /** Whether the message content is currently streaming */
  isStreaming?: boolean;
  /** Additional CSS classes */
  className?: string;
  /** Size variant for responsive sizing */
  size?: ResponsiveValue<ChatMessageSize>;
  /** Custom label for user role */
  userLabel?: string;
  /** Custom label for assistant role */
  assistantLabel?: string;
  /** Custom label for system role */
  systemLabel?: string;
  /** Custom label for streaming state */
  streamingLabel?: string;
  /** Custom label for thinking state */
  thinkingLabel?: string;
  /** Custom label for tool calls section */
  toolCallsLabel?: string;
  /** Data test ID for automated testing */
  'data-testid'?: string;
}

/** Tool call type */
export interface ToolCall {
  id?: string;
  name: string;
  arguments?: Record<string, unknown>;
}

/** Tool call item props */
export interface ToolCallItemProps {
  /** Tool call data */
  toolCall: ToolCall;
  /** Index in the list */
  index: number;
  /** Size variant */
  size?: ChatMessageSize;
  /** Data test ID */
  'data-testid'?: string;
}

// ============================================================================
// Constants
// ============================================================================

/** Default labels */
export const DEFAULT_USER_LABEL = 'You';
export const DEFAULT_ASSISTANT_LABEL = 'Assistant';
export const DEFAULT_SYSTEM_LABEL = 'System';
export const DEFAULT_STREAMING_LABEL = 'Generating...';
export const DEFAULT_THINKING_LABEL = 'Thinking...';
export const DEFAULT_TOOL_CALLS_LABEL = 'Tool Calls';

/** Screen reader announcement templates */
export const SR_USER_SAID = 'You said:';
export const SR_ASSISTANT_SAID = 'Assistant said:';
export const SR_SYSTEM_SAID = 'System message:';
export const SR_STREAMING = 'Assistant is generating a response';
export const SR_TOOL_CALLS = 'Using tools:';

/** Role configuration for display */
export const ROLE_CONFIG: Record<
  MessageRole,
  { label: string; icon: typeof User; srPrefix: string }
> = {
  user: { label: DEFAULT_USER_LABEL, icon: User, srPrefix: SR_USER_SAID },
  assistant: { label: DEFAULT_ASSISTANT_LABEL, icon: Bot, srPrefix: SR_ASSISTANT_SAID },
  system: { label: DEFAULT_SYSTEM_LABEL, icon: Settings, srPrefix: SR_SYSTEM_SAID },
};

/** Role-based styling */
export const ROLE_STYLES: Record<MessageRole, string> = {
  user: 'bg-primary/10 border-primary/20',
  assistant: 'bg-muted border-border',
  system: 'bg-warning/10 border-warning/20',
};

/** Role icon background styles */
export const ICON_BG_STYLES: Record<MessageRole, string> = {
  user: 'bg-primary text-primary-foreground',
  assistant: 'bg-accent text-accent-foreground',
  system: 'bg-warning/20 text-warning',
};

/** Base message container classes */
export const MESSAGE_BASE_CLASSES = 'group flex gap-3 rounded-lg border';

/** Padding classes by size */
export const MESSAGE_PADDING_CLASSES: Record<ChatMessageSize, string> = {
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-5',
};

/** Avatar container classes by size */
export const AVATAR_SIZE_CLASSES: Record<ChatMessageSize, string> = {
  sm: 'h-7 w-7',
  md: 'h-8 w-8',
  lg: 'h-9 w-9',
};

/** Avatar icon size by message size */
export const AVATAR_ICON_SIZE_MAP: Record<ChatMessageSize, 'xs' | 'sm' | 'md'> = {
  sm: 'xs',
  md: 'sm',
  lg: 'sm',
};

/** Content gap classes by size */
export const CONTENT_GAP_CLASSES: Record<ChatMessageSize, string> = {
  sm: 'space-y-1.5',
  md: 'space-y-2',
  lg: 'space-y-2.5',
};

/** Text size classes by message size */
export const TEXT_SIZE_CLASSES: Record<ChatMessageSize, string> = {
  sm: 'text-sm',
  md: 'text-sm',
  lg: 'text-base',
};

/** Prose classes for content rendering */
export const PROSE_CLASSES = cn(
  'prose prose-sm max-w-none dark:prose-invert',
  'prose-p:my-2 prose-p:leading-relaxed',
  'prose-pre:bg-[rgb(var(--muted))] prose-pre:border prose-pre:border-[rgb(var(--border))]',
  'prose-code:text-[rgb(var(--primary))] prose-code:before:content-none prose-code:after:content-none',
  'text-[rgb(var(--foreground))]'
);

/** Tool calls section classes */
export const TOOL_CALLS_SECTION_CLASSES = 'mt-3 space-y-2';
export const TOOL_CALLS_HEADER_CLASSES =
  'flex items-center gap-1.5 text-xs font-medium text-[rgb(var(--muted-foreground))]';
export const TOOL_CALLS_LIST_CLASSES = 'space-y-1.5';

/** Tool call item classes */
export const TOOL_CALL_ITEM_CLASSES = cn(
  'rounded border bg-[rgb(var(--muted))]/50 px-3 py-2',
  'border-[rgb(var(--border))]'
);
export const TOOL_CALL_NAME_CLASSES = 'text-xs font-medium text-[rgb(var(--primary))]';
export const TOOL_CALL_ARGS_CLASSES =
  'mt-1.5 overflow-x-auto text-xs text-[rgb(var(--muted-foreground))]';

/** Model info classes */
export const MODEL_INFO_CLASSES = 'text-xs text-[rgb(var(--muted-foreground))]';

/** Streaming indicator classes */
export const STREAMING_INDICATOR_CLASSES =
  'flex items-center gap-1 text-xs text-[rgb(var(--muted-foreground))]';
export const STREAMING_TEXT_CLASSES =
  'motion-safe:animate-pulse text-[rgb(var(--muted-foreground))]';

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Parse tool calls from JSON string
 */
export function parseToolCalls(toolCallsJson?: string): ToolCall[] {
  if (!toolCallsJson) return [];
  try {
    return JSON.parse(toolCallsJson) as ToolCall[];
  } catch {
    return [];
  }
}

/**
 * Get base size value from ResponsiveValue
 */
export function getBaseSize(size: ResponsiveValue<ChatMessageSize>): ChatMessageSize {
  if (typeof size === 'string') return size;
  return size.base ?? 'md';
}

/**
 * Get responsive size classes
 */
export function getResponsiveSizeClasses(
  size: ResponsiveValue<ChatMessageSize>,
  classMap: Record<ChatMessageSize, string>
): string {
  if (typeof size === 'string') {
    return classMap[size];
  }

  const classes: string[] = [];
  const breakpointOrder: ChatMessageBreakpoint[] = ['base', 'sm', 'md', 'lg', 'xl', '2xl'];

  for (const bp of breakpointOrder) {
    const sizeValue = size[bp];
    if (sizeValue) {
      const sizeClass = classMap[sizeValue];
      if (bp === 'base') {
        classes.push(sizeClass);
      } else {
        // Add breakpoint prefix to each class
        const prefixedClasses = sizeClass
          .split(' ')
          .map((c) => `${bp}:${c}`)
          .join(' ');
        classes.push(prefixedClasses);
      }
    }
  }

  return classes.join(' ');
}

/**
 * Format timestamp for screen readers (more verbose)
 */
export function formatTimestampForSR(date: string): string {
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) {
    return 'Unknown time';
  }
  return d.toLocaleString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

/**
 * Get ISO datetime string for time element
 */
export function getISODateTime(date: string): string {
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) {
    return '';
  }
  return d.toISOString();
}

/**
 * Get role label based on role and custom labels
 */
export function getRoleLabel(
  role: MessageRole,
  userLabel?: string,
  assistantLabel?: string,
  systemLabel?: string
): string {
  switch (role) {
    case 'user':
      return userLabel ?? DEFAULT_USER_LABEL;
    case 'assistant':
      return assistantLabel ?? DEFAULT_ASSISTANT_LABEL;
    case 'system':
      return systemLabel ?? DEFAULT_SYSTEM_LABEL;
    default:
      return role;
  }
}

/**
 * Build accessible label for the message
 */
export function buildAccessibleLabel(
  role: MessageRole,
  content: string,
  isStreaming: boolean,
  hasToolCalls: boolean,
  toolCallCount: number
): string {
  const prefix = ROLE_CONFIG[role]?.srPrefix ?? `${role} said:`;
  const parts: string[] = [prefix];

  if (isStreaming && !content) {
    parts.push(SR_STREAMING);
  } else if (content) {
    // Truncate for screen reader announcement
    const truncated = content.length > 200 ? `${content.slice(0, 200)}...` : content;
    parts.push(truncated);
  }

  if (hasToolCalls) {
    parts.push(`${SR_TOOL_CALLS} ${toolCallCount} tool${toolCallCount !== 1 ? 's' : ''}`);
  }

  return parts.join(' ');
}

// ============================================================================
// Components
// ============================================================================

/**
 * Tool call display component
 */
export const ToolCallItem = forwardRef<HTMLDivElement, ToolCallItemProps>(function ToolCallItem(
  { toolCall, index, 'data-testid': testId },
  ref
) {
  return (
    <ListItem>
      <Box
        ref={ref}
        className={TOOL_CALL_ITEM_CLASSES}
        data-testid={testId ?? `tool-call-${index}`}
        data-tool-name={toolCall.name}
      >
        <Flex align="center" gap="2">
          <Box as="code" className={TOOL_CALL_NAME_CLASSES}>
            {toolCall.name}
          </Box>
        </Flex>
        {toolCall.arguments && Object.keys(toolCall.arguments).length > 0 && (
          <Box as="pre" className={TOOL_CALL_ARGS_CLASSES}>
            {JSON.stringify(toolCall.arguments, null, 2)}
          </Box>
        )}
      </Box>
    </ListItem>
  );
});

ToolCallItem.displayName = 'ToolCallItem';

/**
 * ChatMessage component for displaying a single message in a chat conversation.
 * Stateless - receives all data via props, no hooks or data fetching.
 *
 * Features:
 * - Role-based styling (user, assistant, system)
 * - Markdown content display
 * - Tool calls visualization
 * - Streaming indicator when content is being generated
 * - Timestamp display
 * - Full accessibility support
 *
 * @example
 * <ChatMessage message={message} />
 *
 * @example
 * <ChatMessage message={message} isStreaming={true} size="lg" />
 */
export const ChatMessage = forwardRef<HTMLElement, ChatMessageProps>(function ChatMessage(
  {
    message,
    isStreaming = false,
    className,
    size = 'md',
    userLabel,
    assistantLabel,
    systemLabel,
    streamingLabel = DEFAULT_STREAMING_LABEL,
    thinkingLabel = DEFAULT_THINKING_LABEL,
    toolCallsLabel = DEFAULT_TOOL_CALLS_LABEL,
    'data-testid': testId,
    ...props
  },
  ref
) {
  const { role, content, toolCalls, createdAt } = message;
  const config = ROLE_CONFIG[role];
  const parsedToolCalls = parseToolCalls(toolCalls);
  const hasToolCalls = parsedToolCalls.length > 0;
  const baseSize = getBaseSize(size);

  // Check if message is streaming (from prop or message field)
  const showStreaming = isStreaming || message.isStreaming;

  // Generate unique IDs for accessibility
  const headingId = useId();
  const contentId = useId();
  const toolCallsId = useId();

  // Get role label
  const roleLabel = getRoleLabel(role, userLabel, assistantLabel, systemLabel);

  // Build accessible label for the message
  const accessibleLabel = buildAccessibleLabel(
    role,
    content,
    showStreaming,
    hasToolCalls,
    parsedToolCalls.length
  );

  return (
    <Box
      as="article"
      ref={ref}
      className={cn(
        MESSAGE_BASE_CLASSES,
        ROLE_STYLES[role],
        getResponsiveSizeClasses(size, MESSAGE_PADDING_CLASSES),
        className
      )}
      aria-label={accessibleLabel}
      data-testid={testId}
      data-message-id={message.id}
      data-role={role}
      data-streaming={showStreaming || undefined}
      {...props}
    >
      {/* Avatar */}
      <Box
        className={cn(
          'flex shrink-0 items-center justify-center rounded-full',
          AVATAR_SIZE_CLASSES[baseSize],
          ICON_BG_STYLES[role]
        )}
        aria-hidden={true}
      >
        <Icon icon={config.icon} size={AVATAR_ICON_SIZE_MAP[baseSize]} />
      </Box>

      {/* Content area */}
      <Box className={cn('min-w-0 flex-1', CONTENT_GAP_CLASSES[baseSize])}>
        {/* Header: Role label and timestamp */}
        <Flex as="header" align="center" gap="2" className="flex-wrap">
          <Text
            as="span"
            id={headingId}
            weight="medium"
            color="foreground"
            className={TEXT_SIZE_CLASSES[baseSize]}
          >
            {roleLabel}
          </Text>
          {createdAt && (
            <Box
              as="time"
              dateTime={getISODateTime(createdAt)}
              className="text-xs text-[rgb(var(--muted-foreground))]"
              aria-label={formatTimestampForSR(createdAt)}
            >
              {formatCompact(createdAt)}
            </Box>
          )}
          {showStreaming && (
            <Text
              as="span"
              className={STREAMING_INDICATOR_CLASSES}
              role="status"
              aria-live="polite"
            >
              <Spinner size="xs" announce={false} />
              <Text as="span">{streamingLabel}</Text>
            </Text>
          )}
        </Flex>

        {/* Message content */}
        <Box
          id={contentId}
          className={cn(PROSE_CLASSES, TEXT_SIZE_CLASSES[baseSize])}
          aria-describedby={headingId}
        >
          {/* Render content as text - markdown rendering would be added later */}
          {content ? (
            <Box className="whitespace-pre-wrap">{content}</Box>
          ) : showStreaming ? (
            <Text as="span" className={STREAMING_TEXT_CLASSES}>
              {thinkingLabel}
            </Text>
          ) : null}
        </Box>

        {/* Tool calls section */}
        {hasToolCalls && (
          <Box as="section" className={TOOL_CALLS_SECTION_CLASSES} aria-labelledby={toolCallsId}>
            <Flex
              as="header"
              id={toolCallsId}
              align="center"
              gap="1.5"
              className={TOOL_CALLS_HEADER_CLASSES}
            >
              <Icon icon={Wrench} size="xs" aria-hidden={true} />
              <Text as="span" size="xs" weight="medium">
                {toolCallsLabel}
              </Text>
              <VisuallyHidden>
                {`, ${parsedToolCalls.length} tool${parsedToolCalls.length !== 1 ? 's' : ''} used`}
              </VisuallyHidden>
            </Flex>
            <List
              className={TOOL_CALLS_LIST_CLASSES}
              role="list"
              aria-label={`${toolCallsLabel} list`}
            >
              {parsedToolCalls.map((toolCall, index) => (
                <ToolCallItem
                  key={toolCall.id ?? `tool-${index}`}
                  toolCall={toolCall}
                  index={index}
                  size={baseSize}
                  data-testid={testId ? `${testId}-tool-${index}` : undefined}
                />
              ))}
            </List>
          </Box>
        )}

        {/* Model info (optional, for assistant messages) */}
        {role === 'assistant' && message.model && (
          <Text
            as="span"
            size="xs"
            color="muted-foreground"
            className={cn(MODEL_INFO_CLASSES, 'block')}
          >
            Model: {message.model}
            {message.tokensUsed && ` · ${message.tokensUsed.toLocaleString()} tokens`}
          </Text>
        )}

        {/* Screen reader announcement for streaming state changes */}
        {showStreaming && (
          <VisuallyHidden>
            <Text as="span" role="status" aria-live="polite" aria-atomic="true">
              {content
                ? `${roleLabel} is generating: ${content.slice(-100)}`
                : `${roleLabel} is thinking`}
            </Text>
          </VisuallyHidden>
        )}
      </Box>
    </Box>
  );
});

ChatMessage.displayName = 'ChatMessage';
