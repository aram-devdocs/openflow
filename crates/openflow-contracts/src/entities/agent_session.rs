//! Agent Session Entities
//!
//! Entities for tracking agent process sessions and permissions.
//! Agent sessions represent individual runs of CLI tools (Claude Code, Gemini CLI, etc.)
//! and track their lifecycle from spawn to completion.
//!
//! # Architecture
//!
//! Agent sessions are the core execution unit in the orchestration system:
//!
//! ```text
//! Task (unit of work)
//!   └── TaskStep (individual step with prompt)
//!         └── AgentSession (actual CLI process run)
//!               ├── AgentEvents (parsed output)
//!               ├── ToolStates (tool execution tracking)
//!               └── Permissions (user approval requests)
//! ```
//!
//! # Database
//!
//! - `agent_sessions` table (migration 007)
//! - `permissions` table (migration 014)

use serde::{Deserialize, Serialize};
use typeshare::typeshare;

use crate::validation::{
    validate_required_string, validate_string_length, Validate, ValidationCollector,
    ValidationResult,
};

// =============================================================================
// Session Status Enum
// =============================================================================

/// Status of an agent session
///
/// Sessions progress through these statuses during their lifecycle.
/// A session can only be in one status at a time.
///
/// # Database
/// Matches CHECK constraint in agent_sessions table (migration 007):
/// CHECK (status IN ('running', 'completed', 'failed', 'killed'))
///
/// # Serialization
/// Serialized as lowercase strings matching database values.
#[typeshare]
#[derive(Debug, Clone, Default, Serialize, Deserialize, PartialEq, Eq, Hash, sqlx::Type)]
#[serde(rename_all = "lowercase")]
#[sqlx(rename_all = "lowercase")]
pub enum SessionStatus {
    /// Session is actively running
    #[default]
    Running,
    /// Session completed successfully (exit code 0)
    Completed,
    /// Session failed (non-zero exit code or error)
    Failed,
    /// Session was killed by user or system
    Killed,
}

impl std::fmt::Display for SessionStatus {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            SessionStatus::Running => write!(f, "running"),
            SessionStatus::Completed => write!(f, "completed"),
            SessionStatus::Failed => write!(f, "failed"),
            SessionStatus::Killed => write!(f, "killed"),
        }
    }
}

impl std::str::FromStr for SessionStatus {
    type Err = String;

    fn from_str(s: &str) -> Result<Self, Self::Err> {
        match s.to_lowercase().as_str() {
            "running" | "active" | "in_progress" => Ok(SessionStatus::Running),
            "completed" | "complete" | "success" | "done" => Ok(SessionStatus::Completed),
            "failed" | "error" | "failure" => Ok(SessionStatus::Failed),
            "killed" | "terminated" | "cancelled" | "canceled" => Ok(SessionStatus::Killed),
            _ => Err(format!("Invalid session status: {}", s)),
        }
    }
}

impl TryFrom<String> for SessionStatus {
    type Error = String;

    fn try_from(s: String) -> Result<Self, Self::Error> {
        s.parse()
    }
}

impl SessionStatus {
    /// Check if the session is in a terminal state (no longer running)
    pub fn is_terminal(&self) -> bool {
        !matches!(self, SessionStatus::Running)
    }

    /// Check if the session is currently running
    pub fn is_running(&self) -> bool {
        matches!(self, SessionStatus::Running)
    }

    /// Check if the session completed successfully
    pub fn is_success(&self) -> bool {
        matches!(self, SessionStatus::Completed)
    }

    /// Check if the session failed (including killed)
    pub fn is_failure(&self) -> bool {
        matches!(self, SessionStatus::Failed | SessionStatus::Killed)
    }

    /// Check if the session was explicitly killed
    pub fn is_killed(&self) -> bool {
        matches!(self, SessionStatus::Killed)
    }

    /// Determine status from exit code
    pub fn from_exit_code(code: i32) -> Self {
        if code == 0 {
            SessionStatus::Completed
        } else {
            SessionStatus::Failed
        }
    }

    /// Get all possible status values
    pub fn all() -> &'static [SessionStatus] {
        &[
            SessionStatus::Running,
            SessionStatus::Completed,
            SessionStatus::Failed,
            SessionStatus::Killed,
        ]
    }
}

// =============================================================================
// Permission Status Enum
// =============================================================================

/// Status of a permission request
///
/// Permissions track user approval/denial for sensitive agent operations.
///
/// # Database
/// Matches CHECK constraint in permissions table (migration 014):
/// CHECK (status IN ('pending', 'approved', 'denied', 'expired', 'cancelled', 'timed_out'))
#[typeshare]
#[derive(Debug, Clone, Default, Serialize, Deserialize, PartialEq, Eq, Hash, sqlx::Type)]
#[serde(rename_all = "lowercase")]
#[sqlx(rename_all = "lowercase")]
pub enum PermissionStatus {
    /// Waiting for user response
    #[default]
    Pending,
    /// User approved the action
    Approved,
    /// User denied the action
    Denied,
    /// Permission request expired (timeout)
    Expired,
    /// Permission was cancelled (session ended before response)
    Cancelled,
    /// Permission request timed out (auto-denied after timeout_seconds)
    #[serde(rename = "timed_out")]
    #[sqlx(rename = "timed_out")]
    TimedOut,
}

