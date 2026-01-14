#!/usr/bin/env node
/**
 * Agent Service Entry Point
 *
 * This service wraps the Claude Agent SDK and provides:
 * - HTTP API for session management
 * - WebSocket streaming for events
 * - Structured permission handling via canUseTool
 *
 * Environment variables:
 * - AGENT_SERVICE_PORT: Port to listen on (default: 3002)
 * - CLAUDE_CODE_OAUTH_TOKEN: OAuth token for Claude Max authentication
 */

import { createAgentServer } from './server.js';

const PORT = Number.parseInt(process.env.AGENT_SERVICE_PORT || '3002', 10);

async function main(): Promise<void> {
  // Verify Claude Code authentication
  if (!process.env.CLAUDE_CODE_OAUTH_TOKEN && !process.env.ANTHROPIC_API_KEY) {
    console.warn(
      'Warning: No CLAUDE_CODE_OAUTH_TOKEN or ANTHROPIC_API_KEY found. ' +
        'Make sure you have authenticated with Claude Code (run `claude` in terminal) ' +
        'or set one of these environment variables.'
    );
  }

  const server = createAgentServer();

  // Start server
  server.listen(PORT, () => {
    console.log(`Agent service listening on port ${PORT}`);
    console.log(`Health check: http://localhost:${PORT}/health`);
    console.log(`WebSocket: ws://localhost:${PORT}/?sessionId=<session_id>`);
  });

  // Graceful shutdown handling
  const shutdown = (signal: string) => {
    console.log(`\nReceived ${signal}, shutting down agent service...`);

    server.close((err) => {
      if (err) {
        console.error('Error during shutdown:', err);
        process.exit(1);
      }
      console.log('Agent service stopped');
      process.exit(0);
    });

    // Force exit after 10 seconds if graceful shutdown fails
    setTimeout(() => {
      console.error('Forced shutdown after timeout');
      process.exit(1);
    }, 10000);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  // Handle uncaught errors
  process.on('uncaughtException', (error) => {
    console.error('Uncaught exception:', error);
    shutdown('uncaughtException');
  });

  process.on('unhandledRejection', (reason) => {
    console.error('Unhandled rejection:', reason);
    // Don't shutdown on unhandled rejection, just log
  });
}

main().catch((error) => {
  console.error('Failed to start agent service:', error);
  process.exit(1);
});

// Re-export types and functions for programmatic use
export * from './types.js';
export { createAgentServer } from './server.js';
export {
  runAgent,
  resolvePermission,
  killSession,
  getSession,
  getActiveSessionIds,
} from './agent.js';
