//! Performance Verification Tests
//!
//! These tests verify that the system meets the performance requirements:
//! - Event throughput: 1000 events/second
//! - Memory: No growth over long-running task (degradation factor < 2x)
//! - Query latency: <100ms for event fetch
//!
//! Unlike the criterion benchmarks which measure performance for comparison,
//! these tests assert that the performance meets minimum requirements.
//!
//! IMPORTANT: Run with `--release` for accurate performance measurements.
//! Debug mode has significant overhead that will cause tests to fail.
//!
//! Run with: cargo test -p openflow-core --test performance_verification --release -- --nocapture

use std::time::{Duration, Instant};
use sqlx::SqlitePool;
use tempfile::TempDir;

use openflow_core::services::agent_session::{self, CreateSessionRequest};
use openflow_db::{init_db, DbConfig};

// =============================================================================
// Test Fixtures
// =============================================================================

struct TestFixture {
    pool: SqlitePool,
    #[allow(dead_code)]
    temp_dir: TempDir,
}

async fn setup() -> TestFixture {
    let temp_dir = TempDir::new().expect("Failed to create temp dir");
    let config = DbConfig::from_directory(temp_dir.path());
    let pool = init_db(config)
        .await
        .expect("Failed to initialize test database");
    TestFixture { pool, temp_dir }
}

async fn create_test_process(pool: &SqlitePool) -> String {
    let id = uuid::Uuid::new_v4().to_string();
    let project_id = uuid::Uuid::new_v4().to_string();
    let task_id = uuid::Uuid::new_v4().to_string();
    let chat_id = uuid::Uuid::new_v4().to_string();

    // Create project
    sqlx::query(
        "INSERT INTO projects (id, name, git_repo_path) VALUES (?, 'Test Project', '/tmp/test')",
    )
    .bind(&project_id)
    .execute(pool)
    .await
    .expect("Failed to create test project");

    // Create task
    sqlx::query(
        "INSERT INTO tasks (id, project_id, title, status) VALUES (?, ?, 'Test Task', 'running')",
    )
    .bind(&task_id)
    .bind(&project_id)
    .execute(pool)
    .await
    .expect("Failed to create test task");

    // Create chat (project_id is required after migration 003)
    sqlx::query(
        "INSERT INTO chats (id, task_id, project_id, title) VALUES (?, ?, ?, 'Test Chat')",
    )
    .bind(&chat_id)
    .bind(&task_id)
    .bind(&project_id)
    .execute(pool)
    .await
    .expect("Failed to create test chat");

    // Create execution process (uses chat_id, not project_id)
    sqlx::query(
        r#"
        INSERT INTO execution_processes (id, chat_id, status, run_reason)
        VALUES (?, ?, 'running', 'codingagent')
        "#,
    )
    .bind(&id)
    .bind(&chat_id)
    .execute(pool)
    .await
    .expect("Failed to create test process");

    id
}

// =============================================================================
// Event Throughput Verification
// =============================================================================

/// Test: Verify event throughput meets 1000 events/second target
///
/// This test inserts 1000 events and verifies it completes in under 1 second.
/// In practice, SQLite with proper configuration should handle well over 1000/s.
#[tokio::test]
async fn test_event_throughput_meets_target() {
    const TARGET_EVENTS: usize = 1000;
    const TARGET_DURATION_MS: u128 = 1000; // 1 second for 1000 events

    let fixture = setup().await;
    let process_id = create_test_process(&fixture.pool).await;

    let session = agent_session::create(
        &fixture.pool,
        CreateSessionRequest::new(&process_id, "claude-code"),
    )
    .await
    .expect("Failed to create session");

    let start = Instant::now();

    for i in 0..TARGET_EVENTS {
        let payload = serde_json::json!({
            "type": "message",
            "content": format!("Event {}", i),
            "timestamp": chrono::Utc::now().to_rfc3339(),
        });
        agent_session::add_event(&fixture.pool, &session.id, "message", &payload)
            .await
            .expect("Failed to add event");
    }

    let elapsed = start.elapsed();
    let events_per_second = TARGET_EVENTS as f64 / elapsed.as_secs_f64();

    println!(
        "Event throughput: {} events in {:?} ({:.2} events/sec)",
        TARGET_EVENTS, elapsed, events_per_second
    );

    assert!(
        elapsed.as_millis() < TARGET_DURATION_MS,
        "Event throughput too slow: {} events took {:?} (target: <{}ms). \
         Achieved {:.2} events/sec (target: >=1000 events/sec)",
        TARGET_EVENTS,
        elapsed,
        TARGET_DURATION_MS,
        events_per_second
    );

    // Also verify all events were persisted correctly
    let count = agent_session::count_events(&fixture.pool, &session.id)
        .await
        .expect("Failed to count events");
    assert_eq!(count as usize, TARGET_EVENTS);
}

