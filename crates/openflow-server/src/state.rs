//! Application State
//!
//! Shared state for Axum handlers. This module provides the `AppState` struct
//! that holds all shared resources needed by route handlers.
//!
//! # Components
//!
//! - **Database Pool**: SQLite connection pool for data persistence
//! - **Process Service**: Manages PTY processes and their lifecycle
//! - **Event Broadcaster**: Sends real-time updates to WebSocket clients
//! - **Client Manager**: Manages WebSocket client connections and subscriptions
//! - **Agent Orchestrator**: Manages AI agent processes and output parsing
//! - **Task Executor**: Autonomous task execution engine
//!
//! # Usage
//!
//! ```rust,ignore
//! use openflow_server::AppState;
//! use openflow_core::services::process::ProcessService;
//! use openflow_core::events::ChannelBroadcaster;
//! use openflow_server::ws::ClientManager;
//! use std::sync::Arc;
//!
//! let state = AppState::new(
//!     pool,
//!     Arc::new(ProcessService::new()),
//!     Arc::new(ChannelBroadcaster::default()),
//!     ClientManager::new(),
//! );
//! ```

use std::sync::Arc;

use openflow_core::events::EventBroadcaster;
use openflow_core::services::process::ProcessService;
use openflow_core::services::{AgentOrchestrator, AgentServiceBridge, TaskExecutor};
use sqlx::SqlitePool;

use crate::ws::ClientManager;

/// Shared application state for HTTP handlers
///
/// This struct is cloned for each request handler. All fields use `Arc`
/// or pool patterns to ensure efficient sharing without deep copies.
#[derive(Clone)]
pub struct AppState {
    /// Database connection pool
    ///
    /// SQLite pool with configured max connections and WAL mode enabled.
    pub pool: SqlitePool,

    /// Process service for managing PTY processes
    ///
    /// Handles process spawning, input/output streaming, and lifecycle
    /// management. Wraps the low-level PTY manager with database tracking.
    pub process_service: Arc<ProcessService>,

    /// Event broadcaster for real-time updates
    ///
    /// Used to notify connected clients about data changes and process
    /// events. Implementations include:
    /// - `ChannelBroadcaster`: For standalone server mode
    /// - `WsBroadcaster`: For WebSocket-based updates
    /// - `NullBroadcaster`: For testing
    pub broadcaster: Arc<dyn EventBroadcaster>,

    /// WebSocket client manager
    ///
    /// Tracks connected WebSocket clients and their channel subscriptions.
    /// Used by the WebSocket handler to route events to subscribed clients.
    pub client_manager: Arc<ClientManager>,

    /// Agent orchestrator for managing AI agent processes
    ///
    /// Spawns and monitors agent processes via providers (Claude, Gemini, Codex).
    /// Handles output parsing, event persistence, and permission prompts.
    pub agent_orchestrator: Arc<AgentOrchestrator>,

    /// Task executor for autonomous task execution
    ///
    /// Runs tasks from start to finish in background threads.
    /// Coordinates with AgentOrchestrator to execute steps sequentially.
    pub task_executor: Arc<TaskExecutor>,

    /// Agent service bridge for SDK-based agent communication
    ///
    /// Manages the Node.js agent-service process that wraps the Claude Agent SDK.
    /// Provides type-safe permission handling via structured callbacks.
    pub agent_bridge: Arc<AgentServiceBridge>,
}

impl AppState {
    /// Create new application state
    ///
    /// This constructor creates the `AgentOrchestrator` and `TaskExecutor`
    /// automatically from the provided pool and broadcaster.
    ///
    /// # Arguments
    ///
    /// * `pool` - Database connection pool
    /// * `process_service` - Process service for PTY management
    /// * `broadcaster` - Event broadcaster for real-time updates
    /// * `client_manager` - WebSocket client manager
    pub fn new(
        pool: SqlitePool,
        process_service: Arc<ProcessService>,
        broadcaster: Arc<dyn EventBroadcaster>,
        client_manager: Arc<ClientManager>,
    ) -> Self {
        // Create agent orchestrator (needs pool and broadcaster)
        let agent_orchestrator = Arc::new(AgentOrchestrator::new(
            pool.clone(),
            Arc::clone(&broadcaster),
        ));

        // Start permission timeout background task
        agent_orchestrator.spawn_permission_timeout_task();

        // Create task executor (needs pool, agent orchestrator, and broadcaster)
        let task_executor = Arc::new(TaskExecutor::new(
            pool.clone(),
            Arc::clone(&agent_orchestrator),
            Arc::clone(&broadcaster),
        ));

        // Create agent service bridge for SDK-based agent communication
        let agent_bridge = Arc::new(AgentServiceBridge::new());

        Self {
            pool,
            process_service,
            broadcaster,
            client_manager,
            agent_orchestrator,
            task_executor,
            agent_bridge,
        }
    }

