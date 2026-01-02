//! Terminal Request Types
//!
//! Request types for terminal session operations.
//!
//! Terminals provide interactive shell sessions within a project's working directory.

use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use typeshare::typeshare;

use crate::validation::{
    validate_required_string, validate_string_length, Validate, ValidationCollector,
    ValidationResult,
};

// =============================================================================
// Spawn Terminal Request
// =============================================================================

/// Request to spawn a new terminal session
///
/// Creates an interactive shell session within a project's working directory.
/// If no chat_id is provided, a standalone terminal chat will be created.
///
/// @endpoint: POST /api/terminal/spawn
/// @command: spawn_terminal
///
/// # Example
/// ```json
/// {
///   "projectId": "550e8400-e29b-41d4-a716-446655440000",
///   "chatId": "optional-chat-id",
///   "cwd": "/optional/custom/path",
///   "shell": "/bin/zsh",
///   "cols": 120,
///   "rows": 30
/// }
/// ```
#[typeshare]
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct SpawnTerminalRequest {
    /// The project ID to spawn the terminal in (determines default working directory)
    /// @validate: required, format=uuid
    pub project_id: String,

    /// Optional chat ID to associate the terminal with.
    /// If None, a standalone terminal chat will be created.
    /// @validate: format=uuid
    pub chat_id: Option<String>,

    /// Optional custom working directory (overrides project's git_repo_path).
    /// Must be within the project directory for security.
    pub cwd: Option<PathBuf>,

    /// Optional shell command (defaults to user's shell or /bin/bash).
    /// @validate: max_length=1000
    pub shell: Option<String>,

    /// Terminal width in columns (default: 120)
    pub cols: Option<u16>,

    /// Terminal height in rows (default: 30)
    pub rows: Option<u16>,
}

impl Default for SpawnTerminalRequest {
    fn default() -> Self {
        Self {
            project_id: String::new(),
            chat_id: None,
            cwd: None,
            shell: None,
            cols: None,
            rows: None,
        }
    }
}

impl SpawnTerminalRequest {
    /// Create a new spawn terminal request for a project
    pub fn new(project_id: impl Into<String>) -> Self {
        Self {
            project_id: project_id.into(),
            ..Default::default()
        }
    }

    /// Set the chat ID
    pub fn with_chat_id(mut self, chat_id: impl Into<String>) -> Self {
        self.chat_id = Some(chat_id.into());
        self
    }

    /// Set the working directory
    pub fn with_cwd(mut self, cwd: impl Into<PathBuf>) -> Self {
        self.cwd = Some(cwd.into());
        self
    }

    /// Set the shell command
    pub fn with_shell(mut self, shell: impl Into<String>) -> Self {
        self.shell = Some(shell.into());
        self
    }

    /// Set the terminal dimensions
    pub fn with_dimensions(mut self, cols: u16, rows: u16) -> Self {
        self.cols = Some(cols);
        self.rows = Some(rows);
        self
    }

    /// Set the terminal width
    pub fn with_cols(mut self, cols: u16) -> Self {
        self.cols = Some(cols);
        self
    }

    /// Set the terminal height
    pub fn with_rows(mut self, rows: u16) -> Self {
        self.rows = Some(rows);
        self
    }

    /// Get the effective terminal dimensions (with defaults)
    pub fn effective_dimensions(&self) -> (u16, u16) {
        (self.cols.unwrap_or(120), self.rows.unwrap_or(30))
    }
}

impl Validate for SpawnTerminalRequest {
    fn validate(&self) -> ValidationResult<()> {
        ValidationCollector::new()
            .validate(|| validate_required_string("project_id", &self.project_id))
            .validate(|| validate_string_length("project_id", &self.project_id, None, Some(36)))
            .validate(|| {
                if let Some(ref shell) = self.shell {
                    validate_string_length("shell", shell, None, Some(1000))
                } else {
                    Ok(())
                }
            })
            .validate(|| {
                if let Some(cols) = self.cols {
                    if cols == 0 {
                        return Err(crate::validation::ValidationError::NumberMin {
                            field: "cols".to_string(),
                            min: 1.0,
                            actual: 0.0,
                        });
                    }
                }
                Ok(())
            })
            .validate(|| {
                if let Some(rows) = self.rows {
                    if rows == 0 {
                        return Err(crate::validation::ValidationError::NumberMin {
                            field: "rows".to_string(),
                            min: 1.0,
                            actual: 0.0,
                        });
                    }
                }
                Ok(())
            })
            .finish()
    }
}

// =============================================================================
// Get Default Shell Request
// =============================================================================

/// Request to get the user's default shell
///
/// @endpoint: GET /api/terminal/default-shell
/// @command: get_default_shell
#[typeshare]
#[derive(Debug, Clone, Default, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct GetDefaultShellRequest {}

impl GetDefaultShellRequest {
    /// Create a new request
    pub fn new() -> Self {
        Self::default()
    }
}

// =============================================================================
// Terminal Shell Response
// =============================================================================

/// Response containing the default shell information
#[typeshare]
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct DefaultShellResponse {
    /// The shell command path (e.g., "/bin/zsh", "cmd.exe")
    pub shell: String,

    /// The shell name extracted from the path (e.g., "zsh", "bash")
    pub shell_name: String,

    /// Whether this is a recognized shell type
    pub recognized: bool,
}

impl DefaultShellResponse {
    /// Create a new response
    pub fn new(shell: impl Into<String>) -> Self {
        let shell = shell.into();
        let shell_name = extract_shell_name(&shell);
        let recognized = is_recognized_shell(&shell_name);

        Self {
            shell,
            shell_name,
            recognized,
        }
    }
}

