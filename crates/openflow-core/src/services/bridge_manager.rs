//! Bridge Manager Service
//!
//! Manages the lifecycle of the Node.js Agent Bridge subprocess.
//! The bridge proxies requests to the Claude Agent SDK, enabling
//! the Rust backend to use SDK features like session resumption.
//!
//! # Architecture
//!
//! ```text
//! ┌─────────────────────────────────────────────────────────────────────────┐
//! │                         BridgeManager                                   │
//! ├─────────────────────────────────────────────────────────────────────────┤
//! │                                                                         │
//! │   start()              stop()              is_healthy()                 │
//! │      │                   │                      │                       │
//! │      ▼                   ▼                      ▼                       │
//! │   Spawn Node.js      Kill process          GET /health                 │
//! │   subprocess                                                            │
//! │                                                                         │
//! └─────────────────────────────────────────────────────────────────────────┘
//!                            │
//!                            ▼
//! ┌─────────────────────────────────────────────────────────────────────────┐
//! │                     Agent Bridge (Node.js)                              │
//! │   - Runs on localhost:PORT                                              │
//! │   - POST /execute -> Claude Agent SDK -> SSE stream                     │
//! └─────────────────────────────────────────────────────────────────────────┘
//! ```
//!
//! # Usage
//!
//! ```ignore
//! use openflow_core::services::bridge_manager::BridgeManager;
//!
//! let mut manager = BridgeManager::new(3002);
//!
//! // Start the bridge subprocess
//! manager.start().await?;
//!
//! // Check health
//! if manager.is_healthy().await {
//!     println!("Bridge is running!");
//! }
//!
//! // Get URL for client
//! let url = manager.url();
//!
//! // Stop when done
//! manager.stop().await?;
//! ```

use std::path::{Path, PathBuf};
use std::process::Stdio;
use std::time::Duration;

use log::{debug, error, info, warn};
use reqwest::Client;
use tokio::process::{Child, Command};
use tokio::time::timeout;

use super::{ServiceError, ServiceResult};

// =============================================================================
// Constants
// =============================================================================

/// Default port for the bridge server.
pub const DEFAULT_BRIDGE_PORT: u16 = 3002;

/// Timeout for health checks.
const HEALTH_CHECK_TIMEOUT: Duration = Duration::from_secs(5);

/// Max retries for health check on startup.
const STARTUP_HEALTH_CHECK_RETRIES: u32 = 30;

/// Delay between health check retries.
const HEALTH_CHECK_RETRY_DELAY: Duration = Duration::from_millis(500);

// =============================================================================
// Bridge Manager
// =============================================================================

/// Manages the lifecycle of the Agent Bridge subprocess.
///
/// The BridgeManager handles:
/// - Starting the Node.js bridge subprocess
/// - Health checking to ensure the bridge is ready
/// - Stopping the subprocess on shutdown
/// - Finding the bridge executable in different deployment contexts
pub struct BridgeManager {
    /// Child process handle (if running)
    process: Option<Child>,
    /// Port the bridge listens on
    port: u16,
    /// HTTP client for health checks
    health_client: Client,
    /// Whether the bridge was started externally (not managed by us)
    external: bool,
}

impl BridgeManager {
    /// Create a new bridge manager.
    ///
    /// # Arguments
    /// * `port` - Port for the bridge server to listen on
    pub fn new(port: u16) -> Self {
        Self {
            process: None,
            port,
            health_client: Client::builder()
                .timeout(HEALTH_CHECK_TIMEOUT)
                .build()
                .expect("Failed to create HTTP client"),
            external: false,
        }
    }

    /// Create a bridge manager with the default port.
    pub fn default_port() -> Self {
        Self::new(DEFAULT_BRIDGE_PORT)
    }

    /// Get the URL for the bridge server.
    pub fn url(&self) -> String {
        format!("http://localhost:{}", self.port)
    }

    /// Get the port number.
    pub fn port(&self) -> u16 {
        self.port
    }

    /// Check if the bridge subprocess is currently running.
    pub fn is_running(&self) -> bool {
        self.process.is_some() || self.external
    }

