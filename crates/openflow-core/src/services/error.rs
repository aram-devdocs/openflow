//! Service Error Types
//!
//! Defines the common error type for all service operations.

use thiserror::Error;

/// Common error type for service operations.
#[derive(Debug, Error)]
pub enum ServiceError {
    /// Database operation failed
    #[error("Database error: {0}")]
    Database(#[from] sqlx::Error),

    /// Entity not found
    #[error("Not found: {entity} with id {id}")]
    NotFound {
        /// The entity type (e.g., "Project", "Task")
        entity: &'static str,
        /// The ID that was searched for
        id: String,
    },

    /// Validation failed
    #[error("Validation error: {0}")]
    Validation(String),

    /// Git operation failed
    #[error("Git error: {0}")]
    Git(String),

    /// Process operation failed
    #[error("Process error: {0}")]
    Process(String),

    /// IO operation failed
    #[error("IO error: {0}")]
    Io(#[from] std::io::Error),

    /// Configuration error
    #[error("Configuration error: {0}")]
    Config(String),

    /// External service error (GitHub, etc.)
    #[error("External service error: {0}")]
    External(String),

    /// Concurrent modification conflict
    #[error("Conflict: {0}")]
    Conflict(String),

    /// Operation not permitted
    #[error("Permission denied: {0}")]
    PermissionDenied(String),

    /// Internal error
    #[error("Internal error: {0}")]
    Internal(String),
}

/// Result type alias for service operations.
pub type ServiceResult<T> = Result<T, ServiceError>;

impl ServiceError {
    /// Create a not found error
    pub fn not_found(entity: &'static str, id: impl Into<String>) -> Self {
        Self::NotFound {
            entity,
            id: id.into(),
        }
    }

    /// Create a validation error
    pub fn validation(message: impl Into<String>) -> Self {
        Self::Validation(message.into())
    }

    /// Create a git error
    pub fn git(message: impl Into<String>) -> Self {
        Self::Git(message.into())
    }

    /// Create a process error
    pub fn process(message: impl Into<String>) -> Self {
        Self::Process(message.into())
    }

    /// Create a config error
    pub fn config(message: impl Into<String>) -> Self {
        Self::Config(message.into())
    }

    /// Create an external service error
    pub fn external(message: impl Into<String>) -> Self {
        Self::External(message.into())
    }

    /// Create a conflict error
    pub fn conflict(message: impl Into<String>) -> Self {
        Self::Conflict(message.into())
    }

    /// Create a permission denied error
    pub fn permission_denied(message: impl Into<String>) -> Self {
        Self::PermissionDenied(message.into())
    }

    /// Create an internal error
    pub fn internal(message: impl Into<String>) -> Self {
        Self::Internal(message.into())
    }

    /// Check if this is a not found error
    pub fn is_not_found(&self) -> bool {
        matches!(self, Self::NotFound { .. })
    }

    /// Check if this is a validation error
    pub fn is_validation(&self) -> bool {
        matches!(self, Self::Validation(_))
    }

    /// Check if this is a database error
    pub fn is_database(&self) -> bool {
        matches!(self, Self::Database(_))
    }
}

impl From<openflow_db::DbError> for ServiceError {
    fn from(err: openflow_db::DbError) -> Self {
        match err {
            openflow_db::DbError::NotFound(msg) => {
                // Try to parse the message for entity and id
                Self::Internal(format!("Database not found: {}", msg))
            }
            openflow_db::DbError::Query(msg) => {
                Self::Internal(format!("Database query failed: {}", msg))
            }
            openflow_db::DbError::Connection(msg) => {
                Self::Internal(format!("Database connection: {}", msg))
            }
            openflow_db::DbError::Migration(msg) => {
                Self::Internal(format!("Database migration: {}", msg))
            }
            openflow_db::DbError::Config(msg) => Self::Config(msg),
            openflow_db::DbError::DirectoryCreation(e) => Self::Io(e),
            openflow_db::DbError::Seed(msg) => Self::Internal(format!("Database seeding: {}", msg)),
        }
    }
}

impl From<openflow_process::ProcessError> for ServiceError {
    fn from(err: openflow_process::ProcessError) -> Self {
        Self::Process(err.to_string())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_not_found_error() {
        let err = ServiceError::not_found("Project", "abc-123");
        assert!(err.is_not_found());
        assert!(err.to_string().contains("Project"));
        assert!(err.to_string().contains("abc-123"));
    }

    #[test]
    fn test_validation_error() {
        let err = ServiceError::validation("Name is required");
        assert!(err.is_validation());
        assert!(err.to_string().contains("Name is required"));
    }

    #[test]
    fn test_error_display() {
        let err = ServiceError::git("Failed to create worktree");
        assert_eq!(err.to_string(), "Git error: Failed to create worktree");
    }

    #[test]
    fn test_io_error_conversion() {
        let io_err = std::io::Error::new(std::io::ErrorKind::NotFound, "file not found");
        let service_err: ServiceError = io_err.into();
        assert!(matches!(service_err, ServiceError::Io(_)));
    }
}
