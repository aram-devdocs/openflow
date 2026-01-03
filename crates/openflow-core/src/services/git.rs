//! Git operations service.
//!
//! Handles git worktree management and repository operations.
//! Worktrees provide isolated working directories for parallel task execution.
//!
//! ## Branch Naming Convention
//! All branches created by OpenFlow follow: `openflow/{task_id}/{chat_role}`
//!
//! ## Worktree Directory Structure
//! ```text
//! ~/.openflow/worktrees/
//! +-- {project_id}/
//!     +-- {task_id}-main/      # Main agent worktree
//!     +-- {task_id}-review/    # Review agent worktree
//!     +-- {task_id}-test/      # Test agent worktree
//! ```
//!
//! ## Logging
//!
//! This service uses structured logging at the following levels:
//! - `debug`: Git command execution details, parameter values
//! - `info`: Successful operations (worktree created/deleted, branch pushed)
//! - `warn`: Fallback operations (force delete, empty diff)
//! - `error`: Git command failures with stderr output
//!
//! ## Error Handling
//!
//! All public functions return `ServiceResult<T>` with appropriate error variants:
//! - `ServiceError::Git` for git command failures
//! - `ServiceError::Validation` for input validation errors
//! - `ServiceError::Io` for filesystem errors

use std::path::Path;
use std::process::Command;

use log::{debug, error, info, warn};
use sqlx::SqlitePool;

use openflow_contracts::{Commit, DiffHunk, FileDiff, Worktree};

use super::{project, task, ServiceError, ServiceResult};

// =============================================================================
// Worktree Management
// =============================================================================

/// Create a new git worktree with a new branch.
///
/// # Arguments
/// * `repo_path` - Path to the main repository
/// * `branch_name` - Name for the new branch (e.g., "openflow/task123/main")
/// * `base_branch` - Branch to base the new worktree on (e.g., "main")
/// * `worktree_path` - Path where the worktree will be created
///
/// # Returns
/// The path to the created worktree.
///
/// # Errors
/// Returns an error if the git command fails or the repository is invalid.
pub async fn create_worktree(
    repo_path: &str,
    branch_name: &str,
    base_branch: &str,
    worktree_path: &str,
) -> ServiceResult<String> {
    debug!(
        "Creating worktree: repo_path={}, branch_name={}, base_branch={}, worktree_path={}",
        repo_path, branch_name, base_branch, worktree_path
    );

    // Ensure the parent directory exists
    let worktree_parent = Path::new(worktree_path).parent().ok_or_else(|| {
        error!("Invalid worktree path: {}", worktree_path);
        ServiceError::git("Invalid worktree path")
    })?;

    if !worktree_parent.exists() {
        debug!("Creating parent directory: {:?}", worktree_parent);
        std::fs::create_dir_all(worktree_parent)?;
    }

    // Create the worktree with a new branch based on base_branch
    // git worktree add -b <branch_name> <worktree_path> <base_branch>
    debug!(
        "Running: git -C {} worktree add -b {} {} {}",
        repo_path, branch_name, worktree_path, base_branch
    );
    let output = Command::new("git")
        .args([
            "-C",
            repo_path,
            "worktree",
            "add",
            "-b",
            branch_name,
            worktree_path,
            base_branch,
        ])
        .output()?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        error!(
            "Failed to create worktree: repo_path={}, branch_name={}, stderr={}",
            repo_path,
            branch_name,
            stderr.trim()
        );
        return Err(ServiceError::git(format!(
            "Failed to create worktree: {}",
            stderr
        )));
    }

    info!(
        "Created worktree: branch_name={}, worktree_path={}",
        branch_name, worktree_path
    );
    Ok(worktree_path.to_string())
}

/// Delete a git worktree.
///
/// # Arguments
/// * `repo_path` - Path to the main repository
/// * `worktree_path` - Path to the worktree to delete
///
/// # Errors
/// Returns an error if the git command fails.
pub async fn delete_worktree(repo_path: &str, worktree_path: &str) -> ServiceResult<()> {
    debug!(
        "Deleting worktree: repo_path={}, worktree_path={}",
        repo_path, worktree_path
    );

    // First try to remove the worktree normally
    debug!(
        "Running: git -C {} worktree remove {}",
        repo_path, worktree_path
    );
    let output = Command::new("git")
        .args(["-C", repo_path, "worktree", "remove", worktree_path])
        .output()?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        warn!(
            "Normal worktree removal failed, trying force: worktree_path={}, stderr={}",
            worktree_path,
            stderr.trim()
        );

        // If normal removal fails, try force removal
        debug!(
            "Running: git -C {} worktree remove --force {}",
            repo_path, worktree_path
        );
        let force_output = Command::new("git")
            .args([
                "-C",
                repo_path,
                "worktree",
                "remove",
                "--force",
                worktree_path,
            ])
            .output()?;

        if !force_output.status.success() {
            let stderr = String::from_utf8_lossy(&force_output.stderr);
            error!(
                "Failed to delete worktree (even with --force): worktree_path={}, stderr={}",
                worktree_path,
                stderr.trim()
            );
            return Err(ServiceError::git(format!(
                "Failed to delete worktree: {}",
                stderr
            )));
        }

        info!(
            "Deleted worktree with --force: worktree_path={}",
            worktree_path
        );
    } else {
        info!("Deleted worktree: worktree_path={}", worktree_path);
    }

    // Prune any stale worktree entries
    debug!("Running: git -C {} worktree prune", repo_path);
    let _ = Command::new("git")
        .args(["-C", repo_path, "worktree", "prune"])
        .output();

    Ok(())
}