    /// Start the bridge subprocess.
    ///
    /// This method:
    /// 1. Finds the bridge executable
    /// 2. Spawns the Node.js process
    /// 3. Waits for the health check to pass
    ///
    /// # Errors
    /// - Bridge executable not found
    /// - Failed to spawn process
    /// - Health check timeout
    pub async fn start(&mut self) -> ServiceResult<()> {
        // Check if already running
        if self.process.is_some() {
            debug!("Bridge already running (managed)");
            return Ok(());
        }

        // Check if an external bridge is already running
        if self.is_healthy().await {
            info!(
                "External bridge detected on port {}, using existing instance",
                self.port
            );
            self.external = true;
            return Ok(());
        }

        info!("Starting agent bridge subprocess on port {}", self.port);

        // Find the bridge executable
        let bridge_path = self.find_bridge_executable()?;
        debug!("Found bridge at: {:?}", bridge_path);

        // Determine how to run the bridge based on the path
        let (command, args) = self.build_command(&bridge_path);

        debug!("Running: {} {:?}", command, args);

        // Spawn the process
        let child = Command::new(&command)
            .args(&args)
            .env("AGENT_BRIDGE_PORT", self.port.to_string())
            .env("NODE_ENV", "production")
            .stdout(Stdio::piped())
            .stderr(Stdio::piped())
            .kill_on_drop(true)
            .spawn()
            .map_err(|e| {
                error!("Failed to spawn bridge process: {}", e);
                ServiceError::Process(format!("Failed to spawn bridge: {}", e))
            })?;

        self.process = Some(child);

        // Wait for health check to pass
        self.wait_for_healthy().await?;

        info!(
            "Agent bridge started successfully on http://localhost:{}",
            self.port
        );

        Ok(())
    }

    /// Stop the bridge subprocess.
    ///
    /// If the bridge was started externally, this does nothing.
    pub async fn stop(&mut self) -> ServiceResult<()> {
        if self.external {
            debug!("External bridge detected, not stopping");
            self.external = false;
            return Ok(());
        }

        if let Some(mut child) = self.process.take() {
            info!("Stopping agent bridge subprocess");

            // Try graceful shutdown first
            if let Err(e) = child.kill().await {
                warn!("Failed to kill bridge process: {}", e);
            }

            // Wait for process to exit
            match timeout(Duration::from_secs(5), child.wait()).await {
                Ok(Ok(status)) => {
                    debug!("Bridge process exited with status: {}", status);
                }
                Ok(Err(e)) => {
                    warn!("Error waiting for bridge process: {}", e);
                }
                Err(_) => {
                    warn!("Timeout waiting for bridge process to exit");
                }
            }

            info!("Agent bridge stopped");
        }

        Ok(())
    }

    /// Check if the bridge is healthy.
    ///
    /// Makes a GET request to /health and checks for success.
    pub async fn is_healthy(&self) -> bool {
        let url = format!("{}/health", self.url());

        match self.health_client.get(&url).send().await {
            Ok(response) => response.status().is_success(),
            Err(_) => false,
        }
    }

    /// Wait for the bridge to become healthy.
    ///
    /// Retries the health check up to STARTUP_HEALTH_CHECK_RETRIES times.
    async fn wait_for_healthy(&self) -> ServiceResult<()> {
        info!("Waiting for bridge to become healthy...");

        for attempt in 1..=STARTUP_HEALTH_CHECK_RETRIES {
            if self.is_healthy().await {
                debug!("Bridge healthy after {} attempt(s)", attempt);
                return Ok(());
            }

            // Check if process has exited
            // Note: We can't easily check this without &mut self, so we just retry

            if attempt < STARTUP_HEALTH_CHECK_RETRIES {
                debug!(
                    "Health check attempt {} failed, retrying in {:?}",
                    attempt, HEALTH_CHECK_RETRY_DELAY
                );
                tokio::time::sleep(HEALTH_CHECK_RETRY_DELAY).await;
            }
        }

        error!(
            "Bridge failed to become healthy after {} attempts",
            STARTUP_HEALTH_CHECK_RETRIES
        );
        Err(ServiceError::External(
            "Bridge failed to start: health check timeout".to_string(),
        ))
    }

