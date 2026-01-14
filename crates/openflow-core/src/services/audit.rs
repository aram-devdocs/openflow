//! Audit Service
//!
//! Provides comprehensive action logging for the system.
//! Every significant action is recorded to enable debugging,
//! compliance, and historical analysis.
//!
//! # Architecture
//!
//! ```text
//! AuditLog (append-only record)
//!   ├── entity_type: What was affected (task, session, etc.)
//!   ├── entity_id: ID of the affected entity
//!   ├── action: What happened (created, completed, etc.)
//!   ├── actor: Who did it (system, user, agent)
//!   └── details: JSON context (optional)
//! ```
//!
//! # Design Principles
//!
//! - **Append-only**: Records are never updated or deleted
//! - **Fast inserts**: Optimized for write performance
//! - **Entity-scoped**: Query by entity for related actions
//! - **Time-ranged**: Query by time window for analysis
//!
//! # Logging
//!
//! This service uses the `log` crate for structured logging:
//! - `debug!`: Detailed operation tracing (query params, internal steps)
//! - `info!`: Successful operations (log created)
//! - `error!`: Operation failures (logged before returning error)
//!
//! # Error Handling
//!
//! All functions return `ServiceResult<T>` which wraps errors in `ServiceError`.
//! Audit failures should not block the primary operation - callers may choose
//! to log errors and continue.

use log::{debug, error, info};
use sqlx::SqlitePool;
use uuid::Uuid;

use openflow_contracts::{AuditAction, AuditActor, AuditEntityType, AuditEntry, AuditLog, AuditLogSummary};

use super::{ServiceError, ServiceResult};

// =============================================================================
// Log Operations
// =============================================================================

/// Log an action to the audit trail.
///
/// This is the primary method for recording actions. It should be called
/// after every significant operation in the system.
///
/// # Arguments
/// * `pool` - Database connection pool
/// * `entry` - The audit entry to log
///
/// # Returns
/// The created audit log record.
///
/// # Performance
/// This operation is optimized for fast inserts. The audit_logs table
/// has minimal indexes to avoid write overhead.
///
/// # Example
/// ```ignore
/// use openflow_contracts::{AuditEntry, AuditAction, AuditActor};
///
/// // Log a task creation
/// let entry = AuditEntry::task("task-123", AuditAction::Created)
///     .with_actor(AuditActor::User);
/// audit::log(&pool, entry).await?;
///
/// // Log a session completion with details
/// let entry = AuditEntry::session("sess-456", AuditAction::Completed)
///     .with_details(serde_json::json!({"exit_code": 0}));
/// audit::log(&pool, entry).await?;
/// ```
pub async fn log(pool: &SqlitePool, entry: AuditEntry) -> ServiceResult<AuditLog> {
    let id = Uuid::new_v4().to_string();
    let details_str = entry.details.as_ref().map(|v| v.to_string());

    debug!(
        "Logging audit: entity_type={}, entity_id={}, action={}, actor={}",
        entry.entity_type, entry.entity_id, entry.action, entry.actor
    );

    sqlx::query(
        r#"
        INSERT INTO audit_logs (id, entity_type, entity_id, action, actor, details)
        VALUES (?, ?, ?, ?, ?, ?)
        "#,
    )
    .bind(&id)
    .bind(entry.entity_type.to_string())
    .bind(&entry.entity_id)
    .bind(entry.action.to_string())
    .bind(entry.actor.to_string())
    .bind(&details_str)
    .execute(pool)
    .await
    .map_err(|e| {
        error!(
            "Failed to create audit log: entity_type={}, entity_id={}, action={}, error={}",
            entry.entity_type, entry.entity_id, entry.action, e
        );
        ServiceError::Database(e)
    })?;

    // Fetch and return the created log
    let audit_log = get(pool, &id).await?;

    info!(
        "Logged audit: id={}, entity_type={}, action={}",
        id, entry.entity_type, entry.action
    );

    Ok(audit_log)
}

