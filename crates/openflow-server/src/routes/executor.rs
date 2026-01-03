//! Executor Routes
//!
//! REST API endpoints for executor profile management and running executors.
//!
//! # Endpoints
//!
//! - `POST /api/executor/run` - Run an executor (AI agent) in a chat
//! - `GET /api/executor/profiles` - List all executor profiles
//! - `GET /api/executor/profiles/default` - Get the default executor profile
//! - `POST /api/executor/profiles` - Create a new executor profile
//! - `GET /api/executor/profiles/:id` - Get an executor profile by ID
//! - `PATCH /api/executor/profiles/:id` - Update an executor profile
//! - `DELETE /api/executor/profiles/:id` - Delete an executor profile

use axum::{
    extract::{Path, State},
    routing::{get, post},
    Json, Router,
};
use openflow_contracts::{
    CreateExecutorProfileRequest, ExecutionProcess, ExecutorProfile, RunExecutorRequest,
    UpdateExecutorProfileRequest,
};
use openflow_core::events::{EntityType, Event};
use openflow_core::services::{executor, executor_profile};

use crate::{error::ServerResult, state::AppState};

/// Create executor routes
///
/// Provides endpoints for:
/// - Running AI agents (Claude Code, Gemini CLI, etc.)
/// - Managing executor profiles (CRUD operations)
/// - Getting the default profile
pub fn routes() -> Router<AppState> {
    Router::new()
        .route("/run", post(run))
        .route("/profiles", get(list_profiles).post(create_profile))
        .route("/profiles/default", get(get_default_profile))
        .route(
            "/profiles/:id",
            get(get_profile)
                .patch(update_profile)
                .delete(delete_profile),
        )
}

/// POST /api/executor/run
///
/// Run an executor (AI agent) in a chat.
async fn run(
    State(state): State<AppState>,
    Json(request): Json<RunExecutorRequest>,
) -> ServerResult<Json<ExecutionProcess>> {
    // Prepare executor context
    let context = executor::prepare(
        &state.pool,
        &request.chat_id,
        &request.prompt,
        request.executor_profile_id.clone(),
    )
    .await?;

    // Start the process
    let process = state
        .process_service
        .start(&state.pool, context.create_request, context.start_request)
        .await?;

    // Broadcast data changed event
    state.broadcast(Event::created(
        EntityType::Process,
        process.id.clone(),
        &process,
    ));

    Ok(Json(process))
}

/// GET /api/executor/profiles
///
/// List all executor profiles.
async fn list_profiles(State(state): State<AppState>) -> ServerResult<Json<Vec<ExecutorProfile>>> {
    let profiles = executor_profile::list(&state.pool).await?;
    Ok(Json(profiles))
}

/// GET /api/executor/profiles/default
///
/// Get the default executor profile.
async fn get_default_profile(
    State(state): State<AppState>,
) -> ServerResult<Json<Option<ExecutorProfile>>> {
    let profile = executor_profile::get_default(&state.pool).await?;
    Ok(Json(profile))
}

/// GET /api/executor/profiles/{id}
///
/// Get an executor profile by ID.
async fn get_profile(
    State(state): State<AppState>,
    Path(id): Path<String>,
) -> ServerResult<Json<ExecutorProfile>> {
    let profile = executor_profile::get(&state.pool, &id).await?;
    Ok(Json(profile))
}

/// POST /api/executor/profiles
///
/// Create a new executor profile.
async fn create_profile(
    State(state): State<AppState>,
    Json(request): Json<CreateExecutorProfileRequest>,
) -> ServerResult<Json<ExecutorProfile>> {
    let profile = executor_profile::create(&state.pool, request).await?;

    // Broadcast data changed event
    state.broadcast(Event::created(
        EntityType::ExecutorProfile,
        profile.id.clone(),
        &profile,
    ));

    Ok(Json(profile))
}

