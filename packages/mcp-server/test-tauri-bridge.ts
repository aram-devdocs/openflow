/**
 * Test script for TauriBridge socket client
 *
 * This script tests the TauriBridge service by connecting to a running
 * OpenFlow Tauri app (started with MCP GUI plugin enabled).
 *
 * Usage:
 *   1. Start the app: pnpm dev:mcp
 *   2. Run this test: npx tsx packages/mcp-server/test-tauri-bridge.ts
 */

import { getAppManager } from './services/app-manager.js';
import { DEFAULT_SOCKET_PATH, TauriBridge } from './services/tauri-bridge.js';

const COLORS = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  dim: '\x1b[2m',
};

function log(message: string, color: keyof typeof COLORS = 'reset') {
  console.log(`${COLORS[color]}${message}${COLORS.reset}`);
}

function logSuccess(message: string) {
  log(`✓ ${message}`, 'green');
}

function logError(message: string) {
  log(`✗ ${message}`, 'red');
}

function logInfo(message: string) {
  log(`ℹ ${message}`, 'blue');
}

function logSection(message: string) {
  console.log(`\n${COLORS.yellow}═══ ${message} ═══${COLORS.reset}\n`);
}

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  logSection('TauriBridge Socket Client Test');
  logInfo(`Socket path: ${DEFAULT_SOCKET_PATH}`);

  const appManager = getAppManager();
  const bridge = new TauriBridge();

  let appStartedByUs = false;

  try {
    // Check if app is already running
    const status = appManager.getStatus();
    if (status.state !== 'running') {
      logInfo('Starting OpenFlow app with MCP GUI plugin...');
      const result = await appManager.start({ enableMcpGui: true, timeout: 120000 });
      if (!result.success) {
        logError(`Failed to start app: ${result.error}`);
        process.exit(1);
      }
      appStartedByUs = true;
      logSuccess(`App started with PID ${result.pid}`);

      // Wait a bit for the socket server to start
      logInfo('Waiting for MCP GUI socket server to start...');
      await sleep(3000);
    } else {
      logInfo(`App already running with PID ${status.pid}`);
    }

    // Test 1: Connect to socket
    logSection('Test 1: Socket Connection');
    try {
      await bridge.connect();
      logSuccess('Connected to socket server');

      const connectionStatus = bridge.getStatus();
      logInfo(`Connection state: ${connectionStatus.state}`);
      logInfo(`Socket path: ${connectionStatus.socketPath}`);
    } catch (err) {
      logError(`Failed to connect: ${err instanceof Error ? err.message : String(err)}`);
      throw err;
    }

    // Test 2: Ping
    logSection('Test 2: Ping Command');
    try {
      const pong = await bridge.ping();
      logSuccess(`Ping response: ${pong}`);
    } catch (err) {
      logError(`Ping failed: ${err instanceof Error ? err.message : String(err)}`);
    }

    // Test 3: Get DOM
    logSection('Test 3: Get DOM');
    try {
      const dom = await bridge.getDom();
      if (dom.html) {
        logSuccess(`Got DOM (${dom.html.length} chars)`);
        logInfo(`First 200 chars: ${dom.html.substring(0, 200)}...`);
      } else {
        logError('DOM is empty');
      }
    } catch (err) {
      logError(`Get DOM failed: ${err instanceof Error ? err.message : String(err)}`);
    }

    // Test 4: Execute JS
    logSection('Test 4: Execute JavaScript');
    try {
      const title = await bridge.evaluate<string>('document.title');
      logSuccess(`Page title: ${title}`);

      const url = await bridge.getUrl();
      logSuccess(`Page URL: ${url}`);
    } catch (err) {
      logError(`Execute JS failed: ${err instanceof Error ? err.message : String(err)}`);
    }

    // Test 5: Take Screenshot
    logSection('Test 5: Screenshot');
    try {
      const screenshot = await bridge.screenshot({ quality: 85 });
      if (screenshot.data) {
        logSuccess(`Screenshot captured (${screenshot.data.length} bytes base64)`);
        // Could save to file here if needed
      } else {
        logError('Screenshot data is empty');
      }
    } catch (err) {
      logError(`Screenshot failed: ${err instanceof Error ? err.message : String(err)}`);
    }

    // Test 6: Window management
    logSection('Test 6: Window Management');
    try {
      const windowResult = await bridge.manageWindow('focus');
      if (windowResult.success) {
        logSuccess('Window focus command executed');
      } else {
        logError(`Window focus failed: ${windowResult.message}`);
      }
    } catch (err) {
      logError(`Window management failed: ${err instanceof Error ? err.message : String(err)}`);
    }

    logSection('Test Complete');
    logSuccess('All connection tests passed');
  } catch (err) {
    logError(`Test failed: ${err instanceof Error ? err.message : String(err)}`);
    process.exitCode = 1;
  } finally {
    // Disconnect from socket
    bridge.disconnect();
    logInfo('Disconnected from socket');

    // Stop app if we started it
    if (appStartedByUs) {
      logInfo('Stopping app...');
      await appManager.stop();
      logInfo('App stopped');
    }
  }
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
