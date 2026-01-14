//! Claude Code CLI Provider
//!
//! Implementation of the `AgentProvider` trait for Claude Code CLI.
//! This provider parses Claude Code's `--output-format stream-json` output
//! into the unified `UnifiedAgentEvent` format.
//!
//! # Claude Code Output Format
//!
//! When running with `claude --output-format stream-json`, the CLI outputs
//! newline-delimited JSON (NDJSON) with the following event types:
//!
//! - `system` with `subtype: "init"` - Session initialization
//! - `assistant` - AI assistant message with content blocks
//! - `user` - User message (typically tool results)
//! - `result` - Session completion
//!
//! # Content Blocks
//!
//! Messages contain content blocks which can be:
//! - `text` - Plain text response
//! - `tool_use` - Tool invocation with id, name, and input
//! - `tool_result` - Result from a tool execution
//! - `thinking` - Extended thinking/reasoning content
//!
//! # Example Output
//!
//! ```json
//! {"type":"system","subtype":"init","session_id":"abc123","model":"claude-sonnet-4-20250514","tools":["Read","Write","Bash"]}
//! {"type":"assistant","message":{"content":[{"type":"text","text":"Let me help you with that."}]}}
//! {"type":"assistant","message":{"content":[{"type":"tool_use","id":"tool_1","name":"Read","input":{"file_path":"/src/main.rs"}}]}}
//! {"type":"user","message":{"content":[{"type":"tool_result","tool_use_id":"tool_1","content":"file contents...","is_error":false}]}}
//! {"type":"result","subtype":"success","total_cost":0.05}
//! ```

use std::collections::HashMap;
use std::sync::LazyLock;

use regex::Regex;
use serde::{Deserialize, Serialize};

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
pub const PROVIDER_ID: &str = "claude-code";

/// Display name for UI
pub const DISPLAY_NAME: &str = "Claude Code";

/// CLI command name
pub const COMMAND: &str = "claude";

// =============================================================================
// Permission Detection Regex
// =============================================================================

