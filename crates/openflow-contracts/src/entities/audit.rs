//! Audit Log Entities
//!
//! Types for comprehensive action logging in the system.
//! Audit logs provide a complete trail of all significant actions,
//! enabling debugging, compliance, and historical analysis.
//!
//! # Design
//!
//! - **Append-only**: Records are never updated or deleted
//! - **Entity-scoped**: Each log entry relates to a specific entity
//! - **Actor-tracked**: Every action has an associated actor
//! - **Timestamped**: ISO 8601 timestamps with millisecond precision

use serde::{Deserialize, Serialize};
use std::fmt;
use typeshare::typeshare;

use crate::validation::{Validate, ValidationError};

// =============================================================================
// Entity Type Enum
// =============================================================================

/// Type of entity being audited.
///
/// This enum maps to the entity_type column in the audit_logs table.
#[typeshare]
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum AuditEntityType {
    /// Task entity
    Task,
    /// Task step entity
    Step,
    /// Agent session entity
    Session,
    /// Agent event entity
    Event,
    /// Permission request entity
    Permission,
    /// Project entity
    Project,
    /// Chat entity
    Chat,
    /// Worktree entity
    Worktree,
    /// Tool state entity
    Tool,
    /// Message entity
    Message,
    /// Settings entity
    Settings,
}

impl fmt::Display for AuditEntityType {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        let s = match self {
            Self::Task => "task",
            Self::Step => "step",
            Self::Session => "session",
            Self::Event => "event",
            Self::Permission => "permission",
            Self::Project => "project",
            Self::Chat => "chat",
            Self::Worktree => "worktree",
            Self::Tool => "tool",
            Self::Message => "message",
            Self::Settings => "settings",
        };
        write!(f, "{}", s)
    }
}

impl std::str::FromStr for AuditEntityType {
    type Err = String;

    fn from_str(s: &str) -> Result<Self, Self::Err> {
        match s.to_lowercase().as_str() {
            "task" => Ok(Self::Task),
            "step" => Ok(Self::Step),
            "session" => Ok(Self::Session),
            "event" => Ok(Self::Event),
            "permission" => Ok(Self::Permission),
            "project" => Ok(Self::Project),
            "chat" => Ok(Self::Chat),
            "worktree" => Ok(Self::Worktree),
            "tool" => Ok(Self::Tool),
            "message" => Ok(Self::Message),
            "settings" => Ok(Self::Settings),
            _ => Err(format!("Unknown audit entity type: {}", s)),
        }
    }
}

// =============================================================================
// Action Type Enum
// =============================================================================

/// Type of action being audited.
///
/// This enum maps to the action column in the audit_logs table.
#[typeshare]
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum AuditAction {
    /// Entity was created
    Created,
    /// Entity was updated
    Updated,
    /// Entity was deleted
    Deleted,
    /// Operation started
    Started,
    /// Operation completed successfully
    Completed,
    /// Operation failed
    Failed,
    /// Operation was paused
    Paused,
    /// Operation was resumed
    Resumed,
    /// Permission was approved
    Approved,
    /// Permission was denied
    Denied,
    /// Process was killed
    Killed,
    /// Entity was archived
    Archived,
    /// Entity was restored from archive
    Restored,
    /// Entity was cancelled
    Cancelled,
    /// Entity was skipped
    Skipped,
}

impl fmt::Display for AuditAction {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        let s = match self {
            Self::Created => "created",
            Self::Updated => "updated",
            Self::Deleted => "deleted",
            Self::Started => "started",
            Self::Completed => "completed",
            Self::Failed => "failed",
            Self::Paused => "paused",
            Self::Resumed => "resumed",
            Self::Approved => "approved",
            Self::Denied => "denied",
            Self::Killed => "killed",
            Self::Archived => "archived",
            Self::Restored => "restored",
            Self::Cancelled => "cancelled",
            Self::Skipped => "skipped",
        };
        write!(f, "{}", s)
    }
}

