//! Message Routes
//!
//! REST API endpoints for message CRUD operations.

use axum::{
    extract::{Path, Query, State},
    routing::{get, patch, post},
    Json, Router,
};
use openflow_contracts::{CreateMessageRequest, Message, UpdateMessageRequest};
use openflow_core::events::{EntityType, Event};
use openflow_core::services::message;
use serde::Deserialize;

use crate::{error::ServerResult, state::AppState};

/// Query parameters for listing messages
#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ListMessagesQuery {
    /// Chat ID (required)
    pub chat_id: String,
}

/// Request body for setting streaming status
#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SetStreamingRequest {
    pub is_streaming: bool,
}

/// Request body for appending content
#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AppendContentRequest {
    pub content: String,
}

/// Request body for setting token usage
#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SetTokensRequest {
    pub tokens_used: i32,
}

/// Response for message count
#[derive(Debug, serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MessageCountResponse {
    pub count: i64,
}

/// Create message routes
pub fn routes() -> Router<AppState> {
    Router::new()
        .route("/", get(list).post(create))
        .route("/count", get(count))
        .route("/latest", get(get_latest))
        .route("/by-chat", axum::routing::delete(delete_by_chat))
        .route("/:id", get(get_one).patch(update).delete(delete_one))
        .route("/:id/streaming", patch(set_streaming))
        .route("/:id/append", post(append_content))
        .route("/:id/tokens", patch(set_tokens))
}

/// GET /api/messages?chatId=xxx
///
/// List messages for a chat.
async fn list(
    State(state): State<AppState>,
    Query(query): Query<ListMessagesQuery>,
) -> ServerResult<Json<Vec<Message>>> {
    let messages = message::list(&state.pool, &query.chat_id).await?;
    Ok(Json(messages))
}

/// GET /api/messages/{id}
///
/// Get a message by ID.
async fn get_one(
    State(state): State<AppState>,
    Path(id): Path<String>,
) -> ServerResult<Json<Message>> {
    let msg = message::get(&state.pool, &id).await?;
    Ok(Json(msg))
}

/// POST /api/messages
///
/// Create a new message.
async fn create(
    State(state): State<AppState>,
    Json(request): Json<CreateMessageRequest>,
) -> ServerResult<Json<Message>> {
    let msg = message::create(&state.pool, request).await?;

    // Broadcast data changed event
    state.broadcast(Event::created(EntityType::Message, msg.id.clone(), &msg));

    Ok(Json(msg))
}

/// PATCH /api/messages/{id}
///
/// Update an existing message.
async fn update(
    State(state): State<AppState>,
    Path(id): Path<String>,
    Json(request): Json<UpdateMessageRequest>,
) -> ServerResult<Json<Message>> {
    let msg = message::update(&state.pool, &id, request).await?;

    // Broadcast data changed event
    state.broadcast(Event::updated(EntityType::Message, msg.id.clone(), &msg));

    Ok(Json(msg))
}

/// DELETE /api/messages/{id}
///
/// Delete a message by ID.
async fn delete_one(State(state): State<AppState>, Path(id): Path<String>) -> ServerResult<()> {
    message::delete(&state.pool, &id).await?;

    // Broadcast data changed event
    state.broadcast(Event::deleted(EntityType::Message, id));

    Ok(())
}

/// PATCH /api/messages/{id}/streaming
///
/// Set the streaming status of a message.
async fn set_streaming(
    State(state): State<AppState>,
    Path(id): Path<String>,
    Json(request): Json<SetStreamingRequest>,
) -> ServerResult<Json<Message>> {
    let msg = message::set_streaming(&state.pool, &id, request.is_streaming).await?;

    // Broadcast data changed event
    state.broadcast(Event::updated(EntityType::Message, msg.id.clone(), &msg));

    Ok(Json(msg))
}

