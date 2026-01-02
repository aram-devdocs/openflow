//! Git Request Types
//!
//! Request types for git operations including worktree management,
//! diff viewing, commit history, and pull request creation.

use serde::{Deserialize, Serialize};
use typeshare::typeshare;

use crate::validation::{
    validate_required_string, validate_string_length, Validate, ValidationCollector,
    ValidationResult,
};

// =============================================================================
// Worktree Requests
// =============================================================================

/// Request to create a new git worktree
///
/// Creates an isolated working directory based on the specified branch.
/// The worktree allows parallel work on the same repository without
/// interfering with other branches or worktrees.
///
/// # Endpoint
/// @endpoint: POST /api/git/worktrees
/// @command: create_worktree
///
/// # Example
/// ```json
/// {
///   "repoPath": "/home/user/projects/my-project",
///   "branchName": "openflow/task123/main",
///   "baseBranch": "main",
///   "worktreePath": "/home/user/.openflow/worktrees/project1/task123-main"
/// }
/// ```
#[typeshare]
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct CreateWorktreeRequest {
    /// Path to the main repository
    /// @validate: required, format=path
    pub repo_path: String,

    /// Name for the new branch (e.g., "openflow/task123/main")
    /// @validate: required, min_length=1, max_length=255
    pub branch_name: String,

    /// Branch to base the new worktree on (e.g., "main")
    /// @validate: required, min_length=1, max_length=255
    pub base_branch: String,

    /// Path where the worktree will be created
    /// @validate: required, format=path
    pub worktree_path: String,
}

impl CreateWorktreeRequest {
    /// Create a new worktree request
    pub fn new(
        repo_path: impl Into<String>,
        branch_name: impl Into<String>,
        base_branch: impl Into<String>,
        worktree_path: impl Into<String>,
    ) -> Self {
        Self {
            repo_path: repo_path.into(),
            branch_name: branch_name.into(),
            base_branch: base_branch.into(),
            worktree_path: worktree_path.into(),
        }
    }
}

impl Validate for CreateWorktreeRequest {
    fn validate(&self) -> ValidationResult<()> {
        ValidationCollector::new()
            .validate(|| validate_required_string("repo_path", &self.repo_path))
            .validate(|| validate_required_string("branch_name", &self.branch_name))
            .validate(|| validate_string_length("branch_name", &self.branch_name, Some(1), Some(255)))
            .validate(|| validate_required_string("base_branch", &self.base_branch))
            .validate(|| validate_string_length("base_branch", &self.base_branch, Some(1), Some(255)))
            .validate(|| validate_required_string("worktree_path", &self.worktree_path))
            .finish()
    }
}

/// Request to delete a git worktree
///
/// Removes the worktree directory and prunes any stale references.
/// If normal removal fails, a force removal will be attempted.
///
/// # Endpoint
/// @endpoint: DELETE /api/git/worktrees/:path
/// @command: delete_worktree
///
/// # Example
/// ```json
/// {
///   "repoPath": "/home/user/projects/my-project",
///   "worktreePath": "/home/user/.openflow/worktrees/project1/task123-main",
///   "force": false
/// }
/// ```
#[typeshare]
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct DeleteWorktreeRequest {
    /// Path to the main repository
    /// @validate: required, format=path
    pub repo_path: String,

    /// Path to the worktree to delete
    /// @validate: required, format=path
    pub worktree_path: String,

    /// Force deletion even if there are uncommitted changes
    #[serde(default)]
    pub force: bool,
}

impl DeleteWorktreeRequest {
    /// Create a new delete worktree request
    pub fn new(repo_path: impl Into<String>, worktree_path: impl Into<String>) -> Self {
        Self {
            repo_path: repo_path.into(),
            worktree_path: worktree_path.into(),
            force: false,
        }
    }

    /// Set force deletion
    pub fn with_force(mut self, force: bool) -> Self {
        self.force = force;
        self
    }
}

