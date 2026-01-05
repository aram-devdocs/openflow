//! WebSocket Event Broadcaster
//!
//! Bridges the `EventBroadcaster` trait from `openflow_core` to WebSocket clients.
//! This allows services to broadcast events without knowing about WebSocket details.
//!
//! # Architecture
//!
//! ```text
//! ┌─────────────────────────────────────────────────────────────────────────┐
//! │                     Event Broadcasting Flow                              │
//! ├─────────────────────────────────────────────────────────────────────────┤
//! │                                                                          │
//! │  ┌─────────────────┐     ┌─────────────────────────────────────────────┐│
//! │  │     Service     │     │              WsBroadcaster                  ││
//! │  │ (project, task) │     │                                             ││
//! │  └────────┬────────┘     │  Implements: EventBroadcaster trait         ││
//! │           │              │                                             ││
//! │           │ broadcast()  │  Maps openflow_core::events::Event to:      ││
//! │           │──────────────▶│   - Channel name (e.g., "data-changed")   ││
//! │           │              │   - WsServerMessage payload                 ││
//! │           │              │                                             ││
//! │           │              └─────────────────────────┬───────────────────┘│
//! │           │                                        │                    │
//! │           │                                        ▼                    │
//! │           │              ┌─────────────────────────────────────────────┐│
//! │           │              │            ClientManager                    ││
//! │           │              │                                             ││
//! │           │              │  broadcast(channel, message) ───▶ Clients  ││
//! │           │              │                                             ││
//! │           │              └─────────────────────────────────────────────┘│
//! │                                                                          │
//! └─────────────────────────────────────────────────────────────────────────┘
//! ```
//!
//! # Usage
//!
//! ```rust,ignore
//! use std::sync::Arc;
//! use openflow_core::events::{Event, EventBroadcaster};
//! use openflow_server::ws::{ClientManager, WsBroadcaster};
//!
//! // Create the client manager and broadcaster
//! let manager = ClientManager::new();
//! let broadcaster = WsBroadcaster::new(manager.clone());
//!
//! // Use as EventBroadcaster trait object
//! let broadcaster: Arc<dyn EventBroadcaster> = Arc::new(broadcaster);
//!
//! // Pass to services that need to broadcast events
//! // The service doesn't need to know about WebSocket details
//! ```

use std::sync::Arc;

use openflow_contracts::events::{
    agent_event_channel, claude_event_channel, permission_request_channel, process_output_channel,
    process_status_channel, step_progress_channel, task_progress_channel, tool_state_channel,
    ClaudeEventData, DataChangedEvent, ProcessOutputEvent, ProcessStatusEvent, ToolStateEvent,
    WsServerMessage, CHANNEL_DATA_CHANGED,
};
use openflow_core::events::{
    DataAction as CoreDataAction, EntityType as CoreEntityType, Event as CoreEvent,
    EventBroadcaster, OutputType as CoreOutputType, ProcessStatus as CoreProcessStatus,
};

use crate::ws::manager::ClientManager;

/// WebSocket-based event broadcaster
///
/// Implements the `EventBroadcaster` trait from `openflow_core`, allowing
/// services to broadcast events without knowing about WebSocket details.
///
/// The broadcaster converts `openflow_core::events::Event` to contract
/// types and sends them to subscribed WebSocket clients via the `ClientManager`.
///
/// # Thread Safety
///
/// This broadcaster stores a Tokio runtime handle, allowing it to be called
/// from any thread (including non-Tokio threads like PTY output streamers).
pub struct WsBroadcaster {
    /// Client manager for sending messages to WebSocket clients
    manager: Arc<ClientManager>,
    /// Tokio runtime handle for spawning async tasks from any thread
    runtime_handle: tokio::runtime::Handle,
}

impl WsBroadcaster {
    /// Create a new WebSocket broadcaster
    ///
    /// # Arguments
    ///
    /// * `manager` - The client manager that tracks connected WebSocket clients
    ///
    /// # Panics
    ///
    /// Panics if called outside of a Tokio runtime context. This must be
    /// called during server initialization when a Tokio runtime is active.
    pub fn new(manager: Arc<ClientManager>) -> Self {
        let runtime_handle = tokio::runtime::Handle::current();
        Self {
            manager,
            runtime_handle,
        }
    }

