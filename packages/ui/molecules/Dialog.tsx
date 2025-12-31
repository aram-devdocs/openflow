import { type ResponsiveValue, VisuallyHidden } from '@openflow/primitives';
import { cn } from '@openflow/utils';
import { X } from 'lucide-react';
import {
  type HTMLAttributes,
  type ReactNode,
  forwardRef,
  useCallback,
  useEffect,
  useId,
  useRef,
} from 'react';
import { Button } from '../atoms/Button';
import { Icon } from '../atoms/Icon';

// ============================================================================
// Types
// ============================================================================

export type DialogSize = 'sm' | 'md' | 'lg' | 'xl' | 'full';
export type DialogPadding = '0' | '2' | '3' | '4' | '5' | '6' | '8';

export interface DialogProps extends Omit<HTMLAttributes<HTMLDivElement>, 'role' | 'title'> {
  /** Whether the dialog is open */
  isOpen: boolean;
  /** Callback when the dialog should close */
  onClose: () => void;
  /** Dialog title displayed in the header */
  title?: string;
  /** Dialog content */
  children: ReactNode;
  /** Whether to show the close button in the header */
  showCloseButton?: boolean;
  /** Whether clicking the backdrop closes the dialog */
  closeOnBackdropClick?: boolean;
  /** Whether pressing Escape closes the dialog */
  closeOnEscape?: boolean;
  /** Size of the dialog - responsive value supported */
  size?: ResponsiveValue<DialogSize>;
  /** Accessible label for close button (default: "Close dialog") */
  closeLabel?: string;
  /** Optional description ID for aria-describedby */
  descriptionId?: string;
  /** Data attributes for testing */
  'data-testid'?: string;
}

export interface DialogHeaderProps extends HTMLAttributes<HTMLDivElement> {
  /** Header content */
  children: ReactNode;
  /** Responsive padding - overrides default */
  p?: ResponsiveValue<DialogPadding>;
  /** Data attributes for testing */
  'data-testid'?: string;
}

export interface DialogContentProps extends HTMLAttributes<HTMLDivElement> {
  /** Content */
  children: ReactNode;
  /** Responsive padding - overrides default */
  p?: ResponsiveValue<DialogPadding>;
  /** Data attributes for testing */
  'data-testid'?: string;
}

