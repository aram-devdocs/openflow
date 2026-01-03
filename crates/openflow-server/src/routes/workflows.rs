//! Workflow Routes
//!
//! REST API endpoints for workflow template management.
//!
//! # Endpoints
//!
//! | Method | Path | Description |
//! |--------|------|-------------|
//! | GET | /api/workflows/templates | List workflow templates (from folder or built-in) |
//! | GET | /api/workflows/templates/builtin | Get all built-in workflow templates |
//! | GET | /api/workflows/templates/builtin/:id | Get a specific built-in template by ID |
//! | GET | /api/workflows/templates/:id | Get a template by ID (built-in or file-based) |
//! | POST | /api/workflows/parse | Parse workflow markdown content into steps |
//! | POST | /api/workflows/parse/steps | Parse workflow content (alias for /parse) |
//! | POST | /api/workflows/substitute | Substitute variables in content using HashMap |
//! | POST | /api/workflows/substitute/context | Substitute variables using WorkflowContext |

use axum::{
    extract::{Path, Query},
    routing::{get, post},
    Json, Router,
};
use openflow_contracts::{WorkflowContext, WorkflowStep, WorkflowTemplate};
use openflow_core::services::workflow;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::path::Path as StdPath;

use crate::{error::ServerResult, state::AppState};

/// Query parameters for listing templates
#[derive(Debug, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct ListTemplatesQuery {
    /// Folder path for file-based templates
    pub folder: Option<String>,
    /// Include built-in templates (default: true when no folder specified)
    pub include_builtin: Option<bool>,
}

/// Request body for parsing workflow content
#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ParseWorkflowRequest {
    /// Markdown content to parse
    pub content: String,
}

/// Request body for substituting variables
#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SubstituteVariablesRequest {
    /// Content with variables to substitute
    pub content: String,
    /// Variable name -> value mapping
    pub variables: HashMap<String, String>,
}

/// Request body for substituting with context
#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SubstituteWithContextRequest {
    /// Content with variables to substitute
    pub content: String,
    /// Workflow context containing variable values
    pub context: WorkflowContext,
}

/// Create workflow routes
pub fn routes() -> Router<AppState> {
    Router::new()
        .route("/templates", get(list_templates))
        .route("/templates/builtin", get(get_builtin_templates))
        .route("/templates/builtin/:id", get(get_builtin_template))
        .route("/templates/:id", get(get_template))
        .route("/parse", post(parse_content))
        .route("/parse/steps", post(parse_steps))
        .route("/substitute", post(substitute_variables))
        .route("/substitute/context", post(substitute_with_context))
}

/// GET /api/workflows/templates
///
/// List workflow templates. If a folder is specified, lists templates from that folder.
/// Otherwise, returns built-in templates.
async fn list_templates(
    Query(query): Query<ListTemplatesQuery>,
) -> ServerResult<Json<Vec<WorkflowTemplate>>> {
    let templates = if let Some(folder) = query.folder {
        workflow::list_templates(StdPath::new(&folder)).await?
    } else {
        workflow::get_builtin_templates()?
    };
    Ok(Json(templates))
}

/// GET /api/workflows/templates/builtin
///
/// Get all built-in workflow templates (Feature, Bug Fix, Refactor).
async fn get_builtin_templates() -> ServerResult<Json<Vec<WorkflowTemplate>>> {
    let templates = workflow::get_builtin_templates()?;
    Ok(Json(templates))
}

/// GET /api/workflows/templates/builtin/:id
///
/// Get a specific built-in workflow template by its ID.
async fn get_builtin_template(
    Path(id): Path<String>,
) -> ServerResult<Json<Option<WorkflowTemplate>>> {
    let template = workflow::get_builtin_template(&id)?;
    Ok(Json(template))
}

/// GET /api/workflows/templates/:id
///
/// Get a workflow template by ID. For file-based templates (file:*),
/// the folder query parameter must be provided.
async fn get_template(
    Query(query): Query<ListTemplatesQuery>,
    Path(id): Path<String>,
) -> ServerResult<Json<Option<WorkflowTemplate>>> {
    let folder_path = query.folder.as_ref().map(|f| StdPath::new(f.as_str()));
    let template = workflow::get_template(&id, folder_path).await?;
    Ok(Json(template))
}

