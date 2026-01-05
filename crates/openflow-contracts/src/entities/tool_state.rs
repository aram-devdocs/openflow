//! Tool State Entity
//!
//! Tracks the lifecycle state of tool calls during agent execution.
//! Each tool call transitions through Running → Completed/Error.
//!
//! # Architecture
//!
//! Tool states track individual tool invocations within an agent session:
//!
//! ```text
//! AgentSession (CLI process run)
//!   └── ToolState (individual tool invocation)
//!         ├── tool_use_id (from ToolUse event)
//!         ├── tool_name
//!         ├── input (JSON)
//!         ├── status (running → completed/error)
//!         └── output (when completed)
//! ```
//!
//! # Database
//!
//! Maps to `tool_states` table (migration 009).

use serde::{Deserialize, Serialize};
use typeshare::typeshare;

// =============================================================================
// Tool Status Enum
// =============================================================================

/// Status of a tool call
///
/// Tracks the lifecycle state of a tool call.
///
/// # Database
/// Matches CHECK constraint in tool_states table (migration 009):
/// CHECK (status IN ('running', 'completed', 'error'))
///
/// # Serialization
/// Serialized as lowercase strings matching database values.
#[typeshare]
#[derive(Debug, Clone, Default, Serialize, Deserialize, PartialEq, Eq, Hash, sqlx::Type)]
#[serde(rename_all = "lowercase")]
#[sqlx(rename_all = "lowercase")]
pub enum ToolStatus {
    /// Tool is currently executing
    #[default]
    Running,
    /// Tool completed successfully
    Completed,
    /// Tool execution failed
    Error,
}

impl std::fmt::Display for ToolStatus {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            ToolStatus::Running => write!(f, "running"),
            ToolStatus::Completed => write!(f, "completed"),
            ToolStatus::Error => write!(f, "error"),
        }
    }
}

impl std::str::FromStr for ToolStatus {
    type Err = String;

    fn from_str(s: &str) -> Result<Self, Self::Err> {
        match s.to_lowercase().as_str() {
            "running" | "pending" | "in_progress" => Ok(ToolStatus::Running),
            "completed" | "complete" | "success" | "done" => Ok(ToolStatus::Completed),
            "error" | "failed" | "failure" => Ok(ToolStatus::Error),
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
    /// Check if the tool is running
    pub fn is_running(&self) -> bool {
        matches!(self, ToolStatus::Running)
    }

    /// Check if the tool completed successfully
    pub fn is_completed(&self) -> bool {
        matches!(self, ToolStatus::Completed)
    }

    /// Check if the tool errored
    pub fn is_error(&self) -> bool {
        matches!(self, ToolStatus::Error)
    }

    /// Check if the tool has finished (completed or error)
    pub fn is_finished(&self) -> bool {
        matches!(self, ToolStatus::Completed | ToolStatus::Error)
    }

    /// Check if this is a success status
    pub fn is_success(&self) -> bool {
        matches!(self, ToolStatus::Completed)
    }

    /// Get all possible tool status values
    pub fn all() -> &'static [ToolStatus] {
        &[ToolStatus::Running, ToolStatus::Completed, ToolStatus::Error]
    }
}

// =============================================================================
// Tool State Entity
// =============================================================================

/// State of a tool call during execution
///
/// Tracks a tool call from when it's first seen (ToolUse event) through to
/// completion or error (ToolResult event). Used for real-time UI updates.
///
/// # Database
///
/// Maps directly to `tool_states` table (migration 009):
/// - `id`: Primary key (UUID)
/// - `session_id`: FK to agent_sessions
/// - `tool_use_id`: Tool invocation ID from agent event
/// - `tool_name`: Name of the tool
/// - `input`: JSON blob of input parameters
/// - `status`: running/completed/error
/// - `output`: Tool output
/// - `is_error`: Boolean flag
/// - `started_at`: When tool started
/// - `completed_at`: When tool finished
///
/// # Channels
/// @channel: tool-state-{session_id}
#[typeshare]
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, sqlx::FromRow)]
#[serde(rename_all = "camelCase")]
pub struct ToolState {
    /// Unique database ID (UUID)
    pub id: String,

