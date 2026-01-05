//! Worktree management service.
//!
//! Manages git worktrees for parallel task execution. This service handles
//! both database record management and git worktree operations.
//!
//! # Worktree Lifecycle
//!
//! ```text
//!   ┌─────────┐     create()      ┌────────┐
//!   │         │ ─────────────────→│ active │
//!   └─────────┘                   └────┬───┘
//!                                      │
//!               ┌──────────────────────┼──────────────────────┐
//!               │                      │                      │
//!               ▼                      ▼                      ▼
//!          ┌────────┐            ┌──────────┐           ┌─────────┐
//!          │ merged │            │ conflict │           │ deleted │
//!          └────────┘            └──────────┘           └─────────┘
//!               │                      │
//!               │    resolve()         │
//!               │◄─────────────────────┘
//! ```
//!
//! # Branch Naming Convention
//!
//! All branches created by OpenFlow follow: `openflow/{task_id}/{step_index}`
//!
//! # Directory Structure
//!
//! ```text
//! ~/.openflow/worktrees/
//! └── {project_id}/
//!     ├── {task_id}-step-0/      # First step worktree
//!     ├── {task_id}-step-1/      # Second step worktree
//!     └── {task_id}-step-2/      # Third step worktree
//! ```
//!
//! # Logging
//!
//! This module uses structured logging at the following levels:
//! - `debug`: Git command execution details, parameter values
//! - `info`: Successful operations (worktree created/deleted/merged)
//! - `warn`: Fallback operations (force delete, conflict resolution)
//! - `error`: Git command failures, database errors
//!
//! # Error Handling
//!
//! All public functions return `ServiceResult<T>` with appropriate error variants:
//! - `ServiceError::Git` for git command failures
//! - `ServiceError::NotFound` for missing worktree records
//! - `ServiceError::Conflict` for merge conflicts
//! - `ServiceError::Database` for database errors

use log::{debug, error, info, warn};
use sqlx::SqlitePool;
use uuid::Uuid;

use openflow_contracts::{DbWorktree, DbWorktreeStatus, DbWorktreeSummary};

use super::{git, ServiceError, ServiceResult};

// =============================================================================
// Service Functions
// =============================================================================

/// Default base path for worktrees
const DEFAULT_WORKTREE_BASE: &str = "~/.openflow/worktrees";

/// Create a new worktree for a project.
///
/// This function:
/// 1. Creates a database record
/// 2. Creates the git worktree on disk
/// 3. Returns the worktree record
///
/// # Arguments
/// * `pool` - Database connection pool
/// * `project_id` - ID of the project
/// * `branch_name` - Name for the new branch
/// * `base_branch` - Branch to base the worktree on (optional, defaults to project's base_branch)
/// * `worktree_path` - Path for the worktree (optional, auto-generated if not provided)
/// * `repo_path` - Path to the main repository
///
/// # Returns
/// The created worktree record.
///
/// # Errors
/// Returns an error if:
/// - The project doesn't exist
/// - The branch already exists
/// - Git command fails
/// - Database operation fails
pub async fn create(
    pool: &SqlitePool,
    project_id: &str,
    branch_name: &str,
    base_branch: &str,
    worktree_path: Option<&str>,
    repo_path: &str,
) -> ServiceResult<DbWorktree> {
    debug!(
        "Creating worktree: project_id={}, branch_name={}, base_branch={}, repo_path={}",
        project_id, branch_name, base_branch, repo_path
    );

    // Generate worktree path if not provided
    let path = match worktree_path {
        Some(p) => p.to_string(),
        None => generate_worktree_path(project_id, branch_name),
    };

    let id = Uuid::new_v4().to_string();

    // First create the git worktree on disk
    git::create_worktree(repo_path, branch_name, base_branch, &path).await?;

    // Then create the database record
    let result = sqlx::query(
        r#"
        INSERT INTO worktrees (id, project_id, branch_name, path, status)
        VALUES (?, ?, ?, ?, 'active')
        "#,
    )
    .bind(&id)
    .bind(project_id)
    .bind(branch_name)
    .bind(&path)
    .execute(pool)
    .await;

    match result {
        Ok(_) => {
            info!(
                "Created worktree: id={}, branch_name={}, path={}",
                id, branch_name, path
            );
            get(pool, &id).await
        }
        Err(e) => {
            // Rollback: delete the git worktree we just created
            error!(
                "Failed to create worktree record, rolling back git worktree: {}",
                e
            );
            let _ = git::delete_worktree(repo_path, &path).await;
            Err(ServiceError::Database(e))
        }
    }
}

