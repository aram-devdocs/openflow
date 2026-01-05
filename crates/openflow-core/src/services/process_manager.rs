//! Process Manager Service
//!
//! Singleton manager for process buffers. Provides centralized access
//! to all running process states for multi-client synchronization.

use std::collections::HashMap;
use std::sync::{Arc, RwLock};

use openflow_contracts::{
    entities::tool_state::ToolState,
    requests::ProcessSnapshot,
};
use tracing::{debug, info, warn};

use super::process_buffer::ProcessBuffer;

/// Thread-safe reference to a process buffer
pub type BufferRef = Arc<RwLock<ProcessBuffer>>;

/// Global process manager instance
static PROCESS_MANAGER: std::sync::OnceLock<ProcessManager> = std::sync::OnceLock::new();

/// Manager for all active process buffers
#[derive(Debug)]
pub struct ProcessManager {
    /// Map of process ID to buffer
    buffers: RwLock<HashMap<String, BufferRef>>,
}

impl ProcessManager {
    /// Create a new process manager
    fn new() -> Self {
        Self {
            buffers: RwLock::new(HashMap::new()),
        }
    }

    /// Get the global process manager instance
    pub fn global() -> &'static ProcessManager {
        PROCESS_MANAGER.get_or_init(ProcessManager::new)
    }

    /// Create a new buffer for a process
    ///
    /// If a buffer already exists for this process, returns the existing one.
    pub fn create_buffer(&self, process_id: &str) -> BufferRef {
        let mut buffers = self.buffers.write().unwrap();

        if let Some(existing) = buffers.get(process_id) {
            debug!(process_id = process_id, "Returning existing buffer");
            return existing.clone();
        }

        info!(process_id = process_id, "Creating new process buffer");
        let buffer = Arc::new(RwLock::new(ProcessBuffer::new(process_id)));
        buffers.insert(process_id.to_string(), buffer.clone());
        buffer
    }

    /// Get a buffer for a process if it exists
    pub fn get_buffer(&self, process_id: &str) -> Option<BufferRef> {
        let buffers = self.buffers.read().unwrap();
        buffers.get(process_id).cloned()
    }

    /// Remove a buffer for a process
    pub fn remove_buffer(&self, process_id: &str) -> Option<BufferRef> {
        let mut buffers = self.buffers.write().unwrap();
        let removed = buffers.remove(process_id);
        if removed.is_some() {
            info!(process_id = process_id, "Removed process buffer");
        }
        removed
    }

    /// Get a snapshot of a process buffer
    pub fn get_snapshot(&self, process_id: &str) -> Option<ProcessSnapshot> {
        self.get_buffer(process_id).map(|buffer| {
            let buffer = buffer.read().unwrap();
            buffer.full_snapshot()
        })
    }

    /// Append raw bytes to a process buffer
    ///
    /// Returns newly parsed events and tool state changes, or None if buffer doesn't exist.
    pub fn append_raw(
        &self,
        process_id: &str,
        bytes: &[u8],
    ) -> Option<(Vec<serde_json::Value>, Vec<ToolState>)> {
        self.get_buffer(process_id).map(|buffer| {
            let mut buffer = buffer.write().unwrap();
            buffer.append_raw(bytes)
        })
    }

    /// Set the exit code for a process
    pub fn set_exit_code(&self, process_id: &str, exit_code: i32) {
        if let Some(buffer) = self.get_buffer(process_id) {
            let mut buffer = buffer.write().unwrap();
            buffer.set_exit_code(exit_code);
        } else {
            warn!(process_id = process_id, "Cannot set exit code: buffer not found");
        }
    }

    /// Mark a process as killed
    pub fn mark_killed(&self, process_id: &str) {
        if let Some(buffer) = self.get_buffer(process_id) {
            let mut buffer = buffer.write().unwrap();
            buffer.mark_killed();
        } else {
            warn!(process_id = process_id, "Cannot mark killed: buffer not found");
        }
    }

    /// Set session ID for a process
    pub fn set_session_id(&self, process_id: &str, session_id: &str) {
        if let Some(buffer) = self.get_buffer(process_id) {
            let mut buffer = buffer.write().unwrap();
            buffer.set_session_id(session_id);
        }
    }

    /// Get all active process IDs
    pub fn active_process_ids(&self) -> Vec<String> {
        let buffers = self.buffers.read().unwrap();
        buffers.keys().cloned().collect()
    }

    /// Get count of active buffers
    pub fn buffer_count(&self) -> usize {
        let buffers = self.buffers.read().unwrap();
        buffers.len()
    }

    /// Check if a buffer exists for a process
    pub fn has_buffer(&self, process_id: &str) -> bool {
        let buffers = self.buffers.read().unwrap();
        buffers.contains_key(process_id)
    }

    /// Get raw output for a process since a specific offset
    pub fn get_raw_output_since(&self, process_id: &str, offset: usize) -> Option<String> {
        self.get_buffer(process_id).map(|buffer| {
            let buffer = buffer.read().unwrap();
            buffer.get_raw_output_since(offset)
        })
    }

    /// Get all tool states for a process
    pub fn get_tool_states(&self, process_id: &str) -> Option<Vec<ToolState>> {
        self.get_buffer(process_id).map(|buffer| {
            let buffer = buffer.read().unwrap();
            buffer.tool_states()
        })
    }

    /// Get all events for a process
    pub fn get_events(&self, process_id: &str) -> Option<Vec<serde_json::Value>> {
        self.get_buffer(process_id).map(|buffer| {
            let buffer = buffer.read().unwrap();
            buffer.events().to_vec()
        })
    }

    /// Clear all buffers (useful for testing)
    #[cfg(test)]
    pub fn clear_all(&self) {
        let mut buffers = self.buffers.write().unwrap();
        buffers.clear();
    }
}

