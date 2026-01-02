//! Workflow Entity
//!
//! Workflows define sequences of steps for AI-assisted development tasks.
//! They can be built-in templates or custom workflows loaded from markdown files.

use serde::{Deserialize, Serialize};
use typeshare::typeshare;

/// Status of a workflow step
///
/// @entity_enum
#[typeshare]
#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq, Default)]
#[serde(rename_all = "lowercase")]
pub enum WorkflowStepStatus {
    /// Step has not been started
    #[default]
    Pending,
    /// Step is currently being worked on
    InProgress,
    /// Step has been completed successfully
    Completed,
    /// Step was skipped
    Skipped,
}

impl std::fmt::Display for WorkflowStepStatus {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            WorkflowStepStatus::Pending => write!(f, "pending"),
            WorkflowStepStatus::InProgress => write!(f, "inprogress"),
            WorkflowStepStatus::Completed => write!(f, "completed"),
            WorkflowStepStatus::Skipped => write!(f, "skipped"),
        }
    }
}

impl std::str::FromStr for WorkflowStepStatus {
    type Err = String;

    fn from_str(s: &str) -> Result<Self, Self::Err> {
        match s.to_lowercase().as_str() {
            "pending" => Ok(WorkflowStepStatus::Pending),
            "inprogress" | "in_progress" => Ok(WorkflowStepStatus::InProgress),
            "completed" => Ok(WorkflowStepStatus::Completed),
            "skipped" => Ok(WorkflowStepStatus::Skipped),
            _ => Err(format!("Invalid workflow step status: {}", s)),
        }
    }
}

/// A step within a workflow template
///
/// Steps are parsed from markdown workflow definition files.
/// Each step represents a distinct phase of work with its own chat session.
///
/// @entity
#[typeshare]
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct WorkflowStep {
    /// Zero-based index of the step in the workflow
    /// @validate: min=0
    pub index: i32,

    /// Name of the step (from markdown header)
    /// @validate: required, min_length=1, max_length=255
    pub name: String,

    /// Description/instructions for the step (markdown content)
    /// @validate: max_length=100000
    pub description: String,

    /// Current status of the step
    pub status: WorkflowStepStatus,

    /// Associated chat ID if step has been started
    /// @validate: format=uuid
    pub chat_id: Option<String>,
}

impl WorkflowStep {
    /// Create a new workflow step with pending status
    pub fn new(index: i32, name: impl Into<String>, description: impl Into<String>) -> Self {
        Self {
            index,
            name: name.into(),
            description: description.into(),
            status: WorkflowStepStatus::Pending,
            chat_id: None,
        }
    }

    /// Check if this step can be started (previous steps must be completed or skipped)
    pub fn can_start(&self) -> bool {
        matches!(self.status, WorkflowStepStatus::Pending)
    }

    /// Check if this step is active (in progress)
    pub fn is_active(&self) -> bool {
        matches!(self.status, WorkflowStepStatus::InProgress)
    }

    /// Check if this step is complete
    pub fn is_complete(&self) -> bool {
        matches!(
            self.status,
            WorkflowStepStatus::Completed | WorkflowStepStatus::Skipped
        )
    }

    /// Associate a chat with this step
    pub fn with_chat(mut self, chat_id: impl Into<String>) -> Self {
        self.chat_id = Some(chat_id.into());
        self
    }

    /// Mark this step as in progress
    pub fn start(&mut self) {
        self.status = WorkflowStepStatus::InProgress;
    }

    /// Mark this step as completed
    pub fn complete(&mut self) {
        self.status = WorkflowStepStatus::Completed;
    }

    /// Mark this step as skipped
    pub fn skip(&mut self) {
        self.status = WorkflowStepStatus::Skipped;
    }
}

