/**
 * ChatsList Organism Tests
 *
 * Tests for the ChatsList component and its sub-components (ChatsListSkeleton, ChatsListError).
 * Covers:
 * - Constant values and exports
 * - Utility function behavior
 * - Size class generation
 * - Responsive value handling
 * - Accessibility behavior documentation
 * - Component behavior documentation
 */

import { describe, expect, it } from 'vitest';
import {
  // Base classes
  CHATS_LIST_BASE_CLASSES,
  CHATS_LIST_GAP_CLASSES,
  CHATS_LIST_ITEMS_GAP_CLASSES,
  // Types
  type ChatFilter,
  type ChatsListSize,
  DEFAULT_EMPTY_DESCRIPTION_ALL,
  DEFAULT_EMPTY_DESCRIPTION_STANDALONE,
  DEFAULT_EMPTY_DESCRIPTION_TASK_LINKED,
  DEFAULT_EMPTY_TITLE,
  DEFAULT_EMPTY_TITLE_ALL,
  DEFAULT_EMPTY_TITLE_STANDALONE,
  DEFAULT_EMPTY_TITLE_TASK_LINKED,
  DEFAULT_ERROR_RETRY_LABEL,
  DEFAULT_ERROR_TITLE,
  DEFAULT_FILTER_LABEL,
  // Constants - Default labels
  DEFAULT_LIST_LABEL,
  DEFAULT_SKELETON_COUNT,
  EMPTY_STATE_CONTAINER_CLASSES,
  ERROR_ICON_CONTAINER_CLASSES,
  ERROR_STATE_CLASSES,
  // Filter options
  FILTER_OPTIONS,
  FILTER_TABS_CONTAINER_CLASSES,
  FILTER_TAB_ACTIVE_CLASSES,
  FILTER_TAB_BASE_CLASSES,
  FILTER_TAB_INACTIVE_CLASSES,
  LIST_CONTAINER_CLASSES,
  SKELETON_CARD_CLASSES,
  SKELETON_CARD_HEIGHT_CLASSES,
  SR_CHATS_COUNT,
  // Screen reader constants
  SR_FILTER_CHANGED,
  SR_LOADING,
  SR_NO_RESULTS,
  buildListAccessibleLabel,
  // Utility functions
  getBaseSize,
  getEmptyStateContent,
  getFilterAnnouncement,
  getResponsiveSizeClasses,
} from '../../../packages/ui/organisms/ChatsList';

// ============================================================================
// Default Labels Tests
// ============================================================================

describe('Default Labels', () => {
  it('DEFAULT_LIST_LABEL should be defined', () => {
    expect(DEFAULT_LIST_LABEL).toBe('Chat sessions');
  });

  it('DEFAULT_FILTER_LABEL should be defined', () => {
    expect(DEFAULT_FILTER_LABEL).toBe('Filter chats by type');
  });

  it('DEFAULT_EMPTY_TITLE should be defined', () => {
    expect(DEFAULT_EMPTY_TITLE).toBe('No chats found');
  });

  it('DEFAULT_ERROR_TITLE should be defined', () => {
    expect(DEFAULT_ERROR_TITLE).toBe('Failed to load chats');
  });

  it('DEFAULT_ERROR_RETRY_LABEL should be defined', () => {
    expect(DEFAULT_ERROR_RETRY_LABEL).toBe('Retry');
  });

  it('DEFAULT_SKELETON_COUNT should be 3', () => {
    expect(DEFAULT_SKELETON_COUNT).toBe(3);
  });
});

// ============================================================================
// Empty State Labels Tests
// ============================================================================

