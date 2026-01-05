//! Agent Provider Abstraction Layer
//!
//! This module provides a trait-based abstraction for different AI coding CLI tools.
//! Each provider (Claude Code, Gemini CLI, Codex CLI, etc.) implements the `AgentProvider`
//! trait to normalize their CLI commands and output formats.
//!
//! # Architecture
//!
//! ```text
//! ┌─────────────────────────────────────────────────────────────────────────┐
//! │                         AgentProvider Trait                             │
//! ├─────────────────────────────────────────────────────────────────────────┤
//! │                                                                         │
//! │   build_command()    parse_line()    is_permission_prompt()            │
//! │         │                 │                    │                        │
//! │         ▼                 ▼                    ▼                        │
//! │    PtyConfig        UnifiedAgentEvent    PermissionRequest             │
//! │                                                                         │
//! └─────────────────────────────────────────────────────────────────────────┘
//!                            │
//!          ┌─────────────────┼─────────────────┐
//!          │                 │                 │
//!          ▼                 ▼                 ▼
//! ┌─────────────┐   ┌─────────────┐   ┌─────────────┐
//! │ ClaudeCode  │   │  GeminiCLI  │   │  CodexCLI   │
//! │  Provider   │   │  Provider   │   │  Provider   │
//! └─────────────┘   └─────────────┘   └─────────────┘
//! ```
//!
//! # Usage
//!
//! ```ignore
//! use openflow_core::providers::{get_provider, AgentConfig};
//!
//! // Get a provider by ID
//! let provider = get_provider("claude-code").expect("Provider not found");
//!
//! // Build command configuration
//! let config = AgentConfig::new("Fix the bug in main.rs", "/path/to/project");
//! let pty_config = provider.build_command(&config);
//!
//! // Parse output lines
//! let line = r#"{"type":"assistant","message":{"content":[{"type":"text","text":"Hello"}]}}"#;
//! if let Some(event) = provider.parse_line(line) {
//!     println!("Parsed event: {:?}", event);
//! }
//! ```

pub mod claude_code;
pub mod claude_sdk;
pub mod codex_cli;
pub mod gemini_cli;
pub mod mock;
pub mod registry;

// Re-export provider implementations
pub use claude_code::ClaudeCodeProvider;
pub use claude_sdk::ClaudeSdkProvider;
pub use codex_cli::CodexCLIProvider;
pub use gemini_cli::GeminiCLIProvider;
pub use mock::{MockProvider, MockProviderBuilder, MockProviderConfig};

// Re-export registry types and functions
pub use registry::{
    default_provider, get_provider, list_provider_ids, provider_exists, provider_info,
    ProviderRegistry, DEFAULT_PROVIDER_ID, PROVIDER_IDS,
};

use std::collections::HashMap;
use std::fmt::Debug;
use std::path::PathBuf;

use openflow_contracts::events::{PermissionRequest, UnifiedAgentEvent};
use openflow_process::PtyConfig;

// =============================================================================
// Agent Configuration
// =============================================================================

/// Configuration for spawning an agent process.
///
/// This struct contains all the information needed to start an agent session,
/// independent of which provider is being used.
#[derive(Debug, Clone)]
pub struct AgentConfig {
    /// The prompt/instructions to send to the AI agent.
    pub prompt: String,

    /// Working directory for the process.
    pub working_directory: PathBuf,

    /// Optional session ID for resuming a previous conversation.
    /// If provided, the provider will use its resume mechanism.
    pub session_id: Option<String>,

    /// Additional environment variables to set.
    pub env: HashMap<String, String>,

    /// Optional model override.
    pub model: Option<String>,

    /// Terminal width in columns (default: 120).
    pub cols: u16,

    /// Terminal height in rows (default: 40).
    pub rows: u16,
}

impl AgentConfig {
    /// Create a new agent configuration with required fields.
    ///
    /// # Arguments
    ///
    /// * `prompt` - The prompt/instructions to send to the AI agent
    /// * `working_directory` - Working directory for the process
    ///
    /// # Example
    ///
    /// ```
    /// use openflow_core::providers::AgentConfig;
    ///
    /// let config = AgentConfig::new("Fix the bug in main.rs", "/path/to/project");
    /// ```
    pub fn new(prompt: impl Into<String>, working_directory: impl Into<PathBuf>) -> Self {
        Self {
            prompt: prompt.into(),
            working_directory: working_directory.into(),
            session_id: None,
            env: HashMap::new(),
            model: None,
            cols: 120,
            rows: 40,
        }
    }

    /// Set the session ID for resuming a conversation.
    pub fn with_session_id(mut self, session_id: impl Into<String>) -> Self {
        self.session_id = Some(session_id.into());
        self
    }

    /// Add environment variables.
    pub fn with_env(mut self, env: HashMap<String, String>) -> Self {
        self.env = env;
        self
    }

