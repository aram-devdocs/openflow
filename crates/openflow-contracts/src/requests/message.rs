//! Message Request Types
//!
//! Request types for message CRUD operations. These define the shape of
//! data sent from frontend to backend for message mutations.

use serde::{Deserialize, Serialize};
use typeshare::typeshare;

use crate::entities::message::MessageRole;
use crate::validation::{
    validate_required_string, validate_string_length, Validate, ValidationCollector,
    ValidationResult,
};

// =============================================================================
// Create Message Request
// =============================================================================

/// Request to create a new message in a chat
///
/// Creates a new message with the specified role and content.
/// Tool calls and results are optional and typically used for
/// assistant messages that invoke or respond to tool usage.
///
/// # Endpoint
/// @endpoint: POST /api/messages
/// @command: create_message
///
/// # Example (User message)
/// ```json
/// {
///   "chatId": "660e8400-e29b-41d4-a716-446655440001",
///   "role": "user",
///   "content": "Please help me implement a new feature."
/// }
/// ```
///
/// # Example (Assistant message with tool calls)
/// ```json
/// {
///   "chatId": "660e8400-e29b-41d4-a716-446655440001",
///   "role": "assistant",
///   "content": "I'll help you with that. Let me first read the existing code.",
///   "toolCalls": "[{\"name\":\"read_file\",\"arguments\":{\"path\":\"src/main.rs\"}}]",
///   "model": "claude-3-opus"
/// }
/// ```
#[typeshare]
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct CreateMessageRequest {
    /// Parent chat ID (required)
    /// @validate: required, format=uuid
    pub chat_id: String,

    /// Role of the message author (required)
    pub role: MessageRole,

    /// Message content (required, can be empty for streaming start)
    /// @validate: max_length=1000000
    pub content: String,

    /// JSON array of tool call objects (for assistant messages)
    /// @validate: max_length=1000000
    pub tool_calls: Option<String>,

    /// JSON array of tool result objects (for tool responses)
    /// @validate: max_length=1000000
    pub tool_results: Option<String>,

    /// Model identifier used for this message
    /// @validate: max_length=100
    pub model: Option<String>,

    /// Whether the message starts in streaming mode
    /// Defaults to false if not specified
    pub is_streaming: Option<bool>,
}

impl Default for CreateMessageRequest {
    fn default() -> Self {
        Self {
            chat_id: String::new(),
            role: MessageRole::User,
            content: String::new(),
            tool_calls: None,
            tool_results: None,
            model: None,
            is_streaming: None,
        }
    }
}

impl CreateMessageRequest {
    /// Create a new user message request
    pub fn user(chat_id: impl Into<String>, content: impl Into<String>) -> Self {
        Self {
            chat_id: chat_id.into(),
            role: MessageRole::User,
            content: content.into(),
            ..Default::default()
        }
    }

    /// Create a new assistant message request
    pub fn assistant(chat_id: impl Into<String>, content: impl Into<String>) -> Self {
        Self {
            chat_id: chat_id.into(),
            role: MessageRole::Assistant,
            content: content.into(),
            ..Default::default()
        }
    }

    /// Create a new system message request
    pub fn system(chat_id: impl Into<String>, content: impl Into<String>) -> Self {
        Self {
            chat_id: chat_id.into(),
            role: MessageRole::System,
            content: content.into(),
            ..Default::default()
        }
    }

    /// Create a streaming assistant message request
    pub fn streaming_assistant(chat_id: impl Into<String>) -> Self {
        Self {
            chat_id: chat_id.into(),
            role: MessageRole::Assistant,
            content: String::new(),
            is_streaming: Some(true),
            ..Default::default()
        }
    }

    /// Set tool calls
    pub fn with_tool_calls(mut self, tool_calls: impl Into<String>) -> Self {
        self.tool_calls = Some(tool_calls.into());
        self
    }

    /// Set tool results
    pub fn with_tool_results(mut self, tool_results: impl Into<String>) -> Self {
        self.tool_results = Some(tool_results.into());
        self
    }

    /// Set the model
    pub fn with_model(mut self, model: impl Into<String>) -> Self {
        self.model = Some(model.into());
        self
    }

    /// Mark as streaming
    pub fn as_streaming(mut self) -> Self {
        self.is_streaming = Some(true);
        self
    }

    /// Check if this creates a user message
    pub fn is_user_message(&self) -> bool {
        self.role.is_user()
    }

    /// Check if this creates an assistant message
    pub fn is_assistant_message(&self) -> bool {
        self.role.is_assistant()
    }

    /// Check if this creates a system message
    pub fn is_system_message(&self) -> bool {
        self.role.is_system()
    }
}

