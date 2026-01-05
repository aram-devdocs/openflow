//! Unified Agent Event Types
//!
//! Provider-agnostic event types for agent orchestration.
//! These types normalize output from different CLI tools (Claude Code, Gemini CLI, Codex CLI)
//! into a common format that the backend can process uniformly.
//!
//! # Architecture
//!
//! The `UnifiedAgentEvent` enum represents all possible events that can occur during
//! an agent session. Each provider (Claude, Gemini, Codex) parses their CLI output
//! and maps it to these unified types.
//!
//! ```text
//! ┌─────────────────────────────────────────────────────────────────────────┐
//! │                    Provider Output Normalization                         │
//! ├─────────────────────────────────────────────────────────────────────────┤
//! │                                                                          │
//! │  Claude Code CLI         Gemini CLI           Codex CLI                 │
//! │  {"type":"assistant"}    {"type":"message"}   {"event":"response"}      │
//! │          │                      │                    │                  │
//! │          └──────────────────────┼────────────────────┘                  │
//! │                                 ▼                                        │
//! │                      UnifiedAgentEvent::Message                         │
//! │                                                                          │
//! └─────────────────────────────────────────────────────────────────────────┘
//! ```

use serde::{Deserialize, Serialize};
use typeshare::typeshare;

// =============================================================================
// Message Role (for unified events)
// =============================================================================

/// Role of a message in the agent conversation
///
/// Maps to the role field in agent output events.
#[typeshare]
#[derive(Debug, Clone, Default, Serialize, Deserialize, PartialEq, Eq, Hash)]
#[serde(rename_all = "snake_case")]
pub enum AgentMessageRole {
    /// Human user input
    #[default]
    User,
    /// AI assistant response
    Assistant,
    /// System-level message
    System,
}

impl std::fmt::Display for AgentMessageRole {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            AgentMessageRole::User => write!(f, "user"),
            AgentMessageRole::Assistant => write!(f, "assistant"),
            AgentMessageRole::System => write!(f, "system"),
        }
    }
}

impl std::str::FromStr for AgentMessageRole {
    type Err = String;

    fn from_str(s: &str) -> Result<Self, Self::Err> {
        match s.to_lowercase().as_str() {
            "user" => Ok(AgentMessageRole::User),
            "assistant" => Ok(AgentMessageRole::Assistant),
            "system" => Ok(AgentMessageRole::System),
            _ => Err(format!("Invalid agent message role: {}", s)),
        }
    }
}

// =============================================================================
// Content Block Types
// =============================================================================

/// A block of content in a message
///
/// Messages can contain multiple content blocks of different types.
/// This allows rich content like text mixed with tool results.
///
/// Note: This uses internally-tagged serde which typeshare doesn't support.
/// The TypeScript type is manually defined in types-manual.ts.
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(tag = "type", rename_all = "snake_case")]
pub enum ContentBlock {
    /// Plain text content
    Text {
        /// The text content
        text: String,
    },
    /// A tool use request from the assistant
    ToolUse {
        /// Unique ID for this tool use (for matching with results)
        id: String,
        /// Name of the tool being called
        name: String,
        /// Input arguments as JSON
        input: serde_json::Value,
    },
    /// A tool result from executing a tool
    ToolResult {
        /// ID of the tool use this is a result for
        tool_use_id: String,
        /// The output from the tool
        content: String,
        /// Whether this result represents an error
        #[serde(default)]
        is_error: bool,
    },
    /// Thinking/reasoning content (for models that expose this)
    Thinking {
        /// The reasoning text
        thinking: String,
    },
}

impl ContentBlock {
    /// Create a text content block
    pub fn text(content: impl Into<String>) -> Self {
        ContentBlock::Text {
            text: content.into(),
        }
    }

    /// Create a tool use content block
    pub fn tool_use(
        id: impl Into<String>,
        name: impl Into<String>,
        input: serde_json::Value,
    ) -> Self {
        ContentBlock::ToolUse {
            id: id.into(),
            name: name.into(),
            input,
        }
    }

