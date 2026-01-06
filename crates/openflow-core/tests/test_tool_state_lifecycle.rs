//! Tool State Lifecycle Tests
//!
//! Comprehensive tests for tool state tracking from creation to completion:
//! - Tool creation from ToolUse events
//! - Tool completion from ToolResult events
//! - Metadata extraction (command, file_path, exit_code, duration)
//! - Orphaned tool result handling
//! - Tool state queries (running, history, pending)
//! - Error handling and edge cases
//!
//! # Tool Lifecycle
//!
//! ```text
//! ToolUse Event → create_from_tool_use() → ToolState (status: running)
//!                                                ↓
//! ToolResult Event → complete_from_tool_result() → ToolState (status: completed/error)
//! ```
//!
//! # Running Tests
//!
//! ```bash
//! cargo test --test test_tool_state_lifecycle
//! ```

use openflow_contracts::{ToolResultStatus, ToolStatus};
use openflow_core::services::tool_state;
use openflow_db::{init_db, DbConfig};
use sqlx::SqlitePool;
use tempfile::TempDir;
use uuid::Uuid;

// =============================================================================
// Test Fixture
// =============================================================================

/// Test fixture containing database and test session
struct ToolStateTestFixture {
    pool: SqlitePool,
    session_id: String,
    #[allow(dead_code)]
    temp_dir: TempDir,
}

impl ToolStateTestFixture {
    /// Create a new test fixture with initialized database
    async fn new() -> Self {
        let temp_dir = TempDir::new().expect("Failed to create temp dir");
        let config = DbConfig::from_directory(temp_dir.path());
        let pool = init_db(config)
            .await
            .expect("Failed to initialize test database");

        // Create test session
        let session_id = Self::create_test_session(&pool).await;

        Self {
            pool,
            session_id,
            temp_dir,
        }
    }

    /// Helper to create a test session (required for FK)
    async fn create_test_session(pool: &SqlitePool) -> String {
        let session_id = Uuid::new_v4().to_string();
        let process_id = Uuid::new_v4().to_string();
        let project_id = Uuid::new_v4().to_string();
        let task_id = Uuid::new_v4().to_string();
        let chat_id = Uuid::new_v4().to_string();

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
            r#"
            INSERT INTO tasks (id, project_id, title, status)
            VALUES (?, ?, 'Test Task', 'running')
            "#,
        )
        .bind(&task_id)
        .bind(&project_id)
        .execute(pool)
        .await
        .expect("Failed to create test task");

        // Create chat
        sqlx::query(
            r#"
            INSERT INTO chats (id, task_id, project_id, chat_role)
            VALUES (?, ?, ?, 'main')
            "#,
        )
        .bind(&chat_id)
        .bind(&task_id)
        .bind(&project_id)
        .execute(pool)
        .await
        .expect("Failed to create test chat");

        // Create execution process
        sqlx::query(
            r#"
            INSERT INTO execution_processes (id, chat_id, status, run_reason)
            VALUES (?, ?, 'running', 'codingagent')
            "#,
        )
        .bind(&process_id)
        .bind(&chat_id)
        .execute(pool)
        .await
        .expect("Failed to create test process");

        // Create agent session
        sqlx::query(
            r#"
            INSERT INTO agent_sessions (id, process_id, provider_id, status)
            VALUES (?, ?, 'mock', 'running')
            "#,
        )
        .bind(&session_id)
        .bind(&process_id)
        .execute(pool)
        .await
        .expect("Failed to create test session");

        session_id
    }
}

// =============================================================================
// Tool Creation Tests
// =============================================================================

#[tokio::test]
async fn test_create_read_tool() {
    let fixture = ToolStateTestFixture::new().await;

    let input = serde_json::json!({"path": "/src/main.rs"});
    let tool_state = tool_state::create_from_tool_use(
        &fixture.pool,
        &fixture.session_id,
        "tool-read-1",
        "Read",
        &input,
    )
    .await
    .expect("Failed to create tool state");

    assert_eq!(tool_state.tool_name, "Read");
    assert_eq!(tool_state.tool_use_id, "tool-read-1");
    assert!(tool_state.status.is_running());
    assert_eq!(tool_state.file_path, Some("/src/main.rs".to_string()));
    assert!(tool_state.command.is_none());
    assert!(tool_state.output.is_none());
    assert!(tool_state.completed_at.is_none());
}

