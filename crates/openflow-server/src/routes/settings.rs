//! Settings Routes
//!
//! REST API endpoints for settings management.
//!
//! # Endpoints
//!
//! | Method | Path | Description |
//! |--------|------|-------------|
//! | GET | /api/settings | Get all settings (optionally filtered by prefix) |
//! | PUT | /api/settings/batch | Set multiple settings atomically |
//! | DELETE | /api/settings/all | Delete all settings (requires confirmation) |
//! | GET | /api/settings/:key | Get a setting value by key |
//! | PUT | /api/settings/:key | Set a setting value |
//! | DELETE | /api/settings/:key | Delete a setting |
//! | GET | /api/settings/:key/full | Get full setting (key, value, updated_at) |
//! | GET | /api/settings/:key/exists | Check if a setting exists |
//! | GET | /api/settings/:key/or-default | Get setting with default fallback |

use axum::{
    extract::{Path, Query, State},
    routing::{delete, get, put},
    Json, Router,
};
use openflow_contracts::{DeleteAllSettingsResponse, Setting, SettingsMap};
use openflow_core::events::{DataAction, EntityType, Event};
use openflow_core::services::settings;
use serde::Deserialize;
use std::collections::HashMap;

use crate::{error::ServerResult, state::AppState};

/// Query parameters for getting settings
#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct GetSettingsQuery {
    /// Filter by key prefix
    pub prefix: Option<String>,
}

/// Request body for setting a value
#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SetSettingRequest {
    pub value: String,
}

/// Request body for getting with default
#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct GetOrDefaultQuery {
    pub default: String,
}

/// Request body for delete all confirmation
#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DeleteAllRequest {
    /// Must be true to confirm deletion
    pub confirm: bool,
}

/// Create settings routes
pub fn routes() -> Router<AppState> {
    Router::new()
        .route("/", get(get_all))
        .route("/batch", put(set_many))
        .route("/all", delete(delete_all))
        .route("/:key", get(get_one).put(set_one).delete(delete_one))
        .route("/:key/full", get(get_full))
        .route("/:key/exists", get(exists))
        .route("/:key/or-default", get(get_or_default))
}

/// GET /api/settings
///
/// Get all settings, optionally filtered by prefix.
async fn get_all(
    State(state): State<AppState>,
    Query(query): Query<GetSettingsQuery>,
) -> ServerResult<Json<SettingsMap>> {
    let settings_map = if let Some(prefix) = query.prefix {
        settings::get_by_prefix(&state.pool, &prefix).await?
    } else {
        settings::get_all(&state.pool).await?
    };
    Ok(Json(settings_map))
}

/// GET /api/settings/{key}
///
/// Get a setting value by key.
async fn get_one(
    State(state): State<AppState>,
    Path(key): Path<String>,
) -> ServerResult<Json<Option<String>>> {
    let value = settings::get_value(&state.pool, &key).await?;
    Ok(Json(value))
}

/// GET /api/settings/{key}/full
///
/// Get a full setting (key, value, updated_at) by key.
async fn get_full(
    State(state): State<AppState>,
    Path(key): Path<String>,
) -> ServerResult<Json<Option<Setting>>> {
    let setting = settings::get(&state.pool, &key).await?;
    Ok(Json(setting))
}

/// PUT /api/settings/{key}
///
/// Set a setting value.
async fn set_one(
    State(state): State<AppState>,
    Path(key): Path<String>,
    Json(request): Json<SetSettingRequest>,
) -> ServerResult<Json<Setting>> {
    let setting = settings::set(&state.pool, &key, &request.value).await?;

    // Broadcast data changed event
    state.broadcast(Event::updated(
        EntityType::Setting,
        key,
        &setting,
    ));

    Ok(Json(setting))
}

/// DELETE /api/settings/{key}
///
/// Delete a setting.
async fn delete_one(
    State(state): State<AppState>,
    Path(key): Path<String>,
) -> ServerResult<()> {
    settings::delete(&state.pool, &key).await?;

    // Broadcast data changed event
    state.broadcast(Event::deleted(EntityType::Setting, key));

    Ok(())
}

/// GET /api/settings/{key}/exists
///
/// Check if a setting exists.
async fn exists(
    State(state): State<AppState>,
    Path(key): Path<String>,
) -> ServerResult<Json<bool>> {
    let exists = settings::exists(&state.pool, &key).await?;
    Ok(Json(exists))
}

