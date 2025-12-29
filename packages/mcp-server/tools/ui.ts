/**
 * UI Tools
 *
 * MCP tools for interacting with the Tauri application UI:
 * - openflow_screenshot: Capture window screenshot
 * - openflow_inspect: Get DOM/accessibility tree
 * - openflow_click: Click element or coordinates
 * - openflow_type: Type text into element
 * - openflow_key: Press keyboard shortcut
 * - openflow_evaluate: Execute JS in webview
 * - openflow_console: Get browser console logs
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { getAppManager } from '../services/app-manager.js';
import { getTauriBridge } from '../services/tauri-bridge.js';
import type { ToolDefinition, ToolResponse, ToolResult } from '../types.js';

/**
 * UI tool definitions for MCP registration.
 */
export const uiToolDefinitions: ToolDefinition[] = [
  {
    name: 'openflow_screenshot',
    description:
      'Take a screenshot of the OpenFlow application window. Returns base64 image or saves to file.',
    inputSchema: {
      type: 'object',
      properties: {
        save_path: {
          type: 'string',
          description:
            'Optional file path to save screenshot (e.g., "./screenshots/test.png"). If omitted, returns base64 data.',
        },
        quality: {
          type: 'number',
          description: 'JPEG quality (1-100), default 85',
          default: 85,
        },
        max_width: {
          type: 'number',
          description: 'Maximum width in pixels (image will be scaled down if larger)',
        },
      },
    },
  },
  {
    name: 'openflow_inspect',
    description:
      'Get the DOM/HTML structure of the current page in the OpenFlow webview for inspection.',
    inputSchema: {
      type: 'object',
      properties: {
        selector: {
          type: 'string',
          description:
            'CSS selector to inspect a specific element. If omitted, returns full page HTML.',
        },
        include_styles: {
          type: 'boolean',
          description: 'Include computed styles for elements',
          default: false,
        },
      },
    },
  },
  {
    name: 'openflow_click',
    description:
      'Click on an element by CSS selector or at specific coordinates in the OpenFlow app.',
    inputSchema: {
      type: 'object',
      properties: {
        selector: {
          type: 'string',
          description: 'CSS selector of element to click (e.g., "button.submit", "#login-btn")',
        },
        x: {
          type: 'number',
          description: 'X coordinate to click (use instead of selector)',
        },
        y: {
          type: 'number',
          description: 'Y coordinate to click (use instead of selector)',
        },
        button: {
          type: 'string',
          enum: ['left', 'right', 'middle'],
          description: 'Mouse button to click',
          default: 'left',
        },
        double_click: {
          type: 'boolean',
          description: 'Perform a double-click instead of single click',
          default: false,
        },
      },
    },
  },
  {
    name: 'openflow_type',
    description: 'Type text into an input element or at the current focus in the OpenFlow app.',
    inputSchema: {
      type: 'object',
      properties: {
        text: {
          type: 'string',
          description: 'Text to type',
        },
        selector: {
          type: 'string',
          description:
            'CSS selector of input element to type into. If omitted, types at current focus.',
        },
        delay_ms: {
          type: 'number',
          description: 'Delay between keystrokes in milliseconds',
          default: 20,
        },
        clear_first: {
          type: 'boolean',
          description: 'Clear the input field before typing',
          default: false,
        },
      },
      required: ['text'],
    },
  },
  {
    name: 'openflow_key',
    description:
      'Press a keyboard key or shortcut in the OpenFlow app (e.g., "Enter", "Escape", "Ctrl+A").',
    inputSchema: {
      type: 'object',
      properties: {
        key: {
          type: 'string',
          description:
            'Key to press. Single keys: "Enter", "Escape", "Tab", "Backspace", "Delete", "ArrowUp", etc. Modifiers: "Ctrl+A", "Cmd+S", "Shift+Tab"',
        },
      },
      required: ['key'],
    },
  },
  {
    name: 'openflow_evaluate',
    description: 'Execute JavaScript code in the OpenFlow webview and return the result.',
    inputSchema: {
      type: 'object',
      properties: {
        code: {
          type: 'string',
          description:
            'JavaScript code to execute. Can be an expression (returns value) or statements.',
        },
        timeout_ms: {
          type: 'number',
          description: 'Timeout for script execution in milliseconds',
          default: 5000,
        },
      },
      required: ['code'],
    },
  },
  {
    name: 'openflow_console',
    description: 'Get recent browser console messages from the OpenFlow webview.',
    inputSchema: {
      type: 'object',
      properties: {
        level: {
          type: 'string',
          enum: ['all', 'error', 'warn', 'info', 'log', 'debug'],
          description: 'Filter by console message level',
          default: 'all',
        },
        limit: {
          type: 'number',
          description: 'Maximum number of messages to return',
          default: 50,
        },
      },
    },
  },
  {
    name: 'openflow_wait_for_element',
    description: 'Wait for an element to appear in the DOM of the OpenFlow app.',
    inputSchema: {
      type: 'object',
      properties: {
        selector: {
          type: 'string',
          description: 'CSS selector of element to wait for',
        },
        timeout_ms: {
          type: 'number',
          description: 'Maximum time to wait in milliseconds',
          default: 10000,
        },
        visible: {
          type: 'boolean',
          description: 'Wait for element to be visible (not just in DOM)',
          default: true,
        },
      },
      required: ['selector'],
    },
  },
];

