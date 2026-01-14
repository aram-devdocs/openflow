/**
 * Core agent integration with the Claude Agent SDK.
 *
 * This module wraps the SDK's query function and provides:
 * - Structured permission handling via canUseTool callback
 * - Event transformation to OpenFlow's normalized format
 * - Session lifecycle management
 */

import { query } from '@anthropic-ai/claude-agent-sdk';
import { v4 as uuidv4 } from 'uuid';
import type { AgentConfig, AgentEvent, PermissionRequest, PermissionResponse } from './types.js';

/**
 * Represents an active agent session.
 */
export interface AgentSession {
  id: string;
  config: AgentConfig;
  abort: AbortController;
  /** Map of permission ID to resolver function */
  permissionResolver: Map<string, (response: PermissionResponse) => void>;
}

/** Map of active sessions by session ID */
const activeSessions = new Map<string, AgentSession>();

/**
 * Get an active session by ID.
 */
export function getSession(sessionId: string): AgentSession | undefined {
  return activeSessions.get(sessionId);
}

/**
 * Get all active session IDs.
 */
export function getActiveSessionIds(): string[] {
  return Array.from(activeSessions.keys());
}

/**
 * Run an agent session with the Claude Agent SDK.
 *
 * @param sessionId - Unique identifier for this session
 * @param prompt - The prompt to send to Claude
 * @param config - Agent configuration options
 * @param onPermissionRequest - Callback when agent needs permission
 * @yields AgentEvent objects as the agent processes
 */