/// Log an action without returning the record (fire-and-forget style).
///
/// This is a convenience method when you don't need the created record.
/// Errors are still returned so the caller can handle them appropriately.
///
/// # Arguments
/// * `pool` - Database connection pool
/// * `entry` - The audit entry to log
pub async fn log_silent(pool: &SqlitePool, entry: AuditEntry) -> ServiceResult<()> {
    log(pool, entry).await?;
    Ok(())
}

// =============================================================================
// Query Operations
// =============================================================================

/// Get an audit log by ID.
///
/// # Arguments
/// * `pool` - Database connection pool
/// * `id` - Audit log ID
///
/// # Returns
/// The audit log or NotFound error.
pub async fn get(pool: &SqlitePool, id: &str) -> ServiceResult<AuditLog> {
    debug!("Fetching audit log: id={}", id);

    let audit_log = sqlx::query_as::<_, AuditLog>(
        r#"
        SELECT id, entity_type, entity_id, action, actor, details, created_at
        FROM audit_logs
        WHERE id = ?
        "#,
    )
    .bind(id)
    .fetch_optional(pool)
    .await
    .map_err(|e| {
        error!("Database error while fetching audit log id={}: {}", id, e);
        ServiceError::Database(e)
    })?
    .ok_or_else(|| {
        debug!("Audit log not found: id={}", id);
        ServiceError::NotFound {
            entity: "AuditLog",
            id: id.to_string(),
        }
    })?;

    Ok(audit_log)
}

/// Get all audit logs for a specific entity.
///
/// # Arguments
/// * `pool` - Database connection pool
/// * `entity_type` - Type of entity
/// * `entity_id` - ID of the entity
///
/// # Returns
/// Audit logs ordered by created_at DESC (newest first).
pub async fn get_for_entity(
    pool: &SqlitePool,
    entity_type: AuditEntityType,
    entity_id: &str,
) -> ServiceResult<Vec<AuditLog>> {
    debug!(
        "Fetching audit logs for entity: type={}, id={}",
        entity_type, entity_id
    );

    let logs = sqlx::query_as::<_, AuditLog>(
        r#"
        SELECT id, entity_type, entity_id, action, actor, details, created_at
        FROM audit_logs
        WHERE entity_type = ? AND entity_id = ?
        ORDER BY created_at DESC
        "#,
    )
    .bind(entity_type.to_string())
    .bind(entity_id)
    .fetch_all(pool)
    .await
    .map_err(|e| {
        error!(
            "Failed to fetch audit logs for entity: type={}, id={}, error={}",
            entity_type, entity_id, e
        );
        ServiceError::Database(e)
    })?;

    debug!(
        "Found {} audit logs for entity: type={}, id={}",
        logs.len(),
        entity_type,
        entity_id
    );

    Ok(logs)
}

/// Get audit logs for an entity, filtering by entity_id only.
///
/// This is useful when you have the entity_id but want all related logs
/// regardless of entity_type (e.g., a task_id might be logged as both
/// "task" and "step" entity types).
///
/// # Arguments
/// * `pool` - Database connection pool
/// * `entity_id` - ID of the entity
///
/// # Returns
/// Audit logs ordered by created_at DESC.
pub async fn get_for_entity_id(pool: &SqlitePool, entity_id: &str) -> ServiceResult<Vec<AuditLog>> {
    debug!("Fetching audit logs for entity_id={}", entity_id);

    let logs = sqlx::query_as::<_, AuditLog>(
        r#"
        SELECT id, entity_type, entity_id, action, actor, details, created_at
        FROM audit_logs
        WHERE entity_id = ?
        ORDER BY created_at DESC
        "#,
    )
    .bind(entity_id)
    .fetch_all(pool)
    .await
    .map_err(|e| {
        error!(
            "Failed to fetch audit logs for entity_id={}: {}",
            entity_id, e
        );
        ServiceError::Database(e)
    })?;

    debug!(
        "Found {} audit logs for entity_id={}",
        logs.len(),
        entity_id
    );

    Ok(logs)
}

