import { Archive, Eye, Pencil, RotateCcw, Trash2 } from 'lucide-react';
import { useMemo } from 'react';
import { Menu, type MenuItem, type MenuPosition } from './Menu';

export type EntityType = 'task' | 'chat' | 'project';

export interface EntityContextMenuProps {
  /** The type of entity this menu is for */
  entityType: EntityType;
  /** Whether the menu is open */
  isOpen: boolean;
  /** Position of the menu */
  position: MenuPosition;
  /** Callback when menu should close */
  onClose: () => void;
  /** Whether the entity is archived */
  isArchived?: boolean;
  /** Callback when view details is clicked */
  onViewDetails?: () => void;
  /** Callback when edit is clicked */
  onEdit?: () => void;
  /** Callback when archive is clicked */
  onArchive?: () => void;
  /** Callback when restore is clicked (for archived items) */
  onRestore?: () => void;
  /** Callback when delete is clicked */
  onDelete?: () => void;
  /** Additional class name for the menu */
  className?: string;
}

/**
 * EntityContextMenu provides a consistent context menu for managing entities.
 * It dynamically builds menu items based on the entity type and archived state.
 *
 * Features:
 * - Type-aware menu labels (Task, Chat, Project)
 * - Archived state changes available actions (restore vs archive)
 * - Uses the base Menu component internally
 *
 * @example
 * <EntityContextMenu
 *   entityType="task"
 *   isOpen={menuOpen}
 *   position={{ x: mouseX, y: mouseY }}
 *   onClose={() => setMenuOpen(false)}
 *   onArchive={handleArchive}
 *   onDelete={handleDelete}
 * />
 */
export function EntityContextMenu({
  entityType,
  isOpen,
  position,
  onClose,
  isArchived = false,
  onViewDetails,
  onEdit,
  onArchive,
  onRestore,
  onDelete,
  className,
}: EntityContextMenuProps) {
  const menuItems: MenuItem[] = useMemo(() => {
    const items: MenuItem[] = [];

    // Capitalize entity type for labels
    const entityLabel = entityType.charAt(0).toUpperCase() + entityType.slice(1);

    // View details action (if handler provided)
    if (onViewDetails) {
      items.push({
        id: 'view',
        label: `View ${entityLabel}`,
        icon: Eye,
        onClick: onViewDetails,
      });
    }

    // Edit action (if handler provided and not archived)
    if (onEdit && !isArchived) {
      items.push({
        id: 'edit',
        label: `Edit ${entityLabel}`,
        icon: Pencil,
        onClick: onEdit,
      });
    }

    // Add divider if we have view/edit actions and archive/delete actions
    const hasViewEdit = onViewDetails || (onEdit && !isArchived);
    const hasArchiveDelete = onArchive || onRestore || onDelete;
    if (hasViewEdit && hasArchiveDelete) {
      items.push({
        id: 'divider-1',
        label: '',
        divider: true,
      });
    }

    // Archive or Restore action based on archived state
    if (isArchived && onRestore) {
      items.push({
        id: 'restore',
        label: `Restore ${entityLabel}`,
        icon: RotateCcw,
        onClick: onRestore,
      });
    } else if (!isArchived && onArchive) {
      items.push({
        id: 'archive',
        label: `Archive ${entityLabel}`,
        icon: Archive,
        onClick: onArchive,
      });
    }

    // Delete action (if handler provided)
    if (onDelete) {
      items.push({
        id: 'delete',
        label: `Delete ${entityLabel}`,
        icon: Trash2,
        onClick: onDelete,
        destructive: true,
      });
    }

    return items;
  }, [entityType, isArchived, onViewDetails, onEdit, onArchive, onRestore, onDelete]);

  // Don't render if no items
  if (menuItems.length === 0) return null;

  return (
    <Menu
      items={menuItems}
      isOpen={isOpen}
      onClose={onClose}
      position={position}
      className={className}
      aria-label={`${entityType} actions`}
    />
  );
}

EntityContextMenu.displayName = 'EntityContextMenu';
