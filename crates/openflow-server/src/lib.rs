//! OpenFlow HTTP/WebSocket Server
//!
//! This crate provides the HTTP REST API and WebSocket server for OpenFlow.
//! It can run as:
//! - A standalone server binary
//! - Embedded within the Tauri desktop application
//!
//! # Architecture
//!
//! The server uses Axum for HTTP routing and tower middleware for
//! cross-cutting concerns like CORS and tracing.
//!
//! ```text
//! +------------------+
//! |   HTTP Client    |
//! +--------+---------+
//!          |
//!          v
//! +--------+---------+
//! |   Axum Router    |
//! |   (with CORS,    |
//! |    tracing)      |
//! +--------+---------+
//!          |
//!          v
//! +--------+---------+
//! |  Route Handlers  |
//! +--------+---------+
//!          |
//!          v
//! +--------+---------+
//! |  openflow-core   |
//! |   (services)     |
//! +--------+---------+
//!          |
//!          v
//! +--------+---------+
//! |   openflow-db    |
//! |   (database)     |
//! +------------------+
//! ```
//!
//! # Graceful Shutdown
//!
//! The server supports graceful shutdown via:
//! - SIGTERM signal (Unix)
//! - SIGINT signal (Ctrl+C)
//! - Programmatic shutdown via `ShutdownSignal`
//!
//! When shutdown is triggered:
//! 1. Stop accepting new connections
//! 2. Send shutdown notification to all WebSocket clients
//! 3. Wait for in-flight requests to complete (with timeout)
//! 4. Close database connections
//!
//! # Usage
//!
//! ## Standalone Mode
//!
//! ```bash
//! cargo run -p openflow-server -- --port 3001
//! ```
//!
//! ## Embedded Mode (in Tauri)
//!
//! ```rust,ignore
//! use openflow_server::{ServerConfig, start_embedded_server, ShutdownSignal};
//!
//! // In Tauri setup
//! let shutdown = ShutdownSignal::new();
//! let shutdown_trigger = shutdown.clone();
//! tokio::spawn(start_embedded_server(pool, config, shutdown));
//!
//! // Later, to trigger shutdown:
//! shutdown_trigger.trigger();
//! ```

pub mod config;
pub mod error;
pub mod routes;
pub mod shutdown;
pub mod state;
pub mod ws;

pub use config::ServerConfig;
pub use error::{ServerError, ServerResult};
pub use routes::create_routes;
pub use shutdown::ShutdownSignal;
pub use state::AppState;

// Re-export WebSocket types for convenience
pub use ws::{ws_handler, ClientManager};

use std::sync::Arc;

use axum::Router;
use openflow_core::events::EventBroadcaster;
use openflow_core::services::process::ProcessService;
use openflow_db::{DbConfig, SqlitePool};

use crate::ws::WsBroadcaster;

/// Create the Axum router with all routes
pub fn create_router(state: AppState) -> Router {
    routes::create_routes(state)
}

/// Start the server in standalone mode with signal-based shutdown.
///
/// This initializes the database, creates the process executor,
/// and starts the HTTP server. The server will shut down gracefully
/// when SIGTERM or SIGINT is received.
///
/// # Arguments
///
/// * `config` - Server configuration
///
/// # Errors
///
/// Returns an error if:
/// - Database initialization fails
/// - Server binding fails
///
/// # Graceful Shutdown
///
/// When a shutdown signal is received:
/// 1. The server stops accepting new connections
/// 2. All WebSocket clients receive a shutdown notification
/// 3. The database connection pool is closed
pub async fn start_server(config: ServerConfig) -> Result<(), ServerError> {
    // Create shutdown signal from OS signals
    let shutdown = shutdown::signal_shutdown();
    start_server_with_shutdown(config, shutdown).await
}

