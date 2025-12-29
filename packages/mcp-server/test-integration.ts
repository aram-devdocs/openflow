#!/usr/bin/env npx tsx
/**
 * Integration Test Script
 *
 * Tests the complete AI agent development workflow:
 * 1. Run typecheck → verify passes
 * 2. Run lint → verify passes
 * 3. Start app → verify runs
 * 4. Check status → verify running
 * 5. Get logs → verify captured
 * 6. Stop app → verify stopped
 *
 * This simulates how an AI agent would use the MCP server
 * to develop and test the OpenFlow application.
 */

import { resolve } from 'node:path';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

const SERVER_PATH = resolve(import.meta.dirname, 'index.ts');

interface TestResult {
  name: string;
  passed: boolean;
  duration: number;
  details?: string;
}

async function runIntegrationTests(): Promise<void> {
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║       OpenFlow MCP Server - Integration Test Suite           ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');

  const results: TestResult[] = [];
  let appStarted = false;

  // Connect to MCP server
  console.log('📡 Connecting to MCP server...\n');

  const transport = new StdioClientTransport({
    command: 'npx',
    args: ['tsx', SERVER_PATH],
  });

  const client = new Client({ name: 'integration-test', version: '1.0.0' }, { capabilities: {} });
  await client.connect(transport);

  async function callTool(
    name: string,
    args: Record<string, unknown> = {}
  ): Promise<{ data: unknown; isError: boolean }> {
    const result = await client.callTool({ name, arguments: args });
    const content = result.content as Array<{ type: string; text: string }>;
    const isError = (result.isError as boolean | undefined) ?? false;

    if (content[0]?.type === 'text') {
      try {
        return { data: JSON.parse(content[0].text), isError };
      } catch {
        return { data: content[0].text, isError };
      }
    }
    return { data: result, isError };
  }

  async function runTest(
    name: string,
    fn: () => Promise<{ passed: boolean; details?: string }>
  ): Promise<void> {
    const startTime = Date.now();
    process.stdout.write(`  🧪 ${name}... `);

    try {
      const result = await fn();
      const duration = Date.now() - startTime;

      if (result.passed) {
        console.log(`✅ PASSED (${duration}ms)`);
        if (result.details) {
          console.log(`     └─ ${result.details}`);
        }
      } else {
        console.log(`❌ FAILED (${duration}ms)`);
        if (result.details) {
          console.log(`     └─ ${result.details}`);
        }
      }

      results.push({ name, passed: result.passed, duration, details: result.details });
    } catch (err) {
      const duration = Date.now() - startTime;
      console.log(`💥 ERROR (${duration}ms)`);
      console.log(`     └─ ${err}`);
      results.push({ name, passed: false, duration, details: String(err) });
    }
  }

  try {
    // ═══════════════════════════════════════════════════════════════
    // PHASE 1: Development Tools (Code Quality)
    // ═══════════════════════════════════════════════════════════════
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📋 PHASE 1: Development Tools\n');

    await runTest('TypeScript type checking', async () => {
      const { data } = (await callTool('openflow_typecheck')) as {
        data: { success: boolean; errors: number; output: string };
      };

      const passed = data.success || data.errors === 0;
      return {
        passed,
        details: passed ? 'No type errors found' : `Found ${data.errors} type errors`,
      };
    });

    await runTest('Biome linting', async () => {
      const { data } = (await callTool('openflow_lint')) as {
        data: { success: boolean; errors: number; warnings: number };
      };

      const passed = data.success || data.errors === 0;
      return {
        passed,
        details: `${data.errors} errors, ${data.warnings} warnings`,
      };
    });

    await runTest('Rust cargo check', async () => {
      const { data } = (await callTool('openflow_rust_check')) as {
        data: { success: boolean; errors: number; warnings: number };
      };

      const passed = data.success || data.errors === 0;
      return {
        passed,
        details: `${data.errors} errors, ${data.warnings} warnings`,
      };
    });

    await runTest('TypeScript type generation', async () => {
      const { data } = (await callTool('openflow_generate_types')) as {
        data: { success: boolean; exitCode: number };
      };

      return {
        passed: data.success,
        details: data.success ? 'Types generated successfully' : `Exit code: ${data.exitCode}`,
      };
    });

    // ═══════════════════════════════════════════════════════════════
    // PHASE 2: Application Lifecycle
    // ═══════════════════════════════════════════════════════════════
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🚀 PHASE 2: Application Lifecycle\n');

    await runTest('Start OpenFlow app', async () => {
      const { data, isError } = (await callTool('openflow_start', {
        timeout_seconds: 120,
      })) as { data: { pid?: number; devServerUrl?: string; message?: string }; isError: boolean };

      if (!isError && data.pid) {
        appStarted = true;
        return {
          passed: true,
          details: `PID: ${data.pid}, URL: ${data.devServerUrl}`,
        };
      }
      return { passed: false, details: data.message || 'Failed to start' };
    });

    await runTest('Get app status (running)', async () => {
      const { data } = (await callTool('openflow_status')) as {
        data: { state: string; pid?: number; uptime?: number; devServerUrl?: string };
      };

      const passed = data.state === 'running';
      return {
        passed,
        details: passed
          ? `State: ${data.state}, PID: ${data.pid}, Uptime: ${Math.round((data.uptime ?? 0) / 1000)}s`
          : `State: ${data.state}`,
      };
    });

    await runTest('Wait for app ready', async () => {
      const { data, isError } = (await callTool('openflow_wait_ready', {
        timeout_seconds: 60,
      })) as { data: { message?: string; devServerUrl?: string }; isError: boolean };

      return {
        passed: !isError,
        details: data.devServerUrl ? `Dev server ready at ${data.devServerUrl}` : data.message,
      };
    });

    await runTest('Get application logs', async () => {
      const { data } = (await callTool('openflow_logs', {
        lines: 10,
        level: 'info',
      })) as { data: { appState: string; logCount: number; logs: unknown[] } };

      return {
        passed: data.appState === 'running',
        details: `Captured ${data.logCount} log entries`,
      };
    });

    await runTest('Restart app', async () => {
      const { data, isError } = (await callTool('openflow_restart', {
        timeout_seconds: 120,
      })) as { data: { pid?: number; message?: string }; isError: boolean };

      return {
        passed: !isError && data.pid !== undefined,
        details: data.message || `New PID: ${data.pid}`,
      };
    });

    await runTest('Verify running after restart', async () => {
      const { data } = (await callTool('openflow_status')) as {
        data: { state: string };
      };

      return {
        passed: data.state === 'running',
        details: `State: ${data.state}`,
      };
    });

    await runTest('Stop OpenFlow app', async () => {
      const { data, isError } = (await callTool('openflow_stop')) as {
        data: { message?: string };
        isError: boolean;
      };

      if (!isError) {
        appStarted = false;
      }

      return {
        passed: !isError,
        details: data.message,
      };
    });

    await runTest('Verify stopped', async () => {
      const { data } = (await callTool('openflow_status')) as {
        data: { state: string };
      };

      return {
        passed: data.state === 'stopped',
        details: `State: ${data.state}`,
      };
    });

    // ═══════════════════════════════════════════════════════════════
    // PHASE 3: Error Handling
    // ═══════════════════════════════════════════════════════════════
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('⚠️  PHASE 3: Error Handling\n');

    await runTest('Stop when already stopped', async () => {
      const { data, isError } = (await callTool('openflow_stop')) as {
        data: { message?: string };
        isError: boolean;
      };

      // Should succeed gracefully even when already stopped
      return {
        passed: !isError,
        details: data.message,
      };
    });

    await runTest('Wait ready when stopped', async () => {
      const { isError } = await callTool('openflow_wait_ready', {
        timeout_seconds: 5,
      });

      // Should return error when app is not running
      return {
        passed: isError,
        details: isError ? 'Correctly returned error' : 'Should have returned error',
      };
    });

    // ═══════════════════════════════════════════════════════════════
    // RESULTS
    // ═══════════════════════════════════════════════════════════════
    console.log('\n╔══════════════════════════════════════════════════════════════╗');
    console.log('║                      TEST RESULTS                             ║');
    console.log('╚══════════════════════════════════════════════════════════════╝\n');

    const passed = results.filter((r) => r.passed).length;
    const failed = results.filter((r) => !r.passed).length;
    const totalDuration = results.reduce((sum, r) => sum + r.duration, 0);

    console.log(`  ✅ Passed: ${passed}`);
    console.log(`  ❌ Failed: ${failed}`);
    console.log(`  📊 Total:  ${results.length}`);
    console.log(`  ⏱️  Time:   ${(totalDuration / 1000).toFixed(1)}s`);

    if (failed > 0) {
      console.log('\n  Failed tests:');
      for (const result of results.filter((r) => !r.passed)) {
        console.log(`    • ${result.name}`);
        if (result.details) {
          console.log(`      └─ ${result.details}`);
        }
      }
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    // Cleanup if needed
    if (appStarted) {
      console.log('\n🧹 Cleaning up...');
      await callTool('openflow_stop');
    }

    await client.close();
    process.exit(failed > 0 ? 1 : 0);
  } catch (err) {
    console.error('\n💥 Fatal error:', err);

    // Cleanup
    if (appStarted) {
      try {
        await callTool('openflow_stop');
      } catch {
        // Ignore cleanup errors
      }
    }

    await client.close();
    process.exit(1);
  }
}

runIntegrationTests();