/// Get a worktree by ID.
pub async fn get(pool: &SqlitePool, id: &str) -> ServiceResult<DbWorktree> {
    debug!("Getting worktree: id={}", id);

    sqlx::query_as::<_, DbWorktree>(
        r#"
        SELECT id, project_id, branch_name, path, status, created_at, updated_at, merged_at, deleted_at
        FROM worktrees
        WHERE id = ?
        "#,
    )
    .bind(id)
    .fetch_optional(pool)
    .await
    .map_err(|e| {
        error!("Failed to get worktree {}: {}", id, e);
        ServiceError::Database(e)
    })?
    .ok_or_else(|| {
        debug!("Worktree not found: id={}", id);
        ServiceError::not_found("Worktree", id)
    })
}

/// Get a worktree by branch name within a project.
pub async fn get_by_branch(
    pool: &SqlitePool,
    project_id: &str,
    branch_name: &str,
) -> ServiceResult<DbWorktree> {
    debug!(
        "Getting worktree by branch: project_id={}, branch_name={}",
        project_id, branch_name
    );

    sqlx::query_as::<_, DbWorktree>(
        r#"
        SELECT id, project_id, branch_name, path, status, created_at, updated_at, merged_at, deleted_at
        FROM worktrees
        WHERE project_id = ? AND branch_name = ?
        "#,
    )
    .bind(project_id)
    .bind(branch_name)
    .fetch_optional(pool)
    .await
    .map_err(|e| {
        error!(
            "Failed to get worktree by branch {}/{}: {}",
            project_id, branch_name, e
        );
        ServiceError::Database(e)
    })?
    .ok_or_else(|| {
        debug!(
            "Worktree not found: project_id={}, branch_name={}",
            project_id, branch_name
        );
        ServiceError::not_found("Worktree", format!("{}/{}", project_id, branch_name))
    })
}

/// List all worktrees for a project.
pub async fn list_by_project(
    pool: &SqlitePool,
    project_id: &str,
    include_deleted: bool,
) -> ServiceResult<Vec<DbWorktree>> {
    debug!(
        "Listing worktrees: project_id={}, include_deleted={}",
        project_id, include_deleted
    );

    let query = if include_deleted {
        r#"
        SELECT id, project_id, branch_name, path, status, created_at, updated_at, merged_at, deleted_at
        FROM worktrees
        WHERE project_id = ?
        ORDER BY created_at DESC
        "#
    } else {
        r#"
        SELECT id, project_id, branch_name, path, status, created_at, updated_at, merged_at, deleted_at
        FROM worktrees
        WHERE project_id = ? AND status != 'deleted'
        ORDER BY created_at DESC
        "#
    };

    let worktrees = sqlx::query_as::<_, DbWorktree>(query)
        .bind(project_id)
        .fetch_all(pool)
        .await
        .map_err(|e| {
            error!(
                "Failed to list worktrees for project {}: {}",
                project_id, e
            );
            ServiceError::Database(e)
        })?;

    info!(
        "Listed {} worktrees for project {}",
        worktrees.len(),
        project_id
    );
    Ok(worktrees)
}

