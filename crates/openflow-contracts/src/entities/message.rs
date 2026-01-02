//! Message Entity
//!
//! Messages represent individual entries in a chat conversation.
//! Each message has a role (user, assistant, or system) and content,
//! along with optional metadata for tool usage and token tracking.

use serde::{Deserialize, Serialize};
use typeshare::typeshare;

use crate::validation::{
    validate_required_string, validate_string_length, Validate, ValidationCollector,
    ValidationResult,
};

// =============================================================================
// Message Role Enum
// =============================================================================

/// Role of a message in a chat conversation
///
/// Defines who authored the message in the conversation:
/// - User: Human user input
/// - Assistant: AI assistant response
/// - System: System-generated messages (prompts, context, etc.)
///
/// # Serialization
/// Serialized as lowercase strings: "user", "assistant", "system"
#[typeshare]
#[derive(Debug, Clone, Default, Serialize, Deserialize, PartialEq, Eq, Hash, sqlx::Type)]
#[serde(rename_all = "lowercase")]
#[sqlx(rename_all = "lowercase")]
pub enum MessageRole {
    /// Human user input
    #[default]
    User,
    /// AI assistant response
    Assistant,
    /// System-generated message (prompts, context)
    System,
}


impl std::fmt::Display for MessageRole {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            MessageRole::User => write!(f, "user"),
            MessageRole::Assistant => write!(f, "assistant"),
            MessageRole::System => write!(f, "system"),
        }
    }
}

impl std::str::FromStr for MessageRole {
    type Err = String;

    fn from_str(s: &str) -> Result<Self, Self::Err> {
        match s.to_lowercase().as_str() {
            "user" => Ok(MessageRole::User),
            "assistant" => Ok(MessageRole::Assistant),
            "system" => Ok(MessageRole::System),
            _ => Err(format!("Invalid message role: {}", s)),
        }
    }
}

impl TryFrom<String> for MessageRole {
    type Error = String;

    fn try_from(s: String) -> Result<Self, Self::Error> {
        s.parse()
    }
}

impl MessageRole {
    /// Check if this is a user message
    pub fn is_user(&self) -> bool {
        matches!(self, MessageRole::User)
    }

    /// Check if this is an assistant message
    pub fn is_assistant(&self) -> bool {
        matches!(self, MessageRole::Assistant)
    }

    /// Check if this is a system message
    pub fn is_system(&self) -> bool {
        matches!(self, MessageRole::System)
    }

    /// Get all possible message role values
    pub fn all() -> &'static [MessageRole] {
        &[MessageRole::User, MessageRole::Assistant, MessageRole::System]
    }
}

// =============================================================================
// Message Entity
// =============================================================================

/// A message in a chat conversation
///
/// Messages store the conversation history between the user and AI assistant.
/// They include content, role information, and optional metadata for tool
/// usage and token consumption tracking.
///
/// # Database
/// @entity
/// @table: messages
///
/// # Example
/// ```json
/// {
///   "id": "550e8400-e29b-41d4-a716-446655440000",
///   "chatId": "660e8400-e29b-41d4-a716-446655440001",
///   "role": "assistant",
///   "content": "I'll help you implement that feature...",
///   "toolCalls": "[{\"name\":\"read_file\",\"arguments\":{\"path\":\"src/main.rs\"}}]",
///   "toolResults": "[{\"name\":\"read_file\",\"result\":\"...\"}]",
///   "isStreaming": false,
///   "tokensUsed": 1500,
///   "model": "claude-3-opus",
///   "createdAt": "2024-01-15T10:30:00Z"
/// }
/// ```
#[typeshare]
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, sqlx::FromRow)]
#[serde(rename_all = "camelCase")]
pub struct Message {
    /// Unique identifier (UUID v4)
    /// @validate: format=uuid
    pub id: String,

    /// Parent chat ID (required)
    /// @validate: required, format=uuid
    pub chat_id: String,

