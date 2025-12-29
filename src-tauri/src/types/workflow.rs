use serde::{Deserialize, Serialize};
use typeshare::typeshare;

/// Status of a workflow step.
#[typeshare]
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum WorkflowStepStatus {
    Pending,
    InProgress,
    Completed,
    Skipped,
}

impl Default for WorkflowStepStatus {
    fn default() -> Self {
        WorkflowStepStatus::Pending
    }
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

/// A step within a workflow template.
/// Steps are parsed from markdown workflow definition files.
#[typeshare]
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct WorkflowStep {
    /// Zero-based index of the step in the workflow
    pub index: i32,
    /// Name of the step (from markdown header)
    pub name: String,
    /// Description/instructions for the step (markdown content)
    pub description: String,
    /// Current status of the step
    pub status: WorkflowStepStatus,
    /// Associated chat ID if step has been started
    pub chat_id: Option<String>,
}

/// A workflow template defining a sequence of steps.
/// Templates can be built-in or loaded from markdown files.
#[typeshare]
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct WorkflowTemplate {
    pub id: String,
    /// Display name of the workflow
    pub name: String,
    /// Description of the workflow's purpose
    pub description: Option<String>,
    /// Raw markdown content of the workflow definition
    pub content: String,
    /// Whether this is a built-in workflow template
    pub is_builtin: bool,
    /// Parsed steps from the workflow content
    pub steps: Vec<WorkflowStep>,
    pub created_at: String,
    pub updated_at: String,
}

/// Available workflow variables that can be substituted in workflow content.
/// Variables use the format {@variable_name} in markdown.
#[typeshare]
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
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

/// Context for substituting workflow variables.
#[typeshare]
#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct WorkflowContext {
    pub artifacts_path: Option<String>,
    pub project_root: Option<String>,
    pub worktree_path: Option<String>,
    pub task_id: Option<String>,
    pub task_title: Option<String>,
    pub project_name: Option<String>,
}

impl WorkflowContext {
    /// Substitute all variables in the given content with their values from context
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
}

/// Request to create a workflow template (for custom templates)
#[typeshare]
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateWorkflowTemplateRequest {
    pub name: String,
    pub description: Option<String>,
    pub content: String,
}

/// Request to update an existing workflow template
#[typeshare]
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateWorkflowTemplateRequest {
    pub name: Option<String>,
    pub description: Option<String>,
    pub content: Option<String>,
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
    }

    #[test]
    fn test_workflow_context_substitute() {
        let context = WorkflowContext {
            artifacts_path: Some("/path/to/artifacts".to_string()),
            project_root: Some("/path/to/project".to_string()),
            worktree_path: Some("/path/to/worktree".to_string()),
            task_id: Some("task-123".to_string()),
            task_title: Some("My Task".to_string()),
            project_name: Some("My Project".to_string()),
        };

        let content = "Save to {@artifacts_path}/spec.md in {@project_root}";
        let result = context.substitute(content);
        assert_eq!(result, "Save to /path/to/artifacts/spec.md in /path/to/project");
    }

    #[test]
    fn test_workflow_context_substitute_partial() {
        let context = WorkflowContext {
            artifacts_path: Some("/path/to/artifacts".to_string()),
            ..Default::default()
        };

        let content = "Save to {@artifacts_path}/spec.md, worktree: {@worktree_path}";
        let result = context.substitute(content);
        // Unset variables remain as-is
        assert_eq!(
            result,
            "Save to /path/to/artifacts/spec.md, worktree: {@worktree_path}"
        );
    }
}
