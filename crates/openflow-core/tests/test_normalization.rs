//! Event Normalization Tests
//!
//! Comprehensive tests for the EventNormalizer service covering:
//! - All UnifiedAgentEvent types to NormalizedEntry transformation
//! - Metadata extraction from events
//! - Content generation for UI display
//! - Sequence number assignment
//! - Timestamp generation
//! - Edge cases and error handling
//!
//! # Event Types Tested
//!
//! - Init: Session initialization
//! - Message: Agent and user messages with various content blocks
//! - ToolUse: Tool invocations with metadata extraction
//! - ToolResult: Tool completions with status and output
//! - Complete: Session completion with stats
//! - Error: Error events with recoverability
//! - Permission: Permission requests
//!
//! # Running Tests
//!
//! ```bash
//! cargo test --test test_normalization
//! ```

use chrono::Utc;
use openflow_contracts::events::{
    AgentMessageRole, AgentStats, CompletionStatus, ContentBlock, EntryType, ToolResultStatus,
    UnifiedAgentEvent,
};
use openflow_core::services::normalizer::EventNormalizer;

// =============================================================================
// Init Event Tests
// =============================================================================

#[test]
fn test_normalize_init_event() {
    let normalizer = EventNormalizer::new();
    let event = UnifiedAgentEvent::init(
        "ext-session-123",
        "claude-sonnet-4",
        vec!["Read".to_string(), "Write".to_string(), "Bash".to_string()],
    );

    let entry = normalizer
        .normalize(event, "session-456", 0)
        .expect("Failed to normalize");

    assert_eq!(entry.session_id, "session-456");
    assert_eq!(entry.sequence, 0);
    assert!(entry.content.contains("claude-sonnet-4"));
    assert!(entry.content.contains("3 tools"));
    assert!(entry.entry_type.is_init());
    assert!(entry.metadata.is_none());
}

#[test]
fn test_normalize_init_no_tools() {
    let normalizer = EventNormalizer::new();
    let event = UnifiedAgentEvent::init("ext-session-1", "mock-model", vec![]);

    let entry = normalizer
        .normalize(event, "session-1", 0)
        .expect("Failed to normalize");

    assert!(entry.content.contains("0 tools"));
}

// =============================================================================
// Message Event Tests
// =============================================================================

#[test]
fn test_normalize_message_simple_text() {
    let normalizer = EventNormalizer::new();
    let event = UnifiedAgentEvent::assistant_text("Hello, how can I help you?");

    let entry = normalizer
        .normalize(event, "session-1", 1)
        .expect("Failed to normalize");

    assert_eq!(entry.sequence, 1);
    assert_eq!(entry.content, "Hello, how can I help you?");
    assert!(entry.entry_type.is_message());
    assert!(entry.metadata.is_none());
}

