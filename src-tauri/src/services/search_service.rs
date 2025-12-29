//! Full-text search service using SQLite FTS5.
//!
//! Provides search functionality across projects and tasks
//! using the FTS5 search_index virtual table.

use sqlx::SqlitePool;

use crate::types::{SearchResult, SearchResultType};

use super::ServiceResult;

/// Service for full-text search operations.
pub struct SearchService;

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

impl SearchService {
    /// Search across tasks and projects using FTS5 full-text search.
    ///
    /// # Arguments
    /// * `pool` - Database connection pool
    /// * `query` - Search query string (supports FTS5 syntax like AND, OR, NOT, phrases)
    /// * `project_id` - Optional project ID to filter results to a specific project
    /// * `result_types` - Optional list of result types to filter by (e.g., ["task", "project"])
    /// * `limit` - Maximum number of results to return (defaults to 20)
    ///
    /// # Returns
    /// Vector of SearchResult ordered by relevance (highest rank first)
    pub async fn search(
        pool: &SqlitePool,
        query: &str,
        project_id: Option<&str>,
        result_types: Option<Vec<SearchResultType>>,
        limit: Option<i32>,
    ) -> ServiceResult<Vec<SearchResult>> {
        let limit = limit.unwrap_or(20);

        // Sanitize the query for FTS5 - escape special characters
        let sanitized_query = Self::sanitize_fts_query(query);

        if sanitized_query.is_empty() {
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

        if project_id.is_some() {
            conditions.push("(project_id = ? OR type = 'project')".to_string());
        }

        if let Some(ref types) = result_types {
            if !types.is_empty() {
                let type_placeholders: Vec<&str> = types.iter().map(|_| "?").collect();
                conditions.push(format!("type IN ({})", type_placeholders.join(", ")));
            }
        }

        if !conditions.is_empty() {
            sql.push_str(" AND ");
            sql.push_str(&conditions.join(" AND "));
        }

        sql.push_str(" ORDER BY rank LIMIT ?");

        // Build and execute the query based on the filter combinations
        let raw_results = match (project_id, &result_types) {
            (Some(pid), Some(types)) if !types.is_empty() => {
                // Both project_id and result_types filters
                match types.len() {
                    1 => {
                        sqlx::query_as::<_, RawSearchResult>(&sql)
                            .bind(&sanitized_query)
                            .bind(pid)
                            .bind(Self::type_to_string(&types[0]))
                            .bind(limit)
                            .fetch_all(pool)
                            .await?
                    }
                    2 => {
                        sqlx::query_as::<_, RawSearchResult>(&sql)
                            .bind(&sanitized_query)
                            .bind(pid)
                            .bind(Self::type_to_string(&types[0]))
                            .bind(Self::type_to_string(&types[1]))
                            .bind(limit)
                            .fetch_all(pool)
                            .await?
                    }
                    _ => {
                        // For more than 2 types, use a simpler approach
                        Self::search_with_many_types(pool, &sanitized_query, Some(pid), types, limit)
                            .await?
                    }
                }
            }
            (Some(pid), None) | (Some(pid), Some(_)) => {
                // Only project_id filter (empty types treated as no filter)
                sqlx::query_as::<_, RawSearchResult>(&sql)
                    .bind(&sanitized_query)
                    .bind(pid)
                    .bind(limit)
                    .fetch_all(pool)
                    .await?
            }
            (None, Some(types)) if !types.is_empty() => {
                // Only result_types filter
                match types.len() {
                    1 => {
                        sqlx::query_as::<_, RawSearchResult>(&sql)
                            .bind(&sanitized_query)
                            .bind(Self::type_to_string(&types[0]))
                            .bind(limit)
                            .fetch_all(pool)
                            .await?
                    }
                    2 => {
                        sqlx::query_as::<_, RawSearchResult>(&sql)
                            .bind(&sanitized_query)
                            .bind(Self::type_to_string(&types[0]))
                            .bind(Self::type_to_string(&types[1]))
                            .bind(limit)
                            .fetch_all(pool)
                            .await?
                    }
                    _ => {
                        Self::search_with_many_types(pool, &sanitized_query, None, types, limit)
                            .await?
                    }
                }
            }
            (None, None) | (None, Some(_)) => {
                // No filters (empty types treated as no filter)
                sqlx::query_as::<_, RawSearchResult>(&sql)
                    .bind(&sanitized_query)
                    .bind(limit)
                    .fetch_all(pool)
                    .await?
            }
        };

        // Convert raw results to SearchResult
        let results = raw_results
            .into_iter()
            .map(Self::raw_to_search_result)
            .collect();

        Ok(results)
    }

    /// Helper for searching with many result types (more than 2).
    async fn search_with_many_types(
        pool: &SqlitePool,
        query: &str,
        project_id: Option<&str>,
        types: &[SearchResultType],
        limit: i32,
    ) -> ServiceResult<Vec<RawSearchResult>> {
        // For many types, construct the query with literal type values
        let type_values: Vec<String> = types
            .iter()
            .map(|t| format!("'{}'", Self::type_to_string(t)))
            .collect();
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
                .await?
        } else {
            sqlx::query_as::<_, RawSearchResult>(&sql)
                .bind(query)
                .bind(limit)
                .fetch_all(pool)
                .await?
        };

        Ok(results)
    }

