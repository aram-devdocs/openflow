//! Process management service.
//!
//! Handles execution process lifecycle and management.

use sqlx::SqlitePool;

use crate::types::ExecutionProcess;

#[allow(unused_imports)]
use super::{ServiceError, ServiceResult};

/// Service for managing execution processes.
pub struct ProcessService;

impl ProcessService {
    /// Get a process by ID.
    pub async fn get(_pool: &SqlitePool, _id: &str) -> ServiceResult<ExecutionProcess> {
        // TODO: Implement in next step
        todo!()
    }

    /// List processes for a chat.
    pub async fn list_by_chat(
        _pool: &SqlitePool,
        _chat_id: &str,
    ) -> ServiceResult<Vec<ExecutionProcess>> {
        // TODO: Implement in next step
        todo!()
    }

    /// Create a new execution process record.
    pub async fn create(
        _pool: &SqlitePool,
        _chat_id: &str,
        _run_reason: &str,
    ) -> ServiceResult<ExecutionProcess> {
        // TODO: Implement in next step
        todo!()
    }

    /// Update process status.
    pub async fn update_status(
        _pool: &SqlitePool,
        _id: &str,
        _status: &str,
        _exit_code: Option<i32>,
    ) -> ServiceResult<ExecutionProcess> {
        // TODO: Implement in next step
        todo!()
    }

    /// Mark a process as killed.
    pub async fn kill(_pool: &SqlitePool, _id: &str) -> ServiceResult<ExecutionProcess> {
        // TODO: Implement in next step
        todo!()
    }
}
