//! Task and TaskStep Request Types
//!
//! Request types for task and step CRUD operations. These define the shape of
//! data sent from frontend to backend for mutations.

use serde::{Deserialize, Serialize};
use typeshare::typeshare;

use crate::entities::task::{StepStatus, TaskStatus};
use crate::validation::{
    validate_required_string, validate_string_length, Validate, ValidationCollector,
    ValidationResult,
};

// =============================================================================
// Create Task Request
// =============================================================================

/// Request to create a new task
///
/// # Endpoint
/// @endpoint: POST /api/tasks
/// @command: create_task
///
/// # Example
/// ```json
/// {
///   "projectId": "660e8400-e29b-41d4-a716-446655440001",
///   "title": "Implement user authentication",
///   "description": "Add login and registration functionality",
///   "workflowTemplate": ".openflow/workflows/feature.md",
///   "parentTaskId": null,
///   "baseBranch": "main"
/// }
/// ```
#[typeshare]
#[derive(Debug, Clone, Default, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct CreateTaskRequest {
    /// Parent project ID (required)
    /// @validate: required, format=uuid
    pub project_id: String,

    /// Task title (required)
    /// @validate: required, min_length=1, max_length=500
    pub title: String,

    /// Task description in markdown
    /// @validate: max_length=100000
    pub description: Option<String>,

    /// Path to the workflow template file (relative to project root)
    /// @validate: max_length=1000
    pub workflow_template: Option<String>,

    /// Parent task ID for creating sub-tasks
    /// @validate: format=uuid
    pub parent_task_id: Option<String>,

    /// Base git branch for this task's worktrees
    /// @validate: max_length=255
    pub base_branch: Option<String>,
}

impl CreateTaskRequest {
    /// Create a new request with required fields
    pub fn new(project_id: impl Into<String>, title: impl Into<String>) -> Self {
        Self {
            project_id: project_id.into(),
            title: title.into(),
            ..Default::default()
        }
    }

    /// Set the description
    pub fn with_description(mut self, description: impl Into<String>) -> Self {
        self.description = Some(description.into());
        self
    }

    /// Set the workflow template
    pub fn with_workflow(mut self, template: impl Into<String>) -> Self {
        self.workflow_template = Some(template.into());
        self
    }

    /// Set the parent task ID
    pub fn with_parent(mut self, parent_id: impl Into<String>) -> Self {
        self.parent_task_id = Some(parent_id.into());
        self
    }

    /// Set the base branch
    pub fn with_base_branch(mut self, branch: impl Into<String>) -> Self {
        self.base_branch = Some(branch.into());
        self
    }
}

impl Validate for CreateTaskRequest {
    fn validate(&self) -> ValidationResult<()> {
        ValidationCollector::new()
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
// Update Task Request
// =============================================================================

/// Request to update an existing task
///
/// All fields are optional - only provided fields will be updated.
/// Fields set to `null` in JSON will be unchanged; to clear a field,
/// use an empty string or appropriate null value.
///
/// # Endpoint
/// @endpoint: PATCH /api/tasks/:id
/// @command: update_task
///
/// # Example
/// ```json
/// {
///   "title": "Updated task title",
///   "status": "inprogress"
/// }
/// ```
#[typeshare]
#[derive(Debug, Clone, Default, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct UpdateTaskRequest {
    /// Updated title
    /// @validate: min_length=1, max_length=500
    pub title: Option<String>,

    /// Updated description
    /// @validate: max_length=100000
    pub description: Option<String>,

    /// Updated status
    pub status: Option<TaskStatus>,

    /// Updated auto-start setting
    pub auto_start_next_step: Option<bool>,

    /// Updated default executor profile ID
    /// @validate: format=uuid
    pub default_executor_profile_id: Option<String>,
}

impl UpdateTaskRequest {
    /// Check if any field is set for update
    pub fn has_updates(&self) -> bool {
        self.title.is_some()
            || self.description.is_some()
            || self.status.is_some()
            || self.auto_start_next_step.is_some()
            || self.default_executor_profile_id.is_some()
    }