    /// Convert SearchResultType to string for database query.
    fn type_to_string(result_type: &SearchResultType) -> &'static str {
        match result_type {
            SearchResultType::Task => "task",
            SearchResultType::Project => "project",
            SearchResultType::Chat => "chat",
            SearchResultType::Message => "message",
        }
    }

    /// Convert string to SearchResultType.
    fn string_to_type(s: &str) -> SearchResultType {
        match s {
            "task" => SearchResultType::Task,
            "project" => SearchResultType::Project,
            "chat" => SearchResultType::Chat,
            "message" => SearchResultType::Message,
            _ => SearchResultType::Task, // Default fallback
        }
    }

    /// Convert raw database result to SearchResult.
    fn raw_to_search_result(raw: RawSearchResult) -> SearchResult {
        let result_type = Self::string_to_type(&raw.result_type);
        let icon = match result_type {
            SearchResultType::Task => Some("check-square".to_string()),
            SearchResultType::Project => Some("folder".to_string()),
            SearchResultType::Chat => Some("message-square".to_string()),
            SearchResultType::Message => Some("file-text".to_string()),
        };

        SearchResult {
            id: raw.id,
            result_type,
            title: raw.title,
            subtitle: raw.description,
            icon,
            // BM25 returns negative values where more negative = more relevant
            // Convert to positive score where higher = more relevant
            score: -raw.rank,
        }
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
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::db::pool::init_db;
    use crate::services::ProjectService;
    use crate::services::TaskService;
    use crate::types::{CreateProjectRequest, CreateTaskRequest};
    use tempfile::TempDir;

    /// Test fixture that keeps the temp directory alive.
    struct TestDb {
        pool: SqlitePool,
        #[allow(dead_code)]
        temp_dir: TempDir,
    }

    /// Helper to create a test database pool.
    async fn setup_test_db() -> TestDb {
        let temp_dir = TempDir::new().expect("Failed to create temp dir");
        let pool = init_db(temp_dir.path().to_path_buf())
            .await
            .expect("Failed to initialize test database");
        TestDb { pool, temp_dir }
    }

    /// Helper to create a test project.
    async fn create_test_project(pool: &SqlitePool, name: &str) -> String {
        let request = CreateProjectRequest {
            name: name.to_string(),
            git_repo_path: format!("/test/{}", name.to_lowercase().replace(' ', "-")),
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
        let project = ProjectService::create(pool, request)
            .await
            .expect("Failed to create test project");
        project.id
    }

    /// Helper to create a test task.
    async fn create_test_task(
        pool: &SqlitePool,
        project_id: &str,
        title: &str,
        description: Option<&str>,
    ) -> String {
        let request = CreateTaskRequest {
            project_id: project_id.to_string(),
            title: title.to_string(),
            description: description.map(|s| s.to_string()),
            workflow_template: None,
            parent_task_id: None,
            base_branch: None,
        };
        let task = TaskService::create(pool, request)
            .await
            .expect("Failed to create test task");
        task.id
    }

    #[tokio::test]
    async fn test_search_empty_query() {
        let test_db = setup_test_db().await;

        let results = SearchService::search(&test_db.pool, "", None, None, None)
            .await
            .expect("Search should succeed");

        assert!(results.is_empty(), "Empty query should return no results");
    }

    #[tokio::test]
    async fn test_search_whitespace_query() {
        let test_db = setup_test_db().await;

        let results = SearchService::search(&test_db.pool, "   ", None, None, None)
            .await
            .expect("Search should succeed");

        assert!(
            results.is_empty(),
            "Whitespace-only query should return no results"
        );
    }

    #[tokio::test]
    async fn test_search_finds_project_by_name() {
        let test_db = setup_test_db().await;

        // Create a project
        create_test_project(&test_db.pool, "OpenFlow Application").await;

        // Search for it - filter by Project type to ensure we only get projects
        let results = SearchService::search(
            &test_db.pool,
            "OpenFlow",
            None,
            Some(vec![SearchResultType::Project]),
            None,
        )
        .await
        .expect("Search should succeed");

        assert!(!results.is_empty(), "Should find the project");
        assert_eq!(results[0].result_type, SearchResultType::Project);
        assert!(results[0].title.contains("OpenFlow"));
    }

    #[tokio::test]
    async fn test_search_finds_task_by_title() {
        let test_db = setup_test_db().await;

        // Create a project and task
        let project_id = create_test_project(&test_db.pool, "Test Project").await;
        create_test_task(
            &test_db.pool,
            &project_id,
            "Implement Authentication Feature",
            Some("Add OAuth2 login support"),
        )
        .await;

        // Search for the task - filter by Task type
        let results = SearchService::search(
            &test_db.pool,
            "Authentication",
            None,
            Some(vec![SearchResultType::Task]),
            None,
        )
        .await
        .expect("Search should succeed");

        assert!(!results.is_empty(), "Should find the task");
        assert_eq!(results[0].result_type, SearchResultType::Task);
        assert!(results[0].title.contains("Authentication"));
    }

    #[tokio::test]
    async fn test_search_finds_task_by_description() {
        let test_db = setup_test_db().await;

        // Create a project and task
        let project_id = create_test_project(&test_db.pool, "Test Project").await;
        create_test_task(
            &test_db.pool,
            &project_id,
            "Login Feature",
            Some("Implement OAuth2 authentication with Google and GitHub providers"),
        )
        .await;

        // Search for terms in description
        let results = SearchService::search(&test_db.pool, "OAuth2", None, None, None)
            .await
            .expect("Search should succeed");

        assert!(!results.is_empty(), "Should find the task by description");
        assert_eq!(results[0].result_type, SearchResultType::Task);
    }

    #[tokio::test]
    async fn test_search_filter_by_project() {
        let test_db = setup_test_db().await;

        // Create two projects with tasks
        let project_a = create_test_project(&test_db.pool, "Project Alpha").await;
        let project_b = create_test_project(&test_db.pool, "Project Beta").await;

        create_test_task(
            &test_db.pool,
            &project_a,
            "Development Work",
            Some("Develop new features"),
        )
        .await;
        create_test_task(
            &test_db.pool,
            &project_b,
            "Testing Work",
            Some("Test new features"),
        )
        .await;

        // Search within project A only - filter to tasks only
        let results = SearchService::search(
            &test_db.pool,
            "Development",
            Some(&project_a),
            Some(vec![SearchResultType::Task]),
            None,
        )
        .await
        .expect("Search should succeed");

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
        let test_db = setup_test_db().await;

        // Create a project and task with similar names
        let project_id = create_test_project(&test_db.pool, "Development Project").await;
        create_test_task(
            &test_db.pool,
            &project_id,
            "Development Task",
            Some("Main development work"),
        )
        .await;

        // Search for tasks only
        let task_results = SearchService::search(
            &test_db.pool,
            "Development",
            None,
            Some(vec![SearchResultType::Task]),
            None,
        )
        .await
        .expect("Search should succeed");

        for result in &task_results {
            assert_eq!(
                result.result_type,
                SearchResultType::Task,
                "Should only return tasks"
            );
        }

        // Search for projects only
        let project_results = SearchService::search(
            &test_db.pool,
            "Development",
            None,
            Some(vec![SearchResultType::Project]),
            None,
        )
        .await
        .expect("Search should succeed");

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
        let test_db = setup_test_db().await;

        // Create multiple tasks
        let project_id = create_test_project(&test_db.pool, "Test Project").await;
        for i in 1..=5 {
            create_test_task(
                &test_db.pool,
                &project_id,
                &format!("Task Number {}", i),
                Some(&format!("Description for task {}", i)),
            )
            .await;
        }

        // Search with limit
        let results = SearchService::search(&test_db.pool, "Task", None, None, Some(3))
            .await
            .expect("Search should succeed");

        assert!(
            results.len() <= 3,
            "Should respect limit, got {} results",
            results.len()
        );
    }

    #[tokio::test]
    async fn test_search_prefix_matching() {
        let test_db = setup_test_db().await;

        // Create tasks with similar prefixes
        let project_id = create_test_project(&test_db.pool, "Test Project").await;
        create_test_task(&test_db.pool, &project_id, "Authentication Module", None).await;
        create_test_task(&test_db.pool, &project_id, "Authorization System", None).await;

        // Search with prefix
        let results = SearchService::search(&test_db.pool, "Auth", None, None, None)
            .await
            .expect("Search should succeed");

        assert!(
            results.len() >= 2,
            "Should find both Authentication and Authorization"
        );
    }

    #[tokio::test]
    async fn test_search_no_results() {
        let test_db = setup_test_db().await;

        // Create a project
        create_test_project(&test_db.pool, "Test Project").await;

        // Search for non-existent term
        let results =
            SearchService::search(&test_db.pool, "nonexistenttermxyz123", None, None, None)
                .await
                .expect("Search should succeed");

        assert!(results.is_empty(), "Should return no results for unmatched query");
    }

    #[tokio::test]
    async fn test_search_result_has_correct_icon() {
        let test_db = setup_test_db().await;

        // Create a project and task
        let project_id = create_test_project(&test_db.pool, "Icon Test Project").await;
        create_test_task(&test_db.pool, &project_id, "Icon Test Task", None).await;

        // Search for both
        let results = SearchService::search(&test_db.pool, "Icon Test", None, None, None)
            .await
            .expect("Search should succeed");

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
        let test_db = setup_test_db().await;

        // Create a project
        create_test_project(&test_db.pool, "Score Test Project").await;

        let results = SearchService::search(&test_db.pool, "Score Test", None, None, None)
            .await
            .expect("Search should succeed");

        assert!(!results.is_empty());
        for result in results {
            assert!(
                result.score >= 0.0,
                "Score should be non-negative, got {}",
                result.score
            );
        }
    }

    #[test]
    fn test_sanitize_fts_query_simple() {
        let result = SearchService::sanitize_fts_query("hello world");
        assert!(result.contains("hello*"));
        assert!(result.contains("world*"));
    }

    #[test]
    fn test_sanitize_fts_query_preserves_operators() {
        let result = SearchService::sanitize_fts_query("hello AND world");
        assert_eq!(result, "hello AND world");

        let result = SearchService::sanitize_fts_query("hello OR world");
        assert_eq!(result, "hello OR world");
    }

    #[test]
    fn test_sanitize_fts_query_removes_special_chars() {
        let result = SearchService::sanitize_fts_query("hello@world#test");
        assert!(!result.contains('@'));
        assert!(!result.contains('#'));
    }

    #[tokio::test]
    async fn test_search_combined_filters() {
        let test_db = setup_test_db().await;

        // Create multiple projects and tasks
        let project_a = create_test_project(&test_db.pool, "Project Alpha").await;
        let project_b = create_test_project(&test_db.pool, "Project Beta").await;

        create_test_task(&test_db.pool, &project_a, "Feature Alpha One", None).await;
        create_test_task(&test_db.pool, &project_b, "Feature Beta One", None).await;

        // Search with both project filter and type filter
        let results = SearchService::search(
            &test_db.pool,
            "Feature",
            Some(&project_a),
            Some(vec![SearchResultType::Task]),
            None,
        )
        .await
        .expect("Search should succeed");

        for result in &results {
            assert_eq!(result.result_type, SearchResultType::Task);
            assert!(
                result.title.contains("Alpha"),
                "Should only find tasks from project A"
            );
        }
    }
}
