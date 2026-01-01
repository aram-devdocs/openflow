/**
 * ChatPage - Stateless Page Component for the Standalone Chat
 *
 * This is a top-level stateless component that composes the entire chat view.
 * It receives all required data and callbacks via props, making it fully
 * testable in Storybook with mocked data representing different page states.
 *
 * Accessibility Features:
 * - Proper page landmark structure with main role
 * - h1 heading for page title with proper hierarchy (via ChatHeader)
 * - Screen reader announcements for loading, error, and state changes
 * - Focus management with forwardRef support
 * - Responsive layout for all screen sizes
 * - Touch targets ≥44px for mobile (WCAG 2.5.5)
 * - Error boundary integration for graceful error handling
 *
 * The component composes:
 * - ChatPageLayout (page structure)
 * - ChatHeader (title, project name, view toggle)
 * - ChatContent (empty state or message list)
 * - ChatInputArea (message input and send/stop buttons)
 * - ChatPermissionDialog (permission requests from Claude)
 *
 * @module pages/ChatPage
 */

import type { Chat, Project } from '@openflow/generated';
import {
  Box,
  Flex,
  Heading,
  type ResponsiveValue,
  Text,
  VisuallyHidden,
} from '@openflow/primitives';
import { cn } from '@openflow/utils';
import { AlertTriangle, MessageSquare, RefreshCw } from 'lucide-react';
import type { RefObject } from 'react';
import { forwardRef, useId } from 'react';
import { Button } from '../atoms/Button';
import { Icon } from '../atoms/Icon';
import { Skeleton } from '../atoms/Skeleton';
import type { DisplayItem } from '../organisms/ChatBubbles';
import {
  ChatContent,
  ChatHeader,
  ChatInputArea,
  type ChatMessageData,
  ChatPageLayout,
  ChatPermissionDialog,
} from '../organisms/ChatPageComponents';
import type { PermissionRequest } from '../organisms/PermissionDialog';

// ============================================================================
// Types
// ============================================================================

/** Size variants for responsive layout */
export type ChatPageSize = 'sm' | 'md' | 'lg';

/** Breakpoints supported for responsive sizing */
export type ChatPageBreakpoint = 'base' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

/** Props for the header section */
export interface ChatPageHeaderProps {
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
}

/** Props for the content section */
export interface ChatPageContentProps {
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
}

/** Props for the input area section */
export interface ChatPageInputAreaProps {
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
}

/** Props for the permission dialog */
export interface ChatPagePermissionDialogProps {
  /** Permission request data */
  request: PermissionRequest | null;
  /** Callback when approved */
  onApprove: () => void;
  /** Callback when denied */
  onDeny: () => void;
}

/** Error state props for the page */
export interface ChatPageErrorProps {
  /** The error that occurred */
  error: Error;
  /** Callback to retry the failed operation */
  onRetry: () => void;
}

/** Props for ChatPageSkeleton */
export interface ChatPageSkeletonProps {
  /** Number of skeleton message bubbles to show */
  messageCount?: number;
  /** Responsive sizing */
  size?: ResponsiveValue<ChatPageSize>;
  /** Data attributes for testing */
  'data-testid'?: string;
}

/** Props for ChatPageError */
export interface ChatPageErrorStateProps {
  /** The error that occurred */
  error: Error;
  /** Retry handler */
  onRetry: () => void;
  /** Responsive sizing */
  size?: ResponsiveValue<ChatPageSize>;
  /** Data attributes for testing */
  'data-testid'?: string;
}

/**
 * Complete props for the ChatPage component.
 *
 * This interface defines all data and callbacks needed to render the chat page.
 * The route component is responsible for providing these props from hooks.
 */
export interface ChatPageProps {
  /** Page state: 'loading' | 'not-found' | 'error' | 'ready' */
  state: 'loading' | 'not-found' | 'error' | 'ready';

  /** Callback for not-found back button (only needed when state is 'not-found') */
  onNotFoundBack?: () => void;

  /** Error for error state */
  error?: Error | null;

  /** Retry callback for error state */
  onRetry?: () => void;

  // The following props are only required when state is 'ready'

