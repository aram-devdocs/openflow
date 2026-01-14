//! Permission Detection Tests
//!
//! Comprehensive tests for the PermissionDetector service covering:
//! - All 8 built-in regex patterns
//! - Provider-specific patterns
//! - Heuristic fallback detection
//! - Edge cases and false positives
//! - Metadata extraction (tool name, file path, command)
//! - Pending permission tracking and timeouts
//!
//! # Test Coverage
//!
//! - Pattern 1: Standard format with (y/n)
//! - Pattern 2: Bracket format with [y/n]
//! - Pattern 3: Question mark only format
//! - Pattern 4: Tool-specific write operations
//! - Pattern 5: Tool-specific read operations
//! - Pattern 6: Tool-specific bash/execute operations
//! - Pattern 7: Generic permission with question
//! - Pattern 8: Simple approval pattern
//!
//! # Running Tests
//!
//! ```bash
//! cargo test --test test_permission_detection
//! ```

use openflow_core::services::permission_detector::{
    PermissionDetector, PermissionDetectorConfig, DEFAULT_PERMISSION_TIMEOUT_SECONDS,
};
use regex::Regex;

// =============================================================================
// Pattern 1: Standard Format with (y/n)
// =============================================================================

#[test]
fn test_pattern1_standard_write() {
    let detector = PermissionDetector::new();
    
    let request = detector.detect("Allow Claude to write to /src/main.rs? (y/n)");
    assert!(request.is_some());
    
    let req = request.unwrap();
    assert_eq!(req.tool_name, "Write");
    assert_eq!(req.file_path, Some("/src/main.rs".to_string()));
    assert!(req.description.contains("write"));
}

#[test]
fn test_pattern1_standard_read() {
    let detector = PermissionDetector::new();
    
    let request = detector.detect("Allow Claude to read /etc/config? (y/n)");
    assert!(request.is_some());
    
    let req = request.unwrap();
    assert_eq!(req.tool_name, "Read");
    assert_eq!(req.file_path, Some("/etc/config".to_string()));
}

#[test]
fn test_pattern1_standard_execute() {
    let detector = PermissionDetector::new();
    
    let request = detector.detect("Allow Claude to execute command? (y/n)");
    assert!(request.is_some());
    
    let req = request.unwrap();
    assert_eq!(req.tool_name, "Bash");
}

#[test]
fn test_pattern1_standard_delete() {
    let detector = PermissionDetector::new();
    
    let request = detector.detect("Allow Claude to delete /tmp/test.log? (y/n)");
    assert!(request.is_some());
    
    let req = request.unwrap();
    assert_eq!(req.tool_name, "Delete");
    assert_eq!(req.file_path, Some("/tmp/test.log".to_string()));
}

#[test]
fn test_pattern1_standard_create() {
    let detector = PermissionDetector::new();
    
    let request = detector.detect("Allow Claude to create /new/directory? (y/n)");
    assert!(request.is_some());
    
    let req = request.unwrap();
    assert_eq!(req.tool_name, "Write");
}

#[test]
fn test_pattern1_standard_modify() {
    let detector = PermissionDetector::new();
    
    let request = detector.detect("Allow Claude to modify /config.json? (y/n)");
    assert!(request.is_some());
    
    let req = request.unwrap();
    assert_eq!(req.tool_name, "Write");
}

// =============================================================================
// Pattern 2: Bracket Format with [y/n]
// =============================================================================

#[test]
fn test_pattern2_bracket_write() {
    let detector = PermissionDetector::new();
    
    let request = detector.detect("Allow Claude to write to file.txt? [y/n]");
    assert!(request.is_some());
    
    let req = request.unwrap();
    assert_eq!(req.tool_name, "Write");
    assert_eq!(req.file_path, Some("file.txt".to_string()));
}

#[test]
fn test_pattern2_bracket_read() {
    let detector = PermissionDetector::new();
    
    let request = detector.detect("Allow Claude to read data.json? [y/n]");
    assert!(request.is_some());
    
    let req = request.unwrap();
    assert_eq!(req.tool_name, "Read");
}

