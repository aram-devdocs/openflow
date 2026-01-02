//! Process Request Types
//!
//! Request types for process management operations. These define the shape of
//! data sent from frontend to backend for process mutations and control.

use serde::{Deserialize, Serialize};
use typeshare::typeshare;

use crate::entities::process::{ProcessStatus, RunReason};
use crate::validation::{
    validate_required_string, validate_string_length, Validate, ValidationCollector,
    ValidationResult,
};

// =============================================================================
// Create Process Request
// =============================================================================

/// Request to create a new execution process record
///
/// Creates a new process record to track command execution.
/// The actual process spawning is handled separately; this just
/// creates the tracking record.
///
/// # Endpoint
/// @endpoint: POST /api/processes
/// @command: create_process
///
/// # Example
/// ```json
/// {
///   "chatId": "660e8400-e29b-41d4-a716-446655440001",
///   "executorProfileId": "770e8400-e29b-41d4-a716-446655440002",
///   "executorAction": "Run claude-code with task instructions",
///   "runReason": "codingagent"
/// }
/// ```
#[typeshare]
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct CreateProcessRequest {
    /// Parent chat ID (required)
    /// @validate: required, format=uuid
    pub chat_id: String,

    /// Executor profile ID (optional, for coding agents)
    /// @validate: format=uuid
    pub executor_profile_id: Option<String>,

    /// Description of what action triggered this process
    /// @validate: required, max_length=1000
    pub executor_action: String,

    /// Reason why this process was started
    pub run_reason: RunReason,

    /// Git HEAD commit hash before execution started
    /// @validate: max_length=40
    pub before_head_commit: Option<String>,
}

impl Default for CreateProcessRequest {
    fn default() -> Self {
        Self {
            chat_id: String::new(),
            executor_profile_id: None,
            executor_action: String::new(),
            run_reason: RunReason::Terminal,
            before_head_commit: None,
        }
    }
}

impl CreateProcessRequest {
    /// Create a request for a coding agent process
    pub fn coding_agent(
        chat_id: impl Into<String>,
        executor_profile_id: impl Into<String>,
        action: impl Into<String>,
    ) -> Self {
        Self {
            chat_id: chat_id.into(),
            executor_profile_id: Some(executor_profile_id.into()),
            executor_action: action.into(),
            run_reason: RunReason::Codingagent,
            before_head_commit: None,
        }
    }

    /// Create a request for a setup script process
    pub fn setup_script(chat_id: impl Into<String>, action: impl Into<String>) -> Self {
        Self {
            chat_id: chat_id.into(),
            executor_profile_id: None,
            executor_action: action.into(),
            run_reason: RunReason::Setupscript,
            before_head_commit: None,
        }
    }

    /// Create a request for a cleanup script process
    pub fn cleanup_script(chat_id: impl Into<String>, action: impl Into<String>) -> Self {
        Self {
            chat_id: chat_id.into(),
            executor_profile_id: None,
            executor_action: action.into(),
            run_reason: RunReason::Cleanupscript,
            before_head_commit: None,
        }
    }

    /// Create a request for a dev server process
    pub fn dev_server(chat_id: impl Into<String>, action: impl Into<String>) -> Self {
        Self {
            chat_id: chat_id.into(),
            executor_profile_id: None,
            executor_action: action.into(),
            run_reason: RunReason::Devserver,
            before_head_commit: None,
        }
    }

    /// Create a request for a terminal process
    pub fn terminal(chat_id: impl Into<String>, action: impl Into<String>) -> Self {
        Self {
            chat_id: chat_id.into(),
            executor_profile_id: None,
            executor_action: action.into(),
            run_reason: RunReason::Terminal,
            before_head_commit: None,
        }
    }

    /// Create a request for a verification process
    pub fn verification(chat_id: impl Into<String>, action: impl Into<String>) -> Self {
        Self {
            chat_id: chat_id.into(),
            executor_profile_id: None,
            executor_action: action.into(),
            run_reason: RunReason::Verification,
            before_head_commit: None,
        }
    }

    /// Set the git commit before execution
    pub fn with_before_commit(mut self, commit: impl Into<String>) -> Self {
        self.before_head_commit = Some(commit.into());
        self
    }

    /// Set the executor profile ID
    pub fn with_executor_profile(mut self, profile_id: impl Into<String>) -> Self {
        self.executor_profile_id = Some(profile_id.into());
        self
    }
}

