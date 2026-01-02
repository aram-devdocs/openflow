//! Chat Request Types
//!
//! Request types for chat CRUD operations. These define the shape of
//! data sent from frontend to backend for chat mutations.

use serde::{Deserialize, Serialize};
use typeshare::typeshare;

use crate::entities::chat::ChatRole;
use crate::validation::{
    validate_required_string, validate_string_length, Validate, ValidationCollector,
    ValidationResult,
};

// =============================================================================
// Create Chat Request
// =============================================================================

/// Request to create a new chat
///
/// Either task_id must be provided (for task-linked chats) or the chat
/// will be standalone. project_id is always required.
///
/// # Endpoint
/// @endpoint: POST /api/chats
/// @command: create_chat
///
/// # Example (Task-linked chat)
/// ```json
/// {
///   "taskId": "660e8400-e29b-41d4-a716-446655440001",
///   "projectId": "770e8400-e29b-41d4-a716-446655440002",
///   "title": "Implement authentication",
///   "chatRole": "main",
///   "baseBranch": "main",
///   "initialPrompt": "Please implement user authentication"
/// }
/// ```
///
/// # Example (Standalone chat)
/// ```json
/// {
///   "projectId": "770e8400-e29b-41d4-a716-446655440002",
///   "title": "Quick question about the codebase",
///   "chatRole": "main"
/// }
/// ```
#[typeshare]
#[derive(Debug, Clone, Default, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct CreateChatRequest {
    /// Parent task ID (optional, for task-linked chats)
    /// @validate: format=uuid
    pub task_id: Option<String>,

    /// Parent project ID (required)
    /// @validate: required, format=uuid
    pub project_id: String,

    /// Chat title (optional, for display purposes)
    /// @validate: max_length=500
    pub title: Option<String>,

    /// Role of the chat within the workflow
    pub chat_role: Option<ChatRole>,

    /// Executor profile ID to use for this chat
    /// @validate: format=uuid
    pub executor_profile_id: Option<String>,

    /// Base git branch for this chat's worktree
    /// @validate: max_length=255
    pub base_branch: Option<String>,

    /// Initial prompt shown to the user/agent
    /// @validate: max_length=100000
    pub initial_prompt: Option<String>,

    /// Hidden system prompt (not shown to user)
    /// @validate: max_length=100000
    pub hidden_prompt: Option<String>,

    /// Whether this chat is a plan container (holds sub-chats)
    pub is_plan_container: Option<bool>,

    /// ID of the main chat (for sub-chats within a plan)
    /// @validate: format=uuid
    pub main_chat_id: Option<String>,

    /// Index of this chat's step in the workflow
    pub workflow_step_index: Option<i32>,
}

impl CreateChatRequest {
    /// Create a new request with required fields
    pub fn new(project_id: impl Into<String>) -> Self {
        Self {
            project_id: project_id.into(),
            ..Default::default()
        }
    }

    /// Create a new task-linked chat request
    pub fn for_task(task_id: impl Into<String>, project_id: impl Into<String>) -> Self {
        Self {
            task_id: Some(task_id.into()),
            project_id: project_id.into(),
            ..Default::default()
        }
    }

    /// Set the title
    pub fn with_title(mut self, title: impl Into<String>) -> Self {
        self.title = Some(title.into());
        self
    }

    /// Set the chat role
    pub fn with_role(mut self, role: ChatRole) -> Self {
        self.chat_role = Some(role);
        self
    }

    /// Set the executor profile ID
    pub fn with_executor(mut self, executor_id: impl Into<String>) -> Self {
        self.executor_profile_id = Some(executor_id.into());
        self
    }

    /// Set the base branch
    pub fn with_base_branch(mut self, branch: impl Into<String>) -> Self {
        self.base_branch = Some(branch.into());
        self
    }

    /// Set the initial prompt
    pub fn with_initial_prompt(mut self, prompt: impl Into<String>) -> Self {
        self.initial_prompt = Some(prompt.into());
        self
    }