/// Extract the shell name from a full path
fn extract_shell_name(shell: &str) -> String {
    shell
        .rsplit('/')
        .next()
        .unwrap_or(shell)
        .rsplit('\\')
        .next()
        .unwrap_or(shell)
        .to_string()
}

/// Check if the shell name is recognized
fn is_recognized_shell(shell_name: &str) -> bool {
    matches!(
        shell_name,
        "bash"
            | "zsh"
            | "fish"
            | "sh"
            | "cmd.exe"
            | "cmd"
            | "powershell.exe"
            | "powershell"
            | "pwsh.exe"
            | "pwsh"
    )
}

// =============================================================================
// Tests
// =============================================================================

#[cfg(test)]
mod tests {
    use super::*;

    // =========================================================================
    // SpawnTerminalRequest Tests
    // =========================================================================

    #[test]
    fn test_spawn_terminal_request_new() {
        let request = SpawnTerminalRequest::new("project-123");

        assert_eq!(request.project_id, "project-123");
        assert!(request.chat_id.is_none());
        assert!(request.cwd.is_none());
        assert!(request.shell.is_none());
        assert!(request.cols.is_none());
        assert!(request.rows.is_none());
    }

    #[test]
    fn test_spawn_terminal_request_builder() {
        let request = SpawnTerminalRequest::new("project-123")
            .with_chat_id("chat-456")
            .with_cwd("/home/user/project")
            .with_shell("/bin/zsh")
            .with_dimensions(200, 50);

        assert_eq!(request.project_id, "project-123");
        assert_eq!(request.chat_id, Some("chat-456".to_string()));
        assert_eq!(request.cwd, Some(PathBuf::from("/home/user/project")));
        assert_eq!(request.shell, Some("/bin/zsh".to_string()));
        assert_eq!(request.cols, Some(200));
        assert_eq!(request.rows, Some(50));
    }

    #[test]
    fn test_spawn_terminal_request_effective_dimensions() {
        let request = SpawnTerminalRequest::new("project-123");
        assert_eq!(request.effective_dimensions(), (120, 30));

        let request = SpawnTerminalRequest::new("project-123").with_dimensions(80, 24);
        assert_eq!(request.effective_dimensions(), (80, 24));

        let request = SpawnTerminalRequest::new("project-123").with_cols(100);
        assert_eq!(request.effective_dimensions(), (100, 30));

        let request = SpawnTerminalRequest::new("project-123").with_rows(40);
        assert_eq!(request.effective_dimensions(), (120, 40));
    }

    #[test]
    fn test_spawn_terminal_request_validation_valid() {
        let request = SpawnTerminalRequest::new("550e8400-e29b-41d4-a716-446655440000")
            .with_shell("/bin/bash")
            .with_dimensions(120, 30);

        assert!(request.validate().is_ok());
    }

    #[test]
    fn test_spawn_terminal_request_validation_empty_project_id() {
        let request = SpawnTerminalRequest::new("");

        assert!(request.validate().is_err());
    }

    #[test]
    fn test_spawn_terminal_request_validation_zero_cols() {
        let request = SpawnTerminalRequest::new("project-123").with_cols(0);

        assert!(request.validate().is_err());
    }

    #[test]
    fn test_spawn_terminal_request_validation_zero_rows() {
        let request = SpawnTerminalRequest::new("project-123").with_rows(0);

        assert!(request.validate().is_err());
    }

    // =========================================================================
    // DefaultShellResponse Tests
    // =========================================================================

    #[test]
    fn test_default_shell_response_unix() {
        let response = DefaultShellResponse::new("/bin/bash");
        assert_eq!(response.shell, "/bin/bash");
        assert_eq!(response.shell_name, "bash");
        assert!(response.recognized);

        let response = DefaultShellResponse::new("/usr/local/bin/zsh");
        assert_eq!(response.shell_name, "zsh");
        assert!(response.recognized);

        let response = DefaultShellResponse::new("/usr/bin/fish");
        assert_eq!(response.shell_name, "fish");
        assert!(response.recognized);
    }

    #[test]
    fn test_default_shell_response_windows() {
        let response = DefaultShellResponse::new("C:\\Windows\\System32\\cmd.exe");
        assert_eq!(response.shell_name, "cmd.exe");
        assert!(response.recognized);

        let response = DefaultShellResponse::new("powershell.exe");
        assert_eq!(response.shell_name, "powershell.exe");
        assert!(response.recognized);

        let response = DefaultShellResponse::new("C:\\Program Files\\PowerShell\\7\\pwsh.exe");
        assert_eq!(response.shell_name, "pwsh.exe");
        assert!(response.recognized);
    }

    #[test]
    fn test_default_shell_response_unrecognized() {
        let response = DefaultShellResponse::new("/usr/bin/custom-shell");
        assert_eq!(response.shell_name, "custom-shell");
        assert!(!response.recognized);
    }

    // =========================================================================
    // Helper Function Tests
    // =========================================================================

    #[test]
    fn test_extract_shell_name() {
        assert_eq!(extract_shell_name("/bin/bash"), "bash");
        assert_eq!(extract_shell_name("/usr/local/bin/zsh"), "zsh");
        assert_eq!(
            extract_shell_name("C:\\Windows\\System32\\cmd.exe"),
            "cmd.exe"
        );
        assert_eq!(extract_shell_name("bash"), "bash");
    }

    #[test]
    fn test_is_recognized_shell() {
        assert!(is_recognized_shell("bash"));
        assert!(is_recognized_shell("zsh"));
        assert!(is_recognized_shell("fish"));
        assert!(is_recognized_shell("sh"));
        assert!(is_recognized_shell("cmd.exe"));
        assert!(is_recognized_shell("powershell.exe"));
        assert!(is_recognized_shell("pwsh"));
        assert!(!is_recognized_shell("unknown"));
    }
}