    /// Create a request to update only the title
    pub fn with_title(title: impl Into<String>) -> Self {
        Self {
            title: Some(title.into()),
            ..Default::default()
        }
    }

    /// Create a request to update only the status
    pub fn with_status(status: TaskStatus) -> Self {
        Self {
            status: Some(status),
            ..Default::default()
        }
    }

    /// Create a request to update only the description
    pub fn with_description(description: impl Into<String>) -> Self {
        Self {
            description: Some(description.into()),
            ..Default::default()
        }
    }
}

impl Validate for UpdateTaskRequest {
    fn validate(&self) -> ValidationResult<()> {
        ValidationCollector::new()
            .validate(|| {
                if let Some(ref title) = self.title {
                    validate_required_string("title", title)?;
                    validate_string_length("title", title, Some(1), Some(500))
                } else {
                    Ok(())
                }
            })
            .validate(|| {
                if let Some(ref desc) = self.description {
                    validate_string_length("description", desc, None, Some(100000))
                } else {
                    Ok(())
                }
            })
            .finish()
    }
}

// =============================================================================
// Create Step Request
// =============================================================================

/// Request to create a new task step
///
/// # Endpoint
/// @endpoint: POST /api/tasks/:taskId/steps
/// @command: create_step
///
/// # Example
/// ```json
/// {
///   "stepIndex": 0,
///   "title": "Implement the feature",
///   "prompt": "Create a new React component for user profiles",
///   "providerId": "claude-code"
/// }
/// ```
#[typeshare]
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct CreateStepRequest {
    /// Order of execution (0-based)
    pub step_index: i32,

    /// Human-readable step name
    /// @validate: required, min_length=1, max_length=500
    pub title: String,

    /// The prompt to send to the agent
    /// @validate: required, min_length=1
    pub prompt: String,

    /// Which agent provider to use ("claude-code", "gemini-cli", etc.)
    /// @validate: required, min_length=1, max_length=100
    pub provider_id: String,
}

impl CreateStepRequest {
    /// Create a new request with required fields
    pub fn new(
        step_index: i32,
        title: impl Into<String>,
        prompt: impl Into<String>,
        provider_id: impl Into<String>,
    ) -> Self {
        Self {
            step_index,
            title: title.into(),
            prompt: prompt.into(),
            provider_id: provider_id.into(),
        }
    }
}

impl Validate for CreateStepRequest {
    fn validate(&self) -> ValidationResult<()> {
        ValidationCollector::new()
            .validate(|| validate_required_string("title", &self.title))
            .validate(|| validate_string_length("title", &self.title, Some(1), Some(500)))
            .validate(|| validate_required_string("prompt", &self.prompt))
            .validate(|| validate_required_string("provider_id", &self.provider_id))
            .validate(|| {
                validate_string_length("provider_id", &self.provider_id, Some(1), Some(100))
            })
            .validate(|| {
                if self.step_index < 0 {
                    Err(crate::validation::ValidationError::NumberMin {
                        field: "step_index".to_string(),
                        min: 0.0,
                        actual: self.step_index as f64,
                    })
                } else {
                    Ok(())
                }
            })
            .finish()
    }
}

// =============================================================================
// Update Step Request
// =============================================================================

/// Request to update an existing task step
///
/// All fields are optional - only provided fields will be updated.
///
/// # Endpoint
/// @endpoint: PATCH /api/tasks/:taskId/steps/:stepId
/// @command: update_step
///
/// # Example
/// ```json
/// {
///   "title": "Updated step title",
///   "status": "running"
/// }
/// ```
#[typeshare]
#[derive(Debug, Clone, Default, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct UpdateStepRequest {
    /// Updated title
    /// @validate: min_length=1, max_length=500
    pub title: Option<String>,

    /// Updated prompt
    pub prompt: Option<String>,

    /// Updated provider ID
    /// @validate: min_length=1, max_length=100
    pub provider_id: Option<String>,

    /// Updated status
    pub status: Option<StepStatus>,
}

