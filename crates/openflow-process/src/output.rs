//! Output handling utilities.
//!
//! This module provides utilities for buffering, aggregating, and
//! managing process output. Unlike the original Tauri-specific output.rs,
//! this module is transport-agnostic and works with the `OutputSink` trait.
//!
//! # Features
//!
//! - Line-buffered and raw output modes
//! - Output aggregation for capture
//! - Buffer management for batching
//! - Configurable output handling
//! - Async output streaming with cancellation support
//! - Channel-based output collection for async scenarios
//!
//! # Example
//!
//! ```ignore
//! use openflow_process::output::{OutputStreamer, OutputConfig, OutputReceiver};
//!
//! // Create a streamer for a process
//! let streamer = OutputStreamer::for_process("process-123");
//!
//! // Create an async receiver
//! let (receiver, sender) = OutputReceiver::create();
//!
//! // Stream output asynchronously
//! streamer.stream_to_channel(reader, output_type, sender).await?;
//! ```

use chrono::Utc;
use std::io::{BufRead, BufReader, Read};
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Arc;
use tokio::io::{AsyncBufReadExt, AsyncRead, AsyncReadExt, BufReader as AsyncBufReader};
use tokio::sync::mpsc;

use crate::error::{ProcessError, ProcessResult};
use crate::types::{OutputChunk, OutputType};

/// Default buffer size for reading output (8KB).
pub const DEFAULT_BUFFER_SIZE: usize = 8192;

/// Maximum line length before truncation.
pub const MAX_LINE_LENGTH: usize = 65536;

/// Configuration for output handling.
#[derive(Debug, Clone)]
pub struct OutputConfig {
    /// Process ID for identification.
    pub process_id: String,
    /// Buffer size for reading output.
    pub buffer_size: usize,
    /// Whether to emit line-by-line or raw chunks.
    pub line_buffered: bool,
    /// Maximum line length before truncation (0 = no limit).
    pub max_line_length: usize,
    /// Whether to include timestamps.
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

impl OutputConfig {
    /// Create a new output configuration for a process.
    pub fn for_process(process_id: impl Into<String>) -> Self {
        Self {
            process_id: process_id.into(),
            ..Default::default()
        }
    }

    /// Set the buffer size.
    pub fn with_buffer_size(mut self, size: usize) -> Self {
        self.buffer_size = size;
        self
    }

    /// Set line buffering mode.
    pub fn with_line_buffered(mut self, line_buffered: bool) -> Self {
        self.line_buffered = line_buffered;
        self
    }

    /// Set maximum line length.
    pub fn with_max_line_length(mut self, max: usize) -> Self {
        self.max_line_length = max;
        self
    }

    /// Set timestamp inclusion.
    pub fn with_timestamps(mut self, include: bool) -> Self {
        self.include_timestamps = include;
        self
    }
}

/// Output buffer for collecting and batching output.
///
/// This is useful when you want to batch multiple output chunks
/// before sending them to an output sink.
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

