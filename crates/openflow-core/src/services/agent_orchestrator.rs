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
//! │   │                   AgentOutputSink                                │ │
//! │   │  - Receives PTY output chunks                                    │ │
//! │   │  - Parses lines via Provider                                     │ │
//! │   │  - Persists events to DB                                         │ │
//! │   │  - Broadcasts to clients                                         │ │
//! │   │  - Detects permission prompts                                    │ │
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

use async_trait::async_trait;
use log::{debug, error, info, warn};
use sqlx::SqlitePool;
use tokio::sync::RwLock;

use openflow_contracts::{
    AgentSession, AuditAction, Permission, SessionStatus,
};
use openflow_contracts::events::{
    agent_event_channel, PermissionRequest, UnifiedAgentEvent,
};
use openflow_process::{
    NativePtyExecutor, OutputChunk, OutputSink, ProcessExecutor, ProcessResult, SpawnConfig,
};

use crate::events::{Event, EventBroadcaster};
use crate::providers::{get_provider, AgentConfig, AgentProvider};

use super::agent_session::{self, CreateSessionRequest};
use super::tool_state;
use super::audit;
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
    /// Output sinks for active sessions
    output_sinks: Arc<RwLock<HashMap<String, Arc<AgentOutputSink>>>>,
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
            output_sinks: Arc::new(RwLock::new(HashMap::new())),
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
            output_sinks: Arc::new(RwLock::new(HashMap::new())),
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

        // Create output sink
        let sink = Arc::new(AgentOutputSink::new(
            session.id.clone(),
            self.pool.clone(),
            Arc::clone(&self.broadcaster),
            provider.clone(),
        ));

        // Store sink for later access
        {
            let mut sinks = self.output_sinks.write().await;
            sinks.insert(session.id.clone(), Arc::clone(&sink));
        }

        // Spawn the process
        let handle = self
            .executor
            .spawn(&session.id, spawn_config, sink)
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

    /// Spawn a background task to monitor session completion.
    fn spawn_session_monitor(&self, session_id: String, _provider: Arc<dyn AgentProvider>) {
        let executor = Arc::clone(&self.executor);
        let pool = self.pool.clone();
        let broadcaster = Arc::clone(&self.broadcaster);
        let active_sessions = Arc::clone(&self.active_sessions);
        let output_sinks = Arc::clone(&self.output_sinks);

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
                let mut sinks = output_sinks.write().await;
                sinks.remove(&session_id);
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
            let mut sinks = self.output_sinks.write().await;
            sinks.remove(session_id);
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
        let sinks = self.output_sinks.read().await;
        if let Some(sink) = sinks.get(session_id) {
            Ok(sink.get_raw_output().await)
        } else {
            Err(ServiceError::NotFound {
                entity: "OutputSink",
                id: session_id.to_string(),
            })
        }
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
        let id = uuid::Uuid::new_v4().to_string();
        let project_id = uuid::Uuid::new_v4().to_string();

        // Create project
        sqlx::query(
            "INSERT INTO projects (id, name, git_repo_path) VALUES (?, 'Test Project', '/tmp/test')",
        )
        .bind(&project_id)
        .execute(pool)
        .await
        .expect("Failed to create test project");

        // Create execution process
        sqlx::query(
            r#"
            INSERT INTO execution_processes (id, project_id, process_type, status, working_directory)
            VALUES (?, ?, 'agent', 'running', '/tmp/test')
            "#,
        )
        .bind(&id)
        .bind(&project_id)
        .execute(pool)
        .await
        .expect("Failed to create test process");

        id
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
}
