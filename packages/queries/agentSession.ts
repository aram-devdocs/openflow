/**
 * Agent Session Query Functions
 *
 * Query and mutation functions for agent session management.
 * Agent sessions represent individual runs of AI coding tools
 * (Claude Code, Gemini CLI, Codex CLI) and their associated events.
 *
 * These wrap backend commands for:
 * - Session queries (get, list, summaries)
 * - Event retrieval with sequence-based pagination
 * - Permission handling (get pending, respond)
 * - Session control (kill, resize, write input)
 * - Active session management
 *
 * @example
 * ```ts
 * // Get session with full state
 * const session = await agentSessionQueries.getWithState('session-123');
 * console.log(`Events: ${session.eventCount}, Tools: ${session.toolCount}`);
 *
 * // Get events with polling support
 * const events = await agentSessionQueries.getEvents('session-123', { afterSequence: 42 });
 *
 * // Respond to permission request
 * await agentSessionQueries.respondToPermission('session-123', 'perm-456', true);
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
import { createLogger } from '@openflow/utils';
import { invoke } from './utils.js';

const logger = createLogger('queries:agentSession');

// =============================================================================
// Agent Session Queries
// =============================================================================

/**
 * Agent session query wrappers for Tauri IPC.
 * These functions provide the interface to agent session management.
 *
 * @example
 * ```ts
 * // Get session with state for UI display
 * const sessionState = await agentSessionQueries.getWithState('session-123');
 *
 * // Poll for new events
 * let lastSequence = 0;
 * while (sessionState.session.status === 'running') {
 *   const events = await agentSessionQueries.getEvents('session-123', { afterSequence: lastSequence });
 *   if (events.length > 0) {
 *     lastSequence = events[events.length - 1].sequence;
 *     processEvents(events);
 *   }
 *   await sleep(500);
 * }
 * ```
 */
