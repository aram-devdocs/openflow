//! GitHub service for pull request operations.
//!
//! This service wraps the GitHub CLI (`gh`) to create pull requests
//! from task worktrees. It handles authentication status checking,
//! branch pushing, and PR creation.
//!
//! # Logging
//!
//! This service uses structured logging at the following levels:
//! - `debug`: Function entry, intermediate steps, command execution details
//! - `info`: Successful operations (PR created, auth verified, CLI found)
//! - `warn`: Expected failures (CLI not installed, not authenticated)
//! - `error`: Unexpected failures with full context
//!
//! # Error Handling
//!
//! All public functions return `ServiceResult<T>` and provide detailed
//! error context including task_id, branch names, and command output.

use std::process::Command;

use log::{debug, error, info, warn};
use sqlx::SqlitePool;

use openflow_contracts::{CreatePullRequestRequest, PullRequestResult};

use super::{git, project, task, ServiceError, ServiceResult};

/// Maximum allowed length for PR titles (GitHub's limit is around 256)
const MAX_PR_TITLE_LENGTH: usize = 256;

/// Maximum allowed length for PR body (GitHub allows up to 65536 for body)
const MAX_PR_BODY_LENGTH: usize = 65536;

/// Validate PR title for security and API constraints.
///
/// - Must not be empty
/// - Must not exceed 256 characters
/// - Must not contain control characters (except newlines/tabs in body)
fn validate_pr_title(title: &str) -> ServiceResult<()> {
    debug!(
        "Validating PR title: length={}, preview='{}'",
        title.len(),
        title.chars().take(50).collect::<String>()
    );

    if title.is_empty() {
        warn!("PR title validation failed: title is empty");
        return Err(ServiceError::Validation(
            "Pull request title cannot be empty".to_string(),
        ));
    }

    if title.len() > MAX_PR_TITLE_LENGTH {
        warn!(
            "PR title validation failed: length {} exceeds maximum {}",
            title.len(),
            MAX_PR_TITLE_LENGTH
        );
        return Err(ServiceError::Validation(format!(
            "Pull request title exceeds maximum length of {} characters",
            MAX_PR_TITLE_LENGTH
        )));
    }

    // Check for control characters (but allow printable characters and common whitespace)
    if title.chars().any(|c| c.is_control() && c != '\t') {
        warn!("PR title validation failed: contains control characters");
        return Err(ServiceError::Validation(
            "Pull request title contains invalid control characters".to_string(),
        ));
    }

    debug!("PR title validation passed");
    Ok(())
}

/// Validate PR body for security and API constraints.
fn validate_pr_body(body: &str) -> ServiceResult<()> {
    debug!("Validating PR body: length={}", body.len());

    if body.len() > MAX_PR_BODY_LENGTH {
        warn!(
            "PR body validation failed: length {} exceeds maximum {}",
            body.len(),
            MAX_PR_BODY_LENGTH
        );
        return Err(ServiceError::Validation(format!(
            "Pull request body exceeds maximum length of {} characters",
            MAX_PR_BODY_LENGTH
        )));
    }

    // Body can contain newlines and tabs, but not other control characters
    if body
        .chars()
        .any(|c| c.is_control() && c != '\n' && c != '\r' && c != '\t')
    {
        warn!("PR body validation failed: contains control characters");
        return Err(ServiceError::Validation(
            "Pull request body contains invalid control characters".to_string(),
        ));
    }

    debug!("PR body validation passed");
    Ok(())
}

/// Check if the `gh` CLI is installed and available.
///
/// # Returns
/// `Ok(true)` if `gh` is installed and executable, `Ok(false)` otherwise.
pub fn check_gh_cli_installed() -> ServiceResult<bool> {
    debug!("Checking if GitHub CLI (gh) is installed");

    let result = Command::new("gh")
        .arg("--version")
        .output()
        .map(|output| {
            if output.status.success() {
                let version = String::from_utf8_lossy(&output.stdout);
                debug!(
                    "GitHub CLI version: {}",
                    version.lines().next().unwrap_or("unknown")
                );
                true
            } else {
                false
            }
        })
        .unwrap_or(false);

    if result {
        info!("GitHub CLI is installed and available");
    } else {
        warn!("GitHub CLI (gh) is not installed or not in PATH");
    }

    Ok(result)
}

