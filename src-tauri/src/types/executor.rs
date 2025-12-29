use serde::{Deserialize, Serialize};
use typeshare::typeshare;

/// ExecutorProfile represents a CLI tool configuration for running AI coding agents.
/// Profiles define which CLI tool to use (Claude Code, Gemini CLI, Codex CLI, etc.)
/// along with default arguments and environment variables.
#[typeshare]
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ExecutorProfile {
    pub id: String,
    pub name: String,
    /// CLI command to execute (e.g., "claude", "gemini", "codex", "cursor")
    pub command: String,
    /// JSON array of default arguments passed to the CLI
    pub args: Option<String>,
    /// JSON object of environment variables to set
    pub env: Option<String>,
    /// Description of this profile's purpose
    pub description: Option<String>,
    /// Whether this is the default profile for new tasks
    pub is_default: bool,
    pub created_at: String,
    pub updated_at: String,
}

/// Request to create a new executor profile.
#[typeshare]
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateExecutorProfileRequest {
    pub name: String,
    pub command: String,
    pub args: Option<String>,
    pub env: Option<String>,
    pub description: Option<String>,
    pub is_default: Option<bool>,
}

/// Request to update an existing executor profile.
/// All fields are optional - only provided fields will be updated.
#[typeshare]
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateExecutorProfileRequest {
    pub name: Option<String>,
    pub command: Option<String>,
    pub args: Option<String>,
    pub env: Option<String>,
    pub description: Option<String>,
    pub is_default: Option<bool>,
}