    /// Create a tool result content block
    pub fn tool_result(
        tool_use_id: impl Into<String>,
        content: impl Into<String>,
        is_error: bool,
    ) -> Self {
        ContentBlock::ToolResult {
            tool_use_id: tool_use_id.into(),
            content: content.into(),
            is_error,
        }
    }

    /// Create a thinking content block
    pub fn thinking(content: impl Into<String>) -> Self {
        ContentBlock::Thinking {
            thinking: content.into(),
        }
    }

    /// Check if this is a text block
    pub fn is_text(&self) -> bool {
        matches!(self, ContentBlock::Text { .. })
    }

    /// Check if this is a tool use block
    pub fn is_tool_use(&self) -> bool {
        matches!(self, ContentBlock::ToolUse { .. })
    }

    /// Check if this is a tool result block
    pub fn is_tool_result(&self) -> bool {
        matches!(self, ContentBlock::ToolResult { .. })
    }

    /// Check if this is a thinking block
    pub fn is_thinking(&self) -> bool {
        matches!(self, ContentBlock::Thinking { .. })
    }

    /// Get the text content if this is a text block
    pub fn as_text(&self) -> Option<&str> {
        match self {
            ContentBlock::Text { text } => Some(text),
            _ => None,
        }
    }

    /// Get the tool use details if this is a tool use block
    pub fn as_tool_use(&self) -> Option<(&str, &str, &serde_json::Value)> {
        match self {
            ContentBlock::ToolUse { id, name, input } => Some((id, name, input)),
            _ => None,
        }
    }
}

// =============================================================================
// Tool Result Status
// =============================================================================

/// Status of a tool result
#[typeshare]
#[derive(Debug, Clone, Default, Serialize, Deserialize, PartialEq, Eq, Hash)]
#[serde(rename_all = "snake_case")]
pub enum ToolResultStatus {
    /// Tool completed successfully
    #[default]
    Success,
    /// Tool execution failed
    Error,
    /// Tool was cancelled
    Cancelled,
}

impl ToolResultStatus {
    /// Check if this is a success status
    pub fn is_success(&self) -> bool {
        matches!(self, ToolResultStatus::Success)
    }

    /// Check if this is an error status
    pub fn is_error(&self) -> bool {
        matches!(self, ToolResultStatus::Error)
    }

    /// Check if this is a cancelled status
    pub fn is_cancelled(&self) -> bool {
        matches!(self, ToolResultStatus::Cancelled)
    }
}

// =============================================================================
// Completion Status
// =============================================================================

/// Status when an agent session completes
#[typeshare]
#[derive(Debug, Clone, Default, Serialize, Deserialize, PartialEq, Eq, Hash)]
#[serde(rename_all = "snake_case")]
pub enum CompletionStatus {
    /// Agent completed successfully
    #[default]
    Success,
    /// Agent encountered an error
    Error,
    /// Agent was interrupted by user
    Interrupted,
    /// Agent hit a timeout
    Timeout,
    /// Agent was killed
    Killed,
}

impl CompletionStatus {
    /// Check if this represents successful completion
    pub fn is_success(&self) -> bool {
        matches!(self, CompletionStatus::Success)
    }

    /// Check if this represents an error
    pub fn is_error(&self) -> bool {
        matches!(self, CompletionStatus::Error)
    }

    /// Check if the agent was stopped externally
    pub fn was_stopped(&self) -> bool {
        matches!(
            self,
            CompletionStatus::Interrupted | CompletionStatus::Killed
        )
    }
}

// =============================================================================
// Agent Statistics
// =============================================================================

/// Statistics from an agent session
#[typeshare]
#[derive(Debug, Clone, Default, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct AgentStats {
    /// Number of input tokens used
    pub input_tokens: Option<i32>,
    /// Number of output tokens used
    pub output_tokens: Option<i32>,
    /// Total tokens used
    pub total_tokens: Option<i32>,
    /// Number of tool calls made
    pub tool_calls: Option<i32>,
    /// Duration in milliseconds
    pub duration_ms: Option<i32>,
    /// Model used for this session
    pub model: Option<String>,
}

