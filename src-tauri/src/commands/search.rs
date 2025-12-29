//! Tauri commands for search operations.
//!
//! These commands provide the IPC interface for full-text search.
//! Each command is a thin wrapper around SearchService methods.
//!
//! The search functionality uses SQLite FTS5 for efficient full-text
//! indexing and retrieval across tasks, projects, chats, and messages.

use tauri::State;

use crate::commands::AppState;
use crate::services::SearchService;
use crate::types::{SearchResult, SearchResultType};

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
    SearchService::search(
        &pool,
        &query,
        project_id.as_deref(),
        result_types,
        limit,
    )
    .await
    .map_err(|e| e.to_string())
}
