//! Process Entity
//!
//! Execution processes represent running or completed CLI processes.
//! These track the lifecycle of command execution including coding agents,
//! setup scripts, dev servers, and terminal sessions.

use serde::{Deserialize, Serialize};
use typeshare::typeshare;

use crate::validation::{
    validate_required_string, validate_string_length, Validate, ValidationCollector,
    ValidationResult,
};

// =============================================================================
// Process Status Enum
// =============================================================================

/// Status of an execution process
///
/// Tracks the lifecycle state of a running or completed process.
///
/// # Serialization
/// Serialized as lowercase strings: "running", "completed", "failed", "killed"
#[typeshare]
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, Hash)]
#[serde(rename_all = "lowercase")]
pub enum ProcessStatus {
    /// Process is currently running
    Running,
    /// Process completed successfully (exit code 0)
    Completed,
    /// Process failed (non-zero exit code)
    Failed,
    /// Process was manually killed/terminated
    Killed,
}

impl Default for ProcessStatus {
    fn default() -> Self {
        Self::Running
    }
}

impl std::fmt::Display for ProcessStatus {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            ProcessStatus::Running => write!(f, "running"),
            ProcessStatus::Completed => write!(f, "completed"),
            ProcessStatus::Failed => write!(f, "failed"),
            ProcessStatus::Killed => write!(f, "killed"),
        }
    }
}

impl std::str::FromStr for ProcessStatus {
    type Err = String;

    fn from_str(s: &str) -> Result<Self, Self::Err> {
        match s.to_lowercase().as_str() {
            "running" => Ok(ProcessStatus::Running),
            "completed" => Ok(ProcessStatus::Completed),
            "failed" => Ok(ProcessStatus::Failed),
            "killed" => Ok(ProcessStatus::Killed),
            _ => Err(format!("Invalid process status: {}", s)),
        }
    }
}

impl TryFrom<String> for ProcessStatus {
    type Error = String;

    fn try_from(s: String) -> Result<Self, Self::Error> {
        s.parse()
    }
}

impl ProcessStatus {
    /// Check if the process is currently running
    pub fn is_running(&self) -> bool {
        matches!(self, ProcessStatus::Running)
    }

    /// Check if the process completed successfully
    pub fn is_completed(&self) -> bool {
        matches!(self, ProcessStatus::Completed)
    }

    /// Check if the process failed
    pub fn is_failed(&self) -> bool {
        matches!(self, ProcessStatus::Failed)
    }

    /// Check if the process was killed
    pub fn is_killed(&self) -> bool {
        matches!(self, ProcessStatus::Killed)
    }

    /// Check if the process has finished (not running)
    pub fn is_finished(&self) -> bool {
        !self.is_running()
    }

    /// Check if the process ended with an error (failed or killed)
    pub fn is_error(&self) -> bool {
        matches!(self, ProcessStatus::Failed | ProcessStatus::Killed)
    }

    /// Get all possible process status values
    pub fn all() -> &'static [ProcessStatus] {
        &[
            ProcessStatus::Running,
            ProcessStatus::Completed,
            ProcessStatus::Failed,
            ProcessStatus::Killed,
        ]
    }
}

// =============================================================================
// Run Reason Enum
// =============================================================================

/// Reason why a process was started
///
/// Categorizes processes by their purpose within the workflow.
///
/// # Serialization
/// Serialized as lowercase strings: "setupscript", "cleanupscript", etc.
#[typeshare]
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, Hash)]
#[serde(rename_all = "lowercase")]
pub enum RunReason {
    /// Setup script executed when creating a worktree
    Setupscript,
    /// Cleanup script executed when deleting a worktree
    Cleanupscript,
    /// Coding agent (Claude Code, Gemini CLI, etc.)
    Codingagent,
    /// Development server process
    Devserver,
    /// Interactive terminal session
    Terminal,
    /// Verification/test script
    Verification,
}

impl Default for RunReason {
    fn default() -> Self {
        Self::Terminal
    }
}

