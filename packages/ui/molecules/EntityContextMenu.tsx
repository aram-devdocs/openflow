import { VisuallyHidden } from '@openflow/primitives';
import { cn } from '@openflow/utils';
import { Archive, Code, Copy, Eye, Pencil, RotateCcw, Trash2 } from 'lucide-react';
import { type ForwardedRef, forwardRef, useMemo } from 'react';
import { Menu, type MenuItem, type MenuPosition } from './Menu';

export type EntityType = 'task' | 'chat' | 'project';

/**
 * Size options for EntityContextMenu
 * - sm: Compact menu for space-constrained contexts
 * - md: Default menu size
 * - lg: Larger menu for touch devices or larger screens
 */
export type EntityContextMenuSize = 'sm' | 'md' | 'lg';

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
  /** Callback when duplicate is clicked */
  onDuplicate?: () => void;
  /** Callback when open in IDE is clicked */
  onOpenInIDE?: () => void;
  /** Callback when archive is clicked */
  onArchive?: () => void;
  /** Callback when restore is clicked (for archived items) */
  onRestore?: () => void;
  /** Callback when delete is clicked */
  onDelete?: () => void;
  /** Additional class name for the menu */
  className?: string;
  /** Test ID for automated testing */
  'data-testid'?: string;
  /** Custom aria-label override (default: "{entityType} actions") */
  'aria-label'?: string;
}

// --- Exported Constants for Testing ---

/** Base classes applied to all EntityContextMenu instances */
export const ENTITY_CONTEXT_MENU_BASE_CLASSES = '';

/** Entity type labels (capitalized for display) */
export const ENTITY_TYPE_LABELS: Record<EntityType, string> = {
  task: 'Task',
  chat: 'Chat',
  project: 'Project',
};

/** Menu item IDs */
export const MENU_ITEM_IDS = {
  VIEW: 'view',
  EDIT: 'edit',
  DUPLICATE: 'duplicate',
  OPEN_IN_IDE: 'open-in-ide',
  DIVIDER: 'divider-1',
  ARCHIVE: 'archive',
  RESTORE: 'restore',
  DELETE: 'delete',
} as const;

/** Default aria-label template */
export const DEFAULT_ARIA_LABEL_TEMPLATE = '{entityType} actions';

// --- Utility Functions ---

/**
 * Gets the capitalized label for an entity type
 * @param entityType - The entity type (task, chat, project)
 * @returns Capitalized label (Task, Chat, Project)
 */
export function getEntityLabel(entityType: EntityType): string {
  return ENTITY_TYPE_LABELS[entityType];
}

/**
 * Builds menu items based on entity type, archived state, and available handlers
 * @param entityType - The entity type
 * @param isArchived - Whether the entity is archived
 * @param handlers - Object containing action handlers
 * @returns Array of MenuItem objects
 */
export function buildMenuItems(
  entityType: EntityType,
  isArchived: boolean,
  handlers: {
    onViewDetails?: () => void;
    onEdit?: () => void;
    onDuplicate?: () => void;
    onOpenInIDE?: () => void;
    onArchive?: () => void;
    onRestore?: () => void;
    onDelete?: () => void;
  }
): MenuItem[] {
  const items: MenuItem[] = [];
  const entityLabel = getEntityLabel(entityType);

  // View details action (if handler provided)
  if (handlers.onViewDetails) {
    items.push({
      id: MENU_ITEM_IDS.VIEW,
      label: `View ${entityLabel}`,
      icon: Eye,
      onClick: handlers.onViewDetails,
    });
  }

  // Edit action (if handler provided and not archived)
  if (handlers.onEdit && !isArchived) {
    items.push({
      id: MENU_ITEM_IDS.EDIT,
      label: `Edit ${entityLabel}`,
      icon: Pencil,
      onClick: handlers.onEdit,
    });
  }

  // Duplicate action (if handler provided and not archived)
  if (handlers.onDuplicate && !isArchived) {
    items.push({
      id: MENU_ITEM_IDS.DUPLICATE,
      label: `Duplicate ${entityLabel}`,
      icon: Copy,
      onClick: handlers.onDuplicate,
    });
  }

  // Open in IDE action (if handler provided and not archived)
  if (handlers.onOpenInIDE && !isArchived) {
    items.push({
      id: MENU_ITEM_IDS.OPEN_IN_IDE,
      label: 'Open in IDE',
      icon: Code,
      onClick: handlers.onOpenInIDE,
    });
  }

  // Add divider if we have view/edit/duplicate/openInIDE actions and archive/delete actions
  const hasViewEdit =
    handlers.onViewDetails ||
    (handlers.onEdit && !isArchived) ||
    (handlers.onDuplicate && !isArchived) ||
    (handlers.onOpenInIDE && !isArchived);
  const hasArchiveDelete = handlers.onArchive || handlers.onRestore || handlers.onDelete;
  if (hasViewEdit && hasArchiveDelete) {
    items.push({
      id: MENU_ITEM_IDS.DIVIDER,
      label: '',
      divider: true,
    });
  }

  // Archive or Restore action based on archived state
  if (isArchived && handlers.onRestore) {
    items.push({
      id: MENU_ITEM_IDS.RESTORE,
      label: `Restore ${entityLabel}`,
      icon: RotateCcw,
      onClick: handlers.onRestore,
    });
  } else if (!isArchived && handlers.onArchive) {
    items.push({
      id: MENU_ITEM_IDS.ARCHIVE,
      label: `Archive ${entityLabel}`,
      icon: Archive,
      onClick: handlers.onArchive,
    });
  }

  // Delete action (if handler provided)
  if (handlers.onDelete) {
    items.push({
      id: MENU_ITEM_IDS.DELETE,
      label: `Delete ${entityLabel}`,
      icon: Trash2,
      onClick: handlers.onDelete,
      destructive: true,
    });
  }

  return items;
}