impl std::str::FromStr for AuditAction {
    type Err = String;

    fn from_str(s: &str) -> Result<Self, Self::Err> {
        match s.to_lowercase().as_str() {
            "created" => Ok(Self::Created),
            "updated" => Ok(Self::Updated),
            "deleted" => Ok(Self::Deleted),
            "started" => Ok(Self::Started),
            "completed" => Ok(Self::Completed),
            "failed" => Ok(Self::Failed),
            "paused" => Ok(Self::Paused),
            "resumed" => Ok(Self::Resumed),
            "approved" => Ok(Self::Approved),
            "denied" => Ok(Self::Denied),
            "killed" => Ok(Self::Killed),
            "archived" => Ok(Self::Archived),
            "restored" => Ok(Self::Restored),
            "cancelled" => Ok(Self::Cancelled),
            "skipped" => Ok(Self::Skipped),
            _ => Err(format!("Unknown audit action: {}", s)),
        }
    }
}

impl AuditAction {
    /// Check if this action represents a lifecycle start.
    pub fn is_start(&self) -> bool {
        matches!(self, Self::Created | Self::Started | Self::Resumed)
    }

    /// Check if this action represents a lifecycle end.
    pub fn is_terminal(&self) -> bool {
        matches!(
            self,
            Self::Completed | Self::Failed | Self::Killed | Self::Deleted | Self::Cancelled
        )
    }

    /// Check if this action represents success.
    pub fn is_success(&self) -> bool {
        matches!(self, Self::Completed | Self::Approved)
    }

    /// Check if this action represents failure or negative outcome.
    pub fn is_failure(&self) -> bool {
        matches!(self, Self::Failed | Self::Denied | Self::Killed | Self::Cancelled)
    }
}

// =============================================================================
// Actor Type Enum
// =============================================================================

/// Actor who performed the action.
///
/// This enum maps to the actor column in the audit_logs table.
#[typeshare]
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum AuditActor {
    /// System-initiated action (background processes, automation)
    System,
    /// User-initiated action (UI interaction, CLI command)
    User,
    /// Agent-initiated action (AI agent performing task)
    Agent,
}

impl fmt::Display for AuditActor {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        let s = match self {
            Self::System => "system",
            Self::User => "user",
            Self::Agent => "agent",
        };
        write!(f, "{}", s)
    }
}

impl std::str::FromStr for AuditActor {
    type Err = String;

    fn from_str(s: &str) -> Result<Self, Self::Err> {
        match s.to_lowercase().as_str() {
            "system" => Ok(Self::System),
            "user" => Ok(Self::User),
            "agent" => Ok(Self::Agent),
            _ => Err(format!("Unknown audit actor: {}", s)),
        }
    }
}

impl Default for AuditActor {
    fn default() -> Self {
        Self::System
    }
}

// =============================================================================
// Audit Log Entity
// =============================================================================

/// An audit log record.
///
/// Represents a single action logged in the system. Audit logs are
/// append-only and provide a complete trail of all significant actions.
#[typeshare]
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize, sqlx::FromRow)]
pub struct AuditLog {
    /// Unique identifier for this log entry
    pub id: String,

    /// Type of entity this action relates to
    pub entity_type: String,

    /// ID of the entity this action relates to
    pub entity_id: String,

    /// The action that was performed
    pub action: String,

    /// Who performed the action
    pub actor: String,

    /// Additional context as JSON (optional)
    pub details: Option<String>,

    /// When the action occurred (ISO 8601)
    pub created_at: String,
}

impl AuditLog {
    /// Get the entity type as an enum.
    pub fn entity_type_enum(&self) -> Option<AuditEntityType> {
        self.entity_type.parse().ok()
    }

    /// Get the action as an enum.
    pub fn action_enum(&self) -> Option<AuditAction> {
        self.action.parse().ok()
    }

