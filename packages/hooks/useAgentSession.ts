/**
 * Agent Session Hooks
 *
 * React hooks for agent session management.
 * Wraps agentSessionQueries with TanStack Query for:
 * - Automatic caching and refetching
 * - Loading and error states
 * - Cache invalidation after mutations
 * - Polling for live updates
 *
 * @example
 * ```tsx
 * // Get session with state
 * const { data: sessionState, isLoading } = useAgentSessionWithState(sessionId);
 *
 * // Poll for events while session is running
 * const { data: events } = useAgentSessionEvents(sessionId, {
 *   afterSequence: lastSequence,
 *   refetchInterval: sessionState?.session.status === 'running' ? 500 : false,
 * });
 *
 * // Respond to permission
 * const respondPermission = useRespondAgentPermission();
 * respondPermission.mutate({ sessionId, permissionId, approved: true });
 * ```
 */

import type {
  AgentEventRecord,
  AgentSession,
  AgentSessionSummary,
  AgentSessionWithState,
  NormalizedEntry,
  Permission,
  ToolState,
} from '@openflow/generated';
import { agentSessionQueries } from '@openflow/queries';
import { createLogger } from '@openflow/utils';
import {
  type UseMutationResult,
  type UseQueryResult,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import {
  normalizedChannel,
  rawOutputChannel,
  useEventSubscription,
} from './useEventSubscription.js';

const logger = createLogger('useAgentSession');

// =============================================================================
// Query Key Factory
// =============================================================================

/**
 * Query key factory for agent sessions.
 * Provides structured, hierarchical keys for cache management.
 */
export const agentSessionKeys = {
  // Base key
  all: ['agent-sessions'] as const,

  // Session queries
  sessions: () => [...agentSessionKeys.all, 'sessions'] as const,
  session: (sessionId: string) => [...agentSessionKeys.sessions(), sessionId] as const,
  sessionWithState: (sessionId: string) =>
    [...agentSessionKeys.session(sessionId), 'with-state'] as const,
  sessionSummary: (sessionId: string) =>
    [...agentSessionKeys.session(sessionId), 'summary'] as const,

  // Session lists
  lists: () => [...agentSessionKeys.all, 'lists'] as const,
  listByProcess: (processId: string) =>
    [...agentSessionKeys.lists(), 'by-process', processId] as const,
  listRunning: () => [...agentSessionKeys.lists(), 'running'] as const,
  listActive: () => [...agentSessionKeys.lists(), 'active'] as const,

  // Events
  events: () => [...agentSessionKeys.all, 'events'] as const,
  sessionEvents: (sessionId: string, afterSequence?: number) =>
    [...agentSessionKeys.events(), sessionId, { afterSequence }] as const,
  latestSequence: (sessionId: string) =>
    [...agentSessionKeys.events(), sessionId, 'latest-sequence'] as const,
  eventCount: (sessionId: string) => [...agentSessionKeys.events(), sessionId, 'count'] as const,

  // Normalized events
  normalizedEvents: (sessionId: string, afterSequence?: number) =>
    [...agentSessionKeys.all, 'normalized-events', sessionId, { afterSequence }] as const,

  // Permissions
  permissions: () => [...agentSessionKeys.all, 'permissions'] as const,
  pendingPermission: (sessionId: string) =>
    [...agentSessionKeys.permissions(), 'pending', sessionId] as const,

  // Active status
  active: () => [...agentSessionKeys.all, 'active'] as const,
  isActive: (sessionId: string) => [...agentSessionKeys.active(), sessionId] as const,
  activeCount: () => [...agentSessionKeys.active(), 'count'] as const,

  // Raw output
  rawOutput: (sessionId: string) => [...agentSessionKeys.all, 'raw-output', sessionId] as const,

  // Tool states
  toolStates: (sessionId: string) => [...agentSessionKeys.all, 'tool-states', sessionId] as const,
};

// =============================================================================
// Session Query Hooks
// =============================================================================

/**
 * Get an agent session by ID.
 *
 * @param sessionId - Session ID
 * @param options - Query options
 * @returns Query result with AgentSession
 *
 * @example
 * ```tsx
 * const { data: session, isLoading, error } = useAgentSession(sessionId);
 *
 * if (isLoading) return <Loading />;
 * if (error) return <Error error={error} />;
 *
 * return <SessionCard session={session} />;
 * ```
 */
export function useAgentSession(
  sessionId: string,
  options?: { enabled?: boolean }
): UseQueryResult<AgentSession> {
  return useQuery({
    queryKey: agentSessionKeys.session(sessionId),
    queryFn: () => agentSessionQueries.get(sessionId),
    enabled: Boolean(sessionId) && options?.enabled !== false,
  });
}

/**
 * Get an agent session with full state.
 *
 * Includes event count, tool counts, and pending permission.
 * This is the primary query for displaying session progress in the UI.
 *
 * @param sessionId - Session ID
 * @param options - Query options
 * @returns Query result with AgentSessionWithState
 *
 * @example
 * ```tsx
 * const { data: sessionState } = useAgentSessionWithState(sessionId);
 *
 * return (
 *   <div>
 *     <Status status={sessionState.session.status} />
 *     <Progress events={sessionState.eventCount} tools={sessionState.toolCount} />
 *     {sessionState.pendingPermission && (
 *       <PermissionDialog permission={sessionState.pendingPermission} />
 *     )}
 *   </div>
 * );
 * ```
 */
export function useAgentSessionWithState(
  sessionId: string,
  options?: { enabled?: boolean; refetchInterval?: number | false }
): UseQueryResult<AgentSessionWithState> {
  return useQuery({
    queryKey: agentSessionKeys.sessionWithState(sessionId),
    queryFn: () => agentSessionQueries.getWithState(sessionId),
    enabled: Boolean(sessionId) && options?.enabled !== false,
    refetchInterval: options?.refetchInterval,
  });
}

/**
 * Get a lightweight session summary for UI lists.
 *
 * @param sessionId - Session ID
 * @param options - Query options
 * @returns Query result with AgentSessionSummary
 */
export function useAgentSessionSummary(
  sessionId: string,
  options?: { enabled?: boolean }
): UseQueryResult<AgentSessionSummary> {
  return useQuery({
    queryKey: agentSessionKeys.sessionSummary(sessionId),
    queryFn: () => agentSessionQueries.getSummary(sessionId),
    enabled: Boolean(sessionId) && options?.enabled !== false,
  });
}

/**
 * List all sessions for a process.
 *
 * @param processId - Process ID
 * @param options - Query options
 * @returns Query result with array of AgentSession
 */
export function useAgentSessionsByProcess(
  processId: string,
  options?: { enabled?: boolean }
): UseQueryResult<AgentSession[]> {
  return useQuery({
    queryKey: agentSessionKeys.listByProcess(processId),
    queryFn: () => agentSessionQueries.listByProcess(processId),
    enabled: Boolean(processId) && options?.enabled !== false,
  });
}

/**
 * List all currently running sessions from the database.
 *
 * @param options - Query options
 * @returns Query result with array of AgentSession
 */
export function useRunningAgentSessions(options?: {
  enabled?: boolean;
  refetchInterval?: number | false;
}): UseQueryResult<AgentSession[]> {
  return useQuery({
    queryKey: agentSessionKeys.listRunning(),
    queryFn: () => agentSessionQueries.listRunning(),
    enabled: options?.enabled !== false,
    refetchInterval: options?.refetchInterval,
  });
}

// =============================================================================
// Event Query Hooks
// =============================================================================

/**
 * Options for useAgentSessionEvents hook.
 */
export interface UseAgentSessionEventsOptions {
  /** Only return events with sequence > this value */
  afterSequence?: number;
  /** Whether to enable the query */
  enabled?: boolean;
  /** Polling interval in ms (default: disabled) */
  refetchInterval?: number | false;
}

/**
 * Get events for an agent session.
 *
 * Supports polling for live updates by setting refetchInterval.
 * Use afterSequence to get only new events since the last fetch.
 *
 * @param sessionId - Session ID
 * @param options - Query options
 * @returns Query result with array of AgentEventRecord
 *
 * @example
 * ```tsx
 * const [lastSequence, setLastSequence] = useState<number | undefined>();
 *
 * const { data: events } = useAgentSessionEvents(sessionId, {
 *   afterSequence: lastSequence,
 *   refetchInterval: isRunning ? 500 : false,
 * });
 *
 * useEffect(() => {
 *   if (events?.length) {
 *     setLastSequence(events[events.length - 1].sequence);
 *   }
 * }, [events]);
 * ```
 */
export function useAgentSessionEvents(
  sessionId: string,
  options?: UseAgentSessionEventsOptions
): UseQueryResult<AgentEventRecord[]> {
  return useQuery({
    queryKey: agentSessionKeys.sessionEvents(sessionId, options?.afterSequence),
    queryFn: () =>
      agentSessionQueries.getEvents(sessionId, { afterSequence: options?.afterSequence }),
    enabled: Boolean(sessionId) && options?.enabled !== false,
    refetchInterval: options?.refetchInterval,
  });
}

/**
 * Get the latest sequence number for a session.
 *
 * @param sessionId - Session ID
 * @param options - Query options
 * @returns Query result with sequence number or null
 */
export function useAgentLatestSequence(
  sessionId: string,
  options?: { enabled?: boolean }
): UseQueryResult<number | null> {
  return useQuery({
    queryKey: agentSessionKeys.latestSequence(sessionId),
    queryFn: () => agentSessionQueries.getLatestSequence(sessionId),
    enabled: Boolean(sessionId) && options?.enabled !== false,
  });
}

/**
 * Get event count for a session.
 *
 * @param sessionId - Session ID
 * @param options - Query options
 * @returns Query result with count
 */
export function useAgentEventCount(
  sessionId: string,
  options?: { enabled?: boolean }
): UseQueryResult<number> {
  return useQuery({
    queryKey: agentSessionKeys.eventCount(sessionId),
    queryFn: () => agentSessionQueries.countEvents(sessionId),
    enabled: Boolean(sessionId) && options?.enabled !== false,
  });
}

/**
 * Options for useAgentNormalizedEvents hook.
 */
export interface UseAgentNormalizedEventsOptions {
  /** Only return events with sequence > this value */
  afterSequence?: number;
  /** Whether to enable the query */
  enabled?: boolean;
  /** Polling interval in ms (default: disabled) */
  refetchInterval?: number | false;
  /** Callback when new events are received via WebSocket */
  onEvent?: (event: NormalizedEntry) => void;
}

/**
 * Get normalized events for an agent session with real-time updates.
 *
 * This hook provides access to normalized agent events - the canonical format
 * for all agent events after transformation from provider-specific formats.
 * Unlike raw events (AgentEventRecord), normalized events include:
 * - Rich metadata (file paths, commands, exit codes)
 * - Strongly typed event variants (Init, Message, ToolUse, ToolResult, etc.)
 * - Consistent structure across all providers
 *
 * The hook combines polling and WebSocket subscriptions:
 * - Queries the database for current events
 * - Subscribes to the normalized-{sessionId} channel for real-time updates
 * - Automatically invalidates cache when new events arrive
 *
 * Use afterSequence for efficient incremental fetching - only events with
 * sequence > afterSequence will be returned.
 *
 * @param sessionId - Session ID
 * @param options - Query options
 * @returns Query result with array of NormalizedEntry
 *
 * @example
 * ```tsx
 * function AgentEventStream({ sessionId }: { sessionId: string }) {
 *   const [lastSequence, setLastSequence] = useState<number | undefined>();
 *
 *   // Get normalized events with real-time updates
 *   const { data: events, isLoading } = useAgentNormalizedEvents(sessionId, {
 *     afterSequence: lastSequence,
 *     refetchInterval: 1000, // Poll every second as fallback
 *     onEvent: (event) => {
 *       console.log('New event:', event.entryType.type);
 *     },
 *   });
 *
 *   useEffect(() => {
 *     if (events?.length) {
 *       setLastSequence(events[events.length - 1].sequence);
 *     }
 *   }, [events]);
 *
 *   if (isLoading) return <Loading />;
 *
 *   return (
 *     <div>
 *       {events?.map((event) => (
 *         <EventCard key={event.id} event={event} />
 *       ))}
 *     </div>
 *   );
 * }
 * ```
 *
 * @example
 * ```tsx
 * // For a running session, use polling
 * const { data: sessionState } = useAgentSessionWithState(sessionId);
 * const isRunning = sessionState?.session.status === 'running';
 *
 * const { data: events } = useAgentNormalizedEvents(sessionId, {
 *   refetchInterval: isRunning ? 500 : false,
 * });
 * ```
 */
export function useAgentNormalizedEvents(
  sessionId: string,
  options?: UseAgentNormalizedEventsOptions
): UseQueryResult<NormalizedEntry[]> {
  const { afterSequence, enabled = true, refetchInterval, onEvent } = options ?? {};

  // Subscribe to normalized event channel for real-time updates
  useEventSubscription<NormalizedEntry>(sessionId ? normalizedChannel(sessionId) : null, {
    enabled: enabled && Boolean(sessionId),
    invalidateKeys: [agentSessionKeys.normalizedEvents(sessionId, afterSequence)],
    onEvent: (event: NormalizedEntry) => {
      logger.debug('Normalized event received', {
        sessionId,
        eventId: event.id,
        sequence: event.sequence,
        type: event.entryType.type,
      });

      // Call optional callback
      if (onEvent) {
        try {
          onEvent(event);
        } catch (error) {
          logger.error('Error in onEvent callback', {
            sessionId,
            eventId: event.id,
            error: error instanceof Error ? error.message : String(error),
          });
        }
      }
    },
  });

  // Query the current normalized events
  return useQuery({
    queryKey: agentSessionKeys.normalizedEvents(sessionId, afterSequence),
    queryFn: () => agentSessionQueries.getNormalizedEvents(sessionId, { afterSequence }),
    enabled: Boolean(sessionId) && enabled,
    refetchInterval,
  });
}

// =============================================================================
// Permission Hooks
// =============================================================================

/**
 * Get pending permission for a session.
 *
 * @param sessionId - Session ID
 * @param options - Query options
 * @returns Query result with Permission or null
 *
 * @example
 * ```tsx
 * const { data: permission } = useAgentPendingPermission(sessionId, {
 *   refetchInterval: isRunning ? 1000 : false,
 * });
 *
 * if (permission) {
 *   return <PermissionDialog permission={permission} />;
 * }
 * ```
 */
export function useAgentPendingPermission(
  sessionId: string,
  options?: { enabled?: boolean; refetchInterval?: number | false }
): UseQueryResult<Permission | null> {
  return useQuery({
    queryKey: agentSessionKeys.pendingPermission(sessionId),
    queryFn: () => agentSessionQueries.getPendingPermission(sessionId),
    enabled: Boolean(sessionId) && options?.enabled !== false,
    refetchInterval: options?.refetchInterval,
  });
}

/**
 * Respond to a permission request.
 *
 * @returns Mutation for responding to permission
 *
 * @example
 * ```tsx
 * const respondPermission = useRespondAgentPermission();
 *
 * <div>
 *   <button onClick={() => respondPermission.mutate({
 *     sessionId,
 *     permissionId: permission.id,
 *     approved: true,
 *   })}>
 *     Approve
 *   </button>
 *   <button onClick={() => respondPermission.mutate({
 *     sessionId,
 *     permissionId: permission.id,
 *     approved: false,
 *   })}>
 *     Deny
 *   </button>
 * </div>
 * ```
 */
export function useRespondAgentPermission(): UseMutationResult<
  Permission,
  Error,
  { sessionId: string; permissionId: string; approved: boolean }
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ sessionId, permissionId, approved }) =>
      agentSessionQueries.respondToPermission(sessionId, permissionId, approved),
    onSuccess: (permission, variables) => {
      logger.info('Permission response sent', {
        sessionId: variables.sessionId,
        permissionId: variables.permissionId,
        approved: variables.approved,
        status: permission.status,
      });
      // Invalidate pending permission query
      queryClient.invalidateQueries({
        queryKey: agentSessionKeys.pendingPermission(variables.sessionId),
      });
      // Invalidate session state
      queryClient.invalidateQueries({
        queryKey: agentSessionKeys.sessionWithState(variables.sessionId),
      });
      // Invalidate events as agent may produce new output
      queryClient.invalidateQueries({
        queryKey: agentSessionKeys.events(),
      });
    },
    onError: (error, variables) => {
      logger.error('Failed to respond to permission', {
        sessionId: variables.sessionId,
        permissionId: variables.permissionId,
        error: error.message,
      });
    },
  });
}

