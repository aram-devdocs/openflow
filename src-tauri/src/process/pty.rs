//! PTY (pseudo-terminal) management module.
//!
//! Provides functionality for creating and managing pseudo-terminals
//! for interactive process execution. This module uses the `portable-pty`
//! crate for cross-platform PTY support.

use portable_pty::{
    native_pty_system, Child, CommandBuilder, MasterPty, PtySize as PortablePtySize,
};
use std::collections::HashMap;
use std::io::{Read, Write};
use std::path::PathBuf;
use std::sync::{Arc, Mutex};
use thiserror::Error;

/// Errors that can occur during PTY operations.
#[derive(Debug, Error)]
pub enum PtyError {
    #[error("Failed to create PTY: {0}")]
    CreateFailed(String),

    #[error("Failed to spawn process in PTY: {0}")]
    SpawnFailed(String),

    #[error("PTY write error: {0}")]
    WriteFailed(String),

    #[error("PTY read error: {0}")]
    ReadFailed(String),

    #[error("PTY resize error: {0}")]
    ResizeFailed(String),

    #[error("PTY not found: {0}")]
    NotFound(String),

    #[error("PTY already exists: {0}")]
    AlreadyExists(String),

    #[error("Process exited: {0}")]
    ProcessExited(String),

    #[error("Lock poisoned")]
    LockPoisoned,
}

/// Result type for PTY operations.
pub type PtyResult<T> = Result<T, PtyError>;

/// Configuration for creating a PTY.
#[derive(Debug, Clone)]
pub struct PtyConfig {
    /// The command to execute in the PTY.
    pub command: String,
    /// Arguments to pass to the command.
    pub args: Vec<String>,
    /// Working directory for the process.
    pub cwd: Option<PathBuf>,
    /// Environment variables to set.
    pub env: HashMap<String, String>,
    /// Initial terminal width in columns.
    pub cols: u16,
    /// Initial terminal height in rows.
    pub rows: u16,
}

impl Default for PtyConfig {
    fn default() -> Self {
        Self {
            command: String::new(),
            args: Vec::new(),
            cwd: None,
            env: HashMap::new(),
            cols: 80,
            rows: 24,
        }
    }
}

/// PTY size in columns and rows.
#[derive(Debug, Clone, Copy)]
pub struct PtySize {
    pub cols: u16,
    pub rows: u16,
}

impl Default for PtySize {
    fn default() -> Self {
        Self { cols: 80, rows: 24 }
    }
}

impl From<PtySize> for PortablePtySize {
    fn from(size: PtySize) -> Self {
        PortablePtySize {
            rows: size.rows,
            cols: size.cols,
            pixel_width: 0,
            pixel_height: 0,
        }
    }
}

/// Represents an active PTY instance.
struct PtyInstance {
    /// The master side of the PTY for reading/writing.
    master: Box<dyn MasterPty + Send>,
    /// The child process running in the PTY.
    child: Box<dyn Child + Send + Sync>,
    /// Current terminal size.
    size: PtySize,
}

/// Manager for PTY instances.
///
/// This struct handles the creation, management, and cleanup of
/// pseudo-terminal instances for interactive process execution.
pub struct PtyManager {
    /// Map of process IDs to PTY instances.
    instances: Arc<Mutex<HashMap<String, PtyInstance>>>,
}

impl PtyManager {
    /// Create a new PTY manager.
    pub fn new() -> Self {
        Self {
            instances: Arc::new(Mutex::new(HashMap::new())),
        }
    }

