//! Server Configuration
//!
//! Configurable via environment variables or programmatic setup.

use std::net::SocketAddr;
use std::path::PathBuf;

/// Server configuration
#[derive(Debug, Clone)]
pub struct ServerConfig {
    /// Host to bind to (default: 127.0.0.1)
    pub host: String,
    /// Port to listen on (default: 3001)
    pub port: u16,
    /// Allowed CORS origins
    pub cors_origins: Vec<String>,
    /// Database file path (for standalone mode)
    pub database_path: Option<PathBuf>,
    /// Enable detailed logging
    pub verbose: bool,
}

impl Default for ServerConfig {
    fn default() -> Self {
        Self {
            host: "127.0.0.1".to_string(),
            port: 3001,
            cors_origins: vec![
                "http://localhost:5173".to_string(),
                "http://localhost:1420".to_string(),
                "tauri://localhost".to_string(),
            ],
            database_path: None,
            verbose: false,
        }
    }
}

impl ServerConfig {
    /// Create configuration from environment variables
    ///
    /// Supported environment variables:
    /// - `OPENFLOW_HOST`: Host to bind to
    /// - `OPENFLOW_PORT`: Port to listen on
    /// - `OPENFLOW_CORS_ORIGINS`: Comma-separated list of allowed origins
    /// - `DATABASE_PATH`: Path to SQLite database file
    /// - `OPENFLOW_VERBOSE`: Enable verbose logging (true/false/1/0)
    pub fn from_env() -> Self {
        let mut config = Self::default();

        if let Ok(host) = std::env::var("OPENFLOW_HOST") {
            config.host = host;
        }

        if let Ok(port) = std::env::var("OPENFLOW_PORT") {
            if let Ok(p) = port.parse() {
                config.port = p;
            }
        }

        if let Ok(origins) = std::env::var("OPENFLOW_CORS_ORIGINS") {
            config.cors_origins = origins
                .split(',')
                .map(|s| s.trim().to_string())
                .filter(|s| !s.is_empty())
                .collect();
        }

        if let Ok(db_path) = std::env::var("DATABASE_PATH") {
            config.database_path = Some(PathBuf::from(db_path));
        }

        if let Ok(verbose) = std::env::var("OPENFLOW_VERBOSE") {
            config.verbose = matches!(verbose.to_lowercase().as_str(), "true" | "1" | "yes");
        }

        config
    }

    /// Create a new config with the specified host and port
    pub fn new(host: impl Into<String>, port: u16) -> Self {
        Self {
            host: host.into(),
            port,
            ..Default::default()
        }
    }

    /// Set the port to listen on
    pub fn with_port(mut self, port: u16) -> Self {
        self.port = port;
        self
    }

    /// Set the host to bind to
    pub fn with_host(mut self, host: impl Into<String>) -> Self {
        self.host = host.into();
        self
    }

    /// Set the database path
    pub fn with_database_path(mut self, path: impl Into<PathBuf>) -> Self {
        self.database_path = Some(path.into());
        self
    }

    /// Set the CORS origins
    pub fn with_cors_origins(mut self, origins: Vec<String>) -> Self {
        self.cors_origins = origins;
        self
    }

    /// Enable verbose logging
    pub fn with_verbose(mut self, verbose: bool) -> Self {
        self.verbose = verbose;
        self
    }

    /// Get the socket address for binding
    pub fn socket_addr(&self) -> SocketAddr {
        format!("{}:{}", self.host, self.port)
            .parse()
            .expect("Invalid host:port configuration")
    }

    /// Get the base URL for this server
    pub fn base_url(&self) -> String {
        format!("http://{}:{}", self.host, self.port)
    }

    /// Get the WebSocket URL for this server
    pub fn ws_url(&self) -> String {
        format!("ws://{}:{}", self.host, self.port)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_default_config() {
        let config = ServerConfig::default();
        assert_eq!(config.host, "127.0.0.1");
        assert_eq!(config.port, 3001);
        assert!(!config.cors_origins.is_empty());
        assert!(config.database_path.is_none());
        assert!(!config.verbose);
    }

    #[test]
    fn test_socket_addr() {
        let config = ServerConfig::default();
        let addr = config.socket_addr();
        assert_eq!(addr.port(), 3001);
    }

    #[test]
    fn test_builder_pattern() {
        let config = ServerConfig::new("0.0.0.0", 8080)
            .with_database_path("/tmp/test.db")
            .with_verbose(true);

        assert_eq!(config.host, "0.0.0.0");
        assert_eq!(config.port, 8080);
        assert_eq!(config.database_path, Some(PathBuf::from("/tmp/test.db")));
        assert!(config.verbose);
    }

    #[test]
    fn test_base_url() {
        let config = ServerConfig::new("localhost", 3001);
        assert_eq!(config.base_url(), "http://localhost:3001");
        assert_eq!(config.ws_url(), "ws://localhost:3001");
    }
}
