//! Normalized Agent Event Types
//!
//! Normalized events are the canonical format for agent execution events.
//! All provider-specific events (from Claude Code, Gemini CLI, etc.) are
//! transformed into these normalized types before being persisted and
//! streamed to the frontend.
//!
//! # Architecture
//!
//! ```text
//! ┌─────────────────────────────────────────────────────────────────────────┐
//! │                    Event Normalization Pipeline                          │
//! ├─────────────────────────────────────────────────────────────────────────┤
//! │                                                                          │
//! │  UnifiedAgentEvent    →    Normalizer    →    NormalizedEntry           │
//! │  (provider-agnostic)       (enrichment)       (canonical format)        │
//! │                                                                          │
//! │  - Raw event from CLI      - Add sequence      - Single source of truth │
//! │  - Provider normalized     - Add timestamp     - Database storage       │
//! │  - Type-safe enum          - Extract metadata  - Frontend streaming     │
//! │                                                                          │
//! └─────────────────────────────────────────────────────────────────────────┘
//! ```
//!
//! # Database
//!
//! NormalizedEntry maps to the `normalized_events` table (migration TBD).

use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use typeshare::typeshare;

use super::{AgentMessageRole, AgentStats, CompletionStatus, ToolResultStatus};

// =============================================================================
// Entry Metadata
// =============================================================================

/// Metadata associated with a normalized entry
///
/// Contains optional contextual information extracted from the event,
/// such as file paths, commands, and relationships to other entries.
///
/// # Example
/// ```json
/// {
///   "filePath": "/src/main.rs",
///   "command": "cargo build",
///   "exitCode": 0,
///   "parentToolId": "tool-abc-123"
/// }
/// ```
#[typeshare]
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct EntryMetadata {
    /// File path if the operation involves a specific file
    #[serde(skip_serializing_if = "Option::is_none")]
    pub file_path: Option<String>,

    /// Command being executed (for Bash/shell operations)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub command: Option<String>,

    /// Exit code for completed operations
    #[serde(skip_serializing_if = "Option::is_none")]
    pub exit_code: Option<i32>,

    /// Parent tool ID for nested operations
    #[serde(skip_serializing_if = "Option::is_none")]
    pub parent_tool_id: Option<String>,
}

impl EntryMetadata {
    /// Create empty metadata
    pub fn new() -> Self {
        Self {
            file_path: None,
            command: None,
            exit_code: None,
            parent_tool_id: None,
        }
    }

    /// Create metadata with a file path
    pub fn with_file_path(file_path: impl Into<String>) -> Self {
        Self {
            file_path: Some(file_path.into()),
            command: None,
            exit_code: None,
            parent_tool_id: None,
        }
    }

    /// Create metadata with a command
    pub fn with_command(command: impl Into<String>) -> Self {
        Self {
            file_path: None,
            command: Some(command.into()),
            exit_code: None,
            parent_tool_id: None,
        }
    }

    /// Add a file path to existing metadata
    pub fn set_file_path(mut self, file_path: impl Into<String>) -> Self {
        self.file_path = Some(file_path.into());
        self
    }

    /// Add a command to existing metadata
    pub fn set_command(mut self, command: impl Into<String>) -> Self {
        self.command = Some(command.into());
        self
    }

    /// Add an exit code to existing metadata
    pub fn set_exit_code(mut self, exit_code: i32) -> Self {
        self.exit_code = Some(exit_code);
        self
    }

    /// Add a parent tool ID to existing metadata
    pub fn set_parent_tool_id(mut self, parent_tool_id: impl Into<String>) -> Self {
        self.parent_tool_id = Some(parent_tool_id.into());
        self
    }

    /// Check if metadata has any fields set
    pub fn is_empty(&self) -> bool {
        self.file_path.is_none()
            && self.command.is_none()
            && self.exit_code.is_none()
            && self.parent_tool_id.is_none()
    }
}

impl Default for EntryMetadata {
    fn default() -> Self {
        Self::new()
    }
}

// =============================================================================
// Entry Type Enum
// =============================================================================

