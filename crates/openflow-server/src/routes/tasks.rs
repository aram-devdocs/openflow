//! Task Routes
//!
//! REST API endpoints for task CRUD operations.

use axum::{
    extract::{Path, Query, State},
    routing::{get, post},
    Json, Router,
};
use openflow_contracts::{CreateTaskRequest, Task, TaskStatus, TaskWithChats, UpdateTaskRequest};
use openflow_core::events::{EntityType, Event};
use openflow_core::services::task;
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
        .route("/", get(list).post(create))
        .route("/:id", get(get_one).patch(update).delete(delete_one))
        .route("/:id/archive", post(archive))
        .route("/:id/unarchive", post(unarchive))
        .route("/:id/duplicate", post(duplicate))
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
    state.broadcast(Event::created(
        EntityType::Task,
        task.id.clone(),
        &task,
    ));

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
    state.broadcast(Event::updated(
        EntityType::Task,
        task.id.clone(),
        &task,
    ));

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
    state.broadcast(Event::updated(
        EntityType::Task,
        task.id.clone(),
        &task,
    ));

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
    state.broadcast(Event::updated(
        EntityType::Task,
        task.id.clone(),
        &task,
    ));

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
    state.broadcast(Event::created(
        EntityType::Task,
        task.id.clone(),
        &task,
    ));

    Ok(Json(task))
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
            let state = AppState::new(self.pool.clone(), process_service, broadcaster, client_manager);
            Router::new()
                .nest("/tasks", routes())
                .with_state(state)
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
        let json = r#"{"projectId": "123", "status": "todo"}"#;
        let query: ListTasksQuery = serde_json::from_str(json).unwrap();
        assert_eq!(query.project_id, "123");
        assert_eq!(query.status, Some(TaskStatus::Todo));
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
        assert_eq!(task.status, TaskStatus::Todo);
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
        assert_eq!(task.description, Some("A complete task description".to_string()));
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
            "status": "inprogress"
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
        assert_eq!(task.status, TaskStatus::Inprogress);
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
        assert_eq!(duplicate.status, TaskStatus::Todo);
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

        // Update to InProgress
        let update_body = serde_json::json!({
            "status": "inprogress"
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

        // List only Todo tasks
        let response = ctx
            .app()
            .oneshot(
                Request::builder()
                    .method("GET")
                    .uri(format!("/tasks?projectId={}&status=todo", project_id))
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
        assert_eq!(tasks[0].status, TaskStatus::Todo);
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
                    .uri(format!("/tasks?projectId={}&includeArchived=true", project_id))
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
}
