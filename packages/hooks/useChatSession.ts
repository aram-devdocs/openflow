/**
 * useChatSession - Hook for managing standalone chat page state
 *
 * This hook encapsulates all the state management and effects for the
 * standalone chat page, keeping the route component pure.
 *
 * Uses the AgentOrchestrator backend for agent execution and event streaming.
 */

import type {
  AgentEventRecord,
  Chat,
  Message,
  Project,
  UnifiedAgentEvent,
  UnifiedAgentEventMessage,
  UnifiedAgentEventToolResult,
  UnifiedAgentEventToolUse,
} from '@openflow/generated';
import {
  AgentMessageRole,
  CompletionStatus,
  MessageRole,
  SessionStatus,
  ToolResultStatus,
} from '@openflow/generated';
import { createLogger } from '@openflow/utils';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

/** View mode for chat display */
export type ChatViewMode = 'clean' | 'terminal';
import {
  useAgentPendingPermission,
  useAgentRawOutput,
  useAgentSessionEvents,
  useAgentSessionWithState,
  useAgentSessionsByProcess,
  useRespondAgentPermission,
} from './useAgentSession';
import { useChat, useUpdateChat } from './useChats';
import { useExecutorProfiles, useRunExecutor } from './useExecutorProfiles';
import { useCreateMessage, useMessages } from './useMessages';
import { useProcessLifecycle } from './useProcessLifecycle';
import { useKillProcess, useProcessesByChat } from './useProcesses';
import { useProject } from './useProjects';
import { useToast } from './useToast';

/** Permission request type */
export interface PermissionRequest {
  toolName: string;
  description?: string;
  filePath?: string;
}

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
  /** Optional error callback for backward compatibility */
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
 * Extract content from UnifiedAgentEvents for message persistence.
 */
function extractContentFromUnifiedEvents(events: AgentEventRecord[]): {
  textContent: string;
  toolCalls: ToolCall[];
  toolResults: ToolResult[];
} {
  const textParts: string[] = [];
  const toolCalls: ToolCall[] = [];
  const toolResults: ToolResult[] = [];

  for (const record of events) {
    const event = record.payload as UnifiedAgentEvent;
    if (!event || typeof event !== 'object' || !('type' in event)) continue;

    if (event.type === 'message') {
      const msgEvent = event as UnifiedAgentEventMessage;
      if (msgEvent.role === AgentMessageRole.Assistant) {
        for (const block of msgEvent.content) {
          if (block.type === 'text' && block.text) {
            textParts.push(block.text);
          } else if (block.type === 'tool_use' && block.id && block.name) {
            toolCalls.push({
              id: block.id,
              name: block.name,
              input: (block.input as Record<string, unknown>) ?? {},
            });
          }
        }
      } else if (msgEvent.role === AgentMessageRole.User) {
        for (const block of msgEvent.content) {
          if (block.type === 'tool_result' && block.tool_use_id) {
            toolResults.push({
              toolUseId: block.tool_use_id,
              content: block.content ?? '',
              isError: block.is_error,
            });
          }
        }
      }
    } else if (event.type === 'tool_use') {
      const toolEvent = event as UnifiedAgentEventToolUse;
      toolCalls.push({
        id: toolEvent.tool_id,
        name: toolEvent.tool_name,
        input: (toolEvent.input as Record<string, unknown>) ?? {},
      });
    } else if (event.type === 'tool_result') {
      const resultEvent = event as UnifiedAgentEventToolResult;
      toolResults.push({
        toolUseId: resultEvent.tool_id,
        content: resultEvent.output,
        isError: resultEvent.status === ToolResultStatus.Error,
      });
    }
  }

  return {
    textContent: textParts.join('\n\n'),
    toolCalls,
    toolResults,
  };
}

/**
 * Process UnifiedAgentEvents into display items for rendering.
 */
