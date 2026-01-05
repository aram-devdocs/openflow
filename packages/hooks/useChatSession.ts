/**
 * useChatSession - Hook for managing standalone chat page state
 *
 * This hook encapsulates all the state management and effects for the
 * standalone chat page, keeping the route component pure.
 *
 * Features:
 * - Full logging at DEBUG/INFO/ERROR levels
 * - Toast notifications for user feedback on actions
 * - Proper error handling with try/catch patterns
 */

import type { Chat, Message, Project } from '@openflow/generated';
import { MessageRole } from '@openflow/generated';
import { createLogger } from '@openflow/utils';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

/** View mode for chat display */
export type ChatViewMode = 'clean' | 'terminal';
import { useChat, useUpdateChat } from './useChats';
import { type PermissionRequest, useClaudeEvents } from './useClaudeEvents';
import { useExecutorProfiles, useRunExecutor } from './useExecutorProfiles';
import { useCreateMessage, useMessages } from './useMessages';
import { useProcessLifecycle } from './useProcessLifecycle';
import { useKillProcess, useSendInput } from './useProcesses';
import { useProject } from './useProjects';
import { useToast } from './useToast';

// ============================================================================
// Logger
// ============================================================================

const logger = createLogger('useChatSession');

// ============================================================================
// Types
// ============================================================================

/** Tool info for persistence */
interface ToolCall {
  id: string;
  name: string;
  input: Record<string, unknown>;
}

interface ToolResult {
  toolUseId: string;
  content: string;
  isError?: boolean;
}

/** Claude event type (matches useClaudeEvents) */
interface ClaudeEvent {
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
      // Content can be a string OR an array of content blocks (Claude API format)
      content?: string | Array<{ text?: string; type?: string }>;
      is_error?: boolean;
    }>;
  };
  data?: Record<string, unknown>;
}

/** Display item for rendering */
export type DisplayItem =
  | { type: 'text'; content: string }
  | {
      type: 'tool';
      tool: {
        id?: string;
        name: string;
        input?: Record<string, unknown>;
        output?: string;
        isError?: boolean;
      };
    }
  | { type: 'result'; subtype: string };

export interface UseChatSessionOptions {
  /** Chat ID to load */
  chatId: string;
  /** @deprecated Use toast hook integration instead - errors are now shown via toast */
  onError?: (title: string, message: string) => void;
}

export interface ChatSessionState {
  // Data
  chat: Chat | undefined;
  project: Project | undefined;
  messages: Message[];
  displayItems: DisplayItem[];
  rawOutput: string[];

  // UI State
  inputValue: string;
  viewMode: ChatViewMode;
  showRawOutput: boolean;
  activeProcessId: string | null;
  isLoadingChat: boolean;

  // Process State
  isProcessing: boolean;
  isRunning: boolean;
  isComplete: boolean;
  hasContent: boolean;

  // Permission
  permissionRequest: PermissionRequest | null;

  // Refs for scrolling
  messagesEndRef: React.RefObject<HTMLDivElement>;
  scrollContainerRef: React.RefObject<HTMLDivElement>;
  textareaRef: React.RefObject<HTMLTextAreaElement>;

