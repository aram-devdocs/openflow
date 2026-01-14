//! Tauri commands for executor profile operations.
//!
//! These commands provide the IPC interface for executor profile management
//! and running AI coding CLI tools via the AgentOrchestrator.

use std::path::PathBuf;

use tauri::State;

use crate::commands::AppState;
use openflow_contracts::{
    CreateExecutorProfileRequest, ExecutionProcess, ExecutorProfile, UpdateExecutorProfileRequest,
};
use openflow_core::providers::{AgentConfig, DEFAULT_PROVIDER_ID};
use openflow_core::services::{executor, executor_profile, process, SpawnAgentRequest};

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

/// Run an executor (AI coding CLI) for a chat session.
///
/// Uses the AgentOrchestrator to spawn an agent process that:
/// - Creates an agent session for event tracking
/// - Parses CLI output via the provider system
/// - Persists events to the database
/// - Broadcasts real-time updates to clients
///
/// # Arguments
/// * `state` - Application state containing the AgentOrchestrator
/// * `chat_id` - Chat session ID to associate with this execution
/// * `prompt` - The prompt to send to the AI agent
/// * `executor_profile_id` - Optional profile ID to use (uses default if None)
///
/// # Returns
/// The created `ExecutionProcess` record with an associated agent session.
#[tauri::command]
pub async fn run_executor(
    state: State<'_, AppState>,
    chat_id: String,
    prompt: String,
    executor_profile_id: Option<String>,
) -> Result<ExecutionProcess, String> {
    let pool = state.db.lock().await;

    // Prepare executor context (resolves profile, chat, project)
    let context = executor::prepare(&pool, &chat_id, &prompt, executor_profile_id)
        .await
        .map_err(|e| e.to_string())?;

    // Create the process record first
    let execution_process = process::create(&pool, context.create_request)
        .await
        .map_err(|e| e.to_string())?;

    // Build agent configuration
    let mut agent_config = AgentConfig::new(&prompt, PathBuf::from(&context.project.git_repo_path));

    // Add session ID for resuming if available
    if let Some(session_id) = &context.chat.claude_session_id {
        agent_config = agent_config.with_session_id(session_id);
    }

    // Add environment variables
    agent_config = agent_config.with_env(context.env);

    // Spawn agent via orchestrator
    let spawn_request = SpawnAgentRequest::new(
        &execution_process.id,
        DEFAULT_PROVIDER_ID, // Use claude-code provider
        agent_config,
    );

    let orchestrator = state.get_agent_orchestrator();
    orchestrator
        .spawn_agent(spawn_request)
        .await
        .map_err(|e| e.to_string())?;

    Ok(execution_process)
}

/// Run an executor using the SDK bridge (new architecture).
///
/// Uses the AgentServiceBridge to spawn an agent via the TypeScript agent-service,
/// which wraps the official Claude Agent SDK. This provides:
/// - Type-safe permission handling via canUseTool callback
/// - Structured tool inputs instead of text pattern matching
/// - Better reliability and maintainability
///
/// # Arguments
/// * `state` - Application state containing the AgentServiceBridge
/// * `chat_id` - Chat session ID to associate with this execution
/// * `prompt` - The prompt to send to the AI agent
/// * `executor_profile_id` - Optional profile ID to use (uses default if None)
///
/// # Returns
/// The created `ExecutionProcess` record with an associated agent session.
#[tauri::command]
pub async fn run_executor_sdk(
    state: State<'_, AppState>,
    chat_id: String,
    prompt: String,
    executor_profile_id: Option<String>,
) -> Result<ExecutionProcess, String> {
    let pool = state.db.lock().await;

    // Prepare executor context (resolves profile, chat, project)
    let context = executor::prepare(&pool, &chat_id, &prompt, executor_profile_id.clone())
        .await
        .map_err(|e| e.to_string())?;

    // Create the process record first
    let execution_process = process::create(&pool, context.create_request)
        .await
        .map_err(|e| e.to_string())?;

    // Spawn agent via SDK bridge
    let orchestrator = state.get_agent_orchestrator();
    let bridge = state.get_agent_bridge();

    orchestrator
        .spawn_agent_via_bridge(
            &bridge,
            &execution_process.id,
            &prompt,
            Some(context.project.git_repo_path.clone()),
        )
        .await
        .map_err(|e| e.to_string())?;

    Ok(execution_process)
}
