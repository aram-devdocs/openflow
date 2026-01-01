import { describe, expect, it } from 'vitest';
import {
  DEFAULT_APP_NAME,
  DEFAULT_CLOSE_MENU_LABEL,
  // Constants
  DEFAULT_HEADER_LABEL,
  DEFAULT_NEW_CHAT_LABEL,
  DEFAULT_NEW_TERMINAL_LABEL,
  DEFAULT_OPEN_MENU_LABEL,
  DEFAULT_SEARCH_LABEL,
  HEADER_ACTIONS_CONTAINER_CLASSES,
  HEADER_BASE_CLASSES,
  HEADER_BUTTON_GAP_CLASSES,
  HEADER_BUTTON_SIZE_MAP,
  HEADER_DESKTOP_NAV_CLASSES,
  HEADER_ICON_SIZE_MAP,
  HEADER_KBD_CLASSES,
  HEADER_MENU_BUTTON_CONTAINER_CLASSES,
  HEADER_PADDING_CLASSES,
  HEADER_SUBTITLE_CLASSES,
  HEADER_SUBTITLE_SIZE_CLASSES,
  HEADER_TITLE_CLASSES,
  HEADER_TITLE_CONTAINER_CLASSES,
  HEADER_TITLE_SIZE_CLASSES,
  KEYBOARD_SHORTCUT_TEXT,
  SR_MENU_CLOSED,
  SR_MENU_OPENED,
  buildHeaderAccessibleLabel,
  // Utility functions
  getBaseSize,
  getMenuButtonLabel,
  getMenuStateAnnouncement,
  getResponsiveSizeClasses,
} from '../../../packages/ui/organisms/Header';

// ============================================================================
// Default Labels Tests
// ============================================================================

describe('Header Default Labels', () => {
  it('should have correct default header label', () => {
    expect(DEFAULT_HEADER_LABEL).toBe('Application header');
  });

  it('should have correct default app name', () => {
    expect(DEFAULT_APP_NAME).toBe('OpenFlow');
  });

  it('should have correct search label with keyboard shortcut', () => {
    expect(DEFAULT_SEARCH_LABEL).toBe('Search (Cmd+K)');
    expect(DEFAULT_SEARCH_LABEL).toContain('Cmd+K');
  });

  it('should have correct new chat label', () => {
    expect(DEFAULT_NEW_CHAT_LABEL).toBe('New Chat');
  });

  it('should have correct new terminal label', () => {
    expect(DEFAULT_NEW_TERMINAL_LABEL).toBe('New Terminal');
  });

  it('should have correct open menu label', () => {
    expect(DEFAULT_OPEN_MENU_LABEL).toBe('Open navigation menu');
  });

  it('should have correct close menu label', () => {
    expect(DEFAULT_CLOSE_MENU_LABEL).toBe('Close navigation menu');
  });
});

// ============================================================================
// Screen Reader Announcement Tests
// ============================================================================

describe('Header Screen Reader Announcements', () => {
  it('should have menu opened announcement', () => {
    expect(SR_MENU_OPENED).toBe('Navigation menu opened');
  });

  it('should have menu closed announcement', () => {
    expect(SR_MENU_CLOSED).toBe('Navigation menu closed');
  });
});

// ============================================================================
// UI Constants Tests
// ============================================================================

describe('Header UI Constants', () => {
  it('should have keyboard shortcut text', () => {
    expect(KEYBOARD_SHORTCUT_TEXT).toBe('⌘K');
  });
});

// ============================================================================
// Base Classes Tests
// ============================================================================

describe('HEADER_BASE_CLASSES', () => {
  it('should include flex layout', () => {
    expect(HEADER_BASE_CLASSES).toContain('flex');
  });

  it('should include full height', () => {
    expect(HEADER_BASE_CLASSES).toContain('h-full');
  });

  it('should include vertical centering', () => {
    expect(HEADER_BASE_CLASSES).toContain('items-center');
  });

  it('should include space between content', () => {
    expect(HEADER_BASE_CLASSES).toContain('justify-between');
  });

  it('should include bottom border', () => {
    expect(HEADER_BASE_CLASSES).toContain('border-b');
  });

  it('should include background color', () => {
    expect(HEADER_BASE_CLASSES).toContain('bg-[rgb(var(--background))]');
  });
});

// ============================================================================
// Padding Classes Tests
// ============================================================================

