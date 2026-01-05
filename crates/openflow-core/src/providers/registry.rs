//! Provider Registry for Agent Providers
//!
//! This module provides a thread-safe registry for accessing agent providers.
//! Providers are cached to avoid repeated instantiation.
//!
//! # Architecture
//!
//! ```text
//! ┌─────────────────────────────────────────────────────────────────────────┐
//! │                         ProviderRegistry                                │
//! ├─────────────────────────────────────────────────────────────────────────┤
//! │                                                                         │
//! │   get(id: &str)         list_ids()          exists(id: &str)           │
//! │         │                   │                      │                    │
//! │         ▼                   ▼                      ▼                    │
//! │    Arc<dyn Provider>   Vec<&'static str>         bool                  │
//! │                                                                         │
//! └─────────────────────────────────────────────────────────────────────────┘
//!                            │
//!          ┌─────────────────┼─────────────────┐──────────────┐
//!          │                 │                 │              │
//!          ▼                 ▼                 ▼              ▼
//! ┌─────────────┐   ┌─────────────┐   ┌─────────────┐ ┌─────────────┐
//! │ ClaudeCode  │   │  GeminiCLI  │   │  CodexCLI   │ │    Mock     │
//! │  Provider   │   │  Provider   │   │  Provider   │ │  Provider   │
//! └─────────────┘   └─────────────┘   └─────────────┘ └─────────────┘
//! ```
//!
//! # Usage
//!
//! ## Static Functions (Recommended for most use cases)
//!
//! ```ignore
//! use openflow_core::providers::{get_provider, list_provider_ids, provider_exists};
//!
//! // Get a provider by ID
//! let provider = get_provider("claude-code").expect("Provider not found");
//! println!("Using: {}", provider.display_name());
//!
//! // List all available providers
//! for id in list_provider_ids() {
//!     println!("Available: {}", id);
//! }
//!
//! // Check if a provider exists
//! if provider_exists("claude-code") {
//!     println!("Claude Code is available!");
//! }
//! ```
//!
//! ## Registry Instance (For dependency injection)
//!
//! ```ignore
//! use openflow_core::providers::ProviderRegistry;
//!
//! // Create a registry with all built-in providers
//! let registry = ProviderRegistry::new();
//!
//! // Use the registry
//! let provider = registry.get("claude-code")?;
//! ```
//!
//! # Thread Safety
//!
//! The registry is designed to be thread-safe:
//! - Static functions use a global lazy-initialized registry
//! - `ProviderRegistry` can be cloned and shared across threads
//! - All providers implement `Send + Sync`

use std::collections::HashMap;
use std::sync::{Arc, OnceLock};

use super::claude_code::{ClaudeCodeProvider, PROVIDER_ID as CLAUDE_CODE_ID};
use super::claude_sdk::{ClaudeSdkProvider, PROVIDER_ID as CLAUDE_SDK_ID};
use super::codex_cli::{CodexCLIProvider, PROVIDER_ID as CODEX_CLI_ID};
use super::gemini_cli::{GeminiCLIProvider, PROVIDER_ID as GEMINI_CLI_ID};
use super::mock::{MockProvider, PROVIDER_ID as MOCK_ID};
use super::AgentProvider;

// =============================================================================
// Constants
// =============================================================================

/// All registered provider IDs.
pub const PROVIDER_IDS: &[&str] = &[CLAUDE_SDK_ID, CLAUDE_CODE_ID, GEMINI_CLI_ID, CODEX_CLI_ID, MOCK_ID];

/// Default provider ID (Claude Code).
pub const DEFAULT_PROVIDER_ID: &str = CLAUDE_CODE_ID;

// =============================================================================
// Global Registry
// =============================================================================

/// Global singleton registry for static function access.
static GLOBAL_REGISTRY: OnceLock<ProviderRegistry> = OnceLock::new();

/// Get the global provider registry instance.
fn global_registry() -> &'static ProviderRegistry {
    GLOBAL_REGISTRY.get_or_init(ProviderRegistry::new)
}

// =============================================================================
// ProviderRegistry
// =============================================================================

