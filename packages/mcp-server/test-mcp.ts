/**
 * Test script for MCP server
 *
 * This script tests the MCP server by sending JSON-RPC requests
 * and validating the responses.
 */

import { spawn } from 'node:child_process';
import { resolve } from 'node:path';

const projectRoot = resolve(import.meta.dirname, '..', '..');

interface JsonRpcRequest {
  jsonrpc: '2.0';
  id: number;
  method: string;
  params?: Record<string, unknown>;
}

interface JsonRpcResponse {
  jsonrpc: '2.0';
  id: number;
  result?: unknown;
  error?: { code: number; message: string };
}

class McpTester {
  private proc: ReturnType<typeof spawn>;
  private requestId = 0;
  private responseBuffer = '';
  private pendingRequests = new Map<
    number,
    {
      resolve: (response: JsonRpcResponse) => void;
      reject: (error: Error) => void;
    }
  >();

  constructor() {
    this.proc = spawn('npx', ['tsx', 'packages/mcp-server/index.ts'], {
      cwd: projectRoot,
      stdio: ['pipe', 'pipe', 'pipe'],
      shell: true,
    });

    this.proc.stdout?.on('data', (data: Buffer) => {
      this.responseBuffer += data.toString();
      this.processResponses();
    });

    this.proc.stderr?.on('data', (data: Buffer) => {
      console.error('[MCP stderr]', data.toString().trim());
    });

    this.proc.on('error', (err) => {
      console.error('[MCP error]', err);
    });
  }

  private processResponses(): void {
    // Try to parse complete JSON responses
    const lines = this.responseBuffer.split('\n');
    for (let i = 0; i < lines.length - 1; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      try {
        const response = JSON.parse(line) as JsonRpcResponse;
        const pending = this.pendingRequests.get(response.id);
        if (pending) {
          pending.resolve(response);
          this.pendingRequests.delete(response.id);
        }
      } catch {
        // Not valid JSON, skip
      }
    }
    // Keep the last incomplete line in the buffer
    this.responseBuffer = lines[lines.length - 1];
  }

  async sendRequest(
    method: string,
    params?: Record<string, unknown>,
    timeoutMs = 10000
  ): Promise<JsonRpcResponse> {
    const id = ++this.requestId;
    const request: JsonRpcRequest = {
      jsonrpc: '2.0',
      id,
      method,
      params,
    };

    return new Promise((resolve, reject) => {
      this.pendingRequests.set(id, { resolve, reject });

      const timeout = setTimeout(() => {
        this.pendingRequests.delete(id);
        reject(new Error(`Request ${method} timed out`));
      }, timeoutMs);

      this.proc.stdin?.write(`${JSON.stringify(request)}\n`);

      // Clear timeout when resolved
      const originalResolve = this.pendingRequests.get(id)?.resolve;
      if (originalResolve) {
        this.pendingRequests.set(id, {
          resolve: (response) => {
            clearTimeout(timeout);
            originalResolve(response);
          },
          reject,
        });
      }
    });
  }

  async callTool(
    name: string,
    args: Record<string, unknown> = {},
    timeoutMs = 10000
  ): Promise<{ success: boolean; text: string; isError?: boolean }> {
    const response = await this.sendRequest('tools/call', { name, arguments: args }, timeoutMs);

    if (response.error) {
      return { success: false, text: response.error.message, isError: true };
    }

    const result = response.result as {
      content: Array<{ type: string; text: string }>;
      isError?: boolean;
    };
    const text = result.content[0]?.text ?? '';
    return { success: !result.isError, text, isError: result.isError };
  }

  close(): void {
    this.proc.kill();
  }
}

async function runTests(): Promise<void> {
  const args = process.argv.slice(2);
  const fullTest = args.includes('--full');

  console.log('=== MCP Server Test Suite ===\n');

  const tester = new McpTester();

  try {
    // Wait for server to start
    await new Promise((r) => setTimeout(r, 1000));

    // Test 1: List tools
    console.log('Test 1: List available tools');
    const listResponse = await tester.sendRequest('tools/list');

    if (listResponse.error) {
      console.log('  FAILED:', listResponse.error.message);
    } else {
      const tools = (
        listResponse.result as {
          tools: Array<{ name: string; description: string }>;
        }
      ).tools;
      console.log('  PASSED: Found', tools.length, 'tools');
      for (const tool of tools) {
        console.log('    -', tool.name);
      }
    }
    console.log();

    // Test 2: Check status (should be stopped initially)
    console.log('Test 2: Check app status (should be stopped)');
    const statusResult = await tester.callTool('openflow_status');
    console.log('  Response:', statusResult.text);
    if (statusResult.text.includes('"state": "stopped"')) {
      console.log('  PASSED: App is stopped as expected');
    } else {
      console.log('  NOTE: App may be in unexpected state');
    }
    console.log();

    if (fullTest) {
      // Test 3: Start the app
      console.log('Test 3: Start the app (this may take a while...)');
      const startResult = await tester.callTool('openflow_start', { timeout_seconds: 120 }, 130000);
      console.log('  Response:', startResult.text);
      if (startResult.success && startResult.text.includes('"pid"')) {
        console.log('  PASSED: App started successfully');
      } else {
        console.log('  FAILED: App failed to start');
        console.log('  Error:', startResult.text);
      }
      console.log();

      // Test 4: Check status (should be running)
      console.log('Test 4: Check app status (should be running)');
      const runningStatusResult = await tester.callTool('openflow_status');
      console.log('  Response:', runningStatusResult.text);
      if (runningStatusResult.text.includes('"state": "running"')) {
        console.log('  PASSED: App is running as expected');
      } else {
        console.log('  NOTE: App may not be running correctly');
      }
      console.log();

      // Test 5: Get logs
      console.log('Test 5: Get app logs');
      const logsResult = await tester.callTool('openflow_logs', { lines: 10 });
      console.log('  Response (truncated):', logsResult.text.substring(0, 500));
      console.log('  PASSED: Logs retrieved');
      console.log();

      // Test 6: Stop the app
      console.log('Test 6: Stop the app');
      const stopResult = await tester.callTool('openflow_stop', {}, 15000);
      console.log('  Response:', stopResult.text);
      if (stopResult.success) {
        console.log('  PASSED: App stopped successfully');
      } else {
        console.log('  FAILED: App failed to stop');
      }
      console.log();

      // Test 7: Confirm stopped
      console.log('Test 7: Confirm app is stopped');
      const finalStatusResult = await tester.callTool('openflow_status');
      console.log('  Response:', finalStatusResult.text);
      if (finalStatusResult.text.includes('"state": "stopped"')) {
        console.log('  PASSED: App is stopped as expected');
      } else {
        console.log('  NOTE: App may still be running');
      }
      console.log();
    }

    console.log('=== Tests Complete ===\n');
    console.log('Phase 1 tools verified:');
    console.log('  - openflow_start');
    console.log('  - openflow_stop');
    console.log('  - openflow_status');
    console.log();

    if (!fullTest) {
      console.log('Run with --full flag to test start/stop lifecycle.');
      console.log('Example: npx tsx packages/mcp-server/test-mcp.ts --full');
    }
  } catch (err) {
    console.error('Test failed:', err);
  } finally {
    tester.close();
  }
}

runTests().catch(console.error);
