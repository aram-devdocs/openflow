//! Database Pool Initialization and Management
//!
//! This module handles creating the SQLite database file,
//! running migrations, and providing a connection pool.
//!
//! The pool can be initialized with or without a seeder callback,
//! allowing the calling code to seed default data after migrations.

use sqlx::sqlite::{SqliteConnectOptions, SqlitePoolOptions};
use sqlx::SqlitePool;
use std::fs;
use std::future::Future;
use std::pin::Pin;
use std::str::FromStr;
use tracing::{debug, info};

use crate::config::DbConfig;
use crate::error::{DbError, DbResult};

/// Type alias for a seeder function
///
/// The seeder is called after migrations complete and can be used
/// to seed default data into the database.
pub type Seeder = Box<
    dyn Fn(SqlitePool) -> Pin<Box<dyn Future<Output = DbResult<()>> + Send>> + Send + Sync,
>;

/// Initialize the SQLite database with default configuration.
///
/// This function:
/// 1. Creates the data directory if it doesn't exist
/// 2. Creates or opens the SQLite database file
/// 3. Runs pending migrations (if configured)
/// 4. Returns a connection pool
///
/// # Arguments
///
/// * `config` - Database configuration
///
/// # Returns
///
/// A `SqlitePool` for database connections, or an error if initialization fails.
///
/// # Example
///
/// ```ignore
/// use openflow_db::{DbConfig, init_db};
///
/// let config = DbConfig::from_path("/tmp/openflow.db");
/// let pool = init_db(config).await?;
/// ```
pub async fn init_db(config: DbConfig) -> DbResult<SqlitePool> {
    init_db_internal(config, None).await
}

/// Initialize the SQLite database with a seeder function.
///
/// This is useful for seeding default data after migrations,
/// such as default executor profiles.
///
/// # Arguments
///
/// * `config` - Database configuration
/// * `seeder` - Function to call after migrations for seeding data
///
/// # Example
///
/// ```ignore
/// use openflow_db::{DbConfig, init_db_with_seeder, DbResult};
///
/// let config = DbConfig::from_path("/tmp/openflow.db");
/// let pool = init_db_with_seeder(config, Box::new(|pool| {
///     Box::pin(async move {
///         // Seed default data here
///         sqlx::query("INSERT INTO settings (key, value) VALUES ('theme', 'dark')")
///             .execute(&pool)
///             .await?;
///         Ok(())
///     })
/// })).await?;
/// ```
pub async fn init_db_with_seeder(config: DbConfig, seeder: Seeder) -> DbResult<SqlitePool> {
    init_db_internal(config, Some(seeder)).await
}

/// Internal initialization function
async fn init_db_internal(config: DbConfig, seeder: Option<Seeder>) -> DbResult<SqlitePool> {
    // Ensure the parent directory exists
    if let Some(parent) = config.database_path.parent() {
        if !parent.exists() {
            debug!("Creating database directory: {:?}", parent);
            fs::create_dir_all(parent)?;
        }
    }

    let db_url = config.connection_url();
    debug!("Connecting to database: {}", db_url);

    // Configure connection options
    let connect_options = SqliteConnectOptions::from_str(&db_url)
        .map_err(|e| DbError::Config(e.to_string()))?
        .create_if_missing(config.create_if_missing)
        .journal_mode(sqlx::sqlite::SqliteJournalMode::Wal)
        .synchronous(sqlx::sqlite::SqliteSynchronous::Normal)
        .busy_timeout(config.busy_timeout);

    // Create the connection pool
    let pool = SqlitePoolOptions::new()
        .max_connections(config.max_connections)
        .min_connections(config.min_connections)
        .acquire_timeout(config.connect_timeout)
        .connect_with(connect_options)
        .await
        .map_err(|e| DbError::Connection(e.to_string()))?;

    info!("Connected to database: {:?}", config.database_path);

    // Run migrations if configured
    if config.run_migrations {
        debug!("Running database migrations");
        sqlx::migrate!("./migrations").run(&pool).await?;
        info!("Database migrations completed");
    }

    // Run seeder if provided
    if let Some(seeder) = seeder {
        debug!("Running database seeder");
        seeder(pool.clone()).await?;
        info!("Database seeding completed");
    }

    Ok(pool)
}

/// Create an in-memory database for testing
///
/// This creates a new SQLite database in memory with migrations applied.
/// Useful for unit tests that need an isolated database.
///
/// # Example
///
/// ```ignore
/// use openflow_db::create_test_db;
///
/// #[tokio::test]
/// async fn test_something() {
///     let pool = create_test_db().await.unwrap();
///     // Run tests with the pool
/// }
/// ```
#[cfg(any(test, feature = "test-utils"))]
pub async fn create_test_db() -> DbResult<SqlitePool> {
    let pool = SqlitePoolOptions::new()
        .max_connections(1)
        .connect("sqlite::memory:")
        .await
        .map_err(|e| DbError::Connection(e.to_string()))?;

    sqlx::migrate!("./migrations").run(&pool).await?;

    Ok(pool)
}

#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::tempdir;

    #[tokio::test]
    async fn test_init_db_creates_database() {
        let temp_dir = tempdir().expect("Failed to create temp dir");
        let config = DbConfig::from_directory(temp_dir.path());

        let result = init_db(config.clone()).await;
        assert!(result.is_ok(), "init_db should succeed: {:?}", result.err());

        assert!(
            config.database_path.exists(),
            "Database file should be created"
        );
    }

    #[tokio::test]
    async fn test_init_db_creates_nested_directories() {
        let temp_dir = tempdir().expect("Failed to create temp dir");
        let nested_path = temp_dir.path().join("nested").join("path");
        let config = DbConfig::from_directory(&nested_path);

        let result = init_db(config.clone()).await;
        assert!(
            result.is_ok(),
            "init_db should create nested directories: {:?}",
            result.err()
        );

        assert!(nested_path.exists(), "Nested directory should be created");
    }

    #[tokio::test]
    async fn test_init_db_with_seeder() {
        let temp_dir = tempdir().expect("Failed to create temp dir");
        let config = DbConfig::from_directory(temp_dir.path());

        let seeder: Seeder = Box::new(|pool| {
            Box::pin(async move {
                // Just verify we can query the database
                sqlx::query("SELECT 1")
                    .execute(&pool)
                    .await
                    .map_err(|e| DbError::Query(e.to_string()))?;
                Ok(())
            })
        });

        let result = init_db_with_seeder(config, seeder).await;
        assert!(
            result.is_ok(),
            "init_db_with_seeder should succeed: {:?}",
            result.err()
        );
    }

    #[tokio::test]
    async fn test_create_test_db() {
        let pool = create_test_db().await;
        assert!(pool.is_ok(), "create_test_db should succeed");

        let pool = pool.unwrap();

        // Verify we can query the database
        let result = sqlx::query("SELECT 1 as value")
            .fetch_one(&pool)
            .await;
        assert!(result.is_ok(), "Should be able to query test database");
    }
}
