//! SDK Bridge Client
//!
//! HTTP client for communicating with the Node.js Agent Bridge server.
//! The bridge proxies requests to the Claude Agent SDK, allowing the Rust
//! backend to leverage SDK features like session resumption and typed events.
//!
//! # Architecture
//!
//! ```text
//! TaskExecutor (Rust)
//!       │
//!   execute_via_bridge()
//!       │
//!       ▼
//! SdkBridgeClient
//!       │
//!   POST /execute (HTTP)
//!       │
//!       ▼
//! Agent Bridge (Node.js)
//!       │
//!   query() from SDK
//!       │
//!       ▼
//! Claude Agent SDK
//!       │
//!   SSE stream back
//!       │
//!       ▼
//! Parse SSE → UnifiedAgentEvent
//! ```
//!
//! # Usage
//!
//! ```ignore
//! use openflow_core::services::sdk_bridge::{SdkBridgeClient, ExecuteRequest};
//!
//! let client = SdkBridgeClient::new("http://localhost:3002");
//!
//! let request = ExecuteRequest {
//!     prompt: "Fix the bug in main.rs".to_string(),
//!     working_dir: "/path/to/project".to_string(),
//!     session_id: None,
//!     allowed_tools: None,
//!     permission_mode: None,
//! };
//!
//! let mut stream = client.execute(request).await?;
//!
//! while let Some(event) = stream.next().await {
//!     match event {
//!         Ok(agent_event) => println!("Event: {:?}", agent_event),
//!         Err(e) => eprintln!("Error: {}", e),
//!     }
//! }
//! ```

use log::{debug, error, info, warn};
use reqwest::Client;
use serde::{Deserialize, Serialize};

use openflow_contracts::events::{AgentMessageRole, ContentBlock, UnifiedAgentEvent};

use super::{ServiceError, ServiceResult};

// =============================================================================
// Request/Response Types
// =============================================================================

/// Request payload for the bridge's /execute endpoint.
#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ExecuteRequest {
    /// The prompt to send to the agent
    pub prompt: String,
    /// Working directory for file operations
    pub working_dir: String,
    /// Optional session ID for resuming a conversation
    #[serde(skip_serializing_if = "Option::is_none")]
    pub session_id: Option<String>,
    /// List of allowed tools
    #[serde(skip_serializing_if = "Option::is_none")]
    pub allowed_tools: Option<Vec<String>>,
    /// Permission mode
    #[serde(skip_serializing_if = "Option::is_none")]
    pub permission_mode: Option<String>,
}

impl ExecuteRequest {
    /// Create a new execute request.
    pub fn new(prompt: impl Into<String>, working_dir: impl Into<String>) -> Self {
        Self {
            prompt: prompt.into(),
            working_dir: working_dir.into(),
            session_id: None,
            allowed_tools: None,
            permission_mode: None,
        }
    }

    /// Set the session ID for resuming.
    pub fn with_session_id(mut self, session_id: impl Into<String>) -> Self {
        self.session_id = Some(session_id.into());
        self
    }

    /// Set allowed tools.
    pub fn with_allowed_tools(mut self, tools: Vec<String>) -> Self {
        self.allowed_tools = Some(tools);
        self
    }

    /// Set permission mode.
    pub fn with_permission_mode(mut self, mode: impl Into<String>) -> Self {
        self.permission_mode = Some(mode.into());
        self
    }
}

/// Bridge health check response.
#[derive(Debug, Clone, Deserialize)]
pub struct HealthResponse {
    pub status: String,
    pub version: String,
    pub uptime: u64,
}

/// SSE event from the bridge.
#[derive(Debug, Clone, Deserialize, Serialize)]
#[serde(rename_all = "camelCase", tag = "type")]
pub enum BridgeEvent {
    Init {
        #[serde(rename = "sessionId")]
        session_id: String,
        timestamp: String,
    },
    Message {
        role: String,
        content: String,
        timestamp: String,
    },
    ToolUse {
        #[serde(rename = "toolId")]
        tool_id: String,
        #[serde(rename = "toolName")]
        tool_name: String,
        input: serde_json::Value,
        timestamp: String,
    },
    ToolResult {
        #[serde(rename = "toolId")]
        tool_id: String,
        output: String,
        #[serde(rename = "isError")]
        is_error: bool,
        timestamp: String,
    },
    Complete {
        status: String,
        #[serde(default, rename = "exitCode")]
        exit_code: Option<i32>,
        timestamp: String,
    },
    Error {
        message: String,
        #[serde(default)]
        code: Option<String>,
        timestamp: String,
    },
    Session {
        #[serde(rename = "sessionId")]
        session_id: String,
        timestamp: String,
    },
}

