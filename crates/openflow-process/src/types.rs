//! Type definitions for process management.
//!
//! This module defines the core types used for configuring and managing processes.

use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::path::PathBuf;
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Arc;

/// Process status.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum ProcessStatus {
    /// Process is starting up.
    Starting,
    /// Process is running.
    Running,
    /// Process completed successfully.
    Completed,
    /// Process failed with an error.
    Failed,
    /// Process was killed.
    Killed,
}

impl ProcessStatus {
    /// Check if the process is still running.
    pub fn is_running(&self) -> bool {
        matches!(self, Self::Starting | Self::Running)
    }

    /// Check if the process has terminated (regardless of how).
    pub fn is_terminated(&self) -> bool {
        matches!(self, Self::Completed | Self::Failed | Self::Killed)
    }

    /// Check if the process completed successfully.
    pub fn is_success(&self) -> bool {
        matches!(self, Self::Completed)
    }
}

impl Default for ProcessStatus {
    fn default() -> Self {
        Self::Starting
    }
}

/// Configuration for spawning a process.
#[derive(Debug, Clone)]
pub struct SpawnConfig {
    /// The command to execute.
    pub command: String,
    /// Arguments to pass to the command.
    pub args: Vec<String>,
    /// Working directory for the process.
    pub cwd: Option<PathBuf>,
    /// Environment variables to set.
    pub env: HashMap<String, String>,
    /// Whether to inherit the parent's environment.
    pub inherit_env: bool,
    /// Terminal width in columns (for PTY).
    pub cols: u16,
    /// Terminal height in rows (for PTY).
    pub rows: u16,
    /// Whether to use a PTY (pseudo-terminal).
    pub use_pty: bool,
}

impl SpawnConfig {
    /// Create a new spawn configuration.
    pub fn new(command: impl Into<String>, args: &[impl AsRef<str>]) -> Self {
        Self {
            command: command.into(),
            args: args.iter().map(|a| a.as_ref().to_string()).collect(),
            cwd: None,
            env: HashMap::new(),
            inherit_env: true,
            cols: 80,
            rows: 24,
            use_pty: true,
        }
    }

    /// Create a simple configuration with just a command.
    pub fn command(command: impl Into<String>) -> Self {
        Self::new(command, &[] as &[&str])
    }

    /// Set the working directory.
    pub fn with_cwd(mut self, cwd: impl Into<PathBuf>) -> Self {
        self.cwd = Some(cwd.into());
        self
    }

    /// Add an environment variable.
    pub fn with_env(mut self, key: impl Into<String>, value: impl Into<String>) -> Self {
        self.env.insert(key.into(), value.into());
        self
    }

    /// Set multiple environment variables.
    pub fn with_envs(mut self, envs: impl IntoIterator<Item = (String, String)>) -> Self {
        self.env.extend(envs);
        self
    }

    /// Set whether to inherit parent environment.
    pub fn with_inherit_env(mut self, inherit: bool) -> Self {
        self.inherit_env = inherit;
        self
    }

    /// Set terminal size (for PTY).
    pub fn with_size(mut self, cols: u16, rows: u16) -> Self {
        self.cols = cols;
        self.rows = rows;
        self
    }

    /// Set whether to use a PTY.
    pub fn with_pty(mut self, use_pty: bool) -> Self {
        self.use_pty = use_pty;
        self
    }

    /// Get the full command line as a string.
    pub fn command_line(&self) -> String {
        if self.args.is_empty() {
            self.command.clone()
        } else {
            format!("{} {}", self.command, self.args.join(" "))
        }
    }
}

impl Default for SpawnConfig {
    fn default() -> Self {
        Self {
            command: String::new(),
            args: Vec::new(),
            cwd: None,
            env: HashMap::new(),
            inherit_env: true,
            cols: 80,
            rows: 24,
            use_pty: true,
        }
    }
}

/// Handle to a running process.
///
/// This provides control over a spawned process and access to its status.
#[derive(Debug, Clone)]
pub struct ProcessHandle {
    /// Unique identifier for this process.
    pub id: String,
    /// The spawn configuration used.
    pub config: SpawnConfig,
    /// Flag indicating if the process should be cancelled.
    cancelled: Arc<AtomicBool>,
    /// Current status (for simple tracking).
    status: Arc<std::sync::atomic::AtomicU8>,
}

impl ProcessHandle {
    /// Create a new process handle.
    pub fn new(id: impl Into<String>, config: SpawnConfig) -> Self {
        Self {
            id: id.into(),
            config,
            cancelled: Arc::new(AtomicBool::new(false)),
            status: Arc::new(std::sync::atomic::AtomicU8::new(0)), // Starting
        }
    }

    /// Generate a new unique ID.
    pub fn generate_id() -> String {
        uuid::Uuid::new_v4().to_string()
    }

    /// Get the process ID.
    pub fn id(&self) -> &str {
        &self.id
    }

    /// Request cancellation of the process.
    pub fn cancel(&self) {
        self.cancelled.store(true, Ordering::SeqCst);
    }

    /// Check if cancellation was requested.
    pub fn is_cancelled(&self) -> bool {
        self.cancelled.load(Ordering::SeqCst)
    }

    /// Get a handle for cancellation checking.
    pub fn cancel_handle(&self) -> Arc<AtomicBool> {
        Arc::clone(&self.cancelled)
    }

