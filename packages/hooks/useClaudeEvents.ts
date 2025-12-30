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
  [key: string]: unknown;
}

export interface ClaudeAssistantEvent {
  type: 'assistant';
  message: {
    content?: string;
    tool_use?: unknown;
  };
}

export interface ClaudeUserEvent {
  type: 'user';
  message: {
    content?: string;
    tool_result?: unknown;
  };
}

export interface ClaudeResultEvent {
  type: 'result';
  subtype: string;
  [key: string]: unknown;
}

/**
 * State returned by the useClaudeEvents hook.
 */
export interface ClaudeEventsState {
  /** Array of Claude events received from the process */
  events: ClaudeEvent[];
  /** Raw output lines that couldn't be parsed as ClaudeEvent */
  rawOutput: string[];
  /** Current process status */
  status: ProcessStatus | null;
  /** Process exit code when completed */
  exitCode: number | null;
  /** Whether the process is currently running */
  isRunning: boolean;
  /** Whether the process has completed */
  isComplete: boolean;
  /** Clear all accumulated events and output */
  clearEvents: () => void;
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
  const [status, setStatus] = useState<ProcessStatus | null>(null);
  const [exitCode, setExitCode] = useState<number | null>(null);

  // Use ref to track if we're still mounted
  const mountedRef = useRef(true);

  // Clear events handler
  const clearEvents = useCallback(() => {
    setEvents([]);
    setRawOutput([]);
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
    setStatus(null);
    setExitCode(null);

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

    // Set up all listeners
    setupClaudeEventListener();
    setupRawOutputListener();
    setupStatusListener();

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
    status,
    exitCode,
    isRunning,
    isComplete,
    clearEvents,
  };
}