impl Validate for CreateProcessRequest {
    fn validate(&self) -> ValidationResult<()> {
        ValidationCollector::new()
            .validate(|| validate_required_string("chat_id", &self.chat_id))
            .validate(|| validate_required_string("executor_action", &self.executor_action))
            .validate(|| {
                validate_string_length("executor_action", &self.executor_action, None, Some(1000))
            })
            .validate(|| {
                if let Some(ref commit) = self.before_head_commit {
                    validate_string_length("before_head_commit", commit, None, Some(40))
                } else {
                    Ok(())
                }
            })
            .finish()
    }
}

// =============================================================================
// Update Process Request
// =============================================================================

/// Request to update an existing process
///
/// Used to update process status, exit code, and git state
/// as the process progresses through its lifecycle.
///
/// # Endpoint
/// @endpoint: PATCH /api/processes/:id
/// @command: update_process
///
/// # Example (Mark as completed)
/// ```json
/// {
///   "status": "completed",
///   "exitCode": 0,
///   "afterHeadCommit": "def456"
/// }
/// ```
#[typeshare]
#[derive(Debug, Clone, Default, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct UpdateProcessRequest {
    /// Updated status
    pub status: Option<ProcessStatus>,

    /// Exit code when process completes
    pub exit_code: Option<i32>,

    /// Git HEAD commit hash after execution completed
    /// @validate: max_length=40
    pub after_head_commit: Option<String>,

    /// OS process ID
    pub pid: Option<i32>,

    /// When the process completed (ISO 8601)
    pub completed_at: Option<String>,
}

impl UpdateProcessRequest {
    /// Check if any field is set for update
    pub fn has_updates(&self) -> bool {
        self.status.is_some()
            || self.exit_code.is_some()
            || self.after_head_commit.is_some()
            || self.pid.is_some()
            || self.completed_at.is_some()
    }

    /// Create a request to mark process as running with PID
    pub fn running(pid: i32) -> Self {
        Self {
            status: Some(ProcessStatus::Running),
            pid: Some(pid),
            ..Default::default()
        }
    }

    /// Create a request to mark process as completed
    pub fn completed(exit_code: i32) -> Self {
        Self {
            status: Some(if exit_code == 0 {
                ProcessStatus::Completed
            } else {
                ProcessStatus::Failed
            }),
            exit_code: Some(exit_code),
            completed_at: Some(chrono::Utc::now().to_rfc3339()),
            ..Default::default()
        }
    }

    /// Create a request to mark process as killed
    pub fn killed() -> Self {
        Self {
            status: Some(ProcessStatus::Killed),
            completed_at: Some(chrono::Utc::now().to_rfc3339()),
            ..Default::default()
        }
    }

    /// Set the git commit after execution
    pub fn with_after_commit(mut self, commit: impl Into<String>) -> Self {
        self.after_head_commit = Some(commit.into());
        self
    }
}

impl Validate for UpdateProcessRequest {
    fn validate(&self) -> ValidationResult<()> {
        ValidationCollector::new()
            .validate(|| {
                if let Some(ref commit) = self.after_head_commit {
                    validate_string_length("after_head_commit", commit, None, Some(40))
                } else {
                    Ok(())
                }
            })
            .finish()
    }
}

// =============================================================================
// Kill Process Request
// =============================================================================

/// Request to kill a running process
///
/// Terminates a running process by sending a kill signal.
///
/// # Endpoint
/// @endpoint: POST /api/processes/:id/kill
/// @command: kill_process
///
/// # Example
/// ```json
/// {
///   "signal": "SIGTERM"
/// }
/// ```
#[typeshare]
#[derive(Debug, Clone, Default, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct KillProcessRequest {
    /// Signal to send (optional, defaults to SIGTERM)
    /// @validate: max_length=20
    pub signal: Option<String>,
}

impl KillProcessRequest {
    /// Create a request with default signal (SIGTERM)
    pub fn new() -> Self {
        Self::default()
    }

    /// Create a request with SIGTERM
    pub fn sigterm() -> Self {
        Self {
            signal: Some("SIGTERM".to_string()),
        }
    }

    /// Create a request with SIGKILL
    pub fn sigkill() -> Self {
        Self {
            signal: Some("SIGKILL".to_string()),
        }
    }

    /// Create a request with SIGINT
    pub fn sigint() -> Self {
        Self {
            signal: Some("SIGINT".to_string()),
        }
    }
}

impl Validate for KillProcessRequest {
    fn validate(&self) -> ValidationResult<()> {
        ValidationCollector::new()
            .validate(|| {
                if let Some(ref signal) = self.signal {
                    validate_string_length("signal", signal, None, Some(20))
                } else {
                    Ok(())
                }
            })
            .finish()
    }
}

