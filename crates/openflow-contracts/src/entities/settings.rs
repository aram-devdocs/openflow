//! Settings Entity
//!
//! Application settings stored as key-value pairs.
//! The settings table provides a simple key-value store for
//! application configuration that persists across sessions.

use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use typeshare::typeshare;

/// A setting entry (key-value pair)
///
/// @entity
/// @table: app_settings
#[typeshare]
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Setting {
    /// The setting key (unique identifier)
    /// @validate: required, min_length=1, max_length=255
    pub key: String,

    /// The setting value (JSON-serializable string)
    /// @validate: max_length=65535
    pub value: String,

    /// When the setting was last updated
    pub updated_at: DateTime<Utc>,
}

impl Setting {
    /// Create a new setting
    pub fn new(key: impl Into<String>, value: impl Into<String>) -> Self {
        Self {
            key: key.into(),
            value: value.into(),
            updated_at: Utc::now(),
        }
    }

    /// Parse the value as a specific type
    pub fn parse<T: for<'de> Deserialize<'de>>(&self) -> Result<T, serde_json::Error> {
        serde_json::from_str(&self.value)
    }

    /// Check if the value is empty
    pub fn is_empty(&self) -> bool {
        self.value.is_empty()
    }

    /// Get the value as a boolean
    pub fn as_bool(&self) -> Option<bool> {
        match self.value.to_lowercase().as_str() {
            "true" | "1" | "yes" | "on" => Some(true),
            "false" | "0" | "no" | "off" => Some(false),
            _ => None,
        }
    }

    /// Get the value as an integer
    pub fn as_i64(&self) -> Option<i64> {
        self.value.parse().ok()
    }

    /// Get the value as a float
    pub fn as_f64(&self) -> Option<f64> {
        self.value.parse().ok()
    }
}

/// Summary of all settings as a map
///
/// This is a convenience type for returning all settings at once.
/// Used by the `get_all_settings` endpoint.
///
/// Note: Not using #[typeshare] because it doesn't support #[serde(flatten)].
/// The TypeScript type is defined manually as Record<string, string>.
#[derive(Debug, Clone, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SettingsMap {
    /// Map of setting keys to values
    #[serde(flatten)]
    pub settings: std::collections::HashMap<String, String>,
}

impl SettingsMap {
    /// Create a new empty settings map
    pub fn new() -> Self {
        Self::default()
    }

    /// Create from a HashMap
    pub fn from_map(settings: std::collections::HashMap<String, String>) -> Self {
        Self { settings }
    }

    /// Get the number of settings
    pub fn len(&self) -> usize {
        self.settings.len()
    }

    /// Check if the settings map is empty
    pub fn is_empty(&self) -> bool {
        self.settings.is_empty()
    }

    /// Get a setting value by key
    pub fn get(&self, key: &str) -> Option<&String> {
        self.settings.get(key)
    }

    /// Check if a setting exists
    pub fn contains(&self, key: &str) -> bool {
        self.settings.contains_key(key)
    }

    /// Get all keys
    pub fn keys(&self) -> impl Iterator<Item = &String> {
        self.settings.keys()
    }

    /// Insert a setting
    pub fn insert(&mut self, key: impl Into<String>, value: impl Into<String>) {
        self.settings.insert(key.into(), value.into());
    }
}

impl From<std::collections::HashMap<String, String>> for SettingsMap {
    fn from(settings: std::collections::HashMap<String, String>) -> Self {
        Self { settings }
    }
}

impl IntoIterator for SettingsMap {
    type Item = (String, String);
    type IntoIter = std::collections::hash_map::IntoIter<String, String>;

    fn into_iter(self) -> Self::IntoIter {
        self.settings.into_iter()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_setting_new() {
        let setting = Setting::new("theme", "dark");
        assert_eq!(setting.key, "theme");
        assert_eq!(setting.value, "dark");
    }

    #[test]
    fn test_setting_as_bool() {
        let true_settings = ["true", "1", "yes", "on", "TRUE", "Yes", "ON"];
        for val in true_settings {
            let setting = Setting::new("test", val);
            assert_eq!(setting.as_bool(), Some(true), "Expected true for '{}'", val);
        }

        let false_settings = ["false", "0", "no", "off", "FALSE", "No", "OFF"];
        for val in false_settings {
            let setting = Setting::new("test", val);
            assert_eq!(
                setting.as_bool(),
                Some(false),
                "Expected false for '{}'",
                val
            );
        }

        let invalid = Setting::new("test", "maybe");
        assert_eq!(invalid.as_bool(), None);
    }

    #[test]
    fn test_setting_as_i64() {
        let setting = Setting::new("count", "42");
        assert_eq!(setting.as_i64(), Some(42));

        let negative = Setting::new("count", "-10");
        assert_eq!(negative.as_i64(), Some(-10));

        let invalid = Setting::new("count", "not a number");
        assert_eq!(invalid.as_i64(), None);
    }

    #[test]
    fn test_setting_as_f64() {
        let setting = Setting::new("rate", "3.14");
        assert!((setting.as_f64().unwrap() - std::f64::consts::PI).abs() < 0.01);

        let int_setting = Setting::new("rate", "42");
        assert_eq!(int_setting.as_f64(), Some(42.0));
    }

    #[test]
    fn test_setting_parse_json() {
        let setting = Setting::new("config", r#"{"enabled": true, "count": 5}"#);

        #[derive(Deserialize, PartialEq, Debug)]
        struct Config {
            enabled: bool,
            count: i32,
        }

        let config: Config = setting.parse().unwrap();
        assert!(config.enabled);
        assert_eq!(config.count, 5);
    }

    #[test]
    fn test_setting_is_empty() {
        let empty = Setting::new("key", "");
        assert!(empty.is_empty());

        let not_empty = Setting::new("key", "value");
        assert!(!not_empty.is_empty());
    }

    #[test]
    fn test_settings_map_new() {
        let map = SettingsMap::new();
        assert!(map.is_empty());
        assert_eq!(map.len(), 0);
    }

    #[test]
    fn test_settings_map_from_hashmap() {
        let mut hash_map = std::collections::HashMap::new();
        hash_map.insert("theme".to_string(), "dark".to_string());
        hash_map.insert("language".to_string(), "en".to_string());

        let map = SettingsMap::from_map(hash_map);
        assert_eq!(map.len(), 2);
        assert_eq!(map.get("theme"), Some(&"dark".to_string()));
        assert_eq!(map.get("language"), Some(&"en".to_string()));
    }

    #[test]
    fn test_settings_map_operations() {
        let mut map = SettingsMap::new();

        map.insert("key1", "value1");
        map.insert("key2", "value2");

        assert_eq!(map.len(), 2);
        assert!(map.contains("key1"));
        assert!(!map.contains("key3"));
        assert_eq!(map.get("key1"), Some(&"value1".to_string()));
        assert_eq!(map.get("missing"), None);
    }

    #[test]
    fn test_settings_map_into_iter() {
        let mut map = SettingsMap::new();
        map.insert("a", "1");
        map.insert("b", "2");

        let collected: std::collections::HashMap<_, _> = map.into_iter().collect();
        assert_eq!(collected.len(), 2);
    }
}
