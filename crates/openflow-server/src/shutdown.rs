//! Graceful Shutdown Handling
//!
//! Provides primitives for coordinating graceful server shutdown.
//!
//! # Signal Handling
//!
//! On Unix systems, the server listens for:
//! - SIGTERM: Standard termination signal (e.g., from `kill`, systemd, Docker)
//! - SIGINT: Interrupt signal (Ctrl+C)
//!
//! On Windows, the server listens for:
//! - Ctrl+C signal
//!
//! # Programmatic Shutdown
//!
//! For embedded servers (e.g., in Tauri), use [`ShutdownSignal`] to trigger
//! shutdown programmatically:
//!
//! ```rust,ignore
//! use openflow_server::ShutdownSignal;
//!
//! let shutdown = ShutdownSignal::new();
//! let trigger = shutdown.clone();
//!
//! // In shutdown handler:
//! trigger.trigger();
//!
//! // Wait for shutdown:
//! shutdown.wait().await;
//! ```

use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Arc;

use tokio::sync::Notify;

/// A signal that can be used to trigger and await graceful shutdown.
///
/// This is a clone-able handle that can be shared across tasks:
/// - One copy can be used to trigger shutdown (e.g., from a signal handler)
/// - Other copies can await shutdown notification
///
/// # Example
///
/// ```rust,ignore
/// use openflow_server::ShutdownSignal;
///
/// let shutdown = ShutdownSignal::new();
///
/// // Clone for the signal handler
/// let trigger = shutdown.clone();
///
/// // Spawn a task that will trigger shutdown
/// tokio::spawn(async move {
///     tokio::time::sleep(std::time::Duration::from_secs(5)).await;
///     trigger.trigger();
/// });
///
/// // Wait for shutdown in the main task
/// shutdown.wait().await;
/// println!("Shutdown triggered!");
/// ```
#[derive(Clone)]
pub struct ShutdownSignal {
    inner: Arc<ShutdownInner>,
}

struct ShutdownInner {
    /// Whether shutdown has been triggered
    triggered: AtomicBool,
    /// Notifier for waiters
    notify: Notify,
}

impl ShutdownSignal {
    /// Create a new shutdown signal.
    pub fn new() -> Self {
        Self {
            inner: Arc::new(ShutdownInner {
                triggered: AtomicBool::new(false),
                notify: Notify::new(),
            }),
        }
    }

    /// Trigger the shutdown signal.
    ///
    /// This will wake up all tasks waiting on this signal.
    /// Calling this multiple times is safe (subsequent calls are no-ops).
    pub fn trigger(&self) {
        if !self.inner.triggered.swap(true, Ordering::SeqCst) {
            tracing::info!("Shutdown signal triggered");
            self.inner.notify.notify_waiters();
        }
    }

    /// Check if shutdown has been triggered.
    pub fn is_triggered(&self) -> bool {
        self.inner.triggered.load(Ordering::SeqCst)
    }

    /// Wait for the shutdown signal to be triggered.
    ///
    /// This returns immediately if shutdown has already been triggered.
    pub async fn wait(&self) {
        // Fast path: already triggered
        if self.is_triggered() {
            return;
        }

        // Wait for notification
        self.inner.notify.notified().await;
    }

    /// Create a future that resolves when shutdown is triggered.
    ///
    /// This is useful for `tokio::select!` and similar constructs.
    /// Returns a future that can be awaited or used in select!.
    pub async fn recv(&self) {
        self.wait().await
    }
}

impl Default for ShutdownSignal {
    fn default() -> Self {
        Self::new()
    }
}

impl std::fmt::Debug for ShutdownSignal {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.debug_struct("ShutdownSignal")
            .field("triggered", &self.is_triggered())
            .finish()
    }
}

/// Wait for OS shutdown signals (SIGTERM, SIGINT).
///
/// This function returns when any of the following signals are received:
/// - SIGTERM (Unix only)
/// - SIGINT (Ctrl+C on all platforms)
///
/// # Example
///
/// ```rust,ignore
/// use openflow_server::shutdown::wait_for_signal;
///
/// async fn run_server() {
///     // ... server setup ...
///
///     // Wait for shutdown signal
///     wait_for_signal().await;
///
///     // ... cleanup ...
/// }
/// ```
pub async fn wait_for_signal() {
    #[cfg(unix)]
    {
        use tokio::signal::unix::{signal, SignalKind};

        let mut sigterm = signal(SignalKind::terminate())
            .expect("Failed to install SIGTERM handler");
        let mut sigint = signal(SignalKind::interrupt())
            .expect("Failed to install SIGINT handler");

        tokio::select! {
            _ = sigterm.recv() => {
                tracing::info!("Received SIGTERM");
            }
            _ = sigint.recv() => {
                tracing::info!("Received SIGINT");
            }
        }
    }

    #[cfg(not(unix))]
    {
        tokio::signal::ctrl_c()
            .await
            .expect("Failed to install Ctrl+C handler");
        tracing::info!("Received Ctrl+C");
    }
}

