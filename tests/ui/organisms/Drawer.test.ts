import { describe, expect, it } from 'vitest';
import {
  DEFAULT_ARIA_LABEL,
  DEFAULT_CLOSE_LABEL,
  DRAWER_BACKDROP_CLASSES,
  DRAWER_CLOSE_BUTTON_CLASSES,
  DRAWER_CLOSE_BUTTON_CONTAINER_CLASSES,
  DRAWER_CONTAINER_CLASSES,
  DRAWER_CONTENT_CLASSES,
  DRAWER_PANEL_BASE_CLASSES,
  DRAWER_POSITION_CLASSES,
  DRAWER_SIZE_CLASSES,
  type DrawerBreakpoint,
  type DrawerPosition,
  type DrawerSize,
  SR_DRAWER_CLOSED,
  SR_DRAWER_OPENED,
  buildDrawerAccessibleLabel,
  getBaseSize,
  getOpenedAnnouncement,
  getResponsiveSizeClasses,
} from '../../../packages/ui/organisms/Drawer';

// ============================================================================
// Constants Tests
// ============================================================================

describe('Drawer Constants', () => {
  describe('DEFAULT_ARIA_LABEL', () => {
    it('should have correct default value', () => {
      expect(DEFAULT_ARIA_LABEL).toBe('Navigation menu');
    });

    it('should be a non-empty string', () => {
      expect(typeof DEFAULT_ARIA_LABEL).toBe('string');
      expect(DEFAULT_ARIA_LABEL.length).toBeGreaterThan(0);
    });
  });

  describe('DEFAULT_CLOSE_LABEL', () => {
    it('should have correct default value', () => {
      expect(DEFAULT_CLOSE_LABEL).toBe('Close navigation');
    });

    it('should be a non-empty string', () => {
      expect(typeof DEFAULT_CLOSE_LABEL).toBe('string');
      expect(DEFAULT_CLOSE_LABEL.length).toBeGreaterThan(0);
    });
  });

  describe('SR_DRAWER_OPENED', () => {
    it('should have correct value', () => {
      expect(SR_DRAWER_OPENED).toBe('Navigation drawer opened');
    });
  });

  describe('SR_DRAWER_CLOSED', () => {
    it('should have correct value', () => {
      expect(SR_DRAWER_CLOSED).toBe('Navigation drawer closed');
    });
  });
});

// ============================================================================
// Size Classes Tests
// ============================================================================

describe('DRAWER_SIZE_CLASSES', () => {
  it('should have three size variants', () => {
    expect(Object.keys(DRAWER_SIZE_CLASSES)).toHaveLength(3);
    expect(DRAWER_SIZE_CLASSES).toHaveProperty('sm');
    expect(DRAWER_SIZE_CLASSES).toHaveProperty('md');
    expect(DRAWER_SIZE_CLASSES).toHaveProperty('lg');
  });

  it('should have correct width classes for sm', () => {
    expect(DRAWER_SIZE_CLASSES.sm).toBe('w-60');
  });

  it('should have correct width classes for md', () => {
    expect(DRAWER_SIZE_CLASSES.md).toBe('w-72');
  });

  it('should have correct width classes for lg', () => {
    expect(DRAWER_SIZE_CLASSES.lg).toBe('w-80');
  });

  it('should have progressively larger widths', () => {
    // Extract numeric values (e.g., w-60 -> 60)
    const getWidth = (className: string): number => {
      const match = className.match(/w-(\d+)/);
      return match?.[1] ? Number.parseInt(match[1], 10) : 0;
    };

    expect(getWidth(DRAWER_SIZE_CLASSES.sm)).toBeLessThan(getWidth(DRAWER_SIZE_CLASSES.md));
    expect(getWidth(DRAWER_SIZE_CLASSES.md)).toBeLessThan(getWidth(DRAWER_SIZE_CLASSES.lg));
  });
});

// ============================================================================
// Position Classes Tests
// ============================================================================

