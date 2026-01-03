//! Executor Profile Request Types
//!
//! Request types for executor profile CRUD operations and
//! executor run operations.
//!
//! # Examples
//!
//! ```rust
//! use openflow_contracts::CreateExecutorProfileRequest;
//!
//! let request = CreateExecutorProfileRequest::new("Claude Code", "claude")
//!     .with_description("Anthropic's Claude Code CLI")
//!     .with_model("claude-sonnet-4")
//!     .with_is_default(true);
//!
//! assert_eq!(request.name, "Claude Code");
//! assert_eq!(request.command, "claude");
//! ```

use serde::{Deserialize, Serialize};
use typeshare::typeshare;

/// Request to create a new executor profile.
///
/// # Required Fields
/// * `name` - Profile name (1-255 characters)
/// * `command` - CLI command to execute (1-255 characters)
///
/// # Optional Fields
/// * `description` - Profile description (max 1000 characters)
/// * `args` - JSON array of CLI arguments
/// * `env` - JSON object of environment variables
/// * `model` - AI model identifier
/// * `is_default` - Whether this should be the default profile
///
/// @endpoint: POST /api/executor-profiles
/// @command: create_executor_profile
#[typeshare]
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct CreateExecutorProfileRequest {
    /// Profile name (required, 1-255 chars)
    /// @validate: required, min_length=1, max_length=255
    pub name: String,

    /// Optional description of the profile
    /// @validate: max_length=1000
    pub description: Option<String>,

    /// CLI command to execute (required, 1-255 chars)
    /// @validate: required, min_length=1, max_length=255
    pub command: String,

    /// JSON array of default arguments
    /// @validate: max_length=10000, format=json_array
    pub args: Option<String>,

    /// JSON object of environment variables
    /// @validate: max_length=10000, format=json_object
    pub env: Option<String>,

    /// Model identifier if applicable
    /// @validate: max_length=255
    pub model: Option<String>,

    /// Whether this should be the default profile
    /// If true, clears default from all other profiles
    pub is_default: Option<bool>,
}

impl CreateExecutorProfileRequest {
    /// Create a new request with required fields
    pub fn new(name: impl Into<String>, command: impl Into<String>) -> Self {
        Self {
            name: name.into(),
            description: None,
            command: command.into(),
            args: None,
            env: None,
            model: None,
            is_default: None,
        }
    }

    /// Set the description
    pub fn with_description(mut self, description: impl Into<String>) -> Self {
        self.description = Some(description.into());
        self
    }

    /// Set the arguments as a JSON array string
    pub fn with_args(mut self, args: impl Into<String>) -> Self {
        self.args = Some(args.into());
        self
    }

    /// Set the arguments from a slice of strings
    pub fn with_args_vec(mut self, args: &[&str]) -> Self {
        self.args = Some(serde_json::to_string(&args).unwrap_or_else(|_| "[]".to_string()));
        self
    }

    /// Set the environment variables as a JSON object string
    pub fn with_env(mut self, env: impl Into<String>) -> Self {
        self.env = Some(env.into());
        self
    }

    /// Set environment variables from key-value pairs
    pub fn with_env_map(mut self, env: &[(&str, &str)]) -> Self {
        let map: std::collections::HashMap<&str, &str> = env.iter().cloned().collect();
        self.env = Some(serde_json::to_string(&map).unwrap_or_else(|_| "{}".to_string()));
        self
    }

    /// Set the model identifier
    pub fn with_model(mut self, model: impl Into<String>) -> Self {
        self.model = Some(model.into());
        self
    }

    /// Set whether this is the default profile
    pub fn with_is_default(mut self, is_default: bool) -> Self {
        self.is_default = Some(is_default);
        self
    }
}

