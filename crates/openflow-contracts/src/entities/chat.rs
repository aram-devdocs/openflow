//! Chat Entity
//!
//! Chats represent conversation sessions within tasks or standalone.
//! Each chat may correspond to a workflow step and can have its own git worktree.
//! Standalone chats have no task_id but must have a project_id.

use serde::{Deserialize, Serialize};
use typeshare::typeshare;

use crate::validation::{
    validate_required_string, validate_string_length, Validate, ValidationCollector,
    ValidationResult,
};

// =============================================================================
// Chat Role Enum
// =============================================================================

/// Role of a chat within a task's workflow
///
/// Different roles represent different purposes within the workflow:
/// - Main: Primary development chat
/// - Review: Code review chat
/// - Test: Testing and QA chat
/// - Terminal: Terminal/command execution chat
///
/// # Serialization
/// Serialized as lowercase strings: "main", "review", "test", "terminal"
#[typeshare]
#[derive(Debug, Clone, Default, Serialize, Deserialize, PartialEq, Eq, Hash, sqlx::Type)]
#[serde(rename_all = "lowercase")]
#[sqlx(rename_all = "lowercase")]
pub enum ChatRole {
    /// Primary development chat
    #[default]
    Main,
    /// Code review chat
    Review,
    /// Testing and QA chat
    Test,
    /// Terminal/command execution chat
    Terminal,
}


impl std::fmt::Display for ChatRole {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            ChatRole::Main => write!(f, "main"),
            ChatRole::Review => write!(f, "review"),
            ChatRole::Test => write!(f, "test"),
            ChatRole::Terminal => write!(f, "terminal"),
        }
    }
}

impl std::str::FromStr for ChatRole {
    type Err = String;

    fn from_str(s: &str) -> Result<Self, Self::Err> {
        match s.to_lowercase().as_str() {
            "main" => Ok(ChatRole::Main),
            "review" => Ok(ChatRole::Review),
            "test" => Ok(ChatRole::Test),
            "terminal" => Ok(ChatRole::Terminal),
            _ => Err(format!("Invalid chat role: {}", s)),
        }
    }
}

impl TryFrom<String> for ChatRole {
    type Error = String;

    fn try_from(s: String) -> Result<Self, Self::Error> {
        s.parse()
    }
}

impl ChatRole {
    /// Check if this is the main chat role
    pub fn is_main(&self) -> bool {
        matches!(self, ChatRole::Main)
    }

    /// Check if this is a review chat role
    pub fn is_review(&self) -> bool {
        matches!(self, ChatRole::Review)
    }

    /// Check if this is a test chat role
    pub fn is_test(&self) -> bool {
        matches!(self, ChatRole::Test)
    }

    /// Check if this is a terminal chat role
    pub fn is_terminal(&self) -> bool {
        matches!(self, ChatRole::Terminal)
    }

    /// Get all possible chat role values
    pub fn all() -> &'static [ChatRole] {
        &[
            ChatRole::Main,
            ChatRole::Review,
            ChatRole::Test,
            ChatRole::Terminal,
        ]
    }
}

// =============================================================================
// Chat Entity
// =============================================================================

/// A chat session within a task or standalone
///
/// Each chat may correspond to a workflow step and can have its own git worktree.
/// Standalone chats have no task_id but must have a project_id.
///
/// # Database
/// @entity
/// @table: chats
///
/// # Example
/// ```json
/// {
///   "id": "550e8400-e29b-41d4-a716-446655440000",
///   "taskId": "660e8400-e29b-41d4-a716-446655440001",
///   "projectId": "770e8400-e29b-41d4-a716-446655440002",
///   "title": "Implement authentication",
///   "chatRole": "main",
///   "executorProfileId": "880e8400-e29b-41d4-a716-446655440003",
///   "baseBranch": "main",
///   "branch": "openflow/task-001/main",
///   "worktreePath": "/tmp/openflow/worktrees/task-001-main",
///   "worktreeDeleted": false,
///   "setupCompletedAt": "2024-01-15T10:35:00Z",
///   "initialPrompt": "Please implement user authentication",
///   "hiddenPrompt": null,
///   "isPlanContainer": false,
///   "mainChatId": null,
///   "workflowStepIndex": 0,
///   "claudeSessionId": "session-123",
///   "archivedAt": null,
///   "createdAt": "2024-01-15T10:30:00Z",
///   "updatedAt": "2024-01-15T14:30:00Z"
/// }
/// ```
#[typeshare]
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, sqlx::FromRow)]
#[serde(rename_all = "camelCase")]
pub struct Chat {
    /// Unique identifier (UUID v4)
    /// @validate: format=uuid
    pub id: String,

