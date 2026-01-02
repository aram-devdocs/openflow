//! Chat management service.
//!
//! Handles CRUD operations for chats (workflow step sessions).
//!
//! # Logging
//!
//! This service uses the `log` crate for structured logging:
//! - `debug!`: Detailed operation tracing (query params, internal steps)
//! - `info!`: Successful operations (create, update, delete, archive)
//! - `warn!`: Potentially problematic but recoverable situations
//! - `error!`: Operation failures (logged before returning error)
//!
//! # Error Handling
//!
//! All functions return `ServiceResult<T>` which wraps errors in `ServiceError`.
//! Errors are logged at the appropriate level before being returned.

use log::{debug, error, info, warn};
use sqlx::SqlitePool;
use uuid::Uuid;

use openflow_contracts::{
    Chat, ChatRole, ChatWithMessages, CreateChatRequest, Message, UpdateChatRequest,
};

use super::{ServiceError, ServiceResult};

/// List chats for a task.
///
/// # Arguments
/// * `pool` - Database connection pool
/// * `task_id` - Task to list chats for
///
/// Returns non-archived chats ordered by workflow_step_index ASC, then created_at ASC.
pub async fn list(pool: &SqlitePool, task_id: &str) -> ServiceResult<Vec<Chat>> {
    debug!("Listing chats for task_id={}", task_id);

    let chats = sqlx::query_as::<_, Chat>(
        r#"
        SELECT
            id, task_id, project_id, title, chat_role, executor_profile_id,
            base_branch, branch, worktree_path, worktree_deleted,
            setup_completed_at, initial_prompt, hidden_prompt,
            is_plan_container, main_chat_id, workflow_step_index,
            claude_session_id, archived_at, created_at, updated_at
        FROM chats
        WHERE task_id = ? AND archived_at IS NULL
        ORDER BY workflow_step_index ASC, created_at ASC
        "#,
    )
    .bind(task_id)
    .fetch_all(pool)
    .await
    .map_err(|e| {
        error!("Failed to list chats for task_id={}: {}", task_id, e);
        ServiceError::Database(e)
    })?;

    debug!("Found {} chats for task_id={}", chats.len(), task_id);
    Ok(chats)
}

/// List standalone chats for a project (chats without a task).
///
/// # Arguments
/// * `pool` - Database connection pool
/// * `project_id` - Project to list standalone chats for
///
/// Returns non-archived chats ordered by created_at DESC (most recent first).
pub async fn list_standalone(pool: &SqlitePool, project_id: &str) -> ServiceResult<Vec<Chat>> {
    debug!("Listing standalone chats for project_id={}", project_id);

    let chats = sqlx::query_as::<_, Chat>(
        r#"
        SELECT
            id, task_id, project_id, title, chat_role, executor_profile_id,
            base_branch, branch, worktree_path, worktree_deleted,
            setup_completed_at, initial_prompt, hidden_prompt,
            is_plan_container, main_chat_id, workflow_step_index,
            claude_session_id, archived_at, created_at, updated_at
        FROM chats
        WHERE project_id = ? AND task_id IS NULL AND archived_at IS NULL
        ORDER BY created_at DESC
        "#,
    )
    .bind(project_id)
    .fetch_all(pool)
    .await
    .map_err(|e| {
        error!(
            "Failed to list standalone chats for project_id={}: {}",
            project_id, e
        );
        ServiceError::Database(e)
    })?;

    debug!(
        "Found {} standalone chats for project_id={}",
        chats.len(),
        project_id
    );
    Ok(chats)
}

/// List all chats for a project (both task-linked and standalone).
///
/// # Arguments
/// * `pool` - Database connection pool
/// * `project_id` - Project to list all chats for
///
/// Returns non-archived chats ordered by created_at DESC.
pub async fn list_by_project(pool: &SqlitePool, project_id: &str) -> ServiceResult<Vec<Chat>> {
    debug!("Listing all chats for project_id={}", project_id);

    let chats = sqlx::query_as::<_, Chat>(
        r#"
        SELECT
            id, task_id, project_id, title, chat_role, executor_profile_id,
            base_branch, branch, worktree_path, worktree_deleted,
            setup_completed_at, initial_prompt, hidden_prompt,
            is_plan_container, main_chat_id, workflow_step_index,
            claude_session_id, archived_at, created_at, updated_at
        FROM chats
        WHERE project_id = ? AND archived_at IS NULL
        ORDER BY created_at DESC
        "#,
    )
    .bind(project_id)
    .fetch_all(pool)
    .await
    .map_err(|e| {
        error!("Failed to list chats for project_id={}: {}", project_id, e);
        ServiceError::Database(e)
    })?;

    debug!("Found {} chats for project_id={}", chats.len(), project_id);
    Ok(chats)
}

/// List all archived chats across all projects.
///
/// Returns archived chats ordered by archived_at DESC (most recently archived first).
pub async fn list_archived(pool: &SqlitePool) -> ServiceResult<Vec<Chat>> {
    debug!("Listing all archived chats");

    let chats = sqlx::query_as::<_, Chat>(
        r#"
        SELECT
            id, task_id, project_id, title, chat_role, executor_profile_id,
            base_branch, branch, worktree_path, worktree_deleted,
            setup_completed_at, initial_prompt, hidden_prompt,
            is_plan_container, main_chat_id, workflow_step_index,
            claude_session_id, archived_at, created_at, updated_at
        FROM chats
        WHERE archived_at IS NOT NULL
        ORDER BY archived_at DESC
        "#,
    )
    .fetch_all(pool)
    .await
    .map_err(|e| {
        error!("Failed to list archived chats: {}", e);
        ServiceError::Database(e)
    })?;

    debug!("Found {} archived chats", chats.len());
    Ok(chats)
}

