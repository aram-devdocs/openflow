/**
 * HTTP and WebSocket server for the Agent Service.
 *
 * Communication flow:
 * 1. Rust backend connects via WebSocket with sessionId
 * 2. Rust backend sends HTTP POST to start a session
 * 3. Agent events stream back via WebSocket
 * 4. Permission requests sent via WebSocket to backend
 * 5. Backend responds to permissions via HTTP POST
 */

import { type Server, createServer } from 'node:http';
import express, { type Request, type Response, type NextFunction } from 'express';
import { WebSocket, WebSocketServer } from 'ws';
import { getActiveSessionIds, killSession, resolvePermission, runAgent } from './agent.js';
import type {
  AgentConfig,
  PermissionRequest,
  PermissionResponseBody,
  StartSessionRequest,
  WebSocketPermissionResponse,
} from './types.js';

/** Map of session ID to WebSocket connection */
const sessionConnections = new Map<string, WebSocket>();

/**
 * Create the Agent Service HTTP/WebSocket server.
 */
export function createAgentServer(): Server {
  const app = express();
  const server = createServer(app);
  const wss = new WebSocketServer({ server });

  app.use(express.json());

  // Health check endpoint
  app.get('/health', (_req: Request, res: Response) => {
    res.json({
      status: 'ok',
      activeSessions: sessionConnections.size,
      sessionIds: getActiveSessionIds(),
    });
  });

  // Start a new agent session
  app.post('/sessions/start', (req: Request, res: Response) => {
    const body = req.body as StartSessionRequest;
    const { sessionId, prompt, config } = body;

    // Validate required fields
    if (!sessionId || !prompt) {
      res.status(400).json({ error: 'sessionId and prompt are required' });
      return;
    }

    // Check for WebSocket connection
    const ws = sessionConnections.get(sessionId);
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      res.status(400).json({
        error: 'WebSocket connection required first. Connect to ws://host:port/?sessionId=xxx',
      });
      return;
    }

    // Start agent in background, stream events via WebSocket
    startAgentSession(sessionId, prompt, config || {}, ws);

    res.json({ started: true, sessionId });
  });

  // Respond to a permission request
  app.post('/sessions/:sessionId/permission/:permissionId', (req: Request, res: Response) => {
    const sessionId = req.params.sessionId as string;
    const permissionId = req.params.permissionId as string;
    const body = req.body as PermissionResponseBody;
    const { approved, reason, modifiedInput } = body;

    if (typeof approved !== 'boolean') {
      res.status(400).json({ error: 'approved field is required' });
      return;
    }

    const success = resolvePermission(sessionId, permissionId, {
      approved,
      reason,
      modifiedInput,
    });

    if (success) {
      res.json({ resolved: true });
    } else {
      res.status(404).json({ error: 'Session or permission not found' });
    }
  });

  // Kill an agent session
  app.post('/sessions/:sessionId/kill', (req: Request, res: Response) => {
    const sessionId = req.params.sessionId as string;
    const success = killSession(sessionId);

    if (success) {
      res.json({ killed: true });
    } else {
      res.status(404).json({ error: 'Session not found' });
    }
  });

  // List active sessions
  app.get('/sessions', (_req: Request, res: Response) => {
    res.json({
      sessions: getActiveSessionIds(),
      connections: Array.from(sessionConnections.keys()),
    });
  });

  // Error handling middleware
  app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    console.error('Server error:', err);
    res.status(500).json({ error: 'Internal server error' });
  });

  // WebSocket connection handling
  wss.on('connection', (ws: WebSocket, req) => {
    // Extract session ID from query string: ws://localhost:3002/?sessionId=xxx
    const url = new URL(req.url || '', `http://${req.headers.host}`);
    const sessionId = url.searchParams.get('sessionId');

    if (!sessionId) {
      console.error('WebSocket connection rejected: missing sessionId');
      ws.close(4000, 'sessionId query parameter required');
      return;
    }

    console.log(`WebSocket connected for session: ${sessionId}`);
    sessionConnections.set(sessionId, ws);

    // Send acknowledgment
    ws.send(
      JSON.stringify({
        type: 'connected',
        sessionId,
        timestamp: new Date().toISOString(),
      })
    );

    // Handle incoming messages
    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString());
        handleWebSocketMessage(sessionId, message);
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error);
      }
    });

    // Handle connection close
    ws.on('close', () => {
      console.log(`WebSocket disconnected for session: ${sessionId}`);
      sessionConnections.delete(sessionId);
    });

    // Handle connection error
    ws.on('error', (error) => {
      console.error(`WebSocket error for session ${sessionId}:`, error);
      sessionConnections.delete(sessionId);
    });
  });

  return server;
}

/**
 * Handle incoming WebSocket messages from Rust backend.
 */
function handleWebSocketMessage(sessionId: string, message: Record<string, unknown>): void {
  switch (message.type) {
    case 'permission_response': {
      const permissionMsg = message as unknown as WebSocketPermissionResponse;
      resolvePermission(sessionId, permissionMsg.permissionId, {
        approved: permissionMsg.approved,
        reason: permissionMsg.reason,
        modifiedInput: permissionMsg.modifiedInput,
      });
      break;
    }

    case 'kill': {
      killSession(sessionId);
      break;
    }

    case 'ping': {
      const ws = sessionConnections.get(sessionId);
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(
          JSON.stringify({
            type: 'pong',
            timestamp: new Date().toISOString(),
          })
        );
      }
      break;
    }

    default:
      console.debug('Unknown WebSocket message type:', message.type);
  }
}

/**
 * Start an agent session and stream events to WebSocket.
 */
async function startAgentSession(
  sessionId: string,
  prompt: string,
  config: AgentConfig,
  ws: WebSocket
): Promise<void> {
  try {
    for await (const event of runAgent(
      sessionId,
      prompt,
      config,
      (permissionRequest: PermissionRequest) => {
        // Send permission request to Rust backend via WebSocket
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(
            JSON.stringify({
              type: 'permission_request',
              ...permissionRequest,
            })
          );
        }
      }
    )) {
      // Send each event to Rust backend via WebSocket
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(event));
      } else {
        console.warn(`WebSocket closed during session ${sessionId}, stopping`);
        killSession(sessionId);
        break;
      }
    }
  } catch (error) {
    console.error(`Session ${sessionId} error:`, error);

    // Send error event if WebSocket is still open
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(
        JSON.stringify({
          type: 'session_error',
          sessionId,
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString(),
        })
      );
    }
  }
}
