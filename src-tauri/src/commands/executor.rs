//! Tauri commands for executor profile operations.
//!
//! These commands provide the IPC interface for executor profile management
//! and running AI coding CLI tools (Claude Code, Gemini CLI, etc.).

use std::collections::HashMap;
use std::io::{BufRead, BufReader};
use std::path::PathBuf;
use std::sync::Arc;

use serde::{Deserialize, Serialize};
use tauri::{Emitter, State};

use crate::commands::AppState;
use crate::services::process_service::{CreateProcessRequest, StartProcessRequest};
use crate::services::{
    ChatService, ExecutorProfileService, ProcessService, ProjectService, TaskService,
};
use crate::types::{
    CreateExecutorProfileRequest, ExecutionProcess, ExecutorProfile, ProcessStatus,
    ProcessStatusEvent, RunReason, UpdateExecutorProfileRequest,
};

/// List all executor profiles.
///
/// Returns all profiles ordered by name.
#[tauri::command]
pub async fn list_executor_profiles(
    state: State<'_, AppState>,
) -> Result<Vec<ExecutorProfile>, String> {
    let pool = state.db.lock().await;
    ExecutorProfileService::list(&pool)
        .await
        .map_err(|e| e.to_string())
}

/// Get an executor profile by ID.
///
/// Returns the profile if found, or an error if not found.
#[tauri::command]
pub async fn get_executor_profile(
    state: State<'_, AppState>,
    id: String,
) -> Result<ExecutorProfile, String> {
    let pool = state.db.lock().await;
    ExecutorProfileService::get(&pool, &id)
        .await
        .map_err(|e| e.to_string())
}

/// Get the default executor profile.
///
/// Returns the default profile if one exists, or None.
#[tauri::command]
pub async fn get_default_executor_profile(
    state: State<'_, AppState>,
) -> Result<Option<ExecutorProfile>, String> {
    let pool = state.db.lock().await;
    ExecutorProfileService::get_default(&pool)
        .await
        .map_err(|e| e.to_string())
}

/// Create a new executor profile.
///
/// If is_default is true, clears default from all other profiles.
/// Returns the newly created profile with generated ID and timestamps.
#[tauri::command]
pub async fn create_executor_profile(
    state: State<'_, AppState>,
    request: CreateExecutorProfileRequest,
) -> Result<ExecutorProfile, String> {
    let pool = state.db.lock().await;
    ExecutorProfileService::create(&pool, request)
        .await
        .map_err(|e| e.to_string())
}

/// Update an existing executor profile.
///
/// Only the provided fields will be updated.
/// If is_default is set to true, clears default from all other profiles.
/// Returns the updated profile.
#[tauri::command]
pub async fn update_executor_profile(
    state: State<'_, AppState>,
    id: String,
    request: UpdateExecutorProfileRequest,
) -> Result<ExecutorProfile, String> {
    let pool = state.db.lock().await;
    ExecutorProfileService::update(&pool, &id, request)
        .await
        .map_err(|e| e.to_string())
}

/// Delete an executor profile by ID.
///
/// Returns an error if the profile is not found.
#[tauri::command]
pub async fn delete_executor_profile(state: State<'_, AppState>, id: String) -> Result<(), String> {
    let pool = state.db.lock().await;
    ExecutorProfileService::delete(&pool, &id)
        .await
        .map_err(|e| e.to_string())
}

