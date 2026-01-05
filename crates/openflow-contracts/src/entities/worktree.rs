//! Database Worktree Entity Types
//!
//! Types for tracking git worktrees in the database for parallel task execution.
//! These are distinct from the `git.rs` worktree types which represent
//! the output of git commands.
//!
//! # Database vs Git Types
//!
//! - `DbWorktree` - Database record tracking worktree lifecycle
//! - `Worktree` (from git.rs) - Git command output representation
//!
//! The database types track ownership (project_id), lifecycle (status, timestamps),
//! while the git types represent the current filesystem state.

use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use typeshare::typeshare;

// =============================================================================
// Status Enum
// =============================================================================

/// Status of a worktree in the database.
///
/// Tracks the lifecycle of a worktree from creation through merge or deletion.
#[typeshare]
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize, sqlx::Type, Default)]
#[serde(rename_all = "snake_case")]
#[sqlx(type_name = "TEXT", rename_all = "snake_case")]
pub enum DbWorktreeStatus {
    /// Worktree is active and in use
    #[default]
    Active,
    /// Worktree has been merged back to base branch
    Merged,
    /// Worktree has been deleted
    Deleted,
    /// Worktree has merge conflicts that need resolution
    Conflict,
}

impl DbWorktreeStatus {
    /// Check if the worktree is still active
    pub fn is_active(&self) -> bool {
        matches!(self, Self::Active)
    }

    /// Check if the worktree is in a terminal state (merged or deleted)
    pub fn is_terminal(&self) -> bool {
        matches!(self, Self::Merged | Self::Deleted)
    }

    /// Check if the worktree has merge conflicts
    pub fn has_conflicts(&self) -> bool {
        matches!(self, Self::Conflict)
    }

    /// Check if the worktree can be worked on
    pub fn is_workable(&self) -> bool {
        matches!(self, Self::Active | Self::Conflict)
    }
}

impl std::fmt::Display for DbWorktreeStatus {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            Self::Active => write!(f, "active"),
            Self::Merged => write!(f, "merged"),
            Self::Deleted => write!(f, "deleted"),
            Self::Conflict => write!(f, "conflict"),
        }
    }
}

impl std::str::FromStr for DbWorktreeStatus {
    type Err = String;

    fn from_str(s: &str) -> Result<Self, Self::Err> {
        match s.to_lowercase().as_str() {
            "active" => Ok(Self::Active),
            "merged" => Ok(Self::Merged),
            "deleted" => Ok(Self::Deleted),
            "conflict" => Ok(Self::Conflict),
            _ => Err(format!("Invalid worktree status: {}", s)),
        }
    }
}

// =============================================================================
// Entity Types
// =============================================================================

/// A database worktree record.
///
/// Represents a git worktree tracked in the database for parallel task execution.
/// Each worktree provides an isolated working directory with its own branch,
/// allowing multiple agents to work on the same codebase simultaneously.
///
/// # Example
/// ```json
/// {
///   "id": "wt-abc123",
///   "projectId": "proj-xyz",
///   "branchName": "openflow/task1/step-0",
///   "path": "/Users/dev/.openflow/worktrees/proj-xyz/task1-step-0",
///   "status": "active",
///   "createdAt": "2024-01-15T10:00:00.000Z",
///   "updatedAt": "2024-01-15T10:00:00.000Z",
///   "mergedAt": null,
///   "deletedAt": null
/// }
/// ```
#[typeshare]
#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
#[serde(rename_all = "camelCase")]
pub struct DbWorktree {
    /// Unique identifier
    pub id: String,

    /// ID of the project this worktree belongs to
    pub project_id: String,

    /// Git branch name for this worktree (e.g., "openflow/task123/step-0")
    pub branch_name: String,

    /// Absolute filesystem path to worktree directory
    pub path: String,

    /// Current lifecycle status
    pub status: DbWorktreeStatus,

