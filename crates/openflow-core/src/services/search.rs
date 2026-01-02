//! Full-text search service using SQLite FTS5.
//!
//! Provides search functionality across projects and tasks
//! using the FTS5 search_index virtual table.
//!
//! # Logging
//!
//! This module uses structured logging at the following levels:
//! - `debug`: Query parameters, FTS5 query sanitization, filter construction
//! - `info`: Successful search operations with result counts and top results
//! - `warn`: Empty queries, unknown result types, fallback behaviors
//! - `error`: Database query failures
//!
//! # Error Handling
//!
//! All functions return `ServiceResult<T>` and use structured error types:
//! - `ServiceError::Database` for FTS5 query failures

use openflow_contracts::{SearchRequest, SearchResult, SearchResultType};
use sqlx::SqlitePool;
use std::collections::HashMap;
use tracing::{debug, error, info, warn};

use super::{ServiceError, ServiceResult};

/// Internal struct for raw FTS5 query results.
#[derive(Debug, sqlx::FromRow)]
struct RawSearchResult {
    id: String,
    #[sqlx(rename = "type")]
    result_type: String,
    title: String,
    description: Option<String>,
    #[allow(dead_code)]
    project_id: Option<String>,
    rank: f64,
}

/// Search across tasks and projects using FTS5 full-text search.
///
/// # Arguments
/// * `pool` - Database connection pool
/// * `request` - Search request with query, filters, and limit
///
/// # Returns
/// Vector of SearchResult ordered by relevance (highest rank first)
///
/// # Example
///
/// ```ignore
/// use openflow_core::services::search;
/// use openflow_contracts::SearchRequest;
///
/// let request = SearchRequest::new("authentication")
///     .tasks_only()
///     .with_limit(10);
///
/// let results = search::search(&pool, request).await?;
/// ```
pub async fn search(pool: &SqlitePool, request: SearchRequest) -> ServiceResult<Vec<SearchResult>> {
    let limit = request.effective_limit();
    let type_names: Vec<&str> = request
        .result_types
        .as_ref()
        .map(|types| types.iter().map(|t| t.as_str()).collect())
        .unwrap_or_default();

    debug!(
        query = %request.query,
        project_id = ?request.project_id,
        result_types = ?type_names,
        limit = limit,
        "Searching"
    );

    // Sanitize the query for FTS5 - escape special characters
    let sanitized_query = sanitize_fts_query(&request.query);
    debug!(
        original = %request.query,
        sanitized = %sanitized_query,
        "Sanitized FTS5 query"
    );

    if sanitized_query.is_empty() {
        warn!(
            query = %request.query,
            "Empty or invalid search query after sanitization"
        );
        return Ok(Vec::new());
    }

    // Build the SQL query with optional filters
    let mut sql = String::from(
        r#"
        SELECT
            id,
            type,
            title,
            description,
            project_id,
            bm25(search_index) as rank
        FROM search_index
        WHERE search_index MATCH ?
        "#,
    );

    // Track conditions
    let mut conditions: Vec<String> = Vec::new();

    if request.project_id.is_some() {
        conditions.push("(project_id = ? OR type = 'project')".to_string());
    }

    if let Some(ref types) = request.result_types {
        if !types.is_empty() {
            let type_placeholders: Vec<&str> = types.iter().map(|_| "?").collect();
            conditions.push(format!("type IN ({})", type_placeholders.join(", ")));
        }
    }

    if !conditions.is_empty() {
        sql.push_str(" AND ");
        sql.push_str(&conditions.join(" AND "));
        debug!(conditions = ?conditions, "Applied search filters");
    }

    sql.push_str(" ORDER BY rank LIMIT ?");

    debug!("Executing FTS5 search query");

    // Build and execute the query based on the filter combinations
    let raw_results = match (&request.project_id, &request.result_types) {
        (Some(pid), Some(types)) if !types.is_empty() => {
            debug!(
                project_id = %pid,
                type_count = types.len(),
                "Executing search with project_id and result types"
            );
            // Both project_id and result_types filters
            match types.len() {
                1 => sqlx::query_as::<_, RawSearchResult>(&sql)
                    .bind(&sanitized_query)
                    .bind(pid)
                    .bind(types[0].as_str())
                    .bind(limit)
                    .fetch_all(pool)
                    .await
                    .map_err(|e| {
                        error!(
                            query = %request.query,
                            project_id = %pid,
                            error = %e,
                            "FTS5 search failed"
                        );
                        ServiceError::Database(e)
                    })?,
                2 => sqlx::query_as::<_, RawSearchResult>(&sql)
                    .bind(&sanitized_query)
                    .bind(pid)
                    .bind(types[0].as_str())
                    .bind(types[1].as_str())
                    .bind(limit)
                    .fetch_all(pool)
                    .await
                    .map_err(|e| {
                        error!(
                            query = %request.query,
                            project_id = %pid,
                            error = %e,
                            "FTS5 search failed"
                        );
                        ServiceError::Database(e)
                    })?,
                _ => {
                    // For more than 2 types, use a simpler approach
                    search_with_many_types(pool, &sanitized_query, Some(pid), types, limit)
                        .await
                        .map_err(|e| {
                            error!(
                                query = %request.query,
                                project_id = %pid,
                                error = ?e,
                                "FTS5 search with many types failed"
                            );
                            e
                        })?
                }
            }
        }
        (Some(pid), None) | (Some(pid), Some(_)) => {
            debug!(project_id = %pid, "Executing search with project_id only");
            // Only project_id filter (empty types treated as no filter)
            sqlx::query_as::<_, RawSearchResult>(&sql)
                .bind(&sanitized_query)
                .bind(pid)
                .bind(limit)
                .fetch_all(pool)
                .await
                .map_err(|e| {
                    error!(
                        query = %request.query,
                        project_id = %pid,
                        error = %e,
                        "FTS5 search failed"
                    );
                    ServiceError::Database(e)
                })?
        }
        (None, Some(types)) if !types.is_empty() => {
            debug!(type_count = types.len(), "Executing search with result types only");
            // Only result_types filter
            match types.len() {
                1 => sqlx::query_as::<_, RawSearchResult>(&sql)
                    .bind(&sanitized_query)
                    .bind(types[0].as_str())
                    .bind(limit)
                    .fetch_all(pool)
                    .await
                    .map_err(|e| {
                        error!(query = %request.query, error = %e, "FTS5 search failed");
                        ServiceError::Database(e)
                    })?,
                2 => sqlx::query_as::<_, RawSearchResult>(&sql)
                    .bind(&sanitized_query)
                    .bind(types[0].as_str())
                    .bind(types[1].as_str())
                    .bind(limit)
                    .fetch_all(pool)
                    .await
                    .map_err(|e| {
                        error!(query = %request.query, error = %e, "FTS5 search failed");
                        ServiceError::Database(e)
                    })?,
                _ => search_with_many_types(pool, &sanitized_query, None, types, limit)
                    .await
                    .map_err(|e| {
                        error!(
                            query = %request.query,
                            error = ?e,
                            "FTS5 search with many types failed"
                        );
                        e
                    })?,
            }
        }
        (None, None) | (None, Some(_)) => {
            debug!("Executing search without filters");
            // No filters (empty types treated as no filter)
            sqlx::query_as::<_, RawSearchResult>(&sql)
                .bind(&sanitized_query)
                .bind(limit)
                .fetch_all(pool)
                .await
                .map_err(|e| {
                    error!(query = %request.query, error = %e, "FTS5 search failed");
                    ServiceError::Database(e)
                })?
        }
    };

    // Convert raw results to SearchResult
    let results: Vec<SearchResult> = raw_results.into_iter().map(raw_to_search_result).collect();

    // Log search results summary
    let results_by_type: HashMap<&str, usize> =
        results
            .iter()
            .fold(HashMap::new(), |mut acc, r| {
                let type_str = r.result_type.as_str();
                *acc.entry(type_str).or_insert(0) += 1;
                acc
            });

    let top_results: Vec<(&str, f64)> = results
        .iter()
        .take(3)
        .map(|r| (r.title.as_str(), r.score))
        .collect();

    info!(
        query = %request.query,
        total_results = results.len(),
        by_type = ?results_by_type,
        top_results = ?top_results,
        "Search completed"
    );

    Ok(results)
}

