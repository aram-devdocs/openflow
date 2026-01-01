import { Box, type ResponsiveValue, Text, VisuallyHidden } from '@openflow/primitives';
import { cn } from '@openflow/utils';
import { AlertTriangle, Trash2 } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { type HTMLAttributes, forwardRef } from 'react';
import { Button } from '../atoms/Button';
import { Icon } from '../atoms/Icon';
import { Dialog, DialogContent, DialogFooter, type DialogSize } from '../molecules/Dialog';

// ============================================================================
// Types
// ============================================================================

export type ConfirmDialogVariant = 'default' | 'destructive' | 'warning';
export type ConfirmDialogSize = 'sm' | 'md' | 'lg';
export type ConfirmDialogBreakpoint = 'base' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

export interface ConfirmDialogProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title' | 'role'> {
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
  variant?: ConfirmDialogVariant;
  /** Whether the confirm action is in progress */
  loading?: boolean;
  /** Custom icon to display */
  icon?: LucideIcon;
  /** Responsive size of the dialog */
  size?: ResponsiveValue<ConfirmDialogSize>;
  /** Accessible label for confirm button when different from visible text */
  confirmAriaLabel?: string;
  /** Accessible label for cancel button when different from visible text */
  cancelAriaLabel?: string;
  /** Data attributes for testing */
  'data-testid'?: string;
}

// ============================================================================
// Constants
// ============================================================================

/**
 * Breakpoint order for responsive class generation
 */
const BREAKPOINT_ORDER = ['base', 'sm', 'md', 'lg', 'xl', '2xl'] as const;

/**
 * Default label for confirm button
 */
export const DEFAULT_CONFIRM_LABEL = 'Confirm';

/**
 * Default label for cancel button
 */
export const DEFAULT_CANCEL_LABEL = 'Cancel';

/**
 * Screen reader announcement prefix for destructive actions
 */
export const SR_DESTRUCTIVE_WARNING = 'Warning: This is a destructive action.';

/**
 * Screen reader announcement prefix for warning actions
 */
export const SR_WARNING_NOTICE = 'Caution: Please review before proceeding.';

/**
 * Screen reader announcement for loading state
 */
export const SR_PROCESSING = 'Processing, please wait...';

/**
 * Screen reader announcement for action completed
 */
export const SR_COMPLETED = 'Action completed.';

/**
 * Variant configuration for icons and styling
 */
export const VARIANT_CONFIG: Record<
  ConfirmDialogVariant,
  {
    icon: LucideIcon;
    iconClass: string;
    buttonVariant: 'primary' | 'destructive';
    srAnnouncement: string;
  }
> = {
  default: {
    icon: AlertTriangle,
    iconClass: 'text-[rgb(var(--info))] bg-[rgb(var(--info))]/10',
    buttonVariant: 'primary',
    srAnnouncement: '',
  },
  destructive: {
    icon: Trash2,
    iconClass: 'text-[rgb(var(--destructive))] bg-[rgb(var(--destructive))]/10',
    buttonVariant: 'destructive',
    srAnnouncement: SR_DESTRUCTIVE_WARNING,
  },
  warning: {
    icon: AlertTriangle,
    iconClass: 'text-[rgb(var(--warning))] bg-[rgb(var(--warning))]/10',
    buttonVariant: 'primary',
    srAnnouncement: SR_WARNING_NOTICE,
  },
};

/**
 * Size mapping from ConfirmDialogSize to DialogSize
 */
export const SIZE_TO_DIALOG_SIZE: Record<ConfirmDialogSize, DialogSize> = {
  sm: 'sm',
  md: 'md',
  lg: 'lg',
};

/**
 * Base classes for the content container
 */
export const CONFIRM_DIALOG_CONTENT_CLASSES = 'flex flex-col items-center text-center';

/**
 * Icon container size classes by size
 */
export const ICON_CONTAINER_SIZE_CLASSES: Record<ConfirmDialogSize, string> = {
  sm: 'p-2 mb-3',
  md: 'p-3 mb-4',
  lg: 'p-4 mb-5',
};

/**
 * Icon size mapping by dialog size
 */
export const ICON_SIZE_MAP: Record<ConfirmDialogSize, 'sm' | 'md' | 'lg'> = {
  sm: 'sm',
  md: 'md',
  lg: 'lg',
};

/**
 * Description text size classes by size
 */
