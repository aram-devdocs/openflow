//! Output streaming module.
//!
//! Provides functionality for streaming process output to the frontend
//! via Tauri events. This module handles real-time output streaming from
//! CLI tools (Claude Code, Gemini CLI, etc.) to the OpenFlow UI.
//!
//! # Features
//!
//! - Line-buffered and raw streaming modes
//! - Async streaming with tokio
//! - Automatic event emission to frontend
//! - Output aggregation for non-streaming use cases
//! - Buffer management for efficient memory usage
//!
//! # Usage
//!
//! ```ignore
//! use crate::process::output::{OutputStreamer, stream_output};
//!
//! // Create a streamer for a process
//! let streamer = OutputStreamer::for_process("process-123");
//!
//! // Stream stdout to frontend
//! stream_output("process-123", reader, OutputType::Stdout, &app_handle)?;
//! ```

use chrono::Utc;
use std::io::{BufRead, BufReader, Read};
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Arc;
use tauri::{AppHandle, Emitter, Runtime};
use thiserror::Error;
use tokio::sync::mpsc;

use crate::types::{OutputType, ProcessOutputEvent};

/// Default buffer size for reading output (8KB).
const DEFAULT_BUFFER_SIZE: usize = 8192;

/// Maximum line length before truncation.
const MAX_LINE_LENGTH: usize = 65536;

/// Errors that can occur during output streaming.
#[derive(Debug, Error)]
pub enum OutputError {
    #[error("Failed to read output: {0}")]
    ReadFailed(#[from] std::io::Error),

    #[error("Failed to emit event: {0}")]
    EmitFailed(String),

    #[error("Stream already closed")]
    StreamClosed,

    #[error("Channel send error")]
    ChannelError,

    #[error("Buffer overflow: line exceeds maximum length")]
    BufferOverflow,
}

/// Result type for output operations.
pub type OutputResult<T> = Result<T, OutputError>;

/// Configuration for output streaming.
#[derive(Debug, Clone)]
pub struct OutputConfig {
    /// Process ID for event channel naming.
    pub process_id: String,
    /// Buffer size for reading output.
    pub buffer_size: usize,
    /// Whether to emit line-by-line or buffered.
    pub line_buffered: bool,
    /// Maximum line length before truncation (0 = no limit).
    pub max_line_length: usize,
    /// Whether to include timestamps in events.
    pub include_timestamps: bool,
}

impl Default for OutputConfig {
    fn default() -> Self {
        Self {
            process_id: String::new(),
            buffer_size: DEFAULT_BUFFER_SIZE,
            line_buffered: true,
            max_line_length: MAX_LINE_LENGTH,
            include_timestamps: true,
        }
    }
}

/// Output streamer for sending process output to the frontend.
///
/// This struct manages the streaming of process output to the frontend
/// via Tauri's event system. It supports both line-buffered and raw
/// streaming modes.
pub struct OutputStreamer {
    config: OutputConfig,
    /// Flag to signal stream cancellation.
    cancelled: Arc<AtomicBool>,
}

impl OutputStreamer {
    /// Create a new output streamer with the given configuration.
    pub fn new(config: OutputConfig) -> Self {
        Self {
            config,
            cancelled: Arc::new(AtomicBool::new(false)),
        }
    }

    /// Create a streamer for a specific process ID.
    pub fn for_process(process_id: &str) -> Self {
        Self::new(OutputConfig {
            process_id: process_id.to_string(),
            ..Default::default()
        })
    }

    /// Create a streamer with custom buffer size.
    pub fn with_buffer_size(process_id: &str, buffer_size: usize) -> Self {
        Self::new(OutputConfig {
            process_id: process_id.to_string(),
            buffer_size,
            ..Default::default()
        })
    }

    /// Get the event channel name for this streamer.
    pub fn event_channel(&self) -> String {
        format!("process-output-{}", self.config.process_id)
    }

    /// Get the status event channel name.
    pub fn status_channel(&self) -> String {
        format!("process-status-{}", self.config.process_id)
    }

    /// Get a handle to cancel the stream.
    pub fn cancel_handle(&self) -> Arc<AtomicBool> {
        Arc::clone(&self.cancelled)
    }

    /// Cancel the stream.
    pub fn cancel(&self) {
        self.cancelled.store(true, Ordering::SeqCst);
    }