    /// Create a new broadcaster wrapped in Arc
    ///
    /// # Panics
    ///
    /// Panics if called outside of a Tokio runtime context.
    pub fn arc(manager: Arc<ClientManager>) -> Arc<Self> {
        Arc::new(Self::new(manager))
    }

    /// Get a reference to the client manager
    pub fn manager(&self) -> &Arc<ClientManager> {
        &self.manager
    }

    /// Convert a core event to a contract event and broadcast it
    async fn broadcast_async_impl(&self, event: CoreEvent) {
        let (channel, ws_message) = self.event_to_message(event);

        let count = self.manager.broadcast(&channel, ws_message).await;

        if count > 0 {
            tracing::debug!(
                channel = %channel,
                recipients = count,
                "Broadcasted event via WebSocket"
            );
        }
    }

    /// Convert a core event to a channel name and WebSocket message
    fn event_to_message(&self, event: CoreEvent) -> (String, WsServerMessage) {
        match event {
            CoreEvent::ProcessOutput {
                process_id,
                output_type,
                content,
                timestamp,
            } => {
                let channel = process_output_channel(&process_id);
                let contract_event = ProcessOutputEvent {
                    process_id: process_id.clone(),
                    output_type: convert_output_type(output_type),
                    content,
                    timestamp,
                };
                let message = WsServerMessage::process_output(&contract_event);
                (channel, message)
            }

            CoreEvent::ProcessStatus {
                process_id,
                status,
                exit_code,
            } => {
                let channel = process_status_channel(&process_id);
                let contract_event = ProcessStatusEvent {
                    process_id: process_id.clone(),
                    status: convert_process_status(status),
                    exit_code,
                };
                let message = WsServerMessage::process_status(&contract_event);
                (channel, message)
            }

            CoreEvent::DataChanged {
                entity,
                action,
                id,
                data,
            } => {
                let channel = CHANNEL_DATA_CHANGED.to_string();
                let contract_event = DataChangedEvent {
                    entity: convert_entity_type(entity),
                    action: convert_data_action(action),
                    id,
                    data,
                    timestamp: Some(chrono::Utc::now().to_rfc3339()),
                    parent_id: None,
                };
                let message = WsServerMessage::data_changed(&contract_event);
                (channel, message)
            }

            CoreEvent::ClaudeEvent {
                process_id,
                event,
                timestamp,
            } => {
                let channel = claude_event_channel(&process_id);
                let contract_event = ClaudeEventData {
                    process_id: process_id.clone(),
                    event,
                    timestamp,
                };
                let message = WsServerMessage::claude_event(&contract_event);
                (channel, message)
            }

            CoreEvent::ToolStateChange {
                process_id,
                tool_state,
                timestamp,
            } => {
                let channel = tool_state_channel(&process_id);
                let contract_event = ToolStateEvent {
                    process_id: process_id.clone(),
                    tool_state,
                    timestamp,
                };
                let message = WsServerMessage::tool_state_event(&contract_event);
                (channel, message)
            }

            // Task/Step progress events
            CoreEvent::TaskProgress {
                task_id,
                status,
                current_step_index,
                total_steps,
                details,
                timestamp,
            } => {
                let channel = task_progress_channel(&task_id);
                let payload = serde_json::json!({
                    "task_id": task_id,
                    "status": status,
                    "current_step_index": current_step_index,
                    "total_steps": total_steps,
                    "details": details,
                    "timestamp": timestamp,
                });
                let message = WsServerMessage::event(channel.clone(), payload);
                (channel, message)
            }

            CoreEvent::StepProgress {
                step_id,
                task_id,
                step_index,
                status,
                session_id,
                details,
                timestamp,
            } => {
                let channel = step_progress_channel(&step_id);
                let payload = serde_json::json!({
                    "step_id": step_id,
                    "task_id": task_id,
                    "step_index": step_index,
                    "status": status,
                    "session_id": session_id,
                    "details": details,
                    "timestamp": timestamp,
                });
                let message = WsServerMessage::event(channel.clone(), payload);
                (channel, message)
            }

            // Agent session events
            CoreEvent::AgentEvent {
                session_id,
                sequence,
                event_type,
                envelope,
                timestamp,
            } => {
                let channel = agent_event_channel(&session_id);
                let payload = serde_json::json!({
                    "session_id": session_id,
                    "sequence": sequence,
                    "event_type": event_type,
                    "envelope": envelope,
                    "timestamp": timestamp,
                });
                let message = WsServerMessage::event(channel.clone(), payload);
                (channel, message)
            }

            CoreEvent::SessionStatus {
                session_id,
                status,
                exit_code,
                timestamp,
            } => {
                let channel = format!("session:{}", session_id);
                let payload = serde_json::json!({
                    "session_id": session_id,
                    "status": status,
                    "exit_code": exit_code,
                    "timestamp": timestamp,
                });
                let message = WsServerMessage::event(channel.clone(), payload);
                (channel, message)
            }

            // Permission events
            CoreEvent::PermissionRequest {
                permission_id,
                session_id,
                tool_name,
                description,
                file_path,
                timestamp,
            } => {
                let channel = permission_request_channel(&session_id);
                let payload = serde_json::json!({
                    "permission_id": permission_id,
                    "session_id": session_id,
                    "tool_name": tool_name,
                    "description": description,
                    "file_path": file_path,
                    "timestamp": timestamp,
                });
                let message = WsServerMessage::event(channel.clone(), payload);
                (channel, message)
            }

            CoreEvent::PermissionResponse {
                permission_id,
                session_id,
                approved,
                timestamp,
            } => {
                let channel = format!("session:{}", session_id);
                let payload = serde_json::json!({
                    "permission_id": permission_id,
                    "session_id": session_id,
                    "approved": approved,
                    "timestamp": timestamp,
                });
                let message = WsServerMessage::event(channel.clone(), payload);
                (channel, message)
            }
        }
    }
}

