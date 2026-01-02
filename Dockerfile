# OpenFlow Server Dockerfile
#
# Multi-stage build for minimal production image.
#
# Build: docker build -t openflow-server .
# Run:   docker run -p 3001:3001 -v openflow-data:/app/data openflow-server
#
# Environment variables:
#   OPENFLOW_HOST     - Bind address (default: 0.0.0.0)
#   OPENFLOW_PORT     - Server port (default: 3001)
#   DATABASE_PATH     - SQLite database path (default: /app/data/openflow.db)
#   RUST_LOG          - Log level filter (default: info)
#   OPENFLOW_VERBOSE  - Enable debug logging (set to 1)
#   OPENFLOW_JSON_LOGS - Enable JSON log format (set to 1)

# =============================================================================
# Build Stage
# =============================================================================
FROM rust:1.87-slim-bookworm AS builder

# Install build dependencies
RUN apt-get update && apt-get install -y \
    pkg-config \
    libssl-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy workspace configuration first (for dependency caching)
COPY Cargo.toml Cargo.lock ./

# Copy all crate manifests
COPY crates/openflow-contracts/Cargo.toml crates/openflow-contracts/
COPY crates/openflow-db/Cargo.toml crates/openflow-db/
COPY crates/openflow-core/Cargo.toml crates/openflow-core/
COPY crates/openflow-process/Cargo.toml crates/openflow-process/
COPY crates/openflow-server/Cargo.toml crates/openflow-server/
COPY src-tauri/Cargo.toml src-tauri/

# Create dummy source files to build dependencies
RUN mkdir -p crates/openflow-contracts/src \
    && echo "pub fn dummy() {}" > crates/openflow-contracts/src/lib.rs \
    && mkdir -p crates/openflow-db/src \
    && echo "pub fn dummy() {}" > crates/openflow-db/src/lib.rs \
    && mkdir -p crates/openflow-core/src \
    && echo "pub fn dummy() {}" > crates/openflow-core/src/lib.rs \
    && mkdir -p crates/openflow-process/src \
    && echo "pub fn dummy() {}" > crates/openflow-process/src/lib.rs \
    && mkdir -p crates/openflow-server/src \
    && echo "fn main() {}" > crates/openflow-server/src/main.rs \
    && echo "pub fn dummy() {}" > crates/openflow-server/src/lib.rs \
    && mkdir -p src-tauri/src \
    && echo "fn main() {}" > src-tauri/src/main.rs \
    && echo "pub fn dummy() {}" > src-tauri/src/lib.rs

# Build dependencies only (this layer is cached)
RUN cargo build --release -p openflow-server 2>/dev/null || true

# Remove dummy source files
RUN rm -rf crates/*/src src-tauri/src

# Copy actual source code
COPY crates crates
COPY src-tauri/src src-tauri/src

# Touch main.rs to ensure rebuild
RUN touch crates/openflow-server/src/main.rs

# Build the actual application
RUN cargo build --release -p openflow-server

# =============================================================================
# Runtime Stage
# =============================================================================
FROM debian:bookworm-slim

# Install runtime dependencies
RUN apt-get update && apt-get install -y \
    ca-certificates \
    libssl3 \
    && rm -rf /var/lib/apt/lists/* \
    && useradd -r -s /bin/false openflow

WORKDIR /app

# Copy the built binary
COPY --from=builder /app/target/release/openflow-server /app/openflow-server

# Create data directory
RUN mkdir -p /app/data && chown -R openflow:openflow /app

# Switch to non-root user
USER openflow

# Configure environment
ENV OPENFLOW_HOST=0.0.0.0
ENV OPENFLOW_PORT=3001
ENV DATABASE_PATH=/app/data/openflow.db
ENV RUST_LOG=info

# Expose the server port
EXPOSE 3001

# Mount point for persistent data
VOLUME /app/data

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
    CMD ["/app/openflow-server", "--help"] || exit 1

# Run the server
ENTRYPOINT ["/app/openflow-server"]
CMD []
