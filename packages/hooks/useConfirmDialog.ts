/**
 * useConfirmDialog - Hook for managing confirmation dialog state
 *
 * Provides a simple API to trigger confirmation dialogs and handle async actions.
 *
 * Features:
 * - Full logging at DEBUG/INFO/ERROR levels
 * - Loading state management for async confirmations
 * - Clean error propagation for caller handling
 */

import { createLogger } from '@openflow/utils';
import { useCallback, useState } from 'react';

// ============================================================================
// Logger
// ============================================================================

const logger = createLogger('useConfirmDialog');

// ============================================================================
// Types
// ============================================================================

export interface ConfirmDialogState {
  isOpen: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'default' | 'destructive' | 'warning';
  onConfirm: () => void | Promise<void>;
}

export type ConfirmDialogOptions = Omit<ConfirmDialogState, 'isOpen'>;

// ============================================================================
// Constants
// ============================================================================

const defaultState: ConfirmDialogState = {
  isOpen: false,
  title: '',
  description: '',
  onConfirm: () => {},
};

// ============================================================================
// Hook
// ============================================================================

/**
 * Hook for managing confirmation dialog state.
 * Provides a simple API to trigger confirmation dialogs and handle async actions.
 *
 * @example
 * const { dialogProps, confirm } = useConfirmDialog();
 *
 * const handleDeleteTask = (task: Task) => {
 *   confirm({
 *     title: 'Delete Task',
 *     description: `Are you sure you want to delete "${task.title}"? This action cannot be undone.`,
 *     confirmLabel: 'Delete',
 *     variant: 'destructive',
 *     onConfirm: async () => {
 *       await deleteTaskMutation.mutateAsync(task.id);
 *       toast({ title: 'Task deleted', variant: 'success' });
 *     },
 *   });
 * };
 *
 * // In render
 * <ConfirmDialog {...dialogProps} />
 */
export function useConfirmDialog() {
  const [state, setState] = useState<ConfirmDialogState>(defaultState);
  const [loading, setLoading] = useState(false);

  const confirm = useCallback((options: ConfirmDialogOptions) => {
    logger.debug('Opening confirmation dialog', {
      title: options.title,
      variant: options.variant ?? 'default',
      hasConfirmLabel: !!options.confirmLabel,
      hasCancelLabel: !!options.cancelLabel,
    });
    setState({ ...options, isOpen: true });
  }, []);

  const close = useCallback(() => {
    logger.debug('Closing confirmation dialog', {
      wasOpen: state.isOpen,
      wasLoading: loading,
      title: state.title,
    });
    setState(defaultState);
    setLoading(false);
  }, [state.isOpen, state.title, loading]);

  const handleConfirm = useCallback(async () => {
    logger.debug('Confirm action triggered', {
      title: state.title,
      variant: state.variant ?? 'default',
    });

    setLoading(true);
    try {
      await state.onConfirm();
      logger.info('Confirmation action completed successfully', {
        title: state.title,
      });
      close();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Confirmation action failed', {
        title: state.title,
        error: errorMessage,
      });
      setLoading(false);
      // Re-throw to allow caller to handle (e.g., show toast, keep dialog open)
      throw error;
    }
  }, [state.onConfirm, state.title, state.variant, close]);

  return {
    /** Current dialog state */
    state: { ...state, loading },
    /** Open a confirmation dialog with the given options */
    confirm,
    /** Close the dialog */
    close,
    /** Handle the confirm action (wraps onConfirm with loading state) */
    handleConfirm,
    /** Props to spread on ConfirmDialog component */
    dialogProps: {
      isOpen: state.isOpen,
      onClose: close,
      onConfirm: handleConfirm,
      title: state.title,
      description: state.description,
      confirmLabel: state.confirmLabel,
      cancelLabel: state.cancelLabel,
      variant: state.variant,
      loading,
    },
  };
}
