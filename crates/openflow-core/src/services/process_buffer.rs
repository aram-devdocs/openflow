//! Process Buffer Service
//!
//! Maintains authoritative state for running processes, including:
//! - Raw PTY output in a ring buffer
//! - Parsed Claude events
//! - Tool state tracking
//! - Snapshots for client synchronization

use std::collections::{HashMap, VecDeque};
use std::sync::LazyLock;

use regex::Regex;

use openflow_contracts::{
    entities::{
        process::ProcessStatus,
        tool_state::{ToolState, ToolStatus},
    },
    requests::ProcessSnapshot,
};
use tracing::{debug, trace, warn};

/// Maximum size of raw output buffer (10MB)
const MAX_RAW_BUFFER_SIZE: usize = 10 * 1024 * 1024;

/// Maximum number of parsed events to retain
const MAX_EVENTS: usize = 10000;

/// Regex pattern for ANSI escape sequences.
/// Matches: CSI sequences, OSC sequences, and other escape sequences.
static ANSI_REGEX: LazyLock<Regex> = LazyLock::new(|| {
    Regex::new(concat!(
        r"\x1b\[[0-9;]*[A-Za-z]",            // CSI sequences (colors, cursor, etc.)
        r"|\x1b\][^\x07]*\x07",              // OSC sequences (terminated by BEL)
        r"|\x1b[PX^_][^\x1b]*\x1b\\",        // DCS/SOS/PM/APC sequences
        r"|\x1b[\[\]()#;?]*[0-9;]*[A-Za-z]", // Other escape sequences
        r"|\x1b.",                           // Simple escape sequences
        r"|[\x00-\x08\x0b\x0c\x0e-\x1f]",    // Control characters (except newline, tab, CR)
    ))
    .expect("Invalid ANSI regex pattern")
});

/// Strip ANSI escape codes and control characters from a string.
fn strip_ansi_codes(s: &str) -> String {
    ANSI_REGEX.replace_all(s, "").to_string()
}

/// Buffer that maintains process state for streaming to clients
#[derive(Debug)]
pub struct ProcessBuffer {
    /// Process ID
    process_id: String,

    /// Raw PTY output bytes
    raw_bytes: VecDeque<u8>,

    /// Total bytes received (for offset tracking)
    total_bytes_received: usize,

    /// Parsed Claude events as JSON values
    events: Vec<serde_json::Value>,

    /// Sequence number for next event
    next_event_sequence: i32,

    /// Tool states by tool ID
    tool_states: HashMap<String, ToolState>,

    /// Next tool sequence number
    next_tool_sequence: i32,

    /// Current process status
    status: ProcessStatus,

    /// Exit code if process finished
    exit_code: Option<i32>,

    /// Claude Code session ID (for resuming)
    session_id: Option<String>,
}

impl ProcessBuffer {
    /// Create a new buffer for a process
    pub fn new(process_id: impl Into<String>) -> Self {
        let pid = process_id.into();
        debug!(process_id = %pid, "Creating new process buffer");

        Self {
            process_id: pid,
            raw_bytes: VecDeque::with_capacity(MAX_RAW_BUFFER_SIZE),
            total_bytes_received: 0,
            events: Vec::with_capacity(1000),
            next_event_sequence: 0,
            tool_states: HashMap::new(),
            next_tool_sequence: 0,
            status: ProcessStatus::Running,
            exit_code: None,
            session_id: None,
        }
    }

    /// Get the process ID
    pub fn process_id(&self) -> &str {
        &self.process_id
    }

    /// Get current status
    pub fn status(&self) -> &ProcessStatus {
        &self.status
    }

    /// Get exit code
    pub fn exit_code(&self) -> Option<i32> {
        self.exit_code
    }

    /// Get session ID
    pub fn session_id(&self) -> Option<&str> {
        self.session_id.as_deref()
    }

    /// Set session ID
    pub fn set_session_id(&mut self, session_id: impl Into<String>) {
        self.session_id = Some(session_id.into());
    }

    /// Set process status
    pub fn set_status(&mut self, status: ProcessStatus) {
        debug!(
            process_id = %self.process_id,
            old_status = %self.status,
            new_status = %status,
            "Process status changed"
        );
        self.status = status;
    }

    /// Set exit code and update status accordingly
    pub fn set_exit_code(&mut self, exit_code: i32) {
        self.exit_code = Some(exit_code);
        self.status = if exit_code == 0 {
            ProcessStatus::Completed
        } else {
            ProcessStatus::Failed
        };
        debug!(
            process_id = %self.process_id,
            exit_code = exit_code,
            status = %self.status,
            "Process completed"
        );
    }