    /// Clear all buffers.
    pub fn clear(&mut self) {
        self.stdout_buffer.clear();
        self.stderr_buffer.clear();
        self.current_size = 0;
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

    /// Add an output chunk.
    pub fn add(&mut self, chunk: OutputChunk) {
        match chunk.output_type {
            OutputType::Stdout => self.add_stdout(chunk.content),
            OutputType::Stderr => self.add_stderr(chunk.content),
        }
    }

    /// Get all stdout content joined.
    pub fn stdout(&self) -> String {
        self.stdout.join("")
    }

    /// Get all stderr content joined.
    pub fn stderr(&self) -> String {
        self.stderr.join("")
    }

    /// Get all output (stdout + stderr) joined.
    pub fn all_output(&self) -> String {
        let mut output = self.stdout.clone();
        output.extend(self.stderr.clone());
        output.join("")
    }

    /// Get stdout lines.
    pub fn stdout_lines(&self) -> impl Iterator<Item = &str> {
        self.stdout.iter().map(|s| s.as_str())
    }

    /// Get stderr lines.
    pub fn stderr_lines(&self) -> impl Iterator<Item = &str> {
        self.stderr.iter().map(|s| s.as_str())
    }

    /// Get the number of stdout entries.
    pub fn stdout_count(&self) -> usize {
        self.stdout.len()
    }

    /// Get the number of stderr entries.
    pub fn stderr_count(&self) -> usize {
        self.stderr.len()
    }

    /// Clear all collected output.
    pub fn clear(&mut self) {
        self.stdout.clear();
        self.stderr.clear();
    }
}

/// Read lines from a reader and create output chunks.
///
/// This is a utility function for reading from a process output stream.
pub fn read_lines<R: Read>(
    reader: R,
    process_id: &str,
    output_type: OutputType,
    config: &OutputConfig,
) -> ProcessResult<Vec<OutputChunk>> {
    let buf_reader = BufReader::with_capacity(config.buffer_size, reader);
    let mut chunks = Vec::new();

    for line in buf_reader.lines() {
        let mut content = line.map_err(|e| ProcessError::read_failed(e.to_string()))?;

        // Truncate long lines if configured
        if config.max_line_length > 0 && content.len() > config.max_line_length {
            content.truncate(config.max_line_length);
            content.push_str("... [truncated]");
        }

        // Add newline back
        content.push('\n');

        let timestamp = if config.include_timestamps {
            Utc::now().to_rfc3339()
        } else {
            String::new()
        };

        chunks.push(OutputChunk {
            process_id: process_id.to_string(),
            output_type,
            content,
            timestamp,
        });
    }

    Ok(chunks)
}

/// Read raw chunks from a reader.
///
/// This reads data in chunks rather than line-by-line.
pub fn read_chunks<R: Read>(
    mut reader: R,
    process_id: &str,
    output_type: OutputType,
    config: &OutputConfig,
) -> ProcessResult<Vec<OutputChunk>> {
    let mut buffer = vec![0u8; config.buffer_size];
    let mut chunks = Vec::new();

    loop {
        let bytes_read = reader
            .read(&mut buffer)
            .map_err(|e| ProcessError::read_failed(e.to_string()))?;

        if bytes_read == 0 {
            break;
        }

        let content = String::from_utf8_lossy(&buffer[..bytes_read]).to_string();

        let timestamp = if config.include_timestamps {
            Utc::now().to_rfc3339()
        } else {
            String::new()
        };

        chunks.push(OutputChunk {
            process_id: process_id.to_string(),
            output_type,
            content,
            timestamp,
        });
    }

    Ok(chunks)
}

/// Get the event channel name for process output.
pub fn output_channel(process_id: &str) -> String {
    format!("process-output-{}", process_id)
}

/// Get the event channel name for process status.
pub fn status_channel(process_id: &str) -> String {
    format!("process-status-{}", process_id)
}

// ============================================================================
// Output Streaming
// ============================================================================

/// Output streamer for managing process output streaming.
///
/// This struct manages the streaming of process output with support for:
/// - Line-buffered and raw streaming modes
/// - Stream cancellation
/// - Configurable buffer sizes
/// - Sync and async streaming
///
/// Unlike the Tauri-specific version, this streamer is transport-agnostic
/// and can stream to any destination via channels or the `OutputSink` trait.
///
/// # Example
///
/// ```ignore
/// use openflow_process::output::{OutputStreamer, OutputType};
///
/// let streamer = OutputStreamer::for_process("process-123");
///
/// // Cancel from another thread
/// let cancel_handle = streamer.cancel_handle();
/// tokio::spawn(async move {
///     tokio::time::sleep(Duration::from_secs(5)).await;
///     cancel_handle.store(true, Ordering::SeqCst);
/// });
///
/// // Stream output (will stop if cancelled)
/// streamer.stream_sync(reader, OutputType::Stdout, |chunk| {
///     println!("{}", chunk.content);
/// })?;
/// ```
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
        Self::new(OutputConfig::for_process(process_id))
    }

    /// Create a streamer with custom buffer size.
    pub fn with_buffer_size(process_id: &str, buffer_size: usize) -> Self {
        Self::new(OutputConfig::for_process(process_id).with_buffer_size(buffer_size))
    }

    /// Get the configuration.
    pub fn config(&self) -> &OutputConfig {
        &self.config
    }

    /// Get the process ID.
    pub fn process_id(&self) -> &str {
        &self.config.process_id
    }

    /// Get the event channel name for this streamer.
    pub fn event_channel(&self) -> String {
        output_channel(&self.config.process_id)
    }

    /// Get the status event channel name.
    pub fn status_channel(&self) -> String {
        status_channel(&self.config.process_id)
    }

    /// Get a handle to cancel the stream.
    ///
    /// Store `true` to the returned `AtomicBool` to cancel the stream.
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

    /// Reset the cancellation flag.
    pub fn reset(&self) {
        self.cancelled.store(false, Ordering::SeqCst);
    }

    /// Stream output from a reader synchronously using a callback.
    ///
    /// # Arguments
    ///
    /// * `reader` - The reader to stream from (stdout or stderr)
    /// * `output_type` - The type of output (stdout or stderr)
    /// * `callback` - Function called for each output chunk
    ///
    /// # Type Parameters
    ///
    /// * `R` - The reader type (must implement Read)
    /// * `F` - The callback function type
    pub fn stream_sync<R, F>(
        &self,
        reader: R,
        output_type: OutputType,
        mut callback: F,
    ) -> ProcessResult<()>
    where
        R: Read,
        F: FnMut(OutputChunk),
    {
        let buf_reader = BufReader::with_capacity(self.config.buffer_size, reader);

        if self.config.line_buffered {
            self.stream_lines_sync(buf_reader, output_type, &mut callback)
        } else {
            self.stream_raw_sync(buf_reader, output_type, &mut callback)
        }
    }

    /// Stream output line by line synchronously.
    fn stream_lines_sync<R, F>(
        &self,
        reader: BufReader<R>,
        output_type: OutputType,
        callback: &mut F,
    ) -> ProcessResult<()>
    where
        R: Read,
        F: FnMut(OutputChunk),
    {
        for line in reader.lines() {
            // Check for cancellation
            if self.is_cancelled() {
                break;
            }

            let mut content = line.map_err(|e| ProcessError::read_failed(e.to_string()))?;

            // Truncate long lines if configured
            if self.config.max_line_length > 0 && content.len() > self.config.max_line_length {
                content.truncate(self.config.max_line_length);
                content.push_str("... [truncated]");
            }

            // Add newline back
            content.push('\n');

            let chunk = self.create_chunk(content, output_type);
            callback(chunk);
        }

        Ok(())
    }

    /// Stream raw output in chunks synchronously.
    fn stream_raw_sync<R, F>(
        &self,
        mut reader: BufReader<R>,
        output_type: OutputType,
        callback: &mut F,
    ) -> ProcessResult<()>
    where
        R: Read,
        F: FnMut(OutputChunk),
    {
        let mut buffer = vec![0u8; self.config.buffer_size];

        loop {
            // Check for cancellation
            if self.is_cancelled() {
                break;
            }

            let bytes_read = reader
                .read(&mut buffer)
                .map_err(|e| ProcessError::read_failed(e.to_string()))?;

            if bytes_read == 0 {
                break;
            }

            let content = String::from_utf8_lossy(&buffer[..bytes_read]).to_string();
            let chunk = self.create_chunk(content, output_type);
            callback(chunk);
        }

        Ok(())
    }

    /// Stream output to a channel asynchronously.
    ///
    /// This reads from an async reader and sends output chunks to a channel.
    ///
    /// # Arguments
    ///
    /// * `reader` - The async reader to stream from
    /// * `output_type` - The type of output (stdout or stderr)
    /// * `sender` - Channel sender for output chunks
    pub async fn stream_to_channel<R>(
        &self,
        reader: R,
        output_type: OutputType,
        sender: mpsc::UnboundedSender<OutputChunk>,
    ) -> ProcessResult<()>
    where
        R: AsyncRead + Unpin,
    {
        if self.config.line_buffered {
            self.stream_lines_async(reader, output_type, sender).await
        } else {
            self.stream_raw_async(reader, output_type, sender).await
        }
    }

    /// Stream output lines asynchronously.
    async fn stream_lines_async<R>(
        &self,
        reader: R,
        output_type: OutputType,
        sender: mpsc::UnboundedSender<OutputChunk>,
    ) -> ProcessResult<()>
    where
        R: AsyncRead + Unpin,
    {
        let buf_reader = AsyncBufReader::with_capacity(self.config.buffer_size, reader);
        let mut lines = buf_reader.lines();

        while let Some(line) = lines
            .next_line()
            .await
            .map_err(|e| ProcessError::read_failed(e.to_string()))?
        {
            // Check for cancellation
            if self.is_cancelled() {
                break;
            }

            let mut content = line;

            // Truncate long lines if configured
            if self.config.max_line_length > 0 && content.len() > self.config.max_line_length {
                content.truncate(self.config.max_line_length);
                content.push_str("... [truncated]");
            }

            // Add newline back
            content.push('\n');

            let chunk = self.create_chunk(content, output_type);

            if sender.send(chunk).is_err() {
                // Receiver dropped, stop streaming
                break;
            }
        }

        Ok(())
    }

    /// Stream raw output asynchronously.
    async fn stream_raw_async<R>(
        &self,
        mut reader: R,
        output_type: OutputType,
        sender: mpsc::UnboundedSender<OutputChunk>,
    ) -> ProcessResult<()>
    where
        R: AsyncRead + Unpin,
    {
        let mut buffer = vec![0u8; self.config.buffer_size];

        loop {
            // Check for cancellation
            if self.is_cancelled() {
                break;
            }

            let bytes_read = reader
                .read(&mut buffer)
                .await
                .map_err(|e| ProcessError::read_failed(e.to_string()))?;

            if bytes_read == 0 {
                break;
            }

            let content = String::from_utf8_lossy(&buffer[..bytes_read]).to_string();
            let chunk = self.create_chunk(content, output_type);

            if sender.send(chunk).is_err() {
                // Receiver dropped, stop streaming
                break;
            }
        }

        Ok(())
    }

    /// Create an output chunk with the current configuration.
    fn create_chunk(&self, content: String, output_type: OutputType) -> OutputChunk {
        let timestamp = if self.config.include_timestamps {
            Utc::now().to_rfc3339()
        } else {
            String::new()
        };

        OutputChunk {
            process_id: self.config.process_id.clone(),
            output_type,
            content,
            timestamp,
        }
    }
}

