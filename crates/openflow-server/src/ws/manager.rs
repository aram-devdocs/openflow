//! WebSocket Client Manager
//!
//! Tracks connected WebSocket clients and their channel subscriptions.
//! Enables broadcasting events to specific channels or all connected clients.
//!
//! # Architecture
//!
//! ```text
//! ┌─────────────────────────────────────────────────────────────────────────┐
//! │                        Client Manager                                    │
//! ├─────────────────────────────────────────────────────────────────────────┤
//! │                                                                          │
//! │  ┌─────────────┐      ┌─────────────────────────────────────────────┐  │
//! │  │   Client A  │      │            ClientManager                    │  │
//! │  │  (Browser)  │◄────►│  ┌───────────────────────────────────────┐  │  │
//! │  └─────────────┘      │  │ clients: HashMap<ClientId, Client>    │  │  │
//! │                       │  │                                       │  │  │
//! │  ┌─────────────┐      │  │ Client {                              │  │  │
//! │  │   Client B  │◄────►│  │   id: String,                         │  │  │
//! │  │   (Tauri)   │      │  │   sender: mpsc::Sender<WsServerMsg>,  │  │  │
//! │  └─────────────┘      │  │   subscriptions: HashSet<channel>,    │  │  │
//! │                       │  │ }                                      │  │  │
//! │  ┌─────────────┐      │  └───────────────────────────────────────┘  │  │
//! │  │   Client C  │◄────►│                                              │  │
//! │  │  (Browser)  │      └─────────────────────────────────────────────┘  │
//! │  └─────────────┘                                                       │
//! │                                                                          │
//! └─────────────────────────────────────────────────────────────────────────┘
//! ```
//!
//! # Usage
//!
//! ```rust,ignore
//! let manager = ClientManager::new();
//!
//! // When a client connects
//! let (tx, rx) = mpsc::unbounded_channel();
//! let client_id = manager.add_client(tx).await;
//!
//! // Subscribe to channels
//! manager.subscribe(&client_id, "data-changed").await;
//! manager.subscribe(&client_id, "process-output-abc123").await;
//!
//! // Broadcast to a channel
//! manager.broadcast("data-changed", event_payload).await;
//!
//! // When client disconnects
//! manager.remove_client(&client_id).await;
//! ```

use std::collections::{HashMap, HashSet};
use std::sync::Arc;

use openflow_contracts::events::{WsServerMessage, CHANNEL_WILDCARD};
use tokio::sync::{mpsc, RwLock};
use uuid::Uuid;

/// A connected WebSocket client
#[derive(Debug)]
pub struct Client {
    /// Unique client identifier
    pub id: String,
    /// Channel for sending messages to this client
    pub sender: mpsc::UnboundedSender<WsServerMessage>,
    /// Set of subscribed channel names
    pub subscriptions: HashSet<String>,
}

impl Client {
    /// Create a new client with a sender channel
    pub fn new(id: String, sender: mpsc::UnboundedSender<WsServerMessage>) -> Self {
        Self {
            id,
            sender,
            subscriptions: HashSet::new(),
        }
    }

    /// Check if client is subscribed to a channel
    ///
    /// Returns true if subscribed to the specific channel or the wildcard channel.
    pub fn is_subscribed(&self, channel: &str) -> bool {
        self.subscriptions.contains(channel) || self.subscriptions.contains(CHANNEL_WILDCARD)
    }

    /// Subscribe to a channel
    pub fn subscribe(&mut self, channel: impl Into<String>) {
        self.subscriptions.insert(channel.into());
    }

    /// Unsubscribe from a channel
    pub fn unsubscribe(&mut self, channel: &str) -> bool {
        self.subscriptions.remove(channel)
    }

    /// Send a message to this client
    ///
    /// Returns true if the message was sent successfully.
    pub fn send(&self, message: WsServerMessage) -> bool {
        self.sender.send(message).is_ok()
    }

    /// Get the number of subscriptions
    pub fn subscription_count(&self) -> usize {
        self.subscriptions.len()
    }
}

