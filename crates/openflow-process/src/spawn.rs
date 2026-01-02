//! Process spawning module.
//!
//! Provides functionality for spawning child processes with proper
//! stdin/stdout/stderr pipe handling. This is used for non-interactive
//! processes where a PTY is not needed.
//!
//! # Features
//!
//! - Simple process spawning with pipe-based I/O
//! - Environment variable configuration
//! - Working directory support
//! - Convenience functions for common patterns
//! - Async spawning with tokio
//! - Integration with ProcessExecutor trait
//!
//! # Security Considerations: Environment Variables
//!
//! **Current Implementation:** No environment variable whitelist/blacklist is enforced.
//! The spawner accepts any environment variables passed from the caller.
//!
//! This design decision is intentional for the following reasons:
//!
//! 1. **Local Desktop Application:** OpenFlow runs as a local application on the
//!    user's machine. The user already has full control over their environment.
//!
//! 2. **Development Tool Context:** As a dev tool, OpenFlow spawns CLI tools
//!    (Claude Code, npm, cargo, etc.) that legitimately need access to various
//!    env vars like `PATH`, `HOME`, `API_KEYS`, etc.
//!
//! 3. **Executor Profiles:** Users explicitly configure which env vars to pass
//!    via ExecutorProfiles. This is a user-controlled configuration, not
//!    arbitrary input from untrusted sources.
//!
//! **If deploying as a multi-tenant server (not currently a use case):**
//! - Add env var whitelist/blacklist in the route handlers, not the spawner
//! - Sanitize `PATH` and other critical system variables
//! - Consider sandboxing with containers or VMs
//!
//! # Architecture
//!
//! The spawn module provides two main approaches for process execution:
//!
//! 1. **`ProcessSpawner`**: Simple, synchronous spawning for quick commands
//! 2. **`PipeProcessExecutor`**: Async executor implementing `ProcessExecutor` trait
//!
//! Use `ProcessSpawner` for simple command execution:
//! ```ignore
//! let (stdout, stderr, exit_code) = ProcessSpawner::run_capture(
//!     PipeSpawnConfig::new("git", &["status", "-s"])
//! )?;
//! ```
//!
//! Use `PipeProcessExecutor` for managed processes with output streaming:
//! ```ignore
//! let executor = PipeProcessExecutor::new();
//! let sink = Arc::new(CollectorSink::new());
//! executor.spawn("my-process", config, sink).await?;
//! ```

use async_trait::async_trait;
use std::collections::HashMap;
use std::io::{BufReader, Read, Write};
use std::path::PathBuf;
use std::process::{Child, ChildStderr, ChildStdin, ChildStdout, Command, Stdio};
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Arc;
use thiserror::Error;
use tokio::sync::RwLock;
use tracing::{debug, info, warn};

use crate::error::{ProcessError, ProcessResult};
use crate::executor::{OutputSink, ProcessExecutor};
use crate::types::{OutputChunk, OutputType, ProcessHandle, ProcessStatus, SpawnConfig};

