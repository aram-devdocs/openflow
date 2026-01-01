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

export type DrawerPosition = 'left' | 'right';
export type DrawerSize = 'sm' | 'md' | 'lg';
export type DrawerBreakpoint = 'base' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

export interface DrawerProps extends Omit<HTMLAttributes<HTMLDivElement>, 'role' | 'title'> {
  /** Whether the drawer is open */
  isOpen: boolean;
  /** Callback when the drawer should close */
  onClose: () => void;
  /** Which side the drawer slides in from */
  position?: DrawerPosition;
  /** Drawer content */
  children: ReactNode;
  /** Accessible label for the drawer region */
  'aria-label'?: string;
  /** Size of the drawer - responsive value supported */
  size?: ResponsiveValue<DrawerSize>;
  /** Whether clicking the backdrop closes the drawer */
  closeOnBackdropClick?: boolean;
  /** Whether pressing Escape closes the drawer */
  closeOnEscape?: boolean;
  /** Accessible label for close button */
  closeLabel?: string;
  /** Data attributes for testing */
  'data-testid'?: string;
}

// ============================================================================
// Constants
// ============================================================================

/**
 * Breakpoint order for responsive class generation
 */
const BREAKPOINT_ORDER: readonly DrawerBreakpoint[] = [
  'base',
  'sm',
  'md',
  'lg',
  'xl',
  '2xl',
] as const;

/**
 * Default label for drawer region
 */
export const DEFAULT_ARIA_LABEL = 'Navigation menu';

/**
 * Default label for close button (screen reader accessible)
 */
export const DEFAULT_CLOSE_LABEL = 'Close navigation';

/**
 * Screen reader announcement when drawer opens
 */
export const SR_DRAWER_OPENED = 'Navigation drawer opened';

/**
 * Screen reader announcement when drawer closes
 */
export const SR_DRAWER_CLOSED = 'Navigation drawer closed';

/**
 * Width classes for drawer sizes
 */
export const DRAWER_SIZE_CLASSES: Record<DrawerSize, string> = {
  sm: 'w-60',
  md: 'w-72',
  lg: 'w-80',
};

/**
 * Base classes for drawer container
 */
export const DRAWER_CONTAINER_CLASSES = 'fixed inset-0 z-50';

/**
 * Base classes for drawer backdrop
 */
export const DRAWER_BACKDROP_CLASSES = [
  'fixed inset-0',
  'bg-black/60',
  // Enhanced opacity for users who prefer reduced transparency
  '[@media(prefers-reduced-transparency:reduce)]:bg-black/80',
  // Animation - respects reduced motion
  'motion-safe:transition-opacity motion-safe:duration-200',
].join(' ');

/**
 * Base classes for drawer panel
 */
export const DRAWER_PANEL_BASE_CLASSES = [
  'fixed inset-y-0 flex flex-col',
  'bg-[rgb(var(--background))]',
  'shadow-xl',
  // Animation - respects reduced motion
  'motion-safe:transition-transform motion-safe:duration-200',
  // Focus styles
  'focus:outline-none',
].join(' ');

/**
 * Position classes for drawer panel
 */
export const DRAWER_POSITION_CLASSES: Record<DrawerPosition, string> = {
  left: 'left-0 border-r border-[rgb(var(--border))]',
  right: 'right-0 border-l border-[rgb(var(--border))]',
};

/**
 * Close button container classes
 */
export const DRAWER_CLOSE_BUTTON_CONTAINER_CLASSES = 'absolute right-3 top-3 z-10';

/**
 * Close button classes (including touch target sizing)
 */
export const DRAWER_CLOSE_BUTTON_CLASSES = [
  // Touch target - at least 44px for WCAG 2.5.5
  'min-h-[44px] min-w-[44px]',
  'h-11 w-11',
  'p-0',
].join(' ');

/**
 * Content container classes
 */
export const DRAWER_CONTENT_CLASSES = 'flex-1 overflow-y-auto scrollbar-thin';

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Get base size from responsive value
 */
