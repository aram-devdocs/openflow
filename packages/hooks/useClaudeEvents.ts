import type { ProcessStatus, ProcessStatusEvent } from '@openflow/generated';
import { type ProcessOutputEvent, checkTauriContext, getTransport } from '@openflow/queries';
import { createLogger } from '@openflow/utils';
import { type UnlistenFn, listen } from '@tauri-apps/api/event';
import { useCallback, useEffect, useRef, useState } from 'react';

// Create logger for this hook
const logger = createLogger('useClaudeEvents');

/**
 * Claude Code stream-json event types.
 * These mirror the Rust ClaudeEvent types from executor.rs.
 */
export type ClaudeEvent =
  | ClaudeSystemEvent
  | ClaudeAssistantEvent
  | ClaudeUserEvent
  | ClaudeResultEvent;

export interface ClaudeSystemEvent {
  type: 'system';
  subtype: string;
  /** Session ID from Claude Code (present in "init" subtype events) */
  session_id?: string;
  data?: Record<string, unknown>;
}

/** Content block in an assistant message */
export interface AssistantContentBlock {
  type: 'text' | 'tool_use';
  text?: string;
  id?: string;
  name?: string;
  input?: Record<string, unknown>;
}

/** Content block in a user message (tool results) */
export interface UserContentBlock {
  type: 'tool_result';
  tool_use_id: string;
  content: string;
  is_error?: boolean;
}

export interface ClaudeAssistantEvent {
  type: 'assistant';
  message: {
    content?: AssistantContentBlock[];
  };
}

export interface ClaudeUserEvent {
  type: 'user';
  message: {
    content?: UserContentBlock[];
  };
}

export interface ClaudeResultEvent {
  type: 'result';
  subtype: string;
  data?: Record<string, unknown>;
}

/** Permission request from Claude Code */
export interface PermissionRequest {
  processId: string;
  toolName: string;
  filePath?: string;
  description: string;
}

/**
 * Options for the useClaudeEvents hook.
 */
export interface UseClaudeEventsOptions {
  /**
   * Callback fired when event listeners are fully attached and ready.
   * Use this with useProcessLifecycle to coordinate process startup.
   */
  onListenersReady?: () => void;
}

/**
 * State returned by the useClaudeEvents hook.
 */
export interface ClaudeEventsState {
  /** Array of Claude events received from the process */
  events: ClaudeEvent[];
  /** Raw output lines that couldn't be parsed as ClaudeEvent */
  rawOutput: string[];
  /** Current permission request awaiting user response (if any) */
  permissionRequest: PermissionRequest | null;
  /** Current process status */
  status: ProcessStatus | null;
  /** Process exit code when completed */
  exitCode: number | null;
  /** Claude Code session ID for resuming conversations */
  sessionId: string | null;
  /** Whether the process is currently running */
  isRunning: boolean;
  /** Whether the process has completed */
  isComplete: boolean;
  /** Whether event listeners are attached and ready */
  listenersReady: boolean;
  /** Clear all accumulated events and output */
  clearEvents: () => void;
  /** Clear the current permission request (after user responds) */
  clearPermissionRequest: () => void;
}

// =============================================================================
// ANSI Code Stripping
// =============================================================================

/**
 * Regex pattern for ANSI escape sequences.
 * Matches: CSI sequences, OSC sequences, and other escape sequences.
 */
const ANSI_REGEX = new RegExp(
  [
    '\\x1b\\[[0-9;]*[A-Za-z]', // CSI sequences (colors, cursor, etc.)
    '\\x1b\\][^\\x07]*\\x07', // OSC sequences (terminated by BEL)
    '\\x1b[PX^_][^\\x1b]*\\x1b\\\\', // DCS/SOS/PM/APC sequences
    '\\x1b[\\[\\]()#;?]*[0-9;]*[A-Za-z]', // Other escape sequences
    '\\x1b.', // Simple escape sequences
    '[\\x00-\\x08\\x0b\\x0c\\x0e-\\x1f]', // Control characters (except newline, tab, CR)
  ].join('|'),
  'g'
);