/// Type of normalized entry
///
/// Represents the different kinds of events that can occur during agent execution.
/// Each variant contains the specific data for that event type.
///
/// # Serialization
///
/// Serialized as a tagged union with camelCase fields:
/// ```json
/// {"type": "init", "sessionId": "...", "model": "...", "tools": [...]}
/// {"type": "message", "role": "assistant"}
/// {"type": "toolUse", "toolId": "...", "toolName": "...", "input": {...}}
/// ```
#[typeshare]
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(tag = "type", content = "content", rename_all = "camelCase")]
pub enum EntryType {
    /// Session initialization
    ///
    /// Emitted when an agent session starts, containing model info
    /// and list of available tools.
    Init {
        /// External session ID for resume capability
        session_id: String,
        /// Model being used (e.g., "claude-sonnet-4-20250514")
        model: String,
        /// List of available tool names
        tools: Vec<String>,
    },

    /// A message in the conversation
    ///
    /// Contains text or other content from user or assistant.
    Message {
        /// Role of the message author (user, assistant, system)
        role: AgentMessageRole,
    },

    /// Agent is calling a tool
    ///
    /// Emitted when the agent decides to use a tool.
    ToolUse {
        /// Unique ID for this tool call
        tool_id: String,
        /// Name of the tool being called
        tool_name: String,
        /// Input arguments as JSON
        input: serde_json::Value,
    },

    /// Result from a tool execution
    ///
    /// Emitted after a tool completes, with the output or error.
    ToolResult {
        /// ID of the tool use this is a result for
        tool_id: String,
        /// Status of the tool execution (success, error, cancelled)
        status: ToolResultStatus,
        /// Output from the tool
        output: String,
        /// Duration in milliseconds (if available)
        #[serde(skip_serializing_if = "Option::is_none")]
        duration_ms: Option<i32>,
    },

    /// An error occurred
    ///
    /// Emitted when an error happens during the session.
    Error {
        /// Error code (e.g., "rate_limit", "context_exceeded")
        code: String,
        /// Whether the error is recoverable (session can continue)
        recoverable: bool,
    },

    /// System-level event
    ///
    /// Internal events for tracking system state changes.
    System {
        /// Subtype of system event (e.g., "pause", "resume", "config_change")
        subtype: String,
    },

    /// Session completed
    ///
    /// Emitted when the agent session ends, with completion status
    /// and optional statistics.
    Complete {
        /// How the session completed
        status: CompletionStatus,
        /// Optional session statistics (tokens, duration, etc.)
        #[serde(skip_serializing_if = "Option::is_none")]
        stats: Option<AgentStats>,
    },
}

impl EntryType {
    /// Create an init entry type
    pub fn init(
        session_id: impl Into<String>,
        model: impl Into<String>,
        tools: Vec<String>,
    ) -> Self {
        EntryType::Init {
            session_id: session_id.into(),
            model: model.into(),
            tools,
        }
    }

    /// Create a message entry type
    pub fn message(role: AgentMessageRole) -> Self {
        EntryType::Message { role }
    }

    /// Create a tool use entry type
    pub fn tool_use(
        tool_id: impl Into<String>,
        tool_name: impl Into<String>,
        input: serde_json::Value,
    ) -> Self {
        EntryType::ToolUse {
            tool_id: tool_id.into(),
            tool_name: tool_name.into(),
            input,
        }
    }

    /// Create a tool result entry type
    pub fn tool_result(
        tool_id: impl Into<String>,
        status: ToolResultStatus,
        output: impl Into<String>,
        duration_ms: Option<i32>,
    ) -> Self {
        EntryType::ToolResult {
            tool_id: tool_id.into(),
            status,
            output: output.into(),
            duration_ms,
        }
    }

    /// Create an error entry type
    pub fn error(code: impl Into<String>, recoverable: bool) -> Self {
        EntryType::Error {
            code: code.into(),
            recoverable,
        }
    }

    /// Create a system entry type
    pub fn system(subtype: impl Into<String>) -> Self {
        EntryType::System {
            subtype: subtype.into(),
        }
    }

    /// Create a complete entry type
    pub fn complete(status: CompletionStatus, stats: Option<AgentStats>) -> Self {
        EntryType::Complete { status, stats }
    }

    /// Check if this is an init entry
    pub fn is_init(&self) -> bool {
        matches!(self, EntryType::Init { .. })
    }