    /// Mark process as killed
    pub fn mark_killed(&mut self) {
        self.status = ProcessStatus::Killed;
        debug!(process_id = %self.process_id, "Process killed");
    }

    /// Append raw bytes to the buffer
    ///
    /// Returns a list of newly parsed events and tool state changes
    pub fn append_raw(
        &mut self,
        bytes: &[u8],
    ) -> (Vec<serde_json::Value>, Vec<ToolState>) {
        trace!(
            process_id = %self.process_id,
            bytes_len = bytes.len(),
            "Appending raw bytes"
        );

        // Add to raw buffer, removing oldest bytes if over limit
        for &byte in bytes {
            if self.raw_bytes.len() >= MAX_RAW_BUFFER_SIZE {
                self.raw_bytes.pop_front();
            }
            self.raw_bytes.push_back(byte);
        }
        self.total_bytes_received += bytes.len();

        // Try to parse complete JSON lines
        self.parse_pending_lines()
    }

    /// Parse complete JSON lines from the pending buffer
    fn parse_pending_lines(&mut self) -> (Vec<serde_json::Value>, Vec<ToolState>) {
        let mut new_events = Vec::new();
        let mut changed_tools = Vec::new();

        // Add new bytes to pending line buffer
        // Note: raw_bytes already contains these, we're just scanning for newlines

        // Scan raw bytes for newlines and try to parse complete JSON objects
        let raw_bytes: Vec<u8> = self.raw_bytes.iter().copied().collect();
        let raw_str = String::from_utf8_lossy(&raw_bytes);

        // Split by newlines and try to parse each line
        for line in raw_str.lines() {
            // Strip ANSI escape codes before parsing JSON
            // PTY output may contain color codes like \x1b[32m which break JSON parsing
            let clean_line = strip_ansi_codes(line);
            let trimmed = clean_line.trim();
            if trimmed.is_empty() {
                continue;
            }

            // Try to parse as JSON
            if let Ok(value) = serde_json::from_str::<serde_json::Value>(trimmed) {
                // Check if this is a new event we haven't seen
                if !self.is_duplicate_event(&value) {
                    // Process the event for tool state tracking
                    if let Some(tool_change) = self.process_event_for_tools(&value) {
                        changed_tools.push(tool_change);
                    }

                    // Extract session ID if present
                    self.extract_session_id(&value);

                    // Add to events list
                    if self.events.len() >= MAX_EVENTS {
                        self.events.remove(0);
                    }
                    self.events.push(value.clone());
                    self.next_event_sequence += 1;
                    new_events.push(value);
                }
            }
        }

        if !new_events.is_empty() {
            trace!(
                process_id = %self.process_id,
                new_events_count = new_events.len(),
                changed_tools_count = changed_tools.len(),
                "Parsed new events"
            );
        }

        (new_events, changed_tools)
    }

    /// Check if we've already processed this event
    fn is_duplicate_event(&self, value: &serde_json::Value) -> bool {
        // Simple check: compare last few events
        let check_count = 10.min(self.events.len());
        for i in (self.events.len().saturating_sub(check_count))..self.events.len() {
            if &self.events[i] == value {
                return true;
            }
        }
        false
    }

    /// Process an event for tool state tracking
    fn process_event_for_tools(&mut self, event: &serde_json::Value) -> Option<ToolState> {
        // Claude Code stream-json format:
        // { "type": "assistant", "message": { "content": [...] } }
        // where content can contain { "type": "tool_use", "id": "...", "name": "...", "input": {...} }
        //
        // { "type": "user", "message": { "content": [...] } }
        // where content can contain { "type": "tool_result", "tool_use_id": "...", "content": "...", "is_error": false }

        let event_type = event.get("type")?.as_str()?;

        match event_type {
            "assistant" => {
                // Look for tool_use blocks in content
                let content = event.get("message")?.get("content")?.as_array()?;
                for block in content {
                    if block.get("type")?.as_str()? == "tool_use" {
                        let tool_id = block.get("id")?.as_str()?;
                        let tool_name = block.get("name")?.as_str()?;
                        let input = block.get("input").cloned();

                        // Create or update tool state
                        let seq = self.next_tool_sequence;
                        self.next_tool_sequence += 1;

                        let tool_state = ToolState::with_input(
                            tool_id,
                            tool_name,
                            input.unwrap_or(serde_json::Value::Null),
                            seq,
                        );
                        self.tool_states.insert(tool_id.to_string(), tool_state.clone());

                        debug!(
                            process_id = %self.process_id,
                            tool_id = tool_id,
                            tool_name = tool_name,
                            "Tool call started"
                        );

                        return Some(tool_state);
                    }
                }
            }
            "user" => {
                // Look for tool_result blocks in content
                let content = event.get("message")?.get("content")?.as_array()?;
                for block in content {
                    if block.get("type")?.as_str()? == "tool_result" {
                        let tool_use_id = block.get("tool_use_id")?.as_str()?;
                        let result_content = block
                            .get("content")
                            .and_then(|c| {
                                if c.is_string() {
                                    c.as_str().map(|s| s.to_string())
                                } else {
                                    Some(c.to_string())
                                }
                            })
                            .unwrap_or_default();
                        let is_error = block.get("is_error").and_then(|v| v.as_bool()).unwrap_or(false);

                        // Update tool state
                        if let Some(tool_state) = self.tool_states.get_mut(tool_use_id) {
                            if is_error {
                                tool_state.mark_error(&result_content);
                            } else {
                                tool_state.mark_complete(&result_content);
                            }

                            debug!(
                                process_id = %self.process_id,
                                tool_id = tool_use_id,
                                is_error = is_error,
                                "Tool call completed"
                            );

                            return Some(tool_state.clone());
                        } else {
                            warn!(
                                process_id = %self.process_id,
                                tool_use_id = tool_use_id,
                                "Tool result for unknown tool"
                            );
                        }
                    }
                }
            }
            _ => {}
        }

        None
    }

