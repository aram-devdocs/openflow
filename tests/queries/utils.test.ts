import { TauriContextError, invoke, isTauriContext } from '@openflow/queries';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Mock the Tauri API
vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(),
}));

describe('queries/utils', () => {
  describe('TauriContextError', () => {
    it('creates error with correct name', () => {
      const error = new TauriContextError();
      expect(error.name).toBe('TauriContextError');
    });

    it('creates error with descriptive message', () => {
      const error = new TauriContextError();
      expect(error.message).toContain('Tauri context is not available');
      expect(error.message).toContain('desktop app');
    });

    it('is an instance of Error', () => {
      const error = new TauriContextError();
      expect(error).toBeInstanceOf(Error);
    });
  });

  describe('isTauriContext', () => {
    const originalWindow = global.window;

    afterEach(() => {
      // Restore window
      if (originalWindow) {
        global.window = originalWindow;
      } else {
        // @ts-expect-error - setting window to undefined for cleanup
        global.window = undefined;
      }
    });

    it('returns false when window is undefined', () => {
      // @ts-expect-error - testing undefined window
      global.window = undefined;
      expect(isTauriContext()).toBe(false);
    });

    it('returns false when __TAURI_INTERNALS__ is not present', () => {
      global.window = {} as Window & typeof globalThis;
      expect(isTauriContext()).toBe(false);
    });

    it('returns true when __TAURI_INTERNALS__ is present', () => {
      global.window = {
        __TAURI_INTERNALS__: {},
      } as unknown as Window & typeof globalThis;
      expect(isTauriContext()).toBe(true);
    });
  });

  describe('invoke', () => {
    const originalWindow = global.window;

    beforeEach(() => {
      vi.clearAllMocks();
    });

    afterEach(() => {
      // Restore window
      if (originalWindow) {
        global.window = originalWindow;
      } else {
        // @ts-expect-error - setting window to undefined for cleanup
        global.window = undefined;
      }
    });

    it('throws TauriContextError when not in Tauri context', async () => {
      // @ts-expect-error - testing undefined window
      global.window = undefined;
      await expect(invoke('test_command')).rejects.toThrow(TauriContextError);
    });

    it('throws TauriContextError with descriptive message', async () => {
      global.window = {} as Window & typeof globalThis;
      await expect(invoke('test_command')).rejects.toThrow('Tauri context is not available');
    });

    it('calls tauriInvoke when in Tauri context', async () => {
      global.window = {
        __TAURI_INTERNALS__: {},
      } as unknown as Window & typeof globalThis;

      const { invoke: tauriInvoke } = await import('@tauri-apps/api/core');
      const mockInvoke = tauriInvoke as ReturnType<typeof vi.fn>;
      mockInvoke.mockResolvedValueOnce({ result: 'success' });

      const result = await invoke('test_command', { key: 'value' });

      expect(mockInvoke).toHaveBeenCalledWith('test_command', { key: 'value' });
      expect(result).toEqual({ result: 'success' });
    });

    it('passes through arguments correctly', async () => {
      global.window = {
        __TAURI_INTERNALS__: {},
      } as unknown as Window & typeof globalThis;

      const { invoke: tauriInvoke } = await import('@tauri-apps/api/core');
      const mockInvoke = tauriInvoke as ReturnType<typeof vi.fn>;
      mockInvoke.mockResolvedValueOnce(null);

      const args = { id: '123', data: { nested: true } };
      await invoke('complex_command', args);

      expect(mockInvoke).toHaveBeenCalledWith('complex_command', args);
    });

    it('works without arguments', async () => {
      global.window = {
        __TAURI_INTERNALS__: {},
      } as unknown as Window & typeof globalThis;

      const { invoke: tauriInvoke } = await import('@tauri-apps/api/core');
      const mockInvoke = tauriInvoke as ReturnType<typeof vi.fn>;
      mockInvoke.mockResolvedValueOnce([]);

      await invoke('no_args_command');

      expect(mockInvoke).toHaveBeenCalledWith('no_args_command', undefined);
    });

    it('propagates errors from Tauri', async () => {
      global.window = {
        __TAURI_INTERNALS__: {},
      } as unknown as Window & typeof globalThis;

      const { invoke: tauriInvoke } = await import('@tauri-apps/api/core');
      const mockInvoke = tauriInvoke as ReturnType<typeof vi.fn>;
      mockInvoke.mockRejectedValueOnce(new Error('Backend error'));

      await expect(invoke('failing_command')).rejects.toThrow('Backend error');
    });
  });
});
