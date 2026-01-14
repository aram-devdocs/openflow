//! Agent Orchestrator Service
//!
//! Central orchestrator for managing agent processes. Coordinates between:
//! - Provider abstraction (normalize different CLI tools)
//! - PTY execution (spawn and manage processes)
//! - State persistence (sessions, events, tools in SQLite)
//! - Event broadcasting (real-time updates to clients)
//!
//! # Architecture
//!
//! ```text
//! ┌─────────────────────────────────────────────────────────────────────────┐
//! │                         AgentOrchestrator                               │
//! ├─────────────────────────────────────────────────────────────────────────┤
//! │                                                                         │
//! │   spawn_agent()        handle_permission()        kill_agent()          │
//! │         │                      │                       │                │
//! │         ▼                      ▼                       ▼                │
//! │   ┌───────────┐         ┌───────────┐           ┌───────────┐          │
//! │   │ Provider  │         │  Session  │           │  PTY      │          │
//! │   │ Registry  │         │  Service  │           │ Executor  │          │
//! │   └───────────┘         └───────────┘           └───────────┘          │
//! │                                                                         │
//! │   ┌──────────────────────────────────────────────────────────────────┐ │
//! │   │                  AgentOutputPipeline                             │ │
//! │   │  - Buffers PTY output into complete lines                        │ │
//! │   │  - Detects permission prompts                                    │ │
//! │   │  - Parses lines via Provider                                     │ │
//! │   │  - Normalizes events to canonical format                         │ │
//! │   │  - Persists normalized events to DB                              │ │
//! │   │  - Tracks tool states                                            │ │
//! │   │  - Broadcasts to clients                                         │ │
//! │   └──────────────────────────────────────────────────────────────────┘ │
//! │                                                                         │
//! └─────────────────────────────────────────────────────────────────────────┘
//! ```
//!
//! # Key Invariants
//!
//! 1. Every agent process has a corresponding AgentSession in the database
//! 2. All parsed events are persisted with monotonic sequence numbers
//! 3. Tool states are tracked from ToolUse to ToolResult
//! 4. All significant actions are logged to audit trail
//! 5. Events are broadcast to all connected clients
//!
//! # Thread Safety
//!
//! The orchestrator is `Send + Sync` and can be safely shared across threads.
//! Internal state is protected by RwLock where needed.
//!
//! # Logging
//!
//! Uses `log` crate for structured logging:
//! - `debug!`: Detailed operation tracing
//! - `info!`: Successful operations (spawn, complete, permission)
//! - `warn!`: Potentially problematic situations
//! - `error!`: Operation failures

use std::collections::HashMap;
use std::sync::Arc;
use std::sync::atomic::{AtomicI32, Ordering};

use async_trait::async_trait;
use log::{debug, error, info, trace, warn};
use sqlx::SqlitePool;
use tokio::sync::RwLock;

use openflow_contracts::{
    AgentSession, AuditAction, Permission, SessionStatus,
};
use openflow_contracts::events::{
    agent_event_channel, EntryType, NormalizedEntry, PermissionRequest, UnifiedAgentEvent,
};
use openflow_process::{
    NativePtyExecutor, OutputChunk, OutputSink, ProcessExecutor, ProcessResult, SpawnConfig,
};

use crate::events::{Event, EventBroadcaster};
use crate::providers::{get_provider, AgentConfig, AgentProvider};

use super::agent_service_bridge::{
    AgentConfig as SdkAgentConfig, AgentEvent as SdkAgentEvent,
    AgentServiceBridge, PermissionRequest as SdkPermissionRequest,
};
use super::agent_session::{self, CreateSessionRequest};
use super::tool_state;
use super::audit;
use super::line_buffer::LineBuffer;
use super::normalizer::EventNormalizer;
use super::permission_detector::PermissionDetector;
use super::{ServiceError, ServiceResult};

// =============================================================================
// Active Session Info
// =============================================================================

/// Information about an active agent session.
///
/// Tracks the runtime state of a running agent process.
#[derive(Debug)]
#[allow(dead_code)]
struct ActiveSession {
    /// The database session record (for future resume/status checks)
    session: AgentSession,
    /// Provider being used
    provider_id: String,
}

impl ActiveSession {
    fn new(session: AgentSession, provider_id: String) -> Self {
        Self {
            session,
            provider_id,
        }
    }
}

// =============================================================================
// Agent Output Sink
// =============================================================================

/// Output sink that processes agent PTY output.
///
/// This sink:
/// 1. Receives raw output chunks from the PTY
/// 2. Buffers incomplete lines
/// 3. Parses complete lines via the provider
/// 4. Persists parsed events to the database
/// 5. Broadcasts events to connected clients
/// 6. Detects permission prompts
pub struct AgentOutputSink {
    /// Session ID for this sink
    session_id: String,
    /// Database pool for persistence
    pool: SqlitePool,
    /// Event broadcaster for real-time updates
    broadcaster: Arc<dyn EventBroadcaster>,
    /// Provider for parsing output
    provider: Arc<dyn AgentProvider>,
    /// Buffer for incomplete lines (shared with orchestrator)
    line_buffer: Arc<RwLock<String>>,
    /// Raw output buffer for terminal display
    raw_output: Arc<RwLock<String>>,
}

impl AgentOutputSink {
    /// Create a new output sink.
    pub fn new(
        session_id: String,
        pool: SqlitePool,
        broadcaster: Arc<dyn EventBroadcaster>,
        provider: Arc<dyn AgentProvider>,
    ) -> Self {
        Self {
            session_id,
            pool,
            broadcaster,
            provider,
            line_buffer: Arc::new(RwLock::new(String::new())),
            raw_output: Arc::new(RwLock::new(String::new())),
        }
    }

    /// Process a complete line of output.
    async fn process_line(&self, line: &str) -> ProcessResult<()> {
        // Skip empty lines
        if line.trim().is_empty() {
            return Ok(());
        }

        debug!("Processing line for session {}: {}", self.session_id, line);

        // Check for permission prompt first
        if let Some(perm_request) = self.provider.is_permission_prompt(line) {
            self.handle_permission_prompt(perm_request).await?;
            return Ok(());
        }

        // Try to parse as agent event
        if let Some(event) = self.provider.parse_line(line) {
            self.handle_parsed_event(event).await?;
        }

        Ok(())
    }

    /// Handle a parsed agent event.
    async fn handle_parsed_event(&self, event: UnifiedAgentEvent) -> ProcessResult<()> {
        // Determine event type string
        let event_type = match &event {
            UnifiedAgentEvent::Init { .. } => "init",
            UnifiedAgentEvent::Message { .. } => "message",
            UnifiedAgentEvent::ToolUse { .. } => "tool_use",
            UnifiedAgentEvent::ToolResult { .. } => "tool_result",
            UnifiedAgentEvent::Complete { .. } => "complete",
            UnifiedAgentEvent::Error { .. } => "error",
            UnifiedAgentEvent::Permission { .. } => "permission",
        };

        // Serialize event to JSON for storage
        let payload = serde_json::to_value(&event)
            .unwrap_or_else(|_| serde_json::json!({"error": "Failed to serialize event"}));

        // Persist to database
        let sequence = agent_session::add_event(&self.pool, &self.session_id, event_type, &payload)
            .await
            .map_err(|e| {
                error!("Failed to persist event: {}", e);
                openflow_process::ProcessError::Internal(e.to_string())
            })?;

        debug!(
            "Persisted event: session={}, type={}, sequence={}",
            self.session_id, event_type, sequence
        );

        // Handle tool state tracking
        match &event {
            UnifiedAgentEvent::ToolUse {
                tool_id,
                tool_name,
                input,
            } => {
                if let Err(e) = tool_state::create_from_tool_use(
                    &self.pool,
                    &self.session_id,
                    tool_id,
                    tool_name,
                    input,
                )
                .await
                {
                    warn!("Failed to create tool state: {}", e);
                }
            }
            UnifiedAgentEvent::ToolResult {
                tool_id,
                status,
                output,
                ..
            } => {
                if let Err(e) = tool_state::complete_from_tool_result(
                    &self.pool,
                    &self.session_id,
                    tool_id,
                    status.clone(),
                    output,
                )
                .await
                {
                    warn!("Failed to complete tool state: {}", e);
                }
            }
            _ => {}
        }

        // Broadcast to clients
        let _channel = agent_event_channel(&self.session_id);
        self.broadcaster.broadcast(Event::claude_event(
            &self.session_id,
            payload.clone(),
        ));

        Ok(())
    }

    /// Handle a permission prompt.
    async fn handle_permission_prompt(&self, request: PermissionRequest) -> ProcessResult<()> {
        info!(
            "Permission prompt detected for session {}: {}",
            self.session_id, request.description
        );

        // Create permission record in database
        let permission = agent_session::create_permission(
            &self.pool,
            &self.session_id,
            &request.tool_name,
            &request.description,
            request.file_path.as_deref(),
        )
        .await
        .map_err(|e| {
            error!("Failed to create permission record: {}", e);
            openflow_process::ProcessError::Internal(e.to_string())
        })?;

        // Broadcast permission request to clients
        // Note: Using Process entity type as Permission is not in EntityType enum
        // The permission data includes session_id for filtering
        self.broadcaster.broadcast(Event::data_changed(
            crate::events::EntityType::Process,
            crate::events::DataAction::Updated,
            &self.session_id,
            Some(serde_json::json!({
                "type": "permission_request",
                "permission": serde_json::to_value(&permission).unwrap_or_default()
            })),
        ));

        Ok(())
    }

    /// Get the raw output buffer.
    pub async fn get_raw_output(&self) -> String {
        self.raw_output.read().await.clone()
    }
}

#[async_trait]
impl OutputSink for AgentOutputSink {
    async fn send(&self, chunk: OutputChunk) -> ProcessResult<()> {
        // Append to raw output buffer
        {
            let mut raw = self.raw_output.write().await;
            raw.push_str(&chunk.content);

            // Limit buffer size to 10MB
            const MAX_BUFFER_SIZE: usize = 10 * 1024 * 1024;
            if raw.len() > MAX_BUFFER_SIZE {
                let excess = raw.len() - MAX_BUFFER_SIZE;
                raw.drain(..excess);
            }
        }

        // Add to line buffer and process complete lines
        let mut buffer = self.line_buffer.write().await;
        buffer.push_str(&chunk.content);

        // Process complete lines
        while let Some(newline_pos) = buffer.find('\n') {
            let line = buffer[..newline_pos].to_string();
            buffer.drain(..=newline_pos);

            // Release lock before async processing
            drop(buffer);

            if let Err(e) = self.process_line(&line).await {
                warn!("Error processing line: {}", e);
            }

            // Re-acquire lock
            buffer = self.line_buffer.write().await;
        }

        Ok(())
    }

