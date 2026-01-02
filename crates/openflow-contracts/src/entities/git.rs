//! Git Entity Types
//!
//! Types related to git operations including worktrees, diffs, commits, and branches.
//! These types are used for worktree management, diff viewing, and commit history.
//!
//! # Worktree Naming Convention
//! All branches created by OpenFlow follow: `openflow/{task_id}/{chat_role}`
//!
//! # Worktree Directory Structure
//! ```text
//! ~/.openflow/worktrees/
//! +-- {project_id}/
//!     +-- {task_id}-main/      # Main agent worktree
//!     +-- {task_id}-review/    # Review agent worktree
//!     +-- {task_id}-test/      # Test agent worktree
//! ```

use serde::{Deserialize, Serialize};
use typeshare::typeshare;

// =============================================================================
// Diff Types
// =============================================================================

/// Represents a hunk within a file diff.
/// A hunk is a contiguous section of changes in a file.
///
/// # Example
/// ```json
/// {
///   "oldStart": 10,
///   "oldLines": 5,
///   "newStart": 10,
///   "newLines": 8,
///   "content": "-old line\n+new line\n+another new line"
/// }
/// ```
#[typeshare]
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct DiffHunk {
    /// Starting line number in the old file
    pub old_start: i32,

    /// Number of lines in the old file
    pub old_lines: i32,

    /// Starting line number in the new file
    pub new_start: i32,

    /// Number of lines in the new file
    pub new_lines: i32,

    /// The actual diff content with +/- prefixes
    pub content: String,
}

impl DiffHunk {
    /// Create a new DiffHunk
    pub fn new(old_start: i32, old_lines: i32, new_start: i32, new_lines: i32) -> Self {
        Self {
            old_start,
            old_lines,
            new_start,
            new_lines,
            content: String::new(),
        }
    }

    /// Set the content of the hunk
    pub fn with_content(mut self, content: impl Into<String>) -> Self {
        self.content = content.into();
        self
    }

    /// Check if this is an addition-only hunk
    pub fn is_addition_only(&self) -> bool {
        self.old_lines == 0 && self.new_lines > 0
    }

    /// Check if this is a deletion-only hunk
    pub fn is_deletion_only(&self) -> bool {
        self.old_lines > 0 && self.new_lines == 0
    }
}

/// Represents the diff for a single file.
/// Contains metadata about the file change and the actual hunks of changes.
///
/// # Example
/// ```json
/// {
///   "path": "src/main.rs",
///   "oldPath": null,
///   "hunks": [...],
///   "additions": 10,
///   "deletions": 5,
///   "isBinary": false,
///   "isNew": false,
///   "isDeleted": false,
///   "isRenamed": false
/// }
/// ```
#[typeshare]
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct FileDiff {
    /// Current path of the file
    pub path: String,

    /// Previous path if file was renamed
    pub old_path: Option<String>,

    /// List of change hunks in this file
    pub hunks: Vec<DiffHunk>,

    /// Number of lines added
    pub additions: i32,

    /// Number of lines deleted
    pub deletions: i32,

    /// Whether this is a binary file (diffs not available)
    pub is_binary: bool,

    /// Whether this is a newly created file
    pub is_new: bool,

    /// Whether this file was deleted
    pub is_deleted: bool,

    /// Whether this file was renamed
    pub is_renamed: bool,
}

impl FileDiff {
    /// Create a new FileDiff for a given path
    pub fn new(path: impl Into<String>) -> Self {
        Self {
            path: path.into(),
            old_path: None,
            hunks: Vec::new(),
            additions: 0,
            deletions: 0,
            is_binary: false,
            is_new: false,
            is_deleted: false,
            is_renamed: false,
        }
    }

    /// Mark this as a new file
    pub fn as_new(mut self) -> Self {
        self.is_new = true;
        self
    }

    /// Mark this as a deleted file
    pub fn as_deleted(mut self) -> Self {
        self.is_deleted = true;
        self
    }

    /// Mark this as a renamed file with the old path
    pub fn as_renamed(mut self, old_path: impl Into<String>) -> Self {
        self.is_renamed = true;
        self.old_path = Some(old_path.into());
        self
    }

    /// Mark this as a binary file
    pub fn as_binary(mut self) -> Self {
        self.is_binary = true;
        self
    }

    /// Get the total number of lines changed
    pub fn total_changes(&self) -> i32 {
        self.additions + self.deletions
    }