/// Check if the user is authenticated with GitHub CLI.
///
/// # Returns
/// `Ok(())` if authenticated, `Err` with a descriptive message if not.
pub fn check_gh_auth_status() -> ServiceResult<()> {
    debug!("Checking GitHub CLI authentication status");

    if !check_gh_cli_installed()? {
        error!("GitHub CLI is not installed, cannot check authentication");
        return Err(ServiceError::Validation(
            "GitHub CLI (gh) is not installed. Please install it from https://cli.github.com/"
                .to_string(),
        ));
    }

    debug!("Running 'gh auth status' command");
    let output = Command::new("gh")
        .args(["auth", "status"])
        .output()
        .map_err(|e| {
            error!("Failed to execute gh auth status: {}", e);
            ServiceError::Git(format!("Failed to run gh auth status: {}", e))
        })?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        warn!(
            "GitHub CLI not authenticated: {}",
            stderr.lines().next().unwrap_or("unknown error")
        );
        return Err(ServiceError::Validation(format!(
            "Not authenticated with GitHub. Run 'gh auth login' to authenticate. Error: {}",
            stderr.trim()
        )));
    }

    info!("GitHub CLI is authenticated");
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
    debug!(
        "Getting remote URL: worktree_path='{}', remote='{}'",
        worktree_path, remote
    );

    let output = Command::new("git")
        .args(["-C", worktree_path, "remote", "get-url", remote])
        .output()
        .map_err(|e| {
            error!(
                "Failed to execute git remote get-url: worktree_path='{}', error={}",
                worktree_path, e
            );
            ServiceError::Git(format!("Failed to get remote URL: {}", e))
        })?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        error!(
            "Failed to get remote URL: worktree_path='{}', remote='{}', error={}",
            worktree_path,
            remote,
            stderr.trim()
        );
        return Err(ServiceError::Git(format!(
            "Failed to get remote URL for '{}': {}",
            remote,
            stderr.trim()
        )));
    }

    let url = String::from_utf8_lossy(&output.stdout).trim().to_string();
    debug!("Retrieved remote URL: remote='{}', url='{}'", remote, url);
    Ok(url)
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
/// * `request` - The pull request creation request
///
/// # Returns
/// The result containing the PR URL, number, and branch name.
pub async fn create_pull_request(
    pool: &SqlitePool,
    request: CreatePullRequestRequest,
) -> ServiceResult<PullRequestResult> {
    info!(
        "Creating pull request: task_id='{}', has_title={}, has_body={}, has_base={}, draft={}",
        request.task_id,
        request.title.is_some(),
        request.body.is_some(),
        request.base.is_some(),
        request.draft
    );

    // 1. Check gh CLI is available and authenticated
    debug!("Step 1: Checking GitHub CLI authentication");
    check_gh_auth_status()?;

    // 2. Get the task with its chats to find the worktree
    debug!(
        "Step 2: Fetching task and chats: task_id='{}'",
        request.task_id
    );
    let task_with_chats = task::get(pool, &request.task_id).await?;
    let task_entity = &task_with_chats.task;
    debug!(
        "Found task: title='{}', project_id='{}', chat_count={}",
        task_entity.title,
        task_entity.project_id,
        task_with_chats.chats.len()
    );

    // 3. Find the worktree path from the task's chats
    debug!("Step 3: Finding active worktree from chats");
    let worktree_path = task_with_chats
        .chats
        .iter()
        .filter(|c| c.worktree_path.is_some() && !c.worktree_deleted)
        .min_by_key(|c| c.workflow_step_index.unwrap_or(i32::MAX))
        .and_then(|c| c.worktree_path.clone())
        .ok_or_else(|| {
            error!(
                "No active worktree found for task: task_id='{}', task_title='{}'",
                request.task_id, task_entity.title
            );
            ServiceError::Validation(
                "Task has no active worktree. Cannot create PR without a worktree.".to_string(),
            )
        })?;
    debug!("Found worktree: path='{}'", worktree_path);

    // 4. Get project for default base branch
    debug!(
        "Step 4: Fetching project for base branch: project_id='{}'",
        task_entity.project_id
    );
    let project_entity = project::get(pool, &task_entity.project_id).await?;
    debug!(
        "Found project: name='{}', base_branch='{}'",
        project_entity.name, project_entity.base_branch
    );

    // 5. Determine the title (default to task title) with validation
    let pr_title = request.title.unwrap_or_else(|| task_entity.title.clone());
    debug!("Step 5: Using PR title='{}'", pr_title);

    // Validate PR title
    validate_pr_title(&pr_title)?;

    // 6. Determine the base branch (prefer: param > task > project > "main")
    let base_branch = request
        .base
        .or_else(|| task_entity.base_branch.clone())
        .unwrap_or_else(|| {
            if project_entity.base_branch.is_empty() {
                "main".to_string()
            } else {
                project_entity.base_branch.clone()
            }
        });
    debug!("Step 6: Using base branch='{}'", base_branch);

    // 7. Get current branch name
    debug!("Step 7: Getting current branch name");
    let branch = git::get_current_branch(&worktree_path).await?;
    debug!("Current branch: '{}'", branch);

    // 8. Push the branch to remote (with set-upstream)
    debug!("Step 8: Pushing branch to remote");
    git::push_branch(&worktree_path, None).await?;
    debug!("Branch pushed successfully");

    // 9. Build the gh pr create command
    debug!("Step 9: Building gh pr create command");
    let mut args = vec![
        "pr".to_string(),
        "create".to_string(),
        "--title".to_string(),
        pr_title.clone(),
        "--base".to_string(),
        base_branch.clone(),
    ];

    // Add body if provided, with validation
    if let Some(body_text) = request.body {
        validate_pr_body(&body_text)?;
        args.push("--body".to_string());
        args.push(body_text);
        debug!("PR body provided and validated");
    } else {
        // Use empty body if not provided
        args.push("--body".to_string());
        args.push(String::new());
        debug!("No PR body provided, using empty body");
    }

    // Add draft flag if requested
    if request.draft {
        args.push("--draft".to_string());
        debug!("Creating as draft PR");
    }

    // 10. Run gh pr create
    debug!(
        "Step 10: Running 'gh pr create' in worktree: path='{}'",
        worktree_path
    );
    let output = Command::new("gh")
        .args(&args)
        .current_dir(&worktree_path)
        .output()
        .map_err(|e| {
            error!(
                "Failed to execute gh pr create: task_id='{}', error={}",
                request.task_id, e
            );
            ServiceError::Git(format!("Failed to run gh pr create: {}", e))
        })?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        error!(
            "gh pr create failed: task_id='{}', branch='{}', base='{}', error={}",
            request.task_id,
            branch,
            base_branch,
            stderr.trim()
        );
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

    info!(
        "Pull request created successfully: task_id='{}', pr_number={}, branch='{}', url='{}'",
        request.task_id, number, branch, url
    );

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
    debug!(
        "Checking for existing PR: worktree_path='{}', branch={:?}",
        worktree_path, branch
    );

    check_gh_auth_status()?;

    // Get current branch if not specified
    let branch_name = match branch {
        Some(b) => b.to_string(),
        None => {
            debug!("No branch specified, getting current branch");
            git::get_current_branch(worktree_path).await?
        }
    };
    debug!("Checking for PRs with head branch: '{}'", branch_name);

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
        .map_err(|e| {
            error!(
                "Failed to execute gh pr list: worktree_path='{}', branch='{}', error={}",
                worktree_path, branch_name, e
            );
            ServiceError::Git(format!("Failed to check for existing PR: {}", e))
        })?;

    if !output.status.success() {
        // gh pr list can fail if not in a github repo, which is fine
        debug!(
            "gh pr list returned non-success (may not be a GitHub repo): branch='{}'",
            branch_name
        );
        return Ok(None);
    }

    let url = String::from_utf8_lossy(&output.stdout).trim().to_string();
    if url.is_empty() {
        debug!("No existing PR found for branch: '{}'", branch_name);
        Ok(None)
    } else {
        info!(
            "Found existing PR for branch '{}': url='{}'",
            branch_name, url
        );
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
    debug!("Getting PR URL for worktree: path='{}'", worktree_path);

    check_gh_auth_status()?;

    debug!("Running 'gh pr view' command");
    let output = Command::new("gh")
        .args(["pr", "view", "--json", "url", "--jq", ".url"])
        .current_dir(worktree_path)
        .output()
        .map_err(|e| {
            error!(
                "Failed to execute gh pr view: worktree_path='{}', error={}",
                worktree_path, e
            );
            ServiceError::Git(format!("Failed to get PR URL: {}", e))
        })?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        warn!(
            "No PR found for current branch in worktree: path='{}', error={}",
            worktree_path,
            stderr.lines().next().unwrap_or("unknown error")
        );
        return Err(ServiceError::Git(format!(
            "No pull request found for current branch: {}",
            stderr.trim()
        )));
    }

    let url = String::from_utf8_lossy(&output.stdout).trim().to_string();
    info!(
        "Retrieved PR URL: worktree_path='{}', url='{}'",
        worktree_path, url
    );
    Ok(url)
}

