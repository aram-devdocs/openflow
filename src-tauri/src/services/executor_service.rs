//! Executor service for running AI coding CLI tools.
//!
//! This service encapsulates the business logic for preparing and starting
//! executor processes (Claude Code, Gemini CLI, etc.).
//!
//! ## Logging
//!
//! This service uses the `log` crate for structured logging:
//! - `debug!`: Detailed operation tracing (parameters, internal steps, arguments)
//! - `info!`: Successful operations (process started, context prepared)
//! - `warn!`: Potentially problematic but recoverable situations (invalid profile args)
//! - `error!`: Operation failures (logged before returning error)
//!
//! ## Error Handling
//!
//! All async functions return `ServiceResult<T>` which wraps errors in `ServiceError`.
//! Errors are logged at the appropriate level before being returned.

use std::collections::HashMap;
use std::path::PathBuf;

use log::{debug, error, info, warn};
use sqlx::SqlitePool;

use crate::services::process_service::{CreateProcessRequest, StartProcessRequest};
use crate::services::{ChatService, ExecutorProfileService, ProcessService, ProjectService};
use crate::types::{Chat, ExecutionProcess, ExecutorProfile, Project, RunReason};

use super::{ServiceError, ServiceResult};

/// Request to run an executor for a chat session.
pub struct RunExecutorRequest {
    /// The chat session to associate the execution with
    pub chat_id: String,
    /// The prompt/instructions to send to the AI agent
    pub prompt: String,
    /// Optional profile ID; uses default if not specified
    pub executor_profile_id: Option<String>,
}

/// Prepared executor context after validation and lookup.
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

/// Service for running AI coding CLI executors.
pub struct ExecutorService;