impl Validate for DeleteWorktreeRequest {
    fn validate(&self) -> ValidationResult<()> {
        ValidationCollector::new()
            .validate(|| validate_required_string("repo_path", &self.repo_path))
            .validate(|| validate_required_string("worktree_path", &self.worktree_path))
            .finish()
    }
}

/// Request to list worktrees for a repository
///
/// # Endpoint
/// @endpoint: GET /api/git/worktrees
/// @command: list_worktrees
///
/// # Example
/// ```json
/// {
///   "repoPath": "/home/user/projects/my-project"
/// }
/// ```
#[typeshare]
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct ListWorktreesRequest {
    /// Path to the repository
    /// @validate: required, format=path
    pub repo_path: String,
}

impl ListWorktreesRequest {
    /// Create a new list worktrees request
    pub fn new(repo_path: impl Into<String>) -> Self {
        Self {
            repo_path: repo_path.into(),
        }
    }
}

impl Validate for ListWorktreesRequest {
    fn validate(&self) -> ValidationResult<()> {
        ValidationCollector::new()
            .validate(|| validate_required_string("repo_path", &self.repo_path))
            .finish()
    }
}

// =============================================================================
// Diff Requests
// =============================================================================

/// Request to get diff for a worktree or repository
///
/// Returns both staged and unstaged changes as a list of file diffs.
///
/// # Endpoint
/// @endpoint: GET /api/git/diff
/// @command: get_diff
///
/// # Example
/// ```json
/// {
///   "worktreePath": "/home/user/.openflow/worktrees/project1/task123-main",
///   "staged": false,
///   "paths": null
/// }
/// ```
#[typeshare]
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct GetDiffRequest {
    /// Path to the worktree or repository
    /// @validate: required, format=path
    pub worktree_path: String,

    /// Only show staged changes
    #[serde(default)]
    pub staged: bool,

    /// Filter to specific file paths (optional)
    pub paths: Option<Vec<String>>,
}

impl GetDiffRequest {
    /// Create a new get diff request
    pub fn new(worktree_path: impl Into<String>) -> Self {
        Self {
            worktree_path: worktree_path.into(),
            staged: false,
            paths: None,
        }
    }

    /// Set to only show staged changes
    pub fn staged_only(mut self) -> Self {
        self.staged = true;
        self
    }

    /// Filter to specific paths
    pub fn with_paths(mut self, paths: Vec<String>) -> Self {
        self.paths = Some(paths);
        self
    }
}

impl Validate for GetDiffRequest {
    fn validate(&self) -> ValidationResult<()> {
        ValidationCollector::new()
            .validate(|| validate_required_string("worktree_path", &self.worktree_path))
            .finish()
    }
}

/// Request to get diff for a task's worktree
///
/// Resolves the task's worktree path from its associated chats.
///
/// # Endpoint
/// @endpoint: GET /api/tasks/:id/diff
/// @command: get_task_diff
///
/// # Example
/// ```json
/// {
///   "taskId": "550e8400-e29b-41d4-a716-446655440000"
/// }
/// ```
#[typeshare]
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct GetTaskDiffRequest {
    /// The task identifier
    /// @validate: required, format=uuid
    pub task_id: String,
}

impl GetTaskDiffRequest {
    /// Create a new get task diff request
    pub fn new(task_id: impl Into<String>) -> Self {
        Self {
            task_id: task_id.into(),
        }
    }
}

impl Validate for GetTaskDiffRequest {
    fn validate(&self) -> ValidationResult<()> {
        ValidationCollector::new()
            .validate(|| validate_required_string("task_id", &self.task_id))
            .finish()
    }
}

// =============================================================================
// Commit Requests
// =============================================================================