/// Errors that can occur during process spawning.
#[derive(Debug, Error)]
pub enum SpawnError {
    #[error("Failed to spawn process: {0}")]
    SpawnFailed(#[from] std::io::Error),

    #[error("Invalid working directory: {0}")]
    InvalidWorkingDirectory(PathBuf),

    #[error("Command not found: {0}")]
    CommandNotFound(String),
}

/// Result type for spawn operations.
pub type SpawnResult<T> = Result<T, SpawnError>;

/// Configuration for spawning a process (pipe-based, no PTY).
#[derive(Debug, Clone)]
pub struct PipeSpawnConfig {
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
}

impl Default for PipeSpawnConfig {
    fn default() -> Self {
        Self {
            command: String::new(),
            args: Vec::new(),
            cwd: None,
            env: HashMap::new(),
            inherit_env: true,
        }
    }
}

impl PipeSpawnConfig {
    /// Create a new spawn configuration.
    pub fn new(command: impl Into<String>, args: &[impl AsRef<str>]) -> Self {
        Self {
            command: command.into(),
            args: args.iter().map(|a| a.as_ref().to_string()).collect(),
            ..Default::default()
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
}

/// Process spawner for creating child processes with pipe-based I/O.
///
/// This is used for non-interactive processes where a PTY is not needed.
/// For interactive processes (terminals, CLI tools), use `PtyManager` instead.
pub struct ProcessSpawner;

impl ProcessSpawner {
    /// Spawn a new process with the given configuration.
    ///
    /// # Arguments
    ///
    /// * `config` - Configuration for the process to spawn
    ///
    /// # Returns
    ///
    /// Returns a `Child` handle to the spawned process.
    pub fn spawn(config: PipeSpawnConfig) -> SpawnResult<Child> {
        let mut cmd = Command::new(&config.command);

        // Set arguments
        cmd.args(&config.args);

        // Set working directory if specified
        if let Some(cwd) = &config.cwd {
            if !cwd.exists() {
                return Err(SpawnError::InvalidWorkingDirectory(cwd.clone()));
            }
            cmd.current_dir(cwd);
        }

        // Handle environment variables
        if !config.inherit_env {
            cmd.env_clear();
        }
        for (key, value) in &config.env {
            cmd.env(key, value);
        }

        // Set up stdio pipes
        cmd.stdin(Stdio::piped());
        cmd.stdout(Stdio::piped());
        cmd.stderr(Stdio::piped());

        // Spawn the process
        cmd.spawn().map_err(SpawnError::SpawnFailed)
    }

    /// Spawn a simple command with arguments.
    ///
    /// This is a convenience method for spawning a process without
    /// custom environment or working directory.
    pub fn spawn_simple(command: &str, args: &[&str]) -> SpawnResult<Child> {
        Self::spawn(PipeSpawnConfig {
            command: command.to_string(),
            args: args.iter().map(|s| s.to_string()).collect(),
            ..Default::default()
        })
    }

    /// Spawn a command and wait for it to complete.
    ///
    /// Returns the exit code.
    pub fn run(config: PipeSpawnConfig) -> SpawnResult<i32> {
        let mut child = Self::spawn(config)?;
        let status = child.wait()?;
        Ok(status.code().unwrap_or(-1))
    }

    /// Spawn a command and capture its output.
    ///
    /// Returns (stdout, stderr, exit_code).
    pub fn run_capture(config: PipeSpawnConfig) -> SpawnResult<(String, String, i32)> {
        let mut cmd = Command::new(&config.command);

        cmd.args(&config.args);

        if let Some(cwd) = &config.cwd {
            if !cwd.exists() {
                return Err(SpawnError::InvalidWorkingDirectory(cwd.clone()));
            }
            cmd.current_dir(cwd);
        }

        if !config.inherit_env {
            cmd.env_clear();
        }
        for (key, value) in &config.env {
            cmd.env(key, value);
        }

        let output = cmd.output()?;

        let stdout = String::from_utf8_lossy(&output.stdout).to_string();
        let stderr = String::from_utf8_lossy(&output.stderr).to_string();
        let exit_code = output.status.code().unwrap_or(-1);

        Ok((stdout, stderr, exit_code))
    }

    /// Spawn a command asynchronously and capture its output.
    ///
    /// This is an async version of `run_capture` that runs in a blocking task.
    pub async fn run_capture_async(
        config: PipeSpawnConfig,
    ) -> SpawnResult<(String, String, i32)> {
        tokio::task::spawn_blocking(move || Self::run_capture(config))
            .await
            .map_err(|e| SpawnError::SpawnFailed(std::io::Error::other(
                format!("Task join error: {}", e),
            )))?
    }

    /// Spawn a command asynchronously and wait for it to complete.
    ///
    /// Returns the exit code.
    pub async fn run_async(config: PipeSpawnConfig) -> SpawnResult<i32> {
        tokio::task::spawn_blocking(move || Self::run(config))
            .await
            .map_err(|e| SpawnError::SpawnFailed(std::io::Error::other(
                format!("Task join error: {}", e),
            )))?
    }
}

/// Convert from SpawnConfig to PipeSpawnConfig.
///
/// This allows using the general SpawnConfig with pipe-based spawning.
impl From<SpawnConfig> for PipeSpawnConfig {
    fn from(config: SpawnConfig) -> Self {
        Self {
            command: config.command,
            args: config.args,
            cwd: config.cwd,
            env: config.env,
            inherit_env: config.inherit_env,
        }
    }
}

/// Convert from PipeSpawnConfig to SpawnConfig.
///
/// Note: PTY-specific settings (cols, rows) will use defaults.
impl From<PipeSpawnConfig> for SpawnConfig {
    fn from(config: PipeSpawnConfig) -> Self {
        Self {
            command: config.command,
            args: config.args,
            cwd: config.cwd,
            env: config.env,
            inherit_env: config.inherit_env,
            cols: 80,
            rows: 24,
            use_pty: false,
        }
    }
}

// ============================================================================
// PipeProcessExecutor - Async executor using pipe-based I/O
// ============================================================================

/// Information about a running pipe-based process.
struct PipeProcessInfo {
    /// Handle to the process.
    handle: ProcessHandle,
    /// Output sink for streaming output.
    #[allow(dead_code)]
    sink: Arc<dyn OutputSink>,
    /// Flag to signal the output reader to stop.
    stop_flag: Arc<AtomicBool>,
    /// Cached exit code once the process completes.
    exit_code: Option<i32>,
    /// Stdin writer handle.
    stdin: Option<ChildStdin>,
}

/// Pipe-based process executor.
///
/// This executor uses standard pipes (stdin/stdout/stderr) for I/O,
/// which is suitable for non-interactive processes that don't need
/// terminal emulation.
///
/// # Comparison with NativePtyExecutor
///
/// | Feature | PipeProcessExecutor | NativePtyExecutor |
/// |---------|--------------------|--------------------|
/// | Terminal emulation | No | Yes |
/// | Color output | Depends on process | Full ANSI support |
/// | Interactive input | Limited | Full |
/// | Resize support | No | Yes |
/// | Performance | Slightly better | Good |
///
/// Use this executor for:
/// - Script execution
/// - Build commands (cargo, npm, etc.)
/// - Background tasks
/// - Any non-interactive process
///
/// Use `NativePtyExecutor` for:
/// - Terminal emulators
/// - Interactive CLI tools (Claude Code, etc.)
/// - Processes that need terminal features
///
/// # Thread Safety
///
/// The executor is designed to be shared across threads (`Send + Sync`).
pub struct PipeProcessExecutor {
    /// Map of process IDs to process info.
    processes: Arc<RwLock<HashMap<String, PipeProcessInfo>>>,
}

impl PipeProcessExecutor {
    /// Create a new pipe-based executor.
    pub fn new() -> Self {
        Self {
            processes: Arc::new(RwLock::new(HashMap::new())),
        }
    }

    /// Get the number of active processes.
    pub async fn process_count(&self) -> usize {
        self.processes.read().await.len()
    }

    /// List all active process IDs.
    pub async fn list_processes(&self) -> Vec<String> {
        self.processes.read().await.keys().cloned().collect()
    }

    /// Start the output reading task for a process.
    fn start_output_reader(
        &self,
        id: String,
        stdout: ChildStdout,
        stderr: ChildStderr,
        sink: Arc<dyn OutputSink>,
        stop_flag: Arc<AtomicBool>,
    ) {
        // Spawn stdout reader
        let id_stdout = id.clone();
        let sink_stdout = Arc::clone(&sink);
        let stop_stdout = Arc::clone(&stop_flag);

        tokio::spawn(async move {
            debug!(process_id = %id_stdout, "Starting stdout reader");
            Self::read_stream(id_stdout, stdout, OutputType::Stdout, sink_stdout, stop_stdout).await;
        });

        // Spawn stderr reader
        let id_stderr = id.clone();
        let sink_stderr = Arc::clone(&sink);
        let stop_stderr = Arc::clone(&stop_flag);

        tokio::spawn(async move {
            debug!(process_id = %id_stderr, "Starting stderr reader");
            Self::read_stream(id_stderr, stderr, OutputType::Stderr, sink_stderr, stop_stderr).await;
        });

        // Spawn task to close sink when stop flag is set
        let id_closer = id;
        let sink_closer = sink;

        tokio::spawn(async move {
            // Wait for stop signal
            loop {
                if stop_flag.load(Ordering::Relaxed) {
                    break;
                }
                tokio::time::sleep(tokio::time::Duration::from_millis(100)).await;
            }

            // Close the sink
            if let Err(e) = sink_closer.close().await {
                warn!(process_id = %id_closer, error = %e, "Failed to close output sink");
            }
        });
    }

    /// Read from a stream and send to sink.
    async fn read_stream<R: Read + Send + 'static>(
        id: String,
        reader: R,
        output_type: OutputType,
        sink: Arc<dyn OutputSink>,
        stop_flag: Arc<AtomicBool>,
    ) {
        let id_clone = id.clone();

        let result = tokio::task::spawn_blocking(move || {
            let mut buf_reader = BufReader::new(reader);
            let mut buffer = [0u8; 4096];

            loop {
                if stop_flag.load(Ordering::Relaxed) {
                    break;
                }

                match buf_reader.read(&mut buffer) {
                    Ok(0) => break, // EOF
                    Ok(n) => {
                        let content = String::from_utf8_lossy(&buffer[..n]).to_string();
                        let chunk = OutputChunk::new(&id, output_type, content);

                        // Send to sink using runtime handle
                        if let Ok(handle) = tokio::runtime::Handle::try_current() {
                            let sink = Arc::clone(&sink);
                            if handle.block_on(async { sink.send(chunk).await }).is_err() {
                                break;
                            }
                        }
                    }
                    Err(e) => {
                        if e.kind() != std::io::ErrorKind::WouldBlock {
                            debug!(process_id = %id, error = %e, "Read error");
                            break;
                        }
                    }
                }
            }
        })
        .await;

        if let Err(e) = result {
            warn!(process_id = %id_clone, error = %e, "Stream reader task failed");
        }
    }
}

impl Default for PipeProcessExecutor {
    fn default() -> Self {
        Self::new()
    }
}

#[async_trait]
impl ProcessExecutor for PipeProcessExecutor {
    async fn spawn(
        &self,
        id: &str,
        config: SpawnConfig,
        sink: Arc<dyn OutputSink>,
    ) -> ProcessResult<ProcessHandle> {
        debug!(process_id = %id, command = %config.command, "Spawning pipe process");

        // Check if process already exists
        if self.processes.read().await.contains_key(id) {
            return Err(ProcessError::AlreadyExists(id.to_string()));
        }

        // Convert to pipe config and spawn
        let pipe_config: PipeSpawnConfig = config.clone().into();
        let mut child = ProcessSpawner::spawn(pipe_config)
            .map_err(|e| ProcessError::SpawnFailed(e.to_string()))?;

        // Take stdin, stdout, stderr
        let stdin = child.stdin.take();
        let stdout = child.stdout.take()
            .ok_or_else(|| ProcessError::SpawnFailed("Failed to capture stdout".to_string()))?;
        let stderr = child.stderr.take()
            .ok_or_else(|| ProcessError::SpawnFailed("Failed to capture stderr".to_string()))?;

        // Create process handle
        let handle = ProcessHandle::new(id, config);
        handle.set_status(ProcessStatus::Running);

        // Create stop flag
        let stop_flag = Arc::new(AtomicBool::new(false));

        // Store process info
        let process_info = PipeProcessInfo {
            handle: handle.clone(),
            sink: Arc::clone(&sink),
            stop_flag: Arc::clone(&stop_flag),
            exit_code: None,
            stdin,
        };

        self.processes.write().await.insert(id.to_string(), process_info);

        // Start output readers
        self.start_output_reader(id.to_string(), stdout, stderr, sink, stop_flag.clone());

        // Spawn task to wait for process completion
        let id_waiter = id.to_string();
        let processes = Arc::clone(&self.processes);

        tokio::spawn(async move {
            let result = tokio::task::spawn_blocking(move || child.wait()).await;

            let mut procs = processes.write().await;
            if let Some(info) = procs.get_mut(&id_waiter) {
                info.stop_flag.store(true, Ordering::SeqCst);

                match result {
                    Ok(Ok(status)) => {
                        let exit_code = status.code().unwrap_or(-1);
                        info.exit_code = Some(exit_code);
                        if status.success() {
                            info.handle.set_status(ProcessStatus::Completed);
                        } else {
                            info.handle.set_status(ProcessStatus::Failed);
                        }
                    }
                    _ => {
                        info.exit_code = Some(-1);
                        info.handle.set_status(ProcessStatus::Failed);
                    }
                }
            }
        });

        info!(process_id = %id, "Pipe process spawned successfully");

        Ok(handle)
    }

