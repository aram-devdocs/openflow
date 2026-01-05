//! Agent Session Service
//!
//! Manages agent session lifecycle and event persistence.
//! Agent sessions track individual runs of CLI tools (Claude Code, Gemini CLI, etc.)
//!
//! # Architecture
//!
//! ```text
//! AgentSession (process run)
//!   ├── AgentEvents (parsed output events)
//!   └── ToolStates (tool execution tracking)
//! ```
//!
//! # Logging
//!
//! This service uses the `log` crate for structured logging:
//! - `debug!`: Detailed operation tracing (query params, internal steps)
//! - `info!`: Successful operations (create, update, complete)
//! - `warn!`: Potentially problematic but recoverable situations
//! - `error!`: Operation failures (logged before returning error)
//!
//! # Error Handling
//!
//! All functions return `ServiceResult<T>` which wraps errors in `ServiceError`.
//! Errors are logged at the appropriate level before being returned.

use log::{debug, error, info};
use sqlx::SqlitePool;
use uuid::Uuid;

use openflow_contracts::{
    AgentSession, AgentSessionSummary, AgentSessionWithState, Permission, PermissionStatus,
    SessionStatus,
};

use super::{ServiceError, ServiceResult};

// =============================================================================
// Create Session Request
// =============================================================================

/// Request to create a new agent session
#[derive(Debug, Clone)]
pub struct CreateSessionRequest {
    /// Process ID this session belongs to
    pub process_id: String,
    /// Provider identifier (e.g., "claude-code", "gemini-cli")
    pub provider_id: String,
    /// Optional external session ID for resume capability
    pub external_session_id: Option<String>,
}

impl CreateSessionRequest {
    /// Create a new request with required fields
    pub fn new(process_id: impl Into<String>, provider_id: impl Into<String>) -> Self {
        Self {
            process_id: process_id.into(),
            provider_id: provider_id.into(),
            external_session_id: None,
        }
    }

    /// Set the external session ID for resume capability
    pub fn with_external_session_id(mut self, id: impl Into<String>) -> Self {
        self.external_session_id = Some(id.into());
        self
    }
}

// =============================================================================
// CRUD Operations
// =============================================================================

/// Create a new agent session.
///
/// # Arguments
/// * `pool` - Database connection pool
/// * `request` - Session creation request
///
/// Returns the created session.
pub async fn create(pool: &SqlitePool, request: CreateSessionRequest) -> ServiceResult<AgentSession> {
    let id = Uuid::new_v4().to_string();

    debug!(
        "Creating agent session: id={}, process_id={}, provider_id={}",
        id, request.process_id, request.provider_id
    );

    sqlx::query(
        r#"
        INSERT INTO agent_sessions (
            id, process_id, provider_id, external_session_id, status
        )
        VALUES (?, ?, ?, ?, 'running')
        "#,
    )
    .bind(&id)
    .bind(&request.process_id)
    .bind(&request.provider_id)
    .bind(&request.external_session_id)
    .execute(pool)
    .await
    .map_err(|e| {
        error!(
            "Failed to create agent session: process_id={}, error={}",
            request.process_id, e
        );
        ServiceError::Database(e)
    })?;

    // Fetch and return the created session
    let session = get(pool, &id).await?;

    info!(
        "Created agent session: id={}, process_id={}, provider_id={}",
        id, request.process_id, request.provider_id
    );

    Ok(session)
}

/// Get an agent session by ID.
///
/// # Arguments
/// * `pool` - Database connection pool
/// * `id` - Session ID
///
/// Returns the session or NotFound error.
pub async fn get(pool: &SqlitePool, id: &str) -> ServiceResult<AgentSession> {
    debug!("Fetching agent session: id={}", id);

    let session = sqlx::query_as::<_, AgentSession>(
        r#"
        SELECT
            id, process_id, provider_id, external_session_id,
            status, exit_code, started_at, ended_at,
            created_at, updated_at
        FROM agent_sessions
        WHERE id = ?
        "#,
    )
    .bind(id)
    .fetch_optional(pool)
    .await
    .map_err(|e| {
        error!("Database error while fetching session id={}: {}", id, e);
        ServiceError::Database(e)
    })?
    .ok_or_else(|| {
        debug!("Agent session not found: id={}", id);
        ServiceError::NotFound {
            entity: "AgentSession",
            id: id.to_string(),
        }
    })?;

    debug!(
        "Found agent session: id={}, status={}, provider_id={}",
        session.id, session.status, session.provider_id
    );

    Ok(session)
}

