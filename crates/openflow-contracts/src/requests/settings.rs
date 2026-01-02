//! Settings Request Types
//!
//! Request types for settings operations.

use serde::{Deserialize, Serialize};
use typeshare::typeshare;

/// Request to get a setting by key
///
/// @endpoint: GET /api/settings/:key
/// @command: get_setting
#[typeshare]
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct GetSettingRequest {
    /// The setting key to retrieve
    /// @validate: required, min_length=1, max_length=255
    pub key: String,
}

impl GetSettingRequest {
    /// Create a new get setting request
    pub fn new(key: impl Into<String>) -> Self {
        Self { key: key.into() }
    }
}

/// Request to set a setting value
///
/// @endpoint: PUT /api/settings/:key
/// @command: set_setting
#[typeshare]
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SetSettingRequest {
    /// The setting key
    /// @validate: required, min_length=1, max_length=255
    pub key: String,

    /// The setting value
    /// @validate: max_length=65535
    pub value: String,
}

impl SetSettingRequest {
    /// Create a new set setting request
    pub fn new(key: impl Into<String>, value: impl Into<String>) -> Self {
        Self {
            key: key.into(),
            value: value.into(),
        }
    }

    /// Create a request to set a JSON value
    pub fn json<T: Serialize>(key: impl Into<String>, value: &T) -> Result<Self, serde_json::Error> {
        Ok(Self {
            key: key.into(),
            value: serde_json::to_string(value)?,
        })
    }

    /// Create a request to set a boolean value
    pub fn bool(key: impl Into<String>, value: bool) -> Self {
        Self {
            key: key.into(),
            value: value.to_string(),
        }
    }

    /// Create a request to set an integer value
    pub fn int(key: impl Into<String>, value: i64) -> Self {
        Self {
            key: key.into(),
            value: value.to_string(),
        }
    }
}

/// Request to delete a setting
///
/// @endpoint: DELETE /api/settings/:key
/// @command: delete_setting
#[typeshare]
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DeleteSettingRequest {
    /// The setting key to delete
    /// @validate: required, min_length=1, max_length=255
    pub key: String,
}

impl DeleteSettingRequest {
    /// Create a new delete setting request
    pub fn new(key: impl Into<String>) -> Self {
        Self { key: key.into() }
    }
}

/// Request to get a setting with a default fallback
///
/// @endpoint: GET /api/settings/:key/default
/// @command: get_setting_or_default
#[typeshare]
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct GetSettingOrDefaultRequest {
    /// The setting key to retrieve
    /// @validate: required, min_length=1, max_length=255
    pub key: String,

    /// The default value if the key doesn't exist
    /// @validate: max_length=65535
    pub default_value: String,
}

impl GetSettingOrDefaultRequest {
    /// Create a new get setting or default request
    pub fn new(key: impl Into<String>, default_value: impl Into<String>) -> Self {
        Self {
            key: key.into(),
            default_value: default_value.into(),
        }
    }

    /// Create with a boolean default
    pub fn with_bool_default(key: impl Into<String>, default: bool) -> Self {
        Self {
            key: key.into(),
            default_value: default.to_string(),
        }
    }

    /// Create with an integer default
    pub fn with_int_default(key: impl Into<String>, default: i64) -> Self {
        Self {
            key: key.into(),
            default_value: default.to_string(),
        }
    }
}

/// Request to check if a setting exists
///
/// @endpoint: GET /api/settings/:key/exists
/// @command: setting_exists
#[typeshare]
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SettingExistsRequest {
    /// The setting key to check
    /// @validate: required, min_length=1, max_length=255
    pub key: String,
}

impl SettingExistsRequest {
    /// Create a new setting exists request
    pub fn new(key: impl Into<String>) -> Self {
        Self { key: key.into() }
    }
}

/// Request to get all settings
///
/// @endpoint: GET /api/settings
/// @command: get_all_settings
#[typeshare]
#[derive(Debug, Clone, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct GetAllSettingsRequest {
    /// Optional prefix filter - only return settings with keys starting with this prefix
    pub prefix: Option<String>,
}

impl GetAllSettingsRequest {
    /// Create a new get all settings request
    pub fn new() -> Self {
        Self::default()
    }

    /// Create a request filtered by prefix
    pub fn with_prefix(prefix: impl Into<String>) -> Self {
        Self {
            prefix: Some(prefix.into()),
        }
    }
}

