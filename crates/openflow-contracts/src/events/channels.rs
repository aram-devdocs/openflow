//! Channel Constants for Event Broadcasting
//!
//! Centralized channel naming constants and helper functions for real-time
//! event broadcasting. All event channels should be defined here to ensure
//! consistent naming across the codebase.
//!
//! # Architecture
//!
//! Events are broadcast to named channels. Clients subscribe to channels they
//! care about, and the backend broadcasts events to the appropriate channels.
//!
//! ```text
//! ┌─────────────────────────────────────────────────────────────────────────┐
//! │                         Channel Architecture                            │
//! ├─────────────────────────────────────────────────────────────────────────┤
//! │                                                                          │
//! │  Static Channels (no ID):           Dynamic Channels (with ID):         │
//! │  ┌─────────────────────┐            ┌─────────────────────────────┐     │
//! │  │ data-changed        │            │ task-progress-{task_id}     │     │
//! │  │ *  (wildcard)       │            │ step-progress-{step_id}     │     │
//! │  └─────────────────────┘            │ agent-event-{session_id}    │     │
//! │                                      │ permission-request-{sess_id}│     │
//! │                                      │ process-output-{process_id} │     │
//! │                                      │ process-status-{process_id} │     │
//! │                                      │ raw-output-{session_id}     │     │
//! │                                      │ normalized-{session_id}     │     │
//! │                                      │ execution-error-{session_id}│     │
//! │                                      │ task:{task_id}              │     │
//! │                                      │ session:{session_id}        │     │
//! │                                      └─────────────────────────────┘     │
//! │                                                                          │
//! └─────────────────────────────────────────────────────────────────────────┘
//! ```
//!
//! # Channel Naming Conventions
//!
//! - Static channels use kebab-case: `data-changed`
//! - Dynamic channels use format: `{prefix}-{id}` or `{prefix}:{id}`
//! - Colon-separated channels (`task:`, `session:`) are for entity-scoped events
//! - Hyphen-separated channels are for event-type-scoped events
//!
//! # Usage
//!
//! ```rust
//! use openflow_contracts::events::channels::{
//!     task_channel, session_channel, agent_event_channel,
//!     CHANNEL_DATA_CHANGED, CHANNEL_WILDCARD,
//! };
//!
//! // Subscribe to all events for a task
//! let channel = task_channel("task-123");
//! assert_eq!(channel, "task:task-123");
//!
//! // Subscribe to agent events for a session
//! let channel = agent_event_channel("session-456");
//! assert_eq!(channel, "agent-event-session-456");
//! ```

// =============================================================================
// Static Channel Constants
// =============================================================================

/// Channel for data changes (CRUD operations on entities)
///
/// All data mutation events are published to this channel.
/// Clients can subscribe to receive notifications when any entity changes.
pub const CHANNEL_DATA_CHANGED: &str = "data-changed";

/// Wildcard channel (subscribe to all events)
///
/// Subscribing to this channel will receive all events from all channels.
/// Use with caution in production as it can be very noisy.
pub const CHANNEL_WILDCARD: &str = "*";

// =============================================================================
// Dynamic Channel Format Constants
// =============================================================================

/// Format string for task progress channel
/// Use: `format!(CHANNEL_TASK_PROGRESS_FMT, task_id)` → `"task-progress-{task_id}"`
pub const CHANNEL_TASK_PROGRESS_FMT: &str = "task-progress-{}";

/// Format string for step progress channel
/// Use: `format!(CHANNEL_STEP_PROGRESS_FMT, step_id)` → `"step-progress-{step_id}"`
pub const CHANNEL_STEP_PROGRESS_FMT: &str = "step-progress-{}";

/// Format string for agent event channel
/// Use: `format!(CHANNEL_AGENT_EVENT_FMT, session_id)` → `"agent-event-{session_id}"`
pub const CHANNEL_AGENT_EVENT_FMT: &str = "agent-event-{}";

/// Format string for permission request channel
/// Use: `format!(CHANNEL_PERMISSION_REQUEST_FMT, session_id)` → `"permission-request-{session_id}"`
pub const CHANNEL_PERMISSION_REQUEST_FMT: &str = "permission-request-{}";

/// Format string for process output channel
/// Use: `format!(CHANNEL_PROCESS_OUTPUT_FMT, process_id)` → `"process-output-{process_id}"`
pub const CHANNEL_PROCESS_OUTPUT_FMT: &str = "process-output-{}";

/// Format string for process status channel
/// Use: `format!(CHANNEL_PROCESS_STATUS_FMT, process_id)` → `"process-status-{process_id}"`
pub const CHANNEL_PROCESS_STATUS_FMT: &str = "process-status-{}";

/// Format string for Claude event channel (legacy, use CHANNEL_AGENT_EVENT_FMT)
/// Use: `format!(CHANNEL_CLAUDE_EVENT_FMT, process_id)` → `"claude-event-{process_id}"`
pub const CHANNEL_CLAUDE_EVENT_FMT: &str = "claude-event-{}";

