//! Search Entity Types
//!
//! Types for full-text search results across projects, tasks, chats, and messages.

use serde::{Deserialize, Serialize};
use typeshare::typeshare;

/// Types of search results that can be returned.
///
/// @entity
#[typeshare]
#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq, Hash)]
#[serde(rename_all = "lowercase")]
pub enum SearchResultType {
    /// A task result
    Task,
    /// A project result
    Project,
    /// A chat result
    Chat,
    /// A message result
    Message,
}

impl SearchResultType {
    /// Convert to database string representation.
    pub fn as_str(&self) -> &'static str {
        match self {
            SearchResultType::Task => "task",
            SearchResultType::Project => "project",
            SearchResultType::Chat => "chat",
            SearchResultType::Message => "message",
        }
    }

    /// Parse from database string representation.
    pub fn parse(s: &str) -> Option<Self> {
        match s {
            "task" => Some(SearchResultType::Task),
            "project" => Some(SearchResultType::Project),
            "chat" => Some(SearchResultType::Chat),
            "message" => Some(SearchResultType::Message),
            _ => None,
        }
    }

    /// Get the icon name for this result type.
    pub fn icon(&self) -> &'static str {
        match self {
            SearchResultType::Task => "check-square",
            SearchResultType::Project => "folder",
            SearchResultType::Chat => "message-square",
            SearchResultType::Message => "file-text",
        }
    }
}

impl std::fmt::Display for SearchResultType {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "{}", self.as_str())
    }
}

impl std::str::FromStr for SearchResultType {
    type Err = String;

    fn from_str(s: &str) -> Result<Self, Self::Err> {
        SearchResultType::parse(s).ok_or_else(|| format!("Unknown search result type: {}", s))
    }
}

/// Represents a search result from the full-text search.
///
/// @entity
#[typeshare]
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SearchResult {
    /// Unique identifier of the matched item
    pub id: String,

    /// Type of the result (task, project, chat, message)
    pub result_type: SearchResultType,

    /// Title or primary text of the result
    pub title: String,

    /// Subtitle or secondary text (e.g., project name for tasks)
    pub subtitle: Option<String>,

    /// Icon name to display
    pub icon: Option<String>,

    /// Relevance score from FTS5 (higher is more relevant)
    /// BM25 returns negative values where more negative = more relevant,
    /// but this is converted to positive where higher = more relevant.
    pub score: f64,
}

impl SearchResult {
    /// Create a new search result.
    pub fn new(
        id: String,
        result_type: SearchResultType,
        title: String,
        subtitle: Option<String>,
        score: f64,
    ) -> Self {
        let icon = Some(result_type.icon().to_string());
        Self {
            id,
            result_type,
            title,
            subtitle,
            icon,
            score,
        }
    }

    /// Create a task search result.
    pub fn task(id: String, title: String, subtitle: Option<String>, score: f64) -> Self {
        Self::new(id, SearchResultType::Task, title, subtitle, score)
    }

    /// Create a project search result.
    pub fn project(id: String, title: String, subtitle: Option<String>, score: f64) -> Self {
        Self::new(id, SearchResultType::Project, title, subtitle, score)
    }

    /// Create a chat search result.
    pub fn chat(id: String, title: String, subtitle: Option<String>, score: f64) -> Self {
        Self::new(id, SearchResultType::Chat, title, subtitle, score)
    }

    /// Create a message search result.
    pub fn message(id: String, title: String, subtitle: Option<String>, score: f64) -> Self {
        Self::new(id, SearchResultType::Message, title, subtitle, score)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_search_result_type_as_str() {
        assert_eq!(SearchResultType::Task.as_str(), "task");
        assert_eq!(SearchResultType::Project.as_str(), "project");
        assert_eq!(SearchResultType::Chat.as_str(), "chat");
        assert_eq!(SearchResultType::Message.as_str(), "message");
    }

    #[test]
    fn test_search_result_type_from_str() {
        assert_eq!(
            SearchResultType::parse("task"),
            Some(SearchResultType::Task)
        );
        assert_eq!(
            SearchResultType::parse("project"),
            Some(SearchResultType::Project)
        );
        assert_eq!(
            SearchResultType::parse("chat"),
            Some(SearchResultType::Chat)
        );
        assert_eq!(
            SearchResultType::parse("message"),
            Some(SearchResultType::Message)
        );
        assert_eq!(SearchResultType::parse("unknown"), None);
    }

    #[test]
    fn test_search_result_type_icon() {
        assert_eq!(SearchResultType::Task.icon(), "check-square");
        assert_eq!(SearchResultType::Project.icon(), "folder");
        assert_eq!(SearchResultType::Chat.icon(), "message-square");
        assert_eq!(SearchResultType::Message.icon(), "file-text");
    }

    #[test]
    fn test_search_result_type_display() {
        assert_eq!(format!("{}", SearchResultType::Task), "task");
        assert_eq!(format!("{}", SearchResultType::Project), "project");
    }

    #[test]
    fn test_search_result_type_parse() {
        assert_eq!(
            "task".parse::<SearchResultType>().unwrap(),
            SearchResultType::Task
        );
        assert_eq!(
            "project".parse::<SearchResultType>().unwrap(),
            SearchResultType::Project
        );
        assert!("unknown".parse::<SearchResultType>().is_err());
    }

    #[test]
    fn test_search_result_new() {
        let result = SearchResult::new(
            "id123".to_string(),
            SearchResultType::Task,
            "Test Task".to_string(),
            Some("Test Project".to_string()),
            0.75,
        );

        assert_eq!(result.id, "id123");
        assert_eq!(result.result_type, SearchResultType::Task);
        assert_eq!(result.title, "Test Task");
        assert_eq!(result.subtitle, Some("Test Project".to_string()));
        assert_eq!(result.icon, Some("check-square".to_string()));
        assert_eq!(result.score, 0.75);
    }

    #[test]
    fn test_search_result_task() {
        let result = SearchResult::task("task-1".to_string(), "My Task".to_string(), None, 1.0);

        assert_eq!(result.result_type, SearchResultType::Task);
        assert_eq!(result.icon, Some("check-square".to_string()));
    }

    #[test]
    fn test_search_result_project() {
        let result = SearchResult::project(
            "proj-1".to_string(),
            "My Project".to_string(),
            Some("Description".to_string()),
            0.9,
        );

        assert_eq!(result.result_type, SearchResultType::Project);
        assert_eq!(result.icon, Some("folder".to_string()));
    }

    #[test]
    fn test_search_result_serialization() {
        let result = SearchResult::chat(
            "chat-1".to_string(),
            "Development Chat".to_string(),
            None,
            0.5,
        );

        let json = serde_json::to_string(&result).unwrap();
        assert!(json.contains("\"resultType\":\"chat\""));
        assert!(json.contains("\"title\":\"Development Chat\""));

        let parsed: SearchResult = serde_json::from_str(&json).unwrap();
        assert_eq!(parsed.id, result.id);
        assert_eq!(parsed.result_type, result.result_type);
    }
}
