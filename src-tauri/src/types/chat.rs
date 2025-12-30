use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use typeshare::typeshare;

use super::Message;

/// Role of a chat within a task's workflow.
#[typeshare]
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum ChatRole {
    Main,
    Review,
    Test,
    Terminal,
}

impl std::fmt::Display for ChatRole {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            ChatRole::Main => write!(f, "main"),
            ChatRole::Review => write!(f, "review"),
            ChatRole::Test => write!(f, "test"),
            ChatRole::Terminal => write!(f, "terminal"),
        }
    }
}

impl std::str::FromStr for ChatRole {
    type Err = String;

    fn from_str(s: &str) -> Result<Self, Self::Err> {
        match s.to_lowercase().as_str() {
            "main" => Ok(ChatRole::Main),
            "review" => Ok(ChatRole::Review),
            "test" => Ok(ChatRole::Test),
            "terminal" => Ok(ChatRole::Terminal),
            _ => Err(format!("Invalid chat role: {}", s)),
        }
    }
}

impl TryFrom<String> for ChatRole {
    type Error = String;

    fn try_from(s: String) -> Result<Self, Self::Error> {
        s.parse()
    }
}

/// A chat session within a task or standalone.
/// Each chat may correspond to a workflow step and can have its own git worktree.
/// Standalone chats have no task_id but must have a project_id.
#[typeshare]
#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
#[serde(rename_all = "camelCase")]
pub struct Chat {
    pub id: String,
    pub task_id: Option<String>,
    pub project_id: String,
    pub title: Option<String>,
    #[sqlx(try_from = "String")]
    pub chat_role: ChatRole,
    pub executor_profile_id: Option<String>,
    pub base_branch: String,
    pub branch: Option<String>,
    pub worktree_path: Option<String>,
    pub worktree_deleted: bool,
    pub setup_completed_at: Option<String>,
    pub initial_prompt: Option<String>,
    pub hidden_prompt: Option<String>,
    pub is_plan_container: bool,
    pub main_chat_id: Option<String>,
    pub workflow_step_index: Option<i32>,
    /// Claude Code session ID for resuming conversations
    pub claude_session_id: Option<String>,
    /// Timestamp when this chat was archived (null if not archived)
    pub archived_at: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}

/// Chat with its associated messages (for get_chat response).
#[typeshare]
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ChatWithMessages {
    pub chat: Chat,
    pub messages: Vec<Message>,
}

/// Request to create a new chat.
/// Either task_id or project_id must be provided.
/// If task_id is provided, project_id can be omitted (derived from task).
#[typeshare]
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateChatRequest {
    pub task_id: Option<String>,
    pub project_id: String,
    pub title: Option<String>,
    pub chat_role: Option<ChatRole>,
    pub executor_profile_id: Option<String>,
    pub base_branch: Option<String>,
    pub initial_prompt: Option<String>,
    pub hidden_prompt: Option<String>,
    pub is_plan_container: Option<bool>,
    pub main_chat_id: Option<String>,
    pub workflow_step_index: Option<i32>,
}

/// Request to update an existing chat.
#[typeshare]
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateChatRequest {
    pub title: Option<String>,
    pub executor_profile_id: Option<String>,
    pub branch: Option<String>,
    pub worktree_path: Option<String>,
    pub worktree_deleted: Option<bool>,
    pub setup_completed_at: Option<String>,
    pub initial_prompt: Option<String>,
    pub hidden_prompt: Option<String>,
    /// Claude Code session ID for resuming conversations
    pub claude_session_id: Option<String>,
}