impl BridgeEvent {
    /// Convert a bridge event to a UnifiedAgentEvent.
    pub fn to_unified_event(&self) -> Option<UnifiedAgentEvent> {
        match self {
            BridgeEvent::Init {
                session_id,
                ..
            } => Some(UnifiedAgentEvent::init(session_id, "", vec![])),

            BridgeEvent::Message {
                role,
                content,
                ..
            } => {
                let agent_role = if role == "assistant" {
                    AgentMessageRole::Assistant
                } else {
                    AgentMessageRole::User
                };
                Some(UnifiedAgentEvent::message(
                    agent_role,
                    vec![ContentBlock::text(content)],
                ))
            }

            BridgeEvent::ToolUse {
                tool_id,
                tool_name,
                input,
                ..
            } => Some(UnifiedAgentEvent::tool_use(tool_id, tool_name, input.clone())),

            BridgeEvent::ToolResult {
                tool_id,
                output,
                is_error,
                ..
            } => {
                if *is_error {
                    Some(UnifiedAgentEvent::tool_result_error(tool_id, output))
                } else {
                    Some(UnifiedAgentEvent::tool_result_success(tool_id, output))
                }
            }

            BridgeEvent::Complete { status, .. } => {
                if status == "success" {
                    Some(UnifiedAgentEvent::complete_success(None))
                } else {
                    Some(UnifiedAgentEvent::complete_error(None))
                }
            }

            BridgeEvent::Error { message, .. } => Some(UnifiedAgentEvent::error(
                "bridge_error",
                message,
            )),

            BridgeEvent::Session { .. } => {
                // Session events are metadata, not user-facing
                None
            }
        }
    }
}

// =============================================================================
// Bridge Client
// =============================================================================

/// Client for communicating with the SDK Bridge server.
#[derive(Debug, Clone)]
pub struct SdkBridgeClient {
    client: Client,
    base_url: String,
}

impl Default for SdkBridgeClient {
    fn default() -> Self {
        Self::new("http://localhost:3002")
    }
}

impl SdkBridgeClient {
    /// Create a new bridge client with the given base URL.
    pub fn new(base_url: impl Into<String>) -> Self {
        Self {
            client: Client::new(),
            base_url: base_url.into(),
        }
    }

    /// Check if the bridge server is healthy.
    pub async fn health_check(&self) -> ServiceResult<HealthResponse> {
        let url = format!("{}/health", self.base_url);

        let response = self
            .client
            .get(&url)
            .send()
            .await
            .map_err(|e| ServiceError::External(format!("Bridge health check failed: {}", e)))?;

        if !response.status().is_success() {
            return Err(ServiceError::External(format!(
                "Bridge health check returned {}",
                response.status()
            )));
        }

        response
            .json::<HealthResponse>()
            .await
            .map_err(|e| ServiceError::External(format!("Failed to parse health response: {}", e)))
    }

    /// Execute an agent query via the bridge.
    ///
    /// Returns a stream of unified agent events.
    pub async fn execute(
        &self,
        request: ExecuteRequest,
    ) -> ServiceResult<BridgeEventStream> {
        let url = format!("{}/execute", self.base_url);

        info!(
            "Executing via SDK bridge: prompt='{}...', working_dir={}",
            request.prompt.chars().take(50).collect::<String>(),
            request.working_dir
        );

        let response = self
            .client
            .post(&url)
            .json(&request)
            .send()
            .await
            .map_err(|e| ServiceError::External(format!("Bridge execute failed: {}", e)))?;

        if !response.status().is_success() {
            let status = response.status();
            let body = response.text().await.unwrap_or_default();
            return Err(ServiceError::External(format!(
                "Bridge execute returned {}: {}",
                status, body
            )));
        }

        Ok(BridgeEventStream::new(response))
    }
}

// =============================================================================
// Event Stream
// =============================================================================

/// Stream of events from the bridge.
///
/// Parses SSE events and converts them to UnifiedAgentEvents.
pub struct BridgeEventStream {
    response: reqwest::Response,
    buffer: String,
}

impl BridgeEventStream {
    fn new(response: reqwest::Response) -> Self {
        Self {
            response,
            buffer: String::new(),
        }
    }

