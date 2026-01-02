//! OpenFlow Core Business Logic
//!
//! This crate provides core business logic and services for OpenFlow.
//! It is designed to be transport-agnostic, supporting both Tauri IPC
//! and HTTP/WebSocket backends.
//!
//! # Architecture
//!
//! The crate is organized into the following modules:
//!
//! - **services**: Business logic services (project, task, chat, etc.)
//! - **events**: Event broadcasting for real-time sync
//!
//! # Services
//!
//! Services are stateless functions that:
//! - Receive `&SqlitePool` as the first argument
//! - Return `Result<T, ServiceError>`
//! - Contain all business logic (no Tauri dependencies)
//! - Are called by thin command/route handlers
//!
//! # Example
//!
//! ```ignore
//! use openflow_core::services::{project, ServiceResult};
//! use openflow_contracts::CreateProjectRequest;
//!
//! async fn create_project(
//!     pool: &SqlitePool,
//!     request: CreateProjectRequest,
//! ) -> ServiceResult<Project> {
//!     project::create(pool, request).await
//! }
//! ```

pub mod events;
pub mod services;

// Re-export common types for convenience
pub use events::{Event, EventBroadcaster};
pub use services::{ServiceError, ServiceResult};
