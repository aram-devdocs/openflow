//! Error types for process operations.
//!
//! This module defines the error types used throughout the process crate.
//! Errors are categorized by their source (PTY, spawn, I/O, etc.).

use thiserror::Error;

/// Errors that can occur during process operations.
#[derive(Debug, Error)]
pub enum ProcessError {
    /// Failed to spawn the process.
    #[error("Failed to spawn process: {0}")]
    SpawnFailed(String),

    /// Failed to create PTY.
    #[error("Failed to create PTY: {0}")]
    PtyCreationFailed(String),

    /// Process not found.
    #[error("Process not found: {0}")]
    NotFound(String),

    /// Process already exists.
    #[error("Process already exists: {0}")]
    AlreadyExists(String),

    /// Failed to write to process stdin.
    #[error("Failed to write to process: {0}")]
    WriteFailed(String),

    /// Failed to read from process.
    #[error("Failed to read from process: {0}")]
    ReadFailed(String),

    /// Failed to resize PTY.
    #[error("Failed to resize PTY: {0}")]
    ResizeFailed(String),

    /// Failed to kill process.
    #[error("Failed to kill process: {0}")]
    KillFailed(String),

    /// Process has already exited.
    #[error("Process has exited: {0}")]
    ProcessExited(String),

    /// Invalid working directory.
    #[error("Invalid working directory: {0}")]
    InvalidWorkingDirectory(String),

    /// Command not found.
    #[error("Command not found: {0}")]
    CommandNotFound(String),

    /// I/O error.
    #[error("I/O error: {0}")]
    Io(#[from] std::io::Error),

    /// Lock was poisoned.
    #[error("Lock poisoned")]
    LockPoisoned,

    /// Channel error (send/receive failed).
    #[error("Channel error: {0}")]
    ChannelError(String),

    /// Output buffer overflow.
    #[error("Output buffer overflow")]
    BufferOverflow,

    /// Timeout waiting for process.
    #[error("Timeout waiting for process: {0}")]
    Timeout(String),

    /// Internal error.
    #[error("Internal error: {0}")]
    Internal(String),
}

/// Result type for process operations.
pub type ProcessResult<T> = Result<T, ProcessError>;

impl From<crate::pty::PtyError> for ProcessError {
    fn from(err: crate::pty::PtyError) -> Self {
        match err {
            crate::pty::PtyError::CreateFailed(msg) => ProcessError::PtyCreationFailed(msg),
            crate::pty::PtyError::SpawnFailed(msg) => ProcessError::SpawnFailed(msg),
            crate::pty::PtyError::WriteFailed(msg) => ProcessError::WriteFailed(msg),
            crate::pty::PtyError::ReadFailed(msg) => ProcessError::ReadFailed(msg),
            crate::pty::PtyError::ResizeFailed(msg) => ProcessError::ResizeFailed(msg),
            crate::pty::PtyError::NotFound(msg) => ProcessError::NotFound(msg),
            crate::pty::PtyError::AlreadyExists(msg) => ProcessError::AlreadyExists(msg),
            crate::pty::PtyError::ProcessExited(msg) => ProcessError::ProcessExited(msg),
            crate::pty::PtyError::LockPoisoned => ProcessError::LockPoisoned,
        }
    }
}

impl ProcessError {
    /// Create a spawn failed error.
    pub fn spawn_failed(msg: impl Into<String>) -> Self {
        Self::SpawnFailed(msg.into())
    }

    /// Create a PTY creation failed error.
    pub fn pty_creation_failed(msg: impl Into<String>) -> Self {
        Self::PtyCreationFailed(msg.into())
    }

    /// Create a not found error.
    pub fn not_found(id: impl Into<String>) -> Self {
        Self::NotFound(id.into())
    }

    /// Create an already exists error.
    pub fn already_exists(id: impl Into<String>) -> Self {
        Self::AlreadyExists(id.into())
    }

    /// Create a write failed error.
    pub fn write_failed(msg: impl Into<String>) -> Self {
        Self::WriteFailed(msg.into())
    }

    /// Create a read failed error.
    pub fn read_failed(msg: impl Into<String>) -> Self {
        Self::ReadFailed(msg.into())
    }

    /// Create a resize failed error.
    pub fn resize_failed(msg: impl Into<String>) -> Self {
        Self::ResizeFailed(msg.into())
    }

    /// Create a kill failed error.
    pub fn kill_failed(msg: impl Into<String>) -> Self {
        Self::KillFailed(msg.into())
    }

    /// Create a process exited error.
    pub fn process_exited(msg: impl Into<String>) -> Self {
        Self::ProcessExited(msg.into())
    }

