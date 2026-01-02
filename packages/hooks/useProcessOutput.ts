/**
 * useProcessOutput Hook
 *
 * Subscribes to real-time process output for a specific process.
 *
 * This hook uses the transport abstraction layer, which means it works in both:
 * - **Tauri context**: Uses Tauri event listener via IPC
 * - **Browser context**: Uses WebSocket subscription to standalone server
 *
 * ## Usage
 *
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
 *
 * @see CLAUDE.md - Flexible Backend Architecture section
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { subscribe, type ProcessOutputEvent, type ProcessStatusEvent } from '@openflow/queries';
import { createLogger } from '@openflow/utils';

// Create logger for this hook
const logger = createLogger('useProcessOutput');

/**
 * Output type for process output lines.
 * Matches the Rust ProcessOutputEvent.outputType field.
 */
export type OutputType = 'stdout' | 'stderr';

/**
 * Process status type.
 * Matches the Rust ProcessStatus enum.
 */
export type ProcessStatus = 'starting' | 'running' | 'completed' | 'failed' | 'killed';

/**
 * Output line with metadata for rendering.
 */
export interface OutputLine {
  /** The text content of the output line */
  content: string;
  /** Whether this is stdout or stderr */
  outputType: OutputType;
  /** ISO timestamp when the output was received */
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
 * Options for the useProcessOutput hook.
 */
export interface UseProcessOutputOptions {
  /**
   * Maximum number of output lines to keep in memory.
   * Older lines will be trimmed when this limit is reached.
   * @default 10000
   */
  maxLines?: number;

  /**
   * Whether the subscription is enabled.
   * @default true
   */
  enabled?: boolean;

  /**
   * Callback when new output is received.
   * Useful for custom processing like searching or filtering.
   */
  onOutput?: (line: OutputLine) => void;

  /**
   * Callback when process status changes.
   */
  onStatusChange?: (status: ProcessStatus, exitCode: number | null) => void;
}

/**
 * Hook to subscribe to real-time process output.
 *
 * This hook listens to two event channels:
 * - `process-output-{processId}`: Receives stdout/stderr output lines
 * - `process-status-{processId}`: Receives process status changes
 *
 * Output is accumulated in state and cleaned up when the component unmounts.
 *
 * @param processId - The ID of the process to subscribe to, or null to skip subscription
 * @param options - Optional configuration
 * @returns ProcessOutputState with output lines, status, and utilities
 *
 * @example
 * ```tsx
 * // Basic usage
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
 *
 * @example
 * ```tsx
 * // With options
 * function ProcessViewer({ processId }: { processId: string }) {
 *   const { output, status } = useProcessOutput(processId, {
 *     maxLines: 1000,
 *     onOutput: (line) => {
 *       if (line.content.includes('error')) {
 *         console.warn('Error detected:', line.content);
 *       }
 *     },
 *     onStatusChange: (status, exitCode) => {
 *       if (status === 'failed') {
 *         toast.error(`Process failed with exit code ${exitCode}`);
 *       }
 *     }
 *   });
 *
 *   // ...
 * }
 * ```
 *
 * @example
 * ```tsx
 * // Conditional subscription
 * function OptionalProcessView({ processId, enabled }: Props) {
 *   const { output } = useProcessOutput(processId, { enabled });
 *   // ...
 * }
 * ```
 */
export function useProcessOutput(
  processId: string | null,
  options: UseProcessOutputOptions = {}
): ProcessOutputState {
  const { maxLines = 10000, enabled = true, onOutput, onStatusChange } = options;

  const [output, setOutput] = useState<OutputLine[]>([]);
  const [status, setStatus] = useState<ProcessStatus | null>(null);
  const [exitCode, setExitCode] = useState<number | null>(null);

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
    // Skip if no process ID or disabled
    if (!processId || !enabled) {
      logger.debug('Skipping subscription', { processId, enabled });
      return;
    }

    // Log initialization only once per processId
    if (!initializedRef.current) {
      logger.debug('Initializing process output subscription', { processId });
      initializedRef.current = true;
    }

    // Channel names for this process
    const outputChannel = `process-output-${processId}`;
    const statusChannel = `process-status-${processId}`;

    logger.debug('Setting up output listener', { processId, channel: outputChannel });
    logger.debug('Setting up status listener', { processId, channel: statusChannel });

    // Subscribe to process output events
    const unsubscribeOutput = subscribe(outputChannel, (event) => {
      const { content, outputType, timestamp } = event as ProcessOutputEvent;
      outputCountRef.current += 1;

      // Create the output line
      const line: OutputLine = {
        content,
        outputType: outputType as OutputType,
        timestamp,
      };

      // Log every 100 lines to avoid noise, but always log first line
      if (outputCountRef.current === 1 || outputCountRef.current % 100 === 0) {
        logger.debug('Received output', {
          processId,
          outputType,
          lineCount: outputCountRef.current,
          contentLength: content.length,
        });
      }

      // Call the optional callback
      if (onOutput) {
        try {
          onOutput(line);
        } catch (error) {
          logger.error('Error in onOutput callback', {
            error: error instanceof Error ? error.message : String(error),
          });
        }
      }

      // Add to state, trimming if necessary
      setOutput((prev) => {
        const newOutput = [...prev, line];
        if (newOutput.length > maxLines) {
          // Trim from the beginning to keep the most recent lines
          return newOutput.slice(-maxLines);
        }
        return newOutput;
      });
    });

    // Subscribe to process status events
    const unsubscribeStatus = subscribe(statusChannel, (event) => {
      const { status: newStatus, exitCode: newExitCode } = event as ProcessStatusEvent;

      logger.info('Process status changed', {
        processId,
        previousStatus: status,
        newStatus,
        exitCode: newExitCode,
      });

      setStatus(newStatus as ProcessStatus);

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

      // Call the optional callback
      if (onStatusChange) {
        try {
          onStatusChange(newStatus as ProcessStatus, newExitCode ?? null);
        } catch (error) {
          logger.error('Error in onStatusChange callback', {
            error: error instanceof Error ? error.message : String(error),
          });
        }
      }
    });

    logger.info('Process output listeners established', { processId });

    // Cleanup on unmount or processId/enabled change
    return () => {
      logger.debug('Cleaning up process output subscription', {
        processId,
        totalLinesReceived: outputCountRef.current,
      });
      initializedRef.current = false;
      unsubscribeOutput();
      unsubscribeStatus();
    };
  }, [processId, enabled, maxLines, onOutput, onStatusChange, status]);

  // Compute raw output as combined string
  const rawOutput = output.map((line) => line.content).join('');

  // Determine if process is running
  // null status means we haven't received a status event yet (assumed running)
  const isRunning = status === null || status === 'starting' || status === 'running';

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
 * @param options - Optional configuration (applies to all processes)
 * @returns Map of processId to ProcessOutputState
 *
 * @example
 * ```tsx
 * function MultiProcessMonitor({ processIds }: { processIds: string[] }) {
 *   const outputs = useMultipleProcessOutput(processIds);
 *
 *   return (
 *     <div>
 *       {processIds.map((id) => {
 *         const processState = outputs.get(id);
 *         return (
 *           <div key={id}>
 *             <h3>Process {id}</h3>
 *             <div>Status: {processState?.status ?? 'unknown'}</div>
 *             <pre>{processState?.rawOutput}</pre>
 *           </div>
 *         );
 *       })}
 *     </div>
 *   );
 * }
 * ```
 */