/// Search with a simple query string (convenience function).
///
/// # Arguments
/// * `pool` - Database connection pool
/// * `query` - Search query string
///
/// # Returns
/// Vector of SearchResult ordered by relevance (highest rank first)
pub async fn search_simple(pool: &SqlitePool, query: &str) -> ServiceResult<Vec<SearchResult>> {
    search(pool, SearchRequest::new(query)).await
}

/// Search within a specific project.
///
/// # Arguments
/// * `pool` - Database connection pool
/// * `query` - Search query string
/// * `project_id` - Project ID to filter by
///
/// # Returns
/// Vector of SearchResult ordered by relevance (highest rank first)
pub async fn search_in_project(
    pool: &SqlitePool,
    query: &str,
    project_id: &str,
) -> ServiceResult<Vec<SearchResult>> {
    search(pool, SearchRequest::new(query).in_project(project_id)).await
}

/// Search for tasks only.
///
/// # Arguments
/// * `pool` - Database connection pool
/// * `query` - Search query string
///
/// # Returns
/// Vector of task SearchResult ordered by relevance
pub async fn search_tasks(pool: &SqlitePool, query: &str) -> ServiceResult<Vec<SearchResult>> {
    search(pool, SearchRequest::new(query).tasks_only()).await
}

/// Search for projects only.
///
/// # Arguments
/// * `pool` - Database connection pool
/// * `query` - Search query string
///
/// # Returns
/// Vector of project SearchResult ordered by relevance
pub async fn search_projects(pool: &SqlitePool, query: &str) -> ServiceResult<Vec<SearchResult>> {
    search(pool, SearchRequest::new(query).projects_only()).await
}