    /// When the worktree was created (ISO 8601)
    pub created_at: String,

    /// When the worktree was last updated (ISO 8601)
    pub updated_at: String,

    /// When the worktree was merged, if merged (ISO 8601)
    pub merged_at: Option<String>,

    /// When the worktree was deleted, if deleted (ISO 8601)
    pub deleted_at: Option<String>,
}

impl DbWorktree {
    /// Create a new worktree entity (for testing)
    pub fn new(
        id: impl Into<String>,
        project_id: impl Into<String>,
        branch_name: impl Into<String>,
        path: impl Into<String>,
    ) -> Self {
        Self {
            id: id.into(),
            project_id: project_id.into(),
            branch_name: branch_name.into(),
            path: path.into(),
            status: DbWorktreeStatus::Active,
            created_at: String::new(),
            updated_at: String::new(),
            merged_at: None,
            deleted_at: None,
        }
    }

    /// Check if the worktree is active
    pub fn is_active(&self) -> bool {
        self.status.is_active()
    }

    /// Check if the worktree can be merged
    pub fn can_merge(&self) -> bool {
        self.status.is_active()
    }

    /// Check if the worktree can be deleted
    pub fn can_delete(&self) -> bool {
        matches!(
            self.status,
            DbWorktreeStatus::Active | DbWorktreeStatus::Merged | DbWorktreeStatus::Conflict
        )
    }

    /// Check if the worktree is in a terminal state
    pub fn is_terminal(&self) -> bool {
        self.status.is_terminal()
    }

    /// Extract task ID from branch name if it follows OpenFlow convention
    ///
    /// Format: openflow/{task_id}/step-{index}
    pub fn get_task_id(&self) -> Option<&str> {
        if !self.branch_name.starts_with("openflow/") {
            return None;
        }
        let parts: Vec<&str> = self.branch_name.split('/').collect();
        if parts.len() >= 2 {
            Some(parts[1])
        } else {
            None
        }
    }

    /// Extract step index from branch name if it follows OpenFlow convention
    ///
    /// Format: openflow/{task_id}/step-{index}
    pub fn get_step_index(&self) -> Option<i32> {
        let parts: Vec<&str> = self.branch_name.split('/').collect();
        if parts.len() >= 3 {
            parts[2]
                .strip_prefix("step-")
                .and_then(|s| s.parse().ok())
        } else {
            None
        }
    }
}

/// Lightweight worktree summary for list views.
///
/// Contains minimal information needed for displaying worktrees in lists.
#[typeshare]
#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
#[serde(rename_all = "camelCase")]
pub struct DbWorktreeSummary {
    /// Unique identifier
    pub id: String,

    /// Git branch name
    pub branch_name: String,

    /// Filesystem path
    pub path: String,

    /// Current status
    pub status: DbWorktreeStatus,

    /// When merged (if applicable)
    pub merged_at: Option<String>,
}

impl From<DbWorktree> for DbWorktreeSummary {
    fn from(wt: DbWorktree) -> Self {
        Self {
            id: wt.id,
            branch_name: wt.branch_name,
            path: wt.path,
            status: wt.status,
            merged_at: wt.merged_at,
        }
    }
}

impl From<&DbWorktree> for DbWorktreeSummary {
    fn from(wt: &DbWorktree) -> Self {
        Self {
            id: wt.id.clone(),
            branch_name: wt.branch_name.clone(),
            path: wt.path.clone(),
            status: wt.status,
            merged_at: wt.merged_at.clone(),
        }
    }
}

// =============================================================================
// Tests
// =============================================================================

#[cfg(test)]
mod tests {
    use super::*;

    // =========================================================================
    // Status Tests
    // =========================================================================

    #[test]
    fn test_status_is_active() {
        assert!(DbWorktreeStatus::Active.is_active());
        assert!(!DbWorktreeStatus::Merged.is_active());
        assert!(!DbWorktreeStatus::Deleted.is_active());
        assert!(!DbWorktreeStatus::Conflict.is_active());
    }

