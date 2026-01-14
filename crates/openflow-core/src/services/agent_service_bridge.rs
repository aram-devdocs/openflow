//! Agent Service Bridge
//!
//! Bridge to the TypeScript agent-service process that wraps the Claude Agent SDK.
//! Provides type-safe communication between Rust backend and Node.js agent-service.
//!
//! # Architecture
//!
//! ```text
//! ┌─────────────────────────────────────────────────────────────────────────┐
//! │                      AgentServiceBridge                                  │
//! ├─────────────────────────────────────────────────────────────────────────┤
//! │                                                                          │
//! │  start_session() ──────────────────────> HTTP POST /sessions/start       │
//! │                                                                          │
//! │  respond_to_permission() ──────────────> HTTP POST /sessions/.../perm    │
//! │                                                                          │
//! │  kill_session() ───────────────────────> HTTP POST /sessions/.../kill    │
//! │                                                                          │
//! │  WebSocket Connection <─────────────────> ws://localhost:PORT            │
//! │       ↓                                                                  │
//! │  Event Routing:                                                          │
//! │  - permission_request → PermissionHandler                                │
//! │  - session_*, message, tool_* → EventHandler                             │
//! │                                                                          │
//! └─────────────────────────────────────────────────────────────────────────┘
//! ```
//!
//! # Protocol
//!
//! 1. Rust backend connects via WebSocket with sessionId
//! 2. Rust backend sends HTTP POST to start a session
//! 3. Agent events stream back via WebSocket
//! 4. Permission requests sent via WebSocket to backend
//! 5. Backend responds to permissions via HTTP POST

use std::collections::HashMap;
use std::process::{Child, Command, Stdio};
use std::sync::Arc;
use std::time::Duration;

use futures_util::StreamExt;
use log::{debug, error, info, warn};
use serde::{Deserialize, Serialize};
use tokio::sync::{mpsc, RwLock};
use tokio_tungstenite::{connect_async, tungstenite::Message as WsMessage};

use openflow_contracts::events::{
    AgentMessageRole, CompletionStatus, EntryMetadata, EntryType, NormalizedEntry, ToolResultStatus,
};

use super::{ServiceError, ServiceResult};

// =============================================================================
// Configuration
// =============================================================================

const AGENT_SERVICE_PORT: u16 = 3002;
const AGENT_SERVICE_STARTUP_TIMEOUT_SECS: u64 = 30;
const HEALTH_CHECK_INTERVAL_MS: u64 = 100;

fn agent_service_http_url() -> String {
    format!("http://127.0.0.1:{}", AGENT_SERVICE_PORT)
}

fn agent_service_ws_url() -> String {
    format!("ws://127.0.0.1:{}", AGENT_SERVICE_PORT)
}

// =============================================================================
// Types - Match TypeScript agent-service types
// =============================================================================

/// Configuration for an agent session.
#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct AgentConfig {
    /// Working directory for the agent
    #[serde(skip_serializing_if = "Option::is_none")]
    pub working_directory: Option<String>,

    /// List of tools the agent is allowed to use
    #[serde(skip_serializing_if = "Option::is_none")]
    pub allowed_tools: Option<Vec<String>>,

    /// Maximum tokens for the response
    #[serde(skip_serializing_if = "Option::is_none")]
    pub max_tokens: Option<u32>,

    /// Custom system prompt
    #[serde(skip_serializing_if = "Option::is_none")]
    pub system_prompt: Option<String>,
}

/// Request to start an agent session.
#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
struct StartSessionRequest {
    session_id: String,
    prompt: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    config: Option<AgentConfig>,
}

/// Permission request from agent-service.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PermissionRequest {
    pub id: String,
    pub session_id: String,
    pub tool_name: String,
    pub tool_input: serde_json::Value,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub file_path: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub command: Option<String>,
    pub description: String,
    pub timestamp: String,
}

/// Permission response to send to agent-service.
#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct PermissionResponse {
    pub approved: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub reason: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub modified_input: Option<serde_json::Value>,
}

