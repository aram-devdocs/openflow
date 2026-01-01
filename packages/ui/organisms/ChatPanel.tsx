/**
 * ChatPanel Organism - Chat conversation panel with message list and input
 *
 * A complete chat interface component that displays messages and provides
 * an input area for sending new messages. Supports loading, empty, and error states.
 *
 * Accessibility:
 * - aria-live region for new message announcements
 * - Proper ARIA roles for chat components
 * - Focus management for input area
 * - Keyboard navigation support (Enter to send)
 * - Screen reader announcements for state changes
 * - Touch targets ≥44px for mobile (WCAG 2.5.5)
 *
 * Features:
 * - Loading state with skeleton
 * - Error state with retry
 * - Empty state for no messages
 * - Auto-scroll to bottom on new messages
 * - Scroll-to-bottom button when scrolled up
 * - Executor profile selector dropdown
 * - Processing state with stop button
 * - Responsive sizing support
 */

import type { ExecutorProfile, Message } from '@openflow/generated';
import {
  type Breakpoint,
  Flex,
  type ResponsiveValue,
  Text,
  VisuallyHidden,
} from '@openflow/primitives';
import { cn } from '@openflow/utils';
import { AlertCircle, ChevronDown, MessageSquare, Send, StopCircle } from 'lucide-react';
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
import { Spinner } from '../atoms/Spinner';
import { Textarea } from '../atoms/Textarea';
import { Dropdown, type DropdownOption } from '../molecules/Dropdown';
import { EmptyState } from '../molecules/EmptyState';
import { ChatMessage } from './ChatMessage';

// ============================================================================
// Types
// ============================================================================

/** Breakpoint names for responsive values */
export type ChatPanelBreakpoint = Breakpoint;

/** Size variants for ChatPanel */
export type ChatPanelSize = 'sm' | 'md' | 'lg';

export interface ChatPanelProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  /** Array of messages to display in the chat */
  messages: Message[];
  /** Callback when user sends a message */
  onSendMessage?: (content: string) => void;
  /** Whether a process is currently running (disables input) */
  isProcessing?: boolean;
  /** Callback to stop the current process */
  onStopProcess?: () => void;
  /** Available executor profiles for selection */
  executorProfiles?: ExecutorProfile[];
  /** Currently selected executor profile ID */
  selectedExecutorProfileId?: string;
  /** Callback when executor profile selection changes */
  onExecutorProfileChange?: (profileId: string) => void;
  /** Placeholder text for the input area */
  placeholder?: string;
  /** Whether to show the executor profile selector */
  showExecutorSelector?: boolean;
  /** Whether to auto-scroll to bottom on new messages */
  autoScroll?: boolean;
  /** Size variant for responsive sizing */
  size?: ResponsiveValue<ChatPanelSize>;
  /** Data test ID for automated testing */
  'data-testid'?: string;
  /** Custom label for the messages region */
  messagesLabel?: string;
  /** Custom label for the input area */
  inputLabel?: string;
  /** Custom label for send button */
  sendLabel?: string;
  /** Custom label for stop button */
  stopLabel?: string;
  /** Custom label for scroll to bottom button */
  scrollLabel?: string;
  /** Custom label for empty state title */
  emptyTitle?: string;
  /** Custom label for empty state description */
  emptyDescription?: string;
  /** Custom label for helper text (Enter to send) */
  helperText?: string;
}

export interface ChatPanelSkeletonProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  /** Number of skeleton messages to display */
  messageCount?: number;
  /** Size variant for responsive sizing */
  size?: ResponsiveValue<ChatPanelSize>;
  /** Data test ID for automated testing */
  'data-testid'?: string;
}

