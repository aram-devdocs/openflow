//! Mock Provider for Testing
//!
//! A configurable mock implementation of the `AgentProvider` trait for testing
//! agent orchestration without requiring external CLI tools.
//!
//! # Features
//!
//! - Configurable event sequences
//! - Simulates real timing with configurable delays
//! - No external dependencies
//! - Deterministic behavior for repeatable tests
//! - Preset scenarios for common test cases
//!
//! # Example
//!
//! ```
//! use openflow_core::providers::{MockProvider, AgentProvider, AgentConfig};
//!
//! // Create a mock provider with a simple message flow
//! let provider = MockProvider::with_greeting("Hello! I'll help you fix that bug.");
//!
//! // Or use a builder pattern for complex scenarios
//! let provider = MockProvider::builder()
//!     .with_session_id("mock-session-123")
//!     .with_model("mock-model-v1")
//!     .with_tool_call("Read", r#"{"file_path": "/src/main.rs"}"#, "fn main() {}")
//!     .with_response("I found the issue in main.rs")
//!     .with_permission_prompt("Write", "/src/main.rs")
//!     .with_delay_ms(10)
//!     .build();
//!
//! // Parse mock output
//! let output = provider.generate_mock_output();
//! for line in output.lines() {
//!     if let Some(event) = provider.parse_line(line) {
//!         println!("Event: {:?}", event);
//!     }
//! }
//! ```

use std::collections::HashMap;
use std::sync::atomic::{AtomicUsize, Ordering};
use std::sync::Mutex;

use serde::{Deserialize, Serialize};
use serde_json::json;

use openflow_contracts::events::{
    AgentMessageRole, AgentStats, CompletionStatus, ContentBlock, PermissionRequest,
    UnifiedAgentEvent,
};
use openflow_process::PtyConfig;

use super::{AgentConfig, AgentProvider, ProviderCapabilities};

// =============================================================================
// Constants
// =============================================================================

/// Provider ID constant
pub const PROVIDER_ID: &str = "mock";

/// Display name for UI
pub const DISPLAY_NAME: &str = "Mock Provider";

/// CLI command name (not actually executed)
pub const COMMAND: &str = "mock-agent";

/// Default delay between events in milliseconds
pub const DEFAULT_DELAY_MS: u64 = 0;

/// Default mock session ID
pub const DEFAULT_SESSION_ID: &str = "mock-session-001";

/// Default mock model name
pub const DEFAULT_MODEL: &str = "mock-model-v1";

// =============================================================================
// Mock Event (for generating output)
// =============================================================================

/// A mock event that can be serialized to simulate CLI output
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type", rename_all = "snake_case")]
pub enum MockEvent {
    /// Session initialization
    Init {
        session_id: String,
        model: String,
        tools: Vec<String>,
    },
    /// Assistant message
    Assistant {
        content: Vec<MockContentBlock>,
    },
    /// User message (tool results)
    User {
        content: Vec<MockContentBlock>,
    },
    /// Session completion
    Result {
        subtype: String,
        input_tokens: Option<i32>,
        output_tokens: Option<i32>,
        duration_seconds: Option<f64>,
    },
    /// Error event
    Error {
        code: String,
        message: String,
    },
    /// Permission prompt (special - emitted as plain text)
    Permission {
        tool_name: String,
        description: String,
        file_path: Option<String>,
    },
}

/// Mock content block for event generation
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type", rename_all = "snake_case")]
pub enum MockContentBlock {
    /// Text content
    Text { text: String },
    /// Tool use
    ToolUse {
        id: String,
        name: String,
        input: serde_json::Value,
    },
    /// Tool result
    ToolResult {
        tool_use_id: String,
        content: String,
        #[serde(default)]
        is_error: bool,
    },
    /// Thinking
    Thinking { thinking: String },
}

// =============================================================================
// MockProvider Configuration
// =============================================================================

/// Configuration for the mock provider
#[derive(Debug, Clone)]
pub struct MockProviderConfig {
    /// Session ID to use in init event
    pub session_id: String,
    /// Model name to report
    pub model: String,
    /// Available tools
    pub tools: Vec<String>,
    /// Events to emit
    pub events: Vec<MockEvent>,
    /// Delay between events in milliseconds
    pub delay_ms: u64,
    /// Whether to simulate permission prompts
    pub emit_permission_prompts: bool,
    /// Token counts for completion stats
    pub input_tokens: i32,
    pub output_tokens: i32,
}

impl Default for MockProviderConfig {
    fn default() -> Self {
        Self {
            session_id: DEFAULT_SESSION_ID.to_string(),
            model: DEFAULT_MODEL.to_string(),
            tools: vec![
                "Read".to_string(),
                "Write".to_string(),
                "Bash".to_string(),
                "Grep".to_string(),
            ],
            events: Vec::new(),
            delay_ms: DEFAULT_DELAY_MS,
            emit_permission_prompts: false,
            input_tokens: 100,
            output_tokens: 50,
        }
    }
}

// =============================================================================
// MockProvider Builder
// =============================================================================