impl std::fmt::Display for RunReason {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            RunReason::Setupscript => write!(f, "setupscript"),
            RunReason::Cleanupscript => write!(f, "cleanupscript"),
            RunReason::Codingagent => write!(f, "codingagent"),
            RunReason::Devserver => write!(f, "devserver"),
            RunReason::Terminal => write!(f, "terminal"),
            RunReason::Verification => write!(f, "verification"),
        }
    }
}

impl std::str::FromStr for RunReason {
    type Err = String;

    fn from_str(s: &str) -> Result<Self, Self::Err> {
        match s.to_lowercase().as_str() {
            "setupscript" => Ok(RunReason::Setupscript),
            "cleanupscript" => Ok(RunReason::Cleanupscript),
            "codingagent" => Ok(RunReason::Codingagent),
            "devserver" => Ok(RunReason::Devserver),
            "terminal" => Ok(RunReason::Terminal),
            "verification" => Ok(RunReason::Verification),
            _ => Err(format!("Invalid run reason: {}", s)),
        }
    }
}

impl TryFrom<String> for RunReason {
    type Error = String;

    fn try_from(s: String) -> Result<Self, Self::Error> {
        s.parse()
    }
}

impl RunReason {
    /// Check if this is a setup script
    pub fn is_setup_script(&self) -> bool {
        matches!(self, RunReason::Setupscript)
    }

    /// Check if this is a cleanup script
    pub fn is_cleanup_script(&self) -> bool {
        matches!(self, RunReason::Cleanupscript)
    }

    /// Check if this is a coding agent
    pub fn is_coding_agent(&self) -> bool {
        matches!(self, RunReason::Codingagent)
    }

    /// Check if this is a dev server
    pub fn is_dev_server(&self) -> bool {
        matches!(self, RunReason::Devserver)
    }

    /// Check if this is a terminal session
    pub fn is_terminal(&self) -> bool {
        matches!(self, RunReason::Terminal)
    }

    /// Check if this is a verification process
    pub fn is_verification(&self) -> bool {
        matches!(self, RunReason::Verification)
    }

    /// Check if this is a script (setup or cleanup)
    pub fn is_script(&self) -> bool {
        matches!(self, RunReason::Setupscript | RunReason::Cleanupscript)
    }

    /// Get all possible run reason values
    pub fn all() -> &'static [RunReason] {
        &[
            RunReason::Setupscript,
            RunReason::Cleanupscript,
            RunReason::Codingagent,
            RunReason::Devserver,
            RunReason::Terminal,
            RunReason::Verification,
        ]
    }
}

// =============================================================================
// Output Type Enum
// =============================================================================

/// Type of output from a process (stdout or stderr)
///
/// Used when streaming process output to distinguish between
/// standard output and error streams.
///
/// # Serialization
/// Serialized as lowercase strings: "stdout", "stderr"
#[typeshare]
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, Hash)]
#[serde(rename_all = "lowercase")]
pub enum OutputType {
    /// Standard output stream
    Stdout,
    /// Standard error stream
    Stderr,
}

impl Default for OutputType {
    fn default() -> Self {
        Self::Stdout
    }
}

impl std::fmt::Display for OutputType {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            OutputType::Stdout => write!(f, "stdout"),
            OutputType::Stderr => write!(f, "stderr"),
        }
    }
}

impl std::str::FromStr for OutputType {
    type Err = String;

    fn from_str(s: &str) -> Result<Self, Self::Err> {
        match s.to_lowercase().as_str() {
            "stdout" => Ok(OutputType::Stdout),
            "stderr" => Ok(OutputType::Stderr),
            _ => Err(format!("Invalid output type: {}", s)),
        }
    }
}

impl TryFrom<String> for OutputType {
    type Error = String;

    fn try_from(s: String) -> Result<Self, Self::Error> {
        s.parse()
    }
}

impl OutputType {
    /// Check if this is stdout
    pub fn is_stdout(&self) -> bool {
        matches!(self, OutputType::Stdout)
    }

    /// Check if this is stderr
    pub fn is_stderr(&self) -> bool {
        matches!(self, OutputType::Stderr)
    }

    /// Get all possible output type values
    pub fn all() -> &'static [OutputType] {
        &[OutputType::Stdout, OutputType::Stderr]
    }
}

// =============================================================================
// Execution Process Entity
// =============================================================================

