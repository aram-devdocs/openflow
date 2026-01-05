//! Task and TaskStep Entities
//!
//! Tasks represent units of work within a project. Each task can have multiple
//! steps that are executed sequentially (or in parallel with worktrees).
//! Tasks follow a state machine pattern with autonomous execution support.
//!
//! # Architecture
//!
//! Tasks have been refactored for the new agent orchestration system:
//! - Backend-owned state: All execution state lives in the database
//! - Step-based execution: Tasks contain ordered steps with prompts
//! - Provider-agnostic: Steps specify which agent provider to use
//! - Autonomous execution: Tasks can run without frontend interaction

use serde::{Deserialize, Serialize};
use typeshare::typeshare;

use super::chat::Chat;
use crate::validation::{
    validate_required_string, validate_string_length, Validate, ValidationCollector,
    ValidationResult,
};

// =============================================================================
// Task Status Enum (New - matches migration 011)
// =============================================================================

/// Status of a task in the execution lifecycle
///
/// Tasks progress through these statuses as execution proceeds.
/// Supports pause/resume workflow for user intervention.
///
/// # Database
/// Matches CHECK constraint in tasks table (migration 011):
/// CHECK (status IN ('pending', 'running', 'paused', 'completed', 'failed', 'cancelled'))
///
/// # Serialization
/// Serialized as lowercase strings matching database values.
#[typeshare]
#[derive(Debug, Clone, Default, Serialize, Deserialize, PartialEq, Eq, Hash, sqlx::Type)]
#[serde(rename_all = "lowercase")]
#[sqlx(rename_all = "lowercase")]
pub enum TaskStatus {
    /// Task has not started execution
    #[default]
    Pending,
    /// Task is actively executing steps
    Running,
    /// Task execution paused (awaiting user action or manual resume)
    Paused,
    /// Task completed successfully (all steps finished)
    Completed,
    /// Task failed (a step failed and couldn't recover)
    Failed,
    /// Task was cancelled by user
    Cancelled,
}

impl std::fmt::Display for TaskStatus {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            TaskStatus::Pending => write!(f, "pending"),
            TaskStatus::Running => write!(f, "running"),
            TaskStatus::Paused => write!(f, "paused"),
            TaskStatus::Completed => write!(f, "completed"),
            TaskStatus::Failed => write!(f, "failed"),
            TaskStatus::Cancelled => write!(f, "cancelled"),
        }
    }
}

impl std::str::FromStr for TaskStatus {
    type Err = String;

    fn from_str(s: &str) -> Result<Self, Self::Err> {
        match s.to_lowercase().as_str() {
            "pending" | "todo" => Ok(TaskStatus::Pending),
            "running" | "inprogress" | "in_progress" | "in-progress" => Ok(TaskStatus::Running),
            "paused" | "inreview" | "in_review" | "in-review" => Ok(TaskStatus::Paused),
            "completed" | "done" => Ok(TaskStatus::Completed),
            "failed" => Ok(TaskStatus::Failed),
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
    /// Check if the task is in a terminal state (completed, failed, or cancelled)
    pub fn is_terminal(&self) -> bool {
        matches!(
            self,
            TaskStatus::Completed | TaskStatus::Failed | TaskStatus::Cancelled
        )
    }

    /// Check if the task is active (can still make progress)
    pub fn is_active(&self) -> bool {
        matches!(self, TaskStatus::Pending | TaskStatus::Running | TaskStatus::Paused)
    }

    /// Check if the task is currently executing
    pub fn is_running(&self) -> bool {
        matches!(self, TaskStatus::Running)
    }

    /// Check if the task can be started or resumed
    pub fn can_start(&self) -> bool {
        matches!(self, TaskStatus::Pending | TaskStatus::Paused)
    }

    /// Check if the task can be paused
    pub fn can_pause(&self) -> bool {
        matches!(self, TaskStatus::Running)
    }

    /// Check if the task completed successfully
    pub fn is_success(&self) -> bool {
        matches!(self, TaskStatus::Completed)
    }

    /// Get all possible status values
    pub fn all() -> &'static [TaskStatus] {
        &[
            TaskStatus::Pending,
            TaskStatus::Running,
            TaskStatus::Paused,
            TaskStatus::Completed,
            TaskStatus::Failed,
            TaskStatus::Cancelled,
        ]
    }
}

// =============================================================================
// Step Status Enum (New - matches migration 012)
// =============================================================================

/// Status of a task step in the execution lifecycle
///
/// Steps progress through these statuses as they are executed.
/// Each step is executed by an agent provider.
///
/// # Database
/// Matches CHECK constraint in task_steps table (migration 012):
/// CHECK (status IN ('pending', 'running', 'completed', 'failed', 'skipped'))
///
/// # Serialization
/// Serialized as lowercase strings matching database values.
#[typeshare]
#[derive(Debug, Clone, Default, Serialize, Deserialize, PartialEq, Eq, Hash, sqlx::Type)]
#[serde(rename_all = "lowercase")]
#[sqlx(rename_all = "lowercase")]
pub enum StepStatus {
    /// Step has not started execution
    #[default]
    Pending,
    /// Step is currently being executed by an agent
    Running,
    /// Step completed successfully
    Completed,
    /// Step execution failed
    Failed,
    /// Step was skipped (e.g., due to conditional logic or cancellation)
    Skipped,
}

impl std::fmt::Display for StepStatus {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            StepStatus::Pending => write!(f, "pending"),
            StepStatus::Running => write!(f, "running"),
            StepStatus::Completed => write!(f, "completed"),
            StepStatus::Failed => write!(f, "failed"),
            StepStatus::Skipped => write!(f, "skipped"),
        }
    }
}

