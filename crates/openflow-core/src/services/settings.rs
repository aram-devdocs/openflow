//! Settings management service.
//!
//! Handles application settings storage and retrieval using a simple key-value store.
//! Settings are persisted in the `app_settings` table.
//!
//! # Logging
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
//! # Error Handling
//!
//! All functions return `ServiceResult<T>` with proper error context.
//! Database errors are propagated via the `?` operator with sqlx error conversion.

use std::collections::HashMap;

use chrono::{DateTime, Utc};
use sqlx::SqlitePool;
use tracing::{debug, error, info, warn};

use openflow_contracts::{Setting, SettingsMap};

use super::{ServiceError, ServiceResult};

/// Get a setting by key.
///
/// Returns `None` if the key doesn't exist.
pub async fn get(pool: &SqlitePool, key: &str) -> ServiceResult<Option<Setting>> {
    debug!(key = %key, "Getting setting");

    let result = sqlx::query_as::<_, (String, String, String)>(
        r#"
        SELECT key, value, updated_at
        FROM app_settings
        WHERE key = ?
        "#,
    )
    .bind(key)
    .fetch_optional(pool)
    .await
    .map_err(|e| {
        error!(key = %key, error = %e, "Failed to get setting");
        e
    })?;

    let setting = result.map(|(key, value, updated_at)| {
        let updated_at = DateTime::parse_from_rfc3339(&updated_at)
            .map(|dt| dt.with_timezone(&Utc))
            .unwrap_or_else(|_| Utc::now());

        Setting {
            key,
            value,
            updated_at,
        }
    });

    debug!(
        key = %key,
        found = setting.is_some(),
        value_length = setting.as_ref().map(|s| s.value.len()).unwrap_or(0),
        "Setting fetch result"
    );

    Ok(setting)
}

/// Get a setting value by key.
///
/// Returns `None` if the key doesn't exist.
/// This is a convenience function that returns just the value string.
pub async fn get_value(pool: &SqlitePool, key: &str) -> ServiceResult<Option<String>> {
    debug!(key = %key, "Getting setting value");

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
        error!(key = %key, error = %e, "Failed to get setting value");
        e
    })?;

    debug!(
        key = %key,
        found = result.is_some(),
        value_length = result.as_ref().map(|v| v.len()).unwrap_or(0),
        "Setting value fetch result"
    );

    Ok(result)
}

/// Set a setting value.
///
/// If the key already exists, the value is updated.
/// If the key doesn't exist, a new setting is created.
pub async fn set(pool: &SqlitePool, key: &str, value: &str) -> ServiceResult<Setting> {
    debug!(key = %key, value_length = value.len(), "Setting value");

    let now = Utc::now();
    let updated_at = now.to_rfc3339();

    sqlx::query(
        r#"
        INSERT INTO app_settings (key, value, updated_at)
        VALUES (?, ?, ?)
        ON CONFLICT(key) DO UPDATE SET
            value = excluded.value,
            updated_at = excluded.updated_at
        "#,
    )
    .bind(key)
    .bind(value)
    .bind(&updated_at)
    .execute(pool)
    .await
    .map_err(|e| {
        error!(
            key = %key,
            value_length = value.len(),
            error = %e,
            "Failed to set setting"
        );
        e
    })?;

    info!(key = %key, value_length = value.len(), "Setting saved");

    Ok(Setting {
        key: key.to_string(),
        value: value.to_string(),
        updated_at: now,
    })
}

/// Get all settings as a map.
///
/// Returns an empty map if no settings exist.
pub async fn get_all(pool: &SqlitePool) -> ServiceResult<SettingsMap> {
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
        error!(error = %e, "Failed to get all settings");
        e
    })?;

    let settings: HashMap<String, String> = rows.into_iter().collect();

    debug!(
        count = settings.len(),
        keys = ?settings.keys().collect::<Vec<_>>(),
        "Retrieved all settings"
    );

    Ok(SettingsMap::from_map(settings))
}