/// Get an agent session with full state (counts and pending permission).
///
/// # Arguments
/// * `pool` - Database connection pool
/// * `id` - Session ID
///
/// Returns the session with state or NotFound error.
pub async fn get_with_state(pool: &SqlitePool, id: &str) -> ServiceResult<AgentSessionWithState> {
    debug!("Fetching agent session with state: id={}", id);

    let session = get(pool, id).await?;

    // Get event count
    let event_count: i32 = sqlx::query_scalar(
        "SELECT COUNT(*) as count FROM agent_events WHERE session_id = ?",
    )
    .bind(id)
    .fetch_one(pool)
    .await
    .map_err(|e| {
        error!("Failed to count events for session id={}: {}", id, e);
        ServiceError::Database(e)
    })?;

    // Get tool counts (total and pending)
    let tool_count: i32 = sqlx::query_scalar(
        "SELECT COUNT(*) FROM tool_states WHERE session_id = ?",
    )
    .bind(id)
    .fetch_one(pool)
    .await
    .map_err(|e| {
        error!("Failed to count tools for session id={}: {}", id, e);
        ServiceError::Database(e)
    })?;

    let pending_tool_count: i32 = sqlx::query_scalar(
        "SELECT COUNT(*) FROM tool_states WHERE session_id = ? AND status = 'running'",
    )
    .bind(id)
    .fetch_one(pool)
    .await
    .map_err(|e| {
        error!("Failed to count pending tools for session id={}: {}", id, e);
        ServiceError::Database(e)
    })?;

    // Get pending permission (if any)
    let pending_permission = sqlx::query_as::<_, Permission>(
        r#"
        SELECT
            id, session_id, tool_name, description, file_path,
            status, created_at, responded_at, expired_at
        FROM permissions
        WHERE session_id = ? AND status = 'pending'
        ORDER BY created_at DESC
        LIMIT 1
        "#,
    )
    .bind(id)
    .fetch_optional(pool)
    .await
    .map_err(|e| {
        error!("Failed to fetch pending permission for session id={}: {}", id, e);
        ServiceError::Database(e)
    })?;

    Ok(AgentSessionWithState::with_state(
        session,
        event_count,
        tool_count,
        pending_tool_count,
        pending_permission,
    ))
}

/// Get an agent session summary for UI display.
///
/// # Arguments
/// * `pool` - Database connection pool
/// * `id` - Session ID
///
/// Returns the session summary or NotFound error.
pub async fn get_summary(pool: &SqlitePool, id: &str) -> ServiceResult<AgentSessionSummary> {
    debug!("Fetching agent session summary: id={}", id);

    let session = get(pool, id).await?;

    // Get event count
    let event_count: i32 = sqlx::query_scalar(
        "SELECT COUNT(*) FROM agent_events WHERE session_id = ?",
    )
    .bind(id)
    .fetch_one(pool)
    .await
    .map_err(|e| ServiceError::Database(e))?;

    // Get tool count
    let tool_count: i32 = sqlx::query_scalar(
        "SELECT COUNT(*) FROM tool_states WHERE session_id = ?",
    )
    .bind(id)
    .fetch_one(pool)
    .await
    .map_err(|e| ServiceError::Database(e))?;

    // Check for pending permission
    let has_pending_permission: bool = sqlx::query_scalar(
        "SELECT COUNT(*) > 0 FROM permissions WHERE session_id = ? AND status = 'pending'",
    )
    .bind(id)
    .fetch_one(pool)
    .await
    .map_err(|e| ServiceError::Database(e))?;

    Ok(AgentSessionSummary::from_session(
        &session,
        event_count,
        tool_count,
        has_pending_permission,
    ))
}

/// List sessions for a process.
///
/// # Arguments
/// * `pool` - Database connection pool
/// * `process_id` - Process ID to list sessions for
///
/// Returns sessions ordered by created_at DESC.
pub async fn list_by_process(
    pool: &SqlitePool,
    process_id: &str,
) -> ServiceResult<Vec<AgentSession>> {
    debug!("Listing agent sessions for process_id={}", process_id);

    let sessions = sqlx::query_as::<_, AgentSession>(
        r#"
        SELECT
            id, process_id, provider_id, external_session_id,
            status, exit_code, started_at, ended_at,
            created_at, updated_at
        FROM agent_sessions
        WHERE process_id = ?
        ORDER BY created_at DESC
        "#,
    )
    .bind(process_id)
    .fetch_all(pool)
    .await
    .map_err(|e| {
        error!(
            "Failed to list sessions for process_id={}: {}",
            process_id, e
        );
        ServiceError::Database(e)
    })?;

    debug!(
        "Found {} sessions for process_id={}",
        sessions.len(),
        process_id
    );

    Ok(sessions)
}

/// List all running sessions.
///
/// # Arguments
/// * `pool` - Database connection pool
///
/// Returns all sessions with status 'running'.
pub async fn list_running(pool: &SqlitePool) -> ServiceResult<Vec<AgentSession>> {
    debug!("Listing all running agent sessions");

    let sessions = sqlx::query_as::<_, AgentSession>(
        r#"
        SELECT
            id, process_id, provider_id, external_session_id,
            status, exit_code, started_at, ended_at,
            created_at, updated_at
        FROM agent_sessions
        WHERE status = 'running'
        ORDER BY started_at DESC
        "#,
    )
    .fetch_all(pool)
    .await
    .map_err(|e| {
        error!("Failed to list running sessions: {}", e);
        ServiceError::Database(e)
    })?;

    debug!("Found {} running sessions", sessions.len());

    Ok(sessions)
}

// =============================================================================
// Status Updates
// =============================================================================