impl std::str::FromStr for StepStatus {
    type Err = String;

    fn from_str(s: &str) -> Result<Self, Self::Err> {
        match s.to_lowercase().as_str() {
            "pending" => Ok(StepStatus::Pending),
            "running" => Ok(StepStatus::Running),
            "completed" | "complete" => Ok(StepStatus::Completed),
            "failed" | "error" => Ok(StepStatus::Failed),
            "skipped" | "skip" => Ok(StepStatus::Skipped),
            _ => Err(format!("Invalid step status: {}", s)),
        }
    }
}

impl TryFrom<String> for StepStatus {
    type Error = String;

    fn try_from(s: String) -> Result<Self, Self::Error> {
        s.parse()
    }
}

impl StepStatus {
    /// Check if the step is in a terminal state
    pub fn is_terminal(&self) -> bool {
        matches!(
            self,
            StepStatus::Completed | StepStatus::Failed | StepStatus::Skipped
        )
    }

    /// Check if the step is currently executing
    pub fn is_running(&self) -> bool {
        matches!(self, StepStatus::Running)
    }

    /// Check if the step completed successfully
    pub fn is_success(&self) -> bool {
        matches!(self, StepStatus::Completed)
    }

    /// Check if the step can be started
    pub fn can_start(&self) -> bool {
        matches!(self, StepStatus::Pending)
    }

    /// Get all possible status values
    pub fn all() -> &'static [StepStatus] {
        &[
            StepStatus::Pending,
            StepStatus::Running,
            StepStatus::Completed,
            StepStatus::Failed,
            StepStatus::Skipped,
        ]
    }
}

// =============================================================================
// TaskStep Entity (New - matches migration 012)
// =============================================================================

/// A step within a task that can be executed by an agent
///
/// Task steps define the execution plan for a task. Each step contains
/// a prompt that will be sent to an agent provider. Steps are executed
/// sequentially by default, or in parallel when using git worktrees.
///
/// # Database
/// @entity
/// @table: task_steps
///
/// # Example
/// ```json
/// {
///   "id": "step-550e8400-e29b-41d4-a716-446655440000",
///   "taskId": "task-660e8400-e29b-41d4-a716-446655440001",
///   "stepIndex": 0,
///   "title": "Implement the feature",
///   "prompt": "Create a new React component for user profiles",
///   "providerId": "claude-code",
///   "status": "pending",
///   "sessionId": null,
///   "startedAt": null,
///   "endedAt": null,
///   "createdAt": "2024-01-15T10:30:00Z",
///   "updatedAt": "2024-01-15T10:30:00Z"
/// }
/// ```
#[typeshare]
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, sqlx::FromRow)]
#[serde(rename_all = "camelCase")]
pub struct TaskStep {
    /// Unique identifier (UUID v4)
    pub id: String,

    /// Parent task ID
    pub task_id: String,

    /// Order of execution (0-based)
    pub step_index: i32,

    /// Human-readable step name
    pub title: String,

    /// The prompt to send to the agent
    pub prompt: String,

    /// Which agent provider to use ("claude-code", "gemini-cli", etc.)
    pub provider_id: String,

    /// Current execution status
    pub status: StepStatus,

    /// Link to the agent session when running or completed
    pub session_id: Option<String>,

    /// When step execution began (ISO 8601)
    pub started_at: Option<String>,

    /// When step execution completed (ISO 8601)
    pub ended_at: Option<String>,