    /// Create an invalid working directory error.
    pub fn invalid_working_directory(path: impl Into<String>) -> Self {
        Self::InvalidWorkingDirectory(path.into())
    }

    /// Create a command not found error.
    pub fn command_not_found(cmd: impl Into<String>) -> Self {
        Self::CommandNotFound(cmd.into())
    }

    /// Create a channel error.
    pub fn channel_error(msg: impl Into<String>) -> Self {
        Self::ChannelError(msg.into())
    }

    /// Create a timeout error.
    pub fn timeout(msg: impl Into<String>) -> Self {
        Self::Timeout(msg.into())
    }

    /// Create an internal error.
    pub fn internal(msg: impl Into<String>) -> Self {
        Self::Internal(msg.into())
    }

    /// Check if this is a not found error.
    pub fn is_not_found(&self) -> bool {
        matches!(self, Self::NotFound(_))
    }

    /// Check if this is an already exists error.
    pub fn is_already_exists(&self) -> bool {
        matches!(self, Self::AlreadyExists(_))
    }

    /// Check if this is a process exited error.
    pub fn is_process_exited(&self) -> bool {
        matches!(self, Self::ProcessExited(_))
    }

    /// Check if this is a timeout error.
    pub fn is_timeout(&self) -> bool {
        matches!(self, Self::Timeout(_))
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_error_display() {
        let err = ProcessError::spawn_failed("test error");
        assert!(err.to_string().contains("Failed to spawn process"));
        assert!(err.to_string().contains("test error"));

        let err = ProcessError::not_found("proc-123");
        assert!(err.to_string().contains("Process not found"));
        assert!(err.to_string().contains("proc-123"));
    }

    #[test]
    fn test_error_predicates() {
        let err = ProcessError::not_found("test");
        assert!(err.is_not_found());
        assert!(!err.is_already_exists());
        assert!(!err.is_process_exited());

        let err = ProcessError::already_exists("test");
        assert!(err.is_already_exists());
        assert!(!err.is_not_found());

        let err = ProcessError::process_exited("test");
        assert!(err.is_process_exited());

        let err = ProcessError::timeout("test");
        assert!(err.is_timeout());
    }

    #[test]
    fn test_error_from_io() {
        let io_err = std::io::Error::new(std::io::ErrorKind::NotFound, "file not found");
        let err: ProcessError = io_err.into();
        assert!(matches!(err, ProcessError::Io(_)));
    }

    #[test]
    fn test_lock_poisoned() {
        let err = ProcessError::LockPoisoned;
        assert_eq!(err.to_string(), "Lock poisoned");
    }

    #[test]
    fn test_buffer_overflow() {
        let err = ProcessError::BufferOverflow;
        assert_eq!(err.to_string(), "Output buffer overflow");
    }

    #[test]
    fn test_from_pty_error() {
        use crate::pty::PtyError;

        // Test CreateFailed conversion
        let pty_err = PtyError::CreateFailed("test create".to_string());
        let err: ProcessError = pty_err.into();
        assert!(matches!(err, ProcessError::PtyCreationFailed(_)));
        assert!(err.to_string().contains("test create"));

        // Test SpawnFailed conversion
        let pty_err = PtyError::SpawnFailed("test spawn".to_string());
        let err: ProcessError = pty_err.into();
        assert!(matches!(err, ProcessError::SpawnFailed(_)));

        // Test WriteFailed conversion
        let pty_err = PtyError::WriteFailed("test write".to_string());
        let err: ProcessError = pty_err.into();
        assert!(matches!(err, ProcessError::WriteFailed(_)));

        // Test ReadFailed conversion
        let pty_err = PtyError::ReadFailed("test read".to_string());
        let err: ProcessError = pty_err.into();
        assert!(matches!(err, ProcessError::ReadFailed(_)));

        // Test ResizeFailed conversion
        let pty_err = PtyError::ResizeFailed("test resize".to_string());
        let err: ProcessError = pty_err.into();
        assert!(matches!(err, ProcessError::ResizeFailed(_)));

        // Test NotFound conversion
        let pty_err = PtyError::NotFound("test-id".to_string());
        let err: ProcessError = pty_err.into();
        assert!(err.is_not_found());

        // Test AlreadyExists conversion
        let pty_err = PtyError::AlreadyExists("test-id".to_string());
        let err: ProcessError = pty_err.into();
        assert!(err.is_already_exists());

        // Test ProcessExited conversion
        let pty_err = PtyError::ProcessExited("test exited".to_string());
        let err: ProcessError = pty_err.into();
        assert!(err.is_process_exited());

        // Test LockPoisoned conversion
        let pty_err = PtyError::LockPoisoned;
        let err: ProcessError = pty_err.into();
        assert!(matches!(err, ProcessError::LockPoisoned));
    }
}