/// Update the status of an agent session.
///
/// # Arguments
/// * `pool` - Database connection pool
/// * `id` - Session ID
/// * `status` - New status
/// * `exit_code` - Optional exit code (typically set when status is terminal)
///
/// Returns the updated session.
pub async fn update_status(
    pool: &SqlitePool,
    id: &str,
    status: SessionStatus,
    exit_code: Option<i32>,
) -> ServiceResult<AgentSession> {
    debug!(
        "Updating session status: id={}, status={}, exit_code={:?}",
        id, status, exit_code
    );

    // Verify session exists
    let existing = get(pool, id).await?;

    // If transitioning to a terminal state, set ended_at
    let ended_at = if status.is_terminal() && existing.ended_at.is_none() {
        Some(chrono::Utc::now().to_rfc3339())
    } else {
        existing.ended_at.clone()
    };

    sqlx::query(
        r#"
        UPDATE agent_sessions
        SET status = ?,
            exit_code = ?,
            ended_at = ?,
            updated_at = datetime('now', 'subsec')
        WHERE id = ?
        "#,
    )
    .bind(status.to_string())
    .bind(exit_code)
    .bind(&ended_at)
    .bind(id)
    .execute(pool)
    .await
    .map_err(|e| {
        error!("Failed to update session status id={}: {}", id, e);
        ServiceError::Database(e)
    })?;

    let session = get(pool, id).await?;

    info!(
        "Updated session status: id={}, status={}, exit_code={:?}",
        id, status, exit_code
    );

    Ok(session)
}

/// Mark a session as completed with exit code.
///
/// Convenience method that sets status based on exit code.
///
/// # Arguments
/// * `pool` - Database connection pool
/// * `id` - Session ID
/// * `exit_code` - Process exit code
pub async fn complete(pool: &SqlitePool, id: &str, exit_code: i32) -> ServiceResult<AgentSession> {
    let status = SessionStatus::from_exit_code(exit_code);
    update_status(pool, id, status, Some(exit_code)).await
}

/// Mark a session as killed.
///
/// # Arguments
/// * `pool` - Database connection pool
/// * `id` - Session ID
pub async fn kill(pool: &SqlitePool, id: &str) -> ServiceResult<AgentSession> {
    update_status(pool, id, SessionStatus::Killed, None).await
}

/// Set the external session ID for resume capability.
///
/// # Arguments
/// * `pool` - Database connection pool
/// * `id` - Session ID
/// * `external_session_id` - Provider's session ID
pub async fn set_external_session_id(
    pool: &SqlitePool,
    id: &str,
    external_session_id: &str,
) -> ServiceResult<AgentSession> {
    debug!(
        "Setting external session ID: id={}, external_id={}",
        id, external_session_id
    );

    // Verify session exists
    get(pool, id).await?;

    sqlx::query(
        r#"
        UPDATE agent_sessions
        SET external_session_id = ?,
            updated_at = datetime('now', 'subsec')
        WHERE id = ?
        "#,
    )
    .bind(external_session_id)
    .bind(id)
    .execute(pool)
    .await
    .map_err(|e| {
        error!("Failed to set external session ID for id={}: {}", id, e);
        ServiceError::Database(e)
    })?;

    let session = get(pool, id).await?;

    info!(
        "Set external session ID: id={}, external_id={}",
        id, external_session_id
    );

    Ok(session)
}

// =============================================================================
// Event Operations
// =============================================================================

/// Agent event database row (internal representation)
#[derive(Debug, Clone, sqlx::FromRow)]
struct AgentEventRow {
    id: String,
    session_id: String,
    sequence: i32,
    event_type: String,
    payload: String,
    created_at: String,
}

/// Add an event to a session with atomic sequence assignment.
///
/// # Arguments
/// * `pool` - Database connection pool
/// * `session_id` - Session to add event to
/// * `event_type` - Type of event (e.g., "message", "tool_use")
/// * `payload` - JSON payload of the event
///
/// Returns the assigned sequence number.
pub async fn add_event(
    pool: &SqlitePool,
    session_id: &str,
    event_type: &str,
    payload: &serde_json::Value,
) -> ServiceResult<i64> {
    let id = Uuid::new_v4().to_string();

    debug!(
        "Adding event to session: session_id={}, event_type={}",
        session_id, event_type
    );

    // Get the next sequence number atomically
    // SQLite's COALESCE + MAX + 1 pattern is atomic within a single statement
    let sequence: i64 = sqlx::query_scalar(
        r#"
        INSERT INTO agent_events (id, session_id, sequence, event_type, payload)
        SELECT ?, ?, COALESCE(MAX(sequence), -1) + 1, ?, ?
        FROM agent_events
        WHERE session_id = ?
        RETURNING sequence
        "#,
    )
    .bind(&id)
    .bind(session_id)
    .bind(event_type)
    .bind(payload.to_string())
    .bind(session_id)
    .fetch_one(pool)
    .await
    .map_err(|e| {
        error!(
            "Failed to add event to session {}: {}",
            session_id, e
        );
        ServiceError::Database(e)
    })?;

    debug!(
        "Added event: session_id={}, sequence={}, event_type={}",
        session_id, sequence, event_type
    );

    Ok(sequence)
}

