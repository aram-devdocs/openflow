//! Event Types for Real-Time Synchronization
//!
//! These events are used for:
//! - Tauri IPC events (desktop)
//! - WebSocket messages (web)
//! - Both use identical payload formats
//!
//! # Architecture
//!
//! Events enable real-time synchronization between multiple clients (Tauri desktop,
//! web browsers) connected to the same backend. When data changes, the backend
//! broadcasts events to all connected clients so they can update their local caches.
//!
//! ```text
//! ┌─────────────────────────────────────────────────────────────────────────┐
//! │                         Event Flow                                       │
//! ├─────────────────────────────────────────────────────────────────────────┤
//! │                                                                          │
//! │  ┌─────────────┐      ┌─────────────────┐      ┌─────────────┐          │
//! │  │   Client A  │      │     Backend     │      │   Client B  │          │
//! │  │  (Browser)  │      │   (Rust/Axum)   │      │   (Tauri)   │          │
//! │  └──────┬──────┘      └────────┬────────┘      └──────┬──────┘          │
//! │         │                      │                      │                 │
//! │         │  HTTP POST /project  │                      │                 │
//! │         │─────────────────────▶│                      │                 │
//! │         │                      │                      │                 │
//! │         │                      │ Broadcast:           │                 │
//! │         │                      │ DataChangedEvent     │                 │
//! │         │                      │ {project, created}   │                 │
//! │         │◀─────────────────────│─────────────────────▶│                 │
//! │         │    WebSocket         │     Tauri Event      │                 │
//! │         │                      │                      │                 │
//! │         │  Invalidate cache    │                      │  Invalidate     │
//! │         │  Update UI           │                      │  cache, UI      │
//! │         │                      │                      │                 │
//! │  └──────┴──────┘      └────────┴────────┘      └──────┴──────┘          │
//! │                                                                          │
//! └─────────────────────────────────────────────────────────────────────────┘
//! ```
//!
//! # Event Types
//!
//! - **ProcessOutputEvent**: Streaming output from running processes
//! - **ProcessStatusEvent**: Process lifecycle changes (started, completed, failed)
//! - **DataChangedEvent**: CRUD operations on entities (project, task, chat, etc.)
//!
//! # Channels
//!
//! Events are published to specific channels:
//! - `process-output-{process_id}`: Output for a specific process
//! - `process-status-{process_id}`: Status changes for a specific process
//! - `data-changed`: All data changes (entity type in payload)
//! - `*`: Wildcard subscription (all events)

use serde::{Deserialize, Serialize};
use typeshare::typeshare;

// Re-export process events from entities
pub use crate::entities::process::{OutputType, ProcessOutputEvent, ProcessStatus, ProcessStatusEvent};

// =============================================================================
// Event Channel Constants
// =============================================================================

/// Event channel for data changes
pub const CHANNEL_DATA_CHANGED: &str = "data-changed";

/// Format string for process output channel
/// Use: format!(CHANNEL_PROCESS_OUTPUT_FMT, process_id)
pub const CHANNEL_PROCESS_OUTPUT_FMT: &str = "process-output-{}";

/// Format string for process status channel
/// Use: format!(CHANNEL_PROCESS_STATUS_FMT, process_id)
pub const CHANNEL_PROCESS_STATUS_FMT: &str = "process-status-{}";

/// Wildcard channel (subscribe to all events)
pub const CHANNEL_WILDCARD: &str = "*";

// =============================================================================
// Channel Helper Functions
// =============================================================================

/// Generate the channel name for process output events
///
/// # Example
/// ```
/// use openflow_contracts::events::process_output_channel;
/// let channel = process_output_channel("abc-123");
/// assert_eq!(channel, "process-output-abc-123");
/// ```
pub fn process_output_channel(process_id: &str) -> String {
    format!("process-output-{}", process_id)
}

/// Generate the channel name for process status events
///
/// # Example
/// ```
/// use openflow_contracts::events::process_status_channel;
/// let channel = process_status_channel("abc-123");
/// assert_eq!(channel, "process-status-abc-123");
/// ```
pub fn process_status_channel(process_id: &str) -> String {
    format!("process-status-{}", process_id)
}

/// Parse a process ID from a process output channel name
///
/// # Example
/// ```
/// use openflow_contracts::events::parse_process_output_channel;
/// let id = parse_process_output_channel("process-output-abc-123");
/// assert_eq!(id, Some("abc-123".to_string()));
/// ```
pub fn parse_process_output_channel(channel: &str) -> Option<String> {
    channel
        .strip_prefix("process-output-")
        .map(|s| s.to_string())
}

