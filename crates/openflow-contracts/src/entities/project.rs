//! Project Entity
//!
//! Projects represent git repositories configured for AI-assisted development.
//! Each project links to a local git repository and contains configuration for:
//! - Setup/cleanup scripts for worktree initialization
//! - Development scripts
//! - Rule folders for AI context
//! - Workflow templates
//! - Verification commands

use serde::{Deserialize, Serialize};
use typeshare::typeshare;

use crate::validation::{
    validate_required_string, validate_string_length, Validate, ValidationCollector,
    ValidationResult,
};

// =============================================================================
// Project Entity
// =============================================================================

/// A project linked to a git repository
///
/// Projects are the root entity in the OpenFlow domain model. They represent
/// a local git repository that OpenFlow manages for AI-assisted development.
///
/// # Database
/// @entity
/// @table: projects
///
/// # Example
/// ```json
/// {
///   "id": "550e8400-e29b-41d4-a716-446655440000",
///   "name": "My Project",
///   "gitRepoPath": "/home/user/projects/my-project",
///   "baseBranch": "main",
///   "setupScript": "npm install",
///   "devScript": "npm run dev",
///   "cleanupScript": null,
///   "copyFiles": null,
///   "icon": "folder",
///   "ruleFolders": "[\".cursor/rules\"]",
///   "alwaysIncludedRules": null,
///   "workflowsFolder": ".openflow/workflows",
///   "verificationConfig": null,
///   "archivedAt": null,
///   "createdAt": "2024-01-15T10:30:00Z",
///   "updatedAt": "2024-01-15T10:30:00Z"
/// }
/// ```
#[typeshare]
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct Project {
    /// Unique identifier (UUID v4)
    /// @validate: format=uuid
    pub id: String,

    /// Human-readable project name
    /// @validate: required, min_length=1, max_length=255
    pub name: String,

    /// Absolute path to the git repository
    /// @validate: required, format=path
    pub git_repo_path: String,

    /// Base branch for the repository (e.g., "main", "master")
    /// @validate: required, min_length=1, max_length=255
    pub base_branch: String,

    /// Script to run when setting up a new worktree
    /// @validate: max_length=10000
    pub setup_script: String,

    /// Script to run for development server/watcher
    /// @validate: max_length=10000
    pub dev_script: String,

    /// Optional script to run when cleaning up a worktree
    /// @validate: max_length=10000
    pub cleanup_script: Option<String>,

    /// JSON array of file paths to copy when creating worktrees
    /// @validate: max_length=10000
    pub copy_files: Option<String>,

    /// Icon identifier for the project
    /// @validate: max_length=100
    pub icon: String,

    /// JSON array of folder paths containing rule files
    /// @validate: max_length=10000
    pub rule_folders: Option<String>,

    /// JSON array of rule file paths that are always included
    /// @validate: max_length=10000
    pub always_included_rules: Option<String>,

    /// Path to the folder containing workflow templates
    /// @validate: max_length=1000
    pub workflows_folder: String,

    /// JSON object with verification command configuration
    /// @validate: max_length=50000
    pub verification_config: Option<String>,

    /// Timestamp when the project was archived (soft-delete)
    /// null means the project is active
    pub archived_at: Option<String>,

    /// When the project was created (ISO 8601)
    pub created_at: String,

    /// When the project was last updated (ISO 8601)
    pub updated_at: String,
}

impl Project {
    /// Check if the project is archived
    pub fn is_archived(&self) -> bool {
        self.archived_at.is_some()
    }

    /// Parse copy_files JSON into a Vec of paths
    pub fn get_copy_files(&self) -> Vec<String> {
        self.copy_files
            .as_ref()
            .and_then(|json| serde_json::from_str(json).ok())
            .unwrap_or_default()
    }

    /// Parse rule_folders JSON into a Vec of paths
    pub fn get_rule_folders(&self) -> Vec<String> {
        self.rule_folders
            .as_ref()
            .and_then(|json| serde_json::from_str(json).ok())
            .unwrap_or_default()
    }