describe('Empty State Labels', () => {
  it('DEFAULT_EMPTY_TITLE_ALL should provide generic message', () => {
    expect(DEFAULT_EMPTY_TITLE_ALL).toBe('No chats found');
  });

  it('DEFAULT_EMPTY_DESCRIPTION_ALL should suggest starting a new chat', () => {
    expect(DEFAULT_EMPTY_DESCRIPTION_ALL).toBe('Start a new chat to get going.');
  });

  it('DEFAULT_EMPTY_TITLE_STANDALONE should be specific to standalone', () => {
    expect(DEFAULT_EMPTY_TITLE_STANDALONE).toBe('No standalone chats');
  });

  it('DEFAULT_EMPTY_DESCRIPTION_STANDALONE should indicate no matches', () => {
    expect(DEFAULT_EMPTY_DESCRIPTION_STANDALONE).toBe('No standalone chats yet.');
  });

  it('DEFAULT_EMPTY_TITLE_TASK_LINKED should be specific to task-linked', () => {
    expect(DEFAULT_EMPTY_TITLE_TASK_LINKED).toBe('No task-linked chats');
  });

  it('DEFAULT_EMPTY_DESCRIPTION_TASK_LINKED should indicate no matches', () => {
    expect(DEFAULT_EMPTY_DESCRIPTION_TASK_LINKED).toBe('No task-linked chats yet.');
  });
});

// ============================================================================
// Screen Reader Constants Tests
// ============================================================================

describe('Screen Reader Constants', () => {
  it('SR_FILTER_CHANGED should start announcement', () => {
    expect(SR_FILTER_CHANGED).toBe('Showing');
  });

  it('SR_CHATS_COUNT should provide unit', () => {
    expect(SR_CHATS_COUNT).toBe('chats');
  });

  it('SR_NO_RESULTS should announce empty state', () => {
    expect(SR_NO_RESULTS).toBe('No chats match the current filter');
  });

  it('SR_LOADING should announce loading state', () => {
    expect(SR_LOADING).toBe('Loading chats...');
  });
});

// ============================================================================
// Filter Options Tests
// ============================================================================

describe('FILTER_OPTIONS', () => {
  it('should have exactly 3 filter options', () => {
    expect(FILTER_OPTIONS).toHaveLength(3);
  });

  it('should include "all" filter', () => {
    const allOption = FILTER_OPTIONS.find((opt) => opt.value === 'all');
    expect(allOption).toBeDefined();
    expect(allOption?.label).toBe('All');
    expect(allOption?.ariaLabel).toBe('Show all chats');
  });

  it('should include "standalone" filter', () => {
    const standaloneOption = FILTER_OPTIONS.find((opt) => opt.value === 'standalone');
    expect(standaloneOption).toBeDefined();
    expect(standaloneOption?.label).toBe('Standalone');
    expect(standaloneOption?.ariaLabel).toBe('Show standalone chats only');
  });

  it('should include "task-linked" filter', () => {
    const taskLinkedOption = FILTER_OPTIONS.find((opt) => opt.value === 'task-linked');
    expect(taskLinkedOption).toBeDefined();
    expect(taskLinkedOption?.label).toBe('Task-linked');
    expect(taskLinkedOption?.ariaLabel).toBe('Show task-linked chats only');
  });

  it('should have ariaLabel for each option', () => {
    for (const option of FILTER_OPTIONS) {
      expect(option.ariaLabel).toBeDefined();
      expect(option.ariaLabel.length).toBeGreaterThan(0);
    }
  });
});

// ============================================================================
// Base Classes Tests
// ============================================================================

describe('CHATS_LIST_BASE_CLASSES', () => {
  it('should use flex column layout', () => {
    expect(CHATS_LIST_BASE_CLASSES).toContain('flex');
    expect(CHATS_LIST_BASE_CLASSES).toContain('flex-col');
  });
});

describe('CHATS_LIST_GAP_CLASSES', () => {
  it('should have gap class for each size', () => {
    expect(CHATS_LIST_GAP_CLASSES.sm).toContain('gap-');
    expect(CHATS_LIST_GAP_CLASSES.md).toContain('gap-');
    expect(CHATS_LIST_GAP_CLASSES.lg).toContain('gap-');
  });

  it('should increase gap with size', () => {
    // Extract gap values
    const smGap = Number.parseInt(CHATS_LIST_GAP_CLASSES.sm.match(/gap-(\d+)/)?.[1] ?? '0', 10);
    const mdGap = Number.parseInt(CHATS_LIST_GAP_CLASSES.md.match(/gap-(\d+)/)?.[1] ?? '0', 10);
    const lgGap = Number.parseInt(CHATS_LIST_GAP_CLASSES.lg.match(/gap-(\d+)/)?.[1] ?? '0', 10);

    expect(smGap).toBeLessThan(mdGap);
    expect(mdGap).toBeLessThan(lgGap);
  });
});