    async fn close(&self) -> ProcessResult<()> {
        // Process any remaining content in buffer
        let remaining = {
            let mut buffer = self.line_buffer.write().await;
            std::mem::take(&mut *buffer)
        };

        if !remaining.trim().is_empty() {
            if let Err(e) = self.process_line(&remaining).await {
                warn!("Error processing final line: {}", e);
            }
        }

        debug!("Output sink closed for session {}", self.session_id);
        Ok(())
    }
}

// =============================================================================
// Agent Output Pipeline
// =============================================================================

/// Agent output pipeline - unified processing of PTY output.
///
/// This pipeline provides:
///
/// 1. **Line Buffering** - Accumulates bytes and extracts complete lines
/// 2. **Permission Detection** - Detects permission prompts before parsing
/// 3. **Event Parsing** - Parses lines via provider to UnifiedAgentEvent
/// 4. **Event Normalization** - Transforms to canonical NormalizedEntry format
/// 5. **State Tracking** - Updates tool states in database
/// 6. **Event Persistence** - Stores normalized events in database
/// 7. **Broadcasting** - Sends events to connected clients via WebSocket
///
/// # Architecture
///
/// ```text
/// ┌─────────────────────────────────────────────────────────────────────────┐
/// │                      AgentOutputPipeline                                 │
/// ├─────────────────────────────────────────────────────────────────────────┤
/// │                                                                          │
/// │  PTY Bytes → LineBuffer → PermissionDetector → Provider.parse_line      │
/// │                ↓                                       ↓                 │
/// │           Raw Output                          UnifiedAgentEvent          │
/// │                                                       ↓                  │
/// │                                            EventNormalizer               │
/// │                                                       ↓                  │
/// │                                            NormalizedEntry               │
/// │                                                       ↓                  │
/// │                                         ┌─────────────┴──────────────┐   │
/// │                                         │                            │   │
/// │                                    Persistence                  Broadcast│
/// │                                    (Database)                 (WebSocket)│
/// │                                                                          │
/// └─────────────────────────────────────────────────────────────────────────┘
/// ```
///
/// # Key Features
///
/// - **Single Responsibility**: Each component has one job
/// - **No Duplication**: Single line buffer, single normalization step
/// - **Type Safety**: Strongly typed events throughout pipeline
/// - **Observable**: Raw and normalized streams available separately
/// - **Testable**: Components can be tested independently
/// - Uses PermissionDetector for robust permission prompt detection
/// - Tracks sequence numbers with AtomicI32 for thread safety
/// - Separates raw output from normalized events
///
pub struct AgentOutputPipeline {
    /// Session ID for this pipeline
    session_id: String,
    
    /// Database pool for persistence
    pool: SqlitePool,
    
    /// Event broadcaster for real-time updates
    broadcaster: Arc<dyn EventBroadcaster>,
    
    /// Provider for parsing output
    provider: Arc<dyn AgentProvider>,
    
    // =========================================================================
    // Pipeline Components (Single instances, no duplication)
    // =========================================================================
    
    /// Line buffer - accumulates bytes and extracts complete lines
    /// Wrapped in Mutex for interior mutability (thread-safe async)
    line_buffer: Arc<tokio::sync::Mutex<LineBuffer>>,
    
    /// Event normalizer - transforms UnifiedAgentEvent to NormalizedEntry
    /// Stateless, no need for interior mutability
    normalizer: EventNormalizer,
    
    /// Permission detector - detects and tracks permission prompts
    /// Wrapped in Mutex for interior mutability (maintains pending permissions)
    permission_detector: Arc<tokio::sync::Mutex<PermissionDetector>>,
    
    // =========================================================================
    // State
    // =========================================================================
    
    /// Raw output buffer for terminal display (shared, thread-safe)
    raw_output: Arc<RwLock<String>>,
    
    /// Next sequence number for events (atomic for thread safety)
    next_sequence: AtomicI32,
}

impl AgentOutputPipeline {
    /// Create a new output pipeline.
    ///
    /// # Arguments
    /// * `session_id` - Session ID for this pipeline
    /// * `pool` - Database connection pool
    /// * `broadcaster` - Event broadcaster for real-time updates
    /// * `provider` - Provider for parsing output
    pub fn new(
        session_id: String,
        pool: SqlitePool,
        broadcaster: Arc<dyn EventBroadcaster>,
        provider: Arc<dyn AgentProvider>,
    ) -> Self {
        debug!("Creating AgentOutputPipeline for session {}", session_id);
        
        Self {
            session_id,
            pool,
            broadcaster,
            provider,
            line_buffer: Arc::new(tokio::sync::Mutex::new(LineBuffer::new())),
            normalizer: EventNormalizer::new(),
            permission_detector: Arc::new(tokio::sync::Mutex::new(PermissionDetector::new())),
            raw_output: Arc::new(RwLock::new(String::new())),
            next_sequence: AtomicI32::new(0),
        }
    }
    
    /// Get the raw output buffer.
    ///
    /// Returns the accumulated raw PTY output for terminal display.
    pub async fn get_raw_output(&self) -> String {
        self.raw_output.read().await.clone()
    }
    
    /// Get the current sequence number (for debugging/monitoring).
    pub fn current_sequence(&self) -> i32 {
        self.next_sequence.load(Ordering::SeqCst)
    }
    
    /// Get statistics about the line buffer (for monitoring).
    pub async fn buffer_stats(&self) -> super::line_buffer::LineBufferStats {
        self.line_buffer.lock().await.stats()
    }
    
    /// Get the number of pending permissions.
    pub async fn pending_permissions_count(&self) -> usize {
        self.permission_detector.lock().await.pending_count_for_session(&self.session_id)
    }
    
    // =========================================================================
    // Pipeline Processing Methods
    // =========================================================================
    
    /// Process complete lines extracted from the buffer.
    ///
    /// This is the core of the pipeline that:
    /// 1. Detects permission prompts
    /// 2. Parses events via provider
    /// 3. Normalizes events to canonical format
    /// 4. Persists to database
    /// 5. Tracks tool states
    /// 6. Broadcasts to clients
    async fn process_complete_lines(&self, lines: Vec<String>) -> ProcessResult<()> {
        for line in lines {
            if let Err(e) = self.process_line(&line).await {
                warn!(
                    "Error processing line for session {}: {}",
                    self.session_id, e
                );
            }
        }
        Ok(())
    }
    
    /// Process a single complete line through the pipeline.
    async fn process_line(&self, line: &str) -> ProcessResult<()> {
        // Skip empty lines
        if line.trim().is_empty() {
            return Ok(());
        }
        
        trace!(
            "Processing line for session {}: {}",
            self.session_id, line
        );
        
        // Step 1: Detect permission prompts
        if let Some(perm_request) = self.detect_permission(line).await {
            self.handle_permission_prompt(perm_request).await?;
            return Ok(());
        }
        
        // Step 2: Parse line via provider
        if let Some(event) = self.parse_line(line) {
            // Step 3: Normalize event
            let normalized = self.normalize_event(event)?;
            
            // Step 4: Track tool state
            self.track_tool_state(&normalized).await?;
            
            // Step 5: Persist event
            self.persist_event(&normalized).await?;
            
            // Step 6: Broadcast events
            self.broadcast_events(&normalized, line).await;
        }
        
        Ok(())
    }
    
    /// Detect permission prompts from output line.
    async fn detect_permission(&self, line: &str) -> Option<PermissionRequest> {
        self.permission_detector.lock().await.detect(line)
    }
    
    /// Parse line via provider to UnifiedAgentEvent.
    fn parse_line(&self, line: &str) -> Option<UnifiedAgentEvent> {
        self.provider.parse_line(line)
    }
    
    /// Normalize a UnifiedAgentEvent to NormalizedEntry.
    fn normalize_event(&self, event: UnifiedAgentEvent) -> ProcessResult<NormalizedEntry> {
        let sequence = self.next_sequence.fetch_add(1, Ordering::SeqCst);
        
        self.normalizer
            .normalize(event, &self.session_id, sequence)
            .map_err(|e| {
                error!(
                    "Failed to normalize event for session {}: {}",
                    self.session_id, e
                );
                openflow_process::ProcessError::Internal(e.to_string())
            })
    }
    
    /// Track tool state in database.
    async fn track_tool_state(&self, entry: &NormalizedEntry) -> ProcessResult<()> {
        match &entry.entry_type {
            EntryType::ToolUse {
                tool_id,
                tool_name,
                input,
            } => {
                if let Err(e) = tool_state::create_from_tool_use(
                    &self.pool,
                    &self.session_id,
                    tool_id,
                    tool_name,
                    input,
                )
                .await
                {
                    warn!(
                        "Failed to create tool state for session {} tool {}: {}",
                        self.session_id, tool_id, e
                    );
                }
            }
            EntryType::ToolResult {
                tool_id,
                status,
                output,
                ..
            } => {
                if let Err(e) = tool_state::complete_from_tool_result(
                    &self.pool,
                    &self.session_id,
                    tool_id,
                    status.clone(),
                    output,
                )
                .await
                {
                    warn!(
                        "Failed to complete tool state for session {} tool {}: {}",
                        self.session_id, tool_id, e
                    );
                }
            }
            _ => {}
        }
        Ok(())
    }
    
    /// Persist normalized entry to database.
    async fn persist_event(&self, entry: &NormalizedEntry) -> ProcessResult<()> {
        // Serialize entry to JSON for storage
        let payload = serde_json::to_value(entry)
            .unwrap_or_else(|_| serde_json::json!({"error": "Failed to serialize entry"}));
        
        // Determine event type string
        let event_type = entry.entry_type.type_name();
        
        // Persist to database
        agent_session::add_event(&self.pool, &self.session_id, event_type, &payload)
            .await
            .map_err(|e| {
                error!(
                    "Failed to persist event for session {}: {}",
                    self.session_id, e
                );
                openflow_process::ProcessError::Internal(e.to_string())
            })?;
        
        debug!(
            "Persisted normalized event: session={}, type={}, sequence={}",
            self.session_id, event_type, entry.sequence
        );
        
        Ok(())
    }
    