/// Agent event from agent-service.
#[derive(Debug, Clone, Deserialize)]
#[serde(tag = "type", rename_all = "snake_case")]
pub enum AgentEvent {
    SessionStart {
        #[serde(rename = "sessionId")]
        session_id: String,
        timestamp: String,
    },
    SessionComplete {
        #[serde(rename = "sessionId")]
        session_id: String,
        timestamp: String,
    },
    SessionError {
        #[serde(rename = "sessionId")]
        session_id: String,
        error: String,
        timestamp: String,
    },
    Message {
        #[serde(rename = "sessionId")]
        session_id: String,
        content: String,
        timestamp: String,
    },
    ToolUse {
        #[serde(rename = "sessionId")]
        session_id: String,
        #[serde(rename = "toolName")]
        tool_name: String,
        #[serde(rename = "toolInput")]
        tool_input: serde_json::Value,
        #[serde(rename = "toolId")]
        tool_id: String,
        timestamp: String,
    },
    ToolResult {
        #[serde(rename = "sessionId")]
        session_id: String,
        #[serde(rename = "toolId")]
        tool_id: String,
        output: String,
        #[serde(rename = "isError")]
        is_error: bool,
        timestamp: String,
    },
    System {
        #[serde(rename = "sessionId")]
        session_id: String,
        content: String,
        timestamp: String,
    },
    PermissionRequest(PermissionRequest),
}

/// WebSocket message envelope.
#[allow(dead_code)]
#[derive(Debug, Deserialize)]
#[serde(untagged)]
enum WebSocketIncoming {
    PermissionRequest {
        #[serde(rename = "type")]
        msg_type: String,
        #[serde(flatten)]
        request: PermissionRequest,
    },
    Event(AgentEvent),
    Connected {
        #[serde(rename = "type")]
        msg_type: String,
        #[serde(rename = "sessionId")]
        session_id: String,
        timestamp: String,
    },
    Pong {
        #[serde(rename = "type")]
        msg_type: String,
        timestamp: String,
    },
}

// =============================================================================
// Agent Service Bridge
// =============================================================================

/// Bridge to the TypeScript agent-service process.
///
/// Manages the lifecycle of the agent-service Node.js process and provides
/// communication via HTTP and WebSocket.
pub struct AgentServiceBridge {
    /// HTTP client for API calls
    client: reqwest::Client,

    /// Child process handle (if we spawned it)
    process: RwLock<Option<Child>>,

    /// Track active WebSocket connections by session ID
    active_connections: RwLock<HashMap<String, mpsc::Sender<()>>>,
}

impl AgentServiceBridge {
    /// Create a new bridge instance.
    pub fn new() -> Self {
        let client = reqwest::Client::builder()
            .timeout(Duration::from_secs(30))
            .build()
            .expect("Failed to create HTTP client");

        Self {
            client,
            process: RwLock::new(None),
            active_connections: RwLock::new(HashMap::new()),
        }
    }

    /// Start the agent-service process if not already running.
    ///
    /// This method is idempotent - if the service is already running,
    /// it will return immediately.
    pub async fn ensure_service_running(&self) -> ServiceResult<()> {
        // Check if already running
        if self.is_service_running().await {
            debug!("Agent service already running");
            return Ok(());
        }

        info!("Starting agent-service process...");
        info!("Current working directory: {:?}", std::env::current_dir());

        // Use pnpm to run the agent-service TypeScript directly via tsx
        // This avoids needing a build step and works from any working directory
        // pnpm --filter @openflow/agent-service dev runs: tsx src/index.ts
        let child = Command::new("pnpm")
            .args(["--filter", "@openflow/agent-service", "start"])
            .env("AGENT_SERVICE_PORT", AGENT_SERVICE_PORT.to_string())
            .stdout(Stdio::piped())
            .stderr(Stdio::piped())
            .spawn()
            .map_err(|e| {
                ServiceError::Internal(format!(
                    "Failed to spawn agent-service process via pnpm: {}. \
                    Current dir: {:?}",
                    e, std::env::current_dir()
                ))
            })?;

        // Store process handle
        {
            let mut proc = self.process.write().await;
            *proc = Some(child);
        }

        // Wait for service to be ready
        self.wait_for_ready().await?;

        info!("Agent service started successfully on port {}", AGENT_SERVICE_PORT);
        Ok(())
    }

    /// Check if the agent-service is running and healthy.
    async fn is_service_running(&self) -> bool {
        let url = format!("{}/health", agent_service_http_url());
        self.client.get(&url).send().await.is_ok()
    }

    /// Wait for the service to become ready.
    async fn wait_for_ready(&self) -> ServiceResult<()> {
        let url = format!("{}/health", agent_service_http_url());
        let deadline = Duration::from_secs(AGENT_SERVICE_STARTUP_TIMEOUT_SECS);
        let start = std::time::Instant::now();

        while start.elapsed() < deadline {
            if self.client.get(&url).send().await.is_ok() {
                return Ok(());
            }
            tokio::time::sleep(Duration::from_millis(HEALTH_CHECK_INTERVAL_MS)).await;
        }

        Err(ServiceError::Internal(format!(
            "Agent service failed to start within {} seconds",
            AGENT_SERVICE_STARTUP_TIMEOUT_SECS
        )))
    }

