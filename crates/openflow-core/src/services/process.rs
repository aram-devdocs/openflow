//! Process Service
//!
//! Handles execution process lifecycle and management, including:
//! - Creating and tracking process records in the database
//! - Starting CLI tool processes (Claude Code, Gemini CLI, etc.)
//! - Killing running processes
//! - Sending input to processes
//! - Real-time output streaming via events
//!
//! # Event Broadcasting
//!
//! The ProcessService emits events via the EventBroadcaster trait:
//! - `ProcessOutput` events when stdout/stderr output is received
//! - `ProcessStatus` events when process status changes (started, completed, killed, failed)
//!
//! These events are automatically broadcasted to:
//! - Tauri IPC (via TauriBroadcaster)
//! - WebSocket clients (via WsBroadcaster)
//!
//! # Logging
//!
//! This module uses structured logging at the following levels:
//! - `debug`: Query parameters, tracking state changes, PTY operations
//! - `info`: Process creation, status updates, kill operations, start/complete
//! - `warn`: Kill attempts on non-running processes, PTY fallback to OS kill
//! - `error`: Database failures, process spawn failures, PTY errors
//!
//! # Error Handling
//!
//! All public functions return `ServiceResult<T>` with contextual error information:
//! - `ServiceError::NotFound` for missing process records
//! - `ServiceError::Validation` for invalid state transitions
//! - `ServiceError::Process` for PTY/spawn failures
//! - `ServiceError::Database` for SQLx errors

use chrono::Utc;
use log::{debug, error, info, warn};
use sqlx::SqlitePool;
use std::collections::HashMap;
use std::io::Read;
use std::sync::Arc;
use tokio::sync::Mutex;
use uuid::Uuid;

use openflow_contracts::{
    CreateProcessRequest, ExecutionProcess, ProcessStatus, ProcessStatusEvent, StartProcessRequest,
};
use openflow_process::{PtyConfig, PtyManager, PtySize};

use super::{ServiceError, ServiceResult};
use crate::events::{
    Event, EventBroadcaster, NullBroadcaster, OutputType, ProcessStatus as EventProcessStatus,
};

// =============================================================================
// Internal Types
// =============================================================================

/// Tracks a running process instance.
#[derive(Debug)]
#[allow(dead_code)]
struct RunningProcess {
    /// The process ID in our database.
    process_id: String,
    /// Whether this process uses PTY.
    use_pty: bool,
    /// The OS process ID (for non-PTY processes).
    os_pid: Option<u32>,
}

// =============================================================================
// Database Operations (Stateless Functions)
// =============================================================================

/// Get a process by ID.
pub async fn get(pool: &SqlitePool, id: &str) -> ServiceResult<ExecutionProcess> {
    debug!("get: fetching process id={}", id);

    let process = sqlx::query_as::<_, ExecutionProcess>(
        r#"
        SELECT
            id,
            chat_id,
            executor_profile_id,
            status,
            exit_code,
            executor_action,
            run_reason,
            before_head_commit,
            after_head_commit,
            pid,
            started_at,
            completed_at,
            created_at,
            updated_at
        FROM execution_processes
        WHERE id = ?
        "#,
    )
    .bind(id)
    .fetch_optional(pool)
    .await
    .map_err(|e| {
        error!("get: database error fetching process id={}: {}", id, e);
        e
    })?
    .ok_or_else(|| {
        debug!("get: process not found id={}", id);
        ServiceError::NotFound {
            entity: "ExecutionProcess",
            id: id.to_string(),
        }
    })?;

    debug!(
        "get: found process id={} status={:?} chat_id={}",
        process.id, process.status, process.chat_id
    );
    Ok(process)
}

/// List all processes.
pub async fn list(pool: &SqlitePool) -> ServiceResult<Vec<ExecutionProcess>> {
    debug!("list: fetching all processes");

    let processes = sqlx::query_as::<_, ExecutionProcess>(
        r#"
        SELECT
            id,
            chat_id,
            executor_profile_id,
            status,
            exit_code,
            executor_action,
            run_reason,
            before_head_commit,
            after_head_commit,
            pid,
            started_at,
            completed_at,
            created_at,
            updated_at
        FROM execution_processes
        ORDER BY created_at DESC, id DESC
        "#,
    )
    .fetch_all(pool)
    .await
    .map_err(|e| {
        error!("list: database error: {}", e);
        e
    })?;

    debug!("list: found {} processes", processes.len());
    Ok(processes)
}

/// List processes for a chat.
pub async fn list_by_chat(
    pool: &SqlitePool,
    chat_id: &str,
) -> ServiceResult<Vec<ExecutionProcess>> {
    debug!("list_by_chat: fetching processes for chat_id={}", chat_id);

    let processes = sqlx::query_as::<_, ExecutionProcess>(
        r#"
        SELECT
            id,
            chat_id,
            executor_profile_id,
            status,
            exit_code,
            executor_action,
            run_reason,
            before_head_commit,
            after_head_commit,
            pid,
            started_at,
            completed_at,
            created_at,
            updated_at
        FROM execution_processes
        WHERE chat_id = ?
        ORDER BY created_at DESC, id DESC
        "#,
    )
    .bind(chat_id)
    .fetch_all(pool)
    .await
    .map_err(|e| {
        error!(
            "list_by_chat: database error for chat_id={}: {}",
            chat_id, e
        );
        e
    })?;

    debug!(
        "list_by_chat: found {} processes for chat_id={}",
        processes.len(),
        chat_id
    );
    Ok(processes)
}

