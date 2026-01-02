//! Tauri commands for git operations.
//!
//! These commands provide the IPC interface for git worktree management,
//! diff viewing, commit history, and branch operations.
//! Each command is a thin wrapper around GitService methods.
//!
//! ## Worktree Operations
//! - `create_worktree` - Create isolated working directory for a chat
//! - `delete_worktree` - Remove a worktree and clean up
//!
//! ## Diff and History
//! - `get_diff` - Get uncommitted changes in a worktree
//! - `get_commits` - Get commit history for a worktree/branch
//!
//! ## Branch Operations
//! - `push_branch` - Push worktree branch to remote
//! - `get_current_branch` - Get the current branch name
//! - `get_head_commit` - Get the HEAD commit hash
//! - `has_uncommitted_changes` - Check for uncommitted changes
//! - `list_worktrees` - List all worktrees for a repository

use tauri::State;

use crate::commands::AppState;
use openflow_contracts::{Commit, FileDiff, Worktree};
use openflow_core::services::git;

/// Create a new git worktree with a new branch.
///
/// Creates an isolated working directory based on the specified branch.
/// The worktree allows parallel work on the same repository without
/// interfering with other branches or worktrees.
///
/// # Arguments
/// * `repo_path` - Path to the main repository
/// * `branch_name` - Name for the new branch (e.g., "openflow/task123/main")
/// * `base_branch` - Branch to base the new worktree on (e.g., "main")
/// * `worktree_path` - Path where the worktree will be created
///
/// # Returns
/// The path to the created worktree.
#[tauri::command]
pub async fn create_worktree(
    _state: State<'_, AppState>,
    repo_path: String,
    branch_name: String,
    base_branch: String,
    worktree_path: String,
) -> Result<String, String> {
    git::create_worktree(&repo_path, &branch_name, &base_branch, &worktree_path)
        .await
        .map_err(|e| e.to_string())
}

/// Delete a git worktree.
///
/// Removes the worktree directory and prunes any stale references.
/// If normal removal fails, a force removal will be attempted.
///
/// # Arguments
/// * `repo_path` - Path to the main repository
/// * `worktree_path` - Path to the worktree to delete
#[tauri::command]
pub async fn delete_worktree(
    _state: State<'_, AppState>,
    repo_path: String,
    worktree_path: String,
) -> Result<(), String> {
    git::delete_worktree(&repo_path, &worktree_path)
        .await
        .map_err(|e| e.to_string())
}

/// Get the diff for uncommitted changes in a worktree.
///
/// Returns both staged and unstaged changes as a list of file diffs.
/// Each file diff includes the path, change statistics, and hunks
/// of modified content.
///
/// # Arguments
/// * `worktree_path` - Path to the worktree
///
/// # Returns
/// A vector of file diffs showing all changes.
#[tauri::command]
pub async fn get_diff(
    _state: State<'_, AppState>,
    worktree_path: String,
) -> Result<Vec<FileDiff>, String> {
    git::get_diff(&worktree_path)
        .await
        .map_err(|e| e.to_string())
}

/// Get commits for a worktree/branch.
///
/// Returns the commit history starting from HEAD, ordered most recent first.
/// Each commit includes metadata and change statistics.
///
/// # Arguments
/// * `worktree_path` - Path to the worktree
/// * `limit` - Maximum number of commits to return (default: 50)
///
/// # Returns
/// A vector of commits, most recent first.
#[tauri::command]
pub async fn get_commits(
    _state: State<'_, AppState>,
    worktree_path: String,
    limit: Option<usize>,
) -> Result<Vec<Commit>, String> {
    git::get_commits(&worktree_path, limit)
        .await
        .map_err(|e| e.to_string())
}

/// Push a branch to a remote repository.
///
/// Pushes the current branch in the worktree to the specified remote
/// with upstream tracking configured.
///
/// # Arguments
/// * `worktree_path` - Path to the worktree
/// * `remote` - Remote name (default: "origin")
#[tauri::command]
pub async fn push_branch(
    _state: State<'_, AppState>,
    worktree_path: String,
    remote: Option<String>,
) -> Result<(), String> {
    git::push_branch(&worktree_path, remote.as_deref())
        .await
        .map_err(|e| e.to_string())
}