    /// Check if the stream is cancelled.
    pub fn is_cancelled(&self) -> bool {
        self.cancelled.load(Ordering::SeqCst)
    }

    /// Stream output from a reader to the frontend synchronously.
    ///
    /// This method reads from the given reader and emits events to the
    /// frontend via Tauri's event system.
    ///
    /// # Arguments
    ///
    /// * `reader` - The reader to stream from (stdout or stderr)
    /// * `output_type` - The type of output (stdout or stderr)
    /// * `app_handle` - Tauri app handle for emitting events
    ///
    /// # Type Parameters
    ///
    /// * `R` - The reader type (must implement Read)
    /// * `T` - The Tauri runtime type
    pub fn stream_sync<R, T>(
        &self,
        reader: R,
        output_type: OutputType,
        app_handle: &AppHandle<T>,
    ) -> OutputResult<()>
    where
        R: Read,
        T: Runtime,
    {
        let buf_reader = BufReader::with_capacity(self.config.buffer_size, reader);
        let channel = self.event_channel();

        if self.config.line_buffered {
            self.stream_lines(buf_reader, output_type, app_handle, &channel)
        } else {
            self.stream_raw(buf_reader, output_type, app_handle, &channel)
        }
    }

    /// Stream output line by line.
    fn stream_lines<R, T>(
        &self,
        reader: BufReader<R>,
        output_type: OutputType,
        app_handle: &AppHandle<T>,
        channel: &str,
    ) -> OutputResult<()>
    where
        R: Read,
        T: Runtime,
    {
        for line in reader.lines() {
            // Check for cancellation
            if self.is_cancelled() {
                break;
            }

            let mut content = line?;

            // Truncate long lines if configured
            if self.config.max_line_length > 0 && content.len() > self.config.max_line_length {
                content.truncate(self.config.max_line_length);
                content.push_str("... [truncated]");
            }

            let event = self.create_event(content, output_type.clone());

            app_handle
                .emit(channel, &event)
                .map_err(|e| OutputError::EmitFailed(e.to_string()))?;
        }

        Ok(())
    }

    /// Stream raw output in chunks.
    fn stream_raw<R, T>(
        &self,
        mut reader: BufReader<R>,
        output_type: OutputType,
        app_handle: &AppHandle<T>,
        channel: &str,
    ) -> OutputResult<()>
    where
        R: Read,
        T: Runtime,
    {
        let mut buffer = vec![0u8; self.config.buffer_size];

        loop {
            // Check for cancellation
            if self.is_cancelled() {
                break;
            }

            let bytes_read = reader.read(&mut buffer)?;
            if bytes_read == 0 {
                break;
            }

            let content = String::from_utf8_lossy(&buffer[..bytes_read]).to_string();
            let event = self.create_event(content, output_type.clone());

            app_handle
                .emit(channel, &event)
                .map_err(|e| OutputError::EmitFailed(e.to_string()))?;
        }

        Ok(())
    }

    /// Create an output event.
    fn create_event(&self, content: String, output_type: OutputType) -> ProcessOutputEvent {
        ProcessOutputEvent {
            process_id: self.config.process_id.clone(),
            content,
            output_type,
            timestamp: if self.config.include_timestamps {
                Utc::now().to_rfc3339()
            } else {
                String::new()
            },
        }
    }
}

/// Stream output from a reader to the frontend.
///
/// This is a convenience function that creates an OutputStreamer and
/// streams the output. Use this for simple streaming scenarios.
///
/// # Arguments
///
/// * `process_id` - The process ID for event naming
/// * `reader` - The reader to stream from
/// * `output_type` - The type of output (stdout or stderr)
/// * `app_handle` - Tauri app handle for emitting events
///
/// # Example
///
/// ```ignore
/// use std::process::{Command, Stdio};
/// use crate::process::output::{stream_output, OutputType};
///
/// let mut child = Command::new("echo")
///     .arg("hello")
///     .stdout(Stdio::piped())
///     .spawn()?;
///
/// let stdout = child.stdout.take().unwrap();
/// stream_output("process-123", stdout, OutputType::Stdout, &app_handle)?;
/// ```
pub fn stream_output<R, T>(
    process_id: &str,
    reader: R,
    output_type: OutputType,
    app_handle: &AppHandle<T>,
) -> OutputResult<()>
where
    R: Read,
    T: Runtime,
{
    let streamer = OutputStreamer::for_process(process_id);
    streamer.stream_sync(reader, output_type, app_handle)
}

/// Stream output with custom buffer size.
pub fn stream_output_buffered<R, T>(
    process_id: &str,
    reader: R,
    output_type: OutputType,
    app_handle: &AppHandle<T>,
    buffer_size: usize,
) -> OutputResult<()>
where
    R: Read,
    T: Runtime,
{
    let streamer = OutputStreamer::with_buffer_size(process_id, buffer_size);
    streamer.stream_sync(reader, output_type, app_handle)
}

/// Output buffer for collecting and batching output.
///
/// This is useful when you want to batch multiple output chunks
/// before emitting them as a single event.
#[derive(Debug)]
pub struct OutputBuffer {
    /// Buffer for stdout content.
    stdout_buffer: Vec<String>,
    /// Buffer for stderr content.
    stderr_buffer: Vec<String>,
    /// Maximum buffer size before automatic flush.
    max_size: usize,
    /// Current total size in bytes.
    current_size: usize,
}

impl OutputBuffer {
    /// Create a new output buffer with the given max size.
    pub fn new(max_size: usize) -> Self {
        Self {
            stdout_buffer: Vec::new(),
            stderr_buffer: Vec::new(),
            max_size,
            current_size: 0,
        }
    }

