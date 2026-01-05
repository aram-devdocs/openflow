//! Event Type Definitions
//!
//! Defines all event types for real-time synchronization.
//!
//! # Event Categories
//!
//! - **Process Events**: Raw process output and status changes
//! - **Data Events**: CRUD operations on entities (for cache invalidation)
//! - **Task Events**: Task and step lifecycle events
//! - **Agent Events**: Agent session and unified agent events
//! - **Permission Events**: Permission request/response events
//!
//! # Channel Naming
//!
//! Each event type has a corresponding channel determined by `Event::channel()`.
//! See `openflow_contracts::events::channels` for channel naming conventions.

use openflow_contracts::entities::tool_state::ToolState;
use openflow_contracts::events::channels::{
    agent_event_channel, permission_request_channel, process_output_channel,
    process_status_channel, step_progress_channel, task_channel, task_progress_channel,
    CHANNEL_DATA_CHANGED,
};
use openflow_contracts::events::EventEnvelope;
use serde::{Deserialize, Serialize};

/// Type of entity that changed
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum EntityType {
    /// Project entity
    Project,
    /// Task entity
    Task,
    /// TaskStep entity
    Step,
    /// Chat entity
    Chat,
    /// Message entity
    Message,
    /// ExecutorProfile entity
    ExecutorProfile,
    /// Setting entity
    Setting,
    /// Process entity
    Process,
    /// Worktree entity
    Worktree,
    /// AgentSession entity
    Session,
    /// Permission entity
    Permission,
}

impl EntityType {
    /// Get the entity type as a string
    pub fn as_str(&self) -> &'static str {
        match self {
            Self::Project => "project",
            Self::Task => "task",
            Self::Step => "step",
            Self::Chat => "chat",
            Self::Message => "message",
            Self::ExecutorProfile => "executor_profile",
            Self::Setting => "setting",
            Self::Process => "process",
            Self::Worktree => "worktree",
            Self::Session => "session",
            Self::Permission => "permission",
        }
    }
}

/// Action performed on data
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum DataAction {
    /// Entity was created
    Created,
    /// Entity was updated
    Updated,
    /// Entity was deleted
    Deleted,
}

impl DataAction {
    /// Get the action as a string
    pub fn as_str(&self) -> &'static str {
        match self {
            Self::Created => "created",
            Self::Updated => "updated",
            Self::Deleted => "deleted",
        }
    }
}

/// Type of process output
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum OutputType {
    /// Standard output
    Stdout,
    /// Standard error
    Stderr,
}

/// Process status
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum ProcessStatus {
    /// Process is starting
    Starting,
    /// Process is running
    Running,
    /// Process completed successfully
    Completed,
    /// Process failed
    Failed,
    /// Process was killed
    Killed,
}

/// Events for real-time synchronization
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type", rename_all = "snake_case")]
pub enum Event {
    /// Process output event
    ///
    /// Sent when a process produces output (stdout or stderr).
    /// Channel: `process-output-{process_id}`
    ProcessOutput {
        /// Process ID
        process_id: String,
        /// Output type (stdout or stderr)
        output_type: OutputType,
        /// Output content
        content: String,
        /// Timestamp (ISO 8601)
        timestamp: String,
    },

    /// Process status change event
    ///
    /// Sent when a process status changes.
    /// Channel: `process-status-{process_id}`
    ProcessStatus {
        /// Process ID
        process_id: String,
        /// New status
        status: ProcessStatus,
        /// Exit code (if completed/failed)
        exit_code: Option<i32>,
    },

    /// Data changed event
    ///
    /// Sent when an entity is created, updated, or deleted.
    /// Channel: `data-changed`
    DataChanged {
        /// Entity type
        entity: EntityType,
        /// Action performed
        action: DataAction,
        /// Entity ID
        id: String,
        /// Full entity data (for create/update)
        data: Option<serde_json::Value>,
    },

    /// Claude event (parsed from CLI output)
    ///
    /// Sent when a new Claude event is parsed from the process output.
    /// Channel: `claude-event-{process_id}`
    ClaudeEvent {
        /// Process ID
        process_id: String,
        /// The parsed Claude event JSON
        event: serde_json::Value,
        /// Timestamp (ISO 8601)
        timestamp: String,
    },