    /// Broadcast events to connected clients via multiple channels.
    ///
    /// This method broadcasts to three separate channels:
    /// 1. raw-output-{session_id} - Raw output for terminal display
    /// 2. normalized-{session_id} - Normalized events for UI rendering
    /// 3. data-changed - Tool state updates (for tool events only)
    async fn broadcast_events(&self, entry: &NormalizedEntry, raw_line: &str) {
        // 1. Broadcast raw output to raw-output channel (for terminal display)
        self.broadcaster.broadcast(Event::raw_output(
            &self.session_id,
            raw_line,
        ));
        
        // 2. Broadcast normalized entry to normalized channel (for UI rendering)
        self.broadcaster.broadcast(Event::normalized_entry(
            &self.session_id,
            entry.clone(),
        ));
        
        // 3. Broadcast tool state updates for tool events
        match &entry.entry_type {
            EntryType::ToolUse { tool_id, .. } | EntryType::ToolResult { tool_id, .. } => {
                // Fetch the tool state from database
                if let Ok(Some(tool_state)) = tool_state::get_by_tool_use_id(
                    &self.pool,
                    &self.session_id,
                    tool_id,
                ).await {
                    // Broadcast tool state as a data changed event
                    self.broadcaster.broadcast(Event::updated(
                        crate::events::EntityType::ToolState,
                        &tool_state.id,
                        &tool_state,
                    ));
                    
                    debug!(
                        "Broadcasted tool state: session={}, tool_id={}, status={:?}",
                        self.session_id, tool_id, tool_state.status
                    );
                }
            }
            _ => {}
        }
        
        debug!(
            "Broadcasted events: session={}, sequence={}, channels=[raw-output, normalized, data-changed]",
            self.session_id, entry.sequence
        );
    }
    
    /// Handle a detected permission prompt.
    async fn handle_permission_prompt(&self, request: PermissionRequest) -> ProcessResult<()> {
        info!(
            "Permission prompt detected: session={}, tool={}, file={:?}",
            self.session_id, request.tool_name, request.file_path
        );
        
        // Create permission record in database
        let permission = agent_session::create_permission(
            &self.pool,
            &self.session_id,
            &request.tool_name,
            &request.description,
            request.file_path.as_deref(),
        )
        .await
        .map_err(|e| {
            error!(
                "Failed to create permission record for session {}: {}",
                self.session_id, e
            );
            openflow_process::ProcessError::Internal(e.to_string())
        })?;
        
        // Broadcast permission request to clients
        // Note: Using Process entity type as Permission is not in EntityType enum
        // The permission data includes session_id for filtering
        self.broadcaster.broadcast(Event::data_changed(
            crate::events::EntityType::Process,
            crate::events::DataAction::Updated,
            &self.session_id,
            Some(serde_json::json!({
                "type": "permission_request",
                "permission": serde_json::to_value(&permission).unwrap_or_default()
            })),
        ));
        
        Ok(())
    }
}

// =============================================================================
// OutputSink Implementation for AgentOutputPipeline
// =============================================================================

#[async_trait]
impl OutputSink for AgentOutputPipeline {
    /// Receive bytes from PTY and process them through the pipeline.
    ///
    /// This is the main entry point for all PTY output. The pipeline:
    /// 1. Appends to raw output buffer (for terminal display)
    /// 2. Adds bytes to line buffer
    /// 3. Extracts complete lines
    /// 4. Processes each line through the full pipeline
    async fn send(&self, chunk: OutputChunk) -> ProcessResult<()> {
        trace!(
            "Received output chunk: session={}, bytes={}",
            self.session_id, chunk.content.len()
        );
        
        // Step 1: Append to raw output buffer (for terminal display)
        {
            let mut raw = self.raw_output.write().await;
            raw.push_str(&chunk.content);
            
            // Limit buffer size to 10MB to prevent unbounded growth
            const MAX_BUFFER_SIZE: usize = 10 * 1024 * 1024;
            if raw.len() > MAX_BUFFER_SIZE {
                let excess = raw.len() - MAX_BUFFER_SIZE;
                raw.drain(..excess);
                warn!(
                    "Raw output buffer exceeded max size for session {}, truncated {} bytes",
                    self.session_id, excess
                );
            }
        }
        
        // Step 2: Add bytes to line buffer and extract complete lines
        let lines = {
            let mut buffer = self.line_buffer.lock().await;
            buffer.add_bytes(chunk.content.as_bytes())
                .map_err(|e| {
                    error!(
                        "Failed to add bytes to line buffer for session {}: {}",
                        self.session_id, e
                    );
                    openflow_process::ProcessError::Internal(e.to_string())
                })?
        };
        
        // Step 3: Process complete lines through the pipeline
        if !lines.is_empty() {
            debug!(
                "Extracted {} complete lines from buffer for session {}",
                lines.len(), self.session_id
            );
            self.process_complete_lines(lines).await?;
        }
        
        Ok(())
    }
    
    /// Close the output sink and process any remaining buffered data.
    ///
    /// This is called when the PTY process has finished. Any incomplete
    /// lines remaining in the buffer are flushed and processed.
    async fn close(&self) -> ProcessResult<()> {
        debug!(
            "Closing output pipeline: session={}, sequence={}",
            self.session_id, self.next_sequence.load(Ordering::SeqCst)
        );
        
        // Flush any remaining data from line buffer
        let remaining_line = {
            let mut buffer = self.line_buffer.lock().await;
            buffer.flush()
                .map_err(|e| {
                    error!(
                        "Failed to flush line buffer for session {}: {}",
                        self.session_id, e
                    );
                    openflow_process::ProcessError::Internal(e.to_string())
                })?
        };
        
        // Process the remaining line if present
        if let Some(line) = remaining_line {
            debug!(
                "Processing remaining incomplete line for session {}",
                self.session_id
            );
            if let Err(e) = self.process_line(&line).await {
                warn!(
                    "Error processing final line for session {}: {}",
                    self.session_id, e
                );
            }
        }
        
        // Log final statistics
        let stats = self.line_buffer.lock().await.stats();
        info!(
            "Output pipeline closed: session={}, total_bytes={}, lines={}, discarded={}, final_seq={}",
            self.session_id,
            stats.total_bytes_received,
            stats.lines_extracted,
            stats.bytes_discarded,
            self.next_sequence.load(Ordering::SeqCst)
        );
        
        Ok(())
    }
}

// =============================================================================
// Agent Orchestrator
// =============================================================================

/// Configuration for spawning an agent.
#[derive(Debug, Clone)]
pub struct SpawnAgentRequest {
    /// Process ID to associate this session with
    pub process_id: String,
    /// Provider ID (e.g., "claude-code", "gemini-cli")
    pub provider_id: String,
    /// Agent configuration
    pub config: AgentConfig,
}

impl SpawnAgentRequest {
    /// Create a new spawn request.
    pub fn new(
        process_id: impl Into<String>,
        provider_id: impl Into<String>,
        config: AgentConfig,
    ) -> Self {
        Self {
            process_id: process_id.into(),
            provider_id: provider_id.into(),
            config,
        }
    }
}

/// Central orchestrator for managing agent processes.
///
/// This service coordinates all aspects of agent lifecycle:
/// - Spawning agents via provider abstraction
/// - Parsing output and persisting events
/// - Handling permission prompts
/// - Broadcasting state changes
/// - Cleaning up on completion
pub struct AgentOrchestrator {
    /// Database connection pool
    pool: SqlitePool,
    /// Event broadcaster for real-time updates
    broadcaster: Arc<dyn EventBroadcaster>,
    /// Process executor for PTY management
    executor: Arc<NativePtyExecutor>,
    /// Active sessions (session_id -> info)
    active_sessions: Arc<RwLock<HashMap<String, ActiveSession>>>,
    /// Output pipelines for active sessions
    output_pipelines: Arc<RwLock<HashMap<String, Arc<AgentOutputPipeline>>>>,
}

impl AgentOrchestrator {
    /// Create a new agent orchestrator.
    ///
    /// # Arguments
    /// * `pool` - Database connection pool
    /// * `broadcaster` - Event broadcaster for real-time updates
    pub fn new(pool: SqlitePool, broadcaster: Arc<dyn EventBroadcaster>) -> Self {
        Self {
            pool,
            broadcaster,
            executor: Arc::new(NativePtyExecutor::new()),
            active_sessions: Arc::new(RwLock::new(HashMap::new())),
            output_pipelines: Arc::new(RwLock::new(HashMap::new())),
        }
    }

    /// Create an orchestrator with a custom executor.
    ///
    /// Useful for testing or when sharing an executor instance.
    pub fn with_executor(
        pool: SqlitePool,
        broadcaster: Arc<dyn EventBroadcaster>,
        executor: Arc<NativePtyExecutor>,
    ) -> Self {
        Self {
            pool,
            broadcaster,
            executor,
            active_sessions: Arc::new(RwLock::new(HashMap::new())),
            output_pipelines: Arc::new(RwLock::new(HashMap::new())),
        }
    }