/// Start the server with a custom shutdown signal.
///
/// This is useful for testing or when you want to control shutdown programmatically.
///
/// # Arguments
///
/// * `config` - Server configuration
/// * `shutdown` - Shutdown signal to use
pub async fn start_server_with_shutdown(
    config: ServerConfig,
    shutdown: ShutdownSignal,
) -> Result<(), ServerError> {
    tracing::info!(
        "Starting OpenFlow server on {}:{}",
        config.host,
        config.port
    );

    // Initialize database
    let db_path = config
        .database_path
        .clone()
        .unwrap_or_else(|| std::path::PathBuf::from("./openflow.db"));

    let db_config = DbConfig::from_path(&db_path);
    let pool = openflow_db::init_db(db_config)
        .await
        .map_err(|e| ServerError::Database(e.to_string()))?;

    tracing::info!("Database initialized at {:?}", db_path);

    // Create services
    // Use WsBroadcaster so events are sent to WebSocket clients
    let client_manager = ClientManager::new();
    let broadcaster: Arc<dyn EventBroadcaster> = WsBroadcaster::arc(client_manager.clone());
    let process_service = Arc::new(ProcessService::new());

    // Create app state
    let state = AppState::new(
        pool.clone(),
        process_service.clone(),
        broadcaster,
        client_manager.clone(),
    );

    // Create router
    let app = create_router(state);

    // Start server
    let addr = config.socket_addr();
    let listener = tokio::net::TcpListener::bind(&addr)
        .await
        .map_err(|e| ServerError::Config(format!("Failed to bind to {}: {}", addr, e)))?;

    tracing::info!("Server listening on http://{}", addr);

    // Serve with graceful shutdown
    axum::serve(listener, app)
        .with_graceful_shutdown(async move {
            shutdown.wait().await;
            tracing::info!("Shutdown signal received, starting graceful shutdown...");

            // Disconnect all WebSocket clients
            let client_count = client_manager.disconnect_all("Server is shutting down").await;
            if client_count > 0 {
                tracing::info!(
                    "Disconnected {} WebSocket client(s)",
                    client_count
                );
            }

            // Kill all running processes
            tracing::info!("Stopping all running processes...");
            if let Err(e) = process_service.kill_all(&pool).await {
                tracing::warn!("Error killing processes: {}", e);
            }

            // Close database pool
            tracing::info!("Closing database connections...");
            pool.close().await;

            tracing::info!("Graceful shutdown complete");
        })
        .await
        .map_err(|e| ServerError::Internal(format!("Server error: {}", e)))?;

    Ok(())
}

/// Start the server in embedded mode (for Tauri)
///
/// Uses an existing database pool and allows sharing resources
/// with the Tauri application. This version does not set up its own
/// shutdown handling - the server runs until aborted.
///
/// For graceful shutdown support, use [`start_embedded_server_with_shutdown`].
///
/// # Arguments
///
/// * `pool` - Existing database connection pool
/// * `process_service` - Existing process service
/// * `broadcaster` - Existing event broadcaster
/// * `client_manager` - WebSocket client manager
/// * `config` - Server configuration
///
/// # Errors
///
/// Returns an error if server binding fails
pub async fn start_embedded_server(
    pool: SqlitePool,
    process_service: Arc<ProcessService>,
    broadcaster: Arc<dyn EventBroadcaster>,
    client_manager: Arc<ClientManager>,
    config: ServerConfig,
) -> Result<(), ServerError> {
    tracing::info!(
        "Starting embedded OpenFlow server on {}:{}",
        config.host,
        config.port
    );

    // Create app state
    let state = AppState::new(pool, process_service, broadcaster, client_manager);

    // Create router
    let app = create_router(state);

    // Start server
    let addr = config.socket_addr();
    let listener = tokio::net::TcpListener::bind(&addr)
        .await
        .map_err(|e| ServerError::Config(format!("Failed to bind to {}: {}", addr, e)))?;

    tracing::info!("Embedded server listening on http://{}", addr);

    axum::serve(listener, app)
        .await
        .map_err(|e| ServerError::Internal(format!("Server error: {}", e)))?;

    Ok(())
}