    /// Check if this is a message entry
    pub fn is_message(&self) -> bool {
        matches!(self, EntryType::Message { .. })
    }

    /// Check if this is a tool use entry
    pub fn is_tool_use(&self) -> bool {
        matches!(self, EntryType::ToolUse { .. })
    }

    /// Check if this is a tool result entry
    pub fn is_tool_result(&self) -> bool {
        matches!(self, EntryType::ToolResult { .. })
    }

    /// Check if this is an error entry
    pub fn is_error(&self) -> bool {
        matches!(self, EntryType::Error { .. })
    }

    /// Check if this is a system entry
    pub fn is_system(&self) -> bool {
        matches!(self, EntryType::System { .. })
    }

    /// Check if this is a complete entry
    pub fn is_complete(&self) -> bool {
        matches!(self, EntryType::Complete { .. })
    }

    /// Get a string representation of the entry type
    pub fn type_name(&self) -> &'static str {
        match self {
            EntryType::Init { .. } => "init",
            EntryType::Message { .. } => "message",
            EntryType::ToolUse { .. } => "tool_use",
            EntryType::ToolResult { .. } => "tool_result",
            EntryType::Error { .. } => "error",
            EntryType::System { .. } => "system",
            EntryType::Complete { .. } => "complete",
        }
    }
}

// =============================================================================
// Normalized Entry
// =============================================================================

/// Normalized entry - the canonical format for all agent events
///
/// All agent events from any provider are transformed into this format
/// before being persisted to the database and streamed to clients.
///
/// # Purpose
///
/// NormalizedEntry provides:
/// - **Single source of truth**: All events stored in one format
/// - **Sequencing**: Monotonic sequence numbers per session
/// - **Timestamps**: Precise timing for each event
/// - **Metadata**: Rich context for debugging and UI display
/// - **Type safety**: Strongly typed event variants
///
/// # Database
///
/// @entity
/// @table: normalized_events
///
/// # Example
/// ```json
/// {
///   "id": "evt-550e8400-e29b-41d4-a716-446655440000",
///   "sessionId": "sess-660e8400-e29b-41d4-a716-446655440001",
///   "sequence": 42,
///   "entryType": {
///     "type": "toolUse",
///     "toolId": "tool-abc-123",
///     "toolName": "Read",
///     "input": {"filePath": "/src/main.rs"}
///   },
///   "content": "Reading file: /src/main.rs",
///   "timestamp": "2024-01-15T10:30:45.123Z",
///   "metadata": {
///     "filePath": "/src/main.rs"
///   }
/// }
/// ```
#[typeshare]
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct NormalizedEntry {
    /// Unique identifier (UUID v4)
    pub id: String,

    /// Session ID this entry belongs to
    pub session_id: String,

    /// Monotonic sequence number within the session
    ///
    /// Used for ordering events and detecting gaps.
    /// Starts at 0 for each session and increments by 1 for each event.
    pub sequence: i32,

    /// Type of entry with associated data
    pub entry_type: EntryType,

    /// Human-readable content for display
    ///
    /// This is the main text content to display in the UI.
    /// For messages, this is the message text.
    /// For tool use, this is a description of the tool call.
    /// For tool results, this is the output text.
    pub content: String,

    /// When this entry was created (ISO 8601)
    pub timestamp: DateTime<Utc>,

    /// Optional metadata for additional context
    #[serde(skip_serializing_if = "Option::is_none")]
    pub metadata: Option<EntryMetadata>,
}

impl NormalizedEntry {
    /// Create a new normalized entry
    pub fn new(
        id: impl Into<String>,
        session_id: impl Into<String>,
        sequence: i32,
        entry_type: EntryType,
        content: impl Into<String>,
    ) -> Self {
        Self {
            id: id.into(),
            session_id: session_id.into(),
            sequence,
            entry_type,
            content: content.into(),
            timestamp: Utc::now(),
            metadata: None,
        }
    }

    /// Create an entry with a specific timestamp
    pub fn with_timestamp(
        id: impl Into<String>,
        session_id: impl Into<String>,
        sequence: i32,
        entry_type: EntryType,
        content: impl Into<String>,
        timestamp: DateTime<Utc>,
    ) -> Self {
        Self {
            id: id.into(),
            session_id: session_id.into(),
            sequence,
            entry_type,
            content: content.into(),
            timestamp,
            metadata: None,
        }
    }

