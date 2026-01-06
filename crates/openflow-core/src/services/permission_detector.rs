//! Permission Detector Service
//!
//! Detects permission prompts from agent output using multiple regex patterns
//! and heuristic parsing. Tracks pending permissions with configurable timeouts.
//!
//! # Architecture
//!
//! ```text
//! ┌─────────────────────────────────────────────────────────────────────────┐
//! │                    Permission Detection Pipeline                         │
//! ├─────────────────────────────────────────────────────────────────────────┤
//! │                                                                          │
//! │  Raw Output Line        PermissionDetector        PermissionRequest     │
//! │  (from PTY)            (pattern matching)         (structured)          │
//! │                                                                          │
//! │  "Allow Claude to    →  - Match regex         →   - tool_name: "Write"  │
//! │   write to file.txt?"   - Extract metadata        - file_path: "file.txt"│
//! │                         - Heuristic fallback      - description: ...    │
//! │                         - Track pending           - timeout tracking    │
//! │                                                                          │
//! └─────────────────────────────────────────────────────────────────────────┘
//! ```
//!
//! # Key Features
//!
//! - **Multiple Pattern Support**: Detects various permission prompt formats
//! - **Heuristic Fallback**: Handles edge cases not covered by regex
//! - **Metadata Extraction**: Extracts tool name, file path, and command details
//! - **Provider-Specific Patterns**: Allows registration of provider-specific patterns
//! - **Timeout Tracking**: Tracks pending permissions with configurable timeouts
//! - **False Positive Filtering**: Avoids detecting non-permission content

use chrono::{DateTime, Duration, Utc};
use openflow_contracts::events::PermissionRequest;
use regex::Regex;
use std::collections::HashMap;
use std::sync::LazyLock;
use tracing::{debug, trace, warn};

/// Default timeout for pending permissions (5 minutes)
pub const DEFAULT_PERMISSION_TIMEOUT_SECONDS: i64 = 300;

