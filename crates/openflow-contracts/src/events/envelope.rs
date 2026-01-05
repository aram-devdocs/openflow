//! Event Envelope for Real-Time Event Delivery
//!
//! The `EventEnvelope` struct wraps any event type with metadata required for
//! reliable real-time delivery, ordering, and deduplication across clients.
//!
//! # Architecture
//!
//! Every event broadcast from the backend is wrapped in an `EventEnvelope` before
//! being sent to clients. This provides:
//!
//! - **Ordering**: Monotonically increasing sequence numbers per session
//! - **Deduplication**: Clients can detect and ignore duplicate events
//! - **Timing**: ISO 8601 timestamps for debugging and replay
//! - **Context**: Session ID links events to their source
//!
//! ```text
//! ┌─────────────────────────────────────────────────────────────────────────┐
//! │                         Event Envelope Flow                             │
//! ├─────────────────────────────────────────────────────────────────────────┤
//! │                                                                          │
//! │  Agent Output          Backend                     Client               │
//! │  {"type":"message"}    EventEnvelope {             Validate sequence    │
//! │          │              session_id: "abc",         Deduplicate          │
//! │          └────────────▶ sequence: 42,      ─────▶  Update cache         │
//! │                         timestamp: "...",          Render UI            │
//! │                         payload: {...}                                  │
//! │                        }                                                │
//! │                                                                          │
//! └─────────────────────────────────────────────────────────────────────────┘
//! ```

use serde::{Deserialize, Serialize};
use typeshare::typeshare;

use super::UnifiedAgentEvent;

// =============================================================================
// Event Type Classification
// =============================================================================

/// Type classification for events in an envelope
///
/// Used to quickly identify the category of event without deserializing
/// the full payload. This enables efficient event routing and filtering.
#[typeshare]
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, Hash)]
#[serde(rename_all = "snake_case")]
pub enum EventType {
    /// Agent session initialization
    Init,
    /// Message from user or assistant
    Message,
    /// Agent is calling a tool
    ToolUse,
    /// Result from a tool execution
    ToolResult,
    /// Agent session completed
    Complete,
    /// An error occurred
    Error,
    /// Permission request from agent
    Permission,
    /// Task-level progress event
    TaskProgress,
    /// Step-level progress event
    StepProgress,
    /// Data changed event (CRUD)
    DataChanged,
    /// Process output event
    ProcessOutput,
    /// Process status event
    ProcessStatus,
}

impl EventType {
    /// Check if this is an agent-related event type
    pub fn is_agent_event(&self) -> bool {
        matches!(
            self,
            EventType::Init
                | EventType::Message
                | EventType::ToolUse
                | EventType::ToolResult
                | EventType::Complete
                | EventType::Error
                | EventType::Permission
        )
    }

    /// Check if this is a task-related event type
    pub fn is_task_event(&self) -> bool {
        matches!(self, EventType::TaskProgress | EventType::StepProgress)
    }

    /// Check if this is a data mutation event
    pub fn is_data_event(&self) -> bool {
        matches!(self, EventType::DataChanged)
    }

    /// Check if this is a process-related event
    pub fn is_process_event(&self) -> bool {
        matches!(self, EventType::ProcessOutput | EventType::ProcessStatus)
    }

    /// Get the event type from a UnifiedAgentEvent
    pub fn from_agent_event(event: &UnifiedAgentEvent) -> Self {
        match event {
            UnifiedAgentEvent::Init { .. } => EventType::Init,
            UnifiedAgentEvent::Message { .. } => EventType::Message,
            UnifiedAgentEvent::ToolUse { .. } => EventType::ToolUse,
            UnifiedAgentEvent::ToolResult { .. } => EventType::ToolResult,
            UnifiedAgentEvent::Complete { .. } => EventType::Complete,
            UnifiedAgentEvent::Error { .. } => EventType::Error,
            UnifiedAgentEvent::Permission { .. } => EventType::Permission,
        }
    }
}

