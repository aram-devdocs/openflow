//! Process spawning module.
//!
//! Provides functionality for spawning child processes with proper
//! stdin/stdout/stderr pipe handling.

use std::collections::HashMap;
use std::path::PathBuf;
use std::process::{Child, Command, Stdio};
use thiserror::Error;

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
}

impl Default for SpawnConfig {
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

/// Process spawner for creating child processes.
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
    pub fn spawn(config: SpawnConfig) -> SpawnResult<Child> {
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
        Self::spawn(SpawnConfig {
            command: command.to_string(),
            args: args.iter().map(|s| s.to_string()).collect(),
            ..Default::default()
        })
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_spawn_config_default() {
        let config = SpawnConfig::default();
        assert!(config.command.is_empty());
        assert!(config.args.is_empty());
        assert!(config.cwd.is_none());
        assert!(config.env.is_empty());
        assert!(config.inherit_env);
    }

    #[test]
    fn test_spawn_echo() {
        let result = ProcessSpawner::spawn_simple("echo", &["hello"]);
        assert!(result.is_ok());

        let mut child = result.unwrap();
        let status = child.wait().unwrap();
        assert!(status.success());
    }
}