    /// Create application state with defaults for testing
    ///
    /// Uses a `NullBroadcaster` which discards all events and
    /// a default `ClientManager`.
    /// Useful for unit tests that don't need real-time updates.
    #[cfg(any(test, feature = "test-utils"))]
    pub fn new_test(pool: SqlitePool, process_service: Arc<ProcessService>) -> Self {
        use openflow_core::events::NullBroadcaster;

        let broadcaster: Arc<dyn EventBroadcaster> = Arc::new(NullBroadcaster);
        let client_manager = ClientManager::new();

        // Create agent orchestrator and task executor for testing
        let agent_orchestrator = Arc::new(AgentOrchestrator::new(
            pool.clone(),
            Arc::clone(&broadcaster),
        ));

        // Start permission timeout background task (even in tests)
        agent_orchestrator.spawn_permission_timeout_task();

        let task_executor = Arc::new(TaskExecutor::new(
            pool.clone(),
            Arc::clone(&agent_orchestrator),
            Arc::clone(&broadcaster),
        ));

        // Create agent service bridge for testing
        let agent_bridge = Arc::new(AgentServiceBridge::new());

        Self {
            pool,
            process_service,
            broadcaster,
            client_manager,
            agent_orchestrator,
            task_executor,
            agent_bridge,
        }
    }

    /// Create application state with a custom broadcaster
    ///
    /// Builder method to replace the broadcaster.
    pub fn with_broadcaster(mut self, broadcaster: Arc<dyn EventBroadcaster>) -> Self {
        self.broadcaster = broadcaster;
        self
    }

    /// Create application state with a custom process service
    ///
    /// Builder method to replace the process service.
    pub fn with_process_service(mut self, process_service: Arc<ProcessService>) -> Self {
        self.process_service = process_service;
        self
    }

    /// Create application state with a custom client manager
    ///
    /// Builder method to replace the client manager.
    pub fn with_client_manager(mut self, client_manager: Arc<ClientManager>) -> Self {
        self.client_manager = client_manager;
        self
    }

    /// Get a reference to the database pool
    pub fn db(&self) -> &SqlitePool {
        &self.pool
    }

    /// Get a reference to the process service
    pub fn processes(&self) -> &ProcessService {
        &self.process_service
    }

    /// Get a reference to the client manager
    pub fn clients(&self) -> &ClientManager {
        &self.client_manager
    }

    /// Get a reference to the agent orchestrator
    pub fn agent_orchestrator(&self) -> &AgentOrchestrator {
        &self.agent_orchestrator
    }

    /// Get a clone of the agent orchestrator Arc
    pub fn get_agent_orchestrator(&self) -> Arc<AgentOrchestrator> {
        Arc::clone(&self.agent_orchestrator)
    }

    /// Get a reference to the task executor
    pub fn task_executor(&self) -> &TaskExecutor {
        &self.task_executor
    }

    /// Get a clone of the task executor Arc
    pub fn get_task_executor(&self) -> Arc<TaskExecutor> {
        Arc::clone(&self.task_executor)
    }

    /// Get a reference to the agent service bridge
    pub fn agent_bridge(&self) -> &AgentServiceBridge {
        &self.agent_bridge
    }

    /// Get a clone of the agent bridge Arc
    pub fn get_agent_bridge(&self) -> Arc<AgentServiceBridge> {
        Arc::clone(&self.agent_bridge)
    }

    /// Broadcast an event to connected clients
    ///
    /// Convenience method that calls the broadcaster.
    pub fn broadcast(&self, event: openflow_core::events::Event) {
        self.broadcaster.broadcast(event);
    }
}

