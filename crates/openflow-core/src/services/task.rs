//! Task management service.
//!
//! Handles CRUD operations for tasks and their associated chats/steps.
//! Supports the new agent orchestration architecture with step-based execution.
//!
//! # Architecture
//!
//! Tasks represent units of work that can be executed autonomously by agents.
//! Each task contains ordered steps (TaskStep) that are executed sequentially.
//! The service provides:
//! - CRUD operations for tasks
//! - Step-based task retrieval (get_with_steps)
//! - Status management for task execution lifecycle
//! - Step advancement for sequential execution
//!
//! # Logging
//!
//! This module uses structured logging at the following levels:
//! - `debug`: Query parameters, function entry/exit, intermediate states
//! - `info`: Successful operations with key identifiers (task_id, title, status)
//! - `warn`: Non-critical issues (already archived tasks, validation edge cases)
//! - `error`: Operation failures with context for debugging
//!
//! # Error Handling
//!
//! All functions return `ServiceResult<T>` with:
//! - `ServiceError::NotFound` for missing tasks
//! - `ServiceError::Database` for database failures (via `?` operator)
//! - `ServiceError::InvalidInput` for invalid state transitions

use log::{debug, error, info, warn};
use sqlx::SqlitePool;
use uuid::Uuid;

use openflow_contracts::{
    Chat, CreateStepRequest, CreateTaskRequest, StepStatus, Task, TaskStatus, TaskStep,
    TaskWithChats, TaskWithSteps, UpdateTaskRequest,
};

use super::{ServiceError, ServiceResult};

// =============================================================================
// SQL Column Constants
// =============================================================================

/// Task columns for SELECT queries - ensures consistency across all queries
const TASK_COLUMNS: &str = r#"
    id, project_id, title, description, status,
    auto_run, current_step_index, worktree_id,
    workflow_template, parent_task_id, default_executor_profile_id, base_branch,
    archived_at, started_at, ended_at, created_at, updated_at
"#;

/// TaskStep columns for SELECT queries
const STEP_COLUMNS: &str = r#"
    id, task_id, step_index, title, prompt, provider_id, status,
    parallel_group, worktree_id, session_id, started_at, ended_at, created_at, updated_at
"#;

// =============================================================================
// List Operations
// =============================================================================

/// List tasks for a project with optional status filter.
///
/// # Arguments
/// * `pool` - Database connection pool
/// * `project_id` - Project to list tasks for
/// * `status` - Optional status filter
/// * `include_archived` - Whether to include archived tasks (default: false)
pub async fn list(
    pool: &SqlitePool,
    project_id: &str,
    status: Option<TaskStatus>,
    include_archived: bool,
) -> ServiceResult<Vec<Task>> {
    debug!(
        "Listing tasks: project_id={}, status={:?}, include_archived={}",
        project_id, status, include_archived
    );

    let tasks = match (status, include_archived) {
        (Some(status), true) => {
            sqlx::query_as::<_, Task>(&format!(
                "SELECT {} FROM tasks WHERE project_id = ? AND status = ? ORDER BY created_at DESC",
                TASK_COLUMNS
            ))
            .bind(project_id)
            .bind(status.to_string())
            .fetch_all(pool)
            .await
            .map_err(|e| {
                error!("Failed to list tasks for project {}: {}", project_id, e);
                ServiceError::Database(e)
            })?
        }
        (Some(status), false) => {
            sqlx::query_as::<_, Task>(&format!(
                "SELECT {} FROM tasks WHERE project_id = ? AND status = ? AND archived_at IS NULL ORDER BY created_at DESC",
                TASK_COLUMNS
            ))
            .bind(project_id)
            .bind(status.to_string())
            .fetch_all(pool)
            .await
            .map_err(|e| {
                error!("Failed to list tasks for project {}: {}", project_id, e);
                ServiceError::Database(e)
            })?
        }
        (None, true) => {
            sqlx::query_as::<_, Task>(&format!(
                "SELECT {} FROM tasks WHERE project_id = ? ORDER BY created_at DESC",
                TASK_COLUMNS
            ))
            .bind(project_id)
            .fetch_all(pool)
            .await
            .map_err(|e| {
                error!("Failed to list tasks for project {}: {}", project_id, e);
                ServiceError::Database(e)
            })?
        }
        (None, false) => {
            sqlx::query_as::<_, Task>(&format!(
                "SELECT {} FROM tasks WHERE project_id = ? AND archived_at IS NULL ORDER BY created_at DESC",
                TASK_COLUMNS
            ))
            .bind(project_id)
            .fetch_all(pool)
            .await
            .map_err(|e| {
                error!("Failed to list tasks for project {}: {}", project_id, e);
                ServiceError::Database(e)
            })?
        }
    };

    // Count tasks by status for logging
    let by_status = tasks
        .iter()
        .fold(std::collections::HashMap::new(), |mut acc, task| {
            *acc.entry(task.status.to_string()).or_insert(0) += 1;
            acc
        });

    info!(
        "Listed {} tasks for project {}: by_status={:?}, titles={:?}",
        tasks.len(),
        project_id,
        by_status,
        tasks.iter().take(5).map(|t| &t.title).collect::<Vec<_>>()
    );

    Ok(tasks)
}

// =============================================================================
// Get Operations
// =============================================================================

/// Get a task by ID with its associated chats.
pub async fn get(pool: &SqlitePool, id: &str) -> ServiceResult<TaskWithChats> {
    debug!("Fetching task: id={}", id);

    let task = sqlx::query_as::<_, Task>(&format!(
        "SELECT {} FROM tasks WHERE id = ?",
        TASK_COLUMNS
    ))
    .bind(id)
    .fetch_optional(pool)
    .await
    .map_err(|e| {
        error!("Failed to fetch task {}: {}", id, e);
        ServiceError::Database(e)
    })?
    .ok_or_else(|| {
        error!("Task not found: id={}", id);
        ServiceError::NotFound {
            entity: "Task",
            id: id.to_string(),
        }
    })?;

    let chats = sqlx::query_as::<_, Chat>(
        r#"
        SELECT
            id, task_id, project_id, title, chat_role, executor_profile_id,
            base_branch, branch, worktree_path, worktree_deleted,
            setup_completed_at, initial_prompt, hidden_prompt,
            is_plan_container, main_chat_id, workflow_step_index,
            claude_session_id, archived_at, created_at, updated_at
        FROM chats
        WHERE task_id = ? AND archived_at IS NULL
        ORDER BY workflow_step_index ASC, created_at ASC
        "#,
    )
    .bind(id)
    .fetch_all(pool)
    .await
    .map_err(|e| {
        error!("Failed to fetch chats for task {}: {}", id, e);
        ServiceError::Database(e)
    })?;

    debug!(
        "Fetched task: id={}, title={}, status={}, chat_count={}",
        task.id,
        task.title,
        task.status,
        chats.len()
    );

    Ok(TaskWithChats::with_chats(task, chats))
}

/// Get a task by ID (without chats).
pub async fn get_task(pool: &SqlitePool, id: &str) -> ServiceResult<Task> {
    debug!("Fetching task (no chats): id={}", id);

    let task = sqlx::query_as::<_, Task>(&format!(
        "SELECT {} FROM tasks WHERE id = ?",
        TASK_COLUMNS
    ))
    .bind(id)
    .fetch_optional(pool)
    .await
    .map_err(|e| {
        error!("Failed to fetch task {}: {}", id, e);
        ServiceError::Database(e)
    })?
    .ok_or_else(|| {
        error!("Task not found: id={}", id);
        ServiceError::NotFound {
            entity: "Task",
            id: id.to_string(),
        }
    })?;

    debug!(
        "Fetched task: id={}, title={}, status={}",
        task.id, task.title, task.status
    );

    Ok(task)
}

/// Get a task by ID with all its steps.
///
/// This is the primary method for task execution - returns the task
/// with all steps ordered by step_index.
pub async fn get_with_steps(pool: &SqlitePool, id: &str) -> ServiceResult<TaskWithSteps> {
    debug!("Fetching task with steps: id={}", id);

    let task = get_task(pool, id).await?;

    let steps = sqlx::query_as::<_, TaskStep>(&format!(
        "SELECT {} FROM task_steps WHERE task_id = ? ORDER BY step_index ASC",
        STEP_COLUMNS
    ))
    .bind(id)
    .fetch_all(pool)
    .await
    .map_err(|e| {
        error!("Failed to fetch steps for task {}: {}", id, e);
        ServiceError::Database(e)
    })?;

    debug!(
        "Fetched task with steps: id={}, title={}, step_count={}",
        task.id,
        task.title,
        steps.len()
    );

    Ok(TaskWithSteps::with_steps(task, steps))
}

// =============================================================================
// Create Operations
// =============================================================================

/// Create a new task.
pub async fn create(pool: &SqlitePool, request: CreateTaskRequest) -> ServiceResult<Task> {
    let id = Uuid::new_v4().to_string();

    debug!(
        "Creating task: id={}, project_id={}, title={}, workflow_template={:?}, parent_task_id={:?}",
        id, request.project_id, request.title, request.workflow_template, request.parent_task_id
    );

    sqlx::query(
        r#"
        INSERT INTO tasks (
            id, project_id, title, description, status,
            auto_run, current_step_index, workflow_template,
            parent_task_id, base_branch
        )
        VALUES (?, ?, ?, ?, 'pending', 0, 0, ?, ?, ?)
        "#,
    )
    .bind(&id)
    .bind(&request.project_id)
    .bind(&request.title)
    .bind(&request.description)
    .bind(&request.workflow_template)
    .bind(&request.parent_task_id)
    .bind(&request.base_branch)
    .execute(pool)
    .await
    .map_err(|e| {
        error!(
            "Failed to create task: project_id={}, title={}, error={}",
            request.project_id, request.title, e
        );
        ServiceError::Database(e)
    })?;

    // Fetch and return the created task
    let task_with_chats = get(pool, &id).await?;

    info!(
        "Created task: id={}, project_id={}, title={}",
        task_with_chats.task.id, task_with_chats.task.project_id, task_with_chats.task.title
    );

    Ok(task_with_chats.task)
}

