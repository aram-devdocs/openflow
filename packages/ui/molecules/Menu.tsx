import { Box, Text, VisuallyHidden } from '@openflow/primitives';
import { cn } from '@openflow/utils';
import type { LucideIcon } from 'lucide-react';
import {
  type ForwardedRef,
  forwardRef,
  useCallback,
  useEffect,
  useId,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Icon } from '../atoms/Icon';

export interface MenuItem {
  /** Unique identifier for the menu item */
  id: string;
  /** Display label for the menu item */
  label: string;
  /** Optional icon to display before the label */
  icon?: LucideIcon;
  /** Callback when item is clicked */
  onClick?: () => void;
  /** Whether this item is a divider */
  divider?: boolean;
  /** Whether the item is disabled */
  disabled?: boolean;
  /** Optional keyboard shortcut hint to display */
  shortcut?: string;
  /** Whether this is a destructive action (red styling) */
  destructive?: boolean;
}

export interface MenuPosition {
  /** X coordinate or 'left' | 'right' alignment */
  x: number | 'left' | 'right';
  /** Y coordinate or 'top' | 'bottom' alignment */
  y: number | 'top' | 'bottom';
}

export interface MenuProps {
  /** Array of menu items to display */
  items: MenuItem[];
  /** Whether the menu is open */
  isOpen: boolean;
  /** Callback when menu should close */
  onClose: () => void;
  /** Position of the menu (x, y coordinates or alignment) */
  position?: MenuPosition;
  /** Additional class name for the menu container */
  className?: string;
  /** Accessible label for the menu */
  'aria-label'?: string;
  /** Test ID for automated testing */
  'data-testid'?: string;
  /** Entity type (passed from EntityContextMenu) */
  'data-entity-type'?: string;
  /** Archived state (passed from EntityContextMenu) */
  'data-archived'?: boolean;
}

// --- Exported Constants for Testing ---

/** Base classes applied to all Menu instances */
export const MENU_BASE_CLASSES =
  'z-50 min-w-[160px] overflow-hidden rounded-md border border-[rgb(var(--border))] bg-[rgb(var(--popover))] py-1 shadow-md focus:outline-none';

/** Animation classes (respects reduced motion) */
export const MENU_ANIMATION_CLASSES =
  'motion-safe:animate-in motion-safe:fade-in-0 motion-safe:zoom-in-95 motion-safe:duration-150';

/** Menu item base classes */
export const MENU_ITEM_BASE_CLASSES =
  'flex w-full items-center gap-2 px-3 py-3 text-sm min-h-[44px] text-left motion-safe:transition-colors motion-safe:duration-75';

/** Divider classes */
export const MENU_DIVIDER_CLASSES = 'my-1 h-px bg-[rgb(var(--border))]';

// --- Utility Functions ---

/**
 * Gets position styles from MenuPosition
 * @param position - The menu position configuration
 * @returns CSS styles object
 */
export function getPositionStyles(position: MenuPosition): React.CSSProperties {
  const styles: React.CSSProperties = {
    position: 'fixed',
  };

  if (typeof position.x === 'number') {
    styles.left = position.x;
  } else if (position.x === 'left') {
    styles.left = 0;
  } else if (position.x === 'right') {
    styles.right = 0;
  }

  if (typeof position.y === 'number') {
    styles.top = position.y;
  } else if (position.y === 'top') {
    styles.top = 0;
  } else if (position.y === 'bottom') {
    styles.bottom = 0;
  }

  return styles;
}

/**
 * Gets screen reader announcement when item is selected
 * @param label - The menu item label
 * @param destructive - Whether it's a destructive action
 * @returns Announcement string
 */
export function getItemAnnouncement(label: string, destructive?: boolean): string {
  if (destructive) {
    return `${label} (destructive action)`;
  }
  return label;
}

/**
 * Menu component for context menus and dropdown menus.
 * Stateless - receives all data via props, emits actions via callbacks.
 *
 * Features:
 * - Keyboard navigation with Arrow keys, Enter, Escape
 * - Click outside to close
 * - Dividers and disabled items
 * - Optional icons and keyboard shortcut hints
 * - Destructive action styling
 * - Screen reader announcements for highlighted items
 *
 * @example
 * <Menu
 *   items={[
 *     { id: 'edit', label: 'Edit', icon: PencilIcon, onClick: handleEdit },
 *     { id: 'divider', label: '', divider: true },
 *     { id: 'delete', label: 'Delete', icon: TrashIcon, destructive: true, onClick: handleDelete },
 *   ]}
 *   isOpen={isMenuOpen}
 *   onClose={() => setIsMenuOpen(false)}
 *   position={{ x: 100, y: 200 }}
 * />
 *
 * @example
 * <Menu
 *   items={menuItems}
 *   isOpen={showContextMenu}
 *   onClose={closeContextMenu}
 *   position={{ x: 'right', y: 'bottom' }}
 *   aria-label="Actions menu"
 * />
 */
