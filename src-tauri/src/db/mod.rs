//! Database module for SQLite connection management.
//!
//! This module provides database initialization and connection pooling
//! using SQLx with SQLite as the backend.

pub mod pool;

pub use pool::init_db;