/// Create a shutdown signal that triggers on OS signals.
///
/// Returns a `ShutdownSignal` that will be triggered when SIGTERM or SIGINT
/// is received. This spawns a background task to handle signal watching.
///
/// # Example
///
/// ```rust,ignore
/// use openflow_server::shutdown::signal_shutdown;
///
/// let shutdown = signal_shutdown();
///
/// // Pass to server
/// start_server_with_shutdown(config, shutdown).await;
/// ```
pub fn signal_shutdown() -> ShutdownSignal {
    let signal = ShutdownSignal::new();
    let trigger = signal.clone();

    tokio::spawn(async move {
        wait_for_signal().await;
        trigger.trigger();
    });

    signal
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::time::Duration;

    #[tokio::test]
    async fn test_shutdown_signal_new() {
        let signal = ShutdownSignal::new();
        assert!(!signal.is_triggered());
    }

    #[tokio::test]
    async fn test_shutdown_signal_trigger() {
        let signal = ShutdownSignal::new();
        assert!(!signal.is_triggered());

        signal.trigger();
        assert!(signal.is_triggered());

        // Triggering again is a no-op
        signal.trigger();
        assert!(signal.is_triggered());
    }

    #[tokio::test]
    async fn test_shutdown_signal_wait_after_trigger() {
        let signal = ShutdownSignal::new();
        signal.trigger();

        // Should return immediately
        tokio::time::timeout(Duration::from_millis(100), signal.wait())
            .await
            .expect("wait() should return immediately after trigger");
    }

    #[tokio::test]
    async fn test_shutdown_signal_wait_before_trigger() {
        let signal = ShutdownSignal::new();
        let trigger = signal.clone();

        // Spawn a task to trigger after a delay
        tokio::spawn(async move {
            tokio::time::sleep(Duration::from_millis(50)).await;
            trigger.trigger();
        });

        // Wait should resolve after trigger
        tokio::time::timeout(Duration::from_millis(200), signal.wait())
            .await
            .expect("wait() should return after trigger");
    }

    #[tokio::test]
    async fn test_shutdown_signal_multiple_waiters() {
        let signal = ShutdownSignal::new();
        let s1 = signal.clone();
        let s2 = signal.clone();

        let waiter1 = tokio::spawn(async move { s1.wait().await });
        let waiter2 = tokio::spawn(async move { s2.wait().await });

        // Give waiters time to start
        tokio::time::sleep(Duration::from_millis(10)).await;

        // Trigger shutdown
        signal.trigger();

        // Both waiters should complete
        tokio::time::timeout(Duration::from_millis(100), waiter1)
            .await
            .expect("timeout")
            .expect("waiter1 should complete");

        tokio::time::timeout(Duration::from_millis(100), waiter2)
            .await
            .expect("timeout")
            .expect("waiter2 should complete");
    }

    #[tokio::test]
    async fn test_shutdown_signal_recv() {
        let signal = ShutdownSignal::new();
        let trigger = signal.clone();

        tokio::spawn(async move {
            tokio::time::sleep(Duration::from_millis(50)).await;
            trigger.trigger();
        });

        // Use in select!
        tokio::select! {
            _ = signal.recv() => {
                // Expected path
            }
            _ = tokio::time::sleep(Duration::from_millis(200)) => {
                panic!("recv() should have completed before timeout");
            }
        }
    }

    #[tokio::test]
    async fn test_shutdown_signal_default() {
        let signal = ShutdownSignal::default();
        assert!(!signal.is_triggered());
    }

    #[tokio::test]
    async fn test_shutdown_signal_debug() {
        let signal = ShutdownSignal::new();
        let debug = format!("{:?}", signal);
        assert!(debug.contains("ShutdownSignal"));
        assert!(debug.contains("triggered"));
    }
}
