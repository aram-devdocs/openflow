//! Event Normalizer Service
//!
//! Transforms `UnifiedAgentEvent` into `NormalizedEntry` - the canonical format
//! for all agent events. This service is provider-agnostic and handles event
//! enrichment, metadata extraction, and content generation.
//!
//! # Architecture
//!
//! ```text
//! ┌─────────────────────────────────────────────────────────────────────────┐
//! │                      Event Normalization Pipeline                        │
//! ├─────────────────────────────────────────────────────────────────────────┤
//! │                                                                          │
//! │  UnifiedAgentEvent          EventNormalizer         NormalizedEntry     │
//! │  (provider output)          (transformation)        (canonical)         │
//! │                                                                          │
//! │  - Raw event data      →    - Generate ID       →   - Unique ID         │
//! │  - Type-safe enum          - Assign sequence        - Sequence number   │
//! │  - Provider-agnostic       - Add timestamp          - Timestamp         │
//! │                            - Extract metadata       - Rich metadata     │
//! │                            - Generate content       - Display content   │
//! │                                                                          │
//! └─────────────────────────────────────────────────────────────────────────┘
//! ```
//!
//! # Key Features
//!
//! - **ID Generation**: Creates unique UUID v4 for each entry
//! - **Sequencing**: Assigns monotonic sequence numbers per session
//! - **Timestamping**: Adds precise timestamps to each event
//! - **Metadata Extraction**: Extracts file paths, commands, exit codes from tool operations
//! - **Content Generation**: Creates human-readable content for UI display
//! - **Error Handling**: Gracefully handles malformed or incomplete events

use chrono::Utc;
use openflow_contracts::events::{
    AgentStats, CompletionStatus, ContentBlock, EntryMetadata, EntryType, NormalizedEntry,
    ToolResultStatus, UnifiedAgentEvent,
};
use tracing::{debug, trace, warn};
use uuid::Uuid;

use crate::services::ServiceResult;

/// EventNormalizer transforms UnifiedAgentEvent to NormalizedEntry
///
/// This is a stateless service that performs event normalization.
/// Sequence numbers and session management are handled by the caller.
///
/// # Example
/// ```ignore
/// use openflow_core::services::normalizer::EventNormalizer;
/// use openflow_contracts::events::UnifiedAgentEvent;
///
/// let normalizer = EventNormalizer::new();
/// let event = UnifiedAgentEvent::assistant_text("Hello, world!");
/// let entry = normalizer.normalize(
///     event,
///     "session-123",
///     42, // sequence number
/// )?;
///
/// assert_eq!(entry.sequence, 42);
/// assert_eq!(entry.session_id, "session-123");
/// ```
#[derive(Debug, Clone)]
pub struct EventNormalizer {
    // Future configuration options could go here
}

impl EventNormalizer {
    /// Create a new EventNormalizer
    pub fn new() -> Self {
        debug!("Creating EventNormalizer");
        Self {}
    }

    /// Normalize a UnifiedAgentEvent to NormalizedEntry
    ///
    /// # Arguments
    /// * `event` - The unified event from a provider
    /// * `session_id` - The session this event belongs to
    /// * `sequence` - Monotonic sequence number for this event
    ///
    /// # Returns
    /// A `NormalizedEntry` ready for persistence and streaming
    pub fn normalize(
        &self,
        event: UnifiedAgentEvent,
        session_id: impl Into<String>,
        sequence: i32,
    ) -> ServiceResult<NormalizedEntry> {
        let session_id = session_id.into();
        let id = Uuid::new_v4().to_string();
        let timestamp = Utc::now();

        trace!(
            event_type = event.event_type(),
            session_id = %session_id,
            sequence = sequence,
            "Normalizing event"
        );

        // Transform event to entry type and extract content
        let (entry_type, content, metadata) = self.transform_event(event)?;

        // Build the normalized entry
        let entry = NormalizedEntry::with_timestamp(
            id,
            session_id,
            sequence,
            entry_type,
            content,
            timestamp,
        );

        // Add metadata if present
        let entry = if let Some(meta) = metadata {
            if !meta.is_empty() {
                entry.with_metadata(meta)
            } else {
                entry
            }
        } else {
            entry
        };

        Ok(entry)
    }