/// POST /api/workflows/parse
///
/// Parse workflow markdown content into steps.
/// Steps are identified by `### [ ] Step: Name` pattern.
async fn parse_content(
    Json(request): Json<ParseWorkflowRequest>,
) -> ServerResult<Json<Vec<WorkflowStep>>> {
    let steps = workflow::parse(&request.content)?;
    Ok(Json(steps))
}

/// POST /api/workflows/parse/steps
///
/// Parse workflow content into steps (alias for /parse).
async fn parse_steps(
    Json(request): Json<ParseWorkflowRequest>,
) -> ServerResult<Json<Vec<WorkflowStep>>> {
    let steps = workflow::parse(&request.content)?;
    Ok(Json(steps))
}

/// POST /api/workflows/substitute
///
/// Substitute variables in workflow content using a HashMap.
/// Variables are in format: {@variable_name}
async fn substitute_variables(
    Json(request): Json<SubstituteVariablesRequest>,
) -> ServerResult<Json<String>> {
    let result = workflow::substitute_variables(&request.content, &request.variables)?;
    Ok(Json(result))
}

/// POST /api/workflows/substitute/context
///
/// Substitute variables using a WorkflowContext.
/// The context provides standard workflow variables like {@artifacts_path}, {@project_root}, etc.
async fn substitute_with_context(
    Json(request): Json<SubstituteWithContextRequest>,
) -> ServerResult<Json<String>> {
    let result = workflow::substitute_with_context(&request.content, &request.context)?;
    Ok(Json(result))
}

#[cfg(test)]
mod tests {
    use super::*;
    use axum::{
        body::Body,
        http::{Request, StatusCode},
    };
    use openflow_contracts::WorkflowStepStatus;
    use openflow_core::events::NullBroadcaster;
    use openflow_core::services::process::ProcessService;
    use std::sync::Arc;
    use tempfile::TempDir;
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
    fn test_parse_request_deserialization() {
        let json = "{\"content\": \"### [ ] Step: Test\"}";
        let request: ParseWorkflowRequest = serde_json::from_str(json).unwrap();
        assert!(request.content.contains("Step: Test"));
    }

    #[test]
    fn test_substitute_request_deserialization() {
        let json = r#"{"content": "{@name}", "variables": {"name": "value"}}"#;
        let request: SubstituteVariablesRequest = serde_json::from_str(json).unwrap();
        assert_eq!(request.content, "{@name}");
        assert_eq!(request.variables.get("name"), Some(&"value".to_string()));
    }