/// Get audit logs for a time range.
///
/// # Arguments
/// * `pool` - Database connection pool
/// * `since` - Start time (ISO 8601, inclusive)
/// * `until` - End time (ISO 8601, exclusive), or None for now
/// * `limit` - Maximum number of records to return
///
/// # Returns
/// Audit logs ordered by created_at DESC.
pub async fn get_for_time_range(
    pool: &SqlitePool,
    since: &str,
    until: Option<&str>,
    limit: i64,
) -> ServiceResult<Vec<AuditLog>> {
    debug!(
        "Fetching audit logs for time range: since={}, until={:?}, limit={}",
        since, until, limit
    );

    let logs = match until {
        Some(end) => {
            sqlx::query_as::<_, AuditLog>(
                r#"
                SELECT id, entity_type, entity_id, action, actor, details, created_at
                FROM audit_logs
                WHERE created_at >= ? AND created_at < ?
                ORDER BY created_at DESC
                LIMIT ?
                "#,
            )
            .bind(since)
            .bind(end)
            .bind(limit)
            .fetch_all(pool)
            .await
        }
        None => {
            sqlx::query_as::<_, AuditLog>(
                r#"
                SELECT id, entity_type, entity_id, action, actor, details, created_at
                FROM audit_logs
                WHERE created_at >= ?
                ORDER BY created_at DESC
                LIMIT ?
                "#,
            )
            .bind(since)
            .bind(limit)
            .fetch_all(pool)
            .await
        }
    }
    .map_err(|e| {
        error!(
            "Failed to fetch audit logs for time range: since={}, until={:?}, error={}",
            since, until, e
        );
        ServiceError::Database(e)
    })?;

    debug!(
        "Found {} audit logs for time range since={}",
        logs.len(),
        since
    );

    Ok(logs)
}

/// Get recent audit logs for a specific action type.
///
/// # Arguments
/// * `pool` - Database connection pool
/// * `action` - Action type to filter by
/// * `limit` - Maximum number of records to return
///
/// # Returns
/// Audit logs ordered by created_at DESC.
pub async fn get_by_action(
    pool: &SqlitePool,
    action: AuditAction,
    limit: i64,
) -> ServiceResult<Vec<AuditLog>> {
    debug!("Fetching audit logs for action={}, limit={}", action, limit);

    let logs = sqlx::query_as::<_, AuditLog>(
        r#"
        SELECT id, entity_type, entity_id, action, actor, details, created_at
        FROM audit_logs
        WHERE action = ?
        ORDER BY created_at DESC
        LIMIT ?
        "#,
    )
    .bind(action.to_string())
    .bind(limit)
    .fetch_all(pool)
    .await
    .map_err(|e| {
        error!("Failed to fetch audit logs for action={}: {}", action, e);
        ServiceError::Database(e)
    })?;

    debug!("Found {} audit logs for action={}", logs.len(), action);

    Ok(logs)
}

/// Get recent audit logs by a specific actor.
///
/// # Arguments
/// * `pool` - Database connection pool
/// * `actor` - Actor to filter by
/// * `limit` - Maximum number of records to return
///
/// # Returns
/// Audit logs ordered by created_at DESC.
pub async fn get_by_actor(
    pool: &SqlitePool,
    actor: AuditActor,
    limit: i64,
) -> ServiceResult<Vec<AuditLog>> {
    debug!("Fetching audit logs for actor={}, limit={}", actor, limit);

    let logs = sqlx::query_as::<_, AuditLog>(
        r#"
        SELECT id, entity_type, entity_id, action, actor, details, created_at
        FROM audit_logs
        WHERE actor = ?
        ORDER BY created_at DESC
        LIMIT ?
        "#,
    )
    .bind(actor.to_string())
    .bind(limit)
    .fetch_all(pool)
    .await
    .map_err(|e| {
        error!("Failed to fetch audit logs for actor={}: {}", actor, e);
        ServiceError::Database(e)
    })?;

    debug!("Found {} audit logs for actor={}", logs.len(), actor);

    Ok(logs)
}