/// Builder for creating MockProvider instances with custom configurations
#[derive(Debug, Clone, Default)]
pub struct MockProviderBuilder {
    config: MockProviderConfig,
    tool_call_counter: usize,
}

impl MockProviderBuilder {
    /// Create a new builder with default configuration
    pub fn new() -> Self {
        Self::default()
    }

    /// Set the session ID
    pub fn with_session_id(mut self, session_id: impl Into<String>) -> Self {
        self.config.session_id = session_id.into();
        self
    }

    /// Set the model name
    pub fn with_model(mut self, model: impl Into<String>) -> Self {
        self.config.model = model.into();
        self
    }

    /// Set available tools
    pub fn with_tools(mut self, tools: Vec<String>) -> Self {
        self.config.tools = tools;
        self
    }

    /// Add a tool to available tools
    pub fn add_tool(mut self, tool: impl Into<String>) -> Self {
        self.config.tools.push(tool.into());
        self
    }

    /// Set delay between events
    pub fn with_delay_ms(mut self, delay_ms: u64) -> Self {
        self.config.delay_ms = delay_ms;
        self
    }

    /// Set token counts for completion stats
    pub fn with_tokens(mut self, input: i32, output: i32) -> Self {
        self.config.input_tokens = input;
        self.config.output_tokens = output;
        self
    }

    /// Add a text response from the assistant
    pub fn with_response(mut self, text: impl Into<String>) -> Self {
        self.config.events.push(MockEvent::Assistant {
            content: vec![MockContentBlock::Text { text: text.into() }],
        });
        self
    }

    /// Add thinking content
    pub fn with_thinking(mut self, thinking: impl Into<String>) -> Self {
        self.config.events.push(MockEvent::Assistant {
            content: vec![MockContentBlock::Thinking {
                thinking: thinking.into(),
            }],
        });
        self
    }

    /// Add a tool call with result
    pub fn with_tool_call(
        mut self,
        tool_name: impl Into<String>,
        input: impl Into<String>,
        output: impl Into<String>,
    ) -> Self {
        self.tool_call_counter += 1;
        let tool_id = format!("tool_{}", self.tool_call_counter);
        let tool_name = tool_name.into();
        let input_str = input.into();
        let output = output.into();

        // Parse input as JSON or wrap in object
        let input_value: serde_json::Value = serde_json::from_str(&input_str)
            .unwrap_or_else(|_| json!({"input": input_str}));

        // Add tool use
        self.config.events.push(MockEvent::Assistant {
            content: vec![MockContentBlock::ToolUse {
                id: tool_id.clone(),
                name: tool_name,
                input: input_value,
            }],
        });

        // Add tool result
        self.config.events.push(MockEvent::User {
            content: vec![MockContentBlock::ToolResult {
                tool_use_id: tool_id,
                content: output,
                is_error: false,
            }],
        });

        self
    }

    /// Add a tool call that results in an error
    pub fn with_tool_error(
        mut self,
        tool_name: impl Into<String>,
        input: impl Into<String>,
        error: impl Into<String>,
    ) -> Self {
        self.tool_call_counter += 1;
        let tool_id = format!("tool_{}", self.tool_call_counter);
        let tool_name = tool_name.into();
        let input_str = input.into();
        let error = error.into();

        let input_value: serde_json::Value = serde_json::from_str(&input_str)
            .unwrap_or_else(|_| json!({"input": input_str}));

        // Add tool use
        self.config.events.push(MockEvent::Assistant {
            content: vec![MockContentBlock::ToolUse {
                id: tool_id.clone(),
                name: tool_name,
                input: input_value,
            }],
        });

        // Add tool error result
        self.config.events.push(MockEvent::User {
            content: vec![MockContentBlock::ToolResult {
                tool_use_id: tool_id,
                content: error,
                is_error: true,
            }],
        });

        self
    }

    /// Add a permission prompt
    pub fn with_permission_prompt(mut self, tool_name: impl Into<String>, file_path: impl Into<String>) -> Self {
        let tool_name = tool_name.into();
        let file_path = file_path.into();
        self.config.emit_permission_prompts = true;
        self.config.events.push(MockEvent::Permission {
            tool_name: tool_name.clone(),
            description: format!("Allow Mock to {} {}?", tool_name.to_lowercase(), file_path),
            file_path: Some(file_path),
        });
        self
    }

    /// Add a permission prompt without file path
    pub fn with_permission_prompt_no_file(mut self, tool_name: impl Into<String>, description: impl Into<String>) -> Self {
        self.config.emit_permission_prompts = true;
        self.config.events.push(MockEvent::Permission {
            tool_name: tool_name.into(),
            description: description.into(),
            file_path: None,
        });
        self
    }

    /// Add an error event
    pub fn with_error(mut self, code: impl Into<String>, message: impl Into<String>) -> Self {
        self.config.events.push(MockEvent::Error {
            code: code.into(),
            message: message.into(),
        });
        self
    }

