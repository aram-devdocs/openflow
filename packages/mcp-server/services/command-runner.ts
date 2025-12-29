/**
 * Command Runner Service
 *
 * Executes development commands (lint, typecheck, test, build, etc.)
 * and captures their output.
 */

import { type ChildProcess, spawn } from 'node:child_process';
import { resolve } from 'node:path';
import type { CommandOptions, CommandResult } from '../types.js';

/** Default command timeout (5 minutes) */
const DEFAULT_TIMEOUT = 300000;

/** Project root directory */
const PROJECT_ROOT = resolve(import.meta.dirname, '..', '..', '..');

/**
 * Run a shell command and capture its output.
 */
export async function runCommand(
  command: string,
  args: string[] = [],
  options: CommandOptions = {}
): Promise<CommandResult> {
  const { cwd = PROJECT_ROOT, timeout = DEFAULT_TIMEOUT, env } = options;

  return new Promise((resolve) => {
    let stdout = '';
    let stderr = '';
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    let killed = false;
    let childProcess: ChildProcess | null = null;

    try {
      childProcess = spawn(command, args, {
        cwd,
        shell: true,
        stdio: ['ignore', 'pipe', 'pipe'],
        env: { ...process.env, ...env },
        // Detach on non-Windows so we can kill the process group
        detached: process.platform !== 'win32',
      });

      // Set up timeout
      if (timeout > 0) {
        timeoutId = setTimeout(() => {
          killed = true;
          if (childProcess) {
            killProcess(childProcess);
          }
        }, timeout);
      }

      // Capture stdout
      childProcess.stdout?.on('data', (data: Buffer) => {
        stdout += data.toString();
      });

      // Capture stderr
      childProcess.stderr?.on('data', (data: Buffer) => {
        stderr += data.toString();
      });

      // Handle process exit
      childProcess.on('exit', (code, signal) => {
        if (timeoutId) {
          clearTimeout(timeoutId);
        }

        if (killed) {
          resolve({
            success: false,
            exitCode: -1,
            stdout,
            stderr,
            error: `Command timed out after ${timeout}ms`,
          });
          return;
        }

        const exitCode = code ?? (signal ? 128 : 0);
        resolve({
          success: exitCode === 0,
          exitCode,
          stdout,
          stderr,
          error: exitCode !== 0 ? `Command exited with code ${exitCode}` : null,
        });
      });

      // Handle process error
      childProcess.on('error', (err) => {
        if (timeoutId) {
          clearTimeout(timeoutId);
        }

        resolve({
          success: false,
          exitCode: -1,
          stdout,
          stderr,
          error: err.message,
        });
      });
    } catch (err) {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      resolve({
        success: false,
        exitCode: -1,
        stdout,
        stderr,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  });
}

/**
 * Kill a process and its children.
 */
function killProcess(childProcess: ChildProcess): void {
  if (!childProcess.pid) {
    return;
  }

  // On Unix, kill the process group
  if (process.platform !== 'win32') {
    try {
      process.kill(-childProcess.pid, 'SIGTERM');
    } catch {
      try {
        childProcess.kill('SIGTERM');
      } catch {
        // Process likely already dead
      }
    }
  } else {
    try {
      childProcess.kill('SIGTERM');
    } catch {
      // Process likely already dead
    }
  }
}

/**
 * Run pnpm with the given script name.
 */
export async function runPnpmScript(
  script: string,
  args: string[] = [],
  options: CommandOptions = {}
): Promise<CommandResult> {
  return runCommand('pnpm', [script, ...args], options);
}

/**
 * Run cargo command in the src-tauri directory.
 */
export async function runCargoCommand(
  command: string,
  args: string[] = [],
  options: CommandOptions = {}
): Promise<CommandResult> {
  const tauriDir = resolve(PROJECT_ROOT, 'src-tauri');
  return runCommand('cargo', [command, ...args], {
    ...options,
    cwd: tauriDir,
  });
}

/**
 * Parse lint output (Biome) to extract error and warning counts.
 */
export function parseLintOutput(output: string): {
  errors: number;
  warnings: number;
  fixed: number;
} {
  let errors = 0;
  let warnings = 0;
  let fixed = 0;

  // Biome outputs diagnostics in various formats
  // Look for error count in summary line: "Found X errors"
  const errorMatch = output.match(/Found\s+(\d+)\s+error/i);
  if (errorMatch) {
    errors = Number.parseInt(errorMatch[1], 10);
  }

  // Count individual error occurrences
  const errorOccurrences = (output.match(/\berror\b/gi) || []).length;
  if (errors === 0 && errorOccurrences > 0) {
    // Rough estimate if no summary found
    errors = errorOccurrences;
  }

  // Look for warning count
  const warningMatch = output.match(/Found\s+(\d+)\s+warning/i);
  if (warningMatch) {
    warnings = Number.parseInt(warningMatch[1], 10);
  } else {
    warnings = (output.match(/\bwarning\b/gi) || []).length;
  }

  // Look for fixed count (when running with --fix)
  const fixedMatch = output.match(/Fixed\s+(\d+)/i);
  if (fixedMatch) {
    fixed = Number.parseInt(fixedMatch[1], 10);
  }

  // Biome also shows "Applied N fixes" format
  const appliedMatch = output.match(/Applied\s+(\d+)\s+fix/i);
  if (appliedMatch) {
    fixed = Number.parseInt(appliedMatch[1], 10);
  }

  return { errors, warnings, fixed };
}

/**
 * Parse test output (Vitest) to extract pass/fail counts.
 */
export function parseTestOutput(output: string): {
  passed: number;
  failed: number;
  skipped: number;
  total: number;
} {
  let passed = 0;
  let failed = 0;
  let skipped = 0;

  // Vitest summary line format: "Tests  X passed | Y failed | Z skipped (W)"
  // Or: "Tests  X passed (Y)"
  const summaryMatch = output.match(
    /Tests?\s+(\d+)\s+passed(?:\s*\|\s*(\d+)\s+failed)?(?:\s*\|\s*(\d+)\s+skipped)?/i
  );

  if (summaryMatch) {
    passed = Number.parseInt(summaryMatch[1], 10);
    if (summaryMatch[2]) {
      failed = Number.parseInt(summaryMatch[2], 10);
    }
    if (summaryMatch[3]) {
      skipped = Number.parseInt(summaryMatch[3], 10);
    }
  } else {
    // Alternative: count individual test results
    // ✓ or ✔ for passed, ✗ or × for failed, - for skipped
    passed = (output.match(/[✓✔]\s/g) || []).length;
    failed = (output.match(/[✗×]\s/g) || []).length;
    skipped = (output.match(/[-⊘]\s+.*skipped/gi) || []).length;
  }

  // Also check for "FAIL" and "PASS" prefixes used in some test outputs
  if (passed === 0 && failed === 0) {
    passed = (output.match(/^\s*PASS\s/gm) || []).length;
    failed = (output.match(/^\s*FAIL\s/gm) || []).length;
  }

  const total = passed + failed + skipped;
  return { passed, failed, skipped, total };
}

/**
 * Parse TypeScript compiler output to extract error information.
 */
export function parseTypecheckOutput(output: string): {
  errors: number;
  files: string[];
} {
  const files: string[] = [];
  let errors = 0;

  // TypeScript error format: "src/file.ts(line,col): error TS1234: message"
  // Or: "src/file.ts:line:col - error TS1234: message"
  const errorPattern = /^(.+?)\(?\d+[,:]?\d*\)?:\s*error\s+TS\d+/gm;
  const errorMatches = output.matchAll(errorPattern);

  for (const match of errorMatches) {
    errors++;
    const file = match[1].trim();
    if (file && !files.includes(file)) {
      files.push(file);
    }
  }

  // Also check alternative format with colons
  const altPattern = /^(.+?):\d+:\d+\s+-\s+error\s+TS\d+/gm;
  const altMatches = output.matchAll(altPattern);

  for (const match of altMatches) {
    errors++;
    const file = match[1].trim();
    if (file && !files.includes(file)) {
      files.push(file);
    }
  }

  // Summary line: "Found X errors in Y files"
  const summaryMatch = output.match(/Found\s+(\d+)\s+error/i);
  if (summaryMatch) {
    errors = Number.parseInt(summaryMatch[1], 10);
  }

  return { errors, files };
}

/**
 * Parse Rust cargo check/clippy output to extract error information.
 */
export function parseCargoOutput(output: string): {
  errors: number;
  warnings: number;
  files: string[];
} {
  const files: string[] = [];
  let errors = 0;
  let warnings = 0;

  // Cargo error format: "error[E0XXX]: message"
  errors = (output.match(/^error(\[E\d+\])?:/gm) || []).length;

  // Cargo warning format: "warning: message"
  warnings = (output.match(/^warning:/gm) || []).length;

  // Extract file paths from "  --> src/file.rs:line:col"
  const filePattern = /-->\s+(.+?):\d+:\d+/g;
  const fileMatches = output.matchAll(filePattern);

  for (const match of fileMatches) {
    const file = match[1].trim();
    if (file && !files.includes(file)) {
      files.push(file);
    }
  }

  return { errors, warnings, files };
}
