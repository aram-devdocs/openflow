import { cn } from '@openflow/utils';
import { AlertTriangle, Trash2 } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Button } from '../atoms/Button';
import { Icon } from '../atoms/Icon';
import { Dialog, DialogContent, DialogFooter } from '../molecules/Dialog';

export interface ConfirmDialogProps {
  /** Whether the dialog is open */
  isOpen: boolean;
  /** Callback when the dialog should close */
  onClose: () => void;
  /** Callback when the user confirms the action */
  onConfirm: () => void;
  /** Dialog title */
  title: string;
  /** Description of the action and its consequences */
  description: string;
  /** Text for the confirm button */
  confirmLabel?: string;
  /** Text for the cancel button */
  cancelLabel?: string;
  /** Visual variant for the dialog */
  variant?: 'default' | 'destructive' | 'warning';
  /** Whether the confirm action is in progress */
  loading?: boolean;
  /** Custom icon to display */
  icon?: LucideIcon;
}

const variantConfig = {
  default: {
    icon: AlertTriangle,
    iconClass: 'text-[rgb(var(--info))] bg-[rgb(var(--info))]/10',
    buttonVariant: 'primary' as const,
  },
  destructive: {
    icon: Trash2,
    iconClass: 'text-[rgb(var(--destructive))] bg-[rgb(var(--destructive))]/10',
    buttonVariant: 'destructive' as const,
  },
  warning: {
    icon: AlertTriangle,
    iconClass: 'text-[rgb(var(--warning))] bg-[rgb(var(--warning))]/10',
    buttonVariant: 'primary' as const,
  },
};

/**
 * Confirmation dialog for destructive and important actions.
 * Stateless - receives all data via props, emits actions via callbacks.
 *
 * @example
 * <ConfirmDialog
 *   isOpen={isOpen}
 *   onClose={handleClose}
 *   onConfirm={handleDelete}
 *   title="Delete Task"
 *   description="Are you sure you want to delete this task? This action cannot be undone."
 *   confirmLabel="Delete"
 *   variant="destructive"
 *   loading={isDeleting}
 * />
 *
 * @example
 * <ConfirmDialog
 *   isOpen={isOpen}
 *   onClose={handleClose}
 *   onConfirm={handleArchive}
 *   title="Archive Task"
 *   description="Archive this task? You can restore it later from the archive."
 *   confirmLabel="Archive"
 *   variant="warning"
 *   icon={Archive}
 * />
 */
export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'default',
  loading = false,
  icon: CustomIcon,
}: ConfirmDialogProps) {
  const config = variantConfig[variant];
  const IconComponent = CustomIcon ?? config.icon;

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="sm"
      showCloseButton={false}
      closeOnBackdropClick={!loading}
      closeOnEscape={!loading}
    >
      <DialogContent className="pt-2">
        <div className="flex flex-col items-center text-center">
          {/* Icon */}
          <div className={cn('mb-4 rounded-full p-3', config.iconClass)}>
            <Icon icon={IconComponent} size="md" />
          </div>

          {/* Description */}
          <p className="text-sm text-[rgb(var(--muted-foreground))]">{description}</p>
        </div>
      </DialogContent>

      <DialogFooter className="flex-col gap-2 sm:flex-row">
        <Button
          variant="secondary"
          onClick={onClose}
          disabled={loading}
          className="w-full sm:w-auto sm:flex-1"
        >
          {cancelLabel}
        </Button>
        <Button
          variant={config.buttonVariant}
          onClick={onConfirm}
          loading={loading}
          className="w-full sm:w-auto sm:flex-1"
        >
          {confirmLabel}
        </Button>
      </DialogFooter>
    </Dialog>
  );
}

ConfirmDialog.displayName = 'ConfirmDialog';