    /// Parent task ID (null for standalone chats)
    /// @validate: format=uuid
    pub task_id: Option<String>,

    /// Parent project ID (required)
    /// @validate: required, format=uuid
    pub project_id: String,

    /// Chat title (optional, for display purposes)
    /// @validate: max_length=500
    pub title: Option<String>,

    /// Role of the chat within the workflow
    pub chat_role: ChatRole,

    /// Executor profile ID to use for this chat
    /// @validate: format=uuid
    pub executor_profile_id: Option<String>,

    /// Base git branch for this chat's worktree
    /// @validate: max_length=255
    pub base_branch: String,

    /// Git branch name for this chat's worktree
    /// @validate: max_length=255
    pub branch: Option<String>,

    /// Path to the git worktree for this chat
    /// @validate: max_length=1000
    pub worktree_path: Option<String>,

    /// Whether the worktree has been deleted
    pub worktree_deleted: bool,

    /// Timestamp when worktree setup was completed
    pub setup_completed_at: Option<String>,

    /// Initial prompt shown to the user/agent
    /// @validate: max_length=100000
    pub initial_prompt: Option<String>,

    /// Hidden system prompt (not shown to user)
    /// @validate: max_length=100000
    pub hidden_prompt: Option<String>,

    /// Whether this chat is a plan container (holds sub-chats)
    pub is_plan_container: bool,

    /// ID of the main chat (for sub-chats within a plan)
    /// @validate: format=uuid
    pub main_chat_id: Option<String>,

    /// Index of this chat's step in the workflow
    pub workflow_step_index: Option<i32>,

    /// Claude Code session ID for resuming conversations
    /// @validate: max_length=255
    pub claude_session_id: Option<String>,

    /// Timestamp when the chat was archived (soft-delete)
    /// null means the chat is active
    pub archived_at: Option<String>,

    /// When the chat was created (ISO 8601)
    pub created_at: String,

    /// When the chat was last updated (ISO 8601)
    pub updated_at: String,
}

impl Chat {
    /// Check if this is a standalone chat (no task)
    pub fn is_standalone(&self) -> bool {
        self.task_id.is_none()
    }

    /// Check if this chat has a worktree
    pub fn has_worktree(&self) -> bool {
        self.worktree_path.is_some() && !self.worktree_deleted
    }

    /// Check if the worktree setup is completed
    pub fn is_setup_completed(&self) -> bool {
        self.setup_completed_at.is_some()
    }

    /// Check if the chat is archived
    pub fn is_archived(&self) -> bool {
        self.archived_at.is_some()
    }

    /// Check if this is a plan container
    pub fn is_plan(&self) -> bool {
        self.is_plan_container
    }

    /// Check if this is a sub-chat of a plan
    pub fn is_sub_chat(&self) -> bool {
        self.main_chat_id.is_some()
    }

    /// Check if this chat has a Claude session for resuming
    pub fn has_session(&self) -> bool {
        self.claude_session_id.is_some()
    }

    /// Get the branch name, generating one if not set
    pub fn get_branch(&self) -> Option<&str> {
        self.branch.as_deref()
    }
}

// =============================================================================
// Chat Summary (for list views)
// =============================================================================