impl std::fmt::Display for PermissionStatus {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            PermissionStatus::Pending => write!(f, "pending"),
            PermissionStatus::Approved => write!(f, "approved"),
            PermissionStatus::Denied => write!(f, "denied"),
            PermissionStatus::Expired => write!(f, "expired"),
            PermissionStatus::Cancelled => write!(f, "cancelled"),
            PermissionStatus::TimedOut => write!(f, "timed_out"),
        }
    }
}

impl std::str::FromStr for PermissionStatus {
    type Err = String;

    fn from_str(s: &str) -> Result<Self, Self::Err> {
        match s.to_lowercase().as_str() {
            "pending" | "waiting" => Ok(PermissionStatus::Pending),
            "approved" | "accepted" | "allowed" | "yes" => Ok(PermissionStatus::Approved),
            "denied" | "rejected" | "disallowed" | "no" => Ok(PermissionStatus::Denied),
            "expired" => Ok(PermissionStatus::Expired),
            "cancelled" | "canceled" => Ok(PermissionStatus::Cancelled),
            "timed_out" | "timeout" => Ok(PermissionStatus::TimedOut),
            _ => Err(format!("Invalid permission status: {}", s)),
        }
    }
}

impl TryFrom<String> for PermissionStatus {
    type Error = String;

    fn try_from(s: String) -> Result<Self, Self::Error> {
        s.parse()
    }
}

impl PermissionStatus {
    /// Check if the permission is still pending
    pub fn is_pending(&self) -> bool {
        matches!(self, PermissionStatus::Pending)
    }

    /// Check if the permission was granted
    pub fn is_approved(&self) -> bool {
        matches!(self, PermissionStatus::Approved)
    }

    /// Check if the permission was denied
    pub fn is_denied(&self) -> bool {
        matches!(self, PermissionStatus::Denied)
    }

    /// Check if the permission is in a terminal state
    pub fn is_terminal(&self) -> bool {
        !matches!(self, PermissionStatus::Pending)
    }

    /// Check if the permission response was positive (action can proceed)
    pub fn allows_action(&self) -> bool {
        matches!(self, PermissionStatus::Approved)
    }

    /// Get all possible status values
    pub fn all() -> &'static [PermissionStatus] {
        &[
            PermissionStatus::Pending,
            PermissionStatus::Approved,
            PermissionStatus::Denied,
            PermissionStatus::Expired,
            PermissionStatus::Cancelled,
            PermissionStatus::TimedOut,
        ]
    }
}

// =============================================================================
// Permission Entity
// =============================================================================

/// A permission request from an agent session
///
/// When agents attempt sensitive operations (file writes, shell commands),
/// they emit permission requests. The UI displays these for user approval.
///
/// # Database
/// @entity
/// @table: permissions
///
/// # Example
/// ```json
/// {
///   "id": "perm-550e8400-e29b-41d4-a716-446655440000",
///   "sessionId": "sess-660e8400-e29b-41d4-a716-446655440001",
///   "toolName": "Bash",
///   "description": "Execute shell command: rm -rf /tmp/test",
///   "filePath": "/tmp/test",
///   "status": "pending",
///   "createdAt": "2024-01-15T10:30:00Z",
///   "detectedAt": "2024-01-15T10:30:00Z",
///   "respondedAt": null,
///   "expiredAt": null,
///   "timeoutAt": "2024-01-15T10:35:00Z",
///   "timeoutSeconds": 300
/// }
/// ```
#[typeshare]
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, sqlx::FromRow)]
#[serde(rename_all = "camelCase")]
pub struct Permission {
    /// Unique identifier (UUID v4)
    pub id: String,

    /// Session ID this permission belongs to
    pub session_id: String,

    /// Name of the tool requesting permission
    pub tool_name: String,

    /// Human-readable description of the action
    pub description: String,

    /// Optional file path if operation involves a specific file
    pub file_path: Option<String>,

    /// Current status of the permission request
    pub status: PermissionStatus,

    /// When the permission was created (ISO 8601)
    pub created_at: String,

    /// When the permission prompt was detected (ISO 8601)
    pub detected_at: String,

    /// When user responded (ISO 8601), null if pending
    pub responded_at: Option<String>,

    /// When permission expired (ISO 8601), null if not expired
    pub expired_at: Option<String>,

    /// When permission will timeout (ISO 8601), null if no timeout configured
    pub timeout_at: Option<String>,

    /// Timeout duration in seconds (default: 300 = 5 minutes)
    pub timeout_seconds: i32,
}

impl Permission {
    /// Create a new pending permission request
    pub fn new(
        id: impl Into<String>,
        session_id: impl Into<String>,
        tool_name: impl Into<String>,
        description: impl Into<String>,
    ) -> Self {
        let now = chrono::Utc::now();
        let timeout_seconds = 300; // 5 minutes default
        let timeout_at = now + chrono::Duration::seconds(timeout_seconds as i64);
        
        Self {
            id: id.into(),
            session_id: session_id.into(),
            tool_name: tool_name.into(),
            description: description.into(),
            file_path: None,
            status: PermissionStatus::Pending,
            created_at: now.to_rfc3339(),
            detected_at: now.to_rfc3339(),
            responded_at: None,
            expired_at: None,
            timeout_at: Some(timeout_at.to_rfc3339()),
            timeout_seconds,
        }
    }

