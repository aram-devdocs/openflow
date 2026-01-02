# Server Crate

## Purpose

HTTP/WebSocket server using Axum. Provides REST API and real-time events. Can run embedded in Tauri or standalone.

## Route Handler Pattern

Handlers are thin wrappers that extract state, call core services, broadcast events, and return responses.

```rust
pub async fn create(State(state): State<AppState>, Json(input): Json<Input>) -> Result<Json<Entity>, Error>
```

## State Management

App state holds database pool, event broadcaster, and configuration. Shared across all handlers via Axum's State extractor.

## Event Broadcasting

After successful mutations, broadcast events to all connected WebSocket clients. Use the event broadcaster from state.

## WebSocket Protocol

Clients subscribe to channels, receive events on those channels. Handle connection lifecycle, heartbeats, and reconnection.

## Error Responses

Map service errors to appropriate HTTP status codes. Return consistent error JSON format. Include enough detail for debugging.

## CORS and Security

Configure CORS for allowed origins. Validate inputs, sanitize outputs. Follow security best practices for public APIs.