impl std::fmt::Debug for WsBroadcaster {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.debug_struct("WsBroadcaster")
            .field("manager", &"<ClientManager>")
            .finish()
    }
}

impl EventBroadcaster for WsBroadcaster {
    fn broadcast(&self, event: CoreEvent) {
        // Clone what we need for the async task
        let manager = self.manager.clone();
        let event_data = self.event_to_message(event);

        // Use the stored runtime handle to spawn the async task
        // This works from any thread, including PTY output streamers
        self.runtime_handle.spawn(async move {
            let (channel, ws_message) = event_data;
            let count = manager.broadcast(&channel, ws_message).await;

            if count > 0 {
                tracing::debug!(
                    channel = %channel,
                    recipients = count,
                    "Broadcasted event via WebSocket"
                );
            }
        });
    }

    fn broadcast_async(
        &self,
        event: CoreEvent,
    ) -> std::pin::Pin<Box<dyn std::future::Future<Output = ()> + Send + '_>> {
        Box::pin(self.broadcast_async_impl(event))
    }
}

// =============================================================================
// Type Conversion Helpers
// =============================================================================

/// Convert core OutputType to contract OutputType
fn convert_output_type(
    output_type: CoreOutputType,
) -> openflow_contracts::entities::process::OutputType {
    match output_type {
        CoreOutputType::Stdout => openflow_contracts::entities::process::OutputType::Stdout,
        CoreOutputType::Stderr => openflow_contracts::entities::process::OutputType::Stderr,
    }
}

/// Convert core ProcessStatus to contract ProcessStatus
fn convert_process_status(
    status: CoreProcessStatus,
) -> openflow_contracts::entities::process::ProcessStatus {
    match status {
        CoreProcessStatus::Starting => {
            openflow_contracts::entities::process::ProcessStatus::Running
        }
        CoreProcessStatus::Running => openflow_contracts::entities::process::ProcessStatus::Running,
        CoreProcessStatus::Completed => {
            openflow_contracts::entities::process::ProcessStatus::Completed
        }
        CoreProcessStatus::Failed => openflow_contracts::entities::process::ProcessStatus::Failed,
        CoreProcessStatus::Killed => openflow_contracts::entities::process::ProcessStatus::Killed,
    }
}

