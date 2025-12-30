//! Tauri commands for executor profile operations.
//!
//! These commands provide the IPC interface for executor profile management
//! and running AI coding CLI tools (Claude Code, Gemini CLI, etc.).

use std::collections::HashMap;
use std::io::{BufRead, BufReader};
use std::path::PathBuf;
use std::sync::{Arc, LazyLock};

use regex::Regex;
use serde::{Deserialize, Serialize};
use tauri::{Emitter, State};

use crate::commands::AppState;
use crate::services::process_service::{CreateProcessRequest, StartProcessRequest};
use crate::services::{ChatService, ExecutorProfileService, ProcessService, ProjectService};
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
        /// Session ID from Claude Code (present in "init" subtype events)
        #[serde(default)]
        session_id: Option<String>,
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

/// Assistant message - content is an array of content blocks (text, tool_use, etc.)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AssistantMessage {
    /// Content blocks array - can contain text blocks, tool_use blocks, etc.
    #[serde(default)]
    pub content: Option<serde_json::Value>,
    /// Additional fields we pass through
    #[serde(flatten)]
    pub extra: serde_json::Value,
}

/// User message - content is an array of content blocks (tool_result, etc.)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UserMessage {
    /// Content blocks array - typically contains tool_result blocks
    #[serde(default)]
    pub content: Option<serde_json::Value>,
    /// Additional fields we pass through
    #[serde(flatten)]
    pub extra: serde_json::Value,
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

    // 2. Get the chat to find the project
    let chat_with_messages = ChatService::get(&pool, &chat_id)
        .await
        .map_err(|e| e.to_string())?;
    let chat = chat_with_messages.chat;

    #[cfg(debug_assertions)]
    {
        let is_standalone = chat.task_id.is_none();
        println!(
            "[run_executor] Chat: id={}, project_id={}, task_id={:?}, is_standalone={}",
            chat.id, chat.project_id, chat.task_id, is_standalone
        );
    }

    // 3. Get project directly from chat.project_id (works for both standalone and task-linked chats)
    let project = ProjectService::get(&pool, &chat.project_id)
        .await
        .map_err(|e| e.to_string())?;

    #[cfg(debug_assertions)]
    println!(
        "[run_executor] Project: id={}, name={}, path={}",
        project.id, project.name, project.git_repo_path
    );

    // 4. Build command arguments
    // Use --output-format stream-json for structured JSON output
    // Use -p flag (print mode) for non-interactive execution with clean JSON output
    // --verbose is required when using stream-json with -p
    // --dangerously-skip-permissions auto-approves tool use (no interactive prompts in -p mode)
    // Use --resume to continue existing session (if session ID exists)
    let mut cmd_args: Vec<String> = if let Some(session_id) = &chat.claude_session_id {
        // Resume existing Claude Code session
        vec![
            "--output-format".to_string(),
            "stream-json".to_string(),
            "--verbose".to_string(),
            "--dangerously-skip-permissions".to_string(),
            "--resume".to_string(),
            session_id.clone(),
            "-p".to_string(),
            prompt.clone(),
        ]
    } else {
        // Start new session
        vec![
            "--output-format".to_string(),
            "stream-json".to_string(),
            "--verbose".to_string(),
            "--dangerously-skip-permissions".to_string(),
            "-p".to_string(),
            prompt.clone(),
        ]
    };

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

    // 6. Build environment variables to disable ANSI colors
    let mut env = HashMap::new();
    env.insert("NO_COLOR".to_string(), "1".to_string());
    env.insert("FORCE_COLOR".to_string(), "0".to_string());
    env.insert("TERM".to_string(), "dumb".to_string());

    // 7. Start process with PTY for output streaming
    // Using -p flag ensures non-interactive mode with clean JSON output
    let start_req = StartProcessRequest {
        command: profile.command.clone(),
        args: cmd_args,
        cwd: Some(PathBuf::from(&project.git_repo_path)),
        env,
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

    // 8. Spawn background task to stream JSON output
    spawn_json_output_streamer(
        Arc::clone(&state.process_service),
        app_handle,
        process.id.clone(),
    );

    // Note: With -p flag, prompt is passed as command argument, no stdin needed

    Ok(process)
}

