/**
 * Centralized logging system for OpenFlow
 *
 * Provides structured logging with configurable levels, context tagging,
 * and environment-based filtering.
 *
 * @example
 * ```ts
 * const logger = createLogger('MyComponent');
 * logger.debug('Processing data', { count: 42 });
 * logger.info('Operation completed');
 * logger.warn('Deprecated feature used');
 * logger.error('Failed to save', { error: new Error('Network error') });
 * ```
 */

/**
 * Log levels in order of severity (lowest to highest)
 */
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  SILENT = 4,
}

/**
 * Structured log entry for JSON output
 */
export interface LogEntry {
  timestamp: string;
  level: keyof typeof LogLevel;
  context: string;
  message: string;
  data?: Record<string, unknown>;
}

/**
 * Logger configuration options
 */
export interface LoggerConfig {
  /**
   * Minimum log level to output. Logs below this level are filtered.
   * @default LogLevel.INFO in production, LogLevel.DEBUG in development
   */
  minLevel: LogLevel;

  /**
   * Whether to output logs as JSON (for structured logging) or human-readable
   * @default false (human-readable in dev, JSON in production)
   */
  json: boolean;

  /**
   * Whether logging is enabled globally
   * @default true
   */
  enabled: boolean;

  /**
   * Optional handler for persisting logs (e.g., to Tauri backend)
   */
  persistHandler?: (entry: LogEntry) => void;
}

/**
 * Logger instance interface
 */
export interface Logger {
  /** Log debug-level message (verbose, development only) */
  debug: (message: string, data?: Record<string, unknown>) => void;

  /** Log info-level message (general operational info) */
  info: (message: string, data?: Record<string, unknown>) => void;

  /** Log warning-level message (potential issues) */
  warn: (message: string, data?: Record<string, unknown>) => void;

  /** Log error-level message (failures requiring attention) */
  error: (message: string, data?: Record<string, unknown>) => void;

  /** Create a child logger with additional context */
  child: (childContext: string) => Logger;

  /** The context tag for this logger instance */
  readonly context: string;
}

// Detect environment
const isDevelopment =
  typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.MODE === 'development';

// Global configuration with sensible defaults
let globalConfig: LoggerConfig = {
  minLevel: isDevelopment ? LogLevel.DEBUG : LogLevel.INFO,
  json: !isDevelopment,
  enabled: true,
  persistHandler: undefined,
};

/**
 * Configure the global logger settings
 *
 * @example
 * ```ts
 * // In production, only show warnings and errors
 * setLoggerConfig({ minLevel: LogLevel.WARN });
 *
 * // Disable all logging
 * setLoggerConfig({ enabled: false });
 *
 * // Enable JSON output for log aggregation
 * setLoggerConfig({ json: true });
 * ```
 */
export function setLoggerConfig(config: Partial<LoggerConfig>): void {
  globalConfig = { ...globalConfig, ...config };
}

/**
 * Get the current logger configuration (for testing/debugging)
 */
export function getLoggerConfig(): Readonly<LoggerConfig> {
  return { ...globalConfig };
}

/**
 * Reset logger configuration to defaults (useful for testing)
 */
export function resetLoggerConfig(): void {
  globalConfig = {
    minLevel: isDevelopment ? LogLevel.DEBUG : LogLevel.INFO,
    json: !isDevelopment,
    enabled: true,
    persistHandler: undefined,
  };
}

/**
 * Format a log entry for human-readable output
 */
function formatHumanReadable(entry: LogEntry): string {
  const timestamp = entry.timestamp.split('T')[1]?.slice(0, 12) ?? entry.timestamp;
  const levelPad = entry.level.padEnd(5);
  const contextPad = entry.context.padEnd(20).slice(0, 20);

  let output = `${timestamp} [${levelPad}] ${contextPad} | ${entry.message}`;

  if (entry.data && Object.keys(entry.data).length > 0) {
    // Format data compactly
    const dataStr = JSON.stringify(entry.data, serializeError);
    output += ` ${dataStr}`;
  }

  return output;
}

/**
 * JSON replacer to properly serialize Error objects
 */