    /// Create with a file path
    pub fn with_file_path(mut self, path: impl Into<String>) -> Self {
        self.file_path = Some(path.into());
        self
    }

    /// Check if the permission is still awaiting response
    pub fn is_pending(&self) -> bool {
        self.status.is_pending()
    }

    /// Check if the permission was approved
    pub fn is_approved(&self) -> bool {
        self.status.is_approved()
    }

    /// Check if the permission allows the action to proceed
    pub fn allows_action(&self) -> bool {
        self.status.allows_action()
    }

    /// Check if the permission has been responded to
    pub fn has_response(&self) -> bool {
        self.responded_at.is_some()
    }

    /// Check if the permission has timed out
    pub fn is_timed_out(&self) -> bool {
        self.status == PermissionStatus::TimedOut
    }

    /// Check if the permission should timeout (timeout_at is in the past)
    pub fn should_timeout(&self) -> bool {
        if let Some(timeout_at) = &self.timeout_at {
            if let Ok(timeout_dt) = chrono::DateTime::parse_from_rfc3339(timeout_at) {
                return chrono::Utc::now() > timeout_dt;
            }
        }
        false
    }
}

impl Validate for Permission {
    fn validate(&self) -> ValidationResult<()> {
        ValidationCollector::new()
            .validate(|| validate_required_string("id", &self.id))
            .validate(|| validate_required_string("session_id", &self.session_id))
            .validate(|| validate_required_string("tool_name", &self.tool_name))
            .validate(|| validate_string_length("tool_name", &self.tool_name, Some(1), Some(100)))
            .validate(|| validate_required_string("description", &self.description))
            .validate(|| {
                validate_string_length("description", &self.description, Some(1), Some(10000))
            })
            .finish()
    }
}

// =============================================================================
// Agent Session Entity
// =============================================================================

/// An agent session representing a single CLI process run
///
/// Agent sessions track individual executions of agent CLI tools.
/// Each session is spawned with a prompt and runs until completion.
///
/// # Lifecycle
///
/// ```text
/// spawn() → Running → [events...] → Complete/Failed/Killed
/// ```
///
/// # Database
/// @entity
/// @table: agent_sessions
///
/// # Example
/// ```json
/// {
///   "id": "sess-550e8400-e29b-41d4-a716-446655440000",
///   "processId": "proc-660e8400-e29b-41d4-a716-446655440001",
///   "providerId": "claude-code",
///   "externalSessionId": "claude-abc123",
///   "status": "running",
///   "exitCode": null,
///   "startedAt": "2024-01-15T10:30:00Z",
///   "endedAt": null,
///   "createdAt": "2024-01-15T10:30:00Z",
///   "updatedAt": "2024-01-15T10:30:00Z"
/// }
/// ```
#[typeshare]
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, sqlx::FromRow)]
#[serde(rename_all = "camelCase")]
pub struct AgentSession {
    /// Unique identifier (UUID v4)
    pub id: String,

    /// Parent execution process ID (links to execution_processes table)
    pub process_id: String,

    /// Provider identifier ("claude-code", "gemini-cli", "codex-cli", "mock")
    pub provider_id: String,

    /// Provider's external session ID for resume capability
    /// (e.g., Claude's session ID that allows --resume)
    pub external_session_id: Option<String>,

    /// Current status of the session
    pub status: SessionStatus,

    /// Process exit code (only set when session ends)
    pub exit_code: Option<i32>,

    /// When the session started (ISO 8601)
    pub started_at: String,

    /// When the session ended (ISO 8601), null if still running
    pub ended_at: Option<String>,

    /// When the session was created (ISO 8601)
    pub created_at: String,

    /// When the session was last updated (ISO 8601)
    pub updated_at: String,
}

impl AgentSession {
    /// Create a new running session
    pub fn new(
        id: impl Into<String>,
        process_id: impl Into<String>,
        provider_id: impl Into<String>,
    ) -> Self {
        let now = chrono::Utc::now().to_rfc3339();
        Self {
            id: id.into(),
            process_id: process_id.into(),
            provider_id: provider_id.into(),
            external_session_id: None,
            status: SessionStatus::Running,
            exit_code: None,
            started_at: now.clone(),
            ended_at: None,
            created_at: now.clone(),
            updated_at: now,
        }
    }

    /// Set the external session ID
    pub fn with_external_session_id(mut self, external_id: impl Into<String>) -> Self {
        self.external_session_id = Some(external_id.into());
        self
    }

    /// Check if the session is still running
    pub fn is_running(&self) -> bool {
        self.status.is_running()
    }

    /// Check if the session has completed (any terminal state)
    pub fn is_completed(&self) -> bool {
        self.status.is_terminal()
    }

    /// Check if the session completed successfully
    pub fn is_success(&self) -> bool {
        self.status.is_success()
    }

    /// Check if the session failed (including killed)
    pub fn is_failure(&self) -> bool {
        self.status.is_failure()
    }

    /// Check if the session was killed
    pub fn is_killed(&self) -> bool {
        self.status.is_killed()
    }

    /// Check if the session can be resumed (has external session ID)
    pub fn can_resume(&self) -> bool {
        self.external_session_id.is_some() && !self.is_running()
    }

