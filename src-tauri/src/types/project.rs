use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use typeshare::typeshare;

/// Project represents a local git repository that OpenFlow manages.
/// It contains configuration for scripts, rules, and workflows.
#[typeshare]
#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
#[serde(rename_all = "camelCase")]
pub struct Project {
    pub id: String,
    pub name: String,
    pub git_repo_path: String,
    pub base_branch: String,
    pub setup_script: String,
    pub dev_script: String,
    pub cleanup_script: Option<String>,
    /// JSON array of file paths to copy
    pub copy_files: Option<String>,
    pub icon: String,
    /// JSON array of folder paths containing rules
    pub rule_folders: Option<String>,
    /// JSON array of rule file paths that are always included
    pub always_included_rules: Option<String>,
    pub workflows_folder: String,
    /// JSON object with verification command configuration
    pub verification_config: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}

/// Request to create a new project.
#[typeshare]
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateProjectRequest {
    pub name: String,
    pub git_repo_path: String,
    pub base_branch: Option<String>,
    pub setup_script: Option<String>,
    pub dev_script: Option<String>,
    pub cleanup_script: Option<String>,
    pub copy_files: Option<String>,
    pub icon: Option<String>,
    pub rule_folders: Option<String>,
    pub always_included_rules: Option<String>,
    pub workflows_folder: Option<String>,
    pub verification_config: Option<String>,
}

/// Request to update an existing project.
/// All fields are optional - only provided fields will be updated.
#[typeshare]
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateProjectRequest {
    pub name: Option<String>,
    pub git_repo_path: Option<String>,
    pub base_branch: Option<String>,
    pub setup_script: Option<String>,
    pub dev_script: Option<String>,
    pub cleanup_script: Option<String>,
    pub copy_files: Option<String>,
    pub icon: Option<String>,
    pub rule_folders: Option<String>,
    pub always_included_rules: Option<String>,
    pub workflows_folder: Option<String>,
    pub verification_config: Option<String>,
}