/// A thread-safe registry for agent providers.
///
/// The registry caches provider instances to avoid repeated instantiation.
/// Each provider is created lazily on first access and then cached.
///
/// # Example
///
/// ```ignore
/// use openflow_core::providers::ProviderRegistry;
///
/// let registry = ProviderRegistry::new();
///
/// // Get a provider (creates if not cached)
/// let claude = registry.get("claude-code")?;
///
/// // Get the same provider again (returns cached instance)
/// let claude2 = registry.get("claude-code")?;
///
/// // Both are the same Arc instance
/// assert!(Arc::ptr_eq(&claude, &claude2));
/// ```
#[derive(Debug, Clone)]
pub struct ProviderRegistry {
    /// Cached provider instances.
    providers: Arc<HashMap<&'static str, Arc<dyn AgentProvider>>>,
}

impl ProviderRegistry {
    /// Create a new registry with all built-in providers.
    ///
    /// This eagerly initializes all providers. For lazy initialization,
    /// use the static `get_provider` function instead.
    pub fn new() -> Self {
        let mut providers: HashMap<&'static str, Arc<dyn AgentProvider>> = HashMap::new();

        // Register all built-in providers
        providers.insert(CLAUDE_SDK_ID, Arc::new(ClaudeSdkProvider::new()));
        providers.insert(CLAUDE_CODE_ID, Arc::new(ClaudeCodeProvider::new()));
        providers.insert(GEMINI_CLI_ID, Arc::new(GeminiCLIProvider::new()));
        providers.insert(CODEX_CLI_ID, Arc::new(CodexCLIProvider::new()));
        providers.insert(MOCK_ID, Arc::new(MockProvider::default()));

        Self {
            providers: Arc::new(providers),
        }
    }

    /// Get a provider by its ID.
    ///
    /// # Arguments
    ///
    /// * `id` - Provider identifier (e.g., "claude-code", "gemini-cli")
    ///
    /// # Returns
    ///
    /// - `Some(provider)` if a provider with that ID exists
    /// - `None` if no provider matches
    pub fn get(&self, id: &str) -> Option<Arc<dyn AgentProvider>> {
        self.providers.get(id).cloned()
    }

    /// List all available provider IDs.
    pub fn list_ids(&self) -> Vec<&'static str> {
        self.providers.keys().copied().collect()
    }

    /// Check if a provider exists.
    pub fn exists(&self, id: &str) -> bool {
        self.providers.contains_key(id)
    }

    /// Get the number of registered providers.
    pub fn count(&self) -> usize {
        self.providers.len()
    }

    /// Get the default provider.
    ///
    /// Returns Claude Code as the default provider.
    pub fn default_provider(&self) -> Arc<dyn AgentProvider> {
        self.get(DEFAULT_PROVIDER_ID)
            .expect("Default provider should always exist")
    }

    /// Get all registered providers.
    pub fn all(&self) -> Vec<Arc<dyn AgentProvider>> {
        self.providers.values().cloned().collect()
    }

    /// Get provider info for display purposes.
    ///
    /// Returns a vector of (id, display_name) tuples.
    pub fn info(&self) -> Vec<(&'static str, &'static str)> {
        self.providers
            .values()
            .map(|p| (p.provider_id(), p.display_name()))
            .collect()
    }
}

impl Default for ProviderRegistry {
    fn default() -> Self {
        Self::new()
    }
}

// =============================================================================
// Static Functions (Convenience API)
// =============================================================================

/// Get a provider by its ID.
///
/// This is a convenience function that uses the global registry.
///
/// # Arguments
///
/// * `id` - Provider identifier (e.g., "claude-code", "gemini-cli")
///
/// # Returns
///
/// - `Some(provider)` if a provider with that ID exists
/// - `None` if no provider matches
///
/// # Example
///
/// ```ignore
/// use openflow_core::providers::get_provider;
///
/// if let Some(provider) = get_provider("claude-code") {
///     println!("Found provider: {}", provider.display_name());
/// }
/// ```
pub fn get_provider(id: &str) -> Option<Arc<dyn AgentProvider>> {
    global_registry().get(id)
}

/// List all available provider IDs.
///
/// This is a convenience function that uses the global registry.
///
/// # Returns
///
/// A vector of all registered provider identifiers.
///
/// # Example
///
/// ```ignore
/// use openflow_core::providers::list_provider_ids;
///
/// for id in list_provider_ids() {
///     println!("Available: {}", id);
/// }
/// ```
pub fn list_provider_ids() -> Vec<&'static str> {
    global_registry().list_ids()
}

