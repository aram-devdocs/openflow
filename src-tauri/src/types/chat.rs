use serde::{Deserialize, Serialize};
use typeshare::typeshare;

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

// Note: CreateChatRequest and ChatWithMessages will be added in the "Create Rust Chat Types" step