// =============================================================================
// Active Session Hooks
// =============================================================================

/**
 * Check if a session is currently active in the orchestrator.
 *
 * @param sessionId - Session ID
 * @param options - Query options
 * @returns Query result with boolean
 */
export function useIsAgentSessionActive(
  sessionId: string,
  options?: { enabled?: boolean; refetchInterval?: number | false }
): UseQueryResult<boolean> {
  return useQuery({
    queryKey: agentSessionKeys.isActive(sessionId),
    queryFn: () => agentSessionQueries.isActive(sessionId),
    enabled: Boolean(sessionId) && options?.enabled !== false,
    refetchInterval: options?.refetchInterval,
  });
}

/**
 * Get count of active sessions in the orchestrator.
 *
 * @param options - Query options
 * @returns Query result with count
 */
export function useActiveAgentSessionCount(options?: {
  enabled?: boolean;
  refetchInterval?: number | false;
}): UseQueryResult<number> {
  return useQuery({
    queryKey: agentSessionKeys.activeCount(),
    queryFn: () => agentSessionQueries.activeCount(),
    enabled: options?.enabled !== false,
    refetchInterval: options?.refetchInterval,
  });
}

/**
 * List all active session IDs in the orchestrator.
 *
 * @param options - Query options
 * @returns Query result with array of session IDs
 */