// =============================================================================
// Send Process Input Request
// =============================================================================

/// Request to send input to a running process
///
/// Sends text input to the process's stdin.
///
/// # Endpoint
/// @endpoint: POST /api/processes/:id/input
/// @command: send_process_input
///
/// # Example
/// ```json
/// {
///   "input": "yes\n"
/// }
/// ```
#[typeshare]
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct SendProcessInputRequest {
    /// Input text to send to the process
    /// @validate: max_length=100000
    pub input: String,
}

impl SendProcessInputRequest {
    /// Create a new input request
    pub fn new(input: impl Into<String>) -> Self {
        Self {
            input: input.into(),
        }
    }

    /// Create a request with a newline appended
    pub fn with_newline(input: impl Into<String>) -> Self {
        let mut s = input.into();
        if !s.ends_with('\n') {
            s.push('\n');
        }
        Self { input: s }
    }

    /// Create a request to send just a newline (Enter key)
    pub fn enter() -> Self {
        Self {
            input: "\n".to_string(),
        }
    }

    /// Create a request to send Ctrl+C
    pub fn ctrl_c() -> Self {
        Self {
            input: "\x03".to_string(),
        }
    }

    /// Create a request to send Ctrl+D (EOF)
    pub fn ctrl_d() -> Self {
        Self {
            input: "\x04".to_string(),
        }
    }
}

impl Validate for SendProcessInputRequest {
    fn validate(&self) -> ValidationResult<()> {
        ValidationCollector::new()
            .validate(|| validate_string_length("input", &self.input, None, Some(100000)))
            .finish()
    }
}

// =============================================================================
// Resize Process Request
// =============================================================================

/// Request to resize a process terminal
///
/// Updates the PTY dimensions for a running process.
///
/// # Endpoint
/// @endpoint: POST /api/processes/:id/resize
/// @command: resize_process
///
/// # Example
/// ```json
/// {
///   "cols": 120,
///   "rows": 40
/// }
/// ```
#[typeshare]
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct ResizeProcessRequest {
    /// Number of columns (width)
    pub cols: u16,

    /// Number of rows (height)
    pub rows: u16,
}

impl ResizeProcessRequest {
    /// Create a new resize request
    pub fn new(cols: u16, rows: u16) -> Self {
        Self { cols, rows }
    }

    /// Create a standard 80x24 terminal size
    pub fn standard() -> Self {
        Self {
            cols: 80,
            rows: 24,
        }
    }

    /// Create a wide 120x40 terminal size
    pub fn wide() -> Self {
        Self {
            cols: 120,
            rows: 40,
        }
    }
}

impl Default for ResizeProcessRequest {
    fn default() -> Self {
        Self::standard()
    }
}

impl Validate for ResizeProcessRequest {
    fn validate(&self) -> ValidationResult<()> {
        // Terminal dimensions must be positive
        ValidationCollector::new()
            .validate(|| {
                if self.cols == 0 {
                    Err(crate::validation::ValidationError::NumberMin {
                        field: "cols".to_string(),
                        min: 1.0,
                        actual: 0.0,
                    })
                } else {
                    Ok(())
                }
            })
            .validate(|| {
                if self.rows == 0 {
                    Err(crate::validation::ValidationError::NumberMin {
                        field: "rows".to_string(),
                        min: 1.0,
                        actual: 0.0,
                    })
                } else {
                    Ok(())
                }
            })
            .finish()
    }
}

// =============================================================================
// List Processes Request (Query Parameters)
// =============================================================================

/// Query parameters for listing processes
///
/// Used to filter the list of processes.
///
/// # Endpoint
/// @endpoint: GET /api/processes
/// @command: list_processes
///
/// # Example URL
/// `GET /api/processes?chatId=660e8400-...&status=running`
#[typeshare]
#[derive(Debug, Clone, Default, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct ListProcessesRequest {
    /// Filter by chat ID
    pub chat_id: Option<String>,

    /// Filter by status
    pub status: Option<ProcessStatus>,

    /// Filter by run reason
    pub run_reason: Option<RunReason>,

    /// Only show running processes
    pub running_only: Option<bool>,

    /// Limit number of results
    pub limit: Option<i32>,
}

impl ListProcessesRequest {
    /// Create a request to list all processes for a chat
    pub fn for_chat(chat_id: impl Into<String>) -> Self {
        Self {
            chat_id: Some(chat_id.into()),
            ..Default::default()
        }
    }

    /// Create a request to list all running processes
    pub fn running() -> Self {
        Self {
            running_only: Some(true),
            ..Default::default()
        }
    }