/// Get events for a session, optionally after a sequence number.
///
/// # Arguments
/// * `pool` - Database connection pool
/// * `session_id` - Session to get events for
/// * `after_sequence` - Only return events with sequence > this value
///
/// Returns events ordered by sequence ASC.
pub async fn get_events(
    pool: &SqlitePool,
    session_id: &str,
    after_sequence: Option<i64>,
) -> ServiceResult<Vec<openflow_contracts::AgentEventRecord>> {
    debug!(
        "Fetching events: session_id={}, after_sequence={:?}",
        session_id, after_sequence
    );

    let after = after_sequence.unwrap_or(-1);

    let rows = sqlx::query_as::<_, AgentEventRow>(
        r#"
        SELECT id, session_id, sequence, event_type, payload, created_at
        FROM agent_events
        WHERE session_id = ? AND sequence > ?
        ORDER BY sequence ASC
        "#,
    )
    .bind(session_id)
    .bind(after)
    .fetch_all(pool)
    .await
    .map_err(|e| {
        error!(
            "Failed to fetch events for session {}: {}",
            session_id, e
        );
        ServiceError::Database(e)
    })?;

    // Convert to AgentEventRecord
    let events: Vec<openflow_contracts::AgentEventRecord> = rows
        .into_iter()
        .map(|row| {
            let payload: serde_json::Value =
                serde_json::from_str(&row.payload).unwrap_or(serde_json::Value::Null);
            openflow_contracts::AgentEventRecord {
                id: row.id,
                session_id: row.session_id,
                sequence: row.sequence,
                event_type: row.event_type,
                payload,
                created_at: row.created_at,
            }
        })
        .collect();

    debug!(
        "Found {} events for session_id={} after sequence {}",
        events.len(),
        session_id,
        after
    );

    Ok(events)
}

/// Get the latest sequence number for a session.
///
/// # Arguments
/// * `pool` - Database connection pool
/// * `session_id` - Session ID
///
/// Returns the latest sequence number, or None if no events exist.
pub async fn get_latest_sequence(
    pool: &SqlitePool,
    session_id: &str,
) -> ServiceResult<Option<i64>> {
    debug!("Getting latest sequence for session_id={}", session_id);

    let sequence: Option<i64> = sqlx::query_scalar(
        "SELECT MAX(sequence) FROM agent_events WHERE session_id = ?",
    )
    .bind(session_id)
    .fetch_one(pool)
    .await
    .map_err(|e| {
        error!(
            "Failed to get latest sequence for session {}: {}",
            session_id, e
        );
        ServiceError::Database(e)
    })?;

    Ok(sequence)
}

/// Count events for a session.
///
/// # Arguments
/// * `pool` - Database connection pool
/// * `session_id` - Session ID
///
/// Returns the event count.
pub async fn count_events(pool: &SqlitePool, session_id: &str) -> ServiceResult<i64> {
    let count: i64 = sqlx::query_scalar(
        "SELECT COUNT(*) FROM agent_events WHERE session_id = ?",
    )
    .bind(session_id)
    .fetch_one(pool)
    .await
    .map_err(|e| {
        error!(
            "Failed to count events for session {}: {}",
            session_id, e
        );
        ServiceError::Database(e)
    })?;

    Ok(count)
}

// =============================================================================
// Permission Operations
// =============================================================================

/// Create a permission request for a session.
///
/// # Arguments
/// * `pool` - Database connection pool
/// * `session_id` - Session ID
/// * `tool_name` - Name of the tool requesting permission
/// * `description` - Human-readable description of the action
/// * `file_path` - Optional file path if the operation involves a specific file
///
/// Returns the created permission.
pub async fn create_permission(
    pool: &SqlitePool,
    session_id: &str,
    tool_name: &str,
    description: &str,
    file_path: Option<&str>,
) -> ServiceResult<Permission> {
    let id = Uuid::new_v4().to_string();

    debug!(
        "Creating permission: session_id={}, tool_name={}, description={}",
        session_id, tool_name, description
    );

    sqlx::query(
        r#"
        INSERT INTO permissions (id, session_id, tool_name, description, file_path, status)
        VALUES (?, ?, ?, ?, ?, 'pending')
        "#,
    )
    .bind(&id)
    .bind(session_id)
    .bind(tool_name)
    .bind(description)
    .bind(file_path)
    .execute(pool)
    .await
    .map_err(|e| {
        error!(
            "Failed to create permission for session {}: {}",
            session_id, e
        );
        ServiceError::Database(e)
    })?;

    // Fetch and return the created permission
    let permission = sqlx::query_as::<_, Permission>(
        r#"
        SELECT
            id, session_id, tool_name, description, file_path,
            status, created_at, responded_at, expired_at
        FROM permissions
        WHERE id = ?
        "#,
    )
    .bind(&id)
    .fetch_one(pool)
    .await
    .map_err(|e| ServiceError::Database(e))?;

    info!(
        "Created permission: id={}, session_id={}, tool_name={}",
        id, session_id, tool_name
    );

    Ok(permission)
}

/// Respond to a permission request.
///
/// # Arguments
/// * `pool` - Database connection pool
/// * `permission_id` - Permission ID
/// * `approved` - Whether the permission was approved
///
/// Returns the updated permission.
pub async fn respond_to_permission(
    pool: &SqlitePool,
    permission_id: &str,
    approved: bool,
) -> ServiceResult<Permission> {
    let status = if approved {
        PermissionStatus::Approved
    } else {
        PermissionStatus::Denied
    };

    debug!(
        "Responding to permission: id={}, approved={}",
        permission_id, approved
    );

    sqlx::query(
        r#"
        UPDATE permissions
        SET status = ?,
            responded_at = datetime('now', 'subsec')
        WHERE id = ?
        "#,
    )
    .bind(status.to_string())
    .bind(permission_id)
    .execute(pool)
    .await
    .map_err(|e| {
        error!(
            "Failed to respond to permission {}: {}",
            permission_id, e
        );
        ServiceError::Database(e)
    })?;

    // Fetch and return the updated permission
    let permission = sqlx::query_as::<_, Permission>(
        r#"
        SELECT
            id, session_id, tool_name, description, file_path,
            status, created_at, responded_at, expired_at
        FROM permissions
        WHERE id = ?
        "#,
    )
    .bind(permission_id)
    .fetch_one(pool)
    .await
    .map_err(|e| ServiceError::Database(e))?;

    info!(
        "Responded to permission: id={}, status={}",
        permission_id, status
    );

    Ok(permission)
}

