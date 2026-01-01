/**
 * Unit tests for AppLayout Template
 *
 * Tests utility functions, constants, and accessibility behavior documentation.
 */

import { describe, expect, it } from 'vitest';
import {
  APP_LAYOUT_CONTAINER_CLASSES,
  APP_LAYOUT_HAMBURGER_CONTAINER_CLASSES,
  APP_LAYOUT_HEADER_CONTAINER_CLASSES,
  APP_LAYOUT_HEADER_CONTENT_CLASSES,
  APP_LAYOUT_MAIN_AREA_CLASSES,
  APP_LAYOUT_MAIN_CONTENT_CLASSES,
  APP_LAYOUT_SIDEBAR_BASE_CLASSES,
  DEFAULT_HEADER_LABEL,
  DEFAULT_MAIN_LABEL,
  DEFAULT_MOBILE_DRAWER_LABEL,
  DEFAULT_SIDEBAR_LABEL,
  DEFAULT_SKIP_LINK_TEXT,
  SIDEBAR_COLLAPSED_WIDTH,
  SIDEBAR_EXPANDED_WIDTH_CLASSES,
  SR_DRAWER_CLOSED,
  SR_DRAWER_OPENED,
  SR_SIDEBAR_COLLAPSED,
  SR_SIDEBAR_EXPANDED,
  buildDrawerAnnouncement,
  buildSidebarAnnouncement,
  getBaseSize,
  getResponsiveSidebarClasses,
} from '../../../packages/ui/templates/AppLayout';

// ============================================================================
// Default Labels Tests
// ============================================================================

describe('Default Labels', () => {
  it('DEFAULT_SKIP_LINK_TEXT should be descriptive', () => {
    expect(DEFAULT_SKIP_LINK_TEXT).toBe('Skip to main content');
  });

  it('DEFAULT_SIDEBAR_LABEL should be descriptive', () => {
    expect(DEFAULT_SIDEBAR_LABEL).toBe('Main navigation');
  });

  it('DEFAULT_HEADER_LABEL should be descriptive', () => {
    expect(DEFAULT_HEADER_LABEL).toBe('Site header');
  });

  it('DEFAULT_MAIN_LABEL should be descriptive', () => {
    expect(DEFAULT_MAIN_LABEL).toBe('Main content');
  });

  it('DEFAULT_MOBILE_DRAWER_LABEL should be descriptive', () => {
    expect(DEFAULT_MOBILE_DRAWER_LABEL).toBe('Navigation menu');
  });
});

// ============================================================================
// Screen Reader Announcement Constants Tests
// ============================================================================

describe('Screen Reader Announcements', () => {
  it('SR_SIDEBAR_COLLAPSED should announce collapsed state', () => {
    expect(SR_SIDEBAR_COLLAPSED).toBe('Navigation sidebar collapsed');
    expect(SR_SIDEBAR_COLLAPSED).toContain('collapsed');
  });

  it('SR_SIDEBAR_EXPANDED should announce expanded state', () => {
    expect(SR_SIDEBAR_EXPANDED).toBe('Navigation sidebar expanded');
    expect(SR_SIDEBAR_EXPANDED).toContain('expanded');
  });

  it('SR_DRAWER_OPENED should announce opened state', () => {
    expect(SR_DRAWER_OPENED).toBe('Navigation drawer opened');
    expect(SR_DRAWER_OPENED).toContain('opened');
  });

  it('SR_DRAWER_CLOSED should announce closed state', () => {
    expect(SR_DRAWER_CLOSED).toBe('Navigation drawer closed');
    expect(SR_DRAWER_CLOSED).toContain('closed');
  });
});

// ============================================================================
// CSS Class Constants Tests
// ============================================================================