    /// Check if the file has any changes
    pub fn has_changes(&self) -> bool {
        self.total_changes() > 0 || self.is_new || self.is_deleted || self.is_renamed
    }
}

/// Summary of file changes in a diff
///
/// A lighter-weight representation for displaying in lists.
#[typeshare]
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct FileDiffSummary {
    /// Current path of the file
    pub path: String,

    /// Number of lines added
    pub additions: i32,

    /// Number of lines deleted
    pub deletions: i32,

    /// Type of change
    pub change_type: FileChangeType,
}

/// Type of file change in a diff
#[typeshare]
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "snake_case")]
pub enum FileChangeType {
    Added,
    Modified,
    Deleted,
    Renamed,
    Binary,
}

impl From<&FileDiff> for FileDiffSummary {
    fn from(diff: &FileDiff) -> Self {
        let change_type = if diff.is_new {
            FileChangeType::Added
        } else if diff.is_deleted {
            FileChangeType::Deleted
        } else if diff.is_renamed {
            FileChangeType::Renamed
        } else if diff.is_binary {
            FileChangeType::Binary
        } else {
            FileChangeType::Modified
        };

        Self {
            path: diff.path.clone(),
            additions: diff.additions,
            deletions: diff.deletions,
            change_type,
        }
    }
}

// =============================================================================
// Commit Types
// =============================================================================

/// Represents a git commit.
/// Contains commit metadata and change statistics.
///
/// # Example
/// ```json
/// {
///   "hash": "abc123def456abc123def456abc123def456abc123",
///   "shortHash": "abc123d",
///   "message": "Add new feature",
///   "author": "John Doe",
///   "authorEmail": "john@example.com",
///   "date": "2024-01-15T10:30:00Z",
///   "filesChanged": 5,
///   "additions": 100,
///   "deletions": 25
/// }
/// ```
#[typeshare]
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct Commit {
    /// Full commit hash (40 characters)
    pub hash: String,

    /// Short commit hash (7 characters)
    pub short_hash: String,

    /// Commit message (first line)
    pub message: String,

    /// Author name
    pub author: String,

    /// Author email
    pub author_email: String,

    /// Commit date as ISO 8601 string
    pub date: String,

    /// Number of files changed in this commit
    pub files_changed: i32,

    /// Total lines added across all files
    pub additions: i32,

    /// Total lines deleted across all files
    pub deletions: i32,
}

impl Commit {
    /// Create a new commit with just hash information
    pub fn new(hash: impl Into<String>, short_hash: impl Into<String>) -> Self {
        Self {
            hash: hash.into(),
            short_hash: short_hash.into(),
            message: String::new(),
            author: String::new(),
            author_email: String::new(),
            date: String::new(),
            files_changed: 0,
            additions: 0,
            deletions: 0,
        }
    }

    /// Set the commit message
    pub fn with_message(mut self, message: impl Into<String>) -> Self {
        self.message = message.into();
        self
    }

    /// Set the author information
    pub fn with_author(mut self, name: impl Into<String>, email: impl Into<String>) -> Self {
        self.author = name.into();
        self.author_email = email.into();
        self
    }

    /// Set the commit date
    pub fn with_date(mut self, date: impl Into<String>) -> Self {
        self.date = date.into();
        self
    }

    /// Set the change statistics
    pub fn with_stats(mut self, files_changed: i32, additions: i32, deletions: i32) -> Self {
        self.files_changed = files_changed;
        self.additions = additions;
        self.deletions = deletions;
        self
    }

    /// Get the total number of lines changed
    pub fn total_changes(&self) -> i32 {
        self.additions + self.deletions
    }
}

/// Summary of a commit for list views
#[typeshare]
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct CommitSummary {
    /// Short commit hash (7 characters)
    pub short_hash: String,

    /// Commit message (first line)
    pub message: String,

    /// Author name
    pub author: String,

    /// Commit date as ISO 8601 string
    pub date: String,
}

impl From<&Commit> for CommitSummary {
    fn from(commit: &Commit) -> Self {
        Self {
            short_hash: commit.short_hash.clone(),
            message: commit.message.clone(),
            author: commit.author.clone(),
            date: commit.date.clone(),
        }
    }
}

impl From<Commit> for CommitSummary {
    fn from(commit: Commit) -> Self {
        Self {
            short_hash: commit.short_hash,
            message: commit.message,
            author: commit.author,
            date: commit.date,
        }
    }
}

// =============================================================================
// Worktree Types
// =============================================================================