/// Get pending permission for a session.
///
/// # Arguments
/// * `pool` - Database connection pool
/// * `session_id` - Session ID
///
/// Returns the pending permission if one exists.
pub async fn get_pending_permission(
    pool: &SqlitePool,
    session_id: &str,
) -> ServiceResult<Option<Permission>> {
    let permission = sqlx::query_as::<_, Permission>(
        r#"
        SELECT
            id, session_id, tool_name, description, file_path,
            status, created_at, responded_at, expired_at
        FROM permissions
        WHERE session_id = ? AND status = 'pending'
        ORDER BY created_at DESC
        LIMIT 1
        "#,
    )
    .bind(session_id)
    .fetch_optional(pool)
    .await
    .map_err(|e| ServiceError::Database(e))?;

    Ok(permission)
}

/// Cancel all pending permissions for a session.
///
/// Used when a session ends before permissions are responded to.
///
/// # Arguments
/// * `pool` - Database connection pool
/// * `session_id` - Session ID
///
/// Returns the number of cancelled permissions.
pub async fn cancel_pending_permissions(
    pool: &SqlitePool,
    session_id: &str,
) -> ServiceResult<i64> {
    debug!(
        "Cancelling pending permissions for session_id={}",
        session_id
    );

    let result = sqlx::query(
        r#"
        UPDATE permissions
        SET status = 'cancelled'
        WHERE session_id = ? AND status = 'pending'
        "#,
    )
    .bind(session_id)
    .execute(pool)
    .await
    .map_err(|e| {
        error!(
            "Failed to cancel permissions for session {}: {}",
            session_id, e
        );
        ServiceError::Database(e)
    })?;

    let count = result.rows_affected() as i64;

    if count > 0 {
        info!(
            "Cancelled {} pending permissions for session_id={}",
            count, session_id
        );
    }

    Ok(count)
}

// =============================================================================
// Tests
// =============================================================================

#[cfg(test)]
mod tests {
    use super::*;
    use openflow_db::{init_db, DbConfig};
    use tempfile::TempDir;

    /// Test fixture that keeps the temp directory alive.
    struct TestDb {
        pool: SqlitePool,
        #[allow(dead_code)]
        temp_dir: TempDir,
    }

    /// Helper to create a test database pool.
    async fn setup_test_db() -> TestDb {
        let temp_dir = TempDir::new().expect("Failed to create temp dir");
        let config = DbConfig::from_directory(temp_dir.path());
        let pool = init_db(config)
            .await
            .expect("Failed to initialize test database");
        TestDb { pool, temp_dir }
    }

    /// Helper to create a test execution process (required for FK).
    async fn create_test_process(pool: &SqlitePool) -> String {
        let id = Uuid::new_v4().to_string();

        // First create a project for the FK
        let project_id = Uuid::new_v4().to_string();
        sqlx::query(
            "INSERT INTO projects (id, name, git_repo_path) VALUES (?, 'Test Project', '/tmp/test')",
        )
        .bind(&project_id)
        .execute(pool)
        .await
        .expect("Failed to create test project");

        // Create the execution process
        sqlx::query(
            r#"
            INSERT INTO execution_processes (id, project_id, process_type, status, working_directory)
            VALUES (?, ?, 'agent', 'running', '/tmp/test')
            "#,
        )
        .bind(&id)
        .bind(&project_id)
        .execute(pool)
        .await
        .expect("Failed to create test process");

        id
    }

    // =========================================================================
    // Session CRUD Tests
    // =========================================================================

    #[tokio::test]
    async fn test_create_session() {
        let test_db = setup_test_db().await;
        let process_id = create_test_process(&test_db.pool).await;

        let request = CreateSessionRequest::new(&process_id, "claude-code");
        let session = create(&test_db.pool, request)
            .await
            .expect("Failed to create session");

        assert_eq!(session.process_id, process_id);
        assert_eq!(session.provider_id, "claude-code");
        assert_eq!(session.status, SessionStatus::Running);
        assert!(session.external_session_id.is_none());
        assert!(session.exit_code.is_none());
        assert!(session.ended_at.is_none());
    }

    #[tokio::test]
    async fn test_create_session_with_external_id() {
        let test_db = setup_test_db().await;
        let process_id = create_test_process(&test_db.pool).await;

        let request = CreateSessionRequest::new(&process_id, "claude-code")
            .with_external_session_id("claude-abc123");
        let session = create(&test_db.pool, request)
            .await
            .expect("Failed to create session");

        assert_eq!(
            session.external_session_id,
            Some("claude-abc123".to_string())
        );
    }