export interface DialogFooterProps extends HTMLAttributes<HTMLDivElement> {
  /** Footer content */
  children: ReactNode;
  /** Responsive padding - overrides default */
  p?: ResponsiveValue<DialogPadding>;
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
type Breakpoint = (typeof BREAKPOINT_ORDER)[number];

/**
 * Default label for close button (screen reader accessible)
 */
export const DEFAULT_CLOSE_LABEL = 'Close dialog';

/**
 * Size classes for dialog widths
 */
export const DIALOG_SIZE_CLASSES: Record<DialogSize, string> = {
  sm: 'max-w-[calc(100%-2rem)] sm:max-w-sm',
  md: 'max-w-[calc(100%-2rem)] sm:max-w-md',
  lg: 'max-w-[calc(100%-2rem)] sm:max-w-lg',
  xl: 'max-w-[calc(100%-2rem)] sm:max-w-xl',
  full: 'max-w-[calc(100vw-2rem)] max-h-[calc(100vh-2rem)]',
};

/**
 * Base classes for dialog panel
 */
export const DIALOG_PANEL_CLASSES = [
  // Base styles
  'relative z-50 flex w-full flex-col',
  'rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--card))]',
  'shadow-lg',
  'mx-4',
  // Max height to prevent overflow - smaller on mobile
  'max-h-[calc(100vh-4rem)] sm:max-h-[calc(100vh-6rem)]',
  // Animation - respects reduced motion
  'motion-safe:animate-in motion-safe:fade-in-0 motion-safe:zoom-in-95',
  // Focus styles
  'focus:outline-none',
].join(' ');

/**
 * Base classes for dialog backdrop
 */
export const DIALOG_BACKDROP_CLASSES = [
  'fixed inset-0 motion-safe:transition-opacity',
  // Solid backdrop for better accessibility
  'bg-black/60',
  // Enhanced opacity for users who prefer reduced transparency
  '[@media(prefers-reduced-transparency:reduce)]:bg-black/80',
].join(' ');

/**
 * Base classes for dialog header
 */
export const DIALOG_HEADER_CLASSES =
  'flex items-center justify-between border-b border-[rgb(var(--border))]';

/**
 * Base classes for dialog content
 */
export const DIALOG_CONTENT_CLASSES = 'flex-1 overflow-auto scrollbar-thin';

/**
 * Base classes for dialog footer
 */
export const DIALOG_FOOTER_CLASSES =
  'flex items-center justify-end gap-2 border-t border-[rgb(var(--border))]';

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Generate responsive size classes from DialogSize value
 */
export function getResponsiveSizeClasses(size: ResponsiveValue<DialogSize> | undefined): string {
  if (size === undefined) {
    return DIALOG_SIZE_CLASSES.md;
  }

  if (typeof size === 'string') {
    return DIALOG_SIZE_CLASSES[size];
  }

  if (typeof size === 'object' && size !== null) {
    const classes: string[] = [];
    for (const breakpoint of BREAKPOINT_ORDER) {
      const breakpointValue = (size as Partial<Record<Breakpoint, DialogSize>>)[breakpoint];
      if (breakpointValue !== undefined) {
        const sizeClass = DIALOG_SIZE_CLASSES[breakpointValue];
        // For responsive sizes, we need to extract max-w values
        const maxWMatch = sizeClass.match(/sm:max-w-(\w+)/);
        if (maxWMatch) {
          if (breakpoint === 'base') {
            classes.push(`max-w-${maxWMatch[1]}`);
          } else {
            classes.push(`${breakpoint}:max-w-${maxWMatch[1]}`);
          }
        }
      }
    }
    // Always include mobile constraint
    return `max-w-[calc(100%-2rem)] ${classes.join(' ')}`;
  }

  return DIALOG_SIZE_CLASSES.md;
}

/**
 * Generate responsive padding classes from DialogPadding value
 */
export function getDialogPaddingClasses(
  padding: ResponsiveValue<DialogPadding> | undefined,
  defaultPadding: string
): string {
  if (padding === undefined) {
    return defaultPadding;
  }

  if (typeof padding === 'string') {
    return `p-${padding}`;
  }

  if (typeof padding === 'object' && padding !== null) {
    const classes: string[] = [];
    for (const breakpoint of BREAKPOINT_ORDER) {
      const breakpointValue = (padding as Partial<Record<Breakpoint, DialogPadding>>)[breakpoint];
      if (breakpointValue !== undefined) {
        if (breakpoint === 'base') {
          classes.push(`p-${breakpointValue}`);
        } else {
          classes.push(`${breakpoint}:p-${breakpointValue}`);
        }
      }
    }
    return classes.join(' ');
  }

  return defaultPadding;
}

/**
 * Get focusable elements within a container
 */
function getFocusableElements(container: HTMLElement): HTMLElement[] {
  const focusableSelectors = [
    'button:not([disabled])',
    '[href]',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
  ].join(',');

  return Array.from(container.querySelectorAll<HTMLElement>(focusableSelectors)).filter(
    (el) => el.offsetParent !== null // Only visible elements
  );
}

// ============================================================================
// Dialog Component
// ============================================================================

/**
 * Dialog component for modal overlays.
 * Stateless - receives open state via props, emits close via callback.
 *
 * Accessibility features:
 * - Focus trapped within dialog when open
 * - Focus returns to trigger element on close
 * - Escape key closes dialog (configurable)
 * - aria-modal="true" prevents interaction with background content
 * - aria-labelledby points to title when provided
 * - Screen reader announcements via VisuallyHidden
 * - Close button has accessible label
 * - Backdrop click is optional (keyboard accessible via Escape)
 * - Body scroll locked when open
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
 * // Responsive size
 * <Dialog isOpen={isOpen} onClose={handleClose} size={{ base: 'full', md: 'lg' }}>
 *   <DialogContent>Responsive dialog</DialogContent>
 * </Dialog>
 */
export const Dialog = forwardRef<HTMLDivElement, DialogProps>(function Dialog(
  {
    isOpen,
    onClose,
    title,
    children,
    className,
    showCloseButton = true,
    closeOnBackdropClick = true,
    closeOnEscape = true,
    size = 'md',
    closeLabel = DEFAULT_CLOSE_LABEL,
    descriptionId,
    'data-testid': dataTestId,
    ...props
  },
  ref
) {
  const internalRef = useRef<HTMLDivElement>(null);
  const dialogRef = (ref as React.RefObject<HTMLDivElement>) || internalRef;
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

  // Focus trap
  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key !== 'Tab') return;

      const dialog = dialogRef.current;
      if (!dialog) return;

      const focusableElements = getFocusableElements(dialog);
      if (focusableElements.length === 0) return;

      const firstElement = focusableElements[0] as HTMLElement;
      const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

      if (event.shiftKey) {
        // Shift + Tab: if on first element, wrap to last
        if (document.activeElement === firstElement) {
          event.preventDefault();
          lastElement.focus();
        }
      } else {
        // Tab: if on last element, wrap to first
        if (document.activeElement === lastElement) {
          event.preventDefault();
          firstElement.focus();
        }
      }
    },
    [dialogRef]
  );

  // Focus management
  useEffect(() => {
    if (isOpen) {
      // Store current active element
      previousActiveElement.current = document.activeElement as HTMLElement;

      // Focus the dialog after render
      const timer = setTimeout(() => {
        const dialog = dialogRef.current;
        if (dialog) {
          // Try to focus first focusable element, otherwise focus dialog itself
          const focusableElements = getFocusableElements(dialog);
          const firstFocusable = focusableElements[0];
          if (firstFocusable) {
            firstFocusable.focus();
          } else {
            dialog.focus();
          }
        }
      }, 0);

      return () => clearTimeout(timer);
    }
    // Restore focus when closing
    previousActiveElement.current?.focus();
  }, [isOpen, dialogRef]);

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

  const sizeClasses = getResponsiveSizeClasses(size);

  return (
    <div
      role="presentation"
      className="fixed inset-0 z-50 flex items-center justify-center"
      data-testid={dataTestId ? `${dataTestId}-container` : undefined}
    >
      {/* Screen reader announcement */}
      <VisuallyHidden>
        <span role="status" aria-live="polite">
          {title ? `Dialog opened: ${title}` : 'Dialog opened'}
        </span>
      </VisuallyHidden>

      {/* Backdrop - click is supplementary to keyboard Escape handling
          Note: Backdrop is aria-hidden and not focusable, so onClick is for mouse users only.
          Keyboard users close the dialog via Escape key (handled at document level) */}
      <div
        className={DIALOG_BACKDROP_CLASSES}
        aria-hidden="true"
        onClick={handleBackdropClick}
        onKeyDown={undefined}
        data-testid={dataTestId ? `${dataTestId}-backdrop` : undefined}
      />

      {/* Dialog panel - using custom dialog implementation with focus trap */}
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        aria-describedby={descriptionId}
        tabIndex={-1}
        onKeyDown={handleKeyDown}
        data-testid={dataTestId}
        data-state={isOpen ? 'open' : 'closed'}
        className={cn(DIALOG_PANEL_CLASSES, sizeClasses, className)}
        {...props}
      >
        {/* Header */}
        {(title || showCloseButton) && (
          <div
            className={cn(DIALOG_HEADER_CLASSES, 'px-4 py-3 md:px-6')}
            data-testid={dataTestId ? `${dataTestId}-header` : undefined}
          >
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
                aria-label={closeLabel}
                data-testid={dataTestId ? `${dataTestId}-close-button` : undefined}
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
});

// ============================================================================
// DialogHeader Component
// ============================================================================

/**
 * Dialog header section.
 * Use when you need a custom header instead of the title prop.
 *
 * @example
 * <DialogHeader>
 *   <h2>Custom Title</h2>
 *   <p className="text-sm text-muted-foreground">Description</p>
 * </DialogHeader>
 *
 * @example
 * // Responsive padding
 * <DialogHeader p={{ base: '3', md: '6' }}>
 *   <h2>Responsive Header</h2>
 * </DialogHeader>
 */
export const DialogHeader = forwardRef<HTMLDivElement, DialogHeaderProps>(function DialogHeader(
  { children, className, p, 'data-testid': dataTestId, ...props },
  ref
) {
  const paddingClasses = getDialogPaddingClasses(p, 'px-4 py-3 md:px-6');

  return (
    <div
      ref={ref}
      data-testid={dataTestId}
      className={cn(
        'flex flex-col space-y-1.5 border-b border-[rgb(var(--border))]',
        paddingClasses,
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
});

// ============================================================================
// DialogContent Component
// ============================================================================

/**
 * Dialog content section.
 * Main content area of the dialog with scroll support.
 *
 * @example
 * <DialogContent>
 *   <p>Main content here</p>
 * </DialogContent>
 *
 * @example
 * // Responsive padding
 * <DialogContent p={{ base: '3', md: '6' }}>
 *   <p>Responsive content</p>
 * </DialogContent>
 */
export const DialogContent = forwardRef<HTMLDivElement, DialogContentProps>(function DialogContent(
  { children, className, p, 'data-testid': dataTestId, ...props },
  ref
) {
  const paddingClasses = getDialogPaddingClasses(p, 'p-4 md:p-6');

  return (
    <div
      ref={ref}
      data-testid={dataTestId}
      className={cn(DIALOG_CONTENT_CLASSES, paddingClasses, className)}
      {...props}
    >
      {children}
    </div>
  );
});

// ============================================================================
// DialogFooter Component
// ============================================================================

/**
 * Dialog footer section.
 * Typically contains action buttons.
 *
 * @example
 * <DialogFooter>
 *   <Button variant="ghost" onClick={onCancel}>Cancel</Button>
 *   <Button onClick={onConfirm}>Confirm</Button>
 * </DialogFooter>
 *
 * @example
 * // Responsive padding and mobile-first stacking
 * <DialogFooter p={{ base: '3', md: '6' }} className="flex-col sm:flex-row">
 *   <Button variant="ghost">Cancel</Button>
 *   <Button>Confirm</Button>
 * </DialogFooter>
 */
export const DialogFooter = forwardRef<HTMLDivElement, DialogFooterProps>(function DialogFooter(
  { children, className, p, 'data-testid': dataTestId, ...props },
  ref
) {
  const paddingClasses = getDialogPaddingClasses(p, 'px-4 py-3 md:px-6');

  return (
    <div
      ref={ref}
      data-testid={dataTestId}
      className={cn(DIALOG_FOOTER_CLASSES, paddingClasses, className)}
      {...props}
    >
      {children}
    </div>
  );
});

// ============================================================================
// Display Names
// ============================================================================

Dialog.displayName = 'Dialog';
DialogHeader.displayName = 'DialogHeader';
DialogContent.displayName = 'DialogContent';
DialogFooter.displayName = 'DialogFooter';
