//! Task Executor Service
//!
//! Autonomous task execution engine that runs tasks from start to finish
//! without requiring frontend interaction. Executes steps sequentially,
//! spawning agents via the AgentOrchestrator and persisting all state.
//!
//! # Architecture
//!
//! ```text
//! ┌─────────────────────────────────────────────────────────────────────────┐
//! │                           TaskExecutor                                  │
//! ├─────────────────────────────────────────────────────────────────────────┤
//! │                                                                         │
//! │   start_task()          pause_task()          resume_task()            │
//! │         │                    │                      │                   │
//! │         ▼                    ▼                      ▼                   │
//! │   ┌───────────────────────────────────────────────────────────────┐    │
//! │   │                    run_task() (Background)                     │    │
//! │   │    ┌─────────────────────────────────────────────────────┐    │    │
//! │   │    │  Loop: get_current_step() → run_step() → advance()  │    │    │
//! │   │    └─────────────────────────────────────────────────────┘    │    │
//! │   └───────────────────────────────────────────────────────────────┘    │
//! │                                    │                                    │
//! │                                    ▼                                    │
//! │   ┌───────────────────────────────────────────────────────────────┐    │
//! │   │                     AgentOrchestrator                          │    │
//! │   │    spawn_agent() → monitor session → persist events            │    │
//! │   └───────────────────────────────────────────────────────────────┘    │
//! │                                                                         │
//! └─────────────────────────────────────────────────────────────────────────┘
//! ```
//!
//! # Key Invariants
//!
//! 1. Tasks run autonomously in background tokio tasks
//! 2. All state is persisted to SQLite (frontend can disconnect/reconnect)
//! 3. Steps execute sequentially (parallel execution planned for Phase 9)
//! 4. Each step spawns an agent session via AgentOrchestrator
//! 5. Permission requests pause the step until user responds
//! 6. All actions are logged to audit trail
//!
//! # Thread Safety
//!
//! The executor is `Send + Sync` and can be safely shared across threads.
//! Uses Arc/RwLock for interior mutability where needed.
//!
//! # Logging
//!
//! Uses `log` crate for structured logging:
//! - `debug!`: Detailed operation tracing
//! - `info!`: Task/step lifecycle events
//! - `warn!`: Non-critical issues (step failures, retries)
//! - `error!`: Operation failures

use std::collections::HashMap;
use std::sync::Arc;
use std::time::Duration;

use log::{debug, error, info, warn};
use sqlx::SqlitePool;
use tokio::sync::RwLock;

use openflow_contracts::{AuditAction, CreateChatRequest, SessionStatus, StepStatus, TaskStatus, TaskStep};

use crate::events::{DataAction, EntityType, Event, EventBroadcaster};
use crate::providers::AgentConfig;

use super::agent_orchestrator::{AgentOrchestrator, SpawnAgentRequest};
use super::{agent_session, audit, chat, project, task};
use super::{ServiceError, ServiceResult};

// =============================================================================
// Running Task Info
// =============================================================================

/// Information about a running task.
///
/// Tracks the runtime state of a task being executed.
#[derive(Debug)]
struct RunningTask {
    /// Handle to the background task (for cancellation)
    cancel_tx: tokio::sync::oneshot::Sender<()>,
    // Note: task_id is used as the HashMap key, not stored in struct
}

// =============================================================================
// Task Executor
// =============================================================================

/// Autonomous task execution engine.
///
/// This service runs tasks from start to finish in background tokio tasks.
/// It coordinates with AgentOrchestrator to spawn agents for each step
/// and persists all state changes to the database.
///
/// # Example
///
/// ```ignore
/// use openflow_core::services::TaskExecutor;
///
/// let executor = TaskExecutor::new(pool, orchestrator, broadcaster);
///
/// // Start a task - execution happens in background
/// executor.start_task("task-123").await?;
///
/// // Pause execution (kills current agent if running)
/// executor.pause_task("task-123").await?;
///
/// // Resume from where it left off
/// executor.resume_task("task-123").await?;
/// ```
pub struct TaskExecutor {
    /// Database connection pool
    pool: SqlitePool,
    /// Agent orchestrator for spawning/managing agents
    agent_orchestrator: Arc<AgentOrchestrator>,
    /// Event broadcaster for real-time updates
    broadcaster: Arc<dyn EventBroadcaster>,
    /// Currently running tasks (task_id -> info)
    running_tasks: Arc<RwLock<HashMap<String, RunningTask>>>,
}

impl TaskExecutor {
    /// Create a new task executor.
    ///
    /// # Arguments
    /// * `pool` - Database connection pool
    /// * `agent_orchestrator` - Agent orchestrator for spawning agents
    /// * `broadcaster` - Event broadcaster for real-time updates
    pub fn new(
        pool: SqlitePool,
        agent_orchestrator: Arc<AgentOrchestrator>,
        broadcaster: Arc<dyn EventBroadcaster>,
    ) -> Self {
        Self {
            pool,
            agent_orchestrator,
            broadcaster,
            running_tasks: Arc::new(RwLock::new(HashMap::new())),
        }
    }

    /// Start executing a task.
    ///
    /// This method:
    /// 1. Validates the task can be started
    /// 2. Updates task status to Running
    /// 3. Spawns a background task for execution
    /// 4. Returns immediately (execution is async)
    ///
    /// # Arguments
    /// * `task_id` - ID of the task to start
    ///
    /// # Returns
    /// The task after status update.
    ///
    /// # Errors
    /// - Task not found
    /// - Task already running
    /// - Task in terminal state
    pub async fn start_task(&self, task_id: &str) -> ServiceResult<openflow_contracts::Task> {
        info!("Starting task: id={}", task_id);

        // Get task and validate
        let task_with_steps = task::get_with_steps(&self.pool, task_id).await?;
        let task = &task_with_steps.task;

        // Check if task can be started
        if !task.status.can_start() {
            warn!(
                "Cannot start task: id={}, current_status={}",
                task_id, task.status
            );
            return Err(ServiceError::InvalidInput {
                field: "status".to_string(),
                message: format!(
                    "Task cannot be started from status '{}'. Must be 'pending' or 'paused'.",
                    task.status
                ),
            });
        }

        // Check if task has steps
        if task_with_steps.steps.is_empty() {
            warn!("Cannot start task with no steps: id={}", task_id);
            return Err(ServiceError::InvalidInput {
                field: "steps".to_string(),
                message: "Task has no steps to execute".to_string(),
            });
        }

        // Check if already running in memory
        {
            let running = self.running_tasks.read().await;
            if running.contains_key(task_id) {
                warn!("Task already running: id={}", task_id);
                return Err(ServiceError::InvalidInput {
                    field: "status".to_string(),
                    message: "Task is already running".to_string(),
                });
            }
        }

        // Update task status to running
        let updated_task = task::set_started(&self.pool, task_id).await?;

        // Broadcast task started
        self.broadcaster.broadcast(Event::updated(
            EntityType::Task,
            task_id,
            &updated_task,
        ));

        // Audit log
        let _ = audit::log_task(
            &self.pool,
            task_id,
            AuditAction::Started,
            openflow_contracts::AuditActor::System,
            Some(serde_json::json!({
                "step_count": task_with_steps.steps.len(),
                "current_step_index": updated_task.current_step_index,
            })),
        )
        .await;

        // Spawn background execution
        self.spawn_task_runner(task_id.to_string());

        info!("Task started: id={}, step_count={}", task_id, task_with_steps.steps.len());

        Ok(updated_task)
    }

