/**
 * Test script for MCP Server Phase 2 - Development Tools
 *
 * Tests the development tools:
 * - openflow_lint
 * - openflow_typecheck
 * - openflow_test
 * - openflow_rust_check
 * - openflow_generate_types
 * - openflow_build (optional, slow)
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

interface TestResult {
  name: string;
  passed: boolean;
  message: string;
  duration: number;
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
      // Suppress stderr unless debugging
      if (process.env.DEBUG) {
        console.error('[MCP stderr]', data.toString().trim());
      }
    });

    this.proc.on('error', (err) => {
      console.error('[MCP error]', err);
    });
  }

  private processResponses(): void {
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
        reject(new Error(`Request ${method} timed out after ${timeoutMs}ms`));
      }, timeoutMs);

      this.proc.stdin?.write(`${JSON.stringify(request)}\n`);

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
    timeoutMs = 60000
  ): Promise<{ success: boolean; text: string; isError?: boolean; data?: unknown }> {
    const response = await this.sendRequest('tools/call', { name, arguments: args }, timeoutMs);

    if (response.error) {
      return { success: false, text: response.error.message, isError: true };
    }

    const result = response.result as {
      content: Array<{ type: string; text: string }>;
      isError?: boolean;
    };
    const text = result.content[0]?.text ?? '';

    // Try to parse as JSON for structured data
    let data: unknown;
    try {
      data = JSON.parse(text);
    } catch {
      data = null;
    }

    return { success: !result.isError, text, isError: result.isError, data };
  }

  close(): void {
    this.proc.kill();
  }
}

async function runTest(
  _tester: McpTester,
  name: string,
  description: string,
  testFn: () => Promise<{ passed: boolean; message: string }>
): Promise<TestResult> {
  const start = Date.now();
  console.log(`\n🧪 ${name}: ${description}`);

  try {
    const result = await testFn();
    const duration = Date.now() - start;

    if (result.passed) {
      console.log(`   ✅ PASSED (${duration}ms)`);
    } else {
      console.log(`   ❌ FAILED: ${result.message}`);
    }

    return { name, passed: result.passed, message: result.message, duration };
  } catch (err) {
    const duration = Date.now() - start;
    const message = err instanceof Error ? err.message : String(err);
    console.log(`   ❌ ERROR: ${message}`);
    return { name, passed: false, message, duration };
  }
}

async function runPhase2Tests(): Promise<void> {
  const args = process.argv.slice(2);
  const includeBuild = args.includes('--build');
  const verbose = args.includes('--verbose') || args.includes('-v');

  console.log('╔═══════════════════════════════════════════════════════════════╗');
  console.log('║     MCP Server Phase 2 Test Suite - Development Tools         ║');
  console.log('╚═══════════════════════════════════════════════════════════════╝');
  console.log('\nStarting MCP server...');

  const tester = new McpTester();
  const results: TestResult[] = [];

  try {
    // Wait for server to start
    await new Promise((r) => setTimeout(r, 1500));

    // Test 1: List tools and verify Phase 2 tools exist
    results.push(
      await runTest(tester, 'tools/list', 'Verify Phase 2 tools are registered', async () => {
        const response = await tester.sendRequest('tools/list');
        if (response.error) {
          return { passed: false, message: response.error.message };
        }

        const tools = (response.result as { tools: Array<{ name: string }> }).tools;
        const phase2Tools = [
          'openflow_lint',
          'openflow_typecheck',
          'openflow_test',
          'openflow_build',
          'openflow_generate_types',
          'openflow_rust_check',
        ];

        const missingTools = phase2Tools.filter((t) => !tools.find((tool) => tool.name === t));
        if (missingTools.length > 0) {
          return { passed: false, message: `Missing tools: ${missingTools.join(', ')}` };
        }

        console.log(`   Found ${tools.length} total tools`);
        return { passed: true, message: 'All Phase 2 tools registered' };
      })
    );

    // Test 2: Run linting
    results.push(
      await runTest(tester, 'openflow_lint', 'Run linting on the codebase', async () => {
        const result = await tester.callTool('openflow_lint', {}, 120000);

        if (verbose) {
          console.log(`   Response: ${result.text.substring(0, 500)}...`);
        }

        if (result.isError && !result.text.includes('exitCode')) {
          return { passed: false, message: result.text };
        }

        const data = result.data as { exitCode: number; errors: number; warnings: number } | null;
        if (data) {
          console.log(
            `   Exit code: ${data.exitCode}, Errors: ${data.errors}, Warnings: ${data.warnings}`
          );
        }

        // Lint may have errors/warnings but tool should still work
        return { passed: true, message: 'Lint tool executed successfully' };
      })
    );

    // Test 3: Run typecheck
    results.push(
      await runTest(tester, 'openflow_typecheck', 'Run TypeScript type checking', async () => {
        const result = await tester.callTool('openflow_typecheck', {}, 120000);

        if (verbose) {
          console.log(`   Response: ${result.text.substring(0, 500)}...`);
        }

        if (result.isError && !result.text.includes('exitCode')) {
          return { passed: false, message: result.text };
        }

        const data = result.data as {
          exitCode: number;
          errors: number;
          filesWithErrors: string[];
        } | null;
        if (data) {
          console.log(
            `   Exit code: ${data.exitCode}, Errors: ${data.errors}, Files with errors: ${data.filesWithErrors?.length ?? 0}`
          );
        }

        return { passed: true, message: 'Typecheck tool executed successfully' };
      })
    );

    // Test 4: Run tests
    results.push(
      await runTest(tester, 'openflow_test', 'Run Vitest tests', async () => {
        const result = await tester.callTool('openflow_test', {}, 180000);

        if (verbose) {
          console.log(`   Response: ${result.text.substring(0, 500)}...`);
        }

        if (result.isError && !result.text.includes('exitCode')) {
          return { passed: false, message: result.text };
        }

        const data = result.data as {
          exitCode: number;
          passed: number;
          failed: number;
          skipped: number;
          total: number;
        } | null;
        if (data) {
          console.log(
            `   Exit code: ${data.exitCode}, Tests: ${data.passed} passed, ${data.failed} failed, ${data.skipped} skipped (${data.total} total)`
          );
        }

        return { passed: true, message: 'Test tool executed successfully' };
      })
    );

    // Test 5: Run test with filter
    results.push(
      await runTest(
        tester,
        'openflow_test (filtered)',
        'Run tests with a filter pattern',
        async () => {
          const result = await tester.callTool(
            'openflow_test',
            { filter: 'nonexistent-test-pattern-xyz' },
            60000
          );

          if (result.isError && !result.text.includes('exitCode')) {
            return { passed: false, message: result.text };
          }

          // The filter should work even if no tests match
          return { passed: true, message: 'Test filter option works' };
        }
      )
    );

    // Test 6: Run Rust check
    results.push(
      await runTest(tester, 'openflow_rust_check', 'Run cargo check on Rust code', async () => {
        const result = await tester.callTool('openflow_rust_check', {}, 300000); // 5 minute timeout for cargo

        if (verbose) {
          console.log(`   Response: ${result.text.substring(0, 500)}...`);
        }

        if (result.isError && !result.text.includes('exitCode')) {
          return { passed: false, message: result.text };
        }

        const data = result.data as { exitCode: number; errors: number; warnings: number } | null;
        if (data) {
          console.log(
            `   Exit code: ${data.exitCode}, Errors: ${data.errors}, Warnings: ${data.warnings}`
          );
        }

        return { passed: true, message: 'Rust check tool executed successfully' };
      })
    );

    // Test 7: Generate types
    results.push(
      await runTest(
        tester,
        'openflow_generate_types',
        'Generate TypeScript types from Rust',
        async () => {
          const result = await tester.callTool('openflow_generate_types', {}, 120000);

          if (verbose) {
            console.log(`   Response: ${result.text.substring(0, 500)}...`);
          }

          if (result.isError && !result.text.includes('exitCode')) {
            return { passed: false, message: result.text };
          }

          const data = result.data as { exitCode: number } | null;
          if (data) {
            console.log(`   Exit code: ${data.exitCode}`);
          }

          return { passed: true, message: 'Type generation tool executed successfully' };
        }
      )
    );

    // Test 8: Lint with fix option (if available)
    results.push(
      await runTest(tester, 'openflow_lint (fix)', 'Run linting with auto-fix', async () => {
        const result = await tester.callTool('openflow_lint', { fix: true }, 120000);

        if (result.isError && !result.text.includes('exitCode')) {
          return { passed: false, message: result.text };
        }

        const data = result.data as { fixed: number } | null;
        if (data && data.fixed !== undefined) {
          console.log(`   Fixed: ${data.fixed} issues`);
        }

        return { passed: true, message: 'Lint fix option works' };
      })
    );

    // Optional: Test build (slow)
    if (includeBuild) {
      results.push(
        await runTest(tester, 'openflow_build', 'Build the application', async () => {
          console.log('   (This may take several minutes...)');
          const result = await tester.callTool('openflow_build', {}, 600000); // 10 minute timeout

          if (result.isError && !result.text.includes('exitCode')) {
            return { passed: false, message: result.text };
          }

          const data = result.data as { exitCode: number } | null;
          if (data) {
            console.log(`   Exit code: ${data.exitCode}`);
          }

          return { passed: true, message: 'Build tool executed successfully' };
        })
      );
    }

    // Print summary
    console.log('\n╔═══════════════════════════════════════════════════════════════╗');
    console.log('║                        Test Summary                           ║');
    console.log('╚═══════════════════════════════════════════════════════════════╝\n');

    const passed = results.filter((r) => r.passed).length;
    const failed = results.filter((r) => !r.passed).length;
    const totalDuration = results.reduce((sum, r) => sum + r.duration, 0);

    for (const result of results) {
      const status = result.passed ? '✅' : '❌';
      console.log(`${status} ${result.name}: ${result.message} (${result.duration}ms)`);
    }

    console.log(`\n📊 Results: ${passed} passed, ${failed} failed (${totalDuration}ms total)`);

    if (failed > 0) {
      console.log('\n⚠️  Some tests failed. Check the output above for details.');
      process.exitCode = 1;
    } else {
      console.log('\n🎉 All Phase 2 development tools working correctly!');
    }

    if (!includeBuild) {
      console.log('\n💡 Run with --build flag to also test the build tool (slower)');
    }
  } catch (err) {
    console.error('\n❌ Test suite failed:', err);
    process.exitCode = 1;
  } finally {
    tester.close();
  }
}

runPhase2Tests().catch(console.error);