    /// Transform a UnifiedAgentEvent into EntryType, content, and metadata
    fn transform_event(
        &self,
        event: UnifiedAgentEvent,
    ) -> ServiceResult<(EntryType, String, Option<EntryMetadata>)> {
        match event {
            UnifiedAgentEvent::Init {
                session_id,
                model,
                tools,
            } => {
                let content = format!(
                    "Session initialized with model {} ({} tools available)",
                    model,
                    tools.len()
                );
                let entry_type = EntryType::init(session_id, model, tools);
                Ok((entry_type, content, None))
            }

            UnifiedAgentEvent::Message { role, content } => {
                let (text_content, metadata) = self.extract_message_content(&content);
                let entry_type = EntryType::message(role);
                Ok((entry_type, text_content, metadata))
            }

            UnifiedAgentEvent::ToolUse {
                tool_id,
                tool_name,
                input,
            } => {
                let (content, metadata) = self.extract_tool_use_info(&tool_name, &input);
                let entry_type = EntryType::tool_use(tool_id, tool_name, input);
                Ok((entry_type, content, Some(metadata)))
            }

            UnifiedAgentEvent::ToolResult {
                tool_id,
                status,
                output,
            } => {
                let content = self.format_tool_result(&status, &output);
                let metadata = self.extract_tool_result_metadata(&status);
                let entry_type = EntryType::tool_result(tool_id, status, output, None);
                Ok((entry_type, content, metadata))
            }

            UnifiedAgentEvent::Complete { status, stats } => {
                let content = self.format_completion(&status, &stats);
                let entry_type = EntryType::complete(status, stats);
                Ok((entry_type, content, None))
            }

            UnifiedAgentEvent::Error { code, message } => {
                let content = format!("Error ({}): {}", code, message);
                let recoverable = self.is_error_recoverable(&code);
                let entry_type = EntryType::error(code, recoverable);
                Ok((entry_type, content, None))
            }

            UnifiedAgentEvent::Permission {
                tool_name,
                description,
                file_path,
            } => {
                // Permission events are mapped to System type with subtype "permission"
                let content = format!("Permission required: {} - {}", tool_name, description);
                let entry_type = EntryType::system("permission");
                let metadata = file_path.map(EntryMetadata::with_file_path);
                Ok((entry_type, content, metadata))
            }
        }
    }

    /// Extract human-readable content from message content blocks
    fn extract_message_content(
        &self,
        blocks: &[ContentBlock],
    ) -> (String, Option<EntryMetadata>) {
        let mut text_parts = Vec::new();
        let mut metadata = EntryMetadata::new();
        let mut has_metadata = false;

        for block in blocks {
            match block {
                ContentBlock::Text { text } => {
                    text_parts.push(text.clone());
                }
                ContentBlock::ToolUse { id, name, input } => {
                    // Extract file path from tool use if available
                    if let Some(path) = self.extract_file_path_from_input(input) {
                        metadata = metadata.set_file_path(path);
                        has_metadata = true;
                    }
                    text_parts.push(format!("[Using tool: {} ({})]", name, id));
                }
                ContentBlock::ToolResult {
                    tool_use_id,
                    content,
                    is_error,
                } => {
                    metadata = metadata.set_parent_tool_id(tool_use_id);
                    has_metadata = true;

                    if *is_error {
                        text_parts.push(format!("[Tool error: {}]", content));
                    } else {
                        text_parts.push(content.clone());
                    }
                }
                ContentBlock::Thinking { thinking } => {
                    text_parts.push(format!("[Thinking: {}]", thinking));
                }
            }
        }

        let content = if text_parts.is_empty() {
            "(empty message)".to_string()
        } else {
            text_parts.join("\n")
        };

        let metadata = if has_metadata { Some(metadata) } else { None };

        (content, metadata)
    }

    /// Extract tool use information for display
    fn extract_tool_use_info(
        &self,
        tool_name: &str,
        input: &serde_json::Value,
    ) -> (String, EntryMetadata) {
        let mut metadata = EntryMetadata::new();

        // Extract file path if present
        if let Some(path) = self.extract_file_path_from_input(input) {
            metadata = metadata.set_file_path(path);
        }

        // Extract command for Bash/shell tools
        if let Some(command) = self.extract_command_from_input(tool_name, input) {
            metadata = metadata.set_command(command);
        }

        // Generate human-readable content
        let content = match tool_name.to_lowercase().as_str() {
            "read" | "readfile" => {
                if let Some(path) = &metadata.file_path {
                    format!("Reading file: {}", path)
                } else {
                    format!("Using tool: {}", tool_name)
                }
            }
            "write" | "writefile" => {
                if let Some(path) = &metadata.file_path {
                    format!("Writing file: {}", path)
                } else {
                    format!("Using tool: {}", tool_name)
                }
            }
            "bash" | "shell" | "execute" => {
                if let Some(cmd) = &metadata.command {
                    format!("Executing: {}", cmd)
                } else {
                    "Executing shell command".to_string()
                }
            }
            _ => {
                format!("Using tool: {}", tool_name)
            }
        };

        (content, metadata)
    }

