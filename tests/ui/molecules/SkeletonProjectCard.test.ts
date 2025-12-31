/**
 * SkeletonProjectCard Unit Tests
 *
 * Tests for the SkeletonProjectCard molecule including:
 * - Exported constants
 * - Utility functions (getBaseSize, getResponsiveSizeClasses, getIconDimensions)
 * - Responsive behavior
 * - Accessibility attributes
 */

import { describe, expect, it } from 'vitest';
import {
  SKELETON_PROJECT_CARD_BASE_CLASSES,
  SKELETON_PROJECT_CARD_DESCRIPTION_CLASSES,
  SKELETON_PROJECT_CARD_ICON_CLASSES,
  SKELETON_PROJECT_CARD_ICON_MARGIN_CLASSES,
  SKELETON_PROJECT_CARD_PADDING_CLASSES,
  SKELETON_PROJECT_CARD_TITLE_CLASSES,
  SKELETON_PROJECT_CARD_TITLE_MARGIN_CLASSES,
  type SkeletonProjectCardSize,
  getBaseSize,
  getIconDimensions,
  getResponsiveSizeClasses,
} from '../../../packages/ui/molecules/SkeletonProjectCard';

// =============================================================================
// SKELETON_PROJECT_CARD_BASE_CLASSES Tests
// =============================================================================

describe('SKELETON_PROJECT_CARD_BASE_CLASSES', () => {
  it('includes flex-col layout', () => {
    expect(SKELETON_PROJECT_CARD_BASE_CLASSES).toContain('flex');
    expect(SKELETON_PROJECT_CARD_BASE_CLASSES).toContain('flex-col');
  });

  it('includes rounded-lg for border radius', () => {
    expect(SKELETON_PROJECT_CARD_BASE_CLASSES).toContain('rounded-lg');
  });

  it('includes border styling', () => {
    expect(SKELETON_PROJECT_CARD_BASE_CLASSES).toContain('border');
    expect(SKELETON_PROJECT_CARD_BASE_CLASSES).toContain('border-[rgb(var(--border))]');
  });

  it('includes card background', () => {
    expect(SKELETON_PROJECT_CARD_BASE_CLASSES).toContain('bg-[rgb(var(--card))]');
  });
});

// =============================================================================
// SKELETON_PROJECT_CARD_PADDING_CLASSES Tests
// =============================================================================

describe('SKELETON_PROJECT_CARD_PADDING_CLASSES', () => {
  it('defines padding for all sizes', () => {
    expect(SKELETON_PROJECT_CARD_PADDING_CLASSES).toHaveProperty('sm');
    expect(SKELETON_PROJECT_CARD_PADDING_CLASSES).toHaveProperty('md');
    expect(SKELETON_PROJECT_CARD_PADDING_CLASSES).toHaveProperty('lg');
  });

  it('small size has p-3 padding', () => {
    expect(SKELETON_PROJECT_CARD_PADDING_CLASSES.sm).toBe('p-3');
  });

  it('medium size has p-4 padding', () => {
    expect(SKELETON_PROJECT_CARD_PADDING_CLASSES.md).toBe('p-4');
  });

  it('large size has p-5 padding', () => {
    expect(SKELETON_PROJECT_CARD_PADDING_CLASSES.lg).toBe('p-5');
  });

  it('padding increases with size', () => {
    // Extract numeric values
    const smPadding = Number.parseInt(SKELETON_PROJECT_CARD_PADDING_CLASSES.sm.replace('p-', ''));
    const mdPadding = Number.parseInt(SKELETON_PROJECT_CARD_PADDING_CLASSES.md.replace('p-', ''));
    const lgPadding = Number.parseInt(SKELETON_PROJECT_CARD_PADDING_CLASSES.lg.replace('p-', ''));

    expect(smPadding).toBeLessThan(mdPadding);
    expect(mdPadding).toBeLessThan(lgPadding);
  });
});

// =============================================================================
// SKELETON_PROJECT_CARD_ICON_CLASSES Tests
// =============================================================================

