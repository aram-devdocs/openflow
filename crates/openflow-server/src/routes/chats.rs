//! Chat Routes
//!
//! REST API endpoints for chat CRUD operations.

use axum::{
    extract::{Path, Query, State},
    routing::{get, post},
    Json, Router,
};
use openflow_contracts::{Chat, ChatWithMessages, CreateChatRequest, UpdateChatRequest};
use openflow_core::events::{EntityType, Event};
use openflow_core::services::chat;
use serde::Deserialize;

use crate::{error::ServerResult, state::AppState};

/// Query parameters for listing chats
#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ListChatsQuery {
    /// Filter by task ID (required for task chats)
    pub task_id: String,
}

/// Query parameters for standalone chats
#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct StandaloneChatsQuery {
    /// Filter by project ID (required)
    pub project_id: String,
}

/// Create chat routes
pub fn routes() -> Router<AppState> {
    Router::new()
        .route("/", get(list).post(create))
        .route("/standalone", get(list_standalone))
        .route("/by-project", get(list_by_project))
        .route("/archived", get(list_archived))
        .route("/:id", get(get_one).patch(update).delete(delete_one))
        .route("/:id/archive", post(archive))
        .route("/:id/unarchive", post(unarchive))
        .route("/:id/toggle-step", post(toggle_step_complete))
}

/// GET /api/chats?taskId=xxx
///
/// List chats for a task.
async fn list(
    State(state): State<AppState>,
    Query(query): Query<ListChatsQuery>,
) -> ServerResult<Json<Vec<Chat>>> {
    let chats = chat::list(&state.pool, &query.task_id).await?;
    Ok(Json(chats))
}

/// GET /api/chats/standalone?projectId=xxx
///
/// List standalone chats (not associated with a task).
async fn list_standalone(
    State(state): State<AppState>,
    Query(query): Query<StandaloneChatsQuery>,
) -> ServerResult<Json<Vec<Chat>>> {
    let chats = chat::list_standalone(&state.pool, &query.project_id).await?;
    Ok(Json(chats))
}

/// GET /api/chats/by-project?projectId=xxx
///
/// List all chats for a project.
async fn list_by_project(
    State(state): State<AppState>,
    Query(query): Query<StandaloneChatsQuery>,
) -> ServerResult<Json<Vec<Chat>>> {
    let chats = chat::list_by_project(&state.pool, &query.project_id).await?;
    Ok(Json(chats))
}

/// GET /api/chats/archived
///
/// List archived chats.
async fn list_archived(State(state): State<AppState>) -> ServerResult<Json<Vec<Chat>>> {
    let chats = chat::list_archived(&state.pool).await?;
    Ok(Json(chats))
}

/// GET /api/chats/{id}
///
/// Get a chat by ID (with messages).
async fn get_one(
    State(state): State<AppState>,
    Path(id): Path<String>,
) -> ServerResult<Json<ChatWithMessages>> {
    let chat_with_messages = chat::get(&state.pool, &id).await?;
    Ok(Json(chat_with_messages))
}

/// POST /api/chats
///
/// Create a new chat.
async fn create(
    State(state): State<AppState>,
    Json(request): Json<CreateChatRequest>,
) -> ServerResult<Json<Chat>> {
    let chat = chat::create(&state.pool, request).await?;

    // Broadcast data changed event
    state.broadcast(Event::created(
        EntityType::Chat,
        chat.id.clone(),
        &chat,
    ));

    Ok(Json(chat))
}

/// PATCH /api/chats/{id}
///
/// Update an existing chat.
async fn update(
    State(state): State<AppState>,
    Path(id): Path<String>,
    Json(request): Json<UpdateChatRequest>,
) -> ServerResult<Json<Chat>> {
    let chat = chat::update(&state.pool, &id, request).await?;

    // Broadcast data changed event
    state.broadcast(Event::updated(
        EntityType::Chat,
        chat.id.clone(),
        &chat,
    ));

    Ok(Json(chat))
}

