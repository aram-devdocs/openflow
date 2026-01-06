//! Tool State Service
//!
//! Manages tool execution lifecycle within agent sessions.
//! Tool states track individual tool invocations from ToolUse event to ToolResult.
//!
//! # Architecture
//!
//! ```text
//! AgentSession (CLI process run)
//!   └── ToolState (individual tool invocation)
//!         ├── Created on ToolUse event (status: running)
//!         └── Updated on ToolResult event (status: completed/error)
//! ```
//!
//! # Logging
//!
//! This service uses the `log` crate for structured logging:
//! - `debug!`: Detailed operation tracing (query params, internal steps)
//! - `info!`: Successful operations (create, complete)
//! - `warn!`: Potentially problematic but recoverable situations (orphaned results)
//! - `error!`: Operation failures (logged before returning error)
//!
//! # Error Handling
//!
//! All functions return `ServiceResult<T>` which wraps errors in `ServiceError`.
//! Orphaned tool results (results without matching tool_use) are handled gracefully
//! by creating a retroactive tool state record.

use log::{debug, error, info, warn};
use sqlx::SqlitePool;
use uuid::Uuid;

use openflow_contracts::{ToolState, ToolStateSummary, ToolStatus, ToolResultStatus};

use super::{ServiceError, ServiceResult};

// =============================================================================
// Create Operations
// =============================================================================

/// Create a new tool state when a ToolUse event is received.
///
/// This is called when an agent emits a tool_use event, indicating it wants
/// to execute a tool. The tool state is created in 'running' status.
///
/// # Arguments
/// * `pool` - Database connection pool
/// * `session_id` - Session this tool belongs to
/// * `tool_use_id` - Unique ID from the agent's tool_use event
/// * `tool_name` - Name of the tool being called
/// * `input` - Optional JSON input parameters
/// * `command` - Optional command string (for Bash tools)
/// * `file_path` - Optional file path (for Read/Write/Edit tools)
///
/// # Returns
/// The created ToolState record.
///
/// # Errors
/// - Database error if insert fails
/// - Duplicate key if tool_use_id already exists for this session
pub async fn create(
    pool: &SqlitePool,
    session_id: &str,
    tool_use_id: &str,
    tool_name: &str,
    input: Option<&serde_json::Value>,
    command: Option<&str>,
    file_path: Option<&str>,
) -> ServiceResult<ToolState> {
    let id = Uuid::new_v4().to_string();
    let input_str = input.map(|v| v.to_string());

    debug!(
        "Creating tool state: session_id={}, tool_use_id={}, tool_name={}, command={:?}, file_path={:?}",
        session_id, tool_use_id, tool_name, command, file_path
    );

    sqlx::query(
        r#"
        INSERT INTO tool_states (
            id, session_id, tool_use_id, tool_name, input, status, command, file_path
        )
        VALUES (?, ?, ?, ?, ?, 'running', ?, ?)
        "#,
    )
    .bind(&id)
    .bind(session_id)
    .bind(tool_use_id)
    .bind(tool_name)
    .bind(&input_str)
    .bind(command)
    .bind(file_path)
    .execute(pool)
    .await
    .map_err(|e| {
        // Check for unique constraint violation
        if e.to_string().contains("UNIQUE constraint failed") {
            warn!(
                "Duplicate tool_use_id: session_id={}, tool_use_id={}",
                session_id, tool_use_id
            );
        } else {
            error!(
                "Failed to create tool state: session_id={}, tool_use_id={}, error={}",
                session_id, tool_use_id, e
            );
        }
        ServiceError::Database(e)
    })?;

    // Fetch and return the created tool state
    let tool_state = get(pool, &id).await?;

    info!(
        "Created tool state: id={}, session_id={}, tool_name={}",
        id, session_id, tool_name
    );

    Ok(tool_state)
}

/// Create a tool state from a ToolUse event structure.
///
/// Convenience method that extracts fields from the event.
/// Automatically extracts command (for Bash tools) and file_path (for Read/Write/Edit tools)
/// from the input JSON based on common patterns.
///
/// # Tool Input Patterns
/// - **Bash/Shell tools**: `{"command": "ls -la"}` → extracts to `command` field
/// - **Read tools**: `{"path": "/file.txt"}` or `{"file_path": "/file.txt"}` → extracts to `file_path` field
/// - **Write/Edit tools**: `{"path": "/file.txt", "content": "..."}` → extracts to `file_path` field
///
/// # Arguments
/// * `pool` - Database connection pool
/// * `session_id` - Session this tool belongs to
/// * `tool_id` - Tool use ID from the event
/// * `tool_name` - Tool name from the event
/// * `input` - Input JSON from the event
pub async fn create_from_tool_use(
    pool: &SqlitePool,
    session_id: &str,
    tool_id: &str,
    tool_name: &str,
    input: &serde_json::Value,
) -> ServiceResult<ToolState> {
    // Extract command for Bash/Shell tools
    let command = extract_command(tool_name, input);
    
    // Extract file_path for Read/Write/Edit tools
    let file_path = extract_file_path(tool_name, input);
    
    create(
        pool,
        session_id,
        tool_id,
        tool_name,
        Some(input),
        command.as_deref(),
        file_path.as_deref(),
    )
    .await
}

/// Extract command string from tool input for Bash/Shell tools.
///
/// Looks for common command field names in the input JSON.
fn extract_command(tool_name: &str, input: &serde_json::Value) -> Option<String> {
    // Only extract for Bash/Shell/Terminal tools
    let tool_lower = tool_name.to_lowercase();
    if !tool_lower.contains("bash")
        && !tool_lower.contains("shell")
        && !tool_lower.contains("terminal")
        && !tool_lower.contains("command")
    {
        return None;
    }

    // Try common field names
    input
        .get("command")
        .or_else(|| input.get("cmd"))
        .or_else(|| input.get("script"))
        .and_then(|v| v.as_str())
        .map(|s| s.to_string())
}

/// Extract file path from tool input for Read/Write/Edit tools.
///
/// Looks for common path field names in the input JSON.
fn extract_file_path(tool_name: &str, input: &serde_json::Value) -> Option<String> {
    // Only extract for file-related tools
    let tool_lower = tool_name.to_lowercase();
    if !tool_lower.contains("read")
        && !tool_lower.contains("write")
        && !tool_lower.contains("edit")
        && !tool_lower.contains("file")
    {
        return None;
    }

    // Try common field names (path is most common)
    input
        .get("path")
        .or_else(|| input.get("file_path"))
        .or_else(|| input.get("filepath"))
        .or_else(|| input.get("filename"))
        .or_else(|| input.get("file"))
        .and_then(|v| v.as_str())
        .map(|s| s.to_string())
}

// =============================================================================
// Read Operations
// =============================================================================