    /// When the step was created (ISO 8601)
    pub created_at: String,

    /// When the step was last updated (ISO 8601)
    pub updated_at: String,
}

impl TaskStep {
    /// Create a new step with required fields
    pub fn new(
        id: impl Into<String>,
        task_id: impl Into<String>,
        step_index: i32,
        title: impl Into<String>,
        prompt: impl Into<String>,
        provider_id: impl Into<String>,
    ) -> Self {
        let now = chrono::Utc::now().to_rfc3339();
        Self {
            id: id.into(),
            task_id: task_id.into(),
            step_index,
            title: title.into(),
            prompt: prompt.into(),
            provider_id: provider_id.into(),
            status: StepStatus::Pending,
            session_id: None,
            started_at: None,
            ended_at: None,
            created_at: now.clone(),
            updated_at: now,
        }
    }

    /// Check if this step has been linked to an agent session
    pub fn has_session(&self) -> bool {
        self.session_id.is_some()
    }

    /// Check if this step is complete (terminal state)
    pub fn is_complete(&self) -> bool {
        self.status.is_terminal()
    }

    /// Check if this step is currently executing
    pub fn is_running(&self) -> bool {
        self.status.is_running()
    }

    /// Get the duration if the step has completed
    pub fn duration_ms(&self) -> Option<i64> {
        match (&self.started_at, &self.ended_at) {
            (Some(start), Some(end)) => {
                let start_dt = chrono::DateTime::parse_from_rfc3339(start).ok()?;
                let end_dt = chrono::DateTime::parse_from_rfc3339(end).ok()?;
                Some((end_dt - start_dt).num_milliseconds())
            }
            _ => None,
        }
    }
}

impl Validate for TaskStep {
    fn validate(&self) -> ValidationResult<()> {
        ValidationCollector::new()
            .validate(|| validate_required_string("id", &self.id))
            .validate(|| validate_required_string("task_id", &self.task_id))
            .validate(|| validate_required_string("title", &self.title))
            .validate(|| validate_string_length("title", &self.title, Some(1), Some(500)))
            .validate(|| validate_required_string("prompt", &self.prompt))
            .validate(|| validate_required_string("provider_id", &self.provider_id))
            .validate(|| validate_string_length("provider_id", &self.provider_id, Some(1), Some(100)))
            .finish()
    }
}

// =============================================================================
// TaskStep Summary (for list views)
// =============================================================================

/// A lightweight task step summary for list views
///
/// Contains only essential fields for displaying step progress.
///
/// @derived_from: TaskStep
#[typeshare]
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct TaskStepSummary {
    /// Unique identifier
    pub id: String,

    /// Order of execution (0-based)
    pub step_index: i32,

    /// Human-readable step name
    pub title: String,

    /// Which agent provider to use
    pub provider_id: String,

    /// Current execution status
    pub status: StepStatus,

    /// Whether linked to an agent session
    pub has_session: bool,
}

impl From<TaskStep> for TaskStepSummary {
    fn from(step: TaskStep) -> Self {
        let has_session = step.has_session();
        Self {
            id: step.id,
            step_index: step.step_index,
            title: step.title,
            provider_id: step.provider_id,
            status: step.status,
            has_session,
        }
    }
}

impl From<&TaskStep> for TaskStepSummary {
    fn from(step: &TaskStep) -> Self {
        Self {
            id: step.id.clone(),
            step_index: step.step_index,
            title: step.title.clone(),
            provider_id: step.provider_id.clone(),
            status: step.status.clone(),
            has_session: step.has_session(),
        }
    }
}

// =============================================================================
// Task Entity (Updated - matches migration 011)
// =============================================================================

