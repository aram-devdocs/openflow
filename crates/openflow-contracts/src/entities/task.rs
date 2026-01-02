//! Task Entity
//!
//! Tasks represent units of work within a project. Each task follows a workflow
//! and contains one or more chats (workflow steps). Tasks can have sub-tasks
//! through the parent_task_id relationship.

use serde::{Deserialize, Serialize};
use typeshare::typeshare;

use super::chat::Chat;
use crate::validation::{
    validate_required_string, validate_string_length, Validate, ValidationCollector,
    ValidationResult,
};

// =============================================================================
// Task Status Enum
// =============================================================================

/// Status of a task in the workflow
///
/// Tasks progress through these statuses as work is completed.
/// The frontend uses these to display appropriate UI and actions.
///
/// # Serialization
/// Serialized as lowercase strings: "todo", "inprogress", "inreview", "done", "cancelled"
#[typeshare]
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, Hash, sqlx::Type)]
#[serde(rename_all = "lowercase")]
#[sqlx(rename_all = "lowercase")]
pub enum TaskStatus {
    /// Task has not been started
    Todo,
    /// Task is currently being worked on
    Inprogress,
    /// Task is awaiting review
    Inreview,
    /// Task has been completed
    Done,
    /// Task has been cancelled
    Cancelled,
}

impl Default for TaskStatus {
    fn default() -> Self {
        Self::Todo
    }
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
            "inprogress" | "in_progress" | "in-progress" => Ok(TaskStatus::Inprogress),
            "inreview" | "in_review" | "in-review" => Ok(TaskStatus::Inreview),
            "done" | "completed" => Ok(TaskStatus::Done),
            "cancelled" | "canceled" => Ok(TaskStatus::Cancelled),
            _ => Err(format!("Invalid task status: {}", s)),
        }
    }
}

impl TryFrom<String> for TaskStatus {
    type Error = String;

    fn try_from(s: String) -> Result<Self, Self::Error> {
        s.parse()
    }
}

impl TaskStatus {
    /// Check if the task is in a terminal state (done or cancelled)
    pub fn is_terminal(&self) -> bool {
        matches!(self, TaskStatus::Done | TaskStatus::Cancelled)
    }

    /// Check if the task is active (not terminal)
    pub fn is_active(&self) -> bool {
        !self.is_terminal()
    }

    /// Get all possible status values
    pub fn all() -> &'static [TaskStatus] {
        &[
            TaskStatus::Todo,
            TaskStatus::Inprogress,
            TaskStatus::Inreview,
            TaskStatus::Done,
            TaskStatus::Cancelled,
        ]
    }
}

// =============================================================================
// Task Entity
// =============================================================================

/// A task within a project
///
/// Tasks are the primary unit of work in OpenFlow. Each task represents
/// a piece of work that follows a workflow template. Tasks contain chats
/// which represent individual steps in the workflow.
///
/// # Database
/// @entity
/// @table: tasks
///
/// # Example
/// ```json
/// {
///   "id": "550e8400-e29b-41d4-a716-446655440000",
///   "projectId": "660e8400-e29b-41d4-a716-446655440001",
///   "title": "Implement user authentication",
///   "description": "Add login and registration functionality",
///   "status": "inprogress",
///   "workflowTemplate": ".openflow/workflows/feature.md",
///   "actionsRequiredCount": 2,
///   "parentTaskId": null,
///   "autoStartNextStep": true,
///   "defaultExecutorProfileId": null,
///   "baseBranch": "main",
///   "archivedAt": null,
///   "createdAt": "2024-01-15T10:30:00Z",
///   "updatedAt": "2024-01-15T14:30:00Z"
/// }
/// ```
#[typeshare]
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, sqlx::FromRow)]
#[serde(rename_all = "camelCase")]
pub struct Task {
    /// Unique identifier (UUID v4)
    /// @validate: format=uuid
    pub id: String,

    /// Parent project ID (required)
    /// @validate: required, format=uuid
    pub project_id: String,

    /// Task title
    /// @validate: required, min_length=1, max_length=500
    pub title: String,

    /// Task description in markdown
    /// @validate: max_length=100000
    pub description: Option<String>,

    /// Current status
    pub status: TaskStatus,

    /// Path to the workflow template file (relative to project root)
    /// @validate: max_length=1000
    pub workflow_template: Option<String>,

    /// Number of pending actions requiring user attention
    pub actions_required_count: i32,

    /// Parent task ID for sub-tasks
    /// @validate: format=uuid
    pub parent_task_id: Option<String>,

    /// Whether to automatically start the next workflow step
    pub auto_start_next_step: bool,

    /// Default executor profile ID to use for this task's chats
    /// @validate: format=uuid
    pub default_executor_profile_id: Option<String>,