/// A workflow template defining a sequence of steps
///
/// Templates can be built-in or loaded from markdown files.
/// They define the structure of a development workflow.
///
/// @entity
#[typeshare]
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct WorkflowTemplate {
    /// Unique identifier for the template
    /// Format: "builtin:{name}" for built-in, "file:{filename}" for file-based
    /// @validate: required, min_length=1, max_length=255
    pub id: String,

    /// Display name of the workflow
    /// @validate: required, min_length=1, max_length=255
    pub name: String,

    /// Description of the workflow's purpose
    /// @validate: max_length=10000
    pub description: Option<String>,

    /// Raw markdown content of the workflow definition
    /// @validate: max_length=500000
    pub content: String,

    /// Whether this is a built-in workflow template
    pub is_builtin: bool,

    /// Parsed steps from the workflow content
    pub steps: Vec<WorkflowStep>,

    /// When the template was created (ISO 8601)
    pub created_at: String,

    /// When the template was last updated (ISO 8601)
    pub updated_at: String,
}

impl WorkflowTemplate {
    /// Create a new workflow template
    pub fn new(
        id: impl Into<String>,
        name: impl Into<String>,
        content: impl Into<String>,
        is_builtin: bool,
    ) -> Self {
        let now = chrono::Utc::now().to_rfc3339();
        Self {
            id: id.into(),
            name: name.into(),
            description: None,
            content: content.into(),
            is_builtin,
            steps: Vec::new(),
            created_at: now.clone(),
            updated_at: now,
        }
    }

    /// Add a description to the template
    pub fn with_description(mut self, description: impl Into<String>) -> Self {
        self.description = Some(description.into());
        self
    }

    /// Add parsed steps to the template
    pub fn with_steps(mut self, steps: Vec<WorkflowStep>) -> Self {
        self.steps = steps;
        self
    }

    /// Check if the workflow has any steps
    pub fn has_steps(&self) -> bool {
        !self.steps.is_empty()
    }

    /// Get the number of steps
    pub fn step_count(&self) -> usize {
        self.steps.len()
    }

    /// Get the number of completed steps
    pub fn completed_step_count(&self) -> usize {
        self.steps.iter().filter(|s| s.is_complete()).count()
    }

    /// Get the current step (first in-progress or pending step)
    pub fn current_step(&self) -> Option<&WorkflowStep> {
        self.steps.iter().find(|s| s.is_active()).or_else(|| {
            self.steps.iter().find(|s| s.can_start())
        })
    }

    /// Get the next pending step
    pub fn next_pending_step(&self) -> Option<&WorkflowStep> {
        self.steps.iter().find(|s| s.can_start())
    }

    /// Check if the workflow is complete (all steps done)
    pub fn is_complete(&self) -> bool {
        !self.steps.is_empty() && self.steps.iter().all(|s| s.is_complete())
    }

    /// Get progress as a percentage (0-100)
    pub fn progress_percent(&self) -> u8 {
        if self.steps.is_empty() {
            return 0;
        }
        let completed = self.completed_step_count();
        let total = self.steps.len();
        ((completed * 100) / total) as u8
    }
}

/// Summary view of a workflow template for list views
///
/// @derived_from: WorkflowTemplate
#[typeshare]
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct WorkflowTemplateSummary {
    /// Unique identifier
    pub id: String,

    /// Display name
    pub name: String,

    /// Description of the workflow
    pub description: Option<String>,

    /// Whether this is a built-in template
    pub is_builtin: bool,

    /// Number of steps in the workflow
    pub step_count: i32,
}

impl From<&WorkflowTemplate> for WorkflowTemplateSummary {
    fn from(template: &WorkflowTemplate) -> Self {
        Self {
            id: template.id.clone(),
            name: template.name.clone(),
            description: template.description.clone(),
            is_builtin: template.is_builtin,
            step_count: template.steps.len() as i32,
        }
    }
}

impl From<WorkflowTemplate> for WorkflowTemplateSummary {
    fn from(template: WorkflowTemplate) -> Self {
        Self::from(&template)
    }
}

/// Available workflow variables that can be substituted in workflow content
///
/// Variables use the format {@variable_name} in markdown.
/// These are replaced with actual values when a workflow is executed.
///
/// @entity_enum
#[typeshare]
#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq, Hash)]
#[serde(rename_all = "snake_case")]
pub enum WorkflowVariable {
    /// Task-specific artifact folder (.zenflow/tasks/{task_id}/)
    ArtifactsPath,
    /// Project git repository root path
    ProjectRoot,
    /// Current worktree path for the chat
    WorktreePath,
    /// Task ID
    TaskId,
    /// Task title
    TaskTitle,
    /// Project name
    ProjectName,
}