export function useActiveAgentSessions(options?: {
  enabled?: boolean;
  refetchInterval?: number | false;
}): UseQueryResult<string[]> {
  return useQuery({
    queryKey: agentSessionKeys.listActive(),
    queryFn: () => agentSessionQueries.listActive(),
    enabled: options?.enabled !== false,
    refetchInterval: options?.refetchInterval,
  });
}

// =============================================================================
// Session Control Mutations
// =============================================================================

/**
 * Kill an agent session.
 *
 * @returns Mutation for killing a session
 *
 * @example
 * ```tsx
 * const killSession = useKillAgentSession();
 *
 * <button onClick={() => killSession.mutate(sessionId)} disabled={killSession.isPending}>
 *   {killSession.isPending ? 'Killing...' : 'Kill Session'}
 * </button>
 * ```
 */
export function useKillAgentSession(): UseMutationResult<AgentSession, Error, string> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (sessionId: string) => agentSessionQueries.kill(sessionId),
    onSuccess: (session) => {
      logger.info('Agent session killed', { sessionId: session.id, status: session.status });
      // Invalidate session queries
      queryClient.invalidateQueries({ queryKey: agentSessionKeys.session(session.id) });
      queryClient.invalidateQueries({ queryKey: agentSessionKeys.sessionWithState(session.id) });
      queryClient.invalidateQueries({ queryKey: agentSessionKeys.lists() });
      queryClient.invalidateQueries({ queryKey: agentSessionKeys.active() });
    },
    onError: (error, sessionId) => {
      logger.error('Failed to kill agent session', { sessionId, error: error.message });
    },
  });
}