/// List running processes.
pub async fn list_running(pool: &SqlitePool) -> ServiceResult<Vec<ExecutionProcess>> {
    debug!("list_running: fetching running processes");

    let processes = sqlx::query_as::<_, ExecutionProcess>(
        r#"
        SELECT
            id,
            chat_id,
            executor_profile_id,
            status,
            exit_code,
            executor_action,
            run_reason,
            before_head_commit,
            after_head_commit,
            pid,
            started_at,
            completed_at,
            created_at,
            updated_at
        FROM execution_processes
        WHERE status = 'running'
        ORDER BY created_at DESC, id DESC
        "#,
    )
    .fetch_all(pool)
    .await
    .map_err(|e| {
        error!("list_running: database error: {}", e);
        e
    })?;

    debug!("list_running: found {} running processes", processes.len());
    Ok(processes)
}

/// List running processes for a chat.
pub async fn list_running_by_chat(
    pool: &SqlitePool,
    chat_id: &str,
) -> ServiceResult<Vec<ExecutionProcess>> {
    debug!(
        "list_running_by_chat: fetching running processes for chat_id={}",
        chat_id
    );

    let processes = sqlx::query_as::<_, ExecutionProcess>(
        r#"
        SELECT
            id,
            chat_id,
            executor_profile_id,
            status,
            exit_code,
            executor_action,
            run_reason,
            before_head_commit,
            after_head_commit,
            pid,
            started_at,
            completed_at,
            created_at,
            updated_at
        FROM execution_processes
        WHERE chat_id = ? AND status = 'running'
        ORDER BY created_at DESC, id DESC
        "#,
    )
    .bind(chat_id)
    .fetch_all(pool)
    .await
    .map_err(|e| {
        error!(
            "list_running_by_chat: database error for chat_id={}: {}",
            chat_id, e
        );
        e
    })?;

    debug!(
        "list_running_by_chat: found {} running processes for chat_id={}",
        processes.len(),
        chat_id
    );
    Ok(processes)
}

/// Create a new execution process record.
pub async fn create(
    pool: &SqlitePool,
    request: CreateProcessRequest,
) -> ServiceResult<ExecutionProcess> {
    let id = Uuid::new_v4().to_string();
    let now = Utc::now().format("%Y-%m-%d %H:%M:%S%.3f").to_string();

    debug!(
        "create: creating process id={} chat_id={} action={} reason={:?}",
        id, request.chat_id, request.executor_action, request.run_reason
    );

    sqlx::query(
        r#"
        INSERT INTO execution_processes (
            id, chat_id, executor_profile_id, status, executor_action,
            run_reason, before_head_commit, started_at, created_at, updated_at
        )
        VALUES (?, ?, ?, 'running', ?, ?, ?, ?, ?, ?)
        "#,
    )
    .bind(&id)
    .bind(&request.chat_id)
    .bind(&request.executor_profile_id)
    .bind(&request.executor_action)
    .bind(request.run_reason.to_string())
    .bind(&request.before_head_commit)
    .bind(&now)
    .bind(&now)
    .bind(&now)
    .execute(pool)
    .await
    .map_err(|e| {
        error!(
            "create: database error creating process id={} chat_id={}: {}",
            id, request.chat_id, e
        );
        e
    })?;

    info!(
        "create: created process id={} chat_id={} action={} reason={:?}",
        id, request.chat_id, request.executor_action, request.run_reason
    );
    get(pool, &id).await
}

/// Update process status.
pub async fn update_status(
    pool: &SqlitePool,
    id: &str,
    status: ProcessStatus,
    exit_code: Option<i32>,
) -> ServiceResult<ExecutionProcess> {
    debug!(
        "update_status: updating process id={} to status={:?} exit_code={:?}",
        id, status, exit_code
    );

    // Verify process exists and get current status for logging
    let current = get(pool, id).await?;

    let now = Utc::now().format("%Y-%m-%d %H:%M:%S%.3f").to_string();
    let completed_at = match status {
        ProcessStatus::Running => None,
        _ => Some(now.clone()),
    };

    sqlx::query(
        r#"
        UPDATE execution_processes
        SET
            status = ?,
            exit_code = ?,
            completed_at = ?,
            updated_at = ?
        WHERE id = ?
        "#,
    )
    .bind(status.to_string())
    .bind(exit_code)
    .bind(&completed_at)
    .bind(&now)
    .bind(id)
    .execute(pool)
    .await
    .map_err(|e| {
        error!(
            "update_status: database error updating process id={}: {}",
            id, e
        );
        e
    })?;

    info!(
        "update_status: updated process id={} status={:?}->{:?} exit_code={:?}",
        id, current.status, status, exit_code
    );
    get(pool, id).await
}

/// Update the PID of a process.
pub async fn update_pid(pool: &SqlitePool, id: &str, pid: i32) -> ServiceResult<ExecutionProcess> {
    debug!("update_pid: updating process id={} to pid={}", id, pid);

    // Verify process exists
    get(pool, id).await?;

    let now = Utc::now().format("%Y-%m-%d %H:%M:%S%.3f").to_string();

    sqlx::query(
        r#"
        UPDATE execution_processes
        SET pid = ?, updated_at = ?
        WHERE id = ?
        "#,
    )
    .bind(pid)
    .bind(&now)
    .bind(id)
    .execute(pool)
    .await
    .map_err(|e| {
        error!(
            "update_pid: database error updating process id={} pid={}: {}",
            id, pid, e
        );
        e
    })?;

    debug!("update_pid: updated process id={} pid={}", id, pid);
    get(pool, id).await
}