/**
 * Handle a UI tool call.
 */
export async function handleUiTool(
  name: string,
  args: Record<string, unknown> | undefined
): Promise<ToolResponse> {
  // Check if app is running first
  const appManager = getAppManager();
  const status = appManager.getStatus();

  if (status.state !== 'running') {
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              success: false,
              error: `App is not running (current state: ${status.state}). Start the app first with openflow_start.`,
              hint: 'Use openflow_start to launch the app before using UI tools.',
            },
            null,
            2
          ),
        },
      ],
      isError: true,
    };
  }

  try {
    switch (name) {
      case 'openflow_screenshot': {
        const result = await takeScreenshot({
          savePath: args?.save_path as string | undefined,
          quality: args?.quality as number | undefined,
          maxWidth: args?.max_width as number | undefined,
        });
        return formatToolResponse(result);
      }
      case 'openflow_inspect': {
        const result = await inspectDom({
          selector: args?.selector as string | undefined,
          includeStyles: args?.include_styles as boolean | undefined,
        });
        return formatToolResponse(result);
      }
      case 'openflow_click': {
        const result = await clickElement({
          selector: args?.selector as string | undefined,
          x: args?.x as number | undefined,
          y: args?.y as number | undefined,
          button: args?.button as 'left' | 'right' | 'middle' | undefined,
          doubleClick: args?.double_click as boolean | undefined,
        });
        return formatToolResponse(result);
      }
      case 'openflow_type': {
        const result = await typeText({
          text: args?.text as string,
          selector: args?.selector as string | undefined,
          delayMs: args?.delay_ms as number | undefined,
          clearFirst: args?.clear_first as boolean | undefined,
        });
        return formatToolResponse(result);
      }
      case 'openflow_key': {
        const result = await pressKey({
          key: args?.key as string,
        });
        return formatToolResponse(result);
      }
      case 'openflow_evaluate': {
        const result = await evaluateJs({
          code: args?.code as string,
          timeoutMs: args?.timeout_ms as number | undefined,
        });
        return formatToolResponse(result);
      }
      case 'openflow_console': {
        const result = await getConsoleMessages({
          level: args?.level as string | undefined,
          limit: args?.limit as number | undefined,
        });
        return formatToolResponse(result);
      }
      case 'openflow_wait_for_element': {
        const result = await waitForElement({
          selector: args?.selector as string,
          timeoutMs: args?.timeout_ms as number | undefined,
          visible: args?.visible as boolean | undefined,
        });
        return formatToolResponse(result);
      }
      default:
        return {
          content: [{ type: 'text', text: `Unknown UI tool: ${name}` }],
          isError: true,
        };
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              success: false,
              error: message,
              hint: isConnectionError(message)
                ? 'The Tauri MCP GUI plugin may not be running. Ensure the app was started with MCP GUI enabled.'
                : undefined,
            },
            null,
            2
          ),
        },
      ],
      isError: true,
    };
  }
}

/**
 * Check if an error message indicates a connection issue.
 */
function isConnectionError(message: string): boolean {
  const connectionErrors = ['ECONNREFUSED', 'ENOENT', 'socket', 'connect', 'Connection', 'timeout'];
  return connectionErrors.some((err) => message.toLowerCase().includes(err.toLowerCase()));
}

/**
 * Format a ToolResult as an MCP response.
 */