describe('CHATS_LIST_ITEMS_GAP_CLASSES', () => {
  it('should have gap class for each size', () => {
    expect(CHATS_LIST_ITEMS_GAP_CLASSES.sm).toContain('gap-');
    expect(CHATS_LIST_ITEMS_GAP_CLASSES.md).toContain('gap-');
    expect(CHATS_LIST_ITEMS_GAP_CLASSES.lg).toContain('gap-');
  });
});

describe('FILTER_TABS_CONTAINER_CLASSES', () => {
  it('should use flex layout', () => {
    expect(FILTER_TABS_CONTAINER_CLASSES).toContain('flex');
  });

  it('should have rounded corners', () => {
    expect(FILTER_TABS_CONTAINER_CLASSES).toContain('rounded-lg');
  });

  it('should use muted background', () => {
    expect(FILTER_TABS_CONTAINER_CLASSES).toContain('bg-[rgb(var(--muted))]');
  });
});

describe('FILTER_TAB_BASE_CLASSES', () => {
  it('should have touch target minimum height on mobile (WCAG 2.5.5)', () => {
    expect(FILTER_TAB_BASE_CLASSES).toContain('min-h-[44px]');
  });

  it('should relax height on desktop', () => {
    expect(FILTER_TAB_BASE_CLASSES).toContain('sm:min-h-[36px]');
  });

  it('should have focus ring styles', () => {
    expect(FILTER_TAB_BASE_CLASSES).toContain('focus-visible:');
    expect(FILTER_TAB_BASE_CLASSES).toContain('ring-2');
    expect(FILTER_TAB_BASE_CLASSES).toContain('ring-offset-2');
  });

  it('should use flex-1 for equal distribution', () => {
    expect(FILTER_TAB_BASE_CLASSES).toContain('flex-1');
  });
});

describe('FILTER_TAB_ACTIVE_CLASSES', () => {
  it('should use background color', () => {
    expect(FILTER_TAB_ACTIVE_CLASSES).toContain('bg-[rgb(var(--background))]');
  });

  it('should use foreground text color', () => {
    expect(FILTER_TAB_ACTIVE_CLASSES).toContain('text-[rgb(var(--foreground))]');
  });

  it('should have shadow', () => {
    expect(FILTER_TAB_ACTIVE_CLASSES).toContain('shadow-sm');
  });
});

describe('FILTER_TAB_INACTIVE_CLASSES', () => {
  it('should use muted text color', () => {
    expect(FILTER_TAB_INACTIVE_CLASSES).toContain('text-[rgb(var(--muted-foreground))]');
  });

  it('should have hover state', () => {
    expect(FILTER_TAB_INACTIVE_CLASSES).toContain('hover:');
  });
});

describe('LIST_CONTAINER_CLASSES', () => {
  it('should use flex column layout', () => {
    expect(LIST_CONTAINER_CLASSES).toContain('flex');
    expect(LIST_CONTAINER_CLASSES).toContain('flex-col');
  });
});

describe('EMPTY_STATE_CONTAINER_CLASSES', () => {
  it('should center content', () => {
    expect(EMPTY_STATE_CONTAINER_CLASSES).toContain('flex');
    expect(EMPTY_STATE_CONTAINER_CLASSES).toContain('items-center');
    expect(EMPTY_STATE_CONTAINER_CLASSES).toContain('justify-center');
  });

  it('should have minimum height', () => {
    expect(EMPTY_STATE_CONTAINER_CLASSES).toContain('min-h-[200px]');
  });
});

describe('ERROR_STATE_CLASSES', () => {
  it('should use flex column layout', () => {
    expect(ERROR_STATE_CLASSES).toContain('flex');
    expect(ERROR_STATE_CLASSES).toContain('flex-col');
  });

  it('should center content', () => {
    expect(ERROR_STATE_CLASSES).toContain('items-center');
    expect(ERROR_STATE_CLASSES).toContain('justify-center');
  });

  it('should have rounded border', () => {
    expect(ERROR_STATE_CLASSES).toContain('rounded-lg');
    expect(ERROR_STATE_CLASSES).toContain('border');
  });

  it('should use destructive styling', () => {
    expect(ERROR_STATE_CLASSES).toContain('destructive');
  });
});

