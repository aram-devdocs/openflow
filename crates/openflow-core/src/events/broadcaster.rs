//! Event Broadcaster Implementations
//!
//! Provides the `EventBroadcaster` trait and implementations for
//! different transport mechanisms.

use std::sync::Arc;
use tokio::sync::broadcast;

use super::Event;

/// Trait for broadcasting events to connected clients.
///
/// Implementors of this trait handle the actual delivery of events
/// to clients via their specific transport mechanism.
///
/// # Implementations
///
/// - `NullBroadcaster`: No-op implementation for testing
/// - `ChannelBroadcaster`: Uses tokio broadcast channels (internal use)
/// - Tauri: Uses `AppHandle::emit()` (in src-tauri)
/// - WebSocket: Sends to connected WS clients (in openflow-server)
pub trait EventBroadcaster: Send + Sync {
    /// Broadcast an event to all subscribed clients.
    ///
    /// This method should be non-blocking and fire-and-forget.
    /// Errors during broadcast should be logged, not propagated.
    fn broadcast(&self, event: Event);

    /// Broadcast an event asynchronously.
    ///
    /// Default implementation calls the sync broadcast method.
    fn broadcast_async(&self, event: Event) -> std::pin::Pin<Box<dyn std::future::Future<Output = ()> + Send + '_>> {
        self.broadcast(event);
        Box::pin(async {})
    }
}

/// No-op broadcaster for testing and situations where events are not needed.
#[derive(Debug, Default, Clone)]
pub struct NullBroadcaster;

impl NullBroadcaster {
    /// Create a new null broadcaster
    pub fn new() -> Self {
        Self
    }

    /// Create a new null broadcaster wrapped in Arc
    pub fn arc() -> Arc<Self> {
        Arc::new(Self::new())
    }
}

impl EventBroadcaster for NullBroadcaster {
    fn broadcast(&self, _event: Event) {
        // Intentionally do nothing
    }
}

/// Broadcaster using tokio broadcast channels.
///
/// Useful for internal event distribution within a single process.
#[derive(Debug, Clone)]
pub struct ChannelBroadcaster {
    sender: broadcast::Sender<Event>,
}

impl ChannelBroadcaster {
    /// Create a new channel broadcaster with the given capacity.
    ///
    /// # Arguments
    ///
    /// * `capacity` - Maximum number of events to buffer before dropping old ones
    pub fn new(capacity: usize) -> Self {
        let (sender, _) = broadcast::channel(capacity);
        Self { sender }
    }

    /// Create a new channel broadcaster with default capacity (256 events).
    pub fn default_capacity() -> Self {
        Self::new(256)
    }

    /// Create a new channel broadcaster wrapped in Arc.
    pub fn arc(capacity: usize) -> Arc<Self> {
        Arc::new(Self::new(capacity))
    }

    /// Subscribe to receive events.
    ///
    /// Returns a receiver that will receive all events broadcast after subscription.
    pub fn subscribe(&self) -> broadcast::Receiver<Event> {
        self.sender.subscribe()
    }

    /// Get the number of active subscribers.
    pub fn subscriber_count(&self) -> usize {
        self.sender.receiver_count()
    }
}

impl Default for ChannelBroadcaster {
    fn default() -> Self {
        Self::default_capacity()
    }
}

impl EventBroadcaster for ChannelBroadcaster {
    fn broadcast(&self, event: Event) {
        // Ignore send errors - they occur when there are no receivers
        let _ = self.sender.send(event);
    }
}

/// Broadcaster that collects events for testing.
#[cfg(test)]
pub struct CollectingBroadcaster {
    events: std::sync::Mutex<Vec<Event>>,
}

#[cfg(test)]
impl CollectingBroadcaster {
    /// Create a new collecting broadcaster
    pub fn new() -> Self {
        Self {
            events: std::sync::Mutex::new(Vec::new()),
        }
    }

    /// Get all collected events
    pub fn events(&self) -> Vec<Event> {
        self.events.lock().unwrap().clone()
    }

    /// Clear all collected events
    pub fn clear(&self) {
        self.events.lock().unwrap().clear();
    }

    /// Get the number of collected events
    pub fn len(&self) -> usize {
        self.events.lock().unwrap().len()
    }

    /// Check if no events have been collected
    pub fn is_empty(&self) -> bool {
        self.events.lock().unwrap().is_empty()
    }
}

#[cfg(test)]
impl EventBroadcaster for CollectingBroadcaster {
    fn broadcast(&self, event: Event) {
        self.events.lock().unwrap().push(event);
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::events::{DataAction, EntityType, OutputType, ProcessStatus};

    #[test]
    fn test_null_broadcaster() {
        let broadcaster = NullBroadcaster::new();
        // Should not panic
        broadcaster.broadcast(Event::deleted(EntityType::Project, "123"));
    }

    #[test]
    fn test_channel_broadcaster() {
        let broadcaster = ChannelBroadcaster::new(16);
        let mut receiver = broadcaster.subscribe();

        broadcaster.broadcast(Event::process_output("proc-1", OutputType::Stdout, "hello"));

        let received = receiver.try_recv().unwrap();
        match received {
            Event::ProcessOutput { process_id, content, .. } => {
                assert_eq!(process_id, "proc-1");
                assert_eq!(content, "hello");
            }
            _ => panic!("Wrong event type"),
        }
    }

    #[test]
    fn test_channel_broadcaster_multiple_subscribers() {
        let broadcaster = ChannelBroadcaster::new(16);
        let mut receiver1 = broadcaster.subscribe();
        let mut receiver2 = broadcaster.subscribe();

        assert_eq!(broadcaster.subscriber_count(), 2);

        broadcaster.broadcast(Event::process_status("proc-1", ProcessStatus::Running, None));

        // Both receivers should get the event
        assert!(receiver1.try_recv().is_ok());
        assert!(receiver2.try_recv().is_ok());
    }

    #[test]
    fn test_collecting_broadcaster() {
        let broadcaster = CollectingBroadcaster::new();
        assert!(broadcaster.is_empty());

        broadcaster.broadcast(Event::created(EntityType::Project, "p1", &serde_json::json!({"name": "Test"})));
        broadcaster.broadcast(Event::deleted(EntityType::Task, "t1"));

        assert_eq!(broadcaster.len(), 2);

        let events = broadcaster.events();
        assert_eq!(events.len(), 2);

        broadcaster.clear();
        assert!(broadcaster.is_empty());
    }

    #[tokio::test]
    async fn test_channel_broadcaster_async() {
        let broadcaster = ChannelBroadcaster::new(16);
        let mut receiver = broadcaster.subscribe();

        broadcaster.broadcast(Event::data_changed(
            EntityType::Chat,
            DataAction::Updated,
            "chat-1",
            Some(serde_json::json!({"title": "Updated Chat"})),
        ));

        // Use async receive
        let received = receiver.recv().await.unwrap();
        match received {
            Event::DataChanged { entity, action, id, .. } => {
                assert_eq!(entity, EntityType::Chat);
                assert_eq!(action, DataAction::Updated);
                assert_eq!(id, "chat-1");
            }
            _ => panic!("Wrong event type"),
        }
    }
}
