//! Tauri commands for project operations.
//!
//! These commands provide the IPC interface for project CRUD operations.
//! Each command is a thin wrapper around ProjectService methods.

use tauri::State;

use crate::commands::AppState;
use crate::services::ProjectService;
use crate::types::{CreateProjectRequest, Project, UpdateProjectRequest};

/// List all projects.
///
/// Returns all projects ordered by name.
#[tauri::command]
pub async fn list_projects(state: State<'_, AppState>) -> Result<Vec<Project>, String> {
    let pool = state.db.lock().await;
    ProjectService::list(&pool).await.map_err(|e| e.to_string())
}

/// Get a single project by ID.
///
/// Returns the project if found, or an error if not found.
#[tauri::command]
pub async fn get_project(state: State<'_, AppState>, id: String) -> Result<Project, String> {
    let pool = state.db.lock().await;
    ProjectService::get(&pool, &id)
        .await
        .map_err(|e| e.to_string())
}

/// Create a new project.
///
/// Returns the newly created project with generated ID and timestamps.
#[tauri::command]
pub async fn create_project(
    state: State<'_, AppState>,
    request: CreateProjectRequest,
) -> Result<Project, String> {
    let pool = state.db.lock().await;
    ProjectService::create(&pool, request)
        .await
        .map_err(|e| e.to_string())
}

/// Update an existing project.
///
/// Only the provided fields will be updated. Returns the updated project.
#[tauri::command]
pub async fn update_project(
    state: State<'_, AppState>,
    id: String,
    request: UpdateProjectRequest,
) -> Result<Project, String> {
    let pool = state.db.lock().await;
    ProjectService::update(&pool, &id, request)
        .await
        .map_err(|e| e.to_string())
}

/// Delete a project by ID.
///
/// This will cascade delete all related tasks, chats, and messages.
#[tauri::command]
pub async fn delete_project(state: State<'_, AppState>, id: String) -> Result<(), String> {
    let pool = state.db.lock().await;
    ProjectService::delete(&pool, &id)
        .await
        .map_err(|e| e.to_string())
}

/// Archive a project by ID.
///
/// Sets the archived_at timestamp. Archived projects are hidden from list queries.
/// Cascades to archive all tasks in the project.
#[tauri::command]
pub async fn archive_project(state: State<'_, AppState>, id: String) -> Result<Project, String> {
    let pool = state.db.lock().await;
    ProjectService::archive(&pool, &id)
        .await
        .map_err(|e| e.to_string())
}

/// Unarchive a project by ID.
///
/// Clears the archived_at timestamp, making the project visible again.
/// Note: Tasks remain archived and must be restored individually.
#[tauri::command]
pub async fn unarchive_project(state: State<'_, AppState>, id: String) -> Result<Project, String> {
    let pool = state.db.lock().await;
    ProjectService::unarchive(&pool, &id)
        .await
        .map_err(|e| e.to_string())
}

/// List all archived projects.
///
/// Returns archived projects ordered by archived_at DESC (most recently archived first).
#[tauri::command]
pub async fn list_archived_projects(state: State<'_, AppState>) -> Result<Vec<Project>, String> {
    let pool = state.db.lock().await;
    ProjectService::list_archived(&pool)
        .await
        .map_err(|e| e.to_string())
}