    async fn write(&self, id: &str, data: &[u8]) -> ProcessResult<()> {
        debug!(process_id = %id, bytes = data.len(), "Writing to process");

        let mut processes = self.processes.write().await;
        let info = processes.get_mut(id)
            .ok_or_else(|| ProcessError::NotFound(id.to_string()))?;

        let stdin = info.stdin.as_mut()
            .ok_or_else(|| ProcessError::WriteFailed("No stdin available".to_string()))?;

        stdin.write_all(data)
            .map_err(|e| ProcessError::WriteFailed(e.to_string()))?;

        stdin.flush()
            .map_err(|e| ProcessError::WriteFailed(e.to_string()))?;

        Ok(())
    }

    async fn resize(&self, id: &str, _cols: u16, _rows: u16) -> ProcessResult<()> {
        // Pipe processes don't support resize
        if !self.processes.read().await.contains_key(id) {
            return Err(ProcessError::NotFound(id.to_string()));
        }

        debug!(process_id = %id, "Resize not supported for pipe processes");
        Ok(())
    }

    async fn kill(&self, id: &str) -> ProcessResult<()> {
        info!(process_id = %id, "Killing pipe process");

        let processes = self.processes.read().await;
        if let Some(info) = processes.get(id) {
            info.stop_flag.store(true, Ordering::SeqCst);
            info.handle.set_status(ProcessStatus::Killed);
        } else {
            return Err(ProcessError::NotFound(id.to_string()));
        }

        Ok(())
    }