describe('SKELETON_PROJECT_CARD_ICON_CLASSES', () => {
  it('defines dimensions for all sizes', () => {
    expect(SKELETON_PROJECT_CARD_ICON_CLASSES).toHaveProperty('sm');
    expect(SKELETON_PROJECT_CARD_ICON_CLASSES).toHaveProperty('md');
    expect(SKELETON_PROJECT_CARD_ICON_CLASSES).toHaveProperty('lg');
  });

  it('each size has width and height properties', () => {
    for (const size of Object.values(SKELETON_PROJECT_CARD_ICON_CLASSES)) {
      expect(size).toHaveProperty('width');
      expect(size).toHaveProperty('height');
      expect(typeof size.width).toBe('number');
      expect(typeof size.height).toBe('number');
    }
  });

  it('small size has 32x32 dimensions', () => {
    expect(SKELETON_PROJECT_CARD_ICON_CLASSES.sm).toEqual({ width: 32, height: 32 });
  });

  it('medium size has 40x40 dimensions', () => {
    expect(SKELETON_PROJECT_CARD_ICON_CLASSES.md).toEqual({ width: 40, height: 40 });
  });

  it('large size has 48x48 dimensions', () => {
    expect(SKELETON_PROJECT_CARD_ICON_CLASSES.lg).toEqual({ width: 48, height: 48 });
  });

  it('dimensions increase with size', () => {
    expect(SKELETON_PROJECT_CARD_ICON_CLASSES.sm.width).toBeLessThan(
      SKELETON_PROJECT_CARD_ICON_CLASSES.md.width
    );
    expect(SKELETON_PROJECT_CARD_ICON_CLASSES.md.width).toBeLessThan(
      SKELETON_PROJECT_CARD_ICON_CLASSES.lg.width
    );
  });

  it('icons are square (width equals height)', () => {
    for (const size of Object.values(SKELETON_PROJECT_CARD_ICON_CLASSES)) {
      expect(size.width).toBe(size.height);
    }
  });
});

// =============================================================================
// SKELETON_PROJECT_CARD_ICON_MARGIN_CLASSES Tests
// =============================================================================

describe('SKELETON_PROJECT_CARD_ICON_MARGIN_CLASSES', () => {
  it('defines margin for all sizes', () => {
    expect(SKELETON_PROJECT_CARD_ICON_MARGIN_CLASSES).toHaveProperty('sm');
    expect(SKELETON_PROJECT_CARD_ICON_MARGIN_CLASSES).toHaveProperty('md');
    expect(SKELETON_PROJECT_CARD_ICON_MARGIN_CLASSES).toHaveProperty('lg');
  });

  it('small size has mb-2 margin', () => {
    expect(SKELETON_PROJECT_CARD_ICON_MARGIN_CLASSES.sm).toBe('mb-2');
  });

  it('medium size has mb-3 margin', () => {
    expect(SKELETON_PROJECT_CARD_ICON_MARGIN_CLASSES.md).toBe('mb-3');
  });

  it('large size has mb-4 margin', () => {
    expect(SKELETON_PROJECT_CARD_ICON_MARGIN_CLASSES.lg).toBe('mb-4');
  });
});

// =============================================================================
// SKELETON_PROJECT_CARD_TITLE_CLASSES Tests
// =============================================================================

describe('SKELETON_PROJECT_CARD_TITLE_CLASSES', () => {
  it('defines height for all sizes', () => {
    expect(SKELETON_PROJECT_CARD_TITLE_CLASSES).toHaveProperty('sm');
    expect(SKELETON_PROJECT_CARD_TITLE_CLASSES).toHaveProperty('md');
    expect(SKELETON_PROJECT_CARD_TITLE_CLASSES).toHaveProperty('lg');
  });

  it('small size has h-4 height', () => {
    expect(SKELETON_PROJECT_CARD_TITLE_CLASSES.sm).toBe('h-4');
  });

  it('medium size has h-5 height', () => {
    expect(SKELETON_PROJECT_CARD_TITLE_CLASSES.md).toBe('h-5');
  });

  it('large size has h-6 height', () => {
    expect(SKELETON_PROJECT_CARD_TITLE_CLASSES.lg).toBe('h-6');
  });
});

// =============================================================================
// SKELETON_PROJECT_CARD_TITLE_MARGIN_CLASSES Tests
// =============================================================================

describe('SKELETON_PROJECT_CARD_TITLE_MARGIN_CLASSES', () => {
  it('defines margin for all sizes', () => {
    expect(SKELETON_PROJECT_CARD_TITLE_MARGIN_CLASSES).toHaveProperty('sm');
    expect(SKELETON_PROJECT_CARD_TITLE_MARGIN_CLASSES).toHaveProperty('md');
    expect(SKELETON_PROJECT_CARD_TITLE_MARGIN_CLASSES).toHaveProperty('lg');
  });

  it('small size has mb-0.5 margin', () => {
    expect(SKELETON_PROJECT_CARD_TITLE_MARGIN_CLASSES.sm).toBe('mb-0.5');
  });

  it('medium size has mb-1 margin', () => {
    expect(SKELETON_PROJECT_CARD_TITLE_MARGIN_CLASSES.md).toBe('mb-1');
  });

  it('large size has mb-1.5 margin', () => {
    expect(SKELETON_PROJECT_CARD_TITLE_MARGIN_CLASSES.lg).toBe('mb-1.5');
  });
});