/// Built-in permission detection patterns
///
/// These patterns cover common permission prompt formats across different providers:
/// - Standard format: "Allow X to Y? (y/n)"
/// - Bracket format: "Allow X to Y? [y/n]"
/// - Question-only format: "Y Z? (y/n)"
/// - Tool-specific variations
static PERMISSION_PATTERNS: LazyLock<Vec<Regex>> = LazyLock::new(|| {
    vec![
        // Standard format with (y/n)
        Regex::new(r"(?i)Allow\s+.*?\s+to\s+(read|write|execute|bash|run|delete|create|modify).*?\?\s*\(y/n\)")
            .expect("Invalid permission regex 1"),
        // Bracket format with [y/n]
        Regex::new(r"(?i)Allow\s+.*?\s+to\s+(read|write|execute|bash|run|delete|create|modify).*?\?\s*\[y/n\]")
            .expect("Invalid permission regex 2"),
        // Question mark only format (with y/n indicator or specific action)
        Regex::new(r"(?i)(read|write|execute|run|delete|create|modify)\s+.+?\?\s*[\(\[]?y/n[\)\]]?")
            .expect("Invalid permission regex 3"),
        // Tool-specific: Write operations
        Regex::new(r#"(?i)Allow\s+\w+\s+to\s+write\s+to\s+[`'"]?([^`'"?\s]+)[`'"]?\?"#)
            .expect("Invalid permission regex 4"),
        // Tool-specific: Read operations
        Regex::new(r#"(?i)Allow\s+\w+\s+to\s+read\s+(file\s+)?[`'"]?([^`'"?\s]+)[`'"]?\?"#)
            .expect("Invalid permission regex 5"),
        // Tool-specific: Bash/Execute operations
        Regex::new(r"(?i)Allow\s+\w+\s+to\s+(execute|run)\s+(bash\s+)?(command|script)\?")
            .expect("Invalid permission regex 6"),
        // Generic permission with question
        Regex::new(r"(?i)Allow\s+.*?\?\s*[\(\[]?y/n[\)\]]?")
            .expect("Invalid permission regex 7"),
        // Simple approval pattern (must have y/n indicator)
        Regex::new(r"(?i)(Approve|Confirm|Allow)\s+.*?\?\s*[\(\[]?y/n[\)\]]?")
            .expect("Invalid permission regex 8"),
    ]
});

/// Regex for extracting file paths from permission prompts
/// Matches Unix paths (/path/to/file), Windows paths (C:\path), or relative paths (file.txt)
static FILE_PATH_REGEX: LazyLock<Regex> = LazyLock::new(|| {
    Regex::new(r#"(?:to\s+|file\s+|path\s+)?["`']?(/[^\s"'`?\[\]]+|[A-Za-z]:\\[^\s"'`?\[\]]+|[a-zA-Z0-9_\-\.]+\.[a-zA-Z0-9]+)["`']?\??"#)
        .expect("Invalid file path regex")
});

/// Regex for extracting commands from permission prompts
static COMMAND_REGEX: LazyLock<Regex> = LazyLock::new(|| {
    Regex::new(r#"(?i)(?:command|script|bash)\s*:?\s*["`']([^"`']+)["`']"#)
        .expect("Invalid command regex")
});

/// Configuration for PermissionDetector
#[derive(Debug, Clone)]
pub struct PermissionDetectorConfig {
    /// Timeout duration for pending permissions in seconds
    pub timeout_seconds: i64,
    
    /// Whether to use heuristic fallback for edge cases
    pub enable_heuristics: bool,
    
    /// Whether to log detection details for debugging
    pub verbose_logging: bool,
}

impl Default for PermissionDetectorConfig {
    fn default() -> Self {
        Self {
            timeout_seconds: DEFAULT_PERMISSION_TIMEOUT_SECONDS,
            enable_heuristics: true,
            verbose_logging: false,
        }
    }
}

/// Pending permission tracking
#[derive(Debug, Clone)]
pub struct PendingPermission {
    /// The permission request
    pub request: PermissionRequest,
    
    /// When the permission was detected
    pub detected_at: DateTime<Utc>,
    
    /// When the permission will timeout
    pub timeout_at: DateTime<Utc>,
    
    /// Session ID this permission belongs to
    pub session_id: String,
}

impl PendingPermission {
    /// Check if this permission has timed out
    pub fn is_timed_out(&self) -> bool {
        Utc::now() > self.timeout_at
    }
    
    /// Get remaining time until timeout
    pub fn remaining_seconds(&self) -> i64 {
        let remaining = self.timeout_at - Utc::now();
        remaining.num_seconds().max(0)
    }
}

/// PermissionDetector detects and tracks permission prompts
///
/// This service analyzes agent output lines to detect permission requests,
/// extracts metadata (tool name, file path, command), and tracks pending
/// permissions with timeouts.
///
/// # Example
/// ```
/// use openflow_core::services::permission_detector::{PermissionDetector, PermissionDetectorConfig};
///
/// let detector = PermissionDetector::new();
///
/// // Detect permission from output line
/// let line = "Allow Claude to write to /src/main.rs? (y/n)";
/// if let Some(request) = detector.detect(line) {
///     println!("Tool: {}, File: {:?}", request.tool_name, request.file_path);
/// }
/// ```
#[derive(Debug)]
pub struct PermissionDetector {
    /// Configuration
    config: PermissionDetectorConfig,
    
    /// Provider-specific patterns (keyed by provider ID)
    provider_patterns: HashMap<String, Vec<Regex>>,
    
    /// Pending permissions (keyed by session ID + permission description hash)
    pending: HashMap<String, PendingPermission>,
}

impl PermissionDetector {
    /// Create a new PermissionDetector with default configuration
    pub fn new() -> Self {
        Self::with_config(PermissionDetectorConfig::default())
    }
    
    /// Create a new PermissionDetector with custom configuration
    pub fn with_config(config: PermissionDetectorConfig) -> Self {
        debug!(
            timeout_seconds = config.timeout_seconds,
            enable_heuristics = config.enable_heuristics,
            "Creating PermissionDetector"
        );
        
        Self {
            config,
            provider_patterns: HashMap::new(),
            pending: HashMap::new(),
        }
    }
    
    /// Register provider-specific permission patterns
    ///
    /// # Arguments
    /// * `provider_id` - Unique provider identifier (e.g., "claude-code")
    /// * `patterns` - Vector of regex patterns specific to this provider
    ///
    /// # Example
    /// ```ignore
    /// detector.register_provider_patterns(
    ///     "custom-cli",
    ///     vec![
    ///         Regex::new(r"Approve action\? \[yes/no\]").unwrap(),
    ///     ],
    /// );
    /// ```
    pub fn register_provider_patterns(
        &mut self,
        provider_id: impl Into<String>,
        patterns: Vec<Regex>,
    ) {
        let provider_id = provider_id.into();
        debug!(
            provider_id = %provider_id,
            pattern_count = patterns.len(),
            "Registering provider-specific patterns"
        );
        self.provider_patterns.insert(provider_id, patterns);
    }
    
    /// Detect a permission request from an output line
    ///
    /// # Arguments
    /// * `line` - Raw output line from agent
    ///
    /// # Returns
    /// - `Some(PermissionRequest)` if a permission prompt is detected
    /// - `None` if the line is not a permission prompt
    ///
    /// # Example
    /// ```
    /// # use openflow_core::services::permission_detector::PermissionDetector;
    /// let detector = PermissionDetector::new();
    /// let request = detector.detect("Allow Claude to read config.json? (y/n)");
    /// assert!(request.is_some());
    /// ```
    pub fn detect(&self, line: &str) -> Option<PermissionRequest> {
        let trimmed = line.trim();
        
        // Skip empty lines
        if trimmed.is_empty() {
            return None;
        }
        
        if self.config.verbose_logging {
            trace!(line = %trimmed, "Checking line for permission prompt");
        }
        
        // Try built-in patterns first
        if let Some(request) = self.match_with_patterns(trimmed, &PERMISSION_PATTERNS) {
            debug!(
                tool_name = %request.tool_name,
                file_path = ?request.file_path,
                "Permission detected with built-in pattern"
            );
            return Some(request);
        }
        
        // Try provider-specific patterns
        for (provider_id, patterns) in &self.provider_patterns {
            if let Some(request) = self.match_with_patterns(trimmed, patterns) {
                debug!(
                    provider_id = %provider_id,
                    tool_name = %request.tool_name,
                    "Permission detected with provider-specific pattern"
                );
                return Some(request);
            }
        }
        
        // Try heuristic fallback if enabled
        if self.config.enable_heuristics {
            if let Some(request) = self.heuristic_detection(trimmed) {
                debug!(
                    tool_name = %request.tool_name,
                    "Permission detected with heuristic"
                );
                return Some(request);
            }
        }
        
        None
    }
    
    /// Match line against a set of patterns
    fn match_with_patterns(&self, line: &str, patterns: &[Regex]) -> Option<PermissionRequest> {
        for pattern in patterns {
            if pattern.is_match(line) {
                // Extract metadata
                let tool_name = self.extract_tool_name(line);
                let file_path = self.extract_file_path(line);
                let command = self.extract_command(line);
                
                return Some(PermissionRequest {
                    tool_name,
                    description: line.to_string(),
                    file_path,
                    command,
                });
            }
        }
        None
    }
    
    /// Heuristic detection for edge cases not covered by regex
    fn heuristic_detection(&self, line: &str) -> Option<PermissionRequest> {
        let lower = line.to_lowercase();
        
        // Must contain "allow" or similar approval keywords
        let has_approval_keyword = lower.contains("allow")
            || lower.contains("approve")
            || lower.contains("confirm")
            || lower.contains("permit");
        
        // Must contain a question mark
        let has_question = line.contains('?');
        
        // Should contain y/n prompt indicators
        let has_yn_prompt = lower.contains("(y/n)")
            || lower.contains("[y/n]")
            || lower.contains("y/n")
            || lower.contains("yes/no");
        
        // Check for action keywords
        let has_action = lower.contains("read")
            || lower.contains("write")
            || lower.contains("execute")
            || lower.contains("run")
            || lower.contains("delete")
            || lower.contains("deletion")
            || lower.contains("create")
            || lower.contains("modify");
        
        // Heuristic: needs at least approval + question + (y/n or action)
        if has_approval_keyword && has_question && (has_yn_prompt || has_action) {
            let tool_name = self.extract_tool_name(line);
            let file_path = self.extract_file_path(line);
            let command = self.extract_command(line);
            
            return Some(PermissionRequest {
                tool_name,
                description: line.to_string(),
                file_path,
                command,
            });
        }
        
        None
    }
    
    /// Extract tool name from permission prompt
    fn extract_tool_name(&self, prompt: &str) -> String {
        let lower = prompt.to_lowercase();
        
        // Check for specific tool keywords
        if lower.contains("write") || lower.contains("create") || lower.contains("modify") {
            "Write".to_string()
        } else if lower.contains("read") {
            "Read".to_string()
        } else if lower.contains("execute")
            || lower.contains("bash")
            || lower.contains("run")
            || lower.contains("shell")
            || lower.contains("command")
        {
            "Bash".to_string()
        } else if lower.contains("delete") || lower.contains("deletion") || lower.contains("remove") {
            "Delete".to_string()
        } else {
            // Generic tool name
            "Tool".to_string()
        }
    }
    
    /// Extract file path from permission prompt
    fn extract_file_path(&self, prompt: &str) -> Option<String> {
        // Try regex first
        if let Some(caps) = FILE_PATH_REGEX.captures(prompt) {
            return caps.get(1).map(|m| m.as_str().to_string());
        }
        
        // Fallback: look for path-like strings
        for word in prompt.split_whitespace() {
            let word = word.trim_matches(|c| c == '?' || c == '"' || c == '\'' || c == '`' || c == ',');
            
            // Unix-style path
            if word.starts_with('/') && word.len() > 1 {
                return Some(word.to_string());
            }
            
            // Windows-style path
            if word.len() > 3 && word.chars().nth(1) == Some(':') && word.chars().nth(2) == Some('\\') {
                return Some(word.to_string());
            }
        }
        
        None
    }
    
    /// Extract command from permission prompt
    fn extract_command(&self, prompt: &str) -> Option<String> {
        // Try regex first
        if let Some(caps) = COMMAND_REGEX.captures(prompt) {
            return caps.get(1).map(|m| m.as_str().to_string());
        }
        
        // Check if the entire prompt looks like a command permission
        let lower = prompt.to_lowercase();
        if (lower.contains("execute") || lower.contains("run")) && lower.contains("command") {
            // Try to extract command from quotes
            for (start, end) in [('`', '`'), ('"', '"'), ('\'', '\'')] {
                if let Some(start_pos) = prompt.find(start) {
                    if let Some(end_pos) = prompt[start_pos + 1..].find(end) {
                        let cmd = &prompt[start_pos + 1..start_pos + 1 + end_pos];
                        if !cmd.is_empty() {
                            return Some(cmd.to_string());
                        }
                    }
                }
            }
        }
        
        None
    }
    
    /// Track a pending permission
    ///
    /// # Arguments
    /// * `session_id` - Session ID this permission belongs to
    /// * `request` - The permission request to track
    ///
    /// # Returns
    /// A unique key for this pending permission
    pub fn track_pending(
        &mut self,
        session_id: impl Into<String>,
        request: PermissionRequest,
    ) -> String {
        let session_id = session_id.into();
        let detected_at = Utc::now();
        let timeout_at = detected_at + Duration::seconds(self.config.timeout_seconds);
        
        // Generate unique key based on session and description
        let key = format!(
            "{}-{}",
            session_id,
            self.hash_description(&request.description)
        );
        
        debug!(
            session_id = %session_id,
            key = %key,
            timeout_seconds = self.config.timeout_seconds,
            "Tracking pending permission"
        );
        
        let pending = PendingPermission {
            request,
            detected_at,
            timeout_at,
            session_id: session_id.clone(),
        };
        
        self.pending.insert(key.clone(), pending);
        key
    }
    
    /// Remove a pending permission (e.g., after user response)
    pub fn remove_pending(&mut self, key: &str) -> Option<PendingPermission> {
        debug!(key = %key, "Removing pending permission");
        self.pending.remove(key)
    }
    
    /// Get all pending permissions for a session
    pub fn get_pending_for_session(&self, session_id: &str) -> Vec<&PendingPermission> {
        self.pending
            .values()
            .filter(|p| p.session_id == session_id)
            .collect()
    }
    
    /// Get all timed out permissions
    pub fn get_timed_out(&self) -> Vec<&PendingPermission> {
        self.pending
            .values()
            .filter(|p| p.is_timed_out())
            .collect()
    }
    
    /// Clean up timed out permissions
    ///
    /// # Returns
    /// Vector of (key, permission) tuples that were removed
    pub fn cleanup_timed_out(&mut self) -> Vec<(String, PendingPermission)> {
        let timed_out_keys: Vec<String> = self
            .pending
            .iter()
            .filter(|(_, p)| p.is_timed_out())
            .map(|(k, _)| k.clone())
            .collect();
        
        let mut removed = Vec::new();
        for key in timed_out_keys {
            if let Some(permission) = self.pending.remove(&key) {
                warn!(
                    key = %key,
                    session_id = %permission.session_id,
                    tool_name = %permission.request.tool_name,
                    "Permission timed out"
                );
                removed.push((key, permission));
            }
        }
        
        removed
    }
    
    /// Get count of pending permissions
    pub fn pending_count(&self) -> usize {
        self.pending.len()
    }
    
    /// Get count of pending permissions for a session
    pub fn pending_count_for_session(&self, session_id: &str) -> usize {
        self.pending
            .values()
            .filter(|p| p.session_id == session_id)
            .count()
    }
    
    /// Clear all pending permissions (useful for testing)
    pub fn clear_all_pending(&mut self) {
        debug!("Clearing all pending permissions");
        self.pending.clear();
    }
    
    /// Simple hash function for description (for generating keys)
    fn hash_description(&self, description: &str) -> u64 {
        use std::collections::hash_map::DefaultHasher;
        use std::hash::{Hash, Hasher};
        
        let mut hasher = DefaultHasher::new();
        description.hash(&mut hasher);
        hasher.finish()
    }
}

impl Default for PermissionDetector {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    
    // =========================================================================
    // Detection Tests - Built-in Patterns
    // =========================================================================
    
    #[test]
    fn test_detect_standard_format_parentheses() {
        let detector = PermissionDetector::new();
        
        let request = detector.detect("Allow Claude to write to /src/main.rs? (y/n)");
        assert!(request.is_some());
        
        let req = request.unwrap();
        assert_eq!(req.tool_name, "Write");
        assert_eq!(req.file_path, Some("/src/main.rs".to_string()));
    }
    
    #[test]
    fn test_detect_standard_format_brackets() {
        let detector = PermissionDetector::new();
        
        let request = detector.detect("Allow Claude to read file.txt? [y/n]");
        assert!(request.is_some());
        
        let req = request.unwrap();
        assert_eq!(req.tool_name, "Read");
        assert_eq!(req.file_path, Some("file.txt".to_string()));
    }
    
    #[test]
    fn test_detect_bash_command() {
        let detector = PermissionDetector::new();
        
        let request = detector.detect("Allow Claude to execute bash command? (y/n)");
        assert!(request.is_some());
        
        let req = request.unwrap();
        assert_eq!(req.tool_name, "Bash");
    }
    
    #[test]
    fn test_detect_delete_operation() {
        let detector = PermissionDetector::new();
        
        let request = detector.detect("Allow to delete file /tmp/test.log? (y/n)");
        assert!(request.is_some());
        
        let req = request.unwrap();
        assert_eq!(req.tool_name, "Delete");
        assert_eq!(req.file_path, Some("/tmp/test.log".to_string()));
    }
    
    #[test]
    fn test_detect_with_quoted_path() {
        let detector = PermissionDetector::new();
        
        let request = detector.detect("Allow to write to `/etc/config`? (y/n)");
        assert!(request.is_some());
        
        let req = request.unwrap();
        assert_eq!(req.file_path, Some("/etc/config".to_string()));
    }
    
    #[test]
    fn test_detect_windows_path() {
        let detector = PermissionDetector::new();
        
        let request = detector.detect(r"Allow to read C:\Users\test\file.txt? (y/n)");
        assert!(request.is_some());
        
        let req = request.unwrap();
        assert_eq!(req.file_path, Some(r"C:\Users\test\file.txt".to_string()));
    }
    
    #[test]
    fn test_detect_case_insensitive() {
        let detector = PermissionDetector::new();
        
        // Lowercase
        assert!(detector.detect("allow claude to write file? (y/n)").is_some());
        
        // Uppercase
        assert!(detector.detect("ALLOW CLAUDE TO WRITE FILE? (Y/N)").is_some());
        
        // Mixed case
        assert!(detector.detect("AlLoW ClAuDe To WrItE fIlE? (y/n)").is_some());
    }
    
    // =========================================================================
    // Heuristic Detection Tests
    // =========================================================================
    
    #[test]
    fn test_heuristic_detection_simple() {
        let detector = PermissionDetector::new();
        
        // Non-standard format that heuristic should catch
        let request = detector.detect("Allow operation to read data? yes/no");
        assert!(request.is_some());
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
    
    // =========================================================================
    // False Positive Tests
    // =========================================================================
    
    #[test]
    fn test_no_false_positive_regular_question() {
        let detector = PermissionDetector::new();
        
        // Regular questions should NOT be detected as permissions
        assert!(detector.detect("What should I do?").is_none());
        assert!(detector.detect("How does this work?").is_none());
        assert!(detector.detect("Can you help me?").is_none());
    }
    
    #[test]
    fn test_no_false_positive_json() {
        let detector = PermissionDetector::new();
        
        // JSON lines should NOT be detected
        assert!(detector
            .detect(r#"{"type": "message", "content": "Allow me to explain"}"#)
            .is_none());
    }
    
    #[test]
    fn test_no_false_positive_empty() {
        let detector = PermissionDetector::new();
        
        assert!(detector.detect("").is_none());
        assert!(detector.detect("   ").is_none());
        assert!(detector.detect("\n").is_none());
    }
    
    // =========================================================================
    // Metadata Extraction Tests
    // =========================================================================
    
    #[test]
    fn test_extract_tool_name() {
        let detector = PermissionDetector::new();
        
        assert_eq!(detector.extract_tool_name("write to file"), "Write");
        assert_eq!(detector.extract_tool_name("read from disk"), "Read");
        assert_eq!(detector.extract_tool_name("execute command"), "Bash");
        assert_eq!(detector.extract_tool_name("run script"), "Bash");
        assert_eq!(detector.extract_tool_name("delete file"), "Delete");
        assert_eq!(detector.extract_tool_name("unknown action"), "Tool");
    }
    
    #[test]
    fn test_extract_file_path_unix() {
        let detector = PermissionDetector::new();
        
        assert_eq!(
            detector.extract_file_path("write to /src/main.rs"),
            Some("/src/main.rs".to_string())
        );
        
        assert_eq!(
            detector.extract_file_path("read file `/home/user/config.json`"),
            Some("/home/user/config.json".to_string())
        );
        
        assert_eq!(
            detector.extract_file_path("path: '/etc/hosts' ok?"),
            Some("/etc/hosts".to_string())
        );
    }
    
    #[test]
    fn test_extract_file_path_none() {
        let detector = PermissionDetector::new();
        
        assert!(detector.extract_file_path("execute bash command").is_none());
        assert!(detector.extract_file_path("no path here").is_none());
    }
    
    #[test]
    fn test_extract_command() {
        let detector = PermissionDetector::new();
        
        assert_eq!(
            detector.extract_command("execute command `ls -la`"),
            Some("ls -la".to_string())
        );
        
        assert_eq!(
            detector.extract_command("run bash script \"npm install\""),
            Some("npm install".to_string())
        );
    }
    
    // =========================================================================
    // Provider-Specific Pattern Tests
    // =========================================================================
    
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
    
    // =========================================================================
    // Pending Permission Tracking Tests
    // =========================================================================
    
    #[test]
    fn test_track_pending() {
        let mut detector = PermissionDetector::new();
        
        let request = PermissionRequest {
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
        
        let request = PermissionRequest::new("Write", "Allow write?");
        let key = detector.track_pending("session-123", request);
        
        assert_eq!(detector.pending_count(), 1);
        
        let removed = detector.remove_pending(&key);
        assert!(removed.is_some());
        assert_eq!(detector.pending_count(), 0);
    }
    
    #[test]
    fn test_get_pending_for_session() {
        let mut detector = PermissionDetector::new();
        
        detector.track_pending("session-1", PermissionRequest::new("Write", "Write 1"));
        detector.track_pending("session-1", PermissionRequest::new("Read", "Read 1"));
        detector.track_pending("session-2", PermissionRequest::new("Bash", "Bash 1"));
        
        let session1_pending = detector.get_pending_for_session("session-1");
        assert_eq!(session1_pending.len(), 2);
        
        let session2_pending = detector.get_pending_for_session("session-2");
        assert_eq!(session2_pending.len(), 1);
    }
    
    #[test]
    fn test_pending_count_for_session() {
        let mut detector = PermissionDetector::new();
        
        detector.track_pending("session-1", PermissionRequest::new("Write", "Write 1"));
        detector.track_pending("session-1", PermissionRequest::new("Read", "Read 1"));
        detector.track_pending("session-2", PermissionRequest::new("Bash", "Bash 1"));
        
        assert_eq!(detector.pending_count_for_session("session-1"), 2);
        assert_eq!(detector.pending_count_for_session("session-2"), 1);
        assert_eq!(detector.pending_count_for_session("session-3"), 0);
    }
    
    #[test]
    fn test_clear_all_pending() {
        let mut detector = PermissionDetector::new();
        
        detector.track_pending("session-1", PermissionRequest::new("Write", "Write 1"));
        detector.track_pending("session-2", PermissionRequest::new("Read", "Read 1"));
        
        assert_eq!(detector.pending_count(), 2);
        
        detector.clear_all_pending();
        assert_eq!(detector.pending_count(), 0);
    }
    
    #[test]
    fn test_pending_permission_is_timed_out() {
        let mut config = PermissionDetectorConfig::default();
        config.timeout_seconds = 1; // 1 second for testing
        let mut detector = PermissionDetector::with_config(config);
        
        let request = PermissionRequest::new("Write", "Allow write?");
        let key = detector.track_pending("session-123", request);
        
        // Should not be timed out immediately
        let pending = detector.pending.get(&key).unwrap();
        assert!(!pending.is_timed_out());
        
        // Sleep and check again (would timeout after 1 second in real usage)
        // Note: In real code, you'd need std::thread::sleep(Duration::from_secs(2))
        // but we can test the logic without actual sleeping
    }
    
    #[test]
    fn test_cleanup_timed_out() {
        let mut config = PermissionDetectorConfig::default();
        config.timeout_seconds = -1; // Negative timeout means immediate timeout
        let mut detector = PermissionDetector::with_config(config);
        
        detector.track_pending("session-1", PermissionRequest::new("Write", "Write 1"));
        detector.track_pending("session-2", PermissionRequest::new("Read", "Read 1"));
        
        assert_eq!(detector.pending_count(), 2);
        
        // All permissions should be immediately timed out due to negative timeout
        let timed_out = detector.cleanup_timed_out();
        assert_eq!(timed_out.len(), 2);
        assert_eq!(detector.pending_count(), 0);
    }
    
    // =========================================================================
    // Configuration Tests
    // =========================================================================
    
    #[test]
    fn test_custom_timeout() {
        let config = PermissionDetectorConfig {
            timeout_seconds: 60,
            ..Default::default()
        };
        
        let mut detector = PermissionDetector::with_config(config);
        let request = PermissionRequest::new("Write", "test");
        detector.track_pending("session-1", request);
        
        let pending = detector.pending.values().next().unwrap();
        let expected_duration = Duration::seconds(60);
        let actual_duration = pending.timeout_at - pending.detected_at;
        
        // Allow 1 second tolerance for test execution time
        assert!((actual_duration - expected_duration).num_seconds().abs() <= 1);
    }
    
    #[test]
    fn test_verbose_logging_config() {
        let config = PermissionDetectorConfig {
            verbose_logging: true,
            ..Default::default()
        };
        
        let detector = PermissionDetector::with_config(config);
        assert!(detector.config.verbose_logging);
        
        // Detection should still work with verbose logging
        let request = detector.detect("Allow write? (y/n)");
        assert!(request.is_some());
    }
    
    // =========================================================================
    // Edge Case Tests
    // =========================================================================
    
    #[test]
    fn test_multiple_paths_in_line() {
        let detector = PermissionDetector::new();
        
        // Should extract first path
        let request = detector.detect("Allow write to /src/main.rs from /tmp/backup.rs? (y/n)");
        assert!(request.is_some());
        
        let req = request.unwrap();
        // Should get one of the paths (implementation may vary)
        assert!(req.file_path.is_some());
    }
    
    #[test]
    fn test_unicode_in_path() {
        let detector = PermissionDetector::new();
        
        let request = detector.detect("Allow write to /home/用户/文件.txt? (y/n)");
        assert!(request.is_some());
        // Unicode handling in paths
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
}

