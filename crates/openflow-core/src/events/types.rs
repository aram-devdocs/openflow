//! Event Type Definitions
//!
//! Defines all event types for real-time synchronization.

use serde::{Deserialize, Serialize};

/// Type of entity that changed
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum EntityType {
    /// Project entity
    Project,
    /// Task entity
    Task,
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
}

impl EntityType {
    /// Get the entity type as a string
    pub fn as_str(&self) -> &'static str {
        match self {
            Self::Project => "project",
            Self::Task => "task",
            Self::Chat => "chat",
            Self::Message => "message",
            Self::ExecutorProfile => "executor_profile",
            Self::Setting => "setting",
            Self::Process => "process",
            Self::Worktree => "worktree",
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
}

impl Event {
    /// Get the channel name for this event
    pub fn channel(&self) -> String {
        match self {
            Self::ProcessOutput { process_id, .. } => format!("process-output-{}", process_id),
            Self::ProcessStatus { process_id, .. } => format!("process-status-{}", process_id),
            Self::DataChanged { .. } => "data-changed".to_string(),
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
}
