//! WebSocket Module
//!
//! Provides WebSocket support for real-time bidirectional communication
//! between the server and connected clients.
//!
//! # Architecture
//!
//! The WebSocket system consists of three main components:
//!
//! 1. **Handler** (`handler.rs`): Manages WebSocket upgrade and message processing
//! 2. **Manager** (`manager.rs`): Tracks connected clients and their subscriptions
//! 3. **Broadcaster** (`broadcaster.rs`): Bridges EventBroadcaster to WebSocket clients
//!
//! ```text
//! ┌─────────────────────────────────────────────────────────────────────────┐
//! │                         WebSocket Flow                                   │
//! ├─────────────────────────────────────────────────────────────────────────┤
//! │                                                                          │
//! │  ┌───────────────┐      ┌─────────────────────────────────────────────┐ │
//! │  │  HTTP Request │      │             ws_handler                      │ │
//! │  │  GET /ws      │─────▶│  - Upgrades to WebSocket                    │ │
//! │  └───────────────┘      │  - Spawns handler tasks                     │ │
//! │                         └───────────────┬─────────────────────────────┘ │
//! │                                         │                               │
//! │                                         ▼                               │
//! │  ┌─────────────────────────────────────────────────────────────────────┐│
//! │  │                       handle_socket                                 ││
//! │  │  ┌─────────────────────┐    ┌─────────────────────┐                ││
//! │  │  │     Send Task       │    │    Receive Task     │                ││
//! │  │  │                     │    │                     │                ││
//! │  │  │  rx.recv() ───────▶ │    │  ───────▶ handle_   │                ││
//! │  │  │  sender.send()      │    │         message()   │                ││
//! │  │  └─────────────────────┘    └─────────────────────┘                ││
//! │  └─────────────────────────────────────────────────────────────────────┘│
//! │                                                                          │
//! │  ┌─────────────────────────────────────────────────────────────────────┐│
//! │  │                      ClientManager                                  ││
//! │  │                                                                     ││
//! │  │  - add_client(sender) -> client_id                                  ││
//! │  │  - subscribe(client_id, channel)                                    ││
//! │  │  - broadcast(channel, message) -> sends to subscribed clients       ││
//! │  │  - remove_client(client_id)                                         ││
//! │  └─────────────────────────────────────────────────────────────────────┘│
//! │                                                                          │
//! └─────────────────────────────────────────────────────────────────────────┘
//! ```
//!
//! # Protocol
//!
//! ## Client to Server Messages
//!
//! ```json
//! // Subscribe to a channel
//! {"type": "subscribe", "content": {"channel": "data-changed"}}
//!
//! // Unsubscribe from a channel
//! {"type": "unsubscribe", "content": {"channel": "process-output-abc123"}}
//!
//! // Keep-alive ping
//! {"type": "ping"}
//! ```
//!
//! ## Server to Client Messages
//!
//! ```json
//! // Connection established
//! {"type": "connected", "content": {"client_id": "550e8400-..."}}
//!
//! // Subscription confirmed
//! {"type": "subscribed", "content": {"channel": "data-changed"}}
//!
//! // Event broadcast
//! {"type": "event", "content": {"channel": "data-changed", "payload": {...}}}
//!
//! // Keep-alive response
//! {"type": "pong"}
//!
//! // Error message
//! {"type": "error", "content": {"error": "Invalid message format"}}
//! ```
//!
//! # Channels
//!
//! Clients can subscribe to the following channels:
//!
//! - `data-changed`: CRUD events for all entities (project, task, chat, etc.)
//! - `process-output-{id}`: Stdout/stderr output from a specific process
//! - `process-status-{id}`: Status changes for a specific process
//! - `*`: Wildcard - receive all events (useful for debugging)
//!
//! # Usage
//!
//! ```rust,ignore
//! use std::sync::Arc;
//! use axum::{Router, routing::get};
//! use openflow_server::ws::{ws_handler, ClientManager};
//!
//! // Create the client manager (shared state)
//! let manager = ClientManager::new();
//!
//! // Add WebSocket route
//! let app = Router::new()
//!     .route("/ws", get(ws_handler))
//!     .with_state(manager);
//!
//! // Later, broadcast events to subscribed clients
//! manager.broadcast(
//!     "data-changed",
//!     WsServerMessage::event("data-changed", json!({"entity": "project", ...}))
//! ).await;
//! ```

pub mod broadcaster;
pub mod handler;
pub mod manager;

// Re-export main types
pub use broadcaster::WsBroadcaster;
pub use handler::ws_handler;
pub use manager::{Client, ClientManager};

// Re-export contract types for convenience
pub use openflow_contracts::events::{WsClientMessage, WsServerMessage};
