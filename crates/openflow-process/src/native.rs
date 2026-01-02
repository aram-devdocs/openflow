//! Native PTY Executor implementation.
//!
//! This module provides a `ProcessExecutor` implementation that uses
//! pseudo-terminals (PTY) for interactive process execution. It wraps
//! the `PtyManager` and provides async interfaces for process management.
//!
//! # Features
//!
//! - Cross-platform PTY support via `portable-pty`
//! - Async output streaming to `OutputSink`
//! - Terminal resize support
//! - Process lifecycle management
//!
//! # Example
//!
//! ```ignore
//! use openflow_process::{NativePtyExecutor, ProcessExecutor, SpawnConfig, NullSink};
//! use std::sync::Arc;
//!
//! #[tokio::main]
//! async fn main() -> Result<(), Box<dyn std::error::Error>> {
//!     let executor = NativePtyExecutor::new();
//!     let sink = Arc::new(NullSink);
//!
//!     let config = SpawnConfig::new("echo", &["hello", "world"]);
//!     let handle = executor.spawn("proc-1", config, sink).await?;
//!
//!     // Wait for the process to complete
//!     let exit_code = executor.wait("proc-1").await?;
//!     println!("Process exited with code: {:?}", exit_code);
//!
//!     Ok(())
//! }
//! ```

use async_trait::async_trait;
use std::collections::HashMap;
use std::io::Read;
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Arc;
use tokio::sync::RwLock;
use tracing::{debug, error, info, warn};

use crate::error::{ProcessError, ProcessResult};
use crate::executor::{OutputSink, ProcessExecutor};
use crate::pty::{PtyConfig, PtyManager, PtySize};
use crate::types::{OutputChunk, OutputType, ProcessHandle, ProcessStatus, SpawnConfig};

/// Information about a running process.
struct ProcessInfo {
    /// Handle to the process.
    handle: ProcessHandle,
    /// Output sink for streaming output.
    /// Stored for potential future use (e.g., sink recovery, status reporting).
    #[allow(dead_code)]
    sink: Arc<dyn OutputSink>,
    /// Flag to signal the output reader to stop.
    stop_flag: Arc<AtomicBool>,
    /// Cached exit code once the process completes.
    exit_code: Option<i32>,
}

/// Native PTY-based process executor.
///
/// This executor uses pseudo-terminals for interactive process execution,
/// which is essential for CLI tools that expect a terminal environment
/// (colors, cursor control, etc.).
///
/// # Thread Safety
///
/// The executor is designed to be shared across threads (`Send + Sync`).
/// All operations use async locking to prevent blocking.
pub struct NativePtyExecutor {
    /// The underlying PTY manager.
    pty_manager: Arc<PtyManager>,
    /// Map of process IDs to process info.
    processes: Arc<RwLock<HashMap<String, ProcessInfo>>>,
}

impl NativePtyExecutor {
    /// Create a new PTY executor.
    pub fn new() -> Self {
        Self {
            pty_manager: Arc::new(PtyManager::new()),
            processes: Arc::new(RwLock::new(HashMap::new())),
        }
    }