impl Validate for CreateMessageRequest {
    fn validate(&self) -> ValidationResult<()> {
        ValidationCollector::new()
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
// Update Message Request
// =============================================================================

/// Request to update an existing message
///
/// All fields are optional - only provided fields will be updated.
/// Commonly used for completing streaming messages or updating content.
///
/// # Endpoint
/// @endpoint: PATCH /api/messages/:id
/// @command: update_message
///
/// # Example (Complete streaming)
/// ```json
/// {
///   "isStreaming": false,
///   "tokensUsed": 1500
/// }
/// ```
///
/// # Example (Append content)
/// ```json
/// {
///   "content": "Updated full message content here..."
/// }
/// ```
#[typeshare]
#[derive(Debug, Clone, Default, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct UpdateMessageRequest {
    /// Updated message content
    /// @validate: max_length=1000000
    pub content: Option<String>,

    /// Updated tool calls
    /// @validate: max_length=1000000
    pub tool_calls: Option<String>,

    /// Updated tool results
    /// @validate: max_length=1000000
    pub tool_results: Option<String>,

    /// Update streaming status
    pub is_streaming: Option<bool>,

    /// Update token count
    pub tokens_used: Option<i32>,

    /// Update model identifier
    /// @validate: max_length=100
    pub model: Option<String>,
}

impl UpdateMessageRequest {
    /// Check if any field is set for update
    pub fn has_updates(&self) -> bool {
        self.content.is_some()
            || self.tool_calls.is_some()
            || self.tool_results.is_some()
            || self.is_streaming.is_some()
            || self.tokens_used.is_some()
            || self.model.is_some()
    }

    /// Create a request to update only the content
    pub fn with_content(content: impl Into<String>) -> Self {
        Self {
            content: Some(content.into()),
            ..Default::default()
        }
    }

    /// Create a request to mark streaming as complete
    pub fn complete_streaming() -> Self {
        Self {
            is_streaming: Some(false),
            ..Default::default()
        }
    }

    /// Create a request to complete streaming with token count
    pub fn complete_with_tokens(tokens: i32) -> Self {
        Self {
            is_streaming: Some(false),
            tokens_used: Some(tokens),
            ..Default::default()
        }
    }

    /// Create a request to update tool calls
    pub fn with_tool_calls(tool_calls: impl Into<String>) -> Self {
        Self {
            tool_calls: Some(tool_calls.into()),
            ..Default::default()
        }
    }

    /// Create a request to update tool results
    pub fn with_tool_results(tool_results: impl Into<String>) -> Self {
        Self {
            tool_results: Some(tool_results.into()),
            ..Default::default()
        }
    }