/// List all active worktrees for a project.
pub async fn list_active(pool: &SqlitePool, project_id: &str) -> ServiceResult<Vec<DbWorktree>> {
    debug!("Listing active worktrees: project_id={}", project_id);

    let worktrees = sqlx::query_as::<_, DbWorktree>(
        r#"
        SELECT id, project_id, branch_name, path, status, created_at, updated_at, merged_at, deleted_at
        FROM worktrees
        WHERE project_id = ? AND status = 'active'
        ORDER BY created_at DESC
        "#,
    )
    .bind(project_id)
    .fetch_all(pool)
    .await
    .map_err(|e| {
        error!(
            "Failed to list active worktrees for project {}: {}",
            project_id, e
        );
        ServiceError::Database(e)
    })?;

    info!(
        "Listed {} active worktrees for project {}",
        worktrees.len(),
        project_id
    );
    Ok(worktrees)
}

/// Get worktree summaries for a project.
pub async fn list_summaries(
    pool: &SqlitePool,
    project_id: &str,
) -> ServiceResult<Vec<DbWorktreeSummary>> {
    debug!("Listing worktree summaries: project_id={}", project_id);

    let summaries = sqlx::query_as::<_, DbWorktreeSummary>(
        r#"
        SELECT id, branch_name, path, status, merged_at
        FROM worktrees
        WHERE project_id = ? AND status != 'deleted'
        ORDER BY created_at DESC
        "#,
    )
    .bind(project_id)
    .fetch_all(pool)
    .await
    .map_err(|e| {
        error!(
            "Failed to list worktree summaries for project {}: {}",
            project_id, e
        );
        ServiceError::Database(e)
    })?;

    debug!(
        "Listed {} worktree summaries for project {}",
        summaries.len(),
        project_id
    );
    Ok(summaries)
}

/// Delete a worktree.
///
/// This function:
/// 1. Removes the git worktree from disk
/// 2. Updates the database record to 'deleted' status
///
/// # Arguments
/// * `pool` - Database connection pool
/// * `worktree_id` - ID of the worktree to delete
/// * `repo_path` - Path to the main repository
///
/// # Errors
/// Returns an error if:
/// - The worktree doesn't exist
/// - The worktree is already deleted
/// - Git command fails
pub async fn delete(pool: &SqlitePool, worktree_id: &str, repo_path: &str) -> ServiceResult<()> {
    debug!("Deleting worktree: id={}", worktree_id);

    let worktree = get(pool, worktree_id).await?;

    if !worktree.can_delete() {
        return Err(ServiceError::validation(format!(
            "Cannot delete worktree in {} status",
            worktree.status
        )));
    }

    // Delete the git worktree from disk
    if let Err(e) = git::delete_worktree(repo_path, &worktree.path).await {
        warn!(
            "Failed to delete git worktree (may already be deleted): {}",
            e
        );
        // Continue anyway - the directory may have been manually deleted
    }

    // Update the database record
    sqlx::query(
        r#"
        UPDATE worktrees
        SET status = 'deleted', deleted_at = datetime('now', 'subsec'), updated_at = datetime('now', 'subsec')
        WHERE id = ?
        "#,
    )
    .bind(worktree_id)
    .execute(pool)
    .await
    .map_err(|e| {
        error!("Failed to update worktree status to deleted: {}", e);
        ServiceError::Database(e)
    })?;

    info!(
        "Deleted worktree: id={}, path={}",
        worktree_id, worktree.path
    );
    Ok(())
}