impl WorkflowVariable {
    /// Get the placeholder string for this variable
    pub fn placeholder(&self) -> &'static str {
        match self {
            WorkflowVariable::ArtifactsPath => "{@artifacts_path}",
            WorkflowVariable::ProjectRoot => "{@project_root}",
            WorkflowVariable::WorktreePath => "{@worktree_path}",
            WorkflowVariable::TaskId => "{@task_id}",
            WorkflowVariable::TaskTitle => "{@task_title}",
            WorkflowVariable::ProjectName => "{@project_name}",
        }
    }

    /// Get the variable name without the placeholder syntax
    pub fn name(&self) -> &'static str {
        match self {
            WorkflowVariable::ArtifactsPath => "artifacts_path",
            WorkflowVariable::ProjectRoot => "project_root",
            WorkflowVariable::WorktreePath => "worktree_path",
            WorkflowVariable::TaskId => "task_id",
            WorkflowVariable::TaskTitle => "task_title",
            WorkflowVariable::ProjectName => "project_name",
        }
    }

    /// Get all available workflow variables
    pub fn all() -> Vec<WorkflowVariable> {
        vec![
            WorkflowVariable::ArtifactsPath,
            WorkflowVariable::ProjectRoot,
            WorkflowVariable::WorktreePath,
            WorkflowVariable::TaskId,
            WorkflowVariable::TaskTitle,
            WorkflowVariable::ProjectName,
        ]
    }
}

impl std::fmt::Display for WorkflowVariable {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "{}", self.placeholder())
    }
}

/// Context for substituting workflow variables
///
/// Holds the actual values for workflow variables that will be
/// substituted into workflow content.
///
/// @entity
#[typeshare]
#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct WorkflowContext {
    /// Path to task artifacts folder
    pub artifacts_path: Option<String>,

    /// Path to project git repository root
    pub project_root: Option<String>,

    /// Path to the current worktree
    pub worktree_path: Option<String>,

    /// Task ID
    pub task_id: Option<String>,

    /// Task title
    pub task_title: Option<String>,

    /// Project name
    pub project_name: Option<String>,
}

impl WorkflowContext {
    /// Create a new empty context
    pub fn new() -> Self {
        Self::default()
    }

    /// Set the artifacts path
    pub fn with_artifacts_path(mut self, path: impl Into<String>) -> Self {
        self.artifacts_path = Some(path.into());
        self
    }

    /// Set the project root
    pub fn with_project_root(mut self, path: impl Into<String>) -> Self {
        self.project_root = Some(path.into());
        self
    }

    /// Set the worktree path
    pub fn with_worktree_path(mut self, path: impl Into<String>) -> Self {
        self.worktree_path = Some(path.into());
        self
    }

    /// Set the task ID
    pub fn with_task_id(mut self, id: impl Into<String>) -> Self {
        self.task_id = Some(id.into());
        self
    }

    /// Set the task title
    pub fn with_task_title(mut self, title: impl Into<String>) -> Self {
        self.task_title = Some(title.into());
        self
    }

    /// Set the project name
    pub fn with_project_name(mut self, name: impl Into<String>) -> Self {
        self.project_name = Some(name.into());
        self
    }

    /// Substitute all variables in the given content with their values from context
    ///
    /// Variables that are not set in the context will remain as-is in the content.
    pub fn substitute(&self, content: &str) -> String {
        let mut result = content.to_string();

        if let Some(ref val) = self.artifacts_path {
            result = result.replace("{@artifacts_path}", val);
        }
        if let Some(ref val) = self.project_root {
            result = result.replace("{@project_root}", val);
        }
        if let Some(ref val) = self.worktree_path {
            result = result.replace("{@worktree_path}", val);
        }
        if let Some(ref val) = self.task_id {
            result = result.replace("{@task_id}", val);
        }
        if let Some(ref val) = self.task_title {
            result = result.replace("{@task_title}", val);
        }
        if let Some(ref val) = self.project_name {
            result = result.replace("{@project_name}", val);
        }

        result
    }