/// Status of a git worktree
#[typeshare]
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "snake_case")]
pub enum WorktreeStatus {
    /// Worktree is active and valid
    Active,
    /// Worktree has been pruned/deleted
    Pruned,
    /// Worktree is locked (e.g., during operations)
    Locked,
}

/// Represents a git worktree
///
/// Worktrees are isolated working directories that allow parallel work
/// on the same repository without interfering with other branches.
///
/// # Example
/// ```json
/// {
///   "path": "/home/user/.openflow/worktrees/project1/task123-main",
///   "branch": "openflow/task123/main",
///   "headCommit": "abc123def456abc123def456abc123def456abc123",
///   "isMain": false,
///   "status": "active"
/// }
/// ```
#[typeshare]
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct Worktree {
    /// Absolute path to the worktree directory
    pub path: String,

    /// Name of the branch checked out in this worktree
    pub branch: String,

    /// HEAD commit hash
    pub head_commit: Option<String>,

    /// Whether this is the main worktree (the original repository)
    pub is_main: bool,

    /// Current status of the worktree
    pub status: WorktreeStatus,
}

impl Worktree {
    /// Create a new worktree
    pub fn new(path: impl Into<String>, branch: impl Into<String>) -> Self {
        Self {
            path: path.into(),
            branch: branch.into(),
            head_commit: None,
            is_main: false,
            status: WorktreeStatus::Active,
        }
    }

    /// Mark this as the main worktree
    pub fn as_main(mut self) -> Self {
        self.is_main = true;
        self
    }

    /// Set the HEAD commit
    pub fn with_head_commit(mut self, commit: impl Into<String>) -> Self {
        self.head_commit = Some(commit.into());
        self
    }

    /// Check if the worktree is an OpenFlow-managed worktree
    pub fn is_openflow_worktree(&self) -> bool {
        self.branch.starts_with("openflow/")
    }

    /// Extract the task ID from an OpenFlow branch name
    /// Format: openflow/{task_id}/{chat_role}
    pub fn get_task_id(&self) -> Option<&str> {
        if !self.is_openflow_worktree() {
            return None;
        }

        let parts: Vec<&str> = self.branch.split('/').collect();
        if parts.len() >= 2 {
            Some(parts[1])
        } else {
            None
        }
    }

    /// Extract the chat role from an OpenFlow branch name
    /// Format: openflow/{task_id}/{chat_role}
    pub fn get_chat_role(&self) -> Option<&str> {
        if !self.is_openflow_worktree() {
            return None;
        }

        let parts: Vec<&str> = self.branch.split('/').collect();
        if parts.len() >= 3 {
            Some(parts[2])
        } else {
            None
        }
    }
}

/// Summary of a worktree for list views
#[typeshare]
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct WorktreeSummary {
    /// Absolute path to the worktree directory
    pub path: String,

    /// Name of the branch checked out in this worktree
    pub branch: String,

    /// Whether this is the main worktree
    pub is_main: bool,
}

impl From<&Worktree> for WorktreeSummary {
    fn from(wt: &Worktree) -> Self {
        Self {
            path: wt.path.clone(),
            branch: wt.branch.clone(),
            is_main: wt.is_main,
        }
    }
}

impl From<Worktree> for WorktreeSummary {
    fn from(wt: Worktree) -> Self {
        Self {
            path: wt.path,
            branch: wt.branch,
            is_main: wt.is_main,
        }
    }
}

// =============================================================================
// Branch Types
// =============================================================================

/// Information about a git branch
#[typeshare]
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct Branch {
    /// Branch name
    pub name: String,

    /// Whether this is the current branch
    pub is_current: bool,

    /// Whether this branch tracks a remote branch
    pub is_remote: bool,

    /// Remote tracking branch (e.g., "origin/main")
    pub upstream: Option<String>,

    /// HEAD commit hash
    pub head_commit: Option<String>,
}

impl Branch {
    /// Create a new local branch
    pub fn local(name: impl Into<String>) -> Self {
        Self {
            name: name.into(),
            is_current: false,
            is_remote: false,
            upstream: None,
            head_commit: None,
        }
    }

    /// Create a new remote branch
    pub fn remote(name: impl Into<String>) -> Self {
        Self {
            name: name.into(),
            is_current: false,
            is_remote: true,
            upstream: None,
            head_commit: None,
        }
    }

    /// Mark this as the current branch
    pub fn as_current(mut self) -> Self {
        self.is_current = true;
        self
    }

