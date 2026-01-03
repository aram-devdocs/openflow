//! OpenFlow API Contracts
//!
//! This crate defines all API types and contracts as the single source of truth.
//! Code generators read these definitions to produce:
//! - TypeScript types (via typeshare)
//! - Zod validation schemas
//! - TypeScript query functions
//! - Axum route handlers
//! - Tauri command handlers
//!
//! # Architecture
//!
//! ```text
//! ┌─────────────────────────────────────────────────────────────────────────┐
//! │                    openflow-contracts (this crate)                       │
//! ├─────────────────────────────────────────────────────────────────────────┤
//! │  entities/    - Domain entities (Project, Task, Chat, etc.)             │
//! │  requests/    - Request types (CreateProjectRequest, etc.)              │
//! │  responses/   - Response types and API responses                        │
//! │  events/      - WebSocket/Tauri event types                             │
//! │  validation/  - Validation attribute definitions                        │
//! │  endpoints/   - Endpoint metadata definitions                           │
//! └─────────────────────────────────────────────────────────────────────────┘
//! ```
//!
//! # Usage
//!
//! This crate contains NO business logic, only type definitions and metadata.
//! All other crates depend on this for type definitions.

pub mod endpoints;
pub mod entities;
pub mod events;
pub mod requests;
pub mod responses;
pub mod validation;

// Re-export commonly used types for convenience
// Entity types
pub use entities::ArtifactFile;
pub use entities::{
    Branch, Commit, CommitSummary, DiffHunk, FileChangeType, FileDiff, FileDiffSummary,
    GitFileStatus, GitStatus, GitStatusFile, PullRequestResult, Worktree, WorktreeStatus,
    WorktreeSummary,
};
pub use entities::{Chat, ChatRole, ChatSummary, ChatWithMessageCount, ChatWithMessages};
pub use entities::{CliToolType, ExecutorProfile, ExecutorProfileSummary};
pub use entities::{
    ExecutionProcess, OutputType, ProcessOutputEvent, ProcessStatus, ProcessStatusEvent,
    ProcessSummary, RunReason,
};
pub use entities::{Message, MessageRole, MessageSummary};
pub use entities::{Project, ProjectSummary, ProjectWithStats};
pub use entities::{SearchResult, SearchResultType};
pub use entities::{Setting, SettingsMap};
pub use entities::{Task, TaskStatus, TaskSummary, TaskWithChatCount, TaskWithChats};
pub use entities::{
    WorkflowContext, WorkflowStep, WorkflowStepStatus, WorkflowTemplate, WorkflowTemplateSummary,
    WorkflowVariable,
};
// Request types
pub use requests::SearchRequest;
pub use requests::{
    AppendMessageContentRequest, CreateMessageRequest, SetMessageStreamingRequest,
    UpdateMessageRequest,
};
pub use requests::{
    ApplyWorkflowToTaskRequest, CreateWorkflowTemplateRequest, DeleteWorkflowTemplateRequest,
    GetWorkflowTemplateRequest, ListWorkflowTemplatesRequest, ParseWorkflowRequest,
    SubstituteWorkflowVariablesRequest, UpdateWorkflowStepRequest, UpdateWorkflowTemplateRequest,
};
pub use requests::{CreateChatRequest, UpdateChatRequest};
pub use requests::{
    CreateExecutorProfileRequest, RunExecutorRequest, SetDefaultExecutorProfileRequest,
    UpdateExecutorProfileRequest,
};
pub use requests::{
    CreateProcessRequest, KillProcessRequest, ListProcessesRequest, ResizeProcessRequest,
    SendProcessInputRequest, StartProcessRequest, UpdateProcessRequest,
};
pub use requests::{CreateProjectRequest, UpdateProjectRequest};
pub use requests::{
    CreatePullRequestRequest, CreateWorktreeRequest, DeleteWorktreeRequest,
    GenerateBranchNameRequest, GenerateWorktreePathRequest, GetCommitsRequest,
    GetCurrentBranchRequest, GetDiffRequest, GetHeadCommitRequest, GetTaskCommitsRequest,
    GetTaskDiffRequest, HasUncommittedChangesRequest, ListWorktreesRequest, PushBranchRequest,
};
pub use requests::{CreateTaskRequest, UpdateTaskRequest};
pub use requests::{DefaultShellResponse, GetDefaultShellRequest, SpawnTerminalRequest};
pub use requests::{
    DeleteAllSettingsRequest, DeleteAllSettingsResponse, DeleteSettingRequest,
    GetAllSettingsRequest, GetSettingOrDefaultRequest, GetSettingRequest, SetSettingRequest,
    SettingExistsRequest, SettingExistsResponse,
};
// Event types
pub use events::{
    parse_process_output_channel, parse_process_status_channel, process_output_channel,
    process_status_channel,
};
pub use events::{
    DataAction, DataChangedEvent, EntityType, Event, WsClientMessage, WsServerMessage,
};
pub use events::{
    CHANNEL_DATA_CHANGED, CHANNEL_PROCESS_OUTPUT_FMT, CHANNEL_PROCESS_STATUS_FMT, CHANNEL_WILDCARD,
};
// Response types
pub use responses::{AuthStatusResponse, CliInstalledResponse};
// Endpoint metadata
pub use endpoints::{endpoint_count, endpoints_by_domain, Endpoint, HttpMethod, ENDPOINTS};
pub use endpoints::{validate_unique_commands, validate_unique_path_methods};
// Validation module is accessible via openflow_contracts::validation::