    /// Get the next event from the stream.
    ///
    /// Returns None when the stream is exhausted.
    pub async fn next_event(&mut self) -> Option<ServiceResult<UnifiedAgentEvent>> {
        loop {
            // Check if we have a complete event in the buffer
            if let Some(pos) = self.buffer.find("\n\n") {
                let event_data = self.buffer[..pos].to_string();
                self.buffer = self.buffer[pos + 2..].to_string();

                // Parse SSE data line
                if let Some(data) = event_data.strip_prefix("data: ") {
                    match serde_json::from_str::<BridgeEvent>(data) {
                        Ok(bridge_event) => {
                            debug!("Received bridge event: {:?}", bridge_event);

                            if let Some(unified) = bridge_event.to_unified_event() {
                                return Some(Ok(unified));
                            }
                            // Skip events that don't convert (like Session)
                            continue;
                        }
                        Err(e) => {
                            warn!("Failed to parse bridge event: {} - data: {}", e, data);
                            continue;
                        }
                    }
                }
                continue;
            }

            // Read more data from the response
            match self.response.chunk().await {
                Ok(Some(chunk)) => {
                    if let Ok(text) = String::from_utf8(chunk.to_vec()) {
                        self.buffer.push_str(&text);
                    }
                }
                Ok(None) => {
                    // Stream ended
                    return None;
                }
                Err(e) => {
                    error!("Error reading bridge stream: {}", e);
                    return Some(Err(ServiceError::External(format!(
                        "Stream read error: {}",
                        e
                    ))));
                }
            }
        }
    }
}

// =============================================================================
// Tests
// =============================================================================

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_execute_request_builder() {
        let request = ExecuteRequest::new("Fix bug", "/path/to/project")
            .with_session_id("session-123")
            .with_allowed_tools(vec!["Read".to_string(), "Write".to_string()])
            .with_permission_mode("acceptEdits");

        assert_eq!(request.prompt, "Fix bug");
        assert_eq!(request.working_dir, "/path/to/project");
        assert_eq!(request.session_id, Some("session-123".to_string()));
        assert_eq!(
            request.allowed_tools,
            Some(vec!["Read".to_string(), "Write".to_string()])
        );
        assert_eq!(request.permission_mode, Some("acceptEdits".to_string()));
    }

    #[test]
    fn test_bridge_event_parsing() {
        // rename_all = "camelCase" means tag value is "init" and fields are camelCase
        let json = r#"{"type":"init","sessionId":"sess-123","timestamp":"2024-01-01T00:00:00Z"}"#;
        let event: BridgeEvent = serde_json::from_str(json).unwrap();

        match event {
            BridgeEvent::Init { session_id, .. } => {
                assert_eq!(session_id, "sess-123");
            }
            _ => panic!("Expected Init event"),
        }
    }

    #[test]
    fn test_bridge_event_to_unified() {
        let event = BridgeEvent::Message {
            role: "assistant".to_string(),
            content: "Hello, world!".to_string(),
            timestamp: "2024-01-01T00:00:00Z".to_string(),
        };

        let unified = event.to_unified_event().unwrap();

        match unified {
            UnifiedAgentEvent::Message { role, content } => {
                assert_eq!(role, AgentMessageRole::Assistant);
                assert_eq!(content.len(), 1);
            }
            _ => panic!("Expected Message event"),
        }
    }

    #[test]
    fn test_tool_use_event_conversion() {
        let event = BridgeEvent::ToolUse {
            tool_id: "tool-123".to_string(),
            tool_name: "Read".to_string(),
            input: serde_json::json!({"path": "main.rs"}),
            timestamp: "2024-01-01T00:00:00Z".to_string(),
        };

        let unified = event.to_unified_event().unwrap();

        match unified {
            UnifiedAgentEvent::ToolUse {
                tool_id,
                tool_name,
                ..
            } => {
                assert_eq!(tool_id, "tool-123");
                assert_eq!(tool_name, "Read");
            }
            _ => panic!("Expected ToolUse event"),
        }
    }

    #[test]
    fn test_complete_event_conversion() {
        let event = BridgeEvent::Complete {
            status: "success".to_string(),
            exit_code: Some(0),
            timestamp: "2024-01-01T00:00:00Z".to_string(),
        };

        let unified = event.to_unified_event().unwrap();

        match unified {
            UnifiedAgentEvent::Complete { status, .. } => {
                assert!(status.is_success());
            }
            _ => panic!("Expected Complete event"),
        }
    }
}