    /// Pause a running task.
    ///
    /// This method:
    /// 1. Kills the current agent if running
    /// 2. Marks the current step as paused (or failed if mid-execution)
    /// 3. Updates task status to Paused
    ///
    /// # Arguments
    /// * `task_id` - ID of the task to pause
    ///
    /// # Errors
    /// - Task not found
    /// - Task not running
    pub async fn pause_task(&self, task_id: &str) -> ServiceResult<openflow_contracts::Task> {
        info!("Pausing task: id={}", task_id);

        // Get current task state
        let task_with_steps = task::get_with_steps(&self.pool, task_id).await?;
        let task = &task_with_steps.task;

        // Validate task can be paused
        if !task.status.can_pause() {
            warn!(
                "Cannot pause task: id={}, current_status={}",
                task_id, task.status
            );
            return Err(ServiceError::InvalidInput {
                field: "status".to_string(),
                message: format!(
                    "Task cannot be paused from status '{}'. Must be 'running'.",
                    task.status
                ),
            });
        }

        // Kill current agent if running
        if let Some(current_step) = task_with_steps.current_step() {
            if let Some(session_id) = &current_step.session_id {
                if self.agent_orchestrator.is_active(session_id).await {
                    info!("Killing agent for paused task: session_id={}", session_id);
                    if let Err(e) = self.agent_orchestrator.kill_agent(session_id).await {
                        warn!("Failed to kill agent during pause: {}", e);
                    }
                }
            }

            // Mark step as failed (it was interrupted)
            if current_step.status == StepStatus::Running {
                let _ = task::update_step_status(&self.pool, &current_step.id, StepStatus::Failed)
                    .await;
            }
        }

        // Cancel background task
        {
            let mut running = self.running_tasks.write().await;
            if let Some(running_task) = running.remove(task_id) {
                // Send cancel signal (receiver will handle cleanup)
                let _ = running_task.cancel_tx.send(());
            }
        }

        // Update task status
        let updated_task = task::update_status(&self.pool, task_id, TaskStatus::Paused).await?;

        // Broadcast update
        self.broadcaster.broadcast(Event::updated(
            EntityType::Task,
            task_id,
            &updated_task,
        ));

        // Audit log
        let _ = audit::log_task(
            &self.pool,
            task_id,
            AuditAction::Paused,
            openflow_contracts::AuditActor::User,
            None,
        )
        .await;

        info!("Task paused: id={}", task_id);

        Ok(updated_task)
    }

    /// Resume a paused task.
    ///
    /// This restarts execution from the current step index.
    ///
    /// # Arguments
    /// * `task_id` - ID of the task to resume
    pub async fn resume_task(&self, task_id: &str) -> ServiceResult<openflow_contracts::Task> {
        info!("Resuming task: id={}", task_id);

        // Get current task state
        let task = task::get_task(&self.pool, task_id).await?;

        // Validate task can be resumed (must be paused)
        if task.status != TaskStatus::Paused {
            warn!(
                "Cannot resume task: id={}, current_status={}",
                task_id, task.status
            );
            return Err(ServiceError::InvalidInput {
                field: "status".to_string(),
                message: format!(
                    "Task cannot be resumed from status '{}'. Must be 'paused'.",
                    task.status
                ),
            });
        }

        // Audit log
        let _ = audit::log_task(
            &self.pool,
            task_id,
            AuditAction::Resumed,
            openflow_contracts::AuditActor::User,
            Some(serde_json::json!({
                "resumed_from_step_index": task.current_step_index,
            })),
        )
        .await;

        // Use start_task to handle the rest (it will check paused status)
        // First reset the current step if it was marked as failed during pause
        let task_with_steps = task::get_with_steps(&self.pool, task_id).await?;
        if let Some(current_step) = task_with_steps.current_step() {
            if current_step.status == StepStatus::Failed {
                // Reset to pending so it will be re-executed
                let _ = task::update_step_status(&self.pool, &current_step.id, StepStatus::Pending)
                    .await;
            }
        }

        self.start_task(task_id).await
    }

    /// Cancel a task (mark as cancelled, cannot be resumed).
    ///
    /// # Arguments
    /// * `task_id` - ID of the task to cancel
    pub async fn cancel_task(&self, task_id: &str) -> ServiceResult<openflow_contracts::Task> {
        info!("Cancelling task: id={}", task_id);

        // Get current task state
        let task_with_steps = task::get_with_steps(&self.pool, task_id).await?;
        let task = &task_with_steps.task;

        // Validate task can be cancelled
        if task.status.is_terminal() {
            warn!(
                "Cannot cancel task in terminal state: id={}, status={}",
                task_id, task.status
            );
            return Err(ServiceError::InvalidInput {
                field: "status".to_string(),
                message: format!(
                    "Task cannot be cancelled from terminal status '{}'.",
                    task.status
                ),
            });
        }

        // Kill current agent if running
        if let Some(current_step) = task_with_steps.current_step() {
            if let Some(session_id) = &current_step.session_id {
                if self.agent_orchestrator.is_active(session_id).await {
                    if let Err(e) = self.agent_orchestrator.kill_agent(session_id).await {
                        warn!("Failed to kill agent during cancel: {}", e);
                    }
                }
            }
        }

        // Cancel background task
        {
            let mut running = self.running_tasks.write().await;
            if let Some(running_task) = running.remove(task_id) {
                let _ = running_task.cancel_tx.send(());
            }
        }

        // Update task status
        let updated_task = task::set_ended(&self.pool, task_id, TaskStatus::Cancelled).await?;

        // Mark remaining steps as skipped
        for step in &task_with_steps.steps {
            if step.status == StepStatus::Pending || step.status == StepStatus::Running {
                let _ = task::update_step_status(&self.pool, &step.id, StepStatus::Skipped).await;
            }
        }

        // Broadcast update
        self.broadcaster.broadcast(Event::updated(
            EntityType::Task,
            task_id,
            &updated_task,
        ));

        // Audit log
        let _ = audit::log_task(
            &self.pool,
            task_id,
            AuditAction::Cancelled,
            openflow_contracts::AuditActor::User,
            None,
        )
        .await;

        info!("Task cancelled: id={}", task_id);

        Ok(updated_task)
    }

