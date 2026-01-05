/**
 * @openflow/agent-bridge
 *
 * Node.js bridge server that connects OpenFlow's Rust backend
 * to the Claude Agent SDK for TypeScript.
 *
 * ## Purpose
 *
 * The Rust backend cannot directly use the Claude Agent SDK (which is
 * TypeScript/Python). This bridge provides an HTTP interface that:
 *
 * 1. Accepts execution requests from Rust
 * 2. Calls the Claude Agent SDK
 * 3. Streams events back via SSE
 *
 * ## Usage
 *
 * Start the server:
 * ```bash
 * pnpm --filter @openflow/agent-bridge dev
 * ```
 *
 * Call from Rust:
 * ```rust
 * let response = reqwest::Client::new()
 *     .post("http://localhost:3002/execute")
 *     .json(&json!({
 *         "prompt": "Fix the bug in auth.py",
 *         "workingDir": "/path/to/project",
 *         "sessionId": optional_session_id,
 *     }))
 *     .send()
 *     .await?;
 *
 * // Parse SSE stream
 * ```
 *
 * @see server.ts - Main HTTP server implementation
 * @see types.ts - Type definitions for requests and events
 */

export * from './types.js';
export { app } from './server.js';
