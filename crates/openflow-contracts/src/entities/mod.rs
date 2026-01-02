//! Domain Entities
//!
//! Core domain entities that represent the data model.
//! These are the primary data structures stored in the database
//! and transferred between frontend and backend.

pub mod project;
pub mod task;

// Re-export entity types for convenience
pub use project::{Project, ProjectSummary, ProjectWithStats};
pub use task::{Task, TaskStatus, TaskSummary, TaskWithChatCount};

// Entity modules will be added in subsequent steps:
// - chat.rs (Step 0.5)
// - message.rs (Step 0.6)
// - process.rs (Step 0.7)
// - executor.rs (Step 0.8)
// - git.rs (Step 0.9)
// - workflow.rs (Step 0.10)
