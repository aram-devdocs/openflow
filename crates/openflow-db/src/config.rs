//! Database Configuration
//!
//! Provides flexible configuration for database initialization.
//! Supports:
//! - Direct file path configuration
//! - Environment variable configuration
//! - URL-based configuration
//!
//! # Environment Variables
//!
//! - `DATABASE_URL`: Full SQLite connection URL
//! - `DATABASE_PATH`: Path to the SQLite database file
//! - `OPENFLOW_DATA_DIR`: Directory for OpenFlow data files

use std::path::PathBuf;
use std::time::Duration;

/// Database configuration
#[derive(Debug, Clone)]
pub struct DbConfig {
    /// Path to the SQLite database file
    pub database_path: PathBuf,

    /// Maximum number of connections in the pool
    pub max_connections: u32,

    /// Minimum number of connections to maintain
    pub min_connections: u32,

    /// Connection timeout duration
    pub connect_timeout: Duration,

    /// Busy timeout for SQLite operations
    pub busy_timeout: Duration,

    /// Whether to create the database if it doesn't exist
    pub create_if_missing: bool,

    /// Whether to run migrations on startup
    pub run_migrations: bool,
}

impl Default for DbConfig {
    fn default() -> Self {
        Self {
            database_path: PathBuf::from("openflow.db"),
            max_connections: 5,
            min_connections: 1,
            connect_timeout: Duration::from_secs(30),
            busy_timeout: Duration::from_secs(30),
            create_if_missing: true,
            run_migrations: true,
        }
    }
}

impl DbConfig {
    /// Create configuration for a specific database file path
    ///
    /// # Arguments
    ///
    /// * `path` - Path to the SQLite database file
    ///
    /// # Example
    ///
    /// ```
    /// use openflow_db::DbConfig;
    ///
    /// let config = DbConfig::from_path("/var/lib/openflow/openflow.db");
    /// ```
    pub fn from_path<P: Into<PathBuf>>(path: P) -> Self {
        Self {
            database_path: path.into(),
            ..Default::default()
        }
    }

    /// Create configuration from a directory path
    ///
    /// The database file will be named "openflow.db" within the directory.
    ///
    /// # Arguments
    ///
    /// * `dir` - Directory to store the database file
    ///
    /// # Example
    ///
    /// ```
    /// use openflow_db::DbConfig;
    ///
    /// let config = DbConfig::from_directory("/var/lib/openflow");
    /// ```
    pub fn from_directory<P: Into<PathBuf>>(dir: P) -> Self {
        let path: PathBuf = dir.into();
        Self {
            database_path: path.join("openflow.db"),
            ..Default::default()
        }
    }

    /// Create configuration from environment variables
    ///
    /// Reads configuration from:
    /// - `DATABASE_URL` or `DATABASE_PATH` for the database location
    /// - `OPENFLOW_DATA_DIR` as an alternative directory path
    /// - `DATABASE_MAX_CONNECTIONS` for pool size (default: 5)
    ///
    /// # Example
    ///
    /// ```
    /// use openflow_db::DbConfig;
    ///
    /// // With DATABASE_PATH=/tmp/test.db
    /// let config = DbConfig::from_env();
    /// ```
    pub fn from_env() -> Self {
        let mut config = Self::default();

        // Check for database URL or path
        if let Ok(url) = std::env::var("DATABASE_URL") {
            // Parse SQLite URL (sqlite:/path/to/db.db)
            if let Some(path) = url.strip_prefix("sqlite:") {
                // Remove query parameters if present
                let path = path.split('?').next().unwrap_or(path);
                config.database_path = PathBuf::from(path);
            }
        } else if let Ok(path) = std::env::var("DATABASE_PATH") {
            config.database_path = PathBuf::from(path);
        } else if let Ok(dir) = std::env::var("OPENFLOW_DATA_DIR") {
            config.database_path = PathBuf::from(dir).join("openflow.db");
        }

        // Check for pool configuration
        if let Ok(max_conn) = std::env::var("DATABASE_MAX_CONNECTIONS") {
            if let Ok(n) = max_conn.parse() {
                config.max_connections = n;
            }
        }

        config
    }

    /// Get the SQLite connection URL
    ///
    /// Returns a URL in the format: `sqlite:/path/to/db?mode=rwc`
    pub fn connection_url(&self) -> String {
        format!(
            "sqlite:{}?mode={}",
            self.database_path.display(),
            if self.create_if_missing { "rwc" } else { "rw" }
        )
    }

    /// Set the maximum number of connections
    pub fn with_max_connections(mut self, n: u32) -> Self {
        self.max_connections = n;
        self
    }

    /// Set the minimum number of connections
    pub fn with_min_connections(mut self, n: u32) -> Self {
        self.min_connections = n;
        self
    }

    /// Set whether to run migrations on startup
    pub fn with_migrations(mut self, run: bool) -> Self {
        self.run_migrations = run;
        self
    }

    /// Set the busy timeout
    pub fn with_busy_timeout(mut self, timeout: Duration) -> Self {
        self.busy_timeout = timeout;
        self
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_from_path() {
        let config = DbConfig::from_path("/tmp/test.db");
        assert_eq!(config.database_path, PathBuf::from("/tmp/test.db"));
        assert_eq!(config.max_connections, 5);
        assert!(config.create_if_missing);
    }

    #[test]
    fn test_from_directory() {
        let config = DbConfig::from_directory("/var/lib/openflow");
        assert_eq!(
            config.database_path,
            PathBuf::from("/var/lib/openflow/openflow.db")
        );
    }

    #[test]
    fn test_connection_url() {
        let config = DbConfig::from_path("/tmp/test.db");
        assert_eq!(config.connection_url(), "sqlite:/tmp/test.db?mode=rwc");

        let config = DbConfig::from_path("/tmp/test.db").with_migrations(false);
        let mut config = config;
        config.create_if_missing = false;
        assert_eq!(config.connection_url(), "sqlite:/tmp/test.db?mode=rw");
    }

    #[test]
    fn test_builder_pattern() {
        let config = DbConfig::from_path("/tmp/test.db")
            .with_max_connections(10)
            .with_min_connections(2)
            .with_migrations(false);

        assert_eq!(config.max_connections, 10);
        assert_eq!(config.min_connections, 2);
        assert!(!config.run_migrations);
    }
}