    /// Tool state change event
    ///
    /// Sent when a tool's state changes (pending, running, complete, error).
    /// Channel: `tool-state-{process_id}`
    ToolStateChange {
        /// Process ID
        process_id: String,
        /// The tool state
        tool_state: ToolState,
        /// Timestamp (ISO 8601)
        timestamp: String,
    },

    // =========================================================================
    // Task Progress Events
    // =========================================================================

    /// Task progress event
    ///
    /// Sent when a task's status changes (started, paused, completed, failed, etc.).
    /// Channel: `task-progress-{task_id}` AND `task:{task_id}`
    TaskProgress {
        /// Task ID
        task_id: String,
        /// New task status
        status: String,
        /// Current step index (0-based)
        current_step_index: i32,
        /// Total number of steps
        total_steps: i32,
        /// Optional details (e.g., error message)
        details: Option<serde_json::Value>,
        /// Timestamp (ISO 8601)
        timestamp: String,
    },

    /// Step progress event
    ///
    /// Sent when a task step's status changes.
    /// Channel: `step-progress-{step_id}` AND `task:{task_id}`
    StepProgress {
        /// Step ID
        step_id: String,
        /// Parent task ID
        task_id: String,
        /// Step index (0-based)
        step_index: i32,
        /// New step status
        status: String,
        /// Associated session ID (if running)
        session_id: Option<String>,
        /// Optional details (e.g., error message)
        details: Option<serde_json::Value>,
        /// Timestamp (ISO 8601)
        timestamp: String,
    },

    // =========================================================================
    // Agent Session Events
    // =========================================================================

    /// Agent event (wrapped in envelope)
    ///
    /// Sent when an agent produces a parsed event (message, tool_use, etc.).
    /// This wraps the UnifiedAgentEvent in an EventEnvelope with sequence numbers.
    /// Channel: `agent-event-{session_id}` AND `session:{session_id}`
    AgentEvent {
        /// Session ID
        session_id: String,
        /// Sequence number for ordering/deduplication
        sequence: i32,
        /// Event type (for quick routing without deserializing payload)
        event_type: String,
        /// The full event envelope as JSON
        envelope: serde_json::Value,
        /// Timestamp (ISO 8601)
        timestamp: String,
    },

    /// Session status change event
    ///
    /// Sent when an agent session's status changes.
    /// Channel: `session:{session_id}`
    SessionStatus {
        /// Session ID
        session_id: String,
        /// New status (running, completed, failed, killed)
        status: String,
        /// Exit code (if terminated)
        exit_code: Option<i32>,
        /// Timestamp (ISO 8601)
        timestamp: String,
    },

    // =========================================================================
    // Permission Events
    // =========================================================================

    /// Permission request event
    ///
    /// Sent when an agent requests permission for an action.
    /// Channel: `permission-request-{session_id}` AND `session:{session_id}`
    PermissionRequest {
        /// Permission ID
        permission_id: String,
        /// Session ID requesting permission
        session_id: String,
        /// Tool name requesting permission
        tool_name: String,
        /// Human-readable description
        description: String,
        /// File path (if applicable)
        file_path: Option<String>,
        /// Timestamp (ISO 8601)
        timestamp: String,
    },

    /// Permission response event
    ///
    /// Sent when a permission request is approved or denied.
    /// Channel: `session:{session_id}`
    PermissionResponse {
        /// Permission ID
        permission_id: String,
        /// Session ID
        session_id: String,
        /// Whether the permission was approved
        approved: bool,
        /// Timestamp (ISO 8601)
        timestamp: String,
    },
}

