//! Search Routes
//!
//! REST API endpoints for full-text search.

use axum::{
    extract::{Query, State},
    routing::get,
    Json, Router,
};
use openflow_contracts::{SearchRequest, SearchResult, SearchResultType};
use openflow_core::services::search;

use crate::{error::ServerResult, state::AppState};

/// Query parameters for search
#[derive(Debug, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SearchQuery {
    /// Search query string
    pub q: String,
    /// Filter by project ID
    pub project_id: Option<String>,
    /// Filter by result types (comma-separated)
    pub types: Option<String>,
    /// Maximum number of results
    pub limit: Option<i32>,
}

impl From<SearchQuery> for SearchRequest {
    fn from(query: SearchQuery) -> Self {
        let result_types = query.types.map(|types_str| {
            types_str
                .split(',')
                .filter_map(|t| match t.trim().to_lowercase().as_str() {
                    "task" => Some(SearchResultType::Task),
                    "project" => Some(SearchResultType::Project),
                    "chat" => Some(SearchResultType::Chat),
                    "message" => Some(SearchResultType::Message),
                    _ => None,
                })
                .collect()
        });

        SearchRequest {
            query: query.q,
            project_id: query.project_id,
            result_types,
            limit: query.limit,
        }
    }
}

/// Create search routes
pub fn routes() -> Router<AppState> {
    Router::new()
        .route("/", get(search_all))
        .route("/tasks", get(search_tasks))
        .route("/projects", get(search_projects))
}

/// GET /api/search?q=xxx&projectId=xxx&types=task,project&limit=10
///
/// Search across all entities.
async fn search_all(
    State(state): State<AppState>,
    Query(query): Query<SearchQuery>,
) -> ServerResult<Json<Vec<SearchResult>>> {
    let request: SearchRequest = query.into();
    let results = search::search(&state.pool, request).await?;
    Ok(Json(results))
}

/// GET /api/search/tasks?q=xxx&projectId=xxx&limit=10
///
/// Search for tasks only.
async fn search_tasks(
    State(state): State<AppState>,
    Query(query): Query<SearchQuery>,
) -> ServerResult<Json<Vec<SearchResult>>> {
    let results = if let Some(project_id) = query.project_id {
        search::search_in_project(&state.pool, &query.q, &project_id).await?
    } else {
        search::search_tasks(&state.pool, &query.q).await?
    };
    Ok(Json(results))
}

/// GET /api/search/projects?q=xxx&limit=10
///
/// Search for projects only.
async fn search_projects(
    State(state): State<AppState>,
    Query(query): Query<SearchQuery>,
) -> ServerResult<Json<Vec<SearchResult>>> {
    let results = search::search_projects(&state.pool, &query.q).await?;
    Ok(Json(results))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_routes_creation() {
        let _routes: Router<AppState> = routes();
    }

    #[test]
    fn test_search_query_conversion() {
        let query = SearchQuery {
            q: "test".to_string(),
            project_id: Some("project-1".to_string()),
            types: Some("task,project".to_string()),
            limit: Some(10),
        };

        let request: SearchRequest = query.into();
        assert_eq!(request.query, "test");
        assert_eq!(request.project_id, Some("project-1".to_string()));
        assert_eq!(request.limit, Some(10));
        assert!(request.result_types.is_some());
        let types = request.result_types.unwrap();
        assert_eq!(types.len(), 2);
    }

    #[test]
    fn test_search_query_no_types() {
        let query = SearchQuery {
            q: "test".to_string(),
            project_id: None,
            types: None,
            limit: None,
        };

        let request: SearchRequest = query.into();
        assert_eq!(request.query, "test");
        assert!(request.result_types.is_none());
    }
}
