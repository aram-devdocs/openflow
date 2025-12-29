# OpenFlow MCP Server

Model Context Protocol (MCP) server that enables AI agents to interact with the OpenFlow application during development. This server provides tools for managing the application lifecycle, running development commands, and creating a feedback loop for AI-assisted development.

## Overview

The MCP server exposes 20 tools that allow AI agents (like Claude Code) to:

- **Lifecycle Management**: Start, stop, restart, and monitor the OpenFlow application
- **Development Commands**: Run lint, typecheck, test, build, and type generation
- **Log Inspection**: View application logs with filtering
- **Rust Tooling**: Run cargo check on the backend
- **UI Interaction**: Take screenshots, click elements, type text, execute JavaScript
- **DOM Inspection**: Inspect page structure and wait for elements

### Architecture Overview

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│    AI Agent     │────▶│   MCP Server    │────▶│   Tauri App     │
│  (Claude Code)  │     │  (Node.js/TS)   │     │   (Rust/React)  │
└─────────────────┘     └────────┬────────┘     └────────┬────────┘
                                 │                       │
                                 │ IPC Socket            │
                                 │ /tmp/openflow-mcp.sock│
                                 ▼                       │
                        ┌─────────────────┐              │
                        │ tauri-plugin-   │◀─────────────┘
                        │    mcp-gui      │
                        └─────────────────┘
```

### MCP GUI Plugin (Tauri Integration)

The OpenFlow Tauri app includes `tauri-plugin-mcp-gui` for direct UI automation via socket communication:

- **Socket path**: `/tmp/openflow-mcp.sock` (Unix IPC socket)
- **Features**: Screenshots, DOM access, input simulation, JavaScript execution
- **Auto-enabled**: When the app is started via MCP server tools

**Important Limitation**: UI tools require the application window to be **visible and focused**. Screenshots and interactions will fail if the window is minimized or in the background. This is a limitation of the underlying Tauri plugin.

## Installation

The MCP server is included in the OpenFlow monorepo. Dependencies are installed automatically:

```bash
pnpm install
```

### Tauri Plugin Installation (Required for UI Tools)

The UI tools (`openflow_screenshot`, `openflow_click`, etc.) require the `tauri-plugin-mcp-gui` plugin to be installed in the Tauri app. This plugin is already configured in OpenFlow, but if you're setting up a new project:

**1. Add the Rust dependency to `src-tauri/Cargo.toml`:**

```toml
[dependencies]
tauri-plugin-mcp-gui = "0.1"
```

**2. Initialize the plugin in `src-tauri/src/lib.rs`:**

```rust
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_mcp_gui::init())
        // ... other plugins
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

**3. Add frontend JavaScript (optional, for advanced control):**

The plugin automatically starts when the app launches. No frontend code is required for basic functionality.

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

## Available Tools

### Lifecycle Tools

#### `openflow_start`
Start the OpenFlow app in development mode. By default, starts with the MCP GUI plugin enabled for UI automation.

**Input:**
- `timeout_seconds` (optional, default: 120): Maximum time to wait for startup
- `enable_mcp_gui` (optional, default: true): Enable MCP GUI plugin for UI automation

**Output:**
- `pid`: Process ID of the running app
- `devServerUrl`: URL of the Vite dev server
- `mcpSocketPath`: Path to MCP GUI socket (if enabled)
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

### UI Tools

These tools interact with the running Tauri application via the MCP GUI plugin. **The app must be running** (use `openflow_start` first), and **the window must be visible and focused**.

#### `openflow_screenshot`
Take a screenshot of the OpenFlow application window.

**Input:**
- `save_path` (optional): File path to save screenshot (e.g., `"./screenshots/test.png"`). If omitted, returns base64 data.
- `quality` (optional, default: 85): JPEG quality (1-100)
- `max_width` (optional): Maximum width in pixels (image will be scaled down if larger)

**Output:**
- `saved`: Whether file was saved to disk
- `path`: Absolute path to saved file (if save_path provided)
- `base64`: Base64-encoded image data (if no save_path)
- `width`: Image width in pixels
- `height`: Image height in pixels
- `size_bytes`: Image size in bytes

#### `openflow_inspect`
Get the DOM/HTML structure of the current page in the webview.

**Input:**
- `selector` (optional): CSS selector to inspect a specific element. If omitted, returns full page HTML.
- `include_styles` (optional, default: false): Include computed styles for elements

**Output (with selector):**
- `found`: Whether element was found
- `selector`: The selector used
- `tagName`: Element tag name
- `id`: Element ID (if any)
- `className`: Element class names
- `innerText`: Text content (truncated to 500 chars)
- `innerHTML`: HTML content (truncated to 2000 chars)
- `attributes`: Array of `{ name, value }` objects
- `boundingRect`: `{ x, y, width, height }` position
- `computedStyles`: Object with key style properties (if include_styles)