/// Start the server in embedded mode with graceful shutdown support.
///
/// Uses an existing database pool and allows sharing resources
/// with the Tauri application. This version supports graceful shutdown
/// via the provided `ShutdownSignal`.
///
/// # Arguments
///
/// * `pool` - Existing database connection pool
/// * `process_service` - Existing process service
/// * `broadcaster` - Existing event broadcaster
/// * `client_manager` - WebSocket client manager
/// * `config` - Server configuration
/// * `shutdown` - Shutdown signal to listen for
///
/// # Errors
///
/// Returns an error if server binding fails
///
/// # Example
///
/// ```rust,ignore
/// use openflow_server::{ShutdownSignal, start_embedded_server_with_shutdown};
///
/// // In Tauri setup
/// let shutdown = ShutdownSignal::new();
/// let trigger = shutdown.clone();
///
/// tokio::spawn(async move {
///     start_embedded_server_with_shutdown(
///         pool,
///         process_service,
///         broadcaster,
///         client_manager,
///         config,
///         shutdown,
///     ).await
/// });
///
/// // Later, trigger graceful shutdown:
/// trigger.trigger();
/// ```
pub async fn start_embedded_server_with_shutdown(
    pool: SqlitePool,
    process_service: Arc<ProcessService>,
    broadcaster: Arc<dyn EventBroadcaster>,
    client_manager: Arc<ClientManager>,
    config: ServerConfig,
    shutdown: ShutdownSignal,
) -> Result<(), ServerError> {
    tracing::info!(
        "Starting embedded OpenFlow server on {}:{} (with graceful shutdown support)",
        config.host,
        config.port
    );

    // Create app state
    let state = AppState::new(
        pool.clone(),
        process_service.clone(),
        broadcaster,
        client_manager.clone(),
    );

    // Create router
    let app = create_router(state);

    // Start server
    let addr = config.socket_addr();
    let listener = tokio::net::TcpListener::bind(&addr)
        .await
        .map_err(|e| ServerError::Config(format!("Failed to bind to {}: {}", addr, e)))?;

    tracing::info!("Embedded server listening on http://{}", addr);

    // Serve with graceful shutdown
    axum::serve(listener, app)
        .with_graceful_shutdown(async move {
            shutdown.wait().await;
            tracing::info!("Embedded server shutdown signal received...");

            // Disconnect all WebSocket clients
            let client_count = client_manager.disconnect_all("Server is shutting down").await;
            if client_count > 0 {
                tracing::info!(
                    "Disconnected {} WebSocket client(s)",
                    client_count
                );
            }

            // Note: We don't kill processes or close the pool here because
            // in embedded mode, those resources are owned by the parent (Tauri)
            // and may still be needed for the IPC layer.

            tracing::info!("Embedded server graceful shutdown complete");
        })
        .await
        .map_err(|e| ServerError::Internal(format!("Server error: {}", e)))?;

    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use openflow_core::events::NullBroadcaster;
    use std::time::Duration;

    #[test]
    fn test_server_config_default() {
        let config = ServerConfig::default();
        assert_eq!(config.port, 3001);
        assert_eq!(config.host, "127.0.0.1");
    }

    #[tokio::test]
    async fn test_start_embedded_server_creates_working_server() {
        // Create test database and services
        let pool = openflow_db::create_test_db().await.unwrap();
        let process_service = Arc::new(ProcessService::new());
        let broadcaster: Arc<dyn EventBroadcaster> = Arc::new(NullBroadcaster);
        let client_manager = ClientManager::new();

        // Use a random port to avoid conflicts
        let port = 30000 + (std::process::id() as u16 % 1000);
        let config = ServerConfig::default().with_port(port);
        let addr = config.socket_addr();

        // Spawn server in background
        let pool_clone = pool.clone();
        let server_handle = tokio::spawn(async move {
            start_embedded_server(pool_clone, process_service, broadcaster, client_manager, config).await
        });

        // Wait for server to start
        tokio::time::sleep(Duration::from_millis(100)).await;

        // Test health endpoint
        let client = reqwest::Client::new();
        let response = client
            .get(format!("http://{}/api/health", addr))
            .timeout(Duration::from_secs(5))
            .send()
            .await;

        // Server should respond
        assert!(
            response.is_ok(),
            "Server should respond to health check: {:?}",
            response.err()
        );
        let resp = response.unwrap();
        assert_eq!(resp.status(), 200);

        // Abort server
        server_handle.abort();
    }

    #[tokio::test]
    async fn test_start_embedded_server_shares_database_state() {
        use openflow_contracts::CreateProjectRequest;
        use openflow_core::services::project;

        // Create test database and insert a project
        let pool = openflow_db::create_test_db().await.unwrap();
        let project = project::create(
            &pool,
            CreateProjectRequest {
                name: "Test Project".to_string(),
                git_repo_path: "/tmp/test".to_string(),
                ..Default::default()
            },
        )
        .await
        .unwrap();

        let process_service = Arc::new(ProcessService::new());
        let broadcaster: Arc<dyn EventBroadcaster> = Arc::new(NullBroadcaster);
        let client_manager = ClientManager::new();

        // Use a random port
        let port = 31000 + (std::process::id() as u16 % 1000);
        let config = ServerConfig::default().with_port(port);
        let addr = config.socket_addr();

        // Spawn server with existing pool
        let pool_clone = pool.clone();
        let server_handle = tokio::spawn(async move {
            start_embedded_server(pool_clone, process_service, broadcaster, client_manager, config).await
        });

        // Wait for server to start
        tokio::time::sleep(Duration::from_millis(100)).await;

        // Fetch the project via HTTP
        let client = reqwest::Client::new();
        let response = client
            .get(format!("http://{}/api/projects/{}", addr, project.id))
            .timeout(Duration::from_secs(5))
            .send()
            .await
            .unwrap();

        assert_eq!(response.status(), 200);

        let fetched: openflow_contracts::Project = response.json().await.unwrap();
        assert_eq!(fetched.name, "Test Project");
        assert_eq!(fetched.id, project.id);

        // Abort server
        server_handle.abort();
    }

    #[tokio::test]
    async fn test_start_embedded_server_port_in_use() {
        // First, bind to a port
        let port = 32000 + (std::process::id() as u16 % 1000);
        let listener = tokio::net::TcpListener::bind(format!("127.0.0.1:{}", port))
            .await
            .unwrap();

        // Try to start server on same port - should fail
        let pool = openflow_db::create_test_db().await.unwrap();
        let process_service = Arc::new(ProcessService::new());
        let broadcaster: Arc<dyn EventBroadcaster> = Arc::new(NullBroadcaster);
        let client_manager = ClientManager::new();
        let config = ServerConfig::default().with_port(port);

        let result = start_embedded_server(pool, process_service, broadcaster, client_manager, config).await;

        assert!(result.is_err(), "Should fail when port is already in use");
        let err = result.unwrap_err();
        assert!(
            matches!(err, ServerError::Config(_)),
            "Should be a config error, got: {:?}",
            err
        );

        // Clean up
        drop(listener);
    }
}
