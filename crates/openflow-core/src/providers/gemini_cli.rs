//! Gemini CLI Provider
//!
//! Implementation of the `AgentProvider` trait for Google's Gemini CLI.
//! This provider parses Gemini CLI's `--output-format stream-json` output
//! into the unified `UnifiedAgentEvent` format.
//!
//! # Gemini CLI Output Format
//!
//! When running with `gemini --output-format stream-json`, the CLI outputs
//! newline-delimited JSON (NDJSON) with the following event types:
//!
//! - `init` - Session initialization with session_id, model, timestamp
//! - `message` - User or assistant messages with role and content
//! - `tool_use` - Tool invocation with tool_name, tool_id, parameters
//! - `tool_result` - Tool execution result with status and output
//! - `error` - Non-fatal warnings and errors
//! - `result` - Final session outcome with aggregated statistics
//!
//! # Example Output
//!
//! ```json
//! {"type":"init","sessionId":"abc123","model":"gemini-2.5-pro","timestamp":"2025-01-04T..."}
//! {"type":"message","role":"assistant","content":"Let me help you with that."}
//! {"type":"tool_use","tool_name":"read_file","tool_id":"tool_1","parameters":{"path":"/src/main.rs"}}
//! {"type":"tool_result","tool_id":"tool_1","status":"success","output":"file contents..."}
//! {"type":"result","status":"success","stats":{"tools":{"totalCalls":1}}}
//! ```
//!
//! # Installation
//!
//! ```bash
//! npm install -g @google/gemini-cli
//! ```
//!
//! # Usage
//!
//! ```bash
//! gemini -p "your prompt" --output-format stream-json
//! gemini -p "your prompt" --output-format stream-json --yolo  # Auto-approve tools
//! gemini -p "your prompt" --output-format stream-json -m gemini-2.5-flash
//! ```

use std::collections::HashMap;
use std::sync::LazyLock;

use regex::Regex;
use serde::{Deserialize, Serialize};

use openflow_contracts::events::{
    AgentMessageRole, AgentStats, CompletionStatus, ContentBlock, PermissionRequest,
    ToolResultStatus, UnifiedAgentEvent,
};
use openflow_process::PtyConfig;

use super::{AgentConfig, AgentProvider, ProviderCapabilities};

// =============================================================================
// Constants
// =============================================================================

/// Provider ID constant
pub const PROVIDER_ID: &str = "gemini-cli";

/// Display name for UI
pub const DISPLAY_NAME: &str = "Gemini CLI";

/// CLI command name
pub const COMMAND: &str = "gemini";

// =============================================================================
// Permission Detection Regex
// =============================================================================

/// Regex for detecting Gemini CLI permission prompts.
/// Matches patterns like: "Approve? (y/n/always) ->"
static PERMISSION_REGEX: LazyLock<Regex> = LazyLock::new(|| {
    Regex::new(r"(?i)Approve\?\s*\(y/n(?:/always)?\)\s*->?")
        .expect("Invalid permission regex")
});

/// Alternative prompt patterns Gemini might use
static CONFIRM_REGEX: LazyLock<Regex> = LazyLock::new(|| {
    Regex::new(r"(?i)(?:Confirm|Allow|Execute|Run|Write|Delete)\s+.*\?\s*(?:\(y/n(?:/always)?\)|(?:->))")
        .expect("Invalid confirm regex")
});

/// Regex for extracting file path from permission context
static FILE_PATH_REGEX: LazyLock<Regex> = LazyLock::new(|| {
    Regex::new(r#"(?:file|path|to)\s*["`']?(/[^\s"'`?]+|[A-Za-z]:\\[^\s"'`?]+)["`']?"#)
        .expect("Invalid file path regex")
});

// =============================================================================
// Gemini Event Types (for parsing)
// =============================================================================

/// Gemini CLI stream-json event types.
/// These match the JSON lines output from `gemini --output-format stream-json`.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type", rename_all = "snake_case")]
pub enum GeminiEvent {
    /// Session initialization event
    #[serde(rename = "init")]
    Init {
        /// Session ID from Gemini CLI
        #[serde(alias = "sessionId", alias = "session_id")]
        session_id: Option<String>,
        /// Model being used
        #[serde(default)]
        model: Option<String>,
        /// Session start timestamp
        #[serde(default)]
        timestamp: Option<String>,
        /// Additional data
        #[serde(flatten)]
        data: serde_json::Value,
    },
    /// User or assistant message
    #[serde(rename = "message")]
    Message {
        /// Message role: "user" or "assistant"
        role: String,
        /// Message content (can be string or structured)
        content: serde_json::Value,
        /// Additional data
        #[serde(flatten)]
        data: serde_json::Value,
    },
    /// Tool use request
    #[serde(rename = "tool_use")]
    ToolUse {
        /// Tool name (e.g., "read_file", "run_shell_command")
        tool_name: String,
        /// Unique tool invocation ID
        tool_id: String,
        /// Tool parameters as JSON
        #[serde(default)]
        parameters: serde_json::Value,
        /// Additional data
        #[serde(flatten)]
        data: serde_json::Value,
    },
    /// Tool execution result
    #[serde(rename = "tool_result")]
    ToolResult {
        /// Tool invocation ID this result is for
        tool_id: String,
        /// Status: "success" or "error"
        status: String,
        /// Tool output
        #[serde(default)]
        output: serde_json::Value,
        /// Additional data
        #[serde(flatten)]
        data: serde_json::Value,
    },
    /// Error or warning event
    #[serde(rename = "error")]
    Error {
        /// Error message
        message: String,
        /// Error code
        #[serde(alias = "code", alias = "error_type", default)]
        error_code: Option<String>,
        /// Additional data
        #[serde(flatten)]
        data: serde_json::Value,
    },
    /// Session completion event
    #[serde(rename = "result")]
    Result {
        /// Result status: "success" or "failed"
        status: String,
        /// Session statistics
        #[serde(default)]
        stats: Option<GeminiStats>,
        /// Additional data
        #[serde(flatten)]
        data: serde_json::Value,
    },
}

/// Gemini CLI session statistics
#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct GeminiStats {
    /// Session-level stats
    #[serde(default)]
    pub session: Option<GeminiSessionStats>,
    /// Model-level stats
    #[serde(default)]
    pub model: Option<GeminiModelStats>,
    /// Tool usage stats
    #[serde(default)]
    pub tools: Option<GeminiToolStats>,
}