#[test]
fn test_pattern2_bracket_bash() {
    let detector = PermissionDetector::new();
    
    let request = detector.detect("Allow Claude to bash script? [y/n]");
    assert!(request.is_some());
    
    let req = request.unwrap();
    assert_eq!(req.tool_name, "Bash");
}

// =============================================================================
// Pattern 3: Question Mark Only Format
// =============================================================================

#[test]
fn test_pattern3_question_only_write() {
    let detector = PermissionDetector::new();
    
    let request = detector.detect("write to /output.txt? y/n");
    assert!(request.is_some());
    
    let req = request.unwrap();
    assert_eq!(req.tool_name, "Write");
}

#[test]
fn test_pattern3_question_only_read() {
    let detector = PermissionDetector::new();
    
    let request = detector.detect("read file.txt? (y/n)");
    assert!(request.is_some());
    
    let req = request.unwrap();
    assert_eq!(req.tool_name, "Read");
}

#[test]
fn test_pattern3_question_only_execute() {
    let detector = PermissionDetector::new();
    
    let request = detector.detect("execute command? [y/n]");
    assert!(request.is_some());
    
    let req = request.unwrap();
    assert_eq!(req.tool_name, "Bash");
}

// =============================================================================
// Pattern 4: Tool-Specific Write Operations
// =============================================================================

#[test]
fn test_pattern4_write_with_backticks() {
    let detector = PermissionDetector::new();
    
    let request = detector.detect("Allow Claude to write to `/etc/config`?");
    assert!(request.is_some());
    
    let req = request.unwrap();
    assert_eq!(req.tool_name, "Write");
    assert_eq!(req.file_path, Some("/etc/config".to_string()));
}

#[test]
fn test_pattern4_write_with_quotes() {
    let detector = PermissionDetector::new();
    
    let request = detector.detect("Allow Claude to write to \"/home/user/file.txt\"?");
    assert!(request.is_some());
    
    let req = request.unwrap();
    assert_eq!(req.file_path, Some("/home/user/file.txt".to_string()));
}

#[test]
fn test_pattern4_write_with_single_quotes() {
    let detector = PermissionDetector::new();
    
    let request = detector.detect("Allow Claude to write to '/var/log/app.log'?");
    assert!(request.is_some());
    
    let req = request.unwrap();
    assert_eq!(req.file_path, Some("/var/log/app.log".to_string()));
}

// =============================================================================
// Pattern 5: Tool-Specific Read Operations
// =============================================================================

#[test]
fn test_pattern5_read_file() {
    let detector = PermissionDetector::new();
    
    let request = detector.detect("Allow Claude to read file `/src/lib.rs`?");
    assert!(request.is_some());
    
    let req = request.unwrap();
    assert_eq!(req.tool_name, "Read");
    assert_eq!(req.file_path, Some("/src/lib.rs".to_string()));
}

#[test]
fn test_pattern5_read_without_file_keyword() {
    let detector = PermissionDetector::new();
    
    let request = detector.detect("Allow Claude to read `/config.toml`?");
    assert!(request.is_some());
    
    let req = request.unwrap();
    assert_eq!(req.tool_name, "Read");
}

// =============================================================================
// Pattern 6: Tool-Specific Bash/Execute Operations
// =============================================================================

#[test]
fn test_pattern6_execute_bash_command() {
    let detector = PermissionDetector::new();
    
    let request = detector.detect("Allow Claude to execute bash command?");
    assert!(request.is_some());
    
    let req = request.unwrap();
    assert_eq!(req.tool_name, "Bash");
}

#[test]
fn test_pattern6_run_bash_script() {
    let detector = PermissionDetector::new();
    
    let request = detector.detect("Allow Claude to run bash script?");
    assert!(request.is_some());
    
    let req = request.unwrap();
    assert_eq!(req.tool_name, "Bash");
}

#[test]
fn test_pattern6_execute_command() {
    let detector = PermissionDetector::new();
    
    let request = detector.detect("Allow Claude to execute command?");
    assert!(request.is_some());
    
    let req = request.unwrap();
    assert_eq!(req.tool_name, "Bash");
}

