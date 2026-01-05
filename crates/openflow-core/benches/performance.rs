//! Performance Benchmarks for OpenFlow Agent Orchestration
//!
//! This benchmark suite measures performance for the agent orchestration system:
//! - Event throughput: Target 1000+ events/second
//! - Memory: No growth over long-running task (sustained throughput test)
//! - Query latency: Target <100ms for event fetch, <50ms for incremental
//!
//! Run with: cargo bench -p openflow-core
//!
//! For detailed reports: cargo bench -p openflow-core -- --verbose
//!
//! Note: Benchmarks automatically run in release mode.
//! Results are stored in `target/criterion/` with HTML reports.

use std::time::{Duration, Instant};

use criterion::{black_box, criterion_group, criterion_main, Criterion, BenchmarkId, Throughput};
use sqlx::SqlitePool;
use tokio::runtime::Runtime;
use tempfile::TempDir;

use openflow_core::services::agent_session;
use openflow_db::{init_db, DbConfig};

// =============================================================================
// Test Fixtures
// =============================================================================

/// Create an in-memory test database
async fn create_test_db() -> (SqlitePool, TempDir) {
    let temp_dir = TempDir::new().expect("Failed to create temp dir");
    let config = DbConfig::from_directory(temp_dir.path());
    let pool = init_db(config)
        .await
        .expect("Failed to initialize test database");
    (pool, temp_dir)
}