/// Update the after_head_commit field.
pub async fn update_after_commit(
    pool: &SqlitePool,
    id: &str,
    commit: &str,
) -> ServiceResult<ExecutionProcess> {
    debug!(
        "update_after_commit: updating process id={} after_commit={}",
        id, commit
    );

    // Verify process exists
    get(pool, id).await?;

    let now = Utc::now().format("%Y-%m-%d %H:%M:%S%.3f").to_string();

    sqlx::query(
        r#"
        UPDATE execution_processes
        SET after_head_commit = ?, updated_at = ?
        WHERE id = ?
        "#,
    )
    .bind(commit)
    .bind(&now)
    .bind(id)
    .execute(pool)
    .await
    .map_err(|e| {
        error!(
            "update_after_commit: database error updating process id={}: {}",
            id, e
        );
        e
    })?;

    debug!(
        "update_after_commit: updated process id={} after_commit={}",
        id, commit
    );
    get(pool, id).await
}

/// Mark a process as completed.
pub async fn complete(
    pool: &SqlitePool,
    id: &str,
    exit_code: i32,
) -> ServiceResult<ExecutionProcess> {
    let status = if exit_code == 0 {
        ProcessStatus::Completed
    } else {
        ProcessStatus::Failed
    };

    if exit_code == 0 {
        info!("complete: process id={} completed successfully", id);
    } else {
        warn!(
            "complete: process id={} failed with exit_code={}",
            id, exit_code
        );
    }

    update_status(pool, id, status, Some(exit_code)).await
}

/// Mark a process as killed.
pub async fn mark_killed(pool: &SqlitePool, id: &str) -> ServiceResult<ExecutionProcess> {
    info!("mark_killed: marking process id={} as killed", id);
    update_status(pool, id, ProcessStatus::Killed, None).await
}

/// Delete a process.
pub async fn delete(pool: &SqlitePool, id: &str) -> ServiceResult<()> {
    debug!("delete: deleting process id={}", id);

    // Verify process exists
    get(pool, id).await?;

    sqlx::query("DELETE FROM execution_processes WHERE id = ?")
        .bind(id)
        .execute(pool)
        .await
        .map_err(|e| {
            error!("delete: database error deleting process id={}: {}", id, e);
            e
        })?;

    info!("delete: deleted process id={}", id);
    Ok(())
}

/// Create a process status event for the given process.
pub fn create_status_event(process: &ExecutionProcess) -> ProcessStatusEvent {
    ProcessStatusEvent {
        process_id: process.id.clone(),
        status: process.status.clone(),
        exit_code: process.exit_code,
    }
}

// =============================================================================
// Process Service (Stateful)
// =============================================================================

/// Service for managing execution processes.
///
/// This service provides:
/// - Database CRUD operations for process records
/// - Process spawning (both PTY and non-PTY modes)
/// - Process lifecycle management (start, kill, send input)
/// - Tracking of running processes
/// - Real-time event broadcasting for output and status changes
///
/// The service maintains state for tracking running processes and
/// provides access to the PTY manager.
///
/// # Event Broadcasting
///
/// The service broadcasts events via the `EventBroadcaster` trait:
/// - `ProcessOutput` events for stdout/stderr content
/// - `ProcessStatus` events for status changes
///
/// These events can be received by:
/// - Tauri IPC listeners (desktop app)
/// - WebSocket clients (browser/web app)
pub struct ProcessService {
    /// PTY manager for interactive processes.
    pty_manager: Arc<PtyManager>,
    /// Map of process IDs to running process info.
    running_processes: Arc<Mutex<HashMap<String, RunningProcess>>>,
    /// Event broadcaster for real-time updates.
    broadcaster: Arc<dyn EventBroadcaster>,
}

impl ProcessService {
    /// Create a new ProcessService instance with no event broadcasting.
    ///
    /// For most use cases, prefer `with_broadcaster()` to enable real-time
    /// event streaming to connected clients.
    pub fn new() -> Self {
        Self {
            pty_manager: Arc::new(PtyManager::new()),
            running_processes: Arc::new(Mutex::new(HashMap::new())),
            broadcaster: NullBroadcaster::arc(),
        }
    }

    /// Create a new ProcessService with the given event broadcaster.
    ///
    /// The broadcaster will receive:
    /// - `ProcessOutput` events when stdout/stderr output is received
    /// - `ProcessStatus` events when process status changes
    ///
    /// # Example
    ///
    /// ```rust,ignore
    /// use openflow_core::services::process::ProcessService;
    /// use openflow_core::events::ChannelBroadcaster;
    /// use std::sync::Arc;
    ///
    /// let broadcaster = ChannelBroadcaster::arc(256);
    /// let service = ProcessService::with_broadcaster(broadcaster);
    /// ```
    pub fn with_broadcaster(broadcaster: Arc<dyn EventBroadcaster>) -> Self {
        Self {
            pty_manager: Arc::new(PtyManager::new()),
            running_processes: Arc::new(Mutex::new(HashMap::new())),
            broadcaster,
        }
    }

    /// Get the PTY manager for direct access.
    pub fn pty_manager(&self) -> Arc<PtyManager> {
        Arc::clone(&self.pty_manager)
    }

