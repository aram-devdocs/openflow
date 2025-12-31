import {
  type LogEntry,
  LogLevel,
  type Logger,
  createLogger,
  getLoggerConfig,
  parseLogLevel,
  resetLoggerConfig,
  setLoggerConfig,
} from '@openflow/utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * Helper to safely get the first argument of a mock call
 */
function getFirstCallArg(mock: ReturnType<typeof vi.fn>): string {
  const call = mock.mock.calls[0];
  if (!call || call[0] === undefined) {
    throw new Error('Expected mock to have been called with an argument');
  }
  return call[0] as string;
}

describe('utils/logger', () => {
  // Store original console methods
  const originalConsole = {
    debug: console.debug,
    info: console.info,
    warn: console.warn,
    error: console.error,
  };

  // Mock console methods
  const mockConsole = {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  };

  beforeEach(() => {
    // Reset logger config to known state
    resetLoggerConfig();
    // Set to debug level for tests
    setLoggerConfig({ minLevel: LogLevel.DEBUG, json: false, enabled: true });

    // Install mocks
    console.debug = mockConsole.debug;
    console.info = mockConsole.info;
    console.warn = mockConsole.warn;
    console.error = mockConsole.error;
  });

  afterEach(() => {
    // Restore console
    console.debug = originalConsole.debug;
    console.info = originalConsole.info;
    console.warn = originalConsole.warn;
    console.error = originalConsole.error;

    // Clear mocks
    vi.clearAllMocks();
  });

  describe('createLogger', () => {
    it('creates a logger with the specified context', () => {
      const logger = createLogger('TestContext');
      expect(logger.context).toBe('TestContext');
    });

    it('has all required logging methods', () => {
      const logger = createLogger('Test');
      expect(typeof logger.debug).toBe('function');
      expect(typeof logger.info).toBe('function');
      expect(typeof logger.warn).toBe('function');
      expect(typeof logger.error).toBe('function');
      expect(typeof logger.child).toBe('function');
    });

    it('logs debug messages', () => {
      const logger = createLogger('Test');
      logger.debug('Debug message');

      expect(mockConsole.debug).toHaveBeenCalledTimes(1);
      const output = getFirstCallArg(mockConsole.debug);
      expect(output).toContain('DEBUG');
      expect(output).toContain('Test');
      expect(output).toContain('Debug message');
    });

    it('logs info messages', () => {
      const logger = createLogger('Test');
      logger.info('Info message');

      expect(mockConsole.info).toHaveBeenCalledTimes(1);
      const output = getFirstCallArg(mockConsole.info);
      expect(output).toContain('INFO');
      expect(output).toContain('Info message');
    });

    it('logs warning messages', () => {
      const logger = createLogger('Test');
      logger.warn('Warning message');

      expect(mockConsole.warn).toHaveBeenCalledTimes(1);
      const output = getFirstCallArg(mockConsole.warn);
      expect(output).toContain('WARN');
      expect(output).toContain('Warning message');
    });

    it('logs error messages', () => {
      const logger = createLogger('Test');
      logger.error('Error message');

      expect(mockConsole.error).toHaveBeenCalledTimes(1);
      const output = getFirstCallArg(mockConsole.error);
      expect(output).toContain('ERROR');
      expect(output).toContain('Error message');
    });

    it('includes data in log output', () => {
      const logger = createLogger('Test');
      logger.info('Message with data', { key: 'value', count: 42 });

      expect(mockConsole.info).toHaveBeenCalledTimes(1);
      const output = getFirstCallArg(mockConsole.info);
      expect(output).toContain('key');
      expect(output).toContain('value');
      expect(output).toContain('42');
    });

    it('serializes Error objects properly', () => {
      const logger = createLogger('Test');
      const error = new Error('Test error');
      logger.error('Failed operation', { error });

      expect(mockConsole.error).toHaveBeenCalledTimes(1);
      const output = getFirstCallArg(mockConsole.error);
      expect(output).toContain('Test error');
    });
  });

  describe('child logger', () => {
    it('creates a child logger with combined context', () => {
      const parent = createLogger('Parent');
      const child = parent.child('Child');

      expect(child.context).toBe('Parent:Child');
    });

    it('child logger logs with combined context', () => {
      const parent = createLogger('Service');
      const child = parent.child('Method');
      child.info('Processing');

      expect(mockConsole.info).toHaveBeenCalledTimes(1);
      const output = getFirstCallArg(mockConsole.info);
      expect(output).toContain('Service:Method');
    });

    it('supports multiple levels of nesting', () => {
      const l1 = createLogger('L1');
      const l2 = l1.child('L2');
      const l3 = l2.child('L3');

      expect(l3.context).toBe('L1:L2:L3');
    });
  });

  describe('setLoggerConfig', () => {
    it('sets minimum log level', () => {
      setLoggerConfig({ minLevel: LogLevel.WARN });
      const logger = createLogger('Test');

      logger.debug('Debug');
      logger.info('Info');
      logger.warn('Warn');
      logger.error('Error');

      expect(mockConsole.debug).not.toHaveBeenCalled();
      expect(mockConsole.info).not.toHaveBeenCalled();
      expect(mockConsole.warn).toHaveBeenCalledTimes(1);
      expect(mockConsole.error).toHaveBeenCalledTimes(1);
    });

    it('disables logging when enabled is false', () => {
      setLoggerConfig({ enabled: false });
      const logger = createLogger('Test');

      logger.debug('Debug');
      logger.info('Info');
      logger.warn('Warn');
      logger.error('Error');

      expect(mockConsole.debug).not.toHaveBeenCalled();
      expect(mockConsole.info).not.toHaveBeenCalled();
      expect(mockConsole.warn).not.toHaveBeenCalled();
      expect(mockConsole.error).not.toHaveBeenCalled();
    });

    it('outputs JSON when json is true', () => {
      setLoggerConfig({ json: true });
      const logger = createLogger('Test');

      logger.info('JSON test', { data: 123 });

      expect(mockConsole.info).toHaveBeenCalledTimes(1);
      const output = getFirstCallArg(mockConsole.info);

      // Should be valid JSON
      const parsed = JSON.parse(output) as LogEntry;
      expect(parsed.level).toBe('INFO');
      expect(parsed.context).toBe('Test');
      expect(parsed.message).toBe('JSON test');
      expect(parsed.data).toEqual({ data: 123 });
      expect(parsed.timestamp).toBeDefined();
    });

    it('calls persist handler when configured', () => {
      const persistHandler = vi.fn();
      setLoggerConfig({ persistHandler });
      const logger = createLogger('Test');

      logger.info('Persist test');

      expect(persistHandler).toHaveBeenCalledTimes(1);
      const entry = getFirstCallArg(persistHandler) as unknown as LogEntry;
      expect(entry.level).toBe('INFO');
      expect(entry.message).toBe('Persist test');
    });

    it('handles persist handler errors gracefully', () => {
      const persistHandler = vi.fn(() => {
        throw new Error('Persist failed');
      });
      setLoggerConfig({ persistHandler });
      const logger = createLogger('Test');

      // Should not throw
      expect(() => logger.info('Test')).not.toThrow();
      expect(mockConsole.info).toHaveBeenCalledTimes(1);
    });
  });

  describe('getLoggerConfig', () => {
    it('returns current configuration', () => {
      setLoggerConfig({ minLevel: LogLevel.ERROR, json: true });
      const config = getLoggerConfig();

      expect(config.minLevel).toBe(LogLevel.ERROR);
      expect(config.json).toBe(true);
    });

    it('returns a copy (not the original)', () => {
      const config1 = getLoggerConfig();
      const config2 = getLoggerConfig();

      expect(config1).not.toBe(config2);
      expect(config1).toEqual(config2);
    });
  });

  describe('resetLoggerConfig', () => {
    it('resets to default configuration', () => {
      setLoggerConfig({
        minLevel: LogLevel.SILENT,
        json: true,
        enabled: false,
      });

      resetLoggerConfig();
      const config = getLoggerConfig();

      expect(config.enabled).toBe(true);
      // Default level depends on environment
      expect([LogLevel.DEBUG, LogLevel.INFO]).toContain(config.minLevel);
    });
  });

  describe('parseLogLevel', () => {
    it('parses DEBUG level', () => {
      expect(parseLogLevel('debug')).toBe(LogLevel.DEBUG);
      expect(parseLogLevel('DEBUG')).toBe(LogLevel.DEBUG);
    });

    it('parses INFO level', () => {
      expect(parseLogLevel('info')).toBe(LogLevel.INFO);
      expect(parseLogLevel('INFO')).toBe(LogLevel.INFO);
    });

    it('parses WARN level', () => {
      expect(parseLogLevel('warn')).toBe(LogLevel.WARN);
      expect(parseLogLevel('WARN')).toBe(LogLevel.WARN);
      expect(parseLogLevel('warning')).toBe(LogLevel.WARN);
      expect(parseLogLevel('WARNING')).toBe(LogLevel.WARN);
    });

    it('parses ERROR level', () => {
      expect(parseLogLevel('error')).toBe(LogLevel.ERROR);
      expect(parseLogLevel('ERROR')).toBe(LogLevel.ERROR);
    });

    it('parses SILENT level', () => {
      expect(parseLogLevel('silent')).toBe(LogLevel.SILENT);
      expect(parseLogLevel('SILENT')).toBe(LogLevel.SILENT);
      expect(parseLogLevel('none')).toBe(LogLevel.SILENT);
      expect(parseLogLevel('off')).toBe(LogLevel.SILENT);
    });

    it('defaults to INFO for unknown values', () => {
      expect(parseLogLevel('unknown')).toBe(LogLevel.INFO);
      expect(parseLogLevel('')).toBe(LogLevel.INFO);
      expect(parseLogLevel('invalid')).toBe(LogLevel.INFO);
    });
  });

  describe('LogLevel enum', () => {
    it('has correct ordering', () => {
      expect(LogLevel.DEBUG).toBeLessThan(LogLevel.INFO);
      expect(LogLevel.INFO).toBeLessThan(LogLevel.WARN);
      expect(LogLevel.WARN).toBeLessThan(LogLevel.ERROR);
      expect(LogLevel.ERROR).toBeLessThan(LogLevel.SILENT);
    });

    it('has numeric values', () => {
      expect(LogLevel.DEBUG).toBe(0);
      expect(LogLevel.INFO).toBe(1);
      expect(LogLevel.WARN).toBe(2);
      expect(LogLevel.ERROR).toBe(3);
      expect(LogLevel.SILENT).toBe(4);
    });
  });

  describe('Logger interface', () => {
    it('satisfies Logger type', () => {
      const logger: Logger = createLogger('TypeTest');

      expect(logger.context).toBe('TypeTest');
      expect(typeof logger.debug).toBe('function');
      expect(typeof logger.info).toBe('function');
      expect(typeof logger.warn).toBe('function');
      expect(typeof logger.error).toBe('function');
      expect(typeof logger.child).toBe('function');
    });
  });

  describe('edge cases', () => {
    it('handles empty message', () => {
      const logger = createLogger('Test');
      logger.info('');

      expect(mockConsole.info).toHaveBeenCalledTimes(1);
    });

    it('handles undefined data', () => {
      const logger = createLogger('Test');
      logger.info('Message', undefined);

      expect(mockConsole.info).toHaveBeenCalledTimes(1);
    });

    it('handles empty data object', () => {
      const logger = createLogger('Test');
      logger.info('Message', {});

      expect(mockConsole.info).toHaveBeenCalledTimes(1);
    });

    it('handles complex nested data', () => {
      const logger = createLogger('Test');
      logger.info('Nested', {
        level1: {
          level2: {
            level3: 'deep',
          },
        },
        array: [1, 2, { nested: true }],
      });

      expect(mockConsole.info).toHaveBeenCalledTimes(1);
      const output = getFirstCallArg(mockConsole.info);
      expect(output).toContain('deep');
      expect(output).toContain('nested');
    });

    it('handles special characters in context', () => {
      const logger = createLogger('Test/Component:Sub');
      logger.info('Message');

      expect(mockConsole.info).toHaveBeenCalledTimes(1);
      const output = getFirstCallArg(mockConsole.info);
      expect(output).toContain('Test/Component:Sub');
    });

    it('handles circular references in Error', () => {
      const logger = createLogger('Test');
      const error = new Error('Circular');
      // Error objects don't normally have circular refs, but let's test serialization
      logger.error('Error test', { error });

      expect(mockConsole.error).toHaveBeenCalledTimes(1);
    });
  });
});