    async fn wait(&self, id: &str) -> ProcessResult<Option<i32>> {
        debug!(process_id = %id, "Waiting for pipe process");

        // Poll for completion
        loop {
            {
                let processes = self.processes.read().await;
                if let Some(info) = processes.get(id) {
                    if info.handle.status().is_terminated() {
                        return Ok(info.exit_code);
                    }
                } else {
                    return Err(ProcessError::NotFound(id.to_string()));
                }
            }

            tokio::time::sleep(tokio::time::Duration::from_millis(50)).await;
        }
    }

    async fn exists(&self, id: &str) -> bool {
        self.processes.read().await.contains_key(id)
    }

    async fn status(&self, id: &str) -> ProcessResult<ProcessStatus> {
        let processes = self.processes.read().await;

        if let Some(info) = processes.get(id) {
            Ok(info.handle.status())
        } else {
            Err(ProcessError::NotFound(id.to_string()))
        }
    }

    async fn close(&self, id: &str) -> ProcessResult<()> {
        debug!(process_id = %id, "Closing pipe process");

        let mut processes = self.processes.write().await;
        if let Some(info) = processes.remove(id) {
            info.stop_flag.store(true, Ordering::SeqCst);
        }

        info!(process_id = %id, "Pipe process closed");

        Ok(())
    }
}

// Ensure the executor is Send + Sync
static_assertions::assert_impl_all!(PipeProcessExecutor: Send, Sync);

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_pipe_spawn_config_default() {
        let config = PipeSpawnConfig::default();
        assert!(config.command.is_empty());
        assert!(config.args.is_empty());
        assert!(config.cwd.is_none());
        assert!(config.env.is_empty());
        assert!(config.inherit_env);
    }

