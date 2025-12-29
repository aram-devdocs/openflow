use serde::{Deserialize, Serialize};
use typeshare::typeshare;

use super::Chat;

/// Status of a task in the workflow.
#[typeshare]
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum TaskStatus {
    Todo,
    Inprogress,
    Inreview,
    Done,
    Cancelled,
}

impl std::fmt::Display for TaskStatus {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            TaskStatus::Todo => write!(f, "todo"),
            TaskStatus::Inprogress => write!(f, "inprogress"),
            TaskStatus::Inreview => write!(f, "inreview"),
            TaskStatus::Done => write!(f, "done"),
            TaskStatus::Cancelled => write!(f, "cancelled"),
        }
    }
}

impl std::str::FromStr for TaskStatus {
    type Err = String;

    fn from_str(s: &str) -> Result<Self, Self::Err> {
        match s.to_lowercase().as_str() {
            "todo" => Ok(TaskStatus::Todo),
            "inprogress" => Ok(TaskStatus::Inprogress),
            "inreview" => Ok(TaskStatus::Inreview),
            "done" => Ok(TaskStatus::Done),
            "cancelled" => Ok(TaskStatus::Cancelled),
            _ => Err(format!("Invalid task status: {}", s)),
        }
    }
}

/// A task represents a unit of work following a workflow.
/// Tasks belong to a project and contain one or more chats (workflow steps).
#[typeshare]
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Task {
    pub id: String,
    pub project_id: String,
    pub title: String,
    pub description: Option<String>,
    pub status: TaskStatus,
    /// Path to the workflow template file
    pub workflow_template: Option<String>,
    /// Number of pending actions requiring user attention
    pub actions_required_count: i32,
    /// Parent task ID for sub-tasks
    pub parent_task_id: Option<String>,
    /// Whether to automatically start the next workflow step
    pub auto_start_next_step: bool,
    /// Default executor profile to use for this task's chats
    pub default_executor_profile_id: Option<String>,
    /// Base git branch for this task's worktrees
    pub base_branch: Option<String>,
    /// Timestamp when task was archived (null if not archived)
    pub archived_at: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}

/// Task with its associated chats (for get_task response).
#[typeshare]
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TaskWithChats {
    #[serde(flatten)]
    pub task: Task,
    pub chats: Vec<Chat>,
}

/// Request to create a new task.
#[typeshare]
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateTaskRequest {
    pub project_id: String,
    pub title: String,
    pub description: Option<String>,
    /// Path to the workflow template file
    pub workflow_template: Option<String>,
    /// Parent task ID for sub-tasks
    pub parent_task_id: Option<String>,
    /// Base git branch for this task's worktrees
    pub base_branch: Option<String>,
}

/// Request to update an existing task.
/// All fields are optional - only provided fields will be updated.
#[typeshare]
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateTaskRequest {
    pub title: Option<String>,
    pub description: Option<String>,
    pub status: Option<TaskStatus>,
    pub auto_start_next_step: Option<bool>,
    pub default_executor_profile_id: Option<String>,
}