    /// Add a single environment variable.
    pub fn with_env_var(mut self, key: impl Into<String>, value: impl Into<String>) -> Self {
        self.env.insert(key.into(), value.into());
        self
    }

    /// Set the model to use.
    pub fn with_model(mut self, model: impl Into<String>) -> Self {
        self.model = Some(model.into());
        self
    }

    /// Set the terminal size.
    pub fn with_size(mut self, cols: u16, rows: u16) -> Self {
        self.cols = cols;
        self.rows = rows;
        self
    }

    /// Check if this is a resume session.
    pub fn is_resume(&self) -> bool {
        self.session_id.is_some()
    }
}

impl Default for AgentConfig {
    fn default() -> Self {
        Self {
            prompt: String::new(),
            working_directory: PathBuf::new(),
            session_id: None,
            env: HashMap::new(),
            model: None,
            cols: 120,
            rows: 40,
        }
    }
}

// =============================================================================
// Provider Capabilities
// =============================================================================

/// Capabilities supported by a provider.
///
/// Different providers may support different features. This struct
/// describes what a provider can do.
#[derive(Debug, Clone, Default)]
pub struct ProviderCapabilities {
    /// Whether the provider supports session resume.
    pub supports_resume: bool,

    /// Whether the provider supports streaming JSON output.
    pub supports_streaming_json: bool,

    /// Whether the provider can skip permissions.
    pub supports_skip_permissions: bool,

    /// Whether the provider supports verbose mode.
    pub supports_verbose: bool,

    /// Whether the provider emits tool events.
    pub emits_tool_events: bool,

    /// Whether the provider emits thinking/reasoning.
    pub emits_thinking: bool,
}

impl ProviderCapabilities {
    /// Create capabilities for a full-featured provider.
    pub fn full() -> Self {
        Self {
            supports_resume: true,
            supports_streaming_json: true,
            supports_skip_permissions: true,
            supports_verbose: true,
            emits_tool_events: true,
            emits_thinking: true,
        }
    }

    /// Create minimal capabilities.
    pub fn minimal() -> Self {
        Self::default()
    }
}

// =============================================================================
// Agent Provider Trait
// =============================================================================

/// Trait for AI coding CLI tool providers.
///
/// Each provider implementation normalizes the CLI commands and output formats
/// for a specific tool (Claude Code, Gemini CLI, Codex CLI, etc.) into the
/// unified `UnifiedAgentEvent` format.
///
/// # Implementation Guidelines
///
/// Implementors should:
/// 1. Return a unique `provider_id` that matches database values
/// 2. Build command arguments appropriate for their CLI tool
/// 3. Parse their tool's output format into `UnifiedAgentEvent`
/// 4. Detect permission prompts specific to their tool
/// 5. Provide appropriate responses for permissions
///
/// # Thread Safety
///
/// This trait requires `Send + Sync` to allow providers to be shared
/// across threads in async contexts.
pub trait AgentProvider: Send + Sync + Debug {
    /// Get the unique provider identifier.
    ///
    /// This ID should match the `provider_id` stored in the database.
    /// Common values: "claude-code", "gemini-cli", "codex-cli", "mock"
    fn provider_id(&self) -> &'static str;

    /// Get the human-readable display name.
    ///
    /// Used for UI display and logging.
    fn display_name(&self) -> &'static str;

    /// Get the CLI command to execute.
    ///
    /// This is the base command without arguments (e.g., "claude", "gemini").
    fn command(&self) -> &'static str;

    /// Get provider capabilities.
    fn capabilities(&self) -> ProviderCapabilities;

    /// Build the PTY configuration for spawning the agent.
    ///
    /// This converts the abstract `AgentConfig` into the concrete
    /// `PtyConfig` needed to spawn the process.
    ///
    /// # Arguments
    ///
    /// * `config` - Agent configuration with prompt, working directory, etc.
    ///
    /// # Returns
    ///
    /// A `PtyConfig` ready to be passed to the PTY manager.
    fn build_command(&self, config: &AgentConfig) -> PtyConfig;

    /// Parse a line of output into a unified agent event.
    ///
    /// Each provider's CLI tool has its own output format. This method
    /// parses a single line and converts it to the unified format.
    ///
    /// # Arguments
    ///
    /// * `line` - A single line of output from the CLI tool
    ///
    /// # Returns
    ///
    /// - `Some(event)` if the line was successfully parsed
    /// - `None` if the line is not a recognized event format
    fn parse_line(&self, line: &str) -> Option<UnifiedAgentEvent>;

    /// Check if a line is a permission prompt.
    ///
    /// Some CLI tools pause and wait for user approval before performing
    /// certain operations. This method detects those prompts.
    ///
    /// # Arguments
    ///
    /// * `line` - A line of output to check
    ///
    /// # Returns
    ///
    /// - `Some(request)` if this is a permission prompt
    /// - `None` if not a permission prompt
    fn is_permission_prompt(&self, line: &str) -> Option<PermissionRequest>;

