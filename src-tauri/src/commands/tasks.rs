//! Tauri commands for task operations.
//!
//! These commands provide the IPC interface for task CRUD operations
//! and task execution control.
//!
//! Each command is a thin wrapper around openflow_core::services::task
//! and task_executor functions.

use tauri::State;

use crate::commands::AppState;
use openflow_contracts::{
    AgentEventRecord, CreateStepRequest, CreateTaskRequest, Permission, Task, TaskStatus, TaskStep,
    TaskWithChats, TaskWithSteps, UpdateTaskRequest,
};
use openflow_core::services::{agent_session, task};

/// List tasks for a project with optional filters.
///
/// # Arguments
/// * `project_id` - The project to list tasks for
/// * `status` - Optional status filter
/// * `include_archived` - Whether to include archived tasks (default: false)
#[tauri::command]
pub async fn list_tasks(
    state: State<'_, AppState>,
    project_id: String,
    status: Option<TaskStatus>,
    include_archived: Option<bool>,
) -> Result<Vec<Task>, String> {
    let pool = state.db.lock().await;
    task::list(
        &pool,
        &project_id,
        status,
        include_archived.unwrap_or(false),
    )
    .await
    .map_err(|e| e.to_string())
}

/// Get a single task by ID with its associated chats.
///
/// Returns the task with all its chats if found, or an error if not found.
#[tauri::command]
pub async fn get_task(state: State<'_, AppState>, id: String) -> Result<TaskWithChats, String> {
    let pool = state.db.lock().await;
    task::get(&pool, &id).await.map_err(|e| e.to_string())
}

/// Create a new task.
///
/// Returns the newly created task with generated ID and timestamps.
#[tauri::command]
pub async fn create_task(
    state: State<'_, AppState>,
    request: CreateTaskRequest,
) -> Result<Task, String> {
    let pool = state.db.lock().await;
    task::create(&pool, request)
        .await
        .map_err(|e| e.to_string())
}

/// Update an existing task.
///
/// Only the provided fields will be updated. Returns the updated task.
#[tauri::command]
pub async fn update_task(
    state: State<'_, AppState>,
    id: String,
    request: UpdateTaskRequest,
) -> Result<Task, String> {
    let pool = state.db.lock().await;
    task::update(&pool, &id, request)
        .await
        .map_err(|e| e.to_string())
}

/// Archive a task by ID.
///
/// Sets the archived_at timestamp. Archived tasks are excluded from default listings.
#[tauri::command]
pub async fn archive_task(state: State<'_, AppState>, id: String) -> Result<Task, String> {
    let pool = state.db.lock().await;
    task::archive(&pool, &id).await.map_err(|e| e.to_string())
}

/// Unarchive a task by ID.
///
/// Clears the archived_at timestamp, restoring the task to active listings.
#[tauri::command]
pub async fn unarchive_task(state: State<'_, AppState>, id: String) -> Result<Task, String> {
    let pool = state.db.lock().await;
    task::unarchive(&pool, &id).await.map_err(|e| e.to_string())
}

/// Delete a task by ID.
///
/// This will cascade delete all associated chats and messages.
#[tauri::command]
pub async fn delete_task(state: State<'_, AppState>, id: String) -> Result<(), String> {
    let pool = state.db.lock().await;
    task::delete(&pool, &id).await.map_err(|e| e.to_string())
}

/// Duplicate a task by ID.
///
/// Creates a copy of the task with:
/// - New unique ID
/// - Title appended with "(copy)"
/// - Status reset to "pending"
/// - Associated chats are NOT duplicated (new task starts fresh)
///
/// Returns the newly created duplicate task.
#[tauri::command]
pub async fn duplicate_task(state: State<'_, AppState>, id: String) -> Result<Task, String> {
    let pool = state.db.lock().await;
    task::duplicate(&pool, &id).await.map_err(|e| e.to_string())
}

// =============================================================================
// Task Execution Commands
// =============================================================================

/// Get a task with all its steps.
///
/// Returns the task along with all associated steps ordered by step_index.
/// This is the primary query for the task execution UI.
#[tauri::command]
pub async fn get_task_with_steps(
    state: State<'_, AppState>,
    id: String,
) -> Result<TaskWithSteps, String> {
    let pool = state.db.lock().await;
    task::get_with_steps(&pool, &id)
        .await
        .map_err(|e| e.to_string())
}

/// Start executing a task.
///
/// This command:
/// 1. Validates the task can be started (pending or paused status)
/// 2. Updates task status to running
/// 3. Spawns background execution
///
/// Returns the updated task after status change.
/// Execution continues in background - use events to monitor progress.
#[tauri::command]
pub async fn start_task(state: State<'_, AppState>, id: String) -> Result<Task, String> {
    state
        .task_executor
        .start_task(&id)
        .await
        .map_err(|e| e.to_string())
}

/// Pause a running task.
///
/// This command:
/// 1. Kills the current agent if running
/// 2. Marks the current step as failed (interrupted)
/// 3. Updates task status to paused
///
/// The task can be resumed later with resume_task.
#[tauri::command]
pub async fn pause_task(state: State<'_, AppState>, id: String) -> Result<Task, String> {
    state
        .task_executor
        .pause_task(&id)
        .await
        .map_err(|e| e.to_string())
}

/// Resume a paused task.
///
/// Continues execution from the current step. If the current step was
/// marked as failed during pause, it will be reset to pending and re-executed.
#[tauri::command]
pub async fn resume_task(state: State<'_, AppState>, id: String) -> Result<Task, String> {
    state
        .task_executor
        .resume_task(&id)
        .await
        .map_err(|e| e.to_string())
}

