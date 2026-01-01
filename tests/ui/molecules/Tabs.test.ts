/**
 * @fileoverview Unit tests for the Tabs molecule component
 *
 * Tests cover:
 * - Exported constants for testability
 * - Utility functions (getBaseSize, getResponsiveSizeClasses, getIconSize)
 * - Size class consistency (44px min-height for touch targets)
 * - Responsive class generation
 * - Type exports
 */

import { describe, expect, it } from 'vitest';
import {
  DEFAULT_SIZE,
  DEFAULT_VARIANT,
  TABS_CONTAINER_BASE_CLASSES,
  TABS_CONTAINER_CLASSES,
  TABS_ICON_SIZE_MAP,
  TABS_PANEL_CLASSES,
  TABS_SIZE_CLASSES,
  TABS_TAB_ACTIVE_CLASSES,
  TABS_TAB_BASE_CLASSES,
  TABS_TAB_COMMON_CLASSES,
  TABS_TAB_DISABLED_CLASSES,
  TABS_TAB_INACTIVE_CLASSES,
  type TabsBreakpoint,
  type TabsSize,
  type TabsVariant,
  getBaseSize,
  getIconSize,
  getResponsiveSizeClasses,
} from '../../../packages/ui/molecules/Tabs';

// ============================================================================
// Constants Tests
// ============================================================================

