//! Tool State Entity
//!
//! Tracks the lifecycle state of tool calls during Claude Code execution.
//! Each tool call transitions through Pending → Running → Complete/Error.

use serde::{Deserialize, Serialize};
use typeshare::typeshare;

// =============================================================================
// Tool Status Enum
// =============================================================================

/// Status of a tool call
///
/// Tracks the lifecycle state of a tool call.
///
/// # Serialization
/// Serialized as lowercase strings: "pending", "running", "complete", "error"
#[typeshare]
#[derive(Debug, Clone, Default, Serialize, Deserialize, PartialEq, Eq, Hash)]
#[serde(rename_all = "lowercase")]
pub enum ToolStatus {
    /// Tool call received but not yet started
    #[default]
    Pending,
    /// Tool is currently executing
    Running,
    /// Tool completed successfully
    Complete,
    /// Tool execution failed
    Error,
}

impl std::fmt::Display for ToolStatus {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            ToolStatus::Pending => write!(f, "pending"),
            ToolStatus::Running => write!(f, "running"),
            ToolStatus::Complete => write!(f, "complete"),
            ToolStatus::Error => write!(f, "error"),
        }
    }
}

impl std::str::FromStr for ToolStatus {
    type Err = String;

    fn from_str(s: &str) -> Result<Self, Self::Err> {
        match s.to_lowercase().as_str() {
            "pending" => Ok(ToolStatus::Pending),
            "running" => Ok(ToolStatus::Running),
            "complete" => Ok(ToolStatus::Complete),
            "error" => Ok(ToolStatus::Error),
            _ => Err(format!("Invalid tool status: {}", s)),
        }
    }
}

impl TryFrom<String> for ToolStatus {
    type Error = String;

    fn try_from(s: String) -> Result<Self, <Self as TryFrom<String>>::Error> {
        s.parse()
    }
}

impl ToolStatus {
    /// Check if the tool is pending
    pub fn is_pending(&self) -> bool {
        matches!(self, ToolStatus::Pending)
    }

    /// Check if the tool is running
    pub fn is_running(&self) -> bool {
        matches!(self, ToolStatus::Running)
    }

    /// Check if the tool completed successfully
    pub fn is_complete(&self) -> bool {
        matches!(self, ToolStatus::Complete)
    }

    /// Check if the tool errored
    pub fn is_error(&self) -> bool {
        matches!(self, ToolStatus::Error)
    }

    /// Check if the tool has finished (complete or error)
    pub fn is_finished(&self) -> bool {
        matches!(self, ToolStatus::Complete | ToolStatus::Error)
    }

    /// Get all possible tool status values
    pub fn all() -> &'static [ToolStatus] {
        &[
            ToolStatus::Pending,
            ToolStatus::Running,
            ToolStatus::Complete,
            ToolStatus::Error,
        ]
    }
}

// =============================================================================
// Tool State Entity
// =============================================================================

/// State of a tool call during execution
///
/// Tracks a tool call from when it's first seen in the Claude output
/// through to completion or error. Used for real-time UI updates.
///
/// # Channels
/// @channel: tool-state-{process_id}
#[typeshare]
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct ToolState {
    /// Unique tool call ID (from Claude's tool_use block)
    pub id: String,

    /// Name of the tool (e.g., "Read", "Write", "Bash")
    pub name: String,

    /// Current status of the tool call
    pub status: ToolStatus,

    /// Tool input arguments as JSON
    pub input: Option<serde_json::Value>,

    /// Tool output/result as string
    pub output: Option<String>,

    /// Whether the tool output is an error
    pub is_error: bool,

    /// When the tool call was first seen (ISO 8601)
    pub started_at: String,

    /// When the tool completed (ISO 8601)
    pub completed_at: Option<String>,

    /// Sequence number for ordering
    pub sequence: i32,
}

impl ToolState {
    /// Create a new pending tool state
    pub fn new(id: impl Into<String>, name: impl Into<String>, sequence: i32) -> Self {
        Self {
            id: id.into(),
            name: name.into(),
            status: ToolStatus::Pending,
            input: None,
            output: None,
            is_error: false,
            started_at: chrono::Utc::now().to_rfc3339(),
            completed_at: None,
            sequence,
        }
    }

    /// Create a new tool state with input
    pub fn with_input(
        id: impl Into<String>,
        name: impl Into<String>,
        input: serde_json::Value,
        sequence: i32,
    ) -> Self {
        Self {
            id: id.into(),
            name: name.into(),
            status: ToolStatus::Running,
            input: Some(input),
            output: None,
            is_error: false,
            started_at: chrono::Utc::now().to_rfc3339(),
            completed_at: None,
            sequence,
        }
    }

    /// Mark the tool as running
    pub fn mark_running(&mut self) {
        self.status = ToolStatus::Running;
    }