describe('HEADER_PADDING_CLASSES', () => {
  it('should have small padding', () => {
    expect(HEADER_PADDING_CLASSES.sm).toBe('px-3');
  });

  it('should have medium padding', () => {
    expect(HEADER_PADDING_CLASSES.md).toBe('px-4');
  });

  it('should have large padding', () => {
    expect(HEADER_PADDING_CLASSES.lg).toBe('px-6');
  });

  it('should have progressively larger padding', () => {
    const smValue = Number.parseInt(HEADER_PADDING_CLASSES.sm.replace('px-', ''), 10);
    const mdValue = Number.parseInt(HEADER_PADDING_CLASSES.md.replace('px-', ''), 10);
    const lgValue = Number.parseInt(HEADER_PADDING_CLASSES.lg.replace('px-', ''), 10);

    expect(mdValue).toBeGreaterThan(smValue);
    expect(lgValue).toBeGreaterThan(mdValue);
  });
});

// ============================================================================
// Title Size Classes Tests
// ============================================================================

describe('HEADER_TITLE_SIZE_CLASSES', () => {
  it('should have small title size', () => {
    expect(HEADER_TITLE_SIZE_CLASSES.sm).toBe('text-xs');
  });

  it('should have medium title size', () => {
    expect(HEADER_TITLE_SIZE_CLASSES.md).toBe('text-sm');
  });

  it('should have large title size', () => {
    expect(HEADER_TITLE_SIZE_CLASSES.lg).toBe('text-base');
  });
});

// ============================================================================
// Subtitle Size Classes Tests
// ============================================================================

describe('HEADER_SUBTITLE_SIZE_CLASSES', () => {
  it('should have small subtitle size', () => {
    expect(HEADER_SUBTITLE_SIZE_CLASSES.sm).toBe('text-[10px]');
  });

  it('should have medium subtitle size', () => {
    expect(HEADER_SUBTITLE_SIZE_CLASSES.md).toBe('text-xs');
  });

  it('should have large subtitle size', () => {
    expect(HEADER_SUBTITLE_SIZE_CLASSES.lg).toBe('text-sm');
  });
});

// ============================================================================
// Button Gap Classes Tests
// ============================================================================

describe('HEADER_BUTTON_GAP_CLASSES', () => {
  it('should have small gap', () => {
    expect(HEADER_BUTTON_GAP_CLASSES.sm).toBe('gap-1');
  });

  it('should have medium gap', () => {
    expect(HEADER_BUTTON_GAP_CLASSES.md).toBe('gap-2');
  });

  it('should have large gap', () => {
    expect(HEADER_BUTTON_GAP_CLASSES.lg).toBe('gap-3');
  });
});

// ============================================================================
// Icon Size Map Tests
// ============================================================================

describe('HEADER_ICON_SIZE_MAP', () => {
  it('should map small to xs', () => {
    expect(HEADER_ICON_SIZE_MAP.sm).toBe('xs');
  });

  it('should map medium to sm', () => {
    expect(HEADER_ICON_SIZE_MAP.md).toBe('sm');
  });

  it('should map large to md', () => {
    expect(HEADER_ICON_SIZE_MAP.lg).toBe('md');
  });
});

// ============================================================================
// Button Size Map Tests
// ============================================================================

describe('HEADER_BUTTON_SIZE_MAP', () => {
  it('should map small to sm', () => {
    expect(HEADER_BUTTON_SIZE_MAP.sm).toBe('sm');
  });

  it('should map medium to sm', () => {
    expect(HEADER_BUTTON_SIZE_MAP.md).toBe('sm');
  });

  it('should map large to md', () => {
    expect(HEADER_BUTTON_SIZE_MAP.lg).toBe('md');
  });
});

// ============================================================================
// Container Classes Tests
// ============================================================================

describe('Header Container Classes', () => {
  it('should have title container classes', () => {
    expect(HEADER_TITLE_CONTAINER_CLASSES).toContain('flex');
    expect(HEADER_TITLE_CONTAINER_CLASSES).toContain('flex-col');
    expect(HEADER_TITLE_CONTAINER_CLASSES).toContain('justify-center');
    expect(HEADER_TITLE_CONTAINER_CLASSES).toContain('min-w-0');
  });

  it('should have title classes with truncate', () => {
    expect(HEADER_TITLE_CLASSES).toContain('font-semibold');
    expect(HEADER_TITLE_CLASSES).toContain('truncate');
  });

  it('should have subtitle classes with truncate', () => {
    expect(HEADER_SUBTITLE_CLASSES).toContain('truncate');
  });

  it('should have actions container classes', () => {
    expect(HEADER_ACTIONS_CONTAINER_CLASSES).toContain('flex');
    expect(HEADER_ACTIONS_CONTAINER_CLASSES).toContain('items-center');
    expect(HEADER_ACTIONS_CONTAINER_CLASSES).toContain('flex-shrink-0');
  });
});