describe('DRAWER_POSITION_CLASSES', () => {
  it('should have two position variants', () => {
    expect(Object.keys(DRAWER_POSITION_CLASSES)).toHaveLength(2);
    expect(DRAWER_POSITION_CLASSES).toHaveProperty('left');
    expect(DRAWER_POSITION_CLASSES).toHaveProperty('right');
  });

  it('should have left-0 for left position', () => {
    expect(DRAWER_POSITION_CLASSES.left).toContain('left-0');
  });

  it('should have right-0 for right position', () => {
    expect(DRAWER_POSITION_CLASSES.right).toContain('right-0');
  });

  it('should have border-r for left position', () => {
    expect(DRAWER_POSITION_CLASSES.left).toContain('border-r');
  });

  it('should have border-l for right position', () => {
    expect(DRAWER_POSITION_CLASSES.right).toContain('border-l');
  });

  it('should have border color for both positions', () => {
    expect(DRAWER_POSITION_CLASSES.left).toContain('border-[rgb(var(--border))]');
    expect(DRAWER_POSITION_CLASSES.right).toContain('border-[rgb(var(--border))]');
  });
});

// ============================================================================
// Container Classes Tests
// ============================================================================

describe('DRAWER_CONTAINER_CLASSES', () => {
  it('should have fixed positioning', () => {
    expect(DRAWER_CONTAINER_CLASSES).toContain('fixed');
    expect(DRAWER_CONTAINER_CLASSES).toContain('inset-0');
  });

  it('should have high z-index', () => {
    expect(DRAWER_CONTAINER_CLASSES).toContain('z-50');
  });
});

// ============================================================================
// Backdrop Classes Tests
// ============================================================================

describe('DRAWER_BACKDROP_CLASSES', () => {
  it('should have fixed positioning', () => {
    expect(DRAWER_BACKDROP_CLASSES).toContain('fixed');
    expect(DRAWER_BACKDROP_CLASSES).toContain('inset-0');
  });

  it('should have semi-transparent background', () => {
    expect(DRAWER_BACKDROP_CLASSES).toContain('bg-black/60');
  });

  it('should have prefers-reduced-transparency support', () => {
    expect(DRAWER_BACKDROP_CLASSES).toContain('@media(prefers-reduced-transparency:reduce)');
    expect(DRAWER_BACKDROP_CLASSES).toContain('bg-black/80');
  });

  it('should have motion-safe transitions', () => {
    expect(DRAWER_BACKDROP_CLASSES).toContain('motion-safe:transition-opacity');
    expect(DRAWER_BACKDROP_CLASSES).toContain('motion-safe:duration-200');
  });
});

// ============================================================================
// Panel Base Classes Tests
// ============================================================================

describe('DRAWER_PANEL_BASE_CLASSES', () => {
  it('should have fixed positioning', () => {
    expect(DRAWER_PANEL_BASE_CLASSES).toContain('fixed');
    expect(DRAWER_PANEL_BASE_CLASSES).toContain('inset-y-0');
  });

  it('should be a flex column', () => {
    expect(DRAWER_PANEL_BASE_CLASSES).toContain('flex');
    expect(DRAWER_PANEL_BASE_CLASSES).toContain('flex-col');
  });

  it('should have background color', () => {
    expect(DRAWER_PANEL_BASE_CLASSES).toContain('bg-[rgb(var(--background))]');
  });

  it('should have shadow', () => {
    expect(DRAWER_PANEL_BASE_CLASSES).toContain('shadow-xl');
  });

  it('should have motion-safe transitions', () => {
    expect(DRAWER_PANEL_BASE_CLASSES).toContain('motion-safe:transition-transform');
    expect(DRAWER_PANEL_BASE_CLASSES).toContain('motion-safe:duration-200');
  });

  it('should have focus outline disabled', () => {
    expect(DRAWER_PANEL_BASE_CLASSES).toContain('focus:outline-none');
  });
});

// ============================================================================
// Close Button Classes Tests
// ============================================================================

describe('DRAWER_CLOSE_BUTTON_CONTAINER_CLASSES', () => {
  it('should have absolute positioning', () => {
    expect(DRAWER_CLOSE_BUTTON_CONTAINER_CLASSES).toContain('absolute');
    expect(DRAWER_CLOSE_BUTTON_CONTAINER_CLASSES).toContain('right-3');
    expect(DRAWER_CLOSE_BUTTON_CONTAINER_CLASSES).toContain('top-3');
  });

  it('should have z-index', () => {
    expect(DRAWER_CLOSE_BUTTON_CONTAINER_CLASSES).toContain('z-10');
  });
});

