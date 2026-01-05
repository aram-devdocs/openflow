/**
 * useEventSubscription Hook
 *
 * Subscribes to backend events and invalidates relevant TanStack Query caches.
 * This hook enables real-time updates by:
 * - Subscribing to specific event channels
 * - Invalidating queries when events are received
 * - NOT holding business state (pure view layer)
 *
 * ## Architecture
 *
 * ```
 * Backend Event (WebSocket/IPC)
 *       │
 *       ▼
 * useEventSubscription
 *       │
 *       ├── Calls optional onEvent callback
 *       │
 *       └── Invalidates TanStack Query cache
 *              │
 *              ▼
 *        useQuery refetches
 *              │
 *              ▼
 *        UI re-renders with new data
 * ```
 *
 * ## Key Principle: No Local Business State
 *
 * Unlike traditional event hooks that accumulate events in local state,
 * this hook delegates all state to the backend (via TanStack Query).
 * Events are used purely to invalidate caches, triggering refetches.
 *
 * @example
 * ```tsx
 * // Subscribe to task events and invalidate task queries
 * useEventSubscription(`task:${taskId}`, {
 *   invalidateKeys: [['tasks', taskId], ['tasks', 'withSteps', taskId]],
 * });
 *
 * // Subscribe with custom handler
 * useEventSubscription(`task-progress-${taskId}`, {
 *   invalidateKeys: [['tasks']],
 *   onEvent: (event) => {
 *     console.log('Task progress:', event);
 *   },
 * });
 * ```
 *
 * @see useDataSync - For global data change subscriptions
 * @see channels.rs - Backend channel definitions
 */

import { subscribe } from '@openflow/queries';
import { createLogger } from '@openflow/utils';
import { type QueryKey, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useRef } from 'react';

const logger = createLogger('useEventSubscription');

// =============================================================================
// Types
// =============================================================================

/**
 * Options for useEventSubscription hook.
 */
export interface UseEventSubscriptionOptions<T = unknown> {
  /**
   * Whether the subscription is enabled.
   * @default true
   */
  enabled?: boolean;

  /**
   * Query keys to invalidate when an event is received.
   * These should be TanStack Query query keys (arrays).
   *
   * @example
   * ```ts
   * invalidateKeys: [['tasks'], ['tasks', taskId]]
   * ```
   */
  invalidateKeys?: QueryKey[];

  /**
   * Optional callback when an event is received.
   * Called after query invalidation.
   */
  onEvent?: (event: T) => void;

  /**
   * Optional filter function to determine if an event should trigger invalidation.
   * Return true to invalidate, false to skip.
   */
  filter?: (event: T) => boolean;
}

/**
 * Return type for useEventSubscription hook.
 */
export interface UseEventSubscriptionResult {
  /**
   * Whether the subscription is currently active.
   */
  isSubscribed: boolean;
}

// =============================================================================
// Channel Constants (TypeScript equivalents of Rust channels.rs)
// =============================================================================

/**
 * Channel constants for event subscription.
 * These mirror the constants in crates/openflow-contracts/src/events/channels.rs
 */
export const CHANNELS = {
  // Static channels
  DATA_CHANGED: 'data-changed',
  WILDCARD: '*',

  // Dynamic channel prefixes
  PREFIX_TASK_PROGRESS: 'task-progress-',
  PREFIX_STEP_PROGRESS: 'step-progress-',
  PREFIX_AGENT_EVENT: 'agent-event-',
  PREFIX_PERMISSION_REQUEST: 'permission-request-',
  PREFIX_PROCESS_OUTPUT: 'process-output-',
  PREFIX_PROCESS_STATUS: 'process-status-',
  PREFIX_CLAUDE_EVENT: 'claude-event-',
  PREFIX_TOOL_STATE: 'tool-state-',
  PREFIX_TASK: 'task:',
  PREFIX_SESSION: 'session:',
} as const;

/**
 * Generate channel name for task progress events.
 */
export function taskProgressChannel(taskId: string): string {
  return `${CHANNELS.PREFIX_TASK_PROGRESS}${taskId}`;
}

/**
 * Generate channel name for step progress events.
 */
export function stepProgressChannel(stepId: string): string {
  return `${CHANNELS.PREFIX_STEP_PROGRESS}${stepId}`;
}

/**
 * Generate channel name for agent events.
 */
export function agentEventChannel(sessionId: string): string {
  return `${CHANNELS.PREFIX_AGENT_EVENT}${sessionId}`;
}

/**
 * Generate channel name for permission request events.
 */
export function permissionRequestChannel(sessionId: string): string {
  return `${CHANNELS.PREFIX_PERMISSION_REQUEST}${sessionId}`;
}