  /** The chat being displayed */
  chat?: Chat;

  /** The project associated with the chat */
  project?: Project;

  /** Header props */
  header?: ChatPageHeaderProps;

  /** Content props */
  content?: ChatPageContentProps;

  /** Input area props */
  inputArea?: ChatPageInputAreaProps;

  /** Permission dialog props */
  permissionDialog?: ChatPagePermissionDialogProps;

  /** Responsive sizing */
  size?: ResponsiveValue<ChatPageSize>;

  /** Custom aria-label for the page */
  'aria-label'?: string;

  /** Data attributes for testing */
  'data-testid'?: string;
}

// ============================================================================
// Constants
// ============================================================================

/** Default skeleton message count */
export const DEFAULT_SKELETON_MESSAGE_COUNT = 4;

/** Default page size */
export const DEFAULT_PAGE_SIZE: ChatPageSize = 'md';

/** Screen reader announcement for loading state */
export const SR_LOADING = 'Loading chat. Please wait.';

/** Screen reader announcement for not found state */
export const SR_NOT_FOUND = 'Chat not found.';

/** Screen reader announcement for error state */
export const SR_ERROR_PREFIX = 'Error loading chat:';

/** Screen reader announcement for empty chat */
export const SR_EMPTY = 'No messages yet. Start the conversation.';

/** Screen reader announcement for chat ready */
export const SR_READY_PREFIX = 'Chat loaded.';

/** Screen reader announcement for processing */
export const SR_PROCESSING = 'Assistant is responding.';

/** Default page label */
export const DEFAULT_PAGE_LABEL = 'Chat page';

/** Default error title */
export const DEFAULT_ERROR_TITLE = 'Failed to load chat';

/** Default error description */
export const DEFAULT_ERROR_DESCRIPTION = 'Something went wrong while loading the chat.';

/** Default retry button label */
export const DEFAULT_RETRY_LABEL = 'Try Again';

/** Default not found title */
export const DEFAULT_NOT_FOUND_TITLE = 'Chat not found';

/** Default not found description */
export const DEFAULT_NOT_FOUND_DESCRIPTION =
  'The chat you are looking for does not exist or has been deleted.';

/** Default back button label */
export const DEFAULT_BACK_LABEL = 'Go Back';

/** Page container base classes */
export const CHAT_PAGE_BASE_CLASSES = 'relative flex flex-col h-full w-full';

/** Error container classes */
export const CHAT_PAGE_ERROR_CLASSES = [
  'flex flex-col items-center justify-center gap-4 p-6',
  'text-center min-h-[300px]',
].join(' ');

/** Not found container classes */
export const CHAT_PAGE_NOT_FOUND_CLASSES = [
  'flex flex-col items-center justify-center gap-4 p-6',
  'text-center h-full',
].join(' ');

/** Skeleton container classes */
export const CHAT_PAGE_SKELETON_CLASSES = 'flex flex-col h-full';

/** Skeleton header classes */
export const CHAT_PAGE_SKELETON_HEADER_CLASSES = 'border-b border-[rgb(var(--border))] p-4';

/** Skeleton content classes */
export const CHAT_PAGE_SKELETON_CONTENT_CLASSES = 'flex-1 p-4 space-y-4 overflow-hidden';

/** Skeleton input classes */
export const CHAT_PAGE_SKELETON_INPUT_CLASSES = 'border-t border-[rgb(var(--border))] p-4';

/** Skeleton message base classes */
export const CHAT_PAGE_SKELETON_MESSAGE_CLASSES = 'flex gap-3';

/** Size-based container padding */
export const PAGE_SIZE_PADDING: Record<ChatPageSize, string> = {
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-6',
};

/** Size-based gap classes */
export const PAGE_SIZE_GAP: Record<ChatPageSize, string> = {
  sm: 'gap-3',
  md: 'gap-4',
  lg: 'gap-6',
};

/** Size-based avatar dimensions */
export const SKELETON_AVATAR_DIMENSIONS: Record<ChatPageSize, number> = {
  sm: 32,
  md: 40,
  lg: 48,
};

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Resolves a ResponsiveValue to its base size
 */
