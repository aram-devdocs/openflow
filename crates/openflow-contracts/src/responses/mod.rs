//! Response Types
//!
//! Response types and API response wrappers.
//! These define the shape of data returned from the backend.

use serde::{Deserialize, Serialize};
use typeshare::typeshare;

/// Response for GitHub CLI installation check
#[typeshare]
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CliInstalledResponse {
    /// Whether the GitHub CLI is installed
    pub installed: bool,
}

/// Response for GitHub CLI authentication status
#[typeshare]
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AuthStatusResponse {
    /// Whether the GitHub CLI is authenticated
    pub authenticated: bool,
}
