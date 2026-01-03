//! Artifact Entity
//!
//! Artifacts represent files in a task's artifacts folder.
//! These are typically markdown files like requirements.md, spec.md, plan.md
//! that are generated during workflow execution.

use serde::{Deserialize, Serialize};
use typeshare::typeshare;

// =============================================================================
// ArtifactFile Entity
// =============================================================================

/// A file or directory in the task artifacts folder
///
/// Artifacts are files stored in `.zenflow/tasks/{task_id}/` that contain
/// workflow outputs like requirements documents, specifications, and plans.
///
/// # Example
/// ```json
/// {
///   "name": "requirements.md",
///   "path": "/home/user/project/.zenflow/tasks/abc123/requirements.md",
///   "size": 4096,
///   "modifiedAt": "2024-01-15T10:30:00Z",
///   "isDirectory": false
/// }
/// ```
#[typeshare]
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct ArtifactFile {
    /// File or directory name
    pub name: String,

    /// Full absolute path to the file
    pub path: String,

    /// File size in bytes (0 for directories, max ~2GB for i32)
    pub size: i32,

    /// Last modified timestamp (ISO 8601)
    pub modified_at: String,

    /// Whether this is a directory
    pub is_directory: bool,
}

impl ArtifactFile {
    /// Create a new ArtifactFile
    pub fn new(
        name: impl Into<String>,
        path: impl Into<String>,
        size: i32,
        modified_at: impl Into<String>,
        is_directory: bool,
    ) -> Self {
        Self {
            name: name.into(),
            path: path.into(),
            size,
            modified_at: modified_at.into(),
            is_directory,
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
    fn test_artifact_file_creation() {
        let artifact = ArtifactFile::new(
            "requirements.md",
            "/path/to/requirements.md",
            1024,
            "2024-01-15T10:30:00Z",
            false,
        );

        assert_eq!(artifact.name, "requirements.md");
        assert_eq!(artifact.path, "/path/to/requirements.md");
        assert_eq!(artifact.size, 1024);
        assert!(!artifact.is_directory);
    }

    #[test]
    fn test_artifact_file_serialization() {
        let artifact = ArtifactFile::new(
            "spec.md",
            "/path/to/spec.md",
            2048,
            "2024-01-15T10:30:00Z",
            false,
        );

        let json = serde_json::to_string(&artifact).unwrap();

        // Verify camelCase serialization
        assert!(json.contains("\"modifiedAt\""));
        assert!(json.contains("\"isDirectory\""));

        // Verify round-trip
        let deserialized: ArtifactFile = serde_json::from_str(&json).unwrap();
        assert_eq!(artifact, deserialized);
    }

    #[test]
    fn test_artifact_file_directory() {
        let artifact = ArtifactFile::new(
            "subfolder",
            "/path/to/subfolder",
            0,
            "2024-01-15T10:30:00Z",
            true,
        );

        assert!(artifact.is_directory);
        assert_eq!(artifact.size, 0);
    }
}