    /// Set the upstream tracking branch
    pub fn with_upstream(mut self, upstream: impl Into<String>) -> Self {
        self.upstream = Some(upstream.into());
        self
    }

    /// Set the HEAD commit
    pub fn with_head_commit(mut self, commit: impl Into<String>) -> Self {
        self.head_commit = Some(commit.into());
        self
    }
}

// =============================================================================
// Pull Request Types
// =============================================================================

/// Result of a pull request creation operation.
///
/// # Example
/// ```json
/// {
///   "url": "https://github.com/owner/repo/pull/123",
///   "number": 123,
///   "branch": "openflow/task123/main"
/// }
/// ```
#[typeshare]
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct PullRequestResult {
    /// The URL of the created pull request.
    pub url: String,

    /// The PR number.
    pub number: u32,

    /// The branch name that was used for the PR.
    pub branch: String,
}

impl PullRequestResult {
    /// Create a new PullRequestResult
    pub fn new(url: impl Into<String>, number: u32, branch: impl Into<String>) -> Self {
        Self {
            url: url.into(),
            number,
            branch: branch.into(),
        }
    }
}

// =============================================================================
// Git Status Types
// =============================================================================

/// Status of a file in the git working tree
#[typeshare]
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "snake_case")]
pub enum GitFileStatus {
    /// File is not tracked by git
    Untracked,
    /// File is modified
    Modified,
    /// File is staged for commit
    Staged,
    /// File is both staged and has unstaged changes
    PartiallyStaged,
    /// File is deleted
    Deleted,
    /// File is renamed
    Renamed,
    /// File is copied
    Copied,
    /// File has a merge conflict
    Conflicted,
}

/// A file's status in the git working tree
#[typeshare]
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct GitStatusFile {
    /// File path relative to repository root
    pub path: String,

    /// Status of the file
    pub status: GitFileStatus,

    /// Original path if renamed or copied
    pub original_path: Option<String>,
}

impl GitStatusFile {
    /// Create a new GitStatusFile
    pub fn new(path: impl Into<String>, status: GitFileStatus) -> Self {
        Self {
            path: path.into(),
            status,
            original_path: None,
        }
    }

    /// Set the original path (for renamed/copied files)
    pub fn with_original_path(mut self, path: impl Into<String>) -> Self {
        self.original_path = Some(path.into());
        self
    }

    /// Check if the file has uncommitted changes
    pub fn has_changes(&self) -> bool {
        !matches!(self.status, GitFileStatus::Untracked)
    }

    /// Check if the file is staged
    pub fn is_staged(&self) -> bool {
        matches!(
            self.status,
            GitFileStatus::Staged | GitFileStatus::PartiallyStaged
        )
    }
}

/// Summary of git repository status
#[typeshare]
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct GitStatus {
    /// Current branch name
    pub branch: String,

    /// Whether there are uncommitted changes
    pub has_changes: bool,

    /// Number of commits ahead of upstream
    pub ahead: i32,

    /// Number of commits behind upstream
    pub behind: i32,

    /// List of changed files
    pub files: Vec<GitStatusFile>,
}

impl GitStatus {
    /// Create a new GitStatus
    pub fn new(branch: impl Into<String>) -> Self {
        Self {
            branch: branch.into(),
            has_changes: false,
            ahead: 0,
            behind: 0,
            files: Vec::new(),
        }
    }

    /// Check if the repository is clean
    pub fn is_clean(&self) -> bool {
        !self.has_changes && self.files.is_empty()
    }

    /// Check if there are conflicts
    pub fn has_conflicts(&self) -> bool {
        self.files
            .iter()
            .any(|f| matches!(f.status, GitFileStatus::Conflicted))
    }

    /// Get count of staged files
    pub fn staged_count(&self) -> usize {
        self.files.iter().filter(|f| f.is_staged()).count()
    }

    /// Get count of modified files
    pub fn modified_count(&self) -> usize {
        self.files
            .iter()
            .filter(|f| matches!(f.status, GitFileStatus::Modified))
            .count()
    }
}

// =============================================================================
// Tests
// =============================================================================

#[cfg(test)]
mod tests {
    use super::*;

    // =========================================================================
    // DiffHunk Tests
    // =========================================================================

    #[test]
    fn test_diff_hunk_new() {
        let hunk = DiffHunk::new(10, 5, 10, 8);
        assert_eq!(hunk.old_start, 10);
        assert_eq!(hunk.old_lines, 5);
        assert_eq!(hunk.new_start, 10);
        assert_eq!(hunk.new_lines, 8);
        assert!(hunk.content.is_empty());
    }