    #[test]
    fn test_status_is_terminal() {
        assert!(!DbWorktreeStatus::Active.is_terminal());
        assert!(DbWorktreeStatus::Merged.is_terminal());
        assert!(DbWorktreeStatus::Deleted.is_terminal());
        assert!(!DbWorktreeStatus::Conflict.is_terminal());
    }

    #[test]
    fn test_status_has_conflicts() {
        assert!(!DbWorktreeStatus::Active.has_conflicts());
        assert!(!DbWorktreeStatus::Merged.has_conflicts());
        assert!(!DbWorktreeStatus::Deleted.has_conflicts());
        assert!(DbWorktreeStatus::Conflict.has_conflicts());
    }

    #[test]
    fn test_status_is_workable() {
        assert!(DbWorktreeStatus::Active.is_workable());
        assert!(!DbWorktreeStatus::Merged.is_workable());
        assert!(!DbWorktreeStatus::Deleted.is_workable());
        assert!(DbWorktreeStatus::Conflict.is_workable());
    }

    #[test]
    fn test_status_default() {
        assert_eq!(DbWorktreeStatus::default(), DbWorktreeStatus::Active);
    }

    #[test]
    fn test_status_display() {
        assert_eq!(DbWorktreeStatus::Active.to_string(), "active");
        assert_eq!(DbWorktreeStatus::Merged.to_string(), "merged");
        assert_eq!(DbWorktreeStatus::Deleted.to_string(), "deleted");
        assert_eq!(DbWorktreeStatus::Conflict.to_string(), "conflict");
    }

    #[test]
    fn test_status_from_str() {
        assert_eq!(
            "active".parse::<DbWorktreeStatus>().unwrap(),
            DbWorktreeStatus::Active
        );
        assert_eq!(
            "MERGED".parse::<DbWorktreeStatus>().unwrap(),
            DbWorktreeStatus::Merged
        );
        assert_eq!(
            "Deleted".parse::<DbWorktreeStatus>().unwrap(),
            DbWorktreeStatus::Deleted
        );
        assert_eq!(
            "CONFLICT".parse::<DbWorktreeStatus>().unwrap(),
            DbWorktreeStatus::Conflict
        );
        assert!("invalid".parse::<DbWorktreeStatus>().is_err());
    }

    // =========================================================================
    // Entity Tests
    // =========================================================================

    #[test]
    fn test_worktree_new() {
        let wt = DbWorktree::new("wt-1", "proj-1", "openflow/task1/step-0", "/path/to/wt");
        assert_eq!(wt.id, "wt-1");
        assert_eq!(wt.project_id, "proj-1");
        assert_eq!(wt.branch_name, "openflow/task1/step-0");
        assert_eq!(wt.path, "/path/to/wt");
        assert_eq!(wt.status, DbWorktreeStatus::Active);
        assert!(wt.merged_at.is_none());
        assert!(wt.deleted_at.is_none());
    }

    #[test]
    fn test_worktree_is_active() {
        let mut wt = DbWorktree::new("1", "p", "b", "/p");
        assert!(wt.is_active());

        wt.status = DbWorktreeStatus::Merged;
        assert!(!wt.is_active());
    }

    #[test]
    fn test_worktree_can_merge() {
        let mut wt = DbWorktree::new("1", "p", "b", "/p");
        assert!(wt.can_merge());

        wt.status = DbWorktreeStatus::Merged;
        assert!(!wt.can_merge());

        wt.status = DbWorktreeStatus::Deleted;
        assert!(!wt.can_merge());

        wt.status = DbWorktreeStatus::Conflict;
        assert!(!wt.can_merge());
    }

