# Core Crate

## Purpose

Contains all business logic as pure service functions. Shared by both the HTTP server and Tauri desktop app. No transport-specific code lives here.

## Service Function Pattern

Services take dependencies as arguments and return Results. They're pure functions that don't know about HTTP, Tauri, or any transport.

```rust
pub fn create(pool: &DbPool, input: CreateInput) -> ServiceResult<Entity>
```

## Error Handling

Use `ServiceResult<T>` which wraps `Result<T, ServiceError>`. Chain errors with context. Never panic - always return errors gracefully.

## Validation

Validate inputs at the start of service functions. Return validation errors with clear messages. Don't rely on database constraints for validation.

## Database Operations

Use the pool passed as argument. Keep transactions focused. Handle deadlocks and retries at this layer.

## Event Broadcasting

Services don't broadcast events directly. They return results, and the caller (route handler or command) broadcasts. This keeps services transport-agnostic.

## Testing

Services are pure functions, making them easy to test. Use in-memory databases for unit tests. Mock external dependencies.
