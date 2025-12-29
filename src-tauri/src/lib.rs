//! OpenFlow - AI Task Orchestration Application
//!
//! This is the main entry point for the Tauri backend. It initializes the
//! database, registers all IPC commands, and starts the application.

use tauri::Manager;

pub mod commands;
pub mod db;
pub mod process;
pub mod services;
pub mod types;

use commands::AppState;
use db::init_db;

/// Initialize and run the Tauri application.
///
/// This function sets up the Tauri builder with:
/// - Shell plugin for command execution
/// - Database initialization in setup hook
/// - AppState management with database pool
/// - All IPC command registration
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .setup(|app| {
            // Get the app data directory for database storage
            let app_data_dir = app
                .path()
                .app_data_dir()
                .expect("Failed to get app data directory");

            // Initialize the database asynchronously
            let pool = tauri::async_runtime::block_on(async {
                init_db(app_data_dir)
                    .await
                    .expect("Failed to initialize database")
            });

            // Create and manage the application state
            app.manage(AppState::new(pool));

            #[cfg(debug_assertions)]
            {
                // Open devtools in development mode
                if let Some(window) = app.get_webview_window("main") {
                    window.open_devtools();
                }
            }

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            // Project commands
            commands::list_projects,
            commands::get_project,
            commands::create_project,
            commands::update_project,
            commands::delete_project,
            // Task commands
            commands::list_tasks,
            commands::get_task,
            commands::create_task,
            commands::update_task,
            commands::archive_task,
            commands::unarchive_task,
            commands::delete_task,
            // Chat commands
            commands::list_chats,
            commands::get_chat,
            commands::create_chat,
            commands::update_chat,
            commands::delete_chat,
            commands::start_workflow_step,
            // Message commands
            commands::list_messages,
            commands::get_message,
            commands::create_message,
            commands::delete_message,
            commands::set_message_streaming,
            commands::append_message_content,
            commands::set_message_tokens,
            // Executor profile commands
            commands::list_executor_profiles,
            commands::get_executor_profile,
            commands::get_default_executor_profile,
            commands::create_executor_profile,
            commands::update_executor_profile,
            commands::delete_executor_profile,
            commands::run_executor,
            // Settings commands
            commands::get_setting,
            commands::set_setting,
            commands::get_all_settings,
            commands::delete_setting,
            commands::get_setting_or_default,
            commands::setting_exists,
            // Search commands
            commands::search,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
