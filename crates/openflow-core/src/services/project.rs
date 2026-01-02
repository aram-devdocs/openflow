//! Project management service.
//!
//! Handles CRUD operations for projects.
//!
//! # Logging
//!
//! This module uses structured logging at the following levels:
//! - `debug`: Query parameters, database operations, field updates
//! - `info`: Successful CRUD operations, list results with counts
//! - `warn`: Validation issues, unexpected states
//! - `error`: Database failures, not found errors
//!
//! # Error Handling
//!
//! All functions return `ServiceResult<T>` and use structured error types:
//! - `ServiceError::NotFound` for missing projects
//! - `ServiceError::Database` for database constraint violations

use log::{debug, error, info, warn};
use sqlx::SqlitePool;
use uuid::Uuid;

use openflow_contracts::{CreateProjectRequest, Project, UpdateProjectRequest};

use super::{ServiceError, ServiceResult};

/// List all non-archived projects ordered by name.
pub async fn list(pool: &SqlitePool) -> ServiceResult<Vec<Project>> {
    debug!("Listing all non-archived projects");

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
            archived_at,
            created_at,
            updated_at
        FROM projects
        WHERE archived_at IS NULL
        ORDER BY name ASC
        "#,
    )
    .fetch_all(pool)
    .await
    .map_err(|e| {
        error!("Failed to list projects: {}", e);
        ServiceError::Database(e)
    })?;

    let project_names: Vec<&str> = projects.iter().map(|p| p.name.as_str()).collect();
    info!(
        "Listed {} non-archived projects: {:?}",
        projects.len(),
        project_names
    );

    Ok(projects)
}

/// List all archived projects ordered by archived_at DESC.
pub async fn list_archived(pool: &SqlitePool) -> ServiceResult<Vec<Project>> {
    debug!("Listing all archived projects");

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
            archived_at,
            created_at,
            updated_at
        FROM projects
        WHERE archived_at IS NOT NULL
        ORDER BY archived_at DESC
        "#,
    )
    .fetch_all(pool)
    .await
    .map_err(|e| {
        error!("Failed to list archived projects: {}", e);
        ServiceError::Database(e)
    })?;

    let project_names: Vec<&str> = projects.iter().map(|p| p.name.as_str()).collect();
    info!(
        "Listed {} archived projects: {:?}",
        projects.len(),
        project_names
    );

    Ok(projects)
}

/// Get a project by ID.
pub async fn get(pool: &SqlitePool, id: &str) -> ServiceResult<Project> {
    debug!("Getting project by id: {}", id);

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
            archived_at,
            created_at,
            updated_at
        FROM projects
        WHERE id = ?
        "#,
    )
    .bind(id)
    .fetch_optional(pool)
    .await
    .map_err(|e| {
        error!("Failed to get project {}: {}", id, e);
        ServiceError::Database(e)
    })?
    .ok_or_else(|| {
        error!("Project not found: {}", id);
        ServiceError::NotFound {
            entity: "Project",
            id: id.to_string(),
        }
    })?;

    debug!(
        "Found project: id={}, name={}, git_repo_path={}",
        project.id, project.name, project.git_repo_path
    );

    Ok(project)
}

/// Create a new project.
pub async fn create(pool: &SqlitePool, request: CreateProjectRequest) -> ServiceResult<Project> {
    debug!(
        "Creating project: name={}, git_repo_path={}",
        request.name, request.git_repo_path
    );

    let id = Uuid::new_v4().to_string();
    let base_branch = request.base_branch.unwrap_or_else(|| "main".to_string());
    let setup_script = request.setup_script.unwrap_or_default();
    let dev_script = request.dev_script.unwrap_or_default();
    let icon = request.icon.unwrap_or_else(|| "folder".to_string());
    let workflows_folder = request
        .workflows_folder
        .unwrap_or_else(|| ".openflow/workflows".to_string());

    debug!(
        "Project defaults applied: id={}, base_branch={}, icon={}, workflows_folder={}",
        id, base_branch, icon, workflows_folder
    );

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
    .await
    .map_err(|e| {
        error!(
            "Failed to create project: name={}, git_repo_path={}, error={}",
            request.name, request.git_repo_path, e
        );
        ServiceError::Database(e)
    })?;

    info!(
        "Created project: id={}, name={}, git_repo_path={}",
        id, request.name, request.git_repo_path
    );

    get(pool, &id).await
}

