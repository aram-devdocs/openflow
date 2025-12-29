//! Chat management service.
//!
//! Handles CRUD operations for chats (workflow step sessions).

use sqlx::SqlitePool;

use crate::types::{Chat, ChatWithMessages, CreateChatRequest, UpdateChatRequest};

#[allow(unused_imports)]
use super::{ServiceError, ServiceResult};

/// Service for managing chats.
pub struct ChatService;

impl ChatService {
    /// List chats for a task.
    pub async fn list(_pool: &SqlitePool, _task_id: &str) -> ServiceResult<Vec<Chat>> {
        // TODO: Implement in next step
        todo!()
    }

    /// Get a chat by ID with its messages.
    pub async fn get(_pool: &SqlitePool, _id: &str) -> ServiceResult<ChatWithMessages> {
        // TODO: Implement in next step
        todo!()
    }

    /// Create a new chat.
    pub async fn create(_pool: &SqlitePool, _request: CreateChatRequest) -> ServiceResult<Chat> {
        // TODO: Implement in next step
        todo!()
    }

    /// Update an existing chat.
    pub async fn update(
        _pool: &SqlitePool,
        _id: &str,
        _request: UpdateChatRequest,
    ) -> ServiceResult<Chat> {
        // TODO: Implement in next step
        todo!()
    }
}