/// Get a chat by ID with its messages.
pub async fn get(pool: &SqlitePool, id: &str) -> ServiceResult<ChatWithMessages> {
    debug!("Getting chat id={}", id);

    let chat = sqlx::query_as::<_, Chat>(
        r#"
        SELECT
            id, task_id, project_id, title, chat_role, executor_profile_id,
            base_branch, branch, worktree_path, worktree_deleted,
            setup_completed_at, initial_prompt, hidden_prompt,
            is_plan_container, main_chat_id, workflow_step_index,
            claude_session_id, archived_at, created_at, updated_at
        FROM chats
        WHERE id = ?
        "#,
    )
    .bind(id)
    .fetch_optional(pool)
    .await
    .map_err(|e| {
        error!("Database error while fetching chat id={}: {}", id, e);
        ServiceError::Database(e)
    })?
    .ok_or_else(|| {
        debug!("Chat not found: id={}", id);
        ServiceError::NotFound {
            entity: "Chat",
            id: id.to_string(),
        }
    })?;

    let messages = sqlx::query_as::<_, Message>(
        r#"
        SELECT
            id, chat_id, role, content, tool_calls, tool_results,
            is_streaming, tokens_used, model, created_at
        FROM messages
        WHERE chat_id = ?
        ORDER BY created_at ASC
        "#,
    )
    .bind(id)
    .fetch_all(pool)
    .await
    .map_err(|e| {
        error!(
            "Database error while fetching messages for chat id={}: {}",
            id, e
        );
        ServiceError::Database(e)
    })?;

    debug!("Found chat id={} with {} messages", id, messages.len());
    Ok(ChatWithMessages::with_messages(chat, messages))
}

/// Get a chat by ID (without messages).
pub async fn get_chat(pool: &SqlitePool, id: &str) -> ServiceResult<Chat> {
    debug!("Fetching chat (no messages): id={}", id);

    let chat = sqlx::query_as::<_, Chat>(
        r#"
        SELECT
            id, task_id, project_id, title, chat_role, executor_profile_id,
            base_branch, branch, worktree_path, worktree_deleted,
            setup_completed_at, initial_prompt, hidden_prompt,
            is_plan_container, main_chat_id, workflow_step_index,
            claude_session_id, archived_at, created_at, updated_at
        FROM chats
        WHERE id = ?
        "#,
    )
    .bind(id)
    .fetch_optional(pool)
    .await
    .map_err(|e| {
        error!("Failed to fetch chat {}: {}", id, e);
        ServiceError::Database(e)
    })?
    .ok_or_else(|| {
        error!("Chat not found: id={}", id);
        ServiceError::NotFound {
            entity: "Chat",
            id: id.to_string(),
        }
    })?;

    debug!(
        "Fetched chat: id={}, title={:?}, role={}",
        chat.id, chat.title, chat.chat_role
    );

    Ok(chat)
}

