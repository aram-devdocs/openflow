//! Message management service.
//!
//! Handles CRUD operations for chat messages.

use sqlx::SqlitePool;
use uuid::Uuid;

use crate::types::{CreateMessageRequest, Message};

use super::{ServiceError, ServiceResult};

/// Service for managing messages.
pub struct MessageService;

impl MessageService {
    /// List messages for a chat.
    ///
    /// # Arguments
    /// * `pool` - Database connection pool
    /// * `chat_id` - Chat to list messages for
    ///
    /// Returns messages ordered by created_at ASC.
    pub async fn list(pool: &SqlitePool, chat_id: &str) -> ServiceResult<Vec<Message>> {
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
        .await?;

        Ok(messages)
    }

    /// Get a message by ID.
    pub async fn get(pool: &SqlitePool, id: &str) -> ServiceResult<Message> {
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
        .await?
        .ok_or_else(|| ServiceError::NotFound {
            entity: "Message",
            id: id.to_string(),
        })?;

        Ok(message)
    }

    /// Create a new message.
    ///
    /// # Arguments
    /// * `pool` - Database connection pool
    /// * `request` - Message creation request
    ///
    /// Returns the created message.
    pub async fn create(
        pool: &SqlitePool,
        request: CreateMessageRequest,
    ) -> ServiceResult<Message> {
        let id = Uuid::new_v4().to_string();

        sqlx::query(
            r#"
            INSERT INTO messages (
                id, chat_id, role, content, tool_calls, tool_results, model
            )
            VALUES (?, ?, ?, ?, ?, ?, ?)
            "#,
        )
        .bind(&id)
        .bind(&request.chat_id)
        .bind(request.role.to_string())
        .bind(&request.content)
        .bind(&request.tool_calls)
        .bind(&request.tool_results)
        .bind(&request.model)
        .execute(pool)
        .await?;

        // Fetch and return the created message
        Self::get(pool, &id).await
    }

    /// Mark a message as streaming or not.
    pub async fn set_streaming(
        pool: &SqlitePool,
        id: &str,
        is_streaming: bool,
    ) -> ServiceResult<Message> {
        // Verify the message exists first
        Self::get(pool, id).await?;

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
        .await?;

        Self::get(pool, id).await
    }

    /// Update token usage for a message.
    pub async fn set_tokens_used(
        pool: &SqlitePool,
        id: &str,
        tokens_used: i32,
    ) -> ServiceResult<Message> {
        // Verify the message exists first
        Self::get(pool, id).await?;

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
        .await?;

        Self::get(pool, id).await
    }

    /// Append content to a message (useful for streaming).
    pub async fn append_content(
        pool: &SqlitePool,
        id: &str,
        content: &str,
    ) -> ServiceResult<Message> {
        // Verify the message exists first
        Self::get(pool, id).await?;

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
        .await?;

        Self::get(pool, id).await
    }

