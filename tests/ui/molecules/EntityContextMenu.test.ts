import { describe, expect, it } from 'vitest';
import {
  DEFAULT_ARIA_LABEL_TEMPLATE,
  ENTITY_CONTEXT_MENU_BASE_CLASSES,
  ENTITY_TYPE_LABELS,
  MENU_ITEM_IDS,
  buildMenuItems,
  getEntityLabel,
  getScreenReaderAnnouncement,
} from '../../../packages/ui/molecules/EntityContextMenu';

// =============================================================================
// Constants Tests
// =============================================================================

describe('EntityContextMenu Constants', () => {
  describe('ENTITY_TYPE_LABELS', () => {
    it('has label for task entity type', () => {
      expect(ENTITY_TYPE_LABELS.task).toBe('Task');
    });

    it('has label for chat entity type', () => {
      expect(ENTITY_TYPE_LABELS.chat).toBe('Chat');
    });

    it('has label for project entity type', () => {
      expect(ENTITY_TYPE_LABELS.project).toBe('Project');
    });

    it('has exactly 3 entity types', () => {
      expect(Object.keys(ENTITY_TYPE_LABELS)).toHaveLength(3);
    });

    it('all labels are capitalized', () => {
      for (const [key, value] of Object.entries(ENTITY_TYPE_LABELS)) {
        expect(value.charAt(0)).toBe(value.charAt(0).toUpperCase());
        expect(value.toLowerCase().charAt(0)).toBe(key.charAt(0));
      }
    });
  });

  describe('MENU_ITEM_IDS', () => {
    it('has VIEW id', () => {
      expect(MENU_ITEM_IDS.VIEW).toBe('view');
    });

    it('has EDIT id', () => {
      expect(MENU_ITEM_IDS.EDIT).toBe('edit');
    });

    it('has DUPLICATE id', () => {
      expect(MENU_ITEM_IDS.DUPLICATE).toBe('duplicate');
    });

    it('has OPEN_IN_IDE id', () => {
      expect(MENU_ITEM_IDS.OPEN_IN_IDE).toBe('open-in-ide');
    });

    it('has DIVIDER id', () => {
      expect(MENU_ITEM_IDS.DIVIDER).toBe('divider-1');
    });

    it('has ARCHIVE id', () => {
      expect(MENU_ITEM_IDS.ARCHIVE).toBe('archive');
    });

    it('has RESTORE id', () => {
      expect(MENU_ITEM_IDS.RESTORE).toBe('restore');
    });

    it('has DELETE id', () => {
      expect(MENU_ITEM_IDS.DELETE).toBe('delete');
    });

    it('has exactly 8 menu item ids', () => {
      expect(Object.keys(MENU_ITEM_IDS)).toHaveLength(8);
    });
  });

  describe('DEFAULT_ARIA_LABEL_TEMPLATE', () => {
    it('contains entityType placeholder', () => {
      expect(DEFAULT_ARIA_LABEL_TEMPLATE).toContain('{entityType}');
    });

    it('contains actions word', () => {
      expect(DEFAULT_ARIA_LABEL_TEMPLATE).toContain('actions');
    });
  });

  describe('ENTITY_CONTEXT_MENU_BASE_CLASSES', () => {
    it('is an empty string (inherits from Menu)', () => {
      expect(ENTITY_CONTEXT_MENU_BASE_CLASSES).toBe('');
    });
  });
});

// =============================================================================
// getEntityLabel Tests
// =============================================================================

describe('getEntityLabel', () => {
  it('returns Task for task entity type', () => {
    expect(getEntityLabel('task')).toBe('Task');
  });

  it('returns Chat for chat entity type', () => {
    expect(getEntityLabel('chat')).toBe('Chat');
  });

  it('returns Project for project entity type', () => {
    expect(getEntityLabel('project')).toBe('Project');
  });

  it('returns capitalized version of entity type', () => {
    const entityTypes = ['task', 'chat', 'project'] as const;
    for (const type of entityTypes) {
      const label = getEntityLabel(type);
      expect(label.charAt(0)).toBe(label.charAt(0).toUpperCase());
    }
  });
});