    /// Create a PTY executor with a custom PtyManager.
    ///
    /// This is useful for sharing a PtyManager across multiple executors
    /// or for testing purposes.
    pub fn with_manager(manager: Arc<PtyManager>) -> Self {
        Self {
            pty_manager: manager,
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
    ///
    /// This spawns a background task that reads from the PTY and sends
    /// output chunks to the sink.
    fn start_output_reader(
        &self,
        id: String,
        sink: Arc<dyn OutputSink>,
        stop_flag: Arc<AtomicBool>,
    ) {
        let pty_manager = Arc::clone(&self.pty_manager);
        let processes = Arc::clone(&self.processes);

        tokio::spawn(async move {
            debug!(process_id = %id, "Starting output reader task");

            // Get a reader from the PTY
            let reader = match pty_manager.try_clone_reader(&id) {
                Ok(r) => r,
                Err(e) => {
                    error!(process_id = %id, error = %e, "Failed to get PTY reader");
                    return;
                }
            };

            // Read output in a blocking task
            let output_result =
                Self::read_output_blocking(id.clone(), reader, sink.clone(), stop_flag).await;

            if let Err(e) = output_result {
                warn!(process_id = %id, error = %e, "Output reader finished with error");
            }

            // Close the sink
            if let Err(e) = sink.close().await {
                warn!(process_id = %id, error = %e, "Failed to close output sink");
            }

            // Update process status if still tracked
            let mut procs = processes.write().await;
            if let Some(info) = procs.get_mut(&id) {
                // Check if process exited
                if let Ok(Some(status)) = pty_manager.try_wait(&id) {
                    let exit_code = status.exit_code() as i32;
                    info.exit_code = Some(exit_code);

                    if status.success() {
                        info.handle.set_status(ProcessStatus::Completed);
                    } else {
                        info.handle.set_status(ProcessStatus::Failed);
                    }
                }
            }

            debug!(process_id = %id, "Output reader task completed");
        });
    }

    /// Read output from the PTY in a blocking manner.
    ///
    /// This runs in a blocking task pool to avoid blocking the async runtime.
    async fn read_output_blocking(
        id: String,
        mut reader: Box<dyn Read + Send>,
        sink: Arc<dyn OutputSink>,
        stop_flag: Arc<AtomicBool>,
    ) -> ProcessResult<()> {
        let id_clone = id.clone();

        tokio::task::spawn_blocking(move || {
            let mut buffer = [0u8; 4096];

            loop {
                // Check if we should stop
                if stop_flag.load(Ordering::Relaxed) {
                    debug!(process_id = %id_clone, "Stop flag set, exiting reader");
                    break;
                }

                // Read from the PTY
                match reader.read(&mut buffer) {
                    Ok(0) => {
                        // EOF - process has likely exited
                        debug!(process_id = %id_clone, "EOF reached");
                        break;
                    }
                    Ok(n) => {
                        // Convert to string (lossy, handles non-UTF8)
                        let content = String::from_utf8_lossy(&buffer[..n]).to_string();

                        // Send to sink (use tokio runtime)
                        let chunk = OutputChunk::new(&id_clone, OutputType::Stdout, content);
                        let sink_clone = Arc::clone(&sink);

                        // We need to send from the blocking context
                        // Use a channel or handle to communicate
                        let rt = tokio::runtime::Handle::try_current();
                        if let Ok(handle) = rt {
                            let send_result = handle.block_on(async { sink_clone.send(chunk).await });

                            if let Err(e) = send_result {
                                warn!(process_id = %id_clone, error = %e, "Failed to send output chunk");
                            }
                        }
                    }
                    Err(e) => {
                        // Check if it's a "would block" error (non-blocking I/O)
                        if e.kind() == std::io::ErrorKind::WouldBlock {
                            // Sleep briefly and retry
                            std::thread::sleep(std::time::Duration::from_millis(10));
                            continue;
                        }

                        // Check for "broken pipe" or similar (process exited)
                        if e.kind() == std::io::ErrorKind::BrokenPipe
                            || e.kind() == std::io::ErrorKind::ConnectionReset
                            || e.kind() == std::io::ErrorKind::UnexpectedEof
                        {
                            debug!(process_id = %id_clone, "Pipe closed, process likely exited");
                            break;
                        }

                        error!(process_id = %id_clone, error = %e, "Read error");
                        return Err(ProcessError::ReadFailed(e.to_string()));
                    }
                }
            }

            Ok(())
        })
        .await
        .map_err(|e| ProcessError::Internal(format!("Task join error: {}", e)))?
    }

    /// Convert SpawnConfig to PtyConfig.
    fn to_pty_config(config: &SpawnConfig) -> PtyConfig {
        let mut pty_config = PtyConfig::new(&config.command, &config.args);

        if let Some(cwd) = &config.cwd {
            pty_config = pty_config.with_cwd(cwd);
        }

        // Build environment
        let mut env = config.env.clone();

        // Inherit parent environment if requested
        if config.inherit_env {
            for (key, value) in std::env::vars() {
                // Don't override explicitly set variables
                env.entry(key).or_insert(value);
            }
        }

        // Ensure TERM is set for proper terminal behavior
        if !env.contains_key("TERM") {
            env.insert("TERM".to_string(), "xterm-256color".to_string());
        }

        pty_config = pty_config.with_env(env);
        pty_config = pty_config.with_size(config.cols, config.rows);

        pty_config
    }
}

impl Default for NativePtyExecutor {
    fn default() -> Self {
        Self::new()
    }
}

#[async_trait]
impl ProcessExecutor for NativePtyExecutor {
    async fn spawn(
        &self,
        id: &str,
        config: SpawnConfig,
        sink: Arc<dyn OutputSink>,
    ) -> ProcessResult<ProcessHandle> {
        debug!(process_id = %id, command = %config.command, "Spawning process");

        // Check if process already exists
        if self.processes.read().await.contains_key(id) {
            return Err(ProcessError::AlreadyExists(id.to_string()));
        }

        // Convert to PTY config
        let pty_config = Self::to_pty_config(&config);

        // Create the PTY
        self.pty_manager
            .create(id, pty_config)
            .map_err(ProcessError::from)?;

        // Create process handle
        let handle = ProcessHandle::new(id, config.clone());
        handle.set_status(ProcessStatus::Running);

        // Create stop flag for output reader
        let stop_flag = Arc::new(AtomicBool::new(false));

        // Store process info
        let process_info = ProcessInfo {
            handle: handle.clone(),
            sink: Arc::clone(&sink),
            stop_flag: Arc::clone(&stop_flag),
            exit_code: None,
        };

        self.processes
            .write()
            .await
            .insert(id.to_string(), process_info);

        // Start output reader task
        self.start_output_reader(id.to_string(), sink, stop_flag);

        info!(process_id = %id, command = %config.command, "Process spawned successfully");

        Ok(handle)
    }

    async fn write(&self, id: &str, data: &[u8]) -> ProcessResult<()> {
        debug!(process_id = %id, bytes = data.len(), "Writing to process");

        // Check if process exists
        if !self.processes.read().await.contains_key(id) {
            return Err(ProcessError::NotFound(id.to_string()));
        }

        // Write to PTY
        self.pty_manager
            .write(id, data)
            .map_err(ProcessError::from)?;

        Ok(())
    }

    async fn resize(&self, id: &str, cols: u16, rows: u16) -> ProcessResult<()> {
        debug!(process_id = %id, cols, rows, "Resizing terminal");

        // Check if process exists
        if !self.processes.read().await.contains_key(id) {
            return Err(ProcessError::NotFound(id.to_string()));
        }

        // Resize PTY
        let size = PtySize { cols, rows };
        self.pty_manager
            .resize(id, size)
            .map_err(ProcessError::from)?;

        Ok(())
    }

    async fn kill(&self, id: &str) -> ProcessResult<()> {
        info!(process_id = %id, "Killing process");

        // Get process info and set stop flag
        {
            let processes = self.processes.read().await;
            if let Some(info) = processes.get(id) {
                info.stop_flag.store(true, Ordering::SeqCst);
                info.handle.set_status(ProcessStatus::Killed);
            } else {
                return Err(ProcessError::NotFound(id.to_string()));
            }
        }

        // Kill the PTY process
        self.pty_manager
            .kill(id)
            .map_err(ProcessError::from)?;

        Ok(())
    }

    async fn wait(&self, id: &str) -> ProcessResult<Option<i32>> {
        debug!(process_id = %id, "Waiting for process to complete");

        // Check if we already have the exit code cached
        {
            let processes = self.processes.read().await;
            if let Some(info) = processes.get(id) {
                if let Some(exit_code) = info.exit_code {
                    return Ok(Some(exit_code));
                }
            } else {
                return Err(ProcessError::NotFound(id.to_string()));
            }
        }

        // Wait for the process in a blocking task
        let pty_manager = Arc::clone(&self.pty_manager);
        let id_owned = id.to_string();

        let exit_status = tokio::task::spawn_blocking(move || pty_manager.wait(&id_owned))
            .await
            .map_err(|e| ProcessError::Internal(format!("Task join error: {}", e)))?
            .map_err(ProcessError::from)?;

        let exit_code = exit_status.exit_code() as i32;

        // Update the cached exit code and status
        {
            let mut processes = self.processes.write().await;
            if let Some(info) = processes.get_mut(id) {
                info.exit_code = Some(exit_code);
                if exit_status.success() {
                    info.handle.set_status(ProcessStatus::Completed);
                } else {
                    info.handle.set_status(ProcessStatus::Failed);
                }
            }
        }

        info!(process_id = %id, exit_code, "Process completed");

        Ok(Some(exit_code))
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
        debug!(process_id = %id, "Closing process");

        // Set stop flag and remove from tracking
        {
            let mut processes = self.processes.write().await;
            if let Some(info) = processes.remove(id) {
                info.stop_flag.store(true, Ordering::SeqCst);
            }
        }

        // Close the PTY
        self.pty_manager
            .close(id)
            .map_err(ProcessError::from)?;

        info!(process_id = %id, "Process closed");

        Ok(())
    }
}

// Ensure the executor is Send + Sync
static_assertions::assert_impl_all!(NativePtyExecutor: Send, Sync);

#[cfg(test)]
mod tests {
    use super::*;
    use crate::executor::{CollectorSink, NullSink};
    use std::time::Duration;

    #[tokio::test]
    async fn test_executor_creation() {
        let executor = NativePtyExecutor::new();
        assert_eq!(executor.process_count().await, 0);
    }

    #[tokio::test]
    async fn test_spawn_echo() {
        let executor = NativePtyExecutor::new();
        let sink = Arc::new(CollectorSink::new());

        let config = SpawnConfig::new("echo", &["hello", "world"]);
        let handle = executor.spawn("test-echo", config, sink.clone()).await;

        assert!(handle.is_ok());
        let handle = handle.unwrap();
        assert_eq!(handle.id(), "test-echo");
        assert!(executor.exists("test-echo").await);

        // Wait for the process to complete
        tokio::time::sleep(Duration::from_millis(200)).await;

        // Check output contains "hello world"
        let output = sink.stdout().await;
        assert!(
            output.contains("hello") || output.contains("world"),
            "Output: {}",
            output
        );

        // Cleanup
        let _ = executor.close("test-echo").await;
    }

    #[tokio::test]
    async fn test_spawn_duplicate_id() {
        let executor = NativePtyExecutor::new();
        let sink = Arc::new(NullSink);

        let config = SpawnConfig::new("sleep", &["10"]);

        // First spawn should succeed
        let result = executor.spawn("dup-test", config.clone(), sink.clone()).await;
        assert!(result.is_ok());

        // Second spawn with same ID should fail
        let result = executor.spawn("dup-test", config, sink).await;
        assert!(matches!(result, Err(ProcessError::AlreadyExists(_))));

        // Cleanup
        let _ = executor.kill("dup-test").await;
        let _ = executor.close("dup-test").await;
    }

    #[tokio::test]
    async fn test_write_to_process() {
        let executor = NativePtyExecutor::new();
        let sink = Arc::new(NullSink);

        // Start a cat process that echoes input
        let config = SpawnConfig::new("cat", &[] as &[&str]);
        let _ = executor.spawn("cat-test", config, sink).await.unwrap();

        // Write some data
        let result = executor.write("cat-test", b"hello\n").await;
        assert!(result.is_ok());

        // Cleanup
        let _ = executor.kill("cat-test").await;
        let _ = executor.close("cat-test").await;
    }

    #[tokio::test]
    async fn test_write_to_nonexistent() {
        let executor = NativePtyExecutor::new();

        let result = executor.write("nonexistent", b"data").await;
        assert!(matches!(result, Err(ProcessError::NotFound(_))));
    }

    #[tokio::test]
    async fn test_resize_process() {
        let executor = NativePtyExecutor::new();
        let sink = Arc::new(NullSink);

        let config = SpawnConfig::new("sleep", &["1"]);
        let _ = executor.spawn("resize-test", config, sink).await.unwrap();

        // Resize should succeed
        let result = executor.resize("resize-test", 120, 40).await;
        assert!(result.is_ok());

        // Cleanup
        let _ = executor.kill("resize-test").await;
        let _ = executor.close("resize-test").await;
    }

    #[tokio::test]
    async fn test_kill_process() {
        let executor = NativePtyExecutor::new();
        let sink = Arc::new(NullSink);

        let config = SpawnConfig::new("sleep", &["60"]);
        let _ = executor.spawn("kill-test", config, sink).await.unwrap();

        // Kill should succeed
        let result = executor.kill("kill-test").await;
        assert!(result.is_ok());

        // Status should be Killed
        let status = executor.status("kill-test").await.unwrap();
        assert_eq!(status, ProcessStatus::Killed);

        // Cleanup
        let _ = executor.close("kill-test").await;
    }

    #[tokio::test]
    async fn test_wait_for_completion() {
        let executor = NativePtyExecutor::new();
        let sink = Arc::new(NullSink);

        // Short-lived process
        let config = SpawnConfig::new("echo", &["done"]);
        let _ = executor.spawn("wait-test", config, sink).await.unwrap();

        // Wait should return exit code
        let result = executor.wait("wait-test").await;
        assert!(result.is_ok());
        let exit_code = result.unwrap();
        assert_eq!(exit_code, Some(0)); // echo exits with 0

        // Cleanup
        let _ = executor.close("wait-test").await;
    }

    #[tokio::test]
    async fn test_status_transitions() {
        let executor = NativePtyExecutor::new();
        let sink = Arc::new(NullSink);

        let config = SpawnConfig::new("sleep", &["0.1"]);
        let _ = executor.spawn("status-test", config, sink).await.unwrap();

        // Initially should be Running
        let status = executor.status("status-test").await.unwrap();
        assert!(status.is_running());

        // Wait for completion
        tokio::time::sleep(Duration::from_millis(200)).await;

        // Now try_wait should show completion
        let _ = executor.wait("status-test").await;
        let status = executor.status("status-test").await.unwrap();
        assert!(status.is_terminated());

        // Cleanup
        let _ = executor.close("status-test").await;
    }

    #[tokio::test]
    async fn test_close_removes_process() {
        let executor = NativePtyExecutor::new();
        let sink = Arc::new(NullSink);

        let config = SpawnConfig::new("sleep", &["10"]);
        let _ = executor.spawn("close-test", config, sink).await.unwrap();

        assert!(executor.exists("close-test").await);

        // Close should remove it
        let result = executor.close("close-test").await;
        assert!(result.is_ok());
        assert!(!executor.exists("close-test").await);
    }

    #[tokio::test]
    async fn test_list_processes() {
        let executor = NativePtyExecutor::new();
        let sink = Arc::new(NullSink);

        // Spawn multiple processes
        for i in 0..3 {
            let config = SpawnConfig::new("sleep", &["10"]);
            let _ = executor
                .spawn(&format!("list-{}", i), config, sink.clone())
                .await
                .unwrap();
        }

        let processes = executor.list_processes().await;
        assert_eq!(processes.len(), 3);

        // Cleanup
        for i in 0..3 {
            let _ = executor.kill(&format!("list-{}", i)).await;
            let _ = executor.close(&format!("list-{}", i)).await;
        }
    }

    #[tokio::test]
    async fn test_spawn_with_cwd() {
        let executor = NativePtyExecutor::new();
        let sink = Arc::new(CollectorSink::new());

        let config = SpawnConfig::new("pwd", &[] as &[&str]).with_cwd("/tmp");
        let _ = executor.spawn("cwd-test", config, sink.clone()).await.unwrap();

        // Wait for output
        tokio::time::sleep(Duration::from_millis(200)).await;

        let output = sink.stdout().await;
        assert!(output.contains("/tmp") || output.contains("private/tmp"));

        // Cleanup
        let _ = executor.close("cwd-test").await;
    }

    #[tokio::test]
    async fn test_spawn_with_env() {
        let executor = NativePtyExecutor::new();
        let sink = Arc::new(CollectorSink::new());

        let config = SpawnConfig::new("sh", &["-c", "echo $MY_VAR"])
            .with_env("MY_VAR", "test_value");
        let _ = executor.spawn("env-test", config, sink.clone()).await.unwrap();

        // Wait for output
        tokio::time::sleep(Duration::from_millis(200)).await;

        let output = sink.stdout().await;
        assert!(output.contains("test_value"), "Output: {}", output);

        // Cleanup
        let _ = executor.close("env-test").await;
    }
}
