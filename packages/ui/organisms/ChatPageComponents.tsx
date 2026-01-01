/**
 * Chat Page Components
 *
 * Stateless UI components for the standalone chat page.
 * These are composed in the route to create the full chat experience.
 *
 * Accessibility:
 * - Proper heading hierarchy with semantic h1/h2 elements
 * - Screen reader announcements for loading, empty, and error states
 * - Focus management with visible focus rings
 * - Touch targets ≥44px (WCAG 2.5.5)
 * - motion-safe transitions for reduced motion support
 * - Proper ARIA labels and roles
 */

import type { MessageRole } from '@openflow/generated';
import { Flex, Heading, Text, VisuallyHidden } from '@openflow/primitives';
import { cn } from '@openflow/utils';
import {
  AlertCircle,
  ArrowLeft,
  Bot,
  MessageSquare,
  RefreshCw,
  Send,
  StopCircle,
  Terminal,
} from 'lucide-react';
import { type ReactNode, type RefObject, forwardRef, useId } from 'react';
import { Button } from '../atoms/Button';
import { Icon } from '../atoms/Icon';
import { Skeleton } from '../atoms/Skeleton';
import { SkeletonChat } from '../molecules/SkeletonChat';
import {
  AssistantMessageBubble,
  BubbleMessageList,
  BubbleMessageListItem,
  type DisplayItem,
  StreamingResponse,
  UserMessageBubble,
} from './ChatBubbles';
import type { PermissionRequest } from './PermissionDialog';
import { PermissionDialog } from './PermissionDialog';

// ============================================================================
// Types
// ============================================================================

/** Responsive size type */
export type ChatPageSize = 'sm' | 'md' | 'lg';

/** Responsive breakpoint type */
export type ChatPageBreakpoint = 'base' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

/** Responsive value type */
export type ResponsiveValue<T> = T | Partial<Record<ChatPageBreakpoint, T>>;

// ============================================================================
// Constants
// ============================================================================

/** Default labels for screen reader announcements */
export const DEFAULT_BACK_LABEL = 'Go back';
export const DEFAULT_UNTITLED_CHAT = 'Untitled Chat';
export const DEFAULT_TOGGLE_RAW_LABEL_SHOW = 'Show raw output';
export const DEFAULT_TOGGLE_RAW_LABEL_HIDE = 'Show formatted output';
export const DEFAULT_EMPTY_TITLE = 'Start a conversation';
export const DEFAULT_EMPTY_DESCRIPTION =
  'Send a message to start working with Claude. You can ask questions, request code changes, or give instructions.';
export const DEFAULT_NOT_FOUND_TITLE = 'Chat not found';
export const DEFAULT_NOT_FOUND_DESCRIPTION =
  "The chat you're looking for doesn't exist or has been deleted.";
export const DEFAULT_SEND_LABEL = 'Send message';
export const DEFAULT_STOP_LABEL = 'Stop process';
export const DEFAULT_INPUT_PLACEHOLDER = 'Type a message...';
export const DEFAULT_ERROR_TITLE = 'Failed to load chat';
export const DEFAULT_ERROR_RETRY_LABEL = 'Retry';

/** Screen reader announcement constants */
export const SR_LOADING = 'Loading chat...';
export const SR_NOT_FOUND = 'Chat not found';
export const SR_EMPTY = 'No messages yet. Start a conversation by sending a message.';
export const SR_PROCESSING = 'Claude is responding...';
export const SR_SEND_HINT = 'Press Enter to send, Shift+Enter for new line';

/** Layout class constants */
export const CHAT_PAGE_LAYOUT_CLASSES = 'flex h-full flex-col bg-[rgb(var(--background))]';
export const CHAT_PAGE_CONTENT_WRAPPER_CLASSES = 'flex-1 overflow-y-auto';
export const CHAT_PAGE_CONTENT_CONTAINER_CLASSES = 'mx-auto max-w-4xl px-3 py-4 md:px-4 md:py-6';

/** Skeleton classes */
export const SKELETON_HEADER_CLASSES =
  'flex items-center gap-3 border-b border-[rgb(var(--border))] bg-[rgb(var(--card))] px-4 py-3';