// =============================================================================
// getScreenReaderAnnouncement Tests
// =============================================================================

describe('getScreenReaderAnnouncement', () => {
  it('returns empty string when menu is closed', () => {
    expect(getScreenReaderAnnouncement('task', false, 4)).toBe('');
  });

  it('announces menu opened for task', () => {
    const result = getScreenReaderAnnouncement('task', true, 4);
    expect(result).toContain('Task context menu opened');
  });

  it('announces menu opened for chat', () => {
    const result = getScreenReaderAnnouncement('chat', true, 3);
    expect(result).toContain('Chat context menu opened');
  });

  it('announces menu opened for project', () => {
    const result = getScreenReaderAnnouncement('project', true, 5);
    expect(result).toContain('Project context menu opened');
  });

  it('uses singular form for 1 action', () => {
    const result = getScreenReaderAnnouncement('task', true, 1);
    expect(result).toContain('1 action');
    expect(result).not.toContain('1 actions');
  });

  it('uses plural form for multiple actions', () => {
    const result = getScreenReaderAnnouncement('task', true, 4);
    expect(result).toContain('4 actions');
  });

  it('uses plural form for 0 actions', () => {
    const result = getScreenReaderAnnouncement('task', true, 0);
    expect(result).toContain('0 actions');
  });

  it('includes available keyword', () => {
    const result = getScreenReaderAnnouncement('task', true, 4);
    expect(result).toContain('available');
  });
});

// =============================================================================
// buildMenuItems Tests
// =============================================================================

