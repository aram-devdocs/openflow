# OpenFlow MCP Server

Model Context Protocol (MCP) server that enables AI agents to interact with the OpenFlow application during development. This server provides tools for managing the application lifecycle, running development commands, and creating a feedback loop for AI-assisted development.

## Overview

The MCP server exposes tools that allow AI agents (like Claude Code) to:

- Start, stop, and monitor the OpenFlow application
- Run development commands (lint, typecheck, test, build)
- View application logs and status
- Generate TypeScript types from Rust definitions
- Run Rust cargo checks

When combined with Playwright MCP for UI interaction, AI agents can:

- Take screenshots of the running application
- Interact with UI elements
- Verify visual changes
- Test user journeys

## Installation

The MCP server is included in the OpenFlow monorepo. Dependencies are installed automatically:

```bash
pnpm install
```

## Configuration

### Claude Code Configuration

Add the following to your Claude Code MCP settings (typically in `~/.claude/settings.json` or project-level `.claude/settings.json`):

```json
{
  "mcpServers": {
    "openflow": {
      "command": "npx",
      "args": ["tsx", "packages/mcp-server/index.ts"],
      "cwd": "/path/to/openflow"
    }
  }
}
```

Or copy from the provided `mcp-server.json` in the project root.

### Playwright MCP Integration

For full UI testing capabilities, also configure the Playwright MCP server:

```json
{
  "mcpServers": {
    "openflow": {
      "command": "npx",
      "args": ["tsx", "packages/mcp-server/index.ts"],
      "cwd": "/path/to/openflow"
    },
    "playwright": {
      "command": "npx",
      "args": ["@playwright/mcp@latest"]
    }
  }
}
```

## Available Tools

### Lifecycle Tools

#### `openflow_start`
Start the OpenFlow app in development mode.

**Input:**
- `timeout_seconds` (optional, default: 120): Maximum time to wait for startup

**Output:**
- `pid`: Process ID of the running app
- `devServerUrl`: URL of the Vite dev server
- `message`: Success message

#### `openflow_stop`
Stop the running OpenFlow app.

**Output:**
- `message`: Success/status message

#### `openflow_status`
Check if the OpenFlow app is currently running and get status info.

**Output:**
- `state`: Current state (stopped, starting, running, stopping, error)
- `pid`: Process ID (if running)
- `uptime`: Uptime in milliseconds (if running)
- `devServerUrl`: Dev server URL (if running)
- `error`: Error message (if in error state)

#### `openflow_restart`
Restart the OpenFlow app. Stops if running, then starts fresh.

**Input:**
- `timeout_seconds` (optional, default: 120): Maximum time to wait for startup

**Output:**
- `pid`: Process ID of the new process
- `devServerUrl`: URL of the dev server
- `message`: Success message

#### `openflow_wait_ready`
Wait for the OpenFlow app to be fully ready and responding.

**Input:**
- `timeout_seconds` (optional, default: 60): Maximum time to wait

**Output:**
- `message`: Ready status
- `devServerUrl`: Dev server URL
- `uptime`: Uptime in milliseconds

#### `openflow_logs`
Get recent dev server logs from the running app.

**Input:**
- `lines` (optional, default: 50, max: 500): Number of log lines to return
- `level` (optional, default: "info"): Minimum log level (debug, info, warn, error)

**Output:**
- `appState`: Current app state
- `logCount`: Number of logs returned
- `filter`: Applied filter options
- `logs`: Array of log entries with timestamp, level, and message

### Development Tools

#### `openflow_lint`
Run Biome linting on the codebase.

**Input:**
- `fix` (optional, default: false): Auto-fix linting issues

**Output:**
- `exitCode`: Command exit code
- `errors`: Number of errors
- `warnings`: Number of warnings
- `fixed`: Number of fixed issues (if fix mode)
- `output`: Raw command output

#### `openflow_typecheck`
Run TypeScript type checking across the project.

**Output:**
- `exitCode`: Command exit code
- `errors`: Number of type errors
- `filesWithErrors`: List of files with errors
- `output`: Raw command output

