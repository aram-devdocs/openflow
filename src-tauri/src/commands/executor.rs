//! Tauri commands for executor profile operations.
//!
//! These commands provide the IPC interface for executor profile management
//! and running AI coding CLI tools (Claude Code, Gemini CLI, etc.).

use tauri::State;

use crate::commands::AppState;
use openflow_contracts::{
    CreateExecutorProfileRequest, ExecutionProcess, ExecutorProfile,
    UpdateExecutorProfileRequest,
};
use openflow_core::services::{executor, executor_profile};

/// List all executor profiles.
///
/// Returns all profiles ordered by name.
#[tauri::command]
pub async fn list_executor_profiles(
    state: State<'_, AppState>,
) -> Result<Vec<ExecutorProfile>, String> {
    let pool = state.db.lock().await;
    executor_profile::list(&pool)
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
    executor_profile::get(&pool, &id)
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
    executor_profile::get_default(&pool)
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
    executor_profile::create(&pool, request)
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
    executor_profile::update(&pool, &id, request)
        .await
        .map_err(|e| e.to_string())
}

/// Delete an executor profile by ID.
///
/// Returns an error if the profile is not found.
#[tauri::command]
pub async fn delete_executor_profile(state: State<'_, AppState>, id: String) -> Result<(), String> {
    let pool = state.db.lock().await;
    executor_profile::delete(&pool, &id)
        .await
        .map_err(|e| e.to_string())
}


/// Prepare and start an executor process.
///
/// This helper encapsulates the prepare and start steps for cleaner command handlers.
async fn prepare_and_start_executor(
    state: &State<'_, AppState>,
    chat_id: String,
    prompt: String,
    executor_profile_id: Option<String>,
) -> Result<ExecutionProcess, String> {
    let pool = state.db.lock().await;
    let context = executor::prepare(&pool, &chat_id, &prompt, executor_profile_id)
        .await
        .map_err(|e| e.to_string())?;

    state
        .process_service
        .start(&pool, context.create_request, context.start_request)
        .await
        .map_err(|e| e.to_string())
}

/// Run an executor (AI coding CLI) for a chat session.
///
/// Spawns a CLI process using the specified executor profile and sends the
/// prompt to the AI coding agent. Output is streamed via the ProcessService
/// broadcaster which handles real-time updates to clients.
///
/// # Arguments
/// * `state` - Application state containing the ProcessService
/// * `chat_id` - Chat session ID to associate with this execution
/// * `prompt` - The prompt to send to the AI agent
/// * `executor_profile_id` - Optional profile ID to use (uses default if None)
///
/// # Returns
/// The created `ExecutionProcess` record.
///
/// # Errors
/// Returns an error string if:
/// - Failed to prepare the execution context
/// - Failed to start the process
#[tauri::command]
pub async fn run_executor(
    state: State<'_, AppState>,
    chat_id: String,
    prompt: String,
    executor_profile_id: Option<String>,
) -> Result<ExecutionProcess, String> {
    // Prepare and start the execution process
    // The ProcessService handles broadcasting output and status events
    prepare_and_start_executor(&state, chat_id, prompt, executor_profile_id).await
}
