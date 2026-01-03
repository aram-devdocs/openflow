//! Message management service.
//!
//! Handles CRUD operations for chat messages within chat sessions.
//!
//! # Logging
//!
//! This service uses the `log` crate for structured logging:
//! - `debug!`: Detailed operation tracing (query params, internal steps)
//! - `info!`: Successful operations (create, update, delete)
//! - `warn!`: Potentially problematic but recoverable situations
//! - `error!`: Operation failures (logged before returning error)
//!
//! # Error Handling
//!
//! All functions return `ServiceResult<T>` which wraps errors in `ServiceError`.
//! Errors are logged at the appropriate level before being returned.

use log::{debug, error, info};
use sqlx::SqlitePool;
use uuid::Uuid;

use openflow_contracts::{CreateMessageRequest, Message, MessageRole, UpdateMessageRequest};

use super::{ServiceError, ServiceResult};

/// List messages for a chat.
///
/// # Arguments
/// * `pool` - Database connection pool
/// * `chat_id` - Chat to list messages for
///
/// Returns messages ordered by created_at ASC.
pub async fn list(pool: &SqlitePool, chat_id: &str) -> ServiceResult<Vec<Message>> {
    debug!("Listing messages for chat_id={}", chat_id);

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
    .bind(chat_id)
    .fetch_all(pool)
    .await
    .map_err(|e| {
        error!("Failed to list messages for chat_id={}: {}", chat_id, e);
        ServiceError::Database(e)
    })?;

    debug!(
        "Found {} messages for chat_id={} (user: {}, assistant: {}, system: {})",
        messages.len(),
        chat_id,
        messages
            .iter()
            .filter(|m| m.role == MessageRole::User)
            .count(),
        messages
            .iter()
            .filter(|m| m.role == MessageRole::Assistant)
            .count(),
        messages
            .iter()
            .filter(|m| m.role == MessageRole::System)
            .count()
    );
    Ok(messages)
}

/// Get a message by ID.
///
/// # Arguments
/// * `pool` - Database connection pool
/// * `id` - Message ID to fetch
///
/// # Errors
/// Returns `ServiceError::NotFound` if the message doesn't exist.
pub async fn get(pool: &SqlitePool, id: &str) -> ServiceResult<Message> {
    debug!("Getting message by id={}", id);

    let message = sqlx::query_as::<_, Message>(
        r#"
        SELECT
            id, chat_id, role, content, tool_calls, tool_results,
            is_streaming, tokens_used, model, created_at
        FROM messages
        WHERE id = ?
        "#,
    )
    .bind(id)
    .fetch_optional(pool)
    .await
    .map_err(|e| {
        error!("Failed to get message id={}: {}", id, e);
        ServiceError::Database(e)
    })?
    .ok_or_else(|| {
        debug!("Message not found: id={}", id);
        ServiceError::NotFound {
            entity: "Message",
            id: id.to_string(),
        }
    })?;

    debug!(
        "Found message id={}, role={}, chat_id={}, content_length={}",
        message.id,
        message.role,
        message.chat_id,
        message.content.len()
    );
    Ok(message)
}

