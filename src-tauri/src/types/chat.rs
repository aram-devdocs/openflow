use serde::{Deserialize, Serialize};
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

/// A chat session within a task.
/// Each chat corresponds to a workflow step and has its own git worktree.
#[typeshare]
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Chat {
    pub id: String,
    pub task_id: String,
    pub title: Option<String>,
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
    pub created_at: String,
    pub updated_at: String,
}

/// Chat with its associated messages (for get_chat response).
#[typeshare]
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ChatWithMessages {
    #[serde(flatten)]
    pub chat: Chat,
    pub messages: Vec<Message>,
}

/// Request to create a new chat.
#[typeshare]
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateChatRequest {
    pub task_id: String,
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
