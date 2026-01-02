//! Git Routes
//!
//! REST API endpoints for git operations (worktrees, diff, commits, etc.).
//!
//! # Endpoints
//!
//! ## Worktree Management
//! - `GET /api/git/worktrees?repoPath=...` - List worktrees for a repository
//! - `POST /api/git/worktrees` - Create a new worktree
//! - `POST /api/git/worktrees/delete` - Delete a worktree
//!
//! ## Diff Operations
//! - `GET /api/git/diff?worktreePath=...` - Get uncommitted changes diff
//! - `GET /api/git/diff/task?taskId=...` - Get diff for a task's worktree
//!
//! ## Commit Operations
//! - `GET /api/git/commits?worktreePath=...&limit=...` - Get commit history
//! - `GET /api/git/commits/task?taskId=...&limit=...` - Get commits for a task
//!
//! ## Branch Operations
//! - `POST /api/git/push` - Push branch to remote
//! - `GET /api/git/branch?worktreePath=...` - Get current branch name
//! - `GET /api/git/head?worktreePath=...` - Get HEAD commit hash
//! - `GET /api/git/changes?worktreePath=...` - Check for uncommitted changes
//!
//! ## Branch/Path Generation
//! - `POST /api/git/generate-branch-name` - Generate OpenFlow branch name
//! - `POST /api/git/generate-worktree-path` - Generate worktree path

use axum::{
    extract::{Query, State},
    routing::{get, post},
    Json, Router,
};
use openflow_contracts::{Commit, FileDiff, Worktree};
use openflow_core::events::{EntityType, Event};
use openflow_core::services::git;
use serde::Deserialize;

use crate::{error::ServerResult, state::AppState};

/// Query parameters for listing worktrees
#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ListWorktreesQuery {
    /// Repository path
    pub repo_path: String,
}

/// Request body for creating a worktree
#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateWorktreeRequest {
    pub repo_path: String,
    pub branch_name: String,
    pub base_branch: String,
    pub worktree_path: String,
}

/// Request body for deleting a worktree
#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DeleteWorktreeRequest {
    pub repo_path: String,
    pub worktree_path: String,
}

/// Query parameters for getting diff
#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct GetDiffQuery {
    pub worktree_path: String,
}

/// Query parameters for getting task diff
#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct GetTaskDiffQuery {
    pub task_id: String,
}

/// Query parameters for getting commits
#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct GetCommitsQuery {
    pub worktree_path: String,
    pub limit: Option<usize>,
}

/// Query parameters for getting task commits
#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct GetTaskCommitsQuery {
    pub task_id: String,
    pub limit: Option<usize>,
}

/// Request body for pushing a branch
#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PushBranchRequest {
    pub worktree_path: String,
    pub remote: Option<String>,
}

/// Query parameters for getting current branch
#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct GetBranchQuery {
    pub worktree_path: String,
}

/// Query parameters for checking uncommitted changes
#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct HasChangesQuery {
    pub worktree_path: String,
}

/// Request body for generating branch name
#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct GenerateBranchNameRequest {
    pub task_id: String,
    pub chat_role: String,
}

/// Request body for generating worktree path
#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct GenerateWorktreePathRequest {
    pub base_path: String,
    pub project_id: String,
    pub task_id: String,
    pub chat_role: String,
}

/// Create git routes
pub fn routes() -> Router<AppState> {
    Router::new()
        .route("/worktrees", get(list_worktrees).post(create_worktree))
        .route("/worktrees/delete", post(delete_worktree))
        .route("/diff", get(get_diff))
        .route("/diff/task", get(get_task_diff))
        .route("/commits", get(get_commits))
        .route("/commits/task", get(get_task_commits))
        .route("/push", post(push_branch))
        .route("/branch", get(get_current_branch))
        .route("/head", get(get_head_commit))
        .route("/changes", get(has_uncommitted_changes))
        .route("/generate-branch-name", post(generate_branch_name))
        .route("/generate-worktree-path", post(generate_worktree_path))
}

/// GET /api/git/worktrees?repoPath=xxx
///
/// List worktrees for a repository.
async fn list_worktrees(
    Query(query): Query<ListWorktreesQuery>,
) -> ServerResult<Json<Vec<Worktree>>> {
    let worktrees = git::list_worktrees(&query.repo_path).await?;
    Ok(Json(worktrees))
}