export interface ChatPanelErrorProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  /** Error message to display */
  message?: string;
  /** Callback to retry loading */
  onRetry?: () => void;
  /** Size variant for responsive sizing */
  size?: ResponsiveValue<ChatPanelSize>;
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
export const DEFAULT_MESSAGES_LABEL = 'Chat messages';
export const DEFAULT_INPUT_LABEL = 'Message input';
export const DEFAULT_SEND_LABEL = 'Send message';
export const DEFAULT_STOP_LABEL = 'Stop process';
export const DEFAULT_SCROLL_LABEL = 'Scroll to bottom';
export const DEFAULT_EMPTY_TITLE = 'No messages yet';
export const DEFAULT_EMPTY_DESCRIPTION = 'Send a message to start the conversation.';
export const DEFAULT_PROCESSING_LABEL = 'Processing...';
export const DEFAULT_EXECUTOR_PLACEHOLDER = 'Select executor...';
export const DEFAULT_EXECUTOR_LABEL = 'Select executor profile';
export const DEFAULT_HELPER_TEXT = 'Press Enter to send, Shift+Enter for new line';
export const DEFAULT_ERROR_TITLE = 'Failed to load chat';
export const DEFAULT_ERROR_RETRY_LABEL = 'Retry';
export const DEFAULT_SKELETON_MESSAGE_COUNT = 4;

/** Screen reader announcements */
export const SR_NEW_MESSAGE = 'New message received';
export const SR_MESSAGE_SENT = 'Message sent';
export const SR_PROCESSING = 'Processing your request';
export const SR_PROCESSING_COMPLETE = 'Processing complete';
export const SR_SCROLL_AVAILABLE = 'New messages available. Click to scroll to bottom.';

/** Base classes for ChatPanel container */
export const CHAT_PANEL_BASE_CLASSES = 'flex h-full flex-col bg-[rgb(var(--background))]';

/** Size-specific padding classes */
export const CHAT_PANEL_PADDING_CLASSES: Record<ChatPanelSize, string> = {
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-5',
};

/** Size-specific gap classes */
export const CHAT_PANEL_GAP_CLASSES: Record<ChatPanelSize, string> = {
  sm: 'space-y-3',
  md: 'space-y-4',
  lg: 'space-y-5',
};

/** Messages container classes */
export const MESSAGES_CONTAINER_CLASSES = cn(
  'flex-1 overflow-y-auto',
  'scrollbar-thin scrollbar-thumb-[rgb(var(--border))] scrollbar-track-transparent'
);

/** Input area container classes */
export const INPUT_AREA_CONTAINER_CLASSES = 'border-t border-[rgb(var(--border))]';

/** Input row classes */
export const INPUT_ROW_CLASSES = 'flex gap-2';

/** Helper text classes */
export const HELPER_TEXT_CLASSES = 'mt-2 text-xs text-[rgb(var(--muted-foreground))]';

/** Keyboard shortcut badge classes */
export const KBD_CLASSES = 'rounded border border-[rgb(var(--border))] bg-[rgb(var(--muted))] px-1';

/** Processing indicator classes */
export const PROCESSING_INDICATOR_CLASSES = cn(
  'flex items-center gap-2 px-4 py-2 text-sm text-[rgb(var(--muted-foreground))]'
);

/** Scroll button container classes */
export const SCROLL_BUTTON_CONTAINER_CLASSES = 'absolute bottom-24 left-1/2 -translate-x-1/2';

/** Scroll button classes */
export const SCROLL_BUTTON_CLASSES = 'shadow-md';

/** Empty state container classes */
export const EMPTY_STATE_CONTAINER_CLASSES =
  'flex h-full min-h-[200px] items-center justify-center';

/** Skeleton message classes */
export const SKELETON_MESSAGE_CLASSES = 'flex gap-3';

/** Skeleton avatar classes */
export const SKELETON_AVATAR_SIZE: Record<ChatPanelSize, { width: number; height: number }> = {
  sm: { width: 28, height: 28 },
  md: { width: 32, height: 32 },
  lg: { width: 40, height: 40 },
};

/** Skeleton bubble classes */
export const SKELETON_BUBBLE_CLASSES: Record<ChatPanelSize, string> = {
  sm: 'space-y-1.5 rounded-md p-2',
  md: 'space-y-2 rounded-lg p-3',
  lg: 'space-y-2.5 rounded-xl p-4',
};

/** Error state classes */
export const ERROR_STATE_CLASSES = 'flex h-full items-center justify-center';

