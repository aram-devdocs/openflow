//! Workflow Request Types
//!
//! Request types for workflow and workflow template operations.

use serde::{Deserialize, Serialize};
use typeshare::typeshare;

use crate::entities::workflow::WorkflowStepStatus;

/// Request to list workflow templates
///
/// @endpoint: GET /api/workflows/templates
/// @command: list_workflow_templates
#[typeshare]
#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct ListWorkflowTemplatesRequest {
    /// Include built-in templates (default: true)
    pub include_builtin: Option<bool>,

    /// Optional project ID to load project-specific templates
    /// @validate: format=uuid
    pub project_id: Option<String>,
}

impl ListWorkflowTemplatesRequest {
    /// Create a new request with default options
    pub fn new() -> Self {
        Self::default()
    }

    /// Include built-in templates
    pub fn with_builtin(mut self, include: bool) -> Self {
        self.include_builtin = Some(include);
        self
    }

    /// Set the project ID to load project-specific templates
    pub fn for_project(mut self, project_id: impl Into<String>) -> Self {
        self.project_id = Some(project_id.into());
        self
    }

    /// Check if built-in templates should be included
    pub fn should_include_builtin(&self) -> bool {
        self.include_builtin.unwrap_or(true)
    }
}

/// Request to get a specific workflow template
///
/// @endpoint: GET /api/workflows/templates/:id
/// @command: get_workflow_template
#[typeshare]
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct GetWorkflowTemplateRequest {
    /// Template ID (e.g., "builtin:feature" or "file:custom")
    /// @validate: required, min_length=1, max_length=255
    pub id: String,

    /// Optional project ID for file-based templates
    /// @validate: format=uuid
    pub project_id: Option<String>,
}

impl GetWorkflowTemplateRequest {
    /// Create a new request for a template by ID
    pub fn new(id: impl Into<String>) -> Self {
        Self {
            id: id.into(),
            project_id: None,
        }
    }

    /// Set the project ID for file-based template lookup
    pub fn for_project(mut self, project_id: impl Into<String>) -> Self {
        self.project_id = Some(project_id.into());
        self
    }

    /// Check if this is a built-in template request
    pub fn is_builtin(&self) -> bool {
        self.id.starts_with("builtin:")
    }
}

/// Request to create a new workflow template
///
/// @endpoint: POST /api/workflows/templates
/// @command: create_workflow_template
#[typeshare]
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateWorkflowTemplateRequest {
    /// Display name of the workflow
    /// @validate: required, min_length=1, max_length=255
    pub name: String,

    /// Description of the workflow's purpose
    /// @validate: max_length=10000
    pub description: Option<String>,

    /// Markdown content of the workflow definition
    /// @validate: required, min_length=1, max_length=500000
    pub content: String,

    /// Optional project ID to associate the template with
    /// @validate: format=uuid
    pub project_id: Option<String>,
}

impl CreateWorkflowTemplateRequest {
    /// Create a new workflow template request
    pub fn new(name: impl Into<String>, content: impl Into<String>) -> Self {
        Self {
            name: name.into(),
            description: None,
            content: content.into(),
            project_id: None,
        }
    }

    /// Add a description
    pub fn with_description(mut self, description: impl Into<String>) -> Self {
        self.description = Some(description.into());
        self
    }

    /// Associate with a project
    pub fn for_project(mut self, project_id: impl Into<String>) -> Self {
        self.project_id = Some(project_id.into());
        self
    }
}

/// Request to update an existing workflow template
///
/// @endpoint: PATCH /api/workflows/templates/:id
/// @command: update_workflow_template
#[typeshare]
#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct UpdateWorkflowTemplateRequest {
    /// Updated display name
    /// @validate: min_length=1, max_length=255
    pub name: Option<String>,

    /// Updated description
    /// @validate: max_length=10000
    pub description: Option<String>,

    /// Updated markdown content
    /// @validate: max_length=500000
    pub content: Option<String>,
}

impl UpdateWorkflowTemplateRequest {
    /// Create an empty update request
    pub fn new() -> Self {
        Self::default()
    }

    /// Update the name
    pub fn with_name(mut self, name: impl Into<String>) -> Self {
        self.name = Some(name.into());
        self
    }

    /// Update the description
    pub fn with_description(mut self, description: impl Into<String>) -> Self {
        self.description = Some(description.into());
        self
    }

    /// Update the content
    pub fn with_content(mut self, content: impl Into<String>) -> Self {
        self.content = Some(content.into());
        self
    }

    /// Check if any fields are set
    pub fn has_updates(&self) -> bool {
        self.name.is_some() || self.description.is_some() || self.content.is_some()
    }
}

/// Request to delete a workflow template
///
/// @endpoint: DELETE /api/workflows/templates/:id
/// @command: delete_workflow_template
#[typeshare]
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DeleteWorkflowTemplateRequest {
    /// Template ID to delete
    /// @validate: required, min_length=1, max_length=255
    pub id: String,
}