/// Request to get commits for a worktree or repository
///
/// Returns the commit history starting from HEAD, ordered most recent first.
///
/// # Endpoint
/// @endpoint: GET /api/git/commits
/// @command: get_commits
///
/// # Example
/// ```json
/// {
///   "worktreePath": "/home/user/.openflow/worktrees/project1/task123-main",
///   "limit": 50,
///   "skip": 0
/// }
/// ```
#[typeshare]
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct GetCommitsRequest {
    /// Path to the worktree or repository
    /// @validate: required, format=path
    pub worktree_path: String,

    /// Maximum number of commits to return (default: 50)
    pub limit: Option<i32>,

    /// Number of commits to skip (for pagination)
    pub skip: Option<i32>,

    /// Branch or ref to get commits from (defaults to HEAD)
    pub ref_name: Option<String>,
}

impl GetCommitsRequest {
    /// Create a new get commits request
    pub fn new(worktree_path: impl Into<String>) -> Self {
        Self {
            worktree_path: worktree_path.into(),
            limit: None,
            skip: None,
            ref_name: None,
        }
    }

    /// Set the maximum number of commits to return
    pub fn with_limit(mut self, limit: i32) -> Self {
        self.limit = Some(limit);
        self
    }

    /// Set the number of commits to skip
    pub fn with_skip(mut self, skip: i32) -> Self {
        self.skip = Some(skip);
        self
    }

    /// Set the ref to get commits from
    pub fn from_ref(mut self, ref_name: impl Into<String>) -> Self {
        self.ref_name = Some(ref_name.into());
        self
    }
}

impl Validate for GetCommitsRequest {
    fn validate(&self) -> ValidationResult<()> {
        ValidationCollector::new()
            .validate(|| validate_required_string("worktree_path", &self.worktree_path))
            .finish()
    }
}

/// Request to get commits for a task's worktree
///
/// # Endpoint
/// @endpoint: GET /api/tasks/:id/commits
/// @command: get_task_commits
///
/// # Example
/// ```json
/// {
///   "taskId": "550e8400-e29b-41d4-a716-446655440000",
///   "limit": 50
/// }
/// ```
#[typeshare]
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct GetTaskCommitsRequest {
    /// The task identifier
    /// @validate: required, format=uuid
    pub task_id: String,

    /// Maximum number of commits to return (default: 50)
    pub limit: Option<i32>,
}

impl GetTaskCommitsRequest {
    /// Create a new get task commits request
    pub fn new(task_id: impl Into<String>) -> Self {
        Self {
            task_id: task_id.into(),
            limit: None,
        }
    }

    /// Set the maximum number of commits to return
    pub fn with_limit(mut self, limit: i32) -> Self {
        self.limit = Some(limit);
        self
    }
}

impl Validate for GetTaskCommitsRequest {
    fn validate(&self) -> ValidationResult<()> {
        ValidationCollector::new()
            .validate(|| validate_required_string("task_id", &self.task_id))
            .finish()
    }
}

// =============================================================================
// Branch Requests
// =============================================================================

/// Request to push a branch to a remote repository
///
/// Pushes the current branch in the worktree to the specified remote
/// with upstream tracking configured.
///
/// # Endpoint
/// @endpoint: POST /api/git/push
/// @command: push_branch
///
/// # Example
/// ```json
/// {
///   "worktreePath": "/home/user/.openflow/worktrees/project1/task123-main",
///   "remote": "origin",
///   "force": false
/// }
/// ```
#[typeshare]
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct PushBranchRequest {
    /// Path to the worktree
    /// @validate: required, format=path
    pub worktree_path: String,

    /// Remote name (default: "origin")
    pub remote: Option<String>,

    /// Force push (use with caution)
    #[serde(default)]
    pub force: bool,

    /// Set upstream tracking
    #[serde(default = "default_true")]
    pub set_upstream: bool,
}

fn default_true() -> bool {
    true
}

impl PushBranchRequest {
    /// Create a new push branch request
    pub fn new(worktree_path: impl Into<String>) -> Self {
        Self {
            worktree_path: worktree_path.into(),
            remote: None,
            force: false,
            set_upstream: true,
        }
    }