export function useMultipleProcessOutput(
  processIds: string[],
  options: Omit<UseProcessOutputOptions, 'onOutput' | 'onStatusChange'> = {}
): Map<string, ProcessOutputState> {
  const { maxLines = 10000, enabled = true } = options;

  const [outputs, setOutputs] = useState<Map<string, ProcessOutputState>>(new Map());

  // Track output counts per process
  const outputCountsRef = useRef<Map<string, number>>(new Map());
  // Track initialization
  const initializedRef = useRef(false);

  // Create stable clear functions for each process
  const clearFunctionsRef = useRef<Map<string, () => void>>(new Map());

  useEffect(() => {
    if (!enabled || processIds.length === 0) {
      logger.debug('Skipping multi-process subscription', { enabled, processCount: processIds.length });
      return;
    }

    // Log initialization
    if (!initializedRef.current) {
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

    // Create clear functions for each process
    for (const id of processIds) {
      if (!clearFunctionsRef.current.has(id)) {
        clearFunctionsRef.current.set(id, () => {
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
        });
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
        clearOutput: clearFunctionsRef.current.get(id)!,
      });
    }
    setOutputs(initialState);

    // Collect unsubscribe functions
    const unsubscribeFns: (() => void)[] = [];

    // Set up listeners for each process
    for (const processId of processIds) {
      if (!processId) continue;

      const outputChannel = `process-output-${processId}`;
      const statusChannel = `process-status-${processId}`;

      logger.debug('Setting up listeners for process', { processId });

      // Output listener
      const unsubscribeOutput = subscribe(outputChannel, (event) => {
        const { content, outputType, timestamp } = event as ProcessOutputEvent;
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
            const line: OutputLine = {
              content,
              outputType: outputType as OutputType,
              timestamp,
            };
            let newOutput = [...current.output, line];

            // Trim if necessary
            if (newOutput.length > maxLines) {
              newOutput = newOutput.slice(-maxLines);
            }

            updated.set(processId, {
              ...current,
              output: newOutput,
              rawOutput: newOutput.map((l) => l.content).join(''),
            });
          }
          return updated;
        });
      });
      unsubscribeFns.push(unsubscribeOutput);

      // Status listener
      const unsubscribeStatus = subscribe(statusChannel, (event) => {
        const { status, exitCode } = event as ProcessStatusEvent;

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
            const newStatus = status as ProcessStatus;
            updated.set(processId, {
              ...current,
              status: newStatus,
              exitCode: exitCode ?? current.exitCode,
              isRunning: newStatus === null || newStatus === 'starting' || newStatus === 'running',
            });
          }
          return updated;
        });
      });
      unsubscribeFns.push(unsubscribeStatus);

      logger.info('Listeners established for process', { processId });
    }

    return () => {
      logger.debug('Cleaning up multi-process output subscriptions', {
        processCount: processIds.length,
        totalLinesPerProcess: Object.fromEntries(outputCountsRef.current),
      });
      initializedRef.current = false;
      for (const unsubscribe of unsubscribeFns) {
        unsubscribe();
      }
    };
  }, [processIds, enabled, maxLines]);

  return outputs;
}
