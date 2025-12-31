import { useCallback, useState } from 'react';

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

const defaultState: ConfirmDialogState = {
  isOpen: false,
  title: '',
  description: '',
  onConfirm: () => {},
};

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
    setState({ ...options, isOpen: true });
  }, []);

  const close = useCallback(() => {
    setState(defaultState);
    setLoading(false);
  }, []);

  const handleConfirm = useCallback(async () => {
    setLoading(true);
    try {
      await state.onConfirm();
      close();
    } catch (error) {
      setLoading(false);
      throw error;
    }
  }, [state.onConfirm, close]);

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
