//! Tauri commands for settings operations.
//!
//! These commands provide the IPC interface for application settings.
//! Each command is a thin wrapper around SettingsService methods.
//!
//! Settings are stored as key-value pairs in the database and can be used
//! for user preferences, application configuration, and feature flags.

use std::collections::HashMap;

use tauri::State;

use crate::commands::AppState;
use crate::services::SettingsService;

/// Get a setting by key.
///
/// Returns the value if the key exists, or None if it doesn't.
#[tauri::command]
pub async fn get_setting(
    state: State<'_, AppState>,
    key: String,
) -> Result<Option<String>, String> {
    let pool = state.db.lock().await;
    SettingsService::get(&pool, &key)
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
    SettingsService::set(&pool, &key, &value)
        .await
        .map_err(|e| e.to_string())
}

/// Get all settings as a map.
///
/// Returns all settings as a key-value map, or an empty map if no settings exist.
#[tauri::command]
pub async fn get_all_settings(
    state: State<'_, AppState>,
) -> Result<HashMap<String, String>, String> {
    let pool = state.db.lock().await;
    SettingsService::get_all(&pool)
        .await
        .map_err(|e| e.to_string())
}

/// Delete a setting by key.
///
/// Returns an error if the key doesn't exist.
#[tauri::command]
pub async fn delete_setting(
    state: State<'_, AppState>,
    key: String,
) -> Result<(), String> {
    let pool = state.db.lock().await;
    SettingsService::delete(&pool, &key)
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
    SettingsService::get_or_default(&pool, &key, &default)
        .await
        .map_err(|e| e.to_string())
}

/// Check if a setting exists.
///
/// Returns true if the key exists, false otherwise.
#[tauri::command]
pub async fn setting_exists(
    state: State<'_, AppState>,
    key: String,
) -> Result<bool, String> {
    let pool = state.db.lock().await;
    SettingsService::exists(&pool, &key)
        .await
        .map_err(|e| e.to_string())
}