    /// Add a custom event
    pub fn with_event(mut self, event: MockEvent) -> Self {
        self.config.events.push(event);
        self
    }

    /// Build the MockProvider
    pub fn build(self) -> MockProvider {
        MockProvider::from_config(self.config)
    }
}

// =============================================================================
// MockProvider
// =============================================================================

/// Mock implementation of AgentProvider for testing
///
/// This provider generates predictable output without requiring external CLI tools.
/// It's useful for testing the agent orchestration system in isolation.
#[derive(Debug)]
pub struct MockProvider {
    config: MockProviderConfig,
    /// Current line index for parse_line (used to track progress)
    current_line: AtomicUsize,
    /// Generated output lines (cached)
    output_lines: Mutex<Option<Vec<String>>>,
}

impl MockProvider {
    /// Create a new mock provider with default configuration
    pub fn new() -> Self {
        Self::from_config(MockProviderConfig::default())
    }

    /// Create a mock provider from configuration
    pub fn from_config(config: MockProviderConfig) -> Self {
        Self {
            config,
            current_line: AtomicUsize::new(0),
            output_lines: Mutex::new(None),
        }
    }

    /// Create a builder for custom configuration
    pub fn builder() -> MockProviderBuilder {
        MockProviderBuilder::new()
    }

    /// Create a mock provider with a configurable event sequence
    pub fn with_events(events: Vec<UnifiedAgentEvent>) -> Self {
        let mut config = MockProviderConfig::default();

        for event in events {
            match event {
                UnifiedAgentEvent::Init { session_id, model, tools } => {
                    config.session_id = session_id;
                    config.model = model;
                    config.tools = tools;
                }
                UnifiedAgentEvent::Message { role, content } => {
                    let mock_content: Vec<MockContentBlock> = content.into_iter()
                        .map(|block| match block {
                            ContentBlock::Text { text } => MockContentBlock::Text { text },
                            ContentBlock::ToolUse { id, name, input } => {
                                MockContentBlock::ToolUse { id, name, input }
                            }
                            ContentBlock::ToolResult { tool_use_id, content, is_error } => {
                                MockContentBlock::ToolResult { tool_use_id, content, is_error }
                            }
                            ContentBlock::Thinking { thinking } => {
                                MockContentBlock::Thinking { thinking }
                            }
                        })
                        .collect();

                    match role {
                        AgentMessageRole::Assistant | AgentMessageRole::System => {
                            config.events.push(MockEvent::Assistant { content: mock_content });
                        }
                        AgentMessageRole::User => {
                            config.events.push(MockEvent::User { content: mock_content });
                        }
                    }
                }
                UnifiedAgentEvent::ToolUse { tool_id, tool_name, input } => {
                    config.events.push(MockEvent::Assistant {
                        content: vec![MockContentBlock::ToolUse {
                            id: tool_id,
                            name: tool_name,
                            input,
                        }],
                    });
                }
                UnifiedAgentEvent::ToolResult { tool_id, status, output } => {
                    config.events.push(MockEvent::User {
                        content: vec![MockContentBlock::ToolResult {
                            tool_use_id: tool_id,
                            content: output,
                            is_error: status.is_error(),
                        }],
                    });
                }
                UnifiedAgentEvent::Complete { status, stats } => {
                    config.events.push(MockEvent::Result {
                        subtype: match status {
                            CompletionStatus::Success => "success".to_string(),
                            CompletionStatus::Error => "error".to_string(),
                            CompletionStatus::Interrupted => "interrupted".to_string(),
                            CompletionStatus::Timeout => "timeout".to_string(),
                            CompletionStatus::Killed => "killed".to_string(),
                        },
                        input_tokens: stats.as_ref().and_then(|s| s.input_tokens),
                        output_tokens: stats.as_ref().and_then(|s| s.output_tokens),
                        duration_seconds: stats.as_ref().and_then(|s| s.duration_ms.map(|ms| ms as f64 / 1000.0)),
                    });
                }
                UnifiedAgentEvent::Error { code, message } => {
                    config.events.push(MockEvent::Error { code, message });
                }
                UnifiedAgentEvent::Permission { tool_name, description, file_path } => {
                    config.emit_permission_prompts = true;
                    config.events.push(MockEvent::Permission {
                        tool_name,
                        description,
                        file_path,
                    });
                }
            }
        }

        Self::from_config(config)
    }

    /// Create a simple mock that returns a greeting and completes
    pub fn with_greeting(message: impl Into<String>) -> Self {
        MockProvider::builder()
            .with_response(message)
            .build()
    }

