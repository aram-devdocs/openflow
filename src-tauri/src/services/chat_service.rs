//! Chat management service.
//!
//! Handles CRUD operations for chats (workflow step sessions).

use sqlx::SqlitePool;
use uuid::Uuid;

use crate::types::{
    Chat, ChatRole, ChatWithMessages, CreateChatRequest, Message, UpdateChatRequest,
};

use super::{ServiceError, ServiceResult};

/// Service for managing chats.
pub struct ChatService;

impl ChatService {
    /// List chats for a task.
    ///
    /// # Arguments
    /// * `pool` - Database connection pool
    /// * `task_id` - Task to list chats for
    ///
    /// Returns chats ordered by workflow_step_index ASC, then created_at ASC.
    pub async fn list(pool: &SqlitePool, task_id: &str) -> ServiceResult<Vec<Chat>> {
        let chats = sqlx::query_as::<_, Chat>(
            r#"
            SELECT
                id, task_id, title, chat_role, executor_profile_id,
                base_branch, branch, worktree_path, worktree_deleted,
                setup_completed_at, initial_prompt, hidden_prompt,
                is_plan_container, main_chat_id, workflow_step_index,
                created_at, updated_at
            FROM chats
            WHERE task_id = ?
            ORDER BY workflow_step_index ASC, created_at ASC
            "#,
        )
        .bind(task_id)
        .fetch_all(pool)
        .await?;

        Ok(chats)
    }