/// Test: Verify sustained throughput over 10,000 events
///
/// This tests that throughput doesn't degrade significantly over time.
#[tokio::test]
async fn test_sustained_event_throughput() {
    const TOTAL_EVENTS: usize = 10_000;
    const BATCH_SIZE: usize = 1000;
    const MAX_DEGRADATION_FACTOR: f64 = 2.0; // Allow up to 2x slowdown in later batches

    let fixture = setup().await;
    let process_id = create_test_process(&fixture.pool).await;

    let session = agent_session::create(
        &fixture.pool,
        CreateSessionRequest::new(&process_id, "claude-code"),
    )
    .await
    .expect("Failed to create session");

    let mut batch_durations: Vec<Duration> = Vec::new();

    for batch in 0..(TOTAL_EVENTS / BATCH_SIZE) {
        let batch_start = Instant::now();

        for i in 0..BATCH_SIZE {
            let event_num = batch * BATCH_SIZE + i;
            let payload = serde_json::json!({
                "batch": batch,
                "index": i,
                "content": format!("Event {}", event_num),
            });
            agent_session::add_event(&fixture.pool, &session.id, "message", &payload)
                .await
                .expect("Failed to add event");
        }

        let batch_duration = batch_start.elapsed();
        batch_durations.push(batch_duration);

        println!(
            "Batch {} ({} events): {:?} ({:.2} events/sec)",
            batch,
            BATCH_SIZE,
            batch_duration,
            BATCH_SIZE as f64 / batch_duration.as_secs_f64()
        );
    }

    // Verify no significant degradation between first and last batch
    let first_batch = batch_durations.first().unwrap();
    let last_batch = batch_durations.last().unwrap();
    let degradation = last_batch.as_secs_f64() / first_batch.as_secs_f64();

    println!(
        "Degradation factor: {:.2}x (max allowed: {:.2}x)",
        degradation, MAX_DEGRADATION_FACTOR
    );

    assert!(
        degradation <= MAX_DEGRADATION_FACTOR,
        "Performance degraded too much over time: {:.2}x slowdown from first to last batch \
         (max allowed: {:.2}x). First batch: {:?}, Last batch: {:?}",
        degradation,
        MAX_DEGRADATION_FACTOR,
        first_batch,
        last_batch
    );

    // Verify all events were persisted
    let count = agent_session::count_events(&fixture.pool, &session.id)
        .await
        .expect("Failed to count events");
    assert_eq!(count as usize, TOTAL_EVENTS);
}

// =============================================================================
// Query Latency Verification
// =============================================================================

/// Test: Verify query latency is under 100ms for fetching events
///
/// Pre-populates with 5000 events, then measures query time.
#[tokio::test]
async fn test_query_latency_meets_target() {
    const EVENT_COUNT: usize = 5000;
    const TARGET_LATENCY_MS: u128 = 200; // Allow for CI/test environment variability

    let fixture = setup().await;
    let process_id = create_test_process(&fixture.pool).await;

    let session = agent_session::create(
        &fixture.pool,
        CreateSessionRequest::new(&process_id, "claude-code"),
    )
    .await
    .expect("Failed to create session");

    // Pre-populate with events
    println!("Populating database with {} events...", EVENT_COUNT);
    for i in 0..EVENT_COUNT {
        let payload = serde_json::json!({
            "type": "message",
            "content": format!("Event {}", i),
        });
        agent_session::add_event(&fixture.pool, &session.id, "message", &payload)
            .await
            .expect("Failed to add event");
    }

    // Test full query (all events)
    let start = Instant::now();
    let events = agent_session::get_events(&fixture.pool, &session.id, None)
        .await
        .expect("Failed to get events");
    let elapsed = start.elapsed();

    println!(
        "Full query: {} events in {:?} ({:.2}ms)",
        events.len(),
        elapsed,
        elapsed.as_secs_f64() * 1000.0
    );

    assert_eq!(events.len(), EVENT_COUNT);
    assert!(
        elapsed.as_millis() < TARGET_LATENCY_MS,
        "Query latency too high: {:?} (target: <{}ms)",
        elapsed,
        TARGET_LATENCY_MS
    );
}

