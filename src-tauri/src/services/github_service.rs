//! GitHub service for pull request operations.
//!
//! This service wraps the GitHub CLI (`gh`) to create pull requests
//! from task worktrees. It handles authentication status checking,
//! branch pushing, and PR creation.

use std::process::Command;

use sqlx::SqlitePool;

use super::{GitService, ProjectService, ServiceError, ServiceResult, TaskService};
use crate::types::PullRequestResult;

/// Service for GitHub operations including PR creation.
pub struct GitHubService;

impl GitHubService {
    /// Check if the `gh` CLI is installed and available.
    ///
    /// # Returns
    /// `true` if `gh` is installed and executable, `false` otherwise.
    pub fn check_gh_cli_installed() -> bool {
        Command::new("gh")
            .arg("--version")
            .output()
            .map(|output| output.status.success())
            .unwrap_or(false)
    }

    /// Check if the user is authenticated with GitHub CLI.
    ///
    /// # Returns
    /// `Ok(())` if authenticated, `Err` with a descriptive message if not.
    pub fn check_gh_auth_status() -> ServiceResult<()> {
        if !Self::check_gh_cli_installed() {
            return Err(ServiceError::Validation(
                "GitHub CLI (gh) is not installed. Please install it from https://cli.github.com/"
                    .to_string(),
            ));
        }

        let output = Command::new("gh")
            .args(["auth", "status"])
            .output()
            .map_err(|e| ServiceError::Git(format!("Failed to run gh auth status: {}", e)))?;

        if !output.status.success() {
            let stderr = String::from_utf8_lossy(&output.stderr);
            return Err(ServiceError::Validation(format!(
                "Not authenticated with GitHub. Run 'gh auth login' to authenticate. Error: {}",
                stderr.trim()
            )));
        }

        Ok(())
    }

    /// Get the remote repository URL for a worktree.
    ///
    /// # Arguments
    /// * `worktree_path` - Path to the worktree
    /// * `remote` - Remote name (default: "origin")
    ///
    /// # Returns
    /// The remote URL if found.
    pub fn get_remote_url(worktree_path: &str, remote: Option<&str>) -> ServiceResult<String> {
        let remote = remote.unwrap_or("origin");

        let output = Command::new("git")
            .args(["-C", worktree_path, "remote", "get-url", remote])
            .output()
            .map_err(|e| ServiceError::Git(format!("Failed to get remote URL: {}", e)))?;

        if !output.status.success() {
            let stderr = String::from_utf8_lossy(&output.stderr);
            return Err(ServiceError::Git(format!(
                "Failed to get remote URL for '{}': {}",
                remote,
                stderr.trim()
            )));
        }

        Ok(String::from_utf8_lossy(&output.stdout).trim().to_string())
    }

    /// Create a pull request using the GitHub CLI.
    ///
    /// This method:
    /// 1. Verifies `gh` CLI is installed and authenticated
    /// 2. Gets the task's worktree path
    /// 3. Ensures the branch is pushed to the remote
    /// 4. Creates the PR using `gh pr create`
    ///
    /// # Arguments
    /// * `pool` - Database connection pool
    /// * `task_id` - The task to create a PR for
    /// * `title` - PR title (defaults to task title if None)
    /// * `body` - PR body/description
    /// * `base` - Base branch to merge into (defaults to project's base_branch or "main")
    /// * `draft` - Whether to create as a draft PR
    ///
    /// # Returns
    /// The result containing the PR URL, number, and branch name.
    pub async fn create_pull_request(
        pool: &SqlitePool,
        task_id: &str,
        title: Option<String>,
        body: Option<String>,
        base: Option<String>,
        draft: bool,
    ) -> ServiceResult<PullRequestResult> {
        // 1. Check gh CLI is available and authenticated
        Self::check_gh_auth_status()?;

        // 2. Get the task with its chats to find the worktree
        let task_with_chats = TaskService::get(pool, task_id).await?;
        let task = &task_with_chats.task;

        // 3. Find the worktree path from the task's chats
        let worktree_path = task_with_chats
            .chats
            .iter()
            .filter(|c| c.worktree_path.is_some() && !c.worktree_deleted)
            .min_by_key(|c| c.workflow_step_index.unwrap_or(i32::MAX))
            .and_then(|c| c.worktree_path.clone())
            .ok_or_else(|| {
                ServiceError::Validation(
                    "Task has no active worktree. Cannot create PR without a worktree.".to_string(),
                )
            })?;

        // 4. Get project for default base branch
        let project = ProjectService::get(pool, &task.project_id).await?;

        // 5. Determine the title (default to task title)
        let pr_title = title.unwrap_or_else(|| task.title.clone());

        // 6. Determine the base branch (prefer: param > task > project > "main")
        let base_branch = base
            .or_else(|| task.base_branch.clone())
            .unwrap_or_else(|| {
                if project.base_branch.is_empty() {
                    "main".to_string()
                } else {
                    project.base_branch.clone()
                }
            });

        // 7. Get current branch name
        let branch = GitService::get_current_branch(&worktree_path).await?;

        // 8. Push the branch to remote (with set-upstream)
        GitService::push_branch(&worktree_path, None).await?;

        // 9. Build the gh pr create command
        let mut args = vec![
            "pr".to_string(),
            "create".to_string(),
            "--title".to_string(),
            pr_title.clone(),
            "--base".to_string(),
            base_branch,
        ];

        // Add body if provided
        if let Some(body_text) = body {
            args.push("--body".to_string());
            args.push(body_text);
        } else {
            // Use empty body if not provided
            args.push("--body".to_string());
            args.push(String::new());
        }

        // Add draft flag if requested
        if draft {
            args.push("--draft".to_string());
        }

        // 10. Run gh pr create
        let output = Command::new("gh")
            .args(&args)
            .current_dir(&worktree_path)
            .output()
            .map_err(|e| ServiceError::Git(format!("Failed to run gh pr create: {}", e)))?;

        if !output.status.success() {
            let stderr = String::from_utf8_lossy(&output.stderr);
            return Err(ServiceError::Git(format!(
                "Failed to create pull request: {}",
                stderr.trim()
            )));
        }

        // 11. Parse the PR URL from output
        let stdout = String::from_utf8_lossy(&output.stdout);
        let url = stdout.trim().to_string();

        // 12. Extract PR number from URL (e.g., https://github.com/owner/repo/pull/123)
        let number = url
            .rsplit('/')
            .next()
            .and_then(|s| s.parse::<u32>().ok())
            .unwrap_or(0);

        Ok(PullRequestResult {
            url,
            number,
            branch,
        })
    }

