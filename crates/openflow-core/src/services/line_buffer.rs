//! Line Buffer Service
//!
//! Accumulates raw bytes from PTY, handles incomplete lines, strips ANSI codes,
//! and manages UTF-8 boundaries.
//!
//! This is a focused component for byte-to-line conversion, separate from parsing
//! and event handling logic.

use regex::Regex;
use std::collections::VecDeque;
use std::sync::LazyLock;
use tracing::{debug, trace, warn};

use crate::services::ServiceError;

/// Default maximum size of line buffer (10MB)
pub const DEFAULT_MAX_BUFFER_SIZE: usize = 10 * 1024 * 1024;

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
pub fn strip_ansi_codes(s: &str) -> String {
    ANSI_REGEX.replace_all(s, "").to_string()
}

/// Configuration for LineBuffer
#[derive(Debug, Clone)]
pub struct LineBufferConfig {
    /// Maximum buffer size in bytes
    pub max_buffer_size: usize,
    /// Whether to strip ANSI codes automatically
    pub strip_ansi: bool,
}

impl Default for LineBufferConfig {
    fn default() -> Self {
        Self {
            max_buffer_size: DEFAULT_MAX_BUFFER_SIZE,
            strip_ansi: true,
        }
    }
}

/// LineBuffer accumulates raw bytes and extracts complete lines
///
/// Key features:
/// - Handles incomplete lines at chunk boundaries
/// - Strips ANSI escape codes
/// - Handles multi-byte UTF-8 characters at chunk boundaries
/// - Configurable max buffer size with overflow handling
#[derive(Debug)]
pub struct LineBuffer {
    /// Pending incomplete line bytes
    pending_bytes: VecDeque<u8>,
    
    /// Configuration
    config: LineBufferConfig,
    
    /// Total bytes received (for tracking)
    total_bytes_received: usize,
    
    /// Number of lines extracted
    lines_extracted: usize,
    
    /// Number of bytes discarded due to overflow
    bytes_discarded: usize,
}

impl LineBuffer {
    /// Create a new LineBuffer with default configuration
    pub fn new() -> Self {
        Self::with_config(LineBufferConfig::default())
    }
    
    /// Create a new LineBuffer with custom configuration
    pub fn with_config(config: LineBufferConfig) -> Self {
        debug!(
            max_buffer_size = config.max_buffer_size,
            strip_ansi = config.strip_ansi,
            "Creating LineBuffer"
        );
        
        Self {
            pending_bytes: VecDeque::with_capacity(8192), // Start with reasonable capacity
            config,
            total_bytes_received: 0,
            lines_extracted: 0,
            bytes_discarded: 0,
        }
    }
    
    /// Add bytes to the buffer and extract complete lines
    ///
    /// Returns a vector of complete lines (without newline terminators).
    /// Incomplete lines remain buffered until a newline is received.
    pub fn add_bytes(&mut self, bytes: &[u8]) -> Result<Vec<String>, ServiceError> {
        trace!(bytes_len = bytes.len(), "Adding bytes to line buffer");
        
        self.total_bytes_received += bytes.len();
        
        // Add bytes to pending buffer
        for &byte in bytes {
            self.pending_bytes.push_back(byte);
        }
        
        // Check for overflow and handle it
        if self.pending_bytes.len() > self.config.max_buffer_size {
            self.handle_overflow()?;
        }
        
        // Extract complete lines
        self.extract_lines()
    }
    
    /// Handle buffer overflow by discarding oldest data
    fn handle_overflow(&mut self) -> Result<(), ServiceError> {
        let overflow = self.pending_bytes.len() - self.config.max_buffer_size;
        
        warn!(
            overflow_bytes = overflow,
            max_size = self.config.max_buffer_size,
            "Line buffer overflow, discarding oldest bytes"
        );
        
        // Discard oldest bytes
        for _ in 0..overflow {
            self.pending_bytes.pop_front();
            self.bytes_discarded += 1;
        }
        
        Ok(())
    }
    
    /// Extract complete lines from pending buffer
    fn extract_lines(&mut self) -> Result<Vec<String>, ServiceError> {
        let mut lines = Vec::new();
        
        loop {
            // Find newline position
            let newline_pos = self.find_newline_position();
            
            match newline_pos {
                Some(pos) => {
                    // Extract line up to newline
                    let line = self.extract_line_at(pos)?;
                    if let Some(line_str) = line {
                        lines.push(line_str);
                        self.lines_extracted += 1;
                    }
                }
                None => {
                    // No complete line available
                    break;
                }
            }
        }
        
        if !lines.is_empty() {
            trace!(lines_count = lines.len(), "Extracted complete lines");
        }
        
        Ok(lines)
    }
    
    /// Find the position of the next newline character
    fn find_newline_position(&self) -> Option<usize> {
        for (i, &byte) in self.pending_bytes.iter().enumerate() {
            if byte == b'\n' {
                return Some(i);
            }
        }
        None
    }
    