    /// Get the actor as an enum.
    pub fn actor_enum(&self) -> Option<AuditActor> {
        self.actor.parse().ok()
    }

    /// Get details as parsed JSON.
    pub fn details_json(&self) -> Option<serde_json::Value> {
        self.details
            .as_ref()
            .and_then(|s| serde_json::from_str(s).ok())
    }
}

impl Validate for AuditLog {
    fn validate(&self) -> Result<(), ValidationError> {
        if self.id.is_empty() {
            return Err(ValidationError::required("id"));
        }
        if self.entity_type.is_empty() {
            return Err(ValidationError::required("entity_type"));
        }
        if self.entity_id.is_empty() {
            return Err(ValidationError::required("entity_id"));
        }
        if self.action.is_empty() {
            return Err(ValidationError::required("action"));
        }
        if self.actor.is_empty() {
            return Err(ValidationError::required("actor"));
        }
        if self.created_at.is_empty() {
            return Err(ValidationError::required("created_at"));
        }
        Ok(())
    }
}

// =============================================================================
// Audit Log Summary (Lightweight View)
// =============================================================================

/// Lightweight audit log summary for lists.
#[typeshare]
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct AuditLogSummary {
    /// Unique identifier
    pub id: String,

    /// Type of entity
    pub entity_type: String,

    /// Action performed
    pub action: String,

    /// Who performed the action
    pub actor: String,

    /// When it occurred
    pub created_at: String,
}

impl From<&AuditLog> for AuditLogSummary {
    fn from(log: &AuditLog) -> Self {
        Self {
            id: log.id.clone(),
            entity_type: log.entity_type.clone(),
            action: log.action.clone(),
            actor: log.actor.clone(),
            created_at: log.created_at.clone(),
        }
    }
}

// =============================================================================
// Audit Entry (For Creating New Logs)
// =============================================================================

/// Entry for creating a new audit log.
///
/// This struct is used when logging new actions. It uses typed enums
/// for entity_type, action, and actor to ensure valid values.
#[derive(Debug, Clone)]
pub struct AuditEntry {
    /// Type of entity being audited
    pub entity_type: AuditEntityType,

    /// ID of the entity
    pub entity_id: String,

    /// Action being performed
    pub action: AuditAction,

    /// Who is performing the action
    pub actor: AuditActor,

    /// Optional additional context
    pub details: Option<serde_json::Value>,
}

impl AuditEntry {
    /// Create a new audit entry with required fields.
    pub fn new(
        entity_type: AuditEntityType,
        entity_id: impl Into<String>,
        action: AuditAction,
    ) -> Self {
        Self {
            entity_type,
            entity_id: entity_id.into(),
            action,
            actor: AuditActor::System,
            details: None,
        }
    }

    /// Set the actor.
    pub fn with_actor(mut self, actor: AuditActor) -> Self {
        self.actor = actor;
        self
    }

    /// Set the details.
    pub fn with_details(mut self, details: serde_json::Value) -> Self {
        self.details = Some(details);
        self
    }

    /// Create a task-related entry.
    pub fn task(task_id: impl Into<String>, action: AuditAction) -> Self {
        Self::new(AuditEntityType::Task, task_id, action)
    }

    /// Create a step-related entry.
    pub fn step(step_id: impl Into<String>, action: AuditAction) -> Self {
        Self::new(AuditEntityType::Step, step_id, action)
    }

    /// Create a session-related entry.
    pub fn session(session_id: impl Into<String>, action: AuditAction) -> Self {
        Self::new(AuditEntityType::Session, session_id, action)
    }

    /// Create a permission-related entry.
    pub fn permission(permission_id: impl Into<String>, action: AuditAction) -> Self {
        Self::new(AuditEntityType::Permission, permission_id, action)
    }

    /// Create a project-related entry.
    pub fn project(project_id: impl Into<String>, action: AuditAction) -> Self {
        Self::new(AuditEntityType::Project, project_id, action)
    }