/// Get PR details for a worktree.
///
/// # Arguments
/// * `worktree_path` - Path to the worktree
///
/// # Returns
/// The PR details as JSON, or None if no PR exists.
pub async fn get_pr_details(worktree_path: &str) -> ServiceResult<Option<serde_json::Value>> {
    debug!("Getting PR details for worktree: path='{}'", worktree_path);

    check_gh_auth_status()?;

    let output = Command::new("gh")
        .args([
            "pr",
            "view",
            "--json",
            "url,number,title,state,author,createdAt,updatedAt,additions,deletions,changedFiles",
        ])
        .current_dir(worktree_path)
        .output()
        .map_err(|e| {
            error!(
                "Failed to execute gh pr view: worktree_path='{}', error={}",
                worktree_path, e
            );
            ServiceError::Git(format!("Failed to get PR details: {}", e))
        })?;

    if !output.status.success() {
        debug!("No PR found for current branch in worktree");
        return Ok(None);
    }

    let stdout = String::from_utf8_lossy(&output.stdout);
    let details: serde_json::Value = serde_json::from_str(&stdout).map_err(|e| {
        error!("Failed to parse PR details JSON: {}", e);
        ServiceError::Internal(format!("Failed to parse PR details: {}", e))
    })?;

    info!(
        "Retrieved PR details for worktree: path='{}'",
        worktree_path
    );
    Ok(Some(details))
}