/// Helper for searching with many result types (more than 2).
async fn search_with_many_types(
    pool: &SqlitePool,
    query: &str,
    project_id: Option<&str>,
    types: &[SearchResultType],
    limit: i32,
) -> ServiceResult<Vec<RawSearchResult>> {
    let type_names: Vec<&str> = types.iter().map(|t| t.as_str()).collect();
    debug!(
        query = %query,
        project_id = ?project_id,
        types = ?type_names,
        limit = limit,
        "search_with_many_types"
    );

    // For many types, construct the query with literal type values
    let type_values: Vec<String> = types.iter().map(|t| format!("'{}'", t.as_str())).collect();
    let type_list = type_values.join(", ");

    let sql = if project_id.is_some() {
        format!(
            r#"
            SELECT
                id,
                type,
                title,
                description,
                project_id,
                bm25(search_index) as rank
            FROM search_index
            WHERE search_index MATCH ?
            AND (project_id = ? OR type = 'project')
            AND type IN ({})
            ORDER BY rank
            LIMIT ?
            "#,
            type_list
        )
    } else {
        format!(
            r#"
            SELECT
                id,
                type,
                title,
                description,
                project_id,
                bm25(search_index) as rank
            FROM search_index
            WHERE search_index MATCH ?
            AND type IN ({})
            ORDER BY rank
            LIMIT ?
            "#,
            type_list
        )
    };

    let results = if let Some(pid) = project_id {
        sqlx::query_as::<_, RawSearchResult>(&sql)
            .bind(query)
            .bind(pid)
            .bind(limit)
            .fetch_all(pool)
            .await
            .map_err(|e| {
                error!(
                    query = %query,
                    project_id = %pid,
                    error = %e,
                    "search_with_many_types failed"
                );
                ServiceError::Database(e)
            })?
    } else {
        sqlx::query_as::<_, RawSearchResult>(&sql)
            .bind(query)
            .bind(limit)
            .fetch_all(pool)
            .await
            .map_err(|e| {
                error!(
                    query = %query,
                    error = %e,
                    "search_with_many_types failed"
                );
                ServiceError::Database(e)
            })?
    };

    debug!(result_count = results.len(), "search_with_many_types completed");

    Ok(results)
}

