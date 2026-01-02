//! Tauri IPC command handlers for OpenFlow.
//!
//! Commands are thin wrappers that:
//! 1. Extract state from Tauri
//! 2. Call the appropriate service method from openflow_core
//! 3. Map errors to strings for IPC serialization
//!
//! Pattern:
//! ```rust,ignore
//! #[tauri::command]
//! pub async fn my_command(
//!     state: State<'_, AppState>,
//!     param: MyParam,
//! ) -> Result<MyResponse, String> {
//!     let pool = state.db.lock().await;
//!     openflow_core::services::module::function(&pool, param)
//!         .await
//!         .map_err(|e| e.to_string())
//! }
//! ```

pub mod chats;
pub mod executor;
pub mod git;
pub mod github;
pub mod messages;
pub mod processes;
pub mod projects;
pub mod search;
pub mod settings;
pub mod system;
pub mod tasks;
pub mod terminal;
pub mod workflows;

use sqlx::SqlitePool;
use std::sync::Arc;
use tokio::sync::Mutex;

use openflow_core::events::EventBroadcaster;
use openflow_core::services::process::ProcessService;

/// Application state shared across all Tauri commands.
///
/// This struct is managed by Tauri and available in all command handlers
/// via `State<'_, AppState>`.
///
/// The state contains:
/// - Database pool (wrapped in Mutex for Tauri command access)
/// - Process service for managing PTY processes
/// - Event broadcaster for real-time updates
///
/// The raw pool is also stored for sharing with the embedded HTTP server.
pub struct AppState {
    /// SQLite connection pool wrapped in Arc<Mutex> for thread-safe access.
    pub db: Arc<Mutex<SqlitePool>>,
    /// Raw SQLite pool for sharing with HTTP server (SQLitePool is Clone + internally Arc'd).
    pub pool: SqlitePool,
    /// Process service for managing execution processes and PTYs.
    pub process_service: Arc<ProcessService>,
    /// Event broadcaster for real-time updates to frontend.
    pub broadcaster: Arc<dyn EventBroadcaster>,
}

impl AppState {
    /// Create a new AppState with the given database pool and broadcaster.
    ///
    /// The pool is cloned - one copy goes into the Mutex for Tauri commands,
    /// and one is kept for sharing with the embedded HTTP server.
    ///
    /// The broadcaster is passed to the ProcessService so it can emit
    /// real-time events for process output and status changes.
    pub fn new(pool: SqlitePool, broadcaster: Arc<dyn EventBroadcaster>) -> Self {
        Self {
            db: Arc::new(Mutex::new(pool.clone())),
            pool,
            // Pass broadcaster to ProcessService so it can emit output/status events
            process_service: Arc::new(ProcessService::with_broadcaster(Arc::clone(&broadcaster))),
            broadcaster,
        }
    }

    /// Get a reference to the raw pool for sharing with the HTTP server.
    pub fn get_pool(&self) -> &SqlitePool {
        &self.pool
    }

    /// Get a clone of the process service for sharing with the HTTP server.
    pub fn get_process_service(&self) -> Arc<ProcessService> {
        Arc::clone(&self.process_service)
    }

    /// Get a clone of the broadcaster for sharing with the HTTP server.
    pub fn get_broadcaster(&self) -> Arc<dyn EventBroadcaster> {
        Arc::clone(&self.broadcaster)
    }
}

// Re-export all command functions for registration in lib.rs
pub use chats::*;
pub use executor::*;
pub use git::*;
pub use github::*;
pub use messages::*;
pub use processes::*;
pub use projects::*;
pub use search::*;
pub use settings::*;
pub use system::*;
pub use tasks::*;
pub use terminal::*;
pub use workflows::*;
