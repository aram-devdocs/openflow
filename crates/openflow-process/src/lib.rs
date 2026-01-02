//! OpenFlow Process Management
//!
//! This crate provides process execution and PTY management for OpenFlow.
//! It abstracts process spawning, input/output handling, and lifecycle
//! management to work in both Tauri desktop and standalone server contexts.
//!
//! # Module Structure
//!
//! - `error`: Error types for process operations
//! - `types`: Configuration and handle types
//! - `executor`: `ProcessExecutor` trait for process abstraction
//! - `pty`: PTY (pseudo-terminal) management using portable-pty
//! - `native`: Native PTY executor implementation
//! - `spawn`: Basic process spawning with pipe-based I/O
//! - `output`: Output handling utilities (buffering, aggregation)
//!
//! # Architecture
//!
//! The crate uses a trait-based abstraction (`ProcessExecutor`) that allows
//! different implementations for different contexts:
//!
//! - `NativePtyExecutor`: Uses PTY for interactive terminal processes
//! - `PipeExecutor`: Uses standard pipes for non-interactive processes
//!
//! Output is streamed via an `OutputSink` trait that can be implemented
//! for different transports (Tauri events, WebSocket, channels).
//!
//! # Example
//!
//! ```ignore
//! use openflow_process::{ProcessExecutor, SpawnConfig, NativePtyExecutor, NullSink};
//! use std::sync::Arc;
//!
//! #[tokio::main]
//! async fn main() -> Result<(), Box<dyn std::error::Error>> {
//!     // Create a PTY executor
//!     let executor = NativePtyExecutor::new();
//!     let sink = Arc::new(NullSink);
//!
//!     // Configure the process
//!     let config = SpawnConfig::new("echo", &["hello", "world"])
//!         .with_cwd("/tmp");
//!
//!     // Spawn the process
//!     let handle = executor.spawn("my-process", config, sink).await?;
//!
//!     // Wait for completion
//!     executor.wait("my-process").await?;
//!
//!     Ok(())
//! }
//! ```

pub mod error;
pub mod executor;
pub mod native;
pub mod output;
pub mod pty;
pub mod spawn;
pub mod types;

// Re-export commonly used items
pub use error::{ProcessError, ProcessResult};
pub use executor::{ChannelSink, CollectorSink, NullSink, OutputSink, ProcessExecutor};
pub use native::NativePtyExecutor;
pub use output::{
    output_channel, read_chunks, read_chunks_async, read_lines, read_lines_async, status_channel,
    OutputAggregator, OutputBuffer, OutputCollector, OutputConfig, OutputReceiver, OutputStreamer,
    DEFAULT_BUFFER_SIZE, MAX_LINE_LENGTH,
};
pub use pty::{PtyConfig, PtyError, PtyManager, PtyResult, PtySize};
pub use spawn::{PipeProcessExecutor, PipeSpawnConfig, ProcessSpawner, SpawnError, SpawnResult};
pub use types::{OutputChunk, OutputType, ProcessHandle, ProcessStatus, SpawnConfig};