/// Cancel a task.
///
/// This command:
/// 1. Kills the current agent if running
/// 2. Marks remaining pending steps as skipped
/// 3. Updates task status to cancelled (terminal - cannot be resumed)
#[tauri::command]
pub async fn cancel_task(state: State<'_, AppState>, id: String) -> Result<Task, String> {
    state
        .task_executor
        .cancel_task(&id)
        .await
        .map_err(|e| e.to_string())
}

/// Check if a task is currently running.
#[tauri::command]
pub async fn is_task_running(state: State<'_, AppState>, id: String) -> Result<bool, String> {
    Ok(state.task_executor.is_running(&id).await)
}

/// Get the count of currently running tasks.
#[tauri::command]
pub async fn running_task_count(state: State<'_, AppState>) -> Result<usize, String> {
    Ok(state.task_executor.running_count().await)
}

/// List all currently running task IDs.
#[tauri::command]
pub async fn list_running_tasks(state: State<'_, AppState>) -> Result<Vec<String>, String> {
    Ok(state.task_executor.list_running().await)
}

// =============================================================================
// Task Step Commands
// =============================================================================

/// Create a step for a task.
///
/// Steps define the execution sequence for a task. Each step has a prompt
/// that will be sent to the configured provider (e.g., Claude Code).
#[tauri::command]
pub async fn create_task_step(
    state: State<'_, AppState>,
    task_id: String,
    request: CreateStepRequest,
) -> Result<TaskStep, String> {
    let pool = state.db.lock().await;
    task::create_step_from_request(&pool, &task_id, request)
        .await
        .map_err(|e| e.to_string())
}

/// Get a specific step by ID.
#[tauri::command]
pub async fn get_task_step(state: State<'_, AppState>, id: String) -> Result<TaskStep, String> {
    let pool = state.db.lock().await;
    task::get_step(&pool, &id).await.map_err(|e| e.to_string())
}

/// List all steps for a task.
///
/// Returns steps ordered by step_index (ascending).
#[tauri::command]
pub async fn list_task_steps(
    state: State<'_, AppState>,
    task_id: String,
) -> Result<Vec<TaskStep>, String> {
    let pool = state.db.lock().await;
    task::list_steps(&pool, &task_id)
        .await
        .map_err(|e| e.to_string())
}

/// Delete a specific step.
#[tauri::command]
pub async fn delete_task_step(state: State<'_, AppState>, id: String) -> Result<(), String> {
    let pool = state.db.lock().await;
    task::delete_step(&pool, &id)
        .await
        .map_err(|e| e.to_string())
}

/// Delete all steps for a task.
///
/// Returns the number of steps deleted.
#[tauri::command]
pub async fn delete_all_task_steps(
    state: State<'_, AppState>,
    task_id: String,
) -> Result<i32, String> {
    let pool = state.db.lock().await;
    task::delete_all_steps(&pool, &task_id)
        .await
        .map_err(|e| e.to_string())
}

// =============================================================================
// Task Event Commands
// =============================================================================

/// Get agent events for a task step.
///
/// Returns events for the session linked to the step at the given index.
/// Use after_sequence to get only new events since the last fetch.
///
/// # Arguments
/// * `task_id` - The task ID
/// * `step_index` - The step index (0-based)
/// * `after_sequence` - Only return events with sequence > this value
#[tauri::command]
pub async fn get_task_step_events(
    state: State<'_, AppState>,
    task_id: String,
    step_index: i32,
    after_sequence: Option<i32>,
) -> Result<Vec<AgentEventRecord>, String> {
    let pool = state.db.lock().await;

    // Get the task with steps
    let task_with_steps = task::get_with_steps(&pool, &task_id)
        .await
        .map_err(|e| e.to_string())?;

    // Find the step at the given index
    let step = task_with_steps
        .steps
        .iter()
        .find(|s| s.step_index == step_index)
        .ok_or_else(|| format!("Step at index {} not found", step_index))?;

    // If step has no session, return empty vec
    let session_id = match &step.session_id {
        Some(id) => id,
        None => return Ok(Vec::new()),
    };

    // Get events for the session
    agent_session::get_events(&pool, session_id, after_sequence.map(|s| s as i64))
        .await
        .map_err(|e| e.to_string())
}

// =============================================================================
// Permission Commands
// =============================================================================

/// Respond to a permission request for a running task.
///
/// When an agent requests permission (e.g., to write a file), this command
/// approves or denies the request and sends the response to the agent.
///
/// # Arguments
/// * `task_id` - The task ID
/// * `permission_id` - The permission request ID
/// * `approved` - Whether to approve (true) or deny (false) the request
#[tauri::command]
pub async fn respond_to_task_permission(
    state: State<'_, AppState>,
    task_id: String,
    permission_id: String,
    approved: bool,
) -> Result<Permission, String> {
    state
        .task_executor
        .respond_to_permission(&task_id, &permission_id, approved)
        .await
        .map_err(|e| e.to_string())
}

/// Get the pending permission for a running task.
///
/// Returns the current pending permission request if one exists, or None
/// if there is no pending permission.
#[tauri::command]
pub async fn get_task_pending_permission(
    state: State<'_, AppState>,
    task_id: String,
) -> Result<Option<Permission>, String> {
    state
        .task_executor
        .get_pending_permission(&task_id)
        .await
        .map_err(|e| e.to_string())
}