/// Merge a worktree back to its base branch.
///
/// This function:
/// 1. Checks out the base branch in the main repo
/// 2. Merges the worktree branch
/// 3. Updates the database record to 'merged' status
///
/// # Arguments
/// * `pool` - Database connection pool
/// * `worktree_id` - ID of the worktree to merge
/// * `repo_path` - Path to the main repository
/// * `base_branch` - Branch to merge into
///
/// # Returns
/// `Ok(())` on success, or an error if the merge fails.
///
/// # Errors
/// Returns an error if:
/// - The worktree doesn't exist
/// - The worktree is not active
/// - There are merge conflicts (status will be updated to 'conflict')
/// - Git command fails
pub async fn merge(
    pool: &SqlitePool,
    worktree_id: &str,
    repo_path: &str,
    base_branch: &str,
) -> ServiceResult<()> {
    debug!(
        "Merging worktree: id={}, base_branch={}",
        worktree_id, base_branch
    );

    let worktree = get(pool, worktree_id).await?;

    if !worktree.can_merge() {
        return Err(ServiceError::validation(format!(
            "Cannot merge worktree in {} status",
            worktree.status
        )));
    }

    // Checkout the base branch in main repo
    let checkout_output = std::process::Command::new("git")
        .args(["-C", repo_path, "checkout", base_branch])
        .output()?;

    if !checkout_output.status.success() {
        let stderr = String::from_utf8_lossy(&checkout_output.stderr);
        error!(
            "Failed to checkout base branch {}: {}",
            base_branch,
            stderr.trim()
        );
        return Err(ServiceError::git(format!(
            "Failed to checkout base branch: {}",
            stderr
        )));
    }

    // Merge the worktree branch
    let merge_output = std::process::Command::new("git")
        .args(["-C", repo_path, "merge", &worktree.branch_name, "--no-edit"])
        .output()?;

    if !merge_output.status.success() {
        let stderr = String::from_utf8_lossy(&merge_output.stderr);

        // Check if this is a merge conflict
        if stderr.contains("CONFLICT") || stderr.contains("Automatic merge failed") {
            warn!(
                "Merge conflict detected for worktree {}: {}",
                worktree_id,
                stderr.trim()
            );

            // Update status to conflict
            sqlx::query(
                r#"
                UPDATE worktrees
                SET status = 'conflict', updated_at = datetime('now', 'subsec')
                WHERE id = ?
                "#,
            )
            .bind(worktree_id)
            .execute(pool)
            .await
            .map_err(|e| {
                error!("Failed to update worktree status to conflict: {}", e);
                ServiceError::Database(e)
            })?;

            return Err(ServiceError::conflict(format!(
                "Merge conflict in worktree {}: {}",
                worktree.branch_name, stderr
            )));
        }

        error!("Failed to merge branch {}: {}", worktree.branch_name, stderr);
        return Err(ServiceError::git(format!(
            "Failed to merge branch: {}",
            stderr
        )));
    }

    // Update the database record
    sqlx::query(
        r#"
        UPDATE worktrees
        SET status = 'merged', merged_at = datetime('now', 'subsec'), updated_at = datetime('now', 'subsec')
        WHERE id = ?
        "#,
    )
    .bind(worktree_id)
    .execute(pool)
    .await
    .map_err(|e| {
        error!("Failed to update worktree status to merged: {}", e);
        ServiceError::Database(e)
    })?;

    info!(
        "Merged worktree: id={}, branch={} -> {}",
        worktree_id, worktree.branch_name, base_branch
    );
    Ok(())
}

/// Resolve conflicts in a worktree and mark it as merged.
///
/// This should be called after manually resolving merge conflicts.
///
/// # Arguments
/// * `pool` - Database connection pool
/// * `worktree_id` - ID of the worktree
pub async fn resolve_conflict(pool: &SqlitePool, worktree_id: &str) -> ServiceResult<()> {
    debug!("Resolving conflict for worktree: id={}", worktree_id);

    let worktree = get(pool, worktree_id).await?;

    if !worktree.status.has_conflicts() {
        return Err(ServiceError::validation(
            "Worktree does not have conflicts to resolve",
        ));
    }

    // Update the database record
    sqlx::query(
        r#"
        UPDATE worktrees
        SET status = 'merged', merged_at = datetime('now', 'subsec'), updated_at = datetime('now', 'subsec')
        WHERE id = ?
        "#,
    )
    .bind(worktree_id)
    .execute(pool)
    .await
    .map_err(|e| {
        error!("Failed to resolve worktree conflict: {}", e);
        ServiceError::Database(e)
    })?;

    info!("Resolved conflict for worktree: id={}", worktree_id);
    Ok(())
}