impl std::fmt::Display for EventType {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            EventType::Init => write!(f, "init"),
            EventType::Message => write!(f, "message"),
            EventType::ToolUse => write!(f, "tool_use"),
            EventType::ToolResult => write!(f, "tool_result"),
            EventType::Complete => write!(f, "complete"),
            EventType::Error => write!(f, "error"),
            EventType::Permission => write!(f, "permission"),
            EventType::TaskProgress => write!(f, "task_progress"),
            EventType::StepProgress => write!(f, "step_progress"),
            EventType::DataChanged => write!(f, "data_changed"),
            EventType::ProcessOutput => write!(f, "process_output"),
            EventType::ProcessStatus => write!(f, "process_status"),
        }
    }
}

impl std::str::FromStr for EventType {
    type Err = String;

    fn from_str(s: &str) -> Result<Self, Self::Err> {
        match s.to_lowercase().as_str() {
            "init" => Ok(EventType::Init),
            "message" => Ok(EventType::Message),
            "tool_use" | "tooluse" => Ok(EventType::ToolUse),
            "tool_result" | "toolresult" => Ok(EventType::ToolResult),
            "complete" => Ok(EventType::Complete),
            "error" => Ok(EventType::Error),
            "permission" => Ok(EventType::Permission),
            "task_progress" | "taskprogress" => Ok(EventType::TaskProgress),
            "step_progress" | "stepprogress" => Ok(EventType::StepProgress),
            "data_changed" | "datachanged" => Ok(EventType::DataChanged),
            "process_output" | "processoutput" => Ok(EventType::ProcessOutput),
            "process_status" | "processstatus" => Ok(EventType::ProcessStatus),
            _ => Err(format!("Invalid event type: {}", s)),
        }
    }
}

// =============================================================================
// Event Envelope
// =============================================================================

/// Generic event envelope for all broadcast events
///
/// Wraps any event type with metadata required for reliable delivery:
///
/// - **event_type**: Quick classification without deserializing payload
/// - **session_id**: Links event to its source session/process
/// - **sequence**: Monotonically increasing number for ordering and deduplication
/// - **timestamp**: ISO 8601 timestamp for debugging and replay
/// - **payload**: The actual event data
///
/// # Type Parameter
///
/// The `T` parameter is the payload type. Common uses:
/// - `EventEnvelope<UnifiedAgentEvent>` for agent events
/// - `EventEnvelope<DataChangedEvent>` for data mutations
/// - `EventEnvelope<serde_json::Value>` for generic events
///
/// # Example
///
/// ```rust
/// use openflow_contracts::events::{EventEnvelope, UnifiedAgentEvent, EventType};
///
/// let event = UnifiedAgentEvent::assistant_text("Hello!");
/// let envelope = EventEnvelope::new("session-123", 1, event);
///
/// assert_eq!(envelope.event_type, EventType::Message);
/// assert_eq!(envelope.session_id, "session-123");
/// assert_eq!(envelope.sequence, 1);
/// ```
#[typeshare]
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct EventEnvelope<T> {
    /// Type classification for quick routing
    pub event_type: EventType,

    /// Session or process ID this event belongs to
    pub session_id: String,

    /// Monotonically increasing sequence number within this session
    ///
    /// Used for:
    /// - Ordering events (events with lower sequence came first)
    /// - Deduplication (ignore events with sequence <= last seen)
    /// - Gap detection (sequence jumps indicate missed events)
    pub sequence: i32,

    /// ISO 8601 timestamp when the event was created
    ///
    /// Format: `2025-01-04T12:34:56.789Z`
    pub timestamp: String,

    /// The actual event payload
    pub payload: T,
}

impl<T> EventEnvelope<T> {
    /// Create a new envelope with the current timestamp
    ///
    /// The event_type is automatically inferred when T is UnifiedAgentEvent.
    /// For other types, use `new_with_type` to specify the type explicitly.
    pub fn now(session_id: impl Into<String>, sequence: i32, event_type: EventType, payload: T) -> Self {
        Self {
            event_type,
            session_id: session_id.into(),
            sequence,
            timestamp: chrono::Utc::now().to_rfc3339_opts(chrono::SecondsFormat::Millis, true),
            payload,
        }
    }

