//! Tauri Event Broadcaster
//!
//! Implements the `EventBroadcaster` trait using Tauri's native event system.
//! This allows events to be broadcast to all connected frontend windows.

use openflow_core::events::{DataAction, Event, EventBroadcaster, OutputType, ProcessStatus};
use serde::Serialize;
use std::sync::Arc;
use tauri::{AppHandle, Emitter, Runtime};

/// Event payload for Tauri events
///
/// This struct is serialized and sent to the frontend.
#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
struct ProcessOutputPayload {
    process_id: String,
    output_type: String,
    content: String,
    timestamp: String,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
struct ProcessStatusPayload {
    process_id: String,
    status: String,
    exit_code: Option<i32>,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
struct DataChangedPayload {
    entity: String,
    action: String,
    id: String,
    data: Option<serde_json::Value>,
}

/// Tauri-based event broadcaster.
///
/// Uses Tauri's `AppHandle::emit()` to broadcast events to all connected
/// frontend windows. Events are converted to channel names following the
/// convention:
///
/// - `process-output-{process_id}` for process output
/// - `process-status-{process_id}` for process status changes
/// - `data-changed` for entity CRUD operations
pub struct TauriBroadcaster<R: Runtime> {
    app_handle: AppHandle<R>,
}

impl<R: Runtime> TauriBroadcaster<R> {
    /// Create a new Tauri broadcaster with the given app handle.
    pub fn new(app_handle: AppHandle<R>) -> Self {
        Self { app_handle }
    }

    /// Create a new Tauri broadcaster wrapped in Arc.
    pub fn arc(app_handle: AppHandle<R>) -> Arc<Self> {
        Arc::new(Self::new(app_handle))
    }
}

impl<R: Runtime> EventBroadcaster for TauriBroadcaster<R> {
    fn broadcast(&self, event: Event) {
        match event {
            Event::ProcessOutput {
                process_id,
                output_type,
                content,
                timestamp,
            } => {
                let channel = format!("process-output-{}", process_id);
                let payload = ProcessOutputPayload {
                    process_id,
                    output_type: match output_type {
                        OutputType::Stdout => "stdout".to_string(),
                        OutputType::Stderr => "stderr".to_string(),
                    },
                    content,
                    timestamp,
                };

                if let Err(e) = self.app_handle.emit(&channel, &payload) {
                    log::error!("Failed to emit process output event: {}", e);
                }
            }

            Event::ProcessStatus {
                process_id,
                status,
                exit_code,
            } => {
                let channel = format!("process-status-{}", process_id);
                let payload = ProcessStatusPayload {
                    process_id,
                    status: match status {
                        ProcessStatus::Starting => "starting".to_string(),
                        ProcessStatus::Running => "running".to_string(),
                        ProcessStatus::Completed => "completed".to_string(),
                        ProcessStatus::Failed => "failed".to_string(),
                        ProcessStatus::Killed => "killed".to_string(),
                    },
                    exit_code,
                };

                if let Err(e) = self.app_handle.emit(&channel, &payload) {
                    log::error!("Failed to emit process status event: {}", e);
                }
            }

            Event::DataChanged {
                entity,
                action,
                id,
                data,
            } => {
                let channel = "data-changed";
                let payload = DataChangedPayload {
                    entity: entity.as_str().to_string(),
                    action: match action {
                        DataAction::Created => "created".to_string(),
                        DataAction::Updated => "updated".to_string(),
                        DataAction::Deleted => "deleted".to_string(),
                    },
                    id,
                    data,
                };

                if let Err(e) = self.app_handle.emit(channel, &payload) {
                    log::error!("Failed to emit data changed event: {}", e);
                }
            }

            Event::ClaudeEvent {
                process_id,
                event,
                timestamp,
            } => {
                let channel = format!("claude-event-{}", process_id);
                let payload = serde_json::json!({
                    "process_id": process_id,
                    "event": event,
                    "timestamp": timestamp,
                });

                if let Err(e) = self.app_handle.emit(&channel, &payload) {
                    log::error!("Failed to emit claude event: {}", e);
                }
            }

            Event::ToolStateChange {
                process_id,
                tool_state,
                timestamp,
            } => {
                let channel = format!("tool-state-{}", process_id);
                let payload = serde_json::json!({
                    "process_id": process_id,
                    "tool_state": tool_state,
                    "timestamp": timestamp,
                });

                if let Err(e) = self.app_handle.emit(&channel, &payload) {
                    log::error!("Failed to emit tool state event: {}", e);
                }
            }

            // Task progress events
            Event::TaskProgress {
                task_id,
                status,
                current_step_index,
                total_steps,
                details,
                timestamp,
            } => {
                let channel = format!("task-progress-{}", task_id);
                let payload = serde_json::json!({
                    "task_id": task_id,
                    "status": status,
                    "current_step_index": current_step_index,
                    "total_steps": total_steps,
                    "details": details,
                    "timestamp": timestamp,
                });

                if let Err(e) = self.app_handle.emit(&channel, &payload) {
                    log::error!("Failed to emit task progress event: {}", e);
                }
            }

            Event::StepProgress {
                step_id,
                task_id,
                step_index,
                status,
                session_id,
                details,
                timestamp,
            } => {
                let channel = format!("step-progress-{}", step_id);
                let payload = serde_json::json!({
                    "step_id": step_id,
                    "task_id": task_id,
                    "step_index": step_index,
                    "status": status,
                    "session_id": session_id,
                    "details": details,
                    "timestamp": timestamp,
                });

                if let Err(e) = self.app_handle.emit(&channel, &payload) {
                    log::error!("Failed to emit step progress event: {}", e);
                }
            }

            // Agent session events
            Event::AgentEvent {
                session_id,
                sequence,
                event_type,
                envelope,
                timestamp,
            } => {
                let channel = format!("agent-event-{}", session_id);
                let payload = serde_json::json!({
                    "session_id": session_id,
                    "sequence": sequence,
                    "event_type": event_type,
                    "envelope": envelope,
                    "timestamp": timestamp,
                });

                if let Err(e) = self.app_handle.emit(&channel, &payload) {
                    log::error!("Failed to emit agent event: {}", e);
                }
            }

            Event::SessionStatus {
                session_id,
                status,
                exit_code,
                timestamp,
            } => {
                let channel = format!("session-status-{}", session_id);
                let payload = serde_json::json!({
                    "session_id": session_id,
                    "status": status,
                    "exit_code": exit_code,
                    "timestamp": timestamp,
                });

                if let Err(e) = self.app_handle.emit(&channel, &payload) {
                    log::error!("Failed to emit session status event: {}", e);
                }
            }

            // Permission events
            Event::PermissionRequest {
                permission_id,
                session_id,
                tool_name,
                description,
                file_path,
                timestamp,
            } => {
                let channel = format!("permission-request-{}", session_id);
                let payload = serde_json::json!({
                    "permission_id": permission_id,
                    "session_id": session_id,
                    "tool_name": tool_name,
                    "description": description,
                    "file_path": file_path,
                    "timestamp": timestamp,
                });

                if let Err(e) = self.app_handle.emit(&channel, &payload) {
                    log::error!("Failed to emit permission request event: {}", e);
                }
            }

            Event::PermissionResponse {
                permission_id,
                session_id,
                approved,
                timestamp,
            } => {
                let channel = format!("permission-response-{}", session_id);
                let payload = serde_json::json!({
                    "permission_id": permission_id,
                    "session_id": session_id,
                    "approved": approved,
                    "timestamp": timestamp,
                });

                if let Err(e) = self.app_handle.emit(&channel, &payload) {
                    log::error!("Failed to emit permission response event: {}", e);
                }
            }

            // Raw output event
            Event::RawOutput {
                session_id,
                output,
                timestamp,
            } => {
                let channel = format!("raw-output-{}", session_id);
                let payload = serde_json::json!({
                    "session_id": session_id,
                    "output": output,
                    "timestamp": timestamp,
                });

                if let Err(e) = self.app_handle.emit(&channel, &payload) {
                    log::error!("Failed to emit raw output event: {}", e);
                }
            }

            // Normalized entry event
            Event::NormalizedEntry {
                session_id,
                entry,
                timestamp,
            } => {
                let channel = format!("normalized-{}", session_id);
                let payload = serde_json::json!({
                    "session_id": session_id,
                    "entry": entry,
                    "timestamp": timestamp,
                });

                if let Err(e) = self.app_handle.emit(&channel, &payload) {
                    log::error!("Failed to emit normalized entry event: {}", e);
                }
            }
        }
    }
}

// Ensure TauriBroadcaster can be shared across threads
// The AppHandle is already Send + Sync in Tauri
impl<R: Runtime> std::fmt::Debug for TauriBroadcaster<R> {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.debug_struct("TauriBroadcaster").finish()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    // Note: Full testing of TauriBroadcaster requires a running Tauri app.
    // These tests verify the payload structures serialize correctly.