    /// Create a chat-related entry.
    pub fn chat(chat_id: impl Into<String>, action: AuditAction) -> Self {
        Self::new(AuditEntityType::Chat, chat_id, action)
    }
}

// =============================================================================
// Tests
// =============================================================================

#[cfg(test)]
mod tests {
    use super::*;

    // =========================================================================
    // Entity Type Tests
    // =========================================================================

    #[test]
    fn test_entity_type_display() {
        assert_eq!(AuditEntityType::Task.to_string(), "task");
        assert_eq!(AuditEntityType::Session.to_string(), "session");
        assert_eq!(AuditEntityType::Permission.to_string(), "permission");
    }

    #[test]
    fn test_entity_type_parse() {
        assert_eq!("task".parse::<AuditEntityType>().unwrap(), AuditEntityType::Task);
        assert_eq!("SESSION".parse::<AuditEntityType>().unwrap(), AuditEntityType::Session);
        assert_eq!("Permission".parse::<AuditEntityType>().unwrap(), AuditEntityType::Permission);
        assert!("unknown".parse::<AuditEntityType>().is_err());
    }

    #[test]
    fn test_entity_type_roundtrip() {
        for entity_type in [
            AuditEntityType::Task,
            AuditEntityType::Step,
            AuditEntityType::Session,
            AuditEntityType::Event,
            AuditEntityType::Permission,
            AuditEntityType::Project,
            AuditEntityType::Chat,
            AuditEntityType::Worktree,
            AuditEntityType::Tool,
            AuditEntityType::Message,
            AuditEntityType::Settings,
        ] {
            let s = entity_type.to_string();
            let parsed: AuditEntityType = s.parse().unwrap();
            assert_eq!(parsed, entity_type);
        }
    }

    // =========================================================================
    // Action Tests
    // =========================================================================

    #[test]
    fn test_action_display() {
        assert_eq!(AuditAction::Created.to_string(), "created");
        assert_eq!(AuditAction::Started.to_string(), "started");
        assert_eq!(AuditAction::Completed.to_string(), "completed");
    }

    #[test]
    fn test_action_parse() {
        assert_eq!("created".parse::<AuditAction>().unwrap(), AuditAction::Created);
        assert_eq!("FAILED".parse::<AuditAction>().unwrap(), AuditAction::Failed);
        assert_eq!("Approved".parse::<AuditAction>().unwrap(), AuditAction::Approved);
        assert!("unknown".parse::<AuditAction>().is_err());
    }

    #[test]
    fn test_action_is_start() {
        assert!(AuditAction::Created.is_start());
        assert!(AuditAction::Started.is_start());
        assert!(AuditAction::Resumed.is_start());
        assert!(!AuditAction::Completed.is_start());
        assert!(!AuditAction::Failed.is_start());
    }

    #[test]
    fn test_action_is_terminal() {
        assert!(AuditAction::Completed.is_terminal());
        assert!(AuditAction::Failed.is_terminal());
        assert!(AuditAction::Killed.is_terminal());
        assert!(AuditAction::Deleted.is_terminal());
        assert!(AuditAction::Cancelled.is_terminal());
        assert!(!AuditAction::Created.is_terminal());
        assert!(!AuditAction::Started.is_terminal());
    }

    #[test]
    fn test_action_is_success() {
        assert!(AuditAction::Completed.is_success());
        assert!(AuditAction::Approved.is_success());
        assert!(!AuditAction::Failed.is_success());
        assert!(!AuditAction::Denied.is_success());
    }

    #[test]
    fn test_action_is_failure() {
        assert!(AuditAction::Failed.is_failure());
        assert!(AuditAction::Denied.is_failure());
        assert!(AuditAction::Killed.is_failure());
        assert!(AuditAction::Cancelled.is_failure());
        assert!(!AuditAction::Completed.is_failure());
    }

