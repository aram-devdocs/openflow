//! WebSocket Handler
//!
//! Handles WebSocket upgrade, connection lifecycle, and message processing.
//!
//! # Protocol
//!
//! ## Client Messages (WsClientMessage)
//!
//! - `subscribe { channel }`: Subscribe to an event channel
//! - `unsubscribe { channel }`: Unsubscribe from an event channel
//! - `ping`: Keep-alive ping
//!
//! ## Server Messages (WsServerMessage)
//!
//! - `connected { client_id }`: Connection established
//! - `subscribed { channel }`: Subscription confirmed
//! - `unsubscribed { channel }`: Unsubscription confirmed
//! - `pong`: Response to ping
//! - `event { channel, payload }`: Event broadcast
//! - `error { error }`: Error message
//!
//! # Usage
//!
//! ```rust,ignore
//! use axum::{Router, routing::get};
//! use openflow_server::{ws::ws_handler, AppState};
//!
//! // ws_handler extracts ClientManager from AppState
//! let app = Router::new()
//!     .route("/ws", get(ws_handler))
//!     .with_state(app_state);
//! ```

use std::sync::Arc;

use axum::{
    extract::{
        ws::{Message, WebSocket},
        State, WebSocketUpgrade,
    },
    response::Response,
};
use futures::{SinkExt, StreamExt};
use openflow_contracts::events::{WsClientMessage, WsServerMessage};

use crate::state::AppState;
use crate::ws::manager::ClientManager;

/// WebSocket upgrade handler
///
/// Upgrades an HTTP connection to WebSocket and begins handling messages.
/// Extracts the `ClientManager` from `AppState`.
pub async fn ws_handler(ws: WebSocketUpgrade, State(state): State<AppState>) -> Response {
    tracing::debug!("WebSocket upgrade requested");
    let manager = state.client_manager.clone();
    ws.on_upgrade(|socket| handle_socket(socket, manager))
}

/// Handle a WebSocket connection
async fn handle_socket(socket: WebSocket, manager: Arc<ClientManager>) {
    let (mut sender, mut receiver) = socket.split();

    // Create channel for outgoing messages
    let (tx, mut rx) = tokio::sync::mpsc::unbounded_channel::<WsServerMessage>();

    // Register client with the manager
    let client_id = manager.add_client(tx).await;
    tracing::info!(client_id = %client_id, "WebSocket client connected");

    // Send connected message
    let connected_msg = WsServerMessage::connected(&client_id);
    if let Ok(json) = serde_json::to_string(&connected_msg) {
        if let Err(e) = sender.send(Message::Text(json.into())).await {
            tracing::error!(client_id = %client_id, error = %e, "Failed to send connected message");
            manager.remove_client(&client_id).await;
            return;
        }
    }

    // Spawn task to forward outgoing messages to the WebSocket
    let client_id_send = client_id.clone();
    let send_task = tokio::spawn(async move {
        while let Some(msg) = rx.recv().await {
            match serde_json::to_string(&msg) {
                Ok(json) => {
                    if sender.send(Message::Text(json.into())).await.is_err() {
                        tracing::debug!(
                            client_id = %client_id_send,
                            "WebSocket send failed, closing connection"
                        );
                        break;
                    }
                }
                Err(e) => {
                    tracing::warn!(
                        client_id = %client_id_send,
                        error = %e,
                        "Failed to serialize outgoing message"
                    );
                }
            }
        }
    });

    // Handle incoming messages
    let manager_recv = manager.clone();
    let client_id_recv = client_id.clone();

    let recv_task = tokio::spawn(async move {
        while let Some(result) = receiver.next().await {
            match result {
                Ok(message) => {
                    if !handle_message(&manager_recv, &client_id_recv, message).await {
                        break;
                    }
                }
                Err(e) => {
                    tracing::debug!(
                        client_id = %client_id_recv,
                        error = %e,
                        "WebSocket receive error"
                    );
                    break;
                }
            }
        }
    });

    // Wait for either task to complete
    tokio::select! {
        _ = send_task => {
            tracing::debug!(client_id = %client_id, "Send task completed");
        }
        _ = recv_task => {
            tracing::debug!(client_id = %client_id, "Receive task completed");
        }
    }

    // Cleanup
    manager.remove_client(&client_id).await;
    tracing::info!(client_id = %client_id, "WebSocket client disconnected");
}

/// Handle a single WebSocket message
///
/// Returns false if the connection should be closed.
async fn handle_message(manager: &ClientManager, client_id: &str, message: Message) -> bool {
    match message {
        Message::Text(text) => {
            let text_str: &str = text.as_ref();
            match serde_json::from_str::<WsClientMessage>(text_str) {
                Ok(msg) => {
                    handle_client_message(manager, client_id, msg).await;
                    true
                }
                Err(e) => {
                    tracing::warn!(
                        client_id = %client_id,
                        error = %e,
                        text = %text,
                        "Failed to parse client message"
                    );
                    // Send error response but don't close connection
                    let error_msg = WsServerMessage::error(format!("Invalid message format: {}", e));
                    manager.send_to_client(client_id, error_msg).await;
                    true
                }
            }
        }
        Message::Binary(data) => {
            tracing::debug!(
                client_id = %client_id,
                len = data.len(),
                "Received binary message (ignored)"
            );
            true
        }
        Message::Ping(data) => {
            tracing::trace!(client_id = %client_id, "Received ping");
            // Axum handles ping/pong automatically, but we can also respond
            // The framework should auto-respond with Pong
            let _ = data; // Acknowledge
            true
        }
        Message::Pong(_) => {
            tracing::trace!(client_id = %client_id, "Received pong");
            true
        }
        Message::Close(frame) => {
            if let Some(cf) = frame {
                tracing::debug!(
                    client_id = %client_id,
                    code = u16::from(cf.code),
                    reason = %cf.reason,
                    "Client initiated close"
                );
            } else {
                tracing::debug!(client_id = %client_id, "Client initiated close (no frame)");
            }
            false
        }
    }
}

