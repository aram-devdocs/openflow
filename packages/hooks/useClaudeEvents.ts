import type { ProcessStatus, ProcessStatusEvent } from '@openflow/generated';
import { type UnlistenFn, listen } from '@tauri-apps/api/event';
import { useCallback, useEffect, useRef, useState } from 'react';

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

  // Clear events handler
  const clearEvents = useCallback(() => {
    setEvents([]);
    setRawOutput([]);
  }, []);

  // Clear permission request handler
  const clearPermissionRequest = useCallback(() => {
    setPermissionRequest(null);
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    const unlistenFns: UnlistenFn[] = [];

    // Skip if no process ID
    if (!processId) {
      return;
    }

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
        const unlisten = await listen<ClaudeEvent>(`claude-event-${processId}`, (event) => {
          if (!mountedRef.current) return;
          setEvents((prev) => [...prev, event.payload]);
        });
        unlistenFns.push(unlisten);
      } catch (error) {
        console.error('Failed to subscribe to Claude events:', error);
      }
    };

    // Subscribe to raw output (unparsed lines)
    const setupRawOutputListener = async () => {
      try {
        const unlisten = await listen<string>(`raw-output-${processId}`, (event) => {
          if (!mountedRef.current) return;
          setRawOutput((prev) => [...prev, event.payload]);
        });
        unlistenFns.push(unlisten);
      } catch (error) {
        console.error('Failed to subscribe to raw output:', error);
      }
    };

    // Subscribe to process status events
    const setupStatusListener = async () => {
      try {
        const unlisten = await listen<ProcessStatusEvent>(
          `process-status-${processId}`,
          (event) => {
            if (!mountedRef.current) return;

            const { status: newStatus, exitCode: newExitCode } = event.payload;
            setStatus(newStatus);
            if (newExitCode !== undefined && newExitCode !== null) {
              setExitCode(newExitCode);
            }
          }
        );
        unlistenFns.push(unlisten);
      } catch (error) {
        console.error('Failed to subscribe to process status:', error);
      }
    };

    // Subscribe to permission request events
    const setupPermissionListener = async () => {
      try {
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
            setPermissionRequest({
              processId: process_id,
              toolName: tool_name,
              filePath: file_path,
              description,
            });
          }
        );
        unlistenFns.push(unlisten);
      } catch (error) {
        console.error('Failed to subscribe to permission requests:', error);
      }
    };

    // Subscribe to session ID events (emitted on "init" system events)
    const setupSessionIdListener = async () => {
      try {
        const unlisten = await listen<string>(`session-id-${processId}`, (event) => {
          if (!mountedRef.current) return;
          setSessionId(event.payload);
        });
        unlistenFns.push(unlisten);
      } catch (error) {
        console.error('Failed to subscribe to session ID:', error);
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
      mountedRef.current = false;
      for (const unlisten of unlistenFns) {
        unlisten();
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
