//! Project Request Types
//!
//! Request types for project CRUD operations. These define the shape of
//! data sent from frontend to backend for project mutations.

use serde::{Deserialize, Serialize};
use typeshare::typeshare;

use crate::validation::{
    validate_required_string, validate_string_length, Validate, ValidationCollector,
    ValidationResult,
};

// =============================================================================
// Create Project Request
// =============================================================================

/// Request to create a new project
///
/// # Endpoint
/// @endpoint: POST /api/projects
/// @command: create_project
///
/// # Example
/// ```json
/// {
///   "name": "My New Project",
///   "gitRepoPath": "/home/user/projects/my-project",
///   "baseBranch": "main",
///   "setupScript": "npm install",
///   "devScript": "npm run dev"
/// }
/// ```
#[typeshare]
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct CreateProjectRequest {
    /// Project name (required, 1-255 chars)
    /// @validate: required, min_length=1, max_length=255
    pub name: String,

    /// Path to git repository (required)
    /// @validate: required, format=path
    pub git_repo_path: String,

    /// Base branch for the repository (defaults to "main" if not provided)
    /// @validate: max_length=255
    pub base_branch: Option<String>,

    /// Setup script to run when creating worktrees
    /// @validate: max_length=10000
    pub setup_script: Option<String>,

    /// Development script to run for dev server/watcher
    /// @validate: max_length=10000
    pub dev_script: Option<String>,

    /// Cleanup script to run when deleting worktrees
    /// @validate: max_length=10000
    pub cleanup_script: Option<String>,

    /// JSON array of file paths to copy when creating worktrees
    /// @validate: max_length=10000
    pub copy_files: Option<String>,

    /// Icon identifier for the project
    /// @validate: max_length=100
    pub icon: Option<String>,

    /// JSON array of folder paths containing rule files
    /// @validate: max_length=10000
    pub rule_folders: Option<String>,

    /// JSON array of rule file paths that are always included
    /// @validate: max_length=10000
    pub always_included_rules: Option<String>,

    /// Path to the folder containing workflow templates
    /// @validate: max_length=1000
    pub workflows_folder: Option<String>,

    /// JSON object with verification command configuration
    /// @validate: max_length=50000
    pub verification_config: Option<String>,
}

impl Default for CreateProjectRequest {
    fn default() -> Self {
        Self {
            name: String::new(),
            git_repo_path: String::new(),
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
        }
    }
}

impl Validate for CreateProjectRequest {
    fn validate(&self) -> ValidationResult<()> {
        ValidationCollector::new()
            .validate(|| validate_required_string("name", &self.name))
            .validate(|| validate_string_length("name", &self.name, Some(1), Some(255)))
            .validate(|| validate_required_string("git_repo_path", &self.git_repo_path))
            .validate(|| {
                if let Some(ref branch) = self.base_branch {
                    validate_string_length("base_branch", branch, Some(1), Some(255))
                } else {
                    Ok(())
                }
            })
            .validate(|| {
                if let Some(ref script) = self.setup_script {
                    validate_string_length("setup_script", script, None, Some(10000))
                } else {
                    Ok(())
                }
            })
            .validate(|| {
                if let Some(ref script) = self.dev_script {
                    validate_string_length("dev_script", script, None, Some(10000))
                } else {
                    Ok(())
                }
            })
            .validate(|| {
                if let Some(ref script) = self.cleanup_script {
                    validate_string_length("cleanup_script", script, None, Some(10000))
                } else {
                    Ok(())
                }
            })
            .validate(|| {
                if let Some(ref icon) = self.icon {
                    validate_string_length("icon", icon, None, Some(100))
                } else {
                    Ok(())
                }
            })
            .validate(|| {
                if let Some(ref folder) = self.workflows_folder {
                    validate_string_length("workflows_folder", folder, None, Some(1000))
                } else {
                    Ok(())
                }
            })
            .finish()
    }
}

// =============================================================================
// Update Project Request
// =============================================================================