/**
 * Write input to an active agent session.
 *
 * @returns Mutation for writing input
 */
export function useWriteAgentInput(): UseMutationResult<
  void,
  Error,
  { sessionId: string; input: string }
> {
  return useMutation({
    mutationFn: ({ sessionId, input }) => agentSessionQueries.writeInput(sessionId, input),
    onSuccess: (_data, variables) => {
      logger.debug('Input written to session', { sessionId: variables.sessionId });
    },
    onError: (error, variables) => {
      logger.error('Failed to write input to session', {
        sessionId: variables.sessionId,
        error: error.message,
      });
    },
  });
}

/**
 * Resize the terminal for an active agent session.
 *
 * @returns Mutation for resizing terminal
 */
export function useResizeAgentTerminal(): UseMutationResult<
  void,
  Error,
  { sessionId: string; cols: number; rows: number }
> {
  return useMutation({
    mutationFn: ({ sessionId, cols, rows }) => agentSessionQueries.resize(sessionId, cols, rows),
    onSuccess: (_data, variables) => {
      logger.debug('Agent terminal resized', {
        sessionId: variables.sessionId,
        cols: variables.cols,
        rows: variables.rows,
      });
    },
    onError: (error, variables) => {
      logger.error('Failed to resize agent terminal', {
        sessionId: variables.sessionId,
        error: error.message,
      });
    },
  });
}