// ============================================================================
// Output Receiver
// ============================================================================

/// Async output receiver for collecting streamed output.
///
/// This receiver wraps an mpsc channel and provides convenient methods
/// for receiving output chunks asynchronously.
///
/// # Example
///
/// ```ignore
/// use openflow_process::output::OutputReceiver;
///
/// let (mut receiver, sender) = OutputReceiver::create();
///
/// // In another task, send output
/// sender.send(chunk)?;
///
/// // Receive output
/// while let Some(chunk) = receiver.recv().await {
///     println!("{}: {}", chunk.output_type, chunk.content);
/// }
/// ```
pub struct OutputReceiver {
    receiver: mpsc::UnboundedReceiver<OutputChunk>,
}

impl OutputReceiver {
    /// Create a new receiver from an existing channel receiver.
    pub fn new(receiver: mpsc::UnboundedReceiver<OutputChunk>) -> Self {
        Self { receiver }
    }

    /// Create a new receiver and sender pair.
    pub fn create() -> (Self, mpsc::UnboundedSender<OutputChunk>) {
        let (sender, receiver) = mpsc::unbounded_channel();
        (Self::new(receiver), sender)
    }

    /// Receive the next output chunk.
    ///
    /// Returns `None` if all senders have been dropped.
    pub async fn recv(&mut self) -> Option<OutputChunk> {
        self.receiver.recv().await
    }