    /// Create a request to list processes by status
    pub fn with_status(status: ProcessStatus) -> Self {
        Self {
            status: Some(status),
            ..Default::default()
        }
    }

    /// Create a request to list processes by run reason
    pub fn with_reason(reason: RunReason) -> Self {
        Self {
            run_reason: Some(reason),
            ..Default::default()
        }
    }

    /// Add a limit to the request
    pub fn with_limit(mut self, limit: i32) -> Self {
        self.limit = Some(limit);
        self
    }
}

impl Validate for ListProcessesRequest {
    fn validate(&self) -> ValidationResult<()> {
        Ok(())
    }
}

// =============================================================================
// Start Process Request
// =============================================================================

/// Request to start (spawn) a process with specific configuration
///
/// This is used internally to configure how a process should be spawned,
/// including PTY settings, working directory, and environment.
///
/// Unlike `CreateProcessRequest` which creates a database record,
/// this defines the actual execution parameters.
///
/// # Example
/// ```json
/// {
///   "command": "claude",
///   "args": ["--output-format", "stream-json", "-p", "Hello"],
///   "cwd": "/path/to/project",
///   "env": {"NO_COLOR": "1"},
///   "usePty": true,
///   "ptyCols": 120,
///   "ptyRows": 40
/// }
/// ```
#[typeshare]
#[derive(Debug, Clone, Default, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct StartProcessRequest {
    /// Command to execute (e.g., "claude", "npm", "cargo")
    /// @validate: required, min_length=1, max_length=1000
    pub command: String,

    /// Arguments to pass to the command
    pub args: Vec<String>,

    /// Working directory for the process
    pub cwd: Option<std::path::PathBuf>,

    /// Environment variables to set
    pub env: std::collections::HashMap<String, String>,

    /// Whether to use a PTY (pseudo-terminal)
    pub use_pty: bool,

    /// PTY columns (width) - only used if use_pty is true
    pub pty_cols: Option<u16>,

    /// PTY rows (height) - only used if use_pty is true
    pub pty_rows: Option<u16>,
}

impl StartProcessRequest {
    /// Create a new request with just a command
    pub fn new(command: impl Into<String>) -> Self {
        Self {
            command: command.into(),
            ..Default::default()
        }
    }

    /// Create a request for a PTY-based process
    pub fn pty(command: impl Into<String>, cols: u16, rows: u16) -> Self {
        Self {
            command: command.into(),
            use_pty: true,
            pty_cols: Some(cols),
            pty_rows: Some(rows),
            ..Default::default()
        }
    }

    /// Create a request for a standard terminal (120x40)
    pub fn terminal(command: impl Into<String>) -> Self {
        Self::pty(command, 120, 40)
    }

    /// Add arguments to the command
    pub fn with_args<I, S>(mut self, args: I) -> Self
    where
        I: IntoIterator<Item = S>,
        S: Into<String>,
    {
        self.args = args.into_iter().map(|s| s.into()).collect();
        self
    }

    /// Set the working directory
    pub fn with_cwd(mut self, cwd: impl Into<std::path::PathBuf>) -> Self {
        self.cwd = Some(cwd.into());
        self
    }

    /// Set environment variables
    pub fn with_env(mut self, env: std::collections::HashMap<String, String>) -> Self {
        self.env = env;
        self
    }

    /// Add a single environment variable
    pub fn with_env_var(mut self, key: impl Into<String>, value: impl Into<String>) -> Self {
        self.env.insert(key.into(), value.into());
        self
    }

    /// Enable PTY mode with specified dimensions
    pub fn with_pty(mut self, cols: u16, rows: u16) -> Self {
        self.use_pty = true;
        self.pty_cols = Some(cols);
        self.pty_rows = Some(rows);
        self
    }
}

impl Validate for StartProcessRequest {
    fn validate(&self) -> ValidationResult<()> {
        ValidationCollector::new()
            .validate(|| validate_required_string("command", &self.command))
            .validate(|| validate_string_length("command", &self.command, None, Some(1000)))
            .validate(|| {
                if self.use_pty {
                    if let Some(cols) = self.pty_cols {
                        if cols == 0 {
                            return Err(crate::validation::ValidationError::NumberMin {
                                field: "pty_cols".to_string(),
                                min: 1.0,
                                actual: 0.0,
                            });
                        }
                    }
                }
                Ok(())
            })
            .validate(|| {
                if self.use_pty {
                    if let Some(rows) = self.pty_rows {
                        if rows == 0 {
                            return Err(crate::validation::ValidationError::NumberMin {
                                field: "pty_rows".to_string(),
                                min: 1.0,
                                actual: 0.0,
                            });
                        }
                    }
                }
                Ok(())
            })
            .finish()
    }
}