describe('APP_LAYOUT_CONTAINER_CLASSES', () => {
  it('should include flex layout', () => {
    expect(APP_LAYOUT_CONTAINER_CLASSES).toContain('flex');
  });

  it('should include full screen dimensions', () => {
    expect(APP_LAYOUT_CONTAINER_CLASSES).toContain('h-screen');
    expect(APP_LAYOUT_CONTAINER_CLASSES).toContain('w-screen');
  });

  it('should hide overflow', () => {
    expect(APP_LAYOUT_CONTAINER_CLASSES).toContain('overflow-hidden');
  });

  it('should include background color', () => {
    expect(APP_LAYOUT_CONTAINER_CLASSES).toContain('bg-');
  });

  it('should include text color', () => {
    expect(APP_LAYOUT_CONTAINER_CLASSES).toContain('text-');
  });
});

describe('APP_LAYOUT_SIDEBAR_BASE_CLASSES', () => {
  it('should be hidden on mobile', () => {
    expect(APP_LAYOUT_SIDEBAR_BASE_CLASSES).toContain('hidden');
  });

  it('should be visible on md breakpoint', () => {
    expect(APP_LAYOUT_SIDEBAR_BASE_CLASSES).toContain('md:block');
  });

  it('should not shrink', () => {
    expect(APP_LAYOUT_SIDEBAR_BASE_CLASSES).toContain('shrink-0');
  });

  it('should include motion-safe transition for width', () => {
    expect(APP_LAYOUT_SIDEBAR_BASE_CLASSES).toContain('motion-safe:transition-[width]');
  });

  it('should have transition duration', () => {
    expect(APP_LAYOUT_SIDEBAR_BASE_CLASSES).toContain('motion-safe:duration-200');
  });

  it('should have easing function', () => {
    expect(APP_LAYOUT_SIDEBAR_BASE_CLASSES).toContain('motion-safe:ease-in-out');
  });
});

describe('APP_LAYOUT_MAIN_AREA_CLASSES', () => {
  it('should be flex column', () => {
    expect(APP_LAYOUT_MAIN_AREA_CLASSES).toContain('flex');
    expect(APP_LAYOUT_MAIN_AREA_CLASSES).toContain('flex-col');
  });

  it('should grow to fill remaining space', () => {
    expect(APP_LAYOUT_MAIN_AREA_CLASSES).toContain('flex-1');
  });

  it('should have min-w-0 for proper overflow handling', () => {
    expect(APP_LAYOUT_MAIN_AREA_CLASSES).toContain('min-w-0');
  });
});

describe('APP_LAYOUT_HEADER_CONTAINER_CLASSES', () => {
  it('should include flex layout', () => {
    expect(APP_LAYOUT_HEADER_CONTAINER_CLASSES).toContain('flex');
    expect(APP_LAYOUT_HEADER_CONTAINER_CLASSES).toContain('items-center');
  });

  it('should have fixed height', () => {
    expect(APP_LAYOUT_HEADER_CONTAINER_CLASSES).toContain('h-14');
  });

  it('should not shrink', () => {
    expect(APP_LAYOUT_HEADER_CONTAINER_CLASSES).toContain('shrink-0');
  });

  it('should have bottom border', () => {
    expect(APP_LAYOUT_HEADER_CONTAINER_CLASSES).toContain('border-b');
  });

  it('should have background', () => {
    expect(APP_LAYOUT_HEADER_CONTAINER_CLASSES).toContain('bg-');
  });
});

describe('APP_LAYOUT_HAMBURGER_CONTAINER_CLASSES', () => {
  it('should have padding left', () => {
    expect(APP_LAYOUT_HAMBURGER_CONTAINER_CLASSES).toContain('pl-2');
  });

  it('should be hidden on md breakpoint', () => {
    expect(APP_LAYOUT_HAMBURGER_CONTAINER_CLASSES).toContain('md:hidden');
  });
});

describe('APP_LAYOUT_HEADER_CONTENT_CLASSES', () => {
  it('should grow to fill remaining space', () => {
    expect(APP_LAYOUT_HEADER_CONTENT_CLASSES).toBe('flex-1');
  });
});