    #[test]
    fn test_process_output_payload_serialization() {
        let payload = ProcessOutputPayload {
            process_id: "proc-123".to_string(),
            output_type: "stdout".to_string(),
            content: "Hello, world!".to_string(),
            timestamp: "2024-01-01T00:00:00Z".to_string(),
        };

        let json = serde_json::to_string(&payload).unwrap();
        assert!(json.contains("\"processId\":\"proc-123\""));
        assert!(json.contains("\"outputType\":\"stdout\""));
        assert!(json.contains("\"content\":\"Hello, world!\""));
    }

    #[test]
    fn test_process_status_payload_serialization() {
        let payload = ProcessStatusPayload {
            process_id: "proc-456".to_string(),
            status: "running".to_string(),
            exit_code: None,
        };

        let json = serde_json::to_string(&payload).unwrap();
        assert!(json.contains("\"processId\":\"proc-456\""));
        assert!(json.contains("\"status\":\"running\""));
        assert!(json.contains("\"exitCode\":null"));
    }

    #[test]
    fn test_process_status_payload_with_exit_code() {
        let payload = ProcessStatusPayload {
            process_id: "proc-789".to_string(),
            status: "completed".to_string(),
            exit_code: Some(0),
        };

        let json = serde_json::to_string(&payload).unwrap();
        assert!(json.contains("\"exitCode\":0"));
    }

    #[test]
    fn test_data_changed_payload_serialization() {
        let payload = DataChangedPayload {
            entity: "project".to_string(),
            action: "created".to_string(),
            id: "proj-123".to_string(),
            data: Some(serde_json::json!({"name": "Test Project"})),
        };

        let json = serde_json::to_string(&payload).unwrap();
        assert!(json.contains("\"entity\":\"project\""));
        assert!(json.contains("\"action\":\"created\""));
        assert!(json.contains("\"id\":\"proj-123\""));
        assert!(json.contains("\"name\":\"Test Project\""));
    }

    #[test]
    fn test_data_changed_payload_without_data() {
        let payload = DataChangedPayload {
            entity: "task".to_string(),
            action: "deleted".to_string(),
            id: "task-456".to_string(),
            data: None,
        };

        let json = serde_json::to_string(&payload).unwrap();
        assert!(json.contains("\"action\":\"deleted\""));
        assert!(json.contains("\"data\":null"));
    }
}
