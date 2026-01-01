//! Process management service.
//!
//! Handles execution process lifecycle and management, including:
//! - Creating and tracking process records in the database
//! - Starting CLI tool processes (Claude Code, Gemini CLI, etc.)
//! - Killing running processes
//! - Sending input to processes
//! - Real-time output streaming via Tauri events
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
use sqlx::{FromRow, SqlitePool};
use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::Mutex;
use uuid::Uuid;

use crate::process::{ProcessSpawner, PtyConfig, PtyManager, PtySize, SpawnConfig};
use crate::types::{ExecutionProcess, ProcessStatus, ProcessStatusEvent, RunReason};

use super::{ServiceError, ServiceResult};

/// Internal struct for database row mapping.
/// Needed because ExecutionProcess has enum fields that don't directly map from strings.
#[derive(Debug, Clone, FromRow)]
struct ExecutionProcessRow {
    id: String,
    chat_id: String,
    executor_profile_id: Option<String>,
    status: String,
    exit_code: Option<i32>,
    executor_action: String,
    run_reason: String,
    before_head_commit: Option<String>,
    after_head_commit: Option<String>,
    pid: Option<i32>,
    started_at: String,
    completed_at: Option<String>,
    created_at: String,
    updated_at: String,
}

impl TryFrom<ExecutionProcessRow> for ExecutionProcess {
    type Error = ServiceError;

    fn try_from(row: ExecutionProcessRow) -> Result<Self, Self::Error> {
        let status: ProcessStatus = row
            .status
            .parse()
            .map_err(|e: String| ServiceError::Validation(e))?;

        let run_reason: RunReason = row
            .run_reason
            .parse()
            .map_err(|e: String| ServiceError::Validation(e))?;

        Ok(ExecutionProcess {
            id: row.id,
            chat_id: row.chat_id,
            executor_profile_id: row.executor_profile_id,
            status,
            exit_code: row.exit_code,
            executor_action: row.executor_action,
            run_reason,
            before_head_commit: row.before_head_commit,
            after_head_commit: row.after_head_commit,
            pid: row.pid,
            started_at: row.started_at,
            completed_at: row.completed_at,
            created_at: row.created_at,
            updated_at: row.updated_at,
        })
    }
}

/// Request to create a new process.
#[derive(Debug, Clone)]
pub struct CreateProcessRequest {
    pub chat_id: String,
    pub executor_profile_id: Option<String>,
    pub executor_action: String,
    pub run_reason: RunReason,
    pub before_head_commit: Option<String>,
}

/// Request to start a process with execution parameters.
#[derive(Debug, Clone)]
pub struct StartProcessRequest {
    pub command: String,
    pub args: Vec<String>,
    pub cwd: Option<std::path::PathBuf>,
    pub env: HashMap<String, String>,
    pub use_pty: bool,
    pub pty_cols: Option<u16>,
    pub pty_rows: Option<u16>,
}

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

/// Service for managing execution processes.
///
/// This service provides:
/// - Database CRUD operations for process records
/// - Process spawning (both PTY and non-PTY modes)
/// - Process lifecycle management (start, kill, send input)
/// - Tracking of running processes
pub struct ProcessService {
    /// PTY manager for interactive processes.
    pty_manager: Arc<PtyManager>,
    /// Map of process IDs to running process info.
    running_processes: Arc<Mutex<HashMap<String, RunningProcess>>>,
}

impl ProcessService {
    /// Create a new ProcessService instance.
    pub fn new() -> Self {
        Self {
            pty_manager: Arc::new(PtyManager::new()),
            running_processes: Arc::new(Mutex::new(HashMap::new())),
        }
    }

    /// Get the PTY manager for direct access.
    pub fn pty_manager(&self) -> ServiceResult<Arc<PtyManager>> {
        Ok(Arc::clone(&self.pty_manager))
    }