/// Convert core EntityType to contract EntityType
fn convert_entity_type(entity: CoreEntityType) -> openflow_contracts::events::EntityType {
    match entity {
        CoreEntityType::Project => openflow_contracts::events::EntityType::Project,
        CoreEntityType::Task => openflow_contracts::events::EntityType::Task,
        CoreEntityType::Step => openflow_contracts::events::EntityType::Step,
        CoreEntityType::Chat => openflow_contracts::events::EntityType::Chat,
        CoreEntityType::Message => openflow_contracts::events::EntityType::Message,
        CoreEntityType::ExecutorProfile => openflow_contracts::events::EntityType::ExecutorProfile,
        CoreEntityType::Setting => openflow_contracts::events::EntityType::Setting,
        CoreEntityType::Process => openflow_contracts::events::EntityType::Process,
        CoreEntityType::Worktree => openflow_contracts::events::EntityType::Worktree,
        CoreEntityType::Session => openflow_contracts::events::EntityType::Session,
        CoreEntityType::Permission => openflow_contracts::events::EntityType::Permission,
    }
}

/// Convert core DataAction to contract DataAction
fn convert_data_action(action: CoreDataAction) -> openflow_contracts::events::DataAction {
    match action {
        CoreDataAction::Created => openflow_contracts::events::DataAction::Created,
        CoreDataAction::Updated => openflow_contracts::events::DataAction::Updated,
        CoreDataAction::Deleted => openflow_contracts::events::DataAction::Deleted,
    }
}

// =============================================================================
// Tests
// =============================================================================

#[cfg(test)]
mod tests {
    use super::*;
    use tokio::sync::mpsc;

    #[tokio::test]
    async fn test_ws_broadcaster_new() {
        let manager = ClientManager::new();
        let broadcaster = WsBroadcaster::new(manager.clone());

        // Verify manager is stored
        assert!(Arc::ptr_eq(broadcaster.manager(), &manager));
    }

    #[tokio::test]
    async fn test_ws_broadcaster_arc() {
        let manager = ClientManager::new();
        let broadcaster = WsBroadcaster::arc(manager);

        // Verify it's wrapped in Arc
        assert_eq!(Arc::strong_count(&broadcaster), 1);
    }

    #[tokio::test]
    async fn test_ws_broadcaster_debug() {
        let manager = ClientManager::new();
        let broadcaster = WsBroadcaster::new(manager);

        let debug_str = format!("{:?}", broadcaster);
        assert!(debug_str.contains("WsBroadcaster"));
    }

    #[test]
    fn test_convert_output_type() {
        assert!(matches!(
            convert_output_type(CoreOutputType::Stdout),
            openflow_contracts::entities::process::OutputType::Stdout
        ));
        assert!(matches!(
            convert_output_type(CoreOutputType::Stderr),
            openflow_contracts::entities::process::OutputType::Stderr
        ));
    }

    #[test]
    fn test_convert_process_status() {
        assert!(matches!(
            convert_process_status(CoreProcessStatus::Starting),
            openflow_contracts::entities::process::ProcessStatus::Running
        ));
        assert!(matches!(
            convert_process_status(CoreProcessStatus::Running),
            openflow_contracts::entities::process::ProcessStatus::Running
        ));
        assert!(matches!(
            convert_process_status(CoreProcessStatus::Completed),
            openflow_contracts::entities::process::ProcessStatus::Completed
        ));
        assert!(matches!(
            convert_process_status(CoreProcessStatus::Failed),
            openflow_contracts::entities::process::ProcessStatus::Failed
        ));
        assert!(matches!(
            convert_process_status(CoreProcessStatus::Killed),
            openflow_contracts::entities::process::ProcessStatus::Killed
        ));
    }