function formatToolResponse(result: ToolResult): ToolResponse {
  const responseData: Record<string, unknown> = {
    success: result.success,
  };

  if (result.error) {
    responseData.error = result.error;
  }

  if (result.data && typeof result.data === 'object') {
    Object.assign(responseData, result.data);
  } else if (result.data !== undefined) {
    responseData.result = result.data;
  }

  return {
    content: [{ type: 'text', text: JSON.stringify(responseData, null, 2) }],
    isError: false,
  };
}

// ============================================================================
// Tool Implementations
// ============================================================================

/**
 * Take a screenshot of the application window.
 */
async function takeScreenshot(options: {
  savePath?: string;
  quality?: number;
  maxWidth?: number;
}): Promise<ToolResult> {
  const bridge = getTauriBridge();

  try {
    const screenshotResult = await bridge.screenshot({
      quality: options.quality ?? 85,
      max_width: options.maxWidth,
    });

    // If save_path is provided, save to file
    if (options.savePath) {
      const absolutePath = path.isAbsolute(options.savePath)
        ? options.savePath
        : path.resolve(process.cwd(), options.savePath);

      // Ensure directory exists
      const dir = path.dirname(absolutePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      // Decode base64 and save
      const imageBuffer = Buffer.from(screenshotResult.data, 'base64');
      fs.writeFileSync(absolutePath, imageBuffer);

      return {
        success: true,
        data: {
          saved: true,
          path: absolutePath,
          width: screenshotResult.width,
          height: screenshotResult.height,
          size_bytes: imageBuffer.length,
        },
      };
    }

    // Return base64 data
    return {
      success: true,
      data: {
        saved: false,
        base64: screenshotResult.data,
        width: screenshotResult.width,
        height: screenshotResult.height,
        size_bytes: screenshotResult.data.length,
      },
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      error: `Failed to take screenshot: ${message}`,
    };
  }
}

/**
 * Inspect DOM structure.
 */
async function inspectDom(options: {
  selector?: string;
  includeStyles?: boolean;
}): Promise<ToolResult> {
  const bridge = getTauriBridge();

  try {
    if (options.selector) {
      // Get specific element
      const code = options.includeStyles
        ? `
          (function() {
            const el = document.querySelector(${JSON.stringify(options.selector)});
            if (!el) return { found: false, selector: ${JSON.stringify(options.selector)} };
            const styles = window.getComputedStyle(el);
            const importantStyles = {
              display: styles.display,
              visibility: styles.visibility,
              position: styles.position,
              width: styles.width,
              height: styles.height,
              margin: styles.margin,
              padding: styles.padding,
              color: styles.color,
              backgroundColor: styles.backgroundColor,
            };
            return {
              found: true,
              selector: ${JSON.stringify(options.selector)},
              tagName: el.tagName.toLowerCase(),
              id: el.id || null,
              className: el.className || null,
              innerText: el.innerText?.slice(0, 500),
              innerHTML: el.innerHTML?.slice(0, 2000),
              attributes: Array.from(el.attributes).map(a => ({ name: a.name, value: a.value })),
              computedStyles: importantStyles,
              boundingRect: el.getBoundingClientRect(),
            };
          })()
        `
        : `
          (function() {
            const el = document.querySelector(${JSON.stringify(options.selector)});
            if (!el) return { found: false, selector: ${JSON.stringify(options.selector)} };
            return {
              found: true,
              selector: ${JSON.stringify(options.selector)},
              tagName: el.tagName.toLowerCase(),
              id: el.id || null,
              className: el.className || null,
              innerText: el.innerText?.slice(0, 500),
              innerHTML: el.innerHTML?.slice(0, 2000),
              attributes: Array.from(el.attributes).map(a => ({ name: a.name, value: a.value })),
              boundingRect: el.getBoundingClientRect(),
            };
          })()
        `;

      const result = await bridge.evaluate(code);
      return {
        success: true,
        data: result,
      };
    }

    // Get full page DOM
    const domResult = await bridge.getDom();
    return {
      success: true,
      data: {
        html: domResult.html.slice(0, 50000), // Limit size
        truncated: domResult.html.length > 50000,
        fullLength: domResult.html.length,
      },
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      error: `Failed to inspect DOM: ${message}`,
    };
  }
}

/**
 * Click on an element or coordinates.
 */
async function clickElement(options: {
  selector?: string;
  x?: number;
  y?: number;
  button?: 'left' | 'right' | 'middle';
  doubleClick?: boolean;
}): Promise<ToolResult> {
  const bridge = getTauriBridge();

  try {
    if (options.selector) {
      // Click by selector
      if (options.doubleClick) {
        // For double-click, we need to click twice
        await bridge.clickElement(options.selector);
        await new Promise((r) => setTimeout(r, 50));
        await bridge.clickElement(options.selector);
      } else {
        await bridge.clickElement(options.selector);
      }

      return {
        success: true,
        data: {
          clicked: true,
          selector: options.selector,
          button: options.button ?? 'left',
          doubleClick: options.doubleClick ?? false,
        },
      };
    }

    if (options.x !== undefined && options.y !== undefined) {
      // Click by coordinates
      const button = options.button ?? 'left';
      if (options.doubleClick) {
        await bridge.click(options.x, options.y, button);
        await new Promise((r) => setTimeout(r, 50));
        await bridge.click(options.x, options.y, button);
      } else {
        await bridge.click(options.x, options.y, button);
      }

      return {
        success: true,
        data: {
          clicked: true,
          x: options.x,
          y: options.y,
          button,
          doubleClick: options.doubleClick ?? false,
        },
      };
    }

    return {
      success: false,
      error: 'Either selector or (x, y) coordinates must be provided',
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      error: `Failed to click: ${message}`,
    };
  }
}

/**
 * Type text into an element or at current focus.
 */
async function typeText(options: {
  text: string;
  selector?: string;
  delayMs?: number;
  clearFirst?: boolean;
}): Promise<ToolResult> {
  const bridge = getTauriBridge();

  try {
    if (options.selector) {
      // Clear field first if requested
      if (options.clearFirst) {
        await bridge.evaluate(
          `document.querySelector(${JSON.stringify(options.selector)}).value = ''`
        );
      }

      // Type into specific element
      await bridge.typeIntoElement(options.selector, options.text);

      return {
        success: true,
        data: {
          typed: true,
          text: options.text,
          selector: options.selector,
          charCount: options.text.length,
        },
      };
    }

    // Type at current focus
    await bridge.typeText({
      text: options.text,
      delay_ms: options.delayMs ?? 20,
    });

    return {
      success: true,
      data: {
        typed: true,
        text: options.text,
        charCount: options.text.length,
      },
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      error: `Failed to type text: ${message}`,
    };
  }
}

/**
 * Press a keyboard key or shortcut.
 */
async function pressKey(options: { key: string }): Promise<ToolResult> {
  const bridge = getTauriBridge();

  try {
    // Parse key combination (e.g., "Ctrl+A", "Cmd+S", "Shift+Tab")
    const keyParts = options.key.split('+');
    const mainKey = keyParts[keyParts.length - 1];
    const modifiers = keyParts.slice(0, -1).map((m) => m.toLowerCase());

    // Build JavaScript to simulate key press
    const keyEventOptions: Record<string, boolean | string> = {
      key: mainKey,
      bubbles: true,
      cancelable: true,
    };

    if (modifiers.includes('ctrl') || modifiers.includes('control')) {
      keyEventOptions.ctrlKey = true;
    }
    if (modifiers.includes('shift')) {
      keyEventOptions.shiftKey = true;
    }
    if (modifiers.includes('alt') || modifiers.includes('option')) {
      keyEventOptions.altKey = true;
    }
    if (modifiers.includes('cmd') || modifiers.includes('meta') || modifiers.includes('command')) {
      keyEventOptions.metaKey = true;
    }

    const code = `
      (function() {
        const activeEl = document.activeElement || document.body;
        const eventOptions = ${JSON.stringify(keyEventOptions)};

        const keydownEvent = new KeyboardEvent('keydown', eventOptions);
        const keypressEvent = new KeyboardEvent('keypress', eventOptions);
        const keyupEvent = new KeyboardEvent('keyup', eventOptions);

        activeEl.dispatchEvent(keydownEvent);
        activeEl.dispatchEvent(keypressEvent);
        activeEl.dispatchEvent(keyupEvent);

        return { dispatched: true, target: activeEl.tagName };
      })()
    `;

    const result = await bridge.evaluate(code);

    return {
      success: true,
      data: {
        pressed: true,
        key: options.key,
        ...((result as Record<string, unknown>) ?? {}),
      },
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      error: `Failed to press key: ${message}`,
    };
  }
}

/**
 * Execute JavaScript in the webview.
 */
async function evaluateJs(options: {
  code: string;
  timeoutMs?: number;
}): Promise<ToolResult> {
  const bridge = getTauriBridge();

  try {
    const result = await bridge.evaluate(options.code, 'main', options.timeoutMs ?? 5000);

    return {
      success: true,
      data: {
        result,
        type: typeof result,
      },
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      error: `Failed to evaluate JavaScript: ${message}`,
    };
  }
}

/**
 * Get browser console messages.
 */
async function getConsoleMessages(options: {
  level?: string;
  limit?: number;
}): Promise<ToolResult> {
  const bridge = getTauriBridge();
  const limit = options.limit ?? 50;
  const level = options.level ?? 'all';

  try {
    // First, inject console capture if not already present
    await bridge.evaluate(`
      (function() {
        if (window.__mcpConsoleCapture) return;
        window.__mcpConsoleCapture = true;
        window.__mcpConsoleLogs = window.__mcpConsoleLogs || [];

        const maxLogs = 200;
        const originalConsole = {
          log: console.log,
          info: console.info,
          warn: console.warn,
          error: console.error,
          debug: console.debug,
        };

        function captureLog(level, args) {
          const entry = {
            level,
            message: Array.from(args).map(a => {
              try {
                return typeof a === 'object' ? JSON.stringify(a) : String(a);
              } catch {
                return String(a);
              }
            }).join(' '),
            timestamp: new Date().toISOString(),
          };
          window.__mcpConsoleLogs.push(entry);
          if (window.__mcpConsoleLogs.length > maxLogs) {
            window.__mcpConsoleLogs.shift();
          }
        }

        console.log = function(...args) { captureLog('log', args); originalConsole.log.apply(console, args); };
        console.info = function(...args) { captureLog('info', args); originalConsole.info.apply(console, args); };
        console.warn = function(...args) { captureLog('warn', args); originalConsole.warn.apply(console, args); };
        console.error = function(...args) { captureLog('error', args); originalConsole.error.apply(console, args); };
        console.debug = function(...args) { captureLog('debug', args); originalConsole.debug.apply(console, args); };
      })()
    `);

    // Get the captured logs
    const logs = await bridge.evaluate<
      Array<{ level: string; message: string; timestamp: string }>
    >(`
      (function() {
        const logs = window.__mcpConsoleLogs || [];
        const level = ${JSON.stringify(level)};
        const limit = ${limit};

        let filtered = logs;
        if (level !== 'all') {
          filtered = logs.filter(l => l.level === level);
        }

        return filtered.slice(-limit);
      })()
    `);

    return {
      success: true,
      data: {
        messages: logs,
        count: logs.length,
        filter: level,
      },
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      error: `Failed to get console messages: ${message}`,
    };
  }
}

/**
 * Wait for an element to appear in the DOM.
 */
async function waitForElement(options: {
  selector: string;
  timeoutMs?: number;
  visible?: boolean;
}): Promise<ToolResult> {
  const bridge = getTauriBridge();
  const timeout = options.timeoutMs ?? 10000;
  const checkVisible = options.visible ?? true;
  const startTime = Date.now();

  try {
    // Poll for element
    while (Date.now() - startTime < timeout) {
      const code = checkVisible
        ? `
          (function() {
            const el = document.querySelector(${JSON.stringify(options.selector)});
            if (!el) return { found: false };
            const rect = el.getBoundingClientRect();
            const styles = window.getComputedStyle(el);
            const visible = rect.width > 0 && rect.height > 0 &&
                           styles.display !== 'none' &&
                           styles.visibility !== 'hidden' &&
                           styles.opacity !== '0';
            return { found: true, visible, rect: { x: rect.x, y: rect.y, width: rect.width, height: rect.height } };
          })()
        `
        : `
          (function() {
            const el = document.querySelector(${JSON.stringify(options.selector)});
            if (!el) return { found: false };
            const rect = el.getBoundingClientRect();
            return { found: true, visible: true, rect: { x: rect.x, y: rect.y, width: rect.width, height: rect.height } };
          })()
        `;

      const result = (await bridge.evaluate(code)) as {
        found: boolean;
        visible?: boolean;
        rect?: { x: number; y: number; width: number; height: number };
      };

      if (result.found && (checkVisible ? result.visible : true)) {
        return {
          success: true,
          data: {
            found: true,
            selector: options.selector,
            visible: result.visible,
            boundingRect: result.rect,
            waitedMs: Date.now() - startTime,
          },
        };
      }

      // Wait 100ms before next check
      await new Promise((r) => setTimeout(r, 100));
    }

    return {
      success: false,
      error: `Element not found within ${timeout}ms: ${options.selector}`,
      data: {
        selector: options.selector,
        timeout,
        checkVisible,
      },
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      error: `Failed to wait for element: ${message}`,
    };
  }
}