    /// Set the hidden prompt
    pub fn with_hidden_prompt(mut self, prompt: impl Into<String>) -> Self {
        self.hidden_prompt = Some(prompt.into());
        self
    }

    /// Set as a plan container
    pub fn as_plan_container(mut self) -> Self {
        self.is_plan_container = Some(true);
        self
    }

    /// Set the main chat ID (for sub-chats)
    pub fn with_main_chat(mut self, main_chat_id: impl Into<String>) -> Self {
        self.main_chat_id = Some(main_chat_id.into());
        self
    }

    /// Set the workflow step index
    pub fn with_step_index(mut self, index: i32) -> Self {
        self.workflow_step_index = Some(index);
        self
    }

    /// Check if this creates a standalone chat
    pub fn is_standalone(&self) -> bool {
        self.task_id.is_none()
    }
}

impl Validate for CreateChatRequest {
    fn validate(&self) -> ValidationResult<()> {
        ValidationCollector::new()
            .validate(|| validate_required_string("project_id", &self.project_id))
            .validate(|| {
                if let Some(ref title) = self.title {
                    validate_string_length("title", title, None, Some(500))
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
            .validate(|| {
                if let Some(ref prompt) = self.initial_prompt {
                    validate_string_length("initial_prompt", prompt, None, Some(100000))
                } else {
                    Ok(())
                }
            })
            .validate(|| {
                if let Some(ref prompt) = self.hidden_prompt {
                    validate_string_length("hidden_prompt", prompt, None, Some(100000))
                } else {
                    Ok(())
                }
            })
            .finish()
    }
}

// =============================================================================
// Update Chat Request
// =============================================================================

/// Request to update an existing chat
///
/// All fields are optional - only provided fields will be updated.
/// Fields set to `null` in JSON will be unchanged; to clear a field,
/// use an empty string or appropriate null value.
///
/// # Endpoint
/// @endpoint: PATCH /api/chats/:id
/// @command: update_chat
///
/// # Example
/// ```json
/// {
///   "title": "Updated chat title",
///   "claudeSessionId": "session-456"
/// }
/// ```
#[typeshare]
#[derive(Debug, Clone, Default, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct UpdateChatRequest {
    /// Updated title
    /// @validate: max_length=500
    pub title: Option<String>,

    /// Updated executor profile ID
    /// @validate: format=uuid
    pub executor_profile_id: Option<String>,

    /// Updated branch name
    /// @validate: max_length=255
    pub branch: Option<String>,

    /// Updated worktree path
    /// @validate: max_length=1000
    pub worktree_path: Option<String>,

    /// Mark worktree as deleted
    pub worktree_deleted: Option<bool>,

    /// Mark setup as completed (set timestamp)
    pub setup_completed_at: Option<String>,

    /// Updated initial prompt
    /// @validate: max_length=100000
    pub initial_prompt: Option<String>,

    /// Updated hidden prompt
    /// @validate: max_length=100000
    pub hidden_prompt: Option<String>,

    /// Claude Code session ID for resuming conversations
    /// @validate: max_length=255
    pub claude_session_id: Option<String>,
}

impl UpdateChatRequest {
    /// Check if any field is set for update
    pub fn has_updates(&self) -> bool {
        self.title.is_some()
            || self.executor_profile_id.is_some()
            || self.branch.is_some()
            || self.worktree_path.is_some()
            || self.worktree_deleted.is_some()
            || self.setup_completed_at.is_some()
            || self.initial_prompt.is_some()
            || self.hidden_prompt.is_some()
            || self.claude_session_id.is_some()
    }

    /// Create a request to update only the title
    pub fn with_title(title: impl Into<String>) -> Self {
        Self {
            title: Some(title.into()),
            ..Default::default()
        }
    }

    /// Create a request to update the session ID
    pub fn with_session_id(session_id: impl Into<String>) -> Self {
        Self {
            claude_session_id: Some(session_id.into()),
            ..Default::default()
        }
    }

    /// Create a request to set the worktree path
    pub fn with_worktree(path: impl Into<String>, branch: impl Into<String>) -> Self {
        Self {
            worktree_path: Some(path.into()),
            branch: Some(branch.into()),
            ..Default::default()
        }
    }

    /// Create a request to mark worktree as deleted
    pub fn mark_worktree_deleted() -> Self {
        Self {
            worktree_deleted: Some(true),
            ..Default::default()
        }
    }

    /// Create a request to mark setup as completed
    pub fn mark_setup_completed(timestamp: impl Into<String>) -> Self {
        Self {
            setup_completed_at: Some(timestamp.into()),
            ..Default::default()
        }
    }
}

impl Validate for UpdateChatRequest {
    fn validate(&self) -> ValidationResult<()> {
        ValidationCollector::new()
            .validate(|| {
                if let Some(ref title) = self.title {
                    validate_string_length("title", title, None, Some(500))
                } else {
                    Ok(())
                }
            })
            .validate(|| {
                if let Some(ref branch) = self.branch {
                    validate_string_length("branch", branch, None, Some(255))
                } else {
                    Ok(())
                }
            })
            .validate(|| {
                if let Some(ref path) = self.worktree_path {
                    validate_string_length("worktree_path", path, None, Some(1000))
                } else {
                    Ok(())
                }
            })
            .validate(|| {
                if let Some(ref prompt) = self.initial_prompt {
                    validate_string_length("initial_prompt", prompt, None, Some(100000))
                } else {
                    Ok(())
                }
            })
            .validate(|| {
                if let Some(ref prompt) = self.hidden_prompt {
                    validate_string_length("hidden_prompt", prompt, None, Some(100000))
                } else {
                    Ok(())
                }
            })
            .validate(|| {
                if let Some(ref session_id) = self.claude_session_id {
                    validate_string_length("claude_session_id", session_id, None, Some(255))
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
    // CreateChatRequest Tests
    // =========================================================================

    #[test]
    fn test_create_chat_request_valid() {
        let request = CreateChatRequest {
            task_id: Some("660e8400-e29b-41d4-a716-446655440001".to_string()),
            project_id: "770e8400-e29b-41d4-a716-446655440002".to_string(),
            title: Some("Test Chat".to_string()),
            chat_role: Some(ChatRole::Main),
            executor_profile_id: None,
            base_branch: Some("main".to_string()),
            initial_prompt: Some("Please help me".to_string()),
            hidden_prompt: None,
            is_plan_container: None,
            main_chat_id: None,
            workflow_step_index: Some(0),
        };

        assert!(request.validate().is_ok());
    }

    #[test]
    fn test_create_chat_request_minimal() {
        let request = CreateChatRequest {
            project_id: "770e8400-e29b-41d4-a716-446655440002".to_string(),
            ..Default::default()
        };

        assert!(request.validate().is_ok());
    }

    #[test]
    fn test_create_chat_request_builder() {
        let request = CreateChatRequest::for_task(
            "660e8400-e29b-41d4-a716-446655440001",
            "770e8400-e29b-41d4-a716-446655440002",
        )
        .with_title("Test Chat")
        .with_role(ChatRole::Review)
        .with_base_branch("develop")
        .with_initial_prompt("Please review this code")
        .with_step_index(1);

        assert!(request.validate().is_ok());
        assert!(!request.is_standalone());
        assert_eq!(request.title, Some("Test Chat".to_string()));
        assert_eq!(request.chat_role, Some(ChatRole::Review));
        assert_eq!(request.base_branch, Some("develop".to_string()));
        assert_eq!(request.workflow_step_index, Some(1));
    }

    #[test]
    fn test_create_chat_request_standalone() {
        let request = CreateChatRequest::new("770e8400-e29b-41d4-a716-446655440002")
            .with_title("Quick question");

        assert!(request.validate().is_ok());
        assert!(request.is_standalone());
    }

    #[test]
    fn test_create_chat_request_plan_container() {
        let request = CreateChatRequest::for_task(
            "660e8400-e29b-41d4-a716-446655440001",
            "770e8400-e29b-41d4-a716-446655440002",
        )
        .as_plan_container();

        assert!(request.validate().is_ok());
        assert_eq!(request.is_plan_container, Some(true));
    }

    #[test]
    fn test_create_chat_request_empty_project_id() {
        let request = CreateChatRequest {
            project_id: "".to_string(),
            ..Default::default()
        };

        assert!(request.validate().is_err());
    }

    #[test]
    fn test_create_chat_request_title_too_long() {
        let request = CreateChatRequest {
            project_id: "770e8400-e29b-41d4-a716-446655440002".to_string(),
            title: Some("a".repeat(501)),
            ..Default::default()
        };

        assert!(request.validate().is_err());
    }

    #[test]
    fn test_create_chat_request_serialization() {
        let request = CreateChatRequest {
            task_id: Some("660e8400-e29b-41d4-a716-446655440001".to_string()),
            project_id: "770e8400-e29b-41d4-a716-446655440002".to_string(),
            title: Some("Test Chat".to_string()),
            chat_role: Some(ChatRole::Main),
            executor_profile_id: None,
            base_branch: Some("main".to_string()),
            initial_prompt: None,
            hidden_prompt: None,
            is_plan_container: Some(false),
            main_chat_id: None,
            workflow_step_index: Some(0),
        };

        let json = serde_json::to_string(&request).unwrap();
        assert!(json.contains("\"taskId\":\"660e8400-e29b-41d4-a716-446655440001\""));
        assert!(json.contains("\"projectId\":\"770e8400-e29b-41d4-a716-446655440002\""));
        assert!(json.contains("\"title\":\"Test Chat\""));
        assert!(json.contains("\"chatRole\":\"main\""));
        assert!(json.contains("\"baseBranch\":\"main\""));
        assert!(json.contains("\"isPlanContainer\":false"));
        assert!(json.contains("\"workflowStepIndex\":0"));

        // Round-trip
        let deserialized: CreateChatRequest = serde_json::from_str(&json).unwrap();
        assert_eq!(request, deserialized);
    }

    // =========================================================================
    // UpdateChatRequest Tests
    // =========================================================================

    #[test]
    fn test_update_chat_request_valid() {
        let request = UpdateChatRequest {
            title: Some("Updated Title".to_string()),
            executor_profile_id: Some("exec-123".to_string()),
            branch: Some("feature/test".to_string()),
            worktree_path: Some("/tmp/worktree".to_string()),
            worktree_deleted: Some(false),
            setup_completed_at: Some("2024-01-15T10:35:00Z".to_string()),
            initial_prompt: Some("Updated prompt".to_string()),
            hidden_prompt: None,
            claude_session_id: Some("session-456".to_string()),
        };

        assert!(request.validate().is_ok());
        assert!(request.has_updates());
    }

    #[test]
    fn test_update_chat_request_empty() {
        let request = UpdateChatRequest::default();

        assert!(request.validate().is_ok());
        assert!(!request.has_updates());
    }

    #[test]
    fn test_update_chat_request_with_title() {
        let request = UpdateChatRequest::with_title("New Title");

        assert!(request.validate().is_ok());
        assert!(request.has_updates());
        assert_eq!(request.title, Some("New Title".to_string()));
    }

    #[test]
    fn test_update_chat_request_with_session_id() {
        let request = UpdateChatRequest::with_session_id("session-789");

        assert!(request.validate().is_ok());
        assert!(request.has_updates());
        assert_eq!(request.claude_session_id, Some("session-789".to_string()));
    }

    #[test]
    fn test_update_chat_request_with_worktree() {
        let request = UpdateChatRequest::with_worktree("/tmp/worktree", "feature/test");

        assert!(request.validate().is_ok());
        assert!(request.has_updates());
        assert_eq!(request.worktree_path, Some("/tmp/worktree".to_string()));
        assert_eq!(request.branch, Some("feature/test".to_string()));
    }

    #[test]
    fn test_update_chat_request_mark_worktree_deleted() {
        let request = UpdateChatRequest::mark_worktree_deleted();

        assert!(request.validate().is_ok());
        assert!(request.has_updates());
        assert_eq!(request.worktree_deleted, Some(true));
    }

    #[test]
    fn test_update_chat_request_mark_setup_completed() {
        let request = UpdateChatRequest::mark_setup_completed("2024-01-15T10:35:00Z");

        assert!(request.validate().is_ok());
        assert!(request.has_updates());
        assert_eq!(
            request.setup_completed_at,
            Some("2024-01-15T10:35:00Z".to_string())
        );
    }

    #[test]
    fn test_update_chat_request_title_too_long() {
        let request = UpdateChatRequest {
            title: Some("a".repeat(501)),
            ..Default::default()
        };

        assert!(request.validate().is_err());
    }

    #[test]
    fn test_update_chat_request_worktree_path_too_long() {
        let request = UpdateChatRequest {
            worktree_path: Some("a".repeat(1001)),
            ..Default::default()
        };

        assert!(request.validate().is_err());
    }

    #[test]
    fn test_update_chat_request_has_updates() {
        // Test each field individually
        assert!(UpdateChatRequest {
            title: Some("Test".to_string()),
            ..Default::default()
        }
        .has_updates());

        assert!(UpdateChatRequest {
            executor_profile_id: Some("exec".to_string()),
            ..Default::default()
        }
        .has_updates());

        assert!(UpdateChatRequest {
            branch: Some("main".to_string()),
            ..Default::default()
        }
        .has_updates());

        assert!(UpdateChatRequest {
            worktree_path: Some("/tmp".to_string()),
            ..Default::default()
        }
        .has_updates());

        assert!(UpdateChatRequest {
            worktree_deleted: Some(true),
            ..Default::default()
        }
        .has_updates());

        assert!(UpdateChatRequest {
            setup_completed_at: Some("2024-01-15T10:35:00Z".to_string()),
            ..Default::default()
        }
        .has_updates());

        assert!(UpdateChatRequest {
            initial_prompt: Some("prompt".to_string()),
            ..Default::default()
        }
        .has_updates());

        assert!(UpdateChatRequest {
            hidden_prompt: Some("hidden".to_string()),
            ..Default::default()
        }
        .has_updates());

        assert!(UpdateChatRequest {
            claude_session_id: Some("session".to_string()),
            ..Default::default()
        }
        .has_updates());
    }

    #[test]
    fn test_update_chat_request_serialization() {
        let request = UpdateChatRequest {
            title: Some("Updated Title".to_string()),
            claude_session_id: Some("session-123".to_string()),
            ..Default::default()
        };

        let json = serde_json::to_string(&request).unwrap();

        // Verify camelCase
        assert!(json.contains("\"title\":\"Updated Title\""));
        assert!(json.contains("\"claudeSessionId\":\"session-123\""));

        // Round-trip
        let deserialized: UpdateChatRequest = serde_json::from_str(&json).unwrap();
        assert_eq!(request, deserialized);
    }

    #[test]
    fn test_update_chat_request_partial_deserialization() {
        // Test that we can deserialize JSON with only some fields
        let json = r#"{"title": "New Title"}"#;
        let request: UpdateChatRequest = serde_json::from_str(json).unwrap();

        assert_eq!(request.title, Some("New Title".to_string()));
        assert!(request.executor_profile_id.is_none());
        assert!(request.branch.is_none());
        assert!(request.worktree_path.is_none());
        assert!(request.worktree_deleted.is_none());
        assert!(request.setup_completed_at.is_none());
        assert!(request.initial_prompt.is_none());
        assert!(request.hidden_prompt.is_none());
        assert!(request.claude_session_id.is_none());
    }
}
