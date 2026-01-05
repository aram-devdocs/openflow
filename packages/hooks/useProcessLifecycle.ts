/**
 * @deprecated This hook is being phased out. Use useAgentSession hooks instead.
 *
 * useProcessLifecycle - Manages process lifecycle with guaranteed event listener setup
 *
 * This hook solves the race condition where event listeners might not be attached
 * before agent events start streaming. It provides:
 *
 * 1. State machine: idle → starting → running → completing → idle
 * 2. Guarantees listeners are ready before marking "running"
 * 3. Prevents sending while process is active
 * 4. Small delay before clearing to catch trailing events
 *
 * The key insight is that we need to track TWO things:
 * - Whether we've started a process (processId is set)
 * - Whether the listeners are actually ready to receive events
 *
 * Without this, there's a race condition where:
 * 1. Process A completes, setActiveProcessId(null) called
 * 2. User sends message, new process B starts, setActiveProcessId(processId)
 * 3. Event listener useEffect runs, starts async setupListeners()
 * 4. Events stream before setupListeners() completes → events lost!
 *
 * NOTE: The new architecture (AgentOrchestrator + useAgentSession) handles this
 * by persisting events to the database, eliminating client-side race conditions.
 */

import { createLogger } from '@openflow/utils';
import { useCallback, useEffect, useRef, useState } from 'react';

const logger = createLogger('useProcessLifecycle');

/** Process state machine states */
export type ProcessState = 'idle' | 'starting' | 'running' | 'completing';

export interface ProcessLifecycleState {
  /** Current process ID, null when idle */
  processId: string | null;

  /** Current state in the lifecycle */
  processState: ProcessState;

  /** True when listeners are attached and ready to receive events */
  isReady: boolean;

  /** Start a new process - transitions from idle to starting */
  startProcess: (id: string) => void;

  /** Called by event listener hook when listeners are attached */
  onListenersReady: () => void;

  /** Mark process as completing (started by completion useEffect) */
  markCompleting: () => void;

  /** Clear the process - transitions back to idle */
  clearProcess: () => void;

  /** Check if we can start a new process */
  canStartProcess: boolean;
}

/**
 * @deprecated This hook is being phased out. Use useAgentSession hooks instead.
 *
 * Hook for managing process lifecycle with guaranteed listener setup.
 *
 * @example
 * ```tsx
 * const lifecycle = useProcessLifecycle();
 *
 * // In handleSend:
 * if (!lifecycle.canStartProcess) return;
 * const process = await runExecutor.mutateAsync({...});
 * lifecycle.startProcess(process.id);
 *
 * // Pass to event listener hook:
 * const events = useEventListener(lifecycle.processId, {
 *   onListenersReady: lifecycle.onListenersReady,
 * });
 *
 * // On completion:
 * if (isComplete && lifecycle.processState === 'running') {
 *   lifecycle.markCompleting();
 *   // persist message, then:
 *   lifecycle.clearProcess();
 * }
 * ```
 */
export function useProcessLifecycle(): ProcessLifecycleState {
  const [processId, setProcessId] = useState<string | null>(null);
  const [processState, setProcessState] = useState<ProcessState>('idle');
  const [isReady, setIsReady] = useState(false);

  // Track the process ID we're waiting for listeners on
  const pendingProcessRef = useRef<string | null>(null);
  const mountedRef = useRef(true);

  // Track mounted state
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Rescue timeout for stuck 'starting' state
  // If listeners never become ready, force transition to running after timeout
  useEffect(() => {
    if (processState === 'starting') {
      const startTimeout = setTimeout(() => {
        if (mountedRef.current && processState === 'starting') {
          logger.warn('Start timeout triggered - forcing transition to running', {
            processId,
          });
          setProcessState('running');
          setIsReady(true);
          pendingProcessRef.current = null;
        }
      }, 5000); // 5 second timeout for listener setup

      return () => clearTimeout(startTimeout);
    }
  }, [processState, processId]);

  // Rescue timeout for stuck 'completing' state
  // If we're stuck in 'completing' for too long, force transition to idle
  useEffect(() => {
    if (processState === 'completing') {
      const rescueTimeout = setTimeout(() => {
        if (mountedRef.current && processState === 'completing') {
          logger.warn('Rescue timeout triggered - clearing stuck completing state', {
            processId,
          });
          setProcessState('idle');
          setIsReady(false);
          setProcessId(null);
          pendingProcessRef.current = null;
        }
      }, 15000); // 15 second safety timeout

      return () => clearTimeout(rescueTimeout);
    }
  }, [processState, processId]);

  /**
   * Start a new process. This transitions from idle to starting,
   * and sets the process ID which triggers event listeners to setup.
   */
  const startProcess = useCallback(
    (id: string) => {
      logger.debug('Starting process', { id, currentState: processState });

      if (processState !== 'idle') {
        logger.warn('Cannot start process - not in idle state', {
          currentState: processState,
          requestedProcessId: id,
        });
        return;
      }

      // Store pending process ID to verify when listeners become ready
      pendingProcessRef.current = id;

      // Transition to starting state
      setProcessState('starting');
      setIsReady(false);

      // Set the process ID - this triggers event listeners to setup
      setProcessId(id);

      logger.info('Process starting', { processId: id });
    },
    [processState]
  );

  /**
   * Called by event listener hook when listeners are fully attached.
   * Only transitions to running if we're still in the starting state
   * for the same process.
   */
  const onListenersReady = useCallback(() => {
    if (!mountedRef.current) return;

    const pendingId = pendingProcessRef.current;
    if (!pendingId) {
      logger.debug('Listeners ready but no pending process');
      return;
    }

    logger.info('Listeners ready, transitioning to running', {
      processId: pendingId,
    });

    setProcessState('running');
    setIsReady(true);
    pendingProcessRef.current = null;
  }, []);

  /**
   * Mark the process as completing. This is called when isComplete
   * becomes true, before we persist the message.
   */
  const markCompleting = useCallback(() => {
    if (processState !== 'running') {
      logger.debug('markCompleting called but not in running state', {
        currentState: processState,
      });
      return;
    }

    logger.debug('Marking process as completing', { processId });
    setProcessState('completing');
  }, [processState, processId]);

  /**
   * Clear the process and return to idle state.
   * Call this after the message has been persisted.
   */
  const clearProcess = useCallback(() => {
    logger.debug('Clearing process', { processId, processState });

    setProcessState('idle');
    setIsReady(false);
    setProcessId(null);
    pendingProcessRef.current = null;

    logger.info('Process cleared, ready for next message');
  }, [processId, processState]);

  // Can only start a new process when idle
  const canStartProcess = processState === 'idle';

  return {
    processId,
    processState,
    isReady,
    startProcess,
    onListenersReady,
    markCompleting,
    clearProcess,
    canStartProcess,
  };
}