    /// Create a new PTY with the given configuration.
    ///
    /// # Arguments
    ///
    /// * `id` - Unique identifier for the PTY instance
    /// * `config` - Configuration for the PTY
    ///
    /// # Returns
    ///
    /// Returns a result indicating success or failure.
    pub fn create(&self, id: &str, config: PtyConfig) -> PtyResult<()> {
        let mut instances = self.instances.lock().map_err(|_| PtyError::LockPoisoned)?;

        // Check if PTY already exists
        if instances.contains_key(id) {
            return Err(PtyError::AlreadyExists(id.to_string()));
        }

        // Get the native PTY system
        let pty_system = native_pty_system();

        // Create the PTY pair
        let size = PortablePtySize {
            rows: config.rows,
            cols: config.cols,
            pixel_width: 0,
            pixel_height: 0,
        };

        let pair = pty_system
            .openpty(size)
            .map_err(|e| PtyError::CreateFailed(e.to_string()))?;

        // Build the command
        let mut cmd = CommandBuilder::new(&config.command);
        cmd.args(&config.args);

        // Set working directory if specified
        if let Some(cwd) = &config.cwd {
            cmd.cwd(cwd);
        }

        // Set environment variables
        for (key, value) in &config.env {
            cmd.env(key, value);
        }

        // Spawn the process in the PTY
        let child = pair
            .slave
            .spawn_command(cmd)
            .map_err(|e| PtyError::SpawnFailed(e.to_string()))?;

        // Store the PTY instance
        let instance = PtyInstance {
            master: pair.master,
            child,
            size: PtySize {
                cols: config.cols,
                rows: config.rows,
            },
        };

        instances.insert(id.to_string(), instance);

        Ok(())
    }

    /// Resize a PTY instance.
    ///
    /// # Arguments
    ///
    /// * `id` - Identifier of the PTY to resize
    /// * `size` - New size for the PTY
    pub fn resize(&self, id: &str, size: PtySize) -> PtyResult<()> {
        let mut instances = self.instances.lock().map_err(|_| PtyError::LockPoisoned)?;

        let instance = instances
            .get_mut(id)
            .ok_or_else(|| PtyError::NotFound(id.to_string()))?;

        instance
            .master
            .resize(size.into())
            .map_err(|e| PtyError::ResizeFailed(e.to_string()))?;

        instance.size = size;

        Ok(())
    }

    /// Write data to a PTY instance.
    ///
    /// # Arguments
    ///
    /// * `id` - Identifier of the PTY
    /// * `data` - Data to write
    pub fn write(&self, id: &str, data: &[u8]) -> PtyResult<usize> {
        let mut instances = self.instances.lock().map_err(|_| PtyError::LockPoisoned)?;

        let instance = instances
            .get_mut(id)
            .ok_or_else(|| PtyError::NotFound(id.to_string()))?;

        let mut writer = instance
            .master
            .take_writer()
            .map_err(|e| PtyError::WriteFailed(e.to_string()))?;

        let bytes_written = writer
            .write(data)
            .map_err(|e| PtyError::WriteFailed(e.to_string()))?;

        writer
            .flush()
            .map_err(|e| PtyError::WriteFailed(e.to_string()))?;

        Ok(bytes_written)
    }

    /// Read data from a PTY instance.
    ///
    /// # Arguments
    ///
    /// * `id` - Identifier of the PTY
    /// * `buffer` - Buffer to read into
    ///
    /// # Returns
    ///
    /// Returns the number of bytes read.
    pub fn read(&self, id: &str, buffer: &mut [u8]) -> PtyResult<usize> {
        let mut instances = self.instances.lock().map_err(|_| PtyError::LockPoisoned)?;

        let instance = instances
            .get_mut(id)
            .ok_or_else(|| PtyError::NotFound(id.to_string()))?;

        let mut reader = instance
            .master
            .try_clone_reader()
            .map_err(|e| PtyError::ReadFailed(e.to_string()))?;

        reader
            .read(buffer)
            .map_err(|e| PtyError::ReadFailed(e.to_string()))
    }

    /// Get a reader for the PTY output.
    ///
    /// # Arguments
    ///
    /// * `id` - Identifier of the PTY
    ///
    /// # Returns
    ///
    /// Returns a boxed Read implementation for the PTY output.
    pub fn try_clone_reader(&self, id: &str) -> PtyResult<Box<dyn Read + Send>> {
        let mut instances = self.instances.lock().map_err(|_| PtyError::LockPoisoned)?;

        let instance = instances
            .get_mut(id)
            .ok_or_else(|| PtyError::NotFound(id.to_string()))?;

        instance
            .master
            .try_clone_reader()
            .map_err(|e| PtyError::ReadFailed(e.to_string()))
    }

