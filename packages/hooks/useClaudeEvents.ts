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

/**
 * Try to parse a line as a Claude event.
 * Returns the parsed event or null if parsing fails.
 */
function parseClaudeEvent(line: string): ClaudeEvent | null {
  const trimmed = line.trim();
  if (!trimmed || !trimmed.startsWith('{')) {
    return null;
  }

  try {
    const parsed = JSON.parse(trimmed);
    // Validate it has a type field
    if (typeof parsed.type === 'string') {
      return parsed as ClaudeEvent;
    }
    return null;
  } catch {
    return null;
  }
}

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
      return `assistant (${contentTypes})`;
    }
    case 'user': {
      const contentTypes = event.message.content?.map((c) => c.type).join(', ') || 'empty';
      return `user (${contentTypes})`;
    }
    case 'result':
      return `result:${event.subtype}`;
    default:
      return 'unknown';
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

/**
 * Set up event listeners for HTTP mode.
 * In HTTP mode, we subscribe to process-output and process-status events via WebSocket,
 * then parse the raw output on the client side to extract Claude events.
 * Returns a cleanup function.
 */
async function setupHttpModeListeners(
  processId: string,
  callbacks: HttpModeCallbacks
): Promise<() => void> {
  const unsubscribeFns: Array<() => void> = [];

  try {
    const transport = await getTransport();

    // Subscribe to process output
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

      // Process each line in the output
      const lines = content.split('\n');
      for (const line of lines) {
        if (!line.trim()) continue;

        // Strip ANSI codes
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
          continue;
        }

        // Try to parse as Claude event
        const claudeEvent = parseClaudeEvent(trimmed);
        if (claudeEvent) {
          logger.debug('HTTP: Claude event parsed', {
            processId,
            eventType: getEventTypeDescription(claudeEvent),
          });

          // Extract session ID from system "init" events
          if (
            claudeEvent.type === 'system' &&
            claudeEvent.subtype === 'init' &&
            claudeEvent.session_id
          ) {
            logger.info('HTTP: Session ID extracted', {
              processId,
              sessionId: claudeEvent.session_id,
            });
            callbacks.onSessionId(claudeEvent.session_id);
          }

          callbacks.onEvent(claudeEvent);
        } else {
          // Raw output that couldn't be parsed
          callbacks.onRawOutput(trimmed);
        }
      }
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
export function useClaudeEvents(processId: string | null): ClaudeEventsState {
  const [events, setEvents] = useState<ClaudeEvent[]>([]);
  const [rawOutput, setRawOutput] = useState<string[]>([]);
  const [permissionRequest, setPermissionRequest] = useState<PermissionRequest | null>(null);
  const [status, setStatus] = useState<ProcessStatus | null>(null);
  const [exitCode, setExitCode] = useState<number | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);

  // Use ref to track if we're still mounted
  const mountedRef = useRef(true);

  // Track event count for logging
  const eventCountRef = useRef(0);

  // Track if we're in Tauri context (stable reference)
  const isTauriRef = useRef(checkTauriContext());

  // Log hook initialization
  logger.debug('Hook initialized', { processId, isTauri: isTauriRef.current });

  // Clear events handler
  const clearEvents = useCallback(() => {
    logger.debug('Clearing events and raw output', {
      eventCount: eventCountRef.current,
    });
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
    let cleanup: (() => void) | null = null;

    // Skip if no process ID
    if (!processId) {
      logger.debug('No process ID provided, skipping subscription');
      return;
    }

    const isTauri = isTauriRef.current;
    logger.info('Subscribing to Claude events', { processId, mode: isTauri ? 'tauri' : 'http' });

    // Reset state when processId changes
    setEvents([]);
    setRawOutput([]);
    setPermissionRequest(null);
    setStatus(null);
    setExitCode(null);
    setSessionId(null);

    // Common callbacks for both modes
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

        setEvents((prev) => [...prev, event]);
      },
      onRawOutput: (line: string) => {
        logger.debug('Raw output received', {
          processId,
          length: line.length,
        });
        setRawOutput((prev) => [...prev, line]);
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

    // Set up listeners based on context
    const setupListeners = async () => {
      if (isTauri) {
        cleanup = await setupTauriModeListeners(processId, callbacks);
      } else {
        cleanup = await setupHttpModeListeners(processId, callbacks);
      }
    };

    setupListeners();

    // Cleanup on unmount or processId change
    return () => {
      logger.debug('Cleaning up event listeners', {
        processId,
        totalEventsReceived: eventCountRef.current,
      });
      mountedRef.current = false;
      if (cleanup) {
        cleanup();
      }
    };
  }, [processId]);

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
    clearEvents,
    clearPermissionRequest,
  };
}
