//! Process management module for OpenFlow.
//!
//! This module provides process spawning, PTY management, and output streaming
//! capabilities for executing CLI tools (Claude Code, Gemini CLI, etc.).
//!
//! # Module Structure
//!
//! - `spawn`: Process spawning with stdin/stdout/stderr pipes
//! - `pty`: PTY (pseudo-terminal) management for interactive processes
//! - `output`: Output streaming via Tauri events
//!
//! # Usage
//!
//! The process module is used by `ProcessService` to execute AI CLI tools
//! and stream their output back to the frontend in real-time.

pub mod output;
pub mod pty;
pub mod spawn;

// Re-export commonly used types and functions
pub use output::{
    stream_output, stream_output_buffered, OutputAggregator, OutputBuffer, OutputCollector,
    OutputConfig, OutputError, OutputResult, OutputStreamer,
};
pub use pty::{PtyConfig, PtyManager, PtySize};
pub use spawn::{ProcessSpawner, SpawnConfig};
