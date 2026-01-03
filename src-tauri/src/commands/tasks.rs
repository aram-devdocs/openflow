//! Tauri commands for task operations.
//!
//! These commands provide the IPC interface for task CRUD operations.
//! Each command is a thin wrapper around openflow_core::services::task functions.

use tauri::State;

use crate::commands::AppState;
use openflow_contracts::{CreateTaskRequest, Task, TaskStatus, TaskWithChats, UpdateTaskRequest};
use openflow_core::services::task;

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
/// - Status reset to "todo"
/// - Associated chats are NOT duplicated (new task starts fresh)
///
/// Returns the newly created duplicate task.
#[tauri::command]
pub async fn duplicate_task(state: State<'_, AppState>, id: String) -> Result<Task, String> {
    let pool = state.db.lock().await;
    task::duplicate(&pool, &id).await.map_err(|e| e.to_string())
}
