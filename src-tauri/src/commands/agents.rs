//! Tauri commands for agent session operations.
//!
//! These commands provide the IPC interface for agent session queries,
//! event retrieval, and permission handling.
//!
//! Agent sessions represent individual runs of AI coding tools (Claude Code,
//! Gemini CLI, etc.) and their associated events and tool states.
//!
//! Each command is a thin wrapper around openflow_core::services::agent_session
//! and AgentOrchestrator methods.

use tauri::State;

use crate::commands::AppState;
use openflow_contracts::{
    AgentEventRecord, AgentSession, AgentSessionSummary, AgentSessionWithState, Permission,
};
use openflow_core::services::agent_session;

// =============================================================================
// Session Query Commands
// =============================================================================

/// Get an agent session by ID.
///
/// Returns the full session record including status, provider info,
/// and timestamps.
#[tauri::command]
pub async fn get_agent_session(
    state: State<'_, AppState>,
    session_id: String,
) -> Result<AgentSession, String> {
    let pool = state.db.lock().await;
    agent_session::get(&pool, &session_id)
        .await
        .map_err(|e| e.to_string())
}

/// Get an agent session with full state.
///
/// Returns the session along with event count, tool counts, and any
/// pending permission request. This is the primary query for displaying
/// session progress in the UI.
#[tauri::command]
pub async fn get_agent_session_with_state(
    state: State<'_, AppState>,
    session_id: String,
) -> Result<AgentSessionWithState, String> {
    let pool = state.db.lock().await;
    agent_session::get_with_state(&pool, &session_id)
        .await
        .map_err(|e| e.to_string())
}

/// Get an agent session summary for lightweight UI display.
///
/// Returns a compact view with status, event count, tool count,
/// and whether there's a pending permission.
#[tauri::command]
pub async fn get_agent_session_summary(
    state: State<'_, AppState>,
    session_id: String,
) -> Result<AgentSessionSummary, String> {
    let pool = state.db.lock().await;
    agent_session::get_summary(&pool, &session_id)
        .await
        .map_err(|e| e.to_string())
}

/// List all sessions for a process.
///
/// Returns sessions ordered by created_at descending (most recent first).
#[tauri::command]
pub async fn list_agent_sessions_by_process(
    state: State<'_, AppState>,
    process_id: String,
) -> Result<Vec<AgentSession>, String> {
    let pool = state.db.lock().await;
    agent_session::list_by_process(&pool, &process_id)
        .await
        .map_err(|e| e.to_string())
}

/// List all currently running sessions.
///
/// Returns all sessions with status 'running', ordered by started_at descending.
#[tauri::command]
pub async fn list_running_agent_sessions(
    state: State<'_, AppState>,
) -> Result<Vec<AgentSession>, String> {
    let pool = state.db.lock().await;
    agent_session::list_running(&pool)
        .await
        .map_err(|e| e.to_string())
}

// =============================================================================
// Event Query Commands
// =============================================================================

/// Get events for an agent session.
///
/// Returns events ordered by sequence (ascending). Use `after_sequence` to
/// get only new events since a previous fetch for efficient polling.
///
/// # Arguments
/// * `session_id` - The session to get events for
/// * `after_sequence` - Only return events with sequence > this value
#[tauri::command]
pub async fn get_agent_session_events(
    state: State<'_, AppState>,
    session_id: String,
    after_sequence: Option<i32>,
) -> Result<Vec<AgentEventRecord>, String> {
    let pool = state.db.lock().await;
    agent_session::get_events(&pool, &session_id, after_sequence.map(|s| s as i64))
        .await
        .map_err(|e| e.to_string())
}

/// Get the latest sequence number for a session.
///
/// Returns the highest sequence number in the session's events,
/// or None if the session has no events.
#[tauri::command]
pub async fn get_agent_latest_sequence(
    state: State<'_, AppState>,
    session_id: String,
) -> Result<Option<i64>, String> {
    let pool = state.db.lock().await;
    agent_session::get_latest_sequence(&pool, &session_id)
        .await
        .map_err(|e| e.to_string())
}

/// Count events for a session.
///
/// Returns the total number of events in the session.
#[tauri::command]
pub async fn count_agent_session_events(
    state: State<'_, AppState>,
    session_id: String,
) -> Result<i64, String> {
    let pool = state.db.lock().await;
    agent_session::count_events(&pool, &session_id)
        .await
        .map_err(|e| e.to_string())
}