/// Get the most recent audit logs.
///
/// # Arguments
/// * `pool` - Database connection pool
/// * `limit` - Maximum number of records to return
///
/// # Returns
/// Audit logs ordered by created_at DESC.
pub async fn get_recent(pool: &SqlitePool, limit: i64) -> ServiceResult<Vec<AuditLog>> {
    debug!("Fetching recent {} audit logs", limit);

    let logs = sqlx::query_as::<_, AuditLog>(
        r#"
        SELECT id, entity_type, entity_id, action, actor, details, created_at
        FROM audit_logs
        ORDER BY created_at DESC
        LIMIT ?
        "#,
    )
    .bind(limit)
    .fetch_all(pool)
    .await
    .map_err(|e| {
        error!("Failed to fetch recent audit logs: {}", e);
        ServiceError::Database(e)
    })?;

    debug!("Found {} recent audit logs", logs.len());

    Ok(logs)
}

/// Get audit log summaries for an entity.
///
/// Lightweight view for UI display.
///
/// # Arguments
/// * `pool` - Database connection pool
/// * `entity_type` - Type of entity
/// * `entity_id` - ID of the entity
pub async fn get_summaries_for_entity(
    pool: &SqlitePool,
    entity_type: AuditEntityType,
    entity_id: &str,
) -> ServiceResult<Vec<AuditLogSummary>> {
    let logs = get_for_entity(pool, entity_type, entity_id).await?;
    Ok(logs.iter().map(AuditLogSummary::from).collect())
}

// =============================================================================
// Counting Operations
// =============================================================================

/// Count audit logs for an entity.
///
/// # Arguments
/// * `pool` - Database connection pool
/// * `entity_type` - Type of entity
/// * `entity_id` - ID of the entity
///
/// # Returns
/// The count of audit logs.
pub async fn count_for_entity(
    pool: &SqlitePool,
    entity_type: AuditEntityType,
    entity_id: &str,
) -> ServiceResult<i64> {
    let count: i64 = sqlx::query_scalar(
        "SELECT COUNT(*) FROM audit_logs WHERE entity_type = ? AND entity_id = ?",
    )
    .bind(entity_type.to_string())
    .bind(entity_id)
    .fetch_one(pool)
    .await
    .map_err(|e| {
        error!(
            "Failed to count audit logs for entity: type={}, id={}, error={}",
            entity_type, entity_id, e
        );
        ServiceError::Database(e)
    })?;

    Ok(count)
}

/// Count all audit logs (for monitoring/metrics).
///
/// # Arguments
/// * `pool` - Database connection pool
///
/// # Returns
/// The total count of audit logs.
pub async fn count_all(pool: &SqlitePool) -> ServiceResult<i64> {
    let count: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM audit_logs")
        .fetch_one(pool)
        .await
        .map_err(|e| {
            error!("Failed to count audit logs: {}", e);
            ServiceError::Database(e)
        })?;

    Ok(count)
}

// =============================================================================
// Convenience Helpers
// =============================================================================

/// Log a task action.
///
/// # Arguments
/// * `pool` - Database connection pool
/// * `task_id` - Task ID
/// * `action` - Action performed
/// * `actor` - Who performed it
/// * `details` - Optional additional context
pub async fn log_task(
    pool: &SqlitePool,
    task_id: &str,
    action: AuditAction,
    actor: AuditActor,
    details: Option<serde_json::Value>,
) -> ServiceResult<()> {
    let mut entry = AuditEntry::task(task_id, action).with_actor(actor);
    if let Some(d) = details {
        entry = entry.with_details(d);
    }
    log_silent(pool, entry).await
}