#### `openflow_test`
Run Vitest tests.

**Input:**
- `filter` (optional): Test name pattern to filter

**Output:**
- `exitCode`: Command exit code
- `passed`: Number of passed tests
- `failed`: Number of failed tests
- `skipped`: Number of skipped tests
- `total`: Total number of tests
- `output`: Raw command output

#### `openflow_build`
Build the OpenFlow application.

**Output:**
- `exitCode`: Command exit code
- `output`: Raw command output

#### `openflow_generate_types`
Regenerate TypeScript types from Rust type definitions using typeshare.

**Output:**
- `exitCode`: Command exit code
- `output`: Raw command output

#### `openflow_rust_check`
Run cargo check on the Rust backend code.

**Output:**
- `exitCode`: Command exit code
- `errors`: Number of errors
- `warnings`: Number of warnings
- `filesWithErrors`: List of files with errors
- `output`: Raw command output

## Usage Examples

### Starting the App and Taking a Screenshot

```
AI: "Start the OpenFlow app and take a screenshot"

1. Use openflow_start to start the app
2. Wait for the dev server URL
3. Use Playwright MCP browser_navigate to go to the URL
4. Use Playwright MCP browser_take_screenshot to capture the UI
```

### Development Workflow

```
AI: "Check if my changes pass all checks"

1. Use openflow_typecheck to run TypeScript checking
2. Use openflow_lint to run linting
3. Use openflow_test to run tests
4. Use openflow_rust_check to check Rust code
5. Report results
```

### Iterative Development

```
AI: "Fix the type error in the component"

1. Use openflow_typecheck to identify the error
2. Read the file and fix the issue
3. Use openflow_typecheck again to verify
4. Use openflow_start to start the app
5. Use Playwright MCP to take a screenshot and verify UI
6. Use openflow_stop when done
```

## Scripts

The following npm scripts are available:

```bash
# Start the MCP server
pnpm mcp:start

# Start with file watching (for development)
pnpm mcp:dev
```

## Architecture

```
packages/mcp-server/
├── index.ts          # Entry point, exports, and server startup
├── server.ts         # MCP server setup with stdio transport
├── types.ts          # Shared TypeScript type definitions
├── utils.ts          # Utility functions
├── tools/
│   ├── index.ts      # Tool registration and routing
│   ├── lifecycle.ts  # App lifecycle tools (start, stop, status, etc.)
│   └── development.ts # Development tools (lint, test, build, etc.)
└── services/
    ├── index.ts      # Service exports
    ├── app-manager.ts # Application process management
    └── command-runner.ts # Shell command execution
```

## Development

### Running Tests

The MCP server includes test scripts for verification:

```bash
# Full integration test suite (recommended)
npx tsx packages/mcp-server/test-integration.ts

# Test lifecycle tools only
npx tsx packages/mcp-server/test-mcp.ts

# Test development tools only
npx tsx packages/mcp-server/test-phase2.ts

# Test enhanced lifecycle tools
npx tsx packages/mcp-server/test-enhanced-lifecycle.ts
```

The integration test validates the complete development workflow:
- TypeScript type checking
- Biome linting
- Rust cargo check
- App start/stop/restart
- Dev server ready detection
- Log capture
- Error handling

### Adding New Tools

1. Add the tool definition to the appropriate file in `tools/`
2. Implement the handler function
3. Add the tool to the definitions array
4. Update the handler switch statement
5. Update this README with documentation

## Troubleshooting

### Server Won't Start

- Ensure all dependencies are installed: `pnpm install`
- Check that Node.js 18+ is installed
- Verify the working directory is correct in your MCP configuration

### App Won't Start

- Check if port 5173 (Vite) or 1420 (Tauri) is already in use
- Look at the logs with `openflow_logs` for error details
- Try `openflow_stop` first to clean up any orphaned processes

### Commands Timeout

- Increase the timeout parameter for the specific tool
- Check system resources (CPU, memory)
- For builds, ensure Rust toolchain is properly installed

## License

Part of the OpenFlow project.
