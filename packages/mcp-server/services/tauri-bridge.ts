/**
 * Tauri Bridge Service
 *
 * Communicates with the tauri-plugin-mcp-gui socket server to enable
 * direct UI automation (screenshots, DOM access, input simulation, JS execution).
 *
 * Protocol: JSON-RPC style over Unix IPC socket (newline-delimited messages)
 * Socket path: /tmp/openflow-mcp.sock
 */

import { EventEmitter } from 'node:events';
import * as net from 'node:net';

/** Default socket path for OpenFlow MCP GUI plugin */
export const DEFAULT_SOCKET_PATH = '/tmp/openflow-mcp.sock';

/** Default command timeout (10 seconds) */
const DEFAULT_COMMAND_TIMEOUT = 10000;

// Reconnect settings reserved for future use
// const RECONNECT_DELAY = 1000;
// const MAX_RECONNECT_ATTEMPTS = 3;

// ============================================================================
// Type Definitions
// ============================================================================

/** Socket request format (sent to Tauri plugin) */
interface SocketRequest {
  command: string;
  payload: Record<string, unknown>;
}

/** Socket response format (received from Tauri plugin) */
interface SocketResponse {
  success: boolean;
  data: unknown | null;
  error: string | null;
}

/** Connection state */
export type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'error';

/** Connection status */
export interface ConnectionStatus {
  state: ConnectionState;
  socketPath: string;
  error: string | null;
  lastConnectedAt: Date | null;
}

// ============================================================================
// Command Payloads
// ============================================================================

/** Screenshot command parameters */
export interface ScreenshotParams {
  quality?: number; // 1-100, default 85
  max_width?: number; // Max width in pixels
  max_size_mb?: number; // Max size in MB, default 2
}

/** Screenshot result */
export interface ScreenshotResult {
  data: string; // Base64-encoded image data
  width?: number;
  height?: number;
}

/** Execute JS command parameters */
export interface ExecuteJsParams {
  code: string; // JavaScript code to execute
  window_label?: string; // Target window, default "main"
  timeout_ms?: number; // Timeout in ms, default 5000
}

/** Execute JS result */
export interface ExecuteJsResult {
  result: unknown;
}

/** Mouse movement command parameters */
export interface MouseParams {
  x: number;
  y: number;
  relative?: boolean; // Relative or absolute coordinates
  click?: boolean; // Click after moving
  button?: 'left' | 'right' | 'middle'; // Button to click
}

/** Mouse movement result */
export interface MouseResult {
  success: boolean;
  duration_ms?: number;
  position?: [number, number];
}

/** Text input command parameters */
export interface TextInputParams {
  text: string;
  delay_ms?: number; // Delay between keystrokes, default 20
  initial_delay_ms?: number;
}

/** Text input result */
export interface TextInputResult {
  chars_typed: number;
  duration_ms: number;
}

/** Get element position parameters */
export interface GetElementPositionParams {
  window_label: string;
  selector_type: string; // e.g., "css", "xpath"
  selector_value: string;
  should_click?: boolean;
  raw_coordinates?: boolean;
}

/** Element position result */
export interface ElementPositionResult {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** Send text to element parameters */
export interface SendTextToElementParams {
  window_label: string;
  selector_type: string;
  selector_value: string;
  text: string;
  delay_ms?: number; // Default 20
}

/** Local storage parameters */
export interface LocalStorageParams {
  action: 'get' | 'set' | 'remove' | 'clear' | 'keys';
  key?: string;
  value?: string;
  window_label?: string;
}

/** Local storage result */
export interface LocalStorageResult {
  value?: string;
  keys?: string[];
}

/** DOM content result */
export interface DomResult {
  html: string;
}

// ============================================================================
// Tauri Bridge Class
// ============================================================================

/**
 * TauriBridge provides communication with the tauri-plugin-mcp-gui socket server.
 *
 * It handles:
 * - IPC socket connection management
 * - Command/response JSON protocol
 * - Automatic reconnection
 * - Timeout handling
 */
export class TauriBridge extends EventEmitter {
  private socket: net.Socket | null = null;
  private socketPath: string;
  private state: ConnectionState = 'disconnected';
  private error: string | null = null;
  private lastConnectedAt: Date | null = null;
  private responseBuffer = '';
  private pendingRequests: Map<
    number,
    {
      resolve: (value: SocketResponse) => void;
      reject: (error: Error) => void;
      timeoutId: ReturnType<typeof setTimeout>;
    }
  > = new Map();
  private requestId = 0;

  constructor(socketPath: string = DEFAULT_SOCKET_PATH) {
    super();
    this.socketPath = socketPath;
  }

  // --------------------------------------------------------------------------
  // Connection Management
  // --------------------------------------------------------------------------