/** Error icon classes */
export const ERROR_ICON_CONTAINER_CLASSES =
  'mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10';

/** Error icon color classes */
export const ERROR_ICON_CLASSES = 'h-6 w-6 text-destructive';

// ============================================================================
// Utility Functions
// ============================================================================

/** Breakpoint order for responsive class generation */
const BREAKPOINT_ORDER: Breakpoint[] = ['base', 'sm', 'md', 'lg', 'xl', '2xl'];

/**
 * Get base size from responsive value
 */
export function getBaseSize(size: ResponsiveValue<ChatPanelSize>): ChatPanelSize {
  if (typeof size === 'string') return size;
  if (typeof size === 'object' && size !== null) {
    return (size as Partial<Record<Breakpoint, ChatPanelSize>>).base ?? 'md';
  }
  return 'md';
}

/**
 * Get responsive size classes
 */
export function getResponsiveSizeClasses(
  size: ResponsiveValue<ChatPanelSize>,
  classMap: Record<ChatPanelSize, string>
): string {
  if (typeof size === 'string') {
    return classMap[size];
  }

  if (typeof size !== 'object' || size === null) {
    return classMap.md;
  }

  const classes: string[] = [];
  const sizeObj = size as Partial<Record<Breakpoint, ChatPanelSize>>;

  for (const bp of BREAKPOINT_ORDER) {
    const sizeValue = sizeObj[bp];
    if (sizeValue !== undefined) {
      const sizeClasses = classMap[sizeValue];
      if (bp === 'base') {
        classes.push(sizeClasses);
      } else {
        const prefixedClasses = sizeClasses
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
 * Get avatar dimensions for skeleton (uses base size)
 */
export function getSkeletonAvatarDimensions(size: ResponsiveValue<ChatPanelSize>): {
  width: number;
  height: number;
} {
  const baseSize = getBaseSize(size);
  return SKELETON_AVATAR_SIZE[baseSize];
}

/**
 * Build announcement for new messages
 */
export function buildNewMessageAnnouncement(messageCount: number, hasUnread: boolean): string {
  if (!hasUnread) return '';
  if (messageCount === 1) return SR_NEW_MESSAGE;
  return `${messageCount} new messages`;
}

// ============================================================================
// Sub-components
// ============================================================================

/**
 * Skeleton loading state for ChatPanel
 */
export const ChatPanelSkeleton = forwardRef<HTMLDivElement, ChatPanelSkeletonProps>(
  function ChatPanelSkeleton(
    {
      messageCount = DEFAULT_SKELETON_MESSAGE_COUNT,
      size = 'md',
      className,
      'data-testid': testId,
      ...props
    },
    ref
  ) {
    const paddingClasses = getResponsiveSizeClasses(size, CHAT_PANEL_PADDING_CLASSES);
    const gapClasses = getResponsiveSizeClasses(size, CHAT_PANEL_GAP_CLASSES);
    const bubbleClasses = getResponsiveSizeClasses(size, SKELETON_BUBBLE_CLASSES);
    const avatarDimensions = getSkeletonAvatarDimensions(size);

    return (
      <div
        ref={ref}
        className={cn(CHAT_PANEL_BASE_CLASSES, className)}
        aria-hidden="true"
        role="presentation"
        data-testid={testId}
        data-message-count={messageCount}
        {...props}
      >
        {/* Skeleton messages area */}
        <div className={cn('flex-1 overflow-hidden', paddingClasses)}>
          <div className={cn('flex flex-col', gapClasses)}>
            {Array.from({ length: messageCount }).map((_, index) => {
              const isUser = index % 2 !== 0;
              return (
                <div
                  key={`skeleton-message-${index}`}
                  className={cn(SKELETON_MESSAGE_CLASSES, isUser && 'flex-row-reverse')}
                  data-testid={testId ? `${testId}-message-${index}` : undefined}
                >
                  <Skeleton
                    variant="circular"
                    width={avatarDimensions.width}
                    height={avatarDimensions.height}
                  />
                  <div
                    className={cn(
                      bubbleClasses,
                      'flex-1',
                      isUser ? 'bg-[rgb(var(--primary))]/10' : 'bg-[rgb(var(--muted))]'
                    )}
                  >
                    <Skeleton variant="text" className="h-4 w-3/4" />
                    <Skeleton variant="text" className="h-4 w-1/2" />
                    {!isUser && <Skeleton variant="text" className="h-4 w-2/3" />}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Skeleton input area */}
        <div className={cn(INPUT_AREA_CONTAINER_CLASSES, paddingClasses)}>
          <div className={INPUT_ROW_CLASSES}>
            <Skeleton variant="rectangular" className="h-[44px] flex-1 rounded-md" />
            <Skeleton variant="rectangular" className="h-[44px] w-[44px] rounded-md" />
          </div>
        </div>
      </div>
    );
  }
);

ChatPanelSkeleton.displayName = 'ChatPanelSkeleton';

/**
 * Error state for ChatPanel
 */
export const ChatPanelError = forwardRef<HTMLDivElement, ChatPanelErrorProps>(
  function ChatPanelError(
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
  ) {
    return (
      <div
        ref={ref}
        className={cn(CHAT_PANEL_BASE_CLASSES, ERROR_STATE_CLASSES, className)}
        role="alert"
        aria-live="assertive"
        data-testid={testId}
        {...props}
      >
        <div className="flex flex-col items-center text-center">
          <div className={ERROR_ICON_CONTAINER_CLASSES}>
            <Icon icon={AlertCircle} className={ERROR_ICON_CLASSES} aria-hidden="true" />
          </div>
          <Text as="strong" size="base" weight="medium" color="foreground" className="mb-1">
            {errorTitle}
          </Text>
          {message && (
            <Text as="p" size="sm" color="muted-foreground" className="mb-4 max-w-sm">
              {message}
            </Text>
          )}
          {onRetry && (
            <Button variant="primary" size="md" onClick={onRetry}>
              {retryLabel}
            </Button>
          )}
        </div>
      </div>
    );
  }
);

ChatPanelError.displayName = 'ChatPanelError';

// ============================================================================
// Main Component
// ============================================================================

/**
 * ChatPanel component for displaying a chat conversation with input area.
 * Stateless - receives all data via props, emits actions via callbacks.
 *
 * Features:
 * - Message list with ChatMessage components
 * - Input area with send button
 * - Executor profile selector dropdown
 * - Auto-scroll to bottom on new messages
 * - Processing state with stop button
 * - Keyboard shortcuts (Enter to send, Shift+Enter for newline)
 * - Loading skeleton state
 * - Error state with retry
 * - Empty state for no messages
 * - Full accessibility support
 *
 * @example
 * // Basic usage
 * <ChatPanel
 *   messages={messages}
 *   onSendMessage={handleSend}
 *   isProcessing={isProcessing}
 *   onStopProcess={handleStop}
 * />
 *
 * @example
 * // With executor selector
 * <ChatPanel
 *   messages={messages}
 *   onSendMessage={handleSend}
 *   executorProfiles={profiles}
 *   selectedExecutorProfileId={selectedProfileId}
 *   onExecutorProfileChange={setSelectedProfileId}
 *   showExecutorSelector
 * />
 *
 * @example
 * // Responsive sizing
 * <ChatPanel
 *   messages={messages}
 *   onSendMessage={handleSend}
 *   size={{ base: 'sm', md: 'md', lg: 'lg' }}
 * />
 */
export const ChatPanel = forwardRef<HTMLDivElement, ChatPanelProps>(function ChatPanel(
  {
    messages,
    onSendMessage,
    isProcessing = false,
    onStopProcess,
    executorProfiles = [],
    selectedExecutorProfileId,
    onExecutorProfileChange,
    placeholder = 'Type a message...',
    showExecutorSelector = false,
    autoScroll = true,
    className,
    size = 'md',
    'data-testid': testId,
    messagesLabel = DEFAULT_MESSAGES_LABEL,
    inputLabel = DEFAULT_INPUT_LABEL,
    sendLabel = DEFAULT_SEND_LABEL,
    stopLabel = DEFAULT_STOP_LABEL,
    scrollLabel = DEFAULT_SCROLL_LABEL,
    emptyTitle = DEFAULT_EMPTY_TITLE,
    emptyDescription = DEFAULT_EMPTY_DESCRIPTION,
    helperText = DEFAULT_HELPER_TEXT,
    ...props
  },
  ref
) {
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [prevMessageCount, setPrevMessageCount] = useState(messages.length);
  const [announcement, setAnnouncement] = useState('');

  // Generate unique IDs for accessibility
  const messagesRegionId = useId();
  const inputAreaId = useId();

  // Get size classes
  const paddingClasses = getResponsiveSizeClasses(size, CHAT_PANEL_PADDING_CLASSES);
  const gapClasses = getResponsiveSizeClasses(size, CHAT_PANEL_GAP_CLASSES);
  const baseSize = getBaseSize(size);

  // Convert executor profiles to dropdown options
  const executorOptions: DropdownOption[] = executorProfiles.map((profile) => ({
    value: profile.id,
    label: profile.name,
  }));

  // Handle scroll position tracking
  const handleScroll = useCallback(() => {
    if (!messagesContainerRef.current) return;

    const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
    const atBottom = distanceFromBottom < 50;

    setIsAtBottom(atBottom);
    setShowScrollButton(!atBottom && messages.length > 0);
  }, [messages.length]);

  // Scroll to bottom
  const scrollToBottom = useCallback((smooth = true) => {
    messagesEndRef.current?.scrollIntoView({
      behavior: smooth ? 'smooth' : 'auto',
    });
  }, []);

  // Auto-scroll when new messages arrive
  useEffect(() => {
    if (autoScroll && isAtBottom) {
      scrollToBottom(false);
    }
  }, [autoScroll, isAtBottom, scrollToBottom]);

  // Announce new messages for screen readers
  useEffect(() => {
    if (messages.length > prevMessageCount) {
      const newCount = messages.length - prevMessageCount;
      const announcementText = buildNewMessageAnnouncement(newCount, !isAtBottom);
      if (announcementText) {
        setAnnouncement(announcementText);
        // Clear announcement after a delay
        setTimeout(() => setAnnouncement(''), 1000);
      }
    }
    setPrevMessageCount(messages.length);
  }, [messages.length, prevMessageCount, isAtBottom]);

  // Handle send message
  const handleSend = useCallback(() => {
    const trimmedValue = inputValue.trim();
    if (!trimmedValue || isProcessing) return;

    onSendMessage?.(trimmedValue);
    setInputValue('');
    setAnnouncement(SR_MESSAGE_SENT);

    // Focus textarea after sending
    textareaRef.current?.focus();
  }, [inputValue, isProcessing, onSendMessage]);

  // Handle keyboard shortcuts
  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
      // Enter without shift sends the message
      if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        handleSend();
      }
    },
    [handleSend]
  );

  // Check if we have any messages
  const hasMessages = messages.length > 0;

  // Check if the last message is streaming
  const isLastMessageStreaming = hasMessages && messages[messages.length - 1]?.isStreaming;

  return (
    <div
      ref={ref}
      className={cn(CHAT_PANEL_BASE_CLASSES, className)}
      data-testid={testId}
      data-message-count={messages.length}
      data-processing={isProcessing || undefined}
      {...props}
    >
      {/* Screen reader announcements */}
      <VisuallyHidden>
        <div role="status" aria-live="polite" aria-atomic="true">
          {announcement}
        </div>
      </VisuallyHidden>

      {/* Messages area */}
      <div
        ref={messagesContainerRef}
        onScroll={handleScroll}
        className={MESSAGES_CONTAINER_CLASSES}
        role="log"
        aria-label={messagesLabel}
        aria-live="polite"
        aria-relevant="additions"
        id={messagesRegionId}
        tabIndex={0}
      >
        <div className={cn(paddingClasses, gapClasses)}>
          {/* Empty state */}
          {!hasMessages && (
            <div className={EMPTY_STATE_CONTAINER_CLASSES}>
              <EmptyState
                icon={MessageSquare}
                title={emptyTitle}
                description={emptyDescription}
                size={baseSize}
                data-testid={testId ? `${testId}-empty` : undefined}
              />
            </div>
          )}

          {/* Message list */}
          {messages.map((message, index) => (
            <ChatMessage
              key={message.id}
              message={message}
              isStreaming={index === messages.length - 1 && message.isStreaming}
              size={baseSize}
              data-testid={testId ? `${testId}-message-${index}` : undefined}
            />
          ))}

          {/* Processing indicator when no streaming message */}
          {isProcessing && !isLastMessageStreaming && (
            <div
              className={PROCESSING_INDICATOR_CLASSES}
              role="status"
              aria-label={DEFAULT_PROCESSING_LABEL}
            >
              <Spinner size="sm" announce={false} />
              <Text as="span" size="sm" color="muted-foreground">
                {DEFAULT_PROCESSING_LABEL}
              </Text>
            </div>
          )}

          {/* Scroll anchor */}
          <div ref={messagesEndRef} aria-hidden="true" />
        </div>
      </div>

      {/* Scroll to bottom button */}
      {showScrollButton && (
        <div className={SCROLL_BUTTON_CONTAINER_CLASSES}>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => scrollToBottom(true)}
            className={SCROLL_BUTTON_CLASSES}
            aria-label={scrollLabel}
          >
            <Icon icon={ChevronDown} size="sm" aria-hidden="true" />
            <span>New messages</span>
          </Button>
        </div>
      )}

      {/* Input area */}
      <div
        className={cn(INPUT_AREA_CONTAINER_CLASSES, paddingClasses)}
        id={inputAreaId}
        role="region"
        aria-label={inputLabel}
      >
        {/* Executor profile selector */}
        {showExecutorSelector && executorProfiles.length > 0 && (
          <div className="mb-3">
            <Dropdown
              options={executorOptions}
              value={selectedExecutorProfileId}
              onChange={(value) => onExecutorProfileChange?.(value)}
              placeholder={DEFAULT_EXECUTOR_PLACEHOLDER}
              aria-label={DEFAULT_EXECUTOR_LABEL}
              className="max-w-xs"
              data-testid={testId ? `${testId}-executor-dropdown` : undefined}
            />
          </div>
        )}

        {/* Input row */}
        <div className={INPUT_ROW_CLASSES}>
          <Textarea
            ref={textareaRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={isProcessing}
            resize="none"
            className="min-h-[44px] max-h-[200px] flex-1 py-2.5"
            aria-label={inputLabel}
            aria-describedby={`${inputAreaId}-helper`}
            data-testid={testId ? `${testId}-input` : undefined}
          />

          {/* Action buttons */}
          <Flex direction="column" gap="1">
            {isProcessing && onStopProcess ? (
              <Button
                variant="destructive"
                size="md"
                onClick={onStopProcess}
                className="h-[44px] min-h-[44px] w-[44px] min-w-[44px] p-0"
                aria-label={stopLabel}
                data-testid={testId ? `${testId}-stop-button` : undefined}
              >
                <Icon icon={StopCircle} size="md" aria-hidden="true" />
              </Button>
            ) : (
              <Button
                variant="primary"
                size="md"
                onClick={handleSend}
                disabled={!inputValue.trim() || isProcessing}
                className="h-[44px] min-h-[44px] w-[44px] min-w-[44px] p-0"
                aria-label={sendLabel}
                data-testid={testId ? `${testId}-send-button` : undefined}
              >
                <Icon icon={Send} size="md" aria-hidden="true" />
              </Button>
            )}
          </Flex>
        </div>

        {/* Helper text */}
        <Text as="p" id={`${inputAreaId}-helper`} className={HELPER_TEXT_CLASSES}>
          Press <kbd className={KBD_CLASSES}>Enter</kbd> to send,{' '}
          <kbd className={KBD_CLASSES}>Shift+Enter</kbd> for new line
        </Text>
      </div>
    </div>
  );
});

ChatPanel.displayName = 'ChatPanel';