/// Manages all connected WebSocket clients
///
/// Thread-safe manager for tracking clients and their subscriptions.
/// Supports broadcasting messages to specific channels or all clients.
#[derive(Default)]
pub struct ClientManager {
    /// Map of client ID to client
    clients: RwLock<HashMap<String, Client>>,
}

impl ClientManager {
    /// Create a new client manager
    pub fn new() -> Arc<Self> {
        Arc::new(Self::default())
    }

    /// Add a new client and return their ID
    ///
    /// The client is assigned a unique UUID.
    pub async fn add_client(&self, sender: mpsc::UnboundedSender<WsServerMessage>) -> String {
        let id = Uuid::new_v4().to_string();
        let client = Client::new(id.clone(), sender);

        tracing::debug!(client_id = %id, "Adding WebSocket client");

        self.clients.write().await.insert(id.clone(), client);
        id
    }

    /// Remove a client by ID
    pub async fn remove_client(&self, id: &str) -> Option<Client> {
        tracing::debug!(client_id = %id, "Removing WebSocket client");
        self.clients.write().await.remove(id)
    }

    /// Get the number of connected clients
    pub async fn client_count(&self) -> usize {
        self.clients.read().await.len()
    }

    /// Check if a client exists
    pub async fn client_exists(&self, id: &str) -> bool {
        self.clients.read().await.contains_key(id)
    }

    /// Subscribe a client to a channel
    ///
    /// Returns true if the subscription was added (client exists).
    pub async fn subscribe(&self, client_id: &str, channel: impl Into<String>) -> bool {
        let channel = channel.into();
        tracing::debug!(client_id = %client_id, channel = %channel, "Subscribing client to channel");

        if let Some(client) = self.clients.write().await.get_mut(client_id) {
            client.subscribe(channel);
            true
        } else {
            false
        }
    }

    /// Unsubscribe a client from a channel
    ///
    /// Returns true if the subscription was removed.
    pub async fn unsubscribe(&self, client_id: &str, channel: &str) -> bool {
        tracing::debug!(client_id = %client_id, channel = %channel, "Unsubscribing client from channel");

        if let Some(client) = self.clients.write().await.get_mut(client_id) {
            client.unsubscribe(channel)
        } else {
            false
        }
    }

    /// Get the channels a client is subscribed to
    pub async fn get_subscriptions(&self, client_id: &str) -> Option<HashSet<String>> {
        self.clients
            .read()
            .await
            .get(client_id)
            .map(|c| c.subscriptions.clone())
    }

    /// Broadcast a message to all clients subscribed to a channel
    ///
    /// Returns the number of clients that received the message.
    pub async fn broadcast(&self, channel: &str, message: WsServerMessage) -> usize {
        let clients = self.clients.read().await;
        let mut sent_count = 0;

        for client in clients.values() {
            if client.is_subscribed(channel) {
                if client.send(message.clone()) {
                    sent_count += 1;
                } else {
                    tracing::warn!(
                        client_id = %client.id,
                        channel = %channel,
                        "Failed to send message to client"
                    );
                }
            }
        }

        if sent_count > 0 {
            tracing::debug!(
                channel = %channel,
                recipients = sent_count,
                "Broadcasted message to clients"
            );
        }

        sent_count
    }

    /// Broadcast a message to all connected clients (regardless of subscriptions)
    ///
    /// Returns the number of clients that received the message.
    pub async fn broadcast_all(&self, message: WsServerMessage) -> usize {
        let clients = self.clients.read().await;
        let mut sent_count = 0;

        for client in clients.values() {
            if client.send(message.clone()) {
                sent_count += 1;
            }
        }

        tracing::debug!(recipients = sent_count, "Broadcasted message to all clients");
        sent_count
    }

    /// Send a message to a specific client
    ///
    /// Returns true if the message was sent successfully.
    pub async fn send_to_client(&self, client_id: &str, message: WsServerMessage) -> bool {
        if let Some(client) = self.clients.read().await.get(client_id) {
            client.send(message)
        } else {
            false
        }
    }