function processUnifiedEventsToDisplayItems(events: AgentEventRecord[]): DisplayItem[] {
  const items: DisplayItem[] = [];
  const toolIndexMap = new Map<string, number>();

  for (const record of events) {
    const event = record.payload as UnifiedAgentEvent;
    if (!event || typeof event !== 'object' || !('type' in event)) continue;

    if (event.type === 'message') {
      const msgEvent = event as UnifiedAgentEventMessage;
      if (msgEvent.role === AgentMessageRole.Assistant) {
        for (const block of msgEvent.content) {
          if (block.type === 'text' && block.text) {
            items.push({ type: 'text', content: block.text });
          } else if (block.type === 'tool_use' && block.id && block.name) {
            items.push({
              type: 'tool',
              tool: {
                id: block.id,
                name: block.name,
                input: block.input as Record<string, unknown>,
                output: undefined,
                isError: false,
              },
            });
            toolIndexMap.set(block.id, items.length - 1);
          }
        }
      } else if (msgEvent.role === AgentMessageRole.User) {
        for (const block of msgEvent.content) {
          if (block.type === 'tool_result' && block.tool_use_id) {
            const toolIndex = toolIndexMap.get(block.tool_use_id);
            if (toolIndex !== undefined) {
              const existingItem = items[toolIndex];
              if (existingItem?.type === 'tool') {
                existingItem.tool.output = block.content ?? '';
                existingItem.tool.isError = block.is_error ?? false;
              }
              toolIndexMap.delete(block.tool_use_id);
            }
          }
        }
      }
    } else if (event.type === 'tool_use') {
      const toolEvent = event as UnifiedAgentEventToolUse;
      items.push({
        type: 'tool',
        tool: {
          id: toolEvent.tool_id,
          name: toolEvent.tool_name,
          input: toolEvent.input as Record<string, unknown>,
          output: undefined,
          isError: false,
        },
      });
      toolIndexMap.set(toolEvent.tool_id, items.length - 1);
    } else if (event.type === 'tool_result') {
      const resultEvent = event as UnifiedAgentEventToolResult;
      const toolIndex = toolIndexMap.get(resultEvent.tool_id);
      if (toolIndex !== undefined) {
        const existingItem = items[toolIndex];
        if (existingItem?.type === 'tool') {
          existingItem.tool.output = resultEvent.output;
          existingItem.tool.isError = resultEvent.status === ToolResultStatus.Error;
        }
        toolIndexMap.delete(resultEvent.tool_id);
      }
    } else if (event.type === 'complete') {
      const status = event.status === CompletionStatus.Success ? 'complete' : 'error';
      items.push({ type: 'result', subtype: status });
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
  const updateChat = useUpdateChat();
  const killProcess = useKillProcess();
  const respondPermission = useRespondAgentPermission();

  // Discover existing processes for this chat (for page loads with history)
  // Only query when we don't have an active process
  const { data: existingProcesses = [] } = useProcessesByChat(chatId, {
    enabled: !!chatId && !lifecycle.processId,
  });

  // Auto-discover most recent process if we don't have one
  // This is used for viewing history, NOT for engaging the lifecycle
  const discoveredProcessId = existingProcesses.length > 0 ? existingProcesses[0]?.id : null;

  // Log discovered processes (but don't engage lifecycle for them)
  useEffect(() => {
    if (discoveredProcessId && !lifecycle.processId) {
      logger.debug('Discovered existing process for chat (historical viewing)', {
        chatId,
        processId: discoveredProcessId,
      });
    }
  }, [discoveredProcessId, lifecycle.processId, chatId]);

  // Use lifecycle process ID when we have one (active), otherwise use discovered (historical)
  const activeProcessId = lifecycle.processId ?? discoveredProcessId;

  // Get agent sessions for the current process
  const { data: agentSessions = [] } = useAgentSessionsByProcess(activeProcessId ?? '', {
    enabled: !!activeProcessId,
  });
  const agentSessionId = agentSessions[0]?.id ?? null;

  // Get session state for status tracking
  const { data: sessionState } = useAgentSessionWithState(agentSessionId ?? '', {
    enabled: !!agentSessionId,
    refetchInterval: agentSessionId ? 500 : false,
  });

  // Determine if session is running for refetch intervals
  const isSessionRunning = sessionState?.session.status === SessionStatus.Running;

  // Get events for the agent session - accumulate in local state
  const [accumulatedEvents, setAccumulatedEvents] = useState<AgentEventRecord[]>([]);
  const lastSequenceRef = useRef<number>(-1);

  // Track whether we initiated this session (via handleSend) vs discovered it
  const initiatedSessionRef = useRef<string | null>(null);

  // Query for events - don't use afterSequence in query key to get all events on initial load
  const { data: fetchedEvents = [] } = useAgentSessionEvents(agentSessionId ?? '', {
    enabled: !!agentSessionId,
    // Only poll for new events when session is running
    refetchInterval: isSessionRunning ? 500 : false,
  });

  // Accumulate events when new ones arrive
  useEffect(() => {
    if (fetchedEvents.length > 0) {
      setAccumulatedEvents((prev) => {
        // Merge new events, avoiding duplicates by sequence number
        const existingSequences = new Set(prev.map((e) => e.sequence));
        const newEvents = fetchedEvents.filter((e) => !existingSequences.has(e.sequence));

        if (newEvents.length > 0) {
          // Sort by sequence to maintain order
          const merged = [...prev, ...newEvents].sort((a, b) => a.sequence - b.sequence);
          const maxSequence = Math.max(...merged.map((e) => e.sequence));
          lastSequenceRef.current = maxSequence;
          logger.debug('Accumulated events', {
            previousCount: prev.length,
            newCount: newEvents.length,
            totalCount: merged.length,
            maxSequence,
          });
          return merged;
        }
        return prev;
      });
    }
  }, [fetchedEvents]);

  // NOTE: We deliberately do NOT clear events when session changes
  // Events should persist to show historical data for discovered sessions
  // Events are only cleared when starting a NEW session via handleSend

  // Use accumulated events for display
  const agentEvents = accumulatedEvents;

  // Get pending permission
  const { data: pendingPermission } = useAgentPendingPermission(agentSessionId ?? '', {
    enabled: !!agentSessionId,
    refetchInterval: isSessionRunning ? 1000 : false,
  });

  // Get raw output
  const { data: rawOutputData } = useAgentRawOutput(agentSessionId ?? '', {
    enabled: !!agentSessionId,
    refetchInterval: isSessionRunning ? 500 : false,
  });
  const rawOutput = useMemo(() => {
    // Safely handle the case where rawOutputData might be an object, null, or undefined
    const rawOutputString = typeof rawOutputData === 'string' ? rawOutputData : '';
    return rawOutputString ? rawOutputString.split('\n') : [];
  }, [rawOutputData]);

  // Extract session status
  const isRunning = sessionState?.session.status === SessionStatus.Running;
  const isComplete =
    sessionState?.session.status === SessionStatus.Completed ||
    sessionState?.session.status === SessionStatus.Failed;
  const sessionId = sessionState?.session.externalSessionId ?? null;

  // Convert permission to legacy format
  const permissionRequest: PermissionRequest | null = pendingPermission
    ? {
        toolName: pendingPermission.toolName,
        description: pendingPermission.description ?? undefined,
        filePath: pendingPermission.filePath ?? undefined,
      }
    : null;

  // Function to clear accumulated events for new sessions
  const clearEvents = useCallback(() => {
    setAccumulatedEvents([]);
    lastSequenceRef.current = -1;
  }, []);

  // Notify when listeners are ready (session is available)
  useEffect(() => {
    if (agentSessionId && lifecycle.onListenersReady) {
      lifecycle.onListenersReady();
    }
  }, [agentSessionId, lifecycle.onListenersReady]);

  // Log streaming state changes
  useEffect(() => {
    if (isRunning && lifecycle.processState === 'running') {
      logger.debug('Agent process started running', { processId: lifecycle.processId });
    }
  }, [isRunning, lifecycle.processState, lifecycle.processId]);

  useEffect(() => {
    if (isComplete && lifecycle.processId) {
      logger.debug('Agent process completed', {
        processId: lifecycle.processId,
        eventCount: agentEvents.length,
      });
    }
  }, [isComplete, lifecycle.processId, agentEvents.length]);

  // Get selected executor profile
  const selectedExecutorProfileId = chat?.executorProfileId ?? executorProfiles[0]?.id ?? '';

  // Process events for display - memoized to avoid recalculation on every keystroke
  const displayItems = useMemo(() => {
    return processUnifiedEventsToDisplayItems(agentEvents);
  }, [agentEvents]);

  // Save assistant response to database when process completes
  // ONLY for sessions we initiated via handleSend, NOT for discovered sessions
  useEffect(() => {
    if (!isComplete || !chatId || !lifecycle.processId) {
      return;
    }

    // Only persist for sessions WE initiated (via handleSend), not discovered sessions
    // This prevents the clear loop for already-completed historical sessions
    if (initiatedSessionRef.current !== agentSessionId) {
      logger.debug('Skipping persistence for discovered/historical session', {
        chatId,
        processId: lifecycle.processId,
        agentSessionId,
        initiatedSession: initiatedSessionRef.current,
      });
      return;
    }

    if (savedProcessRef.current === lifecycle.processId) {
      return;
    }

    if (lifecycle.processState !== 'running') {
      return;
    }

    lifecycle.markCompleting();

    const { textContent, toolCalls, toolResults } = extractContentFromUnifiedEvents(agentEvents);

    if (textContent || toolCalls.length > 0) {
      savedProcessRef.current = lifecycle.processId;

      const contentToSave = textContent || (toolCalls.length > 0 ? '[Tool execution]' : '');

      logger.debug('Persisting assistant response', {
        chatId,
        processId: lifecycle.processId,
        textLength: textContent.length,
        toolCallCount: toolCalls.length,
        toolResultCount: toolResults.length,
        eventCount: agentEvents.length,
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
            logger.info('Assistant response persisted successfully', { chatId });
            clearEvents();
            initiatedSessionRef.current = null; // Reset after successful persistence
            lifecycle.clearProcess();
          },
          onError: (error) => {
            logger.error('Failed to persist assistant response', {
              chatId,
              error: error instanceof Error ? error.message : String(error),
            });
            toast.error('Failed to Save Response', 'Please try again.');
            initiatedSessionRef.current = null; // Reset on error too
            lifecycle.clearProcess();
          },
        }
      );
    } else {
      logger.debug('No content to persist, clearing process', { chatId });
      clearEvents();
      initiatedSessionRef.current = null; // Reset
      lifecycle.clearProcess();
    }
  }, [
    isComplete,
    chatId,
    lifecycle.processId,
    lifecycle.processState,
    lifecycle.markCompleting,
    lifecycle.clearProcess,
    createMessage,
    clearEvents,
    agentEvents,
    agentSessionId,
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
    const scrollContainer = scrollContainerRef.current;
    if (!scrollContainer) return;

    const isNearBottom =
      scrollContainer.scrollHeight - scrollContainer.scrollTop - scrollContainer.clientHeight < 150;

    if (isNearBottom && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [messages, agentEvents, isRunning]);

  // Track the process ID we initiated to link to session when it appears
  const initiatedProcessIdRef = useRef<string | null>(null);

  // When a new session appears for a process we initiated, mark it as initiated
  useEffect(() => {
    if (
      agentSessionId &&
      initiatedProcessIdRef.current &&
      lifecycle.processId === initiatedProcessIdRef.current
    ) {
      logger.debug('Linking initiated process to session', {
        processId: initiatedProcessIdRef.current,
        agentSessionId,
      });
      initiatedSessionRef.current = agentSessionId;
      initiatedProcessIdRef.current = null; // Clear after linking
    }
  }, [agentSessionId, lifecycle.processId]);

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

    // Clear events from previous session when starting a new one
    clearEvents();

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
      // Mark this process as initiated by us (for persistence tracking)
      initiatedProcessIdRef.current = process.id;
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
    clearEvents,
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
    if (!agentSessionId || !pendingPermission) {
      logger.debug('Approve permission aborted: no session or permission');
      return;
    }

    logger.debug('Approving permission request', {
      sessionId: agentSessionId,
      permissionId: pendingPermission.id,
      permissionType: pendingPermission.toolName,
    });

    respondPermission.mutate(
      {
        sessionId: agentSessionId,
        permissionId: pendingPermission.id,
        approved: true,
      },
      {
        onSuccess: () => {
          logger.info('Permission approved successfully', {
            sessionId: agentSessionId,
            permissionId: pendingPermission.id,
          });
        },
        onError: (error) => {
          logger.error('Failed to approve permission', {
            sessionId: agentSessionId,
            permissionId: pendingPermission.id,
            error: error instanceof Error ? error.message : String(error),
          });
          toast.error('Permission Error', 'Failed to approve permission.');
        },
      }
    );
  }, [agentSessionId, pendingPermission, respondPermission, toast]);

  const handleDenyPermission = useCallback(() => {
    if (!agentSessionId || !pendingPermission) {
      logger.debug('Deny permission aborted: no session or permission');
      return;
    }

    logger.debug('Denying permission request', {
      sessionId: agentSessionId,
      permissionId: pendingPermission.id,
      permissionType: pendingPermission.toolName,
    });

    respondPermission.mutate(
      {
        sessionId: agentSessionId,
        permissionId: pendingPermission.id,
        approved: false,
      },
      {
        onSuccess: () => {
          logger.info('Permission denied successfully', {
            sessionId: agentSessionId,
            permissionId: pendingPermission.id,
          });
        },
        onError: (error) => {
          logger.error('Failed to deny permission', {
            sessionId: agentSessionId,
            permissionId: pendingPermission.id,
            error: error instanceof Error ? error.message : String(error),
          });
          toast.error('Permission Error', 'Failed to deny permission.');
        },
      }
    );
  }, [agentSessionId, pendingPermission, respondPermission, toast]);

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
  const hasContent = messages.length > 0 || agentEvents.length > 0;

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