    #[test]
    fn test_convert_entity_type() {
        assert!(matches!(
            convert_entity_type(CoreEntityType::Project),
            openflow_contracts::events::EntityType::Project
        ));
        assert!(matches!(
            convert_entity_type(CoreEntityType::Task),
            openflow_contracts::events::EntityType::Task
        ));
        assert!(matches!(
            convert_entity_type(CoreEntityType::Chat),
            openflow_contracts::events::EntityType::Chat
        ));
        assert!(matches!(
            convert_entity_type(CoreEntityType::Message),
            openflow_contracts::events::EntityType::Message
        ));
        assert!(matches!(
            convert_entity_type(CoreEntityType::Setting),
            openflow_contracts::events::EntityType::Setting
        ));
    }

    #[test]
    fn test_convert_data_action() {
        assert!(matches!(
            convert_data_action(CoreDataAction::Created),
            openflow_contracts::events::DataAction::Created
        ));
        assert!(matches!(
            convert_data_action(CoreDataAction::Updated),
            openflow_contracts::events::DataAction::Updated
        ));
        assert!(matches!(
            convert_data_action(CoreDataAction::Deleted),
            openflow_contracts::events::DataAction::Deleted
        ));
    }

    #[tokio::test]
    async fn test_event_to_message_process_output() {
        let manager = ClientManager::new();
        let broadcaster = WsBroadcaster::new(manager);

        let event = CoreEvent::ProcessOutput {
            process_id: "proc-123".to_string(),
            output_type: CoreOutputType::Stdout,
            content: "Hello, World!".to_string(),
            timestamp: "2024-01-01T00:00:00Z".to_string(),
        };

        let (channel, message) = broadcaster.event_to_message(event);

        assert_eq!(channel, "process-output-proc-123");
        assert!(matches!(message, WsServerMessage::Event { .. }));

        if let WsServerMessage::Event {
            channel: msg_channel,
            ..
        } = message
        {
            assert_eq!(msg_channel, "process-output-proc-123");
        }
    }

    #[tokio::test]
    async fn test_event_to_message_process_status() {
        let manager = ClientManager::new();
        let broadcaster = WsBroadcaster::new(manager);

        let event = CoreEvent::ProcessStatus {
            process_id: "proc-456".to_string(),
            status: CoreProcessStatus::Completed,
            exit_code: Some(0),
        };

        let (channel, message) = broadcaster.event_to_message(event);

        assert_eq!(channel, "process-status-proc-456");
        assert!(matches!(message, WsServerMessage::Event { .. }));
    }

    #[tokio::test]
    async fn test_event_to_message_data_changed() {
        let manager = ClientManager::new();
        let broadcaster = WsBroadcaster::new(manager);

        let event = CoreEvent::DataChanged {
            entity: CoreEntityType::Project,
            action: CoreDataAction::Created,
            id: "proj-789".to_string(),
            data: Some(serde_json::json!({"name": "Test Project"})),
        };

        let (channel, message) = broadcaster.event_to_message(event);

        assert_eq!(channel, "data-changed");
        assert!(matches!(message, WsServerMessage::Event { .. }));
    }

    #[tokio::test]
    async fn test_broadcast_async_sends_to_subscribed_clients() {
        let manager = ClientManager::new();
        let broadcaster = WsBroadcaster::new(manager.clone());

        // Create a client and subscribe to data-changed
        let (tx, mut rx) = mpsc::unbounded_channel();
        let client_id = manager.add_client(tx).await;
        manager.subscribe(&client_id, "data-changed").await;

        // Broadcast a data changed event
        let event = CoreEvent::DataChanged {
            entity: CoreEntityType::Task,
            action: CoreDataAction::Updated,
            id: "task-123".to_string(),
            data: Some(serde_json::json!({"title": "Updated Task"})),
        };

        broadcaster.broadcast_async_impl(event).await;

        // Verify the client received the message
        let received = rx.try_recv();
        assert!(received.is_ok());

        let message = received.unwrap();
        if let WsServerMessage::Event { channel, payload } = message {
            assert_eq!(channel, "data-changed");
            // Verify payload contains expected data
            assert!(payload.get("entity").is_some());
            assert!(payload.get("action").is_some());
        } else {
            panic!("Expected Event message");
        }
    }