    /// Get all client IDs
    pub async fn client_ids(&self) -> Vec<String> {
        self.clients.read().await.keys().cloned().collect()
    }

    /// Get count of clients subscribed to a channel
    pub async fn channel_subscriber_count(&self, channel: &str) -> usize {
        self.clients
            .read()
            .await
            .values()
            .filter(|c| c.is_subscribed(channel))
            .count()
    }

    /// Get all unique channels that have subscribers
    pub async fn active_channels(&self) -> HashSet<String> {
        let clients = self.clients.read().await;
        let mut channels = HashSet::new();

        for client in clients.values() {
            for channel in &client.subscriptions {
                channels.insert(channel.clone());
            }
        }

        channels
    }

    /// Disconnect all clients gracefully
    ///
    /// Sends a shutdown message to all connected clients and removes them.
    /// Returns the number of clients that were disconnected.
    ///
    /// # Arguments
    ///
    /// * `reason` - The reason for shutdown (e.g., "Server is shutting down")
    pub async fn disconnect_all(&self, reason: impl Into<String>) -> usize {
        let reason = reason.into();
        let shutdown_msg = WsServerMessage::Shutdown {
            reason: reason.clone(),
        };

        tracing::info!(reason = %reason, "Disconnecting all WebSocket clients for graceful shutdown");

        let mut clients = self.clients.write().await;
        let count = clients.len();

        for client in clients.values() {
            if client.send(shutdown_msg.clone()) {
                tracing::debug!(client_id = %client.id, "Sent shutdown message to client");
            } else {
                tracing::warn!(client_id = %client.id, "Failed to send shutdown message to client");
            }
        }

        // Clear all clients
        clients.clear();

        tracing::info!(count = count, "Disconnected all WebSocket clients");
        count
    }

    /// Check if there are any connected clients
    pub async fn has_clients(&self) -> bool {
        !self.clients.read().await.is_empty()
    }
}

impl std::fmt::Debug for ClientManager {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.debug_struct("ClientManager")
            .field("clients", &"<RwLock<HashMap>>")
            .finish()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_add_and_remove_client() {
        let manager = ClientManager::new();

        let (tx, _rx) = mpsc::unbounded_channel();
        let client_id = manager.add_client(tx).await;

        assert!(manager.client_exists(&client_id).await);
        assert_eq!(manager.client_count().await, 1);

        let removed = manager.remove_client(&client_id).await;
        assert!(removed.is_some());
        assert!(!manager.client_exists(&client_id).await);
        assert_eq!(manager.client_count().await, 0);
    }

    #[tokio::test]
    async fn test_subscribe_and_unsubscribe() {
        let manager = ClientManager::new();

        let (tx, _rx) = mpsc::unbounded_channel();
        let client_id = manager.add_client(tx).await;

        // Subscribe
        assert!(manager.subscribe(&client_id, "data-changed").await);
        assert!(manager.subscribe(&client_id, "process-output-123").await);

        let subs = manager.get_subscriptions(&client_id).await.unwrap();
        assert_eq!(subs.len(), 2);
        assert!(subs.contains("data-changed"));
        assert!(subs.contains("process-output-123"));

        // Unsubscribe
        assert!(manager.unsubscribe(&client_id, "data-changed").await);

        let subs = manager.get_subscriptions(&client_id).await.unwrap();
        assert_eq!(subs.len(), 1);
        assert!(!subs.contains("data-changed"));
    }

    #[tokio::test]
    async fn test_subscribe_nonexistent_client() {
        let manager = ClientManager::new();

        assert!(!manager.subscribe("nonexistent", "channel").await);
        assert!(!manager.unsubscribe("nonexistent", "channel").await);
    }