    /// Get the value for a specific variable
    pub fn get(&self, variable: WorkflowVariable) -> Option<&str> {
        match variable {
            WorkflowVariable::ArtifactsPath => self.artifacts_path.as_deref(),
            WorkflowVariable::ProjectRoot => self.project_root.as_deref(),
            WorkflowVariable::WorktreePath => self.worktree_path.as_deref(),
            WorkflowVariable::TaskId => self.task_id.as_deref(),
            WorkflowVariable::TaskTitle => self.task_title.as_deref(),
            WorkflowVariable::ProjectName => self.project_name.as_deref(),
        }
    }

    /// Check if all required variables for a content string are set
    pub fn has_all_variables_for(&self, content: &str) -> bool {
        for var in WorkflowVariable::all() {
            if content.contains(var.placeholder()) && self.get(var).is_none() {
                return false;
            }
        }
        true
    }

    /// Get list of missing variables for a content string
    pub fn missing_variables_for(&self, content: &str) -> Vec<WorkflowVariable> {
        WorkflowVariable::all()
            .into_iter()
            .filter(|var| content.contains(var.placeholder()) && self.get(*var).is_none())
            .collect()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_workflow_step_status_display() {
        assert_eq!(WorkflowStepStatus::Pending.to_string(), "pending");
        assert_eq!(WorkflowStepStatus::InProgress.to_string(), "inprogress");
        assert_eq!(WorkflowStepStatus::Completed.to_string(), "completed");
        assert_eq!(WorkflowStepStatus::Skipped.to_string(), "skipped");
    }

    #[test]
    fn test_workflow_step_status_from_str() {
        assert_eq!(
            "pending".parse::<WorkflowStepStatus>().unwrap(),
            WorkflowStepStatus::Pending
        );
        assert_eq!(
            "inprogress".parse::<WorkflowStepStatus>().unwrap(),
            WorkflowStepStatus::InProgress
        );
        assert_eq!(
            "in_progress".parse::<WorkflowStepStatus>().unwrap(),
            WorkflowStepStatus::InProgress
        );
        assert_eq!(
            "completed".parse::<WorkflowStepStatus>().unwrap(),
            WorkflowStepStatus::Completed
        );
        assert_eq!(
            "skipped".parse::<WorkflowStepStatus>().unwrap(),
            WorkflowStepStatus::Skipped
        );
        assert!("invalid".parse::<WorkflowStepStatus>().is_err());
    }

    #[test]
    fn test_workflow_step_creation() {
        let step = WorkflowStep::new(0, "Requirements", "Create PRD");

        assert_eq!(step.index, 0);
        assert_eq!(step.name, "Requirements");
        assert_eq!(step.description, "Create PRD");
        assert_eq!(step.status, WorkflowStepStatus::Pending);
        assert!(step.chat_id.is_none());
        assert!(step.can_start());
        assert!(!step.is_active());
        assert!(!step.is_complete());
    }

    #[test]
    fn test_workflow_step_lifecycle() {
        let mut step = WorkflowStep::new(0, "Test", "Description");

        assert!(step.can_start());
        assert!(!step.is_active());

        step.start();
        assert!(!step.can_start());
        assert!(step.is_active());
        assert!(!step.is_complete());

        step.complete();
        assert!(!step.can_start());
        assert!(!step.is_active());
        assert!(step.is_complete());
    }

    #[test]
    fn test_workflow_step_skip() {
        let mut step = WorkflowStep::new(0, "Test", "Description");

        step.skip();
        assert!(!step.can_start());
        assert!(!step.is_active());
        assert!(step.is_complete());
        assert_eq!(step.status, WorkflowStepStatus::Skipped);
    }

    #[test]
    fn test_workflow_step_with_chat() {
        let step = WorkflowStep::new(0, "Test", "Description").with_chat("chat-123");

        assert_eq!(step.chat_id, Some("chat-123".to_string()));
    }

    #[test]
    fn test_workflow_template_creation() {
        let template = WorkflowTemplate::new("builtin:feature", "Feature", "# Content", true);

        assert_eq!(template.id, "builtin:feature");
        assert_eq!(template.name, "Feature");
        assert!(template.is_builtin);
        assert!(template.description.is_none());
        assert!(template.steps.is_empty());
        assert!(!template.has_steps());
    }

    #[test]
    fn test_workflow_template_with_steps() {
        let steps = vec![
            WorkflowStep::new(0, "Step 1", "First step"),
            WorkflowStep::new(1, "Step 2", "Second step"),
        ];

        let template = WorkflowTemplate::new("test", "Test", "", false)
            .with_description("A test workflow")
            .with_steps(steps);

        assert!(template.has_steps());
        assert_eq!(template.step_count(), 2);
        assert_eq!(template.description, Some("A test workflow".to_string()));
    }

    #[test]
    fn test_workflow_template_progress() {
        let mut steps = vec![
            WorkflowStep::new(0, "Step 1", ""),
            WorkflowStep::new(1, "Step 2", ""),
            WorkflowStep::new(2, "Step 3", ""),
            WorkflowStep::new(3, "Step 4", ""),
        ];

        steps[0].complete();
        steps[1].complete();

        let template = WorkflowTemplate::new("test", "Test", "", false).with_steps(steps);

        assert_eq!(template.completed_step_count(), 2);
        assert_eq!(template.progress_percent(), 50);
        assert!(!template.is_complete());
    }

    #[test]
    fn test_workflow_template_is_complete() {
        let mut steps = vec![
            WorkflowStep::new(0, "Step 1", ""),
            WorkflowStep::new(1, "Step 2", ""),
        ];

        steps[0].complete();
        steps[1].skip();

        let template = WorkflowTemplate::new("test", "Test", "", false).with_steps(steps);

        assert!(template.is_complete());
        assert_eq!(template.progress_percent(), 100);
    }

    #[test]
    fn test_workflow_template_current_step() {
        let mut steps = vec![
            WorkflowStep::new(0, "Step 1", ""),
            WorkflowStep::new(1, "Step 2", ""),
            WorkflowStep::new(2, "Step 3", ""),
        ];

        // Initially, first pending step is current
        let template = WorkflowTemplate::new("test", "Test", "", false).with_steps(steps.clone());
        let current = template.current_step().unwrap();
        assert_eq!(current.name, "Step 1");

        // After starting a step, it becomes current
        steps[0].complete();
        steps[1].start();
        let template = WorkflowTemplate::new("test", "Test", "", false).with_steps(steps.clone());
        let current = template.current_step().unwrap();
        assert_eq!(current.name, "Step 2");

        // When no in-progress, returns first pending
        steps[1].complete();
        let template = WorkflowTemplate::new("test", "Test", "", false).with_steps(steps);
        let current = template.current_step().unwrap();
        assert_eq!(current.name, "Step 3");
    }

    #[test]
    fn test_workflow_template_summary() {
        let steps = vec![
            WorkflowStep::new(0, "Step 1", ""),
            WorkflowStep::new(1, "Step 2", ""),
        ];

        let template = WorkflowTemplate::new("builtin:feature", "Feature", "", true)
            .with_description("A feature workflow")
            .with_steps(steps);

        let summary: WorkflowTemplateSummary = (&template).into();

        assert_eq!(summary.id, "builtin:feature");
        assert_eq!(summary.name, "Feature");
        assert_eq!(summary.description, Some("A feature workflow".to_string()));
        assert!(summary.is_builtin);
        assert_eq!(summary.step_count, 2);
    }

    #[test]
    fn test_workflow_variable_placeholder() {
        assert_eq!(
            WorkflowVariable::ArtifactsPath.placeholder(),
            "{@artifacts_path}"
        );
        assert_eq!(
            WorkflowVariable::ProjectRoot.placeholder(),
            "{@project_root}"
        );
        assert_eq!(
            WorkflowVariable::WorktreePath.placeholder(),
            "{@worktree_path}"
        );
        assert_eq!(WorkflowVariable::TaskId.placeholder(), "{@task_id}");
        assert_eq!(WorkflowVariable::TaskTitle.placeholder(), "{@task_title}");
        assert_eq!(
            WorkflowVariable::ProjectName.placeholder(),
            "{@project_name}"
        );
    }

    #[test]
    fn test_workflow_variable_name() {
        assert_eq!(WorkflowVariable::ArtifactsPath.name(), "artifacts_path");
        assert_eq!(WorkflowVariable::TaskId.name(), "task_id");
    }

    #[test]
    fn test_workflow_variable_all() {
        let all = WorkflowVariable::all();
        assert_eq!(all.len(), 6);
        assert!(all.contains(&WorkflowVariable::ArtifactsPath));
        assert!(all.contains(&WorkflowVariable::ProjectName));
    }

    #[test]
    fn test_workflow_context_substitute() {
        let context = WorkflowContext::new()
            .with_artifacts_path("/path/to/artifacts")
            .with_project_root("/path/to/project")
            .with_worktree_path("/path/to/worktree")
            .with_task_id("task-123")
            .with_task_title("My Task")
            .with_project_name("My Project");

        let content = "Save to {@artifacts_path}/spec.md in {@project_root}";
        let result = context.substitute(content);
        assert_eq!(
            result,
            "Save to /path/to/artifacts/spec.md in /path/to/project"
        );
    }

    #[test]
    fn test_workflow_context_substitute_partial() {
        let context = WorkflowContext::new().with_artifacts_path("/path/to/artifacts");

        let content = "Save to {@artifacts_path}/spec.md, worktree: {@worktree_path}";
        let result = context.substitute(content);
        // Unset variables remain as-is
        assert_eq!(
            result,
            "Save to /path/to/artifacts/spec.md, worktree: {@worktree_path}"
        );
    }

    #[test]
    fn test_workflow_context_substitute_all() {
        let context = WorkflowContext::new()
            .with_artifacts_path("A")
            .with_project_root("B")
            .with_worktree_path("C")
            .with_task_id("D")
            .with_task_title("E")
            .with_project_name("F");

        let content =
            "{@artifacts_path} {@project_root} {@worktree_path} {@task_id} {@task_title} {@project_name}";
        let result = context.substitute(content);
        assert_eq!(result, "A B C D E F");
    }

    #[test]
    fn test_workflow_context_get() {
        let context = WorkflowContext::new()
            .with_artifacts_path("/artifacts")
            .with_task_id("task-123");

        assert_eq!(
            context.get(WorkflowVariable::ArtifactsPath),
            Some("/artifacts")
        );
        assert_eq!(context.get(WorkflowVariable::TaskId), Some("task-123"));
        assert_eq!(context.get(WorkflowVariable::ProjectRoot), None);
    }

    #[test]
    fn test_workflow_context_has_all_variables() {
        let context = WorkflowContext::new()
            .with_artifacts_path("/artifacts")
            .with_project_root("/project");

        let content1 = "Save to {@artifacts_path}/spec.md in {@project_root}";
        assert!(context.has_all_variables_for(content1));

        let content2 = "Task: {@task_id}";
        assert!(!context.has_all_variables_for(content2));
    }

    #[test]
    fn test_workflow_context_missing_variables() {
        let context = WorkflowContext::new().with_artifacts_path("/artifacts");

        let content = "{@artifacts_path} {@task_id} {@project_name}";
        let missing = context.missing_variables_for(content);

        assert_eq!(missing.len(), 2);
        assert!(missing.contains(&WorkflowVariable::TaskId));
        assert!(missing.contains(&WorkflowVariable::ProjectName));
        assert!(!missing.contains(&WorkflowVariable::ArtifactsPath));
    }

    #[test]
    fn test_workflow_context_no_missing_variables() {
        let context = WorkflowContext::new().with_artifacts_path("/artifacts");

        let content = "No variables here";
        let missing = context.missing_variables_for(content);

        assert!(missing.is_empty());
    }
}
