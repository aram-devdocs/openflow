//! Tauri commands for message operations.
//!
//! These commands provide the IPC interface for message CRUD operations.
//! Each command is a thin wrapper around openflow_core::services::message functions.

use tauri::State;

use crate::commands::AppState;
use openflow_contracts::{CreateMessageRequest, Message, UpdateMessageRequest};
use openflow_core::services::message;

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
    message::list(&pool, &chat_id)
        .await
        .map_err(|e| e.to_string())
}

/// Get a single message by ID.
///
/// Returns the message if found, or an error if not found.
#[tauri::command]
pub async fn get_message(state: State<'_, AppState>, id: String) -> Result<Message, String> {
    let pool = state.db.lock().await;
    message::get(&pool, &id).await.map_err(|e| e.to_string())
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
    message::create(&pool, request)
        .await
        .map_err(|e| e.to_string())
}

/// Update an existing message.
///
/// Allows partial updates - only provided fields will be updated.
///
/// # Arguments
/// * `id` - The message ID to update
/// * `request` - Update request with optional fields
#[tauri::command]
pub async fn update_message(
    state: State<'_, AppState>,
    id: String,
    request: UpdateMessageRequest,
) -> Result<Message, String> {
    let pool = state.db.lock().await;
    message::update(&pool, &id, request)
        .await
        .map_err(|e| e.to_string())
}

/// Delete a message by ID.
///
/// Removes the message from the database.
#[tauri::command]
pub async fn delete_message(state: State<'_, AppState>, id: String) -> Result<(), String> {
    let pool = state.db.lock().await;
    message::delete(&pool, &id).await.map_err(|e| e.to_string())
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
    message::set_streaming(&pool, &id, is_streaming)
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
    message::append_content(&pool, &id, &content)
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
    message::set_tokens_used(&pool, &id, tokens_used)
        .await
        .map_err(|e| e.to_string())
}

/// Count messages for a chat.
///
/// Returns the total number of messages in the specified chat.
///
/// # Arguments
/// * `chat_id` - The chat to count messages for
#[tauri::command]
pub async fn count_messages(state: State<'_, AppState>, chat_id: String) -> Result<i64, String> {
    let pool = state.db.lock().await;
    message::count(&pool, &chat_id)
        .await
        .map_err(|e| e.to_string())
}

/// Get the latest message for a chat.
///
/// Returns the most recent message by created_at timestamp,
/// or None if the chat has no messages.
///
/// # Arguments
/// * `chat_id` - The chat to get the latest message for
#[tauri::command]
pub async fn get_latest_message(
    state: State<'_, AppState>,
    chat_id: String,
) -> Result<Option<Message>, String> {
    let pool = state.db.lock().await;
    message::get_latest(&pool, &chat_id)
        .await
        .map_err(|e| e.to_string())
}

/// Delete all messages for a chat.
///
/// Removes all messages belonging to the specified chat.
/// Returns the number of messages deleted.
///
/// # Arguments
/// * `chat_id` - The chat to delete messages from
#[tauri::command]
pub async fn delete_messages_by_chat(
    state: State<'_, AppState>,
    chat_id: String,
) -> Result<u64, String> {
    let pool = state.db.lock().await;
    message::delete_by_chat(&pool, &chat_id)
        .await
        .map_err(|e| e.to_string())
}