export const SKELETON_CONTENT_WRAPPER_CLASSES = 'flex-1 overflow-y-auto';
export const SKELETON_CONTENT_CONTAINER_CLASSES = 'mx-auto max-w-4xl px-4 py-6';
export const SKELETON_INPUT_WRAPPER_CLASSES =
  'border-t border-[rgb(var(--border))] bg-[rgb(var(--card))]';
export const SKELETON_INPUT_CONTAINER_CLASSES = 'mx-auto max-w-4xl px-4 py-4';

/** Not found classes */
export const NOT_FOUND_CLASSES =
  'flex h-full flex-col items-center justify-center bg-[rgb(var(--background))] p-8';
export const NOT_FOUND_ICON_CLASSES = 'mb-4 h-16 w-16 text-[rgb(var(--muted-foreground))]';

/** Error state classes */
export const ERROR_STATE_CLASSES =
  'flex h-full flex-col items-center justify-center bg-[rgb(var(--background))] p-8';
export const ERROR_ICON_CLASSES = 'mb-4 h-16 w-16 text-[rgb(var(--destructive))]';

/** Header classes */
export const HEADER_CONTAINER_CLASSES =
  'flex items-center gap-2 border-b border-[rgb(var(--border))] bg-[rgb(var(--card))] px-3 py-2 md:gap-3 md:px-4 md:py-3';
export const HEADER_BACK_BUTTON_CLASSES =
  'h-8 w-8 shrink-0 p-0 min-h-[44px] min-w-[44px] sm:min-h-8 sm:min-w-8';
export const HEADER_CONTENT_WRAPPER_CLASSES = 'flex min-w-0 flex-1 items-center gap-2 md:gap-2.5';
export const HEADER_ICON_CONTAINER_CLASSES =
  'hidden h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[rgb(var(--primary))]/10 sm:flex';
export const HEADER_TEXT_WRAPPER_CLASSES = 'min-w-0 flex-1';
export const HEADER_TOGGLE_BUTTON_CLASSES =
  'h-8 shrink-0 gap-1.5 px-2 text-xs sm:px-3 min-h-[44px] sm:min-h-8';

/** Empty state classes */
export const EMPTY_STATE_CLASSES = 'flex flex-col items-center justify-center py-16 text-center';
export const EMPTY_STATE_ICON_CONTAINER_CLASSES =
  'mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[rgb(var(--primary))]/10';

/** Message list classes */
export const MESSAGE_LIST_CLASSES = 'space-y-6';

/** Input area classes */
export const INPUT_AREA_CONTAINER_CLASSES =
  'border-t border-[rgb(var(--border))] bg-[rgb(var(--card))]';
export const INPUT_AREA_INNER_CLASSES = 'mx-auto max-w-4xl px-3 py-3 md:px-4 md:py-4';
export const INPUT_AREA_WRAPPER_CLASSES = 'flex gap-2 md:gap-3';
export const TEXTAREA_CLASSES = cn(
  'w-full resize-none rounded-xl border border-[rgb(var(--border))]',
  'bg-[rgb(var(--background))] px-3 py-3 md:px-4',
  'text-sm text-[rgb(var(--foreground))]',
  'placeholder:text-[rgb(var(--muted-foreground))]',
  'focus:border-[rgb(var(--primary))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--primary))]/20',
  'focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
  'disabled:cursor-not-allowed disabled:opacity-50',
  'min-h-[44px] max-h-[200px]'
);
export const INPUT_BUTTON_CLASSES = 'h-11 w-11 shrink-0 rounded-xl p-0 min-h-[44px] min-w-[44px]';
export const HELPER_TEXT_CLASSES =
  'mt-2 hidden text-center text-xs text-[rgb(var(--muted-foreground))] sm:block';
export const KBD_CLASSES =
  'rounded border border-[rgb(var(--border))] bg-[rgb(var(--muted))] px-1.5 py-0.5 font-mono text-[10px]';

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Get base size from responsive value
 */
export function getBaseSize(size: ResponsiveValue<ChatPageSize>): ChatPageSize {
  if (typeof size === 'string') return size;
  return size.base ?? 'md';
}

/**
 * Get responsive size classes
 */
