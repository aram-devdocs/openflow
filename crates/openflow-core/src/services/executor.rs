//! Executor service for running AI coding CLI tools.
//!
//! This service encapsulates the business logic for preparing executor processes
//! (Claude Code, Gemini CLI, etc.). It handles:
//!
//! - Profile resolution (specified or default)
//! - Chat and project lookup
//! - Command argument building
//! - Environment variable setup
//! - Process request creation
//!
//! The actual process spawning is delegated to the process service.
//!
//! # Logging
//!
//! This service uses the `log` crate for structured logging:
//! - `debug!`: Detailed operation tracing (parameters, internal steps, arguments)
//! - `info!`: Successful operations (process started, context prepared)
//! - `warn!`: Potentially problematic but recoverable situations (invalid profile args)
//! - `error!`: Operation failures (logged before returning error)
//!
//! # Error Handling
//!
//! All async functions return `ServiceResult<T>` which wraps errors in `ServiceError`.
//! Errors are logged at the appropriate level before being returned.

use std::collections::HashMap;
use std::path::PathBuf;

use log::{debug, error, info, warn};
use sqlx::SqlitePool;

use openflow_contracts::{
    Chat, CreateProcessRequest, ExecutorProfile, Project, RunReason, StartProcessRequest,
};

use super::{chat, executor_profile, project, ServiceError, ServiceResult};

/// Prepared executor context after validation and lookup.
///
/// Contains all the information needed to start an executor process.
/// Created by `prepare()` and consumed by the process service.
#[derive(Debug)]
pub struct ExecutorContext {
    /// The resolved executor profile
    pub profile: ExecutorProfile,
    /// The chat session
    pub chat: Chat,
    /// The project associated with the chat
    pub project: Project,
    /// Command arguments to pass to the CLI
    pub cmd_args: Vec<String>,
    /// Environment variables for the process
    pub env: HashMap<String, String>,
    /// Request to create the process record
    pub create_request: CreateProcessRequest,
    /// Request to start the process
    pub start_request: StartProcessRequest,
}

/// Resolve the executor profile from a profile ID.
///
/// Returns the specified profile if ID is provided, otherwise returns the default profile.
///
/// # Arguments
///
/// * `pool` - Database connection pool
/// * `executor_profile_id` - Optional profile ID; uses default if None
///
/// # Errors
///
/// Returns `ServiceError::NotFound` if specified profile doesn't exist.
/// Returns `ServiceError::Validation` if no default profile is configured.
pub async fn resolve_profile(
    pool: &SqlitePool,
    executor_profile_id: Option<String>,
) -> ServiceResult<ExecutorProfile> {
    debug!(
        "Resolving executor profile: {:?}",
        executor_profile_id.as_deref().unwrap_or("default")
    );

    let profile = match executor_profile_id {
        Some(ref id) => {
            debug!("Looking up specified profile_id={}", id);
            executor_profile::get(pool, id).await.map_err(|e| {
                error!("Failed to get executor profile id={}: {}", id, e);
                e
            })?
        }
        None => {
            debug!("Looking up default executor profile");
            executor_profile::get_default(pool)
                .await
                .map_err(|e| {
                    error!("Failed to get default executor profile: {}", e);
                    e
                })?
                .ok_or_else(|| {
                    let msg = "No default executor profile configured. Please create an executor profile first.";
                    error!("{}", msg);
                    ServiceError::Validation(msg.to_string())
                })?
        }
    };

    debug!(
        "Resolved profile: id={}, name={}, command={}",
        profile.id, profile.name, profile.command
    );
    Ok(profile)
}