    /// Get the event broadcaster.
    pub fn broadcaster(&self) -> &Arc<dyn EventBroadcaster> {
        &self.broadcaster
    }

    /// Broadcast a ProcessStatus event.
    fn broadcast_status(
        &self,
        process_id: &str,
        status: EventProcessStatus,
        exit_code: Option<i32>,
    ) {
        let event = Event::process_status(process_id, status, exit_code);
        debug!(
            "broadcast_status: broadcasting status event for process_id={} status={:?}",
            process_id, status
        );
        self.broadcaster.broadcast(event);
    }

    /// Broadcast a ProcessOutput event.
    #[allow(dead_code)] // Useful for direct output broadcasting (e.g., from pipe processes)
    fn broadcast_output(&self, process_id: &str, output_type: OutputType, content: &str) {
        let event = Event::process_output(process_id, output_type, content);
        self.broadcaster.broadcast(event);
    }

    /// Kill a running process.
    ///
    /// This method attempts to kill the process using either PTY or standard
    /// process kill mechanisms, then updates the database record.
    pub async fn kill(&self, pool: &SqlitePool, id: &str) -> ServiceResult<ExecutionProcess> {
        info!("kill: attempting to kill process id={}", id);
        let process = get(pool, id).await?;

        // Only kill running processes
        if process.status != ProcessStatus::Running {
            warn!(
                "kill: cannot kill process id={} with status={:?}",
                id, process.status
            );
            return Err(ServiceError::Validation(format!(
                "Cannot kill process {} with status {:?}",
                id, process.status
            )));
        }

        // Try to kill via PTY first
        let killed_via_pty = self.pty_manager.kill(id).is_ok();
        debug!(
            "kill: PTY kill attempt for id={} success={}",
            id, killed_via_pty
        );

        // If not a PTY process, try to kill via OS PID
        if !killed_via_pty {
            if let Some(pid) = process.pid {
                debug!("kill: falling back to OS kill for id={} pid={}", id, pid);
                #[cfg(unix)]
                {
                    use std::process::Command;
                    let result = Command::new("kill").arg("-9").arg(pid.to_string()).output();
                    match result {
                        Ok(_) => debug!("kill: OS kill signal sent to pid={}", pid),
                        Err(e) => warn!("kill: failed to send OS kill to pid={}: {}", pid, e),
                    }
                }
                #[cfg(windows)]
                {
                    use std::process::Command;
                    let result = Command::new("taskkill")
                        .args(&["/F", "/PID", &pid.to_string()])
                        .output();
                    match result {
                        Ok(_) => debug!("kill: taskkill sent to pid={}", pid),
                        Err(e) => warn!("kill: failed to taskkill pid={}: {}", pid, e),
                    }
                }
            } else {
                debug!("kill: no OS PID available for process id={}", id);
            }
        }

        // Remove from running processes tracking
        {
            let mut running = self.running_processes.lock().await;
            running.remove(id);
            debug!("kill: removed process id={} from running tracking", id);
        }

        // Close PTY if exists
        let _ = self.pty_manager.close(id);
        debug!("kill: closed PTY for process id={}", id);

        // Update database
        info!("kill: successfully killed process id={}", id);
        let killed_process = mark_killed(pool, id).await?;

        // Broadcast status event
        self.broadcast_status(id, EventProcessStatus::Killed, None);

        Ok(killed_process)
    }

    /// Start a process with the given request parameters.
    ///
    /// This creates a process record, spawns the process (either PTY or standard),
    /// and begins tracking it.
    pub async fn start(
        &self,
        pool: &SqlitePool,
        create_request: CreateProcessRequest,
        start_request: StartProcessRequest,
    ) -> ServiceResult<ExecutionProcess> {
        info!(
            "start: starting process for chat_id={} command={} use_pty={}",
            create_request.chat_id, start_request.command, start_request.use_pty
        );

        // Create database record
        let process = create(pool, create_request).await?;
        debug!("start: created database record id={}", process.id);

        // Spawn the process
        if start_request.use_pty {
            // Use PTY for interactive processes
            debug!(
                "start: spawning PTY process id={} cols={} rows={}",
                process.id,
                start_request.pty_cols.unwrap_or(80),
                start_request.pty_rows.unwrap_or(24)
            );

            let config = PtyConfig {
                command: start_request.command.clone(),
                args: start_request.args.clone(),
                cwd: start_request.cwd.clone(),
                env: start_request.env.clone(),
                cols: start_request.pty_cols.unwrap_or(80),
                rows: start_request.pty_rows.unwrap_or(24),
            };

            self.pty_manager.create(&process.id, config).map_err(|e| {
                error!(
                    "start: failed to create PTY for process id={}: {}",
                    process.id, e
                );
                ServiceError::Process(e.to_string())
            })?;

            // Track the running process
            {
                let mut running = self.running_processes.lock().await;
                running.insert(
                    process.id.clone(),
                    RunningProcess {
                        process_id: process.id.clone(),
                        use_pty: true,
                        os_pid: None,
                    },
                );
                debug!(
                    "start: added PTY process id={} to running tracking (total={})",
                    process.id,
                    running.len()
                );
            }

            // Broadcast running status
            self.broadcast_status(&process.id, EventProcessStatus::Running, None);

            // Start output streaming task
            self.spawn_pty_output_streamer(&process.id);

            info!(
                "start: PTY process started id={} command={}",
                process.id, start_request.command
            );
        } else {
            // Use standard process spawning via ProcessSpawner
            debug!(
                "start: spawning standard process id={} command={} args={:?}",
                process.id, start_request.command, start_request.args
            );

            let config = openflow_process::PipeSpawnConfig {
                command: start_request.command.clone(),
                args: start_request.args.clone(),
                cwd: start_request.cwd.clone(),
                env: start_request.env.clone(),
                inherit_env: true,
            };

            let child = openflow_process::ProcessSpawner::spawn(config).map_err(|e| {
                error!("start: failed to spawn process id={}: {}", process.id, e);
                ServiceError::Process(e.to_string())
            })?;

            let os_pid = child.id();
            debug!(
                "start: spawned standard process id={} os_pid={}",
                process.id, os_pid
            );

            // Update PID in database
            update_pid(pool, &process.id, os_pid as i32).await?;

            // Track the running process
            {
                let mut running = self.running_processes.lock().await;
                running.insert(
                    process.id.clone(),
                    RunningProcess {
                        process_id: process.id.clone(),
                        use_pty: false,
                        os_pid: Some(os_pid),
                    },
                );
                debug!(
                    "start: added standard process id={} pid={} to running tracking (total={})",
                    process.id,
                    os_pid,
                    running.len()
                );
            }

            // Broadcast running status
            self.broadcast_status(&process.id, EventProcessStatus::Running, None);

            info!(
                "start: standard process started id={} pid={} command={}",
                process.id, os_pid, start_request.command
            );
        }

        get(pool, &process.id).await
    }