    /// Role of the message author
    pub role: MessageRole,

    /// Message content (text, markdown, etc.)
    /// @validate: max_length=1000000
    pub content: String,

    /// JSON array of tool call objects (for assistant messages)
    /// Contains the tools the assistant wants to invoke
    /// @validate: max_length=1000000
    pub tool_calls: Option<String>,

    /// JSON array of tool result objects (for tool response messages)
    /// Contains the results of tool invocations
    /// @validate: max_length=1000000
    pub tool_results: Option<String>,

    /// Whether the message is currently being streamed
    /// True while the assistant is generating, false when complete
    pub is_streaming: bool,

    /// Number of tokens used for this message (input + output)
    pub tokens_used: Option<i32>,

    /// Model identifier used for this message (e.g., "claude-3-opus")
    /// @validate: max_length=100
    pub model: Option<String>,

    /// When the message was created (ISO 8601)
    pub created_at: String,
}

impl Message {
    /// Check if the message has any content
    pub fn has_content(&self) -> bool {
        !self.content.is_empty()
    }

    /// Check if the message has tool calls
    pub fn has_tool_calls(&self) -> bool {
        self.tool_calls.as_ref().is_some_and(|tc| !tc.is_empty())
    }

    /// Check if the message has tool results
    pub fn has_tool_results(&self) -> bool {
        self.tool_results
            .as_ref()
            .is_some_and(|tr| !tr.is_empty())
    }

    /// Check if the message is from a user
    pub fn is_user(&self) -> bool {
        self.role.is_user()
    }

    /// Check if the message is from the assistant
    pub fn is_assistant(&self) -> bool {
        self.role.is_assistant()
    }

    /// Check if the message is a system message
    pub fn is_system(&self) -> bool {
        self.role.is_system()
    }

    /// Check if the message is currently being streamed
    pub fn is_being_streamed(&self) -> bool {
        self.is_streaming
    }

    /// Check if the message is complete (not streaming)
    pub fn is_complete(&self) -> bool {
        !self.is_streaming
    }

    /// Get the token count if available
    pub fn get_tokens(&self) -> Option<i32> {
        self.tokens_used
    }

    /// Get the model used if available
    pub fn get_model(&self) -> Option<&str> {
        self.model.as_deref()
    }

    /// Append content to the message (for streaming)
    pub fn append_content(&mut self, additional: &str) {
        self.content.push_str(additional);
    }

    /// Mark the message as complete (stop streaming)
    pub fn complete_streaming(&mut self) {
        self.is_streaming = false;
    }
}

// =============================================================================
// Message Summary (for list views)
// =============================================================================

/// A lightweight message summary for list views
///
/// Contains only essential fields for displaying in message lists,
/// truncating content for preview purposes.
///
/// @derived_from: Message
#[typeshare]
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct MessageSummary {
    /// Unique identifier
    pub id: String,

    /// Parent chat ID
    pub chat_id: String,

    /// Role of the message author
    pub role: MessageRole,

    /// Truncated content preview (first 200 chars)
    pub content_preview: String,

    /// Whether the message has tool calls
    pub has_tool_calls: bool,

    /// Whether the message is streaming
    pub is_streaming: bool,

    /// When the message was created
    pub created_at: String,
}

impl From<Message> for MessageSummary {
    fn from(message: Message) -> Self {
        let content_preview = if message.content.len() > 200 {
            format!("{}...", &message.content[..200])
        } else {
            message.content.clone()
        };

        let has_tool_calls = message.has_tool_calls();
        let is_streaming = message.is_streaming;

        Self {
            id: message.id,
            chat_id: message.chat_id,
            role: message.role,
            content_preview,
            has_tool_calls,
            is_streaming,
            created_at: message.created_at,
        }
    }
}

