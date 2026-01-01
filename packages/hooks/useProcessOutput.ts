import type {
  OutputType,
  ProcessOutputEvent,
  ProcessStatus,
  ProcessStatusEvent,
} from '@openflow/generated';
import { createLogger } from '@openflow/utils';
import { type UnlistenFn, listen } from '@tauri-apps/api/event';
import { useCallback, useEffect, useRef, useState } from 'react';

// Create logger for this hook
const logger = createLogger('useProcessOutput');

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
  // Track output line count for logging
  const outputCountRef = useRef(0);
  // Track initialization logging
  const initializedRef = useRef(false);

  // Clear output handler
  const clearOutput = useCallback(() => {
    logger.debug('Clearing output', { processId, lineCount: outputCountRef.current });
    setOutput([]);
    outputCountRef.current = 0;
  }, [processId]);

  useEffect(() => {
    mountedRef.current = true;
    const unlistenFns: UnlistenFn[] = [];

    // Skip if no process ID
    if (!processId) {
      logger.debug('No process ID provided, skipping subscription');
      return;
    }

    // Log initialization only once per processId
    if (!initializedRef.current) {
      logger.debug('Initializing process output subscription', { processId });
      initializedRef.current = true;
    }

    // Subscribe to process output events
    const setupOutputListener = async () => {
      try {
        logger.debug('Setting up output listener', {
          processId,
          channel: `process-output-${processId}`,
        });

        const unlisten = await listen<ProcessOutputEvent>(
          `process-output-${processId}`,
          (event) => {
            if (!mountedRef.current) return;

            const { content, outputType, timestamp } = event.payload;
            outputCountRef.current += 1;

            // Log every 100 lines to avoid noise, but always log first line
            if (outputCountRef.current === 1 || outputCountRef.current % 100 === 0) {
              logger.debug('Received output', {
                processId,
                outputType,
                lineCount: outputCountRef.current,
                contentLength: content.length,
              });
            }

            setOutput((prev) => [...prev, { content, outputType, timestamp }]);
          }
        );
        unlistenFns.push(unlisten);
        logger.info('Output listener established', { processId });
      } catch (error) {
        logger.error('Failed to subscribe to process output', {
          processId,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    };

    // Subscribe to process status events
    const setupStatusListener = async () => {
      try {
        logger.debug('Setting up status listener', {
          processId,
          channel: `process-status-${processId}`,
        });

        const unlisten = await listen<ProcessStatusEvent>(
          `process-status-${processId}`,
          (event) => {
            if (!mountedRef.current) return;

            const { status: newStatus, exitCode: newExitCode } = event.payload;

            logger.info('Process status changed', {
              processId,
              previousStatus: status,
              newStatus,
              exitCode: newExitCode,
            });

            setStatus(newStatus);
            if (newExitCode !== undefined && newExitCode !== null) {
              setExitCode(newExitCode);

              // Log completion with exit code
              if (newExitCode === 0) {
                logger.info('Process completed successfully', {
                  processId,
                  exitCode: newExitCode,
                  totalLines: outputCountRef.current,
                });
              } else {
                logger.warn('Process completed with non-zero exit code', {
                  processId,
                  exitCode: newExitCode,
                  totalLines: outputCountRef.current,
                });
              }
            }
          }
        );
        unlistenFns.push(unlisten);
        logger.info('Status listener established', { processId });
      } catch (error) {
        logger.error('Failed to subscribe to process status', {
          processId,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    };

    // Set up both listeners
    setupOutputListener();
    setupStatusListener();

    // Cleanup on unmount or processId change
    return () => {
      logger.debug('Cleaning up process output subscription', {
        processId,
        totalLinesReceived: outputCountRef.current,
      });
      mountedRef.current = false;
      initializedRef.current = false;
      for (const unlisten of unlistenFns) {
        unlisten();
      }
    };
  }, [processId, status]);

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
export function useMultipleProcessOutput(processIds: string[]): Map<string, ProcessOutputState> {
  const [outputs, setOutputs] = useState<Map<string, ProcessOutputState>>(new Map());
  const mountedRef = useRef(true);
  // Track output counts per process
  const outputCountsRef = useRef<Map<string, number>>(new Map());
  // Track initialization
  const initializedRef = useRef(false);

  useEffect(() => {
    mountedRef.current = true;
    const unlistenFns: UnlistenFn[] = [];

    // Log initialization
    if (!initializedRef.current && processIds.length > 0) {
      logger.debug('Initializing multi-process output subscription', {
        processCount: processIds.length,
        processIds,
      });
      initializedRef.current = true;
    }

    // Initialize output counts
    for (const id of processIds) {
      if (!outputCountsRef.current.has(id)) {
        outputCountsRef.current.set(id, 0);
      }
    }

    // Initialize state for each process
    const initialState = new Map<string, ProcessOutputState>();
    for (const id of processIds) {
      initialState.set(id, {
        output: [],
        rawOutput: '',
        status: null,
        exitCode: null,
        isRunning: true,
        clearOutput: () => {
          logger.debug('Clearing output for process', {
            processId: id,
            lineCount: outputCountsRef.current.get(id) ?? 0,
          });
          outputCountsRef.current.set(id, 0);
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
    }
    setOutputs(initialState);

    // Set up listeners for each process
    const setupListeners = async () => {
      for (const processId of processIds) {
        if (!processId) continue;

        try {
          logger.debug('Setting up listeners for process', { processId });

          // Output listener
          const outputUnlisten = await listen<ProcessOutputEvent>(
            `process-output-${processId}`,
            (event) => {
              if (!mountedRef.current) return;

              const { content, outputType, timestamp } = event.payload;
              const currentCount = (outputCountsRef.current.get(processId) ?? 0) + 1;
              outputCountsRef.current.set(processId, currentCount);

              // Log every 100 lines to avoid noise
              if (currentCount === 1 || currentCount % 100 === 0) {
                logger.debug('Received output (multi)', {
                  processId,
                  outputType,
                  lineCount: currentCount,
                  contentLength: content.length,
                });
              }

              setOutputs((prev) => {
                const updated = new Map(prev);
                const current = updated.get(processId);
                if (current) {
                  const newOutput = [...current.output, { content, outputType, timestamp }];
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

              logger.info('Process status changed (multi)', {
                processId,
                newStatus: status,
                exitCode,
              });

              // Log completion
              if (exitCode !== undefined && exitCode !== null) {
                const totalLines = outputCountsRef.current.get(processId) ?? 0;
                if (exitCode === 0) {
                  logger.info('Process completed successfully (multi)', {
                    processId,
                    exitCode,
                    totalLines,
                  });
                } else {
                  logger.warn('Process completed with non-zero exit code (multi)', {
                    processId,
                    exitCode,
                    totalLines,
                  });
                }
              }

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

          logger.info('Listeners established for process', { processId });
        } catch (error) {
          logger.error('Failed to subscribe to process', {
            processId,
            error: error instanceof Error ? error.message : String(error),
          });
        }
      }
    };

    setupListeners();

    return () => {
      logger.debug('Cleaning up multi-process output subscriptions', {
        processCount: processIds.length,
        totalLinesPerProcess: Object.fromEntries(outputCountsRef.current),
      });
      mountedRef.current = false;
      initializedRef.current = false;
      for (const unlisten of unlistenFns) {
        unlisten();
      }
    };
  }, [processIds]);

  return outputs;
}
