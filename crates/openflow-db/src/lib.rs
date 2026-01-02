//! OpenFlow Database Layer
//!
//! This crate provides database access and management for OpenFlow.
//! It handles:
//! - Database configuration and initialization
//! - Connection pool management
//! - Migration execution
//!
//! The crate is designed to work in both Tauri (desktop) and standalone
//! server contexts, with no Tauri-specific dependencies.
//!
//! # Example
//!
//! ```ignore
//! use openflow_db::{DbConfig, init_db};
//!
//! // Initialize from a file path
//! let config = DbConfig::from_path("/path/to/openflow.db");
//! let pool = init_db(config).await?;
//!
//! // Initialize from environment variables
//! let config = DbConfig::from_env();
//! let pool = init_db(config).await?;
//! ```

pub mod config;
pub mod error;
pub mod pool;

// Re-export commonly used items
pub use config::DbConfig;
pub use error::DbError;
pub use pool::{init_db, init_db_with_seeder};

// Re-export SqlitePool for convenience
pub use sqlx::SqlitePool;

// Re-export test utilities for use in other crates' tests
#[cfg(feature = "test-utils")]
pub use pool::create_test_db;