impl Event {
    /// Get the primary channel name for this event.
    ///
    /// Note: Some events may be broadcast to multiple channels. Use `channels()`
    /// to get all channels this event should be broadcast to.
    pub fn channel(&self) -> String {
        match self {
            Self::ProcessOutput { process_id, .. } => process_output_channel(process_id),
            Self::ProcessStatus { process_id, .. } => process_status_channel(process_id),
            Self::DataChanged { .. } => CHANNEL_DATA_CHANGED.to_string(),
            Self::ClaudeEvent { process_id, .. } => format!("claude-event-{}", process_id),
            Self::ToolStateChange { process_id, .. } => format!("tool-state-{}", process_id),
            // Task/Step progress events
            Self::TaskProgress { task_id, .. } => task_progress_channel(task_id),
            Self::StepProgress { step_id, .. } => step_progress_channel(step_id),
            // Agent session events
            Self::AgentEvent { session_id, .. } => agent_event_channel(session_id),
            Self::SessionStatus { session_id, .. } => format!("session:{}", session_id),
            // Permission events
            Self::PermissionRequest { session_id, .. } => permission_request_channel(session_id),
            Self::PermissionResponse { session_id, .. } => format!("session:{}", session_id),
        }
    }

    /// Get all channels this event should be broadcast to.
    ///
    /// Some events are broadcast to multiple channels for different subscribers:
    /// - Entity-scoped channels (e.g., `task:{task_id}`) for clients watching a specific entity
    /// - Event-type channels (e.g., `task-progress-{task_id}`) for clients filtering by event type
    pub fn channels(&self) -> Vec<String> {
        match self {
            // Task progress goes to both task-progress-{id} and task:{id}
            Self::TaskProgress { task_id, .. } => vec![
                task_progress_channel(task_id),
                task_channel(task_id),
            ],
            // Step progress goes to step-progress-{id} and task:{task_id}
            Self::StepProgress { step_id, task_id, .. } => vec![
                step_progress_channel(step_id),
                task_channel(task_id),
            ],
            // Agent events go to agent-event-{id} and session:{id}
            Self::AgentEvent { session_id, .. } => vec![
                agent_event_channel(session_id),
                format!("session:{}", session_id),
            ],
            // Permission requests go to permission-request-{id} and session:{id}
            Self::PermissionRequest { session_id, .. } => vec![
                permission_request_channel(session_id),
                format!("session:{}", session_id),
            ],
            // All other events use single channel
            _ => vec![self.channel()],
        }
    }

    /// Create a process output event
    pub fn process_output(
        process_id: impl Into<String>,
        output_type: OutputType,
        content: impl Into<String>,
    ) -> Self {
        Self::ProcessOutput {
            process_id: process_id.into(),
            output_type,
            content: content.into(),
            timestamp: chrono::Utc::now().to_rfc3339(),
        }
    }

    /// Create a process status event
    pub fn process_status(
        process_id: impl Into<String>,
        status: ProcessStatus,
        exit_code: Option<i32>,
    ) -> Self {
        Self::ProcessStatus {
            process_id: process_id.into(),
            status,
            exit_code,
        }
    }

    /// Create a data changed event
    pub fn data_changed(
        entity: EntityType,
        action: DataAction,
        id: impl Into<String>,
        data: Option<serde_json::Value>,
    ) -> Self {
        Self::DataChanged {
            entity,
            action,
            id: id.into(),
            data,
        }
    }

    /// Create a created event for an entity
    pub fn created<T: Serialize>(entity: EntityType, id: impl Into<String>, data: &T) -> Self {
        Self::data_changed(
            entity,
            DataAction::Created,
            id,
            serde_json::to_value(data).ok(),
        )
    }

    /// Create an updated event for an entity
    pub fn updated<T: Serialize>(entity: EntityType, id: impl Into<String>, data: &T) -> Self {
        Self::data_changed(
            entity,
            DataAction::Updated,
            id,
            serde_json::to_value(data).ok(),
        )
    }

    /// Create a deleted event for an entity
    pub fn deleted(entity: EntityType, id: impl Into<String>) -> Self {
        Self::data_changed(entity, DataAction::Deleted, id, None)
    }

    /// Create a Claude event
    pub fn claude_event(process_id: impl Into<String>, event: serde_json::Value) -> Self {
        Self::ClaudeEvent {
            process_id: process_id.into(),
            event,
            timestamp: chrono::Utc::now().to_rfc3339(),
        }
    }

    /// Create a tool state change event
    pub fn tool_state(process_id: impl Into<String>, tool_state: ToolState) -> Self {
        Self::ToolStateChange {
            process_id: process_id.into(),
            tool_state,
            timestamp: chrono::Utc::now().to_rfc3339(),
        }
    }