#[tokio::test]
async fn test_create_write_tool() {
    let fixture = ToolStateTestFixture::new().await;

    let input = serde_json::json!({
        "path": "/src/lib.rs",
        "content": "pub fn test() {}"
    });
    let tool_state = tool_state::create_from_tool_use(
        &fixture.pool,
        &fixture.session_id,
        "tool-write-1",
        "Write",
        &input,
    )
    .await
    .expect("Failed to create tool state");

    assert_eq!(tool_state.tool_name, "Write");
    assert_eq!(tool_state.file_path, Some("/src/lib.rs".to_string()));
    assert!(tool_state.command.is_none());
}

#[tokio::test]
async fn test_create_bash_tool() {
    let fixture = ToolStateTestFixture::new().await;

    let input = serde_json::json!({"command": "ls -la"});
    let tool_state = tool_state::create_from_tool_use(
        &fixture.pool,
        &fixture.session_id,
        "tool-bash-1",
        "Bash",
        &input,
    )
    .await
    .expect("Failed to create tool state");

    assert_eq!(tool_state.tool_name, "Bash");
    assert_eq!(tool_state.command, Some("ls -la".to_string()));
    assert!(tool_state.file_path.is_none());
}

#[tokio::test]
async fn test_create_tool_alternate_field_names() {
    let fixture = ToolStateTestFixture::new().await;

    // Test "file_path" instead of "path"
    let input = serde_json::json!({"file_path": "/test.txt"});
    let tool_state = tool_state::create_from_tool_use(
        &fixture.pool,
        &fixture.session_id,
        "tool-1",
        "Read",
        &input,
    )
    .await
    .expect("Failed to create tool state");

    assert_eq!(tool_state.file_path, Some("/test.txt".to_string()));

    // Test "cmd" instead of "command"
    let input = serde_json::json!({"cmd": "echo test"});
    let tool_state = tool_state::create_from_tool_use(
        &fixture.pool,
        &fixture.session_id,
        "tool-2",
        "Shell",
        &input,
    )
    .await
    .expect("Failed to create tool state");

    assert_eq!(tool_state.command, Some("echo test".to_string()));
}

#[tokio::test]
async fn test_create_tool_no_extraction_for_non_matching() {
    let fixture = ToolStateTestFixture::new().await;

    // Command should not be extracted for non-bash tools
    let input = serde_json::json!({"command": "ls", "path": "/file.txt"});
    let tool_state = tool_state::create_from_tool_use(
        &fixture.pool,
        &fixture.session_id,
        "tool-custom-1",
        "CustomTool",
        &input,
    )
    .await
    .expect("Failed to create tool state");

    // Neither should be extracted for non-matching tool name
    assert!(tool_state.command.is_none());
    assert!(tool_state.file_path.is_none());
}

// =============================================================================
// Tool Completion Tests
// =============================================================================

#[tokio::test]
async fn test_complete_tool_success() {
    let fixture = ToolStateTestFixture::new().await;

    // Create tool
    let input = serde_json::json!({"path": "/src/main.rs"});
    tool_state::create_from_tool_use(
        &fixture.pool,
        &fixture.session_id,
        "tool-1",
        "Read",
        &input,
    )
    .await
    .expect("Failed to create tool");

    // Wait a bit to ensure measurable duration
    tokio::time::sleep(tokio::time::Duration::from_millis(10)).await;

    // Complete tool
    let completed = tool_state::complete_from_tool_result(
        &fixture.pool,
        &fixture.session_id,
        "tool-1",
        ToolResultStatus::Success,
        "fn main() {}",
    )
    .await
    .expect("Failed to complete tool");

    assert!(completed.status.is_completed());
    assert_eq!(completed.output, Some("fn main() {}".to_string()));
    assert_eq!(completed.is_error, 0);
    assert!(completed.completed_at.is_some());
    assert!(completed.duration_ms.is_some());
    assert!(completed.duration_ms.unwrap() >= 10);
    assert!(completed.stderr.is_none());
}

