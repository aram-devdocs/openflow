/**
 * Chat Page Components
 *
 * Stateless UI components for the standalone chat page.
 * These are composed in the route to create the full chat experience.
 */

import type { MessageRole } from '@openflow/generated';
import { cn } from '@openflow/utils';
import {
  AlertCircle,
  ArrowLeft,
  Bot,
  MessageSquare,
  Send,
  StopCircle,
  Terminal,
} from 'lucide-react';
import type React from 'react';
import { Button } from '../atoms/Button';
import { Icon } from '../atoms/Icon';
import { Skeleton } from '../atoms/Skeleton';
import { SkeletonChat } from '../molecules/SkeletonChat';
import {
  AssistantMessageBubble,
  type DisplayItem,
  StreamingResponse,
  UserMessageBubble,
} from './ChatBubbles';
import type { PermissionRequest } from './PermissionDialog';
import { PermissionDialog } from './PermissionDialog';

// ============================================================================
// Chat Page Layout
// ============================================================================

export interface ChatPageLayoutProps {
  /** Header component */
  header: React.ReactNode;
  /** Main content area */
  children: React.ReactNode;
  /** Input area component */
  inputArea: React.ReactNode;
  /** Permission dialog (optional) */
  permissionDialog?: React.ReactNode;
  /** Additional CSS classes */
  className?: string;
}

/**
 * ChatPageLayout provides the main structure for the chat page.
 */
export function ChatPageLayout({
  header,
  children,
  inputArea,
  permissionDialog,
  className,
}: ChatPageLayoutProps) {
  return (
    <div className={cn('flex h-full flex-col bg-[rgb(var(--background))]', className)}>
      {permissionDialog}
      {header}
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-4xl px-3 py-4 md:px-4 md:py-6">{children}</div>
      </div>
      {inputArea}
    </div>
  );
}

ChatPageLayout.displayName = 'ChatPageLayout';

// ============================================================================
// Loading Skeleton
// ============================================================================

export interface ChatLoadingSkeletonProps {
  /** Additional CSS classes */
  className?: string;
}

/**
 * ChatLoadingSkeleton shows a loading state for the chat page.
 */
export function ChatLoadingSkeleton({ className }: ChatLoadingSkeletonProps) {
  return (
    <div className={cn('flex h-full flex-col bg-[rgb(var(--background))]', className)}>
      {/* Skeleton Header */}
      <header className="flex items-center gap-3 border-b border-[rgb(var(--border))] bg-[rgb(var(--card))] px-4 py-3">
        <Skeleton variant="circular" width={32} height={32} />
        <div className="flex items-center gap-2.5">
          <Skeleton variant="circular" width={32} height={32} />
          <div className="space-y-1">
            <Skeleton variant="text" className="h-4 w-32" />
            <Skeleton variant="text" className="h-3 w-20" />
          </div>
        </div>
      </header>

      {/* Skeleton Chat Messages */}
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-4xl px-4 py-6">
          <SkeletonChat messageCount={4} />
        </div>
      </div>

      {/* Skeleton Input Area */}
      <div className="border-t border-[rgb(var(--border))] bg-[rgb(var(--card))]">
        <div className="mx-auto max-w-4xl px-4 py-4">
          <div className="flex gap-3">
            <Skeleton className="flex-1 h-12 rounded-xl" />
            <Skeleton variant="circular" width={48} height={48} className="rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  );
}

ChatLoadingSkeleton.displayName = 'ChatLoadingSkeleton';

// ============================================================================
// Not Found State
// ============================================================================

export interface ChatNotFoundProps {
  /** Callback when back button is clicked */
  onBack: () => void;
  /** Additional CSS classes */
  className?: string;
}

/**
 * ChatNotFound shows when the chat doesn't exist.
 */
export function ChatNotFound({ onBack, className }: ChatNotFoundProps) {
  return (
    <div
      className={cn(
        'flex h-full flex-col items-center justify-center bg-[rgb(var(--background))] p-8',
        className
      )}
    >
      <AlertCircle className="mb-4 h-16 w-16 text-[rgb(var(--muted-foreground))]" />
      <h2 className="text-lg font-semibold text-[rgb(var(--foreground))]">Chat not found</h2>
      <p className="mt-2 text-sm text-[rgb(var(--muted-foreground))]">
        The chat you're looking for doesn't exist or has been deleted.
      </p>
      <Button variant="primary" className="mt-4" onClick={onBack}>
        Back to Dashboard
      </Button>
    </div>
  );
}

ChatNotFound.displayName = 'ChatNotFound';

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
  /** Additional CSS classes */
  className?: string;
}

