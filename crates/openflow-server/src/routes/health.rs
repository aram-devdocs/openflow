//! Health Check Endpoint
//!
//! Provides a health check endpoint for monitoring.

use axum::{extract::State, Json};
use serde::Serialize;

use crate::state::AppState;

/// Health check response
#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct HealthResponse {
    /// Overall status
    pub status: &'static str,
    /// Server version
    pub version: &'static str,
    /// Database connection status
    pub database: &'static str,
}

/// GET /api/health
///
/// Returns the health status of the server and its dependencies.
pub async fn health_check(State(state): State<AppState>) -> Json<HealthResponse> {
    // Check database connectivity
    let db_status = match sqlx::query("SELECT 1").fetch_one(&state.pool).await {
        Ok(_) => "connected",
        Err(_) => "disconnected",
    };

    Json(HealthResponse {
        status: "ok",
        version: env!("CARGO_PKG_VERSION"),
        database: db_status,
    })
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
    use serde::Deserialize;
    use std::sync::Arc;
    use tower::util::ServiceExt;

    #[derive(Deserialize)]
    #[serde(rename_all = "camelCase")]
    struct HealthResponseDeserialized {
        status: String,
        version: String,
        database: String,
    }

    #[test]
    fn test_health_response_serialization() {
        let response = HealthResponse {
            status: "ok",
            version: "0.1.0",
            database: "connected",
        };

        let json = serde_json::to_string(&response).unwrap();
        assert!(json.contains("\"status\":\"ok\""));
        assert!(json.contains("\"version\":\"0.1.0\""));
        assert!(json.contains("\"database\":\"connected\""));
    }

    #[tokio::test]
    async fn test_health_check_endpoint() {
        let pool = openflow_db::create_test_db().await.unwrap();
        let process_service = Arc::new(ProcessService::new());
        let broadcaster: Arc<dyn openflow_core::events::EventBroadcaster> =
            Arc::new(NullBroadcaster);
        let client_manager = crate::ws::ClientManager::new();
        let state = AppState::new(pool, process_service, broadcaster, client_manager);

        let app = Router::new()
            .route("/health", axum::routing::get(health_check))
            .with_state(state);

        let response = app
            .oneshot(
                Request::builder()
                    .uri("/health")
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::OK);

        let body = axum::body::to_bytes(response.into_body(), usize::MAX)
            .await
            .unwrap();
        let health: HealthResponseDeserialized = serde_json::from_slice(&body).unwrap();

        assert_eq!(health.status, "ok");
        assert_eq!(health.database, "connected");
        assert!(!health.version.is_empty());
    }

    #[tokio::test]
    async fn test_health_check_with_database() {
        let pool = openflow_db::create_test_db().await.unwrap();
        let process_service = Arc::new(ProcessService::new());
        let broadcaster: Arc<dyn openflow_core::events::EventBroadcaster> =
            Arc::new(NullBroadcaster);
        let client_manager = crate::ws::ClientManager::new();
        let state = AppState::new(pool, process_service, broadcaster, client_manager);

        let response = health_check(State(state)).await;
        let health = response.0;

        assert_eq!(health.status, "ok");
        assert_eq!(health.database, "connected");
    }
}