    /// Extract file path from tool input JSON
    fn extract_file_path_from_input(&self, input: &serde_json::Value) -> Option<String> {
        // Try common field names for file paths
        let field_names = ["file_path", "filePath", "path", "file", "target"];

        for field in &field_names {
            if let Some(path) = input.get(field).and_then(|v| v.as_str()) {
                return Some(path.to_string());
            }
        }

        None
    }

    /// Extract command from tool input JSON
    fn extract_command_from_input(
        &self,
        tool_name: &str,
        input: &serde_json::Value,
    ) -> Option<String> {
        // Only extract commands for shell-like tools
        let is_shell_tool = matches!(
            tool_name.to_lowercase().as_str(),
            "bash" | "shell" | "execute" | "run" | "command"
        );

        if !is_shell_tool {
            return None;
        }

        // Try common field names for commands
        let field_names = ["command", "cmd", "script", "code"];

        for field in &field_names {
            if let Some(cmd) = input.get(field).and_then(|v| v.as_str()) {
                return Some(cmd.to_string());
            }
        }

        None
    }

    /// Extract metadata from tool result
    fn extract_tool_result_metadata(&self, status: &ToolResultStatus) -> Option<EntryMetadata> {
        // For now, we don't extract metadata from tool results
        // In the future, we could parse exit codes from the output
        match status {
            ToolResultStatus::Success => {
                let metadata = EntryMetadata::new().set_exit_code(0);
                Some(metadata)
            }
            ToolResultStatus::Error => {
                let metadata = EntryMetadata::new().set_exit_code(1);
                Some(metadata)
            }
            ToolResultStatus::Cancelled => None,
        }
    }

    /// Format tool result content for display
    fn format_tool_result(&self, status: &ToolResultStatus, output: &str) -> String {
        match status {
            ToolResultStatus::Success => {
                if output.trim().is_empty() {
                    "Tool completed successfully".to_string()
                } else {
                    output.to_string()
                }
            }
            ToolResultStatus::Error => {
                format!("Tool failed: {}", output)
            }
            ToolResultStatus::Cancelled => "Tool was cancelled".to_string(),
        }
    }

    /// Format completion content for display
    fn format_completion(&self, status: &CompletionStatus, stats: &Option<AgentStats>) -> String {
        let status_text = match status {
            CompletionStatus::Success => "completed successfully",
            CompletionStatus::Error => "completed with errors",
            CompletionStatus::Interrupted => "was interrupted",
            CompletionStatus::Timeout => "timed out",
            CompletionStatus::Killed => "was killed",
        };

        if let Some(stats) = stats {
            let mut parts = vec![format!("Session {}", status_text)];

            if let Some(total) = stats.total_tokens {
                parts.push(format!("{} tokens used", total));
            }

            if let Some(tool_calls) = stats.tool_calls {
                parts.push(format!("{} tool calls", tool_calls));
            }

            parts.join(", ")
        } else {
            format!("Session {}", status_text)
        }
    }

    /// Determine if an error code represents a recoverable error
    fn is_error_recoverable(&self, code: &str) -> bool {
        match code.to_lowercase().as_str() {
            // Recoverable errors
            "rate_limit" | "retry" | "timeout" | "network" | "temporary" => true,
            // Non-recoverable errors
            "auth" | "permission" | "invalid" | "not_found" | "context_exceeded" => false,
            // Unknown errors are considered non-recoverable by default
            _ => {
                warn!(code = code, "Unknown error code, treating as non-recoverable");
                false
            }
        }
    }
}

impl Default for EventNormalizer {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use openflow_contracts::events::AgentMessageRole;

    #[test]
    fn test_normalize_init_event() {
        let normalizer = EventNormalizer::new();
        let event = UnifiedAgentEvent::init(
            "ext-session-123",
            "claude-sonnet-4",
            vec!["Read".to_string(), "Write".to_string()],
        );

        let entry = normalizer.normalize(event, "session-456", 0).unwrap();

        assert_eq!(entry.session_id, "session-456");
        assert_eq!(entry.sequence, 0);
        assert!(entry.content.contains("claude-sonnet-4"));
        assert!(entry.content.contains("2 tools"));
        assert!(entry.entry_type.is_init());
    }