    #[test]
    fn test_worktree_can_delete() {
        let mut wt = DbWorktree::new("1", "p", "b", "/p");
        assert!(wt.can_delete());

        wt.status = DbWorktreeStatus::Merged;
        assert!(wt.can_delete());

        wt.status = DbWorktreeStatus::Conflict;
        assert!(wt.can_delete());

        wt.status = DbWorktreeStatus::Deleted;
        assert!(!wt.can_delete());
    }

    #[test]
    fn test_worktree_is_terminal() {
        let mut wt = DbWorktree::new("1", "p", "b", "/p");
        assert!(!wt.is_terminal());

        wt.status = DbWorktreeStatus::Merged;
        assert!(wt.is_terminal());

        wt.status = DbWorktreeStatus::Deleted;
        assert!(wt.is_terminal());

        wt.status = DbWorktreeStatus::Conflict;
        assert!(!wt.is_terminal());
    }

    #[test]
    fn test_worktree_get_task_id() {
        let wt = DbWorktree::new("1", "p", "openflow/task123/step-0", "/p");
        assert_eq!(wt.get_task_id(), Some("task123"));

        let wt = DbWorktree::new("1", "p", "feature-branch", "/p");
        assert_eq!(wt.get_task_id(), None);

        let wt = DbWorktree::new("1", "p", "openflow/", "/p");
        assert_eq!(wt.get_task_id(), Some(""));
    }

    #[test]
    fn test_worktree_get_step_index() {
        let wt = DbWorktree::new("1", "p", "openflow/task123/step-0", "/p");
        assert_eq!(wt.get_step_index(), Some(0));

        let wt = DbWorktree::new("1", "p", "openflow/task123/step-5", "/p");
        assert_eq!(wt.get_step_index(), Some(5));

        let wt = DbWorktree::new("1", "p", "openflow/task123/main", "/p");
        assert_eq!(wt.get_step_index(), None);

        let wt = DbWorktree::new("1", "p", "feature-branch", "/p");
        assert_eq!(wt.get_step_index(), None);
    }

    // =========================================================================
    // Summary Tests
    // =========================================================================

    #[test]
    fn test_summary_from_worktree() {
        let wt = DbWorktree {
            id: "wt-1".to_string(),
            project_id: "proj-1".to_string(),
            branch_name: "test-branch".to_string(),
            path: "/path/to/wt".to_string(),
            status: DbWorktreeStatus::Active,
            created_at: "2024-01-01".to_string(),
            updated_at: "2024-01-01".to_string(),
            merged_at: None,
            deleted_at: None,
        };

        let summary = DbWorktreeSummary::from(&wt);
        assert_eq!(summary.id, "wt-1");
        assert_eq!(summary.branch_name, "test-branch");
        assert_eq!(summary.path, "/path/to/wt");
        assert_eq!(summary.status, DbWorktreeStatus::Active);
        assert!(summary.merged_at.is_none());

        let summary_owned = DbWorktreeSummary::from(wt);
        assert_eq!(summary_owned.id, "wt-1");
    }

    // =========================================================================
    // Serialization Tests
    // =========================================================================

    #[test]
    fn test_status_serialization() {
        let status = DbWorktreeStatus::Active;
        let json = serde_json::to_string(&status).unwrap();
        assert_eq!(json, "\"active\"");

        let parsed: DbWorktreeStatus = serde_json::from_str(&json).unwrap();
        assert_eq!(parsed, status);
    }

    #[test]
    fn test_worktree_serialization() {
        let wt = DbWorktree::new("wt-1", "proj-1", "test-branch", "/path");
        let json = serde_json::to_string(&wt).unwrap();

        assert!(json.contains("\"id\":\"wt-1\""));
        assert!(json.contains("\"projectId\":\"proj-1\""));
        assert!(json.contains("\"branchName\":\"test-branch\""));
        assert!(json.contains("\"status\":\"active\""));

        let parsed: DbWorktree = serde_json::from_str(&json).unwrap();
        assert_eq!(parsed.id, wt.id);
        assert_eq!(parsed.branch_name, wt.branch_name);
    }
}