/// Request to update an existing executor profile.
///
/// All fields are optional - only provided fields will be updated.
/// Use `None` to keep existing values.
///
/// @endpoint: PATCH /api/executor-profiles/:id
/// @command: update_executor_profile
#[typeshare]
#[derive(Debug, Clone, Serialize, Deserialize, Default, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct UpdateExecutorProfileRequest {
    /// Updated profile name
    /// @validate: min_length=1, max_length=255
    pub name: Option<String>,

    /// Updated description
    /// @validate: max_length=1000
    pub description: Option<String>,

    /// Updated CLI command
    /// @validate: min_length=1, max_length=255
    pub command: Option<String>,

    /// Updated arguments JSON array
    /// @validate: max_length=10000, format=json_array
    pub args: Option<String>,

    /// Updated environment variables JSON object
    /// @validate: max_length=10000, format=json_object
    pub env: Option<String>,

    /// Updated model identifier
    /// @validate: max_length=255
    pub model: Option<String>,

    /// Updated default status
    /// If true, clears default from all other profiles
    pub is_default: Option<bool>,
}

impl UpdateExecutorProfileRequest {
    /// Create an empty update request
    pub fn new() -> Self {
        Self::default()
    }

    /// Set the name to update
    pub fn with_name(mut self, name: impl Into<String>) -> Self {
        self.name = Some(name.into());
        self
    }

    /// Set the description to update
    pub fn with_description(mut self, description: impl Into<String>) -> Self {
        self.description = Some(description.into());
        self
    }

    /// Set the command to update
    pub fn with_command(mut self, command: impl Into<String>) -> Self {
        self.command = Some(command.into());
        self
    }

    /// Set the arguments to update
    pub fn with_args(mut self, args: impl Into<String>) -> Self {
        self.args = Some(args.into());
        self
    }

    /// Set the environment variables to update
    pub fn with_env(mut self, env: impl Into<String>) -> Self {
        self.env = Some(env.into());
        self
    }

    /// Set the model to update
    pub fn with_model(mut self, model: impl Into<String>) -> Self {
        self.model = Some(model.into());
        self
    }

    /// Set the default status to update
    pub fn with_is_default(mut self, is_default: bool) -> Self {
        self.is_default = Some(is_default);
        self
    }

    /// Check if this request has any updates
    pub fn has_updates(&self) -> bool {
        self.name.is_some()
            || self.description.is_some()
            || self.command.is_some()
            || self.args.is_some()
            || self.env.is_some()
            || self.model.is_some()
            || self.is_default.is_some()
    }
}

/// Request to run an executor for a chat session.
///
/// Spawns a CLI process using the specified executor profile
/// and sends the prompt to the AI coding agent.
///
/// @endpoint: POST /api/executor/run
/// @command: run_executor
#[typeshare]
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct RunExecutorRequest {
    /// Chat ID to run the executor in (required)
    /// @validate: required, format=uuid
    pub chat_id: String,

    /// Prompt to send to the AI coding agent (required)
    /// @validate: required, min_length=1, max_length=1000000
    pub prompt: String,

    /// Executor profile ID to use
    /// If not provided, uses the default profile
    /// @validate: format=uuid
    pub executor_profile_id: Option<String>,
}

impl RunExecutorRequest {
    /// Create a new run executor request
    pub fn new(chat_id: impl Into<String>, prompt: impl Into<String>) -> Self {
        Self {
            chat_id: chat_id.into(),
            prompt: prompt.into(),
            executor_profile_id: None,
        }
    }

    /// Set a specific executor profile to use
    pub fn with_profile(mut self, profile_id: impl Into<String>) -> Self {
        self.executor_profile_id = Some(profile_id.into());
        self
    }
}

/// Request to set the default executor profile.
///
/// This is a convenience operation that sets the specified profile
/// as the default and clears default from all other profiles.
///
/// @endpoint: POST /api/executor-profiles/:id/set-default
/// @command: set_default_executor_profile
#[typeshare]
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct SetDefaultExecutorProfileRequest {
    /// Profile ID to set as default (required)
    /// @validate: required, format=uuid
    pub id: String,
}