/// Parse a process ID from a process status channel name
///
/// # Example
/// ```
/// use openflow_contracts::events::parse_process_status_channel;
/// let id = parse_process_status_channel("process-status-abc-123");
/// assert_eq!(id, Some("abc-123".to_string()));
/// ```
pub fn parse_process_status_channel(channel: &str) -> Option<String> {
    channel
        .strip_prefix("process-status-")
        .map(|s| s.to_string())
}

// =============================================================================
// Entity Type Enum
// =============================================================================

/// Type of entity that was changed
///
/// Used in DataChangedEvent to identify which entity type was affected.
/// This allows the frontend to invalidate the correct TanStack Query cache.
///
/// # Serialization
/// Serialized as snake_case strings: "project", "task", "chat", etc.
#[typeshare]
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, Hash)]
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
    /// Executor profile entity
    ExecutorProfile,
    /// Execution process entity
    Process,
    /// Application setting
    Setting,
    /// Workflow template
    WorkflowTemplate,
    /// Git worktree
    Worktree,
}

impl std::fmt::Display for EntityType {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            EntityType::Project => write!(f, "project"),
            EntityType::Task => write!(f, "task"),
            EntityType::Chat => write!(f, "chat"),
            EntityType::Message => write!(f, "message"),
            EntityType::ExecutorProfile => write!(f, "executor_profile"),
            EntityType::Process => write!(f, "process"),
            EntityType::Setting => write!(f, "setting"),
            EntityType::WorkflowTemplate => write!(f, "workflow_template"),
            EntityType::Worktree => write!(f, "worktree"),
        }
    }
}

impl std::str::FromStr for EntityType {
    type Err = String;

    fn from_str(s: &str) -> Result<Self, Self::Err> {
        match s.to_lowercase().as_str() {
            "project" => Ok(EntityType::Project),
            "task" => Ok(EntityType::Task),
            "chat" => Ok(EntityType::Chat),
            "message" => Ok(EntityType::Message),
            "executor_profile" | "executorprofile" => Ok(EntityType::ExecutorProfile),
            "process" => Ok(EntityType::Process),
            "setting" => Ok(EntityType::Setting),
            "workflow_template" | "workflowtemplate" => Ok(EntityType::WorkflowTemplate),
            "worktree" => Ok(EntityType::Worktree),
            _ => Err(format!("Invalid entity type: {}", s)),
        }
    }
}

impl TryFrom<String> for EntityType {
    type Error = String;

    fn try_from(s: String) -> Result<Self, Self::Error> {
        s.parse()
    }
}

impl EntityType {
    /// Get the TanStack Query key prefix for this entity type
    ///
    /// Used for cache invalidation on the frontend.
    pub fn query_key(&self) -> &'static str {
        match self {
            EntityType::Project => "projects",
            EntityType::Task => "tasks",
            EntityType::Chat => "chats",
            EntityType::Message => "messages",
            EntityType::ExecutorProfile => "executorProfiles",
            EntityType::Process => "processes",
            EntityType::Setting => "settings",
            EntityType::WorkflowTemplate => "workflowTemplates",
            EntityType::Worktree => "worktrees",
        }
    }

    /// Get all possible entity type values
    pub fn all() -> &'static [EntityType] {
        &[
            EntityType::Project,
            EntityType::Task,
            EntityType::Chat,
            EntityType::Message,
            EntityType::ExecutorProfile,
            EntityType::Process,
            EntityType::Setting,
            EntityType::WorkflowTemplate,
            EntityType::Worktree,
        ]
    }
}

// =============================================================================
// Data Action Enum
// =============================================================================

/// Action that was performed on an entity
///
/// Used in DataChangedEvent to identify what operation occurred.
///
/// # Serialization
/// Serialized as snake_case strings: "created", "updated", "deleted"
#[typeshare]
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, Hash)]
#[serde(rename_all = "snake_case")]
pub enum DataAction {
    /// Entity was created
    Created,
    /// Entity was updated
    Updated,
    /// Entity was deleted
    Deleted,
}

impl std::fmt::Display for DataAction {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            DataAction::Created => write!(f, "created"),
            DataAction::Updated => write!(f, "updated"),
            DataAction::Deleted => write!(f, "deleted"),
        }
    }
}

impl std::str::FromStr for DataAction {
    type Err = String;

