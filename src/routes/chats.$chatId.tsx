/**
 * Standalone Chat Page Route
 *
 * Displays a single standalone chat session with a unified conversation view.
 * Shows user messages and Claude's responses in chronological order (top to bottom).
 * Persists assistant responses to the database for chat history.
 */

import { MessageRole } from '@openflow/generated';
import {
  useChat,
  useClaudeEvents,
  useCreateMessage,
  useExecutorProfiles,
  useKeyboardShortcuts,
  useMessages,
  useProject,
  useRunExecutor,
  useSendInput,
  useUpdateChat,
} from '@openflow/hooks';
import {
  Button,
  Icon,
  PermissionDialog,
  Skeleton,
  SkeletonChat,
  Spinner,
  useToast,
} from '@openflow/ui';
import { cn } from '@openflow/utils';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import {
  AlertCircle,
  ArrowLeft,
  Bot,
  ChevronDown,
  ChevronRight,
  Code2,
  MessageSquare,
  Send,
  StopCircle,
  Terminal,
  User,
  Wrench,
} from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

export const Route = createFileRoute('/chats/$chatId')({
  component: StandaloneChatPage,
});

function StandaloneChatPage() {
  const { chatId } = Route.useParams();
  const navigate = useNavigate();
  const toast = useToast();

  // UI state
  const [activeProcessId, setActiveProcessId] = useState<string | null>(null);
  const [showRawOutput, setShowRawOutput] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const savedProcessRef = useRef<string | null>(null);

  // Data fetching
  const { data: chatData, isLoading: isLoadingChat } = useChat(chatId);
  const { data: messages = [] } = useMessages(chatId);
  const { data: executorProfiles = [] } = useExecutorProfiles();

  const chat = chatData?.chat;
  const projectId = chat?.projectId ?? '';
  const { data: project } = useProject(projectId);

  // Mutations
  const runExecutor = useRunExecutor();
  const createMessage = useCreateMessage();
  const sendInput = useSendInput();
  const updateChat = useUpdateChat();

  // Claude events for streaming output
  const {
    events: claudeEvents,
    rawOutput,
    isRunning,
    isComplete,
    permissionRequest,
    clearPermissionRequest,
    sessionId,
  } = useClaudeEvents(activeProcessId);

  // Get selected executor profile
  const selectedExecutorProfileId = chat?.executorProfileId ?? executorProfiles[0]?.id ?? '';

  // Count persisted assistant messages for filtering replayed events
  const persistedAssistantCount = messages.filter((m) => m.role === MessageRole.Assistant).length;

  // Save assistant response to database when process completes
  useEffect(() => {
    // Skip if not complete, no events, no chatId, or no active process
    if (!isComplete || claudeEvents.length === 0 || !chatId || !activeProcessId) {
      return;
    }

    // Skip if we already saved this process
    if (savedProcessRef.current === activeProcessId) {
      return;
    }

    // Extract text content and tool data from events (filtered to current turn)
    const { textContent, toolCalls, toolResults } = extractContentFromEvents(
      claudeEvents,
      persistedAssistantCount
    );

    if (textContent || toolCalls.length > 0) {
      // Mark as saved before mutating
      savedProcessRef.current = activeProcessId;

      createMessage.mutate({
        chatId,
        role: MessageRole.Assistant,
        content: textContent,
        toolCalls: toolCalls.length > 0 ? JSON.stringify(toolCalls) : undefined,
        toolResults: toolResults.length > 0 ? JSON.stringify(toolResults) : undefined,
      });

      // Clear the active process so we show from DB now
      setActiveProcessId(null);
    }
  }, [isComplete, claudeEvents, chatId, activeProcessId, createMessage, persistedAssistantCount]);

  // Save Claude session ID to chat for session resumption
  useEffect(() => {
    // Only save if we have a new session ID and the chat doesn't already have one
    if (!sessionId || !chatId || !chat) return;
    if (chat.claudeSessionId) return; // Already has a session ID

    updateChat.mutate({
      id: chatId,
      request: { claudeSessionId: sessionId },
    });
  }, [sessionId, chatId, chat, updateChat]);

  // Keyboard shortcuts
  useKeyboardShortcuts([
    {
      key: 't',
      meta: true,
      action: () => setShowRawOutput((prev) => !prev),
    },
    {
      key: 'Escape',
      action: () => navigate({ to: '/' }),
    },
  ]);

  // Auto-scroll to bottom when new content arrives
  // biome-ignore lint/correctness/useExhaustiveDependencies: intentionally trigger on content changes
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, claudeEvents, isRunning]);

  // Handle send message
  const handleSend = useCallback(async () => {
    const trimmedValue = inputValue.trim();
    if (!trimmedValue || !chatId) return;

    // Clear input immediately for better UX
    setInputValue('');

    // 1. Create user message in DB
    createMessage.mutate({
      chatId,
      role: MessageRole.User,
      content: trimmedValue,
    });

    // 2. Start executor with the message as prompt
    try {
      const process = await runExecutor.mutateAsync({
        chatId,
        prompt: trimmedValue,
        executorProfileId: selectedExecutorProfileId,
      });
      setActiveProcessId(process.id);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      toast.error('Failed to run executor', message);
    }

    // Focus textarea after sending
    textareaRef.current?.focus();
  }, [inputValue, chatId, createMessage, runExecutor, selectedExecutorProfileId, toast]);

  // Handle keyboard shortcuts in textarea
  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        handleSend();
      }
    },
    [handleSend]
  );

  const handleStopProcess = useCallback(() => {
    // TODO: Implement process stopping
  }, []);

  // Permission handlers
  const handleApprovePermission = useCallback(() => {
    if (!activeProcessId) return;
    sendInput.mutate({ processId: activeProcessId, input: 'y\n' });
    clearPermissionRequest();
  }, [activeProcessId, sendInput, clearPermissionRequest]);

  const handleDenyPermission = useCallback(() => {
    if (!activeProcessId) return;
    sendInput.mutate({ processId: activeProcessId, input: 'n\n' });
    clearPermissionRequest();
  }, [activeProcessId, sendInput, clearPermissionRequest]);

  const handleBack = useCallback(() => {
    navigate({ to: '/' });
  }, [navigate]);

  // Loading state
  if (isLoadingChat) {
    return (
      <div className="flex h-full flex-col bg-[rgb(var(--background))]">
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

  // Not found state
  if (!chat) {
    return (
      <div className="flex h-full flex-col items-center justify-center bg-[rgb(var(--background))] p-8">
        <AlertCircle className="mb-4 h-16 w-16 text-[rgb(var(--muted-foreground))]" />
        <h2 className="text-lg font-semibold text-[rgb(var(--foreground))]">Chat not found</h2>
        <p className="mt-2 text-sm text-[rgb(var(--muted-foreground))]">
          The chat you're looking for doesn't exist or has been deleted.
        </p>
        <Button variant="primary" className="mt-4" onClick={handleBack}>
          Back to Dashboard
        </Button>
      </div>
    );
  }

  const isProcessing = runExecutor.isPending || isRunning;
  const hasContent = messages.length > 0 || claudeEvents.length > 0;

  return (
    <div className="flex h-full flex-col bg-[rgb(var(--background))]">
      {/* Permission Dialog */}
      {permissionRequest && (
        <PermissionDialog
          request={permissionRequest}
          onApprove={handleApprovePermission}
          onDeny={handleDenyPermission}
        />
      )}

      {/* Header - responsive layout */}
      <header className="flex items-center gap-2 border-b border-[rgb(var(--border))] bg-[rgb(var(--card))] px-3 py-2 md:gap-3 md:px-4 md:py-3">
        <Button variant="ghost" size="sm" onClick={handleBack} className="h-8 w-8 shrink-0 p-0">
          <Icon icon={ArrowLeft} size="sm" />
        </Button>

        <div className="flex min-w-0 flex-1 items-center gap-2 md:gap-2.5">
          <div className="hidden h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[rgb(var(--primary))]/10 sm:flex">
            <Icon icon={MessageSquare} size="sm" className="text-[rgb(var(--primary))]" />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-sm font-semibold text-[rgb(var(--foreground))]">
              {chat.title ?? 'Untitled Chat'}
            </h1>
            {project && (
              <p className="truncate text-xs text-[rgb(var(--muted-foreground))]">{project.name}</p>
            )}
          </div>
        </div>

        {/* View toggle - icon only on mobile */}
        <Button
          variant={showRawOutput ? 'secondary' : 'ghost'}
          size="sm"
          onClick={() => setShowRawOutput(!showRawOutput)}
          className="h-8 shrink-0 gap-1.5 px-2 text-xs sm:px-3"
        >
          <Terminal className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">{showRawOutput ? 'Formatted' : 'Raw'}</span>
        </Button>
      </header>

      {/* Main chat area - responsive padding */}
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-4xl px-3 py-4 md:px-4 md:py-6">
          {/* Empty state */}
          {!hasContent && !isProcessing && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[rgb(var(--primary))]/10">
                <Bot className="h-8 w-8 text-[rgb(var(--primary))]" />
              </div>
              <h2 className="text-lg font-semibold text-[rgb(var(--foreground))]">
                Start a conversation
              </h2>
              <p className="mt-2 max-w-sm text-sm text-[rgb(var(--muted-foreground))]">
                Send a message to start working with Claude. You can ask questions, request code
                changes, or give instructions.
              </p>
            </div>
          )}

          {/* Messages and Claude events in chronological order */}
          <div className="space-y-6">
            {messages.map((message) =>
              message.role === MessageRole.User ? (
                <UserMessageBubble
                  key={message.id}
                  content={message.content}
                  timestamp={message.createdAt}
                />
              ) : message.role === MessageRole.Assistant ? (
                <AssistantMessageBubble
                  key={message.id}
                  content={message.content}
                  toolCalls={message.toolCalls}
                  toolResults={message.toolResults}
                  timestamp={message.createdAt}
                />
              ) : null
            )}

            {/* Claude's response (streaming) - only show when active process */}
            {activeProcessId && (claudeEvents.length > 0 || isRunning) && (
              <AssistantResponse
                events={claudeEvents}
                isStreaming={isRunning}
                showRawOutput={showRawOutput}
                rawOutput={rawOutput}
                persistedAssistantCount={persistedAssistantCount}
              />
            )}
          </div>

          {/* Scroll anchor */}
          <div ref={messagesEndRef} className="h-4" />
        </div>
      </div>

      {/* Input area - responsive padding */}
      <div className="border-t border-[rgb(var(--border))] bg-[rgb(var(--card))]">
        <div className="mx-auto max-w-4xl px-3 py-3 md:px-4 md:py-4">
          <div className="flex gap-2 md:gap-3">
            <div className="relative flex-1">
              <textarea
                ref={textareaRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
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

            {/* Action button - meets 44px touch target */}
            {isProcessing ? (
              <Button
                variant="destructive"
                size="md"
                onClick={handleStopProcess}
                className="h-11 w-11 shrink-0 rounded-xl p-0"
                aria-label="Stop process"
              >
                <StopCircle className="h-5 w-5" />
              </Button>
            ) : (
              <Button
                variant="primary"
                size="md"
                onClick={handleSend}
                disabled={!inputValue.trim()}
                className="h-11 w-11 shrink-0 rounded-xl p-0"
                aria-label="Send message"
              >
                <Send className="h-5 w-5" />
              </Button>
            )}
          </div>

          {/* Helper text - hidden on mobile for space */}
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
    </div>
  );
}

// ============================================================================
// Sub-components
// ============================================================================

interface UserMessageBubbleProps {
  content: string;
  timestamp?: string;
}

function UserMessageBubble({ content, timestamp }: UserMessageBubbleProps) {
  return (
    <div className="flex justify-end">
      {/* Wider on mobile (90%) to maximize space, narrower on desktop (80%) */}
      <div className="flex max-w-[90%] gap-2 md:max-w-[80%] md:gap-3">
        <div className="order-2 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[rgb(var(--primary))] md:h-8 md:w-8">
          <User className="h-3.5 w-3.5 text-[rgb(var(--primary-foreground))] md:h-4 md:w-4" />
        </div>
        <div className="order-1 min-w-0">
          <div className="rounded-2xl rounded-tr-sm bg-[rgb(var(--primary))] px-3 py-2 text-[rgb(var(--primary-foreground))] md:px-4 md:py-3">
            <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">{content}</p>
          </div>
          {timestamp && (
            <p className="mt-1 text-right text-[10px] text-[rgb(var(--muted-foreground))]">
              {new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

interface AssistantMessageBubbleProps {
  content: string;
  toolCalls?: string;
  toolResults?: string;
  timestamp?: string;
}

function AssistantMessageBubble({
  content,
  toolCalls,
  toolResults,
  timestamp,
}: AssistantMessageBubbleProps) {
  // Parse tool data from JSON strings
  const parsedToolCalls = toolCalls ? JSON.parse(toolCalls) : [];
  const parsedToolResults = toolResults ? JSON.parse(toolResults) : [];

  // Match tool calls with their results
  const toolsWithResults = parsedToolCalls.map(
    (call: { id: string; name: string; input: Record<string, unknown> }) => {
      const result = parsedToolResults.find((r: { toolUseId: string }) => r.toolUseId === call.id);
      return {
        id: call.id,
        name: call.name,
        input: call.input,
        output: result?.content,
        isError: result?.isError,
      };
    }
  );

  return (
    <div className="flex gap-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-orange-500 to-amber-600">
        <Bot className="h-4 w-4 text-white" />
      </div>
      <div className="min-w-0 flex-1 space-y-3">
        {/* Text content */}
        {content && (
          <div className="rounded-2xl rounded-tl-sm bg-[rgb(var(--muted))] px-4 py-3">
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-[rgb(var(--foreground))]">
              {content}
            </p>
          </div>
        )}

        {/* Tool calls */}
        {toolsWithResults.map((tool: ToolInfo) => (
          <ToolCallCard key={tool.id} tool={tool} />
        ))}

        {/* Timestamp */}
        {timestamp && (
          <p className="mt-1 text-[10px] text-[rgb(var(--muted-foreground))]">
            {new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </p>
        )}
      </div>
    </div>
  );
}

interface AssistantResponseProps {
  events: ClaudeEvent[];
  isStreaming: boolean;
  showRawOutput: boolean;
  rawOutput: string[];
  persistedAssistantCount: number;
}

// Types for Claude events
type ClaudeEvent = {
  type: 'system' | 'assistant' | 'user' | 'result';
  subtype?: string;
  message?: {
    content?: Array<{
      type: string;
      text?: string;
      id?: string;
      name?: string;
      input?: Record<string, unknown>;
      tool_use_id?: string;
      content?: string;
      is_error?: boolean;
    }>;
  };
  data?: Record<string, unknown>;
};

interface ToolInfo {
  id?: string;
  name: string;
  input?: Record<string, unknown>;
  output?: string;
  isError?: boolean;
}

/**
 * Filter events to only include the current (latest) turn.
 * When using --resume, Claude streams back all historical events.
 * We need to skip events from already-persisted turns.
 *
 * @param events - All events from the stream
 * @param persistedAssistantCount - Number of assistant messages already in the DB
 */
function filterToCurrentTurn(
  events: ClaudeEvent[],
  persistedAssistantCount: number
): ClaudeEvent[] {
  if (persistedAssistantCount === 0) {
    // First turn - show all events
    return events;
  }

  // Find turn boundaries. A new assistant turn starts when:
  // - We see an assistant event that either:
  //   a) Is the first event, or
  //   b) Follows a result event (end of previous turn)
  //
  // Count turns and find the start of turn N+1
  let turnCount = 0;
  let currentTurnStartIndex = 0;
  let lastWasResult = false;

  for (let i = 0; i < events.length; i++) {
    const event = events[i];
    if (!event) continue;

    if (event.type === 'assistant') {
      if (i === 0 || lastWasResult) {
        turnCount++;
        if (turnCount > persistedAssistantCount) {
          currentTurnStartIndex = i;
          break;
        }
      }
      lastWasResult = false;
    } else if (event.type === 'result') {
      lastWasResult = true;
    } else {
      lastWasResult = false;
    }
  }

  // If we haven't found a new turn yet, check if there are any events after last result
  if (turnCount <= persistedAssistantCount) {
    // Find the last result event and return everything after it
    let lastResultIndex = -1;
    for (let i = events.length - 1; i >= 0; i--) {
      const event = events[i];
      if (event?.type === 'result') {
        lastResultIndex = i;
        break;
      }
    }
    if (lastResultIndex >= 0 && lastResultIndex < events.length - 1) {
      return events.slice(lastResultIndex + 1);
    }
    // No new content yet
    return [];
  }

  return events.slice(currentTurnStartIndex);
}

/**
 * Extract text content and tool data from Claude events for persistence.
 * Only extracts from the current turn (skips replayed history).
 */
function extractContentFromEvents(
  events: ClaudeEvent[],
  persistedAssistantCount = 0
): {
  textContent: string;
  toolCalls: Array<{ id: string; name: string; input: Record<string, unknown> }>;
  toolResults: Array<{ toolUseId: string; content: string; isError?: boolean }>;
} {
  // Filter to current turn only
  const currentTurnEvents = filterToCurrentTurn(events, persistedAssistantCount);

  const textParts: string[] = [];
  const toolCalls: Array<{ id: string; name: string; input: Record<string, unknown> }> = [];
  const toolResults: Array<{ toolUseId: string; content: string; isError?: boolean }> = [];

  for (const event of currentTurnEvents) {
    if (event.type === 'assistant' && event.message?.content) {
      for (const block of event.message.content) {
        if (block.type === 'text' && block.text) {
          textParts.push(block.text);
        } else if (block.type === 'tool_use' && block.id && block.name) {
          toolCalls.push({
            id: block.id,
            name: block.name,
            input: block.input ?? {},
          });
        }
      }
    } else if (event.type === 'user' && event.message?.content) {
      for (const block of event.message.content) {
        if (block.type === 'tool_result' && block.tool_use_id) {
          toolResults.push({
            toolUseId: block.tool_use_id,
            content: block.content ?? '',
            isError: block.is_error,
          });
        }
      }
    }
  }

  return {
    textContent: textParts.join('\n\n'),
    toolCalls,
    toolResults,
  };
}

function AssistantResponse({
  events,
  isStreaming,
  showRawOutput,
  rawOutput,
  persistedAssistantCount,
}: AssistantResponseProps) {
  // Filter to current turn only (skip replayed history from --resume)
  const currentTurnEvents = filterToCurrentTurn(events, persistedAssistantCount);

  // Process events into grouped display items
  const displayItems = processEvents(currentTurnEvents);

  return (
    <div className="flex gap-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-orange-500 to-amber-600">
        <Bot className="h-4 w-4 text-white" />
      </div>
      <div className="min-w-0 flex-1 space-y-3">
        {/* Render display items */}
        {displayItems.map((item, index) => {
          if (item.type === 'text') {
            return (
              <div
                key={`text-${index}`}
                className="rounded-2xl rounded-tl-sm bg-[rgb(var(--muted))] px-4 py-3"
              >
                <div className="prose prose-sm prose-invert max-w-none">
                  <p className="whitespace-pre-wrap text-sm leading-relaxed text-[rgb(var(--foreground))]">
                    {item.content}
                  </p>
                </div>
              </div>
            );
          }

          if (item.type === 'tool') {
            return <ToolCallCard key={`tool-${index}`} tool={item.tool} />;
          }

          if (item.type === 'result') {
            return (
              <div
                key={`result-${index}`}
                className={cn(
                  'rounded-lg px-3 py-2 text-xs font-medium',
                  item.subtype === 'success'
                    ? 'bg-success/10 text-success'
                    : item.subtype === 'error'
                      ? 'bg-error/10 text-error'
                      : 'bg-info/10 text-info'
                )}
              >
                {item.subtype === 'success'
                  ? '✓ Completed successfully'
                  : `Result: ${item.subtype}`}
              </div>
            );
          }

          return null;
        })}

        {/* Streaming indicator */}
        {isStreaming && (
          <div className="flex items-center gap-2 px-1 text-sm text-[rgb(var(--muted-foreground))]">
            <Spinner size="sm" />
            <span>Claude is thinking...</span>
          </div>
        )}

        {/* Raw output toggle */}
        {showRawOutput && rawOutput.length > 0 && <RawOutputSection output={rawOutput} />}
      </div>
    </div>
  );
}

function processEvents(
  events: ClaudeEvent[]
): Array<
  | { type: 'text'; content: string }
  | { type: 'tool'; tool: ToolInfo }
  | { type: 'result'; subtype: string }
> {
  const items: Array<
    | { type: 'text'; content: string }
    | { type: 'tool'; tool: ToolInfo }
    | { type: 'result'; subtype: string }
  > = [];
  const pendingTools = new Map<string, Partial<ToolInfo>>();

  for (const event of events) {
    if (event.type === 'assistant' && event.message?.content) {
      for (const block of event.message.content) {
        if (block.type === 'text' && block.text) {
          items.push({ type: 'text', content: block.text });
        } else if (block.type === 'tool_use' && block.name && block.id) {
          pendingTools.set(block.id, {
            id: block.id,
            name: block.name,
            input: block.input,
          });
        }
      }
    } else if (event.type === 'user' && event.message?.content) {
      for (const block of event.message.content) {
        if (block.type === 'tool_result' && block.tool_use_id) {
          const pending = pendingTools.get(block.tool_use_id);
          if (pending) {
            items.push({
              type: 'tool',
              tool: {
                ...pending,
                name: pending.name ?? 'unknown',
                output: block.content,
                isError: block.is_error,
              },
            });
            pendingTools.delete(block.tool_use_id);
          }
        }
      }
    } else if (event.type === 'result') {
      items.push({ type: 'result', subtype: event.subtype ?? 'unknown' });
    }
  }

  // Add remaining pending tools (in progress)
  for (const pending of pendingTools.values()) {
    items.push({
      type: 'tool',
      tool: { ...pending, name: pending.name ?? 'unknown' },
    });
  }

  return items;
}

interface ToolCallCardProps {
  tool: ToolInfo;
}

function ToolCallCard({ tool }: ToolCallCardProps) {
  const [expanded, setExpanded] = useState(false);
  const hasOutput = tool.output && tool.output.length > 0;
  const hasInput = tool.input && Object.keys(tool.input).length > 0;
  const isInProgress = !hasOutput && !tool.isError;

  return (
    <div
      className={cn(
        'overflow-hidden rounded-xl border',
        tool.isError
          ? 'border-error/30 bg-error/5'
          : isInProgress
            ? 'border-info/30 bg-info/5'
            : 'border-border bg-card'
      )}
    >
      {/* Header */}
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className={cn(
          'flex w-full items-center gap-3 px-4 py-3 text-left',
          'hover:bg-[rgb(var(--muted))]/50 transition-colors'
        )}
      >
        <div
          className={cn(
            'flex h-7 w-7 items-center justify-center rounded-lg',
            tool.isError ? 'bg-error/20' : isInProgress ? 'bg-info/20' : 'bg-primary/10'
          )}
        >
          {isInProgress ? (
            <Spinner size="sm" />
          ) : (
            <Wrench className={cn('h-3.5 w-3.5', tool.isError ? 'text-error' : 'text-primary')} />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <code className="text-sm font-semibold text-foreground">{tool.name}</code>
            {tool.isError && (
              <span className="rounded bg-error/20 px-1.5 py-0.5 text-[10px] font-medium text-error">
                Error
              </span>
            )}
            {isInProgress && (
              <span className="rounded bg-info/20 px-1.5 py-0.5 text-[10px] font-medium text-info">
                Running
              </span>
            )}
          </div>
        </div>

        <Icon
          icon={expanded ? ChevronDown : ChevronRight}
          size="sm"
          className="text-[rgb(var(--muted-foreground))]"
        />
      </button>

      {/* Expanded content */}
      {expanded && (hasInput || hasOutput) && (
        <div className="border-t border-[rgb(var(--border))] px-4 py-3 space-y-3">
          {hasInput && (
            <div>
              <p className="mb-1.5 text-xs font-medium text-[rgb(var(--muted-foreground))]">
                Input
              </p>
              <pre className="overflow-x-auto rounded-lg bg-[rgb(var(--background))] p-3 text-xs text-[rgb(var(--muted-foreground))]">
                {JSON.stringify(tool.input, null, 2)}
              </pre>
            </div>
          )}

          {hasOutput && (
            <div>
              <p className="mb-1.5 text-xs font-medium text-[rgb(var(--muted-foreground))]">
                Output
              </p>
              <pre
                className={cn(
                  'max-h-48 overflow-auto rounded-lg p-3 text-xs',
                  tool.isError ? 'bg-error/10 text-error' : 'bg-background text-muted-foreground'
                )}
              >
                {tool.output}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

interface RawOutputSectionProps {
  output: string[];
}

function RawOutputSection({ output }: RawOutputSectionProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--card))]">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-[rgb(var(--muted))]/50"
      >
        <Code2 className="h-4 w-4 text-[rgb(var(--muted-foreground))]" />
        <span className="text-xs font-medium text-[rgb(var(--muted-foreground))]">
          Raw output ({output.length} lines)
        </span>
        <Icon
          icon={expanded ? ChevronDown : ChevronRight}
          size="sm"
          className="ml-auto text-[rgb(var(--muted-foreground))]"
        />
      </button>

      {expanded && (
        <div className="border-t border-[rgb(var(--border))]">
          <pre className="max-h-64 overflow-auto p-4 font-mono text-xs text-[rgb(var(--muted-foreground))]">
            {output.join('\n')}
          </pre>
        </div>
      )}
    </div>
  );
}