    /// Start a new agent session.
    ///
    /// This method:
    /// 1. Ensures the agent-service is running
    /// 2. Establishes a WebSocket connection for event streaming
    /// 3. Sends the start request via HTTP
    /// 4. Streams events to the provided handlers
    ///
    /// # Arguments
    ///
    /// * `session_id` - Unique identifier for this session
    /// * `prompt` - The prompt to send to the agent
    /// * `config` - Optional agent configuration
    /// * `event_handler` - Called for each agent event
    /// * `permission_handler` - Called when agent needs permission
    pub async fn start_session<E, P>(
        &self,
        session_id: String,
        prompt: String,
        config: Option<AgentConfig>,
        event_handler: E,
        permission_handler: P,
    ) -> ServiceResult<()>
    where
        E: Fn(AgentEvent) + Send + Sync + 'static,
        P: Fn(PermissionRequest) + Send + Sync + 'static,
    {
        // Ensure service is running
        self.ensure_service_running().await?;

        let session_id_clone = session_id.clone();

        // Connect WebSocket for this session
        // Note: The URL needs a path (/) before the query string for proper HTTP parsing
        let ws_url = format!("{}/?sessionId={}", agent_service_ws_url(), session_id);
        debug!("Connecting to WebSocket at: {}", ws_url);
        let (ws_stream, _) = connect_async(&ws_url)
            .await
            .map_err(|e| ServiceError::Internal(format!("WebSocket connection failed: {}", e)))?;

        let (_write, mut read) = ws_stream.split();

        // Create shutdown channel
        let (shutdown_tx, mut shutdown_rx) = mpsc::channel::<()>(1);

        // Store connection handle
        {
            let mut connections = self.active_connections.write().await;
            connections.insert(session_id.clone(), shutdown_tx);
        }

        // Spawn WebSocket reader task
        let event_handler = Arc::new(event_handler);
        let permission_handler = Arc::new(permission_handler);

        tokio::spawn(async move {
            loop {
                tokio::select! {
                    msg = read.next() => {
                        match msg {
                            Some(Ok(WsMessage::Text(text))) => {
                                // Try to parse as a generic JSON first to check the type
                                if let Ok(json) = serde_json::from_str::<serde_json::Value>(&text) {
                                    if let Some(msg_type) = json.get("type").and_then(|t| t.as_str()) {
                                        match msg_type {
                                            "permission_request" => {
                                                // Parse as permission request
                                                if let Ok(req) = serde_json::from_str::<PermissionRequest>(&text) {
                                                    permission_handler(req);
                                                } else {
                                                    warn!("Failed to parse permission request: {}", text);
                                                }
                                            }
                                            "connected" | "pong" => {
                                                // Connection/heartbeat messages, ignore
                                                debug!("Received {} message", msg_type);
                                            }
                                            _ => {
                                                // Parse as agent event
                                                if let Ok(event) = serde_json::from_str::<AgentEvent>(&text) {
                                                    event_handler(event);
                                                } else {
                                                    warn!("Failed to parse agent event: {}", text);
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                            Some(Ok(WsMessage::Close(_))) => {
                                info!("WebSocket closed for session {}", session_id_clone);
                                break;
                            }
                            Some(Err(e)) => {
                                error!("WebSocket error for session {}: {}", session_id_clone, e);
                                break;
                            }
                            None => {
                                debug!("WebSocket stream ended for session {}", session_id_clone);
                                break;
                            }
                            _ => {}
                        }
                    }
                    _ = shutdown_rx.recv() => {
                        debug!("Shutdown signal received for session {}", session_id_clone);
                        break;
                    }
                }
            }
        });

        // Send start request via HTTP
        let start_url = format!("{}/sessions/start", agent_service_http_url());
        let request = StartSessionRequest {
            session_id: session_id.clone(),
            prompt,
            config,
        };

        let response = self
            .client
            .post(&start_url)
            .json(&request)
            .send()
            .await
            .map_err(|e| ServiceError::Internal(format!("Failed to start session: {}", e)))?;

        if !response.status().is_success() {
            let error_text = response.text().await.unwrap_or_default();
            return Err(ServiceError::Internal(format!(
                "Failed to start session: {}",
                error_text
            )));
        }

        info!("Started agent session: {}", session_id);
        Ok(())
    }

    /// Respond to a permission request.
    ///
    /// # Arguments
    ///
    /// * `session_id` - The session ID
    /// * `permission_id` - The permission request ID
    /// * `approved` - Whether the permission was approved
    /// * `reason` - Optional reason for denial
    pub async fn respond_to_permission(
        &self,
        session_id: &str,
        permission_id: &str,
        approved: bool,
        reason: Option<String>,
    ) -> ServiceResult<()> {
        let url = format!(
            "{}/sessions/{}/permission/{}",
            agent_service_http_url(),
            session_id,
            permission_id
        );

        let response = PermissionResponse {
            approved,
            reason,
            modified_input: None,
        };

        let http_response = self
            .client
            .post(&url)
            .json(&response)
            .send()
            .await
            .map_err(|e| {
                ServiceError::Internal(format!("Failed to respond to permission: {}", e))
            })?;

        if !http_response.status().is_success() {
            let error_text = http_response.text().await.unwrap_or_default();
            return Err(ServiceError::Internal(format!(
                "Failed to respond to permission: {}",
                error_text
            )));
        }

        info!(
            "Responded to permission {} for session {}: approved={}",
            permission_id, session_id, approved
        );
        Ok(())
    }

    /// Kill an agent session.
    ///
    /// # Arguments
    ///
    /// * `session_id` - The session ID to kill
    pub async fn kill_session(&self, session_id: &str) -> ServiceResult<()> {
        // Close WebSocket connection
        {
            let mut connections = self.active_connections.write().await;
            if let Some(shutdown_tx) = connections.remove(session_id) {
                let _ = shutdown_tx.send(()).await;
            }
        }

        // Send kill request via HTTP
        let url = format!("{}/sessions/{}/kill", agent_service_http_url(), session_id);

        let response = self.client.post(&url).send().await.map_err(|e| {
            ServiceError::Internal(format!("Failed to kill session: {}", e))
        })?;

        if !response.status().is_success() {
            // Session may already be dead, log but don't fail
            warn!("Kill session {} returned non-success status", session_id);
        }

        info!("Killed agent session: {}", session_id);
        Ok(())
    }

    /// Stop the agent-service process.
    pub async fn stop_service(&self) {
        let mut proc = self.process.write().await;
        if let Some(mut child) = proc.take() {
            info!("Stopping agent-service process...");
            let _ = child.kill();
        }
    }

    /// Get health status of the agent-service.
    pub async fn health_check(&self) -> ServiceResult<serde_json::Value> {
        let url = format!("{}/health", agent_service_http_url());

        let response = self
            .client
            .get(&url)
            .send()
            .await
            .map_err(|e| ServiceError::Internal(format!("Health check failed: {}", e)))?;

        let health: serde_json::Value = response
            .json()
            .await
            .map_err(|e| ServiceError::Internal(format!("Failed to parse health response: {}", e)))?;

        Ok(health)
    }
}

impl Default for AgentServiceBridge {
    fn default() -> Self {
        Self::new()
    }
}

impl Drop for AgentServiceBridge {
    fn drop(&mut self) {
        // Synchronously kill process on drop
        // Note: This is best-effort since we can't async in drop
        if let Ok(mut proc) = self.process.try_write() {
            if let Some(mut child) = proc.take() {
                let _ = child.kill();
            }
        }
    }
}

// =============================================================================
// Event Transformation Helpers
// =============================================================================

impl AgentEvent {
    /// Get the session ID from any event type.
    pub fn session_id(&self) -> &str {
        match self {
            AgentEvent::SessionStart { session_id, .. } => session_id,
            AgentEvent::SessionComplete { session_id, .. } => session_id,
            AgentEvent::SessionError { session_id, .. } => session_id,
            AgentEvent::Message { session_id, .. } => session_id,
            AgentEvent::ToolUse { session_id, .. } => session_id,
            AgentEvent::ToolResult { session_id, .. } => session_id,
            AgentEvent::System { session_id, .. } => session_id,
            AgentEvent::PermissionRequest(req) => &req.session_id,
        }
    }

    /// Convert to a NormalizedEntry for frontend consumption.
    pub fn to_normalized_entry(&self, sequence: i32) -> NormalizedEntry {
        let id = uuid::Uuid::new_v4().to_string();

        match self {
            AgentEvent::SessionStart { session_id, .. } => {
                NormalizedEntry::new(
                    id,
                    session_id,
                    sequence,
                    EntryType::system("session_start"),
                    "Session started",
                )
            }
            AgentEvent::SessionComplete { session_id, .. } => {
                NormalizedEntry::new(
                    id,
                    session_id,
                    sequence,
                    EntryType::complete(CompletionStatus::Success, None),
                    "Session complete",
                )
            }
            AgentEvent::SessionError { session_id, error, .. } => {
                NormalizedEntry::new(
                    id,
                    session_id,
                    sequence,
                    EntryType::error(error, false),
                    error,
                )
            }
            AgentEvent::Message { session_id, content, .. } => {
                NormalizedEntry::new(
                    id,
                    session_id,
                    sequence,
                    EntryType::message(AgentMessageRole::Assistant),
                    content,
                )
            }
            AgentEvent::ToolUse { session_id, tool_name, tool_input, tool_id, .. } => {
                // Extract file_path from tool input
                let file_path = tool_input
                    .get("file_path")
                    .or_else(|| tool_input.get("filePath"))
                    .or_else(|| tool_input.get("path"))
                    .and_then(|v| v.as_str())
                    .map(|s| s.to_string());

                let content = format!("Using tool: {}", tool_name);
                let entry = NormalizedEntry::new(
                    id,
                    session_id,
                    sequence,
                    EntryType::tool_use(tool_id, tool_name, tool_input.clone()),
                    content,
                );

                if let Some(path) = file_path {
                    entry.with_metadata(EntryMetadata::with_file_path(path))
                } else {
                    entry
                }
            }
            AgentEvent::ToolResult { session_id, tool_id, output, is_error, .. } => {
                let status = if *is_error {
                    ToolResultStatus::Error
                } else {
                    ToolResultStatus::Success
                };

                NormalizedEntry::new(
                    id,
                    session_id,
                    sequence,
                    EntryType::tool_result(tool_id, status, output, None),
                    output,
                )
            }
            AgentEvent::System { session_id, content, .. } => {
                NormalizedEntry::new(
                    id,
                    session_id,
                    sequence,
                    EntryType::system("agent_system"),
                    content,
                )
            }
            AgentEvent::PermissionRequest(req) => {
                let content = format!("Permission requested: {}", req.description);
                let entry = NormalizedEntry::new(
                    id,
                    &req.session_id,
                    sequence,
                    EntryType::system("permission_request"),
                    content,
                );

                if let Some(ref path) = req.file_path {
                    entry.with_metadata(EntryMetadata::with_file_path(path))
                } else {
                    entry
                }
            }
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_agent_config_serialization() {
        let config = AgentConfig {
            working_directory: Some("/tmp".to_string()),
            allowed_tools: Some(vec!["Read".to_string(), "Write".to_string()]),
            max_tokens: Some(4096),
            system_prompt: None,
        };

        let json = serde_json::to_string(&config).unwrap();
        assert!(json.contains("workingDirectory"));
        assert!(json.contains("/tmp"));
    }

    #[test]
    fn test_permission_request_deserialization() {
        let json = r#"{
            "id": "perm-123",
            "sessionId": "sess-456",
            "toolName": "Write",
            "toolInput": {"file_path": "/tmp/test.txt"},
            "filePath": "/tmp/test.txt",
            "description": "Write to file: /tmp/test.txt",
            "timestamp": "2024-01-01T00:00:00Z"
        }"#;

        let request: PermissionRequest = serde_json::from_str(json).unwrap();
        assert_eq!(request.id, "perm-123");
        assert_eq!(request.session_id, "sess-456");
        assert_eq!(request.tool_name, "Write");
    }

    #[test]
    fn test_agent_event_deserialization() {
        let json = r#"{
            "type": "message",
            "sessionId": "sess-123",
            "content": "Hello, world!",
            "timestamp": "2024-01-01T00:00:00Z"
        }"#;

        let event: AgentEvent = serde_json::from_str(json).unwrap();
        match event {
            AgentEvent::Message { session_id, content, .. } => {
                assert_eq!(session_id, "sess-123");
                assert_eq!(content, "Hello, world!");
            }
            _ => panic!("Expected Message event"),
        }
    }

    #[test]
    fn test_event_to_normalized_entry() {
        let event = AgentEvent::Message {
            session_id: "sess-123".to_string(),
            content: "Test message".to_string(),
            timestamp: "2024-01-01T00:00:00Z".to_string(),
        };

        let entry = event.to_normalized_entry(1);
        assert_eq!(entry.session_id, "sess-123");
        assert_eq!(entry.content, "Test message");
        assert_eq!(entry.sequence, 1);
    }
}