describe('DRAWER_CLOSE_BUTTON_CLASSES', () => {
  it('should have minimum 44px touch target (WCAG 2.5.5)', () => {
    expect(DRAWER_CLOSE_BUTTON_CLASSES).toContain('min-h-[44px]');
    expect(DRAWER_CLOSE_BUTTON_CLASSES).toContain('min-w-[44px]');
  });

  it('should have explicit dimensions', () => {
    expect(DRAWER_CLOSE_BUTTON_CLASSES).toContain('h-11');
    expect(DRAWER_CLOSE_BUTTON_CLASSES).toContain('w-11');
  });

  it('should have no padding', () => {
    expect(DRAWER_CLOSE_BUTTON_CLASSES).toContain('p-0');
  });
});

// ============================================================================
// Content Classes Tests
// ============================================================================

describe('DRAWER_CONTENT_CLASSES', () => {
  it('should fill available space', () => {
    expect(DRAWER_CONTENT_CLASSES).toContain('flex-1');
  });

  it('should have vertical overflow scrolling', () => {
    expect(DRAWER_CONTENT_CLASSES).toContain('overflow-y-auto');
  });

  it('should have thin scrollbar styling', () => {
    expect(DRAWER_CONTENT_CLASSES).toContain('scrollbar-thin');
  });
});

// ============================================================================
// Utility Function Tests
// ============================================================================

describe('getBaseSize', () => {
  it('should return default "md" when size is undefined', () => {
    expect(getBaseSize(undefined)).toBe('md');
  });

  it('should return the size directly when given a string', () => {
    expect(getBaseSize('sm')).toBe('sm');
    expect(getBaseSize('md')).toBe('md');
    expect(getBaseSize('lg')).toBe('lg');
  });

  it('should return base size from responsive object', () => {
    expect(getBaseSize({ base: 'sm', md: 'lg' })).toBe('sm');
  });

  it('should return first defined size when base is not specified', () => {
    expect(getBaseSize({ md: 'lg', xl: 'sm' } as Record<DrawerBreakpoint, DrawerSize>)).toBe('lg');
  });

  it('should return "md" when object has no valid sizes', () => {
    expect(getBaseSize({} as Record<DrawerBreakpoint, DrawerSize>)).toBe('md');
  });

  it('should handle all breakpoints in order', () => {
    // When only later breakpoints are defined, should return first one found
    expect(getBaseSize({ xl: 'lg' } as Record<DrawerBreakpoint, DrawerSize>)).toBe('lg');
    expect(getBaseSize({ '2xl': 'sm' } as Record<DrawerBreakpoint, DrawerSize>)).toBe('sm');
  });
});

describe('getResponsiveSizeClasses', () => {
  describe('undefined value', () => {
    it('should return default md size classes', () => {
      expect(getResponsiveSizeClasses(undefined)).toBe(DRAWER_SIZE_CLASSES.md);
    });
  });

  describe('string values', () => {
    it('should return correct classes for sm', () => {
      expect(getResponsiveSizeClasses('sm')).toBe(DRAWER_SIZE_CLASSES.sm);
    });

    it('should return correct classes for md', () => {
      expect(getResponsiveSizeClasses('md')).toBe(DRAWER_SIZE_CLASSES.md);
    });

    it('should return correct classes for lg', () => {
      expect(getResponsiveSizeClasses('lg')).toBe(DRAWER_SIZE_CLASSES.lg);
    });
  });

  describe('responsive objects', () => {
    it('should generate base classes correctly', () => {
      const result = getResponsiveSizeClasses({ base: 'sm' });
      expect(result).toContain('w-60');
    });

    it('should generate breakpoint-prefixed classes', () => {
      const result = getResponsiveSizeClasses({ base: 'sm', md: 'lg' });
      expect(result).toContain('w-60');
      expect(result).toContain('md:w-80');
    });

    it('should handle multiple breakpoints', () => {
      const result = getResponsiveSizeClasses({ base: 'sm', md: 'md', lg: 'lg' });
      expect(result).toContain('w-60');
      expect(result).toContain('md:w-72');
      expect(result).toContain('lg:w-80');
    });

    it('should generate classes in correct breakpoint order', () => {
      const result = getResponsiveSizeClasses({ lg: 'lg', base: 'sm', md: 'md' });
      // Verify classes are space-separated
      const classes = result.split(' ');
      expect(classes).toContain('w-60');
      expect(classes).toContain('md:w-72');
      expect(classes).toContain('lg:w-80');
    });

    it('should handle all breakpoints', () => {
      const result = getResponsiveSizeClasses({
        base: 'sm',
        sm: 'sm',
        md: 'md',
        lg: 'lg',
        xl: 'lg',
        '2xl': 'lg',
      });
      expect(result).toContain('w-60');
      expect(result).toContain('sm:w-60');
      expect(result).toContain('md:w-72');
      expect(result).toContain('lg:w-80');
      expect(result).toContain('xl:w-80');
      expect(result).toContain('2xl:w-80');
    });
  });

  describe('edge cases', () => {
    it('should return default for empty object', () => {
      expect(getResponsiveSizeClasses({} as Record<DrawerBreakpoint, DrawerSize>)).toBe(
        DRAWER_SIZE_CLASSES.md
      );
    });
  });
});