    #[test]
    fn test_normalize_message_text() {
        let normalizer = EventNormalizer::new();
        let event = UnifiedAgentEvent::assistant_text("Hello, how can I help you?");

        let entry = normalizer.normalize(event, "session-1", 1).unwrap();

        assert_eq!(entry.sequence, 1);
        assert_eq!(entry.content, "Hello, how can I help you?");
        assert!(entry.entry_type.is_message());
    }

    #[test]
    fn test_normalize_message_with_tool_use() {
        let normalizer = EventNormalizer::new();
        let event = UnifiedAgentEvent::message(
            AgentMessageRole::Assistant,
            vec![
                ContentBlock::text("Let me read that file."),
                ContentBlock::tool_use(
                    "tool-123",
                    "Read",
                    serde_json::json!({"file_path": "/src/main.rs"}),
                ),
            ],
        );

        let entry = normalizer.normalize(event, "session-1", 2).unwrap();

        assert!(entry.content.contains("Let me read that file"));
        assert!(entry.content.contains("Using tool: Read"));
        // Metadata should include the file path from tool use
        assert!(entry.metadata.is_some());
        assert_eq!(
            entry.metadata.as_ref().unwrap().file_path,
            Some("/src/main.rs".to_string())
        );
    }

    #[test]
    fn test_normalize_tool_use_read() {
        let normalizer = EventNormalizer::new();
        let event = UnifiedAgentEvent::tool_use(
            "tool-abc",
            "Read",
            serde_json::json!({"file_path": "/src/lib.rs"}),
        );

        let entry = normalizer.normalize(event, "session-1", 3).unwrap();

        assert_eq!(entry.content, "Reading file: /src/lib.rs");
        assert!(entry.entry_type.is_tool_use());
        assert!(entry.metadata.is_some());
        assert_eq!(
            entry.metadata.as_ref().unwrap().file_path,
            Some("/src/lib.rs".to_string())
        );
    }

    #[test]
    fn test_normalize_tool_use_write() {
        let normalizer = EventNormalizer::new();
        let event = UnifiedAgentEvent::tool_use(
            "tool-def",
            "Write",
            serde_json::json!({"path": "/src/new.rs", "content": "fn main() {}"}),
        );

        let entry = normalizer.normalize(event, "session-1", 4).unwrap();

        assert_eq!(entry.content, "Writing file: /src/new.rs");
        assert_eq!(
            entry.metadata.as_ref().unwrap().file_path,
            Some("/src/new.rs".to_string())
        );
    }

    #[test]
    fn test_normalize_tool_use_bash() {
        let normalizer = EventNormalizer::new();
        let event = UnifiedAgentEvent::tool_use(
            "tool-ghi",
            "Bash",
            serde_json::json!({"command": "ls -la"}),
        );

        let entry = normalizer.normalize(event, "session-1", 5).unwrap();

        assert_eq!(entry.content, "Executing: ls -la");
        assert!(entry.metadata.is_some());
        assert_eq!(
            entry.metadata.as_ref().unwrap().command,
            Some("ls -la".to_string())
        );
    }

    #[test]
    fn test_normalize_tool_result_success() {
        let normalizer = EventNormalizer::new();
        let event =
            UnifiedAgentEvent::tool_result_success("tool-abc", "File contents:\nfn main() {}");

        let entry = normalizer.normalize(event, "session-1", 6).unwrap();

        assert!(entry.content.contains("fn main()"));
        assert!(entry.entry_type.is_tool_result());
        assert!(entry.metadata.is_some());
        assert_eq!(entry.metadata.as_ref().unwrap().exit_code, Some(0));
    }

    #[test]
    fn test_normalize_tool_result_error() {
        let normalizer = EventNormalizer::new();
        let event = UnifiedAgentEvent::tool_result_error("tool-abc", "File not found");

        let entry = normalizer.normalize(event, "session-1", 7).unwrap();

        assert_eq!(entry.content, "Tool failed: File not found");
        assert_eq!(entry.metadata.as_ref().unwrap().exit_code, Some(1));
    }

    #[test]
    fn test_normalize_tool_result_empty_success() {
        let normalizer = EventNormalizer::new();
        let event = UnifiedAgentEvent::tool_result_success("tool-abc", "");

        let entry = normalizer.normalize(event, "session-1", 8).unwrap();

        assert_eq!(entry.content, "Tool completed successfully");
    }