/// Get all settings with a specific prefix.
///
/// Returns an empty map if no matching settings exist.
pub async fn get_by_prefix(pool: &SqlitePool, prefix: &str) -> ServiceResult<SettingsMap> {
    debug!(prefix = %prefix, "Getting settings by prefix");

    let pattern = format!("{}%", prefix);

    let rows = sqlx::query_as::<_, (String, String)>(
        r#"
        SELECT key, value
        FROM app_settings
        WHERE key LIKE ?
        ORDER BY key ASC
        "#,
    )
    .bind(&pattern)
    .fetch_all(pool)
    .await
    .map_err(|e| {
        error!(prefix = %prefix, error = %e, "Failed to get settings by prefix");
        e
    })?;

    let settings: HashMap<String, String> = rows.into_iter().collect();

    debug!(
        prefix = %prefix,
        count = settings.len(),
        "Retrieved settings by prefix"
    );

    Ok(SettingsMap::from_map(settings))
}

/// Delete a setting by key.
///
/// Returns an error if the key doesn't exist.
pub async fn delete(pool: &SqlitePool, key: &str) -> ServiceResult<()> {
    debug!(key = %key, "Deleting setting");

    // Check if the key exists first
    let exists = get_value(pool, key).await?;
    if exists.is_none() {
        warn!(key = %key, "Setting not found for deletion");
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
            error!(key = %key, error = %e, "Failed to delete setting");
            e
        })?;

    info!(key = %key, "Setting deleted");

    Ok(())
}

/// Get a setting with a default value.
///
/// Returns the default if the key doesn't exist.
pub async fn get_or_default(pool: &SqlitePool, key: &str, default: &str) -> ServiceResult<String> {
    debug!(
        key = %key,
        default_length = default.len(),
        "Getting setting with default"
    );

    let result = get_value(pool, key).await?;

    let (value, used_default) = match result {
        Some(v) => (v, false),
        None => (default.to_string(), true),
    };

    debug!(
        key = %key,
        used_default = used_default,
        value_length = value.len(),
        "Setting result"
    );

    Ok(value)
}

/// Check if a setting exists.
pub async fn exists(pool: &SqlitePool, key: &str) -> ServiceResult<bool> {
    debug!(key = %key, "Checking setting existence");

    let result = sqlx::query_scalar::<_, i64>(
        r#"
        SELECT COUNT(*) FROM app_settings WHERE key = ?
        "#,
    )
    .bind(key)
    .fetch_one(pool)
    .await
    .map_err(|e| {
        error!(key = %key, error = %e, "Failed to check setting existence");
        e
    })?;

    let exists = result > 0;

    debug!(key = %key, exists = exists, "Setting existence check");

    Ok(exists)
}

/// Delete all settings.
///
/// Use with caution - this removes all application settings.
/// Returns the number of settings deleted.
pub async fn delete_all(pool: &SqlitePool) -> ServiceResult<u64> {
    warn!("Deleting ALL settings - this action cannot be undone");

    let result = sqlx::query("DELETE FROM app_settings")
        .execute(pool)
        .await
        .map_err(|e| {
            error!(error = %e, "Failed to delete all settings");
            e
        })?;

    let deleted_count = result.rows_affected();

    info!(count = deleted_count, "All settings deleted");

    Ok(deleted_count)
}