/// An execution process represents a running or completed CLI process
///
/// Processes are associated with a chat session and track the full lifecycle
/// of command execution, including git state before/after, exit codes, and
/// timing information.
///
/// # Database
/// @entity
/// @table: execution_processes
///
/// # Example
/// ```json
/// {
///   "id": "550e8400-e29b-41d4-a716-446655440000",
///   "chatId": "660e8400-e29b-41d4-a716-446655440001",
///   "executorProfileId": "770e8400-e29b-41d4-a716-446655440002",
///   "status": "completed",
///   "exitCode": 0,
///   "executorAction": "Run claude-code with task instructions",
///   "runReason": "codingagent",
///   "beforeHeadCommit": "abc123",
///   "afterHeadCommit": "def456",
///   "pid": 12345,
///   "startedAt": "2024-01-15T10:30:00Z",
///   "completedAt": "2024-01-15T10:35:00Z",
///   "createdAt": "2024-01-15T10:30:00Z",
///   "updatedAt": "2024-01-15T10:35:00Z"
/// }
/// ```
#[typeshare]
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct ExecutionProcess {
    /// Unique identifier (UUID v4)
    /// @validate: format=uuid
    pub id: String,

    /// Parent chat ID (required)
    /// @validate: required, format=uuid
    pub chat_id: String,

    /// Executor profile ID (optional, for coding agents)
    /// @validate: format=uuid
    pub executor_profile_id: Option<String>,

    /// Current status of the process
    pub status: ProcessStatus,

    /// Exit code when process completes
    /// 0 = success, non-zero = failure
    pub exit_code: Option<i32>,

    /// Description of what action triggered this process
    /// @validate: max_length=1000
    pub executor_action: String,

    /// Reason why this process was started
    pub run_reason: RunReason,

    /// Git HEAD commit hash before execution started
    /// Used to track what changes the process made
    /// @validate: max_length=40
    pub before_head_commit: Option<String>,

    /// Git HEAD commit hash after execution completed
    /// @validate: max_length=40
    pub after_head_commit: Option<String>,

    /// OS process ID (PID)
    /// Available while the process is running
    pub pid: Option<i32>,

    /// When the process started (ISO 8601)
    pub started_at: String,

    /// When the process completed (ISO 8601)
    /// None if still running
    pub completed_at: Option<String>,

    /// When the record was created (ISO 8601)
    pub created_at: String,

    /// When the record was last updated (ISO 8601)
    pub updated_at: String,
}

impl ExecutionProcess {
    /// Check if the process is currently running
    pub fn is_running(&self) -> bool {
        self.status.is_running()
    }

    /// Check if the process has finished
    pub fn is_finished(&self) -> bool {
        self.status.is_finished()
    }

    /// Check if the process completed successfully
    pub fn is_successful(&self) -> bool {
        self.status.is_completed() && self.exit_code == Some(0)
    }

    /// Check if the process failed
    pub fn is_failed(&self) -> bool {
        self.status.is_failed() || (self.status.is_completed() && self.exit_code != Some(0))
    }

    /// Check if the process was killed
    pub fn is_killed(&self) -> bool {
        self.status.is_killed()
    }

    /// Check if the process is a coding agent
    pub fn is_coding_agent(&self) -> bool {
        self.run_reason.is_coding_agent()
    }

    /// Check if the process is a script
    pub fn is_script(&self) -> bool {
        self.run_reason.is_script()
    }

    /// Check if the process has an associated executor profile
    pub fn has_executor_profile(&self) -> bool {
        self.executor_profile_id.is_some()
    }

    /// Check if git commits were made during execution
    pub fn has_git_changes(&self) -> bool {
        match (&self.before_head_commit, &self.after_head_commit) {
            (Some(before), Some(after)) => before != after,
            _ => false,
        }
    }

    /// Get the exit code if available
    pub fn get_exit_code(&self) -> Option<i32> {
        self.exit_code
    }

    /// Get the PID if the process is running
    pub fn get_pid(&self) -> Option<i32> {
        if self.is_running() {
            self.pid
        } else {
            None
        }
    }
}

// =============================================================================
// Process Summary (for list views)
// =============================================================================

