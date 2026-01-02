/**
 * HTTP/WebSocket Transport
 *
 * Uses HTTP REST API and WebSocket for browser-based clients.
 * This transport is used when running in a browser without Tauri,
 * connecting to a standalone openflow-server instance.
 *
 * ## Features
 *
 * - HTTP REST API for commands (invoke)
 * - WebSocket for real-time events (subscribe)
 * - Automatic reconnection with exponential backoff
 * - Re-subscription on reconnect
 * - Full command-to-endpoint mapping
 *
 * ## Usage
 *
 * This transport is automatically selected when NOT in Tauri context.
 * You should not need to use it directly - use `getTransport()` instead.
 *
 * ```ts
 * import { getTransport } from '@openflow/queries/transport';
 *
 * const transport = await getTransport();
 * // If NOT in Tauri context, this will be an HttpTransport
 * ```
 *
 * ## Configuration
 *
 * Set the backend URL via environment variable:
 * ```
 * VITE_BACKEND_URL=http://localhost:3001
 * ```
 *
 * @see index.ts - Transport interface and factory
 * @see command-map.generated.ts - Command to endpoint mapping
 * @see CLAUDE.md - Flexible Backend Architecture section
 */

import { createLogger } from '@openflow/utils';
import { buildPath, getMapping, getRequestBody, isKnownCommand } from './command-map.generated.js';
import type { HttpTransportConfig, Transport } from './index.js';
import { getBackendUrl, getWebSocketUrl } from './index.js';

const logger = createLogger('transport:http');

// =============================================================================
// WebSocket Message Types
// =============================================================================

/**
 * Message sent from client to server over WebSocket.
 */
interface WsClientMessage {
  type: 'subscribe' | 'unsubscribe' | 'ping';
  content?: {
    channel?: string;
  };
}

/**
 * Message received from server over WebSocket.
 */
interface WsServerMessage {
  type: 'connected' | 'subscribed' | 'unsubscribed' | 'pong' | 'event' | 'error';
  content?: {
    clientId?: string;
    channel?: string;
    payload?: unknown;
    message?: string;
  };
}

// =============================================================================
// HTTP Transport Implementation
// =============================================================================

/**
 * Create an HTTP/WebSocket transport.
 *
 * This transport maps Tauri commands to HTTP endpoints and uses
 * WebSocket for real-time event subscriptions.
 *
 * @param config - Optional configuration
 * @returns Transport instance for HTTP/WebSocket
 *
 * @example
 * ```ts
 * const transport = createHttpTransport({
 *   baseUrl: 'http://api.example.com',
 *   reconnectIntervalMs: 5000,
 * });
 * ```
 */