    /// Get the duration if the session has ended
    pub fn duration_ms(&self) -> Option<i64> {
        match (&self.started_at, &self.ended_at) {
            (start, Some(end)) => {
                let start_dt = chrono::DateTime::parse_from_rfc3339(start).ok()?;
                let end_dt = chrono::DateTime::parse_from_rfc3339(end).ok()?;
                Some((end_dt - start_dt).num_milliseconds())
            }
            _ => None,
        }
    }
}

impl Validate for AgentSession {
    fn validate(&self) -> ValidationResult<()> {
        ValidationCollector::new()
            .validate(|| validate_required_string("id", &self.id))
            .validate(|| validate_required_string("process_id", &self.process_id))
            .validate(|| validate_required_string("provider_id", &self.provider_id))
            .validate(|| {
                validate_string_length("provider_id", &self.provider_id, Some(1), Some(100))
            })
            .finish()
    }
}

// =============================================================================
// Agent Session Summary (for list views)
// =============================================================================

/// A lightweight agent session summary for UI display
///
/// Contains essential fields for displaying sessions in lists,
/// plus computed fields for progress indication.
///
/// @derived_from: AgentSession
#[typeshare]
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct AgentSessionSummary {
    /// Unique identifier
    pub id: String,

    /// Parent process ID
    pub process_id: String,

    /// Provider identifier
    pub provider_id: String,

    /// Current status
    pub status: SessionStatus,

    /// Process exit code (if completed)
    pub exit_code: Option<i32>,

    /// Number of events in this session
    pub event_count: i32,

    /// Number of tool calls in this session
    pub tool_count: i32,

    /// Whether there's a pending permission request
    pub has_pending_permission: bool,

    /// When the session started
    pub started_at: String,

    /// When the session ended (if completed)
    pub ended_at: Option<String>,
}

impl AgentSessionSummary {
    /// Create a summary from a session with counts
    pub fn from_session(
        session: &AgentSession,
        event_count: i32,
        tool_count: i32,
        has_pending_permission: bool,
    ) -> Self {
        Self {
            id: session.id.clone(),
            process_id: session.process_id.clone(),
            provider_id: session.provider_id.clone(),
            status: session.status.clone(),
            exit_code: session.exit_code,
            event_count,
            tool_count,
            has_pending_permission,
            started_at: session.started_at.clone(),
            ended_at: session.ended_at.clone(),
        }
    }

    /// Check if the session needs user attention (pending permission)
    pub fn needs_attention(&self) -> bool {
        self.has_pending_permission && self.status.is_running()
    }
}

// =============================================================================
// Agent Session With Events (for get operations)
// =============================================================================

/// Agent session with its associated events and state
///
/// Used for the `get` operation to return a session with full context.
///
/// @derived_from: AgentSession
#[typeshare]
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct AgentSessionWithState {
    /// The session data
    pub session: AgentSession,

    /// Number of events in this session
    pub event_count: i32,

    /// Number of tool calls made
    pub tool_count: i32,

    /// Number of pending tool calls (started but not completed)
    pub pending_tool_count: i32,

    /// Current pending permission request (if any)
    pub pending_permission: Option<Permission>,
}

impl AgentSessionWithState {
    /// Create from session with minimal state
    pub fn new(session: AgentSession) -> Self {
        Self {
            session,
            event_count: 0,
            tool_count: 0,
            pending_tool_count: 0,
            pending_permission: None,
        }
    }

    /// Create with counts and permission
    pub fn with_state(
        session: AgentSession,
        event_count: i32,
        tool_count: i32,
        pending_tool_count: i32,
        pending_permission: Option<Permission>,
    ) -> Self {
        Self {
            session,
            event_count,
            tool_count,
            pending_tool_count,
            pending_permission,
        }
    }

    /// Check if the session needs user attention
    pub fn needs_attention(&self) -> bool {
        self.pending_permission.is_some() && self.session.is_running()
    }

    /// Check if there are pending operations
    pub fn has_pending_work(&self) -> bool {
        self.pending_tool_count > 0 || self.pending_permission.is_some()
    }
}

// =============================================================================
// Tests
// =============================================================================

#[cfg(test)]
mod tests {
    use super::*;

    fn create_test_session() -> AgentSession {
        AgentSession {
            id: "sess-550e8400-e29b-41d4-a716-446655440000".to_string(),
            process_id: "proc-660e8400-e29b-41d4-a716-446655440001".to_string(),
            provider_id: "claude-code".to_string(),
            external_session_id: Some("claude-abc123".to_string()),
            status: SessionStatus::Running,
            exit_code: None,
            started_at: "2024-01-15T10:30:00Z".to_string(),
            ended_at: None,
            created_at: "2024-01-15T10:30:00Z".to_string(),
            updated_at: "2024-01-15T10:30:00Z".to_string(),
        }
    }

    fn create_test_permission(session_id: &str) -> Permission {
        Permission {
            id: "perm-123".to_string(),
            session_id: session_id.to_string(),
            tool_name: "Bash".to_string(),
            description: "Execute: rm -rf /tmp/test".to_string(),
            file_path: Some("/tmp/test".to_string()),
            status: PermissionStatus::Pending,
            created_at: "2024-01-15T10:30:00Z".to_string(),
            detected_at: "2024-01-15T10:30:00Z".to_string(),
            responded_at: None,
            expired_at: None,
            timeout_at: Some("2024-01-15T10:35:00Z".to_string()),
            timeout_seconds: 300,
        }
    }