    /// Spawn a background task to stream PTY output and broadcast events.
    ///
    /// This task reads from the PTY and broadcasts `ProcessOutput` events
    /// for each chunk of output. When the process exits, it broadcasts a
    /// `ProcessStatus` event with the exit status.
    ///
    /// Note: We read raw bytes in chunks rather than lines because:
    /// - Shell prompts don't end with newlines
    /// - ANSI escape sequences need to be preserved
    /// - xterm.js expects raw terminal output
    fn spawn_pty_output_streamer(&self, process_id: &str) {
        let pty_manager = Arc::clone(&self.pty_manager);
        let broadcaster = Arc::clone(&self.broadcaster);
        let process_id = process_id.to_string();

        std::thread::spawn(move || {
            // Get reader from PTY
            let mut reader = match pty_manager.try_clone_reader(&process_id) {
                Ok(r) => r,
                Err(e) => {
                    error!(
                        "spawn_pty_output_streamer: failed to get PTY reader for {}: {}",
                        process_id, e
                    );
                    return;
                }
            };

            debug!(
                "spawn_pty_output_streamer: started streaming for process_id={}",
                process_id
            );

            // Read chunks from PTY and broadcast
            // Use a buffer size that balances latency vs overhead
            let mut buffer = [0u8; 4096];
            loop {
                match reader.read(&mut buffer) {
                    Ok(0) => {
                        // EOF - process exited or PTY closed
                        debug!(
                            "spawn_pty_output_streamer: EOF for process_id={}",
                            process_id
                        );
                        break;
                    }
                    Ok(n) => {
                        // Convert bytes to string, handling invalid UTF-8 gracefully
                        let content = String::from_utf8_lossy(&buffer[..n]).into_owned();
                        if !content.is_empty() {
                            // Broadcast the output (treating PTY output as stdout)
                            let event =
                                Event::process_output(&process_id, OutputType::Stdout, content);
                            broadcaster.broadcast(event);
                        }
                    }
                    Err(e) => {
                        // IO error typically means process exited or PTY closed
                        debug!(
                            "spawn_pty_output_streamer: read error for {}: {} (likely process exit)",
                            process_id, e
                        );
                        break;
                    }
                }
            }

            // Check exit status with retry loop
            // The PTY EOF may arrive before the process fully exits,
            // so we need to wait briefly and retry
            let exit_status = {
                let mut attempts = 0;
                const MAX_ATTEMPTS: u32 = 20; // 2 seconds max wait
                const RETRY_DELAY_MS: u64 = 100;

                loop {
                    match pty_manager.try_wait(&process_id) {
                        Ok(Some(status)) => {
                            let code = if status.success() {
                                Some(0)
                            } else {
                                Some(status.exit_code() as i32)
                            };
                            let event_status = if status.success() {
                                EventProcessStatus::Completed
                            } else {
                                EventProcessStatus::Failed
                            };
                            debug!(
                                "spawn_pty_output_streamer: process {} exited with status {:?} (after {} attempts)",
                                process_id, event_status, attempts
                            );
                            break (event_status, code);
                        }
                        Ok(None) => {
                            attempts += 1;
                            if attempts >= MAX_ATTEMPTS {
                                // Process still running after max wait - treat as killed
                                debug!(
                                    "spawn_pty_output_streamer: stream closed but process {} still running after {} attempts, treating as killed",
                                    process_id, attempts
                                );
                                break (EventProcessStatus::Killed, None);
                            }
                            // Wait briefly and retry
                            debug!(
                                "spawn_pty_output_streamer: process {} not yet exited, waiting (attempt {})",
                                process_id, attempts
                            );
                            std::thread::sleep(std::time::Duration::from_millis(RETRY_DELAY_MS));
                        }
                        Err(e) => {
                            debug!(
                                "spawn_pty_output_streamer: failed to get exit status for {}: {}",
                                process_id, e
                            );
                            break (EventProcessStatus::Failed, None);
                        }
                    }
                }
            };

            // Broadcast completion status
            let event = Event::process_status(&process_id, exit_status.0, exit_status.1);
            broadcaster.broadcast(event);

            info!(
                "spawn_pty_output_streamer: finished streaming for process_id={} status={:?}",
                process_id, exit_status.0
            );
        });
    }