// =============================================================================
// Pattern 7: Generic Permission with Question
// =============================================================================

#[test]
fn test_pattern7_generic_allow() {
    let detector = PermissionDetector::new();
    
    let request = detector.detect("Allow this operation? (y/n)");
    assert!(request.is_some());
}

#[test]
fn test_pattern7_generic_with_details() {
    let detector = PermissionDetector::new();
    
    let request = detector.detect("Allow Claude to proceed with file operations? y/n");
    assert!(request.is_some());
}

// =============================================================================
// Pattern 8: Simple Approval Pattern
// =============================================================================

#[test]
fn test_pattern8_approve() {
    let detector = PermissionDetector::new();
    
    let request = detector.detect("Approve file write? (y/n)");
    assert!(request.is_some());
}

#[test]
fn test_pattern8_confirm() {
    let detector = PermissionDetector::new();
    
    let request = detector.detect("Confirm deletion? [y/n]");
    assert!(request.is_some());
    
    let req = request.unwrap();
    assert_eq!(req.tool_name, "Delete");
}

// =============================================================================
// Case Insensitivity Tests
// =============================================================================

#[test]
fn test_case_insensitive_lowercase() {
    let detector = PermissionDetector::new();
    
    assert!(detector.detect("allow claude to write file? (y/n)").is_some());
}

#[test]
fn test_case_insensitive_uppercase() {
    let detector = PermissionDetector::new();
    
    assert!(detector.detect("ALLOW CLAUDE TO WRITE FILE? (Y/N)").is_some());
}

#[test]
fn test_case_insensitive_mixed() {
    let detector = PermissionDetector::new();
    
    assert!(detector.detect("AlLoW ClAuDe To WrItE fIlE? (y/n)").is_some());
}

// =============================================================================
// Windows Path Tests
// =============================================================================

#[test]
fn test_windows_path_detection() {
    let detector = PermissionDetector::new();
    
    let request = detector.detect(r"Allow to read C:\Users\test\file.txt? (y/n)");
    assert!(request.is_some());
    
    let req = request.unwrap();
    assert_eq!(req.file_path, Some(r"C:\Users\test\file.txt".to_string()));
}

#[test]
fn test_windows_path_with_spaces() {
    let detector = PermissionDetector::new();
    
    let request = detector.detect(r"Allow to write C:\Program Files\app\config.ini? (y/n)");
    assert!(request.is_some());
}

// =============================================================================
// Relative Path Tests
// =============================================================================

#[test]
fn test_relative_path_simple() {
    let detector = PermissionDetector::new();
    
    let request = detector.detect("Allow to write config.json? (y/n)");
    assert!(request.is_some());
    
    let req = request.unwrap();
    assert_eq!(req.file_path, Some("config.json".to_string()));
}

#[test]
fn test_relative_path_with_extension() {
    let detector = PermissionDetector::new();
    
    let request = detector.detect("Allow to read data.txt? (y/n)");
    assert!(request.is_some());
    
    let req = request.unwrap();
    assert_eq!(req.file_path, Some("data.txt".to_string()));
}

// =============================================================================
// Command Extraction Tests
// =============================================================================

#[test]
fn test_command_extraction_backticks() {
    let detector = PermissionDetector::new();
    
    let request = detector.detect("Allow to execute command `ls -la`? (y/n)");
    assert!(request.is_some());
    
    let req = request.unwrap();
    assert_eq!(req.command, Some("ls -la".to_string()));
}

#[test]
fn test_command_extraction_double_quotes() {
    let detector = PermissionDetector::new();
    
    let request = detector.detect("Allow to run bash script \"npm install\"? (y/n)");
    assert!(request.is_some());
    
    let req = request.unwrap();
    assert_eq!(req.command, Some("npm install".to_string()));
}

#[test]
fn test_command_extraction_single_quotes() {
    let detector = PermissionDetector::new();
    
    let request = detector.detect("Allow to execute command 'cargo build'? (y/n)");
    assert!(request.is_some());
    
    let req = request.unwrap();
    assert_eq!(req.command, Some("cargo build".to_string()));
}

