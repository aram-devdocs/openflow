//! Agent Routes
//!
//! REST API endpoints for agent session management, event queries,
//! permission handling, and session control.
//!
//! # Route Structure
//!
//! - `/api/agents/sessions/:id` - Get session by ID
//! - `/api/agents/sessions/:id/with-state` - Get session with counts and pending permission
//! - `/api/agents/sessions/:id/summary` - Get lightweight session summary
//! - `/api/agents/sessions/:id/events` - Get events for session
//! - `/api/agents/sessions/:id/events/latest` - Get latest event sequence
//! - `/api/agents/sessions/:id/events/count` - Count events for session
//! - `/api/agents/sessions/:id/permission` - Get pending permission
//! - `/api/agents/sessions/:id/permission/respond` - Respond to permission
//! - `/api/agents/sessions/:id/kill` - Kill agent session
//! - `/api/agents/sessions/:id/input` - Write to agent stdin
//! - `/api/agents/sessions/:id/resize` - Resize terminal
//! - `/api/agents/sessions/:id/raw-output` - Get raw terminal output
//! - `/api/agents/sessions/by-process/:process_id` - List sessions for a process
//! - `/api/agents/sessions/running` - List running sessions
//! - `/api/agents/sessions/active` - List active sessions in orchestrator
//! - `/api/agents/sessions/active/count` - Count active sessions
//! - `/api/agents/sessions/recover` - Recover stale sessions

use axum::{
    extract::{Path, Query, State},
    routing::{get, post},
    Json, Router,
};
use openflow_contracts::{
    AgentEventRecord, AgentSession, AgentSessionSummary, AgentSessionWithState, Permission,
};
use openflow_core::events::{EntityType, Event};
use openflow_core::services::agent_session;
use serde::Deserialize;

use crate::{error::ServerResult, state::AppState};

/// Create agent routes
pub fn routes() -> Router<AppState> {
    Router::new()
        // Session queries
        .route("/sessions/:id", get(get_session))
        .route("/sessions/:id/with-state", get(get_session_with_state))
        .route("/sessions/:id/summary", get(get_session_summary))
        // Event queries
        .route("/sessions/:id/events", get(get_session_events))
        .route("/sessions/:id/events/latest", get(get_latest_sequence))
        .route("/sessions/:id/events/count", get(count_session_events))
        // Permission endpoints
        .route("/sessions/:id/permission", get(get_pending_permission))
        .route(
            "/sessions/:id/permission/respond",
            post(respond_to_permission),
        )
        // Session control
        .route("/sessions/:id/kill", post(kill_session))
        .route("/sessions/:id/input", post(write_input))
        .route("/sessions/:id/resize", post(resize_terminal))
        .route("/sessions/:id/raw-output", get(get_raw_output))
        // List endpoints (no session ID)
        .route("/sessions/by-process/:process_id", get(list_by_process))
        .route("/sessions/running", get(list_running))
        .route("/sessions/active", get(list_active))
        .route("/sessions/active/count", get(active_count))
        .route("/sessions/recover", post(recover_stale_sessions))
}

// =============================================================================
// Session Query Routes
// =============================================================================

/// GET /api/agents/sessions/{id}
///
/// Get an agent session by ID.
async fn get_session(
    State(state): State<AppState>,
    Path(id): Path<String>,
) -> ServerResult<Json<AgentSession>> {
    let session = agent_session::get(&state.pool, &id).await?;
    Ok(Json(session))
}

/// GET /api/agents/sessions/{id}/with-state
///
/// Get an agent session with event/tool counts and pending permission.
async fn get_session_with_state(
    State(state): State<AppState>,
    Path(id): Path<String>,
) -> ServerResult<Json<AgentSessionWithState>> {
    let session_with_state = agent_session::get_with_state(&state.pool, &id).await?;
    Ok(Json(session_with_state))
}

