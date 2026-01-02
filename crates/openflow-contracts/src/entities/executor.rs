//! Executor Profile Entity
//!
//! Executor profiles define CLI tool configurations for running AI coding agents.
//! Each profile specifies which CLI tool to use (Claude Code, Gemini CLI, Codex CLI,
//! Cursor CLI, etc.) along with default arguments and environment variables.
//!
//! # Examples
//!
//! ```rust
//! use openflow_contracts::ExecutorProfile;
//!
//! // A typical Claude Code profile
//! let profile = ExecutorProfile {
//!     id: "123".to_string(),
//!     name: "Claude Code".to_string(),
//!     description: Some("Anthropic's Claude Code CLI".to_string()),
//!     command: "claude".to_string(),
//!     args: Some(r#"["--output-format", "stream-json"]"#.to_string()),
//!     env: None,
//!     model: Some("claude-sonnet-4".to_string()),
//!     is_default: true,
//!     created_at: "2024-01-01T00:00:00Z".to_string(),
//!     updated_at: "2024-01-01T00:00:00Z".to_string(),
//! };
//! ```

use serde::{Deserialize, Serialize};
use typeshare::typeshare;

/// Executor profile representing a CLI tool configuration for AI coding agents.
///
/// Profiles store the command, arguments, environment variables, and model
/// settings needed to run different AI coding CLI tools.
///
/// # Fields
///
/// * `command` - The CLI command to execute (e.g., "claude", "gemini", "codex", "cursor")
/// * `args` - JSON array of default arguments passed to the CLI
/// * `env` - JSON object of environment variables to set when running
/// * `model` - Optional model identifier for AI APIs (e.g., "claude-sonnet-4")
/// * `is_default` - Whether this is the default profile for new tasks (only one can be default)
///
/// @entity
/// @table: executor_profiles
#[typeshare]
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, sqlx::FromRow)]
#[serde(rename_all = "camelCase")]
pub struct ExecutorProfile {
    /// Unique identifier (UUID)
    /// @validate: format=uuid
    pub id: String,

    /// Human-readable profile name
    /// @validate: required, min_length=1, max_length=255
    pub name: String,

    /// Optional description of the executor profile
    /// @validate: max_length=1000
    pub description: Option<String>,

    /// CLI command to execute (e.g., "claude", "gemini", "codex", "cursor")
    /// @validate: required, min_length=1, max_length=255
    pub command: String,

    /// JSON array of default arguments passed to the CLI
    /// @validate: max_length=10000, format=json_array
    pub args: Option<String>,

    /// JSON object of environment variables to set when running
    /// @validate: max_length=10000, format=json_object
    pub env: Option<String>,

    /// Model identifier if applicable (e.g., "claude-sonnet-4", "gemini-pro")
    /// @validate: max_length=255
    pub model: Option<String>,

    /// Whether this is the default profile for new tasks
    /// Only one profile can be default at a time
    pub is_default: bool,

    /// When the profile was created (ISO 8601 timestamp)
    pub created_at: String,

    /// When the profile was last updated (ISO 8601 timestamp)
    pub updated_at: String,
}

impl ExecutorProfile {
    /// Check if this profile has custom arguments
    pub fn has_args(&self) -> bool {
        self.args.as_ref().is_some_and(|a| !a.is_empty())
    }

    /// Check if this profile has custom environment variables
    pub fn has_env(&self) -> bool {
        self.env.as_ref().is_some_and(|e| !e.is_empty())
    }

    /// Check if this profile has a model specified
    pub fn has_model(&self) -> bool {
        self.model.as_ref().is_some_and(|m| !m.is_empty())
    }

    /// Parse the args JSON string into a Vec of strings
    /// Returns an empty Vec if args is None or invalid JSON
    pub fn parse_args(&self) -> Vec<String> {
        self.args
            .as_ref()
            .and_then(|a| serde_json::from_str(a).ok())
            .unwrap_or_default()
    }

    /// Parse the env JSON string into a map of key-value pairs
    /// Returns an empty map if env is None or invalid JSON
    pub fn parse_env(&self) -> std::collections::HashMap<String, String> {
        self.env
            .as_ref()
            .and_then(|e| serde_json::from_str(e).ok())
            .unwrap_or_default()
    }
}

