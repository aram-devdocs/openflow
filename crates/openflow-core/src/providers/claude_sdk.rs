//! Claude SDK Provider
//!
//! SDK-based provider that uses the Claude Agent SDK via the Node.js bridge.
//! Unlike the CLI-based providers, this doesn't spawn a PTY process - instead
//! it communicates via HTTP with the agent-bridge server.
//!
//! # Architecture
//!
//! ```text
//! TaskExecutor
//!      │
//!      ▼
//! AgentOrchestrator
//!      │
//!   uses ClaudeSdkProvider
//!      │
//!      ▼
//! SdkBridgeClient
//!      │
//!   POST /execute
//!      │
//!      ▼
//! Agent Bridge (Node.js)
//!      │
//!   Claude Agent SDK
//! ```
//!
//! # Features
//!
//! - Session resumption via session_id
//! - Streaming JSON events via SSE
//! - No PTY required - pure HTTP
//! - Tool events (Read, Write, Edit, Bash, etc.)

use std::collections::HashMap;
use std::fmt::Debug;

use openflow_contracts::events::{PermissionRequest, UnifiedAgentEvent};
use openflow_process::PtyConfig;

use super::{AgentConfig, AgentProvider, ProviderCapabilities};

// =============================================================================
// Constants
// =============================================================================

/// Provider identifier for the Claude SDK provider.
pub const PROVIDER_ID: &str = "claude-sdk";

// =============================================================================
// Provider Implementation
// =============================================================================

/// Claude SDK provider.
///
/// This provider uses the Claude Agent SDK via the HTTP bridge rather than
/// spawning CLI processes. It provides better event streaming and session
/// management capabilities.
#[derive(Debug, Clone, Default)]
pub struct ClaudeSdkProvider;

impl ClaudeSdkProvider {
    /// Create a new Claude SDK provider.
    pub fn new() -> Self {
        Self
    }
}

impl AgentProvider for ClaudeSdkProvider {
    fn provider_id(&self) -> &'static str {
        PROVIDER_ID
    }

    fn display_name(&self) -> &'static str {
        "Claude (SDK)"
    }

    fn command(&self) -> &'static str {
        // Not used - this provider doesn't spawn CLI processes
        ""
    }

    fn capabilities(&self) -> ProviderCapabilities {
        ProviderCapabilities {
            supports_resume: true,
            supports_streaming_json: true,
            supports_skip_permissions: true,
            supports_verbose: false,
            emits_tool_events: true,
            emits_thinking: true,
        }
    }

    fn build_command(&self, _config: &AgentConfig) -> PtyConfig {
        // Not used - this provider doesn't spawn CLI processes
        // Return default config to satisfy trait requirement
        PtyConfig::default()
    }

    fn parse_line(&self, _line: &str) -> Option<UnifiedAgentEvent> {
        // Not used - events come from SSE stream via SdkBridgeClient
        None
    }

    fn is_permission_prompt(&self, _line: &str) -> Option<PermissionRequest> {
        // Not used - the SDK handles permissions internally
        None
    }

    fn resume_args(&self, _session_id: &str) -> Vec<String> {
        // Not used - session ID is passed via HTTP request
        vec![]
    }

    fn approval_response(&self, _approved: bool) -> &'static [u8] {
        // Not used - the SDK handles permissions internally
        b""
    }

    fn default_env(&self) -> HashMap<String, String> {
        // No special env vars needed - the bridge handles this
        HashMap::new()
    }
}

// =============================================================================
// Tests
// =============================================================================

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_provider_id() {
        let provider = ClaudeSdkProvider::new();
        assert_eq!(provider.provider_id(), "claude-sdk");
    }

    #[test]
    fn test_display_name() {
        let provider = ClaudeSdkProvider::new();
        assert_eq!(provider.display_name(), "Claude (SDK)");
    }

    #[test]
    fn test_capabilities() {
        let provider = ClaudeSdkProvider::new();
        let caps = provider.capabilities();
        assert!(caps.supports_resume);
        assert!(caps.supports_streaming_json);
        assert!(caps.supports_skip_permissions);
        assert!(caps.emits_tool_events);
    }

    #[test]
    fn test_parse_line_returns_none() {
        let provider = ClaudeSdkProvider::new();
        // This provider doesn't parse lines - it uses SSE
        assert!(provider.parse_line("anything").is_none());
    }

    #[test]
    fn test_is_permission_prompt_returns_none() {
        let provider = ClaudeSdkProvider::new();
        // SDK handles permissions internally
        assert!(provider.is_permission_prompt("anything").is_none());
    }
}