impl std::fmt::Debug for AppState {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.debug_struct("AppState")
            .field("pool", &"SqlitePool")
            .field("process_service", &"ProcessService")
            .field("broadcaster", &"EventBroadcaster")
            .field("client_manager", &"ClientManager")
            .field("agent_orchestrator", &"AgentOrchestrator")
            .field("task_executor", &"TaskExecutor")
            .field("agent_bridge", &"AgentServiceBridge")
            .finish()
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use openflow_core::events::NullBroadcaster;

    #[tokio::test]
    async fn test_app_state_new() {
        let pool = openflow_db::create_test_db().await.unwrap();
        let process_service = Arc::new(ProcessService::new());
        let broadcaster: Arc<dyn EventBroadcaster> = Arc::new(NullBroadcaster);
        let client_manager = ClientManager::new();

        let state = AppState::new(pool, process_service.clone(), broadcaster, client_manager);

        // Verify state was created correctly
        assert!(std::ptr::eq(
            state.process_service.as_ref(),
            process_service.as_ref()
        ));
    }

    #[tokio::test]
    async fn test_app_state_test_constructor() {
        let pool = openflow_db::create_test_db().await.unwrap();
        let process_service = Arc::new(ProcessService::new());

        let state = AppState::new_test(pool, process_service);

        // Verify state was created with NullBroadcaster and ClientManager
        assert!(format!("{:?}", state).contains("EventBroadcaster"));
        assert!(format!("{:?}", state).contains("ClientManager"));
    }

    #[tokio::test]
    async fn test_app_state_builder_methods() {
        let pool = openflow_db::create_test_db().await.unwrap();
        let process_service = Arc::new(ProcessService::new());
        let broadcaster: Arc<dyn EventBroadcaster> = Arc::new(NullBroadcaster);
        let client_manager = ClientManager::new();

        let new_process_service = Arc::new(ProcessService::new());
        let new_broadcaster: Arc<dyn EventBroadcaster> = Arc::new(NullBroadcaster);
        let new_client_manager = ClientManager::new();

        let state = AppState::new(pool, process_service, broadcaster, client_manager)
            .with_process_service(new_process_service.clone())
            .with_broadcaster(new_broadcaster)
            .with_client_manager(new_client_manager.clone());

        assert!(std::ptr::eq(
            state.process_service.as_ref(),
            new_process_service.as_ref()
        ));
        assert!(std::ptr::eq(
            state.client_manager.as_ref(),
            new_client_manager.as_ref()
        ));
    }

    #[tokio::test]
    async fn test_app_state_convenience_methods() {
        let pool = openflow_db::create_test_db().await.unwrap();
        let process_service = Arc::new(ProcessService::new());
        let broadcaster: Arc<dyn EventBroadcaster> = Arc::new(NullBroadcaster);
        let client_manager = ClientManager::new();

        let state = AppState::new(pool.clone(), process_service, broadcaster, client_manager);

        // Test db() method
        let _db = state.db();

        // Test processes() method
        let _processes = state.processes();

        // Test clients() method
        let _clients = state.clients();
    }

    #[tokio::test]
    async fn test_app_state_clone() {
        let pool = openflow_db::create_test_db().await.unwrap();
        let process_service = Arc::new(ProcessService::new());
        let broadcaster: Arc<dyn EventBroadcaster> = Arc::new(NullBroadcaster);
        let client_manager = ClientManager::new();

        let state = AppState::new(
            pool,
            process_service.clone(),
            broadcaster,
            client_manager.clone(),
        );
        let cloned = state.clone();

        // Verify Arc references are shared
        assert!(std::ptr::eq(
            state.process_service.as_ref(),
            cloned.process_service.as_ref()
        ));
        assert!(std::ptr::eq(
            state.client_manager.as_ref(),
            cloned.client_manager.as_ref()
        ));
    }

    #[tokio::test]
    async fn test_app_state_debug() {
        let pool = openflow_db::create_test_db().await.unwrap();
        let process_service = Arc::new(ProcessService::new());
        let broadcaster: Arc<dyn EventBroadcaster> = Arc::new(NullBroadcaster);
        let client_manager = ClientManager::new();

        let state = AppState::new(pool, process_service, broadcaster, client_manager);
        let debug_str = format!("{:?}", state);

        assert!(debug_str.contains("AppState"));
        assert!(debug_str.contains("SqlitePool"));
        assert!(debug_str.contains("ProcessService"));
        assert!(debug_str.contains("EventBroadcaster"));
        assert!(debug_str.contains("ClientManager"));
    }
}