/// Get a tool state by its database ID.
///
/// # Arguments
/// * `pool` - Database connection pool
/// * `id` - Database ID (not tool_use_id)
///
/// # Returns
/// The tool state or NotFound error.
pub async fn get(pool: &SqlitePool, id: &str) -> ServiceResult<ToolState> {
    debug!("Fetching tool state: id={}", id);

    let tool_state = sqlx::query_as::<_, ToolState>(
        r#"
        SELECT
            id, session_id, tool_use_id, tool_name, input,
            status, output, is_error, command, file_path,
            exit_code, duration_ms, stderr, started_at, completed_at
        FROM tool_states
        WHERE id = ?
        "#,
    )
    .bind(id)
    .fetch_optional(pool)
    .await
    .map_err(|e| {
        error!("Database error while fetching tool state id={}: {}", id, e);
        ServiceError::Database(e)
    })?
    .ok_or_else(|| {
        debug!("Tool state not found: id={}", id);
        ServiceError::NotFound {
            entity: "ToolState",
            id: id.to_string(),
        }
    })?;

    Ok(tool_state)
}

/// Get a tool state by session ID and tool_use_id.
///
/// This is the primary lookup method when processing ToolResult events,
/// as we need to match the result to its corresponding tool_use.
///
/// # Arguments
/// * `pool` - Database connection pool
/// * `session_id` - Session ID
/// * `tool_use_id` - Tool use ID from the agent event
///
/// # Returns
/// The tool state if found, None otherwise.
pub async fn get_by_tool_use_id(
    pool: &SqlitePool,
    session_id: &str,
    tool_use_id: &str,
) -> ServiceResult<Option<ToolState>> {
    debug!(
        "Fetching tool state by tool_use_id: session_id={}, tool_use_id={}",
        session_id, tool_use_id
    );

    let tool_state = sqlx::query_as::<_, ToolState>(
        r#"
        SELECT
            id, session_id, tool_use_id, tool_name, input,
            status, output, is_error, command, file_path,
            exit_code, duration_ms, stderr, started_at, completed_at
        FROM tool_states
        WHERE session_id = ? AND tool_use_id = ?
        "#,
    )
    .bind(session_id)
    .bind(tool_use_id)
    .fetch_optional(pool)
    .await
    .map_err(|e| {
        error!(
            "Database error while fetching tool state: session_id={}, tool_use_id={}, error={}",
            session_id, tool_use_id, e
        );
        ServiceError::Database(e)
    })?;

    Ok(tool_state)
}

/// List all tool states for a session.
///
/// # Arguments
/// * `pool` - Database connection pool
/// * `session_id` - Session ID
///
/// # Returns
/// Tool states ordered by started_at ASC.
pub async fn list_by_session(
    pool: &SqlitePool,
    session_id: &str,
) -> ServiceResult<Vec<ToolState>> {
    debug!("Listing tool states for session_id={}", session_id);

    let tool_states = sqlx::query_as::<_, ToolState>(
        r#"
        SELECT
            id, session_id, tool_use_id, tool_name, input,
            status, output, is_error, command, file_path,
            exit_code, duration_ms, stderr, started_at, completed_at
        FROM tool_states
        WHERE session_id = ?
        ORDER BY started_at ASC
        "#,
    )
    .bind(session_id)
    .fetch_all(pool)
    .await
    .map_err(|e| {
        error!(
            "Failed to list tool states for session_id={}: {}",
            session_id, e
        );
        ServiceError::Database(e)
    })?;

    debug!(
        "Found {} tool states for session_id={}",
        tool_states.len(),
        session_id
    );

    Ok(tool_states)
}

/// Get all pending (running) tool states for a session.
///
/// Used to check if there are tools still awaiting results.
///
/// # Arguments
/// * `pool` - Database connection pool
/// * `session_id` - Session ID
///
/// # Returns
/// Running tool states ordered by started_at ASC.
pub async fn get_pending(
    pool: &SqlitePool,
    session_id: &str,
) -> ServiceResult<Vec<ToolState>> {
    debug!("Getting pending tool states for session_id={}", session_id);

    let tool_states = sqlx::query_as::<_, ToolState>(
        r#"
        SELECT
            id, session_id, tool_use_id, tool_name, input,
            status, output, is_error, command, file_path,
            exit_code, duration_ms, stderr, started_at, completed_at
        FROM tool_states
        WHERE session_id = ? AND status = 'running'
        ORDER BY started_at ASC
        "#,
    )
    .bind(session_id)
    .fetch_all(pool)
    .await
    .map_err(|e| {
        error!(
            "Failed to get pending tool states for session_id={}: {}",
            session_id, e
        );
        ServiceError::Database(e)
    })?;

    debug!(
        "Found {} pending tool states for session_id={}",
        tool_states.len(),
        session_id
    );

    Ok(tool_states)
}

/// Count tool states for a session, optionally filtered by status.
///
/// # Arguments
/// * `pool` - Database connection pool
/// * `session_id` - Session ID
/// * `status` - Optional status filter
///
/// # Returns
/// Count of matching tool states.
pub async fn count(
    pool: &SqlitePool,
    session_id: &str,
    status: Option<ToolStatus>,
) -> ServiceResult<i64> {
    let count: i64 = match status {
        Some(s) => {
            sqlx::query_scalar(
                "SELECT COUNT(*) FROM tool_states WHERE session_id = ? AND status = ?",
            )
            .bind(session_id)
            .bind(s.to_string())
            .fetch_one(pool)
            .await
        }
        None => {
            sqlx::query_scalar("SELECT COUNT(*) FROM tool_states WHERE session_id = ?")
                .bind(session_id)
                .fetch_one(pool)
                .await
        }
    }
    .map_err(|e| {
        error!(
            "Failed to count tool states for session_id={}: {}",
            session_id, e
        );
        ServiceError::Database(e)
    })?;

    Ok(count)
}

/// Get summaries of all tool states for a session.
///
/// Lightweight view for UI display.
///
/// # Arguments
/// * `pool` - Database connection pool
/// * `session_id` - Session ID
pub async fn list_summaries(
    pool: &SqlitePool,
    session_id: &str,
) -> ServiceResult<Vec<ToolStateSummary>> {
    let tool_states = list_by_session(pool, session_id).await?;
    Ok(tool_states.iter().map(ToolStateSummary::from).collect())
}