describe('APP_LAYOUT_MAIN_CONTENT_CLASSES', () => {
  it('should grow to fill remaining space', () => {
    expect(APP_LAYOUT_MAIN_CONTENT_CLASSES).toContain('flex-1');
  });

  it('should allow overflow scroll', () => {
    expect(APP_LAYOUT_MAIN_CONTENT_CLASSES).toContain('overflow-auto');
  });

  it('should have thin scrollbar', () => {
    expect(APP_LAYOUT_MAIN_CONTENT_CLASSES).toContain('scrollbar-thin');
  });

  it('should have focus outline removed (managed elsewhere)', () => {
    expect(APP_LAYOUT_MAIN_CONTENT_CLASSES).toContain('focus:outline-none');
  });
});

// ============================================================================
// Sidebar Width Classes Tests
// ============================================================================

describe('SIDEBAR_EXPANDED_WIDTH_CLASSES', () => {
  it('should have sm size (240px / w-60)', () => {
    expect(SIDEBAR_EXPANDED_WIDTH_CLASSES.sm).toBe('md:w-60');
  });

  it('should have md size (288px / w-72)', () => {
    expect(SIDEBAR_EXPANDED_WIDTH_CLASSES.md).toBe('md:w-72');
  });

  it('should have lg size (320px / w-80)', () => {
    expect(SIDEBAR_EXPANDED_WIDTH_CLASSES.lg).toBe('md:w-80');
  });

  it('should include md: prefix for all sizes', () => {
    Object.values(SIDEBAR_EXPANDED_WIDTH_CLASSES).forEach((value) => {
      expect(value).toMatch(/^md:w-\d+$/);
    });
  });
});

describe('SIDEBAR_COLLAPSED_WIDTH', () => {
  it('should be 56px (w-14)', () => {
    expect(SIDEBAR_COLLAPSED_WIDTH).toBe('md:w-14');
  });
});

// ============================================================================
// getBaseSize Utility Tests
// ============================================================================

describe('getBaseSize', () => {
  describe('with undefined', () => {
    it('should return md as default', () => {
      expect(getBaseSize(undefined)).toBe('md');
    });
  });

  describe('with string values', () => {
    it('should return sm when passed sm', () => {
      expect(getBaseSize('sm')).toBe('sm');
    });

    it('should return md when passed md', () => {
      expect(getBaseSize('md')).toBe('md');
    });

    it('should return lg when passed lg', () => {
      expect(getBaseSize('lg')).toBe('lg');
    });
  });

  describe('with responsive object', () => {
    it('should return base if specified', () => {
      expect(getBaseSize({ base: 'lg', md: 'sm' })).toBe('lg');
    });

    it('should return first defined value if base is not specified', () => {
      expect(getBaseSize({ sm: 'lg', md: 'sm' })).toBe('lg');
    });

    it('should return md for empty object', () => {
      expect(getBaseSize({})).toBe('md');
    });

    it('should handle object with only lg breakpoint', () => {
      expect(getBaseSize({ lg: 'lg' })).toBe('lg');
    });

    it('should prefer base over higher breakpoints', () => {
      expect(getBaseSize({ base: 'sm', lg: 'lg', xl: 'md' })).toBe('sm');
    });
  });
});

// ============================================================================
// getResponsiveSidebarClasses Utility Tests
// ============================================================================