    /// Create a buffer with default size (64KB).
    pub fn with_default_size() -> Self {
        Self::new(65536)
    }

    /// Add stdout content to the buffer.
    ///
    /// Returns true if the buffer should be flushed.
    pub fn add_stdout(&mut self, content: String) -> bool {
        self.current_size += content.len();
        self.stdout_buffer.push(content);
        self.should_flush()
    }

    /// Add stderr content to the buffer.
    ///
    /// Returns true if the buffer should be flushed.
    pub fn add_stderr(&mut self, content: String) -> bool {
        self.current_size += content.len();
        self.stderr_buffer.push(content);
        self.should_flush()
    }

    /// Check if the buffer should be flushed.
    pub fn should_flush(&self) -> bool {
        self.current_size >= self.max_size
    }

    /// Flush stdout buffer and return contents.
    pub fn flush_stdout(&mut self) -> String {
        let content = self.stdout_buffer.join("");
        self.current_size -= content.len();
        self.stdout_buffer.clear();
        content
    }

    /// Flush stderr buffer and return contents.
    pub fn flush_stderr(&mut self) -> String {
        let content = self.stderr_buffer.join("");
        self.current_size -= content.len();
        self.stderr_buffer.clear();
        content
    }

    /// Flush all buffers and return (stdout, stderr).
    pub fn flush_all(&mut self) -> (String, String) {
        (self.flush_stdout(), self.flush_stderr())
    }

    /// Check if the buffer is empty.
    pub fn is_empty(&self) -> bool {
        self.stdout_buffer.is_empty() && self.stderr_buffer.is_empty()
    }

    /// Get the current buffer size in bytes.
    pub fn size(&self) -> usize {
        self.current_size
    }
}

impl Default for OutputBuffer {
    fn default() -> Self {
        Self::with_default_size()
    }
}

/// Aggregator for collecting process output.
///
/// This is useful for capturing output when you don't need real-time streaming.
#[derive(Debug, Default)]
pub struct OutputAggregator {
    stdout: Vec<String>,
    stderr: Vec<String>,
}

impl OutputAggregator {
    /// Create a new output aggregator.
    pub fn new() -> Self {
        Self::default()
    }

    /// Add stdout content.
    pub fn add_stdout(&mut self, content: String) {
        self.stdout.push(content);
    }

    /// Add stderr content.
    pub fn add_stderr(&mut self, content: String) {
        self.stderr.push(content);
    }

    /// Get all stdout content joined by newlines.
    pub fn stdout(&self) -> String {
        self.stdout.join("\n")
    }

    /// Get all stderr content joined by newlines.
    pub fn stderr(&self) -> String {
        self.stderr.join("\n")
    }

    /// Get all output (stdout + stderr) joined by newlines.
    pub fn all_output(&self) -> String {
        let mut output = self.stdout.clone();
        output.extend(self.stderr.clone());
        output.join("\n")
    }

    /// Get the number of stdout lines.
    pub fn stdout_count(&self) -> usize {
        self.stdout.len()
    }