    /// Parse always_included_rules JSON into a Vec of paths
    pub fn get_always_included_rules(&self) -> Vec<String> {
        self.always_included_rules
            .as_ref()
            .and_then(|json| serde_json::from_str(json).ok())
            .unwrap_or_default()
    }
}

// =============================================================================
// Project Summary (for list views)
// =============================================================================

/// A lightweight project summary for list views
///
/// Contains only essential fields for displaying in project lists,
/// reducing data transfer and rendering overhead.
///
/// @derived_from: Project
#[typeshare]
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct ProjectSummary {
    /// Unique identifier (UUID v4)
    pub id: String,

    /// Human-readable project name
    pub name: String,

    /// Absolute path to the git repository
    pub git_repo_path: String,

    /// Icon identifier for the project
    pub icon: String,

    /// Whether the project is archived
    pub is_archived: bool,

    /// When the project was last updated (ISO 8601)
    pub updated_at: String,
}

impl From<Project> for ProjectSummary {
    fn from(project: Project) -> Self {
        let is_archived = project.is_archived();
        Self {
            id: project.id,
            name: project.name,
            git_repo_path: project.git_repo_path,
            icon: project.icon,
            is_archived,
            updated_at: project.updated_at,
        }
    }
}

impl From<&Project> for ProjectSummary {
    fn from(project: &Project) -> Self {
        Self {
            id: project.id.clone(),
            name: project.name.clone(),
            git_repo_path: project.git_repo_path.clone(),
            icon: project.icon.clone(),
            is_archived: project.is_archived(),
            updated_at: project.updated_at.clone(),
        }
    }
}

// =============================================================================
// Project with Statistics
// =============================================================================

/// Project with computed task statistics
///
/// Extends the base Project with aggregated task counts,
/// useful for dashboard views.
///
/// @derived_from: Project
#[typeshare]
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct ProjectWithStats {
    /// The project data
    #[serde(flatten)]
    pub project: Project,

    /// Number of active (non-archived) tasks
    pub active_task_count: i32,

    /// Total number of tasks including archived
    pub total_task_count: i32,

    /// Number of tasks in progress
    pub in_progress_task_count: i32,

    /// Number of completed tasks
    pub completed_task_count: i32,
}

impl ProjectWithStats {
    /// Create a new ProjectWithStats with zero counts
    pub fn new(project: Project) -> Self {
        Self {
            project,
            active_task_count: 0,
            total_task_count: 0,
            in_progress_task_count: 0,
            completed_task_count: 0,
        }
    }
}

// =============================================================================
// Validation Implementation
// =============================================================================

impl Validate for Project {
    fn validate(&self) -> ValidationResult<()> {
        ValidationCollector::new()
            .validate(|| validate_required_string("name", &self.name))
            .validate(|| validate_string_length("name", &self.name, Some(1), Some(255)))
            .validate(|| validate_required_string("git_repo_path", &self.git_repo_path))
            .validate(|| validate_required_string("base_branch", &self.base_branch))
            .validate(|| validate_string_length("base_branch", &self.base_branch, Some(1), Some(255)))
            .validate(|| validate_string_length("setup_script", &self.setup_script, None, Some(10000)))
            .validate(|| validate_string_length("dev_script", &self.dev_script, None, Some(10000)))
            .validate(|| {
                if let Some(ref script) = self.cleanup_script {
                    validate_string_length("cleanup_script", script, None, Some(10000))
                } else {
                    Ok(())
                }
            })
            .validate(|| validate_string_length("icon", &self.icon, None, Some(100)))
            .validate(|| validate_string_length("workflows_folder", &self.workflows_folder, None, Some(1000)))
            .finish()
    }
}

// =============================================================================
// Tests
// =============================================================================

#[cfg(test)]
mod tests {
    use super::*;

