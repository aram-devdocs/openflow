# Utils Package

## Purpose

Pure utility functions with no side effects. Shared helpers used across the codebase.

## Function Pattern

Utils are pure functions - same inputs always produce same outputs. No external state, no side effects.

## Logging

Provides createLogger for consistent logging across packages. Loggers support child contexts for filtering.

## No Dependencies

Utils don't import from other openflow packages. They're at the bottom of the dependency hierarchy.

## Testing

Pure functions are easy to test. Cover edge cases and error conditions. No mocking needed.

## Categories

Organize utils by domain: string manipulation, date formatting, array helpers, etc. Keep functions focused.