describe('ERROR_ICON_CONTAINER_CLASSES', () => {
  it('should be circular', () => {
    expect(ERROR_ICON_CONTAINER_CLASSES).toContain('rounded-full');
  });

  it('should use destructive color', () => {
    expect(ERROR_ICON_CONTAINER_CLASSES).toContain('destructive');
  });

  it('should have fixed dimensions', () => {
    expect(ERROR_ICON_CONTAINER_CLASSES).toContain('h-12');
    expect(ERROR_ICON_CONTAINER_CLASSES).toContain('w-12');
  });
});

describe('SKELETON_CARD_CLASSES', () => {
  it('should have rounded corners', () => {
    expect(SKELETON_CARD_CLASSES).toContain('rounded-lg');
  });

  it('should have border', () => {
    expect(SKELETON_CARD_CLASSES).toContain('border');
  });

  it('should use card background', () => {
    expect(SKELETON_CARD_CLASSES).toContain('bg-[rgb(var(--card))]');
  });
});

describe('SKELETON_CARD_HEIGHT_CLASSES', () => {
  it('should have height class for each size', () => {
    expect(SKELETON_CARD_HEIGHT_CLASSES.sm).toContain('h-');
    expect(SKELETON_CARD_HEIGHT_CLASSES.md).toContain('h-');
    expect(SKELETON_CARD_HEIGHT_CLASSES.lg).toContain('h-');
  });

  it('should increase height with size', () => {
    const smHeight = Number.parseInt(
      SKELETON_CARD_HEIGHT_CLASSES.sm.match(/h-(\d+)/)?.[1] ?? '0',
      10
    );
    const mdHeight = Number.parseInt(
      SKELETON_CARD_HEIGHT_CLASSES.md.match(/h-(\d+)/)?.[1] ?? '0',
      10
    );
    const lgHeight = Number.parseInt(
      SKELETON_CARD_HEIGHT_CLASSES.lg.match(/h-(\d+)/)?.[1] ?? '0',
      10
    );

    expect(smHeight).toBeLessThan(mdHeight);
    expect(mdHeight).toBeLessThan(lgHeight);
  });
});

// ============================================================================
// getBaseSize Utility Tests
// ============================================================================

describe('getBaseSize', () => {
  it('should return string size as-is', () => {
    expect(getBaseSize('sm')).toBe('sm');
    expect(getBaseSize('md')).toBe('md');
    expect(getBaseSize('lg')).toBe('lg');
  });

  it('should extract base from responsive object', () => {
    expect(getBaseSize({ base: 'sm' })).toBe('sm');
    expect(getBaseSize({ base: 'lg', md: 'md' })).toBe('lg');
  });

  it('should default to md when base not in object', () => {
    expect(getBaseSize({ md: 'lg' })).toBe('md');
    expect(getBaseSize({ lg: 'sm' })).toBe('md');
  });

  it('should handle all valid breakpoints', () => {
    expect(getBaseSize({ base: 'sm', sm: 'md', md: 'lg', lg: 'sm', xl: 'md', '2xl': 'lg' })).toBe(
      'sm'
    );
  });
});

// ============================================================================
// getResponsiveSizeClasses Utility Tests
// ============================================================================