    #[tokio::test]
    async fn test_broadcast_to_subscribed() {
        let manager = ClientManager::new();

        // Create two clients
        let (tx1, mut rx1) = mpsc::unbounded_channel();
        let (tx2, mut rx2) = mpsc::unbounded_channel();

        let client1 = manager.add_client(tx1).await;
        let client2 = manager.add_client(tx2).await;

        // Client1 subscribes to data-changed, Client2 doesn't
        manager.subscribe(&client1, "data-changed").await;

        // Broadcast to data-changed
        let message = WsServerMessage::event("data-changed", serde_json::json!({"test": true}));
        let sent = manager.broadcast("data-changed", message).await;

        assert_eq!(sent, 1);

        // Client1 should receive the message
        let received = rx1.try_recv();
        assert!(received.is_ok());

        // Client2 should not receive the message
        let not_received = rx2.try_recv();
        assert!(not_received.is_err());

        // Clean up
        manager.remove_client(&client1).await;
        manager.remove_client(&client2).await;
    }

    #[tokio::test]
    async fn test_broadcast_with_wildcard() {
        let manager = ClientManager::new();

        let (tx1, mut rx1) = mpsc::unbounded_channel();
        let (tx2, mut rx2) = mpsc::unbounded_channel();

        let client1 = manager.add_client(tx1).await;
        let client2 = manager.add_client(tx2).await;

        // Client1 subscribes to wildcard
        manager.subscribe(&client1, "*").await;
        // Client2 subscribes to specific channel
        manager.subscribe(&client2, "other-channel").await;

        // Broadcast to data-changed
        let message = WsServerMessage::event("data-changed", serde_json::json!({}));
        let sent = manager.broadcast("data-changed", message).await;

        assert_eq!(sent, 1); // Only client1 (wildcard) should receive

        let received = rx1.try_recv();
        assert!(received.is_ok());

        let not_received = rx2.try_recv();
        assert!(not_received.is_err());
    }

    #[tokio::test]
    async fn test_broadcast_all() {
        let manager = ClientManager::new();

        let (tx1, mut rx1) = mpsc::unbounded_channel();
        let (tx2, mut rx2) = mpsc::unbounded_channel();

        let _client1 = manager.add_client(tx1).await;
        let _client2 = manager.add_client(tx2).await;

        // No subscriptions needed for broadcast_all
        let message = WsServerMessage::pong();
        let sent = manager.broadcast_all(message).await;

        assert_eq!(sent, 2);

        assert!(rx1.try_recv().is_ok());
        assert!(rx2.try_recv().is_ok());
    }

    #[tokio::test]
    async fn test_send_to_client() {
        let manager = ClientManager::new();

        let (tx, mut rx) = mpsc::unbounded_channel();
        let client_id = manager.add_client(tx).await;

        let message = WsServerMessage::connected("test");
        assert!(manager.send_to_client(&client_id, message).await);

        let received = rx.try_recv();
        assert!(received.is_ok());

        // Non-existent client
        assert!(!manager.send_to_client("nonexistent", WsServerMessage::pong()).await);
    }

    #[tokio::test]
    async fn test_client_ids() {
        let manager = ClientManager::new();

        let (tx1, _rx1) = mpsc::unbounded_channel();
        let (tx2, _rx2) = mpsc::unbounded_channel();

        let client1 = manager.add_client(tx1).await;
        let client2 = manager.add_client(tx2).await;

        let ids = manager.client_ids().await;
        assert_eq!(ids.len(), 2);
        assert!(ids.contains(&client1));
        assert!(ids.contains(&client2));
    }

    #[tokio::test]
    async fn test_channel_subscriber_count() {
        let manager = ClientManager::new();

        let (tx1, _rx1) = mpsc::unbounded_channel();
        let (tx2, _rx2) = mpsc::unbounded_channel();
        let (tx3, _rx3) = mpsc::unbounded_channel();

        let client1 = manager.add_client(tx1).await;
        let client2 = manager.add_client(tx2).await;
        let client3 = manager.add_client(tx3).await;

        manager.subscribe(&client1, "data-changed").await;
        manager.subscribe(&client2, "data-changed").await;
        manager.subscribe(&client3, "other-channel").await;

        assert_eq!(manager.channel_subscriber_count("data-changed").await, 2);
        assert_eq!(manager.channel_subscriber_count("other-channel").await, 1);
        assert_eq!(manager.channel_subscriber_count("nonexistent").await, 0);
    }