/// Claude Code stream-json event types.
/// These match the JSON lines output from `claude --output-format stream-json`.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type", rename_all = "snake_case")]
pub enum ClaudeEvent {
    #[serde(rename = "system")]
    System {
        subtype: String,
        #[serde(flatten)]
        data: serde_json::Value,
    },
    #[serde(rename = "assistant")]
    Assistant { message: AssistantMessage },
    #[serde(rename = "user")]
    User { message: UserMessage },
    #[serde(rename = "result")]
    Result {
        subtype: String,
        #[serde(flatten)]
        data: serde_json::Value,
    },
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AssistantMessage {
    pub content: Option<String>,
    #[serde(default)]
    pub tool_use: Option<serde_json::Value>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UserMessage {
    pub content: Option<String>,
    #[serde(default)]
    pub tool_result: Option<serde_json::Value>,
}

/// Run an executor (AI coding CLI) for a chat session.
///
/// This command spawns a CLI process using the specified executor profile
/// and sends the prompt to the AI coding agent. Output is streamed via
/// Tauri events in JSON format.
///
/// # Arguments
/// * `chat_id` - The chat session to associate the execution with
/// * `prompt` - The prompt/instructions to send to the AI agent
/// * `executor_profile_id` - Optional profile ID; uses default if not specified
///
/// # Returns
/// The ExecutionProcess record tracking this execution.
#[tauri::command]
pub async fn run_executor(
    state: State<'_, AppState>,
    app_handle: tauri::AppHandle,
    chat_id: String,
    prompt: String,
    executor_profile_id: Option<String>,
) -> Result<ExecutionProcess, String> {
    let pool = state.db.lock().await;

    // 1. Get the executor profile (specified or default)
    let profile = match executor_profile_id {
        Some(id) => ExecutorProfileService::get(&pool, &id)
            .await
            .map_err(|e| e.to_string())?,
        None => ExecutorProfileService::get_default(&pool)
            .await
            .map_err(|e| e.to_string())?
            .ok_or_else(|| {
                "No default executor profile configured. Please create an executor profile first."
                    .to_string()
            })?,
    };

    // 2. Get the chat to find the task and project
    let chat_with_messages = ChatService::get(&pool, &chat_id)
        .await
        .map_err(|e| e.to_string())?;
    let chat = chat_with_messages.chat;

    // 3. Get task and project to determine working directory
    let task_with_chats = TaskService::get(&pool, &chat.task_id)
        .await
        .map_err(|e| e.to_string())?;
    let project = ProjectService::get(&pool, &task_with_chats.task.project_id)
        .await
        .map_err(|e| e.to_string())?;

    // 4. Build command arguments
    // Use --output-format stream-json for structured JSON output
    let mut cmd_args: Vec<String> = vec![
        "--output-format".to_string(),
        "stream-json".to_string(),
        "-p".to_string(),
        prompt.clone(),
    ];

    // Add any args from the profile
    if let Some(profile_args) = &profile.args {
        if let Ok(parsed_args) = serde_json::from_str::<Vec<String>>(profile_args) {
            cmd_args.extend(parsed_args);
        }
    }

    // 5. Create process record
    let create_req = CreateProcessRequest {
        chat_id: chat_id.clone(),
        executor_profile_id: Some(profile.id.clone()),
        executor_action: format!("Run {} with prompt", profile.name),
        run_reason: RunReason::Codingagent,
        before_head_commit: None,
    };

    // 6. Start process with PTY
    let start_req = StartProcessRequest {
        command: profile.command.clone(),
        args: cmd_args,
        cwd: Some(PathBuf::from(&project.git_repo_path)),
        env: HashMap::new(),
        use_pty: true,
        pty_cols: Some(120),
        pty_rows: Some(40),
    };

    // Drop the pool lock before starting the process to avoid deadlock
    drop(pool);

    let pool = state.db.lock().await;
    let process = state
        .process_service
        .start(&pool, create_req, start_req)
        .await
        .map_err(|e| e.to_string())?;

    // 7. Spawn background task to stream JSON output
    spawn_json_output_streamer(
        Arc::clone(&state.process_service),
        app_handle,
        process.id.clone(),
    );

    Ok(process)
}

/// Spawns a background task to read JSON lines from the PTY and emit Tauri events.
fn spawn_json_output_streamer(
    process_service: Arc<ProcessService>,
    app_handle: tauri::AppHandle,
    process_id: String,
) {
    std::thread::spawn(move || {
        let pty_manager = process_service.pty_manager();

        // Get reader from PTY
        let reader = match pty_manager.try_clone_reader(&process_id) {
            Ok(r) => BufReader::new(r),
            Err(e) => {
                eprintln!("Failed to get PTY reader for {}: {}", process_id, e);
                return;
            }
        };

        let event_channel = format!("claude-event-{}", process_id);
        let raw_channel = format!("raw-output-{}", process_id);

        // Read line by line (each line should be a JSON object)
        for line in reader.lines() {
            let line = match line {
                Ok(l) => l,
                Err(_) => break, // EOF or error
            };

            if line.trim().is_empty() {
                continue;
            }

            // Try to parse as ClaudeEvent
            if let Ok(event) = serde_json::from_str::<ClaudeEvent>(&line) {
                let _ = app_handle.emit(&event_channel, &event);
            } else {
                // Fallback: emit raw line for unparsed output
                let _ = app_handle.emit(&raw_channel, &line);
            }
        }

        // Emit completion status
        let status_channel = format!("process-status-{}", process_id);
        let status_event = ProcessStatusEvent {
            process_id: process_id.clone(),
            status: ProcessStatus::Completed,
            exit_code: Some(0),
        };
        let _ = app_handle.emit(&status_channel, &status_event);
    });
}