/// Create a new chat.
///
/// For standalone chats, task_id should be None and project_id is required.
/// For task-linked chats, both task_id and project_id are required.
pub async fn create(pool: &SqlitePool, request: CreateChatRequest) -> ServiceResult<Chat> {
    let id = Uuid::new_v4().to_string();
    let chat_role = request.chat_role.clone().unwrap_or(ChatRole::Main);
    let base_branch = request
        .base_branch
        .clone()
        .unwrap_or_else(|| "main".to_string());
    let is_plan_container = request.is_plan_container.unwrap_or(false);

    debug!(
        "Creating chat: id={}, project_id={}, task_id={:?}, role={:?}",
        id, request.project_id, request.task_id, chat_role
    );

    sqlx::query(
        r#"
        INSERT INTO chats (
            id, task_id, project_id, title, chat_role, executor_profile_id,
            base_branch, initial_prompt, hidden_prompt,
            is_plan_container, main_chat_id, workflow_step_index
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        "#,
    )
    .bind(&id)
    .bind(&request.task_id)
    .bind(&request.project_id)
    .bind(&request.title)
    .bind(chat_role.to_string())
    .bind(&request.executor_profile_id)
    .bind(&base_branch)
    .bind(&request.initial_prompt)
    .bind(&request.hidden_prompt)
    .bind(is_plan_container)
    .bind(&request.main_chat_id)
    .bind(request.workflow_step_index)
    .execute(pool)
    .await
    .map_err(|e| {
        error!(
            "Failed to create chat: project_id={}, task_id={:?}, error={}",
            request.project_id, request.task_id, e
        );
        ServiceError::Database(e)
    })?;

    // Fetch and return the created chat
    let chat_with_messages = get(pool, &id).await?;

    info!(
        "Created chat: id={}, project_id={}, task_id={:?}, role={:?}",
        id, request.project_id, request.task_id, chat_role
    );
    Ok(chat_with_messages.chat)
}

/// Update an existing chat.
pub async fn update(
    pool: &SqlitePool,
    id: &str,
    request: UpdateChatRequest,
) -> ServiceResult<Chat> {
    debug!("Updating chat id={}", id);

    // Verify the chat exists first
    let existing = get(pool, id).await?.chat;

    // Apply updates, falling back to existing values
    let title = request.title.or(existing.title);
    let executor_profile_id = request.executor_profile_id.or(existing.executor_profile_id);
    let branch = request.branch.or(existing.branch);
    let worktree_path = request.worktree_path.or(existing.worktree_path);
    let worktree_deleted = request
        .worktree_deleted
        .unwrap_or(existing.worktree_deleted);
    let setup_completed_at = request.setup_completed_at.or(existing.setup_completed_at);
    let initial_prompt = request.initial_prompt.or(existing.initial_prompt);
    let hidden_prompt = request.hidden_prompt.or(existing.hidden_prompt);
    let claude_session_id = request.claude_session_id.or(existing.claude_session_id);

    sqlx::query(
        r#"
        UPDATE chats
        SET
            title = ?,
            executor_profile_id = ?,
            branch = ?,
            worktree_path = ?,
            worktree_deleted = ?,
            setup_completed_at = ?,
            initial_prompt = ?,
            hidden_prompt = ?,
            claude_session_id = ?,
            updated_at = datetime('now', 'subsec')
        WHERE id = ?
        "#,
    )
    .bind(&title)
    .bind(&executor_profile_id)
    .bind(&branch)
    .bind(&worktree_path)
    .bind(worktree_deleted)
    .bind(&setup_completed_at)
    .bind(&initial_prompt)
    .bind(&hidden_prompt)
    .bind(&claude_session_id)
    .bind(id)
    .execute(pool)
    .await
    .map_err(|e| {
        error!("Failed to update chat id={}: {}", id, e);
        ServiceError::Database(e)
    })?;

    let chat_with_messages = get(pool, id).await?;

    info!("Updated chat id={}", id);
    Ok(chat_with_messages.chat)
}

/// Archive a chat by ID.
///
/// Sets the archived_at timestamp to the current time.
/// Archived chats are excluded from list queries but can still be accessed by ID.
pub async fn archive(pool: &SqlitePool, id: &str) -> ServiceResult<Chat> {
    debug!("Archiving chat id={}", id);

    // Verify the chat exists first
    let existing = get(pool, id).await?.chat;

    if existing.archived_at.is_some() {
        warn!("Chat id={} is already archived", id);
    }

    sqlx::query(
        r#"
        UPDATE chats
        SET archived_at = datetime('now', 'subsec'),
            updated_at = datetime('now', 'subsec')
        WHERE id = ?
        "#,
    )
    .bind(id)
    .execute(pool)
    .await
    .map_err(|e| {
        error!("Failed to archive chat id={}: {}", id, e);
        ServiceError::Database(e)
    })?;

    let chat_with_messages = get(pool, id).await?;

    info!("Archived chat id={}", id);
    Ok(chat_with_messages.chat)
}

/// Unarchive a chat by ID.
///
/// Clears the archived_at timestamp, making the chat visible in list queries again.
pub async fn unarchive(pool: &SqlitePool, id: &str) -> ServiceResult<Chat> {
    debug!("Unarchiving chat id={}", id);

    // Verify the chat exists first
    let existing = get(pool, id).await?.chat;

    if existing.archived_at.is_none() {
        warn!("Chat id={} is not archived", id);
    }

    sqlx::query(
        r#"
        UPDATE chats
        SET archived_at = NULL,
            updated_at = datetime('now', 'subsec')
        WHERE id = ?
        "#,
    )
    .bind(id)
    .execute(pool)
    .await
    .map_err(|e| {
        error!("Failed to unarchive chat id={}: {}", id, e);
        ServiceError::Database(e)
    })?;

    let chat_with_messages = get(pool, id).await?;

    info!("Unarchived chat id={}", id);
    Ok(chat_with_messages.chat)
}

/// Delete a chat by ID.
/// Note: Due to CASCADE, this also deletes associated messages.
pub async fn delete(pool: &SqlitePool, id: &str) -> ServiceResult<()> {
    debug!("Deleting chat id={}", id);

    // Verify the chat exists first and get details for logging
    let existing = get(pool, id).await?;
    let message_count = existing.messages.len();

    sqlx::query("DELETE FROM chats WHERE id = ?")
        .bind(id)
        .execute(pool)
        .await
        .map_err(|e| {
            error!("Failed to delete chat id={}: {}", id, e);
            ServiceError::Database(e)
        })?;

    info!(
        "Deleted chat id={}, project_id={}, cascaded {} messages",
        id, existing.chat.project_id, message_count
    );
    Ok(())
}

/// Toggle the completion status of a workflow step (chat).
///
/// If `setup_completed_at` is None, sets it to the current timestamp.
/// If `setup_completed_at` is Some, clears it to None.
///
/// # Arguments
/// * `pool` - Database connection pool
/// * `id` - Chat ID to toggle
///
/// # Returns
/// The updated Chat with toggled completion status.
pub async fn toggle_step_complete(pool: &SqlitePool, id: &str) -> ServiceResult<Chat> {
    debug!("Toggling step completion for chat id={}", id);

    // Get the current chat to check completion status
    let existing = get(pool, id).await?.chat;
    let was_completed = existing.setup_completed_at.is_some();

    // Toggle: if completed, clear it; if not completed, set to now
    if was_completed {
        // Clear completion
        debug!("Marking chat id={} as incomplete", id);
        sqlx::query(
            r#"
            UPDATE chats
            SET setup_completed_at = NULL,
                updated_at = datetime('now', 'subsec')
            WHERE id = ?
            "#,
        )
        .bind(id)
        .execute(pool)
        .await
        .map_err(|e| {
            error!("Failed to clear completion for chat id={}: {}", id, e);
            ServiceError::Database(e)
        })?;
    } else {
        // Mark as completed
        debug!("Marking chat id={} as complete", id);
        sqlx::query(
            r#"
            UPDATE chats
            SET setup_completed_at = datetime('now', 'subsec'),
                updated_at = datetime('now', 'subsec')
            WHERE id = ?
            "#,
        )
        .bind(id)
        .execute(pool)
        .await
        .map_err(|e| {
            error!("Failed to mark completion for chat id={}: {}", id, e);
            ServiceError::Database(e)
        })?;
    }

    let chat_with_messages = get(pool, id).await?;

    info!(
        "Toggled step completion for chat id={}: {} -> {}",
        id,
        if was_completed {
            "completed"
        } else {
            "incomplete"
        },
        if chat_with_messages.chat.setup_completed_at.is_some() {
            "completed"
        } else {
            "incomplete"
        }
    );
    Ok(chat_with_messages.chat)
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::services::project;
    use crate::services::task;
    use openflow_contracts::{CreateProjectRequest, CreateTaskRequest};
    use openflow_db::{init_db, DbConfig};
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
        let config = DbConfig::from_directory(temp_dir.path());
        let pool = init_db(config)
            .await
            .expect("Failed to initialize test database");
        TestDb { pool, temp_dir }
    }

    /// Helper to create a test project.
    async fn create_test_project(pool: &SqlitePool, name: &str) -> String {
        let request = CreateProjectRequest {
            name: name.to_string(),
            git_repo_path: format!("/path/to/{}", name.to_lowercase().replace(' ', "-")),
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
            .expect("Failed to create test project")
            .id
    }

    /// Helper to create a test task.
    async fn create_test_task(pool: &SqlitePool, project_id: &str, title: &str) -> String {
        let request = CreateTaskRequest {
            project_id: project_id.to_string(),
            title: title.to_string(),
            description: None,
            workflow_template: None,
            parent_task_id: None,
            base_branch: None,
        };
        task::create(pool, request)
            .await
            .expect("Failed to create test task")
            .id
    }

    /// Helper to create a test chat request for task-linked chats.
    fn test_create_request(task_id: &str, project_id: &str) -> CreateChatRequest {
        CreateChatRequest {
            task_id: Some(task_id.to_string()),
            project_id: project_id.to_string(),
            title: None,
            chat_role: None,
            executor_profile_id: None,
            base_branch: None,
            initial_prompt: None,
            hidden_prompt: None,
            is_plan_container: None,
            main_chat_id: None,
            workflow_step_index: None,
        }
    }

    /// Helper to create a test standalone chat request (no task).
    fn test_standalone_request(project_id: &str) -> CreateChatRequest {
        CreateChatRequest {
            task_id: None,
            project_id: project_id.to_string(),
            title: None,
            chat_role: None,
            executor_profile_id: None,
            base_branch: None,
            initial_prompt: None,
            hidden_prompt: None,
            is_plan_container: None,
            main_chat_id: None,
            workflow_step_index: None,
        }
    }

    #[tokio::test]
    async fn test_create_chat() {
        let test_db = setup_test_db().await;
        let project_id = create_test_project(&test_db.pool, "Test Project").await;
        let task_id = create_test_task(&test_db.pool, &project_id, "Test Task").await;

        let request = test_create_request(&task_id, &project_id);
        let chat = create(&test_db.pool, request)
            .await
            .expect("Failed to create chat");

        assert_eq!(chat.task_id, Some(task_id));
        assert_eq!(chat.project_id, project_id);
        assert_eq!(chat.chat_role, ChatRole::Main); // Default
        assert_eq!(chat.base_branch, "main"); // Default
        assert!(!chat.worktree_deleted);
        assert!(!chat.is_plan_container);
        assert!(chat.title.is_none());
        assert!(chat.branch.is_none());
        assert!(chat.worktree_path.is_none());
        assert!(!chat.id.is_empty());
    }

    #[tokio::test]
    async fn test_create_standalone_chat() {
        let test_db = setup_test_db().await;
        let project_id = create_test_project(&test_db.pool, "Test Project").await;

        let request = test_standalone_request(&project_id);
        let chat = create(&test_db.pool, request)
            .await
            .expect("Failed to create standalone chat");

        assert!(chat.task_id.is_none());
        assert_eq!(chat.project_id, project_id);
        assert_eq!(chat.chat_role, ChatRole::Main);
        assert!(!chat.id.is_empty());
    }

    #[tokio::test]
    async fn test_list_standalone_chats() {
        let test_db = setup_test_db().await;
        let project_id = create_test_project(&test_db.pool, "Test Project").await;
        let task_id = create_test_task(&test_db.pool, &project_id, "Test Task").await;

        // Create a task-linked chat
        let task_chat_request = test_create_request(&task_id, &project_id);
        create(&test_db.pool, task_chat_request)
            .await
            .expect("Failed to create task chat");

        // Create standalone chats
        let standalone1 = CreateChatRequest {
            task_id: None,
            project_id: project_id.clone(),
            title: Some("Standalone 1".to_string()),
            ..test_standalone_request(&project_id)
        };
        let standalone2 = CreateChatRequest {
            task_id: None,
            project_id: project_id.clone(),
            title: Some("Standalone 2".to_string()),
            ..test_standalone_request(&project_id)
        };

        create(&test_db.pool, standalone1).await.unwrap();
        create(&test_db.pool, standalone2).await.unwrap();

        // List standalone should only return standalone chats
        let standalone_chats = list_standalone(&test_db.pool, &project_id)
            .await
            .expect("Failed to list standalone chats");

        assert_eq!(standalone_chats.len(), 2);
        for chat in &standalone_chats {
            assert!(chat.task_id.is_none());
        }

        // List by project should return all chats
        let all_chats = list_by_project(&test_db.pool, &project_id)
            .await
            .expect("Failed to list all chats");

        assert_eq!(all_chats.len(), 3);
    }

    #[tokio::test]
    async fn test_create_chat_with_all_fields() {
        let test_db = setup_test_db().await;
        let project_id = create_test_project(&test_db.pool, "Test Project").await;
        let task_id = create_test_task(&test_db.pool, &project_id, "Test Task").await;

        let request = CreateChatRequest {
            task_id: Some(task_id.clone()),
            project_id: project_id.clone(),
            title: Some("Implementation Step".to_string()),
            chat_role: Some(ChatRole::Review),
            executor_profile_id: None,
            base_branch: Some("develop".to_string()),
            initial_prompt: Some("Review the code changes".to_string()),
            hidden_prompt: Some("System context".to_string()),
            is_plan_container: Some(true),
            main_chat_id: None,
            workflow_step_index: Some(1),
        };

        let chat = create(&test_db.pool, request)
            .await
            .expect("Failed to create chat");

        assert_eq!(chat.title, Some("Implementation Step".to_string()));
        assert_eq!(chat.chat_role, ChatRole::Review);
        assert_eq!(chat.base_branch, "develop");
        assert_eq!(
            chat.initial_prompt,
            Some("Review the code changes".to_string())
        );
        assert_eq!(chat.hidden_prompt, Some("System context".to_string()));
        assert!(chat.is_plan_container);
        assert_eq!(chat.workflow_step_index, Some(1));
    }

    #[tokio::test]
    async fn test_get_chat() {
        let test_db = setup_test_db().await;
        let project_id = create_test_project(&test_db.pool, "Test Project").await;
        let task_id = create_test_task(&test_db.pool, &project_id, "Test Task").await;

        // Create a chat first
        let request = CreateChatRequest {
            task_id: Some(task_id.clone()),
            project_id: project_id.clone(),
            title: Some("Get Test Chat".to_string()),
            chat_role: Some(ChatRole::Main),
            executor_profile_id: None,
            base_branch: None,
            initial_prompt: None,
            hidden_prompt: None,
            is_plan_container: None,
            main_chat_id: None,
            workflow_step_index: None,
        };
        let created = create(&test_db.pool, request)
            .await
            .expect("Failed to create chat");

        // Get the chat
        let fetched = get(&test_db.pool, &created.id)
            .await
            .expect("Failed to get chat");

        assert_eq!(fetched.chat.id, created.id);
        assert_eq!(fetched.chat.title, Some("Get Test Chat".to_string()));
        assert!(fetched.messages.is_empty()); // No messages created yet
    }

    #[tokio::test]
    async fn test_get_chat_not_found() {
        let test_db = setup_test_db().await;

        let result = get(&test_db.pool, "non-existent-id").await;

        assert!(result.is_err());
        match result.unwrap_err() {
            ServiceError::NotFound { entity, id } => {
                assert_eq!(entity, "Chat");
                assert_eq!(id, "non-existent-id");
            }
            other => panic!("Expected NotFound error, got: {:?}", other),
        }
    }

    #[tokio::test]
    async fn test_list_chats() {
        let test_db = setup_test_db().await;
        let project_id = create_test_project(&test_db.pool, "Test Project").await;
        let task_id = create_test_task(&test_db.pool, &project_id, "Test Task").await;

        // Start with empty list
        let chats = list(&test_db.pool, &task_id)
            .await
            .expect("Failed to list chats");
        assert!(chats.is_empty());

        // Create multiple chats with different step indices
        let request1 = CreateChatRequest {
            task_id: Some(task_id.clone()),
            project_id: project_id.clone(),
            title: Some("Step 3".to_string()),
            chat_role: None,
            executor_profile_id: None,
            base_branch: None,
            initial_prompt: None,
            hidden_prompt: None,
            is_plan_container: None,
            main_chat_id: None,
            workflow_step_index: Some(3),
        };
        let request2 = CreateChatRequest {
            task_id: Some(task_id.clone()),
            project_id: project_id.clone(),
            title: Some("Step 1".to_string()),
            chat_role: None,
            executor_profile_id: None,
            base_branch: None,
            initial_prompt: None,
            hidden_prompt: None,
            is_plan_container: None,
            main_chat_id: None,
            workflow_step_index: Some(1),
        };
        let request3 = CreateChatRequest {
            task_id: Some(task_id.clone()),
            project_id: project_id.clone(),
            title: Some("Step 2".to_string()),
            chat_role: None,
            executor_profile_id: None,
            base_branch: None,
            initial_prompt: None,
            hidden_prompt: None,
            is_plan_container: None,
            main_chat_id: None,
            workflow_step_index: Some(2),
        };

        create(&test_db.pool, request1).await.unwrap();
        create(&test_db.pool, request2).await.unwrap();
        create(&test_db.pool, request3).await.unwrap();

        // List should return chats ordered by workflow_step_index
        let chats = list(&test_db.pool, &task_id)
            .await
            .expect("Failed to list chats");

        assert_eq!(chats.len(), 3);
        assert_eq!(chats[0].title, Some("Step 1".to_string()));
        assert_eq!(chats[1].title, Some("Step 2".to_string()));
        assert_eq!(chats[2].title, Some("Step 3".to_string()));
    }

    #[tokio::test]
    async fn test_list_chats_isolated_by_task() {
        let test_db = setup_test_db().await;
        let project_id = create_test_project(&test_db.pool, "Test Project").await;
        let task1_id = create_test_task(&test_db.pool, &project_id, "Task 1").await;
        let task2_id = create_test_task(&test_db.pool, &project_id, "Task 2").await;

        // Create chats in both tasks
        let request1 = CreateChatRequest {
            task_id: Some(task1_id.clone()),
            project_id: project_id.clone(),
            title: Some("Task 1 Chat".to_string()),
            chat_role: None,
            executor_profile_id: None,
            base_branch: None,
            initial_prompt: None,
            hidden_prompt: None,
            is_plan_container: None,
            main_chat_id: None,
            workflow_step_index: None,
        };
        let request2 = CreateChatRequest {
            task_id: Some(task2_id.clone()),
            project_id: project_id.clone(),
            title: Some("Task 2 Chat".to_string()),
            chat_role: None,
            executor_profile_id: None,
            base_branch: None,
            initial_prompt: None,
            hidden_prompt: None,
            is_plan_container: None,
            main_chat_id: None,
            workflow_step_index: None,
        };

        create(&test_db.pool, request1).await.unwrap();
        create(&test_db.pool, request2).await.unwrap();

        // List chats for task 1
        let task1_chats = list(&test_db.pool, &task1_id)
            .await
            .expect("Failed to list chats");
        assert_eq!(task1_chats.len(), 1);
        assert_eq!(task1_chats[0].title, Some("Task 1 Chat".to_string()));

        // List chats for task 2
        let task2_chats = list(&test_db.pool, &task2_id)
            .await
            .expect("Failed to list chats");
        assert_eq!(task2_chats.len(), 1);
        assert_eq!(task2_chats[0].title, Some("Task 2 Chat".to_string()));
    }

    #[tokio::test]
    async fn test_update_chat() {
        let test_db = setup_test_db().await;
        let project_id = create_test_project(&test_db.pool, "Test Project").await;
        let task_id = create_test_task(&test_db.pool, &project_id, "Test Task").await;

        // Create a chat
        let request = test_create_request(&task_id, &project_id);
        let created = create(&test_db.pool, request)
            .await
            .expect("Failed to create chat");

        // Update with new values
        let update_request = UpdateChatRequest {
            title: Some("Updated Title".to_string()),
            executor_profile_id: None,
            branch: Some("feature/test".to_string()),
            worktree_path: Some("/tmp/worktree/test".to_string()),
            worktree_deleted: None,
            setup_completed_at: Some("2024-01-15T10:00:00Z".to_string()),
            initial_prompt: None,
            hidden_prompt: None,
            claude_session_id: None,
        };

        let updated = update(&test_db.pool, &created.id, update_request)
            .await
            .expect("Failed to update chat");

        assert_eq!(updated.id, created.id);
        assert_eq!(updated.title, Some("Updated Title".to_string()));
        assert_eq!(updated.branch, Some("feature/test".to_string()));
        assert_eq!(
            updated.worktree_path,
            Some("/tmp/worktree/test".to_string())
        );
        assert_eq!(
            updated.setup_completed_at,
            Some("2024-01-15T10:00:00Z".to_string())
        );
    }

    #[tokio::test]
    async fn test_update_chat_preserves_unset_fields() {
        let test_db = setup_test_db().await;
        let project_id = create_test_project(&test_db.pool, "Test Project").await;
        let task_id = create_test_task(&test_db.pool, &project_id, "Test Task").await;

        // Create a chat with some values
        let request = CreateChatRequest {
            task_id: Some(task_id.clone()),
            project_id: project_id.clone(),
            title: Some("Original Title".to_string()),
            chat_role: Some(ChatRole::Test),
            executor_profile_id: None,
            base_branch: Some("develop".to_string()),
            initial_prompt: Some("Original prompt".to_string()),
            hidden_prompt: None,
            is_plan_container: None,
            main_chat_id: None,
            workflow_step_index: None,
        };
        let created = create(&test_db.pool, request)
            .await
            .expect("Failed to create chat");

        // Update only branch
        let update_request = UpdateChatRequest {
            title: None,
            executor_profile_id: None,
            branch: Some("feature/update".to_string()),
            worktree_path: None,
            worktree_deleted: None,
            setup_completed_at: None,
            initial_prompt: None,
            hidden_prompt: None,
            claude_session_id: None,
        };

        let updated = update(&test_db.pool, &created.id, update_request)
            .await
            .expect("Failed to update chat");

        // Original fields preserved
        assert_eq!(updated.title, Some("Original Title".to_string()));
        assert_eq!(updated.initial_prompt, Some("Original prompt".to_string()));
        assert_eq!(updated.chat_role, ChatRole::Test);
        // New field updated
        assert_eq!(updated.branch, Some("feature/update".to_string()));
    }

    #[tokio::test]
    async fn test_update_chat_worktree_deleted() {
        let test_db = setup_test_db().await;
        let project_id = create_test_project(&test_db.pool, "Test Project").await;
        let task_id = create_test_task(&test_db.pool, &project_id, "Test Task").await;

        let request = test_create_request(&task_id, &project_id);
        let created = create(&test_db.pool, request)
            .await
            .expect("Failed to create chat");

        assert!(!created.worktree_deleted);

        // Mark worktree as deleted
        let update_request = UpdateChatRequest {
            title: None,
            executor_profile_id: None,
            branch: None,
            worktree_path: None,
            worktree_deleted: Some(true),
            setup_completed_at: None,
            initial_prompt: None,
            hidden_prompt: None,
            claude_session_id: None,
        };

        let updated = update(&test_db.pool, &created.id, update_request)
            .await
            .expect("Failed to update chat");

        assert!(updated.worktree_deleted);
    }

    #[tokio::test]
    async fn test_update_chat_not_found() {
        let test_db = setup_test_db().await;

        let update_request = UpdateChatRequest {
            title: Some("New Title".to_string()),
            executor_profile_id: None,
            branch: None,
            worktree_path: None,
            worktree_deleted: None,
            setup_completed_at: None,
            initial_prompt: None,
            hidden_prompt: None,
            claude_session_id: None,
        };

        let result = update(&test_db.pool, "non-existent-id", update_request).await;

        assert!(result.is_err());
        match result.unwrap_err() {
            ServiceError::NotFound { entity, .. } => {
                assert_eq!(entity, "Chat");
            }
            other => panic!("Expected NotFound error, got: {:?}", other),
        }
    }

    #[tokio::test]
    async fn test_delete_chat() {
        let test_db = setup_test_db().await;
        let project_id = create_test_project(&test_db.pool, "Test Project").await;
        let task_id = create_test_task(&test_db.pool, &project_id, "Test Task").await;

        // Create a chat
        let request = test_create_request(&task_id, &project_id);
        let created = create(&test_db.pool, request)
            .await
            .expect("Failed to create chat");

        // Verify it exists
        let fetched = get(&test_db.pool, &created.id).await;
        assert!(fetched.is_ok());

        // Delete it
        delete(&test_db.pool, &created.id)
            .await
            .expect("Failed to delete chat");

        // Verify it's gone
        let result = get(&test_db.pool, &created.id).await;
        assert!(result.is_err());
        match result.unwrap_err() {
            ServiceError::NotFound { entity, .. } => {
                assert_eq!(entity, "Chat");
            }
            other => panic!("Expected NotFound error, got: {:?}", other),
        }
    }

    #[tokio::test]
    async fn test_delete_chat_not_found() {
        let test_db = setup_test_db().await;

        let result = delete(&test_db.pool, "non-existent-id").await;

        assert!(result.is_err());
        match result.unwrap_err() {
            ServiceError::NotFound { entity, .. } => {
                assert_eq!(entity, "Chat");
            }
            other => panic!("Expected NotFound error, got: {:?}", other),
        }
    }

    #[tokio::test]
    async fn test_delete_task_cascades_to_chats() {
        let test_db = setup_test_db().await;
        let project_id = create_test_project(&test_db.pool, "Test Project").await;
        let task_id = create_test_task(&test_db.pool, &project_id, "Test Task").await;

        // Create chat
        let request = test_create_request(&task_id, &project_id);
        let chat = create(&test_db.pool, request)
            .await
            .expect("Failed to create chat");

        // Delete the task
        task::delete(&test_db.pool, &task_id)
            .await
            .expect("Failed to delete task");

        // Chat should be gone
        let result = get(&test_db.pool, &chat.id).await;
        assert!(result.is_err());
    }

    #[tokio::test]
    async fn test_create_chat_with_main_chat_reference() {
        let test_db = setup_test_db().await;
        let project_id = create_test_project(&test_db.pool, "Test Project").await;
        let task_id = create_test_task(&test_db.pool, &project_id, "Test Task").await;

        // Create main chat
        let main_request = CreateChatRequest {
            task_id: Some(task_id.clone()),
            project_id: project_id.clone(),
            title: Some("Main Chat".to_string()),
            chat_role: Some(ChatRole::Main),
            executor_profile_id: None,
            base_branch: None,
            initial_prompt: None,
            hidden_prompt: None,
            is_plan_container: None,
            main_chat_id: None,
            workflow_step_index: Some(0),
        };
        let main_chat = create(&test_db.pool, main_request)
            .await
            .expect("Failed to create main chat");

        // Create terminal chat referencing main
        let terminal_request = CreateChatRequest {
            task_id: Some(task_id.clone()),
            project_id: project_id.clone(),
            title: Some("Terminal".to_string()),
            chat_role: Some(ChatRole::Terminal),
            executor_profile_id: None,
            base_branch: None,
            initial_prompt: None,
            hidden_prompt: None,
            is_plan_container: None,
            main_chat_id: Some(main_chat.id.clone()),
            workflow_step_index: None,
        };
        let terminal_chat = create(&test_db.pool, terminal_request)
            .await
            .expect("Failed to create terminal chat");

        assert_eq!(terminal_chat.main_chat_id, Some(main_chat.id.clone()));
        assert_eq!(terminal_chat.chat_role, ChatRole::Terminal);
    }

    #[tokio::test]
    async fn test_all_chat_roles() {
        let test_db = setup_test_db().await;
        let project_id = create_test_project(&test_db.pool, "Test Project").await;
        let task_id = create_test_task(&test_db.pool, &project_id, "Test Task").await;

        let roles = vec![
            ChatRole::Main,
            ChatRole::Review,
            ChatRole::Test,
            ChatRole::Terminal,
        ];

        for role in roles {
            let request = CreateChatRequest {
                task_id: Some(task_id.clone()),
                project_id: project_id.clone(),
                title: Some(format!("{:?} Chat", role)),
                chat_role: Some(role.clone()),
                executor_profile_id: None,
                base_branch: None,
                initial_prompt: None,
                hidden_prompt: None,
                is_plan_container: None,
                main_chat_id: None,
                workflow_step_index: None,
            };
            let chat = create(&test_db.pool, request)
                .await
                .expect("Failed to create chat");

            assert_eq!(chat.chat_role, role);
        }
    }

    #[tokio::test]
    async fn test_list_chats_null_step_index_ordering() {
        let test_db = setup_test_db().await;
        let project_id = create_test_project(&test_db.pool, "Test Project").await;
        let task_id = create_test_task(&test_db.pool, &project_id, "Test Task").await;

        // Create chat without step index (NULL)
        let request1 = CreateChatRequest {
            task_id: Some(task_id.clone()),
            project_id: project_id.clone(),
            title: Some("No Index".to_string()),
            chat_role: None,
            executor_profile_id: None,
            base_branch: None,
            initial_prompt: None,
            hidden_prompt: None,
            is_plan_container: None,
            main_chat_id: None,
            workflow_step_index: None,
        };

        // Create chat with step index
        let request2 = CreateChatRequest {
            task_id: Some(task_id.clone()),
            project_id: project_id.clone(),
            title: Some("Index 1".to_string()),
            chat_role: None,
            executor_profile_id: None,
            base_branch: None,
            initial_prompt: None,
            hidden_prompt: None,
            is_plan_container: None,
            main_chat_id: None,
            workflow_step_index: Some(1),
        };

        create(&test_db.pool, request1).await.unwrap();
        create(&test_db.pool, request2).await.unwrap();

        let chats = list(&test_db.pool, &task_id)
            .await
            .expect("Failed to list chats");

        // NULL values sort first in SQLite with ASC order
        assert_eq!(chats.len(), 2);
        assert_eq!(chats[0].title, Some("No Index".to_string()));
        assert_eq!(chats[1].title, Some("Index 1".to_string()));
    }

    #[tokio::test]
    async fn test_archive_chat() {
        let test_db = setup_test_db().await;
        let project_id = create_test_project(&test_db.pool, "Test Project").await;
        let task_id = create_test_task(&test_db.pool, &project_id, "Test Task").await;

        // Create a chat
        let request = test_create_request(&task_id, &project_id);
        let created = create(&test_db.pool, request)
            .await
            .expect("Failed to create chat");

        // Verify not archived
        assert!(created.archived_at.is_none());

        // Archive it
        let archived = archive(&test_db.pool, &created.id)
            .await
            .expect("Failed to archive chat");

        assert!(archived.archived_at.is_some());
    }

    #[tokio::test]
    async fn test_unarchive_chat() {
        let test_db = setup_test_db().await;
        let project_id = create_test_project(&test_db.pool, "Test Project").await;
        let task_id = create_test_task(&test_db.pool, &project_id, "Test Task").await;

        // Create and archive a chat
        let request = test_create_request(&task_id, &project_id);
        let created = create(&test_db.pool, request)
            .await
            .expect("Failed to create chat");
        let archived = archive(&test_db.pool, &created.id)
            .await
            .expect("Failed to archive chat");

        assert!(archived.archived_at.is_some());

        // Unarchive it
        let unarchived = unarchive(&test_db.pool, &created.id)
            .await
            .expect("Failed to unarchive chat");

        assert!(unarchived.archived_at.is_none());
    }

    #[tokio::test]
    async fn test_list_archived_chats() {
        let test_db = setup_test_db().await;
        let project_id = create_test_project(&test_db.pool, "Test Project").await;
        let task_id = create_test_task(&test_db.pool, &project_id, "Test Task").await;

        // Create chats
        let request1 = CreateChatRequest {
            task_id: Some(task_id.clone()),
            project_id: project_id.clone(),
            title: Some("Active Chat".to_string()),
            ..test_create_request(&task_id, &project_id)
        };
        let request2 = CreateChatRequest {
            task_id: Some(task_id.clone()),
            project_id: project_id.clone(),
            title: Some("Archived Chat 1".to_string()),
            ..test_create_request(&task_id, &project_id)
        };
        let request3 = CreateChatRequest {
            task_id: Some(task_id.clone()),
            project_id: project_id.clone(),
            title: Some("Archived Chat 2".to_string()),
            ..test_create_request(&task_id, &project_id)
        };

        create(&test_db.pool, request1).await.unwrap();
        let chat2 = create(&test_db.pool, request2).await.unwrap();
        let chat3 = create(&test_db.pool, request3).await.unwrap();

        // Archive some chats
        archive(&test_db.pool, &chat2.id).await.unwrap();
        archive(&test_db.pool, &chat3.id).await.unwrap();

        // List archived should only return archived chats
        let archived_chats = list_archived(&test_db.pool)
            .await
            .expect("Failed to list archived chats");

        assert_eq!(archived_chats.len(), 2);
        for chat in &archived_chats {
            assert!(chat.archived_at.is_some());
        }
    }

    #[tokio::test]
    async fn test_toggle_step_complete_mark_complete() {
        let test_db = setup_test_db().await;
        let project_id = create_test_project(&test_db.pool, "Test Project").await;
        let task_id = create_test_task(&test_db.pool, &project_id, "Test Task").await;

        // Create a chat without completion
        let request = CreateChatRequest {
            task_id: Some(task_id.clone()),
            project_id: project_id.clone(),
            title: Some("Step to Complete".to_string()),
            chat_role: None,
            executor_profile_id: None,
            base_branch: None,
            initial_prompt: None,
            hidden_prompt: None,
            is_plan_container: None,
            main_chat_id: None,
            workflow_step_index: Some(1),
        };
        let chat = create(&test_db.pool, request)
            .await
            .expect("Failed to create chat");

        // Verify not completed initially
        assert!(chat.setup_completed_at.is_none());

        // Toggle to complete
        let completed = toggle_step_complete(&test_db.pool, &chat.id)
            .await
            .expect("Failed to toggle step complete");

        assert!(completed.setup_completed_at.is_some());
        assert_eq!(completed.id, chat.id);
    }

    #[tokio::test]
    async fn test_toggle_step_complete_mark_incomplete() {
        let test_db = setup_test_db().await;
        let project_id = create_test_project(&test_db.pool, "Test Project").await;
        let task_id = create_test_task(&test_db.pool, &project_id, "Test Task").await;

        // Create a chat and mark it complete via update
        let request = CreateChatRequest {
            task_id: Some(task_id.clone()),
            project_id: project_id.clone(),
            title: Some("Completed Step".to_string()),
            chat_role: None,
            executor_profile_id: None,
            base_branch: None,
            initial_prompt: None,
            hidden_prompt: None,
            is_plan_container: None,
            main_chat_id: None,
            workflow_step_index: Some(1),
        };
        let chat = create(&test_db.pool, request)
            .await
            .expect("Failed to create chat");

        // Mark as complete first
        let update_request = UpdateChatRequest {
            title: None,
            executor_profile_id: None,
            branch: None,
            worktree_path: None,
            worktree_deleted: None,
            setup_completed_at: Some("2024-01-15T10:00:00Z".to_string()),
            initial_prompt: None,
            hidden_prompt: None,
            claude_session_id: None,
        };
        let completed = update(&test_db.pool, &chat.id, update_request)
            .await
            .expect("Failed to update chat");
        assert!(completed.setup_completed_at.is_some());

        // Toggle to incomplete
        let toggled = toggle_step_complete(&test_db.pool, &chat.id)
            .await
            .expect("Failed to toggle step complete");

        assert!(toggled.setup_completed_at.is_none());
    }

    #[tokio::test]
    async fn test_toggle_step_complete_double_toggle() {
        let test_db = setup_test_db().await;
        let project_id = create_test_project(&test_db.pool, "Test Project").await;
        let task_id = create_test_task(&test_db.pool, &project_id, "Test Task").await;

        let request = CreateChatRequest {
            task_id: Some(task_id.clone()),
            project_id: project_id.clone(),
            title: Some("Double Toggle Step".to_string()),
            chat_role: None,
            executor_profile_id: None,
            base_branch: None,
            initial_prompt: None,
            hidden_prompt: None,
            is_plan_container: None,
            main_chat_id: None,
            workflow_step_index: Some(1),
        };
        let chat = create(&test_db.pool, request)
            .await
            .expect("Failed to create chat");

        // Start incomplete
        assert!(chat.setup_completed_at.is_none());

        // Toggle to complete
        let toggled1 = toggle_step_complete(&test_db.pool, &chat.id)
            .await
            .expect("Failed to toggle step complete");
        assert!(toggled1.setup_completed_at.is_some());

        // Toggle back to incomplete
        let toggled2 = toggle_step_complete(&test_db.pool, &chat.id)
            .await
            .expect("Failed to toggle step complete");
        assert!(toggled2.setup_completed_at.is_none());

        // Toggle to complete again
        let toggled3 = toggle_step_complete(&test_db.pool, &chat.id)
            .await
            .expect("Failed to toggle step complete");
        assert!(toggled3.setup_completed_at.is_some());
    }

    #[tokio::test]
    async fn test_toggle_step_complete_not_found() {
        let test_db = setup_test_db().await;

        let result = toggle_step_complete(&test_db.pool, "non-existent-id").await;

        assert!(result.is_err());
        match result.unwrap_err() {
            ServiceError::NotFound { entity, id } => {
                assert_eq!(entity, "Chat");
                assert_eq!(id, "non-existent-id");
            }
            other => panic!("Expected NotFound error, got: {:?}", other),
        }
    }
}
