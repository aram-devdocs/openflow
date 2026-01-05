//! Tauri commands for database-tracked worktrees.
//!
//! These commands provide the IPC interface for worktree management
//! from the frontend. They wrap the worktree service from openflow_core.
//!
//! # Commands
//!
//! - `get_db_worktree` - Get a worktree by ID
//! - `get_db_worktree_by_branch` - Get worktree by project and branch
//! - `list_db_worktrees` - List worktrees for a project
//! - `list_active_db_worktrees` - List active worktrees only
//! - `list_db_worktree_summaries` - Get lightweight summaries
//! - `count_active_db_worktrees` - Count active worktrees
//! - `create_db_worktree` - Create a new worktree
//! - `delete_db_worktree` - Delete a worktree
//! - `merge_db_worktree` - Merge worktree back to base branch
//! - `resolve_db_worktree_conflict` - Mark conflict as resolved
//! - `cleanup_stale_db_worktrees` - Clean up orphaned worktrees

use openflow_contracts::{DbWorktree, DbWorktreeSummary};
use openflow_core::services::worktree;
use tauri::State;

use super::AppState;

/// Get a worktree by ID.
#[tauri::command]
pub async fn get_db_worktree(state: State<'_, AppState>, id: String) -> Result<DbWorktree, String> {
    let pool = state.db.lock().await;
    worktree::get(&pool, &id).await.map_err(|e| e.to_string())
}

/// Get a worktree by project and branch name.
#[tauri::command]
pub async fn get_db_worktree_by_branch(
    state: State<'_, AppState>,
    project_id: String,
    branch_name: String,
) -> Result<DbWorktree, String> {
    let pool = state.db.lock().await;
    worktree::get_by_branch(&pool, &project_id, &branch_name)
        .await
        .map_err(|e| e.to_string())
}

/// List all worktrees for a project.
#[tauri::command]
pub async fn list_db_worktrees(
    state: State<'_, AppState>,
    project_id: String,
    include_deleted: Option<bool>,
) -> Result<Vec<DbWorktree>, String> {
    let pool = state.db.lock().await;
    worktree::list_by_project(&pool, &project_id, include_deleted.unwrap_or(false))
        .await
        .map_err(|e| e.to_string())
}

/// List active worktrees for a project.
#[tauri::command]
pub async fn list_active_db_worktrees(
    state: State<'_, AppState>,
    project_id: String,
) -> Result<Vec<DbWorktree>, String> {
    let pool = state.db.lock().await;
    worktree::list_active(&pool, &project_id)
        .await
        .map_err(|e| e.to_string())
}

/// Get lightweight summaries for worktrees in a project.
#[tauri::command]
pub async fn list_db_worktree_summaries(
    state: State<'_, AppState>,
    project_id: String,
) -> Result<Vec<DbWorktreeSummary>, String> {
    let pool = state.db.lock().await;
    worktree::list_summaries(&pool, &project_id)
        .await
        .map_err(|e| e.to_string())
}

/// Count active worktrees for a project.
#[tauri::command]
pub async fn count_active_db_worktrees(
    state: State<'_, AppState>,
    project_id: String,
) -> Result<i64, String> {
    let pool = state.db.lock().await;
    worktree::count_active(&pool, &project_id)
        .await
        .map_err(|e| e.to_string())
}

/// Create a new worktree.
///
/// # Arguments
/// * `project_id` - Project to create worktree for
/// * `branch_name` - Name for the new branch
/// * `base_branch` - Branch to base the worktree on
/// * `worktree_path` - Optional path (auto-generated if not provided)
/// * `repo_path` - Path to the git repository
#[tauri::command]
pub async fn create_db_worktree(
    state: State<'_, AppState>,
    project_id: String,
    branch_name: String,
    base_branch: String,
    worktree_path: Option<String>,
    repo_path: String,
) -> Result<DbWorktree, String> {
    let pool = state.db.lock().await;
    worktree::create(
        &pool,
        &project_id,
        &branch_name,
        &base_branch,
        worktree_path.as_deref(),
        &repo_path,
    )
    .await
    .map_err(|e| e.to_string())
}

/// Delete a worktree.
///
/// Removes the worktree from disk and updates the database record.
#[tauri::command]
pub async fn delete_db_worktree(
    state: State<'_, AppState>,
    id: String,
    repo_path: String,
) -> Result<(), String> {
    let pool = state.db.lock().await;
    worktree::delete(&pool, &id, &repo_path)
        .await
        .map_err(|e| e.to_string())
}

/// Merge a worktree back to its base branch.
///
/// If merge conflicts occur, the worktree status will be set to 'conflict'.
#[tauri::command]
pub async fn merge_db_worktree(
    state: State<'_, AppState>,
    id: String,
    repo_path: String,
    base_branch: String,
) -> Result<(), String> {
    let pool = state.db.lock().await;
    worktree::merge(&pool, &id, &repo_path, &base_branch)
        .await
        .map_err(|e| e.to_string())
}

/// Resolve conflicts in a worktree and mark it as merged.
///
/// Call this after manually resolving merge conflicts.
#[tauri::command]
pub async fn resolve_db_worktree_conflict(
    state: State<'_, AppState>,
    id: String,
) -> Result<(), String> {
    let pool = state.db.lock().await;
    worktree::resolve_conflict(&pool, &id)
        .await
        .map_err(|e| e.to_string())
}

/// Clean up stale worktrees.
///
/// Finds worktrees that exist in the database but not on disk,
/// and marks them as deleted.
///
/// Returns the number of worktrees cleaned up.
#[tauri::command]
pub async fn cleanup_stale_db_worktrees(
    state: State<'_, AppState>,
    project_id: String,
) -> Result<i32, String> {
    let pool = state.db.lock().await;
    worktree::cleanup_stale(&pool, &project_id)
        .await
        .map_err(|e| e.to_string())
}