    /// Get a process by ID.
    pub async fn get(pool: &SqlitePool, id: &str) -> ServiceResult<ExecutionProcess> {
        debug!("get: fetching process id={}", id);

        let row = sqlx::query_as::<_, ExecutionProcessRow>(
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

        let process: ExecutionProcess = row.try_into()?;
        debug!(
            "get: found process id={} status={} chat_id={}",
            process.id, process.status, process.chat_id
        );
        Ok(process)
    }

    /// List processes for a chat.
    pub async fn list_by_chat(
        pool: &SqlitePool,
        chat_id: &str,
    ) -> ServiceResult<Vec<ExecutionProcess>> {
        debug!("list_by_chat: fetching processes for chat_id={}", chat_id);

        let rows = sqlx::query_as::<_, ExecutionProcessRow>(
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
            ORDER BY created_at DESC
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

        let processes: Vec<ExecutionProcess> = rows
            .into_iter()
            .map(|row| row.try_into())
            .collect::<Result<Vec<_>, _>>()?;

        debug!(
            "list_by_chat: found {} processes for chat_id={}",
            processes.len(),
            chat_id
        );
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

        let rows = sqlx::query_as::<_, ExecutionProcessRow>(
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
            ORDER BY created_at DESC
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

        let processes: Vec<ExecutionProcess> = rows
            .into_iter()
            .map(|row| row.try_into())
            .collect::<Result<Vec<_>, _>>()?;

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
            "create: creating process id={} chat_id={} action={} reason={}",
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
            "create: created process id={} chat_id={} action={} reason={}",
            id, request.chat_id, request.executor_action, request.run_reason
        );
        Self::get(pool, &id).await
    }

    /// Update process status.
    pub async fn update_status(
        pool: &SqlitePool,
        id: &str,
        status: ProcessStatus,
        exit_code: Option<i32>,
    ) -> ServiceResult<ExecutionProcess> {
        debug!(
            "update_status: updating process id={} to status={} exit_code={:?}",
            id, status, exit_code
        );

        // Verify process exists and get current status for logging
        let current = Self::get(pool, id).await?;

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
            "update_status: updated process id={} status={}->{} exit_code={:?}",
            id, current.status, status, exit_code
        );
        Self::get(pool, id).await
    }

    /// Update the PID of a process.
    pub async fn update_pid(
        pool: &SqlitePool,
        id: &str,
        pid: i32,
    ) -> ServiceResult<ExecutionProcess> {
        debug!("update_pid: updating process id={} to pid={}", id, pid);

        // Verify process exists
        Self::get(pool, id).await?;

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
        Self::get(pool, id).await
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
        Self::get(pool, id).await?;

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
        Self::get(pool, id).await
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

        Self::update_status(pool, id, status, Some(exit_code)).await
    }

    /// Mark a process as killed.
    pub async fn mark_killed(pool: &SqlitePool, id: &str) -> ServiceResult<ExecutionProcess> {
        info!("mark_killed: marking process id={} as killed", id);
        Self::update_status(pool, id, ProcessStatus::Killed, None).await
    }

    /// Kill a running process.
    ///
    /// This method attempts to kill the process using either PTY or standard
    /// process kill mechanisms, then updates the database record.
    pub async fn kill(&self, pool: &SqlitePool, id: &str) -> ServiceResult<ExecutionProcess> {
        info!("kill: attempting to kill process id={}", id);
        let process = Self::get(pool, id).await?;

        // Only kill running processes
        if process.status != ProcessStatus::Running {
            warn!(
                "kill: cannot kill process id={} with status={}",
                id, process.status
            );
            return Err(ServiceError::Validation(format!(
                "Cannot kill process {} with status {}",
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
        Self::mark_killed(pool, id).await
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
        let process = Self::create(pool, create_request).await?;
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

            info!(
                "start: PTY process started id={} command={}",
                process.id, start_request.command
            );
        } else {
            // Use standard process spawning
            debug!(
                "start: spawning standard process id={} command={} args={:?}",
                process.id, start_request.command, start_request.args
            );

            let config = SpawnConfig {
                command: start_request.command.clone(),
                args: start_request.args.clone(),
                cwd: start_request.cwd.clone(),
                env: start_request.env.clone(),
                inherit_env: true,
            };

            let child = ProcessSpawner::spawn(config).map_err(|e| {
                error!("start: failed to spawn process id={}: {}", process.id, e);
                ServiceError::Process(e.to_string())
            })?;

            let os_pid = child.id();
            debug!(
                "start: spawned standard process id={} os_pid={}",
                process.id, os_pid
            );

            // Update PID in database
            Self::update_pid(pool, &process.id, os_pid as i32).await?;

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

            info!(
                "start: standard process started id={} pid={} command={}",
                process.id, os_pid, start_request.command
            );
        }

        Self::get(pool, &process.id).await
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
    pub async fn is_running(&self, process_id: &str) -> ServiceResult<bool> {
        let running = self.running_processes.lock().await;
        let is_running = running.contains_key(process_id);
        debug!(
            "is_running: process id={} is_running={}",
            process_id, is_running
        );
        Ok(is_running)
    }

    /// Get the count of running processes.
    pub async fn running_count(&self) -> ServiceResult<usize> {
        let running = self.running_processes.lock().await;
        let count = running.len();
        debug!("running_count: {} processes running", count);
        Ok(count)
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

    /// Create a process status event for the given process.
    pub fn create_status_event(process: &ExecutionProcess) -> ServiceResult<ProcessStatusEvent> {
        Ok(ProcessStatusEvent {
            process_id: process.id.clone(),
            status: process.status.clone(),
            exit_code: process.exit_code,
        })
    }
}

impl Default for ProcessService {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::db::pool::init_db;
    use tempfile::TempDir;

    /// Test fixture that keeps the temp directory alive.
    struct TestDb {
        pool: SqlitePool,
        #[allow(dead_code)]
        temp_dir: TempDir,
    }

    /// Helper to create a test database pool.
    async fn setup_test_db() -> TestDb {
        let temp_dir = TempDir::new().expect("Failed to create temp dir");
        let pool = init_db(temp_dir.path().to_path_buf())
            .await
            .expect("Failed to initialize test database");
        TestDb { pool, temp_dir }
    }

    /// Helper to create test project and task.
    async fn create_test_task(pool: &SqlitePool) -> (String, String, String) {
        use crate::services::{ChatService, ProjectService, TaskService};
        use crate::types::{CreateChatRequest, CreateProjectRequest, CreateTaskRequest};

        let project_request = CreateProjectRequest {
            name: "Test Project".to_string(),
            git_repo_path: format!("/tmp/test-repo-{}", Uuid::new_v4()),
            base_branch: None,
            setup_script: None,
            dev_script: None,
            cleanup_script: None,
            copy_files: None,
            icon: None,
            rule_folders: None,
            always_included_rules: None,
            workflows_folder: None,
            verification_config: None,
        };
        let project = ProjectService::create(pool, project_request)
            .await
            .expect("Failed to create project");

        let task_request = CreateTaskRequest {
            project_id: project.id.clone(),
            title: "Test Task".to_string(),
            description: None,
            workflow_template: None,
            parent_task_id: None,
            base_branch: None,
        };
        let task = TaskService::create(pool, task_request)
            .await
            .expect("Failed to create task");

        let chat_request = CreateChatRequest {
            task_id: Some(task.id.clone()),
            project_id: project.id.clone(),
            title: Some("Test Chat".to_string()),
            chat_role: None,
            executor_profile_id: None,
            base_branch: None,
            initial_prompt: None,
            hidden_prompt: None,
            is_plan_container: None,
            main_chat_id: None,
            workflow_step_index: None,
        };
        let chat = ChatService::create(pool, chat_request)
            .await
            .expect("Failed to create chat");

        (project.id, task.id, chat.id)
    }

    /// Helper to create a test process request.
    fn test_create_request(chat_id: &str) -> CreateProcessRequest {
        CreateProcessRequest {
            chat_id: chat_id.to_string(),
            executor_profile_id: None,
            executor_action: "test action".to_string(),
            run_reason: RunReason::Codingagent,
            before_head_commit: None,
        }
    }

    #[tokio::test]
    async fn test_create_process() {
        let test_db = setup_test_db().await;
        let (_, _, chat_id) = create_test_task(&test_db.pool).await;

        let request = test_create_request(&chat_id);
        let process = ProcessService::create(&test_db.pool, request)
            .await
            .expect("Failed to create process");

        assert_eq!(process.chat_id, chat_id);
        assert_eq!(process.status, ProcessStatus::Running);
        assert_eq!(process.executor_action, "test action");
        assert_eq!(process.run_reason, RunReason::Codingagent);
        assert!(process.exit_code.is_none());
        assert!(!process.id.is_empty());
    }

    #[tokio::test]
    async fn test_get_process() {
        let test_db = setup_test_db().await;
        let (_, _, chat_id) = create_test_task(&test_db.pool).await;

        let request = test_create_request(&chat_id);
        let created = ProcessService::create(&test_db.pool, request)
            .await
            .expect("Failed to create process");

        let fetched = ProcessService::get(&test_db.pool, &created.id)
            .await
            .expect("Failed to get process");

        assert_eq!(fetched.id, created.id);
        assert_eq!(fetched.chat_id, chat_id);
    }

    #[tokio::test]
    async fn test_get_process_not_found() {
        let test_db = setup_test_db().await;

        let result = ProcessService::get(&test_db.pool, "non-existent-id").await;

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
    async fn test_list_by_chat() {
        let test_db = setup_test_db().await;
        let (_, _, chat_id) = create_test_task(&test_db.pool).await;

        // Create multiple processes
        for i in 0..3 {
            let request = CreateProcessRequest {
                chat_id: chat_id.clone(),
                executor_profile_id: None,
                executor_action: format!("action {}", i),
                run_reason: RunReason::Codingagent,
                before_head_commit: None,
            };
            ProcessService::create(&test_db.pool, request)
                .await
                .expect("Failed to create process");
        }

        let processes = ProcessService::list_by_chat(&test_db.pool, &chat_id)
            .await
            .expect("Failed to list processes");

        assert_eq!(processes.len(), 3);
    }

    #[tokio::test]
    async fn test_list_running_by_chat() {
        let test_db = setup_test_db().await;
        let (_, _, chat_id) = create_test_task(&test_db.pool).await;

        // Create processes
        let request1 = test_create_request(&chat_id);
        let process1 = ProcessService::create(&test_db.pool, request1)
            .await
            .expect("Failed to create process 1");

        let request2 = test_create_request(&chat_id);
        let process2 = ProcessService::create(&test_db.pool, request2)
            .await
            .expect("Failed to create process 2");

        // Complete one process
        ProcessService::complete(&test_db.pool, &process1.id, 0)
            .await
            .expect("Failed to complete process");

        // List running
        let running = ProcessService::list_running_by_chat(&test_db.pool, &chat_id)
            .await
            .expect("Failed to list running processes");

        assert_eq!(running.len(), 1);
        assert_eq!(running[0].id, process2.id);
    }

    #[tokio::test]
    async fn test_update_status() {
        let test_db = setup_test_db().await;
        let (_, _, chat_id) = create_test_task(&test_db.pool).await;

        let request = test_create_request(&chat_id);
        let process = ProcessService::create(&test_db.pool, request)
            .await
            .expect("Failed to create process");

        assert_eq!(process.status, ProcessStatus::Running);

        let updated = ProcessService::update_status(
            &test_db.pool,
            &process.id,
            ProcessStatus::Completed,
            Some(0),
        )
        .await
        .expect("Failed to update status");

        assert_eq!(updated.status, ProcessStatus::Completed);
        assert_eq!(updated.exit_code, Some(0));
        assert!(updated.completed_at.is_some());
    }

    #[tokio::test]
    async fn test_update_pid() {
        let test_db = setup_test_db().await;
        let (_, _, chat_id) = create_test_task(&test_db.pool).await;

        let request = test_create_request(&chat_id);
        let process = ProcessService::create(&test_db.pool, request)
            .await
            .expect("Failed to create process");

        assert!(process.pid.is_none());

        let updated = ProcessService::update_pid(&test_db.pool, &process.id, 12345)
            .await
            .expect("Failed to update PID");

        assert_eq!(updated.pid, Some(12345));
    }

    #[tokio::test]
    async fn test_update_after_commit() {
        let test_db = setup_test_db().await;
        let (_, _, chat_id) = create_test_task(&test_db.pool).await;

        let request = CreateProcessRequest {
            chat_id: chat_id.clone(),
            executor_profile_id: None,
            executor_action: "test".to_string(),
            run_reason: RunReason::Codingagent,
            before_head_commit: Some("abc123".to_string()),
        };

        let process = ProcessService::create(&test_db.pool, request)
            .await
            .expect("Failed to create process");

        assert!(process.after_head_commit.is_none());
        assert_eq!(process.before_head_commit, Some("abc123".to_string()));

        let updated = ProcessService::update_after_commit(&test_db.pool, &process.id, "def456")
            .await
            .expect("Failed to update after commit");

        assert_eq!(updated.after_head_commit, Some("def456".to_string()));
    }

    #[tokio::test]
    async fn test_complete_success() {
        let test_db = setup_test_db().await;
        let (_, _, chat_id) = create_test_task(&test_db.pool).await;

        let request = test_create_request(&chat_id);
        let process = ProcessService::create(&test_db.pool, request)
            .await
            .expect("Failed to create process");

        let completed = ProcessService::complete(&test_db.pool, &process.id, 0)
            .await
            .expect("Failed to complete process");

        assert_eq!(completed.status, ProcessStatus::Completed);
        assert_eq!(completed.exit_code, Some(0));
    }

    #[tokio::test]
    async fn test_complete_failure() {
        let test_db = setup_test_db().await;
        let (_, _, chat_id) = create_test_task(&test_db.pool).await;

        let request = test_create_request(&chat_id);
        let process = ProcessService::create(&test_db.pool, request)
            .await
            .expect("Failed to create process");

        let completed = ProcessService::complete(&test_db.pool, &process.id, 1)
            .await
            .expect("Failed to complete process");

        assert_eq!(completed.status, ProcessStatus::Failed);
        assert_eq!(completed.exit_code, Some(1));
    }

    #[tokio::test]
    async fn test_mark_killed() {
        let test_db = setup_test_db().await;
        let (_, _, chat_id) = create_test_task(&test_db.pool).await;

        let request = test_create_request(&chat_id);
        let process = ProcessService::create(&test_db.pool, request)
            .await
            .expect("Failed to create process");

        let killed = ProcessService::mark_killed(&test_db.pool, &process.id)
            .await
            .expect("Failed to mark killed");

        assert_eq!(killed.status, ProcessStatus::Killed);
        assert!(killed.completed_at.is_some());
    }

    #[tokio::test]
    async fn test_kill_running_process() {
        let test_db = setup_test_db().await;
        let (_, _, chat_id) = create_test_task(&test_db.pool).await;

        let service = ProcessService::new();

        let request = test_create_request(&chat_id);
        let process = ProcessService::create(&test_db.pool, request)
            .await
            .expect("Failed to create process");

        // Verify process is running
        assert_eq!(process.status, ProcessStatus::Running);

        // Kill the process
        let killed = service
            .kill(&test_db.pool, &process.id)
            .await
            .expect("Failed to kill process");

        // Verify process is now killed
        assert_eq!(killed.status, ProcessStatus::Killed);
        assert!(killed.completed_at.is_some());
    }

    #[tokio::test]
    async fn test_kill_non_running_process_fails() {
        let test_db = setup_test_db().await;
        let (_, _, chat_id) = create_test_task(&test_db.pool).await;

        let service = ProcessService::new();

        let request = test_create_request(&chat_id);
        let process = ProcessService::create(&test_db.pool, request)
            .await
            .expect("Failed to create process");

        // Complete the process first
        ProcessService::complete(&test_db.pool, &process.id, 0)
            .await
            .expect("Failed to complete process");

        // Attempt to kill already-completed process should fail
        let result = service.kill(&test_db.pool, &process.id).await;

        assert!(result.is_err());
        match result.unwrap_err() {
            ServiceError::Validation(msg) => {
                assert!(msg.contains("Cannot kill process"));
                assert!(msg.contains("completed"));
            }
            other => panic!("Expected Validation error, got: {:?}", other),
        }
    }

    #[tokio::test]
    async fn test_create_status_event() {
        let test_db = setup_test_db().await;
        let (_, _, chat_id) = create_test_task(&test_db.pool).await;

        let request = test_create_request(&chat_id);
        let process = ProcessService::create(&test_db.pool, request)
            .await
            .expect("Failed to create process");

        let event =
            ProcessService::create_status_event(&process).expect("Failed to create status event");

        assert_eq!(event.process_id, process.id);
        assert_eq!(event.status, ProcessStatus::Running);
        assert!(event.exit_code.is_none());
    }

    #[tokio::test]
    async fn test_service_new_and_default() {
        let service = ProcessService::new();
        assert_eq!(
            service
                .running_count()
                .await
                .expect("Failed to get running count"),
            0
        );

        let service_default = ProcessService::default();
        assert_eq!(
            service_default
                .running_count()
                .await
                .expect("Failed to get running count"),
            0
        );
    }

    #[tokio::test]
    async fn test_different_run_reasons() {
        let test_db = setup_test_db().await;
        let (_, _, chat_id) = create_test_task(&test_db.pool).await;

        let reasons = vec![
            RunReason::Setupscript,
            RunReason::Cleanupscript,
            RunReason::Codingagent,
            RunReason::Devserver,
            RunReason::Terminal,
            RunReason::Verification,
        ];

        for reason in reasons {
            let request = CreateProcessRequest {
                chat_id: chat_id.clone(),
                executor_profile_id: None,
                executor_action: format!("{:?} action", reason),
                run_reason: reason.clone(),
                before_head_commit: None,
            };

            let process = ProcessService::create(&test_db.pool, request)
                .await
                .expect("Failed to create process");

            assert_eq!(process.run_reason, reason);
        }
    }
}