#[tokio::test]
async fn test_complete_tool_error() {
    let fixture = ToolStateTestFixture::new().await;

    // Create tool
    let input = serde_json::json!({"path": "/nonexistent.txt"});
    tool_state::create_from_tool_use(
        &fixture.pool,
        &fixture.session_id,
        "tool-1",
        "Read",
        &input,
    )
    .await
    .expect("Failed to create tool");

    // Complete with error
    let completed = tool_state::complete_from_tool_result(
        &fixture.pool,
        &fixture.session_id,
        "tool-1",
        ToolResultStatus::Error,
        "File not found",
    )
    .await
    .expect("Failed to complete tool");

    assert!(completed.status.is_error());
    assert_eq!(completed.output, Some("File not found".to_string()));
    assert_eq!(completed.is_error, 1);
    assert_eq!(completed.stderr, Some("File not found".to_string()));
}

#[tokio::test]
async fn test_complete_tool_cancelled() {
    let fixture = ToolStateTestFixture::new().await;

    // Create tool
    let input = serde_json::json!({"command": "sleep 100"});
    tool_state::create_from_tool_use(
        &fixture.pool,
        &fixture.session_id,
        "tool-1",
        "Bash",
        &input,
    )
    .await
    .expect("Failed to create tool");

    // Complete as cancelled
    let completed = tool_state::complete_from_tool_result(
        &fixture.pool,
        &fixture.session_id,
        "tool-1",
        ToolResultStatus::Cancelled,
        "User cancelled",
    )
    .await
    .expect("Failed to complete tool");

    assert!(completed.status.is_error());
    assert_eq!(completed.is_error, 1);
}

#[tokio::test]
async fn test_complete_bash_tool_with_exit_code() {
    let fixture = ToolStateTestFixture::new().await;

    // Create bash tool
    let input = serde_json::json!({"command": "ls -la"});
    tool_state::create_from_tool_use(
        &fixture.pool,
        &fixture.session_id,
        "tool-bash-1",
        "Bash",
        &input,
    )
    .await
    .expect("Failed to create tool");

    // Complete successfully
    let completed = tool_state::complete_from_tool_result(
        &fixture.pool,
        &fixture.session_id,
        "tool-bash-1",
        ToolResultStatus::Success,
        "file1.txt\nfile2.txt",
    )
    .await
    .expect("Failed to complete tool");

    // Verify exit_code was set for bash tool
    assert_eq!(completed.exit_code, Some(0));
    assert!(completed.stderr.is_none());
}

#[tokio::test]
async fn test_complete_bash_tool_error_with_exit_code() {
    let fixture = ToolStateTestFixture::new().await;

    // Create bash tool
    let input = serde_json::json!({"command": "invalid-command"});
    tool_state::create_from_tool_use(
        &fixture.pool,
        &fixture.session_id,
        "tool-bash-1",
        "Bash",
        &input,
    )
    .await
    .expect("Failed to create tool");

    // Complete with error
    let error_msg = "bash: invalid-command: command not found";
    let completed = tool_state::complete_from_tool_result(
        &fixture.pool,
        &fixture.session_id,
        "tool-bash-1",
        ToolResultStatus::Error,
        error_msg,
    )
    .await
    .expect("Failed to complete tool");

    // Verify exit_code was set to 1 for error
    assert_eq!(completed.exit_code, Some(1));
    assert_eq!(completed.stderr, Some(error_msg.to_string()));
}

#[tokio::test]
async fn test_complete_non_bash_tool_no_exit_code() {
    let fixture = ToolStateTestFixture::new().await;

    // Create non-bash tool (Read)
    let input = serde_json::json!({"path": "/file.txt"});
    tool_state::create_from_tool_use(
        &fixture.pool,
        &fixture.session_id,
        "tool-read-1",
        "Read",
        &input,
    )
    .await
    .expect("Failed to create tool");

    // Complete successfully
    let completed = tool_state::complete_from_tool_result(
        &fixture.pool,
        &fixture.session_id,
        "tool-read-1",
        ToolResultStatus::Success,
        "file contents",
    )
    .await
    .expect("Failed to complete tool");

    // Verify no exit_code for non-bash tools
    assert!(completed.exit_code.is_none());
    assert!(completed.stderr.is_none());
}