/**
 * Strip ANSI escape codes and control characters from a string.
 */
function stripAnsiCodes(s: string): string {
  return s.replace(ANSI_REGEX, '');
}

// =============================================================================
// Claude Event Parsing
// =============================================================================

// NOTE: parseClaudeEvent is no longer needed as server now parses Claude events
// and broadcasts them on the claude-event-{processId} channel

/**
 * Extract tool name from permission prompt.
 */
function extractToolName(prompt: string): string {
  // Common patterns: "Allow Claude to write", "Allow Claude to read", "Allow Claude to execute"
  if (prompt.includes('write') || prompt.includes('Write')) {
    return 'Write';
  }
  if (prompt.includes('read') || prompt.includes('Read')) {
    return 'Read';
  }
  if (
    prompt.includes('execute') ||
    prompt.includes('Execute') ||
    prompt.includes('bash') ||
    prompt.includes('Bash')
  ) {
    return 'Bash';
  }
  return 'Tool';
}

/**
 * Extract file path from permission prompt.
 */
function extractFilePath(prompt: string): string | undefined {
  // Look for path-like strings (starting with / or containing common path patterns)
  for (const word of prompt.split(/\s+/)) {
    const cleaned = word.replace(/[?"'`]/g, '');
    if (cleaned.startsWith('/') || cleaned.includes(':\\')) {
      return cleaned;
    }
  }
  return undefined;
}

/**
 * Check if a line is a permission prompt.
 */
function isPermissionPrompt(line: string): boolean {
  return line.includes('Allow') && (line.includes('(y/n)') || line.includes('? [y/n]'));
}

// =============================================================================
// Event Type Description
// =============================================================================

/**
 * Get a human-readable description of the event type for logging
 */
function getEventTypeDescription(event: ClaudeEvent): string {
  switch (event.type) {
    case 'system':
      return `system:${event.subtype}`;
    case 'assistant': {
      const contentTypes = event.message.content?.map((c) => c.type).join(', ') || 'empty';
      // Debug: Log full assistant event content to understand structure
      // eslint-disable-next-line no-console
      console.log(
        '[useClaudeEvents] Assistant event content:',
        JSON.stringify(event.message.content, null, 2)
      );
      return `assistant (${contentTypes})`;
    }
    case 'user': {
      const contentTypes = event.message.content?.map((c) => c.type).join(', ') || 'empty';
      // Debug: Log user event content to see tool_result structure
      // eslint-disable-next-line no-console
      console.log(
        '[useClaudeEvents] User event content:',
        JSON.stringify(event.message.content, null, 2)
      );
      return `user (${contentTypes})`;
    }
    case 'result':
      return `result:${event.subtype}`;
    default:
      // Debug: Log unknown event types to understand what we're receiving
      // eslint-disable-next-line no-console
      console.warn(
        '[useClaudeEvents] Unknown event type received:',
        JSON.stringify(event, null, 2)
      );
      return `unknown:${(event as { type?: string }).type || 'no-type'}`;
  }
}

// =============================================================================
// Tauri Mode Subscriptions
// =============================================================================

interface TauriModeCallbacks {
  onEvent: (event: ClaudeEvent) => void;
  onRawOutput: (line: string) => void;
  onStatus: (status: ProcessStatus, exitCode?: number | null) => void;
  onPermissionRequest: (request: PermissionRequest) => void;
  onSessionId: (sessionId: string) => void;
  isMounted: () => boolean;
}

/**
 * Set up event listeners for Tauri mode.
 * Returns a cleanup function.
 */
async function setupTauriModeListeners(
  processId: string,
  callbacks: TauriModeCallbacks
): Promise<() => void> {
  const unlistenFns: UnlistenFn[] = [];

  // Subscribe to Claude events
  try {
    const unlisten = await listen<ClaudeEvent>(`claude-event-${processId}`, (event) => {
      if (!callbacks.isMounted()) return;
      callbacks.onEvent(event.payload);
    });
    unlistenFns.push(unlisten);
    logger.debug('Tauri: Claude event listener established', { processId });
  } catch (error) {
    logger.error('Tauri: Failed to subscribe to Claude events', {
      processId,
      error: error instanceof Error ? error.message : String(error),
    });
  }

  // Subscribe to raw output
  try {
    const unlisten = await listen<string>(`raw-output-${processId}`, (event) => {
      if (!callbacks.isMounted()) return;
      callbacks.onRawOutput(event.payload);
    });
    unlistenFns.push(unlisten);
    logger.debug('Tauri: Raw output listener established', { processId });
  } catch (error) {
    logger.error('Tauri: Failed to subscribe to raw output', {
      processId,
      error: error instanceof Error ? error.message : String(error),
    });
  }

  // Subscribe to process status
  try {
    const unlisten = await listen<ProcessStatusEvent>(`process-status-${processId}`, (event) => {
      if (!callbacks.isMounted()) return;
      const { status, exitCode } = event.payload;
      callbacks.onStatus(status, exitCode);
    });
    unlistenFns.push(unlisten);
    logger.debug('Tauri: Process status listener established', { processId });
  } catch (error) {
    logger.error('Tauri: Failed to subscribe to process status', {
      processId,
      error: error instanceof Error ? error.message : String(error),
    });
  }

  // Subscribe to permission requests
  try {
    interface RustPermissionRequest {
      process_id: string;
      tool_name: string;
      file_path?: string;
      description: string;
    }
    const unlisten = await listen<RustPermissionRequest>(
      `permission-request-${processId}`,
      (event) => {
        if (!callbacks.isMounted()) return;
        const { process_id, tool_name, file_path, description } = event.payload;
        callbacks.onPermissionRequest({
          processId: process_id,
          toolName: tool_name,
          filePath: file_path,
          description,
        });
      }
    );
    unlistenFns.push(unlisten);
    logger.debug('Tauri: Permission request listener established', { processId });
  } catch (error) {
    logger.error('Tauri: Failed to subscribe to permission requests', {
      processId,
      error: error instanceof Error ? error.message : String(error),
    });
  }

  // Subscribe to session ID
  try {
    const unlisten = await listen<string>(`session-id-${processId}`, (event) => {
      if (!callbacks.isMounted()) return;
      callbacks.onSessionId(event.payload);
    });
    unlistenFns.push(unlisten);
    logger.debug('Tauri: Session ID listener established', { processId });
  } catch (error) {
    logger.error('Tauri: Failed to subscribe to session ID', {
      processId,
      error: error instanceof Error ? error.message : String(error),
    });
  }

  return () => {
    for (const unlisten of unlistenFns) {
      unlisten();
    }
  };
}

// =============================================================================
// HTTP Mode Subscriptions
// =============================================================================

interface HttpModeCallbacks {
  onEvent: (event: ClaudeEvent) => void;
  onRawOutput: (line: string) => void;
  onStatus: (status: ProcessStatus, exitCode?: number | null) => void;
  onPermissionRequest: (request: PermissionRequest) => void;
  onSessionId: (sessionId: string) => void;
  isMounted: () => boolean;
}

/** Contract types for server-parsed events */
interface ClaudeEventData {
  processId: string;
  event: unknown;
  timestamp: string;
}

/**
 * Set up event listeners for HTTP mode.
 * In HTTP mode, we subscribe to:
 * - claude-event-{processId}: Pre-parsed Claude events from server
 * - process-output-{processId}: Raw output for terminal display
 * - process-status-{processId}: Process status changes
 * Returns a cleanup function.
 */
async function setupHttpModeListeners(
  processId: string,
  callbacks: HttpModeCallbacks
): Promise<() => void> {
  const unsubscribeFns: Array<() => void> = [];

  try {
    const transport = await getTransport();

    // Subscribe to pre-parsed Claude events (server parses JSON now)
    const claudeEventChannel = `claude-event-${processId}`;
    logger.debug('HTTP: Subscribing to Claude events', { channel: claudeEventChannel });

    const unsubClaudeEvents = transport.subscribe(claudeEventChannel, (event: unknown) => {
      if (!callbacks.isMounted()) return;

      const claudeEventData = event as ClaudeEventData;
      const claudeEvent = claudeEventData.event as ClaudeEvent;

      logger.debug('HTTP: Claude event received', {
        processId,
        eventType: claudeEvent?.type,
      });

      // Extract session ID from system "init" events
      if (claudeEvent?.type === 'system') {
        const systemEvent = claudeEvent as ClaudeSystemEvent;
        if (systemEvent.subtype === 'init' && systemEvent.session_id) {
          logger.info('HTTP: Session ID extracted', {
            processId,
            sessionId: systemEvent.session_id,
          });
          callbacks.onSessionId(systemEvent.session_id);
        }
      }

      if (claudeEvent) {
        callbacks.onEvent(claudeEvent);
      }
    });
    unsubscribeFns.push(unsubClaudeEvents);
    logger.info('HTTP: Subscribed to Claude events', { channel: claudeEventChannel });

    // Subscribe to raw process output (for terminal display and permission prompts)
    const outputChannel = `process-output-${processId}`;
    logger.debug('HTTP: Subscribing to process output', { channel: outputChannel });

    const unsubOutput = transport.subscribe(outputChannel, (event: unknown) => {
      if (!callbacks.isMounted()) return;

      const outputEvent = event as ProcessOutputEvent;
      const content = outputEvent.content || '';

      logger.debug('HTTP: Process output received', {
        processId,
        contentLength: content.length,
        outputType: outputEvent.outputType,
      });

      // Check each line for permission prompts
      const lines = content.split('\n');
      for (const line of lines) {
        if (!line.trim()) continue;

        const cleanLine = stripAnsiCodes(line);
        const trimmed = cleanLine.trim();

        if (!trimmed) continue;

        // Check for permission prompts
        if (isPermissionPrompt(trimmed)) {
          logger.info('HTTP: Permission prompt detected', {
            processId,
            description: trimmed.substring(0, 100),
          });
          callbacks.onPermissionRequest({
            processId,
            toolName: extractToolName(trimmed),
            filePath: extractFilePath(trimmed),
            description: trimmed,
          });
        }
      }

      // Pass raw output for terminal display
      callbacks.onRawOutput(content);
    });
    unsubscribeFns.push(unsubOutput);
    logger.info('HTTP: Subscribed to process output', { channel: outputChannel });

    // Subscribe to process status
    const statusChannel = `process-status-${processId}`;
    logger.debug('HTTP: Subscribing to process status', { channel: statusChannel });

    const unsubStatus = transport.subscribe(statusChannel, (event: unknown) => {
      if (!callbacks.isMounted()) return;

      const statusEvent = event as ProcessStatusEvent;
      logger.info('HTTP: Process status received', {
        processId,
        status: statusEvent.status,
        exitCode: statusEvent.exitCode,
      });

      callbacks.onStatus(statusEvent.status, statusEvent.exitCode);
    });
    unsubscribeFns.push(unsubStatus);
    logger.info('HTTP: Subscribed to process status', { channel: statusChannel });
  } catch (error) {
    logger.error('HTTP: Failed to set up listeners', {
      processId,
      error: error instanceof Error ? error.message : String(error),
    });
  }

  return () => {
    logger.debug('HTTP: Cleaning up subscriptions', { processId });
    for (const unsub of unsubscribeFns) {
      unsub();
    }
  };
}

// =============================================================================
// Main Hook
// =============================================================================

/**
 * Hook to subscribe to Claude Code stream-json events.
 *
 * This hook automatically detects the context (Tauri vs HTTP) and subscribes
 * to the appropriate event channels:
 *
 * **Tauri Mode (Desktop App):**
 * - `claude-event-{processId}`: Receives typed ClaudeEvent objects
 * - `raw-output-{processId}`: Receives unparsed output lines
 * - `process-status-{processId}`: Receives process status changes
 * - `permission-request-{processId}`: Receives permission prompts
 * - `session-id-{processId}`: Receives session ID
 *
 * **HTTP Mode (Browser):**
 * - `process-output-{processId}`: Receives raw output via WebSocket
 * - `process-status-{processId}`: Receives process status via WebSocket
 * - Claude events are parsed on the client side from the raw output
 *
 * @param processId - The ID of the process to subscribe to (null to skip)
 * @returns ClaudeEventsState with events, status, and utilities
 *
 * @example
 * ```tsx
 * function ChatOutput({ processId }: { processId: string }) {
 *   const { events, isRunning, isComplete } = useClaudeEvents(processId);
 *
 *   return (
 *     <div>
 *       {events.map((event, i) => (
 *         <ClaudeEventRenderer key={i} event={event} />
 *       ))}
 *       {isRunning && <StreamingIndicator />}
 *       {isComplete && <div>Done!</div>}
 *     </div>
 *   );
 * }
 * ```
 */
export function useClaudeEvents(
  processId: string | null,
  options?: UseClaudeEventsOptions
): ClaudeEventsState {
  const [events, setEvents] = useState<ClaudeEvent[]>([]);
  const [rawOutput, setRawOutput] = useState<string[]>([]);
  const [permissionRequest, setPermissionRequest] = useState<PermissionRequest | null>(null);
  const [status, setStatus] = useState<ProcessStatus | null>(null);
  const [exitCode, setExitCode] = useState<number | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [listenersReady, setListenersReady] = useState(false);

  // Use ref to track if we're still mounted
  const mountedRef = useRef(true);

  // Track event count for logging
  const eventCountRef = useRef(0);

  // Track if we're in Tauri context (stable reference)
  const isTauriRef = useRef(checkTauriContext());

  // Track previous processId to determine if we're starting a new process
  // We only want to clear events when transitioning to a NEW process,
  // not when processId becomes null (process completed)
  const prevProcessIdRef = useRef<string | null>(null);

  // Store callback in ref to avoid re-running effect when callback changes
  const onListenersReadyRef = useRef(options?.onListenersReady);
  onListenersReadyRef.current = options?.onListenersReady;

  // Buffer for events that arrive before listeners are fully setup
  const earlyEventBufferRef = useRef<ClaudeEvent[]>([]);
  const earlyRawOutputBufferRef = useRef<string[]>([]);
  const isSetupCompleteRef = useRef(false);

  // PERFORMANCE: Batching refs to reduce re-renders during streaming
  // Instead of updating state on every event, accumulate in refs and flush periodically
  const pendingEventsRef = useRef<ClaudeEvent[]>([]);
  const pendingRawOutputRef = useRef<string[]>([]);
  const flushTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const FLUSH_INTERVAL_MS = 50; // Flush at most every 50ms

  // Flush pending updates to state (batched)
  const flushPendingUpdates = useCallback(() => {
    if (!mountedRef.current) return;

    const pendingEvents = pendingEventsRef.current;
    const pendingRawOutput = pendingRawOutputRef.current;

    if (pendingEvents.length > 0) {
      setEvents((prev) => [...prev, ...pendingEvents]);
      pendingEventsRef.current = [];
    }

    if (pendingRawOutput.length > 0) {
      setRawOutput((prev) => [...prev, ...pendingRawOutput]);
      pendingRawOutputRef.current = [];
    }

    flushTimeoutRef.current = null;
  }, []);

  // Schedule a flush if not already scheduled
  const scheduleFlush = useCallback(() => {
    if (flushTimeoutRef.current === null) {
      flushTimeoutRef.current = setTimeout(flushPendingUpdates, FLUSH_INTERVAL_MS);
    }
  }, [flushPendingUpdates]);

  // Log hook initialization

  // Clear events handler
  const clearEvents = useCallback(() => {
    logger.debug('Clearing events and raw output', {
      eventCount: eventCountRef.current,
    });
    // Clear any pending flush
    if (flushTimeoutRef.current) {
      clearTimeout(flushTimeoutRef.current);
      flushTimeoutRef.current = null;
    }
    // Clear pending refs
    pendingEventsRef.current = [];
    pendingRawOutputRef.current = [];
    // Clear state
    setEvents([]);
    setRawOutput([]);
    eventCountRef.current = 0;
  }, []);

  // Clear permission request handler
  const clearPermissionRequest = useCallback(() => {
    logger.debug('Clearing permission request');
    setPermissionRequest(null);
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    eventCountRef.current = 0;
    isSetupCompleteRef.current = false;
    earlyEventBufferRef.current = [];
    earlyRawOutputBufferRef.current = [];
    let cleanup: (() => void) | null = null;

    // Skip if no process ID - but DON'T clear events
    // Events should persist until a NEW process starts
    if (!processId) {
      logger.debug('No process ID provided, skipping subscription');
      setListenersReady(false);
      prevProcessIdRef.current = null;
      return;
    }

    const isTauri = isTauriRef.current;
    logger.info('Subscribing to Claude events', { processId, mode: isTauri ? 'tauri' : 'http' });

    // Only reset state when starting a NEW process (different from previous)
    // This preserves events for display when process completes (processId becomes null)
    const previousProcessId = prevProcessIdRef.current;
    const isNewProcess = processId !== previousProcessId;
    prevProcessIdRef.current = processId;

    if (isNewProcess) {
      logger.debug('New process detected, clearing previous state', {
        previousProcessId,
        newProcessId: processId,
      });
      setEvents([]);
      setRawOutput([]);
      setPermissionRequest(null);
      setStatus(null);
      setExitCode(null);
      setSessionId(null);
    }
    setListenersReady(false);

    // Common callbacks for both modes
    // IMPORTANT: These callbacks buffer events until setup is complete
    const callbacks = {
      onEvent: (event: ClaudeEvent) => {
        eventCountRef.current += 1;
        const eventType = getEventTypeDescription(event);

        // Log at debug level for most events, info for important ones
        if (event.type === 'system' && event.subtype === 'init') {
          logger.info('Claude session initialized', {
            processId,
            sessionId: event.session_id,
          });
          // Also set session ID from the event
          if (event.session_id) {
            setSessionId(event.session_id);
          }
        } else if (event.type === 'result') {
          logger.info('Claude result received', {
            processId,
            subtype: event.subtype,
            totalEvents: eventCountRef.current,
          });
        } else {
          logger.debug('Claude event received', {
            processId,
            eventType,
            eventIndex: eventCountRef.current,
          });
        }

        // If setup is not complete, buffer the event to prevent loss
        if (!isSetupCompleteRef.current) {
          logger.debug('Buffering early event', { processId, eventType });
          earlyEventBufferRef.current.push(event);
          return;
        }

        // PERFORMANCE: Batch event updates instead of updating state on every event
        pendingEventsRef.current.push(event);
        scheduleFlush();
      },
      onRawOutput: (line: string) => {
        logger.debug('Raw output received', {
          processId,
          length: line.length,
        });

        // If setup is not complete, buffer the output to prevent loss
        if (!isSetupCompleteRef.current) {
          earlyRawOutputBufferRef.current.push(line);
          return;
        }

        // PERFORMANCE: Batch raw output updates instead of updating state on every line
        pendingRawOutputRef.current.push(line);
        scheduleFlush();
      },
      onStatus: (newStatus: ProcessStatus, newExitCode?: number | null) => {
        logger.info('Process status changed', {
          processId,
          newStatus,
          exitCode: newExitCode,
          totalEvents: eventCountRef.current,
        });

        setStatus(newStatus);
        if (newExitCode !== undefined && newExitCode !== null) {
          setExitCode(newExitCode);

          // Log completion with exit code
          if (newStatus === 'completed' || newStatus === 'failed' || newStatus === 'killed') {
            const logFn =
              newStatus === 'completed' && newExitCode === 0 ? logger.info : logger.warn;
            logFn('Process finished', {
              processId,
              status: newStatus,
              exitCode: newExitCode,
              totalEvents: eventCountRef.current,
            });
          }
        }
      },
      onPermissionRequest: (request: PermissionRequest) => {
        logger.info('Permission request received', {
          processId: request.processId,
          toolName: request.toolName,
          filePath: request.filePath,
          descriptionLength: request.description.length,
        });
        setPermissionRequest(request);
      },
      onSessionId: (sid: string) => {
        logger.info('Session ID received', {
          processId,
          sessionId: sid,
        });
        setSessionId(sid);
      },
      isMounted: () => mountedRef.current,
    };

    // Set up listeners and notify when ready
    // CRITICAL: We properly await this and flush buffered events after
    const setupAndNotify = async () => {
      try {
        if (isTauri) {
          cleanup = await setupTauriModeListeners(processId, callbacks);
        } else {
          cleanup = await setupHttpModeListeners(processId, callbacks);
        }

        // Check if still mounted after async operation
        if (!mountedRef.current) {
          logger.debug('Component unmounted during setup', { processId });
          return;
        }

        // Mark setup as complete
        isSetupCompleteRef.current = true;

        // Flush any events that arrived during setup
        const bufferedEvents = earlyEventBufferRef.current;
        const bufferedRawOutput = earlyRawOutputBufferRef.current;

        if (bufferedEvents.length > 0 || bufferedRawOutput.length > 0) {
          logger.info('Flushing buffered events from setup phase', {
            processId,
            bufferedEventCount: bufferedEvents.length,
            bufferedRawOutputCount: bufferedRawOutput.length,
          });

          // Add to pending refs and flush
          pendingEventsRef.current.push(...bufferedEvents);
          pendingRawOutputRef.current.push(...bufferedRawOutput);
          earlyEventBufferRef.current = [];
          earlyRawOutputBufferRef.current = [];
          scheduleFlush();
        }

        // Signal that listeners are ready
        logger.info('Event listeners ready', { processId });
        setListenersReady(true);
        onListenersReadyRef.current?.();
      } catch (error) {
        logger.error('Failed to setup event listeners', {
          processId,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    };

    // Start async setup
    setupAndNotify();

    // Cleanup on unmount or processId change
    return () => {
      logger.debug('Cleaning up event listeners', {
        processId,
        totalEventsReceived: eventCountRef.current,
      });
      mountedRef.current = false;
      isSetupCompleteRef.current = false;
      setListenersReady(false);

      // Clear flush timeout
      if (flushTimeoutRef.current) {
        clearTimeout(flushTimeoutRef.current);
        flushTimeoutRef.current = null;
      }

      // Flush any pending updates before cleanup
      if (pendingEventsRef.current.length > 0 || pendingRawOutputRef.current.length > 0) {
        // Do a final synchronous flush for any pending data
        const pendingEvents = pendingEventsRef.current;
        const pendingRawOutput = pendingRawOutputRef.current;

        if (pendingEvents.length > 0) {
          setEvents((prev) => [...prev, ...pendingEvents]);
          pendingEventsRef.current = [];
        }

        if (pendingRawOutput.length > 0) {
          setRawOutput((prev) => [...prev, ...pendingRawOutput]);
          pendingRawOutputRef.current = [];
        }
      }

      // Clear early event buffers
      earlyEventBufferRef.current = [];
      earlyRawOutputBufferRef.current = [];

      if (cleanup) {
        cleanup();
      }
    };
  }, [processId, scheduleFlush]);

  // Determine if process is running
  const isRunning = status === 'running' || (status === null && processId !== null);

  // Determine if process has completed
  const isComplete = status === 'completed' || status === 'failed' || status === 'killed';

  return {
    events,
    rawOutput,
    permissionRequest,
    status,
    exitCode,
    sessionId,
    isRunning,
    isComplete,
    listenersReady,
    clearEvents,
    clearPermissionRequest,
  };
}