    // =========================================================================
    // SessionStatus Tests
    // =========================================================================

    #[test]
    fn test_session_status_display() {
        assert_eq!(SessionStatus::Running.to_string(), "running");
        assert_eq!(SessionStatus::Completed.to_string(), "completed");
        assert_eq!(SessionStatus::Failed.to_string(), "failed");
        assert_eq!(SessionStatus::Killed.to_string(), "killed");
    }

    #[test]
    fn test_session_status_from_str() {
        assert_eq!(
            "running".parse::<SessionStatus>().unwrap(),
            SessionStatus::Running
        );
        assert_eq!(
            "completed".parse::<SessionStatus>().unwrap(),
            SessionStatus::Completed
        );
        assert_eq!(
            "failed".parse::<SessionStatus>().unwrap(),
            SessionStatus::Failed
        );
        assert_eq!(
            "killed".parse::<SessionStatus>().unwrap(),
            SessionStatus::Killed
        );

        // Aliases
        assert_eq!(
            "active".parse::<SessionStatus>().unwrap(),
            SessionStatus::Running
        );
        assert_eq!(
            "success".parse::<SessionStatus>().unwrap(),
            SessionStatus::Completed
        );
        assert_eq!(
            "error".parse::<SessionStatus>().unwrap(),
            SessionStatus::Failed
        );
        assert_eq!(
            "terminated".parse::<SessionStatus>().unwrap(),
            SessionStatus::Killed
        );
        assert_eq!(
            "cancelled".parse::<SessionStatus>().unwrap(),
            SessionStatus::Killed
        );

        assert!("invalid".parse::<SessionStatus>().is_err());
    }

    #[test]
    fn test_session_status_is_terminal() {
        assert!(!SessionStatus::Running.is_terminal());
        assert!(SessionStatus::Completed.is_terminal());
        assert!(SessionStatus::Failed.is_terminal());
        assert!(SessionStatus::Killed.is_terminal());
    }

    #[test]
    fn test_session_status_is_running() {
        assert!(SessionStatus::Running.is_running());
        assert!(!SessionStatus::Completed.is_running());
        assert!(!SessionStatus::Failed.is_running());
        assert!(!SessionStatus::Killed.is_running());
    }

    #[test]
    fn test_session_status_is_success() {
        assert!(!SessionStatus::Running.is_success());
        assert!(SessionStatus::Completed.is_success());
        assert!(!SessionStatus::Failed.is_success());
        assert!(!SessionStatus::Killed.is_success());
    }

    #[test]
    fn test_session_status_is_failure() {
        assert!(!SessionStatus::Running.is_failure());
        assert!(!SessionStatus::Completed.is_failure());
        assert!(SessionStatus::Failed.is_failure());
        assert!(SessionStatus::Killed.is_failure());
    }

    #[test]
    fn test_session_status_from_exit_code() {
        assert_eq!(SessionStatus::from_exit_code(0), SessionStatus::Completed);
        assert_eq!(SessionStatus::from_exit_code(1), SessionStatus::Failed);
        assert_eq!(SessionStatus::from_exit_code(-1), SessionStatus::Failed);
        assert_eq!(SessionStatus::from_exit_code(255), SessionStatus::Failed);
    }

    #[test]
    fn test_session_status_all() {
        let all = SessionStatus::all();
        assert_eq!(all.len(), 4);
        assert!(all.contains(&SessionStatus::Running));
        assert!(all.contains(&SessionStatus::Completed));
        assert!(all.contains(&SessionStatus::Failed));
        assert!(all.contains(&SessionStatus::Killed));
    }

    #[test]
    fn test_session_status_default() {
        assert_eq!(SessionStatus::default(), SessionStatus::Running);
    }

    #[test]
    fn test_session_status_serialization() {
        let status = SessionStatus::Completed;
        let json = serde_json::to_string(&status).unwrap();
        assert_eq!(json, "\"completed\"");

        let deserialized: SessionStatus = serde_json::from_str(&json).unwrap();
        assert_eq!(deserialized, SessionStatus::Completed);
    }

    // =========================================================================
    // PermissionStatus Tests
    // =========================================================================

    #[test]
    fn test_permission_status_display() {
        assert_eq!(PermissionStatus::Pending.to_string(), "pending");
        assert_eq!(PermissionStatus::Approved.to_string(), "approved");
        assert_eq!(PermissionStatus::Denied.to_string(), "denied");
        assert_eq!(PermissionStatus::Expired.to_string(), "expired");
        assert_eq!(PermissionStatus::Cancelled.to_string(), "cancelled");
        assert_eq!(PermissionStatus::TimedOut.to_string(), "timed_out");
    }