    /// Create a request to update the model
    pub fn with_model(model: impl Into<String>) -> Self {
        Self {
            model: Some(model.into()),
            ..Default::default()
        }
    }
}

impl Validate for UpdateMessageRequest {
    fn validate(&self) -> ValidationResult<()> {
        ValidationCollector::new()
            .validate(|| {
                if let Some(ref content) = self.content {
                    validate_string_length("content", content, None, Some(1000000))
                } else {
                    Ok(())
                }
            })
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
// Append Message Content Request
// =============================================================================

/// Request to append content to a streaming message
///
/// Used during streaming to incrementally add content to an existing message.
///
/// # Endpoint
/// @endpoint: POST /api/messages/:id/append
/// @command: append_message_content
///
/// # Example
/// ```json
/// {
///   "content": " additional text to append..."
/// }
/// ```
#[typeshare]
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct AppendMessageContentRequest {
    /// Content to append to the message
    /// @validate: max_length=100000
    pub content: String,
}

impl AppendMessageContentRequest {
    /// Create a new append request
    pub fn new(content: impl Into<String>) -> Self {
        Self {
            content: content.into(),
        }
    }
}

impl Validate for AppendMessageContentRequest {
    fn validate(&self) -> ValidationResult<()> {
        ValidationCollector::new()
            .validate(|| validate_string_length("content", &self.content, None, Some(100000)))
            .finish()
    }
}

// =============================================================================
// Set Message Streaming Request
// =============================================================================

/// Request to set a message's streaming status
///
/// Used to mark a message as streaming or complete.
///
/// # Endpoint
/// @endpoint: PATCH /api/messages/:id/streaming
/// @command: set_message_streaming
///
/// # Example
/// ```json
/// {
///   "isStreaming": false
/// }
/// ```
#[typeshare]
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct SetMessageStreamingRequest {
    /// Whether the message is streaming
    pub is_streaming: bool,
}

impl SetMessageStreamingRequest {
    /// Create a request to mark as streaming
    pub fn streaming() -> Self {
        Self { is_streaming: true }
    }

    /// Create a request to mark as complete
    pub fn complete() -> Self {
        Self {
            is_streaming: false,
        }
    }
}

impl Validate for SetMessageStreamingRequest {
    fn validate(&self) -> ValidationResult<()> {
        Ok(())
    }
}

// =============================================================================
// Tests
// =============================================================================

#[cfg(test)]
mod tests {
    use super::*;

    // =========================================================================
    // CreateMessageRequest Tests
    // =========================================================================

    #[test]
    fn test_create_message_request_user() {
        let request = CreateMessageRequest::user(
            "660e8400-e29b-41d4-a716-446655440001",
            "Hello, please help me.",
        );

        assert!(request.validate().is_ok());
        assert!(request.is_user_message());
        assert!(!request.is_assistant_message());
        assert!(!request.is_system_message());
        assert_eq!(request.content, "Hello, please help me.");
    }

    #[test]
    fn test_create_message_request_assistant() {
        let request = CreateMessageRequest::assistant(
            "660e8400-e29b-41d4-a716-446655440001",
            "I'll help you with that.",
        )
        .with_model("claude-3-opus");

        assert!(request.validate().is_ok());
        assert!(!request.is_user_message());
        assert!(request.is_assistant_message());
        assert_eq!(request.model, Some("claude-3-opus".to_string()));
    }

    #[test]
    fn test_create_message_request_system() {
        let request = CreateMessageRequest::system(
            "660e8400-e29b-41d4-a716-446655440001",
            "You are a helpful assistant.",
        );

        assert!(request.validate().is_ok());
        assert!(request.is_system_message());
    }

    #[test]
    fn test_create_message_request_streaming() {
        let request =
            CreateMessageRequest::streaming_assistant("660e8400-e29b-41d4-a716-446655440001");

        assert!(request.validate().is_ok());
        assert!(request.is_assistant_message());
        assert_eq!(request.is_streaming, Some(true));
        assert!(request.content.is_empty());
    }

    #[test]
    fn test_create_message_request_with_tool_calls() {
        let request = CreateMessageRequest::assistant(
            "660e8400-e29b-41d4-a716-446655440001",
            "Let me read that file.",
        )
        .with_tool_calls(r#"[{"name":"read_file"}]"#);

        assert!(request.validate().is_ok());
        assert!(request.tool_calls.is_some());
    }

    #[test]
    fn test_create_message_request_with_tool_results() {
        let request = CreateMessageRequest::assistant(
            "660e8400-e29b-41d4-a716-446655440001",
            "Here's the result.",
        )
        .with_tool_results(r#"[{"result":"..."}]"#);

        assert!(request.validate().is_ok());
        assert!(request.tool_results.is_some());
    }

    #[test]
    fn test_create_message_request_empty_chat_id() {
        let request = CreateMessageRequest {
            chat_id: String::new(),
            role: MessageRole::User,
            content: "Hello".to_string(),
            ..Default::default()
        };

        assert!(request.validate().is_err());
    }

    #[test]
    fn test_create_message_request_content_too_long() {
        let request = CreateMessageRequest::user(
            "660e8400-e29b-41d4-a716-446655440001",
            "a".repeat(1000001),
        );

        assert!(request.validate().is_err());
    }

    #[test]
    fn test_create_message_request_model_too_long() {
        let request = CreateMessageRequest::assistant(
            "660e8400-e29b-41d4-a716-446655440001",
            "Hello",
        )
        .with_model("a".repeat(101));

        assert!(request.validate().is_err());
    }

    #[test]
    fn test_create_message_request_serialization() {
        let request = CreateMessageRequest {
            chat_id: "660e8400-e29b-41d4-a716-446655440001".to_string(),
            role: MessageRole::Assistant,
            content: "Hello".to_string(),
            tool_calls: Some(r#"[]"#.to_string()),
            tool_results: None,
            model: Some("claude-3-opus".to_string()),
            is_streaming: Some(false),
        };

        let json = serde_json::to_string(&request).unwrap();
        assert!(json.contains("\"chatId\":\"660e8400-e29b-41d4-a716-446655440001\""));
        assert!(json.contains("\"role\":\"assistant\""));
        assert!(json.contains("\"content\":\"Hello\""));
        assert!(json.contains("\"toolCalls\":\"[]\""));
        assert!(json.contains("\"model\":\"claude-3-opus\""));
        assert!(json.contains("\"isStreaming\":false"));

        // Round-trip
        let deserialized: CreateMessageRequest = serde_json::from_str(&json).unwrap();
        assert_eq!(request, deserialized);
    }

    // =========================================================================
    // UpdateMessageRequest Tests
    // =========================================================================

    #[test]
    fn test_update_message_request_empty() {
        let request = UpdateMessageRequest::default();

        assert!(request.validate().is_ok());
        assert!(!request.has_updates());
    }

    #[test]
    fn test_update_message_request_with_content() {
        let request = UpdateMessageRequest::with_content("Updated content");

        assert!(request.validate().is_ok());
        assert!(request.has_updates());
        assert_eq!(request.content, Some("Updated content".to_string()));
    }

    #[test]
    fn test_update_message_request_complete_streaming() {
        let request = UpdateMessageRequest::complete_streaming();

        assert!(request.validate().is_ok());
        assert!(request.has_updates());
        assert_eq!(request.is_streaming, Some(false));
    }

    #[test]
    fn test_update_message_request_complete_with_tokens() {
        let request = UpdateMessageRequest::complete_with_tokens(1500);

        assert!(request.validate().is_ok());
        assert!(request.has_updates());
        assert_eq!(request.is_streaming, Some(false));
        assert_eq!(request.tokens_used, Some(1500));
    }

    #[test]
    fn test_update_message_request_with_tool_calls() {
        let request = UpdateMessageRequest::with_tool_calls(r#"[{"name":"read_file"}]"#);

        assert!(request.validate().is_ok());
        assert!(request.has_updates());
        assert!(request.tool_calls.is_some());
    }

    #[test]
    fn test_update_message_request_with_model() {
        let request = UpdateMessageRequest::with_model("claude-3-sonnet");

        assert!(request.validate().is_ok());
        assert!(request.has_updates());
        assert_eq!(request.model, Some("claude-3-sonnet".to_string()));
    }

    #[test]
    fn test_update_message_request_content_too_long() {
        let request = UpdateMessageRequest::with_content("a".repeat(1000001));
        assert!(request.validate().is_err());
    }

    #[test]
    fn test_update_message_request_has_updates() {
        assert!(UpdateMessageRequest {
            content: Some("test".to_string()),
            ..Default::default()
        }
        .has_updates());

        assert!(UpdateMessageRequest {
            tool_calls: Some("[]".to_string()),
            ..Default::default()
        }
        .has_updates());

        assert!(UpdateMessageRequest {
            tool_results: Some("[]".to_string()),
            ..Default::default()
        }
        .has_updates());

        assert!(UpdateMessageRequest {
            is_streaming: Some(false),
            ..Default::default()
        }
        .has_updates());

        assert!(UpdateMessageRequest {
            tokens_used: Some(100),
            ..Default::default()
        }
        .has_updates());

        assert!(UpdateMessageRequest {
            model: Some("claude".to_string()),
            ..Default::default()
        }
        .has_updates());
    }

    #[test]
    fn test_update_message_request_serialization() {
        let request = UpdateMessageRequest {
            content: Some("Updated".to_string()),
            is_streaming: Some(false),
            tokens_used: Some(100),
            ..Default::default()
        };

        let json = serde_json::to_string(&request).unwrap();
        assert!(json.contains("\"content\":\"Updated\""));
        assert!(json.contains("\"isStreaming\":false"));
        assert!(json.contains("\"tokensUsed\":100"));

        // Round-trip
        let deserialized: UpdateMessageRequest = serde_json::from_str(&json).unwrap();
        assert_eq!(request, deserialized);
    }

    // =========================================================================
    // AppendMessageContentRequest Tests
    // =========================================================================

    #[test]
    fn test_append_message_content_request() {
        let request = AppendMessageContentRequest::new(" more content");

        assert!(request.validate().is_ok());
        assert_eq!(request.content, " more content");
    }

    #[test]
    fn test_append_message_content_request_too_long() {
        let request = AppendMessageContentRequest::new("a".repeat(100001));
        assert!(request.validate().is_err());
    }

    #[test]
    fn test_append_message_content_request_serialization() {
        let request = AppendMessageContentRequest::new(" more");
        let json = serde_json::to_string(&request).unwrap();

        assert!(json.contains("\"content\":\" more\""));

        let deserialized: AppendMessageContentRequest = serde_json::from_str(&json).unwrap();
        assert_eq!(request, deserialized);
    }

    // =========================================================================
    // SetMessageStreamingRequest Tests
    // =========================================================================

    #[test]
    fn test_set_message_streaming_request_streaming() {
        let request = SetMessageStreamingRequest::streaming();

        assert!(request.validate().is_ok());
        assert!(request.is_streaming);
    }

    #[test]
    fn test_set_message_streaming_request_complete() {
        let request = SetMessageStreamingRequest::complete();

        assert!(request.validate().is_ok());
        assert!(!request.is_streaming);
    }

    #[test]
    fn test_set_message_streaming_request_serialization() {
        let request = SetMessageStreamingRequest::complete();
        let json = serde_json::to_string(&request).unwrap();

        assert!(json.contains("\"isStreaming\":false"));

        let deserialized: SetMessageStreamingRequest = serde_json::from_str(&json).unwrap();
        assert_eq!(request, deserialized);
    }
}
