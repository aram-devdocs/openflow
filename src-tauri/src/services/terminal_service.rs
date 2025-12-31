//! Terminal service for interactive shell sessions.
//!
//! This service manages terminal processes that allow users to run interactive
//! shell commands within a project's working directory. Unlike executor processes,
//! terminals spawn a user's default shell and persist until explicitly closed.

use std::collections::HashMap;
use std::path::PathBuf;

use sqlx::SqlitePool;

use crate::services::process_service::{CreateProcessRequest, StartProcessRequest};
use crate::services::{ProcessService, ProjectService};
use crate::types::{ChatRole, ExecutionProcess, Project, RunReason};

use super::{ChatService, ServiceError, ServiceResult};

/// Request to spawn a new terminal session.
#[derive(Debug, Clone)]
pub struct SpawnTerminalRequest {
    /// The project ID to spawn the terminal in (determines working directory).
    pub project_id: String,
    /// Optional chat ID to associate the terminal with.
    /// If None, a standalone terminal chat will be created.
    pub chat_id: Option<String>,
    /// Optional custom working directory (overrides project's git_repo_path).
    pub cwd: Option<PathBuf>,
    /// Optional shell command (defaults to user's shell or bash).
    pub shell: Option<String>,
    /// Optional terminal dimensions.
    pub cols: Option<u16>,
    pub rows: Option<u16>,
}

/// Prepared terminal context after validation and lookup.
pub struct TerminalContext {
    /// The project for the terminal session.
    pub project: Project,
    /// The chat ID to associate the process with.
    pub chat_id: String,
    /// The working directory for the terminal.
    pub cwd: PathBuf,
    /// The shell command to run.
    pub shell: String,
    /// Request to create the process record.
    pub create_request: CreateProcessRequest,
    /// Request to start the process.
    pub start_request: StartProcessRequest,
}

/// Service for managing interactive terminal sessions.
pub struct TerminalService;

impl TerminalService {
    /// Get the user's default shell.
    ///
    /// On Unix, checks $SHELL environment variable, falling back to /bin/bash.
    /// On Windows, uses cmd.exe.
    pub fn get_default_shell() -> ServiceResult<String> {
        #[cfg(unix)]
        {
            Ok(std::env::var("SHELL").unwrap_or_else(|_| "/bin/bash".to_string()))
        }
        #[cfg(windows)]
        {
            Ok(std::env::var("COMSPEC").unwrap_or_else(|_| "cmd.exe".to_string()))
        }
    }

    /// Build environment variables for the terminal process.
    ///
    /// Sets up a clean terminal environment with proper TERM settings.
    pub fn build_environment() -> ServiceResult<HashMap<String, String>> {
        let mut env = HashMap::new();
        // Set TERM for proper terminal emulation
        env.insert("TERM".to_string(), "xterm-256color".to_string());
        // Enable colors
        env.insert("COLORTERM".to_string(), "truecolor".to_string());
        // Ensure interactive mode hints
        env.insert("OPENFLOW_TERMINAL".to_string(), "1".to_string());
        Ok(env)
    }

    /// Build shell arguments for an interactive session.
    ///
    /// Adds flags to ensure the shell runs interactively.
    pub fn build_shell_args(shell: &str) -> ServiceResult<Vec<String>> {
        // Determine shell type from path
        let shell_name = shell
            .rsplit('/')
            .next()
            .unwrap_or(shell)
            .rsplit('\\')
            .next()
            .unwrap_or(shell);

        let args = match shell_name {
            "bash" => vec!["-i".to_string()], // Interactive
            "zsh" => vec!["-i".to_string()],  // Interactive
            "fish" => vec!["-i".to_string()], // Interactive
            "sh" => vec!["-i".to_string()],   // Interactive
            "cmd.exe" | "cmd" => vec![],      // Windows cmd doesn't need flags
            "powershell.exe" | "powershell" | "pwsh.exe" | "pwsh" => {
                vec!["-NoLogo".to_string(), "-NoExit".to_string()]
            }
            _ => vec![], // Unknown shell, no special args
        };
        Ok(args)
    }