/// A lightweight chat summary for list views
///
/// Contains only essential fields for displaying in chat lists,
/// reducing data transfer and rendering overhead.
///
/// @derived_from: Chat
#[typeshare]
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct ChatSummary {
    /// Unique identifier
    pub id: String,

    /// Parent task ID (null for standalone)
    pub task_id: Option<String>,

    /// Parent project ID
    pub project_id: String,

    /// Chat title
    pub title: Option<String>,

    /// Role of the chat
    pub chat_role: ChatRole,

    /// Whether this chat has an active worktree
    pub has_worktree: bool,

    /// Whether setup is completed
    pub is_setup_completed: bool,

    /// Whether the chat is archived
    pub is_archived: bool,

    /// When the chat was last updated
    pub updated_at: String,
}

impl From<Chat> for ChatSummary {
    fn from(chat: Chat) -> Self {
        let has_worktree = chat.has_worktree();
        let is_setup_completed = chat.is_setup_completed();
        let is_archived = chat.is_archived();
        Self {
            id: chat.id,
            task_id: chat.task_id,
            project_id: chat.project_id,
            title: chat.title,
            chat_role: chat.chat_role,
            has_worktree,
            is_setup_completed,
            is_archived,
            updated_at: chat.updated_at,
        }
    }
}

impl From<&Chat> for ChatSummary {
    fn from(chat: &Chat) -> Self {
        Self {
            id: chat.id.clone(),
            task_id: chat.task_id.clone(),
            project_id: chat.project_id.clone(),
            title: chat.title.clone(),
            chat_role: chat.chat_role.clone(),
            has_worktree: chat.has_worktree(),
            is_setup_completed: chat.is_setup_completed(),
            is_archived: chat.is_archived(),
            updated_at: chat.updated_at.clone(),
        }
    }
}

// =============================================================================
// Chat with Message Count
// =============================================================================

/// Chat with computed message count
///
/// Extends the base Chat with the number of associated messages,
/// useful for displaying chat cards in the UI.
///
/// Note: Not using #[typeshare] due to flatten not being supported.
/// TypeScript type is manually defined in packages/generated/types-manual.ts
///
/// @derived_from: Chat
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct ChatWithMessageCount {
    /// The chat data
    #[serde(flatten)]
    pub chat: Chat,

    /// Number of messages in this chat
    pub message_count: i32,
}

impl ChatWithMessageCount {
    /// Create a new ChatWithMessageCount with zero messages
    pub fn new(chat: Chat) -> Self {
        Self {
            chat,
            message_count: 0,
        }
    }

    /// Create with a specific message count
    pub fn with_count(chat: Chat, message_count: i32) -> Self {
        Self { chat, message_count }
    }
}

// =============================================================================
// Chat with Messages
// =============================================================================

/// Chat with its associated messages
///
/// Used when returning a chat along with all its messages from the service layer.
/// This is the typical response type for `get` operations that need to include
/// the full conversation history.
///
/// Note: Not using #[typeshare] due to flatten not being supported.
/// TypeScript type is manually defined in packages/generated/types-manual.ts
///
/// @derived_from: Chat
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct ChatWithMessages {
    /// The chat data
    #[serde(flatten)]
    pub chat: Chat,

    /// All messages in this chat, ordered by created_at ASC
    pub messages: Vec<super::message::Message>,
}

impl ChatWithMessages {
    /// Create a new ChatWithMessages with no messages
    pub fn new(chat: Chat) -> Self {
        Self {
            chat,
            messages: Vec::new(),
        }
    }

    /// Create with messages
    pub fn with_messages(chat: Chat, messages: Vec<super::message::Message>) -> Self {
        Self { chat, messages }
    }

    /// Get the number of messages
    pub fn message_count(&self) -> usize {
        self.messages.len()
    }

    /// Check if the chat has any messages
    pub fn has_messages(&self) -> bool {
        !self.messages.is_empty()
    }

