/**
 * Query Utilities
 *
 * Provides unified invoke and subscribe functions that work in both
 * Tauri (desktop) and browser contexts.
 *
 * ## Architecture
 *
 * These utilities use the transport abstraction layer to automatically
 * select the appropriate backend communication method:
 *
 * - **Tauri Context**: Uses direct IPC via `@tauri-apps/api/core`
 * - **Browser Context**: Uses HTTP REST API + WebSocket
 *
 * ## Usage
 *
 * ```ts
 * import { invoke, subscribe, isTauriContext } from '@openflow/queries';
 *
 * // Invoke works in both contexts
 * const projects = await invoke<Project[]>('list_projects');
 *
 * // Subscribe works in both contexts
 * const unsubscribe = subscribe('data-changed', (event) => {
 *   console.log('Data changed:', event);
 * });
 * ```
 *
 * @see transport/index.ts - Transport abstraction layer
 * @see CLAUDE.md - Flexible Backend Architecture section
 */

import { createLogger } from '@openflow/utils';
import {
  getTransport,
  isTauriContext as checkTauriContext,
  type Transport,
  type DataChangedEvent,
  type ProcessOutputEvent,
  type ProcessStatusEvent,
} from './transport/index.js';

// Re-export event types for convenience
export type { DataChangedEvent, ProcessOutputEvent, ProcessStatusEvent };

/**
 * Logger for query utility operations.
 * Logs at DEBUG level for invoke calls, INFO for successes, ERROR for failures.
 */
const logger = createLogger('queries:utils');

// =============================================================================
// Transport Management
// =============================================================================

// Cached transport instance for synchronous access after initialization
let cachedTransport: Transport | null = null;

/**
 * Ensure transport is initialized and cached.
 * This is called automatically by invoke/subscribe.
 */
async function ensureTransport(): Promise<Transport> {
  if (!cachedTransport) {
    cachedTransport = await getTransport();
  }
  return cachedTransport;
}

// =============================================================================
// Context Detection
// =============================================================================

/**
 * Check if we're running in a Tauri context.
 *
 * Uses `__TAURI_INTERNALS__` which is always present in Tauri 2,
 * regardless of the withGlobalTauri setting.
 *
 * @returns true if running in a Tauri desktop app, false otherwise
 *
 * @example
 * ```ts
 * if (isTauriContext()) {
 *   // Safe to use Tauri-specific features
 *   console.log('Running as desktop app');
 * } else {
 *   // Running in browser - some features may be limited
 *   console.log('Running in browser mode');
 * }
 * ```
 */
export function isTauriContext(): boolean {
  const inContext = checkTauriContext();
  logger.debug('Checking Tauri context', { inContext });
  return inContext;
}

// =============================================================================
// Invoke Function
// =============================================================================

/**
 * Invoke a backend command.
 *
 * This function works in both Tauri and browser contexts:
 * - **Tauri**: Calls `@tauri-apps/api/core` invoke directly
 * - **Browser**: Makes HTTP request to the REST API
 *
 * Features:
 * - Automatic transport selection based on context
 * - Consistent error handling across transports
 * - Structured logging for debugging
 * - Type-safe with generics
 *
 * @param cmd - The command to invoke (Tauri command name)
 * @param args - Optional arguments for the command
 * @returns Promise resolving to the command result
 * @throws Error if the command fails
 *
 * @example
 * ```ts
 * // Simple query
 * const projects = await invoke<Project[]>('list_projects');
 *
 * // Query with arguments
 * const project = await invoke<Project>('get_project', { id: 'abc123' });
 *
 * // Mutation with request body
 * const newProject = await invoke<Project>('create_project', {
 *   request: { name: 'My Project', gitRepoPath: '/path/to/repo' }
 * });
 *
 * // Error handling
 * try {
 *   const data = await invoke<Data>('fetch_data', { query: 'test' });
 * } catch (error) {
 *   console.error('Command failed:', error.message);
 * }
 * ```
 */