    /// Check if the process in the PTY has exited.
    ///
    /// # Arguments
    ///
    /// * `id` - Identifier of the PTY
    ///
    /// # Returns
    ///
    /// Returns `Some(exit_status)` if the process has exited, `None` otherwise.
    pub fn try_wait(&self, id: &str) -> PtyResult<Option<portable_pty::ExitStatus>> {
        let mut instances = self.instances.lock().map_err(|_| PtyError::LockPoisoned)?;

        let instance = instances
            .get_mut(id)
            .ok_or_else(|| PtyError::NotFound(id.to_string()))?;

        instance
            .child
            .try_wait()
            .map_err(|e| PtyError::ProcessExited(e.to_string()))
    }

    /// Wait for the process in the PTY to exit.
    ///
    /// # Arguments
    ///
    /// * `id` - Identifier of the PTY
    ///
    /// # Returns
    ///
    /// Returns the exit status of the process.
    pub fn wait(&self, id: &str) -> PtyResult<portable_pty::ExitStatus> {
        let mut instances = self.instances.lock().map_err(|_| PtyError::LockPoisoned)?;

        let instance = instances
            .get_mut(id)
            .ok_or_else(|| PtyError::NotFound(id.to_string()))?;

        instance
            .child
            .wait()
            .map_err(|e| PtyError::ProcessExited(e.to_string()))
    }

    /// Kill the process in the PTY.
    ///
    /// # Arguments
    ///
    /// * `id` - Identifier of the PTY
    pub fn kill(&self, id: &str) -> PtyResult<()> {
        let mut instances = self.instances.lock().map_err(|_| PtyError::LockPoisoned)?;

        let instance = instances
            .get_mut(id)
            .ok_or_else(|| PtyError::NotFound(id.to_string()))?;

        instance
            .child
            .kill()
            .map_err(|e| PtyError::ProcessExited(e.to_string()))
    }

    /// Get the current size of a PTY instance.
    ///
    /// # Arguments
    ///
    /// * `id` - Identifier of the PTY
    pub fn get_size(&self, id: &str) -> PtyResult<PtySize> {
        let instances = self.instances.lock().map_err(|_| PtyError::LockPoisoned)?;

        let instance = instances
            .get(id)
            .ok_or_else(|| PtyError::NotFound(id.to_string()))?;

        Ok(instance.size)
    }

    /// Close and remove a PTY instance.
    ///
    /// # Arguments
    ///
    /// * `id` - Identifier of the PTY to close
    pub fn close(&self, id: &str) -> PtyResult<()> {
        let mut instances = self.instances.lock().map_err(|_| PtyError::LockPoisoned)?;

        // Try to kill the process if it's still running
        if let Some(instance) = instances.get_mut(id) {
            let _ = instance.child.kill();
        }

        instances.remove(id);

        Ok(())
    }

    /// Check if a PTY instance exists.
    ///
    /// # Arguments
    ///
    /// * `id` - Identifier of the PTY
    pub fn exists(&self, id: &str) -> PtyResult<bool> {
        let instances = self.instances.lock().map_err(|_| PtyError::LockPoisoned)?;
        Ok(instances.contains_key(id))
    }

    /// Get the number of active PTY instances.
    pub fn count(&self) -> PtyResult<usize> {
        let instances = self.instances.lock().map_err(|_| PtyError::LockPoisoned)?;
        Ok(instances.len())
    }

    /// Close all PTY instances.
    pub fn close_all(&self) -> PtyResult<()> {
        let mut instances = self.instances.lock().map_err(|_| PtyError::LockPoisoned)?;

        // Kill all processes
        for (_, instance) in instances.iter_mut() {
            let _ = instance.child.kill();
        }

        instances.clear();

        Ok(())
    }
}

impl Default for PtyManager {
    fn default() -> Self {
        Self::new()
    }
}

// Ensure PtyManager can be safely shared across threads
unsafe impl Send for PtyManager {}
unsafe impl Sync for PtyManager {}

