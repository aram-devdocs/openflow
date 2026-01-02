//! System commands for interacting with the operating system.
//!
//! These commands are Tauri-specific and use the tauri_plugin_opener for
//! platform-native file/directory operations. They remain in the Tauri crate
//! because they are inherently desktop-only functionality that doesn't make
//! sense in a headless server context.
//!
//! Note: These commands are NOT available via the HTTP API since they require
//! desktop GUI context. For web clients, equivalent functionality would need
//! to be provided by the browser or native app.

use tauri::AppHandle;
use tauri_plugin_opener::OpenerExt;

/// Open a file or directory in the default system application.
///
/// This will use the system's default application for the given path:
/// - Directories: Opens in file manager (Finder, Explorer, Nautilus, etc.)
/// - Files: Opens with the associated application (e.g., .txt with text editor)
/// - URLs: Opens in default browser
///
/// # Arguments
/// * `app_handle` - Tauri application handle (injected by Tauri)
/// * `path` - The absolute path to open
///
/// # Returns
/// * `Ok(())` on success
/// * `Err(String)` if the path cannot be opened
///
/// # Example
/// ```ignore
/// // Open a directory in file manager
/// invoke("open_in_editor", { path: "/Users/user/Documents" });
///
/// // Open a file in its default application
/// invoke("open_in_editor", { path: "/Users/user/file.pdf" });
/// ```
#[tauri::command]
pub async fn open_in_editor(app_handle: AppHandle, path: String) -> Result<(), String> {
    log::debug!("Opening path in default application: {}", path);
    let opener = app_handle.opener();
    opener
        .open_path(&path, None::<&str>)
        .map_err(|e| format!("Failed to open path '{}': {}", path, e))
}

/// Reveal a file or directory in the system file explorer.
///
/// Opens the containing directory and highlights/selects the target item.
/// This is useful for "Show in Finder"/"Show in Explorer" functionality.
///
/// # Arguments
/// * `app_handle` - Tauri application handle (injected by Tauri)
/// * `path` - The absolute path to reveal
///
/// # Returns
/// * `Ok(())` on success
/// * `Err(String)` if the path cannot be revealed
///
/// # Example
/// ```ignore
/// // Reveal a file in file manager (opens parent, selects file)
/// invoke("reveal_in_explorer", { path: "/Users/user/Documents/file.txt" });
///
/// // Reveal a directory in file manager
/// invoke("reveal_in_explorer", { path: "/Users/user/Documents" });
/// ```
#[tauri::command]
pub async fn reveal_in_explorer(app_handle: AppHandle, path: String) -> Result<(), String> {
    log::debug!("Revealing path in file explorer: {}", path);
    let opener = app_handle.opener();
    opener
        .reveal_item_in_dir(&path)
        .map_err(|e| format!("Failed to reveal path '{}': {}", path, e))
}

#[cfg(test)]
mod tests {
    // Note: These commands use external system functionality that requires
    // a running Tauri application and GUI context. They cannot be unit tested
    // in isolation. Integration tests with a test Tauri app would be appropriate.
    //
    // For manual testing:
    // 1. Run the app with `pnpm dev`
    // 2. Use browser devtools to call:
    //    await window.__TAURI__.invoke("open_in_editor", { path: "/tmp" })
    //    await window.__TAURI__.invoke("reveal_in_explorer", { path: "/tmp/test.txt" })
}