    // =========================================================================
    // Task Progress Event Helpers
    // =========================================================================

    /// Create a task progress event
    pub fn task_progress(
        task_id: impl Into<String>,
        status: impl Into<String>,
        current_step_index: i32,
        total_steps: i32,
        details: Option<serde_json::Value>,
    ) -> Self {
        Self::TaskProgress {
            task_id: task_id.into(),
            status: status.into(),
            current_step_index,
            total_steps,
            details,
            timestamp: chrono::Utc::now().to_rfc3339(),
        }
    }

    /// Create a task started event
    pub fn task_started(
        task_id: impl Into<String>,
        current_step_index: i32,
        total_steps: i32,
    ) -> Self {
        Self::task_progress(task_id, "running", current_step_index, total_steps, None)
    }

    /// Create a task completed event
    pub fn task_completed(
        task_id: impl Into<String>,
        total_steps: i32,
    ) -> Self {
        Self::task_progress(task_id, "completed", total_steps, total_steps, None)
    }

    /// Create a task failed event
    pub fn task_failed(
        task_id: impl Into<String>,
        current_step_index: i32,
        total_steps: i32,
        error: impl Into<String>,
    ) -> Self {
        Self::task_progress(
            task_id,
            "failed",
            current_step_index,
            total_steps,
            Some(serde_json::json!({ "error": error.into() })),
        )
    }

    /// Create a task paused event
    pub fn task_paused(
        task_id: impl Into<String>,
        current_step_index: i32,
        total_steps: i32,
    ) -> Self {
        Self::task_progress(task_id, "paused", current_step_index, total_steps, None)
    }

    /// Create a task cancelled event
    pub fn task_cancelled(
        task_id: impl Into<String>,
        current_step_index: i32,
        total_steps: i32,
    ) -> Self {
        Self::task_progress(task_id, "cancelled", current_step_index, total_steps, None)
    }

    // =========================================================================
    // Step Progress Event Helpers
    // =========================================================================

    /// Create a step progress event
    pub fn step_progress(
        step_id: impl Into<String>,
        task_id: impl Into<String>,
        step_index: i32,
        status: impl Into<String>,
        session_id: Option<String>,
        details: Option<serde_json::Value>,
    ) -> Self {
        Self::StepProgress {
            step_id: step_id.into(),
            task_id: task_id.into(),
            step_index,
            status: status.into(),
            session_id,
            details,
            timestamp: chrono::Utc::now().to_rfc3339(),
        }
    }

    /// Create a step started event
    pub fn step_started(
        step_id: impl Into<String>,
        task_id: impl Into<String>,
        step_index: i32,
        session_id: impl Into<String>,
    ) -> Self {
        Self::step_progress(step_id, task_id, step_index, "running", Some(session_id.into()), None)
    }

    /// Create a step completed event
    pub fn step_completed(
        step_id: impl Into<String>,
        task_id: impl Into<String>,
        step_index: i32,
    ) -> Self {
        Self::step_progress(step_id, task_id, step_index, "completed", None, None)
    }

    /// Create a step failed event
    pub fn step_failed(
        step_id: impl Into<String>,
        task_id: impl Into<String>,
        step_index: i32,
        error: impl Into<String>,
    ) -> Self {
        Self::step_progress(
            step_id,
            task_id,
            step_index,
            "failed",
            None,
            Some(serde_json::json!({ "error": error.into() })),
        )
    }

    // =========================================================================
    // Agent Event Helpers
    // =========================================================================

    /// Create an agent event from an EventEnvelope
    ///
    /// This wraps a UnifiedAgentEvent in its envelope format for broadcasting.
    pub fn agent_event<T: Serialize>(
        session_id: impl Into<String>,
        sequence: i32,
        event_type: impl Into<String>,
        envelope: &EventEnvelope<T>,
    ) -> Self {
        Self::AgentEvent {
            session_id: session_id.into(),
            sequence,
            event_type: event_type.into(),
            envelope: serde_json::to_value(envelope).unwrap_or_default(),
            timestamp: chrono::Utc::now().to_rfc3339(),
        }
    }