  /**
   * Connect to the Tauri MCP GUI socket server.
   */
  async connect(): Promise<void> {
    if (this.state === 'connected') {
      return;
    }

    if (this.state === 'connecting') {
      // Wait for existing connection attempt
      return new Promise((resolve, reject) => {
        const onConnect = () => {
          this.removeListener('error', onError);
          resolve();
        };
        const onError = (err: Error) => {
          this.removeListener('connected', onConnect);
          reject(err);
        };
        this.once('connected', onConnect);
        this.once('error', onError);
      });
    }

    this.state = 'connecting';
    this.error = null;

    return new Promise((resolve, reject) => {
      this.socket = net.createConnection(this.socketPath);

      this.socket.on('connect', () => {
        this.state = 'connected';
        this.lastConnectedAt = new Date();
        this.emit('connected');
        resolve();
      });

      this.socket.on('data', (data) => {
        this.handleData(data);
      });

      this.socket.on('error', (err) => {
        this.error = err.message;
        if (this.state === 'connecting') {
          this.state = 'error';
          reject(new Error(`Failed to connect to socket: ${err.message}`));
        } else {
          this.handleDisconnect();
        }
        this.emit('error', err);
      });

      this.socket.on('close', () => {
        this.handleDisconnect();
      });

      // Connection timeout
      setTimeout(() => {
        if (this.state === 'connecting') {
          this.socket?.destroy();
          this.state = 'error';
          this.error = 'Connection timeout';
          reject(new Error('Connection timeout'));
        }
      }, 5000);
    });
  }

  /**
   * Disconnect from the socket server.
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.destroy();
      this.socket = null;
    }
    this.state = 'disconnected';

    // Reject all pending requests
    for (const [, pending] of this.pendingRequests) {
      clearTimeout(pending.timeoutId);
      pending.reject(new Error('Disconnected'));
    }
    this.pendingRequests.clear();
    this.emit('disconnected');
  }

  /**
   * Handle unexpected disconnection with optional reconnection.
   */
  private handleDisconnect(): void {
    const wasConnected = this.state === 'connected';
    this.state = 'disconnected';
    this.socket = null;

    // Reject all pending requests
    for (const [, pending] of this.pendingRequests) {
      clearTimeout(pending.timeoutId);
      pending.reject(new Error('Connection lost'));
    }
    this.pendingRequests.clear();

    if (wasConnected) {
      this.emit('disconnected');
    }
  }

  /**
   * Get current connection status.
   */
  getStatus(): ConnectionStatus {
    return {
      state: this.state,
      socketPath: this.socketPath,
      error: this.error,
      lastConnectedAt: this.lastConnectedAt,
    };
  }

  /**
   * Check if connected.
   */
  isConnected(): boolean {
    return this.state === 'connected' && this.socket !== null;
  }

  // --------------------------------------------------------------------------
  // Command Protocol
  // --------------------------------------------------------------------------

  /**
   * Handle incoming data from the socket.
   * Messages are newline-delimited JSON.
   */
  private handleData(data: Buffer): void {
    this.responseBuffer += data.toString();

    // Process complete messages (newline-delimited)
    let newlineIndex = this.responseBuffer.indexOf('\n');
    while (newlineIndex !== -1) {
      const message = this.responseBuffer.slice(0, newlineIndex);
      this.responseBuffer = this.responseBuffer.slice(newlineIndex + 1);

      if (message.trim()) {
        try {
          const response = JSON.parse(message) as SocketResponse;
          this.handleResponse(response);
        } catch {
          // Invalid JSON, ignore
        }
      }

      newlineIndex = this.responseBuffer.indexOf('\n');
    }
  }

  /**
   * Handle a parsed response from the socket.
   * Since the protocol doesn't include request IDs, we process responses in order.
   */
  private handleResponse(response: SocketResponse): void {
    // Get the oldest pending request (FIFO)
    const iterator = this.pendingRequests.entries().next();
    if (!iterator.done) {
      const [id, pending] = iterator.value;
      clearTimeout(pending.timeoutId);
      this.pendingRequests.delete(id);
      pending.resolve(response);
    }
  }

  /**
   * Send a command to the Tauri plugin and wait for response.
   */
  async sendCommand<T = unknown>(
    command: string,
    payload: Record<string, unknown> = {},
    timeout: number = DEFAULT_COMMAND_TIMEOUT
  ): Promise<T> {
    if (!this.isConnected()) {
      // Try to connect first
      await this.connect();
    }

    return new Promise<T>((resolve, reject) => {
      const id = ++this.requestId;

      const timeoutId = setTimeout(() => {
        this.pendingRequests.delete(id);
        reject(new Error(`Command '${command}' timed out after ${timeout}ms`));
      }, timeout);

      this.pendingRequests.set(id, {
        resolve: (response: SocketResponse) => {
          if (response.success) {
            resolve(response.data as T);
          } else {
            reject(new Error(response.error || `Command '${command}' failed`));
          }
        },
        reject,
        timeoutId,
      });

      const request: SocketRequest = { command, payload };
      const message = `${JSON.stringify(request)}\n`;

      this.socket?.write(message, (err) => {
        if (err) {
          clearTimeout(timeoutId);
          this.pendingRequests.delete(id);
          reject(new Error(`Failed to send command: ${err.message}`));
        }
      });
    });
  }

  // --------------------------------------------------------------------------
  // High-Level Commands
  // --------------------------------------------------------------------------