describe('Tabs Constants', () => {
  describe('DEFAULT_SIZE', () => {
    it('should be "md"', () => {
      expect(DEFAULT_SIZE).toBe('md');
    });
  });

  describe('DEFAULT_VARIANT', () => {
    it('should be "default"', () => {
      expect(DEFAULT_VARIANT).toBe('default');
    });
  });

  describe('TABS_SIZE_CLASSES', () => {
    const sizes: TabsSize[] = ['sm', 'md', 'lg'];

    it('should have all size variants', () => {
      for (const size of sizes) {
        expect(TABS_SIZE_CLASSES[size]).toBeDefined();
      }
    });

    it('should have min-height 44px for touch targets on all sizes', () => {
      for (const size of sizes) {
        expect(TABS_SIZE_CLASSES[size]).toContain('min-h-[44px]');
      }
    });

    it('should have increasing text size', () => {
      expect(TABS_SIZE_CLASSES.sm).toContain('text-xs');
      expect(TABS_SIZE_CLASSES.md).toContain('text-sm');
      expect(TABS_SIZE_CLASSES.lg).toContain('text-base');
    });

    it('should have increasing padding', () => {
      expect(TABS_SIZE_CLASSES.sm).toContain('px-2');
      expect(TABS_SIZE_CLASSES.md).toContain('px-3');
      expect(TABS_SIZE_CLASSES.lg).toContain('px-4');
    });

    it('should have gap classes', () => {
      expect(TABS_SIZE_CLASSES.sm).toContain('gap-1');
      expect(TABS_SIZE_CLASSES.md).toContain('gap-1.5');
      expect(TABS_SIZE_CLASSES.lg).toContain('gap-2');
    });
  });

  describe('TABS_CONTAINER_CLASSES', () => {
    const variants: TabsVariant[] = ['default', 'pills', 'underline'];

    it('should have all variant styles', () => {
      for (const variant of variants) {
        expect(TABS_CONTAINER_CLASSES[variant]).toBeDefined();
      }
    });

    it('should have background for default variant', () => {
      expect(TABS_CONTAINER_CLASSES.default).toContain('bg-');
      expect(TABS_CONTAINER_CLASSES.default).toContain('rounded-lg');
    });

    it('should have gap for pills variant', () => {
      expect(TABS_CONTAINER_CLASSES.pills).toContain('gap-');
    });

    it('should have border for underline variant', () => {
      expect(TABS_CONTAINER_CLASSES.underline).toContain('border-b');
    });
  });

  describe('TABS_CONTAINER_BASE_CLASSES', () => {
    it('should have flex classes', () => {
      expect(TABS_CONTAINER_BASE_CLASSES).toContain('inline-flex');
      expect(TABS_CONTAINER_BASE_CLASSES).toContain('items-center');
    });
  });

  describe('TABS_TAB_BASE_CLASSES', () => {
    const variants: TabsVariant[] = ['default', 'pills', 'underline'];

    it('should have all variant styles', () => {
      for (const variant of variants) {
        expect(TABS_TAB_BASE_CLASSES[variant]).toBeDefined();
      }
    });

    it('should have rounded for default and pills', () => {
      expect(TABS_TAB_BASE_CLASSES.default).toContain('rounded-md');
      expect(TABS_TAB_BASE_CLASSES.pills).toContain('rounded-full');
    });

    it('should have border-b for underline', () => {
      expect(TABS_TAB_BASE_CLASSES.underline).toContain('border-b-2');
    });
  });

  describe('TABS_TAB_ACTIVE_CLASSES', () => {
    const variants: TabsVariant[] = ['default', 'pills', 'underline'];

    it('should have all variant styles', () => {
      for (const variant of variants) {
        expect(TABS_TAB_ACTIVE_CLASSES[variant]).toBeDefined();
      }
    });

    it('should have background for default', () => {
      expect(TABS_TAB_ACTIVE_CLASSES.default).toContain('bg-');
    });

    it('should have primary colors for pills', () => {
      expect(TABS_TAB_ACTIVE_CLASSES.pills).toContain('bg-[rgb(var(--primary))]');
    });

    it('should have border color for underline', () => {
      expect(TABS_TAB_ACTIVE_CLASSES.underline).toContain('border-[rgb(var(--primary))]');
    });
  });

  describe('TABS_TAB_INACTIVE_CLASSES', () => {
    const variants: TabsVariant[] = ['default', 'pills', 'underline'];

    it('should have all variant styles', () => {
      for (const variant of variants) {
        expect(TABS_TAB_INACTIVE_CLASSES[variant]).toBeDefined();
      }
    });

    it('should have muted foreground color', () => {
      for (const variant of variants) {
        expect(TABS_TAB_INACTIVE_CLASSES[variant]).toContain('text-[rgb(var(--muted-foreground))]');
      }
    });

    it('should have hover states', () => {
      for (const variant of variants) {
        expect(TABS_TAB_INACTIVE_CLASSES[variant]).toContain('hover:');
      }
    });
  });

  describe('TABS_TAB_DISABLED_CLASSES', () => {
    it('should have opacity', () => {
      expect(TABS_TAB_DISABLED_CLASSES).toContain('opacity-50');
    });

    it('should have cursor-not-allowed', () => {
      expect(TABS_TAB_DISABLED_CLASSES).toContain('cursor-not-allowed');
    });
  });

  describe('TABS_TAB_COMMON_CLASSES', () => {
    it('should have flex alignment', () => {
      expect(TABS_TAB_COMMON_CLASSES).toContain('inline-flex');
      expect(TABS_TAB_COMMON_CLASSES).toContain('items-center');
      expect(TABS_TAB_COMMON_CLASSES).toContain('justify-center');
    });

    it('should have font-medium', () => {
      expect(TABS_TAB_COMMON_CLASSES).toContain('font-medium');
    });

    it('should respect motion-safe for transitions', () => {
      expect(TABS_TAB_COMMON_CLASSES).toContain('motion-safe:transition-all');
    });

    it('should have focus-visible styles', () => {
      expect(TABS_TAB_COMMON_CLASSES).toContain('focus-visible:outline-none');
      expect(TABS_TAB_COMMON_CLASSES).toContain('focus-visible:ring-2');
    });
  });

  describe('TABS_ICON_SIZE_MAP', () => {
    const sizes: TabsSize[] = ['sm', 'md', 'lg'];

    it('should map all sizes', () => {
      for (const size of sizes) {
        expect(TABS_ICON_SIZE_MAP[size]).toBeDefined();
      }
    });

    it('should use "sm" icon for sm and md tabs', () => {
      expect(TABS_ICON_SIZE_MAP.sm).toBe('sm');
      expect(TABS_ICON_SIZE_MAP.md).toBe('sm');
    });

    it('should use "md" icon for lg tabs', () => {
      expect(TABS_ICON_SIZE_MAP.lg).toBe('md');
    });
  });

  describe('TABS_PANEL_CLASSES', () => {
    it('should have focus-visible:outline-none', () => {
      expect(TABS_PANEL_CLASSES).toContain('focus-visible:outline-none');
    });
  });
});