#[cfg(test)]
mod tests {
    use super::*;

    // Title validation tests
    #[test]
    fn test_validate_pr_title_valid() {
        assert!(validate_pr_title("Add new feature").is_ok());
        assert!(validate_pr_title("Fix: bug in login").is_ok());
        assert!(validate_pr_title("Update README.md with examples").is_ok());
    }

    #[test]
    fn test_validate_pr_title_empty() {
        let result = validate_pr_title("");
        assert!(result.is_err());
        assert!(result.unwrap_err().to_string().contains("cannot be empty"));
    }

    #[test]
    fn test_validate_pr_title_too_long() {
        let long_title = "a".repeat(257);
        let result = validate_pr_title(&long_title);
        assert!(result.is_err());
        assert!(result.unwrap_err().to_string().contains("exceeds maximum"));
    }

    #[test]
    fn test_validate_pr_title_control_characters() {
        let result = validate_pr_title("Title with\x00null");
        assert!(result.is_err());
        assert!(result
            .unwrap_err()
            .to_string()
            .contains("control characters"));

        let result = validate_pr_title("Title with\x07bell");
        assert!(result.is_err());
    }

    #[test]
    fn test_validate_pr_title_allows_tab() {
        // Tabs are allowed in titles
        assert!(validate_pr_title("Title\twith\ttabs").is_ok());
    }

    // Body validation tests
    #[test]
    fn test_validate_pr_body_valid() {
        assert!(validate_pr_body("This is a PR body").is_ok());
        assert!(validate_pr_body("Body with\nnewlines").is_ok());
        assert!(validate_pr_body("Body with\ttabs").is_ok());
        assert!(validate_pr_body("Body with\r\nwindows newlines").is_ok());
    }

    #[test]
    fn test_validate_pr_body_too_long() {
        let long_body = "a".repeat(65537);
        let result = validate_pr_body(&long_body);
        assert!(result.is_err());
        assert!(result.unwrap_err().to_string().contains("exceeds maximum"));
    }

    #[test]
    fn test_validate_pr_body_control_characters() {
        let result = validate_pr_body("Body with\x00null");
        assert!(result.is_err());
        assert!(result
            .unwrap_err()
            .to_string()
            .contains("control characters"));
    }

    #[test]
    fn test_check_gh_cli_installed() {
        // This test just verifies the method doesn't panic
        // Result depends on whether gh is installed on the test machine
        let _result = check_gh_cli_installed().unwrap();
    }

    #[test]
    fn test_check_gh_auth_status_when_not_installed() {
        // If gh is not installed, this should return an error
        // We can't easily mock the command, so this test is conditional
        if !check_gh_cli_installed().unwrap_or(false) {
            let result = check_gh_auth_status();
            assert!(result.is_err());
            let err = result.unwrap_err();
            assert!(err.to_string().contains("not installed"));
        }
    }

    #[test]
    fn test_get_remote_url_invalid_path() {
        let result = get_remote_url("/nonexistent/path", None);
        assert!(result.is_err());
    }

    #[tokio::test]
    async fn test_get_existing_pr_returns_none_for_non_repo() {
        // For a non-git directory, should return None (not error)
        let result = get_existing_pr("/tmp", Some("main")).await;
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