    #[tokio::test]
    async fn test_get_session() {
        let test_db = setup_test_db().await;
        let process_id = create_test_process(&test_db.pool).await;

        let request = CreateSessionRequest::new(&process_id, "gemini-cli");
        let created = create(&test_db.pool, request)
            .await
            .expect("Failed to create session");

        let fetched = get(&test_db.pool, &created.id)
            .await
            .expect("Failed to get session");

        assert_eq!(fetched.id, created.id);
        assert_eq!(fetched.provider_id, "gemini-cli");
    }

    #[tokio::test]
    async fn test_get_session_not_found() {
        let test_db = setup_test_db().await;

        let result = get(&test_db.pool, "non-existent-id").await;

        assert!(result.is_err());
        match result.unwrap_err() {
            ServiceError::NotFound { entity, id } => {
                assert_eq!(entity, "AgentSession");
                assert_eq!(id, "non-existent-id");
            }
            other => panic!("Expected NotFound error, got: {:?}", other),
        }
    }

    #[tokio::test]
    async fn test_list_by_process() {
        let test_db = setup_test_db().await;
        let process_id = create_test_process(&test_db.pool).await;

        // Create multiple sessions
        create(&test_db.pool, CreateSessionRequest::new(&process_id, "claude-code"))
            .await
            .unwrap();
        create(&test_db.pool, CreateSessionRequest::new(&process_id, "gemini-cli"))
            .await
            .unwrap();

        let sessions = list_by_process(&test_db.pool, &process_id)
            .await
            .expect("Failed to list sessions");

        assert_eq!(sessions.len(), 2);
    }

    #[tokio::test]
    async fn test_list_running() {
        let test_db = setup_test_db().await;
        let process_id = create_test_process(&test_db.pool).await;

        // Create two sessions
        let session1 = create(&test_db.pool, CreateSessionRequest::new(&process_id, "claude-code"))
            .await
            .unwrap();
        create(&test_db.pool, CreateSessionRequest::new(&process_id, "gemini-cli"))
            .await
            .unwrap();

        // Complete one
        complete(&test_db.pool, &session1.id, 0).await.unwrap();

        let running = list_running(&test_db.pool)
            .await
            .expect("Failed to list running sessions");

        assert_eq!(running.len(), 1);
        assert_eq!(running[0].provider_id, "gemini-cli");
    }

    // =========================================================================
    // Status Update Tests
    // =========================================================================

    #[tokio::test]
    async fn test_update_status() {
        let test_db = setup_test_db().await;
        let process_id = create_test_process(&test_db.pool).await;

        let session = create(&test_db.pool, CreateSessionRequest::new(&process_id, "claude-code"))
            .await
            .unwrap();

        let updated = update_status(&test_db.pool, &session.id, SessionStatus::Completed, Some(0))
            .await
            .expect("Failed to update status");

        assert_eq!(updated.status, SessionStatus::Completed);
        assert_eq!(updated.exit_code, Some(0));
        assert!(updated.ended_at.is_some());
    }

    #[tokio::test]
    async fn test_complete_success() {
        let test_db = setup_test_db().await;
        let process_id = create_test_process(&test_db.pool).await;

        let session = create(&test_db.pool, CreateSessionRequest::new(&process_id, "claude-code"))
            .await
            .unwrap();

        let completed = complete(&test_db.pool, &session.id, 0)
            .await
            .expect("Failed to complete session");

        assert_eq!(completed.status, SessionStatus::Completed);
        assert_eq!(completed.exit_code, Some(0));
    }

    #[tokio::test]
    async fn test_complete_failure() {
        let test_db = setup_test_db().await;
        let process_id = create_test_process(&test_db.pool).await;

        let session = create(&test_db.pool, CreateSessionRequest::new(&process_id, "claude-code"))
            .await
            .unwrap();

        let completed = complete(&test_db.pool, &session.id, 1)
            .await
            .expect("Failed to complete session");

        assert_eq!(completed.status, SessionStatus::Failed);
        assert_eq!(completed.exit_code, Some(1));
    }

    #[tokio::test]
    async fn test_kill_session() {
        let test_db = setup_test_db().await;
        let process_id = create_test_process(&test_db.pool).await;

        let session = create(&test_db.pool, CreateSessionRequest::new(&process_id, "claude-code"))
            .await
            .unwrap();

        let killed = kill(&test_db.pool, &session.id)
            .await
            .expect("Failed to kill session");

        assert_eq!(killed.status, SessionStatus::Killed);
        assert!(killed.ended_at.is_some());
    }

    #[tokio::test]
    async fn test_set_external_session_id() {
        let test_db = setup_test_db().await;
        let process_id = create_test_process(&test_db.pool).await;

        let session = create(&test_db.pool, CreateSessionRequest::new(&process_id, "claude-code"))
            .await
            .unwrap();
        assert!(session.external_session_id.is_none());

        let updated = set_external_session_id(&test_db.pool, &session.id, "claude-xyz")
            .await
            .expect("Failed to set external session ID");

        assert_eq!(
            updated.external_session_id,
            Some("claude-xyz".to_string())
        );
    }

    // =========================================================================
    // Event Tests
    // =========================================================================