export function getBaseSize(size: ResponsiveValue<ChatPageSize> | undefined): ChatPageSize {
  if (!size) return DEFAULT_PAGE_SIZE;
  if (typeof size === 'string') return size;
  return size.base ?? DEFAULT_PAGE_SIZE;
}

/**
 * Generates responsive Tailwind classes for the size prop
 */
export function getResponsiveSizeClasses(
  size: ResponsiveValue<ChatPageSize> | undefined,
  classMap: Record<ChatPageSize, string>
): string {
  if (!size) return classMap[DEFAULT_PAGE_SIZE];

  if (typeof size === 'string') {
    return classMap[size];
  }

  const classes: string[] = [];
  const breakpointPrefixes: Record<Exclude<ChatPageBreakpoint, 'base'>, string> = {
    sm: 'sm:',
    md: 'md:',
    lg: 'lg:',
    xl: 'xl:',
    '2xl': '2xl:',
  };

  // Base size
  if (size.base) {
    classes.push(classMap[size.base]);
  } else {
    classes.push(classMap[DEFAULT_PAGE_SIZE]);
  }

  // Responsive overrides
  for (const [breakpoint, prefix] of Object.entries(breakpointPrefixes)) {
    const bp = breakpoint as Exclude<ChatPageBreakpoint, 'base'>;
    if (size[bp]) {
      const sizeClasses = classMap[size[bp] as ChatPageSize];
      const prefixedClasses = sizeClasses
        .split(' ')
        .map((cls) => `${prefix}${cls}`)
        .join(' ');
      classes.push(prefixedClasses);
    }
  }

  return classes.join(' ');
}

/**
 * Get skeleton avatar dimensions for a size
 */
export function getSkeletonAvatarDimensions(
  size: ResponsiveValue<ChatPageSize> | undefined
): number {
  const baseSize = getBaseSize(size);
  return SKELETON_AVATAR_DIMENSIONS[baseSize];
}

/**
 * Build screen reader announcement for loaded state
 */
export function buildLoadedAnnouncement(
  title: string | undefined,
  messageCount: number,
  isProcessing: boolean
): string {
  const parts: string[] = [SR_READY_PREFIX];

  if (title) {
    parts.push(`Chat: ${title}.`);
  }

  if (messageCount === 0) {
    parts.push(SR_EMPTY);
  } else {
    const messageLabel = messageCount === 1 ? 'message' : 'messages';
    parts.push(`${messageCount} ${messageLabel}.`);
  }

  if (isProcessing) {
    parts.push(SR_PROCESSING);
  }

  return parts.join(' ');
}

/**
 * Build accessible label for the page
 */
export function buildPageAccessibleLabel(
  title: string | undefined,
  state: 'loading' | 'not-found' | 'error' | 'ready'
): string {
  const baseLabel = title ? `Chat: ${title}` : DEFAULT_PAGE_LABEL;

  switch (state) {
    case 'loading':
      return `${baseLabel} - Loading`;
    case 'not-found':
      return `${baseLabel} - Not found`;
    case 'error':
      return `${baseLabel} - Error loading`;
    case 'ready':
      return baseLabel;
  }
}

// ============================================================================
// Sub-Components
// ============================================================================

/**
 * Loading skeleton for the chat page
 */