    #[test]
    fn test_pipe_spawn_config_new() {
        let config = PipeSpawnConfig::new("git", &["status", "-s"]);
        assert_eq!(config.command, "git");
        assert_eq!(config.args, vec!["status", "-s"]);
    }

    #[test]
    fn test_pipe_spawn_config_builder() {
        let config = PipeSpawnConfig::new("ls", &["-la"])
            .with_cwd("/tmp")
            .with_env("TERM", "dumb")
            .with_inherit_env(false);

        assert_eq!(config.cwd, Some(PathBuf::from("/tmp")));
        assert_eq!(config.env.get("TERM"), Some(&"dumb".to_string()));
        assert!(!config.inherit_env);
    }

    #[test]
    fn test_spawn_echo() {
        let result = ProcessSpawner::spawn_simple("echo", &["hello"]);
        assert!(result.is_ok());

        let mut child = result.unwrap();
        let status = child.wait().unwrap();
        assert!(status.success());
    }

    #[test]
    fn test_spawn_with_config() {
        let config = PipeSpawnConfig::new("echo", &["test"]);
        let result = ProcessSpawner::spawn(config);
        assert!(result.is_ok());

        let mut child = result.unwrap();
        let status = child.wait().unwrap();
        assert!(status.success());
    }

    #[test]
    fn test_run_capture() {
        let config = PipeSpawnConfig::new("echo", &["hello"]);
        let result = ProcessSpawner::run_capture(config);
        assert!(result.is_ok());

        let (stdout, stderr, exit_code) = result.unwrap();
        assert!(stdout.contains("hello"));
        assert!(stderr.is_empty());
        assert_eq!(exit_code, 0);
    }