    /// Get command arguments for resuming a session.
    ///
    /// # Arguments
    ///
    /// * `session_id` - The session ID to resume
    ///
    /// # Returns
    ///
    /// Command line arguments to add for session resume.
    fn resume_args(&self, session_id: &str) -> Vec<String>;

    /// Get the bytes to send for permission approval/denial.
    ///
    /// # Arguments
    ///
    /// * `approved` - Whether the user approved the permission
    ///
    /// # Returns
    ///
    /// Bytes to write to the PTY stdin.
    fn approval_response(&self, approved: bool) -> &'static [u8];

    /// Get the default environment variables for this provider.
    ///
    /// These are merged with any env vars in the config.
    fn default_env(&self) -> HashMap<String, String> {
        let mut env = HashMap::new();
        // Disable colors for clean JSON parsing
        env.insert("NO_COLOR".to_string(), "1".to_string());
        env.insert("FORCE_COLOR".to_string(), "0".to_string());
        env.insert("TERM".to_string(), "dumb".to_string());
        env
    }
}


// =============================================================================
// Tests
// =============================================================================

#[cfg(test)]
mod tests {
    use super::*;

    // =========================================================================
    // AgentConfig Tests
    // =========================================================================

    #[test]
    fn test_agent_config_new() {
        let config = AgentConfig::new("Test prompt", "/path/to/project");
        assert_eq!(config.prompt, "Test prompt");
        assert_eq!(config.working_directory, PathBuf::from("/path/to/project"));
        assert!(config.session_id.is_none());
        assert!(config.env.is_empty());
        assert!(!config.is_resume());
    }

    #[test]
    fn test_agent_config_with_session_id() {
        let config = AgentConfig::new("prompt", "/path").with_session_id("session-123");
        assert_eq!(config.session_id, Some("session-123".to_string()));
        assert!(config.is_resume());
    }

    #[test]
    fn test_agent_config_with_env() {
        let mut env = HashMap::new();
        env.insert("KEY".to_string(), "VALUE".to_string());

        let config = AgentConfig::new("prompt", "/path").with_env(env.clone());
        assert_eq!(config.env, env);
    }

    #[test]
    fn test_agent_config_with_env_var() {
        let config = AgentConfig::new("prompt", "/path")
            .with_env_var("KEY1", "VALUE1")
            .with_env_var("KEY2", "VALUE2");

        assert_eq!(config.env.get("KEY1"), Some(&"VALUE1".to_string()));
        assert_eq!(config.env.get("KEY2"), Some(&"VALUE2".to_string()));
    }

    #[test]
    fn test_agent_config_with_model() {
        let config = AgentConfig::new("prompt", "/path").with_model("claude-3-opus");
        assert_eq!(config.model, Some("claude-3-opus".to_string()));
    }

    #[test]
    fn test_agent_config_with_size() {
        let config = AgentConfig::new("prompt", "/path").with_size(200, 50);
        assert_eq!(config.cols, 200);
        assert_eq!(config.rows, 50);
    }

    #[test]
    fn test_agent_config_default() {
        let config = AgentConfig::default();
        assert!(config.prompt.is_empty());
        assert!(config.working_directory.as_os_str().is_empty());
        assert_eq!(config.cols, 120);
        assert_eq!(config.rows, 40);
    }

    #[test]
    fn test_agent_config_builder_chain() {
        let config = AgentConfig::new("Fix bug", "/project")
            .with_session_id("sess-456")
            .with_model("claude-sonnet")
            .with_env_var("DEBUG", "1")
            .with_size(100, 30);

        assert_eq!(config.prompt, "Fix bug");
        assert_eq!(config.session_id, Some("sess-456".to_string()));
        assert_eq!(config.model, Some("claude-sonnet".to_string()));
        assert_eq!(config.env.get("DEBUG"), Some(&"1".to_string()));
        assert_eq!(config.cols, 100);
        assert_eq!(config.rows, 30);
    }

    // =========================================================================
    // ProviderCapabilities Tests
    // =========================================================================

    #[test]
    fn test_capabilities_full() {
        let caps = ProviderCapabilities::full();
        assert!(caps.supports_resume);
        assert!(caps.supports_streaming_json);
        assert!(caps.supports_skip_permissions);
        assert!(caps.supports_verbose);
        assert!(caps.emits_tool_events);
        assert!(caps.emits_thinking);
    }

    #[test]
    fn test_capabilities_minimal() {
        let caps = ProviderCapabilities::minimal();
        assert!(!caps.supports_resume);
        assert!(!caps.supports_streaming_json);
        assert!(!caps.supports_skip_permissions);
        assert!(!caps.supports_verbose);
        assert!(!caps.emits_tool_events);
        assert!(!caps.emits_thinking);
    }

    #[test]
    fn test_capabilities_default() {
        let caps = ProviderCapabilities::default();
        assert!(!caps.supports_resume);
    }

}
