//! Business logic services for OpenFlow.
//!
//! Services encapsulate all business logic and database operations.
//! They are stateless functions that take dependencies as arguments
//! and return Results.
//!
//! Pattern:
//! - Services receive `&SqlitePool` as first argument
//! - Services return `Result<T, ServiceError>`
//! - Services are called by thin command handlers in `commands/`

pub mod chat_service;
pub mod executor_profile_service;
pub mod git_service;
pub mod message_service;
pub mod process_service;
pub mod project_service;
pub mod search_service;
pub mod settings_service;
pub mod task_service;
pub mod workflow_service;

pub use chat_service::ChatService;
pub use executor_profile_service::ExecutorProfileService;
pub use git_service::GitService;
pub use message_service::MessageService;
pub use process_service::ProcessService;
pub use project_service::ProjectService;
pub use search_service::SearchService;
pub use settings_service::SettingsService;
pub use task_service::TaskService;
pub use workflow_service::WorkflowService;

use thiserror::Error;

/// Common error type for service operations.
#[derive(Debug, Error)]
pub enum ServiceError {
    #[error("Database error: {0}")]
    Database(#[from] sqlx::Error),

    #[error("Not found: {entity} with id {id}")]
    NotFound { entity: &'static str, id: String },

    #[error("Validation error: {0}")]
    Validation(String),

    #[error("Git error: {0}")]
    Git(String),

    #[error("Process error: {0}")]
    Process(String),

    #[error("IO error: {0}")]
    Io(#[from] std::io::Error),
}

/// Result type alias for service operations.
pub type ServiceResult<T> = Result<T, ServiceError>;