export const ChatPageSkeleton = forwardRef<HTMLDivElement, ChatPageSkeletonProps>(
  function ChatPageSkeleton(
    { messageCount = DEFAULT_SKELETON_MESSAGE_COUNT, size, 'data-testid': testId },
    ref
  ) {
    const avatarSize = getSkeletonAvatarDimensions(size);

    // Generate alternating user/assistant message patterns
    const messages = Array.from({ length: messageCount }, (_, i) => ({
      isUser: i % 2 === 0,
      id: `skeleton-msg-${i}`,
    }));

    return (
      <Box
        ref={ref}
        className={CHAT_PAGE_SKELETON_CLASSES}
        aria-hidden="true"
        role="presentation"
        data-testid={testId ?? 'chat-page-skeleton'}
      >
        {/* Screen reader loading announcement */}
        <VisuallyHidden>
          <Box role="status" aria-live="polite">
            {SR_LOADING}
          </Box>
        </VisuallyHidden>

        {/* Header skeleton */}
        <Box className={CHAT_PAGE_SKELETON_HEADER_CLASSES}>
          <Flex direction="row" justify="between" align="center">
            <Flex direction="row" align="center" gap="3">
              <Skeleton width={32} height={32} variant="circular" />
              <Flex direction="column" gap="2">
                <Skeleton width={160} height={20} variant="text" />
                <Skeleton width={100} height={14} variant="text" />
              </Flex>
            </Flex>
            <Skeleton width={80} height={32} />
          </Flex>
        </Box>

        {/* Content skeleton - message bubbles */}
        <Box className={CHAT_PAGE_SKELETON_CONTENT_CLASSES}>
          {messages.map((msg) => (
            <Box
              key={msg.id}
              className={cn(
                CHAT_PAGE_SKELETON_MESSAGE_CLASSES,
                msg.isUser ? 'flex-row-reverse' : 'flex-row'
              )}
            >
              <Skeleton width={avatarSize} height={avatarSize} variant="circular" />
              <Flex direction="column" gap="2" className={msg.isUser ? 'items-end' : 'items-start'}>
                <Skeleton width={msg.isUser ? 200 : 280} height={16} variant="text" />
                <Skeleton width={msg.isUser ? 160 : 320} height={16} variant="text" />
                {!msg.isUser && <Skeleton width={240} height={16} variant="text" />}
              </Flex>
            </Box>
          ))}
        </Box>

        {/* Input area skeleton */}
        <Box className={CHAT_PAGE_SKELETON_INPUT_CLASSES}>
          <Flex direction="row" align="end" gap="2">
            <Skeleton height={80} className="flex-1" />
            <Skeleton width={44} height={44} variant="circular" />
          </Flex>
        </Box>
      </Box>
    );
  }
);

/**
 * Error state for the chat page
 */
export const ChatPageError = forwardRef<HTMLDivElement, ChatPageErrorStateProps>(
  function ChatPageError({ error, onRetry, size, 'data-testid': testId }, ref) {
    const headingId = useId();
    const descriptionId = useId();

    return (
      <Box
        ref={ref}
        role="alert"
        aria-live="assertive"
        aria-atomic="true"
        aria-labelledby={headingId}
        aria-describedby={descriptionId}
        className={cn(CHAT_PAGE_ERROR_CLASSES, getResponsiveSizeClasses(size, PAGE_SIZE_PADDING))}
        data-testid={testId ?? 'chat-page-error'}
      >
        {/* Screen reader announcement */}
        <VisuallyHidden>
          <Box role="status" aria-live="assertive">
            {SR_ERROR_PREFIX} {error.message}
          </Box>
        </VisuallyHidden>

        <Icon
          icon={AlertTriangle}
          size="xl"
          className="text-[rgb(var(--destructive))]"
          aria-hidden="true"
        />

        <Heading id={headingId} level={1} size="lg" className="text-[rgb(var(--foreground))]">
          {DEFAULT_ERROR_TITLE}
        </Heading>

        <Text id={descriptionId} color="muted-foreground" className="max-w-md">
          {error.message || DEFAULT_ERROR_DESCRIPTION}
        </Text>

        <Button
          onClick={onRetry}
          icon={<Icon icon={RefreshCw} size="sm" aria-hidden="true" />}
          className="min-h-[44px] min-w-[44px]"
        >
          {DEFAULT_RETRY_LABEL}
        </Button>
      </Box>
    );
  }
);

/**
 * Not found state for the chat page with enhanced accessibility
 */
export const ChatPageNotFound = forwardRef<
  HTMLDivElement,
  { onBack: () => void; 'data-testid'?: string }
