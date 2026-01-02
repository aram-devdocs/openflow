//! Process executor trait and output sink abstraction.
//!
//! This module defines the core traits for process execution:
//! - `ProcessExecutor`: Trait for spawning and managing processes
//! - `OutputSink`: Trait for receiving process output
//!
//! These traits allow different implementations for different contexts
//! (Tauri, standalone server, testing).

use async_trait::async_trait;
use std::sync::Arc;

use crate::error::ProcessResult;
use crate::types::{OutputChunk, ProcessHandle, SpawnConfig};

/// Trait for receiving process output.
///
/// Implementations can send output to different destinations:
/// - Tauri event system
/// - WebSocket connections
/// - Channels for local processing
/// - Log files
///
/// # Example
///
/// ```ignore
/// use openflow_process::{OutputSink, OutputChunk};
///
/// struct LogSink;
///
/// #[async_trait]
/// impl OutputSink for LogSink {
///     async fn send(&self, chunk: OutputChunk) -> ProcessResult<()> {
///         println!("[{}] {}", chunk.output_type, chunk.content);
///         Ok(())
///     }
///
///     async fn close(&self) -> ProcessResult<()> {
///         println!("Output stream closed");
///         Ok(())
///     }
/// }
/// ```
#[async_trait]
pub trait OutputSink: Send + Sync {
    /// Send an output chunk to the sink.
    async fn send(&self, chunk: OutputChunk) -> ProcessResult<()>;

    /// Close the output sink.
    ///
    /// Called when the process has finished and no more output is expected.
    async fn close(&self) -> ProcessResult<()>;

    /// Send a status update.
    ///
    /// Default implementation does nothing. Override to handle status updates.
    async fn send_status(&self, _process_id: &str, _status: &str) -> ProcessResult<()> {
        Ok(())
    }
}

/// A no-op output sink that discards all output.
///
/// Useful for testing or when output is not needed.
#[derive(Debug, Clone, Default)]
pub struct NullSink;

#[async_trait]
impl OutputSink for NullSink {
    async fn send(&self, _chunk: OutputChunk) -> ProcessResult<()> {
        Ok(())
    }

    async fn close(&self) -> ProcessResult<()> {
        Ok(())
    }
}

/// An output sink that collects output into vectors.
///
/// Useful for testing or when you need to capture all output.
#[derive(Debug, Default)]
pub struct CollectorSink {
    /// Collected stdout chunks.
    pub stdout: tokio::sync::Mutex<Vec<String>>,
    /// Collected stderr chunks.
    pub stderr: tokio::sync::Mutex<Vec<String>>,
}

impl CollectorSink {
    /// Create a new collector sink.
    pub fn new() -> Self {
        Self::default()
    }

    /// Get all stdout content joined by newlines.
    pub async fn stdout(&self) -> String {
        self.stdout.lock().await.join("")
    }

    /// Get all stderr content joined by newlines.
    pub async fn stderr(&self) -> String {
        self.stderr.lock().await.join("")
    }

    /// Get all output (stdout followed by stderr).
    pub async fn all_output(&self) -> String {
        let stdout = self.stdout().await;
        let stderr = self.stderr().await;
        format!("{}{}", stdout, stderr)
    }

    /// Clear all collected output.
    pub async fn clear(&self) {
        self.stdout.lock().await.clear();
        self.stderr.lock().await.clear();
    }
}

#[async_trait]
impl OutputSink for CollectorSink {
    async fn send(&self, chunk: OutputChunk) -> ProcessResult<()> {
        match chunk.output_type {
            crate::types::OutputType::Stdout => {
                self.stdout.lock().await.push(chunk.content);
            }
            crate::types::OutputType::Stderr => {
                self.stderr.lock().await.push(chunk.content);
            }
        }
        Ok(())
    }

    async fn close(&self) -> ProcessResult<()> {
        Ok(())
    }
}

/// An output sink that forwards to a channel.
///
/// Useful for integrating with async streams.
pub struct ChannelSink {
    sender: tokio::sync::mpsc::UnboundedSender<OutputChunk>,
}

impl ChannelSink {
    /// Create a new channel sink.
    pub fn new(sender: tokio::sync::mpsc::UnboundedSender<OutputChunk>) -> Self {
        Self { sender }
    }

    /// Create a channel sink and return both the sink and receiver.
    pub fn create() -> (Self, tokio::sync::mpsc::UnboundedReceiver<OutputChunk>) {
        let (sender, receiver) = tokio::sync::mpsc::unbounded_channel();
        (Self::new(sender), receiver)
    }
}