    /// Create the process record request for a terminal.
    pub fn create_process_request(chat_id: &str) -> ServiceResult<CreateProcessRequest> {
        Ok(CreateProcessRequest {
            chat_id: chat_id.to_string(),
            executor_profile_id: None,
            executor_action: "Interactive terminal session".to_string(),
            run_reason: RunReason::Terminal,
            before_head_commit: None,
        })
    }

    /// Create the start process request with PTY configuration.
    pub fn create_start_request(
        shell: String,
        args: Vec<String>,
        cwd: PathBuf,
        env: HashMap<String, String>,
        cols: Option<u16>,
        rows: Option<u16>,
    ) -> StartProcessRequest {
        StartProcessRequest {
            command: shell,
            args,
            cwd: Some(cwd),
            env,
            use_pty: true,
            pty_cols: Some(cols.unwrap_or(120)),
            pty_rows: Some(rows.unwrap_or(30)),
        }
    }

    /// Prepare a terminal session by validating and looking up all required data.
    ///
    /// This performs all the business logic needed before spawning the terminal:
    /// 1. Fetches the project
    /// 2. Resolves or creates a chat for the terminal
    /// 3. Determines the shell and working directory
    /// 4. Creates the process and start requests
    pub async fn prepare(
        pool: &SqlitePool,
        request: SpawnTerminalRequest,
    ) -> ServiceResult<TerminalContext> {
        // 1. Get the project
        let project = ProjectService::get(pool, &request.project_id).await?;

        // 2. Resolve chat ID - use provided or create a standalone terminal chat
        let chat_id = match request.chat_id {
            Some(id) => {
                // Verify the chat exists and belongs to this project
                let chat = ChatService::get(pool, &id).await?;
                if chat.chat.project_id != project.id {
                    return Err(ServiceError::Validation(
                        "Chat does not belong to the specified project".to_string(),
                    ));
                }
                id
            }
            None => {
                // Create a standalone terminal chat
                use crate::types::CreateChatRequest;
                let chat_request = CreateChatRequest {
                    task_id: None,
                    project_id: project.id.clone(),
                    title: Some("Terminal".to_string()),
                    chat_role: Some(ChatRole::Terminal),
                    executor_profile_id: None,
                    base_branch: None,
                    initial_prompt: None,
                    hidden_prompt: None,
                    is_plan_container: None,
                    main_chat_id: None,
                    workflow_step_index: None,
                };
                let chat = ChatService::create(pool, chat_request).await?;
                chat.id
            }
        };

        // 3. Determine working directory
        let cwd = request
            .cwd
            .unwrap_or_else(|| PathBuf::from(&project.git_repo_path));

        // Validate working directory exists
        if !cwd.exists() {
            return Err(ServiceError::Validation(format!(
                "Working directory does not exist: {}",
                cwd.display()
            )));
        }

        // 4. Determine shell
        let shell = match request.shell {
            Some(s) => s,
            None => Self::get_default_shell()?,
        };

        // 5. Build shell arguments
        let args = Self::build_shell_args(&shell)?;

        // 6. Build environment
        let env = Self::build_environment()?;

        // 7. Create process request
        let create_request = Self::create_process_request(&chat_id)?;

        // 8. Create start request
        let start_request = Self::create_start_request(
            shell.clone(),
            args,
            cwd.clone(),
            env,
            request.cols,
            request.rows,
        );

        Ok(TerminalContext {
            project,
            chat_id,
            cwd,
            shell,
            create_request,
            start_request,
        })
    }

    /// Spawn a terminal session after preparation.
    ///
    /// This is a thin wrapper around ProcessService::start that uses the prepared context.
    pub async fn spawn(
        pool: &SqlitePool,
        process_service: &ProcessService,
        context: TerminalContext,
    ) -> ServiceResult<ExecutionProcess> {
        process_service
            .start(pool, context.create_request, context.start_request)
            .await
    }

