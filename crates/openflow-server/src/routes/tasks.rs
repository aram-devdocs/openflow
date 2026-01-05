//! Task Routes
//!
//! REST API endpoints for task CRUD operations, artifact management,
//! task execution control, task steps, and permission handling.

use axum::{
    extract::{Path, Query, State},
    routing::{get, post},
    Json, Router,
};
use openflow_contracts::{
    AgentEventRecord, ArtifactFile, CreateStepRequest, CreateTaskRequest, Permission, Task,
    TaskStatus, TaskStep, TaskWithChats, TaskWithSteps, UpdateTaskRequest,
};
use openflow_core::events::{EntityType, Event};
use openflow_core::services::{agent_session, artifact, task};
use serde::Deserialize;

use crate::{error::ServerResult, state::AppState};

/// Query parameters for listing tasks
#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ListTasksQuery {
    /// Filter by project ID (required)
    pub project_id: String,
    /// Filter by status
    pub status: Option<TaskStatus>,
    /// Include archived tasks
    pub include_archived: Option<bool>,
}

/// Create task routes
pub fn routes() -> Router<AppState> {
    Router::new()
        // Basic CRUD
        .route("/", get(list).post(create))
        .route("/:id", get(get_one).patch(update).delete(delete_one))
        .route("/:id/archive", post(archive))
        .route("/:id/unarchive", post(unarchive))
        .route("/:id/duplicate", post(duplicate))
        // Execution routes
        .route("/:id/with-steps", get(get_with_steps))
        .route("/:id/start", post(start_task))
        .route("/:id/pause", post(pause_task))
        .route("/:id/resume", post(resume_task))
        .route("/:id/cancel", post(cancel_task))
        .route("/:id/running", get(is_running))
        // Step routes
        .route("/:id/steps", get(list_steps).post(create_step))
        .route("/:id/steps/:step_id", get(get_step).delete(delete_step))
        // Event routes
        .route("/:id/steps/:step_index/events", get(get_step_events))
        // Permission routes
        .route("/:id/permissions/pending", get(get_pending_permission))
        .route(
            "/:id/permissions/:permission_id/respond",
            post(respond_to_permission),
        )
        // Running tasks list (no ID needed)
        .route("/running", get(list_running))
        .route("/running/count", get(running_count))
        // Artifact routes (using camelCase path params to match frontend)
        .route("/:taskId/artifacts", get(list_artifacts))
        .route("/:taskId/artifacts/:fileName", get(read_artifact))
}

/// GET /api/tasks?projectId=xxx&status=xxx&includeArchived=true
///
/// List tasks with project filter and optional status filter.
async fn list(
    State(state): State<AppState>,
    Query(query): Query<ListTasksQuery>,
) -> ServerResult<Json<Vec<Task>>> {
    let tasks = task::list(
        &state.pool,
        &query.project_id,
        query.status,
        query.include_archived.unwrap_or(false),
    )
    .await?;
    Ok(Json(tasks))
}

/// GET /api/tasks/{id}
///
/// Get a task by ID with its associated chats.
async fn get_one(
    State(state): State<AppState>,
    Path(id): Path<String>,
) -> ServerResult<Json<TaskWithChats>> {
    let task_with_chats = task::get(&state.pool, &id).await?;
    Ok(Json(task_with_chats))
}

/// POST /api/tasks
///
/// Create a new task.
async fn create(
    State(state): State<AppState>,
    Json(request): Json<CreateTaskRequest>,
) -> ServerResult<Json<Task>> {
    let task = task::create(&state.pool, request).await?;

    // Broadcast data changed event
    state.broadcast(Event::created(EntityType::Task, task.id.clone(), &task));

    Ok(Json(task))
}

/// PATCH /api/tasks/{id}
///
/// Update an existing task.
async fn update(
    State(state): State<AppState>,
    Path(id): Path<String>,
    Json(request): Json<UpdateTaskRequest>,
) -> ServerResult<Json<Task>> {
    let task = task::update(&state.pool, &id, request).await?;

    // Broadcast data changed event
    state.broadcast(Event::updated(EntityType::Task, task.id.clone(), &task));

    Ok(Json(task))
}

/// DELETE /api/tasks/{id}
///
/// Delete a task by ID.
async fn delete_one(State(state): State<AppState>, Path(id): Path<String>) -> ServerResult<()> {
    task::delete(&state.pool, &id).await?;

    // Broadcast data changed event
    state.broadcast(Event::deleted(EntityType::Task, id));

    Ok(())
}

/// POST /api/tasks/{id}/archive
///
/// Archive a task.
async fn archive(
    State(state): State<AppState>,
    Path(id): Path<String>,
) -> ServerResult<Json<Task>> {
    let task = task::archive(&state.pool, &id).await?;

    // Broadcast data changed event
    state.broadcast(Event::updated(EntityType::Task, task.id.clone(), &task));

    Ok(Json(task))
}

/// POST /api/tasks/{id}/unarchive
///
/// Unarchive a task.
async fn unarchive(
    State(state): State<AppState>,
    Path(id): Path<String>,
) -> ServerResult<Json<Task>> {
    let task = task::unarchive(&state.pool, &id).await?;

    // Broadcast data changed event
    state.broadcast(Event::updated(EntityType::Task, task.id.clone(), &task));

    Ok(Json(task))
}