/// A task within a project
///
/// Tasks are the primary unit of work in OpenFlow. Each task represents
/// a piece of work that can be executed autonomously by agents. Tasks
/// contain steps (TaskStep) that are executed sequentially.
///
/// # Architecture
///
/// The Task entity has been updated for the new agent orchestration system:
/// - `auto_run`: When true, task executes autonomously without user intervention
/// - `current_step_index`: Tracks which step is currently being executed
/// - `worktree_id`: Links to git worktree for parallel execution
/// - `started_at`/`ended_at`: Track execution timing
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
///   "status": "running",
///   "autoRun": true,
///   "currentStepIndex": 1,
///   "worktreeId": null,
///   "workflowTemplate": ".openflow/workflows/feature.md",
///   "parentTaskId": null,
///   "defaultExecutorProfileId": null,
///   "baseBranch": "main",
///   "archivedAt": null,
///   "startedAt": "2024-01-15T10:30:00Z",
///   "endedAt": null,
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

    /// Current execution status
    pub status: TaskStatus,

    /// Whether to execute autonomously (true) or pause for user input (false)
    pub auto_run: bool,

    /// Index of the current/next step to execute (0-based)
    pub current_step_index: i32,

    /// Link to git worktree for parallel execution (future feature)
    /// @validate: format=uuid
    pub worktree_id: Option<String>,

    /// Path to the workflow template file (relative to project root)
    /// @validate: max_length=1000
    pub workflow_template: Option<String>,

    /// Parent task ID for sub-tasks
    /// @validate: format=uuid
    pub parent_task_id: Option<String>,

    /// Default executor profile ID to use for this task's steps
    /// @validate: format=uuid
    pub default_executor_profile_id: Option<String>,

    /// Base git branch for this task's worktrees
    /// @validate: max_length=255
    pub base_branch: Option<String>,

    /// Timestamp when the task was archived (soft-delete)
    /// null means the task is active
    pub archived_at: Option<String>,

    /// When task execution began (ISO 8601)
    pub started_at: Option<String>,

    /// When task execution completed (ISO 8601)
    pub ended_at: Option<String>,

    /// When the task was created (ISO 8601)
    pub created_at: String,

    /// When the task was last updated (ISO 8601)
    pub updated_at: String,
}

impl Task {
    /// Create a new task with required fields
    pub fn new(
        id: impl Into<String>,
        project_id: impl Into<String>,
        title: impl Into<String>,
    ) -> Self {
        let now = chrono::Utc::now().to_rfc3339();
        Self {
            id: id.into(),
            project_id: project_id.into(),
            title: title.into(),
            description: None,
            status: TaskStatus::Pending,
            auto_run: false,
            current_step_index: 0,
            worktree_id: None,
            workflow_template: None,
            parent_task_id: None,
            default_executor_profile_id: None,
            base_branch: None,
            archived_at: None,
            started_at: None,
            ended_at: None,
            created_at: now.clone(),
            updated_at: now,
        }
    }

    /// Check if the task is archived
    pub fn is_archived(&self) -> bool {
        self.archived_at.is_some()
    }

    /// Check if the task is in a terminal state
    pub fn is_completed(&self) -> bool {
        self.status.is_terminal()
    }

    /// Check if the task is currently running
    pub fn is_running(&self) -> bool {
        self.status.is_running()
    }

    /// Check if the task can be started
    pub fn can_start(&self) -> bool {
        self.status.can_start()
    }

    /// Check if the task can be paused
    pub fn can_pause(&self) -> bool {
        self.status.can_pause()
    }

    /// Check if this is a sub-task
    pub fn is_subtask(&self) -> bool {
        self.parent_task_id.is_some()
    }

    /// Check if the task has a workflow template
    pub fn has_workflow(&self) -> bool {
        self.workflow_template.is_some()
    }

    /// Check if the task is linked to a worktree
    pub fn has_worktree(&self) -> bool {
        self.worktree_id.is_some()
    }

    /// Get the base branch, defaulting to "main" if not set
    pub fn get_base_branch(&self) -> &str {
        self.base_branch.as_deref().unwrap_or("main")
    }