/// Update an existing project.
pub async fn update(
    pool: &SqlitePool,
    id: &str,
    request: UpdateProjectRequest,
) -> ServiceResult<Project> {
    debug!("Updating project: id={}", id);

    // Verify the project exists first
    let existing = get(pool, id).await?;

    // Track which fields are being updated
    let mut updated_fields: Vec<&str> = Vec::new();
    if request.name.is_some() {
        updated_fields.push("name");
    }
    if request.git_repo_path.is_some() {
        updated_fields.push("git_repo_path");
    }
    if request.base_branch.is_some() {
        updated_fields.push("base_branch");
    }
    if request.setup_script.is_some() {
        updated_fields.push("setup_script");
    }
    if request.dev_script.is_some() {
        updated_fields.push("dev_script");
    }
    if request.cleanup_script.is_some() {
        updated_fields.push("cleanup_script");
    }
    if request.copy_files.is_some() {
        updated_fields.push("copy_files");
    }
    if request.icon.is_some() {
        updated_fields.push("icon");
    }
    if request.rule_folders.is_some() {
        updated_fields.push("rule_folders");
    }
    if request.always_included_rules.is_some() {
        updated_fields.push("always_included_rules");
    }
    if request.workflows_folder.is_some() {
        updated_fields.push("workflows_folder");
    }
    if request.verification_config.is_some() {
        updated_fields.push("verification_config");
    }

    debug!(
        "Updating {} fields for project {}: {:?}",
        updated_fields.len(),
        id,
        updated_fields
    );

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
    let always_included_rules = request
        .always_included_rules
        .or(existing.always_included_rules);
    let workflows_folder = request
        .workflows_folder
        .unwrap_or(existing.workflows_folder);
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
    .await
    .map_err(|e| {
        error!("Failed to update project {}: {}", id, e);
        ServiceError::Database(e)
    })?;

    info!(
        "Updated project: id={}, name={}, fields_updated={:?}",
        id, name, updated_fields
    );

    get(pool, id).await
}

/// Delete a project by ID.
pub async fn delete(pool: &SqlitePool, id: &str) -> ServiceResult<()> {
    debug!("Deleting project: id={}", id);

    // Verify the project exists first
    let project = get(pool, id).await?;
    let project_name = project.name.clone();

    sqlx::query("DELETE FROM projects WHERE id = ?")
        .bind(id)
        .execute(pool)
        .await
        .map_err(|e| {
            error!("Failed to delete project {}: {}", id, e);
            ServiceError::Database(e)
        })?;

    info!("Deleted project: id={}, name={}", id, project_name);

    Ok(())
}

/// Archive a project by ID.
///
/// Sets the archived_at timestamp and cascades to archive all tasks in the project.
/// Archived projects are excluded from list queries but can still be accessed by ID.
pub async fn archive(pool: &SqlitePool, id: &str) -> ServiceResult<Project> {
    debug!("Archiving project: id={}", id);

    // Verify the project exists first
    let project = get(pool, id).await?;

    if project.archived_at.is_some() {
        warn!("Project {} is already archived", id);
    }

    let project_name = project.name.clone();

    // Archive the project
    sqlx::query(
        r#"
        UPDATE projects
        SET archived_at = datetime('now', 'subsec'),
            updated_at = datetime('now', 'subsec')
        WHERE id = ?
        "#,
    )
    .bind(id)
    .execute(pool)
    .await
    .map_err(|e| {
        error!("Failed to archive project {}: {}", id, e);
        ServiceError::Database(e)
    })?;

    // Cascade: archive all tasks in this project
    let cascade_result = sqlx::query(
        r#"
        UPDATE tasks
        SET archived_at = datetime('now', 'subsec'),
            updated_at = datetime('now', 'subsec')
        WHERE project_id = ? AND archived_at IS NULL
        "#,
    )
    .bind(id)
    .execute(pool)
    .await
    .map_err(|e| {
        error!("Failed to cascade archive tasks for project {}: {}", id, e);
        ServiceError::Database(e)
    })?;

    let tasks_archived = cascade_result.rows_affected();
    info!(
        "Archived project: id={}, name={}, tasks_archived={}",
        id, project_name, tasks_archived
    );

    get(pool, id).await
}

/// Unarchive a project by ID.
///
/// Clears the archived_at timestamp, making the project visible in list queries again.
/// Note: Tasks remain archived and must be restored individually.
pub async fn unarchive(pool: &SqlitePool, id: &str) -> ServiceResult<Project> {
    debug!("Unarchiving project: id={}", id);

    // Verify the project exists first
    let project = get(pool, id).await?;

    if project.archived_at.is_none() {
        warn!("Project {} is not archived", id);
    }

    let project_name = project.name.clone();

    sqlx::query(
        r#"
        UPDATE projects
        SET archived_at = NULL,
            updated_at = datetime('now', 'subsec')
        WHERE id = ?
        "#,
    )
    .bind(id)
    .execute(pool)
    .await
    .map_err(|e| {
        error!("Failed to unarchive project {}: {}", id, e);
        ServiceError::Database(e)
    })?;

    info!("Unarchived project: id={}, name={}", id, project_name);

    get(pool, id).await
}