// =============================================================================
// Tests
// =============================================================================

#[cfg(test)]
mod tests {
    use super::*;

    // =========================================================================
    // CreateProcessRequest Tests
    // =========================================================================

    #[test]
    fn test_create_process_request_coding_agent() {
        let request = CreateProcessRequest::coding_agent(
            "chat-123",
            "profile-456",
            "Run claude-code with task",
        );

        assert!(request.validate().is_ok());
        assert_eq!(request.chat_id, "chat-123");
        assert_eq!(request.executor_profile_id, Some("profile-456".to_string()));
        assert_eq!(request.run_reason, RunReason::Codingagent);
    }

    #[test]
    fn test_create_process_request_setup_script() {
        let request = CreateProcessRequest::setup_script("chat-123", "Run npm install");

        assert!(request.validate().is_ok());
        assert_eq!(request.run_reason, RunReason::Setupscript);
        assert_eq!(request.executor_profile_id, None);
    }

    #[test]
    fn test_create_process_request_cleanup_script() {
        let request = CreateProcessRequest::cleanup_script("chat-123", "Run cleanup.sh");

        assert!(request.validate().is_ok());
        assert_eq!(request.run_reason, RunReason::Cleanupscript);
    }

    #[test]
    fn test_create_process_request_dev_server() {
        let request = CreateProcessRequest::dev_server("chat-123", "Start npm dev");

        assert!(request.validate().is_ok());
        assert_eq!(request.run_reason, RunReason::Devserver);
    }

    #[test]
    fn test_create_process_request_terminal() {
        let request = CreateProcessRequest::terminal("chat-123", "Interactive session");

        assert!(request.validate().is_ok());
        assert_eq!(request.run_reason, RunReason::Terminal);
    }

    #[test]
    fn test_create_process_request_verification() {
        let request = CreateProcessRequest::verification("chat-123", "Run tests");

        assert!(request.validate().is_ok());
        assert_eq!(request.run_reason, RunReason::Verification);
    }

    #[test]
    fn test_create_process_request_with_before_commit() {
        let request =
            CreateProcessRequest::terminal("chat-123", "Test").with_before_commit("abc123");

        assert!(request.validate().is_ok());
        assert_eq!(request.before_head_commit, Some("abc123".to_string()));
    }

    #[test]
    fn test_create_process_request_empty_chat_id() {
        let request = CreateProcessRequest {
            chat_id: String::new(),
            executor_action: "Test".to_string(),
            ..Default::default()
        };

        assert!(request.validate().is_err());
    }

    #[test]
    fn test_create_process_request_empty_action() {
        let request = CreateProcessRequest {
            chat_id: "chat-123".to_string(),
            executor_action: String::new(),
            ..Default::default()
        };

        assert!(request.validate().is_err());
    }

    #[test]
    fn test_create_process_request_action_too_long() {
        let request = CreateProcessRequest {
            chat_id: "chat-123".to_string(),
            executor_action: "a".repeat(1001),
            ..Default::default()
        };

        assert!(request.validate().is_err());
    }

    #[test]
    fn test_create_process_request_commit_too_long() {
        let request =
            CreateProcessRequest::terminal("chat-123", "Test").with_before_commit("a".repeat(41));

        assert!(request.validate().is_err());
    }

    #[test]
    fn test_create_process_request_serialization() {
        let request = CreateProcessRequest::coding_agent(
            "chat-123",
            "profile-456",
            "Run claude-code",
        )
        .with_before_commit("abc123");

        let json = serde_json::to_string(&request).unwrap();

        assert!(json.contains("\"chatId\":\"chat-123\""));
        assert!(json.contains("\"executorProfileId\":\"profile-456\""));
        assert!(json.contains("\"executorAction\":\"Run claude-code\""));
        assert!(json.contains("\"runReason\":\"codingagent\""));
        assert!(json.contains("\"beforeHeadCommit\":\"abc123\""));

        let deserialized: CreateProcessRequest = serde_json::from_str(&json).unwrap();
        assert_eq!(request, deserialized);
    }

    // =========================================================================
    // UpdateProcessRequest Tests
    // =========================================================================

    #[test]
    fn test_update_process_request_empty() {
        let request = UpdateProcessRequest::default();

        assert!(request.validate().is_ok());
        assert!(!request.has_updates());
    }

    #[test]
    fn test_update_process_request_running() {
        let request = UpdateProcessRequest::running(12345);

        assert!(request.validate().is_ok());
        assert!(request.has_updates());
        assert_eq!(request.status, Some(ProcessStatus::Running));
        assert_eq!(request.pid, Some(12345));
    }