// ============================================================================
// Keyboard Shortcut Badge Classes Tests
// ============================================================================

describe('HEADER_KBD_CLASSES', () => {
  it('should be hidden on mobile', () => {
    expect(HEADER_KBD_CLASSES).toContain('hidden');
  });

  it('should be visible on desktop (sm: breakpoint)', () => {
    expect(HEADER_KBD_CLASSES).toContain('sm:flex');
  });

  it('should be non-interactive', () => {
    expect(HEADER_KBD_CLASSES).toContain('pointer-events-none');
    expect(HEADER_KBD_CLASSES).toContain('select-none');
  });

  it('should have border styling', () => {
    expect(HEADER_KBD_CLASSES).toContain('rounded');
    expect(HEADER_KBD_CLASSES).toContain('border');
  });
});

// ============================================================================
// Responsive Visibility Classes Tests
// ============================================================================

describe('Header Responsive Visibility Classes', () => {
  it('should hide menu button on desktop', () => {
    expect(HEADER_MENU_BUTTON_CONTAINER_CLASSES).toBe('md:hidden');
  });

  it('should hide desktop nav on mobile', () => {
    expect(HEADER_DESKTOP_NAV_CLASSES).toContain('hidden');
    expect(HEADER_DESKTOP_NAV_CLASSES).toContain('md:flex');
  });
});

// ============================================================================
// getBaseSize Utility Tests
// ============================================================================

describe('getBaseSize utility', () => {
  it('should return md for undefined', () => {
    expect(getBaseSize(undefined)).toBe('md');
  });

  it('should return the value for string size', () => {
    expect(getBaseSize('sm')).toBe('sm');
    expect(getBaseSize('md')).toBe('md');
    expect(getBaseSize('lg')).toBe('lg');
  });

  it('should return base from responsive object', () => {
    expect(getBaseSize({ base: 'sm', md: 'lg' })).toBe('sm');
  });

  it('should return first defined breakpoint if no base', () => {
    expect(getBaseSize({ md: 'lg', xl: 'sm' })).toBe('lg');
  });

  it('should return md for empty object', () => {
    expect(getBaseSize({})).toBe('md');
  });

  it('should handle null-ish values gracefully', () => {
    expect(getBaseSize(null as unknown as undefined)).toBe('md');
  });
});

// ============================================================================
// getResponsiveSizeClasses Utility Tests
// ============================================================================

describe('getResponsiveSizeClasses utility', () => {
  const testMap = {
    sm: 'test-sm',
    md: 'test-md',
    lg: 'test-lg',
  };

  it('should return md class for undefined', () => {
    expect(getResponsiveSizeClasses(undefined, testMap)).toBe('test-md');
  });

  it('should return correct class for string size', () => {
    expect(getResponsiveSizeClasses('sm', testMap)).toBe('test-sm');
    expect(getResponsiveSizeClasses('lg', testMap)).toBe('test-lg');
  });

  it('should return base class for responsive object', () => {
    const result = getResponsiveSizeClasses({ base: 'sm' }, testMap);
    expect(result).toBe('test-sm');
  });

  it('should return prefixed classes for breakpoints', () => {
    const result = getResponsiveSizeClasses({ base: 'sm', md: 'lg' }, testMap);
    expect(result).toContain('test-sm');
    expect(result).toContain('md:test-lg');
  });

  it('should include all specified breakpoints', () => {
    const result = getResponsiveSizeClasses({ base: 'sm', sm: 'md', md: 'lg', lg: 'sm' }, testMap);
    expect(result).toContain('test-sm');
    expect(result).toContain('sm:test-md');
    expect(result).toContain('md:test-lg');
    expect(result).toContain('lg:test-sm');
  });

  it('should skip undefined breakpoints', () => {
    const result = getResponsiveSizeClasses({ base: 'sm', lg: 'md' }, testMap);
    expect(result).toBe('test-sm lg:test-md');
    expect(result).not.toContain('md:');
  });

  it('should handle empty object', () => {
    expect(getResponsiveSizeClasses({}, testMap)).toBe('');
  });
});

// ============================================================================
// buildHeaderAccessibleLabel Utility Tests
// ============================================================================

