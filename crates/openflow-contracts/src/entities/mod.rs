//! Domain Entities
//!
//! Core domain entities that represent the data model.
//! These are the primary data structures stored in the database
//! and transferred between frontend and backend.

pub mod artifact;
pub mod chat;
pub mod executor;
pub mod git;
pub mod message;
pub mod process;
pub mod project;
pub mod search;
pub mod settings;
pub mod task;
pub mod tool_state;
pub mod workflow;

// Re-export entity types for convenience
pub use artifact::ArtifactFile;
pub use chat::{Chat, ChatRole, ChatSummary, ChatWithMessageCount, ChatWithMessages};
pub use executor::{CliToolType, ExecutorProfile, ExecutorProfileSummary};
pub use git::{
    Branch, Commit, CommitSummary, DiffHunk, FileChangeType, FileDiff, FileDiffSummary,
    GitFileStatus, GitStatus, GitStatusFile, PullRequestResult, Worktree, WorktreeStatus,
    WorktreeSummary,
};
pub use message::{Message, MessageRole, MessageSummary};
pub use process::{
    ExecutionProcess, OutputType, ProcessOutputEvent, ProcessStatus, ProcessStatusEvent,
    ProcessSummary, RunReason,
};
pub use project::{Project, ProjectSummary, ProjectWithStats};
pub use search::{SearchResult, SearchResultType};
pub use settings::{Setting, SettingsMap};
pub use task::{
    StepStatus, Task, TaskStatus, TaskStep, TaskStepSummary, TaskSummary, TaskWithChatCount,
    TaskWithChats, TaskWithSteps,
};
pub use tool_state::{ToolState, ToolStatus};
pub use workflow::{
    WorkflowContext, WorkflowStep, WorkflowStepStatus, WorkflowTemplate, WorkflowTemplateSummary,
    WorkflowVariable,
};