    #[test]
    fn test_diff_hunk_with_content() {
        let hunk = DiffHunk::new(1, 0, 1, 3).with_content("+line1\n+line2\n+line3");
        assert_eq!(hunk.content, "+line1\n+line2\n+line3");
    }

    #[test]
    fn test_diff_hunk_is_addition_only() {
        let hunk = DiffHunk::new(0, 0, 1, 5);
        assert!(hunk.is_addition_only());
        assert!(!hunk.is_deletion_only());
    }

    #[test]
    fn test_diff_hunk_is_deletion_only() {
        let hunk = DiffHunk::new(1, 5, 1, 0);
        assert!(hunk.is_deletion_only());
        assert!(!hunk.is_addition_only());
    }

    // =========================================================================
    // FileDiff Tests
    // =========================================================================

    #[test]
    fn test_file_diff_new() {
        let diff = FileDiff::new("src/main.rs");
        assert_eq!(diff.path, "src/main.rs");
        assert!(!diff.is_new);
        assert!(!diff.is_deleted);
        assert!(!diff.is_renamed);
        assert!(!diff.is_binary);
    }

    #[test]
    fn test_file_diff_as_new() {
        let diff = FileDiff::new("src/new.rs").as_new();
        assert!(diff.is_new);
    }

    #[test]
    fn test_file_diff_as_renamed() {
        let diff = FileDiff::new("src/new_name.rs").as_renamed("src/old_name.rs");
        assert!(diff.is_renamed);
        assert_eq!(diff.old_path, Some("src/old_name.rs".to_string()));
    }

    #[test]
    fn test_file_diff_total_changes() {
        let mut diff = FileDiff::new("src/main.rs");
        diff.additions = 10;
        diff.deletions = 5;
        assert_eq!(diff.total_changes(), 15);
    }

    #[test]
    fn test_file_diff_summary_from() {
        let mut diff = FileDiff::new("src/main.rs").as_new();
        diff.additions = 100;
        let summary: FileDiffSummary = (&diff).into();
        assert_eq!(summary.path, "src/main.rs");
        assert_eq!(summary.additions, 100);
        assert_eq!(summary.change_type, FileChangeType::Added);
    }

    // =========================================================================
    // Commit Tests
    // =========================================================================

    #[test]
    fn test_commit_new() {
        let commit = Commit::new(
            "abc123def456abc123def456abc123def456abc123",
            "abc123d",
        );
        assert_eq!(commit.hash, "abc123def456abc123def456abc123def456abc123");
        assert_eq!(commit.short_hash, "abc123d");
    }

    #[test]
    fn test_commit_builder() {
        let commit = Commit::new("abc123def456abc123def456abc123def456abc123", "abc123d")
            .with_message("Initial commit")
            .with_author("John Doe", "john@example.com")
            .with_date("2024-01-15T10:30:00Z")
            .with_stats(5, 100, 25);

        assert_eq!(commit.message, "Initial commit");
        assert_eq!(commit.author, "John Doe");
        assert_eq!(commit.author_email, "john@example.com");
        assert_eq!(commit.date, "2024-01-15T10:30:00Z");
        assert_eq!(commit.files_changed, 5);
        assert_eq!(commit.additions, 100);
        assert_eq!(commit.deletions, 25);
    }

    #[test]
    fn test_commit_total_changes() {
        let commit = Commit::new("abc123", "abc").with_stats(5, 100, 25);
        assert_eq!(commit.total_changes(), 125);
    }

    #[test]
    fn test_commit_summary_from() {
        let commit = Commit::new("abc123def456abc123def456abc123def456abc123", "abc123d")
            .with_message("Add feature")
            .with_author("Jane Doe", "jane@example.com")
            .with_date("2024-01-16T14:00:00Z");

        let summary: CommitSummary = commit.into();
        assert_eq!(summary.short_hash, "abc123d");
        assert_eq!(summary.message, "Add feature");
        assert_eq!(summary.author, "Jane Doe");
    }

    // =========================================================================
    // Worktree Tests
    // =========================================================================

    #[test]
    fn test_worktree_new() {
        let wt = Worktree::new("/path/to/worktree", "feature-branch");
        assert_eq!(wt.path, "/path/to/worktree");
        assert_eq!(wt.branch, "feature-branch");
        assert!(!wt.is_main);
        assert_eq!(wt.status, WorktreeStatus::Active);
    }

