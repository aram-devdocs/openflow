//! Task management service.
//!
//! Handles CRUD operations for tasks and their associated chats.

use sqlx::SqlitePool;
use uuid::Uuid;

use crate::types::{Chat, CreateTaskRequest, Task, TaskStatus, TaskWithChats, UpdateTaskRequest};

use super::{ServiceError, ServiceResult};

/// Service for managing tasks.
pub struct TaskService;

impl TaskService {
    /// List tasks for a project with optional status filter.
    ///
    /// # Arguments
    /// * `pool` - Database connection pool
    /// * `project_id` - Project to list tasks for
    /// * `status` - Optional status filter
    /// * `include_archived` - Whether to include archived tasks (default: false)
    pub async fn list(
        pool: &SqlitePool,
        project_id: &str,
        status: Option<TaskStatus>,
        include_archived: bool,
    ) -> ServiceResult<Vec<Task>> {
        let tasks = match (status, include_archived) {
            (Some(status), true) => {
                sqlx::query_as::<_, Task>(
                    r#"
                    SELECT
                        id, project_id, title, description, status,
                        workflow_template, actions_required_count, parent_task_id,
                        auto_start_next_step, default_executor_profile_id, base_branch,
                        archived_at, created_at, updated_at
                    FROM tasks
                    WHERE project_id = ? AND status = ?
                    ORDER BY created_at DESC
                    "#,
                )
                .bind(project_id)
                .bind(status.to_string())
                .fetch_all(pool)
                .await?
            }
            (Some(status), false) => {
                sqlx::query_as::<_, Task>(
                    r#"
                    SELECT
                        id, project_id, title, description, status,
                        workflow_template, actions_required_count, parent_task_id,
                        auto_start_next_step, default_executor_profile_id, base_branch,
                        archived_at, created_at, updated_at
                    FROM tasks
                    WHERE project_id = ? AND status = ? AND archived_at IS NULL
                    ORDER BY created_at DESC
                    "#,
                )
                .bind(project_id)
                .bind(status.to_string())
                .fetch_all(pool)
                .await?
            }
            (None, true) => {
                sqlx::query_as::<_, Task>(
                    r#"
                    SELECT
                        id, project_id, title, description, status,
                        workflow_template, actions_required_count, parent_task_id,
                        auto_start_next_step, default_executor_profile_id, base_branch,
                        archived_at, created_at, updated_at
                    FROM tasks
                    WHERE project_id = ?
                    ORDER BY created_at DESC
                    "#,
                )
                .bind(project_id)
                .fetch_all(pool)
                .await?
            }
            (None, false) => {
                sqlx::query_as::<_, Task>(
                    r#"
                    SELECT
                        id, project_id, title, description, status,
                        workflow_template, actions_required_count, parent_task_id,
                        auto_start_next_step, default_executor_profile_id, base_branch,
                        archived_at, created_at, updated_at
                    FROM tasks
                    WHERE project_id = ? AND archived_at IS NULL
                    ORDER BY created_at DESC
                    "#,
                )
                .bind(project_id)
                .fetch_all(pool)
                .await?
            }
        };

        Ok(tasks)
    }

    /// Get a task by ID with its associated chats.
    pub async fn get(pool: &SqlitePool, id: &str) -> ServiceResult<TaskWithChats> {
        let task = sqlx::query_as::<_, Task>(
            r#"
            SELECT
                id, project_id, title, description, status,
                workflow_template, actions_required_count, parent_task_id,
                auto_start_next_step, default_executor_profile_id, base_branch,
                archived_at, created_at, updated_at
            FROM tasks
            WHERE id = ?
            "#,
        )
        .bind(id)
        .fetch_optional(pool)
        .await?
        .ok_or_else(|| ServiceError::NotFound {
            entity: "Task",
            id: id.to_string(),
        })?;

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
        .bind(id)
        .fetch_all(pool)
        .await?;

        Ok(TaskWithChats { task, chats })
    }

