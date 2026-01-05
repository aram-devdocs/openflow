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
  Permission,
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
