//! Tauri commands for message operations.
//!
//! These commands provide the IPC interface for message CRUD operations.
//! Each command is a thin wrapper around MessageService methods.

use tauri::State;

use crate::commands::AppState;
use crate::services::MessageService;
use crate::types::{CreateMessageRequest, Message};

/// List messages for a chat.
///
/// Returns messages ordered by created_at ASC (oldest first).
///
/// # Arguments
/// * `chat_id` - The chat to list messages for
#[tauri::command]
pub async fn list_messages(
    state: State<'_, AppState>,
    chat_id: String,
) -> Result<Vec<Message>, String> {
    let pool = state.db.lock().await;
    MessageService::list(&pool, &chat_id)
        .await
        .map_err(|e| e.to_string())
}

/// Get a single message by ID.
///
/// Returns the message if found, or an error if not found.
#[tauri::command]
pub async fn get_message(state: State<'_, AppState>, id: String) -> Result<Message, String> {
    let pool = state.db.lock().await;
    MessageService::get(&pool, &id)
        .await
        .map_err(|e| e.to_string())
}

/// Create a new message.
///
/// Returns the newly created message with generated ID and timestamps.
#[tauri::command]
pub async fn create_message(
    state: State<'_, AppState>,
    request: CreateMessageRequest,
) -> Result<Message, String> {
    let pool = state.db.lock().await;
    MessageService::create(&pool, request)
        .await
        .map_err(|e| e.to_string())
}

/// Delete a message by ID.
///
/// Removes the message from the database.
#[tauri::command]
pub async fn delete_message(state: State<'_, AppState>, id: String) -> Result<(), String> {
    let pool = state.db.lock().await;
    MessageService::delete(&pool, &id)
        .await
        .map_err(|e| e.to_string())
}

/// Set the streaming status of a message.
///
/// Used to indicate whether a message is currently being streamed from the AI.
///
/// # Arguments
/// * `id` - The message ID
/// * `is_streaming` - Whether the message is currently streaming
#[tauri::command]
pub async fn set_message_streaming(
    state: State<'_, AppState>,
    id: String,
    is_streaming: bool,
) -> Result<Message, String> {
    let pool = state.db.lock().await;
    MessageService::set_streaming(&pool, &id, is_streaming)
        .await
        .map_err(|e| e.to_string())
}

/// Append content to a message.
///
/// Used for streaming responses where content arrives incrementally.
///
/// # Arguments
/// * `id` - The message ID
/// * `content` - The content to append
#[tauri::command]
pub async fn append_message_content(
    state: State<'_, AppState>,
    id: String,
    content: String,
) -> Result<Message, String> {
    let pool = state.db.lock().await;
    MessageService::append_content(&pool, &id, &content)
        .await
        .map_err(|e| e.to_string())
}

/// Set the token usage for a message.
///
/// Used after a message is complete to record token consumption.
///
/// # Arguments
/// * `id` - The message ID
/// * `tokens_used` - The number of tokens used
#[tauri::command]
pub async fn set_message_tokens(
    state: State<'_, AppState>,
    id: String,
    tokens_used: i32,
) -> Result<Message, String> {
    let pool = state.db.lock().await;
    MessageService::set_tokens_used(&pool, &id, tokens_used)
        .await
        .map_err(|e| e.to_string())
}
