#!/usr/bin/env npx tsx
/**
 * Test script for Enhanced Lifecycle Tools (Phase 3)
 *
 * Tests:
 * - openflow_restart: Restart the app
 * - openflow_wait_ready: Wait for app to be ready
 * - openflow_logs: Enhanced log filtering
 */

import { spawn } from 'node:child_process';
import { resolve } from 'node:path';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

const SERVER_PATH = resolve(import.meta.dirname, 'index.ts');

async function runTests(): Promise<void> {
  console.log('=== Enhanced Lifecycle Tools Test (Phase 3) ===\n');

  // Start MCP server
  const serverProcess = spawn('npx', ['tsx', SERVER_PATH], {
    stdio: ['pipe', 'pipe', 'pipe'],
    shell: true,
  });

  const transport = new StdioClientTransport({
    command: 'npx',
    args: ['tsx', SERVER_PATH],
  });

  const client = new Client({ name: 'test-client', version: '1.0.0' }, { capabilities: {} });
  await client.connect(transport);

  let passed = 0;
  let failed = 0;

  async function test(name: string, fn: () => Promise<boolean>): Promise<void> {
    process.stdout.write(`Test: ${name}... `);
    try {
      const result = await fn();
      if (result) {
        console.log('PASSED');
        passed++;
      } else {
        console.log('FAILED');
        failed++;
      }
    } catch (err) {
      console.log(`ERROR: ${err}`);
      failed++;
    }
  }

  async function callTool(name: string, args: Record<string, unknown> = {}): Promise<unknown> {
    const result = await client.callTool({ name, arguments: args });
    const content = result.content as Array<{ type: string; text: string }>;
    if (content[0]?.type === 'text') {
      try {
        return JSON.parse(content[0].text);
      } catch {
        return content[0].text;
      }
    }
    return result;
  }

  try {
    // Test 1: openflow_wait_ready should fail when app is not running
    await test('openflow_wait_ready fails when app is stopped', async () => {
      const result = (await client.callTool({
        name: 'openflow_wait_ready',
        arguments: { timeout_seconds: 5 },
      })) as { isError?: boolean; content: Array<{ text: string }> };
      return result.isError === true && result.content[0].text.includes('App is not running');
    });

    // Test 2: Start app and verify
    await test('openflow_start works', async () => {
      const result = (await callTool('openflow_start', {
        timeout_seconds: 120,
      })) as { pid?: number };
      return typeof result.pid === 'number';
    });

    // Test 3: openflow_wait_ready should succeed when app is running
    await test('openflow_wait_ready succeeds when app is running', async () => {
      const result = (await callTool('openflow_wait_ready', {
        timeout_seconds: 60,
      })) as { message?: string; devServerUrl?: string };
      return result.message === 'App is ready' && typeof result.devServerUrl === 'string';
    });

    // Test 4: openflow_logs with default options
    await test('openflow_logs returns structured data', async () => {
      const result = (await callTool('openflow_logs')) as {
        appState?: string;
        logCount?: number;
        filter?: { level: string; limit: number };
        logs?: Array<{ timestamp: string; level: string; message: string }>;
      };
      return (
        result.appState === 'running' &&
        typeof result.logCount === 'number' &&
        result.filter?.level === 'info' &&
        Array.isArray(result.logs)
      );
    });

    // Test 5: openflow_logs with level filter
    await test('openflow_logs with level filter works', async () => {
      const result = (await callTool('openflow_logs', {
        level: 'warn',
        lines: 100,
      })) as { filter?: { level: string } };
      return result.filter?.level === 'warn';
    });

    // Test 6: openflow_restart cycles the app
    await test('openflow_restart cycles the app', async () => {
      const beforeStatus = (await callTool('openflow_status')) as { pid: number };
      const beforePid = beforeStatus.pid;

      const result = (await callTool('openflow_restart', {
        timeout_seconds: 120,
      })) as { pid?: number; message?: string };

      // Verify we got a new PID (app was restarted)
      return (
        typeof result.pid === 'number' &&
        result.message === 'App restarted successfully' &&
        result.pid !== beforePid
      );
    });

    // Test 7: openflow_status after restart shows running
    await test('Status shows running after restart', async () => {
      const result = (await callTool('openflow_status')) as { state?: string };
      return result.state === 'running';
    });

    // Cleanup: stop the app
    await test('openflow_stop cleans up', async () => {
      const result = (await callTool('openflow_stop')) as { message?: string };
      return result.message === 'App stopped successfully';
    });

    // Test 8: openflow_restart works when app is stopped
    await test('openflow_restart works when app is stopped', async () => {
      const result = (await callTool('openflow_restart', {
        timeout_seconds: 120,
      })) as { pid?: number; message?: string };
      return typeof result.pid === 'number' && result.message === 'App restarted successfully';
    });

    // Final cleanup
    await callTool('openflow_stop');

    console.log('\n=== Test Results ===');
    console.log(`Passed: ${passed}`);
    console.log(`Failed: ${failed}`);
    console.log(`Total: ${passed + failed}`);
  } finally {
    await client.close();
    serverProcess.kill();
  }

  process.exit(failed > 0 ? 1 : 0);
}

runTests().catch((err) => {
  console.error('Test error:', err);
  process.exit(1);
});