/// Set multiple settings at once.
///
/// This is an atomic operation - all settings are set or none are.
pub async fn set_many(pool: &SqlitePool, settings: &[(String, String)]) -> ServiceResult<()> {
    debug!(count = settings.len(), "Setting multiple values");

    if settings.is_empty() {
        return Ok(());
    }

    let now = Utc::now().to_rfc3339();

    // Use a transaction for atomicity
    let mut tx = pool.begin().await.map_err(|e| {
        error!(error = %e, "Failed to begin transaction for set_many");
        e
    })?;

    for (key, value) in settings {
        sqlx::query(
            r#"
            INSERT INTO app_settings (key, value, updated_at)
            VALUES (?, ?, ?)
            ON CONFLICT(key) DO UPDATE SET
                value = excluded.value,
                updated_at = excluded.updated_at
            "#,
        )
        .bind(key)
        .bind(value)
        .bind(&now)
        .execute(&mut *tx)
        .await
        .map_err(|e| {
            error!(key = %key, error = %e, "Failed to set setting in batch");
            e
        })?;
    }

    tx.commit().await.map_err(|e| {
        error!(error = %e, "Failed to commit transaction for set_many");
        e
    })?;

    info!(count = settings.len(), "Batch settings saved");

    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use openflow_db::create_test_db;

    #[tokio::test]
    async fn test_get_nonexistent_setting() {
        let pool = create_test_db().await.unwrap();

        let result = get(&pool, "nonexistent_key").await.unwrap();

        assert!(result.is_none());
    }

    #[tokio::test]
    async fn test_get_value_nonexistent_setting() {
        let pool = create_test_db().await.unwrap();

        let result = get_value(&pool, "nonexistent_key").await.unwrap();

        assert!(result.is_none());
    }

    #[tokio::test]
    async fn test_set_and_get_setting() {
        let pool = create_test_db().await.unwrap();

        // Set a setting
        let setting = set(&pool, "theme", "dark").await.unwrap();
        assert_eq!(setting.key, "theme");
        assert_eq!(setting.value, "dark");

        // Get the setting
        let result = get(&pool, "theme").await.unwrap();
        assert!(result.is_some());
        let setting = result.unwrap();
        assert_eq!(setting.key, "theme");
        assert_eq!(setting.value, "dark");
    }

    #[tokio::test]
    async fn test_set_updates_existing_setting() {
        let pool = create_test_db().await.unwrap();

        // Set initial value
        set(&pool, "language", "en").await.unwrap();

        // Update the value
        set(&pool, "language", "es").await.unwrap();

        // Verify the update
        let result = get_value(&pool, "language").await.unwrap();
        assert_eq!(result, Some("es".to_string()));
    }

    #[tokio::test]
    async fn test_get_all_empty() {
        let pool = create_test_db().await.unwrap();

        let settings = get_all(&pool).await.unwrap();

        assert!(settings.is_empty());
    }

    #[tokio::test]
    async fn test_get_all_with_settings() {
        let pool = create_test_db().await.unwrap();

        // Set multiple settings
        set(&pool, "theme", "dark").await.unwrap();
        set(&pool, "language", "en").await.unwrap();
        set(&pool, "auto_save", "true").await.unwrap();

        // Get all settings
        let settings = get_all(&pool).await.unwrap();

        assert_eq!(settings.len(), 3);
        assert_eq!(settings.get("theme"), Some(&"dark".to_string()));
        assert_eq!(settings.get("language"), Some(&"en".to_string()));
        assert_eq!(settings.get("auto_save"), Some(&"true".to_string()));
    }

    #[tokio::test]
    async fn test_get_by_prefix() {
        let pool = create_test_db().await.unwrap();

        // Set settings with different prefixes
        set(&pool, "app.theme", "dark").await.unwrap();
        set(&pool, "app.language", "en").await.unwrap();
        set(&pool, "user.name", "john").await.unwrap();

        // Get settings with app. prefix
        let settings = get_by_prefix(&pool, "app.").await.unwrap();

        assert_eq!(settings.len(), 2);
        assert_eq!(settings.get("app.theme"), Some(&"dark".to_string()));
        assert_eq!(settings.get("app.language"), Some(&"en".to_string()));
        assert!(settings.get("user.name").is_none());
    }

    #[tokio::test]
    async fn test_delete_setting() {
        let pool = create_test_db().await.unwrap();

        // Set a setting
        set(&pool, "to_delete", "value").await.unwrap();

        // Verify it exists
        let exists = get_value(&pool, "to_delete").await.unwrap();
        assert!(exists.is_some());

        // Delete it
        delete(&pool, "to_delete").await.unwrap();

        // Verify it's gone
        let result = get_value(&pool, "to_delete").await.unwrap();
        assert!(result.is_none());
    }

    #[tokio::test]
    async fn test_delete_nonexistent_setting() {
        let pool = create_test_db().await.unwrap();

        let result = delete(&pool, "nonexistent_key").await;

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
        let pool = create_test_db().await.unwrap();

        // Set a setting
        set(&pool, "existing", "actual_value").await.unwrap();

        // Get with default should return the actual value
        let result = get_or_default(&pool, "existing", "default_value")
            .await
            .unwrap();

        assert_eq!(result, "actual_value");
    }

    #[tokio::test]
    async fn test_get_or_default_with_nonexistent() {
        let pool = create_test_db().await.unwrap();

        // Get nonexistent key with default
        let result = get_or_default(&pool, "nonexistent", "default_value")
            .await
            .unwrap();

        assert_eq!(result, "default_value");
    }

    #[tokio::test]
    async fn test_exists() {
        let pool = create_test_db().await.unwrap();

        // Check nonexistent key
        let result = exists(&pool, "test_key").await.unwrap();
        assert!(!result);

        // Set the key
        set(&pool, "test_key", "value").await.unwrap();

        // Check existing key
        let result = exists(&pool, "test_key").await.unwrap();
        assert!(result);
    }

    #[tokio::test]
    async fn test_delete_all() {
        let pool = create_test_db().await.unwrap();

        // Set multiple settings
        set(&pool, "key1", "value1").await.unwrap();
        set(&pool, "key2", "value2").await.unwrap();
        set(&pool, "key3", "value3").await.unwrap();

        // Verify they exist
        let settings = get_all(&pool).await.unwrap();
        assert_eq!(settings.len(), 3);

        // Delete all
        let deleted_count = delete_all(&pool).await.unwrap();
        assert_eq!(deleted_count, 3);

        // Verify they're gone
        let settings = get_all(&pool).await.unwrap();
        assert!(settings.is_empty());
    }

    #[tokio::test]
    async fn test_set_empty_value() {
        let pool = create_test_db().await.unwrap();

        // Set an empty value
        set(&pool, "empty_key", "").await.unwrap();

        // Get the setting
        let result = get_value(&pool, "empty_key").await.unwrap();

        assert_eq!(result, Some("".to_string()));
    }

    #[tokio::test]
    async fn test_set_value_with_special_characters() {
        let pool = create_test_db().await.unwrap();

        // Set a value with special characters
        let special_value = r#"{"key": "value", "array": [1, 2, 3]}"#;
        set(&pool, "json_config", special_value).await.unwrap();

        // Get the setting
        let result = get_value(&pool, "json_config").await.unwrap();

        assert_eq!(result, Some(special_value.to_string()));
    }

    #[tokio::test]
    async fn test_key_with_special_characters() {
        let pool = create_test_db().await.unwrap();

        // Set a key with special characters (dots, underscores, hyphens)
        set(&pool, "app.theme.color-mode_v2", "dark")
            .await
            .unwrap();

        // Get the setting
        let result = get_value(&pool, "app.theme.color-mode_v2").await.unwrap();

        assert_eq!(result, Some("dark".to_string()));
    }

    #[tokio::test]
    async fn test_set_many() {
        let pool = create_test_db().await.unwrap();

        let settings = vec![
            ("batch.key1".to_string(), "value1".to_string()),
            ("batch.key2".to_string(), "value2".to_string()),
            ("batch.key3".to_string(), "value3".to_string()),
        ];

        set_many(&pool, &settings).await.unwrap();

        // Verify all settings were set
        let all = get_all(&pool).await.unwrap();
        assert_eq!(all.len(), 3);
        assert_eq!(all.get("batch.key1"), Some(&"value1".to_string()));
        assert_eq!(all.get("batch.key2"), Some(&"value2".to_string()));
        assert_eq!(all.get("batch.key3"), Some(&"value3".to_string()));
    }

    #[tokio::test]
    async fn test_set_many_empty() {
        let pool = create_test_db().await.unwrap();

        // Should not error with empty input
        set_many(&pool, &[]).await.unwrap();
    }

    #[tokio::test]
    async fn test_setting_entity_methods() {
        let setting = Setting::new("test", "42");
        assert_eq!(setting.as_i64(), Some(42));
        assert!(!setting.is_empty());

        let bool_setting = Setting::new("flag", "true");
        assert_eq!(bool_setting.as_bool(), Some(true));

        let float_setting = Setting::new("rate", "3.14159265");
        assert!((float_setting.as_f64().unwrap() - std::f64::consts::PI).abs() < 0.0001);
    }

    #[tokio::test]
    async fn test_settings_map_operations() {
        let pool = create_test_db().await.unwrap();

        set(&pool, "a", "1").await.unwrap();
        set(&pool, "b", "2").await.unwrap();

        let map = get_all(&pool).await.unwrap();

        assert!(map.contains("a"));
        assert!(!map.contains("c"));
        assert_eq!(map.keys().count(), 2);
    }
}