    /// Check if a pull request already exists for a branch.
    ///
    /// # Arguments
    /// * `worktree_path` - Path to the worktree
    /// * `branch` - Branch name to check (defaults to current branch)
    ///
    /// # Returns
    /// `Some(url)` if a PR exists, `None` otherwise.
    pub async fn get_existing_pr(
        worktree_path: &str,
        branch: Option<&str>,
    ) -> ServiceResult<Option<String>> {
        Self::check_gh_auth_status()?;

        // Get current branch if not specified
        let branch_name = match branch {
            Some(b) => b.to_string(),
            None => GitService::get_current_branch(worktree_path).await?,
        };

        let output = Command::new("gh")
            .args([
                "pr",
                "list",
                "--head",
                &branch_name,
                "--json",
                "url",
                "--jq",
                ".[0].url",
            ])
            .current_dir(worktree_path)
            .output()
            .map_err(|e| ServiceError::Git(format!("Failed to check for existing PR: {}", e)))?;

        if !output.status.success() {
            // gh pr list can fail if not in a github repo, which is fine
            return Ok(None);
        }

        let url = String::from_utf8_lossy(&output.stdout).trim().to_string();
        if url.is_empty() {
            Ok(None)
        } else {
            Ok(Some(url))
        }
    }

    /// Get the URL for viewing a PR in the browser.
    ///
    /// # Arguments
    /// * `worktree_path` - Path to the worktree
    ///
    /// # Returns
    /// The URL to view the PR, or an error if no PR exists.
    pub async fn get_pr_url(worktree_path: &str) -> ServiceResult<String> {
        Self::check_gh_auth_status()?;

        let output = Command::new("gh")
            .args(["pr", "view", "--json", "url", "--jq", ".url"])
            .current_dir(worktree_path)
            .output()
            .map_err(|e| ServiceError::Git(format!("Failed to get PR URL: {}", e)))?;

        if !output.status.success() {
            let stderr = String::from_utf8_lossy(&output.stderr);
            return Err(ServiceError::Git(format!(
                "No pull request found for current branch: {}",
                stderr.trim()
            )));
        }

        Ok(String::from_utf8_lossy(&output.stdout).trim().to_string())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_check_gh_cli_installed() {
        // This test just verifies the method doesn't panic
        // Result depends on whether gh is installed on the test machine
        let _result = GitHubService::check_gh_cli_installed();
    }

    #[test]
    fn test_check_gh_auth_status_when_not_installed() {
        // If gh is not installed, this should return an error
        // We can't easily mock the command, so this test is conditional
        if !GitHubService::check_gh_cli_installed() {
            let result = GitHubService::check_gh_auth_status();
            assert!(result.is_err());
            let err = result.unwrap_err();
            assert!(err.to_string().contains("not installed"));
        }
    }

    #[test]
    fn test_get_remote_url_invalid_path() {
        let result = GitHubService::get_remote_url("/nonexistent/path", None);
        assert!(result.is_err());
    }

    #[tokio::test]
    async fn test_get_existing_pr_returns_none_for_non_repo() {
        // For a non-git directory, should return None (not error)
        let result = GitHubService::get_existing_pr("/tmp", Some("main")).await;
        // This will error if gh is not installed, which is fine
        // If gh is installed, it should return None or an error about not being in a repo
        match result {
            Ok(None) => {} // Expected
            Ok(Some(_)) => panic!("Should not find PR in /tmp"),
            Err(_) => {} // Also acceptable - gh might not be installed
        }
    }

    // Integration tests that require gh to be installed and authenticated
    // These are marked with #[ignore] to not run in CI

    #[tokio::test]
    #[ignore = "requires gh CLI and authentication"]
    async fn test_create_pull_request_requires_worktree() {
        // This test would require a full database setup
        // Left as a placeholder for integration testing
    }
}