// =============================================================================
// Permission Commands
// =============================================================================

/// Respond to a permission request for an agent session.
///
/// When an agent (like Claude Code) requests permission to perform an action
/// (e.g., write a file, execute a command), this command sends the user's
/// response back to the agent.
///
/// # Arguments
/// * `session_id` - The session the permission belongs to
/// * `permission_id` - The permission request ID
/// * `approved` - Whether to approve (true) or deny (false) the request
///
/// Note: This command uses the AgentOrchestrator which will:
/// 1. Update the permission status in the database
/// 2. Send the approval/denial to the agent's stdin
/// 3. Create an audit log entry
#[tauri::command]
pub async fn respond_agent_permission(
    state: State<'_, AppState>,
    session_id: String,
    permission_id: String,
    approved: bool,
) -> Result<Permission, String> {
    state
        .agent_orchestrator
        .handle_permission(&session_id, &permission_id, approved)
        .await
        .map_err(|e| e.to_string())
}

/// Get the pending permission for a session.
///
/// Returns the current pending permission request if one exists, or None
/// if there is no pending permission. Only one permission can be pending
/// at a time per session.
#[tauri::command]
pub async fn get_agent_pending_permission(
    state: State<'_, AppState>,
    session_id: String,
) -> Result<Option<Permission>, String> {
    let pool = state.db.lock().await;
    agent_session::get_pending_permission(&pool, &session_id)
        .await
        .map_err(|e| e.to_string())
}

// =============================================================================
// Session Control Commands
// =============================================================================

/// Check if an agent session is currently active.
///
/// An active session has a running process being monitored by the orchestrator.
#[tauri::command]
pub async fn is_agent_session_active(
    state: State<'_, AppState>,
    session_id: String,
) -> Result<bool, String> {
    Ok(state.agent_orchestrator.is_active(&session_id).await)
}

/// Get the number of active agent sessions.
#[tauri::command]
pub async fn active_agent_session_count(state: State<'_, AppState>) -> Result<usize, String> {
    Ok(state.agent_orchestrator.active_count().await)
}

/// List all active agent session IDs.
#[tauri::command]
pub async fn list_active_agent_sessions(state: State<'_, AppState>) -> Result<Vec<String>, String> {
    Ok(state.agent_orchestrator.list_active().await)
}

/// Kill an agent session.
///
/// This terminates the agent process and marks the session as killed.
/// Pending permissions and tools will be cancelled/failed.
#[tauri::command]
pub async fn kill_agent_session(
    state: State<'_, AppState>,
    session_id: String,
) -> Result<AgentSession, String> {
    state
        .agent_orchestrator
        .kill_agent(&session_id)
        .await
        .map_err(|e| e.to_string())
}

/// Write input to an active agent session.
///
/// Sends the provided input to the agent's stdin. The session must be
/// currently active.
#[tauri::command]
pub async fn write_agent_input(
    state: State<'_, AppState>,
    session_id: String,
    input: String,
) -> Result<(), String> {
    state
        .agent_orchestrator
        .write_input(&session_id, input.as_bytes())
        .await
        .map_err(|e| e.to_string())
}

/// Resize the terminal for an active agent session.
///
/// Updates the PTY size for the agent process.
#[tauri::command]
pub async fn resize_agent_terminal(
    state: State<'_, AppState>,
    session_id: String,
    cols: u16,
    rows: u16,
) -> Result<(), String> {
    state
        .agent_orchestrator
        .resize(&session_id, cols, rows)
        .await
        .map_err(|e| e.to_string())
}

/// Get raw terminal output for an agent session.
///
/// Returns the buffered raw PTY output for terminal display.
/// Only available for active sessions.
#[tauri::command]
pub async fn get_agent_raw_output(
    state: State<'_, AppState>,
    session_id: String,
) -> Result<String, String> {
    state
        .agent_orchestrator
        .get_raw_output(&session_id)
        .await
        .map_err(|e| e.to_string())
}

/// Recover stale agent sessions on startup.
///
/// Finds sessions marked as running in the database that aren't actually
/// active (e.g., from a previous crash) and finalizes them.
///
/// Returns the number of sessions recovered.
#[tauri::command]
pub async fn recover_stale_agent_sessions(state: State<'_, AppState>) -> Result<usize, String> {
    state
        .agent_orchestrator
        .recover_stale_sessions()
        .await
        .map_err(|e| e.to_string())
}