export function getBaseSize(size: ResponsiveValue<DrawerSize> | undefined): DrawerSize {
  if (size === undefined) {
    return 'md';
  }

  if (typeof size === 'string') {
    return size;
  }

  if (typeof size === 'object' && size !== null) {
    const sizeObj = size as Partial<Record<DrawerBreakpoint, DrawerSize>>;
    // Return base if specified, otherwise first defined value, otherwise default
    if (sizeObj.base) return sizeObj.base;
    for (const bp of BREAKPOINT_ORDER) {
      if (sizeObj[bp]) return sizeObj[bp] as DrawerSize;
    }
  }

  return 'md';
}

/**
 * Generate responsive size classes from DrawerSize value
 */
export function getResponsiveSizeClasses(size: ResponsiveValue<DrawerSize> | undefined): string {
  if (size === undefined) {
    return DRAWER_SIZE_CLASSES.md;
  }

  if (typeof size === 'string') {
    return DRAWER_SIZE_CLASSES[size];
  }

  if (typeof size === 'object' && size !== null) {
    const sizeObj = size as Partial<Record<DrawerBreakpoint, DrawerSize>>;
    const classes: string[] = [];

    for (const breakpoint of BREAKPOINT_ORDER) {
      const sizeValue = sizeObj[breakpoint];
      if (sizeValue !== undefined) {
        const widthClass = DRAWER_SIZE_CLASSES[sizeValue];
        if (breakpoint === 'base') {
          classes.push(widthClass);
        } else {
          // Extract the width value (e.g., "w-72" -> "72")
          const widthMatch = widthClass.match(/w-(\d+)/);
          if (widthMatch) {
            classes.push(`${breakpoint}:w-${widthMatch[1]}`);
          }
        }
      }
    }

    // Return default if no classes were generated (e.g., empty object passed)
    return classes.length > 0 ? classes.join(' ') : DRAWER_SIZE_CLASSES.md;
  }

  return DRAWER_SIZE_CLASSES.md;
}

/**
 * Build accessible label for drawer
 */
export function buildDrawerAccessibleLabel(
  customLabel: string | undefined,
  position: DrawerPosition
): string {
  if (customLabel) {
    return customLabel;
  }
  return position === 'left' ? 'Main navigation' : 'Side panel';
}

/**
 * Get drawer opened announcement
 */