/// POST /api/messages/{id}/append
///
/// Append content to a streaming message.
async fn append_content(
    State(state): State<AppState>,
    Path(id): Path<String>,
    Json(request): Json<AppendContentRequest>,
) -> ServerResult<Json<Message>> {
    let msg = message::append_content(&state.pool, &id, &request.content).await?;

    // Broadcast data changed event
    state.broadcast(Event::updated(EntityType::Message, msg.id.clone(), &msg));

    Ok(Json(msg))
}

/// PATCH /api/messages/{id}/tokens
///
/// Set the token usage for a message.
async fn set_tokens(
    State(state): State<AppState>,
    Path(id): Path<String>,
    Json(request): Json<SetTokensRequest>,
) -> ServerResult<Json<Message>> {
    let msg = message::set_tokens_used(&state.pool, &id, request.tokens_used).await?;

    // Broadcast data changed event
    state.broadcast(Event::updated(EntityType::Message, msg.id.clone(), &msg));

    Ok(Json(msg))
}

/// GET /api/messages/count?chatId=xxx
///
/// Count messages for a chat.
async fn count(
    State(state): State<AppState>,
    Query(query): Query<ListMessagesQuery>,
) -> ServerResult<Json<MessageCountResponse>> {
    let count = message::count(&state.pool, &query.chat_id).await?;
    Ok(Json(MessageCountResponse { count }))
}

/// GET /api/messages/latest?chatId=xxx
///
/// Get the latest message for a chat.
async fn get_latest(
    State(state): State<AppState>,
    Query(query): Query<ListMessagesQuery>,
) -> ServerResult<Json<Option<Message>>> {
    let msg = message::get_latest(&state.pool, &query.chat_id).await?;
    Ok(Json(msg))
}