#[cfg(test)]
mod tests {
    use super::*;
    use openflow_db::{DbConfig, init_db};
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
        let config = DbConfig::from_directory(temp_dir.path());
        let pool = init_db(config)
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
        let project = create(&test_db.pool, request)
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

        let project = create(&test_db.pool, request)
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
        let created = create(&test_db.pool, request)
            .await
            .expect("Failed to create project");

        // Get the project
        let fetched = get(&test_db.pool, &created.id)
            .await
            .expect("Failed to get project");

        assert_eq!(fetched.id, created.id);
        assert_eq!(fetched.name, "Get Test");
        assert_eq!(fetched.git_repo_path, "/get/test/path");
    }

    #[tokio::test]
    async fn test_get_project_not_found() {
        let test_db = setup_test_db().await;

        let result = get(&test_db.pool, "non-existent-id").await;

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
        let projects = list(&test_db.pool)
            .await
            .expect("Failed to list projects");
        assert!(projects.is_empty());

        // Create multiple projects
        let request1 = test_create_request("Project B", "/path/b");
        let request2 = test_create_request("Project A", "/path/a");
        let request3 = test_create_request("Project C", "/path/c");

        create(&test_db.pool, request1).await.unwrap();
        create(&test_db.pool, request2).await.unwrap();
        create(&test_db.pool, request3).await.unwrap();

        // List should return all projects ordered by name
        let projects = list(&test_db.pool)
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
        let created = create(&test_db.pool, request)
            .await
            .expect("Failed to create project");

        // Wait to ensure timestamp changes (avoid flaky test on fast machines)
        tokio::time::sleep(std::time::Duration::from_millis(10)).await;

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

        let updated = update(&test_db.pool, &created.id, update_request)
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

        let result = update(&test_db.pool, "non-existent-id", update_request).await;

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
        let created = create(&test_db.pool, request)
            .await
            .expect("Failed to create project");

        // Verify it exists
        let fetched = get(&test_db.pool, &created.id).await;
        assert!(fetched.is_ok());

        // Delete it
        delete(&test_db.pool, &created.id)
            .await
            .expect("Failed to delete project");

        // Verify it's gone
        let result = get(&test_db.pool, &created.id).await;
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

        let result = delete(&test_db.pool, "non-existent-id").await;

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
        create(&test_db.pool, request1)
            .await
            .expect("Failed to create first project");

        // Try to create second project with same path
        let request2 = test_create_request("Project 2", "/same/path");
        let result = create(&test_db.pool, request2).await;

        assert!(result.is_err());
        // Should be a database constraint error (UNIQUE constraint on git_repo_path)
        match result.unwrap_err() {
            ServiceError::Database(_) => {} // Expected
            other => panic!("Expected Database error, got: {:?}", other),
        }
    }

    #[tokio::test]
    async fn test_archive_project() {
        let test_db = setup_test_db().await;

        // Create a project
        let request = test_create_request("To Archive", "/archive/path");
        let created = create(&test_db.pool, request)
            .await
            .expect("Failed to create project");

        assert!(created.archived_at.is_none());

        // Archive it
        let archived = archive(&test_db.pool, &created.id)
            .await
            .expect("Failed to archive project");

        assert!(archived.archived_at.is_some());

        // Verify it's not in the normal list
        let projects = list(&test_db.pool).await.expect("Failed to list projects");
        assert!(!projects.iter().any(|p| p.id == created.id));

        // But it should be in archived list
        let archived_projects = list_archived(&test_db.pool)
            .await
            .expect("Failed to list archived projects");
        assert!(archived_projects.iter().any(|p| p.id == created.id));
    }

    #[tokio::test]
    async fn test_unarchive_project() {
        let test_db = setup_test_db().await;

        // Create and archive a project
        let request = test_create_request("To Unarchive", "/unarchive/path");
        let created = create(&test_db.pool, request)
            .await
            .expect("Failed to create project");
        let archived = archive(&test_db.pool, &created.id)
            .await
            .expect("Failed to archive project");

        assert!(archived.archived_at.is_some());

        // Unarchive it
        let unarchived = unarchive(&test_db.pool, &created.id)
            .await
            .expect("Failed to unarchive project");

        assert!(unarchived.archived_at.is_none());

        // Verify it's back in the normal list
        let projects = list(&test_db.pool).await.expect("Failed to list projects");
        assert!(projects.iter().any(|p| p.id == created.id));
    }
}
