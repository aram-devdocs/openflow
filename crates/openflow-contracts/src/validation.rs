//! Validation Attributes for Zod Schema Generation
//!
//! These types define validation rules that are:
//! 1. Enforced at runtime in Rust services
//! 2. Generated as Zod schemas for TypeScript
//!
//! # Usage
//!
//! Validation rules are specified using doc comment annotations:
//!
//! ```rust,ignore
//! pub struct CreateProjectRequest {
//!     /// Project name (1-255 characters)
//!     /// @validate: min_length=1, max_length=255
//!     pub name: String,
//! }
//! ```
//!
//! These annotations are parsed by code generators to produce:
//! - Zod schemas with matching constraints
//! - Runtime validation in Rust services

use serde::{Deserialize, Serialize};

/// Validation rules for string fields
#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct StringValidation {
    /// Minimum length in characters
    pub min_length: Option<usize>,
    /// Maximum length in characters
    pub max_length: Option<usize>,
    /// Regex pattern the string must match
    pub pattern: Option<String>,
    /// Common format validation
    pub format: Option<StringFormat>,
}

/// Common string formats for validation
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "snake_case")]
pub enum StringFormat {
    /// Valid email address
    Email,
    /// Valid URL
    Url,
    /// Valid UUID (v4)
    Uuid,
    /// Valid file system path
    Path,
    /// ISO 8601 datetime
    DateTime,
}

/// Validation rules for numeric fields
#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct NumberValidation {
    /// Minimum value (inclusive)
    pub min: Option<f64>,
    /// Maximum value (inclusive)
    pub max: Option<f64>,
    /// Must be an integer
    pub integer: bool,
}

/// Validation rules for array fields
#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct ArrayValidation {
    /// Minimum number of items
    pub min_items: Option<usize>,
    /// Maximum number of items
    pub max_items: Option<usize>,
    /// All items must be unique
    pub unique: bool,
}

/// Result of validation
pub type ValidationResult<T> = Result<T, ValidationError>;

/// Validation error with details about the failure
#[derive(Debug, Clone, thiserror::Error)]
pub enum ValidationError {
    /// Field is required but was not provided
    #[error("Field '{field}' is required")]
    Required { field: String },

    /// String field is too short
    #[error("Field '{field}' must be at least {min} characters (got {actual})")]
    MinLength {
        field: String,
        min: usize,
        actual: usize,
    },

    /// String field is too long
    #[error("Field '{field}' must be at most {max} characters (got {actual})")]
    MaxLength {
        field: String,
        max: usize,
        actual: usize,
    },

    /// String field doesn't match pattern
    #[error("Field '{field}' must match pattern: {pattern}")]
    Pattern { field: String, pattern: String },

    /// String field doesn't match expected format
    #[error("Field '{field}' must be a valid {format}")]
    Format { field: String, format: String },

    /// Number is too small
    #[error("Field '{field}' must be at least {min} (got {actual})")]
    NumberMin {
        field: String,
        min: f64,
        actual: f64,
    },

    /// Number is too large
    #[error("Field '{field}' must be at most {max} (got {actual})")]
    NumberMax {
        field: String,
        max: f64,
        actual: f64,
    },

    /// Number must be an integer
    #[error("Field '{field}' must be an integer")]
    NotInteger { field: String },

    /// Array has too few items
    #[error("Field '{field}' must have at least {min} items (got {actual})")]
    MinItems {
        field: String,
        min: usize,
        actual: usize,
    },

    /// Array has too many items
    #[error("Field '{field}' must have at most {max} items (got {actual})")]
    MaxItems {
        field: String,
        max: usize,
        actual: usize,
    },

    /// Array items must be unique
    #[error("Field '{field}' must have unique items")]
    NotUnique { field: String },

    /// Multiple validation errors occurred
    #[error("Multiple validation errors: {0:?}")]
    Multiple(Vec<ValidationError>),
}

impl ValidationError {
    /// Create a ValidationError for a required field
    pub fn required(field: impl Into<String>) -> Self {
        Self::Required {
            field: field.into(),
        }
    }

    /// Create a ValidationError for min length violation
    pub fn min_length(field: impl Into<String>, min: usize, actual: usize) -> Self {
        Self::MinLength {
            field: field.into(),
            min,
            actual,
        }
    }

    /// Create a ValidationError for max length violation
    pub fn max_length(field: impl Into<String>, max: usize, actual: usize) -> Self {
        Self::MaxLength {
            field: field.into(),
            max,
            actual,
        }
    }

    /// Combine multiple validation errors
    pub fn multiple(errors: Vec<ValidationError>) -> Self {
        if errors.len() == 1 {
            errors.into_iter().next().unwrap()
        } else {
            Self::Multiple(errors)
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_validation_error_display() {
        let err = ValidationError::required("name");
        assert_eq!(err.to_string(), "Field 'name' is required");

        let err = ValidationError::min_length("name", 1, 0);
        assert_eq!(
            err.to_string(),
            "Field 'name' must be at least 1 characters (got 0)"
        );
    }

    #[test]
    fn test_multiple_errors() {
        let errors = vec![
            ValidationError::required("name"),
            ValidationError::required("email"),
        ];
        let err = ValidationError::multiple(errors);
        assert!(matches!(err, ValidationError::Multiple(_)));
    }

    #[test]
    fn test_single_error_not_wrapped() {
        let errors = vec![ValidationError::required("name")];
        let err = ValidationError::multiple(errors);
        assert!(matches!(err, ValidationError::Required { .. }));
    }
}