impl AgentStats {
    /// Create empty stats
    pub fn new() -> Self {
        Self::default()
    }

    /// Create stats with token counts
    pub fn with_tokens(input: i32, output: i32) -> Self {
        Self {
            input_tokens: Some(input),
            output_tokens: Some(output),
            total_tokens: Some(input + output),
            ..Default::default()
        }
    }

    /// Check if stats have any token information
    pub fn has_tokens(&self) -> bool {
        self.total_tokens.is_some() || self.input_tokens.is_some() || self.output_tokens.is_some()
    }
}

// =============================================================================
// Permission Request
// =============================================================================

/// A permission request from the agent
///
/// When agents need approval for certain operations, they emit this event.
/// The frontend should display a modal and send back the user's response.
#[typeshare]
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct PermissionRequest {
    /// Name of the tool requesting permission
    pub tool_name: String,
    /// Human-readable description of the action
    pub description: String,
    /// Optional file path if the operation involves a specific file
    pub file_path: Option<String>,
    /// Optional command if this is a shell command
    pub command: Option<String>,
}

impl PermissionRequest {
    /// Create a new permission request
    pub fn new(tool_name: impl Into<String>, description: impl Into<String>) -> Self {
        Self {
            tool_name: tool_name.into(),
            description: description.into(),
            file_path: None,
            command: None,
        }
    }

    /// Add a file path to the permission request
    pub fn with_file_path(mut self, path: impl Into<String>) -> Self {
        self.file_path = Some(path.into());
        self
    }

    /// Add a command to the permission request
    pub fn with_command(mut self, cmd: impl Into<String>) -> Self {
        self.command = Some(cmd.into());
        self
    }
}

// =============================================================================
// Unified Agent Event
// =============================================================================

/// Unified event type for all agent providers
///
/// This enum normalizes the different output formats from Claude Code, Gemini CLI,
/// Codex CLI, and other tools into a common format that the backend processes.
///
/// # Event Types
///
/// - **Init**: Session initialization with model info and available tools
/// - **Message**: A message from user or assistant with content blocks
/// - **ToolUse**: Agent is calling a tool
/// - **ToolResult**: Result from a tool execution
/// - **Complete**: Session completed with status and optional stats
/// - **Error**: An error occurred
/// - **Permission**: Agent needs permission for an operation
///
/// # Serialization
///
/// Events are serialized with a `type` tag using snake_case:
/// ```json
/// {"type": "message", "role": "assistant", "content": [...]}
/// ```
///
/// Note: This uses internally-tagged serde which typeshare doesn't support.
/// The TypeScript type is manually defined in types-manual.ts.
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(tag = "type", rename_all = "snake_case")]
pub enum UnifiedAgentEvent {
    /// Session initialization event
    ///
    /// Emitted when an agent session starts, containing model info
    /// and list of available tools.
    Init {
        /// Session ID (may be external session ID for resume)
        session_id: String,
        /// Model being used (e.g., "claude-sonnet-4-20250514")
        model: String,
        /// List of available tool names
        tools: Vec<String>,
    },

    /// A message in the conversation
    ///
    /// Contains one or more content blocks from the user or assistant.
    Message {
        /// Role of the message author
        role: AgentMessageRole,
        /// Content blocks (text, tool use, tool result, etc.)
        content: Vec<ContentBlock>,
    },

