//! Process Routes
//!
//! REST API endpoints for process management operations.
//!
//! # Endpoints
//!
//! - `GET /api/processes` - List processes with optional filters
//! - `GET /api/processes/running` - List all running processes
//! - `GET /api/processes/:id` - Get a process by ID
//! - `DELETE /api/processes/:id` - Delete a process record
//! - `POST /api/processes/:id/kill` - Kill a running process
//! - `POST /api/processes/:id/input` - Send input to a process
//! - `POST /api/processes/:id/resize` - Resize a process terminal

use axum::{
    extract::{Path, Query, State},
    routing::{get, post},
    Json, Router,
};
use openflow_contracts::ExecutionProcess;
use openflow_core::events::{EntityType, Event};
use openflow_core::services::process;
use serde::Deserialize;

use crate::{error::ServerResult, state::AppState};

/// Query parameters for listing processes
#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ListProcessesQuery {
    /// Filter by chat ID
    pub chat_id: Option<String>,
    /// Show only running processes
    pub running_only: Option<bool>,
}

/// Request body for sending input
#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SendInputRequest {
    pub input: String,
}

/// Request body for resizing terminal
#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ResizeRequest {
    pub cols: u16,
    pub rows: u16,
}

/// Create process routes
pub fn routes() -> Router<AppState> {
    Router::new()
        .route("/", get(list))
        .route("/running", get(list_running))
        .route("/:id", get(get_one).delete(delete_one))
        .route("/:id/kill", post(kill))
        .route("/:id/input", post(send_input))
        .route("/:id/resize", post(resize))
}

/// GET /api/processes
///
/// List processes with optional filters.
async fn list(
    State(state): State<AppState>,
    Query(query): Query<ListProcessesQuery>,
) -> ServerResult<Json<Vec<ExecutionProcess>>> {
    let processes = if let Some(chat_id) = query.chat_id {
        process::list_by_chat(&state.pool, &chat_id).await?
    } else if query.running_only.unwrap_or(false) {
        process::list_running(&state.pool).await?
    } else {
        process::list(&state.pool).await?
    };
    Ok(Json(processes))
}

/// GET /api/processes/running
///
/// List all running processes.
async fn list_running(State(state): State<AppState>) -> ServerResult<Json<Vec<ExecutionProcess>>> {
    let processes = process::list_running(&state.pool).await?;
    Ok(Json(processes))
}

/// GET /api/processes/{id}
///
/// Get a process by ID.
async fn get_one(
    State(state): State<AppState>,
    Path(id): Path<String>,
) -> ServerResult<Json<ExecutionProcess>> {
    let proc = process::get(&state.pool, &id).await?;
    Ok(Json(proc))
}

/// DELETE /api/processes/{id}
///
/// Delete a process record by ID.
async fn delete_one(State(state): State<AppState>, Path(id): Path<String>) -> ServerResult<()> {
    process::delete(&state.pool, &id).await?;

    // Broadcast data changed event
    state.broadcast(Event::deleted(EntityType::Process, id));

    Ok(())
}

/// POST /api/processes/{id}/kill
///
/// Kill a running process.
async fn kill(
    State(state): State<AppState>,
    Path(id): Path<String>,
) -> ServerResult<Json<ExecutionProcess>> {
    let proc = state.process_service.kill(&state.pool, &id).await?;

    // Broadcast status change event
    state.broadcast(Event::process_status(
        id,
        openflow_core::events::ProcessStatus::Killed,
        None,
    ));

    Ok(Json(proc))
}

/// POST /api/processes/{id}/input
///
/// Send input to a running process.
async fn send_input(
    State(state): State<AppState>,
    Path(id): Path<String>,
    Json(request): Json<SendInputRequest>,
) -> ServerResult<()> {
    state.process_service.send_input(&id, &request.input)?;
    Ok(())
}