    /// Session this tool belongs to
    pub session_id: String,

    /// Tool use ID from the agent event (for matching with results)
    pub tool_use_id: String,

    /// Name of the tool (e.g., "Read", "Write", "Bash")
    pub tool_name: String,

    /// Tool input arguments as JSON string
    pub input: Option<String>,

    /// Current status of the tool call
    pub status: ToolStatus,

    /// Tool output/result as string
    pub output: Option<String>,

    /// Whether the tool output is an error (1 = true, 0 = false)
    pub is_error: i32,

    /// When the tool call was started (ISO 8601)
    pub started_at: String,

    /// When the tool completed (ISO 8601)
    pub completed_at: Option<String>,
}

impl ToolState {
    /// Create a new running tool state
    ///
    /// Called when a ToolUse event is received.
    pub fn new(
        session_id: impl Into<String>,
        tool_use_id: impl Into<String>,
        tool_name: impl Into<String>,
        input: Option<serde_json::Value>,
    ) -> Self {
        Self {
            id: uuid::Uuid::new_v4().to_string(),
            session_id: session_id.into(),
            tool_use_id: tool_use_id.into(),
            tool_name: tool_name.into(),
            input: input.map(|v| v.to_string()),
            status: ToolStatus::Running,
            output: None,
            is_error: 0,
            started_at: chrono::Utc::now().to_rfc3339(),
            completed_at: None,
        }
    }

    /// Create a new tool state with input (for in-memory tracking)
    ///
    /// This is a convenience constructor for in-memory tool tracking during
    /// process execution. The tool_use_id is used as both id and tool_use_id.
    ///
    /// # Arguments
    /// * `tool_use_id` - Unique ID for this tool use
    /// * `tool_name` - Name of the tool
    /// * `input` - Input JSON value
    /// * `_sequence` - Sequence number (ignored, for API compatibility)
    pub fn with_input(
        tool_use_id: impl Into<String>,
        tool_name: impl Into<String>,
        input: serde_json::Value,
        _sequence: i32,
    ) -> Self {
        let tool_use_id = tool_use_id.into();
        Self {
            id: tool_use_id.clone(),
            session_id: String::new(), // Will be set later when persisted
            tool_use_id,
            tool_name: tool_name.into(),
            input: Some(input.to_string()),
            status: ToolStatus::Running,
            output: None,
            is_error: 0,
            started_at: chrono::Utc::now().to_rfc3339(),
            completed_at: None,
        }
    }

    /// Mark the tool as completed with output
    pub fn mark_completed(&mut self, output: impl Into<String>) {
        self.status = ToolStatus::Completed;
        self.output = Some(output.into());
        self.is_error = 0;
        self.completed_at = Some(chrono::Utc::now().to_rfc3339());
    }

    /// Mark the tool as complete with output (alias for mark_completed)
    pub fn mark_complete(&mut self, output: impl Into<String>) {
        self.mark_completed(output);
    }

    /// Mark the tool as errored
    pub fn mark_error(&mut self, error: impl Into<String>) {
        self.status = ToolStatus::Error;
        self.output = Some(error.into());
        self.is_error = 1;
        self.completed_at = Some(chrono::Utc::now().to_rfc3339());
    }

    /// Check if this tool has finished (completed or error)
    pub fn is_finished(&self) -> bool {
        self.status.is_finished()
    }

    /// Check if this tool is still running
    pub fn is_running(&self) -> bool {
        self.status.is_running()
    }

    /// Check if this tool resulted in an error
    pub fn has_error(&self) -> bool {
        self.is_error != 0
    }

    /// Get parsed input JSON
    pub fn input_json(&self) -> Option<serde_json::Value> {
        self.input
            .as_ref()
            .and_then(|s| serde_json::from_str(s).ok())
    }