/// Convert raw database result to SearchResult.
fn raw_to_search_result(raw: RawSearchResult) -> SearchResult {
    let result_type = SearchResultType::parse(&raw.result_type).unwrap_or_else(|| {
        warn!(
            result_type = %raw.result_type,
            "Unknown search result type, defaulting to Task"
        );
        SearchResultType::Task
    });

    SearchResult::new(
        raw.id,
        result_type,
        raw.title,
        raw.description,
        // BM25 returns negative values where more negative = more relevant
        // Convert to positive score where higher = more relevant
        -raw.rank,
    )
}

/// Sanitize a search query for FTS5.
///
/// This handles special FTS5 operators and escapes problematic characters.
fn sanitize_fts_query(query: &str) -> String {
    let trimmed = query.trim();
    if trimmed.is_empty() {
        return String::new();
    }

    // If the query contains FTS5 operators, pass it through with minimal processing
    // FTS5 operators: AND, OR, NOT, NEAR, *, "
    let has_operators = trimmed.contains(" AND ")
        || trimmed.contains(" OR ")
        || trimmed.contains(" NOT ")
        || trimmed.contains(" NEAR")
        || trimmed.contains('*')
        || (trimmed.contains('"') && trimmed.matches('"').count() >= 2);

    if has_operators {
        // User is using FTS5 syntax intentionally
        trimmed.to_string()
    } else {
        // Simple query - add wildcard suffix for prefix matching
        // Split into words and add * to each for prefix matching
        trimmed
            .split_whitespace()
            .map(|word| {
                // Escape special characters within words
                let escaped = word
                    .chars()
                    .filter(|c| c.is_alphanumeric() || *c == '_' || *c == '-')
                    .collect::<String>();
                if escaped.is_empty() {
                    String::new()
                } else {
                    format!("{}*", escaped)
                }
            })
            .filter(|s| !s.is_empty())
            .collect::<Vec<_>>()
            .join(" ")
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::services::{project, task};
    use openflow_contracts::{CreateProjectRequest, CreateTaskRequest};
    use openflow_db::create_test_db;

    #[tokio::test]
    async fn test_search_empty_query() {
        let pool = create_test_db().await.unwrap();

        let request = SearchRequest::new("");
        let results = search(&pool, request).await.expect("Search should succeed");

        assert!(results.is_empty(), "Empty query should return no results");
    }

    #[tokio::test]
    async fn test_search_whitespace_query() {
        let pool = create_test_db().await.unwrap();

        let request = SearchRequest::new("   ");
        let results = search(&pool, request).await.expect("Search should succeed");

        assert!(
            results.is_empty(),
            "Whitespace-only query should return no results"
        );
    }

    #[tokio::test]
    async fn test_search_finds_project_by_name() {
        let pool = create_test_db().await.unwrap();

        // Create a project
        let create_request = CreateProjectRequest {
            name: "OpenFlow Application".to_string(),
            git_repo_path: "/test/openflow".to_string(),
            ..Default::default()
        };
        project::create(&pool, create_request).await.unwrap();

        // Search for it - filter by Project type
        let request = SearchRequest::new("OpenFlow").projects_only();
        let results = search(&pool, request).await.expect("Search should succeed");

        assert!(!results.is_empty(), "Should find the project");
        assert_eq!(results[0].result_type, SearchResultType::Project);
        assert!(results[0].title.contains("OpenFlow"));
    }

    #[tokio::test]
    async fn test_search_finds_task_by_title() {
        let pool = create_test_db().await.unwrap();

        // Create a project and task
        let proj_request = CreateProjectRequest {
            name: "Test Project".to_string(),
            git_repo_path: "/test/proj".to_string(),
            ..Default::default()
        };
        let proj = project::create(&pool, proj_request).await.unwrap();

        let task_request = CreateTaskRequest {
            project_id: proj.id.clone(),
            title: "Implement Authentication Feature".to_string(),
            description: Some("Add OAuth2 login support".to_string()),
            ..Default::default()
        };
        task::create(&pool, task_request).await.unwrap();

        // Search for the task
        let request = SearchRequest::new("Authentication").tasks_only();
        let results = search(&pool, request).await.expect("Search should succeed");

        assert!(!results.is_empty(), "Should find the task");
        assert_eq!(results[0].result_type, SearchResultType::Task);
        assert!(results[0].title.contains("Authentication"));
    }

    #[tokio::test]
    async fn test_search_finds_task_by_description() {
        let pool = create_test_db().await.unwrap();

        // Create a project and task
        let proj_request = CreateProjectRequest {
            name: "Test Project".to_string(),
            git_repo_path: "/test/proj".to_string(),
            ..Default::default()
        };
        let proj = project::create(&pool, proj_request).await.unwrap();

        let task_request = CreateTaskRequest {
            project_id: proj.id.clone(),
            title: "Login Feature".to_string(),
            description: Some(
                "Implement OAuth2 authentication with Google and GitHub providers".to_string(),
            ),
            ..Default::default()
        };
        task::create(&pool, task_request).await.unwrap();

        // Search for terms in description
        let request = SearchRequest::new("OAuth2");
        let results = search(&pool, request).await.expect("Search should succeed");

        assert!(!results.is_empty(), "Should find the task by description");
        assert_eq!(results[0].result_type, SearchResultType::Task);
    }

    #[tokio::test]
    async fn test_search_filter_by_project() {
        let pool = create_test_db().await.unwrap();

        // Create two projects with tasks
        let proj_a_request = CreateProjectRequest {
            name: "Project Alpha".to_string(),
            git_repo_path: "/test/alpha".to_string(),
            ..Default::default()
        };
        let proj_a = project::create(&pool, proj_a_request).await.unwrap();

        let proj_b_request = CreateProjectRequest {
            name: "Project Beta".to_string(),
            git_repo_path: "/test/beta".to_string(),
            ..Default::default()
        };
        let proj_b = project::create(&pool, proj_b_request).await.unwrap();

        let task_a_request = CreateTaskRequest {
            project_id: proj_a.id.clone(),
            title: "Development Work".to_string(),
            description: Some("Develop new features".to_string()),
            ..Default::default()
        };
        task::create(&pool, task_a_request).await.unwrap();

        let task_b_request = CreateTaskRequest {
            project_id: proj_b.id.clone(),
            title: "Testing Work".to_string(),
            description: Some("Test new features".to_string()),
            ..Default::default()
        };
        task::create(&pool, task_b_request).await.unwrap();

        // Search within project A only
        let request = SearchRequest::new("Development")
            .in_project(&proj_a.id)
            .tasks_only();
        let results = search(&pool, request).await.expect("Search should succeed");

        // Should find task from project A
        assert!(!results.is_empty(), "Should find the task from project A");
        for result in &results {
            assert_eq!(result.result_type, SearchResultType::Task);
            assert!(
                result.title.contains("Development"),
                "Should only find tasks from project A, got: {}",
                result.title
            );
        }
    }

    #[tokio::test]
    async fn test_search_filter_by_result_type() {
        let pool = create_test_db().await.unwrap();

        // Create a project and task with similar names
        let proj_request = CreateProjectRequest {
            name: "Development Project".to_string(),
            git_repo_path: "/test/dev".to_string(),
            ..Default::default()
        };
        let proj = project::create(&pool, proj_request).await.unwrap();

        let task_request = CreateTaskRequest {
            project_id: proj.id.clone(),
            title: "Development Task".to_string(),
            description: Some("Main development work".to_string()),
            ..Default::default()
        };
        task::create(&pool, task_request).await.unwrap();

        // Search for tasks only
        let request = SearchRequest::new("Development").tasks_only();
        let task_results = search(&pool, request).await.expect("Search should succeed");

        for result in &task_results {
            assert_eq!(
                result.result_type,
                SearchResultType::Task,
                "Should only return tasks"
            );
        }

        // Search for projects only
        let request = SearchRequest::new("Development").projects_only();
        let project_results = search(&pool, request).await.expect("Search should succeed");

        for result in &project_results {
            assert_eq!(
                result.result_type,
                SearchResultType::Project,
                "Should only return projects"
            );
        }
    }

    #[tokio::test]
    async fn test_search_with_limit() {
        let pool = create_test_db().await.unwrap();

        // Create multiple tasks
        let proj_request = CreateProjectRequest {
            name: "Test Project".to_string(),
            git_repo_path: "/test/proj".to_string(),
            ..Default::default()
        };
        let proj = project::create(&pool, proj_request).await.unwrap();

        for i in 1..=5 {
            let task_request = CreateTaskRequest {
                project_id: proj.id.clone(),
                title: format!("Task Number {}", i),
                description: Some(format!("Description for task {}", i)),
                ..Default::default()
            };
            task::create(&pool, task_request).await.unwrap();
        }

        // Search with limit
        let request = SearchRequest::new("Task").with_limit(3);
        let results = search(&pool, request).await.expect("Search should succeed");

        assert!(
            results.len() <= 3,
            "Should respect limit, got {} results",
            results.len()
        );
    }

    #[tokio::test]
    async fn test_search_prefix_matching() {
        let pool = create_test_db().await.unwrap();

        // Create tasks with similar prefixes
        let proj_request = CreateProjectRequest {
            name: "Test Project".to_string(),
            git_repo_path: "/test/proj".to_string(),
            ..Default::default()
        };
        let proj = project::create(&pool, proj_request).await.unwrap();

        let task1 = CreateTaskRequest {
            project_id: proj.id.clone(),
            title: "Authentication Module".to_string(),
            ..Default::default()
        };
        task::create(&pool, task1).await.unwrap();

        let task2 = CreateTaskRequest {
            project_id: proj.id.clone(),
            title: "Authorization System".to_string(),
            ..Default::default()
        };
        task::create(&pool, task2).await.unwrap();

        // Search with prefix
        let request = SearchRequest::new("Auth");
        let results = search(&pool, request).await.expect("Search should succeed");

        assert!(
            results.len() >= 2,
            "Should find both Authentication and Authorization"
        );
    }

    #[tokio::test]
    async fn test_search_no_results() {
        let pool = create_test_db().await.unwrap();

        // Create a project
        let proj_request = CreateProjectRequest {
            name: "Test Project".to_string(),
            git_repo_path: "/test/proj".to_string(),
            ..Default::default()
        };
        project::create(&pool, proj_request).await.unwrap();

        // Search for non-existent term
        let request = SearchRequest::new("nonexistenttermxyz123");
        let results = search(&pool, request).await.expect("Search should succeed");

        assert!(
            results.is_empty(),
            "Should return no results for unmatched query"
        );
    }

    #[tokio::test]
    async fn test_search_result_has_correct_icon() {
        let pool = create_test_db().await.unwrap();

        // Create a project and task
        let proj_request = CreateProjectRequest {
            name: "Icon Test Project".to_string(),
            git_repo_path: "/test/icon".to_string(),
            ..Default::default()
        };
        let proj = project::create(&pool, proj_request).await.unwrap();

        let task_request = CreateTaskRequest {
            project_id: proj.id.clone(),
            title: "Icon Test Task".to_string(),
            ..Default::default()
        };
        task::create(&pool, task_request).await.unwrap();

        // Search for both
        let request = SearchRequest::new("Icon Test");
        let results = search(&pool, request).await.expect("Search should succeed");

        for result in results {
            match result.result_type {
                SearchResultType::Task => {
                    assert_eq!(result.icon, Some("check-square".to_string()));
                }
                SearchResultType::Project => {
                    assert_eq!(result.icon, Some("folder".to_string()));
                }
                _ => {}
            }
        }
    }

    #[tokio::test]
    async fn test_search_score_is_positive() {
        let pool = create_test_db().await.unwrap();

        // Create a project
        let proj_request = CreateProjectRequest {
            name: "Score Test Project".to_string(),
            git_repo_path: "/test/score".to_string(),
            ..Default::default()
        };
        project::create(&pool, proj_request).await.unwrap();

        let request = SearchRequest::new("Score Test");
        let results = search(&pool, request).await.expect("Search should succeed");

        assert!(!results.is_empty());
        for result in results {
            assert!(
                result.score >= 0.0,
                "Score should be non-negative, got {}",
                result.score
            );
        }
    }

    #[tokio::test]
    async fn test_search_simple_convenience() {
        let pool = create_test_db().await.unwrap();

        // Create a project
        let proj_request = CreateProjectRequest {
            name: "Simple Search Project".to_string(),
            git_repo_path: "/test/simple".to_string(),
            ..Default::default()
        };
        project::create(&pool, proj_request).await.unwrap();

        let results = search_simple(&pool, "Simple").await.expect("Search should succeed");
        assert!(!results.is_empty());
    }

    #[tokio::test]
    async fn test_search_tasks_convenience() {
        let pool = create_test_db().await.unwrap();

        // Create a project and task
        let proj_request = CreateProjectRequest {
            name: "Convenience Project".to_string(),
            git_repo_path: "/test/convenience".to_string(),
            ..Default::default()
        };
        let proj = project::create(&pool, proj_request).await.unwrap();

        let task_request = CreateTaskRequest {
            project_id: proj.id.clone(),
            title: "Convenience Task".to_string(),
            ..Default::default()
        };
        task::create(&pool, task_request).await.unwrap();

        let results = search_tasks(&pool, "Convenience").await.expect("Search should succeed");
        assert!(!results.is_empty());
        for result in results {
            assert_eq!(result.result_type, SearchResultType::Task);
        }
    }

    #[test]
    fn test_sanitize_fts_query_simple() {
        let result = sanitize_fts_query("hello world");
        assert!(result.contains("hello*"));
        assert!(result.contains("world*"));
    }

    #[test]
    fn test_sanitize_fts_query_preserves_operators() {
        let result = sanitize_fts_query("hello AND world");
        assert_eq!(result, "hello AND world");

        let result = sanitize_fts_query("hello OR world");
        assert_eq!(result, "hello OR world");
    }

    #[test]
    fn test_sanitize_fts_query_removes_special_chars() {
        let result = sanitize_fts_query("hello@world#test");
        assert!(!result.contains('@'));
        assert!(!result.contains('#'));
    }

    #[tokio::test]
    async fn test_search_combined_filters() {
        let pool = create_test_db().await.unwrap();

        // Create multiple projects and tasks
        let proj_a_request = CreateProjectRequest {
            name: "Project Alpha".to_string(),
            git_repo_path: "/test/alpha".to_string(),
            ..Default::default()
        };
        let proj_a = project::create(&pool, proj_a_request).await.unwrap();

        let proj_b_request = CreateProjectRequest {
            name: "Project Beta".to_string(),
            git_repo_path: "/test/beta".to_string(),
            ..Default::default()
        };
        project::create(&pool, proj_b_request).await.unwrap();

        let task_a = CreateTaskRequest {
            project_id: proj_a.id.clone(),
            title: "Feature Alpha One".to_string(),
            ..Default::default()
        };
        task::create(&pool, task_a).await.unwrap();

        // Search with both project filter and type filter
        let request = SearchRequest::new("Feature")
            .in_project(&proj_a.id)
            .tasks_only();
        let results = search(&pool, request).await.expect("Search should succeed");

        for result in &results {
            assert_eq!(result.result_type, SearchResultType::Task);
            assert!(
                result.title.contains("Alpha"),
                "Should only find tasks from project A"
            );
        }
    }
}