export const DESCRIPTION_SIZE_CLASSES: Record<ConfirmDialogSize, 'sm' | 'base' | 'lg'> = {
  sm: 'sm',
  md: 'sm',
  lg: 'base',
};

/**
 * Base icon container classes (non-size specific)
 */
export const ICON_CONTAINER_BASE_CLASSES = 'rounded-full';

/**
 * Footer layout classes - responsive stacking
 */
export const FOOTER_LAYOUT_CLASSES = 'flex-col gap-2 sm:flex-row';

/**
 * Button base classes for full width on mobile
 */
export const BUTTON_RESPONSIVE_CLASSES = 'w-full sm:w-auto sm:flex-1';

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Get the base size from a responsive value
 */
export function getBaseSize(
  size: ResponsiveValue<ConfirmDialogSize> | undefined
): ConfirmDialogSize {
  if (size === undefined) {
    return 'sm';
  }

  if (typeof size === 'string') {
    return size as ConfirmDialogSize;
  }

  if (typeof size === 'object' && size !== null) {
    const sizeObj = size as Partial<Record<ConfirmDialogBreakpoint, ConfirmDialogSize>>;
    return sizeObj.base ?? 'sm';
  }

  return 'sm';
}

/**
 * Generate responsive size classes for icon container
 */
export function getResponsiveSizeClasses(
  size: ResponsiveValue<ConfirmDialogSize> | undefined
): string {
  if (size === undefined) {
    return ICON_CONTAINER_SIZE_CLASSES.sm;
  }

  if (typeof size === 'string') {
    return ICON_CONTAINER_SIZE_CLASSES[size];
  }

  if (typeof size === 'object' && size !== null) {
    const classes: string[] = [];
    const sizeObj = size as Partial<Record<ConfirmDialogBreakpoint, ConfirmDialogSize>>;

    for (const breakpoint of BREAKPOINT_ORDER) {
      const breakpointValue = sizeObj[breakpoint];
      if (breakpointValue !== undefined) {
        const sizeClass = ICON_CONTAINER_SIZE_CLASSES[breakpointValue];
        if (breakpoint === 'base') {
          classes.push(sizeClass);
        } else {
          // Add breakpoint prefix to each class
          const parts = sizeClass.split(' ');
          classes.push(...parts.map((c) => `${breakpoint}:${c}`));
        }
      }
    }
    return classes.join(' ');
  }

  return ICON_CONTAINER_SIZE_CLASSES.sm;
}

/**
 * Get dialog size from ConfirmDialogSize
 */
export function getDialogSize(
  size: ResponsiveValue<ConfirmDialogSize> | undefined
): ResponsiveValue<DialogSize> {
  if (size === undefined) {
    return 'sm';
  }

  if (typeof size === 'string') {
    return SIZE_TO_DIALOG_SIZE[size];
  }

  if (typeof size === 'object' && size !== null) {
    const result: Partial<Record<ConfirmDialogBreakpoint, DialogSize>> = {};
    const sizeObj = size as Partial<Record<ConfirmDialogBreakpoint, ConfirmDialogSize>>;

    for (const breakpoint of BREAKPOINT_ORDER) {
      const breakpointValue = sizeObj[breakpoint];
      if (breakpointValue !== undefined) {
        result[breakpoint] = SIZE_TO_DIALOG_SIZE[breakpointValue];
      }
    }
    return result as ResponsiveValue<DialogSize>;
  }

  return 'sm';
}

/**
 * Get accessible label for confirm button based on variant
 */
export function getConfirmAccessibleLabel(
  confirmLabel: string,
  variant: ConfirmDialogVariant,
  customAriaLabel?: string
): string {
  if (customAriaLabel) {
    return customAriaLabel;
  }

  if (variant === 'destructive') {
    return `${confirmLabel} (destructive action)`;
  }

  return confirmLabel;
}

/**
 * Build screen reader announcement for dialog open
 */
export function buildDialogAnnouncement(
  title: string,
  description: string,
  variant: ConfirmDialogVariant
): string {
  const config = VARIANT_CONFIG[variant];
  const parts: string[] = [];

  if (config.srAnnouncement) {
    parts.push(config.srAnnouncement);
  }

  parts.push(`${title}.`);
  parts.push(description);

  return parts.join(' ');
}

// ============================================================================
// ConfirmDialog Component
// ============================================================================