// =============================================================================
// Heuristic Detection Tests
// =============================================================================

#[test]
fn test_heuristic_simple() {
    let detector = PermissionDetector::new();
    
    // Non-standard format that heuristic should catch
    let request = detector.detect("Allow operation to read data? yes/no");
    assert!(request.is_some());
}

#[test]
fn test_heuristic_with_action() {
    let detector = PermissionDetector::new();
    
    let _request = detector.detect("Approve write operation?");
    // This might not match without y/n indicator, depending on heuristic settings
    // But should match if it has clear approval + action keywords
}

#[test]
fn test_heuristic_disabled() {
    let mut config = PermissionDetectorConfig::default();
    config.enable_heuristics = false;
    let detector = PermissionDetector::with_config(config);
    
    // This would match heuristic but not regex
    let request = detector.detect("Approve read operation?");
    assert!(request.is_none());
}

// =============================================================================
// False Positive Tests
// =============================================================================

#[test]
fn test_no_false_positive_regular_question() {
    let detector = PermissionDetector::new();
    
    assert!(detector.detect("What should I do?").is_none());
    assert!(detector.detect("How does this work?").is_none());
    assert!(detector.detect("Can you help me?").is_none());
    assert!(detector.detect("Where is the file?").is_none());
}

#[test]
fn test_no_false_positive_json() {
    let detector = PermissionDetector::new();
    
    assert!(detector
        .detect(r#"{"type": "message", "content": "Allow me to explain"}"#)
        .is_none());
    
    assert!(detector
        .detect(r#"{"action": "write", "path": "/file.txt"}"#)
        .is_none());
}

#[test]
fn test_no_false_positive_code_comments() {
    let detector = PermissionDetector::new();
    
    assert!(detector
        .detect("// Allow the user to write to the file")
        .is_none());
    
    assert!(detector
        .detect("# Allow read access to the database")
        .is_none());
}

#[test]
fn test_no_false_positive_empty() {
    let detector = PermissionDetector::new();
    
    assert!(detector.detect("").is_none());
    assert!(detector.detect("   ").is_none());
    assert!(detector.detect("\n").is_none());
    assert!(detector.detect("\t").is_none());
}

#[test]
fn test_no_false_positive_narrative_text() {
    let detector = PermissionDetector::new();
    
    assert!(detector
        .detect("The system will allow users to write files.")
        .is_none());
    
    assert!(detector
        .detect("You can read the documentation here.")
        .is_none());
}

// =============================================================================
// Edge Case Tests
// =============================================================================

#[test]
fn test_multiple_paths_in_line() {
    let detector = PermissionDetector::new();
    
    let request = detector.detect("Allow write to /src/main.rs from /tmp/backup.rs? (y/n)");
    assert!(request.is_some());
    
    let req = request.unwrap();
    // Should extract at least one path
    assert!(req.file_path.is_some());
}

#[test]
fn test_unicode_in_path() {
    let detector = PermissionDetector::new();
    
    let request = detector.detect("Allow write to /home/用户/文件.txt? (y/n)");
    assert!(request.is_some());
}

#[test]
fn test_very_long_line() {
    let detector = PermissionDetector::new();
    
    let long_line = format!(
        "Allow Claude to write to {}? (y/n)",
        "/very/long/path/".repeat(100)
    );
    
    let request = detector.detect(&long_line);
    assert!(request.is_some());
}

#[test]
fn test_path_with_special_characters() {
    let detector = PermissionDetector::new();
    
    let request = detector.detect("Allow write to /path/with-dashes_and_underscores.txt? (y/n)");
    assert!(request.is_some());
    
    let req = request.unwrap();
    assert!(req.file_path.is_some());
}

#[test]
fn test_path_with_dots() {
    let detector = PermissionDetector::new();
    
    let request = detector.detect("Allow read ../parent/directory/file.txt? (y/n)");
    assert!(request.is_some());
}

// =============================================================================
// Provider-Specific Pattern Tests
// =============================================================================

#[test]
fn test_provider_specific_patterns() {
    let mut detector = PermissionDetector::new();
    
    // Register custom pattern for a fictional provider
    detector.register_provider_patterns(
        "custom-cli",
        vec![Regex::new(r"Approve action: .*? \[yes/no\]").unwrap()],
    );
    
    let request = detector.detect("Approve action: file write [yes/no]");
    assert!(request.is_some());
}

#[test]
fn test_multiple_provider_patterns() {
    let mut detector = PermissionDetector::new();
    
    detector.register_provider_patterns(
        "provider-a",
        vec![Regex::new(r"CONFIRM: .*?\?").unwrap()],
    );
    
    detector.register_provider_patterns(
        "provider-b",
        vec![Regex::new(r"PROCEED WITH .*?\?").unwrap()],
    );
    
    assert!(detector.detect("CONFIRM: write operation?").is_some());
    assert!(detector.detect("PROCEED WITH read action?").is_some());
}

// =============================================================================
// Pending Permission Tracking Tests
// =============================================================================

#[test]
fn test_track_pending() {
    let mut detector = PermissionDetector::new();
    
    let request = openflow_contracts::events::PermissionRequest {
        tool_name: "Write".to_string(),
        description: "Allow write?".to_string(),
        file_path: Some("/test.txt".to_string()),
        command: None,
    };
    
    let key = detector.track_pending("session-123", request);
    assert!(!key.is_empty());
    assert_eq!(detector.pending_count(), 1);
}

#[test]
fn test_remove_pending() {
    let mut detector = PermissionDetector::new();
    
    let request = openflow_contracts::events::PermissionRequest::new("Write", "Allow write?");
    let key = detector.track_pending("session-123", request);
    
    assert_eq!(detector.pending_count(), 1);
    
    let removed = detector.remove_pending(&key);
    assert!(removed.is_some());
    assert_eq!(detector.pending_count(), 0);
}

#[test]
fn test_get_pending_for_session() {
    let mut detector = PermissionDetector::new();
    
    detector.track_pending("session-1", openflow_contracts::events::PermissionRequest::new("Write", "Write 1"));
    detector.track_pending("session-1", openflow_contracts::events::PermissionRequest::new("Read", "Read 1"));
    detector.track_pending("session-2", openflow_contracts::events::PermissionRequest::new("Bash", "Bash 1"));
    
    let session1_pending = detector.get_pending_for_session("session-1");
    assert_eq!(session1_pending.len(), 2);
    
    let session2_pending = detector.get_pending_for_session("session-2");
    assert_eq!(session2_pending.len(), 1);
}

#[test]
fn test_pending_count_for_session() {
    let mut detector = PermissionDetector::new();
    
    detector.track_pending("session-1", openflow_contracts::events::PermissionRequest::new("Write", "Write 1"));
    detector.track_pending("session-1", openflow_contracts::events::PermissionRequest::new("Read", "Read 1"));
    detector.track_pending("session-2", openflow_contracts::events::PermissionRequest::new("Bash", "Bash 1"));
    
    assert_eq!(detector.pending_count_for_session("session-1"), 2);
    assert_eq!(detector.pending_count_for_session("session-2"), 1);
    assert_eq!(detector.pending_count_for_session("session-3"), 0);
}

#[test]
fn test_clear_all_pending() {
    let mut detector = PermissionDetector::new();
    
    detector.track_pending("session-1", openflow_contracts::events::PermissionRequest::new("Write", "Write 1"));
    detector.track_pending("session-2", openflow_contracts::events::PermissionRequest::new("Read", "Read 1"));
    
    assert_eq!(detector.pending_count(), 2);
    
    detector.clear_all_pending();
    assert_eq!(detector.pending_count(), 0);
}

#[test]
fn test_cleanup_timed_out() {
    let mut config = PermissionDetectorConfig::default();
    config.timeout_seconds = -1; // Negative timeout means immediate timeout
    let mut detector = PermissionDetector::with_config(config);
    
    detector.track_pending("session-1", openflow_contracts::events::PermissionRequest::new("Write", "Write 1"));
    detector.track_pending("session-2", openflow_contracts::events::PermissionRequest::new("Read", "Read 1"));
    
    assert_eq!(detector.pending_count(), 2);
    
    // All permissions should be immediately timed out due to negative timeout
    let timed_out = detector.cleanup_timed_out();
    assert_eq!(timed_out.len(), 2);
    assert_eq!(detector.pending_count(), 0);
}

#[test]
fn test_pending_permission_timeout_tracking() {
    let mut config = PermissionDetectorConfig::default();
    config.timeout_seconds = 60;
    let mut detector = PermissionDetector::with_config(config);
    
    let request = openflow_contracts::events::PermissionRequest::new("Write", "test");
    let _key = detector.track_pending("session-1", request);
    
    let pending_list = detector.get_pending_for_session("session-1");
    assert_eq!(pending_list.len(), 1);
    
    let pending = pending_list[0];
    assert!(!pending.is_timed_out());
    assert!(pending.remaining_seconds() > 0);
}

// =============================================================================
// Configuration Tests
// =============================================================================

#[test]
fn test_custom_timeout() {
    let config = PermissionDetectorConfig {
        timeout_seconds: 120,
        ..Default::default()
    };
    
    let mut detector = PermissionDetector::with_config(config);
    let request = openflow_contracts::events::PermissionRequest::new("Write", "test");
    detector.track_pending("session-1", request);
    
    let pending = detector.get_pending_for_session("session-1");
    assert_eq!(pending.len(), 1);
    
    // Timeout should be approximately 120 seconds from now
    let remaining = pending[0].remaining_seconds();
    assert!(remaining >= 119 && remaining <= 121);
}

#[test]
fn test_verbose_logging_config() {
    let config = PermissionDetectorConfig {
        verbose_logging: true,
        ..Default::default()
    };
    
    let detector = PermissionDetector::with_config(config);
    // Config is private, so we can't directly assert on it
    // The test will verify behavior through detection results
    
    // Detection should still work with verbose logging
    let request = detector.detect("Allow write? (y/n)");
    assert!(request.is_some());
}

#[test]
fn test_default_config() {
    let config = PermissionDetectorConfig::default();
    
    assert_eq!(config.timeout_seconds, DEFAULT_PERMISSION_TIMEOUT_SECONDS);
    assert!(config.enable_heuristics);
    assert!(!config.verbose_logging);
}

// =============================================================================
// Comprehensive Pattern Coverage Test
// =============================================================================

#[test]
fn test_all_patterns_comprehensive() {
    let detector = PermissionDetector::new();
    
    // Test cases covering all patterns
    let test_cases = vec![
        // Pattern 1: Standard (y/n)
        ("Allow Claude to write to file.txt? (y/n)", true),
        ("Allow Claude to read config.json? (y/n)", true),
        ("Allow Claude to execute script? (y/n)", true),
        
        // Pattern 2: Bracket [y/n]
        ("Allow Claude to write to file.txt? [y/n]", true),
        ("Allow Claude to read config.json? [y/n]", true),
        
        // Pattern 3: Question only
        ("write to file.txt? y/n", true),
        ("read config.json? (y/n)", true),
        
        // Pattern 4: Write specific
        ("Allow Claude to write to `/etc/config`?", true),
        ("Allow Claude to write to \"/home/file.txt\"?", true),
        
        // Pattern 5: Read specific
        ("Allow Claude to read file `/src/lib.rs`?", true),
        ("Allow Claude to read `/config.toml`?", true),
        
        // Pattern 6: Bash specific
        ("Allow Claude to execute bash command?", true),
        ("Allow Claude to run bash script?", true),
        
        // Pattern 7: Generic
        ("Allow this operation? (y/n)", true),
        
        // Pattern 8: Approval
        ("Approve file write? (y/n)", true),
        ("Confirm deletion? [y/n]", true),
        
        // False positives
        ("What should I do?", false),
        ("How does this work?", false),
        (r#"{"type": "message"}"#, false),
        ("", false),
    ];
    
    for (input, should_match) in test_cases {
        let result = detector.detect(input);
        assert_eq!(
            result.is_some(),
            should_match,
            "Pattern matching failed for: {}",
            input
        );
    }
}