/// POST /api/tasks/{id}/duplicate
///
/// Duplicate a task.
async fn duplicate(
    State(state): State<AppState>,
    Path(id): Path<String>,
) -> ServerResult<Json<Task>> {
    let task = task::duplicate(&state.pool, &id).await?;

    // Broadcast data changed event
    state.broadcast(Event::created(EntityType::Task, task.id.clone(), &task));

    Ok(Json(task))
}

// =============================================================================
// Artifact Routes
// =============================================================================

/// GET /api/tasks/{taskId}/artifacts
///
/// List all artifacts for a task.
/// Returns files in the task's `.zenflow/tasks/{taskId}/` folder.
async fn list_artifacts(
    State(state): State<AppState>,
    Path(task_id): Path<String>,
) -> ServerResult<Json<Vec<ArtifactFile>>> {
    let artifacts = artifact::list(&state.pool, &task_id).await?;
    Ok(Json(artifacts))
}

/// GET /api/tasks/{taskId}/artifacts/{fileName}
///
/// Read the content of a specific artifact file.
async fn read_artifact(
    State(state): State<AppState>,
    Path((task_id, file_name)): Path<(String, String)>,
) -> ServerResult<String> {
    let content = artifact::read(&state.pool, &task_id, &file_name).await?;
    Ok(content)
}

// =============================================================================
// Task Execution Routes
// =============================================================================

/// GET /api/tasks/{id}/with-steps
///
/// Get a task with all its steps.
/// Returns the task along with all associated steps ordered by step_index.
async fn get_with_steps(
    State(state): State<AppState>,
    Path(id): Path<String>,
) -> ServerResult<Json<TaskWithSteps>> {
    let task_with_steps = task::get_with_steps(&state.pool, &id).await?;
    Ok(Json(task_with_steps))
}

/// POST /api/tasks/{id}/start
///
/// Start executing a task.
/// Validates the task can be started, updates status, and spawns background execution.
async fn start_task(
    State(state): State<AppState>,
    Path(id): Path<String>,
) -> ServerResult<Json<Task>> {
    let task = state.task_executor.start_task(&id).await?;

    // Broadcast data changed event
    state.broadcast(Event::updated(EntityType::Task, task.id.clone(), &task));

    Ok(Json(task))
}

/// POST /api/tasks/{id}/pause
///
/// Pause a running task.
/// Kills the current agent if running and marks the current step as failed.
async fn pause_task(
    State(state): State<AppState>,
    Path(id): Path<String>,
) -> ServerResult<Json<Task>> {
    let task = state.task_executor.pause_task(&id).await?;

    // Broadcast data changed event
    state.broadcast(Event::updated(EntityType::Task, task.id.clone(), &task));

    Ok(Json(task))
}

/// POST /api/tasks/{id}/resume
///
/// Resume a paused task.
/// Continues execution from the current step.
async fn resume_task(
    State(state): State<AppState>,
    Path(id): Path<String>,
) -> ServerResult<Json<Task>> {
    let task = state.task_executor.resume_task(&id).await?;

    // Broadcast data changed event
    state.broadcast(Event::updated(EntityType::Task, task.id.clone(), &task));

    Ok(Json(task))
}

/// POST /api/tasks/{id}/cancel
///
/// Cancel a task.
/// Kills the current agent and marks remaining steps as skipped.
async fn cancel_task(
    State(state): State<AppState>,
    Path(id): Path<String>,
) -> ServerResult<Json<Task>> {
    let task = state.task_executor.cancel_task(&id).await?;

    // Broadcast data changed event
    state.broadcast(Event::updated(EntityType::Task, task.id.clone(), &task));

    Ok(Json(task))
}

/// GET /api/tasks/{id}/running
///
/// Check if a task is currently running.
async fn is_running(
    State(state): State<AppState>,
    Path(id): Path<String>,
) -> ServerResult<Json<bool>> {
    let running = state.task_executor.is_running(&id).await;
    Ok(Json(running))
}

/// GET /api/tasks/running
///
/// List all currently running task IDs.
async fn list_running(State(state): State<AppState>) -> ServerResult<Json<Vec<String>>> {
    let running = state.task_executor.list_running().await;
    Ok(Json(running))
}

/// GET /api/tasks/running/count
///
/// Get the count of currently running tasks.
async fn running_count(State(state): State<AppState>) -> ServerResult<Json<usize>> {
    let count = state.task_executor.running_count().await;
    Ok(Json(count))
}

// =============================================================================
// Task Step Routes
// =============================================================================

/// GET /api/tasks/{id}/steps
///
/// List all steps for a task, ordered by step_index.
async fn list_steps(
    State(state): State<AppState>,
    Path(id): Path<String>,
) -> ServerResult<Json<Vec<TaskStep>>> {
    let steps = task::list_steps(&state.pool, &id).await?;
    Ok(Json(steps))
}

