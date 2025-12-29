import { useCallback, useRef, useEffect, useState } from 'react';
import type { Message, ExecutorProfile } from '@openflow/generated';
import { cn } from '@openflow/utils';
import { Send, StopCircle, ChevronDown } from 'lucide-react';
import { Button } from '../atoms/Button';
import { Textarea } from '../atoms/Textarea';
import { Spinner } from '../atoms/Spinner';
import { Icon } from '../atoms/Icon';
import { Dropdown, type DropdownOption } from '../molecules/Dropdown';
import { ChatMessage } from './ChatMessage';

export interface ChatPanelProps {
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
  /** Additional CSS classes */
  className?: string;
}

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
 *
 * @example
 * <ChatPanel
 *   messages={messages}
 *   onSendMessage={handleSend}
 *   isProcessing={isProcessing}
 *   onStopProcess={handleStop}
 * />
 *
 * @example
 * <ChatPanel
 *   messages={messages}
 *   onSendMessage={handleSend}
 *   executorProfiles={profiles}
 *   selectedExecutorProfileId={selectedProfileId}
 *   onExecutorProfileChange={setSelectedProfileId}
 *   showExecutorSelector
 * />
 */
export function ChatPanel({
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
}: ChatPanelProps) {
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [showScrollButton, setShowScrollButton] = useState(false);

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
  }, [messages, autoScroll, isAtBottom, scrollToBottom]);

  // Handle send message
  const handleSend = useCallback(() => {
    const trimmedValue = inputValue.trim();
    if (!trimmedValue || isProcessing) return;

    onSendMessage?.(trimmedValue);
    setInputValue('');

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
  const isLastMessageStreaming =
    hasMessages && messages[messages.length - 1]?.isStreaming;

  return (
    <div
      className={cn(
        'flex h-full flex-col',
        'bg-[rgb(var(--background))]',
        className
      )}
    >
      {/* Messages area */}
      <div
        ref={messagesContainerRef}
        onScroll={handleScroll}
        className={cn(
          'flex-1 overflow-y-auto',
          'scrollbar-thin scrollbar-thumb-[rgb(var(--border))] scrollbar-track-transparent'
        )}
      >
        <div className="space-y-4 p-4">
          {/* Empty state */}
          {!hasMessages && (
            <div className="flex h-full min-h-[200px] flex-col items-center justify-center text-center">
              <div className="text-[rgb(var(--muted-foreground))]">
                <p className="text-sm">No messages yet.</p>
                <p className="mt-1 text-xs">
                  Send a message to start the conversation.
                </p>
              </div>
            </div>
          )}

          {/* Message list */}
          {messages.map((message, index) => (
            <ChatMessage
              key={message.id}
              message={message}
              isStreaming={index === messages.length - 1 && message.isStreaming}
            />
          ))}

          {/* Processing indicator when no streaming message */}
          {isProcessing && !isLastMessageStreaming && (
            <div className="flex items-center gap-2 px-4 py-2 text-sm text-[rgb(var(--muted-foreground))]">
              <Spinner size="sm" />
              <span>Processing...</span>
            </div>
          )}

          {/* Scroll anchor */}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Scroll to bottom button */}
      {showScrollButton && (
        <div className="absolute bottom-24 left-1/2 -translate-x-1/2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => scrollToBottom(true)}
            className="shadow-md"
            aria-label="Scroll to bottom"
          >
            <Icon icon={ChevronDown} size="sm" />
            <span>New messages</span>
          </Button>
        </div>
      )}

      {/* Input area */}
      <div className="border-t border-[rgb(var(--border))] p-4">
        {/* Executor profile selector */}
        {showExecutorSelector && executorProfiles.length > 0 && (
          <div className="mb-3">
            <Dropdown
              options={executorOptions}
              value={selectedExecutorProfileId}
              onChange={(value) => onExecutorProfileChange?.(value)}
              placeholder="Select executor..."
              aria-label="Select executor profile"
              className="max-w-xs"
            />
          </div>
        )}

        {/* Input row */}
        <div className="flex gap-2">
          <Textarea
            ref={textareaRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={isProcessing}
            resize="none"
            className={cn(
              'min-h-[44px] max-h-[200px] flex-1',
              'py-2.5'
            )}
            aria-label="Message input"
          />

          {/* Action buttons */}
          <div className="flex flex-col gap-1">
            {isProcessing && onStopProcess ? (
              <Button
                variant="destructive"
                size="md"
                onClick={onStopProcess}
                className="h-[44px] w-[44px] p-0"
                aria-label="Stop process"
              >
                <Icon icon={StopCircle} size="md" />
              </Button>
            ) : (
              <Button
                variant="primary"
                size="md"
                onClick={handleSend}
                disabled={!inputValue.trim() || isProcessing}
                className="h-[44px] w-[44px] p-0"
                aria-label="Send message"
              >
                <Icon icon={Send} size="md" />
              </Button>
            )}
          </div>
        </div>

        {/* Helper text */}
        <p className="mt-2 text-xs text-[rgb(var(--muted-foreground))]">
          Press <kbd className="rounded border border-[rgb(var(--border))] bg-[rgb(var(--muted))] px-1">Enter</kbd> to send,{' '}
          <kbd className="rounded border border-[rgb(var(--border))] bg-[rgb(var(--muted))] px-1">Shift+Enter</kbd> for new line
        </p>
      </div>
    </div>
  );
}

ChatPanel.displayName = 'ChatPanel';