/// Check if a provider exists.
///
/// This is a convenience function that uses the global registry.
///
/// # Arguments
///
/// * `id` - Provider identifier to check
///
/// # Returns
///
/// `true` if a provider with that ID exists, `false` otherwise.
///
/// # Example
///
/// ```ignore
/// use openflow_core::providers::provider_exists;
///
/// if provider_exists("claude-code") {
///     println!("Claude Code is available!");
/// }
/// ```
pub fn provider_exists(id: &str) -> bool {
    global_registry().exists(id)
}

/// Get the default provider.
///
/// Returns Claude Code as the default provider.
///
/// # Example
///
/// ```ignore
/// use openflow_core::providers::default_provider;
///
/// let provider = default_provider();
/// println!("Default: {}", provider.display_name());
/// ```
pub fn default_provider() -> Arc<dyn AgentProvider> {
    global_registry().default_provider()
}

/// Get provider info for all registered providers.
///
/// # Returns
///
/// A vector of (id, display_name) tuples.
///
/// # Example
///
/// ```ignore
/// use openflow_core::providers::provider_info;
///
/// for (id, name) in provider_info() {
///     println!("{}: {}", id, name);
/// }
/// ```
pub fn provider_info() -> Vec<(&'static str, &'static str)> {
    global_registry().info()
}

// =============================================================================
// Tests
// =============================================================================

#[cfg(test)]
mod tests {
    use super::*;

    // =========================================================================
    // ProviderRegistry Tests
    // =========================================================================

    #[test]
    fn test_registry_new() {
        let registry = ProviderRegistry::new();
        assert_eq!(registry.count(), 5);
    }

    #[test]
    fn test_registry_get_claude_code() {
        let registry = ProviderRegistry::new();
        let provider = registry.get("claude-code");
        assert!(provider.is_some());
        let provider = provider.unwrap();
        assert_eq!(provider.provider_id(), "claude-code");
        assert_eq!(provider.display_name(), "Claude Code");
    }

    #[test]
    fn test_registry_get_gemini_cli() {
        let registry = ProviderRegistry::new();
        let provider = registry.get("gemini-cli");
        assert!(provider.is_some());
        let provider = provider.unwrap();
        assert_eq!(provider.provider_id(), "gemini-cli");
        assert_eq!(provider.display_name(), "Gemini CLI");
    }

    #[test]
    fn test_registry_get_codex_cli() {
        let registry = ProviderRegistry::new();
        let provider = registry.get("codex-cli");
        assert!(provider.is_some());
        let provider = provider.unwrap();
        assert_eq!(provider.provider_id(), "codex-cli");
        assert_eq!(provider.display_name(), "Codex CLI");
    }

    #[test]
    fn test_registry_get_mock() {
        let registry = ProviderRegistry::new();
        let provider = registry.get("mock");
        assert!(provider.is_some());
        let provider = provider.unwrap();
        assert_eq!(provider.provider_id(), "mock");
        assert_eq!(provider.display_name(), "Mock Provider");
    }

    #[test]
    fn test_registry_get_unknown() {
        let registry = ProviderRegistry::new();
        assert!(registry.get("unknown-provider").is_none());
    }

    #[test]
    fn test_registry_list_ids() {
        let registry = ProviderRegistry::new();
        let ids = registry.list_ids();
        assert!(ids.contains(&"claude-sdk"));
        assert!(ids.contains(&"claude-code"));
        assert!(ids.contains(&"gemini-cli"));
        assert!(ids.contains(&"codex-cli"));
        assert!(ids.contains(&"mock"));
        assert_eq!(ids.len(), 5);
    }

    #[test]
    fn test_registry_exists() {
        let registry = ProviderRegistry::new();
        assert!(registry.exists("claude-sdk"));
        assert!(registry.exists("claude-code"));
        assert!(registry.exists("gemini-cli"));
        assert!(registry.exists("codex-cli"));
        assert!(registry.exists("mock"));
        assert!(!registry.exists("unknown-provider"));
    }

    #[test]
    fn test_registry_count() {
        let registry = ProviderRegistry::new();
        assert_eq!(registry.count(), 5);
    }