/// GET /api/agents/sessions/{id}/summary
///
/// Get a lightweight session summary for UI display.
async fn get_session_summary(
    State(state): State<AppState>,
    Path(id): Path<String>,
) -> ServerResult<Json<AgentSessionSummary>> {
    let summary = agent_session::get_summary(&state.pool, &id).await?;
    Ok(Json(summary))
}

/// GET /api/agents/sessions/by-process/{process_id}
///
/// List all sessions for a given process.
async fn list_by_process(
    State(state): State<AppState>,
    Path(process_id): Path<String>,
) -> ServerResult<Json<Vec<AgentSession>>> {
    let sessions = agent_session::list_by_process(&state.pool, &process_id).await?;
    Ok(Json(sessions))
}

/// GET /api/agents/sessions/running
///
/// List all running sessions (status = 'running' in DB).
async fn list_running(State(state): State<AppState>) -> ServerResult<Json<Vec<AgentSession>>> {
    let sessions = agent_session::list_running(&state.pool).await?;
    Ok(Json(sessions))
}

// =============================================================================
// Event Query Routes
// =============================================================================

/// Query parameters for getting session events
#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct GetEventsQuery {
    /// Only return events with sequence > this value
    pub after_sequence: Option<i32>,
}

/// GET /api/agents/sessions/{id}/events
///
/// Get events for a session with optional sequence filter.
async fn get_session_events(
    State(state): State<AppState>,
    Path(id): Path<String>,
    Query(query): Query<GetEventsQuery>,
) -> ServerResult<Json<Vec<AgentEventRecord>>> {
    let events = agent_session::get_events(&state.pool, &id, query.after_sequence).await?;
    Ok(Json(events))
}

/// GET /api/agents/sessions/{id}/events/latest
///
/// Get the latest event sequence number for a session.
async fn get_latest_sequence(
    State(state): State<AppState>,
    Path(id): Path<String>,
) -> ServerResult<Json<Option<i32>>> {
    let sequence = agent_session::get_latest_sequence(&state.pool, &id).await?;
    Ok(Json(sequence))
}

/// GET /api/agents/sessions/{id}/events/count
///
/// Count events for a session.
async fn count_session_events(
    State(state): State<AppState>,
    Path(id): Path<String>,
) -> ServerResult<Json<i64>> {
    let count = agent_session::count_events(&state.pool, &id).await?;
    Ok(Json(count))
}

// =============================================================================
// Permission Routes
// =============================================================================

/// GET /api/agents/sessions/{id}/permission
///
/// Get the pending permission for a session (if any).
async fn get_pending_permission(
    State(state): State<AppState>,
    Path(id): Path<String>,
) -> ServerResult<Json<Option<Permission>>> {
    let permission = agent_session::get_pending_permission(&state.pool, &id).await?;
    Ok(Json(permission))
}

/// Request body for responding to a permission
#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RespondPermissionRequest {
    /// Permission ID to respond to
    pub permission_id: String,
    /// Whether to approve (true) or deny (false)
    pub approved: bool,
}

/// POST /api/agents/sessions/{id}/permission/respond
///
/// Respond to a permission request for a session.
/// Uses the AgentOrchestrator to update DB and send response to agent stdin.
async fn respond_to_permission(
    State(state): State<AppState>,
    Path(id): Path<String>,
    Json(request): Json<RespondPermissionRequest>,
) -> ServerResult<Json<Permission>> {
    let permission = state
        .agent_orchestrator
        .handle_permission(&id, &request.permission_id, request.approved)
        .await?;

    // Broadcast data changed event
    state.broadcast(Event::updated(
        EntityType::Permission,
        permission.id.clone(),
        &permission,
    ));

    Ok(Json(permission))
}

// =============================================================================
// Session Control Routes
// =============================================================================

/// POST /api/agents/sessions/{id}/kill
///
/// Kill an agent session.
async fn kill_session(
    State(state): State<AppState>,
    Path(id): Path<String>,
) -> ServerResult<Json<AgentSession>> {
    let session = state.agent_orchestrator.kill_agent(&id).await?;

    // Broadcast data changed event
    state.broadcast(Event::updated(
        EntityType::Session,
        session.id.clone(),
        &session,
    ));

    Ok(Json(session))
}