    /// Extract line at the given position and remove it from buffer
    fn extract_line_at(&mut self, newline_pos: usize) -> Result<Option<String>, ServiceError> {
        // Collect bytes up to (but not including) newline
        let mut line_bytes = Vec::with_capacity(newline_pos);
        for _ in 0..newline_pos {
            if let Some(byte) = self.pending_bytes.pop_front() {
                line_bytes.push(byte);
            }
        }
        
        // Remove the newline itself
        self.pending_bytes.pop_front();
        
        // Handle carriage return if present (CRLF line endings)
        if !line_bytes.is_empty() && line_bytes[line_bytes.len() - 1] == b'\r' {
            line_bytes.pop();
        }
        
        // Convert to UTF-8 string
        // Use from_utf8_lossy to handle invalid UTF-8 gracefully
        let mut line_str = String::from_utf8_lossy(&line_bytes).to_string();
        
        // Strip ANSI codes if configured
        if self.config.strip_ansi {
            line_str = strip_ansi_codes(&line_str);
        }
        
        // Skip empty lines
        if line_str.trim().is_empty() {
            return Ok(None);
        }
        
        Ok(Some(line_str))
    }
    
    /// Get any remaining partial line (useful for flushing at end of stream)
    ///
    /// This extracts any buffered bytes even if they don't end with a newline.
    /// The buffer is cleared after this operation.
    pub fn flush(&mut self) -> Result<Option<String>, ServiceError> {
        if self.pending_bytes.is_empty() {
            return Ok(None);
        }
        
        debug!(
            pending_bytes = self.pending_bytes.len(),
            "Flushing incomplete line from buffer"
        );
        
        // Collect all remaining bytes
        let line_bytes: Vec<u8> = self.pending_bytes.drain(..).collect();
        
        // Convert to UTF-8 string
        let mut line_str = String::from_utf8_lossy(&line_bytes).to_string();
        
        // Strip ANSI codes if configured
        if self.config.strip_ansi {
            line_str = strip_ansi_codes(&line_str);
        }
        
        // Strip trailing carriage return if present
        if line_str.ends_with('\r') {
            line_str.pop();
        }
        
        if line_str.trim().is_empty() {
            return Ok(None);
        }
        
        Ok(Some(line_str))
    }
    
    /// Get statistics about buffer usage
    pub fn stats(&self) -> LineBufferStats {
        LineBufferStats {
            total_bytes_received: self.total_bytes_received,
            pending_bytes: self.pending_bytes.len(),
            lines_extracted: self.lines_extracted,
            bytes_discarded: self.bytes_discarded,
        }
    }
    
    /// Clear the buffer
    pub fn clear(&mut self) {
        self.pending_bytes.clear();
    }
    
    /// Check if buffer has pending data
    pub fn has_pending(&self) -> bool {
        !self.pending_bytes.is_empty()
    }
    
    /// Get the number of pending bytes
    pub fn pending_len(&self) -> usize {
        self.pending_bytes.len()
    }
}

impl Default for LineBuffer {
    fn default() -> Self {
        Self::new()
    }
}

/// Statistics about LineBuffer usage
#[derive(Debug, Clone)]
pub struct LineBufferStats {
    /// Total bytes received
    pub total_bytes_received: usize,
    /// Bytes currently pending in buffer
    pub pending_bytes: usize,
    /// Number of lines extracted
    pub lines_extracted: usize,
    /// Number of bytes discarded due to overflow
    pub bytes_discarded: usize,
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_simple_line() {
        let mut buffer = LineBuffer::new();
        let lines = buffer.add_bytes(b"hello world\n").unwrap();
        
        assert_eq!(lines.len(), 1);
        assert_eq!(lines[0], "hello world");
    }
    
    #[test]
    fn test_multiple_lines() {
        let mut buffer = LineBuffer::new();
        let lines = buffer.add_bytes(b"line1\nline2\nline3\n").unwrap();
        
        assert_eq!(lines.len(), 3);
        assert_eq!(lines[0], "line1");
        assert_eq!(lines[1], "line2");
        assert_eq!(lines[2], "line3");
    }
    
    #[test]
    fn test_incomplete_line() {
        let mut buffer = LineBuffer::new();
        
        // First chunk - incomplete line
        let lines1 = buffer.add_bytes(b"hello ").unwrap();
        assert_eq!(lines1.len(), 0);
        assert!(buffer.has_pending());
        
        // Second chunk - completes the line
        let lines2 = buffer.add_bytes(b"world\n").unwrap();
        assert_eq!(lines2.len(), 1);
        assert_eq!(lines2[0], "hello world");
        assert!(!buffer.has_pending());
    }
    
    #[test]
    fn test_crlf_line_endings() {
        let mut buffer = LineBuffer::new();
        let lines = buffer.add_bytes(b"line1\r\nline2\r\n").unwrap();
        
        assert_eq!(lines.len(), 2);
        assert_eq!(lines[0], "line1");
        assert_eq!(lines[1], "line2");
    }
    
    #[test]
    fn test_ansi_code_stripping() {
        let mut buffer = LineBuffer::new();
        
        // Green color code around text
        let input = b"\x1b[32mhello\x1b[0m world\n";
        let lines = buffer.add_bytes(input).unwrap();
        
        assert_eq!(lines.len(), 1);
        assert_eq!(lines[0], "hello world");
        assert!(!lines[0].contains("\x1b"));
    }
    