    fn from_str(s: &str) -> Result<Self, Self::Err> {
        match s.to_lowercase().as_str() {
            "created" | "create" => Ok(DataAction::Created),
            "updated" | "update" => Ok(DataAction::Updated),
            "deleted" | "delete" => Ok(DataAction::Deleted),
            _ => Err(format!("Invalid data action: {}", s)),
        }
    }
}

impl TryFrom<String> for DataAction {
    type Error = String;

    fn try_from(s: String) -> Result<Self, Self::Error> {
        s.parse()
    }
}

impl DataAction {
    /// Check if this is a create action
    pub fn is_created(&self) -> bool {
        matches!(self, DataAction::Created)
    }

    /// Check if this is an update action
    pub fn is_updated(&self) -> bool {
        matches!(self, DataAction::Updated)
    }

    /// Check if this is a delete action
    pub fn is_deleted(&self) -> bool {
        matches!(self, DataAction::Deleted)
    }

    /// Check if this action includes data in the payload
    ///
    /// Delete actions typically don't include the full entity data.
    pub fn has_data(&self) -> bool {
        !self.is_deleted()
    }

    /// Get all possible data action values
    pub fn all() -> &'static [DataAction] {
        &[DataAction::Created, DataAction::Updated, DataAction::Deleted]
    }
}

// =============================================================================
// Data Changed Event
// =============================================================================

/// Event emitted when entity data changes
///
/// This is the primary event for cache invalidation across all connected clients.
/// When any CRUD operation occurs, the backend broadcasts this event so all
/// clients can update their local caches.
///
/// # Channel
/// @channel: data-changed
///
/// # Example (Create)
/// ```json
/// {
///   "entity": "project",
///   "action": "created",
///   "id": "550e8400-e29b-41d4-a716-446655440000",
///   "data": {
///     "id": "550e8400-e29b-41d4-a716-446655440000",
///     "name": "My Project",
///     "gitRepoPath": "/path/to/repo"
///   }
/// }
/// ```
///
/// # Example (Delete)
/// ```json
/// {
///   "entity": "task",
///   "action": "deleted",
///   "id": "660e8400-e29b-41d4-a716-446655440001",
///   "data": null
/// }
/// ```
#[typeshare]
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct DataChangedEvent {
    /// Type of entity that was changed
    pub entity: EntityType,

    /// What action occurred
    pub action: DataAction,

    /// ID of the affected entity
    pub id: String,

    /// Full entity data (for create/update, None for delete)
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub data: Option<serde_json::Value>,

    /// Optional timestamp when the change occurred (ISO 8601)
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub timestamp: Option<String>,

    /// Optional parent ID for hierarchical entities
    /// (e.g., task.project_id, message.chat_id)
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub parent_id: Option<String>,
}

impl DataChangedEvent {
    /// Create a new created event
    pub fn created(
        entity: EntityType,
        id: impl Into<String>,
        data: serde_json::Value,
    ) -> Self {
        Self {
            entity,
            action: DataAction::Created,
            id: id.into(),
            data: Some(data),
            timestamp: Some(chrono::Utc::now().to_rfc3339()),
            parent_id: None,
        }
    }

    /// Create a new updated event
    pub fn updated(
        entity: EntityType,
        id: impl Into<String>,
        data: serde_json::Value,
    ) -> Self {
        Self {
            entity,
            action: DataAction::Updated,
            id: id.into(),
            data: Some(data),
            timestamp: Some(chrono::Utc::now().to_rfc3339()),
            parent_id: None,
        }
    }

    /// Create a new deleted event
    pub fn deleted(entity: EntityType, id: impl Into<String>) -> Self {
        Self {
            entity,
            action: DataAction::Deleted,
            id: id.into(),
            data: None,
            timestamp: Some(chrono::Utc::now().to_rfc3339()),
            parent_id: None,
        }
    }

    /// Add a parent ID to this event
    ///
    /// Useful for hierarchical entities where the parent ID is needed
    /// for cache invalidation (e.g., invalidate tasks when project changes).
    pub fn with_parent_id(mut self, parent_id: impl Into<String>) -> Self {
        self.parent_id = Some(parent_id.into());
        self
    }

    /// Add an explicit timestamp to this event
    pub fn with_timestamp(mut self, timestamp: impl Into<String>) -> Self {
        self.timestamp = Some(timestamp.into());
        self
    }

    /// Check if this is a create action
    pub fn is_created(&self) -> bool {
        self.action.is_created()
    }

    /// Check if this is an update action
    pub fn is_updated(&self) -> bool {
        self.action.is_updated()
    }

