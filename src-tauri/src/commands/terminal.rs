//! Tauri commands for terminal session management.
//!
//! These commands provide the IPC interface for spawning and managing
//! interactive terminal sessions within a project's working directory.
//!
//! Terminal management includes:
//! - Spawning new terminal sessions with the user's shell
//! - Resizing terminal windows (handled by process commands)
//! - Killing terminal sessions (handled by process commands)

use tauri::{AppHandle, Emitter, State};

use crate::commands::AppState;
use openflow_contracts::{ExecutionProcess, SpawnTerminalRequest};
use openflow_core::services::{process, terminal};

/// Request structure for spawning a terminal.
#[derive(Debug, Clone, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SpawnTerminalInput {
    /// The project ID to spawn the terminal in.
    pub project_id: String,
    /// Optional chat ID to associate the terminal with.
    pub chat_id: Option<String>,
    /// Optional custom working directory.
    pub cwd: Option<String>,
    /// Optional shell command (defaults to user's shell).
    pub shell: Option<String>,
    /// Optional terminal width in columns.
    pub cols: Option<u16>,
    /// Optional terminal height in rows.
    pub rows: Option<u16>,
}

impl From<SpawnTerminalInput> for SpawnTerminalRequest {
    fn from(input: SpawnTerminalInput) -> Self {
        let mut request = SpawnTerminalRequest::new(&input.project_id);
        if let Some(chat_id) = input.chat_id {
            request = request.with_chat_id(chat_id);
        }
        if let Some(cwd) = input.cwd {
            request = request.with_cwd(cwd);
        }
        if let Some(shell) = input.shell {
            request = request.with_shell(shell);
        }
        if let Some(cols) = input.cols {
            request = request.with_cols(cols);
        }
        if let Some(rows) = input.rows {
            request = request.with_rows(rows);
        }
        request
    }
}

/// Spawn a new terminal session.
///
/// This creates an interactive shell process within the specified project's
/// working directory. The terminal runs the user's default shell (or a custom
/// shell if specified) with proper terminal emulation via PTY.
///
/// If no chat_id is provided, a standalone terminal chat will be created.
///
/// # Arguments
/// * `project_id` - The project to spawn the terminal in
/// * `chat_id` - Optional chat to associate with the terminal
/// * `cwd` - Optional custom working directory (defaults to project's git_repo_path)
/// * `shell` - Optional shell command (defaults to $SHELL on Unix, %COMSPEC% on Windows)
/// * `cols` - Optional terminal width (defaults to 120)
/// * `rows` - Optional terminal height (defaults to 30)
///
/// # Returns
/// The spawned process record.
#[tauri::command]
pub async fn spawn_terminal(
    state: State<'_, AppState>,
    app_handle: AppHandle,
    input: SpawnTerminalInput,
) -> Result<ExecutionProcess, String> {
    let pool = state.db.lock().await;
    let request = input.into();

    let process = terminal::spawn_terminal(&pool, &state.process_service, request)
        .await
        .map_err(|e| e.to_string())?;

    // Emit process status event for the newly spawned terminal
    let event = process::create_status_event(&process);
    let _ = app_handle.emit(&format!("process-status-{}", process.id), &event);

    Ok(process)
}

/// Get the user's default shell.
///
/// Returns the shell command that would be used for terminal sessions
/// on the current platform.
///
/// # Returns
/// The shell command path (e.g., "/bin/bash", "cmd.exe").
#[tauri::command]
pub fn get_default_shell() -> Result<String, String> {
    terminal::get_default_shell().map_err(|e| e.to_string())
}

/// Get the user's default shell with detailed response.
///
/// Returns the shell command along with the extracted shell name
/// and whether the shell is a recognized type.
///
/// # Returns
/// A `DefaultShellResponse` containing:
/// - `shell`: Full path to the shell (e.g., "/bin/bash")
/// - `shell_name`: Just the shell name (e.g., "bash")
/// - `is_recognized`: Whether this is a known shell type
#[tauri::command]
pub fn get_default_shell_response() -> Result<openflow_contracts::DefaultShellResponse, String> {
    terminal::get_default_shell_response().map_err(|e| e.to_string())
}
