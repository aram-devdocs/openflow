//! Tauri commands for process management.
//!
//! These commands provide the IPC interface for process execution and control.
//! Each command is a thin wrapper around ProcessService methods.
//!
//! Process management includes:
//! - Retrieving process information
//! - Listing processes by chat
//! - Killing running processes
//! - Sending input to PTY processes
//! - Resizing PTY windows

use tauri::{AppHandle, Emitter, State};

use crate::commands::AppState;
use crate::services::ProcessService;
use crate::types::ExecutionProcess;

/// Get a process by ID.
///
/// Returns the process record including status, exit code, and timestamps.
#[tauri::command]
pub async fn get_process(
    state: State<'_, AppState>,
    id: String,
) -> Result<ExecutionProcess, String> {
    let pool = state.db.lock().await;
    ProcessService::get(&pool, &id)
        .await
        .map_err(|e| e.to_string())
}

/// List all processes for a chat.
///
/// Returns processes ordered by creation time descending (newest first).
#[tauri::command]
pub async fn list_processes(
    state: State<'_, AppState>,
    chat_id: String,
) -> Result<Vec<ExecutionProcess>, String> {
    let pool = state.db.lock().await;
    ProcessService::list_by_chat(&pool, &chat_id)
        .await
        .map_err(|e| e.to_string())
}

/// List running processes for a chat.
///
/// Returns only processes with status "running".
#[tauri::command]
pub async fn list_running_processes(
    state: State<'_, AppState>,
    chat_id: String,
) -> Result<Vec<ExecutionProcess>, String> {
    let pool = state.db.lock().await;
    ProcessService::list_running_by_chat(&pool, &chat_id)
        .await
        .map_err(|e| e.to_string())
}

/// Kill a running process.
///
/// This will attempt to terminate the process (either PTY or standard process),
/// update the database record to "killed" status, and emit a status change event.
#[tauri::command]
pub async fn kill_process(
    state: State<'_, AppState>,
    app_handle: AppHandle,
    id: String,
) -> Result<ExecutionProcess, String> {
    let pool = state.db.lock().await;
    let process = state
        .process_service
        .kill(&pool, &id)
        .await
        .map_err(|e| e.to_string())?;

    // Emit process status event
    let event = ProcessService::create_status_event(&process);
    let _ = app_handle.emit(&format!("process-status-{}", id), &event);

    Ok(process)
}

/// Send input to a PTY process.
///
/// The input string is written to the process's stdin. This only works for
/// processes started with PTY mode enabled.
#[tauri::command]
pub async fn send_process_input(
    state: State<'_, AppState>,
    process_id: String,
    input: String,
) -> Result<(), String> {
    state
        .process_service
        .send_input(&process_id, &input)
        .map_err(|e| e.to_string())
}

/// Resize a PTY process window.
///
/// Updates the terminal size for the PTY. This only works for processes
/// started with PTY mode enabled.
#[tauri::command]
pub async fn resize_process(
    state: State<'_, AppState>,
    process_id: String,
    cols: u16,
    rows: u16,
) -> Result<(), String> {
    state
        .process_service
        .resize(&process_id, cols, rows)
        .map_err(|e| e.to_string())
}

/// Check if a process is currently running.
///
/// Returns true if the process is being tracked as running by the ProcessService.
#[tauri::command]
pub async fn is_process_running(
    state: State<'_, AppState>,
    process_id: String,
) -> Result<bool, String> {
    Ok(state.process_service.is_running(&process_id).await)
}

/// Get the count of currently running processes.
///
/// Returns the number of processes being tracked by the ProcessService.
#[tauri::command]
pub async fn running_process_count(state: State<'_, AppState>) -> Result<usize, String> {
    Ok(state.process_service.running_count().await)
}