    /// Add metadata to this entry
    pub fn with_metadata(mut self, metadata: EntryMetadata) -> Self {
        self.metadata = Some(metadata);
        self
    }

    /// Check if this entry has metadata
    pub fn has_metadata(&self) -> bool {
        self.metadata.is_some()
    }

    /// Check if this is a tool-related event (ToolUse or ToolResult)
    pub fn is_tool_event(&self) -> bool {
        self.entry_type.is_tool_use() || self.entry_type.is_tool_result()
    }

    /// Check if this is a terminal event (Complete or Error)
    pub fn is_terminal(&self) -> bool {
        self.entry_type.is_complete() || self.entry_type.is_error()
    }

    /// Get the type name as a string
    pub fn type_name(&self) -> &'static str {
        self.entry_type.type_name()
    }
}

// =============================================================================
// Tests
// =============================================================================

#[cfg(test)]
mod tests {
    use super::*;

    // =========================================================================
    // EntryMetadata Tests
    // =========================================================================

    #[test]
    fn test_entry_metadata_new() {
        let metadata = EntryMetadata::new();
        assert!(metadata.is_empty());
        assert!(metadata.file_path.is_none());
        assert!(metadata.command.is_none());
        assert!(metadata.exit_code.is_none());
        assert!(metadata.parent_tool_id.is_none());
    }

    #[test]
    fn test_entry_metadata_with_file_path() {
        let metadata = EntryMetadata::with_file_path("/src/main.rs");
        assert!(!metadata.is_empty());
        assert_eq!(metadata.file_path, Some("/src/main.rs".to_string()));
    }

    #[test]
    fn test_entry_metadata_with_command() {
        let metadata = EntryMetadata::with_command("cargo build");
        assert!(!metadata.is_empty());
        assert_eq!(metadata.command, Some("cargo build".to_string()));
    }

    #[test]
    fn test_entry_metadata_builder() {
        let metadata = EntryMetadata::new()
            .set_file_path("/src/lib.rs")
            .set_command("cargo test")
            .set_exit_code(0)
            .set_parent_tool_id("tool-123");

        assert!(!metadata.is_empty());
        assert_eq!(metadata.file_path, Some("/src/lib.rs".to_string()));
        assert_eq!(metadata.command, Some("cargo test".to_string()));
        assert_eq!(metadata.exit_code, Some(0));
        assert_eq!(metadata.parent_tool_id, Some("tool-123".to_string()));
    }

    #[test]
    fn test_entry_metadata_serialization() {
        let metadata = EntryMetadata::new()
            .set_file_path("/src/main.rs")
            .set_exit_code(0);

        let json = serde_json::to_string(&metadata).unwrap();
        assert!(json.contains("\"filePath\":\"/src/main.rs\""));
        assert!(json.contains("\"exitCode\":0"));
        // Empty fields should be omitted
        assert!(!json.contains("\"command\""));
        assert!(!json.contains("\"parentToolId\""));

        let deserialized: EntryMetadata = serde_json::from_str(&json).unwrap();
        assert_eq!(metadata, deserialized);
    }

    // =========================================================================
    // EntryType Tests
    // =========================================================================

    #[test]
    fn test_entry_type_init() {
        let entry_type = EntryType::init(
            "session-123",
            "claude-sonnet-4",
            vec!["Read".to_string(), "Write".to_string()],
        );

        assert!(entry_type.is_init());
        assert_eq!(entry_type.type_name(), "init");

        if let EntryType::Init {
            session_id,
            model,
            tools,
        } = entry_type
        {
            assert_eq!(session_id, "session-123");
            assert_eq!(model, "claude-sonnet-4");
            assert_eq!(tools.len(), 2);
        } else {
            panic!("Expected Init variant");
        }
    }

    #[test]
    fn test_entry_type_message() {
        let entry_type = EntryType::message(AgentMessageRole::Assistant);
        assert!(entry_type.is_message());
        assert_eq!(entry_type.type_name(), "message");
    }