    /// Agent is calling a tool
    ///
    /// Emitted when the agent decides to use a tool. The tool_id
    /// is used to match with the subsequent ToolResult.
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
        /// Status of the tool execution
        status: ToolResultStatus,
        /// Output from the tool
        output: String,
    },

    /// Session completed
    ///
    /// Emitted when the agent session ends, with completion status
    /// and optional statistics.
    Complete {
        /// How the session completed
        status: CompletionStatus,
        /// Optional session statistics
        stats: Option<AgentStats>,
    },

    /// An error occurred
    ///
    /// Emitted when an error happens during the session.
    Error {
        /// Error code (e.g., "rate_limit", "context_exceeded")
        code: String,
        /// Human-readable error message
        message: String,
    },

    /// Permission request from agent
    ///
    /// Emitted when the agent needs user approval for an operation.
    /// The frontend should display a modal and respond.
    Permission {
        /// Name of the tool requesting permission
        tool_name: String,
        /// Human-readable description of the action
        description: String,
        /// Optional file path if the operation involves a specific file
        #[serde(skip_serializing_if = "Option::is_none")]
        file_path: Option<String>,
    },
}

impl UnifiedAgentEvent {
    /// Create an init event
    pub fn init(
        session_id: impl Into<String>,
        model: impl Into<String>,
        tools: Vec<String>,
    ) -> Self {
        UnifiedAgentEvent::Init {
            session_id: session_id.into(),
            model: model.into(),
            tools,
        }
    }

    /// Create a message event
    pub fn message(role: AgentMessageRole, content: Vec<ContentBlock>) -> Self {
        UnifiedAgentEvent::Message { role, content }
    }

    /// Create an assistant message with text content
    pub fn assistant_text(text: impl Into<String>) -> Self {
        UnifiedAgentEvent::Message {
            role: AgentMessageRole::Assistant,
            content: vec![ContentBlock::text(text)],
        }
    }

    /// Create a user message with text content
    pub fn user_text(text: impl Into<String>) -> Self {
        UnifiedAgentEvent::Message {
            role: AgentMessageRole::User,
            content: vec![ContentBlock::text(text)],
        }
    }

    /// Create a tool use event
    pub fn tool_use(
        tool_id: impl Into<String>,
        tool_name: impl Into<String>,
        input: serde_json::Value,
    ) -> Self {
        UnifiedAgentEvent::ToolUse {
            tool_id: tool_id.into(),
            tool_name: tool_name.into(),
            input,
        }
    }

    /// Create a successful tool result event
    pub fn tool_result_success(tool_id: impl Into<String>, output: impl Into<String>) -> Self {
        UnifiedAgentEvent::ToolResult {
            tool_id: tool_id.into(),
            status: ToolResultStatus::Success,
            output: output.into(),
        }
    }

    /// Create an error tool result event
    pub fn tool_result_error(tool_id: impl Into<String>, error: impl Into<String>) -> Self {
        UnifiedAgentEvent::ToolResult {
            tool_id: tool_id.into(),
            status: ToolResultStatus::Error,
            output: error.into(),
        }
    }

    /// Create a successful completion event
    pub fn complete_success(stats: Option<AgentStats>) -> Self {
        UnifiedAgentEvent::Complete {
            status: CompletionStatus::Success,
            stats,
        }
    }

    /// Create an error completion event
    pub fn complete_error(stats: Option<AgentStats>) -> Self {
        UnifiedAgentEvent::Complete {
            status: CompletionStatus::Error,
            stats,
        }
    }

    /// Create an error event
    pub fn error(code: impl Into<String>, message: impl Into<String>) -> Self {
        UnifiedAgentEvent::Error {
            code: code.into(),
            message: message.into(),
        }
    }

    /// Create a permission request event
    pub fn permission(
        tool_name: impl Into<String>,
        description: impl Into<String>,
        file_path: Option<String>,
    ) -> Self {
        UnifiedAgentEvent::Permission {
            tool_name: tool_name.into(),
            description: description.into(),
            file_path,
        }
    }

    /// Check if this is an init event
    pub fn is_init(&self) -> bool {
        matches!(self, UnifiedAgentEvent::Init { .. })
    }

    /// Check if this is a message event
    pub fn is_message(&self) -> bool {
        matches!(self, UnifiedAgentEvent::Message { .. })
    }