export function getResponsiveSizeClasses(
  size: ResponsiveValue<ChatPageSize>,
  sizeMap: Record<ChatPageSize, string>
): string {
  if (typeof size === 'string') {
    return sizeMap[size];
  }

  return Object.entries(size)
    .map(([breakpoint, sizeValue]) => {
      if (!sizeValue) return '';
      const classes = sizeMap[sizeValue];
      if (breakpoint === 'base') return classes;
      return classes
        .split(' ')
        .map((c) => `${breakpoint}:${c}`)
        .join(' ');
    })
    .filter(Boolean)
    .join(' ');
}

/**
 * Build accessible label for header
 */
export function buildHeaderAccessibleLabel(
  title: string | undefined,
  projectName: string | undefined
): string {
  const titleLabel = title ?? DEFAULT_UNTITLED_CHAT;
  if (projectName) {
    return `${titleLabel} in project ${projectName}`;
  }
  return titleLabel;
}

/**
 * Get toggle button label based on state
 */
export function getToggleButtonLabel(showRawOutput: boolean): string {
  return showRawOutput ? DEFAULT_TOGGLE_RAW_LABEL_HIDE : DEFAULT_TOGGLE_RAW_LABEL_SHOW;
}

// ============================================================================
// Chat Page Layout
// ============================================================================

export interface ChatPageLayoutProps {
  /** Header component */
  header: ReactNode;
  /** Main content area */
  children: ReactNode;
  /** Input area component */
  inputArea: ReactNode;
  /** Permission dialog (optional) */
  permissionDialog?: ReactNode;
  /** Additional CSS classes */
  className?: string;
  /** Data test id */
  'data-testid'?: string;
}

/**
 * ChatPageLayout provides the main structure for the chat page.
 */
export const ChatPageLayout = forwardRef<HTMLDivElement, ChatPageLayoutProps>(
  function ChatPageLayout(
    { header, children, inputArea, permissionDialog, className, 'data-testid': testId },
    ref
  ) {
    return (
      <div ref={ref} className={cn(CHAT_PAGE_LAYOUT_CLASSES, className)} data-testid={testId}>
        {permissionDialog}
        {header}
        <div className={CHAT_PAGE_CONTENT_WRAPPER_CLASSES}>
          <main className={CHAT_PAGE_CONTENT_CONTAINER_CLASSES}>{children}</main>
        </div>
        {inputArea}
      </div>
    );
  }
);

// ============================================================================
// Loading Skeleton
// ============================================================================

export interface ChatLoadingSkeletonProps {
  /** Additional CSS classes */
  className?: string;
  /** Data test id */
  'data-testid'?: string;
}

/**
 * ChatLoadingSkeleton shows a loading state for the chat page.
 */
export const ChatLoadingSkeleton = forwardRef<HTMLDivElement, ChatLoadingSkeletonProps>(
  function ChatLoadingSkeleton({ className, 'data-testid': testId }, ref) {
    return (
      <div
        ref={ref}
        className={cn(CHAT_PAGE_LAYOUT_CLASSES, className)}
        role="status"
        aria-label={SR_LOADING}
        aria-busy="true"
        data-testid={testId}
      >
        <VisuallyHidden>{SR_LOADING}</VisuallyHidden>

        {/* Skeleton Header */}
        <div className={SKELETON_HEADER_CLASSES} aria-hidden="true">
          <Skeleton variant="circular" width={32} height={32} />
          <div className="flex items-center gap-2.5">
            <Skeleton variant="circular" width={32} height={32} />
            <div className="space-y-1">
              <Skeleton variant="text" className="h-4 w-32" />
              <Skeleton variant="text" className="h-3 w-20" />
            </div>
          </div>
        </div>

        {/* Skeleton Chat Messages */}
        <div className={SKELETON_CONTENT_WRAPPER_CLASSES} aria-hidden="true">
          <div className={SKELETON_CONTENT_CONTAINER_CLASSES}>
            <SkeletonChat messageCount={4} />
          </div>
        </div>

        {/* Skeleton Input Area */}
        <div className={SKELETON_INPUT_WRAPPER_CLASSES} aria-hidden="true">
          <div className={SKELETON_INPUT_CONTAINER_CLASSES}>
            <div className="flex gap-3">
              <Skeleton className="flex-1 h-12 rounded-xl" />
              <Skeleton variant="circular" width={48} height={48} className="rounded-xl" />
            </div>
          </div>
        </div>
      </div>
    );
  }
);

