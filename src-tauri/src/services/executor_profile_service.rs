//! Executor profile management service.
//!
//! Handles CRUD operations for executor profiles (CLI tool configurations).
//! Manages the is_default constraint ensuring only one profile is default at a time.

use sqlx::SqlitePool;
use uuid::Uuid;

use crate::types::{
    CreateExecutorProfileRequest, ExecutorProfile, UpdateExecutorProfileRequest,
};

use super::{ServiceError, ServiceResult};

/// Service for managing executor profiles.
pub struct ExecutorProfileService;

impl ExecutorProfileService {
    /// List all executor profiles ordered by name.
    pub async fn list(pool: &SqlitePool) -> ServiceResult<Vec<ExecutorProfile>> {
        let profiles = sqlx::query_as::<_, ExecutorProfile>(
            r#"
            SELECT
                id,
                name,
                command,
                args,
                env,
                model,
                is_default,
                created_at,
                updated_at
            FROM executor_profiles
            ORDER BY name ASC
            "#,
        )
        .fetch_all(pool)
        .await?;

        Ok(profiles)
    }

    /// Get an executor profile by ID.
    pub async fn get(pool: &SqlitePool, id: &str) -> ServiceResult<ExecutorProfile> {
        let profile = sqlx::query_as::<_, ExecutorProfile>(
            r#"
            SELECT
                id,
                name,
                command,
                args,
                env,
                model,
                is_default,
                created_at,
                updated_at
            FROM executor_profiles
            WHERE id = ?
            "#,
        )
        .bind(id)
        .fetch_optional(pool)
        .await?
        .ok_or_else(|| ServiceError::NotFound {
            entity: "ExecutorProfile",
            id: id.to_string(),
        })?;

        Ok(profile)
    }

    /// Create a new executor profile.
    /// If is_default is true, clears default from all other profiles.
    pub async fn create(
        pool: &SqlitePool,
        request: CreateExecutorProfileRequest,
    ) -> ServiceResult<ExecutorProfile> {
        let id = Uuid::new_v4().to_string();
        let is_default = request.is_default.unwrap_or(false);

        // If this profile should be default, clear default from all others
        if is_default {
            Self::clear_all_defaults(pool).await?;
        }

        sqlx::query(
            r#"
            INSERT INTO executor_profiles (
                id, name, command, args, env, model, is_default
            )
            VALUES (?, ?, ?, ?, ?, ?, ?)
            "#,
        )
        .bind(&id)
        .bind(&request.name)
        .bind(&request.command)
        .bind(&request.args)
        .bind(&request.env)
        .bind(&request.model)
        .bind(is_default)
        .execute(pool)
        .await?;

        Self::get(pool, &id).await
    }

    /// Update an existing executor profile.
    /// If is_default is set to true, clears default from all other profiles.
    pub async fn update(
        pool: &SqlitePool,
        id: &str,
        request: UpdateExecutorProfileRequest,
    ) -> ServiceResult<ExecutorProfile> {
        // Verify the profile exists first
        let existing = Self::get(pool, id).await?;

        // Apply updates, falling back to existing values
        let name = request.name.unwrap_or(existing.name);
        let command = request.command.unwrap_or(existing.command);
        let args = request.args.or(existing.args);
        let env = request.env.or(existing.env);
        let model = request.model.or(existing.model);
        let is_default = request.is_default.unwrap_or(existing.is_default);

        // If setting this profile as default, clear default from all others
        if is_default && !existing.is_default {
            Self::clear_all_defaults(pool).await?;
        }

        sqlx::query(
            r#"
            UPDATE executor_profiles
            SET
                name = ?,
                command = ?,
                args = ?,
                env = ?,
                model = ?,
                is_default = ?,
                updated_at = datetime('now', 'subsec')
            WHERE id = ?
            "#,
        )
        .bind(&name)
        .bind(&command)
        .bind(&args)
        .bind(&env)
        .bind(&model)
        .bind(is_default)
        .bind(id)
        .execute(pool)
        .await?;

        Self::get(pool, id).await
    }