/// Update the status of a worktree.
pub async fn update_status(
    pool: &SqlitePool,
    worktree_id: &str,
    status: DbWorktreeStatus,
) -> ServiceResult<DbWorktree> {
    debug!(
        "Updating worktree status: id={}, status={}",
        worktree_id, status
    );

    sqlx::query(
        r#"
        UPDATE worktrees
        SET status = ?, updated_at = datetime('now', 'subsec')
        WHERE id = ?
        "#,
    )
    .bind(status.to_string())
    .bind(worktree_id)
    .execute(pool)
    .await
    .map_err(|e| {
        error!("Failed to update worktree status: {}", e);
        ServiceError::Database(e)
    })?;

    get(pool, worktree_id).await
}

/// Count active worktrees for a project.
pub async fn count_active(pool: &SqlitePool, project_id: &str) -> ServiceResult<i64> {
    debug!("Counting active worktrees: project_id={}", project_id);

    let count: (i64,) = sqlx::query_as(
        r#"
        SELECT COUNT(*) FROM worktrees
        WHERE project_id = ? AND status = 'active'
        "#,
    )
    .bind(project_id)
    .fetch_one(pool)
    .await
    .map_err(|e| {
        error!("Failed to count active worktrees: {}", e);
        ServiceError::Database(e)
    })?;

    Ok(count.0)
}

/// Clean up stale worktrees.
///
/// Finds worktrees that exist in the database but not on disk,
/// and marks them as deleted.
pub async fn cleanup_stale(pool: &SqlitePool, project_id: &str) -> ServiceResult<i32> {
    debug!("Cleaning up stale worktrees: project_id={}", project_id);

    let worktrees = list_active(pool, project_id).await?;
    let mut cleaned = 0;

    for worktree in worktrees {
        if !std::path::Path::new(&worktree.path).exists() {
            warn!("Found stale worktree: id={}, path={}", worktree.id, worktree.path);

            sqlx::query(
                r#"
                UPDATE worktrees
                SET status = 'deleted', deleted_at = datetime('now', 'subsec'), updated_at = datetime('now', 'subsec')
                WHERE id = ?
                "#,
            )
            .bind(&worktree.id)
            .execute(pool)
            .await
            .map_err(|e| {
                error!("Failed to mark stale worktree as deleted: {}", e);
                ServiceError::Database(e)
            })?;

            cleaned += 1;
        }
    }

    info!(
        "Cleaned up {} stale worktrees for project {}",
        cleaned, project_id
    );
    Ok(cleaned)
}

// =============================================================================
// Helper Functions
// =============================================================================

/// Generate a worktree path from project ID and branch name.
fn generate_worktree_path(project_id: &str, branch_name: &str) -> String {
    let expanded_base = shellexpand::tilde(DEFAULT_WORKTREE_BASE);

    // Convert branch name to safe directory name
    // e.g., "openflow/task123/main" -> "task123-main"
    let safe_name = branch_name
        .trim_start_matches("openflow/")
        .replace('/', "-");

    format!("{}/{}/{}", expanded_base, project_id, safe_name)
}

/// Generate a branch name for a task step.
///
/// Format: `openflow/{task_id}/step-{step_index}`
pub fn generate_branch_name(task_id: &str, step_index: i32) -> ServiceResult<String> {
    if task_id.is_empty() {
        return Err(ServiceError::validation("task_id cannot be empty"));
    }
    if step_index < 0 {
        return Err(ServiceError::validation("step_index cannot be negative"));
    }

    Ok(format!("openflow/{}/step-{}", task_id, step_index))
}

/// Generate a worktree path for a task step.
///
/// Format: `{base_path}/{project_id}/{task_id}-step-{step_index}`
pub fn generate_step_worktree_path(project_id: &str, task_id: &str, step_index: i32) -> String {
    let expanded_base = shellexpand::tilde(DEFAULT_WORKTREE_BASE);
    format!(
        "{}/{}/{}-step-{}",
        expanded_base, project_id, task_id, step_index
    )
}

// =============================================================================
// Tests
// =============================================================================

#[cfg(test)]
mod tests {
    use super::*;
    use openflow_db::create_test_db;
    use std::fs;
    use std::process::Command;
    use tempfile::TempDir;

    /// Helper to create an in-memory database with migrations applied.
    async fn setup_test_db() -> SqlitePool {
        create_test_db().await.expect("Failed to create test pool")
    }