/// A lightweight process summary for list views
///
/// Contains only essential fields for displaying in process lists.
///
/// @derived_from: ExecutionProcess
#[typeshare]
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct ProcessSummary {
    /// Unique identifier
    pub id: String,

    /// Parent chat ID
    pub chat_id: String,

    /// Current status
    pub status: ProcessStatus,

    /// Exit code (if completed)
    pub exit_code: Option<i32>,

    /// Brief description of the action
    pub executor_action: String,

    /// Reason for running
    pub run_reason: RunReason,

    /// OS process ID (if running)
    pub pid: Option<i32>,

    /// When the process started
    pub started_at: String,

    /// When the process completed
    pub completed_at: Option<String>,
}

impl From<ExecutionProcess> for ProcessSummary {
    fn from(process: ExecutionProcess) -> Self {
        Self {
            id: process.id,
            chat_id: process.chat_id,
            status: process.status,
            exit_code: process.exit_code,
            executor_action: process.executor_action,
            run_reason: process.run_reason,
            pid: process.pid,
            started_at: process.started_at,
            completed_at: process.completed_at,
        }
    }
}

impl From<&ExecutionProcess> for ProcessSummary {
    fn from(process: &ExecutionProcess) -> Self {
        Self {
            id: process.id.clone(),
            chat_id: process.chat_id.clone(),
            status: process.status.clone(),
            exit_code: process.exit_code,
            executor_action: process.executor_action.clone(),
            run_reason: process.run_reason.clone(),
            pid: process.pid,
            started_at: process.started_at.clone(),
            completed_at: process.completed_at.clone(),
        }
    }
}

// =============================================================================
// Process Output Event
// =============================================================================

/// Event emitted when process output is received
///
/// Used for streaming output to the frontend via WebSocket or Tauri events.
/// Each event contains a chunk of output from either stdout or stderr.
///
/// @channel: process-output-{process_id}
#[typeshare]
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct ProcessOutputEvent {
    /// Process ID this output belongs to
    pub process_id: String,

    /// Type of output (stdout or stderr)
    pub output_type: OutputType,

    /// Output content
    pub content: String,

    /// Timestamp when output was received (ISO 8601)
    pub timestamp: String,
}

impl ProcessOutputEvent {
    /// Create a new stdout output event
    pub fn stdout(process_id: impl Into<String>, content: impl Into<String>) -> Self {
        Self {
            process_id: process_id.into(),
            output_type: OutputType::Stdout,
            content: content.into(),
            timestamp: chrono::Utc::now().to_rfc3339(),
        }
    }

    /// Create a new stderr output event
    pub fn stderr(process_id: impl Into<String>, content: impl Into<String>) -> Self {
        Self {
            process_id: process_id.into(),
            output_type: OutputType::Stderr,
            content: content.into(),
            timestamp: chrono::Utc::now().to_rfc3339(),
        }
    }

    /// Check if this is stdout
    pub fn is_stdout(&self) -> bool {
        self.output_type.is_stdout()
    }

    /// Check if this is stderr
    pub fn is_stderr(&self) -> bool {
        self.output_type.is_stderr()
    }
}

// =============================================================================
// Process Status Event
// =============================================================================

/// Event emitted when process status changes
///
/// Used for notifying the frontend of process lifecycle events like
/// completion, failure, or being killed.
///
/// @channel: process-status-{process_id}
#[typeshare]
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct ProcessStatusEvent {
    /// Process ID this status change belongs to
    pub process_id: String,

    /// New status of the process
    pub status: ProcessStatus,

    /// Exit code (if process finished)
    pub exit_code: Option<i32>,
}

impl ProcessStatusEvent {
    /// Create a new running status event
    pub fn running(process_id: impl Into<String>) -> Self {
        Self {
            process_id: process_id.into(),
            status: ProcessStatus::Running,
            exit_code: None,
        }
    }

    /// Create a new completed status event
    pub fn completed(process_id: impl Into<String>, exit_code: i32) -> Self {
        Self {
            process_id: process_id.into(),
            status: if exit_code == 0 {
                ProcessStatus::Completed
            } else {
                ProcessStatus::Failed
            },
            exit_code: Some(exit_code),
        }
    }