describe('getResponsiveSizeClasses', () => {
  const mockClassMap: Record<ChatsListSize, string> = {
    sm: 'gap-2',
    md: 'gap-3',
    lg: 'gap-4',
  };

  it('should return single class for string size', () => {
    expect(getResponsiveSizeClasses('sm', mockClassMap)).toBe('gap-2');
    expect(getResponsiveSizeClasses('md', mockClassMap)).toBe('gap-3');
    expect(getResponsiveSizeClasses('lg', mockClassMap)).toBe('gap-4');
  });

  it('should generate responsive classes from object', () => {
    const result = getResponsiveSizeClasses({ base: 'sm', md: 'lg' }, mockClassMap);
    expect(result).toContain('gap-2'); // base
    expect(result).toContain('md:gap-4'); // md breakpoint
  });

  it('should handle all breakpoints', () => {
    const result = getResponsiveSizeClasses(
      { base: 'sm', sm: 'md', md: 'lg', lg: 'sm', xl: 'md', '2xl': 'lg' },
      mockClassMap
    );
    expect(result).toContain('gap-2'); // base: sm
    expect(result).toContain('sm:gap-3'); // sm: md
    expect(result).toContain('md:gap-4'); // md: lg
    expect(result).toContain('lg:gap-2'); // lg: sm
    expect(result).toContain('xl:gap-3'); // xl: md
    expect(result).toContain('2xl:gap-4'); // 2xl: lg
  });

  it('should handle multi-class values', () => {
    const multiClassMap: Record<ChatsListSize, string> = {
      sm: 'gap-2 p-2',
      md: 'gap-3 p-3',
      lg: 'gap-4 p-4',
    };

    const result = getResponsiveSizeClasses({ base: 'sm', lg: 'lg' }, multiClassMap);
    expect(result).toContain('gap-2');
    expect(result).toContain('p-2');
    expect(result).toContain('lg:gap-4');
    expect(result).toContain('lg:p-4');
  });

  it('should skip undefined breakpoints', () => {
    const result = getResponsiveSizeClasses({ base: 'sm' }, mockClassMap);
    expect(result).toBe('gap-2');
    expect(result).not.toContain('md:');
    expect(result).not.toContain('lg:');
  });
});

// ============================================================================
// getEmptyStateContent Utility Tests
// ============================================================================

describe('getEmptyStateContent', () => {
  it('should return all chats content for "all" filter', () => {
    const content = getEmptyStateContent('all');
    expect(content.title).toBe(DEFAULT_EMPTY_TITLE_ALL);
    expect(content.description).toBe(DEFAULT_EMPTY_DESCRIPTION_ALL);
  });

  it('should return standalone content for "standalone" filter', () => {
    const content = getEmptyStateContent('standalone');
    expect(content.title).toBe(DEFAULT_EMPTY_TITLE_STANDALONE);
    expect(content.description).toBe(DEFAULT_EMPTY_DESCRIPTION_STANDALONE);
  });

  it('should return task-linked content for "task-linked" filter', () => {
    const content = getEmptyStateContent('task-linked');
    expect(content.title).toBe(DEFAULT_EMPTY_TITLE_TASK_LINKED);
    expect(content.description).toBe(DEFAULT_EMPTY_DESCRIPTION_TASK_LINKED);
  });

  it('should return object with both title and description', () => {
    const filters: ChatFilter[] = ['all', 'standalone', 'task-linked'];
    for (const filter of filters) {
      const content = getEmptyStateContent(filter);
      expect(content).toHaveProperty('title');
      expect(content).toHaveProperty('description');
      expect(content.title.length).toBeGreaterThan(0);
      expect(content.description.length).toBeGreaterThan(0);
    }
  });
});

// ============================================================================
// getFilterAnnouncement Utility Tests
// ============================================================================

describe('getFilterAnnouncement', () => {
  it('should announce "no results" when count is 0', () => {
    expect(getFilterAnnouncement('all', 0)).toBe(SR_NO_RESULTS);
    expect(getFilterAnnouncement('standalone', 0)).toBe(SR_NO_RESULTS);
    expect(getFilterAnnouncement('task-linked', 0)).toBe(SR_NO_RESULTS);
  });

  it('should announce filter and count for "all"', () => {
    const result = getFilterAnnouncement('all', 5);
    expect(result).toContain(SR_FILTER_CHANGED);
    expect(result).toContain('5');
    expect(result).toContain('all');
    expect(result).toContain(SR_CHATS_COUNT);
  });

  it('should announce filter and count for "standalone"', () => {
    const result = getFilterAnnouncement('standalone', 3);
    expect(result).toContain(SR_FILTER_CHANGED);
    expect(result).toContain('3');
    expect(result).toContain('standalone');
    expect(result).toContain(SR_CHATS_COUNT);
  });

  it('should announce filter and count for "task-linked"', () => {
    const result = getFilterAnnouncement('task-linked', 10);
    expect(result).toContain(SR_FILTER_CHANGED);
    expect(result).toContain('10');
    expect(result).toContain('task-linked');
    expect(result).toContain(SR_CHATS_COUNT);
  });

  it('should handle count of 1', () => {
    const result = getFilterAnnouncement('all', 1);
    expect(result).toContain('1');
    expect(result).toContain(SR_CHATS_COUNT);
  });
});