    /// Try to receive the next output chunk without blocking.
    ///
    /// Returns `None` if no chunk is available.
    pub fn try_recv(&mut self) -> Option<OutputChunk> {
        self.receiver.try_recv().ok()
    }

    /// Collect all available chunks without blocking.
    ///
    /// Returns all chunks that are currently available in the channel.
    pub fn drain(&mut self) -> Vec<OutputChunk> {
        let mut chunks = Vec::new();
        while let Some(chunk) = self.try_recv() {
            chunks.push(chunk);
        }
        chunks
    }

    /// Collect all output until the channel is closed.
    ///
    /// This will block until all senders are dropped.
    pub async fn collect_all(&mut self) -> Vec<OutputChunk> {
        let mut chunks = Vec::new();
        while let Some(chunk) = self.recv().await {
            chunks.push(chunk);
        }
        chunks
    }

    /// Collect output into an aggregator.
    pub async fn collect_into(&mut self, aggregator: &mut OutputAggregator) {
        while let Some(chunk) = self.recv().await {
            aggregator.add(chunk);
        }
    }

    /// Close the receiver.
    ///
    /// This prevents new messages from being received but allows
    /// draining any remaining messages.
    pub fn close(&mut self) {
        self.receiver.close();
    }
}

// ============================================================================
// Output Collector (Channel-based)
// ============================================================================

/// Channel-based output collector for async scenarios.
///
/// This collector uses channels to receive output events and
/// can be used with async code. It provides both sender and receiver
/// sides for flexible integration.
///
/// # Example
///
/// ```ignore
/// use openflow_process::output::OutputCollector;
///
/// let collector = OutputCollector::new();
///
/// // Get sender for streaming
/// let sender = collector.sender();
///
/// // Emit output
/// collector.emit("proc-1", "hello", OutputType::Stdout)?;
///
/// // Take receiver for async processing
/// let mut receiver = collector.take_receiver();
/// ```
pub struct OutputCollector {
    /// Sender for output events.
    sender: mpsc::UnboundedSender<OutputChunk>,
    /// Receiver for output events.
    receiver: Option<mpsc::UnboundedReceiver<OutputChunk>>,
}

impl OutputCollector {
    /// Create a new output collector.
    pub fn new() -> Self {
        let (sender, receiver) = mpsc::unbounded_channel();
        Self {
            sender,
            receiver: Some(receiver),
        }
    }

