use serde::{Deserialize, Serialize};
use typeshare::typeshare;

/// Represents a hunk within a file diff.
/// A hunk is a contiguous section of changes in a file.
#[typeshare]
#[derive(Debug, Clone, Serialize, Deserialize)]
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

/// Represents the diff for a single file.
/// Contains metadata about the file change and the actual hunks of changes.
#[typeshare]
#[derive(Debug, Clone, Serialize, Deserialize)]
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

/// Represents a git commit.
/// Contains commit metadata and change statistics.
#[typeshare]
#[derive(Debug, Clone, Serialize, Deserialize)]
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

/// Types of search results that can be returned.
#[typeshare]
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum SearchResultType {
    Task,
    Project,
    Chat,
    Message,
}

/// Represents a search result from the full-text search.
#[typeshare]
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SearchResult {
    /// Unique identifier of the matched item
    pub id: String,
    /// Type of the result (task, project, chat, message)
    pub result_type: SearchResultType,
    /// Title or primary text of the result
    pub title: String,
    /// Subtitle or secondary text (e.g., project name for tasks)
    pub subtitle: Option<String>,
    /// Icon name to display
    pub icon: Option<String>,
    /// Relevance score from FTS5 (higher is more relevant)
    pub score: f64,
}

/// Result of a pull request creation operation.
#[typeshare]
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PullRequestResult {
    /// The URL of the created pull request.
    pub url: String,
    /// The PR number.
    pub number: u32,
    /// The branch name that was used for the PR.
    pub branch: String,
}