    /// Find the bridge executable.
    ///
    /// Searches in multiple locations based on deployment context:
    /// 1. Bundled with Tauri app (resources directory)
    /// 2. Development (packages/agent-bridge/dist)
    /// 3. Built TypeScript in node_modules
    fn find_bridge_executable(&self) -> ServiceResult<PathBuf> {
        // 1. Check for bundled binary (Tauri app)
        if let Ok(exe_path) = std::env::current_exe() {
            if let Some(exe_dir) = exe_path.parent() {
                // macOS app bundle: Contents/MacOS/../Resources/resources/agent-bridge
                let macos_resources =
                    exe_dir.join("../Resources/resources/agent-bridge/server.js");
                if macos_resources.exists() {
                    info!("Found bridge in macOS bundle: {:?}", macos_resources);
                    return Ok(macos_resources);
                }

                // Linux/Windows resources
                let resources = exe_dir.join("resources/agent-bridge/server.js");
                if resources.exists() {
                    info!("Found bridge in resources: {:?}", resources);
                    return Ok(resources);
                }
            }
        }

        // 2. Check OPENFLOW_BRIDGE_PATH environment variable (highest priority for dev)
        if let Ok(path) = std::env::var("OPENFLOW_BRIDGE_PATH") {
            let env_path = PathBuf::from(&path);
            if env_path.exists() {
                info!("Found bridge via OPENFLOW_BRIDGE_PATH: {:?}", env_path);
                return Ok(env_path);
            }
            debug!("OPENFLOW_BRIDGE_PATH set but path doesn't exist: {}", path);
        }

        // 3. Development mode - try relative to cwd
        let dev_dist = PathBuf::from("packages/agent-bridge/dist/server.js");
        if dev_dist.exists() {
            info!("Found bridge in cwd-relative path: {:?}", dev_dist);
            return Ok(dev_dist);
        }

        // 4. Development mode - try workspace root (when running from src-tauri/)
        if let Ok(cwd) = std::env::current_dir() {
            // Check if we're in src-tauri/ and need to go up
            let parent_relative = cwd.join("../packages/agent-bridge/dist/server.js");
            if parent_relative.exists() {
                let canonical = parent_relative.canonicalize().unwrap_or(parent_relative);
                info!("Found bridge via parent directory: {:?}", canonical);
                return Ok(canonical);
            }

            // Also try standard cwd relative
            let cwd_relative = cwd.join("packages/agent-bridge/dist/server.js");
            if cwd_relative.exists() {
                info!("Found bridge in cwd: {:?}", cwd_relative);
                return Ok(cwd_relative);
            }
        }

        // 5. Try node_modules
        let node_modules = PathBuf::from("node_modules/@openflow/agent-bridge/dist/server.js");
        if node_modules.exists() {
            info!("Found bridge in node_modules: {:?}", node_modules);
            return Ok(node_modules);
        }

        Err(ServiceError::Config(
            "Bridge executable not found. Please run 'pnpm build' in packages/agent-bridge or set OPENFLOW_BRIDGE_PATH.".to_string(),
        ))
    }

    /// Build the command and arguments based on the bridge path.
    fn build_command(&self, bridge_path: &Path) -> (String, Vec<String>) {
        // If it's a .js file, run with node
        if bridge_path.extension().is_some_and(|ext| ext == "js") {
            ("node".to_string(), vec![bridge_path.display().to_string()])
        } else {
            // Assume it's a native binary or script
            (bridge_path.display().to_string(), vec![])
        }
    }
}

impl Drop for BridgeManager {
    fn drop(&mut self) {
        // Best-effort cleanup - can't be async in Drop
        if let Some(mut child) = self.process.take() {
            // Use start_kill() which is non-blocking
            let _ = child.start_kill();
        }
    }
}

// =============================================================================
// Tests
// =============================================================================

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_bridge_manager_new() {
        let manager = BridgeManager::new(3002);
        assert_eq!(manager.port(), 3002);
        assert_eq!(manager.url(), "http://localhost:3002");
        assert!(!manager.is_running());
    }

    #[test]
    fn test_bridge_manager_default_port() {
        let manager = BridgeManager::default_port();
        assert_eq!(manager.port(), DEFAULT_BRIDGE_PORT);
    }

    #[test]
    fn test_find_bridge_executable_not_found() {
        let manager = BridgeManager::new(3002);
        // In test environment without the bridge built, this should fail
        // unless packages/agent-bridge/dist exists
        let _ = manager.find_bridge_executable();
        // Just checking it doesn't panic
    }

    #[tokio::test]
    async fn test_is_healthy_when_not_running() {
        let manager = BridgeManager::new(19999); // Use unlikely port
        assert!(!manager.is_healthy().await);
    }

    #[tokio::test]
    async fn test_stop_when_not_running() {
        let mut manager = BridgeManager::new(3002);
        // Should not panic
        manager.stop().await.unwrap();
    }
}