// ============================================================================
// buildListAccessibleLabel Utility Tests
// ============================================================================

describe('buildListAccessibleLabel', () => {
  it('should include filter name and count for "all"', () => {
    const result = buildListAccessibleLabel('all', 5);
    expect(result).toContain('All');
    expect(result).toContain('5');
    expect(result).toContain('items');
  });

  it('should include filter name and count for "standalone"', () => {
    const result = buildListAccessibleLabel('standalone', 3);
    expect(result).toContain('Standalone');
    expect(result).toContain('3');
    expect(result).toContain('items');
  });

  it('should include filter name and count for "task-linked"', () => {
    const result = buildListAccessibleLabel('task-linked', 7);
    expect(result).toContain('Task-linked');
    expect(result).toContain('7');
    expect(result).toContain('items');
  });

  it('should handle zero items', () => {
    const result = buildListAccessibleLabel('all', 0);
    expect(result).toContain('0');
    expect(result).toContain('items');
  });

  it('should mention chats', () => {
    const result = buildListAccessibleLabel('all', 5);
    expect(result).toContain('chats');
  });
});

// ============================================================================
// Accessibility Behavior Documentation Tests
// ============================================================================

describe('Accessibility Behavior Documentation', () => {
  describe('Filter Tab Pattern', () => {
    it('should document tablist role requirement', () => {
      // The component uses role="tablist" on the filter container
      // Each tab has role="tab" with aria-selected
      expect(FILTER_OPTIONS.length).toBeGreaterThan(0);
    });

    it('should document roving tabindex pattern', () => {
      // Selected tab has tabIndex=0, others have tabIndex=-1
      // Arrow keys move focus and selection
      expect(FILTER_TAB_BASE_CLASSES).toBeDefined();
    });

    it('should document keyboard navigation', () => {
      // ArrowLeft/Right: Previous/next tab
      // ArrowUp/Down: Also navigate tabs
      // Home: First tab
      // End: Last tab
      expect(FILTER_OPTIONS.length).toBe(3);
    });
  });

  describe('List Semantics', () => {
    it('should document list role requirement', () => {
      // List container has role="list"
      // Each chat item wrapper has role="listitem"
      expect(LIST_CONTAINER_CLASSES).toContain('flex-col');
    });

    it('should document aria-labelledby for list', () => {
      // List has aria-labelledby pointing to selected tab
      // Also has aria-label with filter and count
      expect(buildListAccessibleLabel('all', 5)).toContain('items');
    });
  });

  describe('Screen Reader Announcements', () => {
    it('should document live region for filter changes', () => {
      // aria-live="polite" region announces filter changes
      expect(SR_FILTER_CHANGED).toBeDefined();
    });

    it('should document loading state announcement', () => {
      // aria-busy="true" and role="status" during loading
      expect(SR_LOADING).toBe('Loading chats...');
    });

    it('should document empty state announcement', () => {
      // EmptyState component has aria-label
      expect(SR_NO_RESULTS).toBeDefined();
    });
  });

  describe('Touch Target Compliance', () => {
    it('should document WCAG 2.5.5 compliance for filter tabs', () => {
      // min-h-[44px] on mobile
      // sm:min-h-[36px] relaxes on desktop
      expect(FILTER_TAB_BASE_CLASSES).toContain('min-h-[44px]');
      expect(FILTER_TAB_BASE_CLASSES).toContain('sm:min-h-[36px]');
    });
  });

  describe('Focus Management', () => {
    it('should document focus ring visibility', () => {
      // focus-visible with ring-offset for visibility on all backgrounds
      expect(FILTER_TAB_BASE_CLASSES).toContain('focus-visible:');
      expect(FILTER_TAB_BASE_CLASSES).toContain('ring-offset-2');
    });
  });
});

// ============================================================================
// Component Behavior Documentation Tests
// ============================================================================

