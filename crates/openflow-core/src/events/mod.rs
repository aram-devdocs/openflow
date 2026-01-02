//! Event Broadcasting for Real-Time Synchronization
//!
//! This module provides the event system for real-time data sync
//! between multiple clients (Tauri app, web browsers, etc.).
//!
//! # Architecture
//!
//! Events are broadcast through an `EventBroadcaster` trait that can be
//! implemented differently for each transport:
//!
//! - **Tauri**: Uses `AppHandle::emit()` for IPC events
//! - **HTTP/WS**: Uses WebSocket for browser clients
//! - **Channel**: Uses tokio broadcast channels for internal use
//!
//! # Event Types
//!
//! - `ProcessOutput`: Streaming output from running processes
//! - `ProcessStatus`: Process status changes
//! - `DataChanged`: CRUD operations on entities for cache invalidation
//!
//! # Example
//!
//! ```ignore
//! use openflow_core::events::{Event, EventBroadcaster};
//!
//! fn emit_project_created(broadcaster: &dyn EventBroadcaster, project: &Project) {
//!     broadcaster.broadcast(Event::DataChanged {
//!         entity: EntityType::Project,
//!         action: DataAction::Created,
//!         id: project.id.clone(),
//!         data: Some(serde_json::to_value(project).unwrap()),
//!     });
//! }
//! ```

mod broadcaster;
mod types;

pub use broadcaster::{ChannelBroadcaster, EventBroadcaster, NullBroadcaster};
pub use types::{DataAction, EntityType, Event, OutputType, ProcessStatus};