    /// Create a new envelope with a custom timestamp
    pub fn with_timestamp(
        session_id: impl Into<String>,
        sequence: i32,
        event_type: EventType,
        timestamp: impl Into<String>,
        payload: T,
    ) -> Self {
        Self {
            event_type,
            session_id: session_id.into(),
            sequence,
            timestamp: timestamp.into(),
            payload,
        }
    }

    /// Check if this envelope comes before another (by sequence)
    pub fn is_before(&self, other: &EventEnvelope<T>) -> bool {
        self.sequence < other.sequence
    }

    /// Check if this envelope comes after another (by sequence)
    pub fn is_after(&self, other: &EventEnvelope<T>) -> bool {
        self.sequence > other.sequence
    }

    /// Get the sequence number
    pub fn sequence(&self) -> i32 {
        self.sequence
    }

    /// Get the session ID
    pub fn session_id(&self) -> &str {
        &self.session_id
    }

    /// Map the payload to a different type
    pub fn map<U, F>(self, f: F) -> EventEnvelope<U>
    where
        F: FnOnce(T) -> U,
    {
        EventEnvelope {
            event_type: self.event_type,
            session_id: self.session_id,
            sequence: self.sequence,
            timestamp: self.timestamp,
            payload: f(self.payload),
        }
    }

    /// Get a reference to the payload
    pub fn payload(&self) -> &T {
        &self.payload
    }

    /// Consume the envelope and return the payload
    pub fn into_payload(self) -> T {
        self.payload
    }
}

impl EventEnvelope<UnifiedAgentEvent> {
    /// Create a new envelope for a UnifiedAgentEvent
    ///
    /// The event_type is automatically inferred from the event variant.
    pub fn new(session_id: impl Into<String>, sequence: i32, event: UnifiedAgentEvent) -> Self {
        let event_type = EventType::from_agent_event(&event);
        Self::now(session_id, sequence, event_type, event)
    }

    /// Create an envelope from a UnifiedAgentEvent with custom timestamp
    pub fn new_at(
        session_id: impl Into<String>,
        sequence: i32,
        timestamp: impl Into<String>,
        event: UnifiedAgentEvent,
    ) -> Self {
        let event_type = EventType::from_agent_event(&event);
        Self::with_timestamp(session_id, sequence, event_type, timestamp, event)
    }
}

impl EventEnvelope<serde_json::Value> {
    /// Create an envelope from any serializable payload
    pub fn from_value<T: Serialize>(
        session_id: impl Into<String>,
        sequence: i32,
        event_type: EventType,
        payload: &T,
    ) -> Result<Self, serde_json::Error> {
        let value = serde_json::to_value(payload)?;
        Ok(Self::now(session_id, sequence, event_type, value))
    }
}

// =============================================================================
// Event Envelope Record (for database storage)
// =============================================================================

/// Flattened event record for database storage
///
/// This struct mirrors the `agent_events` table schema and is used for
/// persisting events to SQLite. The payload is stored as a JSON string.
#[typeshare]
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct AgentEventRecord {
    /// Unique event ID
    pub id: String,

    /// Session ID this event belongs to
    pub session_id: String,

    /// Monotonically increasing sequence number
    pub sequence: i32,

    /// Event type as string
    pub event_type: String,

    /// JSON payload
    pub payload: serde_json::Value,

    /// ISO 8601 timestamp
    pub created_at: String,
}

impl AgentEventRecord {
    /// Create a new record from an envelope
    pub fn from_envelope(id: impl Into<String>, envelope: &EventEnvelope<UnifiedAgentEvent>) -> Self {
        Self {
            id: id.into(),
            session_id: envelope.session_id.clone(),
            sequence: envelope.sequence,
            event_type: envelope.event_type.to_string(),
            payload: serde_json::to_value(&envelope.payload).unwrap_or_default(),
            created_at: envelope.timestamp.clone(),
        }
    }

    /// Convert back to an envelope (may fail if payload doesn't deserialize)
    pub fn to_envelope(&self) -> Result<EventEnvelope<UnifiedAgentEvent>, serde_json::Error> {
        let event: UnifiedAgentEvent = serde_json::from_value(self.payload.clone())?;
        let event_type = self.event_type.parse().unwrap_or(EventType::Message);
        Ok(EventEnvelope {
            event_type,
            session_id: self.session_id.clone(),
            sequence: self.sequence,
            timestamp: self.created_at.clone(),
            payload: event,
        })
    }
}