    /// Send input to a running PTY process.
    pub fn send_input(&self, process_id: &str, input: &str) -> ServiceResult<()> {
        debug!(
            "send_input: sending {} bytes to process id={}",
            input.len(),
            process_id
        );

        self.pty_manager
            .write(process_id, input.as_bytes())
            .map_err(|e| {
                error!(
                    "send_input: failed to write to process id={}: {}",
                    process_id, e
                );
                ServiceError::Process(e.to_string())
            })?;

        debug!(
            "send_input: sent {} bytes to process id={}",
            input.len(),
            process_id
        );
        Ok(())
    }

    /// Resize a PTY process.
    pub fn resize(&self, process_id: &str, cols: u16, rows: u16) -> ServiceResult<()> {
        debug!(
            "resize: resizing process id={} to cols={} rows={}",
            process_id, cols, rows
        );

        self.pty_manager
            .resize(process_id, PtySize { cols, rows })
            .map_err(|e| {
                error!("resize: failed to resize process id={}: {}", process_id, e);
                ServiceError::Process(e.to_string())
            })?;

        debug!(
            "resize: resized process id={} to cols={} rows={}",
            process_id, cols, rows
        );
        Ok(())
    }

    /// Check if a process is currently running.
    pub async fn is_running(&self, process_id: &str) -> bool {
        let running = self.running_processes.lock().await;
        let is_running = running.contains_key(process_id);
        debug!(
            "is_running: process id={} is_running={}",
            process_id, is_running
        );
        is_running
    }

    /// Get the count of running processes.
    pub async fn running_count(&self) -> usize {
        let running = self.running_processes.lock().await;
        let count = running.len();
        debug!("running_count: {} processes running", count);
        count
    }

    /// Kill all running processes (cleanup on shutdown).
    pub async fn kill_all(&self, pool: &SqlitePool) -> ServiceResult<()> {
        let process_ids: Vec<String> = {
            let running = self.running_processes.lock().await;
            running.keys().cloned().collect()
        };

        info!("kill_all: killing {} running processes", process_ids.len());

        let mut killed_count = 0;
        let mut failed_count = 0;
        for id in &process_ids {
            match self.kill(pool, id).await {
                Ok(_) => {
                    killed_count += 1;
                    debug!("kill_all: killed process id={}", id);
                }
                Err(e) => {
                    failed_count += 1;
                    warn!("kill_all: failed to kill process id={}: {}", id, e);
                }
            }
        }

        // Close all PTYs
        let _ = self.pty_manager.close_all();
        debug!("kill_all: closed all PTYs");

        info!(
            "kill_all: completed - killed={} failed={}",
            killed_count, failed_count
        );
        Ok(())
    }
}

impl Default for ProcessService {
    fn default() -> Self {
        Self::new()
    }
}

// =============================================================================
// Tests
// =============================================================================

#[cfg(test)]
mod tests {
    use super::*;
    use openflow_contracts::RunReason;
    use openflow_db::create_test_db;

    /// Helper to create test project and task.
    async fn create_test_chat(pool: &SqlitePool) -> String {
        use crate::services::{chat, project, task};
        use openflow_contracts::{CreateChatRequest, CreateProjectRequest, CreateTaskRequest};

        let project_request = CreateProjectRequest {
            name: "Test Project".to_string(),
            git_repo_path: format!("/tmp/test-repo-{}", Uuid::new_v4()),
            ..Default::default()
        };
        let project = project::create(pool, project_request)
            .await
            .expect("Failed to create project");

        let task_request = CreateTaskRequest {
            project_id: project.id.clone(),
            title: "Test Task".to_string(),
            ..Default::default()
        };
        let task_result = task::create(pool, task_request)
            .await
            .expect("Failed to create task");

        let chat_request = CreateChatRequest {
            task_id: Some(task_result.id.clone()),
            project_id: project.id.clone(),
            title: Some("Test Chat".to_string()),
            ..Default::default()
        };
        let chat = chat::create(pool, chat_request)
            .await
            .expect("Failed to create chat");

        chat.id
    }

    /// Helper to create a test process request.
    fn test_create_request(chat_id: &str) -> CreateProcessRequest {
        CreateProcessRequest::terminal(chat_id, "test action")
    }

    #[tokio::test]
    async fn test_create_process() {
        let pool = create_test_db().await.expect("Failed to create test db");
        let chat_id = create_test_chat(&pool).await;

        let request = test_create_request(&chat_id);
        let process = create(&pool, request)
            .await
            .expect("Failed to create process");

        assert_eq!(process.chat_id, chat_id);
        assert_eq!(process.status, ProcessStatus::Running);
        assert_eq!(process.executor_action, "test action");
        assert_eq!(process.run_reason, RunReason::Terminal);
        assert!(process.exit_code.is_none());
        assert!(!process.id.is_empty());
    }