/// List all worktrees for a repository.
///
/// # Arguments
/// * `repo_path` - Path to the main repository
///
/// # Returns
/// A list of worktree paths.
pub async fn list_worktrees(repo_path: &str) -> ServiceResult<Vec<Worktree>> {
    debug!("Listing worktrees: repo_path={}", repo_path);

    let output = Command::new("git")
        .args(["-C", repo_path, "worktree", "list", "--porcelain"])
        .output()?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        error!(
            "Failed to list worktrees: repo_path={}, stderr={}",
            repo_path,
            stderr.trim()
        );
        return Err(ServiceError::git(format!(
            "Failed to list worktrees: {}",
            stderr
        )));
    }

    let stdout = String::from_utf8_lossy(&output.stdout);
    let worktrees = parse_worktree_list(&stdout, repo_path);

    debug!(
        "Listed worktrees: repo_path={}, count={}",
        repo_path,
        worktrees.len()
    );
    Ok(worktrees)
}

/// Check if two paths are the same, resolving symlinks
fn paths_equal(path1: &str, path2: &str) -> bool {
    let p1 = Path::new(path1);
    let p2 = Path::new(path2);

    // First try canonicalization (resolves symlinks)
    if let (Ok(c1), Ok(c2)) = (p1.canonicalize(), p2.canonicalize()) {
        return c1 == c2;
    }

    // Fall back to direct comparison
    p1 == p2
}

/// Parse git worktree list --porcelain output into Worktree structs
fn parse_worktree_list(output: &str, repo_path: &str) -> Vec<Worktree> {
    let mut worktrees = Vec::new();
    let mut current_path: Option<String> = None;
    let mut current_branch: Option<String> = None;
    let mut current_head: Option<String> = None;
    let mut is_bare = false;
    let mut is_first_worktree = true;

    for line in output.lines() {
        if line.starts_with("worktree ") {
            // Save previous worktree if any
            if let Some(path) = current_path.take() {
                if !is_bare {
                    let branch = current_branch.take().unwrap_or_default();
                    // The first worktree listed is always the main one
                    let is_main = is_first_worktree || paths_equal(&path, repo_path);
                    let mut wt = Worktree::new(&path, &branch);
                    if is_main {
                        wt = wt.as_main();
                    }
                    if let Some(head) = current_head.take() {
                        wt = wt.with_head_commit(&head);
                    }
                    worktrees.push(wt);
                    is_first_worktree = false;
                }
            }
            is_bare = false;
            current_path = Some(line.trim_start_matches("worktree ").to_string());
        } else if line.starts_with("HEAD ") {
            current_head = Some(line.trim_start_matches("HEAD ").to_string());
        } else if line.starts_with("branch ") {
            let branch = line.trim_start_matches("branch refs/heads/");
            current_branch = Some(branch.to_string());
        } else if line == "bare" {
            is_bare = true;
        } else if line.starts_with("detached") {
            current_branch = Some("(detached)".to_string());
        }
    }

    // Don't forget the last worktree
    if let Some(path) = current_path {
        if !is_bare {
            let branch = current_branch.unwrap_or_default();
            // The first worktree listed is always the main one
            let is_main = is_first_worktree || paths_equal(&path, repo_path);
            let mut wt = Worktree::new(&path, &branch);
            if is_main {
                wt = wt.as_main();
            }
            if let Some(head) = current_head {
                wt = wt.with_head_commit(&head);
            }
            worktrees.push(wt);
        }
    }

    worktrees
}

// =============================================================================
// Diff Operations
// =============================================================================

/// Get the diff for uncommitted changes in a worktree.
///
/// Returns both staged and unstaged changes.
///
/// # Arguments
/// * `worktree_path` - Path to the worktree
///
/// # Returns
/// A vector of file diffs showing all changes.
pub async fn get_diff(worktree_path: &str) -> ServiceResult<Vec<FileDiff>> {
    debug!("Getting diff: worktree_path={}", worktree_path);

    // Get diff for all changes (staged and unstaged)
    debug!(
        "Running: git -C {} diff HEAD --numstat --name-status",
        worktree_path
    );
    let output = Command::new("git")
        .args([
            "-C",
            worktree_path,
            "diff",
            "HEAD",
            "--numstat",
            "--name-status",
        ])
        .output()?;

    if !output.status.success() {
        // If HEAD doesn't exist (new repo), get diff against empty tree
        debug!(
            "HEAD diff failed (possibly new repo), trying cached: worktree_path={}",
            worktree_path
        );
        let output = Command::new("git")
            .args(["-C", worktree_path, "diff", "--cached", "--numstat"])
            .output()?;

        if !output.status.success() {
            warn!(
                "No diff available (new repo with no staged changes): worktree_path={}",
                worktree_path
            );
            return Ok(vec![]);
        }
    }

    // Get detailed diff with hunks
    debug!(
        "Running: git -C {} diff HEAD --unified=3 --no-color",
        worktree_path
    );
    let diff_output = Command::new("git")
        .args([
            "-C",
            worktree_path,
            "diff",
            "HEAD",
            "--unified=3",
            "--no-color",
        ])
        .output()?;

    let diff_text = String::from_utf8_lossy(&diff_output.stdout);
    let diffs = parse_diff(&diff_text);

    info!(
        "Got diff: worktree_path={}, file_count={}, files=[{}]",
        worktree_path,
        diffs.len(),
        diffs
            .iter()
            .take(5)
            .map(|d| d.path.as_str())
            .collect::<Vec<_>>()
            .join(", ")
    );

    Ok(diffs)
}