/// Get all running tools for a session.
///
/// Returns tools that are currently in 'running' status, indicating they
/// have been invoked but have not yet received a result.
///
/// This is a semantic alias for `get_pending()` with a more descriptive name
/// for use cases where you want to track active tool executions.
///
/// # Arguments
/// * `pool` - Database connection pool
/// * `session_id` - Session ID
///
/// # Returns
/// Running tool states ordered by started_at ASC.
///
/// # Example
/// ```no_run
/// # use openflow_core::services::tool_state;
/// # async fn example(pool: &sqlx::SqlitePool, session_id: &str) {
/// let running = tool_state::get_running_tools(pool, session_id)
///     .await
///     .expect("Failed to get running tools");
/// println!("Active tools: {}", running.len());
/// # }
/// ```
pub async fn get_running_tools(
    pool: &SqlitePool,
    session_id: &str,
) -> ServiceResult<Vec<ToolState>> {
    debug!("Getting running tools for session_id={}", session_id);

    let tool_states = sqlx::query_as::<_, ToolState>(
        r#"
        SELECT
            id, session_id, tool_use_id, tool_name, input,
            status, output, is_error, command, file_path,
            exit_code, duration_ms, stderr, started_at, completed_at
        FROM tool_states
        WHERE session_id = ? AND status = 'running'
        ORDER BY started_at ASC
        "#,
    )
    .bind(session_id)
    .fetch_all(pool)
    .await
    .map_err(|e| {
        error!(
            "Failed to get running tools for session_id={}: {}",
            session_id, e
        );
        ServiceError::Database(e)
    })?;

    debug!(
        "Found {} running tools for session_id={}",
        tool_states.len(),
        session_id
    );

    Ok(tool_states)
}

/// Get tool execution history for a session.
///
/// Returns all tools that have completed (either successfully or with errors),
/// ordered by completion time. This is useful for:
/// - Displaying execution timeline
/// - Analyzing tool usage patterns
/// - Debugging failed tools
/// - Generating execution reports
///
/// # Arguments
/// * `pool` - Database connection pool
/// * `session_id` - Session ID
///
/// # Returns
/// Completed/errored tool states ordered by completed_at DESC (most recent first).
///
/// # Example
/// ```no_run
/// # use openflow_core::services::tool_state;
/// # async fn example(pool: &sqlx::SqlitePool, session_id: &str) {
/// let history = tool_state::get_tool_history(pool, session_id)
///     .await
///     .expect("Failed to get tool history");
/// 
/// for tool in history {
///     println!("{}: {} ({}ms)", 
///         tool.tool_name, 
///         tool.status, 
///         tool.duration_ms.unwrap_or(0)
///     );
/// }
/// # }
/// ```
pub async fn get_tool_history(
    pool: &SqlitePool,
    session_id: &str,
) -> ServiceResult<Vec<ToolState>> {
    debug!("Getting tool history for session_id={}", session_id);

    let tool_states = sqlx::query_as::<_, ToolState>(
        r#"
        SELECT
            id, session_id, tool_use_id, tool_name, input,
            status, output, is_error, command, file_path,
            exit_code, duration_ms, stderr, started_at, completed_at
        FROM tool_states
        WHERE session_id = ? AND status IN ('completed', 'error')
        ORDER BY completed_at DESC
        "#,
    )
    .bind(session_id)
    .fetch_all(pool)
    .await
    .map_err(|e| {
        error!(
            "Failed to get tool history for session_id={}: {}",
            session_id, e
        );
        ServiceError::Database(e)
    })?;

    debug!(
        "Found {} completed tools in history for session_id={}",
        tool_states.len(),
        session_id
    );

    Ok(tool_states)
}

// =============================================================================
// Update Operations (Complete Tool)
// =============================================================================

/// Complete a tool with a result.
///
/// Called when a ToolResult event is received. Updates the tool state
/// with the output and marks it as completed or error based on the status.
///
/// # Arguments
/// * `pool` - Database connection pool
/// * `session_id` - Session ID
/// * `tool_use_id` - Tool use ID to match
/// * `status` - Result status (Success, Error, Cancelled)
/// * `output` - Tool output/error message
///
/// # Returns
/// The updated tool state, or creates an orphaned tool state if no match found.
///
/// # Handling Orphaned Results
/// If no matching tool_use is found, this creates a "retroactive" tool state
/// with status set to the result status. This handles edge cases where:
/// - Tool result arrives before tool_use was persisted
/// - Tool_use event was missed/dropped
pub async fn complete(
    pool: &SqlitePool,
    session_id: &str,
    tool_use_id: &str,
    status: ToolResultStatus,
    output: &str,
) -> ServiceResult<ToolState> {
    debug!(
        "Completing tool: session_id={}, tool_use_id={}, status={:?}",
        session_id, tool_use_id, status
    );

    // Try to find existing tool state
    let existing = get_by_tool_use_id(pool, session_id, tool_use_id).await?;

    match existing {
        Some(tool_state) => {
            // Update existing tool state
            let (db_status, is_error) = match status {
                ToolResultStatus::Success => (ToolStatus::Completed, 0),
                ToolResultStatus::Error => (ToolStatus::Error, 1),
                ToolResultStatus::Cancelled => (ToolStatus::Error, 1),
            };

            // Infer exit_code from status
            // For Bash/Shell tools, success=0, error=1 (could be enhanced to parse from output)
            let exit_code = if is_bash_tool(&tool_state.tool_name) {
                Some(if is_error == 0 { 0 } else { 1 })
            } else {
                None
            };

            // For errors, store output as stderr
            let stderr = if is_error == 1 {
                Some(output)
            } else {
                None
            };

            // Calculate duration from started_at to now
            let duration_ms = calculate_duration_from_start(&tool_state.started_at);

            sqlx::query(
                r#"
                UPDATE tool_states
                SET status = ?,
                    output = ?,
                    is_error = ?,
                    exit_code = ?,
                    stderr = ?,
                    duration_ms = ?,
                    completed_at = datetime('now', 'subsec')
                WHERE id = ?
                "#,
            )
            .bind(db_status.to_string())
            .bind(output)
            .bind(is_error)
            .bind(exit_code)
            .bind(stderr)
            .bind(duration_ms)
            .bind(&tool_state.id)
            .execute(pool)
            .await
            .map_err(|e| {
                error!(
                    "Failed to complete tool state id={}: {}",
                    tool_state.id, e
                );
                ServiceError::Database(e)
            })?;

            let updated = get(pool, &tool_state.id).await?;

            info!(
                "Completed tool: id={}, tool_name={}, status={:?}, duration_ms={:?}, exit_code={:?}",
                tool_state.id, tool_state.tool_name, status, duration_ms, exit_code
            );

            Ok(updated)
        }
        None => {
            // Handle orphaned result - create retroactive tool state
            warn!(
                "Orphaned tool result: session_id={}, tool_use_id={} - creating retroactive record",
                session_id, tool_use_id
            );

            create_orphaned(pool, session_id, tool_use_id, status, output).await
        }
    }
}