// ============================================================================
// Not Found State
// ============================================================================

export interface ChatNotFoundProps {
  /** Callback when back button is clicked */
  onBack: () => void;
  /** Custom title */
  title?: string;
  /** Custom description */
  description?: string;
  /** Back button label */
  backLabel?: string;
  /** Additional CSS classes */
  className?: string;
  /** Data test id */
  'data-testid'?: string;
}

/**
 * ChatNotFound shows when the chat doesn't exist.
 */
export const ChatNotFound = forwardRef<HTMLDivElement, ChatNotFoundProps>(function ChatNotFound(
  {
    onBack,
    title = DEFAULT_NOT_FOUND_TITLE,
    description = DEFAULT_NOT_FOUND_DESCRIPTION,
    backLabel = 'Back to Dashboard',
    className,
    'data-testid': testId,
  },
  ref
) {
  return (
    <div
      ref={ref}
      className={cn(NOT_FOUND_CLASSES, className)}
      role="status"
      aria-label={SR_NOT_FOUND}
      data-testid={testId}
    >
      <VisuallyHidden aria-live="polite">{SR_NOT_FOUND}</VisuallyHidden>
      <AlertCircle className={NOT_FOUND_ICON_CLASSES} aria-hidden="true" />
      <Heading level={2} size="lg" weight="semibold">
        {title}
      </Heading>
      <Text size="sm" color="muted-foreground" className="mt-2 max-w-sm text-center">
        {description}
      </Text>
      <Button variant="primary" className="mt-4" onClick={onBack}>
        {backLabel}
      </Button>
    </div>
  );
});

// ============================================================================
// Error State
// ============================================================================

export interface ChatErrorStateProps {
  /** Error message to display */
  message?: string;
  /** Callback when retry button is clicked */
  onRetry?: () => void;
  /** Custom title */
  title?: string;
  /** Retry button label */
  retryLabel?: string;
  /** Additional CSS classes */
  className?: string;
  /** Data test id */
  'data-testid'?: string;
}

/**
 * ChatErrorState shows when loading fails.
 */
export const ChatErrorState = forwardRef<HTMLDivElement, ChatErrorStateProps>(
  function ChatErrorState(
    {
      message,
      onRetry,
      title = DEFAULT_ERROR_TITLE,
      retryLabel = DEFAULT_ERROR_RETRY_LABEL,
      className,
      'data-testid': testId,
    },
    ref
  ) {
    const errorAnnouncement = `Error: ${title}. ${message ?? ''}`;

    return (
      <div
        ref={ref}
        className={cn(ERROR_STATE_CLASSES, className)}
        role="alert"
        aria-live="assertive"
        data-testid={testId}
      >
        <VisuallyHidden>{errorAnnouncement}</VisuallyHidden>
        <AlertCircle className={ERROR_ICON_CLASSES} aria-hidden="true" />
        <Heading level={2} size="lg" weight="semibold">
          {title}
        </Heading>
        {message && (
          <Text size="sm" color="muted-foreground" className="mt-2 max-w-sm text-center">
            {message}
          </Text>
        )}
        {onRetry && (
          <Button
            variant="primary"
            className="mt-4"
            onClick={onRetry}
            icon={<RefreshCw className="h-4 w-4" />}
          >
            {retryLabel}
          </Button>
        )}
      </div>
    );
  }
);

// ============================================================================
// Header
// ============================================================================

export interface ChatHeaderProps {
  /** Chat title */
  title?: string;
  /** Project name */
  projectName?: string;
  /** Whether raw output is shown */
  showRawOutput: boolean;
  /** Callback to toggle raw output */
  onToggleRawOutput: () => void;
  /** Callback when back button is clicked */
  onBack: () => void;
  /** Custom back button label */
  backLabel?: string;
  /** Additional CSS classes */
  className?: string;
  /** Data test id */
  'data-testid'?: string;
}

/**
 * ChatHeader shows the chat title, project name, and view toggle.
 */