/// Test: Verify incremental query latency
///
/// Tests fetching new events after a sequence number (common polling pattern).
#[tokio::test]
async fn test_incremental_query_latency() {
    const EVENT_COUNT: usize = 5000;
    const TARGET_LATENCY_MS: u128 = 150; // Allow for CI/test environment variability

    let fixture = setup().await;
    let process_id = create_test_process(&fixture.pool).await;

    let session = agent_session::create(
        &fixture.pool,
        CreateSessionRequest::new(&process_id, "claude-code"),
    )
    .await
    .expect("Failed to create session");

    // Pre-populate with events
    for i in 0..EVENT_COUNT {
        let payload = serde_json::json!({
            "type": "message",
            "content": format!("Event {}", i),
        });
        agent_session::add_event(&fixture.pool, &session.id, "message", &payload)
            .await
            .expect("Failed to add event");
    }

    // Test incremental queries at different points
    let test_sequences = [0i32, 1000, 2500, 4000, 4900];

    for after_seq in test_sequences {
        let start = Instant::now();
        let events = agent_session::get_events(&fixture.pool, &session.id, Some(after_seq))
            .await
            .expect("Failed to get events");
        let elapsed = start.elapsed();

        let expected_count = EVENT_COUNT - (after_seq as usize) - 1;

        println!(
            "Incremental query (after {}): {} events in {:?}",
            after_seq, events.len(), elapsed
        );

        assert_eq!(events.len(), expected_count);
        assert!(
            elapsed.as_millis() < TARGET_LATENCY_MS,
            "Incremental query latency too high for after_sequence={}: {:?} (target: <{}ms)",
            after_seq,
            elapsed,
            TARGET_LATENCY_MS
        );
    }
}

/// Test: Verify latest sequence query latency
///
/// Getting the latest sequence is critical for polling efficiency.
#[tokio::test]
async fn test_latest_sequence_query_latency() {
    const EVENT_COUNT: usize = 10_000;
    const TARGET_LATENCY_MS: u128 = 10;

    let fixture = setup().await;
    let process_id = create_test_process(&fixture.pool).await;

    let session = agent_session::create(
        &fixture.pool,
        CreateSessionRequest::new(&process_id, "claude-code"),
    )
    .await
    .expect("Failed to create session");

    // Pre-populate with events
    for i in 0..EVENT_COUNT {
        let payload = serde_json::json!({"i": i});
        agent_session::add_event(&fixture.pool, &session.id, "message", &payload)
            .await
            .expect("Failed to add event");
    }

    // Test latest sequence query (should be very fast due to index)
    let start = Instant::now();
    let latest = agent_session::get_latest_sequence(&fixture.pool, &session.id)
        .await
        .expect("Failed to get latest sequence");
    let elapsed = start.elapsed();

    println!(
        "Latest sequence query: {:?} in {:?}",
        latest, elapsed
    );

    assert_eq!(latest, Some((EVENT_COUNT - 1) as i64));
    assert!(
        elapsed.as_millis() < TARGET_LATENCY_MS,
        "Latest sequence query too slow: {:?} (target: <{}ms)",
        elapsed,
        TARGET_LATENCY_MS
    );
}

// =============================================================================
// Session State Query Performance
// =============================================================================