/// Request body for writing input to agent
#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct WriteInputRequest {
    /// Data to write to agent stdin
    pub data: String,
}

/// POST /api/agents/sessions/{id}/input
///
/// Write data to the agent's stdin.
async fn write_input(
    State(state): State<AppState>,
    Path(id): Path<String>,
    Json(request): Json<WriteInputRequest>,
) -> ServerResult<()> {
    state
        .agent_orchestrator
        .write_input(&id, request.data.as_bytes())
        .await?;
    Ok(())
}

/// Request body for resizing terminal
#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ResizeRequest {
    /// Number of columns
    pub cols: u16,
    /// Number of rows
    pub rows: u16,
}

/// POST /api/agents/sessions/{id}/resize
///
/// Resize the terminal for an agent session.
async fn resize_terminal(
    State(state): State<AppState>,
    Path(id): Path<String>,
    Json(request): Json<ResizeRequest>,
) -> ServerResult<()> {
    state
        .agent_orchestrator
        .resize(&id, request.cols, request.rows)
        .await?;
    Ok(())
}

/// GET /api/agents/sessions/{id}/raw-output
///
/// Get the buffered raw terminal output for a session.
async fn get_raw_output(
    State(state): State<AppState>,
    Path(id): Path<String>,
) -> ServerResult<String> {
    let output = state.agent_orchestrator.get_raw_output(&id).await?;
    Ok(output)
}

// =============================================================================
// Active Session Routes (Orchestrator)
// =============================================================================

/// GET /api/agents/sessions/active
///
/// List all active session IDs in the orchestrator (in-memory tracking).
async fn list_active(State(state): State<AppState>) -> ServerResult<Json<Vec<String>>> {
    let active = state.agent_orchestrator.list_active().await;
    Ok(Json(active))
}

/// GET /api/agents/sessions/active/count
///
/// Get the count of active sessions in the orchestrator.
async fn active_count(State(state): State<AppState>) -> ServerResult<Json<usize>> {
    let count = state.agent_orchestrator.active_count().await;
    Ok(Json(count))
}

