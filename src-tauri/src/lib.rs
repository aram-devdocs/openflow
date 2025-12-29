use tauri::Manager;

pub mod db;
pub mod types;

/// Initialize and run the Tauri application.
///
/// This function sets up the Tauri builder with:
/// - Shell plugin for command execution
/// - Future: Database initialization in setup hook
/// - Future: IPC command registration
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .setup(|app| {
            #[cfg(debug_assertions)]
            {
                // Open devtools in development mode
                if let Some(window) = app.get_webview_window("main") {
                    window.open_devtools();
                }
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
