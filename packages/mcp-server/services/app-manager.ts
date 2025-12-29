/**
 * App Manager Service
 *
 * Manages the lifecycle of the Tauri application process.
 */

import { type ChildProcess, spawn } from 'node:child_process';
import { resolve } from 'node:path';
import type {
  AppState,
  AppStatus,
  LogEntry,
  LogOptions,
  StartOptions,
  StartResult,
  StopResult,
} from '../types.js';
import { createLogBuffer, parseLogLevel, sleep } from '../utils.js';

/** Default dev server URL for Tauri */
const DEFAULT_DEV_SERVER_URL = 'http://localhost:1420';

/** Default timeout for waiting for the dev server to be ready */
const DEFAULT_READY_TIMEOUT = 60000;

/** Interval for polling the dev server readiness */
const READY_POLL_INTERVAL = 500;

/** Timeout for graceful shutdown before using SIGKILL */
const GRACEFUL_SHUTDOWN_TIMEOUT = 5000;

/**
 * Manages the Tauri application lifecycle including starting, stopping,
 * and monitoring the dev server process.
 */
export class AppManager {
  private state: AppState = 'stopped';
  private pid: number | null = null;
  private startTime: Date | null = null;
  private devServerUrl: string | null = null;
  private error: string | null = null;
  private process: ChildProcess | null = null;
  private logBuffer = createLogBuffer(1000);
  private projectRoot: string;

  constructor(projectRoot?: string) {
    // Default to the OpenFlow project root (4 levels up from this file)
    this.projectRoot = projectRoot || resolve(import.meta.dirname, '..', '..', '..');
  }

  /**
   * Start the application dev server.
   */
  async start(options: StartOptions = {}): Promise<StartResult> {
    const { waitForReady = true, timeout = DEFAULT_READY_TIMEOUT } = options;

    // Check if already running
    if (this.state === 'running' || this.state === 'starting') {
      return {
        success: false,
        pid: this.pid,
        devServerUrl: this.devServerUrl,
        error: `App is already ${this.state}`,
      };
    }

    // Reset state
    this.state = 'starting';
    this.error = null;
    this.logBuffer.clear();

    try {
      // Spawn pnpm dev process
      this.process = spawn('pnpm', ['dev'], {
        cwd: this.projectRoot,
        stdio: ['ignore', 'pipe', 'pipe'],
        shell: true,
        // Detach on non-Windows so we can kill the process group
        detached: process.platform !== 'win32',
      });

      if (!this.process.pid) {
        throw new Error('Failed to start process: no PID assigned');
      }

      this.pid = this.process.pid;
      this.startTime = new Date();

      // Set up stdout logging
      this.process.stdout?.on('data', (data: Buffer) => {
        const lines = data.toString().split('\n').filter(Boolean);
        for (const line of lines) {
          this.addLogEntry(line);
          // Check for Vite dev server URL
          this.parseDevServerUrl(line);
        }
      });

      // Set up stderr logging
      this.process.stderr?.on('data', (data: Buffer) => {
        const lines = data.toString().split('\n').filter(Boolean);
        for (const line of lines) {
          this.addLogEntry(line, 'error');
        }
      });

      // Handle process exit
      this.process.on('exit', (code, signal) => {
        const wasRunning = this.state === 'running';
        this.state = 'stopped';
        this.process = null;

        if (code !== 0 && code !== null && wasRunning) {
          this.error = `Process exited with code ${code}`;
          this.addLogEntry(`Process exited with code ${code}, signal ${signal}`, 'error');
        }
      });

      // Handle process error
      this.process.on('error', (err) => {
        this.state = 'error';
        this.error = err.message;
        this.addLogEntry(`Process error: ${err.message}`, 'error');
      });

      // Wait for ready if requested
      if (waitForReady) {
        const ready = await this.waitForReady(timeout);
        if (!ready) {
          // If we timed out waiting for ready, stop the process
          await this.stop();
          return {
            success: false,
            pid: null,
            devServerUrl: null,
            error: `Dev server did not become ready within ${timeout}ms`,
          };
        }
      }

      this.state = 'running';
      return {
        success: true,
        pid: this.pid,
        devServerUrl: this.devServerUrl,
        error: null,
      };
    } catch (err) {
      this.state = 'error';
      this.error = err instanceof Error ? err.message : String(err);
      return {
        success: false,
        pid: null,
        devServerUrl: null,
        error: this.error,
      };
    }
  }