// ============================================================================
// Utility Function Tests
// ============================================================================

describe('getBaseSize', () => {
  it('should return DEFAULT_SIZE when size is undefined', () => {
    expect(getBaseSize(undefined)).toBe(DEFAULT_SIZE);
  });

  it('should return the size when it is a string', () => {
    expect(getBaseSize('sm')).toBe('sm');
    expect(getBaseSize('md')).toBe('md');
    expect(getBaseSize('lg')).toBe('lg');
  });

  it('should return base from responsive object', () => {
    expect(getBaseSize({ base: 'sm' })).toBe('sm');
    expect(getBaseSize({ base: 'lg', md: 'md' })).toBe('lg');
  });

  it('should return DEFAULT_SIZE when responsive object has no base', () => {
    expect(getBaseSize({ md: 'lg' })).toBe(DEFAULT_SIZE);
    expect(getBaseSize({})).toBe(DEFAULT_SIZE);
  });
});

describe('getResponsiveSizeClasses', () => {
  it('should return default size classes when size is undefined', () => {
    const result = getResponsiveSizeClasses(undefined);
    expect(result).toBe(TABS_SIZE_CLASSES[DEFAULT_SIZE]);
  });

  it('should return correct classes for string size', () => {
    expect(getResponsiveSizeClasses('sm')).toBe(TABS_SIZE_CLASSES.sm);
    expect(getResponsiveSizeClasses('md')).toBe(TABS_SIZE_CLASSES.md);
    expect(getResponsiveSizeClasses('lg')).toBe(TABS_SIZE_CLASSES.lg);
  });

  it('should generate responsive classes for base only', () => {
    const result = getResponsiveSizeClasses({ base: 'sm' });
    expect(result).toBe(TABS_SIZE_CLASSES.sm);
  });

  it('should generate responsive classes with breakpoint prefixes', () => {
    const result = getResponsiveSizeClasses({ base: 'sm', md: 'lg' });
    expect(result).toContain(TABS_SIZE_CLASSES.sm);
    expect(result).toContain('md:text-base');
    expect(result).toContain('md:px-4');
    expect(result).toContain('md:py-2');
    expect(result).toContain('md:gap-2');
    expect(result).toContain('md:min-h-[44px]');
  });

  it('should handle multiple breakpoints', () => {
    const result = getResponsiveSizeClasses({ base: 'sm', sm: 'sm', md: 'md', lg: 'lg' });
    expect(result).toContain(TABS_SIZE_CLASSES.sm);
    expect(result).toContain('sm:text-xs');
    expect(result).toContain('md:text-sm');
    expect(result).toContain('lg:text-base');
  });

  it('should use default size when base is not specified in responsive object', () => {
    const result = getResponsiveSizeClasses({ md: 'lg' });
    expect(result).toContain(TABS_SIZE_CLASSES[DEFAULT_SIZE]);
    expect(result).toContain('md:text-base');
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
    expect(result).toContain('sm:');
    expect(result).toContain('md:');
    expect(result).toContain('lg:');
    expect(result).toContain('xl:');
    expect(result).toContain('2xl:');
  });
});