    /// Delete a message by ID.
    pub async fn delete(pool: &SqlitePool, id: &str) -> ServiceResult<()> {
        // Verify the message exists first
        Self::get(pool, id).await?;

        sqlx::query("DELETE FROM messages WHERE id = ?")
            .bind(id)
            .execute(pool)
            .await?;

        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::db::pool::init_db;
    use crate::services::ChatService;
    use crate::services::ProjectService;
    use crate::services::TaskService;
    use crate::types::{CreateChatRequest, CreateProjectRequest, CreateTaskRequest, MessageRole};
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
        ProjectService::create(pool, request)
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
        TaskService::create(pool, request)
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
        ChatService::create(pool, request)
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
        }
    }

    #[tokio::test]
    async fn test_create_message() {
        let test_db = setup_test_db().await;
        let project_id = create_test_project(&test_db.pool, "Test Project").await;
        let task_id = create_test_task(&test_db.pool, &project_id, "Test Task").await;
        let chat_id = create_test_chat(&test_db.pool, &project_id, &task_id).await;

        let request = test_create_request(&chat_id);
        let message = MessageService::create(&test_db.pool, request)
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
        };

        let message = MessageService::create(&test_db.pool, request)
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
        };

        let message = MessageService::create(&test_db.pool, request)
            .await
            .expect("Failed to create message");

        assert_eq!(message.role, MessageRole::System);
        assert_eq!(message.content, "You are a helpful assistant.");
    }

    #[tokio::test]
    async fn test_get_message() {
        let test_db = setup_test_db().await;
        let project_id = create_test_project(&test_db.pool, "Test Project").await;
        let task_id = create_test_task(&test_db.pool, &project_id, "Test Task").await;
        let chat_id = create_test_chat(&test_db.pool, &project_id, &task_id).await;

        let request = test_create_request(&chat_id);
        let created = MessageService::create(&test_db.pool, request)
            .await
            .expect("Failed to create message");

        let fetched = MessageService::get(&test_db.pool, &created.id)
            .await
            .expect("Failed to get message");

        assert_eq!(fetched.id, created.id);
        assert_eq!(fetched.content, "Hello, world!");
    }

    #[tokio::test]
    async fn test_get_message_not_found() {
        let test_db = setup_test_db().await;

        let result = MessageService::get(&test_db.pool, "non-existent-id").await;

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
        let messages = MessageService::list(&test_db.pool, &chat_id)
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
        };
        let request2 = CreateMessageRequest {
            chat_id: chat_id.clone(),
            role: MessageRole::Assistant,
            content: "Second message".to_string(),
            tool_calls: None,
            tool_results: None,
            model: None,
        };
        let request3 = CreateMessageRequest {
            chat_id: chat_id.clone(),
            role: MessageRole::User,
            content: "Third message".to_string(),
            tool_calls: None,
            tool_results: None,
            model: None,
        };

        MessageService::create(&test_db.pool, request1)
            .await
            .unwrap();
        MessageService::create(&test_db.pool, request2)
            .await
            .unwrap();
        MessageService::create(&test_db.pool, request3)
            .await
            .unwrap();

        // List should return messages ordered by created_at
        let messages = MessageService::list(&test_db.pool, &chat_id)
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
        let chat2_id = ChatService::create(&test_db.pool, chat2_req)
            .await
            .unwrap()
            .id;

        // Create messages in both chats
        let request1 = CreateMessageRequest {
            chat_id: chat1_id.clone(),
            role: MessageRole::User,
            content: "Chat 1 message".to_string(),
            tool_calls: None,
            tool_results: None,
            model: None,
        };
        let request2 = CreateMessageRequest {
            chat_id: chat2_id.clone(),
            role: MessageRole::User,
            content: "Chat 2 message".to_string(),
            tool_calls: None,
            tool_results: None,
            model: None,
        };

        MessageService::create(&test_db.pool, request1)
            .await
            .unwrap();
        MessageService::create(&test_db.pool, request2)
            .await
            .unwrap();

        // List messages for chat 1
        let chat1_messages = MessageService::list(&test_db.pool, &chat1_id)
            .await
            .expect("Failed to list messages");
        assert_eq!(chat1_messages.len(), 1);
        assert_eq!(chat1_messages[0].content, "Chat 1 message");

        // List messages for chat 2
        let chat2_messages = MessageService::list(&test_db.pool, &chat2_id)
            .await
            .expect("Failed to list messages");
        assert_eq!(chat2_messages.len(), 1);
        assert_eq!(chat2_messages[0].content, "Chat 2 message");
    }

    #[tokio::test]
    async fn test_set_streaming() {
        let test_db = setup_test_db().await;
        let project_id = create_test_project(&test_db.pool, "Test Project").await;
        let task_id = create_test_task(&test_db.pool, &project_id, "Test Task").await;
        let chat_id = create_test_chat(&test_db.pool, &project_id, &task_id).await;

        let request = test_create_request(&chat_id);
        let created = MessageService::create(&test_db.pool, request)
            .await
            .expect("Failed to create message");

        assert!(!created.is_streaming);

        // Set streaming to true
        let updated = MessageService::set_streaming(&test_db.pool, &created.id, true)
            .await
            .expect("Failed to set streaming");

        assert!(updated.is_streaming);

        // Set streaming back to false
        let updated = MessageService::set_streaming(&test_db.pool, &created.id, false)
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
        let created = MessageService::create(&test_db.pool, request)
            .await
            .expect("Failed to create message");

        assert!(created.tokens_used.is_none());

        let updated = MessageService::set_tokens_used(&test_db.pool, &created.id, 1500)
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
        };
        let created = MessageService::create(&test_db.pool, request)
            .await
            .expect("Failed to create message");

        assert_eq!(created.content, "Hello");

        // Append content (simulating streaming)
        let updated = MessageService::append_content(&test_db.pool, &created.id, ", world!")
            .await
            .expect("Failed to append content");

        assert_eq!(updated.content, "Hello, world!");

        // Append more content
        let updated = MessageService::append_content(&test_db.pool, &created.id, " How are you?")
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
        let created = MessageService::create(&test_db.pool, request)
            .await
            .expect("Failed to create message");

        // Verify it exists
        let fetched = MessageService::get(&test_db.pool, &created.id).await;
        assert!(fetched.is_ok());

        // Delete it
        MessageService::delete(&test_db.pool, &created.id)
            .await
            .expect("Failed to delete message");

        // Verify it's gone
        let result = MessageService::get(&test_db.pool, &created.id).await;
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

        let result = MessageService::delete(&test_db.pool, "non-existent-id").await;

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
        let message = MessageService::create(&test_db.pool, request)
            .await
            .expect("Failed to create message");

        // Delete the chat
        ChatService::delete(&test_db.pool, &chat_id)
            .await
            .expect("Failed to delete chat");

        // Message should be gone
        let result = MessageService::get(&test_db.pool, &message.id).await;
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
            };
            let message = MessageService::create(&test_db.pool, request)
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
        };

        let message = MessageService::create(&test_db.pool, request)
            .await
            .expect("Failed to create message");

        assert_eq!(message.content, "");

        // Now append content
        let updated = MessageService::append_content(&test_db.pool, &message.id, "Streaming...")
            .await
            .expect("Failed to append content");

        assert_eq!(updated.content, "Streaming...");
    }
}