    #[test]
    fn test_run() {
        let config = PipeSpawnConfig::command("true");
        let result = ProcessSpawner::run(config);
        assert!(result.is_ok());
        assert_eq!(result.unwrap(), 0);

        let config = PipeSpawnConfig::command("false");
        let result = ProcessSpawner::run(config);
        assert!(result.is_ok());
        assert_ne!(result.unwrap(), 0);
    }

    #[test]
    fn test_invalid_working_directory() {
        let config = PipeSpawnConfig::command("ls")
            .with_cwd("/nonexistent/path/that/should/not/exist");

        let result = ProcessSpawner::spawn(config);
        assert!(matches!(result, Err(SpawnError::InvalidWorkingDirectory(_))));
    }

    #[test]
    fn test_spawn_error_display() {
        let err = SpawnError::InvalidWorkingDirectory(PathBuf::from("/test"));
        assert!(err.to_string().contains("Invalid working directory"));

        let err = SpawnError::CommandNotFound("test".to_string());
        assert!(err.to_string().contains("Command not found"));
    }

    // ========================================================================
    // Config conversion tests
    // ========================================================================

    #[test]
    fn test_spawn_config_to_pipe_config() {
        let spawn_config = SpawnConfig::new("git", &["status"])
            .with_cwd("/tmp")
            .with_env("TERM", "dumb")
            .with_size(120, 40);

        let pipe_config: PipeSpawnConfig = spawn_config.into();

        assert_eq!(pipe_config.command, "git");
        assert_eq!(pipe_config.args, vec!["status"]);
        assert_eq!(pipe_config.cwd, Some(PathBuf::from("/tmp")));
        assert_eq!(pipe_config.env.get("TERM"), Some(&"dumb".to_string()));
        // PTY-specific settings are not preserved
    }

    #[test]
    fn test_pipe_config_to_spawn_config() {
        let pipe_config = PipeSpawnConfig::new("cargo", &["build"])
            .with_cwd("/home/project")
            .with_env("RUST_BACKTRACE", "1");

        let spawn_config: SpawnConfig = pipe_config.into();

        assert_eq!(spawn_config.command, "cargo");
        assert_eq!(spawn_config.args, vec!["build"]);
        assert_eq!(spawn_config.cwd, Some(PathBuf::from("/home/project")));
        assert_eq!(spawn_config.env.get("RUST_BACKTRACE"), Some(&"1".to_string()));
        // PTY settings use defaults
        assert_eq!(spawn_config.cols, 80);
        assert_eq!(spawn_config.rows, 24);
        assert!(!spawn_config.use_pty);
    }

    // ========================================================================
    // Async tests
    // ========================================================================

    #[tokio::test]
    async fn test_run_capture_async() {
        let config = PipeSpawnConfig::new("echo", &["async test"]);
        let result = ProcessSpawner::run_capture_async(config).await;
        assert!(result.is_ok());

        let (stdout, stderr, exit_code) = result.unwrap();
        assert!(stdout.contains("async test"));
        assert!(stderr.is_empty());
        assert_eq!(exit_code, 0);
    }