    #[tokio::test]
    async fn test_add_event() {
        let test_db = setup_test_db().await;
        let process_id = create_test_process(&test_db.pool).await;

        let session = create(&test_db.pool, CreateSessionRequest::new(&process_id, "claude-code"))
            .await
            .unwrap();

        let payload = serde_json::json!({"text": "Hello, world!"});
        let seq = add_event(&test_db.pool, &session.id, "message", &payload)
            .await
            .expect("Failed to add event");

        assert_eq!(seq, 0);
    }

    #[tokio::test]
    async fn test_add_events_sequence() {
        let test_db = setup_test_db().await;
        let process_id = create_test_process(&test_db.pool).await;

        let session = create(&test_db.pool, CreateSessionRequest::new(&process_id, "claude-code"))
            .await
            .unwrap();

        let payload = serde_json::json!({"text": "Event"});

        let seq1 = add_event(&test_db.pool, &session.id, "message", &payload)
            .await
            .unwrap();
        let seq2 = add_event(&test_db.pool, &session.id, "tool_use", &payload)
            .await
            .unwrap();
        let seq3 = add_event(&test_db.pool, &session.id, "tool_result", &payload)
            .await
            .unwrap();

        assert_eq!(seq1, 0);
        assert_eq!(seq2, 1);
        assert_eq!(seq3, 2);
    }

    #[tokio::test]
    async fn test_get_events() {
        let test_db = setup_test_db().await;
        let process_id = create_test_process(&test_db.pool).await;

        let session = create(&test_db.pool, CreateSessionRequest::new(&process_id, "claude-code"))
            .await
            .unwrap();

        // Add events
        add_event(&test_db.pool, &session.id, "init", &serde_json::json!({}))
            .await
            .unwrap();
        add_event(&test_db.pool, &session.id, "message", &serde_json::json!({"text": "Hello"}))
            .await
            .unwrap();
        add_event(&test_db.pool, &session.id, "complete", &serde_json::json!({}))
            .await
            .unwrap();

        let events = get_events(&test_db.pool, &session.id, None)
            .await
            .expect("Failed to get events");

        assert_eq!(events.len(), 3);
        assert_eq!(events[0].event_type, "init");
        assert_eq!(events[0].sequence, 0);
        assert_eq!(events[1].event_type, "message");
        assert_eq!(events[1].sequence, 1);
        assert_eq!(events[2].event_type, "complete");
        assert_eq!(events[2].sequence, 2);
    }

    #[tokio::test]
    async fn test_get_events_after_sequence() {
        let test_db = setup_test_db().await;
        let process_id = create_test_process(&test_db.pool).await;

        let session = create(&test_db.pool, CreateSessionRequest::new(&process_id, "claude-code"))
            .await
            .unwrap();

        // Add events
        for i in 0..5 {
            add_event(&test_db.pool, &session.id, "message", &serde_json::json!({"i": i}))
                .await
                .unwrap();
        }

        // Get events after sequence 2
        let events = get_events(&test_db.pool, &session.id, Some(2))
            .await
            .expect("Failed to get events");

        assert_eq!(events.len(), 2);
        assert_eq!(events[0].sequence, 3);
        assert_eq!(events[1].sequence, 4);
    }

    #[tokio::test]
    async fn test_get_latest_sequence() {
        let test_db = setup_test_db().await;
        let process_id = create_test_process(&test_db.pool).await;

        let session = create(&test_db.pool, CreateSessionRequest::new(&process_id, "claude-code"))
            .await
            .unwrap();

        // No events yet
        let seq = get_latest_sequence(&test_db.pool, &session.id)
            .await
            .expect("Failed to get latest sequence");
        assert!(seq.is_none());

        // Add events
        add_event(&test_db.pool, &session.id, "init", &serde_json::json!({}))
            .await
            .unwrap();
        add_event(&test_db.pool, &session.id, "message", &serde_json::json!({}))
            .await
            .unwrap();

        let seq = get_latest_sequence(&test_db.pool, &session.id)
            .await
            .expect("Failed to get latest sequence");
        assert_eq!(seq, Some(1));
    }

    #[tokio::test]
    async fn test_count_events() {
        let test_db = setup_test_db().await;
        let process_id = create_test_process(&test_db.pool).await;

        let session = create(&test_db.pool, CreateSessionRequest::new(&process_id, "claude-code"))
            .await
            .unwrap();

        // Add 3 events
        for _ in 0..3 {
            add_event(&test_db.pool, &session.id, "message", &serde_json::json!({}))
                .await
                .unwrap();
        }

        let count = count_events(&test_db.pool, &session.id)
            .await
            .expect("Failed to count events");
        assert_eq!(count, 3);
    }

    // =========================================================================
    // Permission Tests
    // =========================================================================

    #[tokio::test]
    async fn test_create_permission() {
        let test_db = setup_test_db().await;
        let process_id = create_test_process(&test_db.pool).await;

        let session = create(&test_db.pool, CreateSessionRequest::new(&process_id, "claude-code"))
            .await
            .unwrap();

        let permission = create_permission(
            &test_db.pool,
            &session.id,
            "Write",
            "Create new file",
            Some("/src/test.rs"),
        )
        .await
        .expect("Failed to create permission");

        assert_eq!(permission.session_id, session.id);
        assert_eq!(permission.tool_name, "Write");
        assert_eq!(permission.description, "Create new file");
        assert_eq!(permission.file_path, Some("/src/test.rs".to_string()));
        assert_eq!(permission.status, PermissionStatus::Pending);
    }

