//! OpenAI Codex CLI Provider
//!
//! Implementation of the `AgentProvider` trait for OpenAI's Codex CLI.
//! This provider parses Codex CLI's `--json` JSONL output into the unified
//! `UnifiedAgentEvent` format.
//!
//! # Codex CLI Output Format
//!
//! When running with `codex exec --json`, the CLI outputs newline-delimited JSON (JSONL)
//! with the following event types:
//!
//! - `thread.started` - Thread initialization with thread_id
//! - `turn.started` - Turn begins (user message to assistant response)
//! - `turn.completed` - Turn finishes with token usage stats
//! - `turn.failed` - Turn failed with error message
//! - `item.started` - Item processing begins
//! - `item.updated` - Item state changes (streaming updates)
//! - `item.completed` - Item finishes
//! - `error` - Top-level error occurred
//!
//! # Item Types
//!
//! Item events carry different payloads based on their type:
//! - `assistant_message` - Agent's response text
//! - `reasoning` - Agent's reasoning/thinking process
//! - `command_execution` - Shell command execution
//! - `file_change` - File modifications (create, edit, delete)
//! - `mcp_tool_call` - Model Context Protocol tool invocation
//! - `web_search` - Web search operation
//! - `todo_list` / `plan` - Task planning
//!
//! # Example Output
//!
//! ```json
//! {"type":"thread.started","thread_id":"0199a213-81c0-7800-8aa1-bbab2a035a53"}
//! {"type":"turn.started","turn_id":"turn_1"}
//! {"type":"item.started","item_id":"item_1","item_type":"assistant_message"}
//! {"type":"item.updated","item_id":"item_1","content":"Let me help you..."}
//! {"type":"item.completed","item_id":"item_1","item_type":"assistant_message","content":"Done!"}
//! {"type":"turn.completed","usage":{"input_tokens":24763,"cached_input_tokens":24448,"output_tokens":122}}
//! ```
//!
//! # Installation
//!
//! ```bash
//! npm i -g @openai/codex
//! # or
//! brew install --cask codex
//! ```
//!
//! # Usage
//!
//! ```bash
//! codex exec --json "your prompt"                     # Non-interactive with JSON output
//! codex exec --json --full-auto "your prompt"        # Full auto mode
//! codex exec --json -m gpt-5-codex "your prompt"     # With specific model
//! ```
//!
//! # Approval Modes
//!
//! Codex uses the `--ask-for-approval` flag with values:
//! - `untrusted` - Ask for all untrusted actions (default)
//! - `on-failure` - Only ask when something fails
//! - `on-request` - Ask only when explicitly requested
//! - `never` - Never ask (auto-approve all)

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
pub const PROVIDER_ID: &str = "codex-cli";

/// Display name for UI
pub const DISPLAY_NAME: &str = "Codex CLI";

/// CLI command name
pub const COMMAND: &str = "codex";

// =============================================================================
// Permission Detection Regex
// =============================================================================

/// Regex for detecting Codex CLI permission prompts.
/// Codex prompts look like: "Approve? (y/n/a)" or "Allow command execution? (y/n)"
static PERMISSION_REGEX: LazyLock<Regex> = LazyLock::new(|| {
    Regex::new(r"(?i)(?:Approve|Allow|Confirm|Execute)\?\s*\(y/n(?:/a(?:lways)?)?\)")
        .expect("Invalid permission regex")
});

/// Alternative patterns for sandbox/approval prompts
static SANDBOX_REGEX: LazyLock<Regex> = LazyLock::new(|| {
    Regex::new(r"(?i)(?:Run|Write|Read|Delete|Create|Execute)\s+.*\?\s*(?:\[y/n\]|\(y/n\))")
        .expect("Invalid sandbox regex")
});