/// DELETE /api/chats/{id}
///
/// Delete a chat by ID.
async fn delete_one(State(state): State<AppState>, Path(id): Path<String>) -> ServerResult<()> {
    chat::delete(&state.pool, &id).await?;

    // Broadcast data changed event
    state.broadcast(Event::deleted(EntityType::Chat, id));

    Ok(())
}

/// POST /api/chats/{id}/archive
///
/// Archive a chat.
async fn archive(
    State(state): State<AppState>,
    Path(id): Path<String>,
) -> ServerResult<Json<Chat>> {
    let chat = chat::archive(&state.pool, &id).await?;

    // Broadcast data changed event
    state.broadcast(Event::updated(
        EntityType::Chat,
        chat.id.clone(),
        &chat,
    ));

    Ok(Json(chat))
}

/// POST /api/chats/{id}/unarchive
///
/// Unarchive a chat.
async fn unarchive(
    State(state): State<AppState>,
    Path(id): Path<String>,
) -> ServerResult<Json<Chat>> {
    let chat = chat::unarchive(&state.pool, &id).await?;

    // Broadcast data changed event
    state.broadcast(Event::updated(
        EntityType::Chat,
        chat.id.clone(),
        &chat,
    ));

    Ok(Json(chat))
}

/// POST /api/chats/{id}/toggle-step
///
/// Toggle a workflow step's completion status.
async fn toggle_step_complete(
    State(state): State<AppState>,
    Path(id): Path<String>,
) -> ServerResult<Json<Chat>> {
    let chat = chat::toggle_step_complete(&state.pool, &id).await?;

    // Broadcast data changed event
    state.broadcast(Event::updated(
        EntityType::Chat,
        chat.id.clone(),
        &chat,
    ));

    Ok(Json(chat))
}

#[cfg(test)]
mod tests {
    use super::*;
    use axum::{
        body::Body,
        http::{Request, StatusCode},
        Router,
    };
    use openflow_contracts::{ChatRole, CreateProjectRequest, CreateTaskRequest};
    use openflow_core::events::NullBroadcaster;
    use openflow_core::services::{process::ProcessService, project, task};
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
                .nest("/chats", routes())
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