export async function invoke<T>(cmd: string, args?: Record<string, unknown>): Promise<T> {
  const argKeys = args ? Object.keys(args) : [];
  logger.debug('Invoking command', { cmd, argKeys, argCount: argKeys.length });

  try {
    const transport = await ensureTransport();
    const result = await transport.invoke<T>(cmd, args);

    // Log success with result type info
    const resultType = result === null ? 'null' : Array.isArray(result) ? 'array' : typeof result;
    const resultInfo: Record<string, unknown> = { cmd, resultType };

    if (Array.isArray(result)) {
      resultInfo.resultLength = result.length;
    }

    logger.info('Command completed successfully', resultInfo);

    return result;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error('Command failed', { cmd, argKeys, error: errorMessage });
    throw error;
  }
}

// =============================================================================
// Subscribe Function
// =============================================================================

/**
 * Subscribe to an event channel.
 *
 * This function works in both Tauri and browser contexts:
 * - **Tauri**: Uses `@tauri-apps/api/event` listen
 * - **Browser**: Subscribes via WebSocket
 *
 * Features:
 * - Automatic transport selection based on context
 * - Consistent event format across transports
 * - Returns unsubscribe function for cleanup
 * - Supports wildcard subscriptions with '*'
 *
 * @param channel - Event channel to subscribe to
 * @param handler - Callback function for events
 * @returns Unsubscribe function
 *
 * @example
 * ```ts
 * // Subscribe to data changes for cache invalidation
 * const unsubscribe = subscribe('data-changed', (event) => {
 *   const { entity, action, id } = event as DataChangedEvent;
 *   queryClient.invalidateQueries({ queryKey: [entity] });
 * });
 *
 * // Subscribe to process output
 * const unsubscribe = subscribe(`process-output-${processId}`, (event) => {
 *   const { content, outputType } = event as ProcessOutputEvent;
 *   console.log(`[${outputType}] ${content}`);
 * });
 *
 * // Subscribe to all events (for debugging)
 * const unsubscribe = subscribe('*', (event) => {
 *   console.log('Event:', event);
 * });
 *
 * // Cleanup in useEffect
 * useEffect(() => {
 *   const unsubscribe = subscribe('data-changed', handler);
 *   return () => unsubscribe();
 * }, []);
 * ```
 */
export function subscribe(channel: string, handler: (event: unknown) => void): () => void {
  logger.debug('Setting up subscription', { channel });

  // Track the unsubscribe function
  let unsubscribe: (() => void) | null = null;
  let isUnsubscribed = false;

  // Initialize transport and subscribe asynchronously
  ensureTransport()
    .then((transport) => {
      if (isUnsubscribed) {
        // Already unsubscribed before transport was ready
        return;
      }

      unsubscribe = transport.subscribe(channel, handler);
      logger.debug('Subscription established', { channel });
    })
    .catch((error) => {
      logger.error('Failed to establish subscription', {
        channel,
        error: String(error),
      });
    });

  // Return synchronous unsubscribe function
  return () => {
    logger.debug('Unsubscribing', { channel });
    isUnsubscribed = true;

    if (unsubscribe) {
      unsubscribe();
    }
  };
}

// =============================================================================
// Connection State
// =============================================================================

/**
 * Check if the transport is connected.
 *
 * - **Tauri**: Always returns true
 * - **Browser**: Returns WebSocket connection state
 *
 * @returns true if connected to the backend
 *
 * @example
 * ```ts
 * if (!isConnected()) {
 *   console.log('Waiting for connection...');
 * }
 * ```
 */
export function isConnected(): boolean {
  if (!cachedTransport) {
    return false;
  }
  return cachedTransport.isConnected();
}

/**
 * Get the current transport type.
 *
 * @returns 'tauri' | 'http' | null (if not initialized)
 *
 * @example
 * ```ts
 * const type = getTransportType();
 * console.log(`Using ${type} transport`);
 * ```
 */
export function getTransportType(): 'tauri' | 'http' | null {
  if (!cachedTransport) {
    return null;
  }
  return cachedTransport.type;
}

// =============================================================================
// Legacy Compatibility
// =============================================================================

/**
 * Error thrown when Tauri context is not available.
 *
 * @deprecated With the transport abstraction, this error is no longer thrown.
 * The transport layer automatically handles browser context with HTTP.
 * Kept for backwards compatibility.
 */
export class TauriContextError extends Error {
  constructor() {
    super(
      'Tauri context is not available. The application will use HTTP transport instead. ' +
        'For desktop features, please run with `pnpm dev` or `pnpm dev:mcp`.'
    );
    this.name = 'TauriContextError';
  }
}