/// Permission request event emitted when Claude asks for permission.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PermissionRequestEvent {
    pub process_id: String,
    pub tool_name: String,
    pub file_path: Option<String>,
    pub description: String,
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
        let permission_channel = format!("permission-request-{}", process_id);
        let session_channel = format!("session-id-{}", process_id);

        // Read line by line (each line should be a JSON object)
        for line in reader.lines() {
            let line = match line {
                Ok(l) => l,
                Err(_) => break, // EOF or error
            };

            // Strip ANSI escape codes and control characters
            let clean_line = strip_ansi_codes(&line);
            let trimmed = clean_line.trim();

            if trimmed.is_empty() {
                continue;
            }

            // Check for permission prompts (non-JSON lines from Claude Code)
            // Claude Code shows prompts like: "Allow Claude to write to file.txt? (y/n)"
            if trimmed.contains("Allow")
                && (trimmed.contains("(y/n)") || trimmed.contains("? [y/n]"))
            {
                // Extract tool name and file path from permission prompt
                let permission_event = PermissionRequestEvent {
                    process_id: process_id.clone(),
                    tool_name: extract_tool_name(trimmed),
                    file_path: extract_file_path(trimmed),
                    description: trimmed.to_string(),
                };
                let _ = app_handle.emit(&permission_channel, &permission_event);
                continue;
            }

            // Try to parse as ClaudeEvent
            if let Ok(event) = serde_json::from_str::<ClaudeEvent>(trimmed) {
                // Check for session ID in system "init" events and emit it
                if let ClaudeEvent::System {
                    subtype,
                    session_id: Some(ref sid),
                    ..
                } = &event
                {
                    if subtype == "init" {
                        let _ = app_handle.emit(&session_channel, sid);
                    }
                }
                let _ = app_handle.emit(&event_channel, &event);
            } else {
                // Fallback: emit raw line for unparsed output (already cleaned)
                let _ = app_handle.emit(&raw_channel, trimmed);
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

/// Extract tool name from permission prompt.
fn extract_tool_name(prompt: &str) -> String {
    // Common patterns: "Allow Claude to write", "Allow Claude to read", "Allow Claude to execute"
    if prompt.contains("write") || prompt.contains("Write") {
        "Write".to_string()
    } else if prompt.contains("read") || prompt.contains("Read") {
        "Read".to_string()
    } else if prompt.contains("execute")
        || prompt.contains("Execute")
        || prompt.contains("bash")
        || prompt.contains("Bash")
    {
        "Bash".to_string()
    } else {
        "Tool".to_string()
    }
}

/// Extract file path from permission prompt.
fn extract_file_path(prompt: &str) -> Option<String> {
    // Look for path-like strings (starting with / or containing common path patterns)
    // This is a simple heuristic - Claude Code prompts often include the file path
    for word in prompt.split_whitespace() {
        let word = word.trim_matches(|c| c == '?' || c == '"' || c == '\'' || c == '`');
        if word.starts_with('/') || word.contains(":\\") {
            return Some(word.to_string());
        }
    }
    None
}

/// Regex pattern for ANSI escape sequences.
/// Matches: CSI sequences, OSC sequences, and other escape sequences.
static ANSI_REGEX: LazyLock<Regex> = LazyLock::new(|| {
    Regex::new(concat!(
        r"\x1b\[[0-9;]*[A-Za-z]",            // CSI sequences (colors, cursor, etc.)
        r"|\x1b\][^\x07]*\x07",              // OSC sequences (terminated by BEL)
        r"|\x1b[PX^_][^\x1b]*\x1b\\",        // DCS/SOS/PM/APC sequences
        r"|\x1b[\[\]()#;?]*[0-9;]*[A-Za-z]", // Other escape sequences
        r"|\x1b.",                           // Simple escape sequences
        r"|[\x00-\x08\x0b\x0c\x0e-\x1f]",    // Control characters (except newline, tab, CR)
    ))
    .expect("Invalid ANSI regex pattern")
});

/// Strip ANSI escape codes and control characters from a string.
fn strip_ansi_codes(s: &str) -> String {
    ANSI_REGEX.replace_all(s, "").to_string()
}
