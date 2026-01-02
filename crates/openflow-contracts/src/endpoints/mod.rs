//! API Endpoint Definitions
//!
//! Metadata for code generation of:
//! - Axum route handlers
//! - Tauri command handlers
//! - TypeScript query functions
//! - Command-to-endpoint mapping
//!
//! # Architecture
//!
//! Each endpoint is defined once and maps to:
//! 1. A Tauri IPC command name (e.g., `create_project`)
//! 2. An HTTP REST endpoint (e.g., `POST /api/projects`)
//! 3. A TypeScript query function (generated)
//!
//! # Example
//!
//! ```rust
//! use openflow_contracts::endpoints::{Endpoint, HttpMethod};
//!
//! // Get an endpoint by command name
//! let endpoint = Endpoint::by_command("create_project");
//! assert!(endpoint.is_some());
//!
//! // Get endpoint details
//! let ep = endpoint.unwrap();
//! assert_eq!(ep.method, HttpMethod::Post);
//! assert_eq!(ep.path, "/api/projects");
//! ```

use serde::{Deserialize, Serialize};

/// HTTP method for REST endpoints
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
#[serde(rename_all = "UPPERCASE")]
pub enum HttpMethod {
    Get,
    Post,
    Patch,
    Put,
    Delete,
}

impl HttpMethod {
    /// Returns the HTTP method as a string
    pub fn as_str(&self) -> &'static str {
        match self {
            HttpMethod::Get => "GET",
            HttpMethod::Post => "POST",
            HttpMethod::Patch => "PATCH",
            HttpMethod::Put => "PUT",
            HttpMethod::Delete => "DELETE",
        }
    }
}

impl std::fmt::Display for HttpMethod {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "{}", self.as_str())
    }
}

/// API endpoint definition
///
/// Represents a single API endpoint that can be accessed via:
/// - Tauri IPC command
/// - HTTP REST endpoint
/// - Generated TypeScript query function
#[derive(Debug, Clone)]
pub struct Endpoint {
    /// Tauri command name (e.g., "create_project")
    pub command: &'static str,
    /// HTTP method
    pub method: HttpMethod,
    /// HTTP path (e.g., "/api/projects")
    /// Path parameters use `:name` format (e.g., "/api/projects/:id")
    pub path: &'static str,
    /// Request type name (e.g., "CreateProjectRequest")
    /// None for endpoints that take no body (GET, DELETE without body)
    pub request_type: Option<&'static str>,
    /// Response type name (e.g., "Project")
    /// "void" for endpoints that return nothing
    pub response_type: &'static str,
    /// Path parameter names (e.g., ["id"])
    pub path_params: &'static [&'static str],
    /// Query parameter names (e.g., ["projectId", "archived"])
    pub query_params: &'static [&'static str],
    /// Human-readable description
    pub description: &'static str,
    /// Tags for grouping (e.g., ["projects", "crud"])
    pub tags: &'static [&'static str],
}

impl Endpoint {
    /// Find an endpoint by its Tauri command name
    pub fn by_command(command: &str) -> Option<&'static Endpoint> {
        ENDPOINTS.iter().find(|e| e.command == command)
    }

    /// Find endpoints by path (may return multiple for different methods)
    pub fn by_path(path: &str) -> Vec<&'static Endpoint> {
        ENDPOINTS.iter().filter(|e| e.path == path).collect()
    }

    /// Find endpoints by tag
    pub fn by_tag(tag: &str) -> Vec<&'static Endpoint> {
        ENDPOINTS
            .iter()
            .filter(|e| e.tags.contains(&tag))
            .collect()
    }

    /// Get all endpoints
    pub fn all() -> &'static [Endpoint] {
        ENDPOINTS
    }

    /// Check if this endpoint has path parameters
    pub fn has_path_params(&self) -> bool {
        !self.path_params.is_empty()
    }

    /// Check if this endpoint has query parameters
    pub fn has_query_params(&self) -> bool {
        !self.query_params.is_empty()
    }

    /// Check if this endpoint has a request body
    pub fn has_request_body(&self) -> bool {
        self.request_type.is_some()
    }

    /// Check if this endpoint returns data
    pub fn has_response(&self) -> bool {
        self.response_type != "void"
    }

    /// Build the path with parameter substitution
    ///
    /// # Example
    /// ```rust
    /// use openflow_contracts::endpoints::Endpoint;
    /// use std::collections::HashMap;
    ///
    /// let ep = Endpoint::by_command("get_project").unwrap();
    /// let mut params = HashMap::new();
    /// params.insert("id", "abc123");
    /// let path = ep.build_path(&params);
    /// assert_eq!(path, "/api/projects/abc123");
    /// ```
    pub fn build_path(&self, params: &std::collections::HashMap<&str, &str>) -> String {
        let mut path = self.path.to_string();
        for param in self.path_params {
            if let Some(value) = params.get(param) {
                path = path.replace(&format!(":{}", param), value);
            }
        }
        path
    }
}