    /// Get the duration if the task has completed
    pub fn duration_ms(&self) -> Option<i64> {
        match (&self.started_at, &self.ended_at) {
            (Some(start), Some(end)) => {
                let start_dt = chrono::DateTime::parse_from_rfc3339(start).ok()?;
                let end_dt = chrono::DateTime::parse_from_rfc3339(end).ok()?;
                Some((end_dt - start_dt).num_milliseconds())
            }
            _ => None,
        }
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

    /// Current execution status
    pub status: TaskStatus,

    /// Whether task runs autonomously
    pub auto_run: bool,

    /// Current step being executed (0-based)
    pub current_step_index: i32,

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
            auto_run: task.auto_run,
            current_step_index: task.current_step_index,
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
            auto_run: task.auto_run,
            current_step_index: task.current_step_index,
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
// Task with Steps (for new agent orchestration system)
// =============================================================================

/// Task with its associated steps
///
/// Used for the task execution system to return a task with all its steps.
/// This is the primary response type for the new agent orchestration architecture.
///
/// @derived_from: Task
#[typeshare]
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct TaskWithSteps {
    /// The task data
    pub task: Task,

    /// All steps associated with this task, ordered by step_index
    pub steps: Vec<TaskStep>,
}

impl TaskWithSteps {
    /// Create a new TaskWithSteps with empty steps
    pub fn new(task: Task) -> Self {
        Self {
            task,
            steps: Vec::new(),
        }
    }

    /// Create with steps
    pub fn with_steps(task: Task, steps: Vec<TaskStep>) -> Self {
        Self { task, steps }
    }

    /// Get the number of steps
    pub fn step_count(&self) -> usize {
        self.steps.len()
    }

    /// Get the current step being executed
    pub fn current_step(&self) -> Option<&TaskStep> {
        self.steps
            .get(self.task.current_step_index as usize)
    }

    /// Get all completed steps
    pub fn completed_steps(&self) -> Vec<&TaskStep> {
        self.steps
            .iter()
            .filter(|s| s.status == StepStatus::Completed)
            .collect()
    }

    /// Get the number of completed steps
    pub fn completed_count(&self) -> usize {
        self.steps
            .iter()
            .filter(|s| s.status == StepStatus::Completed)
            .count()
    }

    /// Get progress as a percentage (0-100)
    pub fn progress_percent(&self) -> u8 {
        if self.steps.is_empty() {
            return 0;
        }
        let completed = self.completed_count();
        ((completed as f64 / self.steps.len() as f64) * 100.0) as u8
    }

    /// Check if all steps are complete
    pub fn all_steps_complete(&self) -> bool {
        !self.steps.is_empty() && self.steps.iter().all(|s| s.status.is_terminal())
    }

    /// Check if any step has failed
    pub fn has_failed_step(&self) -> bool {
        self.steps.iter().any(|s| s.status == StepStatus::Failed)
    }

    /// Get the next pending step
    pub fn next_pending_step(&self) -> Option<&TaskStep> {
        self.steps.iter().find(|s| s.status == StepStatus::Pending)
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
            status: TaskStatus::Pending,
            auto_run: false,
            current_step_index: 0,
            worktree_id: None,
            workflow_template: Some(".openflow/workflows/feature.md".to_string()),
            parent_task_id: None,
            default_executor_profile_id: None,
            base_branch: Some("main".to_string()),
            archived_at: None,
            started_at: None,
            ended_at: None,
            created_at: "2024-01-15T10:30:00Z".to_string(),
            updated_at: "2024-01-15T10:30:00Z".to_string(),
        }
    }

    fn create_test_step(task_id: &str, index: i32) -> TaskStep {
        TaskStep {
            id: format!("step-{}", index),
            task_id: task_id.to_string(),
            step_index: index,
            title: format!("Step {}", index),
            prompt: format!("Do step {}", index),
            provider_id: "claude-code".to_string(),
            status: StepStatus::Pending,
            session_id: None,
            started_at: None,
            ended_at: None,
            created_at: "2024-01-15T10:30:00Z".to_string(),
            updated_at: "2024-01-15T10:30:00Z".to_string(),
        }
    }

    // =========================================================================
    // TaskStatus Tests
    // =========================================================================

    #[test]
    fn test_task_status_display() {
        assert_eq!(TaskStatus::Pending.to_string(), "pending");
        assert_eq!(TaskStatus::Running.to_string(), "running");
        assert_eq!(TaskStatus::Paused.to_string(), "paused");
        assert_eq!(TaskStatus::Completed.to_string(), "completed");
        assert_eq!(TaskStatus::Failed.to_string(), "failed");
        assert_eq!(TaskStatus::Cancelled.to_string(), "cancelled");
    }

    #[test]
    fn test_task_status_from_str() {
        // New status values
        assert_eq!("pending".parse::<TaskStatus>().unwrap(), TaskStatus::Pending);
        assert_eq!("running".parse::<TaskStatus>().unwrap(), TaskStatus::Running);
        assert_eq!("paused".parse::<TaskStatus>().unwrap(), TaskStatus::Paused);
        assert_eq!("completed".parse::<TaskStatus>().unwrap(), TaskStatus::Completed);
        assert_eq!("failed".parse::<TaskStatus>().unwrap(), TaskStatus::Failed);
        assert_eq!("cancelled".parse::<TaskStatus>().unwrap(), TaskStatus::Cancelled);
        assert_eq!("canceled".parse::<TaskStatus>().unwrap(), TaskStatus::Cancelled);

        // Legacy status values (for backward compatibility)
        assert_eq!("todo".parse::<TaskStatus>().unwrap(), TaskStatus::Pending);
        assert_eq!("inprogress".parse::<TaskStatus>().unwrap(), TaskStatus::Running);
        assert_eq!("in_progress".parse::<TaskStatus>().unwrap(), TaskStatus::Running);
        assert_eq!("inreview".parse::<TaskStatus>().unwrap(), TaskStatus::Paused);
        assert_eq!("done".parse::<TaskStatus>().unwrap(), TaskStatus::Completed);

        assert!("invalid".parse::<TaskStatus>().is_err());
    }

    #[test]
    fn test_task_status_is_terminal() {
        assert!(!TaskStatus::Pending.is_terminal());
        assert!(!TaskStatus::Running.is_terminal());
        assert!(!TaskStatus::Paused.is_terminal());
        assert!(TaskStatus::Completed.is_terminal());
        assert!(TaskStatus::Failed.is_terminal());
        assert!(TaskStatus::Cancelled.is_terminal());
    }

    #[test]
    fn test_task_status_is_active() {
        assert!(TaskStatus::Pending.is_active());
        assert!(TaskStatus::Running.is_active());
        assert!(TaskStatus::Paused.is_active());
        assert!(!TaskStatus::Completed.is_active());
        assert!(!TaskStatus::Failed.is_active());
        assert!(!TaskStatus::Cancelled.is_active());
    }

    #[test]
    fn test_task_status_can_start() {
        assert!(TaskStatus::Pending.can_start());
        assert!(!TaskStatus::Running.can_start());
        assert!(TaskStatus::Paused.can_start());
        assert!(!TaskStatus::Completed.can_start());
        assert!(!TaskStatus::Failed.can_start());
        assert!(!TaskStatus::Cancelled.can_start());
    }

    #[test]
    fn test_task_status_can_pause() {
        assert!(!TaskStatus::Pending.can_pause());
        assert!(TaskStatus::Running.can_pause());
        assert!(!TaskStatus::Paused.can_pause());
        assert!(!TaskStatus::Completed.can_pause());
    }

    #[test]
    fn test_task_status_all() {
        let all = TaskStatus::all();
        assert_eq!(all.len(), 6);
        assert!(all.contains(&TaskStatus::Pending));
        assert!(all.contains(&TaskStatus::Running));
        assert!(all.contains(&TaskStatus::Paused));
        assert!(all.contains(&TaskStatus::Completed));
        assert!(all.contains(&TaskStatus::Failed));
        assert!(all.contains(&TaskStatus::Cancelled));
    }

    #[test]
    fn test_task_status_default() {
        assert_eq!(TaskStatus::default(), TaskStatus::Pending);
    }

    #[test]
    fn test_task_status_serialization() {
        let status = TaskStatus::Running;
        let json = serde_json::to_string(&status).unwrap();
        assert_eq!(json, "\"running\"");

        let deserialized: TaskStatus = serde_json::from_str(&json).unwrap();
        assert_eq!(deserialized, TaskStatus::Running);
    }

    // =========================================================================
    // StepStatus Tests
    // =========================================================================

    #[test]
    fn test_step_status_display() {
        assert_eq!(StepStatus::Pending.to_string(), "pending");
        assert_eq!(StepStatus::Running.to_string(), "running");
        assert_eq!(StepStatus::Completed.to_string(), "completed");
        assert_eq!(StepStatus::Failed.to_string(), "failed");
        assert_eq!(StepStatus::Skipped.to_string(), "skipped");
    }

    #[test]
    fn test_step_status_from_str() {
        assert_eq!("pending".parse::<StepStatus>().unwrap(), StepStatus::Pending);
        assert_eq!("running".parse::<StepStatus>().unwrap(), StepStatus::Running);
        assert_eq!("completed".parse::<StepStatus>().unwrap(), StepStatus::Completed);
        assert_eq!("complete".parse::<StepStatus>().unwrap(), StepStatus::Completed);
        assert_eq!("failed".parse::<StepStatus>().unwrap(), StepStatus::Failed);
        assert_eq!("error".parse::<StepStatus>().unwrap(), StepStatus::Failed);
        assert_eq!("skipped".parse::<StepStatus>().unwrap(), StepStatus::Skipped);
        assert_eq!("skip".parse::<StepStatus>().unwrap(), StepStatus::Skipped);
        assert!("invalid".parse::<StepStatus>().is_err());
    }

    #[test]
    fn test_step_status_is_terminal() {
        assert!(!StepStatus::Pending.is_terminal());
        assert!(!StepStatus::Running.is_terminal());
        assert!(StepStatus::Completed.is_terminal());
        assert!(StepStatus::Failed.is_terminal());
        assert!(StepStatus::Skipped.is_terminal());
    }

    #[test]
    fn test_step_status_all() {
        let all = StepStatus::all();
        assert_eq!(all.len(), 5);
    }

    #[test]
    fn test_step_status_default() {
        assert_eq!(StepStatus::default(), StepStatus::Pending);
    }

    // =========================================================================
    // TaskStep Entity Tests
    // =========================================================================

    #[test]
    fn test_task_step_new() {
        let step = TaskStep::new("step-1", "task-1", 0, "First Step", "Do something", "claude-code");
        assert_eq!(step.id, "step-1");
        assert_eq!(step.task_id, "task-1");
        assert_eq!(step.step_index, 0);
        assert_eq!(step.title, "First Step");
        assert_eq!(step.prompt, "Do something");
        assert_eq!(step.provider_id, "claude-code");
        assert_eq!(step.status, StepStatus::Pending);
        assert!(step.session_id.is_none());
    }

    #[test]
    fn test_task_step_has_session() {
        let mut step = create_test_step("task-1", 0);
        assert!(!step.has_session());

        step.session_id = Some("session-123".to_string());
        assert!(step.has_session());
    }

    #[test]
    fn test_task_step_is_complete() {
        let mut step = create_test_step("task-1", 0);
        assert!(!step.is_complete());

        step.status = StepStatus::Completed;
        assert!(step.is_complete());

        step.status = StepStatus::Failed;
        assert!(step.is_complete());

        step.status = StepStatus::Skipped;
        assert!(step.is_complete());
    }

    #[test]
    fn test_task_step_validation_valid() {
        let step = create_test_step("task-1", 0);
        assert!(step.validate().is_ok());
    }

    #[test]
    fn test_task_step_validation_empty_title() {
        let mut step = create_test_step("task-1", 0);
        step.title = "".to_string();
        assert!(step.validate().is_err());
    }

    #[test]
    fn test_task_step_validation_empty_prompt() {
        let mut step = create_test_step("task-1", 0);
        step.prompt = "".to_string();
        assert!(step.validate().is_err());
    }

    #[test]
    fn test_task_step_serialization() {
        let step = create_test_step("task-1", 0);
        let json = serde_json::to_string(&step).unwrap();

        assert!(json.contains("\"taskId\":\"task-1\""));
        assert!(json.contains("\"stepIndex\":0"));
        assert!(json.contains("\"providerId\":\"claude-code\""));
        assert!(json.contains("\"status\":\"pending\""));

        let deserialized: TaskStep = serde_json::from_str(&json).unwrap();
        assert_eq!(step, deserialized);
    }

    #[test]
    fn test_task_step_summary_from() {
        let step = create_test_step("task-1", 0);
        let summary: TaskStepSummary = step.clone().into();

        assert_eq!(summary.id, step.id);
        assert_eq!(summary.step_index, step.step_index);
        assert_eq!(summary.title, step.title);
        assert_eq!(summary.provider_id, step.provider_id);
        assert_eq!(summary.status, step.status);
        assert!(!summary.has_session);
    }

    // =========================================================================
    // Task Entity Tests
    // =========================================================================

    #[test]
    fn test_task_new() {
        let task = Task::new("task-1", "project-1", "My Task");
        assert_eq!(task.id, "task-1");
        assert_eq!(task.project_id, "project-1");
        assert_eq!(task.title, "My Task");
        assert_eq!(task.status, TaskStatus::Pending);
        assert!(!task.auto_run);
        assert_eq!(task.current_step_index, 0);
    }

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
        task.status = TaskStatus::Pending;
        assert!(!task.is_completed());

        task.status = TaskStatus::Running;
        assert!(!task.is_completed());

        task.status = TaskStatus::Completed;
        assert!(task.is_completed());

        task.status = TaskStatus::Failed;
        assert!(task.is_completed());

        task.status = TaskStatus::Cancelled;
        assert!(task.is_completed());
    }