function serializeError(_key: string, value: unknown): unknown {
  if (value instanceof Error) {
    return {
      name: value.name,
      message: value.message,
      stack: value.stack,
    };
  }
  return value;
}

/**
 * Get console method for a given log level
 */
function getConsoleMethod(level: LogLevel): 'debug' | 'info' | 'warn' | 'error' {
  switch (level) {
    case LogLevel.DEBUG:
      return 'debug';
    case LogLevel.INFO:
      return 'info';
    case LogLevel.WARN:
      return 'warn';
    case LogLevel.ERROR:
      return 'error';
    default:
      return 'info';
  }
}

/**
 * Level name to enum mapping
 */
const levelNames: Record<LogLevel, keyof typeof LogLevel> = {
  [LogLevel.DEBUG]: 'DEBUG',
  [LogLevel.INFO]: 'INFO',
  [LogLevel.WARN]: 'WARN',
  [LogLevel.ERROR]: 'ERROR',
  [LogLevel.SILENT]: 'SILENT',
};

/**
 * Create a log function for a specific level
 */
function createLogFn(
  context: string,
  level: LogLevel
): (message: string, data?: Record<string, unknown>) => void {
  return (message: string, data?: Record<string, unknown>): void => {
    // Check if logging is enabled and level is high enough
    if (!globalConfig.enabled || level < globalConfig.minLevel) {
      return;
    }

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: levelNames[level],
      context,
      message,
      data,
    };

    // Output to console
    const consoleMethod = getConsoleMethod(level);

    if (globalConfig.json) {
      // JSON format for structured logging
      console[consoleMethod](JSON.stringify(entry, serializeError));
    } else {
      // Human-readable format for development
      const formatted = formatHumanReadable(entry);

      // Use colors in development if available
      if (isDevelopment) {
        const styles: Record<LogLevel, string> = {
          [LogLevel.DEBUG]: 'color: gray',
          [LogLevel.INFO]: 'color: blue',
          [LogLevel.WARN]: 'color: orange',
          [LogLevel.ERROR]: 'color: red; font-weight: bold',
          [LogLevel.SILENT]: '', // Should never be used
        };
        console[consoleMethod](`%c${formatted}`, styles[level] || '');
      } else {
        console[consoleMethod](formatted);
      }
    }

    // Call persist handler if configured
    if (globalConfig.persistHandler) {
      try {
        globalConfig.persistHandler(entry);
      } catch {
        // Silently fail - don't create infinite loops
      }
    }
  };
}

/**
 * Create a logger instance with a specific context tag
 *
 * @param context - A descriptive name for the logging context (e.g., component name, hook name)
 * @returns A Logger instance with debug, info, warn, error methods
 *
 * @example
 * ```ts
 * // In a hook
 * const logger = createLogger('useProjects');
 * logger.debug('Fetching projects');
 * logger.info('Projects loaded', { count: projects.length });
 *
 * // In a component
 * const logger = createLogger('ProjectCard');
 * logger.warn('Missing project thumbnail', { projectId });
 *
 * // With child context
 * const childLogger = logger.child('validator');
 * childLogger.error('Validation failed', { errors });
 * ```
 */
export function createLogger(context: string): Logger {
  return {
    context,
    debug: createLogFn(context, LogLevel.DEBUG),
    info: createLogFn(context, LogLevel.INFO),
    warn: createLogFn(context, LogLevel.WARN),
    error: createLogFn(context, LogLevel.ERROR),
    child: (childContext: string) => createLogger(`${context}:${childContext}`),
  };
}

/**
 * Parse a string log level to LogLevel enum
 * Useful for configuration from environment variables
 */
export function parseLogLevel(level: string): LogLevel {
  const normalized = level.toUpperCase();
  switch (normalized) {
    case 'DEBUG':
      return LogLevel.DEBUG;
    case 'INFO':
      return LogLevel.INFO;
    case 'WARN':
    case 'WARNING':
      return LogLevel.WARN;
    case 'ERROR':
      return LogLevel.ERROR;
    case 'SILENT':
    case 'NONE':
    case 'OFF':
      return LogLevel.SILENT;
    default:
      return LogLevel.INFO;
  }
}