    #[test]
    fn test_action_roundtrip() {
        for action in [
            AuditAction::Created,
            AuditAction::Updated,
            AuditAction::Deleted,
            AuditAction::Started,
            AuditAction::Completed,
            AuditAction::Failed,
            AuditAction::Paused,
            AuditAction::Resumed,
            AuditAction::Approved,
            AuditAction::Denied,
            AuditAction::Killed,
            AuditAction::Archived,
            AuditAction::Restored,
            AuditAction::Cancelled,
            AuditAction::Skipped,
        ] {
            let s = action.to_string();
            let parsed: AuditAction = s.parse().unwrap();
            assert_eq!(parsed, action);
        }
    }

    // =========================================================================
    // Actor Tests
    // =========================================================================

    #[test]
    fn test_actor_display() {
        assert_eq!(AuditActor::System.to_string(), "system");
        assert_eq!(AuditActor::User.to_string(), "user");
        assert_eq!(AuditActor::Agent.to_string(), "agent");
    }

    #[test]
    fn test_actor_parse() {
        assert_eq!("system".parse::<AuditActor>().unwrap(), AuditActor::System);
        assert_eq!("USER".parse::<AuditActor>().unwrap(), AuditActor::User);
        assert_eq!("Agent".parse::<AuditActor>().unwrap(), AuditActor::Agent);
        assert!("unknown".parse::<AuditActor>().is_err());
    }

    #[test]
    fn test_actor_default() {
        assert_eq!(AuditActor::default(), AuditActor::System);
    }

    // =========================================================================
    // Audit Log Tests
    // =========================================================================

    #[test]
    fn test_audit_log_entity_type_enum() {
        let log = AuditLog {
            id: "log-1".to_string(),
            entity_type: "task".to_string(),
            entity_id: "task-123".to_string(),
            action: "created".to_string(),
            actor: "user".to_string(),
            details: None,
            created_at: "2025-01-04T12:00:00.000Z".to_string(),
        };

        assert_eq!(log.entity_type_enum(), Some(AuditEntityType::Task));
    }

    #[test]
    fn test_audit_log_action_enum() {
        let log = AuditLog {
            id: "log-1".to_string(),
            entity_type: "task".to_string(),
            entity_id: "task-123".to_string(),
            action: "completed".to_string(),
            actor: "system".to_string(),
            details: None,
            created_at: "2025-01-04T12:00:00.000Z".to_string(),
        };

        assert_eq!(log.action_enum(), Some(AuditAction::Completed));
    }

    #[test]
    fn test_audit_log_actor_enum() {
        let log = AuditLog {
            id: "log-1".to_string(),
            entity_type: "session".to_string(),
            entity_id: "session-123".to_string(),
            action: "started".to_string(),
            actor: "agent".to_string(),
            details: None,
            created_at: "2025-01-04T12:00:00.000Z".to_string(),
        };

        assert_eq!(log.actor_enum(), Some(AuditActor::Agent));
    }