    /// Check if this is a delete action
    pub fn is_deleted(&self) -> bool {
        self.action.is_deleted()
    }

    /// Check if this event has associated data
    pub fn has_data(&self) -> bool {
        self.data.is_some()
    }

    /// Check if this event has a parent ID
    pub fn has_parent(&self) -> bool {
        self.parent_id.is_some()
    }

    /// Get the query key for this entity type
    pub fn query_key(&self) -> &'static str {
        self.entity.query_key()
    }

    /// Get the channel name for this event type
    pub fn channel() -> &'static str {
        CHANNEL_DATA_CHANGED
    }
}

// =============================================================================
// WebSocket Message Types
// =============================================================================

/// Incoming WebSocket message from client
///
/// Used for WebSocket protocol between frontend and backend.
///
/// # Example (Subscribe)
/// ```json
/// { "type": "subscribe", "content": { "channel": "data-changed" } }
/// ```
///
/// # Example (Unsubscribe)
/// ```json
/// { "type": "unsubscribe", "content": { "channel": "process-output-abc123" } }
/// ```
#[typeshare]
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(tag = "type", content = "content", rename_all = "snake_case")]
pub enum WsClientMessage {
    /// Subscribe to an event channel
    Subscribe {
        /// Channel name to subscribe to
        channel: String,
    },
    /// Unsubscribe from an event channel
    Unsubscribe {
        /// Channel name to unsubscribe from
        channel: String,
    },
    /// Ping message (keep-alive)
    Ping,
}

impl WsClientMessage {
    /// Create a subscribe message
    pub fn subscribe(channel: impl Into<String>) -> Self {
        WsClientMessage::Subscribe {
            channel: channel.into(),
        }
    }

    /// Create an unsubscribe message
    pub fn unsubscribe(channel: impl Into<String>) -> Self {
        WsClientMessage::Unsubscribe {
            channel: channel.into(),
        }
    }

    /// Create a ping message
    pub fn ping() -> Self {
        WsClientMessage::Ping
    }
}

/// Outgoing WebSocket message to client
///
/// Used for WebSocket protocol between backend and frontend.
///
/// # Example (Connected)
/// ```json
/// { "type": "connected", "content": { "clientId": "abc-123" } }
/// ```
///
/// # Example (Event)
/// ```json
/// {
///   "type": "event",
///   "content": {
///     "channel": "data-changed",
///     "payload": { "entity": "project", "action": "created", ... }
///   }
/// }
/// ```
///
/// # Example (Shutdown)
/// ```json
/// { "type": "shutdown", "content": { "reason": "Server is shutting down" } }
/// ```
#[typeshare]
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(tag = "type", content = "content", rename_all = "snake_case")]
pub enum WsServerMessage {
    /// Connection established
    Connected {
        /// Unique client ID assigned by server
        client_id: String,
    },
    /// Subscription confirmed
    Subscribed {
        /// Channel that was subscribed to
        channel: String,
    },
    /// Unsubscription confirmed
    Unsubscribed {
        /// Channel that was unsubscribed from
        channel: String,
    },
    /// Pong response to ping
    Pong,
    /// Event broadcast
    Event {
        /// Channel the event was published to
        channel: String,
        /// Event payload (DataChangedEvent, ProcessOutputEvent, etc.)
        payload: serde_json::Value,
    },
    /// Error message
    Error {
        /// Error description
        error: String,
    },
    /// Server shutdown notification
    ///
    /// Sent to all clients when the server is gracefully shutting down.
    /// Clients should close their connections and attempt to reconnect later.
    Shutdown {
        /// Reason for shutdown
        reason: String,
    },
}

impl WsServerMessage {
    /// Create a connected message
    pub fn connected(client_id: impl Into<String>) -> Self {
        WsServerMessage::Connected {
            client_id: client_id.into(),
        }
    }

    /// Create a subscribed message
    pub fn subscribed(channel: impl Into<String>) -> Self {
        WsServerMessage::Subscribed {
            channel: channel.into(),
        }
    }

    /// Create an unsubscribed message
    pub fn unsubscribed(channel: impl Into<String>) -> Self {
        WsServerMessage::Unsubscribed {
            channel: channel.into(),
        }
    }

    /// Create a pong message
    pub fn pong() -> Self {
        WsServerMessage::Pong
    }

    /// Create an event message
    pub fn event(channel: impl Into<String>, payload: serde_json::Value) -> Self {
        WsServerMessage::Event {
            channel: channel.into(),
            payload,
        }
    }