/**
 * ChatHeader shows the chat title, project name, and view toggle.
 */
export function ChatHeader({
  title,
  projectName,
  showRawOutput,
  onToggleRawOutput,
  onBack,
  className,
}: ChatHeaderProps) {
  return (
    <header
      className={cn(
        'flex items-center gap-2 border-b border-[rgb(var(--border))] bg-[rgb(var(--card))] px-3 py-2 md:gap-3 md:px-4 md:py-3',
        className
      )}
    >
      <Button variant="ghost" size="sm" onClick={onBack} className="h-8 w-8 shrink-0 p-0">
        <Icon icon={ArrowLeft} size="sm" />
      </Button>

      <div className="flex min-w-0 flex-1 items-center gap-2 md:gap-2.5">
        <div className="hidden h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[rgb(var(--primary))]/10 sm:flex">
          <Icon icon={MessageSquare} size="sm" className="text-[rgb(var(--primary))]" />
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-sm font-semibold text-[rgb(var(--foreground))]">
            {title ?? 'Untitled Chat'}
          </h1>
          {projectName && (
            <p className="truncate text-xs text-[rgb(var(--muted-foreground))]">{projectName}</p>
          )}
        </div>
      </div>

      {/* View toggle */}
      <Button
        variant={showRawOutput ? 'secondary' : 'ghost'}
        size="sm"
        onClick={onToggleRawOutput}
        className="h-8 shrink-0 gap-1.5 px-2 text-xs sm:px-3"
      >
        <Terminal className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">{showRawOutput ? 'Formatted' : 'Raw'}</span>
      </Button>
    </header>
  );
}

ChatHeader.displayName = 'ChatHeader';

// ============================================================================
// Empty State
// ============================================================================

export interface ChatEmptyStateProps {
  /** Additional CSS classes */
  className?: string;
}

/**
 * ChatEmptyState shows when there are no messages yet.
 */
export function ChatEmptyState({ className }: ChatEmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-16 text-center', className)}>
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[rgb(var(--primary))]/10">
        <Bot className="h-8 w-8 text-[rgb(var(--primary))]" />
      </div>
      <h2 className="text-lg font-semibold text-[rgb(var(--foreground))]">Start a conversation</h2>
      <p className="mt-2 max-w-sm text-sm text-[rgb(var(--muted-foreground))]">
        Send a message to start working with Claude. You can ask questions, request code changes, or
        give instructions.
      </p>
    </div>
  );
}

ChatEmptyState.displayName = 'ChatEmptyState';

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
  scrollRef?: React.RefObject<HTMLDivElement>;
  /** Additional CSS classes */
  className?: string;
}

/**
 * ChatMessageList renders all messages and streaming response.
 */
export function ChatMessageList({
  messages,
  displayItems,
  activeProcessId,
  isRunning,
  showRawOutput,
  rawOutput,
  scrollRef,
  className,
}: ChatMessageListProps) {
  // Use the MessageRole values directly as strings for comparison
  const USER_ROLE = 'user';
  const ASSISTANT_ROLE = 'assistant';

  return (
    <div className={cn('space-y-6', className)}>
      {messages.map((message) =>
        message.role === USER_ROLE ? (
          <UserMessageBubble
            key={message.id}
            content={message.content}
            timestamp={message.createdAt}
          />
        ) : message.role === ASSISTANT_ROLE ? (
          <AssistantMessageBubble
            key={message.id}
            content={message.content}
            toolCalls={message.toolCalls}
            toolResults={message.toolResults}
            timestamp={message.createdAt}
          />
        ) : null
      )}

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
      {scrollRef && <div ref={scrollRef} className="h-4" />}
    </div>
  );
}