    /// Create an agent event from a JSON value
    ///
    /// Use this when you already have the envelope as JSON.
    pub fn agent_event_json(
        session_id: impl Into<String>,
        sequence: i32,
        event_type: impl Into<String>,
        envelope: serde_json::Value,
    ) -> Self {
        Self::AgentEvent {
            session_id: session_id.into(),
            sequence,
            event_type: event_type.into(),
            envelope,
            timestamp: chrono::Utc::now().to_rfc3339(),
        }
    }

    /// Create a session status event
    pub fn session_status(
        session_id: impl Into<String>,
        status: impl Into<String>,
        exit_code: Option<i32>,
    ) -> Self {
        Self::SessionStatus {
            session_id: session_id.into(),
            status: status.into(),
            exit_code,
            timestamp: chrono::Utc::now().to_rfc3339(),
        }
    }

    /// Create a session completed event
    pub fn session_completed(session_id: impl Into<String>, exit_code: i32) -> Self {
        let status = if exit_code == 0 { "completed" } else { "failed" };
        Self::session_status(session_id, status, Some(exit_code))
    }

    /// Create a session killed event
    pub fn session_killed(session_id: impl Into<String>) -> Self {
        Self::session_status(session_id, "killed", None)
    }

    // =========================================================================
    // Permission Event Helpers
    // =========================================================================

    /// Create a permission request event
    pub fn permission_request(
        permission_id: impl Into<String>,
        session_id: impl Into<String>,
        tool_name: impl Into<String>,
        description: impl Into<String>,
        file_path: Option<String>,
    ) -> Self {
        Self::PermissionRequest {
            permission_id: permission_id.into(),
            session_id: session_id.into(),
            tool_name: tool_name.into(),
            description: description.into(),
            file_path,
            timestamp: chrono::Utc::now().to_rfc3339(),
        }
    }

    /// Create a permission response event
    pub fn permission_response(
        permission_id: impl Into<String>,
        session_id: impl Into<String>,
        approved: bool,
    ) -> Self {
        Self::PermissionResponse {
            permission_id: permission_id.into(),
            session_id: session_id.into(),
            approved,
            timestamp: chrono::Utc::now().to_rfc3339(),
        }
    }

    /// Create a permission approved event
    pub fn permission_approved(
        permission_id: impl Into<String>,
        session_id: impl Into<String>,
    ) -> Self {
        Self::permission_response(permission_id, session_id, true)
    }