impl Default for ProcessManager {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn test_manager() -> ProcessManager {
        ProcessManager::new()
    }

    #[test]
    fn test_create_buffer() {
        let manager = test_manager();

        let buffer = manager.create_buffer("test-1");
        assert!(manager.has_buffer("test-1"));
        assert_eq!(manager.buffer_count(), 1);

        // Creating again returns the same buffer
        let buffer2 = manager.create_buffer("test-1");
        assert_eq!(manager.buffer_count(), 1);
        assert!(Arc::ptr_eq(&buffer, &buffer2));
    }

    #[test]
    fn test_get_buffer() {
        let manager = test_manager();

        assert!(manager.get_buffer("nonexistent").is_none());

        manager.create_buffer("test-1");
        assert!(manager.get_buffer("test-1").is_some());
    }

    #[test]
    fn test_remove_buffer() {
        let manager = test_manager();

        manager.create_buffer("test-1");
        assert_eq!(manager.buffer_count(), 1);

        let removed = manager.remove_buffer("test-1");
        assert!(removed.is_some());
        assert_eq!(manager.buffer_count(), 0);
        assert!(!manager.has_buffer("test-1"));
    }

    #[test]
    fn test_append_raw() {
        let manager = test_manager();
        manager.create_buffer("test-1");

        let result = manager.append_raw("test-1", b"hello\n");
        assert!(result.is_some());

        let result2 = manager.append_raw("nonexistent", b"hello\n");
        assert!(result2.is_none());
    }

    #[test]
    fn test_set_exit_code() {
        let manager = test_manager();
        manager.create_buffer("test-1");

        manager.set_exit_code("test-1", 0);

        let snapshot = manager.get_snapshot("test-1").unwrap();
        assert_eq!(snapshot.exit_code, Some(0));
    }

    #[test]
    fn test_mark_killed() {
        let manager = test_manager();
        manager.create_buffer("test-1");

        manager.mark_killed("test-1");

        let snapshot = manager.get_snapshot("test-1").unwrap();
        assert_eq!(
            snapshot.status,
            openflow_contracts::entities::process::ProcessStatus::Killed
        );
    }

    #[test]
    fn test_active_process_ids() {
        let manager = test_manager();

        manager.create_buffer("test-1");
        manager.create_buffer("test-2");
        manager.create_buffer("test-3");

        let ids = manager.active_process_ids();
        assert_eq!(ids.len(), 3);
        assert!(ids.contains(&"test-1".to_string()));
        assert!(ids.contains(&"test-2".to_string()));
        assert!(ids.contains(&"test-3".to_string()));
    }

    #[test]
    fn test_get_snapshot() {
        let manager = test_manager();
        manager.create_buffer("test-1");

        let json = r#"{"type": "system", "message": "hello"}
"#;
        manager.append_raw("test-1", json.as_bytes());
        manager.set_session_id("test-1", "session-abc");

        let snapshot = manager.get_snapshot("test-1").unwrap();
        assert_eq!(snapshot.process_id, "test-1");
        assert_eq!(snapshot.session_id, Some("session-abc".to_string()));
        assert_eq!(snapshot.events.len(), 1);
    }

    #[test]
    fn test_get_tool_states() {
        let manager = test_manager();
        manager.create_buffer("test-1");

        // Add a tool use event
        let tool_use = r#"{"type": "assistant", "message": {"content": [{"type": "tool_use", "id": "tool-1", "name": "Read", "input": {}}]}}
"#;
        manager.append_raw("test-1", tool_use.as_bytes());

        let tools = manager.get_tool_states("test-1").unwrap();
        assert_eq!(tools.len(), 1);
        assert_eq!(tools[0].id, "tool-1");
    }
}
