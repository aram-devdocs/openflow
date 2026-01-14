/**
 * Type definitions for the Agent Service.
 * These types align with the Rust backend contracts.
 */

// Configuration for agent sessions
export interface AgentConfig {
  /** Working directory for the agent */
  workingDirectory?: string;
  /** List of tools the agent is allowed to use */
  allowedTools?: string[];
  /** Maximum tokens for the response */
  maxTokens?: number;
  /** Custom system prompt */
  systemPrompt?: string;
  /** Permission mode: 'default' requires canUseTool, 'acceptEdits' auto-approves file ops */
  permissionMode?: 'default' | 'acceptEdits' | 'bypassPermissions';
}

// Permission request sent to Rust backend when agent needs approval
export interface PermissionRequest {
  /** Unique ID for this permission request */
  id: string;
  /** Session ID this permission belongs to */
  sessionId: string;
  /** Name of the tool requesting permission (e.g., "Write", "Bash", "Edit") */
  toolName: string;
  /** Structured tool input from the SDK */
  toolInput: Record<string, unknown>;
  /** File path if applicable (extracted from tool input) */
  filePath?: string;
  /** Command if applicable (extracted from Bash tool input) */
  command?: string;
  /** Human-readable description of the action */
  description: string;
  /** Timestamp of the request */
  timestamp: string;
}

// Permission response from frontend via Rust backend
export interface PermissionResponse {
  /** Whether the permission was approved */
  approved: boolean;
  /** Reason for denial (if applicable) */
  reason?: string;
  /** Modified input if user made changes (optional) */
  modifiedInput?: Record<string, unknown>;
}

// Agent events sent to Rust backend via WebSocket
export type AgentEvent =
  | SessionStartEvent
  | SessionCompleteEvent
  | SessionErrorEvent
  | MessageEvent
  | ToolUseEvent
  | ToolResultEvent
  | SystemEvent;

export interface SessionStartEvent {
  type: 'session_start';
  sessionId: string;
  timestamp: string;
}

export interface SessionCompleteEvent {
  type: 'session_complete';
  sessionId: string;
  timestamp: string;
}

export interface SessionErrorEvent {
  type: 'session_error';
  sessionId: string;
  error: string;
  timestamp: string;
}

export interface MessageEvent {
  type: 'message';
  sessionId: string;
  /** Text content from the assistant */
  content: string;
  timestamp: string;
}

export interface ToolUseEvent {
  type: 'tool_use';
  sessionId: string;
  /** Name of the tool being used */
  toolName: string;
  /** Input parameters for the tool */
  toolInput: Record<string, unknown>;
  /** Unique ID for this tool use */
  toolId: string;
  timestamp: string;
}

export interface ToolResultEvent {
  type: 'tool_result';
  sessionId: string;
  /** ID of the tool use this result corresponds to */
  toolId: string;
  /** Output from the tool */
  output: string;
  /** Whether the tool execution resulted in an error */
  isError: boolean;
  timestamp: string;
}

export interface SystemEvent {
  type: 'system';
  sessionId: string;
  /** System message content */
  content: string;
  timestamp: string;
}

// WebSocket message types for communication with Rust backend
export interface WebSocketPermissionRequest {
  type: 'permission_request';
  id: string;
  sessionId: string;
  toolName: string;
  toolInput: Record<string, unknown>;
  filePath?: string;
  command?: string;
  description: string;
  timestamp: string;
}

export interface WebSocketPermissionResponse {
  type: 'permission_response';
  permissionId: string;
  approved: boolean;
  reason?: string;
  modifiedInput?: Record<string, unknown>;
}

export type WebSocketMessage =
  | WebSocketPermissionRequest
  | WebSocketPermissionResponse
  | AgentEvent;

// HTTP request/response types
export interface StartSessionRequest {
  sessionId: string;
  prompt: string;
  config?: AgentConfig;
}

export interface StartSessionResponse {
  started: boolean;
  sessionId: string;
}

export interface PermissionResponseBody {
  approved: boolean;
  reason?: string;
  modifiedInput?: Record<string, unknown>;
}

export interface HealthResponse {
  status: 'ok';
  activeSessions: number;
}

export interface ErrorResponse {
  error: string;
}
