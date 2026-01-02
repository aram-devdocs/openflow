/**
 * Transport Abstraction Layer
 *
 * Provides a unified interface for frontend-backend communication that works
 * in both Tauri (IPC) and browser (HTTP/WebSocket) contexts.
 *
 * This module enables the "flexible backend" architecture where the frontend
 * can seamlessly switch between:
 * - Tauri IPC (desktop app with built-in backend)
 * - HTTP REST API + WebSocket (browser connecting to standalone server)
 *
 * ## Architecture
 *
 * ```
 * Frontend Code
 *       |
 *       v
 * Transport Interface (this module)
 *       |
 *       +---> TauriTransport (Tauri IPC)
 *       |           |
 *       |           v
 *       |     Tauri Backend (built-in)
 *       |
 *       +---> HttpTransport (HTTP + WebSocket)
 *                   |
 *                   v
 *             Standalone Server (openflow-server)
 * ```
 *
 * ## Usage
 *
 * ```ts
 * import { getTransport } from '@openflow/queries/transport';
 *
 * const transport = await getTransport();
 *
 * // Invoke a command (works in both contexts)
 * const projects = await transport.invoke<Project[]>('list_projects');
 *
 * // Subscribe to events (works in both contexts)
 * const unsubscribe = transport.subscribe('data-changed', (event) => {
 *   console.log('Data changed:', event);
 * });
 * ```
 *
 * @see CLAUDE.md - Flexible Backend Architecture section
 * @see command-map.generated.ts - Command to endpoint mapping
 */

import { createLogger } from '@openflow/utils';

const logger = createLogger('transport');

// =============================================================================
// Types
// =============================================================================

/**
 * Transport interface for frontend-backend communication.
 *
 * All query functions use this interface, allowing seamless switching
 * between Tauri IPC and HTTP REST API.
 */
export interface Transport {
  /**
   * Invoke a backend command.
   *
   * In Tauri context, this calls `@tauri-apps/api/core` invoke.
   * In browser context, this makes an HTTP request.
   *
   * @param cmd - Command name (Tauri command or mapped to HTTP endpoint)
   * @param args - Optional arguments for the command
   * @returns Promise resolving to the command result
   * @throws Error if the command fails
   *
   * @example
   * ```ts
   * // Simple query
   * const projects = await transport.invoke<Project[]>('list_projects');
   *
   * // Query with arguments
   * const project = await transport.invoke<Project>('get_project', { id: 'abc123' });
   *
   * // Mutation with request body
   * const newProject = await transport.invoke<Project>('create_project', {
   *   request: { name: 'My Project', gitRepoPath: '/path/to/repo' }
   * });
   * ```
   */
  invoke<T>(cmd: string, args?: Record<string, unknown>): Promise<T>;

  /**
   * Subscribe to an event channel.
   *
   * In Tauri context, this uses `@tauri-apps/api/event` listen.
   * In browser context, this subscribes via WebSocket.
   *
   * @param channel - Event channel name to subscribe to
   * @param handler - Callback function for events
   * @returns Unsubscribe function to stop receiving events
   *
   * @example
   * ```ts
   * // Subscribe to data changes for cache invalidation
   * const unsubscribe = transport.subscribe('data-changed', (event) => {
   *   const { entity, action, id } = event as DataChangedEvent;
   *   queryClient.invalidateQueries({ queryKey: [entity] });
   * });
   *
   * // Subscribe to process output
   * const unsubscribe = transport.subscribe(`process-output-${processId}`, (event) => {
   *   console.log(event.content);
   * });
   *
   * // Cleanup when done
   * unsubscribe();
   * ```
   */
  subscribe(channel: string, handler: (event: unknown) => void): () => void;

  /**
   * Check if the transport is connected and ready.
   *
   * For Tauri, this always returns true.
   * For HTTP, this checks WebSocket connection state.
   */
  isConnected(): boolean;

  /**
   * Get the transport type name for debugging.
   */
  readonly type: 'tauri' | 'http';
}

/**
 * Configuration options for the HTTP transport.
 */
export interface HttpTransportConfig {
  /**
   * Base URL for the backend server.
   * @default 'http://localhost:3001'
   */
  baseUrl?: string;

  /**
   * WebSocket reconnection interval in milliseconds.
   * @default 3000
   */
  reconnectIntervalMs?: number;

  /**
   * Maximum number of reconnection attempts.
   * @default 10
   */
  maxReconnectAttempts?: number;
}