export function getOpenedAnnouncement(label: string): string {
  return `${label} opened`;
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
// Drawer Component
// ============================================================================

/**
 * Drawer is a slide-in navigation panel for mobile screens.
 * Stateless - receives all content via props.
 *
 * Accessibility features:
 * - Focus trapped within drawer when open
 * - Focus returns to trigger element on close
 * - Escape key closes drawer (configurable)
 * - aria-modal="true" for screen reader focus management
 * - Backdrop click is supplementary to Escape key
 * - Body scroll locked when open
 * - Motion-safe animations respect prefers-reduced-motion
 * - Prefers-reduced-transparency support for backdrop
 * - Close button meets 44px touch target requirement
 * - Screen reader announcements for open/close
 *
 * @example
 * <Drawer
 *   isOpen={isDrawerOpen}
 *   onClose={() => setDrawerOpen(false)}
 *   position="left"
 *   aria-label="Navigation menu"
 * >
 *   <Sidebar />
 * </Drawer>
 *
 * @example
 * // Responsive size
 * <Drawer
 *   isOpen={isOpen}
 *   onClose={handleClose}
 *   size={{ base: 'sm', md: 'lg' }}
 * >
 *   <nav>...</nav>
 * </Drawer>
 */
export const Drawer = forwardRef<HTMLDivElement, DrawerProps>(function Drawer(
  {
    isOpen,
    onClose,
    position = 'left',
    children,
    className,
    'aria-label': ariaLabel,
    size = 'md',
    closeOnBackdropClick = true,
    closeOnEscape = true,
    closeLabel = DEFAULT_CLOSE_LABEL,
    'data-testid': dataTestId,
    ...props
  },
  ref
) {
  const internalRef = useRef<HTMLDivElement>(null);
  const drawerRef = (ref as React.RefObject<HTMLDivElement>) || internalRef;
  const previousActiveElement = useRef<HTMLElement | null>(null);
  const id = useId();
  const labelId = `${id}-label`;

  // Build the accessible label
  const accessibleLabel = buildDrawerAccessibleLabel(ariaLabel, position);

  // Handle Escape key
  useEffect(() => {
    if (!isOpen || !closeOnEscape) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        event.stopPropagation();
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

      const drawer = drawerRef.current;
      if (!drawer) return;

      const focusableElements = getFocusableElements(drawer);
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
    [drawerRef]
  );

  // Focus management
  useEffect(() => {
    if (isOpen) {
      // Store current active element
      previousActiveElement.current = document.activeElement as HTMLElement;

      // Focus the drawer after render
      const timer = setTimeout(() => {
        const drawer = drawerRef.current;
        if (drawer) {
          // Try to focus first focusable element, otherwise focus drawer itself
          const focusableElements = getFocusableElements(drawer);
          const firstFocusable = focusableElements[0];
          if (firstFocusable) {
            firstFocusable.focus();
          } else {
            drawer.focus();
          }
        }
      }, 0);

      return () => clearTimeout(timer);
    }
    // Restore focus when closing
    previousActiveElement.current?.focus();
  }, [isOpen, drawerRef]);

  // Prevent body scroll when drawer is open
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
  const positionClasses = DRAWER_POSITION_CLASSES[position];

  return (
    <div
      id="mobile-nav"
      role="presentation"
      className={DRAWER_CONTAINER_CLASSES}
      data-testid={dataTestId ? `${dataTestId}-container` : undefined}
    >
      {/* Screen reader announcement */}
      <VisuallyHidden>
        <span role="status" aria-live="polite">
          {getOpenedAnnouncement(accessibleLabel)}
        </span>
      </VisuallyHidden>

      {/* Backdrop - click is supplementary to keyboard Escape handling
          Note: Backdrop is aria-hidden and not focusable, so onClick is for mouse users only.
          Keyboard users close the drawer via Escape key (handled at document level) */}
      <div
        className={DRAWER_BACKDROP_CLASSES}
        aria-hidden="true"
        onClick={handleBackdropClick}
        data-testid={dataTestId ? `${dataTestId}-backdrop` : undefined}
      />

      {/* Drawer panel */}
      <div
        ref={drawerRef}
        role="dialog"
        aria-modal="true"
        aria-label={accessibleLabel}
        aria-labelledby={labelId}
        tabIndex={-1}
        onKeyDown={handleKeyDown}
        data-testid={dataTestId}
        data-state={isOpen ? 'open' : 'closed'}
        data-position={position}
        data-size={getBaseSize(size)}
        className={cn(DRAWER_PANEL_BASE_CLASSES, positionClasses, sizeClasses, className)}
        {...props}
      >
        {/* Hidden label for aria-labelledby */}
        <VisuallyHidden>
          <span id={labelId}>{accessibleLabel}</span>
        </VisuallyHidden>

        {/* Close button */}
        <div className={DRAWER_CLOSE_BUTTON_CONTAINER_CLASSES}>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClose}
            className={cn(
              DRAWER_CLOSE_BUTTON_CLASSES,
              'text-[rgb(var(--muted-foreground))]',
              'hover:text-[rgb(var(--foreground))] hover:bg-[rgb(var(--surface-1))]',
              'focus-visible:ring-2 focus-visible:ring-[rgb(var(--ring))] focus-visible:ring-offset-2 focus-visible:ring-offset-[rgb(var(--background))]'
            )}
            aria-label={closeLabel}
            data-testid={dataTestId ? `${dataTestId}-close-button` : undefined}
          >
            <Icon icon={X} size="md" aria-hidden="true" />
          </Button>
        </div>

        {/* Drawer content */}
        <div
          className={DRAWER_CONTENT_CLASSES}
          data-testid={dataTestId ? `${dataTestId}-content` : undefined}
        >
          {children}
        </div>
      </div>
    </div>
  );
});

// ============================================================================
// Display Names
// ============================================================================

Drawer.displayName = 'Drawer';