    #[test]
    fn test_entry_type_tool_use() {
        let input = serde_json::json!({"filePath": "/src/main.rs"});
        let entry_type = EntryType::tool_use("tool-123", "Read", input.clone());

        assert!(entry_type.is_tool_use());
        assert_eq!(entry_type.type_name(), "tool_use");

        if let EntryType::ToolUse {
            tool_id,
            tool_name,
            input: inp,
        } = entry_type
        {
            assert_eq!(tool_id, "tool-123");
            assert_eq!(tool_name, "Read");
            assert_eq!(inp, input);
        } else {
            panic!("Expected ToolUse variant");
        }
    }

    #[test]
    fn test_entry_type_tool_result() {
        let entry_type = EntryType::tool_result(
            "tool-123",
            ToolResultStatus::Success,
            "File contents here",
            Some(150),
        );

        assert!(entry_type.is_tool_result());
        assert_eq!(entry_type.type_name(), "tool_result");

        if let EntryType::ToolResult {
            tool_id,
            status,
            output,
            duration_ms,
        } = entry_type
        {
            assert_eq!(tool_id, "tool-123");
            assert!(status.is_success());
            assert_eq!(output, "File contents here");
            assert_eq!(duration_ms, Some(150));
        } else {
            panic!("Expected ToolResult variant");
        }
    }

    #[test]
    fn test_entry_type_error() {
        let entry_type = EntryType::error("rate_limit", false);
        assert!(entry_type.is_error());
        assert_eq!(entry_type.type_name(), "error");
    }

    #[test]
    fn test_entry_type_system() {
        let entry_type = EntryType::system("pause");
        assert!(entry_type.is_system());
        assert_eq!(entry_type.type_name(), "system");
    }

    #[test]
    fn test_entry_type_complete() {
        let stats = AgentStats::with_tokens(100, 50);
        let entry_type = EntryType::complete(CompletionStatus::Success, Some(stats));

        assert!(entry_type.is_complete());
        assert_eq!(entry_type.type_name(), "complete");
    }

    #[test]
    fn test_entry_type_serialization() {
        let entry_type = EntryType::tool_use(
            "tool-abc",
            "Read",
            serde_json::json!({"path": "/file.rs"}),
        );

        let json = serde_json::to_string(&entry_type).unwrap();
        assert!(json.contains("\"type\":\"toolUse\""));
        assert!(json.contains("\"tool_id\":\"tool-abc\""));
        assert!(json.contains("\"tool_name\":\"Read\""));

        let deserialized: EntryType = serde_json::from_str(&json).unwrap();
        assert_eq!(entry_type, deserialized);
    }

    // =========================================================================
    // NormalizedEntry Tests
    // =========================================================================

    #[test]
    fn test_normalized_entry_new() {
        let entry_type = EntryType::message(AgentMessageRole::Assistant);
        let entry = NormalizedEntry::new(
            "entry-123",
            "session-456",
            42,
            entry_type.clone(),
            "Hello, world!",
        );

        assert_eq!(entry.id, "entry-123");
        assert_eq!(entry.session_id, "session-456");
        assert_eq!(entry.sequence, 42);
        assert_eq!(entry.content, "Hello, world!");
        assert!(!entry.has_metadata());
        assert_eq!(entry.type_name(), "message");
    }

    #[test]
    fn test_normalized_entry_with_metadata() {
        let entry_type = EntryType::tool_use("tool-1", "Read", serde_json::json!({}));
        let metadata = EntryMetadata::with_file_path("/src/main.rs");
        let entry = NormalizedEntry::new("e1", "s1", 0, entry_type, "Reading file")
            .with_metadata(metadata.clone());

        assert!(entry.has_metadata());
        assert_eq!(entry.metadata, Some(metadata));
    }

    #[test]
    fn test_normalized_entry_is_tool_event() {
        let tool_use = EntryType::tool_use("t1", "Read", serde_json::json!({}));
        let entry = NormalizedEntry::new("e1", "s1", 0, tool_use, "content");
        assert!(entry.is_tool_event());

        let tool_result = EntryType::tool_result("t1", ToolResultStatus::Success, "output", None);
        let entry = NormalizedEntry::new("e2", "s1", 1, tool_result, "content");
        assert!(entry.is_tool_event());

        let message = EntryType::message(AgentMessageRole::Assistant);
        let entry = NormalizedEntry::new("e3", "s1", 2, message, "content");
        assert!(!entry.is_tool_event());
    }