    #[tokio::test]
    async fn test_active_channels() {
        let manager = ClientManager::new();

        let (tx1, _rx1) = mpsc::unbounded_channel();
        let (tx2, _rx2) = mpsc::unbounded_channel();

        let client1 = manager.add_client(tx1).await;
        let client2 = manager.add_client(tx2).await;

        manager.subscribe(&client1, "channel-a").await;
        manager.subscribe(&client1, "channel-b").await;
        manager.subscribe(&client2, "channel-b").await;
        manager.subscribe(&client2, "channel-c").await;

        let channels = manager.active_channels().await;
        assert_eq!(channels.len(), 3);
        assert!(channels.contains("channel-a"));
        assert!(channels.contains("channel-b"));
        assert!(channels.contains("channel-c"));
    }

    #[tokio::test]
    async fn test_client_is_subscribed() {
        let mut client = Client::new(
            "test-id".to_string(),
            mpsc::unbounded_channel().0,
        );

        assert!(!client.is_subscribed("channel-a"));

        client.subscribe("channel-a");
        assert!(client.is_subscribed("channel-a"));
        assert!(!client.is_subscribed("channel-b"));

        // Wildcard subscription
        client.subscribe("*");
        assert!(client.is_subscribed("channel-a"));
        assert!(client.is_subscribed("channel-b"));
        assert!(client.is_subscribed("any-channel"));
    }

    #[tokio::test]
    async fn test_closed_channel_handling() {
        let manager = ClientManager::new();

        let (tx, rx) = mpsc::unbounded_channel();
        let client_id = manager.add_client(tx).await;
        manager.subscribe(&client_id, "test-channel").await;

        // Drop the receiver, closing the channel
        drop(rx);

        // Broadcast should not panic, but the send should fail
        let message = WsServerMessage::pong();
        let sent = manager.broadcast("test-channel", message).await;

        // The send fails because the channel is closed
        assert_eq!(sent, 0);
    }

    #[tokio::test]
    async fn test_disconnect_all() {
        let manager = ClientManager::new();

        let (tx1, mut rx1) = mpsc::unbounded_channel();
        let (tx2, mut rx2) = mpsc::unbounded_channel();

        let _client1 = manager.add_client(tx1).await;
        let _client2 = manager.add_client(tx2).await;

        assert!(manager.has_clients().await);
        assert_eq!(manager.client_count().await, 2);

        // Disconnect all clients
        let disconnected = manager.disconnect_all("Server shutting down").await;
        assert_eq!(disconnected, 2);

        // Verify clients are removed
        assert!(!manager.has_clients().await);
        assert_eq!(manager.client_count().await, 0);

        // Verify both clients received shutdown message
        let msg1 = rx1.try_recv();
        assert!(msg1.is_ok());
        if let WsServerMessage::Shutdown { reason } = msg1.unwrap() {
            assert_eq!(reason, "Server shutting down");
        } else {
            panic!("Expected Shutdown message");
        }

        let msg2 = rx2.try_recv();
        assert!(msg2.is_ok());
        if let WsServerMessage::Shutdown { reason } = msg2.unwrap() {
            assert_eq!(reason, "Server shutting down");
        } else {
            panic!("Expected Shutdown message");
        }
    }

    #[tokio::test]
    async fn test_disconnect_all_empty() {
        let manager = ClientManager::new();

        assert!(!manager.has_clients().await);

        let disconnected = manager.disconnect_all("Server shutting down").await;
        assert_eq!(disconnected, 0);
    }

    #[tokio::test]
    async fn test_has_clients() {
        let manager = ClientManager::new();

        assert!(!manager.has_clients().await);

        let (tx, _rx) = mpsc::unbounded_channel();
        let client_id = manager.add_client(tx).await;

        assert!(manager.has_clients().await);

        manager.remove_client(&client_id).await;

        assert!(!manager.has_clients().await);
    }
}
