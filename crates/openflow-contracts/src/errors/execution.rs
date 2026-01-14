//! Execution error types for agent task execution
//!
//! This module defines structured error types that can occur during agent execution,
//! providing detailed context for debugging and error handling.

use serde::{Deserialize, Serialize};
use typeshare::typeshare;

/// Structured errors that can occur during agent execution
///
/// These errors provide detailed context about what went wrong during task execution,
/// including information needed for debugging, retry logic, and user feedback.
#[typeshare]
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(tag = "type", content = "content", rename_all = "camelCase")]
pub enum ExecutionError {
    /// Failed to spawn the agent process
    Spawn {
        /// Why the process failed to spawn
        reason: String,
        /// The command that was attempted
        command: String,
        /// The working directory (if specified)
        cwd: Option<String>,
    },

    /// Failed to parse output from the agent
    Parse {
        /// The line that failed to parse
        line: String,
        /// The parsing error message
        error: String,
        /// The line number in the output stream (if tracked)
        line_number: Option<i32>,
        /// The session ID where parsing failed
        session_id: String,
    },

    /// Permission was denied by user or policy
    PermissionDenied {
        /// The tool that requested permission
        tool: String,
        /// The file path (if applicable)
        path: Option<String>,
        /// Why the permission was denied
        reason: PermissionDeniedReason,
    },

    /// Permission request timed out waiting for user response
    PermissionTimeout {
        /// The permission request ID
        permission_id: String,
        /// The tool that requested permission
        tool: String,
        /// How long we waited before timing out (in seconds)
        timeout_seconds: i32,
    },

    /// Tool execution failed
    ToolExecution {
        /// The tool use ID
        tool_id: String,
        /// The tool name
        tool_name: String,
        /// Exit code (if available)
        exit_code: Option<i32>,
        /// Standard error output
        stderr: String,
    },

    /// Execution timed out
    Timeout {
        /// How long the operation ran before timing out (in seconds)
        duration_seconds: i32,
        /// Context about what timed out
        context: String,
        /// The session ID that timed out
        session_id: String,
    },

    /// Connection error (to agent process or external service)
    Connection {
        /// Why the connection failed
        reason: String,
        /// Whether the error is recoverable with retry
        recoverable: bool,
    },

    /// Provider-specific error
    ProviderError {
        /// The provider ID (e.g., "claude-code", "gemini-cli")
        provider_id: String,
        /// Provider-specific error code
        code: String,
        /// Error message from the provider
        message: String,
    },
}

impl ExecutionError {
    /// Get the session ID if this error type has one
    ///
    /// Returns `Some(session_id)` for errors that are associated with a specific session,
    /// or `None` for errors that don't have session context.
    pub fn session_id(&self) -> Option<&str> {
        match self {
            ExecutionError::Parse { session_id, .. } => Some(session_id),
            ExecutionError::Timeout { session_id, .. } => Some(session_id),
            ExecutionError::Spawn { .. }
            | ExecutionError::PermissionDenied { .. }
            | ExecutionError::PermissionTimeout { .. }
            | ExecutionError::ToolExecution { .. }
            | ExecutionError::Connection { .. }
            | ExecutionError::ProviderError { .. } => None,
        }
    }
}

/// Reason why a permission was denied
///
/// Used to differentiate between different denial scenarios for error handling
/// and user feedback.
#[typeshare]
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(tag = "type", content = "content", rename_all = "camelCase")]
pub enum PermissionDeniedReason {
    /// User explicitly denied the permission
    UserDenied,

    /// Permission request timed out
    Timeout,

    /// Session ended before permission was granted
    SessionEnded,

    /// Permission violated a configured policy
    PolicyViolation {
        /// The policy that was violated
        policy: String,
    },
}