/// POST /api/git/worktrees
///
/// Create a new worktree. Returns the path to the created worktree.
async fn create_worktree(
    State(state): State<AppState>,
    Json(request): Json<CreateWorktreeRequest>,
) -> ServerResult<Json<String>> {
    let worktree_path = git::create_worktree(
        &request.repo_path,
        &request.branch_name,
        &request.base_branch,
        &request.worktree_path,
    )
    .await?;

    // Broadcast data changed event
    state.broadcast(Event::created(
        EntityType::Worktree,
        worktree_path.clone(),
        &worktree_path,
    ));

    Ok(Json(worktree_path))
}

/// POST /api/git/worktrees/delete
///
/// Delete a worktree.
async fn delete_worktree(
    State(state): State<AppState>,
    Json(request): Json<DeleteWorktreeRequest>,
) -> ServerResult<()> {
    git::delete_worktree(&request.repo_path, &request.worktree_path).await?;

    // Broadcast data changed event
    state.broadcast(Event::deleted(EntityType::Worktree, request.worktree_path));

    Ok(())
}

/// GET /api/git/diff?worktreePath=xxx
///
/// Get diff for uncommitted changes.
async fn get_diff(Query(query): Query<GetDiffQuery>) -> ServerResult<Json<Vec<FileDiff>>> {
    let diffs = git::get_diff(&query.worktree_path).await?;
    Ok(Json(diffs))
}

/// GET /api/git/diff/task?taskId=xxx
///
/// Get diff for a task's worktree.
async fn get_task_diff(
    State(state): State<AppState>,
    Query(query): Query<GetTaskDiffQuery>,
) -> ServerResult<Json<Vec<FileDiff>>> {
    let diffs = git::get_task_diff(&state.pool, &query.task_id).await?;
    Ok(Json(diffs))
}

/// GET /api/git/commits?worktreePath=xxx&limit=10
///
/// Get commits for a worktree.
async fn get_commits(Query(query): Query<GetCommitsQuery>) -> ServerResult<Json<Vec<Commit>>> {
    let commits = git::get_commits(&query.worktree_path, query.limit).await?;
    Ok(Json(commits))
}

/// GET /api/git/commits/task?taskId=xxx&limit=10
///
/// Get commits for a task's worktree.
async fn get_task_commits(
    State(state): State<AppState>,
    Query(query): Query<GetTaskCommitsQuery>,
) -> ServerResult<Json<Vec<Commit>>> {
    let commits = git::get_task_commits(&state.pool, &query.task_id, query.limit).await?;
    Ok(Json(commits))
}

/// POST /api/git/push
///
/// Push branch to remote.
async fn push_branch(Json(request): Json<PushBranchRequest>) -> ServerResult<()> {
    git::push_branch(&request.worktree_path, request.remote.as_deref()).await?;
    Ok(())
}

/// GET /api/git/branch?worktreePath=xxx
///
/// Get current branch name.
async fn get_current_branch(Query(query): Query<GetBranchQuery>) -> ServerResult<Json<String>> {
    let branch = git::get_current_branch(&query.worktree_path).await?;
    Ok(Json(branch))
}

/// GET /api/git/head?worktreePath=xxx
///
/// Get HEAD commit hash.
async fn get_head_commit(
    Query(query): Query<GetBranchQuery>,
) -> ServerResult<Json<Option<String>>> {
    let commit = git::get_head_commit(&query.worktree_path).await?;
    Ok(Json(commit))
}

/// GET /api/git/changes?worktreePath=xxx
///
/// Check for uncommitted changes.
async fn has_uncommitted_changes(Query(query): Query<HasChangesQuery>) -> ServerResult<Json<bool>> {
    let has_changes = git::has_uncommitted_changes(&query.worktree_path).await?;
    Ok(Json(has_changes))
}

/// POST /api/git/generate-branch-name
///
/// Generate OpenFlow branch name.
async fn generate_branch_name(
    Json(request): Json<GenerateBranchNameRequest>,
) -> ServerResult<Json<String>> {
    let name = git::generate_branch_name(&request.task_id, &request.chat_role)?;
    Ok(Json(name))
}

/// POST /api/git/generate-worktree-path
///
/// Generate worktree path.
async fn generate_worktree_path(
    Json(request): Json<GenerateWorktreePathRequest>,
) -> ServerResult<Json<String>> {
    // generate_worktree_path returns a String, not a Result
    let path = git::generate_worktree_path(
        &request.base_path,
        &request.project_id,
        &request.task_id,
        &request.chat_role,
    );
    Ok(Json(path))
}