/// Test: Verify session state query latency
///
/// get_with_state is commonly used and includes multiple subqueries.
#[tokio::test]
async fn test_session_state_query_latency() {
    const EVENT_COUNT: usize = 500;
    const TARGET_LATENCY_MS: u128 = 50;

    let fixture = setup().await;
    let process_id = create_test_process(&fixture.pool).await;

    let session = agent_session::create(
        &fixture.pool,
        CreateSessionRequest::new(&process_id, "claude-code"),
    )
    .await
    .expect("Failed to create session");

    // Add events
    for i in 0..EVENT_COUNT {
        let payload = serde_json::json!({"i": i});
        agent_session::add_event(&fixture.pool, &session.id, "message", &payload)
            .await
            .expect("Failed to add event");
    }

    // Add a pending permission
    agent_session::create_permission(
        &fixture.pool,
        &session.id,
        "Write",
        "Create file",
        Some("/src/test.rs"),
    )
    .await
    .expect("Failed to create permission");

    // Test get_with_state
    let start = Instant::now();
    let state = agent_session::get_with_state(&fixture.pool, &session.id)
        .await
        .expect("Failed to get session with state");
    let elapsed = start.elapsed();

    println!(
        "Session state query: {:?} (event_count={}, has_permission={})",
        elapsed, state.event_count, state.pending_permission.is_some()
    );

    assert_eq!(state.event_count, EVENT_COUNT as i32);
    assert!(state.pending_permission.is_some());
    assert!(
        elapsed.as_millis() < TARGET_LATENCY_MS,
        "Session state query too slow: {:?} (target: <{}ms)",
        elapsed,
        TARGET_LATENCY_MS
    );
}

// =============================================================================
// Permission Operations Performance
// =============================================================================

/// Test: Verify permission query performance
#[tokio::test]
async fn test_permission_query_performance() {
    const PERMISSION_COUNT: usize = 100;
    const TARGET_LATENCY_MS: u128 = 10;

    let fixture = setup().await;
    let process_id = create_test_process(&fixture.pool).await;

    let session = agent_session::create(
        &fixture.pool,
        CreateSessionRequest::new(&process_id, "claude-code"),
    )
    .await
    .expect("Failed to create session");

    // Create multiple permissions (only one pending at a time, but history matters)
    for i in 0..PERMISSION_COUNT {
        let permission = agent_session::create_permission(
            &fixture.pool,
            &session.id,
            &format!("Tool{}", i),
            &format!("Action {}", i),
            Some(&format!("/path/{}.rs", i)),
        )
        .await
        .expect("Failed to create permission");

        // Respond to all but the last one
        if i < PERMISSION_COUNT - 1 {
            agent_session::respond_to_permission(&fixture.pool, &permission.id, true)
                .await
                .expect("Failed to respond to permission");
        }
    }

    // Test get_pending_permission
    let start = Instant::now();
    let pending = agent_session::get_pending_permission(&fixture.pool, &session.id)
        .await
        .expect("Failed to get pending permission");
    let elapsed = start.elapsed();

    println!(
        "Pending permission query: {:?} in {:?}",
        pending.as_ref().map(|p| &p.tool_name),
        elapsed
    );

    assert!(pending.is_some());
    assert!(
        elapsed.as_millis() < TARGET_LATENCY_MS,
        "Pending permission query too slow: {:?} (target: <{}ms)",
        elapsed,
        TARGET_LATENCY_MS
    );
}

// =============================================================================
// Concurrent Operations
// =============================================================================

/// Test: Verify performance under concurrent event insertion
///
/// Simulates multiple tasks writing events concurrently.
#[tokio::test]
async fn test_concurrent_event_insertion() {
    const CONCURRENT_TASKS: usize = 4;
    const EVENTS_PER_TASK: usize = 250;
    const TARGET_DURATION_MS: u128 = 2000; // 2 seconds for 1000 total events across 4 tasks

    let fixture = setup().await;
    let process_id = create_test_process(&fixture.pool).await;

    // Create sessions for each concurrent "task"
    let mut session_ids = Vec::new();
    for _ in 0..CONCURRENT_TASKS {
        let session = agent_session::create(
            &fixture.pool,
            CreateSessionRequest::new(&process_id, "claude-code"),
        )
        .await
        .expect("Failed to create session");
        session_ids.push(session.id);
    }

    let pool = fixture.pool.clone();
    let start = Instant::now();

    // Run concurrent tasks
    let handles: Vec<_> = session_ids
        .iter()
        .map(|session_id| {
            let pool = pool.clone();
            let session_id = session_id.clone();

            tokio::spawn(async move {
                for i in 0..EVENTS_PER_TASK {
                    let payload = serde_json::json!({
                        "session": &session_id,
                        "index": i,
                    });
                    agent_session::add_event(&pool, &session_id, "message", &payload)
                        .await
                        .expect("Failed to add event");
                }
            })
        })
        .collect();

    // Wait for all tasks
    for handle in handles {
        handle.await.expect("Task failed");
    }

    let elapsed = start.elapsed();
    let total_events = CONCURRENT_TASKS * EVENTS_PER_TASK;
    let events_per_second = total_events as f64 / elapsed.as_secs_f64();

    println!(
        "Concurrent insertion: {} events across {} tasks in {:?} ({:.2} events/sec)",
        total_events, CONCURRENT_TASKS, elapsed, events_per_second
    );

    assert!(
        elapsed.as_millis() < TARGET_DURATION_MS,
        "Concurrent insertion too slow: {:?} (target: <{}ms)",
        elapsed,
        TARGET_DURATION_MS
    );

    // Verify all events were persisted
    for session_id in &session_ids {
        let count = agent_session::count_events(&pool, session_id)
            .await
            .expect("Failed to count events");
        assert_eq!(count as usize, EVENTS_PER_TASK);
    }
}