    #[test]
    fn test_substitute_with_context_request_deserialization() {
        let json = r#"{
            "content": "{@artifacts_path}",
            "context": {
                "artifactsPath": "/path/to/artifacts"
            }
        }"#;
        let request: SubstituteWithContextRequest = serde_json::from_str(json).unwrap();
        assert_eq!(request.content, "{@artifacts_path}");
        assert_eq!(
            request.context.artifacts_path,
            Some("/path/to/artifacts".to_string())
        );
    }

    #[test]
    fn test_list_templates_query_deserialization() {
        let query: ListTemplatesQuery = serde_json::from_str("{}").unwrap();
        assert!(query.folder.is_none());
        assert!(query.include_builtin.is_none());

        let query_with_folder: ListTemplatesQuery =
            serde_json::from_str(r#"{"folder": "/path/to/templates"}"#).unwrap();
        assert_eq!(
            query_with_folder.folder,
            Some("/path/to/templates".to_string())
        );
    }

    #[tokio::test]
    async fn test_get_builtin_templates() {
        let state = test_state().await;
        let app = Router::new().nest("/workflows", routes()).with_state(state);

        let response = app
            .oneshot(
                Request::builder()
                    .uri("/workflows/templates/builtin")
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::OK);

        let body = axum::body::to_bytes(response.into_body(), usize::MAX)
            .await
            .unwrap();
        let templates: Vec<WorkflowTemplate> = serde_json::from_slice(&body).unwrap();

        assert_eq!(templates.len(), 3);
        assert!(templates.iter().any(|t| t.id == "builtin:feature"));
        assert!(templates.iter().any(|t| t.id == "builtin:bugfix"));
        assert!(templates.iter().any(|t| t.id == "builtin:refactor"));
    }

    #[tokio::test]
    async fn test_get_builtin_template_feature() {
        let state = test_state().await;
        let app = Router::new().nest("/workflows", routes()).with_state(state);

        let response = app
            .oneshot(
                Request::builder()
                    .uri("/workflows/templates/builtin/builtin:feature")
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::OK);

        let body = axum::body::to_bytes(response.into_body(), usize::MAX)
            .await
            .unwrap();
        let template: Option<WorkflowTemplate> = serde_json::from_slice(&body).unwrap();

        assert!(template.is_some());
        let template = template.unwrap();
        assert_eq!(template.id, "builtin:feature");
        assert_eq!(template.name, "Feature");
        assert!(template.is_builtin);
        assert_eq!(template.steps.len(), 4);
    }

    #[tokio::test]
    async fn test_get_builtin_template_bugfix() {
        let state = test_state().await;
        let app = Router::new().nest("/workflows", routes()).with_state(state);

        let response = app
            .oneshot(
                Request::builder()
                    .uri("/workflows/templates/builtin/builtin:bugfix")
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::OK);

        let body = axum::body::to_bytes(response.into_body(), usize::MAX)
            .await
            .unwrap();
        let template: Option<WorkflowTemplate> = serde_json::from_slice(&body).unwrap();

        assert!(template.is_some());
        let template = template.unwrap();
        assert_eq!(template.id, "builtin:bugfix");
        assert_eq!(template.name, "Bug Fix");
        assert!(template.is_builtin);
    }

    #[tokio::test]
    async fn test_get_builtin_template_refactor() {
        let state = test_state().await;
        let app = Router::new().nest("/workflows", routes()).with_state(state);

        let response = app
            .oneshot(
                Request::builder()
                    .uri("/workflows/templates/builtin/builtin:refactor")
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::OK);

        let body = axum::body::to_bytes(response.into_body(), usize::MAX)
            .await
            .unwrap();
        let template: Option<WorkflowTemplate> = serde_json::from_slice(&body).unwrap();

        assert!(template.is_some());
        let template = template.unwrap();
        assert_eq!(template.id, "builtin:refactor");
        assert_eq!(template.name, "Refactor");
        assert!(template.is_builtin);
    }

    #[tokio::test]
    async fn test_get_builtin_template_not_found() {
        let state = test_state().await;
        let app = Router::new().nest("/workflows", routes()).with_state(state);

        let response = app
            .oneshot(
                Request::builder()
                    .uri("/workflows/templates/builtin/builtin:nonexistent")
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::OK);

        let body = axum::body::to_bytes(response.into_body(), usize::MAX)
            .await
            .unwrap();
        let template: Option<WorkflowTemplate> = serde_json::from_slice(&body).unwrap();

        assert!(template.is_none());
    }

    #[tokio::test]
    async fn test_list_templates_default() {
        let state = test_state().await;
        let app = Router::new().nest("/workflows", routes()).with_state(state);

        // Without folder param, should return built-in templates
        let response = app
            .oneshot(
                Request::builder()
                    .uri("/workflows/templates")
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::OK);

        let body = axum::body::to_bytes(response.into_body(), usize::MAX)
            .await
            .unwrap();
        let templates: Vec<WorkflowTemplate> = serde_json::from_slice(&body).unwrap();

        assert_eq!(templates.len(), 3);
    }

    #[tokio::test]
    async fn test_list_templates_from_folder() {
        let state = test_state().await;
        let app = Router::new().nest("/workflows", routes()).with_state(state);

        // Create a temp folder with a workflow file
        let temp_dir = TempDir::new().unwrap();
        let workflow_content = r#"
# Custom Workflow

A custom workflow for testing.

## Steps

### [ ] Step: First Step
Do the first thing.

### [ ] Step: Second Step
Do the second thing.
"#;
        std::fs::write(temp_dir.path().join("custom.md"), workflow_content).unwrap();

        let uri = format!(
            "/workflows/templates?folder={}",
            temp_dir.path().to_str().unwrap()
        );
        let response = app
            .oneshot(Request::builder().uri(&uri).body(Body::empty()).unwrap())
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::OK);

        let body = axum::body::to_bytes(response.into_body(), usize::MAX)
            .await
            .unwrap();
        let templates: Vec<WorkflowTemplate> = serde_json::from_slice(&body).unwrap();

        assert_eq!(templates.len(), 1);
        assert_eq!(templates[0].name, "Custom Workflow");
        assert!(!templates[0].is_builtin);
        assert_eq!(templates[0].steps.len(), 2);
    }

    #[tokio::test]
    async fn test_list_templates_empty_folder() {
        let state = test_state().await;
        let app = Router::new().nest("/workflows", routes()).with_state(state);

        let temp_dir = TempDir::new().unwrap();
        let uri = format!(
            "/workflows/templates?folder={}",
            temp_dir.path().to_str().unwrap()
        );

        let response = app
            .oneshot(Request::builder().uri(&uri).body(Body::empty()).unwrap())
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::OK);

        let body = axum::body::to_bytes(response.into_body(), usize::MAX)
            .await
            .unwrap();
        let templates: Vec<WorkflowTemplate> = serde_json::from_slice(&body).unwrap();

        assert!(templates.is_empty());
    }

    #[tokio::test]
    async fn test_get_template_builtin() {
        let state = test_state().await;
        let app = Router::new().nest("/workflows", routes()).with_state(state);

        let response = app
            .oneshot(
                Request::builder()
                    .uri("/workflows/templates/builtin:feature")
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::OK);

        let body = axum::body::to_bytes(response.into_body(), usize::MAX)
            .await
            .unwrap();
        let template: Option<WorkflowTemplate> = serde_json::from_slice(&body).unwrap();

        assert!(template.is_some());
        assert_eq!(template.unwrap().id, "builtin:feature");
    }

    #[tokio::test]
    async fn test_get_template_file_based() {
        let state = test_state().await;
        let app = Router::new().nest("/workflows", routes()).with_state(state);

        // Create a temp folder with a workflow file
        let temp_dir = TempDir::new().unwrap();
        let workflow_content = r#"
# Test Workflow

## Steps

### [ ] Step: Test
Test step.
"#;
        std::fs::write(temp_dir.path().join("test.md"), workflow_content).unwrap();

        let uri = format!(
            "/workflows/templates/file:test?folder={}",
            temp_dir.path().to_str().unwrap()
        );
        let response = app
            .oneshot(Request::builder().uri(&uri).body(Body::empty()).unwrap())
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::OK);

        let body = axum::body::to_bytes(response.into_body(), usize::MAX)
            .await
            .unwrap();
        let template: Option<WorkflowTemplate> = serde_json::from_slice(&body).unwrap();

        assert!(template.is_some());
        let template = template.unwrap();
        assert_eq!(template.id, "file:test");
        assert_eq!(template.name, "Test Workflow");
    }

    #[tokio::test]
    async fn test_get_template_file_based_not_found() {
        let state = test_state().await;
        let app = Router::new().nest("/workflows", routes()).with_state(state);

        let temp_dir = TempDir::new().unwrap();
        let uri = format!(
            "/workflows/templates/file:nonexistent?folder={}",
            temp_dir.path().to_str().unwrap()
        );

        let response = app
            .oneshot(Request::builder().uri(&uri).body(Body::empty()).unwrap())
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::OK);

        let body = axum::body::to_bytes(response.into_body(), usize::MAX)
            .await
            .unwrap();
        let template: Option<WorkflowTemplate> = serde_json::from_slice(&body).unwrap();

        assert!(template.is_none());
    }

    #[tokio::test]
    async fn test_parse_content() {
        let state = test_state().await;
        let app = Router::new().nest("/workflows", routes()).with_state(state);

        let content = r#"
# Workflow

### [ ] Step: First
First step description.

### [-] Step: Second
Second step description.

### [x] Step: Third
Third step description.
"#;

        let response = app
            .oneshot(
                Request::builder()
                    .method("POST")
                    .uri("/workflows/parse")
                    .header("content-type", "application/json")
                    .body(Body::from(
                        serde_json::to_string(&ParseWorkflowRequest {
                            content: content.to_string(),
                        })
                        .unwrap(),
                    ))
                    .unwrap(),
            )
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::OK);

        let body = axum::body::to_bytes(response.into_body(), usize::MAX)
            .await
            .unwrap();
        let steps: Vec<WorkflowStep> = serde_json::from_slice(&body).unwrap();

        assert_eq!(steps.len(), 3);
        assert_eq!(steps[0].name, "First");
        assert_eq!(steps[0].status, WorkflowStepStatus::Pending);
        assert_eq!(steps[1].name, "Second");
        assert_eq!(steps[1].status, WorkflowStepStatus::InProgress);
        assert_eq!(steps[2].name, "Third");
        assert_eq!(steps[2].status, WorkflowStepStatus::Completed);
    }

    #[tokio::test]
    async fn test_parse_content_empty() {
        let state = test_state().await;
        let app = Router::new().nest("/workflows", routes()).with_state(state);

        let response = app
            .oneshot(
                Request::builder()
                    .method("POST")
                    .uri("/workflows/parse")
                    .header("content-type", "application/json")
                    .body(Body::from(r#"{"content": ""}"#))
                    .unwrap(),
            )
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::OK);

        let body = axum::body::to_bytes(response.into_body(), usize::MAX)
            .await
            .unwrap();
        let steps: Vec<WorkflowStep> = serde_json::from_slice(&body).unwrap();

        assert!(steps.is_empty());
    }

    #[tokio::test]
    async fn test_parse_steps() {
        let state = test_state().await;
        let app = Router::new().nest("/workflows", routes()).with_state(state);

        let response = app
            .oneshot(
                Request::builder()
                    .method("POST")
                    .uri("/workflows/parse/steps")
                    .header("content-type", "application/json")
                    .body(Body::from(
                        serde_json::to_string(&ParseWorkflowRequest {
                            content: "### [ ] Step: Single\nDescription.".to_string(),
                        })
                        .unwrap(),
                    ))
                    .unwrap(),
            )
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::OK);

        let body = axum::body::to_bytes(response.into_body(), usize::MAX)
            .await
            .unwrap();
        let steps: Vec<WorkflowStep> = serde_json::from_slice(&body).unwrap();

        assert_eq!(steps.len(), 1);
        assert_eq!(steps[0].name, "Single");
    }

    #[tokio::test]
    async fn test_substitute_variables() {
        let state = test_state().await;
        let app = Router::new().nest("/workflows", routes()).with_state(state);

        let mut variables = HashMap::new();
        variables.insert("name".to_string(), "Alice".to_string());
        variables.insert("project".to_string(), "OpenFlow".to_string());

        let request = SubstituteVariablesRequest {
            content: "Hello {@name}, welcome to {@project}!".to_string(),
            variables,
        };

        let response = app
            .oneshot(
                Request::builder()
                    .method("POST")
                    .uri("/workflows/substitute")
                    .header("content-type", "application/json")
                    .body(Body::from(serde_json::to_string(&request).unwrap()))
                    .unwrap(),
            )
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::OK);

        let body = axum::body::to_bytes(response.into_body(), usize::MAX)
            .await
            .unwrap();
        let result: String = serde_json::from_slice(&body).unwrap();

        assert_eq!(result, "Hello Alice, welcome to OpenFlow!");
    }

    #[tokio::test]
    async fn test_substitute_variables_missing() {
        let state = test_state().await;
        let app = Router::new().nest("/workflows", routes()).with_state(state);

        let request = SubstituteVariablesRequest {
            content: "Hello {@name}!".to_string(),
            variables: HashMap::new(),
        };

        let response = app
            .oneshot(
                Request::builder()
                    .method("POST")
                    .uri("/workflows/substitute")
                    .header("content-type", "application/json")
                    .body(Body::from(serde_json::to_string(&request).unwrap()))
                    .unwrap(),
            )
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::OK);

        let body = axum::body::to_bytes(response.into_body(), usize::MAX)
            .await
            .unwrap();
        let result: String = serde_json::from_slice(&body).unwrap();

        // Missing variables stay as-is
        assert_eq!(result, "Hello {@name}!");
    }

    #[tokio::test]
    async fn test_substitute_with_context() {
        let state = test_state().await;
        let app = Router::new().nest("/workflows", routes()).with_state(state);

        let request = SubstituteWithContextRequest {
            content: "Save to {@artifacts_path}/spec.md in {@project_root}".to_string(),
            context: WorkflowContext {
                artifacts_path: Some("/tasks/123".to_string()),
                project_root: Some("/home/project".to_string()),
                ..Default::default()
            },
        };

        let response = app
            .oneshot(
                Request::builder()
                    .method("POST")
                    .uri("/workflows/substitute/context")
                    .header("content-type", "application/json")
                    .body(Body::from(serde_json::to_string(&request).unwrap()))
                    .unwrap(),
            )
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::OK);

        let body = axum::body::to_bytes(response.into_body(), usize::MAX)
            .await
            .unwrap();
        let result: String = serde_json::from_slice(&body).unwrap();

        assert_eq!(result, "Save to /tasks/123/spec.md in /home/project");
    }

    #[tokio::test]
    async fn test_substitute_with_context_all_variables() {
        let state = test_state().await;
        let app = Router::new().nest("/workflows", routes()).with_state(state);

        let request = SubstituteWithContextRequest {
            content: "{@artifacts_path} {@project_root} {@worktree_path} {@task_id} {@task_title} {@project_name}".to_string(),
            context: WorkflowContext {
                artifacts_path: Some("A".to_string()),
                project_root: Some("B".to_string()),
                worktree_path: Some("C".to_string()),
                task_id: Some("D".to_string()),
                task_title: Some("E".to_string()),
                project_name: Some("F".to_string()),
            },
        };

        let response = app
            .oneshot(
                Request::builder()
                    .method("POST")
                    .uri("/workflows/substitute/context")
                    .header("content-type", "application/json")
                    .body(Body::from(serde_json::to_string(&request).unwrap()))
                    .unwrap(),
            )
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::OK);

        let body = axum::body::to_bytes(response.into_body(), usize::MAX)
            .await
            .unwrap();
        let result: String = serde_json::from_slice(&body).unwrap();

        assert_eq!(result, "A B C D E F");
    }

    #[tokio::test]
    async fn test_substitute_with_context_partial() {
        let state = test_state().await;
        let app = Router::new().nest("/workflows", routes()).with_state(state);

        let request = SubstituteWithContextRequest {
            content: "{@artifacts_path} and {@task_id}".to_string(),
            context: WorkflowContext {
                artifacts_path: Some("/path".to_string()),
                ..Default::default()
            },
        };

        let response = app
            .oneshot(
                Request::builder()
                    .method("POST")
                    .uri("/workflows/substitute/context")
                    .header("content-type", "application/json")
                    .body(Body::from(serde_json::to_string(&request).unwrap()))
                    .unwrap(),
            )
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::OK);

        let body = axum::body::to_bytes(response.into_body(), usize::MAX)
            .await
            .unwrap();
        let result: String = serde_json::from_slice(&body).unwrap();

        // Unset variables remain as-is
        assert_eq!(result, "/path and {@task_id}");
    }

    #[tokio::test]
    async fn test_builtin_template_step_details() {
        let state = test_state().await;
        let app = Router::new().nest("/workflows", routes()).with_state(state);

        let response = app
            .oneshot(
                Request::builder()
                    .uri("/workflows/templates/builtin/builtin:feature")
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::OK);

        let body = axum::body::to_bytes(response.into_body(), usize::MAX)
            .await
            .unwrap();
        let template: Option<WorkflowTemplate> = serde_json::from_slice(&body).unwrap();

        let template = template.unwrap();
        assert_eq!(template.steps.len(), 4);
        assert_eq!(template.steps[0].name, "Requirements");
        assert_eq!(template.steps[1].name, "Technical Specification");
        assert_eq!(template.steps[2].name, "Planning");
        assert_eq!(template.steps[3].name, "Implementation");

        // All steps should be pending in a template
        for step in &template.steps {
            assert_eq!(step.status, WorkflowStepStatus::Pending);
            assert!(step.chat_id.is_none());
        }
    }

    #[tokio::test]
    async fn test_template_has_artifacts_path_variable() {
        let state = test_state().await;
        let app = Router::new().nest("/workflows", routes()).with_state(state);

        let response = app
            .oneshot(
                Request::builder()
                    .uri("/workflows/templates/builtin/builtin:feature")
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::OK);

        let body = axum::body::to_bytes(response.into_body(), usize::MAX)
            .await
            .unwrap();
        let template: Option<WorkflowTemplate> = serde_json::from_slice(&body).unwrap();

        let template = template.unwrap();
        // Built-in templates should use {@artifacts_path}
        assert!(template.content.contains("{@artifacts_path}"));
    }

    #[tokio::test]
    async fn test_list_templates_nonexistent_folder() {
        let state = test_state().await;
        let app = Router::new().nest("/workflows", routes()).with_state(state);

        let response = app
            .oneshot(
                Request::builder()
                    .uri("/workflows/templates?folder=/nonexistent/path/that/does/not/exist")
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::OK);

        let body = axum::body::to_bytes(response.into_body(), usize::MAX)
            .await
            .unwrap();
        let templates: Vec<WorkflowTemplate> = serde_json::from_slice(&body).unwrap();

        // Should return empty list for nonexistent folder
        assert!(templates.is_empty());
    }
}