/// PATCH /api/executor/profiles/{id}
///
/// Update an existing executor profile.
async fn update_profile(
    State(state): State<AppState>,
    Path(id): Path<String>,
    Json(request): Json<UpdateExecutorProfileRequest>,
) -> ServerResult<Json<ExecutorProfile>> {
    let profile = executor_profile::update(&state.pool, &id, request).await?;

    // Broadcast data changed event
    state.broadcast(Event::updated(
        EntityType::ExecutorProfile,
        profile.id.clone(),
        &profile,
    ));

    Ok(Json(profile))
}

/// DELETE /api/executor/profiles/{id}
///
/// Delete an executor profile.
async fn delete_profile(State(state): State<AppState>, Path(id): Path<String>) -> ServerResult<()> {
    executor_profile::delete(&state.pool, &id).await?;

    // Broadcast data changed event
    state.broadcast(Event::deleted(EntityType::ExecutorProfile, id));

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
    use openflow_core::events::NullBroadcaster;
    use openflow_core::services::process::ProcessService;
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
            Router::new().nest("/executor", routes()).with_state(state)
        }
    }

    /// Helper to create a test app state
    async fn test_state() -> AppState {
        let pool = openflow_db::create_test_db().await.unwrap();
        let process_service = Arc::new(ProcessService::new());
        let broadcaster: Arc<dyn openflow_core::events::EventBroadcaster> =
            Arc::new(NullBroadcaster);
        let client_manager = crate::ws::ClientManager::new();
        AppState::new(pool, process_service, broadcaster, client_manager)
    }

    /// Helper to create a test router with executor routes
    async fn test_router() -> Router {
        let state = test_state().await;
        Router::new().nest("/executor", routes()).with_state(state)
    }

    #[test]
    fn test_routes_creation() {
        // Verify routes are created without panic
        let _routes: Router<AppState> = routes();
    }

    #[tokio::test]
    async fn test_list_profiles_empty() {
        let app = test_router().await;

        let response = app
            .oneshot(
                Request::builder()
                    .method("GET")
                    .uri("/executor/profiles")
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::OK);

        let body = axum::body::to_bytes(response.into_body(), usize::MAX)
            .await
            .unwrap();
        let profiles: Vec<ExecutorProfile> = serde_json::from_slice(&body).unwrap();

        // Empty list since we're not seeding profiles in tests
        assert!(profiles.is_empty());
    }

    #[tokio::test]
    async fn test_create_profile() {
        let ctx = TestContext::new().await;

        let request_body = serde_json::json!({
            "name": "Claude Code",
            "command": "claude"
        });

        let response = ctx
            .app()
            .oneshot(
                Request::builder()
                    .method("POST")
                    .uri("/executor/profiles")
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
        let profile: ExecutorProfile = serde_json::from_slice(&body).unwrap();

        assert_eq!(profile.name, "Claude Code");
        assert_eq!(profile.command, "claude");
        assert!(!profile.id.is_empty());
        assert!(!profile.is_default);
    }

    #[tokio::test]
    async fn test_create_profile_with_all_fields() {
        let ctx = TestContext::new().await;

        let request_body = serde_json::json!({
            "name": "Claude Code Pro",
            "description": "Pro version with extra features",
            "command": "claude",
            "args": "[\"--verbose\", \"--no-confirm\"]",
            "env": "{\"ANTHROPIC_API_KEY\": \"test\"}",
            "model": "claude-3-opus",
            "isDefault": true
        });

        let response = ctx
            .app()
            .oneshot(
                Request::builder()
                    .method("POST")
                    .uri("/executor/profiles")
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
        let profile: ExecutorProfile = serde_json::from_slice(&body).unwrap();

        assert_eq!(profile.name, "Claude Code Pro");
        assert_eq!(profile.command, "claude");
        assert_eq!(
            profile.description,
            Some("Pro version with extra features".to_string())
        );
        assert_eq!(
            profile.args,
            Some("[\"--verbose\", \"--no-confirm\"]".to_string())
        );
        assert_eq!(
            profile.env,
            Some("{\"ANTHROPIC_API_KEY\": \"test\"}".to_string())
        );
        assert_eq!(profile.model, Some("claude-3-opus".to_string()));
        assert!(profile.is_default);
    }

    #[tokio::test]
    async fn test_get_profile() {
        let ctx = TestContext::new().await;

        // Create a profile first
        let create_body = serde_json::json!({
            "name": "Get Test Profile",
            "command": "gemini"
        });

        let create_response = ctx
            .app()
            .oneshot(
                Request::builder()
                    .method("POST")
                    .uri("/executor/profiles")
                    .header("Content-Type", "application/json")
                    .body(Body::from(create_body.to_string()))
                    .unwrap(),
            )
            .await
            .unwrap();

        let body = axum::body::to_bytes(create_response.into_body(), usize::MAX)
            .await
            .unwrap();
        let created: ExecutorProfile = serde_json::from_slice(&body).unwrap();

        // Get the profile
        let response = ctx
            .app()
            .oneshot(
                Request::builder()
                    .method("GET")
                    .uri(format!("/executor/profiles/{}", created.id))
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::OK);

        let body = axum::body::to_bytes(response.into_body(), usize::MAX)
            .await
            .unwrap();
        let profile: ExecutorProfile = serde_json::from_slice(&body).unwrap();

        assert_eq!(profile.id, created.id);
        assert_eq!(profile.name, "Get Test Profile");
        assert_eq!(profile.command, "gemini");
    }

    #[tokio::test]
    async fn test_get_profile_not_found() {
        let app = test_router().await;

        let response = app
            .oneshot(
                Request::builder()
                    .method("GET")
                    .uri("/executor/profiles/non-existent-id")
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::NOT_FOUND);
    }

    #[tokio::test]
    async fn test_update_profile() {
        let ctx = TestContext::new().await;

        // Create a profile first
        let create_body = serde_json::json!({
            "name": "Original Profile",
            "command": "original"
        });

        let create_response = ctx
            .app()
            .oneshot(
                Request::builder()
                    .method("POST")
                    .uri("/executor/profiles")
                    .header("Content-Type", "application/json")
                    .body(Body::from(create_body.to_string()))
                    .unwrap(),
            )
            .await
            .unwrap();

        let body = axum::body::to_bytes(create_response.into_body(), usize::MAX)
            .await
            .unwrap();
        let created: ExecutorProfile = serde_json::from_slice(&body).unwrap();

        // Update the profile
        let update_body = serde_json::json!({
            "name": "Updated Profile",
            "description": "New description"
        });

        let response = ctx
            .app()
            .oneshot(
                Request::builder()
                    .method("PATCH")
                    .uri(format!("/executor/profiles/{}", created.id))
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
        let profile: ExecutorProfile = serde_json::from_slice(&body).unwrap();

        assert_eq!(profile.name, "Updated Profile");
        assert_eq!(profile.description, Some("New description".to_string()));
        assert_eq!(profile.command, "original"); // Unchanged
    }

    #[tokio::test]
    async fn test_update_profile_not_found() {
        let app = test_router().await;

        let update_body = serde_json::json!({
            "name": "New Name"
        });

        let response = app
            .oneshot(
                Request::builder()
                    .method("PATCH")
                    .uri("/executor/profiles/non-existent-id")
                    .header("Content-Type", "application/json")
                    .body(Body::from(update_body.to_string()))
                    .unwrap(),
            )
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::NOT_FOUND);
    }

    #[tokio::test]
    async fn test_delete_profile() {
        let ctx = TestContext::new().await;

        // Create a profile first
        let create_body = serde_json::json!({
            "name": "To Delete",
            "command": "delete-me"
        });

        let create_response = ctx
            .app()
            .oneshot(
                Request::builder()
                    .method("POST")
                    .uri("/executor/profiles")
                    .header("Content-Type", "application/json")
                    .body(Body::from(create_body.to_string()))
                    .unwrap(),
            )
            .await
            .unwrap();

        let body = axum::body::to_bytes(create_response.into_body(), usize::MAX)
            .await
            .unwrap();
        let created: ExecutorProfile = serde_json::from_slice(&body).unwrap();

        // Delete the profile
        let response = ctx
            .app()
            .oneshot(
                Request::builder()
                    .method("DELETE")
                    .uri(format!("/executor/profiles/{}", created.id))
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
                    .uri(format!("/executor/profiles/{}", created.id))
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();

        assert_eq!(get_response.status(), StatusCode::NOT_FOUND);
    }

    #[tokio::test]
    async fn test_delete_profile_not_found() {
        let app = test_router().await;

        let response = app
            .oneshot(
                Request::builder()
                    .method("DELETE")
                    .uri("/executor/profiles/non-existent-id")
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::NOT_FOUND);
    }

    #[tokio::test]
    async fn test_get_default_profile_none() {
        let app = test_router().await;

        let response = app
            .oneshot(
                Request::builder()
                    .method("GET")
                    .uri("/executor/profiles/default")
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::OK);

        let body = axum::body::to_bytes(response.into_body(), usize::MAX)
            .await
            .unwrap();
        let profile: Option<ExecutorProfile> = serde_json::from_slice(&body).unwrap();

        assert!(profile.is_none());
    }

    #[tokio::test]
    async fn test_get_default_profile() {
        let ctx = TestContext::new().await;

        // Create a default profile
        let create_body = serde_json::json!({
            "name": "Default Profile",
            "command": "claude",
            "isDefault": true
        });

        ctx.app()
            .oneshot(
                Request::builder()
                    .method("POST")
                    .uri("/executor/profiles")
                    .header("Content-Type", "application/json")
                    .body(Body::from(create_body.to_string()))
                    .unwrap(),
            )
            .await
            .unwrap();

        // Get the default profile
        let response = ctx
            .app()
            .oneshot(
                Request::builder()
                    .method("GET")
                    .uri("/executor/profiles/default")
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::OK);

        let body = axum::body::to_bytes(response.into_body(), usize::MAX)
            .await
            .unwrap();
        let profile: Option<ExecutorProfile> = serde_json::from_slice(&body).unwrap();

        assert!(profile.is_some());
        assert_eq!(profile.unwrap().name, "Default Profile");
    }

    #[tokio::test]
    async fn test_only_one_default_profile() {
        let ctx = TestContext::new().await;

        // Create first default profile
        let first_body = serde_json::json!({
            "name": "First Default",
            "command": "first",
            "isDefault": true
        });

        let first_response = ctx
            .app()
            .oneshot(
                Request::builder()
                    .method("POST")
                    .uri("/executor/profiles")
                    .header("Content-Type", "application/json")
                    .body(Body::from(first_body.to_string()))
                    .unwrap(),
            )
            .await
            .unwrap();

        let body = axum::body::to_bytes(first_response.into_body(), usize::MAX)
            .await
            .unwrap();
        let first: ExecutorProfile = serde_json::from_slice(&body).unwrap();

        // Create second default profile
        let second_body = serde_json::json!({
            "name": "Second Default",
            "command": "second",
            "isDefault": true
        });

        let second_response = ctx
            .app()
            .oneshot(
                Request::builder()
                    .method("POST")
                    .uri("/executor/profiles")
                    .header("Content-Type", "application/json")
                    .body(Body::from(second_body.to_string()))
                    .unwrap(),
            )
            .await
            .unwrap();

        let body = axum::body::to_bytes(second_response.into_body(), usize::MAX)
            .await
            .unwrap();
        let second: ExecutorProfile = serde_json::from_slice(&body).unwrap();
        assert!(second.is_default);

        // First profile should no longer be default
        let get_response = ctx
            .app()
            .oneshot(
                Request::builder()
                    .method("GET")
                    .uri(format!("/executor/profiles/{}", first.id))
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();

        let body = axum::body::to_bytes(get_response.into_body(), usize::MAX)
            .await
            .unwrap();
        let first_updated: ExecutorProfile = serde_json::from_slice(&body).unwrap();
        assert!(!first_updated.is_default);

        // Default should be second
        let default_response = ctx
            .app()
            .oneshot(
                Request::builder()
                    .method("GET")
                    .uri("/executor/profiles/default")
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();

        let body = axum::body::to_bytes(default_response.into_body(), usize::MAX)
            .await
            .unwrap();
        let default: Option<ExecutorProfile> = serde_json::from_slice(&body).unwrap();
        assert_eq!(default.unwrap().name, "Second Default");
    }

    #[tokio::test]
    async fn test_list_profiles_ordered_by_name() {
        let ctx = TestContext::new().await;

        // Create profiles in random order
        for name in ["Zod Profile", "Alpha Profile", "Middle Profile"] {
            let body = serde_json::json!({
                "name": name,
                "command": "test"
            });

            ctx.app()
                .oneshot(
                    Request::builder()
                        .method("POST")
                        .uri("/executor/profiles")
                        .header("Content-Type", "application/json")
                        .body(Body::from(body.to_string()))
                        .unwrap(),
                )
                .await
                .unwrap();
        }

        // List profiles
        let response = ctx
            .app()
            .oneshot(
                Request::builder()
                    .method("GET")
                    .uri("/executor/profiles")
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::OK);

        let body = axum::body::to_bytes(response.into_body(), usize::MAX)
            .await
            .unwrap();
        let profiles: Vec<ExecutorProfile> = serde_json::from_slice(&body).unwrap();

        assert_eq!(profiles.len(), 3);
        assert_eq!(profiles[0].name, "Alpha Profile");
        assert_eq!(profiles[1].name, "Middle Profile");
        assert_eq!(profiles[2].name, "Zod Profile");
    }

    #[tokio::test]
    async fn test_update_to_set_default() {
        let ctx = TestContext::new().await;

        // Create a default profile
        let first_body = serde_json::json!({
            "name": "First",
            "command": "first",
            "isDefault": true
        });

        let first_response = ctx
            .app()
            .oneshot(
                Request::builder()
                    .method("POST")
                    .uri("/executor/profiles")
                    .header("Content-Type", "application/json")
                    .body(Body::from(first_body.to_string()))
                    .unwrap(),
            )
            .await
            .unwrap();

        let body = axum::body::to_bytes(first_response.into_body(), usize::MAX)
            .await
            .unwrap();
        let first: ExecutorProfile = serde_json::from_slice(&body).unwrap();

        // Create a non-default profile
        let second_body = serde_json::json!({
            "name": "Second",
            "command": "second"
        });

        let second_response = ctx
            .app()
            .oneshot(
                Request::builder()
                    .method("POST")
                    .uri("/executor/profiles")
                    .header("Content-Type", "application/json")
                    .body(Body::from(second_body.to_string()))
                    .unwrap(),
            )
            .await
            .unwrap();

        let body = axum::body::to_bytes(second_response.into_body(), usize::MAX)
            .await
            .unwrap();
        let second: ExecutorProfile = serde_json::from_slice(&body).unwrap();

        // Update second to be default
        let update_body = serde_json::json!({
            "isDefault": true
        });

        let update_response = ctx
            .app()
            .oneshot(
                Request::builder()
                    .method("PATCH")
                    .uri(format!("/executor/profiles/{}", second.id))
                    .header("Content-Type", "application/json")
                    .body(Body::from(update_body.to_string()))
                    .unwrap(),
            )
            .await
            .unwrap();

        assert_eq!(update_response.status(), StatusCode::OK);

        let body = axum::body::to_bytes(update_response.into_body(), usize::MAX)
            .await
            .unwrap();
        let updated: ExecutorProfile = serde_json::from_slice(&body).unwrap();
        assert!(updated.is_default);

        // First should no longer be default
        let get_response = ctx
            .app()
            .oneshot(
                Request::builder()
                    .method("GET")
                    .uri(format!("/executor/profiles/{}", first.id))
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();

        let body = axum::body::to_bytes(get_response.into_body(), usize::MAX)
            .await
            .unwrap();
        let first_updated: ExecutorProfile = serde_json::from_slice(&body).unwrap();
        assert!(!first_updated.is_default);
    }
}