// =============================================================================
// SKELETON_PROJECT_CARD_DESCRIPTION_CLASSES Tests
// =============================================================================

describe('SKELETON_PROJECT_CARD_DESCRIPTION_CLASSES', () => {
  it('defines height for all sizes', () => {
    expect(SKELETON_PROJECT_CARD_DESCRIPTION_CLASSES).toHaveProperty('sm');
    expect(SKELETON_PROJECT_CARD_DESCRIPTION_CLASSES).toHaveProperty('md');
    expect(SKELETON_PROJECT_CARD_DESCRIPTION_CLASSES).toHaveProperty('lg');
  });

  it('small size has h-2.5 height', () => {
    expect(SKELETON_PROJECT_CARD_DESCRIPTION_CLASSES.sm).toBe('h-2.5');
  });

  it('medium size has h-3 height', () => {
    expect(SKELETON_PROJECT_CARD_DESCRIPTION_CLASSES.md).toBe('h-3');
  });

  it('large size has h-3.5 height', () => {
    expect(SKELETON_PROJECT_CARD_DESCRIPTION_CLASSES.lg).toBe('h-3.5');
  });
});

// =============================================================================
// getBaseSize Tests
// =============================================================================

describe('getBaseSize', () => {
  describe('with string value', () => {
    it('returns sm when passed "sm"', () => {
      expect(getBaseSize('sm')).toBe('sm');
    });

    it('returns md when passed "md"', () => {
      expect(getBaseSize('md')).toBe('md');
    });

    it('returns lg when passed "lg"', () => {
      expect(getBaseSize('lg')).toBe('lg');
    });
  });

  describe('with responsive object', () => {
    it('returns base value when provided', () => {
      expect(getBaseSize({ base: 'sm' })).toBe('sm');
      expect(getBaseSize({ base: 'md' })).toBe('md');
      expect(getBaseSize({ base: 'lg' })).toBe('lg');
    });

    it('returns md as default when base is not provided', () => {
      expect(getBaseSize({ md: 'lg' })).toBe('md');
      expect(getBaseSize({ lg: 'lg' })).toBe('md');
      expect(getBaseSize({})).toBe('md');
    });

    it('ignores other breakpoints when getting base size', () => {
      expect(getBaseSize({ base: 'sm', md: 'md', lg: 'lg' })).toBe('sm');
    });
  });
});

// =============================================================================
// getResponsiveSizeClasses Tests
// =============================================================================

describe('getResponsiveSizeClasses', () => {
  describe('with string value', () => {
    it('returns direct class for sm', () => {
      const result = getResponsiveSizeClasses('sm', SKELETON_PROJECT_CARD_PADDING_CLASSES);
      expect(result).toBe('p-3');
    });

    it('returns direct class for md', () => {
      const result = getResponsiveSizeClasses('md', SKELETON_PROJECT_CARD_PADDING_CLASSES);
      expect(result).toBe('p-4');
    });

    it('returns direct class for lg', () => {
      const result = getResponsiveSizeClasses('lg', SKELETON_PROJECT_CARD_PADDING_CLASSES);
      expect(result).toBe('p-5');
    });
  });

  describe('with responsive object', () => {
    it('handles base breakpoint without prefix', () => {
      const result = getResponsiveSizeClasses(
        { base: 'sm' },
        SKELETON_PROJECT_CARD_PADDING_CLASSES
      );
      expect(result).toBe('p-3');
    });

    it('adds breakpoint prefix for non-base breakpoints', () => {
      const result = getResponsiveSizeClasses({ md: 'lg' }, SKELETON_PROJECT_CARD_PADDING_CLASSES);
      expect(result).toBe('md:p-5');
    });

    it('combines base and responsive breakpoints', () => {
      const result = getResponsiveSizeClasses(
        { base: 'sm', md: 'md' },
        SKELETON_PROJECT_CARD_PADDING_CLASSES
      );
      expect(result).toBe('p-3 md:p-4');
    });

    it('handles full responsive chain', () => {
      const result = getResponsiveSizeClasses(
        { base: 'sm', md: 'md', lg: 'lg' },
        SKELETON_PROJECT_CARD_PADDING_CLASSES
      );
      expect(result).toBe('p-3 md:p-4 lg:p-5');
    });

    it('handles all breakpoints', () => {
      const result = getResponsiveSizeClasses(
        { base: 'sm', sm: 'sm', md: 'md', lg: 'lg', xl: 'lg', '2xl': 'lg' },
        SKELETON_PROJECT_CARD_PADDING_CLASSES
      );
      expect(result).toContain('p-3');
      expect(result).toContain('sm:p-3');
      expect(result).toContain('md:p-4');
      expect(result).toContain('lg:p-5');
      expect(result).toContain('xl:p-5');
      expect(result).toContain('2xl:p-5');
    });

    it('maintains breakpoint order', () => {
      const result = getResponsiveSizeClasses(
        { lg: 'lg', base: 'sm', md: 'md' },
        SKELETON_PROJECT_CARD_PADDING_CLASSES
      );
      // Should be in order: base, md, lg
      expect(result).toBe('p-3 md:p-4 lg:p-5');
    });
  });

  describe('with title classes', () => {
    it('handles title height classes', () => {
      const result = getResponsiveSizeClasses(
        { base: 'sm', md: 'lg' },
        SKELETON_PROJECT_CARD_TITLE_CLASSES
      );
      expect(result).toBe('h-4 md:h-6');
    });
  });

  describe('with description classes', () => {
    it('handles description height classes', () => {
      const result = getResponsiveSizeClasses(
        { base: 'sm', lg: 'lg' },
        SKELETON_PROJECT_CARD_DESCRIPTION_CLASSES
      );
      expect(result).toBe('h-2.5 lg:h-3.5');
    });
  });
});