export function createHttpTransport(config?: HttpTransportConfig): Transport {
  const baseUrl = config?.baseUrl ?? getBackendUrl();
  const wsUrl = getWebSocketUrl(baseUrl);
  const reconnectIntervalMs = config?.reconnectIntervalMs ?? 3000;
  const maxReconnectAttempts = config?.maxReconnectAttempts ?? 10;

  logger.debug('Creating HTTP transport', { baseUrl, wsUrl });

  // WebSocket state
  let ws: WebSocket | null = null;
  let wsConnected = false;
  let wsReconnectTimer: ReturnType<typeof setTimeout> | null = null;
  let wsReconnectAttempts = 0;
  let clientId: string | null = null;

  // Subscription tracking
  const subscriptions = new Map<string, Set<(event: unknown) => void>>();
  const pendingSubscriptions = new Set<string>();

  // ==========================================================================
  // WebSocket Management
  // ==========================================================================

  /**
   * Ensure WebSocket is connected.
   * Creates a new connection if needed.
   */
  function ensureWebSocket(): WebSocket {
    if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) {
      return ws;
    }

    logger.info('Connecting to WebSocket', { url: `${wsUrl}/ws` });

    ws = new WebSocket(`${wsUrl}/ws`);

    ws.onopen = () => {
      logger.info('WebSocket connected');
      wsConnected = true;
      wsReconnectAttempts = 0;

      // Re-subscribe to all channels
      for (const channel of subscriptions.keys()) {
        sendSubscribe(channel);
      }

      // Subscribe to any pending subscriptions
      for (const channel of pendingSubscriptions) {
        sendSubscribe(channel);
        pendingSubscriptions.delete(channel);
      }
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data) as WsServerMessage;
        handleWsMessage(msg);
      } catch (error) {
        logger.error('Failed to parse WebSocket message', {
          error: String(error),
          data: event.data,
        });
      }
    };

    ws.onclose = (event) => {
      logger.warn('WebSocket disconnected', {
        code: event.code,
        reason: event.reason,
        wasClean: event.wasClean,
      });
      wsConnected = false;
      ws = null;
      clientId = null;

      // Attempt reconnection if we have active subscriptions
      if (subscriptions.size > 0 && wsReconnectAttempts < maxReconnectAttempts) {
        scheduleReconnect();
      }
    };

    ws.onerror = (error) => {
      logger.error('WebSocket error', { error: String(error) });
    };

    return ws;
  }

  /**
   * Schedule a WebSocket reconnection attempt.
   */
  function scheduleReconnect(): void {
    if (wsReconnectTimer) {
      return; // Already scheduled
    }

    wsReconnectAttempts++;
    const delay = Math.min(reconnectIntervalMs * 2 ** (wsReconnectAttempts - 1), 30000);

    logger.info('Scheduling WebSocket reconnection', {
      attempt: wsReconnectAttempts,
      maxAttempts: maxReconnectAttempts,
      delayMs: delay,
    });

    wsReconnectTimer = setTimeout(() => {
      wsReconnectTimer = null;
      if (subscriptions.size > 0) {
        ensureWebSocket();
      }
    }, delay);
  }

  /**
   * Handle incoming WebSocket message.
   */
  function handleWsMessage(msg: WsServerMessage): void {
    switch (msg.type) {
      case 'connected':
        clientId = msg.content?.clientId ?? null;
        logger.info('WebSocket client ID assigned', { clientId });
        break;

      case 'subscribed':
        logger.debug('Subscribed to channel', { channel: msg.content?.channel });
        break;

      case 'unsubscribed':
        logger.debug('Unsubscribed from channel', { channel: msg.content?.channel });
        break;

      case 'pong':
        logger.debug('Received pong');
        break;

      case 'event': {
        const channel = msg.content?.channel;
        const payload = msg.content?.payload;

        if (!channel) {
          logger.warn('Received event without channel');
          return;
        }

        logger.debug('Received event', { channel });

        // Notify channel subscribers
        const handlers = subscriptions.get(channel);
        if (handlers) {
          for (const h of handlers) {
            try {
              h(payload);
            } catch (error) {
              logger.error('Event handler error', {
                channel,
                error: String(error),
              });
            }
          }
        }

        // Also notify wildcard subscribers
        const wildcardHandlers = subscriptions.get('*');
        if (wildcardHandlers) {
          for (const h of wildcardHandlers) {
            try {
              h({ channel, payload });
            } catch (error) {
              logger.error('Wildcard handler error', {
                channel,
                error: String(error),
              });
            }
          }
        }
        break;
      }

      case 'error':
        logger.error('WebSocket server error', { message: msg.content?.message });
        break;

      default:
        logger.warn('Unknown WebSocket message type', { type: msg.type });
    }
  }

  /**
   * Send a subscribe message over WebSocket.
   */
  function sendSubscribe(channel: string): void {
    if (ws?.readyState === WebSocket.OPEN) {
      const msg: WsClientMessage = {
        type: 'subscribe',
        content: { channel },
      };
      ws.send(JSON.stringify(msg));
      logger.debug('Sent subscribe message', { channel });
    } else {
      // Queue for when connection is established
      pendingSubscriptions.add(channel);
    }
  }

  /**
   * Send an unsubscribe message over WebSocket.
   */
  function sendUnsubscribe(channel: string): void {
    if (ws?.readyState === WebSocket.OPEN) {
      const msg: WsClientMessage = {
        type: 'unsubscribe',
        content: { channel },
      };
      ws.send(JSON.stringify(msg));
      logger.debug('Sent unsubscribe message', { channel });
    }
    pendingSubscriptions.delete(channel);
  }

  // ==========================================================================
  // Transport Interface Implementation
  // ==========================================================================

  return {
    type: 'http',

    async invoke<T>(cmd: string, args?: Record<string, unknown>): Promise<T> {
      // Check if command is known
      if (!isKnownCommand(cmd)) {
        const error = `Unknown command: ${cmd}. Ensure it's defined in openflow-contracts.`;
        logger.error(error);
        throw new Error(error);
      }

      // Get endpoint mapping (already validated by isKnownCommand above)
      const mapping = getMapping(cmd);
      if (!mapping) {
        // This should never happen since isKnownCommand already validated
        throw new Error(`No mapping found for command: ${cmd}`);
      }
      const url = `${baseUrl}${buildPath(cmd, args)}`;

      logger.debug('HTTP request', {
        method: mapping.method,
        url,
        cmd,
        hasBody: mapping.hasRequestBody,
      });

      // Build request options
      const options: RequestInit = {
        method: mapping.method,
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
      };

      // Add request body for mutations
      if (mapping.hasRequestBody && args) {
        const body = getRequestBody(cmd, args);
        if (body !== undefined) {
          options.body = JSON.stringify(body);
        }
      }

      try {
        const response = await fetch(url, options);

        // Handle error responses
        if (!response.ok) {
          const errorText = await response.text();
          let errorMessage: string;

          try {
            const errorJson = JSON.parse(errorText);
            errorMessage = errorJson.message || errorJson.error || errorText;
          } catch {
            errorMessage = errorText || `HTTP ${response.status} ${response.statusText}`;
          }

          logger.error('HTTP request failed', {
            cmd,
            status: response.status,
            error: errorMessage,
          });

          throw new Error(errorMessage);
        }

        // Handle empty responses (for void returns)
        const text = await response.text();
        if (!text || text.trim() === '') {
          logger.debug('HTTP request completed (void)', { cmd });
          return undefined as T;
        }

        // Parse JSON response
        const result = JSON.parse(text) as T;

        // Log success info
        const resultType =
          result === null ? 'null' : Array.isArray(result) ? 'array' : typeof result;
        const resultInfo: Record<string, unknown> = { cmd, resultType };

        if (Array.isArray(result)) {
          resultInfo.resultLength = result.length;
        }

        logger.debug('HTTP request completed', resultInfo);

        return result;
      } catch (error) {
        // Re-throw with additional context if it's a network error
        if (error instanceof TypeError && error.message.includes('fetch')) {
          const networkError = new Error(
            `Network error: Unable to connect to ${baseUrl}. Is the server running?`
          );
          logger.error('Network error', {
            cmd,
            baseUrl,
            originalError: error.message,
          });
          throw networkError;
        }

        throw error;
      }
    },

    subscribe(channel: string, handler: (event: unknown) => void): () => void {
      logger.debug('Subscribing to channel', { channel });

      // Add handler to subscriptions
      if (!subscriptions.has(channel)) {
        subscriptions.set(channel, new Set());
      }
      subscriptions.get(channel)?.add(handler);

      // Ensure WebSocket connection and send subscribe
      ensureWebSocket();
      sendSubscribe(channel);

      // Return unsubscribe function
      return () => {
        logger.debug('Unsubscribing from channel', { channel });

        const handlers = subscriptions.get(channel);
        handlers?.delete(handler);

        // If no more handlers for this channel, unsubscribe
        if (handlers?.size === 0) {
          subscriptions.delete(channel);
          sendUnsubscribe(channel);
        }

        // If no more subscriptions, let WebSocket close naturally
        // (we'll reconnect when new subscriptions are added)
      };
    },

    isConnected(): boolean {
      return wsConnected;
    },
  };
}