**Output (without selector):**
- `html`: Full page HTML (truncated to 50KB)
- `truncated`: Whether HTML was truncated
- `fullLength`: Original HTML length

#### `openflow_click`
Click on an element by CSS selector or at specific coordinates.

**Input (use selector OR coordinates):**
- `selector` (optional): CSS selector of element to click (e.g., `"button.submit"`, `"#login-btn"`)
- `x` (optional): X coordinate to click (use instead of selector)
- `y` (optional): Y coordinate to click (use instead of selector)
- `button` (optional, default: "left"): Mouse button (`"left"`, `"right"`, `"middle"`)
- `double_click` (optional, default: false): Perform a double-click

**Output:**
- `clicked`: Whether click was performed
- `selector` or `x`, `y`: Target that was clicked
- `button`: Mouse button used
- `doubleClick`: Whether it was a double-click

#### `openflow_type`
Type text into an input element or at the current focus.

**Input:**
- `text` (required): Text to type
- `selector` (optional): CSS selector of input element. If omitted, types at current focus.
- `delay_ms` (optional, default: 20): Delay between keystrokes in milliseconds
- `clear_first` (optional, default: false): Clear the input field before typing

**Output:**
- `typed`: Whether text was typed
- `text`: The text that was typed
- `selector`: Target element (if provided)
- `charCount`: Number of characters typed

#### `openflow_key`
Press a keyboard key or shortcut.

**Input:**
- `key` (required): Key to press. Examples:
  - Single keys: `"Enter"`, `"Escape"`, `"Tab"`, `"Backspace"`, `"Delete"`, `"ArrowUp"`, `"ArrowDown"`, `"ArrowLeft"`, `"ArrowRight"`
  - With modifiers: `"Ctrl+A"`, `"Cmd+S"`, `"Shift+Tab"`, `"Alt+F4"`

**Output:**
- `pressed`: Whether key was pressed
- `key`: The key combination
- `dispatched`: Whether event was dispatched
- `target`: Target element tag name

#### `openflow_evaluate`
Execute JavaScript code in the webview and return the result.

**Input:**
- `code` (required): JavaScript code to execute. Can be an expression (returns value) or statements.
- `timeout_ms` (optional, default: 5000): Timeout for script execution

**Output:**
- `result`: The return value from the JavaScript code
- `type`: The JavaScript type of the result

**Examples:**
```javascript
// Get page title
"document.title"

// Count buttons
"document.querySelectorAll('button').length"

// Get current URL
"window.location.href"

// Execute IIFE with complex logic
"(function() { return { count: document.querySelectorAll('li').length }; })()"
```

#### `openflow_console`
Get recent browser console messages from the webview.

**Input:**
- `level` (optional, default: "all"): Filter by level (`"all"`, `"error"`, `"warn"`, `"info"`, `"log"`, `"debug"`)
- `limit` (optional, default: 50): Maximum number of messages to return

**Output:**
- `messages`: Array of `{ level, message, timestamp }` objects
- `count`: Number of messages returned
- `filter`: Applied level filter

**Note:** Console capture is initialized on first call. Messages before the first call may not be captured.

#### `openflow_wait_for_element`
Wait for an element to appear in the DOM.

**Input:**
- `selector` (required): CSS selector of element to wait for
- `timeout_ms` (optional, default: 10000): Maximum time to wait in milliseconds
- `visible` (optional, default: true): Wait for element to be visible (not just in DOM)

**Output (success):**
- `found`: true
- `selector`: The selector used
- `visible`: Whether element is visible
- `boundingRect`: `{ x, y, width, height }` position
- `waitedMs`: How long it waited

**Output (timeout):**
- `error`: Timeout error message
- `selector`: The selector used
- `timeout`: Timeout value
- `checkVisible`: Whether visibility was required

## Usage Examples

### Starting the App and Taking a Screenshot

```
AI: "Start the OpenFlow app and take a screenshot"

1. Use openflow_start to start the app
2. Use openflow_wait_ready to ensure app is fully loaded
3. Use openflow_screenshot with save_path to capture the UI
4. Use openflow_stop when done
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
5. Use openflow_screenshot to verify UI renders correctly
6. Use openflow_stop when done
```

### UI Testing Workflow

```
AI: "Test the login form functionality"

1. Use openflow_start to start the app
2. Use openflow_wait_for_element with selector "#login-form"
3. Use openflow_screenshot to capture initial state
4. Use openflow_type with selector "#email" and text "test@example.com"
5. Use openflow_type with selector "#password" and text "password123"
6. Use openflow_click with selector "button[type='submit']"
7. Use openflow_wait_for_element with selector ".dashboard"
8. Use openflow_screenshot to capture result
9. Use openflow_console to check for any errors
10. Use openflow_stop when done
```

