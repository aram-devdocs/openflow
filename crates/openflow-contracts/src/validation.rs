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
//!
//! # Validate Trait
//!
//! Types that implement the `Validate` trait can perform runtime validation:
//!
//! ```rust,ignore
//! use openflow_contracts::validation::{Validate, ValidationResult};
//!
//! impl Validate for CreateProjectRequest {
//!     fn validate(&self) -> ValidationResult<()> {
//!         let mut errors = Vec::new();
//!
//!         if let Err(e) = validate_string_length("name", &self.name, Some(1), Some(255)) {
//!             errors.push(e);
//!         }
//!
//!         if errors.is_empty() {
//!             Ok(())
//!         } else {
//!             Err(ValidationError::multiple(errors))
//!         }
//!     }
//! }
//! ```

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

// =============================================================================
// Validate Trait
// =============================================================================

/// Trait for types that can be validated
///
/// Implement this trait to add runtime validation to request types.
/// The validation logic should match the `@validate` annotations in doc comments
/// so that Rust runtime validation matches generated Zod schemas.
///
/// # Example
///
/// ```rust,ignore
/// use openflow_contracts::validation::{Validate, ValidationResult, ValidationError};
///
/// struct CreateUserRequest {
///     name: String,
///     email: String,
/// }
///
/// impl Validate for CreateUserRequest {
///     fn validate(&self) -> ValidationResult<()> {
///         let mut errors = Vec::new();
///
///         if self.name.is_empty() {
///             errors.push(ValidationError::required("name"));
///         }
///
///         if !self.email.contains('@') {
///             errors.push(ValidationError::Format {
///                 field: "email".to_string(),
///                 format: "email".to_string(),
///             });
///         }
///
///         if errors.is_empty() {
///             Ok(())
///         } else {
///             Err(ValidationError::multiple(errors))
///         }
///     }
/// }
/// ```
pub trait Validate {
    /// Validate the instance and return any validation errors
    fn validate(&self) -> ValidationResult<()>;

    /// Validate and return the instance if valid, or an error if not
    fn validated(self) -> ValidationResult<Self>
    where
        Self: Sized,
    {
        self.validate()?;
        Ok(self)
    }

    /// Check if the instance is valid without consuming it
    fn is_valid(&self) -> bool {
        self.validate().is_ok()
    }
}

// =============================================================================
// Validation Helper Functions
// =============================================================================

/// Validate string length constraints
///
/// # Arguments
///
/// * `field` - Field name for error messages
/// * `value` - The string value to validate
/// * `min_length` - Optional minimum length (inclusive)
/// * `max_length` - Optional maximum length (inclusive)
///
/// # Returns
///
/// `Ok(())` if validation passes, `Err(ValidationError)` otherwise
pub fn validate_string_length(
    field: &str,
    value: &str,
    min_length: Option<usize>,
    max_length: Option<usize>,
) -> ValidationResult<()> {
    let len = value.chars().count();

    if let Some(min) = min_length {
        if len < min {
            return Err(ValidationError::min_length(field, min, len));
        }
    }

    if let Some(max) = max_length {
        if len > max {
            return Err(ValidationError::max_length(field, max, len));
        }
    }

    Ok(())
}

/// Validate that a required string field is not empty
///
/// # Arguments
///
/// * `field` - Field name for error messages
/// * `value` - The string value to validate
///
/// # Returns
///
/// `Ok(())` if the string is not empty, `Err(ValidationError::Required)` otherwise
pub fn validate_required_string(field: &str, value: &str) -> ValidationResult<()> {
    if value.trim().is_empty() {
        return Err(ValidationError::required(field));
    }
    Ok(())
}

/// Validate that an optional field has a value
///
/// # Arguments
///
/// * `field` - Field name for error messages
/// * `value` - The optional value to validate
///
/// # Returns
///
/// `Ok(())` if the option is Some, `Err(ValidationError::Required)` otherwise
pub fn validate_required<T>(field: &str, value: &Option<T>) -> ValidationResult<()> {
    if value.is_none() {
        return Err(ValidationError::required(field));
    }
    Ok(())
}

