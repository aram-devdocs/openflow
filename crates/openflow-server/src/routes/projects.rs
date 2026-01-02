//! Project Routes
//!
//! REST API endpoints for project CRUD operations.

use axum::{
    extract::{Path, State},
    routing::{get, post},
    Json, Router,
};
use openflow_contracts::{CreateProjectRequest, Project, UpdateProjectRequest};
use openflow_core::events::{EntityType, Event};
use openflow_core::services::project;

use crate::{error::ServerResult, state::AppState};

/// Create project routes
pub fn routes() -> Router<AppState> {
    Router::new()
        .route("/", get(list).post(create))
        .route("/archived", get(list_archived))
        .route("/:id", get(get_one).patch(update).delete(delete_one))
        .route("/:id/archive", post(archive))
        .route("/:id/unarchive", post(unarchive))
}

/// GET /api/projects
///
/// List all non-archived projects ordered by name.
async fn list(State(state): State<AppState>) -> ServerResult<Json<Vec<Project>>> {
    let projects = project::list(&state.pool).await?;
    Ok(Json(projects))
}

/// GET /api/projects/archived
///
/// List all archived projects ordered by archived_at.
async fn list_archived(State(state): State<AppState>) -> ServerResult<Json<Vec<Project>>> {
    let projects = project::list_archived(&state.pool).await?;
    Ok(Json(projects))
}

/// GET /api/projects/{id}
///
/// Get a project by ID.
async fn get_one(
    State(state): State<AppState>,
    Path(id): Path<String>,
) -> ServerResult<Json<Project>> {
    let project = project::get(&state.pool, &id).await?;
    Ok(Json(project))
}

/// POST /api/projects
///
/// Create a new project.
async fn create(
    State(state): State<AppState>,
    Json(request): Json<CreateProjectRequest>,
) -> ServerResult<Json<Project>> {
    let project = project::create(&state.pool, request).await?;

    // Broadcast data changed event
    state.broadcast(Event::created(
        EntityType::Project,
        project.id.clone(),
        &project,
    ));

    Ok(Json(project))
}

/// PATCH /api/projects/{id}
///
/// Update an existing project.
async fn update(
    State(state): State<AppState>,
    Path(id): Path<String>,
    Json(request): Json<UpdateProjectRequest>,
) -> ServerResult<Json<Project>> {
    let project = project::update(&state.pool, &id, request).await?;

    // Broadcast data changed event
    state.broadcast(Event::updated(
        EntityType::Project,
        project.id.clone(),
        &project,
    ));

    Ok(Json(project))
}

/// DELETE /api/projects/{id}
///
/// Delete a project by ID.
async fn delete_one(State(state): State<AppState>, Path(id): Path<String>) -> ServerResult<()> {
    project::delete(&state.pool, &id).await?;

    // Broadcast data changed event
    state.broadcast(Event::deleted(EntityType::Project, id));

    Ok(())
}

/// POST /api/projects/{id}/archive
///
/// Archive a project.
async fn archive(
    State(state): State<AppState>,
    Path(id): Path<String>,
) -> ServerResult<Json<Project>> {
    let project = project::archive(&state.pool, &id).await?;

    // Broadcast data changed event
    state.broadcast(Event::updated(
        EntityType::Project,
        project.id.clone(),
        &project,
    ));

    Ok(Json(project))
}