/// Comprehensive regex patterns for detecting Claude Code permission prompts.
/// Covers multiple prompt formats including standard, bracket, and tool-specific patterns.
static PERMISSION_PATTERNS: LazyLock<Vec<Regex>> = LazyLock::new(|| {
    vec![
        // Standard format with parentheses: "Allow Claude to write to file.txt? (y/n)"
        Regex::new(r"(?i)Allow\s+.*\s+to\s+(read|write|execute|bash|run|delete|create).*\?\s*\(y/n\)")
            .expect("Invalid permission regex: standard format"),
        
        // Bracket format: "Allow to run this command? [y/n]"
        Regex::new(r"(?i)Allow\s+.*\s+to\s+(read|write|execute|bash|run|delete|create).*\?\s*\[y/n\]")
            .expect("Invalid permission regex: bracket format"),
        
        // Question mark only - catches prompts without explicit (y/n): "read file.txt?"
        Regex::new(r"(?i)(read|write|execute|run|delete|create)\s+.*\?\s*$")
            .expect("Invalid permission regex: question only"),
        
        // Tool-specific: Claude writing to path
        Regex::new(r"(?i)Allow\s+Claude\s+to\s+write\s+to\s+(.+)\?")
            .expect("Invalid permission regex: Claude write"),
        
        // Tool-specific: Claude reading file with optional quotes (backtick, single, double)
        Regex::new(r#"(?i)Allow\s+Claude\s+to\s+read\s+file\s+[`'"]?(.+)[`'"]?\?"#)
            .expect("Invalid permission regex: Claude read"),
        
        // Tool-specific: Claude executing bash
        Regex::new(r"(?i)Allow\s+Claude\s+to\s+execute\s+bash\s+command\?")
            .expect("Invalid permission regex: Claude bash"),
        
        // Generic "Allow" with question - catches edge cases
        Regex::new(r"(?i)Allow\s+.*\?\s*[\(\[]?y/n[\)\]]?")
            .expect("Invalid permission regex: generic allow"),
    ]
});

/// Regex for extracting file path from permission prompt
static FILE_PATH_REGEX: LazyLock<Regex> = LazyLock::new(|| {
    Regex::new(r#"(?:to\s+|file\s+|path\s+)?["`']?(/[^\s"'`?]+|[A-Za-z]:\\[^\s"'`?]+)["`']?"#)
        .expect("Invalid file path regex")
});

// =============================================================================
// Claude Event Types (for parsing)
// =============================================================================

/// Claude Code stream-json event types.
/// These match the JSON lines output from `claude --output-format stream-json`.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type", rename_all = "snake_case")]
pub enum ClaudeEvent {
    /// System events (init, error, etc.)
    #[serde(rename = "system")]
    System {
        subtype: String,
        /// Session ID from Claude Code (present in "init" subtype events)
        #[serde(default)]
        session_id: Option<String>,
        /// Model being used
        #[serde(default)]
        model: Option<String>,
        /// Available tools
        #[serde(default)]
        tools: Option<Vec<String>>,
        /// Additional data
        #[serde(flatten)]
        data: serde_json::Value,
    },
    /// Assistant messages with content blocks
    #[serde(rename = "assistant")]
    Assistant { message: ClaudeMessage },
    /// User messages (typically containing tool results)
    #[serde(rename = "user")]
    User { message: ClaudeMessage },
    /// Result/completion events
    #[serde(rename = "result")]
    Result {
        subtype: String,
        /// Cost information
        #[serde(default)]
        total_cost: Option<f64>,
        /// Token usage
        #[serde(default)]
        input_tokens: Option<i32>,
        #[serde(default)]
        output_tokens: Option<i32>,
        /// Duration in seconds
        #[serde(default)]
        duration_seconds: Option<f64>,
        /// Additional data
        #[serde(flatten)]
        data: serde_json::Value,
    },
}

/// Claude message containing content blocks
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ClaudeMessage {
    /// Content blocks array - can contain text, tool_use, tool_result, thinking
    #[serde(default)]
    pub content: Vec<ClaudeContentBlock>,
    /// Role (usually implicit from event type)
    #[serde(default)]
    pub role: Option<String>,
    /// Additional fields
    #[serde(flatten)]
    pub extra: serde_json::Value,
}

/// Claude content block types
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type", rename_all = "snake_case")]
pub enum ClaudeContentBlock {
    /// Plain text content
    Text {
        text: String,
    },
    /// Tool use request
    ToolUse {
        id: String,
        name: String,
        input: serde_json::Value,
    },
    /// Tool result
    ToolResult {
        tool_use_id: String,
        content: serde_json::Value,
        #[serde(default)]
        is_error: bool,
    },
    /// Thinking/reasoning content
    Thinking {
        thinking: String,
    },
}

// =============================================================================
// ClaudeCodeProvider
// =============================================================================

/// Provider implementation for Claude Code CLI
#[derive(Debug, Default)]
pub struct ClaudeCodeProvider;

impl ClaudeCodeProvider {
    /// Create a new Claude Code provider
    pub fn new() -> Self {
        Self
    }

    /// Parse a Claude content block into our unified format
    fn convert_content_block(block: &ClaudeContentBlock) -> ContentBlock {
        match block {
            ClaudeContentBlock::Text { text } => ContentBlock::text(text),
            ClaudeContentBlock::ToolUse { id, name, input } => {
                ContentBlock::tool_use(id, name, input.clone())
            }
            ClaudeContentBlock::ToolResult {
                tool_use_id,
                content,
                is_error,
            } => {
                let content_str = if content.is_string() {
                    content.as_str().unwrap_or("").to_string()
                } else {
                    content.to_string()
                };
                ContentBlock::tool_result(tool_use_id, content_str, *is_error)
            }
            ClaudeContentBlock::Thinking { thinking } => ContentBlock::thinking(thinking),
        }
    }

    /// Parse a ClaudeEvent into UnifiedAgentEvent
    fn convert_event(event: ClaudeEvent) -> Option<UnifiedAgentEvent> {
        match event {
            ClaudeEvent::System {
                subtype,
                session_id,
                model,
                tools,
                data,
            } => {
                match subtype.as_str() {
                    "init" => {
                        // Init event with session info
                        let sid = session_id.unwrap_or_else(|| {
                            data.get("session_id")
                                .and_then(|v| v.as_str())
                                .unwrap_or("unknown")
                                .to_string()
                        });
                        let m = model.unwrap_or_else(|| {
                            data.get("model")
                                .and_then(|v| v.as_str())
                                .unwrap_or("claude-sonnet")
                                .to_string()
                        });
                        let t = tools.unwrap_or_else(|| {
                            data.get("tools")
                                .and_then(|v| v.as_array())
                                .map(|arr| {
                                    arr.iter()
                                        .filter_map(|v| v.as_str().map(String::from))
                                        .collect()
                                })
                                .unwrap_or_default()
                        });
                        Some(UnifiedAgentEvent::init(sid, m, t))
                    }
                    "error" => {
                        // Error event
                        let code = data
                            .get("code")
                            .and_then(|v| v.as_str())
                            .unwrap_or("system_error")
                            .to_string();
                        let message = data
                            .get("message")
                            .and_then(|v| v.as_str())
                            .unwrap_or("System error occurred")
                            .to_string();
                        Some(UnifiedAgentEvent::error(code, message))
                    }
                    _ => {
                        // Other system events - emit as system message
                        let text = format!("[system:{}] {}", subtype, data);
                        Some(UnifiedAgentEvent::message(
                            AgentMessageRole::System,
                            vec![ContentBlock::text(text)],
                        ))
                    }
                }
            }
            ClaudeEvent::Assistant { message } => {
                if message.content.is_empty() {
                    return None;
                }

                // Convert all content blocks
                let content: Vec<ContentBlock> = message
                    .content
                    .iter()
                    .map(Self::convert_content_block)
                    .collect();

                // Check if this is primarily a tool use event
                // If there's a single tool_use block (possibly with preceding text), emit ToolUse event
                let tool_uses: Vec<_> = message
                    .content
                    .iter()
                    .filter_map(|b| {
                        if let ClaudeContentBlock::ToolUse { id, name, input } = b {
                            Some((id.clone(), name.clone(), input.clone()))
                        } else {
                            None
                        }
                    })
                    .collect();

                if tool_uses.len() == 1 {
                    // Single tool use - can emit separate ToolUse event
                    // But we still want the full message context, so emit Message
                }

                Some(UnifiedAgentEvent::message(
                    AgentMessageRole::Assistant,
                    content,
                ))
            }
            ClaudeEvent::User { message } => {
                if message.content.is_empty() {
                    return None;
                }

                // Convert content blocks
                let content: Vec<ContentBlock> = message
                    .content
                    .iter()
                    .map(Self::convert_content_block)
                    .collect();

                // Check for tool results to emit ToolResult events
                for block in &message.content {
                    if let ClaudeContentBlock::ToolResult {
                        tool_use_id,
                        content,
                        is_error,
                    } = block
                    {
                        // We could emit separate ToolResult events here,
                        // but the Message event already captures this context
                        let _ = (tool_use_id, content, is_error);
                    }
                }

                Some(UnifiedAgentEvent::message(AgentMessageRole::User, content))
            }
            ClaudeEvent::Result {
                subtype,
                input_tokens,
                output_tokens,
                duration_seconds,
                ..
            } => {
                let status = match subtype.as_str() {
                    "success" => CompletionStatus::Success,
                    "error" | "failure" => CompletionStatus::Error,
                    "interrupted" | "cancelled" => CompletionStatus::Interrupted,
                    "timeout" => CompletionStatus::Timeout,
                    _ => CompletionStatus::Success,
                };

                let stats = if input_tokens.is_some() || output_tokens.is_some() {
                    let mut s = AgentStats::new();
                    s.input_tokens = input_tokens;
                    s.output_tokens = output_tokens;
                    s.total_tokens = match (input_tokens, output_tokens) {
                        (Some(i), Some(o)) => Some(i + o),
                        (Some(i), None) => Some(i),
                        (None, Some(o)) => Some(o),
                        _ => None,
                    };
                    s.duration_ms = duration_seconds.map(|d| (d * 1000.0) as i32);
                    Some(s)
                } else {
                    None
                };

                Some(UnifiedAgentEvent::Complete { status, stats })
            }
        }
    }

    /// Extract tool name from permission prompt
    fn extract_tool_name(prompt: &str) -> String {
        let lower = prompt.to_lowercase();
        if lower.contains("write") || lower.contains("create") || lower.contains("modify") {
            "Write".to_string()
        } else if lower.contains("read") || lower.contains("access") {
            "Read".to_string()
        } else if lower.contains("execute")
            || lower.contains("bash")
            || lower.contains("run")
            || lower.contains("shell")
        {
            "Bash".to_string()
        } else if lower.contains("delete") || lower.contains("remove") {
            "Delete".to_string()
        } else {
            "Tool".to_string()
        }
    }

    /// Extract file path from permission prompt
    fn extract_file_path(prompt: &str) -> Option<String> {
        // Try regex first
        if let Some(caps) = FILE_PATH_REGEX.captures(prompt) {
            return caps.get(1).map(|m| m.as_str().to_string());
        }

        // Fallback: look for path-like strings
        for word in prompt.split_whitespace() {
            let word = word.trim_matches(|c| c == '?' || c == '"' || c == '\'' || c == '`');
            if word.starts_with('/') || word.contains(":\\") {
                return Some(word.to_string());
            }
        }
        None
    }
}

impl AgentProvider for ClaudeCodeProvider {
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
        let mut args = vec![
            "--output-format".to_string(),
            "stream-json".to_string(),
            "--verbose".to_string(),
        ];

        // Add model if specified
        if let Some(model) = &config.model {
            args.push("--model".to_string());
            args.push(model.clone());
        }

        // Handle resume or new session
        if let Some(session_id) = &config.session_id {
            args.push("--resume".to_string());
            args.push(session_id.clone());
        }

        // Add prompt
        if !config.prompt.is_empty() {
            args.push("-p".to_string());
            args.push(config.prompt.clone());
        }

        // Merge environment variables
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
        if trimmed.is_empty() || !trimmed.starts_with('{') {
            return None;
        }

        // Try to parse as ClaudeEvent
        match serde_json::from_str::<ClaudeEvent>(trimmed) {
            Ok(event) => Self::convert_event(event),
            Err(_) => {
                // Try parsing as raw JSON and extracting type
                if let Ok(value) = serde_json::from_str::<serde_json::Value>(trimmed) {
                    // Handle edge cases where serde's tag parsing fails
                    let event_type = value.get("type").and_then(|t| t.as_str())?;
                    match event_type {
                        "system" => {
                            let subtype = value
                                .get("subtype")
                                .and_then(|s| s.as_str())
                                .unwrap_or("unknown");
                            if subtype == "init" {
                                let session_id = value
                                    .get("session_id")
                                    .and_then(|s| s.as_str())
                                    .unwrap_or("unknown")
                                    .to_string();
                                let model = value
                                    .get("model")
                                    .and_then(|s| s.as_str())
                                    .unwrap_or("claude")
                                    .to_string();
                                let tools = value
                                    .get("tools")
                                    .and_then(|t| t.as_array())
                                    .map(|arr| {
                                        arr.iter()
                                            .filter_map(|v| v.as_str().map(String::from))
                                            .collect()
                                    })
                                    .unwrap_or_default();
                                return Some(UnifiedAgentEvent::init(session_id, model, tools));
                            }
                        }
                        "result" => {
                            let subtype = value
                                .get("subtype")
                                .and_then(|s| s.as_str())
                                .unwrap_or("success");
                            let status = match subtype {
                                "success" => CompletionStatus::Success,
                                "error" => CompletionStatus::Error,
                                _ => CompletionStatus::Success,
                            };
                            return Some(UnifiedAgentEvent::Complete { status, stats: None });
                        }
                        _ => {}
                    }
                }
                None
            }
        }
    }

    fn is_permission_prompt(&self, line: &str) -> Option<PermissionRequest> {
        let trimmed = line.trim();

        // Early exit for obviously non-permission lines
        if trimmed.is_empty() || !trimmed.contains('?') {
            return None;
        }

        // Primary detection: Check if any comprehensive permission pattern matches
        let regex_match = PERMISSION_PATTERNS.iter().any(|pattern| pattern.is_match(trimmed));
        
        if regex_match {
            let tool_name = Self::extract_tool_name(trimmed);
            let file_path = Self::extract_file_path(trimmed);

            return Some(PermissionRequest {
                tool_name,
                description: trimmed.to_string(),
                file_path,
                command: None,
            });
        }

        // Fallback heuristics for edge cases that regex patterns might miss
        let lower = trimmed.to_lowercase();
        
        // Heuristic 1: Contains "allow" keyword and ends with question mark
        let has_allow = lower.contains("allow");
        let ends_with_question = trimmed.trim_end().ends_with('?');
        
        // Heuristic 2: Contains y/n or yes/no prompt indicators
        let has_yn_prompt = lower.contains("(y/n)") 
            || lower.contains("[y/n]") 
            || lower.contains("(yes/no)")
            || lower.contains("[yes/no]");
        
        // Heuristic 3: Contains permission-related action verbs
        let has_permission_verb = lower.contains("read") 
            || lower.contains("write") 
            || lower.contains("execute") 
            || lower.contains("run") 
            || lower.contains("delete") 
            || lower.contains("create")
            || lower.contains("modify")
            || lower.contains("access");
        
        // Combine heuristics: if it has allow + question mark, or has y/n prompt + permission verb
        // Note: (has_allow && has_permission_verb && ends_with_question) is redundant 
        // since (has_allow && ends_with_question) is a superset
        let is_likely_permission =
            (has_allow && ends_with_question) || (has_yn_prompt && has_permission_verb);
        
        if is_likely_permission {
            let tool_name = Self::extract_tool_name(trimmed);
            let file_path = Self::extract_file_path(trimmed);

            return Some(PermissionRequest {
                tool_name,
                description: trimmed.to_string(),
                file_path,
                command: None,
            });
        }

        // No match found
        None
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
        // Disable colors for clean JSON parsing
        env.insert("NO_COLOR".to_string(), "1".to_string());
        env.insert("FORCE_COLOR".to_string(), "0".to_string());
        env.insert("TERM".to_string(), "dumb".to_string());
        // Claude Code specific - ensure JSON output
        env.insert("CLAUDE_CODE_ENTRYPOINT".to_string(), "cli".to_string());
        env
    }

    fn permission_patterns(&self) -> Vec<&Regex> {
        PERMISSION_PATTERNS.iter().collect()
    }

    fn extract_tool_context(&self, tool_name: &str, input: &serde_json::Value) -> super::ToolContext {
        let mut context = super::ToolContext::new();

        // Extract based on tool type
        match tool_name {
            "Bash" | "bash" | "shell" => {
                // Try to extract command from various field names
                if let Some(cmd) = input.get("command").and_then(|v| v.as_str()) {
                    context.command = Some(cmd.to_string());
                } else if let Some(cmd) = input.get("cmd").and_then(|v| v.as_str()) {
                    context.command = Some(cmd.to_string());
                } else if let Some(cmd) = input.get("script").and_then(|v| v.as_str()) {
                    context.command = Some(cmd.to_string());
                }

                // Try to extract working directory
                if let Some(wd) = input.get("working_directory").and_then(|v| v.as_str()) {
                    context.working_directory = Some(wd.to_string());
                } else if let Some(wd) = input.get("cwd").and_then(|v| v.as_str()) {
                    context.working_directory = Some(wd.to_string());
                }
            }
            "Read" | "read" | "Write" | "write" | "Edit" | "edit" => {
                // Try to extract file path from various field names
                if let Some(path) = input.get("file_path").and_then(|v| v.as_str()) {
                    context.file_path = Some(path.to_string());
                } else if let Some(path) = input.get("filePath").and_then(|v| v.as_str()) {
                    context.file_path = Some(path.to_string());
                } else if let Some(path) = input.get("path").and_then(|v| v.as_str()) {
                    context.file_path = Some(path.to_string());
                } else if let Some(path) = input.get("file").and_then(|v| v.as_str()) {
                    context.file_path = Some(path.to_string());
                }
            }
            _ => {
                // For other tools, try generic extraction
                if let Some(path) = input.get("file_path").and_then(|v| v.as_str()) {
                    context.file_path = Some(path.to_string());
                } else if let Some(path) = input.get("path").and_then(|v| v.as_str()) {
                    context.file_path = Some(path.to_string());
                }

                if let Some(cmd) = input.get("command").and_then(|v| v.as_str()) {
                    context.command = Some(cmd.to_string());
                }
            }
        }

        context
    }

    fn parse_error_output(&self, line: &str) -> Option<super::ExecutionError> {
        let trimmed = line.trim();

        // Try to parse as JSON first
        if let Ok(value) = serde_json::from_str::<serde_json::Value>(trimmed) {
            // Check for Claude Code error format
            if let Some(event_type) = value.get("type").and_then(|t| t.as_str()) {
                if event_type == "system" {
                    if let Some(subtype) = value.get("subtype").and_then(|s| s.as_str()) {
                        if subtype == "error" {
                            let code = value
                                .get("code")
                                .and_then(|c| c.as_str())
                                .unwrap_or("unknown_error")
                                .to_string();
                            let message = value
                                .get("message")
                                .and_then(|m| m.as_str())
                                .unwrap_or("Unknown error")
                                .to_string();

                            return Some(super::ExecutionError::provider_error(
                                PROVIDER_ID,
                                code,
                                message,
                            ));
                        }
                    }
                }
            }
        }

        // Check for common error patterns in plain text
        let lower = trimmed.to_lowercase();
        if lower.contains("error:") || lower.contains("failed:") || lower.contains("exception:") {
            return Some(super::ExecutionError::other(trimmed.to_string()));
        }

        None
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
        let provider = ClaudeCodeProvider::new();
        assert_eq!(provider.provider_id(), "claude-code");
        assert_eq!(provider.display_name(), "Claude Code");
        assert_eq!(provider.command(), "claude");
    }

    #[test]
    fn test_capabilities() {
        let provider = ClaudeCodeProvider::new();
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
        let provider = ClaudeCodeProvider::new();
        let env = provider.default_env();
        assert_eq!(env.get("NO_COLOR"), Some(&"1".to_string()));
        assert_eq!(env.get("FORCE_COLOR"), Some(&"0".to_string()));
        assert_eq!(env.get("TERM"), Some(&"dumb".to_string()));
    }

    // =========================================================================
    // Build Command Tests
    // =========================================================================

    #[test]
    fn test_build_command_basic() {
        let provider = ClaudeCodeProvider::new();
        let config = AgentConfig::new("Fix the bug", "/path/to/project");
        let pty_config = provider.build_command(&config);

        assert_eq!(pty_config.command, "claude");
        assert!(pty_config.args.contains(&"--output-format".to_string()));
        assert!(pty_config.args.contains(&"stream-json".to_string()));
        assert!(pty_config.args.contains(&"--verbose".to_string()));
        assert!(pty_config.args.contains(&"-p".to_string()));
        assert!(pty_config.args.contains(&"Fix the bug".to_string()));
    }

    #[test]
    fn test_build_command_with_resume() {
        let provider = ClaudeCodeProvider::new();
        let config =
            AgentConfig::new("Continue work", "/path/to/project").with_session_id("session-123");
        let pty_config = provider.build_command(&config);

        assert!(pty_config.args.contains(&"--resume".to_string()));
        assert!(pty_config.args.contains(&"session-123".to_string()));
    }

    #[test]
    fn test_build_command_with_model() {
        let provider = ClaudeCodeProvider::new();
        let config =
            AgentConfig::new("Test prompt", "/path/to/project").with_model("claude-opus-4");
        let pty_config = provider.build_command(&config);

        assert!(pty_config.args.contains(&"--model".to_string()));
        assert!(pty_config.args.contains(&"claude-opus-4".to_string()));
    }

    #[test]
    fn test_resume_args() {
        let provider = ClaudeCodeProvider::new();
        let args = provider.resume_args("sess-abc");
        assert_eq!(args, vec!["--resume", "sess-abc"]);
    }

    #[test]
    fn test_approval_response() {
        let provider = ClaudeCodeProvider::new();
        assert_eq!(provider.approval_response(true), b"y\n");
        assert_eq!(provider.approval_response(false), b"n\n");
    }

    // =========================================================================
    // Parse Line Tests - System Events
    // =========================================================================

    #[test]
    fn test_parse_init_event() {
        let provider = ClaudeCodeProvider::new();
        let line =
            r#"{"type":"system","subtype":"init","session_id":"abc123","model":"claude-sonnet-4","tools":["Read","Write","Bash"]}"#;

        let event = provider.parse_line(line).expect("Should parse init event");

        match event {
            UnifiedAgentEvent::Init {
                session_id,
                model,
                tools,
            } => {
                assert_eq!(session_id, "abc123");
                assert_eq!(model, "claude-sonnet-4");
                assert_eq!(tools, vec!["Read", "Write", "Bash"]);
            }
            _ => panic!("Expected Init event, got {:?}", event),
        }
    }

    #[test]
    fn test_parse_system_error() {
        let provider = ClaudeCodeProvider::new();
        let line =
            r#"{"type":"system","subtype":"error","code":"rate_limit","message":"Too many requests"}"#;

        let event = provider.parse_line(line).expect("Should parse error event");

        match event {
            UnifiedAgentEvent::Error { code, message } => {
                assert_eq!(code, "rate_limit");
                assert_eq!(message, "Too many requests");
            }
            _ => panic!("Expected Error event, got {:?}", event),
        }
    }

    // =========================================================================
    // Parse Line Tests - Assistant Messages
    // =========================================================================

    #[test]
    fn test_parse_assistant_text() {
        let provider = ClaudeCodeProvider::new();
        let line = r#"{"type":"assistant","message":{"content":[{"type":"text","text":"Hello, how can I help you today?"}]}}"#;

        let event = provider
            .parse_line(line)
            .expect("Should parse assistant text");

        match event {
            UnifiedAgentEvent::Message { role, content } => {
                assert_eq!(role, AgentMessageRole::Assistant);
                assert_eq!(content.len(), 1);
                assert!(content[0].is_text());
                assert_eq!(
                    content[0].as_text(),
                    Some("Hello, how can I help you today?")
                );
            }
            _ => panic!("Expected Message event, got {:?}", event),
        }
    }

    #[test]
    fn test_parse_assistant_tool_use() {
        let provider = ClaudeCodeProvider::new();
        let line = r#"{"type":"assistant","message":{"content":[{"type":"tool_use","id":"tool_1","name":"Read","input":{"file_path":"/src/main.rs"}}]}}"#;

        let event = provider.parse_line(line).expect("Should parse tool use");

        match event {
            UnifiedAgentEvent::Message { role, content } => {
                assert_eq!(role, AgentMessageRole::Assistant);
                assert_eq!(content.len(), 1);
                assert!(content[0].is_tool_use());
                if let Some((id, name, input)) = content[0].as_tool_use() {
                    assert_eq!(id, "tool_1");
                    assert_eq!(name, "Read");
                    assert_eq!(
                        input.get("file_path").and_then(|v| v.as_str()),
                        Some("/src/main.rs")
                    );
                }
            }
            _ => panic!("Expected Message event, got {:?}", event),
        }
    }

    #[test]
    fn test_parse_assistant_with_thinking() {
        let provider = ClaudeCodeProvider::new();
        let line = r#"{"type":"assistant","message":{"content":[{"type":"thinking","thinking":"Let me analyze this code..."},{"type":"text","text":"I see the issue."}]}}"#;

        let event = provider
            .parse_line(line)
            .expect("Should parse thinking message");

        match event {
            UnifiedAgentEvent::Message { role, content } => {
                assert_eq!(role, AgentMessageRole::Assistant);
                assert_eq!(content.len(), 2);
                assert!(content[0].is_thinking());
                assert!(content[1].is_text());
            }
            _ => panic!("Expected Message event, got {:?}", event),
        }
    }

    // =========================================================================
    // Parse Line Tests - User Messages (Tool Results)
    // =========================================================================

    #[test]
    fn test_parse_tool_result() {
        let provider = ClaudeCodeProvider::new();
        let line = r#"{"type":"user","message":{"content":[{"type":"tool_result","tool_use_id":"tool_1","content":"fn main() { println!(\"Hello\"); }","is_error":false}]}}"#;

        let event = provider
            .parse_line(line)
            .expect("Should parse tool result");

        match event {
            UnifiedAgentEvent::Message { role, content } => {
                assert_eq!(role, AgentMessageRole::User);
                assert_eq!(content.len(), 1);
                assert!(content[0].is_tool_result());
            }
            _ => panic!("Expected Message event, got {:?}", event),
        }
    }

    #[test]
    fn test_parse_tool_result_error() {
        let provider = ClaudeCodeProvider::new();
        let line = r#"{"type":"user","message":{"content":[{"type":"tool_result","tool_use_id":"tool_2","content":"File not found","is_error":true}]}}"#;

        let event = provider
            .parse_line(line)
            .expect("Should parse error result");

        match event {
            UnifiedAgentEvent::Message { role, content } => {
                assert_eq!(role, AgentMessageRole::User);
                if let ContentBlock::ToolResult { is_error, .. } = &content[0] {
                    assert!(is_error);
                }
            }
            _ => panic!("Expected Message event, got {:?}", event),
        }
    }

    // =========================================================================
    // Parse Line Tests - Result Events
    // =========================================================================

    #[test]
    fn test_parse_result_success() {
        let provider = ClaudeCodeProvider::new();
        let line = r#"{"type":"result","subtype":"success","input_tokens":1500,"output_tokens":500,"duration_seconds":2.5}"#;

        let event = provider
            .parse_line(line)
            .expect("Should parse result event");

        match event {
            UnifiedAgentEvent::Complete { status, stats } => {
                assert!(status.is_success());
                let stats = stats.expect("Should have stats");
                assert_eq!(stats.input_tokens, Some(1500));
                assert_eq!(stats.output_tokens, Some(500));
                assert_eq!(stats.duration_ms, Some(2500));
            }
            _ => panic!("Expected Complete event, got {:?}", event),
        }
    }

    #[test]
    fn test_parse_result_error() {
        let provider = ClaudeCodeProvider::new();
        let line = r#"{"type":"result","subtype":"error"}"#;

        let event = provider.parse_line(line).expect("Should parse error result");

        match event {
            UnifiedAgentEvent::Complete { status, .. } => {
                assert!(status.is_error());
            }
            _ => panic!("Expected Complete event, got {:?}", event),
        }
    }

    // =========================================================================
    // Parse Line Tests - Edge Cases
    // =========================================================================

    #[test]
    fn test_parse_empty_line() {
        let provider = ClaudeCodeProvider::new();
        assert!(provider.parse_line("").is_none());
        assert!(provider.parse_line("   ").is_none());
        assert!(provider.parse_line("\n").is_none());
    }

    #[test]
    fn test_parse_non_json() {
        let provider = ClaudeCodeProvider::new();
        assert!(provider.parse_line("not json").is_none());
        assert!(provider.parse_line("Allow Claude to write").is_none());
    }

    #[test]
    fn test_parse_invalid_json() {
        let provider = ClaudeCodeProvider::new();
        assert!(provider.parse_line("{invalid}").is_none());
        assert!(provider.parse_line("{\"type\":}").is_none());
    }

    #[test]
    fn test_parse_empty_content() {
        let provider = ClaudeCodeProvider::new();
        let line = r#"{"type":"assistant","message":{"content":[]}}"#;
        assert!(provider.parse_line(line).is_none());
    }

    // =========================================================================
    // Permission Prompt Tests
    // =========================================================================

    #[test]
    fn test_permission_prompt_write() {
        let provider = ClaudeCodeProvider::new();
        let line = "Allow Claude to write to /src/main.rs? (y/n)";

        let perm = provider
            .is_permission_prompt(line)
            .expect("Should detect permission");
        assert_eq!(perm.tool_name, "Write");
        assert_eq!(perm.file_path, Some("/src/main.rs".to_string()));
    }

    #[test]
    fn test_permission_prompt_bash() {
        let provider = ClaudeCodeProvider::new();
        let line = "Allow Claude to execute bash command? (y/n)";

        let perm = provider
            .is_permission_prompt(line)
            .expect("Should detect permission");
        assert_eq!(perm.tool_name, "Bash");
    }

    #[test]
    fn test_permission_prompt_read() {
        let provider = ClaudeCodeProvider::new();
        let line = "Allow Claude to read file `/etc/config`? (y/n)";

        let perm = provider
            .is_permission_prompt(line)
            .expect("Should detect permission");
        assert_eq!(perm.tool_name, "Read");
        assert_eq!(perm.file_path, Some("/etc/config".to_string()));
    }

    #[test]
    fn test_permission_prompt_bracket_style() {
        let provider = ClaudeCodeProvider::new();
        let line = "Allow to run this command? [y/n]";

        let perm = provider
            .is_permission_prompt(line)
            .expect("Should detect permission");
        assert_eq!(perm.tool_name, "Bash");
    }

    #[test]
    fn test_not_permission_prompt() {
        let provider = ClaudeCodeProvider::new();

        // Not a permission prompt
        assert!(provider.is_permission_prompt("Hello world").is_none());
        assert!(provider
            .is_permission_prompt("Allow but no question")
            .is_none());
        assert!(provider
            .is_permission_prompt("Just a question? (yes/no)")
            .is_none());
    }

    // =========================================================================
    // Enhanced Permission Pattern Tests
    // =========================================================================

    #[test]
    fn test_permission_prompt_various_formats() {
        let provider = ClaudeCodeProvider::new();

        // Standard format
        let perm = provider
            .is_permission_prompt("Allow Claude to write to /src/main.rs? (y/n)")
            .expect("Should detect standard format");
        assert_eq!(perm.tool_name, "Write");
        assert_eq!(perm.file_path, Some("/src/main.rs".to_string()));

        // Bracket format
        let perm = provider
            .is_permission_prompt("Allow Claude to run bash command? [y/n]")
            .expect("Should detect bracket format");
        assert_eq!(perm.tool_name, "Bash");

        // With backticks
        let perm = provider
            .is_permission_prompt("Allow Claude to read file `/etc/config`? (y/n)")
            .expect("Should detect backtick format");
        assert_eq!(perm.tool_name, "Read");
        assert_eq!(perm.file_path, Some("/etc/config".to_string()));

        // With double quotes
        let perm = provider
            .is_permission_prompt(r#"Allow Claude to read file "/home/user/test.txt"? (y/n)"#)
            .expect("Should detect double quote format");
        assert_eq!(perm.tool_name, "Read");

        // With single quotes
        let perm = provider
            .is_permission_prompt("Allow Claude to read file '/var/log/app.log'? (y/n)")
            .expect("Should detect single quote format");
        assert_eq!(perm.tool_name, "Read");
    }

    #[test]
    fn test_permission_prompt_all_tool_types() {
        let provider = ClaudeCodeProvider::new();

        // Read
        let perm = provider
            .is_permission_prompt("Allow Claude to read file.txt? (y/n)")
            .expect("Should detect read");
        assert_eq!(perm.tool_name, "Read");

        // Write
        let perm = provider
            .is_permission_prompt("Allow Claude to write to output.txt? (y/n)")
            .expect("Should detect write");
        assert_eq!(perm.tool_name, "Write");

        // Create (treated as Write)
        let perm = provider
            .is_permission_prompt("Allow Claude to create new file? (y/n)")
            .expect("Should detect create");
        assert_eq!(perm.tool_name, "Write");

        // Execute/Bash
        let perm = provider
            .is_permission_prompt("Allow Claude to execute bash command? (y/n)")
            .expect("Should detect execute");
        assert_eq!(perm.tool_name, "Bash");

        // Run (treated as Bash)
        let perm = provider
            .is_permission_prompt("Allow Claude to run script? (y/n)")
            .expect("Should detect run");
        assert_eq!(perm.tool_name, "Bash");

        // Delete
        let perm = provider
            .is_permission_prompt("Allow Claude to delete old_file.txt? (y/n)")
            .expect("Should detect delete");
        assert_eq!(perm.tool_name, "Delete");
    }

    #[test]
    fn test_permission_prompt_case_insensitive() {
        let provider = ClaudeCodeProvider::new();

        // Lowercase
        let perm = provider
            .is_permission_prompt("allow claude to write to file? (y/n)")
            .expect("Should detect lowercase");
        assert_eq!(perm.tool_name, "Write");

        // Uppercase
        let perm = provider
            .is_permission_prompt("ALLOW CLAUDE TO READ FILE? (Y/N)")
            .expect("Should detect uppercase");
        assert_eq!(perm.tool_name, "Read");

        // Mixed case
        let perm = provider
            .is_permission_prompt("AlLoW ClAuDe To ExEcUtE bAsH? (y/n)")
            .expect("Should detect mixed case");
        assert_eq!(perm.tool_name, "Bash");
    }

    #[test]
    fn test_permission_prompt_without_explicit_yn() {
        let provider = ClaudeCodeProvider::new();

        // Question mark only format
        let perm = provider
            .is_permission_prompt("Allow Claude to write to config.json?")
            .expect("Should detect question-only format");
        assert_eq!(perm.tool_name, "Write");
    }

    #[test]
    fn test_permission_prompt_edge_cases() {
        let provider = ClaudeCodeProvider::new();

        // Extra whitespace between words
        let perm = provider
            .is_permission_prompt("Allow  Claude  to  write  to  file?  (y/n)")
            .expect("Should handle extra whitespace");
        assert_eq!(perm.tool_name, "Write");

        // No space before question mark
        let perm = provider
            .is_permission_prompt("Allow Claude to read file? (y/n)")
            .expect("Should handle no space before ?");
        assert_eq!(perm.tool_name, "Read");

        // Trailing whitespace
        let perm = provider
            .is_permission_prompt("Allow Claude to execute bash? (y/n)   ")
            .expect("Should handle trailing whitespace");
        assert_eq!(perm.tool_name, "Bash");
    }

    // =========================================================================
    // Fallback Heuristics Tests
    // =========================================================================

    #[test]
    fn test_fallback_heuristic_allow_with_question() {
        let provider = ClaudeCodeProvider::new();

        // Unusual format that regex might miss but has "allow" + "?"
        let perm = provider
            .is_permission_prompt("Allow modify the configuration file?")
            .expect("Should detect via fallback: allow + action + question");
        assert_eq!(perm.tool_name, "Write");

        // Another variant - "access" maps to Read
        let perm = provider
            .is_permission_prompt("Allow access to sensitive data?")
            .expect("Should detect via fallback: allow + access + question");
        assert_eq!(perm.tool_name, "Read");
    }

    #[test]
    fn test_fallback_heuristic_yn_with_verb() {
        let provider = ClaudeCodeProvider::new();

        // Has y/n indicator and permission verb but unusual structure
        let perm = provider
            .is_permission_prompt("Read the file now? (y/n)")
            .expect("Should detect via fallback: y/n + read verb");
        assert_eq!(perm.tool_name, "Read");

        // Another format
        let perm = provider
            .is_permission_prompt("Delete this resource? [yes/no]")
            .expect("Should detect via fallback: yes/no + delete verb");
        assert_eq!(perm.tool_name, "Delete");

        // Execute variant
        let perm = provider
            .is_permission_prompt("Execute this script? (y/n)")
            .expect("Should detect via fallback: y/n + execute verb");
        assert_eq!(perm.tool_name, "Bash");
    }

    #[test]
    fn test_fallback_heuristic_combined_indicators() {
        let provider = ClaudeCodeProvider::new();

        // Has allow, permission verb, and question mark in non-standard format
        let perm = provider
            .is_permission_prompt("Allow: write operation to file?")
            .expect("Should detect via fallback: allow + write + question");
        assert_eq!(perm.tool_name, "Write");

        // Create variant
        let perm = provider
            .is_permission_prompt("Allow create new directory?")
            .expect("Should detect via fallback: allow + create + question");
        assert_eq!(perm.tool_name, "Write");

        // Run variant
        let perm = provider
            .is_permission_prompt("Allow run this command?")
            .expect("Should detect via fallback: allow + run + question");
        assert_eq!(perm.tool_name, "Bash");
    }

    #[test]
    fn test_fallback_does_not_trigger_false_positives() {
        let provider = ClaudeCodeProvider::new();

        // Has question mark but not permission-related
        assert!(provider
            .is_permission_prompt("What is the weather today?")
            .is_none());

        // Has "allow" but no action verb or proper format
        assert!(provider
            .is_permission_prompt("Allow me to explain...")
            .is_none());

        // Has action verb but not a permission prompt
        assert!(provider
            .is_permission_prompt("I will read the documentation")
            .is_none());

        // Has y/n but no permission verb
        assert!(provider
            .is_permission_prompt("Do you like this? (y/n)")
            .is_none());

        // No question mark
        assert!(provider
            .is_permission_prompt("Allow Claude to write to file")
            .is_none());
    }

    #[test]
    fn test_fallback_with_file_paths() {
        let provider = ClaudeCodeProvider::new();

        // Fallback should still extract file paths
        let perm = provider
            .is_permission_prompt("Allow modify /etc/config? (y/n)")
            .expect("Should detect and extract path");
        assert_eq!(perm.tool_name, "Write");
        assert_eq!(perm.file_path, Some("/etc/config".to_string()));

        // Path with quotes
        let perm = provider
            .is_permission_prompt("Allow write to `/tmp/output.txt`?")
            .expect("Should detect and extract quoted path");
        assert_eq!(perm.tool_name, "Write");
        assert_eq!(perm.file_path, Some("/tmp/output.txt".to_string()));
    }

    #[test]
    fn test_fallback_case_insensitive() {
        let provider = ClaudeCodeProvider::new();

        // Uppercase
        let perm = provider
            .is_permission_prompt("ALLOW DELETE THIS FILE? (Y/N)")
            .expect("Should detect uppercase via fallback");
        assert_eq!(perm.tool_name, "Delete");

        // Mixed case - "access" maps to Read
        let perm = provider
            .is_permission_prompt("AlLoW aCcEsS tO rEsOuRcE?")
            .expect("Should detect mixed case via fallback");
        assert_eq!(perm.tool_name, "Read");
    }

    #[test]
    fn test_empty_and_invalid_lines_with_fallback() {
        let provider = ClaudeCodeProvider::new();

        // Empty
        assert!(provider.is_permission_prompt("").is_none());
        
        // Just whitespace
        assert!(provider.is_permission_prompt("    ").is_none());
        
        // No question mark
        assert!(provider.is_permission_prompt("Allow to write").is_none());
        
        // Not permission-related despite having ?
        assert!(provider.is_permission_prompt("Hello?").is_none());
    }

    // =========================================================================
    // Tool Name Extraction Tests
    // =========================================================================

    #[test]
    fn test_extract_tool_name() {
        assert_eq!(
            ClaudeCodeProvider::extract_tool_name("write to file"),
            "Write"
        );
        assert_eq!(
            ClaudeCodeProvider::extract_tool_name("create new file"),
            "Write"
        );
        assert_eq!(
            ClaudeCodeProvider::extract_tool_name("modify the config"),
            "Write"
        );
        assert_eq!(ClaudeCodeProvider::extract_tool_name("read file"), "Read");
        assert_eq!(
            ClaudeCodeProvider::extract_tool_name("access the data"),
            "Read"
        );
        assert_eq!(
            ClaudeCodeProvider::extract_tool_name("execute command"),
            "Bash"
        );
        assert_eq!(
            ClaudeCodeProvider::extract_tool_name("run bash script"),
            "Bash"
        );
        assert_eq!(
            ClaudeCodeProvider::extract_tool_name("delete the file"),
            "Delete"
        );
        assert_eq!(
            ClaudeCodeProvider::extract_tool_name("do something"),
            "Tool"
        );
    }

    // =========================================================================
    // File Path Extraction Tests
    // =========================================================================

    #[test]
    fn test_extract_file_path() {
        assert_eq!(
            ClaudeCodeProvider::extract_file_path("write to /src/main.rs please"),
            Some("/src/main.rs".to_string())
        );
        assert_eq!(
            ClaudeCodeProvider::extract_file_path("file `/home/user/test.txt`?"),
            Some("/home/user/test.txt".to_string())
        );
        assert_eq!(
            ClaudeCodeProvider::extract_file_path("no path here"),
            None
        );
    }

    // =========================================================================
    // Full Integration Tests
    // =========================================================================

    #[test]
    fn test_full_conversation_flow() {
        let provider = ClaudeCodeProvider::new();

        // Simulate a conversation
        let events = vec![
            r#"{"type":"system","subtype":"init","session_id":"sess-1","model":"claude-sonnet","tools":["Read","Write"]}"#,
            r#"{"type":"assistant","message":{"content":[{"type":"text","text":"I'll read the file for you."}]}}"#,
            r#"{"type":"assistant","message":{"content":[{"type":"tool_use","id":"t1","name":"Read","input":{"file_path":"/src/lib.rs"}}]}}"#,
            r#"{"type":"user","message":{"content":[{"type":"tool_result","tool_use_id":"t1","content":"pub fn hello() {}","is_error":false}]}}"#,
            r#"{"type":"assistant","message":{"content":[{"type":"text","text":"The file contains a hello function."}]}}"#,
            r#"{"type":"result","subtype":"success","input_tokens":100,"output_tokens":50}"#,
        ];

        let parsed: Vec<_> = events
            .iter()
            .filter_map(|line| provider.parse_line(line))
            .collect();

        assert_eq!(parsed.len(), 6);
        assert!(parsed[0].is_init());
        assert!(parsed[1].is_message());
        assert!(parsed[2].is_message()); // tool_use is in message
        assert!(parsed[3].is_message()); // tool_result is in message
        assert!(parsed[4].is_message());
        assert!(parsed[5].is_complete());
    }
}