/// GET /api/settings/{key}/or-default?default=xxx
///
/// Get a setting value with default fallback.
async fn get_or_default(
    State(state): State<AppState>,
    Path(key): Path<String>,
    Query(query): Query<GetOrDefaultQuery>,
) -> ServerResult<Json<String>> {
    let value = settings::get_or_default(&state.pool, &key, &query.default).await?;
    Ok(Json(value))
}

/// PUT /api/settings/batch
///
/// Set multiple settings atomically.
async fn set_many(
    State(state): State<AppState>,
    Json(settings_map): Json<HashMap<String, String>>,
) -> ServerResult<()> {
    // Convert HashMap to Vec of tuples for the service function
    let settings_vec: Vec<(String, String)> = settings_map
        .iter()
        .map(|(k, v)| (k.clone(), v.clone()))
        .collect();
    settings::set_many(&state.pool, &settings_vec).await?;

    // Broadcast data changed event for each setting (without data since we don't have individual settings)
    for key in settings_map.keys() {
        state.broadcast(Event::data_changed(
            EntityType::Setting,
            DataAction::Updated,
            key.clone(),
            None,
        ));
    }

    Ok(())
}

/// DELETE /api/settings/all
///
/// Delete all settings. Requires confirmation.
async fn delete_all(
    State(state): State<AppState>,
    Json(request): Json<DeleteAllRequest>,
) -> ServerResult<Json<DeleteAllSettingsResponse>> {
    if !request.confirm {
        return Err(crate::error::ServerError::bad_request(
            "Must confirm deletion by setting confirm: true",
        ));
    }

    let deleted_count = settings::delete_all(&state.pool).await?;

    // Broadcast data changed event
    state.broadcast(Event::data_changed(
        EntityType::Setting,
        DataAction::Deleted,
        "*".to_string(), // Indicate all settings were deleted
        None,
    ));

    Ok(Json(DeleteAllSettingsResponse::new(deleted_count)))
}

#[cfg(test)]
mod tests {
    use super::*;
    use axum::{
        body::Body,
        http::{Request, StatusCode},
    };
    use openflow_core::events::NullBroadcaster;
    use openflow_core::services::process::ProcessService;
    use std::sync::Arc;
    use tower::ServiceExt;

    /// Create a test app state
    async fn test_state() -> AppState {
        let pool = openflow_db::create_test_db().await.unwrap();
        let process_service = Arc::new(ProcessService::new());
        let broadcaster: Arc<dyn openflow_core::events::EventBroadcaster> =
            Arc::new(NullBroadcaster);
        let client_manager = crate::ws::ClientManager::new();
        AppState::new(pool, process_service, broadcaster, client_manager)
    }

    #[test]
    fn test_routes_creation() {
        let _routes: Router<AppState> = routes();
    }

    #[test]
    fn test_request_deserialization() {
        let json = r#"{"value": "test-value"}"#;
        let request: SetSettingRequest = serde_json::from_str(json).unwrap();
        assert_eq!(request.value, "test-value");
    }

    #[test]
    fn test_query_deserialization() {
        let query = GetSettingsQuery { prefix: None };
        assert!(query.prefix.is_none());

        let query_with_prefix = GetSettingsQuery {
            prefix: Some("app.".to_string()),
        };
        assert_eq!(query_with_prefix.prefix, Some("app.".to_string()));
    }

    #[test]
    fn test_delete_all_request_deserialization() {
        let json = r#"{"confirm": true}"#;
        let request: DeleteAllRequest = serde_json::from_str(json).unwrap();
        assert!(request.confirm);

        let json_false = r#"{"confirm": false}"#;
        let request_false: DeleteAllRequest = serde_json::from_str(json_false).unwrap();
        assert!(!request_false.confirm);
    }

    #[tokio::test]
    async fn test_get_all_empty() {
        let state = test_state().await;
        let app = Router::new()
            .nest("/settings", routes())
            .with_state(state);

        let response = app
            .oneshot(
                Request::builder()
                    .uri("/settings")
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::OK);

        let body = axum::body::to_bytes(response.into_body(), usize::MAX)
            .await
            .unwrap();
        let settings: SettingsMap = serde_json::from_slice(&body).unwrap();
        assert!(settings.is_empty());
    }