// =============================================================================
// Channel Constants (re-exported from channels module for convenience)
// =============================================================================

// Note: Channel constants and helper functions are now centralized in the
// `channels` module. They are re-exported through the parent `events` module.
// See `crates/openflow-contracts/src/events/channels.rs` for the complete set.

// =============================================================================
// Tests
// =============================================================================

#[cfg(test)]
mod tests {
    use super::*;
    use crate::events::AgentMessageRole;

    // =========================================================================
    // EventType Tests
    // =========================================================================

    #[test]
    fn test_event_type_display() {
        assert_eq!(EventType::Init.to_string(), "init");
        assert_eq!(EventType::Message.to_string(), "message");
        assert_eq!(EventType::ToolUse.to_string(), "tool_use");
        assert_eq!(EventType::ToolResult.to_string(), "tool_result");
        assert_eq!(EventType::Complete.to_string(), "complete");
        assert_eq!(EventType::Error.to_string(), "error");
        assert_eq!(EventType::Permission.to_string(), "permission");
        assert_eq!(EventType::TaskProgress.to_string(), "task_progress");
        assert_eq!(EventType::StepProgress.to_string(), "step_progress");
        assert_eq!(EventType::DataChanged.to_string(), "data_changed");
        assert_eq!(EventType::ProcessOutput.to_string(), "process_output");
        assert_eq!(EventType::ProcessStatus.to_string(), "process_status");
    }

    #[test]
    fn test_event_type_from_str() {
        assert_eq!("init".parse::<EventType>().unwrap(), EventType::Init);
        assert_eq!("message".parse::<EventType>().unwrap(), EventType::Message);
        assert_eq!("tool_use".parse::<EventType>().unwrap(), EventType::ToolUse);
        assert_eq!("tooluse".parse::<EventType>().unwrap(), EventType::ToolUse);
        assert_eq!("COMPLETE".parse::<EventType>().unwrap(), EventType::Complete);
        assert!("invalid".parse::<EventType>().is_err());
    }

    #[test]
    fn test_event_type_is_agent_event() {
        assert!(EventType::Init.is_agent_event());
        assert!(EventType::Message.is_agent_event());
        assert!(EventType::ToolUse.is_agent_event());
        assert!(EventType::ToolResult.is_agent_event());
        assert!(EventType::Complete.is_agent_event());
        assert!(EventType::Error.is_agent_event());
        assert!(EventType::Permission.is_agent_event());

        assert!(!EventType::TaskProgress.is_agent_event());
        assert!(!EventType::DataChanged.is_agent_event());
    }

    #[test]
    fn test_event_type_is_task_event() {
        assert!(EventType::TaskProgress.is_task_event());
        assert!(EventType::StepProgress.is_task_event());

        assert!(!EventType::Init.is_task_event());
        assert!(!EventType::Message.is_task_event());
    }

    #[test]
    fn test_event_type_is_data_event() {
        assert!(EventType::DataChanged.is_data_event());

        assert!(!EventType::Init.is_data_event());
        assert!(!EventType::TaskProgress.is_data_event());
    }

    #[test]
    fn test_event_type_is_process_event() {
        assert!(EventType::ProcessOutput.is_process_event());
        assert!(EventType::ProcessStatus.is_process_event());

        assert!(!EventType::Init.is_process_event());
        assert!(!EventType::DataChanged.is_process_event());
    }