    /// Check if this is a tool use event
    pub fn is_tool_use(&self) -> bool {
        matches!(self, UnifiedAgentEvent::ToolUse { .. })
    }

    /// Check if this is a tool result event
    pub fn is_tool_result(&self) -> bool {
        matches!(self, UnifiedAgentEvent::ToolResult { .. })
    }

    /// Check if this is a complete event
    pub fn is_complete(&self) -> bool {
        matches!(self, UnifiedAgentEvent::Complete { .. })
    }

    /// Check if this is an error event
    pub fn is_error(&self) -> bool {
        matches!(self, UnifiedAgentEvent::Error { .. })
    }

    /// Check if this is a permission event
    pub fn is_permission(&self) -> bool {
        matches!(self, UnifiedAgentEvent::Permission { .. })
    }

    /// Get the event type as a string
    pub fn event_type(&self) -> &'static str {
        match self {
            UnifiedAgentEvent::Init { .. } => "init",
            UnifiedAgentEvent::Message { .. } => "message",
            UnifiedAgentEvent::ToolUse { .. } => "tool_use",
            UnifiedAgentEvent::ToolResult { .. } => "tool_result",
            UnifiedAgentEvent::Complete { .. } => "complete",
            UnifiedAgentEvent::Error { .. } => "error",
            UnifiedAgentEvent::Permission { .. } => "permission",
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
    // AgentMessageRole Tests
    // =========================================================================

    #[test]
    fn test_agent_message_role_display() {
        assert_eq!(AgentMessageRole::User.to_string(), "user");
        assert_eq!(AgentMessageRole::Assistant.to_string(), "assistant");
        assert_eq!(AgentMessageRole::System.to_string(), "system");
    }

    #[test]
    fn test_agent_message_role_from_str() {
        assert_eq!(
            "user".parse::<AgentMessageRole>().unwrap(),
            AgentMessageRole::User
        );
        assert_eq!(
            "assistant".parse::<AgentMessageRole>().unwrap(),
            AgentMessageRole::Assistant
        );
        assert_eq!(
            "SYSTEM".parse::<AgentMessageRole>().unwrap(),
            AgentMessageRole::System
        );
        assert!("invalid".parse::<AgentMessageRole>().is_err());
    }

    #[test]
    fn test_agent_message_role_serialization() {
        let role = AgentMessageRole::Assistant;
        let json = serde_json::to_string(&role).unwrap();
        assert_eq!(json, "\"assistant\"");

        let deserialized: AgentMessageRole = serde_json::from_str(&json).unwrap();
        assert_eq!(deserialized, AgentMessageRole::Assistant);
    }

    // =========================================================================
    // ContentBlock Tests
    // =========================================================================

    #[test]
    fn test_content_block_text() {
        let block = ContentBlock::text("Hello, world!");
        assert!(block.is_text());
        assert!(!block.is_tool_use());
        assert_eq!(block.as_text(), Some("Hello, world!"));
    }

    #[test]
    fn test_content_block_tool_use() {
        let input = serde_json::json!({"path": "/src/main.rs"});
        let block = ContentBlock::tool_use("tool-123", "Read", input.clone());

        assert!(block.is_tool_use());
        assert!(!block.is_text());

        let (id, name, inp) = block.as_tool_use().unwrap();
        assert_eq!(id, "tool-123");
        assert_eq!(name, "Read");
        assert_eq!(inp, &input);
    }

    #[test]
    fn test_content_block_tool_result() {
        let block = ContentBlock::tool_result("tool-123", "File contents", false);
        assert!(block.is_tool_result());

        let error_block = ContentBlock::tool_result("tool-456", "Not found", true);
        assert!(error_block.is_tool_result());
    }

    #[test]
    fn test_content_block_thinking() {
        let block = ContentBlock::thinking("Let me analyze this...");
        assert!(block.is_thinking());
    }

    #[test]
    fn test_content_block_serialization() {
        let text = ContentBlock::text("Hello");
        let json = serde_json::to_string(&text).unwrap();
        assert!(json.contains("\"type\":\"text\""));
        assert!(json.contains("\"text\":\"Hello\""));

        let tool_use = ContentBlock::tool_use("id-1", "Bash", serde_json::json!({"cmd": "ls"}));
        let json = serde_json::to_string(&tool_use).unwrap();
        assert!(json.contains("\"type\":\"tool_use\""));
        assert!(json.contains("\"id\":\"id-1\""));
        assert!(json.contains("\"name\":\"Bash\""));
    }

    // =========================================================================
    // ToolResultStatus Tests
    // =========================================================================

    #[test]
    fn test_tool_result_status() {
        assert!(ToolResultStatus::Success.is_success());
        assert!(!ToolResultStatus::Success.is_error());

        assert!(ToolResultStatus::Error.is_error());
        assert!(!ToolResultStatus::Error.is_success());

        assert!(ToolResultStatus::Cancelled.is_cancelled());
    }

    // =========================================================================
    // CompletionStatus Tests
    // =========================================================================

    #[test]
    fn test_completion_status() {
        assert!(CompletionStatus::Success.is_success());
        assert!(!CompletionStatus::Success.was_stopped());

        assert!(CompletionStatus::Error.is_error());
        assert!(!CompletionStatus::Error.was_stopped());

        assert!(CompletionStatus::Interrupted.was_stopped());
        assert!(CompletionStatus::Killed.was_stopped());
    }

    // =========================================================================
    // AgentStats Tests
    // =========================================================================

    #[test]
    fn test_agent_stats() {
        let stats = AgentStats::with_tokens(100, 50);
        assert_eq!(stats.input_tokens, Some(100));
        assert_eq!(stats.output_tokens, Some(50));
        assert_eq!(stats.total_tokens, Some(150));
        assert!(stats.has_tokens());

        let empty_stats = AgentStats::new();
        assert!(!empty_stats.has_tokens());
    }

    #[test]
    fn test_agent_stats_serialization() {
        let stats = AgentStats::with_tokens(100, 50);
        let json = serde_json::to_string(&stats).unwrap();
        assert!(json.contains("\"inputTokens\":100"));
        assert!(json.contains("\"outputTokens\":50"));
        assert!(json.contains("\"totalTokens\":150"));
    }

    // =========================================================================
    // PermissionRequest Tests
    // =========================================================================

    #[test]
    fn test_permission_request() {
        let perm = PermissionRequest::new("Bash", "Execute shell command")
            .with_command("rm -rf /tmp/test")
            .with_file_path("/tmp/test");

        assert_eq!(perm.tool_name, "Bash");
        assert_eq!(perm.description, "Execute shell command");
        assert_eq!(perm.command, Some("rm -rf /tmp/test".to_string()));
        assert_eq!(perm.file_path, Some("/tmp/test".to_string()));
    }

    // =========================================================================
    // UnifiedAgentEvent Tests
    // =========================================================================

    #[test]
    fn test_unified_agent_event_init() {
        let event = UnifiedAgentEvent::init(
            "session-123",
            "claude-sonnet-4-20250514",
            vec!["Read".to_string(), "Write".to_string()],
        );

        assert!(event.is_init());
        assert!(!event.is_message());
        assert_eq!(event.event_type(), "init");

        if let UnifiedAgentEvent::Init {
            session_id,
            model,
            tools,
        } = event
        {
            assert_eq!(session_id, "session-123");
            assert_eq!(model, "claude-sonnet-4-20250514");
            assert_eq!(tools.len(), 2);
        } else {
            panic!("Expected Init variant");
        }
    }

    #[test]
    fn test_unified_agent_event_message() {
        let event = UnifiedAgentEvent::assistant_text("Hello! How can I help you?");

        assert!(event.is_message());
        assert_eq!(event.event_type(), "message");

        if let UnifiedAgentEvent::Message { role, content } = event {
            assert_eq!(role, AgentMessageRole::Assistant);
            assert_eq!(content.len(), 1);
            assert!(content[0].is_text());
        } else {
            panic!("Expected Message variant");
        }
    }

    #[test]
    fn test_unified_agent_event_user_text() {
        let event = UnifiedAgentEvent::user_text("Help me with this code");

        if let UnifiedAgentEvent::Message { role, content } = event {
            assert_eq!(role, AgentMessageRole::User);
            assert_eq!(content[0].as_text(), Some("Help me with this code"));
        } else {
            panic!("Expected Message variant");
        }
    }

    #[test]
    fn test_unified_agent_event_tool_use() {
        let input = serde_json::json!({"file_path": "/src/main.rs"});
        let event = UnifiedAgentEvent::tool_use("tool-abc", "Read", input.clone());

        assert!(event.is_tool_use());
        assert_eq!(event.event_type(), "tool_use");

        if let UnifiedAgentEvent::ToolUse {
            tool_id,
            tool_name,
            input: inp,
        } = event
        {
            assert_eq!(tool_id, "tool-abc");
            assert_eq!(tool_name, "Read");
            assert_eq!(inp, input);
        } else {
            panic!("Expected ToolUse variant");
        }
    }

    #[test]
    fn test_unified_agent_event_tool_result_success() {
        let event = UnifiedAgentEvent::tool_result_success("tool-abc", "File contents here");

        assert!(event.is_tool_result());
        assert_eq!(event.event_type(), "tool_result");

        if let UnifiedAgentEvent::ToolResult {
            tool_id,
            status,
            output,
        } = event
        {
            assert_eq!(tool_id, "tool-abc");
            assert!(status.is_success());
            assert_eq!(output, "File contents here");
        } else {
            panic!("Expected ToolResult variant");
        }
    }

    #[test]
    fn test_unified_agent_event_tool_result_error() {
        let event = UnifiedAgentEvent::tool_result_error("tool-abc", "File not found");

        if let UnifiedAgentEvent::ToolResult { status, output, .. } = event {
            assert!(status.is_error());
            assert_eq!(output, "File not found");
        } else {
            panic!("Expected ToolResult variant");
        }
    }

    #[test]
    fn test_unified_agent_event_complete() {
        let stats = AgentStats::with_tokens(1000, 500);
        let event = UnifiedAgentEvent::complete_success(Some(stats.clone()));

        assert!(event.is_complete());
        assert_eq!(event.event_type(), "complete");

        if let UnifiedAgentEvent::Complete { status, stats: s } = event {
            assert!(status.is_success());
            assert!(s.is_some());
            assert_eq!(s.unwrap().total_tokens, Some(1500));
        } else {
            panic!("Expected Complete variant");
        }
    }

    #[test]
    fn test_unified_agent_event_error() {
        let event = UnifiedAgentEvent::error("rate_limit", "Too many requests");

        assert!(event.is_error());
        assert_eq!(event.event_type(), "error");

        if let UnifiedAgentEvent::Error { code, message } = event {
            assert_eq!(code, "rate_limit");
            assert_eq!(message, "Too many requests");
        } else {
            panic!("Expected Error variant");
        }
    }

    #[test]
    fn test_unified_agent_event_permission() {
        let event = UnifiedAgentEvent::permission(
            "Write",
            "Create new file",
            Some("/src/new_file.rs".to_string()),
        );

        assert!(event.is_permission());
        assert_eq!(event.event_type(), "permission");

        if let UnifiedAgentEvent::Permission {
            tool_name,
            description,
            file_path,
        } = event
        {
            assert_eq!(tool_name, "Write");
            assert_eq!(description, "Create new file");
            assert_eq!(file_path, Some("/src/new_file.rs".to_string()));
        } else {
            panic!("Expected Permission variant");
        }
    }

    #[test]
    fn test_unified_agent_event_serialization_init() {
        let event = UnifiedAgentEvent::init(
            "sess-1",
            "claude-sonnet",
            vec!["Read".to_string(), "Write".to_string()],
        );

        let json = serde_json::to_string(&event).unwrap();
        assert!(json.contains("\"type\":\"init\""));
        assert!(json.contains("\"session_id\":\"sess-1\""));
        assert!(json.contains("\"model\":\"claude-sonnet\""));
        assert!(json.contains("\"tools\":[\"Read\",\"Write\"]"));

        let deserialized: UnifiedAgentEvent = serde_json::from_str(&json).unwrap();
        assert_eq!(event, deserialized);
    }

    #[test]
    fn test_unified_agent_event_serialization_message() {
        let event = UnifiedAgentEvent::message(
            AgentMessageRole::Assistant,
            vec![
                ContentBlock::text("Let me help you with that."),
                ContentBlock::tool_use("tool-1", "Read", serde_json::json!({"path": "/file.rs"})),
            ],
        );

        let json = serde_json::to_string(&event).unwrap();
        assert!(json.contains("\"type\":\"message\""));
        assert!(json.contains("\"role\":\"assistant\""));
        assert!(json.contains("\"content\":["));

        let deserialized: UnifiedAgentEvent = serde_json::from_str(&json).unwrap();
        assert_eq!(event, deserialized);
    }

    #[test]
    fn test_unified_agent_event_serialization_complete() {
        let event = UnifiedAgentEvent::complete_success(Some(AgentStats::with_tokens(100, 50)));

        let json = serde_json::to_string(&event).unwrap();
        assert!(json.contains("\"type\":\"complete\""));
        assert!(json.contains("\"status\":\"success\""));
        assert!(json.contains("\"stats\":{"));

        let deserialized: UnifiedAgentEvent = serde_json::from_str(&json).unwrap();
        assert_eq!(event, deserialized);
    }

    #[test]
    fn test_unified_agent_event_serialization_error() {
        let event = UnifiedAgentEvent::error("context_exceeded", "Context window full");

        let json = serde_json::to_string(&event).unwrap();
        assert!(json.contains("\"type\":\"error\""));
        assert!(json.contains("\"code\":\"context_exceeded\""));
        assert!(json.contains("\"message\":\"Context window full\""));

        let deserialized: UnifiedAgentEvent = serde_json::from_str(&json).unwrap();
        assert_eq!(event, deserialized);
    }

    #[test]
    fn test_unified_agent_event_serialization_permission_no_file() {
        let event = UnifiedAgentEvent::permission("Bash", "Execute command", None);

        let json = serde_json::to_string(&event).unwrap();
        assert!(json.contains("\"type\":\"permission\""));
        assert!(json.contains("\"tool_name\":\"Bash\""));
        // file_path should be omitted when None (due to skip_serializing_if)
        assert!(!json.contains("\"file_path\""));

        let deserialized: UnifiedAgentEvent = serde_json::from_str(&json).unwrap();
        assert_eq!(event, deserialized);
    }

    #[test]
    fn test_unified_agent_event_roundtrip_all_variants() {
        let events = vec![
            UnifiedAgentEvent::init("s1", "model", vec!["Tool1".to_string()]),
            UnifiedAgentEvent::assistant_text("Hello"),
            UnifiedAgentEvent::user_text("Hi"),
            UnifiedAgentEvent::tool_use("t1", "Read", serde_json::json!({})),
            UnifiedAgentEvent::tool_result_success("t1", "output"),
            UnifiedAgentEvent::tool_result_error("t2", "error"),
            UnifiedAgentEvent::complete_success(None),
            UnifiedAgentEvent::complete_error(Some(AgentStats::new())),
            UnifiedAgentEvent::error("code", "msg"),
            UnifiedAgentEvent::permission("Tool", "desc", Some("path".to_string())),
        ];

        for event in events {
            let json = serde_json::to_string(&event).unwrap();
            let deserialized: UnifiedAgentEvent = serde_json::from_str(&json).unwrap();
            assert_eq!(event, deserialized, "Roundtrip failed for {:?}", event);
        }
    }
}