>(function ChatPageNotFound({ onBack, 'data-testid': testId }, ref) {
  const headingId = useId();
  const descriptionId = useId();

  return (
    <Box
      ref={ref}
      role="region"
      aria-labelledby={headingId}
      aria-describedby={descriptionId}
      className={CHAT_PAGE_NOT_FOUND_CLASSES}
      data-testid={testId ?? 'chat-page-not-found'}
    >
      {/* Screen reader announcement */}
      <VisuallyHidden>
        <Box role="status" aria-live="polite">
          {SR_NOT_FOUND}
        </Box>
      </VisuallyHidden>

      <Icon
        icon={MessageSquare}
        size="xl"
        className="text-[rgb(var(--muted-foreground))]"
        aria-hidden="true"
      />

      <Heading id={headingId} level={1} size="lg" className="text-[rgb(var(--foreground))]">
        {DEFAULT_NOT_FOUND_TITLE}
      </Heading>

      <Text id={descriptionId} color="muted-foreground" className="max-w-md">
        {DEFAULT_NOT_FOUND_DESCRIPTION}
      </Text>

      <Button onClick={onBack} variant="secondary" className="min-h-[44px] min-w-[44px]">
        {DEFAULT_BACK_LABEL}
      </Button>
    </Box>
  );
});

// ============================================================================
// Main Component
// ============================================================================

/**
 * ChatPage - Complete stateless chat page component.
 *
 * This component receives all data and callbacks via props. It is purely
 * presentational, making it fully testable in Storybook with mocked data.
 *
 * Features:
 * - Page-level loading skeleton
 * - Error state with retry button
 * - Not found state with back button
 * - Empty state handling (delegated to ChatContent)
 * - Proper heading hierarchy (h1 for title via ChatHeader)
 * - Screen reader announcements for state changes
 * - forwardRef support for focus management
 * - Responsive layout for all screen sizes
 * - Touch targets ≥44px (WCAG 2.5.5)
 *
 * @example
 * ```tsx
 * // In route component
 * function StandaloneChatRoute() {
 *   const { chatId } = Route.useParams();
 *   const navigate = useNavigate();
 *   const toast = useToast();
 *
 *   const session = useChatSession({
 *     chatId,
 *     onError: (title, message) => toast.error(title, message),
 *   });
 *
 *   // Loading state
 *   if (session.isLoadingChat) {
 *     return <ChatPage state="loading" />;
 *   }
 *
 *   // Error state
 *   if (session.error) {
 *     return (
 *       <ChatPage
 *         state="error"
 *         error={session.error}
 *         onRetry={session.refetch}
 *       />
 *     );
 *   }
 *
 *   // Not found state
 *   if (!session.chat) {
 *     return (
 *       <ChatPage
 *         state="not-found"
 *         onNotFoundBack={() => navigate({ to: '/' })}
 *       />
 *     );
 *   }
 *
 *   // Ready state
 *   return (
 *     <ChatPage
 *       state="ready"
 *       chat={session.chat}
 *       project={session.project}
 *       header={{
 *         title: session.chat.title,
 *         projectName: session.project?.name,
 *         showRawOutput: session.showRawOutput,
 *         onToggleRawOutput: session.toggleRawOutput,
 *         onBack: () => navigate({ to: '/' }),
 *       }}
 *       content={{
 *         hasContent: session.hasContent,
 *         isProcessing: session.isProcessing,
 *         messages: session.messages,
 *         displayItems: session.displayItems,
 *         activeProcessId: session.activeProcessId,
 *         isRunning: session.isRunning,
 *         showRawOutput: session.showRawOutput,
 *         rawOutput: session.rawOutput,
 *         scrollRef: session.messagesEndRef,
 *       }}
 *       inputArea={{
 *         inputValue: session.inputValue,
 *         isProcessing: session.isProcessing,
 *         textareaRef: session.textareaRef,
 *         onInputChange: session.setInputValue,
 *         onKeyDown: session.handleKeyDown,
 *         onSend: session.handleSend,
 *         onStop: session.handleStopProcess,
 *       }}
 *       permissionDialog={{
 *         request: session.permissionRequest,
 *         onApprove: session.handleApprovePermission,
 *         onDeny: session.handleDenyPermission,
 *       }}
 *     />
 *   );
 * }
 * ```
 */