/// Request to update an existing project
///
/// All fields are optional - only provided fields will be updated.
/// Fields set to `null` in JSON will be unchanged; to clear a field,
/// use an empty string or empty array as appropriate.
///
/// # Endpoint
/// @endpoint: PATCH /api/projects/:id
/// @command: update_project
///
/// # Example
/// ```json
/// {
///   "name": "Updated Project Name",
///   "setupScript": "pnpm install"
/// }
/// ```
#[typeshare]
#[derive(Debug, Clone, Default, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct UpdateProjectRequest {
    /// Updated project name
    /// @validate: min_length=1, max_length=255
    pub name: Option<String>,

    /// Updated git repository path
    /// @validate: format=path
    pub git_repo_path: Option<String>,

    /// Updated base branch
    /// @validate: max_length=255
    pub base_branch: Option<String>,

    /// Updated setup script
    /// @validate: max_length=10000
    pub setup_script: Option<String>,

    /// Updated development script
    /// @validate: max_length=10000
    pub dev_script: Option<String>,

    /// Updated cleanup script
    /// @validate: max_length=10000
    pub cleanup_script: Option<String>,

    /// Updated copy files JSON array
    /// @validate: max_length=10000
    pub copy_files: Option<String>,

    /// Updated icon identifier
    /// @validate: max_length=100
    pub icon: Option<String>,

    /// Updated rule folders JSON array
    /// @validate: max_length=10000
    pub rule_folders: Option<String>,

    /// Updated always included rules JSON array
    /// @validate: max_length=10000
    pub always_included_rules: Option<String>,

    /// Updated workflows folder path
    /// @validate: max_length=1000
    pub workflows_folder: Option<String>,

    /// Updated verification config JSON object
    /// @validate: max_length=50000
    pub verification_config: Option<String>,
}

impl UpdateProjectRequest {
    /// Check if any field is set for update
    pub fn has_updates(&self) -> bool {
        self.name.is_some()
            || self.git_repo_path.is_some()
            || self.base_branch.is_some()
            || self.setup_script.is_some()
            || self.dev_script.is_some()
            || self.cleanup_script.is_some()
            || self.copy_files.is_some()
            || self.icon.is_some()
            || self.rule_folders.is_some()
            || self.always_included_rules.is_some()
            || self.workflows_folder.is_some()
            || self.verification_config.is_some()
    }
}

impl Validate for UpdateProjectRequest {
    fn validate(&self) -> ValidationResult<()> {
        ValidationCollector::new()
            .validate(|| {
                if let Some(ref name) = self.name {
                    validate_required_string("name", name)?;
                    validate_string_length("name", name, Some(1), Some(255))
                } else {
                    Ok(())
                }
            })
            .validate(|| {
                if let Some(ref path) = self.git_repo_path {
                    validate_required_string("git_repo_path", path)
                } else {
                    Ok(())
                }
            })
            .validate(|| {
                if let Some(ref branch) = self.base_branch {
                    validate_string_length("base_branch", branch, Some(1), Some(255))
                } else {
                    Ok(())
                }
            })
            .validate(|| {
                if let Some(ref script) = self.setup_script {
                    validate_string_length("setup_script", script, None, Some(10000))
                } else {
                    Ok(())
                }
            })
            .validate(|| {
                if let Some(ref script) = self.dev_script {
                    validate_string_length("dev_script", script, None, Some(10000))
                } else {
                    Ok(())
                }
            })
            .validate(|| {
                if let Some(ref script) = self.cleanup_script {
                    validate_string_length("cleanup_script", script, None, Some(10000))
                } else {
                    Ok(())
                }
            })
            .validate(|| {
                if let Some(ref icon) = self.icon {
                    validate_string_length("icon", icon, None, Some(100))
                } else {
                    Ok(())
                }
            })
            .validate(|| {
                if let Some(ref folder) = self.workflows_folder {
                    validate_string_length("workflows_folder", folder, None, Some(1000))
                } else {
                    Ok(())
                }
            })
            .finish()
    }
}

// =============================================================================
// Tests
// =============================================================================

#[cfg(test)]
mod tests {
    use super::*;

    // =========================================================================
    // CreateProjectRequest Tests
    // =========================================================================

    #[test]
    fn test_create_project_request_valid() {
        let request = CreateProjectRequest {
            name: "My Project".to_string(),
            git_repo_path: "/home/user/projects/test".to_string(),
            base_branch: Some("main".to_string()),
            setup_script: Some("npm install".to_string()),
            dev_script: Some("npm run dev".to_string()),
            ..Default::default()
        };

        assert!(request.validate().is_ok());
    }