/// Log a session action.
///
/// # Arguments
/// * `pool` - Database connection pool
/// * `session_id` - Session ID
/// * `action` - Action performed
/// * `details` - Optional additional context
pub async fn log_session(
    pool: &SqlitePool,
    session_id: &str,
    action: AuditAction,
    details: Option<serde_json::Value>,
) -> ServiceResult<()> {
    let mut entry = AuditEntry::session(session_id, action);
    if let Some(d) = details {
        entry = entry.with_details(d);
    }
    log_silent(pool, entry).await
}

/// Log a permission action.
///
/// # Arguments
/// * `pool` - Database connection pool
/// * `permission_id` - Permission ID
/// * `action` - Action performed (typically Approved or Denied)
/// * `details` - Optional additional context
pub async fn log_permission(
    pool: &SqlitePool,
    permission_id: &str,
    action: AuditAction,
    details: Option<serde_json::Value>,
) -> ServiceResult<()> {
    let mut entry = AuditEntry::permission(permission_id, action)
        .with_actor(AuditActor::User);
    if let Some(d) = details {
        entry = entry.with_details(d);
    }
    log_silent(pool, entry).await
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

    // =========================================================================
    // Log Tests
    // =========================================================================

    #[tokio::test]
    async fn test_log_basic() {
        let test_db = setup_test_db().await;

        let entry = AuditEntry::task("task-123", AuditAction::Created);
        let audit_log = log(&test_db.pool, entry)
            .await
            .expect("Failed to log audit");

        assert!(!audit_log.id.is_empty());
        assert_eq!(audit_log.entity_type, "task");
        assert_eq!(audit_log.entity_id, "task-123");
        assert_eq!(audit_log.action, "created");
        assert_eq!(audit_log.actor, "system");
        assert!(audit_log.details.is_none());
        assert!(!audit_log.created_at.is_empty());
    }

    #[tokio::test]
    async fn test_log_with_actor() {
        let test_db = setup_test_db().await;

        let entry = AuditEntry::permission("perm-123", AuditAction::Approved)
            .with_actor(AuditActor::User);
        let audit_log = log(&test_db.pool, entry)
            .await
            .expect("Failed to log audit");

        assert_eq!(audit_log.actor, "user");
    }

    #[tokio::test]
    async fn test_log_with_details() {
        let test_db = setup_test_db().await;

        let details = serde_json::json!({"exit_code": 0, "duration_ms": 1500});
        let entry = AuditEntry::session("sess-123", AuditAction::Completed)
            .with_details(details.clone());
        let audit_log = log(&test_db.pool, entry)
            .await
            .expect("Failed to log audit");

        assert!(audit_log.details.is_some());
        let parsed = audit_log.details_json().unwrap();
        assert_eq!(parsed["exit_code"], 0);
        assert_eq!(parsed["duration_ms"], 1500);
    }

    #[tokio::test]
    async fn test_log_silent() {
        let test_db = setup_test_db().await;

        let entry = AuditEntry::project("proj-123", AuditAction::Updated);
        log_silent(&test_db.pool, entry)
            .await
            .expect("Failed to log audit silently");

        // Verify it was logged
        let count = count_for_entity(&test_db.pool, AuditEntityType::Project, "proj-123")
            .await
            .unwrap();
        assert_eq!(count, 1);
    }

    // =========================================================================
    // Query Tests
    // =========================================================================

    #[tokio::test]
    async fn test_get() {
        let test_db = setup_test_db().await;

        let entry = AuditEntry::task("task-123", AuditAction::Started);
        let created = log(&test_db.pool, entry).await.unwrap();

        let fetched = get(&test_db.pool, &created.id)
            .await
            .expect("Failed to get audit log");

        assert_eq!(fetched.id, created.id);
        assert_eq!(fetched.entity_id, "task-123");
    }

    #[tokio::test]
    async fn test_get_not_found() {
        let test_db = setup_test_db().await;

        let result = get(&test_db.pool, "non-existent").await;

        assert!(result.is_err());
        match result.unwrap_err() {
            ServiceError::NotFound { entity, id } => {
                assert_eq!(entity, "AuditLog");
                assert_eq!(id, "non-existent");
            }
            other => panic!("Expected NotFound error, got: {:?}", other),
        }
    }

    #[tokio::test]
    async fn test_get_for_entity() {
        let test_db = setup_test_db().await;

        // Log multiple actions for the same entity
        log(&test_db.pool, AuditEntry::task("task-123", AuditAction::Created))
            .await
            .unwrap();
        log(&test_db.pool, AuditEntry::task("task-123", AuditAction::Started))
            .await
            .unwrap();
        log(&test_db.pool, AuditEntry::task("task-123", AuditAction::Completed))
            .await
            .unwrap();

        // Log action for different entity
        log(&test_db.pool, AuditEntry::task("task-456", AuditAction::Created))
            .await
            .unwrap();

        let logs = get_for_entity(&test_db.pool, AuditEntityType::Task, "task-123")
            .await
            .expect("Failed to get logs");

        assert_eq!(logs.len(), 3);
        // Check all expected actions are present (order may vary if timestamps are identical)
        let actions: Vec<&str> = logs.iter().map(|l| l.action.as_str()).collect();
        assert!(actions.contains(&"completed"));
        assert!(actions.contains(&"started"));
        assert!(actions.contains(&"created"));
    }

    #[tokio::test]
    async fn test_get_for_entity_id() {
        let test_db = setup_test_db().await;

        // Log actions with same entity_id but different entity types
        log(
            &test_db.pool,
            AuditEntry::new(AuditEntityType::Task, "entity-123", AuditAction::Created),
        )
        .await
        .unwrap();
        log(
            &test_db.pool,
            AuditEntry::new(AuditEntityType::Step, "entity-123", AuditAction::Started),
        )
        .await
        .unwrap();

        let logs = get_for_entity_id(&test_db.pool, "entity-123")
            .await
            .expect("Failed to get logs");

        assert_eq!(logs.len(), 2);
    }

    #[tokio::test]
    async fn test_get_by_action() {
        let test_db = setup_test_db().await;

        // Log various actions
        log(&test_db.pool, AuditEntry::task("task-1", AuditAction::Failed))
            .await
            .unwrap();
        log(&test_db.pool, AuditEntry::task("task-2", AuditAction::Completed))
            .await
            .unwrap();
        log(&test_db.pool, AuditEntry::session("sess-1", AuditAction::Failed))
            .await
            .unwrap();

        let failed_logs = get_by_action(&test_db.pool, AuditAction::Failed, 100)
            .await
            .expect("Failed to get logs");

        assert_eq!(failed_logs.len(), 2);
        assert!(failed_logs.iter().all(|l| l.action == "failed"));
    }

    #[tokio::test]
    async fn test_get_by_actor() {
        let test_db = setup_test_db().await;

        // Log actions by different actors
        log(
            &test_db.pool,
            AuditEntry::task("task-1", AuditAction::Created).with_actor(AuditActor::User),
        )
        .await
        .unwrap();
        log(
            &test_db.pool,
            AuditEntry::task("task-2", AuditAction::Started).with_actor(AuditActor::System),
        )
        .await
        .unwrap();
        log(
            &test_db.pool,
            AuditEntry::task("task-3", AuditAction::Updated).with_actor(AuditActor::User),
        )
        .await
        .unwrap();

        let user_logs = get_by_actor(&test_db.pool, AuditActor::User, 100)
            .await
            .expect("Failed to get logs");

        assert_eq!(user_logs.len(), 2);
        assert!(user_logs.iter().all(|l| l.actor == "user"));
    }

    #[tokio::test]
    async fn test_get_recent() {
        let test_db = setup_test_db().await;

        // Log 5 entries
        for i in 0..5 {
            log(
                &test_db.pool,
                AuditEntry::task(format!("task-{}", i), AuditAction::Created),
            )
            .await
            .unwrap();
        }

        let recent = get_recent(&test_db.pool, 3)
            .await
            .expect("Failed to get recent logs");

        assert_eq!(recent.len(), 3);
        // Should be ordered DESC - newest first
        assert_eq!(recent[0].entity_id, "task-4");
        assert_eq!(recent[1].entity_id, "task-3");
        assert_eq!(recent[2].entity_id, "task-2");
    }

    // =========================================================================
    // Counting Tests
    // =========================================================================

    #[tokio::test]
    async fn test_count_for_entity() {
        let test_db = setup_test_db().await;

        // Log 3 entries for one entity
        for _ in 0..3 {
            log(&test_db.pool, AuditEntry::task("task-123", AuditAction::Updated))
                .await
                .unwrap();
        }

        let count = count_for_entity(&test_db.pool, AuditEntityType::Task, "task-123")
            .await
            .expect("Failed to count");

        assert_eq!(count, 3);
    }

    #[tokio::test]
    async fn test_count_all() {
        let test_db = setup_test_db().await;

        // Log 5 entries
        for i in 0..5 {
            log(
                &test_db.pool,
                AuditEntry::task(format!("task-{}", i), AuditAction::Created),
            )
            .await
            .unwrap();
        }

        let count = count_all(&test_db.pool).await.expect("Failed to count");

        assert_eq!(count, 5);
    }

    // =========================================================================
    // Convenience Helper Tests
    // =========================================================================

    #[tokio::test]
    async fn test_log_task_helper() {
        let test_db = setup_test_db().await;

        log_task(
            &test_db.pool,
            "task-123",
            AuditAction::Paused,
            AuditActor::User,
            None,
        )
        .await
        .expect("Failed to log task");

        let logs = get_for_entity(&test_db.pool, AuditEntityType::Task, "task-123")
            .await
            .unwrap();

        assert_eq!(logs.len(), 1);
        assert_eq!(logs[0].action, "paused");
        assert_eq!(logs[0].actor, "user");
    }

    #[tokio::test]
    async fn test_log_session_helper() {
        let test_db = setup_test_db().await;

        log_session(
            &test_db.pool,
            "sess-123",
            AuditAction::Killed,
            Some(serde_json::json!({"reason": "user_request"})),
        )
        .await
        .expect("Failed to log session");

        let logs = get_for_entity(&test_db.pool, AuditEntityType::Session, "sess-123")
            .await
            .unwrap();

        assert_eq!(logs.len(), 1);
        assert_eq!(logs[0].action, "killed");
        let details = logs[0].details_json().unwrap();
        assert_eq!(details["reason"], "user_request");
    }

    #[tokio::test]
    async fn test_log_permission_helper() {
        let test_db = setup_test_db().await;

        log_permission(
            &test_db.pool,
            "perm-123",
            AuditAction::Denied,
            Some(serde_json::json!({"tool_name": "Bash"})),
        )
        .await
        .expect("Failed to log permission");

        let logs = get_for_entity(&test_db.pool, AuditEntityType::Permission, "perm-123")
            .await
            .unwrap();

        assert_eq!(logs.len(), 1);
        assert_eq!(logs[0].action, "denied");
        assert_eq!(logs[0].actor, "user"); // Permission actions default to user
    }

    // =========================================================================
    // Summary Tests
    // =========================================================================

    #[tokio::test]
    async fn test_get_summaries_for_entity() {
        let test_db = setup_test_db().await;

        // Log some actions
        log(&test_db.pool, AuditEntry::task("task-123", AuditAction::Created))
            .await
            .unwrap();
        log(&test_db.pool, AuditEntry::task("task-123", AuditAction::Started))
            .await
            .unwrap();

        let summaries = get_summaries_for_entity(&test_db.pool, AuditEntityType::Task, "task-123")
            .await
            .expect("Failed to get summaries");

        assert_eq!(summaries.len(), 2);
        // Summaries should have key fields but not details
        assert!(!summaries[0].id.is_empty());
        assert_eq!(summaries[0].entity_type, "task");
        assert!(!summaries[0].created_at.is_empty());
    }
}
