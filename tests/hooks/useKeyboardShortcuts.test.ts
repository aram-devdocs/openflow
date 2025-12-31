import { getShortcutLabel, globalShortcuts, taskViewShortcuts } from '@openflow/hooks';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

describe('hooks/useKeyboardShortcuts', () => {
  const originalNavigator = global.navigator;

  afterEach(() => {
    // Restore navigator
    Object.defineProperty(global, 'navigator', {
      value: originalNavigator,
      configurable: true,
    });
  });

  describe('getShortcutLabel', () => {
    describe('on Mac', () => {
      beforeEach(() => {
        Object.defineProperty(global, 'navigator', {
          value: { platform: 'MacIntel' },
          configurable: true,
        });
      });

      it('uses Mac symbols', () => {
        expect(getShortcutLabel({ key: 'k', meta: true })).toBe('⌘K');
      });

      it('combines multiple modifiers', () => {
        expect(getShortcutLabel({ key: 'Enter', meta: true, shift: true })).toBe('⌘⇧↵');
      });

      it('formats special keys', () => {
        expect(getShortcutLabel({ key: 'Escape' })).toBe('Esc');
        expect(getShortcutLabel({ key: 'ArrowUp' })).toBe('↑');
        expect(getShortcutLabel({ key: 'Backspace' })).toBe('⌫');
      });

      it('includes alt symbol', () => {
        expect(getShortcutLabel({ key: 'a', alt: true })).toBe('⌥A');
      });
    });

    describe('on Windows/Linux', () => {
      beforeEach(() => {
        Object.defineProperty(global, 'navigator', {
          value: { platform: 'Win32' },
          configurable: true,
        });
      });

      it('uses Ctrl prefix', () => {
        expect(getShortcutLabel({ key: 'k', meta: true })).toBe('Ctrl+K');
      });

      it('combines multiple modifiers', () => {
        expect(getShortcutLabel({ key: 'Enter', meta: true, shift: true })).toBe('Ctrl+Shift+↵');
      });

      it('uses Alt', () => {
        expect(getShortcutLabel({ key: 'a', alt: true })).toBe('Alt+A');
      });
    });
  });

  describe('globalShortcuts', () => {
    it('defines command palette shortcut', () => {
      expect(globalShortcuts.commandPalette).toEqual({ key: 'k', meta: true });
    });

    it('defines new task shortcut', () => {
      expect(globalShortcuts.newTask).toEqual({ key: 'n', meta: true });
    });

    it('defines settings shortcut', () => {
      expect(globalShortcuts.settings).toEqual({ key: ',', meta: true });
    });

    it('defines toggle terminal shortcut', () => {
      expect(globalShortcuts.toggleTerminal).toEqual({ key: '`', meta: true });
    });

    it('defines escape shortcut', () => {
      expect(globalShortcuts.escape).toEqual({ key: 'Escape' });
    });
  });

  describe('taskViewShortcuts', () => {
    it('defines send message shortcut', () => {
      expect(taskViewShortcuts.sendMessage).toEqual({ key: 'Enter', meta: true });
    });

    it('defines send and start next shortcut', () => {
      expect(taskViewShortcuts.sendAndStartNext).toEqual({ key: 'Enter', meta: true, shift: true });
    });

    it('defines save step shortcut', () => {
      expect(taskViewShortcuts.saveStep).toEqual({ key: 's', meta: true });
    });

    it('defines quick actions shortcut', () => {
      expect(taskViewShortcuts.quickActions).toEqual({ key: '.', meta: true });
    });

    it('defines navigation shortcuts', () => {
      expect(taskViewShortcuts.navigateUp).toEqual({ key: 'ArrowUp' });
      expect(taskViewShortcuts.navigateDown).toEqual({ key: 'ArrowDown' });
    });

    it('defines start step shortcut', () => {
      expect(taskViewShortcuts.startStep).toEqual({ key: 'Enter' });
    });
  });
});