    #[test]
    fn test_create_project_request_minimal() {
        let request = CreateProjectRequest {
            name: "My Project".to_string(),
            git_repo_path: "/home/user/projects/test".to_string(),
            ..Default::default()
        };

        assert!(request.validate().is_ok());
    }

    #[test]
    fn test_create_project_request_empty_name() {
        let request = CreateProjectRequest {
            name: "".to_string(),
            git_repo_path: "/home/user/projects/test".to_string(),
            ..Default::default()
        };

        assert!(request.validate().is_err());
    }

    #[test]
    fn test_create_project_request_empty_path() {
        let request = CreateProjectRequest {
            name: "My Project".to_string(),
            git_repo_path: "".to_string(),
            ..Default::default()
        };

        assert!(request.validate().is_err());
    }

    #[test]
    fn test_create_project_request_name_too_long() {
        let request = CreateProjectRequest {
            name: "a".repeat(256),
            git_repo_path: "/home/user/projects/test".to_string(),
            ..Default::default()
        };

        assert!(request.validate().is_err());
    }

    #[test]
    fn test_create_project_request_serialization() {
        let request = CreateProjectRequest {
            name: "My Project".to_string(),
            git_repo_path: "/home/user/projects/test".to_string(),
            base_branch: Some("main".to_string()),
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

        let json = serde_json::to_string(&request).unwrap();
        assert!(json.contains("\"name\":\"My Project\""));
        assert!(json.contains("\"gitRepoPath\":\"/home/user/projects/test\""));
        assert!(json.contains("\"baseBranch\":\"main\""));

        // Round-trip
        let deserialized: CreateProjectRequest = serde_json::from_str(&json).unwrap();
        assert_eq!(request, deserialized);
    }

    // =========================================================================
    // UpdateProjectRequest Tests
    // =========================================================================

    #[test]
    fn test_update_project_request_valid() {
        let request = UpdateProjectRequest {
            name: Some("Updated Name".to_string()),
            setup_script: Some("pnpm install".to_string()),
            ..Default::default()
        };

        assert!(request.validate().is_ok());
        assert!(request.has_updates());
    }

    #[test]
    fn test_update_project_request_empty() {
        let request = UpdateProjectRequest::default();

        assert!(request.validate().is_ok());
        assert!(!request.has_updates());
    }

    #[test]
    fn test_update_project_request_empty_name_not_allowed() {
        let request = UpdateProjectRequest {
            name: Some("".to_string()),
            ..Default::default()
        };

        assert!(request.validate().is_err());
    }

    #[test]
    fn test_update_project_request_name_too_long() {
        let request = UpdateProjectRequest {
            name: Some("a".repeat(256)),
            ..Default::default()
        };

        assert!(request.validate().is_err());
    }

    #[test]
    fn test_update_project_request_has_updates() {
        // Test each field individually
        assert!(UpdateProjectRequest {
            name: Some("Test".to_string()),
            ..Default::default()
        }
        .has_updates());

        assert!(UpdateProjectRequest {
            git_repo_path: Some("/path".to_string()),
            ..Default::default()
        }
        .has_updates());

        assert!(UpdateProjectRequest {
            setup_script: Some("script".to_string()),
            ..Default::default()
        }
        .has_updates());

        assert!(UpdateProjectRequest {
            icon: Some("icon".to_string()),
            ..Default::default()
        }
        .has_updates());
    }

    #[test]
    fn test_update_project_request_serialization() {
        let request = UpdateProjectRequest {
            name: Some("Updated Name".to_string()),
            setup_script: Some("pnpm install".to_string()),
            ..Default::default()
        };

        let json = serde_json::to_string(&request).unwrap();

        // Verify camelCase and null handling
        assert!(json.contains("\"name\":\"Updated Name\""));
        assert!(json.contains("\"setupScript\":\"pnpm install\""));

        // Round-trip
        let deserialized: UpdateProjectRequest = serde_json::from_str(&json).unwrap();
        assert_eq!(request, deserialized);
    }

    #[test]
    fn test_update_project_request_partial_deserialization() {
        // Test that we can deserialize a JSON with only some fields
        let json = r#"{"name": "New Name"}"#;
        let request: UpdateProjectRequest = serde_json::from_str(json).unwrap();

        assert_eq!(request.name, Some("New Name".to_string()));
        assert!(request.git_repo_path.is_none());
        assert!(request.setup_script.is_none());
    }
}
