import type { ProcessStatus, ProcessStatusEvent } from '@openflow/generated';
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

/**
 * Hook to subscribe to Claude Code stream-json events via Tauri events.
 *
 * This hook listens to three event channels:
 * - `claude-event-{processId}`: Receives typed ClaudeEvent objects
 * - `raw-output-{processId}`: Receives unparsed output lines
 * - `process-status-{processId}`: Receives process status changes
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

  // Log hook initialization
  logger.debug('Hook initialized', { processId });

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
    const unlistenFns: UnlistenFn[] = [];

    // Skip if no process ID
    if (!processId) {
      logger.debug('No process ID provided, skipping subscription');
      return;
    }

    logger.info('Subscribing to Claude events', { processId });

    // Reset state when processId changes
    setEvents([]);
    setRawOutput([]);
    setPermissionRequest(null);
    setStatus(null);
    setExitCode(null);
    setSessionId(null);

    // Subscribe to Claude events
    const setupClaudeEventListener = async () => {
      try {
        logger.debug('Setting up Claude event listener', {
          channel: `claude-event-${processId}`,
        });
        const unlisten = await listen<ClaudeEvent>(`claude-event-${processId}`, (event) => {
          if (!mountedRef.current) return;

          eventCountRef.current += 1;
          const eventType = getEventTypeDescription(event.payload);

          // Log at debug level for most events, info for important ones
          if (event.payload.type === 'system' && event.payload.subtype === 'init') {
            logger.info('Claude session initialized', {
              processId,
              sessionId: event.payload.session_id,
            });
          } else if (event.payload.type === 'result') {
            logger.info('Claude result received', {
              processId,
              subtype: event.payload.subtype,
              totalEvents: eventCountRef.current,
            });
          } else {
            logger.debug('Claude event received', {
              processId,
              eventType,
              eventIndex: eventCountRef.current,
            });
          }

          setEvents((prev) => [...prev, event.payload]);
        });
        unlistenFns.push(unlisten);
        logger.debug('Claude event listener established', { processId });
      } catch (error) {
        logger.error('Failed to subscribe to Claude events', {
          processId,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    };

    // Subscribe to raw output (unparsed lines)
    const setupRawOutputListener = async () => {
      try {
        logger.debug('Setting up raw output listener', {
          channel: `raw-output-${processId}`,
        });
        const unlisten = await listen<string>(`raw-output-${processId}`, (event) => {
          if (!mountedRef.current) return;

          logger.debug('Raw output received', {
            processId,
            length: event.payload.length,
          });

          setRawOutput((prev) => [...prev, event.payload]);
        });
        unlistenFns.push(unlisten);
        logger.debug('Raw output listener established', { processId });
      } catch (error) {
        logger.error('Failed to subscribe to raw output', {
          processId,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    };

    // Subscribe to process status events
    const setupStatusListener = async () => {
      try {
        logger.debug('Setting up process status listener', {
          channel: `process-status-${processId}`,
        });
        const unlisten = await listen<ProcessStatusEvent>(
          `process-status-${processId}`,
          (event) => {
            if (!mountedRef.current) return;

            const { status: newStatus, exitCode: newExitCode } = event.payload;

            // Log status changes at info level
            logger.info('Process status changed', {
              processId,
              previousStatus: status,
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
          }
        );
        unlistenFns.push(unlisten);
        logger.debug('Process status listener established', { processId });
      } catch (error) {
        logger.error('Failed to subscribe to process status', {
          processId,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    };

    // Subscribe to permission request events
    const setupPermissionListener = async () => {
      try {
        logger.debug('Setting up permission request listener', {
          channel: `permission-request-${processId}`,
        });
        // The Rust backend sends snake_case, so we map to camelCase
        interface RustPermissionRequest {
          process_id: string;
          tool_name: string;
          file_path?: string;
          description: string;
        }
        const unlisten = await listen<RustPermissionRequest>(
          `permission-request-${processId}`,
          (event) => {
            if (!mountedRef.current) return;

            const { process_id, tool_name, file_path, description } = event.payload;

            // Permission requests are important, log at info level
            logger.info('Permission request received', {
              processId: process_id,
              toolName: tool_name,
              filePath: file_path,
              descriptionLength: description.length,
            });

            setPermissionRequest({
              processId: process_id,
              toolName: tool_name,
              filePath: file_path,
              description,
            });
          }
        );
        unlistenFns.push(unlisten);
        logger.debug('Permission request listener established', { processId });
      } catch (error) {
        logger.error('Failed to subscribe to permission requests', {
          processId,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    };

    // Subscribe to session ID events (emitted on "init" system events)
    const setupSessionIdListener = async () => {
      try {
        logger.debug('Setting up session ID listener', {
          channel: `session-id-${processId}`,
        });
        const unlisten = await listen<string>(`session-id-${processId}`, (event) => {
          if (!mountedRef.current) return;

          logger.info('Session ID received', {
            processId,
            sessionId: event.payload,
          });

          setSessionId(event.payload);
        });
        unlistenFns.push(unlisten);
        logger.debug('Session ID listener established', { processId });
      } catch (error) {
        logger.error('Failed to subscribe to session ID', {
          processId,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    };

    // Set up all listeners
    setupClaudeEventListener();
    setupRawOutputListener();
    setupStatusListener();
    setupPermissionListener();
    setupSessionIdListener();

    // Cleanup on unmount or processId change
    return () => {
      logger.debug('Cleaning up event listeners', {
        processId,
        totalEventsReceived: eventCountRef.current,
      });
      mountedRef.current = false;
      for (const unlisten of unlistenFns) {
        unlisten();
      }
    };
  }, [processId, status]);

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