/// DELETE /api/messages/by-chat?chatId=xxx
///
/// Delete all messages for a chat.
async fn delete_by_chat(
    State(state): State<AppState>,
    Query(query): Query<ListMessagesQuery>,
) -> ServerResult<Json<u64>> {
    let deleted = message::delete_by_chat(&state.pool, &query.chat_id).await?;

    // Broadcast bulk delete event (using chat_id as identifier)
    state.broadcast(Event::deleted(
        EntityType::Message,
        format!("chat:{}", query.chat_id),
    ));

    Ok(Json(deleted))
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
        ChatRole, CreateChatRequest, CreateProjectRequest, CreateTaskRequest,
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
            Router::new().nest("/messages", routes()).with_state(state)
        }

        /// Create a test project, task, and chat, returning the chat ID
        async fn create_chat(&self) -> String {
            // Create project
            let project_req = CreateProjectRequest {
                name: "Test Project".to_string(),
                git_repo_path: "/path/to/test-project".to_string(),
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
            let proj = project::create(&self.pool, project_req)
                .await
                .expect("Failed to create project");

            // Create task
            let task_req = CreateTaskRequest {
                project_id: proj.id.clone(),
                title: "Test Task".to_string(),
                description: None,
                workflow_template: None,
                parent_task_id: None,
                base_branch: None,
            };
            let tsk = task::create(&self.pool, task_req)
                .await
                .expect("Failed to create task");

            // Create chat
            let chat_req = CreateChatRequest {
                project_id: proj.id,
                task_id: Some(tsk.id),
                title: Some("Test Chat".to_string()),
                chat_role: Some(ChatRole::Review),
                executor_profile_id: None,
                base_branch: None,
                initial_prompt: None,
                hidden_prompt: None,
                is_plan_container: None,
                main_chat_id: None,
                workflow_step_index: None,
            };
            chat::create(&self.pool, chat_req)
                .await
                .expect("Failed to create chat")
                .id
        }
    }

    #[test]
    fn test_routes_creation() {
        let _routes: Router<AppState> = routes();
    }

    #[test]
    fn test_list_query_deserialization() {
        let json = r#"{"chatId": "123"}"#;
        let query: ListMessagesQuery = serde_json::from_str(json).unwrap();
        assert_eq!(query.chat_id, "123");
    }

    #[test]
    fn test_streaming_request_deserialization() {
        let json = r#"{"isStreaming": true}"#;
        let request: SetStreamingRequest = serde_json::from_str(json).unwrap();
        assert!(request.is_streaming);
    }

    #[test]
    fn test_append_content_request_deserialization() {
        let json = r#"{"content": " more text"}"#;
        let request: AppendContentRequest = serde_json::from_str(json).unwrap();
        assert_eq!(request.content, " more text");
    }

    #[test]
    fn test_set_tokens_request_deserialization() {
        let json = r#"{"tokensUsed": 1500}"#;
        let request: SetTokensRequest = serde_json::from_str(json).unwrap();
        assert_eq!(request.tokens_used, 1500);
    }

    #[test]
    fn test_message_count_response_serialization() {
        let response = MessageCountResponse { count: 42 };
        let json = serde_json::to_string(&response).unwrap();
        assert!(json.contains("\"count\":42"));
    }

    #[tokio::test]
    async fn test_list_messages_empty() {
        let ctx = TestContext::new().await;
        let chat_id = ctx.create_chat().await;

        let response = ctx
            .app()
            .oneshot(
                Request::builder()
                    .method("GET")
                    .uri(format!("/messages?chatId={}", chat_id))
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::OK);

        let body = axum::body::to_bytes(response.into_body(), usize::MAX)
            .await
            .unwrap();
        let messages: Vec<Message> = serde_json::from_slice(&body).unwrap();

        assert!(messages.is_empty());
    }

    #[tokio::test]
    async fn test_create_message() {
        let ctx = TestContext::new().await;
        let chat_id = ctx.create_chat().await;

        let request_body = serde_json::json!({
            "chatId": chat_id,
            "role": "user",
            "content": "Hello, world!"
        });

        let response = ctx
            .app()
            .oneshot(
                Request::builder()
                    .method("POST")
                    .uri("/messages")
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
        let msg: Message = serde_json::from_slice(&body).unwrap();

        assert_eq!(msg.chat_id, chat_id);
        assert_eq!(msg.content, "Hello, world!");
        assert_eq!(msg.role, openflow_contracts::MessageRole::User);
        assert!(!msg.is_streaming);
        assert!(!msg.id.is_empty());
    }

    #[tokio::test]
    async fn test_create_assistant_message_with_model() {
        let ctx = TestContext::new().await;
        let chat_id = ctx.create_chat().await;

        let request_body = serde_json::json!({
            "chatId": chat_id,
            "role": "assistant",
            "content": "I'll help you with that.",
            "model": "claude-3-opus"
        });

        let response = ctx
            .app()
            .oneshot(
                Request::builder()
                    .method("POST")
                    .uri("/messages")
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
        let msg: Message = serde_json::from_slice(&body).unwrap();

        assert_eq!(msg.role, openflow_contracts::MessageRole::Assistant);
        assert_eq!(msg.model, Some("claude-3-opus".to_string()));
    }

    #[tokio::test]
    async fn test_create_streaming_message() {
        let ctx = TestContext::new().await;
        let chat_id = ctx.create_chat().await;

        let request_body = serde_json::json!({
            "chatId": chat_id,
            "role": "assistant",
            "content": "",
            "isStreaming": true
        });

        let response = ctx
            .app()
            .oneshot(
                Request::builder()
                    .method("POST")
                    .uri("/messages")
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
        let msg: Message = serde_json::from_slice(&body).unwrap();

        assert!(msg.is_streaming);
        assert!(msg.content.is_empty());
    }

    #[tokio::test]
    async fn test_get_message() {
        let ctx = TestContext::new().await;
        let chat_id = ctx.create_chat().await;

        // Create a message first
        let create_body = serde_json::json!({
            "chatId": chat_id,
            "role": "user",
            "content": "Test message"
        });

        let create_response = ctx
            .app()
            .oneshot(
                Request::builder()
                    .method("POST")
                    .uri("/messages")
                    .header("Content-Type", "application/json")
                    .body(Body::from(create_body.to_string()))
                    .unwrap(),
            )
            .await
            .unwrap();

        let body = axum::body::to_bytes(create_response.into_body(), usize::MAX)
            .await
            .unwrap();
        let created: Message = serde_json::from_slice(&body).unwrap();

        // Get the message
        let response = ctx
            .app()
            .oneshot(
                Request::builder()
                    .method("GET")
                    .uri(format!("/messages/{}", created.id))
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::OK);

        let body = axum::body::to_bytes(response.into_body(), usize::MAX)
            .await
            .unwrap();
        let msg: Message = serde_json::from_slice(&body).unwrap();

        assert_eq!(msg.id, created.id);
        assert_eq!(msg.content, "Test message");
    }

    #[tokio::test]
    async fn test_get_message_not_found() {
        let ctx = TestContext::new().await;

        let response = ctx
            .app()
            .oneshot(
                Request::builder()
                    .method("GET")
                    .uri("/messages/non-existent-id")
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::NOT_FOUND);
    }

    #[tokio::test]
    async fn test_update_message() {
        let ctx = TestContext::new().await;
        let chat_id = ctx.create_chat().await;

        // Create a message first
        let create_body = serde_json::json!({
            "chatId": chat_id,
            "role": "assistant",
            "content": "Original content"
        });

        let create_response = ctx
            .app()
            .oneshot(
                Request::builder()
                    .method("POST")
                    .uri("/messages")
                    .header("Content-Type", "application/json")
                    .body(Body::from(create_body.to_string()))
                    .unwrap(),
            )
            .await
            .unwrap();

        let body = axum::body::to_bytes(create_response.into_body(), usize::MAX)
            .await
            .unwrap();
        let created: Message = serde_json::from_slice(&body).unwrap();

        // Update the message
        let update_body = serde_json::json!({
            "content": "Updated content",
            "tokensUsed": 500
        });

        let response = ctx
            .app()
            .oneshot(
                Request::builder()
                    .method("PATCH")
                    .uri(format!("/messages/{}", created.id))
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
        let msg: Message = serde_json::from_slice(&body).unwrap();

        assert_eq!(msg.content, "Updated content");
        assert_eq!(msg.tokens_used, Some(500));
    }

    #[tokio::test]
    async fn test_delete_message() {
        let ctx = TestContext::new().await;
        let chat_id = ctx.create_chat().await;

        // Create a message first
        let create_body = serde_json::json!({
            "chatId": chat_id,
            "role": "user",
            "content": "To delete"
        });

        let create_response = ctx
            .app()
            .oneshot(
                Request::builder()
                    .method("POST")
                    .uri("/messages")
                    .header("Content-Type", "application/json")
                    .body(Body::from(create_body.to_string()))
                    .unwrap(),
            )
            .await
            .unwrap();

        let body = axum::body::to_bytes(create_response.into_body(), usize::MAX)
            .await
            .unwrap();
        let created: Message = serde_json::from_slice(&body).unwrap();

        // Delete it
        let response = ctx
            .app()
            .oneshot(
                Request::builder()
                    .method("DELETE")
                    .uri(format!("/messages/{}", created.id))
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
                    .uri(format!("/messages/{}", created.id))
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();

        assert_eq!(get_response.status(), StatusCode::NOT_FOUND);
    }

    #[tokio::test]
    async fn test_set_streaming() {
        let ctx = TestContext::new().await;
        let chat_id = ctx.create_chat().await;

        // Create a streaming message first
        let create_body = serde_json::json!({
            "chatId": chat_id,
            "role": "assistant",
            "content": "",
            "isStreaming": true
        });

        let create_response = ctx
            .app()
            .oneshot(
                Request::builder()
                    .method("POST")
                    .uri("/messages")
                    .header("Content-Type", "application/json")
                    .body(Body::from(create_body.to_string()))
                    .unwrap(),
            )
            .await
            .unwrap();

        let body = axum::body::to_bytes(create_response.into_body(), usize::MAX)
            .await
            .unwrap();
        let created: Message = serde_json::from_slice(&body).unwrap();

        assert!(created.is_streaming);

        // Complete streaming
        let streaming_body = serde_json::json!({
            "isStreaming": false
        });

        let response = ctx
            .app()
            .oneshot(
                Request::builder()
                    .method("PATCH")
                    .uri(format!("/messages/{}/streaming", created.id))
                    .header("Content-Type", "application/json")
                    .body(Body::from(streaming_body.to_string()))
                    .unwrap(),
            )
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::OK);

        let body = axum::body::to_bytes(response.into_body(), usize::MAX)
            .await
            .unwrap();
        let msg: Message = serde_json::from_slice(&body).unwrap();

        assert!(!msg.is_streaming);
    }

    #[tokio::test]
    async fn test_append_content() {
        let ctx = TestContext::new().await;
        let chat_id = ctx.create_chat().await;

        // Create a streaming message first
        let create_body = serde_json::json!({
            "chatId": chat_id,
            "role": "assistant",
            "content": "Hello",
            "isStreaming": true
        });

        let create_response = ctx
            .app()
            .oneshot(
                Request::builder()
                    .method("POST")
                    .uri("/messages")
                    .header("Content-Type", "application/json")
                    .body(Body::from(create_body.to_string()))
                    .unwrap(),
            )
            .await
            .unwrap();

        let body = axum::body::to_bytes(create_response.into_body(), usize::MAX)
            .await
            .unwrap();
        let created: Message = serde_json::from_slice(&body).unwrap();

        // Append content
        let append_body = serde_json::json!({
            "content": ", world!"
        });

        let response = ctx
            .app()
            .oneshot(
                Request::builder()
                    .method("POST")
                    .uri(format!("/messages/{}/append", created.id))
                    .header("Content-Type", "application/json")
                    .body(Body::from(append_body.to_string()))
                    .unwrap(),
            )
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::OK);

        let body = axum::body::to_bytes(response.into_body(), usize::MAX)
            .await
            .unwrap();
        let msg: Message = serde_json::from_slice(&body).unwrap();

        assert_eq!(msg.content, "Hello, world!");
    }

    #[tokio::test]
    async fn test_set_tokens() {
        let ctx = TestContext::new().await;
        let chat_id = ctx.create_chat().await;

        // Create a message first
        let create_body = serde_json::json!({
            "chatId": chat_id,
            "role": "assistant",
            "content": "Response"
        });

        let create_response = ctx
            .app()
            .oneshot(
                Request::builder()
                    .method("POST")
                    .uri("/messages")
                    .header("Content-Type", "application/json")
                    .body(Body::from(create_body.to_string()))
                    .unwrap(),
            )
            .await
            .unwrap();

        let body = axum::body::to_bytes(create_response.into_body(), usize::MAX)
            .await
            .unwrap();
        let created: Message = serde_json::from_slice(&body).unwrap();

        assert!(created.tokens_used.is_none());

        // Set tokens
        let tokens_body = serde_json::json!({
            "tokensUsed": 1500
        });

        let response = ctx
            .app()
            .oneshot(
                Request::builder()
                    .method("PATCH")
                    .uri(format!("/messages/{}/tokens", created.id))
                    .header("Content-Type", "application/json")
                    .body(Body::from(tokens_body.to_string()))
                    .unwrap(),
            )
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::OK);

        let body = axum::body::to_bytes(response.into_body(), usize::MAX)
            .await
            .unwrap();
        let msg: Message = serde_json::from_slice(&body).unwrap();

        assert_eq!(msg.tokens_used, Some(1500));
    }

    #[tokio::test]
    async fn test_count_messages() {
        let ctx = TestContext::new().await;
        let chat_id = ctx.create_chat().await;

        // Count empty chat
        let response = ctx
            .app()
            .oneshot(
                Request::builder()
                    .method("GET")
                    .uri(format!("/messages/count?chatId={}", chat_id))
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::OK);

        let body = axum::body::to_bytes(response.into_body(), usize::MAX)
            .await
            .unwrap();
        let count_resp: MessageCountResponse = serde_json::from_slice(&body).unwrap();

        assert_eq!(count_resp.count, 0);

        // Create messages
        for i in 0..3 {
            let create_body = serde_json::json!({
                "chatId": chat_id,
                "role": "user",
                "content": format!("Message {}", i)
            });

            ctx.app()
                .oneshot(
                    Request::builder()
                        .method("POST")
                        .uri("/messages")
                        .header("Content-Type", "application/json")
                        .body(Body::from(create_body.to_string()))
                        .unwrap(),
                )
                .await
                .unwrap();
        }

        // Count again
        let response = ctx
            .app()
            .oneshot(
                Request::builder()
                    .method("GET")
                    .uri(format!("/messages/count?chatId={}", chat_id))
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();

        let body = axum::body::to_bytes(response.into_body(), usize::MAX)
            .await
            .unwrap();
        let count_resp: MessageCountResponse = serde_json::from_slice(&body).unwrap();

        assert_eq!(count_resp.count, 3);
    }

    #[tokio::test]
    async fn test_get_latest_message() {
        let ctx = TestContext::new().await;
        let chat_id = ctx.create_chat().await;

        // Get latest from empty chat
        let response = ctx
            .app()
            .oneshot(
                Request::builder()
                    .method("GET")
                    .uri(format!("/messages/latest?chatId={}", chat_id))
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::OK);

        let body = axum::body::to_bytes(response.into_body(), usize::MAX)
            .await
            .unwrap();
        let latest: Option<Message> = serde_json::from_slice(&body).unwrap();

        assert!(latest.is_none());

        // Create messages
        for i in 1..=3 {
            let create_body = serde_json::json!({
                "chatId": chat_id,
                "role": "user",
                "content": format!("Message {}", i)
            });

            ctx.app()
                .oneshot(
                    Request::builder()
                        .method("POST")
                        .uri("/messages")
                        .header("Content-Type", "application/json")
                        .body(Body::from(create_body.to_string()))
                        .unwrap(),
                )
                .await
                .unwrap();
        }

        // Get latest
        let response = ctx
            .app()
            .oneshot(
                Request::builder()
                    .method("GET")
                    .uri(format!("/messages/latest?chatId={}", chat_id))
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();

        let body = axum::body::to_bytes(response.into_body(), usize::MAX)
            .await
            .unwrap();
        let latest: Option<Message> = serde_json::from_slice(&body).unwrap();

        assert!(latest.is_some());
        assert_eq!(latest.unwrap().content, "Message 3");
    }

    #[tokio::test]
    async fn test_delete_by_chat() {
        let ctx = TestContext::new().await;
        let chat_id = ctx.create_chat().await;

        // Create messages
        for i in 0..5 {
            let create_body = serde_json::json!({
                "chatId": chat_id,
                "role": "user",
                "content": format!("Message {}", i)
            });

            ctx.app()
                .oneshot(
                    Request::builder()
                        .method("POST")
                        .uri("/messages")
                        .header("Content-Type", "application/json")
                        .body(Body::from(create_body.to_string()))
                        .unwrap(),
                )
                .await
                .unwrap();
        }

        // Verify messages exist
        let list_response = ctx
            .app()
            .oneshot(
                Request::builder()
                    .method("GET")
                    .uri(format!("/messages?chatId={}", chat_id))
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();

        let body = axum::body::to_bytes(list_response.into_body(), usize::MAX)
            .await
            .unwrap();
        let messages: Vec<Message> = serde_json::from_slice(&body).unwrap();
        assert_eq!(messages.len(), 5);

        // Delete all messages for the chat
        let response = ctx
            .app()
            .oneshot(
                Request::builder()
                    .method("DELETE")
                    .uri(format!("/messages/by-chat?chatId={}", chat_id))
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::OK);

        let body = axum::body::to_bytes(response.into_body(), usize::MAX)
            .await
            .unwrap();
        let deleted: u64 = serde_json::from_slice(&body).unwrap();
        assert_eq!(deleted, 5);

        // Verify messages are gone
        let list_response = ctx
            .app()
            .oneshot(
                Request::builder()
                    .method("GET")
                    .uri(format!("/messages?chatId={}", chat_id))
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();

        let body = axum::body::to_bytes(list_response.into_body(), usize::MAX)
            .await
            .unwrap();
        let messages: Vec<Message> = serde_json::from_slice(&body).unwrap();
        assert!(messages.is_empty());
    }

    #[tokio::test]
    async fn test_list_messages_requires_chat_id() {
        let ctx = TestContext::new().await;

        let response = ctx
            .app()
            .oneshot(
                Request::builder()
                    .method("GET")
                    .uri("/messages")
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();

        // Should return 400 Bad Request due to missing required query param
        assert_eq!(response.status(), StatusCode::BAD_REQUEST);
    }

    #[tokio::test]
    async fn test_list_messages_ordered_by_created_at() {
        let ctx = TestContext::new().await;
        let chat_id = ctx.create_chat().await;

        // Create messages in order
        for content in ["First", "Second", "Third"] {
            let create_body = serde_json::json!({
                "chatId": chat_id,
                "role": "user",
                "content": content
            });

            ctx.app()
                .oneshot(
                    Request::builder()
                        .method("POST")
                        .uri("/messages")
                        .header("Content-Type", "application/json")
                        .body(Body::from(create_body.to_string()))
                        .unwrap(),
                )
                .await
                .unwrap();
        }

        // List and verify order
        let response = ctx
            .app()
            .oneshot(
                Request::builder()
                    .method("GET")
                    .uri(format!("/messages?chatId={}", chat_id))
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();

        let body = axum::body::to_bytes(response.into_body(), usize::MAX)
            .await
            .unwrap();
        let messages: Vec<Message> = serde_json::from_slice(&body).unwrap();

        assert_eq!(messages.len(), 3);
        assert_eq!(messages[0].content, "First");
        assert_eq!(messages[1].content, "Second");
        assert_eq!(messages[2].content, "Third");
    }

    #[tokio::test]
    async fn test_create_system_message() {
        let ctx = TestContext::new().await;
        let chat_id = ctx.create_chat().await;

        let request_body = serde_json::json!({
            "chatId": chat_id,
            "role": "system",
            "content": "You are a helpful assistant."
        });

        let response = ctx
            .app()
            .oneshot(
                Request::builder()
                    .method("POST")
                    .uri("/messages")
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
        let msg: Message = serde_json::from_slice(&body).unwrap();

        assert_eq!(msg.role, openflow_contracts::MessageRole::System);
        assert_eq!(msg.content, "You are a helpful assistant.");
    }

    #[tokio::test]
    async fn test_create_message_with_tool_calls() {
        let ctx = TestContext::new().await;
        let chat_id = ctx.create_chat().await;

        let request_body = serde_json::json!({
            "chatId": chat_id,
            "role": "assistant",
            "content": "Let me read that file for you.",
            "toolCalls": r#"[{"name":"read_file","arguments":{"path":"src/main.rs"}}]"#
        });

        let response = ctx
            .app()
            .oneshot(
                Request::builder()
                    .method("POST")
                    .uri("/messages")
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
        let msg: Message = serde_json::from_slice(&body).unwrap();

        assert!(msg.tool_calls.is_some());
        assert!(msg.tool_calls.unwrap().contains("read_file"));
    }
}