/// Parse git diff output into structured FileDiff objects.
fn parse_diff(diff_text: &str) -> Vec<FileDiff> {
    let mut diffs = Vec::new();
    let mut current_file: Option<FileDiff> = None;
    let mut current_hunk: Option<DiffHunk> = None;
    let mut hunk_content = String::new();

    for line in diff_text.lines() {
        if line.starts_with("diff --git") {
            // Save previous file if exists
            if let Some(mut file) = current_file.take() {
                if let Some(hunk) = current_hunk.take() {
                    let h = DiffHunk {
                        old_start: hunk.old_start,
                        old_lines: hunk.old_lines,
                        new_start: hunk.new_start,
                        new_lines: hunk.new_lines,
                        content: std::mem::take(&mut hunk_content),
                    };
                    file.hunks.push(h);
                }
                diffs.push(file);
            }

            // Parse file paths from "diff --git a/path b/path"
            let parts: Vec<&str> = line.split_whitespace().collect();
            let path = if parts.len() >= 4 {
                parts[3].trim_start_matches("b/").to_string()
            } else {
                "unknown".to_string()
            };

            current_file = Some(FileDiff::new(&path));
        } else if line.starts_with("new file mode") {
            if let Some(ref mut file) = current_file {
                file.is_new = true;
            }
        } else if line.starts_with("deleted file mode") {
            if let Some(ref mut file) = current_file {
                file.is_deleted = true;
            }
        } else if line.starts_with("rename from") {
            if let Some(ref mut file) = current_file {
                file.is_renamed = true;
                file.old_path = Some(line.trim_start_matches("rename from ").to_string());
            }
        } else if line.starts_with("Binary files") {
            if let Some(ref mut file) = current_file {
                file.is_binary = true;
            }
        } else if line.starts_with("@@") {
            // Save previous hunk if exists
            if let Some(hunk) = current_hunk.take() {
                if let Some(ref mut file) = current_file {
                    let h = DiffHunk {
                        old_start: hunk.old_start,
                        old_lines: hunk.old_lines,
                        new_start: hunk.new_start,
                        new_lines: hunk.new_lines,
                        content: std::mem::take(&mut hunk_content),
                    };
                    file.hunks.push(h);
                }
            }

            // Parse hunk header: @@ -old_start,old_lines +new_start,new_lines @@
            let hunk_info = parse_hunk_header(line);
            current_hunk = Some(DiffHunk::new(
                hunk_info.0,
                hunk_info.1,
                hunk_info.2,
                hunk_info.3,
            ));
        } else if current_hunk.is_some() {
            // Accumulate hunk content
            if !hunk_content.is_empty() {
                hunk_content.push('\n');
            }
            hunk_content.push_str(line);

            // Count additions/deletions
            if let Some(ref mut file) = current_file {
                if line.starts_with('+') && !line.starts_with("+++") {
                    file.additions += 1;
                } else if line.starts_with('-') && !line.starts_with("---") {
                    file.deletions += 1;
                }
            }
        }
    }

    // Save final file and hunk
    if let Some(mut file) = current_file {
        if let Some(hunk) = current_hunk {
            let h = DiffHunk {
                old_start: hunk.old_start,
                old_lines: hunk.old_lines,
                new_start: hunk.new_start,
                new_lines: hunk.new_lines,
                content: hunk_content,
            };
            file.hunks.push(h);
        }
        diffs.push(file);
    }

    diffs
}

/// Parse hunk header to extract line numbers.
/// Format: @@ -old_start,old_lines +new_start,new_lines @@
fn parse_hunk_header(header: &str) -> (i32, i32, i32, i32) {
    let mut old_start = 0;
    let mut old_lines = 1;
    let mut new_start = 0;
    let mut new_lines = 1;

    // Find the range info between @@ markers
    if let Some(start) = header.find("@@") {
        if let Some(end) = header[start + 2..].find("@@") {
            let range_str = &header[start + 2..start + 2 + end].trim();

            for part in range_str.split_whitespace() {
                if let Some(stripped) = part.strip_prefix('-') {
                    let nums: Vec<&str> = stripped.split(',').collect();
                    if !nums.is_empty() {
                        old_start = nums[0].parse().unwrap_or(0);
                    }
                    if nums.len() > 1 {
                        old_lines = nums[1].parse().unwrap_or(1);
                    }
                } else if let Some(stripped) = part.strip_prefix('+') {
                    let nums: Vec<&str> = stripped.split(',').collect();
                    if !nums.is_empty() {
                        new_start = nums[0].parse().unwrap_or(0);
                    }
                    if nums.len() > 1 {
                        new_lines = nums[1].parse().unwrap_or(1);
                    }
                }
            }
        }
    }

    (old_start, old_lines, new_start, new_lines)
}