export const ChatHeader = forwardRef<HTMLElement, ChatHeaderProps>(function ChatHeader(
  {
    title,
    projectName,
    showRawOutput,
    onToggleRawOutput,
    onBack,
    backLabel = DEFAULT_BACK_LABEL,
    className,
    'data-testid': testId,
  },
  ref
) {
  const toggleLabel = getToggleButtonLabel(showRawOutput);
  const accessibleLabel = buildHeaderAccessibleLabel(title, projectName);

  return (
    <header
      ref={ref}
      className={cn(HEADER_CONTAINER_CLASSES, className)}
      aria-label={accessibleLabel}
      data-testid={testId}
    >
      <Button
        variant="ghost"
        size="sm"
        onClick={onBack}
        className={HEADER_BACK_BUTTON_CLASSES}
        aria-label={backLabel}
      >
        <Icon icon={ArrowLeft} size="sm" aria-hidden="true" />
      </Button>

      <Flex align="center" gap="2" className={HEADER_CONTENT_WRAPPER_CLASSES}>
        <div className={HEADER_ICON_CONTAINER_CLASSES}>
          <Icon
            icon={MessageSquare}
            size="sm"
            className="text-[rgb(var(--primary))]"
            aria-hidden="true"
          />
        </div>
        <div className={HEADER_TEXT_WRAPPER_CLASSES}>
          <Heading level={1} size="sm" weight="semibold" truncate>
            {title ?? DEFAULT_UNTITLED_CHAT}
          </Heading>
          {projectName && (
            <Text size="xs" color="muted-foreground" truncate>
              {projectName}
            </Text>
          )}
        </div>
      </Flex>

      {/* View toggle */}
      <Button
        variant={showRawOutput ? 'secondary' : 'ghost'}
        size="sm"
        onClick={onToggleRawOutput}
        className={HEADER_TOGGLE_BUTTON_CLASSES}
        aria-label={toggleLabel}
        aria-pressed={showRawOutput}
      >
        <Terminal className="h-3.5 w-3.5" aria-hidden="true" />
        <span className="hidden sm:inline">{showRawOutput ? 'Formatted' : 'Raw'}</span>
      </Button>
    </header>
  );
});

// ============================================================================
// Empty State
// ============================================================================

export interface ChatEmptyStateProps {
  /** Custom title */
  title?: string;
  /** Custom description */
  description?: string;
  /** Additional CSS classes */
  className?: string;
  /** Data test id */
  'data-testid'?: string;
}

/**
 * ChatEmptyState shows when there are no messages yet.
 */
export const ChatEmptyState = forwardRef<HTMLDivElement, ChatEmptyStateProps>(
  function ChatEmptyState(
    {
      title = DEFAULT_EMPTY_TITLE,
      description = DEFAULT_EMPTY_DESCRIPTION,
      className,
      'data-testid': testId,
    },
    ref
  ) {
    return (
      <div
        ref={ref}
        className={cn(EMPTY_STATE_CLASSES, className)}
        role="status"
        aria-label={SR_EMPTY}
        data-testid={testId}
      >
        <VisuallyHidden aria-live="polite">{SR_EMPTY}</VisuallyHidden>
        <div className={EMPTY_STATE_ICON_CONTAINER_CLASSES}>
          <Bot className="h-8 w-8 text-[rgb(var(--primary))]" aria-hidden="true" />
        </div>
        <Heading level={2} size="lg" weight="semibold">
          {title}
        </Heading>
        <Text size="sm" color="muted-foreground" className="mt-2 max-w-sm">
          {description}
        </Text>
      </div>
    );
  }
);

// ============================================================================
// Message List
// ============================================================================

/** Message type for the list */
export interface ChatMessageData {
  id: string;
  role: MessageRole;
  content: string;
  toolCalls?: string;
  toolResults?: string;
  createdAt: string;
}

export interface ChatMessageListProps {
  /** Array of persisted messages */
  messages: ChatMessageData[];
  /** Display items for streaming response */
  displayItems: DisplayItem[];
  /** Active process ID (for streaming) */
  activeProcessId: string | null;
  /** Whether Claude is currently responding */
  isRunning: boolean;
  /** Whether to show raw output */
  showRawOutput: boolean;
  /** Raw output lines */
  rawOutput: string[];
  /** Ref for scroll anchor */
  scrollRef?: RefObject<HTMLDivElement>;
  /** Additional CSS classes */
  className?: string;
  /** Data test id */
  'data-testid'?: string;
}

