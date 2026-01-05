import type { ProcessOutputEvent, ProcessSnapshot } from '@openflow/generated';
import { getTransport, invoke } from '@openflow/queries';
import { createLogger } from '@openflow/utils';
import { useCallback, useEffect, useRef, useState } from 'react';

// Create logger for this hook
const logger = createLogger('useRawOutputStream');

/**
 * Fetch process snapshot to get buffered output.
 * Uses the invoke abstraction which works in both Tauri and HTTP modes.
 */
async function fetchSnapshot(processId: string): Promise<ProcessSnapshot | null> {
  try {
    // Use invoke which handles both Tauri IPC and HTTP transport
    const snapshot = await invoke<ProcessSnapshot>('get_process_snapshot', { id: processId });
    return snapshot;
  } catch (error) {
    // Snapshot might not exist if process hasn't started yet
    logger.debug('Could not fetch process snapshot (may not exist yet)', {
      processId,
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}

/**
 * State returned by the useRawOutputStream hook.
 */
export interface RawOutputStreamState {
  /** Whether the stream is connected */
  isConnected: boolean;
  /** Total bytes received */
  totalBytes: number;
  /** Error if connection failed */
  error: Error | null;
  /** Write function to pass to terminal (called with raw output) */
  onData: (data: string) => void;
  /** Clear the buffer */
  clear: () => void;
}

/**
 * Callback for when raw output data is received
 */
export type OnRawData = (data: string) => void;

/**
 * Hook to subscribe to raw output stream for a process.
 *
 * This hook subscribes to the `process-output-{processId}` channel
 * and calls the provided callback with raw output data.
 *
 * Designed for use with the Terminal component's write function.
 *
 * @param processId - The ID of the process to subscribe to (null to skip)
 * @param onData - Callback to receive raw output data (usually terminal.write)
 * @returns RawOutputStreamState with connection status
 */
export function useRawOutputStream(
  processId: string | null,
  onData?: OnRawData
): RawOutputStreamState {
  const [isConnected, setIsConnected] = useState(false);
  const [totalBytes, setTotalBytes] = useState(0);
  const [error, setError] = useState<Error | null>(null);

  // Store callback in ref to avoid dependency issues
  const onDataRef = useRef(onData);
  onDataRef.current = onData;

  // Track total bytes
  const bytesRef = useRef(0);

  // Handle incoming data
  const handleData = useCallback((data: string) => {
    bytesRef.current += data.length;
    setTotalBytes(bytesRef.current);
    onDataRef.current?.(data);
  }, []);

  // Subscribe to raw output stream
  useEffect(() => {
    if (!processId) {
      setIsConnected(false);
      return;
    }

    let unsubscribe: (() => void) | null = null;
    let isMounted = true;

    const setup = async () => {
      try {
        const transport = await getTransport();

        // First, fetch the snapshot to get buffered output
        // This ensures we don't miss any output that occurred before subscribing
        logger.debug('Fetching process snapshot for buffered output', { processId });
        const snapshot = await fetchSnapshot(processId);

        if (isMounted && snapshot?.rawOutput) {
          // Write buffered output first
          logger.info('Writing buffered output from snapshot', {
            processId,
            bufferedBytes: snapshot.rawOutput.length,
          });
          handleData(snapshot.rawOutput);
        }

        // Subscribe to raw process output for live updates
        const channel = `process-output-${processId}`;
        logger.debug('Subscribing to raw output stream', { channel });

        unsubscribe = transport.subscribe(channel, (event: unknown) => {
          if (!isMounted) return;

          const outputEvent = event as ProcessOutputEvent;
          const content = outputEvent.content || '';

          if (content) {
            handleData(content);
          }
        });

        if (isMounted) {
          setIsConnected(true);
          setError(null);
        }

        logger.info('Connected to raw output stream', { channel });
      } catch (err) {
        if (isMounted) {
          const error = err instanceof Error ? err : new Error(String(err));
          setError(error);
          setIsConnected(false);
          logger.error('Failed to connect to raw output stream', {
            processId,
            error: error.message,
          });
        }
      }
    };

    setup();

    return () => {
      isMounted = false;
      if (unsubscribe) {
        logger.debug('Cleaning up raw output stream subscription', { processId });
        unsubscribe();
      }
    };
  }, [processId, handleData]);

  // Clear buffer when process changes
  useEffect(() => {
    if (processId) {
      bytesRef.current = 0;
      setTotalBytes(0);
    }
  }, [processId]);

  // Clear function
  const clear = useCallback(() => {
    bytesRef.current = 0;
    setTotalBytes(0);
  }, []);

  return {
    isConnected,
    totalBytes,
    error,
    onData: handleData,
    clear,
  };
}
