import { TauriContextError, invoke, isTauriContext, resetTransport } from '@openflow/queries';
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
      // The message now mentions HTTP transport as the fallback
      expect(error.message).toContain('HTTP transport');
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
      // Reset transport to ensure clean state for each test
      resetTransport();
    });

    afterEach(() => {
      // Restore window
      if (originalWindow) {
        global.window = originalWindow;
      } else {
        // @ts-expect-error - setting window to undefined for cleanup
        global.window = undefined;
      }
      // Reset transport after each test
      resetTransport();
    });

    it('calls tauriInvoke when in Tauri context', async () => {
      global.window = {
        __TAURI_INTERNALS__: {},
      } as unknown as Window & typeof globalThis;

      const { invoke: tauriInvoke } = await import('@tauri-apps/api/core');
      const mockInvoke = tauriInvoke as ReturnType<typeof vi.fn>;
      mockInvoke.mockResolvedValueOnce({ result: 'success' });

      // Use a real command name for consistency
      const result = await invoke('list_projects', {});

      expect(mockInvoke).toHaveBeenCalledWith('list_projects', {});
      expect(result).toEqual({ result: 'success' });
    });

    it('passes through arguments correctly', async () => {
      global.window = {
        __TAURI_INTERNALS__: {},
      } as unknown as Window & typeof globalThis;

      const { invoke: tauriInvoke } = await import('@tauri-apps/api/core');
      const mockInvoke = tauriInvoke as ReturnType<typeof vi.fn>;
      mockInvoke.mockResolvedValueOnce(null);

      const args = { id: '123' };
      await invoke('get_project', args);

      expect(mockInvoke).toHaveBeenCalledWith('get_project', args);
    });

    it('works without arguments', async () => {
      global.window = {
        __TAURI_INTERNALS__: {},
      } as unknown as Window & typeof globalThis;

      const { invoke: tauriInvoke } = await import('@tauri-apps/api/core');
      const mockInvoke = tauriInvoke as ReturnType<typeof vi.fn>;
      mockInvoke.mockResolvedValueOnce([]);

      await invoke('list_projects');

      expect(mockInvoke).toHaveBeenCalledWith('list_projects', undefined);
    });

    it('propagates errors from Tauri', async () => {
      global.window = {
        __TAURI_INTERNALS__: {},
      } as unknown as Window & typeof globalThis;

      const { invoke: tauriInvoke } = await import('@tauri-apps/api/core');
      const mockInvoke = tauriInvoke as ReturnType<typeof vi.fn>;
      mockInvoke.mockRejectedValueOnce(new Error('Backend error'));

      // Use a real command name
      await expect(invoke('list_projects')).rejects.toThrow('Backend error');
    });
  });
});