    /// Helper to create a test git repository.
    fn setup_test_repo() -> TempDir {
        let temp_dir = TempDir::new().expect("Failed to create temp dir");
        let repo_path = temp_dir.path();

        Command::new("git")
            .args(["init"])
            .current_dir(repo_path)
            .output()
            .expect("Failed to init git repo");

        Command::new("git")
            .args(["config", "user.email", "test@example.com"])
            .current_dir(repo_path)
            .output()
            .expect("Failed to configure git email");

        Command::new("git")
            .args(["config", "user.name", "Test User"])
            .current_dir(repo_path)
            .output()
            .expect("Failed to configure git name");

        let readme_path = repo_path.join("README.md");
        fs::write(&readme_path, "# Test Repository\n").expect("Failed to create README");

        Command::new("git")
            .args(["add", "."])
            .current_dir(repo_path)
            .output()
            .expect("Failed to stage files");

        Command::new("git")
            .args(["commit", "-m", "Initial commit"])
            .current_dir(repo_path)
            .output()
            .expect("Failed to create initial commit");

        temp_dir
    }

    /// Create a test project in the database.
    async fn create_test_project(pool: &SqlitePool, id: &str, git_repo_path: &str) {
        sqlx::query(
            r#"
            INSERT INTO projects (id, name, git_repo_path, base_branch, icon, workflows_folder)
            VALUES (?, 'Test Project', ?, 'main', 'folder', '.openflow/workflows')
            "#,
        )
        .bind(id)
        .bind(git_repo_path)
        .execute(pool)
        .await
        .expect("Failed to create test project");
    }

    // =========================================================================
    // Helper Function Tests
    // =========================================================================

    #[test]
    fn test_generate_worktree_path() {
        let path = generate_worktree_path("project1", "openflow/task123/main");
        assert!(path.contains("project1"));
        assert!(path.contains("task123-main"));
    }

    #[test]
    fn test_generate_branch_name() {
        assert_eq!(
            generate_branch_name("task123", 0).unwrap(),
            "openflow/task123/step-0"
        );
        assert_eq!(
            generate_branch_name("abc-def", 5).unwrap(),
            "openflow/abc-def/step-5"
        );
    }

    #[test]
    fn test_generate_branch_name_validation() {
        assert!(generate_branch_name("", 0).is_err());
        assert!(generate_branch_name("task123", -1).is_err());
    }

    #[test]
    fn test_generate_step_worktree_path() {
        let path = generate_step_worktree_path("project1", "task123", 2);
        assert!(path.contains("project1"));
        assert!(path.contains("task123-step-2"));
    }

    // =========================================================================
    // Database CRUD Tests
    // =========================================================================

    #[tokio::test]
    async fn test_create_and_get_worktree() {
        let pool = setup_test_db().await;
        let temp_repo = setup_test_repo();
        let repo_path = temp_repo.path().to_str().unwrap();

        // Create a test project
        create_test_project(&pool, "project-1", repo_path).await;

        // Get base branch
        let base_branch = git::get_current_branch(repo_path).await.unwrap();

        // Create worktree in temp directory
        let worktree_temp = TempDir::new().expect("Failed to create worktree temp dir");
        let worktree_path = worktree_temp
            .path()
            .join("test-wt")
            .to_str()
            .unwrap()
            .to_string();

        let worktree = create(
            &pool,
            "project-1",
            "openflow/task1/step-0",
            &base_branch,
            Some(&worktree_path),
            repo_path,
        )
        .await
        .expect("Failed to create worktree");

        assert_eq!(worktree.project_id, "project-1");
        assert_eq!(worktree.branch_name, "openflow/task1/step-0");
        assert_eq!(worktree.path, worktree_path);
        assert_eq!(worktree.status, DbWorktreeStatus::Active);
        assert!(worktree.merged_at.is_none());
        assert!(worktree.deleted_at.is_none());

        // Verify we can get it back
        let fetched = get(&pool, &worktree.id).await.expect("Failed to get worktree");
        assert_eq!(fetched.id, worktree.id);
        assert_eq!(fetched.branch_name, worktree.branch_name);

        // Verify the git worktree was created
        assert!(std::path::Path::new(&worktree_path).exists());
    }

