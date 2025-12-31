//! Executor service for running AI coding CLI tools.
//!
//! This service encapsulates the business logic for preparing and starting
//! executor processes (Claude Code, Gemini CLI, etc.).

use std::collections::HashMap;
use std::path::PathBuf;

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
    pub async fn resolve_profile(
        pool: &SqlitePool,
        executor_profile_id: Option<String>,
    ) -> ServiceResult<ExecutorProfile> {
        match executor_profile_id {
            Some(id) => ExecutorProfileService::get(pool, &id).await,
            None => ExecutorProfileService::get_default(pool)
                .await?
                .ok_or_else(|| {
                    ServiceError::Validation(
                        "No default executor profile configured. Please create an executor profile first.".to_string()
                    )
                }),
        }
    }

    /// Build command arguments for the executor CLI.
    ///
    /// Includes session resumption if the chat has an existing Claude session ID.
    pub fn build_command_args(
        prompt: &str,
        session_id: Option<&str>,
        profile: &ExecutorProfile,
    ) -> ServiceResult<Vec<String>> {
        let mut cmd_args: Vec<String> = if let Some(sid) = session_id {
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
            if let Ok(parsed_args) = serde_json::from_str::<Vec<String>>(profile_args) {
                cmd_args.extend(parsed_args);
            }
        }

        Ok(cmd_args)
    }

    /// Build environment variables for the executor process.
    ///
    /// Disables ANSI colors for clean JSON output parsing.
    pub fn build_environment() -> ServiceResult<HashMap<String, String>> {
        let mut env = HashMap::new();
        env.insert("NO_COLOR".to_string(), "1".to_string());
        env.insert("FORCE_COLOR".to_string(), "0".to_string());
        env.insert("TERM".to_string(), "dumb".to_string());
        Ok(env)
    }

    /// Create the process record request.
    pub fn create_process_request(
        chat_id: &str,
        profile: &ExecutorProfile,
    ) -> CreateProcessRequest {
        CreateProcessRequest {
            chat_id: chat_id.to_string(),
            executor_profile_id: Some(profile.id.clone()),
            executor_action: format!("Run {} with prompt", profile.name),
            run_reason: RunReason::Codingagent,
            before_head_commit: None,
        }
    }

    /// Create the start process request with PTY configuration.
    pub fn create_start_request(
        profile: &ExecutorProfile,
        cmd_args: Vec<String>,
        cwd: PathBuf,
        env: HashMap<String, String>,
    ) -> StartProcessRequest {
        StartProcessRequest {
            command: profile.command.clone(),
            args: cmd_args,
            cwd: Some(cwd),
            env,
            use_pty: true,
            pty_cols: Some(120),
            pty_rows: Some(40),
        }
    }

    /// Prepare the executor context by validating and looking up all required data.
    ///
    /// This performs all the business logic needed before starting the process:
    /// 1. Resolves the executor profile
    /// 2. Fetches the chat and project
    /// 3. Builds command arguments and environment
    /// 4. Creates the process and start requests
    pub async fn prepare(
        pool: &SqlitePool,
        request: RunExecutorRequest,
    ) -> ServiceResult<ExecutorContext> {
        // 1. Get the executor profile (specified or default)
        let profile = Self::resolve_profile(pool, request.executor_profile_id).await?;

        // 2. Get the chat to find the project
        let chat_with_messages = ChatService::get(pool, &request.chat_id).await?;
        let chat = chat_with_messages.chat;

        // 3. Get project directly from chat.project_id
        let project = ProjectService::get(pool, &chat.project_id).await?;

        // 4. Build command arguments
        let cmd_args =
            Self::build_command_args(&request.prompt, chat.claude_session_id.as_deref(), &profile)?;

        // 5. Build environment variables
        let env = Self::build_environment()?;

        // 6. Create process request
        let create_request = Self::create_process_request(&request.chat_id, &profile);

        // 7. Create start request
        let start_request = Self::create_start_request(
            &profile,
            cmd_args.clone(),
            PathBuf::from(&project.git_repo_path),
            env.clone(),
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
    pub async fn start(
        pool: &SqlitePool,
        process_service: &ProcessService,
        context: ExecutorContext,
    ) -> ServiceResult<ExecutionProcess> {
        process_service
            .start(pool, context.create_request, context.start_request)
            .await
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
