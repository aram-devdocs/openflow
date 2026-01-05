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
) -> ServiceResult<ToolState> {
    let id = Uuid::new_v4().to_string();
    let input_str = input.map(|v| v.to_string());

    debug!(
        "Creating tool state: session_id={}, tool_use_id={}, tool_name={}",
        session_id, tool_use_id, tool_name
    );

    sqlx::query(
        r#"
        INSERT INTO tool_states (
            id, session_id, tool_use_id, tool_name, input, status
        )
        VALUES (?, ?, ?, ?, ?, 'running')
        "#,
    )
    .bind(&id)
    .bind(session_id)
    .bind(tool_use_id)
    .bind(tool_name)
    .bind(&input_str)
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
    create(pool, session_id, tool_id, tool_name, Some(input)).await
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
            status, output, is_error, started_at, completed_at
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
            status, output, is_error, started_at, completed_at
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
            status, output, is_error, started_at, completed_at
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
            status, output, is_error, started_at, completed_at
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

            sqlx::query(
                r#"
                UPDATE tool_states
                SET status = ?,
                    output = ?,
                    is_error = ?,
                    completed_at = datetime('now', 'subsec')
                WHERE id = ?
                "#,
            )
            .bind(db_status.to_string())
            .bind(output)
            .bind(is_error)
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
                "Completed tool: id={}, tool_name={}, status={:?}",
                tool_state.id, tool_state.tool_name, status
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

    sqlx::query(
        r#"
        INSERT INTO tool_states (
            id, session_id, tool_use_id, tool_name, input,
            status, output, is_error, completed_at
        )
        VALUES (?, ?, ?, 'unknown', NULL, ?, ?, ?, datetime('now', 'subsec'))
        "#,
    )
    .bind(&id)
    .bind(session_id)
    .bind(tool_use_id)
    .bind(db_status.to_string())
    .bind(output)
    .bind(is_error)
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

        // Create project
        sqlx::query(
            "INSERT INTO projects (id, name, git_repo_path) VALUES (?, 'Test Project', '/tmp/test')",
        )
        .bind(&project_id)
        .execute(pool)
        .await
        .expect("Failed to create test project");

        // Create execution process
        sqlx::query(
            r#"
            INSERT INTO execution_processes (id, project_id, process_type, status, working_directory)
            VALUES (?, ?, 'agent', 'running', '/tmp/test')
            "#,
        )
        .bind(&process_id)
        .bind(&project_id)
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
    }

    #[tokio::test]
    async fn test_create_tool_state_without_input() {
        let test_db = setup_test_db().await;
        let session_id = create_test_session(&test_db.pool).await;

        let tool_state = create(&test_db.pool, &session_id, "tool-456", "Bash", None)
            .await
            .expect("Failed to create tool state");

        assert_eq!(tool_state.tool_name, "Bash");
        assert!(tool_state.input.is_none());
    }

    #[tokio::test]
    async fn test_create_duplicate_tool_use_id() {
        let test_db = setup_test_db().await;
        let session_id = create_test_session(&test_db.pool).await;

        // Create first tool
        create(&test_db.pool, &session_id, "tool-123", "Read", None)
            .await
            .expect("Failed to create first tool state");

        // Try to create duplicate
        let result = create(&test_db.pool, &session_id, "tool-123", "Write", None).await;

        assert!(result.is_err());
    }

    // =========================================================================
    // Read Tests
    // =========================================================================

    #[tokio::test]
    async fn test_get_tool_state() {
        let test_db = setup_test_db().await;
        let session_id = create_test_session(&test_db.pool).await;

        let created = create(&test_db.pool, &session_id, "tool-123", "Read", None)
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

        create(&test_db.pool, &session_id, "tool-123", "Read", None)
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
        create(&test_db.pool, &session_id, "tool-1", "Read", None)
            .await
            .unwrap();
        create(&test_db.pool, &session_id, "tool-2", "Write", None)
            .await
            .unwrap();
        create(&test_db.pool, &session_id, "tool-3", "Bash", None)
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
        create(&test_db.pool, &session_id, "tool-1", "Read", None)
            .await
            .unwrap();
        create(&test_db.pool, &session_id, "tool-2", "Write", None)
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
        create(&test_db.pool, &session_id, "tool-1", "Read", None)
            .await
            .unwrap();
        create(&test_db.pool, &session_id, "tool-2", "Write", None)
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

        create(&test_db.pool, &session_id, "tool-123", "Read", None)
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

        create(&test_db.pool, &session_id, "tool-123", "Read", None)
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

        create(&test_db.pool, &session_id, "tool-123", "Bash", None)
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

    // =========================================================================
    // Cleanup Tests
    // =========================================================================

    #[tokio::test]
    async fn test_fail_pending() {
        let test_db = setup_test_db().await;
        let session_id = create_test_session(&test_db.pool).await;

        // Create tools
        create(&test_db.pool, &session_id, "tool-1", "Read", None)
            .await
            .unwrap();
        create(&test_db.pool, &session_id, "tool-2", "Write", None)
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
        create(&test_db.pool, &session_id, "tool-1", "Read", None)
            .await
            .unwrap();
        create(&test_db.pool, &session_id, "tool-2", "Write", None)
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
}