/// Get the current branch name in a worktree.
///
/// # Arguments
/// * `worktree_path` - Path to the worktree
///
/// # Returns
/// The name of the current branch.
#[tauri::command]
pub async fn get_current_branch(
    _state: State<'_, AppState>,
    worktree_path: String,
) -> Result<String, String> {
    git::get_current_branch(&worktree_path)
        .await
        .map_err(|e| e.to_string())
}

/// Get the HEAD commit hash.
///
/// # Arguments
/// * `worktree_path` - Path to the worktree
///
/// # Returns
/// The full SHA of the HEAD commit, or None if no commits exist.
#[tauri::command]
pub async fn get_head_commit(
    _state: State<'_, AppState>,
    worktree_path: String,
) -> Result<Option<String>, String> {
    git::get_head_commit(&worktree_path)
        .await
        .map_err(|e| e.to_string())
}

/// Check if a repository has uncommitted changes.
///
/// Returns true if there are any staged or unstaged changes in the worktree.
///
/// # Arguments
/// * `worktree_path` - Path to the worktree
///
/// # Returns
/// True if there are uncommitted changes.
#[tauri::command]
pub async fn has_uncommitted_changes(
    _state: State<'_, AppState>,
    worktree_path: String,
) -> Result<bool, String> {
    git::has_uncommitted_changes(&worktree_path)
        .await
        .map_err(|e| e.to_string())
}

/// List all worktrees for a repository.
///
/// Returns the worktrees associated with the repository.
///
/// # Arguments
/// * `repo_path` - Path to the main repository
///
/// # Returns
/// A vector of worktree information.
#[tauri::command]
pub async fn list_worktrees(
    _state: State<'_, AppState>,
    repo_path: String,
) -> Result<Vec<Worktree>, String> {
    git::list_worktrees(&repo_path)
        .await
        .map_err(|e| e.to_string())
}

/// Generate a branch name following OpenFlow conventions.
///
/// Format: `openflow/{task_id}/{chat_role}`
///
/// # Arguments
/// * `task_id` - The task identifier
/// * `chat_role` - The chat role (e.g., "main", "review", "test")
///
/// # Returns
/// The generated branch name.
///
/// # Errors
/// Returns an error if the task_id or chat_role is empty.
#[tauri::command]
pub fn generate_branch_name(task_id: String, chat_role: String) -> Result<String, String> {
    git::generate_branch_name(&task_id, &chat_role).map_err(|e| e.to_string())
}

/// Generate a worktree path following OpenFlow conventions.
///
/// Format: `{base_path}/{project_id}/{task_id}-{chat_role}`
///
/// # Arguments
/// * `base_path` - Base directory for worktrees (e.g., "~/.openflow/worktrees")
/// * `project_id` - The project identifier
/// * `task_id` - The task identifier
/// * `chat_role` - The chat role (e.g., "main", "review", "test")
///
/// # Returns
/// The generated worktree path.
#[tauri::command]
pub fn generate_worktree_path(
    base_path: String,
    project_id: String,
    task_id: String,
    chat_role: String,
) -> String {
    git::generate_worktree_path(&base_path, &project_id, &task_id, &chat_role)
}

/// Get the diff for uncommitted changes in a task's worktree.
///
/// Resolves the task's worktree path from its associated chats.
/// Falls back to the project's main git repository if no worktree exists.
///
/// # Arguments
/// * `task_id` - The task identifier
///
/// # Returns
/// A vector of file diffs showing all uncommitted changes.
#[tauri::command]
pub async fn get_task_diff(
    state: State<'_, AppState>,
    task_id: String,
) -> Result<Vec<FileDiff>, String> {
    let pool = state.db.lock().await;
    git::get_task_diff(&pool, &task_id)
        .await
        .map_err(|e| e.to_string())
}

/// Get commits for a task's worktree/branch.
///
/// Resolves the task's worktree path from its associated chats.
/// Falls back to the project's main git repository if no worktree exists.
///
/// # Arguments
/// * `task_id` - The task identifier
/// * `limit` - Maximum number of commits to return (default: 50)
///
/// # Returns
/// A vector of commits, most recent first.
#[tauri::command]
pub async fn get_task_commits(
    state: State<'_, AppState>,
    task_id: String,
    limit: Option<usize>,
) -> Result<Vec<Commit>, String> {
    let pool = state.db.lock().await;
    git::get_task_commits(&pool, &task_id, limit)
        .await
        .map_err(|e| e.to_string())
}
