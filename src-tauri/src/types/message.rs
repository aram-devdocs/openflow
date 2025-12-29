use serde::{Deserialize, Serialize};
use typeshare::typeshare;

/// Role of a message in a chat conversation.
#[typeshare]
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum MessageRole {
    User,
    Assistant,
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

/// A message in a chat conversation.
/// Messages store the conversation history between the user and AI assistant.
#[typeshare]
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Message {
    pub id: String,
    pub chat_id: String,
    pub role: MessageRole,
    pub content: String,
    /// JSON array of tool call objects
    pub tool_calls: Option<String>,
    /// JSON array of tool result objects
    pub tool_results: Option<String>,
    pub is_streaming: bool,
    pub tokens_used: Option<i32>,
    pub model: Option<String>,
    pub created_at: String,
}

/// Request to create a new message.
#[typeshare]
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateMessageRequest {
    pub chat_id: String,
    pub role: MessageRole,
    pub content: String,
    pub tool_calls: Option<String>,
    pub tool_results: Option<String>,
    pub model: Option<String>,
}