    #[test]
    fn test_audit_log_details_json() {
        let log = AuditLog {
            id: "log-1".to_string(),
            entity_type: "permission".to_string(),
            entity_id: "perm-123".to_string(),
            action: "approved".to_string(),
            actor: "user".to_string(),
            details: Some(r#"{"tool_name": "Bash", "file_path": "/src/main.rs"}"#.to_string()),
            created_at: "2025-01-04T12:00:00.000Z".to_string(),
        };

        let json = log.details_json().unwrap();
        assert_eq!(json["tool_name"], "Bash");
        assert_eq!(json["file_path"], "/src/main.rs");
    }

    #[test]
    fn test_audit_log_validation() {
        let valid_log = AuditLog {
            id: "log-1".to_string(),
            entity_type: "task".to_string(),
            entity_id: "task-123".to_string(),
            action: "created".to_string(),
            actor: "user".to_string(),
            details: None,
            created_at: "2025-01-04T12:00:00.000Z".to_string(),
        };
        assert!(valid_log.validate().is_ok());

        let invalid_log = AuditLog {
            id: "".to_string(),
            entity_type: "task".to_string(),
            entity_id: "task-123".to_string(),
            action: "created".to_string(),
            actor: "user".to_string(),
            details: None,
            created_at: "2025-01-04T12:00:00.000Z".to_string(),
        };
        assert!(invalid_log.validate().is_err());
    }

    // =========================================================================
    // Audit Log Summary Tests
    // =========================================================================

    #[test]
    fn test_audit_log_summary_from() {
        let log = AuditLog {
            id: "log-1".to_string(),
            entity_type: "task".to_string(),
            entity_id: "task-123".to_string(),
            action: "started".to_string(),
            actor: "system".to_string(),
            details: Some(r#"{"step": 1}"#.to_string()),
            created_at: "2025-01-04T12:00:00.000Z".to_string(),
        };

        let summary = AuditLogSummary::from(&log);
        assert_eq!(summary.id, "log-1");
        assert_eq!(summary.entity_type, "task");
        assert_eq!(summary.action, "started");
        assert_eq!(summary.actor, "system");
        assert_eq!(summary.created_at, "2025-01-04T12:00:00.000Z");
    }

    // =========================================================================
    // Audit Entry Tests
    // =========================================================================

    #[test]
    fn test_audit_entry_new() {
        let entry = AuditEntry::new(AuditEntityType::Task, "task-123", AuditAction::Created);
        assert_eq!(entry.entity_type, AuditEntityType::Task);
        assert_eq!(entry.entity_id, "task-123");
        assert_eq!(entry.action, AuditAction::Created);
        assert_eq!(entry.actor, AuditActor::System);
        assert!(entry.details.is_none());
    }

    #[test]
    fn test_audit_entry_with_actor() {
        let entry = AuditEntry::new(AuditEntityType::Permission, "perm-1", AuditAction::Approved)
            .with_actor(AuditActor::User);
        assert_eq!(entry.actor, AuditActor::User);
    }

    #[test]
    fn test_audit_entry_with_details() {
        let details = serde_json::json!({"exit_code": 0});
        let entry = AuditEntry::new(AuditEntityType::Session, "sess-1", AuditAction::Completed)
            .with_details(details.clone());
        assert_eq!(entry.details, Some(details));
    }

    #[test]
    fn test_audit_entry_task_helper() {
        let entry = AuditEntry::task("task-123", AuditAction::Started);
        assert_eq!(entry.entity_type, AuditEntityType::Task);
        assert_eq!(entry.entity_id, "task-123");
        assert_eq!(entry.action, AuditAction::Started);
    }

    #[test]
    fn test_audit_entry_session_helper() {
        let entry = AuditEntry::session("sess-456", AuditAction::Killed);
        assert_eq!(entry.entity_type, AuditEntityType::Session);
        assert_eq!(entry.entity_id, "sess-456");
        assert_eq!(entry.action, AuditAction::Killed);
    }

    #[test]
    fn test_audit_entry_permission_helper() {
        let entry = AuditEntry::permission("perm-789", AuditAction::Denied)
            .with_actor(AuditActor::User);
        assert_eq!(entry.entity_type, AuditEntityType::Permission);
        assert_eq!(entry.action, AuditAction::Denied);
        assert_eq!(entry.actor, AuditActor::User);
    }

    #[test]
    fn test_audit_entry_builder_chain() {
        let entry = AuditEntry::task("task-123", AuditAction::Failed)
            .with_actor(AuditActor::Agent)
            .with_details(serde_json::json!({"error": "timeout"}));

        assert_eq!(entry.entity_type, AuditEntityType::Task);
        assert_eq!(entry.action, AuditAction::Failed);
        assert_eq!(entry.actor, AuditActor::Agent);
        assert!(entry.details.is_some());
    }
}