impl ExecutorService {
    /// Resolve the executor profile from the request.
    ///
    /// Returns the specified profile if ID is provided, otherwise returns the default profile.
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
                ExecutorProfileService::get(pool, id).await.map_err(|e| {
                    error!("Failed to get executor profile id={}: {}", id, e);
                    e
                })?
            }
            None => {
                debug!("Looking up default executor profile");
                ExecutorProfileService::get_default(pool)
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
    pub fn build_command_args(
        prompt: &str,
        session_id: Option<&str>,
        profile: &ExecutorProfile,
    ) -> ServiceResult<Vec<String>> {
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
        Ok(cmd_args)
    }

    /// Build environment variables for the executor process.
    ///
    /// Disables ANSI colors for clean JSON output parsing.
    ///
    /// Sets the following environment variables:
    /// - `NO_COLOR=1` - Disable color output
    /// - `FORCE_COLOR=0` - Disable forced color output
    /// - `TERM=dumb` - Simple terminal for clean output
    pub fn build_environment() -> ServiceResult<HashMap<String, String>> {
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
        Ok(env)
    }

    /// Create the process record request.
    ///
    /// # Arguments
    ///
    /// * `chat_id` - The chat session to associate the process with
    /// * `profile` - The executor profile being used
    pub fn create_process_request(
        chat_id: &str,
        profile: &ExecutorProfile,
    ) -> CreateProcessRequest {
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
    /// # Errors
    ///
    /// Returns `ServiceError::NotFound` if chat or project doesn't exist.
    /// Returns `ServiceError::Validation` if no default profile is configured.
    pub async fn prepare(
        pool: &SqlitePool,
        request: RunExecutorRequest,
    ) -> ServiceResult<ExecutorContext> {
        info!(
            "Preparing executor context: chat_id={}, prompt_len={}, profile_id={:?}",
            request.chat_id,
            request.prompt.len(),
            request.executor_profile_id.as_deref().unwrap_or("default")
        );

        // 1. Get the executor profile (specified or default)
        debug!("Step 1: Resolving executor profile");
        let profile = Self::resolve_profile(pool, request.executor_profile_id).await?;

        // 2. Get the chat to find the project
        debug!("Step 2: Fetching chat_id={}", request.chat_id);
        let chat_with_messages = ChatService::get(pool, &request.chat_id)
            .await
            .map_err(|e| {
                error!("Failed to get chat_id={}: {}", request.chat_id, e);
                e
            })?;
        let chat = chat_with_messages.chat;
        debug!(
            "Retrieved chat: id={}, project_id={}, session_id={:?}",
            chat.id, chat.project_id, chat.claude_session_id
        );

        // 3. Get project directly from chat.project_id
        debug!("Step 3: Fetching project_id={}", chat.project_id);
        let project = ProjectService::get(pool, &chat.project_id)
            .await
            .map_err(|e| {
                error!(
                    "Failed to get project_id={} for chat_id={}: {}",
                    chat.project_id, chat.id, e
                );
                e
            })?;
        debug!(
            "Retrieved project: id={}, name={}, path={}",
            project.id, project.name, project.git_repo_path
        );

        // 4. Build command arguments
        debug!("Step 4: Building command arguments");
        let cmd_args =
            Self::build_command_args(&request.prompt, chat.claude_session_id.as_deref(), &profile)?;

        // 5. Build environment variables
        debug!("Step 5: Building environment variables");
        let env = Self::build_environment()?;

        // 6. Create process request
        debug!("Step 6: Creating process request");
        let create_request = Self::create_process_request(&request.chat_id, &profile);

        // 7. Create start request
        debug!("Step 7: Creating start request");
        let start_request = Self::create_start_request(
            &profile,
            cmd_args.clone(),
            PathBuf::from(&project.git_repo_path),
            env.clone(),
        );

        info!(
            "Executor context prepared: chat_id={}, project={}, profile={}, args_count={}",
            chat.id,
            project.name,
            profile.name,
            cmd_args.len()
        );

        Ok(ExecutorContext {
            profile,
            chat,
            project,
            cmd_args,
            env,
            create_request,
            start_request,
        })
    }

    /// Start the executor process after preparation.
    ///
    /// This is a thin wrapper around ProcessService::start that uses the prepared context.
    ///
    /// # Arguments
    ///
    /// * `pool` - Database connection pool
    /// * `process_service` - Process service for spawning the process
    /// * `context` - Prepared executor context from `prepare()`
    ///
    /// # Errors
    ///
    /// Returns `ServiceError::Process` if the process fails to start.
    pub async fn start(
        pool: &SqlitePool,
        process_service: &ProcessService,
        context: ExecutorContext,
    ) -> ServiceResult<ExecutionProcess> {
        info!(
            "Starting executor: chat_id={}, profile={}, command={}",
            context.chat.id, context.profile.name, context.profile.command
        );

        let process = process_service
            .start(pool, context.create_request, context.start_request)
            .await
            .map_err(|e| {
                error!(
                    "Failed to start executor for chat_id={}: {}",
                    context.chat.id, e
                );
                e
            })?;

        info!(
            "Executor started: process_id={}, chat_id={}, profile={}, pid={:?}",
            process.id, context.chat.id, context.profile.name, process.pid
        );

        Ok(process)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_build_command_args_new_session() {
        let profile = ExecutorProfile {
            id: "test".to_string(),
            name: "Claude Code".to_string(),
            description: None,
            command: "claude".to_string(),
            args: None,
            env: None,
            model: None,
            is_default: false,
            created_at: "2024-01-01".to_string(),
            updated_at: "2024-01-01".to_string(),
        };

        let args = ExecutorService::build_command_args("Hello world", None, &profile).unwrap();

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
        let profile = ExecutorProfile {
            id: "test".to_string(),
            name: "Claude Code".to_string(),
            description: None,
            command: "claude".to_string(),
            args: None,
            env: None,
            model: None,
            is_default: false,
            created_at: "2024-01-01".to_string(),
            updated_at: "2024-01-01".to_string(),
        };

        let args =
            ExecutorService::build_command_args("Hello world", Some("session-123"), &profile)
                .unwrap();

        assert!(args.contains(&"--resume".to_string()));
        assert!(args.contains(&"session-123".to_string()));
    }

    #[test]
    fn test_build_command_args_with_profile_args() {
        let profile = ExecutorProfile {
            id: "test".to_string(),
            name: "Claude Code".to_string(),
            description: None,
            command: "claude".to_string(),
            args: Some(r#"["--model", "claude-3-opus"]"#.to_string()),
            env: None,
            model: None,
            is_default: false,
            created_at: "2024-01-01".to_string(),
            updated_at: "2024-01-01".to_string(),
        };

        let args = ExecutorService::build_command_args("Hello", None, &profile).unwrap();

        assert!(args.contains(&"--model".to_string()));
        assert!(args.contains(&"claude-3-opus".to_string()));
    }

    #[test]
    fn test_build_environment() {
        let env = ExecutorService::build_environment().unwrap();

        assert_eq!(env.get("NO_COLOR"), Some(&"1".to_string()));
        assert_eq!(env.get("FORCE_COLOR"), Some(&"0".to_string()));
        assert_eq!(env.get("TERM"), Some(&"dumb".to_string()));
    }

    #[test]
    fn test_create_process_request() {
        let profile = ExecutorProfile {
            id: "profile-123".to_string(),
            name: "Claude Code".to_string(),
            description: None,
            command: "claude".to_string(),
            args: None,
            env: None,
            model: None,
            is_default: false,
            created_at: "2024-01-01".to_string(),
            updated_at: "2024-01-01".to_string(),
        };

        let request = ExecutorService::create_process_request("chat-456", &profile);

        assert_eq!(request.chat_id, "chat-456");
        assert_eq!(request.executor_profile_id, Some("profile-123".to_string()));
        assert!(request.executor_action.contains("Claude Code"));
        assert!(matches!(request.run_reason, RunReason::Codingagent));
    }

    #[test]
    fn test_create_start_request() {
        let profile = ExecutorProfile {
            id: "test".to_string(),
            name: "Claude".to_string(),
            description: None,
            command: "claude".to_string(),
            args: None,
            env: None,
            model: None,
            is_default: false,
            created_at: "2024-01-01".to_string(),
            updated_at: "2024-01-01".to_string(),
        };

        let cmd_args = vec!["-p".to_string(), "test".to_string()];
        let cwd = PathBuf::from("/home/user/project");
        let env = HashMap::new();

        let request = ExecutorService::create_start_request(&profile, cmd_args, cwd, env);

        assert_eq!(request.command, "claude");
        assert_eq!(request.args, vec!["-p", "test"]);
        assert_eq!(request.cwd, Some(PathBuf::from("/home/user/project")));
        assert!(request.use_pty);
        assert_eq!(request.pty_cols, Some(120));
        assert_eq!(request.pty_rows, Some(40));
    }
}
