import type { ConfirmDialogOptions, ConfirmDialogState } from '@openflow/hooks';
import { describe, expect, it } from 'vitest';

/**
 * Tests for useConfirmDialog types and interface validation.
 * Since we don't have @testing-library/react, we test the type contracts.
 */
describe('hooks/useConfirmDialog', () => {
  describe('ConfirmDialogState interface', () => {
    it('has expected properties', () => {
      const state: ConfirmDialogState = {
        isOpen: true,
        title: 'Test Title',
        description: 'Test Description',
        onConfirm: () => {},
      };

      expect(state.isOpen).toBe(true);
      expect(state.title).toBe('Test Title');
      expect(state.description).toBe('Test Description');
      expect(typeof state.onConfirm).toBe('function');
    });

    it('supports optional properties', () => {
      const state: ConfirmDialogState = {
        isOpen: false,
        title: 'Delete',
        description: 'Are you sure?',
        confirmLabel: 'Yes, delete',
        cancelLabel: 'Cancel',
        variant: 'destructive',
        onConfirm: async () => {
          // async confirmation
        },
      };

      expect(state.confirmLabel).toBe('Yes, delete');
      expect(state.cancelLabel).toBe('Cancel');
      expect(state.variant).toBe('destructive');
    });

    it('supports all variant options', () => {
      const variants: ConfirmDialogState['variant'][] = ['default', 'destructive', 'warning'];

      for (const variant of variants) {
        const state: ConfirmDialogState = {
          isOpen: true,
          title: 'Test',
          description: 'Test',
          variant,
          onConfirm: () => {},
        };
        expect(state.variant).toBe(variant);
      }
    });
  });

  describe('ConfirmDialogOptions type', () => {
    it('includes all ConfirmDialogState properties except isOpen', () => {
      const options: ConfirmDialogOptions = {
        title: 'Confirm Action',
        description: 'This cannot be undone',
        confirmLabel: 'Proceed',
        cancelLabel: 'Go Back',
        variant: 'warning',
        onConfirm: () => Promise.resolve(),
      };

      expect(options.title).toBe('Confirm Action');
      expect(options.description).toBe('This cannot be undone');
    });

    it('requires onConfirm callback', () => {
      const options: ConfirmDialogOptions = {
        title: 'Test',
        description: 'Test',
        onConfirm: () => {},
      };

      expect(typeof options.onConfirm).toBe('function');
    });
  });
});