/// Validate string format
///
/// # Arguments
///
/// * `field` - Field name for error messages
/// * `value` - The string value to validate
/// * `format` - The expected format
///
/// # Returns
///
/// `Ok(())` if format is valid, `Err(ValidationError::Format)` otherwise
pub fn validate_string_format(
    field: &str,
    value: &str,
    format: StringFormat,
) -> ValidationResult<()> {
    let is_valid = match format {
        StringFormat::Email => {
            // Basic email validation: contains @ with text on both sides
            // Note: This is intentionally simple and does NOT enforce RFC 5322.
            // For stricter validation, consider using the `email_address` crate.
            // This is acceptable for initial frontend validation; email verification
            // should always happen via confirmation email for real accounts.
            let parts: Vec<&str> = value.split('@').collect();
            parts.len() == 2 && !parts[0].is_empty() && parts[1].contains('.')
        }
        StringFormat::Url => {
            // Basic URL validation: starts with http:// or https://
            value.starts_with("http://") || value.starts_with("https://")
        }
        StringFormat::Uuid => {
            // UUID v4 format: 8-4-4-4-12 hex characters
            let parts: Vec<&str> = value.split('-').collect();
            parts.len() == 5
                && parts[0].len() == 8
                && parts[1].len() == 4
                && parts[2].len() == 4
                && parts[3].len() == 4
                && parts[4].len() == 12
                && value.chars().all(|c| c.is_ascii_hexdigit() || c == '-')
        }
        StringFormat::Path => {
            // Path validation: not empty and no null bytes
            !value.is_empty() && !value.contains('\0')
        }
        StringFormat::DateTime => {
            // Basic ISO 8601 validation: contains T separator
            value.contains('T') && value.len() >= 19
        }
    };

    if is_valid {
        Ok(())
    } else {
        Err(ValidationError::Format {
            field: field.to_string(),
            format: format!("{:?}", format).to_lowercase(),
        })
    }
}

/// Validate string matches a pattern
///
/// # Arguments
///
/// * `field` - Field name for error messages
/// * `value` - The string value to validate
/// * `pattern` - The pattern string to match against
///
/// # Returns
///
/// `Ok(())` if pattern matches, `Err(ValidationError::Pattern)` otherwise
///
/// # Known Limitation
///
/// **This is NOT regex matching.** Currently implements simple substring/contains
/// matching for basic validation needs. For full regex support, add the `regex`
/// crate as a dependency and update this function.
///
/// Current behavior: `value.contains(pattern)` - checks if pattern is a substring.
/// This is intentionally simple for the initial implementation and sufficient for
/// basic validation cases like checking for required characters or prefixes.
pub fn validate_string_pattern(field: &str, value: &str, pattern: &str) -> ValidationResult<()> {
    // IMPLEMENTATION NOTE: Simple substring matching, NOT regex
    // For full regex support, add `regex` crate and update this function
    if !value.contains(pattern) {
        return Err(ValidationError::Pattern {
            field: field.to_string(),
            pattern: pattern.to_string(),
        });
    }
    Ok(())
}

/// Validate number is within range
///
/// # Arguments
///
/// * `field` - Field name for error messages
/// * `value` - The numeric value to validate
/// * `min` - Optional minimum value (inclusive)
/// * `max` - Optional maximum value (inclusive)
///
/// # Returns
///
/// `Ok(())` if within range, `Err(ValidationError)` otherwise
pub fn validate_number_range(
    field: &str,
    value: f64,
    min: Option<f64>,
    max: Option<f64>,
) -> ValidationResult<()> {
    if let Some(min_val) = min {
        if value < min_val {
            return Err(ValidationError::NumberMin {
                field: field.to_string(),
                min: min_val,
                actual: value,
            });
        }
    }

    if let Some(max_val) = max {
        if value > max_val {
            return Err(ValidationError::NumberMax {
                field: field.to_string(),
                max: max_val,
                actual: value,
            });
        }
    }

    Ok(())
}

/// Validate that a number is an integer
///
/// # Arguments
///
/// * `field` - Field name for error messages
/// * `value` - The numeric value to validate
///
/// # Returns
///
/// `Ok(())` if the value is an integer, `Err(ValidationError::NotInteger)` otherwise
pub fn validate_integer(field: &str, value: f64) -> ValidationResult<()> {
    if value.fract() != 0.0 {
        return Err(ValidationError::NotInteger {
            field: field.to_string(),
        });
    }
    Ok(())
}