/// POST /api/tasks/{id}/steps
///
/// Create a new step for a task.
async fn create_step(
    State(state): State<AppState>,
    Path(id): Path<String>,
    Json(request): Json<CreateStepRequest>,
) -> ServerResult<Json<TaskStep>> {
    let step = task::create_step_from_request(&state.pool, &id, request).await?;

    // Broadcast data changed event
    state.broadcast(Event::created(EntityType::Step, step.id.clone(), &step));

    Ok(Json(step))
}

/// GET /api/tasks/{id}/steps/{step_id}
///
/// Get a specific step by ID.
async fn get_step(
    State(state): State<AppState>,
    Path((_id, step_id)): Path<(String, String)>,
) -> ServerResult<Json<TaskStep>> {
    let step = task::get_step(&state.pool, &step_id).await?;
    Ok(Json(step))
}

/// DELETE /api/tasks/{id}/steps/{step_id}
///
/// Delete a specific step.
async fn delete_step(
    State(state): State<AppState>,
    Path((_id, step_id)): Path<(String, String)>,
) -> ServerResult<()> {
    task::delete_step(&state.pool, &step_id).await?;

    // Broadcast data changed event
    state.broadcast(Event::deleted(EntityType::Step, step_id));

    Ok(())
}

// =============================================================================
// Task Event Routes
// =============================================================================

/// Query parameters for getting step events
#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct GetStepEventsQuery {
    /// Only return events with sequence > this value
    pub after_sequence: Option<i64>,
}

/// GET /api/tasks/{id}/steps/{step_index}/events
///
/// Get agent events for a task step.
/// Returns events for the session linked to the step at the given index.
async fn get_step_events(
    State(state): State<AppState>,
    Path((id, step_index)): Path<(String, i32)>,
    Query(query): Query<GetStepEventsQuery>,
) -> ServerResult<Json<Vec<AgentEventRecord>>> {
    // Get the task with steps
    let task_with_steps = task::get_with_steps(&state.pool, &id).await?;

    // Find the step at the given index
    let step = task_with_steps
        .steps
        .iter()
        .find(|s| s.step_index == step_index)
        .ok_or_else(|| {
            crate::error::ServerError::not_found(format!("Step at index {} not found", step_index))
        })?;

    // If step has no session, return empty vec
    let session_id = match &step.session_id {
        Some(id) => id,
        None => return Ok(Json(Vec::new())),
    };

    // Get events for the session
    let events = agent_session::get_events(&state.pool, session_id, query.after_sequence).await?;

    Ok(Json(events))
}

// =============================================================================
// Permission Routes
// =============================================================================

/// Request body for responding to a permission
#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RespondPermissionRequest {
    /// Whether to approve (true) or deny (false) the permission
    pub approved: bool,
}

/// GET /api/tasks/{id}/permissions/pending
///
/// Get the pending permission for a running task.
async fn get_pending_permission(
    State(state): State<AppState>,
    Path(id): Path<String>,
) -> ServerResult<Json<Option<Permission>>> {
    let permission = state.task_executor.get_pending_permission(&id).await?;
    Ok(Json(permission))
}

/// POST /api/tasks/{id}/permissions/{permission_id}/respond
///
/// Respond to a permission request for a running task.
async fn respond_to_permission(
    State(state): State<AppState>,
    Path((id, permission_id)): Path<(String, String)>,
    Json(request): Json<RespondPermissionRequest>,
) -> ServerResult<Json<Permission>> {
    let permission = state
        .task_executor
        .respond_to_permission(&id, &permission_id, request.approved)
        .await?;

    // Broadcast data changed event
    state.broadcast(Event::updated(
        EntityType::Permission,
        permission.id.clone(),
        &permission,
    ));

    Ok(Json(permission))
}