export const ChatPage = forwardRef<HTMLDivElement, ChatPageProps>(function ChatPage(
  {
    state,
    onNotFoundBack,
    error,
    onRetry,
    chat,
    header,
    content,
    inputArea,
    permissionDialog,
    size,
    'aria-label': ariaLabel,
    'data-testid': testId,
  },
  ref
) {
  // Reserved for future ARIA ID usage - useId ensures consistent IDs during SSR
  useId();

  // Compute accessible label
  const computedAriaLabel =
    ariaLabel ?? buildPageAccessibleLabel(header?.title ?? chat?.title, state);

  // Calculate message count for announcements
  const messageCount = content?.messages?.length ?? 0;
  const isProcessing = content?.isProcessing ?? false;
  const hasContent = content?.hasContent ?? false;

  // Loading state
  if (state === 'loading') {
    return (
      <Box
        ref={ref}
        className={CHAT_PAGE_BASE_CLASSES}
        aria-label={computedAriaLabel}
        aria-busy="true"
        data-testid={testId ?? 'chat-page'}
        data-state="loading"
      >
        <ChatPageSkeleton size={size} />
      </Box>
    );
  }

  // Error state
  if (state === 'error' && error && onRetry) {
    return (
      <Box
        ref={ref}
        className={CHAT_PAGE_BASE_CLASSES}
        aria-label={computedAriaLabel}
        data-testid={testId ?? 'chat-page'}
        data-state="error"
      >
        <ChatPageError error={error} onRetry={onRetry} size={size} />
      </Box>
    );
  }

  // Not found state
  if (state === 'not-found') {
    return (
      <Box
        ref={ref}
        className={CHAT_PAGE_BASE_CLASSES}
        aria-label={computedAriaLabel}
        data-testid={testId ?? 'chat-page'}
        data-state="not-found"
      >
        <ChatPageNotFound onBack={onNotFoundBack ?? (() => {})} />
      </Box>
    );
  }

  // Ready state - all props should be defined
  if (!header || !content || !inputArea) {
    // Fallback if props are missing in ready state (shouldn't happen in practice)
    return (
      <Box
        ref={ref}
        className={CHAT_PAGE_BASE_CLASSES}
        aria-label={computedAriaLabel}
        data-testid={testId ?? 'chat-page'}
        data-state="not-found"
      >
        <ChatPageNotFound onBack={onNotFoundBack ?? (() => {})} />
      </Box>
    );
  }

  return (
    <Box
      ref={ref}
      className={CHAT_PAGE_BASE_CLASSES}
      aria-label={computedAriaLabel}
      data-testid={testId ?? 'chat-page'}
      data-state={hasContent ? 'ready' : 'empty'}
      data-processing={isProcessing ? 'true' : undefined}
      data-message-count={messageCount}
    >
      {/* Screen reader announcements */}
      <VisuallyHidden>
        <Box role="status" aria-live="polite" aria-atomic="true">
          {buildLoadedAnnouncement(header.title, messageCount, isProcessing)}
        </Box>
      </VisuallyHidden>

      <ChatPageLayout
        permissionDialog={
          permissionDialog && (
            <ChatPermissionDialog
              request={permissionDialog.request}
              onApprove={permissionDialog.onApprove}
              onDeny={permissionDialog.onDeny}
            />
          )
        }
        header={
          <ChatHeader
            title={header.title}
            projectName={header.projectName}
            showRawOutput={header.showRawOutput}
            onToggleRawOutput={header.onToggleRawOutput}
            onBack={header.onBack}
          />
        }
        inputArea={
          <ChatInputArea
            inputValue={inputArea.inputValue}
            isProcessing={inputArea.isProcessing}
            textareaRef={inputArea.textareaRef}
            onInputChange={inputArea.onInputChange}
            onKeyDown={inputArea.onKeyDown}
            onSend={inputArea.onSend}
            onStop={inputArea.onStop}
          />
        }
      >
        <ChatContent
          hasContent={content.hasContent}
          isProcessing={content.isProcessing}
          messages={content.messages}
          displayItems={content.displayItems}
          activeProcessId={content.activeProcessId}
          isRunning={content.isRunning}
          showRawOutput={content.showRawOutput}
          rawOutput={content.rawOutput}
          scrollRef={content.scrollRef}
        />
      </ChatPageLayout>
    </Box>
  );
});

ChatPage.displayName = 'ChatPage';