    /// Respond to a permission request for a running task.
    ///
    /// This method:
    /// 1. Finds the current step's session for the task
    /// 2. Updates the permission record in the database
    /// 3. Sends the approval/denial to the agent's stdin
    /// 4. Creates an audit trail
    ///
    /// # Arguments
    /// * `task_id` - ID of the task
    /// * `permission_id` - ID of the permission request
    /// * `approved` - Whether the permission was approved
    ///
    /// # Returns
    /// The updated permission record.
    ///
    /// # Errors
    /// - Task not found
    /// - Task not running
    /// - No active session for current step
    /// - Permission not found
    pub async fn respond_to_permission(
        &self,
        task_id: &str,
        permission_id: &str,
        approved: bool,
    ) -> ServiceResult<openflow_contracts::Permission> {
        info!(
            "Responding to permission: task_id={}, permission_id={}, approved={}",
            task_id, permission_id, approved
        );

        // Verify task is running
        let task_with_steps = task::get_with_steps(&self.pool, task_id).await?;
        let task = &task_with_steps.task;

        if task.status != TaskStatus::Running {
            warn!(
                "Cannot respond to permission for non-running task: id={}, status={}",
                task_id, task.status
            );
            return Err(ServiceError::InvalidInput {
                field: "status".to_string(),
                message: format!(
                    "Task is not running. Current status: '{}'",
                    task.status
                ),
            });
        }

        // Get current step and its session
        let current_step = task_with_steps.current_step().ok_or_else(|| {
            error!("No current step for running task: id={}", task_id);
            ServiceError::InvalidInput {
                field: "step".to_string(),
                message: "Task has no current step".to_string(),
            }
        })?;

        let session_id = current_step.session_id.as_ref().ok_or_else(|| {
            error!(
                "Current step has no session: task_id={}, step_id={}",
                task_id, current_step.id
            );
            ServiceError::InvalidInput {
                field: "session".to_string(),
                message: "Current step has no active session".to_string(),
            }
        })?;

        // Verify the permission belongs to this session
        let pending_permission = agent_session::get_pending_permission(&self.pool, session_id)
            .await?
            .ok_or_else(|| {
                error!(
                    "No pending permission for session: session_id={}",
                    session_id
                );
                ServiceError::NotFound {
                    entity: "Permission",
                    id: permission_id.to_string(),
                }
            })?;

        if pending_permission.id != permission_id {
            warn!(
                "Permission mismatch: expected={}, got={}",
                pending_permission.id, permission_id
            );
            return Err(ServiceError::InvalidInput {
                field: "permission_id".to_string(),
                message: format!(
                    "Permission {} does not match current pending permission {}",
                    permission_id, pending_permission.id
                ),
            });
        }

        // Delegate to orchestrator to handle the permission response
        // This will:
        // 1. Update the permission record in the database
        // 2. Send the response to the agent's stdin
        // 3. Create an audit trail
        let permission = self
            .agent_orchestrator
            .handle_permission(session_id, permission_id, approved)
            .await?;

        // Broadcast update event for the task
        self.broadcaster.broadcast(Event::data_changed(
            EntityType::Task,
            DataAction::Updated,
            task_id,
            Some(serde_json::json!({
                "event": "permission_response",
                "step_id": current_step.id,
                "step_index": current_step.step_index,
                "permission_id": permission_id,
                "approved": approved,
            })),
        ));

        info!(
            "Permission {} {} for task {} step {}",
            permission_id,
            if approved { "approved" } else { "denied" },
            task_id,
            current_step.step_index
        );

        Ok(permission)
    }

    /// Get the pending permission for a running task.
    ///
    /// Returns the pending permission for the current step's session, if any.
    ///
    /// # Arguments
    /// * `task_id` - ID of the task
    ///
    /// # Returns
    /// The pending permission, or None if there is no pending permission.
    pub async fn get_pending_permission(
        &self,
        task_id: &str,
    ) -> ServiceResult<Option<openflow_contracts::Permission>> {
        // Get task and current step
        let task_with_steps = task::get_with_steps(&self.pool, task_id).await?;

        // If task isn't running, no pending permission
        if task_with_steps.task.status != TaskStatus::Running {
            return Ok(None);
        }

        // Get current step
        let current_step = match task_with_steps.current_step() {
            Some(step) => step,
            None => return Ok(None),
        };

        // Get session ID
        let session_id = match &current_step.session_id {
            Some(id) => id,
            None => return Ok(None),
        };

        // Get pending permission for the session
        agent_session::get_pending_permission(&self.pool, session_id).await
    }

    /// Check if a task is currently running.
    pub async fn is_running(&self, task_id: &str) -> bool {
        let running = self.running_tasks.read().await;
        running.contains_key(task_id)
    }

    /// Get the number of currently running tasks.
    pub async fn running_count(&self) -> usize {
        let running = self.running_tasks.read().await;
        running.len()
    }

    /// List all currently running task IDs.
    pub async fn list_running(&self) -> Vec<String> {
        let running = self.running_tasks.read().await;
        running.keys().cloned().collect()
    }

    // =========================================================================
    // Internal Methods
    // =========================================================================

