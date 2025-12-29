//! Executor profile management service.
//!
//! Handles CRUD operations for executor profiles (CLI tool configurations).

use sqlx::SqlitePool;

use crate::types::{
    CreateExecutorProfileRequest, ExecutorProfile, UpdateExecutorProfileRequest,
};

#[allow(unused_imports)]
use super::{ServiceError, ServiceResult};

/// Service for managing executor profiles.
pub struct ExecutorProfileService;

impl ExecutorProfileService {
    /// List all executor profiles.
    pub async fn list(_pool: &SqlitePool) -> ServiceResult<Vec<ExecutorProfile>> {
        // TODO: Implement in next step
        todo!()
    }

    /// Get an executor profile by ID.
    pub async fn get(_pool: &SqlitePool, _id: &str) -> ServiceResult<ExecutorProfile> {
        // TODO: Implement in next step
        todo!()
    }

    /// Create a new executor profile.
    pub async fn create(
        _pool: &SqlitePool,
        _request: CreateExecutorProfileRequest,
    ) -> ServiceResult<ExecutorProfile> {
        // TODO: Implement in next step
        todo!()
    }

    /// Update an existing executor profile.
    pub async fn update(
        _pool: &SqlitePool,
        _id: &str,
        _request: UpdateExecutorProfileRequest,
    ) -> ServiceResult<ExecutorProfile> {
        // TODO: Implement in next step
        todo!()
    }

    /// Delete an executor profile by ID.
    pub async fn delete(_pool: &SqlitePool, _id: &str) -> ServiceResult<()> {
        // TODO: Implement in next step
        todo!()
    }

    /// Get the default executor profile.
    pub async fn get_default(_pool: &SqlitePool) -> ServiceResult<Option<ExecutorProfile>> {
        // TODO: Implement in next step
        todo!()
    }
}