    #[tokio::test]
    async fn test_run_async() {
        let config = PipeSpawnConfig::command("true");
        let result = ProcessSpawner::run_async(config).await;
        assert!(result.is_ok());
        assert_eq!(result.unwrap(), 0);
    }

    // ========================================================================
    // PipeProcessExecutor tests
    // ========================================================================

    use crate::executor::{CollectorSink, NullSink};
    use std::time::Duration;

    #[tokio::test]
    async fn test_pipe_executor_creation() {
        let executor = PipeProcessExecutor::new();
        assert_eq!(executor.process_count().await, 0);
        assert!(executor.list_processes().await.is_empty());
    }

    #[tokio::test]
    async fn test_pipe_executor_spawn_echo() {
        let executor = PipeProcessExecutor::new();
        let sink = Arc::new(CollectorSink::new());

        let config = SpawnConfig::new("echo", &["pipe", "test"]);
        let handle = executor.spawn("pipe-echo", config, sink.clone()).await;

        assert!(handle.is_ok());
        let handle = handle.unwrap();
        assert_eq!(handle.id(), "pipe-echo");
        assert!(executor.exists("pipe-echo").await);

        // Wait for the process to complete
        tokio::time::sleep(Duration::from_millis(200)).await;

        // Check output
        let output = sink.stdout().await;
        assert!(
            output.contains("pipe") || output.contains("test"),
            "Output: {}",
            output
        );

        // Cleanup
        let _ = executor.close("pipe-echo").await;
    }

    #[tokio::test]
    async fn test_pipe_executor_duplicate_id() {
        let executor = PipeProcessExecutor::new();
        let sink = Arc::new(NullSink);

        let config = SpawnConfig::new("sleep", &["10"]);

        // First spawn should succeed
        let result = executor.spawn("pipe-dup", config.clone(), sink.clone()).await;
        assert!(result.is_ok());

        // Second spawn with same ID should fail
        let result = executor.spawn("pipe-dup", config, sink).await;
        assert!(matches!(result, Err(ProcessError::AlreadyExists(_))));

        // Cleanup
        let _ = executor.kill("pipe-dup").await;
        let _ = executor.close("pipe-dup").await;
    }

    #[tokio::test]
    async fn test_pipe_executor_write() {
        let executor = PipeProcessExecutor::new();
        let sink = Arc::new(NullSink);

        // Start cat to echo input
        let config = SpawnConfig::new("cat", &[] as &[&str]);
        let _ = executor.spawn("pipe-cat", config, sink).await.unwrap();

        // Write some data
        let result = executor.write("pipe-cat", b"hello\n").await;
        assert!(result.is_ok());

        // Cleanup
        let _ = executor.kill("pipe-cat").await;
        let _ = executor.close("pipe-cat").await;
    }

    #[tokio::test]
    async fn test_pipe_executor_write_nonexistent() {
        let executor = PipeProcessExecutor::new();

        let result = executor.write("nonexistent", b"data").await;
        assert!(matches!(result, Err(ProcessError::NotFound(_))));
    }

    #[tokio::test]
    async fn test_pipe_executor_resize_noop() {
        let executor = PipeProcessExecutor::new();
        let sink = Arc::new(NullSink);

        let config = SpawnConfig::new("sleep", &["1"]);
        let _ = executor.spawn("pipe-resize", config, sink).await.unwrap();

        // Resize should succeed but be a no-op
        let result = executor.resize("pipe-resize", 120, 40).await;
        assert!(result.is_ok());

        // Cleanup
        let _ = executor.kill("pipe-resize").await;
        let _ = executor.close("pipe-resize").await;
    }

    #[tokio::test]
    async fn test_pipe_executor_kill() {
        let executor = PipeProcessExecutor::new();
        let sink = Arc::new(NullSink);

        let config = SpawnConfig::new("sleep", &["60"]);
        let _ = executor.spawn("pipe-kill", config, sink).await.unwrap();

        // Kill should succeed
        let result = executor.kill("pipe-kill").await;
        assert!(result.is_ok());

        // Status should be Killed
        let status = executor.status("pipe-kill").await.unwrap();
        assert_eq!(status, ProcessStatus::Killed);

        // Cleanup
        let _ = executor.close("pipe-kill").await;
    }