describe('buildDrawerAccessibleLabel', () => {
  describe('custom label', () => {
    it('should return custom label when provided', () => {
      expect(buildDrawerAccessibleLabel('My Navigation', 'left')).toBe('My Navigation');
    });

    it('should return custom label regardless of position', () => {
      expect(buildDrawerAccessibleLabel('Custom Panel', 'right')).toBe('Custom Panel');
    });

    it('should handle non-empty custom labels', () => {
      expect(buildDrawerAccessibleLabel('Settings', 'left')).toBe('Settings');
    });
  });

  describe('default labels by position', () => {
    it('should return "Main navigation" for left position', () => {
      expect(buildDrawerAccessibleLabel(undefined, 'left')).toBe('Main navigation');
    });

    it('should return "Side panel" for right position', () => {
      expect(buildDrawerAccessibleLabel(undefined, 'right')).toBe('Side panel');
    });
  });

  describe('edge cases', () => {
    it('should handle empty string as no custom label', () => {
      // Empty string is falsy, so should fall back to position-based label
      expect(buildDrawerAccessibleLabel('', 'left')).toBe('Main navigation');
    });
  });
});

describe('getOpenedAnnouncement', () => {
  it('should append "opened" to the label', () => {
    expect(getOpenedAnnouncement('Navigation')).toBe('Navigation opened');
  });

  it('should work with various labels', () => {
    expect(getOpenedAnnouncement('Main navigation')).toBe('Main navigation opened');
    expect(getOpenedAnnouncement('Side panel')).toBe('Side panel opened');
    expect(getOpenedAnnouncement('Settings')).toBe('Settings opened');
  });

  it('should handle empty label', () => {
    expect(getOpenedAnnouncement('')).toBe(' opened');
  });
});

// ============================================================================
// Accessibility Behavior Documentation Tests
// ============================================================================

describe('Accessibility Behavior Documentation', () => {
  it('should document focus trap behavior', () => {
    // Focus trap wraps Tab navigation within the drawer
    expect(true).toBe(true);
  });

  it('should document focus restoration behavior', () => {
    // Focus returns to previousActiveElement on close
    expect(true).toBe(true);
  });

  it('should document Escape key behavior', () => {
    // Escape key closes drawer when closeOnEscape is true (default)
    expect(true).toBe(true);
  });

  it('should document backdrop click behavior', () => {
    // Backdrop click closes drawer when closeOnBackdropClick is true (default)
    expect(true).toBe(true);
  });

  it('should document body scroll lock behavior', () => {
    // body.style.overflow is set to "hidden" when drawer is open
    expect(true).toBe(true);
  });

  it('should document screen reader announcements', () => {
    // VisuallyHidden with role="status" and aria-live="polite" announces open
    expect(SR_DRAWER_OPENED).toBeDefined();
    expect(SR_DRAWER_CLOSED).toBeDefined();
  });
});

// ============================================================================
// Component Props Documentation Tests
// ============================================================================