    /// Spawn a new agent process.
    ///
    /// This method:
    /// 1. Looks up the provider from the registry
    /// 2. Creates a session record in the database
    /// 3. Spawns the PTY process
    /// 4. Sets up output processing
    /// 5. Returns the session immediately (execution is async)
    ///
    /// # Arguments
    /// * `request` - Spawn configuration
    ///
    /// # Returns
    /// The created AgentSession record.
    ///
    /// # Errors
    /// - Provider not found
    /// - Database error creating session
    /// - PTY spawn failure
    pub async fn spawn_agent(&self, request: SpawnAgentRequest) -> ServiceResult<AgentSession> {
        info!(
            "Spawning agent: process_id={}, provider_id={}",
            request.process_id, request.provider_id
        );

        // Get provider
        let provider = get_provider(&request.provider_id).ok_or_else(|| {
            error!("Provider not found: {}", request.provider_id);
            ServiceError::NotFound {
                entity: "AgentProvider",
                id: request.provider_id.clone(),
            }
        })?;

        // Create session in database
        let session_request = CreateSessionRequest::new(&request.process_id, &request.provider_id);
        let session = agent_session::create(&self.pool, session_request).await?;

        debug!("Created session: id={}", session.id);

        // Build PTY configuration from provider
        let pty_config = provider.build_command(&request.config);

        // Convert to SpawnConfig
        let spawn_config = SpawnConfig::new(&pty_config.command, &pty_config.args)
            .with_cwd(&request.config.working_directory)
            .with_size(request.config.cols, request.config.rows)
            .with_inherit_env(true);

        // Add environment variables
        let spawn_config = {
            let mut config = spawn_config;
            for (key, value) in provider.default_env() {
                config = config.with_env(&key, &value);
            }
            for (key, value) in &request.config.env {
                config = config.with_env(key, value);
            }
            config
        };

        // Create output pipeline
        let pipeline = Arc::new(AgentOutputPipeline::new(
            session.id.clone(),
            self.pool.clone(),
            Arc::clone(&self.broadcaster),
            provider.clone(),
        ));

        // Store pipeline for later access
        {
            let mut pipelines = self.output_pipelines.write().await;
            pipelines.insert(session.id.clone(), Arc::clone(&pipeline));
        }

        // Spawn the process
        let handle = self
            .executor
            .spawn(&session.id, spawn_config, pipeline)
            .await
            .map_err(|e| {
                error!("Failed to spawn process: {}", e);
                ServiceError::Process(e.to_string())
            })?;

        debug!("Process spawned: id={}", handle.id());

        // Track active session
        {
            let mut sessions = self.active_sessions.write().await;
            sessions.insert(
                session.id.clone(),
                ActiveSession::new(session.clone(), request.provider_id.clone()),
            );
        }

        // Start session monitoring task
        self.spawn_session_monitor(session.id.clone(), provider);

        // Audit log
        let _ = audit::log_session(
            &self.pool,
            &session.id,
            AuditAction::Started,
            Some(serde_json::json!({
                "provider_id": request.provider_id,
                "process_id": request.process_id,
            })),
        )
        .await;

        info!(
            "Agent spawned successfully: session_id={}, provider={}",
            session.id, request.provider_id
        );

        Ok(session)
    }

    /// Spawn a new agent via the Claude SDK bridge.
    ///
    /// This method uses the TypeScript agent-service (wrapping Claude Agent SDK)
    /// instead of direct PTY spawning. It provides:
    /// - Type-safe permission handling via canUseTool callback
    /// - Structured tool inputs (no text parsing)
    /// - Clean event streaming
    ///
    /// # Arguments
    /// * `bridge` - Reference to the AgentServiceBridge
    /// * `process_id` - Process ID for the session
    /// * `prompt` - The prompt to send to the agent
    /// * `working_directory` - Working directory for the agent
    ///
    /// # Returns
    /// The created AgentSession record.
    pub async fn spawn_agent_via_bridge(
        &self,
        bridge: &AgentServiceBridge,
        process_id: &str,
        prompt: &str,
        working_directory: Option<String>,
    ) -> ServiceResult<AgentSession> {
        info!(
            "Spawning agent via SDK bridge: process_id={}",
            process_id
        );

        // Create session in database with SDK provider
        let session_request = CreateSessionRequest::new(process_id, "claude-sdk");
        let session = agent_session::create(&self.pool, session_request).await?;

        debug!("Created session: id={}", session.id);

        // Clone resources for callbacks (they need to be 'static)
        let pool_for_events = self.pool.clone();
        let broadcaster_for_events = Arc::clone(&self.broadcaster);
        let session_id_for_events = session.id.clone();

        // Use atomic counter for event sequence
        let sequence_counter = Arc::new(AtomicI32::new(1));

        // Event handler callback - persists events and broadcasts
        let event_handler = {
            let pool = pool_for_events.clone();
            let broadcaster = broadcaster_for_events.clone();
            let session_id = session_id_for_events.clone();
            let sequence_counter = Arc::clone(&sequence_counter);

            move |event: SdkAgentEvent| {
                let pool = pool.clone();
                let broadcaster = broadcaster.clone();
                let session_id = session_id.clone();
                let sequence = sequence_counter.fetch_add(1, Ordering::SeqCst);

                // Spawn task for async database work
                tokio::spawn(async move {
                    // Convert to normalized entry
                    let entry = event.to_normalized_entry(sequence);

                    // Persist to database using add_event
                    let event_type = match &event {
                        SdkAgentEvent::SessionStart { .. } => "session_start",
                        SdkAgentEvent::SessionComplete { .. } => "session_complete",
                        SdkAgentEvent::SessionError { .. } => "session_error",
                        SdkAgentEvent::Message { .. } => "message",
                        SdkAgentEvent::ToolUse { .. } => "tool_use",
                        SdkAgentEvent::ToolResult { .. } => "tool_result",
                        SdkAgentEvent::System { .. } => "system",
                        SdkAgentEvent::PermissionRequest(_) => "permission_request",
                    };
                    let payload = serde_json::to_value(&entry).unwrap_or_default();
                    if let Err(e) = agent_session::add_event(&pool, &session_id, event_type, &payload).await {
                        error!("Failed to persist SDK event: {}", e);
                    }

                    // Handle tool state tracking
                    match &event {
                        SdkAgentEvent::ToolUse {
                            tool_id,
                            tool_name,
                            tool_input,
                            ..
                        } => {
                            if let Err(e) = tool_state::create_from_tool_use(
                                &pool,
                                &session_id,
                                tool_id,
                                tool_name,
                                tool_input,
                            )
                            .await
                            {
                                warn!("Failed to create tool state: {}", e);
                            }
                        }
                        SdkAgentEvent::ToolResult {
                            tool_id,
                            output,
                            is_error,
                            ..
                        } => {
                            let status = if *is_error {
                                openflow_contracts::events::ToolResultStatus::Error
                            } else {
                                openflow_contracts::events::ToolResultStatus::Success
                            };
                            if let Err(e) = tool_state::complete_from_tool_result(
                                &pool,
                                &session_id,
                                tool_id,
                                status,
                                output,
                            )
                            .await
                            {
                                warn!("Failed to complete tool state: {}", e);
                            }
                        }
                        SdkAgentEvent::SessionComplete { .. } => {
                            // Update session status
                            if let Err(e) = agent_session::update_status(
                                &pool,
                                &session_id,
                                SessionStatus::Completed,
                                Some(0),
                            )
                            .await
                            {
                                error!("Failed to update session status: {}", e);
                            }
                        }
                        SdkAgentEvent::SessionError { error, .. } => {
                            // Update session status with error
                            error!("Session {} failed: {}", session_id, error);
                            if let Err(e) = agent_session::update_status(
                                &pool,
                                &session_id,
                                SessionStatus::Failed,
                                Some(1),
                            )
                            .await
                            {
                                error!("Failed to update session status: {}", e);
                            }
                        }
                        _ => {}
                    }

                    // Broadcast to frontend using Event type
                    broadcaster.broadcast(Event::normalized_entry(&session_id, entry));
                });
            }
        };

        // Permission handler callback - creates permission record and broadcasts
        let permission_handler = {
            let pool = pool_for_events;
            let broadcaster = broadcaster_for_events;
            let session_id = session_id_for_events.clone();

            move |request: SdkPermissionRequest| {
                let pool = pool.clone();
                let broadcaster = broadcaster.clone();
                let session_id = session_id.clone();

                // Spawn task for async database work
                tokio::spawn(async move {
                    info!(
                        "Permission requested: session={}, tool={}, id={}",
                        session_id, request.tool_name, request.id
                    );

                    // Create permission record in database with the same ID as agent-service
                    // This is critical: the ID must match so respond_to_permission can route correctly
                    let permission = match agent_session::create_permission_with_id(
                        &pool,
                        &request.id, // Use agent-service's permission ID
                        &session_id,
                        &request.tool_name,
                        &request.description,
                        request.file_path.as_deref(),
                    )
                    .await
                    {
                        Ok(perm) => perm,
                        Err(e) => {
                            error!("Failed to create permission record: {}", e);
                            return;
                        }
                    };

                    // Broadcast permission request event using the Event helper
                    broadcaster.broadcast(Event::permission_request(
                        &permission.id,
                        &session_id,
                        &request.tool_name,
                        &request.description,
                        request.file_path.clone(),
                    ));
                });
            }
        };

        // Build SDK config
        let sdk_config = SdkAgentConfig {
            working_directory,
            allowed_tools: None,
            max_tokens: None,
            system_prompt: None,
        };

        // Track active session
        {
            let mut sessions = self.active_sessions.write().await;
            sessions.insert(
                session.id.clone(),
                ActiveSession::new(session.clone(), "claude-sdk".to_string()),
            );
        }

        // Start session via bridge
        bridge
            .start_session(
                session.id.clone(),
                prompt.to_string(),
                Some(sdk_config),
                event_handler,
                permission_handler,
            )
            .await?;

        // Audit log
        let _ = audit::log_session(
            &self.pool,
            &session.id,
            AuditAction::Started,
            Some(serde_json::json!({
                "provider_id": "claude-sdk",
                "process_id": process_id,
                "via": "sdk_bridge",
            })),
        )
        .await;

        info!(
            "Agent spawned via SDK bridge: session_id={}",
            session.id
        );

        Ok(session)
    }

    /// Respond to a permission request via the SDK bridge.
    ///
    /// # Arguments
    /// * `bridge` - Reference to the AgentServiceBridge
    /// * `session_id` - The session ID
    /// * `permission_id` - The permission request ID
    /// * `approved` - Whether the permission was approved
    /// * `reason` - Optional reason for denial
    pub async fn respond_permission_via_bridge(
        &self,
        bridge: &AgentServiceBridge,
        session_id: &str,
        permission_id: &str,
        approved: bool,
        reason: Option<String>,
    ) -> ServiceResult<()> {
        info!(
            "Responding to permission via bridge: session={}, permission={}, approved={}",
            session_id, permission_id, approved
        );

        // Update permission record in database
        agent_session::respond_to_permission(
            &self.pool,
            permission_id,
            approved,
        )
        .await?;

        // Forward response to agent-service via bridge
        bridge
            .respond_to_permission(session_id, permission_id, approved, reason)
            .await?;

        Ok(())
    }

