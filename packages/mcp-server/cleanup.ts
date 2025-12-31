#!/usr/bin/env node
/**
 * OpenFlow MCP Cleanup Script
 *
 * Finds and kills any orphaned processes related to the OpenFlow project,
 * and cleans up stale socket files.
 *
 * Usage:
 *   npx tsx packages/mcp-server/cleanup.ts
 *   pnpm mcp:cleanup
 */

import { execSync, spawnSync } from 'node:child_process';
import { existsSync, unlinkSync } from 'node:fs';

const SOCKET_FILES = ['/tmp/openflow-mcp.sock'];

const PROCESS_PATTERNS = [
  'pnpm.*dev.*openflow',
  'vite.*openflow',
  'tauri.*openflow',
  'cargo.*openflow',
  'tsx.*mcp-server',
  'node.*mcp-server',
];

const DEV_PORTS = [1420, 1421, 5173, 5174];

interface ProcessInfo {
  pid: number;
  command: string;
}

/**
 * Find processes matching a pattern.
 */
function findProcesses(pattern: string): ProcessInfo[] {
  try {
    const result = execSync(`pgrep -fl "${pattern}" 2>/dev/null || true`, {
      encoding: 'utf-8',
    });

    if (!result.trim()) {
      return [];
    }

    return result
      .trim()
      .split('\n')
      .filter(Boolean)
      .map((line) => {
        const match = line.match(/^(\d+)\s+(.+)$/);
        const pid = match?.[1];
        const command = match?.[2];
        if (pid && command) {
          return { pid: Number.parseInt(pid, 10), command };
        }
        return null;
      })
      .filter((p): p is ProcessInfo => p !== null);
  } catch {
    return [];
  }
}

/**
 * Find processes listening on specific ports.
 */
function findProcessesOnPorts(ports: number[]): ProcessInfo[] {
  const processes: ProcessInfo[] = [];

  for (const port of ports) {
    try {
      const result = execSync(`lsof -i :${port} -t 2>/dev/null || true`, {
        encoding: 'utf-8',
      });

      if (result.trim()) {
        for (const pid of result.trim().split('\n').filter(Boolean)) {
          const pidNum = Number.parseInt(pid, 10);
          if (!Number.isNaN(pidNum)) {
            // Get command name
            try {
              const cmd = execSync(`ps -p ${pidNum} -o comm= 2>/dev/null || true`, {
                encoding: 'utf-8',
              }).trim();
              processes.push({ pid: pidNum, command: `${cmd} (port ${port})` });
            } catch {
              processes.push({ pid: pidNum, command: `unknown (port ${port})` });
            }
          }
        }
      }
    } catch {
      // Ignore errors
    }
  }

  return processes;
}

/**
 * Kill a process by PID.
 */
function killProcess(pid: number): boolean {
  try {
    // First try SIGTERM
    process.kill(pid, 'SIGTERM');

    // Wait a moment
    spawnSync('sleep', ['0.5']);

    // Check if still running and force kill if needed
    try {
      process.kill(pid, 0); // Check if process exists
      process.kill(pid, 'SIGKILL');
    } catch {
      // Process already dead
    }

    return true;
  } catch {
    return false;
  }
}

/**
 * Clean up orphaned socket files.
 */
function cleanupSocketFiles(): number {
  let cleaned = 0;

  for (const socketPath of SOCKET_FILES) {
    if (existsSync(socketPath)) {
      try {
        unlinkSync(socketPath);
        console.log(`  Removed: ${socketPath}`);
        cleaned++;
      } catch (err) {
        console.log(`  Failed to remove ${socketPath}: ${err}`);
      }
    }
  }

  // Also clean up any pattern-matching socket files
  try {
    const result = execSync('ls /tmp/*.sock 2>/dev/null || true', {
      encoding: 'utf-8',
    });

    for (const file of result.trim().split('\n').filter(Boolean)) {
      if (file.includes('openflow') || file.includes('mcp')) {
        try {
          unlinkSync(file);
          console.log(`  Removed: ${file}`);
          cleaned++;
        } catch {
          // Ignore
        }
      }
    }
  } catch {
    // Ignore
  }

  return cleaned;
}

/**
 * Main cleanup function.
 */
function main(): void {
  console.log('OpenFlow MCP Cleanup');
  console.log('====================\n');

  // Find all orphaned processes
  console.log('Searching for orphaned processes...');
  const allProcesses = new Map<number, ProcessInfo>();

  for (const pattern of PROCESS_PATTERNS) {
    for (const proc of findProcesses(pattern)) {
      // Don't kill ourselves
      if (proc.pid !== process.pid) {
        allProcesses.set(proc.pid, proc);
      }
    }
  }

  // Find processes on dev ports
  for (const proc of findProcessesOnPorts(DEV_PORTS)) {
    if (proc.pid !== process.pid) {
      allProcesses.set(proc.pid, proc);
    }
  }

  if (allProcesses.size === 0) {
    console.log('  No orphaned processes found.\n');
  } else {
    console.log(`  Found ${allProcesses.size} potential orphaned process(es):\n`);

    for (const [pid, proc] of allProcesses) {
      console.log(`  PID ${pid}: ${proc.command}`);
    }

    console.log('\nKilling processes...');
    let killed = 0;
    for (const [pid, proc] of allProcesses) {
      const success = killProcess(pid);
      if (success) {
        console.log(`  Killed PID ${pid}: ${proc.command}`);
        killed++;
      } else {
        console.log(`  Failed to kill PID ${pid}: ${proc.command}`);
      }
    }

    console.log(`\n  Killed ${killed}/${allProcesses.size} process(es).\n`);
  }

  // Clean up socket files
  console.log('Cleaning up socket files...');
  const socketsCleaned = cleanupSocketFiles();
  if (socketsCleaned === 0) {
    console.log('  No orphaned socket files found.\n');
  } else {
    console.log(`\n  Cleaned ${socketsCleaned} socket file(s).\n`);
  }

  console.log('Cleanup complete.');
}

main();