    /// Get the number of stderr lines.
    pub fn stderr_count(&self) -> usize {
        self.stderr.len()
    }

    /// Clear all collected output.
    pub fn clear(&mut self) {
        self.stdout.clear();
        self.stderr.clear();
    }
}

/// Channel-based output collector for async scenarios.
///
/// This collector uses channels to receive output events and
/// can be used with async code.
pub struct OutputCollector {
    /// Sender for output events.
    sender: mpsc::UnboundedSender<ProcessOutputEvent>,
    /// Receiver for output events.
    receiver: mpsc::UnboundedReceiver<ProcessOutputEvent>,
}

impl OutputCollector {
    /// Create a new output collector.
    pub fn new() -> Self {
        let (sender, receiver) = mpsc::unbounded_channel();
        Self { sender, receiver }
    }

    /// Get a sender for sending output events.
    pub fn sender(&self) -> mpsc::UnboundedSender<ProcessOutputEvent> {
        self.sender.clone()
    }

    /// Take the receiver (can only be called once).
    pub fn take_receiver(&mut self) -> mpsc::UnboundedReceiver<ProcessOutputEvent> {
        let (_, new_receiver) = mpsc::unbounded_channel();
        std::mem::replace(&mut self.receiver, new_receiver)
    }

    /// Send an output event.
    pub fn send(&self, event: ProcessOutputEvent) -> Result<(), OutputError> {
        self.sender
            .send(event)
            .map_err(|_| OutputError::ChannelError)
    }

    /// Create an event and send it.
    pub fn emit(
        &self,
        process_id: &str,
        content: String,
        output_type: OutputType,
    ) -> Result<(), OutputError> {
        let event = ProcessOutputEvent {
            process_id: process_id.to_string(),
            content,
            output_type,
            timestamp: Utc::now().to_rfc3339(),
        };
        self.send(event)
    }
}

impl Default for OutputCollector {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::io::Cursor;

    #[test]
    fn test_output_config_default() {
        let config = OutputConfig::default();
        assert!(config.process_id.is_empty());
        assert_eq!(config.buffer_size, DEFAULT_BUFFER_SIZE);
        assert!(config.line_buffered);
        assert_eq!(config.max_line_length, MAX_LINE_LENGTH);
        assert!(config.include_timestamps);
    }

    #[test]
    fn test_output_streamer_event_channel() {
        let streamer = OutputStreamer::for_process("test-123");
        assert_eq!(streamer.event_channel(), "process-output-test-123");
    }

    #[test]
    fn test_output_streamer_status_channel() {
        let streamer = OutputStreamer::for_process("test-123");
        assert_eq!(streamer.status_channel(), "process-status-test-123");
    }

    #[test]
    fn test_output_streamer_with_buffer_size() {
        let streamer = OutputStreamer::with_buffer_size("test-456", 4096);
        assert_eq!(streamer.config.buffer_size, 4096);
        assert_eq!(streamer.config.process_id, "test-456");
    }

    #[test]
    fn test_output_streamer_cancellation() {
        let streamer = OutputStreamer::for_process("test-cancel");
        assert!(!streamer.is_cancelled());

        streamer.cancel();
        assert!(streamer.is_cancelled());
    }

    #[test]
    fn test_output_streamer_cancel_handle() {
        let streamer = OutputStreamer::for_process("test-handle");
        let handle = streamer.cancel_handle();

        assert!(!handle.load(Ordering::SeqCst));
        handle.store(true, Ordering::SeqCst);
        assert!(streamer.is_cancelled());
    }

    #[test]
    fn test_output_buffer_new() {
        let buffer = OutputBuffer::new(1024);
        assert!(buffer.is_empty());
        assert_eq!(buffer.size(), 0);
    }

    #[test]
    fn test_output_buffer_add_stdout() {
        let mut buffer = OutputBuffer::new(100);
        let should_flush = buffer.add_stdout("hello".to_string());
        assert!(!should_flush);
        assert!(!buffer.is_empty());
        assert_eq!(buffer.size(), 5);
    }

    #[test]
    fn test_output_buffer_flush() {
        let mut buffer = OutputBuffer::new(100);
        buffer.add_stdout("hello ".to_string());
        buffer.add_stdout("world".to_string());

        let content = buffer.flush_stdout();
        assert_eq!(content, "hello world");
        assert!(buffer.stdout_buffer.is_empty());
    }