// =============================================================================
// Update Operations
// =============================================================================

/// Update an existing task.
pub async fn update(
    pool: &SqlitePool,
    id: &str,
    request: UpdateTaskRequest,
) -> ServiceResult<Task> {
    debug!(
        "Updating task: id={}, title_changed={}, description_changed={}, status={:?}, auto_start_next_step={:?}",
        id,
        request.title.is_some(),
        request.description.is_some(),
        request.status,
        request.auto_start_next_step
    );

    // Verify the task exists first
    let existing = get(pool, id).await?.task;
    let existing_status = existing.status.clone();

    // Apply updates, falling back to existing values
    let title = request.title.unwrap_or(existing.title.clone());
    let description = request.description.or(existing.description.clone());
    let status = request.status.unwrap_or(existing.status);
    let auto_run = request
        .auto_start_next_step
        .unwrap_or(existing.auto_run);
    let default_executor_profile_id = request
        .default_executor_profile_id
        .or(existing.default_executor_profile_id.clone());

    // Log status transition if changed
    if status != existing_status {
        debug!(
            "Task status transition: id={}, from={} to={}",
            id, existing_status, status
        );
    }

    sqlx::query(
        r#"
        UPDATE tasks
        SET
            title = ?,
            description = ?,
            status = ?,
            auto_run = ?,
            default_executor_profile_id = ?,
            updated_at = datetime('now', 'subsec')
        WHERE id = ?
        "#,
    )
    .bind(&title)
    .bind(&description)
    .bind(status.to_string())
    .bind(auto_run)
    .bind(&default_executor_profile_id)
    .bind(id)
    .execute(pool)
    .await
    .map_err(|e| {
        error!("Failed to update task {}: {}", id, e);
        ServiceError::Database(e)
    })?;

    let task_with_chats = get(pool, id).await?;

    info!(
        "Updated task: id={}, title={}, status={}",
        task_with_chats.task.id, task_with_chats.task.title, task_with_chats.task.status
    );

    Ok(task_with_chats.task)
}

/// Update only the task status.
///
/// Use this for explicit status transitions during task execution.
/// This is more efficient than the full update method.
pub async fn update_status(
    pool: &SqlitePool,
    id: &str,
    status: TaskStatus,
) -> ServiceResult<Task> {
    debug!("Updating task status: id={}, new_status={}", id, status);

    // Verify the task exists first
    let existing = get_task(pool, id).await?;

    // Log status transition
    if status != existing.status {
        debug!(
            "Task status transition: id={}, from={} to={}",
            id, existing.status, status
        );
    }

    sqlx::query(
        r#"
        UPDATE tasks
        SET
            status = ?,
            updated_at = datetime('now', 'subsec')
        WHERE id = ?
        "#,
    )
    .bind(status.to_string())
    .bind(id)
    .execute(pool)
    .await
    .map_err(|e| {
        error!("Failed to update task status {}: {}", id, e);
        ServiceError::Database(e)
    })?;

    let task = get_task(pool, id).await?;

    info!(
        "Updated task status: id={}, title={}, status={}",
        task.id, task.title, task.status
    );

    Ok(task)
}

/// Set the started_at timestamp when task execution begins.
pub async fn set_started(pool: &SqlitePool, id: &str) -> ServiceResult<Task> {
    debug!("Setting task started_at: id={}", id);

    // Verify the task exists first
    let existing = get_task(pool, id).await?;

    if existing.started_at.is_some() {
        warn!("Task already has started_at set: id={}", id);
    }

    sqlx::query(
        r#"
        UPDATE tasks
        SET
            started_at = datetime('now', 'subsec'),
            status = 'running',
            updated_at = datetime('now', 'subsec')
        WHERE id = ?
        "#,
    )
    .bind(id)
    .execute(pool)
    .await
    .map_err(|e| {
        error!("Failed to set task started_at {}: {}", id, e);
        ServiceError::Database(e)
    })?;

    let task = get_task(pool, id).await?;

    info!(
        "Task started: id={}, title={}, started_at={:?}",
        task.id, task.title, task.started_at
    );

    Ok(task)
}

/// Set the ended_at timestamp when task execution completes.
pub async fn set_ended(
    pool: &SqlitePool,
    id: &str,
    status: TaskStatus,
) -> ServiceResult<Task> {
    debug!("Setting task ended_at: id={}, final_status={}", id, status);

    // Verify the task exists first
    let existing = get_task(pool, id).await?;

    if existing.ended_at.is_some() {
        warn!("Task already has ended_at set: id={}", id);
    }

    if !status.is_terminal() {
        return Err(ServiceError::InvalidInput {
            field: "status".to_string(),
            message: format!("Cannot set ended_at with non-terminal status: {}", status),
        });
    }

    sqlx::query(
        r#"
        UPDATE tasks
        SET
            ended_at = datetime('now', 'subsec'),
            status = ?,
            updated_at = datetime('now', 'subsec')
        WHERE id = ?
        "#,
    )
    .bind(status.to_string())
    .bind(id)
    .execute(pool)
    .await
    .map_err(|e| {
        error!("Failed to set task ended_at {}: {}", id, e);
        ServiceError::Database(e)
    })?;

    let task = get_task(pool, id).await?;

    info!(
        "Task ended: id={}, title={}, status={}, ended_at={:?}",
        task.id, task.title, task.status, task.ended_at
    );

    Ok(task)
}

// =============================================================================
// Step Advancement
// =============================================================================

/// Advance to the next step and return it if available.
///
/// This is the core method for sequential task execution.
/// Returns `None` when all steps are complete.
///
/// # Algorithm
/// 1. Get current step index from task
/// 2. Mark current step as completed (if running)
/// 3. Increment step index
/// 4. Return next step if available, or None if complete
pub async fn advance_step(pool: &SqlitePool, id: &str) -> ServiceResult<Option<TaskStep>> {
    debug!("Advancing task step: id={}", id);

    let task_with_steps = get_with_steps(pool, id).await?;
    let current_index = task_with_steps.task.current_step_index;

    // Check if there are any more steps
    let next_index = current_index + 1;
    let step_count = task_with_steps.steps.len() as i32;

    if next_index >= step_count {
        debug!(
            "No more steps to advance: id={}, current_index={}, step_count={}",
            id, current_index, step_count
        );
        return Ok(None);
    }

    // Update task's current step index
    sqlx::query(
        r#"
        UPDATE tasks
        SET
            current_step_index = ?,
            updated_at = datetime('now', 'subsec')
        WHERE id = ?
        "#,
    )
    .bind(next_index)
    .bind(id)
    .execute(pool)
    .await
    .map_err(|e| {
        error!("Failed to advance task step {}: {}", id, e);
        ServiceError::Database(e)
    })?;

    // Get the next step
    let next_step = task_with_steps
        .steps
        .get(next_index as usize)
        .cloned();

    if let Some(ref step) = next_step {
        info!(
            "Advanced task step: id={}, from_index={}, to_index={}, next_step_title={}",
            id, current_index, next_index, step.title
        );
    }

    Ok(next_step)
}

/// Get the current step for a task.
///
/// Returns the step at current_step_index, or None if no steps exist.
pub async fn get_current_step(pool: &SqlitePool, id: &str) -> ServiceResult<Option<TaskStep>> {
    debug!("Getting current step: id={}", id);

    let task_with_steps = get_with_steps(pool, id).await?;
    let current_index = task_with_steps.task.current_step_index;

    let current_step = task_with_steps
        .steps
        .get(current_index as usize)
        .cloned();

    if let Some(ref step) = current_step {
        debug!(
            "Current step: task_id={}, step_index={}, title={}",
            id, current_index, step.title
        );
    } else {
        debug!(
            "No current step: task_id={}, current_index={}, step_count={}",
            id,
            current_index,
            task_with_steps.steps.len()
        );
    }

    Ok(current_step)
}

/// Reset task step index to 0 for restarting execution.
pub async fn reset_step_index(pool: &SqlitePool, id: &str) -> ServiceResult<Task> {
    debug!("Resetting task step index: id={}", id);

    // Verify the task exists first
    let _ = get_task(pool, id).await?;

    sqlx::query(
        r#"
        UPDATE tasks
        SET
            current_step_index = 0,
            started_at = NULL,
            ended_at = NULL,
            status = 'pending',
            updated_at = datetime('now', 'subsec')
        WHERE id = ?
        "#,
    )
    .bind(id)
    .execute(pool)
    .await
    .map_err(|e| {
        error!("Failed to reset task step index {}: {}", id, e);
        ServiceError::Database(e)
    })?;

    let task = get_task(pool, id).await?;

    info!(
        "Reset task step index: id={}, title={}",
        task.id, task.title
    );

    Ok(task)
}

// =============================================================================
// Step Status Management
// =============================================================================