/// Format string for tool state channel
/// Use: `format!(CHANNEL_TOOL_STATE_FMT, process_id)` → `"tool-state-{process_id}"`
pub const CHANNEL_TOOL_STATE_FMT: &str = "tool-state-{}";

/// Format string for entity-scoped task channel
/// Use: `format!(CHANNEL_TASK_FMT, task_id)` → `"task:{task_id}"`
pub const CHANNEL_TASK_FMT: &str = "task:{}";

/// Format string for entity-scoped session channel
/// Use: `format!(CHANNEL_SESSION_FMT, session_id)` → `"session:{session_id}"`
pub const CHANNEL_SESSION_FMT: &str = "session:{}";

/// Format string for raw output channel
/// Use: `format!(CHANNEL_RAW_OUTPUT_FMT, session_id)` → `"raw-output-{session_id}"`
pub const CHANNEL_RAW_OUTPUT_FMT: &str = "raw-output-{}";

/// Format string for normalized event channel
/// Use: `format!(CHANNEL_NORMALIZED_FMT, session_id)` → `"normalized-{session_id}"`
pub const CHANNEL_NORMALIZED_FMT: &str = "normalized-{}";

/// Format string for execution error channel
/// Use: `format!(CHANNEL_EXECUTION_ERROR_FMT, session_id)` → `"execution-error-{session_id}"`
pub const CHANNEL_EXECUTION_ERROR_FMT: &str = "execution-error-{}";

// =============================================================================
// Channel Prefixes (for parsing)
// =============================================================================

/// Prefix for task progress channels
pub const PREFIX_TASK_PROGRESS: &str = "task-progress-";

/// Prefix for step progress channels
pub const PREFIX_STEP_PROGRESS: &str = "step-progress-";

/// Prefix for agent event channels
pub const PREFIX_AGENT_EVENT: &str = "agent-event-";

/// Prefix for permission request channels
pub const PREFIX_PERMISSION_REQUEST: &str = "permission-request-";

/// Prefix for process output channels
pub const PREFIX_PROCESS_OUTPUT: &str = "process-output-";

/// Prefix for process status channels
pub const PREFIX_PROCESS_STATUS: &str = "process-status-";

/// Prefix for Claude event channels (legacy)
pub const PREFIX_CLAUDE_EVENT: &str = "claude-event-";

/// Prefix for tool state channels
pub const PREFIX_TOOL_STATE: &str = "tool-state-";

/// Prefix for entity-scoped task channels
pub const PREFIX_TASK: &str = "task:";

/// Prefix for entity-scoped session channels
pub const PREFIX_SESSION: &str = "session:";

/// Prefix for raw output channels
pub const PREFIX_RAW_OUTPUT: &str = "raw-output-";

/// Prefix for normalized event channels
pub const PREFIX_NORMALIZED: &str = "normalized-";

/// Prefix for execution error channels
pub const PREFIX_EXECUTION_ERROR: &str = "execution-error-";

// =============================================================================
// Entity-Scoped Channel Helpers
// =============================================================================

/// Generate the channel name for all events related to a task
///
/// This channel receives all events for a specific task, including:
/// - Task status changes
/// - Step progress updates
/// - Agent events from task steps
///
/// # Example
/// ```
/// use openflow_contracts::events::channels::task_channel;
/// let channel = task_channel("task-123");
/// assert_eq!(channel, "task:task-123");
/// ```
pub fn task_channel(task_id: &str) -> String {
    format!("task:{}", task_id)
}

/// Parse a task ID from an entity-scoped task channel name
///
/// # Example
/// ```
/// use openflow_contracts::events::channels::parse_task_channel;
/// let id = parse_task_channel("task:task-123");
/// assert_eq!(id, Some("task-123".to_string()));
/// ```
pub fn parse_task_channel(channel: &str) -> Option<String> {
    channel.strip_prefix(PREFIX_TASK).map(|s| s.to_string())
}

/// Generate the channel name for all events related to a session
///
/// This channel receives all events for a specific agent session, including:
/// - Agent messages
/// - Tool use/results
/// - Permission requests
/// - Session completion
///
/// # Example
/// ```
/// use openflow_contracts::events::channels::session_channel;
/// let channel = session_channel("session-456");
/// assert_eq!(channel, "session:session-456");
/// ```
pub fn session_channel(session_id: &str) -> String {
    format!("session:{}", session_id)
}

/// Parse a session ID from an entity-scoped session channel name
///
/// # Example
/// ```
/// use openflow_contracts::events::channels::parse_session_channel;
/// let id = parse_session_channel("session:session-456");
/// assert_eq!(id, Some("session-456".to_string()));
/// ```
pub fn parse_session_channel(channel: &str) -> Option<String> {
    channel.strip_prefix(PREFIX_SESSION).map(|s| s.to_string())
}

// =============================================================================
// Task Progress Channel Helpers
// =============================================================================

/// Generate the channel name for task progress events
///
/// # Example
/// ```
/// use openflow_contracts::events::channels::task_progress_channel;
/// let channel = task_progress_channel("task-123");
/// assert_eq!(channel, "task-progress-task-123");
/// ```
pub fn task_progress_channel(task_id: &str) -> String {
    format!("task-progress-{}", task_id)
}

