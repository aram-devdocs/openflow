//! OpenFlow Standalone Server
//!
//! Run with: `cargo run -p openflow-server`
//!
//! # Examples
//!
//! Start with default settings:
//! ```bash
//! cargo run -p openflow-server
//! ```
//!
//! Start with custom port and database:
//! ```bash
//! cargo run -p openflow-server -- --port 8080 --database ./my-data.db
//! ```
//!
//! Start with verbose logging:
//! ```bash
//! RUST_LOG=debug cargo run -p openflow-server
//! ```
//!
//! Start with JSON log format (for production/log aggregation):
//! ```bash
//! cargo run -p openflow-server -- --json
//! ```
//!
//! # Environment Variables
//!
//! - `RUST_LOG`: Set log level filter (e.g., `debug`, `info`, `warn`, `error`)
//!   - Example: `RUST_LOG=openflow_server=debug,openflow_core=info`
//! - `OPENFLOW_HOST`: Host to bind to (default: 127.0.0.1)
//! - `OPENFLOW_PORT`: Port to listen on (default: 3001)
//! - `DATABASE_PATH`: Path to SQLite database file (default: ./openflow.db)
//! - `OPENFLOW_VERBOSE`: Enable verbose logging (set to any value)
//! - `OPENFLOW_JSON_LOGS`: Enable JSON log format (set to any value)

use clap::Parser;
use openflow_server::{start_server, ServerConfig};
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt, Layer};

/// OpenFlow HTTP/WebSocket Server
#[derive(Parser)]
#[command(name = "openflow-server")]
#[command(author, version, about = "OpenFlow HTTP/WebSocket Server", long_about = None)]
struct Args {
    /// Host to bind to
    #[arg(long, default_value = "127.0.0.1", env = "OPENFLOW_HOST")]
    host: String,

    /// Port to listen on
    #[arg(short, long, default_value = "3001", env = "OPENFLOW_PORT")]
    port: u16,

    /// Database file path
    #[arg(long, default_value = "./openflow.db", env = "DATABASE_PATH")]
    database: String,

    /// Enable verbose logging
    #[arg(short, long, env = "OPENFLOW_VERBOSE")]
    verbose: bool,

    /// Output logs in JSON format (for production/log aggregation)
    #[arg(long, env = "OPENFLOW_JSON_LOGS")]
    json: bool,
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let args = Args::parse();

    // Initialize tracing with configurable format
    let log_level = if args.verbose { "debug" } else { "info" };
    let env_filter = std::env::var("RUST_LOG").unwrap_or_else(|_| {
        format!(
            "openflow_server={},openflow_core={},openflow_db={},openflow_process={}",
            log_level, log_level, log_level, log_level
        )
    });

    let filter = tracing_subscriber::EnvFilter::new(env_filter);

    if args.json {
        // JSON format for production/log aggregation
        tracing_subscriber::registry()
            .with(
                tracing_subscriber::fmt::layer()
                    .json()
                    .with_current_span(true)
                    .with_span_list(false)
                    .with_filter(filter),
            )
            .init();
    } else {
        // Human-readable format for development
        tracing_subscriber::registry()
            .with(
                tracing_subscriber::fmt::layer()
                    .with_target(true)
                    .with_thread_ids(false)
                    .with_file(false)
                    .with_line_number(false)
                    .with_filter(filter),
            )
            .init();
    }

    // Build configuration
    let config = ServerConfig::new(&args.host, args.port)
        .with_database_path(&args.database)
        .with_verbose(args.verbose);

    // Log startup info with structured fields (useful for JSON format)
    tracing::info!(
        version = env!("CARGO_PKG_VERSION"),
        host = %args.host,
        port = %args.port,
        database = %args.database,
        verbose = args.verbose,
        json_format = args.json,
        "OpenFlow Server starting"
    );

    // Start server
    if let Err(e) = start_server(config).await {
        tracing::error!(error = %e, "Server startup failed");
        std::process::exit(1);
    }

    Ok(())
}
