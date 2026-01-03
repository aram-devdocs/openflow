//! Artifact Service
//!
//! Handles listing and reading task artifacts from the file system.
//! Artifacts are stored in `.zenflow/tasks/{task_id}/` folders within
//! the project directory.
//!
//! ## Logging
//!
//! This service uses structured logging at appropriate levels:
//! - `debug!` - File scanning, path resolution
//! - `info!` - Successful operations with counts
//! - `warn!` - Missing directories, no artifacts found
//! - `error!` - File system errors
//!
//! ## Error Handling
//!
//! All public functions return `ServiceResult<T>` for consistent error handling.
//! Errors include context about the operation and relevant parameters.

use std::path::Path;

use chrono::{DateTime, Utc};
use sqlx::SqlitePool;
use tracing::{debug, error, info, warn};

use openflow_contracts::ArtifactFile;

use super::{ServiceError, ServiceResult};

/// The folder name within the project where task artifacts are stored.
const ZENFLOW_TASKS_FOLDER: &str = ".zenflow/tasks";

/// Get the artifacts folder path for a task.
///
/// The artifacts folder is located at `{project_git_repo_path}/.zenflow/tasks/{task_id}/`.
///
/// # Arguments
///
/// * `pool` - Database connection pool
/// * `task_id` - The task ID to get artifacts for
///
/// # Returns
///
/// Returns the absolute path to the artifacts folder, or NotFound if the task doesn't exist.
pub async fn get_artifacts_path(pool: &SqlitePool, task_id: &str) -> ServiceResult<String> {
    debug!(task_id = %task_id, "Getting artifacts path for task");

    // Get the task to find the project
    let task = super::task::get(pool, task_id).await?;
    let project = super::project::get(pool, &task.task.project_id).await?;

    let artifacts_path = format!(
        "{}/{}/{}",
        project.git_repo_path, ZENFLOW_TASKS_FOLDER, task_id
    );

    debug!(
        task_id = %task_id,
        artifacts_path = %artifacts_path,
        "Resolved artifacts path"
    );

    Ok(artifacts_path)
}

/// List all artifacts in a task's artifacts folder.
///
/// Scans the `.zenflow/tasks/{task_id}/` directory and returns metadata
/// for all files and directories found. Returns an empty list if the
/// folder doesn't exist.
///
/// # Arguments
///
/// * `pool` - Database connection pool
/// * `task_id` - The task ID to list artifacts for
///
/// # Returns
///
/// A vector of `ArtifactFile` entries, sorted by name.
///
/// # Example
///
/// ```rust,ignore
/// let artifacts = artifact::list(&pool, "task-123").await?;
/// for file in artifacts {
///     println!("{}: {} bytes", file.name, file.size);
/// }
/// ```
pub async fn list(pool: &SqlitePool, task_id: &str) -> ServiceResult<Vec<ArtifactFile>> {
    debug!(task_id = %task_id, "Listing artifacts for task");

    let artifacts_path = get_artifacts_path(pool, task_id).await?;
    let path = Path::new(&artifacts_path);

    if !path.exists() {
        debug!(
            task_id = %task_id,
            path = %artifacts_path,
            "Artifacts folder does not exist, returning empty list"
        );
        return Ok(Vec::new());
    }

    let entries = match std::fs::read_dir(path) {
        Ok(entries) => entries,
        Err(e) => {
            error!(
                task_id = %task_id,
                path = %artifacts_path,
                error = %e,
                "Failed to read artifacts directory"
            );
            return Err(ServiceError::Io(e));
        }
    };

    let mut artifacts = Vec::new();

    for entry in entries.flatten() {
        let file_path = entry.path();
        let file_name = entry.file_name().to_string_lossy().to_string();

        // Get file metadata
        match entry.metadata() {
            Ok(metadata) => {
                let modified_at = metadata
                    .modified()
                    .ok()
                    .and_then(|t| {
                        let datetime: DateTime<Utc> = t.into();
                        Some(datetime.to_rfc3339())
                    })
                    .unwrap_or_else(|| Utc::now().to_rfc3339());

                let is_directory = metadata.is_dir();
                let size = if is_directory { 0 } else { metadata.len() as i32 };

                artifacts.push(ArtifactFile::new(
                    file_name,
                    file_path.to_string_lossy().to_string(),
                    size,
                    modified_at,
                    is_directory,
                ));
            }
            Err(e) => {
                warn!(
                    file = %file_path.display(),
                    error = %e,
                    "Failed to get metadata for file, skipping"
                );
            }
        }
    }

    // Sort by name
    artifacts.sort_by(|a, b| a.name.cmp(&b.name));

    info!(
        task_id = %task_id,
        artifact_count = artifacts.len(),
        artifacts = ?artifacts.iter().map(|a| &a.name).collect::<Vec<_>>(),
        "Listed artifacts"
    );

    Ok(artifacts)
}

/// Read the content of an artifact file.
///
/// # Arguments
///
/// * `pool` - Database connection pool
/// * `task_id` - The task ID the artifact belongs to
/// * `file_name` - The name of the file to read
///
/// # Returns
///
/// The file content as a string.
///
/// # Errors
///
/// - `ServiceError::NotFound` if the file doesn't exist
/// - `ServiceError::Io` if the file cannot be read
///
/// # Example
///
/// ```rust,ignore
/// let content = artifact::read(&pool, "task-123", "requirements.md").await?;
/// println!("Requirements:\n{}", content);
/// ```
pub async fn read(pool: &SqlitePool, task_id: &str, file_name: &str) -> ServiceResult<String> {
    debug!(
        task_id = %task_id,
        file_name = %file_name,
        "Reading artifact file"
    );

    let artifacts_path = get_artifacts_path(pool, task_id).await?;
    let file_path = Path::new(&artifacts_path).join(file_name);

    // Validate the file is within the artifacts folder (prevent path traversal)
    let canonical_artifacts = match Path::new(&artifacts_path).canonicalize() {
        Ok(p) => p,
        Err(e) => {
            warn!(
                task_id = %task_id,
                path = %artifacts_path,
                error = %e,
                "Artifacts folder does not exist"
            );
            return Err(ServiceError::not_found("ArtifactsFolder", task_id));
        }
    };

    let canonical_file = match file_path.canonicalize() {
        Ok(p) => p,
        Err(e) => {
            warn!(
                task_id = %task_id,
                file_name = %file_name,
                path = %file_path.display(),
                error = %e,
                "Artifact file does not exist"
            );
            return Err(ServiceError::not_found("Artifact", file_name));
        }
    };

    // Check that the file is within the artifacts folder
    if !canonical_file.starts_with(&canonical_artifacts) {
        error!(
            task_id = %task_id,
            file_name = %file_name,
            "Path traversal attempt detected"
        );
        return Err(ServiceError::validation(
            "Invalid file path: path traversal not allowed",
        ));
    }

    // Read the file content
    match std::fs::read_to_string(&canonical_file) {
        Ok(content) => {
            info!(
                task_id = %task_id,
                file_name = %file_name,
                content_length = content.len(),
                "Read artifact file successfully"
            );
            Ok(content)
        }
        Err(e) => {
            error!(
                task_id = %task_id,
                file_name = %file_name,
                path = %canonical_file.display(),
                error = %e,
                "Failed to read artifact file"
            );
            Err(ServiceError::Io(e))
        }
    }
}

#[cfg(test)]
mod tests {
    // Note: These tests require a database and file system setup.
    // Integration tests would be more appropriate here.
    // For unit testing, we would need to mock the database and file system.
}