/// Update a step's status.
pub async fn update_step_status(
    pool: &SqlitePool,
    step_id: &str,
    status: StepStatus,
) -> ServiceResult<TaskStep> {
    debug!("Updating step status: step_id={}, status={}", step_id, status);

    // Set started_at when transitioning to Running
    // Set ended_at when transitioning to a terminal state
    let (started_at_clause, ended_at_clause) = match status {
        StepStatus::Running => (
            "started_at = COALESCE(started_at, datetime('now', 'subsec')),",
            "",
        ),
        StepStatus::Completed | StepStatus::Failed | StepStatus::Skipped => (
            "",
            "ended_at = COALESCE(ended_at, datetime('now', 'subsec')),",
        ),
        StepStatus::Pending => ("started_at = NULL, ended_at = NULL,", ""),
    };

    let query = format!(
        r#"
        UPDATE task_steps
        SET
            status = ?,
            {}
            {}
            updated_at = datetime('now', 'subsec')
        WHERE id = ?
        "#,
        started_at_clause, ended_at_clause
    );

    let result = sqlx::query(&query)
        .bind(status.to_string())
        .bind(step_id)
        .execute(pool)
        .await
        .map_err(|e| {
            error!("Failed to update step status {}: {}", step_id, e);
            ServiceError::Database(e)
        })?;

    if result.rows_affected() == 0 {
        return Err(ServiceError::NotFound {
            entity: "TaskStep",
            id: step_id.to_string(),
        });
    }

    // Fetch the updated step
    let step = sqlx::query_as::<_, TaskStep>(&format!(
        "SELECT {} FROM task_steps WHERE id = ?",
        STEP_COLUMNS
    ))
    .bind(step_id)
    .fetch_one(pool)
    .await
    .map_err(|e| {
        error!("Failed to fetch updated step {}: {}", step_id, e);
        ServiceError::Database(e)
    })?;

    info!(
        "Updated step status: step_id={}, title={}, status={}",
        step.id, step.title, step.status
    );

    Ok(step)
}

/// Link a step to an agent session.
pub async fn link_step_session(
    pool: &SqlitePool,
    step_id: &str,
    session_id: &str,
) -> ServiceResult<TaskStep> {
    debug!(
        "Linking step to session: step_id={}, session_id={}",
        step_id, session_id
    );

    let result = sqlx::query(
        r#"
        UPDATE task_steps
        SET
            session_id = ?,
            updated_at = datetime('now', 'subsec')
        WHERE id = ?
        "#,
    )
    .bind(session_id)
    .bind(step_id)
    .execute(pool)
    .await
    .map_err(|e| {
        error!("Failed to link step to session {}: {}", step_id, e);
        ServiceError::Database(e)
    })?;

    if result.rows_affected() == 0 {
        return Err(ServiceError::NotFound {
            entity: "TaskStep",
            id: step_id.to_string(),
        });
    }

    // Fetch the updated step
    let step = sqlx::query_as::<_, TaskStep>(&format!(
        "SELECT {} FROM task_steps WHERE id = ?",
        STEP_COLUMNS
    ))
    .bind(step_id)
    .fetch_one(pool)
    .await
    .map_err(|e| {
        error!("Failed to fetch updated step {}: {}", step_id, e);
        ServiceError::Database(e)
    })?;

    info!(
        "Linked step to session: step_id={}, session_id={}",
        step.id, session_id
    );

    Ok(step)
}

// =============================================================================
// Archive Operations
// =============================================================================

/// Archive a task by setting its archived_at timestamp.
pub async fn archive(pool: &SqlitePool, id: &str) -> ServiceResult<Task> {
    debug!("Archiving task: id={}", id);

    // Verify the task exists first
    let existing = get(pool, id).await?.task;

    // Warn if already archived
    if existing.archived_at.is_some() {
        warn!(
            "Task already archived: id={}, title={}, archived_at={:?}",
            id, existing.title, existing.archived_at
        );
    }

    sqlx::query(
        r#"
        UPDATE tasks
        SET
            archived_at = datetime('now', 'subsec'),
            updated_at = datetime('now', 'subsec')
        WHERE id = ?
        "#,
    )
    .bind(id)
    .execute(pool)
    .await
    .map_err(|e| {
        error!("Failed to archive task {}: {}", id, e);
        ServiceError::Database(e)
    })?;

    let task_with_chats = get(pool, id).await?;

    info!(
        "Archived task: id={}, title={}",
        task_with_chats.task.id, task_with_chats.task.title
    );

    Ok(task_with_chats.task)
}

/// Unarchive a task by clearing its archived_at timestamp.
pub async fn unarchive(pool: &SqlitePool, id: &str) -> ServiceResult<Task> {
    debug!("Unarchiving task: id={}", id);

    // Verify the task exists first
    let existing = get(pool, id).await?.task;

    // Warn if not currently archived
    if existing.archived_at.is_none() {
        warn!(
            "Task is not archived, no-op: id={}, title={}",
            id, existing.title
        );
    }

    sqlx::query(
        r#"
        UPDATE tasks
        SET
            archived_at = NULL,
            updated_at = datetime('now', 'subsec')
        WHERE id = ?
        "#,
    )
    .bind(id)
    .execute(pool)
    .await
    .map_err(|e| {
        error!("Failed to unarchive task {}: {}", id, e);
        ServiceError::Database(e)
    })?;

    let task_with_chats = get(pool, id).await?;

    info!(
        "Unarchived task: id={}, title={}",
        task_with_chats.task.id, task_with_chats.task.title
    );

    Ok(task_with_chats.task)
}

// =============================================================================
// Delete Operations
// =============================================================================

/// Delete a task by ID.
/// Note: Due to CASCADE, this also deletes associated chats, messages, and steps.
pub async fn delete(pool: &SqlitePool, id: &str) -> ServiceResult<()> {
    debug!("Deleting task: id={}", id);

    // Verify the task exists first and get details for logging
    let task_with_chats = get(pool, id).await?;
    let task = task_with_chats.task;
    let chat_count = task_with_chats.chats.len();

    sqlx::query("DELETE FROM tasks WHERE id = ?")
        .bind(id)
        .execute(pool)
        .await
        .map_err(|e| {
            error!("Failed to delete task {}: {}", id, e);
            ServiceError::Database(e)
        })?;

    info!(
        "Deleted task: id={}, title={}, cascade_deleted_chats={}",
        id, task.title, chat_count
    );

    Ok(())
}

// =============================================================================
// Duplicate Operations
// =============================================================================

/// Duplicate a task by ID.
///
/// Creates a copy of the task with:
/// - New unique ID
/// - Title appended with "(copy)"
/// - Status reset to "pending"
/// - Timestamps reset to now
/// - Parent task ID preserved if it exists
/// - Associated chats and steps are NOT duplicated (new task starts fresh)
///
/// # Arguments
/// * `pool` - Database connection pool
/// * `id` - ID of the task to duplicate
///
/// # Returns
/// The newly created duplicate task.
pub async fn duplicate(pool: &SqlitePool, id: &str) -> ServiceResult<Task> {
    debug!("Duplicating task: id={}", id);

    // Get the original task
    let original = get(pool, id).await?.task;

    // Create the duplicate with a new ID and modified title
    let new_id = Uuid::new_v4().to_string();
    let new_title = format!("{} (copy)", original.title);

    debug!(
        "Creating duplicate: original_id={}, new_id={}, original_title={}, new_title={}",
        id, new_id, original.title, new_title
    );

    sqlx::query(
        r#"
        INSERT INTO tasks (
            id, project_id, title, description, status,
            auto_run, current_step_index, workflow_template,
            parent_task_id, default_executor_profile_id, base_branch
        )
        VALUES (?, ?, ?, ?, 'pending', ?, 0, ?, ?, ?, ?)
        "#,
    )
    .bind(&new_id)
    .bind(&original.project_id)
    .bind(&new_title)
    .bind(&original.description)
    .bind(original.auto_run)
    .bind(&original.workflow_template)
    .bind(&original.parent_task_id)
    .bind(&original.default_executor_profile_id)
    .bind(&original.base_branch)
    .execute(pool)
    .await
    .map_err(|e| {
        error!("Failed to duplicate task {}: {}", id, e);
        ServiceError::Database(e)
    })?;

    // Fetch and return the created task
    let task_with_chats = get(pool, &new_id).await?;

    info!(
        "Duplicated task: original_id={}, new_id={}, new_title={}",
        id, task_with_chats.task.id, task_with_chats.task.title
    );

    Ok(task_with_chats.task)
}

// =============================================================================
// Step CRUD Operations
// =============================================================================

/// Create a new step for a task.
pub async fn create_step(
    pool: &SqlitePool,
    task_id: &str,
    step_index: i32,
    title: &str,
    prompt: &str,
    provider_id: &str,
) -> ServiceResult<TaskStep> {
    let id = Uuid::new_v4().to_string();

    debug!(
        "Creating step: id={}, task_id={}, step_index={}, title={}, provider_id={}",
        id, task_id, step_index, title, provider_id
    );

    // Verify the task exists
    let _ = get_task(pool, task_id).await?;

    sqlx::query(
        r#"
        INSERT INTO task_steps (
            id, task_id, step_index, title, prompt, provider_id, status
        )
        VALUES (?, ?, ?, ?, ?, ?, 'pending')
        "#,
    )
    .bind(&id)
    .bind(task_id)
    .bind(step_index)
    .bind(title)
    .bind(prompt)
    .bind(provider_id)
    .execute(pool)
    .await
    .map_err(|e| {
        error!("Failed to create step for task {}: {}", task_id, e);
        ServiceError::Database(e)
    })?;

    // Fetch and return the created step
    let step = sqlx::query_as::<_, TaskStep>(&format!(
        "SELECT {} FROM task_steps WHERE id = ?",
        STEP_COLUMNS
    ))
    .bind(&id)
    .fetch_one(pool)
    .await
    .map_err(|e| {
        error!("Failed to fetch created step {}: {}", id, e);
        ServiceError::Database(e)
    })?;

    info!(
        "Created step: id={}, task_id={}, step_index={}, title={}",
        step.id, task_id, step_index, title
    );

    Ok(step)
}

/// Create a new step for a task using a request object.
///
/// This is the preferred API for creating steps as it uses the typed request.
/// Validates the request before creating the step.
pub async fn create_step_from_request(
    pool: &SqlitePool,
    task_id: &str,
    request: CreateStepRequest,
) -> ServiceResult<TaskStep> {
    use openflow_contracts::validation::Validate;

    // Validate the request
    request.validate().map_err(|e| ServiceError::InvalidInput {
        field: "request".to_string(),
        message: e.to_string(),
    })?;

    // Delegate to the existing create_step function
    create_step(
        pool,
        task_id,
        request.step_index,
        &request.title,
        &request.prompt,
        &request.provider_id,
    )
    .await
}