/**
 * Get raw terminal output for an agent session.
 *
 * @param sessionId - Session ID
 * @param options - Query options
 * @returns Query result with raw output string
 */
export function useAgentRawOutput(
  sessionId: string,
  options?: { enabled?: boolean; refetchInterval?: number | false }
): UseQueryResult<string> {
  return useQuery({
    queryKey: agentSessionKeys.rawOutput(sessionId),
    queryFn: () => agentSessionQueries.getRawOutput(sessionId),
    enabled: Boolean(sessionId) && options?.enabled !== false,
    refetchInterval: options?.refetchInterval,
  });
}

/**
 * Options for useAgentRawStream hook.
 */
export interface UseAgentRawStreamOptions {
  /** Whether to enable the subscription */
  enabled?: boolean;
  /** Callback when raw output data is received */
  onData?: (data: string) => void;
}

/**
 * Subscribe to raw terminal output stream for an agent session.
 *
 * This hook subscribes to the raw-output-{sessionId} channel and provides
 * real-time streaming of raw PTY output for terminal display. Unlike
 * useAgentRawOutput which polls the buffered output, this hook receives
 * output as it's produced by the agent process.
 *
 * The hook follows the "pure view layer" principle:
 * - Does NOT accumulate output in local state
 * - Invalidates the raw output query cache on new data
 * - Provides optional callback for custom handling (e.g., appending to terminal)
 *
 * @param sessionId - Session ID to subscribe to
 * @param options - Subscription options
 * @returns Query result with current raw output string
 *
 * @example
 * ```tsx
 * function AgentTerminal({ sessionId }: { sessionId: string }) {
 *   const terminalRef = useRef<HTMLDivElement>(null);
 *
 *   // Subscribe to raw output stream
 *   const { data: output } = useAgentRawStream(sessionId, {
 *     onData: (chunk) => {
 *       // Append new chunk to terminal display
 *       if (terminalRef.current) {
 *         terminalRef.current.textContent += chunk;
 *       }
 *     },
 *   });
 *
 *   return (
 *     <div>
 *       <div ref={terminalRef}>{output}</div>
 *     </div>
 *   );
 * }
 * ```
 */