/// Create an orphaned tool state for a result without a matching tool_use.
///
/// This handles edge cases where tool results arrive without prior tool_use events.
///
/// # Arguments
/// * `pool` - Database connection pool
/// * `session_id` - Session ID
/// * `tool_use_id` - Tool use ID from the result
/// * `status` - Result status
/// * `output` - Tool output
async fn create_orphaned(
    pool: &SqlitePool,
    session_id: &str,
    tool_use_id: &str,
    status: ToolResultStatus,
    output: &str,
) -> ServiceResult<ToolState> {
    let id = Uuid::new_v4().to_string();
    let (db_status, is_error) = match status {
        ToolResultStatus::Success => (ToolStatus::Completed, 0),
        ToolResultStatus::Error => (ToolStatus::Error, 1),
        ToolResultStatus::Cancelled => (ToolStatus::Error, 1),
    };

    // For orphaned tools, we don't know the tool name, so we can't determine exit_code
    // We'll leave it NULL for unknown tool types
    let stderr = if is_error == 1 {
        Some(output)
    } else {
        None
    };

    sqlx::query(
        r#"
        INSERT INTO tool_states (
            id, session_id, tool_use_id, tool_name, input,
            status, output, is_error, stderr, completed_at
        )
        VALUES (?, ?, ?, 'unknown', NULL, ?, ?, ?, ?, datetime('now', 'subsec'))
        "#,
    )
    .bind(&id)
    .bind(session_id)
    .bind(tool_use_id)
    .bind(db_status.to_string())
    .bind(output)
    .bind(is_error)
    .bind(stderr)
    .execute(pool)
    .await
    .map_err(|e| {
        error!(
            "Failed to create orphaned tool state: session_id={}, tool_use_id={}, error={}",
            session_id, tool_use_id, e
        );
        ServiceError::Database(e)
    })?;

    get(pool, &id).await
}

/// Complete a tool from a ToolResult event structure.
///
/// Convenience method that handles the common case of processing a ToolResult event.
///
/// # Arguments
/// * `pool` - Database connection pool
/// * `session_id` - Session this tool belongs to
/// * `tool_id` - Tool ID from the event
/// * `status` - Result status from the event
/// * `output` - Output from the event
pub async fn complete_from_tool_result(
    pool: &SqlitePool,
    session_id: &str,
    tool_id: &str,
    status: ToolResultStatus,
    output: &str,
) -> ServiceResult<ToolState> {
    complete(pool, session_id, tool_id, status, output).await
}

// =============================================================================
// Helper Functions
// =============================================================================

/// Check if a tool is a Bash/Shell/Command tool.
///
/// Used to determine if we should track exit_code for this tool.
fn is_bash_tool(tool_name: &str) -> bool {
    let tool_lower = tool_name.to_lowercase();
    tool_lower.contains("bash")
        || tool_lower.contains("shell")
        || tool_lower.contains("terminal")
        || tool_lower.contains("command")
        || tool_lower.contains("exec")
}

/// Calculate duration in milliseconds from a start timestamp to now.
///
/// Returns None if the timestamp cannot be parsed.
/// Returns i32 (truncated, ~24 day max duration for typeshare compatibility)
fn calculate_duration_from_start(started_at: &str) -> Option<i32> {
    use chrono::{NaiveDateTime, Utc};
    
    let now = Utc::now();
    
    // Try RFC3339 format first (e.g., "2026-01-06T02:05:32.654Z")
    if let Ok(started) = chrono::DateTime::parse_from_rfc3339(started_at) {
        let started_utc = started.with_timezone(&Utc);
        let duration_ms = (now - started_utc).num_milliseconds();
        return Some(duration_ms.clamp(i32::MIN as i64, i32::MAX as i64) as i32);
    }
    
    // Try SQLite datetime format (e.g., "2026-01-06 02:05:32.654")
    // SQLite stores in UTC without timezone indicator
    if let Ok(naive_dt) = NaiveDateTime::parse_from_str(started_at, "%Y-%m-%d %H:%M:%S%.f") {
        let started_utc = naive_dt.and_utc();
        let duration_ms = (now - started_utc).num_milliseconds();
        return Some(duration_ms.clamp(i32::MIN as i64, i32::MAX as i64) as i32);
    }
    
    // Try without fractional seconds
    if let Ok(naive_dt) = NaiveDateTime::parse_from_str(started_at, "%Y-%m-%d %H:%M:%S") {
        let started_utc = naive_dt.and_utc();
        let duration_ms = (now - started_utc).num_milliseconds();
        return Some(duration_ms.clamp(i32::MIN as i64, i32::MAX as i64) as i32);
    }
    
    None
}

// =============================================================================
// Cleanup Operations
// =============================================================================