    #[tokio::test]
    async fn test_respond_to_permission_approve() {
        let test_db = setup_test_db().await;
        let process_id = create_test_process(&test_db.pool).await;

        let session = create(&test_db.pool, CreateSessionRequest::new(&process_id, "claude-code"))
            .await
            .unwrap();

        let permission = create_permission(
            &test_db.pool,
            &session.id,
            "Bash",
            "Execute command",
            None,
        )
        .await
        .unwrap();

        let updated = respond_to_permission(&test_db.pool, &permission.id, true)
            .await
            .expect("Failed to respond to permission");

        assert_eq!(updated.status, PermissionStatus::Approved);
        assert!(updated.responded_at.is_some());
    }

    #[tokio::test]
    async fn test_respond_to_permission_deny() {
        let test_db = setup_test_db().await;
        let process_id = create_test_process(&test_db.pool).await;

        let session = create(&test_db.pool, CreateSessionRequest::new(&process_id, "claude-code"))
            .await
            .unwrap();

        let permission = create_permission(
            &test_db.pool,
            &session.id,
            "Bash",
            "Execute command",
            None,
        )
        .await
        .unwrap();

        let updated = respond_to_permission(&test_db.pool, &permission.id, false)
            .await
            .expect("Failed to respond to permission");

        assert_eq!(updated.status, PermissionStatus::Denied);
        assert!(updated.responded_at.is_some());
    }

    #[tokio::test]
    async fn test_get_pending_permission() {
        let test_db = setup_test_db().await;
        let process_id = create_test_process(&test_db.pool).await;

        let session = create(&test_db.pool, CreateSessionRequest::new(&process_id, "claude-code"))
            .await
            .unwrap();

        // No pending permission initially
        let pending = get_pending_permission(&test_db.pool, &session.id)
            .await
            .expect("Failed to get pending permission");
        assert!(pending.is_none());

        // Create permission
        create_permission(
            &test_db.pool,
            &session.id,
            "Write",
            "Create file",
            None,
        )
        .await
        .unwrap();

        // Now there's a pending permission
        let pending = get_pending_permission(&test_db.pool, &session.id)
            .await
            .expect("Failed to get pending permission");
        assert!(pending.is_some());
        assert_eq!(pending.unwrap().tool_name, "Write");
    }

    #[tokio::test]
    async fn test_cancel_pending_permissions() {
        let test_db = setup_test_db().await;
        let process_id = create_test_process(&test_db.pool).await;

        let session = create(&test_db.pool, CreateSessionRequest::new(&process_id, "claude-code"))
            .await
            .unwrap();

        // Create multiple permissions
        create_permission(&test_db.pool, &session.id, "Write", "File 1", None)
            .await
            .unwrap();
        let perm2 = create_permission(&test_db.pool, &session.id, "Bash", "Command", None)
            .await
            .unwrap();

        // Respond to one
        respond_to_permission(&test_db.pool, &perm2.id, true)
            .await
            .unwrap();

        // Cancel remaining pending permissions
        let cancelled = cancel_pending_permissions(&test_db.pool, &session.id)
            .await
            .expect("Failed to cancel permissions");

        assert_eq!(cancelled, 1); // Only one was still pending
    }

    // =========================================================================
    // Full State Tests
    // =========================================================================

    #[tokio::test]
    async fn test_get_with_state() {
        let test_db = setup_test_db().await;
        let process_id = create_test_process(&test_db.pool).await;

        let session = create(&test_db.pool, CreateSessionRequest::new(&process_id, "claude-code"))
            .await
            .unwrap();

        // Add some events
        add_event(&test_db.pool, &session.id, "init", &serde_json::json!({}))
            .await
            .unwrap();
        add_event(&test_db.pool, &session.id, "message", &serde_json::json!({}))
            .await
            .unwrap();

        // Create a pending permission
        create_permission(&test_db.pool, &session.id, "Write", "Create file", None)
            .await
            .unwrap();

        let with_state = get_with_state(&test_db.pool, &session.id)
            .await
            .expect("Failed to get session with state");

        assert_eq!(with_state.session.id, session.id);
        assert_eq!(with_state.event_count, 2);
        assert!(with_state.pending_permission.is_some());
        assert_eq!(
            with_state.pending_permission.unwrap().tool_name,
            "Write"
        );
    }

    #[tokio::test]
    async fn test_get_summary() {
        let test_db = setup_test_db().await;
        let process_id = create_test_process(&test_db.pool).await;

        let session = create(&test_db.pool, CreateSessionRequest::new(&process_id, "claude-code"))
            .await
            .unwrap();

        // Add events
        add_event(&test_db.pool, &session.id, "init", &serde_json::json!({}))
            .await
            .unwrap();

        // Create pending permission
        create_permission(&test_db.pool, &session.id, "Write", "Create file", None)
            .await
            .unwrap();

        let summary = get_summary(&test_db.pool, &session.id)
            .await
            .expect("Failed to get summary");

        assert_eq!(summary.id, session.id);
        assert_eq!(summary.event_count, 1);
        assert!(summary.has_pending_permission);
        assert!(summary.needs_attention()); // Running with pending permission
    }
}