    #[test]
    fn test_update_process_request_completed_success() {
        let request = UpdateProcessRequest::completed(0);

        assert!(request.validate().is_ok());
        assert!(request.has_updates());
        assert_eq!(request.status, Some(ProcessStatus::Completed));
        assert_eq!(request.exit_code, Some(0));
        assert!(request.completed_at.is_some());
    }

    #[test]
    fn test_update_process_request_completed_failure() {
        let request = UpdateProcessRequest::completed(1);

        assert!(request.validate().is_ok());
        assert_eq!(request.status, Some(ProcessStatus::Failed));
        assert_eq!(request.exit_code, Some(1));
    }

    #[test]
    fn test_update_process_request_killed() {
        let request = UpdateProcessRequest::killed();

        assert!(request.validate().is_ok());
        assert_eq!(request.status, Some(ProcessStatus::Killed));
        assert!(request.completed_at.is_some());
    }

    #[test]
    fn test_update_process_request_with_after_commit() {
        let request = UpdateProcessRequest::completed(0).with_after_commit("def456");

        assert!(request.validate().is_ok());
        assert_eq!(request.after_head_commit, Some("def456".to_string()));
    }

    #[test]
    fn test_update_process_request_commit_too_long() {
        let request = UpdateProcessRequest::completed(0).with_after_commit("a".repeat(41));

        assert!(request.validate().is_err());
    }

    #[test]
    fn test_update_process_request_has_updates() {
        assert!(UpdateProcessRequest {
            status: Some(ProcessStatus::Running),
            ..Default::default()
        }
        .has_updates());

        assert!(UpdateProcessRequest {
            exit_code: Some(0),
            ..Default::default()
        }
        .has_updates());

        assert!(UpdateProcessRequest {
            after_head_commit: Some("abc".to_string()),
            ..Default::default()
        }
        .has_updates());

        assert!(UpdateProcessRequest {
            pid: Some(123),
            ..Default::default()
        }
        .has_updates());

        assert!(UpdateProcessRequest {
            completed_at: Some("2024-01-01".to_string()),
            ..Default::default()
        }
        .has_updates());
    }

    #[test]
    fn test_update_process_request_serialization() {
        let request = UpdateProcessRequest::completed(0).with_after_commit("abc123");
        let json = serde_json::to_string(&request).unwrap();

        assert!(json.contains("\"status\":\"completed\""));
        assert!(json.contains("\"exitCode\":0"));
        assert!(json.contains("\"afterHeadCommit\":\"abc123\""));

        let deserialized: UpdateProcessRequest = serde_json::from_str(&json).unwrap();
        assert_eq!(request, deserialized);
    }

    // =========================================================================
    // KillProcessRequest Tests
    // =========================================================================

    #[test]
    fn test_kill_process_request_default() {
        let request = KillProcessRequest::new();

        assert!(request.validate().is_ok());
        assert_eq!(request.signal, None);
    }

    #[test]
    fn test_kill_process_request_sigterm() {
        let request = KillProcessRequest::sigterm();

        assert!(request.validate().is_ok());
        assert_eq!(request.signal, Some("SIGTERM".to_string()));
    }

    #[test]
    fn test_kill_process_request_sigkill() {
        let request = KillProcessRequest::sigkill();

        assert!(request.validate().is_ok());
        assert_eq!(request.signal, Some("SIGKILL".to_string()));
    }

    #[test]
    fn test_kill_process_request_sigint() {
        let request = KillProcessRequest::sigint();

        assert!(request.validate().is_ok());
        assert_eq!(request.signal, Some("SIGINT".to_string()));
    }

    #[test]
    fn test_kill_process_request_signal_too_long() {
        let request = KillProcessRequest {
            signal: Some("a".repeat(21)),
        };

        assert!(request.validate().is_err());
    }

    #[test]
    fn test_kill_process_request_serialization() {
        let request = KillProcessRequest::sigterm();
        let json = serde_json::to_string(&request).unwrap();

        assert!(json.contains("\"signal\":\"SIGTERM\""));

        let deserialized: KillProcessRequest = serde_json::from_str(&json).unwrap();
        assert_eq!(request, deserialized);
    }

    // =========================================================================
    // SendProcessInputRequest Tests
    // =========================================================================

    #[test]
    fn test_send_process_input_request_new() {
        let request = SendProcessInputRequest::new("test input");

        assert!(request.validate().is_ok());
        assert_eq!(request.input, "test input");
    }

