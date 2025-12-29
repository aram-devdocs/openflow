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

pub mod projects;
pub mod tasks;
pub mod chats;
pub mod messages;
pub mod executor;
pub mod settings;
pub mod processes;
pub mod git;
pub mod search;

use sqlx::SqlitePool;
use std::sync::Arc;
use tokio::sync::Mutex;

/// Application state shared across all Tauri commands.
///
/// This struct is managed by Tauri and available in all command handlers
/// via `State<'_, AppState>`.
pub struct AppState {
    /// SQLite connection pool wrapped in Arc<Mutex> for thread-safe access.
    pub db: Arc<Mutex<SqlitePool>>,
}

impl AppState {
    /// Create a new AppState with the given database pool.
    pub fn new(pool: SqlitePool) -> Self {
        Self {
            db: Arc::new(Mutex::new(pool)),
        }
    }
}

// Re-export all command functions for registration in lib.rs
pub use projects::*;
pub use tasks::*;
pub use chats::*;
pub use messages::*;
pub use executor::*;
pub use settings::*;
pub use processes::*;
pub use git::*;
pub use search::*;