    #[test]
    fn test_task_is_running() {
        let mut task = create_test_task();
        assert!(!task.is_running());

        task.status = TaskStatus::Running;
        assert!(task.is_running());
    }

    #[test]
    fn test_task_can_start() {
        let mut task = create_test_task();
        task.status = TaskStatus::Pending;
        assert!(task.can_start());

        task.status = TaskStatus::Paused;
        assert!(task.can_start());

        task.status = TaskStatus::Running;
        assert!(!task.can_start());

        task.status = TaskStatus::Completed;
        assert!(!task.can_start());
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
    fn test_task_has_worktree() {
        let mut task = create_test_task();
        assert!(!task.has_worktree());

        task.worktree_id = Some("worktree-123".to_string());
        assert!(task.has_worktree());
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
        assert!(json.contains("\"autoRun\""));
        assert!(json.contains("\"currentStepIndex\""));
        assert!(json.contains("\"worktreeId\""));
        assert!(json.contains("\"parentTaskId\""));
        assert!(json.contains("\"defaultExecutorProfileId\""));
        assert!(json.contains("\"baseBranch\""));
        assert!(json.contains("\"archivedAt\""));
        assert!(json.contains("\"startedAt\""));
        assert!(json.contains("\"endedAt\""));
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
        assert_eq!(summary.auto_run, task.auto_run);
        assert_eq!(summary.current_step_index, task.current_step_index);
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

    // =========================================================================
    // TaskWithSteps Tests
    // =========================================================================

    #[test]
    fn test_task_with_steps_new() {
        let task = create_test_task();
        let with_steps = TaskWithSteps::new(task.clone());

        assert_eq!(with_steps.task.id, task.id);
        assert_eq!(with_steps.step_count(), 0);
    }

    #[test]
    fn test_task_with_steps_with_steps() {
        let task = create_test_task();
        let steps = vec![
            create_test_step(&task.id, 0),
            create_test_step(&task.id, 1),
            create_test_step(&task.id, 2),
        ];
        let with_steps = TaskWithSteps::with_steps(task.clone(), steps);

        assert_eq!(with_steps.task.id, task.id);
        assert_eq!(with_steps.step_count(), 3);
    }

    #[test]
    fn test_task_with_steps_current_step() {
        let mut task = create_test_task();
        task.current_step_index = 1;
        let steps = vec![
            create_test_step(&task.id, 0),
            create_test_step(&task.id, 1),
            create_test_step(&task.id, 2),
        ];
        let with_steps = TaskWithSteps::with_steps(task, steps);

        let current = with_steps.current_step().unwrap();
        assert_eq!(current.step_index, 1);
    }

    #[test]
    fn test_task_with_steps_completed_count() {
        let task = create_test_task();
        let mut steps = vec![
            create_test_step(&task.id, 0),
            create_test_step(&task.id, 1),
            create_test_step(&task.id, 2),
        ];
        steps[0].status = StepStatus::Completed;
        steps[1].status = StepStatus::Completed;

        let with_steps = TaskWithSteps::with_steps(task, steps);

        assert_eq!(with_steps.completed_count(), 2);
        assert_eq!(with_steps.progress_percent(), 66);
    }

    #[test]
    fn test_task_with_steps_all_complete() {
        let task = create_test_task();
        let mut steps = vec![
            create_test_step(&task.id, 0),
            create_test_step(&task.id, 1),
        ];
        steps[0].status = StepStatus::Completed;
        steps[1].status = StepStatus::Completed;

        let with_steps = TaskWithSteps::with_steps(task, steps);

        assert!(with_steps.all_steps_complete());
        assert_eq!(with_steps.progress_percent(), 100);
    }

    #[test]
    fn test_task_with_steps_has_failed_step() {
        let task = create_test_task();
        let mut steps = vec![
            create_test_step(&task.id, 0),
            create_test_step(&task.id, 1),
        ];
        steps[0].status = StepStatus::Completed;
        steps[1].status = StepStatus::Failed;

        let with_steps = TaskWithSteps::with_steps(task, steps);

        assert!(with_steps.has_failed_step());
    }

    #[test]
    fn test_task_with_steps_next_pending() {
        let task = create_test_task();
        let mut steps = vec![
            create_test_step(&task.id, 0),
            create_test_step(&task.id, 1),
            create_test_step(&task.id, 2),
        ];
        steps[0].status = StepStatus::Completed;

        let with_steps = TaskWithSteps::with_steps(task, steps);

        let next = with_steps.next_pending_step().unwrap();
        assert_eq!(next.step_index, 1);
    }

    #[test]
    fn test_task_with_steps_serialization() {
        let task = create_test_task();
        let steps = vec![
            create_test_step(&task.id, 0),
            create_test_step(&task.id, 1),
        ];
        let with_steps = TaskWithSteps::with_steps(task, steps);
        let json = serde_json::to_string(&with_steps).unwrap();

        assert!(json.contains("\"task\""));
        assert!(json.contains("\"steps\""));

        let deserialized: TaskWithSteps = serde_json::from_str(&json).unwrap();
        assert_eq!(with_steps.task.id, deserialized.task.id);
        assert_eq!(with_steps.step_count(), deserialized.step_count());
    }
}