    /// Prepare and spawn a terminal in one call.
    ///
    /// Convenience method that combines prepare() and spawn().
    pub async fn spawn_terminal(
        pool: &SqlitePool,
        process_service: &ProcessService,
        request: SpawnTerminalRequest,
    ) -> ServiceResult<ExecutionProcess> {
        let context = Self::prepare(pool, request).await?;
        Self::spawn(pool, process_service, context).await
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_get_default_shell() {
        let shell = TerminalService::get_default_shell().unwrap();
        // Shell should not be empty
        assert!(!shell.is_empty());
        // On Unix, should be a path; on Windows, should be cmd or similar
        #[cfg(unix)]
        assert!(shell.contains('/') || shell == "bash" || shell == "zsh" || shell == "sh");
    }

    #[test]
    fn test_build_environment() {
        let env = TerminalService::build_environment().unwrap();

        assert_eq!(env.get("TERM"), Some(&"xterm-256color".to_string()));
        assert_eq!(env.get("COLORTERM"), Some(&"truecolor".to_string()));
        assert_eq!(env.get("OPENFLOW_TERMINAL"), Some(&"1".to_string()));
    }

    #[test]
    fn test_build_shell_args_bash() {
        let args = TerminalService::build_shell_args("/bin/bash").unwrap();
        assert_eq!(args, vec!["-i"]);
    }

    #[test]
    fn test_build_shell_args_zsh() {
        let args = TerminalService::build_shell_args("/usr/local/bin/zsh").unwrap();
        assert_eq!(args, vec!["-i"]);
    }

    #[test]
    fn test_build_shell_args_fish() {
        let args = TerminalService::build_shell_args("/usr/bin/fish").unwrap();
        assert_eq!(args, vec!["-i"]);
    }

    #[test]
    fn test_build_shell_args_powershell() {
        let args = TerminalService::build_shell_args("powershell.exe").unwrap();
        assert_eq!(args, vec!["-NoLogo", "-NoExit"]);
    }

    #[test]
    fn test_build_shell_args_pwsh() {
        let args = TerminalService::build_shell_args("C:\\Program Files\\PowerShell\\7\\pwsh.exe")
            .unwrap();
        assert_eq!(args, vec!["-NoLogo", "-NoExit"]);
    }

    #[test]
    fn test_build_shell_args_cmd() {
        let args = TerminalService::build_shell_args("cmd.exe").unwrap();
        assert!(args.is_empty());
    }

    #[test]
    fn test_build_shell_args_unknown() {
        let args = TerminalService::build_shell_args("/usr/bin/unknown-shell").unwrap();
        assert!(args.is_empty());
    }

    #[test]
    fn test_create_process_request() {
        let request = TerminalService::create_process_request("chat-123").unwrap();

        assert_eq!(request.chat_id, "chat-123");
        assert!(request.executor_profile_id.is_none());
        assert!(request.executor_action.contains("terminal"));
        assert!(matches!(request.run_reason, RunReason::Terminal));
        assert!(request.before_head_commit.is_none());
    }

    #[test]
    fn test_create_start_request_defaults() {
        let cwd = PathBuf::from("/home/user/project");
        let env = HashMap::new();

        let request = TerminalService::create_start_request(
            "/bin/bash".to_string(),
            vec!["-i".to_string()],
            cwd.clone(),
            env,
            None,
            None,
        );

        assert_eq!(request.command, "/bin/bash");
        assert_eq!(request.args, vec!["-i"]);
        assert_eq!(request.cwd, Some(cwd));
        assert!(request.use_pty);
        assert_eq!(request.pty_cols, Some(120));
        assert_eq!(request.pty_rows, Some(30));
    }

    #[test]
    fn test_create_start_request_custom_dimensions() {
        let cwd = PathBuf::from("/tmp");
        let env = HashMap::new();

        let request = TerminalService::create_start_request(
            "/bin/zsh".to_string(),
            vec![],
            cwd,
            env,
            Some(200),
            Some(50),
        );

        assert_eq!(request.pty_cols, Some(200));
        assert_eq!(request.pty_rows, Some(50));
    }
}