    /// Create an error message
    pub fn error(error: impl Into<String>) -> Self {
        WsServerMessage::Error {
            error: error.into(),
        }
    }

    /// Create a shutdown message
    ///
    /// Used to notify clients that the server is shutting down gracefully.
    pub fn shutdown(reason: impl Into<String>) -> Self {
        WsServerMessage::Shutdown {
            reason: reason.into(),
        }
    }

    /// Create an event message from a DataChangedEvent
    pub fn data_changed(event: &DataChangedEvent) -> Self {
        WsServerMessage::Event {
            channel: CHANNEL_DATA_CHANGED.to_string(),
            payload: serde_json::to_value(event).unwrap_or_default(),
        }
    }

    /// Create an event message from a ProcessOutputEvent
    pub fn process_output(event: &ProcessOutputEvent) -> Self {
        WsServerMessage::Event {
            channel: process_output_channel(&event.process_id),
            payload: serde_json::to_value(event).unwrap_or_default(),
        }
    }

    /// Create an event message from a ProcessStatusEvent
    pub fn process_status(event: &ProcessStatusEvent) -> Self {
        WsServerMessage::Event {
            channel: process_status_channel(&event.process_id),
            payload: serde_json::to_value(event).unwrap_or_default(),
        }
    }
}

// =============================================================================
// Unified Event Enum
// =============================================================================

/// Unified event enum for all event types
///
/// This enum wraps all event types for unified broadcasting.
/// The backend can use this to broadcast any type of event.
#[typeshare]
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(tag = "eventType", content = "data", rename_all = "snake_case")]
pub enum Event {
    /// Data changed event
    DataChanged(DataChangedEvent),
    /// Process output event
    ProcessOutput(ProcessOutputEvent),
    /// Process status event
    ProcessStatus(ProcessStatusEvent),
}

impl Event {
    /// Get the channel name for this event
    pub fn channel(&self) -> String {
        match self {
            Event::DataChanged(_) => CHANNEL_DATA_CHANGED.to_string(),
            Event::ProcessOutput(e) => process_output_channel(&e.process_id),
            Event::ProcessStatus(e) => process_status_channel(&e.process_id),
        }
    }

    /// Convert to WebSocket server message
    pub fn to_ws_message(&self) -> WsServerMessage {
        match self {
            Event::DataChanged(e) => WsServerMessage::data_changed(e),
            Event::ProcessOutput(e) => WsServerMessage::process_output(e),
            Event::ProcessStatus(e) => WsServerMessage::process_status(e),
        }
    }
}

impl From<DataChangedEvent> for Event {
    fn from(event: DataChangedEvent) -> Self {
        Event::DataChanged(event)
    }
}

impl From<ProcessOutputEvent> for Event {
    fn from(event: ProcessOutputEvent) -> Self {
        Event::ProcessOutput(event)
    }
}

impl From<ProcessStatusEvent> for Event {
    fn from(event: ProcessStatusEvent) -> Self {
        Event::ProcessStatus(event)
    }
}

// =============================================================================
// Tests
// =============================================================================

#[cfg(test)]
mod tests {
    use super::*;

    // =========================================================================
    // Channel Helper Tests
    // =========================================================================

    #[test]
    fn test_process_output_channel() {
        assert_eq!(
            process_output_channel("abc-123"),
            "process-output-abc-123"
        );
    }

    #[test]
    fn test_process_status_channel() {
        assert_eq!(
            process_status_channel("abc-123"),
            "process-status-abc-123"
        );
    }

    #[test]
    fn test_parse_process_output_channel() {
        assert_eq!(
            parse_process_output_channel("process-output-abc-123"),
            Some("abc-123".to_string())
        );
        assert_eq!(
            parse_process_output_channel("process-status-abc-123"),
            None
        );
        assert_eq!(parse_process_output_channel("invalid"), None);
    }

    #[test]
    fn test_parse_process_status_channel() {
        assert_eq!(
            parse_process_status_channel("process-status-abc-123"),
            Some("abc-123".to_string())
        );
        assert_eq!(
            parse_process_status_channel("process-output-abc-123"),
            None
        );
        assert_eq!(parse_process_status_channel("invalid"), None);
    }

    // =========================================================================
    // EntityType Tests
    // =========================================================================