    #[tokio::test]
    async fn test_pipe_executor_wait() {
        let executor = PipeProcessExecutor::new();
        let sink = Arc::new(NullSink);

        // Short-lived process
        let config = SpawnConfig::new("echo", &["quick"]);
        let _ = executor.spawn("pipe-wait", config, sink).await.unwrap();

        // Wait should return exit code
        let result = executor.wait("pipe-wait").await;
        assert!(result.is_ok());
        let exit_code = result.unwrap();
        assert_eq!(exit_code, Some(0));

        // Cleanup
        let _ = executor.close("pipe-wait").await;
    }

    #[tokio::test]
    async fn test_pipe_executor_close() {
        let executor = PipeProcessExecutor::new();
        let sink = Arc::new(NullSink);

        let config = SpawnConfig::new("sleep", &["10"]);
        let _ = executor.spawn("pipe-close", config, sink).await.unwrap();

        assert!(executor.exists("pipe-close").await);

        // Close should remove it
        let result = executor.close("pipe-close").await;
        assert!(result.is_ok());
        assert!(!executor.exists("pipe-close").await);
    }

    #[tokio::test]
    async fn test_pipe_executor_list_processes() {
        let executor = PipeProcessExecutor::new();
        let sink = Arc::new(NullSink);

        // Spawn multiple processes
        for i in 0..3 {
            let config = SpawnConfig::new("sleep", &["10"]);
            let _ = executor
                .spawn(&format!("pipe-list-{}", i), config, sink.clone())
                .await
                .unwrap();
        }

        let processes = executor.list_processes().await;
        assert_eq!(processes.len(), 3);

        // Cleanup
        for i in 0..3 {
            let _ = executor.kill(&format!("pipe-list-{}", i)).await;
            let _ = executor.close(&format!("pipe-list-{}", i)).await;
        }
    }

    #[tokio::test]
    async fn test_pipe_executor_with_cwd() {
        let executor = PipeProcessExecutor::new();
        let sink = Arc::new(CollectorSink::new());

        let config = SpawnConfig::new("pwd", &[] as &[&str]).with_cwd("/tmp");
        let _ = executor.spawn("pipe-cwd", config, sink.clone()).await.unwrap();

        // Wait for output
        tokio::time::sleep(Duration::from_millis(200)).await;

        let output = sink.stdout().await;
        assert!(output.contains("/tmp") || output.contains("private/tmp"));

        // Cleanup
        let _ = executor.close("pipe-cwd").await;
    }

    #[tokio::test]
    async fn test_pipe_executor_with_env() {
        let executor = PipeProcessExecutor::new();
        let sink = Arc::new(CollectorSink::new());

        let config = SpawnConfig::new("sh", &["-c", "echo $PIPE_TEST_VAR"])
            .with_env("PIPE_TEST_VAR", "pipe_value");
        let _ = executor.spawn("pipe-env", config, sink.clone()).await.unwrap();

        // Wait for output
        tokio::time::sleep(Duration::from_millis(200)).await;

        let output = sink.stdout().await;
        assert!(output.contains("pipe_value"), "Output: {}", output);

        // Cleanup
        let _ = executor.close("pipe-env").await;
    }

    #[tokio::test]
    async fn test_pipe_executor_stderr_capture() {
        let executor = PipeProcessExecutor::new();
        let sink = Arc::new(CollectorSink::new());

        // Command that writes to stderr
        let config = SpawnConfig::new("sh", &["-c", "echo stderr_test >&2"]);
        let _ = executor.spawn("pipe-stderr", config, sink.clone()).await.unwrap();

        // Wait for output
        tokio::time::sleep(Duration::from_millis(200)).await;

        let output = sink.stderr().await;
        assert!(output.contains("stderr_test"), "Stderr: {}", output);

        // Cleanup
        let _ = executor.close("pipe-stderr").await;
    }
}