    #[test]
    fn test_output_buffer_should_flush() {
        let mut buffer = OutputBuffer::new(10);
        buffer.add_stdout("12345".to_string());
        assert!(!buffer.should_flush());

        buffer.add_stdout("67890".to_string());
        assert!(buffer.should_flush());
    }

    #[test]
    fn test_output_buffer_flush_all() {
        let mut buffer = OutputBuffer::new(100);
        buffer.add_stdout("stdout".to_string());
        buffer.add_stderr("stderr".to_string());

        let (stdout, stderr) = buffer.flush_all();
        assert_eq!(stdout, "stdout");
        assert_eq!(stderr, "stderr");
        assert!(buffer.is_empty());
    }

    #[test]
    fn test_output_aggregator() {
        let mut aggregator = OutputAggregator::new();
        aggregator.add_stdout("line 1".to_string());
        aggregator.add_stdout("line 2".to_string());
        aggregator.add_stderr("error".to_string());

        assert_eq!(aggregator.stdout(), "line 1\nline 2");
        assert_eq!(aggregator.stderr(), "error");
        assert_eq!(aggregator.stdout_count(), 2);
        assert_eq!(aggregator.stderr_count(), 1);
    }

    #[test]
    fn test_output_aggregator_all_output() {
        let mut aggregator = OutputAggregator::new();
        aggregator.add_stdout("out".to_string());
        aggregator.add_stderr("err".to_string());

        let output = aggregator.all_output();
        assert!(output.contains("out"));
        assert!(output.contains("err"));
    }

    #[test]
    fn test_output_aggregator_clear() {
        let mut aggregator = OutputAggregator::new();
        aggregator.add_stdout("test".to_string());
        aggregator.add_stderr("test".to_string());

        aggregator.clear();
        assert_eq!(aggregator.stdout_count(), 0);
        assert_eq!(aggregator.stderr_count(), 0);
    }

    #[test]
    fn test_output_collector_new() {
        let collector = OutputCollector::new();
        let sender = collector.sender();

        let event = ProcessOutputEvent {
            process_id: "test".to_string(),
            content: "hello".to_string(),
            output_type: OutputType::Stdout,
            timestamp: Utc::now().to_rfc3339(),
        };

        assert!(sender.send(event).is_ok());
    }

    #[test]
    fn test_output_collector_emit() {
        let collector = OutputCollector::new();
        let result = collector.emit("test-proc", "hello".to_string(), OutputType::Stdout);
        assert!(result.is_ok());
    }

    #[test]
    fn test_create_event() {
        let streamer = OutputStreamer::for_process("test-event");
        let event = streamer.create_event("content".to_string(), OutputType::Stdout);

        assert_eq!(event.process_id, "test-event");
        assert_eq!(event.content, "content");
        assert!(matches!(event.output_type, OutputType::Stdout));
        assert!(!event.timestamp.is_empty());
    }

    #[test]
    fn test_create_event_without_timestamp() {
        let mut config = OutputConfig::default();
        config.process_id = "no-ts".to_string();
        config.include_timestamps = false;

        let streamer = OutputStreamer::new(config);
        let event = streamer.create_event("content".to_string(), OutputType::Stderr);

        assert!(event.timestamp.is_empty());
    }

    #[test]
    fn test_stream_output_function_exists() {
        // Test that the stream_output function compiles with correct signature
        // We can't actually test it without a real AppHandle
        let _: fn(&str, Cursor<Vec<u8>>, OutputType, &AppHandle<tauri::Wry>) -> OutputResult<()> =
            stream_output;
    }

    #[test]
    fn test_output_error_display() {
        let err =
            OutputError::ReadFailed(std::io::Error::new(std::io::ErrorKind::Other, "test error"));
        assert!(err.to_string().contains("Failed to read output"));

        let err = OutputError::EmitFailed("test".to_string());
        assert!(err.to_string().contains("Failed to emit event"));

        let err = OutputError::StreamClosed;
        assert!(err.to_string().contains("Stream already closed"));

        let err = OutputError::ChannelError;
        assert!(err.to_string().contains("Channel send error"));

        let err = OutputError::BufferOverflow;
        assert!(err.to_string().contains("Buffer overflow"));
    }
}
