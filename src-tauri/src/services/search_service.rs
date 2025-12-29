//! Full-text search service.
//!
//! Handles search operations using SQLite FTS5.

use sqlx::SqlitePool;

use crate::types::{SearchResult, SearchResultType};

#[allow(unused_imports)]
use super::{ServiceError, ServiceResult};

/// Service for search operations.
pub struct SearchService;

impl SearchService {
    /// Search across projects and tasks.
    ///
    /// # Arguments
    /// * `pool` - Database connection pool
    /// * `query` - Search query string
    /// * `project_id` - Optional project ID to filter results
    /// * `result_types` - Optional filter for result types
    /// * `limit` - Maximum number of results (default 20)
    pub async fn search(
        _pool: &SqlitePool,
        _query: &str,
        _project_id: Option<&str>,
        _result_types: Option<Vec<SearchResultType>>,
        _limit: Option<usize>,
    ) -> ServiceResult<Vec<SearchResult>> {
        // TODO: Implement in next step
        todo!()
    }
}