    /// Create a mock with a simple tool call scenario
    pub fn with_tool_call(name: impl Into<String>, output: impl Into<String>) -> Self {
        let name = name.into();
        MockProvider::builder()
            .with_response(format!("Let me use the {} tool.", name))
            .with_tool_call(&name, r#"{}"#, output)
            .with_response("Done!")
            .build()
    }

    /// Create a mock with a permission prompt
    pub fn with_permission(tool: impl Into<String>) -> Self {
        let tool = tool.into();
        MockProvider::builder()
            .with_response(format!("I need to use {} which requires permission.", tool))
            .with_permission_prompt(&tool, "/path/to/file")
            .with_response("Permission granted, proceeding.")
            .build()
    }

    /// Create a mock that simulates an error
    pub fn with_error_scenario(code: impl Into<String>, message: impl Into<String>) -> Self {
        MockProvider::builder()
            .with_response("Starting work...")
            .with_error(code, message)
            .build()
    }

    /// Get the configuration
    pub fn config(&self) -> &MockProviderConfig {
        &self.config
    }

    /// Generate the mock output as a string
    pub fn generate_mock_output(&self) -> String {
        self.get_output_lines().join("\n")
    }

    /// Get the output lines (generates if not cached)
    fn get_output_lines(&self) -> Vec<String> {
        let mut output_lines = self.output_lines.lock().unwrap();
        if let Some(ref lines) = *output_lines {
            return lines.clone();
        }

        let mut lines = Vec::new();

        // Add init event
        let init = MockEvent::Init {
            session_id: self.config.session_id.clone(),
            model: self.config.model.clone(),
            tools: self.config.tools.clone(),
        };
        if let Ok(json) = serde_json::to_string(&init) {
            lines.push(json);
        }

        // Add configured events
        for event in &self.config.events {
            match event {
                MockEvent::Permission { tool_name, file_path, .. } => {
                    // Permission prompts are plain text, not JSON
                    let file_part = file_path.as_ref()
                        .map(|p| format!(" to {}", p))
                        .unwrap_or_default();
                    lines.push(format!("Allow Mock to {}{}? (y/n)", tool_name.to_lowercase(), file_part));
                }
                _ => {
                    if let Ok(json) = serde_json::to_string(event) {
                        lines.push(json);
                    }
                }
            }
        }

        // Add result event
        let result = MockEvent::Result {
            subtype: "success".to_string(),
            input_tokens: Some(self.config.input_tokens),
            output_tokens: Some(self.config.output_tokens),
            duration_seconds: Some(1.5),
        };
        if let Ok(json) = serde_json::to_string(&result) {
            lines.push(json);
        }

        *output_lines = Some(lines.clone());
        lines
    }

    /// Reset the line counter for replay
    pub fn reset(&self) {
        self.current_line.store(0, Ordering::SeqCst);
    }

    /// Get the next line of output (for streaming simulation)
    pub fn next_line(&self) -> Option<String> {
        let lines = self.get_output_lines();
        let idx = self.current_line.fetch_add(1, Ordering::SeqCst);
        lines.get(idx).cloned()
    }

    /// Check if there are more lines to read
    pub fn has_more_lines(&self) -> bool {
        let lines = self.get_output_lines();
        self.current_line.load(Ordering::SeqCst) < lines.len()
    }

    /// Get total number of output lines
    pub fn total_lines(&self) -> usize {
        self.get_output_lines().len()
    }
}

impl Default for MockProvider {
    fn default() -> Self {
        Self::new()
    }
}

impl Clone for MockProvider {
    fn clone(&self) -> Self {
        Self::from_config(self.config.clone())
    }
}

impl AgentProvider for MockProvider {
    fn provider_id(&self) -> &'static str {
        PROVIDER_ID
    }

