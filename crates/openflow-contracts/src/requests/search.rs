//! Search Request Types
//!
//! Request types for full-text search operations.

use serde::{Deserialize, Serialize};
use typeshare::typeshare;

use crate::entities::search::SearchResultType;

/// Request to search across projects, tasks, chats, and messages.
///
/// @endpoint: GET /api/search
/// @command: search
#[typeshare]
#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct SearchRequest {
    /// Search query string (supports FTS5 syntax like AND, OR, NOT, phrases)
    /// @validate: required, min_length=1
    pub query: String,

    /// Optional project ID to filter results to a specific project
    /// @validate: format=uuid
    pub project_id: Option<String>,

    /// Optional list of result types to filter by (e.g., ["task", "project"])
    pub result_types: Option<Vec<SearchResultType>>,

    /// Maximum number of results to return (defaults to 20)
    /// @validate: min=1, max=100
    pub limit: Option<i32>,
}

impl SearchRequest {
    /// Create a new search request with just a query.
    pub fn new(query: impl Into<String>) -> Self {
        Self {
            query: query.into(),
            project_id: None,
            result_types: None,
            limit: None,
        }
    }

    /// Filter results to a specific project.
    pub fn in_project(mut self, project_id: impl Into<String>) -> Self {
        self.project_id = Some(project_id.into());
        self
    }

    /// Filter results to specific types.
    pub fn with_types(mut self, types: Vec<SearchResultType>) -> Self {
        self.result_types = Some(types);
        self
    }

    /// Filter to only tasks.
    pub fn tasks_only(mut self) -> Self {
        self.result_types = Some(vec![SearchResultType::Task]);
        self
    }

    /// Filter to only projects.
    pub fn projects_only(mut self) -> Self {
        self.result_types = Some(vec![SearchResultType::Project]);
        self
    }

    /// Filter to only chats.
    pub fn chats_only(mut self) -> Self {
        self.result_types = Some(vec![SearchResultType::Chat]);
        self
    }

    /// Filter to only messages.
    pub fn messages_only(mut self) -> Self {
        self.result_types = Some(vec![SearchResultType::Message]);
        self
    }

    /// Limit the number of results.
    pub fn with_limit(mut self, limit: i32) -> Self {
        self.limit = Some(limit);
        self
    }

    /// Check if this request has any type filters.
    pub fn has_type_filter(&self) -> bool {
        self.result_types.as_ref().is_some_and(|t| !t.is_empty())
    }

    /// Get the effective limit (defaults to 20).
    pub fn effective_limit(&self) -> i32 {
        self.limit.unwrap_or(20)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_search_request_new() {
        let request = SearchRequest::new("hello world");
        assert_eq!(request.query, "hello world");
        assert!(request.project_id.is_none());
        assert!(request.result_types.is_none());
        assert!(request.limit.is_none());
    }

    #[test]
    fn test_search_request_builder() {
        let request = SearchRequest::new("test query")
            .in_project("proj-123")
            .with_types(vec![SearchResultType::Task, SearchResultType::Project])
            .with_limit(50);

        assert_eq!(request.query, "test query");
        assert_eq!(request.project_id, Some("proj-123".to_string()));
        assert_eq!(request.result_types.as_ref().unwrap().len(), 2);
        assert_eq!(request.limit, Some(50));
    }

    #[test]
    fn test_search_request_tasks_only() {
        let request = SearchRequest::new("test").tasks_only();
        assert_eq!(
            request.result_types,
            Some(vec![SearchResultType::Task])
        );
    }

    #[test]
    fn test_search_request_projects_only() {
        let request = SearchRequest::new("test").projects_only();
        assert_eq!(
            request.result_types,
            Some(vec![SearchResultType::Project])
        );
    }

    #[test]
    fn test_search_request_has_type_filter() {
        let request = SearchRequest::new("test");
        assert!(!request.has_type_filter());

        let request = SearchRequest::new("test").with_types(vec![]);
        assert!(!request.has_type_filter());

        let request = SearchRequest::new("test").tasks_only();
        assert!(request.has_type_filter());
    }

    #[test]
    fn test_search_request_effective_limit() {
        let request = SearchRequest::new("test");
        assert_eq!(request.effective_limit(), 20);

        let request = SearchRequest::new("test").with_limit(100);
        assert_eq!(request.effective_limit(), 100);
    }

    #[test]
    fn test_search_request_serialization() {
        let request = SearchRequest::new("test query")
            .in_project("proj-1")
            .tasks_only()
            .with_limit(10);

        let json = serde_json::to_string(&request).unwrap();
        assert!(json.contains("\"query\":\"test query\""));
        assert!(json.contains("\"projectId\":\"proj-1\""));
        assert!(json.contains("\"resultTypes\":[\"task\"]"));
        assert!(json.contains("\"limit\":10"));

        let parsed: SearchRequest = serde_json::from_str(&json).unwrap();
        assert_eq!(parsed.query, request.query);
        assert_eq!(parsed.project_id, request.project_id);
    }

    #[test]
    fn test_search_request_default() {
        let request = SearchRequest::default();
        assert_eq!(request.query, "");
        assert!(request.project_id.is_none());
        assert!(request.result_types.is_none());
        assert!(request.limit.is_none());
    }
}
