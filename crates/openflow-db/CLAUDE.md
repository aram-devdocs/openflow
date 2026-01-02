# Database Crate

## Purpose

Database layer handling connection pooling, migrations, and configuration. Provides the pool that services use for queries.

## Connection Pool

Initialize pool once at startup, share across all services. Configure pool size, timeouts, and connection limits based on deployment mode.

## Migrations

Migrations run automatically on startup. Keep migrations reversible when possible. Test migrations against production-like data.

## Configuration

Database path and settings come from environment or config. Support different paths for desktop (user data dir) and server (configurable).

## Query Patterns

Use parameterized queries for all user input. Prefer compile-time checked queries when available. Handle NULL values explicitly.

## Error Handling

Map database errors to domain errors with context. Don't expose raw database errors to clients. Log failures with enough context for debugging.