    #[test]
    fn test_entity_type_display() {
        assert_eq!(EntityType::Project.to_string(), "project");
        assert_eq!(EntityType::Task.to_string(), "task");
        assert_eq!(EntityType::Chat.to_string(), "chat");
        assert_eq!(EntityType::Message.to_string(), "message");
        assert_eq!(EntityType::ExecutorProfile.to_string(), "executor_profile");
        assert_eq!(EntityType::Process.to_string(), "process");
        assert_eq!(EntityType::Setting.to_string(), "setting");
        assert_eq!(EntityType::WorkflowTemplate.to_string(), "workflow_template");
        assert_eq!(EntityType::Worktree.to_string(), "worktree");
    }

    #[test]
    fn test_entity_type_from_str() {
        assert_eq!("project".parse::<EntityType>().unwrap(), EntityType::Project);
        assert_eq!("task".parse::<EntityType>().unwrap(), EntityType::Task);
        assert_eq!("executor_profile".parse::<EntityType>().unwrap(), EntityType::ExecutorProfile);
        assert_eq!("executorprofile".parse::<EntityType>().unwrap(), EntityType::ExecutorProfile);
        assert_eq!("TASK".parse::<EntityType>().unwrap(), EntityType::Task);
        assert!("invalid".parse::<EntityType>().is_err());
    }

    #[test]
    fn test_entity_type_query_key() {
        assert_eq!(EntityType::Project.query_key(), "projects");
        assert_eq!(EntityType::Task.query_key(), "tasks");
        assert_eq!(EntityType::ExecutorProfile.query_key(), "executorProfiles");
    }

    #[test]
    fn test_entity_type_all() {
        let all = EntityType::all();
        assert_eq!(all.len(), 9);
        assert!(all.contains(&EntityType::Project));
        assert!(all.contains(&EntityType::Worktree));
    }

    #[test]
    fn test_entity_type_serialization() {
        let entity = EntityType::ExecutorProfile;
        let json = serde_json::to_string(&entity).unwrap();
        assert_eq!(json, "\"executor_profile\"");

        let deserialized: EntityType = serde_json::from_str(&json).unwrap();
        assert_eq!(deserialized, EntityType::ExecutorProfile);
    }

    // =========================================================================
    // DataAction Tests
    // =========================================================================

    #[test]
    fn test_data_action_display() {
        assert_eq!(DataAction::Created.to_string(), "created");
        assert_eq!(DataAction::Updated.to_string(), "updated");
        assert_eq!(DataAction::Deleted.to_string(), "deleted");
    }

    #[test]
    fn test_data_action_from_str() {
        assert_eq!("created".parse::<DataAction>().unwrap(), DataAction::Created);
        assert_eq!("create".parse::<DataAction>().unwrap(), DataAction::Created);
        assert_eq!("updated".parse::<DataAction>().unwrap(), DataAction::Updated);
        assert_eq!("DELETED".parse::<DataAction>().unwrap(), DataAction::Deleted);
        assert!("invalid".parse::<DataAction>().is_err());
    }

    #[test]
    fn test_data_action_is_methods() {
        assert!(DataAction::Created.is_created());
        assert!(!DataAction::Created.is_updated());
        assert!(!DataAction::Created.is_deleted());
        assert!(DataAction::Created.has_data());

        assert!(DataAction::Updated.is_updated());
        assert!(DataAction::Updated.has_data());

        assert!(DataAction::Deleted.is_deleted());
        assert!(!DataAction::Deleted.has_data());
    }

    #[test]
    fn test_data_action_all() {
        let all = DataAction::all();
        assert_eq!(all.len(), 3);
    }

    #[test]
    fn test_data_action_serialization() {
        let action = DataAction::Updated;
        let json = serde_json::to_string(&action).unwrap();
        assert_eq!(json, "\"updated\"");

        let deserialized: DataAction = serde_json::from_str(&json).unwrap();
        assert_eq!(deserialized, DataAction::Updated);
    }

    // =========================================================================
    // DataChangedEvent Tests
    // =========================================================================

    #[test]
    fn test_data_changed_event_created() {
        let data = serde_json::json!({
            "id": "123",
            "name": "Test Project"
        });

        let event = DataChangedEvent::created(EntityType::Project, "123", data.clone());

        assert_eq!(event.entity, EntityType::Project);
        assert!(event.is_created());
        assert_eq!(event.id, "123");
        assert!(event.has_data());
        assert_eq!(event.data, Some(data));
        assert!(event.timestamp.is_some());
        assert!(!event.has_parent());
    }

    #[test]
    fn test_data_changed_event_updated() {
        let data = serde_json::json!({"id": "456", "title": "Updated Task"});
        let event = DataChangedEvent::updated(EntityType::Task, "456", data);

        assert!(event.is_updated());
        assert!(event.has_data());
    }

