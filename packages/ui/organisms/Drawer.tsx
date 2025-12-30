import { cn } from '@openflow/utils';
import { X } from 'lucide-react';
import { type ReactNode, useEffect, useRef } from 'react';

export interface DrawerProps {
  /** Whether the drawer is open */
  isOpen: boolean;
  /** Callback when the drawer should close */
  onClose: () => void;
  /** Which side the drawer slides in from */
  position?: 'left' | 'right';
  /** Drawer content */
  children: ReactNode;
  /** Additional CSS classes for the drawer panel */
  className?: string;
  /** Accessible label for the drawer */
  ariaLabel?: string;
}

/**
 * Drawer is a slide-in navigation panel for mobile screens.
 * Stateless - receives all content via props.
 *
 * Features:
 * - Slides in from left or right
 * - Backdrop click closes drawer
 * - Escape key closes drawer
 * - Focus trap within drawer
 * - Body scroll lock when open
 * - Respects reduced motion preferences
 *
 * @example
 * <Drawer
 *   isOpen={isDrawerOpen}
 *   onClose={() => setDrawerOpen(false)}
 *   position="left"
 *   ariaLabel="Navigation menu"
 * >
 *   <Sidebar />
 * </Drawer>
 */
export function Drawer({
  isOpen,
  onClose,
  position = 'left',
  children,
  className,
  ariaLabel = 'Navigation menu',
}: DrawerProps) {
  const drawerRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);

  // Handle escape key and focus management
  useEffect(() => {
    if (!isOpen) return;

    // Store the previously focused element to restore later
    previousActiveElement.current = document.activeElement as HTMLElement;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    // Prevent body scroll when drawer is open
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    window.addEventListener('keydown', handleEscape);

    // Focus the first focusable element in the drawer
    const focusableElements = drawerRef.current?.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstFocusable = focusableElements?.[0];
    if (firstFocusable) {
      firstFocusable.focus();
    }

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleEscape);

      // Restore focus to the previously focused element
      if (previousActiveElement.current) {
        previousActiveElement.current.focus();
      }
    };
  }, [isOpen, onClose]);

  // Handle focus trap
  useEffect(() => {
    if (!isOpen || !drawerRef.current) return;

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab' || !drawerRef.current) return;

      const focusableElements = drawerRef.current.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );

      if (focusableElements.length === 0) return;

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (!firstElement || !lastElement) return;

      if (e.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        }
      } else {
        // Tab
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };

    window.addEventListener('keydown', handleTabKey);
    return () => window.removeEventListener('keydown', handleTabKey);
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50" id="mobile-nav">
      {/* Backdrop - aria-hidden so keyboard events are handled at window level */}
      {/* biome-ignore lint/a11y/useKeyWithClickEvents: Escape key handled at window level */}
      <div
        className={cn(
          'fixed inset-0 bg-black/60',
          'motion-safe:transition-opacity motion-safe:duration-200'
        )}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer panel */}
      <div
        ref={drawerRef}
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel}
        className={cn(
          'fixed inset-y-0 flex w-72 flex-col',
          'bg-[rgb(var(--background))] shadow-xl',
          'motion-safe:transition-transform motion-safe:duration-200',
          position === 'left' ? 'left-0' : 'right-0',
          className
        )}
      >
        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          className={cn(
            'absolute right-4 top-4 z-10 rounded-md p-2',
            'text-[rgb(var(--muted-foreground))]',
            'hover:text-[rgb(var(--foreground))] hover:bg-[rgb(var(--surface-1))]',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--ring))] focus-visible:ring-offset-2 focus-visible:ring-offset-[rgb(var(--background))]'
          )}
          aria-label="Close navigation"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Drawer content */}
        <div className="flex-1 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}

Drawer.displayName = 'Drawer';