// =============================================================================
// Orphaned Tool Result Tests
// =============================================================================

#[tokio::test]
async fn test_complete_orphaned_result() {
    let fixture = ToolStateTestFixture::new().await;

    // Complete without creating tool first (orphaned result)
    let completed = tool_state::complete_from_tool_result(
        &fixture.pool,
        &fixture.session_id,
        "orphan-tool",
        ToolResultStatus::Success,
        "Orphaned output",
    )
    .await
    .expect("Failed to handle orphaned result");

    assert_eq!(completed.tool_use_id, "orphan-tool");
    assert_eq!(completed.tool_name, "unknown");
    assert!(completed.status.is_completed());
    assert!(completed.input.is_none());
    assert_eq!(completed.output, Some("Orphaned output".to_string()));
}

#[tokio::test]
async fn test_complete_orphaned_error() {
    let fixture = ToolStateTestFixture::new().await;

    // Complete orphaned result with error
    let completed = tool_state::complete_from_tool_result(
        &fixture.pool,
        &fixture.session_id,
        "orphan-error",
        ToolResultStatus::Error,
        "Something went wrong",
    )
    .await
    .expect("Failed to handle orphaned error");

    assert_eq!(completed.tool_name, "unknown");
    assert!(completed.status.is_error());
    assert_eq!(completed.stderr, Some("Something went wrong".to_string()));
}

// =============================================================================
// Tool State Query Tests
// =============================================================================

#[tokio::test]
async fn test_get_running_tools() {
    let fixture = ToolStateTestFixture::new().await;

    // Create multiple tools
    let input = serde_json::json!({"path": "/file1.txt"});
    tool_state::create_from_tool_use(&fixture.pool, &fixture.session_id, "tool-1", "Read", &input)
        .await
        .unwrap();
    
    let input = serde_json::json!({"path": "/file2.txt"});
    tool_state::create_from_tool_use(&fixture.pool, &fixture.session_id, "tool-2", "Write", &input)
        .await
        .unwrap();
    
    let input = serde_json::json!({"command": "ls"});
    tool_state::create_from_tool_use(&fixture.pool, &fixture.session_id, "tool-3", "Bash", &input)
        .await
        .unwrap();

    // Complete one tool
    tool_state::complete_from_tool_result(
        &fixture.pool,
        &fixture.session_id,
        "tool-1",
        ToolResultStatus::Success,
        "Done",
    )
    .await
    .unwrap();

    // Get running tools
    let running = tool_state::get_running_tools(&fixture.pool, &fixture.session_id)
        .await
        .expect("Failed to get running tools");

    // Should have 2 running tools (tool-2 and tool-3)
    assert_eq!(running.len(), 2);
    assert!(running.iter().all(|t| t.status.is_running()));
    assert!(running.iter().any(|t| t.tool_use_id == "tool-2"));
    assert!(running.iter().any(|t| t.tool_use_id == "tool-3"));
}

#[tokio::test]
async fn test_get_tool_history() {
    let fixture = ToolStateTestFixture::new().await;

    // Create multiple tools
    let input = serde_json::json!({"path": "/file1.txt"});
    tool_state::create_from_tool_use(&fixture.pool, &fixture.session_id, "tool-1", "Read", &input)
        .await
        .unwrap();
    
    let input = serde_json::json!({"path": "/file2.txt"});
    tool_state::create_from_tool_use(&fixture.pool, &fixture.session_id, "tool-2", "Write", &input)
        .await
        .unwrap();
    
    let input = serde_json::json!({"command": "ls"});
    tool_state::create_from_tool_use(&fixture.pool, &fixture.session_id, "tool-3", "Bash", &input)
        .await
        .unwrap();

    // Complete tools with different statuses
    tool_state::complete_from_tool_result(
        &fixture.pool,
        &fixture.session_id,
        "tool-1",
        ToolResultStatus::Success,
        "Read successful",
    )
    .await
    .unwrap();

    // Small delay to ensure different completion times
    tokio::time::sleep(tokio::time::Duration::from_millis(10)).await;

    tool_state::complete_from_tool_result(
        &fixture.pool,
        &fixture.session_id,
        "tool-2",
        ToolResultStatus::Error,
        "Write failed",
    )
    .await
    .unwrap();

    // Get tool history
    let history = tool_state::get_tool_history(&fixture.pool, &fixture.session_id)
        .await
        .expect("Failed to get tool history");

    // Should have 2 completed tools (tool-1 and tool-2)
    assert_eq!(history.len(), 2);
    
    // Verify all are completed or error
    assert!(history.iter().all(|t| t.status.is_completed() || t.status.is_error()));
    
    // Verify ordering by completed_at DESC (most recent first)
    // tool-2 should be first since it was completed later
    assert_eq!(history[0].tool_use_id, "tool-2");
    assert_eq!(history[1].tool_use_id, "tool-1");
}