    /// Extract session ID from event if present
    fn extract_session_id(&mut self, event: &serde_json::Value) {
        // Session ID might be in init message or system event
        if let Some(session_id) = event
            .get("session_id")
            .or_else(|| event.get("sessionId"))
            .and_then(|v| v.as_str())
        {
            if self.session_id.is_none() {
                debug!(
                    process_id = %self.process_id,
                    session_id = session_id,
                    "Session ID extracted"
                );
                self.session_id = Some(session_id.to_string());
            }
        }
    }

    /// Get raw output as string from a specific offset
    pub fn get_raw_output_since(&self, offset: usize) -> String {
        let start = offset.saturating_sub(self.total_bytes_received.saturating_sub(self.raw_bytes.len()));
        let bytes: Vec<u8> = self.raw_bytes.iter().skip(start).copied().collect();
        String::from_utf8_lossy(&bytes).to_string()
    }

    /// Get all raw output as string
    pub fn get_raw_output(&self) -> String {
        let bytes: Vec<u8> = self.raw_bytes.iter().copied().collect();
        String::from_utf8_lossy(&bytes).to_string()
    }

    /// Get current raw output offset (total bytes received)
    pub fn raw_output_offset(&self) -> usize {
        self.total_bytes_received
    }

    /// Get all events
    pub fn events(&self) -> &[serde_json::Value] {
        &self.events
    }

    /// Get all tool states
    pub fn tool_states(&self) -> Vec<ToolState> {
        self.tool_states.values().cloned().collect()
    }

    /// Get a specific tool state
    pub fn get_tool_state(&self, tool_id: &str) -> Option<&ToolState> {
        self.tool_states.get(tool_id)
    }

    /// Get count of running tools
    pub fn running_tools_count(&self) -> usize {
        self.tool_states
            .values()
            .filter(|t| t.status == ToolStatus::Running)
            .count()
    }

    /// Create a snapshot of current state
    pub fn snapshot(&self) -> ProcessSnapshot {
        ProcessSnapshot::new(&self.process_id)
            .with_events(self.events.clone())
            .with_tool_states(self.tool_states())
            .with_raw_output(self.get_raw_output(), self.total_bytes_received)
    }

