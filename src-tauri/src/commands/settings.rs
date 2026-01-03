//! Tauri commands for settings operations.
//!
//! These commands provide the IPC interface for application settings.
//! Each command is a thin wrapper around openflow_core::services::settings methods.
//!
//! Settings are stored as key-value pairs in the database and can be used
//! for user preferences, application configuration, and feature flags.

use tauri::State;

use crate::commands::AppState;
use openflow_contracts::{Setting, SettingsMap};
use openflow_core::services::settings;

/// Get a setting by key.
///
/// Returns the value if the key exists, or None if it doesn't.
#[tauri::command]
pub async fn get_setting(
    state: State<'_, AppState>,
    key: String,
) -> Result<Option<String>, String> {
    let pool = state.db.lock().await;
    settings::get_value(&pool, &key)
        .await
        .map_err(|e| e.to_string())
}

/// Set a setting value.
///
/// If the key already exists, the value is updated.
/// If the key doesn't exist, a new setting is created.
#[tauri::command]
pub async fn set_setting(
    state: State<'_, AppState>,
    key: String,
    value: String,
) -> Result<(), String> {
    let pool = state.db.lock().await;
    settings::set(&pool, &key, &value)
        .await
        .map(|_| ())
        .map_err(|e| e.to_string())
}

/// Get all settings as a map.
///
/// Returns all settings as a key-value map, or an empty map if no settings exist.
#[tauri::command]
pub async fn get_all_settings(state: State<'_, AppState>) -> Result<SettingsMap, String> {
    let pool = state.db.lock().await;
    settings::get_all(&pool).await.map_err(|e| e.to_string())
}

/// Delete a setting by key.
///
/// Returns an error if the key doesn't exist.
#[tauri::command]
pub async fn delete_setting(state: State<'_, AppState>, key: String) -> Result<(), String> {
    let pool = state.db.lock().await;
    settings::delete(&pool, &key)
        .await
        .map_err(|e| e.to_string())
}

/// Get a setting with a default value.
///
/// Returns the setting value if it exists, or the default value if it doesn't.
/// This does NOT create the setting if it doesn't exist.
#[tauri::command]
pub async fn get_setting_or_default(
    state: State<'_, AppState>,
    key: String,
    default: String,
) -> Result<String, String> {
    let pool = state.db.lock().await;
    settings::get_or_default(&pool, &key, &default)
        .await
        .map_err(|e| e.to_string())
}

/// Check if a setting exists.
///
/// Returns true if the key exists, false otherwise.
#[tauri::command]
pub async fn setting_exists(state: State<'_, AppState>, key: String) -> Result<bool, String> {
    let pool = state.db.lock().await;
    settings::exists(&pool, &key)
        .await
        .map_err(|e| e.to_string())
}

/// Get a full setting entity by key.
///
/// Returns the full Setting (key, value, updated_at) if the key exists, or None if it doesn't.
/// This differs from `get_setting` which only returns the value.
#[tauri::command]
pub async fn get_full_setting(
    state: State<'_, AppState>,
    key: String,
) -> Result<Option<Setting>, String> {
    let pool = state.db.lock().await;
    settings::get(&pool, &key).await.map_err(|e| e.to_string())
}

/// Get settings by key prefix.
///
/// Returns all settings whose keys start with the given prefix.
/// For example, if you have "app.theme", "app.language", "user.name",
/// calling with prefix "app." would return "app.theme" and "app.language".
#[tauri::command]
pub async fn get_settings_by_prefix(
    state: State<'_, AppState>,
    prefix: String,
) -> Result<SettingsMap, String> {
    let pool = state.db.lock().await;
    settings::get_by_prefix(&pool, &prefix)
        .await
        .map_err(|e| e.to_string())
}

/// Delete all settings.
///
/// USE WITH CAUTION: This removes ALL application settings.
/// Returns the number of settings that were deleted.
#[tauri::command]
pub async fn delete_all_settings(state: State<'_, AppState>) -> Result<u64, String> {
    let pool = state.db.lock().await;
    settings::delete_all(&pool).await.map_err(|e| e.to_string())
}

/// Set multiple settings at once.
///
/// This is an atomic operation - all settings are set or none are.
/// Takes a list of [key, value] tuples and sets them all in a single transaction.
#[tauri::command]
pub async fn set_many_settings(
    state: State<'_, AppState>,
    settings_list: Vec<(String, String)>,
) -> Result<(), String> {
    let pool = state.db.lock().await;
    settings::set_many(&pool, &settings_list)
        .await
        .map_err(|e| e.to_string())
}
