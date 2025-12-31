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
use crate::services::{ProcessService, TerminalService};
use crate::types::ExecutionProcess;

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

impl From<SpawnTerminalInput> for crate::services::terminal_service::SpawnTerminalRequest {
    fn from(input: SpawnTerminalInput) -> Self {
        Self {
            project_id: input.project_id,
            chat_id: input.chat_id,
            cwd: input.cwd.map(std::path::PathBuf::from),
            shell: input.shell,
            cols: input.cols,
            rows: input.rows,
        }
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

    let process = TerminalService::spawn_terminal(&pool, &state.process_service, request)
        .await
        .map_err(|e| e.to_string())?;

    // Emit process status event for the newly spawned terminal
    let event = ProcessService::create_status_event(&process).map_err(|e| e.to_string())?;
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
pub fn get_default_shell() -> String {
    TerminalService::get_default_shell()
}