/// Regex for extracting file path from permission context
static FILE_PATH_REGEX: LazyLock<Regex> = LazyLock::new(|| {
    Regex::new(r#"(?:file|path|to)\s*["`']?(/[^\s"'`?]+|[A-Za-z]:\\[^\s"'`?]+)["`']?"#)
        .expect("Invalid file path regex")
});

/// Regex for extracting command from permission prompt
static COMMAND_REGEX: LazyLock<Regex> = LazyLock::new(|| {
    Regex::new(r#"(?:command|run|execute):\s*[`"]?([^`"]+)[`"]?"#)
        .expect("Invalid command regex")
});

// =============================================================================
// Codex Event Types (for parsing)
// =============================================================================

/// Codex CLI JSONL event types.
/// These match the JSON lines output from `codex exec --json`.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type", rename_all = "snake_case")]
pub enum CodexEvent {
    /// Thread started event
    #[serde(rename = "thread.started")]
    ThreadStarted {
        /// Thread ID (UUID format)
        thread_id: String,
        /// Additional data
        #[serde(flatten)]
        data: serde_json::Value,
    },
    /// Turn started event
    #[serde(rename = "turn.started")]
    TurnStarted {
        /// Turn ID
        #[serde(default)]
        turn_id: Option<String>,
        /// Additional data
        #[serde(flatten)]
        data: serde_json::Value,
    },
    /// Turn completed event with usage stats
    #[serde(rename = "turn.completed")]
    TurnCompleted {
        /// Token usage statistics
        #[serde(default)]
        usage: Option<CodexUsage>,
        /// Additional data
        #[serde(flatten)]
        data: serde_json::Value,
    },
    /// Turn failed event
    #[serde(rename = "turn.failed")]
    TurnFailed {
        /// Error message
        #[serde(default)]
        message: Option<String>,
        /// Error type/code
        #[serde(default)]
        error_type: Option<String>,
        /// Additional data
        #[serde(flatten)]
        data: serde_json::Value,
    },
    /// Item started event
    #[serde(rename = "item.started")]
    ItemStarted {
        /// Item ID
        item_id: String,
        /// Item type (assistant_message, command_execution, file_change, etc.)
        item_type: String,
        /// Additional data
        #[serde(flatten)]
        data: serde_json::Value,
    },
    /// Item updated event (streaming)
    #[serde(rename = "item.updated")]
    ItemUpdated {
        /// Item ID
        item_id: String,
        /// Updated content (partial)
        #[serde(default)]
        content: Option<String>,
        /// Additional data
        #[serde(flatten)]
        data: serde_json::Value,
    },
    /// Item completed event
    #[serde(rename = "item.completed")]
    ItemCompleted {
        /// Item ID
        item_id: String,
        /// Item type
        #[serde(default)]
        item_type: Option<String>,
        /// Final content
        #[serde(default)]
        content: Option<String>,
        /// Output (for command execution)
        #[serde(default)]
        output: Option<String>,
        /// Status (success, error, etc.)
        #[serde(default)]
        status: Option<String>,
        /// File path (for file_change items)
        #[serde(default)]
        file_path: Option<String>,
        /// Change type (create, edit, delete for file_change)
        #[serde(default)]
        change_type: Option<String>,
        /// Additional data
        #[serde(flatten)]
        data: serde_json::Value,
    },
    /// Error event
    #[serde(rename = "error")]
    Error {
        /// Error message
        message: String,
        /// Error code
        #[serde(default)]
        code: Option<String>,
        /// Additional data
        #[serde(flatten)]
        data: serde_json::Value,
    },
}

/// Token usage statistics from Codex
#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct CodexUsage {
    /// Input tokens used
    #[serde(default)]
    pub input_tokens: Option<i32>,
    /// Cached input tokens (from previous context)
    #[serde(default)]
    pub cached_input_tokens: Option<i32>,
    /// Output tokens generated
    #[serde(default)]
    pub output_tokens: Option<i32>,
}

// =============================================================================
// CodexCLIProvider
// =============================================================================

/// Provider implementation for OpenAI's Codex CLI
#[derive(Debug, Default)]
pub struct CodexCLIProvider;

impl CodexCLIProvider {
    /// Create a new Codex CLI provider
    pub fn new() -> Self {
        Self
    }

    /// Map Codex item type to a tool name
    fn item_type_to_tool_name(item_type: &str) -> String {
        match item_type {
            "command_execution" => "shell".to_string(),
            "file_change" => "file".to_string(),
            "mcp_tool_call" => "mcp".to_string(),
            "web_search" => "web_search".to_string(),
            "reasoning" => "thinking".to_string(),
            "assistant_message" => "message".to_string(),
            "todo_list" | "plan" => "planning".to_string(),
            other => other.to_string(),
        }
    }

    /// Parse a CodexEvent into UnifiedAgentEvent
    fn convert_event(event: CodexEvent) -> Option<UnifiedAgentEvent> {
        match event {
            CodexEvent::ThreadStarted { thread_id, data } => {
                // Extract model if available
                let model = data
                    .get("model")
                    .and_then(|m| m.as_str())
                    .unwrap_or("gpt-5-codex")
                    .to_string();

                // Codex doesn't list tools in thread.started, use default set
                let tools = vec![
                    "shell".to_string(),
                    "file".to_string(),
                    "web_search".to_string(),
                ];

                Some(UnifiedAgentEvent::init(thread_id, model, tools))
            }
            CodexEvent::TurnStarted { .. } => {
                // Turn started doesn't map directly to a unified event
                // We could emit a system message, but it's mostly internal
                None
            }
            CodexEvent::TurnCompleted { usage, .. } => {
                // Turn completed is the end of a conversation turn
                let stats = usage.map(|u| {
                    let input = u.input_tokens.unwrap_or(0);
                    let cached = u.cached_input_tokens.unwrap_or(0);
                    let output = u.output_tokens.unwrap_or(0);

                    AgentStats {
                        input_tokens: Some(input + cached),
                        output_tokens: Some(output),
                        total_tokens: Some(input + cached + output),
                        tool_calls: None,
                        duration_ms: None,
                        model: None,
                    }
                });

                Some(UnifiedAgentEvent::Complete {
                    status: CompletionStatus::Success,
                    stats,
                })
            }
            CodexEvent::TurnFailed {
                message,
                error_type,
                ..
            } => {
                let code = error_type.unwrap_or_else(|| "turn_failed".to_string());
                let msg = message.unwrap_or_else(|| "Turn failed".to_string());
                Some(UnifiedAgentEvent::error(code, msg))
            }
            CodexEvent::ItemStarted {
                item_id, item_type, ..
            } => {
                // For tool-like items, emit ToolUse
                match item_type.as_str() {
                    "command_execution" | "file_change" | "mcp_tool_call" | "web_search" => {
                        Some(UnifiedAgentEvent::ToolUse {
                            tool_id: item_id,
                            tool_name: Self::item_type_to_tool_name(&item_type),
                            input: serde_json::json!({"item_type": item_type}),
                        })
                    }
                    "reasoning" => {
                        // Reasoning starts - we'll emit the content when completed
                        None
                    }
                    _ => None,
                }
            }
            CodexEvent::ItemUpdated { content, .. } => {
                // Streaming update - emit as partial message
                if let Some(text) = content {
                    if !text.is_empty() {
                        return Some(UnifiedAgentEvent::message(
                            AgentMessageRole::Assistant,
                            vec![ContentBlock::text(text)],
                        ));
                    }
                }
                None
            }
            CodexEvent::ItemCompleted {
                item_id,
                item_type,
                content,
                output,
                status,
                file_path,
                change_type,
                data,
            } => {
                let item_t = item_type.as_deref().unwrap_or("unknown");

                match item_t {
                    "assistant_message" => {
                        // Final assistant message
                        let text = content.unwrap_or_default();
                        if text.is_empty() {
                            return None;
                        }
                        Some(UnifiedAgentEvent::message(
                            AgentMessageRole::Assistant,
                            vec![ContentBlock::text(text)],
                        ))
                    }
                    "reasoning" => {
                        // Reasoning/thinking content
                        let thinking = content.unwrap_or_default();
                        if thinking.is_empty() {
                            return None;
                        }
                        Some(UnifiedAgentEvent::message(
                            AgentMessageRole::Assistant,
                            vec![ContentBlock::thinking(thinking)],
                        ))
                    }
                    "command_execution" => {
                        // Shell command completed
                        let output_str = output.or(content).unwrap_or_default();
                        let result_status = match status.as_deref() {
                            Some("success") | Some("completed") | None => ToolResultStatus::Success,
                            Some("error") | Some("failed") => ToolResultStatus::Error,
                            Some("cancelled") => ToolResultStatus::Cancelled,
                            _ => ToolResultStatus::Success,
                        };
                        Some(UnifiedAgentEvent::ToolResult {
                            tool_id: item_id,
                            status: result_status,
                            output: output_str,
                        })
                    }
                    "file_change" => {
                        // File operation completed
                        let path = file_path.unwrap_or_else(|| "unknown".to_string());
                        let change = change_type.unwrap_or_else(|| "edit".to_string());
                        let result_status = match status.as_deref() {
                            Some("success") | Some("completed") | None => ToolResultStatus::Success,
                            Some("error") | Some("failed") => ToolResultStatus::Error,
                            _ => ToolResultStatus::Success,
                        };
                        let output_str = format!("{}: {}", change, path);
                        Some(UnifiedAgentEvent::ToolResult {
                            tool_id: item_id,
                            status: result_status,
                            output: output_str,
                        })
                    }
                    "mcp_tool_call" | "web_search" => {
                        // MCP or web search completed
                        let output_str = output.or(content).unwrap_or_default();
                        let result_status = match status.as_deref() {
                            Some("success") | Some("completed") | None => ToolResultStatus::Success,
                            Some("error") | Some("failed") => ToolResultStatus::Error,
                            _ => ToolResultStatus::Success,
                        };
                        Some(UnifiedAgentEvent::ToolResult {
                            tool_id: item_id,
                            status: result_status,
                            output: output_str,
                        })
                    }
                    "todo_list" | "plan" => {
                        // Planning output - emit as message
                        let text = content
                            .or_else(|| data.get("items").map(|v| v.to_string()))
                            .unwrap_or_default();
                        if text.is_empty() {
                            return None;
                        }
                        Some(UnifiedAgentEvent::message(
                            AgentMessageRole::Assistant,
                            vec![ContentBlock::text(format!("[Plan] {}", text))],
                        ))
                    }
                    _ => {
                        // Unknown item type - emit as message if there's content
                        if let Some(text) = content {
                            if !text.is_empty() {
                                return Some(UnifiedAgentEvent::message(
                                    AgentMessageRole::Assistant,
                                    vec![ContentBlock::text(text)],
                                ));
                            }
                        }
                        None
                    }
                }
            }
            CodexEvent::Error { message, code, .. } => {
                let error_code = code.unwrap_or_else(|| "error".to_string());
                Some(UnifiedAgentEvent::error(error_code, message))
            }
        }
    }

    /// Extract tool name from permission prompt
    fn extract_tool_name(line: &str) -> String {
        let lower = line.to_lowercase();

        if lower.contains("command")
            || lower.contains("execute")
            || lower.contains("run")
            || lower.contains("shell")
        {
            "shell".to_string()
        } else if lower.contains("write") || lower.contains("create") || lower.contains("save") {
            "file_write".to_string()
        } else if lower.contains("read") || lower.contains("open") {
            "file_read".to_string()
        } else if lower.contains("delete") || lower.contains("remove") {
            "file_delete".to_string()
        } else if lower.contains("search") || lower.contains("web") {
            "web_search".to_string()
        } else {
            "unknown_tool".to_string()
        }
    }

    /// Extract file path from permission prompt
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

    /// Extract command from permission prompt
    fn extract_command(line: &str) -> Option<String> {
        if let Some(caps) = COMMAND_REGEX.captures(line) {
            return caps.get(1).map(|m| m.as_str().to_string());
        }
        None
    }
}

impl AgentProvider for CodexCLIProvider {
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
            supports_resume: false, // Codex doesn't support session resume in the same way
            supports_streaming_json: true,
            supports_skip_permissions: true, // via --ask-for-approval never
            supports_verbose: false,
            emits_tool_events: true,
            emits_thinking: true, // via reasoning items
        }
    }

    fn build_command(&self, config: &AgentConfig) -> PtyConfig {
        let mut args = vec!["exec".to_string(), "--json".to_string()];

        // Add model if specified
        if let Some(model) = &config.model {
            args.push("-m".to_string());
            args.push(model.clone());
        }

        // Add prompt as the main argument
        if !config.prompt.is_empty() {
            args.push(config.prompt.clone());
        }

        // Note: Codex doesn't support --resume like Claude
        // Session persistence is handled differently via CODEX_HOME

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

        // Try to parse as CodexEvent
        match serde_json::from_str::<CodexEvent>(trimmed) {
            Ok(event) => Self::convert_event(event),
            Err(_) => {
                // Try parsing as raw JSON and extracting type
                if let Ok(value) = serde_json::from_str::<serde_json::Value>(trimmed) {
                    let event_type = value.get("type").and_then(|t| t.as_str())?;

                    match event_type {
                        "thread.started" => {
                            let thread_id = value
                                .get("thread_id")
                                .and_then(|t| t.as_str())
                                .unwrap_or("unknown")
                                .to_string();
                            let model = value
                                .get("model")
                                .and_then(|m| m.as_str())
                                .unwrap_or("gpt-5-codex")
                                .to_string();
                            return Some(UnifiedAgentEvent::init(
                                thread_id,
                                model,
                                vec!["shell".to_string(), "file".to_string()],
                            ));
                        }
                        "turn.completed" => {
                            let usage = value.get("usage");
                            let stats = usage.map(|u| {
                                let input = u
                                    .get("input_tokens")
                                    .and_then(|n| n.as_i64())
                                    .unwrap_or(0) as i32;
                                let cached = u
                                    .get("cached_input_tokens")
                                    .and_then(|n| n.as_i64())
                                    .unwrap_or(0) as i32;
                                let output = u
                                    .get("output_tokens")
                                    .and_then(|n| n.as_i64())
                                    .unwrap_or(0) as i32;

                                AgentStats {
                                    input_tokens: Some(input + cached),
                                    output_tokens: Some(output),
                                    total_tokens: Some(input + cached + output),
                                    tool_calls: None,
                                    duration_ms: None,
                                    model: None,
                                }
                            });

                            return Some(UnifiedAgentEvent::Complete {
                                status: CompletionStatus::Success,
                                stats,
                            });
                        }
                        "turn.failed" => {
                            let message = value
                                .get("message")
                                .and_then(|m| m.as_str())
                                .unwrap_or("Turn failed")
                                .to_string();
                            let code = value
                                .get("error_type")
                                .or_else(|| value.get("code"))
                                .and_then(|c| c.as_str())
                                .unwrap_or("turn_failed")
                                .to_string();
                            return Some(UnifiedAgentEvent::error(code, message));
                        }
                        "item.completed" => {
                            let item_type = value
                                .get("item_type")
                                .and_then(|t| t.as_str())
                                .unwrap_or("unknown");
                            let content = value.get("content").and_then(|c| c.as_str());

                            if item_type == "assistant_message" {
                                if let Some(text) = content {
                                    if !text.is_empty() {
                                        return Some(UnifiedAgentEvent::message(
                                            AgentMessageRole::Assistant,
                                            vec![ContentBlock::text(text)],
                                        ));
                                    }
                                }
                            }
                        }
                        "error" => {
                            let message = value
                                .get("message")
                                .and_then(|m| m.as_str())
                                .unwrap_or("Unknown error")
                                .to_string();
                            let code = value
                                .get("code")
                                .and_then(|c| c.as_str())
                                .unwrap_or("error")
                                .to_string();
                            return Some(UnifiedAgentEvent::error(code, message));
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

        // Check standard Codex approval prompt
        if PERMISSION_REGEX.is_match(trimmed) || SANDBOX_REGEX.is_match(trimmed) {
            let tool_name = Self::extract_tool_name(trimmed);
            let file_path = Self::extract_file_path(trimmed);
            let command = Self::extract_command(trimmed);

            return Some(PermissionRequest {
                tool_name,
                description: trimmed.to_string(),
                file_path,
                command,
            });
        }

        // Check for simpler "Approve?" patterns
        if trimmed.contains("Approve?") && (trimmed.contains("(y/n") || trimmed.contains("[y/n")) {
            return Some(PermissionRequest {
                tool_name: Self::extract_tool_name(trimmed),
                description: trimmed.to_string(),
                file_path: Self::extract_file_path(trimmed),
                command: Self::extract_command(trimmed),
            });
        }

        None
    }

    fn resume_args(&self, _session_id: &str) -> Vec<String> {
        // Codex doesn't support session resume in the same way as Claude
        // Sessions are persisted in CODEX_HOME but not resumed via CLI args
        vec![]
    }

    fn approval_response(&self, approved: bool) -> &'static [u8] {
        // Codex uses y/n for approval
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
        vec![&PERMISSION_REGEX, &SANDBOX_REGEX]
    }

    fn extract_tool_context(&self, tool_name: &str, input: &serde_json::Value) -> super::ToolContext {
        let mut context = super::ToolContext::new();

        // Codex uses item types like "command_execution", "file_change"
        match tool_name {
            "shell" | "command_execution" => {
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
            "file" | "file_change" | "file_read" | "file_write" | "file_delete" => {
                // Extract file path
                if let Some(path) = input.get("file_path").and_then(|v| v.as_str()) {
                    context.file_path = Some(path.to_string());
                } else if let Some(path) = input.get("path").and_then(|v| v.as_str()) {
                    context.file_path = Some(path.to_string());
                } else if let Some(path) = input.get("filePath").and_then(|v| v.as_str()) {
                    context.file_path = Some(path.to_string());
                } else if let Some(path) = input.get("file").and_then(|v| v.as_str()) {
                    context.file_path = Some(path.to_string());
                }
            }
            _ => {
                // Generic extraction for unknown tools
                if let Some(path) = input.get("file_path").and_then(|v| v.as_str()) {
                    context.file_path = Some(path.to_string());
                } else if let Some(path) = input.get("path").and_then(|v| v.as_str()) {
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
            // Check for Codex CLI error formats
            if let Some(event_type) = value.get("type").and_then(|t| t.as_str()) {
                match event_type {
                    "error" => {
                        let message = value
                            .get("message")
                            .and_then(|m| m.as_str())
                            .unwrap_or("Unknown error")
                            .to_string();
                        let code = value
                            .get("code")
                            .and_then(|c| c.as_str())
                            .unwrap_or("error")
                            .to_string();

                        return Some(super::ExecutionError::provider_error(
                            PROVIDER_ID,
                            code,
                            message,
                        ));
                    }
                    "turn.failed" => {
                        let message = value
                            .get("message")
                            .and_then(|m| m.as_str())
                            .unwrap_or("Turn failed")
                            .to_string();
                        let code = value
                            .get("error_type")
                            .or_else(|| value.get("code"))
                            .and_then(|c| c.as_str())
                            .unwrap_or("turn_failed")
                            .to_string();

                        return Some(super::ExecutionError::provider_error(
                            PROVIDER_ID,
                            code,
                            message,
                        ));
                    }
                    _ => {}
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
        let provider = CodexCLIProvider::new();
        assert_eq!(provider.provider_id(), "codex-cli");
        assert_eq!(provider.display_name(), "Codex CLI");
        assert_eq!(provider.command(), "codex");
    }

    #[test]
    fn test_capabilities() {
        let provider = CodexCLIProvider::new();
        let caps = provider.capabilities();
        assert!(!caps.supports_resume); // Codex doesn't support resume
        assert!(caps.supports_streaming_json);
        assert!(caps.supports_skip_permissions); // via --ask-for-approval never
        assert!(!caps.supports_verbose);
        assert!(caps.emits_tool_events);
        assert!(caps.emits_thinking); // via reasoning items
    }

    #[test]
    fn test_default_env() {
        let provider = CodexCLIProvider::new();
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
        let provider = CodexCLIProvider::new();
        let config = AgentConfig::new("Fix the bug", "/path/to/project");
        let pty_config = provider.build_command(&config);

        assert_eq!(pty_config.command, "codex");
        assert!(pty_config.args.contains(&"exec".to_string()));
        assert!(pty_config.args.contains(&"--json".to_string()));
        assert!(pty_config.args.contains(&"Fix the bug".to_string()));
    }

    #[test]
    fn test_build_command_with_model() {
        let provider = CodexCLIProvider::new();
        let config = AgentConfig::new("Test prompt", "/path/to/project").with_model("gpt-5");
        let pty_config = provider.build_command(&config);

        assert!(pty_config.args.contains(&"-m".to_string()));
        assert!(pty_config.args.contains(&"gpt-5".to_string()));
    }

    #[test]
    fn test_build_command_session_id_ignored() {
        let provider = CodexCLIProvider::new();
        let config =
            AgentConfig::new("Continue work", "/path/to/project").with_session_id("session-123");
        let pty_config = provider.build_command(&config);

        // Session ID should be ignored since Codex doesn't support resume
        assert!(!pty_config.args.contains(&"--resume".to_string()));
        assert!(!pty_config.args.contains(&"session-123".to_string()));
    }

    #[test]
    fn test_resume_args_empty() {
        let provider = CodexCLIProvider::new();
        let args = provider.resume_args("sess-abc");
        assert!(args.is_empty()); // Codex doesn't support resume
    }

    #[test]
    fn test_approval_response() {
        let provider = CodexCLIProvider::new();
        assert_eq!(provider.approval_response(true), b"y\n");
        assert_eq!(provider.approval_response(false), b"n\n");
    }

    // =========================================================================
    // Parse Line Tests - Thread Events
    // =========================================================================

    #[test]
    fn test_parse_thread_started() {
        let provider = CodexCLIProvider::new();
        let line = r#"{"type":"thread.started","thread_id":"0199a213-81c0-7800-8aa1-bbab2a035a53"}"#;

        let event = provider
            .parse_line(line)
            .expect("Should parse thread.started event");

        match event {
            UnifiedAgentEvent::Init {
                session_id,
                model,
                tools,
            } => {
                assert_eq!(session_id, "0199a213-81c0-7800-8aa1-bbab2a035a53");
                assert_eq!(model, "gpt-5-codex");
                assert!(tools.contains(&"shell".to_string()));
            }
            _ => panic!("Expected Init event, got {:?}", event),
        }
    }

    #[test]
    fn test_parse_thread_started_with_model() {
        let provider = CodexCLIProvider::new();
        let line = r#"{"type":"thread.started","thread_id":"abc123","model":"gpt-5"}"#;

        let event = provider.parse_line(line).expect("Should parse");

        match event {
            UnifiedAgentEvent::Init { model, .. } => {
                assert_eq!(model, "gpt-5");
            }
            _ => panic!("Expected Init event"),
        }
    }

    // =========================================================================
    // Parse Line Tests - Turn Events
    // =========================================================================

    #[test]
    fn test_parse_turn_started() {
        let provider = CodexCLIProvider::new();
        let line = r#"{"type":"turn.started","turn_id":"turn_1"}"#;

        // Turn started doesn't emit a unified event
        assert!(provider.parse_line(line).is_none());
    }

    #[test]
    fn test_parse_turn_completed() {
        let provider = CodexCLIProvider::new();
        let line = r#"{"type":"turn.completed","usage":{"input_tokens":24763,"cached_input_tokens":24448,"output_tokens":122}}"#;

        let event = provider
            .parse_line(line)
            .expect("Should parse turn.completed");

        match event {
            UnifiedAgentEvent::Complete { status, stats } => {
                assert!(status.is_success());
                let stats = stats.expect("Should have stats");
                assert_eq!(stats.input_tokens, Some(24763 + 24448));
                assert_eq!(stats.output_tokens, Some(122));
            }
            _ => panic!("Expected Complete event, got {:?}", event),
        }
    }

    #[test]
    fn test_parse_turn_completed_minimal() {
        let provider = CodexCLIProvider::new();
        let line = r#"{"type":"turn.completed"}"#;

        let event = provider.parse_line(line).expect("Should parse");

        match event {
            UnifiedAgentEvent::Complete { status, stats } => {
                assert!(status.is_success());
                assert!(stats.is_none());
            }
            _ => panic!("Expected Complete event"),
        }
    }

    #[test]
    fn test_parse_turn_failed() {
        let provider = CodexCLIProvider::new();
        let line = r#"{"type":"turn.failed","message":"Rate limit exceeded","error_type":"rate_limit"}"#;

        let event = provider.parse_line(line).expect("Should parse turn.failed");

        match event {
            UnifiedAgentEvent::Error { code, message } => {
                assert_eq!(code, "rate_limit");
                assert_eq!(message, "Rate limit exceeded");
            }
            _ => panic!("Expected Error event, got {:?}", event),
        }
    }

    // =========================================================================
    // Parse Line Tests - Item Events
    // =========================================================================

    #[test]
    fn test_parse_item_started_command() {
        let provider = CodexCLIProvider::new();
        let line =
            r#"{"type":"item.started","item_id":"item_1","item_type":"command_execution"}"#;

        let event = provider
            .parse_line(line)
            .expect("Should parse item.started");

        match event {
            UnifiedAgentEvent::ToolUse {
                tool_id, tool_name, ..
            } => {
                assert_eq!(tool_id, "item_1");
                assert_eq!(tool_name, "shell");
            }
            _ => panic!("Expected ToolUse event, got {:?}", event),
        }
    }

    #[test]
    fn test_parse_item_started_file_change() {
        let provider = CodexCLIProvider::new();
        let line = r#"{"type":"item.started","item_id":"item_2","item_type":"file_change"}"#;

        let event = provider.parse_line(line).expect("Should parse");

        match event {
            UnifiedAgentEvent::ToolUse { tool_name, .. } => {
                assert_eq!(tool_name, "file");
            }
            _ => panic!("Expected ToolUse event"),
        }
    }

    #[test]
    fn test_parse_item_updated() {
        let provider = CodexCLIProvider::new();
        let line = r#"{"type":"item.updated","item_id":"item_1","content":"Let me help you..."}"#;

        let event = provider
            .parse_line(line)
            .expect("Should parse item.updated");

        match event {
            UnifiedAgentEvent::Message { role, content } => {
                assert_eq!(role, AgentMessageRole::Assistant);
                assert!(content[0].as_text() == Some("Let me help you..."));
            }
            _ => panic!("Expected Message event, got {:?}", event),
        }
    }

    #[test]
    fn test_parse_item_completed_assistant_message() {
        let provider = CodexCLIProvider::new();
        let line = r#"{"type":"item.completed","item_id":"item_1","item_type":"assistant_message","content":"Done with the task!"}"#;

        let event = provider.parse_line(line).expect("Should parse");

        match event {
            UnifiedAgentEvent::Message { role, content } => {
                assert_eq!(role, AgentMessageRole::Assistant);
                assert_eq!(content[0].as_text(), Some("Done with the task!"));
            }
            _ => panic!("Expected Message event"),
        }
    }

    #[test]
    fn test_parse_item_completed_reasoning() {
        let provider = CodexCLIProvider::new();
        let line = r#"{"type":"item.completed","item_id":"item_1","item_type":"reasoning","content":"Let me think about this..."}"#;

        let event = provider.parse_line(line).expect("Should parse");

        match event {
            UnifiedAgentEvent::Message { content, .. } => {
                assert!(content[0].is_thinking());
            }
            _ => panic!("Expected Message event with thinking"),
        }
    }

    #[test]
    fn test_parse_item_completed_command_execution() {
        let provider = CodexCLIProvider::new();
        let line = r#"{"type":"item.completed","item_id":"item_1","item_type":"command_execution","output":"file1.rs\nfile2.rs","status":"success"}"#;

        let event = provider.parse_line(line).expect("Should parse");

        match event {
            UnifiedAgentEvent::ToolResult {
                tool_id,
                status,
                output,
            } => {
                assert_eq!(tool_id, "item_1");
                assert!(status.is_success());
                assert!(output.contains("file1.rs"));
            }
            _ => panic!("Expected ToolResult event, got {:?}", event),
        }
    }

    #[test]
    fn test_parse_item_completed_file_change() {
        let provider = CodexCLIProvider::new();
        let line = r#"{"type":"item.completed","item_id":"item_2","item_type":"file_change","file_path":"/src/main.rs","change_type":"edit","status":"success"}"#;

        let event = provider.parse_line(line).expect("Should parse");

        match event {
            UnifiedAgentEvent::ToolResult {
                status, output, ..
            } => {
                assert!(status.is_success());
                assert!(output.contains("/src/main.rs"));
                assert!(output.contains("edit"));
            }
            _ => panic!("Expected ToolResult event"),
        }
    }

    // =========================================================================
    // Parse Line Tests - Error Events
    // =========================================================================

    #[test]
    fn test_parse_error_event() {
        let provider = CodexCLIProvider::new();
        let line = r#"{"type":"error","message":"API key invalid","code":"auth_error"}"#;

        let event = provider.parse_line(line).expect("Should parse error event");

        match event {
            UnifiedAgentEvent::Error { code, message } => {
                assert_eq!(code, "auth_error");
                assert_eq!(message, "API key invalid");
            }
            _ => panic!("Expected Error event, got {:?}", event),
        }
    }

    #[test]
    fn test_parse_error_event_no_code() {
        let provider = CodexCLIProvider::new();
        let line = r#"{"type":"error","message":"Something went wrong"}"#;

        let event = provider.parse_line(line).expect("Should parse");

        match event {
            UnifiedAgentEvent::Error { code, message } => {
                assert_eq!(code, "error"); // Default code
                assert_eq!(message, "Something went wrong");
            }
            _ => panic!("Expected Error event"),
        }
    }

    // =========================================================================
    // Parse Line Tests - Edge Cases
    // =========================================================================

    #[test]
    fn test_parse_empty_line() {
        let provider = CodexCLIProvider::new();
        assert!(provider.parse_line("").is_none());
        assert!(provider.parse_line("   ").is_none());
        assert!(provider.parse_line("\n").is_none());
    }

    #[test]
    fn test_parse_non_json() {
        let provider = CodexCLIProvider::new();
        assert!(provider.parse_line("not json").is_none());
        assert!(provider.parse_line("Approve? (y/n)").is_none());
    }

    #[test]
    fn test_parse_invalid_json() {
        let provider = CodexCLIProvider::new();
        assert!(provider.parse_line("{invalid}").is_none());
        assert!(provider.parse_line("{\"type\":}").is_none());
    }

    // =========================================================================
    // Permission Prompt Tests
    // =========================================================================

    #[test]
    fn test_permission_prompt_approve() {
        let provider = CodexCLIProvider::new();
        let line = "Approve? (y/n/a)";

        let perm = provider
            .is_permission_prompt(line)
            .expect("Should detect permission");
        assert_eq!(perm.description, line);
    }

    #[test]
    fn test_permission_prompt_execute() {
        let provider = CodexCLIProvider::new();
        let line = "Execute command: ls -la? (y/n)";

        let perm = provider
            .is_permission_prompt(line)
            .expect("Should detect permission");
        assert_eq!(perm.tool_name, "shell");
    }

    #[test]
    fn test_permission_prompt_write() {
        let provider = CodexCLIProvider::new();
        let line = "Write to /src/main.rs? [y/n]";

        let perm = provider
            .is_permission_prompt(line)
            .expect("Should detect permission");
        assert_eq!(perm.tool_name, "file_write");
        assert_eq!(perm.file_path, Some("/src/main.rs".to_string()));
    }

    #[test]
    fn test_permission_prompt_run_command() {
        let provider = CodexCLIProvider::new();
        let line = "Run shell command `npm install`? Approve? (y/n)";

        let perm = provider
            .is_permission_prompt(line)
            .expect("Should detect permission");
        assert_eq!(perm.tool_name, "shell");
    }

    #[test]
    fn test_not_permission_prompt() {
        let provider = CodexCLIProvider::new();

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
            CodexCLIProvider::extract_tool_name("execute command"),
            "shell"
        );
        assert_eq!(CodexCLIProvider::extract_tool_name("run npm"), "shell");
        assert_eq!(
            CodexCLIProvider::extract_tool_name("write to file"),
            "file_write"
        );
        assert_eq!(
            CodexCLIProvider::extract_tool_name("create new file"),
            "file_write"
        );
        assert_eq!(
            CodexCLIProvider::extract_tool_name("read the file"),
            "file_read"
        );
        assert_eq!(
            CodexCLIProvider::extract_tool_name("delete the file"),
            "file_delete"
        );
        assert_eq!(
            CodexCLIProvider::extract_tool_name("search the web"),
            "web_search"
        );
        assert_eq!(
            CodexCLIProvider::extract_tool_name("do something"),
            "unknown_tool"
        );
    }

    // =========================================================================
    // File Path Extraction Tests
    // =========================================================================

    #[test]
    fn test_extract_file_path() {
        assert_eq!(
            CodexCLIProvider::extract_file_path("write to /src/main.rs please"),
            Some("/src/main.rs".to_string())
        );
        assert_eq!(
            CodexCLIProvider::extract_file_path("file `/home/user/test.txt`?"),
            Some("/home/user/test.txt".to_string())
        );
        assert_eq!(
            CodexCLIProvider::extract_file_path("path: /tmp/output.log"),
            Some("/tmp/output.log".to_string())
        );
        assert_eq!(CodexCLIProvider::extract_file_path("no path here"), None);
    }

    // =========================================================================
    // Item Type to Tool Name Tests
    // =========================================================================

    #[test]
    fn test_item_type_to_tool_name() {
        assert_eq!(
            CodexCLIProvider::item_type_to_tool_name("command_execution"),
            "shell"
        );
        assert_eq!(
            CodexCLIProvider::item_type_to_tool_name("file_change"),
            "file"
        );
        assert_eq!(
            CodexCLIProvider::item_type_to_tool_name("mcp_tool_call"),
            "mcp"
        );
        assert_eq!(
            CodexCLIProvider::item_type_to_tool_name("web_search"),
            "web_search"
        );
        assert_eq!(
            CodexCLIProvider::item_type_to_tool_name("reasoning"),
            "thinking"
        );
        assert_eq!(
            CodexCLIProvider::item_type_to_tool_name("assistant_message"),
            "message"
        );
        assert_eq!(CodexCLIProvider::item_type_to_tool_name("unknown"), "unknown");
    }

    // =========================================================================
    // Full Integration Tests
    // =========================================================================

    #[test]
    fn test_full_conversation_flow() {
        let provider = CodexCLIProvider::new();

        // Simulate a Codex conversation
        let events = vec![
            r#"{"type":"thread.started","thread_id":"thread-1"}"#,
            r#"{"type":"turn.started","turn_id":"turn-1"}"#,
            r#"{"type":"item.started","item_id":"item-1","item_type":"assistant_message"}"#,
            r#"{"type":"item.updated","item_id":"item-1","content":"I'll read the file..."}"#,
            r#"{"type":"item.completed","item_id":"item-1","item_type":"assistant_message","content":"I'll read the file for you."}"#,
            r#"{"type":"item.started","item_id":"item-2","item_type":"command_execution"}"#,
            r#"{"type":"item.completed","item_id":"item-2","item_type":"command_execution","output":"file contents","status":"success"}"#,
            r#"{"type":"item.completed","item_id":"item-3","item_type":"assistant_message","content":"The file contains..."}"#,
            r#"{"type":"turn.completed","usage":{"input_tokens":100,"output_tokens":50}}"#,
        ];

        let parsed: Vec<_> = events
            .iter()
            .filter_map(|line| provider.parse_line(line))
            .collect();

        // Should get: Init, Message (update), Message (complete), ToolUse, ToolResult, Message, Complete
        assert!(parsed.len() >= 5);
        assert!(parsed[0].is_init());
        assert!(parsed.iter().any(|e| e.is_complete()));
        assert!(parsed.iter().any(|e| e.is_tool_use()));
        assert!(parsed.iter().any(|e| e.is_tool_result()));
    }

    #[test]
    fn test_error_flow() {
        let provider = CodexCLIProvider::new();

        let events = vec![
            r#"{"type":"thread.started","thread_id":"thread-1"}"#,
            r#"{"type":"turn.started"}"#,
            r#"{"type":"turn.failed","message":"API rate limit","error_type":"rate_limit"}"#,
        ];

        let parsed: Vec<_> = events
            .iter()
            .filter_map(|line| provider.parse_line(line))
            .collect();

        assert_eq!(parsed.len(), 2); // Init, Error
        assert!(parsed[0].is_init());
        assert!(parsed[1].is_error());
    }
}