/// Parse a task ID from a task progress channel name
///
/// # Example
/// ```
/// use openflow_contracts::events::channels::parse_task_progress_channel;
/// let id = parse_task_progress_channel("task-progress-task-123");
/// assert_eq!(id, Some("task-123".to_string()));
/// ```
pub fn parse_task_progress_channel(channel: &str) -> Option<String> {
    channel
        .strip_prefix(PREFIX_TASK_PROGRESS)
        .map(|s| s.to_string())
}

// =============================================================================
// Step Progress Channel Helpers
// =============================================================================

/// Generate the channel name for step progress events
///
/// # Example
/// ```
/// use openflow_contracts::events::channels::step_progress_channel;
/// let channel = step_progress_channel("step-456");
/// assert_eq!(channel, "step-progress-step-456");
/// ```
pub fn step_progress_channel(step_id: &str) -> String {
    format!("step-progress-{}", step_id)
}

/// Parse a step ID from a step progress channel name
///
/// # Example
/// ```
/// use openflow_contracts::events::channels::parse_step_progress_channel;
/// let id = parse_step_progress_channel("step-progress-step-456");
/// assert_eq!(id, Some("step-456".to_string()));
/// ```
pub fn parse_step_progress_channel(channel: &str) -> Option<String> {
    channel
        .strip_prefix(PREFIX_STEP_PROGRESS)
        .map(|s| s.to_string())
}

// =============================================================================
// Agent Event Channel Helpers
// =============================================================================

/// Generate the channel name for agent events
///
/// # Example
/// ```
/// use openflow_contracts::events::channels::agent_event_channel;
/// let channel = agent_event_channel("session-abc-123");
/// assert_eq!(channel, "agent-event-session-abc-123");
/// ```
pub fn agent_event_channel(session_id: &str) -> String {
    format!("agent-event-{}", session_id)
}

/// Parse a session ID from an agent event channel name
///
/// # Example
/// ```
/// use openflow_contracts::events::channels::parse_agent_event_channel;
/// let id = parse_agent_event_channel("agent-event-session-abc-123");
/// assert_eq!(id, Some("session-abc-123".to_string()));
/// ```
pub fn parse_agent_event_channel(channel: &str) -> Option<String> {
    channel
        .strip_prefix(PREFIX_AGENT_EVENT)
        .map(|s| s.to_string())
}

// =============================================================================
// Permission Request Channel Helpers
// =============================================================================

/// Generate the channel name for permission request events
///
/// # Example
/// ```
/// use openflow_contracts::events::channels::permission_request_channel;
/// let channel = permission_request_channel("sess-789");
/// assert_eq!(channel, "permission-request-sess-789");
/// ```
pub fn permission_request_channel(session_id: &str) -> String {
    format!("permission-request-{}", session_id)
}

/// Parse a session ID from a permission request channel name
///
/// # Example
/// ```
/// use openflow_contracts::events::channels::parse_permission_request_channel;
/// let id = parse_permission_request_channel("permission-request-sess-789");
/// assert_eq!(id, Some("sess-789".to_string()));
/// ```
pub fn parse_permission_request_channel(channel: &str) -> Option<String> {
    channel
        .strip_prefix(PREFIX_PERMISSION_REQUEST)
        .map(|s| s.to_string())
}

// =============================================================================
// Process Output Channel Helpers
// =============================================================================

/// Generate the channel name for process output events
///
/// # Example
/// ```
/// use openflow_contracts::events::channels::process_output_channel;
/// let channel = process_output_channel("abc-123");
/// assert_eq!(channel, "process-output-abc-123");
/// ```
pub fn process_output_channel(process_id: &str) -> String {
    format!("process-output-{}", process_id)
}

/// Parse a process ID from a process output channel name
///
/// # Example
/// ```
/// use openflow_contracts::events::channels::parse_process_output_channel;
/// let id = parse_process_output_channel("process-output-abc-123");
/// assert_eq!(id, Some("abc-123".to_string()));
/// ```
pub fn parse_process_output_channel(channel: &str) -> Option<String> {
    channel
        .strip_prefix(PREFIX_PROCESS_OUTPUT)
        .map(|s| s.to_string())
}

// =============================================================================
// Process Status Channel Helpers
// =============================================================================

/// Generate the channel name for process status events
///
/// # Example
/// ```
/// use openflow_contracts::events::channels::process_status_channel;
/// let channel = process_status_channel("abc-123");
/// assert_eq!(channel, "process-status-abc-123");
/// ```
pub fn process_status_channel(process_id: &str) -> String {
    format!("process-status-{}", process_id)
}

/// Parse a process ID from a process status channel name
///
/// # Example
/// ```
/// use openflow_contracts::events::channels::parse_process_status_channel;
/// let id = parse_process_status_channel("process-status-abc-123");
/// assert_eq!(id, Some("abc-123".to_string()));
/// ```
pub fn parse_process_status_channel(channel: &str) -> Option<String> {
    channel
        .strip_prefix(PREFIX_PROCESS_STATUS)
        .map(|s| s.to_string())
}

