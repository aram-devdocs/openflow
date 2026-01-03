//! Task Request Types
//!
//! Request types for task CRUD operations. These define the shape of
//! data sent from frontend to backend for task mutations.

use serde::{Deserialize, Serialize};
use typeshare::typeshare;

use crate::entities::task::TaskStatus;
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
            status: Some(TaskStatus::Inprogress),
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
        let request = UpdateTaskRequest::with_status(TaskStatus::Done);

        assert!(request.validate().is_ok());
        assert!(request.has_updates());
        assert_eq!(request.status, Some(TaskStatus::Done));
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
            status: Some(TaskStatus::Done),
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
            status: Some(TaskStatus::Inprogress),
            ..Default::default()
        };

        let json = serde_json::to_string(&request).unwrap();

        // Verify camelCase and status serialization
        assert!(json.contains("\"title\":\"Updated Title\""));
        assert!(json.contains("\"status\":\"inprogress\""));

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
        // Test status variants in JSON
        let json = r#"{"status": "inprogress"}"#;
        let request: UpdateTaskRequest = serde_json::from_str(json).unwrap();
        assert_eq!(request.status, Some(TaskStatus::Inprogress));

        let json = r#"{"status": "done"}"#;
        let request: UpdateTaskRequest = serde_json::from_str(json).unwrap();
        assert_eq!(request.status, Some(TaskStatus::Done));

        let json = r#"{"status": "cancelled"}"#;
        let request: UpdateTaskRequest = serde_json::from_str(json).unwrap();
        assert_eq!(request.status, Some(TaskStatus::Cancelled));
    }
}