    /// Delete an executor profile by ID.
    pub async fn delete(pool: &SqlitePool, id: &str) -> ServiceResult<()> {
        // Verify the profile exists first
        Self::get(pool, id).await?;

        sqlx::query("DELETE FROM executor_profiles WHERE id = ?")
            .bind(id)
            .execute(pool)
            .await?;

        Ok(())
    }

    /// Get the default executor profile.
    pub async fn get_default(pool: &SqlitePool) -> ServiceResult<Option<ExecutorProfile>> {
        let profile = sqlx::query_as::<_, ExecutorProfile>(
            r#"
            SELECT
                id,
                name,
                command,
                args,
                env,
                model,
                is_default,
                created_at,
                updated_at
            FROM executor_profiles
            WHERE is_default = TRUE
            LIMIT 1
            "#,
        )
        .fetch_optional(pool)
        .await?;

        Ok(profile)
    }

    /// Clear the is_default flag from all profiles.
    async fn clear_all_defaults(pool: &SqlitePool) -> ServiceResult<()> {
        sqlx::query(
            r#"
            UPDATE executor_profiles
            SET is_default = FALSE, updated_at = datetime('now', 'subsec')
            WHERE is_default = TRUE
            "#,
        )
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

    /// Helper to create a test executor profile request.
    fn test_create_request(name: &str, command: &str) -> CreateExecutorProfileRequest {
        CreateExecutorProfileRequest {
            name: name.to_string(),
            command: command.to_string(),
            args: None,
            env: None,
            model: None,
            is_default: None,
        }
    }

    #[tokio::test]
    async fn test_create_executor_profile() {
        let test_db = setup_test_db().await;

        let request = test_create_request("Claude Code", "claude");
        let profile = ExecutorProfileService::create(&test_db.pool, request)
            .await
            .expect("Failed to create executor profile");

        assert_eq!(profile.name, "Claude Code");
        assert_eq!(profile.command, "claude");
        assert!(!profile.is_default);
        assert!(profile.args.is_none());
        assert!(profile.env.is_none());
        assert!(profile.model.is_none());
        assert!(!profile.id.is_empty());
    }

    #[tokio::test]
    async fn test_create_executor_profile_with_all_fields() {
        let test_db = setup_test_db().await;

        let request = CreateExecutorProfileRequest {
            name: "Claude Code Pro".to_string(),
            command: "claude".to_string(),
            args: Some(r#"["--verbose", "--no-confirm"]"#.to_string()),
            env: Some(r#"{"ANTHROPIC_API_KEY": "test"}"#.to_string()),
            model: Some("claude-3-opus".to_string()),
            is_default: Some(true),
        };

        let profile = ExecutorProfileService::create(&test_db.pool, request)
            .await
            .expect("Failed to create executor profile");

        assert_eq!(profile.name, "Claude Code Pro");
        assert_eq!(profile.command, "claude");
        assert!(profile.is_default);
        assert_eq!(profile.args, Some(r#"["--verbose", "--no-confirm"]"#.to_string()));
        assert_eq!(profile.env, Some(r#"{"ANTHROPIC_API_KEY": "test"}"#.to_string()));
        assert_eq!(profile.model, Some("claude-3-opus".to_string()));
    }

    #[tokio::test]
    async fn test_get_executor_profile() {
        let test_db = setup_test_db().await;

        // Create a profile first
        let request = test_create_request("Get Test", "gemini");
        let created = ExecutorProfileService::create(&test_db.pool, request)
            .await
            .expect("Failed to create executor profile");

        // Get the profile
        let fetched = ExecutorProfileService::get(&test_db.pool, &created.id)
            .await
            .expect("Failed to get executor profile");

        assert_eq!(fetched.id, created.id);
        assert_eq!(fetched.name, "Get Test");
        assert_eq!(fetched.command, "gemini");
    }

    #[tokio::test]
    async fn test_get_executor_profile_not_found() {
        let test_db = setup_test_db().await;

        let result = ExecutorProfileService::get(&test_db.pool, "non-existent-id").await;

        assert!(result.is_err());
        match result.unwrap_err() {
            ServiceError::NotFound { entity, id } => {
                assert_eq!(entity, "ExecutorProfile");
                assert_eq!(id, "non-existent-id");
            }
            other => panic!("Expected NotFound error, got: {:?}", other),
        }
    }

    #[tokio::test]
    async fn test_list_executor_profiles() {
        let test_db = setup_test_db().await;

        // Start with empty list
        let profiles = ExecutorProfileService::list(&test_db.pool)
            .await
            .expect("Failed to list executor profiles");
        assert!(profiles.is_empty());

        // Create multiple profiles
        let request1 = test_create_request("Gemini CLI", "gemini");
        let request2 = test_create_request("Claude Code", "claude");
        let request3 = test_create_request("Cursor CLI", "cursor");

        ExecutorProfileService::create(&test_db.pool, request1).await.unwrap();
        ExecutorProfileService::create(&test_db.pool, request2).await.unwrap();
        ExecutorProfileService::create(&test_db.pool, request3).await.unwrap();

        // List should return all profiles ordered by name
        let profiles = ExecutorProfileService::list(&test_db.pool)
            .await
            .expect("Failed to list executor profiles");

        assert_eq!(profiles.len(), 3);
        assert_eq!(profiles[0].name, "Claude Code");
        assert_eq!(profiles[1].name, "Cursor CLI");
        assert_eq!(profiles[2].name, "Gemini CLI");
    }

    #[tokio::test]
    async fn test_update_executor_profile() {
        let test_db = setup_test_db().await;

        // Create a profile
        let request = test_create_request("Original Name", "original");
        let created = ExecutorProfileService::create(&test_db.pool, request)
            .await
            .expect("Failed to create executor profile");

        // Update partial fields
        let update_request = UpdateExecutorProfileRequest {
            name: Some("Updated Name".to_string()),
            command: None, // Keep original
            args: Some(r#"["--flag"]"#.to_string()),
            env: None,
            model: Some("new-model".to_string()),
            is_default: None,
        };

        let updated = ExecutorProfileService::update(&test_db.pool, &created.id, update_request)
            .await
            .expect("Failed to update executor profile");

        assert_eq!(updated.id, created.id);
        assert_eq!(updated.name, "Updated Name");
        assert_eq!(updated.command, "original"); // Unchanged
        assert_eq!(updated.args, Some(r#"["--flag"]"#.to_string()));
        assert_eq!(updated.model, Some("new-model".to_string()));
        assert_ne!(updated.updated_at, created.updated_at);
    }

    #[tokio::test]
    async fn test_update_executor_profile_not_found() {
        let test_db = setup_test_db().await;

        let update_request = UpdateExecutorProfileRequest {
            name: Some("New Name".to_string()),
            command: None,
            args: None,
            env: None,
            model: None,
            is_default: None,
        };

        let result = ExecutorProfileService::update(&test_db.pool, "non-existent-id", update_request).await;

        assert!(result.is_err());
        match result.unwrap_err() {
            ServiceError::NotFound { entity, .. } => {
                assert_eq!(entity, "ExecutorProfile");
            }
            other => panic!("Expected NotFound error, got: {:?}", other),
        }
    }

    #[tokio::test]
    async fn test_delete_executor_profile() {
        let test_db = setup_test_db().await;

        // Create a profile
        let request = test_create_request("To Delete", "delete");
        let created = ExecutorProfileService::create(&test_db.pool, request)
            .await
            .expect("Failed to create executor profile");

        // Verify it exists
        let fetched = ExecutorProfileService::get(&test_db.pool, &created.id).await;
        assert!(fetched.is_ok());

        // Delete it
        ExecutorProfileService::delete(&test_db.pool, &created.id)
            .await
            .expect("Failed to delete executor profile");

        // Verify it's gone
        let result = ExecutorProfileService::get(&test_db.pool, &created.id).await;
        assert!(result.is_err());
        match result.unwrap_err() {
            ServiceError::NotFound { entity, .. } => {
                assert_eq!(entity, "ExecutorProfile");
            }
            other => panic!("Expected NotFound error, got: {:?}", other),
        }
    }

    #[tokio::test]
    async fn test_delete_executor_profile_not_found() {
        let test_db = setup_test_db().await;

        let result = ExecutorProfileService::delete(&test_db.pool, "non-existent-id").await;

        assert!(result.is_err());
        match result.unwrap_err() {
            ServiceError::NotFound { entity, .. } => {
                assert_eq!(entity, "ExecutorProfile");
            }
            other => panic!("Expected NotFound error, got: {:?}", other),
        }
    }

    #[tokio::test]
    async fn test_get_default_executor_profile() {
        let test_db = setup_test_db().await;

        // No default profile initially
        let default = ExecutorProfileService::get_default(&test_db.pool)
            .await
            .expect("Failed to get default executor profile");
        assert!(default.is_none());

        // Create a default profile
        let request = CreateExecutorProfileRequest {
            name: "Default Profile".to_string(),
            command: "claude".to_string(),
            args: None,
            env: None,
            model: None,
            is_default: Some(true),
        };
        ExecutorProfileService::create(&test_db.pool, request)
            .await
            .expect("Failed to create executor profile");

        // Should now have a default
        let default = ExecutorProfileService::get_default(&test_db.pool)
            .await
            .expect("Failed to get default executor profile");
        assert!(default.is_some());
        assert_eq!(default.unwrap().name, "Default Profile");
    }

    #[tokio::test]
    async fn test_only_one_default_profile() {
        let test_db = setup_test_db().await;

        // Create first default profile
        let request1 = CreateExecutorProfileRequest {
            name: "First Default".to_string(),
            command: "claude".to_string(),
            args: None,
            env: None,
            model: None,
            is_default: Some(true),
        };
        let first = ExecutorProfileService::create(&test_db.pool, request1)
            .await
            .expect("Failed to create first profile");
        assert!(first.is_default);

        // Create second default profile - should clear first's default
        let request2 = CreateExecutorProfileRequest {
            name: "Second Default".to_string(),
            command: "gemini".to_string(),
            args: None,
            env: None,
            model: None,
            is_default: Some(true),
        };
        let second = ExecutorProfileService::create(&test_db.pool, request2)
            .await
            .expect("Failed to create second profile");
        assert!(second.is_default);

        // First profile should no longer be default
        let first_updated = ExecutorProfileService::get(&test_db.pool, &first.id)
            .await
            .expect("Failed to get first profile");
        assert!(!first_updated.is_default);

        // Only one default
        let default = ExecutorProfileService::get_default(&test_db.pool)
            .await
            .expect("Failed to get default");
        assert_eq!(default.unwrap().name, "Second Default");
    }

    #[tokio::test]
    async fn test_update_sets_default_clears_others() {
        let test_db = setup_test_db().await;

        // Create a default profile
        let request1 = CreateExecutorProfileRequest {
            name: "Original Default".to_string(),
            command: "claude".to_string(),
            args: None,
            env: None,
            model: None,
            is_default: Some(true),
        };
        let first = ExecutorProfileService::create(&test_db.pool, request1)
            .await
            .expect("Failed to create first profile");

        // Create a non-default profile
        let request2 = test_create_request("Non Default", "gemini");
        let second = ExecutorProfileService::create(&test_db.pool, request2)
            .await
            .expect("Failed to create second profile");
        assert!(!second.is_default);

        // Update second to be default
        let update_request = UpdateExecutorProfileRequest {
            name: None,
            command: None,
            args: None,
            env: None,
            model: None,
            is_default: Some(true),
        };
        let second_updated = ExecutorProfileService::update(&test_db.pool, &second.id, update_request)
            .await
            .expect("Failed to update second profile");
        assert!(second_updated.is_default);

        // First should no longer be default
        let first_updated = ExecutorProfileService::get(&test_db.pool, &first.id)
            .await
            .expect("Failed to get first profile");
        assert!(!first_updated.is_default);

        // Only one default
        let default = ExecutorProfileService::get_default(&test_db.pool)
            .await
            .expect("Failed to get default");
        assert_eq!(default.unwrap().id, second.id);
    }
}
