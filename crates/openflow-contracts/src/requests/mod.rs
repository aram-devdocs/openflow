//! Request Types
//!
//! Request types for API operations. These define the shape of
//! data sent from frontend to backend for mutations.

pub mod chat;
pub mod project;
pub mod task;

// Re-export request types for convenience
pub use chat::{CreateChatRequest, UpdateChatRequest};
pub use project::{CreateProjectRequest, UpdateProjectRequest};
pub use task::{CreateTaskRequest, UpdateTaskRequest};

// Request modules will be added in subsequent steps:
// - message.rs (Step 0.6)
// - process.rs (Step 0.7)
// - executor.rs (Step 0.8)
// - git.rs (Step 0.9)
