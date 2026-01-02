//! Request Types
//!
//! Request types for API operations. These define the shape of
//! data sent from frontend to backend for mutations.

pub mod chat;
pub mod executor;
pub mod git;
pub mod message;
pub mod process;
pub mod project;
pub mod search;
pub mod settings;
pub mod task;
pub mod terminal;
pub mod workflow;

// Re-export request types for convenience
pub use chat::{CreateChatRequest, UpdateChatRequest};
pub use executor::{
    CreateExecutorProfileRequest, RunExecutorRequest, SetDefaultExecutorProfileRequest,
    UpdateExecutorProfileRequest,
};
pub use git::{
    CreatePullRequestRequest, CreateWorktreeRequest, DeleteWorktreeRequest,
    GenerateBranchNameRequest, GenerateWorktreePathRequest, GetCommitsRequest,
    GetCurrentBranchRequest, GetDiffRequest, GetHeadCommitRequest, GetTaskCommitsRequest,
    GetTaskDiffRequest, HasUncommittedChangesRequest, ListWorktreesRequest, PushBranchRequest,
};
pub use message::{
    AppendMessageContentRequest, CreateMessageRequest, SetMessageStreamingRequest,
    UpdateMessageRequest,
};
pub use process::{
    CreateProcessRequest, KillProcessRequest, ListProcessesRequest, ResizeProcessRequest,
    SendProcessInputRequest, StartProcessRequest, UpdateProcessRequest,
};
pub use project::{CreateProjectRequest, UpdateProjectRequest};
pub use search::SearchRequest;
pub use settings::{
    DeleteAllSettingsRequest, DeleteAllSettingsResponse, DeleteSettingRequest,
    GetAllSettingsRequest, GetSettingOrDefaultRequest, GetSettingRequest, SetSettingRequest,
    SettingExistsRequest, SettingExistsResponse,
};
pub use task::{CreateTaskRequest, UpdateTaskRequest};
pub use terminal::{DefaultShellResponse, GetDefaultShellRequest, SpawnTerminalRequest};
pub use workflow::{
    ApplyWorkflowToTaskRequest, CreateWorkflowTemplateRequest, DeleteWorkflowTemplateRequest,
    GetWorkflowTemplateRequest, ListWorkflowTemplatesRequest, ParseWorkflowRequest,
    SubstituteWorkflowVariablesRequest, UpdateWorkflowStepRequest, UpdateWorkflowTemplateRequest,
};