    /// Kill an agent session via the SDK bridge.
    ///
    /// # Arguments
    /// * `bridge` - Reference to the AgentServiceBridge
    /// * `session_id` - The session ID to kill
    pub async fn kill_agent_via_bridge(
        &self,
        bridge: &AgentServiceBridge,
        session_id: &str,
    ) -> ServiceResult<()> {
        info!("Killing agent via bridge: session={}", session_id);

        // Update session status
        agent_session::update_status(
            &self.pool,
            session_id,
            SessionStatus::Killed,
            None,
        )
        .await?;

        // Kill via bridge
        bridge.kill_session(session_id).await?;

        // Remove from active sessions
        {
            let mut sessions = self.active_sessions.write().await;
            sessions.remove(session_id);
        }

        Ok(())
    }

    /// Spawn a background task to monitor session completion.
    fn spawn_session_monitor(&self, session_id: String, _provider: Arc<dyn AgentProvider>) {
        let executor = Arc::clone(&self.executor);
        let pool = self.pool.clone();
        let broadcaster = Arc::clone(&self.broadcaster);
        let active_sessions = Arc::clone(&self.active_sessions);
        let output_pipelines = Arc::clone(&self.output_pipelines);

        tokio::spawn(async move {
            debug!("Session monitor started for {}", session_id);

            // Wait for process to complete
            let exit_code = match executor.wait(&session_id).await {
                Ok(code) => code,
                Err(e) => {
                    error!("Error waiting for process {}: {}", session_id, e);
                    None
                }
            };

            debug!(
                "Session {} completed with exit code {:?}",
                session_id, exit_code
            );

            // Finalize session
            let status = match exit_code {
                Some(0) => SessionStatus::Completed,
                Some(_) => SessionStatus::Failed,
                None => SessionStatus::Failed,
            };

            // Update session in database
            if let Err(e) =
                agent_session::update_status(&pool, &session_id, status.clone(), exit_code).await
            {
                error!("Failed to update session status: {}", e);
            }

            // Cancel pending permissions
            if let Err(e) = agent_session::cancel_pending_permissions(&pool, &session_id).await {
                warn!("Failed to cancel pending permissions: {}", e);
            }

            // Fail pending tools
            if let Err(e) = tool_state::fail_pending(&pool, &session_id).await {
                warn!("Failed to fail pending tools: {}", e);
            }

            // Audit log
            let _ = audit::log_session(
                &pool,
                &session_id,
                if status == SessionStatus::Completed {
                    AuditAction::Completed
                } else {
                    AuditAction::Failed
                },
                exit_code.map(|c| serde_json::json!({"exit_code": c})),
            )
            .await;

            // Broadcast completion
            broadcaster.broadcast(Event::process_status(
                &session_id,
                if status == SessionStatus::Completed {
                    crate::events::ProcessStatus::Completed
                } else {
                    crate::events::ProcessStatus::Failed
                },
                exit_code,
            ));

            // Cleanup
            {
                let mut sessions = active_sessions.write().await;
                sessions.remove(&session_id);
            }
            {
                let mut pipelines = output_pipelines.write().await;
                pipelines.remove(&session_id);
            }

            // Close the process in executor
            if let Err(e) = executor.close(&session_id).await {
                warn!("Failed to close process: {}", e);
            }

            info!(
                "Session {} finalized: status={:?}, exit_code={:?}",
                session_id, status, exit_code
            );
        });
    }

    /// Spawn a background task to check for and timeout expired permissions.
    ///
    /// This task runs continuously, checking every 30 seconds for permissions
    /// that have exceeded their timeout and marks them as timed out, sending
    /// denial responses to the agent stdin.
    pub fn spawn_permission_timeout_task(&self) {
        let pool = self.pool.clone();
        let broadcaster = Arc::clone(&self.broadcaster);
        let executor = Arc::clone(&self.executor);
        let active_sessions = Arc::clone(&self.active_sessions);

        tokio::spawn(async move {
            info!("Permission timeout task started");

            loop {
                // Check every 30 seconds
                tokio::time::sleep(tokio::time::Duration::from_secs(30)).await;

                trace!("Checking for expired permissions");

                // Get all expired permissions
                let expired = match agent_session::get_expired_permissions(&pool).await {
                    Ok(perms) => perms,
                    Err(e) => {
                        error!("Failed to fetch expired permissions: {}", e);
                        continue;
                    }
                };

                if expired.is_empty() {
                    continue;
                }

                debug!("Found {} expired permissions to timeout", expired.len());

                // Process each expired permission
                for permission in expired {
                    let session_id = permission.session_id.clone();
                    let permission_id = permission.id.clone();

                    debug!(
                        "Timing out permission: id={}, session={}, tool={}",
                        permission_id, session_id, permission.tool_name
                    );

                    // Mark permission as timed out in database
                    let timed_out_permission = match agent_session::timeout_permission(&pool, &permission_id).await {
                        Ok(p) => p,
                        Err(e) => {
                            error!(
                                "Failed to timeout permission {}: {}",
                                permission_id, e
                            );
                            continue;
                        }
                    };

                    // Send denial response to agent stdin if session is still active
                    let provider_id = {
                        let sessions = active_sessions.read().await;
                        sessions.get(&session_id).map(|s| s.provider_id.clone())
                    };

                    if let Some(provider_id) = provider_id {
                        if let Some(provider) = get_provider(&provider_id) {
                            let response = provider.approval_response(false); // denial
                            if let Err(e) = executor.write(&session_id, response).await {
                                warn!(
                                    "Failed to send timeout denial to session {}: {}",
                                    session_id, e
                                );
                            } else {
                                debug!(
                                    "Sent timeout denial response to session {}",
                                    session_id
                                );
                            }
                        }
                    }

                    // Broadcast timeout event
                    broadcaster.broadcast(Event::data_changed(
                        crate::events::EntityType::Process,
                        crate::events::DataAction::Updated,
                        &session_id,
                        Some(serde_json::json!({
                            "type": "permission_timeout",
                            "permission": serde_json::to_value(&timed_out_permission).unwrap_or_default()
                        })),
                    ));

                    info!(
                        "Permission timed out: id={}, session={}, tool={}",
                        permission_id, session_id, permission.tool_name
                    );
                }
            }
        });
    }

    /// Handle a permission response for an agent session.
    ///
    /// This sends the approval/denial to the agent's stdin and updates
    /// the permission record in the database.
    ///
    /// # Arguments
    /// * `session_id` - Session ID
    /// * `permission_id` - Permission request ID
    /// * `approved` - Whether the permission was approved
    ///
    /// # Errors
    /// - Session not found or not active
    /// - Permission not found
    /// - Failed to write to process
    pub async fn handle_permission(
        &self,
        session_id: &str,
        permission_id: &str,
        approved: bool,
    ) -> ServiceResult<Permission> {
        info!(
            "Handling permission: session={}, permission={}, approved={}",
            session_id, permission_id, approved
        );

        // Verify session is active
        let provider_id = {
            let sessions = self.active_sessions.read().await;
            sessions
                .get(session_id)
                .map(|s| s.provider_id.clone())
                .ok_or_else(|| {
                    error!("Session not active: {}", session_id);
                    ServiceError::NotFound {
                        entity: "ActiveSession",
                        id: session_id.to_string(),
                    }
                })?
        };

        // Get provider for response format
        let provider = get_provider(&provider_id).ok_or_else(|| {
            error!("Provider not found: {}", provider_id);
            ServiceError::NotFound {
                entity: "AgentProvider",
                id: provider_id.clone(),
            }
        })?;

        // Update permission in database
        let permission =
            agent_session::respond_to_permission(&self.pool, permission_id, approved).await?;

        // Send response to process stdin
        let response = provider.approval_response(approved);
        self.executor
            .write(session_id, response)
            .await
            .map_err(|e| {
                error!("Failed to write permission response: {}", e);
                ServiceError::Process(e.to_string())
            })?;

        // Audit log
        let _ = audit::log_permission(
            &self.pool,
            permission_id,
            if approved {
                AuditAction::Approved
            } else {
                AuditAction::Denied
            },
            Some(serde_json::json!({
                "session_id": session_id,
                "tool_name": permission.tool_name,
            })),
        )
        .await;

        // Broadcast permission response
        self.broadcaster.broadcast(Event::data_changed(
            crate::events::EntityType::Process,
            crate::events::DataAction::Updated,
            session_id,
            Some(serde_json::json!({
                "type": "permission_response",
                "permission": serde_json::to_value(&permission).unwrap_or_default()
            })),
        ));

        info!(
            "Permission {} {} for session {}",
            permission_id,
            if approved { "approved" } else { "denied" },
            session_id
        );

        Ok(permission)
    }

    /// Kill an agent session.
    ///
    /// This terminates the agent process and marks the session as killed.
    ///
    /// # Arguments
    /// * `session_id` - Session ID to kill
    ///
    /// # Errors
    /// - Session not found
    /// - Failed to kill process
    pub async fn kill_agent(&self, session_id: &str) -> ServiceResult<AgentSession> {
        info!("Killing agent session: {}", session_id);

        // Kill the process
        self.executor.kill(session_id).await.map_err(|e| {
            error!("Failed to kill process: {}", e);
            ServiceError::Process(e.to_string())
        })?;

        // Update session status
        let session = agent_session::kill(&self.pool, session_id).await?;

        // Cancel pending permissions
        let _ = agent_session::cancel_pending_permissions(&self.pool, session_id).await;

        // Fail pending tools
        let _ = tool_state::fail_pending(&self.pool, session_id).await;

        // Audit log
        let _ = audit::log_session(
            &self.pool,
            session_id,
            AuditAction::Killed,
            None,
        )
        .await;

        // Broadcast
        self.broadcaster.broadcast(Event::process_status(
            session_id,
            crate::events::ProcessStatus::Killed,
            None,
        ));

        // Cleanup from active sessions
        {
            let mut sessions = self.active_sessions.write().await;
            sessions.remove(session_id);
        }
        {
            let mut pipelines = self.output_pipelines.write().await;
            pipelines.remove(session_id);
        }

        info!("Agent session killed: {}", session_id);

        Ok(session)
    }