/// POST /api/projects/{id}/unarchive
///
/// Unarchive a project.
async fn unarchive(
    State(state): State<AppState>,
    Path(id): Path<String>,
) -> ServerResult<Json<Project>> {
    let project = project::unarchive(&state.pool, &id).await?;

    // Broadcast data changed event
    state.broadcast(Event::updated(
        EntityType::Project,
        project.id.clone(),
        &project,
    ));

    Ok(Json(project))
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
            let state = AppState::new(self.pool.clone(), process_service, broadcaster, client_manager);
            Router::new()
                .nest("/projects", routes())
                .with_state(state)
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

    /// Helper to create a test router with project routes
    async fn test_router() -> Router {
        let state = test_state().await;
        Router::new().nest("/projects", routes()).with_state(state)
    }

    #[test]
    fn test_routes_creation() {
        // Verify routes are created without panic
        let _routes: Router<AppState> = routes();
    }

    #[tokio::test]
    async fn test_list_projects_empty() {
        let app = test_router().await;

        let response = app
            .oneshot(
                Request::builder()
                    .method("GET")
                    .uri("/projects")
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::OK);

        let body = axum::body::to_bytes(response.into_body(), usize::MAX)
            .await
            .unwrap();
        let projects: Vec<Project> = serde_json::from_slice(&body).unwrap();

        assert!(projects.is_empty());
    }

    #[tokio::test]
    async fn test_create_project() {
        let state = test_state().await;
        let app = Router::new()
            .nest("/projects", routes())
            .with_state(state.clone());

        let request_body = serde_json::json!({
            "name": "Test Project",
            "gitRepoPath": "/path/to/repo"
        });

        let response = app
            .oneshot(
                Request::builder()
                    .method("POST")
                    .uri("/projects")
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
        let project: Project = serde_json::from_slice(&body).unwrap();

        assert_eq!(project.name, "Test Project");
        assert_eq!(project.git_repo_path, "/path/to/repo");
        assert!(!project.id.is_empty());
    }

    #[tokio::test]
    async fn test_get_project() {
        let ctx = TestContext::new().await;

        // Create a project first via HTTP
        let create_body = serde_json::json!({
            "name": "Get Test",
            "gitRepoPath": "/get/test/path"
        });

        let create_response = ctx
            .app()
            .oneshot(
                Request::builder()
                    .method("POST")
                    .uri("/projects")
                    .header("Content-Type", "application/json")
                    .body(Body::from(create_body.to_string()))
                    .unwrap(),
            )
            .await
            .unwrap();

        let body = axum::body::to_bytes(create_response.into_body(), usize::MAX)
            .await
            .unwrap();
        let created: Project = serde_json::from_slice(&body).unwrap();

        // Get the project using a new app instance (same pool)
        let response = ctx
            .app()
            .oneshot(
                Request::builder()
                    .method("GET")
                    .uri(format!("/projects/{}", created.id))
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::OK);

        let body = axum::body::to_bytes(response.into_body(), usize::MAX)
            .await
            .unwrap();
        let project: Project = serde_json::from_slice(&body).unwrap();

        assert_eq!(project.id, created.id);
        assert_eq!(project.name, "Get Test");
    }

    #[tokio::test]
    async fn test_get_project_not_found() {
        let app = test_router().await;

        let response = app
            .oneshot(
                Request::builder()
                    .method("GET")
                    .uri("/projects/non-existent-id")
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::NOT_FOUND);
    }

    #[tokio::test]
    async fn test_update_project() {
        let ctx = TestContext::new().await;

        // Create a project first via HTTP
        let create_body = serde_json::json!({
            "name": "Original Name",
            "gitRepoPath": "/original/path"
        });

        let create_response = ctx
            .app()
            .oneshot(
                Request::builder()
                    .method("POST")
                    .uri("/projects")
                    .header("Content-Type", "application/json")
                    .body(Body::from(create_body.to_string()))
                    .unwrap(),
            )
            .await
            .unwrap();

        let body = axum::body::to_bytes(create_response.into_body(), usize::MAX)
            .await
            .unwrap();
        let created: Project = serde_json::from_slice(&body).unwrap();

        // Update the project
        let update_body = serde_json::json!({
            "name": "Updated Name"
        });

        let response = ctx
            .app()
            .oneshot(
                Request::builder()
                    .method("PATCH")
                    .uri(format!("/projects/{}", created.id))
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
        let project: Project = serde_json::from_slice(&body).unwrap();

        assert_eq!(project.name, "Updated Name");
        assert_eq!(project.git_repo_path, "/original/path"); // Unchanged
    }

    #[tokio::test]
    async fn test_delete_project() {
        let state = test_state().await;

        // Create a project first
        let create_request = CreateProjectRequest {
            name: "To Delete".to_string(),
            git_repo_path: "/delete/path".to_string(),
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
        let created = project::create(&state.pool, create_request).await.unwrap();

        let app = Router::new()
            .nest("/projects", routes())
            .with_state(state.clone());

        let response = app
            .oneshot(
                Request::builder()
                    .method("DELETE")
                    .uri(format!("/projects/{}", created.id))
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::OK);

        // Verify it's deleted
        let result = project::get(&state.pool, &created.id).await;
        assert!(result.is_err());
    }

    #[tokio::test]
    async fn test_archive_project() {
        let state = test_state().await;

        // Create a project first
        let create_request = CreateProjectRequest {
            name: "To Archive".to_string(),
            git_repo_path: "/archive/path".to_string(),
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
        let created = project::create(&state.pool, create_request).await.unwrap();

        let app = Router::new()
            .nest("/projects", routes())
            .with_state(state.clone());

        let response = app
            .oneshot(
                Request::builder()
                    .method("POST")
                    .uri(format!("/projects/{}/archive", created.id))
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::OK);

        let body = axum::body::to_bytes(response.into_body(), usize::MAX)
            .await
            .unwrap();
        let project: Project = serde_json::from_slice(&body).unwrap();

        assert!(project.archived_at.is_some());
    }

    #[tokio::test]
    async fn test_unarchive_project() {
        let state = test_state().await;

        // Create and archive a project first
        let create_request = CreateProjectRequest {
            name: "To Unarchive".to_string(),
            git_repo_path: "/unarchive/path".to_string(),
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
        let created = project::create(&state.pool, create_request).await.unwrap();
        project::archive(&state.pool, &created.id).await.unwrap();

        let app = Router::new()
            .nest("/projects", routes())
            .with_state(state.clone());

        let response = app
            .oneshot(
                Request::builder()
                    .method("POST")
                    .uri(format!("/projects/{}/unarchive", created.id))
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::OK);

        let body = axum::body::to_bytes(response.into_body(), usize::MAX)
            .await
            .unwrap();
        let project: Project = serde_json::from_slice(&body).unwrap();

        assert!(project.archived_at.is_none());
    }

    #[tokio::test]
    async fn test_list_archived_projects() {
        let state = test_state().await;

        // Create and archive a project
        let create_request = CreateProjectRequest {
            name: "Archived Project".to_string(),
            git_repo_path: "/archived/path".to_string(),
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
        let created = project::create(&state.pool, create_request).await.unwrap();
        project::archive(&state.pool, &created.id).await.unwrap();

        let app = Router::new()
            .nest("/projects", routes())
            .with_state(state.clone());

        let response = app
            .oneshot(
                Request::builder()
                    .method("GET")
                    .uri("/projects/archived")
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::OK);

        let body = axum::body::to_bytes(response.into_body(), usize::MAX)
            .await
            .unwrap();
        let projects: Vec<Project> = serde_json::from_slice(&body).unwrap();

        assert_eq!(projects.len(), 1);
        assert_eq!(projects[0].name, "Archived Project");
        assert!(projects[0].archived_at.is_some());
    }

    #[tokio::test]
    async fn test_create_project_with_full_options() {
        let state = test_state().await;
        let app = Router::new()
            .nest("/projects", routes())
            .with_state(state.clone());

        let request_body = serde_json::json!({
            "name": "Full Options Project",
            "gitRepoPath": "/full/options/path",
            "baseBranch": "develop",
            "setupScript": "npm install",
            "devScript": "npm run dev",
            "cleanupScript": "npm run clean",
            "copyFiles": "[\"file1.txt\"]",
            "icon": "rocket",
            "ruleFolders": "[\".rules\"]",
            "alwaysIncludedRules": "[\"rule1.md\"]",
            "workflowsFolder": "custom-workflows",
            "verificationConfig": "{\"test\": \"npm test\"}"
        });

        let response = app
            .oneshot(
                Request::builder()
                    .method("POST")
                    .uri("/projects")
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
        let project: Project = serde_json::from_slice(&body).unwrap();

        assert_eq!(project.name, "Full Options Project");
        assert_eq!(project.git_repo_path, "/full/options/path");
        assert_eq!(project.base_branch, "develop");
        assert_eq!(project.setup_script, "npm install");
        assert_eq!(project.dev_script, "npm run dev");
        assert_eq!(project.cleanup_script, Some("npm run clean".to_string()));
        assert_eq!(project.icon, "rocket");
        assert_eq!(project.workflows_folder, "custom-workflows");
    }
}