    #[test]
    fn test_event_type_from_agent_event() {
        assert_eq!(
            EventType::from_agent_event(&UnifiedAgentEvent::init("s", "m", vec![])),
            EventType::Init
        );
        assert_eq!(
            EventType::from_agent_event(&UnifiedAgentEvent::assistant_text("hi")),
            EventType::Message
        );
        assert_eq!(
            EventType::from_agent_event(&UnifiedAgentEvent::tool_use("t", "n", serde_json::json!({}))),
            EventType::ToolUse
        );
        assert_eq!(
            EventType::from_agent_event(&UnifiedAgentEvent::tool_result_success("t", "out")),
            EventType::ToolResult
        );
        assert_eq!(
            EventType::from_agent_event(&UnifiedAgentEvent::complete_success(None)),
            EventType::Complete
        );
        assert_eq!(
            EventType::from_agent_event(&UnifiedAgentEvent::error("code", "msg")),
            EventType::Error
        );
        assert_eq!(
            EventType::from_agent_event(&UnifiedAgentEvent::permission("tool", "desc", None)),
            EventType::Permission
        );
    }

    #[test]
    fn test_event_type_serialization() {
        let event_type = EventType::ToolUse;
        let json = serde_json::to_string(&event_type).unwrap();
        assert_eq!(json, "\"tool_use\"");

        let deserialized: EventType = serde_json::from_str(&json).unwrap();
        assert_eq!(deserialized, EventType::ToolUse);
    }

    // =========================================================================
    // EventEnvelope Tests
    // =========================================================================

    #[test]
    fn test_event_envelope_new() {
        let event = UnifiedAgentEvent::assistant_text("Hello!");
        let envelope = EventEnvelope::new("session-123", 42, event.clone());

        assert_eq!(envelope.event_type, EventType::Message);
        assert_eq!(envelope.session_id, "session-123");
        assert_eq!(envelope.sequence, 42);
        assert!(!envelope.timestamp.is_empty());
        assert_eq!(envelope.payload, event);
    }

    #[test]
    fn test_event_envelope_now() {
        let envelope: EventEnvelope<String> = EventEnvelope::now(
            "sess-1",
            1,
            EventType::TaskProgress,
            "test payload".to_string(),
        );

        assert_eq!(envelope.event_type, EventType::TaskProgress);
        assert_eq!(envelope.session_id, "sess-1");
        assert_eq!(envelope.sequence, 1);
        assert_eq!(envelope.payload, "test payload");
    }

    #[test]
    fn test_event_envelope_with_timestamp() {
        let event = UnifiedAgentEvent::error("code", "message");
        let envelope = EventEnvelope::new_at(
            "sess-2",
            10,
            "2025-01-04T00:00:00.000Z",
            event.clone(),
        );

        assert_eq!(envelope.timestamp, "2025-01-04T00:00:00.000Z");
        assert_eq!(envelope.sequence, 10);
        assert_eq!(envelope.payload, event);
    }

    #[test]
    fn test_event_envelope_ordering() {
        let event = UnifiedAgentEvent::assistant_text("test");
        let envelope1 = EventEnvelope::new("sess", 1, event.clone());
        let envelope2 = EventEnvelope::new("sess", 2, event.clone());

        assert!(envelope1.is_before(&envelope2));
        assert!(!envelope1.is_after(&envelope2));
        assert!(envelope2.is_after(&envelope1));
        assert!(!envelope2.is_before(&envelope1));
    }

    #[test]
    fn test_event_envelope_accessors() {
        let event = UnifiedAgentEvent::init("s", "m", vec!["tool".to_string()]);
        let envelope = EventEnvelope::new("sess-abc", 99, event.clone());

        assert_eq!(envelope.session_id(), "sess-abc");
        assert_eq!(envelope.sequence(), 99);
        assert_eq!(envelope.payload(), &event);
        assert_eq!(envelope.into_payload(), event);
    }

    #[test]
    fn test_event_envelope_map() {
        let event = UnifiedAgentEvent::assistant_text("hello");
        let envelope = EventEnvelope::new("sess", 1, event);

        let mapped = envelope.map(|e| {
            if let UnifiedAgentEvent::Message { content, .. } = e {
                content.len()
            } else {
                0
            }
        });

        assert_eq!(mapped.payload, 1);
        assert_eq!(mapped.session_id, "sess");
        assert_eq!(mapped.sequence, 1);
    }

