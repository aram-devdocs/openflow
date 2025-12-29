//! Tauri IPC command handlers for OpenFlow.
//!
//! Commands are thin wrappers that:
//! 1. Extract state from Tauri
//! 2. Call the appropriate service method
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
//!     MyService::method(&pool, param)
//!         .await
//!         .map_err(|e| e.to_string())
//! }
//! ```

pub mod chats;
pub mod executor;
pub mod git;
pub mod messages;
pub mod processes;
pub mod projects;
pub mod search;
pub mod settings;
pub mod tasks;

use sqlx::SqlitePool;
use std::sync::Arc;
use tokio::sync::Mutex;

use crate::services::ProcessService;

/// Application state shared across all Tauri commands.
///
/// This struct is managed by Tauri and available in all command handlers
/// via `State<'_, AppState>`.
pub struct AppState {
    /// SQLite connection pool wrapped in Arc<Mutex> for thread-safe access.
    pub db: Arc<Mutex<SqlitePool>>,
    /// Process service for managing execution processes and PTYs.
    pub process_service: Arc<ProcessService>,
}

impl AppState {
    /// Create a new AppState with the given database pool.
    pub fn new(pool: SqlitePool) -> Self {
        Self {
            db: Arc::new(Mutex::new(pool)),
            process_service: Arc::new(ProcessService::new()),
        }
    }
}

// Re-export all command functions for registration in lib.rs
pub use chats::*;
pub use executor::*;
pub use git::*;
pub use messages::*;
pub use processes::*;
pub use projects::*;
pub use search::*;
pub use settings::*;
pub use tasks::*;