export function useAgentRawStream(
  sessionId: string,
  options?: UseAgentRawStreamOptions
): UseQueryResult<string> {
  const { enabled = true, onData } = options ?? {};

  // Subscribe to raw output channel
  useEventSubscription<string>(sessionId ? rawOutputChannel(sessionId) : null, {
    enabled: enabled && Boolean(sessionId),
    invalidateKeys: [agentSessionKeys.rawOutput(sessionId)],
    onEvent: (data: string) => {
      logger.debug('Raw output received', {
        sessionId,
        length: data.length,
      });

      // Call optional callback
      if (onData) {
        try {
          onData(data);
        } catch (error) {
          logger.error('Error in onData callback', {
            sessionId,
            error: error instanceof Error ? error.message : String(error),
          });
        }
      }
    },
  });

  // Query the current buffered raw output
  return useQuery({
    queryKey: agentSessionKeys.rawOutput(sessionId),
    queryFn: () => agentSessionQueries.getRawOutput(sessionId),
    enabled: Boolean(sessionId) && enabled,
    // Don't poll - rely on WebSocket subscription for updates
    refetchInterval: false,
  });
}

/**
 * Recover stale agent sessions.
 *
 * @returns Mutation for recovering stale sessions
 */
export function useRecoverStaleSessions(): UseMutationResult<number, Error, void> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => agentSessionQueries.recoverStaleSessions(),
    onSuccess: (count) => {
      logger.info('Stale sessions recovered', { count });
      // Invalidate all session queries
      queryClient.invalidateQueries({ queryKey: agentSessionKeys.all });
    },
    onError: (error) => {
      logger.error('Failed to recover stale sessions', { error: error.message });
    },
  });
}

// =============================================================================
// Tool State Hooks
// =============================================================================

/**
 * Options for useAgentToolStates hook.
 */
export interface UseAgentToolStatesOptions {
  /** Whether to enable the query */
  enabled?: boolean;
  /** Polling interval in ms (default: disabled) */
  refetchInterval?: number | false;
}