/// Validate array length constraints
///
/// # Arguments
///
/// * `field` - Field name for error messages
/// * `len` - The array length
/// * `min_items` - Optional minimum number of items
/// * `max_items` - Optional maximum number of items
///
/// # Returns
///
/// `Ok(())` if within range, `Err(ValidationError)` otherwise
pub fn validate_array_length(
    field: &str,
    len: usize,
    min_items: Option<usize>,
    max_items: Option<usize>,
) -> ValidationResult<()> {
    if let Some(min) = min_items {
        if len < min {
            return Err(ValidationError::MinItems {
                field: field.to_string(),
                min,
                actual: len,
            });
        }
    }

    if let Some(max) = max_items {
        if len > max {
            return Err(ValidationError::MaxItems {
                field: field.to_string(),
                max,
                actual: len,
            });
        }
    }

    Ok(())
}

/// Validate array items are unique
///
/// # Arguments
///
/// * `field` - Field name for error messages
/// * `items` - The array items to check for uniqueness
///
/// # Returns
///
/// `Ok(())` if all items are unique, `Err(ValidationError::NotUnique)` otherwise
pub fn validate_array_unique<T: Eq + std::hash::Hash>(
    field: &str,
    items: &[T],
) -> ValidationResult<()> {
    use std::collections::HashSet;
    let mut seen = HashSet::new();

    for item in items {
        if !seen.insert(item) {
            return Err(ValidationError::NotUnique {
                field: field.to_string(),
            });
        }
    }

    Ok(())
}

// =============================================================================
// Validation Builder
// =============================================================================

/// A builder for collecting multiple validation errors
///
/// This provides a convenient way to validate multiple fields and collect
/// all errors before returning.
///
/// # Example
///
/// ```rust,ignore
/// use openflow_contracts::validation::{ValidationCollector, validate_string_length};
///
/// fn validate_user(name: &str, bio: &str) -> ValidationResult<()> {
///     ValidationCollector::new()
///         .validate(|| validate_string_length("name", name, Some(1), Some(100)))
///         .validate(|| validate_string_length("bio", bio, None, Some(500)))
///         .finish()
/// }
/// ```
#[derive(Default)]
pub struct ValidationCollector {
    errors: Vec<ValidationError>,
}

impl ValidationCollector {
    /// Create a new validation collector
    pub fn new() -> Self {
        Self::default()
    }

    /// Add a validation check
    ///
    /// If the validation fails, the error is collected.
    pub fn validate<F>(mut self, f: F) -> Self
    where
        F: FnOnce() -> ValidationResult<()>,
    {
        if let Err(e) = f() {
            self.errors.push(e);
        }
        self
    }

    /// Add an error directly
    pub fn add_error(mut self, error: ValidationError) -> Self {
        self.errors.push(error);
        self
    }

    /// Add an error conditionally
    pub fn add_error_if(self, condition: bool, error: ValidationError) -> Self {
        if condition {
            self.add_error(error)
        } else {
            self
        }
    }

    /// Check if any errors have been collected
    pub fn has_errors(&self) -> bool {
        !self.errors.is_empty()
    }

    /// Get the number of errors
    pub fn error_count(&self) -> usize {
        self.errors.len()
    }