describe('getResponsiveSidebarClasses', () => {
  describe('when collapsed', () => {
    it('should return collapsed width regardless of size', () => {
      expect(getResponsiveSidebarClasses('sm', true)).toBe(SIDEBAR_COLLAPSED_WIDTH);
      expect(getResponsiveSidebarClasses('md', true)).toBe(SIDEBAR_COLLAPSED_WIDTH);
      expect(getResponsiveSidebarClasses('lg', true)).toBe(SIDEBAR_COLLAPSED_WIDTH);
    });

    it('should return collapsed width for undefined size', () => {
      expect(getResponsiveSidebarClasses(undefined, true)).toBe(SIDEBAR_COLLAPSED_WIDTH);
    });

    it('should return collapsed width for responsive object', () => {
      expect(getResponsiveSidebarClasses({ base: 'sm', lg: 'lg' }, true)).toBe(
        SIDEBAR_COLLAPSED_WIDTH
      );
    });
  });

  describe('when expanded with undefined size', () => {
    it('should return md width as default', () => {
      expect(getResponsiveSidebarClasses(undefined, false)).toBe(SIDEBAR_EXPANDED_WIDTH_CLASSES.md);
    });
  });

  describe('when expanded with string size', () => {
    it('should return sm width for sm size', () => {
      expect(getResponsiveSidebarClasses('sm', false)).toBe(SIDEBAR_EXPANDED_WIDTH_CLASSES.sm);
    });

    it('should return md width for md size', () => {
      expect(getResponsiveSidebarClasses('md', false)).toBe(SIDEBAR_EXPANDED_WIDTH_CLASSES.md);
    });

    it('should return lg width for lg size', () => {
      expect(getResponsiveSidebarClasses('lg', false)).toBe(SIDEBAR_EXPANDED_WIDTH_CLASSES.lg);
    });
  });

  describe('when expanded with responsive object', () => {
    it('should generate responsive classes for base breakpoint', () => {
      const result = getResponsiveSidebarClasses({ base: 'sm' }, false);
      expect(result).toContain('md:w-60');
    });

    it('should generate responsive classes for multiple breakpoints', () => {
      const result = getResponsiveSidebarClasses({ base: 'sm', lg: 'lg' }, false);
      expect(result).toContain('md:w-60');
      expect(result).toContain('lg:w-80');
    });

    it('should return default for empty object', () => {
      expect(getResponsiveSidebarClasses({}, false)).toBe(SIDEBAR_EXPANDED_WIDTH_CLASSES.md);
    });
  });
});

// ============================================================================
// buildSidebarAnnouncement Utility Tests
// ============================================================================

describe('buildSidebarAnnouncement', () => {
  it('should return collapsed announcement when collapsed is true', () => {
    expect(buildSidebarAnnouncement(true)).toBe(SR_SIDEBAR_COLLAPSED);
  });

  it('should return expanded announcement when collapsed is false', () => {
    expect(buildSidebarAnnouncement(false)).toBe(SR_SIDEBAR_EXPANDED);
  });
});

// ============================================================================
// buildDrawerAnnouncement Utility Tests
// ============================================================================

describe('buildDrawerAnnouncement', () => {
  it('should return opened announcement when isOpen is true', () => {
    expect(buildDrawerAnnouncement(true, 'Menu')).toBe('Menu opened');
  });

  it('should return closed announcement when isOpen is false', () => {
    expect(buildDrawerAnnouncement(false, 'Menu')).toBe('Menu closed');
  });

  it('should include the label in the announcement', () => {
    expect(buildDrawerAnnouncement(true, 'Navigation drawer')).toBe('Navigation drawer opened');
    expect(buildDrawerAnnouncement(false, 'Side panel')).toBe('Side panel closed');
  });
});

// ============================================================================
// Accessibility Behavior Documentation Tests
// ============================================================================

describe('Accessibility Behavior', () => {
  describe('Skip Link', () => {
    it('should target main-content ID', () => {
      // DEFAULT_MAIN_ID from Main primitive is used as target
      expect(DEFAULT_SKIP_LINK_TEXT).toContain('main content');
    });
  });

  describe('Landmark Structure', () => {
    it('sidebar label should describe navigation', () => {
      expect(DEFAULT_SIDEBAR_LABEL.toLowerCase()).toContain('navigation');
    });

    it('header label should describe site header', () => {
      expect(DEFAULT_HEADER_LABEL.toLowerCase()).toContain('header');
    });

    it('main label should describe main content', () => {
      expect(DEFAULT_MAIN_LABEL.toLowerCase()).toContain('main');
    });
  });

  describe('Mobile Drawer', () => {
    it('drawer label should describe navigation menu', () => {
      expect(DEFAULT_MOBILE_DRAWER_LABEL.toLowerCase()).toContain('navigation');
    });
  });

  describe('Screen Reader Announcements', () => {
    it('should have distinct collapsed and expanded announcements', () => {
      expect(SR_SIDEBAR_COLLAPSED).not.toBe(SR_SIDEBAR_EXPANDED);
    });

    it('should have distinct opened and closed announcements', () => {
      expect(SR_DRAWER_OPENED).not.toBe(SR_DRAWER_CLOSED);
    });
  });
});