/// Mark all running tools as error when a session ends unexpectedly.
///
/// Called when a session is killed or fails without completing all tools.
///
/// # Arguments
/// * `pool` - Database connection pool
/// * `session_id` - Session ID
///
/// # Returns
/// Number of tools marked as errored.
pub async fn fail_pending(pool: &SqlitePool, session_id: &str) -> ServiceResult<i64> {
    debug!("Failing pending tools for session_id={}", session_id);

    let result = sqlx::query(
        r#"
        UPDATE tool_states
        SET status = 'error',
            is_error = 1,
            output = 'Session ended before tool completed',
            completed_at = datetime('now', 'subsec')
        WHERE session_id = ? AND status = 'running'
        "#,
    )
    .bind(session_id)
    .execute(pool)
    .await
    .map_err(|e| {
        error!(
            "Failed to fail pending tools for session_id={}: {}",
            session_id, e
        );
        ServiceError::Database(e)
    })?;

    let count = result.rows_affected() as i64;

    if count > 0 {
        info!(
            "Failed {} pending tools for session_id={}",
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

    /// Helper to create a test session (required for FK).
    async fn create_test_session(pool: &SqlitePool) -> String {
        let session_id = Uuid::new_v4().to_string();
        let process_id = Uuid::new_v4().to_string();
        let project_id = Uuid::new_v4().to_string();
        let task_id = Uuid::new_v4().to_string();
        let chat_id = Uuid::new_v4().to_string();

        // Create project
        sqlx::query(
            "INSERT INTO projects (id, name, git_repo_path) VALUES (?, 'Test Project', '/tmp/test')",
        )
        .bind(&project_id)
        .execute(pool)
        .await
        .expect("Failed to create test project");

        // Create task
        sqlx::query(
            r#"
            INSERT INTO tasks (id, project_id, title, status)
            VALUES (?, ?, 'Test Task', 'running')
            "#,
        )
        .bind(&task_id)
        .bind(&project_id)
        .execute(pool)
        .await
        .expect("Failed to create test task");

        // Create chat
        sqlx::query(
            r#"
            INSERT INTO chats (id, task_id, project_id, chat_role)
            VALUES (?, ?, ?, 'main')
            "#,
        )
        .bind(&chat_id)
        .bind(&task_id)
        .bind(&project_id)
        .execute(pool)
        .await
        .expect("Failed to create test chat");

        // Create execution process
        sqlx::query(
            r#"
            INSERT INTO execution_processes (id, chat_id, status, run_reason)
            VALUES (?, ?, 'running', 'codingagent')
            "#,
        )
        .bind(&process_id)
        .bind(&chat_id)
        .execute(pool)
        .await
        .expect("Failed to create test process");

        // Create agent session
        sqlx::query(
            r#"
            INSERT INTO agent_sessions (id, process_id, provider_id, status)
            VALUES (?, ?, 'claude-code', 'running')
            "#,
        )
        .bind(&session_id)
        .bind(&process_id)
        .execute(pool)
        .await
        .expect("Failed to create test session");

        session_id
    }

    // =========================================================================
    // Create Tests
    // =========================================================================

    #[tokio::test]
    async fn test_create_tool_state() {
        let test_db = setup_test_db().await;
        let session_id = create_test_session(&test_db.pool).await;

        let input = serde_json::json!({"path": "/src/main.rs"});
        let tool_state = create(
            &test_db.pool,
            &session_id,
            "tool-123",
            "Read",
            Some(&input),
            None,
            Some("/src/main.rs"),
        )
        .await
        .expect("Failed to create tool state");

        assert!(!tool_state.id.is_empty());
        assert_eq!(tool_state.session_id, session_id);
        assert_eq!(tool_state.tool_use_id, "tool-123");
        assert_eq!(tool_state.tool_name, "Read");
        assert!(tool_state.input.is_some());
        assert!(tool_state.status.is_running());
        assert!(tool_state.output.is_none());
        assert_eq!(tool_state.is_error, 0);
        assert_eq!(tool_state.file_path, Some("/src/main.rs".to_string()));
    }

    #[tokio::test]
    async fn test_create_tool_state_without_input() {
        let test_db = setup_test_db().await;
        let session_id = create_test_session(&test_db.pool).await;

        let tool_state = create(
            &test_db.pool,
            &session_id,
            "tool-456",
            "Bash",
            None,
            Some("ls -la"),
            None,
        )
        .await
        .expect("Failed to create tool state");

        assert_eq!(tool_state.tool_name, "Bash");
        assert!(tool_state.input.is_none());
        assert_eq!(tool_state.command, Some("ls -la".to_string()));
    }

    #[tokio::test]
    async fn test_create_duplicate_tool_use_id() {
        let test_db = setup_test_db().await;
        let session_id = create_test_session(&test_db.pool).await;

        // Create first tool
        create(&test_db.pool, &session_id, "tool-123", "Read", None, None, None)
            .await
            .expect("Failed to create first tool state");

        // Try to create duplicate
        let result = create(&test_db.pool, &session_id, "tool-123", "Write", None, None, None).await;

        assert!(result.is_err());
    }

    // =========================================================================
    // Read Tests
    // =========================================================================

    #[tokio::test]
    async fn test_get_tool_state() {
        let test_db = setup_test_db().await;
        let session_id = create_test_session(&test_db.pool).await;

        let created = create(&test_db.pool, &session_id, "tool-123", "Read", None, None, None)
            .await
            .expect("Failed to create tool state");

        let fetched = get(&test_db.pool, &created.id)
            .await
            .expect("Failed to get tool state");

        assert_eq!(fetched.id, created.id);
        assert_eq!(fetched.tool_use_id, "tool-123");
    }

    #[tokio::test]
    async fn test_get_tool_state_not_found() {
        let test_db = setup_test_db().await;

        let result = get(&test_db.pool, "non-existent-id").await;

        assert!(result.is_err());
        match result.unwrap_err() {
            ServiceError::NotFound { entity, id } => {
                assert_eq!(entity, "ToolState");
                assert_eq!(id, "non-existent-id");
            }
            other => panic!("Expected NotFound error, got: {:?}", other),
        }
    }

    #[tokio::test]
    async fn test_get_by_tool_use_id() {
        let test_db = setup_test_db().await;
        let session_id = create_test_session(&test_db.pool).await;

        create(&test_db.pool, &session_id, "tool-123", "Read", None, None, None)
            .await
            .expect("Failed to create tool state");

        let found = get_by_tool_use_id(&test_db.pool, &session_id, "tool-123")
            .await
            .expect("Failed to get by tool_use_id");

        assert!(found.is_some());
        assert_eq!(found.unwrap().tool_use_id, "tool-123");

        // Not found case
        let not_found = get_by_tool_use_id(&test_db.pool, &session_id, "tool-999")
            .await
            .expect("Failed to query");

        assert!(not_found.is_none());
    }

    #[tokio::test]
    async fn test_list_by_session() {
        let test_db = setup_test_db().await;
        let session_id = create_test_session(&test_db.pool).await;

        // Create multiple tools
        create(&test_db.pool, &session_id, "tool-1", "Read", None, None, None)
            .await
            .unwrap();
        create(&test_db.pool, &session_id, "tool-2", "Write", None, None, None)
            .await
            .unwrap();
        create(&test_db.pool, &session_id, "tool-3", "Bash", None, None, None)
            .await
            .unwrap();

        let tools = list_by_session(&test_db.pool, &session_id)
            .await
            .expect("Failed to list tools");

        assert_eq!(tools.len(), 3);
    }

    #[tokio::test]
    async fn test_get_pending() {
        let test_db = setup_test_db().await;
        let session_id = create_test_session(&test_db.pool).await;

        // Create tools
        create(&test_db.pool, &session_id, "tool-1", "Read", None, None, None)
            .await
            .unwrap();
        create(&test_db.pool, &session_id, "tool-2", "Write", None, None, None)
            .await
            .unwrap();

        // Complete one
        complete(
            &test_db.pool,
            &session_id,
            "tool-1",
            ToolResultStatus::Success,
            "Done",
        )
        .await
        .unwrap();

        let pending = get_pending(&test_db.pool, &session_id)
            .await
            .expect("Failed to get pending");

        assert_eq!(pending.len(), 1);
        assert_eq!(pending[0].tool_use_id, "tool-2");
    }

    #[tokio::test]
    async fn test_count() {
        let test_db = setup_test_db().await;
        let session_id = create_test_session(&test_db.pool).await;

        // Create tools
        create(&test_db.pool, &session_id, "tool-1", "Read", None, None, None)
            .await
            .unwrap();
        create(&test_db.pool, &session_id, "tool-2", "Write", None, None, None)
            .await
            .unwrap();

        // Complete one
        complete(
            &test_db.pool,
            &session_id,
            "tool-1",
            ToolResultStatus::Success,
            "Done",
        )
        .await
        .unwrap();

        let total = count(&test_db.pool, &session_id, None)
            .await
            .expect("Failed to count");
        assert_eq!(total, 2);

        let running = count(&test_db.pool, &session_id, Some(ToolStatus::Running))
            .await
            .expect("Failed to count running");
        assert_eq!(running, 1);

        let completed = count(&test_db.pool, &session_id, Some(ToolStatus::Completed))
            .await
            .expect("Failed to count completed");
        assert_eq!(completed, 1);
    }

    // =========================================================================
    // Complete Tests
    // =========================================================================

    #[tokio::test]
    async fn test_complete_success() {
        let test_db = setup_test_db().await;
        let session_id = create_test_session(&test_db.pool).await;

        create(&test_db.pool, &session_id, "tool-123", "Read", None, None, None)
            .await
            .unwrap();

        let completed = complete(
            &test_db.pool,
            &session_id,
            "tool-123",
            ToolResultStatus::Success,
            "File contents here",
        )
        .await
        .expect("Failed to complete tool");

        assert!(completed.status.is_completed());
        assert_eq!(completed.output, Some("File contents here".to_string()));
        assert_eq!(completed.is_error, 0);
        assert!(completed.completed_at.is_some());
    }

    #[tokio::test]
    async fn test_complete_error() {
        let test_db = setup_test_db().await;
        let session_id = create_test_session(&test_db.pool).await;

        create(&test_db.pool, &session_id, "tool-123", "Read", None, None, None)
            .await
            .unwrap();

        let completed = complete(
            &test_db.pool,
            &session_id,
            "tool-123",
            ToolResultStatus::Error,
            "File not found",
        )
        .await
        .expect("Failed to complete tool");

        assert!(completed.status.is_error());
        assert_eq!(completed.output, Some("File not found".to_string()));
        assert_eq!(completed.is_error, 1);
    }

    #[tokio::test]
    async fn test_complete_cancelled() {
        let test_db = setup_test_db().await;
        let session_id = create_test_session(&test_db.pool).await;

        create(&test_db.pool, &session_id, "tool-123", "Bash", None, None, None)
            .await
            .unwrap();

        let completed = complete(
            &test_db.pool,
            &session_id,
            "tool-123",
            ToolResultStatus::Cancelled,
            "User cancelled",
        )
        .await
        .expect("Failed to complete tool");

        assert!(completed.status.is_error());
        assert_eq!(completed.is_error, 1);
    }

    #[tokio::test]
    async fn test_complete_orphaned_result() {
        let test_db = setup_test_db().await;
        let session_id = create_test_session(&test_db.pool).await;

        // Complete without creating tool first (orphaned result)
        let completed = complete(
            &test_db.pool,
            &session_id,
            "orphan-tool",
            ToolResultStatus::Success,
            "Orphaned output",
        )
        .await
        .expect("Failed to handle orphaned result");

        assert_eq!(completed.tool_use_id, "orphan-tool");
        assert_eq!(completed.tool_name, "unknown");
        assert!(completed.status.is_completed());
        assert!(completed.input.is_none());
    }

    #[tokio::test]
    async fn test_complete_calculates_duration_and_exit_code() {
        let test_db = setup_test_db().await;
        let session_id = create_test_session(&test_db.pool).await;

        // Create a Bash tool (should get exit_code)
        create(&test_db.pool, &session_id, "tool-bash", "Bash", None, Some("ls -la"), None)
            .await
            .unwrap();

        // Wait a bit to ensure measurable duration
        tokio::time::sleep(tokio::time::Duration::from_millis(10)).await;

        // Complete successfully
        let completed = complete(
            &test_db.pool,
            &session_id,
            "tool-bash",
            ToolResultStatus::Success,
            "file1.txt\nfile2.txt",
        )
        .await
        .expect("Failed to complete tool");

        // Verify duration was calculated
        assert!(completed.duration_ms.is_some());
        assert!(completed.duration_ms.unwrap() >= 10); // At least 10ms

        // Verify exit_code was set for bash tool
        assert_eq!(completed.exit_code, Some(0)); // Success = exit code 0

        // Verify stderr is None for success
        assert!(completed.stderr.is_none());
    }

    #[tokio::test]
    async fn test_complete_stores_stderr_on_error() {
        let test_db = setup_test_db().await;
        let session_id = create_test_session(&test_db.pool).await;

        // Create a Bash tool
        create(&test_db.pool, &session_id, "tool-bash-err", "Bash", None, Some("invalid-cmd"), None)
            .await
            .unwrap();

        // Complete with error
        let error_msg = "bash: invalid-cmd: command not found";
        let completed = complete(
            &test_db.pool,
            &session_id,
            "tool-bash-err",
            ToolResultStatus::Error,
            error_msg,
        )
        .await
        .expect("Failed to complete tool");

        // Verify exit_code was set for bash tool error
        assert_eq!(completed.exit_code, Some(1)); // Error = exit code 1

        // Verify stderr contains the error message
        assert_eq!(completed.stderr, Some(error_msg.to_string()));

        // Verify duration was calculated
        assert!(completed.duration_ms.is_some());
    }

    #[tokio::test]
    async fn test_complete_non_bash_tool_no_exit_code() {
        let test_db = setup_test_db().await;
        let session_id = create_test_session(&test_db.pool).await;

        // Create a non-bash tool (Read)
        create(&test_db.pool, &session_id, "tool-read", "Read", None, None, Some("/file.txt"))
            .await
            .unwrap();

        // Complete successfully
        let completed = complete(
            &test_db.pool,
            &session_id,
            "tool-read",
            ToolResultStatus::Success,
            "file contents",
        )
        .await
        .expect("Failed to complete tool");

        // Verify no exit_code for non-bash tools
        assert!(completed.exit_code.is_none());

        // Verify duration was still calculated
        assert!(completed.duration_ms.is_some());

        // Verify no stderr for success
        assert!(completed.stderr.is_none());
    }

    // =========================================================================
    // Cleanup Tests
    // =========================================================================

    #[tokio::test]
    async fn test_fail_pending() {
        let test_db = setup_test_db().await;
        let session_id = create_test_session(&test_db.pool).await;

        // Create tools
        create(&test_db.pool, &session_id, "tool-1", "Read", None, None, None)
            .await
            .unwrap();
        create(&test_db.pool, &session_id, "tool-2", "Write", None, None, None)
            .await
            .unwrap();

        // Complete one
        complete(
            &test_db.pool,
            &session_id,
            "tool-1",
            ToolResultStatus::Success,
            "Done",
        )
        .await
        .unwrap();

        // Fail pending
        let failed_count = fail_pending(&test_db.pool, &session_id)
            .await
            .expect("Failed to fail pending");

        assert_eq!(failed_count, 1);

        // Verify tool-2 is now errored
        let tool2 = get_by_tool_use_id(&test_db.pool, &session_id, "tool-2")
            .await
            .unwrap()
            .unwrap();

        assert!(tool2.status.is_error());
        assert_eq!(tool2.is_error, 1);
        assert!(tool2.output.is_some());
    }

    // =========================================================================
    // Summary Tests
    // =========================================================================

    #[tokio::test]
    async fn test_list_summaries() {
        let test_db = setup_test_db().await;
        let session_id = create_test_session(&test_db.pool).await;

        // Create and complete some tools
        create(&test_db.pool, &session_id, "tool-1", "Read", None, None, None)
            .await
            .unwrap();
        create(&test_db.pool, &session_id, "tool-2", "Write", None, None, None)
            .await
            .unwrap();

        complete(
            &test_db.pool,
            &session_id,
            "tool-1",
            ToolResultStatus::Success,
            "Done",
        )
        .await
        .unwrap();

        let summaries = list_summaries(&test_db.pool, &session_id)
            .await
            .expect("Failed to list summaries");

        assert_eq!(summaries.len(), 2);
        assert!(summaries.iter().any(|s| s.tool_use_id == "tool-1" && s.status.is_completed()));
        assert!(summaries.iter().any(|s| s.tool_use_id == "tool-2" && s.status.is_running()));
    }

    // =========================================================================
    // Helper Function Tests
    // =========================================================================

    #[test]
    fn test_is_bash_tool() {
        assert!(is_bash_tool("Bash"));
        assert!(is_bash_tool("bash"));
        assert!(is_bash_tool("Shell"));
        assert!(is_bash_tool("Terminal"));
        assert!(is_bash_tool("BashCommand"));
        assert!(!is_bash_tool("Read"));
        assert!(!is_bash_tool("Write"));
    }

    #[test]
    fn test_calculate_duration_from_start() {
        use chrono::Utc;
        
        // Create a timestamp 100ms in the past
        let started = Utc::now() - chrono::Duration::milliseconds(100);
        let started_str = started.to_rfc3339();
        
        let duration = calculate_duration_from_start(&started_str);
        assert!(duration.is_some());
        assert!(duration.unwrap() >= 100);
        assert!(duration.unwrap() < 200); // Should be close to 100ms
    }

    // =========================================================================
    // Extraction Tests
    // =========================================================================

    #[tokio::test]
    async fn test_extract_command_from_bash_tool() {
        let test_db = setup_test_db().await;
        let session_id = create_test_session(&test_db.pool).await;

        let input = serde_json::json!({"command": "ls -la"});
        let tool_state = create_from_tool_use(
            &test_db.pool,
            &session_id,
            "tool-bash-1",
            "Bash",
            &input,
        )
        .await
        .expect("Failed to create tool state");

        assert_eq!(tool_state.command, Some("ls -la".to_string()));
        assert_eq!(tool_state.file_path, None);
    }

    #[tokio::test]
    async fn test_extract_file_path_from_read_tool() {
        let test_db = setup_test_db().await;
        let session_id = create_test_session(&test_db.pool).await;

        let input = serde_json::json!({"path": "/src/main.rs"});
        let tool_state = create_from_tool_use(
            &test_db.pool,
            &session_id,
            "tool-read-1",
            "Read",
            &input,
        )
        .await
        .expect("Failed to create tool state");

        assert_eq!(tool_state.file_path, Some("/src/main.rs".to_string()));
        assert_eq!(tool_state.command, None);
    }

    #[tokio::test]
    async fn test_extract_file_path_from_write_tool() {
        let test_db = setup_test_db().await;
        let session_id = create_test_session(&test_db.pool).await;

        let input = serde_json::json!({"path": "/src/lib.rs", "content": "fn main() {}"});
        let tool_state = create_from_tool_use(
            &test_db.pool,
            &session_id,
            "tool-write-1",
            "Write",
            &input,
        )
        .await
        .expect("Failed to create tool state");

        assert_eq!(tool_state.file_path, Some("/src/lib.rs".to_string()));
        assert_eq!(tool_state.command, None);
    }

    #[tokio::test]
    async fn test_extract_command_alternate_field_names() {
        let test_db = setup_test_db().await;
        let session_id = create_test_session(&test_db.pool).await;

        // Test "cmd" field
        let input = serde_json::json!({"cmd": "echo test"});
        let tool_state = create_from_tool_use(
            &test_db.pool,
            &session_id,
            "tool-shell-1",
            "Shell",
            &input,
        )
        .await
        .expect("Failed to create tool state");

        assert_eq!(tool_state.command, Some("echo test".to_string()));
    }

    #[tokio::test]
    async fn test_extract_file_path_alternate_field_names() {
        let test_db = setup_test_db().await;
        let session_id = create_test_session(&test_db.pool).await;

        // Test "file_path" field
        let input = serde_json::json!({"file_path": "/test.txt"});
        let tool_state = create_from_tool_use(
            &test_db.pool,
            &session_id,
            "tool-edit-1",
            "EditFile",
            &input,
        )
        .await
        .expect("Failed to create tool state");

        assert_eq!(tool_state.file_path, Some("/test.txt".to_string()));
    }

    #[tokio::test]
    async fn test_no_extraction_for_non_matching_tools() {
        let test_db = setup_test_db().await;
        let session_id = create_test_session(&test_db.pool).await;

        // Command should not be extracted for non-bash tools
        let input = serde_json::json!({"command": "ls", "path": "/file.txt"});
        let tool_state = create_from_tool_use(
            &test_db.pool,
            &session_id,
            "tool-custom-1",
            "CustomTool",
            &input,
        )
        .await
        .expect("Failed to create tool state");

        // Neither should be extracted for non-matching tool name
        assert_eq!(tool_state.command, None);
        assert_eq!(tool_state.file_path, None);
    }

    // =========================================================================
    // Query Function Tests (get_running_tools, get_tool_history)
    // =========================================================================

    #[tokio::test]
    async fn test_get_running_tools() {
        let test_db = setup_test_db().await;
        let session_id = create_test_session(&test_db.pool).await;

        // Create multiple tools
        create(&test_db.pool, &session_id, "tool-1", "Read", None, None, None)
            .await
            .unwrap();
        create(&test_db.pool, &session_id, "tool-2", "Write", None, None, None)
            .await
            .unwrap();
        create(&test_db.pool, &session_id, "tool-3", "Bash", None, None, None)
            .await
            .unwrap();

        // Complete one tool
        complete(
            &test_db.pool,
            &session_id,
            "tool-1",
            ToolResultStatus::Success,
            "Done",
        )
        .await
        .unwrap();

        // Get running tools
        let running = get_running_tools(&test_db.pool, &session_id)
            .await
            .expect("Failed to get running tools");

        // Should have 2 running tools (tool-2 and tool-3)
        assert_eq!(running.len(), 2);
        assert!(running.iter().all(|t| t.status.is_running()));
        assert!(running.iter().any(|t| t.tool_use_id == "tool-2"));
        assert!(running.iter().any(|t| t.tool_use_id == "tool-3"));

        // Verify ordering by started_at ASC
        for i in 1..running.len() {
            assert!(running[i-1].started_at <= running[i].started_at);
        }
    }

    #[tokio::test]
    async fn test_get_running_tools_empty() {
        let test_db = setup_test_db().await;
        let session_id = create_test_session(&test_db.pool).await;

        // Create and complete all tools
        create(&test_db.pool, &session_id, "tool-1", "Read", None, None, None)
            .await
            .unwrap();
        complete(
            &test_db.pool,
            &session_id,
            "tool-1",
            ToolResultStatus::Success,
            "Done",
        )
        .await
        .unwrap();

        // Get running tools - should be empty
        let running = get_running_tools(&test_db.pool, &session_id)
            .await
            .expect("Failed to get running tools");

        assert_eq!(running.len(), 0);
    }

    #[tokio::test]
    async fn test_get_tool_history() {
        let test_db = setup_test_db().await;
        let session_id = create_test_session(&test_db.pool).await;

        // Create multiple tools
        create(&test_db.pool, &session_id, "tool-1", "Read", None, None, None)
            .await
            .unwrap();
        create(&test_db.pool, &session_id, "tool-2", "Write", None, None, None)
            .await
            .unwrap();
        create(&test_db.pool, &session_id, "tool-3", "Bash", None, None, None)
            .await
            .unwrap();

        // Complete tools with different statuses
        complete(
            &test_db.pool,
            &session_id,
            "tool-1",
            ToolResultStatus::Success,
            "Read successful",
        )
        .await
        .unwrap();

        // Small delay to ensure different completion times
        tokio::time::sleep(tokio::time::Duration::from_millis(10)).await;

        complete(
            &test_db.pool,
            &session_id,
            "tool-2",
            ToolResultStatus::Error,
            "Write failed",
        )
        .await
        .unwrap();

        // Get tool history
        let history = get_tool_history(&test_db.pool, &session_id)
            .await
            .expect("Failed to get tool history");

        // Should have 2 completed tools (tool-1 and tool-2)
        assert_eq!(history.len(), 2);
        
        // Verify all are completed or error
        assert!(history.iter().all(|t| t.status.is_completed() || t.status.is_error()));
        
        // Verify both tools are present
        assert!(history.iter().any(|t| t.tool_use_id == "tool-1" && t.status.is_completed()));
        assert!(history.iter().any(|t| t.tool_use_id == "tool-2" && t.status.is_error()));
        
        // Verify ordering by completed_at DESC (most recent first)
        // tool-2 should be first since it was completed later
        assert_eq!(history[0].tool_use_id, "tool-2");
        assert_eq!(history[1].tool_use_id, "tool-1");
        
        // Verify completed_at timestamps are in descending order
        for i in 1..history.len() {
            let prev_completed = history[i-1].completed_at.as_ref().unwrap();
            let curr_completed = history[i].completed_at.as_ref().unwrap();
            assert!(prev_completed >= curr_completed);
        }
    }

    #[tokio::test]
    async fn test_get_tool_history_empty() {
        let test_db = setup_test_db().await;
        let session_id = create_test_session(&test_db.pool).await;

        // Create tools but don't complete them
        create(&test_db.pool, &session_id, "tool-1", "Read", None, None, None)
            .await
            .unwrap();
        create(&test_db.pool, &session_id, "tool-2", "Write", None, None, None)
            .await
            .unwrap();

        // Get tool history - should be empty since no tools are completed
        let history = get_tool_history(&test_db.pool, &session_id)
            .await
            .expect("Failed to get tool history");

        assert_eq!(history.len(), 0);
    }

    #[tokio::test]
    async fn test_get_tool_history_includes_both_completed_and_error() {
        let test_db = setup_test_db().await;
        let session_id = create_test_session(&test_db.pool).await;

        // Create and complete tools with different statuses
        create(&test_db.pool, &session_id, "tool-success", "Read", None, None, None)
            .await
            .unwrap();
        create(&test_db.pool, &session_id, "tool-error", "Write", None, None, None)
            .await
            .unwrap();
        create(&test_db.pool, &session_id, "tool-cancelled", "Bash", None, None, None)
            .await
            .unwrap();

        complete(
            &test_db.pool,
            &session_id,
            "tool-success",
            ToolResultStatus::Success,
            "Success",
        )
        .await
        .unwrap();

        complete(
            &test_db.pool,
            &session_id,
            "tool-error",
            ToolResultStatus::Error,
            "Error",
        )
        .await
        .unwrap();

        complete(
            &test_db.pool,
            &session_id,
            "tool-cancelled",
            ToolResultStatus::Cancelled,
            "Cancelled",
        )
        .await
        .unwrap();

        // Get tool history
        let history = get_tool_history(&test_db.pool, &session_id)
            .await
            .expect("Failed to get tool history");

        // Should have all 3 tools
        assert_eq!(history.len(), 3);
        
        // Verify we have one of each type
        assert_eq!(history.iter().filter(|t| t.status.is_completed()).count(), 1);
        assert_eq!(history.iter().filter(|t| t.status.is_error()).count(), 2); // Error and Cancelled both map to error
    }

    #[tokio::test]
    async fn test_get_running_tools_vs_get_tool_history_disjoint() {
        let test_db = setup_test_db().await;
        let session_id = create_test_session(&test_db.pool).await;

        // Create multiple tools
        create(&test_db.pool, &session_id, "tool-1", "Read", None, None, None)
            .await
            .unwrap();
        create(&test_db.pool, &session_id, "tool-2", "Write", None, None, None)
            .await
            .unwrap();
        create(&test_db.pool, &session_id, "tool-3", "Bash", None, None, None)
            .await
            .unwrap();

        // Complete one tool
        complete(
            &test_db.pool,
            &session_id,
            "tool-1",
            ToolResultStatus::Success,
            "Done",
        )
        .await
        .unwrap();

        // Get both running and history
        let running = get_running_tools(&test_db.pool, &session_id)
            .await
            .expect("Failed to get running tools");
        let history = get_tool_history(&test_db.pool, &session_id)
            .await
            .expect("Failed to get tool history");

        // Verify they are disjoint sets
        assert_eq!(running.len(), 2); // tool-2, tool-3
        assert_eq!(history.len(), 1); // tool-1

        // Verify no overlap
        let running_ids: Vec<_> = running.iter().map(|t| &t.tool_use_id).collect();
        let history_ids: Vec<_> = history.iter().map(|t| &t.tool_use_id).collect();
        
        for id in &running_ids {
            assert!(!history_ids.contains(id));
        }
        for id in &history_ids {
            assert!(!running_ids.contains(id));
        }

        // Verify total count matches
        let all_tools = list_by_session(&test_db.pool, &session_id)
            .await
            .unwrap();
        assert_eq!(all_tools.len(), running.len() + history.len());
    }
}