    #[test]
    fn test_data_changed_event_deleted() {
        let event = DataChangedEvent::deleted(EntityType::Message, "789");

        assert!(event.is_deleted());
        assert!(!event.has_data());
        assert_eq!(event.data, None);
    }

    #[test]
    fn test_data_changed_event_with_parent() {
        let event = DataChangedEvent::deleted(EntityType::Task, "task-123")
            .with_parent_id("project-456");

        assert!(event.has_parent());
        assert_eq!(event.parent_id, Some("project-456".to_string()));
    }

    #[test]
    fn test_data_changed_event_query_key() {
        let event = DataChangedEvent::deleted(EntityType::Project, "123");
        assert_eq!(event.query_key(), "projects");
    }

    #[test]
    fn test_data_changed_event_channel() {
        assert_eq!(DataChangedEvent::channel(), "data-changed");
    }

    #[test]
    fn test_data_changed_event_serialization() {
        let event = DataChangedEvent::created(
            EntityType::Project,
            "123",
            serde_json::json!({"name": "Test"}),
        );

        let json = serde_json::to_string(&event).unwrap();

        assert!(json.contains("\"entity\":\"project\""));
        assert!(json.contains("\"action\":\"created\""));
        assert!(json.contains("\"id\":\"123\""));
        assert!(json.contains("\"data\""));
        assert!(json.contains("\"timestamp\""));

        let deserialized: DataChangedEvent = serde_json::from_str(&json).unwrap();
        assert_eq!(event.entity, deserialized.entity);
        assert_eq!(event.action, deserialized.action);
        assert_eq!(event.id, deserialized.id);
    }

    #[test]
    fn test_data_changed_event_delete_no_data_serialization() {
        let event = DataChangedEvent::deleted(EntityType::Task, "456");
        let json = serde_json::to_string(&event).unwrap();

        // data should be omitted for deleted events
        assert!(!json.contains("\"data\":null"));
    }

    // =========================================================================
    // WsClientMessage Tests
    // =========================================================================

    #[test]
    fn test_ws_client_message_subscribe() {
        let msg = WsClientMessage::subscribe("data-changed");

        if let WsClientMessage::Subscribe { channel } = msg {
            assert_eq!(channel, "data-changed");
        } else {
            panic!("Expected Subscribe variant");
        }
    }

    #[test]
    fn test_ws_client_message_unsubscribe() {
        let msg = WsClientMessage::unsubscribe("process-output-123");

        if let WsClientMessage::Unsubscribe { channel } = msg {
            assert_eq!(channel, "process-output-123");
        } else {
            panic!("Expected Unsubscribe variant");
        }
    }

    #[test]
    fn test_ws_client_message_ping() {
        let msg = WsClientMessage::ping();
        assert!(matches!(msg, WsClientMessage::Ping));
    }

    #[test]
    fn test_ws_client_message_serialization() {
        let subscribe = WsClientMessage::subscribe("data-changed");
        let json = serde_json::to_string(&subscribe).unwrap();
        assert!(json.contains("\"type\":\"subscribe\""));
        assert!(json.contains("\"channel\":\"data-changed\""));

        let deserialized: WsClientMessage = serde_json::from_str(&json).unwrap();
        assert_eq!(subscribe, deserialized);

        let ping = WsClientMessage::ping();
        let ping_json = serde_json::to_string(&ping).unwrap();
        assert!(ping_json.contains("\"type\":\"ping\""));
    }

    // =========================================================================
    // WsServerMessage Tests
    // =========================================================================

    #[test]
    fn test_ws_server_message_connected() {
        let msg = WsServerMessage::connected("client-abc");

        if let WsServerMessage::Connected { client_id } = msg {
            assert_eq!(client_id, "client-abc");
        } else {
            panic!("Expected Connected variant");
        }
    }

    #[test]
    fn test_ws_server_message_subscribed() {
        let msg = WsServerMessage::subscribed("data-changed");

        if let WsServerMessage::Subscribed { channel } = msg {
            assert_eq!(channel, "data-changed");
        } else {
            panic!("Expected Subscribed variant");
        }
    }

    #[test]
    fn test_ws_server_message_event() {
        let payload = serde_json::json!({"test": "data"});
        let msg = WsServerMessage::event("data-changed", payload.clone());

        if let WsServerMessage::Event { channel, payload: p } = msg {
            assert_eq!(channel, "data-changed");
            assert_eq!(p, payload);
        } else {
            panic!("Expected Event variant");
        }
    }