/**
 * Event payload for data change events.
 */
export interface DataChangedEvent {
  entity: string;
  action: 'created' | 'updated' | 'deleted';
  id: string;
  data?: unknown;
}

/**
 * Event payload for process output events.
 */
export interface ProcessOutputEvent {
  processId: string;
  outputType: 'stdout' | 'stderr';
  content: string;
  timestamp: string;
}

/**
 * Event payload for process status events.
 */
export interface ProcessStatusEvent {
  processId: string;
  status: 'starting' | 'running' | 'completed' | 'failed' | 'killed';
  exitCode?: number;
}

// =============================================================================
// Context Detection
// =============================================================================

/**
 * Check if running in a Tauri context.
 *
 * Uses `__TAURI_INTERNALS__` which is always present in Tauri 2,
 * regardless of the withGlobalTauri setting.
 *
 * @returns true if running in a Tauri desktop app, false otherwise
 *
 * @example
 * ```ts
 * if (isTauriContext()) {
 *   // Running in desktop app
 *   console.log('Using Tauri IPC');
 * } else {
 *   // Running in browser
 *   console.log('Using HTTP transport');
 * }
 * ```
 */
export function isTauriContext(): boolean {
  const inContext = typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
  return inContext;
}

/**
 * Get the backend URL from environment or default.
 *
 * Checks for VITE_BACKEND_URL environment variable first,
 * then falls back to localhost:3001.
 */
export function getBackendUrl(): string {
  // Check for Vite environment variable
  if (typeof import.meta !== 'undefined' && import.meta.env?.VITE_BACKEND_URL) {
    return import.meta.env.VITE_BACKEND_URL;
  }
  // Default to localhost when running alongside Tauri
  return 'http://localhost:3001';
}

/**
 * Convert HTTP URL to WebSocket URL.
 */
export function getWebSocketUrl(httpUrl: string): string {
  return httpUrl.replace(/^http/, 'ws');
}

// =============================================================================
// Transport Factory
// =============================================================================

// Singleton transport instance
let transportInstance: Transport | null = null;
let transportPromise: Promise<Transport> | null = null;

/**
 * Create the appropriate transport based on context.
 *
 * This is the main entry point for getting a transport instance.
 * It detects whether we're in Tauri or browser context and creates
 * the appropriate transport.
 *
 * @param config - Optional configuration for HTTP transport
 * @returns Promise resolving to the transport instance
 *
 * @example
 * ```ts
 * const transport = await createTransport();
 * const projects = await transport.invoke<Project[]>('list_projects');
 * ```
 */
export async function createTransport(config?: HttpTransportConfig): Promise<Transport> {
  if (isTauriContext()) {
    logger.info('Detected Tauri context, using IPC transport');
    const { createTauriTransport } = await import('./tauri.js');
    return createTauriTransport();
  }

  logger.info('Detected browser context, using HTTP/WS transport', {
    backendUrl: getBackendUrl(),
  });
  const { createHttpTransport } = await import('./http.js');
  return createHttpTransport(config);
}

/**
 * Get the singleton transport instance.
 *
 * This ensures only one transport is created and reused across
 * the application. Use this instead of createTransport() for
 * general usage.
 *
 * @param config - Optional configuration (only used on first call)
 * @returns Promise resolving to the transport instance
 *
 * @example
 * ```ts
 * // In a hook or query
 * const transport = await getTransport();
 * const projects = await transport.invoke<Project[]>('list_projects');
 * ```
 */
export async function getTransport(config?: HttpTransportConfig): Promise<Transport> {
  // Return existing instance if available
  if (transportInstance) {
    return transportInstance;
  }

  // Ensure only one transport is created even with concurrent calls
  if (!transportPromise) {
    transportPromise = createTransport(config).then((t) => {
      transportInstance = t;
      logger.info('Transport initialized', { type: t.type });
      return t;
    });
  }

  return transportPromise;
}

/**
 * Reset the transport instance.
 *
 * Useful for testing or when switching between contexts.
 * In production, this should rarely be needed.
 */
export function resetTransport(): void {
  logger.debug('Resetting transport instance');
  transportInstance = null;
  transportPromise = null;
}

// =============================================================================
// Re-exports
// =============================================================================

// Re-export from command map for convenience
export {
  type CommandName,
  type EndpointMapping,
  type HttpMethod,
  COMMAND_MAP,
  buildPath,
  getMapping,
  getRequestBody,
  isKnownCommand,
} from './command-map.generated.js';