/**
 * Get all tool states for an agent session.
 *
 * Tool states track individual tool invocations from ToolUse event to ToolResult.
 * Each tool state includes execution metadata, status, results, and timing information.
 *
 * This hook is useful for:
 * - Displaying tool execution progress in the UI
 * - Showing running tools with their commands/file paths
 * - Analyzing tool execution history and performance
 * - Debugging tool failures with exit codes and stderr
 *
 * The hook supports polling for real-time updates during active sessions.
 * Tool states are ordered chronologically (by started_at ASC).
 *
 * @param sessionId - Session ID
 * @param options - Query options
 * @returns Query result with array of ToolState
 *
 * @example
 * ```tsx
 * function ToolStateList({ sessionId }: { sessionId: string }) {
 *   const { data: sessionState } = useAgentSessionWithState(sessionId);
 *   const isRunning = sessionState?.session.status === 'running';
 *
 *   // Get tool states with polling while session is running
 *   const { data: toolStates, isLoading } = useAgentToolStates(sessionId, {
 *     refetchInterval: isRunning ? 1000 : false,
 *   });
 *
 *   if (isLoading) return <Loading />;
 *
 *   // Separate by status
 *   const running = toolStates?.filter((t) => t.status === 'running') || [];
 *   const completed = toolStates?.filter((t) => t.status === 'completed') || [];
 *   const errored = toolStates?.filter((t) => t.status === 'error') || [];
 *
 *   return (
 *     <div>
 *       <h3>Running Tools ({running.length})</h3>
 *       {running.map((tool) => (
 *         <ToolCard key={tool.id} tool={tool} />
 *       ))}
 *
 *       <h3>Completed ({completed.length})</h3>
 *       {completed.map((tool) => (
 *         <ToolCard key={tool.id} tool={tool} />
 *       ))}
 *
 *       {errored.length > 0 && (
 *         <>
 *           <h3>Failed ({errored.length})</h3>
 *           {errored.map((tool) => (
 *             <ToolCard key={tool.id} tool={tool} showError />
 *           ))}
 *         </>
 *       )}
 *     </div>
 *   );
 * }
 * ```
 *
 * @example
 * ```tsx
 * // Display tool execution statistics
 * function ToolStats({ sessionId }: { sessionId: string }) {
 *   const { data: toolStates } = useAgentToolStates(sessionId);
 *
 *   if (!toolStates) return null;
 *
 *   const totalDuration = toolStates
 *     .filter((t) => t.durationMs)
 *     .reduce((sum, t) => sum + (t.durationMs || 0), 0);
 *
 *   const avgDuration = toolStates.length > 0
 *     ? totalDuration / toolStates.length
 *     : 0;
 *
 *   const successRate = toolStates.length > 0
 *     ? (toolStates.filter((t) => t.status === 'completed').length / toolStates.length) * 100
 *     : 0;
 *
 *   return (
 *     <div>
 *       <p>Total Tools: {toolStates.length}</p>
 *       <p>Total Duration: {totalDuration}ms</p>
 *       <p>Average Duration: {avgDuration.toFixed(0)}ms</p>
 *       <p>Success Rate: {successRate.toFixed(1)}%</p>
 *     </div>
 *   );
 * }
 * ```
 *
 * @example
 * ```tsx
 * // Show currently running bash commands
 * function RunningCommands({ sessionId }: { sessionId: string }) {
 *   const { data: toolStates } = useAgentToolStates(sessionId, {
 *     refetchInterval: 1000,
 *   });
 *
 *   const runningBashTools = toolStates?.filter(
 *     (t) => t.status === 'running' && t.command
 *   ) || [];
 *
 *   if (runningBashTools.length === 0) return null;
 *
 *   return (
 *     <div>
 *       <h4>Running Commands</h4>
 *       {runningBashTools.map((tool) => (
 *         <div key={tool.id}>
 *           <code>{tool.command}</code>
 *           <span>Started: {new Date(tool.startedAt).toLocaleTimeString()}</span>
 *         </div>
 *       ))}
 *     </div>
 *   );
 * }
 * ```
 */
export function useAgentToolStates(
  sessionId: string,
  options?: UseAgentToolStatesOptions
): UseQueryResult<ToolState[]> {
  const { enabled = true, refetchInterval } = options ?? {};

  return useQuery({
    queryKey: agentSessionKeys.toolStates(sessionId),
    queryFn: () => agentSessionQueries.getToolStates(sessionId),
    enabled: Boolean(sessionId) && enabled,
    refetchInterval,
  });
}