// =============================================================================
// Claude Event Channel Helpers (Legacy)
// =============================================================================

/// Generate the channel name for Claude event messages
///
/// **Note**: This is a legacy channel. New code should use `agent_event_channel`.
///
/// # Example
/// ```
/// use openflow_contracts::events::channels::claude_event_channel;
/// let channel = claude_event_channel("abc-123");
/// assert_eq!(channel, "claude-event-abc-123");
/// ```
pub fn claude_event_channel(process_id: &str) -> String {
    format!("claude-event-{}", process_id)
}

/// Parse a process ID from a Claude event channel name
///
/// # Example
/// ```
/// use openflow_contracts::events::channels::parse_claude_event_channel;
/// let id = parse_claude_event_channel("claude-event-abc-123");
/// assert_eq!(id, Some("abc-123".to_string()));
/// ```
pub fn parse_claude_event_channel(channel: &str) -> Option<String> {
    channel
        .strip_prefix(PREFIX_CLAUDE_EVENT)
        .map(|s| s.to_string())
}

// =============================================================================
// Tool State Channel Helpers
// =============================================================================

/// Generate the channel name for tool state events
///
/// # Example
/// ```
/// use openflow_contracts::events::channels::tool_state_channel;
/// let channel = tool_state_channel("abc-123");
/// assert_eq!(channel, "tool-state-abc-123");
/// ```
pub fn tool_state_channel(process_id: &str) -> String {
    format!("tool-state-{}", process_id)
}

/// Parse a process ID from a tool state channel name
///
/// # Example
/// ```
/// use openflow_contracts::events::channels::parse_tool_state_channel;
/// let id = parse_tool_state_channel("tool-state-abc-123");
/// assert_eq!(id, Some("abc-123".to_string()));
/// ```
pub fn parse_tool_state_channel(channel: &str) -> Option<String> {
    channel
        .strip_prefix(PREFIX_TOOL_STATE)
        .map(|s| s.to_string())
}

// =============================================================================
// Raw Output Channel Helpers
// =============================================================================

/// Generate the channel name for raw output events
///
/// This channel receives raw, unparsed output from the agent process,
/// suitable for terminal display.
///
/// # Example
/// ```
/// use openflow_contracts::events::channels::raw_output_channel;
/// let channel = raw_output_channel("session-abc");
/// assert_eq!(channel, "raw-output-session-abc");
/// ```
pub fn raw_output_channel(session_id: &str) -> String {
    format!("raw-output-{}", session_id)
}

/// Parse a session ID from a raw output channel name
///
/// # Example
/// ```
/// use openflow_contracts::events::channels::parse_raw_output_channel;
/// let id = parse_raw_output_channel("raw-output-session-abc");
/// assert_eq!(id, Some("session-abc".to_string()));
/// ```
pub fn parse_raw_output_channel(channel: &str) -> Option<String> {
    channel
        .strip_prefix(PREFIX_RAW_OUTPUT)
        .map(|s| s.to_string())
}

// =============================================================================
// Normalized Event Channel Helpers
// =============================================================================

/// Generate the channel name for normalized event stream
///
/// This channel receives parsed and normalized events from the agent,
/// suitable for UI rendering and business logic.
///
/// # Example
/// ```
/// use openflow_contracts::events::channels::normalized_channel;
/// let channel = normalized_channel("session-xyz");
/// assert_eq!(channel, "normalized-session-xyz");
/// ```
pub fn normalized_channel(session_id: &str) -> String {
    format!("normalized-{}", session_id)
}

/// Parse a session ID from a normalized event channel name
///
/// # Example
/// ```
/// use openflow_contracts::events::channels::parse_normalized_channel;
/// let id = parse_normalized_channel("normalized-session-xyz");
/// assert_eq!(id, Some("session-xyz".to_string()));
/// ```
pub fn parse_normalized_channel(channel: &str) -> Option<String> {
    channel
        .strip_prefix(PREFIX_NORMALIZED)
        .map(|s| s.to_string())
}

// =============================================================================
// Execution Error Channel Helpers
// =============================================================================

/// Generate the channel name for execution error events
///
/// This channel receives structured error events that occur during
/// agent execution.
///
/// # Example
/// ```
/// use openflow_contracts::events::channels::execution_error_channel;
/// let channel = execution_error_channel("session-123");
/// assert_eq!(channel, "execution-error-session-123");
/// ```
pub fn execution_error_channel(session_id: &str) -> String {
    format!("execution-error-{}", session_id)
}

/// Parse a session ID from an execution error channel name
///
/// # Example
/// ```
/// use openflow_contracts::events::channels::parse_execution_error_channel;
/// let id = parse_execution_error_channel("execution-error-session-123");
/// assert_eq!(id, Some("session-123".to_string()));
/// ```
pub fn parse_execution_error_channel(channel: &str) -> Option<String> {
    channel
        .strip_prefix(PREFIX_EXECUTION_ERROR)
        .map(|s| s.to_string())
}

