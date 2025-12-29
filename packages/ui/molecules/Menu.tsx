import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { cn } from '@openflow/utils';
import { Icon } from '../atoms/Icon';
import type { LucideIcon } from 'lucide-react';

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
export function Menu({
  items,
  isOpen,
  onClose,
  position = { x: 0, y: 0 },
  className,
  'aria-label': ariaLabel,
}: MenuProps) {
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const menuRef = useRef<HTMLDivElement>(null);
  const id = useId();
  const menuId = `${id}-menu`;

  // Get enabled (non-divider, non-disabled) items for keyboard navigation
  const enabledItems = items.filter((item) => !item.divider && !item.disabled);

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
        setHighlightedIndex((prev) =>
          prev < enabledItems.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        event.preventDefault();
        setHighlightedIndex((prev) =>
          prev > 0 ? prev - 1 : enabledItems.length - 1
        );
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

  // Calculate position styles
  const getPositionStyles = (): React.CSSProperties => {
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
  };

  if (!isOpen) return null;

  return (
    <div
      ref={menuRef}
      id={menuId}
      role="menu"
      aria-label={ariaLabel}
      tabIndex={-1}
      onKeyDown={handleKeyDown}
      style={getPositionStyles()}
      className={cn(
        'z-50 min-w-[160px] overflow-hidden',
        'rounded-md border border-[rgb(var(--border))] bg-[rgb(var(--popover))]',
        'py-1 shadow-md',
        'animate-in fade-in-0 zoom-in-95 duration-150',
        'focus:outline-none',
        className
      )}
    >
      {items.map((item) => {
        // Handle divider
        if (item.divider) {
          return (
            <div
              key={item.id}
              role="separator"
              className="my-1 h-px bg-[rgb(var(--border))]"
            />
          );
        }

        const enabledIndex = enabledItems.findIndex((i) => i.id === item.id);
        const isHighlighted = enabledIndex === highlightedIndex;

        return (
          <button
            key={item.id}
            role="menuitem"
            tabIndex={-1}
            disabled={item.disabled}
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
              'flex w-full items-center gap-2 px-3 py-2 text-sm',
              'text-left transition-colors duration-75',
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
              item.disabled &&
                'cursor-not-allowed text-[rgb(var(--muted-foreground))] opacity-50'
            )}
          >
            {item.icon && (
              <Icon
                icon={item.icon}
                size="sm"
                className={cn(
                  item.destructive &&
                    !isHighlighted &&
                    'text-[rgb(var(--destructive))]'
                )}
              />
            )}
            <span className="flex-1">{item.label}</span>
            {item.shortcut && (
              <span
                className={cn(
                  'ml-auto text-xs',
                  isHighlighted
                    ? 'text-inherit opacity-70'
                    : 'text-[rgb(var(--muted-foreground))]'
                )}
              >
                {item.shortcut}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

Menu.displayName = 'Menu';