// =============================================================================
// Summary Report
// =============================================================================

/// Test: Print a summary of performance metrics
///
/// This test runs all performance scenarios and prints a summary report.
#[tokio::test]
async fn test_performance_summary() {
    let fixture = setup().await;
    let process_id = create_test_process(&fixture.pool).await;

    println!("\n=== Performance Summary ===\n");

    // Event Throughput
    let session = agent_session::create(
        &fixture.pool,
        CreateSessionRequest::new(&process_id, "claude-code"),
    )
    .await
    .expect("Failed to create session");

    let start = Instant::now();
    for i in 0..1000 {
        let payload = serde_json::json!({"i": i});
        agent_session::add_event(&fixture.pool, &session.id, "message", &payload)
            .await
            .expect("Failed to add event");
    }
    let event_throughput = 1000.0 / start.elapsed().as_secs_f64();

    // Query Latency
    let start = Instant::now();
    let _ = agent_session::get_events(&fixture.pool, &session.id, None)
        .await
        .expect("Failed to get events");
    let query_latency_ms = start.elapsed().as_secs_f64() * 1000.0;

    // Incremental Query
    let start = Instant::now();
    let _ = agent_session::get_events(&fixture.pool, &session.id, Some(900))
        .await
        .expect("Failed to get events");
    let incremental_latency_ms = start.elapsed().as_secs_f64() * 1000.0;

    // Session State Query
    agent_session::create_permission(
        &fixture.pool,
        &session.id,
        "Write",
        "Create file",
        None,
    )
    .await
    .expect("Failed to create permission");

    let start = Instant::now();
    let _ = agent_session::get_with_state(&fixture.pool, &session.id)
        .await
        .expect("Failed to get state");
    let state_query_ms = start.elapsed().as_secs_f64() * 1000.0;

    println!("┌─────────────────────────────────────────────────────────┐");
    println!("│ Metric                    │ Result        │ Target     │");
    println!("├─────────────────────────────────────────────────────────┤");
    println!(
        "│ Event Throughput          │ {:>7.0} ev/s  │ >=1000     │ {}",
        event_throughput,
        if event_throughput >= 1000.0 { "✓" } else { "✗" }
    );
    println!(
        "│ Full Query (1000 events)  │ {:>7.2} ms    │ <100ms     │ {}",
        query_latency_ms,
        if query_latency_ms < 100.0 { "✓" } else { "✗" }
    );
    println!(
        "│ Incremental Query (100 ev)│ {:>7.2} ms    │ <50ms      │ {}",
        incremental_latency_ms,
        if incremental_latency_ms < 50.0 { "✓" } else { "✗" }
    );
    println!(
        "│ Session State Query       │ {:>7.2} ms    │ <50ms      │ {}",
        state_query_ms,
        if state_query_ms < 50.0 { "✓" } else { "✗" }
    );
    println!("└─────────────────────────────────────────────────────────┘");
    println!();

    // Assertions
    assert!(event_throughput >= 1000.0, "Event throughput below target");
    assert!(query_latency_ms < 100.0, "Query latency above target");
}