/// Get a step by ID.
pub async fn get_step(pool: &SqlitePool, id: &str) -> ServiceResult<TaskStep> {
    debug!("Fetching step: id={}", id);

    let step = sqlx::query_as::<_, TaskStep>(&format!(
        "SELECT {} FROM task_steps WHERE id = ?",
        STEP_COLUMNS
    ))
    .bind(id)
    .fetch_optional(pool)
    .await
    .map_err(|e| {
        error!("Failed to fetch step {}: {}", id, e);
        ServiceError::Database(e)
    })?
    .ok_or_else(|| {
        error!("Step not found: id={}", id);
        ServiceError::NotFound {
            entity: "TaskStep",
            id: id.to_string(),
        }
    })?;

    debug!(
        "Fetched step: id={}, title={}, status={}",
        step.id, step.title, step.status
    );

    Ok(step)
}

/// List all steps for a task.
pub async fn list_steps(pool: &SqlitePool, task_id: &str) -> ServiceResult<Vec<TaskStep>> {
    debug!("Listing steps for task: task_id={}", task_id);

    // Verify the task exists
    let _ = get_task(pool, task_id).await?;

    let steps = sqlx::query_as::<_, TaskStep>(&format!(
        "SELECT {} FROM task_steps WHERE task_id = ? ORDER BY step_index ASC",
        STEP_COLUMNS
    ))
    .bind(task_id)
    .fetch_all(pool)
    .await
    .map_err(|e| {
        error!("Failed to list steps for task {}: {}", task_id, e);
        ServiceError::Database(e)
    })?;

    info!(
        "Listed {} steps for task {}",
        steps.len(),
        task_id
    );

    Ok(steps)
}

/// Delete a step by ID.
pub async fn delete_step(pool: &SqlitePool, id: &str) -> ServiceResult<()> {
    debug!("Deleting step: id={}", id);

    // Verify the step exists
    let step = get_step(pool, id).await?;

    sqlx::query("DELETE FROM task_steps WHERE id = ?")
        .bind(id)
        .execute(pool)
        .await
        .map_err(|e| {
            error!("Failed to delete step {}: {}", id, e);
            ServiceError::Database(e)
        })?;

    info!(
        "Deleted step: id={}, title={}",
        id, step.title
    );

    Ok(())
}

/// Delete all steps for a task (useful for re-creating steps from workflow).
pub async fn delete_all_steps(pool: &SqlitePool, task_id: &str) -> ServiceResult<i32> {
    debug!("Deleting all steps for task: task_id={}", task_id);

    // Verify the task exists
    let _ = get_task(pool, task_id).await?;

    let result = sqlx::query("DELETE FROM task_steps WHERE task_id = ?")
        .bind(task_id)
        .execute(pool)
        .await
        .map_err(|e| {
            error!("Failed to delete steps for task {}: {}", task_id, e);
            ServiceError::Database(e)
        })?;

    let deleted_count = result.rows_affected() as i32;

    info!(
        "Deleted {} steps for task {}",
        deleted_count, task_id
    );

    Ok(deleted_count)
}

// =============================================================================
// Parallel Step Operations
// =============================================================================

/// Create a new step that is part of a parallel group.
///
/// Steps in the same parallel_group will be executed concurrently
/// using separate git worktrees.
pub async fn create_parallel_step(
    pool: &SqlitePool,
    task_id: &str,
    step_index: i32,
    title: &str,
    prompt: &str,
    provider_id: &str,
    parallel_group: &str,
) -> ServiceResult<TaskStep> {
    let id = Uuid::new_v4().to_string();

    debug!(
        "Creating parallel step: id={}, task_id={}, step_index={}, title={}, provider_id={}, parallel_group={}",
        id, task_id, step_index, title, provider_id, parallel_group
    );

    // Verify the task exists
    let _ = get_task(pool, task_id).await?;

    sqlx::query(
        r#"
        INSERT INTO task_steps (
            id, task_id, step_index, title, prompt, provider_id, status, parallel_group
        )
        VALUES (?, ?, ?, ?, ?, ?, 'pending', ?)
        "#,
    )
    .bind(&id)
    .bind(task_id)
    .bind(step_index)
    .bind(title)
    .bind(prompt)
    .bind(provider_id)
    .bind(parallel_group)
    .execute(pool)
    .await
    .map_err(|e| {
        error!("Failed to create parallel step for task {}: {}", task_id, e);
        ServiceError::Database(e)
    })?;

    // Fetch and return the created step
    let step = sqlx::query_as::<_, TaskStep>(&format!(
        "SELECT {} FROM task_steps WHERE id = ?",
        STEP_COLUMNS
    ))
    .bind(&id)
    .fetch_one(pool)
    .await
    .map_err(|e| {
        error!("Failed to fetch created step {}: {}", id, e);
        ServiceError::Database(e)
    })?;

    info!(
        "Created parallel step: id={}, task_id={}, step_index={}, title={}, parallel_group={}",
        step.id, task_id, step_index, title, parallel_group
    );

    Ok(step)
}

/// Get all steps in a specific parallel group.
pub async fn get_steps_in_group(
    pool: &SqlitePool,
    task_id: &str,
    parallel_group: &str,
) -> ServiceResult<Vec<TaskStep>> {
    debug!(
        "Getting steps in parallel group: task_id={}, parallel_group={}",
        task_id, parallel_group
    );

    let steps = sqlx::query_as::<_, TaskStep>(&format!(
        "SELECT {} FROM task_steps WHERE task_id = ? AND parallel_group = ? ORDER BY step_index ASC",
        STEP_COLUMNS
    ))
    .bind(task_id)
    .bind(parallel_group)
    .fetch_all(pool)
    .await
    .map_err(|e| {
        error!(
            "Failed to get steps in group {}/{}: {}",
            task_id, parallel_group, e
        );
        ServiceError::Database(e)
    })?;

    debug!(
        "Found {} steps in parallel group {}/{}",
        steps.len(),
        task_id,
        parallel_group
    );

    Ok(steps)
}

/// Get all pending steps in a specific parallel group.
pub async fn get_pending_steps_in_group(
    pool: &SqlitePool,
    task_id: &str,
    parallel_group: &str,
) -> ServiceResult<Vec<TaskStep>> {
    debug!(
        "Getting pending steps in parallel group: task_id={}, parallel_group={}",
        task_id, parallel_group
    );

    let steps = sqlx::query_as::<_, TaskStep>(&format!(
        "SELECT {} FROM task_steps WHERE task_id = ? AND parallel_group = ? AND status = 'pending' ORDER BY step_index ASC",
        STEP_COLUMNS
    ))
    .bind(task_id)
    .bind(parallel_group)
    .fetch_all(pool)
    .await
    .map_err(|e| {
        error!(
            "Failed to get pending steps in group {}/{}: {}",
            task_id, parallel_group, e
        );
        ServiceError::Database(e)
    })?;

    debug!(
        "Found {} pending steps in parallel group {}/{}",
        steps.len(),
        task_id,
        parallel_group
    );

    Ok(steps)
}

/// Link a step to a worktree (for parallel execution).
pub async fn link_step_worktree(
    pool: &SqlitePool,
    step_id: &str,
    worktree_id: &str,
) -> ServiceResult<TaskStep> {
    debug!(
        "Linking step to worktree: step_id={}, worktree_id={}",
        step_id, worktree_id
    );

    let result = sqlx::query(
        r#"
        UPDATE task_steps
        SET
            worktree_id = ?,
            updated_at = datetime('now', 'subsec')
        WHERE id = ?
        "#,
    )
    .bind(worktree_id)
    .bind(step_id)
    .execute(pool)
    .await
    .map_err(|e| {
        error!("Failed to link step to worktree {}: {}", step_id, e);
        ServiceError::Database(e)
    })?;

    if result.rows_affected() == 0 {
        return Err(ServiceError::NotFound {
            entity: "TaskStep",
            id: step_id.to_string(),
        });
    }

    // Fetch the updated step
    let step = sqlx::query_as::<_, TaskStep>(&format!(
        "SELECT {} FROM task_steps WHERE id = ?",
        STEP_COLUMNS
    ))
    .bind(step_id)
    .fetch_one(pool)
    .await
    .map_err(|e| {
        error!("Failed to fetch updated step {}: {}", step_id, e);
        ServiceError::Database(e)
    })?;

    info!(
        "Linked step to worktree: step_id={}, worktree_id={}",
        step.id, worktree_id
    );

    Ok(step)
}

/// Check if all steps in a parallel group are complete.
pub async fn is_group_complete(
    pool: &SqlitePool,
    task_id: &str,
    parallel_group: &str,
) -> ServiceResult<bool> {
    debug!(
        "Checking if parallel group is complete: task_id={}, parallel_group={}",
        task_id, parallel_group
    );

    // Count steps that are NOT in a terminal state
    let count: (i64,) = sqlx::query_as(
        r#"
        SELECT COUNT(*) FROM task_steps
        WHERE task_id = ? AND parallel_group = ?
        AND status NOT IN ('completed', 'failed', 'skipped')
        "#,
    )
    .bind(task_id)
    .bind(parallel_group)
    .fetch_one(pool)
    .await
    .map_err(|e| {
        error!(
            "Failed to check group completion {}/{}: {}",
            task_id, parallel_group, e
        );
        ServiceError::Database(e)
    })?;

    let is_complete = count.0 == 0;

    debug!(
        "Parallel group {}/{} complete: {} (remaining: {})",
        task_id, parallel_group, is_complete, count.0
    );

    Ok(is_complete)
}