/// Session statistics
#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct GeminiSessionStats {
    /// Session duration in milliseconds
    #[serde(alias = "durationMs", default)]
    pub duration_ms: Option<i32>,
}

/// Model statistics
#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct GeminiModelStats {
    /// Number of turns
    #[serde(default)]
    pub turns: Option<i32>,
    /// Input tokens
    #[serde(alias = "inputTokens", default)]
    pub input_tokens: Option<i32>,
    /// Output tokens
    #[serde(alias = "outputTokens", default)]
    pub output_tokens: Option<i32>,
}

/// Tool usage statistics
#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct GeminiToolStats {
    /// Total tool calls
    #[serde(alias = "totalCalls", default)]
    pub total_calls: Option<i32>,
    /// Successful tool calls
    #[serde(alias = "totalSuccess", default)]
    pub total_success: Option<i32>,
    /// Failed tool calls
    #[serde(alias = "totalFail", default)]
    pub total_fail: Option<i32>,
    /// Total duration of tool calls in ms
    #[serde(alias = "totalDurationMs", default)]
    pub total_duration_ms: Option<i32>,
}

// =============================================================================
// GeminiCLIProvider
// =============================================================================

/// Provider implementation for Google's Gemini CLI
#[derive(Debug, Default)]
pub struct GeminiCLIProvider;

impl GeminiCLIProvider {
    /// Create a new Gemini CLI provider
    pub fn new() -> Self {
        Self
    }

    /// Convert Gemini role to our unified role
    fn convert_role(role: &str) -> AgentMessageRole {
        match role.to_lowercase().as_str() {
            "user" => AgentMessageRole::User,
            "assistant" | "model" => AgentMessageRole::Assistant,
            "system" => AgentMessageRole::System,
            _ => AgentMessageRole::Assistant,
        }
    }

    /// Convert Gemini content to our unified content blocks
    fn convert_content(content: &serde_json::Value) -> Vec<ContentBlock> {
        // Content can be a string or structured
        if let Some(text) = content.as_str() {
            return vec![ContentBlock::text(text)];
        }

        // If it's an array, convert each item
        if let Some(array) = content.as_array() {
            return array
                .iter()
                .filter_map(|item| {
                    if let Some(text) = item.as_str() {
                        return Some(ContentBlock::text(text));
                    }
                    // Handle structured content blocks if Gemini uses them
                    if let Some(obj) = item.as_object() {
                        let content_type = obj.get("type").and_then(|t| t.as_str())?;
                        match content_type {
                            "text" => {
                                let text = obj.get("text").and_then(|t| t.as_str())?;
                                Some(ContentBlock::text(text))
                            }
                            _ => None,
                        }
                    } else {
                        None
                    }
                })
                .collect();
        }

        // If it's an object with text field
        if let Some(obj) = content.as_object() {
            if let Some(text) = obj.get("text").and_then(|t| t.as_str()) {
                return vec![ContentBlock::text(text)];
            }
        }

        // Fallback: stringify the content
        vec![ContentBlock::text(content.to_string())]
    }