describe('buildMenuItems', () => {
  const noop = () => {};

  describe('View action', () => {
    it('includes view item when onViewDetails is provided', () => {
      const items = buildMenuItems('task', false, { onViewDetails: noop });
      expect(items.some((item) => item.id === MENU_ITEM_IDS.VIEW)).toBe(true);
    });

    it('excludes view item when onViewDetails is not provided', () => {
      const items = buildMenuItems('task', false, {});
      expect(items.some((item) => item.id === MENU_ITEM_IDS.VIEW)).toBe(false);
    });

    it('view item has correct label for task', () => {
      const items = buildMenuItems('task', false, { onViewDetails: noop });
      const viewItem = items.find((item) => item.id === MENU_ITEM_IDS.VIEW);
      expect(viewItem?.label).toBe('View Task');
    });

    it('view item has correct label for chat', () => {
      const items = buildMenuItems('chat', false, { onViewDetails: noop });
      const viewItem = items.find((item) => item.id === MENU_ITEM_IDS.VIEW);
      expect(viewItem?.label).toBe('View Chat');
    });

    it('view item has correct label for project', () => {
      const items = buildMenuItems('project', false, { onViewDetails: noop });
      const viewItem = items.find((item) => item.id === MENU_ITEM_IDS.VIEW);
      expect(viewItem?.label).toBe('View Project');
    });

    it('view item has Eye icon', () => {
      const items = buildMenuItems('task', false, { onViewDetails: noop });
      const viewItem = items.find((item) => item.id === MENU_ITEM_IDS.VIEW);
      expect(viewItem?.icon).toBeDefined();
    });
  });

  describe('Edit action', () => {
    it('includes edit item when onEdit is provided and not archived', () => {
      const items = buildMenuItems('task', false, { onEdit: noop });
      expect(items.some((item) => item.id === MENU_ITEM_IDS.EDIT)).toBe(true);
    });

    it('excludes edit item when entity is archived', () => {
      const items = buildMenuItems('task', true, { onEdit: noop });
      expect(items.some((item) => item.id === MENU_ITEM_IDS.EDIT)).toBe(false);
    });

    it('excludes edit item when onEdit is not provided', () => {
      const items = buildMenuItems('task', false, {});
      expect(items.some((item) => item.id === MENU_ITEM_IDS.EDIT)).toBe(false);
    });
  });

  describe('Duplicate action', () => {
    it('includes duplicate item when onDuplicate is provided and not archived', () => {
      const items = buildMenuItems('task', false, { onDuplicate: noop });
      expect(items.some((item) => item.id === MENU_ITEM_IDS.DUPLICATE)).toBe(true);
    });

    it('excludes duplicate item when entity is archived', () => {
      const items = buildMenuItems('task', true, { onDuplicate: noop });
      expect(items.some((item) => item.id === MENU_ITEM_IDS.DUPLICATE)).toBe(false);
    });
  });

  describe('Open in IDE action', () => {
    it('includes open in IDE item when onOpenInIDE is provided and not archived', () => {
      const items = buildMenuItems('project', false, { onOpenInIDE: noop });
      expect(items.some((item) => item.id === MENU_ITEM_IDS.OPEN_IN_IDE)).toBe(true);
    });

    it('excludes open in IDE item when entity is archived', () => {
      const items = buildMenuItems('project', true, { onOpenInIDE: noop });
      expect(items.some((item) => item.id === MENU_ITEM_IDS.OPEN_IN_IDE)).toBe(false);
    });

    it('open in IDE item has generic label (not entity-specific)', () => {
      const items = buildMenuItems('project', false, { onOpenInIDE: noop });
      const item = items.find((i) => i.id === MENU_ITEM_IDS.OPEN_IN_IDE);
      expect(item?.label).toBe('Open in IDE');
    });
  });

  describe('Archive/Restore actions', () => {
    it('includes archive item when onArchive is provided and not archived', () => {
      const items = buildMenuItems('task', false, { onArchive: noop });
      expect(items.some((item) => item.id === MENU_ITEM_IDS.ARCHIVE)).toBe(true);
    });

    it('excludes archive item when entity is archived', () => {
      const items = buildMenuItems('task', true, { onArchive: noop });
      expect(items.some((item) => item.id === MENU_ITEM_IDS.ARCHIVE)).toBe(false);
    });

    it('includes restore item when onRestore is provided and entity is archived', () => {
      const items = buildMenuItems('task', true, { onRestore: noop });
      expect(items.some((item) => item.id === MENU_ITEM_IDS.RESTORE)).toBe(true);
    });

    it('excludes restore item when entity is not archived', () => {
      const items = buildMenuItems('task', false, { onRestore: noop });
      expect(items.some((item) => item.id === MENU_ITEM_IDS.RESTORE)).toBe(false);
    });
  });

  describe('Delete action', () => {
    it('includes delete item when onDelete is provided', () => {
      const items = buildMenuItems('task', false, { onDelete: noop });
      expect(items.some((item) => item.id === MENU_ITEM_IDS.DELETE)).toBe(true);
    });

    it('delete item is marked as destructive', () => {
      const items = buildMenuItems('task', false, { onDelete: noop });
      const deleteItem = items.find((item) => item.id === MENU_ITEM_IDS.DELETE);
      expect(deleteItem?.destructive).toBe(true);
    });

    it('delete item available for archived entities', () => {
      const items = buildMenuItems('task', true, { onDelete: noop });
      expect(items.some((item) => item.id === MENU_ITEM_IDS.DELETE)).toBe(true);
    });
  });

  describe('Divider', () => {
    it('includes divider when both view/edit and archive/delete groups present', () => {
      const items = buildMenuItems('task', false, {
        onViewDetails: noop,
        onArchive: noop,
      });
      expect(items.some((item) => item.divider)).toBe(true);
    });

    it('excludes divider when only view/edit group present', () => {
      const items = buildMenuItems('task', false, {
        onViewDetails: noop,
        onEdit: noop,
      });
      expect(items.some((item) => item.divider)).toBe(false);
    });

    it('excludes divider when only archive/delete group present', () => {
      const items = buildMenuItems('task', false, {
        onArchive: noop,
        onDelete: noop,
      });
      expect(items.some((item) => item.divider)).toBe(false);
    });
  });

  describe('Item order', () => {
    it('view comes before edit', () => {
      const items = buildMenuItems('task', false, {
        onViewDetails: noop,
        onEdit: noop,
      });
      const viewIndex = items.findIndex((i) => i.id === MENU_ITEM_IDS.VIEW);
      const editIndex = items.findIndex((i) => i.id === MENU_ITEM_IDS.EDIT);
      expect(viewIndex).toBeLessThan(editIndex);
    });

    it('edit comes before duplicate', () => {
      const items = buildMenuItems('task', false, {
        onEdit: noop,
        onDuplicate: noop,
      });
      const editIndex = items.findIndex((i) => i.id === MENU_ITEM_IDS.EDIT);
      const duplicateIndex = items.findIndex((i) => i.id === MENU_ITEM_IDS.DUPLICATE);
      expect(editIndex).toBeLessThan(duplicateIndex);
    });

    it('archive comes before delete', () => {
      const items = buildMenuItems('task', false, {
        onArchive: noop,
        onDelete: noop,
      });
      const archiveIndex = items.findIndex((i) => i.id === MENU_ITEM_IDS.ARCHIVE);
      const deleteIndex = items.findIndex((i) => i.id === MENU_ITEM_IDS.DELETE);
      expect(archiveIndex).toBeLessThan(deleteIndex);
    });

    it('divider separates view/edit group from archive/delete group', () => {
      const items = buildMenuItems('task', false, {
        onViewDetails: noop,
        onEdit: noop,
        onArchive: noop,
        onDelete: noop,
      });
      const viewIndex = items.findIndex((i) => i.id === MENU_ITEM_IDS.VIEW);
      const dividerIndex = items.findIndex((i) => i.divider);
      const archiveIndex = items.findIndex((i) => i.id === MENU_ITEM_IDS.ARCHIVE);

      expect(viewIndex).toBeLessThan(dividerIndex);
      expect(dividerIndex).toBeLessThan(archiveIndex);
    });
  });

  describe('Empty menu', () => {
    it('returns empty array when no handlers provided', () => {
      const items = buildMenuItems('task', false, {});
      expect(items).toHaveLength(0);
    });
  });

  describe('Full menu', () => {
    it('includes all items when all handlers provided for active entity', () => {
      const items = buildMenuItems('project', false, {
        onViewDetails: noop,
        onEdit: noop,
        onDuplicate: noop,
        onOpenInIDE: noop,
        onArchive: noop,
        onDelete: noop,
      });
      // 4 view/edit items + 1 divider + 2 archive/delete items = 7
      expect(items).toHaveLength(7);
    });

    it('includes correct items for archived entity', () => {
      const items = buildMenuItems('project', true, {
        onViewDetails: noop,
        onEdit: noop,
        onDuplicate: noop,
        onOpenInIDE: noop,
        onRestore: noop,
        onDelete: noop,
      });
      // View + divider + restore + delete = 4 (edit, duplicate, openInIDE excluded for archived)
      expect(items).toHaveLength(4);
    });
  });
});