#[tokio::test]
async fn test_running_vs_history_disjoint() {
    let fixture = ToolStateTestFixture::new().await;

    // Create multiple tools
    let input = serde_json::json!({"path": "/file1.txt"});
    tool_state::create_from_tool_use(&fixture.pool, &fixture.session_id, "tool-1", "Read", &input)
        .await
        .unwrap();
    
    let input = serde_json::json!({"path": "/file2.txt"});
    tool_state::create_from_tool_use(&fixture.pool, &fixture.session_id, "tool-2", "Write", &input)
        .await
        .unwrap();
    
    let input = serde_json::json!({"command": "ls"});
    tool_state::create_from_tool_use(&fixture.pool, &fixture.session_id, "tool-3", "Bash", &input)
        .await
        .unwrap();

    // Complete one tool
    tool_state::complete_from_tool_result(
        &fixture.pool,
        &fixture.session_id,
        "tool-1",
        ToolResultStatus::Success,
        "Done",
    )
    .await
    .unwrap();

    // Get both running and history
    let running = tool_state::get_running_tools(&fixture.pool, &fixture.session_id)
        .await
        .expect("Failed to get running tools");
    let history = tool_state::get_tool_history(&fixture.pool, &fixture.session_id)
        .await
        .expect("Failed to get tool history");

    // Verify they are disjoint sets
    assert_eq!(running.len(), 2); // tool-2, tool-3
    assert_eq!(history.len(), 1); // tool-1

    // Verify no overlap
    let running_ids: Vec<_> = running.iter().map(|t| &t.tool_use_id).collect();
    let history_ids: Vec<_> = history.iter().map(|t| &t.tool_use_id).collect();
    
    for id in &running_ids {
        assert!(!history_ids.contains(id));
    }
    for id in &history_ids {
        assert!(!running_ids.contains(id));
    }

    // Verify total count matches
    let all_tools = tool_state::list_by_session(&fixture.pool, &fixture.session_id)
        .await
        .unwrap();
    assert_eq!(all_tools.len(), running.len() + history.len());
}

#[tokio::test]
async fn test_get_pending_tools() {
    let fixture = ToolStateTestFixture::new().await;

    // Create tools
    let input = serde_json::json!({"path": "/file1.txt"});
    tool_state::create_from_tool_use(&fixture.pool, &fixture.session_id, "tool-1", "Read", &input)
        .await
        .unwrap();
    
    let input = serde_json::json!({"path": "/file2.txt"});
    tool_state::create_from_tool_use(&fixture.pool, &fixture.session_id, "tool-2", "Write", &input)
        .await
        .unwrap();

    // Complete one
    tool_state::complete_from_tool_result(
        &fixture.pool,
        &fixture.session_id,
        "tool-1",
        ToolResultStatus::Success,
        "Done",
    )
    .await
    .unwrap();

    let pending = tool_state::get_pending(&fixture.pool, &fixture.session_id)
        .await
        .expect("Failed to get pending");

    assert_eq!(pending.len(), 1);
    assert_eq!(pending[0].tool_use_id, "tool-2");
}