/**
 * Confirmation dialog for destructive and important actions.
 * Stateless - receives all data via props, emits actions via callbacks.
 *
 * Accessibility features:
 * - Inherits Dialog focus trap, escape key handling, and ARIA attributes
 * - Screen reader announcements for destructive/warning variants
 * - Loading state announced to screen readers
 * - Button order: Cancel first on mobile (stacked), Cancel left on desktop
 * - Confirm button has enhanced accessible label for destructive actions
 * - Touch targets ≥44px via Dialog molecule
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
 *
 * @example
 * // Responsive sizing
 * <ConfirmDialog
 *   isOpen={isOpen}
 *   onClose={handleClose}
 *   onConfirm={handleConfirm}
 *   title="Confirm"
 *   description="Are you sure?"
 *   size={{ base: 'sm', md: 'md' }}
 * />
 */
export const ConfirmDialog = forwardRef<HTMLDivElement, ConfirmDialogProps>(function ConfirmDialog(
  {
    isOpen,
    onClose,
    onConfirm,
    title,
    description,
    confirmLabel = DEFAULT_CONFIRM_LABEL,
    cancelLabel = DEFAULT_CANCEL_LABEL,
    variant = 'default',
    loading = false,
    icon: CustomIcon,
    size = 'sm',
    confirmAriaLabel,
    cancelAriaLabel,
    className,
    'data-testid': dataTestId,
    ...props
  },
  ref
) {
  const config = VARIANT_CONFIG[variant];
  const IconComponent = CustomIcon ?? config.icon;
  const baseSize = getBaseSize(size);
  const iconContainerClasses = getResponsiveSizeClasses(size);
  const dialogSize = getDialogSize(size);

  return (
    <Dialog
      ref={ref}
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size={dialogSize}
      showCloseButton={false}
      closeOnBackdropClick={!loading}
      closeOnEscape={!loading}
      data-testid={dataTestId}
      className={className}
      {...props}
    >
      {/* Screen reader announcement for variant-specific warnings */}
      {config.srAnnouncement && (
        <VisuallyHidden>
          <Text as="span" role="status" aria-live="assertive">
            {config.srAnnouncement}
          </Text>
        </VisuallyHidden>
      )}

      {/* Loading state announcement */}
      {loading && (
        <VisuallyHidden>
          <Text as="span" role="status" aria-live="polite">
            {SR_PROCESSING}
          </Text>
        </VisuallyHidden>
      )}

      <DialogContent
        className="pt-2"
        data-testid={dataTestId ? `${dataTestId}-content` : undefined}
      >
        <Box
          className={CONFIRM_DIALOG_CONTENT_CLASSES}
          data-testid={dataTestId ? `${dataTestId}-body` : undefined}
        >
          {/* Icon */}
          <Box
            className={cn(ICON_CONTAINER_BASE_CLASSES, iconContainerClasses, config.iconClass)}
            aria-hidden="true"
            data-testid={dataTestId ? `${dataTestId}-icon` : undefined}
          >
            <Icon icon={IconComponent} size={ICON_SIZE_MAP[baseSize]} />
          </Box>

          {/* Description */}
          <Text
            size={DESCRIPTION_SIZE_CLASSES[baseSize]}
            color="muted-foreground"
            data-testid={dataTestId ? `${dataTestId}-description` : undefined}
          >
            {description}
          </Text>
        </Box>
      </DialogContent>

      <DialogFooter
        className={FOOTER_LAYOUT_CLASSES}
        data-testid={dataTestId ? `${dataTestId}-footer` : undefined}
      >
        {/* Cancel button - first in DOM for mobile stacking (appears on top)
              Platform convention: Cancel on left/top for safety */}
        <Button
          variant="secondary"
          onClick={onClose}
          disabled={loading}
          className={BUTTON_RESPONSIVE_CLASSES}
          aria-label={cancelAriaLabel}
          data-testid={dataTestId ? `${dataTestId}-cancel` : undefined}
        >
          {cancelLabel}
        </Button>

        {/* Confirm button - second in DOM, appears on right/bottom */}
        <Button
          variant={config.buttonVariant}
          onClick={onConfirm}
          loading={loading}
          className={BUTTON_RESPONSIVE_CLASSES}
          aria-label={getConfirmAccessibleLabel(confirmLabel, variant, confirmAriaLabel)}
          data-testid={dataTestId ? `${dataTestId}-confirm` : undefined}
        >
          {confirmLabel}
        </Button>
      </DialogFooter>
    </Dialog>
  );
});

ConfirmDialog.displayName = 'ConfirmDialog';