    /// Parse a GeminiEvent into UnifiedAgentEvent
    fn convert_event(event: GeminiEvent) -> Option<UnifiedAgentEvent> {
        match event {
            GeminiEvent::Init {
                session_id,
                model,
                data,
                ..
            } => {
                let sid = session_id.unwrap_or_else(|| {
                    data.get("sessionId")
                        .or_else(|| data.get("session_id"))
                        .and_then(|v| v.as_str())
                        .unwrap_or("unknown")
                        .to_string()
                });
                let m = model.unwrap_or_else(|| {
                    data.get("model")
                        .and_then(|v| v.as_str())
                        .unwrap_or("gemini")
                        .to_string()
                });
                // Gemini doesn't emit tools in init, so we'll use empty list
                let tools: Vec<String> = data
                    .get("tools")
                    .and_then(|t| t.as_array())
                    .map(|arr| {
                        arr.iter()
                            .filter_map(|v| v.as_str().map(String::from))
                            .collect()
                    })
                    .unwrap_or_default();

                Some(UnifiedAgentEvent::init(sid, m, tools))
            }
            GeminiEvent::Message { role, content, .. } => {
                let unified_role = Self::convert_role(&role);
                let content_blocks = Self::convert_content(&content);

                if content_blocks.is_empty() {
                    return None;
                }

                Some(UnifiedAgentEvent::message(unified_role, content_blocks))
            }
            GeminiEvent::ToolUse {
                tool_name,
                tool_id,
                parameters,
                ..
            } => {
                // Emit as a ToolUse event directly
                Some(UnifiedAgentEvent::ToolUse {
                    tool_id,
                    tool_name,
                    input: parameters,
                })
            }
            GeminiEvent::ToolResult {
                tool_id,
                status,
                output,
                ..
            } => {
                let output_str = if output.is_string() {
                    output.as_str().unwrap_or("").to_string()
                } else {
                    output.to_string()
                };
                let result_status = if status == "success" {
                    ToolResultStatus::Success
                } else {
                    ToolResultStatus::Error
                };

                Some(UnifiedAgentEvent::ToolResult {
                    tool_id,
                    status: result_status,
                    output: output_str,
                })
            }
            GeminiEvent::Error {
                message,
                error_code,
                ..
            } => {
                let code = error_code.unwrap_or_else(|| "error".to_string());
                Some(UnifiedAgentEvent::error(code, message))
            }
            GeminiEvent::Result { status, stats, .. } => {
                let completion_status = match status.as_str() {
                    "success" => CompletionStatus::Success,
                    "failed" | "error" => CompletionStatus::Error,
                    "interrupted" | "cancelled" => CompletionStatus::Interrupted,
                    "timeout" => CompletionStatus::Timeout,
                    _ => CompletionStatus::Success,
                };

                let agent_stats = stats.map(|s| {
                    let mut stats = AgentStats::new();

                    // Extract token counts from model stats
                    if let Some(model) = s.model {
                        stats.input_tokens = model.input_tokens;
                        stats.output_tokens = model.output_tokens;
                        stats.total_tokens = match (model.input_tokens, model.output_tokens) {
                            (Some(i), Some(o)) => Some(i + o),
                            (Some(i), None) => Some(i),
                            (None, Some(o)) => Some(o),
                            _ => None,
                        };
                    }

                    // Extract duration from session stats
                    if let Some(session) = s.session {
                        stats.duration_ms = session.duration_ms;
                    }

                    stats
                });

                Some(UnifiedAgentEvent::Complete {
                    status: completion_status,
                    stats: agent_stats,
                })
            }
        }
    }

    /// Extract tool name from permission prompt context
    fn extract_tool_name(line: &str) -> String {
        let lower = line.to_lowercase();

        // Check for specific tool patterns
        if lower.contains("write") || lower.contains("create") || lower.contains("save") {
            "write_file".to_string()
        } else if lower.contains("read") || lower.contains("open") {
            "read_file".to_string()
        } else if lower.contains("shell") || lower.contains("command") || lower.contains("execute") || lower.contains("run") {
            "run_shell_command".to_string()
        } else if lower.contains("delete") || lower.contains("remove") {
            "delete_file".to_string()
        } else if lower.contains("fetch") || lower.contains("http") || lower.contains("web") {
            "web_fetch".to_string()
        } else if lower.contains("search") {
            "google_web_search".to_string()
        } else {
            "unknown_tool".to_string()
        }
    }

    /// Extract file path from permission prompt context
    fn extract_file_path(line: &str) -> Option<String> {
        // Try regex first
        if let Some(caps) = FILE_PATH_REGEX.captures(line) {
            return caps.get(1).map(|m| m.as_str().to_string());
        }

        // Fallback: look for path-like strings
        for word in line.split_whitespace() {
            let word = word.trim_matches(|c| c == '?' || c == '"' || c == '\'' || c == '`' || c == ':');
            if word.starts_with('/') || word.contains(":\\") {
                return Some(word.to_string());
            }
        }
        None
    }
}