  /**
   * Ping the Tauri plugin to check connectivity.
   */
  async ping(): Promise<string> {
    const result = await this.sendCommand<{ value?: string }>('PING', {});
    return result?.value || 'pong';
  }

  /**
   * Take a screenshot of the application window.
   * Returns base64-encoded image data.
   */
  async screenshot(params: ScreenshotParams = {}): Promise<ScreenshotResult> {
    return this.sendCommand<ScreenshotResult>('TAKE_SCREENSHOT', { ...params });
  }

  /**
   * Get the DOM/HTML content of the webview.
   */
  async getDom(windowLabel = 'main'): Promise<DomResult> {
    return this.sendCommand<DomResult>('GET_DOM', { window_label: windowLabel });
  }

  /**
   * Execute JavaScript code in the webview.
   */
  async executeJs(params: ExecuteJsParams): Promise<ExecuteJsResult> {
    return this.sendCommand<ExecuteJsResult>('EXECUTE_JS', { ...params });
  }

  /**
   * Simulate mouse movement and optionally click.
   */
  async mouseMove(params: MouseParams): Promise<MouseResult> {
    return this.sendCommand<MouseResult>('SIMULATE_MOUSE_MOVEMENT', { ...params });
  }

  /**
   * Simulate text input (keyboard typing).
   */
  async typeText(params: TextInputParams): Promise<TextInputResult> {
    return this.sendCommand<TextInputResult>('SIMULATE_TEXT_INPUT', { ...params });
  }

  /**
   * Get the position of a DOM element.
   */
  async getElementPosition(params: GetElementPositionParams): Promise<ElementPositionResult> {
    return this.sendCommand<ElementPositionResult>('GET_ELEMENT_POSITION', { ...params });
  }

  /**
   * Send text to a specific DOM element.
   */
  async sendTextToElement(params: SendTextToElementParams): Promise<void> {
    await this.sendCommand<void>('SEND_TEXT_TO_ELEMENT', { ...params });
  }

  /**
   * Manage localStorage in the webview.
   */
  async localStorage(params: LocalStorageParams): Promise<LocalStorageResult> {
    return this.sendCommand<LocalStorageResult>('MANAGE_LOCAL_STORAGE', { ...params });
  }

  /**
   * Manage window (focus, minimize, maximize, etc.).
   */
  async manageWindow(
    operation: string,
    params: Record<string, unknown> = {}
  ): Promise<{ success: boolean; message?: string }> {
    return this.sendCommand<{ success: boolean; message?: string }>('MANAGE_WINDOW', {
      operation,
      ...params,
    });
  }

  // --------------------------------------------------------------------------
  // Convenience Methods
  // --------------------------------------------------------------------------

  /**
   * Click at specific coordinates.
   */
  async click(x: number, y: number, button: 'left' | 'right' | 'middle' = 'left'): Promise<void> {
    await this.mouseMove({ x, y, click: true, button });
  }

  /**
   * Click on an element by CSS selector.
   */
  async clickElement(selector: string, windowLabel = 'main'): Promise<void> {
    const position = await this.getElementPosition({
      window_label: windowLabel,
      selector_type: 'css',
      selector_value: selector,
      should_click: true,
    });

    // Click in the center of the element
    await this.click(position.x + position.width / 2, position.y + position.height / 2);
  }

  /**
   * Type text into an element by CSS selector.
   */
  async typeIntoElement(selector: string, text: string, windowLabel = 'main'): Promise<void> {
    await this.sendTextToElement({
      window_label: windowLabel,
      selector_type: 'css',
      selector_value: selector,
      text,
    });
  }

  /**
   * Execute JavaScript and return the result.
   */
  async evaluate<T = unknown>(code: string, windowLabel = 'main', timeout = 5000): Promise<T> {
    const result = await this.executeJs({
      code,
      window_label: windowLabel,
      timeout_ms: timeout,
    });
    return result.result as T;
  }

  /**
   * Get the current page URL from the webview.
   */
  async getUrl(windowLabel = 'main'): Promise<string> {
    const result = await this.evaluate<string>('window.location.href', windowLabel);
    return result;
  }

  /**
   * Get the page title from the webview.
   */
  async getTitle(windowLabel = 'main'): Promise<string> {
    const result = await this.evaluate<string>('document.title', windowLabel);
    return result;
  }

  /**
   * Get browser console logs (if available).
   * This requires the webview to have been instrumented to capture logs.
   */
  async getConsoleMessages(): Promise<string[]> {
    try {
      // Try to get any stored console messages
      const result = await this.evaluate<string[]>(
        `
        (function() {
          return window.__mcpConsoleLogs || [];
        })()
      `
      );
      return result || [];
    } catch {
      return [];
    }
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

let instance: TauriBridge | null = null;

/**
 * Get the TauriBridge singleton instance.
 */
export function getTauriBridge(): TauriBridge {
  if (!instance) {
    instance = new TauriBridge();
  }
  return instance;
}

/**
 * Reset the TauriBridge singleton (useful for testing).
 */
export function resetTauriBridge(): void {
  if (instance) {
    instance.disconnect();
  }
  instance = null;
}