    #[tokio::test]
    async fn test_broadcast_async_only_sends_to_subscribed() {
        let manager = ClientManager::new();
        let broadcaster = WsBroadcaster::new(manager.clone());

        // Create two clients
        let (tx1, mut rx1) = mpsc::unbounded_channel();
        let (tx2, mut rx2) = mpsc::unbounded_channel();

        let client1 = manager.add_client(tx1).await;
        let _client2 = manager.add_client(tx2).await;

        // Only client1 subscribes to the channel
        manager.subscribe(&client1, "process-output-abc").await;

        // Broadcast a process output event
        let event = CoreEvent::ProcessOutput {
            process_id: "abc".to_string(),
            output_type: CoreOutputType::Stdout,
            content: "test output".to_string(),
            timestamp: chrono::Utc::now().to_rfc3339(),
        };

        broadcaster.broadcast_async_impl(event).await;

        // Client1 should receive the message
        assert!(rx1.try_recv().is_ok());

        // Client2 should not receive the message
        assert!(rx2.try_recv().is_err());
    }

    #[tokio::test]
    async fn test_broadcast_sync_spawns_task() {
        let manager = ClientManager::new();
        let broadcaster = WsBroadcaster::new(manager.clone());

        // Create a client and subscribe
        let (tx, mut rx) = mpsc::unbounded_channel();
        let client_id = manager.add_client(tx).await;
        manager.subscribe(&client_id, "data-changed").await;

        // Use sync broadcast (which spawns a task)
        let event = CoreEvent::DataChanged {
            entity: CoreEntityType::Project,
            action: CoreDataAction::Deleted,
            id: "proj-to-delete".to_string(),
            data: None,
        };

        broadcaster.broadcast(event);

        // Give the spawned task time to complete
        tokio::time::sleep(tokio::time::Duration::from_millis(50)).await;

        // Verify the client received the message
        let received = rx.try_recv();
        assert!(received.is_ok());
    }

    #[tokio::test]
    async fn test_broadcast_process_status_event() {
        let manager = ClientManager::new();
        let broadcaster = WsBroadcaster::new(manager.clone());

        // Create a client and subscribe to process status
        let (tx, mut rx) = mpsc::unbounded_channel();
        let client_id = manager.add_client(tx).await;
        manager
            .subscribe(&client_id, "process-status-proc-xyz")
            .await;

        let event = CoreEvent::ProcessStatus {
            process_id: "proc-xyz".to_string(),
            status: CoreProcessStatus::Failed,
            exit_code: Some(1),
        };

        broadcaster.broadcast_async_impl(event).await;

        let received = rx.try_recv();
        assert!(received.is_ok());

        let message = received.unwrap();
        if let WsServerMessage::Event { channel, payload } = message {
            assert_eq!(channel, "process-status-proc-xyz");
            assert!(payload.get("status").is_some());
            assert!(payload.get("exitCode").is_some());
        } else {
            panic!("Expected Event message");
        }
    }

    #[tokio::test]
    async fn test_wildcard_subscription_receives_all_events() {
        let manager = ClientManager::new();
        let broadcaster = WsBroadcaster::new(manager.clone());

        // Create a client with wildcard subscription
        let (tx, mut rx) = mpsc::unbounded_channel();
        let client_id = manager.add_client(tx).await;
        manager.subscribe(&client_id, "*").await;

        // Send different event types
        let data_event = CoreEvent::DataChanged {
            entity: CoreEntityType::Message,
            action: CoreDataAction::Created,
            id: "msg-1".to_string(),
            data: None,
        };

        let process_event = CoreEvent::ProcessOutput {
            process_id: "proc-1".to_string(),
            output_type: CoreOutputType::Stderr,
            content: "error".to_string(),
            timestamp: chrono::Utc::now().to_rfc3339(),
        };

        broadcaster.broadcast_async_impl(data_event).await;
        broadcaster.broadcast_async_impl(process_event).await;

        // Should receive both events
        assert!(rx.try_recv().is_ok());
        assert!(rx.try_recv().is_ok());
    }
}
