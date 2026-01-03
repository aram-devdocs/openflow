//! OpenFlow - AI Task Orchestration Application
//!
//! This is the main entry point for the Tauri backend. It initializes the
//! database, registers all IPC commands, starts the embedded HTTP server,
//! and launches the application.
//!
//! # Architecture
//!
//! The Tauri app runs with an embedded HTTP server that allows browser clients
//! to connect to the same backend. This enables:
//! - Desktop app via Tauri IPC
//! - Browser app via HTTP/WebSocket on port 3001
//! - Both clients share the same database and state
//!
//! ```text
//! +------------------+    +------------------+
//! |   Tauri App      |    |   Browser App    |
//! |   (IPC)          |    |   (HTTP/WS)      |
//! +--------+---------+    +--------+---------+
//!          |                       |
//!          v                       v
//! +--------+---------+    +--------+---------+
//! | Tauri Commands   |    | HTTP Routes      |
//! +--------+---------+    +--------+---------+
//!          |                       |
//!          +-----------+-----------+
//!                      |
//!                      v
//!          +-----------+-----------+
//!          |   Shared Services     |
//!          |   (openflow-core)     |
//!          +-----------+-----------+
//!                      |
//!                      v
//!          +-----------+-----------+
//!          |   Shared Database     |
//!          |   (SQLite)            |
//!          +-----------------------+
//! ```

use tauri::Manager;

/// MCP GUI socket path - must match the plugin config
#[cfg(feature = "mcp-gui")]
const MCP_SOCKET_PATH: &str = "/tmp/openflow-mcp.sock";

/// Default HTTP server port for the embedded server
const HTTP_SERVER_PORT: u16 = 3001;

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

pub mod broadcaster;
pub mod commands;

use broadcaster::TauriBroadcaster;
use commands::AppState;
use openflow_db::{init_db_with_seeder, DbConfig};
use openflow_server::{ClientManager, ServerConfig};

/// Initialize and run the Tauri application.
///
/// This function sets up the Tauri builder with:
/// - Shell plugin for command execution
/// - Database initialization in setup hook
/// - AppState management with database pool
/// - Embedded HTTP server on port 3001
/// - All IPC command registration
/// - MCP GUI plugin (when mcp-gui feature is enabled)
///
/// The embedded HTTP server allows browser clients to connect to the same
/// backend as the Tauri app. Both share the same database and services.
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // Clean up stale MCP socket before starting (prevents "address already in use" errors)
    #[cfg(feature = "mcp-gui")]
    cleanup_mcp_socket();

    let builder = tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init());

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

            // Create database configuration from the app data directory
            let db_config = DbConfig::from_directory(&app_data_dir);

            // Initialize the database asynchronously with seeder for default profiles
            let pool = tauri::async_runtime::block_on(async {
                init_db_with_seeder(
                    db_config,
                    Box::new(|pool| {
                        Box::pin(async move {
                            // Seed default executor profile
                            openflow_core::services::executor_profile::seed_default_profile(&pool)
                                .await
                                .map_err(|e| openflow_db::DbError::Seed(e.to_string()))?;
                            Ok(())
                        })
                    }),
                )
                .await
                .expect("Failed to initialize database")
            });

            // Create the event broadcaster using Tauri's event system
            let broadcaster = TauriBroadcaster::arc(app.handle().clone());

            // Create the application state
            let state = AppState::new(pool, broadcaster);

            // Extract shared resources for the HTTP server
            let http_pool = state.get_pool().clone();
            let http_process_service = state.get_process_service();
            let http_broadcaster = state.get_broadcaster();

            // Manage the application state for Tauri commands
            app.manage(state);

            // Create WebSocket client manager for the HTTP server
            let client_manager = ClientManager::new();

            // Configure and spawn the embedded HTTP server
            let server_config = ServerConfig::default()
                .with_port(HTTP_SERVER_PORT)
                .with_cors_origins(vec![
                    "http://localhost:5173".to_string(), // Vite dev server
                    "http://localhost:1420".to_string(), // Tauri dev server
                    "http://127.0.0.1:5173".to_string(),
                    "http://127.0.0.1:1420".to_string(),
                    "tauri://localhost".to_string(),
                ]);

            // Spawn HTTP server in background task
            tauri::async_runtime::spawn(async move {
                println!(
                    "Starting embedded HTTP server on http://127.0.0.1:{}",
                    HTTP_SERVER_PORT
                );

                if let Err(e) = openflow_server::start_embedded_server(
                    http_pool,
                    http_process_service,
                    http_broadcaster,
                    client_manager,
                    server_config,
                )
                .await
                {
                    eprintln!("HTTP server error: {}", e);
                }
            });

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
            commands::list_archived_projects,
            commands::get_project,
            commands::create_project,
            commands::update_project,
            commands::delete_project,
            commands::archive_project,
            commands::unarchive_project,
            // Task commands
            commands::list_tasks,
            commands::get_task,
            commands::create_task,
            commands::update_task,
            commands::archive_task,
            commands::unarchive_task,
            commands::delete_task,
            commands::duplicate_task,
            // Chat commands
            commands::list_chats,
            commands::list_standalone_chats,
            commands::list_chats_by_project,
            commands::list_archived_chats,
            commands::get_chat,
            commands::create_chat,
            commands::update_chat,
            commands::delete_chat,
            commands::archive_chat,
            commands::unarchive_chat,
            commands::toggle_step_complete,
            commands::start_workflow_step,
            // Message commands
            commands::list_messages,
            commands::get_message,
            commands::create_message,
            commands::update_message,
            commands::delete_message,
            commands::set_message_streaming,
            commands::append_message_content,
            commands::set_message_tokens,
            commands::count_messages,
            commands::get_latest_message,
            commands::delete_messages_by_chat,
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
            commands::get_full_setting,
            commands::get_settings_by_prefix,
            commands::delete_all_settings,
            commands::set_many_settings,
            // Search commands
            commands::search,
            commands::search_simple,
            commands::search_tasks,
            commands::search_projects,
            commands::search_in_project,
            // Process commands
            commands::get_process,
            commands::list_all_processes,
            commands::list_processes,
            commands::list_all_running_processes,
            commands::list_running_processes,
            commands::kill_process,
            commands::send_process_input,
            commands::resize_process,
            commands::is_process_running,
            commands::running_process_count,
            commands::delete_process,
            // Git commands
            commands::create_worktree,
            commands::delete_worktree,
            commands::get_diff,
            commands::get_commits,
            commands::get_task_diff,
            commands::get_task_commits,
            commands::push_branch,
            commands::get_current_branch,
            commands::get_head_commit,
            commands::has_uncommitted_changes,
            commands::list_worktrees,
            commands::generate_branch_name,
            commands::generate_worktree_path,
            // Terminal commands
            commands::spawn_terminal,
            commands::get_default_shell,
            commands::get_default_shell_response,
            // GitHub commands
            commands::create_pull_request,
            commands::check_gh_cli_installed,
            commands::check_gh_auth_status,
            commands::get_remote_url,
            commands::get_existing_pr,
            commands::get_pr_url,
            commands::get_pr_details,
            // Workflow commands
            commands::list_workflow_templates,
            commands::get_builtin_workflow_templates,
            commands::get_builtin_workflow_template,
            commands::get_workflow_template,
            commands::parse_workflow_content,
            commands::parse_workflow_steps,
            commands::substitute_workflow_variables,
            commands::substitute_workflow_with_context,
            // System commands
            commands::open_in_editor,
            commands::reveal_in_explorer,
            // Artifact commands
            commands::artifacts_list,
            commands::artifact_read,
            commands::shell_open,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