// ============================================================================
// ENDPOINT DEFINITIONS
// ============================================================================

/// All API endpoints
pub static ENDPOINTS: &[Endpoint] = &[
    // ==========================================================================
    // PROJECTS
    // ==========================================================================
    Endpoint {
        command: "list_projects",
        method: HttpMethod::Get,
        path: "/api/projects",
        request_type: None,
        response_type: "Project[]",
        path_params: &[],
        query_params: &[],
        description: "List all active projects",
        tags: &["projects", "list"],
    },
    Endpoint {
        command: "list_archived_projects",
        method: HttpMethod::Get,
        path: "/api/projects/archived",
        request_type: None,
        response_type: "Project[]",
        path_params: &[],
        query_params: &[],
        description: "List all archived projects",
        tags: &["projects", "list", "archived"],
    },
    Endpoint {
        command: "get_project",
        method: HttpMethod::Get,
        path: "/api/projects/:id",
        request_type: None,
        response_type: "Project",
        path_params: &["id"],
        query_params: &[],
        description: "Get a project by ID",
        tags: &["projects", "read"],
    },
    Endpoint {
        command: "create_project",
        method: HttpMethod::Post,
        path: "/api/projects",
        request_type: Some("CreateProjectRequest"),
        response_type: "Project",
        path_params: &[],
        query_params: &[],
        description: "Create a new project",
        tags: &["projects", "create"],
    },
    Endpoint {
        command: "update_project",
        method: HttpMethod::Patch,
        path: "/api/projects/:id",
        request_type: Some("UpdateProjectRequest"),
        response_type: "Project",
        path_params: &["id"],
        query_params: &[],
        description: "Update an existing project",
        tags: &["projects", "update"],
    },
    Endpoint {
        command: "delete_project",
        method: HttpMethod::Delete,
        path: "/api/projects/:id",
        request_type: None,
        response_type: "void",
        path_params: &["id"],
        query_params: &[],
        description: "Delete a project permanently",
        tags: &["projects", "delete"],
    },
    Endpoint {
        command: "archive_project",
        method: HttpMethod::Post,
        path: "/api/projects/:id/archive",
        request_type: None,
        response_type: "Project",
        path_params: &["id"],
        query_params: &[],
        description: "Archive a project (soft delete)",
        tags: &["projects", "archive"],
    },
    Endpoint {
        command: "unarchive_project",
        method: HttpMethod::Post,
        path: "/api/projects/:id/unarchive",
        request_type: None,
        response_type: "Project",
        path_params: &["id"],
        query_params: &[],
        description: "Unarchive a project",
        tags: &["projects", "archive"],
    },
    // ==========================================================================
    // TASKS
    // ==========================================================================
    Endpoint {
        command: "list_tasks",
        method: HttpMethod::Get,
        path: "/api/tasks",
        request_type: None,
        response_type: "Task[]",
        path_params: &[],
        query_params: &["projectId", "includeArchived"],
        description: "List tasks, optionally filtered by project",
        tags: &["tasks", "list"],
    },
    Endpoint {
        command: "get_task",
        method: HttpMethod::Get,
        path: "/api/tasks/:id",
        request_type: None,
        response_type: "TaskWithChats",
        path_params: &["id"],
        query_params: &[],
        description: "Get a task by ID with its chats",
        tags: &["tasks", "read"],
    },
    Endpoint {
        command: "create_task",
        method: HttpMethod::Post,
        path: "/api/tasks",
        request_type: Some("CreateTaskRequest"),
        response_type: "Task",
        path_params: &[],
        query_params: &[],
        description: "Create a new task",
        tags: &["tasks", "create"],
    },
    Endpoint {
        command: "update_task",
        method: HttpMethod::Patch,
        path: "/api/tasks/:id",
        request_type: Some("UpdateTaskRequest"),
        response_type: "Task",
        path_params: &["id"],
        query_params: &[],
        description: "Update an existing task",
        tags: &["tasks", "update"],
    },
    Endpoint {
        command: "delete_task",
        method: HttpMethod::Delete,
        path: "/api/tasks/:id",
        request_type: None,
        response_type: "void",
        path_params: &["id"],
        query_params: &[],
        description: "Delete a task permanently",
        tags: &["tasks", "delete"],
    },
    Endpoint {
        command: "archive_task",
        method: HttpMethod::Post,
        path: "/api/tasks/:id/archive",
        request_type: None,
        response_type: "Task",
        path_params: &["id"],
        query_params: &[],
        description: "Archive a task (soft delete)",
        tags: &["tasks", "archive"],
    },
    Endpoint {
        command: "unarchive_task",
        method: HttpMethod::Post,
        path: "/api/tasks/:id/unarchive",
        request_type: None,
        response_type: "Task",
        path_params: &["id"],
        query_params: &[],
        description: "Unarchive a task",
        tags: &["tasks", "archive"],
    },
    Endpoint {
        command: "duplicate_task",
        method: HttpMethod::Post,
        path: "/api/tasks/:id/duplicate",
        request_type: None,
        response_type: "Task",
        path_params: &["id"],
        query_params: &[],
        description: "Duplicate a task",
        tags: &["tasks", "duplicate"],
    },
    // ==========================================================================
    // CHATS
    // ==========================================================================
    Endpoint {
        command: "list_chats",
        method: HttpMethod::Get,
        path: "/api/chats",
        request_type: None,
        response_type: "Chat[]",
        path_params: &[],
        query_params: &["taskId"],
        description: "List chats for a task",
        tags: &["chats", "list"],
    },
    Endpoint {
        command: "list_standalone_chats",
        method: HttpMethod::Get,
        path: "/api/chats/standalone",
        request_type: None,
        response_type: "Chat[]",
        path_params: &[],
        query_params: &["projectId"],
        description: "List standalone chats (not attached to tasks)",
        tags: &["chats", "list"],
    },
    Endpoint {
        command: "list_chats_by_project",
        method: HttpMethod::Get,
        path: "/api/projects/:project_id/chats",
        request_type: None,
        response_type: "Chat[]",
        path_params: &["project_id"],
        query_params: &[],
        description: "List all chats in a project",
        tags: &["chats", "list"],
    },
    Endpoint {
        command: "list_archived_chats",
        method: HttpMethod::Get,
        path: "/api/chats/archived",
        request_type: None,
        response_type: "Chat[]",
        path_params: &[],
        query_params: &[],
        description: "List all archived chats",
        tags: &["chats", "list", "archived"],
    },
    Endpoint {
        command: "get_chat",
        method: HttpMethod::Get,
        path: "/api/chats/:id",
        request_type: None,
        response_type: "ChatWithMessages",
        path_params: &["id"],
        query_params: &[],
        description: "Get a chat by ID with its messages",
        tags: &["chats", "read"],
    },
    Endpoint {
        command: "create_chat",
        method: HttpMethod::Post,
        path: "/api/chats",
        request_type: Some("CreateChatRequest"),
        response_type: "Chat",
        path_params: &[],
        query_params: &[],
        description: "Create a new chat",
        tags: &["chats", "create"],
    },
    Endpoint {
        command: "update_chat",
        method: HttpMethod::Patch,
        path: "/api/chats/:id",
        request_type: Some("UpdateChatRequest"),
        response_type: "Chat",
        path_params: &["id"],
        query_params: &[],
        description: "Update an existing chat",
        tags: &["chats", "update"],
    },
    Endpoint {
        command: "delete_chat",
        method: HttpMethod::Delete,
        path: "/api/chats/:id",
        request_type: None,
        response_type: "void",
        path_params: &["id"],
        query_params: &[],
        description: "Delete a chat permanently",
        tags: &["chats", "delete"],
    },
    Endpoint {
        command: "archive_chat",
        method: HttpMethod::Post,
        path: "/api/chats/:id/archive",
        request_type: None,
        response_type: "Chat",
        path_params: &["id"],
        query_params: &[],
        description: "Archive a chat (soft delete)",
        tags: &["chats", "archive"],
    },
    Endpoint {
        command: "unarchive_chat",
        method: HttpMethod::Post,
        path: "/api/chats/:id/unarchive",
        request_type: None,
        response_type: "Chat",
        path_params: &["id"],
        query_params: &[],
        description: "Unarchive a chat",
        tags: &["chats", "archive"],
    },
    Endpoint {
        command: "toggle_step_complete",
        method: HttpMethod::Post,
        path: "/api/chats/:id/toggle-step",
        request_type: None,
        response_type: "Chat",
        path_params: &["id"],
        query_params: &[],
        description: "Toggle completion status of a workflow step chat",
        tags: &["chats", "workflow"],
    },
    Endpoint {
        command: "start_workflow_step",
        method: HttpMethod::Post,
        path: "/api/chats/:id/start-step",
        request_type: None,
        response_type: "Chat",
        path_params: &["id"],
        query_params: &[],
        description: "Start a workflow step by creating its worktree",
        tags: &["chats", "workflow"],
    },
    // ==========================================================================
    // MESSAGES
    // ==========================================================================
    Endpoint {
        command: "list_messages",
        method: HttpMethod::Get,
        path: "/api/messages",
        request_type: None,
        response_type: "Message[]",
        path_params: &[],
        query_params: &["chatId"],
        description: "List messages for a chat",
        tags: &["messages", "list"],
    },
    Endpoint {
        command: "get_message",
        method: HttpMethod::Get,
        path: "/api/messages/:id",
        request_type: None,
        response_type: "Message",
        path_params: &["id"],
        query_params: &[],
        description: "Get a message by ID",
        tags: &["messages", "read"],
    },
    Endpoint {
        command: "create_message",
        method: HttpMethod::Post,
        path: "/api/messages",
        request_type: Some("CreateMessageRequest"),
        response_type: "Message",
        path_params: &[],
        query_params: &[],
        description: "Create a new message",
        tags: &["messages", "create"],
    },
    Endpoint {
        command: "delete_message",
        method: HttpMethod::Delete,
        path: "/api/messages/:id",
        request_type: None,
        response_type: "void",
        path_params: &["id"],
        query_params: &[],
        description: "Delete a message",
        tags: &["messages", "delete"],
    },
    Endpoint {
        command: "set_message_streaming",
        method: HttpMethod::Patch,
        path: "/api/messages/:id/streaming",
        request_type: Some("SetMessageStreamingRequest"),
        response_type: "Message",
        path_params: &["id"],
        query_params: &[],
        description: "Set streaming status of a message",
        tags: &["messages", "update", "streaming"],
    },
    Endpoint {
        command: "append_message_content",
        method: HttpMethod::Post,
        path: "/api/messages/:id/append",
        request_type: Some("AppendMessageContentRequest"),
        response_type: "Message",
        path_params: &["id"],
        query_params: &[],
        description: "Append content to a message (for streaming)",
        tags: &["messages", "update", "streaming"],
    },
    Endpoint {
        command: "set_message_tokens",
        method: HttpMethod::Patch,
        path: "/api/messages/:id/tokens",
        request_type: None,
        response_type: "Message",
        path_params: &["id"],
        query_params: &["inputTokens", "outputTokens"],
        description: "Set token counts for a message",
        tags: &["messages", "update"],
    },
    // ==========================================================================
    // PROCESSES
    // ==========================================================================
    Endpoint {
        command: "list_processes",
        method: HttpMethod::Get,
        path: "/api/processes",
        request_type: None,
        response_type: "ExecutionProcess[]",
        path_params: &[],
        query_params: &["chatId"],
        description: "List processes, optionally filtered by chat",
        tags: &["processes", "list"],
    },
    Endpoint {
        command: "list_running_processes",
        method: HttpMethod::Get,
        path: "/api/processes/running",
        request_type: None,
        response_type: "ExecutionProcess[]",
        path_params: &[],
        query_params: &[],
        description: "List all running processes",
        tags: &["processes", "list"],
    },
    Endpoint {
        command: "get_process",
        method: HttpMethod::Get,
        path: "/api/processes/:id",
        request_type: None,
        response_type: "ExecutionProcess",
        path_params: &["id"],
        query_params: &[],
        description: "Get a process by ID",
        tags: &["processes", "read"],
    },
    Endpoint {
        command: "kill_process",
        method: HttpMethod::Post,
        path: "/api/processes/:id/kill",
        request_type: None,
        response_type: "void",
        path_params: &["id"],
        query_params: &[],
        description: "Kill a running process",
        tags: &["processes", "control"],
    },
    Endpoint {
        command: "send_process_input",
        method: HttpMethod::Post,
        path: "/api/processes/:id/input",
        request_type: Some("SendProcessInputRequest"),
        response_type: "void",
        path_params: &["id"],
        query_params: &[],
        description: "Send input to a process stdin",
        tags: &["processes", "control"],
    },
    Endpoint {
        command: "resize_process",
        method: HttpMethod::Post,
        path: "/api/processes/:id/resize",
        request_type: Some("ResizeProcessRequest"),
        response_type: "void",
        path_params: &["id"],
        query_params: &[],
        description: "Resize process PTY dimensions",
        tags: &["processes", "control"],
    },
    Endpoint {
        command: "is_process_running",
        method: HttpMethod::Get,
        path: "/api/processes/:id/running",
        request_type: None,
        response_type: "boolean",
        path_params: &["id"],
        query_params: &[],
        description: "Check if a process is running",
        tags: &["processes", "status"],
    },
    Endpoint {
        command: "running_process_count",
        method: HttpMethod::Get,
        path: "/api/processes/count/running",
        request_type: None,
        response_type: "number",
        path_params: &[],
        query_params: &[],
        description: "Get count of running processes",
        tags: &["processes", "status"],
    },
    // ==========================================================================
    // EXECUTOR PROFILES
    // ==========================================================================
    Endpoint {
        command: "list_executor_profiles",
        method: HttpMethod::Get,
        path: "/api/executor-profiles",
        request_type: None,
        response_type: "ExecutorProfile[]",
        path_params: &[],
        query_params: &[],
        description: "List all executor profiles",
        tags: &["executor", "profiles", "list"],
    },
    Endpoint {
        command: "get_executor_profile",
        method: HttpMethod::Get,
        path: "/api/executor-profiles/:id",
        request_type: None,
        response_type: "ExecutorProfile",
        path_params: &["id"],
        query_params: &[],
        description: "Get an executor profile by ID",
        tags: &["executor", "profiles", "read"],
    },
    Endpoint {
        command: "get_default_executor_profile",
        method: HttpMethod::Get,
        path: "/api/executor-profiles/default",
        request_type: None,
        response_type: "ExecutorProfile",
        path_params: &[],
        query_params: &[],
        description: "Get the default executor profile",
        tags: &["executor", "profiles", "read"],
    },
    Endpoint {
        command: "create_executor_profile",
        method: HttpMethod::Post,
        path: "/api/executor-profiles",
        request_type: Some("CreateExecutorProfileRequest"),
        response_type: "ExecutorProfile",
        path_params: &[],
        query_params: &[],
        description: "Create a new executor profile",
        tags: &["executor", "profiles", "create"],
    },
    Endpoint {
        command: "update_executor_profile",
        method: HttpMethod::Patch,
        path: "/api/executor-profiles/:id",
        request_type: Some("UpdateExecutorProfileRequest"),
        response_type: "ExecutorProfile",
        path_params: &["id"],
        query_params: &[],
        description: "Update an executor profile",
        tags: &["executor", "profiles", "update"],
    },
    Endpoint {
        command: "delete_executor_profile",
        method: HttpMethod::Delete,
        path: "/api/executor-profiles/:id",
        request_type: None,
        response_type: "void",
        path_params: &["id"],
        query_params: &[],
        description: "Delete an executor profile",
        tags: &["executor", "profiles", "delete"],
    },
    Endpoint {
        command: "run_executor",
        method: HttpMethod::Post,
        path: "/api/executor/run",
        request_type: Some("RunExecutorRequest"),
        response_type: "ExecutionProcess",
        path_params: &[],
        query_params: &[],
        description: "Run an AI executor in a chat",
        tags: &["executor", "run"],
    },
    // ==========================================================================
    // TERMINAL
    // ==========================================================================
    Endpoint {
        command: "spawn_terminal",
        method: HttpMethod::Post,
        path: "/api/terminal/spawn",
        request_type: None,
        response_type: "ExecutionProcess",
        path_params: &[],
        query_params: &["chatId", "workingDir"],
        description: "Spawn a new terminal session",
        tags: &["terminal", "spawn"],
    },
    // ==========================================================================
    // SETTINGS
    // ==========================================================================
    Endpoint {
        command: "get_all_settings",
        method: HttpMethod::Get,
        path: "/api/settings",
        request_type: None,
        response_type: "Setting[]",
        path_params: &[],
        query_params: &[],
        description: "Get all settings",
        tags: &["settings", "list"],
    },
    Endpoint {
        command: "get_setting",
        method: HttpMethod::Get,
        path: "/api/settings/:key",
        request_type: None,
        response_type: "Setting",
        path_params: &["key"],
        query_params: &[],
        description: "Get a setting by key",
        tags: &["settings", "read"],
    },
    Endpoint {
        command: "get_setting_or_default",
        method: HttpMethod::Get,
        path: "/api/settings/:key/default",
        request_type: None,
        response_type: "string",
        path_params: &["key"],
        query_params: &["defaultValue"],
        description: "Get a setting value or return default",
        tags: &["settings", "read"],
    },
    Endpoint {
        command: "set_setting",
        method: HttpMethod::Put,
        path: "/api/settings/:key",
        request_type: None,
        response_type: "Setting",
        path_params: &["key"],
        query_params: &["value"],
        description: "Set a setting value",
        tags: &["settings", "update"],
    },
    Endpoint {
        command: "delete_setting",
        method: HttpMethod::Delete,
        path: "/api/settings/:key",
        request_type: None,
        response_type: "void",
        path_params: &["key"],
        query_params: &[],
        description: "Delete a setting",
        tags: &["settings", "delete"],
    },
    Endpoint {
        command: "setting_exists",
        method: HttpMethod::Get,
        path: "/api/settings/:key/exists",
        request_type: None,
        response_type: "boolean",
        path_params: &["key"],
        query_params: &[],
        description: "Check if a setting exists",
        tags: &["settings", "read"],
    },
    // ==========================================================================
    // GIT
    // ==========================================================================
    Endpoint {
        command: "list_worktrees",
        method: HttpMethod::Get,
        path: "/api/git/worktrees",
        request_type: None,
        response_type: "Worktree[]",
        path_params: &[],
        query_params: &["repoPath"],
        description: "List git worktrees for a repository",
        tags: &["git", "worktrees", "list"],
    },
    Endpoint {
        command: "create_worktree",
        method: HttpMethod::Post,
        path: "/api/git/worktrees",
        request_type: Some("CreateWorktreeRequest"),
        response_type: "Worktree",
        path_params: &[],
        query_params: &[],
        description: "Create a new git worktree",
        tags: &["git", "worktrees", "create"],
    },
    Endpoint {
        command: "delete_worktree",
        method: HttpMethod::Delete,
        path: "/api/git/worktrees",
        request_type: Some("DeleteWorktreeRequest"),
        response_type: "void",
        path_params: &[],
        query_params: &[],
        description: "Delete a git worktree",
        tags: &["git", "worktrees", "delete"],
    },
    Endpoint {
        command: "get_diff",
        method: HttpMethod::Get,
        path: "/api/git/diff",
        request_type: None,
        response_type: "FileDiff[]",
        path_params: &[],
        query_params: &["worktreePath", "baseRef"],
        description: "Get git diff for a worktree",
        tags: &["git", "diff"],
    },
    Endpoint {
        command: "get_task_diff",
        method: HttpMethod::Get,
        path: "/api/git/tasks/:task_id/diff",
        request_type: None,
        response_type: "FileDiff[]",
        path_params: &["task_id"],
        query_params: &[],
        description: "Get git diff for a task's worktree",
        tags: &["git", "diff", "tasks"],
    },
    Endpoint {
        command: "get_commits",
        method: HttpMethod::Get,
        path: "/api/git/commits",
        request_type: None,
        response_type: "Commit[]",
        path_params: &[],
        query_params: &["worktreePath", "limit", "baseRef"],
        description: "Get commits for a worktree",
        tags: &["git", "commits"],
    },
    Endpoint {
        command: "get_task_commits",
        method: HttpMethod::Get,
        path: "/api/git/tasks/:task_id/commits",
        request_type: None,
        response_type: "Commit[]",
        path_params: &["task_id"],
        query_params: &["limit"],
        description: "Get commits for a task's worktree",
        tags: &["git", "commits", "tasks"],
    },
    Endpoint {
        command: "push_branch",
        method: HttpMethod::Post,
        path: "/api/git/push",
        request_type: Some("PushBranchRequest"),
        response_type: "void",
        path_params: &[],
        query_params: &[],
        description: "Push a branch to remote",
        tags: &["git", "push"],
    },
    Endpoint {
        command: "get_current_branch",
        method: HttpMethod::Get,
        path: "/api/git/branch/current",
        request_type: None,
        response_type: "string",
        path_params: &[],
        query_params: &["repoPath"],
        description: "Get current branch name",
        tags: &["git", "branch"],
    },
    Endpoint {
        command: "get_head_commit",
        method: HttpMethod::Get,
        path: "/api/git/head",
        request_type: None,
        response_type: "string",
        path_params: &[],
        query_params: &["repoPath"],
        description: "Get HEAD commit hash",
        tags: &["git", "branch"],
    },
    Endpoint {
        command: "has_uncommitted_changes",
        method: HttpMethod::Get,
        path: "/api/git/status/dirty",
        request_type: None,
        response_type: "boolean",
        path_params: &[],
        query_params: &["repoPath"],
        description: "Check if repository has uncommitted changes",
        tags: &["git", "status"],
    },
    // ==========================================================================
    // GITHUB
    // ==========================================================================
    Endpoint {
        command: "create_pull_request",
        method: HttpMethod::Post,
        path: "/api/github/pull-requests",
        request_type: Some("CreatePullRequestRequest"),
        response_type: "PullRequestResult",
        path_params: &[],
        query_params: &[],
        description: "Create a GitHub pull request",
        tags: &["github", "pull-requests", "create"],
    },
    // ==========================================================================
    // SEARCH
    // ==========================================================================
    Endpoint {
        command: "search",
        method: HttpMethod::Get,
        path: "/api/search",
        request_type: None,
        response_type: "SearchResult",
        path_params: &[],
        query_params: &["query", "projectId"],
        description: "Search across projects, tasks, chats, and messages",
        tags: &["search"],
    },
    // ==========================================================================
    // WORKFLOWS
    // ==========================================================================
    Endpoint {
        command: "list_workflow_templates",
        method: HttpMethod::Get,
        path: "/api/workflows/templates",
        request_type: None,
        response_type: "WorkflowTemplate[]",
        path_params: &[],
        query_params: &["projectId"],
        description: "List workflow templates for a project",
        tags: &["workflows", "templates", "list"],
    },
    Endpoint {
        command: "get_builtin_workflow_templates",
        method: HttpMethod::Get,
        path: "/api/workflows/templates/builtin",
        request_type: None,
        response_type: "WorkflowTemplate[]",
        path_params: &[],
        query_params: &[],
        description: "Get built-in workflow templates",
        tags: &["workflows", "templates", "list"],
    },
    Endpoint {
        command: "get_workflow_template",
        method: HttpMethod::Get,
        path: "/api/workflows/templates/:id",
        request_type: None,
        response_type: "WorkflowTemplate",
        path_params: &["id"],
        query_params: &[],
        description: "Get a workflow template by ID",
        tags: &["workflows", "templates", "read"],
    },
    Endpoint {
        command: "parse_workflow_content",
        method: HttpMethod::Post,
        path: "/api/workflows/parse",
        request_type: None,
        response_type: "WorkflowTemplate",
        path_params: &[],
        query_params: &["content"],
        description: "Parse workflow content into a template",
        tags: &["workflows", "parse"],
    },
    // ==========================================================================
    // SYSTEM
    // ==========================================================================
    Endpoint {
        command: "open_in_editor",
        method: HttpMethod::Post,
        path: "/api/system/open-editor",
        request_type: None,
        response_type: "void",
        path_params: &[],
        query_params: &["path"],
        description: "Open a file in the system editor",
        tags: &["system", "editor"],
    },
    Endpoint {
        command: "reveal_in_explorer",
        method: HttpMethod::Post,
        path: "/api/system/reveal",
        request_type: None,
        response_type: "void",
        path_params: &[],
        query_params: &["path"],
        description: "Reveal a file in the system file explorer",
        tags: &["system", "explorer"],
    },
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/// Get endpoints grouped by domain tag
pub fn endpoints_by_domain() -> std::collections::HashMap<&'static str, Vec<&'static Endpoint>> {
    let domains = [
        "projects",
        "tasks",
        "chats",
        "messages",
        "processes",
        "executor",
        "terminal",
        "settings",
        "git",
        "github",
        "search",
        "workflows",
        "system",
    ];

    let mut map = std::collections::HashMap::new();
    for domain in domains {
        map.insert(domain, Endpoint::by_tag(domain));
    }
    map
}

/// Get the total count of endpoints
pub fn endpoint_count() -> usize {
    ENDPOINTS.len()
}

/// Validate that all endpoints have unique command names
pub fn validate_unique_commands() -> Result<(), Vec<&'static str>> {
    let mut seen = std::collections::HashSet::new();
    let mut duplicates = Vec::new();

    for endpoint in ENDPOINTS {
        if !seen.insert(endpoint.command) {
            duplicates.push(endpoint.command);
        }
    }

    if duplicates.is_empty() {
        Ok(())
    } else {
        Err(duplicates)
    }
}