/**
 * ChatMessageList renders all messages and streaming response.
 */
export const ChatMessageList = forwardRef<HTMLDivElement, ChatMessageListProps>(
  function ChatMessageList(
    {
      messages,
      displayItems,
      activeProcessId,
      isRunning,
      showRawOutput,
      rawOutput,
      scrollRef,
      className,
      'data-testid': testId,
    },
    ref
  ) {
    // Use the MessageRole values directly as strings for comparison
    const USER_ROLE = 'user';
    const ASSISTANT_ROLE = 'assistant';

    const messageCount = messages.length;
    const listLabel = `Chat messages, ${messageCount} message${messageCount === 1 ? '' : 's'}`;

    return (
      <div
        ref={ref}
        className={cn(MESSAGE_LIST_CLASSES, className)}
        data-testid={testId}
        data-message-count={messageCount}
      >
        {/* Screen reader announcement for processing state */}
        {isRunning && (
          <span className="sr-only" aria-live="polite" role="status">
            {SR_PROCESSING}
          </span>
        )}

        <BubbleMessageList aria-label={listLabel}>
          {messages.map((message) =>
            message.role === USER_ROLE ? (
              <BubbleMessageListItem key={message.id} data-message-id={message.id}>
                <UserMessageBubble content={message.content} timestamp={message.createdAt} />
              </BubbleMessageListItem>
            ) : message.role === ASSISTANT_ROLE ? (
              <BubbleMessageListItem key={message.id} data-message-id={message.id}>
                <AssistantMessageBubble
                  content={message.content}
                  toolCalls={message.toolCalls}
                  toolResults={message.toolResults}
                  timestamp={message.createdAt}
                />
              </BubbleMessageListItem>
            ) : null
          )}
        </BubbleMessageList>

        {/* Claude's streaming response */}
        {activeProcessId && (displayItems.length > 0 || isRunning) && (
          <StreamingResponse
            displayItems={displayItems}
            isStreaming={isRunning}
            showRawOutput={showRawOutput}
            rawOutput={rawOutput}
          />
        )}

        {/* Scroll anchor */}
        {scrollRef && <div ref={scrollRef} className="h-4" aria-hidden="true" />}
      </div>
    );
  }
);

// ============================================================================
// Input Area
// ============================================================================

