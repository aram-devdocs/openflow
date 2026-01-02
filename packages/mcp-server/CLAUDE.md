# MCP Server Package

## Purpose

Model Context Protocol server for AI agent integration. Allows AI agents to control and interact with the application.

## Tool Pattern

Each tool has a name, description, and handler. Tools are the interface for AI agent actions.

## Lifecycle Management

Handle app startup, shutdown, and status checks. Clean up resources on exit.

## Process Management

Manage spawned processes (dev server, build commands). Track output and status.

## Error Handling

Return clear errors that help agents understand failures. Don't crash on recoverable errors.

## Security

Tools run with full system access. Validate inputs carefully. Follow principle of least privilege.
