/**
 * Agent Bridge Types
 *
 * Types for the OpenFlow Agent Bridge server that proxies
 * requests to the Claude Agent SDK.
 */

/**
 * Request payload for executing an agent query.
 */
export interface ExecuteRequest {
  /** The prompt to send to the agent */
  prompt: string;
  /** Optional session ID for resuming a conversation */
  sessionId?: string;
  /** Working directory for file operations */
  workingDir: string;
  /** List of allowed tools (defaults to all) */
  allowedTools?: string[];
  /** Permission mode: 'acceptEdits' auto-approves, 'default' prompts */
  permissionMode?: 'default' | 'acceptEdits';
  /** Maximum thinking tokens */
  maxThinkingTokens?: number;
}

/**
 * SSE event types that can be streamed back to clients.
 */
export type AgentEventType =
  | 'init'
  | 'message'
  | 'tool_use'
  | 'tool_result'
  | 'complete'
  | 'error'
  | 'session';

/**
 * Base event structure for all agent events.
 */
export interface BaseAgentEvent {
  type: AgentEventType;
  timestamp: string;
}

/**
 * Session initialization event.
 */
export interface InitEvent extends BaseAgentEvent {
  type: 'init';
  sessionId: string;
}

/**
 * Message event (assistant or user).
 */
export interface MessageEvent extends BaseAgentEvent {
  type: 'message';
  role: 'assistant' | 'user';
  content: string;
}

/**
 * Tool usage event.
 */
export interface ToolUseEvent extends BaseAgentEvent {
  type: 'tool_use';
  toolId: string;
  toolName: string;
  input: Record<string, unknown>;
}

/**
 * Tool result event.
 */
export interface ToolResultEvent extends BaseAgentEvent {
  type: 'tool_result';
  toolId: string;
  output: string;
  isError: boolean;
}

/**
 * Completion event.
 */
export interface CompleteEvent extends BaseAgentEvent {
  type: 'complete';
  status: 'success' | 'error';
  exitCode?: number;
}

/**
 * Error event.
 */
export interface ErrorEvent extends BaseAgentEvent {
  type: 'error';
  message: string;
  code?: string;
}

/**
 * Session event (emitted when session ID is captured).
 */
export interface SessionEvent extends BaseAgentEvent {
  type: 'session';
  sessionId: string;
}

/**
 * Union type of all agent events.
 */
export type AgentEvent =
  | InitEvent
  | MessageEvent
  | ToolUseEvent
  | ToolResultEvent
  | CompleteEvent
  | ErrorEvent
  | SessionEvent;

/**
 * Health check response.
 */
export interface HealthResponse {
  status: 'ok' | 'error';
  version: string;
  uptime: number;
}