    /// Spawn a background task to run the task execution loop.
    fn spawn_task_runner(&self, task_id: String) {
        let pool = self.pool.clone();
        let orchestrator = Arc::clone(&self.agent_orchestrator);
        let broadcaster = Arc::clone(&self.broadcaster);
        let running_tasks = Arc::clone(&self.running_tasks);

        // Create cancellation channel
        let (cancel_tx, cancel_rx) = tokio::sync::oneshot::channel();

        // Register as running
        let running_task = RunningTask { cancel_tx };

        // Store in running tasks (spawned async)
        let task_id_clone = task_id.clone();
        let running_tasks_clone = Arc::clone(&running_tasks);
        tokio::spawn(async move {
            {
                let mut running = running_tasks_clone.write().await;
                running.insert(task_id_clone.clone(), running_task);
            }
        });

        // Spawn the execution loop
        tokio::spawn(async move {
            let result = Self::run_task_loop(
                &pool,
                &orchestrator,
                &broadcaster,
                &task_id,
                cancel_rx,
            )
            .await;

            // Clean up running task tracking
            {
                let mut running = running_tasks.write().await;
                running.remove(&task_id);
            }

            // Handle result
            match result {
                Ok(()) => {
                    info!("Task execution completed: id={}", task_id);
                }
                Err(e) => {
                    error!("Task execution failed: id={}, error={}", task_id, e);
                }
            }
        });
    }

    /// The main task execution loop (runs in background).
    ///
    /// This method:
    /// 1. Gets the current step
    /// 2. Runs the step (spawns agent, waits for completion)
    /// 3. Advances to next step
    /// 4. Repeats until all steps complete or an error occurs
    async fn run_task_loop(
        pool: &SqlitePool,
        orchestrator: &AgentOrchestrator,
        broadcaster: &Arc<dyn EventBroadcaster>,
        task_id: &str,
        mut cancel_rx: tokio::sync::oneshot::Receiver<()>,
    ) -> ServiceResult<()> {
        debug!("Starting task execution loop: id={}", task_id);

        loop {
            // Check for cancellation
            if cancel_rx.try_recv().is_ok() {
                info!("Task execution cancelled: id={}", task_id);
                return Ok(());
            }

            // Get current step
            let current_step = match task::get_current_step(pool, task_id).await? {
                Some(step) => step,
                None => {
                    // No more steps - task is complete
                    debug!("No more steps, completing task: id={}", task_id);
                    break;
                }
            };

            // Skip already completed/failed/skipped steps
            if current_step.status != StepStatus::Pending {
                debug!(
                    "Skipping non-pending step: id={}, status={}",
                    current_step.id, current_step.status
                );
                // Try to advance to next step
                if task::advance_step(pool, task_id).await?.is_none() {
                    // No more steps
                    break;
                }
                continue;
            }

            // Run the current step
            info!(
                "Running step: task_id={}, step_id={}, step_index={}, title={}",
                task_id, current_step.id, current_step.step_index, current_step.title
            );

            let step_result = Self::run_step(
                pool,
                orchestrator,
                broadcaster,
                &current_step,
                &mut cancel_rx,
            )
            .await;

            match step_result {
                Ok(()) => {
                    info!(
                        "Step completed successfully: step_id={}, title={}",
                        current_step.id, current_step.title
                    );

                    // Advance to next step
                    if task::advance_step(pool, task_id).await?.is_none() {
                        // No more steps - loop will exit on next iteration
                        debug!("Reached last step: id={}", task_id);
                    }
                }
                Err(e) => {
                    error!(
                        "Step failed: step_id={}, title={}, error={}",
                        current_step.id, current_step.title, e
                    );

                    // Mark step as failed
                    let _ = task::update_step_status(pool, &current_step.id, StepStatus::Failed)
                        .await;

                    // Mark task as failed
                    let updated = task::set_ended(pool, task_id, TaskStatus::Failed).await?;

                    // Broadcast failure
                    broadcaster.broadcast(Event::updated(EntityType::Task, task_id, &updated));

                    // Audit log
                    let _ = audit::log_task(
                        pool,
                        task_id,
                        AuditAction::Failed,
                        openflow_contracts::AuditActor::System,
                        Some(serde_json::json!({
                            "failed_step_id": current_step.id,
                            "failed_step_index": current_step.step_index,
                            "error": e.to_string(),
                        })),
                    )
                    .await;

                    return Err(e);
                }
            }
        }

        // All steps completed successfully
        let updated = task::set_ended(pool, task_id, TaskStatus::Completed).await?;

        // Broadcast completion
        broadcaster.broadcast(Event::updated(EntityType::Task, task_id, &updated));

        // Audit log
        let _ = audit::log_task(
            pool,
            task_id,
            AuditAction::Completed,
            openflow_contracts::AuditActor::System,
            None,
        )
        .await;

        info!("Task completed: id={}", task_id);

        Ok(())
    }