/// Check if any step in a parallel group has failed.
pub async fn has_group_failed(
    pool: &SqlitePool,
    task_id: &str,
    parallel_group: &str,
) -> ServiceResult<bool> {
    debug!(
        "Checking if parallel group has failed: task_id={}, parallel_group={}",
        task_id, parallel_group
    );

    let count: (i64,) = sqlx::query_as(
        r#"
        SELECT COUNT(*) FROM task_steps
        WHERE task_id = ? AND parallel_group = ? AND status = 'failed'
        "#,
    )
    .bind(task_id)
    .bind(parallel_group)
    .fetch_one(pool)
    .await
    .map_err(|e| {
        error!(
            "Failed to check group failure {}/{}: {}",
            task_id, parallel_group, e
        );
        ServiceError::Database(e)
    })?;

    let has_failed = count.0 > 0;

    debug!(
        "Parallel group {}/{} has_failed: {} (failed count: {})",
        task_id, parallel_group, has_failed, count.0
    );

    Ok(has_failed)
}

/// Skip all remaining steps in a parallel group (used when one step fails).
pub async fn skip_remaining_in_group(
    pool: &SqlitePool,
    task_id: &str,
    parallel_group: &str,
) -> ServiceResult<i32> {
    debug!(
        "Skipping remaining steps in parallel group: task_id={}, parallel_group={}",
        task_id, parallel_group
    );

    let result = sqlx::query(
        r#"
        UPDATE task_steps
        SET
            status = 'skipped',
            ended_at = datetime('now', 'subsec'),
            updated_at = datetime('now', 'subsec')
        WHERE task_id = ? AND parallel_group = ?
        AND status IN ('pending', 'running')
        "#,
    )
    .bind(task_id)
    .bind(parallel_group)
    .execute(pool)
    .await
    .map_err(|e| {
        error!(
            "Failed to skip remaining steps in group {}/{}: {}",
            task_id, parallel_group, e
        );
        ServiceError::Database(e)
    })?;

    let skipped_count = result.rows_affected() as i32;

    info!(
        "Skipped {} remaining steps in parallel group {}/{}",
        skipped_count, task_id, parallel_group
    );

    Ok(skipped_count)
}

/// Advance past a parallel group by finding the first step after the group.
///
/// Returns the index of the first step that is not part of any parallel group
/// or is part of a different parallel group, or None if no more steps.
pub async fn advance_past_group(
    pool: &SqlitePool,
    task_id: &str,
    parallel_group: &str,
) -> ServiceResult<Option<i32>> {
    debug!(
        "Advancing past parallel group: task_id={}, parallel_group={}",
        task_id, parallel_group
    );

    // Find the highest step_index in the current group
    let max_index: Option<(i32,)> = sqlx::query_as(
        r#"
        SELECT MAX(step_index) FROM task_steps
        WHERE task_id = ? AND parallel_group = ?
        "#,
    )
    .bind(task_id)
    .bind(parallel_group)
    .fetch_optional(pool)
    .await
    .map_err(|e| {
        error!(
            "Failed to get max index in group {}/{}: {}",
            task_id, parallel_group, e
        );
        ServiceError::Database(e)
    })?;

    let max_group_index = match max_index {
        Some((idx,)) => idx,
        None => return Ok(None),
    };

    // Find the next step after the group
    let next_step: Option<(i32,)> = sqlx::query_as(
        r#"
        SELECT step_index FROM task_steps
        WHERE task_id = ? AND step_index > ?
        ORDER BY step_index ASC
        LIMIT 1
        "#,
    )
    .bind(task_id)
    .bind(max_group_index)
    .fetch_optional(pool)
    .await
    .map_err(|e| {
        error!(
            "Failed to find next step after group {}/{}: {}",
            task_id, parallel_group, e
        );
        ServiceError::Database(e)
    })?;

    let next_index = next_step.map(|(idx,)| idx);

    if let Some(idx) = next_index {
        // Update task's current_step_index
        sqlx::query(
            r#"
            UPDATE tasks
            SET
                current_step_index = ?,
                updated_at = datetime('now', 'subsec')
            WHERE id = ?
            "#,
        )
        .bind(idx)
        .bind(task_id)
        .execute(pool)
        .await
        .map_err(|e| {
            error!("Failed to advance task step index {}: {}", task_id, e);
            ServiceError::Database(e)
        })?;

        info!(
            "Advanced past parallel group {}/{} to step index {}",
            task_id, parallel_group, idx
        );
    } else {
        debug!(
            "No steps after parallel group {}/{}",
            task_id, parallel_group
        );
    }

    Ok(next_index)
}

// =============================================================================
// Tests
// =============================================================================

#[cfg(test)]
mod tests {
    use super::*;
    use crate::services::project;
    use openflow_contracts::CreateProjectRequest;
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

    /// Helper to create a test project.
    async fn create_test_project(pool: &SqlitePool, name: &str) -> String {
        let request = CreateProjectRequest {
            name: name.to_string(),
            git_repo_path: format!("/path/to/{}", name.to_lowercase().replace(' ', "-")),
            base_branch: None,
            setup_script: None,
            dev_script: None,
            cleanup_script: None,
            copy_files: None,
            icon: None,
            rule_folders: None,
            always_included_rules: None,
            workflows_folder: None,
            verification_config: None,
        };
        project::create(pool, request)
            .await
            .expect("Failed to create test project")
            .id
    }

    /// Helper to create a test task request.
    fn test_create_request(project_id: &str, title: &str) -> CreateTaskRequest {
        CreateTaskRequest {
            project_id: project_id.to_string(),
            title: title.to_string(),
            description: None,
            workflow_template: None,
            parent_task_id: None,
            base_branch: None,
        }
    }

    #[tokio::test]
    async fn test_create_task() {
        let test_db = setup_test_db().await;
        let project_id = create_test_project(&test_db.pool, "Test Project").await;

        let request = test_create_request(&project_id, "Test Task");
        let task = create(&test_db.pool, request)
            .await
            .expect("Failed to create task");

        assert_eq!(task.title, "Test Task");
        assert_eq!(task.project_id, project_id);
        assert_eq!(task.status, TaskStatus::Pending);
        assert!(!task.auto_run);
        assert_eq!(task.current_step_index, 0);
        assert!(task.archived_at.is_none());
        assert!(!task.id.is_empty());
    }

    #[tokio::test]
    async fn test_create_task_with_all_fields() {
        let test_db = setup_test_db().await;
        let project_id = create_test_project(&test_db.pool, "Test Project").await;

        let request = CreateTaskRequest {
            project_id: project_id.clone(),
            title: "Full Task".to_string(),
            description: Some("A complete task description".to_string()),
            workflow_template: Some("feature".to_string()),
            parent_task_id: None,
            base_branch: Some("develop".to_string()),
        };

        let task = create(&test_db.pool, request)
            .await
            .expect("Failed to create task");

        assert_eq!(task.title, "Full Task");
        assert_eq!(
            task.description,
            Some("A complete task description".to_string())
        );
        assert_eq!(task.workflow_template, Some("feature".to_string()));
        assert_eq!(task.base_branch, Some("develop".to_string()));
    }

    #[tokio::test]
    async fn test_get_task() {
        let test_db = setup_test_db().await;
        let project_id = create_test_project(&test_db.pool, "Test Project").await;

        // Create a task first
        let request = test_create_request(&project_id, "Get Test Task");
        let created = create(&test_db.pool, request)
            .await
            .expect("Failed to create task");

        // Get the task
        let fetched = get(&test_db.pool, &created.id)
            .await
            .expect("Failed to get task");

        assert_eq!(fetched.task.id, created.id);
        assert_eq!(fetched.task.title, "Get Test Task");
        assert!(fetched.chats.is_empty()); // No chats created yet
    }

    #[tokio::test]
    async fn test_get_task_not_found() {
        let test_db = setup_test_db().await;

        let result = get(&test_db.pool, "non-existent-id").await;

        assert!(result.is_err());
        match result.unwrap_err() {
            ServiceError::NotFound { entity, id } => {
                assert_eq!(entity, "Task");
                assert_eq!(id, "non-existent-id");
            }
            other => panic!("Expected NotFound error, got: {:?}", other),
        }
    }

    #[tokio::test]
    async fn test_get_with_steps() {
        let test_db = setup_test_db().await;
        let project_id = create_test_project(&test_db.pool, "Test Project").await;

        // Create a task
        let request = test_create_request(&project_id, "Task With Steps");
        let task = create(&test_db.pool, request)
            .await
            .expect("Failed to create task");

        // Create steps
        create_step(&test_db.pool, &task.id, 0, "Step 1", "Do step 1", "claude-code")
            .await
            .expect("Failed to create step 1");
        create_step(&test_db.pool, &task.id, 1, "Step 2", "Do step 2", "claude-code")
            .await
            .expect("Failed to create step 2");

        // Get task with steps
        let task_with_steps = get_with_steps(&test_db.pool, &task.id)
            .await
            .expect("Failed to get task with steps");

        assert_eq!(task_with_steps.step_count(), 2);
        assert_eq!(task_with_steps.steps[0].step_index, 0);
        assert_eq!(task_with_steps.steps[1].step_index, 1);
    }

    #[tokio::test]
    async fn test_list_tasks() {
        let test_db = setup_test_db().await;
        let project_id = create_test_project(&test_db.pool, "Test Project").await;

        // Start with empty list
        let tasks = list(&test_db.pool, &project_id, None, false)
            .await
            .expect("Failed to list tasks");
        assert!(tasks.is_empty());

        // Create multiple tasks
        let request1 = test_create_request(&project_id, "Task 1");
        let request2 = test_create_request(&project_id, "Task 2");
        let request3 = test_create_request(&project_id, "Task 3");

        create(&test_db.pool, request1).await.unwrap();
        create(&test_db.pool, request2).await.unwrap();
        create(&test_db.pool, request3).await.unwrap();

        // List should return all tasks ordered by created_at DESC
        let tasks = list(&test_db.pool, &project_id, None, false)
            .await
            .expect("Failed to list tasks");

        assert_eq!(tasks.len(), 3);
        // Most recent first
        assert_eq!(tasks[0].title, "Task 3");
        assert_eq!(tasks[1].title, "Task 2");
        assert_eq!(tasks[2].title, "Task 1");
    }