describe('getIconSize', () => {
  it('should return "sm" for sm size', () => {
    expect(getIconSize('sm')).toBe('sm');
  });

  it('should return "sm" for md size', () => {
    expect(getIconSize('md')).toBe('sm');
  });

  it('should return "md" for lg size', () => {
    expect(getIconSize('lg')).toBe('md');
  });
});

// ============================================================================
// Type Export Tests
// ============================================================================

describe('Type Exports', () => {
  it('should export TabsSize type', () => {
    const size: TabsSize = 'md';
    expect(['sm', 'md', 'lg']).toContain(size);
  });

  it('should export TabsVariant type', () => {
    const variant: TabsVariant = 'default';
    expect(['default', 'pills', 'underline']).toContain(variant);
  });

  it('should export TabsBreakpoint type', () => {
    const breakpoint: TabsBreakpoint = 'base';
    expect(['base', 'sm', 'md', 'lg', 'xl', '2xl']).toContain(breakpoint);
  });
});

// ============================================================================
// Size Consistency Tests
// ============================================================================

describe('Size Consistency', () => {
  const sizes: TabsSize[] = ['sm', 'md', 'lg'];

  it('should have consistent min-height across all sizes for accessibility', () => {
    for (const size of sizes) {
      const classes = TABS_SIZE_CLASSES[size];
      expect(classes).toContain('min-h-[44px]');
    }
  });

  it('should have progressively larger text sizes', () => {
    const textSizes = {
      sm: 'text-xs',
      md: 'text-sm',
      lg: 'text-base',
    };

    for (const size of sizes) {
      expect(TABS_SIZE_CLASSES[size]).toContain(textSizes[size]);
    }
  });

  it('should have progressively larger padding', () => {
    const paddingX = {
      sm: 'px-2',
      md: 'px-3',
      lg: 'px-4',
    };

    for (const size of sizes) {
      expect(TABS_SIZE_CLASSES[size]).toContain(paddingX[size]);
    }
  });
});

// ============================================================================
// Variant Consistency Tests
// ============================================================================

describe('Variant Consistency', () => {
  const variants: TabsVariant[] = ['default', 'pills', 'underline'];

  it('should have container classes for all variants', () => {
    for (const variant of variants) {
      expect(TABS_CONTAINER_CLASSES[variant]).toBeTruthy();
    }
  });

  it('should have tab base classes for all variants', () => {
    for (const variant of variants) {
      expect(TABS_TAB_BASE_CLASSES[variant]).toBeTruthy();
    }
  });

  it('should have active classes for all variants', () => {
    for (const variant of variants) {
      expect(TABS_TAB_ACTIVE_CLASSES[variant]).toBeTruthy();
    }
  });

  it('should have inactive classes for all variants', () => {
    for (const variant of variants) {
      expect(TABS_TAB_INACTIVE_CLASSES[variant]).toBeTruthy();
    }
  });
});

// ============================================================================
// Accessibility Tests
// ============================================================================

describe('Accessibility Constants', () => {
  it('should have focus-visible ring in common classes', () => {
    expect(TABS_TAB_COMMON_CLASSES).toContain('focus-visible:ring-2');
    expect(TABS_TAB_COMMON_CLASSES).toContain('focus-visible:ring-offset-2');
  });

  it('should use motion-safe for transitions', () => {
    expect(TABS_TAB_COMMON_CLASSES).toContain('motion-safe:');
  });

  it('should have 44px min-height for touch targets', () => {
    const sizes: TabsSize[] = ['sm', 'md', 'lg'];
    for (const size of sizes) {
      expect(TABS_SIZE_CLASSES[size]).toContain('min-h-[44px]');
    }
  });

  it('should have disabled styling with reduced opacity', () => {
    expect(TABS_TAB_DISABLED_CLASSES).toContain('opacity-50');
  });

  it('should have focus outline suppression with ring replacement', () => {
    expect(TABS_TAB_COMMON_CLASSES).toContain('focus-visible:outline-none');
    expect(TABS_TAB_COMMON_CLASSES).toContain('focus-visible:ring-2');
  });
});