    /// Convert to ChatWithMessageCount
    pub fn into_with_count(self) -> ChatWithMessageCount {
        ChatWithMessageCount {
            message_count: self.messages.len() as i32,
            chat: self.chat,
        }
    }
}

// =============================================================================
// Validation Implementation
// =============================================================================

impl Validate for Chat {
    fn validate(&self) -> ValidationResult<()> {
        ValidationCollector::new()
            .validate(|| validate_required_string("id", &self.id))
            .validate(|| validate_required_string("project_id", &self.project_id))
            .validate(|| validate_required_string("base_branch", &self.base_branch))
            .validate(|| validate_string_length("base_branch", &self.base_branch, Some(1), Some(255)))
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

    fn create_test_chat() -> Chat {
        Chat {
            id: "550e8400-e29b-41d4-a716-446655440000".to_string(),
            task_id: Some("660e8400-e29b-41d4-a716-446655440001".to_string()),
            project_id: "770e8400-e29b-41d4-a716-446655440002".to_string(),
            title: Some("Test Chat".to_string()),
            chat_role: ChatRole::Main,
            executor_profile_id: Some("880e8400-e29b-41d4-a716-446655440003".to_string()),
            base_branch: "main".to_string(),
            branch: Some("openflow/task-001/main".to_string()),
            worktree_path: Some("/tmp/openflow/worktrees/task-001-main".to_string()),
            worktree_deleted: false,
            setup_completed_at: Some("2024-01-15T10:35:00Z".to_string()),
            initial_prompt: Some("Please implement user authentication".to_string()),
            hidden_prompt: None,
            is_plan_container: false,
            main_chat_id: None,
            workflow_step_index: Some(0),
            claude_session_id: Some("session-123".to_string()),
            archived_at: None,
            created_at: "2024-01-15T10:30:00Z".to_string(),
            updated_at: "2024-01-15T10:30:00Z".to_string(),
        }
    }

    fn create_standalone_chat() -> Chat {
        Chat {
            id: "550e8400-e29b-41d4-a716-446655440000".to_string(),
            task_id: None,
            project_id: "770e8400-e29b-41d4-a716-446655440002".to_string(),
            title: Some("Standalone Chat".to_string()),
            chat_role: ChatRole::Main,
            executor_profile_id: None,
            base_branch: "main".to_string(),
            branch: None,
            worktree_path: None,
            worktree_deleted: false,
            setup_completed_at: None,
            initial_prompt: None,
            hidden_prompt: None,
            is_plan_container: false,
            main_chat_id: None,
            workflow_step_index: None,
            claude_session_id: None,
            archived_at: None,
            created_at: "2024-01-15T10:30:00Z".to_string(),
            updated_at: "2024-01-15T10:30:00Z".to_string(),
        }
    }

    // =========================================================================
    // ChatRole Tests
    // =========================================================================

    #[test]
    fn test_chat_role_display() {
        assert_eq!(ChatRole::Main.to_string(), "main");
        assert_eq!(ChatRole::Review.to_string(), "review");
        assert_eq!(ChatRole::Test.to_string(), "test");
        assert_eq!(ChatRole::Terminal.to_string(), "terminal");
    }

    #[test]
    fn test_chat_role_from_str() {
        assert_eq!("main".parse::<ChatRole>().unwrap(), ChatRole::Main);
        assert_eq!("review".parse::<ChatRole>().unwrap(), ChatRole::Review);
        assert_eq!("test".parse::<ChatRole>().unwrap(), ChatRole::Test);
        assert_eq!("terminal".parse::<ChatRole>().unwrap(), ChatRole::Terminal);
        assert_eq!("MAIN".parse::<ChatRole>().unwrap(), ChatRole::Main);
        assert!("invalid".parse::<ChatRole>().is_err());
    }

    #[test]
    fn test_chat_role_is_methods() {
        assert!(ChatRole::Main.is_main());
        assert!(!ChatRole::Main.is_review());
        assert!(!ChatRole::Main.is_test());
        assert!(!ChatRole::Main.is_terminal());

        assert!(!ChatRole::Review.is_main());
        assert!(ChatRole::Review.is_review());

        assert!(!ChatRole::Test.is_main());
        assert!(ChatRole::Test.is_test());

        assert!(!ChatRole::Terminal.is_main());
        assert!(ChatRole::Terminal.is_terminal());
    }

    #[test]
    fn test_chat_role_all() {
        let all = ChatRole::all();
        assert_eq!(all.len(), 4);
        assert!(all.contains(&ChatRole::Main));
        assert!(all.contains(&ChatRole::Review));
        assert!(all.contains(&ChatRole::Test));
        assert!(all.contains(&ChatRole::Terminal));
    }

    #[test]
    fn test_chat_role_default() {
        assert_eq!(ChatRole::default(), ChatRole::Main);
    }

    #[test]
    fn test_chat_role_serialization() {
        let role = ChatRole::Review;
        let json = serde_json::to_string(&role).unwrap();
        assert_eq!(json, "\"review\"");

        let deserialized: ChatRole = serde_json::from_str(&json).unwrap();
        assert_eq!(deserialized, ChatRole::Review);
    }

    // =========================================================================
    // Chat Entity Tests
    // =========================================================================

    #[test]
    fn test_chat_is_standalone() {
        let chat = create_test_chat();
        assert!(!chat.is_standalone());

        let standalone = create_standalone_chat();
        assert!(standalone.is_standalone());
    }

    #[test]
    fn test_chat_has_worktree() {
        let mut chat = create_test_chat();
        assert!(chat.has_worktree());

        chat.worktree_deleted = true;
        assert!(!chat.has_worktree());

        chat.worktree_deleted = false;
        chat.worktree_path = None;
        assert!(!chat.has_worktree());
    }

    #[test]
    fn test_chat_is_setup_completed() {
        let mut chat = create_test_chat();
        assert!(chat.is_setup_completed());

        chat.setup_completed_at = None;
        assert!(!chat.is_setup_completed());
    }

    #[test]
    fn test_chat_is_archived() {
        let mut chat = create_test_chat();
        assert!(!chat.is_archived());

        chat.archived_at = Some("2024-01-20T10:30:00Z".to_string());
        assert!(chat.is_archived());
    }

    #[test]
    fn test_chat_is_plan() {
        let mut chat = create_test_chat();
        assert!(!chat.is_plan());

        chat.is_plan_container = true;
        assert!(chat.is_plan());
    }

    #[test]
    fn test_chat_is_sub_chat() {
        let mut chat = create_test_chat();
        assert!(!chat.is_sub_chat());

        chat.main_chat_id = Some("990e8400-e29b-41d4-a716-446655440004".to_string());
        assert!(chat.is_sub_chat());
    }

    #[test]
    fn test_chat_has_session() {
        let mut chat = create_test_chat();
        assert!(chat.has_session());

        chat.claude_session_id = None;
        assert!(!chat.has_session());
    }

    #[test]
    fn test_chat_get_branch() {
        let mut chat = create_test_chat();
        assert_eq!(chat.get_branch(), Some("openflow/task-001/main"));

        chat.branch = None;
        assert_eq!(chat.get_branch(), None);
    }

    #[test]
    fn test_chat_validation_valid() {
        let chat = create_test_chat();
        assert!(chat.validate().is_ok());
    }

    #[test]
    fn test_chat_validation_empty_id() {
        let mut chat = create_test_chat();
        chat.id = "".to_string();
        assert!(chat.validate().is_err());
    }

    #[test]
    fn test_chat_validation_empty_project_id() {
        let mut chat = create_test_chat();
        chat.project_id = "".to_string();
        assert!(chat.validate().is_err());
    }

    #[test]
    fn test_chat_validation_empty_base_branch() {
        let mut chat = create_test_chat();
        chat.base_branch = "".to_string();
        assert!(chat.validate().is_err());
    }

    #[test]
    fn test_chat_validation_title_too_long() {
        let mut chat = create_test_chat();
        chat.title = Some("a".repeat(501));
        assert!(chat.validate().is_err());
    }

    #[test]
    fn test_chat_serialization() {
        let chat = create_test_chat();
        let json = serde_json::to_string(&chat).unwrap();

        // Verify camelCase serialization
        assert!(json.contains("\"taskId\""));
        assert!(json.contains("\"projectId\""));
        assert!(json.contains("\"chatRole\""));
        assert!(json.contains("\"executorProfileId\""));
        assert!(json.contains("\"baseBranch\""));
        assert!(json.contains("\"worktreePath\""));
        assert!(json.contains("\"worktreeDeleted\""));
        assert!(json.contains("\"setupCompletedAt\""));
        assert!(json.contains("\"initialPrompt\""));
        assert!(json.contains("\"hiddenPrompt\""));
        assert!(json.contains("\"isPlanContainer\""));
        assert!(json.contains("\"mainChatId\""));
        assert!(json.contains("\"workflowStepIndex\""));
        assert!(json.contains("\"claudeSessionId\""));
        assert!(json.contains("\"archivedAt\""));
        assert!(json.contains("\"createdAt\""));
        assert!(json.contains("\"updatedAt\""));

        // Verify round-trip
        let deserialized: Chat = serde_json::from_str(&json).unwrap();
        assert_eq!(chat, deserialized);
    }

    // =========================================================================
    // ChatSummary Tests
    // =========================================================================

    #[test]
    fn test_chat_summary_from_chat() {
        let chat = create_test_chat();
        let summary: ChatSummary = chat.clone().into();

        assert_eq!(summary.id, chat.id);
        assert_eq!(summary.task_id, chat.task_id);
        assert_eq!(summary.project_id, chat.project_id);
        assert_eq!(summary.title, chat.title);
        assert_eq!(summary.chat_role, chat.chat_role);
        assert!(summary.has_worktree);
        assert!(summary.is_setup_completed);
        assert!(!summary.is_archived);
    }

    #[test]
    fn test_chat_summary_from_archived_chat() {
        let mut chat = create_test_chat();
        chat.archived_at = Some("2024-01-20T10:30:00Z".to_string());
        let summary: ChatSummary = chat.into();

        assert!(summary.is_archived);
    }

    #[test]
    fn test_chat_summary_from_standalone() {
        let chat = create_standalone_chat();
        let summary: ChatSummary = chat.into();

        assert!(summary.task_id.is_none());
        assert!(!summary.has_worktree);
        assert!(!summary.is_setup_completed);
    }

    // =========================================================================
    // ChatWithMessageCount Tests
    // =========================================================================

    #[test]
    fn test_chat_with_message_count_new() {
        let chat = create_test_chat();
        let with_count = ChatWithMessageCount::new(chat.clone());

        assert_eq!(with_count.chat.id, chat.id);
        assert_eq!(with_count.message_count, 0);
    }

    #[test]
    fn test_chat_with_message_count_with_count() {
        let chat = create_test_chat();
        let with_count = ChatWithMessageCount::with_count(chat.clone(), 10);

        assert_eq!(with_count.chat.id, chat.id);
        assert_eq!(with_count.message_count, 10);
    }

    #[test]
    fn test_chat_with_message_count_serialization() {
        let chat = create_test_chat();
        let with_count = ChatWithMessageCount::with_count(chat, 5);
        let json = serde_json::to_string(&with_count).unwrap();

        // Verify flattened chat fields
        assert!(json.contains("\"id\""));
        assert!(json.contains("\"projectId\""));
        assert!(json.contains("\"chatRole\""));
        // Verify additional field
        assert!(json.contains("\"messageCount\":5"));

        // Round-trip
        let deserialized: ChatWithMessageCount = serde_json::from_str(&json).unwrap();
        assert_eq!(with_count, deserialized);
    }
}