#[tokio::test]
async fn test_count_tools() {
    let fixture = ToolStateTestFixture::new().await;

    // Create tools
    let input = serde_json::json!({"path": "/file1.txt"});
    tool_state::create_from_tool_use(&fixture.pool, &fixture.session_id, "tool-1", "Read", &input)
        .await
        .unwrap();
    
    let input = serde_json::json!({"path": "/file2.txt"});
    tool_state::create_from_tool_use(&fixture.pool, &fixture.session_id, "tool-2", "Write", &input)
        .await
        .unwrap();

    // Complete one
    tool_state::complete_from_tool_result(
        &fixture.pool,
        &fixture.session_id,
        "tool-1",
        ToolResultStatus::Success,
        "Done",
    )
    .await
    .unwrap();

    let total = tool_state::count(&fixture.pool, &fixture.session_id, None)
        .await
        .expect("Failed to count");
    assert_eq!(total, 2);

    let running = tool_state::count(&fixture.pool, &fixture.session_id, Some(ToolStatus::Running))
        .await
        .expect("Failed to count running");
    assert_eq!(running, 1);

    let completed = tool_state::count(&fixture.pool, &fixture.session_id, Some(ToolStatus::Completed))
        .await
        .expect("Failed to count completed");
    assert_eq!(completed, 1);
}

// =============================================================================
// Fail Pending Tests
// =============================================================================

#[tokio::test]
async fn test_fail_pending() {
    let fixture = ToolStateTestFixture::new().await;

    // Create tools
    let input = serde_json::json!({"path": "/file1.txt"});
    tool_state::create_from_tool_use(&fixture.pool, &fixture.session_id, "tool-1", "Read", &input)
        .await
        .unwrap();
    
    let input = serde_json::json!({"path": "/file2.txt"});
    tool_state::create_from_tool_use(&fixture.pool, &fixture.session_id, "tool-2", "Write", &input)
        .await
        .unwrap();

    // Complete one
    tool_state::complete_from_tool_result(
        &fixture.pool,
        &fixture.session_id,
        "tool-1",
        ToolResultStatus::Success,
        "Done",
    )
    .await
    .unwrap();

    // Fail pending
    let failed_count = tool_state::fail_pending(&fixture.pool, &fixture.session_id)
        .await
        .expect("Failed to fail pending");

    assert_eq!(failed_count, 1);

    // Verify tool-2 is now errored
    let tool2 = tool_state::get_by_tool_use_id(&fixture.pool, &fixture.session_id, "tool-2")
        .await
        .unwrap()
        .unwrap();

    assert!(tool2.status.is_error());
    assert_eq!(tool2.is_error, 1);
    assert!(tool2.output.is_some());
}

// =============================================================================
// Sequential Tool Execution Tests
// =============================================================================

#[tokio::test]
async fn test_sequential_tool_execution() {
    let fixture = ToolStateTestFixture::new().await;

    // Simulate sequential tool execution
    for i in 1..=5 {
        let tool_id = format!("tool-{}", i);
        let input = serde_json::json!({"path": format!("/file{}.txt", i)});
        
        // Create tool
        tool_state::create_from_tool_use(
            &fixture.pool,
            &fixture.session_id,
            &tool_id,
            "Read",
            &input,
        )
        .await
        .unwrap();

        // Small delay
        tokio::time::sleep(tokio::time::Duration::from_millis(5)).await;

        // Complete tool
        tool_state::complete_from_tool_result(
            &fixture.pool,
            &fixture.session_id,
            &tool_id,
            ToolResultStatus::Success,
            &format!("Content {}", i),
        )
        .await
        .unwrap();
    }

    // Verify all tools completed
    let tools = tool_state::list_by_session(&fixture.pool, &fixture.session_id)
        .await
        .unwrap();

    assert_eq!(tools.len(), 5);
    assert!(tools.iter().all(|t| t.status.is_completed()));

    // Verify ordering by started_at
    for i in 1..tools.len() {
        assert!(tools[i].started_at >= tools[i - 1].started_at);
    }
}

// =============================================================================
// Mixed Tool Type Tests
// =============================================================================