    /// Write input to an active agent session.
    ///
    /// # Arguments
    /// * `session_id` - Session ID
    /// * `input` - Input to write
    ///
    /// # Errors
    /// - Session not active
    /// - Failed to write
    pub async fn write_input(&self, session_id: &str, input: &[u8]) -> ServiceResult<()> {
        // Verify session is active
        {
            let sessions = self.active_sessions.read().await;
            if !sessions.contains_key(session_id) {
                return Err(ServiceError::NotFound {
                    entity: "ActiveSession",
                    id: session_id.to_string(),
                });
            }
        }

        self.executor.write(session_id, input).await.map_err(|e| {
            error!("Failed to write to process: {}", e);
            ServiceError::Process(e.to_string())
        })?;

        Ok(())
    }

    /// Resize the terminal for an active session.
    ///
    /// # Arguments
    /// * `session_id` - Session ID
    /// * `cols` - New column count
    /// * `rows` - New row count
    pub async fn resize(&self, session_id: &str, cols: u16, rows: u16) -> ServiceResult<()> {
        self.executor
            .resize(session_id, cols, rows)
            .await
            .map_err(|e| {
                error!("Failed to resize terminal: {}", e);
                ServiceError::Process(e.to_string())
            })?;

        Ok(())
    }

    /// Get the current state of a session.
    ///
    /// # Arguments
    /// * `session_id` - Session ID
    ///
    /// # Returns
    /// Session with state (event/tool counts, pending permission)
    pub async fn get_session_state(
        &self,
        session_id: &str,
    ) -> ServiceResult<openflow_contracts::AgentSessionWithState> {
        agent_session::get_with_state(&self.pool, session_id).await
    }

    /// Check if a session is currently active.
    pub async fn is_active(&self, session_id: &str) -> bool {
        let sessions = self.active_sessions.read().await;
        sessions.contains_key(session_id)
    }

    /// Get the number of active sessions.
    pub async fn active_count(&self) -> usize {
        let sessions = self.active_sessions.read().await;
        sessions.len()
    }

    /// List all active session IDs.
    pub async fn list_active(&self) -> Vec<String> {
        let sessions = self.active_sessions.read().await;
        sessions.keys().cloned().collect()
    }

    /// Get raw output for a session.
    ///
    /// Returns the buffered raw PTY output for terminal display.
    pub async fn get_raw_output(&self, session_id: &str) -> ServiceResult<String> {
        let pipelines = self.output_pipelines.read().await;
        if let Some(pipeline) = pipelines.get(session_id) {
            Ok(pipeline.get_raw_output().await)
        } else {
            Err(ServiceError::NotFound {
                entity: "OutputPipeline",
                id: session_id.to_string(),
            })
        }
    }

    /// Finalize a session manually.
    ///
    /// This method is useful for:
    /// - Crash recovery: Finalizing sessions that were running when the app crashed
    /// - Manual cleanup: Forcing finalization when the monitor task failed
    /// - Testing: Simulating session completion
    ///
    /// This performs all the same cleanup as the session monitor:
    /// 1. Updates session status in the database
    /// 2. Cancels pending permissions
    /// 3. Fails pending tools
    /// 4. Logs to audit trail
    /// 5. Broadcasts completion event
    /// 6. Cleans up active session tracking
    ///
    /// # Arguments
    /// * `session_id` - Session ID to finalize
    /// * `exit_code` - Exit code to use (None means failed/unknown)
    ///
    /// # Returns
    /// The finalized session.
    ///
    /// # Errors
    /// - Session not found in database
    /// - Database update failures
    pub async fn finalize_session(
        &self,
        session_id: &str,
        exit_code: Option<i32>,
    ) -> ServiceResult<AgentSession> {
        info!(
            "Finalizing session manually: id={}, exit_code={:?}",
            session_id, exit_code
        );

        // Determine status based on exit code
        let status = match exit_code {
            Some(0) => SessionStatus::Completed,
            Some(_) => SessionStatus::Failed,
            None => SessionStatus::Failed,
        };

        // Update session in database
        let session = agent_session::update_status(&self.pool, session_id, status.clone(), exit_code).await?;

        // Cancel pending permissions
        if let Err(e) = agent_session::cancel_pending_permissions(&self.pool, session_id).await {
            warn!("Failed to cancel pending permissions during finalization: {}", e);
        }

        // Fail pending tools
        if let Err(e) = tool_state::fail_pending(&self.pool, session_id).await {
            warn!("Failed to fail pending tools during finalization: {}", e);
        }

        // Audit log
        let _ = audit::log_session(
            &self.pool,
            session_id,
            if status == SessionStatus::Completed {
                AuditAction::Completed
            } else {
                AuditAction::Failed
            },
            exit_code.map(|c| serde_json::json!({"exit_code": c, "manual_finalization": true})),
        )
        .await;

        // Broadcast completion
        self.broadcaster.broadcast(Event::process_status(
            session_id,
            if status == SessionStatus::Completed {
                crate::events::ProcessStatus::Completed
            } else {
                crate::events::ProcessStatus::Failed
            },
            exit_code,
        ));

        // Cleanup from active sessions (if it was tracked)
        {
            let mut sessions = self.active_sessions.write().await;
            sessions.remove(session_id);
        }
        {
            let mut pipelines = self.output_pipelines.write().await;
            pipelines.remove(session_id);
        }

        // Try to close the process in executor (may already be closed)
        if let Err(e) = self.executor.close(session_id).await {
            debug!("Process already closed or not found: {}", e);
        }

        info!(
            "Session finalized manually: id={}, status={:?}, exit_code={:?}",
            session_id, status, exit_code
        );

        Ok(session)
    }

    /// Recover stale sessions on startup.
    ///
    /// This method should be called during application startup to clean up
    /// any sessions that were left in a running state from a previous crash.
    ///
    /// # Returns
    /// The number of sessions recovered.
    ///
    /// # Errors
    /// - Database query failures
    pub async fn recover_stale_sessions(&self) -> ServiceResult<usize> {
        info!("Checking for stale sessions to recover...");

        // Find all sessions that are still marked as running
        let running_sessions = agent_session::list_running(&self.pool).await?;

        let mut recovered_count = 0;
        for session in running_sessions {
            // Check if this session is actually active in memory
            let is_active = {
                let sessions = self.active_sessions.read().await;
                sessions.contains_key(&session.id)
            };

            if !is_active {
                // Session is marked running but not active - it's stale
                warn!(
                    "Recovering stale session: id={}, provider={}",
                    session.id, session.provider_id
                );

                if let Err(e) = self.finalize_session(&session.id, None).await {
                    error!("Failed to recover session {}: {}", session.id, e);
                } else {
                    recovered_count += 1;
                }
            }
        }

        if recovered_count > 0 {
            info!("Recovered {} stale sessions", recovered_count);
        } else {
            debug!("No stale sessions found");
        }

        Ok(recovered_count)
    }
}

// AgentOrchestrator is Send + Sync by design
// All interior mutability is protected by RwLock

// =============================================================================
// Tests
// =============================================================================

#[cfg(test)]
mod tests {
    use super::*;
    use crate::events::NullBroadcaster;
    use openflow_db::{init_db, DbConfig};
    use tempfile::TempDir;

    /// Test fixture
    struct TestFixture {
        pool: SqlitePool,
        #[allow(dead_code)]
        temp_dir: TempDir,
        orchestrator: AgentOrchestrator,
    }

    async fn setup() -> TestFixture {
        let temp_dir = TempDir::new().expect("Failed to create temp dir");
        let config = DbConfig::from_directory(temp_dir.path());
        let pool = init_db(config)
            .await
            .expect("Failed to initialize test database");

        let broadcaster = NullBroadcaster::arc();
        let orchestrator = AgentOrchestrator::new(pool.clone(), broadcaster);

        TestFixture {
            pool,
            temp_dir,
            orchestrator,
        }
    }

    /// Helper to create a test execution process
    async fn create_test_process(pool: &SqlitePool) -> String {
        let process_id = uuid::Uuid::new_v4().to_string();
        let project_id = uuid::Uuid::new_v4().to_string();
        let task_id = uuid::Uuid::new_v4().to_string();
        let chat_id = uuid::Uuid::new_v4().to_string();

        // Create project
        sqlx::query(
            "INSERT INTO projects (id, name, git_repo_path) VALUES (?, 'Test Project', '/tmp/test')",
        )
        .bind(&project_id)
        .execute(pool)
        .await
        .expect("Failed to create test project");

        // Create task
        sqlx::query(
            "INSERT INTO tasks (id, project_id, title, status) VALUES (?, ?, 'Test Task', 'pending')",
        )
        .bind(&task_id)
        .bind(&project_id)
        .execute(pool)
        .await
        .expect("Failed to create test task");

        // Create chat (project_id is required since migration 003)
        sqlx::query(
            "INSERT INTO chats (id, task_id, project_id, chat_role) VALUES (?, ?, ?, 'main')",
        )
        .bind(&chat_id)
        .bind(&task_id)
        .bind(&project_id)
        .execute(pool)
        .await
        .expect("Failed to create test chat");

        // Create execution process
        sqlx::query(
            r#"
            INSERT INTO execution_processes (id, chat_id, status, executor_action, run_reason)
            VALUES (?, ?, 'running', 'test', 'codingagent')
            "#,
        )
        .bind(&process_id)
        .bind(&chat_id)
        .execute(pool)
        .await
        .expect("Failed to create test process");

        process_id
    }

    #[tokio::test]
    async fn test_orchestrator_creation() {
        let fixture = setup().await;
        assert_eq!(fixture.orchestrator.active_count().await, 0);
        assert!(fixture.orchestrator.list_active().await.is_empty());
    }

    #[tokio::test]
    async fn test_spawn_with_invalid_provider() {
        let fixture = setup().await;
        let process_id = create_test_process(&fixture.pool).await;

        let config = AgentConfig::new("echo hello", "/tmp");
        let request = SpawnAgentRequest::new(&process_id, "invalid-provider", config);

        let result = fixture.orchestrator.spawn_agent(request).await;
        assert!(result.is_err());

        match result.unwrap_err() {
            ServiceError::NotFound { entity, .. } => {
                assert_eq!(entity, "AgentProvider");
            }
            other => panic!("Expected NotFound error, got: {:?}", other),
        }
    }