  /**
   * Stop the running application.
   */
  async stop(): Promise<StopResult> {
    if (this.state === 'stopped') {
      return {
        success: true,
        error: null,
      };
    }

    if (!this.process || !this.pid) {
      this.state = 'stopped';
      return {
        success: true,
        error: null,
      };
    }

    this.state = 'stopping';

    try {
      // Try graceful shutdown first with SIGTERM
      await this.killProcess('SIGTERM');

      // Wait for process to exit gracefully
      const gracefulExit = await this.waitForExit(GRACEFUL_SHUTDOWN_TIMEOUT);

      if (!gracefulExit) {
        // Force kill if graceful shutdown failed
        this.addLogEntry('Graceful shutdown timed out, forcing kill...', 'warn');
        await this.killProcess('SIGKILL');
        await this.waitForExit(2000);
      }

      this.state = 'stopped';
      this.pid = null;
      this.startTime = null;
      this.devServerUrl = null;
      this.process = null;

      return {
        success: true,
        error: null,
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      this.state = 'error';
      this.error = errorMessage;
      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Get the current application status.
   */
  getStatus(): AppStatus {
    return {
      state: this.state,
      pid: this.pid,
      startTime: this.startTime,
      uptime: this.startTime ? Date.now() - this.startTime.getTime() : null,
      devServerUrl: this.devServerUrl,
      error: this.error,
    };
  }

  /**
   * Check if the dev server is ready and responding.
   */
  async isReady(): Promise<boolean> {
    const url = this.devServerUrl || DEFAULT_DEV_SERVER_URL;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);

      const response = await fetch(url, {
        method: 'HEAD',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      return response.ok || response.status === 304;
    } catch {
      return false;
    }
  }

  /**
   * Wait for the dev server to become ready.
   */
  async waitForReady(timeout = DEFAULT_READY_TIMEOUT): Promise<boolean> {
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
      // Check if process is still running
      if (this.state === 'stopped' || this.state === 'error') {
        return false;
      }

      // Check if dev server is ready
      if (await this.isReady()) {
        // Also set the URL if we detected it from logs
        if (!this.devServerUrl) {
          this.devServerUrl = DEFAULT_DEV_SERVER_URL;
        }
        return true;
      }

      await sleep(READY_POLL_INTERVAL);
    }

    return false;
  }

  /**
   * Get recent log entries.
   */
  getLogs(options: LogOptions = {}): LogEntry[] {
    return this.logBuffer.getEntries(options.level, options.limit);
  }

  /**
   * Add a log entry to the buffer.
   */
  private addLogEntry(message: string, levelOverride?: LogEntry['level']): void {
    const entry: LogEntry = {
      timestamp: new Date(),
      level: levelOverride || parseLogLevel(message),
      message: message.trim(),
    };
    this.logBuffer.push(entry);
  }

  /**
   * Parse the dev server URL from Vite output.
   */
  private parseDevServerUrl(line: string): void {
    // Look for Vite's "Local:" URL output
    // Example: "  ➜  Local:   http://localhost:1420/"
    const localMatch = line.match(/Local:\s+(https?:\/\/[^\s]+)/);
    if (localMatch) {
      this.devServerUrl = localMatch[1].replace(/\/$/, ''); // Remove trailing slash
      this.addLogEntry(`Detected dev server URL: ${this.devServerUrl}`, 'info');
    }
  }

  /**
   * Kill the process with the specified signal.
   */
  private async killProcess(signal: 'SIGTERM' | 'SIGKILL'): Promise<void> {
    if (!this.process || !this.pid) {
      return;
    }

    // On Unix, kill the process group to ensure child processes are also killed
    if (process.platform !== 'win32') {
      try {
        // Negative PID kills the process group
        process.kill(-this.pid, signal);
      } catch (err) {
        // Process might already be dead, try killing just the process
        try {
          this.process.kill(signal);
        } catch {
          // Ignore - process is likely already dead
        }
      }
    } else {
      // On Windows, just kill the process directly
      try {
        this.process.kill(signal);
      } catch {
        // Ignore - process is likely already dead
      }
    }
  }

  /**
   * Wait for the process to exit.
   */
  private waitForExit(timeout: number): Promise<boolean> {
    return new Promise((resolve) => {
      if (!this.process) {
        resolve(true);
        return;
      }

      const timeoutId = setTimeout(() => {
        resolve(false);
      }, timeout);

      this.process.once('exit', () => {
        clearTimeout(timeoutId);
        resolve(true);
      });
    });
  }
}

// Singleton instance
let instance: AppManager | null = null;

/**
 * Get the AppManager singleton instance.
 */
export function getAppManager(): AppManager {
  if (!instance) {
    instance = new AppManager();
  }
  return instance;
}

/**
 * Reset the AppManager singleton (useful for testing).
 */
export function resetAppManager(): void {
  if (instance) {
    // Try to stop if running
    instance.stop().catch(() => {
      // Ignore errors during reset
    });
  }
  instance = null;
}