/// Request to delete all settings
///
/// @endpoint: DELETE /api/settings
/// @command: delete_all_settings
#[typeshare]
#[derive(Debug, Clone, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DeleteAllSettingsRequest {
    /// Confirmation flag - must be true to proceed
    /// This is a safeguard to prevent accidental deletion
    pub confirm: bool,
}

impl DeleteAllSettingsRequest {
    /// Create a new delete all settings request
    pub fn confirmed() -> Self {
        Self { confirm: true }
    }
}

/// Response for setting existence check
#[typeshare]
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SettingExistsResponse {
    /// Whether the setting exists
    pub exists: bool,
}

impl SettingExistsResponse {
    /// Create a new response
    pub fn new(exists: bool) -> Self {
        Self { exists }
    }
}

/// Response for delete all settings operation
#[typeshare]
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DeleteAllSettingsResponse {
    /// Number of settings deleted (using i32 for typeshare compatibility)
    pub deleted_count: i32,
}

impl DeleteAllSettingsResponse {
    /// Create a new response
    pub fn new(deleted_count: u64) -> Self {
        Self {
            deleted_count: deleted_count as i32,
        }
    }

    /// Get the count as usize
    pub fn count(&self) -> usize {
        self.deleted_count as usize
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_get_setting_request() {
        let req = GetSettingRequest::new("theme");
        assert_eq!(req.key, "theme");
    }

    #[test]
    fn test_set_setting_request() {
        let req = SetSettingRequest::new("theme", "dark");
        assert_eq!(req.key, "theme");
        assert_eq!(req.value, "dark");
    }

    #[test]
    fn test_set_setting_bool() {
        let req = SetSettingRequest::bool("enabled", true);
        assert_eq!(req.key, "enabled");
        assert_eq!(req.value, "true");
    }

    #[test]
    fn test_set_setting_int() {
        let req = SetSettingRequest::int("count", 42);
        assert_eq!(req.key, "count");
        assert_eq!(req.value, "42");
    }

    #[test]
    fn test_set_setting_json() {
        #[derive(Serialize)]
        struct Config {
            enabled: bool,
            count: i32,
        }

        let config = Config {
            enabled: true,
            count: 5,
        };

        let req = SetSettingRequest::json("config", &config).unwrap();
        assert_eq!(req.key, "config");
        assert!(req.value.contains("enabled"));
        assert!(req.value.contains("count"));
    }

    #[test]
    fn test_delete_setting_request() {
        let req = DeleteSettingRequest::new("old_key");
        assert_eq!(req.key, "old_key");
    }

    #[test]
    fn test_get_or_default_request() {
        let req = GetSettingOrDefaultRequest::new("theme", "light");
        assert_eq!(req.key, "theme");
        assert_eq!(req.default_value, "light");
    }

    #[test]
    fn test_get_or_default_bool() {
        let req = GetSettingOrDefaultRequest::with_bool_default("enabled", true);
        assert_eq!(req.default_value, "true");
    }

    #[test]
    fn test_get_or_default_int() {
        let req = GetSettingOrDefaultRequest::with_int_default("count", 10);
        assert_eq!(req.default_value, "10");
    }

    #[test]
    fn test_setting_exists_request() {
        let req = SettingExistsRequest::new("some_key");
        assert_eq!(req.key, "some_key");
    }

    #[test]
    fn test_get_all_settings_request() {
        let req = GetAllSettingsRequest::new();
        assert!(req.prefix.is_none());

        let filtered = GetAllSettingsRequest::with_prefix("app.");
        assert_eq!(filtered.prefix, Some("app.".to_string()));
    }

    #[test]
    fn test_delete_all_settings_request() {
        let req = DeleteAllSettingsRequest::confirmed();
        assert!(req.confirm);

        let default_req = DeleteAllSettingsRequest::default();
        assert!(!default_req.confirm);
    }

    #[test]
    fn test_setting_exists_response() {
        let exists = SettingExistsResponse::new(true);
        assert!(exists.exists);

        let not_exists = SettingExistsResponse::new(false);
        assert!(!not_exists.exists);
    }

    #[test]
    fn test_delete_all_response() {
        let resp = DeleteAllSettingsResponse::new(5);
        assert_eq!(resp.deleted_count, 5);
    }
}
