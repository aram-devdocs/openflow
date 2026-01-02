//! Tauri commands for search operations.
//!
//! These commands provide the IPC interface for full-text search.
//! Each command is a thin wrapper around SearchService methods.
//!
//! The search functionality uses SQLite FTS5 for efficient full-text
//! indexing and retrieval across tasks, projects, chats, and messages.

use tauri::State;

use crate::commands::AppState;
use openflow_contracts::{SearchRequest, SearchResult, SearchResultType};
use openflow_core::services::search;

/// Search across tasks and projects using full-text search.
///
/// This command provides a unified search interface that queries the FTS5
/// search index. Results are ranked by relevance using the BM25 algorithm.
///
/// # Arguments
/// * `query` - The search query string. Supports FTS5 syntax (AND, OR, NOT, phrases)
/// * `project_id` - Optional project ID to filter results to a specific project
/// * `result_types` - Optional list of result types to filter by (task, project, chat, message)
/// * `limit` - Maximum number of results to return (defaults to 20)
///
/// # Returns
/// Vector of SearchResult ordered by relevance (highest score first)
///
/// # Examples
/// - Simple search: `search("authentication", None, None, None)`
/// - Project-scoped: `search("bug", Some("project-123"), None, None)`
/// - Type-filtered: `search("feature", None, Some(vec![SearchResultType::Task]), None)`
/// - Advanced FTS5: `search("auth* AND login", None, None, Some(10))`
#[tauri::command]
pub async fn search(
    state: State<'_, AppState>,
    query: String,
    project_id: Option<String>,
    result_types: Option<Vec<SearchResultType>>,
    limit: Option<i32>,
) -> Result<Vec<SearchResult>, String> {
    let pool = state.db.lock().await;

    let mut request = SearchRequest::new(query);
    if let Some(pid) = project_id {
        request = request.in_project(pid);
    }
    if let Some(types) = result_types {
        request = request.with_types(types);
    }
    if let Some(lim) = limit {
        request.limit = Some(lim);
    }

    search::search(&pool, request)
        .await
        .map_err(|e| e.to_string())
}

/// Simple search with just a query string.
///
/// Convenience command for basic searches without filters.
///
/// # Arguments
/// * `query` - The search query string
///
/// # Returns
/// Vector of SearchResult ordered by relevance (highest score first)
#[tauri::command]
pub async fn search_simple(
    state: State<'_, AppState>,
    query: String,
) -> Result<Vec<SearchResult>, String> {
    let pool = state.db.lock().await;

    search::search_simple(&pool, &query)
        .await
        .map_err(|e| e.to_string())
}

/// Search for tasks only.
///
/// Convenience command that filters results to task type only.
///
/// # Arguments
/// * `query` - The search query string
///
/// # Returns
/// Vector of task SearchResult ordered by relevance
#[tauri::command]
pub async fn search_tasks(
    state: State<'_, AppState>,
    query: String,
) -> Result<Vec<SearchResult>, String> {
    let pool = state.db.lock().await;

    search::search_tasks(&pool, &query)
        .await
        .map_err(|e| e.to_string())
}

/// Search for projects only.
///
/// Convenience command that filters results to project type only.
///
/// # Arguments
/// * `query` - The search query string
///
/// # Returns
/// Vector of project SearchResult ordered by relevance
#[tauri::command]
pub async fn search_projects(
    state: State<'_, AppState>,
    query: String,
) -> Result<Vec<SearchResult>, String> {
    let pool = state.db.lock().await;

    search::search_projects(&pool, &query)
        .await
        .map_err(|e| e.to_string())
}

/// Search within a specific project.
///
/// Convenience command that scopes search to a single project.
///
/// # Arguments
/// * `query` - The search query string
/// * `project_id` - The project ID to search within
///
/// # Returns
/// Vector of SearchResult ordered by relevance (includes the project itself if matching)
#[tauri::command]
pub async fn search_in_project(
    state: State<'_, AppState>,
    query: String,
    project_id: String,
) -> Result<Vec<SearchResult>, String> {
    let pool = state.db.lock().await;

    search::search_in_project(&pool, &query, &project_id)
        .await
        .map_err(|e| e.to_string())
}