    /// Get a chat by ID with its messages.
    pub async fn get(pool: &SqlitePool, id: &str) -> ServiceResult<ChatWithMessages> {
        let chat = sqlx::query_as::<_, Chat>(
            r#"
            SELECT
                id, task_id, title, chat_role, executor_profile_id,
                base_branch, branch, worktree_path, worktree_deleted,
                setup_completed_at, initial_prompt, hidden_prompt,
                is_plan_container, main_chat_id, workflow_step_index,
                created_at, updated_at
            FROM chats
            WHERE id = ?
            "#,
        )
        .bind(id)
        .fetch_optional(pool)
        .await?
        .ok_or_else(|| ServiceError::NotFound {
            entity: "Chat",
            id: id.to_string(),
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
        .await?;

        Ok(ChatWithMessages { chat, messages })
    }

    /// Create a new chat.
    pub async fn create(pool: &SqlitePool, request: CreateChatRequest) -> ServiceResult<Chat> {
        let id = Uuid::new_v4().to_string();
        let chat_role = request.chat_role.unwrap_or(ChatRole::Main);
        let base_branch = request.base_branch.unwrap_or_else(|| "main".to_string());
        let is_plan_container = request.is_plan_container.unwrap_or(false);

        sqlx::query(
            r#"
            INSERT INTO chats (
                id, task_id, title, chat_role, executor_profile_id,
                base_branch, initial_prompt, hidden_prompt,
                is_plan_container, main_chat_id, workflow_step_index
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            "#,
        )
        .bind(&id)
        .bind(&request.task_id)
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
        .await?;

        // Fetch and return the created chat
        let chat_with_messages = Self::get(pool, &id).await?;
        Ok(chat_with_messages.chat)
    }

    /// Update an existing chat.
    pub async fn update(
        pool: &SqlitePool,
        id: &str,
        request: UpdateChatRequest,
    ) -> ServiceResult<Chat> {
        // Verify the chat exists first
        let existing = Self::get(pool, id).await?.chat;

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
        .bind(id)
        .execute(pool)
        .await?;

        let chat_with_messages = Self::get(pool, id).await?;
        Ok(chat_with_messages.chat)
    }

    /// Delete a chat by ID.
    /// Note: Due to CASCADE, this also deletes associated messages.
    pub async fn delete(pool: &SqlitePool, id: &str) -> ServiceResult<()> {
        // Verify the chat exists first
        Self::get(pool, id).await?;

        sqlx::query("DELETE FROM chats WHERE id = ?")
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
    use crate::services::ProjectService;
    use crate::services::TaskService;
    use crate::types::{CreateProjectRequest, CreateTaskRequest};
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

    /// Helper to create a test chat request.
    fn test_create_request(task_id: &str) -> CreateChatRequest {
        CreateChatRequest {
            task_id: task_id.to_string(),
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

        let request = test_create_request(&task_id);
        let chat = ChatService::create(&test_db.pool, request)
            .await
            .expect("Failed to create chat");

        assert_eq!(chat.task_id, task_id);
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
    async fn test_create_chat_with_all_fields() {
        let test_db = setup_test_db().await;
        let project_id = create_test_project(&test_db.pool, "Test Project").await;
        let task_id = create_test_task(&test_db.pool, &project_id, "Test Task").await;

        let request = CreateChatRequest {
            task_id: task_id.clone(),
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

        let chat = ChatService::create(&test_db.pool, request)
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
            task_id: task_id.clone(),
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
        let created = ChatService::create(&test_db.pool, request)
            .await
            .expect("Failed to create chat");

        // Get the chat
        let fetched = ChatService::get(&test_db.pool, &created.id)
            .await
            .expect("Failed to get chat");

        assert_eq!(fetched.chat.id, created.id);
        assert_eq!(fetched.chat.title, Some("Get Test Chat".to_string()));
        assert!(fetched.messages.is_empty()); // No messages created yet
    }

    #[tokio::test]
    async fn test_get_chat_not_found() {
        let test_db = setup_test_db().await;

        let result = ChatService::get(&test_db.pool, "non-existent-id").await;

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
        let chats = ChatService::list(&test_db.pool, &task_id)
            .await
            .expect("Failed to list chats");
        assert!(chats.is_empty());

        // Create multiple chats with different step indices
        let request1 = CreateChatRequest {
            task_id: task_id.clone(),
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
            task_id: task_id.clone(),
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
            task_id: task_id.clone(),
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

        ChatService::create(&test_db.pool, request1).await.unwrap();
        ChatService::create(&test_db.pool, request2).await.unwrap();
        ChatService::create(&test_db.pool, request3).await.unwrap();

        // List should return chats ordered by workflow_step_index
        let chats = ChatService::list(&test_db.pool, &task_id)
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
            task_id: task1_id.clone(),
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
            task_id: task2_id.clone(),
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

        ChatService::create(&test_db.pool, request1).await.unwrap();
        ChatService::create(&test_db.pool, request2).await.unwrap();

        // List chats for task 1
        let task1_chats = ChatService::list(&test_db.pool, &task1_id)
            .await
            .expect("Failed to list chats");
        assert_eq!(task1_chats.len(), 1);
        assert_eq!(task1_chats[0].title, Some("Task 1 Chat".to_string()));

        // List chats for task 2
        let task2_chats = ChatService::list(&test_db.pool, &task2_id)
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
        let request = test_create_request(&task_id);
        let created = ChatService::create(&test_db.pool, request)
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
        };

        let updated = ChatService::update(&test_db.pool, &created.id, update_request)
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
        // Note: updated_at may be the same if update is very fast (subsecond precision)
        // The important thing is the data was actually updated, which we verified above
    }

    #[tokio::test]
    async fn test_update_chat_preserves_unset_fields() {
        let test_db = setup_test_db().await;
        let project_id = create_test_project(&test_db.pool, "Test Project").await;
        let task_id = create_test_task(&test_db.pool, &project_id, "Test Task").await;

        // Create a chat with some values
        let request = CreateChatRequest {
            task_id: task_id.clone(),
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
        let created = ChatService::create(&test_db.pool, request)
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
        };

        let updated = ChatService::update(&test_db.pool, &created.id, update_request)
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

        let request = test_create_request(&task_id);
        let created = ChatService::create(&test_db.pool, request)
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
        };

        let updated = ChatService::update(&test_db.pool, &created.id, update_request)
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
        };

        let result = ChatService::update(&test_db.pool, "non-existent-id", update_request).await;

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
        let request = test_create_request(&task_id);
        let created = ChatService::create(&test_db.pool, request)
            .await
            .expect("Failed to create chat");

        // Verify it exists
        let fetched = ChatService::get(&test_db.pool, &created.id).await;
        assert!(fetched.is_ok());

        // Delete it
        ChatService::delete(&test_db.pool, &created.id)
            .await
            .expect("Failed to delete chat");

        // Verify it's gone
        let result = ChatService::get(&test_db.pool, &created.id).await;
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

        let result = ChatService::delete(&test_db.pool, "non-existent-id").await;

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
        let request = test_create_request(&task_id);
        let chat = ChatService::create(&test_db.pool, request)
            .await
            .expect("Failed to create chat");

        // Delete the task
        TaskService::delete(&test_db.pool, &task_id)
            .await
            .expect("Failed to delete task");

        // Chat should be gone
        let result = ChatService::get(&test_db.pool, &chat.id).await;
        assert!(result.is_err());
    }

    #[tokio::test]
    async fn test_create_chat_with_main_chat_reference() {
        let test_db = setup_test_db().await;
        let project_id = create_test_project(&test_db.pool, "Test Project").await;
        let task_id = create_test_task(&test_db.pool, &project_id, "Test Task").await;

        // Create main chat
        let main_request = CreateChatRequest {
            task_id: task_id.clone(),
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
        let main_chat = ChatService::create(&test_db.pool, main_request)
            .await
            .expect("Failed to create main chat");

        // Create terminal chat referencing main
        let terminal_request = CreateChatRequest {
            task_id: task_id.clone(),
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
        let terminal_chat = ChatService::create(&test_db.pool, terminal_request)
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
                task_id: task_id.clone(),
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
            let chat = ChatService::create(&test_db.pool, request)
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
            task_id: task_id.clone(),
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
            task_id: task_id.clone(),
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

        ChatService::create(&test_db.pool, request1).await.unwrap();
        ChatService::create(&test_db.pool, request2).await.unwrap();

        let chats = ChatService::list(&test_db.pool, &task_id)
            .await
            .expect("Failed to list chats");

        // NULL values sort first in SQLite with ASC order
        assert_eq!(chats.len(), 2);
        assert_eq!(chats[0].title, Some("No Index".to_string()));
        assert_eq!(chats[1].title, Some("Index 1".to_string()));
    }
}