export const Menu = forwardRef(function Menu(
  {
    items,
    isOpen,
    onClose,
    position = { x: 0, y: 0 },
    className,
    'aria-label': ariaLabel,
    'data-testid': dataTestId,
    'data-entity-type': dataEntityType,
    'data-archived': dataArchived,
  }: MenuProps,
  ref: ForwardedRef<HTMLDivElement>
) {
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const menuRef = useRef<HTMLDivElement>(null);
  const id = useId();
  const menuId = `${id}-menu`;

  // Expose the menu ref via forwardRef
  useImperativeHandle(ref, () => menuRef.current as HTMLDivElement);

  // Get enabled (non-divider, non-disabled) items for keyboard navigation
  const enabledItems = useMemo(
    () => items.filter((item) => !item.divider && !item.disabled),
    [items]
  );

  // Get the currently highlighted item for screen reader announcement
  const highlightedItem = useMemo(
    () => (highlightedIndex >= 0 ? enabledItems[highlightedIndex] : null),
    [enabledItems, highlightedIndex]
  );

  // Reset highlighted index when menu opens
  useEffect(() => {
    if (isOpen) {
      setHighlightedIndex(-1);
    }
  }, [isOpen]);

  // Handle click outside to close
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (menuRef.current && !menuRef.current.contains(target)) {
        onClose();
      }
    };

    // Use setTimeout to prevent immediate close when opening via click
    const timeoutId = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 0);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  // Handle escape key to close
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Focus menu when opened
  useEffect(() => {
    if (isOpen && menuRef.current) {
      menuRef.current.focus();
    }
  }, [isOpen]);

  const selectItem = useCallback(
    (item: MenuItem) => {
      if (item.disabled || item.divider) return;
      item.onClick?.();
      onClose();
    },
    [onClose]
  );

  const handleKeyDown = (event: React.KeyboardEvent) => {
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        setHighlightedIndex((prev) => (prev < enabledItems.length - 1 ? prev + 1 : 0));
        break;
      case 'ArrowUp':
        event.preventDefault();
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : enabledItems.length - 1));
        break;
      case 'Enter':
      case ' ':
        event.preventDefault();
        if (highlightedIndex >= 0 && enabledItems[highlightedIndex]) {
          selectItem(enabledItems[highlightedIndex]);
        }
        break;
      case 'Escape':
        event.preventDefault();
        onClose();
        break;
      case 'Tab':
        event.preventDefault();
        onClose();
        break;
      case 'Home':
        event.preventDefault();
        setHighlightedIndex(0);
        break;
      case 'End':
        event.preventDefault();
        setHighlightedIndex(enabledItems.length - 1);
        break;
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Screen reader announcement for highlighted item */}
      {highlightedItem && (
        <VisuallyHidden>
          <Text as="span" role="status" aria-live="polite" aria-atomic="true">
            {getItemAnnouncement(highlightedItem.label, highlightedItem.destructive)}
          </Text>
        </VisuallyHidden>
      )}
      <Box
        ref={menuRef}
        id={menuId}
        role="menu"
        aria-label={ariaLabel}
        aria-activedescendant={
          highlightedIndex >= 0 ? `${menuId}-item-${enabledItems[highlightedIndex]?.id}` : undefined
        }
        tabIndex={-1}
        onKeyDown={handleKeyDown}
        style={getPositionStyles(position)}
        className={cn(MENU_BASE_CLASSES, MENU_ANIMATION_CLASSES, className)}
        data-testid={dataTestId}
        data-entity-type={dataEntityType}
        data-archived={dataArchived}
        data-state={isOpen ? 'open' : 'closed'}
      >
        {items.map((item) => {
          // Handle divider
          if (item.divider) {
            return (
              // biome-ignore lint/a11y/useFocusableInteractive: Separator is not interactive
              <Box key={item.id} role="separator" className={MENU_DIVIDER_CLASSES} />
            );
          }

          const enabledIndex = enabledItems.findIndex((i) => i.id === item.id);
          const isHighlighted = enabledIndex === highlightedIndex;

          return (
            <button
              key={item.id}
              id={`${menuId}-item-${item.id}`}
              type="button"
              role="menuitem"
              tabIndex={-1}
              disabled={item.disabled}
              aria-disabled={item.disabled}
              onClick={() => selectItem(item)}
              onMouseEnter={() => {
                if (!item.disabled) {
                  setHighlightedIndex(enabledIndex);
                }
              }}
              onMouseLeave={() => {
                setHighlightedIndex(-1);
              }}
              className={cn(
                MENU_ITEM_BASE_CLASSES,
                // Default text color
                !item.destructive && 'text-[rgb(var(--popover-foreground))]',
                // Destructive text color
                item.destructive && 'text-[rgb(var(--destructive))]',
                // Highlighted state
                isHighlighted &&
                  !item.disabled &&
                  'bg-[rgb(var(--accent))] text-[rgb(var(--accent-foreground))]',
                // Highlighted destructive
                isHighlighted &&
                  item.destructive &&
                  !item.disabled &&
                  'bg-[rgb(var(--destructive))] text-[rgb(var(--destructive-foreground))]',
                // Disabled state
                item.disabled && 'cursor-not-allowed text-[rgb(var(--muted-foreground))] opacity-50'
              )}
              data-highlighted={isHighlighted}
              data-destructive={item.destructive}
            >
              {item.icon && (
                <Icon
                  icon={item.icon}
                  size="sm"
                  className={cn(
                    item.destructive && !isHighlighted && 'text-[rgb(var(--destructive))]'
                  )}
                />
              )}
              <Text as="span" className="flex-1">
                {item.label}
              </Text>
              {item.shortcut && (
                <Text
                  as="span"
                  className={cn(
                    'ml-auto text-xs',
                    isHighlighted
                      ? 'text-inherit opacity-70'
                      : 'text-[rgb(var(--muted-foreground))]'
                  )}
                >
                  {item.shortcut}
                </Text>
              )}
            </button>
          );
        })}
      </Box>
    </>
  );
});

Menu.displayName = 'Menu';
