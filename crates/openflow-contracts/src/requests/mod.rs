//! Request Types
//!
//! Request types for API operations. These define the shape of
//! data sent from frontend to backend for mutations.

pub mod chat;
pub mod executor;
pub mod message;
pub mod process;
pub mod project;
pub mod task;

// Re-export request types for convenience
pub use chat::{CreateChatRequest, UpdateChatRequest};
pub use executor::{
    CreateExecutorProfileRequest, RunExecutorRequest, SetDefaultExecutorProfileRequest,
    UpdateExecutorProfileRequest,
};
pub use message::{
    AppendMessageContentRequest, CreateMessageRequest, SetMessageStreamingRequest,
    UpdateMessageRequest,
};
pub use process::{
    CreateProcessRequest, KillProcessRequest, ListProcessesRequest, ResizeProcessRequest,
    SendProcessInputRequest, UpdateProcessRequest,
};
pub use project::{CreateProjectRequest, UpdateProjectRequest};
pub use task::{CreateTaskRequest, UpdateTaskRequest};

// Request modules will be added in subsequent steps:
// - git.rs (Step 0.9)
