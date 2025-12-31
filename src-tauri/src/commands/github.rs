//! Tauri commands for GitHub operations.
//!
//! These commands provide the IPC interface for GitHub-related operations,
//! primarily pull request creation using the GitHub CLI.

use tauri::State;

use crate::commands::AppState;
use crate::services::GitHubService;
use crate::types::PullRequestResult;

/// Request structure for creating a pull request.
#[derive(Debug, Clone, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreatePullRequestInput {
    /// The task ID to create a PR for.
    pub task_id: String,
    /// PR title (defaults to task title if not provided).
    pub title: Option<String>,
    /// PR body/description.
    pub body: Option<String>,
    /// Base branch to merge into (defaults to project's base_branch or "main").
    pub base: Option<String>,
    /// Whether to create as a draft PR.
    #[serde(default)]
    pub draft: bool,
}

/// Create a pull request for a task using the GitHub CLI.
///
/// This command:
/// 1. Verifies the GitHub CLI is installed and authenticated
/// 2. Gets the task's worktree path
/// 3. Pushes the branch to the remote
/// 4. Creates the PR using `gh pr create`
///
/// # Arguments
/// * `task_id` - The task to create a PR for
/// * `title` - PR title (defaults to task title)
/// * `body` - PR body/description
/// * `base` - Base branch to merge into (defaults to project's base_branch or "main")
/// * `draft` - Whether to create as a draft PR
///
/// # Returns
/// The result containing the PR URL, number, and branch name.
///
/// # Errors
/// Returns an error if:
/// - GitHub CLI is not installed
/// - User is not authenticated with GitHub
/// - Task has no active worktree
/// - Push to remote fails
/// - PR creation fails
#[tauri::command]
pub async fn create_pull_request(
    state: State<'_, AppState>,
    input: CreatePullRequestInput,
) -> Result<PullRequestResult, String> {
    let pool = state.db.lock().await;

    GitHubService::create_pull_request(
        &pool,
        &input.task_id,
        input.title,
        input.body,
        input.base,
        input.draft,
    )
    .await
    .map_err(|e| e.to_string())
}

/// Check if the GitHub CLI is installed and available.
///
/// # Returns
/// `true` if the `gh` CLI is installed and executable.
#[tauri::command]
pub fn check_gh_cli_installed() -> Result<bool, String> {
    GitHubService::check_gh_cli_installed().map_err(|e| e.to_string())
}

/// Check if the user is authenticated with GitHub CLI.
///
/// # Returns
/// Empty result on success, error message if not authenticated.
#[tauri::command]
pub fn check_gh_auth_status() -> Result<(), String> {
    GitHubService::check_gh_auth_status().map_err(|e| e.to_string())
}