/// Summary view of an executor profile for list views
///
/// Contains only the essential fields needed for selection UIs
/// and profile lists.
///
/// @derived_from: ExecutorProfile
#[typeshare]
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct ExecutorProfileSummary {
    /// Unique identifier
    pub id: String,

    /// Profile name
    pub name: String,

    /// CLI command
    pub command: String,

    /// Model identifier if set
    pub model: Option<String>,

    /// Whether this is the default profile
    pub is_default: bool,
}

impl From<ExecutorProfile> for ExecutorProfileSummary {
    fn from(profile: ExecutorProfile) -> Self {
        Self {
            id: profile.id,
            name: profile.name,
            command: profile.command,
            model: profile.model,
            is_default: profile.is_default,
        }
    }
}

impl From<&ExecutorProfile> for ExecutorProfileSummary {
    fn from(profile: &ExecutorProfile) -> Self {
        Self {
            id: profile.id.clone(),
            name: profile.name.clone(),
            command: profile.command.clone(),
            model: profile.model.clone(),
            is_default: profile.is_default,
        }
    }
}

/// Known CLI tool types for AI coding agents
///
/// These are the common CLI tools that OpenFlow supports.
/// Custom tools can use any command string in the profile.
#[typeshare]
#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum CliToolType {
    /// Anthropic's Claude Code CLI
    ClaudeCode,
    /// Google's Gemini CLI
    GeminiCli,
    /// OpenAI's Codex CLI
    CodexCli,
    /// Cursor's CLI interface
    CursorCli,
    /// Amazon Q Developer CLI
    AmazonQCli,
    /// GitHub Copilot CLI
    CopilotCli,
    /// Custom or unknown CLI tool
    Custom,
}