impl DeleteWorkflowTemplateRequest {
    /// Create a new delete request
    pub fn new(id: impl Into<String>) -> Self {
        Self { id: id.into() }
    }
}

/// Request to parse workflow steps from markdown content
///
/// @endpoint: POST /api/workflows/parse
/// @command: parse_workflow
#[typeshare]
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ParseWorkflowRequest {
    /// Markdown content to parse
    /// @validate: required, max_length=500000
    pub content: String,
}

impl ParseWorkflowRequest {
    /// Create a new parse request
    pub fn new(content: impl Into<String>) -> Self {
        Self {
            content: content.into(),
        }
    }
}

/// Request to update a workflow step's status
///
/// @endpoint: PATCH /api/workflows/steps/:index
/// @command: update_workflow_step
#[typeshare]
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateWorkflowStepRequest {
    /// Task ID that owns the workflow
    /// @validate: required, format=uuid
    pub task_id: String,

    /// Step index to update
    /// @validate: min=0
    pub step_index: i32,

    /// New status for the step
    pub status: Option<WorkflowStepStatus>,

    /// Associated chat ID
    /// @validate: format=uuid
    pub chat_id: Option<String>,
}

impl UpdateWorkflowStepRequest {
    /// Create a new step update request
    pub fn new(task_id: impl Into<String>, step_index: i32) -> Self {
        Self {
            task_id: task_id.into(),
            step_index,
            status: None,
            chat_id: None,
        }
    }

    /// Set the new status
    pub fn with_status(mut self, status: WorkflowStepStatus) -> Self {
        self.status = Some(status);
        self
    }

    /// Associate a chat with the step
    pub fn with_chat(mut self, chat_id: impl Into<String>) -> Self {
        self.chat_id = Some(chat_id.into());
        self
    }

    /// Mark the step as in progress
    pub fn start(self) -> Self {
        self.with_status(WorkflowStepStatus::InProgress)
    }

    /// Mark the step as completed
    pub fn complete(self) -> Self {
        self.with_status(WorkflowStepStatus::Completed)
    }

    /// Mark the step as skipped
    pub fn skip(self) -> Self {
        self.with_status(WorkflowStepStatus::Skipped)
    }
}

/// Request to substitute variables in workflow content
///
/// @endpoint: POST /api/workflows/substitute
/// @command: substitute_workflow_variables
#[typeshare]
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SubstituteWorkflowVariablesRequest {
    /// Content with variables to substitute
    /// @validate: required, max_length=500000
    pub content: String,

    /// Task ID for context
    /// @validate: format=uuid
    pub task_id: Option<String>,

    /// Chat ID for worktree context
    /// @validate: format=uuid
    pub chat_id: Option<String>,

    /// Additional custom variables (key -> value)
    pub custom_variables: Option<std::collections::HashMap<String, String>>,
}

impl SubstituteWorkflowVariablesRequest {
    /// Create a new substitution request
    pub fn new(content: impl Into<String>) -> Self {
        Self {
            content: content.into(),
            task_id: None,
            chat_id: None,
            custom_variables: None,
        }
    }

    /// Set the task ID for context
    pub fn for_task(mut self, task_id: impl Into<String>) -> Self {
        self.task_id = Some(task_id.into());
        self
    }

    /// Set the chat ID for worktree context
    pub fn for_chat(mut self, chat_id: impl Into<String>) -> Self {
        self.chat_id = Some(chat_id.into());
        self
    }

    /// Add custom variables
    pub fn with_variables(mut self, variables: std::collections::HashMap<String, String>) -> Self {
        self.custom_variables = Some(variables);
        self
    }

    /// Add a single custom variable
    pub fn with_variable(mut self, key: impl Into<String>, value: impl Into<String>) -> Self {
        let vars = self.custom_variables.get_or_insert_with(Default::default);
        vars.insert(key.into(), value.into());
        self
    }
}

/// Request to apply a workflow template to a task
///
/// @endpoint: POST /api/tasks/:id/workflow
/// @command: apply_workflow_to_task
#[typeshare]
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ApplyWorkflowToTaskRequest {
    /// Task ID to apply the workflow to
    /// @validate: required, format=uuid
    pub task_id: String,

    /// Workflow template ID to apply
    /// @validate: required, min_length=1, max_length=255
    pub template_id: String,
}