impl From<&Message> for MessageSummary {
    fn from(message: &Message) -> Self {
        let content_preview = if message.content.len() > 200 {
            format!("{}...", &message.content[..200])
        } else {
            message.content.clone()
        };

        Self {
            id: message.id.clone(),
            chat_id: message.chat_id.clone(),
            role: message.role.clone(),
            content_preview,
            has_tool_calls: message.has_tool_calls(),
            is_streaming: message.is_streaming,
            created_at: message.created_at.clone(),
        }
    }
}

// =============================================================================
// Validation Implementation
// =============================================================================

impl Validate for Message {
    fn validate(&self) -> ValidationResult<()> {
        ValidationCollector::new()
            .validate(|| validate_required_string("id", &self.id))
            .validate(|| validate_required_string("chat_id", &self.chat_id))
            .validate(|| validate_string_length("content", &self.content, None, Some(1000000)))
            .validate(|| {
                if let Some(ref tool_calls) = self.tool_calls {
                    validate_string_length("tool_calls", tool_calls, None, Some(1000000))
                } else {
                    Ok(())
                }
            })
            .validate(|| {
                if let Some(ref tool_results) = self.tool_results {
                    validate_string_length("tool_results", tool_results, None, Some(1000000))
                } else {
                    Ok(())
                }
            })
            .validate(|| {
                if let Some(ref model) = self.model {
                    validate_string_length("model", model, None, Some(100))
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

    fn create_test_message() -> Message {
        Message {
            id: "550e8400-e29b-41d4-a716-446655440000".to_string(),
            chat_id: "660e8400-e29b-41d4-a716-446655440001".to_string(),
            role: MessageRole::Assistant,
            content: "Hello, I'll help you with that.".to_string(),
            tool_calls: Some(
                r#"[{"name":"read_file","arguments":{"path":"src/main.rs"}}]"#.to_string(),
            ),
            tool_results: None,
            is_streaming: false,
            tokens_used: Some(150),
            model: Some("claude-3-opus".to_string()),
            created_at: "2024-01-15T10:30:00Z".to_string(),
        }
    }

    fn create_user_message() -> Message {
        Message {
            id: "550e8400-e29b-41d4-a716-446655440001".to_string(),
            chat_id: "660e8400-e29b-41d4-a716-446655440001".to_string(),
            role: MessageRole::User,
            content: "Please help me implement a new feature.".to_string(),
            tool_calls: None,
            tool_results: None,
            is_streaming: false,
            tokens_used: Some(20),
            model: None,
            created_at: "2024-01-15T10:29:00Z".to_string(),
        }
    }

    fn create_streaming_message() -> Message {
        Message {
            id: "550e8400-e29b-41d4-a716-446655440002".to_string(),
            chat_id: "660e8400-e29b-41d4-a716-446655440001".to_string(),
            role: MessageRole::Assistant,
            content: "I'm working on".to_string(),
            tool_calls: None,
            tool_results: None,
            is_streaming: true,
            tokens_used: None,
            model: Some("claude-3-sonnet".to_string()),
            created_at: "2024-01-15T10:31:00Z".to_string(),
        }
    }

    // =========================================================================
    // MessageRole Tests
    // =========================================================================

    #[test]
    fn test_message_role_display() {
        assert_eq!(MessageRole::User.to_string(), "user");
        assert_eq!(MessageRole::Assistant.to_string(), "assistant");
        assert_eq!(MessageRole::System.to_string(), "system");
    }

    #[test]
    fn test_message_role_from_str() {
        assert_eq!("user".parse::<MessageRole>().unwrap(), MessageRole::User);
        assert_eq!(
            "assistant".parse::<MessageRole>().unwrap(),
            MessageRole::Assistant
        );
        assert_eq!(
            "system".parse::<MessageRole>().unwrap(),
            MessageRole::System
        );
        assert_eq!("USER".parse::<MessageRole>().unwrap(), MessageRole::User);
        assert_eq!(
            "ASSISTANT".parse::<MessageRole>().unwrap(),
            MessageRole::Assistant
        );
        assert!("invalid".parse::<MessageRole>().is_err());
    }

    #[test]
    fn test_message_role_is_methods() {
        assert!(MessageRole::User.is_user());
        assert!(!MessageRole::User.is_assistant());
        assert!(!MessageRole::User.is_system());

        assert!(!MessageRole::Assistant.is_user());
        assert!(MessageRole::Assistant.is_assistant());
        assert!(!MessageRole::Assistant.is_system());

        assert!(!MessageRole::System.is_user());
        assert!(!MessageRole::System.is_assistant());
        assert!(MessageRole::System.is_system());
    }

    #[test]
    fn test_message_role_all() {
        let all = MessageRole::all();
        assert_eq!(all.len(), 3);
        assert!(all.contains(&MessageRole::User));
        assert!(all.contains(&MessageRole::Assistant));
        assert!(all.contains(&MessageRole::System));
    }

    #[test]
    fn test_message_role_default() {
        assert_eq!(MessageRole::default(), MessageRole::User);
    }

    #[test]
    fn test_message_role_serialization() {
        let role = MessageRole::Assistant;
        let json = serde_json::to_string(&role).unwrap();
        assert_eq!(json, "\"assistant\"");

        let deserialized: MessageRole = serde_json::from_str(&json).unwrap();
        assert_eq!(deserialized, MessageRole::Assistant);
    }

    // =========================================================================
    // Message Entity Tests
    // =========================================================================

    #[test]
    fn test_message_has_content() {
        let message = create_test_message();
        assert!(message.has_content());

        let mut empty = create_test_message();
        empty.content = String::new();
        assert!(!empty.has_content());
    }

    #[test]
    fn test_message_has_tool_calls() {
        let message = create_test_message();
        assert!(message.has_tool_calls());

        let user_message = create_user_message();
        assert!(!user_message.has_tool_calls());

        let mut empty_tool_calls = create_test_message();
        empty_tool_calls.tool_calls = Some(String::new());
        assert!(!empty_tool_calls.has_tool_calls());
    }

    #[test]
    fn test_message_has_tool_results() {
        let mut message = create_test_message();
        assert!(!message.has_tool_results());

        message.tool_results = Some(r#"[{"name":"read_file","result":"..."}]"#.to_string());
        assert!(message.has_tool_results());

        message.tool_results = Some(String::new());
        assert!(!message.has_tool_results());
    }

    #[test]
    fn test_message_role_checks() {
        let assistant_msg = create_test_message();
        assert!(assistant_msg.is_assistant());
        assert!(!assistant_msg.is_user());
        assert!(!assistant_msg.is_system());

        let user_msg = create_user_message();
        assert!(user_msg.is_user());
        assert!(!user_msg.is_assistant());
        assert!(!user_msg.is_system());

        let mut system_msg = create_test_message();
        system_msg.role = MessageRole::System;
        assert!(system_msg.is_system());
        assert!(!system_msg.is_user());
        assert!(!system_msg.is_assistant());
    }

    #[test]
    fn test_message_streaming_status() {
        let complete = create_test_message();
        assert!(!complete.is_being_streamed());
        assert!(complete.is_complete());

        let streaming = create_streaming_message();
        assert!(streaming.is_being_streamed());
        assert!(!streaming.is_complete());
    }

    #[test]
    fn test_message_get_tokens() {
        let message = create_test_message();
        assert_eq!(message.get_tokens(), Some(150));

        let streaming = create_streaming_message();
        assert_eq!(streaming.get_tokens(), None);
    }

    #[test]
    fn test_message_get_model() {
        let message = create_test_message();
        assert_eq!(message.get_model(), Some("claude-3-opus"));

        let user_msg = create_user_message();
        assert_eq!(user_msg.get_model(), None);
    }

    #[test]
    fn test_message_append_content() {
        let mut message = create_streaming_message();
        assert_eq!(message.content, "I'm working on");

        message.append_content(" this task for you.");
        assert_eq!(message.content, "I'm working on this task for you.");
    }

    #[test]
    fn test_message_complete_streaming() {
        let mut message = create_streaming_message();
        assert!(message.is_streaming);

        message.complete_streaming();
        assert!(!message.is_streaming);
    }

    #[test]
    fn test_message_validation_valid() {
        let message = create_test_message();
        assert!(message.validate().is_ok());
    }

    #[test]
    fn test_message_validation_empty_id() {
        let mut message = create_test_message();
        message.id = String::new();
        assert!(message.validate().is_err());
    }

    #[test]
    fn test_message_validation_empty_chat_id() {
        let mut message = create_test_message();
        message.chat_id = String::new();
        assert!(message.validate().is_err());
    }

    #[test]
    fn test_message_validation_content_too_long() {
        let mut message = create_test_message();
        message.content = "a".repeat(1000001);
        assert!(message.validate().is_err());
    }

    #[test]
    fn test_message_validation_tool_calls_too_long() {
        let mut message = create_test_message();
        message.tool_calls = Some("a".repeat(1000001));
        assert!(message.validate().is_err());
    }

    #[test]
    fn test_message_validation_model_too_long() {
        let mut message = create_test_message();
        message.model = Some("a".repeat(101));
        assert!(message.validate().is_err());
    }

    #[test]
    fn test_message_serialization() {
        let message = create_test_message();
        let json = serde_json::to_string(&message).unwrap();

        // Verify camelCase serialization
        assert!(json.contains("\"chatId\""));
        assert!(json.contains("\"toolCalls\""));
        assert!(json.contains("\"toolResults\""));
        assert!(json.contains("\"isStreaming\""));
        assert!(json.contains("\"tokensUsed\""));
        assert!(json.contains("\"createdAt\""));

        // Verify round-trip
        let deserialized: Message = serde_json::from_str(&json).unwrap();
        assert_eq!(message, deserialized);
    }

    // =========================================================================
    // MessageSummary Tests
    // =========================================================================

    #[test]
    fn test_message_summary_from_message() {
        let message = create_test_message();
        let summary: MessageSummary = message.clone().into();

        assert_eq!(summary.id, message.id);
        assert_eq!(summary.chat_id, message.chat_id);
        assert_eq!(summary.role, message.role);
        assert_eq!(summary.content_preview, message.content);
        assert!(summary.has_tool_calls);
        assert!(!summary.is_streaming);
        assert_eq!(summary.created_at, message.created_at);
    }

    #[test]
    fn test_message_summary_truncates_long_content() {
        let mut message = create_test_message();
        message.content = "a".repeat(300);

        let summary: MessageSummary = message.into();

        assert_eq!(summary.content_preview.len(), 203); // 200 + "..."
        assert!(summary.content_preview.ends_with("..."));
    }

    #[test]
    fn test_message_summary_from_streaming() {
        let message = create_streaming_message();
        let summary: MessageSummary = message.into();

        assert!(summary.is_streaming);
        assert!(!summary.has_tool_calls);
    }

    #[test]
    fn test_message_summary_from_reference() {
        let message = create_test_message();
        let summary: MessageSummary = (&message).into();

        assert_eq!(summary.id, message.id);
        assert_eq!(summary.chat_id, message.chat_id);
    }

    #[test]
    fn test_message_summary_serialization() {
        let message = create_test_message();
        let summary: MessageSummary = message.into();
        let json = serde_json::to_string(&summary).unwrap();

        // Verify camelCase serialization
        assert!(json.contains("\"chatId\""));
        assert!(json.contains("\"contentPreview\""));
        assert!(json.contains("\"hasToolCalls\""));
        assert!(json.contains("\"isStreaming\""));
        assert!(json.contains("\"createdAt\""));

        // Round-trip
        let deserialized: MessageSummary = serde_json::from_str(&json).unwrap();
        assert_eq!(summary, deserialized);
    }
}
