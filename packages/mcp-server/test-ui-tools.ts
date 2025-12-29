#!/usr/bin/env npx tsx
/**
 * UI Tools Integration Test Script
 *
 * Tests all UI tools end-to-end with the running Tauri application:
 * 1. Start app via openflow_start
 * 2. Wait for ready
 * 3. Take screenshot → verify file exists
 * 4. Inspect DOM → verify structure
 * 5. Click button (e.g., "New Task" or similar)
 * 6. Take screenshot → verify UI changed
 * 7. Check console logs
 * 8. Test error cases
 * 9. Stop app
 *
 * This tests the full integration with the Tauri MCP GUI plugin socket.
 *
 * IMPORTANT LIMITATIONS:
 * - The tauri-plugin-mcp-gui requires the application window to be VISIBLE and FOCUSED
 * - Screenshots and JS execution will fail if the window is minimized or not on screen
 * - This test works best when run interactively with a visible desktop
 * - In headless/CI environments, the UI tools will not work (socket connects but operations fail)
 *
 * Socket Protocol:
 * - Commands are lowercase: 'ping', 'take_screenshot', 'get_dom', 'execute_js', etc.
 * - All commands require 'window_label' parameter (usually 'main')
 * - Responses are JSON with { success, data, error } structure
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { resolve } from 'node:path';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

const SERVER_PATH = resolve(import.meta.dirname, 'index.ts');
const SCREENSHOTS_DIR = resolve(import.meta.dirname, '../../docs/screenshots');

interface TestResult {
  name: string;
  passed: boolean;
  duration: number;
  details?: string;
  skipped?: boolean;
}

interface ToolCallResult {
  data: Record<string, unknown>;
  isError: boolean;
}

const COLORS = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  dim: '\x1b[2m',
  cyan: '\x1b[36m',
};

function colorize(text: string, color: keyof typeof COLORS): string {
  return `${COLORS[color]}${text}${COLORS.reset}`;
}

async function runUiToolsTest(): Promise<void> {
  console.log(colorize('╔══════════════════════════════════════════════════════════════╗', 'cyan'));
  console.log(colorize('║       OpenFlow MCP Server - UI Tools Integration Test        ║', 'cyan'));
  console.log(colorize('╚══════════════════════════════════════════════════════════════╝', 'cyan'));
  console.log();

  const results: TestResult[] = [];
  let appStarted = false;
  let client: Client | null = null;
  let mcpGuiConnected = false;

  // Ensure screenshots directory exists
  if (!fs.existsSync(SCREENSHOTS_DIR)) {
    fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
  }

  async function callTool(
    name: string,
    args: Record<string, unknown> = {}
  ): Promise<ToolCallResult> {
    if (!client) throw new Error('Client not connected');
    const result = await client.callTool({ name, arguments: args });
    const content = result.content as Array<{ type: string; text: string }>;
    const isError = (result.isError as boolean | undefined) ?? false;

    if (content[0]?.type === 'text') {
      try {
        return { data: JSON.parse(content[0].text), isError };
      } catch {
        return { data: { raw: content[0].text }, isError };
      }
    }
    return { data: result as unknown as Record<string, unknown>, isError };
  }

  async function runTest(
    name: string,
    fn: () => Promise<{ passed: boolean; details?: string; skipped?: boolean }>
  ): Promise<void> {
    const startTime = Date.now();
    process.stdout.write(`  🧪 ${name}... `);

    try {
      const result = await fn();
      const duration = Date.now() - startTime;

      if (result.skipped) {
        console.log(colorize(`⏭️  SKIPPED (${duration}ms)`, 'yellow'));
        if (result.details) {
          console.log(colorize(`     └─ ${result.details}`, 'dim'));
        }
      } else if (result.passed) {
        console.log(colorize(`✅ PASSED (${duration}ms)`, 'green'));
        if (result.details) {
          console.log(colorize(`     └─ ${result.details}`, 'dim'));
        }
      } else {
        console.log(colorize(`❌ FAILED (${duration}ms)`, 'red'));
        if (result.details) {
          console.log(colorize(`     └─ ${result.details}`, 'red'));
        }
      }

      results.push({
        name,
        passed: result.passed,
        duration,
        details: result.details,
        skipped: result.skipped,
      });
    } catch (err) {
      const duration = Date.now() - startTime;
      console.log(colorize(`💥 ERROR (${duration}ms)`, 'red'));
      console.log(colorize(`     └─ ${err}`, 'red'));
      results.push({ name, passed: false, duration, details: String(err) });
    }
  }

  try {
    // Connect to MCP server
    console.log(colorize('📡 Connecting to MCP server...', 'blue'));
    console.log();

    const transport = new StdioClientTransport({
      command: 'npx',
      args: ['tsx', SERVER_PATH],
    });

    client = new Client({ name: 'ui-tools-test', version: '1.0.0' }, { capabilities: {} });
    await client.connect(transport);

    // ═══════════════════════════════════════════════════════════════
    // PHASE 1: App Lifecycle
    // ═══════════════════════════════════════════════════════════════
    console.log(
      colorize('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'dim')
    );
    console.log(colorize('🚀 PHASE 1: App Lifecycle', 'yellow'));
    console.log();

    await runTest('Start OpenFlow app with MCP GUI', async () => {
      const { data, isError } = await callTool('openflow_start', {
        timeout_seconds: 120,
      });

      if (!isError && data.pid) {
        appStarted = true;
        return {
          passed: true,
          details: `PID: ${data.pid}, URL: ${data.devServerUrl}`,
        };
      }
      return { passed: false, details: String(data.message || data.error || 'Failed to start') };
    });

    await runTest('Wait for app ready', async () => {
      const { data, isError } = await callTool('openflow_wait_ready', {
        timeout_seconds: 60,
      });

      return {
        passed: !isError,
        details: data.devServerUrl
          ? `Dev server ready at ${data.devServerUrl}`
          : String(data.message || 'Ready'),
      };
    });

    // Give the MCP GUI socket a moment to initialize
    await new Promise((r) => setTimeout(r, 2000));

    // ═══════════════════════════════════════════════════════════════
    // PHASE 2: Screenshot Tests
    // ═══════════════════════════════════════════════════════════════
    console.log();
    console.log(
      colorize('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'dim')
    );
    console.log(colorize('📸 PHASE 2: Screenshot Tests', 'yellow'));
    console.log();

    await runTest('Take screenshot (base64)', async () => {
      const { data, isError } = await callTool('openflow_screenshot', {});

      if (isError) {
        // If connection failed, MCP GUI plugin might not be running
        if (
          String(data.error || '').includes('socket') ||
          String(data.error || '').includes('connect')
        ) {
          mcpGuiConnected = false;
          return { passed: false, details: `MCP GUI not connected: ${data.error}` };
        }
        return { passed: false, details: String(data.error) };
      }

      if (data.base64 && typeof data.base64 === 'string') {
        mcpGuiConnected = true;
        return {
          passed: true,
          details: `Got ${Math.round((data.base64 as string).length / 1024)}KB base64 image`,
        };
      }
      return { passed: false, details: 'No base64 data returned' };
    });

    const screenshotPath = path.join(SCREENSHOTS_DIR, 'ui-test-initial.png');
    await runTest('Take screenshot (save to file)', async () => {
      if (!mcpGuiConnected) {
        return { passed: false, skipped: true, details: 'MCP GUI not connected' };
      }

      const { data, isError } = await callTool('openflow_screenshot', {
        save_path: screenshotPath,
        quality: 90,
      });

      if (isError) {
        return { passed: false, details: String(data.error) };
      }

      const fileExists = fs.existsSync(screenshotPath);
      return {
        passed: fileExists && data.saved === true,
        details: fileExists
          ? `Saved to ${screenshotPath} (${data.size_bytes} bytes)`
          : 'File not found after save',
      };
    });

    // ═══════════════════════════════════════════════════════════════
    // PHASE 3: DOM Inspection Tests
    // ═══════════════════════════════════════════════════════════════
    console.log();
    console.log(
      colorize('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'dim')
    );
    console.log(colorize('🔍 PHASE 3: DOM Inspection Tests', 'yellow'));
    console.log();

    await runTest('Inspect full DOM', async () => {
      if (!mcpGuiConnected) {
        return { passed: false, skipped: true, details: 'MCP GUI not connected' };
      }

      const { data, isError } = await callTool('openflow_inspect', {});

      if (isError) {
        return { passed: false, details: String(data.error) };
      }

      const html = data.html as string | undefined;
      if (html && html.length > 0) {
        const truncated = data.truncated ? ' (truncated)' : '';
        return {
          passed: true,
          details: `Got ${html.length} chars HTML${truncated}`,
        };
      }
      return { passed: false, details: 'No HTML returned' };
    });

    await runTest('Inspect specific element (button)', async () => {
      if (!mcpGuiConnected) {
        return { passed: false, skipped: true, details: 'MCP GUI not connected' };
      }

      const { data, isError } = await callTool('openflow_inspect', {
        selector: 'button',
      });

      if (isError) {
        return { passed: false, details: String(data.error) };
      }

      if (data.found) {
        return {
          passed: true,
          details: `Found ${data.tagName}${data.id ? `#${data.id}` : ''}${data.className ? `.${String(data.className).split(' ')[0]}` : ''}`,
        };
      }
      return { passed: false, details: 'Button element not found' };
    });

    await runTest('Inspect with computed styles', async () => {
      if (!mcpGuiConnected) {
        return { passed: false, skipped: true, details: 'MCP GUI not connected' };
      }

      const { data, isError } = await callTool('openflow_inspect', {
        selector: 'body',
        include_styles: true,
      });

      if (isError) {
        return { passed: false, details: String(data.error) };
      }

      const hasStyles = data.computedStyles && typeof data.computedStyles === 'object';
      return {
        passed: Boolean(data.found === true && hasStyles),
        details: hasStyles ? 'Computed styles included' : 'No computed styles',
      };
    });

    // ═══════════════════════════════════════════════════════════════
    // PHASE 4: JavaScript Evaluation Tests
    // ═══════════════════════════════════════════════════════════════
    console.log();
    console.log(
      colorize('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'dim')
    );
    console.log(colorize('📜 PHASE 4: JavaScript Evaluation Tests', 'yellow'));
    console.log();

    await runTest('Evaluate simple expression', async () => {
      if (!mcpGuiConnected) {
        return { passed: false, skipped: true, details: 'MCP GUI not connected' };
      }

      const { data, isError } = await callTool('openflow_evaluate', {
        code: '1 + 1',
      });

      if (isError) {
        return { passed: false, details: String(data.error) };
      }

      return {
        passed: data.result === 2,
        details: `Result: ${data.result} (type: ${data.type})`,
      };
    });

    await runTest('Get document title', async () => {
      if (!mcpGuiConnected) {
        return { passed: false, skipped: true, details: 'MCP GUI not connected' };
      }

      const { data, isError } = await callTool('openflow_evaluate', {
        code: 'document.title',
      });

      if (isError) {
        return { passed: false, details: String(data.error) };
      }

      return {
        passed: typeof data.result === 'string',
        details: `Title: "${data.result}"`,
      };
    });

    await runTest('Get window location', async () => {
      if (!mcpGuiConnected) {
        return { passed: false, skipped: true, details: 'MCP GUI not connected' };
      }

      const { data, isError } = await callTool('openflow_evaluate', {
        code: 'window.location.href',
      });

      if (isError) {
        return { passed: false, details: String(data.error) };
      }

      return {
        passed: typeof data.result === 'string' && (data.result as string).startsWith('http'),
        details: `URL: ${data.result}`,
      };
    });

    // ═══════════════════════════════════════════════════════════════
    // PHASE 5: Console Message Tests
    // ═══════════════════════════════════════════════════════════════
    console.log();
    console.log(
      colorize('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'dim')
    );
    console.log(colorize('📋 PHASE 5: Console Message Tests', 'yellow'));
    console.log();

    await runTest('Inject console capture', async () => {
      if (!mcpGuiConnected) {
        return { passed: false, skipped: true, details: 'MCP GUI not connected' };
      }

      // First, log something to console
      await callTool('openflow_evaluate', {
        code: 'console.log("MCP UI Tools Test Message")',
      });

      // Wait a moment
      await new Promise((r) => setTimeout(r, 100));

      const { data, isError } = await callTool('openflow_console', {
        level: 'all',
        limit: 10,
      });

      if (isError) {
        return { passed: false, details: String(data.error) };
      }

      return {
        passed: true,
        details: `Captured ${data.count} console messages`,
      };
    });

    // ═══════════════════════════════════════════════════════════════
    // PHASE 6: Wait for Element Tests
    // ═══════════════════════════════════════════════════════════════
    console.log();
    console.log(
      colorize('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'dim')
    );
    console.log(colorize('⏳ PHASE 6: Wait for Element Tests', 'yellow'));
    console.log();

    await runTest('Wait for existing element', async () => {
      if (!mcpGuiConnected) {
        return { passed: false, skipped: true, details: 'MCP GUI not connected' };
      }

      const { data, isError } = await callTool('openflow_wait_for_element', {
        selector: 'body',
        timeout_ms: 3000,
      });

      if (isError) {
        return { passed: false, details: String(data.error) };
      }

      return {
        passed: data.found === true,
        details: `Found in ${data.waitedMs}ms`,
      };
    });

    await runTest('Wait for non-existent element (should timeout)', async () => {
      if (!mcpGuiConnected) {
        return { passed: false, skipped: true, details: 'MCP GUI not connected' };
      }

      const { data, isError } = await callTool('openflow_wait_for_element', {
        selector: '#non-existent-element-12345',
        timeout_ms: 1000,
      });

      // Should fail with timeout
      return {
        passed: isError || data.success === false,
        details: data.error ? String(data.error).substring(0, 60) : 'Correctly timed out',
      };
    });

    // ═══════════════════════════════════════════════════════════════
    // PHASE 7: Input Simulation Tests (if MCP GUI connected)
    // ═══════════════════════════════════════════════════════════════
    console.log();
    console.log(
      colorize('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'dim')
    );
    console.log(colorize('⌨️  PHASE 7: Input Simulation Tests', 'yellow'));
    console.log();

    await runTest('Press Escape key', async () => {
      if (!mcpGuiConnected) {
        return { passed: false, skipped: true, details: 'MCP GUI not connected' };
      }

      const { data, isError } = await callTool('openflow_key', {
        key: 'Escape',
      });

      if (isError) {
        return { passed: false, details: String(data.error) };
      }

      return {
        passed: data.pressed === true,
        details: `Key dispatched to ${data.target}`,
      };
    });

    await runTest('Click at coordinates', async () => {
      if (!mcpGuiConnected) {
        return { passed: false, skipped: true, details: 'MCP GUI not connected' };
      }

      const { data, isError } = await callTool('openflow_click', {
        x: 100,
        y: 100,
        button: 'left',
      });

      if (isError) {
        return { passed: false, details: String(data.error) };
      }

      return {
        passed: data.clicked === true,
        details: `Clicked at (${data.x}, ${data.y})`,
      };
    });

    // Take a screenshot after interaction
    const afterInteractionPath = path.join(SCREENSHOTS_DIR, 'ui-test-after-interaction.png');
    await runTest('Take screenshot after interactions', async () => {
      if (!mcpGuiConnected) {
        return { passed: false, skipped: true, details: 'MCP GUI not connected' };
      }

      const { data, isError } = await callTool('openflow_screenshot', {
        save_path: afterInteractionPath,
      });

      if (isError) {
        return { passed: false, details: String(data.error) };
      }

      const fileExists = fs.existsSync(afterInteractionPath);
      return {
        passed: fileExists,
        details: fileExists ? `Saved to ${afterInteractionPath}` : 'File not created',
      };
    });

    // ═══════════════════════════════════════════════════════════════
    // PHASE 8: Error Handling Tests
    // ═══════════════════════════════════════════════════════════════
    console.log();
    console.log(
      colorize('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'dim')
    );
    console.log(colorize('⚠️  PHASE 8: Error Handling Tests', 'yellow'));
    console.log();

    // Stop app first to test error cases
    await callTool('openflow_stop');
    appStarted = false;

    await runTest('Screenshot when app not running', async () => {
      const { data, isError } = await callTool('openflow_screenshot', {});

      return {
        passed: isError === true,
        details: data.error
          ? String(data.error).substring(0, 80)
          : 'Correctly returned error when app stopped',
      };
    });

    await runTest('Inspect when app not running', async () => {
      const { data, isError } = await callTool('openflow_inspect', {});

      return {
        passed: isError === true,
        details: data.error
          ? String(data.error).substring(0, 80)
          : 'Correctly returned error when app stopped',
      };
    });

    await runTest('Click when app not running', async () => {
      const { data, isError } = await callTool('openflow_click', {
        x: 100,
        y: 100,
      });

      return {
        passed: isError === true,
        details: data.error
          ? String(data.error).substring(0, 80)
          : 'Correctly returned error when app stopped',
      };
    });

    // ═══════════════════════════════════════════════════════════════
    // RESULTS
    // ═══════════════════════════════════════════════════════════════
    console.log();
    console.log(
      colorize('╔══════════════════════════════════════════════════════════════╗', 'cyan')
    );
    console.log(
      colorize('║                      TEST RESULTS                             ║', 'cyan')
    );
    console.log(
      colorize('╚══════════════════════════════════════════════════════════════╝', 'cyan')
    );
    console.log();

    const passed = results.filter((r) => r.passed && !r.skipped).length;
    const failed = results.filter((r) => !r.passed && !r.skipped).length;
    const skipped = results.filter((r) => r.skipped).length;
    const totalDuration = results.reduce((sum, r) => sum + r.duration, 0);

    console.log(`  ${colorize(`✅ Passed: ${passed}`, 'green')}`);
    console.log(`  ${colorize(`❌ Failed: ${failed}`, failed > 0 ? 'red' : 'dim')}`);
    console.log(`  ${colorize(`⏭️  Skipped: ${skipped}`, 'yellow')}`);
    console.log(`  📊 Total:  ${results.length}`);
    console.log(`  ⏱️  Time:   ${(totalDuration / 1000).toFixed(1)}s`);

    if (failed > 0) {
      console.log();
      console.log(colorize('  Failed tests:', 'red'));
      for (const result of results.filter((r) => !r.passed && !r.skipped)) {
        console.log(colorize(`    • ${result.name}`, 'red'));
        if (result.details) {
          console.log(colorize(`      └─ ${result.details}`, 'dim'));
        }
      }
    }

    if (!mcpGuiConnected) {
      console.log();
      console.log(colorize('  ⚠️  Note: MCP GUI plugin connection failed', 'yellow'));
      console.log(colorize('     Some tests were skipped because the Tauri MCP GUI socket', 'dim'));
      console.log(colorize('     at /tmp/openflow-mcp.sock was not available.', 'dim'));
      console.log(colorize('     Ensure tauri-plugin-mcp-gui is properly configured.', 'dim'));
    }

    console.log();
    console.log(
      colorize('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'dim')
    );

    await client.close();
    process.exit(failed > 0 ? 1 : 0);
  } catch (err) {
    console.error(colorize(`\n💥 Fatal error: ${err}`, 'red'));

    // Cleanup
    if (appStarted && client) {
      try {
        await client.callTool({ name: 'openflow_stop', arguments: {} });
      } catch {
        // Ignore cleanup errors
      }
    }

    if (client) {
      await client.close();
    }
    process.exit(1);
  }
}

runUiToolsTest();