// =============================================================================
// Channel Type Detection
// =============================================================================

/// Type of channel based on its name
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum ChannelType {
    /// Data changed channel
    DataChanged,
    /// Wildcard channel
    Wildcard,
    /// Task progress channel with task ID
    TaskProgress(String),
    /// Step progress channel with step ID
    StepProgress(String),
    /// Agent event channel with session ID
    AgentEvent(String),
    /// Permission request channel with session ID
    PermissionRequest(String),
    /// Process output channel with process ID
    ProcessOutput(String),
    /// Process status channel with process ID
    ProcessStatus(String),
    /// Claude event channel with process ID (legacy)
    ClaudeEvent(String),
    /// Tool state channel with process ID
    ToolState(String),
    /// Entity-scoped task channel with task ID
    Task(String),
    /// Entity-scoped session channel with session ID
    Session(String),
    /// Raw output channel with session ID
    RawOutput(String),
    /// Normalized event channel with session ID
    Normalized(String),
    /// Execution error channel with session ID
    ExecutionError(String),
    /// Unknown channel type
    Unknown(String),
}

impl ChannelType {
    /// Parse a channel name into its type
    ///
    /// # Example
    /// ```
    /// use openflow_contracts::events::channels::ChannelType;
    ///
    /// let channel_type = ChannelType::parse("task-progress-123");
    /// assert_eq!(channel_type, ChannelType::TaskProgress("123".to_string()));
    ///
    /// let channel_type = ChannelType::parse("data-changed");
    /// assert_eq!(channel_type, ChannelType::DataChanged);
    /// ```
    pub fn parse(channel: &str) -> Self {
        if channel == CHANNEL_DATA_CHANGED {
            return ChannelType::DataChanged;
        }
        if channel == CHANNEL_WILDCARD {
            return ChannelType::Wildcard;
        }

        // Check entity-scoped channels first (use colon separator)
        if let Some(id) = parse_task_channel(channel) {
            return ChannelType::Task(id);
        }
        if let Some(id) = parse_session_channel(channel) {
            return ChannelType::Session(id);
        }

        // Check event-type channels (use hyphen separator)
        if let Some(id) = parse_task_progress_channel(channel) {
            return ChannelType::TaskProgress(id);
        }
        if let Some(id) = parse_step_progress_channel(channel) {
            return ChannelType::StepProgress(id);
        }
        if let Some(id) = parse_agent_event_channel(channel) {
            return ChannelType::AgentEvent(id);
        }
        if let Some(id) = parse_permission_request_channel(channel) {
            return ChannelType::PermissionRequest(id);
        }
        if let Some(id) = parse_process_output_channel(channel) {
            return ChannelType::ProcessOutput(id);
        }
        if let Some(id) = parse_process_status_channel(channel) {
            return ChannelType::ProcessStatus(id);
        }
        if let Some(id) = parse_claude_event_channel(channel) {
            return ChannelType::ClaudeEvent(id);
        }
        if let Some(id) = parse_tool_state_channel(channel) {
            return ChannelType::ToolState(id);
        }
        if let Some(id) = parse_raw_output_channel(channel) {
            return ChannelType::RawOutput(id);
        }
        if let Some(id) = parse_normalized_channel(channel) {
            return ChannelType::Normalized(id);
        }
        if let Some(id) = parse_execution_error_channel(channel) {
            return ChannelType::ExecutionError(id);
        }

        ChannelType::Unknown(channel.to_string())
    }

    /// Get the ID from the channel type, if it has one
    pub fn id(&self) -> Option<&str> {
        match self {
            ChannelType::TaskProgress(id)
            | ChannelType::StepProgress(id)
            | ChannelType::AgentEvent(id)
            | ChannelType::PermissionRequest(id)
            | ChannelType::ProcessOutput(id)
            | ChannelType::ProcessStatus(id)
            | ChannelType::ClaudeEvent(id)
            | ChannelType::ToolState(id)
            | ChannelType::Task(id)
            | ChannelType::Session(id)
            | ChannelType::RawOutput(id)
            | ChannelType::Normalized(id)
            | ChannelType::ExecutionError(id)
            | ChannelType::Unknown(id) => Some(id),
            ChannelType::DataChanged | ChannelType::Wildcard => None,
        }
    }

    /// Check if this is a static channel (no ID)
    pub fn is_static(&self) -> bool {
        matches!(self, ChannelType::DataChanged | ChannelType::Wildcard)
    }

    /// Check if this is an entity-scoped channel
    pub fn is_entity_scoped(&self) -> bool {
        matches!(self, ChannelType::Task(_) | ChannelType::Session(_))
    }

    /// Check if this is an event-type channel
    pub fn is_event_type(&self) -> bool {
        matches!(
            self,
            ChannelType::TaskProgress(_)
                | ChannelType::StepProgress(_)
                | ChannelType::AgentEvent(_)
                | ChannelType::PermissionRequest(_)
                | ChannelType::ProcessOutput(_)
                | ChannelType::ProcessStatus(_)
                | ChannelType::ClaudeEvent(_)
                | ChannelType::ToolState(_)
                | ChannelType::RawOutput(_)
                | ChannelType::Normalized(_)
                | ChannelType::ExecutionError(_)
        )
    }
}