        /// Create a test task and return its ID
        async fn create_task(&self, project_id: &str, title: &str) -> String {
            let request = CreateTaskRequest {
                project_id: project_id.to_string(),
                title: title.to_string(),
                description: None,
                workflow_template: None,
                parent_task_id: None,
                base_branch: None,
            };
            task::create(&self.pool, request)
                .await
                .expect("Failed to create test task")
                .id
        }
    }

    #[test]
    fn test_routes_creation() {
        let _routes: Router<AppState> = routes();
    }

    #[test]
    fn test_list_query_deserialization() {
        let json = r#"{"taskId": "123"}"#;
        let query: ListChatsQuery = serde_json::from_str(json).unwrap();
        assert_eq!(query.task_id, "123");
    }

    #[test]
    fn test_standalone_query_deserialization() {
        let json = r#"{"projectId": "456"}"#;
        let query: StandaloneChatsQuery = serde_json::from_str(json).unwrap();
        assert_eq!(query.project_id, "456");
    }

    #[tokio::test]
    async fn test_list_chats_empty() {
        let ctx = TestContext::new().await;
        let project_id = ctx.create_project("Test Project").await;
        let task_id = ctx.create_task(&project_id, "Test Task").await;

        let response = ctx
            .app()
            .oneshot(
                Request::builder()
                    .method("GET")
                    .uri(format!("/chats?taskId={}", task_id))
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::OK);

        let body = axum::body::to_bytes(response.into_body(), usize::MAX)
            .await
            .unwrap();
        let chats: Vec<Chat> = serde_json::from_slice(&body).unwrap();

        assert!(chats.is_empty());
    }

    #[tokio::test]
    async fn test_create_chat() {
        let ctx = TestContext::new().await;
        let project_id = ctx.create_project("Test Project").await;
        let task_id = ctx.create_task(&project_id, "Test Task").await;

        let request_body = serde_json::json!({
            "projectId": project_id,
            "taskId": task_id,
            "title": "Test Chat"
        });

        let response = ctx
            .app()
            .oneshot(
                Request::builder()
                    .method("POST")
                    .uri("/chats")
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
        let chat: Chat = serde_json::from_slice(&body).unwrap();

        assert_eq!(chat.title, Some("Test Chat".to_string()));
        assert_eq!(chat.project_id, project_id);
        assert_eq!(chat.task_id, Some(task_id));
        assert_eq!(chat.chat_role, ChatRole::Main);
        assert!(!chat.id.is_empty());
    }

    #[tokio::test]
    async fn test_create_standalone_chat() {
        let ctx = TestContext::new().await;
        let project_id = ctx.create_project("Test Project").await;

        let request_body = serde_json::json!({
            "projectId": project_id,
            "title": "Standalone Chat"
        });

        let response = ctx
            .app()
            .oneshot(
                Request::builder()
                    .method("POST")
                    .uri("/chats")
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
        let chat: Chat = serde_json::from_slice(&body).unwrap();

        assert_eq!(chat.title, Some("Standalone Chat".to_string()));
        assert_eq!(chat.project_id, project_id);
        assert!(chat.task_id.is_none());
    }

    #[tokio::test]
    async fn test_create_chat_with_all_fields() {
        let ctx = TestContext::new().await;
        let project_id = ctx.create_project("Test Project").await;
        let task_id = ctx.create_task(&project_id, "Test Task").await;

        let request_body = serde_json::json!({
            "projectId": project_id,
            "taskId": task_id,
            "title": "Full Chat",
            "chatRole": "review",
            "baseBranch": "develop",
            "initialPrompt": "Please review the code",
            "hiddenPrompt": "System context",
            "isPlanContainer": true,
            "workflowStepIndex": 1
        });

        let response = ctx
            .app()
            .oneshot(
                Request::builder()
                    .method("POST")
                    .uri("/chats")
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
        let chat: Chat = serde_json::from_slice(&body).unwrap();

        assert_eq!(chat.title, Some("Full Chat".to_string()));
        assert_eq!(chat.chat_role, ChatRole::Review);
        assert_eq!(chat.base_branch, "develop");
        assert_eq!(chat.initial_prompt, Some("Please review the code".to_string()));
        assert_eq!(chat.hidden_prompt, Some("System context".to_string()));
        assert!(chat.is_plan_container);
        assert_eq!(chat.workflow_step_index, Some(1));
    }

    #[tokio::test]
    async fn test_get_chat() {
        let ctx = TestContext::new().await;
        let project_id = ctx.create_project("Test Project").await;
        let task_id = ctx.create_task(&project_id, "Test Task").await;

        // Create a chat first
        let create_body = serde_json::json!({
            "projectId": project_id,
            "taskId": task_id,
            "title": "Get Test Chat"
        });

        let create_response = ctx
            .app()
            .oneshot(
                Request::builder()
                    .method("POST")
                    .uri("/chats")
                    .header("Content-Type", "application/json")
                    .body(Body::from(create_body.to_string()))
                    .unwrap(),
            )
            .await
            .unwrap();

        let body = axum::body::to_bytes(create_response.into_body(), usize::MAX)
            .await
            .unwrap();
        let created: Chat = serde_json::from_slice(&body).unwrap();

        // Get the chat
        let response = ctx
            .app()
            .oneshot(
                Request::builder()
                    .method("GET")
                    .uri(format!("/chats/{}", created.id))
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::OK);

        let body = axum::body::to_bytes(response.into_body(), usize::MAX)
            .await
            .unwrap();
        let chat_with_messages: ChatWithMessages = serde_json::from_slice(&body).unwrap();

        assert_eq!(chat_with_messages.chat.id, created.id);
        assert_eq!(chat_with_messages.chat.title, Some("Get Test Chat".to_string()));
        assert!(chat_with_messages.messages.is_empty());
    }

    #[tokio::test]
    async fn test_get_chat_not_found() {
        let ctx = TestContext::new().await;

        let response = ctx
            .app()
            .oneshot(
                Request::builder()
                    .method("GET")
                    .uri("/chats/non-existent-id")
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::NOT_FOUND);
    }

    #[tokio::test]
    async fn test_update_chat() {
        let ctx = TestContext::new().await;
        let project_id = ctx.create_project("Test Project").await;
        let task_id = ctx.create_task(&project_id, "Test Task").await;

        // Create a chat first
        let create_body = serde_json::json!({
            "projectId": project_id,
            "taskId": task_id,
            "title": "Original Title"
        });

        let create_response = ctx
            .app()
            .oneshot(
                Request::builder()
                    .method("POST")
                    .uri("/chats")
                    .header("Content-Type", "application/json")
                    .body(Body::from(create_body.to_string()))
                    .unwrap(),
            )
            .await
            .unwrap();

        let body = axum::body::to_bytes(create_response.into_body(), usize::MAX)
            .await
            .unwrap();
        let created: Chat = serde_json::from_slice(&body).unwrap();

        // Update the chat
        let update_body = serde_json::json!({
            "title": "Updated Title",
            "branch": "feature/test"
        });

        let response = ctx
            .app()
            .oneshot(
                Request::builder()
                    .method("PATCH")
                    .uri(format!("/chats/{}", created.id))
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
        let chat: Chat = serde_json::from_slice(&body).unwrap();

        assert_eq!(chat.title, Some("Updated Title".to_string()));
        assert_eq!(chat.branch, Some("feature/test".to_string()));
    }

    #[tokio::test]
    async fn test_delete_chat() {
        let ctx = TestContext::new().await;
        let project_id = ctx.create_project("Test Project").await;
        let task_id = ctx.create_task(&project_id, "Test Task").await;

        // Create a chat first
        let create_body = serde_json::json!({
            "projectId": project_id,
            "taskId": task_id,
            "title": "To Delete"
        });

        let create_response = ctx
            .app()
            .oneshot(
                Request::builder()
                    .method("POST")
                    .uri("/chats")
                    .header("Content-Type", "application/json")
                    .body(Body::from(create_body.to_string()))
                    .unwrap(),
            )
            .await
            .unwrap();

        let body = axum::body::to_bytes(create_response.into_body(), usize::MAX)
            .await
            .unwrap();
        let created: Chat = serde_json::from_slice(&body).unwrap();

        // Delete it
        let response = ctx
            .app()
            .oneshot(
                Request::builder()
                    .method("DELETE")
                    .uri(format!("/chats/{}", created.id))
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
                    .uri(format!("/chats/{}", created.id))
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();

        assert_eq!(get_response.status(), StatusCode::NOT_FOUND);
    }

    #[tokio::test]
    async fn test_archive_chat() {
        let ctx = TestContext::new().await;
        let project_id = ctx.create_project("Test Project").await;
        let task_id = ctx.create_task(&project_id, "Test Task").await;

        // Create a chat first
        let create_body = serde_json::json!({
            "projectId": project_id,
            "taskId": task_id,
            "title": "To Archive"
        });

        let create_response = ctx
            .app()
            .oneshot(
                Request::builder()
                    .method("POST")
                    .uri("/chats")
                    .header("Content-Type", "application/json")
                    .body(Body::from(create_body.to_string()))
                    .unwrap(),
            )
            .await
            .unwrap();

        let body = axum::body::to_bytes(create_response.into_body(), usize::MAX)
            .await
            .unwrap();
        let created: Chat = serde_json::from_slice(&body).unwrap();

        assert!(created.archived_at.is_none());

        // Archive it
        let response = ctx
            .app()
            .oneshot(
                Request::builder()
                    .method("POST")
                    .uri(format!("/chats/{}/archive", created.id))
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::OK);

        let body = axum::body::to_bytes(response.into_body(), usize::MAX)
            .await
            .unwrap();
        let chat: Chat = serde_json::from_slice(&body).unwrap();

        assert!(chat.archived_at.is_some());
    }

    #[tokio::test]
    async fn test_unarchive_chat() {
        let ctx = TestContext::new().await;
        let project_id = ctx.create_project("Test Project").await;
        let task_id = ctx.create_task(&project_id, "Test Task").await;

        // Create and archive a chat first
        let create_body = serde_json::json!({
            "projectId": project_id,
            "taskId": task_id,
            "title": "To Unarchive"
        });

        let create_response = ctx
            .app()
            .oneshot(
                Request::builder()
                    .method("POST")
                    .uri("/chats")
                    .header("Content-Type", "application/json")
                    .body(Body::from(create_body.to_string()))
                    .unwrap(),
            )
            .await
            .unwrap();

        let body = axum::body::to_bytes(create_response.into_body(), usize::MAX)
            .await
            .unwrap();
        let created: Chat = serde_json::from_slice(&body).unwrap();

        // Archive it
        ctx.app()
            .oneshot(
                Request::builder()
                    .method("POST")
                    .uri(format!("/chats/{}/archive", created.id))
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
                    .uri(format!("/chats/{}/unarchive", created.id))
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::OK);

        let body = axum::body::to_bytes(response.into_body(), usize::MAX)
            .await
            .unwrap();
        let chat: Chat = serde_json::from_slice(&body).unwrap();

        assert!(chat.archived_at.is_none());
    }

    #[tokio::test]
    async fn test_toggle_step_complete() {
        let ctx = TestContext::new().await;
        let project_id = ctx.create_project("Test Project").await;
        let task_id = ctx.create_task(&project_id, "Test Task").await;

        // Create a chat first
        let create_body = serde_json::json!({
            "projectId": project_id,
            "taskId": task_id,
            "title": "Step to Toggle",
            "workflowStepIndex": 1
        });

        let create_response = ctx
            .app()
            .oneshot(
                Request::builder()
                    .method("POST")
                    .uri("/chats")
                    .header("Content-Type", "application/json")
                    .body(Body::from(create_body.to_string()))
                    .unwrap(),
            )
            .await
            .unwrap();

        let body = axum::body::to_bytes(create_response.into_body(), usize::MAX)
            .await
            .unwrap();
        let created: Chat = serde_json::from_slice(&body).unwrap();

        assert!(created.setup_completed_at.is_none());

        // Toggle to complete
        let response = ctx
            .app()
            .oneshot(
                Request::builder()
                    .method("POST")
                    .uri(format!("/chats/{}/toggle-step", created.id))
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::OK);

        let body = axum::body::to_bytes(response.into_body(), usize::MAX)
            .await
            .unwrap();
        let chat: Chat = serde_json::from_slice(&body).unwrap();

        assert!(chat.setup_completed_at.is_some());

        // Toggle back to incomplete
        let response = ctx
            .app()
            .oneshot(
                Request::builder()
                    .method("POST")
                    .uri(format!("/chats/{}/toggle-step", chat.id))
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::OK);

        let body = axum::body::to_bytes(response.into_body(), usize::MAX)
            .await
            .unwrap();
        let chat: Chat = serde_json::from_slice(&body).unwrap();

        assert!(chat.setup_completed_at.is_none());
    }

    #[tokio::test]
    async fn test_list_standalone_chats() {
        let ctx = TestContext::new().await;
        let project_id = ctx.create_project("Test Project").await;
        let task_id = ctx.create_task(&project_id, "Test Task").await;

        // Create a task-linked chat
        let task_chat_body = serde_json::json!({
            "projectId": project_id,
            "taskId": task_id,
            "title": "Task Chat"
        });

        ctx.app()
            .oneshot(
                Request::builder()
                    .method("POST")
                    .uri("/chats")
                    .header("Content-Type", "application/json")
                    .body(Body::from(task_chat_body.to_string()))
                    .unwrap(),
            )
            .await
            .unwrap();

        // Create standalone chats
        let standalone1 = serde_json::json!({
            "projectId": project_id,
            "title": "Standalone 1"
        });

        ctx.app()
            .oneshot(
                Request::builder()
                    .method("POST")
                    .uri("/chats")
                    .header("Content-Type", "application/json")
                    .body(Body::from(standalone1.to_string()))
                    .unwrap(),
            )
            .await
            .unwrap();

        let standalone2 = serde_json::json!({
            "projectId": project_id,
            "title": "Standalone 2"
        });

        ctx.app()
            .oneshot(
                Request::builder()
                    .method("POST")
                    .uri("/chats")
                    .header("Content-Type", "application/json")
                    .body(Body::from(standalone2.to_string()))
                    .unwrap(),
            )
            .await
            .unwrap();

        // List standalone should only return standalone chats
        let response = ctx
            .app()
            .oneshot(
                Request::builder()
                    .method("GET")
                    .uri(format!("/chats/standalone?projectId={}", project_id))
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::OK);

        let body = axum::body::to_bytes(response.into_body(), usize::MAX)
            .await
            .unwrap();
        let chats: Vec<Chat> = serde_json::from_slice(&body).unwrap();

        assert_eq!(chats.len(), 2);
        for chat in &chats {
            assert!(chat.task_id.is_none());
        }
    }

    #[tokio::test]
    async fn test_list_by_project() {
        let ctx = TestContext::new().await;
        let project_id = ctx.create_project("Test Project").await;
        let task_id = ctx.create_task(&project_id, "Test Task").await;

        // Create a task-linked chat
        let task_chat_body = serde_json::json!({
            "projectId": project_id,
            "taskId": task_id,
            "title": "Task Chat"
        });

        ctx.app()
            .oneshot(
                Request::builder()
                    .method("POST")
                    .uri("/chats")
                    .header("Content-Type", "application/json")
                    .body(Body::from(task_chat_body.to_string()))
                    .unwrap(),
            )
            .await
            .unwrap();

        // Create a standalone chat
        let standalone = serde_json::json!({
            "projectId": project_id,
            "title": "Standalone"
        });

        ctx.app()
            .oneshot(
                Request::builder()
                    .method("POST")
                    .uri("/chats")
                    .header("Content-Type", "application/json")
                    .body(Body::from(standalone.to_string()))
                    .unwrap(),
            )
            .await
            .unwrap();

        // List by project should return all chats
        let response = ctx
            .app()
            .oneshot(
                Request::builder()
                    .method("GET")
                    .uri(format!("/chats/by-project?projectId={}", project_id))
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::OK);

        let body = axum::body::to_bytes(response.into_body(), usize::MAX)
            .await
            .unwrap();
        let chats: Vec<Chat> = serde_json::from_slice(&body).unwrap();

        assert_eq!(chats.len(), 2);
    }

    #[tokio::test]
    async fn test_list_archived_chats() {
        let ctx = TestContext::new().await;
        let project_id = ctx.create_project("Test Project").await;
        let task_id = ctx.create_task(&project_id, "Test Task").await;

        // Create chats
        let chat1_body = serde_json::json!({
            "projectId": project_id,
            "taskId": task_id,
            "title": "Active Chat"
        });

        ctx.app()
            .oneshot(
                Request::builder()
                    .method("POST")
                    .uri("/chats")
                    .header("Content-Type", "application/json")
                    .body(Body::from(chat1_body.to_string()))
                    .unwrap(),
            )
            .await
            .unwrap();

        let chat2_body = serde_json::json!({
            "projectId": project_id,
            "taskId": task_id,
            "title": "To Archive"
        });

        let create_response = ctx
            .app()
            .oneshot(
                Request::builder()
                    .method("POST")
                    .uri("/chats")
                    .header("Content-Type", "application/json")
                    .body(Body::from(chat2_body.to_string()))
                    .unwrap(),
            )
            .await
            .unwrap();

        let body = axum::body::to_bytes(create_response.into_body(), usize::MAX)
            .await
            .unwrap();
        let chat2: Chat = serde_json::from_slice(&body).unwrap();

        // Archive the second chat
        ctx.app()
            .oneshot(
                Request::builder()
                    .method("POST")
                    .uri(format!("/chats/{}/archive", chat2.id))
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();

        // List archived should only return archived chats
        let response = ctx
            .app()
            .oneshot(
                Request::builder()
                    .method("GET")
                    .uri("/chats/archived")
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::OK);

        let body = axum::body::to_bytes(response.into_body(), usize::MAX)
            .await
            .unwrap();
        let chats: Vec<Chat> = serde_json::from_slice(&body).unwrap();

        assert_eq!(chats.len(), 1);
        assert!(chats[0].archived_at.is_some());
        assert_eq!(chats[0].title, Some("To Archive".to_string()));
    }

    #[tokio::test]
    async fn test_list_chats_for_task() {
        let ctx = TestContext::new().await;
        let project_id = ctx.create_project("Test Project").await;
        let task_id = ctx.create_task(&project_id, "Test Task").await;

        // Create chats for the task with different step indices
        let chat1_body = serde_json::json!({
            "projectId": project_id,
            "taskId": task_id,
            "title": "Step 2",
            "workflowStepIndex": 2
        });

        ctx.app()
            .oneshot(
                Request::builder()
                    .method("POST")
                    .uri("/chats")
                    .header("Content-Type", "application/json")
                    .body(Body::from(chat1_body.to_string()))
                    .unwrap(),
            )
            .await
            .unwrap();

        let chat2_body = serde_json::json!({
            "projectId": project_id,
            "taskId": task_id,
            "title": "Step 1",
            "workflowStepIndex": 1
        });

        ctx.app()
            .oneshot(
                Request::builder()
                    .method("POST")
                    .uri("/chats")
                    .header("Content-Type", "application/json")
                    .body(Body::from(chat2_body.to_string()))
                    .unwrap(),
            )
            .await
            .unwrap();

        // List chats for the task
        let response = ctx
            .app()
            .oneshot(
                Request::builder()
                    .method("GET")
                    .uri(format!("/chats?taskId={}", task_id))
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::OK);

        let body = axum::body::to_bytes(response.into_body(), usize::MAX)
            .await
            .unwrap();
        let chats: Vec<Chat> = serde_json::from_slice(&body).unwrap();

        // Should be ordered by workflow_step_index ASC
        assert_eq!(chats.len(), 2);
        assert_eq!(chats[0].title, Some("Step 1".to_string()));
        assert_eq!(chats[1].title, Some("Step 2".to_string()));
    }

    #[tokio::test]
    async fn test_list_chats_requires_task_id() {
        let ctx = TestContext::new().await;

        // Try to list without taskId - should fail
        let response = ctx
            .app()
            .oneshot(
                Request::builder()
                    .method("GET")
                    .uri("/chats")
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();

        // Should return 400 Bad Request due to missing required query param
        assert_eq!(response.status(), StatusCode::BAD_REQUEST);
    }

    #[tokio::test]
    async fn test_list_standalone_requires_project_id() {
        let ctx = TestContext::new().await;

        // Try to list standalone without projectId - should fail
        let response = ctx
            .app()
            .oneshot(
                Request::builder()
                    .method("GET")
                    .uri("/chats/standalone")
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();

        // Should return 400 Bad Request due to missing required query param
        assert_eq!(response.status(), StatusCode::BAD_REQUEST);
    }

    #[tokio::test]
    async fn test_all_chat_roles() {
        let ctx = TestContext::new().await;
        let project_id = ctx.create_project("Test Project").await;
        let task_id = ctx.create_task(&project_id, "Test Task").await;

        let roles = vec!["main", "review", "test", "terminal"];

        for role in roles {
            let request_body = serde_json::json!({
                "projectId": project_id,
                "taskId": task_id,
                "title": format!("{} Chat", role),
                "chatRole": role
            });

            let response = ctx
                .app()
                .oneshot(
                    Request::builder()
                        .method("POST")
                        .uri("/chats")
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
            let chat: Chat = serde_json::from_slice(&body).unwrap();

            let expected_role: ChatRole = role.parse().unwrap();
            assert_eq!(chat.chat_role, expected_role);
        }
    }
}