/// POST /api/processes/{id}/resize
///
/// Resize a process terminal.
async fn resize(
    State(state): State<AppState>,
    Path(id): Path<String>,
    Json(request): Json<ResizeRequest>,
) -> ServerResult<()> {
    state
        .process_service
        .resize(&id, request.cols, request.rows)?;
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use axum::{
        body::Body,
        http::{Request, StatusCode},
        Router,
    };
    use openflow_contracts::{
        CreateChatRequest, CreateProcessRequest, CreateProjectRequest, CreateTaskRequest,
        ProcessStatus,
    };
    use openflow_core::events::NullBroadcaster;
    use openflow_core::services::{chat, process::ProcessService, project, task};
    use sqlx::SqlitePool;
    use std::sync::Arc;
    use tower::util::ServiceExt;

    /// Test context that provides a shared pool and ability to create new app instances
    struct TestContext {
        pool: SqlitePool,
    }

    impl TestContext {
        async fn new() -> Self {
            let pool = openflow_db::create_test_db().await.unwrap();
            Self { pool }
        }

        /// Create a new app instance with this context's pool
        fn app(&self) -> Router {
            let process_service = Arc::new(ProcessService::new());
            let broadcaster: Arc<dyn openflow_core::events::EventBroadcaster> =
                Arc::new(NullBroadcaster);
            let client_manager = crate::ws::ClientManager::new();
            let state = AppState::new(
                self.pool.clone(),
                process_service,
                broadcaster,
                client_manager,
            );
            Router::new().nest("/processes", routes()).with_state(state)
        }

        /// Create a test project and return its ID
        async fn create_project(&self, name: &str) -> String {
            let request = CreateProjectRequest {
                name: name.to_string(),
                git_repo_path: format!("/path/to/{}", name.to_lowercase().replace(' ', "-")),
                base_branch: None,
                setup_script: None,
                dev_script: None,
                cleanup_script: None,
                copy_files: None,
                icon: None,
                rule_folders: None,
                always_included_rules: None,
                workflows_folder: None,
                verification_config: None,
            };
            project::create(&self.pool, request)
                .await
                .expect("Failed to create test project")
                .id
        }

        /// Create a test chat and return its ID
        async fn create_chat(&self) -> String {
            let project_id = self.create_project("Test Project").await;
            let task_request = CreateTaskRequest {
                project_id: project_id.clone(),
                title: "Test Task".to_string(),
                ..Default::default()
            };
            let task_result = task::create(&self.pool, task_request)
                .await
                .expect("Failed to create task");

            let chat_request = CreateChatRequest {
                task_id: Some(task_result.id.clone()),
                project_id,
                title: Some("Test Chat".to_string()),
                ..Default::default()
            };
            chat::create(&self.pool, chat_request)
                .await
                .expect("Failed to create chat")
                .id
        }

        /// Create a test process and return it
        async fn create_process(
            &self,
            chat_id: &str,
            action: &str,
        ) -> openflow_contracts::ExecutionProcess {
            let request = CreateProcessRequest::terminal(chat_id, action);
            process::create(&self.pool, request)
                .await
                .expect("Failed to create process")
        }
    }

    // =========================================================================
    // Unit Tests
    // =========================================================================

    #[test]
    fn test_routes_creation() {
        let _routes: Router<AppState> = routes();
    }

    #[test]
    fn test_list_query_deserialization() {
        let json = r#"{"chatId": "123", "runningOnly": true}"#;
        let query: ListProcessesQuery = serde_json::from_str(json).unwrap();
        assert_eq!(query.chat_id, Some("123".to_string()));
        assert_eq!(query.running_only, Some(true));
    }

    #[test]
    fn test_list_query_empty() {
        let json = r#"{}"#;
        let query: ListProcessesQuery = serde_json::from_str(json).unwrap();
        assert_eq!(query.chat_id, None);
        assert_eq!(query.running_only, None);
    }

    #[test]
    fn test_resize_request_deserialization() {
        let json = r#"{"cols": 80, "rows": 24}"#;
        let request: ResizeRequest = serde_json::from_str(json).unwrap();
        assert_eq!(request.cols, 80);
        assert_eq!(request.rows, 24);
    }

    #[test]
    fn test_send_input_request_deserialization() {
        let json = r#"{"input": "hello\n"}"#;
        let request: SendInputRequest = serde_json::from_str(json).unwrap();
        assert_eq!(request.input, "hello\n");
    }

    // =========================================================================
    // Integration Tests
    // =========================================================================

    #[tokio::test]
    async fn test_list_processes_empty() {
        let ctx = TestContext::new().await;

        let response = ctx
            .app()
            .oneshot(
                Request::builder()
                    .method("GET")
                    .uri("/processes")
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::OK);

        let body = axum::body::to_bytes(response.into_body(), usize::MAX)
            .await
            .unwrap();
        let processes: Vec<ExecutionProcess> = serde_json::from_slice(&body).unwrap();

        assert!(processes.is_empty());
    }

    #[tokio::test]
    async fn test_list_processes() {
        let ctx = TestContext::new().await;
        let chat_id = ctx.create_chat().await;

        // Create some processes
        ctx.create_process(&chat_id, "Process 1").await;
        ctx.create_process(&chat_id, "Process 2").await;

        let response = ctx
            .app()
            .oneshot(
                Request::builder()
                    .method("GET")
                    .uri("/processes")
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::OK);

        let body = axum::body::to_bytes(response.into_body(), usize::MAX)
            .await
            .unwrap();
        let processes: Vec<ExecutionProcess> = serde_json::from_slice(&body).unwrap();

        assert_eq!(processes.len(), 2);
    }

    #[tokio::test]
    async fn test_list_processes_by_chat() {
        let ctx = TestContext::new().await;
        let chat_id = ctx.create_chat().await;

        // Create processes for this chat
        ctx.create_process(&chat_id, "Process 1").await;
        ctx.create_process(&chat_id, "Process 2").await;

        let response = ctx
            .app()
            .oneshot(
                Request::builder()
                    .method("GET")
                    .uri(format!("/processes?chatId={}", chat_id))
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::OK);

        let body = axum::body::to_bytes(response.into_body(), usize::MAX)
            .await
            .unwrap();
        let processes: Vec<ExecutionProcess> = serde_json::from_slice(&body).unwrap();

        assert_eq!(processes.len(), 2);
        for p in &processes {
            assert_eq!(p.chat_id, chat_id);
        }
    }

    #[tokio::test]
    async fn test_list_processes_running_only() {
        let ctx = TestContext::new().await;
        let chat_id = ctx.create_chat().await;

        // Create two processes
        let proc1 = ctx.create_process(&chat_id, "Process 1").await;
        let _proc2 = ctx.create_process(&chat_id, "Process 2").await;

        // Complete one process
        process::complete(&ctx.pool, &proc1.id, 0)
            .await
            .expect("Failed to complete process");

        // List only running processes
        let response = ctx
            .app()
            .oneshot(
                Request::builder()
                    .method("GET")
                    .uri("/processes?runningOnly=true")
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::OK);

        let body = axum::body::to_bytes(response.into_body(), usize::MAX)
            .await
            .unwrap();
        let processes: Vec<ExecutionProcess> = serde_json::from_slice(&body).unwrap();

        assert_eq!(processes.len(), 1);
        assert_eq!(processes[0].status, ProcessStatus::Running);
    }

    #[tokio::test]
    async fn test_list_running_processes() {
        let ctx = TestContext::new().await;
        let chat_id = ctx.create_chat().await;

        // Create two processes
        let proc1 = ctx.create_process(&chat_id, "Process 1").await;
        let _proc2 = ctx.create_process(&chat_id, "Process 2").await;

        // Complete one process
        process::complete(&ctx.pool, &proc1.id, 0)
            .await
            .expect("Failed to complete process");

        // List running processes via dedicated endpoint
        let response = ctx
            .app()
            .oneshot(
                Request::builder()
                    .method("GET")
                    .uri("/processes/running")
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::OK);

        let body = axum::body::to_bytes(response.into_body(), usize::MAX)
            .await
            .unwrap();
        let processes: Vec<ExecutionProcess> = serde_json::from_slice(&body).unwrap();

        assert_eq!(processes.len(), 1);
        assert_eq!(processes[0].status, ProcessStatus::Running);
    }

    #[tokio::test]
    async fn test_get_process() {
        let ctx = TestContext::new().await;
        let chat_id = ctx.create_chat().await;
        let created = ctx.create_process(&chat_id, "Test Process").await;

        let response = ctx
            .app()
            .oneshot(
                Request::builder()
                    .method("GET")
                    .uri(format!("/processes/{}", created.id))
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::OK);

        let body = axum::body::to_bytes(response.into_body(), usize::MAX)
            .await
            .unwrap();
        let process: ExecutionProcess = serde_json::from_slice(&body).unwrap();

        assert_eq!(process.id, created.id);
        assert_eq!(process.chat_id, chat_id);
        assert_eq!(process.executor_action, "Test Process");
        assert_eq!(process.status, ProcessStatus::Running);
    }

    #[tokio::test]
    async fn test_get_process_not_found() {
        let ctx = TestContext::new().await;

        let response = ctx
            .app()
            .oneshot(
                Request::builder()
                    .method("GET")
                    .uri("/processes/non-existent-id")
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::NOT_FOUND);
    }

    #[tokio::test]
    async fn test_delete_process() {
        let ctx = TestContext::new().await;
        let chat_id = ctx.create_chat().await;
        let created = ctx.create_process(&chat_id, "To Delete").await;

        // Delete the process
        let response = ctx
            .app()
            .oneshot(
                Request::builder()
                    .method("DELETE")
                    .uri(format!("/processes/{}", created.id))
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::OK);

        // Verify it's deleted
        let get_response = ctx
            .app()
            .oneshot(
                Request::builder()
                    .method("GET")
                    .uri(format!("/processes/{}", created.id))
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();

        assert_eq!(get_response.status(), StatusCode::NOT_FOUND);
    }

    #[tokio::test]
    async fn test_delete_process_not_found() {
        let ctx = TestContext::new().await;

        let response = ctx
            .app()
            .oneshot(
                Request::builder()
                    .method("DELETE")
                    .uri("/processes/non-existent-id")
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::NOT_FOUND);
    }

    #[tokio::test]
    async fn test_kill_process() {
        let ctx = TestContext::new().await;
        let chat_id = ctx.create_chat().await;
        let created = ctx.create_process(&chat_id, "To Kill").await;

        // Kill the process
        let response = ctx
            .app()
            .oneshot(
                Request::builder()
                    .method("POST")
                    .uri(format!("/processes/{}/kill", created.id))
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::OK);

        let body = axum::body::to_bytes(response.into_body(), usize::MAX)
            .await
            .unwrap();
        let process: ExecutionProcess = serde_json::from_slice(&body).unwrap();

        assert_eq!(process.status, ProcessStatus::Killed);
        assert!(process.completed_at.is_some());
    }

    #[tokio::test]
    async fn test_kill_process_not_found() {
        let ctx = TestContext::new().await;

        let response = ctx
            .app()
            .oneshot(
                Request::builder()
                    .method("POST")
                    .uri("/processes/non-existent-id/kill")
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::NOT_FOUND);
    }

    #[tokio::test]
    async fn test_kill_already_completed_process() {
        let ctx = TestContext::new().await;
        let chat_id = ctx.create_chat().await;
        let created = ctx.create_process(&chat_id, "Completed").await;

        // Complete the process first
        process::complete(&ctx.pool, &created.id, 0)
            .await
            .expect("Failed to complete process");

        // Try to kill the completed process
        let response = ctx
            .app()
            .oneshot(
                Request::builder()
                    .method("POST")
                    .uri(format!("/processes/{}/kill", created.id))
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();

        // Should fail with bad request (validation error)
        assert_eq!(response.status(), StatusCode::BAD_REQUEST);
    }

    #[tokio::test]
    async fn test_send_input() {
        let ctx = TestContext::new().await;
        let chat_id = ctx.create_chat().await;
        let created = ctx.create_process(&chat_id, "Input Test").await;

        // Note: This will fail because there's no actual PTY process running,
        // but we're testing the route works and returns appropriate error
        let response = ctx
            .app()
            .oneshot(
                Request::builder()
                    .method("POST")
                    .uri(format!("/processes/{}/input", created.id))
                    .header("Content-Type", "application/json")
                    .body(Body::from(r#"{"input": "hello\n"}"#))
                    .unwrap(),
            )
            .await
            .unwrap();

        // Since we don't have an actual PTY, this should return an error
        // The process exists but there's no PTY to send input to
        assert!(
            response.status() == StatusCode::INTERNAL_SERVER_ERROR
                || response.status() == StatusCode::OK
        );
    }

    #[tokio::test]
    async fn test_resize() {
        let ctx = TestContext::new().await;
        let chat_id = ctx.create_chat().await;
        let created = ctx.create_process(&chat_id, "Resize Test").await;

        // Note: This will fail because there's no actual PTY process running,
        // but we're testing the route works and returns appropriate error
        let response = ctx
            .app()
            .oneshot(
                Request::builder()
                    .method("POST")
                    .uri(format!("/processes/{}/resize", created.id))
                    .header("Content-Type", "application/json")
                    .body(Body::from(r#"{"cols": 120, "rows": 40}"#))
                    .unwrap(),
            )
            .await
            .unwrap();

        // Since we don't have an actual PTY, this should return an error
        // The process exists but there's no PTY to resize
        assert!(
            response.status() == StatusCode::INTERNAL_SERVER_ERROR
                || response.status() == StatusCode::OK
        );
    }

    #[tokio::test]
    async fn test_list_processes_order() {
        let ctx = TestContext::new().await;
        let chat_id = ctx.create_chat().await;

        // Create processes in order with small delays to ensure distinct timestamps
        let proc1 = ctx.create_process(&chat_id, "Process 1").await;
        tokio::time::sleep(tokio::time::Duration::from_millis(10)).await;
        let proc2 = ctx.create_process(&chat_id, "Process 2").await;
        tokio::time::sleep(tokio::time::Duration::from_millis(10)).await;
        let proc3 = ctx.create_process(&chat_id, "Process 3").await;

        let response = ctx
            .app()
            .oneshot(
                Request::builder()
                    .method("GET")
                    .uri("/processes")
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::OK);

        let body = axum::body::to_bytes(response.into_body(), usize::MAX)
            .await
            .unwrap();
        let processes: Vec<ExecutionProcess> = serde_json::from_slice(&body).unwrap();

        // Should be ordered by created_at DESC (newest first)
        assert_eq!(processes.len(), 3);
        assert_eq!(processes[0].id, proc3.id);
        assert_eq!(processes[1].id, proc2.id);
        assert_eq!(processes[2].id, proc1.id);
    }

    #[tokio::test]
    async fn test_process_status_transitions() {
        let ctx = TestContext::new().await;
        let chat_id = ctx.create_chat().await;
        let created = ctx.create_process(&chat_id, "Status Test").await;

        // Initial status should be Running
        assert_eq!(created.status, ProcessStatus::Running);

        // Get via HTTP
        let response = ctx
            .app()
            .oneshot(
                Request::builder()
                    .method("GET")
                    .uri(format!("/processes/{}", created.id))
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();

        let body = axum::body::to_bytes(response.into_body(), usize::MAX)
            .await
            .unwrap();
        let process: ExecutionProcess = serde_json::from_slice(&body).unwrap();

        assert_eq!(process.status, ProcessStatus::Running);
        assert!(process.completed_at.is_none());
    }
}