// =============================================================================
// Tests
// =============================================================================

#[cfg(test)]
mod tests {
    use super::*;

    // =========================================================================
    // Static Channel Tests
    // =========================================================================

    #[test]
    fn test_static_channel_constants() {
        assert_eq!(CHANNEL_DATA_CHANGED, "data-changed");
        assert_eq!(CHANNEL_WILDCARD, "*");
    }

    // =========================================================================
    // Entity-Scoped Channel Tests
    // =========================================================================

    #[test]
    fn test_task_channel() {
        assert_eq!(task_channel("task-123"), "task:task-123");
        assert_eq!(task_channel("abc"), "task:abc");
    }

    #[test]
    fn test_parse_task_channel() {
        assert_eq!(
            parse_task_channel("task:task-123"),
            Some("task-123".to_string())
        );
        assert_eq!(parse_task_channel("task:abc"), Some("abc".to_string()));
        assert_eq!(parse_task_channel("task-progress-123"), None);
        assert_eq!(parse_task_channel("invalid"), None);
    }

    #[test]
    fn test_session_channel() {
        assert_eq!(session_channel("session-456"), "session:session-456");
        assert_eq!(session_channel("xyz"), "session:xyz");
    }

    #[test]
    fn test_parse_session_channel() {
        assert_eq!(
            parse_session_channel("session:session-456"),
            Some("session-456".to_string())
        );
        assert_eq!(parse_session_channel("session:xyz"), Some("xyz".to_string()));
        assert_eq!(parse_session_channel("agent-event-123"), None);
        assert_eq!(parse_session_channel("invalid"), None);
    }

    // =========================================================================
    // Task Progress Channel Tests
    // =========================================================================

    #[test]
    fn test_task_progress_channel() {
        assert_eq!(
            task_progress_channel("task-123"),
            "task-progress-task-123"
        );
    }

    #[test]
    fn test_parse_task_progress_channel() {
        assert_eq!(
            parse_task_progress_channel("task-progress-task-123"),
            Some("task-123".to_string())
        );
        assert_eq!(parse_task_progress_channel("other-channel"), None);
    }

    // =========================================================================
    // Step Progress Channel Tests
    // =========================================================================

    #[test]
    fn test_step_progress_channel() {
        assert_eq!(step_progress_channel("step-456"), "step-progress-step-456");
    }

    #[test]
    fn test_parse_step_progress_channel() {
        assert_eq!(
            parse_step_progress_channel("step-progress-step-456"),
            Some("step-456".to_string())
        );
        assert_eq!(parse_step_progress_channel("invalid"), None);
    }

    // =========================================================================
    // Agent Event Channel Tests
    // =========================================================================

    #[test]
    fn test_agent_event_channel() {
        assert_eq!(
            agent_event_channel("session-abc-123"),
            "agent-event-session-abc-123"
        );
    }

    #[test]
    fn test_parse_agent_event_channel() {
        assert_eq!(
            parse_agent_event_channel("agent-event-session-abc-123"),
            Some("session-abc-123".to_string())
        );
        assert_eq!(parse_agent_event_channel("process-output-abc-123"), None);
        assert_eq!(parse_agent_event_channel("invalid"), None);
    }

    // =========================================================================
    // Permission Request Channel Tests
    // =========================================================================

    #[test]
    fn test_permission_request_channel() {
        assert_eq!(
            permission_request_channel("sess-789"),
            "permission-request-sess-789"
        );
    }

    #[test]
    fn test_parse_permission_request_channel() {
        assert_eq!(
            parse_permission_request_channel("permission-request-sess-789"),
            Some("sess-789".to_string())
        );
        assert_eq!(parse_permission_request_channel("wrong"), None);
    }

    // =========================================================================
    // Process Output Channel Tests
    // =========================================================================

    #[test]
    fn test_process_output_channel() {
        assert_eq!(process_output_channel("abc-123"), "process-output-abc-123");
    }

    #[test]
    fn test_parse_process_output_channel() {
        assert_eq!(
            parse_process_output_channel("process-output-abc-123"),
            Some("abc-123".to_string())
        );
        assert_eq!(parse_process_output_channel("process-status-abc-123"), None);
        assert_eq!(parse_process_output_channel("invalid"), None);
    }

    // =========================================================================
    // Process Status Channel Tests
    // =========================================================================

    #[test]
    fn test_process_status_channel() {
        assert_eq!(process_status_channel("abc-123"), "process-status-abc-123");
    }

    #[test]
    fn test_parse_process_status_channel() {
        assert_eq!(
            parse_process_status_channel("process-status-abc-123"),
            Some("abc-123".to_string())
        );
        assert_eq!(parse_process_status_channel("process-output-abc-123"), None);
        assert_eq!(parse_process_status_channel("invalid"), None);
    }