#[cfg(test)]
mod tests {
    use super::*;
    use axum::{
        body::Body,
        http::{Request, StatusCode},
        Router,
    };
    use openflow_core::events::NullBroadcaster;
    use openflow_core::services::process::ProcessService;
    use sqlx::SqlitePool;
    use std::fs;
    use std::process::Command as StdCommand;
    use std::sync::Arc;
    use tempfile::TempDir;
    use tower::util::ServiceExt;

    /// Helper to create test app state
    async fn test_state() -> AppState {
        let pool = openflow_db::create_test_db().await.unwrap();
        let process_service = Arc::new(ProcessService::new());
        let broadcaster: Arc<dyn openflow_core::events::EventBroadcaster> =
            Arc::new(NullBroadcaster);
        let client_manager = crate::ws::ClientManager::new();
        AppState::new(pool, process_service, broadcaster, client_manager)
    }

    /// Helper to create a test router with git routes
    async fn test_router() -> Router {
        let state = test_state().await;
        Router::new().nest("/git", routes()).with_state(state)
    }

    /// Test context that provides a shared pool and ability to create new app instances
    struct TestContext {
        pool: SqlitePool,
    }

    impl TestContext {
        async fn new() -> Self {
            let pool = openflow_db::create_test_db().await.unwrap();
            Self { pool }
        }

        fn app(&self) -> Router {
            let process_service = Arc::new(ProcessService::new());
            let broadcaster: Arc<dyn openflow_core::events::EventBroadcaster> =
                Arc::new(NullBroadcaster);
            let client_manager = crate::ws::ClientManager::new();
            let state = AppState::new(self.pool.clone(), process_service, broadcaster, client_manager);
            Router::new().nest("/git", routes()).with_state(state)
        }
    }

    /// Helper to create a test git repository
    fn setup_test_repo() -> TempDir {
        let temp_dir = TempDir::new().expect("Failed to create temp dir");
        let repo_path = temp_dir.path();

        // Initialize git repo
        StdCommand::new("git")
            .args(["init"])
            .current_dir(repo_path)
            .output()
            .expect("Failed to init git repo");

        // Configure git user for commits
        StdCommand::new("git")
            .args(["config", "user.email", "test@example.com"])
            .current_dir(repo_path)
            .output()
            .expect("Failed to configure git email");

        StdCommand::new("git")
            .args(["config", "user.name", "Test User"])
            .current_dir(repo_path)
            .output()
            .expect("Failed to configure git name");

        // Create initial commit
        let readme_path = repo_path.join("README.md");
        fs::write(&readme_path, "# Test Repository\n").expect("Failed to create README");

        StdCommand::new("git")
            .args(["add", "."])
            .current_dir(repo_path)
            .output()
            .expect("Failed to stage files");

        StdCommand::new("git")
            .args(["commit", "-m", "Initial commit"])
            .current_dir(repo_path)
            .output()
            .expect("Failed to create initial commit");

        temp_dir
    }

    // =========================================================================
    // Route Creation Tests
    // =========================================================================

    #[test]
    fn test_routes_creation() {
        let _routes: Router<AppState> = routes();
    }

    // =========================================================================
    // Query/Request Deserialization Tests
    // =========================================================================

    #[test]
    fn test_list_worktrees_query_deserialization() {
        let json = r#"{"repoPath": "/path/to/repo"}"#;
        let query: ListWorktreesQuery = serde_json::from_str(json).unwrap();
        assert_eq!(query.repo_path, "/path/to/repo");
    }

