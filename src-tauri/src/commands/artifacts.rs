//! Tauri commands for task artifact operations.
//!
//! These commands provide the IPC interface for listing and reading
//! task artifact files from the `.zenflow/tasks/{task_id}/` folder.

use serde::Deserialize;
use tauri::State;

use crate::commands::AppState;
use openflow_contracts::ArtifactFile;
use openflow_core::services::artifact;

/// Parameters for artifacts_list command.
/// Uses serde rename_all to accept camelCase from frontend.
#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ArtifactsListParams {
    pub task_id: String,
}

/// Parameters for artifact_read command.
/// Uses serde rename_all to accept camelCase from frontend.
#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ArtifactReadParams {
    pub task_id: String,
    pub file_name: String,
}

/// List all artifacts for a task.
///
/// Returns files in the task's `.zenflow/tasks/{task_id}/` folder.
/// Returns an empty array if the folder doesn't exist.
///
/// # Arguments
/// * `taskId` - The task ID to list artifacts for (camelCase from frontend)
///
/// # Returns
/// Array of artifact file metadata
#[tauri::command]
pub async fn artifacts_list(
    state: State<'_, AppState>,
    task_id: String,
) -> Result<Vec<ArtifactFile>, String> {
    let pool = state.db.lock().await;
    artifact::list(&pool, &task_id)
        .await
        .map_err(|e| e.to_string())
}

/// Read the content of an artifact file.
///
/// # Arguments
/// * `taskId` - The task ID the artifact belongs to (camelCase from frontend)
/// * `fileName` - The name of the file to read (camelCase from frontend)
///
/// # Returns
/// The file content as a string
#[tauri::command]
pub async fn artifact_read(
    state: State<'_, AppState>,
    task_id: String,
    file_name: String,
) -> Result<String, String> {
    let pool = state.db.lock().await;
    artifact::read(&pool, &task_id, &file_name)
        .await
        .map_err(|e| e.to_string())
}

/// Open an artifact file in the system's default application.
///
/// This is a convenience alias for open_in_editor with a path parameter.
/// The frontend can also use `shell_open` directly.
///
/// Note: This command uses the `path` parameter name to match what the frontend expects.
#[tauri::command]
pub async fn shell_open(app_handle: tauri::AppHandle, path: String) -> Result<(), String> {
    // Delegate to the existing open_in_editor command
    super::system::open_in_editor(app_handle, path).await
}