    /// Set the remote name
    pub fn to_remote(mut self, remote: impl Into<String>) -> Self {
        self.remote = Some(remote.into());
        self
    }

    /// Enable force push
    pub fn force_push(mut self) -> Self {
        self.force = true;
        self
    }

    /// Disable upstream tracking
    pub fn without_upstream(mut self) -> Self {
        self.set_upstream = false;
        self
    }
}

impl Validate for PushBranchRequest {
    fn validate(&self) -> ValidationResult<()> {
        ValidationCollector::new()
            .validate(|| validate_required_string("worktree_path", &self.worktree_path))
            .finish()
    }
}

/// Request to get the current branch name
///
/// # Endpoint
/// @endpoint: GET /api/git/branch
/// @command: get_current_branch
///
/// # Example
/// ```json
/// {
///   "worktreePath": "/home/user/.openflow/worktrees/project1/task123-main"
/// }
/// ```
#[typeshare]
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct GetCurrentBranchRequest {
    /// Path to the worktree
    /// @validate: required, format=path
    pub worktree_path: String,
}

impl GetCurrentBranchRequest {
    /// Create a new get current branch request
    pub fn new(worktree_path: impl Into<String>) -> Self {
        Self {
            worktree_path: worktree_path.into(),
        }
    }
}

impl Validate for GetCurrentBranchRequest {
    fn validate(&self) -> ValidationResult<()> {
        ValidationCollector::new()
            .validate(|| validate_required_string("worktree_path", &self.worktree_path))
            .finish()
    }
}

/// Request to get the HEAD commit hash
///
/// # Endpoint
/// @endpoint: GET /api/git/head
/// @command: get_head_commit
///
/// # Example
/// ```json
/// {
///   "worktreePath": "/home/user/.openflow/worktrees/project1/task123-main"
/// }
/// ```
#[typeshare]
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct GetHeadCommitRequest {
    /// Path to the worktree
    /// @validate: required, format=path
    pub worktree_path: String,
}

impl GetHeadCommitRequest {
    /// Create a new get head commit request
    pub fn new(worktree_path: impl Into<String>) -> Self {
        Self {
            worktree_path: worktree_path.into(),
        }
    }
}

impl Validate for GetHeadCommitRequest {
    fn validate(&self) -> ValidationResult<()> {
        ValidationCollector::new()
            .validate(|| validate_required_string("worktree_path", &self.worktree_path))
            .finish()
    }
}

/// Request to check for uncommitted changes
///
/// # Endpoint
/// @endpoint: GET /api/git/status
/// @command: has_uncommitted_changes
///
/// # Example
/// ```json
/// {
///   "worktreePath": "/home/user/.openflow/worktrees/project1/task123-main"
/// }
/// ```
#[typeshare]
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct HasUncommittedChangesRequest {
    /// Path to the worktree
    /// @validate: required, format=path
    pub worktree_path: String,
}

impl HasUncommittedChangesRequest {
    /// Create a new has uncommitted changes request
    pub fn new(worktree_path: impl Into<String>) -> Self {
        Self {
            worktree_path: worktree_path.into(),
        }
    }
}

impl Validate for HasUncommittedChangesRequest {
    fn validate(&self) -> ValidationResult<()> {
        ValidationCollector::new()
            .validate(|| validate_required_string("worktree_path", &self.worktree_path))
            .finish()
    }
}

// =============================================================================
// Branch Name Generation
// =============================================================================

/// Request to generate a branch name following OpenFlow conventions
///
/// Format: `openflow/{task_id}/{chat_role}`
///
/// # Endpoint
/// @endpoint: GET /api/git/generate-branch-name
/// @command: generate_branch_name
///
/// # Example
/// ```json
/// {
///   "taskId": "task123",
///   "chatRole": "main"
/// }
/// ```
#[typeshare]
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct GenerateBranchNameRequest {
    /// The task identifier
    /// @validate: required, min_length=1
    pub task_id: String,

    /// The chat role (e.g., "main", "review", "test")
    /// @validate: required, min_length=1
    pub chat_role: String,
}

