//! Tauri commands for task operations.
//!
//! These commands provide the IPC interface for task CRUD operations.
//! Each command is a thin wrapper around TaskService methods.

use tauri::State;

use crate::commands::AppState;
use crate::services::TaskService;
use crate::types::{CreateTaskRequest, Task, TaskStatus, TaskWithChats, UpdateTaskRequest};

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
    TaskService::list(
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
    TaskService::get(&pool, &id)
        .await
        .map_err(|e| e.to_string())
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
    TaskService::create(&pool, request)
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
    TaskService::update(&pool, &id, request)
        .await
        .map_err(|e| e.to_string())
}

/// Archive a task by ID.
///
/// Sets the archived_at timestamp. Archived tasks are excluded from default listings.
#[tauri::command]
pub async fn archive_task(state: State<'_, AppState>, id: String) -> Result<Task, String> {
    let pool = state.db.lock().await;
    TaskService::archive(&pool, &id)
        .await
        .map_err(|e| e.to_string())
}

/// Unarchive a task by ID.
///
/// Clears the archived_at timestamp, restoring the task to active listings.
#[tauri::command]
pub async fn unarchive_task(state: State<'_, AppState>, id: String) -> Result<Task, String> {
    let pool = state.db.lock().await;
    TaskService::unarchive(&pool, &id)
        .await
        .map_err(|e| e.to_string())
}

/// Delete a task by ID.
///
/// This will cascade delete all associated chats and messages.
#[tauri::command]
pub async fn delete_task(state: State<'_, AppState>, id: String) -> Result<(), String> {
    let pool = state.db.lock().await;
    TaskService::delete(&pool, &id)
        .await
        .map_err(|e| e.to_string())
}