    /// Create a new task.
    pub async fn create(pool: &SqlitePool, request: CreateTaskRequest) -> ServiceResult<Task> {
        let id = Uuid::new_v4().to_string();

        sqlx::query(
            r#"
            INSERT INTO tasks (
                id, project_id, title, description, status,
                workflow_template, actions_required_count, parent_task_id,
                auto_start_next_step, base_branch
            )
            VALUES (?, ?, ?, ?, 'todo', ?, 0, ?, FALSE, ?)
            "#,
        )
        .bind(&id)
        .bind(&request.project_id)
        .bind(&request.title)
        .bind(&request.description)
        .bind(&request.workflow_template)
        .bind(&request.parent_task_id)
        .bind(&request.base_branch)
        .execute(pool)
        .await?;

        // Fetch and return the created task
        let task_with_chats = Self::get(pool, &id).await?;
        Ok(task_with_chats.task)
    }

    /// Update an existing task.
    pub async fn update(
        pool: &SqlitePool,
        id: &str,
        request: UpdateTaskRequest,
    ) -> ServiceResult<Task> {
        // Verify the task exists first
        let existing = Self::get(pool, id).await?.task;

        // Apply updates, falling back to existing values
        let title = request.title.unwrap_or(existing.title);
        let description = request.description.or(existing.description);
        let status = request.status.unwrap_or(existing.status);
        let auto_start_next_step = request
            .auto_start_next_step
            .unwrap_or(existing.auto_start_next_step);
        let default_executor_profile_id = request
            .default_executor_profile_id
            .or(existing.default_executor_profile_id);

        sqlx::query(
            r#"
            UPDATE tasks
            SET
                title = ?,
                description = ?,
                status = ?,
                auto_start_next_step = ?,
                default_executor_profile_id = ?,
                updated_at = datetime('now', 'subsec')
            WHERE id = ?
            "#,
        )
        .bind(&title)
        .bind(&description)
        .bind(status.to_string())
        .bind(auto_start_next_step)
        .bind(&default_executor_profile_id)
        .bind(id)
        .execute(pool)
        .await?;

        let task_with_chats = Self::get(pool, id).await?;
        Ok(task_with_chats.task)
    }

    /// Archive a task by setting its archived_at timestamp.
    pub async fn archive(pool: &SqlitePool, id: &str) -> ServiceResult<Task> {
        // Verify the task exists first
        Self::get(pool, id).await?;

        sqlx::query(
            r#"
            UPDATE tasks
            SET
                archived_at = datetime('now', 'subsec'),
                updated_at = datetime('now', 'subsec')
            WHERE id = ?
            "#,
        )
        .bind(id)
        .execute(pool)
        .await?;

        let task_with_chats = Self::get(pool, id).await?;
        Ok(task_with_chats.task)
    }

    /// Unarchive a task by clearing its archived_at timestamp.
    pub async fn unarchive(pool: &SqlitePool, id: &str) -> ServiceResult<Task> {
        // Verify the task exists first
        Self::get(pool, id).await?;

        sqlx::query(
            r#"
            UPDATE tasks
            SET
                archived_at = NULL,
                updated_at = datetime('now', 'subsec')
            WHERE id = ?
            "#,
        )
        .bind(id)
        .execute(pool)
        .await?;

        let task_with_chats = Self::get(pool, id).await?;
        Ok(task_with_chats.task)
    }

    /// Delete a task by ID.
    /// Note: Due to CASCADE, this also deletes associated chats and messages.
    pub async fn delete(pool: &SqlitePool, id: &str) -> ServiceResult<()> {
        // Verify the task exists first
        Self::get(pool, id).await?;

        sqlx::query("DELETE FROM tasks WHERE id = ?")
            .bind(id)
            .execute(pool)
            .await?;

        Ok(())
    }