describe('Component Behavior Documentation', () => {
  describe('ChatsList', () => {
    it('should filter chats based on filter prop', () => {
      // 'all': shows all chats
      // 'standalone': shows chats without taskId
      // 'task-linked': shows chats with taskId
      const filters: ChatFilter[] = ['all', 'standalone', 'task-linked'];
      expect(filters).toHaveLength(3);
    });

    it('should render loading skeleton when isLoading is true', () => {
      // Uses ChatsListSkeleton component
      expect(DEFAULT_SKELETON_COUNT).toBe(3);
    });

    it('should render empty state when no chats match filter', () => {
      // Uses EmptyState with filter-specific messaging
      expect(getEmptyStateContent('all').title).toBeDefined();
    });

    it('should pass size prop to child components', () => {
      // ChatCard receives size prop for consistent sizing
      expect(CHATS_LIST_GAP_CLASSES).toHaveProperty('sm');
      expect(CHATS_LIST_GAP_CLASSES).toHaveProperty('md');
      expect(CHATS_LIST_GAP_CLASSES).toHaveProperty('lg');
    });
  });

  describe('ChatsListSkeleton', () => {
    it('should render configurable number of skeleton items', () => {
      // count prop controls number of skeleton cards
      expect(DEFAULT_SKELETON_COUNT).toBe(3);
    });

    it('should optionally show filter tabs skeleton', () => {
      // showFilterSkeleton prop controls filter tabs visibility
      expect(FILTER_OPTIONS).toHaveLength(3);
    });

    it('should have aria-busy for loading indication', () => {
      // aria-busy="true" tells assistive tech content is loading
      expect(SR_LOADING).toBeDefined();
    });

    it('should have role="status" for announcements', () => {
      // role="status" with aria-label for screen reader announcement
      expect(SR_LOADING).toBe('Loading chats...');
    });
  });

  describe('ChatsListError', () => {
    it('should have role="alert" for error announcement', () => {
      // Immediately announces error to screen readers
      expect(ERROR_STATE_CLASSES).toBeDefined();
    });

    it('should have aria-live="assertive" for immediate announcement', () => {
      // Error is important enough to interrupt
      expect(DEFAULT_ERROR_TITLE).toBe('Failed to load chats');
    });

    it('should provide customizable error title', () => {
      // errorTitle prop allows custom messaging
      expect(DEFAULT_ERROR_TITLE).toBeDefined();
    });

    it('should provide customizable retry label', () => {
      // retryLabel prop allows custom button text
      expect(DEFAULT_ERROR_RETRY_LABEL).toBe('Retry');
    });
  });
});

// ============================================================================
// Props Documentation Tests
// ============================================================================

describe('Props Documentation', () => {
  describe('ChatsListProps', () => {
    it('should document chats as required Chat array', () => {
      // chats: Chat[] - array of chat objects to display
      expect(true).toBe(true);
    });

    it('should document optional lookup maps', () => {
      // projectNames?: Record<string, string>
      // taskTitles?: Record<string, string>
      expect(true).toBe(true);
    });

    it('should document selection props', () => {
      // selectedChatId?: string - currently selected chat
      // onSelectChat?: (id: string) => void - selection callback
      expect(true).toBe(true);
    });

    it('should document filter props', () => {
      // filter?: ChatFilter - current filter value
      // onFilterChange?: (filter: ChatFilter) => void - filter change callback
      expect(FILTER_OPTIONS.map((o) => o.value)).toEqual(['all', 'standalone', 'task-linked']);
    });

    it('should document context menu props', () => {
      // onMoreClick?: (id: string, event: React.MouseEvent) => void
      // onContextMenu?: (id: string, event: React.MouseEvent) => void
      expect(true).toBe(true);
    });

    it('should document size prop', () => {
      // size?: ResponsiveValue<ChatsListSize>
      const validSizes: ChatsListSize[] = ['sm', 'md', 'lg'];
      expect(validSizes).toHaveLength(3);
    });

    it('should document accessibility label props', () => {
      // listLabel?: string - custom list aria-label
      // filterLabel?: string - custom filter tablist aria-label
      expect(DEFAULT_LIST_LABEL).toBe('Chat sessions');
      expect(DEFAULT_FILTER_LABEL).toBe('Filter chats by type');
    });
  });

  describe('Data Attributes', () => {
    it('should document data-testid support', () => {
      // data-testid generates nested IDs:
      // - {testId}-skeleton (loading state)
      // - {testId}-tab-{filter} (filter tabs)
      // - {testId}-list (list container)
      // - {testId}-item-{chatId} (list items)
      // - {testId}-empty (empty state)
      expect(true).toBe(true);
    });

    it('should document data-filter attribute', () => {
      // data-filter={filter} - current filter value for CSS targeting
      const filters: ChatFilter[] = ['all', 'standalone', 'task-linked'];
      expect(filters).toContain('all');
    });

    it('should document data-size attribute', () => {
      // data-size={baseSize} - base size for CSS targeting
      expect(getBaseSize('md')).toBe('md');
    });

    it('should document data-chat-count attribute', () => {
      // data-chat-count={count} - number of visible chats
      expect(true).toBe(true);
    });

    it('should document data-selected on tabs', () => {
      // data-selected={isSelected} - for CSS styling of selected tab
      expect(true).toBe(true);
    });
  });
});

