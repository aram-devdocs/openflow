use serde::{Deserialize, Serialize};
use typeshare::typeshare;

/// Status of an execution process.
#[typeshare]
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum ProcessStatus {
    Running,
    Completed,
    Failed,
    Killed,
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

/// Reason why a process was started.
#[typeshare]
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum RunReason {
    Setupscript,
    Cleanupscript,
    Codingagent,
    Devserver,
    Terminal,
    Verification,
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

/// Type of output from a process (stdout or stderr).
#[typeshare]
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum OutputType {
    Stdout,
    Stderr,
}

impl std::fmt::Display for OutputType {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            OutputType::Stdout => write!(f, "stdout"),
            OutputType::Stderr => write!(f, "stderr"),
        }
    }
}

/// An execution process represents a running or completed CLI process.
/// Processes are associated with a chat and track the execution lifecycle.
#[typeshare]
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ExecutionProcess {
    pub id: String,
    pub chat_id: String,
    pub executor_profile_id: Option<String>,
    pub status: ProcessStatus,
    pub exit_code: Option<i32>,
    /// Description of what action triggered this process
    pub executor_action: String,
    pub run_reason: RunReason,
    /// Git HEAD commit hash before execution started
    pub before_head_commit: Option<String>,
    /// Git HEAD commit hash after execution completed
    pub after_head_commit: Option<String>,
    /// OS process ID
    pub pid: Option<i32>,
    pub started_at: String,
    pub completed_at: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}

/// Event emitted when process output is received.
/// Used for streaming output to the frontend via Tauri events.
#[typeshare]
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ProcessOutputEvent {
    pub process_id: String,
    pub output_type: OutputType,
    pub content: String,
    pub timestamp: String,
}

/// Event emitted when process status changes.
/// Used for notifying the frontend of process lifecycle events.
#[typeshare]
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ProcessStatusEvent {
    pub process_id: String,
    pub status: ProcessStatus,
    pub exit_code: Option<i32>,
}