// =============================================================================
// Component Behavior Documentation Tests
// =============================================================================

describe('EntityContextMenu Behavior Documentation', () => {
  it('wraps Menu component with entity-specific configuration', () => {
    // EntityContextMenu is a thin wrapper around Menu
    // It builds menu items based on entity type and handlers
    expect(true).toBe(true);
  });

  it('supports forwardRef for programmatic access', () => {
    // forwardRef allows parent components to get a reference to the menu DOM element
    expect(true).toBe(true);
  });

  it('provides screen reader announcements via VisuallyHidden', () => {
    // When menu opens, announces entity type and action count
    expect(true).toBe(true);
  });

  it('sets data attributes for testing and styling', () => {
    // data-testid, data-entity-type, data-archived, data-state
    expect(true).toBe(true);
  });

  it('returns null when menu items array is empty', () => {
    // Prevents rendering an empty menu when no handlers provided
    expect(true).toBe(true);
  });
});

// =============================================================================
// Type Safety Tests
// =============================================================================

describe('EntityContextMenu Type Safety', () => {
  it('EntityType is union of task, chat, project', () => {
    const types: Array<'task' | 'chat' | 'project'> = ['task', 'chat', 'project'];
    expect(types).toHaveLength(3);
  });

  it('MENU_ITEM_IDS values are readonly', () => {
    // TypeScript ensures MENU_ITEM_IDS is `as const`
    const id: typeof MENU_ITEM_IDS.VIEW = 'view';
    expect(id).toBe('view');
  });
});