// =============================================================================
// Commit Operations
// =============================================================================

/// Get commits for a worktree/branch.
///
/// # Arguments
/// * `worktree_path` - Path to the worktree
/// * `limit` - Maximum number of commits to return (default: 50)
///
/// # Returns
/// A vector of commits, most recent first.
pub async fn get_commits(worktree_path: &str, limit: Option<usize>) -> ServiceResult<Vec<Commit>> {
    let limit = limit.unwrap_or(50);
    debug!(
        "Getting commits: worktree_path={}, limit={}",
        worktree_path, limit
    );

    // Get commit log with stats
    // Format: hash|short_hash|message|author|email|date|files_changed|insertions|deletions
    debug!(
        "Running: git -C {} log -{} --format=... --shortstat",
        worktree_path, limit
    );
    let output = Command::new("git")
        .args([
            "-C",
            worktree_path,
            "log",
            &format!("-{}", limit),
            "--format=%H|%h|%s|%an|%ae|%aI",
            "--shortstat",
        ])
        .output()?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        // If no commits yet, return empty list
        if stderr.contains("does not have any commits") {
            debug!(
                "No commits yet in repository: worktree_path={}",
                worktree_path
            );
            return Ok(vec![]);
        }
        error!(
            "Failed to get commits: worktree_path={}, stderr={}",
            worktree_path,
            stderr.trim()
        );
        return Err(ServiceError::git(format!(
            "Failed to get commits: {}",
            stderr
        )));
    }

    let stdout = String::from_utf8_lossy(&output.stdout);
    let commits = parse_commits(&stdout);

    info!(
        "Got commits: worktree_path={}, commit_count={}, recent=[{}]",
        worktree_path,
        commits.len(),
        commits
            .iter()
            .take(3)
            .map(|c| format!("{}:{}", c.short_hash, &c.message[..c.message.len().min(30)]))
            .collect::<Vec<_>>()
            .join(", ")
    );

    Ok(commits)
}

/// Parse git log output into Commit objects.
fn parse_commits(log_output: &str) -> Vec<Commit> {
    let mut commits = Vec::new();
    let mut current_commit: Option<Commit> = None;

    for line in log_output.lines() {
        let line = line.trim();
        if line.is_empty() {
            continue;
        }

        // Check if this is a commit line (contains our delimiter)
        if line.contains('|') && line.len() >= 40 {
            // Save previous commit
            if let Some(commit) = current_commit.take() {
                commits.push(commit);
            }

            let parts: Vec<&str> = line.splitn(6, '|').collect();
            if parts.len() >= 6 {
                current_commit = Some(
                    Commit::new(parts[0], parts[1])
                        .with_message(parts[2])
                        .with_author(parts[3], parts[4])
                        .with_date(parts[5]),
                );
            }
        } else if line.contains("file") || line.contains("insertion") || line.contains("deletion") {
            // Parse stat line: " 3 files changed, 10 insertions(+), 5 deletions(-)"
            if let Some(ref mut commit) = current_commit {
                let mut files_changed = 0;
                let mut additions = 0;
                let mut deletions = 0;

                for part in line.split(',') {
                    let part = part.trim();
                    if part.contains("file") {
                        if let Some(num) = part.split_whitespace().next() {
                            files_changed = num.parse().unwrap_or(0);
                        }
                    } else if part.contains("insertion") {
                        if let Some(num) = part.split_whitespace().next() {
                            additions = num.parse().unwrap_or(0);
                        }
                    } else if part.contains("deletion") {
                        if let Some(num) = part.split_whitespace().next() {
                            deletions = num.parse().unwrap_or(0);
                        }
                    }
                }

                // Update commit with stats
                *commit = Commit::new(&commit.hash, &commit.short_hash)
                    .with_message(&commit.message)
                    .with_author(&commit.author, &commit.author_email)
                    .with_date(&commit.date)
                    .with_stats(files_changed, additions, deletions);
            }
        }
    }

    // Don't forget the last commit
    if let Some(commit) = current_commit {
        commits.push(commit);
    }

    commits
}

// =============================================================================
// Branch Operations
// =============================================================================

/// Push a branch to a remote repository.
///
/// # Arguments
/// * `worktree_path` - Path to the worktree
/// * `remote` - Remote name (default: "origin")
///
/// # Errors
/// Returns an error if the push fails.
pub async fn push_branch(worktree_path: &str, remote: Option<&str>) -> ServiceResult<()> {
    let remote = remote.unwrap_or("origin");
    debug!(
        "Pushing branch: worktree_path={}, remote={}",
        worktree_path, remote
    );

    // Get current branch name
    let branch = get_current_branch(worktree_path).await?;
    debug!("Current branch: {}", branch);

    // Push with set-upstream
    debug!(
        "Running: git -C {} push -u {} {}",
        worktree_path, remote, branch
    );
    let output = Command::new("git")
        .args(["-C", worktree_path, "push", "-u", remote, &branch])
        .output()?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        error!(
            "Failed to push branch: worktree_path={}, branch={}, remote={}, stderr={}",
            worktree_path,
            branch,
            remote,
            stderr.trim()
        );
        return Err(ServiceError::git(format!(
            "Failed to push branch: {}",
            stderr
        )));
    }

    info!(
        "Pushed branch: branch={}, remote={}, worktree_path={}",
        branch, remote, worktree_path
    );
    Ok(())
}