impl SetDefaultExecutorProfileRequest {
    /// Create a new set default request
    pub fn new(id: impl Into<String>) -> Self {
        Self { id: id.into() }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_create_request_new() {
        let request = CreateExecutorProfileRequest::new("Test Profile", "test-cmd");

        assert_eq!(request.name, "Test Profile");
        assert_eq!(request.command, "test-cmd");
        assert!(request.description.is_none());
        assert!(request.args.is_none());
        assert!(request.env.is_none());
        assert!(request.model.is_none());
        assert!(request.is_default.is_none());
    }

    #[test]
    fn test_create_request_builder() {
        let request = CreateExecutorProfileRequest::new("Claude Code", "claude")
            .with_description("Anthropic CLI")
            .with_model("claude-sonnet-4")
            .with_is_default(true);

        assert_eq!(request.name, "Claude Code");
        assert_eq!(request.command, "claude");
        assert_eq!(request.description, Some("Anthropic CLI".to_string()));
        assert_eq!(request.model, Some("claude-sonnet-4".to_string()));
        assert_eq!(request.is_default, Some(true));
    }

    #[test]
    fn test_create_request_with_args_vec() {
        let request = CreateExecutorProfileRequest::new("Test", "test")
            .with_args_vec(&["--verbose", "--no-confirm"]);

        let args = request.args.unwrap();
        assert!(args.contains("--verbose"));
        assert!(args.contains("--no-confirm"));
    }

    #[test]
    fn test_create_request_with_env_map() {
        let request = CreateExecutorProfileRequest::new("Test", "test")
            .with_env_map(&[("API_KEY", "secret"), ("DEBUG", "true")]);

        let env = request.env.unwrap();
        assert!(env.contains("API_KEY"));
        assert!(env.contains("secret"));
    }

    #[test]
    fn test_create_request_serialization() {
        let request = CreateExecutorProfileRequest::new("Test", "test").with_is_default(true);

        let json = serde_json::to_string(&request).unwrap();
        assert!(json.contains("isDefault"));
        assert!(!json.contains("is_default"));

        let parsed: CreateExecutorProfileRequest = serde_json::from_str(&json).unwrap();
        assert_eq!(parsed.name, request.name);
        assert_eq!(parsed.is_default, request.is_default);
    }

    #[test]
    fn test_update_request_new() {
        let request = UpdateExecutorProfileRequest::new();
        assert!(!request.has_updates());
    }

    #[test]
    fn test_update_request_builder() {
        let request = UpdateExecutorProfileRequest::new()
            .with_name("New Name")
            .with_command("new-cmd")
            .with_is_default(true);

        assert!(request.has_updates());
        assert_eq!(request.name, Some("New Name".to_string()));
        assert_eq!(request.command, Some("new-cmd".to_string()));
        assert_eq!(request.is_default, Some(true));
        assert!(request.description.is_none());
    }

    #[test]
    fn test_update_request_has_updates() {
        let mut request = UpdateExecutorProfileRequest::new();
        assert!(!request.has_updates());

        request.name = Some("Name".to_string());
        assert!(request.has_updates());
    }

    #[test]
    fn test_run_executor_request() {
        let request =
            RunExecutorRequest::new("chat-123", "Help me write code").with_profile("profile-456");

        assert_eq!(request.chat_id, "chat-123");
        assert_eq!(request.prompt, "Help me write code");
        assert_eq!(request.executor_profile_id, Some("profile-456".to_string()));
    }

    #[test]
    fn test_run_executor_request_serialization() {
        let request = RunExecutorRequest::new("chat-123", "Test prompt");

        let json = serde_json::to_string(&request).unwrap();
        assert!(json.contains("chatId"));
        assert!(!json.contains("chat_id"));

        let parsed: RunExecutorRequest = serde_json::from_str(&json).unwrap();
        assert_eq!(parsed.chat_id, request.chat_id);
    }

    #[test]
    fn test_set_default_request() {
        let request = SetDefaultExecutorProfileRequest::new("profile-123");

        assert_eq!(request.id, "profile-123");

        let json = serde_json::to_string(&request).unwrap();
        let parsed: SetDefaultExecutorProfileRequest = serde_json::from_str(&json).unwrap();
        assert_eq!(parsed.id, request.id);
    }
}