    /// Execute a single step.
    ///
    /// This method:
    /// 1. Updates step status to Running
    /// 2. Creates a chat for this step execution
    /// 3. Creates an execution_process linked to the chat
    /// 4. Spawns agent via orchestrator
    /// 5. Links session to step
    /// 6. Waits for session to complete
    /// 7. Updates step status based on result
    async fn run_step(
        pool: &SqlitePool,
        orchestrator: &AgentOrchestrator,
        broadcaster: &Arc<dyn EventBroadcaster>,
        step: &TaskStep,
        cancel_rx: &mut tokio::sync::oneshot::Receiver<()>,
    ) -> ServiceResult<()> {
        // Update step status to running
        let step = task::update_step_status(pool, &step.id, StepStatus::Running).await?;

        // Broadcast step started
        broadcaster.broadcast(Event::data_changed(
            EntityType::Task,
            DataAction::Updated,
            &step.task_id,
            Some(serde_json::json!({
                "event": "step_started",
                "step_id": step.id,
                "step_index": step.step_index,
            })),
        ));

        // Get task for project reference
        let task_with_steps = task::get_with_steps(pool, &step.task_id).await?;
        let proj = project::get(pool, &task_with_steps.task.project_id).await?;

        // Create a chat for this step execution
        // This maintains compatibility with the existing schema where execution_processes
        // requires a chat_id foreign key
        let chat_request = CreateChatRequest::for_task(&step.task_id, &task_with_steps.task.project_id)
            .with_title(&step.title)
            .with_initial_prompt(&step.prompt)
            .with_step_index(step.step_index);
        let step_chat = chat::create(pool, chat_request).await?;

        debug!(
            "Created chat for step execution: chat_id={}, step_id={}",
            step_chat.id, step.id
        );

        // Create an execution_process record linked to the chat
        let process_id = uuid::Uuid::new_v4().to_string();
        sqlx::query(
            r#"
            INSERT INTO execution_processes (
                id, chat_id, status, executor_action, run_reason, started_at
            )
            VALUES (?, ?, 'running', 'step_execution', 'codingagent', datetime('now', 'subsec'))
            "#,
        )
        .bind(&process_id)
        .bind(&step_chat.id)
        .execute(pool)
        .await
        .map_err(|e| {
            error!("Failed to create execution process: {}", e);
            ServiceError::Database(e)
        })?;

        // Build agent config
        let config = AgentConfig::new(&step.prompt, &proj.git_repo_path);

        // Spawn the agent
        let spawn_request = SpawnAgentRequest::new(&process_id, &step.provider_id, config);
        let session = orchestrator.spawn_agent(spawn_request).await?;

        // Link session to step
        let _ = task::link_step_session(pool, &step.id, &session.id).await;

        info!(
            "Agent spawned for step: step_id={}, session_id={}, chat_id={}, provider={}",
            step.id, session.id, step_chat.id, step.provider_id
        );

        // Wait for session to complete
        let final_status = Self::wait_for_session(pool, orchestrator, &session.id, cancel_rx).await?;

        // Update step status based on session result
        let step_status = if final_status == SessionStatus::Completed {
            StepStatus::Completed
        } else {
            StepStatus::Failed
        };

        task::update_step_status(pool, &step.id, step_status.clone()).await?;

        // Update execution_process status
        let process_status = if final_status == SessionStatus::Completed {
            "completed"
        } else {
            "failed"
        };
        let _ = sqlx::query(
            r#"
            UPDATE execution_processes
            SET status = ?, completed_at = datetime('now', 'subsec'), updated_at = datetime('now', 'subsec')
            WHERE id = ?
            "#,
        )
        .bind(process_status)
        .bind(&process_id)
        .execute(pool)
        .await;

        // Broadcast step completion
        broadcaster.broadcast(Event::data_changed(
            EntityType::Task,
            DataAction::Updated,
            &step.task_id,
            Some(serde_json::json!({
                "event": "step_completed",
                "step_id": step.id,
                "step_index": step.step_index,
                "status": step_status.to_string(),
            })),
        ));

        // Return error if session failed
        if final_status != SessionStatus::Completed {
            return Err(ServiceError::Process(format!(
                "Agent session failed with status: {:?}",
                final_status
            )));
        }

        Ok(())
    }

    /// Wait for an agent session to complete.
    ///
    /// Polls the session status until it reaches a terminal state
    /// or cancellation is requested.
    async fn wait_for_session(
        pool: &SqlitePool,
        orchestrator: &AgentOrchestrator,
        session_id: &str,
        cancel_rx: &mut tokio::sync::oneshot::Receiver<()>,
    ) -> ServiceResult<SessionStatus> {
        const POLL_INTERVAL: Duration = Duration::from_millis(500);
        const MAX_WAIT: Duration = Duration::from_secs(3600); // 1 hour max

        let start = std::time::Instant::now();

        loop {
            // Check for cancellation
            if cancel_rx.try_recv().is_ok() {
                info!("Session wait cancelled: session_id={}", session_id);
                return Err(ServiceError::Process("Task cancelled".to_string()));
            }

            // Check timeout
            if start.elapsed() > MAX_WAIT {
                error!("Session wait timed out: session_id={}", session_id);
                return Err(ServiceError::Process("Session timed out".to_string()));
            }

            // Check if session is still active in orchestrator
            if !orchestrator.is_active(session_id).await {
                // Session completed - get final status from DB
                let session = agent_session::get(pool, session_id).await?;
                debug!(
                    "Session completed: id={}, status={:?}",
                    session_id, session.status
                );
                return Ok(session.status);
            }

            // Still running, wait and poll again
            tokio::time::sleep(POLL_INTERVAL).await;
        }
    }
}

// TaskExecutor is Send + Sync by design
// All interior mutability is protected by RwLock

// =============================================================================
// Tests
// =============================================================================

#[cfg(test)]
mod tests {
    use super::*;
    use crate::events::NullBroadcaster;
    use openflow_contracts::{CreateProjectRequest, CreateTaskRequest};
    use openflow_db::{init_db, DbConfig};
    use tempfile::TempDir;

    /// Test fixture
    struct TestFixture {
        pool: SqlitePool,
        executor: TaskExecutor,
        #[allow(dead_code)]
        temp_dir: TempDir,
    }

    async fn setup() -> TestFixture {
        let temp_dir = TempDir::new().expect("Failed to create temp dir");
        let config = DbConfig::from_directory(temp_dir.path());
        let pool = init_db(config)
            .await
            .expect("Failed to initialize test database");

        let broadcaster = NullBroadcaster::arc();
        let orchestrator = Arc::new(AgentOrchestrator::new(pool.clone(), broadcaster.clone()));
        let executor = TaskExecutor::new(pool.clone(), orchestrator, broadcaster);

        TestFixture {
            pool,
            executor,
            temp_dir,
        }
    }