    /// Mark the tool as complete with output
    pub fn mark_complete(&mut self, output: impl Into<String>) {
        self.status = ToolStatus::Complete;
        self.output = Some(output.into());
        self.is_error = false;
        self.completed_at = Some(chrono::Utc::now().to_rfc3339());
    }

    /// Mark the tool as errored
    pub fn mark_error(&mut self, error: impl Into<String>) {
        self.status = ToolStatus::Error;
        self.output = Some(error.into());
        self.is_error = true;
        self.completed_at = Some(chrono::Utc::now().to_rfc3339());
    }

    /// Check if this tool has finished
    pub fn is_finished(&self) -> bool {
        self.status.is_finished()
    }
}

// =============================================================================
// Tests
// =============================================================================

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_tool_status_display() {
        assert_eq!(ToolStatus::Pending.to_string(), "pending");
        assert_eq!(ToolStatus::Running.to_string(), "running");
        assert_eq!(ToolStatus::Complete.to_string(), "complete");
        assert_eq!(ToolStatus::Error.to_string(), "error");
    }

    #[test]
    fn test_tool_status_from_str() {
        assert_eq!(
            "pending".parse::<ToolStatus>().unwrap(),
            ToolStatus::Pending
        );
        assert_eq!(
            "running".parse::<ToolStatus>().unwrap(),
            ToolStatus::Running
        );
        assert_eq!(
            "complete".parse::<ToolStatus>().unwrap(),
            ToolStatus::Complete
        );
        assert_eq!("error".parse::<ToolStatus>().unwrap(), ToolStatus::Error);
        assert_eq!(
            "PENDING".parse::<ToolStatus>().unwrap(),
            ToolStatus::Pending
        );
        assert!("invalid".parse::<ToolStatus>().is_err());
    }

    #[test]
    fn test_tool_status_is_methods() {
        assert!(ToolStatus::Pending.is_pending());
        assert!(!ToolStatus::Pending.is_finished());

        assert!(ToolStatus::Running.is_running());
        assert!(!ToolStatus::Running.is_finished());

        assert!(ToolStatus::Complete.is_complete());
        assert!(ToolStatus::Complete.is_finished());

        assert!(ToolStatus::Error.is_error());
        assert!(ToolStatus::Error.is_finished());
    }

    #[test]
    fn test_tool_status_all() {
        let all = ToolStatus::all();
        assert_eq!(all.len(), 4);
    }

    #[test]
    fn test_tool_state_new() {
        let state = ToolState::new("tool-123", "Read", 1);
        assert_eq!(state.id, "tool-123");
        assert_eq!(state.name, "Read");
        assert!(state.status.is_pending());
        assert!(state.input.is_none());
        assert!(state.output.is_none());
        assert!(!state.is_error);
        assert!(state.completed_at.is_none());
    }

    #[test]
    fn test_tool_state_with_input() {
        let input = serde_json::json!({"path": "/src/main.rs"});
        let state = ToolState::with_input("tool-123", "Read", input.clone(), 1);

        assert_eq!(state.id, "tool-123");
        assert_eq!(state.name, "Read");
        assert!(state.status.is_running());
        assert_eq!(state.input, Some(input));
    }

    #[test]
    fn test_tool_state_mark_complete() {
        let mut state = ToolState::new("tool-123", "Read", 1);
        state.mark_complete("File contents here");

        assert!(state.status.is_complete());
        assert_eq!(state.output, Some("File contents here".to_string()));
        assert!(!state.is_error);
        assert!(state.completed_at.is_some());
    }

    #[test]
    fn test_tool_state_mark_error() {
        let mut state = ToolState::new("tool-123", "Read", 1);
        state.mark_error("File not found");

        assert!(state.status.is_error());
        assert_eq!(state.output, Some("File not found".to_string()));
        assert!(state.is_error);
        assert!(state.completed_at.is_some());
    }

    #[test]
    fn test_tool_state_serialization() {
        let state = ToolState::new("tool-123", "Read", 1);
        let json = serde_json::to_string(&state).unwrap();

        assert!(json.contains("\"id\":\"tool-123\""));
        assert!(json.contains("\"name\":\"Read\""));
        assert!(json.contains("\"status\":\"pending\""));
        assert!(json.contains("\"startedAt\""));
        assert!(json.contains("\"isError\":false"));
        assert!(json.contains("\"sequence\":1"));

        let deserialized: ToolState = serde_json::from_str(&json).unwrap();
        assert_eq!(state.id, deserialized.id);
        assert_eq!(state.name, deserialized.name);
    }

    #[test]
    fn test_tool_state_event() {
        let state = ToolState::new("tool-123", "Read", 1);
        let event = ToolStateEvent::new("process-456", state.clone());

        assert_eq!(event.process_id, "process-456");
        assert_eq!(event.tool.id, "tool-123");

        let json = serde_json::to_string(&event).unwrap();
        assert!(json.contains("\"processId\":\"process-456\""));
    }
}