    #[tokio::test]
    async fn test_list_tasks_with_status_filter() {
        let test_db = setup_test_db().await;
        let project_id = create_test_project(&test_db.pool, "Test Project").await;

        // Create tasks and update their status
        let request1 = test_create_request(&project_id, "Pending Task");
        let request2 = test_create_request(&project_id, "Running Task");
        let request3 = test_create_request(&project_id, "Completed Task");

        let task1 = create(&test_db.pool, request1).await.unwrap();
        let task2 = create(&test_db.pool, request2).await.unwrap();
        let task3 = create(&test_db.pool, request3).await.unwrap();

        // Update statuses
        update_status(&test_db.pool, &task2.id, TaskStatus::Running)
            .await
            .unwrap();
        update_status(&test_db.pool, &task3.id, TaskStatus::Completed)
            .await
            .unwrap();

        // Filter by status
        let pending_tasks = list(&test_db.pool, &project_id, Some(TaskStatus::Pending), false)
            .await
            .expect("Failed to list tasks");
        assert_eq!(pending_tasks.len(), 1);
        assert_eq!(pending_tasks[0].id, task1.id);

        let running_tasks = list(&test_db.pool, &project_id, Some(TaskStatus::Running), false)
            .await
            .expect("Failed to list tasks");
        assert_eq!(running_tasks.len(), 1);
        assert_eq!(running_tasks[0].id, task2.id);

        let completed_tasks = list(&test_db.pool, &project_id, Some(TaskStatus::Completed), false)
            .await
            .expect("Failed to list tasks");
        assert_eq!(completed_tasks.len(), 1);
        assert_eq!(completed_tasks[0].id, task3.id);
    }

    #[tokio::test]
    async fn test_list_tasks_excludes_archived_by_default() {
        let test_db = setup_test_db().await;
        let project_id = create_test_project(&test_db.pool, "Test Project").await;

        // Create tasks
        let request1 = test_create_request(&project_id, "Active Task");
        let request2 = test_create_request(&project_id, "Archived Task");

        let task1 = create(&test_db.pool, request1).await.unwrap();
        let task2 = create(&test_db.pool, request2).await.unwrap();

        // Archive one task
        archive(&test_db.pool, &task2.id).await.unwrap();

        // Default list excludes archived
        let tasks = list(&test_db.pool, &project_id, None, false)
            .await
            .expect("Failed to list tasks");
        assert_eq!(tasks.len(), 1);
        assert_eq!(tasks[0].id, task1.id);

        // Include archived
        let all_tasks = list(&test_db.pool, &project_id, None, true)
            .await
            .expect("Failed to list tasks");
        assert_eq!(all_tasks.len(), 2);
    }

    #[tokio::test]
    async fn test_update_task() {
        let test_db = setup_test_db().await;
        let project_id = create_test_project(&test_db.pool, "Test Project").await;

        // Create a task
        let request = test_create_request(&project_id, "Original Title");
        let created = create(&test_db.pool, request)
            .await
            .expect("Failed to create task");

        // Update partial fields
        let update_request = UpdateTaskRequest {
            title: Some("Updated Title".to_string()),
            description: Some("New description".to_string()),
            status: Some(TaskStatus::Running),
            auto_start_next_step: None,
            default_executor_profile_id: None,
        };

        let updated = update(&test_db.pool, &created.id, update_request)
            .await
            .expect("Failed to update task");

        assert_eq!(updated.id, created.id);
        assert_eq!(updated.title, "Updated Title");
        assert_eq!(updated.description, Some("New description".to_string()));
        assert_eq!(updated.status, TaskStatus::Running);
        assert_ne!(updated.updated_at, created.updated_at);
    }

    #[tokio::test]
    async fn test_update_task_preserves_unset_fields() {
        let test_db = setup_test_db().await;
        let project_id = create_test_project(&test_db.pool, "Test Project").await;

        // Create a task with description
        let request = CreateTaskRequest {
            project_id: project_id.clone(),
            title: "Original Title".to_string(),
            description: Some("Original Description".to_string()),
            workflow_template: None,
            parent_task_id: None,
            base_branch: None,
        };
        let created = create(&test_db.pool, request)
            .await
            .expect("Failed to create task");

        // Update only title
        let update_request = UpdateTaskRequest {
            title: Some("New Title".to_string()),
            description: None, // Keep original
            status: None,      // Keep original
            auto_start_next_step: None,
            default_executor_profile_id: None,
        };

        let updated = update(&test_db.pool, &created.id, update_request)
            .await
            .expect("Failed to update task");

        assert_eq!(updated.title, "New Title");
        assert_eq!(
            updated.description,
            Some("Original Description".to_string())
        ); // Preserved
        assert_eq!(updated.status, TaskStatus::Pending); // Preserved
    }

    #[tokio::test]
    async fn test_update_task_not_found() {
        let test_db = setup_test_db().await;

        let update_request = UpdateTaskRequest {
            title: Some("New Title".to_string()),
            description: None,
            status: None,
            auto_start_next_step: None,
            default_executor_profile_id: None,
        };

        let result = update(&test_db.pool, "non-existent-id", update_request).await;

        assert!(result.is_err());
        match result.unwrap_err() {
            ServiceError::NotFound { entity, .. } => {
                assert_eq!(entity, "Task");
            }
            other => panic!("Expected NotFound error, got: {:?}", other),
        }
    }

    #[tokio::test]
    async fn test_update_status() {
        let test_db = setup_test_db().await;
        let project_id = create_test_project(&test_db.pool, "Test Project").await;

        let request = test_create_request(&project_id, "Status Test Task");
        let task = create(&test_db.pool, request)
            .await
            .expect("Failed to create task");

        assert_eq!(task.status, TaskStatus::Pending);

        let updated = update_status(&test_db.pool, &task.id, TaskStatus::Running)
            .await
            .expect("Failed to update status");

        assert_eq!(updated.status, TaskStatus::Running);
    }

    #[tokio::test]
    async fn test_set_started_and_ended() {
        let test_db = setup_test_db().await;
        let project_id = create_test_project(&test_db.pool, "Test Project").await;

        let request = test_create_request(&project_id, "Timing Test Task");
        let task = create(&test_db.pool, request)
            .await
            .expect("Failed to create task");

        assert!(task.started_at.is_none());
        assert!(task.ended_at.is_none());

        // Set started
        let started = set_started(&test_db.pool, &task.id)
            .await
            .expect("Failed to set started");
        assert!(started.started_at.is_some());
        assert_eq!(started.status, TaskStatus::Running);

        // Set ended
        let ended = set_ended(&test_db.pool, &task.id, TaskStatus::Completed)
            .await
            .expect("Failed to set ended");
        assert!(ended.ended_at.is_some());
        assert_eq!(ended.status, TaskStatus::Completed);
    }

    #[tokio::test]
    async fn test_set_ended_requires_terminal_status() {
        let test_db = setup_test_db().await;
        let project_id = create_test_project(&test_db.pool, "Test Project").await;

        let request = test_create_request(&project_id, "Invalid End Task");
        let task = create(&test_db.pool, request)
            .await
            .expect("Failed to create task");

        let result = set_ended(&test_db.pool, &task.id, TaskStatus::Running).await;

        assert!(result.is_err());
        match result.unwrap_err() {
            ServiceError::InvalidInput { field, .. } => {
                assert_eq!(field, "status");
            }
            other => panic!("Expected InvalidInput error, got: {:?}", other),
        }
    }

    #[tokio::test]
    async fn test_advance_step() {
        let test_db = setup_test_db().await;
        let project_id = create_test_project(&test_db.pool, "Test Project").await;

        let request = test_create_request(&project_id, "Advance Step Task");
        let task = create(&test_db.pool, request)
            .await
            .expect("Failed to create task");

        // Create steps
        create_step(&test_db.pool, &task.id, 0, "Step 0", "Do step 0", "claude-code")
            .await
            .expect("Failed to create step 0");
        create_step(&test_db.pool, &task.id, 1, "Step 1", "Do step 1", "claude-code")
            .await
            .expect("Failed to create step 1");
        create_step(&test_db.pool, &task.id, 2, "Step 2", "Do step 2", "claude-code")
            .await
            .expect("Failed to create step 2");

        // Advance from 0 to 1
        let step1 = advance_step(&test_db.pool, &task.id)
            .await
            .expect("Failed to advance step");
        assert!(step1.is_some());
        assert_eq!(step1.unwrap().step_index, 1);

        // Advance from 1 to 2
        let step2 = advance_step(&test_db.pool, &task.id)
            .await
            .expect("Failed to advance step");
        assert!(step2.is_some());
        assert_eq!(step2.unwrap().step_index, 2);

        // No more steps
        let step3 = advance_step(&test_db.pool, &task.id)
            .await
            .expect("Failed to advance step");
        assert!(step3.is_none());
    }

    #[tokio::test]
    async fn test_get_current_step() {
        let test_db = setup_test_db().await;
        let project_id = create_test_project(&test_db.pool, "Test Project").await;

        let request = test_create_request(&project_id, "Current Step Task");
        let task = create(&test_db.pool, request)
            .await
            .expect("Failed to create task");

        // No steps yet
        let no_step = get_current_step(&test_db.pool, &task.id)
            .await
            .expect("Failed to get current step");
        assert!(no_step.is_none());

        // Create steps
        create_step(&test_db.pool, &task.id, 0, "Step 0", "Do step 0", "claude-code")
            .await
            .expect("Failed to create step 0");
        create_step(&test_db.pool, &task.id, 1, "Step 1", "Do step 1", "claude-code")
            .await
            .expect("Failed to create step 1");

        // Get current step (index 0)
        let current = get_current_step(&test_db.pool, &task.id)
            .await
            .expect("Failed to get current step");
        assert!(current.is_some());
        assert_eq!(current.unwrap().step_index, 0);
    }