    /// Set the process status.
    pub fn set_status(&self, status: ProcessStatus) {
        let code = match status {
            ProcessStatus::Starting => 0,
            ProcessStatus::Running => 1,
            ProcessStatus::Completed => 2,
            ProcessStatus::Failed => 3,
            ProcessStatus::Killed => 4,
        };
        self.status.store(code, Ordering::SeqCst);
    }

    /// Get the current status.
    pub fn status(&self) -> ProcessStatus {
        match self.status.load(Ordering::SeqCst) {
            0 => ProcessStatus::Starting,
            1 => ProcessStatus::Running,
            2 => ProcessStatus::Completed,
            3 => ProcessStatus::Failed,
            4 => ProcessStatus::Killed,
            _ => ProcessStatus::Failed,
        }
    }
}

/// Output type enumeration.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum OutputType {
    /// Standard output.
    Stdout,
    /// Standard error.
    Stderr,
}

impl OutputType {
    /// Check if this is stdout.
    pub fn is_stdout(&self) -> bool {
        matches!(self, Self::Stdout)
    }

    /// Check if this is stderr.
    pub fn is_stderr(&self) -> bool {
        matches!(self, Self::Stderr)
    }
}

/// Output chunk from a process.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct OutputChunk {
    /// The process ID.
    pub process_id: String,
    /// Type of output (stdout or stderr).
    pub output_type: OutputType,
    /// The content.
    pub content: String,
    /// Timestamp in RFC 3339 format.
    pub timestamp: String,
}

impl OutputChunk {
    /// Create a new output chunk.
    pub fn new(
        process_id: impl Into<String>,
        output_type: OutputType,
        content: impl Into<String>,
    ) -> Self {
        Self {
            process_id: process_id.into(),
            output_type,
            content: content.into(),
            timestamp: chrono::Utc::now().to_rfc3339(),
        }
    }

    /// Create a stdout chunk.
    pub fn stdout(process_id: impl Into<String>, content: impl Into<String>) -> Self {
        Self::new(process_id, OutputType::Stdout, content)
    }

    /// Create a stderr chunk.
    pub fn stderr(process_id: impl Into<String>, content: impl Into<String>) -> Self {
        Self::new(process_id, OutputType::Stderr, content)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_process_status_is_running() {
        assert!(ProcessStatus::Starting.is_running());
        assert!(ProcessStatus::Running.is_running());
        assert!(!ProcessStatus::Completed.is_running());
        assert!(!ProcessStatus::Failed.is_running());
        assert!(!ProcessStatus::Killed.is_running());
    }

    #[test]
    fn test_process_status_is_terminated() {
        assert!(!ProcessStatus::Starting.is_terminated());
        assert!(!ProcessStatus::Running.is_terminated());
        assert!(ProcessStatus::Completed.is_terminated());
        assert!(ProcessStatus::Failed.is_terminated());
        assert!(ProcessStatus::Killed.is_terminated());
    }

    #[test]
    fn test_spawn_config_new() {
        let config = SpawnConfig::new("echo", &["hello", "world"]);
        assert_eq!(config.command, "echo");
        assert_eq!(config.args, vec!["hello", "world"]);
        assert!(config.cwd.is_none());
        assert!(config.inherit_env);
        assert!(config.use_pty);
    }

    #[test]
    fn test_spawn_config_builder() {
        let config = SpawnConfig::new("ls", &["-la"])
            .with_cwd("/tmp")
            .with_env("TERM", "xterm-256color")
            .with_size(120, 40)
            .with_pty(false);

        assert_eq!(config.command, "ls");
        assert_eq!(config.cwd, Some(PathBuf::from("/tmp")));
        assert_eq!(config.env.get("TERM"), Some(&"xterm-256color".to_string()));
        assert_eq!(config.cols, 120);
        assert_eq!(config.rows, 40);
        assert!(!config.use_pty);
    }

    #[test]
    fn test_spawn_config_command_line() {
        let config = SpawnConfig::new("git", &["commit", "-m", "test"]);
        assert_eq!(config.command_line(), "git commit -m test");

        let config = SpawnConfig::command("pwd");
        assert_eq!(config.command_line(), "pwd");
    }

    #[test]
    fn test_process_handle() {
        let config = SpawnConfig::new("echo", &["test"]);
        let handle = ProcessHandle::new("test-123", config);

        assert_eq!(handle.id(), "test-123");
        assert!(!handle.is_cancelled());
        assert_eq!(handle.status(), ProcessStatus::Starting);

        handle.cancel();
        assert!(handle.is_cancelled());

        handle.set_status(ProcessStatus::Running);
        assert_eq!(handle.status(), ProcessStatus::Running);
    }

    #[test]
    fn test_output_chunk() {
        let chunk = OutputChunk::stdout("proc-1", "hello");
        assert_eq!(chunk.process_id, "proc-1");
        assert!(chunk.output_type.is_stdout());
        assert_eq!(chunk.content, "hello");
        assert!(!chunk.timestamp.is_empty());

        let chunk = OutputChunk::stderr("proc-2", "error");
        assert!(chunk.output_type.is_stderr());
    }

    #[test]
    fn test_output_type() {
        let out = OutputType::Stdout;
        assert!(out.is_stdout());
        assert!(!out.is_stderr());

        let err = OutputType::Stderr;
        assert!(err.is_stderr());
        assert!(!err.is_stdout());
    }
}