    /// Finish validation and return result
    ///
    /// Returns `Ok(())` if no errors were collected,
    /// or `Err(ValidationError)` with all collected errors.
    pub fn finish(self) -> ValidationResult<()> {
        if self.errors.is_empty() {
            Ok(())
        } else {
            Err(ValidationError::multiple(self.errors))
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

    // =========================================================================
    // Validate Trait Tests
    // =========================================================================

    struct TestRequest {
        name: String,
        email: String,
    }

    impl Validate for TestRequest {
        fn validate(&self) -> ValidationResult<()> {
            ValidationCollector::new()
                .validate(|| validate_required_string("name", &self.name))
                .validate(|| validate_string_format("email", &self.email, StringFormat::Email))
                .finish()
        }
    }

    #[test]
    fn test_validate_trait_valid() {
        let req = TestRequest {
            name: "John".to_string(),
            email: "john@example.com".to_string(),
        };
        assert!(req.is_valid());
        assert!(req.validate().is_ok());
    }

    #[test]
    fn test_validate_trait_invalid() {
        let req = TestRequest {
            name: "".to_string(),
            email: "not-an-email".to_string(),
        };
        assert!(!req.is_valid());
        let result = req.validate();
        assert!(result.is_err());
        if let Err(ValidationError::Multiple(errors)) = result {
            assert_eq!(errors.len(), 2);
        } else {
            panic!("Expected Multiple errors");
        }
    }

    #[test]
    fn test_validated_method() {
        let req = TestRequest {
            name: "John".to_string(),
            email: "john@example.com".to_string(),
        };
        let result = req.validated();
        assert!(result.is_ok());
    }

    // =========================================================================
    // String Validation Tests
    // =========================================================================

    #[test]
    fn test_validate_string_length_valid() {
        assert!(validate_string_length("name", "hello", Some(1), Some(10)).is_ok());
        assert!(validate_string_length("name", "hello", Some(5), Some(5)).is_ok());
        assert!(validate_string_length("name", "hello", None, Some(10)).is_ok());
        assert!(validate_string_length("name", "hello", Some(1), None).is_ok());
    }

    #[test]
    fn test_validate_string_length_too_short() {
        let result = validate_string_length("name", "", Some(1), Some(10));
        assert!(matches!(
            result,
            Err(ValidationError::MinLength {
                min: 1,
                actual: 0,
                ..
            })
        ));
    }

    #[test]
    fn test_validate_string_length_too_long() {
        let result = validate_string_length("name", "hello world", Some(1), Some(5));
        assert!(matches!(
            result,
            Err(ValidationError::MaxLength {
                max: 5,
                actual: 11,
                ..
            })
        ));
    }

    #[test]
    fn test_validate_string_length_unicode() {
        // Test with unicode characters (emoji = multiple bytes but 1 char)
        assert!(validate_string_length("name", "👋", Some(1), Some(1)).is_ok());
        assert!(validate_string_length("name", "👋👋", Some(1), Some(2)).is_ok());
    }

    #[test]
    fn test_validate_required_string() {
        assert!(validate_required_string("name", "hello").is_ok());
        assert!(validate_required_string("name", "").is_err());
        assert!(validate_required_string("name", "   ").is_err());
    }

    #[test]
    fn test_validate_required() {
        assert!(validate_required::<String>("name", &Some("hello".to_string())).is_ok());
        assert!(validate_required::<String>("name", &None).is_err());
    }

    // =========================================================================
    // Format Validation Tests
    // =========================================================================

    #[test]
    fn test_validate_email_format() {
        assert!(validate_string_format("email", "user@example.com", StringFormat::Email).is_ok());
        assert!(
            validate_string_format("email", "user@sub.example.com", StringFormat::Email).is_ok()
        );
        assert!(validate_string_format("email", "invalid", StringFormat::Email).is_err());
        assert!(validate_string_format("email", "@example.com", StringFormat::Email).is_err());
        assert!(validate_string_format("email", "user@", StringFormat::Email).is_err());
    }

    #[test]
    fn test_validate_url_format() {
        assert!(validate_string_format("url", "https://example.com", StringFormat::Url).is_ok());
        assert!(validate_string_format("url", "http://example.com", StringFormat::Url).is_ok());
        assert!(validate_string_format("url", "ftp://example.com", StringFormat::Url).is_err());
        assert!(validate_string_format("url", "example.com", StringFormat::Url).is_err());
    }

    #[test]
    fn test_validate_uuid_format() {
        assert!(validate_string_format(
            "id",
            "550e8400-e29b-41d4-a716-446655440000",
            StringFormat::Uuid
        )
        .is_ok());
        assert!(validate_string_format("id", "not-a-uuid", StringFormat::Uuid).is_err());
        assert!(validate_string_format(
            "id",
            "550e8400e29b41d4a716446655440000",
            StringFormat::Uuid
        )
        .is_err());
    }

    #[test]
    fn test_validate_path_format() {
        assert!(validate_string_format("path", "/home/user", StringFormat::Path).is_ok());
        assert!(validate_string_format("path", "C:\\Users\\user", StringFormat::Path).is_ok());
        assert!(validate_string_format("path", "", StringFormat::Path).is_err());
    }

    #[test]
    fn test_validate_datetime_format() {
        assert!(
            validate_string_format("date", "2024-01-15T10:30:00Z", StringFormat::DateTime).is_ok()
        );
        assert!(validate_string_format("date", "2024-01-15", StringFormat::DateTime).is_err());
    }

    // =========================================================================
    // Number Validation Tests
    // =========================================================================

    #[test]
    fn test_validate_number_range_valid() {
        assert!(validate_number_range("age", 25.0, Some(0.0), Some(120.0)).is_ok());
        assert!(validate_number_range("age", 0.0, Some(0.0), Some(120.0)).is_ok());
        assert!(validate_number_range("age", 120.0, Some(0.0), Some(120.0)).is_ok());
    }

    #[test]
    fn test_validate_number_range_too_small() {
        let result = validate_number_range("age", -1.0, Some(0.0), Some(120.0));
        assert!(matches!(result, Err(ValidationError::NumberMin { .. })));
    }

    #[test]
    fn test_validate_number_range_too_large() {
        let result = validate_number_range("age", 150.0, Some(0.0), Some(120.0));
        assert!(matches!(result, Err(ValidationError::NumberMax { .. })));
    }

    #[test]
    fn test_validate_integer() {
        assert!(validate_integer("count", 5.0).is_ok());
        assert!(validate_integer("count", 0.0).is_ok());
        assert!(validate_integer("count", -10.0).is_ok());
        assert!(validate_integer("count", 5.5).is_err());
        assert!(validate_integer("count", 5.1).is_err());
    }

    // =========================================================================
    // Array Validation Tests
    // =========================================================================

    #[test]
    fn test_validate_array_length_valid() {
        assert!(validate_array_length("items", 5, Some(1), Some(10)).is_ok());
        assert!(validate_array_length("items", 1, Some(1), Some(10)).is_ok());
        assert!(validate_array_length("items", 10, Some(1), Some(10)).is_ok());
    }

    #[test]
    fn test_validate_array_length_too_few() {
        let result = validate_array_length("items", 0, Some(1), Some(10));
        assert!(matches!(
            result,
            Err(ValidationError::MinItems {
                min: 1,
                actual: 0,
                ..
            })
        ));
    }

    #[test]
    fn test_validate_array_length_too_many() {
        let result = validate_array_length("items", 15, Some(1), Some(10));
        assert!(matches!(
            result,
            Err(ValidationError::MaxItems {
                max: 10,
                actual: 15,
                ..
            })
        ));
    }

    #[test]
    fn test_validate_array_unique() {
        assert!(validate_array_unique("tags", &["a", "b", "c"]).is_ok());
        assert!(validate_array_unique("tags", &[1, 2, 3]).is_ok());
        assert!(validate_array_unique::<i32>("tags", &[]).is_ok());
    }

    #[test]
    fn test_validate_array_not_unique() {
        let result = validate_array_unique("tags", &["a", "b", "a"]);
        assert!(matches!(result, Err(ValidationError::NotUnique { .. })));
    }

    // =========================================================================
    // ValidationCollector Tests
    // =========================================================================

    #[test]
    fn test_validation_collector_no_errors() {
        let result = ValidationCollector::new()
            .validate(|| validate_string_length("name", "hello", Some(1), Some(10)))
            .validate(|| validate_string_length("bio", "world", Some(1), Some(10)))
            .finish();
        assert!(result.is_ok());
    }

    #[test]
    fn test_validation_collector_collects_errors() {
        let collector = ValidationCollector::new()
            .validate(|| validate_string_length("name", "", Some(1), Some(10)))
            .validate(|| validate_string_length("bio", "too long string here", Some(1), Some(5)));

        assert!(collector.has_errors());
        assert_eq!(collector.error_count(), 2);

        let result = collector.finish();
        assert!(matches!(result, Err(ValidationError::Multiple(errors)) if errors.len() == 2));
    }

    #[test]
    fn test_validation_collector_add_error() {
        let result = ValidationCollector::new()
            .add_error(ValidationError::required("name"))
            .finish();
        assert!(result.is_err());
    }

    #[test]
    fn test_validation_collector_add_error_if() {
        let result = ValidationCollector::new()
            .add_error_if(true, ValidationError::required("name"))
            .add_error_if(false, ValidationError::required("email"))
            .finish();

        if let Err(ValidationError::Required { field }) = result {
            assert_eq!(field, "name");
        } else {
            panic!("Expected single Required error");
        }
    }
}