    /// Get snapshot with status
    pub fn full_snapshot(&self) -> ProcessSnapshot {
        let mut snapshot = self.snapshot();
        snapshot.status = self.status.clone();
        snapshot.exit_code = self.exit_code;
        snapshot.session_id = self.session_id.clone();
        snapshot
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_new_buffer() {
        let buffer = ProcessBuffer::new("test-123");
        assert_eq!(buffer.process_id(), "test-123");
        assert_eq!(buffer.status(), &ProcessStatus::Running);
        assert!(buffer.events().is_empty());
        assert!(buffer.tool_states().is_empty());
    }

    #[test]
    fn test_append_raw_simple() {
        let mut buffer = ProcessBuffer::new("test-123");
        let (events, _) = buffer.append_raw(b"some output\n");

        // Simple text shouldn't parse as JSON events
        assert!(events.is_empty());
        assert_eq!(buffer.raw_output_offset(), 12);
    }

    #[test]
    fn test_append_raw_json() {
        let mut buffer = ProcessBuffer::new("test-123");
        let json = r#"{"type": "system", "message": "hello"}
"#;
        let (events, _) = buffer.append_raw(json.as_bytes());

        assert_eq!(events.len(), 1);
        assert_eq!(events[0]["type"], "system");
    }

    #[test]
    fn test_tool_state_tracking() {
        let mut buffer = ProcessBuffer::new("test-123");

        // Simulate tool_use event
        let tool_use = r#"{"type": "assistant", "message": {"content": [{"type": "tool_use", "id": "tool-1", "name": "Read", "input": {"path": "/test.rs"}}]}}
"#;
        let (_, changed) = buffer.append_raw(tool_use.as_bytes());

        assert_eq!(changed.len(), 1);
        assert_eq!(changed[0].id, "tool-1");
        assert_eq!(changed[0].name, "Read");
        assert_eq!(changed[0].status, ToolStatus::Running);

        // Simulate tool_result event
        let tool_result = r#"{"type": "user", "message": {"content": [{"type": "tool_result", "tool_use_id": "tool-1", "content": "file contents", "is_error": false}]}}
"#;
        let (_, changed) = buffer.append_raw(tool_result.as_bytes());

        assert_eq!(changed.len(), 1);
        assert_eq!(changed[0].id, "tool-1");
        assert_eq!(changed[0].status, ToolStatus::Complete);
        assert!(!changed[0].is_error);
    }

    #[test]
    fn test_tool_error_tracking() {
        let mut buffer = ProcessBuffer::new("test-123");

        // Tool use
        let tool_use = r#"{"type": "assistant", "message": {"content": [{"type": "tool_use", "id": "tool-2", "name": "Write", "input": {}}]}}
"#;
        buffer.append_raw(tool_use.as_bytes());

        // Tool error
        let tool_result = r#"{"type": "user", "message": {"content": [{"type": "tool_result", "tool_use_id": "tool-2", "content": "Permission denied", "is_error": true}]}}
"#;
        let (_, changed) = buffer.append_raw(tool_result.as_bytes());

        assert_eq!(changed.len(), 1);
        assert_eq!(changed[0].status, ToolStatus::Error);
        assert!(changed[0].is_error);
    }

    #[test]
    fn test_set_exit_code() {
        let mut buffer = ProcessBuffer::new("test-123");

        buffer.set_exit_code(0);
        assert_eq!(buffer.status(), &ProcessStatus::Completed);
        assert_eq!(buffer.exit_code(), Some(0));

        let mut buffer2 = ProcessBuffer::new("test-456");
        buffer2.set_exit_code(1);
        assert_eq!(buffer2.status(), &ProcessStatus::Failed);
        assert_eq!(buffer2.exit_code(), Some(1));
    }

    #[test]
    fn test_snapshot() {
        let mut buffer = ProcessBuffer::new("test-123");
        buffer.append_raw(b"raw output\n");
        buffer.set_session_id("session-abc");

        let snapshot = buffer.full_snapshot();

        assert_eq!(snapshot.process_id, "test-123");
        assert_eq!(snapshot.status, ProcessStatus::Running);
        assert_eq!(snapshot.session_id, Some("session-abc".to_string()));
        assert!(snapshot.raw_output.contains("raw output"));
    }

    #[test]
    fn test_duplicate_event_detection() {
        let mut buffer = ProcessBuffer::new("test-123");

        let json = r#"{"type": "system", "message": "hello"}
"#;
        let (events1, _) = buffer.append_raw(json.as_bytes());
        assert_eq!(events1.len(), 1);

        // Same event again should be deduplicated
        let (events2, _) = buffer.append_raw(json.as_bytes());
        assert_eq!(events2.len(), 0);
    }

    #[test]
    fn test_ansi_code_stripping() {
        let mut buffer = ProcessBuffer::new("test-123");

        // Simulate JSON with ANSI escape codes (like PTY output from Claude Code)
        // Green color code \x1b[32m followed by JSON and reset \x1b[0m
        let json_with_ansi = b"\x1b[32m{\"type\": \"system\", \"subtype\": \"init\"}\x1b[0m\n";
        let (events, _) = buffer.append_raw(json_with_ansi);

        assert_eq!(events.len(), 1);
        assert_eq!(events[0]["type"], "system");
        assert_eq!(events[0]["subtype"], "init");
    }

    #[test]
    fn test_ansi_code_stripping_complex() {
        let mut buffer = ProcessBuffer::new("test-123");

        // More complex ANSI sequences (bold, cursor movement, etc.)
        let complex_ansi = b"\x1b[1;32m\x1b[K{\"type\": \"assistant\", \"message\": {\"content\": [{\"type\": \"text\", \"text\": \"Hello\"}]}}\x1b[0m\r\n";
        let (events, _) = buffer.append_raw(complex_ansi);

        assert_eq!(events.len(), 1);
        assert_eq!(events[0]["type"], "assistant");
    }
}
