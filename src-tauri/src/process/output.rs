//! Output streaming module.
//!
//! Provides functionality for streaming process output to the frontend
//! via Tauri events.

use chrono::Utc;
use std::io::{BufRead, BufReader, Read};
use tauri::{AppHandle, Emitter, Runtime};
use thiserror::Error;

use crate::types::{OutputType, ProcessOutputEvent};

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
}

impl Default for OutputConfig {
    fn default() -> Self {
        Self {
            process_id: String::new(),
            buffer_size: 8192,
            line_buffered: true,
        }
    }
}

/// Output streamer for sending process output to the frontend.
pub struct OutputStreamer {
    config: OutputConfig,
}

impl OutputStreamer {
    /// Create a new output streamer with the given configuration.
    pub fn new(config: OutputConfig) -> Self {
        Self { config }
    }

    /// Create a streamer for a specific process ID.
    pub fn for_process(process_id: &str) -> Self {
        Self::new(OutputConfig {
            process_id: process_id.to_string(),
            ..Default::default()
        })
    }

    /// Get the event channel name for this streamer.
    pub fn event_channel(&self) -> String {
        format!("process-output-{}", self.config.process_id)
    }

    /// Stream output from a reader to the frontend.
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
            // Line-by-line streaming
            for line in buf_reader.lines() {
                let content = line?;
                let event = ProcessOutputEvent {
                    process_id: self.config.process_id.clone(),
                    content,
                    output_type: output_type.clone(),
                    timestamp: Utc::now().to_rfc3339(),
                };

                app_handle
                    .emit(&channel, &event)
                    .map_err(|e| OutputError::EmitFailed(e.to_string()))?;
            }
        } else {
            // Buffered streaming
            let mut buf_reader = buf_reader;
            let mut buffer = vec![0u8; self.config.buffer_size];

            loop {
                let bytes_read = buf_reader.read(&mut buffer)?;
                if bytes_read == 0 {
                    break;
                }

                let content = String::from_utf8_lossy(&buffer[..bytes_read]).to_string();
                let event = ProcessOutputEvent {
                    process_id: self.config.process_id.clone(),
                    content,
                    output_type: output_type.clone(),
                    timestamp: Utc::now().to_rfc3339(),
                };

                app_handle
                    .emit(&channel, &event)
                    .map_err(|e| OutputError::EmitFailed(e.to_string()))?;
            }
        }

        Ok(())
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
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_output_config_default() {
        let config = OutputConfig::default();
        assert!(config.process_id.is_empty());
        assert_eq!(config.buffer_size, 8192);
        assert!(config.line_buffered);
    }

    #[test]
    fn test_output_streamer_event_channel() {
        let streamer = OutputStreamer::for_process("test-123");
        assert_eq!(streamer.event_channel(), "process-output-test-123");
    }

    #[test]
    fn test_output_aggregator() {
        let mut aggregator = OutputAggregator::new();
        aggregator.add_stdout("line 1".to_string());
        aggregator.add_stdout("line 2".to_string());
        aggregator.add_stderr("error".to_string());

        assert_eq!(aggregator.stdout(), "line 1\nline 2");
        assert_eq!(aggregator.stderr(), "error");
    }
}
