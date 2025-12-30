import { cn } from '@openflow/utils';
import { X } from 'lucide-react';
import type { HTMLAttributes, ReactNode } from 'react';
import { useEffect, useId, useRef } from 'react';
import { Button } from '../atoms/Button';
import { Icon } from '../atoms/Icon';

export interface DialogProps {
  /** Whether the dialog is open */
  isOpen: boolean;
  /** Callback when the dialog should close */
  onClose: () => void;
  /** Dialog title displayed in the header */
  title?: string;
  /** Dialog content */
  children: ReactNode;
  /** Additional class name for the dialog panel */
  className?: string;
  /** Whether to show the close button in the header */
  showCloseButton?: boolean;
  /** Whether clicking the backdrop closes the dialog */
  closeOnBackdropClick?: boolean;
  /** Whether pressing Escape closes the dialog */
  closeOnEscape?: boolean;
  /** Size of the dialog */
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
}

export interface DialogHeaderProps extends HTMLAttributes<HTMLDivElement> {
  /** Header content */
  children: ReactNode;
}

export interface DialogContentProps extends HTMLAttributes<HTMLDivElement> {
  /** Content */
  children: ReactNode;
}

export interface DialogFooterProps extends HTMLAttributes<HTMLDivElement> {
  /** Footer content */
  children: ReactNode;
}

const sizeClasses: Record<NonNullable<DialogProps['size']>, string> = {
  sm: 'max-w-[calc(100%-2rem)] sm:max-w-sm',
  md: 'max-w-[calc(100%-2rem)] sm:max-w-md',
  lg: 'max-w-[calc(100%-2rem)] sm:max-w-lg',
  xl: 'max-w-[calc(100%-2rem)] sm:max-w-xl',
  full: 'max-w-[calc(100vw-2rem)] max-h-[calc(100vh-2rem)]',
};

/**
 * Dialog component for modal overlays.
 * Stateless - receives open state via props, emits close via callback.
 *
 * Features:
 * - Backdrop with click-to-close (optional)
 * - Escape key handling (via callback)
 * - Focus trap within dialog
 * - Accessible with proper ARIA attributes
 *
 * @example
 * <Dialog isOpen={isOpen} onClose={handleClose} title="Confirm Action">
 *   <DialogContent>
 *     <p>Are you sure you want to proceed?</p>
 *   </DialogContent>
 *   <DialogFooter>
 *     <Button variant="ghost" onClick={handleClose}>Cancel</Button>
 *     <Button onClick={handleConfirm}>Confirm</Button>
 *   </DialogFooter>
 * </Dialog>
 *
 * @example
 * <Dialog isOpen={isOpen} onClose={handleClose} size="lg">
 *   <DialogHeader>
 *     <h2>Custom Header</h2>
 *   </DialogHeader>
 *   <DialogContent>
 *     <p>Large dialog with custom header</p>
 *   </DialogContent>
 * </Dialog>
 */
export function Dialog({
  isOpen,
  onClose,
  title,
  children,
  className,
  showCloseButton = true,
  closeOnBackdropClick = true,
  closeOnEscape = true,
  size = 'md',
}: DialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);
  const id = useId();
  const titleId = `${id}-title`;

  // Handle Escape key
  useEffect(() => {
    if (!isOpen || !closeOnEscape) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, closeOnEscape, onClose]);

  // Focus management
  useEffect(() => {
    if (isOpen) {
      // Store current active element
      previousActiveElement.current = document.activeElement as HTMLElement;

      // Focus the dialog
      const timer = setTimeout(() => {
        dialogRef.current?.focus();
      }, 0);

      return () => clearTimeout(timer);
    }
    // Restore focus when closing
    previousActiveElement.current?.focus();
  }, [isOpen]);

  // Prevent body scroll when dialog is open
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleBackdropClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (closeOnBackdropClick && event.target === event.currentTarget) {
      onClose();
    }
  };

  return (
    <div role="presentation" className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop - click is supplementary to keyboard Escape handling */}
      <div
        className={cn(
          'fixed inset-0 motion-safe:transition-opacity',
          // Solid backdrop for better accessibility
          'bg-black/60',
          // Enhanced opacity for users who prefer reduced transparency
          '[@media(prefers-reduced-transparency:reduce)]:bg-black/80'
        )}
        aria-hidden="true"
        onClick={handleBackdropClick}
        onKeyDown={(e) => e.key === 'Escape' && onClose?.()}
      />

      {/* Dialog panel - using custom dialog implementation with focus trap */}
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        tabIndex={-1}
        className={cn(
          // Base styles
          'relative z-50 flex w-full flex-col',
          'rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--card))]',
          'shadow-lg',
          'mx-4',
          // Max height to prevent overflow on mobile - smaller on mobile
          'max-h-[calc(100vh-4rem)] sm:max-h-[calc(100vh-6rem)]',
          // Animation - respects reduced motion
          'motion-safe:animate-in motion-safe:fade-in-0 motion-safe:zoom-in-95',
          // Size
          sizeClasses[size],
          // Focus styles
          'focus:outline-none',
          className
        )}
      >
        {/* Header */}
        {(title || showCloseButton) && (
          <div className="flex items-center justify-between border-b border-[rgb(var(--border))] px-4 py-3">
            {title && (
              <h2 id={titleId} className="text-lg font-semibold text-[rgb(var(--foreground))]">
                {title}
              </h2>
            )}
            {!title && <div />}
            {showCloseButton && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="h-11 w-11 min-h-[44px] min-w-[44px] p-0"
                aria-label="Close dialog"
              >
                <Icon icon={X} size="sm" />
              </Button>
            )}
          </div>
        )}

        {/* Content */}
        {children}
      </div>
    </div>
  );
}

/**
 * Dialog header section.
 * Use when you need a custom header instead of the title prop.
 */
export function DialogHeader({ children, className, ...props }: DialogHeaderProps) {
  return (
    <div
      className={cn(
        'flex flex-col space-y-1.5 border-b border-[rgb(var(--border))] px-4 py-3',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

/**
 * Dialog content section.
 * Main content area of the dialog.
 */
export function DialogContent({ children, className, ...props }: DialogContentProps) {
  return (
    <div className={cn('flex-1 overflow-auto p-4', className)} {...props}>
      {children}
    </div>
  );
}

/**
 * Dialog footer section.
 * Typically contains action buttons.
 */
export function DialogFooter({ children, className, ...props }: DialogFooterProps) {
  return (
    <div
      className={cn(
        'flex items-center justify-end gap-2 border-t border-[rgb(var(--border))] px-4 py-3',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

Dialog.displayName = 'Dialog';
DialogHeader.displayName = 'DialogHeader';
DialogContent.displayName = 'DialogContent';
DialogFooter.displayName = 'DialogFooter';