export const agentSessionQueries = {
  // ===========================================================================
  // Session Query Operations
  // ===========================================================================

  /**
   * Get an agent session by ID.
   *
   * Returns the full session record including status, provider info,
   * and timestamps.
   *
   * @param sessionId - Session ID
   * @returns Promise resolving to the session
   * @throws Error if session not found
   */
  get: async (sessionId: string): Promise<AgentSession> => {
    logger.debug('Getting agent session', { sessionId });

    try {
      // Pass both id (for HTTP) and sessionId (for Tauri)
      const session = await invoke<AgentSession>('get_agent_session', { id: sessionId, sessionId });

      logger.debug('Agent session retrieved', {
        id: session.id,
        providerId: session.providerId,
        status: session.status,
      });

      return session;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Failed to get agent session', { sessionId, error: errorMessage });
      throw error;
    }
  },

  /**
   * Get an agent session with full state.
   *
   * Returns the session along with event count, tool counts, and any
   * pending permission request. This is the primary query for displaying
   * session progress in the UI.
   *
   * @param sessionId - Session ID
   * @returns Promise resolving to session with state
   * @throws Error if session not found
   */
  getWithState: async (sessionId: string): Promise<AgentSessionWithState> => {
    logger.debug('Getting agent session with state', { sessionId });

    try {
      // Pass both id (for HTTP) and sessionId (for Tauri)
      const result = await invoke<AgentSessionWithState>('get_agent_session_with_state', {
        id: sessionId,
        sessionId,
      });

      logger.debug('Agent session with state retrieved', {
        id: result.session.id,
        status: result.session.status,
        eventCount: result.eventCount,
        toolCount: result.toolCount,
        pendingToolCount: result.pendingToolCount,
        hasPendingPermission: !!result.pendingPermission,
      });

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Failed to get agent session with state', { sessionId, error: errorMessage });
      throw error;
    }
  },

  /**
   * Get a lightweight session summary for UI lists.
   *
   * Contains essential fields for displaying sessions in lists,
   * plus computed fields for progress indication.
   *
   * @param sessionId - Session ID
   * @returns Promise resolving to session summary
   * @throws Error if session not found
   */
  getSummary: async (sessionId: string): Promise<AgentSessionSummary> => {
    logger.debug('Getting agent session summary', { sessionId });

    try {
      // Pass both id (for HTTP) and sessionId (for Tauri)
      const summary = await invoke<AgentSessionSummary>('get_agent_session_summary', {
        id: sessionId,
        sessionId,
      });

      logger.debug('Agent session summary retrieved', {
        id: summary.id,
        status: summary.status,
        eventCount: summary.eventCount,
        toolCount: summary.toolCount,
        hasPendingPermission: summary.hasPendingPermission,
      });

      return summary;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Failed to get agent session summary', { sessionId, error: errorMessage });
      throw error;
    }
  },

  /**
   * List all sessions for a process.
   *
   * Returns sessions ordered by created_at descending (most recent first).
   *
   * @param processId - Process ID
   * @returns Promise resolving to array of sessions
   */
  listByProcess: async (processId: string): Promise<AgentSession[]> => {
    logger.debug('Listing agent sessions by process', { processId });

    try {
      const sessions = await invoke<AgentSession[]>('list_agent_sessions_by_process', {
        processId,
      });

      logger.debug('Agent sessions listed', {
        processId,
        count: sessions.length,
      });

      return sessions;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Failed to list agent sessions by process', {
        processId,
        error: errorMessage,
      });
      throw error;
    }
  },

  /**
   * List all currently running sessions from the database.
   *
   * Returns all sessions with status 'running', ordered by started_at descending.
   * Note: This queries the database, not the in-memory orchestrator.
   *
   * @returns Promise resolving to array of running sessions
   */
  listRunning: async (): Promise<AgentSession[]> => {
    logger.debug('Listing running agent sessions');

    try {
      const sessions = await invoke<AgentSession[]>('list_running_agent_sessions');

      logger.debug('Running agent sessions listed', { count: sessions.length });

      return sessions;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Failed to list running agent sessions', { error: errorMessage });
      throw error;
    }
  },

  // ===========================================================================
  // Event Query Operations
  // ===========================================================================

  /**
   * Get events for an agent session.
   *
   * Returns events ordered by sequence (ascending). Use `afterSequence` to
   * get only new events since a previous fetch for efficient polling.
   *
   * @param sessionId - Session ID
   * @param options - Query options
   * @param options.afterSequence - Only return events with sequence > this value
   * @returns Promise resolving to array of events
   */
  getEvents: async (
    sessionId: string,
    options?: { afterSequence?: number }
  ): Promise<AgentEventRecord[]> => {
    logger.debug('Getting agent session events', {
      sessionId,
      afterSequence: options?.afterSequence,
    });

    try {
      // Pass both id (for HTTP) and sessionId (for Tauri)
      const events = await invoke<AgentEventRecord[]>('get_agent_session_events', {
        id: sessionId,
        sessionId,
        afterSequence: options?.afterSequence,
      });

      logger.debug('Agent session events retrieved', {
        sessionId,
        count: events.length,
        latestSequence: events.length > 0 ? events[events.length - 1]?.sequence : null,
      });

      return events;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Failed to get agent session events', {
        sessionId,
        error: errorMessage,
      });
      throw error;
    }
  },

  /**
   * Get the latest sequence number for a session.
   *
   * Returns the highest sequence number in the session's events,
   * or null if the session has no events.
   *
   * @param sessionId - Session ID
   * @returns Promise resolving to latest sequence or null
   */
  getLatestSequence: async (sessionId: string): Promise<number | null> => {
    logger.debug('Getting latest sequence for session', { sessionId });

    try {
      // Pass both id (for HTTP) and sessionId (for Tauri)
      const sequence = await invoke<number | null>('get_agent_latest_sequence', {
        id: sessionId,
        sessionId,
      });

      logger.debug('Latest sequence retrieved', { sessionId, sequence });

      return sequence;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Failed to get latest sequence', { sessionId, error: errorMessage });
      throw error;
    }
  },

  /**
   * Count events for a session.
   *
   * Returns the total number of events in the session.
   *
   * @param sessionId - Session ID
   * @returns Promise resolving to event count
   */
  countEvents: async (sessionId: string): Promise<number> => {
    logger.debug('Counting agent session events', { sessionId });

    try {
      // Pass both id (for HTTP) and sessionId (for Tauri)
      const count = await invoke<number>('count_agent_session_events', {
        id: sessionId,
        sessionId,
      });

      logger.debug('Agent session events counted', { sessionId, count });

      return count;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Failed to count agent session events', {
        sessionId,
        error: errorMessage,
      });
      throw error;
    }
  },

  /**
   * Get normalized events for an agent session.
   *
   * Returns normalized events ordered by sequence (ascending). Use `afterSequence` to
   * get only new events since a previous fetch for efficient polling.
   *
   * Normalized events are the canonical format for all agent events after
   * transformation from provider-specific formats. They include rich metadata
   * and are suitable for UI rendering.
   *
   * @param sessionId - Session ID
   * @param options - Query options
   * @param options.afterSequence - Only return events with sequence > this value
   * @returns Promise resolving to array of normalized events
   */
  getNormalizedEvents: async (
    sessionId: string,
    options?: { afterSequence?: number }
  ): Promise<NormalizedEntry[]> => {
    logger.debug('Getting normalized events', {
      sessionId,
      afterSequence: options?.afterSequence,
    });

    try {
      // Pass both id (for HTTP) and sessionId (for Tauri)
      const events = await invoke<NormalizedEntry[]>('get_normalized_events', {
        id: sessionId,
        sessionId,
        afterSequence: options?.afterSequence,
      });

      logger.debug('Normalized events retrieved', {
        sessionId,
        count: events.length,
        latestSequence: events.length > 0 ? events[events.length - 1]?.sequence : null,
      });

      return events;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Failed to get normalized events', {
        sessionId,
        error: errorMessage,
      });
      throw error;
    }
  },

  // ===========================================================================
  // Permission Operations
  // ===========================================================================

  /**
   * Get the pending permission for a session.
   *
   * Returns the current pending permission request if one exists.
   * Only one permission can be pending at a time per session.
   *
   * @param sessionId - Session ID
   * @returns Promise resolving to permission or null if none pending
   */
  getPendingPermission: async (sessionId: string): Promise<Permission | null> => {
    logger.debug('Getting pending permission', { sessionId });

    try {
      // Pass both id (for HTTP) and sessionId (for Tauri)
      const permission = await invoke<Permission | null>('get_agent_pending_permission', {
        id: sessionId,
        sessionId,
      });

      if (permission) {
        logger.debug('Pending permission found', {
          sessionId,
          permissionId: permission.id,
          toolName: permission.toolName,
        });
      } else {
        logger.debug('No pending permission', { sessionId });
      }

      return permission;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Failed to get pending permission', { sessionId, error: errorMessage });
      throw error;
    }
  },

  /**
   * Respond to a permission request.
   *
   * Approves or denies the permission request and sends the response
   * to the agent. The agent will continue or abort based on the response.
   *
   * @param sessionId - Session ID
   * @param permissionId - Permission request ID
   * @param approved - Whether to approve (true) or deny (false)
   * @returns Promise resolving to the updated permission
   */
  respondToPermission: async (
    sessionId: string,
    permissionId: string,
    approved: boolean
  ): Promise<Permission> => {
    logger.debug('Responding to permission', { sessionId, permissionId, approved });

    try {
      // Pass both id (for HTTP) and sessionId (for Tauri)
      const permission = await invoke<Permission>('respond_agent_permission', {
        id: sessionId,
        sessionId,
        permissionId,
        approved,
      });

      logger.info('Permission response sent', {
        sessionId,
        permissionId,
        approved,
        status: permission.status,
      });

      return permission;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Failed to respond to permission', {
        sessionId,
        permissionId,
        approved,
        error: errorMessage,
      });
      throw error;
    }
  },

  // ===========================================================================
  // Session Control Operations
  // ===========================================================================

  /**
   * Check if a session is currently active in the orchestrator.
   *
   * An active session has a running process being monitored by the orchestrator.
   * This is different from database status - a session can be "running" in the DB
   * but not active (e.g., after a crash).
   *
   * @param sessionId - Session ID
   * @returns Promise resolving to true if active
   */
  isActive: async (sessionId: string): Promise<boolean> => {
    logger.debug('Checking if session is active', { sessionId });

    try {
      // Pass both id (for HTTP) and sessionId (for Tauri)
      const active = await invoke<boolean>('is_agent_session_active', { id: sessionId, sessionId });

      logger.debug('Session active status', { sessionId, active });

      return active;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Failed to check session active status', {
        sessionId,
        error: errorMessage,
      });
      throw error;
    }
  },

  /**
   * Get the count of active sessions in the orchestrator.
   *
   * @returns Promise resolving to count of active sessions
   */
  activeCount: async (): Promise<number> => {
    logger.debug('Getting active session count');

    try {
      const count = await invoke<number>('active_agent_session_count');

      logger.debug('Active session count', { count });

      return count;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Failed to get active session count', { error: errorMessage });
      throw error;
    }
  },

  /**
   * List all active session IDs in the orchestrator.
   *
   * @returns Promise resolving to array of active session IDs
   */
  listActive: async (): Promise<string[]> => {
    logger.debug('Listing active sessions');

    try {
      const ids = await invoke<string[]>('list_active_agent_sessions');

      logger.debug('Active sessions listed', { count: ids.length });

      return ids;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Failed to list active sessions', { error: errorMessage });
      throw error;
    }
  },

  /**
   * Kill an agent session.
   *
   * Terminates the agent process and marks the session as killed.
   * Pending permissions and tools will be cancelled/failed.
   *
   * @param sessionId - Session ID to kill
   * @returns Promise resolving to the updated session
   */
  kill: async (sessionId: string): Promise<AgentSession> => {
    logger.debug('Killing agent session', { sessionId });

    try {
      // Pass both id (for HTTP) and sessionId (for Tauri)
      const session = await invoke<AgentSession>('kill_agent_session', {
        id: sessionId,
        sessionId,
      });

      logger.info('Agent session killed', {
        id: session.id,
        status: session.status,
      });

      return session;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Failed to kill agent session', { sessionId, error: errorMessage });
      throw error;
    }
  },

  /**
   * Write input to an active agent session.
   *
   * Sends the provided input to the agent's stdin. The session must be
   * currently active in the orchestrator.
   *
   * @param sessionId - Session ID
   * @param input - Input string to send
   */
  writeInput: async (sessionId: string, input: string): Promise<void> => {
    logger.debug('Writing input to session', { sessionId, inputLength: input.length });

    try {
      // Pass both id (for HTTP) and sessionId (for Tauri)
      await invoke<void>('write_agent_input', { id: sessionId, sessionId, input });

      logger.debug('Input written to session', { sessionId });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Failed to write input to session', {
        sessionId,
        error: errorMessage,
      });
      throw error;
    }
  },

  /**
   * Resize the terminal for an active agent session.
   *
   * Updates the PTY size for the agent process.
   *
   * @param sessionId - Session ID
   * @param cols - Number of columns
   * @param rows - Number of rows
   */
  resize: async (sessionId: string, cols: number, rows: number): Promise<void> => {
    logger.debug('Resizing agent terminal', { sessionId, cols, rows });

    try {
      // Pass both id (for HTTP) and sessionId (for Tauri)
      await invoke<void>('resize_agent_terminal', { id: sessionId, sessionId, cols, rows });

      logger.debug('Agent terminal resized', { sessionId, cols, rows });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Failed to resize agent terminal', {
        sessionId,
        cols,
        rows,
        error: errorMessage,
      });
      throw error;
    }
  },

  /**
   * Get raw terminal output for an agent session.
   *
   * Returns the buffered raw PTY output for terminal display.
   * Only available for active sessions.
   *
   * @param sessionId - Session ID
   * @returns Promise resolving to raw output string
   */
  getRawOutput: async (sessionId: string): Promise<string> => {
    logger.debug('Getting raw output for session', { sessionId });

    try {
      // Pass both id (for HTTP) and sessionId (for Tauri)
      const output = await invoke<string>('get_agent_raw_output', { id: sessionId, sessionId });

      logger.debug('Raw output retrieved', { sessionId, length: output.length });

      return output;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Failed to get raw output', { sessionId, error: errorMessage });
      throw error;
    }
  },

  /**
   * Recover stale agent sessions on startup.
   *
   * Finds sessions marked as running in the database that aren't actually
   * active (e.g., from a previous crash) and finalizes them.
   *
   * @returns Promise resolving to the number of sessions recovered
   */
  recoverStaleSessions: async (): Promise<number> => {
    logger.debug('Recovering stale sessions');

    try {
      const count = await invoke<number>('recover_stale_agent_sessions');

      logger.info('Stale sessions recovered', { count });

      return count;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Failed to recover stale sessions', { error: errorMessage });
      throw error;
    }
  },

  // ===========================================================================
  // Tool State Operations
  // ===========================================================================

  /**
   * Get all tool states for an agent session.
   *
   * Returns tool states ordered by started_at ASC (chronological order).
   * Tool states track individual tool invocations from ToolUse event to ToolResult.
   *
   * Each tool state includes:
   * - Tool execution metadata (name, input, command, file_path)
   * - Status (running, completed, error)
   * - Execution results (output, exit_code, stderr)
   * - Timing information (started_at, completed_at, duration_ms)
   *
   * @param sessionId - Session ID
   * @returns Promise resolving to array of tool states
   *
   * @example
   * ```ts
   * // Get all tool states for a session
   * const toolStates = await agentSessionQueries.getToolStates('session-123');
   *
   * // Filter by status
   * const running = toolStates.filter(t => t.status === 'running');
   * const completed = toolStates.filter(t => t.status === 'completed');
   *
   * // Calculate total execution time
   * const totalDuration = toolStates
   *   .filter(t => t.durationMs)
   *   .reduce((sum, t) => sum + (t.durationMs || 0), 0);
   * ```
   */
  getToolStates: async (sessionId: string): Promise<ToolState[]> => {
    logger.debug('Getting tool states for session', { sessionId });

    try {
      // Pass both id (for HTTP) and sessionId (for Tauri)
      const toolStates = await invoke<ToolState[]>('get_agent_tool_states', {
        id: sessionId,
        sessionId,
      });

      logger.debug('Tool states retrieved', {
        sessionId,
        count: toolStates.length,
        running: toolStates.filter((t) => t.status === 'running').length,
        completed: toolStates.filter((t) => t.status === 'completed').length,
        error: toolStates.filter((t) => t.status === 'error').length,
      });

      return toolStates;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Failed to get tool states', { sessionId, error: errorMessage });
      throw error;
    }
  },
};