### Debugging with DOM Inspection

```
AI: "Find why the button isn't visible"

1. Use openflow_start to start the app
2. Use openflow_inspect with selector ".submit-button" and include_styles: true
3. Check boundingRect and computedStyles for visibility issues
4. Use openflow_evaluate with code "getComputedStyle(document.querySelector('.submit-button')).display"
5. Report findings
```

### Complete Development Cycle

```
AI: "Make a code change and verify it works"

1. Edit the source file to make the change
2. Use openflow_typecheck to ensure no type errors
3. Use openflow_lint to check code style
4. Use openflow_restart to reload the app (if already running)
5. Use openflow_wait_for_element to wait for the changed component
6. Use openflow_screenshot to capture the result
7. Use openflow_console to check for runtime errors
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
├── index.ts              # Entry point, exports, and server startup
├── server.ts             # MCP server setup with stdio transport
├── types.ts              # Shared TypeScript type definitions
├── utils.ts              # Utility functions
├── tools/
│   ├── index.ts          # Tool registration and routing
│   ├── lifecycle.ts      # App lifecycle tools (start, stop, status, etc.)
│   ├── development.ts    # Development tools (lint, test, build, etc.)
│   └── ui.ts             # UI automation tools (screenshot, click, type, etc.)
└── services/
    ├── index.ts          # Service exports
    ├── app-manager.ts    # Application process management
    ├── command-runner.ts # Shell command execution
    └── tauri-bridge.ts   # Socket client for tauri-plugin-mcp-gui
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

# Test UI tools (requires visible app window)
npx tsx packages/mcp-server/test-ui-tools.ts
```

The integration test validates the complete development workflow:
- TypeScript type checking
- Biome linting
- Rust cargo check
- App start/stop/restart
- Dev server ready detection
- Log capture
- Error handling

The UI tools test validates:
- Screenshot capture and file saving
- DOM inspection and element queries
- Click, type, and keyboard simulation
- JavaScript execution in webview
- Console message capture
- Element wait functionality

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

### UI Tools Not Working

**"App is not running" error:**
- Start the app first with `openflow_start`
- Use `openflow_status` to verify the app state

**"Window not found" error:**
- The app window must be **visible and focused** on your desktop
- Minimized or background windows cannot be captured or interacted with
- This is a limitation of the tauri-plugin-mcp-gui

**Socket connection errors (ECONNREFUSED, ENOENT):**
- Verify the app was started with MCP GUI plugin enabled (default when using `openflow_start`)
- Check if socket file exists: `ls -la /tmp/openflow-mcp.sock`
- The socket is created when the Tauri app starts
- If the socket doesn't exist, the plugin may not be installed in the Tauri app

**Screenshot returns empty or fails:**
- Ensure the app window is not minimized
- The window must be on the current desktop/space (macOS)
- Try bringing the window to focus before taking a screenshot

**Click/type not working on elements:**
- Use `openflow_inspect` with the selector to verify the element exists
- Check that the element is visible (not `display: none` or `visibility: hidden`)
- Use `openflow_wait_for_element` before interacting with dynamic content
- Verify the selector is correct with `openflow_evaluate` and `document.querySelector()`

**JavaScript evaluation fails:**
- Ensure the code is valid JavaScript
- For complex logic, wrap in an IIFE: `(function() { ... })()`
- Check for syntax errors in the code string
- Use `openflow_console` to see any errors logged

**Console messages not appearing:**
- Console capture starts when you first call `openflow_console`
- Messages logged before the first call are not captured
- Call `openflow_console` early in your workflow to start capturing

### Debugging Tips

1. **Check app state**: Always start with `openflow_status` to understand the current state
2. **View logs**: Use `openflow_logs` to see dev server output and errors
3. **Inspect DOM**: Use `openflow_inspect` without a selector to see the full page structure
4. **Test JavaScript**: Use `openflow_evaluate` to test selectors before clicking
5. **Check console**: Use `openflow_console` with level "error" to see runtime errors

### Common Issues by Platform

**macOS:**
- Accessibility permissions may be required for input simulation
- Window must be on current desktop/space for screenshots
- IPC socket path: `/tmp/openflow-mcp.sock`

**Windows:**
- Named pipe path may differ: `\\.\pipe\openflow-mcp`
- UAC permissions may affect app startup

**Linux:**
- IPC socket in `/tmp/openflow-mcp.sock`
- X11/Wayland differences may affect screenshot capture

## License

Part of the OpenFlow project.
