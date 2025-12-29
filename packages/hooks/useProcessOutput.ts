import { useEffect, useState, useCallback, useRef } from 'react';
import { listen, type UnlistenFn } from '@tauri-apps/api/event';
import type {
  ProcessOutputEvent,
  ProcessStatusEvent,
  ProcessStatus,
  OutputType,
} from '@openflow/generated';

/**
 * Output line with metadata for rendering.
 */
export interface OutputLine {
  content: string;
  outputType: OutputType;
  timestamp: string;
}

/**
 * Process output state returned by the hook.
 */
export interface ProcessOutputState {
  /** Array of output lines received from the process */
  output: OutputLine[];
  /** Raw output as a single string (stdout + stderr combined) */
  rawOutput: string;
  /** Current process status */
  status: ProcessStatus | null;
  /** Process exit code when completed */
  exitCode: number | null;
  /** Whether the process is currently running */
  isRunning: boolean;
  /** Clear all accumulated output */
  clearOutput: () => void;
}

/**
 * Hook to subscribe to real-time process output via Tauri events.
 *
 * This hook listens to two event channels:
 * - `process-output-{processId}`: Receives stdout/stderr output lines
 * - `process-status-{processId}`: Receives process status changes
 *
 * Output is accumulated in state and cleaned up when the component unmounts.
 *
 * @param processId - The ID of the process to subscribe to
 * @returns ProcessOutputState with output lines, status, and utilities
 *
 * @example
 * ```tsx
 * function ProcessTerminal({ processId }: { processId: string }) {
 *   const { output, status, isRunning, clearOutput } = useProcessOutput(processId);
 *
 *   return (
 *     <div>
 *       <div className="terminal">
 *         {output.map((line, i) => (
 *           <div key={i} className={line.outputType}>
 *             {line.content}
 *           </div>
 *         ))}
 *       </div>
 *       <div>Status: {status} {isRunning && '(running)'}</div>
 *       <button onClick={clearOutput}>Clear</button>
 *     </div>
 *   );
 * }
 * ```
 */
export function useProcessOutput(processId: string): ProcessOutputState {
  const [output, setOutput] = useState<OutputLine[]>([]);
  const [status, setStatus] = useState<ProcessStatus | null>(null);
  const [exitCode, setExitCode] = useState<number | null>(null);

  // Use ref to track if we're still mounted
  const mountedRef = useRef(true);

  // Clear output handler
  const clearOutput = useCallback(() => {
    setOutput([]);
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    const unlistenFns: UnlistenFn[] = [];

    // Skip if no process ID
    if (!processId) {
      return;
    }

    // Subscribe to process output events
    const setupOutputListener = async () => {
      try {
        const unlisten = await listen<ProcessOutputEvent>(
          `process-output-${processId}`,
          (event) => {
            if (!mountedRef.current) return;

            const { content, outputType, timestamp } = event.payload;
            setOutput((prev) => [...prev, { content, outputType, timestamp }]);
          }
        );
        unlistenFns.push(unlisten);
      } catch (error) {
        console.error('Failed to subscribe to process output:', error);
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
            if (newExitCode !== null) {
              setExitCode(newExitCode);
            }
          }
        );
        unlistenFns.push(unlisten);
      } catch (error) {
        console.error('Failed to subscribe to process status:', error);
      }
    };

    // Set up both listeners
    setupOutputListener();
    setupStatusListener();

    // Cleanup on unmount or processId change
    return () => {
      mountedRef.current = false;
      unlistenFns.forEach((unlisten) => unlisten());
    };
  }, [processId]);

  // Compute raw output as combined string
  const rawOutput = output.map((line) => line.content).join('');

  // Determine if process is running
  const isRunning = status === 'running' || status === null;

  return {
    output,
    rawOutput,
    status,
    exitCode,
    isRunning,
    clearOutput,
  };
}

/**
 * Hook to subscribe to multiple process outputs simultaneously.
 *
 * Useful for monitoring multiple parallel processes in a workflow.
 *
 * @param processIds - Array of process IDs to subscribe to
 * @returns Map of processId to ProcessOutputState
 *
 * @example
 * ```tsx
 * function MultiProcessMonitor({ processIds }: { processIds: string[] }) {
 *   const outputs = useMultipleProcessOutput(processIds);
 *
 *   return (
 *     <div>
 *       {processIds.map((id) => (
 *         <div key={id}>
 *           <h3>Process {id}</h3>
 *           <pre>{outputs.get(id)?.rawOutput}</pre>
 *         </div>
 *       ))}
 *     </div>
 *   );
 * }
 * ```
 */
export function useMultipleProcessOutput(
  processIds: string[]
): Map<string, ProcessOutputState> {
  const [outputs, setOutputs] = useState<Map<string, ProcessOutputState>>(
    new Map()
  );
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    const unlistenFns: UnlistenFn[] = [];

    // Initialize state for each process
    const initialState = new Map<string, ProcessOutputState>();
    processIds.forEach((id) => {
      initialState.set(id, {
        output: [],
        rawOutput: '',
        status: null,
        exitCode: null,
        isRunning: true,
        clearOutput: () => {
          setOutputs((prev) => {
            const updated = new Map(prev);
            const current = updated.get(id);
            if (current) {
              updated.set(id, { ...current, output: [], rawOutput: '' });
            }
            return updated;
          });
        },
      });
    });
    setOutputs(initialState);

    // Set up listeners for each process
    const setupListeners = async () => {
      for (const processId of processIds) {
        if (!processId) continue;

        try {
          // Output listener
          const outputUnlisten = await listen<ProcessOutputEvent>(
            `process-output-${processId}`,
            (event) => {
              if (!mountedRef.current) return;

              const { content, outputType, timestamp } = event.payload;
              setOutputs((prev) => {
                const updated = new Map(prev);
                const current = updated.get(processId);
                if (current) {
                  const newOutput = [
                    ...current.output,
                    { content, outputType, timestamp },
                  ];
                  updated.set(processId, {
                    ...current,
                    output: newOutput,
                    rawOutput: newOutput.map((l) => l.content).join(''),
                  });
                }
                return updated;
              });
            }
          );
          unlistenFns.push(outputUnlisten);

          // Status listener
          const statusUnlisten = await listen<ProcessStatusEvent>(
            `process-status-${processId}`,
            (event) => {
              if (!mountedRef.current) return;

              const { status, exitCode } = event.payload;
              setOutputs((prev) => {
                const updated = new Map(prev);
                const current = updated.get(processId);
                if (current) {
                  updated.set(processId, {
                    ...current,
                    status,
                    exitCode: exitCode ?? current.exitCode,
                    isRunning: status === 'running',
                  });
                }
                return updated;
              });
            }
          );
          unlistenFns.push(statusUnlisten);
        } catch (error) {
          console.error(
            `Failed to subscribe to process ${processId}:`,
            error
          );
        }
      }
    };

    setupListeners();

    return () => {
      mountedRef.current = false;
      unlistenFns.forEach((unlisten) => unlisten());
    };
  }, [processIds.join(',')]); // Re-subscribe when processIds change

  return outputs;
}