/// Get the current branch name in a worktree.
pub async fn get_current_branch(worktree_path: &str) -> ServiceResult<String> {
    debug!("Getting current branch: worktree_path={}", worktree_path);

    let output = Command::new("git")
        .args(["-C", worktree_path, "rev-parse", "--abbrev-ref", "HEAD"])
        .output()?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        error!(
            "Failed to get current branch: worktree_path={}, stderr={}",
            worktree_path,
            stderr.trim()
        );
        return Err(ServiceError::git(format!(
            "Failed to get current branch: {}",
            stderr
        )));
    }

    let branch = String::from_utf8_lossy(&output.stdout).trim().to_string();
    debug!(
        "Current branch: worktree_path={}, branch={}",
        worktree_path, branch
    );
    Ok(branch)
}

/// Get the HEAD commit hash.
pub async fn get_head_commit(worktree_path: &str) -> ServiceResult<Option<String>> {
    debug!("Getting HEAD commit: worktree_path={}", worktree_path);

    let output = Command::new("git")
        .args(["-C", worktree_path, "rev-parse", "HEAD"])
        .output()?;

    if !output.status.success() {
        // No commits yet
        debug!(
            "No HEAD commit (new repository): worktree_path={}",
            worktree_path
        );
        return Ok(None);
    }

    let hash = String::from_utf8_lossy(&output.stdout).trim().to_string();
    debug!(
        "HEAD commit: worktree_path={}, hash={}",
        worktree_path, hash
    );
    Ok(Some(hash))
}

/// Check if a repository has uncommitted changes.
pub async fn has_uncommitted_changes(worktree_path: &str) -> ServiceResult<bool> {
    debug!(
        "Checking for uncommitted changes: worktree_path={}",
        worktree_path
    );

    let output = Command::new("git")
        .args(["-C", worktree_path, "status", "--porcelain"])
        .output()?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        error!(
            "Failed to check git status: worktree_path={}, stderr={}",
            worktree_path,
            stderr.trim()
        );
        return Err(ServiceError::git("Failed to check git status"));
    }

    let stdout = String::from_utf8_lossy(&output.stdout);
    let has_changes = !stdout.trim().is_empty();
    debug!(
        "Uncommitted changes check: worktree_path={}, has_changes={}",
        worktree_path, has_changes
    );
    Ok(has_changes)
}

// =============================================================================
// Branch Name Generation
// =============================================================================

/// Generate a branch name for a chat following OpenFlow conventions.
///
/// Format: `openflow/{task_id}/{chat_role}`
///
/// # Arguments
/// * `task_id` - The task identifier
/// * `chat_role` - The chat role (e.g., "main", "review", "test")
///
/// # Returns
/// The generated branch name.
///
/// # Errors
/// Returns an error if the task_id or chat_role is empty.
pub fn generate_branch_name(task_id: &str, chat_role: &str) -> ServiceResult<String> {
    debug!(
        "Generating branch name: task_id={}, chat_role={}",
        task_id, chat_role
    );

    if task_id.is_empty() {
        error!("Cannot generate branch name: task_id is empty");
        return Err(ServiceError::validation("task_id cannot be empty"));
    }
    if chat_role.is_empty() {
        error!("Cannot generate branch name: chat_role is empty");
        return Err(ServiceError::validation("chat_role cannot be empty"));
    }

    let branch_name = format!("openflow/{}/{}", task_id, chat_role.to_lowercase());
    debug!("Generated branch name: {}", branch_name);
    Ok(branch_name)
}

/// Generate a worktree path for a chat.
///
/// Format: `{base_path}/{project_id}/{task_id}-{chat_role}`
///
/// # Arguments
/// * `base_path` - Base directory for worktrees (e.g., "~/.openflow/worktrees")
/// * `project_id` - The project identifier
/// * `task_id` - The task identifier
/// * `chat_role` - The chat role (e.g., "main", "review", "test")
pub fn generate_worktree_path(
    base_path: &str,
    project_id: &str,
    task_id: &str,
    chat_role: &str,
) -> String {
    debug!(
        "Generating worktree path: base_path={}, project_id={}, task_id={}, chat_role={}",
        base_path, project_id, task_id, chat_role
    );

    let expanded_base = shellexpand::tilde(base_path);
    let path = format!(
        "{}/{}/{}-{}",
        expanded_base,
        project_id,
        task_id,
        chat_role.to_lowercase()
    );

    debug!("Generated worktree path: {}", path);
    path
}

// =============================================================================
// Task-Level Git Operations
// =============================================================================