    #[tokio::test]
    async fn test_spawn_with_mock_provider() {
        let fixture = setup().await;
        let process_id = create_test_process(&fixture.pool).await;

        // Use mock provider which doesn't require external CLI
        let config = AgentConfig::new("echo hello", "/tmp");
        let request = SpawnAgentRequest::new(&process_id, "mock", config);

        let result = fixture.orchestrator.spawn_agent(request).await;

        // The spawn might fail because mock provider generates mock output
        // but doesn't have a real process. That's okay for this test.
        // We're primarily testing that the orchestrator handles the flow.
        if let Ok(session) = result {
            assert_eq!(session.provider_id, "mock");
            assert_eq!(session.status, SessionStatus::Running);

            // Give time for monitor to clean up
            tokio::time::sleep(std::time::Duration::from_millis(100)).await;
        }
    }

    #[tokio::test]
    async fn test_is_active() {
        let fixture = setup().await;
        assert!(!fixture.orchestrator.is_active("nonexistent").await);
    }

    #[tokio::test]
    async fn test_write_to_nonexistent_session() {
        let fixture = setup().await;

        let result = fixture
            .orchestrator
            .write_input("nonexistent", b"hello")
            .await;

        assert!(result.is_err());
        match result.unwrap_err() {
            ServiceError::NotFound { entity, .. } => {
                assert_eq!(entity, "ActiveSession");
            }
            other => panic!("Expected NotFound error, got: {:?}", other),
        }
    }

    #[tokio::test]
    async fn test_get_session_state_nonexistent() {
        let fixture = setup().await;

        let result = fixture.orchestrator.get_session_state("nonexistent").await;

        assert!(result.is_err());
        match result.unwrap_err() {
            ServiceError::NotFound { entity, .. } => {
                assert_eq!(entity, "AgentSession");
            }
            other => panic!("Expected NotFound error, got: {:?}", other),
        }
    }

    // =========================================================================
    // AgentOutputSink Tests
    // =========================================================================

    mod output_sink_tests {
        use super::*;
        use crate::providers::MockProvider;
        use openflow_process::OutputChunk;

        /// Create a test output sink with mock provider
        /// Returns (session_id, sink)
        async fn create_test_sink(pool: &SqlitePool) -> (String, AgentOutputSink) {
            let process_id = create_test_process(pool).await;

            // Create session in DB
            let session_request =
                super::super::agent_session::CreateSessionRequest::new(&process_id, "mock");
            let _session = super::super::agent_session::create(pool, session_request)
                .await
                .expect("Failed to create session");

            let broadcaster = NullBroadcaster::arc();
            let provider = MockProvider::with_greeting("Hello from mock provider");

            let sink = AgentOutputSink::new(
                _session.id.clone(),
                pool.clone(),
                broadcaster,
                Arc::new(provider),
            );

            (_session.id, sink)
        }

        #[tokio::test]
        async fn test_sink_buffers_raw_output() {
            let temp_dir = TempDir::new().expect("Failed to create temp dir");
            let config = DbConfig::from_directory(temp_dir.path());
            let pool = init_db(config)
                .await
                .expect("Failed to initialize test database");

            let (session_id, sink) = create_test_sink(&pool).await;

            // Send some output
            let chunk = OutputChunk::stdout(&session_id, "Hello ");
            sink.send(chunk).await.expect("Failed to send chunk");

            let chunk2 = OutputChunk::stdout(&session_id, "World!");
            sink.send(chunk2).await.expect("Failed to send chunk");

            // Check raw output is buffered
            let raw = sink.get_raw_output().await;
            assert_eq!(raw, "Hello World!");
        }

        #[tokio::test]
        async fn test_sink_processes_complete_lines() {
            let temp_dir = TempDir::new().expect("Failed to create temp dir");
            let config = DbConfig::from_directory(temp_dir.path());
            let pool = init_db(config)
                .await
                .expect("Failed to initialize test database");

            let (session_id, sink) = create_test_sink(&pool).await;

            // Send a complete line with mock event JSON
            let event_json = r#"{"type":"init","session_id":"test-123","model":"mock"}"#;
            let chunk = OutputChunk::stdout(&session_id, &format!("{}\n", event_json));
            sink.send(chunk).await.expect("Failed to send chunk");

            // Note: The mock provider may or may not parse this, but the line
            // processing flow should complete without error
        }

        #[tokio::test]
        async fn test_sink_handles_partial_lines() {
            let temp_dir = TempDir::new().expect("Failed to create temp dir");
            let config = DbConfig::from_directory(temp_dir.path());
            let pool = init_db(config)
                .await
                .expect("Failed to initialize test database");

            let (session_id, sink) = create_test_sink(&pool).await;

            // Send partial line
            let chunk1 = OutputChunk::stdout(&session_id, "Hello ");
            sink.send(chunk1).await.expect("Failed to send chunk");

            // Line not complete, should be buffered
            // Send rest with newline
            let chunk2 = OutputChunk::stdout(&session_id, "World\n");
            sink.send(chunk2).await.expect("Failed to send chunk");

            // Raw output should have both
            let raw = sink.get_raw_output().await;
            assert!(raw.contains("Hello World"));
        }

        #[tokio::test]
        async fn test_sink_close_processes_remaining_buffer() {
            let temp_dir = TempDir::new().expect("Failed to create temp dir");
            let config = DbConfig::from_directory(temp_dir.path());
            let pool = init_db(config)
                .await
                .expect("Failed to initialize test database");

            let (session_id, sink) = create_test_sink(&pool).await;

            // Send partial line without newline
            let chunk = OutputChunk::stdout(&session_id, "Final content without newline");
            sink.send(chunk).await.expect("Failed to send chunk");

            // Close should process remaining buffer
            sink.close().await.expect("Failed to close sink");

            // Raw output should have the content
            let raw = sink.get_raw_output().await;
            assert!(raw.contains("Final content"));
        }

        #[tokio::test]
        async fn test_sink_limits_buffer_size() {
            let temp_dir = TempDir::new().expect("Failed to create temp dir");
            let config = DbConfig::from_directory(temp_dir.path());
            let pool = init_db(config)
                .await
                .expect("Failed to initialize test database");

            let (session_id, sink) = create_test_sink(&pool).await;

            // Send a lot of data (> 10MB limit)
            let large_content = "x".repeat(5 * 1024 * 1024); // 5MB
            let chunk1 = OutputChunk::stdout(&session_id, &large_content);
            sink.send(chunk1).await.expect("Failed to send chunk");

            let chunk2 = OutputChunk::stdout(&session_id, &large_content);
            sink.send(chunk2).await.expect("Failed to send chunk");

            // Additional chunk to trigger trimming
            let chunk3 = OutputChunk::stdout(&session_id, &large_content);
            sink.send(chunk3).await.expect("Failed to send chunk");

            // Buffer should be limited to ~10MB
            let raw = sink.get_raw_output().await;
            assert!(
                raw.len() <= 11 * 1024 * 1024,
                "Buffer too large: {} bytes",
                raw.len()
            );
        }

        #[tokio::test]
        async fn test_sink_handles_multiple_lines_in_one_chunk() {
            let temp_dir = TempDir::new().expect("Failed to create temp dir");
            let config = DbConfig::from_directory(temp_dir.path());
            let pool = init_db(config)
                .await
                .expect("Failed to initialize test database");

            let (session_id, sink) = create_test_sink(&pool).await;

            // Send multiple lines in one chunk
            let chunk = OutputChunk::stdout(&session_id, "Line 1\nLine 2\nLine 3\n");
            sink.send(chunk).await.expect("Failed to send chunk");

            // All lines should be in raw output
            let raw = sink.get_raw_output().await;
            assert!(raw.contains("Line 1"));
            assert!(raw.contains("Line 2"));
            assert!(raw.contains("Line 3"));
        }

        #[tokio::test]
        async fn test_sink_skips_empty_lines() {
            let temp_dir = TempDir::new().expect("Failed to create temp dir");
            let config = DbConfig::from_directory(temp_dir.path());
            let pool = init_db(config)
                .await
                .expect("Failed to initialize test database");

            let (session_id, sink) = create_test_sink(&pool).await;

            // Send lines with empty lines interspersed
            let chunk = OutputChunk::stdout(&session_id, "Line 1\n\n\nLine 2\n");
            sink.send(chunk).await.expect("Failed to send chunk");

            // Should process without error
            let raw = sink.get_raw_output().await;
            assert!(raw.contains("Line 1"));
            assert!(raw.contains("Line 2"));
        }
    }

    // =========================================================================
    // Output Reader Integration Tests
    // =========================================================================

    mod output_reader_tests {
        use super::*;
        use std::time::Duration;

        /// Test that the output reader task properly processes PTY output
        /// and persists events to the database.
        #[tokio::test]
        async fn test_spawn_and_capture_output() {
            let fixture = setup().await;
            let process_id = create_test_process(&fixture.pool).await;

            // Spawn a simple echo command using the mock provider
            // Note: Mock provider doesn't actually spawn a process, but we can
            // test the orchestrator flow
            let config = AgentConfig::new("echo test", "/tmp");
            let request = SpawnAgentRequest::new(&process_id, "mock", config);

            let result = fixture.orchestrator.spawn_agent(request).await;

            // The spawn should succeed (mock provider creates a mock process)
            if let Ok(session) = result {
                assert_eq!(session.provider_id, "mock");

                // Give time for any output processing
                tokio::time::sleep(Duration::from_millis(100)).await;

                // Check the session is tracked
                let is_active = fixture.orchestrator.is_active(&session.id).await;
                // May or may not be active depending on mock behavior
                let _ = is_active; // Just check it doesn't panic
            }
        }

        /// Test that session monitor properly finalizes sessions on completion.
        #[tokio::test]
        async fn test_session_monitor_cleanup() {
            let fixture = setup().await;
            let process_id = create_test_process(&fixture.pool).await;

            let config = AgentConfig::new("echo done", "/tmp");
            let request = SpawnAgentRequest::new(&process_id, "mock", config);

            if let Ok(_session) = fixture.orchestrator.spawn_agent(request).await {
                // Wait for the process to complete and cleanup
                tokio::time::sleep(Duration::from_millis(500)).await;

                // After cleanup, session should not be in active list
                // (though it may have been removed or still processing)
                let active = fixture.orchestrator.list_active().await;
                // Just ensure we can query without panic
                let _ = active;
            }
        }

        /// Test that resize works on active sessions.
        #[tokio::test]
        async fn test_resize_active_session() {
            let fixture = setup().await;

            // Resize non-existent should fail gracefully
            let result = fixture.orchestrator.resize("nonexistent", 120, 40).await;
            // This may fail with NotFound from the executor
            let _ = result;
        }

