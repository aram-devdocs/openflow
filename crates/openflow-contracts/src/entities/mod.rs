//! Domain Entities
//!
//! Core domain entities that represent the data model.
//! These are the primary data structures stored in the database
//! and transferred between frontend and backend.

pub mod chat;
pub mod message;
pub mod process;
pub mod project;
pub mod task;

// Re-export entity types for convenience
pub use chat::{Chat, ChatRole, ChatSummary, ChatWithMessageCount};
pub use message::{Message, MessageRole, MessageSummary};
pub use process::{
    ExecutionProcess, OutputType, ProcessOutputEvent, ProcessStatus, ProcessStatusEvent,
    ProcessSummary, RunReason,
};
pub use project::{Project, ProjectSummary, ProjectWithStats};
pub use task::{Task, TaskStatus, TaskSummary, TaskWithChatCount};

// Entity modules will be added in subsequent steps:
// - executor.rs (Step 0.8)
// - git.rs (Step 0.9)
// - workflow.rs (Step 0.10)