/// Create a new message.
///
/// # Arguments
/// * `pool` - Database connection pool
/// * `request` - Message creation request
///
/// Returns the created message.
pub async fn create(pool: &SqlitePool, request: CreateMessageRequest) -> ServiceResult<Message> {
    let id = Uuid::new_v4().to_string();
    let is_streaming = request.is_streaming.unwrap_or(false);

    debug!(
        "Creating message: id={}, chat_id={}, role={}, content_length={}, has_tool_calls={}, has_tool_results={}, model={:?}, is_streaming={}",
        id,
        request.chat_id,
        request.role,
        request.content.len(),
        request.tool_calls.is_some(),
        request.tool_results.is_some(),
        request.model,
        is_streaming
    );

    sqlx::query(
        r#"
        INSERT INTO messages (
            id, chat_id, role, content, tool_calls, tool_results, model, is_streaming
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        "#,
    )
    .bind(&id)
    .bind(&request.chat_id)
    .bind(request.role.to_string())
    .bind(&request.content)
    .bind(&request.tool_calls)
    .bind(&request.tool_results)
    .bind(&request.model)
    .bind(is_streaming)
    .execute(pool)
    .await
    .map_err(|e| {
        error!(
            "Failed to create message in chat_id={}: {}",
            request.chat_id, e
        );
        ServiceError::Database(e)
    })?;

    info!(
        "Created message id={} in chat_id={} with role={}",
        id, request.chat_id, request.role
    );

    // Fetch and return the created message
    get(pool, &id).await
}

/// Update an existing message.
///
/// # Arguments
/// * `pool` - Database connection pool
/// * `id` - Message ID to update
/// * `request` - Update request with optional fields
///
/// # Errors
/// Returns `ServiceError::NotFound` if the message doesn't exist.
pub async fn update(
    pool: &SqlitePool,
    id: &str,
    request: UpdateMessageRequest,
) -> ServiceResult<Message> {
    debug!("Updating message id={}", id);

    // Verify the message exists first
    let existing = get(pool, id).await?;

    // Apply updates, falling back to existing values
    let content = request.content.unwrap_or(existing.content);
    let tool_calls = request.tool_calls.or(existing.tool_calls);
    let tool_results = request.tool_results.or(existing.tool_results);
    let is_streaming = request.is_streaming.unwrap_or(existing.is_streaming);
    let tokens_used = request.tokens_used.or(existing.tokens_used);
    let model = request.model.or(existing.model);

    sqlx::query(
        r#"
        UPDATE messages
        SET
            content = ?,
            tool_calls = ?,
            tool_results = ?,
            is_streaming = ?,
            tokens_used = ?,
            model = ?
        WHERE id = ?
        "#,
    )
    .bind(&content)
    .bind(&tool_calls)
    .bind(&tool_results)
    .bind(is_streaming)
    .bind(tokens_used)
    .bind(&model)
    .bind(id)
    .execute(pool)
    .await
    .map_err(|e| {
        error!("Failed to update message id={}: {}", id, e);
        ServiceError::Database(e)
    })?;

    info!("Updated message id={}", id);

    get(pool, id).await
}

/// Mark a message as streaming or not.
///
/// # Arguments
/// * `pool` - Database connection pool
/// * `id` - Message ID to update
/// * `is_streaming` - Whether the message is currently streaming
///
/// # Errors
/// Returns `ServiceError::NotFound` if the message doesn't exist.
pub async fn set_streaming(
    pool: &SqlitePool,
    id: &str,
    is_streaming: bool,
) -> ServiceResult<Message> {
    debug!(
        "Setting streaming state for message id={} to {}",
        id, is_streaming
    );

    // Verify the message exists first
    let message = get(pool, id).await?;

    sqlx::query(
        r#"
        UPDATE messages
        SET is_streaming = ?
        WHERE id = ?
        "#,
    )
    .bind(is_streaming)
    .bind(id)
    .execute(pool)
    .await
    .map_err(|e| {
        error!("Failed to set streaming state for message id={}: {}", id, e);
        ServiceError::Database(e)
    })?;

    debug!(
        "Updated streaming state for message id={} in chat_id={}: {} -> {}",
        id, message.chat_id, message.is_streaming, is_streaming
    );

    get(pool, id).await
}

/// Update token usage for a message.
///
/// # Arguments
/// * `pool` - Database connection pool
/// * `id` - Message ID to update
/// * `tokens_used` - Number of tokens consumed by this message
///
/// # Errors
/// Returns `ServiceError::NotFound` if the message doesn't exist.
pub async fn set_tokens_used(
    pool: &SqlitePool,
    id: &str,
    tokens_used: i32,
) -> ServiceResult<Message> {
    debug!(
        "Setting tokens_used for message id={} to {}",
        id, tokens_used
    );

    // Verify the message exists first
    let message = get(pool, id).await?;

    sqlx::query(
        r#"
        UPDATE messages
        SET tokens_used = ?
        WHERE id = ?
        "#,
    )
    .bind(tokens_used)
    .bind(id)
    .execute(pool)
    .await
    .map_err(|e| {
        error!("Failed to set tokens_used for message id={}: {}", id, e);
        ServiceError::Database(e)
    })?;

    info!(
        "Updated tokens_used for message id={} in chat_id={}: {:?} -> {}",
        id, message.chat_id, message.tokens_used, tokens_used
    );

    get(pool, id).await
}

/// Append content to a message (useful for streaming).
///
/// This function concatenates the given content to the existing message content.
/// It's typically used during streaming responses to build up the message incrementally.
///
/// # Arguments
/// * `pool` - Database connection pool
/// * `id` - Message ID to update
/// * `content` - Content to append to the existing message
///
/// # Errors
/// Returns `ServiceError::NotFound` if the message doesn't exist.
pub async fn append_content(pool: &SqlitePool, id: &str, content: &str) -> ServiceResult<Message> {
    debug!(
        "Appending content to message id={}, append_length={}",
        id,
        content.len()
    );

    // Verify the message exists first
    let message = get(pool, id).await?;

    sqlx::query(
        r#"
        UPDATE messages
        SET content = content || ?
        WHERE id = ?
        "#,
    )
    .bind(content)
    .bind(id)
    .execute(pool)
    .await
    .map_err(|e| {
        error!("Failed to append content to message id={}: {}", id, e);
        ServiceError::Database(e)
    })?;

    debug!(
        "Appended {} chars to message id={} in chat_id={}, new_length={}",
        content.len(),
        id,
        message.chat_id,
        message.content.len() + content.len()
    );

    get(pool, id).await
}

/// Delete a message by ID.
///
/// # Arguments
/// * `pool` - Database connection pool
/// * `id` - Message ID to delete
///
/// # Errors
/// Returns `ServiceError::NotFound` if the message doesn't exist.
pub async fn delete(pool: &SqlitePool, id: &str) -> ServiceResult<()> {
    debug!("Deleting message id={}", id);

    // Verify the message exists first and get details for logging
    let message = get(pool, id).await?;

    sqlx::query("DELETE FROM messages WHERE id = ?")
        .bind(id)
        .execute(pool)
        .await
        .map_err(|e| {
            error!("Failed to delete message id={}: {}", id, e);
            ServiceError::Database(e)
        })?;

    info!(
        "Deleted message id={} from chat_id={} (role={}, content_length={})",
        id,
        message.chat_id,
        message.role,
        message.content.len()
    );

    Ok(())
}

/// Count messages for a chat.
///
/// # Arguments
/// * `pool` - Database connection pool
/// * `chat_id` - Chat to count messages for
///
/// Returns the count of messages in the chat.
pub async fn count(pool: &SqlitePool, chat_id: &str) -> ServiceResult<i64> {
    debug!("Counting messages for chat_id={}", chat_id);

    let count: (i64,) = sqlx::query_as("SELECT COUNT(*) FROM messages WHERE chat_id = ?")
        .bind(chat_id)
        .fetch_one(pool)
        .await
        .map_err(|e| {
            error!("Failed to count messages for chat_id={}: {}", chat_id, e);
            ServiceError::Database(e)
        })?;

    debug!("Found {} messages in chat_id={}", count.0, chat_id);
    Ok(count.0)
}

/// Get the latest message for a chat.
///
/// # Arguments
/// * `pool` - Database connection pool
/// * `chat_id` - Chat to get the latest message for
///
/// Returns None if the chat has no messages.
pub async fn get_latest(pool: &SqlitePool, chat_id: &str) -> ServiceResult<Option<Message>> {
    debug!("Getting latest message for chat_id={}", chat_id);

    let message = sqlx::query_as::<_, Message>(
        r#"
        SELECT
            id, chat_id, role, content, tool_calls, tool_results,
            is_streaming, tokens_used, model, created_at
        FROM messages
        WHERE chat_id = ?
        ORDER BY created_at DESC
        LIMIT 1
        "#,
    )
    .bind(chat_id)
    .fetch_optional(pool)
    .await
    .map_err(|e| {
        error!(
            "Failed to get latest message for chat_id={}: {}",
            chat_id, e
        );
        ServiceError::Database(e)
    })?;

    if let Some(ref msg) = message {
        debug!("Found latest message id={} for chat_id={}", msg.id, chat_id);
    } else {
        debug!("No messages found for chat_id={}", chat_id);
    }

    Ok(message)
}

/// Delete all messages for a chat.
///
/// # Arguments
/// * `pool` - Database connection pool
/// * `chat_id` - Chat to delete messages from
///
/// Returns the number of messages deleted.
pub async fn delete_by_chat(pool: &SqlitePool, chat_id: &str) -> ServiceResult<u64> {
    debug!("Deleting all messages for chat_id={}", chat_id);

    let result = sqlx::query("DELETE FROM messages WHERE chat_id = ?")
        .bind(chat_id)
        .execute(pool)
        .await
        .map_err(|e| {
            error!("Failed to delete messages for chat_id={}: {}", chat_id, e);
            ServiceError::Database(e)
        })?;

    let deleted = result.rows_affected();

    info!("Deleted {} messages from chat_id={}", deleted, chat_id);

    Ok(deleted)
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::services::{chat, project, task};
    use openflow_contracts::{CreateChatRequest, CreateProjectRequest, CreateTaskRequest};
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

    /// Helper to create a test chat.
    async fn create_test_chat(pool: &SqlitePool, project_id: &str, task_id: &str) -> String {
        let request = CreateChatRequest {
            task_id: Some(task_id.to_string()),
            project_id: project_id.to_string(),
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
        chat::create(pool, request)
            .await
            .expect("Failed to create test chat")
            .id
    }

    /// Helper to create a test message request.
    fn test_create_request(chat_id: &str) -> CreateMessageRequest {
        CreateMessageRequest {
            chat_id: chat_id.to_string(),
            role: MessageRole::User,
            content: "Hello, world!".to_string(),
            tool_calls: None,
            tool_results: None,
            model: None,
            is_streaming: None,
        }
    }

    #[tokio::test]
    async fn test_create_message() {
        let test_db = setup_test_db().await;
        let project_id = create_test_project(&test_db.pool, "Test Project").await;
        let task_id = create_test_task(&test_db.pool, &project_id, "Test Task").await;
        let chat_id = create_test_chat(&test_db.pool, &project_id, &task_id).await;

        let request = test_create_request(&chat_id);
        let message = create(&test_db.pool, request)
            .await
            .expect("Failed to create message");

        assert_eq!(message.chat_id, chat_id);
        assert_eq!(message.role, MessageRole::User);
        assert_eq!(message.content, "Hello, world!");
        assert!(!message.is_streaming);
        assert!(message.tokens_used.is_none());
        assert!(message.model.is_none());
        assert!(message.tool_calls.is_none());
        assert!(message.tool_results.is_none());
        assert!(!message.id.is_empty());
    }

    #[tokio::test]
    async fn test_create_message_with_all_fields() {
        let test_db = setup_test_db().await;
        let project_id = create_test_project(&test_db.pool, "Test Project").await;
        let task_id = create_test_task(&test_db.pool, &project_id, "Test Task").await;
        let chat_id = create_test_chat(&test_db.pool, &project_id, &task_id).await;

        let request = CreateMessageRequest {
            chat_id: chat_id.clone(),
            role: MessageRole::Assistant,
            content: "I can help you with that.".to_string(),
            tool_calls: Some(r#"[{"name": "read_file", "args": {"path": "/test"}}]"#.to_string()),
            tool_results: Some(r#"[{"result": "file content"}]"#.to_string()),
            model: Some("claude-3-opus".to_string()),
            is_streaming: Some(false),
        };

        let message = create(&test_db.pool, request)
            .await
            .expect("Failed to create message");

        assert_eq!(message.role, MessageRole::Assistant);
        assert_eq!(message.content, "I can help you with that.");
        assert_eq!(
            message.tool_calls,
            Some(r#"[{"name": "read_file", "args": {"path": "/test"}}]"#.to_string())
        );
        assert_eq!(
            message.tool_results,
            Some(r#"[{"result": "file content"}]"#.to_string())
        );
        assert_eq!(message.model, Some("claude-3-opus".to_string()));
    }

    #[tokio::test]
    async fn test_create_system_message() {
        let test_db = setup_test_db().await;
        let project_id = create_test_project(&test_db.pool, "Test Project").await;
        let task_id = create_test_task(&test_db.pool, &project_id, "Test Task").await;
        let chat_id = create_test_chat(&test_db.pool, &project_id, &task_id).await;

        let request = CreateMessageRequest {
            chat_id: chat_id.clone(),
            role: MessageRole::System,
            content: "You are a helpful assistant.".to_string(),
            tool_calls: None,
            tool_results: None,
            model: None,
            is_streaming: None,
        };

        let message = create(&test_db.pool, request)
            .await
            .expect("Failed to create message");

        assert_eq!(message.role, MessageRole::System);
        assert_eq!(message.content, "You are a helpful assistant.");
    }

    #[tokio::test]
    async fn test_create_streaming_message() {
        let test_db = setup_test_db().await;
        let project_id = create_test_project(&test_db.pool, "Test Project").await;
        let task_id = create_test_task(&test_db.pool, &project_id, "Test Task").await;
        let chat_id = create_test_chat(&test_db.pool, &project_id, &task_id).await;

        let request = CreateMessageRequest {
            chat_id: chat_id.clone(),
            role: MessageRole::Assistant,
            content: String::new(),
            tool_calls: None,
            tool_results: None,
            model: Some("claude-3-opus".to_string()),
            is_streaming: Some(true),
        };

        let message = create(&test_db.pool, request)
            .await
            .expect("Failed to create message");

        assert!(message.is_streaming);
        assert!(message.content.is_empty());
    }

    #[tokio::test]
    async fn test_get_message() {
        let test_db = setup_test_db().await;
        let project_id = create_test_project(&test_db.pool, "Test Project").await;
        let task_id = create_test_task(&test_db.pool, &project_id, "Test Task").await;
        let chat_id = create_test_chat(&test_db.pool, &project_id, &task_id).await;

        let request = test_create_request(&chat_id);
        let created = create(&test_db.pool, request)
            .await
            .expect("Failed to create message");

        let fetched = get(&test_db.pool, &created.id)
            .await
            .expect("Failed to get message");

        assert_eq!(fetched.id, created.id);
        assert_eq!(fetched.content, "Hello, world!");
    }

    #[tokio::test]
    async fn test_get_message_not_found() {
        let test_db = setup_test_db().await;

        let result = get(&test_db.pool, "non-existent-id").await;

        assert!(result.is_err());
        match result.unwrap_err() {
            ServiceError::NotFound { entity, id } => {
                assert_eq!(entity, "Message");
                assert_eq!(id, "non-existent-id");
            }
            other => panic!("Expected NotFound error, got: {:?}", other),
        }
    }

    #[tokio::test]
    async fn test_list_messages() {
        let test_db = setup_test_db().await;
        let project_id = create_test_project(&test_db.pool, "Test Project").await;
        let task_id = create_test_task(&test_db.pool, &project_id, "Test Task").await;
        let chat_id = create_test_chat(&test_db.pool, &project_id, &task_id).await;

        // Start with empty list
        let messages = list(&test_db.pool, &chat_id)
            .await
            .expect("Failed to list messages");
        assert!(messages.is_empty());

        // Create multiple messages
        let request1 = CreateMessageRequest {
            chat_id: chat_id.clone(),
            role: MessageRole::User,
            content: "First message".to_string(),
            tool_calls: None,
            tool_results: None,
            model: None,
            is_streaming: None,
        };
        let request2 = CreateMessageRequest {
            chat_id: chat_id.clone(),
            role: MessageRole::Assistant,
            content: "Second message".to_string(),
            tool_calls: None,
            tool_results: None,
            model: None,
            is_streaming: None,
        };
        let request3 = CreateMessageRequest {
            chat_id: chat_id.clone(),
            role: MessageRole::User,
            content: "Third message".to_string(),
            tool_calls: None,
            tool_results: None,
            model: None,
            is_streaming: None,
        };

        create(&test_db.pool, request1).await.unwrap();
        create(&test_db.pool, request2).await.unwrap();
        create(&test_db.pool, request3).await.unwrap();

        // List should return messages ordered by created_at
        let messages = list(&test_db.pool, &chat_id)
            .await
            .expect("Failed to list messages");

        assert_eq!(messages.len(), 3);
        assert_eq!(messages[0].content, "First message");
        assert_eq!(messages[1].content, "Second message");
        assert_eq!(messages[2].content, "Third message");
    }

    #[tokio::test]
    async fn test_list_messages_isolated_by_chat() {
        let test_db = setup_test_db().await;
        let project_id = create_test_project(&test_db.pool, "Test Project").await;
        let task_id = create_test_task(&test_db.pool, &project_id, "Test Task").await;

        // Create two chats
        let chat1_id = create_test_chat(&test_db.pool, &project_id, &task_id).await;
        let chat2_req = CreateChatRequest {
            task_id: Some(task_id.clone()),
            project_id: project_id.clone(),
            title: Some("Second Chat".to_string()),
            chat_role: None,
            executor_profile_id: None,
            base_branch: None,
            initial_prompt: None,
            hidden_prompt: None,
            is_plan_container: None,
            main_chat_id: None,
            workflow_step_index: None,
        };
        let chat2_id = chat::create(&test_db.pool, chat2_req).await.unwrap().id;

        // Create messages in both chats
        let request1 = CreateMessageRequest {
            chat_id: chat1_id.clone(),
            role: MessageRole::User,
            content: "Chat 1 message".to_string(),
            tool_calls: None,
            tool_results: None,
            model: None,
            is_streaming: None,
        };
        let request2 = CreateMessageRequest {
            chat_id: chat2_id.clone(),
            role: MessageRole::User,
            content: "Chat 2 message".to_string(),
            tool_calls: None,
            tool_results: None,
            model: None,
            is_streaming: None,
        };

        create(&test_db.pool, request1).await.unwrap();
        create(&test_db.pool, request2).await.unwrap();

        // List messages for chat 1
        let chat1_messages = list(&test_db.pool, &chat1_id)
            .await
            .expect("Failed to list messages");
        assert_eq!(chat1_messages.len(), 1);
        assert_eq!(chat1_messages[0].content, "Chat 1 message");

        // List messages for chat 2
        let chat2_messages = list(&test_db.pool, &chat2_id)
            .await
            .expect("Failed to list messages");
        assert_eq!(chat2_messages.len(), 1);
        assert_eq!(chat2_messages[0].content, "Chat 2 message");
    }

    #[tokio::test]
    async fn test_update_message() {
        let test_db = setup_test_db().await;
        let project_id = create_test_project(&test_db.pool, "Test Project").await;
        let task_id = create_test_task(&test_db.pool, &project_id, "Test Task").await;
        let chat_id = create_test_chat(&test_db.pool, &project_id, &task_id).await;

        let request = test_create_request(&chat_id);
        let created = create(&test_db.pool, request)
            .await
            .expect("Failed to create message");

        let update_request = UpdateMessageRequest {
            content: Some("Updated content".to_string()),
            tool_calls: None,
            tool_results: None,
            is_streaming: None,
            tokens_used: Some(100),
            model: Some("claude-3-sonnet".to_string()),
        };

        let updated = update(&test_db.pool, &created.id, update_request)
            .await
            .expect("Failed to update message");

        assert_eq!(updated.id, created.id);
        assert_eq!(updated.content, "Updated content");
        assert_eq!(updated.tokens_used, Some(100));
        assert_eq!(updated.model, Some("claude-3-sonnet".to_string()));
    }

    #[tokio::test]
    async fn test_set_streaming() {
        let test_db = setup_test_db().await;
        let project_id = create_test_project(&test_db.pool, "Test Project").await;
        let task_id = create_test_task(&test_db.pool, &project_id, "Test Task").await;
        let chat_id = create_test_chat(&test_db.pool, &project_id, &task_id).await;

        let request = test_create_request(&chat_id);
        let created = create(&test_db.pool, request)
            .await
            .expect("Failed to create message");

        assert!(!created.is_streaming);

        // Set streaming to true
        let updated = set_streaming(&test_db.pool, &created.id, true)
            .await
            .expect("Failed to set streaming");

        assert!(updated.is_streaming);

        // Set streaming back to false
        let updated = set_streaming(&test_db.pool, &created.id, false)
            .await
            .expect("Failed to set streaming");

        assert!(!updated.is_streaming);
    }

    #[tokio::test]
    async fn test_set_tokens_used() {
        let test_db = setup_test_db().await;
        let project_id = create_test_project(&test_db.pool, "Test Project").await;
        let task_id = create_test_task(&test_db.pool, &project_id, "Test Task").await;
        let chat_id = create_test_chat(&test_db.pool, &project_id, &task_id).await;

        let request = test_create_request(&chat_id);
        let created = create(&test_db.pool, request)
            .await
            .expect("Failed to create message");

        assert!(created.tokens_used.is_none());

        let updated = set_tokens_used(&test_db.pool, &created.id, 1500)
            .await
            .expect("Failed to set tokens_used");

        assert_eq!(updated.tokens_used, Some(1500));
    }

    #[tokio::test]
    async fn test_append_content() {
        let test_db = setup_test_db().await;
        let project_id = create_test_project(&test_db.pool, "Test Project").await;
        let task_id = create_test_task(&test_db.pool, &project_id, "Test Task").await;
        let chat_id = create_test_chat(&test_db.pool, &project_id, &task_id).await;

        let request = CreateMessageRequest {
            chat_id: chat_id.clone(),
            role: MessageRole::Assistant,
            content: "Hello".to_string(),
            tool_calls: None,
            tool_results: None,
            model: None,
            is_streaming: None,
        };
        let created = create(&test_db.pool, request)
            .await
            .expect("Failed to create message");

        assert_eq!(created.content, "Hello");

        // Append content (simulating streaming)
        let updated = append_content(&test_db.pool, &created.id, ", world!")
            .await
            .expect("Failed to append content");

        assert_eq!(updated.content, "Hello, world!");

        // Append more content
        let updated = append_content(&test_db.pool, &created.id, " How are you?")
            .await
            .expect("Failed to append content");

        assert_eq!(updated.content, "Hello, world! How are you?");
    }

    #[tokio::test]
    async fn test_delete_message() {
        let test_db = setup_test_db().await;
        let project_id = create_test_project(&test_db.pool, "Test Project").await;
        let task_id = create_test_task(&test_db.pool, &project_id, "Test Task").await;
        let chat_id = create_test_chat(&test_db.pool, &project_id, &task_id).await;

        let request = test_create_request(&chat_id);
        let created = create(&test_db.pool, request)
            .await
            .expect("Failed to create message");

        // Verify it exists
        let fetched = get(&test_db.pool, &created.id).await;
        assert!(fetched.is_ok());

        // Delete it
        delete(&test_db.pool, &created.id)
            .await
            .expect("Failed to delete message");

        // Verify it's gone
        let result = get(&test_db.pool, &created.id).await;
        assert!(result.is_err());
        match result.unwrap_err() {
            ServiceError::NotFound { entity, .. } => {
                assert_eq!(entity, "Message");
            }
            other => panic!("Expected NotFound error, got: {:?}", other),
        }
    }

    #[tokio::test]
    async fn test_delete_message_not_found() {
        let test_db = setup_test_db().await;

        let result = delete(&test_db.pool, "non-existent-id").await;

        assert!(result.is_err());
        match result.unwrap_err() {
            ServiceError::NotFound { entity, .. } => {
                assert_eq!(entity, "Message");
            }
            other => panic!("Expected NotFound error, got: {:?}", other),
        }
    }

    #[tokio::test]
    async fn test_delete_chat_cascades_to_messages() {
        let test_db = setup_test_db().await;
        let project_id = create_test_project(&test_db.pool, "Test Project").await;
        let task_id = create_test_task(&test_db.pool, &project_id, "Test Task").await;
        let chat_id = create_test_chat(&test_db.pool, &project_id, &task_id).await;

        // Create message
        let request = test_create_request(&chat_id);
        let message = create(&test_db.pool, request)
            .await
            .expect("Failed to create message");

        // Delete the chat
        chat::delete(&test_db.pool, &chat_id)
            .await
            .expect("Failed to delete chat");

        // Message should be gone
        let result = get(&test_db.pool, &message.id).await;
        assert!(result.is_err());
    }

    #[tokio::test]
    async fn test_all_message_roles() {
        let test_db = setup_test_db().await;
        let project_id = create_test_project(&test_db.pool, "Test Project").await;
        let task_id = create_test_task(&test_db.pool, &project_id, "Test Task").await;
        let chat_id = create_test_chat(&test_db.pool, &project_id, &task_id).await;

        let roles = vec![
            MessageRole::User,
            MessageRole::Assistant,
            MessageRole::System,
        ];

        for role in roles {
            let request = CreateMessageRequest {
                chat_id: chat_id.clone(),
                role: role.clone(),
                content: format!("{:?} message", role),
                tool_calls: None,
                tool_results: None,
                model: None,
                is_streaming: None,
            };
            let message = create(&test_db.pool, request)
                .await
                .expect("Failed to create message");

            assert_eq!(message.role, role);
        }
    }

    #[tokio::test]
    async fn test_message_preserves_empty_content() {
        let test_db = setup_test_db().await;
        let project_id = create_test_project(&test_db.pool, "Test Project").await;
        let task_id = create_test_task(&test_db.pool, &project_id, "Test Task").await;
        let chat_id = create_test_chat(&test_db.pool, &project_id, &task_id).await;

        // Create message with empty content (useful for streaming start)
        let request = CreateMessageRequest {
            chat_id: chat_id.clone(),
            role: MessageRole::Assistant,
            content: "".to_string(),
            tool_calls: None,
            tool_results: None,
            model: None,
            is_streaming: Some(true),
        };

        let message = create(&test_db.pool, request)
            .await
            .expect("Failed to create message");

        assert_eq!(message.content, "");

        // Now append content
        let updated = append_content(&test_db.pool, &message.id, "Streaming...")
            .await
            .expect("Failed to append content");

        assert_eq!(updated.content, "Streaming...");
    }

    #[tokio::test]
    async fn test_count_messages() {
        let test_db = setup_test_db().await;
        let project_id = create_test_project(&test_db.pool, "Test Project").await;
        let task_id = create_test_task(&test_db.pool, &project_id, "Test Task").await;
        let chat_id = create_test_chat(&test_db.pool, &project_id, &task_id).await;

        // Count should be 0 initially
        let initial_count = count(&test_db.pool, &chat_id)
            .await
            .expect("Failed to count messages");
        assert_eq!(initial_count, 0);

        // Create messages
        for i in 0..5 {
            let request = CreateMessageRequest {
                chat_id: chat_id.clone(),
                role: MessageRole::User,
                content: format!("Message {}", i),
                tool_calls: None,
                tool_results: None,
                model: None,
                is_streaming: None,
            };
            create(&test_db.pool, request).await.unwrap();
        }

        // Count should be 5
        let final_count = count(&test_db.pool, &chat_id)
            .await
            .expect("Failed to count messages");
        assert_eq!(final_count, 5);
    }

    #[tokio::test]
    async fn test_get_latest_message() {
        let test_db = setup_test_db().await;
        let project_id = create_test_project(&test_db.pool, "Test Project").await;
        let task_id = create_test_task(&test_db.pool, &project_id, "Test Task").await;
        let chat_id = create_test_chat(&test_db.pool, &project_id, &task_id).await;

        // No messages initially
        let latest = get_latest(&test_db.pool, &chat_id)
            .await
            .expect("Failed to get latest");
        assert!(latest.is_none());

        // Create messages
        for i in 1..=3 {
            let request = CreateMessageRequest {
                chat_id: chat_id.clone(),
                role: MessageRole::User,
                content: format!("Message {}", i),
                tool_calls: None,
                tool_results: None,
                model: None,
                is_streaming: None,
            };
            create(&test_db.pool, request).await.unwrap();
        }

        // Get latest should return the last one
        let latest = get_latest(&test_db.pool, &chat_id)
            .await
            .expect("Failed to get latest")
            .expect("Expected a message");

        assert_eq!(latest.content, "Message 3");
    }

    #[tokio::test]
    async fn test_delete_by_chat() {
        let test_db = setup_test_db().await;
        let project_id = create_test_project(&test_db.pool, "Test Project").await;
        let task_id = create_test_task(&test_db.pool, &project_id, "Test Task").await;
        let chat_id = create_test_chat(&test_db.pool, &project_id, &task_id).await;

        // Create messages
        for i in 0..3 {
            let request = CreateMessageRequest {
                chat_id: chat_id.clone(),
                role: MessageRole::User,
                content: format!("Message {}", i),
                tool_calls: None,
                tool_results: None,
                model: None,
                is_streaming: None,
            };
            create(&test_db.pool, request).await.unwrap();
        }

        // Verify messages exist
        let messages = list(&test_db.pool, &chat_id).await.unwrap();
        assert_eq!(messages.len(), 3);

        // Delete all messages
        let deleted = delete_by_chat(&test_db.pool, &chat_id)
            .await
            .expect("Failed to delete messages");
        assert_eq!(deleted, 3);

        // Verify messages are gone
        let messages = list(&test_db.pool, &chat_id).await.unwrap();
        assert!(messages.is_empty());
    }
}