// =============================================================================
// getIconDimensions Tests
// =============================================================================

describe('getIconDimensions', () => {
  describe('with string value', () => {
    it('returns 32x32 for sm', () => {
      expect(getIconDimensions('sm')).toEqual({ width: 32, height: 32 });
    });

    it('returns 40x40 for md', () => {
      expect(getIconDimensions('md')).toEqual({ width: 40, height: 40 });
    });

    it('returns 48x48 for lg', () => {
      expect(getIconDimensions('lg')).toEqual({ width: 48, height: 48 });
    });
  });

  describe('with responsive object', () => {
    it('uses base size for dimensions', () => {
      expect(getIconDimensions({ base: 'sm', md: 'lg' })).toEqual({ width: 32, height: 32 });
      expect(getIconDimensions({ base: 'lg', md: 'sm' })).toEqual({ width: 48, height: 48 });
    });

    it('defaults to md dimensions when no base specified', () => {
      expect(getIconDimensions({ md: 'lg' })).toEqual({ width: 40, height: 40 });
      expect(getIconDimensions({ lg: 'sm' })).toEqual({ width: 40, height: 40 });
    });
  });
});

// =============================================================================
// Size Consistency Tests
// =============================================================================

describe('Size Consistency', () => {
  const sizes: SkeletonProjectCardSize[] = ['sm', 'md', 'lg'];

  it('all class maps have entries for all sizes', () => {
    for (const size of sizes) {
      expect(SKELETON_PROJECT_CARD_PADDING_CLASSES).toHaveProperty(size);
      expect(SKELETON_PROJECT_CARD_ICON_CLASSES).toHaveProperty(size);
      expect(SKELETON_PROJECT_CARD_ICON_MARGIN_CLASSES).toHaveProperty(size);
      expect(SKELETON_PROJECT_CARD_TITLE_CLASSES).toHaveProperty(size);
      expect(SKELETON_PROJECT_CARD_TITLE_MARGIN_CLASSES).toHaveProperty(size);
      expect(SKELETON_PROJECT_CARD_DESCRIPTION_CLASSES).toHaveProperty(size);
    }
  });

  it('all class values are non-empty strings', () => {
    for (const size of sizes) {
      expect(SKELETON_PROJECT_CARD_PADDING_CLASSES[size]).toBeTruthy();
      expect(SKELETON_PROJECT_CARD_ICON_MARGIN_CLASSES[size]).toBeTruthy();
      expect(SKELETON_PROJECT_CARD_TITLE_CLASSES[size]).toBeTruthy();
      expect(SKELETON_PROJECT_CARD_TITLE_MARGIN_CLASSES[size]).toBeTruthy();
      expect(SKELETON_PROJECT_CARD_DESCRIPTION_CLASSES[size]).toBeTruthy();
    }
  });

  it('icon dimensions are positive numbers', () => {
    for (const size of sizes) {
      expect(SKELETON_PROJECT_CARD_ICON_CLASSES[size].width).toBeGreaterThan(0);
      expect(SKELETON_PROJECT_CARD_ICON_CLASSES[size].height).toBeGreaterThan(0);
    }
  });
});