  // Actions
  setInputValue: (value: string) => void;
  setViewMode: (mode: ChatViewMode) => void;
  toggleViewMode: () => void;
  setShowRawOutput: (value: boolean) => void;
  toggleRawOutput: () => void;
  handleSend: () => Promise<void>;
  handleKeyDown: (event: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  handleStopProcess: () => void;
  handleApprovePermission: () => void;
  handleDenyPermission: () => void;
}

// ============================================================================
// Event Processing Utilities
// ============================================================================

/**
 * Filter events to only include the current (latest) turn.
 * When using --resume, Claude streams back all historical events.
 * We need to skip events from already-persisted turns.
 */
function filterToCurrentTurn(
  events: ClaudeEvent[],
  persistedAssistantCount: number
): ClaudeEvent[] {
  if (persistedAssistantCount === 0) {
    return events;
  }

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

  if (turnCount <= persistedAssistantCount) {
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
    return [];
  }

  return events.slice(currentTurnStartIndex);
}

/**
 * Extract text content and tool data from Claude events for persistence.
 */
function extractContentFromEvents(
  events: ClaudeEvent[],
  persistedAssistantCount = 0
): {
  textContent: string;
  toolCalls: ToolCall[];
  toolResults: ToolResult[];
} {
  const currentTurnEvents = filterToCurrentTurn(events, persistedAssistantCount);

  const textParts: string[] = [];
  const toolCalls: ToolCall[] = [];
  const toolResults: ToolResult[] = [];

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
          // Handle content that can be string or array of content blocks
          const contentStr =
            typeof block.content === 'string'
              ? block.content
              : Array.isArray(block.content)
                ? block.content.map((c: { text?: string }) => c.text || '').join('')
                : '';
          toolResults.push({
            toolUseId: block.tool_use_id,
            content: contentStr,
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

/**
 * Process events into display items for rendering.
 * Tools are shown immediately when tool_use arrives (with output: undefined),
 * then updated in-place when tool_result arrives.
 */
function processEventsToDisplayItems(events: ClaudeEvent[]): DisplayItem[] {
  const items: DisplayItem[] = [];
  // Map tool_id -> index in items array, for updating when results arrive
  const toolIndexMap = new Map<string, number>();

  for (const event of events) {
    if (event.type === 'assistant' && event.message?.content) {
      for (const block of event.message.content) {
        // Debug: Log ALL block types to understand what we're receiving
        logger.debug('Processing assistant content block', {
          blockType: block.type,
          hasText: !!block.text,
          hasId: !!block.id,
          hasName: !!block.name,
          blockKeys: Object.keys(block),
        });
        if (block.type === 'text' && block.text) {
          items.push({ type: 'text', content: block.text });
        } else if (block.type === 'tool_use' && block.name && block.id) {
          // Add tool immediately to display (shows "in progress" state)
          const toolItem: DisplayItem = {
            type: 'tool',
            tool: {
              id: block.id,
              name: block.name,
              input: block.input,
              output: undefined, // No output yet - tool in progress
              isError: false,
            },
          };
          items.push(toolItem);
          // Track index for updating when result arrives
          toolIndexMap.set(block.id, items.length - 1);
        }
      }
    } else if (event.type === 'user' && event.message?.content) {
      for (const block of event.message.content) {
        if (block.type === 'tool_result' && block.tool_use_id) {
          const toolIndex = toolIndexMap.get(block.tool_use_id);
          logger.debug('Processing tool_result', {
            toolUseId: block.tool_use_id,
            foundToolIndex: toolIndex,
            toolMapKeys: Array.from(toolIndexMap.keys()),
          });
          if (toolIndex !== undefined) {
            // Update existing tool item with result (in-place)
            const existingItem = items[toolIndex];
            if (existingItem && existingItem.type === 'tool') {
              // Use empty string for undefined content - tool completed but no output
              // This distinguishes from undefined which means tool still running
              // Handle content that can be string or array of content blocks
              const outputStr =
                typeof block.content === 'string'
                  ? block.content
                  : Array.isArray(block.content)
                    ? block.content.map((c: { text?: string }) => c.text || '').join('')
                    : '';
              existingItem.tool.output = outputStr;
              existingItem.tool.isError = block.is_error ?? false;
            }
            toolIndexMap.delete(block.tool_use_id);
          }
        }
      }
    } else if (event.type === 'result') {
      items.push({ type: 'result', subtype: event.subtype ?? 'unknown' });
    }
  }

  return items;
}

// ============================================================================
// Hook Implementation
// ============================================================================

/**
 * useChatSession hook for managing standalone chat page state.
 *
 * Encapsulates:
 * - Data fetching (chat, messages, project, executor profiles)
 * - Claude event streaming and processing
 * - Message persistence on completion
 * - Session ID management for resumption
 * - Permission request handling
 * - Input state management
 * - Full logging and toast notifications
 *
 * @example
 * ```tsx
 * function ChatPage() {
 *   const { chatId } = Route.useParams();
 *   const session = useChatSession({ chatId });
 *
 *   if (session.isLoadingChat) return <SkeletonChat />;
 *   if (!session.chat) return <ChatNotFound />;
 *
 *   return (
 *     <ChatLayout>
 *       <ChatHeader chat={session.chat} project={session.project} />
 *       <MessageList messages={session.messages} displayItems={session.displayItems} />
 *       <ChatInput {...session} />
 *     </ChatLayout>
 *   );
 * }
 * ```
 */
export function useChatSession({ chatId, onError }: UseChatSessionOptions): ChatSessionState {
  // Toast notifications
  const toast = useToast();

  // Process lifecycle management - handles race conditions
  const lifecycle = useProcessLifecycle();

  // UI state
  const [viewMode, setViewMode] = useState<ChatViewMode>('clean');
  const [showRawOutput, setShowRawOutput] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const savedProcessRef = useRef<string | null>(null);
  const savedSessionIdRef = useRef<string | null>(null);

  // Data fetching
  const { data: chatData, isLoading: isLoadingChat } = useChat(chatId);
  const { data: messages = [] } = useMessages(chatId);
  const { data: executorProfiles = [] } = useExecutorProfiles();

  // ChatWithMessages extends Chat, so properties are directly available
  const chat = chatData;
  const projectId = chat?.projectId ?? '';
  const { data: project } = useProject(projectId);

  // Log data fetching results
  useEffect(() => {
    if (chat) {
      logger.debug('Chat loaded', {
        chatId: chat.id,
        chatTitle: chat.title,
        projectId: chat.projectId,
        taskId: chat.taskId,
        messageCount: messages.length,
      });
    }
  }, [chat, messages.length]);

  // Mutations
  const runExecutor = useRunExecutor();
  const createMessage = useCreateMessage();
  const sendInput = useSendInput();
  const updateChat = useUpdateChat();
  const killProcess = useKillProcess();

  // Claude events for streaming output
  // Pass lifecycle.onListenersReady to coordinate process startup
  const {
    events: claudeEvents,
    rawOutput,
    isRunning,
    isComplete,
    permissionRequest,
    clearPermissionRequest,
    clearEvents,
    sessionId,
    // listenersReady is handled via the onListenersReady callback
  } = useClaudeEvents(lifecycle.processId, {
    onListenersReady: lifecycle.onListenersReady,
  });

  // Log streaming state changes
  useEffect(() => {
    if (isRunning && lifecycle.processState === 'running') {
      logger.debug('Claude process started running', { processId: lifecycle.processId });
    }
  }, [isRunning, lifecycle.processState, lifecycle.processId]);

  useEffect(() => {
    if (isComplete && lifecycle.processId) {
      logger.debug('Claude process completed', {
        processId: lifecycle.processId,
        eventCount: claudeEvents.length,
      });
    }
  }, [isComplete, lifecycle.processId, claudeEvents.length]);

  // Get selected executor profile
  const selectedExecutorProfileId = chat?.executorProfileId ?? executorProfiles[0]?.id ?? '';

  // Count persisted assistant messages for filtering replayed events
  const persistedAssistantCount = messages.filter((m) => m.role === MessageRole.Assistant).length;

  // Filter and process events for display - memoized to avoid recalculation on every keystroke
  const displayItems = useMemo(() => {
    const currentTurnEvents = filterToCurrentTurn(
      claudeEvents as ClaudeEvent[],
      persistedAssistantCount
    );
    return processEventsToDisplayItems(currentTurnEvents);
  }, [claudeEvents, persistedAssistantCount]);

  // Save assistant response to database when process completes
  // Uses lifecycle manager to prevent race conditions
  useEffect(() => {
    // Only proceed if process completed and we have basic requirements
    if (!isComplete || !chatId || !lifecycle.processId) {
      return;
    }

    // Already saved this process
    if (savedProcessRef.current === lifecycle.processId) {
      return;
    }

    // Only start completion flow if in running state
    if (lifecycle.processState !== 'running') {
      return;
    }

    // Mark as completing to prevent duplicate effect runs
    lifecycle.markCompleting();

    // Extract content from events for persistence
    // Note: claudeEvents from closure is current at this point since we're in the effect body
    const { textContent, toolCalls, toolResults } = extractContentFromEvents(
      claudeEvents as ClaudeEvent[],
      persistedAssistantCount
    );

    if (textContent || toolCalls.length > 0) {
      savedProcessRef.current = lifecycle.processId;

      // Use placeholder content for tool-only responses (validation requires non-empty content)
      const contentToSave = textContent || (toolCalls.length > 0 ? '[Tool execution]' : '');

      logger.debug('Persisting assistant response', {
        chatId,
        processId: lifecycle.processId,
        textLength: textContent.length,
        contentToSave: contentToSave.substring(0, 50),
        toolCallCount: toolCalls.length,
        toolResultCount: toolResults.length,
        eventCount: claudeEvents.length,
      });

      createMessage.mutate(
        {
          chatId,
          role: MessageRole.Assistant,
          content: contentToSave,
          toolCalls: toolCalls.length > 0 ? JSON.stringify(toolCalls) : undefined,
          toolResults: toolResults.length > 0 ? JSON.stringify(toolResults) : undefined,
        },
        {
          onSuccess: () => {
            logger.info('Assistant response persisted successfully', {
              chatId,
              processId: lifecycle.processId,
            });
            // Clear streaming events now that message is persisted
            clearEvents();
            lifecycle.clearProcess();
          },
          onError: (error) => {
            logger.error('Failed to persist assistant response', {
              chatId,
              processId: lifecycle.processId,
              error: error instanceof Error ? error.message : String(error),
            });
            toast.error(
              'Failed to Save Response',
              'The assistant response could not be saved. Please try again.'
            );
            lifecycle.clearProcess();
          },
        }
      );
    } else {
      logger.debug('No content to persist, clearing process', {
        chatId,
        processId: lifecycle.processId,
        eventCount: claudeEvents.length,
      });
      clearEvents();
      lifecycle.clearProcess();
    }
    // No cleanup needed - we call processCompletion synchronously
  }, [
    isComplete,
    chatId,
    lifecycle.processId,
    lifecycle.processState,
    lifecycle.markCompleting,
    lifecycle.clearProcess,
    createMessage,
    clearEvents,
    claudeEvents,
    persistedAssistantCount,
    toast,
  ]);

  // Save Claude session ID to chat for session resumption
  // Uses savedSessionIdRef to prevent duplicate saves during re-renders
  useEffect(() => {
    if (!sessionId || !chatId || !chat) return;
    // Already saved to database
    if (chat.claudeSessionId) return;
    // Already initiated save for this session ID (prevents loop during re-fetch)
    if (savedSessionIdRef.current === sessionId) return;

    // Mark as saving BEFORE calling mutate to prevent race condition
    savedSessionIdRef.current = sessionId;

    logger.debug('Saving Claude session ID to chat', { chatId, sessionId });
    updateChat.mutate(
      {
        id: chatId,
        request: { claudeSessionId: sessionId },
      },
      {
        onSuccess: () => {
          logger.info('Claude session ID saved successfully', { chatId, sessionId });
        },
        onError: (error) => {
          // Reset ref on error to allow retry
          savedSessionIdRef.current = null;
          logger.error('Failed to save Claude session ID', {
            chatId,
            sessionId,
            error: error instanceof Error ? error.message : String(error),
          });
          // Don't show toast for this - it's not user-facing critical
        },
      }
    );
  }, [sessionId, chatId, chat, updateChat]);

  // Auto-scroll to bottom when new content arrives (only if user is near bottom)
  // biome-ignore lint/correctness/useExhaustiveDependencies: intentionally trigger on content changes
  useEffect(() => {
    // Use dedicated scroll container ref instead of fragile parent traversal
    const scrollContainer = scrollContainerRef.current;
    if (!scrollContainer) return;

    // Check if user is near bottom (within 150px)
    const isNearBottom =
      scrollContainer.scrollHeight - scrollContainer.scrollTop - scrollContainer.clientHeight < 150;

    if (isNearBottom && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [messages, claudeEvents, isRunning]);

  // Handle send message
  const handleSend = useCallback(async () => {
    const trimmedValue = inputValue.trim();
    if (!trimmedValue || !chatId) {
      logger.debug('Send aborted: empty input or no chatId', { chatId, hasInput: !!trimmedValue });
      return;
    }

    // Check if we can start a new process (lifecycle manager handles state)
    if (!lifecycle.canStartProcess) {
      logger.warn('Send aborted: cannot start process', {
        processState: lifecycle.processState,
        processId: lifecycle.processId,
      });
      return;
    }

    logger.debug('Sending message', {
      chatId,
      messageLength: trimmedValue.length,
      executorProfileId: selectedExecutorProfileId,
    });

    setInputValue('');

    // Create user message
    createMessage.mutate(
      {
        chatId,
        role: MessageRole.User,
        content: trimmedValue,
      },
      {
        onSuccess: () => {
          logger.debug('User message created successfully', { chatId });
        },
        onError: (error) => {
          logger.error('Failed to create user message', {
            chatId,
            error: error instanceof Error ? error.message : String(error),
          });
          toast.error(
            'Failed to Send Message',
            'Your message could not be sent. Please try again.'
          );
        },
      }
    );

    try {
      const process = await runExecutor.mutateAsync({
        chatId,
        prompt: trimmedValue,
        executorProfileId: selectedExecutorProfileId,
      });
      logger.info('Executor started successfully', {
        chatId,
        processId: process.id,
        executorProfileId: selectedExecutorProfileId,
      });
      // Use lifecycle manager to start process - this triggers listener setup
      lifecycle.startProcess(process.id);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Failed to run executor', {
        chatId,
        executorProfileId: selectedExecutorProfileId,
        error: message,
      });
      toast.error('Failed to Run Executor', message);
      // Also call legacy onError for backward compatibility
      onError?.('Failed to run executor', message);
    }

    textareaRef.current?.focus();
  }, [
    inputValue,
    chatId,
    lifecycle.canStartProcess,
    lifecycle.processState,
    lifecycle.processId,
    lifecycle.startProcess,
    createMessage,
    runExecutor,
    selectedExecutorProfileId,
    toast,
    onError,
  ]);

  // Handle keyboard shortcuts in textarea
  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        logger.debug('Enter key pressed, triggering send');
        handleSend();
      }
    },
    [handleSend]
  );

  const handleStopProcess = useCallback(() => {
    if (!lifecycle.processId) {
      logger.debug('Stop process aborted: no active process');
      return;
    }

    logger.debug('Stopping process', { processId: lifecycle.processId });
    killProcess.mutate(lifecycle.processId, {
      onSuccess: () => {
        logger.info('Process stopped successfully', { processId: lifecycle.processId });
        toast.success('Process Stopped', 'The executor has been stopped.');
        lifecycle.clearProcess();
      },
      onError: (err) => {
        logger.error('Failed to stop process', {
          processId: lifecycle.processId,
          error: err.message,
        });
        toast.error('Failed to Stop Process', err.message);
        // Also call legacy onError for backward compatibility
        onError?.('Failed to stop process', err.message);
      },
    });
  }, [lifecycle.processId, lifecycle.clearProcess, killProcess, toast, onError]);

  // Permission handlers
  const handleApprovePermission = useCallback(() => {
    if (!lifecycle.processId) {
      logger.debug('Approve permission aborted: no active process');
      return;
    }

    logger.debug('Approving permission request', {
      processId: lifecycle.processId,
      permissionType: permissionRequest?.toolName,
    });

    sendInput.mutate(
      { processId: lifecycle.processId, input: 'y\n' },
      {
        onSuccess: () => {
          logger.info('Permission approved successfully', {
            processId: lifecycle.processId,
            permissionType: permissionRequest?.toolName,
          });
        },
        onError: (error) => {
          logger.error('Failed to send permission approval', {
            processId: lifecycle.processId,
            error: error instanceof Error ? error.message : String(error),
          });
          toast.error('Permission Error', 'Failed to send permission response.');
        },
      }
    );
    clearPermissionRequest();
  }, [lifecycle.processId, sendInput, clearPermissionRequest, permissionRequest, toast]);

  const handleDenyPermission = useCallback(() => {
    if (!lifecycle.processId) {
      logger.debug('Deny permission aborted: no active process');
      return;
    }

    logger.debug('Denying permission request', {
      processId: lifecycle.processId,
      permissionType: permissionRequest?.toolName,
    });

    sendInput.mutate(
      { processId: lifecycle.processId, input: 'n\n' },
      {
        onSuccess: () => {
          logger.info('Permission denied successfully', {
            processId: lifecycle.processId,
            permissionType: permissionRequest?.toolName,
          });
        },
        onError: (error) => {
          logger.error('Failed to send permission denial', {
            processId: lifecycle.processId,
            error: error instanceof Error ? error.message : String(error),
          });
          toast.error('Permission Error', 'Failed to send permission response.');
        },
      }
    );
    clearPermissionRequest();
  }, [lifecycle.processId, sendInput, clearPermissionRequest, permissionRequest, toast]);

  const toggleRawOutput = useCallback(() => {
    setShowRawOutput((prev) => {
      const newValue = !prev;
      logger.debug('Toggling raw output', { showRawOutput: newValue });
      return newValue;
    });
  }, []);

  const toggleViewMode = useCallback(() => {
    setViewMode((prev) => {
      const newMode = prev === 'clean' ? 'terminal' : 'clean';
      logger.debug('Toggling view mode', { viewMode: newMode });
      return newMode;
    });
  }, []);

  // Use lifecycle state for more accurate processing status
  const isProcessing = runExecutor.isPending || lifecycle.processState !== 'idle';
  const hasContent = messages.length > 0 || claudeEvents.length > 0;

  return {
    // Data
    chat,
    project,
    messages,
    displayItems,
    rawOutput,

    // UI State
    inputValue,
    viewMode,
    showRawOutput,
    activeProcessId: lifecycle.processId,
    isLoadingChat,

    // Process State
    isProcessing,
    isRunning: lifecycle.processState === 'running' && isRunning,
    isComplete,
    hasContent,

    // Permission
    permissionRequest,

    // Refs
    messagesEndRef: messagesEndRef as React.RefObject<HTMLDivElement>,
    scrollContainerRef: scrollContainerRef as React.RefObject<HTMLDivElement>,
    textareaRef: textareaRef as React.RefObject<HTMLTextAreaElement>,

    // Actions
    setInputValue,
    setViewMode,
    toggleViewMode,
    setShowRawOutput,
    toggleRawOutput,
    handleSend,
    handleKeyDown,
    handleStopProcess,
    handleApprovePermission,
    handleDenyPermission,
  };
}
