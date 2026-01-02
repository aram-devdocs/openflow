//! GitHub Routes
//!
//! REST API endpoints for GitHub operations (PRs, CLI status, etc.).

use axum::{
    extract::{Query, State},
    routing::{get, post},
    Json, Router,
};
use openflow_contracts::{CreatePullRequestRequest, PullRequestResult};
use openflow_core::services::github;
use serde::{Deserialize, Serialize};

use crate::{error::ServerResult, state::AppState};

/// Response for CLI installation check
#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CliInstalledResponse {
    pub installed: bool,
}

/// Response for authentication status
#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AuthStatusResponse {
    pub authenticated: bool,
}

/// Query parameters for remote URL
#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RemoteUrlQuery {
    pub worktree_path: String,
    pub remote: Option<String>,
}

/// Query parameters for existing PR
#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ExistingPrQuery {
    pub worktree_path: String,
    pub branch: Option<String>,
}

/// Query parameters for PR URL
#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PrUrlQuery {
    pub worktree_path: String,
}

/// Query parameters for PR details
#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PrDetailsQuery {
    pub worktree_path: String,
}

/// Create GitHub routes
pub fn routes() -> Router<AppState> {
    Router::new()
        .route("/cli/installed", get(check_cli_installed))
        .route("/cli/auth", get(check_auth_status))
        .route("/remote-url", get(get_remote_url))
        .route("/pr", post(create_pull_request))
        .route("/pr/existing", get(get_existing_pr))
        .route("/pr/url", get(get_pr_url))
        .route("/pr/details", get(get_pr_details))
}

/// GET /api/github/cli/installed
///
/// Check if GitHub CLI is installed.
async fn check_cli_installed() -> ServerResult<Json<CliInstalledResponse>> {
    let installed = github::check_gh_cli_installed()?;
    Ok(Json(CliInstalledResponse { installed }))
}

/// GET /api/github/cli/auth
///
/// Check GitHub CLI authentication status.
async fn check_auth_status() -> ServerResult<Json<AuthStatusResponse>> {
    // check_gh_auth_status returns () on success, error on failure
    let authenticated = github::check_gh_auth_status().is_ok();
    Ok(Json(AuthStatusResponse { authenticated }))
}

/// GET /api/github/remote-url?worktreePath=xxx&remote=xxx
///
/// Get the remote repository URL.
async fn get_remote_url(Query(query): Query<RemoteUrlQuery>) -> ServerResult<Json<String>> {
    let url = github::get_remote_url(&query.worktree_path, query.remote.as_deref())?;
    Ok(Json(url))
}

/// POST /api/github/pr
///
/// Create a pull request.
async fn create_pull_request(
    State(state): State<AppState>,
    Json(request): Json<CreatePullRequestRequest>,
) -> ServerResult<Json<PullRequestResult>> {
    let result = github::create_pull_request(&state.pool, request).await?;
    Ok(Json(result))
}

/// GET /api/github/pr/existing?worktreePath=xxx&branch=xxx
///
/// Check if a PR already exists for a branch.
async fn get_existing_pr(
    Query(query): Query<ExistingPrQuery>,
) -> ServerResult<Json<Option<String>>> {
    let pr_url =
        github::get_existing_pr(&query.worktree_path, query.branch.as_deref()).await?;
    Ok(Json(pr_url))
}

/// GET /api/github/pr/url?worktreePath=xxx
///
/// Get the URL for viewing the current branch's PR.
async fn get_pr_url(Query(query): Query<PrUrlQuery>) -> ServerResult<Json<String>> {
    let url = github::get_pr_url(&query.worktree_path).await?;
    Ok(Json(url))
}

/// GET /api/github/pr/details?worktreePath=xxx
///
/// Get PR details as JSON.
async fn get_pr_details(
    Query(query): Query<PrDetailsQuery>,
) -> ServerResult<Json<Option<serde_json::Value>>> {
    let details = github::get_pr_details(&query.worktree_path).await?;
    Ok(Json(details))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_routes_creation() {
        let _routes: Router<AppState> = routes();
    }

    #[test]
    fn test_response_serialization() {
        let response = CliInstalledResponse { installed: true };
        let json = serde_json::to_string(&response).unwrap();
        assert!(json.contains("\"installed\":true"));
    }
}