/**
 * Generate channel name for process output events.
 */
export function processOutputChannel(processId: string): string {
  return `${CHANNELS.PREFIX_PROCESS_OUTPUT}${processId}`;
}

/**
 * Generate channel name for process status events.
 */
export function processStatusChannel(processId: string): string {
  return `${CHANNELS.PREFIX_PROCESS_STATUS}${processId}`;
}

/**
 * Generate channel name for Claude events (legacy).
 * @deprecated Use agentEventChannel instead
 */
export function claudeEventChannel(processId: string): string {
  return `${CHANNELS.PREFIX_CLAUDE_EVENT}${processId}`;
}

/**
 * Generate channel name for tool state events.
 */
export function toolStateChannel(processId: string): string {
  return `${CHANNELS.PREFIX_TOOL_STATE}${processId}`;
}

/**
 * Generate entity-scoped task channel.
 * Receives all events related to a specific task.
 */
export function taskChannel(taskId: string): string {
  return `${CHANNELS.PREFIX_TASK}${taskId}`;
}

/**
 * Generate entity-scoped session channel.
 * Receives all events related to a specific agent session.
 */
export function sessionChannel(sessionId: string): string {
  return `${CHANNELS.PREFIX_SESSION}${sessionId}`;
}

// =============================================================================
// Main Hook
// =============================================================================

/**
 * Subscribe to an event channel and invalidate queries on events.
 *
 * This hook follows the "pure view layer" principle:
 * - Does NOT accumulate events in local state
 * - Invalidates TanStack Query cache, triggering refetches
 * - UI updates via query cache, not local state
 *
 * @param channel - Event channel to subscribe to
 * @param options - Subscription options
 * @returns Subscription result with isSubscribed status
 *
 * @example
 * ```tsx
 * function TaskView({ taskId }: { taskId: string }) {
 *   const { data: task, isLoading } = useTaskWithSteps(taskId);
 *
 *   // Subscribe to task events - invalidates cache on updates
 *   useEventSubscription(taskChannel(taskId), {
 *     invalidateKeys: [
 *       ['tasks', 'withSteps', taskId],
 *       ['tasks', 'running'],
 *     ],
 *     onEvent: (event) => {
 *       // Optional: show notification, log, etc.
 *       console.log('Task updated:', event);
 *     },
 *   });
 *
 *   if (isLoading) return <Loading />;
 *   return <TaskDetails task={task} />;
 * }
 * ```
 */
export function useEventSubscription<T = unknown>(
  channel: string | null,
  options: UseEventSubscriptionOptions<T> = {}
): UseEventSubscriptionResult {
  const { enabled = true, invalidateKeys = [], onEvent, filter } = options;

  const queryClient = useQueryClient();
  const isSubscribedRef = useRef(false);
  const eventCountRef = useRef(0);

  // Stable references for callbacks to prevent effect re-runs
  const onEventRef = useRef(onEvent);
  onEventRef.current = onEvent;

  const filterRef = useRef(filter);
  filterRef.current = filter;

  // Create stable event handler
  const handleEvent = useCallback(
    (rawEvent: unknown) => {
      const event = rawEvent as T;
      eventCountRef.current += 1;

      logger.debug('Event received', {
        channel,
        eventCount: eventCountRef.current,
      });

      // Apply filter if provided
      if (filterRef.current && !filterRef.current(event)) {
        logger.debug('Event filtered out', { channel });
        return;
      }

      // Invalidate specified query keys
      for (const queryKey of invalidateKeys) {
        logger.debug('Invalidating query', { queryKey, channel });
        queryClient.invalidateQueries({ queryKey });
      }

      // Call optional callback
      if (onEventRef.current) {
        try {
          onEventRef.current(event);
        } catch (error) {
          logger.error('Error in onEvent callback', {
            channel,
            error: error instanceof Error ? error.message : String(error),
          });
        }
      }
    },
    [channel, invalidateKeys, queryClient]
  );

  useEffect(() => {
    // Skip if disabled or no channel
    if (!enabled || !channel) {
      isSubscribedRef.current = false;
      return;
    }

    logger.debug('Setting up event subscription', { channel });

    isSubscribedRef.current = true;
    eventCountRef.current = 0;

    const unsubscribe = subscribe(channel, handleEvent);

    logger.info('Event subscription established', { channel });

    return () => {
      logger.debug('Cleaning up event subscription', {
        channel,
        totalEventsReceived: eventCountRef.current,
      });
      isSubscribedRef.current = false;
      unsubscribe();
    };
  }, [channel, enabled, handleEvent]);

  return {
    isSubscribed: isSubscribedRef.current,
  };
}