    #[tokio::test]
    async fn test_get_by_branch() {
        let pool = setup_test_db().await;
        let temp_repo = setup_test_repo();
        let repo_path = temp_repo.path().to_str().unwrap();

        create_test_project(&pool, "project-1", repo_path).await;

        let base_branch = git::get_current_branch(repo_path).await.unwrap();
        let worktree_temp = TempDir::new().expect("Failed to create worktree temp dir");
        let worktree_path = worktree_temp
            .path()
            .join("test-wt")
            .to_str()
            .unwrap()
            .to_string();

        create(
            &pool,
            "project-1",
            "openflow/task1/step-0",
            &base_branch,
            Some(&worktree_path),
            repo_path,
        )
        .await
        .expect("Failed to create worktree");

        let fetched = get_by_branch(&pool, "project-1", "openflow/task1/step-0")
            .await
            .expect("Failed to get worktree by branch");
        assert_eq!(fetched.branch_name, "openflow/task1/step-0");
    }

    #[tokio::test]
    async fn test_list_by_project() {
        let pool = setup_test_db().await;
        let temp_repo = setup_test_repo();
        let repo_path = temp_repo.path().to_str().unwrap();

        create_test_project(&pool, "project-1", repo_path).await;

        let base_branch = git::get_current_branch(repo_path).await.unwrap();

        // Create multiple worktrees
        for i in 0..3 {
            let worktree_temp = TempDir::new().expect("Failed to create worktree temp dir");
            let worktree_path = worktree_temp
                .path()
                .join(format!("wt-{}", i))
                .to_str()
                .unwrap()
                .to_string();

            create(
                &pool,
                "project-1",
                &format!("openflow/task{}/step-0", i),
                &base_branch,
                Some(&worktree_path),
                repo_path,
            )
            .await
            .expect("Failed to create worktree");

            // Keep temp dir alive
            std::mem::forget(worktree_temp);
        }

        let worktrees = list_by_project(&pool, "project-1", false)
            .await
            .expect("Failed to list worktrees");
        assert_eq!(worktrees.len(), 3);
    }

    #[tokio::test]
    async fn test_list_active() {
        let pool = setup_test_db().await;
        let temp_repo = setup_test_repo();
        let repo_path = temp_repo.path().to_str().unwrap();

        create_test_project(&pool, "project-1", repo_path).await;

        let base_branch = git::get_current_branch(repo_path).await.unwrap();

        let worktree_temp = TempDir::new().expect("Failed to create worktree temp dir");
        let worktree_path = worktree_temp
            .path()
            .join("test-wt")
            .to_str()
            .unwrap()
            .to_string();

        let worktree = create(
            &pool,
            "project-1",
            "openflow/task1/step-0",
            &base_branch,
            Some(&worktree_path),
            repo_path,
        )
        .await
        .expect("Failed to create worktree");

        let active = list_active(&pool, "project-1")
            .await
            .expect("Failed to list active");
        assert_eq!(active.len(), 1);

        // Mark as merged
        sqlx::query("UPDATE worktrees SET status = 'merged' WHERE id = ?")
            .bind(&worktree.id)
            .execute(&pool)
            .await
            .unwrap();

        let active = list_active(&pool, "project-1")
            .await
            .expect("Failed to list active");
        assert_eq!(active.len(), 0);
    }