    /// Create a permission denied event
    pub fn permission_denied(
        permission_id: impl Into<String>,
        session_id: impl Into<String>,
    ) -> Self {
        Self::permission_response(permission_id, session_id, false)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_entity_type_as_str() {
        assert_eq!(EntityType::Project.as_str(), "project");
        assert_eq!(EntityType::Task.as_str(), "task");
        assert_eq!(EntityType::Chat.as_str(), "chat");
    }

    #[test]
    fn test_data_action_as_str() {
        assert_eq!(DataAction::Created.as_str(), "created");
        assert_eq!(DataAction::Updated.as_str(), "updated");
        assert_eq!(DataAction::Deleted.as_str(), "deleted");
    }

    #[test]
    fn test_event_channel() {
        let event = Event::process_output("proc-123", OutputType::Stdout, "hello");
        assert_eq!(event.channel(), "process-output-proc-123");

        let event = Event::process_status("proc-456", ProcessStatus::Running, None);
        assert_eq!(event.channel(), "process-status-proc-456");

        let event = Event::deleted(EntityType::Project, "proj-789");
        assert_eq!(event.channel(), "data-changed");
    }

    #[test]
    fn test_event_serialization() {
        let event = Event::DataChanged {
            entity: EntityType::Project,
            action: DataAction::Created,
            id: "proj-123".to_string(),
            data: Some(serde_json::json!({"name": "Test Project"})),
        };

        let json = serde_json::to_string(&event).unwrap();
        assert!(json.contains("\"type\":\"data_changed\""));
        assert!(json.contains("\"entity\":\"project\""));
        assert!(json.contains("\"action\":\"created\""));
    }

    #[test]
    fn test_event_deserialization() {
        let json =
            r#"{"type":"process_status","process_id":"abc","status":"running","exit_code":null}"#;
        let event: Event = serde_json::from_str(json).unwrap();

        match event {
            Event::ProcessStatus {
                process_id,
                status,
                exit_code,
            } => {
                assert_eq!(process_id, "abc");
                assert_eq!(status, ProcessStatus::Running);
                assert!(exit_code.is_none());
            }
            _ => panic!("Wrong event type"),
        }
    }

    // =========================================================================
    // Task Progress Event Tests
    // =========================================================================

    #[test]
    fn test_task_progress_event() {
        let event = Event::task_progress("task-123", "running", 0, 5, None);
        assert_eq!(event.channel(), "task-progress-task-123");

        match event {
            Event::TaskProgress {
                task_id,
                status,
                current_step_index,
                total_steps,
                details,
                ..
            } => {
                assert_eq!(task_id, "task-123");
                assert_eq!(status, "running");
                assert_eq!(current_step_index, 0);
                assert_eq!(total_steps, 5);
                assert!(details.is_none());
            }
            _ => panic!("Wrong event type"),
        }
    }

    #[test]
    fn test_task_started_event() {
        let event = Event::task_started("task-456", 0, 3);
        match event {
            Event::TaskProgress { status, .. } => {
                assert_eq!(status, "running");
            }
            _ => panic!("Wrong event type"),
        }
    }

    #[test]
    fn test_task_completed_event() {
        let event = Event::task_completed("task-789", 5);
        match event {
            Event::TaskProgress {
                status,
                current_step_index,
                total_steps,
                ..
            } => {
                assert_eq!(status, "completed");
                assert_eq!(current_step_index, 5);
                assert_eq!(total_steps, 5);
            }
            _ => panic!("Wrong event type"),
        }
    }

    #[test]
    fn test_task_failed_event() {
        let event = Event::task_failed("task-abc", 2, 5, "Test error");
        match event {
            Event::TaskProgress { status, details, .. } => {
                assert_eq!(status, "failed");
                assert!(details.is_some());
                let details = details.unwrap();
                assert_eq!(details["error"], "Test error");
            }
            _ => panic!("Wrong event type"),
        }
    }

    #[test]
    fn test_task_paused_event() {
        let event = Event::task_paused("task-def", 1, 4);
        match event {
            Event::TaskProgress { status, .. } => {
                assert_eq!(status, "paused");
            }
            _ => panic!("Wrong event type"),
        }
    }

    #[test]
    fn test_task_cancelled_event() {
        let event = Event::task_cancelled("task-ghi", 2, 6);
        match event {
            Event::TaskProgress { status, .. } => {
                assert_eq!(status, "cancelled");
            }
            _ => panic!("Wrong event type"),
        }
    }

    #[test]
    fn test_task_progress_channels() {
        let event = Event::task_progress("task-123", "running", 0, 5, None);
        let channels = event.channels();
        assert_eq!(channels.len(), 2);
        assert!(channels.contains(&"task-progress-task-123".to_string()));
        assert!(channels.contains(&"task:task-123".to_string()));
    }

    // =========================================================================
    // Step Progress Event Tests
    // =========================================================================

    #[test]
    fn test_step_progress_event() {
        let event = Event::step_progress("step-123", "task-456", 0, "running", Some("sess-789".to_string()), None);
        assert_eq!(event.channel(), "step-progress-step-123");

        match event {
            Event::StepProgress {
                step_id,
                task_id,
                step_index,
                status,
                session_id,
                details,
                ..
            } => {
                assert_eq!(step_id, "step-123");
                assert_eq!(task_id, "task-456");
                assert_eq!(step_index, 0);
                assert_eq!(status, "running");
                assert_eq!(session_id, Some("sess-789".to_string()));
                assert!(details.is_none());
            }
            _ => panic!("Wrong event type"),
        }
    }

    #[test]
    fn test_step_started_event() {
        let event = Event::step_started("step-abc", "task-def", 1, "sess-ghi");
        match event {
            Event::StepProgress {
                status,
                session_id,
                ..
            } => {
                assert_eq!(status, "running");
                assert_eq!(session_id, Some("sess-ghi".to_string()));
            }
            _ => panic!("Wrong event type"),
        }
    }

    #[test]
    fn test_step_completed_event() {
        let event = Event::step_completed("step-jkl", "task-mno", 2);
        match event {
            Event::StepProgress { status, .. } => {
                assert_eq!(status, "completed");
            }
            _ => panic!("Wrong event type"),
        }
    }

    #[test]
    fn test_step_failed_event() {
        let event = Event::step_failed("step-pqr", "task-stu", 3, "Step error");
        match event {
            Event::StepProgress { status, details, .. } => {
                assert_eq!(status, "failed");
                assert!(details.is_some());
                let details = details.unwrap();
                assert_eq!(details["error"], "Step error");
            }
            _ => panic!("Wrong event type"),
        }
    }

    #[test]
    fn test_step_progress_channels() {
        let event = Event::step_progress("step-123", "task-456", 0, "running", None, None);
        let channels = event.channels();
        assert_eq!(channels.len(), 2);
        assert!(channels.contains(&"step-progress-step-123".to_string()));
        assert!(channels.contains(&"task:task-456".to_string()));
    }

    // =========================================================================
    // Agent Event Tests
    // =========================================================================

    #[test]
    fn test_agent_event_json() {
        let envelope = serde_json::json!({
            "eventType": "message",
            "sessionId": "sess-123",
            "sequence": 5,
            "timestamp": "2025-01-04T12:00:00.000Z",
            "payload": { "role": "assistant", "content": [] }
        });

        let event = Event::agent_event_json("sess-123", 5, "message", envelope.clone());
        assert_eq!(event.channel(), "agent-event-sess-123");

        match event {
            Event::AgentEvent {
                session_id,
                sequence,
                event_type,
                envelope: env,
                ..
            } => {
                assert_eq!(session_id, "sess-123");
                assert_eq!(sequence, 5);
                assert_eq!(event_type, "message");
                assert_eq!(env, envelope);
            }
            _ => panic!("Wrong event type"),
        }
    }

    #[test]
    fn test_agent_event_channels() {
        let event = Event::agent_event_json("sess-123", 1, "message", serde_json::json!({}));
        let channels = event.channels();
        assert_eq!(channels.len(), 2);
        assert!(channels.contains(&"agent-event-sess-123".to_string()));
        assert!(channels.contains(&"session:sess-123".to_string()));
    }

    // =========================================================================
    // Session Status Event Tests
    // =========================================================================

    #[test]
    fn test_session_status_event() {
        let event = Event::session_status("sess-456", "completed", Some(0));
        assert_eq!(event.channel(), "session:sess-456");

        match event {
            Event::SessionStatus {
                session_id,
                status,
                exit_code,
                ..
            } => {
                assert_eq!(session_id, "sess-456");
                assert_eq!(status, "completed");
                assert_eq!(exit_code, Some(0));
            }
            _ => panic!("Wrong event type"),
        }
    }

    #[test]
    fn test_session_completed_event_success() {
        let event = Event::session_completed("sess-789", 0);
        match event {
            Event::SessionStatus { status, exit_code, .. } => {
                assert_eq!(status, "completed");
                assert_eq!(exit_code, Some(0));
            }
            _ => panic!("Wrong event type"),
        }
    }

    #[test]
    fn test_session_completed_event_failure() {
        let event = Event::session_completed("sess-abc", 1);
        match event {
            Event::SessionStatus { status, exit_code, .. } => {
                assert_eq!(status, "failed");
                assert_eq!(exit_code, Some(1));
            }
            _ => panic!("Wrong event type"),
        }
    }

    #[test]
    fn test_session_killed_event() {
        let event = Event::session_killed("sess-def");
        match event {
            Event::SessionStatus { status, exit_code, .. } => {
                assert_eq!(status, "killed");
                assert!(exit_code.is_none());
            }
            _ => panic!("Wrong event type"),
        }
    }

    // =========================================================================
    // Permission Event Tests
    // =========================================================================

    #[test]
    fn test_permission_request_event() {
        let event = Event::permission_request(
            "perm-123",
            "sess-456",
            "Write",
            "Write to file /path/to/file.rs",
            Some("/path/to/file.rs".to_string()),
        );
        assert_eq!(event.channel(), "permission-request-sess-456");

        match event {
            Event::PermissionRequest {
                permission_id,
                session_id,
                tool_name,
                description,
                file_path,
                ..
            } => {
                assert_eq!(permission_id, "perm-123");
                assert_eq!(session_id, "sess-456");
                assert_eq!(tool_name, "Write");
                assert_eq!(description, "Write to file /path/to/file.rs");
                assert_eq!(file_path, Some("/path/to/file.rs".to_string()));
            }
            _ => panic!("Wrong event type"),
        }
    }

    #[test]
    fn test_permission_request_channels() {
        let event = Event::permission_request("perm-123", "sess-456", "Bash", "Run command", None);
        let channels = event.channels();
        assert_eq!(channels.len(), 2);
        assert!(channels.contains(&"permission-request-sess-456".to_string()));
        assert!(channels.contains(&"session:sess-456".to_string()));
    }

    #[test]
    fn test_permission_response_event() {
        let event = Event::permission_response("perm-789", "sess-abc", true);
        assert_eq!(event.channel(), "session:sess-abc");

        match event {
            Event::PermissionResponse {
                permission_id,
                session_id,
                approved,
                ..
            } => {
                assert_eq!(permission_id, "perm-789");
                assert_eq!(session_id, "sess-abc");
                assert!(approved);
            }
            _ => panic!("Wrong event type"),
        }
    }

    #[test]
    fn test_permission_approved_event() {
        let event = Event::permission_approved("perm-def", "sess-ghi");
        match event {
            Event::PermissionResponse { approved, .. } => {
                assert!(approved);
            }
            _ => panic!("Wrong event type"),
        }
    }

    #[test]
    fn test_permission_denied_event() {
        let event = Event::permission_denied("perm-jkl", "sess-mno");
        match event {
            Event::PermissionResponse { approved, .. } => {
                assert!(!approved);
            }
            _ => panic!("Wrong event type"),
        }
    }

    // =========================================================================
    // Event Serialization Tests for New Events
    // =========================================================================

    #[test]
    fn test_task_progress_serialization() {
        let event = Event::task_progress("task-123", "running", 1, 5, None);
        let json = serde_json::to_string(&event).unwrap();
        assert!(json.contains("\"type\":\"task_progress\""));
        assert!(json.contains("\"task_id\":\"task-123\""));
        assert!(json.contains("\"status\":\"running\""));
        assert!(json.contains("\"current_step_index\":1"));
        assert!(json.contains("\"total_steps\":5"));
    }

    #[test]
    fn test_step_progress_serialization() {
        let event = Event::step_started("step-123", "task-456", 2, "sess-789");
        let json = serde_json::to_string(&event).unwrap();
        assert!(json.contains("\"type\":\"step_progress\""));
        assert!(json.contains("\"step_id\":\"step-123\""));
        assert!(json.contains("\"task_id\":\"task-456\""));
        assert!(json.contains("\"step_index\":2"));
    }

    #[test]
    fn test_agent_event_serialization() {
        let event = Event::agent_event_json("sess-123", 5, "tool_use", serde_json::json!({"test": "value"}));
        let json = serde_json::to_string(&event).unwrap();
        assert!(json.contains("\"type\":\"agent_event\""));
        assert!(json.contains("\"session_id\":\"sess-123\""));
        assert!(json.contains("\"sequence\":5"));
        assert!(json.contains("\"event_type\":\"tool_use\""));
    }

    #[test]
    fn test_permission_request_serialization() {
        let event = Event::permission_request("perm-123", "sess-456", "Write", "desc", None);
        let json = serde_json::to_string(&event).unwrap();
        assert!(json.contains("\"type\":\"permission_request\""));
        assert!(json.contains("\"permission_id\":\"perm-123\""));
        assert!(json.contains("\"tool_name\":\"Write\""));
    }

    #[test]
    fn test_permission_response_serialization() {
        let event = Event::permission_approved("perm-789", "sess-abc");
        let json = serde_json::to_string(&event).unwrap();
        assert!(json.contains("\"type\":\"permission_response\""));
        assert!(json.contains("\"approved\":true"));
    }
}