    #[test]
    fn test_permission_status_from_str() {
        assert_eq!(
            "pending".parse::<PermissionStatus>().unwrap(),
            PermissionStatus::Pending
        );
        assert_eq!(
            "approved".parse::<PermissionStatus>().unwrap(),
            PermissionStatus::Approved
        );
        assert_eq!(
            "denied".parse::<PermissionStatus>().unwrap(),
            PermissionStatus::Denied
        );
        assert_eq!(
            "expired".parse::<PermissionStatus>().unwrap(),
            PermissionStatus::Expired
        );
        assert_eq!(
            "cancelled".parse::<PermissionStatus>().unwrap(),
            PermissionStatus::Cancelled
        );

        // Aliases
        assert_eq!(
            "yes".parse::<PermissionStatus>().unwrap(),
            PermissionStatus::Approved
        );
        assert_eq!(
            "no".parse::<PermissionStatus>().unwrap(),
            PermissionStatus::Denied
        );
        assert_eq!(
            "timeout".parse::<PermissionStatus>().unwrap(),
            PermissionStatus::TimedOut
        );
        assert_eq!(
            "timed_out".parse::<PermissionStatus>().unwrap(),
            PermissionStatus::TimedOut
        );

        assert!("invalid".parse::<PermissionStatus>().is_err());
    }

    #[test]
    fn test_permission_status_is_pending() {
        assert!(PermissionStatus::Pending.is_pending());
        assert!(!PermissionStatus::Approved.is_pending());
        assert!(!PermissionStatus::Denied.is_pending());
    }

    #[test]
    fn test_permission_status_is_terminal() {
        assert!(!PermissionStatus::Pending.is_terminal());
        assert!(PermissionStatus::Approved.is_terminal());
        assert!(PermissionStatus::Denied.is_terminal());
        assert!(PermissionStatus::Expired.is_terminal());
        assert!(PermissionStatus::Cancelled.is_terminal());
        assert!(PermissionStatus::TimedOut.is_terminal());
    }

    #[test]
    fn test_permission_status_allows_action() {
        assert!(!PermissionStatus::Pending.allows_action());
        assert!(PermissionStatus::Approved.allows_action());
        assert!(!PermissionStatus::Denied.allows_action());
        assert!(!PermissionStatus::Expired.allows_action());
        assert!(!PermissionStatus::Cancelled.allows_action());
        assert!(!PermissionStatus::TimedOut.allows_action());
    }

    #[test]
    fn test_permission_status_all() {
        let all = PermissionStatus::all();
        assert_eq!(all.len(), 6);
    }

    #[test]
    fn test_permission_status_default() {
        assert_eq!(PermissionStatus::default(), PermissionStatus::Pending);
    }

    #[test]
    fn test_permission_status_serialization() {
        let status = PermissionStatus::Approved;
        let json = serde_json::to_string(&status).unwrap();
        assert_eq!(json, "\"approved\"");

        let deserialized: PermissionStatus = serde_json::from_str(&json).unwrap();
        assert_eq!(deserialized, PermissionStatus::Approved);

        // Test TimedOut variant
        let timed_out = PermissionStatus::TimedOut;
        let json = serde_json::to_string(&timed_out).unwrap();
        assert_eq!(json, "\"timed_out\"");

        let deserialized: PermissionStatus = serde_json::from_str(&json).unwrap();
        assert_eq!(deserialized, PermissionStatus::TimedOut);
    }

    // =========================================================================
    // Permission Entity Tests
    // =========================================================================

    #[test]
    fn test_permission_new() {
        let perm = Permission::new("perm-1", "sess-1", "Write", "Create file /tmp/test");
        assert_eq!(perm.id, "perm-1");
        assert_eq!(perm.session_id, "sess-1");
        assert_eq!(perm.tool_name, "Write");
        assert_eq!(perm.description, "Create file /tmp/test");
        assert!(perm.file_path.is_none());
        assert_eq!(perm.status, PermissionStatus::Pending);
        assert!(perm.responded_at.is_none());
        assert!(perm.expired_at.is_none());
    }

    #[test]
    fn test_permission_with_file_path() {
        let perm = Permission::new("perm-1", "sess-1", "Write", "Create file")
            .with_file_path("/tmp/test.txt");
        assert_eq!(perm.file_path, Some("/tmp/test.txt".to_string()));
    }

    #[test]
    fn test_permission_is_pending() {
        let perm = create_test_permission("sess-1");
        assert!(perm.is_pending());

        let mut approved = perm.clone();
        approved.status = PermissionStatus::Approved;
        assert!(!approved.is_pending());
    }

    #[test]
    fn test_permission_is_approved() {
        let mut perm = create_test_permission("sess-1");
        assert!(!perm.is_approved());

        perm.status = PermissionStatus::Approved;
        assert!(perm.is_approved());
    }

    #[test]
    fn test_permission_allows_action() {
        let mut perm = create_test_permission("sess-1");
        assert!(!perm.allows_action()); // pending doesn't allow

        perm.status = PermissionStatus::Approved;
        assert!(perm.allows_action());

        perm.status = PermissionStatus::Denied;
        assert!(!perm.allows_action());
    }

    #[test]
    fn test_permission_has_response() {
        let mut perm = create_test_permission("sess-1");
        assert!(!perm.has_response());

        perm.responded_at = Some("2024-01-15T10:31:00Z".to_string());
        assert!(perm.has_response());
    }

    #[test]
    fn test_permission_is_timed_out() {
        let mut perm = create_test_permission("sess-1");
        assert!(!perm.is_timed_out());

        perm.status = PermissionStatus::TimedOut;
        assert!(perm.is_timed_out());
    }

