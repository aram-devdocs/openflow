//! API Routes
//!
//! HTTP REST API route definitions using Axum.
//!
//! # Route Structure
//!
//! All routes are nested under `/api`:
//!
//! - `/api/health` - Health check endpoint
//! - `/api/projects` - Project CRUD operations
//! - `/api/tasks` - Task CRUD operations
//! - `/api/chats` - Chat CRUD operations
//! - `/api/messages` - Message CRUD operations
//! - `/api/processes` - Process management
//! - `/api/executor` - Executor profiles and running
//! - `/api/git` - Git operations (worktrees, diff, commits)
//! - `/api/github` - GitHub operations (PRs, CLI status)
//! - `/api/settings` - Settings management
//! - `/api/workflows` - Workflow templates
//! - `/api/search` - Full-text search
//! - `/api/terminal` - Terminal spawning
//!
//! Additionally, a WebSocket endpoint is available at `/ws` for real-time events.

pub mod chats;
pub mod executor;
pub mod git;
pub mod github;
pub mod health;
pub mod messages;
pub mod processes;
pub mod projects;
pub mod search;
pub mod settings;
pub mod tasks;
pub mod terminal;
pub mod workflows;

use axum::routing::get;
use axum::Router;
use tower_http::cors::{Any, CorsLayer};
use tower_http::trace::TraceLayer;

use crate::state::AppState;
use crate::ws::ws_handler;

/// Create all routes with middleware
///
/// Configures:
/// - CORS middleware for cross-origin requests
/// - Tracing middleware for request logging
/// - All API routes nested under `/api`
/// - WebSocket endpoint at `/ws`
pub fn create_routes(state: AppState) -> Router {
    let cors = CorsLayer::new()
        .allow_origin(Any) // Configure properly in production
        .allow_methods(Any)
        .allow_headers(Any);

    Router::new()
        .nest("/api", api_routes())
        // WebSocket endpoint for real-time events
        .route("/ws", get(ws_handler))
        .with_state(state)
        .layer(cors)
        .layer(TraceLayer::new_for_http())
}

/// Create API routes
///
/// All domain-specific routes are nested under their respective paths.
fn api_routes() -> Router<AppState> {
    Router::new()
        // Health check
        .route("/health", axum::routing::get(health::health_check))
        // Domain routes
        .nest("/projects", projects::routes())
        .nest("/tasks", tasks::routes())
        .nest("/chats", chats::routes())
        .nest("/messages", messages::routes())
        .nest("/processes", processes::routes())
        .nest("/executor", executor::routes())
        .nest("/git", git::routes())
        .nest("/github", github::routes())
        .nest("/settings", settings::routes())
        .nest("/workflows", workflows::routes())
        .nest("/search", search::routes())
        .nest("/terminal", terminal::routes())
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::ws::ClientManager;
    use openflow_core::events::NullBroadcaster;
    use openflow_core::services::process::ProcessService;
    use std::sync::Arc;

    #[tokio::test]
    async fn test_create_routes() {
        let pool = openflow_db::create_test_db().await.unwrap();
        let process_service = Arc::new(ProcessService::new());
        let broadcaster: Arc<dyn openflow_core::events::EventBroadcaster> =
            Arc::new(NullBroadcaster);
        let client_manager = ClientManager::new();
        let state = AppState::new(pool, process_service, broadcaster, client_manager);

        // Should not panic
        let _router = create_routes(state);
    }

    #[tokio::test]
    async fn test_api_routes() {
        // Should not panic
        let _router: Router<AppState> = api_routes();
    }

    #[tokio::test]
    async fn test_create_routes_includes_websocket() {
        let pool = openflow_db::create_test_db().await.unwrap();
        let process_service = Arc::new(ProcessService::new());
        let broadcaster: Arc<dyn openflow_core::events::EventBroadcaster> =
            Arc::new(NullBroadcaster);
        let client_manager = ClientManager::new();
        let state = AppState::new(pool, process_service, broadcaster, client_manager);

        // Create the router - includes /ws route
        let router = create_routes(state);

        // We can verify the router was created without panic
        // (actual WebSocket testing requires more setup)
        drop(router);
    }
}