/// POST /api/agents/sessions/recover
///
/// Recover stale sessions (running in DB but not in orchestrator memory).
/// Used for crash recovery on startup.
async fn recover_stale_sessions(State(state): State<AppState>) -> ServerResult<Json<usize>> {
    let recovered = state.agent_orchestrator.recover_stale_sessions().await?;
    Ok(Json(recovered))
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
    use uuid::Uuid;

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
            Router::new().nest("/agents", routes()).with_state(state)
        }

        /// Create a test execution process (required for session FK).
        /// Chain: project -> task -> chat -> execution_process
        async fn create_test_process(&self) -> String {
            let process_id = Uuid::new_v4().to_string();
            let project_id = Uuid::new_v4().to_string();
            let task_id = Uuid::new_v4().to_string();
            let chat_id = Uuid::new_v4().to_string();

            // Create project
            sqlx::query(
                "INSERT INTO projects (id, name, git_repo_path) VALUES (?, 'Test Project', '/tmp/test')",
            )
            .bind(&project_id)
            .execute(&self.pool)
            .await
            .expect("Failed to create test project");

            // Create task
            sqlx::query(
                "INSERT INTO tasks (id, project_id, title) VALUES (?, ?, 'Test Task')",
            )
            .bind(&task_id)
            .bind(&project_id)
            .execute(&self.pool)
            .await
            .expect("Failed to create test task");

            // Create chat (requires project_id per migration 003)
            sqlx::query(
                "INSERT INTO chats (id, task_id, project_id) VALUES (?, ?, ?)",
            )
            .bind(&chat_id)
            .bind(&task_id)
            .bind(&project_id)
            .execute(&self.pool)
            .await
            .expect("Failed to create test chat");

            // Create execution process
            sqlx::query(
                r#"
                INSERT INTO execution_processes (id, chat_id, status)
                VALUES (?, ?, 'running')
                "#,
            )
            .bind(&process_id)
            .bind(&chat_id)
            .execute(&self.pool)
            .await
            .expect("Failed to create test process");

            process_id
        }

        /// Create a test agent session.
        async fn create_test_session(&self, process_id: &str) -> AgentSession {
            let request = agent_session::CreateSessionRequest::new(process_id, "claude-code");
            agent_session::create(&self.pool, request)
                .await
                .expect("Failed to create test session")
        }
    }

    #[test]
    fn test_routes_creation() {
        let _routes: Router<AppState> = routes();
    }

    #[tokio::test]
    async fn test_get_session() {
        let ctx = TestContext::new().await;
        let process_id = ctx.create_test_process().await;
        let session = ctx.create_test_session(&process_id).await;

        let response = ctx
            .app()
            .oneshot(
                Request::builder()
                    .method("GET")
                    .uri(format!("/agents/sessions/{}", session.id))
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::OK);

        let body = axum::body::to_bytes(response.into_body(), usize::MAX)
            .await
            .unwrap();
        let fetched: AgentSession = serde_json::from_slice(&body).unwrap();

        assert_eq!(fetched.id, session.id);
        assert_eq!(fetched.provider_id, "claude-code");
    }

    #[tokio::test]
    async fn test_get_session_not_found() {
        let ctx = TestContext::new().await;

        let response = ctx
            .app()
            .oneshot(
                Request::builder()
                    .method("GET")
                    .uri("/agents/sessions/non-existent-id")
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::NOT_FOUND);
    }

    #[tokio::test]
    async fn test_get_session_with_state() {
        let ctx = TestContext::new().await;
        let process_id = ctx.create_test_process().await;
        let session = ctx.create_test_session(&process_id).await;

        let response = ctx
            .app()
            .oneshot(
                Request::builder()
                    .method("GET")
                    .uri(format!("/agents/sessions/{}/with-state", session.id))
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::OK);

        let body = axum::body::to_bytes(response.into_body(), usize::MAX)
            .await
            .unwrap();
        let with_state: AgentSessionWithState = serde_json::from_slice(&body).unwrap();

        assert_eq!(with_state.session.id, session.id);
        assert_eq!(with_state.event_count, 0);
        assert!(with_state.pending_permission.is_none());
    }

    #[tokio::test]
    async fn test_get_session_summary() {
        let ctx = TestContext::new().await;
        let process_id = ctx.create_test_process().await;
        let session = ctx.create_test_session(&process_id).await;

        let response = ctx
            .app()
            .oneshot(
                Request::builder()
                    .method("GET")
                    .uri(format!("/agents/sessions/{}/summary", session.id))
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::OK);

        let body = axum::body::to_bytes(response.into_body(), usize::MAX)
            .await
            .unwrap();
        let summary: AgentSessionSummary = serde_json::from_slice(&body).unwrap();

        assert_eq!(summary.id, session.id);
        assert_eq!(summary.event_count, 0);
        assert!(!summary.has_pending_permission);
    }

    #[tokio::test]
    async fn test_list_by_process() {
        let ctx = TestContext::new().await;
        let process_id = ctx.create_test_process().await;

        // Create two sessions for the same process
        ctx.create_test_session(&process_id).await;
        ctx.create_test_session(&process_id).await;

        let response = ctx
            .app()
            .oneshot(
                Request::builder()
                    .method("GET")
                    .uri(format!("/agents/sessions/by-process/{}", process_id))
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::OK);

        let body = axum::body::to_bytes(response.into_body(), usize::MAX)
            .await
            .unwrap();
        let sessions: Vec<AgentSession> = serde_json::from_slice(&body).unwrap();

        assert_eq!(sessions.len(), 2);
    }

    #[tokio::test]
    async fn test_list_running() {
        let ctx = TestContext::new().await;
        let process_id = ctx.create_test_process().await;
        let session = ctx.create_test_session(&process_id).await;

        let response = ctx
            .app()
            .oneshot(
                Request::builder()
                    .method("GET")
                    .uri("/agents/sessions/running")
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::OK);

        let body = axum::body::to_bytes(response.into_body(), usize::MAX)
            .await
            .unwrap();
        let sessions: Vec<AgentSession> = serde_json::from_slice(&body).unwrap();

        // Our newly created session should be running
        assert!(sessions.iter().any(|s| s.id == session.id));
    }

    #[tokio::test]
    async fn test_get_session_events_empty() {
        let ctx = TestContext::new().await;
        let process_id = ctx.create_test_process().await;
        let session = ctx.create_test_session(&process_id).await;

        let response = ctx
            .app()
            .oneshot(
                Request::builder()
                    .method("GET")
                    .uri(format!("/agents/sessions/{}/events", session.id))
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::OK);

        let body = axum::body::to_bytes(response.into_body(), usize::MAX)
            .await
            .unwrap();
        let events: Vec<AgentEventRecord> = serde_json::from_slice(&body).unwrap();

        assert!(events.is_empty());
    }

    #[tokio::test]
    async fn test_get_session_events_with_data() {
        let ctx = TestContext::new().await;
        let process_id = ctx.create_test_process().await;
        let session = ctx.create_test_session(&process_id).await;

        // Add some events directly to DB
        agent_session::add_event(&ctx.pool, &session.id, "init", &serde_json::json!({}))
            .await
            .unwrap();
        agent_session::add_event(
            &ctx.pool,
            &session.id,
            "message",
            &serde_json::json!({"text": "Hello"}),
        )
        .await
        .unwrap();

        let response = ctx
            .app()
            .oneshot(
                Request::builder()
                    .method("GET")
                    .uri(format!("/agents/sessions/{}/events", session.id))
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::OK);

        let body = axum::body::to_bytes(response.into_body(), usize::MAX)
            .await
            .unwrap();
        let events: Vec<AgentEventRecord> = serde_json::from_slice(&body).unwrap();

        assert_eq!(events.len(), 2);
        assert_eq!(events[0].event_type, "init");
        assert_eq!(events[1].event_type, "message");
    }

    #[tokio::test]
    async fn test_get_session_events_after_sequence() {
        let ctx = TestContext::new().await;
        let process_id = ctx.create_test_process().await;
        let session = ctx.create_test_session(&process_id).await;

        // Add some events
        for i in 0..5 {
            agent_session::add_event(
                &ctx.pool,
                &session.id,
                "message",
                &serde_json::json!({"index": i}),
            )
            .await
            .unwrap();
        }

        // Get events after sequence 2
        let response = ctx
            .app()
            .oneshot(
                Request::builder()
                    .method("GET")
                    .uri(format!(
                        "/agents/sessions/{}/events?afterSequence=2",
                        session.id
                    ))
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::OK);

        let body = axum::body::to_bytes(response.into_body(), usize::MAX)
            .await
            .unwrap();
        let events: Vec<AgentEventRecord> = serde_json::from_slice(&body).unwrap();

        assert_eq!(events.len(), 2); // sequences 3 and 4
        assert_eq!(events[0].sequence, 3);
        assert_eq!(events[1].sequence, 4);
    }

    #[tokio::test]
    async fn test_get_latest_sequence() {
        let ctx = TestContext::new().await;
        let process_id = ctx.create_test_process().await;
        let session = ctx.create_test_session(&process_id).await;

        // No events yet
        let response = ctx
            .app()
            .oneshot(
                Request::builder()
                    .method("GET")
                    .uri(format!("/agents/sessions/{}/events/latest", session.id))
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::OK);
        let body = axum::body::to_bytes(response.into_body(), usize::MAX)
            .await
            .unwrap();
        let sequence: Option<i32> = serde_json::from_slice(&body).unwrap();
        assert!(sequence.is_none());

        // Add events
        agent_session::add_event(&ctx.pool, &session.id, "init", &serde_json::json!({}))
            .await
            .unwrap();
        agent_session::add_event(&ctx.pool, &session.id, "message", &serde_json::json!({}))
            .await
            .unwrap();

        // Check again
        let response = ctx
            .app()
            .oneshot(
                Request::builder()
                    .method("GET")
                    .uri(format!("/agents/sessions/{}/events/latest", session.id))
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();

        let body = axum::body::to_bytes(response.into_body(), usize::MAX)
            .await
            .unwrap();
        let sequence: Option<i32> = serde_json::from_slice(&body).unwrap();
        assert_eq!(sequence, Some(1));
    }

    #[tokio::test]
    async fn test_count_session_events() {
        let ctx = TestContext::new().await;
        let process_id = ctx.create_test_process().await;
        let session = ctx.create_test_session(&process_id).await;

        // Add 3 events
        for _ in 0..3 {
            agent_session::add_event(&ctx.pool, &session.id, "message", &serde_json::json!({}))
                .await
                .unwrap();
        }

        let response = ctx
            .app()
            .oneshot(
                Request::builder()
                    .method("GET")
                    .uri(format!("/agents/sessions/{}/events/count", session.id))
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::OK);

        let body = axum::body::to_bytes(response.into_body(), usize::MAX)
            .await
            .unwrap();
        let count: i64 = serde_json::from_slice(&body).unwrap();

        assert_eq!(count, 3);
    }

    #[tokio::test]
    async fn test_get_pending_permission_none() {
        let ctx = TestContext::new().await;
        let process_id = ctx.create_test_process().await;
        let session = ctx.create_test_session(&process_id).await;

        let response = ctx
            .app()
            .oneshot(
                Request::builder()
                    .method("GET")
                    .uri(format!("/agents/sessions/{}/permission", session.id))
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

    #[tokio::test]
    async fn test_get_pending_permission_exists() {
        let ctx = TestContext::new().await;
        let process_id = ctx.create_test_process().await;
        let session = ctx.create_test_session(&process_id).await;

        // Create a pending permission
        agent_session::create_permission(&ctx.pool, &session.id, "Write", "Create file", None)
            .await
            .unwrap();

        let response = ctx
            .app()
            .oneshot(
                Request::builder()
                    .method("GET")
                    .uri(format!("/agents/sessions/{}/permission", session.id))
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

        assert!(permission.is_some());
        assert_eq!(permission.unwrap().tool_name, "Write");
    }

    #[tokio::test]
    async fn test_list_active_sessions() {
        let ctx = TestContext::new().await;

        let response = ctx
            .app()
            .oneshot(
                Request::builder()
                    .method("GET")
                    .uri("/agents/sessions/active")
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::OK);

        let body = axum::body::to_bytes(response.into_body(), usize::MAX)
            .await
            .unwrap();
        let active: Vec<String> = serde_json::from_slice(&body).unwrap();

        // No sessions spawned via orchestrator, so should be empty
        assert!(active.is_empty());
    }

    #[tokio::test]
    async fn test_active_count() {
        let ctx = TestContext::new().await;

        let response = ctx
            .app()
            .oneshot(
                Request::builder()
                    .method("GET")
                    .uri("/agents/sessions/active/count")
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
    }

    #[tokio::test]
    async fn test_recover_stale_sessions() {
        let ctx = TestContext::new().await;

        let response = ctx
            .app()
            .oneshot(
                Request::builder()
                    .method("POST")
                    .uri("/agents/sessions/recover")
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::OK);

        let body = axum::body::to_bytes(response.into_body(), usize::MAX)
            .await
            .unwrap();
        let recovered: usize = serde_json::from_slice(&body).unwrap();

        // No stale sessions in fresh test DB
        assert_eq!(recovered, 0);
    }
}
