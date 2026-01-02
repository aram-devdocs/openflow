//! Database Error Types
//!
//! Provides error types for database operations with proper
//! conversion from underlying SQLx errors.

use thiserror::Error;

/// Errors that can occur during database operations.
#[derive(Debug, Error)]
pub enum DbError {
    /// Failed to create the data directory
    #[error("Failed to create data directory: {0}")]
    DirectoryCreation(#[from] std::io::Error),

    /// Failed to connect to the database
    #[error("Failed to connect to database: {0}")]
    Connection(String),

    /// Failed to run database migrations
    #[error("Failed to run migrations: {0}")]
    Migration(String),

    /// Failed to execute a query
    #[error("Query execution failed: {0}")]
    Query(String),

    /// Record not found
    #[error("Record not found: {0}")]
    NotFound(String),

    /// Configuration error
    #[error("Configuration error: {0}")]
    Config(String),

    /// Seeding error
    #[error("Failed to seed database: {0}")]
    Seed(String),
}

impl From<sqlx::Error> for DbError {
    fn from(err: sqlx::Error) -> Self {
        match &err {
            sqlx::Error::RowNotFound => DbError::NotFound("Row not found".to_string()),
            sqlx::Error::Configuration(_) => DbError::Config(err.to_string()),
            _ => DbError::Query(err.to_string()),
        }
    }
}

impl From<sqlx::migrate::MigrateError> for DbError {
    fn from(err: sqlx::migrate::MigrateError) -> Self {
        DbError::Migration(err.to_string())
    }
}

/// Result type for database operations
pub type DbResult<T> = Result<T, DbError>;

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_error_display() {
        let err = DbError::NotFound("project_123".to_string());
        assert_eq!(err.to_string(), "Record not found: project_123");

        let err = DbError::Config("invalid path".to_string());
        assert_eq!(err.to_string(), "Configuration error: invalid path");
    }

    #[test]
    fn test_io_error_conversion() {
        let io_err = std::io::Error::new(std::io::ErrorKind::NotFound, "file not found");
        let db_err: DbError = io_err.into();
        assert!(matches!(db_err, DbError::DirectoryCreation(_)));
    }
}
