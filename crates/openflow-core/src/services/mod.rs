//! Business logic services for OpenFlow.
//!
//! Services encapsulate all business logic and database operations.
//! They are stateless functions that take dependencies as arguments
//! and return Results.
//!
//! # Pattern
//!
//! - Services receive `&SqlitePool` as first argument
//! - Services return `Result<T, ServiceError>`
//! - Services are called by thin command handlers (Tauri) or route handlers (HTTP)
//! - Services have NO transport dependencies (no Tauri, no Axum)
//!
//! # Available Services
//!
//! - **artifact**: Task artifact file management
//! - **project**: Project CRUD operations
//! - **task**: Task CRUD operations
//! - **chat**: Chat session management
//! - **message**: Message CRUD operations
//! - **executor**: AI agent execution
//! - **executor_profile**: Executor profile management
//! - **process**: Process lifecycle management
//! - **git**: Git operations (worktree, diff, commits)
//! - **github**: GitHub integration (PR creation)
//! - **terminal**: Terminal session management
//! - **search**: Full-text search operations
//! - **settings**: Application settings
//! - **workflow**: Workflow template parsing and management

mod error;

// Service modules
pub mod artifact;
pub mod chat;
pub mod executor;
pub mod executor_profile;
pub mod git;
pub mod github;
pub mod message;
pub mod process;
pub mod project;
pub mod search;
pub mod settings;
pub mod task;
pub mod terminal;
pub mod workflow;

pub use error::{ServiceError, ServiceResult};
