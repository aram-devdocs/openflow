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
//! - **agent_orchestrator**: Agent process lifecycle and output handling
//! - **agent_session**: Agent session lifecycle and event persistence
//! - **artifact**: Task artifact file management
//! - **audit**: Action audit logging for compliance and debugging
//! - **project**: Project CRUD operations
//! - **task**: Task CRUD operations
//! - **task_executor**: Autonomous task execution engine
//! - **chat**: Chat session management
//! - **message**: Message CRUD operations
//! - **executor**: AI agent execution
//! - **executor_profile**: Executor profile management
//! - **process**: Process lifecycle management
//! - **git**: Git operations (worktree, diff, commits)
//! - **github**: GitHub integration (PR creation)
//! - **terminal**: Terminal session management
//! - **tool_state**: Tool execution lifecycle tracking
//! - **search**: Full-text search operations
//! - **settings**: Application settings
//! - **workflow**: Workflow template parsing and management
//! - **line_buffer**: Line buffering and ANSI stripping for PTY output
//! - **normalizer**: Event normalization to canonical format
//! - **permission_detector**: Permission prompt detection and tracking

mod error;

// Service modules
pub mod agent_orchestrator;
pub mod agent_service_bridge;
pub mod agent_session;
pub mod artifact;
pub mod audit;
pub mod chat;
pub mod executor;
pub mod executor_profile;
pub mod git;
pub mod github;
pub mod line_buffer;
pub mod message;
pub mod normalizer;
pub mod permission_detector;
pub mod process;
pub mod project;
pub mod search;
pub mod settings;
pub mod task;
pub mod task_executor;
pub mod terminal;
pub mod tool_state;
pub mod workflow;
pub mod worktree;

pub use agent_orchestrator::{AgentOrchestrator, AgentOutputSink, SpawnAgentRequest};
pub use agent_service_bridge::{AgentServiceBridge, AgentConfig as SdkAgentConfig, AgentEvent as SdkAgentEvent, PermissionRequest as SdkPermissionRequest};
pub use error::{ServiceError, ServiceResult};
pub use task_executor::TaskExecutor;