    /// Base git branch for this task's worktrees
    /// @validate: max_length=255
    pub base_branch: Option<String>,

    /// Timestamp when the task was archived (soft-delete)
    /// null means the task is active
    pub archived_at: Option<String>,

    /// When the task was created (ISO 8601)
    pub created_at: String,

    /// When the task was last updated (ISO 8601)
    pub updated_at: String,
}

impl Task {
    /// Check if the task is archived
    pub fn is_archived(&self) -> bool {
        self.archived_at.is_some()
    }

    /// Check if the task is in a terminal state
    pub fn is_completed(&self) -> bool {
        self.status.is_terminal()
    }

    /// Check if this is a sub-task
    pub fn is_subtask(&self) -> bool {
        self.parent_task_id.is_some()
    }

    /// Check if the task has a workflow template
    pub fn has_workflow(&self) -> bool {
        self.workflow_template.is_some()
    }

    /// Get the base branch, defaulting to "main" if not set
    pub fn get_base_branch(&self) -> &str {
        self.base_branch.as_deref().unwrap_or("main")
    }
}

// =============================================================================
// Task Summary (for list views)
// =============================================================================

/// A lightweight task summary for list views
///
/// Contains only essential fields for displaying in task lists,
/// reducing data transfer and rendering overhead.
///
/// @derived_from: Task
#[typeshare]
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct TaskSummary {
    /// Unique identifier
    pub id: String,

    /// Parent project ID
    pub project_id: String,

    /// Task title
    pub title: String,

    /// Current status
    pub status: TaskStatus,

    /// Number of pending actions
    pub actions_required_count: i32,

    /// Parent task ID (for sub-tasks)
    pub parent_task_id: Option<String>,

    /// Whether the task is archived
    pub is_archived: bool,

    /// When the task was last updated
    pub updated_at: String,
}

impl From<Task> for TaskSummary {
    fn from(task: Task) -> Self {
        let is_archived = task.is_archived();
        Self {
            id: task.id,
            project_id: task.project_id,
            title: task.title,
            status: task.status,
            actions_required_count: task.actions_required_count,
            parent_task_id: task.parent_task_id,
            is_archived,
            updated_at: task.updated_at,
        }
    }
}

impl From<&Task> for TaskSummary {
    fn from(task: &Task) -> Self {
        Self {
            id: task.id.clone(),
            project_id: task.project_id.clone(),
            title: task.title.clone(),
            status: task.status.clone(),
            actions_required_count: task.actions_required_count,
            parent_task_id: task.parent_task_id.clone(),
            is_archived: task.is_archived(),
            updated_at: task.updated_at.clone(),
        }
    }
}

// =============================================================================
// Task with Chat Count
// =============================================================================

/// Task with computed chat count
///
/// Extends the base Task with the number of associated chats,
/// useful for displaying task cards in the UI.
///
/// Note: Not using #[typeshare] due to flatten not being supported.
/// TypeScript type is manually defined in packages/generated/types-manual.ts
///
/// @derived_from: Task
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct TaskWithChatCount {
    /// The task data
    #[serde(flatten)]
    pub task: Task,

    /// Number of chats for this task
    pub chat_count: i32,
}

impl TaskWithChatCount {
    /// Create a new TaskWithChatCount with zero chats
    pub fn new(task: Task) -> Self {
        Self {
            task,
            chat_count: 0,
        }
    }

    /// Create with a specific chat count
    pub fn with_count(task: Task, chat_count: i32) -> Self {
        Self { task, chat_count }
    }
}

// =============================================================================
// Task with Chats (for get operations)
// =============================================================================

/// Task with its associated chats
///
/// Used for the `get` operation to return a task with all its chats.
/// This is the primary response type when fetching a single task.
///
/// @derived_from: Task
#[typeshare]
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct TaskWithChats {
    /// The task data
    pub task: Task,

    /// All chats associated with this task
    pub chats: Vec<Chat>,
}

impl TaskWithChats {
    /// Create a new TaskWithChats with empty chats
    pub fn new(task: Task) -> Self {
        Self {
            task,
            chats: Vec::new(),
        }
    }

    /// Create with chats
    pub fn with_chats(task: Task, chats: Vec<Chat>) -> Self {
        Self { task, chats }
    }

    /// Get the number of chats
    pub fn chat_count(&self) -> usize {
        self.chats.len()
    }
}

// =============================================================================
// Validation Implementation
// =============================================================================