/// Get the diff for uncommitted changes in a task's worktree.
///
/// This method resolves the task's worktree path by checking its associated chats.
/// If no worktree exists, it falls back to the project's main git repository.
///
/// # Arguments
/// * `pool` - Database connection pool
/// * `task_id` - The task identifier
///
/// # Returns
/// A vector of file diffs showing all uncommitted changes.
pub async fn get_task_diff(pool: &SqlitePool, task_id: &str) -> ServiceResult<Vec<FileDiff>> {
    debug!("Getting task diff: task_id={}", task_id);

    // Get the task with its chats
    let task_with_chats = task::get(pool, task_id).await?;
    debug!(
        "Loaded task: task_id={}, chat_count={}",
        task_id,
        task_with_chats.chats.len()
    );

    // Find the first chat with a worktree path (prefer main role)
    let worktree_path = task_with_chats
        .chats
        .iter()
        .filter(|c| c.worktree_path.is_some() && !c.worktree_deleted)
        .min_by_key(|c| c.workflow_step_index.unwrap_or(i32::MAX))
        .and_then(|c| c.worktree_path.clone());

    // If no worktree, fall back to project's git repo
    let diff_path = match worktree_path {
        Some(path) => {
            debug!(
                "Using worktree path for diff: task_id={}, path={}",
                task_id, path
            );
            path
        }
        None => {
            debug!(
                "No worktree found, falling back to project repo: task_id={}, project_id={}",
                task_id, task_with_chats.task.project_id
            );
            let proj = project::get(pool, &task_with_chats.task.project_id).await?;
            proj.git_repo_path
        }
    };

    get_diff(&diff_path).await
}

/// Get commits for a task's worktree/branch.
///
/// This method resolves the task's worktree path by checking its associated chats.
/// If no worktree exists, it falls back to the project's main git repository.
///
/// # Arguments
/// * `pool` - Database connection pool
/// * `task_id` - The task identifier
/// * `limit` - Maximum number of commits to return (default: 50)
///
/// # Returns
/// A vector of commits, most recent first.
pub async fn get_task_commits(
    pool: &SqlitePool,
    task_id: &str,
    limit: Option<usize>,
) -> ServiceResult<Vec<Commit>> {
    debug!(
        "Getting task commits: task_id={}, limit={:?}",
        task_id, limit
    );

    // Get the task with its chats
    let task_with_chats = task::get(pool, task_id).await?;
    debug!(
        "Loaded task: task_id={}, chat_count={}",
        task_id,
        task_with_chats.chats.len()
    );

    // Find the first chat with a worktree path (prefer by step index)
    let worktree_path = task_with_chats
        .chats
        .iter()
        .filter(|c| c.worktree_path.is_some() && !c.worktree_deleted)
        .min_by_key(|c| c.workflow_step_index.unwrap_or(i32::MAX))
        .and_then(|c| c.worktree_path.clone());

    // If no worktree, fall back to project's git repo
    let commits_path = match worktree_path {
        Some(path) => {
            debug!(
                "Using worktree path for commits: task_id={}, path={}",
                task_id, path
            );
            path
        }
        None => {
            debug!(
                "No worktree found, falling back to project repo: task_id={}, project_id={}",
                task_id, task_with_chats.task.project_id
            );
            let proj = project::get(pool, &task_with_chats.task.project_id).await?;
            proj.git_repo_path
        }
    };

    get_commits(&commits_path, limit).await
}