    #[test]
    fn test_worktree_as_main() {
        let wt = Worktree::new("/repo", "main").as_main();
        assert!(wt.is_main);
    }

    #[test]
    fn test_worktree_is_openflow_worktree() {
        let wt = Worktree::new("/path", "openflow/task123/main");
        assert!(wt.is_openflow_worktree());

        let wt = Worktree::new("/path", "feature-branch");
        assert!(!wt.is_openflow_worktree());
    }

    #[test]
    fn test_worktree_get_task_id() {
        let wt = Worktree::new("/path", "openflow/task123/main");
        assert_eq!(wt.get_task_id(), Some("task123"));

        let wt = Worktree::new("/path", "feature-branch");
        assert_eq!(wt.get_task_id(), None);
    }

    #[test]
    fn test_worktree_get_chat_role() {
        let wt = Worktree::new("/path", "openflow/task123/review");
        assert_eq!(wt.get_chat_role(), Some("review"));

        let wt = Worktree::new("/path", "openflow/task123");
        assert_eq!(wt.get_chat_role(), None);
    }

    // =========================================================================
    // Branch Tests
    // =========================================================================

    #[test]
    fn test_branch_local() {
        let branch = Branch::local("feature-x");
        assert_eq!(branch.name, "feature-x");
        assert!(!branch.is_remote);
        assert!(!branch.is_current);
    }

    #[test]
    fn test_branch_remote() {
        let branch = Branch::remote("origin/main");
        assert!(branch.is_remote);
    }

    #[test]
    fn test_branch_as_current() {
        let branch = Branch::local("main").as_current();
        assert!(branch.is_current);
    }

    // =========================================================================
    // PullRequestResult Tests
    // =========================================================================

    #[test]
    fn test_pull_request_result_new() {
        let pr = PullRequestResult::new(
            "https://github.com/owner/repo/pull/42",
            42,
            "feature-branch",
        );
        assert_eq!(pr.url, "https://github.com/owner/repo/pull/42");
        assert_eq!(pr.number, 42);
        assert_eq!(pr.branch, "feature-branch");
    }

    // =========================================================================
    // GitStatus Tests
    // =========================================================================

    #[test]
    fn test_git_status_new() {
        let status = GitStatus::new("main");
        assert_eq!(status.branch, "main");
        assert!(!status.has_changes);
        assert!(status.is_clean());
    }

    #[test]
    fn test_git_status_file() {
        let file = GitStatusFile::new("src/main.rs", GitFileStatus::Modified);
        assert_eq!(file.path, "src/main.rs");
        assert!(file.has_changes());
        assert!(!file.is_staged());
    }

    #[test]
    fn test_git_status_file_staged() {
        let file = GitStatusFile::new("src/main.rs", GitFileStatus::Staged);
        assert!(file.is_staged());
    }

    #[test]
    fn test_git_status_has_conflicts() {
        let mut status = GitStatus::new("main");
        status.files.push(GitStatusFile::new("src/conflict.rs", GitFileStatus::Conflicted));
        assert!(status.has_conflicts());
    }

    // =========================================================================
    // Serialization Tests
    // =========================================================================

    #[test]
    fn test_commit_serialization() {
        let commit = Commit::new("abc123def456abc123def456abc123def456abc123", "abc123d")
            .with_message("Test commit")
            .with_author("Test Author", "test@example.com");

        let json = serde_json::to_string(&commit).unwrap();
        assert!(json.contains("\"shortHash\":\"abc123d\""));
        assert!(json.contains("\"authorEmail\":\"test@example.com\""));

        let deserialized: Commit = serde_json::from_str(&json).unwrap();
        assert_eq!(commit, deserialized);
    }

    #[test]
    fn test_worktree_serialization() {
        let wt = Worktree::new("/path/to/worktree", "openflow/task123/main")
            .with_head_commit("abc123");

        let json = serde_json::to_string(&wt).unwrap();
        assert!(json.contains("\"headCommit\":\"abc123\""));
        assert!(json.contains("\"isMain\":false"));

        let deserialized: Worktree = serde_json::from_str(&json).unwrap();
        assert_eq!(wt, deserialized);
    }

    #[test]
    fn test_file_diff_serialization() {
        let diff = FileDiff::new("src/main.rs").as_new();
        let json = serde_json::to_string(&diff).unwrap();
        assert!(json.contains("\"isNew\":true"));
        assert!(json.contains("\"isBinary\":false"));
    }
}
