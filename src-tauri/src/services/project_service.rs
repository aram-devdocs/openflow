//! Project management service.
//!
//! Handles CRUD operations for projects.

use sqlx::SqlitePool;
use uuid::Uuid;

use crate::types::{CreateProjectRequest, Project, UpdateProjectRequest};

use super::{ServiceError, ServiceResult};

/// Service for managing projects.
pub struct ProjectService;

impl ProjectService {
    /// List all projects ordered by name.
    pub async fn list(pool: &SqlitePool) -> ServiceResult<Vec<Project>> {
        let projects = sqlx::query_as::<_, Project>(
            r#"
            SELECT
                id,
                name,
                git_repo_path,
                base_branch,
                setup_script,
                dev_script,
                cleanup_script,
                copy_files,
                icon,
                rule_folders,
                always_included_rules,
                workflows_folder,
                verification_config,
                created_at,
                updated_at
            FROM projects
            ORDER BY name ASC
            "#,
        )
        .fetch_all(pool)
        .await?;

        Ok(projects)
    }

    /// Get a project by ID.
    pub async fn get(pool: &SqlitePool, id: &str) -> ServiceResult<Project> {
        let project = sqlx::query_as::<_, Project>(
            r#"
            SELECT
                id,
                name,
                git_repo_path,
                base_branch,
                setup_script,
                dev_script,
                cleanup_script,
                copy_files,
                icon,
                rule_folders,
                always_included_rules,
                workflows_folder,
                verification_config,
                created_at,
                updated_at
            FROM projects
            WHERE id = ?
            "#,
        )
        .bind(id)
        .fetch_optional(pool)
        .await?
        .ok_or_else(|| ServiceError::NotFound {
            entity: "Project",
            id: id.to_string(),
        })?;

        Ok(project)
    }