/// Build command arguments for the executor CLI.
///
/// Includes session resumption if the chat has an existing Claude session ID.
///
/// # Arguments
///
/// * `prompt` - The prompt/instructions to send to the AI agent
/// * `session_id` - Optional Claude session ID for resuming conversations
/// * `profile` - The executor profile with optional additional args
///
/// # Returns
///
/// A vector of command-line arguments to pass to the CLI tool.
pub fn build_command_args(
    prompt: &str,
    session_id: Option<&str>,
    profile: &ExecutorProfile,
) -> Vec<String> {
    debug!(
        "Building command args: prompt_len={}, session_id={:?}, profile={}",
        prompt.len(),
        session_id,
        profile.name
    );

    let mut cmd_args: Vec<String> = if let Some(sid) = session_id {
        debug!("Including --resume flag for session_id={}", sid);
        // Resume existing Claude Code session
        vec![
            "--output-format".to_string(),
            "stream-json".to_string(),
            "--verbose".to_string(),
            "--dangerously-skip-permissions".to_string(),
            "--resume".to_string(),
            sid.to_string(),
            "-p".to_string(),
            prompt.to_string(),
        ]
    } else {
        debug!("Starting new session (no --resume flag)");
        // Start new session
        vec![
            "--output-format".to_string(),
            "stream-json".to_string(),
            "--verbose".to_string(),
            "--dangerously-skip-permissions".to_string(),
            "-p".to_string(),
            prompt.to_string(),
        ]
    };

    // Add any args from the profile
    if let Some(profile_args) = &profile.args {
        match serde_json::from_str::<Vec<String>>(profile_args) {
            Ok(parsed_args) => {
                debug!(
                    "Adding {} profile args: {:?}",
                    parsed_args.len(),
                    parsed_args
                );
                cmd_args.extend(parsed_args);
            }
            Err(e) => {
                warn!(
                    "Failed to parse profile args for profile={}: {} (args: {})",
                    profile.name, e, profile_args
                );
                // Continue without the profile args - this is recoverable
            }
        }
    }

    debug!("Built {} command arguments", cmd_args.len());
    cmd_args
}

/// Build environment variables for the executor process.
///
/// Disables ANSI colors for clean JSON output parsing.
///
/// Sets the following environment variables:
/// - `NO_COLOR=1` - Disable color output
/// - `FORCE_COLOR=0` - Disable forced color output
/// - `TERM=dumb` - Simple terminal for clean output
///
/// # Returns
///
/// A HashMap of environment variables to set when running the process.
pub fn build_environment() -> HashMap<String, String> {
    debug!("Building environment variables for executor process");

    let mut env = HashMap::new();
    env.insert("NO_COLOR".to_string(), "1".to_string());
    env.insert("FORCE_COLOR".to_string(), "0".to_string());
    env.insert("TERM".to_string(), "dumb".to_string());

    debug!(
        "Built {} environment variables: {:?}",
        env.len(),
        env.keys().collect::<Vec<_>>()
    );
    env
}

/// Create the process record request.
///
/// # Arguments
///
/// * `chat_id` - The chat session to associate the process with
/// * `profile` - The executor profile being used
///
/// # Returns
///
/// A `CreateProcessRequest` ready to be passed to the process service.
pub fn create_process_request(chat_id: &str, profile: &ExecutorProfile) -> CreateProcessRequest {
    debug!(
        "Creating process request: chat_id={}, profile_id={}, profile_name={}",
        chat_id, profile.id, profile.name
    );

    let request = CreateProcessRequest {
        chat_id: chat_id.to_string(),
        executor_profile_id: Some(profile.id.clone()),
        executor_action: format!("Run {} with prompt", profile.name),
        run_reason: RunReason::Codingagent,
        before_head_commit: None,
    };

    debug!(
        "Created process request for chat_id={} with action={}",
        chat_id, request.executor_action
    );
    request
}

/// Create the start process request with PTY configuration.
///
/// # Arguments
///
/// * `profile` - The executor profile with command to run
/// * `cmd_args` - Command line arguments for the executor
/// * `cwd` - Working directory for the process
/// * `env` - Environment variables for the process
///
/// # PTY Configuration
///
/// Uses a 120x40 pseudo-terminal for proper CLI tool output.
///
/// # Returns
///
/// A `StartProcessRequest` ready to be passed to the process service.
pub fn create_start_request(
    profile: &ExecutorProfile,
    cmd_args: Vec<String>,
    cwd: PathBuf,
    env: HashMap<String, String>,
) -> StartProcessRequest {
    debug!(
        "Creating start request: command={}, args_count={}, cwd={:?}, env_count={}",
        profile.command,
        cmd_args.len(),
        cwd,
        env.len()
    );

    let request = StartProcessRequest {
        command: profile.command.clone(),
        args: cmd_args,
        cwd: Some(cwd.clone()),
        env,
        use_pty: true,
        pty_cols: Some(120),
        pty_rows: Some(40),
    };

    debug!(
        "Created start request: command={}, use_pty=true, pty_size=120x40, cwd={:?}",
        profile.command, cwd
    );
    request
}