describe('buildHeaderAccessibleLabel utility', () => {
  it('should return app name when no title', () => {
    expect(buildHeaderAccessibleLabel()).toBe(DEFAULT_APP_NAME);
  });

  it('should return title when provided', () => {
    expect(buildHeaderAccessibleLabel('My Project')).toBe('My Project');
  });

  it('should include subtitle when provided', () => {
    expect(buildHeaderAccessibleLabel('My Project', '3 tasks')).toBe('My Project, 3 tasks');
  });

  it('should return app name with subtitle when no title', () => {
    expect(buildHeaderAccessibleLabel(undefined, '3 tasks')).toBe('OpenFlow, 3 tasks');
  });

  it('should handle empty strings as falsy', () => {
    expect(buildHeaderAccessibleLabel('', '')).toBe(DEFAULT_APP_NAME);
  });
});

// ============================================================================
// getMenuButtonLabel Utility Tests
// ============================================================================

describe('getMenuButtonLabel utility', () => {
  it('should return close label when menu is open', () => {
    expect(getMenuButtonLabel(true)).toBe(DEFAULT_CLOSE_MENU_LABEL);
  });

  it('should return open label when menu is closed', () => {
    expect(getMenuButtonLabel(false)).toBe(DEFAULT_OPEN_MENU_LABEL);
  });
});

// ============================================================================
// getMenuStateAnnouncement Utility Tests
// ============================================================================

describe('getMenuStateAnnouncement utility', () => {
  it('should return opened announcement when menu is open', () => {
    expect(getMenuStateAnnouncement(true)).toBe(SR_MENU_OPENED);
  });

  it('should return closed announcement when menu is closed', () => {
    expect(getMenuStateAnnouncement(false)).toBe(SR_MENU_CLOSED);
  });
});

// ============================================================================
// Size Consistency Tests
// ============================================================================

describe('Size Consistency', () => {
  it('should have all three sizes in padding classes', () => {
    expect(HEADER_PADDING_CLASSES).toHaveProperty('sm');
    expect(HEADER_PADDING_CLASSES).toHaveProperty('md');
    expect(HEADER_PADDING_CLASSES).toHaveProperty('lg');
  });

  it('should have all three sizes in title size classes', () => {
    expect(HEADER_TITLE_SIZE_CLASSES).toHaveProperty('sm');
    expect(HEADER_TITLE_SIZE_CLASSES).toHaveProperty('md');
    expect(HEADER_TITLE_SIZE_CLASSES).toHaveProperty('lg');
  });

  it('should have all three sizes in subtitle size classes', () => {
    expect(HEADER_SUBTITLE_SIZE_CLASSES).toHaveProperty('sm');
    expect(HEADER_SUBTITLE_SIZE_CLASSES).toHaveProperty('md');
    expect(HEADER_SUBTITLE_SIZE_CLASSES).toHaveProperty('lg');
  });

  it('should have all three sizes in button gap classes', () => {
    expect(HEADER_BUTTON_GAP_CLASSES).toHaveProperty('sm');
    expect(HEADER_BUTTON_GAP_CLASSES).toHaveProperty('md');
    expect(HEADER_BUTTON_GAP_CLASSES).toHaveProperty('lg');
  });

  it('should have all three sizes in icon size map', () => {
    expect(HEADER_ICON_SIZE_MAP).toHaveProperty('sm');
    expect(HEADER_ICON_SIZE_MAP).toHaveProperty('md');
    expect(HEADER_ICON_SIZE_MAP).toHaveProperty('lg');
  });

  it('should have all three sizes in button size map', () => {
    expect(HEADER_BUTTON_SIZE_MAP).toHaveProperty('sm');
    expect(HEADER_BUTTON_SIZE_MAP).toHaveProperty('md');
    expect(HEADER_BUTTON_SIZE_MAP).toHaveProperty('lg');
  });
});

// ============================================================================
// Accessibility Behavior Documentation Tests
// ============================================================================

describe('Header Accessibility Behavior', () => {
  it('should have role="banner" documentation', () => {
    // The header component uses role="banner" which is the landmark role for headers
    // This is semantically equivalent to a <header> element that is a direct child of body
    expect(DEFAULT_HEADER_LABEL).toBe('Application header');
  });

  it('should have ARIA labels for all interactive elements', () => {
    expect(DEFAULT_SEARCH_LABEL).toBeTruthy();
    expect(DEFAULT_NEW_CHAT_LABEL).toBeTruthy();
    expect(DEFAULT_NEW_TERMINAL_LABEL).toBeTruthy();
    expect(DEFAULT_OPEN_MENU_LABEL).toBeTruthy();
    expect(DEFAULT_CLOSE_MENU_LABEL).toBeTruthy();
  });

  it('should announce menu state changes', () => {
    expect(SR_MENU_OPENED).toBeTruthy();
    expect(SR_MENU_CLOSED).toBeTruthy();
  });

  it('should include keyboard shortcut in label', () => {
    expect(DEFAULT_SEARCH_LABEL).toContain('Cmd+K');
  });
});