    /// Create a new killed status event
    pub fn killed(process_id: impl Into<String>) -> Self {
        Self {
            process_id: process_id.into(),
            status: ProcessStatus::Killed,
            exit_code: None,
        }
    }
}

// =============================================================================
// Validation Implementation
// =============================================================================

impl Validate for ExecutionProcess {
    fn validate(&self) -> ValidationResult<()> {
        ValidationCollector::new()
            .validate(|| validate_required_string("id", &self.id))
            .validate(|| validate_required_string("chat_id", &self.chat_id))
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
// Tests
// =============================================================================

#[cfg(test)]
mod tests {
    use super::*;

    fn create_test_process() -> ExecutionProcess {
        ExecutionProcess {
            id: "550e8400-e29b-41d4-a716-446655440000".to_string(),
            chat_id: "660e8400-e29b-41d4-a716-446655440001".to_string(),
            executor_profile_id: Some("770e8400-e29b-41d4-a716-446655440002".to_string()),
            status: ProcessStatus::Running,
            exit_code: None,
            executor_action: "Run claude-code with task instructions".to_string(),
            run_reason: RunReason::Codingagent,
            before_head_commit: Some("abc123".to_string()),
            after_head_commit: None,
            pid: Some(12345),
            started_at: "2024-01-15T10:30:00Z".to_string(),
            completed_at: None,
            created_at: "2024-01-15T10:30:00Z".to_string(),
            updated_at: "2024-01-15T10:30:00Z".to_string(),
        }
    }

    fn create_completed_process() -> ExecutionProcess {
        ExecutionProcess {
            id: "550e8400-e29b-41d4-a716-446655440000".to_string(),
            chat_id: "660e8400-e29b-41d4-a716-446655440001".to_string(),
            executor_profile_id: Some("770e8400-e29b-41d4-a716-446655440002".to_string()),
            status: ProcessStatus::Completed,
            exit_code: Some(0),
            executor_action: "Run setup script".to_string(),
            run_reason: RunReason::Setupscript,
            before_head_commit: Some("abc123".to_string()),
            after_head_commit: Some("def456".to_string()),
            pid: None,
            started_at: "2024-01-15T10:30:00Z".to_string(),
            completed_at: Some("2024-01-15T10:35:00Z".to_string()),
            created_at: "2024-01-15T10:30:00Z".to_string(),
            updated_at: "2024-01-15T10:35:00Z".to_string(),
        }
    }

    // =========================================================================
    // ProcessStatus Tests
    // =========================================================================

    #[test]
    fn test_process_status_display() {
        assert_eq!(ProcessStatus::Running.to_string(), "running");
        assert_eq!(ProcessStatus::Completed.to_string(), "completed");
        assert_eq!(ProcessStatus::Failed.to_string(), "failed");
        assert_eq!(ProcessStatus::Killed.to_string(), "killed");
    }

    #[test]
    fn test_process_status_from_str() {
        assert_eq!(
            "running".parse::<ProcessStatus>().unwrap(),
            ProcessStatus::Running
        );
        assert_eq!(
            "completed".parse::<ProcessStatus>().unwrap(),
            ProcessStatus::Completed
        );
        assert_eq!(
            "failed".parse::<ProcessStatus>().unwrap(),
            ProcessStatus::Failed
        );
        assert_eq!(
            "killed".parse::<ProcessStatus>().unwrap(),
            ProcessStatus::Killed
        );
        assert_eq!(
            "RUNNING".parse::<ProcessStatus>().unwrap(),
            ProcessStatus::Running
        );
        assert!("invalid".parse::<ProcessStatus>().is_err());
    }

    #[test]
    fn test_process_status_is_methods() {
        assert!(ProcessStatus::Running.is_running());
        assert!(!ProcessStatus::Running.is_finished());

        assert!(ProcessStatus::Completed.is_completed());
        assert!(ProcessStatus::Completed.is_finished());

        assert!(ProcessStatus::Failed.is_failed());
        assert!(ProcessStatus::Failed.is_error());

        assert!(ProcessStatus::Killed.is_killed());
        assert!(ProcessStatus::Killed.is_error());
    }

    #[test]
    fn test_process_status_all() {
        let all = ProcessStatus::all();
        assert_eq!(all.len(), 4);
        assert!(all.contains(&ProcessStatus::Running));
        assert!(all.contains(&ProcessStatus::Completed));
        assert!(all.contains(&ProcessStatus::Failed));
        assert!(all.contains(&ProcessStatus::Killed));
    }

    #[test]
    fn test_process_status_default() {
        assert_eq!(ProcessStatus::default(), ProcessStatus::Running);
    }

    #[test]
    fn test_process_status_serialization() {
        let status = ProcessStatus::Completed;
        let json = serde_json::to_string(&status).unwrap();
        assert_eq!(json, "\"completed\"");

        let deserialized: ProcessStatus = serde_json::from_str(&json).unwrap();
        assert_eq!(deserialized, ProcessStatus::Completed);
    }

    // =========================================================================
    // RunReason Tests
    // =========================================================================

    #[test]
    fn test_run_reason_display() {
        assert_eq!(RunReason::Setupscript.to_string(), "setupscript");
        assert_eq!(RunReason::Cleanupscript.to_string(), "cleanupscript");
        assert_eq!(RunReason::Codingagent.to_string(), "codingagent");
        assert_eq!(RunReason::Devserver.to_string(), "devserver");
        assert_eq!(RunReason::Terminal.to_string(), "terminal");
        assert_eq!(RunReason::Verification.to_string(), "verification");
    }

    #[test]
    fn test_run_reason_from_str() {
        assert_eq!(
            "setupscript".parse::<RunReason>().unwrap(),
            RunReason::Setupscript
        );
        assert_eq!(
            "codingagent".parse::<RunReason>().unwrap(),
            RunReason::Codingagent
        );
        assert_eq!(
            "TERMINAL".parse::<RunReason>().unwrap(),
            RunReason::Terminal
        );
        assert!("invalid".parse::<RunReason>().is_err());
    }

    #[test]
    fn test_run_reason_is_methods() {
        assert!(RunReason::Setupscript.is_setup_script());
        assert!(RunReason::Setupscript.is_script());

        assert!(RunReason::Cleanupscript.is_cleanup_script());
        assert!(RunReason::Cleanupscript.is_script());

        assert!(RunReason::Codingagent.is_coding_agent());
        assert!(!RunReason::Codingagent.is_script());

        assert!(RunReason::Devserver.is_dev_server());
        assert!(RunReason::Terminal.is_terminal());
        assert!(RunReason::Verification.is_verification());
    }

    #[test]
    fn test_run_reason_all() {
        let all = RunReason::all();
        assert_eq!(all.len(), 6);
    }

    #[test]
    fn test_run_reason_serialization() {
        let reason = RunReason::Codingagent;
        let json = serde_json::to_string(&reason).unwrap();
        assert_eq!(json, "\"codingagent\"");

        let deserialized: RunReason = serde_json::from_str(&json).unwrap();
        assert_eq!(deserialized, RunReason::Codingagent);
    }

    // =========================================================================
    // OutputType Tests
    // =========================================================================

    #[test]
    fn test_output_type_display() {
        assert_eq!(OutputType::Stdout.to_string(), "stdout");
        assert_eq!(OutputType::Stderr.to_string(), "stderr");
    }

    #[test]
    fn test_output_type_from_str() {
        assert_eq!("stdout".parse::<OutputType>().unwrap(), OutputType::Stdout);
        assert_eq!("stderr".parse::<OutputType>().unwrap(), OutputType::Stderr);
        assert_eq!("STDOUT".parse::<OutputType>().unwrap(), OutputType::Stdout);
        assert!("invalid".parse::<OutputType>().is_err());
    }

    #[test]
    fn test_output_type_is_methods() {
        assert!(OutputType::Stdout.is_stdout());
        assert!(!OutputType::Stdout.is_stderr());

        assert!(OutputType::Stderr.is_stderr());
        assert!(!OutputType::Stderr.is_stdout());
    }

    #[test]
    fn test_output_type_all() {
        let all = OutputType::all();
        assert_eq!(all.len(), 2);
    }

    #[test]
    fn test_output_type_serialization() {
        let output = OutputType::Stderr;
        let json = serde_json::to_string(&output).unwrap();
        assert_eq!(json, "\"stderr\"");

        let deserialized: OutputType = serde_json::from_str(&json).unwrap();
        assert_eq!(deserialized, OutputType::Stderr);
    }

    // =========================================================================
    // ExecutionProcess Tests
    // =========================================================================

    #[test]
    fn test_execution_process_is_running() {
        let running = create_test_process();
        assert!(running.is_running());
        assert!(!running.is_finished());

        let completed = create_completed_process();
        assert!(!completed.is_running());
        assert!(completed.is_finished());
    }

    #[test]
    fn test_execution_process_is_successful() {
        let mut process = create_completed_process();
        assert!(process.is_successful());

        process.exit_code = Some(1);
        assert!(!process.is_successful());
    }

    #[test]
    fn test_execution_process_is_failed() {
        let mut process = create_completed_process();
        process.status = ProcessStatus::Failed;
        process.exit_code = Some(1);
        assert!(process.is_failed());

        process.status = ProcessStatus::Completed;
        process.exit_code = Some(1);
        assert!(process.is_failed());

        process.exit_code = Some(0);
        assert!(!process.is_failed());
    }

    #[test]
    fn test_execution_process_is_coding_agent() {
        let process = create_test_process();
        assert!(process.is_coding_agent());
        assert!(!process.is_script());

        let script = create_completed_process();
        assert!(!script.is_coding_agent());
        assert!(script.is_script());
    }

    #[test]
    fn test_execution_process_has_executor_profile() {
        let with_profile = create_test_process();
        assert!(with_profile.has_executor_profile());

        let mut without = create_test_process();
        without.executor_profile_id = None;
        assert!(!without.has_executor_profile());
    }

    #[test]
    fn test_execution_process_has_git_changes() {
        let process = create_completed_process();
        assert!(process.has_git_changes());

        let running = create_test_process();
        assert!(!running.has_git_changes()); // after_head_commit is None

        let mut no_changes = create_completed_process();
        no_changes.after_head_commit = no_changes.before_head_commit.clone();
        assert!(!no_changes.has_git_changes());
    }

    #[test]
    fn test_execution_process_get_pid() {
        let running = create_test_process();
        assert_eq!(running.get_pid(), Some(12345));

        let completed = create_completed_process();
        assert_eq!(completed.get_pid(), None);
    }

    #[test]
    fn test_execution_process_validation_valid() {
        let process = create_test_process();
        assert!(process.validate().is_ok());
    }

    #[test]
    fn test_execution_process_validation_empty_id() {
        let mut process = create_test_process();
        process.id = String::new();
        assert!(process.validate().is_err());
    }

    #[test]
    fn test_execution_process_validation_empty_chat_id() {
        let mut process = create_test_process();
        process.chat_id = String::new();
        assert!(process.validate().is_err());
    }

    #[test]
    fn test_execution_process_validation_action_too_long() {
        let mut process = create_test_process();
        process.executor_action = "a".repeat(1001);
        assert!(process.validate().is_err());
    }

    #[test]
    fn test_execution_process_validation_commit_too_long() {
        let mut process = create_test_process();
        process.before_head_commit = Some("a".repeat(41));
        assert!(process.validate().is_err());
    }

    #[test]
    fn test_execution_process_serialization() {
        let process = create_test_process();
        let json = serde_json::to_string(&process).unwrap();

        // Verify camelCase serialization
        assert!(json.contains("\"chatId\""));
        assert!(json.contains("\"executorProfileId\""));
        assert!(json.contains("\"exitCode\""));
        assert!(json.contains("\"executorAction\""));
        assert!(json.contains("\"runReason\""));
        assert!(json.contains("\"beforeHeadCommit\""));
        assert!(json.contains("\"startedAt\""));
        assert!(json.contains("\"completedAt\""));
        assert!(json.contains("\"createdAt\""));
        assert!(json.contains("\"updatedAt\""));

        // Verify round-trip
        let deserialized: ExecutionProcess = serde_json::from_str(&json).unwrap();
        assert_eq!(process, deserialized);
    }

    // =========================================================================
    // ProcessSummary Tests
    // =========================================================================

    #[test]
    fn test_process_summary_from_process() {
        let process = create_test_process();
        let summary: ProcessSummary = process.clone().into();

        assert_eq!(summary.id, process.id);
        assert_eq!(summary.chat_id, process.chat_id);
        assert_eq!(summary.status, process.status);
        assert_eq!(summary.exit_code, process.exit_code);
        assert_eq!(summary.executor_action, process.executor_action);
        assert_eq!(summary.run_reason, process.run_reason);
        assert_eq!(summary.pid, process.pid);
        assert_eq!(summary.started_at, process.started_at);
        assert_eq!(summary.completed_at, process.completed_at);
    }

    #[test]
    fn test_process_summary_from_reference() {
        let process = create_test_process();
        let summary: ProcessSummary = (&process).into();

        assert_eq!(summary.id, process.id);
        assert_eq!(summary.chat_id, process.chat_id);
    }

    #[test]
    fn test_process_summary_serialization() {
        let process = create_test_process();
        let summary: ProcessSummary = process.into();
        let json = serde_json::to_string(&summary).unwrap();

        assert!(json.contains("\"chatId\""));
        assert!(json.contains("\"executorAction\""));
        assert!(json.contains("\"runReason\""));

        let deserialized: ProcessSummary = serde_json::from_str(&json).unwrap();
        assert_eq!(summary, deserialized);
    }

    // =========================================================================
    // ProcessOutputEvent Tests
    // =========================================================================

    #[test]
    fn test_process_output_event_stdout() {
        let event = ProcessOutputEvent::stdout("process-123", "Hello, world!");

        assert_eq!(event.process_id, "process-123");
        assert!(event.is_stdout());
        assert!(!event.is_stderr());
        assert_eq!(event.content, "Hello, world!");
        assert!(!event.timestamp.is_empty());
    }

    #[test]
    fn test_process_output_event_stderr() {
        let event = ProcessOutputEvent::stderr("process-123", "Error occurred");

        assert!(event.is_stderr());
        assert!(!event.is_stdout());
        assert_eq!(event.content, "Error occurred");
    }

    #[test]
    fn test_process_output_event_serialization() {
        let event = ProcessOutputEvent::stdout("process-123", "output");
        let json = serde_json::to_string(&event).unwrap();

        assert!(json.contains("\"processId\":\"process-123\""));
        assert!(json.contains("\"outputType\":\"stdout\""));
        assert!(json.contains("\"content\":\"output\""));
        assert!(json.contains("\"timestamp\""));

        let deserialized: ProcessOutputEvent = serde_json::from_str(&json).unwrap();
        assert_eq!(event, deserialized);
    }

    // =========================================================================
    // ProcessStatusEvent Tests
    // =========================================================================

    #[test]
    fn test_process_status_event_running() {
        let event = ProcessStatusEvent::running("process-123");

        assert_eq!(event.process_id, "process-123");
        assert_eq!(event.status, ProcessStatus::Running);
        assert_eq!(event.exit_code, None);
    }

    #[test]
    fn test_process_status_event_completed_success() {
        let event = ProcessStatusEvent::completed("process-123", 0);

        assert_eq!(event.status, ProcessStatus::Completed);
        assert_eq!(event.exit_code, Some(0));
    }

    #[test]
    fn test_process_status_event_completed_failure() {
        let event = ProcessStatusEvent::completed("process-123", 1);

        assert_eq!(event.status, ProcessStatus::Failed);
        assert_eq!(event.exit_code, Some(1));
    }

    #[test]
    fn test_process_status_event_killed() {
        let event = ProcessStatusEvent::killed("process-123");

        assert_eq!(event.status, ProcessStatus::Killed);
        assert_eq!(event.exit_code, None);
    }

    #[test]
    fn test_process_status_event_serialization() {
        let event = ProcessStatusEvent::completed("process-123", 0);
        let json = serde_json::to_string(&event).unwrap();

        assert!(json.contains("\"processId\":\"process-123\""));
        assert!(json.contains("\"status\":\"completed\""));
        assert!(json.contains("\"exitCode\":0"));

        let deserialized: ProcessStatusEvent = serde_json::from_str(&json).unwrap();
        assert_eq!(event, deserialized);
    }
}