    /// Create a new project.
    pub async fn create(pool: &SqlitePool, request: CreateProjectRequest) -> ServiceResult<Project> {
        let id = Uuid::new_v4().to_string();
        let base_branch = request.base_branch.unwrap_or_else(|| "main".to_string());
        let setup_script = request.setup_script.unwrap_or_default();
        let dev_script = request.dev_script.unwrap_or_default();
        let icon = request.icon.unwrap_or_else(|| "folder".to_string());
        let workflows_folder = request
            .workflows_folder
            .unwrap_or_else(|| ".openflow/workflows".to_string());

        sqlx::query(
            r#"
            INSERT INTO projects (
                id, name, git_repo_path, base_branch, setup_script, dev_script,
                cleanup_script, copy_files, icon, rule_folders, always_included_rules,
                workflows_folder, verification_config
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            "#,
        )
        .bind(&id)
        .bind(&request.name)
        .bind(&request.git_repo_path)
        .bind(&base_branch)
        .bind(&setup_script)
        .bind(&dev_script)
        .bind(&request.cleanup_script)
        .bind(&request.copy_files)
        .bind(&icon)
        .bind(&request.rule_folders)
        .bind(&request.always_included_rules)
        .bind(&workflows_folder)
        .bind(&request.verification_config)
        .execute(pool)
        .await?;

        Self::get(pool, &id).await
    }

    /// Update an existing project.
    pub async fn update(
        pool: &SqlitePool,
        id: &str,
        request: UpdateProjectRequest,
    ) -> ServiceResult<Project> {
        // Verify the project exists first
        let existing = Self::get(pool, id).await?;

        // Apply updates, falling back to existing values
        let name = request.name.unwrap_or(existing.name);
        let git_repo_path = request.git_repo_path.unwrap_or(existing.git_repo_path);
        let base_branch = request.base_branch.unwrap_or(existing.base_branch);
        let setup_script = request.setup_script.unwrap_or(existing.setup_script);
        let dev_script = request.dev_script.unwrap_or(existing.dev_script);
        let cleanup_script = request.cleanup_script.or(existing.cleanup_script);
        let copy_files = request.copy_files.or(existing.copy_files);
        let icon = request.icon.unwrap_or(existing.icon);
        let rule_folders = request.rule_folders.or(existing.rule_folders);
        let always_included_rules = request.always_included_rules.or(existing.always_included_rules);
        let workflows_folder = request.workflows_folder.unwrap_or(existing.workflows_folder);
        let verification_config = request.verification_config.or(existing.verification_config);

        sqlx::query(
            r#"
            UPDATE projects
            SET
                name = ?,
                git_repo_path = ?,
                base_branch = ?,
                setup_script = ?,
                dev_script = ?,
                cleanup_script = ?,
                copy_files = ?,
                icon = ?,
                rule_folders = ?,
                always_included_rules = ?,
                workflows_folder = ?,
                verification_config = ?,
                updated_at = datetime('now', 'subsec')
            WHERE id = ?
            "#,
        )
        .bind(&name)
        .bind(&git_repo_path)
        .bind(&base_branch)
        .bind(&setup_script)
        .bind(&dev_script)
        .bind(&cleanup_script)
        .bind(&copy_files)
        .bind(&icon)
        .bind(&rule_folders)
        .bind(&always_included_rules)
        .bind(&workflows_folder)
        .bind(&verification_config)
        .bind(id)
        .execute(pool)
        .await?;

        Self::get(pool, id).await
    }

    /// Delete a project by ID.
    pub async fn delete(pool: &SqlitePool, id: &str) -> ServiceResult<()> {
        // Verify the project exists first
        Self::get(pool, id).await?;

        sqlx::query("DELETE FROM projects WHERE id = ?")
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
    use tempfile::TempDir;

    /// Test fixture that keeps the temp directory alive.
    struct TestDb {
        pool: SqlitePool,
        #[allow(dead_code)]
        temp_dir: TempDir, // Keep temp_dir alive for the duration of the test
    }

    /// Helper to create a test database pool.
    async fn setup_test_db() -> TestDb {
        let temp_dir = TempDir::new().expect("Failed to create temp dir");
        let pool = init_db(temp_dir.path().to_path_buf())
            .await
            .expect("Failed to initialize test database");
        TestDb { pool, temp_dir }
    }

    /// Helper to create a test project request.
    fn test_create_request(name: &str, path: &str) -> CreateProjectRequest {
        CreateProjectRequest {
            name: name.to_string(),
            git_repo_path: path.to_string(),
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
        }
    }

    #[tokio::test]
    async fn test_create_project() {
        let test_db = setup_test_db().await;

        let request = test_create_request("Test Project", "/path/to/repo");
        let project = ProjectService::create(&test_db.pool, request)
            .await
            .expect("Failed to create project");

        assert_eq!(project.name, "Test Project");
        assert_eq!(project.git_repo_path, "/path/to/repo");
        assert_eq!(project.base_branch, "main"); // Default value
        assert_eq!(project.icon, "folder"); // Default value
        assert_eq!(project.workflows_folder, ".openflow/workflows"); // Default value
        assert!(!project.id.is_empty());
    }

    #[tokio::test]
    async fn test_create_project_with_custom_values() {
        let test_db = setup_test_db().await;

        let request = CreateProjectRequest {
            name: "Custom Project".to_string(),
            git_repo_path: "/custom/path".to_string(),
            base_branch: Some("develop".to_string()),
            setup_script: Some("npm install".to_string()),
            dev_script: Some("npm run dev".to_string()),
            cleanup_script: Some("npm run clean".to_string()),
            copy_files: Some(r#"["file1.txt", "file2.txt"]"#.to_string()),
            icon: Some("rocket".to_string()),
            rule_folders: Some(r#"[".rules"]"#.to_string()),
            always_included_rules: Some(r#"["rule1.md"]"#.to_string()),
            workflows_folder: Some("workflows".to_string()),
            verification_config: Some(r#"{"test": "npm test"}"#.to_string()),
        };

        let project = ProjectService::create(&test_db.pool, request)
            .await
            .expect("Failed to create project");

        assert_eq!(project.name, "Custom Project");
        assert_eq!(project.base_branch, "develop");
        assert_eq!(project.setup_script, "npm install");
        assert_eq!(project.dev_script, "npm run dev");
        assert_eq!(project.cleanup_script, Some("npm run clean".to_string()));
        assert_eq!(project.icon, "rocket");
        assert_eq!(project.workflows_folder, "workflows");
    }

    #[tokio::test]
    async fn test_get_project() {
        let test_db = setup_test_db().await;

        // Create a project first
        let request = test_create_request("Get Test", "/get/test/path");
        let created = ProjectService::create(&test_db.pool, request)
            .await
            .expect("Failed to create project");

        // Get the project
        let fetched = ProjectService::get(&test_db.pool, &created.id)
            .await
            .expect("Failed to get project");

        assert_eq!(fetched.id, created.id);
        assert_eq!(fetched.name, "Get Test");
        assert_eq!(fetched.git_repo_path, "/get/test/path");
    }

    #[tokio::test]
    async fn test_get_project_not_found() {
        let test_db = setup_test_db().await;

        let result = ProjectService::get(&test_db.pool, "non-existent-id").await;

        assert!(result.is_err());
        match result.unwrap_err() {
            ServiceError::NotFound { entity, id } => {
                assert_eq!(entity, "Project");
                assert_eq!(id, "non-existent-id");
            }
            other => panic!("Expected NotFound error, got: {:?}", other),
        }
    }

    #[tokio::test]
    async fn test_list_projects() {
        let test_db = setup_test_db().await;

        // Start with empty list
        let projects = ProjectService::list(&test_db.pool)
            .await
            .expect("Failed to list projects");
        assert!(projects.is_empty());

        // Create multiple projects
        let request1 = test_create_request("Project B", "/path/b");
        let request2 = test_create_request("Project A", "/path/a");
        let request3 = test_create_request("Project C", "/path/c");

        ProjectService::create(&test_db.pool, request1).await.unwrap();
        ProjectService::create(&test_db.pool, request2).await.unwrap();
        ProjectService::create(&test_db.pool, request3).await.unwrap();

        // List should return all projects ordered by name
        let projects = ProjectService::list(&test_db.pool)
            .await
            .expect("Failed to list projects");

        assert_eq!(projects.len(), 3);
        assert_eq!(projects[0].name, "Project A");
        assert_eq!(projects[1].name, "Project B");
        assert_eq!(projects[2].name, "Project C");
    }

    #[tokio::test]
    async fn test_update_project() {
        let test_db = setup_test_db().await;

        // Create a project
        let request = test_create_request("Original Name", "/original/path");
        let created = ProjectService::create(&test_db.pool, request)
            .await
            .expect("Failed to create project");

        // Update partial fields
        let update_request = UpdateProjectRequest {
            name: Some("Updated Name".to_string()),
            git_repo_path: None, // Keep original
            base_branch: Some("feature".to_string()),
            setup_script: None,
            dev_script: None,
            cleanup_script: None,
            copy_files: None,
            icon: Some("star".to_string()),
            rule_folders: None,
            always_included_rules: None,
            workflows_folder: None,
            verification_config: None,
        };

        let updated = ProjectService::update(&test_db.pool, &created.id, update_request)
            .await
            .expect("Failed to update project");

        assert_eq!(updated.id, created.id);
        assert_eq!(updated.name, "Updated Name");
        assert_eq!(updated.git_repo_path, "/original/path"); // Unchanged
        assert_eq!(updated.base_branch, "feature");
        assert_eq!(updated.icon, "star");
        assert_ne!(updated.updated_at, created.updated_at);
    }

    #[tokio::test]
    async fn test_update_project_not_found() {
        let test_db = setup_test_db().await;

        let update_request = UpdateProjectRequest {
            name: Some("New Name".to_string()),
            git_repo_path: None,
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

        let result = ProjectService::update(&test_db.pool, "non-existent-id", update_request).await;

        assert!(result.is_err());
        match result.unwrap_err() {
            ServiceError::NotFound { entity, .. } => {
                assert_eq!(entity, "Project");
            }
            other => panic!("Expected NotFound error, got: {:?}", other),
        }
    }

    #[tokio::test]
    async fn test_delete_project() {
        let test_db = setup_test_db().await;

        // Create a project
        let request = test_create_request("To Delete", "/delete/path");
        let created = ProjectService::create(&test_db.pool, request)
            .await
            .expect("Failed to create project");

        // Verify it exists
        let fetched = ProjectService::get(&test_db.pool, &created.id).await;
        assert!(fetched.is_ok());

        // Delete it
        ProjectService::delete(&test_db.pool, &created.id)
            .await
            .expect("Failed to delete project");

        // Verify it's gone
        let result = ProjectService::get(&test_db.pool, &created.id).await;
        assert!(result.is_err());
        match result.unwrap_err() {
            ServiceError::NotFound { entity, .. } => {
                assert_eq!(entity, "Project");
            }
            other => panic!("Expected NotFound error, got: {:?}", other),
        }
    }

    #[tokio::test]
    async fn test_delete_project_not_found() {
        let test_db = setup_test_db().await;

        let result = ProjectService::delete(&test_db.pool, "non-existent-id").await;

        assert!(result.is_err());
        match result.unwrap_err() {
            ServiceError::NotFound { entity, .. } => {
                assert_eq!(entity, "Project");
            }
            other => panic!("Expected NotFound error, got: {:?}", other),
        }
    }

    #[tokio::test]
    async fn test_duplicate_git_repo_path_fails() {
        let test_db = setup_test_db().await;

        // Create first project
        let request1 = test_create_request("Project 1", "/same/path");
        ProjectService::create(&test_db.pool, request1)
            .await
            .expect("Failed to create first project");

        // Try to create second project with same path
        let request2 = test_create_request("Project 2", "/same/path");
        let result = ProjectService::create(&test_db.pool, request2).await;

        assert!(result.is_err());
        // Should be a database constraint error (UNIQUE constraint on git_repo_path)
        match result.unwrap_err() {
            ServiceError::Database(_) => {} // Expected
            other => panic!("Expected Database error, got: {:?}", other),
        }
    }
}