    // =========================================================================
    // Claude Event Channel Tests (Legacy)
    // =========================================================================

    #[test]
    fn test_claude_event_channel() {
        assert_eq!(claude_event_channel("abc-123"), "claude-event-abc-123");
    }

    #[test]
    fn test_parse_claude_event_channel() {
        assert_eq!(
            parse_claude_event_channel("claude-event-abc-123"),
            Some("abc-123".to_string())
        );
        assert_eq!(parse_claude_event_channel("invalid"), None);
    }

    // =========================================================================
    // Tool State Channel Tests
    // =========================================================================

    #[test]
    fn test_tool_state_channel() {
        assert_eq!(tool_state_channel("abc-123"), "tool-state-abc-123");
    }

    #[test]
    fn test_parse_tool_state_channel() {
        assert_eq!(
            parse_tool_state_channel("tool-state-abc-123"),
            Some("abc-123".to_string())
        );
        assert_eq!(parse_tool_state_channel("invalid"), None);
    }

    // =========================================================================
    // ChannelType Tests
    // =========================================================================

    #[test]
    fn test_channel_type_parse_static() {
        assert_eq!(ChannelType::parse("data-changed"), ChannelType::DataChanged);
        assert_eq!(ChannelType::parse("*"), ChannelType::Wildcard);
    }

    #[test]
    fn test_channel_type_parse_entity_scoped() {
        assert_eq!(
            ChannelType::parse("task:task-123"),
            ChannelType::Task("task-123".to_string())
        );
        assert_eq!(
            ChannelType::parse("session:sess-456"),
            ChannelType::Session("sess-456".to_string())
        );
    }

    #[test]
    fn test_channel_type_parse_event_type() {
        assert_eq!(
            ChannelType::parse("task-progress-123"),
            ChannelType::TaskProgress("123".to_string())
        );
        assert_eq!(
            ChannelType::parse("step-progress-456"),
            ChannelType::StepProgress("456".to_string())
        );
        assert_eq!(
            ChannelType::parse("agent-event-sess-789"),
            ChannelType::AgentEvent("sess-789".to_string())
        );
        assert_eq!(
            ChannelType::parse("permission-request-sess-abc"),
            ChannelType::PermissionRequest("sess-abc".to_string())
        );
        assert_eq!(
            ChannelType::parse("process-output-proc-123"),
            ChannelType::ProcessOutput("proc-123".to_string())
        );
        assert_eq!(
            ChannelType::parse("process-status-proc-456"),
            ChannelType::ProcessStatus("proc-456".to_string())
        );
        assert_eq!(
            ChannelType::parse("claude-event-proc-789"),
            ChannelType::ClaudeEvent("proc-789".to_string())
        );
        assert_eq!(
            ChannelType::parse("tool-state-proc-abc"),
            ChannelType::ToolState("proc-abc".to_string())
        );
    }

    #[test]
    fn test_channel_type_parse_unknown() {
        assert_eq!(
            ChannelType::parse("some-random-channel"),
            ChannelType::Unknown("some-random-channel".to_string())
        );
    }

    #[test]
    fn test_channel_type_id() {
        assert_eq!(ChannelType::DataChanged.id(), None);
        assert_eq!(ChannelType::Wildcard.id(), None);
        assert_eq!(
            ChannelType::TaskProgress("123".to_string()).id(),
            Some("123")
        );
        assert_eq!(ChannelType::Task("task-abc".to_string()).id(), Some("task-abc"));
    }

    #[test]
    fn test_channel_type_is_static() {
        assert!(ChannelType::DataChanged.is_static());
        assert!(ChannelType::Wildcard.is_static());
        assert!(!ChannelType::TaskProgress("123".to_string()).is_static());
        assert!(!ChannelType::Task("abc".to_string()).is_static());
    }

    #[test]
    fn test_channel_type_is_entity_scoped() {
        assert!(ChannelType::Task("abc".to_string()).is_entity_scoped());
        assert!(ChannelType::Session("xyz".to_string()).is_entity_scoped());
        assert!(!ChannelType::DataChanged.is_entity_scoped());
        assert!(!ChannelType::TaskProgress("123".to_string()).is_entity_scoped());
    }

    #[test]
    fn test_channel_type_is_event_type() {
        assert!(ChannelType::TaskProgress("123".to_string()).is_event_type());
        assert!(ChannelType::StepProgress("456".to_string()).is_event_type());
        assert!(ChannelType::AgentEvent("789".to_string()).is_event_type());
        assert!(!ChannelType::DataChanged.is_event_type());
        assert!(!ChannelType::Task("abc".to_string()).is_event_type());
    }

    // =========================================================================
    // Format Constant Tests
    // =========================================================================

    #[test]
    fn test_format_constants() {
        assert_eq!(
            format!("{}", CHANNEL_TASK_PROGRESS_FMT).replace("{}", "123"),
            "task-progress-123"
        );
        assert_eq!(
            format!("{}", CHANNEL_STEP_PROGRESS_FMT).replace("{}", "456"),
            "step-progress-456"
        );
        assert_eq!(
            format!("{}", CHANNEL_AGENT_EVENT_FMT).replace("{}", "sess"),
            "agent-event-sess"
        );
    }