    /// Calculate duration in milliseconds if completed
    pub fn duration_ms(&self) -> Option<i64> {
        let started = chrono::DateTime::parse_from_rfc3339(&self.started_at).ok()?;
        let completed = self
            .completed_at
            .as_ref()
            .and_then(|s| chrono::DateTime::parse_from_rfc3339(s).ok())?;
        Some((completed - started).num_milliseconds())
    }
}

// =============================================================================
// Tool State Summary (lightweight view)
// =============================================================================

/// Lightweight summary of a tool state for UI lists
#[typeshare]
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct ToolStateSummary {
    /// Tool use ID (for matching)
    pub tool_use_id: String,
    /// Name of the tool
    pub tool_name: String,
    /// Current status
    pub status: ToolStatus,
    /// Whether it's an error
    pub is_error: bool,
    /// When started
    pub started_at: String,
    /// Duration in ms (if completed)
    pub duration_ms: Option<i32>,
}

impl From<&ToolState> for ToolStateSummary {
    fn from(state: &ToolState) -> Self {
        Self {
            tool_use_id: state.tool_use_id.clone(),
            tool_name: state.tool_name.clone(),
            status: state.status.clone(),
            is_error: state.is_error != 0,
            started_at: state.started_at.clone(),
            // Truncate i64 to i32 for typeshare compatibility (~24 day max duration)
            duration_ms: state.duration_ms().map(|d| d as i32),
        }
    }
}

// =============================================================================
// Tests
// =============================================================================

#[cfg(test)]
mod tests {
    use super::*;

    // =========================================================================
    // ToolStatus Tests
    // =========================================================================

    #[test]
    fn test_tool_status_display() {
        assert_eq!(ToolStatus::Running.to_string(), "running");
        assert_eq!(ToolStatus::Completed.to_string(), "completed");
        assert_eq!(ToolStatus::Error.to_string(), "error");
    }

    #[test]
    fn test_tool_status_from_str() {
        // Primary values
        assert_eq!(
            "running".parse::<ToolStatus>().unwrap(),
            ToolStatus::Running
        );
        assert_eq!(
            "completed".parse::<ToolStatus>().unwrap(),
            ToolStatus::Completed
        );
        assert_eq!("error".parse::<ToolStatus>().unwrap(), ToolStatus::Error);

        // Backward compatibility aliases
        assert_eq!(
            "pending".parse::<ToolStatus>().unwrap(),
            ToolStatus::Running
        );
        assert_eq!(
            "complete".parse::<ToolStatus>().unwrap(),
            ToolStatus::Completed
        );
        assert_eq!("failed".parse::<ToolStatus>().unwrap(), ToolStatus::Error);

        // Case insensitive
        assert_eq!(
            "RUNNING".parse::<ToolStatus>().unwrap(),
            ToolStatus::Running
        );
        assert_eq!(
            "Completed".parse::<ToolStatus>().unwrap(),
            ToolStatus::Completed
        );

        // Invalid
        assert!("invalid".parse::<ToolStatus>().is_err());
    }

    #[test]
    fn test_tool_status_is_methods() {
        assert!(ToolStatus::Running.is_running());
        assert!(!ToolStatus::Running.is_finished());
        assert!(!ToolStatus::Running.is_success());

        assert!(ToolStatus::Completed.is_completed());
        assert!(ToolStatus::Completed.is_finished());
        assert!(ToolStatus::Completed.is_success());

        assert!(ToolStatus::Error.is_error());
        assert!(ToolStatus::Error.is_finished());
        assert!(!ToolStatus::Error.is_success());
    }

    #[test]
    fn test_tool_status_all() {
        let all = ToolStatus::all();
        assert_eq!(all.len(), 3);
        assert!(all.contains(&ToolStatus::Running));
        assert!(all.contains(&ToolStatus::Completed));
        assert!(all.contains(&ToolStatus::Error));
    }

    // =========================================================================
    // ToolState Tests
    // =========================================================================