    #[test]
    fn test_permission_should_timeout() {
        let mut perm = create_test_permission("sess-1");
        
        // Timeout in the past - should timeout
        perm.timeout_at = Some("2020-01-15T10:35:00Z".to_string());
        assert!(perm.should_timeout());

        // Timeout in the future - should not timeout
        let future = chrono::Utc::now() + chrono::Duration::hours(1);
        perm.timeout_at = Some(future.to_rfc3339());
        assert!(!perm.should_timeout());

        // No timeout_at - should not timeout
        perm.timeout_at = None;
        assert!(!perm.should_timeout());
    }

    #[test]
    fn test_permission_new_has_timeout() {
        let perm = Permission::new("perm-1", "sess-1", "Write", "Create file");
        
        // Should have timeout_at set
        assert!(perm.timeout_at.is_some());
        
        // Should have timeout_seconds of 300 (5 minutes)
        assert_eq!(perm.timeout_seconds, 300);
        
        // Should have detected_at equal to created_at
        assert_eq!(perm.detected_at, perm.created_at);
    }

    #[test]
    fn test_permission_validation_valid() {
        let perm = create_test_permission("sess-1");
        assert!(perm.validate().is_ok());
    }

    #[test]
    fn test_permission_validation_empty_tool_name() {
        let mut perm = create_test_permission("sess-1");
        perm.tool_name = "".to_string();
        assert!(perm.validate().is_err());
    }

    #[test]
    fn test_permission_validation_empty_description() {
        let mut perm = create_test_permission("sess-1");
        perm.description = "".to_string();
        assert!(perm.validate().is_err());
    }

    #[test]
    fn test_permission_serialization() {
        let perm = create_test_permission("sess-1");
        let json = serde_json::to_string(&perm).unwrap();

        assert!(json.contains("\"sessionId\":\"sess-1\""));
        assert!(json.contains("\"toolName\":\"Bash\""));
        assert!(json.contains("\"status\":\"pending\""));
        assert!(json.contains("\"filePath\":\"/tmp/test\""));

        let deserialized: Permission = serde_json::from_str(&json).unwrap();
        assert_eq!(perm, deserialized);
    }

    // =========================================================================
    // AgentSession Entity Tests
    // =========================================================================

    #[test]
    fn test_agent_session_new() {
        let session = AgentSession::new("sess-1", "proc-1", "claude-code");
        assert_eq!(session.id, "sess-1");
        assert_eq!(session.process_id, "proc-1");
        assert_eq!(session.provider_id, "claude-code");
        assert!(session.external_session_id.is_none());
        assert_eq!(session.status, SessionStatus::Running);
        assert!(session.exit_code.is_none());
        assert!(session.ended_at.is_none());
    }

    #[test]
    fn test_agent_session_with_external_id() {
        let session = AgentSession::new("sess-1", "proc-1", "claude-code")
            .with_external_session_id("claude-xyz");
        assert_eq!(
            session.external_session_id,
            Some("claude-xyz".to_string())
        );
    }

    #[test]
    fn test_agent_session_is_running() {
        let session = create_test_session();
        assert!(session.is_running());

        let mut completed = session.clone();
        completed.status = SessionStatus::Completed;
        assert!(!completed.is_running());
    }

    #[test]
    fn test_agent_session_is_completed() {
        let session = create_test_session();
        assert!(!session.is_completed()); // Running is not completed

        let mut completed = session.clone();
        completed.status = SessionStatus::Completed;
        assert!(completed.is_completed());

        let mut failed = session.clone();
        failed.status = SessionStatus::Failed;
        assert!(failed.is_completed()); // Failed is terminal
    }

    #[test]
    fn test_agent_session_is_success() {
        let mut session = create_test_session();
        assert!(!session.is_success());

        session.status = SessionStatus::Completed;
        assert!(session.is_success());

        session.status = SessionStatus::Failed;
        assert!(!session.is_success());
    }

    #[test]
    fn test_agent_session_is_failure() {
        let mut session = create_test_session();
        assert!(!session.is_failure());

        session.status = SessionStatus::Failed;
        assert!(session.is_failure());

        session.status = SessionStatus::Killed;
        assert!(session.is_failure());
    }

    #[test]
    fn test_agent_session_can_resume() {
        let mut session = create_test_session();

        // Running can't resume (already running)
        assert!(!session.can_resume());

        // Completed with external ID can resume
        session.status = SessionStatus::Completed;
        assert!(session.can_resume());

        // Without external ID, can't resume
        session.external_session_id = None;
        assert!(!session.can_resume());
    }

    #[test]
    fn test_agent_session_duration_ms() {
        let mut session = create_test_session();

        // No end time, no duration
        assert!(session.duration_ms().is_none());

        // With end time
        session.ended_at = Some("2024-01-15T10:35:00Z".to_string());
        let duration = session.duration_ms();
        assert!(duration.is_some());
        assert_eq!(duration.unwrap(), 5 * 60 * 1000); // 5 minutes
    }

    #[test]
    fn test_agent_session_validation_valid() {
        let session = create_test_session();
        assert!(session.validate().is_ok());
    }

    #[test]
    fn test_agent_session_validation_empty_id() {
        let mut session = create_test_session();
        session.id = "".to_string();
        assert!(session.validate().is_err());
    }

    #[test]
    fn test_agent_session_validation_empty_provider_id() {
        let mut session = create_test_session();
        session.provider_id = "".to_string();
        assert!(session.validate().is_err());
    }