    #[test]
    fn test_registry_default_provider() {
        let registry = ProviderRegistry::new();
        let provider = registry.default_provider();
        assert_eq!(provider.provider_id(), "claude-code");
    }

    #[test]
    fn test_registry_all() {
        let registry = ProviderRegistry::new();
        let providers = registry.all();
        assert_eq!(providers.len(), 5);
    }

    #[test]
    fn test_registry_info() {
        let registry = ProviderRegistry::new();
        let info = registry.info();
        assert_eq!(info.len(), 5);

        // Check that all providers are represented
        let ids: Vec<_> = info.iter().map(|(id, _)| *id).collect();
        assert!(ids.contains(&"claude-sdk"));
        assert!(ids.contains(&"claude-code"));
        assert!(ids.contains(&"gemini-cli"));
        assert!(ids.contains(&"codex-cli"));
        assert!(ids.contains(&"mock"));
    }

    #[test]
    fn test_registry_clone() {
        let registry1 = ProviderRegistry::new();
        let registry2 = registry1.clone();

        // Both should have the same providers
        assert_eq!(registry1.count(), registry2.count());
        assert!(registry1.exists("claude-code"));
        assert!(registry2.exists("claude-code"));
    }

    #[test]
    fn test_registry_default_impl() {
        let registry = ProviderRegistry::default();
        assert_eq!(registry.count(), 5); // claude-code, gemini-cli, codex-cli, mock, claude-sdk
    }

    #[test]
    fn test_registry_cached_instances() {
        let registry = ProviderRegistry::new();

        // Get the same provider twice
        let provider1 = registry.get("claude-code").unwrap();
        let provider2 = registry.get("claude-code").unwrap();

        // They should be the same Arc instance
        assert!(Arc::ptr_eq(&provider1, &provider2));
    }

    // =========================================================================
    // Static Function Tests
    // =========================================================================

    #[test]
    fn test_static_get_provider() {
        let provider = get_provider("claude-code");
        assert!(provider.is_some());
        assert_eq!(provider.unwrap().provider_id(), "claude-code");
    }

    #[test]
    fn test_static_get_provider_unknown() {
        assert!(get_provider("unknown-provider").is_none());
    }

    #[test]
    fn test_static_list_provider_ids() {
        let ids = list_provider_ids();
        assert!(ids.contains(&"claude-sdk"));
        assert!(ids.contains(&"claude-code"));
        assert!(ids.contains(&"gemini-cli"));
        assert!(ids.contains(&"codex-cli"));
        assert!(ids.contains(&"mock"));
    }

    #[test]
    fn test_static_provider_exists() {
        assert!(provider_exists("claude-sdk"));
        assert!(provider_exists("claude-code"));
        assert!(provider_exists("gemini-cli"));
        assert!(provider_exists("codex-cli"));
        assert!(provider_exists("mock"));
        assert!(!provider_exists("unknown-provider"));
    }

    #[test]
    fn test_static_default_provider() {
        let provider = default_provider();
        assert_eq!(provider.provider_id(), "claude-code");
    }

    #[test]
    fn test_static_provider_info() {
        let info = provider_info();
        assert_eq!(info.len(), 5);
    }

    // =========================================================================
    // Constants Tests
    // =========================================================================

    #[test]
    fn test_provider_ids_constant() {
        assert_eq!(PROVIDER_IDS.len(), 5);
        assert!(PROVIDER_IDS.contains(&"claude-sdk"));
        assert!(PROVIDER_IDS.contains(&"claude-code"));
        assert!(PROVIDER_IDS.contains(&"gemini-cli"));
        assert!(PROVIDER_IDS.contains(&"codex-cli"));
        assert!(PROVIDER_IDS.contains(&"mock"));
    }

    #[test]
    fn test_default_provider_id_constant() {
        assert_eq!(DEFAULT_PROVIDER_ID, "claude-code");
    }

    // =========================================================================
    // Thread Safety Tests
    // =========================================================================

    #[test]
    fn test_registry_is_send_sync() {
        fn assert_send_sync<T: Send + Sync>() {}
        assert_send_sync::<ProviderRegistry>();
    }

    #[test]
    fn test_provider_arc_is_send_sync() {
        fn assert_send_sync<T: Send + Sync>() {}
        assert_send_sync::<Arc<dyn AgentProvider>>();
    }
}