    #[test]
    fn test_tool_state_new() {
        let input = serde_json::json!({"path": "/src/main.rs"});
        let state = ToolState::new("session-123", "tool-456", "Read", Some(input.clone()));

        assert!(!state.id.is_empty()); // UUID generated
        assert_eq!(state.session_id, "session-123");
        assert_eq!(state.tool_use_id, "tool-456");
        assert_eq!(state.tool_name, "Read");
        assert!(state.input.is_some());
        assert!(state.status.is_running());
        assert!(state.output.is_none());
        assert_eq!(state.is_error, 0);
        assert!(state.completed_at.is_none());
    }

    #[test]
    fn test_tool_state_new_without_input() {
        let state = ToolState::new("session-123", "tool-456", "Bash", None);

        assert_eq!(state.tool_name, "Bash");
        assert!(state.input.is_none());
        assert!(state.input_json().is_none());
    }

    #[test]
    fn test_tool_state_mark_completed() {
        let mut state = ToolState::new("session-123", "tool-456", "Read", None);
        state.mark_completed("File contents here");

        assert!(state.status.is_completed());
        assert_eq!(state.output, Some("File contents here".to_string()));
        assert_eq!(state.is_error, 0);
        assert!(!state.has_error());
        assert!(state.completed_at.is_some());
        assert!(state.is_finished());
    }

    #[test]
    fn test_tool_state_mark_error() {
        let mut state = ToolState::new("session-123", "tool-456", "Read", None);
        state.mark_error("File not found");

        assert!(state.status.is_error());
        assert_eq!(state.output, Some("File not found".to_string()));
        assert_eq!(state.is_error, 1);
        assert!(state.has_error());
        assert!(state.completed_at.is_some());
        assert!(state.is_finished());
    }

    #[test]
    fn test_tool_state_input_json() {
        let input = serde_json::json!({"path": "/src/main.rs", "count": 42});
        let state = ToolState::new("session-123", "tool-456", "Read", Some(input.clone()));

        let parsed = state.input_json().expect("Should parse input");
        assert_eq!(parsed["path"], "/src/main.rs");
        assert_eq!(parsed["count"], 42);
    }

    #[test]
    fn test_tool_state_serialization() {
        let input = serde_json::json!({"path": "/test.rs"});
        let state = ToolState::new("session-123", "tool-456", "Read", Some(input));
        let json = serde_json::to_string(&state).unwrap();

        assert!(json.contains("\"sessionId\":\"session-123\""));
        assert!(json.contains("\"toolUseId\":\"tool-456\""));
        assert!(json.contains("\"toolName\":\"Read\""));
        assert!(json.contains("\"status\":\"running\""));
        assert!(json.contains("\"startedAt\":"));
        assert!(json.contains("\"isError\":0"));

        // Verify can deserialize
        let deserialized: ToolState = serde_json::from_str(&json).unwrap();
        assert_eq!(state.session_id, deserialized.session_id);
        assert_eq!(state.tool_use_id, deserialized.tool_use_id);
        assert_eq!(state.tool_name, deserialized.tool_name);
    }

    // =========================================================================
    // ToolStateSummary Tests
    // =========================================================================

    #[test]
    fn test_tool_state_summary_from() {
        let mut state = ToolState::new("session-123", "tool-456", "Write", None);
        state.mark_completed("Success");

        let summary = ToolStateSummary::from(&state);

        assert_eq!(summary.tool_use_id, "tool-456");
        assert_eq!(summary.tool_name, "Write");
        assert!(summary.status.is_completed());
        assert!(!summary.is_error);
        assert_eq!(summary.started_at, state.started_at);
    }

    #[test]
    fn test_tool_state_summary_error() {
        let mut state = ToolState::new("session-123", "tool-456", "Bash", None);
        state.mark_error("Command failed");

        let summary = ToolStateSummary::from(&state);

        assert!(summary.status.is_error());
        assert!(summary.is_error);
    }
}