/// Handle a parsed client message
async fn handle_client_message(manager: &ClientManager, client_id: &str, msg: WsClientMessage) {
    match msg {
        WsClientMessage::Subscribe { channel } => {
            tracing::debug!(
                client_id = %client_id,
                channel = %channel,
                "Client subscribing to channel"
            );

            manager.subscribe(client_id, &channel).await;

            let response = WsServerMessage::subscribed(&channel);
            manager.send_to_client(client_id, response).await;
        }

        WsClientMessage::Unsubscribe { channel } => {
            tracing::debug!(
                client_id = %client_id,
                channel = %channel,
                "Client unsubscribing from channel"
            );

            manager.unsubscribe(client_id, &channel).await;

            let response = WsServerMessage::unsubscribed(&channel);
            manager.send_to_client(client_id, response).await;
        }

        WsClientMessage::Ping => {
            tracing::trace!(client_id = %client_id, "Client sent application ping");
            let response = WsServerMessage::pong();
            manager.send_to_client(client_id, response).await;
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_handle_subscribe_message() {
        let manager = ClientManager::new();

        let (tx, _rx) = tokio::sync::mpsc::unbounded_channel();
        let client_id = manager.add_client(tx).await;

        let msg = WsClientMessage::Subscribe {
            channel: "data-changed".to_string(),
        };

        handle_client_message(&manager, &client_id, msg).await;

        let subs = manager.get_subscriptions(&client_id).await.unwrap();
        assert!(subs.contains("data-changed"));
    }

    #[tokio::test]
    async fn test_handle_unsubscribe_message() {
        let manager = ClientManager::new();

        let (tx, _rx) = tokio::sync::mpsc::unbounded_channel();
        let client_id = manager.add_client(tx).await;

        // Subscribe first
        manager.subscribe(&client_id, "data-changed").await;

        let msg = WsClientMessage::Unsubscribe {
            channel: "data-changed".to_string(),
        };

        handle_client_message(&manager, &client_id, msg).await;

        let subs = manager.get_subscriptions(&client_id).await.unwrap();
        assert!(!subs.contains("data-changed"));
    }

    #[tokio::test]
    async fn test_handle_ping_message() {
        let manager = ClientManager::new();

        let (tx, mut rx) = tokio::sync::mpsc::unbounded_channel();
        let client_id = manager.add_client(tx).await;

        let msg = WsClientMessage::Ping;

        handle_client_message(&manager, &client_id, msg).await;

        // Should receive pong
        let response = rx.try_recv().unwrap();
        assert!(matches!(response, WsServerMessage::Pong));
    }

    #[test]
    fn test_client_message_parsing() {
        // Subscribe
        let json = r#"{"type":"subscribe","content":{"channel":"data-changed"}}"#;
        let msg: WsClientMessage = serde_json::from_str(json).unwrap();
        assert!(matches!(msg, WsClientMessage::Subscribe { channel } if channel == "data-changed"));

        // Unsubscribe
        let json = r#"{"type":"unsubscribe","content":{"channel":"test"}}"#;
        let msg: WsClientMessage = serde_json::from_str(json).unwrap();
        assert!(matches!(msg, WsClientMessage::Unsubscribe { channel } if channel == "test"));

        // Ping
        let json = r#"{"type":"ping"}"#;
        let msg: WsClientMessage = serde_json::from_str(json).unwrap();
        assert!(matches!(msg, WsClientMessage::Ping));
    }

    #[test]
    fn test_server_message_serialization() {
        // Connected
        let msg = WsServerMessage::connected("client-123");
        let json = serde_json::to_string(&msg).unwrap();
        assert!(json.contains("\"type\":\"connected\""));
        assert!(json.contains("\"client_id\":\"client-123\""));

        // Subscribed
        let msg = WsServerMessage::subscribed("data-changed");
        let json = serde_json::to_string(&msg).unwrap();
        assert!(json.contains("\"type\":\"subscribed\""));
        assert!(json.contains("\"channel\":\"data-changed\""));

        // Event
        let msg = WsServerMessage::event("test", serde_json::json!({"key": "value"}));
        let json = serde_json::to_string(&msg).unwrap();
        assert!(json.contains("\"type\":\"event\""));
        assert!(json.contains("\"channel\":\"test\""));
        assert!(json.contains("\"key\":\"value\""));

        // Pong
        let msg = WsServerMessage::pong();
        let json = serde_json::to_string(&msg).unwrap();
        assert!(json.contains("\"type\":\"pong\""));

        // Error
        let msg = WsServerMessage::error("something went wrong");
        let json = serde_json::to_string(&msg).unwrap();
        assert!(json.contains("\"type\":\"error\""));
        assert!(json.contains("\"error\":\"something went wrong\""));
    }
}
