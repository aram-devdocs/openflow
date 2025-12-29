//! Task management service.
//!
//! Handles CRUD operations for tasks.

use sqlx::SqlitePool;

use crate::types::{CreateTaskRequest, Task, TaskStatus, TaskWithChats, UpdateTaskRequest};

#[allow(unused_imports)]
use super::{ServiceError, ServiceResult};

/// Service for managing tasks.
pub struct TaskService;

impl TaskService {
    /// List tasks with optional filters.
    pub async fn list(
        _pool: &SqlitePool,
        _project_id: &str,
        _status: Option<TaskStatus>,
        _include_archived: bool,
    ) -> ServiceResult<Vec<Task>> {
        // TODO: Implement in next step
        todo!()
    }

    /// Get a task by ID with its associated chats.
    pub async fn get(_pool: &SqlitePool, _id: &str) -> ServiceResult<TaskWithChats> {
        // TODO: Implement in next step
        todo!()
    }

    /// Create a new task.
    pub async fn create(_pool: &SqlitePool, _request: CreateTaskRequest) -> ServiceResult<Task> {
        // TODO: Implement in next step
        todo!()
    }

    /// Update an existing task.
    pub async fn update(
        _pool: &SqlitePool,
        _id: &str,
        _request: UpdateTaskRequest,
    ) -> ServiceResult<Task> {
        // TODO: Implement in next step
        todo!()
    }

    /// Archive a task.
    pub async fn archive(_pool: &SqlitePool, _id: &str) -> ServiceResult<Task> {
        // TODO: Implement in next step
        todo!()
    }

    /// Delete a task by ID.
    pub async fn delete(_pool: &SqlitePool, _id: &str) -> ServiceResult<()> {
        // TODO: Implement in next step
        todo!()
    }
}
