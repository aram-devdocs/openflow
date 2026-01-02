/**
 * Tauri IPC Transport
 *
 * Uses Tauri's native IPC for communication with the Rust backend.
 * This transport is used when running as a desktop app with the
 * backend built into the Tauri application.
 *
 * ## Features
 *
 * - Direct IPC communication (no network overhead)
 * - Full type safety with Rust backend
 * - Native event system for real-time updates
 * - Automatic serialization/deserialization
 *
 * ## Usage
 *
 * This transport is automatically selected when running in Tauri context.
 * You should not need to use it directly - use `getTransport()` instead.
 *
 * ```ts
 * import { getTransport } from '@openflow/queries/transport';
 *
 * const transport = await getTransport();
 * // If in Tauri context, this will be a TauriTransport
 * ```
 *
 * @see index.ts - Transport interface and factory
 * @see CLAUDE.md - Flexible Backend Architecture section
 */

import { createLogger } from '@openflow/utils';
import { invoke as tauriInvoke } from '@tauri-apps/api/core';
import { type UnlistenFn, listen } from '@tauri-apps/api/event';
import type { Transport } from './index.js';

const logger = createLogger('transport:tauri');

/**
 * Create a Tauri IPC transport.
 *
 * This transport wraps Tauri's `invoke` and `listen` APIs to provide
 * the unified Transport interface.
 *
 * @returns Transport instance for Tauri IPC
 *
 * @example
 * ```ts
 * const transport = createTauriTransport();
 * const projects = await transport.invoke<Project[]>('list_projects');
 * ```
 */
export function createTauriTransport(): Transport {
  logger.debug('Creating Tauri IPC transport');

  // Track active event listeners for cleanup
  const activeListeners = new Map<string, Set<UnlistenFn>>();

  return {
    type: 'tauri',

    async invoke<T>(cmd: string, args?: Record<string, unknown>): Promise<T> {
      // Log the command invocation (sanitize args to avoid logging sensitive data)
      const argKeys = args ? Object.keys(args) : [];
      logger.debug('Invoking Tauri command', {
        cmd,
        argKeys,
        argCount: argKeys.length,
      });

      try {
        const result = await tauriInvoke<T>(cmd, args);

        // Log success with result type info (not the actual data for security)
        const resultType =
          result === null ? 'null' : Array.isArray(result) ? 'array' : typeof result;
        const resultInfo: Record<string, unknown> = { cmd, resultType };

        // Add array length if applicable (useful for list queries)
        if (Array.isArray(result)) {
          resultInfo.resultLength = result.length;
        }

        logger.debug('Tauri command completed', resultInfo);

        return result;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        logger.error('Tauri command failed', {
          cmd,
          argKeys,
          error: errorMessage,
        });
        throw error;
      }
    },

    subscribe(channel: string, handler: (event: unknown) => void): () => void {
      logger.debug('Subscribing to Tauri event', { channel });

      // Track the unlisten function so we can clean up
      let unlisten: UnlistenFn | null = null;
      let isUnsubscribed = false;

      // Set up the listener asynchronously
      listen(channel, (event) => {
        if (!isUnsubscribed) {
          logger.debug('Received Tauri event', { channel });
          handler(event.payload);
        }
      })
        .then((fn) => {
          if (isUnsubscribed) {
            // If unsubscribed before listen resolved, clean up immediately
            fn();
          } else {
            unlisten = fn;

            // Track for cleanup
            if (!activeListeners.has(channel)) {
              activeListeners.set(channel, new Set());
            }
            activeListeners.get(channel)?.add(fn);
          }
        })
        .catch((error) => {
          logger.error('Failed to subscribe to Tauri event', {
            channel,
            error: String(error),
          });
        });

      // Return unsubscribe function
      return () => {
        logger.debug('Unsubscribing from Tauri event', { channel });
        isUnsubscribed = true;

        if (unlisten) {
          // Remove from tracking
          const listeners = activeListeners.get(channel);
          if (listeners) {
            listeners.delete(unlisten);
            if (listeners.size === 0) {
              activeListeners.delete(channel);
            }
          }

          // Call the unlisten function
          unlisten();
        }
      };
    },

    isConnected(): boolean {
      // Tauri IPC is always "connected" when we're in Tauri context
      return true;
    },
  };
}
