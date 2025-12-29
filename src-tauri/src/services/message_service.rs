//! Message management service.
//!
//! Handles operations for chat messages.

use sqlx::SqlitePool;

use crate::types::{CreateMessageRequest, Message};

#[allow(unused_imports)]
use super::{ServiceError, ServiceResult};

/// Service for managing messages.
pub struct MessageService;

impl MessageService {
    /// List messages for a chat.
    pub async fn list(_pool: &SqlitePool, _chat_id: &str) -> ServiceResult<Vec<Message>> {
        // TODO: Implement in next step
        todo!()
    }

    /// Create a new message.
    pub async fn create(
        _pool: &SqlitePool,
        _request: CreateMessageRequest,
    ) -> ServiceResult<Message> {
        // TODO: Implement in next step
        todo!()
    }
}
