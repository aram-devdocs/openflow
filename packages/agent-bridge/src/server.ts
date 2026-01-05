#!/usr/bin/env node
/**
 * Agent Bridge Server
 *
 * HTTP server that bridges OpenFlow's Rust backend to the Claude Agent SDK.
 * Accepts requests and streams back events via Server-Sent Events (SSE).
 *
 * ## Architecture
 *
 * ```
 * Rust Backend
 *       |
 *   POST /execute
 *       |
 *       v
 * Agent Bridge Server
 *       |
 *   query() from SDK
 *       |
 *       v
 * Claude Agent SDK
 *       |
 *   SSE stream back
 *       |
 *       v
 * Rust Backend (parse events)
 * ```
 *
 * ## Environment Variables
 *
 * - AGENT_BRIDGE_PORT: Port to listen on (default: 3002)
 * - ANTHROPIC_API_KEY: Required for Claude API access
 */

import { query } from '@anthropic-ai/claude-agent-sdk';
import express, { type Application, type Request, type Response } from 'express';
import type { AgentEvent, ExecuteRequest, HealthResponse } from './types.js';

// SDK message type (the SDK doesn't export this directly)
type SdkMessage = {
  type?: string;
  content?: unknown[];
  session_id?: string;
  [key: string]: unknown;
};

const app: Application = express();
app.use(express.json());

const PORT = Number.parseInt(process.env.AGENT_BRIDGE_PORT || '3002', 10);
const startTime = Date.now();

/**
 * Create a timestamp string for events.
 */
function timestamp(): string {
  return new Date().toISOString();
}

/**
 * Send an SSE event to the response.
 */
function sendEvent(res: Response, event: AgentEvent): void {
  res.write(`data: ${JSON.stringify(event)}\n\n`);
}

/**
 * Health check endpoint.
 */
app.get('/health', (_req: Request, res: Response) => {
  const response: HealthResponse = {
    status: 'ok',
    version: '0.1.0',
    uptime: Math.floor((Date.now() - startTime) / 1000),
  };
  res.json(response);
});

/**
 * Execute an agent query with the Claude Agent SDK.
 *
 * Accepts a prompt and configuration, streams events back via SSE.
 */
app.post('/execute', async (req: Request, res: Response) => {
  const body = req.body as ExecuteRequest;

  if (!body.prompt) {
    res.status(400).json({ error: 'Missing required field: prompt' });
    return;
  }

  if (!body.workingDir) {
    res.status(400).json({ error: 'Missing required field: workingDir' });
    return;
  }

  // Set up SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no'); // Disable nginx buffering

  console.log(`[agent-bridge] Executing query in ${body.workingDir}`);
  console.log(`[agent-bridge] Prompt: ${body.prompt.substring(0, 100)}...`);

  let sessionId: string | null = null;

  try {
    // Build query options
    const options = {
      allowedTools: body.allowedTools || ['Read', 'Write', 'Edit', 'Bash', 'Glob', 'Grep'],
      permissionMode: body.permissionMode || 'acceptEdits',
      cwd: body.workingDir,
      maxThinkingTokens: body.maxThinkingTokens,
      ...(body.sessionId && { resume: body.sessionId }),
    } as const;

    // Stream messages from the SDK
    for await (const message of query({
      prompt: body.prompt,
      options,
    })) {
      // Convert SDK message to our event format
      const event = convertMessage(message, sessionId);

      if (event) {
        // Capture session ID from init events
        if (event.type === 'init' || event.type === 'session') {
          sessionId = event.sessionId;
        }

        sendEvent(res, event);
      }
    }

    // Send completion event
    sendEvent(res, {
      type: 'complete',
      status: 'success',
      timestamp: timestamp(),
    });
  } catch (error) {
    console.error('[agent-bridge] Error executing query:', error);

    sendEvent(res, {
      type: 'error',
      message: error instanceof Error ? error.message : String(error),
      code: 'EXECUTION_ERROR',
      timestamp: timestamp(),
    });

    sendEvent(res, {
      type: 'complete',
      status: 'error',
      timestamp: timestamp(),
    });
  }

  res.end();
});

/**
 * Convert a Claude Agent SDK message to our event format.
 */
function convertMessage(message: SdkMessage, _currentSessionId: string | null): AgentEvent | null {
  const ts = timestamp();

  // Handle different message types from the SDK
  // The SDK emits various message types that we normalize

  if ('type' in message && message.type) {
    switch (message.type) {
      case 'system':
        // System init message contains session_id
        if ('session_id' in message && message.session_id) {
          return {
            type: 'init',
            sessionId: message.session_id as string,
            timestamp: ts,
          };
        }
        break;

      case 'assistant':
        // Assistant message with content
        if ('content' in message && Array.isArray(message.content)) {
          const content = message.content as Array<Record<string, unknown>>;
          const textBlocks = content.filter(
            (block): block is { type: 'text'; text: string } =>
              typeof block === 'object' &&
              block !== null &&
              block.type === 'text' &&
              typeof block.text === 'string'
          );

          if (textBlocks.length > 0) {
            return {
              type: 'message',
              role: 'assistant',
              content: textBlocks.map((b) => b.text).join('\n'),
              timestamp: ts,
            };
          }

          // Check for tool use blocks
          const toolBlocks = content.filter(
            (
              block
            ): block is {
              type: 'tool_use';
              id: string;
              name: string;
              input: Record<string, unknown>;
            } =>
              typeof block === 'object' &&
              block !== null &&
              block.type === 'tool_use' &&
              typeof block.id === 'string' &&
              typeof block.name === 'string'
          );

          for (const tool of toolBlocks) {
            return {
              type: 'tool_use',
              toolId: tool.id,
              toolName: tool.name,
              input: tool.input,
              timestamp: ts,
            };
          }
        }
        break;

      case 'user':
        // User message (usually tool results)
        if ('content' in message && Array.isArray(message.content)) {
          const content = message.content as Array<Record<string, unknown>>;
          const toolResults = content.filter(
            (
              block
            ): block is {
              type: 'tool_result';
              tool_use_id: string;
              content: string;
              is_error?: boolean;
            } =>
              typeof block === 'object' &&
              block !== null &&
              block.type === 'tool_result' &&
              typeof block.tool_use_id === 'string'
          );

          for (const result of toolResults) {
            return {
              type: 'tool_result',
              toolId: result.tool_use_id,
              output:
                typeof result.content === 'string'
                  ? result.content
                  : JSON.stringify(result.content),
              isError: result.is_error ?? false,
              timestamp: ts,
            };
          }
        }
        break;

      case 'result':
        // Final result
        return {
          type: 'complete',
          status: 'success',
          timestamp: ts,
        };
    }
  }

  // Unknown message type, log for debugging
  console.log('[agent-bridge] Unknown message type:', JSON.stringify(message).substring(0, 200));
  return null;
}

/**
 * Start the server.
 */
app.listen(PORT, () => {
  console.log(`[agent-bridge] Server running on http://localhost:${PORT}`);
  console.log(`[agent-bridge] Health check: http://localhost:${PORT}/health`);
  console.log(`[agent-bridge] Execute endpoint: POST http://localhost:${PORT}/execute`);
});

export { app };
