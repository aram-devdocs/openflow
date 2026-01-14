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
    AgentSession, AgentSessionSummary, AgentSessionWithState, EntryMetadata, EntryType,
    NormalizedEntry, Permission, PermissionStatus, SessionStatus,
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
            status, created_at, detected_at, responded_at, expired_at,
            timeout_at, timeout_seconds
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
    .map_err(ServiceError::Database)?;

    // Get tool count
    let tool_count: i32 = sqlx::query_scalar(
        "SELECT COUNT(*) FROM tool_states WHERE session_id = ?",
    )
    .bind(id)
    .fetch_one(pool)
    .await
    .map_err(ServiceError::Database)?;

    // Check for pending permission
    let has_pending_permission: bool = sqlx::query_scalar(
        "SELECT COUNT(*) > 0 FROM permissions WHERE session_id = ? AND status = 'pending'",
    )
    .bind(id)
    .fetch_one(pool)
    .await
    .map_err(ServiceError::Database)?;

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
) -> ServiceResult<i32> {
    let id = Uuid::new_v4().to_string();

    debug!(
        "Adding event to session: session_id={}, event_type={}",
        session_id, event_type
    );

    // Get the next sequence number atomically
    // SQLite's COALESCE + MAX + 1 pattern is atomic within a single statement
    let sequence: i32 = sqlx::query_scalar(
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
    after_sequence: Option<i32>,
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

/// Normalized event database row (internal representation)
#[derive(Debug, Clone, sqlx::FromRow)]
struct NormalizedEventRow {
    id: String,
    session_id: String,
    sequence: i32,
    entry_type: String,
    content: String,
    metadata: Option<String>,
    timestamp: String,
}

/// Persist a normalized event to the database.
///
/// This is the write path for the new normalized events system.
/// All agent events should be transformed to NormalizedEntry format
/// and persisted using this function.
///
/// # Arguments
/// * `pool` - Database connection pool
/// * `entry` - Normalized event entry to persist
///
/// # Returns
/// Result indicating success or database error.
///
/// # Example
/// ```ignore
/// let entry = NormalizedEntry::new(
///     "entry-123",
///     "session-456",
///     42,
///     EntryType::message(AgentMessageRole::Assistant),
///     "Hello, world!",
/// );
/// persist_normalized_event(&pool, &entry).await?;
/// ```
pub async fn persist_normalized_event(
    pool: &SqlitePool,
    entry: &NormalizedEntry,
) -> ServiceResult<()> {
    debug!(
        "Persisting normalized event: session_id={}, sequence={}, type={}",
        entry.session_id,
        entry.sequence,
        entry.type_name()
    );

    // Serialize entry_type to JSON
    let entry_type_json = serde_json::to_string(&entry.entry_type).map_err(|e| {
        error!(
            "Failed to serialize entry_type for event {}: {}",
            entry.id, e
        );
        ServiceError::invalid_input("entry_type", format!("Failed to serialize: {}", e))
    })?;

    // Serialize metadata to JSON if present
    let metadata_json = if let Some(metadata) = &entry.metadata {
        Some(serde_json::to_string(metadata).map_err(|e| {
            error!(
                "Failed to serialize metadata for event {}: {}",
                entry.id, e
            );
            ServiceError::invalid_input("metadata", format!("Failed to serialize: {}", e))
        })?)
    } else {
        None
    };

    // Convert timestamp to RFC3339 string
    let timestamp_str = entry.timestamp.to_rfc3339();

    // Insert into database
    sqlx::query(
        r#"
        INSERT INTO normalized_events (id, session_id, sequence, entry_type, content, metadata, timestamp)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        "#,
    )
    .bind(&entry.id)
    .bind(&entry.session_id)
    .bind(entry.sequence)
    .bind(&entry_type_json)
    .bind(&entry.content)
    .bind(&metadata_json)
    .bind(&timestamp_str)
    .execute(pool)
    .await
    .map_err(|e| {
        error!(
            "Failed to persist normalized event: session_id={}, sequence={}, error={}",
            entry.session_id, entry.sequence, e
        );
        ServiceError::Database(e)
    })?;

    debug!(
        "Persisted normalized event: id={}, session_id={}, sequence={}",
        entry.id, entry.session_id, entry.sequence
    );

    Ok(())
}

/// Get normalized events for a session, optionally after a sequence number.
///
/// Normalized events are the canonical format for agent execution events,
/// transformed from provider-specific output into a unified structure.
///
/// # Arguments
/// * `pool` - Database connection pool
/// * `session_id` - Session to get events for
/// * `after_sequence` - Only return events with sequence > this value
///
/// Returns normalized events ordered by sequence ASC.
pub async fn get_normalized_events(
    pool: &SqlitePool,
    session_id: &str,
    after_sequence: Option<i32>,
) -> ServiceResult<Vec<NormalizedEntry>> {
    debug!(
        "Fetching normalized events: session_id={}, after_sequence={:?}",
        session_id, after_sequence
    );

    let after = after_sequence.unwrap_or(-1);

    let rows = sqlx::query_as::<_, NormalizedEventRow>(
        r#"
        SELECT id, session_id, sequence, entry_type, content, metadata, timestamp
        FROM normalized_events
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
            "Failed to fetch normalized events for session {}: {}",
            session_id, e
        );
        ServiceError::Database(e)
    })?;

    // Convert to NormalizedEntry
    let events: Vec<NormalizedEntry> = rows
        .into_iter()
        .filter_map(|row| {
            // Parse entry_type JSON
            let entry_type: EntryType = match serde_json::from_str(&row.entry_type) {
                    Ok(et) => et,
                    Err(e) => {
                        error!(
                            "Failed to deserialize entry_type for event {}: {}",
                            row.id, e
                        );
                        return None;
                    }
                };

            // Parse metadata JSON if present
            let metadata: Option<EntryMetadata> = if let Some(meta_str) = &row.metadata {
                    match serde_json::from_str(meta_str) {
                        Ok(meta) => Some(meta),
                        Err(e) => {
                            error!(
                                "Failed to deserialize metadata for event {}: {}",
                                row.id, e
                            );
                            None
                        }
                    }
                } else {
                    None
                };

            // Parse timestamp
            let timestamp = match chrono::DateTime::parse_from_rfc3339(&row.timestamp) {
                Ok(dt) => dt.with_timezone(&chrono::Utc),
                Err(e) => {
                    error!(
                        "Failed to parse timestamp for event {}: {}",
                        row.id, e
                    );
                    return None;
                }
            };

            Some(NormalizedEntry {
                id: row.id,
                session_id: row.session_id,
                sequence: row.sequence,
                entry_type,
                content: row.content,
                timestamp,
                metadata,
            })
        })
        .collect();

    debug!(
        "Found {} normalized events for session_id={} after sequence {}",
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
) -> ServiceResult<Option<i32>> {
    debug!("Getting latest sequence for session_id={}", session_id);

    let sequence: Option<i32> = sqlx::query_scalar(
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
    let now = chrono::Utc::now();
    let timeout_seconds = 300; // 5 minutes default
    let timeout_at = now + chrono::Duration::seconds(timeout_seconds as i64);

    debug!(
        "Creating permission: session_id={}, tool_name={}, description={}, timeout_at={}",
        session_id, tool_name, description, timeout_at.to_rfc3339()
    );

    sqlx::query(
        r#"
        INSERT INTO permissions (
            id, session_id, tool_name, description, file_path, status,
            detected_at, timeout_at, timeout_seconds
        )
        VALUES (?, ?, ?, ?, ?, 'pending', ?, ?, ?)
        "#,
    )
    .bind(&id)
    .bind(session_id)
    .bind(tool_name)
    .bind(description)
    .bind(file_path)
    .bind(now.to_rfc3339())
    .bind(timeout_at.to_rfc3339())
    .bind(timeout_seconds)
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
            status, created_at, detected_at, responded_at, expired_at,
            timeout_at, timeout_seconds
        FROM permissions
        WHERE id = ?
        "#,
    )
    .bind(&id)
    .fetch_one(pool)
    .await
    .map_err(ServiceError::Database)?;

    info!(
        "Created permission: id={}, session_id={}, tool_name={}, timeout_at={}",
        id, session_id, tool_name, timeout_at.to_rfc3339()
    );

    Ok(permission)
}

/// Create a new permission record with a specific ID.
///
/// This is used by the SDK bridge flow where the permission ID comes from the agent-service.
/// The ID must match what the agent-service is tracking so responses can be routed correctly.
///
/// # Arguments
/// * `pool` - Database connection pool
/// * `permission_id` - The specific ID to use (from agent-service)
/// * `session_id` - Session ID
/// * `tool_name` - Name of the tool requesting permission
/// * `description` - Human-readable description of the action
/// * `file_path` - Optional file path if the operation involves a specific file
///
/// Returns the created permission.
pub async fn create_permission_with_id(
    pool: &SqlitePool,
    permission_id: &str,
    session_id: &str,
    tool_name: &str,
    description: &str,
    file_path: Option<&str>,
) -> ServiceResult<Permission> {
    let now = chrono::Utc::now();
    let timeout_seconds = 300; // 5 minutes default
    let timeout_at = now + chrono::Duration::seconds(timeout_seconds as i64);

    debug!(
        "Creating permission with ID: id={}, session_id={}, tool_name={}, description={}, timeout_at={}",
        permission_id, session_id, tool_name, description, timeout_at.to_rfc3339()
    );

    sqlx::query(
        r#"
        INSERT INTO permissions (
            id, session_id, tool_name, description, file_path, status,
            detected_at, timeout_at, timeout_seconds
        )
        VALUES (?, ?, ?, ?, ?, 'pending', ?, ?, ?)
        "#,
    )
    .bind(permission_id)
    .bind(session_id)
    .bind(tool_name)
    .bind(description)
    .bind(file_path)
    .bind(now.to_rfc3339())
    .bind(timeout_at.to_rfc3339())
    .bind(timeout_seconds)
    .execute(pool)
    .await
    .map_err(|e| {
        error!(
            "Failed to create permission {} for session {}: {}",
            permission_id, session_id, e
        );
        ServiceError::Database(e)
    })?;

    // Fetch and return the created permission
    let permission = sqlx::query_as::<_, Permission>(
        r#"
        SELECT
            id, session_id, tool_name, description, file_path,
            status, created_at, detected_at, responded_at, expired_at,
            timeout_at, timeout_seconds
        FROM permissions
        WHERE id = ?
        "#,
    )
    .bind(permission_id)
    .fetch_one(pool)
    .await
    .map_err(ServiceError::Database)?;

    info!(
        "Created permission: id={}, session_id={}, tool_name={}, timeout_at={}",
        permission_id, session_id, tool_name, timeout_at.to_rfc3339()
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
            status, created_at, detected_at, responded_at, expired_at,
            timeout_at, timeout_seconds
        FROM permissions
        WHERE id = ?
        "#,
    )
    .bind(permission_id)
    .fetch_one(pool)
    .await
    .map_err(ServiceError::Database)?;

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
            status, created_at, detected_at, responded_at, expired_at,
            timeout_at, timeout_seconds
        FROM permissions
        WHERE session_id = ? AND status = 'pending'
        ORDER BY created_at DESC
        LIMIT 1
        "#,
    )
    .bind(session_id)
    .fetch_optional(pool)
    .await
    .map_err(ServiceError::Database)?;

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

/// Get all pending permissions that have expired (timeout_at is in the past).
///
/// # Arguments
/// * `pool` - Database connection pool
///
/// Returns list of expired permissions.
pub async fn get_expired_permissions(pool: &SqlitePool) -> ServiceResult<Vec<Permission>> {
    debug!("Fetching expired pending permissions");

    let permissions = sqlx::query_as::<_, Permission>(
        r#"
        SELECT
            id, session_id, tool_name, description, file_path,
            status, created_at, detected_at, responded_at, expired_at,
            timeout_at, timeout_seconds
        FROM permissions
        WHERE status = 'pending'
          AND timeout_at IS NOT NULL
          AND datetime(timeout_at) <= datetime('now', 'subsec')
        ORDER BY created_at ASC
        "#,
    )
    .fetch_all(pool)
    .await
    .map_err(|e| {
        error!("Failed to fetch expired permissions: {}", e);
        ServiceError::Database(e)
    })?;

    if !permissions.is_empty() {
        debug!("Found {} expired permissions", permissions.len());
    }

    Ok(permissions)
}

/// Mark a permission as timed out.
///
/// # Arguments
/// * `pool` - Database connection pool
/// * `permission_id` - Permission ID
///
/// Returns the updated permission.
pub async fn timeout_permission(
    pool: &SqlitePool,
    permission_id: &str,
) -> ServiceResult<Permission> {
    debug!("Timing out permission: id={}", permission_id);

    sqlx::query(
        r#"
        UPDATE permissions
        SET status = 'timed_out',
            expired_at = datetime('now', 'subsec')
        WHERE id = ?
        "#,
    )
    .bind(permission_id)
    .execute(pool)
    .await
    .map_err(|e| {
        error!("Failed to timeout permission {}: {}", permission_id, e);
        ServiceError::Database(e)
    })?;

    // Fetch and return the updated permission
    let permission = sqlx::query_as::<_, Permission>(
        r#"
        SELECT
            id, session_id, tool_name, description, file_path,
            status, created_at, detected_at, responded_at, expired_at,
            timeout_at, timeout_seconds
        FROM permissions
        WHERE id = ?
        "#,
    )
    .bind(permission_id)
    .fetch_one(pool)
    .await
    .map_err(ServiceError::Database)?;

    info!(
        "Permission timed out: id={}, session_id={}, tool_name={}",
        permission_id, permission.session_id, permission.tool_name
    );

    Ok(permission)
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

        // Create a chat for the FK
        let chat_id = Uuid::new_v4().to_string();
        sqlx::query(
            "INSERT INTO chats (id, project_id, title) VALUES (?, ?, 'Test Chat')",
        )
        .bind(&chat_id)
        .bind(&project_id)
        .execute(pool)
        .await
        .expect("Failed to create test chat");

        // Create the execution process
        sqlx::query(
            r#"
            INSERT INTO execution_processes (id, chat_id, status)
            VALUES (?, ?, 'running')
            "#,
        )
        .bind(&id)
        .bind(&chat_id)
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
    // Normalized Events Tests
    // =========================================================================

    /// Helper to create a normalized event in the database
    async fn create_normalized_event(
        pool: &SqlitePool,
        session_id: &str,
        sequence: i32,
        entry_type: &EntryType,
        content: &str,
        metadata: Option<&EntryMetadata>,
    ) -> String {
        let id = Uuid::new_v4().to_string();
        let timestamp = chrono::Utc::now().to_rfc3339();
        let entry_type_json = serde_json::to_string(entry_type).unwrap();
        let metadata_json = metadata.map(|m| serde_json::to_string(m).unwrap());

        sqlx::query(
            r#"
            INSERT INTO normalized_events (id, session_id, sequence, entry_type, content, metadata, timestamp)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            "#,
        )
        .bind(&id)
        .bind(session_id)
        .bind(sequence)
        .bind(&entry_type_json)
        .bind(content)
        .bind(&metadata_json)
        .bind(&timestamp)
        .execute(pool)
        .await
        .expect("Failed to insert normalized event");

        id
    }

    #[tokio::test]
    async fn test_get_normalized_events() {
        let test_db = setup_test_db().await;
        let process_id = create_test_process(&test_db.pool).await;

        let session = create(&test_db.pool, CreateSessionRequest::new(&process_id, "claude-code"))
            .await
            .unwrap();

        // Create some normalized events
        create_normalized_event(
            &test_db.pool,
            &session.id,
            0,
            &EntryType::init("ext-session-1", "claude-sonnet-4", vec!["Read".to_string()]),
            "Session started",
            None,
        )
        .await;

        create_normalized_event(
            &test_db.pool,
            &session.id,
            1,
            &EntryType::message(openflow_contracts::AgentMessageRole::Assistant),
            "Hello, how can I help?",
            None,
        )
        .await;

        let metadata = EntryMetadata::with_file_path("/src/main.rs");
        create_normalized_event(
            &test_db.pool,
            &session.id,
            2,
            &EntryType::tool_use(
                "tool-123",
                "Read",
                serde_json::json!({"filePath": "/src/main.rs"}),
            ),
            "Reading file",
            Some(&metadata),
        )
        .await;

        // Get all events
        let events = get_normalized_events(&test_db.pool, &session.id, None)
            .await
            .expect("Failed to get normalized events");

        assert_eq!(events.len(), 3);
        assert_eq!(events[0].sequence, 0);
        assert!(events[0].entry_type.is_init());
        assert_eq!(events[0].content, "Session started");
        assert!(events[0].metadata.is_none());

        assert_eq!(events[1].sequence, 1);
        assert!(events[1].entry_type.is_message());
        assert_eq!(events[1].content, "Hello, how can I help?");

        assert_eq!(events[2].sequence, 2);
        assert!(events[2].entry_type.is_tool_use());
        assert_eq!(events[2].content, "Reading file");
        assert!(events[2].metadata.is_some());
        assert_eq!(
            events[2].metadata.as_ref().unwrap().file_path,
            Some("/src/main.rs".to_string())
        );
    }

    #[tokio::test]
    async fn test_get_normalized_events_after_sequence() {
        let test_db = setup_test_db().await;
        let process_id = create_test_process(&test_db.pool).await;

        let session = create(&test_db.pool, CreateSessionRequest::new(&process_id, "claude-code"))
            .await
            .unwrap();

        // Create 5 events
        for i in 0..5 {
            create_normalized_event(
                &test_db.pool,
                &session.id,
                i,
                &EntryType::message(openflow_contracts::AgentMessageRole::Assistant),
                &format!("Message {}", i),
                None,
            )
            .await;
        }

        // Get events after sequence 2
        let events = get_normalized_events(&test_db.pool, &session.id, Some(2))
            .await
            .expect("Failed to get normalized events");

        assert_eq!(events.len(), 2);
        assert_eq!(events[0].sequence, 3);
        assert_eq!(events[0].content, "Message 3");
        assert_eq!(events[1].sequence, 4);
        assert_eq!(events[1].content, "Message 4");
    }

    #[tokio::test]
    async fn test_get_normalized_events_empty() {
        let test_db = setup_test_db().await;
        let process_id = create_test_process(&test_db.pool).await;

        let session = create(&test_db.pool, CreateSessionRequest::new(&process_id, "claude-code"))
            .await
            .unwrap();

        // Get events from empty session
        let events = get_normalized_events(&test_db.pool, &session.id, None)
            .await
            .expect("Failed to get normalized events");

        assert_eq!(events.len(), 0);
    }

    #[tokio::test]
    async fn test_get_normalized_events_with_all_types() {
        let test_db = setup_test_db().await;
        let process_id = create_test_process(&test_db.pool).await;

        let session = create(&test_db.pool, CreateSessionRequest::new(&process_id, "claude-code"))
            .await
            .unwrap();

        // Create events of all types
        create_normalized_event(
            &test_db.pool,
            &session.id,
            0,
            &EntryType::init("ext-1", "model", vec!["Tool1".to_string()]),
            "Init",
            None,
        )
        .await;

        create_normalized_event(
            &test_db.pool,
            &session.id,
            1,
            &EntryType::message(openflow_contracts::AgentMessageRole::User),
            "User message",
            None,
        )
        .await;

        create_normalized_event(
            &test_db.pool,
            &session.id,
            2,
            &EntryType::tool_use("t1", "Read", serde_json::json!({})),
            "Tool use",
            None,
        )
        .await;

        create_normalized_event(
            &test_db.pool,
            &session.id,
            3,
            &EntryType::tool_result(
                "t1",
                openflow_contracts::ToolResultStatus::Success,
                "output",
                Some(100),
            ),
            "Tool result",
            None,
        )
        .await;

        create_normalized_event(
            &test_db.pool,
            &session.id,
            4,
            &EntryType::error("error_code", false),
            "Error",
            None,
        )
        .await;

        create_normalized_event(
            &test_db.pool,
            &session.id,
            5,
            &EntryType::system("pause"),
            "System",
            None,
        )
        .await;

        create_normalized_event(
            &test_db.pool,
            &session.id,
            6,
            &EntryType::complete(openflow_contracts::CompletionStatus::Success, None),
            "Complete",
            None,
        )
        .await;

        // Get all events
        let events = get_normalized_events(&test_db.pool, &session.id, None)
            .await
            .expect("Failed to get normalized events");

        assert_eq!(events.len(), 7);
        assert!(events[0].entry_type.is_init());
        assert!(events[1].entry_type.is_message());
        assert!(events[2].entry_type.is_tool_use());
        assert!(events[3].entry_type.is_tool_result());
        assert!(events[4].entry_type.is_error());
        assert!(events[5].entry_type.is_system());
        assert!(events[6].entry_type.is_complete());
    }

    #[tokio::test]
    async fn test_persist_normalized_event() {
        let test_db = setup_test_db().await;
        let process_id = create_test_process(&test_db.pool).await;

        let session = create(&test_db.pool, CreateSessionRequest::new(&process_id, "claude-code"))
            .await
            .unwrap();

        // Create a normalized entry
        let entry = NormalizedEntry::new(
            Uuid::new_v4().to_string(),
            &session.id,
            0,
            EntryType::message(openflow_contracts::AgentMessageRole::Assistant),
            "Hello, world!",
        );

        // Persist it
        persist_normalized_event(&test_db.pool, &entry)
            .await
            .expect("Failed to persist normalized event");

        // Retrieve it
        let events = get_normalized_events(&test_db.pool, &session.id, None)
            .await
            .expect("Failed to get normalized events");

        assert_eq!(events.len(), 1);
        assert_eq!(events[0].id, entry.id);
        assert_eq!(events[0].session_id, entry.session_id);
        assert_eq!(events[0].sequence, entry.sequence);
        assert_eq!(events[0].content, "Hello, world!");
        assert!(events[0].entry_type.is_message());
    }

    #[tokio::test]
    async fn test_persist_normalized_event_with_metadata() {
        let test_db = setup_test_db().await;
        let process_id = create_test_process(&test_db.pool).await;

        let session = create(&test_db.pool, CreateSessionRequest::new(&process_id, "claude-code"))
            .await
            .unwrap();

        // Create entry with metadata
        let metadata = EntryMetadata::with_file_path("/src/main.rs")
            .set_command("cargo build")
            .set_exit_code(0);

        let entry = NormalizedEntry::new(
            Uuid::new_v4().to_string(),
            &session.id,
            0,
            EntryType::tool_use(
                "tool-123",
                "Read",
                serde_json::json!({"filePath": "/src/main.rs"}),
            ),
            "Reading file",
        )
        .with_metadata(metadata.clone());

        // Persist it
        persist_normalized_event(&test_db.pool, &entry)
            .await
            .expect("Failed to persist normalized event");

        // Retrieve it
        let events = get_normalized_events(&test_db.pool, &session.id, None)
            .await
            .expect("Failed to get normalized events");

        assert_eq!(events.len(), 1);
        assert_eq!(events[0].id, entry.id);
        assert!(events[0].metadata.is_some());

        let retrieved_metadata = events[0].metadata.as_ref().unwrap();
        assert_eq!(
            retrieved_metadata.file_path,
            Some("/src/main.rs".to_string())
        );
        assert_eq!(retrieved_metadata.command, Some("cargo build".to_string()));
        assert_eq!(retrieved_metadata.exit_code, Some(0));
    }

    #[tokio::test]
    async fn test_persist_normalized_event_multiple_sequence() {
        let test_db = setup_test_db().await;
        let process_id = create_test_process(&test_db.pool).await;

        let session = create(&test_db.pool, CreateSessionRequest::new(&process_id, "claude-code"))
            .await
            .unwrap();

        // Create multiple entries with different sequences
        for i in 0..5 {
            let entry = NormalizedEntry::new(
                Uuid::new_v4().to_string(),
                &session.id,
                i,
                EntryType::message(openflow_contracts::AgentMessageRole::Assistant),
                format!("Message {}", i),
            );

            persist_normalized_event(&test_db.pool, &entry)
                .await
                .expect("Failed to persist normalized event");
        }

        // Retrieve all
        let events = get_normalized_events(&test_db.pool, &session.id, None)
            .await
            .expect("Failed to get normalized events");

        assert_eq!(events.len(), 5);
        for (i, event) in events.iter().enumerate() {
            assert_eq!(event.sequence, i as i32);
            assert_eq!(event.content, format!("Message {}", i));
        }
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

    #[tokio::test]
    async fn test_get_expired_permissions() {
        let test_db = setup_test_db().await;
        let process_id = create_test_process(&test_db.pool).await;

        let session1 = create(&test_db.pool, CreateSessionRequest::new(&process_id, "claude-code"))
            .await
            .unwrap();
        let session2 = create(&test_db.pool, CreateSessionRequest::new(&process_id, "gemini-cli"))
            .await
            .unwrap();

        // Create permission that has already expired (timeout in the past)
        let expired_perm = create_permission(&test_db.pool, &session1.id, "Write", "File 1", None)
            .await
            .unwrap();
        
        // Manually update timeout_at to be in the past
        sqlx::query("UPDATE permissions SET timeout_at = '2020-01-01T00:00:00Z' WHERE id = ?")
            .bind(&expired_perm.id)
            .execute(&test_db.pool)
            .await
            .unwrap();

        // Create permission with future timeout (should not be expired)
        let future_timeout = (chrono::Utc::now() + chrono::Duration::hours(1)).to_rfc3339();
        create_permission(&test_db.pool, &session2.id, "Bash", "Command", None)
            .await
            .unwrap();
        sqlx::query("UPDATE permissions SET timeout_at = ? WHERE session_id = ?")
            .bind(&future_timeout)
            .bind(&session2.id)
            .execute(&test_db.pool)
            .await
            .unwrap();

        // Get expired permissions
        let expired = get_expired_permissions(&test_db.pool)
            .await
            .expect("Failed to get expired permissions");

        // Should only get the one with past timeout
        assert_eq!(expired.len(), 1);
        assert_eq!(expired[0].id, expired_perm.id);
        assert_eq!(expired[0].tool_name, "Write");
    }

    #[tokio::test]
    async fn test_timeout_permission() {
        let test_db = setup_test_db().await;
        let process_id = create_test_process(&test_db.pool).await;

        let session = create(&test_db.pool, CreateSessionRequest::new(&process_id, "claude-code"))
            .await
            .unwrap();

        let permission = create_permission(&test_db.pool, &session.id, "Write", "Create file", None)
            .await
            .unwrap();

        assert_eq!(permission.status, PermissionStatus::Pending);
        assert!(permission.expired_at.is_none());

        // Timeout the permission
        let timed_out = timeout_permission(&test_db.pool, &permission.id)
            .await
            .expect("Failed to timeout permission");

        assert_eq!(timed_out.status, PermissionStatus::TimedOut);
        assert!(timed_out.expired_at.is_some());
        assert_eq!(timed_out.id, permission.id);
        assert_eq!(timed_out.session_id, session.id);
    }

    #[tokio::test]
    async fn test_create_permission_with_timeout_fields() {
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
            Some("/tmp/script.sh"),
        )
        .await
        .expect("Failed to create permission");

        // Verify timeout fields are set
        assert!(permission.detected_at.len() > 0);
        assert!(permission.timeout_at.is_some());
        assert_eq!(permission.timeout_seconds, 300); // Default 5 minutes
        
        // Verify detected_at is recent (within last minute)
        let detected = chrono::DateTime::parse_from_rfc3339(&permission.detected_at)
            .unwrap()
            .with_timezone(&chrono::Utc);
        let now = chrono::Utc::now();
        let diff = (now - detected).num_seconds();
        assert!(diff < 60, "detected_at should be recent");

        // Verify timeout_at is in the future (approximately 5 minutes from now)
        let timeout = chrono::DateTime::parse_from_rfc3339(permission.timeout_at.as_ref().unwrap())
            .unwrap()
            .with_timezone(&chrono::Utc);
        let timeout_diff = (timeout - now).num_seconds();
        assert!(timeout_diff > 290 && timeout_diff < 310, "timeout_at should be ~5 minutes from now");
    }

    #[tokio::test]
    async fn test_permission_lifecycle_with_timeout() {
        let test_db = setup_test_db().await;
        let process_id = create_test_process(&test_db.pool).await;

        let session = create(&test_db.pool, CreateSessionRequest::new(&process_id, "claude-code"))
            .await
            .unwrap();

        // Create permission
        let permission = create_permission(&test_db.pool, &session.id, "Write", "Create file", None)
            .await
            .unwrap();

        assert_eq!(permission.status, PermissionStatus::Pending);
        assert!(permission.detected_at.len() > 0);
        assert!(permission.responded_at.is_none());
        assert!(permission.expired_at.is_none());
        assert!(permission.timeout_at.is_some());

        // Check it's returned as pending
        let pending = get_pending_permission(&test_db.pool, &session.id)
            .await
            .unwrap();
        assert!(pending.is_some());
        assert_eq!(pending.unwrap().id, permission.id);

        // Timeout the permission
        let timed_out = timeout_permission(&test_db.pool, &permission.id)
            .await
            .unwrap();

        assert_eq!(timed_out.status, PermissionStatus::TimedOut);
        assert!(timed_out.expired_at.is_some());

        // Should no longer be returned as pending
        let pending = get_pending_permission(&test_db.pool, &session.id)
            .await
            .unwrap();
        assert!(pending.is_none());
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