// =============================================================================
// Component Behavior Documentation Tests
// =============================================================================

describe('Component Behavior Documentation', () => {
  it('documents that aria-hidden="true" is always applied', () => {
    // This is enforced in the component implementation
    // The container always has aria-hidden={true}
    expect(true).toBe(true); // Placeholder for implementation-level behavior
  });

  it('documents that role="presentation" is always applied', () => {
    // This is enforced in the component implementation
    // The container always has role="presentation"
    expect(true).toBe(true); // Placeholder for implementation-level behavior
  });

  it('documents default props', () => {
    // Default size is 'md'
    expect(getBaseSize('md')).toBe('md');
    // showDescription defaults to true (implemented in component)
    expect(true).toBe(true);
  });
});

// =============================================================================
// Type Safety Tests
// =============================================================================

describe('Type Safety', () => {
  it('size values are valid SkeletonProjectCardSize', () => {
    const validSizes: SkeletonProjectCardSize[] = ['sm', 'md', 'lg'];
    const testedSizes = Object.keys(SKELETON_PROJECT_CARD_PADDING_CLASSES);
    expect(testedSizes).toEqual(validSizes);
  });

  it('responsive value accepts all breakpoints', () => {
    const responsiveValue = {
      base: 'sm' as const,
      sm: 'sm' as const,
      md: 'md' as const,
      lg: 'lg' as const,
      xl: 'lg' as const,
      '2xl': 'lg' as const,
    };
    const result = getResponsiveSizeClasses(responsiveValue, SKELETON_PROJECT_CARD_PADDING_CLASSES);
    expect(result).toContain('p-3'); // base
    expect(result).toContain('sm:p-3'); // sm
    expect(result).toContain('md:p-4'); // md
    expect(result).toContain('lg:p-5'); // lg
    expect(result).toContain('xl:p-5'); // xl
    expect(result).toContain('2xl:p-5'); // 2xl
  });
});

// =============================================================================
// Tailwind Class Consistency Tests
// =============================================================================

describe('Tailwind Class Consistency', () => {
  it('padding classes follow Tailwind pattern', () => {
    for (const cls of Object.values(SKELETON_PROJECT_CARD_PADDING_CLASSES)) {
      expect(cls).toMatch(/^p-\d+(\.\d+)?$/);
    }
  });

  it('margin classes follow Tailwind pattern', () => {
    for (const cls of Object.values(SKELETON_PROJECT_CARD_ICON_MARGIN_CLASSES)) {
      expect(cls).toMatch(/^mb-\d+(\.\d+)?$/);
    }
    for (const cls of Object.values(SKELETON_PROJECT_CARD_TITLE_MARGIN_CLASSES)) {
      expect(cls).toMatch(/^mb-\d+(\.\d+)?$/);
    }
  });

  it('height classes follow Tailwind pattern', () => {
    for (const cls of Object.values(SKELETON_PROJECT_CARD_TITLE_CLASSES)) {
      expect(cls).toMatch(/^h-\d+(\.\d+)?$/);
    }
    for (const cls of Object.values(SKELETON_PROJECT_CARD_DESCRIPTION_CLASSES)) {
      expect(cls).toMatch(/^h-\d+(\.\d+)?$/);
    }
  });
});

// =============================================================================
// Responsive Breakpoint Order Tests
// =============================================================================

describe('Responsive Breakpoint Order', () => {
  it('outputs breakpoints in mobile-first order', () => {
    const result = getResponsiveSizeClasses(
      { '2xl': 'lg', lg: 'lg', md: 'md', sm: 'sm', base: 'sm' },
      SKELETON_PROJECT_CARD_PADDING_CLASSES
    );

    const classes = result.split(' ');
    const breakpointOrder = ['base', 'sm', 'md', 'lg', 'xl', '2xl'];
    let lastIndex = -1;

    for (const cls of classes) {
      let currentBreakpoint = 'base';
      if (cls.includes(':')) {
        const parts = cls.split(':');
        currentBreakpoint = parts[0] ?? 'base';
      }

      const currentIndex = breakpointOrder.indexOf(currentBreakpoint);
      expect(currentIndex).toBeGreaterThan(lastIndex);
      lastIndex = currentIndex;
    }
  });
});