export async function* runAgent(
  sessionId: string,
  prompt: string,
  config: AgentConfig,
  onPermissionRequest: (request: PermissionRequest) => void
): AsyncGenerator<AgentEvent> {
  const abort = new AbortController();
  const permissionResolver = new Map<string, (response: PermissionResponse) => void>();

  const session: AgentSession = {
    id: sessionId,
    config,
    abort,
    permissionResolver,
  };

  activeSessions.set(sessionId, session);

  try {
    yield {
      type: 'session_start',
      sessionId,
      timestamp: new Date().toISOString(),
    };

    // Build SDK options from our config
    const sdkOptions: Record<string, unknown> = {};

    if (config.workingDirectory) {
      sdkOptions.cwd = config.workingDirectory;
    }

    if (config.allowedTools) {
      sdkOptions.allowedTools = config.allowedTools;
    }

    if (config.systemPrompt) {
      sdkOptions.systemPrompt = config.systemPrompt;
    }

    if (config.maxTokens) {
      sdkOptions.maxTokens = config.maxTokens;
    }

    // Always use default permission mode to get canUseTool callbacks
    // This is the key to type-safe permission handling!
    sdkOptions.canUseTool = async (
      toolName: string,
      input: Record<string, unknown>
    ): Promise<{
      behavior: 'allow' | 'deny';
      updatedInput?: Record<string, unknown>;
      message?: string;
    }> => {
      const permissionId = uuidv4();

      // Create structured permission request with typed tool input
      const request: PermissionRequest = {
        id: permissionId,
        sessionId,
        toolName,
        toolInput: input,
        filePath: extractFilePath(toolName, input),
        command: extractCommand(toolName, input),
        description: generateDescription(toolName, input),
        timestamp: new Date().toISOString(),
      };

      // Notify backend (which forwards to frontend)
      onPermissionRequest(request);

      // Wait for response from frontend via backend
      // This promise resolves when resolvePermission is called
      return new Promise((resolve) => {
        permissionResolver.set(permissionId, (response: PermissionResponse) => {
          if (response.approved) {
            resolve({
              behavior: 'allow',
              updatedInput: response.modifiedInput || input,
            });
          } else {
            resolve({
              behavior: 'deny',
              message: response.reason || 'User denied permission',
            });
          }
        });

        // Set a 60-second timeout (SDK's timeout is 60s)
        setTimeout(() => {
          if (permissionResolver.has(permissionId)) {
            permissionResolver.delete(permissionId);
            resolve({
              behavior: 'deny',
              message: 'Permission request timed out',
            });
          }
        }, 55000); // Slightly under 60s to beat SDK timeout
      });
    };

    // Add abort controller to options
    sdkOptions.abortController = abort;

    // Run the agent query loop
    for await (const message of query({
      prompt,
      options: sdkOptions,
    })) {
      // Transform SDK message to our event format
      const event = transformMessage(sessionId, message);
      if (event) {
        yield event;
      }
    }

    yield {
      type: 'session_complete',
      sessionId,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    // Check if it's an abort error (user killed session)
    if (abort.signal.aborted) {
      yield {
        type: 'system',
        sessionId,
        content: 'Session cancelled by user',
        timestamp: new Date().toISOString(),
      };
    } else {
      yield {
        type: 'session_error',
        sessionId,
        error: errorMessage,
        timestamp: new Date().toISOString(),
      };
    }
  } finally {
    activeSessions.delete(sessionId);
  }
}

/**
 * Resolve a pending permission request.
 *
 * @param sessionId - The session ID
 * @param permissionId - The permission request ID
 * @param response - The user's response
 * @returns true if the permission was found and resolved
 */
export function resolvePermission(
  sessionId: string,
  permissionId: string,
  response: PermissionResponse
): boolean {
  const session = activeSessions.get(sessionId);
  if (!session) return false;

  const resolver = session.permissionResolver.get(permissionId);
  if (!resolver) return false;

  resolver(response);
  session.permissionResolver.delete(permissionId);
  return true;
}

/**
 * Kill an active agent session.
 *
 * @param sessionId - The session ID to kill
 * @returns true if the session was found and killed
 */
export function killSession(sessionId: string): boolean {
  const session = activeSessions.get(sessionId);
  if (!session) return false;

  session.abort.abort();
  activeSessions.delete(sessionId);
  return true;
}

/**
 * Extract file path from tool input based on tool type.
 */
function extractFilePath(toolName: string, input: Record<string, unknown>): string | undefined {
  // Common field names for file paths across tools
  if ('file_path' in input && typeof input.file_path === 'string') {
    return input.file_path;
  }
  if ('filePath' in input && typeof input.filePath === 'string') {
    return input.filePath;
  }
  if ('path' in input && typeof input.path === 'string') {
    return input.path;
  }

  // Tool-specific extraction
  switch (toolName) {
    case 'Write':
    case 'Read':
    case 'Edit':
      return (input.file_path as string) || (input.path as string);
    default:
      return undefined;
  }
}

/**
 * Extract command from tool input (for Bash tool).
 */
function extractCommand(toolName: string, input: Record<string, unknown>): string | undefined {
  if (toolName === 'Bash' && 'command' in input) {
    return input.command as string;
  }
  return undefined;
}

/**
 * Generate a human-readable description of the tool action.
 */
function generateDescription(toolName: string, input: Record<string, unknown>): string {
  const filePath = extractFilePath(toolName, input);
  const command = extractCommand(toolName, input);

  switch (toolName) {
    case 'Write':
      return `Write to file: ${filePath || 'unknown'}`;
    case 'Read':
      return `Read file: ${filePath || 'unknown'}`;
    case 'Edit':
      return `Edit file: ${filePath || 'unknown'}`;
    case 'Bash':
      return `Execute command: ${command || 'unknown'}`;
    case 'Glob':
      return `Search files: ${input.pattern || 'unknown pattern'}`;
    case 'Grep':
      return `Search content: ${input.pattern || 'unknown pattern'}`;
    case 'WebSearch':
      return `Web search: ${input.query || 'unknown query'}`;
    case 'WebFetch':
      return `Fetch URL: ${input.url || 'unknown URL'}`;
    case 'Task':
      return `Start subagent: ${input.prompt ? String(input.prompt).slice(0, 50) : 'unknown task'}...`;
    default:
      return `Use tool: ${toolName}`;
  }
}

/**
 * Transform SDK message to our normalized event format.
 */
function transformMessage(sessionId: string, message: Record<string, unknown>): AgentEvent | null {
  const timestamp = new Date().toISOString();

  // Handle different SDK message types
  switch (message.type) {
    case 'assistant': {
      // Assistant message with content blocks
      const content = message.message as Record<string, unknown> | undefined;
      if (content?.content && Array.isArray(content.content)) {
        // Extract text from content blocks
        const textBlocks = content.content.filter(
          (block: Record<string, unknown>) => 'text' in block
        );
        if (textBlocks.length > 0) {
          const text = textBlocks.map((block: Record<string, unknown>) => block.text).join('\n');
          return {
            type: 'message',
            sessionId,
            content: text,
            timestamp,
          };
        }

        // Check for tool use in content
        const toolBlocks = content.content.filter(
          (block: Record<string, unknown>) => block.type === 'tool_use'
        );
        if (toolBlocks.length > 0) {
          const tool = toolBlocks[0] as Record<string, unknown>;
          return {
            type: 'tool_use',
            sessionId,
            toolName: tool.name as string,
            toolInput: tool.input as Record<string, unknown>,
            toolId: tool.id as string,
            timestamp,
          };
        }
      }
      return null;
    }

    case 'user': {
      // Tool result from the user/system
      const content = message.message as Record<string, unknown> | undefined;
      if (content?.content && Array.isArray(content.content)) {
        const resultBlocks = content.content.filter(
          (block: Record<string, unknown>) => block.type === 'tool_result'
        );
        if (resultBlocks.length > 0) {
          const result = resultBlocks[0] as Record<string, unknown>;
          return {
            type: 'tool_result',
            sessionId,
            toolId: result.tool_use_id as string,
            output:
              typeof result.content === 'string' ? result.content : JSON.stringify(result.content),
            isError: result.is_error === true,
            timestamp,
          };
        }
      }
      return null;
    }

    case 'result': {
      // Final result message
      return {
        type: 'system',
        sessionId,
        content: `Agent completed: ${message.subtype || 'success'}`,
        timestamp,
      };
    }

    default:
      // Log unknown message types for debugging
      console.debug('Unknown SDK message type:', message.type, message);
      return null;
  }
}