    fn display_name(&self) -> &'static str {
        DISPLAY_NAME
    }

    fn command(&self) -> &'static str {
        COMMAND
    }

    fn capabilities(&self) -> ProviderCapabilities {
        ProviderCapabilities {
            supports_resume: true,
            supports_streaming_json: true,
            supports_skip_permissions: true,
            supports_verbose: true,
            emits_tool_events: true,
            emits_thinking: true,
        }
    }

    fn build_command(&self, config: &AgentConfig) -> PtyConfig {
        // Mock provider doesn't actually spawn a process
        // This is here for interface compliance
        let mut args = vec!["--mock".to_string()];

        if let Some(ref session_id) = config.session_id {
            args.push("--resume".to_string());
            args.push(session_id.clone());
        }

        if !config.prompt.is_empty() {
            args.push("-p".to_string());
            args.push(config.prompt.clone());
        }

        if let Some(ref model) = config.model {
            args.push("--model".to_string());
            args.push(model.clone());
        }

        let mut env = self.default_env();
        env.extend(config.env.clone());

        PtyConfig {
            command: COMMAND.to_string(),
            args,
            cwd: Some(config.working_directory.clone()),
            env,
            cols: config.cols,
            rows: config.rows,
        }
    }

    fn parse_line(&self, line: &str) -> Option<UnifiedAgentEvent> {
        let trimmed = line.trim();
        if trimmed.is_empty() {
            return None;
        }

        // Check for permission prompt (plain text)
        if let Some(perm) = self.is_permission_prompt(trimmed) {
            return Some(UnifiedAgentEvent::Permission {
                tool_name: perm.tool_name,
                description: perm.description,
                file_path: perm.file_path,
            });
        }

        // Try to parse as JSON
        if !trimmed.starts_with('{') {
            return None;
        }

        let event: MockEvent = serde_json::from_str(trimmed).ok()?;

        match event {
            MockEvent::Init { session_id, model, tools } => {
                Some(UnifiedAgentEvent::Init { session_id, model, tools })
            }
            MockEvent::Assistant { content } => {
                let blocks: Vec<ContentBlock> = content.into_iter()
                    .map(|block| match block {
                        MockContentBlock::Text { text } => ContentBlock::Text { text },
                        MockContentBlock::ToolUse { id, name, input } => {
                            ContentBlock::ToolUse { id, name, input }
                        }
                        MockContentBlock::ToolResult { tool_use_id, content, is_error } => {
                            ContentBlock::ToolResult { tool_use_id, content, is_error }
                        }
                        MockContentBlock::Thinking { thinking } => {
                            ContentBlock::Thinking { thinking }
                        }
                    })
                    .collect();

                if blocks.is_empty() {
                    None
                } else {
                    Some(UnifiedAgentEvent::Message {
                        role: AgentMessageRole::Assistant,
                        content: blocks,
                    })
                }
            }
            MockEvent::User { content } => {
                let blocks: Vec<ContentBlock> = content.into_iter()
                    .map(|block| match block {
                        MockContentBlock::Text { text } => ContentBlock::Text { text },
                        MockContentBlock::ToolUse { id, name, input } => {
                            ContentBlock::ToolUse { id, name, input }
                        }
                        MockContentBlock::ToolResult { tool_use_id, content, is_error } => {
                            ContentBlock::ToolResult { tool_use_id, content, is_error }
                        }
                        MockContentBlock::Thinking { thinking } => {
                            ContentBlock::Thinking { thinking }
                        }
                    })
                    .collect();

                if blocks.is_empty() {
                    None
                } else {
                    Some(UnifiedAgentEvent::Message {
                        role: AgentMessageRole::User,
                        content: blocks,
                    })
                }
            }
            MockEvent::Result { subtype, input_tokens, output_tokens, duration_seconds } => {
                let status = match subtype.as_str() {
                    "success" => CompletionStatus::Success,
                    "error" => CompletionStatus::Error,
                    "interrupted" => CompletionStatus::Interrupted,
                    "timeout" => CompletionStatus::Timeout,
                    "killed" => CompletionStatus::Killed,
                    _ => CompletionStatus::Success,
                };

                let stats = if input_tokens.is_some() || output_tokens.is_some() {
                    Some(AgentStats {
                        input_tokens,
                        output_tokens,
                        total_tokens: match (input_tokens, output_tokens) {
                            (Some(i), Some(o)) => Some(i + o),
                            (Some(i), None) => Some(i),
                            (None, Some(o)) => Some(o),
                            _ => None,
                        },
                        duration_ms: duration_seconds.map(|d| (d * 1000.0) as i32),
                        tool_calls: None,
                        model: None,
                    })
                } else {
                    None
                };

                Some(UnifiedAgentEvent::Complete { status, stats })
            }
            MockEvent::Error { code, message } => {
                Some(UnifiedAgentEvent::Error { code, message })
            }
            MockEvent::Permission { tool_name, description, file_path } => {
                Some(UnifiedAgentEvent::Permission { tool_name, description, file_path })
            }
        }
    }

    fn is_permission_prompt(&self, line: &str) -> Option<PermissionRequest> {
        let trimmed = line.trim();

        // Mock permission prompt format: "Allow Mock to <action> <path>? (y/n)"
        if !trimmed.contains("Allow Mock to") || !trimmed.contains("(y/n)") {
            return None;
        }

        // Extract tool name from action verb
        let tool_name = if trimmed.contains("read") {
            "Read"
        } else if trimmed.contains("write") {
            "Write"
        } else if trimmed.contains("execute") || trimmed.contains("bash") || trimmed.contains("run") {
            "Bash"
        } else if trimmed.contains("delete") {
            "Delete"
        } else {
            "Tool"
        };

        // Try to extract file path
        let file_path = trimmed
            .split("to ")
            .nth(1)
            .and_then(|s| s.split('?').next())
            .map(|s| s.trim().to_string())
            .filter(|s| !s.is_empty() && *s != tool_name.to_lowercase());

        Some(PermissionRequest {
            tool_name: tool_name.to_string(),
            description: trimmed.to_string(),
            file_path,
            command: None,
        })
    }

    fn resume_args(&self, session_id: &str) -> Vec<String> {
        vec!["--resume".to_string(), session_id.to_string()]
    }

    fn approval_response(&self, approved: bool) -> &'static [u8] {
        if approved {
            b"y\n"
        } else {
            b"n\n"
        }
    }

    fn default_env(&self) -> HashMap<String, String> {
        let mut env = HashMap::new();
        env.insert("MOCK_PROVIDER".to_string(), "1".to_string());
        env.insert("NO_COLOR".to_string(), "1".to_string());
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
    // Provider Basic Tests
    // =========================================================================

    #[test]
    fn test_provider_id() {
        let provider = MockProvider::new();
        assert_eq!(provider.provider_id(), "mock");
        assert_eq!(provider.display_name(), "Mock Provider");
        assert_eq!(provider.command(), "mock-agent");
    }

    #[test]
    fn test_capabilities() {
        let provider = MockProvider::new();
        let caps = provider.capabilities();
        assert!(caps.supports_resume);
        assert!(caps.supports_streaming_json);
        assert!(caps.supports_skip_permissions);
        assert!(caps.supports_verbose);
        assert!(caps.emits_tool_events);
        assert!(caps.emits_thinking);
    }

    #[test]
    fn test_default_env() {
        let provider = MockProvider::new();
        let env = provider.default_env();
        assert_eq!(env.get("MOCK_PROVIDER"), Some(&"1".to_string()));
        assert_eq!(env.get("NO_COLOR"), Some(&"1".to_string()));
    }

    // =========================================================================
    // Build Command Tests
    // =========================================================================

    #[test]
    fn test_build_command_basic() {
        let provider = MockProvider::new();
        let config = AgentConfig::new("Test prompt", "/test/path");
        let pty_config = provider.build_command(&config);

        assert_eq!(pty_config.command, "mock-agent");
        assert!(pty_config.args.contains(&"--mock".to_string()));
        assert!(pty_config.args.contains(&"-p".to_string()));
        assert!(pty_config.args.contains(&"Test prompt".to_string()));
    }

    #[test]
    fn test_build_command_with_resume() {
        let provider = MockProvider::new();
        let config = AgentConfig::new("Continue", "/test/path")
            .with_session_id("session-456");
        let pty_config = provider.build_command(&config);

        assert!(pty_config.args.contains(&"--resume".to_string()));
        assert!(pty_config.args.contains(&"session-456".to_string()));
    }

    #[test]
    fn test_build_command_with_model() {
        let provider = MockProvider::new();
        let config = AgentConfig::new("Test", "/path")
            .with_model("custom-model");
        let pty_config = provider.build_command(&config);

        assert!(pty_config.args.contains(&"--model".to_string()));
        assert!(pty_config.args.contains(&"custom-model".to_string()));
    }

    #[test]
    fn test_resume_args() {
        let provider = MockProvider::new();
        let args = provider.resume_args("sess-789");
        assert_eq!(args, vec!["--resume", "sess-789"]);
    }

    #[test]
    fn test_approval_response() {
        let provider = MockProvider::new();
        assert_eq!(provider.approval_response(true), b"y\n");
        assert_eq!(provider.approval_response(false), b"n\n");
    }

    // =========================================================================
    // Builder Tests
    // =========================================================================

    #[test]
    fn test_builder_basic() {
        let provider = MockProvider::builder()
            .with_session_id("custom-session")
            .with_model("custom-model")
            .with_delay_ms(100)
            .build();

        assert_eq!(provider.config().session_id, "custom-session");
        assert_eq!(provider.config().model, "custom-model");
        assert_eq!(provider.config().delay_ms, 100);
    }

    #[test]
    fn test_builder_with_response() {
        let provider = MockProvider::builder()
            .with_response("Hello!")
            .with_response("How can I help?")
            .build();

        // Should have 2 events
        assert_eq!(provider.config().events.len(), 2);
    }

    #[test]
    fn test_builder_with_tool_call() {
        let provider = MockProvider::builder()
            .with_tool_call("Read", r#"{"file_path": "/test.rs"}"#, "fn main() {}")
            .build();

        // Should have 2 events: tool_use and tool_result
        assert_eq!(provider.config().events.len(), 2);
    }

    #[test]
    fn test_builder_with_permission() {
        let provider = MockProvider::builder()
            .with_permission_prompt("Write", "/src/file.rs")
            .build();

        assert!(provider.config().emit_permission_prompts);
        assert_eq!(provider.config().events.len(), 1);
    }

    #[test]
    fn test_builder_with_error() {
        let provider = MockProvider::builder()
            .with_error("rate_limit", "Too many requests")
            .build();

        assert_eq!(provider.config().events.len(), 1);
        match &provider.config().events[0] {
            MockEvent::Error { code, message } => {
                assert_eq!(code, "rate_limit");
                assert_eq!(message, "Too many requests");
            }
            _ => panic!("Expected Error event"),
        }
    }

    #[test]
    fn test_builder_with_thinking() {
        let provider = MockProvider::builder()
            .with_thinking("Let me analyze this...")
            .build();

        assert_eq!(provider.config().events.len(), 1);
    }

    #[test]
    fn test_builder_complex_scenario() {
        let provider = MockProvider::builder()
            .with_session_id("complex-session")
            .with_model("gpt-4")
            .with_tokens(500, 200)
            .with_thinking("Analyzing the code...")
            .with_response("I see the issue.")
            .with_tool_call("Read", r#"{"path": "/src/main.rs"}"#, "fn main() {}")
            .with_permission_prompt("Write", "/src/fix.rs")
            .with_response("Fixed!")
            .build();

        assert_eq!(provider.config().session_id, "complex-session");
        assert_eq!(provider.config().model, "gpt-4");
        assert_eq!(provider.config().input_tokens, 500);
        assert_eq!(provider.config().output_tokens, 200);
        assert_eq!(provider.config().events.len(), 6); // thinking, response, tool_use, tool_result, permission, response
    }

    // =========================================================================
    // Factory Method Tests
    // =========================================================================

    #[test]
    fn test_with_greeting() {
        let provider = MockProvider::with_greeting("Hello!");
        assert_eq!(provider.config().events.len(), 1);
    }

    #[test]
    fn test_with_tool_call_factory() {
        let provider = MockProvider::with_tool_call("Read", "file contents");
        assert_eq!(provider.config().events.len(), 4); // response, tool_use, tool_result, response
    }

    #[test]
    fn test_with_permission_factory() {
        let provider = MockProvider::with_permission("Write");
        assert_eq!(provider.config().events.len(), 3); // response, permission, response
        assert!(provider.config().emit_permission_prompts);
    }

    #[test]
    fn test_with_error_scenario() {
        let provider = MockProvider::with_error_scenario("context_exceeded", "Context too large");
        assert_eq!(provider.config().events.len(), 2); // response, error
    }

    // =========================================================================
    // Output Generation Tests
    // =========================================================================

    #[test]
    fn test_generate_mock_output() {
        let provider = MockProvider::builder()
            .with_response("Hello!")
            .build();

        let output = provider.generate_mock_output();

        // Should have init, assistant message, and result
        assert!(output.contains("init"));
        assert!(output.contains("Hello!"));
        assert!(output.contains("result"));
    }

    #[test]
    fn test_next_line() {
        let provider = MockProvider::builder()
            .with_response("Test")
            .build();

        let line1 = provider.next_line();
        assert!(line1.is_some());
        assert!(line1.unwrap().contains("init"));

        let line2 = provider.next_line();
        assert!(line2.is_some());
        assert!(line2.unwrap().contains("Test"));
    }

    #[test]
    fn test_reset() {
        let provider = MockProvider::builder()
            .with_response("Test")
            .build();

        // Read all lines
        while provider.has_more_lines() {
            provider.next_line();
        }
        assert!(!provider.has_more_lines());

        // Reset
        provider.reset();
        assert!(provider.has_more_lines());
    }

    #[test]
    fn test_total_lines() {
        let provider = MockProvider::builder()
            .with_response("Line 1")
            .with_response("Line 2")
            .build();

        // init + 2 responses + result = 4
        assert_eq!(provider.total_lines(), 4);
    }

    // =========================================================================
    // Parse Line Tests
    // =========================================================================

    #[test]
    fn test_parse_init_event() {
        let provider = MockProvider::new();
        let line = r#"{"type":"init","session_id":"test-123","model":"mock-v1","tools":["Read","Write"]}"#;

        let event = provider.parse_line(line).expect("Should parse init");

        match event {
            UnifiedAgentEvent::Init { session_id, model, tools } => {
                assert_eq!(session_id, "test-123");
                assert_eq!(model, "mock-v1");
                assert_eq!(tools, vec!["Read", "Write"]);
            }
            _ => panic!("Expected Init event"),
        }
    }

    #[test]
    fn test_parse_assistant_text() {
        let provider = MockProvider::new();
        let line = r#"{"type":"assistant","content":[{"type":"text","text":"Hello!"}]}"#;

        let event = provider.parse_line(line).expect("Should parse assistant");

        match event {
            UnifiedAgentEvent::Message { role, content } => {
                assert_eq!(role, AgentMessageRole::Assistant);
                assert_eq!(content.len(), 1);
                assert!(content[0].is_text());
            }
            _ => panic!("Expected Message event"),
        }
    }

    #[test]
    fn test_parse_tool_use() {
        let provider = MockProvider::new();
        let line = r#"{"type":"assistant","content":[{"type":"tool_use","id":"t1","name":"Read","input":{"path":"/test.rs"}}]}"#;

        let event = provider.parse_line(line).expect("Should parse tool use");

        match event {
            UnifiedAgentEvent::Message { content, .. } => {
                assert!(content[0].is_tool_use());
            }
            _ => panic!("Expected Message event"),
        }
    }

    #[test]
    fn test_parse_tool_result() {
        let provider = MockProvider::new();
        let line = r#"{"type":"user","content":[{"type":"tool_result","tool_use_id":"t1","content":"file contents","is_error":false}]}"#;

        let event = provider.parse_line(line).expect("Should parse tool result");

        match event {
            UnifiedAgentEvent::Message { role, content } => {
                assert_eq!(role, AgentMessageRole::User);
                assert!(content[0].is_tool_result());
            }
            _ => panic!("Expected Message event"),
        }
    }

    #[test]
    fn test_parse_result_success() {
        let provider = MockProvider::new();
        let line = r#"{"type":"result","subtype":"success","input_tokens":100,"output_tokens":50,"duration_seconds":1.5}"#;

        let event = provider.parse_line(line).expect("Should parse result");

        match event {
            UnifiedAgentEvent::Complete { status, stats } => {
                assert!(status.is_success());
                let stats = stats.expect("Should have stats");
                assert_eq!(stats.input_tokens, Some(100));
                assert_eq!(stats.output_tokens, Some(50));
                assert_eq!(stats.duration_ms, Some(1500));
            }
            _ => panic!("Expected Complete event"),
        }
    }

    #[test]
    fn test_parse_error() {
        let provider = MockProvider::new();
        let line = r#"{"type":"error","code":"test_error","message":"Test error message"}"#;

        let event = provider.parse_line(line).expect("Should parse error");

        match event {
            UnifiedAgentEvent::Error { code, message } => {
                assert_eq!(code, "test_error");
                assert_eq!(message, "Test error message");
            }
            _ => panic!("Expected Error event"),
        }
    }

    #[test]
    fn test_parse_empty_line() {
        let provider = MockProvider::new();
        assert!(provider.parse_line("").is_none());
        assert!(provider.parse_line("   ").is_none());
    }

    #[test]
    fn test_parse_non_json() {
        let provider = MockProvider::new();
        assert!(provider.parse_line("not json").is_none());
    }

    #[test]
    fn test_parse_invalid_json() {
        let provider = MockProvider::new();
        assert!(provider.parse_line("{invalid}").is_none());
    }

    // =========================================================================
    // Permission Prompt Tests
    // =========================================================================

    #[test]
    fn test_permission_prompt_write() {
        let provider = MockProvider::new();
        let line = "Allow Mock to write to /src/main.rs? (y/n)";

        let perm = provider.is_permission_prompt(line).expect("Should detect permission");
        assert_eq!(perm.tool_name, "Write");
        assert_eq!(perm.file_path, Some("/src/main.rs".to_string()));
    }

    #[test]
    fn test_permission_prompt_read() {
        let provider = MockProvider::new();
        let line = "Allow Mock to read /config/settings.json? (y/n)";

        let perm = provider.is_permission_prompt(line).expect("Should detect permission");
        assert_eq!(perm.tool_name, "Read");
    }

    #[test]
    fn test_permission_prompt_bash() {
        let provider = MockProvider::new();
        let line = "Allow Mock to execute bash command? (y/n)";

        let perm = provider.is_permission_prompt(line).expect("Should detect permission");
        assert_eq!(perm.tool_name, "Bash");
    }

    #[test]
    fn test_not_permission_prompt() {
        let provider = MockProvider::new();
        assert!(provider.is_permission_prompt("Hello world").is_none());
        assert!(provider.is_permission_prompt("Allow other tool").is_none());
        assert!(provider.is_permission_prompt("Mock (y/n)").is_none());
    }

    // =========================================================================
    // Integration Tests
    // =========================================================================

    #[test]
    fn test_full_flow_parsing() {
        let provider = MockProvider::builder()
            .with_session_id("test-session")
            .with_model("test-model")
            .with_response("Starting work")
            .with_tool_call("Read", r#"{"file": "test.rs"}"#, "fn main() {}")
            .with_response("Done!")
            .build();

        let output = provider.generate_mock_output();
        let mut events: Vec<UnifiedAgentEvent> = Vec::new();

        for line in output.lines() {
            if let Some(event) = provider.parse_line(line) {
                events.push(event);
            }
        }

        // init, response, tool_use (in message), tool_result (in message), response, complete
        assert_eq!(events.len(), 6);
        assert!(events[0].is_init());
        assert!(events[1].is_message());
        assert!(events[2].is_message()); // tool_use
        assert!(events[3].is_message()); // tool_result
        assert!(events[4].is_message());
        assert!(events[5].is_complete());
    }

    #[test]
    fn test_with_events() {
        let events = vec![
            UnifiedAgentEvent::init("sess-1", "model-1", vec!["Read".to_string()]),
            UnifiedAgentEvent::assistant_text("Hello!"),
            UnifiedAgentEvent::complete_success(None),
        ];

        let provider = MockProvider::with_events(events.clone());

        // Config should have the events (excluding init which is generated separately)
        assert!(provider.config().events.len() >= 2);
    }

    #[test]
    fn test_clone() {
        let provider = MockProvider::builder()
            .with_session_id("clone-test")
            .with_response("Test")
            .build();

        let cloned = provider.clone();
        assert_eq!(cloned.config().session_id, "clone-test");
        assert_eq!(cloned.config().events.len(), 1);
    }

    #[test]
    fn test_streaming_simulation() {
        let provider = MockProvider::builder()
            .with_response("Message 1")
            .with_response("Message 2")
            .build();

        let mut collected = Vec::new();

        while provider.has_more_lines() {
            if let Some(line) = provider.next_line() {
                if let Some(event) = provider.parse_line(&line) {
                    collected.push(event);
                }
            }
        }

        // init + 2 messages + result = 4
        assert_eq!(collected.len(), 4);
    }
}