    #[test]
    fn test_send_process_input_request_with_newline() {
        let request = SendProcessInputRequest::with_newline("test");

        assert!(request.validate().is_ok());
        assert_eq!(request.input, "test\n");

        // Already has newline
        let request2 = SendProcessInputRequest::with_newline("test\n");
        assert_eq!(request2.input, "test\n");
    }

    #[test]
    fn test_send_process_input_request_enter() {
        let request = SendProcessInputRequest::enter();

        assert!(request.validate().is_ok());
        assert_eq!(request.input, "\n");
    }

    #[test]
    fn test_send_process_input_request_ctrl_c() {
        let request = SendProcessInputRequest::ctrl_c();

        assert!(request.validate().is_ok());
        assert_eq!(request.input, "\x03");
    }

    #[test]
    fn test_send_process_input_request_ctrl_d() {
        let request = SendProcessInputRequest::ctrl_d();

        assert!(request.validate().is_ok());
        assert_eq!(request.input, "\x04");
    }

    #[test]
    fn test_send_process_input_request_too_long() {
        let request = SendProcessInputRequest::new("a".repeat(100001));

        assert!(request.validate().is_err());
    }

    #[test]
    fn test_send_process_input_request_serialization() {
        let request = SendProcessInputRequest::new("hello");
        let json = serde_json::to_string(&request).unwrap();

        assert!(json.contains("\"input\":\"hello\""));

        let deserialized: SendProcessInputRequest = serde_json::from_str(&json).unwrap();
        assert_eq!(request, deserialized);
    }

    // =========================================================================
    // ResizeProcessRequest Tests
    // =========================================================================

    #[test]
    fn test_resize_process_request_new() {
        let request = ResizeProcessRequest::new(120, 40);

        assert!(request.validate().is_ok());
        assert_eq!(request.cols, 120);
        assert_eq!(request.rows, 40);
    }

    #[test]
    fn test_resize_process_request_standard() {
        let request = ResizeProcessRequest::standard();

        assert!(request.validate().is_ok());
        assert_eq!(request.cols, 80);
        assert_eq!(request.rows, 24);
    }

    #[test]
    fn test_resize_process_request_wide() {
        let request = ResizeProcessRequest::wide();

        assert!(request.validate().is_ok());
        assert_eq!(request.cols, 120);
        assert_eq!(request.rows, 40);
    }

    #[test]
    fn test_resize_process_request_default() {
        let request = ResizeProcessRequest::default();

        assert!(request.validate().is_ok());
        assert_eq!(request.cols, 80);
        assert_eq!(request.rows, 24);
    }

    #[test]
    fn test_resize_process_request_zero_cols() {
        let request = ResizeProcessRequest { cols: 0, rows: 24 };

        assert!(request.validate().is_err());
    }

    #[test]
    fn test_resize_process_request_zero_rows() {
        let request = ResizeProcessRequest { cols: 80, rows: 0 };

        assert!(request.validate().is_err());
    }

    #[test]
    fn test_resize_process_request_serialization() {
        let request = ResizeProcessRequest::wide();
        let json = serde_json::to_string(&request).unwrap();

        assert!(json.contains("\"cols\":120"));
        assert!(json.contains("\"rows\":40"));

        let deserialized: ResizeProcessRequest = serde_json::from_str(&json).unwrap();
        assert_eq!(request, deserialized);
    }

    // =========================================================================
    // ListProcessesRequest Tests
    // =========================================================================

    #[test]
    fn test_list_processes_request_for_chat() {
        let request = ListProcessesRequest::for_chat("chat-123");

        assert!(request.validate().is_ok());
        assert_eq!(request.chat_id, Some("chat-123".to_string()));
    }

    #[test]
    fn test_list_processes_request_running() {
        let request = ListProcessesRequest::running();

        assert!(request.validate().is_ok());
        assert_eq!(request.running_only, Some(true));
    }

    #[test]
    fn test_list_processes_request_with_status() {
        let request = ListProcessesRequest::with_status(ProcessStatus::Failed);

        assert!(request.validate().is_ok());
        assert_eq!(request.status, Some(ProcessStatus::Failed));
    }

    #[test]
    fn test_list_processes_request_with_reason() {
        let request = ListProcessesRequest::with_reason(RunReason::Codingagent);

        assert!(request.validate().is_ok());
        assert_eq!(request.run_reason, Some(RunReason::Codingagent));
    }

    #[test]
    fn test_list_processes_request_with_limit() {
        let request = ListProcessesRequest::for_chat("chat-123").with_limit(10);

        assert!(request.validate().is_ok());
        assert_eq!(request.limit, Some(10));
    }