/// Helper function to create a PTY with a command.
///
/// # Arguments
///
/// * `command` - The command to execute
/// * `args` - Arguments to pass to the command
/// * `cwd` - Optional working directory
/// * `env` - Optional environment variables
///
/// # Returns
///
/// Returns a tuple of (PtyManager, id) on success.
pub fn create_pty(
    command: &str,
    args: &[&str],
    cwd: Option<PathBuf>,
    env: Option<HashMap<String, String>>,
) -> PtyResult<(PtyManager, String)> {
    let manager = PtyManager::new();
    let id = uuid::Uuid::new_v4().to_string();

    let config = PtyConfig {
        command: command.to_string(),
        args: args.iter().map(|s| s.to_string()).collect(),
        cwd,
        env: env.unwrap_or_default(),
        ..Default::default()
    };

    manager.create(&id, config)?;

    Ok((manager, id))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_pty_config_default() {
        let config = PtyConfig::default();
        assert!(config.command.is_empty());
        assert_eq!(config.cols, 80);
        assert_eq!(config.rows, 24);
    }

    #[test]
    fn test_pty_size_default() {
        let size = PtySize::default();
        assert_eq!(size.cols, 80);
        assert_eq!(size.rows, 24);
    }

    #[test]
    fn test_pty_size_conversion() {
        let size = PtySize {
            cols: 120,
            rows: 40,
        };
        let portable_size: PortablePtySize = size.into();
        assert_eq!(portable_size.cols, 120);
        assert_eq!(portable_size.rows, 40);
    }

    #[test]
    fn test_pty_manager_new() {
        let manager = PtyManager::new();
        assert_eq!(manager.count().unwrap(), 0);
    }

    #[test]
    fn test_pty_not_found() {
        let manager = PtyManager::new();
        let result = manager.resize("nonexistent", PtySize::default());
        assert!(matches!(result, Err(PtyError::NotFound(_))));
    }

    #[test]
    fn test_pty_exists() {
        let manager = PtyManager::new();
        assert!(!manager.exists("test-id").unwrap());
    }

    #[test]
    fn test_pty_create_and_close() {
        let manager = PtyManager::new();
        let config = PtyConfig {
            command: "echo".to_string(),
            args: vec!["hello".to_string()],
            ..Default::default()
        };

        // Create the PTY
        let result = manager.create("test-pty", config);
        assert!(result.is_ok());
        assert!(manager.exists("test-pty").unwrap());

        // Wait a moment for the command to execute
        std::thread::sleep(std::time::Duration::from_millis(100));

        // Close the PTY
        let result = manager.close("test-pty");
        assert!(result.is_ok());
        assert!(!manager.exists("test-pty").unwrap());
    }

    #[test]
    fn test_pty_already_exists() {
        let manager = PtyManager::new();
        let config = PtyConfig {
            command: "echo".to_string(),
            args: vec!["hello".to_string()],
            ..Default::default()
        };

        // Create the first PTY
        manager.create("test-pty", config.clone()).unwrap();

        // Try to create another with the same ID
        let result = manager.create("test-pty", config);
        assert!(matches!(result, Err(PtyError::AlreadyExists(_))));

        // Cleanup
        manager.close("test-pty").unwrap();
    }

    #[test]
    fn test_pty_get_size() {
        let manager = PtyManager::new();
        let config = PtyConfig {
            command: "echo".to_string(),
            args: vec!["hello".to_string()],
            cols: 120,
            rows: 40,
            ..Default::default()
        };

        manager.create("test-pty", config).unwrap();

        let size = manager.get_size("test-pty").unwrap();
        assert_eq!(size.cols, 120);
        assert_eq!(size.rows, 40);

        manager.close("test-pty").unwrap();
    }

    #[test]
    fn test_pty_close_all() {
        let manager = PtyManager::new();

        // Create multiple PTYs
        for i in 0..3 {
            let config = PtyConfig {
                command: "echo".to_string(),
                args: vec!["hello".to_string()],
                ..Default::default()
            };
            manager.create(&format!("test-pty-{}", i), config).unwrap();
        }

        assert_eq!(manager.count().unwrap(), 3);

        // Close all
        manager.close_all().unwrap();
        assert_eq!(manager.count().unwrap(), 0);
    }
}