#[tokio::test]
async fn test_mixed_tool_types() {
    let fixture = ToolStateTestFixture::new().await;

    // Create various tool types
    let tools = vec![
        ("tool-read", "Read", serde_json::json!({"path": "/file.txt"})),
        ("tool-write", "Write", serde_json::json!({"path": "/output.txt", "content": "data"})),
        ("tool-bash", "Bash", serde_json::json!({"command": "ls -la"})),
        ("tool-edit", "EditFile", serde_json::json!({"file_path": "/config.json"})),
    ];

    for (tool_id, tool_name, input) in tools {
        tool_state::create_from_tool_use(
            &fixture.pool,
            &fixture.session_id,
            tool_id,
            tool_name,
            &input,
        )
        .await
        .unwrap();
    }

    // Verify all created
    let all_tools = tool_state::list_by_session(&fixture.pool, &fixture.session_id)
        .await
        .unwrap();

    assert_eq!(all_tools.len(), 4);

    // Verify metadata extraction
    let read_tool = all_tools.iter().find(|t| t.tool_name == "Read").unwrap();
    assert_eq!(read_tool.file_path, Some("/file.txt".to_string()));

    let write_tool = all_tools.iter().find(|t| t.tool_name == "Write").unwrap();
    assert_eq!(write_tool.file_path, Some("/output.txt".to_string()));

    let bash_tool = all_tools.iter().find(|t| t.tool_name == "Bash").unwrap();
    assert_eq!(bash_tool.command, Some("ls -la".to_string()));

    let edit_tool = all_tools.iter().find(|t| t.tool_name == "EditFile").unwrap();
    assert_eq!(edit_tool.file_path, Some("/config.json".to_string()));
}

// =============================================================================
// Duration Calculation Tests
// =============================================================================

#[tokio::test]
async fn test_duration_calculation() {
    let fixture = ToolStateTestFixture::new().await;

    // Create tool
    let input = serde_json::json!({"command": "sleep 0.1"});
    tool_state::create_from_tool_use(
        &fixture.pool,
        &fixture.session_id,
        "tool-1",
        "Bash",
        &input,
    )
    .await
    .unwrap();

    // Wait 100ms
    tokio::time::sleep(tokio::time::Duration::from_millis(100)).await;

    // Complete tool
    let completed = tool_state::complete_from_tool_result(
        &fixture.pool,
        &fixture.session_id,
        "tool-1",
        ToolResultStatus::Success,
        "Done",
    )
    .await
    .unwrap();

    // Verify duration was calculated
    assert!(completed.duration_ms.is_some());
    assert!(completed.duration_ms.unwrap() >= 100);
    assert!(completed.duration_ms.unwrap() < 200); // Should be close to 100ms
}

// =============================================================================
// Edge Case Tests
// =============================================================================

#[tokio::test]
async fn test_duplicate_tool_use_id() {
    let fixture = ToolStateTestFixture::new().await;

    // Create first tool
    let input = serde_json::json!({"path": "/file.txt"});
    tool_state::create_from_tool_use(&fixture.pool, &fixture.session_id, "tool-1", "Read", &input)
        .await
        .expect("Failed to create first tool");

    // Try to create duplicate
    let result = tool_state::create_from_tool_use(
        &fixture.pool,
        &fixture.session_id,
        "tool-1",
        "Write",
        &input,
    )
    .await;

    assert!(result.is_err());
}

#[tokio::test]
async fn test_empty_tool_output() {
    let fixture = ToolStateTestFixture::new().await;

    // Create tool
    let input = serde_json::json!({"path": "/empty.txt"});
    tool_state::create_from_tool_use(&fixture.pool, &fixture.session_id, "tool-1", "Read", &input)
        .await
        .unwrap();

    // Complete with empty output
    let completed = tool_state::complete_from_tool_result(
        &fixture.pool,
        &fixture.session_id,
        "tool-1",
        ToolResultStatus::Success,
        "",
    )
    .await
    .unwrap();

    assert_eq!(completed.output, Some("".to_string()));
}

#[tokio::test]
async fn test_large_tool_output() {
    let fixture = ToolStateTestFixture::new().await;

    // Create tool
    let input = serde_json::json!({"path": "/large.txt"});
    tool_state::create_from_tool_use(&fixture.pool, &fixture.session_id, "tool-1", "Read", &input)
        .await
        .unwrap();

    // Complete with large output
    let large_output = "x".repeat(100000);
    let completed = tool_state::complete_from_tool_result(
        &fixture.pool,
        &fixture.session_id,
        "tool-1",
        ToolResultStatus::Success,
        &large_output,
    )
    .await
    .unwrap();

    assert_eq!(completed.output.as_ref().unwrap().len(), 100000);
}