    #[test]
    fn test_agent_session_serialization() {
        let session = create_test_session();
        let json = serde_json::to_string(&session).unwrap();

        assert!(json.contains("\"processId\""));
        assert!(json.contains("\"providerId\":\"claude-code\""));
        assert!(json.contains("\"externalSessionId\":\"claude-abc123\""));
        assert!(json.contains("\"status\":\"running\""));
        assert!(json.contains("\"startedAt\""));
        assert!(json.contains("\"endedAt\":null"));

        let deserialized: AgentSession = serde_json::from_str(&json).unwrap();
        assert_eq!(session, deserialized);
    }

    // =========================================================================
    // AgentSessionSummary Tests
    // =========================================================================

    #[test]
    fn test_agent_session_summary_from_session() {
        let session = create_test_session();
        let summary = AgentSessionSummary::from_session(&session, 10, 3, true);

        assert_eq!(summary.id, session.id);
        assert_eq!(summary.process_id, session.process_id);
        assert_eq!(summary.provider_id, session.provider_id);
        assert_eq!(summary.status, session.status);
        assert_eq!(summary.event_count, 10);
        assert_eq!(summary.tool_count, 3);
        assert!(summary.has_pending_permission);
    }

    #[test]
    fn test_agent_session_summary_needs_attention() {
        let session = create_test_session();

        // Running with pending permission
        let summary = AgentSessionSummary::from_session(&session, 10, 3, true);
        assert!(summary.needs_attention());

        // Running without pending permission
        let summary = AgentSessionSummary::from_session(&session, 10, 3, false);
        assert!(!summary.needs_attention());

        // Completed with pending permission (shouldn't need attention)
        let mut completed = session.clone();
        completed.status = SessionStatus::Completed;
        let summary = AgentSessionSummary::from_session(&completed, 10, 3, true);
        assert!(!summary.needs_attention());
    }

    #[test]
    fn test_agent_session_summary_serialization() {
        let session = create_test_session();
        let summary = AgentSessionSummary::from_session(&session, 5, 2, false);

        let json = serde_json::to_string(&summary).unwrap();
        assert!(json.contains("\"eventCount\":5"));
        assert!(json.contains("\"toolCount\":2"));
        assert!(json.contains("\"hasPendingPermission\":false"));

        let deserialized: AgentSessionSummary = serde_json::from_str(&json).unwrap();
        assert_eq!(summary, deserialized);
    }

    // =========================================================================
    // AgentSessionWithState Tests
    // =========================================================================

    #[test]
    fn test_agent_session_with_state_new() {
        let session = create_test_session();
        let with_state = AgentSessionWithState::new(session.clone());

        assert_eq!(with_state.session.id, session.id);
        assert_eq!(with_state.event_count, 0);
        assert_eq!(with_state.tool_count, 0);
        assert_eq!(with_state.pending_tool_count, 0);
        assert!(with_state.pending_permission.is_none());
    }

    #[test]
    fn test_agent_session_with_state_with_state() {
        let session = create_test_session();
        let perm = create_test_permission(&session.id);
        let with_state =
            AgentSessionWithState::with_state(session.clone(), 10, 5, 2, Some(perm.clone()));

        assert_eq!(with_state.event_count, 10);
        assert_eq!(with_state.tool_count, 5);
        assert_eq!(with_state.pending_tool_count, 2);
        assert_eq!(with_state.pending_permission, Some(perm));
    }

    #[test]
    fn test_agent_session_with_state_needs_attention() {
        let session = create_test_session();
        let perm = create_test_permission(&session.id);

        // Running with permission
        let with_state =
            AgentSessionWithState::with_state(session.clone(), 10, 5, 0, Some(perm.clone()));
        assert!(with_state.needs_attention());

        // Running without permission
        let with_state = AgentSessionWithState::with_state(session.clone(), 10, 5, 0, None);
        assert!(!with_state.needs_attention());

        // Completed with permission
        let mut completed = session.clone();
        completed.status = SessionStatus::Completed;
        let with_state =
            AgentSessionWithState::with_state(completed, 10, 5, 0, Some(perm.clone()));
        assert!(!with_state.needs_attention());
    }

    #[test]
    fn test_agent_session_with_state_has_pending_work() {
        let session = create_test_session();
        let perm = create_test_permission(&session.id);

        // No pending work
        let with_state = AgentSessionWithState::with_state(session.clone(), 10, 5, 0, None);
        assert!(!with_state.has_pending_work());

        // Pending tool count
        let with_state = AgentSessionWithState::with_state(session.clone(), 10, 5, 2, None);
        assert!(with_state.has_pending_work());

        // Pending permission
        let with_state =
            AgentSessionWithState::with_state(session.clone(), 10, 5, 0, Some(perm.clone()));
        assert!(with_state.has_pending_work());
    }

    #[test]
    fn test_agent_session_with_state_serialization() {
        let session = create_test_session();
        let with_state = AgentSessionWithState::with_state(session, 10, 5, 2, None);

        let json = serde_json::to_string(&with_state).unwrap();
        assert!(json.contains("\"session\":{"));
        assert!(json.contains("\"eventCount\":10"));
        assert!(json.contains("\"toolCount\":5"));
        assert!(json.contains("\"pendingToolCount\":2"));
        assert!(json.contains("\"pendingPermission\":null"));

        let deserialized: AgentSessionWithState = serde_json::from_str(&json).unwrap();
        assert_eq!(with_state, deserialized);
    }
}
