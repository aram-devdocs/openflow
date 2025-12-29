//! Tauri commands for executor profile operations.
//!
//! These commands provide the IPC interface for executor profile management.
//! Each command is a thin wrapper around ExecutorProfileService methods.
//!
//! The `run_executor` command is a placeholder that will be fully implemented
//! in Phase 13 (Process Execution) when ProcessService is available.

use tauri::State;

use crate::commands::AppState;
use crate::services::ExecutorProfileService;
use crate::types::{
    CreateExecutorProfileRequest, ExecutionProcess, ExecutorProfile, UpdateExecutorProfileRequest,
};

/// List all executor profiles.
///
/// Returns all profiles ordered by name.
#[tauri::command]
pub async fn list_executor_profiles(
    state: State<'_, AppState>,
) -> Result<Vec<ExecutorProfile>, String> {
    let pool = state.db.lock().await;
    ExecutorProfileService::list(&pool)
        .await
        .map_err(|e| e.to_string())
}

/// Get an executor profile by ID.
///
/// Returns the profile if found, or an error if not found.
#[tauri::command]
pub async fn get_executor_profile(
    state: State<'_, AppState>,
    id: String,
) -> Result<ExecutorProfile, String> {
    let pool = state.db.lock().await;
    ExecutorProfileService::get(&pool, &id)
        .await
        .map_err(|e| e.to_string())
}

/// Get the default executor profile.
///
/// Returns the default profile if one exists, or None.
#[tauri::command]
pub async fn get_default_executor_profile(
    state: State<'_, AppState>,
) -> Result<Option<ExecutorProfile>, String> {
    let pool = state.db.lock().await;
    ExecutorProfileService::get_default(&pool)
        .await
        .map_err(|e| e.to_string())
}

/// Create a new executor profile.
///
/// If is_default is true, clears default from all other profiles.
/// Returns the newly created profile with generated ID and timestamps.
#[tauri::command]
pub async fn create_executor_profile(
    state: State<'_, AppState>,
    request: CreateExecutorProfileRequest,
) -> Result<ExecutorProfile, String> {
    let pool = state.db.lock().await;
    ExecutorProfileService::create(&pool, request)
        .await
        .map_err(|e| e.to_string())
}

/// Update an existing executor profile.
///
/// Only the provided fields will be updated.
/// If is_default is set to true, clears default from all other profiles.
/// Returns the updated profile.
#[tauri::command]
pub async fn update_executor_profile(
    state: State<'_, AppState>,
    id: String,
    request: UpdateExecutorProfileRequest,
) -> Result<ExecutorProfile, String> {
    let pool = state.db.lock().await;
    ExecutorProfileService::update(&pool, &id, request)
        .await
        .map_err(|e| e.to_string())
}

/// Delete an executor profile by ID.
///
/// Returns an error if the profile is not found.
#[tauri::command]
pub async fn delete_executor_profile(state: State<'_, AppState>, id: String) -> Result<(), String> {
    let pool = state.db.lock().await;
    ExecutorProfileService::delete(&pool, &id)
        .await
        .map_err(|e| e.to_string())
}

/// Run an executor (AI coding CLI) for a chat session.
///
/// This command spawns a CLI process using the specified executor profile
/// and sends the prompt to the AI coding agent.
///
/// # Arguments
/// * `chat_id` - The chat session to associate the execution with
/// * `prompt` - The prompt/instructions to send to the AI agent
/// * `executor_profile_id` - Optional profile ID; uses default if not specified
///
/// # Returns
/// The ExecutionProcess record tracking this execution.
///
/// Note: Full implementation depends on ProcessService (Phase 13).
/// This is a placeholder that validates inputs and creates a process record.
#[tauri::command]
pub async fn run_executor(
    state: State<'_, AppState>,
    chat_id: String,
    prompt: String,
    executor_profile_id: Option<String>,
) -> Result<ExecutionProcess, String> {
    let pool = state.db.lock().await;

    // Get the executor profile (specified or default)
    let profile = match executor_profile_id {
        Some(id) => ExecutorProfileService::get(&pool, &id)
            .await
            .map_err(|e| e.to_string())?,
        None => ExecutorProfileService::get_default(&pool)
            .await
            .map_err(|e| e.to_string())?
            .ok_or_else(|| "No default executor profile configured".to_string())?,
    };

    // Validate the chat exists
    // Note: This will be handled properly once ProcessService is implemented
    // For now, we return a placeholder error indicating this is not yet implemented
    Err(format!(
        "run_executor not yet implemented. Would run '{}' for chat {} with prompt: {}",
        profile.command,
        chat_id,
        if prompt.len() > 50 {
            format!("{}...", &prompt[..50])
        } else {
            prompt
        }
    ))
}