    #[tokio::test]
    async fn test_get_process() {
        let pool = create_test_db().await.expect("Failed to create test db");
        let chat_id = create_test_chat(&pool).await;

        let request = test_create_request(&chat_id);
        let created = create(&pool, request)
            .await
            .expect("Failed to create process");

        let fetched = get(&pool, &created.id)
            .await
            .expect("Failed to get process");

        assert_eq!(fetched.id, created.id);
        assert_eq!(fetched.chat_id, chat_id);
    }

    #[tokio::test]
    async fn test_get_process_not_found() {
        let pool = create_test_db().await.expect("Failed to create test db");

        let result = get(&pool, "non-existent-id").await;

        assert!(result.is_err());
        match result.unwrap_err() {
            ServiceError::NotFound { entity, id } => {
                assert_eq!(entity, "ExecutionProcess");
                assert_eq!(id, "non-existent-id");
            }
            other => panic!("Expected NotFound error, got: {:?}", other),
        }
    }

    #[tokio::test]
    async fn test_list_processes() {
        let pool = create_test_db().await.expect("Failed to create test db");
        let chat_id = create_test_chat(&pool).await;

        // Create multiple processes
        for i in 0..3 {
            let request = CreateProcessRequest::terminal(&chat_id, format!("action {}", i));
            create(&pool, request)
                .await
                .expect("Failed to create process");
        }

        let processes = list(&pool).await.expect("Failed to list processes");
        assert!(processes.len() >= 3);
    }

    #[tokio::test]
    async fn test_list_by_chat() {
        let pool = create_test_db().await.expect("Failed to create test db");
        let chat_id = create_test_chat(&pool).await;

        // Create multiple processes
        for i in 0..3 {
            let request = CreateProcessRequest::terminal(&chat_id, format!("action {}", i));
            create(&pool, request)
                .await
                .expect("Failed to create process");
        }

        let processes = list_by_chat(&pool, &chat_id)
            .await
            .expect("Failed to list processes");

        assert_eq!(processes.len(), 3);
    }

    #[tokio::test]
    async fn test_list_running() {
        let pool = create_test_db().await.expect("Failed to create test db");
        let chat_id = create_test_chat(&pool).await;

        // Create processes
        let request1 = test_create_request(&chat_id);
        let process1 = create(&pool, request1)
            .await
            .expect("Failed to create process 1");

        let request2 = test_create_request(&chat_id);
        let _process2 = create(&pool, request2)
            .await
            .expect("Failed to create process 2");

        // Complete one process
        complete(&pool, &process1.id, 0)
            .await
            .expect("Failed to complete process");

        // List running
        let running = list_running(&pool)
            .await
            .expect("Failed to list running processes");

        assert_eq!(running.len(), 1);
    }

    #[tokio::test]
    async fn test_list_running_by_chat() {
        let pool = create_test_db().await.expect("Failed to create test db");
        let chat_id = create_test_chat(&pool).await;

        // Create processes
        let request1 = test_create_request(&chat_id);
        let process1 = create(&pool, request1)
            .await
            .expect("Failed to create process 1");

        let request2 = test_create_request(&chat_id);
        let process2 = create(&pool, request2)
            .await
            .expect("Failed to create process 2");

        // Complete one process
        complete(&pool, &process1.id, 0)
            .await
            .expect("Failed to complete process");

        // List running
        let running = list_running_by_chat(&pool, &chat_id)
            .await
            .expect("Failed to list running processes");

        assert_eq!(running.len(), 1);
        assert_eq!(running[0].id, process2.id);
    }

    #[tokio::test]
    async fn test_update_status() {
        let pool = create_test_db().await.expect("Failed to create test db");
        let chat_id = create_test_chat(&pool).await;

        let request = test_create_request(&chat_id);
        let process = create(&pool, request)
            .await
            .expect("Failed to create process");

        assert_eq!(process.status, ProcessStatus::Running);

        let updated = update_status(&pool, &process.id, ProcessStatus::Completed, Some(0))
            .await
            .expect("Failed to update status");

        assert_eq!(updated.status, ProcessStatus::Completed);
        assert_eq!(updated.exit_code, Some(0));
        assert!(updated.completed_at.is_some());
    }

    #[tokio::test]
    async fn test_update_pid() {
        let pool = create_test_db().await.expect("Failed to create test db");
        let chat_id = create_test_chat(&pool).await;

        let request = test_create_request(&chat_id);
        let process = create(&pool, request)
            .await
            .expect("Failed to create process");

        assert!(process.pid.is_none());

        let updated = update_pid(&pool, &process.id, 12345)
            .await
            .expect("Failed to update PID");

        assert_eq!(updated.pid, Some(12345));
    }

    #[tokio::test]
    async fn test_update_after_commit() {
        let pool = create_test_db().await.expect("Failed to create test db");
        let chat_id = create_test_chat(&pool).await;

        let request = CreateProcessRequest::terminal(&chat_id, "test").with_before_commit("abc123");

        let process = create(&pool, request)
            .await
            .expect("Failed to create process");

        assert!(process.after_head_commit.is_none());
        assert_eq!(process.before_head_commit, Some("abc123".to_string()));

        let updated = update_after_commit(&pool, &process.id, "def456")
            .await
            .expect("Failed to update after commit");

        assert_eq!(updated.after_head_commit, Some("def456".to_string()));
    }

    #[tokio::test]
    async fn test_complete_success() {
        let pool = create_test_db().await.expect("Failed to create test db");
        let chat_id = create_test_chat(&pool).await;

        let request = test_create_request(&chat_id);
        let process = create(&pool, request)
            .await
            .expect("Failed to create process");

        let completed = complete(&pool, &process.id, 0)
            .await
            .expect("Failed to complete process");

        assert_eq!(completed.status, ProcessStatus::Completed);
        assert_eq!(completed.exit_code, Some(0));
    }