    #[tokio::test]
    async fn test_set_and_get_setting() {
        let state = test_state().await;
        let app = Router::new()
            .nest("/settings", routes())
            .with_state(state);

        // Set a setting
        let set_response = app
            .clone()
            .oneshot(
                Request::builder()
                    .method("PUT")
                    .uri("/settings/theme")
                    .header("content-type", "application/json")
                    .body(Body::from(r#"{"value": "dark"}"#))
                    .unwrap(),
            )
            .await
            .unwrap();

        assert_eq!(set_response.status(), StatusCode::OK);

        // Get the setting
        let get_response = app
            .clone()
            .oneshot(
                Request::builder()
                    .uri("/settings/theme")
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();

        assert_eq!(get_response.status(), StatusCode::OK);

        let body = axum::body::to_bytes(get_response.into_body(), usize::MAX)
            .await
            .unwrap();
        let value: Option<String> = serde_json::from_slice(&body).unwrap();
        assert_eq!(value, Some("dark".to_string()));
    }

    #[tokio::test]
    async fn test_get_full_setting() {
        let state = test_state().await;
        let app = Router::new()
            .nest("/settings", routes())
            .with_state(state);

        // Set a setting first
        app.clone()
            .oneshot(
                Request::builder()
                    .method("PUT")
                    .uri("/settings/language")
                    .header("content-type", "application/json")
                    .body(Body::from(r#"{"value": "en"}"#))
                    .unwrap(),
            )
            .await
            .unwrap();

        // Get full setting
        let response = app
            .clone()
            .oneshot(
                Request::builder()
                    .uri("/settings/language/full")
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::OK);

        let body = axum::body::to_bytes(response.into_body(), usize::MAX)
            .await
            .unwrap();
        let setting: Option<Setting> = serde_json::from_slice(&body).unwrap();
        assert!(setting.is_some());
        let setting = setting.unwrap();
        assert_eq!(setting.key, "language");
        assert_eq!(setting.value, "en");
    }

    #[tokio::test]
    async fn test_setting_exists() {
        let state = test_state().await;
        let app = Router::new()
            .nest("/settings", routes())
            .with_state(state);

        // Check non-existent key
        let response = app
            .clone()
            .oneshot(
                Request::builder()
                    .uri("/settings/nonexistent/exists")
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::OK);
        let body = axum::body::to_bytes(response.into_body(), usize::MAX)
            .await
            .unwrap();
        let exists: bool = serde_json::from_slice(&body).unwrap();
        assert!(!exists);

        // Set a setting
        app.clone()
            .oneshot(
                Request::builder()
                    .method("PUT")
                    .uri("/settings/test_key")
                    .header("content-type", "application/json")
                    .body(Body::from(r#"{"value": "test"}"#))
                    .unwrap(),
            )
            .await
            .unwrap();

        // Check existing key
        let response = app
            .clone()
            .oneshot(
                Request::builder()
                    .uri("/settings/test_key/exists")
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::OK);
        let body = axum::body::to_bytes(response.into_body(), usize::MAX)
            .await
            .unwrap();
        let exists: bool = serde_json::from_slice(&body).unwrap();
        assert!(exists);
    }

    #[tokio::test]
    async fn test_get_or_default() {
        let state = test_state().await;
        let app = Router::new()
            .nest("/settings", routes())
            .with_state(state);

        // Get non-existent with default
        let response = app
            .clone()
            .oneshot(
                Request::builder()
                    .uri("/settings/missing/or-default?default=fallback")
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::OK);
        let body = axum::body::to_bytes(response.into_body(), usize::MAX)
            .await
            .unwrap();
        let value: String = serde_json::from_slice(&body).unwrap();
        assert_eq!(value, "fallback");

        // Set a value
        app.clone()
            .oneshot(
                Request::builder()
                    .method("PUT")
                    .uri("/settings/existing")
                    .header("content-type", "application/json")
                    .body(Body::from(r#"{"value": "actual"}"#))
                    .unwrap(),
            )
            .await
            .unwrap();

        // Get existing with default (should return actual)
        let response = app
            .clone()
            .oneshot(
                Request::builder()
                    .uri("/settings/existing/or-default?default=ignored")
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::OK);
        let body = axum::body::to_bytes(response.into_body(), usize::MAX)
            .await
            .unwrap();
        let value: String = serde_json::from_slice(&body).unwrap();
        assert_eq!(value, "actual");
    }

    #[tokio::test]
    async fn test_delete_setting() {
        let state = test_state().await;
        let app = Router::new()
            .nest("/settings", routes())
            .with_state(state);

        // Set a setting
        app.clone()
            .oneshot(
                Request::builder()
                    .method("PUT")
                    .uri("/settings/to_delete")
                    .header("content-type", "application/json")
                    .body(Body::from(r#"{"value": "temp"}"#))
                    .unwrap(),
            )
            .await
            .unwrap();

        // Verify it exists
        let response = app
            .clone()
            .oneshot(
                Request::builder()
                    .uri("/settings/to_delete/exists")
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();
        let body = axum::body::to_bytes(response.into_body(), usize::MAX)
            .await
            .unwrap();
        let exists: bool = serde_json::from_slice(&body).unwrap();
        assert!(exists);

        // Delete it
        let response = app
            .clone()
            .oneshot(
                Request::builder()
                    .method("DELETE")
                    .uri("/settings/to_delete")
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::OK);

        // Verify it's gone
        let response = app
            .clone()
            .oneshot(
                Request::builder()
                    .uri("/settings/to_delete/exists")
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();
        let body = axum::body::to_bytes(response.into_body(), usize::MAX)
            .await
            .unwrap();
        let exists: bool = serde_json::from_slice(&body).unwrap();
        assert!(!exists);
    }

    #[tokio::test]
    async fn test_delete_nonexistent_setting() {
        let state = test_state().await;
        let app = Router::new()
            .nest("/settings", routes())
            .with_state(state);

        let response = app
            .oneshot(
                Request::builder()
                    .method("DELETE")
                    .uri("/settings/nonexistent")
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();

        // Should return 404
        assert_eq!(response.status(), StatusCode::NOT_FOUND);
    }

    #[tokio::test]
    async fn test_set_many() {
        let state = test_state().await;
        let app = Router::new()
            .nest("/settings", routes())
            .with_state(state);

        // Set multiple settings
        let response = app
            .clone()
            .oneshot(
                Request::builder()
                    .method("PUT")
                    .uri("/settings/batch")
                    .header("content-type", "application/json")
                    .body(Body::from(
                        r#"{"batch.key1": "value1", "batch.key2": "value2", "batch.key3": "value3"}"#,
                    ))
                    .unwrap(),
            )
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::OK);

        // Get all and verify
        let response = app
            .clone()
            .oneshot(
                Request::builder()
                    .uri("/settings")
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();

        let body = axum::body::to_bytes(response.into_body(), usize::MAX)
            .await
            .unwrap();
        let settings: SettingsMap = serde_json::from_slice(&body).unwrap();
        assert_eq!(settings.len(), 3);
        assert_eq!(settings.get("batch.key1"), Some(&"value1".to_string()));
        assert_eq!(settings.get("batch.key2"), Some(&"value2".to_string()));
        assert_eq!(settings.get("batch.key3"), Some(&"value3".to_string()));
    }

    #[tokio::test]
    async fn test_get_by_prefix() {
        let state = test_state().await;
        let app = Router::new()
            .nest("/settings", routes())
            .with_state(state);

        // Set settings with different prefixes
        app.clone()
            .oneshot(
                Request::builder()
                    .method("PUT")
                    .uri("/settings/batch")
                    .header("content-type", "application/json")
                    .body(Body::from(
                        r#"{"app.theme": "dark", "app.language": "en", "user.name": "john"}"#,
                    ))
                    .unwrap(),
            )
            .await
            .unwrap();

        // Get with prefix filter
        let response = app
            .clone()
            .oneshot(
                Request::builder()
                    .uri("/settings?prefix=app.")
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::OK);

        let body = axum::body::to_bytes(response.into_body(), usize::MAX)
            .await
            .unwrap();
        let settings: SettingsMap = serde_json::from_slice(&body).unwrap();
        assert_eq!(settings.len(), 2);
        assert!(settings.contains("app.theme"));
        assert!(settings.contains("app.language"));
        assert!(!settings.contains("user.name"));
    }

    #[tokio::test]
    async fn test_delete_all_without_confirmation() {
        let state = test_state().await;
        let app = Router::new()
            .nest("/settings", routes())
            .with_state(state);

        // Try to delete all without confirmation
        let response = app
            .oneshot(
                Request::builder()
                    .method("DELETE")
                    .uri("/settings/all")
                    .header("content-type", "application/json")
                    .body(Body::from(r#"{"confirm": false}"#))
                    .unwrap(),
            )
            .await
            .unwrap();

        // Should return 400 Bad Request
        assert_eq!(response.status(), StatusCode::BAD_REQUEST);
    }

    #[tokio::test]
    async fn test_delete_all_with_confirmation() {
        let state = test_state().await;
        let app = Router::new()
            .nest("/settings", routes())
            .with_state(state);

        // Set some settings
        app.clone()
            .oneshot(
                Request::builder()
                    .method("PUT")
                    .uri("/settings/batch")
                    .header("content-type", "application/json")
                    .body(Body::from(
                        r#"{"key1": "value1", "key2": "value2", "key3": "value3"}"#,
                    ))
                    .unwrap(),
            )
            .await
            .unwrap();

        // Delete all with confirmation
        let response = app
            .clone()
            .oneshot(
                Request::builder()
                    .method("DELETE")
                    .uri("/settings/all")
                    .header("content-type", "application/json")
                    .body(Body::from(r#"{"confirm": true}"#))
                    .unwrap(),
            )
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::OK);

        let body = axum::body::to_bytes(response.into_body(), usize::MAX)
            .await
            .unwrap();
        let result: DeleteAllSettingsResponse = serde_json::from_slice(&body).unwrap();
        assert_eq!(result.deleted_count, 3);

        // Verify all are gone
        let response = app
            .clone()
            .oneshot(
                Request::builder()
                    .uri("/settings")
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();

        let body = axum::body::to_bytes(response.into_body(), usize::MAX)
            .await
            .unwrap();
        let settings: SettingsMap = serde_json::from_slice(&body).unwrap();
        assert!(settings.is_empty());
    }

    #[tokio::test]
    async fn test_update_existing_setting() {
        let state = test_state().await;
        let app = Router::new()
            .nest("/settings", routes())
            .with_state(state);

        // Set initial value
        app.clone()
            .oneshot(
                Request::builder()
                    .method("PUT")
                    .uri("/settings/mutable")
                    .header("content-type", "application/json")
                    .body(Body::from(r#"{"value": "initial"}"#))
                    .unwrap(),
            )
            .await
            .unwrap();

        // Update the value
        app.clone()
            .oneshot(
                Request::builder()
                    .method("PUT")
                    .uri("/settings/mutable")
                    .header("content-type", "application/json")
                    .body(Body::from(r#"{"value": "updated"}"#))
                    .unwrap(),
            )
            .await
            .unwrap();

        // Verify the update
        let response = app
            .clone()
            .oneshot(
                Request::builder()
                    .uri("/settings/mutable")
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();

        let body = axum::body::to_bytes(response.into_body(), usize::MAX)
            .await
            .unwrap();
        let value: Option<String> = serde_json::from_slice(&body).unwrap();
        assert_eq!(value, Some("updated".to_string()));
    }

    #[tokio::test]
    async fn test_special_characters_in_value() {
        let state = test_state().await;
        let app = Router::new()
            .nest("/settings", routes())
            .with_state(state);

        // Set a JSON value
        let json_value = r#"{"key": "value", "array": [1, 2, 3]}"#;
        app.clone()
            .oneshot(
                Request::builder()
                    .method("PUT")
                    .uri("/settings/json_config")
                    .header("content-type", "application/json")
                    .body(Body::from(format!(r#"{{"value": {}}}"#, serde_json::to_string(json_value).unwrap())))
                    .unwrap(),
            )
            .await
            .unwrap();

        // Get and verify
        let response = app
            .clone()
            .oneshot(
                Request::builder()
                    .uri("/settings/json_config")
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();

        let body = axum::body::to_bytes(response.into_body(), usize::MAX)
            .await
            .unwrap();
        let value: Option<String> = serde_json::from_slice(&body).unwrap();
        assert_eq!(value, Some(json_value.to_string()));
    }

    #[tokio::test]
    async fn test_empty_value() {
        let state = test_state().await;
        let app = Router::new()
            .nest("/settings", routes())
            .with_state(state);

        // Set an empty value
        app.clone()
            .oneshot(
                Request::builder()
                    .method("PUT")
                    .uri("/settings/empty_key")
                    .header("content-type", "application/json")
                    .body(Body::from(r#"{"value": ""}"#))
                    .unwrap(),
            )
            .await
            .unwrap();

        // Get and verify
        let response = app
            .clone()
            .oneshot(
                Request::builder()
                    .uri("/settings/empty_key")
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();

        let body = axum::body::to_bytes(response.into_body(), usize::MAX)
            .await
            .unwrap();
        let value: Option<String> = serde_json::from_slice(&body).unwrap();
        assert_eq!(value, Some("".to_string()));
    }
}