    /// Get a clone of the sender for sending output events.
    pub fn sender(&self) -> mpsc::UnboundedSender<OutputChunk> {
        self.sender.clone()
    }

    /// Take the receiver (can only be called once).
    ///
    /// Returns `None` if the receiver has already been taken.
    pub fn take_receiver(&mut self) -> Option<OutputReceiver> {
        self.receiver.take().map(OutputReceiver::new)
    }

    /// Check if the receiver is still available.
    pub fn has_receiver(&self) -> bool {
        self.receiver.is_some()
    }

    /// Send an output chunk.
    pub fn send(&self, chunk: OutputChunk) -> ProcessResult<()> {
        self.sender
            .send(chunk)
            .map_err(|_| ProcessError::channel_error("Receiver dropped"))
    }

    /// Create and send an output chunk.
    pub fn emit(
        &self,
        process_id: &str,
        content: impl Into<String>,
        output_type: OutputType,
    ) -> ProcessResult<()> {
        let chunk = OutputChunk {
            process_id: process_id.to_string(),
            output_type,
            content: content.into(),
            timestamp: Utc::now().to_rfc3339(),
        };
        self.send(chunk)
    }

    /// Emit stdout content.
    pub fn emit_stdout(&self, process_id: &str, content: impl Into<String>) -> ProcessResult<()> {
        self.emit(process_id, content, OutputType::Stdout)
    }

    /// Emit stderr content.
    pub fn emit_stderr(&self, process_id: &str, content: impl Into<String>) -> ProcessResult<()> {
        self.emit(process_id, content, OutputType::Stderr)
    }
}

impl Default for OutputCollector {
    fn default() -> Self {
        Self::new()
    }
}

// ============================================================================
// Async Read Utilities
// ============================================================================

/// Read lines from an async reader and collect them.
///
/// This is a utility function for reading all lines from an async reader.
pub async fn read_lines_async<R>(
    reader: R,
    process_id: &str,
    output_type: OutputType,
    config: &OutputConfig,
) -> ProcessResult<Vec<OutputChunk>>
where
    R: AsyncRead + Unpin,
{
    let buf_reader = AsyncBufReader::with_capacity(config.buffer_size, reader);
    let mut lines = buf_reader.lines();
    let mut chunks = Vec::new();

    while let Some(line) = lines
        .next_line()
        .await
        .map_err(|e| ProcessError::read_failed(e.to_string()))?
    {
        let mut content = line;

        // Truncate long lines if configured
        if config.max_line_length > 0 && content.len() > config.max_line_length {
            content.truncate(config.max_line_length);
            content.push_str("... [truncated]");
        }

        // Add newline back
        content.push('\n');

        let timestamp = if config.include_timestamps {
            Utc::now().to_rfc3339()
        } else {
            String::new()
        };

        chunks.push(OutputChunk {
            process_id: process_id.to_string(),
            output_type,
            content,
            timestamp,
        });
    }

    Ok(chunks)
}