    #[tokio::test]
    async fn test_complete_failure() {
        let pool = create_test_db().await.expect("Failed to create test db");
        let chat_id = create_test_chat(&pool).await;

        let request = test_create_request(&chat_id);
        let process = create(&pool, request)
            .await
            .expect("Failed to create process");

        let completed = complete(&pool, &process.id, 1)
            .await
            .expect("Failed to complete process");

        assert_eq!(completed.status, ProcessStatus::Failed);
        assert_eq!(completed.exit_code, Some(1));
    }

    #[tokio::test]
    async fn test_mark_killed() {
        let pool = create_test_db().await.expect("Failed to create test db");
        let chat_id = create_test_chat(&pool).await;

        let request = test_create_request(&chat_id);
        let process = create(&pool, request)
            .await
            .expect("Failed to create process");

        let killed = mark_killed(&pool, &process.id)
            .await
            .expect("Failed to mark killed");

        assert_eq!(killed.status, ProcessStatus::Killed);
        assert!(killed.completed_at.is_some());
    }

    #[tokio::test]
    async fn test_delete_process() {
        let pool = create_test_db().await.expect("Failed to create test db");
        let chat_id = create_test_chat(&pool).await;

        let request = test_create_request(&chat_id);
        let process = create(&pool, request)
            .await
            .expect("Failed to create process");

        delete(&pool, &process.id)
            .await
            .expect("Failed to delete process");

        let result = get(&pool, &process.id).await;
        assert!(result.is_err());
    }

    #[tokio::test]
    async fn test_create_status_event() {
        let pool = create_test_db().await.expect("Failed to create test db");
        let chat_id = create_test_chat(&pool).await;

        let request = test_create_request(&chat_id);
        let process = create(&pool, request)
            .await
            .expect("Failed to create process");

        let event = create_status_event(&process);

        assert_eq!(event.process_id, process.id);
        assert_eq!(event.status, ProcessStatus::Running);
        assert!(event.exit_code.is_none());
    }

    #[tokio::test]
    async fn test_kill_running_process() {
        let pool = create_test_db().await.expect("Failed to create test db");
        let chat_id = create_test_chat(&pool).await;

        let service = ProcessService::new();

        let request = test_create_request(&chat_id);
        let process = create(&pool, request)
            .await
            .expect("Failed to create process");

        // Verify process is running
        assert_eq!(process.status, ProcessStatus::Running);

        // Kill the process
        let killed = service
            .kill(&pool, &process.id)
            .await
            .expect("Failed to kill process");

        // Verify process is now killed
        assert_eq!(killed.status, ProcessStatus::Killed);
        assert!(killed.completed_at.is_some());
    }

    #[tokio::test]
    async fn test_kill_non_running_process_fails() {
        let pool = create_test_db().await.expect("Failed to create test db");
        let chat_id = create_test_chat(&pool).await;

        let service = ProcessService::new();

        let request = test_create_request(&chat_id);
        let process = create(&pool, request)
            .await
            .expect("Failed to create process");

        // Complete the process first
        complete(&pool, &process.id, 0)
            .await
            .expect("Failed to complete process");

        // Attempt to kill already-completed process should fail
        let result = service.kill(&pool, &process.id).await;

        assert!(result.is_err());
        match result.unwrap_err() {
            ServiceError::Validation(msg) => {
                assert!(msg.contains("Cannot kill process"));
            }
            other => panic!("Expected Validation error, got: {:?}", other),
        }
    }

    #[tokio::test]
    async fn test_service_new_and_default() {
        let service = ProcessService::new();
        assert_eq!(service.running_count().await, 0);

        let service_default = ProcessService::default();
        assert_eq!(service_default.running_count().await, 0);
    }

    #[tokio::test]
    async fn test_different_run_reasons() {
        use crate::services::executor_profile;
        use openflow_contracts::CreateExecutorProfileRequest;

        let pool = create_test_db().await.expect("Failed to create test db");
        let chat_id = create_test_chat(&pool).await;

        // Create an executor profile for the coding agent test
        let profile_request = CreateExecutorProfileRequest::new("Test Profile", "claude");
        let profile = executor_profile::create(&pool, profile_request)
            .await
            .expect("Failed to create executor profile");

        let reasons = vec![
            (
                CreateProcessRequest::setup_script(&chat_id, "setup"),
                RunReason::Setupscript,
            ),
            (
                CreateProcessRequest::cleanup_script(&chat_id, "cleanup"),
                RunReason::Cleanupscript,
            ),
            (
                CreateProcessRequest::coding_agent(&chat_id, &profile.id, "coding"),
                RunReason::Codingagent,
            ),
            (
                CreateProcessRequest::dev_server(&chat_id, "devserver"),
                RunReason::Devserver,
            ),
            (
                CreateProcessRequest::terminal(&chat_id, "terminal"),
                RunReason::Terminal,
            ),
            (
                CreateProcessRequest::verification(&chat_id, "verify"),
                RunReason::Verification,
            ),
        ];

        for (request, expected_reason) in reasons {
            let process = create(&pool, request)
                .await
                .expect("Failed to create process");

            assert_eq!(process.run_reason, expected_reason);
        }
    }
}
