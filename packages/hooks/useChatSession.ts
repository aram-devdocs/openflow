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
import { useCallback, useEffect, useRef, useState } from 'react';
import { useChat, useUpdateChat } from './useChats';
import { type PermissionRequest, useClaudeEvents } from './useClaudeEvents';
import { useExecutorProfiles, useRunExecutor } from './useExecutorProfiles';
import { useCreateMessage, useMessages } from './useMessages';
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
      content?: string;
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
  textareaRef: React.RefObject<HTMLTextAreaElement>;

  // Actions
  setInputValue: (value: string) => void;
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

/**
 * Process events into display items for rendering.
 */
function processEventsToDisplayItems(events: ClaudeEvent[]): DisplayItem[] {
  const items: DisplayItem[] = [];
  const pendingTools = new Map<
    string,
    { id?: string; name: string; input?: Record<string, unknown> }
  >();

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
  logger.debug('Initializing useChatSession hook', { chatId });

  // Toast notifications
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
  const {
    events: claudeEvents,
    rawOutput,
    isRunning,
    isComplete,
    permissionRequest,
    clearPermissionRequest,
    sessionId,
  } = useClaudeEvents(activeProcessId);

  // Log streaming state changes
  useEffect(() => {
    if (isRunning) {
      logger.debug('Claude process started running', { processId: activeProcessId });
    }
  }, [isRunning, activeProcessId]);

  useEffect(() => {
    if (isComplete && activeProcessId) {
      logger.debug('Claude process completed', {
        processId: activeProcessId,
        eventCount: claudeEvents.length,
      });
    }
  }, [isComplete, activeProcessId, claudeEvents.length]);

  // Get selected executor profile
  const selectedExecutorProfileId = chat?.executorProfileId ?? executorProfiles[0]?.id ?? '';

  // Count persisted assistant messages for filtering replayed events
  const persistedAssistantCount = messages.filter((m) => m.role === MessageRole.Assistant).length;

  // Filter and process events for display
  const currentTurnEvents = filterToCurrentTurn(
    claudeEvents as ClaudeEvent[],
    persistedAssistantCount
  );
  const displayItems = processEventsToDisplayItems(currentTurnEvents);

  // Save assistant response to database when process completes
  useEffect(() => {
    if (!isComplete || claudeEvents.length === 0 || !chatId || !activeProcessId) {
      return;
    }

    if (savedProcessRef.current === activeProcessId) {
      return;
    }

    const { textContent, toolCalls, toolResults } = extractContentFromEvents(
      claudeEvents as ClaudeEvent[],
      persistedAssistantCount
    );

    if (textContent || toolCalls.length > 0) {
      savedProcessRef.current = activeProcessId;
      logger.debug('Persisting assistant response', {
        chatId,
        processId: activeProcessId,
        textLength: textContent.length,
        toolCallCount: toolCalls.length,
        toolResultCount: toolResults.length,
      });

      createMessage.mutate(
        {
          chatId,
          role: MessageRole.Assistant,
          content: textContent,
          toolCalls: toolCalls.length > 0 ? JSON.stringify(toolCalls) : undefined,
          toolResults: toolResults.length > 0 ? JSON.stringify(toolResults) : undefined,
        },
        {
          onSuccess: () => {
            logger.info('Assistant response persisted successfully', {
              chatId,
              processId: activeProcessId,
            });
            setActiveProcessId(null);
          },
          onError: (error) => {
            logger.error('Failed to persist assistant response', {
              chatId,
              processId: activeProcessId,
              error: error instanceof Error ? error.message : String(error),
            });
            toast.error(
              'Failed to Save Response',
              'The assistant response could not be saved. Please try again.'
            );
            setActiveProcessId(null);
          },
        }
      );
    } else {
      setActiveProcessId(null);
    }
  }, [
    isComplete,
    claudeEvents,
    chatId,
    activeProcessId,
    createMessage,
    persistedAssistantCount,
    toast,
  ]);

  // Save Claude session ID to chat for session resumption
  useEffect(() => {
    if (!sessionId || !chatId || !chat) return;
    if (chat.claudeSessionId) return;

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

  // Auto-scroll to bottom when new content arrives
  // biome-ignore lint/correctness/useExhaustiveDependencies: intentionally trigger on content changes
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, claudeEvents, isRunning]);

  // Handle send message
  const handleSend = useCallback(async () => {
    const trimmedValue = inputValue.trim();
    if (!trimmedValue || !chatId) {
      logger.debug('Send aborted: empty input or no chatId', { chatId, hasInput: !!trimmedValue });
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
      setActiveProcessId(process.id);
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
  }, [inputValue, chatId, createMessage, runExecutor, selectedExecutorProfileId, toast, onError]);

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
    if (!activeProcessId) {
      logger.debug('Stop process aborted: no active process');
      return;
    }

    logger.debug('Stopping process', { processId: activeProcessId });
    killProcess.mutate(activeProcessId, {
      onSuccess: () => {
        logger.info('Process stopped successfully', { processId: activeProcessId });
        toast.success('Process Stopped', 'The executor has been stopped.');
        setActiveProcessId(null);
      },
      onError: (err) => {
        logger.error('Failed to stop process', {
          processId: activeProcessId,
          error: err.message,
        });
        toast.error('Failed to Stop Process', err.message);
        // Also call legacy onError for backward compatibility
        onError?.('Failed to stop process', err.message);
      },
    });
  }, [activeProcessId, killProcess, toast, onError]);

  // Permission handlers
  const handleApprovePermission = useCallback(() => {
    if (!activeProcessId) {
      logger.debug('Approve permission aborted: no active process');
      return;
    }

    logger.debug('Approving permission request', {
      processId: activeProcessId,
      permissionType: permissionRequest?.toolName,
    });

    sendInput.mutate(
      { processId: activeProcessId, input: 'y\n' },
      {
        onSuccess: () => {
          logger.info('Permission approved successfully', {
            processId: activeProcessId,
            permissionType: permissionRequest?.toolName,
          });
        },
        onError: (error) => {
          logger.error('Failed to send permission approval', {
            processId: activeProcessId,
            error: error instanceof Error ? error.message : String(error),
          });
          toast.error('Permission Error', 'Failed to send permission response.');
        },
      }
    );
    clearPermissionRequest();
  }, [activeProcessId, sendInput, clearPermissionRequest, permissionRequest, toast]);

  const handleDenyPermission = useCallback(() => {
    if (!activeProcessId) {
      logger.debug('Deny permission aborted: no active process');
      return;
    }

    logger.debug('Denying permission request', {
      processId: activeProcessId,
      permissionType: permissionRequest?.toolName,
    });

    sendInput.mutate(
      { processId: activeProcessId, input: 'n\n' },
      {
        onSuccess: () => {
          logger.info('Permission denied successfully', {
            processId: activeProcessId,
            permissionType: permissionRequest?.toolName,
          });
        },
        onError: (error) => {
          logger.error('Failed to send permission denial', {
            processId: activeProcessId,
            error: error instanceof Error ? error.message : String(error),
          });
          toast.error('Permission Error', 'Failed to send permission response.');
        },
      }
    );
    clearPermissionRequest();
  }, [activeProcessId, sendInput, clearPermissionRequest, permissionRequest, toast]);

  const toggleRawOutput = useCallback(() => {
    setShowRawOutput((prev) => {
      const newValue = !prev;
      logger.debug('Toggling raw output', { showRawOutput: newValue });
      return newValue;
    });
  }, []);

  const isProcessing = runExecutor.isPending || isRunning;
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
    showRawOutput,
    activeProcessId,
    isLoadingChat,

    // Process State
    isProcessing,
    isRunning,
    isComplete,
    hasContent,

    // Permission
    permissionRequest,

    // Refs
    messagesEndRef: messagesEndRef as React.RefObject<HTMLDivElement>,
    textareaRef: textareaRef as React.RefObject<HTMLTextAreaElement>,

    // Actions
    setInputValue,
    setShowRawOutput,
    toggleRawOutput,
    handleSend,
    handleKeyDown,
    handleStopProcess,
    handleApprovePermission,
    handleDenyPermission,
  };
}