impl AgentProvider for GeminiCLIProvider {
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
            supports_resume: false, // Gemini CLI doesn't support session resume yet
            supports_streaming_json: true,
            supports_skip_permissions: true, // via --yolo flag
            supports_verbose: false,
            emits_tool_events: true,
            emits_thinking: false, // Gemini CLI doesn't expose thinking
        }
    }

    fn build_command(&self, config: &AgentConfig) -> PtyConfig {
        let mut args = vec![
            "--output-format".to_string(),
            "stream-json".to_string(),
        ];

        // Add model if specified
        if let Some(model) = &config.model {
            args.push("-m".to_string());
            args.push(model.clone());
        }

        // Add prompt (Gemini uses -p for prompt)
        if !config.prompt.is_empty() {
            args.push("-p".to_string());
            args.push(config.prompt.clone());
        }

        // Note: Gemini CLI doesn't support --resume yet
        // If session_id is provided, we can't resume so we ignore it

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

        // Try to parse as GeminiEvent
        match serde_json::from_str::<GeminiEvent>(trimmed) {
            Ok(event) => Self::convert_event(event),
            Err(_) => {
                // Try parsing as raw JSON and extracting type
                if let Ok(value) = serde_json::from_str::<serde_json::Value>(trimmed) {
                    let event_type = value.get("type").and_then(|t| t.as_str())?;

                    match event_type {
                        "init" => {
                            let session_id = value
                                .get("sessionId")
                                .or_else(|| value.get("session_id"))
                                .and_then(|s| s.as_str())
                                .unwrap_or("unknown")
                                .to_string();
                            let model = value
                                .get("model")
                                .and_then(|s| s.as_str())
                                .unwrap_or("gemini")
                                .to_string();
                            return Some(UnifiedAgentEvent::init(session_id, model, vec![]));
                        }
                        "message" => {
                            let role = value
                                .get("role")
                                .and_then(|r| r.as_str())
                                .unwrap_or("assistant");
                            let content = value.get("content")?;
                            let unified_role = Self::convert_role(role);
                            let content_blocks = Self::convert_content(content);

                            if !content_blocks.is_empty() {
                                return Some(UnifiedAgentEvent::message(unified_role, content_blocks));
                            }
                        }
                        "tool_use" => {
                            let tool_name = value
                                .get("tool_name")
                                .and_then(|n| n.as_str())?
                                .to_string();
                            let tool_id = value
                                .get("tool_id")
                                .and_then(|i| i.as_str())?
                                .to_string();
                            let parameters = value
                                .get("parameters")
                                .cloned()
                                .unwrap_or(serde_json::Value::Null);

                            return Some(UnifiedAgentEvent::ToolUse {
                                tool_id,
                                tool_name,
                                input: parameters,
                            });
                        }
                        "tool_result" => {
                            let tool_id = value
                                .get("tool_id")
                                .and_then(|i| i.as_str())?
                                .to_string();
                            let status_str = value
                                .get("status")
                                .and_then(|s| s.as_str())
                                .unwrap_or("success");
                            let output = value
                                .get("output")
                                .map(|o| {
                                    if o.is_string() {
                                        o.as_str().unwrap_or("").to_string()
                                    } else {
                                        o.to_string()
                                    }
                                })
                                .unwrap_or_default();
                            let result_status = if status_str == "success" {
                                ToolResultStatus::Success
                            } else {
                                ToolResultStatus::Error
                            };

                            return Some(UnifiedAgentEvent::ToolResult {
                                tool_id,
                                status: result_status,
                                output,
                            });
                        }
                        "error" => {
                            let message = value
                                .get("message")
                                .and_then(|m| m.as_str())
                                .unwrap_or("Unknown error")
                                .to_string();
                            let code = value
                                .get("error_type")
                                .or_else(|| value.get("code"))
                                .and_then(|c| c.as_str())
                                .unwrap_or("error")
                                .to_string();

                            return Some(UnifiedAgentEvent::error(code, message));
                        }
                        "result" => {
                            let status = value
                                .get("status")
                                .and_then(|s| s.as_str())
                                .unwrap_or("success");
                            let completion_status = match status {
                                "success" => CompletionStatus::Success,
                                "failed" | "error" => CompletionStatus::Error,
                                _ => CompletionStatus::Success,
                            };

                            return Some(UnifiedAgentEvent::Complete {
                                status: completion_status,
                                stats: None,
                            });
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

        // Check standard Gemini approval prompt
        if PERMISSION_REGEX.is_match(trimmed) || CONFIRM_REGEX.is_match(trimmed) {
            let tool_name = Self::extract_tool_name(trimmed);
            let file_path = Self::extract_file_path(trimmed);

            return Some(PermissionRequest {
                tool_name,
                description: trimmed.to_string(),
                file_path,
                command: None,
            });
        }

        // Additional check for simpler "Approve?" patterns
        if trimmed.contains("Approve?") && (trimmed.contains("(y/n") || trimmed.contains("->")) {
            return Some(PermissionRequest {
                tool_name: Self::extract_tool_name(trimmed),
                description: trimmed.to_string(),
                file_path: Self::extract_file_path(trimmed),
                command: None,
            });
        }

        None
    }

    fn resume_args(&self, _session_id: &str) -> Vec<String> {
        // Gemini CLI doesn't support session resume yet
        // Return empty args - the session will start fresh
        vec![]
    }

    fn approval_response(&self, approved: bool) -> &'static [u8] {
        // Gemini uses y/n for approval
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
        env
    }

    fn permission_patterns(&self) -> Vec<&Regex> {
        vec![&PERMISSION_REGEX, &CONFIRM_REGEX]
    }

    fn extract_tool_context(&self, tool_name: &str, input: &serde_json::Value) -> super::ToolContext {
        let mut context = super::ToolContext::new();

        // Gemini CLI uses snake_case naming
        match tool_name {
            "run_shell_command" | "shell" | "bash" => {
                // Extract command
                if let Some(cmd) = input.get("command").and_then(|v| v.as_str()) {
                    context.command = Some(cmd.to_string());
                } else if let Some(cmd) = input.get("cmd").and_then(|v| v.as_str()) {
                    context.command = Some(cmd.to_string());
                } else if let Some(cmd) = input.get("script").and_then(|v| v.as_str()) {
                    context.command = Some(cmd.to_string());
                }

                // Extract working directory
                if let Some(wd) = input.get("working_directory").and_then(|v| v.as_str()) {
                    context.working_directory = Some(wd.to_string());
                } else if let Some(wd) = input.get("cwd").and_then(|v| v.as_str()) {
                    context.working_directory = Some(wd.to_string());
                } else if let Some(wd) = input.get("directory").and_then(|v| v.as_str()) {
                    context.working_directory = Some(wd.to_string());
                }
            }
            "read_file" | "write_file" | "delete_file" => {
                // Extract file path
                if let Some(path) = input.get("path").and_then(|v| v.as_str()) {
                    context.file_path = Some(path.to_string());
                } else if let Some(path) = input.get("file_path").and_then(|v| v.as_str()) {
                    context.file_path = Some(path.to_string());
                } else if let Some(path) = input.get("filePath").and_then(|v| v.as_str()) {
                    context.file_path = Some(path.to_string());
                } else if let Some(path) = input.get("file").and_then(|v| v.as_str()) {
                    context.file_path = Some(path.to_string());
                }
            }
            _ => {
                // Generic extraction for unknown tools
                if let Some(path) = input.get("path").and_then(|v| v.as_str()) {
                    context.file_path = Some(path.to_string());
                } else if let Some(path) = input.get("file_path").and_then(|v| v.as_str()) {
                    context.file_path = Some(path.to_string());
                }

                if let Some(cmd) = input.get("command").and_then(|v| v.as_str()) {
                    context.command = Some(cmd.to_string());
                }

                if let Some(wd) = input.get("working_directory").and_then(|v| v.as_str()) {
                    context.working_directory = Some(wd.to_string());
                }
            }
        }

        context
    }

    fn parse_error_output(&self, line: &str) -> Option<super::ExecutionError> {
        let trimmed = line.trim();

        // Try to parse as JSON first
        if let Ok(value) = serde_json::from_str::<serde_json::Value>(trimmed) {
            // Check for Gemini CLI error format
            if let Some(event_type) = value.get("type").and_then(|t| t.as_str()) {
                if event_type == "error" {
                    let message = value
                        .get("message")
                        .and_then(|m| m.as_str())
                        .unwrap_or("Unknown error")
                        .to_string();
                    let code = value
                        .get("error_type")
                        .or_else(|| value.get("code"))
                        .and_then(|c| c.as_str())
                        .unwrap_or("error")
                        .to_string();

                    return Some(super::ExecutionError::provider_error(
                        PROVIDER_ID,
                        code,
                        message,
                    ));
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
        let provider = GeminiCLIProvider::new();
        assert_eq!(provider.provider_id(), "gemini-cli");
        assert_eq!(provider.display_name(), "Gemini CLI");
        assert_eq!(provider.command(), "gemini");
    }

    #[test]
    fn test_capabilities() {
        let provider = GeminiCLIProvider::new();
        let caps = provider.capabilities();
        assert!(!caps.supports_resume); // Gemini doesn't support resume yet
        assert!(caps.supports_streaming_json);
        assert!(caps.supports_skip_permissions); // via --yolo
        assert!(!caps.supports_verbose);
        assert!(caps.emits_tool_events);
        assert!(!caps.emits_thinking);
    }

    #[test]
    fn test_default_env() {
        let provider = GeminiCLIProvider::new();
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
        let provider = GeminiCLIProvider::new();
        let config = AgentConfig::new("Fix the bug", "/path/to/project");
        let pty_config = provider.build_command(&config);

        assert_eq!(pty_config.command, "gemini");
        assert!(pty_config.args.contains(&"--output-format".to_string()));
        assert!(pty_config.args.contains(&"stream-json".to_string()));
        assert!(pty_config.args.contains(&"-p".to_string()));
        assert!(pty_config.args.contains(&"Fix the bug".to_string()));
    }

    #[test]
    fn test_build_command_with_model() {
        let provider = GeminiCLIProvider::new();
        let config =
            AgentConfig::new("Test prompt", "/path/to/project").with_model("gemini-2.5-flash");
        let pty_config = provider.build_command(&config);

        assert!(pty_config.args.contains(&"-m".to_string()));
        assert!(pty_config.args.contains(&"gemini-2.5-flash".to_string()));
    }

    #[test]
    fn test_build_command_session_id_ignored() {
        let provider = GeminiCLIProvider::new();
        let config =
            AgentConfig::new("Continue work", "/path/to/project").with_session_id("session-123");
        let pty_config = provider.build_command(&config);

        // Session ID should be ignored since Gemini doesn't support resume
        assert!(!pty_config.args.contains(&"--resume".to_string()));
        assert!(!pty_config.args.contains(&"session-123".to_string()));
    }

    #[test]
    fn test_resume_args_empty() {
        let provider = GeminiCLIProvider::new();
        let args = provider.resume_args("sess-abc");
        assert!(args.is_empty()); // Gemini doesn't support resume
    }

    #[test]
    fn test_approval_response() {
        let provider = GeminiCLIProvider::new();
        assert_eq!(provider.approval_response(true), b"y\n");
        assert_eq!(provider.approval_response(false), b"n\n");
    }

    // =========================================================================
    // Parse Line Tests - Init Events
    // =========================================================================

    #[test]
    fn test_parse_init_event() {
        let provider = GeminiCLIProvider::new();
        let line = r#"{"type":"init","sessionId":"abc123","model":"gemini-2.5-pro","timestamp":"2025-01-04T12:00:00Z"}"#;

        let event = provider.parse_line(line).expect("Should parse init event");

        match event {
            UnifiedAgentEvent::Init {
                session_id,
                model,
                tools,
            } => {
                assert_eq!(session_id, "abc123");
                assert_eq!(model, "gemini-2.5-pro");
                assert!(tools.is_empty()); // Gemini doesn't send tools in init
            }
            _ => panic!("Expected Init event, got {:?}", event),
        }
    }

    #[test]
    fn test_parse_init_event_snake_case() {
        let provider = GeminiCLIProvider::new();
        let line = r#"{"type":"init","session_id":"def456","model":"gemini-2.5-flash"}"#;

        let event = provider.parse_line(line).expect("Should parse init event");

        match event {
            UnifiedAgentEvent::Init { session_id, .. } => {
                assert_eq!(session_id, "def456");
            }
            _ => panic!("Expected Init event"),
        }
    }

    // =========================================================================
    // Parse Line Tests - Messages
    // =========================================================================

    #[test]
    fn test_parse_message_assistant_string() {
        let provider = GeminiCLIProvider::new();
        let line = r#"{"type":"message","role":"assistant","content":"Hello, how can I help you today?"}"#;

        let event = provider
            .parse_line(line)
            .expect("Should parse assistant message");

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
    fn test_parse_message_user() {
        let provider = GeminiCLIProvider::new();
        let line = r#"{"type":"message","role":"user","content":"Fix the bug"}"#;

        let event = provider.parse_line(line).expect("Should parse user message");

        match event {
            UnifiedAgentEvent::Message { role, .. } => {
                assert_eq!(role, AgentMessageRole::User);
            }
            _ => panic!("Expected Message event"),
        }
    }

    #[test]
    fn test_parse_message_model_role() {
        let provider = GeminiCLIProvider::new();
        // Gemini sometimes uses "model" instead of "assistant"
        let line = r#"{"type":"message","role":"model","content":"I understand."}"#;

        let event = provider.parse_line(line).expect("Should parse model message");

        match event {
            UnifiedAgentEvent::Message { role, .. } => {
                // "model" should be converted to Assistant
                assert_eq!(role, AgentMessageRole::Assistant);
            }
            _ => panic!("Expected Message event"),
        }
    }

    // =========================================================================
    // Parse Line Tests - Tool Events
    // =========================================================================

    #[test]
    fn test_parse_tool_use() {
        let provider = GeminiCLIProvider::new();
        let line = r#"{"type":"tool_use","tool_name":"read_file","tool_id":"tool_1","parameters":{"path":"/src/main.rs"}}"#;

        let event = provider.parse_line(line).expect("Should parse tool use");

        match event {
            UnifiedAgentEvent::ToolUse {
                tool_id,
                tool_name,
                input,
            } => {
                assert_eq!(tool_id, "tool_1");
                assert_eq!(tool_name, "read_file");
                assert_eq!(
                    input.get("path").and_then(|v| v.as_str()),
                    Some("/src/main.rs")
                );
            }
            _ => panic!("Expected ToolUse event, got {:?}", event),
        }
    }

    #[test]
    fn test_parse_tool_result_success() {
        let provider = GeminiCLIProvider::new();
        let line = r#"{"type":"tool_result","tool_id":"tool_1","status":"success","output":"fn main() {}"}"#;

        let event = provider.parse_line(line).expect("Should parse tool result");

        match event {
            UnifiedAgentEvent::ToolResult {
                tool_id,
                output,
                status,
            } => {
                assert_eq!(tool_id, "tool_1");
                assert_eq!(output, "fn main() {}");
                assert!(status.is_success());
            }
            _ => panic!("Expected ToolResult event, got {:?}", event),
        }
    }

    #[test]
    fn test_parse_tool_result_error() {
        let provider = GeminiCLIProvider::new();
        let line = r#"{"type":"tool_result","tool_id":"tool_2","status":"error","output":"File not found"}"#;

        let event = provider
            .parse_line(line)
            .expect("Should parse error result");

        match event {
            UnifiedAgentEvent::ToolResult { status, .. } => {
                assert!(status.is_error());
            }
            _ => panic!("Expected ToolResult event"),
        }
    }

    // =========================================================================
    // Parse Line Tests - Error Events
    // =========================================================================

    #[test]
    fn test_parse_error_event() {
        let provider = GeminiCLIProvider::new();
        let line = r#"{"type":"error","message":"Rate limit exceeded","error_type":"rate_limit"}"#;

        let event = provider.parse_line(line).expect("Should parse error event");

        match event {
            UnifiedAgentEvent::Error { code, message } => {
                assert_eq!(code, "rate_limit");
                assert_eq!(message, "Rate limit exceeded");
            }
            _ => panic!("Expected Error event, got {:?}", event),
        }
    }

    #[test]
    fn test_parse_error_event_no_type() {
        let provider = GeminiCLIProvider::new();
        let line = r#"{"type":"error","message":"Something went wrong"}"#;

        let event = provider.parse_line(line).expect("Should parse error event");

        match event {
            UnifiedAgentEvent::Error { code, message } => {
                assert_eq!(code, "error"); // Default code
                assert_eq!(message, "Something went wrong");
            }
            _ => panic!("Expected Error event"),
        }
    }

    // =========================================================================
    // Parse Line Tests - Result Events
    // =========================================================================

    #[test]
    fn test_parse_result_success() {
        let provider = GeminiCLIProvider::new();
        let line = r#"{"type":"result","status":"success","stats":{"session":{"durationMs":5000},"model":{"inputTokens":100,"outputTokens":50},"tools":{"totalCalls":2}}}"#;

        let event = provider
            .parse_line(line)
            .expect("Should parse result event");

        match event {
            UnifiedAgentEvent::Complete { status, stats } => {
                assert!(status.is_success());
                let stats = stats.expect("Should have stats");
                assert_eq!(stats.input_tokens, Some(100));
                assert_eq!(stats.output_tokens, Some(50));
                assert_eq!(stats.duration_ms, Some(5000));
            }
            _ => panic!("Expected Complete event, got {:?}", event),
        }
    }

    #[test]
    fn test_parse_result_failed() {
        let provider = GeminiCLIProvider::new();
        let line = r#"{"type":"result","status":"failed"}"#;

        let event = provider
            .parse_line(line)
            .expect("Should parse failed result");

        match event {
            UnifiedAgentEvent::Complete { status, .. } => {
                assert!(status.is_error());
            }
            _ => panic!("Expected Complete event"),
        }
    }

    #[test]
    fn test_parse_result_simple() {
        let provider = GeminiCLIProvider::new();
        let line = r#"{"type":"result","status":"success"}"#;

        let event = provider.parse_line(line).expect("Should parse result");

        match event {
            UnifiedAgentEvent::Complete { status, stats } => {
                assert!(status.is_success());
                assert!(stats.is_none()); // No stats in simple result
            }
            _ => panic!("Expected Complete event"),
        }
    }

    // =========================================================================
    // Parse Line Tests - Edge Cases
    // =========================================================================

    #[test]
    fn test_parse_empty_line() {
        let provider = GeminiCLIProvider::new();
        assert!(provider.parse_line("").is_none());
        assert!(provider.parse_line("   ").is_none());
        assert!(provider.parse_line("\n").is_none());
    }

    #[test]
    fn test_parse_non_json() {
        let provider = GeminiCLIProvider::new();
        assert!(provider.parse_line("not json").is_none());
        assert!(provider.parse_line("Approve? (y/n)").is_none());
    }

    #[test]
    fn test_parse_invalid_json() {
        let provider = GeminiCLIProvider::new();
        assert!(provider.parse_line("{invalid}").is_none());
        assert!(provider.parse_line("{\"type\":}").is_none());
    }

    // =========================================================================
    // Permission Prompt Tests
    // =========================================================================

    #[test]
    fn test_permission_prompt_standard() {
        let provider = GeminiCLIProvider::new();
        let line = "Approve? (y/n/always) ->";

        let perm = provider
            .is_permission_prompt(line)
            .expect("Should detect permission");
        assert_eq!(perm.description, line);
    }

    #[test]
    fn test_permission_prompt_simple() {
        let provider = GeminiCLIProvider::new();
        let line = "Approve? (y/n) ->";

        let perm = provider
            .is_permission_prompt(line)
            .expect("Should detect permission");
        assert_eq!(perm.description, line);
    }

    #[test]
    fn test_permission_prompt_write() {
        let provider = GeminiCLIProvider::new();
        let line = "Write to /src/main.rs? Approve? (y/n/always) ->";

        let perm = provider
            .is_permission_prompt(line)
            .expect("Should detect permission");
        assert_eq!(perm.tool_name, "write_file");
        assert_eq!(perm.file_path, Some("/src/main.rs".to_string()));
    }

    #[test]
    fn test_permission_prompt_shell() {
        let provider = GeminiCLIProvider::new();
        let line = "Execute shell command: ls -la? Approve? (y/n) ->";

        let perm = provider
            .is_permission_prompt(line)
            .expect("Should detect permission");
        assert_eq!(perm.tool_name, "run_shell_command");
    }

    #[test]
    fn test_permission_prompt_confirm_style() {
        let provider = GeminiCLIProvider::new();
        let line = "Confirm write file /tmp/test.txt? (y/n)";

        let perm = provider
            .is_permission_prompt(line)
            .expect("Should detect permission");
        assert_eq!(perm.tool_name, "write_file");
    }

    #[test]
    fn test_not_permission_prompt() {
        let provider = GeminiCLIProvider::new();

        // Not a permission prompt
        assert!(provider.is_permission_prompt("Hello world").is_none());
        assert!(provider
            .is_permission_prompt("Just a question? yes/no")
            .is_none());
        assert!(provider.is_permission_prompt("Some output text").is_none());
    }

    // =========================================================================
    // Tool Name Extraction Tests
    // =========================================================================

    #[test]
    fn test_extract_tool_name() {
        assert_eq!(
            GeminiCLIProvider::extract_tool_name("write to file"),
            "write_file"
        );
        assert_eq!(
            GeminiCLIProvider::extract_tool_name("create new file"),
            "write_file"
        );
        assert_eq!(
            GeminiCLIProvider::extract_tool_name("save changes"),
            "write_file"
        );
        assert_eq!(
            GeminiCLIProvider::extract_tool_name("read the file"),
            "read_file"
        );
        assert_eq!(
            GeminiCLIProvider::extract_tool_name("open file"),
            "read_file"
        );
        assert_eq!(
            GeminiCLIProvider::extract_tool_name("execute command"),
            "run_shell_command"
        );
        assert_eq!(
            GeminiCLIProvider::extract_tool_name("run shell script"),
            "run_shell_command"
        );
        assert_eq!(
            GeminiCLIProvider::extract_tool_name("delete the file"),
            "delete_file"
        );
        assert_eq!(
            GeminiCLIProvider::extract_tool_name("fetch from web"),
            "web_fetch"
        );
        assert_eq!(
            GeminiCLIProvider::extract_tool_name("search google"),
            "google_web_search"
        );
        assert_eq!(
            GeminiCLIProvider::extract_tool_name("do something"),
            "unknown_tool"
        );
    }

    // =========================================================================
    // File Path Extraction Tests
    // =========================================================================

    #[test]
    fn test_extract_file_path() {
        assert_eq!(
            GeminiCLIProvider::extract_file_path("write to /src/main.rs please"),
            Some("/src/main.rs".to_string())
        );
        assert_eq!(
            GeminiCLIProvider::extract_file_path("file `/home/user/test.txt`?"),
            Some("/home/user/test.txt".to_string())
        );
        assert_eq!(
            GeminiCLIProvider::extract_file_path("path: /tmp/output.log"),
            Some("/tmp/output.log".to_string())
        );
        assert_eq!(GeminiCLIProvider::extract_file_path("no path here"), None);
    }

    // =========================================================================
    // Full Integration Tests
    // =========================================================================

    #[test]
    fn test_full_conversation_flow() {
        let provider = GeminiCLIProvider::new();

        // Simulate a Gemini conversation
        let events = vec![
            r#"{"type":"init","sessionId":"sess-1","model":"gemini-2.5-pro"}"#,
            r#"{"type":"message","role":"assistant","content":"I'll read the file for you."}"#,
            r#"{"type":"tool_use","tool_name":"read_file","tool_id":"t1","parameters":{"path":"/src/lib.rs"}}"#,
            r#"{"type":"tool_result","tool_id":"t1","status":"success","output":"pub fn hello() {}"}"#,
            r#"{"type":"message","role":"assistant","content":"The file contains a hello function."}"#,
            r#"{"type":"result","status":"success","stats":{"model":{"inputTokens":100,"outputTokens":50}}}"#,
        ];

        let parsed: Vec<_> = events
            .iter()
            .filter_map(|line| provider.parse_line(line))
            .collect();

        assert_eq!(parsed.len(), 6);
        assert!(parsed[0].is_init());
        assert!(parsed[1].is_message());
        assert!(parsed[2].is_tool_use()); // Gemini emits separate tool_use events
        assert!(parsed[3].is_tool_result()); // Gemini emits separate tool_result events
        assert!(parsed[4].is_message());
        assert!(parsed[5].is_complete());
    }

    #[test]
    fn test_role_conversion() {
        assert_eq!(
            GeminiCLIProvider::convert_role("user"),
            AgentMessageRole::User
        );
        assert_eq!(
            GeminiCLIProvider::convert_role("assistant"),
            AgentMessageRole::Assistant
        );
        assert_eq!(
            GeminiCLIProvider::convert_role("model"),
            AgentMessageRole::Assistant
        );
        assert_eq!(
            GeminiCLIProvider::convert_role("system"),
            AgentMessageRole::System
        );
        assert_eq!(
            GeminiCLIProvider::convert_role("unknown"),
            AgentMessageRole::Assistant
        );
    }
}