// =============================================================================
// Convenience Hooks
// =============================================================================

/**
 * Subscribe to task progress events.
 *
 * @param taskId - Task ID to subscribe to
 * @param options - Subscription options
 *
 * @example
 * ```tsx
 * useTaskProgressSubscription(taskId, {
 *   onEvent: (event) => {
 *     if (event.status === 'completed') {
 *       toast.success('Task completed!');
 *     }
 *   },
 * });
 * ```
 */
export function useTaskProgressSubscription<T = unknown>(
  taskId: string | null,
  options: Omit<UseEventSubscriptionOptions<T>, 'invalidateKeys'> & {
    invalidateKeys?: QueryKey[];
  } = {}
): UseEventSubscriptionResult {
  const defaultKeys: QueryKey[] = taskId
    ? [['tasks'], ['tasks', 'detail', taskId], ['tasks', 'withSteps', taskId], ['tasks', 'running']]
    : [];

  return useEventSubscription<T>(taskId ? taskProgressChannel(taskId) : null, {
    ...options,
    invalidateKeys: [...defaultKeys, ...(options.invalidateKeys ?? [])],
  });
}

/**
 * Subscribe to agent session events.
 *
 * @param sessionId - Session ID to subscribe to
 * @param options - Subscription options
 *
 * @example
 * ```tsx
 * useAgentEventSubscription(sessionId, {
 *   onEvent: (event) => {
 *     console.log('Agent event:', event);
 *   },
 * });
 * ```
 */
export function useAgentEventSubscription<T = unknown>(
  sessionId: string | null,
  options: Omit<UseEventSubscriptionOptions<T>, 'invalidateKeys'> & {
    invalidateKeys?: QueryKey[];
  } = {}
): UseEventSubscriptionResult {
  const defaultKeys: QueryKey[] = sessionId
    ? [
        ['agentSessions'],
        ['agentSessions', 'detail', sessionId],
        ['agentSessions', 'withState', sessionId],
        ['agentSessions', 'events', sessionId],
      ]
    : [];

  return useEventSubscription<T>(sessionId ? agentEventChannel(sessionId) : null, {
    ...options,
    invalidateKeys: [...defaultKeys, ...(options.invalidateKeys ?? [])],
  });
}

/**
 * Subscribe to permission request events.
 *
 * @param sessionId - Session ID to subscribe to
 * @param options - Subscription options
 *
 * @example
 * ```tsx
 * usePermissionRequestSubscription(sessionId, {
 *   onEvent: (permission) => {
 *     setShowPermissionDialog(true);
 *   },
 * });
 * ```
 */
export function usePermissionRequestSubscription<T = unknown>(
  sessionId: string | null,
  options: Omit<UseEventSubscriptionOptions<T>, 'invalidateKeys'> & {
    invalidateKeys?: QueryKey[];
  } = {}
): UseEventSubscriptionResult {
  const defaultKeys: QueryKey[] = sessionId
    ? [
        ['agentSessions', 'permission', sessionId],
        ['tasks', 'permissions'],
      ]
    : [];

  return useEventSubscription<T>(sessionId ? permissionRequestChannel(sessionId) : null, {
    ...options,
    invalidateKeys: [...defaultKeys, ...(options.invalidateKeys ?? [])],
  });
}

/**
 * Subscribe to step progress events.
 *
 * @param stepId - Step ID to subscribe to
 * @param taskId - Task ID for query key invalidation
 * @param options - Subscription options
 *
 * @example
 * ```tsx
 * useStepProgressSubscription(stepId, taskId, {
 *   onEvent: (event) => {
 *     console.log('Step progress:', event);
 *   },
 * });
 * ```
 */
export function useStepProgressSubscription<T = unknown>(
  stepId: string | null,
  taskId: string | null,
  options: Omit<UseEventSubscriptionOptions<T>, 'invalidateKeys'> & {
    invalidateKeys?: QueryKey[];
  } = {}
): UseEventSubscriptionResult {
  const defaultKeys: QueryKey[] = [];

  if (stepId) {
    defaultKeys.push(['tasks', 'steps', 'detail', stepId]);
  }

  if (taskId) {
    defaultKeys.push(['tasks', 'steps', 'list', taskId], ['tasks', 'withSteps', taskId]);
  }

  return useEventSubscription<T>(stepId ? stepProgressChannel(stepId) : null, {
    ...options,
    invalidateKeys: [...defaultKeys, ...(options.invalidateKeys ?? [])],
  });
}