impl Validate for Task {
    fn validate(&self) -> ValidationResult<()> {
        ValidationCollector::new()
            .validate(|| validate_required_string("id", &self.id))
            .validate(|| validate_required_string("project_id", &self.project_id))
            .validate(|| validate_required_string("title", &self.title))
            .validate(|| validate_string_length("title", &self.title, Some(1), Some(500)))
            .validate(|| {
                if let Some(ref desc) = self.description {
                    validate_string_length("description", desc, None, Some(100000))
                } else {
                    Ok(())
                }
            })
            .validate(|| {
                if let Some(ref template) = self.workflow_template {
                    validate_string_length("workflow_template", template, None, Some(1000))
                } else {
                    Ok(())
                }
            })
            .validate(|| {
                if let Some(ref branch) = self.base_branch {
                    validate_string_length("base_branch", branch, None, Some(255))
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

    fn create_test_task() -> Task {
        Task {
            id: "550e8400-e29b-41d4-a716-446655440000".to_string(),
            project_id: "660e8400-e29b-41d4-a716-446655440001".to_string(),
            title: "Test Task".to_string(),
            description: Some("Test description".to_string()),
            status: TaskStatus::Todo,
            workflow_template: Some(".openflow/workflows/feature.md".to_string()),
            actions_required_count: 0,
            parent_task_id: None,
            auto_start_next_step: true,
            default_executor_profile_id: None,
            base_branch: Some("main".to_string()),
            archived_at: None,
            created_at: "2024-01-15T10:30:00Z".to_string(),
            updated_at: "2024-01-15T10:30:00Z".to_string(),
        }
    }

    // =========================================================================
    // TaskStatus Tests
    // =========================================================================

    #[test]
    fn test_task_status_display() {
        assert_eq!(TaskStatus::Todo.to_string(), "todo");
        assert_eq!(TaskStatus::Inprogress.to_string(), "inprogress");
        assert_eq!(TaskStatus::Inreview.to_string(), "inreview");
        assert_eq!(TaskStatus::Done.to_string(), "done");
        assert_eq!(TaskStatus::Cancelled.to_string(), "cancelled");
    }

    #[test]
    fn test_task_status_from_str() {
        assert_eq!("todo".parse::<TaskStatus>().unwrap(), TaskStatus::Todo);
        assert_eq!(
            "inprogress".parse::<TaskStatus>().unwrap(),
            TaskStatus::Inprogress
        );
        assert_eq!(
            "in_progress".parse::<TaskStatus>().unwrap(),
            TaskStatus::Inprogress
        );
        assert_eq!(
            "inreview".parse::<TaskStatus>().unwrap(),
            TaskStatus::Inreview
        );
        assert_eq!("done".parse::<TaskStatus>().unwrap(), TaskStatus::Done);
        assert_eq!(
            "completed".parse::<TaskStatus>().unwrap(),
            TaskStatus::Done
        );
        assert_eq!(
            "cancelled".parse::<TaskStatus>().unwrap(),
            TaskStatus::Cancelled
        );
        assert_eq!(
            "canceled".parse::<TaskStatus>().unwrap(),
            TaskStatus::Cancelled
        );
        assert!("invalid".parse::<TaskStatus>().is_err());
    }

    #[test]
    fn test_task_status_is_terminal() {
        assert!(!TaskStatus::Todo.is_terminal());
        assert!(!TaskStatus::Inprogress.is_terminal());
        assert!(!TaskStatus::Inreview.is_terminal());
        assert!(TaskStatus::Done.is_terminal());
        assert!(TaskStatus::Cancelled.is_terminal());
    }

    #[test]
    fn test_task_status_is_active() {
        assert!(TaskStatus::Todo.is_active());
        assert!(TaskStatus::Inprogress.is_active());
        assert!(TaskStatus::Inreview.is_active());
        assert!(!TaskStatus::Done.is_active());
        assert!(!TaskStatus::Cancelled.is_active());
    }

    #[test]
    fn test_task_status_all() {
        let all = TaskStatus::all();
        assert_eq!(all.len(), 5);
        assert!(all.contains(&TaskStatus::Todo));
        assert!(all.contains(&TaskStatus::Done));
    }

    #[test]
    fn test_task_status_default() {
        assert_eq!(TaskStatus::default(), TaskStatus::Todo);
    }

    #[test]
    fn test_task_status_serialization() {
        let status = TaskStatus::Inprogress;
        let json = serde_json::to_string(&status).unwrap();
        assert_eq!(json, "\"inprogress\"");

        let deserialized: TaskStatus = serde_json::from_str(&json).unwrap();
        assert_eq!(deserialized, TaskStatus::Inprogress);
    }

    // =========================================================================
    // Task Entity Tests
    // =========================================================================

    #[test]
    fn test_task_is_archived() {
        let mut task = create_test_task();
        assert!(!task.is_archived());

        task.archived_at = Some("2024-01-20T10:30:00Z".to_string());
        assert!(task.is_archived());
    }

    #[test]
    fn test_task_is_completed() {
        let mut task = create_test_task();
        task.status = TaskStatus::Todo;
        assert!(!task.is_completed());

        task.status = TaskStatus::Inprogress;
        assert!(!task.is_completed());

        task.status = TaskStatus::Done;
        assert!(task.is_completed());

        task.status = TaskStatus::Cancelled;
        assert!(task.is_completed());
    }

    #[test]
    fn test_task_is_subtask() {
        let mut task = create_test_task();
        assert!(!task.is_subtask());

        task.parent_task_id = Some("770e8400-e29b-41d4-a716-446655440002".to_string());
        assert!(task.is_subtask());
    }

    #[test]
    fn test_task_has_workflow() {
        let mut task = create_test_task();
        assert!(task.has_workflow());

        task.workflow_template = None;
        assert!(!task.has_workflow());
    }

    #[test]
    fn test_task_get_base_branch() {
        let mut task = create_test_task();
        task.base_branch = Some("develop".to_string());
        assert_eq!(task.get_base_branch(), "develop");

        task.base_branch = None;
        assert_eq!(task.get_base_branch(), "main");
    }

    #[test]
    fn test_task_validation_valid() {
        let task = create_test_task();
        assert!(task.validate().is_ok());
    }

    #[test]
    fn test_task_validation_empty_title() {
        let mut task = create_test_task();
        task.title = "".to_string();
        assert!(task.validate().is_err());
    }

    #[test]
    fn test_task_validation_title_too_long() {
        let mut task = create_test_task();
        task.title = "a".repeat(501);
        assert!(task.validate().is_err());
    }

    #[test]
    fn test_task_validation_empty_project_id() {
        let mut task = create_test_task();
        task.project_id = "".to_string();
        assert!(task.validate().is_err());
    }

    #[test]
    fn test_task_serialization() {
        let task = create_test_task();
        let json = serde_json::to_string(&task).unwrap();

        // Verify camelCase serialization
        assert!(json.contains("\"projectId\""));
        assert!(json.contains("\"workflowTemplate\""));
        assert!(json.contains("\"actionsRequiredCount\""));
        assert!(json.contains("\"parentTaskId\""));
        assert!(json.contains("\"autoStartNextStep\""));
        assert!(json.contains("\"defaultExecutorProfileId\""));
        assert!(json.contains("\"baseBranch\""));
        assert!(json.contains("\"archivedAt\""));
        assert!(json.contains("\"createdAt\""));
        assert!(json.contains("\"updatedAt\""));

        // Verify round-trip
        let deserialized: Task = serde_json::from_str(&json).unwrap();
        assert_eq!(task, deserialized);
    }

    // =========================================================================
    // TaskSummary Tests
    // =========================================================================

    #[test]
    fn test_task_summary_from_task() {
        let task = create_test_task();
        let summary: TaskSummary = task.clone().into();

        assert_eq!(summary.id, task.id);
        assert_eq!(summary.project_id, task.project_id);
        assert_eq!(summary.title, task.title);
        assert_eq!(summary.status, task.status);
        assert_eq!(summary.actions_required_count, task.actions_required_count);
        assert_eq!(summary.parent_task_id, task.parent_task_id);
        assert!(!summary.is_archived);
    }

    #[test]
    fn test_task_summary_from_archived_task() {
        let mut task = create_test_task();
        task.archived_at = Some("2024-01-20T10:30:00Z".to_string());
        let summary: TaskSummary = task.into();

        assert!(summary.is_archived);
    }

    // =========================================================================
    // TaskWithChatCount Tests
    // =========================================================================

    #[test]
    fn test_task_with_chat_count_new() {
        let task = create_test_task();
        let with_count = TaskWithChatCount::new(task.clone());

        assert_eq!(with_count.task.id, task.id);
        assert_eq!(with_count.chat_count, 0);
    }

    #[test]
    fn test_task_with_chat_count_with_count() {
        let task = create_test_task();
        let with_count = TaskWithChatCount::with_count(task.clone(), 5);

        assert_eq!(with_count.task.id, task.id);
        assert_eq!(with_count.chat_count, 5);
    }

    #[test]
    fn test_task_with_chat_count_serialization() {
        let task = create_test_task();
        let with_count = TaskWithChatCount::with_count(task, 3);
        let json = serde_json::to_string(&with_count).unwrap();

        // Verify flattened task fields
        assert!(json.contains("\"id\""));
        assert!(json.contains("\"projectId\""));
        assert!(json.contains("\"title\""));
        // Verify additional field
        assert!(json.contains("\"chatCount\":3"));

        // Round-trip
        let deserialized: TaskWithChatCount = serde_json::from_str(&json).unwrap();
        assert_eq!(with_count, deserialized);
    }
}