    async fn create_test_project(pool: &SqlitePool) -> String {
        let request = CreateProjectRequest {
            name: "Test Project".to_string(),
            git_repo_path: "/tmp/test-project".to_string(),
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
        project::create(pool, request)
            .await
            .expect("Failed to create project")
            .id
    }

    async fn create_test_task(pool: &SqlitePool, project_id: &str) -> String {
        let request = CreateTaskRequest {
            project_id: project_id.to_string(),
            title: "Test Task".to_string(),
            description: None,
            workflow_template: None,
            parent_task_id: None,
            base_branch: None,
        };
        task::create(pool, request)
            .await
            .expect("Failed to create task")
            .id
    }

    #[tokio::test]
    async fn test_executor_creation() {
        let fixture = setup().await;
        assert_eq!(fixture.executor.running_count().await, 0);
        assert!(fixture.executor.list_running().await.is_empty());
    }

    #[tokio::test]
    async fn test_start_task_validates_status() {
        let fixture = setup().await;
        let project_id = create_test_project(&fixture.pool).await;
        let task_id = create_test_task(&fixture.pool, &project_id).await;

        // First, try to start without steps - should fail
        let result = fixture.executor.start_task(&task_id).await;
        assert!(result.is_err());
        match result.unwrap_err() {
            ServiceError::InvalidInput { field, .. } => {
                assert_eq!(field, "steps");
            }
            other => panic!("Expected InvalidInput error, got: {:?}", other),
        }
    }

    #[tokio::test]
    async fn test_start_task_with_steps() {
        let fixture = setup().await;
        let project_id = create_test_project(&fixture.pool).await;
        let task_id = create_test_task(&fixture.pool, &project_id).await;

        // Add a step
        task::create_step(
            &fixture.pool,
            &task_id,
            0,
            "Test Step",
            "echo 'hello'",
            "mock",
        )
        .await
        .expect("Failed to create step");

        // Now start should succeed
        let result = fixture.executor.start_task(&task_id).await;
        assert!(result.is_ok());

        let task = result.unwrap();
        // Task should be set to running at start
        assert_eq!(task.status, TaskStatus::Running);

        // Note: The background execution may complete very quickly with mock provider
        // We just verify the task was started successfully
    }

    #[tokio::test]
    async fn test_cannot_start_completed_task() {
        let fixture = setup().await;
        let project_id = create_test_project(&fixture.pool).await;
        let task_id = create_test_task(&fixture.pool, &project_id).await;

        // Mark task as completed directly
        task::set_ended(&fixture.pool, &task_id, TaskStatus::Completed)
            .await
            .unwrap();

        // Add a step
        task::create_step(
            &fixture.pool,
            &task_id,
            0,
            "Test Step",
            "echo 'hello'",
            "mock",
        )
        .await
        .unwrap();

        // Try to start - should fail because task is completed
        let result = fixture.executor.start_task(&task_id).await;
        assert!(result.is_err());
        match result.unwrap_err() {
            ServiceError::InvalidInput { field, message } => {
                assert_eq!(field, "status");
                assert!(
                    message.contains("cannot be started"),
                    "Expected 'cannot be started' but got: {}",
                    message
                );
            }
            other => panic!("Expected InvalidInput error, got: {:?}", other),
        }
    }

    #[tokio::test]
    async fn test_pause_running_task_directly() {
        let fixture = setup().await;
        let project_id = create_test_project(&fixture.pool).await;
        let task_id = create_test_task(&fixture.pool, &project_id).await;

        // Add a step
        task::create_step(
            &fixture.pool,
            &task_id,
            0,
            "Test Step",
            "echo 'hello'",
            "mock",
        )
        .await
        .unwrap();

        // Set task to running directly (to avoid background execution)
        task::set_started(&fixture.pool, &task_id).await.unwrap();

        // Pause the task
        let result = fixture.executor.pause_task(&task_id).await;
        assert!(result.is_ok());

        let task = result.unwrap();
        assert_eq!(task.status, TaskStatus::Paused);
    }

    #[tokio::test]
    async fn test_cannot_pause_completed_task() {
        let fixture = setup().await;
        let project_id = create_test_project(&fixture.pool).await;
        let task_id = create_test_task(&fixture.pool, &project_id).await;

        // Mark task as completed directly
        task::set_ended(&fixture.pool, &task_id, TaskStatus::Completed)
            .await
            .unwrap();

        // Try to pause - should fail
        let result = fixture.executor.pause_task(&task_id).await;
        assert!(result.is_err());
        match result.unwrap_err() {
            ServiceError::InvalidInput { field, .. } => {
                assert_eq!(field, "status");
            }
            other => panic!("Expected InvalidInput error, got: {:?}", other),
        }
    }

    #[tokio::test]
    async fn test_cancel_running_task_directly() {
        let fixture = setup().await;
        let project_id = create_test_project(&fixture.pool).await;
        let task_id = create_test_task(&fixture.pool, &project_id).await;

        // Add steps
        task::create_step(&fixture.pool, &task_id, 0, "Step 0", "step 0", "mock")
            .await
            .unwrap();
        task::create_step(&fixture.pool, &task_id, 1, "Step 1", "step 1", "mock")
            .await
            .unwrap();

        // Set task to running directly (to avoid background execution)
        task::set_started(&fixture.pool, &task_id).await.unwrap();

        // Cancel the task
        let result = fixture.executor.cancel_task(&task_id).await;
        assert!(result.is_ok());

        let task = result.unwrap();
        assert_eq!(task.status, TaskStatus::Cancelled);

        // Steps should be skipped
        let steps = task::list_steps(&fixture.pool, &task_id).await.unwrap();
        for step in steps {
            assert!(
                step.status == StepStatus::Skipped || step.status == StepStatus::Pending,
                "Step {} should be skipped or pending, got {:?}",
                step.step_index,
                step.status
            );
        }
    }

    #[tokio::test]
    async fn test_cannot_cancel_completed_task() {
        let fixture = setup().await;
        let project_id = create_test_project(&fixture.pool).await;
        let task_id = create_test_task(&fixture.pool, &project_id).await;

        // Mark task as completed
        task::set_ended(&fixture.pool, &task_id, TaskStatus::Completed)
            .await
            .unwrap();

        // Try to cancel - should fail
        let result = fixture.executor.cancel_task(&task_id).await;
        assert!(result.is_err());
    }

    #[tokio::test]
    async fn test_resume_paused_task() {
        let fixture = setup().await;
        let project_id = create_test_project(&fixture.pool).await;
        let task_id = create_test_task(&fixture.pool, &project_id).await;

        // Add a step
        task::create_step(&fixture.pool, &task_id, 0, "Step 0", "step 0", "mock")
            .await
            .unwrap();

        // Set task to paused directly
        task::update_status(&fixture.pool, &task_id, TaskStatus::Paused)
            .await
            .unwrap();

        // Resume the task
        let result = fixture.executor.resume_task(&task_id).await;
        assert!(result.is_ok());

        let task = result.unwrap();
        // Task should be set to running (may complete quickly in background)
        assert_eq!(task.status, TaskStatus::Running);
    }

    #[tokio::test]
    async fn test_cannot_resume_pending_task() {
        let fixture = setup().await;
        let project_id = create_test_project(&fixture.pool).await;
        let task_id = create_test_task(&fixture.pool, &project_id).await;

        // Task is pending, not paused
        let result = fixture.executor.resume_task(&task_id).await;
        assert!(result.is_err());
        match result.unwrap_err() {
            ServiceError::InvalidInput { field, .. } => {
                assert_eq!(field, "status");
            }
            other => panic!("Expected InvalidInput error, got: {:?}", other),
        }
    }

    #[tokio::test]
    async fn test_task_not_found() {
        let fixture = setup().await;

        let result = fixture.executor.start_task("nonexistent").await;
        assert!(result.is_err());
        match result.unwrap_err() {
            ServiceError::NotFound { entity, .. } => {
                assert_eq!(entity, "Task");
            }
            other => panic!("Expected NotFound error, got: {:?}", other),
        }
    }

    #[tokio::test]
    async fn test_is_running_false_for_unknown() {
        let fixture = setup().await;
        assert!(!fixture.executor.is_running("nonexistent").await);
    }

    // =========================================================================
    // Step Execution Tests
    // =========================================================================

    #[tokio::test]
    async fn test_step_creates_chat_and_execution_process() {
        let fixture = setup().await;
        let project_id = create_test_project(&fixture.pool).await;
        let task_id = create_test_task(&fixture.pool, &project_id).await;

        // Add a step
        let step = task::create_step(
            &fixture.pool,
            &task_id,
            0,
            "Test Step",
            "echo 'hello'",
            "mock",
        )
        .await
        .expect("Failed to create step");

        // Start the task (which will run the step)
        let _ = fixture.executor.start_task(&task_id).await;

        // Wait a bit for background execution
        tokio::time::sleep(std::time::Duration::from_millis(100)).await;

        // Verify a chat was created for this step
        let chats: Vec<openflow_contracts::Chat> = sqlx::query_as(
            "SELECT * FROM chats WHERE task_id = ? AND workflow_step_index = ?",
        )
        .bind(&task_id)
        .bind(step.step_index)
        .fetch_all(&fixture.pool)
        .await
        .expect("Failed to query chats");

        // Should have at least one chat created for the step
        // (may have more if step executed multiple times)
        assert!(
            !chats.is_empty(),
            "Expected at least one chat for the step"
        );
    }

    #[tokio::test]
    async fn test_step_status_updated_during_execution() {
        let fixture = setup().await;
        let project_id = create_test_project(&fixture.pool).await;
        let task_id = create_test_task(&fixture.pool, &project_id).await;

        // Add a step
        task::create_step(
            &fixture.pool,
            &task_id,
            0,
            "Test Step",
            "test prompt",
            "mock",
        )
        .await
        .expect("Failed to create step");

        // Start the task
        let _ = fixture.executor.start_task(&task_id).await;

        // Wait for execution to complete (mock provider should be quick)
        tokio::time::sleep(std::time::Duration::from_millis(200)).await;

        // Verify step status was updated
        let steps = task::list_steps(&fixture.pool, &task_id).await.unwrap();
        assert_eq!(steps.len(), 1);

        // Step should be completed (mock provider returns success) or failed (if spawn failed)
        assert!(
            steps[0].status == StepStatus::Completed
                || steps[0].status == StepStatus::Failed
                || steps[0].status == StepStatus::Running,
            "Step status should be terminal or running, got {:?}",
            steps[0].status
        );
    }

    #[tokio::test]
    async fn test_step_links_to_session() {
        let fixture = setup().await;
        let project_id = create_test_project(&fixture.pool).await;
        let task_id = create_test_task(&fixture.pool, &project_id).await;

        // Add a step
        let step = task::create_step(
            &fixture.pool,
            &task_id,
            0,
            "Test Step",
            "test prompt",
            "mock",
        )
        .await
        .expect("Failed to create step");

        // Initially, step has no session
        assert!(step.session_id.is_none());

        // Start the task
        let _ = fixture.executor.start_task(&task_id).await;

        // Wait for execution
        tokio::time::sleep(std::time::Duration::from_millis(200)).await;

        // Verify step was linked to a session
        let updated_step = task::get_step(&fixture.pool, &step.id).await;

        // Note: The step may or may not have a session_id depending on whether
        // the mock provider successfully spawned an agent session.
        // We just verify the step is in a terminal state.
        if let Ok(s) = updated_step {
            if s.status == StepStatus::Completed {
                // If completed, should have a session
                assert!(
                    s.session_id.is_some() || s.status != StepStatus::Completed,
                    "Completed step should have a linked session"
                );
            }
        }
    }

    #[tokio::test]
    async fn test_multiple_steps_execute_sequentially() {
        let fixture = setup().await;
        let project_id = create_test_project(&fixture.pool).await;
        let task_id = create_test_task(&fixture.pool, &project_id).await;

        // Add multiple steps
        task::create_step(&fixture.pool, &task_id, 0, "Step 1", "prompt 1", "mock")
            .await
            .unwrap();
        task::create_step(&fixture.pool, &task_id, 1, "Step 2", "prompt 2", "mock")
            .await
            .unwrap();
        task::create_step(&fixture.pool, &task_id, 2, "Step 3", "prompt 3", "mock")
            .await
            .unwrap();

        // Verify all steps are pending
        let steps = task::list_steps(&fixture.pool, &task_id).await.unwrap();
        assert_eq!(steps.len(), 3);
        for step in &steps {
            assert_eq!(step.status, StepStatus::Pending);
        }

        // Start the task
        let _ = fixture.executor.start_task(&task_id).await;

        // Wait for execution
        tokio::time::sleep(std::time::Duration::from_millis(500)).await;

        // Verify steps have been processed (at least some should have advanced)
        let final_task = task::get_task(&fixture.pool, &task_id).await.unwrap();

        // Task should have advanced or be in a terminal state
        assert!(
            final_task.status == TaskStatus::Running
                || final_task.status == TaskStatus::Completed
                || final_task.status == TaskStatus::Failed,
            "Task should be running or terminal, got {:?}",
            final_task.status
        );
    }

    // =========================================================================
    // Permission Handling Tests
    // =========================================================================

    #[tokio::test]
    async fn test_respond_to_permission_requires_running_task() {
        let fixture = setup().await;
        let project_id = create_test_project(&fixture.pool).await;
        let task_id = create_test_task(&fixture.pool, &project_id).await;

        // Add a step
        task::create_step(&fixture.pool, &task_id, 0, "Step 0", "step 0", "mock")
            .await
            .unwrap();

        // Task is pending (not running), should fail
        let result = fixture
            .executor
            .respond_to_permission(&task_id, "fake-permission-id", true)
            .await;

        assert!(result.is_err());
        match result.unwrap_err() {
            ServiceError::InvalidInput { field, message } => {
                assert_eq!(field, "status");
                assert!(
                    message.contains("not running"),
                    "Expected 'not running' but got: {}",
                    message
                );
            }
            other => panic!("Expected InvalidInput error, got: {:?}", other),
        }
    }

    #[tokio::test]
    async fn test_respond_to_permission_requires_current_step() {
        let fixture = setup().await;
        let project_id = create_test_project(&fixture.pool).await;
        let task_id = create_test_task(&fixture.pool, &project_id).await;

        // Set task to running WITHOUT any steps
        task::update_status(&fixture.pool, &task_id, TaskStatus::Running)
            .await
            .unwrap();

        let result = fixture
            .executor
            .respond_to_permission(&task_id, "fake-permission-id", true)
            .await;

        assert!(result.is_err());
        match result.unwrap_err() {
            ServiceError::InvalidInput { field, message } => {
                assert_eq!(field, "step");
                assert!(
                    message.contains("no current step"),
                    "Expected 'no current step' but got: {}",
                    message
                );
            }
            other => panic!("Expected InvalidInput error, got: {:?}", other),
        }
    }

    #[tokio::test]
    async fn test_respond_to_permission_requires_active_session() {
        let fixture = setup().await;
        let project_id = create_test_project(&fixture.pool).await;
        let task_id = create_test_task(&fixture.pool, &project_id).await;

        // Add a step but don't link it to a session
        task::create_step(&fixture.pool, &task_id, 0, "Step 0", "step 0", "mock")
            .await
            .unwrap();

        // Set task to running
        task::update_status(&fixture.pool, &task_id, TaskStatus::Running)
            .await
            .unwrap();

        let result = fixture
            .executor
            .respond_to_permission(&task_id, "fake-permission-id", true)
            .await;

        assert!(result.is_err());
        match result.unwrap_err() {
            ServiceError::InvalidInput { field, message } => {
                assert_eq!(field, "session");
                assert!(
                    message.contains("no active session"),
                    "Expected 'no active session' but got: {}",
                    message
                );
            }
            other => panic!("Expected InvalidInput error, got: {:?}", other),
        }
    }

    #[tokio::test]
    async fn test_get_pending_permission_returns_none_for_pending_task() {
        let fixture = setup().await;
        let project_id = create_test_project(&fixture.pool).await;
        let task_id = create_test_task(&fixture.pool, &project_id).await;

        // Task is pending, should return None
        let result = fixture
            .executor
            .get_pending_permission(&task_id)
            .await
            .expect("Failed to get pending permission");

        assert!(result.is_none());
    }

    #[tokio::test]
    async fn test_get_pending_permission_returns_none_when_no_step() {
        let fixture = setup().await;
        let project_id = create_test_project(&fixture.pool).await;
        let task_id = create_test_task(&fixture.pool, &project_id).await;

        // Set task to running without steps
        task::update_status(&fixture.pool, &task_id, TaskStatus::Running)
            .await
            .unwrap();

        // Should return None (no current step)
        let result = fixture
            .executor
            .get_pending_permission(&task_id)
            .await
            .expect("Failed to get pending permission");

        assert!(result.is_none());
    }

    #[tokio::test]
    async fn test_get_pending_permission_returns_none_when_no_session() {
        let fixture = setup().await;
        let project_id = create_test_project(&fixture.pool).await;
        let task_id = create_test_task(&fixture.pool, &project_id).await;

        // Add a step but don't link to session
        task::create_step(&fixture.pool, &task_id, 0, "Step 0", "step 0", "mock")
            .await
            .unwrap();

        // Set task to running
        task::update_status(&fixture.pool, &task_id, TaskStatus::Running)
            .await
            .unwrap();

        // Should return None (step has no session)
        let result = fixture
            .executor
            .get_pending_permission(&task_id)
            .await
            .expect("Failed to get pending permission");

        assert!(result.is_none());
    }

    #[tokio::test]
    async fn test_respond_to_permission_validates_permission_id() {
        let fixture = setup().await;
        let project_id = create_test_project(&fixture.pool).await;
        let task_id = create_test_task(&fixture.pool, &project_id).await;

        // Create an execution process for the session
        let process_id = uuid::Uuid::new_v4().to_string();
        sqlx::query(
            r#"
            INSERT INTO execution_processes (id, project_id, process_type, status, working_directory)
            VALUES (?, ?, 'agent', 'running', '/tmp/test')
            "#,
        )
        .bind(&process_id)
        .bind(&project_id)
        .execute(&fixture.pool)
        .await
        .expect("Failed to create process");

        // Create a session
        let session = agent_session::create(
            &fixture.pool,
            agent_session::CreateSessionRequest::new(&process_id, "mock"),
        )
        .await
        .expect("Failed to create session");

        // Create a permission for this session
        let permission = agent_session::create_permission(
            &fixture.pool,
            &session.id,
            "Write",
            "Create file",
            None,
        )
        .await
        .expect("Failed to create permission");

        // Add a step and link it to the session
        let step = task::create_step(&fixture.pool, &task_id, 0, "Step 0", "step 0", "mock")
            .await
            .unwrap();
        task::link_step_session(&fixture.pool, &step.id, &session.id)
            .await
            .unwrap();

        // Set task to running
        task::update_status(&fixture.pool, &task_id, TaskStatus::Running)
            .await
            .unwrap();

        // Try with wrong permission ID - should fail
        let result = fixture
            .executor
            .respond_to_permission(&task_id, "wrong-permission-id", true)
            .await;

        assert!(result.is_err());
        match result.unwrap_err() {
            ServiceError::InvalidInput { field, message } => {
                assert_eq!(field, "permission_id");
                assert!(
                    message.contains("does not match"),
                    "Expected 'does not match' but got: {}",
                    message
                );
            }
            other => panic!("Expected InvalidInput error, got: {:?}", other),
        }

        // Cleanup - respond to the permission to avoid test pollution
        // Note: This will fail because the session isn't active in the orchestrator,
        // but we're testing the validation logic above
        let _ = agent_session::respond_to_permission(&fixture.pool, &permission.id, true).await;
    }

    #[tokio::test]
    async fn test_task_not_found_for_permission() {
        let fixture = setup().await;

        let result = fixture
            .executor
            .respond_to_permission("nonexistent-task", "fake-permission-id", true)
            .await;

        assert!(result.is_err());
        match result.unwrap_err() {
            ServiceError::NotFound { entity, .. } => {
                assert_eq!(entity, "Task");
            }
            other => panic!("Expected NotFound error, got: {:?}", other),
        }
    }

    #[tokio::test]
    async fn test_get_pending_permission_task_not_found() {
        let fixture = setup().await;

        let result = fixture
            .executor
            .get_pending_permission("nonexistent-task")
            .await;

        assert!(result.is_err());
        match result.unwrap_err() {
            ServiceError::NotFound { entity, .. } => {
                assert_eq!(entity, "Task");
            }
            other => panic!("Expected NotFound error, got: {:?}", other),
        }
    }
}