/// Validate that all endpoints with the same path have different methods
pub fn validate_unique_path_methods() -> Result<(), Vec<(&'static str, HttpMethod)>> {
    let mut seen = std::collections::HashSet::new();
    let mut duplicates = Vec::new();

    for endpoint in ENDPOINTS {
        let key = (endpoint.path, endpoint.method);
        if !seen.insert(key) {
            duplicates.push((endpoint.path, endpoint.method));
        }
    }

    if duplicates.is_empty() {
        Ok(())
    } else {
        Err(duplicates)
    }
}

// ============================================================================
// TESTS
// ============================================================================

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_endpoint_count() {
        // Ensure we have a reasonable number of endpoints
        assert!(endpoint_count() > 50);
        println!("Total endpoints: {}", endpoint_count());
    }

    #[test]
    fn test_unique_commands() {
        validate_unique_commands().expect("All commands should be unique");
    }

    #[test]
    fn test_unique_path_methods() {
        validate_unique_path_methods().expect("All path+method combinations should be unique");
    }

    #[test]
    fn test_by_command() {
        let ep = Endpoint::by_command("create_project");
        assert!(ep.is_some());
        let ep = ep.unwrap();
        assert_eq!(ep.method, HttpMethod::Post);
        assert_eq!(ep.path, "/api/projects");
        assert_eq!(ep.request_type, Some("CreateProjectRequest"));
        assert_eq!(ep.response_type, "Project");
    }

    #[test]
    fn test_by_path() {
        let endpoints = Endpoint::by_path("/api/projects/:id");
        // Should have GET, PATCH, DELETE
        assert!(endpoints.len() >= 3);

        let methods: Vec<_> = endpoints.iter().map(|e| e.method).collect();
        assert!(methods.contains(&HttpMethod::Get));
        assert!(methods.contains(&HttpMethod::Patch));
        assert!(methods.contains(&HttpMethod::Delete));
    }

    #[test]
    fn test_by_tag() {
        let project_endpoints = Endpoint::by_tag("projects");
        assert!(project_endpoints.len() >= 6); // list, get, create, update, delete, archive, etc.

        for ep in project_endpoints {
            assert!(ep.path.starts_with("/api/projects"));
        }
    }

    #[test]
    fn test_has_path_params() {
        let ep = Endpoint::by_command("get_project").unwrap();
        assert!(ep.has_path_params());
        assert!(ep.path_params.contains(&"id"));

        let ep = Endpoint::by_command("list_projects").unwrap();
        assert!(!ep.has_path_params());
    }

    #[test]
    fn test_has_query_params() {
        let ep = Endpoint::by_command("list_tasks").unwrap();
        assert!(ep.has_query_params());

        let ep = Endpoint::by_command("get_project").unwrap();
        assert!(!ep.has_query_params());
    }

    #[test]
    fn test_has_request_body() {
        let ep = Endpoint::by_command("create_project").unwrap();
        assert!(ep.has_request_body());

        let ep = Endpoint::by_command("list_projects").unwrap();
        assert!(!ep.has_request_body());
    }

    #[test]
    fn test_has_response() {
        let ep = Endpoint::by_command("get_project").unwrap();
        assert!(ep.has_response());

        let ep = Endpoint::by_command("delete_project").unwrap();
        assert!(!ep.has_response());
    }

    #[test]
    fn test_build_path() {
        use std::collections::HashMap;

        let ep = Endpoint::by_command("get_project").unwrap();
        let mut params = HashMap::new();
        params.insert("id", "abc123");
        let path = ep.build_path(&params);
        assert_eq!(path, "/api/projects/abc123");
    }

    #[test]
    fn test_build_path_multiple_params() {
        use std::collections::HashMap;

        let ep = Endpoint::by_command("get_task_diff").unwrap();
        let mut params = HashMap::new();
        params.insert("task_id", "task-456");
        let path = ep.build_path(&params);
        assert_eq!(path, "/api/git/tasks/task-456/diff");
    }

    #[test]
    fn test_http_method_display() {
        assert_eq!(HttpMethod::Get.to_string(), "GET");
        assert_eq!(HttpMethod::Post.to_string(), "POST");
        assert_eq!(HttpMethod::Patch.to_string(), "PATCH");
        assert_eq!(HttpMethod::Put.to_string(), "PUT");
        assert_eq!(HttpMethod::Delete.to_string(), "DELETE");
    }

    #[test]
    fn test_endpoints_by_domain() {
        let by_domain = endpoints_by_domain();

        assert!(by_domain.get("projects").unwrap().len() >= 6);
        assert!(by_domain.get("tasks").unwrap().len() >= 6);
        assert!(by_domain.get("chats").unwrap().len() >= 8);
        assert!(by_domain.get("messages").unwrap().len() >= 5);
        assert!(by_domain.get("processes").unwrap().len() >= 6);
        assert!(by_domain.get("executor").unwrap().len() >= 6);
        assert!(by_domain.get("settings").unwrap().len() >= 4);
        assert!(by_domain.get("git").unwrap().len() >= 8);
    }

    #[test]
    fn test_all_endpoints_have_tags() {
        for ep in ENDPOINTS {
            assert!(
                !ep.tags.is_empty(),
                "Endpoint {} has no tags",
                ep.command
            );
        }
    }

    #[test]
    fn test_all_endpoints_have_description() {
        for ep in ENDPOINTS {
            assert!(
                !ep.description.is_empty(),
                "Endpoint {} has no description",
                ep.command
            );
        }
    }

    #[test]
    fn test_path_params_match_path() {
        for ep in ENDPOINTS {
            for param in ep.path_params {
                let placeholder = format!(":{}", param);
                assert!(
                    ep.path.contains(&placeholder),
                    "Endpoint {} declares path param '{}' but path '{}' doesn't contain ':{}' placeholder",
                    ep.command, param, ep.path, param
                );
            }
        }
    }

    #[test]
    fn test_request_types_for_mutations() {
        // POST/PATCH/PUT endpoints that create/update entities should have request types
        // (with some exceptions like archive/unarchive which are state changes)
        let exceptions = [
            "archive_project",
            "unarchive_project",
            "archive_task",
            "unarchive_task",
            "archive_chat",
            "unarchive_chat",
            "duplicate_task",
            "kill_process",
            "toggle_step_complete",
            "start_workflow_step",
            "spawn_terminal",
            "open_in_editor",
            "reveal_in_explorer",
            "parse_workflow_content",
        ];

        for ep in ENDPOINTS {
            if matches!(ep.method, HttpMethod::Post | HttpMethod::Patch | HttpMethod::Put)
                && !exceptions.contains(&ep.command)
                && (ep.tags.contains(&"create") || ep.tags.contains(&"update"))
                && ep.request_type.is_none()
                && !ep.has_query_params()
            {
                // Allow endpoints that use query params instead of body
                panic!(
                    "Endpoint {} is a mutation but has no request type",
                    ep.command
                );
            }
        }
    }
}
