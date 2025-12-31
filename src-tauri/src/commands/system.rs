//! System commands for interacting with the operating system.
//!
//! Provides functionality for opening files and directories in external applications.

use tauri::AppHandle;
use tauri_plugin_opener::OpenerExt;

/// Open a file or directory in the default system editor.
///
/// This will use the system's default application for the given path.
/// For directories, this typically opens a file manager.
/// For files, it opens the associated application.
///
/// # Arguments
/// * `app_handle` - Tauri application handle
/// * `path` - The path to open
///
/// # Returns
/// Unit on success, error string on failure
#[tauri::command]
pub async fn open_in_editor(app_handle: AppHandle, path: String) -> Result<(), String> {
    let opener = app_handle.opener();
    opener
        .open_path(&path, None::<&str>)
        .map_err(|e| format!("Failed to open path: {}", e))
}

/// Reveal a file or directory in the system file explorer.
///
/// Opens the parent directory and selects the item.
///
/// # Arguments
/// * `app_handle` - Tauri application handle
/// * `path` - The path to reveal
///
/// # Returns
/// Unit on success, error string on failure
#[tauri::command]
pub async fn reveal_in_explorer(app_handle: AppHandle, path: String) -> Result<(), String> {
    let opener = app_handle.opener();
    opener
        .reveal_item_in_dir(&path)
        .map_err(|e| format!("Failed to reveal path: {}", e))
}

#[cfg(test)]
mod tests {
    // Note: These commands use external system functionality that can't be easily unit tested.
    // Integration tests would be more appropriate for verifying the opener plugin works.
}