    /// Duplicate a task by ID.
    ///
    /// Creates a copy of the task with:
    /// - New unique ID
    /// - Title appended with "(copy)"
    /// - Status reset to "todo"
    /// - Timestamps reset to now
    /// - Parent task ID preserved if it exists
    /// - Associated chats are NOT duplicated (new task starts fresh)
    ///
    /// # Arguments
    /// * `pool` - Database connection pool
    /// * `id` - ID of the task to duplicate
    ///
    /// # Returns
    /// The newly created duplicate task.
    pub async fn duplicate(pool: &SqlitePool, id: &str) -> ServiceResult<Task> {
        // Get the original task
        let original = Self::get(pool, id).await?.task;

        // Create the duplicate with a new ID and modified title
        let new_id = Uuid::new_v4().to_string();
        let new_title = format!("{} (copy)", original.title);

        sqlx::query(
            r#"
            INSERT INTO tasks (
                id, project_id, title, description, status,
                workflow_template, actions_required_count, parent_task_id,
                auto_start_next_step, default_executor_profile_id, base_branch
            )
            VALUES (?, ?, ?, ?, 'todo', ?, 0, ?, ?, ?, ?)
            "#,
        )
        .bind(&new_id)
        .bind(&original.project_id)
        .bind(&new_title)
        .bind(&original.description)
        .bind(&original.workflow_template)
        .bind(&original.parent_task_id)
        .bind(original.auto_start_next_step)
        .bind(&original.default_executor_profile_id)
        .bind(&original.base_branch)
        .execute(pool)
        .await?;

        // Fetch and return the created task
        let task_with_chats = Self::get(pool, &new_id).await?;
        Ok(task_with_chats.task)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::db::pool::init_db;
    use crate::services::ProjectService;
    use crate::types::CreateProjectRequest;
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

    /// Helper to create a test task request.
    fn test_create_request(project_id: &str, title: &str) -> CreateTaskRequest {
        CreateTaskRequest {
            project_id: project_id.to_string(),
            title: title.to_string(),
            description: None,
            workflow_template: None,
            parent_task_id: None,
            base_branch: None,
        }
    }

    #[tokio::test]
    async fn test_create_task() {
        let test_db = setup_test_db().await;
        let project_id = create_test_project(&test_db.pool, "Test Project").await;

        let request = test_create_request(&project_id, "Test Task");
        let task = TaskService::create(&test_db.pool, request)
            .await
            .expect("Failed to create task");

        assert_eq!(task.title, "Test Task");
        assert_eq!(task.project_id, project_id);
        assert_eq!(task.status, TaskStatus::Todo);
        assert_eq!(task.actions_required_count, 0);
        assert!(!task.auto_start_next_step);
        assert!(task.archived_at.is_none());
        assert!(!task.id.is_empty());
    }

    #[tokio::test]
    async fn test_create_task_with_all_fields() {
        let test_db = setup_test_db().await;
        let project_id = create_test_project(&test_db.pool, "Test Project").await;

        let request = CreateTaskRequest {
            project_id: project_id.clone(),
            title: "Full Task".to_string(),
            description: Some("A complete task description".to_string()),
            workflow_template: Some("feature".to_string()),
            parent_task_id: None,
            base_branch: Some("develop".to_string()),
        };

        let task = TaskService::create(&test_db.pool, request)
            .await
            .expect("Failed to create task");

        assert_eq!(task.title, "Full Task");
        assert_eq!(
            task.description,
            Some("A complete task description".to_string())
        );
        assert_eq!(task.workflow_template, Some("feature".to_string()));
        assert_eq!(task.base_branch, Some("develop".to_string()));
    }

    #[tokio::test]
    async fn test_get_task() {
        let test_db = setup_test_db().await;
        let project_id = create_test_project(&test_db.pool, "Test Project").await;

        // Create a task first
        let request = test_create_request(&project_id, "Get Test Task");
        let created = TaskService::create(&test_db.pool, request)
            .await
            .expect("Failed to create task");

        // Get the task
        let fetched = TaskService::get(&test_db.pool, &created.id)
            .await
            .expect("Failed to get task");

        assert_eq!(fetched.task.id, created.id);
        assert_eq!(fetched.task.title, "Get Test Task");
        assert!(fetched.chats.is_empty()); // No chats created yet
    }

    #[tokio::test]
    async fn test_get_task_not_found() {
        let test_db = setup_test_db().await;

        let result = TaskService::get(&test_db.pool, "non-existent-id").await;

        assert!(result.is_err());
        match result.unwrap_err() {
            ServiceError::NotFound { entity, id } => {
                assert_eq!(entity, "Task");
                assert_eq!(id, "non-existent-id");
            }
            other => panic!("Expected NotFound error, got: {:?}", other),
        }
    }

    #[tokio::test]
    async fn test_list_tasks() {
        let test_db = setup_test_db().await;
        let project_id = create_test_project(&test_db.pool, "Test Project").await;

        // Start with empty list
        let tasks = TaskService::list(&test_db.pool, &project_id, None, false)
            .await
            .expect("Failed to list tasks");
        assert!(tasks.is_empty());

        // Create multiple tasks
        let request1 = test_create_request(&project_id, "Task 1");
        let request2 = test_create_request(&project_id, "Task 2");
        let request3 = test_create_request(&project_id, "Task 3");

        TaskService::create(&test_db.pool, request1).await.unwrap();
        TaskService::create(&test_db.pool, request2).await.unwrap();
        TaskService::create(&test_db.pool, request3).await.unwrap();

        // List should return all tasks ordered by created_at DESC
        let tasks = TaskService::list(&test_db.pool, &project_id, None, false)
            .await
            .expect("Failed to list tasks");

        assert_eq!(tasks.len(), 3);
        // Most recent first
        assert_eq!(tasks[0].title, "Task 3");
        assert_eq!(tasks[1].title, "Task 2");
        assert_eq!(tasks[2].title, "Task 1");
    }

    #[tokio::test]
    async fn test_list_tasks_with_status_filter() {
        let test_db = setup_test_db().await;
        let project_id = create_test_project(&test_db.pool, "Test Project").await;

        // Create tasks and update their status
        let request1 = test_create_request(&project_id, "Todo Task");
        let request2 = test_create_request(&project_id, "In Progress Task");
        let request3 = test_create_request(&project_id, "Done Task");

        let task1 = TaskService::create(&test_db.pool, request1).await.unwrap();
        let task2 = TaskService::create(&test_db.pool, request2).await.unwrap();
        let task3 = TaskService::create(&test_db.pool, request3).await.unwrap();

        // Update statuses
        TaskService::update(
            &test_db.pool,
            &task2.id,
            UpdateTaskRequest {
                title: None,
                description: None,
                status: Some(TaskStatus::Inprogress),
                auto_start_next_step: None,
                default_executor_profile_id: None,
            },
        )
        .await
        .unwrap();

        TaskService::update(
            &test_db.pool,
            &task3.id,
            UpdateTaskRequest {
                title: None,
                description: None,
                status: Some(TaskStatus::Done),
                auto_start_next_step: None,
                default_executor_profile_id: None,
            },
        )
        .await
        .unwrap();

        // Filter by status
        let todo_tasks =
            TaskService::list(&test_db.pool, &project_id, Some(TaskStatus::Todo), false)
                .await
                .expect("Failed to list tasks");
        assert_eq!(todo_tasks.len(), 1);
        assert_eq!(todo_tasks[0].id, task1.id);

        let inprogress_tasks = TaskService::list(
            &test_db.pool,
            &project_id,
            Some(TaskStatus::Inprogress),
            false,
        )
        .await
        .expect("Failed to list tasks");
        assert_eq!(inprogress_tasks.len(), 1);
        assert_eq!(inprogress_tasks[0].id, task2.id);

        let done_tasks =
            TaskService::list(&test_db.pool, &project_id, Some(TaskStatus::Done), false)
                .await
                .expect("Failed to list tasks");
        assert_eq!(done_tasks.len(), 1);
        assert_eq!(done_tasks[0].id, task3.id);
    }

    #[tokio::test]
    async fn test_list_tasks_excludes_archived_by_default() {
        let test_db = setup_test_db().await;
        let project_id = create_test_project(&test_db.pool, "Test Project").await;

        // Create tasks
        let request1 = test_create_request(&project_id, "Active Task");
        let request2 = test_create_request(&project_id, "Archived Task");

        let task1 = TaskService::create(&test_db.pool, request1).await.unwrap();
        let task2 = TaskService::create(&test_db.pool, request2).await.unwrap();

        // Archive one task
        TaskService::archive(&test_db.pool, &task2.id)
            .await
            .unwrap();

        // Default list excludes archived
        let tasks = TaskService::list(&test_db.pool, &project_id, None, false)
            .await
            .expect("Failed to list tasks");
        assert_eq!(tasks.len(), 1);
        assert_eq!(tasks[0].id, task1.id);

        // Include archived
        let all_tasks = TaskService::list(&test_db.pool, &project_id, None, true)
            .await
            .expect("Failed to list tasks");
        assert_eq!(all_tasks.len(), 2);
    }

    #[tokio::test]
    async fn test_update_task() {
        let test_db = setup_test_db().await;
        let project_id = create_test_project(&test_db.pool, "Test Project").await;

        // Create a task
        let request = test_create_request(&project_id, "Original Title");
        let created = TaskService::create(&test_db.pool, request)
            .await
            .expect("Failed to create task");

        // Update partial fields
        let update_request = UpdateTaskRequest {
            title: Some("Updated Title".to_string()),
            description: Some("New description".to_string()),
            status: Some(TaskStatus::Inprogress),
            auto_start_next_step: None,
            default_executor_profile_id: None,
        };

        let updated = TaskService::update(&test_db.pool, &created.id, update_request)
            .await
            .expect("Failed to update task");

        assert_eq!(updated.id, created.id);
        assert_eq!(updated.title, "Updated Title");
        assert_eq!(updated.description, Some("New description".to_string()));
        assert_eq!(updated.status, TaskStatus::Inprogress);
        assert_ne!(updated.updated_at, created.updated_at);
    }

    #[tokio::test]
    async fn test_update_task_preserves_unset_fields() {
        let test_db = setup_test_db().await;
        let project_id = create_test_project(&test_db.pool, "Test Project").await;

        // Create a task with description
        let request = CreateTaskRequest {
            project_id: project_id.clone(),
            title: "Original Title".to_string(),
            description: Some("Original Description".to_string()),
            workflow_template: None,
            parent_task_id: None,
            base_branch: None,
        };
        let created = TaskService::create(&test_db.pool, request)
            .await
            .expect("Failed to create task");

        // Update only title
        let update_request = UpdateTaskRequest {
            title: Some("New Title".to_string()),
            description: None, // Keep original
            status: None,      // Keep original
            auto_start_next_step: None,
            default_executor_profile_id: None,
        };

        let updated = TaskService::update(&test_db.pool, &created.id, update_request)
            .await
            .expect("Failed to update task");

        assert_eq!(updated.title, "New Title");
        assert_eq!(
            updated.description,
            Some("Original Description".to_string())
        ); // Preserved
        assert_eq!(updated.status, TaskStatus::Todo); // Preserved
    }

    #[tokio::test]
    async fn test_update_task_not_found() {
        let test_db = setup_test_db().await;

        let update_request = UpdateTaskRequest {
            title: Some("New Title".to_string()),
            description: None,
            status: None,
            auto_start_next_step: None,
            default_executor_profile_id: None,
        };

        let result = TaskService::update(&test_db.pool, "non-existent-id", update_request).await;

        assert!(result.is_err());
        match result.unwrap_err() {
            ServiceError::NotFound { entity, .. } => {
                assert_eq!(entity, "Task");
            }
            other => panic!("Expected NotFound error, got: {:?}", other),
        }
    }

    #[tokio::test]
    async fn test_archive_task() {
        let test_db = setup_test_db().await;
        let project_id = create_test_project(&test_db.pool, "Test Project").await;

        // Create a task
        let request = test_create_request(&project_id, "Task to Archive");
        let created = TaskService::create(&test_db.pool, request)
            .await
            .expect("Failed to create task");

        // Verify not archived
        assert!(created.archived_at.is_none());

        // Archive it
        let archived = TaskService::archive(&test_db.pool, &created.id)
            .await
            .expect("Failed to archive task");

        assert!(archived.archived_at.is_some());
        assert_ne!(archived.updated_at, created.updated_at);
    }

    #[tokio::test]
    async fn test_archive_task_not_found() {
        let test_db = setup_test_db().await;

        let result = TaskService::archive(&test_db.pool, "non-existent-id").await;

        assert!(result.is_err());
        match result.unwrap_err() {
            ServiceError::NotFound { entity, .. } => {
                assert_eq!(entity, "Task");
            }
            other => panic!("Expected NotFound error, got: {:?}", other),
        }
    }

    #[tokio::test]
    async fn test_delete_task() {
        let test_db = setup_test_db().await;
        let project_id = create_test_project(&test_db.pool, "Test Project").await;

        // Create a task
        let request = test_create_request(&project_id, "Task to Delete");
        let created = TaskService::create(&test_db.pool, request)
            .await
            .expect("Failed to create task");

        // Verify it exists
        let fetched = TaskService::get(&test_db.pool, &created.id).await;
        assert!(fetched.is_ok());

        // Delete it
        TaskService::delete(&test_db.pool, &created.id)
            .await
            .expect("Failed to delete task");

        // Verify it's gone
        let result = TaskService::get(&test_db.pool, &created.id).await;
        assert!(result.is_err());
        match result.unwrap_err() {
            ServiceError::NotFound { entity, .. } => {
                assert_eq!(entity, "Task");
            }
            other => panic!("Expected NotFound error, got: {:?}", other),
        }
    }

    #[tokio::test]
    async fn test_delete_task_not_found() {
        let test_db = setup_test_db().await;

        let result = TaskService::delete(&test_db.pool, "non-existent-id").await;

        assert!(result.is_err());
        match result.unwrap_err() {
            ServiceError::NotFound { entity, .. } => {
                assert_eq!(entity, "Task");
            }
            other => panic!("Expected NotFound error, got: {:?}", other),
        }
    }

    #[tokio::test]
    async fn test_tasks_isolated_by_project() {
        let test_db = setup_test_db().await;
        let project1_id = create_test_project(&test_db.pool, "Project 1").await;
        let project2_id = create_test_project(&test_db.pool, "Project 2").await;

        // Create tasks in both projects
        let request1 = test_create_request(&project1_id, "Project 1 Task");
        let request2 = test_create_request(&project2_id, "Project 2 Task");

        TaskService::create(&test_db.pool, request1).await.unwrap();
        TaskService::create(&test_db.pool, request2).await.unwrap();

        // List tasks for project 1
        let p1_tasks = TaskService::list(&test_db.pool, &project1_id, None, false)
            .await
            .expect("Failed to list tasks");
        assert_eq!(p1_tasks.len(), 1);
        assert_eq!(p1_tasks[0].title, "Project 1 Task");

        // List tasks for project 2
        let p2_tasks = TaskService::list(&test_db.pool, &project2_id, None, false)
            .await
            .expect("Failed to list tasks");
        assert_eq!(p2_tasks.len(), 1);
        assert_eq!(p2_tasks[0].title, "Project 2 Task");
    }

    #[tokio::test]
    async fn test_create_task_with_parent_task() {
        let test_db = setup_test_db().await;
        let project_id = create_test_project(&test_db.pool, "Test Project").await;

        // Create parent task
        let parent_request = test_create_request(&project_id, "Parent Task");
        let parent = TaskService::create(&test_db.pool, parent_request)
            .await
            .expect("Failed to create parent task");

        // Create child task
        let child_request = CreateTaskRequest {
            project_id: project_id.clone(),
            title: "Child Task".to_string(),
            description: None,
            workflow_template: None,
            parent_task_id: Some(parent.id.clone()),
            base_branch: None,
        };
        let child = TaskService::create(&test_db.pool, child_request)
            .await
            .expect("Failed to create child task");

        assert_eq!(child.parent_task_id, Some(parent.id));
    }

    #[tokio::test]
    async fn test_delete_project_cascades_to_tasks() {
        let test_db = setup_test_db().await;
        let project_id = create_test_project(&test_db.pool, "Test Project").await;

        // Create tasks
        let request = test_create_request(&project_id, "Task to be cascaded");
        let task = TaskService::create(&test_db.pool, request)
            .await
            .expect("Failed to create task");

        // Delete the project
        ProjectService::delete(&test_db.pool, &project_id)
            .await
            .expect("Failed to delete project");

        // Task should be gone
        let result = TaskService::get(&test_db.pool, &task.id).await;
        assert!(result.is_err());
    }

    #[tokio::test]
    async fn test_duplicate_task() {
        let test_db = setup_test_db().await;
        let project_id = create_test_project(&test_db.pool, "Test Project").await;

        // Create original task
        let request = test_create_request(&project_id, "Original Task");
        let original = TaskService::create(&test_db.pool, request)
            .await
            .expect("Failed to create task");

        // Duplicate it
        let duplicate = TaskService::duplicate(&test_db.pool, &original.id)
            .await
            .expect("Failed to duplicate task");

        // Verify duplicate has new ID but same project
        assert_ne!(duplicate.id, original.id);
        assert_eq!(duplicate.project_id, original.project_id);

        // Verify title has "(copy)" appended
        assert_eq!(duplicate.title, "Original Task (copy)");

        // Verify status is reset to todo
        assert_eq!(duplicate.status, TaskStatus::Todo);

        // Verify timestamps are different
        assert_ne!(duplicate.created_at, original.created_at);

        // Verify not archived
        assert!(duplicate.archived_at.is_none());
    }

    #[tokio::test]
    async fn test_duplicate_task_preserves_fields() {
        let test_db = setup_test_db().await;
        let project_id = create_test_project(&test_db.pool, "Test Project").await;

        // Create original task with all fields populated
        let request = CreateTaskRequest {
            project_id: project_id.clone(),
            title: "Full Task".to_string(),
            description: Some("A complete task description".to_string()),
            workflow_template: Some("feature".to_string()),
            parent_task_id: None,
            base_branch: Some("develop".to_string()),
        };
        let original = TaskService::create(&test_db.pool, request)
            .await
            .expect("Failed to create task");

        // Duplicate it
        let duplicate = TaskService::duplicate(&test_db.pool, &original.id)
            .await
            .expect("Failed to duplicate task");

        // Verify all fields are preserved (except title, status, timestamps)
        assert_eq!(duplicate.description, original.description);
        assert_eq!(duplicate.workflow_template, original.workflow_template);
        assert_eq!(duplicate.base_branch, original.base_branch);
        assert_eq!(
            duplicate.auto_start_next_step,
            original.auto_start_next_step
        );
        assert_eq!(
            duplicate.default_executor_profile_id,
            original.default_executor_profile_id
        );
    }

    #[tokio::test]
    async fn test_duplicate_task_not_found() {
        let test_db = setup_test_db().await;

        let result = TaskService::duplicate(&test_db.pool, "non-existent-id").await;

        assert!(result.is_err());
        match result.unwrap_err() {
            ServiceError::NotFound { entity, .. } => {
                assert_eq!(entity, "Task");
            }
            other => panic!("Expected NotFound error, got: {:?}", other),
        }
    }

    #[tokio::test]
    async fn test_duplicate_task_with_parent() {
        let test_db = setup_test_db().await;
        let project_id = create_test_project(&test_db.pool, "Test Project").await;

        // Create parent task
        let parent_request = test_create_request(&project_id, "Parent Task");
        let parent = TaskService::create(&test_db.pool, parent_request)
            .await
            .expect("Failed to create parent task");

        // Create child task
        let child_request = CreateTaskRequest {
            project_id: project_id.clone(),
            title: "Child Task".to_string(),
            description: None,
            workflow_template: None,
            parent_task_id: Some(parent.id.clone()),
            base_branch: None,
        };
        let child = TaskService::create(&test_db.pool, child_request)
            .await
            .expect("Failed to create child task");

        // Duplicate the child task
        let duplicate = TaskService::duplicate(&test_db.pool, &child.id)
            .await
            .expect("Failed to duplicate task");

        // Verify parent_task_id is preserved
        assert_eq!(duplicate.parent_task_id, Some(parent.id));
    }
}
