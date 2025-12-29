/**
 * MCP Server Type Definitions
 *
 * Shared types for the OpenFlow MCP server implementation.
 */

/** MCP tool definition interface */
export interface ToolDefinition {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, unknown>;
    required?: string[];
  };
}

/** MCP tool response format */
export interface ToolResponse {
  content: Array<{ type: 'text'; text: string }>;
  isError?: boolean;
}

/** Possible states of the application */
export type AppState = 'stopped' | 'starting' | 'running' | 'stopping' | 'error';

/** Status information for the running application */
export interface AppStatus {
  state: AppState;
  pid: number | null;
  startTime: Date | null;
  uptime: number | null;
  devServerUrl: string | null;
  error: string | null;
}

/** Result from starting the application */
export interface StartResult {
  success: boolean;
  pid: number | null;
  devServerUrl: string | null;
  error: string | null;
}

/** Result from stopping the application */
export interface StopResult {
  success: boolean;
  error: string | null;
}

/** Options for starting the application */
export interface StartOptions {
  /** Wait for dev server to be ready before returning */
  waitForReady?: boolean;
  /** Timeout in milliseconds for waiting */
  timeout?: number;
  /** Enable MCP GUI plugin for UI automation (default: true when run from MCP server) */
  enableMcpGui?: boolean;
}

/** Options for running commands */
export interface CommandOptions {
  /** Working directory for the command */
  cwd?: string;
  /** Timeout in milliseconds */
  timeout?: number;
  /** Environment variables */
  env?: Record<string, string>;
}

/** Result from running a command */
export interface CommandResult {
  success: boolean;
  exitCode: number;
  stdout: string;
  stderr: string;
  error: string | null;
}

/** Generic MCP tool result */
export interface ToolResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

/** Log entry from the application */
export interface LogEntry {
  timestamp: Date;
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
}

/** Options for retrieving logs */
export interface LogOptions {
  /** Filter by log level (includes all levels at or above this severity) */
  level?: 'debug' | 'info' | 'warn' | 'error';
  /** Maximum number of entries to return */
  limit?: number;
}