impl GenerateBranchNameRequest {
    /// Create a new generate branch name request
    pub fn new(task_id: impl Into<String>, chat_role: impl Into<String>) -> Self {
        Self {
            task_id: task_id.into(),
            chat_role: chat_role.into(),
        }
    }
}

impl Validate for GenerateBranchNameRequest {
    fn validate(&self) -> ValidationResult<()> {
        ValidationCollector::new()
            .validate(|| validate_required_string("task_id", &self.task_id))
            .validate(|| validate_required_string("chat_role", &self.chat_role))
            .finish()
    }
}

/// Request to generate a worktree path following OpenFlow conventions
///
/// Format: `{base_path}/{project_id}/{task_id}-{chat_role}`
///
/// # Endpoint
/// @endpoint: GET /api/git/generate-worktree-path
/// @command: generate_worktree_path
///
/// # Example
/// ```json
/// {
///   "basePath": "~/.openflow/worktrees",
///   "projectId": "project1",
///   "taskId": "task123",
///   "chatRole": "main"
/// }
/// ```
#[typeshare]
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct GenerateWorktreePathRequest {
    /// Base directory for worktrees (e.g., "~/.openflow/worktrees")
    /// @validate: required
    pub base_path: String,

    /// The project identifier
    /// @validate: required
    pub project_id: String,

    /// The task identifier
    /// @validate: required
    pub task_id: String,

    /// The chat role (e.g., "main", "review", "test")
    /// @validate: required
    pub chat_role: String,
}

impl GenerateWorktreePathRequest {
    /// Create a new generate worktree path request
    pub fn new(
        base_path: impl Into<String>,
        project_id: impl Into<String>,
        task_id: impl Into<String>,
        chat_role: impl Into<String>,
    ) -> Self {
        Self {
            base_path: base_path.into(),
            project_id: project_id.into(),
            task_id: task_id.into(),
            chat_role: chat_role.into(),
        }
    }
}

impl Validate for GenerateWorktreePathRequest {
    fn validate(&self) -> ValidationResult<()> {
        ValidationCollector::new()
            .validate(|| validate_required_string("base_path", &self.base_path))
            .validate(|| validate_required_string("project_id", &self.project_id))
            .validate(|| validate_required_string("task_id", &self.task_id))
            .validate(|| validate_required_string("chat_role", &self.chat_role))
            .finish()
    }
}

// =============================================================================
// Pull Request Requests
// =============================================================================

/// Request to create a pull request for a task
///
/// Uses the GitHub CLI to create a PR from the task's worktree branch.
///
/// # Endpoint
/// @endpoint: POST /api/github/pull-requests
/// @command: create_pull_request
///
/// # Example
/// ```json
/// {
///   "taskId": "550e8400-e29b-41d4-a716-446655440000",
///   "title": "Add new feature",
///   "body": "This PR adds a new feature...",
///   "base": "main",
///   "draft": false
/// }
/// ```
#[typeshare]
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct CreatePullRequestRequest {
    /// The task ID to create a PR for
    /// @validate: required, format=uuid
    pub task_id: String,

    /// PR title (defaults to task title if not provided)
    /// @validate: max_length=255
    pub title: Option<String>,

    /// PR body/description
    /// @validate: max_length=65535
    pub body: Option<String>,

    /// Base branch to merge into (defaults to project's base_branch or "main")
    /// @validate: max_length=255
    pub base: Option<String>,

    /// Whether to create as a draft PR
    #[serde(default)]
    pub draft: bool,
}

impl CreatePullRequestRequest {
    /// Create a new create pull request request
    pub fn new(task_id: impl Into<String>) -> Self {
        Self {
            task_id: task_id.into(),
            title: None,
            body: None,
            base: None,
            draft: false,
        }
    }