    #[test]
    fn test_normalize_complete_success() {
        let normalizer = EventNormalizer::new();
        let stats = AgentStats::with_tokens(1000, 500);
        let event = UnifiedAgentEvent::complete_success(Some(stats));

        let entry = normalizer.normalize(event, "session-1", 9).unwrap();

        assert!(entry.content.contains("completed successfully"));
        assert!(entry.content.contains("1500 tokens"));
        assert!(entry.entry_type.is_complete());
    }

    #[test]
    fn test_normalize_complete_error() {
        let normalizer = EventNormalizer::new();
        let event = UnifiedAgentEvent::complete_error(None);

        let entry = normalizer.normalize(event, "session-1", 10).unwrap();

        assert!(entry.content.contains("completed with errors"));
    }

    #[test]
    fn test_normalize_error_recoverable() {
        let normalizer = EventNormalizer::new();
        let event = UnifiedAgentEvent::error("rate_limit", "Too many requests, please retry");

        let entry = normalizer.normalize(event, "session-1", 11).unwrap();

        assert!(entry.content.contains("rate_limit"));
        assert!(entry.content.contains("Too many requests"));
        assert!(entry.entry_type.is_error());

        // Check that it's marked as recoverable
        if let EntryType::Error { recoverable, .. } = entry.entry_type {
            assert!(recoverable);
        } else {
            panic!("Expected Error entry type");
        }
    }

    #[test]
    fn test_normalize_error_non_recoverable() {
        let normalizer = EventNormalizer::new();
        let event = UnifiedAgentEvent::error("context_exceeded", "Context window is full");

        let entry = normalizer.normalize(event, "session-1", 12).unwrap();

        // Check that it's marked as non-recoverable
        if let EntryType::Error { recoverable, .. } = entry.entry_type {
            assert!(!recoverable);
        } else {
            panic!("Expected Error entry type");
        }
    }

    #[test]
    fn test_normalize_permission() {
        let normalizer = EventNormalizer::new();
        let event = UnifiedAgentEvent::permission(
            "Write",
            "Create new file",
            Some("/src/new_file.rs".to_string()),
        );

        let entry = normalizer.normalize(event, "session-1", 13).unwrap();

        assert!(entry.content.contains("Permission required"));
        assert!(entry.content.contains("Write"));
        assert!(entry.content.contains("Create new file"));
        assert!(entry.entry_type.is_system());
        assert_eq!(
            entry.metadata.as_ref().unwrap().file_path,
            Some("/src/new_file.rs".to_string())
        );
    }

    #[test]
    fn test_extract_file_path_variants() {
        let normalizer = EventNormalizer::new();

        // Test different field name variants
        let test_cases = vec![
            (serde_json::json!({"file_path": "/test.rs"}), "/test.rs"),
            (serde_json::json!({"filePath": "/test.rs"}), "/test.rs"),
            (serde_json::json!({"path": "/test.rs"}), "/test.rs"),
            (serde_json::json!({"file": "/test.rs"}), "/test.rs"),
            (serde_json::json!({"target": "/test.rs"}), "/test.rs"),
        ];

        for (input, expected_path) in test_cases {
            let path = normalizer.extract_file_path_from_input(&input);
            assert_eq!(path, Some(expected_path.to_string()));
        }
    }

    #[test]
    fn test_extract_command_variants() {
        let normalizer = EventNormalizer::new();

        // Test different field name variants for bash commands
        let test_cases = vec![
            (serde_json::json!({"command": "ls"}), "ls"),
            (serde_json::json!({"cmd": "ls"}), "ls"),
            (serde_json::json!({"script": "ls"}), "ls"),
            (serde_json::json!({"code": "ls"}), "ls"),
        ];

        for (input, expected_cmd) in test_cases {
            let cmd = normalizer.extract_command_from_input("Bash", &input);
            assert_eq!(cmd, Some(expected_cmd.to_string()));
        }
    }

    #[test]
    fn test_extract_command_only_for_shell_tools() {
        let normalizer = EventNormalizer::new();
        let input = serde_json::json!({"command": "ls"});

        // Should extract for bash tool
        let cmd = normalizer.extract_command_from_input("Bash", &input);
        assert_eq!(cmd, Some("ls".to_string()));

        // Should NOT extract for read tool
        let cmd = normalizer.extract_command_from_input("Read", &input);
        assert_eq!(cmd, None);
    }