    #[test]
    fn test_ws_server_message_error() {
        let msg = WsServerMessage::error("Something went wrong");

        if let WsServerMessage::Error { error } = msg {
            assert_eq!(error, "Something went wrong");
        } else {
            panic!("Expected Error variant");
        }
    }

    #[test]
    fn test_ws_server_message_data_changed() {
        let event = DataChangedEvent::created(
            EntityType::Project,
            "123",
            serde_json::json!({"name": "Test"}),
        );
        let msg = WsServerMessage::data_changed(&event);

        if let WsServerMessage::Event { channel, .. } = msg {
            assert_eq!(channel, "data-changed");
        } else {
            panic!("Expected Event variant");
        }
    }

    #[test]
    fn test_ws_server_message_process_output() {
        let event = ProcessOutputEvent::stdout("process-123", "Hello");
        let msg = WsServerMessage::process_output(&event);

        if let WsServerMessage::Event { channel, .. } = msg {
            assert_eq!(channel, "process-output-process-123");
        } else {
            panic!("Expected Event variant");
        }
    }

    #[test]
    fn test_ws_server_message_process_status() {
        let event = ProcessStatusEvent::completed("process-123", 0);
        let msg = WsServerMessage::process_status(&event);

        if let WsServerMessage::Event { channel, .. } = msg {
            assert_eq!(channel, "process-status-process-123");
        } else {
            panic!("Expected Event variant");
        }
    }

    #[test]
    fn test_ws_server_message_shutdown() {
        let msg = WsServerMessage::shutdown("Server is shutting down");

        if let WsServerMessage::Shutdown { reason } = msg {
            assert_eq!(reason, "Server is shutting down");
        } else {
            panic!("Expected Shutdown variant");
        }
    }

    #[test]
    fn test_ws_server_message_serialization() {
        let connected = WsServerMessage::connected("client-123");
        let json = serde_json::to_string(&connected).unwrap();
        assert!(json.contains("\"type\":\"connected\""));
        // Note: serde tag serialization uses snake_case for field names in enum variants
        assert!(json.contains("\"client_id\":\"client-123\""));

        let pong = WsServerMessage::pong();
        let pong_json = serde_json::to_string(&pong).unwrap();
        assert!(pong_json.contains("\"type\":\"pong\""));

        // Test shutdown serialization
        let shutdown = WsServerMessage::shutdown("Maintenance");
        let shutdown_json = serde_json::to_string(&shutdown).unwrap();
        assert!(shutdown_json.contains("\"type\":\"shutdown\""));
        assert!(shutdown_json.contains("\"reason\":\"Maintenance\""));

        let deserialized: WsServerMessage = serde_json::from_str(&shutdown_json).unwrap();
        assert_eq!(shutdown, deserialized);
    }

    // =========================================================================
    // Event Tests
    // =========================================================================

    #[test]
    fn test_event_from_data_changed() {
        let data_event = DataChangedEvent::created(
            EntityType::Project,
            "123",
            serde_json::json!({}),
        );
        let event: Event = data_event.into();

        assert!(matches!(event, Event::DataChanged(_)));
        assert_eq!(event.channel(), "data-changed");
    }

    #[test]
    fn test_event_from_process_output() {
        let output_event = ProcessOutputEvent::stdout("process-123", "output");
        let event: Event = output_event.into();

        assert!(matches!(event, Event::ProcessOutput(_)));
        assert_eq!(event.channel(), "process-output-process-123");
    }

    #[test]
    fn test_event_from_process_status() {
        let status_event = ProcessStatusEvent::completed("process-123", 0);
        let event: Event = status_event.into();

        assert!(matches!(event, Event::ProcessStatus(_)));
        assert_eq!(event.channel(), "process-status-process-123");
    }

    #[test]
    fn test_event_to_ws_message() {
        let data_event = DataChangedEvent::created(
            EntityType::Task,
            "456",
            serde_json::json!({}),
        );
        let event: Event = data_event.into();
        let ws_msg = event.to_ws_message();

        assert!(matches!(ws_msg, WsServerMessage::Event { .. }));
    }

    #[test]
    fn test_event_serialization() {
        let event = Event::DataChanged(DataChangedEvent::deleted(EntityType::Chat, "789"));
        let json = serde_json::to_string(&event).unwrap();

        assert!(json.contains("\"eventType\":\"data_changed\""));

        let deserialized: Event = serde_json::from_str(&json).unwrap();
        assert!(matches!(deserialized, Event::DataChanged(_)));
    }
}