    fn create_test_project() -> Project {
        Project {
            id: "550e8400-e29b-41d4-a716-446655440000".to_string(),
            name: "Test Project".to_string(),
            git_repo_path: "/home/user/projects/test".to_string(),
            base_branch: "main".to_string(),
            setup_script: "npm install".to_string(),
            dev_script: "npm run dev".to_string(),
            cleanup_script: None,
            copy_files: Some(r#"[".env.local"]"#.to_string()),
            icon: "folder".to_string(),
            rule_folders: Some(r#"[".cursor/rules"]"#.to_string()),
            always_included_rules: None,
            workflows_folder: ".openflow/workflows".to_string(),
            verification_config: None,
            archived_at: None,
            created_at: "2024-01-15T10:30:00Z".to_string(),
            updated_at: "2024-01-15T10:30:00Z".to_string(),
        }
    }

    #[test]
    fn test_project_is_archived() {
        let mut project = create_test_project();
        assert!(!project.is_archived());

        project.archived_at = Some("2024-01-20T10:30:00Z".to_string());
        assert!(project.is_archived());
    }

    #[test]
    fn test_project_get_copy_files() {
        let project = create_test_project();
        let files = project.get_copy_files();
        assert_eq!(files, vec![".env.local"]);

        // Test with invalid JSON
        let mut project_invalid = create_test_project();
        project_invalid.copy_files = Some("not json".to_string());
        assert!(project_invalid.get_copy_files().is_empty());

        // Test with None
        let mut project_none = create_test_project();
        project_none.copy_files = None;
        assert!(project_none.get_copy_files().is_empty());
    }

    #[test]
    fn test_project_get_rule_folders() {
        let project = create_test_project();
        let folders = project.get_rule_folders();
        assert_eq!(folders, vec![".cursor/rules"]);
    }

    #[test]
    fn test_project_summary_from_project() {
        let project = create_test_project();
        let summary: ProjectSummary = project.clone().into();

        assert_eq!(summary.id, project.id);
        assert_eq!(summary.name, project.name);
        assert_eq!(summary.git_repo_path, project.git_repo_path);
        assert_eq!(summary.icon, project.icon);
        assert!(!summary.is_archived);
    }

    #[test]
    fn test_project_with_stats_new() {
        let project = create_test_project();
        let with_stats = ProjectWithStats::new(project.clone());

        assert_eq!(with_stats.project.id, project.id);
        assert_eq!(with_stats.active_task_count, 0);
        assert_eq!(with_stats.total_task_count, 0);
        assert_eq!(with_stats.in_progress_task_count, 0);
        assert_eq!(with_stats.completed_task_count, 0);
    }

    #[test]
    fn test_project_validation_valid() {
        let project = create_test_project();
        assert!(project.validate().is_ok());
    }

    #[test]
    fn test_project_validation_empty_name() {
        let mut project = create_test_project();
        project.name = "".to_string();
        assert!(project.validate().is_err());
    }

    #[test]
    fn test_project_validation_name_too_long() {
        let mut project = create_test_project();
        project.name = "a".repeat(256);
        assert!(project.validate().is_err());
    }

    #[test]
    fn test_project_validation_empty_git_repo_path() {
        let mut project = create_test_project();
        project.git_repo_path = "".to_string();
        assert!(project.validate().is_err());
    }

    #[test]
    fn test_project_serialization() {
        let project = create_test_project();
        let json = serde_json::to_string(&project).unwrap();

        // Verify camelCase serialization
        assert!(json.contains("\"gitRepoPath\""));
        assert!(json.contains("\"baseBranch\""));
        assert!(json.contains("\"setupScript\""));
        assert!(json.contains("\"devScript\""));
        assert!(json.contains("\"createdAt\""));
        assert!(json.contains("\"updatedAt\""));

        // Verify round-trip
        let deserialized: Project = serde_json::from_str(&json).unwrap();
        assert_eq!(project, deserialized);
    }
}