    #[tokio::test]
    async fn test_reset_step_index() {
        let test_db = setup_test_db().await;
        let project_id = create_test_project(&test_db.pool, "Test Project").await;

        let request = test_create_request(&project_id, "Reset Step Task");
        let task = create(&test_db.pool, request)
            .await
            .expect("Failed to create task");

        // Create steps and advance
        create_step(&test_db.pool, &task.id, 0, "Step 0", "Do step 0", "claude-code")
            .await
            .expect("Failed to create step 0");
        create_step(&test_db.pool, &task.id, 1, "Step 1", "Do step 1", "claude-code")
            .await
            .expect("Failed to create step 1");

        advance_step(&test_db.pool, &task.id).await.unwrap();
        let advanced = get_task(&test_db.pool, &task.id).await.unwrap();
        assert_eq!(advanced.current_step_index, 1);

        // Reset
        let reset = reset_step_index(&test_db.pool, &task.id)
            .await
            .expect("Failed to reset step index");
        assert_eq!(reset.current_step_index, 0);
        assert_eq!(reset.status, TaskStatus::Pending);
    }

    #[tokio::test]
    async fn test_update_step_status() {
        let test_db = setup_test_db().await;
        let project_id = create_test_project(&test_db.pool, "Test Project").await;

        let request = test_create_request(&project_id, "Step Status Task");
        let task = create(&test_db.pool, request)
            .await
            .expect("Failed to create task");

        let step = create_step(&test_db.pool, &task.id, 0, "Step 0", "Do step 0", "claude-code")
            .await
            .expect("Failed to create step");

        assert_eq!(step.status, StepStatus::Pending);
        assert!(step.started_at.is_none());

        // Set to running - should set started_at
        let running = update_step_status(&test_db.pool, &step.id, StepStatus::Running)
            .await
            .expect("Failed to update step status");
        assert_eq!(running.status, StepStatus::Running);
        assert!(running.started_at.is_some());

        // Set to completed - should set ended_at
        let completed = update_step_status(&test_db.pool, &step.id, StepStatus::Completed)
            .await
            .expect("Failed to update step status");
        assert_eq!(completed.status, StepStatus::Completed);
        assert!(completed.ended_at.is_some());
    }

    #[tokio::test]
    async fn test_link_step_session() {
        use crate::services::{agent_session, chat};
        use openflow_contracts::CreateChatRequest;

        let test_db = setup_test_db().await;
        let project_id = create_test_project(&test_db.pool, "Test Project").await;

        let request = test_create_request(&project_id, "Link Session Task");
        let task = create(&test_db.pool, request)
            .await
            .expect("Failed to create task");

        let step = create_step(&test_db.pool, &task.id, 0, "Step 0", "Do step 0", "claude-code")
            .await
            .expect("Failed to create step");

        assert!(step.session_id.is_none());

        // Create the full entity chain to satisfy FK constraints:
        // project -> task -> chat -> execution_process -> agent_session

        // 1. Create a chat (for the execution_process)
        let chat_request = CreateChatRequest {
            project_id: project_id.clone(),
            task_id: Some(task.id.clone()),
            title: Some("Test Chat".to_string()),
            executor_profile_id: None,
            chat_role: None,
            base_branch: None,
            initial_prompt: None,
            hidden_prompt: None,
            is_plan_container: None,
            main_chat_id: None,
            workflow_step_index: None,
        };
        let test_chat = chat::create(&test_db.pool, chat_request)
            .await
            .expect("Failed to create chat");

        // 2. Create execution_process (needs chat_id)
        let process_id = uuid::Uuid::new_v4().to_string();
        sqlx::query(
            r#"
            INSERT INTO execution_processes (
                id, chat_id, status, executor_action, run_reason, started_at, created_at, updated_at
            )
            VALUES (?, ?, 'running', 'test', 'codingagent', datetime('now'), datetime('now'), datetime('now'))
            "#,
        )
        .bind(&process_id)
        .bind(&test_chat.id)
        .execute(&test_db.pool)
        .await
        .expect("Failed to create process");

        // 3. Create agent_session (needs process_id)
        let session_request = agent_session::CreateSessionRequest::new(&process_id, "claude-code");
        let session = agent_session::create(&test_db.pool, session_request)
            .await
            .expect("Failed to create session");

        // 4. Now we can link the step to the session
        let linked = link_step_session(&test_db.pool, &step.id, &session.id)
            .await
            .expect("Failed to link session");
        assert_eq!(linked.session_id, Some(session.id));
    }

    #[tokio::test]
    async fn test_archive_task() {
        let test_db = setup_test_db().await;
        let project_id = create_test_project(&test_db.pool, "Test Project").await;

        // Create a task
        let request = test_create_request(&project_id, "Task to Archive");
        let created = create(&test_db.pool, request)
            .await
            .expect("Failed to create task");

        // Verify not archived
        assert!(created.archived_at.is_none());

        // Archive it
        let archived = archive(&test_db.pool, &created.id)
            .await
            .expect("Failed to archive task");

        assert!(archived.archived_at.is_some());
        assert_ne!(archived.updated_at, created.updated_at);
    }

    #[tokio::test]
    async fn test_archive_task_not_found() {
        let test_db = setup_test_db().await;

        let result = archive(&test_db.pool, "non-existent-id").await;

        assert!(result.is_err());
        match result.unwrap_err() {
            ServiceError::NotFound { entity, .. } => {
                assert_eq!(entity, "Task");
            }
            other => panic!("Expected NotFound error, got: {:?}", other),
        }
    }

    #[tokio::test]
    async fn test_unarchive_task() {
        let test_db = setup_test_db().await;
        let project_id = create_test_project(&test_db.pool, "Test Project").await;

        // Create and archive a task
        let request = test_create_request(&project_id, "Task to Unarchive");
        let created = create(&test_db.pool, request)
            .await
            .expect("Failed to create task");
        let archived = archive(&test_db.pool, &created.id)
            .await
            .expect("Failed to archive task");

        assert!(archived.archived_at.is_some());

        // Unarchive it
        let unarchived = unarchive(&test_db.pool, &created.id)
            .await
            .expect("Failed to unarchive task");

        assert!(unarchived.archived_at.is_none());
    }

    #[tokio::test]
    async fn test_delete_task() {
        let test_db = setup_test_db().await;
        let project_id = create_test_project(&test_db.pool, "Test Project").await;

        // Create a task
        let request = test_create_request(&project_id, "Task to Delete");
        let created = create(&test_db.pool, request)
            .await
            .expect("Failed to create task");

        // Verify it exists
        let fetched = get(&test_db.pool, &created.id).await;
        assert!(fetched.is_ok());

        // Delete it
        delete(&test_db.pool, &created.id)
            .await
            .expect("Failed to delete task");

        // Verify it's gone
        let result = get(&test_db.pool, &created.id).await;
        assert!(result.is_err());
        match result.unwrap_err() {
            ServiceError::NotFound { entity, .. } => {
                assert_eq!(entity, "Task");
            }
            other => panic!("Expected NotFound error, got: {:?}", other),
        }
    }

    #[tokio::test]
    async fn test_delete_task_not_found() {
        let test_db = setup_test_db().await;

        let result = delete(&test_db.pool, "non-existent-id").await;

        assert!(result.is_err());
        match result.unwrap_err() {
            ServiceError::NotFound { entity, .. } => {
                assert_eq!(entity, "Task");
            }
            other => panic!("Expected NotFound error, got: {:?}", other),
        }
    }

    #[tokio::test]
    async fn test_tasks_isolated_by_project() {
        let test_db = setup_test_db().await;
        let project1_id = create_test_project(&test_db.pool, "Project 1").await;
        let project2_id = create_test_project(&test_db.pool, "Project 2").await;

        // Create tasks in both projects
        let request1 = test_create_request(&project1_id, "Project 1 Task");
        let request2 = test_create_request(&project2_id, "Project 2 Task");

        create(&test_db.pool, request1).await.unwrap();
        create(&test_db.pool, request2).await.unwrap();

        // List tasks for project 1
        let p1_tasks = list(&test_db.pool, &project1_id, None, false)
            .await
            .expect("Failed to list tasks");
        assert_eq!(p1_tasks.len(), 1);
        assert_eq!(p1_tasks[0].title, "Project 1 Task");

        // List tasks for project 2
        let p2_tasks = list(&test_db.pool, &project2_id, None, false)
            .await
            .expect("Failed to list tasks");
        assert_eq!(p2_tasks.len(), 1);
        assert_eq!(p2_tasks[0].title, "Project 2 Task");
    }

    #[tokio::test]
    async fn test_create_task_with_parent_task() {
        let test_db = setup_test_db().await;
        let project_id = create_test_project(&test_db.pool, "Test Project").await;

        // Create parent task
        let parent_request = test_create_request(&project_id, "Parent Task");
        let parent = create(&test_db.pool, parent_request)
            .await
            .expect("Failed to create parent task");

        // Create child task
        let child_request = CreateTaskRequest {
            project_id: project_id.clone(),
            title: "Child Task".to_string(),
            description: None,
            workflow_template: None,
            parent_task_id: Some(parent.id.clone()),
            base_branch: None,
        };
        let child = create(&test_db.pool, child_request)
            .await
            .expect("Failed to create child task");

        assert_eq!(child.parent_task_id, Some(parent.id));
    }

    #[tokio::test]
    async fn test_delete_project_cascades_to_tasks() {
        let test_db = setup_test_db().await;
        let project_id = create_test_project(&test_db.pool, "Test Project").await;

        // Create tasks
        let request = test_create_request(&project_id, "Task to be cascaded");
        let task = create(&test_db.pool, request)
            .await
            .expect("Failed to create task");

        // Delete the project
        project::delete(&test_db.pool, &project_id)
            .await
            .expect("Failed to delete project");

        // Task should be gone
        let result = get(&test_db.pool, &task.id).await;
        assert!(result.is_err());
    }