export interface ChatInputAreaProps {
  /** Current input value */
  inputValue: string;
  /** Whether a process is running */
  isProcessing: boolean;
  /** Ref for the textarea */
  textareaRef?: RefObject<HTMLTextAreaElement>;
  /** Callback when input changes */
  onInputChange: (value: string) => void;
  /** Callback for key events */
  onKeyDown: (event: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  /** Callback to send message */
  onSend: () => void;
  /** Callback to stop process */
  onStop: () => void;
  /** Custom placeholder text */
  placeholder?: string;
  /** Custom send button label */
  sendLabel?: string;
  /** Custom stop button label */
  stopLabel?: string;
  /** Additional CSS classes */
  className?: string;
  /** Data test id */
  'data-testid'?: string;
}

/**
 * ChatInputArea provides the message input and send/stop buttons.
 */
export const ChatInputArea = forwardRef<HTMLDivElement, ChatInputAreaProps>(function ChatInputArea(
  {
    inputValue,
    isProcessing,
    textareaRef,
    onInputChange,
    onKeyDown,
    onSend,
    onStop,
    placeholder = DEFAULT_INPUT_PLACEHOLDER,
    sendLabel = DEFAULT_SEND_LABEL,
    stopLabel = DEFAULT_STOP_LABEL,
    className,
    'data-testid': testId,
  },
  ref
) {
  const textareaId = useId();
  const hintId = useId();

  return (
    <div
      ref={ref}
      className={cn(INPUT_AREA_CONTAINER_CLASSES, className)}
      data-testid={testId}
      data-processing={isProcessing}
    >
      <div className={INPUT_AREA_INNER_CLASSES}>
        <Flex gap="2" className={INPUT_AREA_WRAPPER_CLASSES}>
          <div className="relative flex-1">
            <label htmlFor={textareaId} className="sr-only">
              Message input
            </label>
            <textarea
              id={textareaId}
              ref={textareaRef}
              value={inputValue}
              onChange={(e) => onInputChange(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder={placeholder}
              disabled={isProcessing}
              rows={1}
              aria-describedby={hintId}
              aria-busy={isProcessing}
              className={TEXTAREA_CLASSES}
              style={{
                height: 'auto',
                minHeight: '44px',
              }}
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement;
                target.style.height = 'auto';
                target.style.height = `${Math.min(target.scrollHeight, 200)}px`;
              }}
            />
          </div>

          {/* Action button */}
          {isProcessing ? (
            <Button
              variant="destructive"
              size="md"
              onClick={onStop}
              className={INPUT_BUTTON_CLASSES}
              aria-label={stopLabel}
            >
              <StopCircle className="h-5 w-5" aria-hidden="true" />
            </Button>
          ) : (
            <Button
              variant="primary"
              size="md"
              onClick={onSend}
              disabled={!inputValue.trim()}
              className={INPUT_BUTTON_CLASSES}
              aria-label={sendLabel}
            >
              <Send className="h-5 w-5" aria-hidden="true" />
            </Button>
          )}
        </Flex>

        {/* Helper text */}
        <p id={hintId} className={HELPER_TEXT_CLASSES}>
          Press <kbd className={KBD_CLASSES}>Enter</kbd> to send,{' '}
          <kbd className={KBD_CLASSES}>Shift+Enter</kbd> for new line
        </p>
      </div>
    </div>
  );
});

// ============================================================================
// Permission Dialog Wrapper
// ============================================================================

export interface ChatPermissionDialogProps {
  /** Permission request data */
  request: PermissionRequest | null;
  /** Callback when approved */
  onApprove: () => void;
  /** Callback when denied */
  onDeny: () => void;
}

/**
 * ChatPermissionDialog wraps PermissionDialog for the chat page.
 */
export function ChatPermissionDialog({ request, onApprove, onDeny }: ChatPermissionDialogProps) {
  if (!request) return null;

  return <PermissionDialog request={request} onApprove={onApprove} onDeny={onDeny} />;
}

ChatPermissionDialog.displayName = 'ChatPermissionDialog';

// ============================================================================
// Chat Content (handles empty vs messages state)
// ============================================================================

export interface ChatContentProps {
  /** Whether there is content to display */
  hasContent: boolean;
  /** Whether processing is in progress */
  isProcessing: boolean;
  /** Array of persisted messages */
  messages: ChatMessageData[];
  /** Display items for streaming response */
  displayItems: DisplayItem[];
  /** Active process ID (for streaming) */
  activeProcessId: string | null;
  /** Whether Claude is currently responding */
  isRunning: boolean;
  /** Whether to show raw output */
  showRawOutput: boolean;
  /** Raw output lines */
  rawOutput: string[];
  /** Ref for scroll anchor */
  scrollRef?: RefObject<HTMLDivElement>;
  /** Additional CSS classes */
  className?: string;
  /** Data test id */
  'data-testid'?: string;
}

/**
 * ChatContent handles the empty vs content state switching.
 * Shows empty state when no content, otherwise shows message list.
 */
export const ChatContent = forwardRef<HTMLDivElement, ChatContentProps>(function ChatContent(
  {
    hasContent,
    isProcessing,
    messages,
    displayItems,
    activeProcessId,
    isRunning,
    showRawOutput,
    rawOutput,
    scrollRef,
    className,
    'data-testid': testId,
  },
  ref
) {
  if (!hasContent && !isProcessing) {
    return <ChatEmptyState className={className} data-testid={testId} ref={ref} />;
  }

  return (
    <ChatMessageList
      ref={ref}
      messages={messages}
      displayItems={displayItems}
      activeProcessId={activeProcessId}
      isRunning={isRunning}
      showRawOutput={showRawOutput}
      rawOutput={rawOutput}
      scrollRef={scrollRef}
      className={className}
      data-testid={testId}
    />
  );
});