#[test]
fn test_normalize_message_user_role() {
    let normalizer = EventNormalizer::new();
    let event = UnifiedAgentEvent::message(
        AgentMessageRole::User,
        vec![ContentBlock::text("Fix the bug in main.rs")],
    );

    let entry = normalizer
        .normalize(event, "session-1", 0)
        .expect("Failed to normalize");

    assert_eq!(entry.content, "Fix the bug in main.rs");
    
    if let EntryType::Message { role } = &entry.entry_type {
        assert!(matches!(role, AgentMessageRole::User));
    } else {
        panic!("Expected Message entry type");
    }
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

    let entry = normalizer
        .normalize(event, "session-1", 2)
        .expect("Failed to normalize");

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
fn test_normalize_message_with_tool_result() {
    let normalizer = EventNormalizer::new();
    let event = UnifiedAgentEvent::message(
        AgentMessageRole::Assistant,
        vec![ContentBlock::tool_result("tool-123", "Success!", false)],
    );

    let entry = normalizer
        .normalize(event, "session-1", 3)
        .expect("Failed to normalize");

    assert!(entry.content.contains("Success!"));
    assert!(entry.metadata.is_some());
    assert_eq!(
        entry.metadata.as_ref().unwrap().parent_tool_id,
        Some("tool-123".to_string())
    );
}

#[test]
fn test_normalize_message_with_tool_error_result() {
    let normalizer = EventNormalizer::new();
    let event = UnifiedAgentEvent::message(
        AgentMessageRole::Assistant,
        vec![ContentBlock::tool_result("tool-123", "Failed!", true)],
    );

    let entry = normalizer
        .normalize(event, "session-1", 4)
        .expect("Failed to normalize");

    assert!(entry.content.contains("[Tool error: Failed!]"));
}

#[test]
fn test_normalize_message_with_thinking() {
    let normalizer = EventNormalizer::new();
    let event = UnifiedAgentEvent::message(
        AgentMessageRole::Assistant,
        vec![ContentBlock::thinking("Let me analyze this carefully...")],
    );

    let entry = normalizer
        .normalize(event, "session-1", 5)
        .expect("Failed to normalize");

    assert!(entry.content.contains("[Thinking:"));
    assert!(entry.content.contains("Let me analyze this carefully"));
}

#[test]
fn test_normalize_message_empty_content() {
    let normalizer = EventNormalizer::new();
    let event = UnifiedAgentEvent::message(AgentMessageRole::Assistant, vec![]);

    let entry = normalizer
        .normalize(event, "session-1", 6)
        .expect("Failed to normalize");

    assert_eq!(entry.content, "(empty message)");
}

#[test]
fn test_normalize_message_multiple_content_blocks() {
    let normalizer = EventNormalizer::new();
    let event = UnifiedAgentEvent::message(
        AgentMessageRole::Assistant,
        vec![
            ContentBlock::text("First part."),
            ContentBlock::thinking("Analyzing..."),
            ContentBlock::text("Second part."),
        ],
    );

    let entry = normalizer
        .normalize(event, "session-1", 7)
        .expect("Failed to normalize");

    assert!(entry.content.contains("First part"));
    assert!(entry.content.contains("[Thinking: Analyzing...]"));
    assert!(entry.content.contains("Second part"));
}

// =============================================================================
// ToolUse Event Tests
// =============================================================================

#[test]
fn test_normalize_tool_use_read() {
    let normalizer = EventNormalizer::new();
    let event = UnifiedAgentEvent::tool_use(
        "tool-abc",
        "Read",
        serde_json::json!({"file_path": "/src/lib.rs"}),
    );

    let entry = normalizer
        .normalize(event, "session-1", 8)
        .expect("Failed to normalize");

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

    let entry = normalizer
        .normalize(event, "session-1", 9)
        .expect("Failed to normalize");

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

    let entry = normalizer
        .normalize(event, "session-1", 10)
        .expect("Failed to normalize");

    assert_eq!(entry.content, "Executing: ls -la");
    assert!(entry.metadata.is_some());
    assert_eq!(
        entry.metadata.as_ref().unwrap().command,
        Some("ls -la".to_string())
    );
}

#[test]
fn test_normalize_tool_use_generic() {
    let normalizer = EventNormalizer::new();
    let event = UnifiedAgentEvent::tool_use(
        "tool-xyz",
        "CustomTool",
        serde_json::json!({"param": "value"}),
    );

    let entry = normalizer
        .normalize(event, "session-1", 11)
        .expect("Failed to normalize");

    assert_eq!(entry.content, "Using tool: CustomTool");
}

#[test]
fn test_normalize_tool_use_alternate_field_names() {
    let normalizer = EventNormalizer::new();

    // Test "filePath" instead of "file_path"
    let event = UnifiedAgentEvent::tool_use(
        "tool-1",
        "Read",
        serde_json::json!({"filePath": "/test.txt"}),
    );

    let entry = normalizer
        .normalize(event, "session-1", 0)
        .expect("Failed to normalize");

    assert_eq!(
        entry.metadata.as_ref().unwrap().file_path,
        Some("/test.txt".to_string())
    );

    // Test "cmd" instead of "command"
    let event = UnifiedAgentEvent::tool_use(
        "tool-2",
        "Bash",
        serde_json::json!({"cmd": "echo test"}),
    );

    let entry = normalizer
        .normalize(event, "session-1", 1)
        .expect("Failed to normalize");

    assert_eq!(
        entry.metadata.as_ref().unwrap().command,
        Some("echo test".to_string())
    );
}

// =============================================================================
// ToolResult Event Tests
// =============================================================================

#[test]
fn test_normalize_tool_result_success() {
    let normalizer = EventNormalizer::new();
    let event = UnifiedAgentEvent::tool_result_success("tool-abc", "File contents:\nfn main() {}");

    let entry = normalizer
        .normalize(event, "session-1", 12)
        .expect("Failed to normalize");

    assert!(entry.content.contains("fn main()"));
    assert!(entry.entry_type.is_tool_result());
    assert!(entry.metadata.is_some());
    assert_eq!(entry.metadata.as_ref().unwrap().exit_code, Some(0));
}

#[test]
fn test_normalize_tool_result_error() {
    let normalizer = EventNormalizer::new();
    let event = UnifiedAgentEvent::tool_result_error("tool-abc", "File not found");

    let entry = normalizer
        .normalize(event, "session-1", 13)
        .expect("Failed to normalize");

    assert_eq!(entry.content, "Tool failed: File not found");
    assert_eq!(entry.metadata.as_ref().unwrap().exit_code, Some(1));
}

#[test]
fn test_normalize_tool_result_cancelled() {
    let normalizer = EventNormalizer::new();
    let event = UnifiedAgentEvent::ToolResult {
        tool_id: "tool-abc".to_string(),
        status: ToolResultStatus::Cancelled,
        output: "User cancelled".to_string(),
    };

    let entry = normalizer
        .normalize(event, "session-1", 14)
        .expect("Failed to normalize");

    assert_eq!(entry.content, "Tool was cancelled");
}

#[test]
fn test_normalize_tool_result_empty_success() {
    let normalizer = EventNormalizer::new();
    let event = UnifiedAgentEvent::tool_result_success("tool-abc", "");

    let entry = normalizer
        .normalize(event, "session-1", 15)
        .expect("Failed to normalize");

    assert_eq!(entry.content, "Tool completed successfully");
}

// =============================================================================
// Complete Event Tests
// =============================================================================

#[test]
fn test_normalize_complete_success() {
    let normalizer = EventNormalizer::new();
    let stats = AgentStats::with_tokens(1000, 500);
    let event = UnifiedAgentEvent::complete_success(Some(stats));

    let entry = normalizer
        .normalize(event, "session-1", 16)
        .expect("Failed to normalize");

    assert!(entry.content.contains("completed successfully"));
    assert!(entry.content.contains("1500 tokens"));
    assert!(entry.entry_type.is_complete());
}

#[test]
fn test_normalize_complete_error() {
    let normalizer = EventNormalizer::new();
    let event = UnifiedAgentEvent::complete_error(None);

    let entry = normalizer
        .normalize(event, "session-1", 17)
        .expect("Failed to normalize");

    assert!(entry.content.contains("completed with errors"));
}

#[test]
fn test_normalize_complete_with_tool_calls() {
    let normalizer = EventNormalizer::new();
    let mut stats = AgentStats::with_tokens(100, 50);
    stats.tool_calls = Some(5);

    let event = UnifiedAgentEvent::complete_success(Some(stats));
    let entry = normalizer
        .normalize(event, "session-1", 18)
        .expect("Failed to normalize");

    assert!(entry.content.contains("150 tokens"));
    assert!(entry.content.contains("5 tool calls"));
}

#[test]
fn test_normalize_all_completion_statuses() {
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
        let entry = normalizer
            .normalize(event, "session-1", 0)
            .expect("Failed to normalize");
        assert!(
            entry.content.contains(expected_text),
            "Expected '{}' in content: {}",
            expected_text,
            entry.content
        );
    }
}