    #[tokio::test]
    async fn test_duplicate_task() {
        let test_db = setup_test_db().await;
        let project_id = create_test_project(&test_db.pool, "Test Project").await;

        // Create original task
        let request = test_create_request(&project_id, "Original Task");
        let original = create(&test_db.pool, request)
            .await
            .expect("Failed to create task");

        // Duplicate it
        let duplicate_task = duplicate(&test_db.pool, &original.id)
            .await
            .expect("Failed to duplicate task");

        // Verify duplicate has new ID but same project
        assert_ne!(duplicate_task.id, original.id);
        assert_eq!(duplicate_task.project_id, original.project_id);

        // Verify title has "(copy)" appended
        assert_eq!(duplicate_task.title, "Original Task (copy)");

        // Verify status is reset to pending
        assert_eq!(duplicate_task.status, TaskStatus::Pending);

        // Verify timestamps are different
        assert_ne!(duplicate_task.created_at, original.created_at);

        // Verify not archived
        assert!(duplicate_task.archived_at.is_none());
    }

    #[tokio::test]
    async fn test_duplicate_task_preserves_fields() {
        let test_db = setup_test_db().await;
        let project_id = create_test_project(&test_db.pool, "Test Project").await;

        // Create original task with all fields populated
        let request = CreateTaskRequest {
            project_id: project_id.clone(),
            title: "Full Task".to_string(),
            description: Some("A complete task description".to_string()),
            workflow_template: Some("feature".to_string()),
            parent_task_id: None,
            base_branch: Some("develop".to_string()),
        };
        let original = create(&test_db.pool, request)
            .await
            .expect("Failed to create task");

        // Duplicate it
        let duplicate_task = duplicate(&test_db.pool, &original.id)
            .await
            .expect("Failed to duplicate task");

        // Verify all fields are preserved (except title, status, timestamps)
        assert_eq!(duplicate_task.description, original.description);
        assert_eq!(duplicate_task.workflow_template, original.workflow_template);
        assert_eq!(duplicate_task.base_branch, original.base_branch);
        assert_eq!(duplicate_task.auto_run, original.auto_run);
        assert_eq!(
            duplicate_task.default_executor_profile_id,
            original.default_executor_profile_id
        );
    }

    #[tokio::test]
    async fn test_duplicate_task_not_found() {
        let test_db = setup_test_db().await;

        let result = duplicate(&test_db.pool, "non-existent-id").await;

        assert!(result.is_err());
        match result.unwrap_err() {
            ServiceError::NotFound { entity, .. } => {
                assert_eq!(entity, "Task");
            }
            other => panic!("Expected NotFound error, got: {:?}", other),
        }
    }

    #[tokio::test]
    async fn test_duplicate_task_with_parent() {
        let test_db = setup_test_db().await;
        let project_id = create_test_project(&test_db.pool, "Test Project").await;

        // Create parent task
        let parent_request = test_create_request(&project_id, "Parent Task");
        let parent = create(&test_db.pool, parent_request)
            .await
            .expect("Failed to create parent task");

        // Create child task
        let child_request = CreateTaskRequest {
            project_id: project_id.clone(),
            title: "Child Task".to_string(),
            description: None,
            workflow_template: None,
            parent_task_id: Some(parent.id.clone()),
            base_branch: None,
        };
        let child = create(&test_db.pool, child_request)
            .await
            .expect("Failed to create child task");

        // Duplicate the child task
        let duplicate_task = duplicate(&test_db.pool, &child.id)
            .await
            .expect("Failed to duplicate task");

        // Verify parent_task_id is preserved
        assert_eq!(duplicate_task.parent_task_id, Some(parent.id));
    }

    #[tokio::test]
    async fn test_create_step() {
        let test_db = setup_test_db().await;
        let project_id = create_test_project(&test_db.pool, "Test Project").await;

        let request = test_create_request(&project_id, "Step Test Task");
        let task = create(&test_db.pool, request)
            .await
            .expect("Failed to create task");

        let step = create_step(&test_db.pool, &task.id, 0, "First Step", "Do the first thing", "claude-code")
            .await
            .expect("Failed to create step");

        assert_eq!(step.task_id, task.id);
        assert_eq!(step.step_index, 0);
        assert_eq!(step.title, "First Step");
        assert_eq!(step.prompt, "Do the first thing");
        assert_eq!(step.provider_id, "claude-code");
        assert_eq!(step.status, StepStatus::Pending);
    }

    #[tokio::test]
    async fn test_get_step() {
        let test_db = setup_test_db().await;
        let project_id = create_test_project(&test_db.pool, "Test Project").await;

        let request = test_create_request(&project_id, "Get Step Task");
        let task = create(&test_db.pool, request)
            .await
            .expect("Failed to create task");

        let created = create_step(&test_db.pool, &task.id, 0, "Test Step", "Do something", "claude-code")
            .await
            .expect("Failed to create step");

        let fetched = get_step(&test_db.pool, &created.id)
            .await
            .expect("Failed to get step");

        assert_eq!(fetched.id, created.id);
        assert_eq!(fetched.title, "Test Step");
    }

    #[tokio::test]
    async fn test_list_steps() {
        let test_db = setup_test_db().await;
        let project_id = create_test_project(&test_db.pool, "Test Project").await;

        let request = test_create_request(&project_id, "List Steps Task");
        let task = create(&test_db.pool, request)
            .await
            .expect("Failed to create task");

        // Create multiple steps out of order
        create_step(&test_db.pool, &task.id, 2, "Step 2", "Do step 2", "claude-code")
            .await
            .expect("Failed to create step 2");
        create_step(&test_db.pool, &task.id, 0, "Step 0", "Do step 0", "claude-code")
            .await
            .expect("Failed to create step 0");
        create_step(&test_db.pool, &task.id, 1, "Step 1", "Do step 1", "claude-code")
            .await
            .expect("Failed to create step 1");

        let steps = list_steps(&test_db.pool, &task.id)
            .await
            .expect("Failed to list steps");

        assert_eq!(steps.len(), 3);
        // Should be ordered by step_index
        assert_eq!(steps[0].step_index, 0);
        assert_eq!(steps[1].step_index, 1);
        assert_eq!(steps[2].step_index, 2);
    }

    #[tokio::test]
    async fn test_delete_step() {
        let test_db = setup_test_db().await;
        let project_id = create_test_project(&test_db.pool, "Test Project").await;

        let request = test_create_request(&project_id, "Delete Step Task");
        let task = create(&test_db.pool, request)
            .await
            .expect("Failed to create task");

        let step = create_step(&test_db.pool, &task.id, 0, "To Delete", "Do something", "claude-code")
            .await
            .expect("Failed to create step");

        delete_step(&test_db.pool, &step.id)
            .await
            .expect("Failed to delete step");

        let result = get_step(&test_db.pool, &step.id).await;
        assert!(result.is_err());
    }

    #[tokio::test]
    async fn test_delete_all_steps() {
        let test_db = setup_test_db().await;
        let project_id = create_test_project(&test_db.pool, "Test Project").await;

        let request = test_create_request(&project_id, "Delete All Steps Task");
        let task = create(&test_db.pool, request)
            .await
            .expect("Failed to create task");

        // Create multiple steps
        create_step(&test_db.pool, &task.id, 0, "Step 0", "Do step 0", "claude-code")
            .await
            .unwrap();
        create_step(&test_db.pool, &task.id, 1, "Step 1", "Do step 1", "claude-code")
            .await
            .unwrap();
        create_step(&test_db.pool, &task.id, 2, "Step 2", "Do step 2", "claude-code")
            .await
            .unwrap();

        let deleted_count = delete_all_steps(&test_db.pool, &task.id)
            .await
            .expect("Failed to delete all steps");

        assert_eq!(deleted_count, 3);

        let steps = list_steps(&test_db.pool, &task.id)
            .await
            .expect("Failed to list steps");
        assert!(steps.is_empty());
    }

    #[tokio::test]
    async fn test_create_step_from_request() {
        let test_db = setup_test_db().await;
        let project_id = create_test_project(&test_db.pool, "Test Project").await;

        let request = test_create_request(&project_id, "Request Step Task");
        let task = create(&test_db.pool, request)
            .await
            .expect("Failed to create task");

        let step_request = CreateStepRequest::new(
            0,
            "First Step",
            "Do the first thing",
            "claude-code",
        );

        let step = create_step_from_request(&test_db.pool, &task.id, step_request)
            .await
            .expect("Failed to create step from request");

        assert_eq!(step.task_id, task.id);
        assert_eq!(step.step_index, 0);
        assert_eq!(step.title, "First Step");
        assert_eq!(step.prompt, "Do the first thing");
        assert_eq!(step.provider_id, "claude-code");
        assert_eq!(step.status, StepStatus::Pending);
    }

    #[tokio::test]
    async fn test_create_step_from_request_validates() {
        let test_db = setup_test_db().await;
        let project_id = create_test_project(&test_db.pool, "Test Project").await;

        let request = test_create_request(&project_id, "Validation Task");
        let task = create(&test_db.pool, request)
            .await
            .expect("Failed to create task");

        // Invalid request with empty title
        let step_request = CreateStepRequest {
            step_index: 0,
            title: "".to_string(),
            prompt: "Do something".to_string(),
            provider_id: "claude-code".to_string(),
        };

        let result = create_step_from_request(&test_db.pool, &task.id, step_request).await;
        assert!(result.is_err());
        match result.unwrap_err() {
            ServiceError::InvalidInput { field, .. } => {
                assert_eq!(field, "request");
            }
            other => panic!("Expected InvalidInput error, got: {:?}", other),
        }
    }
}