/// Prepare the executor context by validating and looking up all required data.
///
/// This performs all the business logic needed before starting the process:
/// 1. Resolves the executor profile
/// 2. Fetches the chat and project
/// 3. Builds command arguments and environment
/// 4. Creates the process and start requests
///
/// # Arguments
///
/// * `pool` - Database connection pool
/// * `chat_id` - The chat session to run the executor in
/// * `prompt` - The prompt/instructions to send to the AI agent
/// * `executor_profile_id` - Optional profile ID; uses default if None
///
/// # Errors
///
/// Returns `ServiceError::NotFound` if chat or project doesn't exist.
/// Returns `ServiceError::Validation` if no default profile is configured.
pub async fn prepare(
    pool: &SqlitePool,
    chat_id: &str,
    prompt: &str,
    executor_profile_id: Option<String>,
) -> ServiceResult<ExecutorContext> {
    info!(
        "Preparing executor context: chat_id={}, prompt_len={}, profile_id={:?}",
        chat_id,
        prompt.len(),
        executor_profile_id.as_deref().unwrap_or("default")
    );

    // 1. Get the executor profile (specified or default)
    debug!("Step 1: Resolving executor profile");
    let profile = resolve_profile(pool, executor_profile_id).await?;

    // 2. Get the chat to find the project
    debug!("Step 2: Fetching chat_id={}", chat_id);
    let chat_with_messages = chat::get(pool, chat_id).await.map_err(|e| {
        error!("Failed to get chat_id={}: {}", chat_id, e);
        e
    })?;
    let chat_record = chat_with_messages.chat;
    debug!(
        "Retrieved chat: id={}, project_id={}, session_id={:?}",
        chat_record.id, chat_record.project_id, chat_record.claude_session_id
    );

    // 3. Get project directly from chat.project_id
    debug!("Step 3: Fetching project_id={}", chat_record.project_id);
    let project_record = project::get(pool, &chat_record.project_id)
        .await
        .map_err(|e| {
            error!(
                "Failed to get project_id={} for chat_id={}: {}",
                chat_record.project_id, chat_record.id, e
            );
            e
        })?;
    debug!(
        "Retrieved project: id={}, name={}, path={}",
        project_record.id, project_record.name, project_record.git_repo_path
    );

    // 4. Build command arguments
    debug!("Step 4: Building command arguments");
    let cmd_args = build_command_args(prompt, chat_record.claude_session_id.as_deref(), &profile);

    // 5. Build environment variables
    debug!("Step 5: Building environment variables");
    let env = build_environment();

    // 6. Create process request
    debug!("Step 6: Creating process request");
    let create_request = create_process_request(chat_id, &profile);

    // 7. Create start request
    debug!("Step 7: Creating start request");
    let start_request = create_start_request(
        &profile,
        cmd_args.clone(),
        PathBuf::from(&project_record.git_repo_path),
        env.clone(),
    );

    info!(
        "Executor context prepared: chat_id={}, project={}, profile={}, args_count={}",
        chat_record.id,
        project_record.name,
        profile.name,
        cmd_args.len()
    );

    Ok(ExecutorContext {
        profile,
        chat: chat_record,
        project: project_record,
        cmd_args,
        env,
        create_request,
        start_request,
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    fn sample_profile() -> ExecutorProfile {
        ExecutorProfile {
            id: "test-profile-id".to_string(),
            name: "Claude Code".to_string(),
            description: Some("Test profile".to_string()),
            command: "claude".to_string(),
            args: None,
            env: None,
            model: None,
            is_default: true,
            created_at: "2024-01-01T00:00:00Z".to_string(),
            updated_at: "2024-01-01T00:00:00Z".to_string(),
        }
    }

    #[test]
    fn test_build_command_args_new_session() {
        let profile = sample_profile();

        let args = build_command_args("Hello world", None, &profile);

        assert!(args.contains(&"--output-format".to_string()));
        assert!(args.contains(&"stream-json".to_string()));
        assert!(args.contains(&"--verbose".to_string()));
        assert!(args.contains(&"--dangerously-skip-permissions".to_string()));
        assert!(args.contains(&"-p".to_string()));
        assert!(args.contains(&"Hello world".to_string()));
        assert!(!args.contains(&"--resume".to_string()));
    }

    #[test]
    fn test_build_command_args_resume_session() {
        let profile = sample_profile();

        let args = build_command_args("Hello world", Some("session-123"), &profile);

        assert!(args.contains(&"--resume".to_string()));
        assert!(args.contains(&"session-123".to_string()));
        assert!(args.contains(&"-p".to_string()));
        assert!(args.contains(&"Hello world".to_string()));
    }

    #[test]
    fn test_build_command_args_with_profile_args() {
        let mut profile = sample_profile();
        profile.args = Some(r#"["--model", "claude-3-opus"]"#.to_string());

        let args = build_command_args("Hello", None, &profile);

        assert!(args.contains(&"--model".to_string()));
        assert!(args.contains(&"claude-3-opus".to_string()));
    }

    #[test]
    fn test_build_command_args_with_invalid_profile_args() {
        let mut profile = sample_profile();
        profile.args = Some("invalid-json".to_string());

        // Should not panic, just skip the invalid args
        let args = build_command_args("Hello", None, &profile);

        assert!(args.contains(&"-p".to_string()));
        assert!(args.contains(&"Hello".to_string()));
        // Invalid args are skipped
        assert!(!args.contains(&"invalid-json".to_string()));
    }

    #[test]
    fn test_build_environment() {
        let env = build_environment();

        assert_eq!(env.get("NO_COLOR"), Some(&"1".to_string()));
        assert_eq!(env.get("FORCE_COLOR"), Some(&"0".to_string()));
        assert_eq!(env.get("TERM"), Some(&"dumb".to_string()));
        assert_eq!(env.len(), 3);
    }

    #[test]
    fn test_create_process_request() {
        let profile = sample_profile();

        let request = create_process_request("chat-456", &profile);

        assert_eq!(request.chat_id, "chat-456");
        assert_eq!(
            request.executor_profile_id,
            Some("test-profile-id".to_string())
        );
        assert!(request.executor_action.contains("Claude Code"));
        assert_eq!(request.run_reason, RunReason::Codingagent);
        assert!(request.before_head_commit.is_none());
    }

    #[test]
    fn test_create_start_request() {
        let profile = sample_profile();
        let cmd_args = vec!["-p".to_string(), "test prompt".to_string()];
        let cwd = PathBuf::from("/home/user/project");
        let env = build_environment();

        let request = create_start_request(&profile, cmd_args.clone(), cwd.clone(), env.clone());

        assert_eq!(request.command, "claude");
        assert_eq!(request.args, cmd_args);
        assert_eq!(request.cwd, Some(cwd));
        assert_eq!(request.env, env);
        assert!(request.use_pty);
        assert_eq!(request.pty_cols, Some(120));
        assert_eq!(request.pty_rows, Some(40));
    }

    #[test]
    fn test_create_start_request_pty_dimensions() {
        let profile = sample_profile();
        let cmd_args = vec![];
        let cwd = PathBuf::from("/tmp");
        let env = HashMap::new();

        let request = create_start_request(&profile, cmd_args, cwd, env);

        // Verify standard PTY dimensions for CLI tools
        assert!(request.use_pty);
        assert_eq!(request.pty_cols, Some(120));
        assert_eq!(request.pty_rows, Some(40));
    }

    #[test]
    fn test_executor_context_fields() {
        // Test that ExecutorContext can be constructed with all fields
        let profile = sample_profile();
        let chat = Chat {
            id: "chat-id".to_string(),
            task_id: Some("task-id".to_string()),
            project_id: "project-id".to_string(),
            title: Some("Test Chat".to_string()),
            chat_role: openflow_contracts::ChatRole::Main,
            executor_profile_id: None,
            base_branch: "main".to_string(),
            branch: None,
            worktree_path: None,
            worktree_deleted: false,
            setup_completed_at: None,
            initial_prompt: None,
            hidden_prompt: None,
            is_plan_container: false,
            main_chat_id: None,
            workflow_step_index: None,
            claude_session_id: None,
            archived_at: None,
            created_at: "2024-01-01T00:00:00Z".to_string(),
            updated_at: "2024-01-01T00:00:00Z".to_string(),
        };
        let project = Project {
            id: "project-id".to_string(),
            name: "Test Project".to_string(),
            git_repo_path: "/tmp/test".to_string(),
            base_branch: "main".to_string(),
            setup_script: "".to_string(),
            dev_script: "".to_string(),
            cleanup_script: None,
            copy_files: None,
            icon: "folder".to_string(),
            rule_folders: None,
            always_included_rules: None,
            workflows_folder: ".openflow/workflows".to_string(),
            verification_config: None,
            archived_at: None,
            created_at: "2024-01-01T00:00:00Z".to_string(),
            updated_at: "2024-01-01T00:00:00Z".to_string(),
        };

        let context = ExecutorContext {
            profile: profile.clone(),
            chat: chat.clone(),
            project: project.clone(),
            cmd_args: vec!["-p".to_string(), "test".to_string()],
            env: build_environment(),
            create_request: create_process_request(&chat.id, &profile),
            start_request: create_start_request(
                &profile,
                vec!["-p".to_string(), "test".to_string()],
                PathBuf::from(&project.git_repo_path),
                build_environment(),
            ),
        };

        assert_eq!(context.profile.name, "Claude Code");
        assert_eq!(context.chat.id, "chat-id");
        assert_eq!(context.project.name, "Test Project");
        assert_eq!(context.cmd_args.len(), 2);
    }
}