    #[test]
    fn test_list_processes_request_serialization() {
        let request = ListProcessesRequest::for_chat("chat-123").with_limit(10);
        let json = serde_json::to_string(&request).unwrap();

        assert!(json.contains("\"chatId\":\"chat-123\""));
        assert!(json.contains("\"limit\":10"));

        let deserialized: ListProcessesRequest = serde_json::from_str(&json).unwrap();
        assert_eq!(request, deserialized);
    }

    // =========================================================================
    // StartProcessRequest Tests
    // =========================================================================

    #[test]
    fn test_start_process_request_new() {
        let request = StartProcessRequest::new("claude");

        assert!(request.validate().is_ok());
        assert_eq!(request.command, "claude");
        assert!(!request.use_pty);
    }

    #[test]
    fn test_start_process_request_pty() {
        let request = StartProcessRequest::pty("claude", 120, 40);

        assert!(request.validate().is_ok());
        assert_eq!(request.command, "claude");
        assert!(request.use_pty);
        assert_eq!(request.pty_cols, Some(120));
        assert_eq!(request.pty_rows, Some(40));
    }

    #[test]
    fn test_start_process_request_terminal() {
        let request = StartProcessRequest::terminal("claude");

        assert!(request.validate().is_ok());
        assert!(request.use_pty);
        assert_eq!(request.pty_cols, Some(120));
        assert_eq!(request.pty_rows, Some(40));
    }

    #[test]
    fn test_start_process_request_with_args() {
        let request =
            StartProcessRequest::new("claude").with_args(["--verbose", "-p", "hello"]);

        assert!(request.validate().is_ok());
        assert_eq!(request.args.len(), 3);
        assert_eq!(request.args[0], "--verbose");
    }

    #[test]
    fn test_start_process_request_with_cwd() {
        let request = StartProcessRequest::new("claude").with_cwd("/path/to/project");

        assert!(request.validate().is_ok());
        assert_eq!(
            request.cwd,
            Some(std::path::PathBuf::from("/path/to/project"))
        );
    }

    #[test]
    fn test_start_process_request_with_env() {
        let mut env = std::collections::HashMap::new();
        env.insert("NO_COLOR".to_string(), "1".to_string());

        let request = StartProcessRequest::new("claude").with_env(env);

        assert!(request.validate().is_ok());
        assert_eq!(request.env.get("NO_COLOR"), Some(&"1".to_string()));
    }

    #[test]
    fn test_start_process_request_with_env_var() {
        let request = StartProcessRequest::new("claude")
            .with_env_var("NO_COLOR", "1")
            .with_env_var("TERM", "dumb");

        assert!(request.validate().is_ok());
        assert_eq!(request.env.len(), 2);
        assert_eq!(request.env.get("NO_COLOR"), Some(&"1".to_string()));
        assert_eq!(request.env.get("TERM"), Some(&"dumb".to_string()));
    }

    #[test]
    fn test_start_process_request_with_pty() {
        let request = StartProcessRequest::new("claude").with_pty(80, 24);

        assert!(request.validate().is_ok());
        assert!(request.use_pty);
        assert_eq!(request.pty_cols, Some(80));
        assert_eq!(request.pty_rows, Some(24));
    }

    #[test]
    fn test_start_process_request_empty_command() {
        let request = StartProcessRequest::new("");

        assert!(request.validate().is_err());
    }

    #[test]
    fn test_start_process_request_command_too_long() {
        let request = StartProcessRequest::new("a".repeat(1001));

        assert!(request.validate().is_err());
    }

    #[test]
    fn test_start_process_request_zero_cols() {
        let request = StartProcessRequest::pty("claude", 0, 40);

        assert!(request.validate().is_err());
    }

    #[test]
    fn test_start_process_request_zero_rows() {
        let request = StartProcessRequest::pty("claude", 120, 0);

        assert!(request.validate().is_err());
    }

    #[test]
    fn test_start_process_request_serialization() {
        let request = StartProcessRequest::terminal("claude")
            .with_args(["--verbose"])
            .with_cwd("/tmp")
            .with_env_var("NO_COLOR", "1");

        let json = serde_json::to_string(&request).unwrap();

        assert!(json.contains("\"command\":\"claude\""));
        assert!(json.contains("\"usePty\":true"));
        assert!(json.contains("\"ptyCols\":120"));
        assert!(json.contains("\"ptyRows\":40"));

        let deserialized: StartProcessRequest = serde_json::from_str(&json).unwrap();
        assert_eq!(request, deserialized);
    }
}