    #[test]
    fn test_ansi_codes_with_json() {
        let mut buffer = LineBuffer::new();
        
        // Simulated PTY output with ANSI codes around JSON
        let input = b"\x1b[32m{\"type\": \"test\", \"value\": 123}\x1b[0m\n";
        let lines = buffer.add_bytes(input).unwrap();
        
        assert_eq!(lines.len(), 1);
        // Should be valid JSON after ANSI stripping
        let parsed: serde_json::Value = serde_json::from_str(&lines[0]).unwrap();
        assert_eq!(parsed["type"], "test");
        assert_eq!(parsed["value"], 123);
    }
    
    #[test]
    fn test_utf8_boundaries() {
        let mut buffer = LineBuffer::new();
        
        // Multi-byte UTF-8 character (emoji) split across chunks
        let emoji = "Hello 👋 World\n";
        let bytes = emoji.as_bytes();
        
        // Split in the middle of the emoji
        let split_point = 8; // Splits the 4-byte emoji
        let lines1 = buffer.add_bytes(&bytes[..split_point]).unwrap();
        assert_eq!(lines1.len(), 0); // No complete line yet
        
        let lines2 = buffer.add_bytes(&bytes[split_point..]).unwrap();
        assert_eq!(lines2.len(), 1);
        assert!(lines2[0].contains("👋")); // UTF-8 handled correctly
    }
    
    #[test]
    fn test_empty_lines_skipped() {
        let mut buffer = LineBuffer::new();
        let lines = buffer.add_bytes(b"line1\n\n\nline2\n").unwrap();
        
        // Empty lines should be skipped
        assert_eq!(lines.len(), 2);
        assert_eq!(lines[0], "line1");
        assert_eq!(lines[1], "line2");
    }
    
    #[test]
    fn test_flush_incomplete() {
        let mut buffer = LineBuffer::new();
        
        // Add incomplete line
        buffer.add_bytes(b"incomplete").unwrap();
        assert!(buffer.has_pending());
        
        // Flush should return the incomplete line
        let flushed = buffer.flush().unwrap();
        assert_eq!(flushed, Some("incomplete".to_string()));
        assert!(!buffer.has_pending());
    }
    
    #[test]
    fn test_buffer_overflow() {
        let config = LineBufferConfig {
            max_buffer_size: 100,
            strip_ansi: true,
        };
        let mut buffer = LineBuffer::with_config(config);
        
        // Add more than max_buffer_size without newlines
        let large_chunk = vec![b'x'; 150];
        let result = buffer.add_bytes(&large_chunk);
        
        assert!(result.is_ok());
        assert!(buffer.stats().bytes_discarded > 0);
        assert!(buffer.pending_len() <= 100);
    }
    
    #[test]
    fn test_stats() {
        let mut buffer = LineBuffer::new();
        
        buffer.add_bytes(b"line1\n").unwrap();
        buffer.add_bytes(b"line2\n").unwrap();
        buffer.add_bytes(b"partial").unwrap();
        
        let stats = buffer.stats();
        assert_eq!(stats.total_bytes_received, 6 + 6 + 7);
        assert_eq!(stats.lines_extracted, 2);
        assert!(stats.pending_bytes > 0);
    }
    
    #[test]
    fn test_clear() {
        let mut buffer = LineBuffer::new();
        buffer.add_bytes(b"some data").unwrap();
        assert!(buffer.has_pending());
        
        buffer.clear();
        assert!(!buffer.has_pending());
        assert_eq!(buffer.pending_len(), 0);
    }
    
    #[test]
    fn test_no_ansi_stripping() {
        let config = LineBufferConfig {
            max_buffer_size: DEFAULT_MAX_BUFFER_SIZE,
            strip_ansi: false,
        };
        let mut buffer = LineBuffer::with_config(config);
        
        let input = b"\x1b[32mcolored\x1b[0m\n";
        let lines = buffer.add_bytes(input).unwrap();
        
        assert_eq!(lines.len(), 1);
        // ANSI codes should be preserved
        assert!(lines[0].contains("\x1b"));
    }
    
    #[test]
    fn test_complex_ansi_sequences() {
        let mut buffer = LineBuffer::new();
        
        // Complex ANSI with cursor movement, colors, bold
        let input = b"\x1b[1;32m\x1b[K\x1b[2Jtext content\x1b[0m\n";
        let lines = buffer.add_bytes(input).unwrap();
        
        assert_eq!(lines.len(), 1);
        assert_eq!(lines[0], "text content");
    }
    
    #[test]
    fn test_incremental_json_parsing() {
        let mut buffer = LineBuffer::new();
        
        // Simulate JSON arriving in chunks (common in streaming scenarios)
        let json = r#"{"type": "message", "content": "hello world"}"#;
        let full_line = format!("{}\n", json);
        
        for chunk in full_line.as_bytes().chunks(10) {
            buffer.add_bytes(chunk).unwrap();
        }
        
        // Should have exactly one complete line
        let stats = buffer.stats();
        assert_eq!(stats.lines_extracted, 1);
    }
}