    #[test]
    fn test_event_envelope_from_value() {
        #[derive(Serialize)]
        struct TestPayload {
            count: i32,
        }

        let payload = TestPayload { count: 42 };
        let envelope = EventEnvelope::from_value(
            "sess",
            1,
            EventType::DataChanged,
            &payload,
        )
        .unwrap();

        assert_eq!(envelope.event_type, EventType::DataChanged);
        assert_eq!(envelope.payload["count"], 42);
    }

    #[test]
    fn test_event_envelope_serialization() {
        let event = UnifiedAgentEvent::tool_use("tool-1", "Read", serde_json::json!({"path": "/file.rs"}));
        let envelope = EventEnvelope::new_at("sess-123", 5, "2025-01-04T12:00:00.000Z", event);

        let json = serde_json::to_string(&envelope).unwrap();

        assert!(json.contains("\"eventType\":\"tool_use\""));
        assert!(json.contains("\"sessionId\":\"sess-123\""));
        assert!(json.contains("\"sequence\":5"));
        assert!(json.contains("\"timestamp\":\"2025-01-04T12:00:00.000Z\""));
        assert!(json.contains("\"payload\":{"));

        let deserialized: EventEnvelope<UnifiedAgentEvent> = serde_json::from_str(&json).unwrap();
        assert_eq!(envelope, deserialized);
    }

    #[test]
    fn test_event_envelope_generic_payload_serialization() {
        let envelope: EventEnvelope<serde_json::Value> = EventEnvelope::now(
            "sess",
            1,
            EventType::TaskProgress,
            serde_json::json!({"status": "running", "progress": 50}),
        );

        let json = serde_json::to_string(&envelope).unwrap();

        assert!(json.contains("\"eventType\":\"task_progress\""));
        assert!(json.contains("\"status\":\"running\""));
        assert!(json.contains("\"progress\":50"));

        let deserialized: EventEnvelope<serde_json::Value> = serde_json::from_str(&json).unwrap();
        assert_eq!(envelope, deserialized);
    }

    // =========================================================================
    // AgentEventRecord Tests
    // =========================================================================

    #[test]
    fn test_agent_event_record_from_envelope() {
        let event = UnifiedAgentEvent::message(
            AgentMessageRole::Assistant,
            vec![crate::events::ContentBlock::text("Hello")],
        );
        let envelope = EventEnvelope::new_at("sess-123", 42, "2025-01-04T12:00:00.000Z", event);

        let record = AgentEventRecord::from_envelope("event-id-1", &envelope);

        assert_eq!(record.id, "event-id-1");
        assert_eq!(record.session_id, "sess-123");
        assert_eq!(record.sequence, 42);
        assert_eq!(record.event_type, "message");
        assert_eq!(record.created_at, "2025-01-04T12:00:00.000Z");
        assert!(record.payload.is_object());
    }

    #[test]
    fn test_agent_event_record_roundtrip() {
        let event = UnifiedAgentEvent::tool_result_success("tool-1", "output data");
        let envelope = EventEnvelope::new_at("sess-456", 99, "2025-01-04T13:00:00.000Z", event.clone());

        let record = AgentEventRecord::from_envelope("evt-abc", &envelope);
        let restored = record.to_envelope().unwrap();

        assert_eq!(restored.session_id, "sess-456");
        assert_eq!(restored.sequence, 99);
        assert_eq!(restored.timestamp, "2025-01-04T13:00:00.000Z");
        assert_eq!(restored.payload, event);
    }

    #[test]
    fn test_agent_event_record_serialization() {
        let event = UnifiedAgentEvent::complete_success(None);
        let envelope = EventEnvelope::new("sess", 1, event);
        let record = AgentEventRecord::from_envelope("id", &envelope);

        let json = serde_json::to_string(&record).unwrap();

        assert!(json.contains("\"id\":\"id\""));
        assert!(json.contains("\"sessionId\":\"sess\""));
        assert!(json.contains("\"sequence\":1"));
        assert!(json.contains("\"eventType\":\"complete\""));

        let deserialized: AgentEventRecord = serde_json::from_str(&json).unwrap();
        assert_eq!(record, deserialized);
    }

    // Note: Channel helper tests have been moved to the `channels` module.
    // See `crates/openflow-contracts/src/events/channels.rs` for comprehensive tests.
}
