//! HTTP Error Types
//!
//! Provides error types with proper HTTP response formatting.

use axum::{
    http::StatusCode,
    response::{IntoResponse, Response},
    Json,
};
use serde::Serialize;

/// Server error type
#[derive(Debug, thiserror::Error)]
pub enum ServerError {
    #[error("Not found: {0}")]
    NotFound(String),

    #[error("Bad request: {0}")]
    BadRequest(String),

    #[error("Unauthorized: {0}")]
    Unauthorized(String),

    #[error("Forbidden: {0}")]
    Forbidden(String),

    #[error("Conflict: {0}")]
    Conflict(String),

    #[error("Internal error: {0}")]
    Internal(String),

    #[error("Database error: {0}")]
    Database(String),

    #[error("Service error: {0}")]
    Service(String),

    #[error("Configuration error: {0}")]
    Config(String),

    #[error("WebSocket error: {0}")]
    WebSocket(String),
}

/// JSON error response body
#[derive(Serialize)]
struct ErrorResponse {
    error: String,
    message: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    details: Option<String>,
}

impl IntoResponse for ServerError {
    fn into_response(self) -> Response {
        let (status, error_type, details) = match &self {
            ServerError::NotFound(msg) => (StatusCode::NOT_FOUND, "not_found", Some(msg.clone())),
            ServerError::BadRequest(msg) => {
                (StatusCode::BAD_REQUEST, "bad_request", Some(msg.clone()))
            }
            ServerError::Unauthorized(msg) => {
                (StatusCode::UNAUTHORIZED, "unauthorized", Some(msg.clone()))
            }
            ServerError::Forbidden(msg) => {
                (StatusCode::FORBIDDEN, "forbidden", Some(msg.clone()))
            }
            ServerError::Conflict(msg) => (StatusCode::CONFLICT, "conflict", Some(msg.clone())),
            ServerError::Internal(_) => {
                (StatusCode::INTERNAL_SERVER_ERROR, "internal_error", None)
            }
            ServerError::Database(_) => {
                (StatusCode::INTERNAL_SERVER_ERROR, "database_error", None)
            }
            ServerError::Service(msg) => {
                (StatusCode::INTERNAL_SERVER_ERROR, "service_error", Some(msg.clone()))
            }
            ServerError::Config(msg) => {
                (StatusCode::INTERNAL_SERVER_ERROR, "config_error", Some(msg.clone()))
            }
            ServerError::WebSocket(msg) => {
                (StatusCode::INTERNAL_SERVER_ERROR, "websocket_error", Some(msg.clone()))
            }
        };

        let body = ErrorResponse {
            error: error_type.to_string(),
            message: self.to_string(),
            details,
        };

        (status, Json(body)).into_response()
    }
}

impl From<sqlx::Error> for ServerError {
    fn from(err: sqlx::Error) -> Self {
        tracing::error!("Database error: {}", err);
        ServerError::Database(err.to_string())
    }
}

impl From<openflow_core::services::ServiceError> for ServerError {
    fn from(err: openflow_core::services::ServiceError) -> Self {
        use openflow_core::services::ServiceError;

        match err {
            ServiceError::NotFound { entity, id } => {
                ServerError::NotFound(format!("{} with id {} not found", entity, id))
            }
            ServiceError::Validation(msg) => ServerError::BadRequest(msg),
            ServiceError::Conflict(msg) => ServerError::Conflict(msg),
            ServiceError::PermissionDenied(msg) => ServerError::Forbidden(msg),
            ServiceError::Database(e) => ServerError::Database(e.to_string()),
            ServiceError::Process(msg) => ServerError::Service(msg),
            ServiceError::Io(e) => ServerError::Internal(e.to_string()),
            ServiceError::Git(msg) => ServerError::Service(format!("Git error: {}", msg)),
            ServiceError::Config(msg) => ServerError::Config(msg),
            ServiceError::External(msg) => ServerError::Service(format!("External error: {}", msg)),
            ServiceError::Internal(msg) => ServerError::Internal(msg),
        }
    }
}

impl From<std::io::Error> for ServerError {
    fn from(err: std::io::Error) -> Self {
        tracing::error!("IO error: {}", err);
        ServerError::Internal(err.to_string())
    }
}

impl ServerError {
    /// Create a not found error
    pub fn not_found(msg: impl Into<String>) -> Self {
        ServerError::NotFound(msg.into())
    }

    /// Create a bad request error
    pub fn bad_request(msg: impl Into<String>) -> Self {
        ServerError::BadRequest(msg.into())
    }

    /// Create an internal error
    pub fn internal(msg: impl Into<String>) -> Self {
        ServerError::Internal(msg.into())
    }

    /// Create a service error
    pub fn service(msg: impl Into<String>) -> Self {
        ServerError::Service(msg.into())
    }
}

/// Result type alias for server operations
pub type ServerResult<T> = Result<T, ServerError>;

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_error_display() {
        let err = ServerError::NotFound("Project".to_string());
        assert_eq!(err.to_string(), "Not found: Project");
    }

    #[test]
    fn test_error_helpers() {
        let err = ServerError::not_found("user");
        assert!(matches!(err, ServerError::NotFound(_)));

        let err = ServerError::bad_request("invalid input");
        assert!(matches!(err, ServerError::BadRequest(_)));

        let err = ServerError::internal("something went wrong");
        assert!(matches!(err, ServerError::Internal(_)));
    }
}