    #[test]
    fn test_create_worktree_request_deserialization() {
        let json = r#"{
            "repoPath": "/repo",
            "branchName": "openflow/task1/main",
            "baseBranch": "main",
            "worktreePath": "/worktrees/task1"
        }"#;
        let request: CreateWorktreeRequest = serde_json::from_str(json).unwrap();
        assert_eq!(request.repo_path, "/repo");
        assert_eq!(request.branch_name, "openflow/task1/main");
        assert_eq!(request.base_branch, "main");
        assert_eq!(request.worktree_path, "/worktrees/task1");
    }

    #[test]
    fn test_delete_worktree_request_deserialization() {
        let json = r#"{"repoPath": "/repo", "worktreePath": "/worktrees/task1"}"#;
        let request: DeleteWorktreeRequest = serde_json::from_str(json).unwrap();
        assert_eq!(request.repo_path, "/repo");
        assert_eq!(request.worktree_path, "/worktrees/task1");
    }

    #[test]
    fn test_get_diff_query_deserialization() {
        let json = r#"{"worktreePath": "/worktrees/task1"}"#;
        let query: GetDiffQuery = serde_json::from_str(json).unwrap();
        assert_eq!(query.worktree_path, "/worktrees/task1");
    }

    #[test]
    fn test_get_commits_query_deserialization() {
        let json = r#"{"worktreePath": "/worktrees/task1", "limit": 20}"#;
        let query: GetCommitsQuery = serde_json::from_str(json).unwrap();
        assert_eq!(query.worktree_path, "/worktrees/task1");
        assert_eq!(query.limit, Some(20));
    }

    #[test]
    fn test_get_commits_query_without_limit() {
        let json = r#"{"worktreePath": "/worktrees/task1"}"#;
        let query: GetCommitsQuery = serde_json::from_str(json).unwrap();
        assert!(query.limit.is_none());
    }

    #[test]
    fn test_push_branch_request_deserialization() {
        let json = r#"{"worktreePath": "/worktrees/task1", "remote": "upstream"}"#;
        let request: PushBranchRequest = serde_json::from_str(json).unwrap();
        assert_eq!(request.worktree_path, "/worktrees/task1");
        assert_eq!(request.remote, Some("upstream".to_string()));
    }

    #[test]
    fn test_push_branch_request_without_remote() {
        let json = r#"{"worktreePath": "/worktrees/task1"}"#;
        let request: PushBranchRequest = serde_json::from_str(json).unwrap();
        assert!(request.remote.is_none());
    }

    #[test]
    fn test_generate_branch_name_request_deserialization() {
        let json = r#"{"taskId": "task123", "chatRole": "main"}"#;
        let request: GenerateBranchNameRequest = serde_json::from_str(json).unwrap();
        assert_eq!(request.task_id, "task123");
        assert_eq!(request.chat_role, "main");
    }

    #[test]
    fn test_generate_worktree_path_request_deserialization() {
        let json = r#"{
            "basePath": "~/.openflow/worktrees",
            "projectId": "proj1",
            "taskId": "task1",
            "chatRole": "main"
        }"#;
        let request: GenerateWorktreePathRequest = serde_json::from_str(json).unwrap();
        assert_eq!(request.base_path, "~/.openflow/worktrees");
        assert_eq!(request.project_id, "proj1");
        assert_eq!(request.task_id, "task1");
        assert_eq!(request.chat_role, "main");
    }

    // =========================================================================
    // Branch Name Generation Tests
    // =========================================================================

    #[tokio::test]
    async fn test_generate_branch_name_endpoint() {
        let app = test_router().await;

        let request_body = serde_json::json!({
            "taskId": "task123",
            "chatRole": "main"
        });

        let response = app
            .oneshot(
                Request::builder()
                    .method("POST")
                    .uri("/git/generate-branch-name")
                    .header("Content-Type", "application/json")
                    .body(Body::from(request_body.to_string()))
                    .unwrap(),
            )
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::OK);

        let body = axum::body::to_bytes(response.into_body(), usize::MAX)
            .await
            .unwrap();
        let branch_name: String = serde_json::from_slice(&body).unwrap();

        assert_eq!(branch_name, "openflow/task123/main");
    }

    #[tokio::test]
    async fn test_generate_branch_name_with_uppercase_role() {
        let app = test_router().await;

        let request_body = serde_json::json!({
            "taskId": "task456",
            "chatRole": "REVIEW"
        });

        let response = app
            .oneshot(
                Request::builder()
                    .method("POST")
                    .uri("/git/generate-branch-name")
                    .header("Content-Type", "application/json")
                    .body(Body::from(request_body.to_string()))
                    .unwrap(),
            )
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::OK);

        let body = axum::body::to_bytes(response.into_body(), usize::MAX)
            .await
            .unwrap();
        let branch_name: String = serde_json::from_slice(&body).unwrap();

        // Should be lowercased
        assert_eq!(branch_name, "openflow/task456/review");
    }

    // =========================================================================
    // Worktree Path Generation Tests
    // =========================================================================

    #[tokio::test]
    async fn test_generate_worktree_path_endpoint() {
        let app = test_router().await;

        let request_body = serde_json::json!({
            "basePath": "/tmp/worktrees",
            "projectId": "proj1",
            "taskId": "task123",
            "chatRole": "main"
        });

        let response = app
            .oneshot(
                Request::builder()
                    .method("POST")
                    .uri("/git/generate-worktree-path")
                    .header("Content-Type", "application/json")
                    .body(Body::from(request_body.to_string()))
                    .unwrap(),
            )
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::OK);

        let body = axum::body::to_bytes(response.into_body(), usize::MAX)
            .await
            .unwrap();
        let path: String = serde_json::from_slice(&body).unwrap();

        assert_eq!(path, "/tmp/worktrees/proj1/task123-main");
    }

    // =========================================================================
    // Worktree Operations Tests
    // =========================================================================

    #[tokio::test]
    async fn test_list_worktrees() {
        let temp_dir = setup_test_repo();
        let repo_path = temp_dir.path().to_str().unwrap();
        let app = test_router().await;

        let response = app
            .oneshot(
                Request::builder()
                    .method("GET")
                    .uri(format!("/git/worktrees?repoPath={}", repo_path))
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::OK);

        let body = axum::body::to_bytes(response.into_body(), usize::MAX)
            .await
            .unwrap();
        let worktrees: Vec<Worktree> = serde_json::from_slice(&body).unwrap();

        // Should have at least the main worktree
        assert!(!worktrees.is_empty());
        assert!(worktrees[0].is_main);
    }

    #[tokio::test]
    async fn test_create_and_delete_worktree() {
        let temp_dir = setup_test_repo();
        let repo_path = temp_dir.path().to_str().unwrap();

        // Get the current branch name
        let output = StdCommand::new("git")
            .args(["-C", repo_path, "rev-parse", "--abbrev-ref", "HEAD"])
            .output()
            .expect("Failed to get branch");
        let base_branch = String::from_utf8_lossy(&output.stdout).trim().to_string();

        let worktree_temp = TempDir::new().expect("Failed to create worktree temp dir");
        let worktree_path = worktree_temp
            .path()
            .join("test-worktree")
            .to_str()
            .unwrap()
            .to_string();

        let unique_id = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_nanos();
        let branch_name = format!("openflow/test-{}/main", unique_id);

        let ctx = TestContext::new().await;

        // Create worktree
        let create_body = serde_json::json!({
            "repoPath": repo_path,
            "branchName": branch_name,
            "baseBranch": base_branch,
            "worktreePath": worktree_path
        });

        let response = ctx
            .app()
            .oneshot(
                Request::builder()
                    .method("POST")
                    .uri("/git/worktrees")
                    .header("Content-Type", "application/json")
                    .body(Body::from(create_body.to_string()))
                    .unwrap(),
            )
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::OK);

        let body = axum::body::to_bytes(response.into_body(), usize::MAX)
            .await
            .unwrap();
        let created_path: String = serde_json::from_slice(&body).unwrap();
        assert_eq!(created_path, worktree_path);

        // Verify worktree directory exists
        assert!(std::path::Path::new(&worktree_path).exists());

        // Delete worktree
        let delete_body = serde_json::json!({
            "repoPath": repo_path,
            "worktreePath": worktree_path
        });

        let response = ctx
            .app()
            .oneshot(
                Request::builder()
                    .method("POST")
                    .uri("/git/worktrees/delete")
                    .header("Content-Type", "application/json")
                    .body(Body::from(delete_body.to_string()))
                    .unwrap(),
            )
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::OK);
    }

    // =========================================================================
    // Diff Tests
    // =========================================================================

    #[tokio::test]
    async fn test_get_diff_no_changes() {
        let temp_dir = setup_test_repo();
        let repo_path = temp_dir.path().to_str().unwrap();
        let app = test_router().await;

        let response = app
            .oneshot(
                Request::builder()
                    .method("GET")
                    .uri(format!("/git/diff?worktreePath={}", repo_path))
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::OK);

        let body = axum::body::to_bytes(response.into_body(), usize::MAX)
            .await
            .unwrap();
        let diffs: Vec<FileDiff> = serde_json::from_slice(&body).unwrap();

        // No uncommitted changes
        assert!(diffs.is_empty());
    }

    #[tokio::test]
    async fn test_get_diff_with_changes() {
        let temp_dir = setup_test_repo();
        let repo_path = temp_dir.path().to_str().unwrap();

        // Modify a file
        let readme_path = temp_dir.path().join("README.md");
        fs::write(&readme_path, "# Test Repository\n\nModified content\n").unwrap();

        let app = test_router().await;

        let response = app
            .oneshot(
                Request::builder()
                    .method("GET")
                    .uri(format!("/git/diff?worktreePath={}", repo_path))
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::OK);

        let body = axum::body::to_bytes(response.into_body(), usize::MAX)
            .await
            .unwrap();
        let diffs: Vec<FileDiff> = serde_json::from_slice(&body).unwrap();

        assert!(!diffs.is_empty());
        assert_eq!(diffs[0].path, "README.md");
    }

    // =========================================================================
    // Commits Tests
    // =========================================================================

    #[tokio::test]
    async fn test_get_commits() {
        let temp_dir = setup_test_repo();
        let repo_path = temp_dir.path().to_str().unwrap();
        let app = test_router().await;

        let response = app
            .oneshot(
                Request::builder()
                    .method("GET")
                    .uri(format!("/git/commits?worktreePath={}&limit=10", repo_path))
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::OK);

        let body = axum::body::to_bytes(response.into_body(), usize::MAX)
            .await
            .unwrap();
        let commits: Vec<Commit> = serde_json::from_slice(&body).unwrap();

        // Should have at least the initial commit
        assert!(!commits.is_empty());
        assert!(commits[0].message.contains("Initial commit"));
    }

    #[tokio::test]
    async fn test_get_commits_without_limit() {
        let temp_dir = setup_test_repo();
        let repo_path = temp_dir.path().to_str().unwrap();
        let app = test_router().await;

        let response = app
            .oneshot(
                Request::builder()
                    .method("GET")
                    .uri(format!("/git/commits?worktreePath={}", repo_path))
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::OK);
    }

    // =========================================================================
    // Branch Tests
    // =========================================================================

    #[tokio::test]
    async fn test_get_current_branch() {
        let temp_dir = setup_test_repo();
        let repo_path = temp_dir.path().to_str().unwrap();
        let app = test_router().await;

        let response = app
            .oneshot(
                Request::builder()
                    .method("GET")
                    .uri(format!("/git/branch?worktreePath={}", repo_path))
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::OK);

        let body = axum::body::to_bytes(response.into_body(), usize::MAX)
            .await
            .unwrap();
        let branch: String = serde_json::from_slice(&body).unwrap();

        // Should be a non-empty branch name (usually "main" or "master")
        assert!(!branch.is_empty());
    }

    #[tokio::test]
    async fn test_get_head_commit() {
        let temp_dir = setup_test_repo();
        let repo_path = temp_dir.path().to_str().unwrap();
        let app = test_router().await;

        let response = app
            .oneshot(
                Request::builder()
                    .method("GET")
                    .uri(format!("/git/head?worktreePath={}", repo_path))
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::OK);

        let body = axum::body::to_bytes(response.into_body(), usize::MAX)
            .await
            .unwrap();
        let commit: Option<String> = serde_json::from_slice(&body).unwrap();

        // Should have a HEAD commit (40 char SHA)
        assert!(commit.is_some());
        assert_eq!(commit.unwrap().len(), 40);
    }

    // =========================================================================
    // Uncommitted Changes Tests
    // =========================================================================

    #[tokio::test]
    async fn test_has_uncommitted_changes_false() {
        let temp_dir = setup_test_repo();
        let repo_path = temp_dir.path().to_str().unwrap();
        let app = test_router().await;

        let response = app
            .oneshot(
                Request::builder()
                    .method("GET")
                    .uri(format!("/git/changes?worktreePath={}", repo_path))
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::OK);

        let body = axum::body::to_bytes(response.into_body(), usize::MAX)
            .await
            .unwrap();
        let has_changes: bool = serde_json::from_slice(&body).unwrap();

        assert!(!has_changes);
    }

    #[tokio::test]
    async fn test_has_uncommitted_changes_true() {
        let temp_dir = setup_test_repo();
        let repo_path = temp_dir.path().to_str().unwrap();

        // Create an uncommitted change
        let new_file = temp_dir.path().join("new_file.txt");
        fs::write(&new_file, "new content").unwrap();

        let app = test_router().await;

        let response = app
            .oneshot(
                Request::builder()
                    .method("GET")
                    .uri(format!("/git/changes?worktreePath={}", repo_path))
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::OK);

        let body = axum::body::to_bytes(response.into_body(), usize::MAX)
            .await
            .unwrap();
        let has_changes: bool = serde_json::from_slice(&body).unwrap();

        assert!(has_changes);
    }
}
