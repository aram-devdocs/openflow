//! Settings management service.
//!
//! Handles application settings storage and retrieval using a simple key-value store.
//! Settings are persisted in the `app_settings` table.
//!
//! ## Logging
//!
//! This service uses structured logging at appropriate levels:
//! - `debug!` - For query parameters, cache lookups, and internal operations
//! - `info!` - For successful operations (set, delete) with key context
//! - `warn!` - For expected issues (key not found on delete)
//! - `error!` - For database failures and unexpected errors
//!
//! **Security**: Setting values are NOT logged to avoid leaking sensitive data.
//! Only keys and value lengths are logged.
//!
//! ## Error Handling
//!
//! All functions return `ServiceResult<T>` with proper error context.
//! Database errors are propagated via the `?` operator with sqlx error conversion.

use std::collections::HashMap;

use log::{debug, error, info, warn};
use sqlx::SqlitePool;

use super::{ServiceError, ServiceResult};

/// Service for managing application settings.
pub struct SettingsService;

impl SettingsService {
    /// Get a setting by key.
    ///
    /// Returns `None` if the key doesn't exist.
    pub async fn get(pool: &SqlitePool, key: &str) -> ServiceResult<Option<String>> {
        debug!("Getting setting: key={}", key);

        let result = sqlx::query_scalar::<_, String>(
            r#"
            SELECT value
            FROM app_settings
            WHERE key = ?
            "#,
        )
        .bind(key)
        .fetch_optional(pool)
        .await
        .map_err(|e| {
            error!("Failed to get setting: key={}, error={}", key, e);
            e
        })?;

        debug!(
            "Setting fetch result: key={}, found={}, value_length={}",
            key,
            result.is_some(),
            result.as_ref().map(|v| v.len()).unwrap_or(0)
        );

        Ok(result)
    }

    /// Set a setting value.
    ///
    /// If the key already exists, the value is updated.
    /// If the key doesn't exist, a new setting is created.
    pub async fn set(pool: &SqlitePool, key: &str, value: &str) -> ServiceResult<()> {
        debug!("Setting value: key={}, value_length={}", key, value.len());

        sqlx::query(
            r#"
            INSERT INTO app_settings (key, value)
            VALUES (?, ?)
            ON CONFLICT(key) DO UPDATE SET
                value = excluded.value,
                updated_at = datetime('now', 'subsec')
            "#,
        )
        .bind(key)
        .bind(value)
        .execute(pool)
        .await
        .map_err(|e| {
            error!(
                "Failed to set setting: key={}, value_length={}, error={}",
                key,
                value.len(),
                e
            );
            e
        })?;

        info!("Setting saved: key={}, value_length={}", key, value.len());

        Ok(())
    }

    /// Get all settings as a map.
    ///
    /// Returns an empty map if no settings exist.
    pub async fn get_all(pool: &SqlitePool) -> ServiceResult<HashMap<String, String>> {
        debug!("Getting all settings");

        let rows = sqlx::query_as::<_, (String, String)>(
            r#"
            SELECT key, value
            FROM app_settings
            ORDER BY key ASC
            "#,
        )
        .fetch_all(pool)
        .await
        .map_err(|e| {
            error!("Failed to get all settings: error={}", e);
            e
        })?;

        let settings: HashMap<String, String> = rows.into_iter().collect();

        debug!(
            "Retrieved all settings: count={}, keys={:?}",
            settings.len(),
            settings.keys().collect::<Vec<_>>()
        );

        Ok(settings)
    }

    /// Delete a setting by key.
    ///
    /// Returns an error if the key doesn't exist.
    pub async fn delete(pool: &SqlitePool, key: &str) -> ServiceResult<()> {
        debug!("Deleting setting: key={}", key);

        // Check if the key exists first
        let exists = Self::get(pool, key).await?;
        if exists.is_none() {
            warn!("Setting not found for deletion: key={}", key);
            return Err(ServiceError::NotFound {
                entity: "Setting",
                id: key.to_string(),
            });
        }

        sqlx::query("DELETE FROM app_settings WHERE key = ?")
            .bind(key)
            .execute(pool)
            .await
            .map_err(|e| {
                error!("Failed to delete setting: key={}, error={}", key, e);
                e
            })?;

        info!("Setting deleted: key={}", key);

        Ok(())
    }