#[async_trait]
impl OutputSink for ChannelSink {
    async fn send(&self, chunk: OutputChunk) -> ProcessResult<()> {
        self.sender
            .send(chunk)
            .map_err(|_| crate::error::ProcessError::channel_error("Failed to send to channel"))
    }

    async fn close(&self) -> ProcessResult<()> {
        Ok(())
    }
}

/// Trait for process execution.
///
/// This trait abstracts the process lifecycle:
/// - Spawning processes (with or without PTY)
/// - Writing to process stdin
/// - Resizing the terminal
/// - Killing processes
/// - Checking process status
///
/// # Implementations
///
/// - `NativePtyExecutor`: Uses PTY for interactive processes
/// - Future: `ContainerExecutor` for running in containers
///
/// # Example
///
/// ```ignore
/// use openflow_process::{ProcessExecutor, SpawnConfig, NativePtyExecutor};
///
/// let executor = NativePtyExecutor::new();
/// let sink = Arc::new(NullSink);
///
/// let config = SpawnConfig::new("echo", &["hello"]);
/// let handle = executor.spawn("proc-1", config, sink).await?;
///
/// executor.wait("proc-1").await?;
/// ```
#[async_trait]
pub trait ProcessExecutor: Send + Sync {
    /// Spawn a new process.
    ///
    /// # Arguments
    ///
    /// * `id` - Unique identifier for the process
    /// * `config` - Configuration for spawning
    /// * `sink` - Output sink for receiving output
    ///
    /// # Returns
    ///
    /// A handle to the spawned process.
    async fn spawn(
        &self,
        id: &str,
        config: SpawnConfig,
        sink: Arc<dyn OutputSink>,
    ) -> ProcessResult<ProcessHandle>;

    /// Write data to process stdin.
    ///
    /// # Arguments
    ///
    /// * `id` - Process identifier
    /// * `data` - Data to write
    async fn write(&self, id: &str, data: &[u8]) -> ProcessResult<()>;

    /// Resize the process terminal.
    ///
    /// Only applicable for PTY-based processes.
    ///
    /// # Arguments
    ///
    /// * `id` - Process identifier
    /// * `cols` - New width in columns
    /// * `rows` - New height in rows
    async fn resize(&self, id: &str, cols: u16, rows: u16) -> ProcessResult<()>;

    /// Kill a process.
    ///
    /// # Arguments
    ///
    /// * `id` - Process identifier
    async fn kill(&self, id: &str) -> ProcessResult<()>;

    /// Wait for a process to complete.
    ///
    /// Returns the exit code if available.
    ///
    /// # Arguments
    ///
    /// * `id` - Process identifier
    async fn wait(&self, id: &str) -> ProcessResult<Option<i32>>;

    /// Check if a process exists.
    ///
    /// # Arguments
    ///
    /// * `id` - Process identifier
    async fn exists(&self, id: &str) -> bool;

    /// Get process status.
    ///
    /// # Arguments
    ///
    /// * `id` - Process identifier
    async fn status(&self, id: &str) -> ProcessResult<crate::types::ProcessStatus>;

    /// Close and clean up a process.
    ///
    /// This should be called after the process has terminated
    /// to release resources.
    ///
    /// # Arguments
    ///
    /// * `id` - Process identifier
    async fn close(&self, id: &str) -> ProcessResult<()>;
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_null_sink() {
        let sink = NullSink;
        let chunk = OutputChunk::stdout("test", "hello");
        assert!(sink.send(chunk).await.is_ok());
        assert!(sink.close().await.is_ok());
    }

    #[tokio::test]
    async fn test_collector_sink() {
        let sink = CollectorSink::new();

        sink.send(OutputChunk::stdout("test", "line 1\n")).await.unwrap();
        sink.send(OutputChunk::stdout("test", "line 2\n")).await.unwrap();
        sink.send(OutputChunk::stderr("test", "error\n")).await.unwrap();

        assert_eq!(sink.stdout().await, "line 1\nline 2\n");
        assert_eq!(sink.stderr().await, "error\n");

        sink.clear().await;
        assert_eq!(sink.stdout().await, "");
        assert_eq!(sink.stderr().await, "");
    }

    #[tokio::test]
    async fn test_channel_sink() {
        let (sink, mut receiver) = ChannelSink::create();

        sink.send(OutputChunk::stdout("test", "hello")).await.unwrap();

        let chunk = receiver.recv().await.unwrap();
        assert_eq!(chunk.content, "hello");
        assert!(chunk.output_type.is_stdout());
    }
}