    #[test]
    fn test_normalized_entry_is_terminal() {
        let complete = EntryType::complete(CompletionStatus::Success, None);
        let entry = NormalizedEntry::new("e1", "s1", 0, complete, "Done");
        assert!(entry.is_terminal());

        let error = EntryType::error("error_code", false);
        let entry = NormalizedEntry::new("e2", "s1", 1, error, "Error occurred");
        assert!(entry.is_terminal());

        let message = EntryType::message(AgentMessageRole::Assistant);
        let entry = NormalizedEntry::new("e3", "s1", 2, message, "Hello");
        assert!(!entry.is_terminal());
    }

    #[test]
    fn test_normalized_entry_serialization() {
        let entry_type = EntryType::tool_use(
            "tool-123",
            "Read",
            serde_json::json!({"path": "/file.rs"}),
        );
        let metadata = EntryMetadata::with_file_path("/file.rs");
        let entry = NormalizedEntry::new("e1", "s1", 5, entry_type, "Reading file")
            .with_metadata(metadata);

        let json = serde_json::to_string(&entry).unwrap();
        assert!(json.contains("\"id\":\"e1\""));
        assert!(json.contains("\"sessionId\":\"s1\""));
        assert!(json.contains("\"sequence\":5"));
        assert!(json.contains("\"entryType\":{"));
        assert!(json.contains("\"type\":\"toolUse\""));
        assert!(json.contains("\"content\":\"Reading file\""));
        assert!(json.contains("\"timestamp\":"));
        assert!(json.contains("\"metadata\":{"));
        assert!(json.contains("\"filePath\":\"/file.rs\""));

        let deserialized: NormalizedEntry = serde_json::from_str(&json).unwrap();
        assert_eq!(entry.id, deserialized.id);
        assert_eq!(entry.session_id, deserialized.session_id);
        assert_eq!(entry.sequence, deserialized.sequence);
        assert_eq!(entry.content, deserialized.content);
    }

    #[test]
    fn test_normalized_entry_serialization_no_metadata() {
        let entry_type = EntryType::message(AgentMessageRole::User);
        let entry = NormalizedEntry::new("e1", "s1", 0, entry_type, "Hello");

        let json = serde_json::to_string(&entry).unwrap();
        // metadata field should be omitted when None
        assert!(!json.contains("\"metadata\":null"));
        assert!(!json.contains("\"metadata\""));

        let deserialized: NormalizedEntry = serde_json::from_str(&json).unwrap();
        assert!(deserialized.metadata.is_none());
    }

    #[test]
    fn test_normalized_entry_roundtrip_all_types() {
        let entries = vec![
            NormalizedEntry::new(
                "e1",
                "s1",
                0,
                EntryType::init("ext-s1", "model", vec!["Tool1".to_string()]),
                "Session started",
            ),
            NormalizedEntry::new(
                "e2",
                "s1",
                1,
                EntryType::message(AgentMessageRole::Assistant),
                "Message content",
            ),
            NormalizedEntry::new(
                "e3",
                "s1",
                2,
                EntryType::tool_use("t1", "Read", serde_json::json!({})),
                "Using tool",
            ),
            NormalizedEntry::new(
                "e4",
                "s1",
                3,
                EntryType::tool_result("t1", ToolResultStatus::Success, "output", Some(100)),
                "Tool completed",
            ),
            NormalizedEntry::new(
                "e5",
                "s1",
                4,
                EntryType::error("code", true),
                "Error occurred",
            ),
            NormalizedEntry::new("e6", "s1", 5, EntryType::system("pause"), "Paused"),
            NormalizedEntry::new(
                "e7",
                "s1",
                6,
                EntryType::complete(CompletionStatus::Success, None),
                "Completed",
            ),
        ];

        for entry in entries {
            let json = serde_json::to_string(&entry).unwrap();
            let deserialized: NormalizedEntry = serde_json::from_str(&json).unwrap();
            assert_eq!(entry.id, deserialized.id);
            assert_eq!(entry.session_id, deserialized.session_id);
            assert_eq!(entry.sequence, deserialized.sequence);
            assert_eq!(entry.content, deserialized.content);
        }
    }
}