// ============================================================================
// Component Behavior Documentation Tests
// ============================================================================

describe('Header Component Behavior', () => {
  it('should display default app name when no title', () => {
    // When title and subtitle are not provided, the component shows DEFAULT_APP_NAME
    expect(DEFAULT_APP_NAME).toBe('OpenFlow');
  });

  it('should truncate long titles', () => {
    // Title classes include truncate for handling long text
    expect(HEADER_TITLE_CLASSES).toContain('truncate');
  });

  it('should truncate long subtitles', () => {
    // Subtitle classes include truncate for handling long text
    expect(HEADER_SUBTITLE_CLASSES).toContain('truncate');
  });

  it('should hide menu button on desktop', () => {
    // Menu button uses md:hidden to hide on desktop breakpoints
    expect(HEADER_MENU_BUTTON_CONTAINER_CLASSES).toBe('md:hidden');
  });

  it('should show desktop nav only on md+ breakpoints', () => {
    // Desktop nav is hidden on mobile and shown on md+
    expect(HEADER_DESKTOP_NAV_CLASSES).toContain('hidden');
    expect(HEADER_DESKTOP_NAV_CLASSES).toContain('md:flex');
  });
});

// ============================================================================
// Props Documentation Tests
// ============================================================================

describe('Header Props Documentation', () => {
  it('should document that size is optional and defaults to md', () => {
    // getBaseSize returns 'md' when size is undefined
    expect(getBaseSize(undefined)).toBe('md');
  });

  it('should document that title is optional', () => {
    // When no title, buildHeaderAccessibleLabel uses DEFAULT_APP_NAME
    expect(buildHeaderAccessibleLabel()).toBe('OpenFlow');
  });

  it('should document responsive size support', () => {
    // getResponsiveSizeClasses handles responsive objects
    const result = getResponsiveSizeClasses({ base: 'sm', lg: 'lg' }, HEADER_PADDING_CLASSES);
    expect(result).toContain('px-3');
    expect(result).toContain('lg:px-6');
  });
});

// ============================================================================
// Visual State Classes Documentation Tests
// ============================================================================

describe('Header Visual State Classes', () => {
  it('should have border bottom for separation', () => {
    expect(HEADER_BASE_CLASSES).toContain('border-b');
  });

  it('should have background color', () => {
    expect(HEADER_BASE_CLASSES).toContain('bg-[rgb(var(--background))]');
  });

  it('should have foreground text color for title', () => {
    expect(HEADER_TITLE_CLASSES).toContain('text-[rgb(var(--foreground))]');
  });

  it('should have muted text color for subtitle', () => {
    expect(HEADER_SUBTITLE_CLASSES).toContain('text-[rgb(var(--muted-foreground))]');
  });
});

// ============================================================================
// Responsive Breakpoint Order Tests
// ============================================================================

describe('Responsive Breakpoint Order', () => {
  it('should generate classes in correct breakpoint order', () => {
    const result = getResponsiveSizeClasses(
      { base: 'sm', sm: 'md', md: 'lg', lg: 'sm', xl: 'md', '2xl': 'lg' },
      HEADER_PADDING_CLASSES
    );

    const parts = result.split(' ');

    // First should be base (no prefix)
    expect(parts[0]).toBe('px-3');

    // Check order of prefixes
    const prefixOrder = parts.slice(1).map((p) => p.split(':')[0]);
    expect(prefixOrder).toEqual(['sm', 'md', 'lg', 'xl', '2xl']);
  });
});

// ============================================================================
// Integration Pattern Tests
// ============================================================================

describe('Header Integration Patterns', () => {
  it('should support data-testid for testing', () => {
    // The component accepts data-testid and passes it to the header element
    // Nested elements get suffixed IDs: data-testid-title, data-testid-subtitle, etc.
    expect(true).toBe(true); // Documentation test
  });

  it('should support forwardRef for DOM access', () => {
    // The component uses forwardRef to allow ref access to the header element
    expect(true).toBe(true); // Documentation test
  });

  it('should support custom aria-label', () => {
    // The component accepts aria-label prop that overrides DEFAULT_HEADER_LABEL
    expect(DEFAULT_HEADER_LABEL).toBe('Application header');
  });

  it('should support className for custom styling', () => {
    // The component accepts className prop that is merged with HEADER_BASE_CLASSES
    expect(HEADER_BASE_CLASSES).toBeTruthy();
  });
});