/**
 * Gets the screen reader announcement for the menu state
 * @param entityType - The entity type
 * @param isOpen - Whether the menu is open
 * @param itemCount - Number of available actions
 * @returns Announcement string
 */
export function getScreenReaderAnnouncement(
  entityType: EntityType,
  isOpen: boolean,
  itemCount: number
): string {
  if (!isOpen) return '';
  const entityLabel = getEntityLabel(entityType);
  const actionsText = itemCount === 1 ? '1 action' : `${itemCount} actions`;
  return `${entityLabel} context menu opened. ${actionsText} available.`;
}

/**
 * EntityContextMenu provides a consistent context menu for managing entities.
 * It dynamically builds menu items based on the entity type and archived state.
 *
 * Features:
 * - Type-aware menu labels (Task, Chat, Project)
 * - Archived state changes available actions (restore vs archive)
 * - Uses the base Menu component internally
 * - Screen reader announcements for accessibility
 * - Full keyboard navigation (inherited from Menu)
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
export const EntityContextMenu = forwardRef(function EntityContextMenu(
  {
    entityType,
    isOpen,
    position,
    onClose,
    isArchived = false,
    onViewDetails,
    onEdit,
    onDuplicate,
    onOpenInIDE,
    onArchive,
    onRestore,
    onDelete,
    className,
    'data-testid': dataTestId,
    'aria-label': ariaLabel,
  }: EntityContextMenuProps,
  ref: ForwardedRef<HTMLDivElement>
) {
  const menuItems: MenuItem[] = useMemo(
    () =>
      buildMenuItems(entityType, isArchived, {
        onViewDetails,
        onEdit,
        onDuplicate,
        onOpenInIDE,
        onArchive,
        onRestore,
        onDelete,
      }),
    [
      entityType,
      isArchived,
      onViewDetails,
      onEdit,
      onDuplicate,
      onOpenInIDE,
      onArchive,
      onRestore,
      onDelete,
    ]
  );

  // Count non-divider items for screen reader announcement
  const actionCount = menuItems.filter((item) => !item.divider).length;

  // Get screen reader announcement
  const announcement = useMemo(
    () => getScreenReaderAnnouncement(entityType, isOpen, actionCount),
    [entityType, isOpen, actionCount]
  );

  // Default aria-label based on entity type
  const computedAriaLabel = ariaLabel ?? `${entityType} actions`;

  // Don't render if no items
  if (menuItems.length === 0) return null;

  return (
    <>
      {/* Screen reader announcement */}
      {isOpen && announcement && (
        <VisuallyHidden>
          <span role="status" aria-live="polite" aria-atomic="true">
            {announcement}
          </span>
        </VisuallyHidden>
      )}
      <Menu
        ref={ref}
        items={menuItems}
        isOpen={isOpen}
        onClose={onClose}
        position={position}
        className={cn(ENTITY_CONTEXT_MENU_BASE_CLASSES, className)}
        aria-label={computedAriaLabel}
        data-testid={dataTestId}
        data-entity-type={entityType}
        data-archived={isArchived}
      />
    </>
  );
});

EntityContextMenu.displayName = 'EntityContextMenu';