/// Create a test execution process (required for FK)
async fn create_test_process(pool: &SqlitePool) -> String {
    let id = uuid::Uuid::new_v4().to_string();
    let project_id = uuid::Uuid::new_v4().to_string();
    let task_id = uuid::Uuid::new_v4().to_string();
    let chat_id = uuid::Uuid::new_v4().to_string();

    // Create project
    sqlx::query(
        "INSERT INTO projects (id, name, git_repo_path) VALUES (?, 'Bench Project', '/tmp/bench')",
    )
    .bind(&project_id)
    .execute(pool)
    .await
    .expect("Failed to create test project");

    // Create task
    sqlx::query(
        "INSERT INTO tasks (id, project_id, title, status) VALUES (?, ?, 'Bench Task', 'running')",
    )
    .bind(&task_id)
    .bind(&project_id)
    .execute(pool)
    .await
    .expect("Failed to create test task");

    // Create chat (project_id is required after migration 003)
    sqlx::query(
        "INSERT INTO chats (id, task_id, project_id, title) VALUES (?, ?, ?, 'Bench Chat')",
    )
    .bind(&chat_id)
    .bind(&task_id)
    .bind(&project_id)
    .execute(pool)
    .await
    .expect("Failed to create test chat");

    // Create execution process (uses chat_id FK)
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
// Event Throughput Benchmark
// =============================================================================

/// Benchmark: Event insertion throughput
/// Target: 1000 events/second
fn bench_event_throughput(c: &mut Criterion) {
    let rt = Runtime::new().unwrap();

    let mut group = c.benchmark_group("event_throughput");
    group.sample_size(20);
    group.measurement_time(Duration::from_secs(10));

    // Test with different batch sizes
    for batch_size in [100, 500, 1000] {
        group.throughput(Throughput::Elements(batch_size as u64));

        group.bench_with_input(
            BenchmarkId::new("add_events", batch_size),
            &batch_size,
            |b, &size| {
                b.iter_custom(|iters| {
                    rt.block_on(async {
                        let mut total_duration = Duration::ZERO;

                        for _ in 0..iters {
                            let (pool, _temp_dir) = create_test_db().await;
                            let process_id = create_test_process(&pool).await;

                            let session = agent_session::create(
                                &pool,
                                agent_session::CreateSessionRequest::new(&process_id, "claude-code"),
                            )
                            .await
                            .unwrap();

                            let start = Instant::now();

                            for i in 0..size {
                                let payload = serde_json::json!({
                                    "type": "message",
                                    "content": format!("Event content {}", i),
                                    "timestamp": chrono::Utc::now().to_rfc3339(),
                                });
                                let _ = agent_session::add_event(
                                    &pool,
                                    &session.id,
                                    "message",
                                    &payload,
                                )
                                .await;
                            }

                            total_duration += start.elapsed();
                        }

                        total_duration
                    })
                });
            },
        );
    }

    group.finish();
}

// =============================================================================
// Query Latency Benchmark
// =============================================================================

/// Benchmark: Event query latency
/// Target: <100ms for event fetch
fn bench_query_latency(c: &mut Criterion) {
    let rt = Runtime::new().unwrap();

    let mut group = c.benchmark_group("query_latency");
    group.sample_size(50);
    group.measurement_time(Duration::from_secs(5));

    // Pre-populate database with events, then query
    for event_count in [100, 500, 1000, 5000] {
        group.bench_with_input(
            BenchmarkId::new("get_events", event_count),
            &event_count,
            |b, &count| {
                // Setup: create DB and populate with events
                let (pool, session_id) = rt.block_on(async {
                    let (pool, _temp_dir) = create_test_db().await;
                    let process_id = create_test_process(&pool).await;

                    let session = agent_session::create(
                        &pool,
                        agent_session::CreateSessionRequest::new(&process_id, "claude-code"),
                    )
                    .await
                    .unwrap();

                    // Pre-populate with events
                    for i in 0..count {
                        let payload = serde_json::json!({
                            "type": "message",
                            "content": format!("Event {}", i),
                        });
                        let _ = agent_session::add_event(&pool, &session.id, "message", &payload)
                            .await;
                    }

                    // Keep pool alive by leaking it (for benchmark purposes)
                    let pool: &'static SqlitePool = Box::leak(Box::new(pool));
                    (pool, session.id)
                });

                b.to_async(&rt).iter(|| async {
                    let events = agent_session::get_events(pool, &session_id, None)
                        .await
                        .unwrap();
                    black_box(events)
                });
            },
        );
    }

    group.finish();
}

/// Benchmark: Event query with sequence filter (incremental fetch)
fn bench_incremental_query(c: &mut Criterion) {
    let rt = Runtime::new().unwrap();

    let mut group = c.benchmark_group("incremental_query");
    group.sample_size(100);

    // Setup once with 5000 events
    let (pool, session_id) = rt.block_on(async {
        let (pool, _temp_dir) = create_test_db().await;
        let process_id = create_test_process(&pool).await;

        let session = agent_session::create(
            &pool,
            agent_session::CreateSessionRequest::new(&process_id, "claude-code"),
        )
        .await
        .unwrap();

        // Pre-populate
        for i in 0..5000 {
            let payload = serde_json::json!({"i": i});
            let _ = agent_session::add_event(&pool, &session.id, "message", &payload).await;
        }

        let pool: &'static SqlitePool = Box::leak(Box::new(pool));
        (pool, session.id)
    });

    // Test different "after_sequence" values (simulating incremental fetches)
    for after_seq in [0, 1000, 2500, 4000, 4900] {
        group.bench_with_input(
            BenchmarkId::new("after_sequence", after_seq),
            &after_seq,
            |b, &seq| {
                b.to_async(&rt).iter(|| async {
                    let events = agent_session::get_events(pool, &session_id, Some(seq))
                        .await
                        .unwrap();
                    black_box(events)
                });
            },
        );
    }

    group.finish();
}

// =============================================================================
// Session Operations Benchmark
// =============================================================================

/// Benchmark: Session creation and state queries
fn bench_session_operations(c: &mut Criterion) {
    let rt = Runtime::new().unwrap();

    let mut group = c.benchmark_group("session_operations");
    group.sample_size(100);

    group.bench_function("create_session", |b| {
        b.to_async(&rt).iter_custom(|iters| async move {
            let (pool, _temp_dir) = create_test_db().await;
            let process_id = create_test_process(&pool).await;

            let start = Instant::now();
            for _ in 0..iters {
                let _ = agent_session::create(
                    &pool,
                    agent_session::CreateSessionRequest::new(&process_id, "claude-code"),
                )
                .await;
            }
            start.elapsed()
        });
    });

    group.bench_function("get_session", |b| {
        let (pool, session_id) = rt.block_on(async {
            let (pool, _temp_dir) = create_test_db().await;
            let process_id = create_test_process(&pool).await;

            let session = agent_session::create(
                &pool,
                agent_session::CreateSessionRequest::new(&process_id, "claude-code"),
            )
            .await
            .unwrap();

            let pool: &'static SqlitePool = Box::leak(Box::new(pool));
            (pool, session.id)
        });

        b.to_async(&rt).iter(|| async {
            let session = agent_session::get(pool, &session_id).await.unwrap();
            black_box(session)
        });
    });

    group.bench_function("get_session_with_state", |b| {
        let (pool, session_id) = rt.block_on(async {
            let (pool, _temp_dir) = create_test_db().await;
            let process_id = create_test_process(&pool).await;

            let session = agent_session::create(
                &pool,
                agent_session::CreateSessionRequest::new(&process_id, "claude-code"),
            )
            .await
            .unwrap();

            // Add some events and a permission for realistic state
            for i in 0..50 {
                let payload = serde_json::json!({"i": i});
                let _ = agent_session::add_event(&pool, &session.id, "message", &payload).await;
            }

            let _ = agent_session::create_permission(
                &pool,
                &session.id,
                "Write",
                "Create file",
                Some("/src/test.rs"),
            )
            .await;

            let pool: &'static SqlitePool = Box::leak(Box::new(pool));
            (pool, session.id)
        });

        b.to_async(&rt).iter(|| async {
            let state = agent_session::get_with_state(pool, &session_id)
                .await
                .unwrap();
            black_box(state)
        });
    });

    group.finish();
}

// =============================================================================
// Memory Benchmark (not directly measurable in criterion, but we can track allocations)
// =============================================================================

/// Benchmark: Sustained event processing (to verify no memory growth)
/// This doesn't directly measure memory, but verifies consistent timing
fn bench_sustained_throughput(c: &mut Criterion) {
    let rt = Runtime::new().unwrap();

    let mut group = c.benchmark_group("sustained_throughput");
    group.sample_size(10);
    group.measurement_time(Duration::from_secs(30));

    // Run 10,000 events in batches to simulate long-running task
    group.bench_function("10k_events_sustained", |b| {
        b.iter_custom(|iters| {
            rt.block_on(async {
                let mut total_duration = Duration::ZERO;

                for _ in 0..iters {
                    let (pool, _temp_dir) = create_test_db().await;
                    let process_id = create_test_process(&pool).await;

                    let session = agent_session::create(
                        &pool,
                        agent_session::CreateSessionRequest::new(&process_id, "claude-code"),
                    )
                    .await
                    .unwrap();

                    let start = Instant::now();

                    // Insert 10,000 events
                    for batch in 0..100 {
                        for i in 0..100 {
                            let event_num = batch * 100 + i;
                            let payload = serde_json::json!({
                                "type": "message",
                                "batch": batch,
                                "index": i,
                                "content": format!("Sustained event {}", event_num),
                            });
                            let _ = agent_session::add_event(
                                &pool,
                                &session.id,
                                "message",
                                &payload,
                            )
                            .await;
                        }
                    }

                    total_duration += start.elapsed();
                }

                total_duration
            })
        });
    });

    group.finish();
}

// =============================================================================
// Permission Operations Benchmark
// =============================================================================

/// Benchmark: Permission operations
fn bench_permission_operations(c: &mut Criterion) {
    let rt = Runtime::new().unwrap();

    let mut group = c.benchmark_group("permission_operations");
    group.sample_size(100);

    group.bench_function("create_permission", |b| {
        let (pool, session_id) = rt.block_on(async {
            let (pool, _temp_dir) = create_test_db().await;
            let process_id = create_test_process(&pool).await;

            let session = agent_session::create(
                &pool,
                agent_session::CreateSessionRequest::new(&process_id, "claude-code"),
            )
            .await
            .unwrap();

            let pool: &'static SqlitePool = Box::leak(Box::new(pool));
            (pool, session.id)
        });

        b.to_async(&rt).iter(|| async {
            let permission = agent_session::create_permission(
                pool,
                &session_id,
                "Write",
                "Create a new file",
                Some("/src/benchmark.rs"),
            )
            .await
            .unwrap();
            black_box(permission)
        });
    });

    group.bench_function("get_pending_permission", |b| {
        let (pool, session_id) = rt.block_on(async {
            let (pool, _temp_dir) = create_test_db().await;
            let process_id = create_test_process(&pool).await;

            let session = agent_session::create(
                &pool,
                agent_session::CreateSessionRequest::new(&process_id, "claude-code"),
            )
            .await
            .unwrap();

            // Create a pending permission
            let _ = agent_session::create_permission(
                &pool,
                &session.id,
                "Write",
                "Create file",
                Some("/src/test.rs"),
            )
            .await;

            let pool: &'static SqlitePool = Box::leak(Box::new(pool));
            (pool, session.id)
        });

        b.to_async(&rt).iter(|| async {
            let pending = agent_session::get_pending_permission(pool, &session_id)
                .await
                .unwrap();
            black_box(pending)
        });
    });

    group.finish();
}

// =============================================================================
// Criterion Configuration
// =============================================================================

criterion_group!(
    benches,
    bench_event_throughput,
    bench_query_latency,
    bench_incremental_query,
    bench_session_operations,
    bench_sustained_throughput,
    bench_permission_operations,
);

criterion_main!(benches);
