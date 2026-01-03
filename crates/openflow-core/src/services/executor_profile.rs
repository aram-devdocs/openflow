//! Executor profile management service.
//!
//! Handles CRUD operations for executor profiles (CLI tool configurations).
//! Manages the is_default constraint ensuring only one profile is default at a time.
//!
//! # Logging
//!
//! This service uses the `log` crate for structured logging:
//! - `debug!`: Detailed operation tracing (query params, internal steps)
//! - `info!`: Successful operations (create, update, delete, set default)
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

use openflow_contracts::{
    CreateExecutorProfileRequest, ExecutorProfile, UpdateExecutorProfileRequest,
};

use super::{ServiceError, ServiceResult};

/// List all executor profiles ordered by name.
///
/// # Arguments
/// * `pool` - Database connection pool
///
/// Returns all profiles ordered alphabetically by name.
pub async fn list(pool: &SqlitePool) -> ServiceResult<Vec<ExecutorProfile>> {
    debug!("Listing all executor profiles");

    let profiles = sqlx::query_as::<_, ExecutorProfile>(
        r#"
        SELECT
            id,
            name,
            description,
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
    .await
    .map_err(|e| {
        error!("Failed to list executor profiles: {}", e);
        ServiceError::Database(e)
    })?;

    debug!("Found {} executor profiles", profiles.len());
    Ok(profiles)
}

/// Get an executor profile by ID.
///
/// # Arguments
/// * `pool` - Database connection pool
/// * `id` - Profile ID to fetch
///
/// Returns the profile if found, or `ServiceError::NotFound`.
pub async fn get(pool: &SqlitePool, id: &str) -> ServiceResult<ExecutorProfile> {
    debug!("Getting executor profile id={}", id);

    let profile = sqlx::query_as::<_, ExecutorProfile>(
        r#"
        SELECT
            id,
            name,
            description,
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
    .await
    .map_err(|e| {
        error!(
            "Database error while fetching executor profile id={}: {}",
            id, e
        );
        ServiceError::Database(e)
    })?
    .ok_or_else(|| {
        debug!("Executor profile not found: id={}", id);
        ServiceError::not_found("ExecutorProfile", id)
    })?;

    debug!("Found executor profile id={}, name={}", id, profile.name);
    Ok(profile)
}

/// Create a new executor profile.
///
/// If is_default is true, clears default from all other profiles first
/// to ensure only one profile is marked as default.
///
/// # Arguments
/// * `pool` - Database connection pool
/// * `request` - Profile creation request
///
/// Returns the created profile.
pub async fn create(
    pool: &SqlitePool,
    request: CreateExecutorProfileRequest,
) -> ServiceResult<ExecutorProfile> {
    let id = Uuid::new_v4().to_string();
    let is_default = request.is_default.unwrap_or(false);

    debug!(
        "Creating executor profile: id={}, name={}, command={}, is_default={}",
        id, request.name, request.command, is_default
    );

    // If this profile should be default, clear default from all others
    if is_default {
        debug!("New profile will be default, clearing existing defaults");
        clear_all_defaults(pool).await?;
    }

    sqlx::query(
        r#"
        INSERT INTO executor_profiles (
            id, name, description, command, args, env, model, is_default
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        "#,
    )
    .bind(&id)
    .bind(&request.name)
    .bind(&request.description)
    .bind(&request.command)
    .bind(&request.args)
    .bind(&request.env)
    .bind(&request.model)
    .bind(is_default)
    .execute(pool)
    .await
    .map_err(|e| {
        error!(
            "Failed to create executor profile: name={}, command={}, error={}",
            request.name, request.command, e
        );
        ServiceError::Database(e)
    })?;

    // Fetch and return the created profile
    let profile = get(pool, &id).await?;

    info!(
        "Created executor profile: id={}, name={}, command={}, is_default={}",
        id, profile.name, profile.command, profile.is_default
    );
    Ok(profile)
}

/// Update an existing executor profile.
///
/// If is_default is set to true and wasn't before, clears default from all
/// other profiles to ensure only one profile is marked as default.
///
/// # Arguments
/// * `pool` - Database connection pool
/// * `id` - Profile ID to update
/// * `request` - Partial update request (None fields preserve existing values)
///
/// Returns the updated profile.
pub async fn update(
    pool: &SqlitePool,
    id: &str,
    request: UpdateExecutorProfileRequest,
) -> ServiceResult<ExecutorProfile> {
    debug!("Updating executor profile id={}", id);

    // Verify the profile exists first
    let existing = get(pool, id).await?;

    // Apply updates, falling back to existing values
    let name = request.name.unwrap_or(existing.name);
    let description = request.description.or(existing.description);
    let command = request.command.unwrap_or(existing.command);
    let args = request.args.or(existing.args);
    let env = request.env.or(existing.env);
    let model = request.model.or(existing.model);
    let is_default = request.is_default.unwrap_or(existing.is_default);

    // If setting this profile as default, clear default from all others
    if is_default && !existing.is_default {
        debug!(
            "Profile id={} being set as default, clearing existing defaults",
            id
        );
        clear_all_defaults(pool).await?;
    }

    sqlx::query(
        r#"
        UPDATE executor_profiles
        SET
            name = ?,
            description = ?,
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
    .bind(&description)
    .bind(&command)
    .bind(&args)
    .bind(&env)
    .bind(&model)
    .bind(is_default)
    .bind(id)
    .execute(pool)
    .await
    .map_err(|e| {
        error!("Failed to update executor profile id={}: {}", id, e);
        ServiceError::Database(e)
    })?;

    let profile = get(pool, id).await?;

    info!(
        "Updated executor profile: id={}, name={}, is_default={}",
        id, profile.name, profile.is_default
    );
    Ok(profile)
}

/// Delete an executor profile by ID.
///
/// # Arguments
/// * `pool` - Database connection pool
/// * `id` - Profile ID to delete
///
/// Returns `Ok(())` on success, or `ServiceError::NotFound` if profile doesn't exist.
pub async fn delete(pool: &SqlitePool, id: &str) -> ServiceResult<()> {
    debug!("Deleting executor profile id={}", id);

    // Verify the profile exists first and get details for logging
    let existing = get(pool, id).await?;

    sqlx::query("DELETE FROM executor_profiles WHERE id = ?")
        .bind(id)
        .execute(pool)
        .await
        .map_err(|e| {
            error!("Failed to delete executor profile id={}: {}", id, e);
            ServiceError::Database(e)
        })?;

    info!(
        "Deleted executor profile: id={}, name={}",
        id, existing.name
    );
    Ok(())
}

/// Get the default executor profile.
///
/// # Arguments
/// * `pool` - Database connection pool
///
/// Returns the default profile if one exists, or `None`.
pub async fn get_default(pool: &SqlitePool) -> ServiceResult<Option<ExecutorProfile>> {
    debug!("Getting default executor profile");

    let profile = sqlx::query_as::<_, ExecutorProfile>(
        r#"
        SELECT
            id,
            name,
            description,
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
    .await
    .map_err(|e| {
        error!("Failed to get default executor profile: {}", e);
        ServiceError::Database(e)
    })?;

    match &profile {
        Some(p) => debug!(
            "Found default executor profile: id={}, name={}",
            p.id, p.name
        ),
        None => debug!("No default executor profile found"),
    }

    Ok(profile)
}

/// Clear the is_default flag from all profiles.
///
/// Internal helper used when setting a new default profile.
async fn clear_all_defaults(pool: &SqlitePool) -> ServiceResult<()> {
    debug!("Clearing is_default from all executor profiles");

    let result = sqlx::query(
        r#"
        UPDATE executor_profiles
        SET is_default = FALSE, updated_at = datetime('now', 'subsec')
        WHERE is_default = TRUE
        "#,
    )
    .execute(pool)
    .await
    .map_err(|e| {
        error!("Failed to clear default executor profiles: {}", e);
        ServiceError::Database(e)
    })?;

    debug!(
        "Cleared is_default from {} executor profiles",
        result.rows_affected()
    );
    Ok(())
}

/// Seed the default Claude Code executor profile if no profiles exist.
///
/// This ensures there's always at least one executor profile available
/// for running AI coding CLI tools. Called during application initialization.
///
/// # Arguments
/// * `pool` - Database connection pool
///
/// Returns `Ok(())` whether a profile was created or already existed.
pub async fn seed_default_profile(pool: &SqlitePool) -> ServiceResult<()> {
    debug!("Checking if default executor profile needs to be seeded");

    // Check if any profiles exist
    let count: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM executor_profiles")
        .fetch_one(pool)
        .await
        .map_err(|e| {
            error!("Failed to count executor profiles: {}", e);
            ServiceError::Database(e)
        })?;

    if count == 0 {
        debug!("No executor profiles exist, creating default Claude Code profile");

        // Create the default Claude Code profile
        let request = CreateExecutorProfileRequest {
            name: "Claude Code".to_string(),
            description: Some("Anthropic's Claude Code CLI for AI-assisted coding".to_string()),
            command: "claude".to_string(),
            args: None,
            env: None,
            model: None,
            is_default: Some(true),
        };

        create(pool, request).await?;
        info!("Seeded default Claude Code executor profile");
    } else {
        debug!("Found {} existing executor profiles, skipping seed", count);
    }

    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use openflow_db::create_test_db;

    /// Helper to create a test executor profile request.
    fn test_create_request(name: &str, command: &str) -> CreateExecutorProfileRequest {
        CreateExecutorProfileRequest {
            name: name.to_string(),
            description: None,
            command: command.to_string(),
            args: None,
            env: None,
            model: None,
            is_default: None,
        }
    }

    #[tokio::test]
    async fn test_create_executor_profile() {
        let pool = create_test_db().await.expect("Failed to create test db");

        let request = test_create_request("Claude Code", "claude");
        let profile = create(&pool, request)
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
        let pool = create_test_db().await.expect("Failed to create test db");

        let request = CreateExecutorProfileRequest {
            name: "Claude Code Pro".to_string(),
            description: Some("Pro version of Claude Code".to_string()),
            command: "claude".to_string(),
            args: Some(r#"["--verbose", "--no-confirm"]"#.to_string()),
            env: Some(r#"{"ANTHROPIC_API_KEY": "test"}"#.to_string()),
            model: Some("claude-3-opus".to_string()),
            is_default: Some(true),
        };

        let profile = create(&pool, request)
            .await
            .expect("Failed to create executor profile");

        assert_eq!(profile.name, "Claude Code Pro");
        assert_eq!(profile.command, "claude");
        assert!(profile.is_default);
        assert_eq!(
            profile.args,
            Some(r#"["--verbose", "--no-confirm"]"#.to_string())
        );
        assert_eq!(
            profile.env,
            Some(r#"{"ANTHROPIC_API_KEY": "test"}"#.to_string())
        );
        assert_eq!(profile.model, Some("claude-3-opus".to_string()));
    }

    #[tokio::test]
    async fn test_get_executor_profile() {
        let pool = create_test_db().await.expect("Failed to create test db");

        // Create a profile first
        let request = test_create_request("Get Test", "gemini");
        let created = create(&pool, request)
            .await
            .expect("Failed to create executor profile");

        // Get the profile
        let fetched = get(&pool, &created.id)
            .await
            .expect("Failed to get executor profile");

        assert_eq!(fetched.id, created.id);
        assert_eq!(fetched.name, "Get Test");
        assert_eq!(fetched.command, "gemini");
    }

    #[tokio::test]
    async fn test_get_executor_profile_not_found() {
        let pool = create_test_db().await.expect("Failed to create test db");

        let result = get(&pool, "non-existent-id").await;

        assert!(result.is_err());
        assert!(result.unwrap_err().is_not_found());
    }

    #[tokio::test]
    async fn test_list_executor_profiles() {
        let pool = create_test_db().await.expect("Failed to create test db");

        // Start with empty list
        let profiles = list(&pool).await.expect("Failed to list executor profiles");
        assert_eq!(profiles.len(), 0);

        // Create profiles
        let request1 = test_create_request("Gemini CLI", "gemini");
        let request2 = test_create_request("Cursor CLI", "cursor");
        let request3 = test_create_request("Claude Code", "claude");

        create(&pool, request1).await.unwrap();
        create(&pool, request2).await.unwrap();
        create(&pool, request3).await.unwrap();

        // List should return all profiles ordered by name
        let profiles = list(&pool).await.expect("Failed to list executor profiles");

        assert_eq!(profiles.len(), 3);
        assert_eq!(profiles[0].name, "Claude Code");
        assert_eq!(profiles[1].name, "Cursor CLI");
        assert_eq!(profiles[2].name, "Gemini CLI");
    }

    #[tokio::test]
    async fn test_update_executor_profile() {
        let pool = create_test_db().await.expect("Failed to create test db");

        // Create a profile
        let request = test_create_request("Original Name", "original");
        let created = create(&pool, request)
            .await
            .expect("Failed to create executor profile");

        // Wait a small amount to ensure updated_at will be different
        tokio::time::sleep(std::time::Duration::from_millis(10)).await;

        // Update partial fields
        let update_request = UpdateExecutorProfileRequest {
            name: Some("Updated Name".to_string()),
            description: None,
            command: None, // Keep original
            args: Some(r#"["--flag"]"#.to_string()),
            env: None,
            model: Some("new-model".to_string()),
            is_default: None,
        };

        let updated = update(&pool, &created.id, update_request)
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
        let pool = create_test_db().await.expect("Failed to create test db");

        let update_request = UpdateExecutorProfileRequest {
            name: Some("New Name".to_string()),
            description: None,
            command: None,
            args: None,
            env: None,
            model: None,
            is_default: None,
        };

        let result = update(&pool, "non-existent-id", update_request).await;

        assert!(result.is_err());
        assert!(result.unwrap_err().is_not_found());
    }

    #[tokio::test]
    async fn test_delete_executor_profile() {
        let pool = create_test_db().await.expect("Failed to create test db");

        // Create a profile
        let request = test_create_request("To Delete", "delete");
        let created = create(&pool, request)
            .await
            .expect("Failed to create executor profile");

        // Verify it exists
        let fetched = get(&pool, &created.id).await;
        assert!(fetched.is_ok());

        // Delete it
        delete(&pool, &created.id)
            .await
            .expect("Failed to delete executor profile");

        // Verify it's gone
        let result = get(&pool, &created.id).await;
        assert!(result.is_err());
        assert!(result.unwrap_err().is_not_found());
    }

    #[tokio::test]
    async fn test_delete_executor_profile_not_found() {
        let pool = create_test_db().await.expect("Failed to create test db");

        let result = delete(&pool, "non-existent-id").await;

        assert!(result.is_err());
        assert!(result.unwrap_err().is_not_found());
    }

    #[tokio::test]
    async fn test_get_default_executor_profile_none() {
        let pool = create_test_db().await.expect("Failed to create test db");

        // No profiles exist yet
        let default = get_default(&pool)
            .await
            .expect("Failed to get default executor profile");
        assert!(default.is_none());
    }

    #[tokio::test]
    async fn test_get_default_executor_profile() {
        let pool = create_test_db().await.expect("Failed to create test db");

        // Create a default profile
        let request = CreateExecutorProfileRequest {
            name: "Default Profile".to_string(),
            description: None,
            command: "default-cmd".to_string(),
            args: None,
            env: None,
            model: None,
            is_default: Some(true),
        };
        create(&pool, request)
            .await
            .expect("Failed to create executor profile");

        let default = get_default(&pool)
            .await
            .expect("Failed to get default executor profile");
        assert!(default.is_some());
        assert_eq!(default.unwrap().name, "Default Profile");
    }

    #[tokio::test]
    async fn test_only_one_default_profile() {
        let pool = create_test_db().await.expect("Failed to create test db");

        // Create first default profile
        let request1 = CreateExecutorProfileRequest {
            name: "First Default".to_string(),
            description: None,
            command: "claude".to_string(),
            args: None,
            env: None,
            model: None,
            is_default: Some(true),
        };
        let first = create(&pool, request1)
            .await
            .expect("Failed to create first profile");
        assert!(first.is_default);

        // Create second default profile - should clear first's default
        let request2 = CreateExecutorProfileRequest {
            name: "Second Default".to_string(),
            description: None,
            command: "gemini".to_string(),
            args: None,
            env: None,
            model: None,
            is_default: Some(true),
        };
        let second = create(&pool, request2)
            .await
            .expect("Failed to create second profile");
        assert!(second.is_default);

        // First profile should no longer be default
        let first_updated = get(&pool, &first.id)
            .await
            .expect("Failed to get first profile");
        assert!(!first_updated.is_default);

        // Only one default
        let default = get_default(&pool).await.expect("Failed to get default");
        assert_eq!(default.unwrap().name, "Second Default");
    }

    #[tokio::test]
    async fn test_update_sets_default_clears_others() {
        let pool = create_test_db().await.expect("Failed to create test db");

        // Create a default profile
        let request1 = CreateExecutorProfileRequest {
            name: "Original Default".to_string(),
            description: None,
            command: "claude".to_string(),
            args: None,
            env: None,
            model: None,
            is_default: Some(true),
        };
        let first = create(&pool, request1)
            .await
            .expect("Failed to create first profile");

        // Create a non-default profile
        let request2 = test_create_request("Non Default", "gemini");
        let second = create(&pool, request2)
            .await
            .expect("Failed to create second profile");
        assert!(!second.is_default);

        // Update second to be default
        let update_request = UpdateExecutorProfileRequest {
            name: None,
            description: None,
            command: None,
            args: None,
            env: None,
            model: None,
            is_default: Some(true),
        };
        let second_updated = update(&pool, &second.id, update_request)
            .await
            .expect("Failed to update second profile");
        assert!(second_updated.is_default);

        // First should no longer be default
        let first_updated = get(&pool, &first.id)
            .await
            .expect("Failed to get first profile");
        assert!(!first_updated.is_default);

        // Only one default
        let default = get_default(&pool).await.expect("Failed to get default");
        assert_eq!(default.unwrap().id, second.id);
    }

    #[tokio::test]
    async fn test_seed_default_profile_when_empty() {
        let pool = create_test_db().await.expect("Failed to create test db");

        // No profiles exist
        let profiles = list(&pool).await.expect("Failed to list");
        assert_eq!(profiles.len(), 0);

        // Seed should create default profile
        seed_default_profile(&pool).await.expect("Failed to seed");

        // Should now have one profile
        let profiles = list(&pool).await.expect("Failed to list");
        assert_eq!(profiles.len(), 1);
        assert_eq!(profiles[0].name, "Claude Code");
        assert!(profiles[0].is_default);
    }

    #[tokio::test]
    async fn test_seed_default_profile_when_exists() {
        let pool = create_test_db().await.expect("Failed to create test db");

        // Create an existing profile
        let request = test_create_request("Existing", "existing");
        create(&pool, request).await.expect("Failed to create");

        // Seed should not create another
        seed_default_profile(&pool).await.expect("Failed to seed");

        // Should still have just one profile
        let profiles = list(&pool).await.expect("Failed to list");
        assert_eq!(profiles.len(), 1);
        assert_eq!(profiles[0].name, "Existing");
    }
}