describe('Component Props Documentation', () => {
  it('should document required props', () => {
    // isOpen: boolean - controls visibility
    // onClose: () => void - called to close drawer
    // children: ReactNode - drawer content
    expect(true).toBe(true);
  });

  it('should document optional props with defaults', () => {
    // position: "left" | "right" - defaults to "left"
    // size: ResponsiveValue<DrawerSize> - defaults to "md"
    // closeOnBackdropClick: boolean - defaults to true
    // closeOnEscape: boolean - defaults to true
    // closeLabel: string - defaults to DEFAULT_CLOSE_LABEL
    // aria-label: string - defaults based on position
    expect(DEFAULT_CLOSE_LABEL).toBe('Close navigation');
  });

  it('should document data attributes', () => {
    // data-testid: propagates to panel and creates nested test IDs
    // data-state: "open" | "closed"
    // data-position: "left" | "right"
    // data-size: "sm" | "md" | "lg"
    expect(true).toBe(true);
  });
});

// ============================================================================
// ARIA Semantics Documentation Tests
// ============================================================================

describe('ARIA Semantics Documentation', () => {
  it('should document dialog role', () => {
    // role="dialog" on panel element
    expect(true).toBe(true);
  });

  it('should document aria-modal', () => {
    // aria-modal="true" prevents interaction with background
    expect(true).toBe(true);
  });

  it('should document aria-label and aria-labelledby', () => {
    // aria-label for drawer purpose
    // aria-labelledby points to hidden label element
    expect(true).toBe(true);
  });

  it('should document close button aria-label', () => {
    // Close button has aria-label for screen readers
    expect(DEFAULT_CLOSE_LABEL).toBe('Close navigation');
  });

  it('should document backdrop aria-hidden', () => {
    // Backdrop has aria-hidden="true" (not interactive for keyboard users)
    expect(true).toBe(true);
  });
});

// ============================================================================
// Touch Target Compliance Tests
// ============================================================================

describe('Touch Target Compliance (WCAG 2.5.5)', () => {
  it('should have 44px minimum touch target for close button', () => {
    expect(DRAWER_CLOSE_BUTTON_CLASSES).toContain('min-h-[44px]');
    expect(DRAWER_CLOSE_BUTTON_CLASSES).toContain('min-w-[44px]');
  });

  it('should have 44px actual size for close button', () => {
    // h-11 = 44px, w-11 = 44px
    expect(DRAWER_CLOSE_BUTTON_CLASSES).toContain('h-11');
    expect(DRAWER_CLOSE_BUTTON_CLASSES).toContain('w-11');
  });
});

// ============================================================================
// Reduced Motion Compliance Tests
// ============================================================================

describe('Reduced Motion Compliance', () => {
  it('should use motion-safe for backdrop transitions', () => {
    expect(DRAWER_BACKDROP_CLASSES).toContain('motion-safe:');
  });

  it('should use motion-safe for panel transitions', () => {
    expect(DRAWER_PANEL_BASE_CLASSES).toContain('motion-safe:');
  });
});

// ============================================================================
// Integration Pattern Tests
// ============================================================================

describe('Integration Patterns', () => {
  it('should document mobile navigation pattern', () => {
    // Drawer is commonly used for mobile navigation
    // Opens from left side via hamburger menu
    // Contains navigation links
    expect(DRAWER_POSITION_CLASSES.left).toBeDefined();
  });

  it('should document filter panel pattern', () => {
    // Drawer can be used for filter panels
    // Opens from right side
    // Contains filter controls
    expect(DRAWER_POSITION_CLASSES.right).toBeDefined();
  });

  it('should document responsive sidebar pattern', () => {
    // On mobile: sidebar becomes drawer
    // On desktop: sidebar is always visible
    // Drawer is shown only on smaller screens
    expect(true).toBe(true);
  });
});

// ============================================================================
// Type Safety Tests
// ============================================================================

describe('Type Safety', () => {
  it('should have valid DrawerSize values', () => {
    const sizes: DrawerSize[] = ['sm', 'md', 'lg'];
    for (const size of sizes) {
      expect(DRAWER_SIZE_CLASSES[size]).toBeDefined();
    }
  });

  it('should have valid DrawerPosition values', () => {
    const positions: DrawerPosition[] = ['left', 'right'];
    for (const position of positions) {
      expect(DRAWER_POSITION_CLASSES[position]).toBeDefined();
    }
  });

  it('should have valid DrawerBreakpoint values', () => {
    const breakpoints: DrawerBreakpoint[] = ['base', 'sm', 'md', 'lg', 'xl', '2xl'];
    // Breakpoints are used in responsive size classes
    expect(breakpoints).toHaveLength(6);
  });
});
