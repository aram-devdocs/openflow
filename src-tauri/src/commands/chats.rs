//! Tauri commands for chat operations.
//!
//! These commands provide the IPC interface for chat CRUD operations.
//! Each command is a thin wrapper around ChatService methods.

use tauri::State;

use crate::commands::AppState;
use crate::services::ChatService;
use crate::types::{Chat, ChatWithMessages, CreateChatRequest, ExecutionProcess, UpdateChatRequest};

/// List chats for a task.
///
/// Returns chats ordered by workflow_step_index ASC, then created_at ASC.
///
/// # Arguments
/// * `task_id` - The task to list chats for
#[tauri::command]
pub async fn list_chats(state: State<'_, AppState>, task_id: String) -> Result<Vec<Chat>, String> {
    let pool = state.db.lock().await;
    ChatService::list(&pool, &task_id)
        .await
        .map_err(|e| e.to_string())
}

/// Get a single chat by ID with its associated messages.
///
/// Returns the chat with all its messages if found, or an error if not found.
#[tauri::command]
pub async fn get_chat(state: State<'_, AppState>, id: String) -> Result<ChatWithMessages, String> {
    let pool = state.db.lock().await;
    ChatService::get(&pool, &id)
        .await
        .map_err(|e| e.to_string())
}

/// Create a new chat.
///
/// Returns the newly created chat with generated ID and timestamps.
#[tauri::command]
pub async fn create_chat(
    state: State<'_, AppState>,
    request: CreateChatRequest,
) -> Result<Chat, String> {
    let pool = state.db.lock().await;
    ChatService::create(&pool, request)
        .await
        .map_err(|e| e.to_string())
}

/// Update an existing chat.
///
/// Only the provided fields will be updated. Returns the updated chat.
#[tauri::command]
pub async fn update_chat(
    state: State<'_, AppState>,
    id: String,
    request: UpdateChatRequest,
) -> Result<Chat, String> {
    let pool = state.db.lock().await;
    ChatService::update(&pool, &id, request)
        .await
        .map_err(|e| e.to_string())
}

/// Delete a chat by ID.
///
/// This will cascade delete all associated messages.
#[tauri::command]
pub async fn delete_chat(state: State<'_, AppState>, id: String) -> Result<(), String> {
    let pool = state.db.lock().await;
    ChatService::delete(&pool, &id)
        .await
        .map_err(|e| e.to_string())
}

/// Start a workflow step execution for a chat.
///
/// This triggers the executor to run on the chat's initial prompt.
/// Creates a new execution process and begins the AI agent execution.
///
/// # Arguments
/// * `chat_id` - The chat ID to start the workflow step for
///
/// # Note
/// This command requires ProcessService to be fully implemented.
/// Currently returns an error indicating the feature is not yet available.
#[tauri::command]
pub async fn start_workflow_step(
    _state: State<'_, AppState>,
    _chat_id: String,
) -> Result<ExecutionProcess, String> {
    // TODO: Implement once ProcessService is complete (Phase 13)
    // The implementation will:
    // 1. Get the chat and verify it exists
    // 2. Get the executor profile for the chat
    // 3. Create a new ExecutionProcess record
    // 4. Start the executor process (CLI tool)
    // 5. Return the process record
    Err("Workflow step execution not yet implemented. See Phase 13 of the implementation plan.".to_string())
}