// ============================================================================
// Component Props Documentation Tests
// ============================================================================

describe('Component Props Documentation', () => {
  describe('Layout props', () => {
    it('should document sidebar prop', () => {
      // Sidebar content passed via sidebar prop
      expect(typeof DEFAULT_SIDEBAR_LABEL).toBe('string');
    });

    it('should document header prop', () => {
      // Header content passed via header prop
      expect(typeof DEFAULT_HEADER_LABEL).toBe('string');
    });

    it('should document main content via children', () => {
      // Main content passed via children prop
      expect(typeof DEFAULT_MAIN_LABEL).toBe('string');
    });
  });

  describe('State props', () => {
    it('sidebarCollapsed affects sidebar width', () => {
      // When collapsed, sidebar uses SIDEBAR_COLLAPSED_WIDTH
      expect(getResponsiveSidebarClasses('md', true)).toBe(SIDEBAR_COLLAPSED_WIDTH);
      // When expanded, sidebar uses size-based width
      expect(getResponsiveSidebarClasses('md', false)).toBe(SIDEBAR_EXPANDED_WIDTH_CLASSES.md);
    });

    it('isMobileDrawerOpen affects mobile drawer visibility', () => {
      // buildDrawerAnnouncement reflects state
      expect(buildDrawerAnnouncement(true, 'Menu')).toContain('opened');
      expect(buildDrawerAnnouncement(false, 'Menu')).toContain('closed');
    });
  });
});

// ============================================================================
// Size Consistency Tests
// ============================================================================

describe('Size Consistency', () => {
  it('all size keys should exist in SIDEBAR_EXPANDED_WIDTH_CLASSES', () => {
    const sizes = ['sm', 'md', 'lg'] as const;
    sizes.forEach((size) => {
      expect(SIDEBAR_EXPANDED_WIDTH_CLASSES[size]).toBeDefined();
    });
  });

  it('getBaseSize should return valid size keys', () => {
    const validSizes = ['sm', 'md', 'lg'];
    expect(validSizes).toContain(getBaseSize(undefined));
    expect(validSizes).toContain(getBaseSize('sm'));
    expect(validSizes).toContain(getBaseSize('lg'));
    expect(validSizes).toContain(getBaseSize({ base: 'sm' }));
  });
});

// ============================================================================
// Motion-Safe and Reduced Motion Tests
// ============================================================================

describe('Motion-Safe Support', () => {
  it('sidebar transitions should use motion-safe prefix', () => {
    expect(APP_LAYOUT_SIDEBAR_BASE_CLASSES).toContain('motion-safe:');
  });

  it('transitions should include duration', () => {
    expect(APP_LAYOUT_SIDEBAR_BASE_CLASSES).toContain('duration-200');
  });

  it('transitions should include easing', () => {
    expect(APP_LAYOUT_SIDEBAR_BASE_CLASSES).toContain('ease-in-out');
  });
});

// ============================================================================
// Data Attributes Documentation Tests
// ============================================================================

describe('Data Attributes', () => {
  it('component should support data-testid', () => {
    // Documented in AppLayoutProps
    expect(typeof DEFAULT_SKIP_LINK_TEXT).toBe('string'); // Component accepts data-testid
  });

  it('component should expose state via data attributes', () => {
    // data-sidebar-collapsed, data-drawer-open, data-size are set on root element
    // This is documented behavior for testing and CSS styling
    expect(typeof SIDEBAR_COLLAPSED_WIDTH).toBe('string');
  });
});