// =============================================================================
// Error Event Tests
// =============================================================================

#[test]
fn test_normalize_error_recoverable() {
    let normalizer = EventNormalizer::new();
    let event = UnifiedAgentEvent::error("rate_limit", "Too many requests, please retry");

    let entry = normalizer
        .normalize(event, "session-1", 19)
        .expect("Failed to normalize");

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

    let entry = normalizer
        .normalize(event, "session-1", 20)
        .expect("Failed to normalize");

    // Check that it's marked as non-recoverable
    if let EntryType::Error { recoverable, .. } = entry.entry_type {
        assert!(!recoverable);
    } else {
        panic!("Expected Error entry type");
    }
}

#[test]
fn test_normalize_error_unknown_code() {
    let normalizer = EventNormalizer::new();
    let event = UnifiedAgentEvent::error("unknown_error_code", "Something went wrong");

    let entry = normalizer
        .normalize(event, "session-1", 21)
        .expect("Failed to normalize");

    // Unknown errors should be non-recoverable by default
    if let EntryType::Error { recoverable, .. } = entry.entry_type {
        assert!(!recoverable);
    } else {
        panic!("Expected Error entry type");
    }
}

// =============================================================================
// Permission Event Tests
// =============================================================================

#[test]
fn test_normalize_permission() {
    let normalizer = EventNormalizer::new();
    let event = UnifiedAgentEvent::permission(
        "Write",
        "Create new file",
        Some("/src/new_file.rs".to_string()),
    );

    let entry = normalizer
        .normalize(event, "session-1", 22)
        .expect("Failed to normalize");

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
fn test_normalize_permission_no_file_path() {
    let normalizer = EventNormalizer::new();
    let event = UnifiedAgentEvent::permission("Bash", "Execute command", None);

    let entry = normalizer
        .normalize(event, "session-1", 23)
        .expect("Failed to normalize");

    assert!(entry.content.contains("Permission required"));
    assert!(entry.content.contains("Bash"));
    assert!(entry.metadata.is_none());
}

// =============================================================================
// Sequence and ID Tests
// =============================================================================

#[test]
fn test_sequence_and_session_id() {
    let normalizer = EventNormalizer::new();
    let event = UnifiedAgentEvent::assistant_text("Test");

    // Test different sequences and session IDs
    for seq in 0..10 {
        let session_id = format!("session-{}", seq);
        let entry = normalizer
            .normalize(event.clone(), &session_id, seq)
            .expect("Failed to normalize");

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
        let entry = normalizer
            .normalize(event.clone(), "session-1", i)
            .expect("Failed to normalize");
        assert!(ids.insert(entry.id.clone()), "Duplicate ID generated");
    }
}

#[test]
fn test_timestamps_are_recent() {
    let normalizer = EventNormalizer::new();
    let event = UnifiedAgentEvent::assistant_text("Test");

    let before = Utc::now();
    let entry = normalizer
        .normalize(event, "session-1", 0)
        .expect("Failed to normalize");
    let after = Utc::now();

    // Timestamp should be between before and after
    assert!(entry.timestamp >= before);
    assert!(entry.timestamp <= after);
}

// =============================================================================
// Metadata Extraction Tests
// =============================================================================

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

    for (i, (input, expected_path)) in test_cases.iter().enumerate() {
        let event = UnifiedAgentEvent::tool_use(&format!("tool-{}", i), "Read", input.clone());
        let entry = normalizer
            .normalize(event, "session-1", i as i64)
            .expect("Failed to normalize");

        assert_eq!(
            entry.metadata.as_ref().unwrap().file_path,
            Some(expected_path.to_string())
        );
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

    for (i, (input, expected_cmd)) in test_cases.iter().enumerate() {
        let event = UnifiedAgentEvent::tool_use(&format!("tool-{}", i), "Bash", input.clone());
        let entry = normalizer
            .normalize(event, "session-1", i as i64)
            .expect("Failed to normalize");

        assert_eq!(
            entry.metadata.as_ref().unwrap().command,
            Some(expected_cmd.to_string())
        );
    }
}

#[test]
fn test_extract_command_only_for_shell_tools() {
    let normalizer = EventNormalizer::new();
    let input = serde_json::json!({"command": "ls"});

    // Should extract for bash tool
    let event = UnifiedAgentEvent::tool_use("tool-1", "Bash", input.clone());
    let entry = normalizer
        .normalize(event, "session-1", 0)
        .expect("Failed to normalize");
    assert_eq!(
        entry.metadata.as_ref().unwrap().command,
        Some("ls".to_string())
    );

    // Should NOT extract command for read tool
    let event = UnifiedAgentEvent::tool_use("tool-2", "Read", input);
    let entry = normalizer
        .normalize(event, "session-1", 1)
        .expect("Failed to normalize");
    // Read tool may have metadata (for file_path) but should not have command
    let has_command = entry
        .metadata
        .as_ref()
        .map(|m| m.command.is_some())
        .unwrap_or(false);
    assert!(!has_command, "Read tool should not have command extracted");
}

// =============================================================================
// Edge Case Tests
// =============================================================================

#[test]
fn test_normalize_with_empty_string_content() {
    let normalizer = EventNormalizer::new();
    let event = UnifiedAgentEvent::assistant_text("");

    let entry = normalizer
        .normalize(event, "session-1", 0)
        .expect("Failed to normalize");

    // Empty text should still be normalized
    assert_eq!(entry.content, "");
}

#[test]
fn test_normalize_with_very_long_content() {
    let normalizer = EventNormalizer::new();
    let long_text = "x".repeat(100000);
    let event = UnifiedAgentEvent::assistant_text(&long_text);

    let entry = normalizer
        .normalize(event, "session-1", 0)
        .expect("Failed to normalize");

    assert_eq!(entry.content.len(), 100000);
}

#[test]
fn test_normalize_with_unicode_content() {
    let normalizer = EventNormalizer::new();
    let event = UnifiedAgentEvent::assistant_text("Hello 👋 世界 🌍");

    let entry = normalizer
        .normalize(event, "session-1", 0)
        .expect("Failed to normalize");

    assert_eq!(entry.content, "Hello 👋 世界 🌍");
}

#[test]
fn test_normalize_with_newlines() {
    let normalizer = EventNormalizer::new();
    let event = UnifiedAgentEvent::assistant_text("Line 1\nLine 2\nLine 3");

    let entry = normalizer
        .normalize(event, "session-1", 0)
        .expect("Failed to normalize");

    assert_eq!(entry.content, "Line 1\nLine 2\nLine 3");
}

#[test]
fn test_normalize_with_special_characters() {
    let normalizer = EventNormalizer::new();
    let event = UnifiedAgentEvent::assistant_text("Special: <>&\"'`\t\r\n");

    let entry = normalizer
        .normalize(event, "session-1", 0)
        .expect("Failed to normalize");

    // Should preserve special characters
    assert!(entry.content.contains("<>&\"'`"));
}

// =============================================================================
// Comprehensive Event Type Coverage
// =============================================================================

#[test]
fn test_all_event_types_normalize_successfully() {
    let normalizer = EventNormalizer::new();

    let events = vec![
        UnifiedAgentEvent::init("ext-1", "model-1", vec!["Read".to_string()]),
        UnifiedAgentEvent::assistant_text("Hello"),
        UnifiedAgentEvent::tool_use("tool-1", "Read", serde_json::json!({"path": "/file.txt"})),
        UnifiedAgentEvent::tool_result_success("tool-1", "Success"),
        UnifiedAgentEvent::complete_success(None),
        UnifiedAgentEvent::error("test_error", "Test error message"),
        UnifiedAgentEvent::permission("Write", "Test permission", None),
    ];

    for (i, event) in events.into_iter().enumerate() {
        let result = normalizer.normalize(event, "session-1", i as i64);
        assert!(
            result.is_ok(),
            "Failed to normalize event at index {}: {:?}",
            i,
            result.err()
        );
    }
}

// =============================================================================
// Stateless Service Tests
// =============================================================================

#[test]
fn test_normalizer_is_stateless() {
    let normalizer = EventNormalizer::new();
    let event = UnifiedAgentEvent::assistant_text("Test");

    // Normalize same event multiple times
    let entry1 = normalizer
        .normalize(event.clone(), "session-1", 0)
        .expect("Failed to normalize");
    let entry2 = normalizer
        .normalize(event.clone(), "session-1", 0)
        .expect("Failed to normalize");

    // IDs should be different (generated fresh each time)
    assert_ne!(entry1.id, entry2.id);

    // But content should be the same
    assert_eq!(entry1.content, entry2.content);
}

#[test]
fn test_normalizer_default() {
    let normalizer = EventNormalizer::default();
    let event = UnifiedAgentEvent::assistant_text("Test");

    let entry = normalizer
        .normalize(event, "session-1", 0)
        .expect("Failed to normalize");

    assert_eq!(entry.content, "Test");
}

