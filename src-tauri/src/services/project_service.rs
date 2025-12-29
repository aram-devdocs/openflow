//! Project management service.
//!
//! Handles CRUD operations for projects.

use sqlx::SqlitePool;

use crate::types::{CreateProjectRequest, Project, UpdateProjectRequest};

#[allow(unused_imports)]
use super::{ServiceError, ServiceResult};

/// Service for managing projects.
pub struct ProjectService;

impl ProjectService {
    /// List all projects.
    pub async fn list(_pool: &SqlitePool) -> ServiceResult<Vec<Project>> {
        // TODO: Implement in next step
        todo!()
    }

    /// Get a project by ID.
    pub async fn get(_pool: &SqlitePool, _id: &str) -> ServiceResult<Project> {
        // TODO: Implement in next step
        todo!()
    }

    /// Create a new project.
    pub async fn create(
        _pool: &SqlitePool,
        _request: CreateProjectRequest,
    ) -> ServiceResult<Project> {
        // TODO: Implement in next step
        todo!()
    }

    /// Update an existing project.
    pub async fn update(
        _pool: &SqlitePool,
        _id: &str,
        _request: UpdateProjectRequest,
    ) -> ServiceResult<Project> {
        // TODO: Implement in next step
        todo!()
    }

    /// Delete a project by ID.
    pub async fn delete(_pool: &SqlitePool, _id: &str) -> ServiceResult<()> {
        // TODO: Implement in next step
        todo!()
    }
}