#[cfg(test)]
mod tests {
    use super::*;
    use axum::{
        body::Body,
        http::{Request, StatusCode},
        Router,
    };
    use openflow_contracts::CreateProjectRequest;
    use openflow_core::events::NullBroadcaster;
    use openflow_core::services::{process::ProcessService, project};
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
            Router::new().nest("/tasks", routes()).with_state(state)
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
    }

    #[test]
    fn test_routes_creation() {
        let _routes: Router<AppState> = routes();
    }

    #[test]
    fn test_list_query_deserialization() {
        let json = r#"{"projectId": "123", "includeArchived": true}"#;
        let query: ListTasksQuery = serde_json::from_str(json).unwrap();
        assert_eq!(query.project_id, "123");
        assert_eq!(query.include_archived, Some(true));
    }

    #[test]
    fn test_list_query_with_status() {
        let json = r#"{"projectId": "123", "status": "pending"}"#;
        let query: ListTasksQuery = serde_json::from_str(json).unwrap();
        assert_eq!(query.project_id, "123");
        assert_eq!(query.status, Some(TaskStatus::Pending));
    }

    #[tokio::test]
    async fn test_list_tasks_empty() {
        let ctx = TestContext::new().await;
        let project_id = ctx.create_project("Test Project").await;

        let response = ctx
            .app()
            .oneshot(
                Request::builder()
                    .method("GET")
                    .uri(format!("/tasks?projectId={}", project_id))
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::OK);

        let body = axum::body::to_bytes(response.into_body(), usize::MAX)
            .await
            .unwrap();
        let tasks: Vec<Task> = serde_json::from_slice(&body).unwrap();

        assert!(tasks.is_empty());
    }

    #[tokio::test]
    async fn test_create_task() {
        let ctx = TestContext::new().await;
        let project_id = ctx.create_project("Test Project").await;

        let request_body = serde_json::json!({
            "projectId": project_id,
            "title": "Test Task"
        });

        let response = ctx
            .app()
            .oneshot(
                Request::builder()
                    .method("POST")
                    .uri("/tasks")
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
        let task: Task = serde_json::from_slice(&body).unwrap();

        assert_eq!(task.title, "Test Task");
        assert_eq!(task.project_id, project_id);
        assert_eq!(task.status, TaskStatus::Pending);
        assert!(!task.id.is_empty());
    }

    #[tokio::test]
    async fn test_create_task_with_all_fields() {
        let ctx = TestContext::new().await;
        let project_id = ctx.create_project("Test Project").await;

        let request_body = serde_json::json!({
            "projectId": project_id,
            "title": "Full Task",
            "description": "A complete task description",
            "workflowTemplate": "feature",
            "baseBranch": "develop"
        });

        let response = ctx
            .app()
            .oneshot(
                Request::builder()
                    .method("POST")
                    .uri("/tasks")
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
        let task: Task = serde_json::from_slice(&body).unwrap();

        assert_eq!(task.title, "Full Task");
        assert_eq!(
            task.description,
            Some("A complete task description".to_string())
        );
        assert_eq!(task.workflow_template, Some("feature".to_string()));
        assert_eq!(task.base_branch, Some("develop".to_string()));
    }

    #[tokio::test]
    async fn test_get_task() {
        let ctx = TestContext::new().await;
        let project_id = ctx.create_project("Test Project").await;

        // Create a task first via HTTP
        let create_body = serde_json::json!({
            "projectId": project_id,
            "title": "Get Test Task"
        });

        let create_response = ctx
            .app()
            .oneshot(
                Request::builder()
                    .method("POST")
                    .uri("/tasks")
                    .header("Content-Type", "application/json")
                    .body(Body::from(create_body.to_string()))
                    .unwrap(),
            )
            .await
            .unwrap();

        let body = axum::body::to_bytes(create_response.into_body(), usize::MAX)
            .await
            .unwrap();
        let created: Task = serde_json::from_slice(&body).unwrap();

        // Get the task using a new app instance (same pool)
        let response = ctx
            .app()
            .oneshot(
                Request::builder()
                    .method("GET")
                    .uri(format!("/tasks/{}", created.id))
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::OK);

        let body = axum::body::to_bytes(response.into_body(), usize::MAX)
            .await
            .unwrap();
        let task_with_chats: TaskWithChats = serde_json::from_slice(&body).unwrap();

        assert_eq!(task_with_chats.task.id, created.id);
        assert_eq!(task_with_chats.task.title, "Get Test Task");
        assert!(task_with_chats.chats.is_empty()); // No chats created yet
    }

    #[tokio::test]
    async fn test_get_task_not_found() {
        let ctx = TestContext::new().await;

        let response = ctx
            .app()
            .oneshot(
                Request::builder()
                    .method("GET")
                    .uri("/tasks/non-existent-id")
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::NOT_FOUND);
    }

    #[tokio::test]
    async fn test_update_task() {
        let ctx = TestContext::new().await;
        let project_id = ctx.create_project("Test Project").await;

        // Create a task first
        let create_body = serde_json::json!({
            "projectId": project_id,
            "title": "Original Title"
        });

        let create_response = ctx
            .app()
            .oneshot(
                Request::builder()
                    .method("POST")
                    .uri("/tasks")
                    .header("Content-Type", "application/json")
                    .body(Body::from(create_body.to_string()))
                    .unwrap(),
            )
            .await
            .unwrap();

        let body = axum::body::to_bytes(create_response.into_body(), usize::MAX)
            .await
            .unwrap();
        let created: Task = serde_json::from_slice(&body).unwrap();

        // Update the task
        let update_body = serde_json::json!({
            "title": "Updated Title",
            "status": "running"
        });

        let response = ctx
            .app()
            .oneshot(
                Request::builder()
                    .method("PATCH")
                    .uri(format!("/tasks/{}", created.id))
                    .header("Content-Type", "application/json")
                    .body(Body::from(update_body.to_string()))
                    .unwrap(),
            )
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::OK);

        let body = axum::body::to_bytes(response.into_body(), usize::MAX)
            .await
            .unwrap();
        let task: Task = serde_json::from_slice(&body).unwrap();

        assert_eq!(task.title, "Updated Title");
        assert_eq!(task.status, TaskStatus::Running);
    }

    #[tokio::test]
    async fn test_delete_task() {
        let ctx = TestContext::new().await;
        let project_id = ctx.create_project("Test Project").await;

        // Create a task first
        let create_body = serde_json::json!({
            "projectId": project_id,
            "title": "To Delete"
        });

        let create_response = ctx
            .app()
            .oneshot(
                Request::builder()
                    .method("POST")
                    .uri("/tasks")
                    .header("Content-Type", "application/json")
                    .body(Body::from(create_body.to_string()))
                    .unwrap(),
            )
            .await
            .unwrap();

        let body = axum::body::to_bytes(create_response.into_body(), usize::MAX)
            .await
            .unwrap();
        let created: Task = serde_json::from_slice(&body).unwrap();

        // Delete it
        let response = ctx
            .app()
            .oneshot(
                Request::builder()
                    .method("DELETE")
                    .uri(format!("/tasks/{}", created.id))
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
                    .uri(format!("/tasks/{}", created.id))
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();

        assert_eq!(get_response.status(), StatusCode::NOT_FOUND);
    }

    #[tokio::test]
    async fn test_archive_task() {
        let ctx = TestContext::new().await;
        let project_id = ctx.create_project("Test Project").await;

        // Create a task first
        let create_body = serde_json::json!({
            "projectId": project_id,
            "title": "To Archive"
        });

        let create_response = ctx
            .app()
            .oneshot(
                Request::builder()
                    .method("POST")
                    .uri("/tasks")
                    .header("Content-Type", "application/json")
                    .body(Body::from(create_body.to_string()))
                    .unwrap(),
            )
            .await
            .unwrap();

        let body = axum::body::to_bytes(create_response.into_body(), usize::MAX)
            .await
            .unwrap();
        let created: Task = serde_json::from_slice(&body).unwrap();

        assert!(created.archived_at.is_none());

        // Archive it
        let response = ctx
            .app()
            .oneshot(
                Request::builder()
                    .method("POST")
                    .uri(format!("/tasks/{}/archive", created.id))
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::OK);

        let body = axum::body::to_bytes(response.into_body(), usize::MAX)
            .await
            .unwrap();
        let task: Task = serde_json::from_slice(&body).unwrap();

        assert!(task.archived_at.is_some());
    }

    #[tokio::test]
    async fn test_unarchive_task() {
        let ctx = TestContext::new().await;
        let project_id = ctx.create_project("Test Project").await;

        // Create and archive a task first
        let create_body = serde_json::json!({
            "projectId": project_id,
            "title": "To Unarchive"
        });

        let create_response = ctx
            .app()
            .oneshot(
                Request::builder()
                    .method("POST")
                    .uri("/tasks")
                    .header("Content-Type", "application/json")
                    .body(Body::from(create_body.to_string()))
                    .unwrap(),
            )
            .await
            .unwrap();

        let body = axum::body::to_bytes(create_response.into_body(), usize::MAX)
            .await
            .unwrap();
        let created: Task = serde_json::from_slice(&body).unwrap();

        // Archive it
        ctx.app()
            .oneshot(
                Request::builder()
                    .method("POST")
                    .uri(format!("/tasks/{}/archive", created.id))
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();

        // Unarchive it
        let response = ctx
            .app()
            .oneshot(
                Request::builder()
                    .method("POST")
                    .uri(format!("/tasks/{}/unarchive", created.id))
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::OK);

        let body = axum::body::to_bytes(response.into_body(), usize::MAX)
            .await
            .unwrap();
        let task: Task = serde_json::from_slice(&body).unwrap();

        assert!(task.archived_at.is_none());
    }

    #[tokio::test]
    async fn test_duplicate_task() {
        let ctx = TestContext::new().await;
        let project_id = ctx.create_project("Test Project").await;

        // Create a task first
        let create_body = serde_json::json!({
            "projectId": project_id,
            "title": "Original Task",
            "description": "Original description"
        });

        let create_response = ctx
            .app()
            .oneshot(
                Request::builder()
                    .method("POST")
                    .uri("/tasks")
                    .header("Content-Type", "application/json")
                    .body(Body::from(create_body.to_string()))
                    .unwrap(),
            )
            .await
            .unwrap();

        let body = axum::body::to_bytes(create_response.into_body(), usize::MAX)
            .await
            .unwrap();
        let original: Task = serde_json::from_slice(&body).unwrap();

        // Duplicate it
        let response = ctx
            .app()
            .oneshot(
                Request::builder()
                    .method("POST")
                    .uri(format!("/tasks/{}/duplicate", original.id))
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::OK);

        let body = axum::body::to_bytes(response.into_body(), usize::MAX)
            .await
            .unwrap();
        let duplicate: Task = serde_json::from_slice(&body).unwrap();

        // Verify duplicate properties
        assert_ne!(duplicate.id, original.id);
        assert_eq!(duplicate.project_id, original.project_id);
        assert_eq!(duplicate.title, "Original Task (copy)");
        assert_eq!(duplicate.description, original.description);
        assert_eq!(duplicate.status, TaskStatus::Pending);
        assert!(duplicate.archived_at.is_none());
    }

    #[tokio::test]
    async fn test_list_tasks_with_status_filter() {
        let ctx = TestContext::new().await;
        let project_id = ctx.create_project("Test Project").await;

        // Create task with status Todo
        let create_body = serde_json::json!({
            "projectId": project_id,
            "title": "Todo Task"
        });

        ctx.app()
            .oneshot(
                Request::builder()
                    .method("POST")
                    .uri("/tasks")
                    .header("Content-Type", "application/json")
                    .body(Body::from(create_body.to_string()))
                    .unwrap(),
            )
            .await
            .unwrap();

        // Create and update task to InProgress
        let create_body2 = serde_json::json!({
            "projectId": project_id,
            "title": "InProgress Task"
        });

        let create_response = ctx
            .app()
            .oneshot(
                Request::builder()
                    .method("POST")
                    .uri("/tasks")
                    .header("Content-Type", "application/json")
                    .body(Body::from(create_body2.to_string()))
                    .unwrap(),
            )
            .await
            .unwrap();

        let body = axum::body::to_bytes(create_response.into_body(), usize::MAX)
            .await
            .unwrap();
        let task2: Task = serde_json::from_slice(&body).unwrap();

        // Update to Running
        let update_body = serde_json::json!({
            "status": "running"
        });

        ctx.app()
            .oneshot(
                Request::builder()
                    .method("PATCH")
                    .uri(format!("/tasks/{}", task2.id))
                    .header("Content-Type", "application/json")
                    .body(Body::from(update_body.to_string()))
                    .unwrap(),
            )
            .await
            .unwrap();

        // List only Pending tasks
        let response = ctx
            .app()
            .oneshot(
                Request::builder()
                    .method("GET")
                    .uri(format!("/tasks?projectId={}&status=pending", project_id))
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::OK);

        let body = axum::body::to_bytes(response.into_body(), usize::MAX)
            .await
            .unwrap();
        let tasks: Vec<Task> = serde_json::from_slice(&body).unwrap();

        assert_eq!(tasks.len(), 1);
        assert_eq!(tasks[0].title, "Todo Task");
        assert_eq!(tasks[0].status, TaskStatus::Pending);
    }

    #[tokio::test]
    async fn test_list_tasks_excludes_archived_by_default() {
        let ctx = TestContext::new().await;
        let project_id = ctx.create_project("Test Project").await;

        // Create two tasks
        let create_body1 = serde_json::json!({
            "projectId": project_id,
            "title": "Active Task"
        });

        ctx.app()
            .oneshot(
                Request::builder()
                    .method("POST")
                    .uri("/tasks")
                    .header("Content-Type", "application/json")
                    .body(Body::from(create_body1.to_string()))
                    .unwrap(),
            )
            .await
            .unwrap();

        let create_body2 = serde_json::json!({
            "projectId": project_id,
            "title": "Archived Task"
        });

        let create_response = ctx
            .app()
            .oneshot(
                Request::builder()
                    .method("POST")
                    .uri("/tasks")
                    .header("Content-Type", "application/json")
                    .body(Body::from(create_body2.to_string()))
                    .unwrap(),
            )
            .await
            .unwrap();

        let body = axum::body::to_bytes(create_response.into_body(), usize::MAX)
            .await
            .unwrap();
        let task2: Task = serde_json::from_slice(&body).unwrap();

        // Archive the second task
        ctx.app()
            .oneshot(
                Request::builder()
                    .method("POST")
                    .uri(format!("/tasks/{}/archive", task2.id))
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();

        // List tasks (should exclude archived by default)
        let response = ctx
            .app()
            .oneshot(
                Request::builder()
                    .method("GET")
                    .uri(format!("/tasks?projectId={}", project_id))
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();

        let body = axum::body::to_bytes(response.into_body(), usize::MAX)
            .await
            .unwrap();
        let tasks: Vec<Task> = serde_json::from_slice(&body).unwrap();

        assert_eq!(tasks.len(), 1);
        assert_eq!(tasks[0].title, "Active Task");
    }

    #[tokio::test]
    async fn test_list_tasks_with_include_archived() {
        let ctx = TestContext::new().await;
        let project_id = ctx.create_project("Test Project").await;

        // Create two tasks
        let create_body1 = serde_json::json!({
            "projectId": project_id,
            "title": "Active Task"
        });

        ctx.app()
            .oneshot(
                Request::builder()
                    .method("POST")
                    .uri("/tasks")
                    .header("Content-Type", "application/json")
                    .body(Body::from(create_body1.to_string()))
                    .unwrap(),
            )
            .await
            .unwrap();

        let create_body2 = serde_json::json!({
            "projectId": project_id,
            "title": "Archived Task"
        });

        let create_response = ctx
            .app()
            .oneshot(
                Request::builder()
                    .method("POST")
                    .uri("/tasks")
                    .header("Content-Type", "application/json")
                    .body(Body::from(create_body2.to_string()))
                    .unwrap(),
            )
            .await
            .unwrap();

        let body = axum::body::to_bytes(create_response.into_body(), usize::MAX)
            .await
            .unwrap();
        let task2: Task = serde_json::from_slice(&body).unwrap();

        // Archive the second task
        ctx.app()
            .oneshot(
                Request::builder()
                    .method("POST")
                    .uri(format!("/tasks/{}/archive", task2.id))
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();

        // List tasks with includeArchived=true
        let response = ctx
            .app()
            .oneshot(
                Request::builder()
                    .method("GET")
                    .uri(format!(
                        "/tasks?projectId={}&includeArchived=true",
                        project_id
                    ))
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();

        let body = axum::body::to_bytes(response.into_body(), usize::MAX)
            .await
            .unwrap();
        let tasks: Vec<Task> = serde_json::from_slice(&body).unwrap();

        assert_eq!(tasks.len(), 2);
    }

    #[tokio::test]
    async fn test_list_tasks_requires_project_id() {
        let ctx = TestContext::new().await;

        // Try to list without projectId - should fail
        let response = ctx
            .app()
            .oneshot(
                Request::builder()
                    .method("GET")
                    .uri("/tasks")
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();

        // Should return 400 Bad Request due to missing required query param
        assert_eq!(response.status(), StatusCode::BAD_REQUEST);
    }

    // =========================================================================
    // Task Execution Tests
    // =========================================================================

    #[tokio::test]
    async fn test_get_task_with_steps() {
        let ctx = TestContext::new().await;
        let project_id = ctx.create_project("Test Project").await;

        // Create a task
        let create_body = serde_json::json!({
            "projectId": project_id,
            "title": "Task with Steps"
        });

        let create_response = ctx
            .app()
            .oneshot(
                Request::builder()
                    .method("POST")
                    .uri("/tasks")
                    .header("Content-Type", "application/json")
                    .body(Body::from(create_body.to_string()))
                    .unwrap(),
            )
            .await
            .unwrap();

        let body = axum::body::to_bytes(create_response.into_body(), usize::MAX)
            .await
            .unwrap();
        let created: Task = serde_json::from_slice(&body).unwrap();

        // Get task with steps
        let response = ctx
            .app()
            .oneshot(
                Request::builder()
                    .method("GET")
                    .uri(format!("/tasks/{}/with-steps", created.id))
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::OK);

        let body = axum::body::to_bytes(response.into_body(), usize::MAX)
            .await
            .unwrap();
        let task_with_steps: TaskWithSteps = serde_json::from_slice(&body).unwrap();

        assert_eq!(task_with_steps.task.id, created.id);
        assert!(task_with_steps.steps.is_empty()); // No steps created yet
    }

    #[tokio::test]
    async fn test_start_task_without_steps_fails() {
        let ctx = TestContext::new().await;
        let project_id = ctx.create_project("Test Project").await;

        // Create a task
        let create_body = serde_json::json!({
            "projectId": project_id,
            "title": "Task without Steps"
        });

        let create_response = ctx
            .app()
            .oneshot(
                Request::builder()
                    .method("POST")
                    .uri("/tasks")
                    .header("Content-Type", "application/json")
                    .body(Body::from(create_body.to_string()))
                    .unwrap(),
            )
            .await
            .unwrap();

        let body = axum::body::to_bytes(create_response.into_body(), usize::MAX)
            .await
            .unwrap();
        let created: Task = serde_json::from_slice(&body).unwrap();

        // Try to start task without steps - should fail
        let response = ctx
            .app()
            .oneshot(
                Request::builder()
                    .method("POST")
                    .uri(format!("/tasks/{}/start", created.id))
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();

        // Should fail because task has no steps
        assert_eq!(response.status(), StatusCode::BAD_REQUEST);
    }

    #[tokio::test]
    async fn test_is_running_for_pending_task() {
        let ctx = TestContext::new().await;
        let project_id = ctx.create_project("Test Project").await;

        // Create a task
        let create_body = serde_json::json!({
            "projectId": project_id,
            "title": "Test Task"
        });

        let create_response = ctx
            .app()
            .oneshot(
                Request::builder()
                    .method("POST")
                    .uri("/tasks")
                    .header("Content-Type", "application/json")
                    .body(Body::from(create_body.to_string()))
                    .unwrap(),
            )
            .await
            .unwrap();

        let body = axum::body::to_bytes(create_response.into_body(), usize::MAX)
            .await
            .unwrap();
        let created: Task = serde_json::from_slice(&body).unwrap();

        // Check if running
        let response = ctx
            .app()
            .oneshot(
                Request::builder()
                    .method("GET")
                    .uri(format!("/tasks/{}/running", created.id))
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::OK);

        let body = axum::body::to_bytes(response.into_body(), usize::MAX)
            .await
            .unwrap();
        let is_running: bool = serde_json::from_slice(&body).unwrap();

        assert!(!is_running);
    }

    #[tokio::test]
    async fn test_running_count_and_list() {
        let ctx = TestContext::new().await;

        // Get running count
        let response = ctx
            .app()
            .oneshot(
                Request::builder()
                    .method("GET")
                    .uri("/tasks/running/count")
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::OK);

        let body = axum::body::to_bytes(response.into_body(), usize::MAX)
            .await
            .unwrap();
        let count: usize = serde_json::from_slice(&body).unwrap();
        assert_eq!(count, 0);

        // Get running list
        let response = ctx
            .app()
            .oneshot(
                Request::builder()
                    .method("GET")
                    .uri("/tasks/running")
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::OK);

        let body = axum::body::to_bytes(response.into_body(), usize::MAX)
            .await
            .unwrap();
        let running: Vec<String> = serde_json::from_slice(&body).unwrap();
        assert!(running.is_empty());
    }

    // =========================================================================
    // Task Step Tests
    // =========================================================================

    #[tokio::test]
    async fn test_create_and_list_steps() {
        let ctx = TestContext::new().await;
        let project_id = ctx.create_project("Test Project").await;

        // Create a task
        let create_body = serde_json::json!({
            "projectId": project_id,
            "title": "Task with Steps"
        });

        let create_response = ctx
            .app()
            .oneshot(
                Request::builder()
                    .method("POST")
                    .uri("/tasks")
                    .header("Content-Type", "application/json")
                    .body(Body::from(create_body.to_string()))
                    .unwrap(),
            )
            .await
            .unwrap();

        let body = axum::body::to_bytes(create_response.into_body(), usize::MAX)
            .await
            .unwrap();
        let task: Task = serde_json::from_slice(&body).unwrap();

        // Create a step
        let step_body = serde_json::json!({
            "stepIndex": 0,
            "title": "First Step",
            "prompt": "Do something",
            "providerId": "claude-code"
        });

        let response = ctx
            .app()
            .oneshot(
                Request::builder()
                    .method("POST")
                    .uri(format!("/tasks/{}/steps", task.id))
                    .header("Content-Type", "application/json")
                    .body(Body::from(step_body.to_string()))
                    .unwrap(),
            )
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::OK);

        let body = axum::body::to_bytes(response.into_body(), usize::MAX)
            .await
            .unwrap();
        let step: TaskStep = serde_json::from_slice(&body).unwrap();

        assert_eq!(step.title, "First Step");
        assert_eq!(step.step_index, 0);
        assert_eq!(step.provider_id, "claude-code");

        // List steps
        let response = ctx
            .app()
            .oneshot(
                Request::builder()
                    .method("GET")
                    .uri(format!("/tasks/{}/steps", task.id))
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::OK);

        let body = axum::body::to_bytes(response.into_body(), usize::MAX)
            .await
            .unwrap();
        let steps: Vec<TaskStep> = serde_json::from_slice(&body).unwrap();

        assert_eq!(steps.len(), 1);
        assert_eq!(steps[0].title, "First Step");
    }

    #[tokio::test]
    async fn test_get_and_delete_step() {
        let ctx = TestContext::new().await;
        let project_id = ctx.create_project("Test Project").await;

        // Create a task
        let create_body = serde_json::json!({
            "projectId": project_id,
            "title": "Task"
        });

        let create_response = ctx
            .app()
            .oneshot(
                Request::builder()
                    .method("POST")
                    .uri("/tasks")
                    .header("Content-Type", "application/json")
                    .body(Body::from(create_body.to_string()))
                    .unwrap(),
            )
            .await
            .unwrap();

        let body = axum::body::to_bytes(create_response.into_body(), usize::MAX)
            .await
            .unwrap();
        let task: Task = serde_json::from_slice(&body).unwrap();

        // Create a step
        let step_body = serde_json::json!({
            "stepIndex": 0,
            "title": "Step to Delete",
            "prompt": "Test",
            "providerId": "mock"
        });

        let response = ctx
            .app()
            .oneshot(
                Request::builder()
                    .method("POST")
                    .uri(format!("/tasks/{}/steps", task.id))
                    .header("Content-Type", "application/json")
                    .body(Body::from(step_body.to_string()))
                    .unwrap(),
            )
            .await
            .unwrap();

        let body = axum::body::to_bytes(response.into_body(), usize::MAX)
            .await
            .unwrap();
        let step: TaskStep = serde_json::from_slice(&body).unwrap();

        // Get the step
        let response = ctx
            .app()
            .oneshot(
                Request::builder()
                    .method("GET")
                    .uri(format!("/tasks/{}/steps/{}", task.id, step.id))
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::OK);

        // Delete the step
        let response = ctx
            .app()
            .oneshot(
                Request::builder()
                    .method("DELETE")
                    .uri(format!("/tasks/{}/steps/{}", task.id, step.id))
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::OK);

        // Verify step is deleted
        let response = ctx
            .app()
            .oneshot(
                Request::builder()
                    .method("GET")
                    .uri(format!("/tasks/{}/steps/{}", task.id, step.id))
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::NOT_FOUND);
    }

    // =========================================================================
    // Permission Tests
    // =========================================================================

    #[tokio::test]
    async fn test_get_pending_permission_for_non_running_task() {
        let ctx = TestContext::new().await;
        let project_id = ctx.create_project("Test Project").await;

        // Create a task
        let create_body = serde_json::json!({
            "projectId": project_id,
            "title": "Test Task"
        });

        let create_response = ctx
            .app()
            .oneshot(
                Request::builder()
                    .method("POST")
                    .uri("/tasks")
                    .header("Content-Type", "application/json")
                    .body(Body::from(create_body.to_string()))
                    .unwrap(),
            )
            .await
            .unwrap();

        let body = axum::body::to_bytes(create_response.into_body(), usize::MAX)
            .await
            .unwrap();
        let task: Task = serde_json::from_slice(&body).unwrap();

        // Get pending permission
        let response = ctx
            .app()
            .oneshot(
                Request::builder()
                    .method("GET")
                    .uri(format!("/tasks/{}/permissions/pending", task.id))
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::OK);

        let body = axum::body::to_bytes(response.into_body(), usize::MAX)
            .await
            .unwrap();
        let permission: Option<Permission> = serde_json::from_slice(&body).unwrap();

        assert!(permission.is_none());
    }
}