/// Read raw chunks from an async reader.
///
/// This reads data in chunks rather than line-by-line.
pub async fn read_chunks_async<R>(
    mut reader: R,
    process_id: &str,
    output_type: OutputType,
    config: &OutputConfig,
) -> ProcessResult<Vec<OutputChunk>>
where
    R: AsyncRead + Unpin,
{
    let mut buffer = vec![0u8; config.buffer_size];
    let mut chunks = Vec::new();

    loop {
        let bytes_read = reader
            .read(&mut buffer)
            .await
            .map_err(|e| ProcessError::read_failed(e.to_string()))?;

        if bytes_read == 0 {
            break;
        }

        let content = String::from_utf8_lossy(&buffer[..bytes_read]).to_string();

        let timestamp = if config.include_timestamps {
            Utc::now().to_rfc3339()
        } else {
            String::new()
        };

        chunks.push(OutputChunk {
            process_id: process_id.to_string(),
            output_type,
            content,
            timestamp,
        });
    }

    Ok(chunks)
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
    fn test_output_config_for_process() {
        let config = OutputConfig::for_process("test-123");
        assert_eq!(config.process_id, "test-123");
    }

    #[test]
    fn test_output_config_builder() {
        let config = OutputConfig::for_process("test")
            .with_buffer_size(4096)
            .with_line_buffered(false)
            .with_max_line_length(1000)
            .with_timestamps(false);

        assert_eq!(config.buffer_size, 4096);
        assert!(!config.line_buffered);
        assert_eq!(config.max_line_length, 1000);
        assert!(!config.include_timestamps);
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
    fn test_output_buffer_clear() {
        let mut buffer = OutputBuffer::new(100);
        buffer.add_stdout("test".to_string());
        buffer.add_stderr("test".to_string());

        buffer.clear();
        assert!(buffer.is_empty());
        assert_eq!(buffer.size(), 0);
    }

    #[test]
    fn test_output_aggregator() {
        let mut aggregator = OutputAggregator::new();
        aggregator.add_stdout("line 1\n".to_string());
        aggregator.add_stdout("line 2\n".to_string());
        aggregator.add_stderr("error\n".to_string());

        assert_eq!(aggregator.stdout(), "line 1\nline 2\n");
        assert_eq!(aggregator.stderr(), "error\n");
        assert_eq!(aggregator.stdout_count(), 2);
        assert_eq!(aggregator.stderr_count(), 1);
    }

    #[test]
    fn test_output_aggregator_add_chunk() {
        let mut aggregator = OutputAggregator::new();

        aggregator.add(OutputChunk::stdout("proc-1", "out"));
        aggregator.add(OutputChunk::stderr("proc-1", "err"));

        assert_eq!(aggregator.stdout(), "out");
        assert_eq!(aggregator.stderr(), "err");
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
    fn test_read_lines() {
        let input = "line 1\nline 2\nline 3\n";
        let reader = Cursor::new(input);
        let config = OutputConfig::for_process("test");

        let chunks = read_lines(reader, "test", OutputType::Stdout, &config).unwrap();

        assert_eq!(chunks.len(), 3);
        assert_eq!(chunks[0].content, "line 1\n");
        assert_eq!(chunks[1].content, "line 2\n");
        assert_eq!(chunks[2].content, "line 3\n");
        assert!(chunks[0].output_type.is_stdout());
    }

    #[test]
    fn test_read_lines_truncation() {
        let long_line = "a".repeat(100);
        let reader = Cursor::new(long_line);
        let config = OutputConfig::for_process("test").with_max_line_length(10);

        let chunks = read_lines(reader, "test", OutputType::Stdout, &config).unwrap();

        assert_eq!(chunks.len(), 1);
        assert!(chunks[0].content.len() < 30); // Truncated + suffix + newline
        assert!(chunks[0].content.contains("[truncated]"));
    }

    #[test]
    fn test_read_chunks() {
        let input = "hello world";
        let reader = Cursor::new(input);
        let config = OutputConfig::for_process("test").with_buffer_size(5);

        let chunks = read_chunks(reader, "test", OutputType::Stderr, &config).unwrap();

        assert!(chunks.len() >= 2);
        assert!(chunks[0].output_type.is_stderr());

        // Combine all chunks
        let combined: String = chunks.iter().map(|c| c.content.as_str()).collect();
        assert_eq!(combined, "hello world");
    }

    #[test]
    fn test_channel_names() {
        assert_eq!(output_channel("proc-123"), "process-output-proc-123");
        assert_eq!(status_channel("proc-123"), "process-status-proc-123");
    }

    // ========================================================================
    // OutputStreamer Tests
    // ========================================================================

    #[test]
    fn test_output_streamer_for_process() {
        let streamer = OutputStreamer::for_process("test-123");
        assert_eq!(streamer.process_id(), "test-123");
        assert_eq!(streamer.event_channel(), "process-output-test-123");
        assert_eq!(streamer.status_channel(), "process-status-test-123");
    }

    #[test]
    fn test_output_streamer_with_buffer_size() {
        let streamer = OutputStreamer::with_buffer_size("test-456", 4096);
        assert_eq!(streamer.config().buffer_size, 4096);
        assert_eq!(streamer.process_id(), "test-456");
    }

    #[test]
    fn test_output_streamer_cancellation() {
        let streamer = OutputStreamer::for_process("test-cancel");
        assert!(!streamer.is_cancelled());

        streamer.cancel();
        assert!(streamer.is_cancelled());

        streamer.reset();
        assert!(!streamer.is_cancelled());
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
    fn test_output_streamer_stream_sync_lines() {
        let input = "line 1\nline 2\nline 3\n";
        let reader = Cursor::new(input);
        let streamer = OutputStreamer::for_process("sync-lines");

        let mut chunks = Vec::new();
        streamer
            .stream_sync(reader, OutputType::Stdout, |chunk| {
                chunks.push(chunk);
            })
            .unwrap();

        assert_eq!(chunks.len(), 3);
        assert_eq!(chunks[0].content, "line 1\n");
        assert_eq!(chunks[1].content, "line 2\n");
        assert_eq!(chunks[2].content, "line 3\n");
        assert!(chunks[0].output_type.is_stdout());
    }

    #[test]
    fn test_output_streamer_stream_sync_raw() {
        let input = "hello world";
        let reader = Cursor::new(input);
        let config = OutputConfig::for_process("sync-raw")
            .with_line_buffered(false)
            .with_buffer_size(5);
        let streamer = OutputStreamer::new(config);

        let mut chunks = Vec::new();
        streamer
            .stream_sync(reader, OutputType::Stderr, |chunk| {
                chunks.push(chunk);
            })
            .unwrap();

        assert!(chunks.len() >= 2);

        // Combine all chunks
        let combined: String = chunks.iter().map(|c| c.content.as_str()).collect();
        assert_eq!(combined, "hello world");
    }

    #[test]
    fn test_output_streamer_stream_sync_cancellation() {
        let input = "line 1\nline 2\nline 3\n";
        let reader = Cursor::new(input);
        let streamer = OutputStreamer::for_process("cancel-test");

        // Cancel before first read completes (after processing callback)
        let mut count = 0;
        streamer
            .stream_sync(reader, OutputType::Stdout, |_chunk| {
                count += 1;
                if count == 1 {
                    streamer.cancel();
                }
            })
            .unwrap();

        // Should have read at least 1 line before cancellation kicked in
        assert!(count >= 1);
        assert!(count < 3); // Shouldn't have read all 3
    }

    #[test]
    fn test_output_streamer_stream_sync_truncation() {
        let long_line = "a".repeat(100);
        let reader = Cursor::new(long_line);
        let config = OutputConfig::for_process("truncate-test").with_max_line_length(10);
        let streamer = OutputStreamer::new(config);

        let mut chunks = Vec::new();
        streamer
            .stream_sync(reader, OutputType::Stdout, |chunk| {
                chunks.push(chunk);
            })
            .unwrap();

        assert_eq!(chunks.len(), 1);
        assert!(chunks[0].content.contains("[truncated]"));
        assert!(chunks[0].content.len() < 30);
    }

    // ========================================================================
    // OutputReceiver Tests
    // ========================================================================

    #[tokio::test]
    async fn test_output_receiver_create() {
        let (mut receiver, sender) = OutputReceiver::create();

        let chunk = OutputChunk::stdout("test", "hello");
        sender.send(chunk).unwrap();

        let received = receiver.recv().await.unwrap();
        assert_eq!(received.content, "hello");
        assert_eq!(received.process_id, "test");
    }

    #[tokio::test]
    async fn test_output_receiver_try_recv() {
        let (mut receiver, sender) = OutputReceiver::create();

        // No message yet
        assert!(receiver.try_recv().is_none());

        // Send message
        sender.send(OutputChunk::stdout("test", "msg")).unwrap();

        // Now we should get it
        let received = receiver.try_recv();
        assert!(received.is_some());
        assert_eq!(received.unwrap().content, "msg");

        // Queue empty again
        assert!(receiver.try_recv().is_none());
    }

    #[tokio::test]
    async fn test_output_receiver_drain() {
        let (mut receiver, sender) = OutputReceiver::create();

        sender.send(OutputChunk::stdout("test", "1")).unwrap();
        sender.send(OutputChunk::stdout("test", "2")).unwrap();
        sender.send(OutputChunk::stdout("test", "3")).unwrap();

        let chunks = receiver.drain();
        assert_eq!(chunks.len(), 3);
        assert_eq!(chunks[0].content, "1");
        assert_eq!(chunks[1].content, "2");
        assert_eq!(chunks[2].content, "3");
    }

    #[tokio::test]
    async fn test_output_receiver_collect_all() {
        let (mut receiver, sender) = OutputReceiver::create();

        sender.send(OutputChunk::stdout("test", "a")).unwrap();
        sender.send(OutputChunk::stdout("test", "b")).unwrap();
        drop(sender); // Close sender

        let chunks = receiver.collect_all().await;
        assert_eq!(chunks.len(), 2);
    }

    #[tokio::test]
    async fn test_output_receiver_collect_into() {
        let (mut receiver, sender) = OutputReceiver::create();

        sender.send(OutputChunk::stdout("test", "out")).unwrap();
        sender.send(OutputChunk::stderr("test", "err")).unwrap();
        drop(sender);

        let mut aggregator = OutputAggregator::new();
        receiver.collect_into(&mut aggregator).await;

        assert_eq!(aggregator.stdout(), "out");
        assert_eq!(aggregator.stderr(), "err");
    }

    // ========================================================================
    // OutputCollector Tests
    // ========================================================================

    #[test]
    fn test_output_collector_new() {
        let collector = OutputCollector::new();
        assert!(collector.has_receiver());
    }

    #[test]
    fn test_output_collector_send() {
        let collector = OutputCollector::new();
        let chunk = OutputChunk::stdout("test", "hello");
        assert!(collector.send(chunk).is_ok());
    }

    #[test]
    fn test_output_collector_emit() {
        let collector = OutputCollector::new();
        assert!(collector
            .emit("proc-1", "hello", OutputType::Stdout)
            .is_ok());
        assert!(collector.emit_stdout("proc-1", "stdout").is_ok());
        assert!(collector.emit_stderr("proc-1", "stderr").is_ok());
    }

    #[tokio::test]
    async fn test_output_collector_take_receiver() {
        let mut collector = OutputCollector::new();

        collector.emit_stdout("test", "hello").unwrap();

        let mut receiver = collector.take_receiver().unwrap();
        assert!(!collector.has_receiver());
        assert!(collector.take_receiver().is_none());

        let chunk = receiver.try_recv().unwrap();
        assert_eq!(chunk.content, "hello");
    }

    #[test]
    fn test_output_collector_sender() {
        let collector = OutputCollector::new();
        let sender = collector.sender();

        let chunk = OutputChunk::stderr("test", "error");
        assert!(sender.send(chunk).is_ok());
    }

    // ========================================================================
    // Async Read Utilities Tests
    // ========================================================================

    #[tokio::test]
    async fn test_read_lines_async() {
        let input = b"line 1\nline 2\nline 3\n";
        let reader = tokio::io::BufReader::new(&input[..]);
        let config = OutputConfig::for_process("async-test");

        let chunks = read_lines_async(reader, "async-test", OutputType::Stdout, &config)
            .await
            .unwrap();

        assert_eq!(chunks.len(), 3);
        assert_eq!(chunks[0].content, "line 1\n");
        assert_eq!(chunks[1].content, "line 2\n");
        assert_eq!(chunks[2].content, "line 3\n");
    }

    #[tokio::test]
    async fn test_read_lines_async_truncation() {
        let long_line = "a".repeat(100);
        let input = long_line.as_bytes();
        let reader = tokio::io::BufReader::new(input);
        let config = OutputConfig::for_process("async-truncate").with_max_line_length(10);

        let chunks = read_lines_async(reader, "async-truncate", OutputType::Stdout, &config)
            .await
            .unwrap();

        assert_eq!(chunks.len(), 1);
        assert!(chunks[0].content.contains("[truncated]"));
    }

    #[tokio::test]
    async fn test_read_chunks_async() {
        let input = b"hello world";
        let reader = &input[..];
        let config = OutputConfig::for_process("async-chunks").with_buffer_size(5);

        let chunks = read_chunks_async(reader, "async-chunks", OutputType::Stderr, &config)
            .await
            .unwrap();

        assert!(chunks.len() >= 2);

        // Combine all chunks
        let combined: String = chunks.iter().map(|c| c.content.as_str()).collect();
        assert_eq!(combined, "hello world");
    }

    #[tokio::test]
    async fn test_streamer_stream_to_channel() {
        let input = b"line 1\nline 2\n";
        let reader = &input[..];

        let (sender, mut receiver) = mpsc::unbounded_channel();

        // Stream in background task
        let stream_task = tokio::spawn({
            let streamer = OutputStreamer::for_process("channel-test");
            async move {
                streamer
                    .stream_to_channel(reader, OutputType::Stdout, sender)
                    .await
            }
        });

        // Collect chunks
        let mut chunks = Vec::new();
        while let Some(chunk) = receiver.recv().await {
            chunks.push(chunk);
        }

        stream_task.await.unwrap().unwrap();

        assert_eq!(chunks.len(), 2);
        assert_eq!(chunks[0].content, "line 1\n");
        assert_eq!(chunks[1].content, "line 2\n");
    }

    #[tokio::test]
    async fn test_streamer_stream_to_channel_raw() {
        let input = b"hello world";
        let reader = &input[..];

        let (sender, mut receiver) = mpsc::unbounded_channel();

        let stream_task = tokio::spawn({
            let config = OutputConfig::for_process("raw-channel")
                .with_line_buffered(false)
                .with_buffer_size(5);
            let streamer = OutputStreamer::new(config);
            async move {
                streamer
                    .stream_to_channel(reader, OutputType::Stderr, sender)
                    .await
            }
        });

        let mut chunks = Vec::new();
        while let Some(chunk) = receiver.recv().await {
            chunks.push(chunk);
        }

        stream_task.await.unwrap().unwrap();

        assert!(chunks.len() >= 2);

        let combined: String = chunks.iter().map(|c| c.content.as_str()).collect();
        assert_eq!(combined, "hello world");
    }
}