impl CliToolType {
    /// Get the default command for this CLI tool type
    pub fn default_command(&self) -> &'static str {
        match self {
            CliToolType::ClaudeCode => "claude",
            CliToolType::GeminiCli => "gemini",
            CliToolType::CodexCli => "codex",
            CliToolType::CursorCli => "cursor",
            CliToolType::AmazonQCli => "q",
            CliToolType::CopilotCli => "gh copilot",
            CliToolType::Custom => "",
        }
    }

    /// Determine the CLI tool type from a command string
    pub fn from_command(command: &str) -> Self {
        let cmd = command.to_lowercase();
        if cmd.contains("claude") {
            CliToolType::ClaudeCode
        } else if cmd.contains("gemini") {
            CliToolType::GeminiCli
        } else if cmd.contains("codex") {
            CliToolType::CodexCli
        } else if cmd.contains("cursor") {
            CliToolType::CursorCli
        } else if cmd == "q" || cmd.contains("amazon-q") {
            CliToolType::AmazonQCli
        } else if cmd.contains("copilot") {
            CliToolType::CopilotCli
        } else {
            CliToolType::Custom
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn sample_profile() -> ExecutorProfile {
        ExecutorProfile {
            id: "test-id".to_string(),
            name: "Test Profile".to_string(),
            description: Some("A test profile".to_string()),
            command: "claude".to_string(),
            args: Some(r#"["--verbose", "--no-confirm"]"#.to_string()),
            env: Some(r#"{"API_KEY": "test123"}"#.to_string()),
            model: Some("claude-sonnet-4".to_string()),
            is_default: true,
            created_at: "2024-01-01T00:00:00Z".to_string(),
            updated_at: "2024-01-01T00:00:00Z".to_string(),
        }
    }

    #[test]
    fn test_executor_profile_serialization() {
        let profile = sample_profile();

        let json = serde_json::to_string(&profile).unwrap();
        let parsed: ExecutorProfile = serde_json::from_str(&json).unwrap();

        assert_eq!(parsed.id, profile.id);
        assert_eq!(parsed.name, profile.name);
        assert_eq!(parsed.command, profile.command);
        assert_eq!(parsed.is_default, profile.is_default);
    }

    #[test]
    fn test_executor_profile_camel_case() {
        let profile = sample_profile();
        let json = serde_json::to_string(&profile).unwrap();

        assert!(json.contains("isDefault"));
        assert!(json.contains("createdAt"));
        assert!(json.contains("updatedAt"));
        assert!(!json.contains("is_default"));
        assert!(!json.contains("created_at"));
    }

    #[test]
    fn test_has_args() {
        let mut profile = sample_profile();
        assert!(profile.has_args());

        profile.args = None;
        assert!(!profile.has_args());

        profile.args = Some("".to_string());
        assert!(!profile.has_args());
    }

    #[test]
    fn test_has_env() {
        let mut profile = sample_profile();
        assert!(profile.has_env());

        profile.env = None;
        assert!(!profile.has_env());

        profile.env = Some("".to_string());
        assert!(!profile.has_env());
    }

    #[test]
    fn test_has_model() {
        let mut profile = sample_profile();
        assert!(profile.has_model());

        profile.model = None;
        assert!(!profile.has_model());

        profile.model = Some("".to_string());
        assert!(!profile.has_model());
    }

    #[test]
    fn test_parse_args() {
        let profile = sample_profile();
        let args = profile.parse_args();

        assert_eq!(args.len(), 2);
        assert_eq!(args[0], "--verbose");
        assert_eq!(args[1], "--no-confirm");
    }

    #[test]
    fn test_parse_args_empty() {
        let mut profile = sample_profile();
        profile.args = None;
        assert!(profile.parse_args().is_empty());

        profile.args = Some("invalid".to_string());
        assert!(profile.parse_args().is_empty());
    }

    #[test]
    fn test_parse_env() {
        let profile = sample_profile();
        let env = profile.parse_env();

        assert_eq!(env.len(), 1);
        assert_eq!(env.get("API_KEY"), Some(&"test123".to_string()));
    }

    #[test]
    fn test_parse_env_empty() {
        let mut profile = sample_profile();
        profile.env = None;
        assert!(profile.parse_env().is_empty());

        profile.env = Some("invalid".to_string());
        assert!(profile.parse_env().is_empty());
    }

    #[test]
    fn test_executor_profile_summary_from() {
        let profile = sample_profile();
        let summary: ExecutorProfileSummary = profile.clone().into();

        assert_eq!(summary.id, profile.id);
        assert_eq!(summary.name, profile.name);
        assert_eq!(summary.command, profile.command);
        assert_eq!(summary.model, profile.model);
        assert_eq!(summary.is_default, profile.is_default);
    }

    #[test]
    fn test_executor_profile_summary_from_ref() {
        let profile = sample_profile();
        let summary: ExecutorProfileSummary = (&profile).into();

        assert_eq!(summary.id, profile.id);
        assert_eq!(summary.name, profile.name);
    }

    #[test]
    fn test_cli_tool_type_default_command() {
        assert_eq!(CliToolType::ClaudeCode.default_command(), "claude");
        assert_eq!(CliToolType::GeminiCli.default_command(), "gemini");
        assert_eq!(CliToolType::CodexCli.default_command(), "codex");
        assert_eq!(CliToolType::CursorCli.default_command(), "cursor");
        assert_eq!(CliToolType::AmazonQCli.default_command(), "q");
        assert_eq!(CliToolType::CopilotCli.default_command(), "gh copilot");
        assert_eq!(CliToolType::Custom.default_command(), "");
    }

    #[test]
    fn test_cli_tool_type_from_command() {
        assert_eq!(CliToolType::from_command("claude"), CliToolType::ClaudeCode);
        assert_eq!(
            CliToolType::from_command("claude-code"),
            CliToolType::ClaudeCode
        );
        assert_eq!(CliToolType::from_command("gemini"), CliToolType::GeminiCli);
        assert_eq!(CliToolType::from_command("codex"), CliToolType::CodexCli);
        assert_eq!(CliToolType::from_command("cursor"), CliToolType::CursorCli);
        assert_eq!(CliToolType::from_command("q"), CliToolType::AmazonQCli);
        assert_eq!(
            CliToolType::from_command("gh copilot"),
            CliToolType::CopilotCli
        );
        assert_eq!(CliToolType::from_command("unknown"), CliToolType::Custom);
    }

    #[test]
    fn test_cli_tool_type_serialization() {
        let tool = CliToolType::ClaudeCode;
        let json = serde_json::to_string(&tool).unwrap();
        assert_eq!(json, "\"claude_code\"");

        let parsed: CliToolType = serde_json::from_str(&json).unwrap();
        assert_eq!(parsed, CliToolType::ClaudeCode);
    }
}