// =============================================================================
// Tests
// =============================================================================

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;
    use tempfile::TempDir;

    /// Helper to create a test git repository.
    fn setup_test_repo() -> TempDir {
        let temp_dir = TempDir::new().expect("Failed to create temp dir");
        let repo_path = temp_dir.path();

        // Initialize git repo
        Command::new("git")
            .args(["init"])
            .current_dir(repo_path)
            .output()
            .expect("Failed to init git repo");

        // Configure git user for commits
        Command::new("git")
            .args(["config", "user.email", "test@example.com"])
            .current_dir(repo_path)
            .output()
            .expect("Failed to configure git email");

        Command::new("git")
            .args(["config", "user.name", "Test User"])
            .current_dir(repo_path)
            .output()
            .expect("Failed to configure git name");

        // Create initial commit
        let readme_path = repo_path.join("README.md");
        fs::write(&readme_path, "# Test Repository\n").expect("Failed to create README");

        Command::new("git")
            .args(["add", "."])
            .current_dir(repo_path)
            .output()
            .expect("Failed to stage files");

        Command::new("git")
            .args(["commit", "-m", "Initial commit"])
            .current_dir(repo_path)
            .output()
            .expect("Failed to create initial commit");

        temp_dir
    }

    #[test]
    fn test_generate_branch_name() {
        assert_eq!(
            generate_branch_name("task123", "main").unwrap(),
            "openflow/task123/main"
        );
        assert_eq!(
            generate_branch_name("abc-def", "Review").unwrap(),
            "openflow/abc-def/review"
        );
        assert_eq!(
            generate_branch_name("task456", "TEST").unwrap(),
            "openflow/task456/test"
        );
    }

    #[test]
    fn test_generate_branch_name_validation() {
        // Empty task_id should fail
        assert!(generate_branch_name("", "main").is_err());
        // Empty chat_role should fail
        assert!(generate_branch_name("task123", "").is_err());
        // Both empty should fail
        assert!(generate_branch_name("", "").is_err());
    }

    #[test]
    fn test_generate_worktree_path() {
        let path = generate_worktree_path("/tmp/worktrees", "project1", "task123", "main");
        assert_eq!(path, "/tmp/worktrees/project1/task123-main");

        let path = generate_worktree_path("/base", "proj", "task", "Review");
        assert_eq!(path, "/base/proj/task-review");
    }

    #[test]
    fn test_parse_hunk_header() {
        let (old_start, old_lines, new_start, new_lines) =
            parse_hunk_header("@@ -10,5 +15,8 @@ function test()");
        assert_eq!(old_start, 10);
        assert_eq!(old_lines, 5);
        assert_eq!(new_start, 15);
        assert_eq!(new_lines, 8);

        let (old_start, old_lines, new_start, new_lines) = parse_hunk_header("@@ -1 +1 @@");
        assert_eq!(old_start, 1);
        assert_eq!(old_lines, 1);
        assert_eq!(new_start, 1);
        assert_eq!(new_lines, 1);

        let (old_start, old_lines, new_start, new_lines) = parse_hunk_header("@@ -0,0 +1,25 @@");
        assert_eq!(old_start, 0);
        assert_eq!(old_lines, 0);
        assert_eq!(new_start, 1);
        assert_eq!(new_lines, 25);
    }

    #[test]
    fn test_parse_diff() {
        let diff_text = r#"diff --git a/src/main.rs b/src/main.rs
new file mode 100644
--- /dev/null
+++ b/src/main.rs
@@ -0,0 +1,5 @@
+fn main() {
+    println!("Hello");
+}
"#;

        let diffs = parse_diff(diff_text);
        assert_eq!(diffs.len(), 1);

        let diff = &diffs[0];
        assert_eq!(diff.path, "src/main.rs");
        assert!(diff.is_new);
        assert!(!diff.is_deleted);
        assert_eq!(diff.additions, 3);
        assert_eq!(diff.deletions, 0);
        assert_eq!(diff.hunks.len(), 1);
    }

    #[test]
    fn test_parse_diff_with_deletions() {
        let diff_text = r#"diff --git a/src/lib.rs b/src/lib.rs
--- a/src/lib.rs
+++ b/src/lib.rs
@@ -1,5 +1,3 @@
-fn old_function() {
-    println!("old");
-}
+fn new_function() {
+    println!("new");
 }
"#;

        let diffs = parse_diff(diff_text);
        assert_eq!(diffs.len(), 1);

        let diff = &diffs[0];
        assert_eq!(diff.path, "src/lib.rs");
        assert!(!diff.is_new);
        assert!(!diff.is_deleted);
        assert_eq!(diff.additions, 2);
        assert_eq!(diff.deletions, 3);
    }

    #[test]
    fn test_parse_diff_renamed_file() {
        let diff_text = r#"diff --git a/old_name.rs b/new_name.rs
rename from old_name.rs
rename to new_name.rs
"#;

        let diffs = parse_diff(diff_text);
        assert_eq!(diffs.len(), 1);

        let diff = &diffs[0];
        assert!(diff.is_renamed);
        assert_eq!(diff.old_path, Some("old_name.rs".to_string()));
    }

    #[test]
    fn test_parse_diff_binary_file() {
        let diff_text = r#"diff --git a/image.png b/image.png
Binary files /dev/null and b/image.png differ
"#;

        let diffs = parse_diff(diff_text);
        assert_eq!(diffs.len(), 1);
        assert!(diffs[0].is_binary);
    }

    #[test]
    fn test_parse_commits() {
        let log_output = r#"abc123def456abc123def456abc123def456abc123de|abc123d|Initial commit|John Doe|john@example.com|2024-01-15T10:30:00Z
 1 file changed, 10 insertions(+)
def456abc123def456abc123def456abc123def456ab|def456a|Add feature X|Jane Doe|jane@example.com|2024-01-16T14:20:00Z
 3 files changed, 25 insertions(+), 5 deletions(-)
"#;

        let commits = parse_commits(log_output);
        assert_eq!(commits.len(), 2);

        assert_eq!(commits[0].short_hash, "abc123d");
        assert_eq!(commits[0].message, "Initial commit");
        assert_eq!(commits[0].author, "John Doe");
        assert_eq!(commits[0].files_changed, 1);
        assert_eq!(commits[0].additions, 10);
        assert_eq!(commits[0].deletions, 0);

        assert_eq!(commits[1].short_hash, "def456a");
        assert_eq!(commits[1].message, "Add feature X");
        assert_eq!(commits[1].files_changed, 3);
        assert_eq!(commits[1].additions, 25);
        assert_eq!(commits[1].deletions, 5);
    }

    #[test]
    fn test_parse_worktree_list() {
        let output = r#"worktree /home/user/project
HEAD abc123def456abc123def456abc123def456abc123de
branch refs/heads/main

worktree /home/user/.openflow/worktrees/proj1/task1-main
HEAD def456abc123def456abc123def456abc123def456ab
branch refs/heads/openflow/task1/main

"#;

        let worktrees = parse_worktree_list(output, "/home/user/project");
        assert_eq!(worktrees.len(), 2);

        assert_eq!(worktrees[0].path, "/home/user/project");
        assert_eq!(worktrees[0].branch, "main");
        assert!(worktrees[0].is_main);

        assert_eq!(
            worktrees[1].path,
            "/home/user/.openflow/worktrees/proj1/task1-main"
        );
        assert_eq!(worktrees[1].branch, "openflow/task1/main");
        assert!(!worktrees[1].is_main);
    }

    #[test]
    fn test_parse_worktree_list_with_detached() {
        let output = r#"worktree /home/user/project
HEAD abc123
detached

"#;

        let worktrees = parse_worktree_list(output, "/home/user/project");
        assert_eq!(worktrees.len(), 1);
        assert_eq!(worktrees[0].branch, "(detached)");
    }

    #[tokio::test]
    async fn test_create_and_delete_worktree() {
        let temp_dir = setup_test_repo();
        let repo_path = temp_dir.path().to_str().unwrap();

        // Get the actual default branch name (could be "main" or "master")
        let base_branch = get_current_branch(repo_path)
            .await
            .expect("Failed to get current branch");

        let worktree_temp = TempDir::new().expect("Failed to create worktree temp dir");
        let worktree_path = worktree_temp
            .path()
            .join("test-worktree")
            .to_str()
            .unwrap()
            .to_string();

        // Use unique branch name with timestamp to avoid conflicts
        let unique_id = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_nanos();
        let branch_name = format!("openflow/test-{}/main", unique_id);

        // Create worktree
        let result = create_worktree(repo_path, &branch_name, &base_branch, &worktree_path).await;
        assert!(result.is_ok(), "Failed to create worktree: {:?}", result);
        assert_eq!(result.unwrap(), worktree_path);

        // Verify worktree exists
        assert!(Path::new(&worktree_path).exists());

        // List worktrees
        let worktrees = list_worktrees(repo_path).await.unwrap();
        assert!(worktrees.len() >= 2); // Main + our new worktree

        // Delete worktree
        let delete_result = delete_worktree(repo_path, &worktree_path).await;
        assert!(
            delete_result.is_ok(),
            "Failed to delete worktree: {:?}",
            delete_result
        );
    }

    #[tokio::test]
    async fn test_get_current_branch() {
        let temp_dir = setup_test_repo();
        let repo_path = temp_dir.path().to_str().unwrap();

        let branch = get_current_branch(repo_path).await;
        assert!(branch.is_ok());
        // Verify we got a non-empty branch name (actual name depends on git config)
        let branch_name = branch.unwrap();
        assert!(!branch_name.is_empty(), "Branch name should not be empty");
    }

    #[tokio::test]
    async fn test_get_head_commit() {
        let temp_dir = setup_test_repo();
        let repo_path = temp_dir.path().to_str().unwrap();

        let commit = get_head_commit(repo_path).await;
        assert!(commit.is_ok());
        let commit_hash = commit.unwrap();
        assert!(commit_hash.is_some());
        assert_eq!(commit_hash.unwrap().len(), 40); // Full SHA
    }

    #[tokio::test]
    async fn test_has_uncommitted_changes() {
        let temp_dir = setup_test_repo();
        let repo_path = temp_dir.path().to_str().unwrap();

        // Initially no changes
        let has_changes = has_uncommitted_changes(repo_path).await;
        assert!(has_changes.is_ok());
        assert!(!has_changes.unwrap());

        // Create a change
        let new_file = temp_dir.path().join("new_file.txt");
        fs::write(&new_file, "new content").unwrap();

        // Now should have changes
        let has_changes = has_uncommitted_changes(repo_path).await;
        assert!(has_changes.is_ok());
        assert!(has_changes.unwrap());
    }

    #[tokio::test]
    async fn test_get_commits() {
        let temp_dir = setup_test_repo();
        let repo_path = temp_dir.path().to_str().unwrap();

        let commits = get_commits(repo_path, Some(10)).await;
        assert!(commits.is_ok());
        let commits = commits.unwrap();
        assert!(!commits.is_empty());
        // Verify we have a commit with a non-empty message (setup_test_repo creates "Initial commit")
        assert!(!commits[0].message.is_empty());
    }

    #[tokio::test]
    async fn test_get_diff_with_changes() {
        let temp_dir = setup_test_repo();
        let repo_path = temp_dir.path().to_str().unwrap();

        // Modify a file
        let readme_path = temp_dir.path().join("README.md");
        fs::write(&readme_path, "# Test Repository\n\nModified content\n").unwrap();

        let diffs = get_diff(repo_path).await;
        assert!(diffs.is_ok());
        let diffs = diffs.unwrap();
        assert!(!diffs.is_empty());
        assert_eq!(diffs[0].path, "README.md");
    }

    #[tokio::test]
    async fn test_list_worktrees() {
        let temp_dir = setup_test_repo();
        let repo_path = temp_dir.path().to_str().unwrap();

        let worktrees = list_worktrees(repo_path).await;
        assert!(worktrees.is_ok());
        let worktrees = worktrees.unwrap();
        // Should have at least the main worktree
        assert!(!worktrees.is_empty());
        // The first worktree listed is the main one
        assert!(worktrees[0].is_main);
        // Should have a branch name
        assert!(!worktrees[0].branch.is_empty());
    }
}