    /// Set the PR title
    pub fn with_title(mut self, title: impl Into<String>) -> Self {
        self.title = Some(title.into());
        self
    }

    /// Set the PR body
    pub fn with_body(mut self, body: impl Into<String>) -> Self {
        self.body = Some(body.into());
        self
    }

    /// Set the base branch
    pub fn into_branch(mut self, base: impl Into<String>) -> Self {
        self.base = Some(base.into());
        self
    }

    /// Create as a draft PR
    pub fn as_draft(mut self) -> Self {
        self.draft = true;
        self
    }
}

impl Validate for CreatePullRequestRequest {
    fn validate(&self) -> ValidationResult<()> {
        ValidationCollector::new()
            .validate(|| validate_required_string("task_id", &self.task_id))
            .validate(|| {
                if let Some(ref title) = self.title {
                    validate_string_length("title", title, None, Some(255))
                } else {
                    Ok(())
                }
            })
            .validate(|| {
                if let Some(ref body) = self.body {
                    validate_string_length("body", body, None, Some(65535))
                } else {
                    Ok(())
                }
            })
            .validate(|| {
                if let Some(ref base) = self.base {
                    validate_string_length("base", base, None, Some(255))
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
    // CreateWorktreeRequest Tests
    // =========================================================================

    #[test]
    fn test_create_worktree_request_new() {
        let request = CreateWorktreeRequest::new(
            "/repo",
            "openflow/task123/main",
            "main",
            "/worktrees/task123",
        );

        assert_eq!(request.repo_path, "/repo");
        assert_eq!(request.branch_name, "openflow/task123/main");
        assert_eq!(request.base_branch, "main");
        assert_eq!(request.worktree_path, "/worktrees/task123");
    }

    #[test]
    fn test_create_worktree_request_validation() {
        let valid = CreateWorktreeRequest::new("/repo", "branch", "main", "/path");
        assert!(valid.validate().is_ok());

        let empty_repo = CreateWorktreeRequest::new("", "branch", "main", "/path");
        assert!(empty_repo.validate().is_err());

        let empty_branch = CreateWorktreeRequest::new("/repo", "", "main", "/path");
        assert!(empty_branch.validate().is_err());
    }

    // =========================================================================
    // DeleteWorktreeRequest Tests
    // =========================================================================

    #[test]
    fn test_delete_worktree_request() {
        let request = DeleteWorktreeRequest::new("/repo", "/worktree").with_force(true);
        assert_eq!(request.repo_path, "/repo");
        assert_eq!(request.worktree_path, "/worktree");
        assert!(request.force);
    }

    // =========================================================================
    // GetDiffRequest Tests
    // =========================================================================

    #[test]
    fn test_get_diff_request() {
        let request = GetDiffRequest::new("/worktree")
            .staged_only()
            .with_paths(vec!["src/main.rs".to_string()]);

        assert_eq!(request.worktree_path, "/worktree");
        assert!(request.staged);
        assert_eq!(request.paths, Some(vec!["src/main.rs".to_string()]));
    }

    // =========================================================================
    // GetCommitsRequest Tests
    // =========================================================================

    #[test]
    fn test_get_commits_request() {
        let request = GetCommitsRequest::new("/worktree")
            .with_limit(100)
            .with_skip(10)
            .from_ref("feature-branch");

        assert_eq!(request.limit, Some(100));
        assert_eq!(request.skip, Some(10));
        assert_eq!(request.ref_name, Some("feature-branch".to_string()));
    }

    // =========================================================================
    // PushBranchRequest Tests
    // =========================================================================

    #[test]
    fn test_push_branch_request() {
        let request = PushBranchRequest::new("/worktree")
            .to_remote("upstream")
            .force_push()
            .without_upstream();

        assert_eq!(request.remote, Some("upstream".to_string()));
        assert!(request.force);
        assert!(!request.set_upstream);
    }

    #[test]
    fn test_push_branch_request_defaults() {
        let request = PushBranchRequest::new("/worktree");
        assert!(request.remote.is_none());
        assert!(!request.force);
        assert!(request.set_upstream);
    }

    // =========================================================================
    // GenerateBranchNameRequest Tests
    // =========================================================================

    #[test]
    fn test_generate_branch_name_request() {
        let request = GenerateBranchNameRequest::new("task123", "main");
        assert_eq!(request.task_id, "task123");
        assert_eq!(request.chat_role, "main");
    }

    #[test]
    fn test_generate_branch_name_validation() {
        let valid = GenerateBranchNameRequest::new("task123", "main");
        assert!(valid.validate().is_ok());

        let empty_task = GenerateBranchNameRequest::new("", "main");
        assert!(empty_task.validate().is_err());

        let empty_role = GenerateBranchNameRequest::new("task123", "");
        assert!(empty_role.validate().is_err());
    }

    // =========================================================================
    // CreatePullRequestRequest Tests
    // =========================================================================

    #[test]
    fn test_create_pull_request_request() {
        let request = CreatePullRequestRequest::new("task-uuid")
            .with_title("Add feature")
            .with_body("This PR adds...")
            .into_branch("develop")
            .as_draft();

        assert_eq!(request.task_id, "task-uuid");
        assert_eq!(request.title, Some("Add feature".to_string()));
        assert_eq!(request.body, Some("This PR adds...".to_string()));
        assert_eq!(request.base, Some("develop".to_string()));
        assert!(request.draft);
    }

    #[test]
    fn test_create_pull_request_validation() {
        let valid = CreatePullRequestRequest::new("task-uuid");
        assert!(valid.validate().is_ok());

        let empty_task = CreatePullRequestRequest {
            task_id: "".to_string(),
            ..CreatePullRequestRequest::new("")
        };
        assert!(empty_task.validate().is_err());

        // Title too long
        let long_title = CreatePullRequestRequest::new("task")
            .with_title("x".repeat(256));
        assert!(long_title.validate().is_err());
    }

    // =========================================================================
    // Serialization Tests
    // =========================================================================

    #[test]
    fn test_create_worktree_serialization() {
        let request = CreateWorktreeRequest::new(
            "/repo",
            "openflow/task123/main",
            "main",
            "/worktrees/task123",
        );

        let json = serde_json::to_string(&request).unwrap();
        assert!(json.contains("\"repoPath\":\"/repo\""));
        assert!(json.contains("\"branchName\":\"openflow/task123/main\""));
        assert!(json.contains("\"baseBranch\":\"main\""));
        assert!(json.contains("\"worktreePath\":\"/worktrees/task123\""));

        let deserialized: CreateWorktreeRequest = serde_json::from_str(&json).unwrap();
        assert_eq!(request, deserialized);
    }

    #[test]
    fn test_push_branch_serialization() {
        let request = PushBranchRequest::new("/worktree").to_remote("origin");
        let json = serde_json::to_string(&request).unwrap();

        // Check default values
        assert!(json.contains("\"setUpstream\":true"));
        assert!(json.contains("\"force\":false"));

        let deserialized: PushBranchRequest = serde_json::from_str(&json).unwrap();
        assert_eq!(request, deserialized);
    }

    #[test]
    fn test_create_pull_request_serialization() {
        let request = CreatePullRequestRequest::new("task-uuid")
            .with_title("Feature")
            .as_draft();

        let json = serde_json::to_string(&request).unwrap();
        assert!(json.contains("\"taskId\":\"task-uuid\""));
        assert!(json.contains("\"title\":\"Feature\""));
        assert!(json.contains("\"draft\":true"));

        let deserialized: CreatePullRequestRequest = serde_json::from_str(&json).unwrap();
        assert_eq!(request, deserialized);
    }
}