impl UpdateStepRequest {
    /// Check if any field is set for update
    pub fn has_updates(&self) -> bool {
        self.title.is_some()
            || self.prompt.is_some()
            || self.provider_id.is_some()
            || self.status.is_some()
    }

    /// Create a request to update only the status
    pub fn with_status(status: StepStatus) -> Self {
        Self {
            status: Some(status),
            ..Default::default()
        }
    }

    /// Create a request to update only the title
    pub fn with_title(title: impl Into<String>) -> Self {
        Self {
            title: Some(title.into()),
            ..Default::default()
        }
    }
}

impl Validate for UpdateStepRequest {
    fn validate(&self) -> ValidationResult<()> {
        ValidationCollector::new()
            .validate(|| {
                if let Some(ref title) = self.title {
                    validate_required_string("title", title)?;
                    validate_string_length("title", title, Some(1), Some(500))
                } else {
                    Ok(())
                }
            })
            .validate(|| {
                if let Some(ref provider_id) = self.provider_id {
                    validate_required_string("provider_id", provider_id)?;
                    validate_string_length("provider_id", provider_id, Some(1), Some(100))
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

    // =========================================================================
    // CreateTaskRequest Tests
    // =========================================================================

    #[test]
    fn test_create_task_request_valid() {
        let request = CreateTaskRequest {
            project_id: "660e8400-e29b-41d4-a716-446655440001".to_string(),
            title: "Test Task".to_string(),
            description: Some("Test description".to_string()),
            workflow_template: Some(".openflow/workflows/feature.md".to_string()),
            parent_task_id: None,
            base_branch: Some("main".to_string()),
        };

        assert!(request.validate().is_ok());
    }

    #[test]
    fn test_create_task_request_minimal() {
        let request = CreateTaskRequest {
            project_id: "660e8400-e29b-41d4-a716-446655440001".to_string(),
            title: "Test Task".to_string(),
            ..Default::default()
        };

        assert!(request.validate().is_ok());
    }

    #[test]
    fn test_create_task_request_builder() {
        let request = CreateTaskRequest::new("660e8400-e29b-41d4-a716-446655440001", "Test Task")
            .with_description("A description")
            .with_workflow(".openflow/workflows/feature.md")
            .with_base_branch("develop");

        assert!(request.validate().is_ok());
        assert_eq!(request.description, Some("A description".to_string()));
        assert_eq!(
            request.workflow_template,
            Some(".openflow/workflows/feature.md".to_string())
        );
        assert_eq!(request.base_branch, Some("develop".to_string()));
    }

    #[test]
    fn test_create_task_request_empty_project_id() {
        let request = CreateTaskRequest {
            project_id: "".to_string(),
            title: "Test Task".to_string(),
            ..Default::default()
        };

        assert!(request.validate().is_err());
    }

    #[test]
    fn test_create_task_request_empty_title() {
        let request = CreateTaskRequest {
            project_id: "660e8400-e29b-41d4-a716-446655440001".to_string(),
            title: "".to_string(),
            ..Default::default()
        };

        assert!(request.validate().is_err());
    }

    #[test]
    fn test_create_task_request_title_too_long() {
        let request = CreateTaskRequest {
            project_id: "660e8400-e29b-41d4-a716-446655440001".to_string(),
            title: "a".repeat(501),
            ..Default::default()
        };

        assert!(request.validate().is_err());
    }

    #[test]
    fn test_create_task_request_serialization() {
        let request = CreateTaskRequest {
            project_id: "660e8400-e29b-41d4-a716-446655440001".to_string(),
            title: "Test Task".to_string(),
            description: Some("Description".to_string()),
            workflow_template: Some(".openflow/workflows/feature.md".to_string()),
            parent_task_id: None,
            base_branch: Some("main".to_string()),
        };

        let json = serde_json::to_string(&request).unwrap();
        assert!(json.contains("\"projectId\":\"660e8400-e29b-41d4-a716-446655440001\""));
        assert!(json.contains("\"title\":\"Test Task\""));
        assert!(json.contains("\"description\":\"Description\""));
        assert!(json.contains("\"workflowTemplate\":\".openflow/workflows/feature.md\""));
        assert!(json.contains("\"baseBranch\":\"main\""));

        // Round-trip
        let deserialized: CreateTaskRequest = serde_json::from_str(&json).unwrap();
        assert_eq!(request, deserialized);
    }

    // =========================================================================
    // UpdateTaskRequest Tests
    // =========================================================================

    #[test]
    fn test_update_task_request_valid() {
        let request = UpdateTaskRequest {
            title: Some("Updated Title".to_string()),
            description: Some("Updated description".to_string()),
            status: Some(TaskStatus::Running),
            auto_start_next_step: Some(false),
            default_executor_profile_id: Some("exec-123".to_string()),
        };

        assert!(request.validate().is_ok());
        assert!(request.has_updates());
    }

    #[test]
    fn test_update_task_request_empty() {
        let request = UpdateTaskRequest::default();

        assert!(request.validate().is_ok());
        assert!(!request.has_updates());
    }

    #[test]
    fn test_update_task_request_with_title() {
        let request = UpdateTaskRequest::with_title("New Title");

        assert!(request.validate().is_ok());
        assert!(request.has_updates());
        assert_eq!(request.title, Some("New Title".to_string()));
        assert!(request.status.is_none());
    }

    #[test]
    fn test_update_task_request_with_status() {
        let request = UpdateTaskRequest::with_status(TaskStatus::Completed);

        assert!(request.validate().is_ok());
        assert!(request.has_updates());
        assert_eq!(request.status, Some(TaskStatus::Completed));
        assert!(request.title.is_none());
    }

    #[test]
    fn test_update_task_request_with_description() {
        let request = UpdateTaskRequest::with_description("New description");

        assert!(request.validate().is_ok());
        assert!(request.has_updates());
        assert_eq!(request.description, Some("New description".to_string()));
    }

    #[test]
    fn test_update_task_request_empty_title_not_allowed() {
        let request = UpdateTaskRequest {
            title: Some("".to_string()),
            ..Default::default()
        };

        assert!(request.validate().is_err());
    }

    #[test]
    fn test_update_task_request_title_too_long() {
        let request = UpdateTaskRequest {
            title: Some("a".repeat(501)),
            ..Default::default()
        };

        assert!(request.validate().is_err());
    }

    #[test]
    fn test_update_task_request_has_updates() {
        // Test each field individually
        assert!(UpdateTaskRequest {
            title: Some("Test".to_string()),
            ..Default::default()
        }
        .has_updates());

        assert!(UpdateTaskRequest {
            description: Some("Desc".to_string()),
            ..Default::default()
        }
        .has_updates());

        assert!(UpdateTaskRequest {
            status: Some(TaskStatus::Completed),
            ..Default::default()
        }
        .has_updates());

        assert!(UpdateTaskRequest {
            auto_start_next_step: Some(true),
            ..Default::default()
        }
        .has_updates());

        assert!(UpdateTaskRequest {
            default_executor_profile_id: Some("id".to_string()),
            ..Default::default()
        }
        .has_updates());
    }

    #[test]
    fn test_update_task_request_serialization() {
        let request = UpdateTaskRequest {
            title: Some("Updated Title".to_string()),
            status: Some(TaskStatus::Running),
            ..Default::default()
        };

        let json = serde_json::to_string(&request).unwrap();

        // Verify camelCase and status serialization
        assert!(json.contains("\"title\":\"Updated Title\""));
        assert!(json.contains("\"status\":\"running\""));

        // Round-trip
        let deserialized: UpdateTaskRequest = serde_json::from_str(&json).unwrap();
        assert_eq!(request, deserialized);
    }

    #[test]
    fn test_update_task_request_partial_deserialization() {
        // Test that we can deserialize JSON with only some fields
        let json = r#"{"title": "New Title"}"#;
        let request: UpdateTaskRequest = serde_json::from_str(json).unwrap();

        assert_eq!(request.title, Some("New Title".to_string()));
        assert!(request.description.is_none());
        assert!(request.status.is_none());
        assert!(request.auto_start_next_step.is_none());
        assert!(request.default_executor_profile_id.is_none());
    }

    #[test]
    fn test_update_task_request_status_deserialization() {
        // Test status variants in JSON (new status names)
        let json = r#"{"status": "running"}"#;
        let request: UpdateTaskRequest = serde_json::from_str(json).unwrap();
        assert_eq!(request.status, Some(TaskStatus::Running));

        let json = r#"{"status": "completed"}"#;
        let request: UpdateTaskRequest = serde_json::from_str(json).unwrap();
        assert_eq!(request.status, Some(TaskStatus::Completed));

        let json = r#"{"status": "cancelled"}"#;
        let request: UpdateTaskRequest = serde_json::from_str(json).unwrap();
        assert_eq!(request.status, Some(TaskStatus::Cancelled));

        let json = r#"{"status": "paused"}"#;
        let request: UpdateTaskRequest = serde_json::from_str(json).unwrap();
        assert_eq!(request.status, Some(TaskStatus::Paused));

        let json = r#"{"status": "failed"}"#;
        let request: UpdateTaskRequest = serde_json::from_str(json).unwrap();
        assert_eq!(request.status, Some(TaskStatus::Failed));
    }

    // =========================================================================
    // CreateStepRequest Tests
    // =========================================================================

    #[test]
    fn test_create_step_request_valid() {
        let request = CreateStepRequest {
            step_index: 0,
            title: "Implement feature".to_string(),
            prompt: "Create a new component".to_string(),
            provider_id: "claude-code".to_string(),
        };

        assert!(request.validate().is_ok());
    }

    #[test]
    fn test_create_step_request_builder() {
        let request = CreateStepRequest::new(
            0,
            "Test Step",
            "Do something useful",
            "claude-code",
        );

        assert!(request.validate().is_ok());
        assert_eq!(request.step_index, 0);
        assert_eq!(request.title, "Test Step");
        assert_eq!(request.prompt, "Do something useful");
        assert_eq!(request.provider_id, "claude-code");
    }

    #[test]
    fn test_create_step_request_empty_title() {
        let request = CreateStepRequest {
            step_index: 0,
            title: "".to_string(),
            prompt: "Do something".to_string(),
            provider_id: "claude-code".to_string(),
        };

        assert!(request.validate().is_err());
    }

    #[test]
    fn test_create_step_request_empty_prompt() {
        let request = CreateStepRequest {
            step_index: 0,
            title: "Step".to_string(),
            prompt: "".to_string(),
            provider_id: "claude-code".to_string(),
        };

        assert!(request.validate().is_err());
    }

    #[test]
    fn test_create_step_request_empty_provider_id() {
        let request = CreateStepRequest {
            step_index: 0,
            title: "Step".to_string(),
            prompt: "Do something".to_string(),
            provider_id: "".to_string(),
        };

        assert!(request.validate().is_err());
    }

    #[test]
    fn test_create_step_request_negative_step_index() {
        let request = CreateStepRequest {
            step_index: -1,
            title: "Step".to_string(),
            prompt: "Do something".to_string(),
            provider_id: "claude-code".to_string(),
        };

        assert!(request.validate().is_err());
    }

    #[test]
    fn test_create_step_request_title_too_long() {
        let request = CreateStepRequest {
            step_index: 0,
            title: "a".repeat(501),
            prompt: "Do something".to_string(),
            provider_id: "claude-code".to_string(),
        };

        assert!(request.validate().is_err());
    }

    #[test]
    fn test_create_step_request_provider_id_too_long() {
        let request = CreateStepRequest {
            step_index: 0,
            title: "Step".to_string(),
            prompt: "Do something".to_string(),
            provider_id: "a".repeat(101),
        };

        assert!(request.validate().is_err());
    }

    #[test]
    fn test_create_step_request_serialization() {
        let request = CreateStepRequest {
            step_index: 1,
            title: "Test Step".to_string(),
            prompt: "Do something".to_string(),
            provider_id: "gemini-cli".to_string(),
        };

        let json = serde_json::to_string(&request).unwrap();

        // Verify camelCase
        assert!(json.contains("\"stepIndex\":1"));
        assert!(json.contains("\"title\":\"Test Step\""));
        assert!(json.contains("\"prompt\":\"Do something\""));
        assert!(json.contains("\"providerId\":\"gemini-cli\""));

        // Round-trip
        let deserialized: CreateStepRequest = serde_json::from_str(&json).unwrap();
        assert_eq!(request, deserialized);
    }

    // =========================================================================
    // UpdateStepRequest Tests
    // =========================================================================

    #[test]
    fn test_update_step_request_valid() {
        let request = UpdateStepRequest {
            title: Some("Updated Title".to_string()),
            prompt: Some("Updated prompt".to_string()),
            provider_id: Some("gemini-cli".to_string()),
            status: Some(StepStatus::Running),
        };

        assert!(request.validate().is_ok());
        assert!(request.has_updates());
    }

    #[test]
    fn test_update_step_request_empty() {
        let request = UpdateStepRequest::default();

        assert!(request.validate().is_ok());
        assert!(!request.has_updates());
    }

    #[test]
    fn test_update_step_request_with_status() {
        let request = UpdateStepRequest::with_status(StepStatus::Completed);

        assert!(request.validate().is_ok());
        assert!(request.has_updates());
        assert_eq!(request.status, Some(StepStatus::Completed));
        assert!(request.title.is_none());
    }

    #[test]
    fn test_update_step_request_with_title() {
        let request = UpdateStepRequest::with_title("New Title");

        assert!(request.validate().is_ok());
        assert!(request.has_updates());
        assert_eq!(request.title, Some("New Title".to_string()));
        assert!(request.status.is_none());
    }

    #[test]
    fn test_update_step_request_empty_title_not_allowed() {
        let request = UpdateStepRequest {
            title: Some("".to_string()),
            ..Default::default()
        };

        assert!(request.validate().is_err());
    }

    #[test]
    fn test_update_step_request_empty_provider_id_not_allowed() {
        let request = UpdateStepRequest {
            provider_id: Some("".to_string()),
            ..Default::default()
        };

        assert!(request.validate().is_err());
    }

    #[test]
    fn test_update_step_request_has_updates() {
        // Test each field individually
        assert!(UpdateStepRequest {
            title: Some("Test".to_string()),
            ..Default::default()
        }
        .has_updates());

        assert!(UpdateStepRequest {
            prompt: Some("Test".to_string()),
            ..Default::default()
        }
        .has_updates());

        assert!(UpdateStepRequest {
            provider_id: Some("test".to_string()),
            ..Default::default()
        }
        .has_updates());

        assert!(UpdateStepRequest {
            status: Some(StepStatus::Running),
            ..Default::default()
        }
        .has_updates());
    }

    #[test]
    fn test_update_step_request_serialization() {
        let request = UpdateStepRequest {
            title: Some("Updated Title".to_string()),
            status: Some(StepStatus::Running),
            ..Default::default()
        };

        let json = serde_json::to_string(&request).unwrap();

        // Verify camelCase and status serialization
        assert!(json.contains("\"title\":\"Updated Title\""));
        assert!(json.contains("\"status\":\"running\""));

        // Round-trip
        let deserialized: UpdateStepRequest = serde_json::from_str(&json).unwrap();
        assert_eq!(request, deserialized);
    }

    #[test]
    fn test_update_step_request_status_deserialization() {
        let json = r#"{"status": "completed"}"#;
        let request: UpdateStepRequest = serde_json::from_str(json).unwrap();
        assert_eq!(request.status, Some(StepStatus::Completed));

        let json = r#"{"status": "failed"}"#;
        let request: UpdateStepRequest = serde_json::from_str(json).unwrap();
        assert_eq!(request.status, Some(StepStatus::Failed));

        let json = r#"{"status": "skipped"}"#;
        let request: UpdateStepRequest = serde_json::from_str(json).unwrap();
        assert_eq!(request.status, Some(StepStatus::Skipped));
    }
}