    // =========================================================================
    // Prefix Constant Tests
    // =========================================================================

    #[test]
    fn test_prefix_constants() {
        assert_eq!(PREFIX_TASK_PROGRESS, "task-progress-");
        assert_eq!(PREFIX_STEP_PROGRESS, "step-progress-");
        assert_eq!(PREFIX_AGENT_EVENT, "agent-event-");
        assert_eq!(PREFIX_PERMISSION_REQUEST, "permission-request-");
        assert_eq!(PREFIX_PROCESS_OUTPUT, "process-output-");
        assert_eq!(PREFIX_PROCESS_STATUS, "process-status-");
        assert_eq!(PREFIX_CLAUDE_EVENT, "claude-event-");
        assert_eq!(PREFIX_TOOL_STATE, "tool-state-");
        assert_eq!(PREFIX_TASK, "task:");
        assert_eq!(PREFIX_SESSION, "session:");
        assert_eq!(PREFIX_RAW_OUTPUT, "raw-output-");
        assert_eq!(PREFIX_NORMALIZED, "normalized-");
        assert_eq!(PREFIX_EXECUTION_ERROR, "execution-error-");
    }

    // =========================================================================
    // Raw Output Channel Tests
    // =========================================================================

    #[test]
    fn test_raw_output_channel() {
        assert_eq!(raw_output_channel("session-abc"), "raw-output-session-abc");
        assert_eq!(raw_output_channel("xyz-123"), "raw-output-xyz-123");
    }

    #[test]
    fn test_parse_raw_output_channel() {
        assert_eq!(
            parse_raw_output_channel("raw-output-session-abc"),
            Some("session-abc".to_string())
        );
        assert_eq!(
            parse_raw_output_channel("raw-output-xyz-123"),
            Some("xyz-123".to_string())
        );
        assert_eq!(parse_raw_output_channel("normalized-abc"), None);
        assert_eq!(parse_raw_output_channel("invalid"), None);
    }

    // =========================================================================
    // Normalized Event Channel Tests
    // =========================================================================

    #[test]
    fn test_normalized_channel() {
        assert_eq!(normalized_channel("session-xyz"), "normalized-session-xyz");
        assert_eq!(normalized_channel("abc-456"), "normalized-abc-456");
    }

    #[test]
    fn test_parse_normalized_channel() {
        assert_eq!(
            parse_normalized_channel("normalized-session-xyz"),
            Some("session-xyz".to_string())
        );
        assert_eq!(
            parse_normalized_channel("normalized-abc-456"),
            Some("abc-456".to_string())
        );
        assert_eq!(parse_normalized_channel("raw-output-xyz"), None);
        assert_eq!(parse_normalized_channel("invalid"), None);
    }

    // =========================================================================
    // Execution Error Channel Tests
    // =========================================================================

    #[test]
    fn test_execution_error_channel() {
        assert_eq!(
            execution_error_channel("session-123"),
            "execution-error-session-123"
        );
        assert_eq!(execution_error_channel("err-789"), "execution-error-err-789");
    }

    #[test]
    fn test_parse_execution_error_channel() {
        assert_eq!(
            parse_execution_error_channel("execution-error-session-123"),
            Some("session-123".to_string())
        );
        assert_eq!(
            parse_execution_error_channel("execution-error-err-789"),
            Some("err-789".to_string())
        );
        assert_eq!(parse_execution_error_channel("normalized-123"), None);
        assert_eq!(parse_execution_error_channel("invalid"), None);
    }

    // =========================================================================
    // New ChannelType Tests
    // =========================================================================

    #[test]
    fn test_channel_type_parse_new_channels() {
        assert_eq!(
            ChannelType::parse("raw-output-sess-abc"),
            ChannelType::RawOutput("sess-abc".to_string())
        );
        assert_eq!(
            ChannelType::parse("normalized-sess-xyz"),
            ChannelType::Normalized("sess-xyz".to_string())
        );
        assert_eq!(
            ChannelType::parse("execution-error-sess-123"),
            ChannelType::ExecutionError("sess-123".to_string())
        );
    }

    #[test]
    fn test_channel_type_is_event_type_new_channels() {
        assert!(ChannelType::RawOutput("abc".to_string()).is_event_type());
        assert!(ChannelType::Normalized("xyz".to_string()).is_event_type());
        assert!(ChannelType::ExecutionError("123".to_string()).is_event_type());
    }

    #[test]
    fn test_channel_type_id_new_channels() {
        assert_eq!(
            ChannelType::RawOutput("sess-abc".to_string()).id(),
            Some("sess-abc")
        );
        assert_eq!(
            ChannelType::Normalized("sess-xyz".to_string()).id(),
            Some("sess-xyz")
        );
        assert_eq!(
            ChannelType::ExecutionError("sess-123".to_string()).id(),
            Some("sess-123")
        );
    }
}