/**
 * Subscribe to all events for a task (entity-scoped).
 *
 * This subscribes to the entity-scoped `task:{taskId}` channel which receives
 * all events related to a specific task including progress, steps, and agent events.
 *
 * @param taskId - Task ID to subscribe to
 * @param options - Subscription options
 *
 * @example
 * ```tsx
 * useTaskSubscription(taskId, {
 *   onEvent: (event) => {
 *     console.log('Task event:', event);
 *   },
 * });
 * ```
 */
export function useTaskSubscription<T = unknown>(
  taskId: string | null,
  options: Omit<UseEventSubscriptionOptions<T>, 'invalidateKeys'> & {
    invalidateKeys?: QueryKey[];
  } = {}
): UseEventSubscriptionResult {
  const defaultKeys: QueryKey[] = taskId
    ? [
        ['tasks'],
        ['tasks', 'detail', taskId],
        ['tasks', 'withSteps', taskId],
        ['tasks', 'steps', 'list', taskId],
        ['tasks', 'events'],
        ['tasks', 'running'],
        ['tasks', 'permissions', 'pending', taskId],
      ]
    : [];

  return useEventSubscription<T>(taskId ? taskChannel(taskId) : null, {
    ...options,
    invalidateKeys: [...defaultKeys, ...(options.invalidateKeys ?? [])],
  });
}

/**
 * Subscribe to all events for an agent session (entity-scoped).
 *
 * This subscribes to the entity-scoped `session:{sessionId}` channel which receives
 * all events related to a specific session including messages, tool use, and permissions.
 *
 * @param sessionId - Session ID to subscribe to
 * @param options - Subscription options
 *
 * @example
 * ```tsx
 * useSessionSubscription(sessionId, {
 *   onEvent: (event) => {
 *     console.log('Session event:', event);
 *   },
 * });
 * ```
 */
export function useSessionSubscription<T = unknown>(
  sessionId: string | null,
  options: Omit<UseEventSubscriptionOptions<T>, 'invalidateKeys'> & {
    invalidateKeys?: QueryKey[];
  } = {}
): UseEventSubscriptionResult {
  const defaultKeys: QueryKey[] = sessionId
    ? [
        ['agentSessions'],
        ['agentSessions', 'detail', sessionId],
        ['agentSessions', 'withState', sessionId],
        ['agentSessions', 'summary', sessionId],
        ['agentSessions', 'events', sessionId],
        ['agentSessions', 'permission', sessionId],
        ['agentSessions', 'rawOutput', sessionId],
      ]
    : [];

  return useEventSubscription<T>(sessionId ? sessionChannel(sessionId) : null, {
    ...options,
    invalidateKeys: [...defaultKeys, ...(options.invalidateKeys ?? [])],
  });
}

/**
 * Subscribe to process output events.
 *
 * @param processId - Process ID to subscribe to
 * @param options - Subscription options
 *
 * @example
 * ```tsx
 * useProcessOutputSubscription(processId, {
 *   onEvent: (output) => {
 *     appendToTerminal(output.content);
 *   },
 * });
 * ```
 */
export function useProcessOutputSubscription<T = unknown>(
  processId: string | null,
  options: Omit<UseEventSubscriptionOptions<T>, 'invalidateKeys'> & {
    invalidateKeys?: QueryKey[];
  } = {}
): UseEventSubscriptionResult {
  const defaultKeys: QueryKey[] = processId
    ? [['processes'], ['processes', 'detail', processId], ['processes', 'output', processId]]
    : [];

  return useEventSubscription<T>(processId ? processOutputChannel(processId) : null, {
    ...options,
    invalidateKeys: [...defaultKeys, ...(options.invalidateKeys ?? [])],
  });
}

/**
 * Subscribe to process status events.
 *
 * @param processId - Process ID to subscribe to
 * @param options - Subscription options
 *
 * @example
 * ```tsx
 * useProcessStatusSubscription(processId, {
 *   onEvent: (status) => {
 *     if (status.status === 'completed') {
 *       toast.success('Process completed!');
 *     }
 *   },
 * });
 * ```
 */
export function useProcessStatusSubscription<T = unknown>(
  processId: string | null,
  options: Omit<UseEventSubscriptionOptions<T>, 'invalidateKeys'> & {
    invalidateKeys?: QueryKey[];
  } = {}
): UseEventSubscriptionResult {
  const defaultKeys: QueryKey[] = processId
    ? [['processes'], ['processes', 'detail', processId], ['processes', 'status', processId]]
    : [];

  return useEventSubscription<T>(processId ? processStatusChannel(processId) : null, {
    ...options,
    invalidateKeys: [...defaultKeys, ...(options.invalidateKeys ?? [])],
  });
}
