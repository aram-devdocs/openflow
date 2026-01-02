/**
 * @openflow/queries
 *
 * Unified query layer for frontend-backend communication.
 *
 * This package provides:
 * - `invoke()` - Execute backend commands (works in Tauri and browser)
 * - `subscribe()` - Subscribe to real-time events (works in Tauri and browser)
 * - Domain-specific query functions (projects, tasks, chats, etc.)
 *
 * ## Usage
 *
 * ```ts
 * import { invoke, subscribe, isTauriContext } from '@openflow/queries';
 *
 * // Check context
 * if (isTauriContext()) {
 *   console.log('Running as desktop app');
 * }
 *
 * // Invoke commands (works in both contexts)
 * const projects = await invoke<Project[]>('list_projects');
 *
 * // Subscribe to events (works in both contexts)
 * const unsubscribe = subscribe('data-changed', (event) => {
 *   console.log('Data changed:', event);
 * });
 * ```
 *
 * ## Architecture
 *
 * The query layer uses a transport abstraction that automatically selects:
 * - **Tauri IPC** when running as a desktop app
 * - **HTTP REST API + WebSocket** when running in a browser
 *
 * @see transport/index.ts - Transport abstraction layer
 * @see CLAUDE.md - Flexible Backend Architecture section
 */

// Core utilities and transport
export * from './utils';

// Domain-specific queries
export * from './projects';
export * from './tasks';
export * from './chats';
export * from './messages';
export * from './processes';
export * from './executor-profiles';
export * from './settings';
export * from './git';
export * from './search';
export * from './workflows';
export * from './artifacts';
export * from './terminal';
export * from './github';
export * from './system';

// Re-export transport types for advanced usage
export type {
  Transport,
  HttpTransportConfig,
  DataChangedEvent,
  ProcessOutputEvent,
  ProcessStatusEvent,
} from './transport/index.js';

export {
  isTauriContext as checkTauriContext,
  getBackendUrl,
  getWebSocketUrl,
  getTransport,
  createTransport,
  resetTransport,
} from './transport/index.js';