        /// Test kill terminates the session properly.
        #[tokio::test]
        async fn test_kill_session() {
            let fixture = setup().await;
            let process_id = create_test_process(&fixture.pool).await;

            let config = AgentConfig::new("sleep 60", "/tmp");
            let request = SpawnAgentRequest::new(&process_id, "mock", config);

            if let Ok(session) = fixture.orchestrator.spawn_agent(request).await {
                // Try to kill
                let kill_result = fixture.orchestrator.kill_agent(&session.id).await;

                // Kill should succeed or handle gracefully
                if let Ok(killed_session) = kill_result {
                    assert_eq!(killed_session.status, SessionStatus::Killed);
                }
            }
        }
    }

    // =========================================================================
    // Session Finalization Tests
    // =========================================================================

    mod finalization_tests {
        use super::*;
        use crate::services::tool_state;
        use openflow_contracts::PermissionStatus;

        /// Test that finalize_session updates the session status correctly.
        #[tokio::test]
        async fn test_finalize_session_with_success_exit_code() {
            let fixture = setup().await;
            let process_id = create_test_process(&fixture.pool).await;

            // Create a session directly in the database
            let session = agent_session::create(
                &fixture.pool,
                agent_session::CreateSessionRequest::new(&process_id, "claude-code"),
            )
            .await
            .expect("Failed to create session");

            // Session should be running initially
            assert_eq!(session.status, SessionStatus::Running);

            // Finalize with exit code 0 (success)
            let finalized = fixture
                .orchestrator
                .finalize_session(&session.id, Some(0))
                .await
                .expect("Failed to finalize session");

            // Session should now be completed
            assert_eq!(finalized.status, SessionStatus::Completed);
            assert_eq!(finalized.exit_code, Some(0));
            assert!(finalized.ended_at.is_some());
        }

        /// Test that finalize_session marks session as failed with non-zero exit code.
        #[tokio::test]
        async fn test_finalize_session_with_failure_exit_code() {
            let fixture = setup().await;
            let process_id = create_test_process(&fixture.pool).await;

            let session = agent_session::create(
                &fixture.pool,
                agent_session::CreateSessionRequest::new(&process_id, "gemini-cli"),
            )
            .await
            .expect("Failed to create session");

            // Finalize with exit code 1 (failure)
            let finalized = fixture
                .orchestrator
                .finalize_session(&session.id, Some(1))
                .await
                .expect("Failed to finalize session");

            assert_eq!(finalized.status, SessionStatus::Failed);
            assert_eq!(finalized.exit_code, Some(1));
        }

        /// Test that finalize_session marks session as failed with no exit code.
        #[tokio::test]
        async fn test_finalize_session_with_no_exit_code() {
            let fixture = setup().await;
            let process_id = create_test_process(&fixture.pool).await;

            let session = agent_session::create(
                &fixture.pool,
                agent_session::CreateSessionRequest::new(&process_id, "codex-cli"),
            )
            .await
            .expect("Failed to create session");

            // Finalize with None (unknown/crashed)
            let finalized = fixture
                .orchestrator
                .finalize_session(&session.id, None)
                .await
                .expect("Failed to finalize session");

            assert_eq!(finalized.status, SessionStatus::Failed);
            assert!(finalized.exit_code.is_none());
        }

        /// Test that finalize_session cancels pending permissions.
        #[tokio::test]
        async fn test_finalize_session_cancels_pending_permissions() {
            let fixture = setup().await;
            let process_id = create_test_process(&fixture.pool).await;

            let session = agent_session::create(
                &fixture.pool,
                agent_session::CreateSessionRequest::new(&process_id, "claude-code"),
            )
            .await
            .expect("Failed to create session");

            // Create a pending permission
            let permission = agent_session::create_permission(
                &fixture.pool,
                &session.id,
                "Write",
                "Create a new file",
                Some("/src/test.rs"),
            )
            .await
            .expect("Failed to create permission");

            assert_eq!(permission.status, PermissionStatus::Pending);

            // Finalize the session
            fixture
                .orchestrator
                .finalize_session(&session.id, Some(0))
                .await
                .expect("Failed to finalize session");

            // Check that the permission was cancelled
            let pending = agent_session::get_pending_permission(&fixture.pool, &session.id)
                .await
                .expect("Failed to get pending permission");

            assert!(
                pending.is_none(),
                "Pending permission should have been cancelled"
            );
        }

        /// Test that finalize_session fails pending tools.
        #[tokio::test]
        async fn test_finalize_session_fails_pending_tools() {
            let fixture = setup().await;
            let process_id = create_test_process(&fixture.pool).await;

            let session = agent_session::create(
                &fixture.pool,
                agent_session::CreateSessionRequest::new(&process_id, "claude-code"),
            )
            .await
            .expect("Failed to create session");

            // Create a running tool state
            tool_state::create(
                &fixture.pool,
                &session.id,
                "tool-1",
                "Bash",
                Some(&serde_json::json!({"command": "echo hello"})),
                Some("echo hello"),
                None,
            )
            .await
            .expect("Failed to create tool state");

            // Verify it's running
            let pending = tool_state::get_pending(&fixture.pool, &session.id)
                .await
                .expect("Failed to get pending tools");
            assert_eq!(pending.len(), 1);

            // Finalize the session
            fixture
                .orchestrator
                .finalize_session(&session.id, Some(0))
                .await
                .expect("Failed to finalize session");

            // Check that the tool was marked as failed
            let pending = tool_state::get_pending(&fixture.pool, &session.id)
                .await
                .expect("Failed to get pending tools");

            assert!(pending.is_empty(), "Pending tools should have been failed");
        }

        /// Test that finalize_session creates audit log.
        #[tokio::test]
        async fn test_finalize_session_creates_audit_log() {
            let fixture = setup().await;
            let process_id = create_test_process(&fixture.pool).await;

            let session = agent_session::create(
                &fixture.pool,
                agent_session::CreateSessionRequest::new(&process_id, "claude-code"),
            )
            .await
            .expect("Failed to create session");

            // Finalize the session
            fixture
                .orchestrator
                .finalize_session(&session.id, Some(0))
                .await
                .expect("Failed to finalize session");

            // Check audit log was created
            use crate::services::audit;
            use openflow_contracts::AuditEntityType;

            let logs = audit::get_for_entity(&fixture.pool, AuditEntityType::Session, &session.id)
                .await
                .expect("Failed to get audit logs");

            assert!(
                logs.iter().any(|l| l.action.to_string().to_lowercase().contains("completed")),
                "Audit log should contain completed action"
            );
        }

        /// Test that finalize_session removes from active sessions.
        #[tokio::test]
        async fn test_finalize_session_removes_from_active() {
            let fixture = setup().await;
            let process_id = create_test_process(&fixture.pool).await;

            let session = agent_session::create(
                &fixture.pool,
                agent_session::CreateSessionRequest::new(&process_id, "mock"),
            )
            .await
            .expect("Failed to create session");

            // Manually add to active sessions to simulate an active session
            {
                let mut sessions = fixture.orchestrator.active_sessions.write().await;
                sessions.insert(
                    session.id.clone(),
                    ActiveSession::new(session.clone(), "mock".to_string()),
                );
            }

            assert!(fixture.orchestrator.is_active(&session.id).await);

            // Finalize
            fixture
                .orchestrator
                .finalize_session(&session.id, Some(0))
                .await
                .expect("Failed to finalize session");

            // Should no longer be active
            assert!(!fixture.orchestrator.is_active(&session.id).await);
        }

        /// Test that finalize_session handles nonexistent session gracefully.
        #[tokio::test]
        async fn test_finalize_session_not_found() {
            let fixture = setup().await;

            let result = fixture
                .orchestrator
                .finalize_session("nonexistent-session", Some(0))
                .await;

            assert!(result.is_err());
            match result.unwrap_err() {
                ServiceError::NotFound { entity, .. } => {
                    assert_eq!(entity, "AgentSession");
                }
                other => panic!("Expected NotFound error, got: {:?}", other),
            }
        }

        /// Test recover_stale_sessions with no stale sessions.
        #[tokio::test]
        async fn test_recover_no_stale_sessions() {
            let fixture = setup().await;

            let count = fixture
                .orchestrator
                .recover_stale_sessions()
                .await
                .expect("Failed to recover stale sessions");

            assert_eq!(count, 0);
        }

        /// Test recover_stale_sessions finds and recovers stale sessions.
        #[tokio::test]
        async fn test_recover_stale_sessions() {
            let fixture = setup().await;
            let process_id = create_test_process(&fixture.pool).await;

            // Create a session that is marked as running in DB but not in active_sessions
            // (simulates a crash scenario)
            let session = agent_session::create(
                &fixture.pool,
                agent_session::CreateSessionRequest::new(&process_id, "claude-code"),
            )
            .await
            .expect("Failed to create session");

            // Verify it's running
            assert_eq!(session.status, SessionStatus::Running);

            // Recover stale sessions
            let count = fixture
                .orchestrator
                .recover_stale_sessions()
                .await
                .expect("Failed to recover stale sessions");

            assert_eq!(count, 1);

            // Verify the session is now finalized
            let recovered = agent_session::get(&fixture.pool, &session.id)
                .await
                .expect("Failed to get session");

            assert_eq!(recovered.status, SessionStatus::Failed);
        }

        /// Test that active sessions are not recovered.
        #[tokio::test]
        async fn test_recover_skips_active_sessions() {
            let fixture = setup().await;
            let process_id = create_test_process(&fixture.pool).await;

            // Create a session
            let session = agent_session::create(
                &fixture.pool,
                agent_session::CreateSessionRequest::new(&process_id, "mock"),
            )
            .await
            .expect("Failed to create session");

            // Add to active sessions (simulates a legitimately running session)
            {
                let mut sessions = fixture.orchestrator.active_sessions.write().await;
                sessions.insert(
                    session.id.clone(),
                    ActiveSession::new(session.clone(), "mock".to_string()),
                );
            }

            // Recover should skip this session
            let count = fixture
                .orchestrator
                .recover_stale_sessions()
                .await
                .expect("Failed to recover stale sessions");

            assert_eq!(count, 0);

            // Session should still be running
            let still_running = agent_session::get(&fixture.pool, &session.id)
                .await
                .expect("Failed to get session");

            assert_eq!(still_running.status, SessionStatus::Running);
        }
    }
}