ChatMessageList.displayName = 'ChatMessageList';

// ============================================================================
// Input Area
// ============================================================================

export interface ChatInputAreaProps {
  /** Current input value */
  inputValue: string;
  /** Whether a process is running */
  isProcessing: boolean;
  /** Ref for the textarea */
  textareaRef?: React.RefObject<HTMLTextAreaElement>;
  /** Callback when input changes */
  onInputChange: (value: string) => void;
  /** Callback for key events */
  onKeyDown: (event: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  /** Callback to send message */
  onSend: () => void;
  /** Callback to stop process */
  onStop: () => void;
  /** Additional CSS classes */
  className?: string;
}

/**
 * ChatInputArea provides the message input and send/stop buttons.
 */
export function ChatInputArea({
  inputValue,
  isProcessing,
  textareaRef,
  onInputChange,
  onKeyDown,
  onSend,
  onStop,
  className,
}: ChatInputAreaProps) {
  return (
    <div className={cn('border-t border-[rgb(var(--border))] bg-[rgb(var(--card))]', className)}>
      <div className="mx-auto max-w-4xl px-3 py-3 md:px-4 md:py-4">
        <div className="flex gap-2 md:gap-3">
          <div className="relative flex-1">
            <textarea
              ref={textareaRef}
              value={inputValue}
              onChange={(e) => onInputChange(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder="Type a message..."
              disabled={isProcessing}
              rows={1}
              className={cn(
                'w-full resize-none rounded-xl border border-[rgb(var(--border))]',
                'bg-[rgb(var(--background))] px-3 py-3 md:px-4',
                'text-sm text-[rgb(var(--foreground))]',
                'placeholder:text-[rgb(var(--muted-foreground))]',
                'focus:border-[rgb(var(--primary))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--primary))]/20',
                'disabled:cursor-not-allowed disabled:opacity-50',
                'min-h-[44px] max-h-[200px]'
              )}
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
              className="h-11 w-11 shrink-0 rounded-xl p-0"
              aria-label="Stop process"
            >
              <StopCircle className="h-5 w-5" />
            </Button>
          ) : (
            <Button
              variant="primary"
              size="md"
              onClick={onSend}
              disabled={!inputValue.trim()}
              className="h-11 w-11 shrink-0 rounded-xl p-0"
              aria-label="Send message"
            >
              <Send className="h-5 w-5" />
            </Button>
          )}
        </div>

        {/* Helper text */}
        <p className="mt-2 hidden text-center text-xs text-[rgb(var(--muted-foreground))] sm:block">
          Press{' '}
          <kbd className="rounded border border-[rgb(var(--border))] bg-[rgb(var(--muted))] px-1.5 py-0.5 font-mono text-[10px]">
            Enter
          </kbd>{' '}
          to send,{' '}
          <kbd className="rounded border border-[rgb(var(--border))] bg-[rgb(var(--muted))] px-1.5 py-0.5 font-mono text-[10px]">
            Shift+Enter
          </kbd>{' '}
          for new line
        </p>
      </div>
    </div>
  );
}

ChatInputArea.displayName = 'ChatInputArea';

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
  scrollRef?: React.RefObject<HTMLDivElement>;
  /** Additional CSS classes */
  className?: string;
}

/**
 * ChatContent handles the empty vs content state switching.
 * Shows empty state when no content, otherwise shows message list.
 */
export function ChatContent({
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
}: ChatContentProps) {
  if (!hasContent && !isProcessing) {
    return <ChatEmptyState className={className} />;
  }

  return (
    <ChatMessageList
      messages={messages}
      displayItems={displayItems}
      activeProcessId={activeProcessId}
      isRunning={isRunning}
      showRawOutput={showRawOutput}
      rawOutput={rawOutput}
      scrollRef={scrollRef}
      className={className}
    />
  );
}

ChatContent.displayName = 'ChatContent';