    #[test]
    fn test_message_with_empty_content() {
        let normalizer = EventNormalizer::new();
        let event = UnifiedAgentEvent::message(AgentMessageRole::Assistant, vec![]);

        let entry = normalizer.normalize(event, "session-1", 14).unwrap();

        assert_eq!(entry.content, "(empty message)");
    }

    #[test]
    fn test_message_with_thinking() {
        let normalizer = EventNormalizer::new();
        let event = UnifiedAgentEvent::message(
            AgentMessageRole::Assistant,
            vec![ContentBlock::thinking("Let me analyze this carefully...")],
        );

        let entry = normalizer.normalize(event, "session-1", 15).unwrap();

        assert!(entry.content.contains("[Thinking:"));
        assert!(entry.content.contains("Let me analyze this carefully"));
    }

    #[test]
    fn test_message_with_tool_result() {
        let normalizer = EventNormalizer::new();
        let event = UnifiedAgentEvent::message(
            AgentMessageRole::Assistant,
            vec![ContentBlock::tool_result("tool-123", "Success!", false)],
        );

        let entry = normalizer.normalize(event, "session-1", 16).unwrap();

        assert!(entry.content.contains("Success!"));
        assert!(entry.metadata.is_some());
        assert_eq!(
            entry.metadata.as_ref().unwrap().parent_tool_id,
            Some("tool-123".to_string())
        );
    }

    #[test]
    fn test_message_with_tool_error_result() {
        let normalizer = EventNormalizer::new();
        let event = UnifiedAgentEvent::message(
            AgentMessageRole::Assistant,
            vec![ContentBlock::tool_result("tool-123", "Failed!", true)],
        );

        let entry = normalizer.normalize(event, "session-1", 17).unwrap();

        assert!(entry.content.contains("[Tool error: Failed!]"));
    }

    #[test]
    fn test_sequence_and_session_id() {
        let normalizer = EventNormalizer::new();
        let event = UnifiedAgentEvent::assistant_text("Test");

        // Test different sequences and session IDs
        for seq in 0..10 {
            let session_id = format!("session-{}", seq);
            let entry = normalizer.normalize(event.clone(), &session_id, seq).unwrap();

            assert_eq!(entry.sequence, seq);
            assert_eq!(entry.session_id, session_id);
        }
    }

    #[test]
    fn test_unique_ids_generated() {
        let normalizer = EventNormalizer::new();
        let event = UnifiedAgentEvent::assistant_text("Test");

        // Generate multiple entries and verify IDs are unique
        let mut ids = std::collections::HashSet::new();
        for i in 0..100 {
            let entry = normalizer.normalize(event.clone(), "session-1", i).unwrap();
            assert!(ids.insert(entry.id.clone()), "Duplicate ID generated");
        }
    }

    #[test]
    fn test_timestamps_are_recent() {
        let normalizer = EventNormalizer::new();
        let event = UnifiedAgentEvent::assistant_text("Test");

        let before = Utc::now();
        let entry = normalizer.normalize(event, "session-1", 0).unwrap();
        let after = Utc::now();

        // Timestamp should be between before and after
        assert!(entry.timestamp >= before);
        assert!(entry.timestamp <= after);
    }

    #[test]
    fn test_complete_with_tool_calls_stat() {
        let normalizer = EventNormalizer::new();
        let mut stats = AgentStats::with_tokens(100, 50);
        stats.tool_calls = Some(5);

        let event = UnifiedAgentEvent::complete_success(Some(stats));
        let entry = normalizer.normalize(event, "session-1", 18).unwrap();

        assert!(entry.content.contains("150 tokens"));
        assert!(entry.content.contains("5 tool calls"));
    }

    #[test]
    fn test_all_completion_statuses() {
        let normalizer = EventNormalizer::new();

        let test_cases = vec![
            (CompletionStatus::Success, "completed successfully"),
            (CompletionStatus::Error, "completed with errors"),
            (CompletionStatus::Interrupted, "was interrupted"),
            (CompletionStatus::Timeout, "timed out"),
            (CompletionStatus::Killed, "was killed"),
        ];

        for (status, expected_text) in test_cases {
            let event = UnifiedAgentEvent::Complete {
                status,
                stats: None,
            };
            let entry = normalizer.normalize(event, "session-1", 0).unwrap();
            assert!(
                entry.content.contains(expected_text),
                "Expected '{}' in content: {}",
                expected_text,
                entry.content
            );
        }
    }
}