impl ApplyWorkflowToTaskRequest {
    /// Create a new request to apply a workflow to a task
    pub fn new(task_id: impl Into<String>, template_id: impl Into<String>) -> Self {
        Self {
            task_id: task_id.into(),
            template_id: template_id.into(),
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_list_workflow_templates_request() {
        let request = ListWorkflowTemplatesRequest::new()
            .with_builtin(true)
            .for_project("project-123");

        assert_eq!(request.include_builtin, Some(true));
        assert_eq!(request.project_id, Some("project-123".to_string()));
        assert!(request.should_include_builtin());
    }

    #[test]
    fn test_list_workflow_templates_request_defaults() {
        let request = ListWorkflowTemplatesRequest::new();

        assert!(request.include_builtin.is_none());
        assert!(request.project_id.is_none());
        assert!(request.should_include_builtin()); // Default is true
    }

    #[test]
    fn test_get_workflow_template_request() {
        let request = GetWorkflowTemplateRequest::new("builtin:feature");

        assert_eq!(request.id, "builtin:feature");
        assert!(request.is_builtin());

        let file_request = GetWorkflowTemplateRequest::new("file:custom").for_project("proj-1");

        assert_eq!(file_request.id, "file:custom");
        assert!(!file_request.is_builtin());
        assert_eq!(file_request.project_id, Some("proj-1".to_string()));
    }

    #[test]
    fn test_create_workflow_template_request() {
        let request =
            CreateWorkflowTemplateRequest::new("My Workflow", "# Content\n\n### [ ] Step: First")
                .with_description("A custom workflow")
                .for_project("project-123");

        assert_eq!(request.name, "My Workflow");
        assert_eq!(request.description, Some("A custom workflow".to_string()));
        assert!(request.content.contains("### [ ] Step: First"));
        assert_eq!(request.project_id, Some("project-123".to_string()));
    }

    #[test]
    fn test_update_workflow_template_request() {
        let empty = UpdateWorkflowTemplateRequest::new();
        assert!(!empty.has_updates());

        let request = UpdateWorkflowTemplateRequest::new()
            .with_name("New Name")
            .with_description("New description")
            .with_content("# New content");

        assert!(request.has_updates());
        assert_eq!(request.name, Some("New Name".to_string()));
        assert_eq!(request.description, Some("New description".to_string()));
        assert_eq!(request.content, Some("# New content".to_string()));
    }

    #[test]
    fn test_delete_workflow_template_request() {
        let request = DeleteWorkflowTemplateRequest::new("file:custom");
        assert_eq!(request.id, "file:custom");
    }

    #[test]
    fn test_parse_workflow_request() {
        let request = ParseWorkflowRequest::new("# Workflow\n\n### [ ] Step: First");
        assert!(request.content.contains("### [ ] Step: First"));
    }

    #[test]
    fn test_update_workflow_step_request() {
        let request = UpdateWorkflowStepRequest::new("task-123", 0)
            .with_status(WorkflowStepStatus::InProgress)
            .with_chat("chat-456");

        assert_eq!(request.task_id, "task-123");
        assert_eq!(request.step_index, 0);
        assert_eq!(request.status, Some(WorkflowStepStatus::InProgress));
        assert_eq!(request.chat_id, Some("chat-456".to_string()));
    }

    #[test]
    fn test_update_workflow_step_request_shortcuts() {
        let start_request = UpdateWorkflowStepRequest::new("task-123", 0).start();
        assert_eq!(start_request.status, Some(WorkflowStepStatus::InProgress));

        let complete_request = UpdateWorkflowStepRequest::new("task-123", 1).complete();
        assert_eq!(complete_request.status, Some(WorkflowStepStatus::Completed));

        let skip_request = UpdateWorkflowStepRequest::new("task-123", 2).skip();
        assert_eq!(skip_request.status, Some(WorkflowStepStatus::Skipped));
    }

    #[test]
    fn test_substitute_workflow_variables_request() {
        let mut vars = std::collections::HashMap::new();
        vars.insert("custom".to_string(), "value".to_string());

        let request = SubstituteWorkflowVariablesRequest::new("Save to {@artifacts_path}")
            .for_task("task-123")
            .for_chat("chat-456")
            .with_variables(vars);

        assert!(request.content.contains("{@artifacts_path}"));
        assert_eq!(request.task_id, Some("task-123".to_string()));
        assert_eq!(request.chat_id, Some("chat-456".to_string()));
        assert!(request.custom_variables.is_some());
    }

    #[test]
    fn test_substitute_workflow_variables_request_with_variable() {
        let request = SubstituteWorkflowVariablesRequest::new("Content")
            .with_variable("key1", "value1")
            .with_variable("key2", "value2");

        let vars = request.custom_variables.unwrap();
        assert_eq!(vars.len(), 2);
        assert_eq!(vars.get("key1"), Some(&"value1".to_string()));
        assert_eq!(vars.get("key2"), Some(&"value2".to_string()));
    }

    #[test]
    fn test_apply_workflow_to_task_request() {
        let request = ApplyWorkflowToTaskRequest::new("task-123", "builtin:feature");

        assert_eq!(request.task_id, "task-123");
        assert_eq!(request.template_id, "builtin:feature");
    }
}
