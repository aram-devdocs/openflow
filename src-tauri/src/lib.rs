//! OpenFlow - AI Task Orchestration Application
//!
//! This is the main entry point for the Tauri backend. It initializes the
//! database, registers all IPC commands, and starts the application.

use tauri::Manager;

/// MCP GUI socket path - must match the plugin config
#[cfg(feature = "mcp-gui")]
const MCP_SOCKET_PATH: &str = "/tmp/openflow-mcp.sock";

/// Clean up stale MCP socket file if it exists.
/// This prevents "Socket address already in use" errors after crashes.
#[cfg(feature = "mcp-gui")]
fn cleanup_mcp_socket() {
    if std::path::Path::new(MCP_SOCKET_PATH).exists() {
        if let Err(e) = std::fs::remove_file(MCP_SOCKET_PATH) {
            eprintln!("Warning: Failed to clean up MCP socket: {}", e);
        } else {
            println!("Cleaned up stale MCP socket");
        }
    }
}

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
/// - MCP GUI plugin (when mcp-gui feature is enabled)
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // Clean up stale MCP socket before starting (prevents "address already in use" errors)
    #[cfg(feature = "mcp-gui")]
    cleanup_mcp_socket();

    let builder = tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init());

    // Add MCP GUI plugin when feature is enabled (for AI agent interaction)
    #[cfg(feature = "mcp-gui")]
    let builder = builder.plugin(tauri_plugin_mcp_gui::init_with_config(
        tauri_plugin_mcp_gui::PluginConfig::new("openflow".to_string())
            .socket_path("/tmp/openflow-mcp.sock".into())
            .start_socket_server(true),
    ));

    builder
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
            // Process commands
            commands::get_process,
            commands::list_processes,
            commands::list_running_processes,
            commands::kill_process,
            commands::send_process_input,
            commands::resize_process,
            commands::is_process_running,
            commands::running_process_count,
            // Git commands
            commands::create_worktree,
            commands::delete_worktree,
            commands::get_diff,
            commands::get_commits,
            commands::push_branch,
            commands::get_current_branch,
            commands::get_head_commit,
            commands::has_uncommitted_changes,
            commands::list_worktrees,
            commands::generate_branch_name,
            commands::generate_worktree_path,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
