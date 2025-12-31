//! Database pool initialization and management.
//!
//! This module handles creating the SQLite database file in the app data directory,
//! running migrations, seeding default data, and providing a connection pool for the application.

use sqlx::sqlite::{SqliteConnectOptions, SqlitePoolOptions};
use sqlx::SqlitePool;
use std::fs;
use std::path::PathBuf;
use std::str::FromStr;
use thiserror::Error;

use crate::services::ExecutorProfileService;

/// Errors that can occur during database initialization.
#[derive(Debug, Error)]
pub enum DbError {
    #[error("Failed to create app data directory: {0}")]
    DirectoryCreation(#[from] std::io::Error),

    #[error("Failed to connect to database: {0}")]
    Connection(#[from] sqlx::Error),

    #[error("Failed to run migrations: {0}")]
    Migration(#[from] sqlx::migrate::MigrateError),

    #[error("Failed to seed database: {0}")]
    Seed(#[from] crate::services::ServiceError),

    #[error("Failed to get app data directory")]
    NoAppDataDir,
}

/// Initialize the SQLite database.
///
/// This function:
/// 1. Creates the app data directory if it doesn't exist
/// 2. Creates or opens the SQLite database file
/// 3. Runs pending migrations
/// 4. Returns a connection pool
///
/// # Arguments
///
/// * `app_data_dir` - The application data directory path from Tauri
///
/// # Returns
///
/// A `SqlitePool` for database connections, or an error if initialization fails.
///
/// # Example
///
/// ```ignore
/// let pool = init_db(app.path().app_data_dir()?).await?;
/// ```
pub async fn init_db(app_data_dir: PathBuf) -> Result<SqlitePool, DbError> {
    // Ensure the app data directory exists
    fs::create_dir_all(&app_data_dir)?;

    // Construct the database file path
    let db_path = app_data_dir.join("openflow.db");
    let db_url = format!("sqlite:{}?mode=rwc", db_path.display());

    // Configure connection options
    let connect_options = SqliteConnectOptions::from_str(&db_url)?
        .create_if_missing(true)
        .journal_mode(sqlx::sqlite::SqliteJournalMode::Wal)
        .synchronous(sqlx::sqlite::SqliteSynchronous::Normal)
        .busy_timeout(std::time::Duration::from_secs(30));

    // Create the connection pool
    let pool = SqlitePoolOptions::new()
        .max_connections(5)
        .min_connections(1)
        .connect_with(connect_options)
        .await?;

    // Run migrations
    sqlx::migrate!("./migrations").run(&pool).await?;

    // Seed default data
    ExecutorProfileService::seed_default_profile(&pool).await?;

    Ok(pool)
}

#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::tempdir;

    #[tokio::test]
    async fn test_init_db_creates_database() {
        let temp_dir = tempdir().expect("Failed to create temp dir");
        let app_data_dir = temp_dir.path().to_path_buf();

        let result = init_db(app_data_dir.clone()).await;
        assert!(result.is_ok(), "init_db should succeed");

        let db_path = app_data_dir.join("openflow.db");
        assert!(db_path.exists(), "Database file should be created");
    }

    #[tokio::test]
    async fn test_init_db_creates_directory() {
        let temp_dir = tempdir().expect("Failed to create temp dir");
        let app_data_dir = temp_dir.path().join("nested").join("path");

        let result = init_db(app_data_dir.clone()).await;
        assert!(result.is_ok(), "init_db should create nested directories");

        assert!(app_data_dir.exists(), "Directory should be created");
    }
}