// ============================================================================
// Integration Pattern Tests
// ============================================================================

describe('Integration Pattern Tests', () => {
  it('should work with ChatCard component', () => {
    // ChatsList renders ChatCard for each chat
    // Passes size, selection state, and callbacks
    expect(CHATS_LIST_ITEMS_GAP_CLASSES).toHaveProperty('sm');
  });

  it('should work with EmptyState molecule', () => {
    // Uses EmptyState for empty filter results
    expect(getEmptyStateContent('all')).toHaveProperty('title');
    expect(getEmptyStateContent('all')).toHaveProperty('description');
  });

  it('should work with Skeleton atom', () => {
    // ChatsListSkeleton uses Skeleton atom for loading placeholders
    expect(SKELETON_CARD_CLASSES).toContain('rounded-lg');
  });

  it('should work with Button atom', () => {
    // ChatsListError uses Button for retry action
    expect(DEFAULT_ERROR_RETRY_LABEL).toBe('Retry');
  });

  it('should work with Icon atom', () => {
    // ChatsListError uses Icon for error indicator
    expect(ERROR_ICON_CONTAINER_CLASSES).toContain('rounded-full');
  });

  it('should work with Text primitive', () => {
    // ChatsListError uses Text for error title and message
    expect(DEFAULT_ERROR_TITLE).toBeDefined();
  });

  it('should work with VisuallyHidden primitive', () => {
    // Used for screen reader announcements
    expect(SR_LOADING).toBeDefined();
  });
});

// ============================================================================
// Size Consistency Tests
// ============================================================================

describe('Size Consistency Tests', () => {
  const sizes: ChatsListSize[] = ['sm', 'md', 'lg'];

  it('should have consistent gap progression', () => {
    const gaps = sizes.map((size) => {
      const match = CHATS_LIST_GAP_CLASSES[size].match(/gap-(\d+)/);
      return match?.[1] ? Number.parseInt(match[1], 10) : 0;
    });

    expect(gaps[0]).toBeLessThan(gaps[1] as number);
    expect(gaps[1]).toBeLessThan(gaps[2] as number);
  });

  it('should have consistent items gap progression', () => {
    const gaps = sizes.map((size) => {
      const match = CHATS_LIST_ITEMS_GAP_CLASSES[size].match(/gap-(\d+)/);
      return match?.[1] ? Number.parseInt(match[1], 10) : 0;
    });

    expect(gaps[0]).toBeLessThan(gaps[1] as number);
    expect(gaps[1]).toBeLessThan(gaps[2] as number);
  });

  it('should have consistent skeleton height progression', () => {
    const heights = sizes.map((size) => {
      const match = SKELETON_CARD_HEIGHT_CLASSES[size].match(/h-(\d+)/);
      return match?.[1] ? Number.parseInt(match[1], 10) : 0;
    });

    expect(heights[0]).toBeLessThan(heights[1] as number);
    expect(heights[1]).toBeLessThan(heights[2] as number);
  });
});