    /// Get a setting with a default value.
    ///
    /// Returns the default if the key doesn't exist.
    pub async fn get_or_default(
        pool: &SqlitePool,
        key: &str,
        default: &str,
    ) -> ServiceResult<String> {
        debug!(
            "Getting setting with default: key={}, default_length={}",
            key,
            default.len()
        );

        let result = Self::get(pool, key).await?;

        let (value, used_default) = match result {
            Some(v) => (v, false),
            None => (default.to_string(), true),
        };

        debug!(
            "Setting result: key={}, used_default={}, value_length={}",
            key,
            used_default,
            value.len()
        );

        Ok(value)
    }

    /// Check if a setting exists.
    pub async fn exists(pool: &SqlitePool, key: &str) -> ServiceResult<bool> {
        debug!("Checking setting existence: key={}", key);

        let result = Self::get(pool, key).await?;
        let exists = result.is_some();

        debug!("Setting existence check: key={}, exists={}", key, exists);

        Ok(exists)
    }

    /// Delete all settings.
    ///
    /// Use with caution - this removes all application settings.
    pub async fn delete_all(pool: &SqlitePool) -> ServiceResult<u64> {
        warn!("Deleting ALL settings - this action cannot be undone");

        let result = sqlx::query("DELETE FROM app_settings")
            .execute(pool)
            .await
            .map_err(|e| {
                error!("Failed to delete all settings: error={}", e);
                e
            })?;

        let deleted_count = result.rows_affected();

        info!("All settings deleted: count={}", deleted_count);

        Ok(deleted_count)
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

    #[tokio::test]
    async fn test_get_nonexistent_setting() {
        let test_db = setup_test_db().await;

        let result = SettingsService::get(&test_db.pool, "nonexistent_key")
            .await
            .expect("Failed to get setting");

        assert!(result.is_none());
    }

    #[tokio::test]
    async fn test_set_and_get_setting() {
        let test_db = setup_test_db().await;

        // Set a setting
        SettingsService::set(&test_db.pool, "theme", "dark")
            .await
            .expect("Failed to set setting");

        // Get the setting
        let result = SettingsService::get(&test_db.pool, "theme")
            .await
            .expect("Failed to get setting");

        assert_eq!(result, Some("dark".to_string()));
    }

    #[tokio::test]
    async fn test_set_updates_existing_setting() {
        let test_db = setup_test_db().await;

        // Set initial value
        SettingsService::set(&test_db.pool, "language", "en")
            .await
            .expect("Failed to set setting");

        // Update the value
        SettingsService::set(&test_db.pool, "language", "es")
            .await
            .expect("Failed to update setting");

        // Verify the update
        let result = SettingsService::get(&test_db.pool, "language")
            .await
            .expect("Failed to get setting");

        assert_eq!(result, Some("es".to_string()));
    }

    #[tokio::test]
    async fn test_get_all_empty() {
        let test_db = setup_test_db().await;

        let settings = SettingsService::get_all(&test_db.pool)
            .await
            .expect("Failed to get all settings");

        assert!(settings.is_empty());
    }

    #[tokio::test]
    async fn test_get_all_with_settings() {
        let test_db = setup_test_db().await;

        // Set multiple settings
        SettingsService::set(&test_db.pool, "theme", "dark")
            .await
            .expect("Failed to set theme");
        SettingsService::set(&test_db.pool, "language", "en")
            .await
            .expect("Failed to set language");
        SettingsService::set(&test_db.pool, "auto_save", "true")
            .await
            .expect("Failed to set auto_save");

        // Get all settings
        let settings = SettingsService::get_all(&test_db.pool)
            .await
            .expect("Failed to get all settings");

        assert_eq!(settings.len(), 3);
        assert_eq!(settings.get("theme"), Some(&"dark".to_string()));
        assert_eq!(settings.get("language"), Some(&"en".to_string()));
        assert_eq!(settings.get("auto_save"), Some(&"true".to_string()));
    }

    #[tokio::test]
    async fn test_delete_setting() {
        let test_db = setup_test_db().await;

        // Set a setting
        SettingsService::set(&test_db.pool, "to_delete", "value")
            .await
            .expect("Failed to set setting");

        // Verify it exists
        let exists = SettingsService::get(&test_db.pool, "to_delete")
            .await
            .expect("Failed to get setting");
        assert!(exists.is_some());

        // Delete it
        SettingsService::delete(&test_db.pool, "to_delete")
            .await
            .expect("Failed to delete setting");

        // Verify it's gone
        let result = SettingsService::get(&test_db.pool, "to_delete")
            .await
            .expect("Failed to get setting");
        assert!(result.is_none());
    }

    #[tokio::test]
    async fn test_delete_nonexistent_setting() {
        let test_db = setup_test_db().await;

        let result = SettingsService::delete(&test_db.pool, "nonexistent_key").await;

        assert!(result.is_err());
        match result.unwrap_err() {
            ServiceError::NotFound { entity, id } => {
                assert_eq!(entity, "Setting");
                assert_eq!(id, "nonexistent_key");
            }
            other => panic!("Expected NotFound error, got: {:?}", other),
        }
    }

    #[tokio::test]
    async fn test_get_or_default_with_existing() {
        let test_db = setup_test_db().await;

        // Set a setting
        SettingsService::set(&test_db.pool, "existing", "actual_value")
            .await
            .expect("Failed to set setting");

        // Get with default should return the actual value
        let result = SettingsService::get_or_default(&test_db.pool, "existing", "default_value")
            .await
            .expect("Failed to get setting");

        assert_eq!(result, "actual_value");
    }

    #[tokio::test]
    async fn test_get_or_default_with_nonexistent() {
        let test_db = setup_test_db().await;

        // Get nonexistent key with default
        let result = SettingsService::get_or_default(&test_db.pool, "nonexistent", "default_value")
            .await
            .expect("Failed to get setting");

        assert_eq!(result, "default_value");
    }

    #[tokio::test]
    async fn test_exists() {
        let test_db = setup_test_db().await;

        // Check nonexistent key
        let exists = SettingsService::exists(&test_db.pool, "test_key")
            .await
            .expect("Failed to check existence");
        assert!(!exists);

        // Set the key
        SettingsService::set(&test_db.pool, "test_key", "value")
            .await
            .expect("Failed to set setting");

        // Check existing key
        let exists = SettingsService::exists(&test_db.pool, "test_key")
            .await
            .expect("Failed to check existence");
        assert!(exists);
    }

    #[tokio::test]
    async fn test_delete_all() {
        let test_db = setup_test_db().await;

        // Set multiple settings
        SettingsService::set(&test_db.pool, "key1", "value1")
            .await
            .expect("Failed to set key1");
        SettingsService::set(&test_db.pool, "key2", "value2")
            .await
            .expect("Failed to set key2");
        SettingsService::set(&test_db.pool, "key3", "value3")
            .await
            .expect("Failed to set key3");

        // Verify they exist
        let settings = SettingsService::get_all(&test_db.pool)
            .await
            .expect("Failed to get all settings");
        assert_eq!(settings.len(), 3);

        // Delete all
        let deleted_count = SettingsService::delete_all(&test_db.pool)
            .await
            .expect("Failed to delete all settings");
        assert_eq!(deleted_count, 3);

        // Verify they're gone
        let settings = SettingsService::get_all(&test_db.pool)
            .await
            .expect("Failed to get all settings");
        assert!(settings.is_empty());
    }

    #[tokio::test]
    async fn test_set_empty_value() {
        let test_db = setup_test_db().await;

        // Set an empty value
        SettingsService::set(&test_db.pool, "empty_key", "")
            .await
            .expect("Failed to set empty value");

        // Get the setting
        let result = SettingsService::get(&test_db.pool, "empty_key")
            .await
            .expect("Failed to get setting");

        assert_eq!(result, Some("".to_string()));
    }

    #[tokio::test]
    async fn test_set_value_with_special_characters() {
        let test_db = setup_test_db().await;

        // Set a value with special characters
        let special_value = r#"{"key": "value", "array": [1, 2, 3]}"#;
        SettingsService::set(&test_db.pool, "json_config", special_value)
            .await
            .expect("Failed to set JSON value");

        // Get the setting
        let result = SettingsService::get(&test_db.pool, "json_config")
            .await
            .expect("Failed to get setting");

        assert_eq!(result, Some(special_value.to_string()));
    }

    #[tokio::test]
    async fn test_key_with_special_characters() {
        let test_db = setup_test_db().await;

        // Set a key with special characters (dots, underscores, hyphens)
        SettingsService::set(&test_db.pool, "app.theme.color-mode_v2", "dark")
            .await
            .expect("Failed to set setting with special key");

        // Get the setting
        let result = SettingsService::get(&test_db.pool, "app.theme.color-mode_v2")
            .await
            .expect("Failed to get setting");

        assert_eq!(result, Some("dark".to_string()));
    }
}