    #[tokio::test]
    async fn test_delete_worktree() {
        let pool = setup_test_db().await;
        let temp_repo = setup_test_repo();
        let repo_path = temp_repo.path().to_str().unwrap();

        create_test_project(&pool, "project-1", repo_path).await;

        let base_branch = git::get_current_branch(repo_path).await.unwrap();
        let worktree_temp = TempDir::new().expect("Failed to create worktree temp dir");
        let worktree_path = worktree_temp
            .path()
            .join("test-wt")
            .to_str()
            .unwrap()
            .to_string();

        let worktree = create(
            &pool,
            "project-1",
            "openflow/task1/step-0",
            &base_branch,
            Some(&worktree_path),
            repo_path,
        )
        .await
        .expect("Failed to create worktree");

        // Verify it exists
        assert!(std::path::Path::new(&worktree_path).exists());

        // Delete it
        delete(&pool, &worktree.id, repo_path)
            .await
            .expect("Failed to delete worktree");

        // Verify database status
        let fetched = get(&pool, &worktree.id).await.expect("Failed to get worktree");
        assert_eq!(fetched.status, DbWorktreeStatus::Deleted);
        assert!(fetched.deleted_at.is_some());
    }

    #[tokio::test]
    async fn test_count_active() {
        let pool = setup_test_db().await;
        let temp_repo = setup_test_repo();
        let repo_path = temp_repo.path().to_str().unwrap();

        create_test_project(&pool, "project-1", repo_path).await;

        let base_branch = git::get_current_branch(repo_path).await.unwrap();

        // Create 2 worktrees
        for i in 0..2 {
            let worktree_temp = TempDir::new().expect("Failed to create worktree temp dir");
            let worktree_path = worktree_temp
                .path()
                .join(format!("wt-{}", i))
                .to_str()
                .unwrap()
                .to_string();

            create(
                &pool,
                "project-1",
                &format!("openflow/task{}/step-0", i),
                &base_branch,
                Some(&worktree_path),
                repo_path,
            )
            .await
            .expect("Failed to create worktree");

            std::mem::forget(worktree_temp);
        }

        let count = count_active(&pool, "project-1")
            .await
            .expect("Failed to count");
        assert_eq!(count, 2);
    }

    #[tokio::test]
    async fn test_update_status() {
        let pool = setup_test_db().await;
        let temp_repo = setup_test_repo();
        let repo_path = temp_repo.path().to_str().unwrap();

        create_test_project(&pool, "project-1", repo_path).await;

        let base_branch = git::get_current_branch(repo_path).await.unwrap();
        let worktree_temp = TempDir::new().expect("Failed to create worktree temp dir");
        let worktree_path = worktree_temp
            .path()
            .join("test-wt")
            .to_str()
            .unwrap()
            .to_string();

        let worktree = create(
            &pool,
            "project-1",
            "openflow/task1/step-0",
            &base_branch,
            Some(&worktree_path),
            repo_path,
        )
        .await
        .expect("Failed to create worktree");

        assert_eq!(worktree.status, DbWorktreeStatus::Active);

        let updated = update_status(&pool, &worktree.id, DbWorktreeStatus::Conflict)
            .await
            .expect("Failed to update status");
        assert_eq!(updated.status, DbWorktreeStatus::Conflict);
    }

    #[tokio::test]
    async fn test_worktree_not_found() {
        let pool = setup_test_db().await;

        let result = get(&pool, "non-existent").await;
        assert!(result.is_err());
        assert!(matches!(
            result.unwrap_err(),
            ServiceError::NotFound { .. }
        ));
    }

    #[tokio::test]
    async fn test_cannot_delete_already_deleted() {
        let pool = setup_test_db().await;
        let temp_repo = setup_test_repo();
        let repo_path = temp_repo.path().to_str().unwrap();

        create_test_project(&pool, "project-1", repo_path).await;

        let base_branch = git::get_current_branch(repo_path).await.unwrap();
        let worktree_temp = TempDir::new().expect("Failed to create worktree temp dir");
        let worktree_path = worktree_temp
            .path()
            .join("test-wt")
            .to_str()
            .unwrap()
            .to_string();

        let worktree = create(
            &pool,
            "project-1",
            "openflow/task1/step-0",
            &base_branch,
            Some(&worktree_path),
            repo_path,
        )
        .await
        .expect("Failed to create worktree");

        // Delete it
        delete(&pool, &worktree.id, repo_path)
            .await
            .expect("Failed to delete");

        // Try to delete again
        let result = delete(&pool, &worktree.id, repo_path).await;
        assert!(result.is_err());
    }

}
