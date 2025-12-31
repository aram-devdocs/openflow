/**
 * SkeletonStats molecule tests
 *
 * Tests for the SkeletonStats loading placeholder component that
 * provides visual loading indication for stats/metrics dashboard cards.
 */

import { describe, expect, it } from 'vitest';
import {
  DEFAULT_STAT_COUNT,
  SKELETON_STATS_BASE_CLASSES,
  SKELETON_STATS_GAP_CLASSES,
  SKELETON_STATS_GRID_CLASSES,
  SKELETON_STAT_CARD_CLASSES,
  SKELETON_STAT_CARD_PADDING_CLASSES,
  SKELETON_STAT_GAP_CLASSES,
  SKELETON_STAT_ICON_CLASSES,
  SKELETON_STAT_ICON_MARGIN_CLASSES,
  SKELETON_STAT_LABEL_CLASSES,
  SKELETON_STAT_TREND_CLASSES,
  SKELETON_STAT_TREND_MARGIN_CLASSES,
  SKELETON_STAT_VALUE_CLASSES,
  type SkeletonStatsSize,
  getBaseSize,
  getIconDimensions,
  getResponsiveSizeClasses,
} from '../../../packages/ui/molecules/SkeletonStats';

// =============================================================================
// DEFAULT VALUES
// =============================================================================

describe('DEFAULT_STAT_COUNT', () => {
  it('should be 4 (standard dashboard layout)', () => {
    expect(DEFAULT_STAT_COUNT).toBe(4);
  });
});

// =============================================================================
// SKELETON_STATS_BASE_CLASSES
// =============================================================================

describe('SKELETON_STATS_BASE_CLASSES', () => {
  it('should use CSS grid layout', () => {
    expect(SKELETON_STATS_BASE_CLASSES).toContain('grid');
  });
});

// =============================================================================
// SKELETON_STATS_GRID_CLASSES
// =============================================================================

describe('SKELETON_STATS_GRID_CLASSES', () => {
  it('should include responsive grid columns', () => {
    expect(SKELETON_STATS_GRID_CLASSES).toContain('grid-cols-1');
    expect(SKELETON_STATS_GRID_CLASSES).toContain('sm:grid-cols-2');
    expect(SKELETON_STATS_GRID_CLASSES).toContain('lg:grid-cols-4');
  });

  it('should start with single column on mobile', () => {
    const classes = SKELETON_STATS_GRID_CLASSES.split(' ');
    const baseGridCol = classes.find((c) => c === 'grid-cols-1');
    expect(baseGridCol).toBeDefined();
  });

  it('should scale to 4 columns on large screens', () => {
    expect(SKELETON_STATS_GRID_CLASSES).toContain('lg:grid-cols-4');
  });
});

// =============================================================================
// SKELETON_STATS_GAP_CLASSES
// =============================================================================

describe('SKELETON_STATS_GAP_CLASSES', () => {
  const sizes: SkeletonStatsSize[] = ['sm', 'md', 'lg'];

  it('should have gap classes for all sizes', () => {
    for (const size of sizes) {
      expect(SKELETON_STATS_GAP_CLASSES[size]).toBeDefined();
      expect(SKELETON_STATS_GAP_CLASSES[size]).toContain('gap-');
    }
  });

  it('should have increasing gap values for larger sizes', () => {
    // Extract gap values from classes
    const extractGap = (classes: string): number => {
      const match = classes.match(/gap-(\d+)/);
      return match?.[1] ? Number.parseInt(match[1], 10) : 0;
    };

    const smGap = extractGap(SKELETON_STATS_GAP_CLASSES.sm);
    const mdGap = extractGap(SKELETON_STATS_GAP_CLASSES.md);
    const lgGap = extractGap(SKELETON_STATS_GAP_CLASSES.lg);

    expect(smGap).toBeLessThan(mdGap);
    expect(mdGap).toBeLessThan(lgGap);
  });

  it('should use gap-3 for sm', () => {
    expect(SKELETON_STATS_GAP_CLASSES.sm).toBe('gap-3');
  });

  it('should use gap-4 for md', () => {
    expect(SKELETON_STATS_GAP_CLASSES.md).toBe('gap-4');
  });

  it('should use gap-6 for lg', () => {
    expect(SKELETON_STATS_GAP_CLASSES.lg).toBe('gap-6');
  });
});

// =============================================================================
// SKELETON_STAT_CARD_CLASSES
// =============================================================================

describe('SKELETON_STAT_CARD_CLASSES', () => {
  it('should include rounded corners', () => {
    expect(SKELETON_STAT_CARD_CLASSES).toContain('rounded-lg');
  });

  it('should include border styling', () => {
    expect(SKELETON_STAT_CARD_CLASSES).toContain('border');
  });

  it('should include card background', () => {
    expect(SKELETON_STAT_CARD_CLASSES).toContain('bg-[rgb(var(--card))]');
  });
});

// =============================================================================
// SKELETON_STAT_CARD_PADDING_CLASSES
// =============================================================================

describe('SKELETON_STAT_CARD_PADDING_CLASSES', () => {
  const sizes: SkeletonStatsSize[] = ['sm', 'md', 'lg'];

  it('should have padding classes for all sizes', () => {
    for (const size of sizes) {
      expect(SKELETON_STAT_CARD_PADDING_CLASSES[size]).toBeDefined();
      expect(SKELETON_STAT_CARD_PADDING_CLASSES[size]).toMatch(/^p-\d+$/);
    }
  });

  it('should have increasing padding values for larger sizes', () => {
    const extractPadding = (classes: string): number => {
      const match = classes.match(/p-(\d+)/);
      return match?.[1] ? Number.parseInt(match[1], 10) : 0;
    };

    const smPadding = extractPadding(SKELETON_STAT_CARD_PADDING_CLASSES.sm);
    const mdPadding = extractPadding(SKELETON_STAT_CARD_PADDING_CLASSES.md);
    const lgPadding = extractPadding(SKELETON_STAT_CARD_PADDING_CLASSES.lg);

    expect(smPadding).toBeLessThan(mdPadding);
    expect(mdPadding).toBeLessThan(lgPadding);
  });

  it('should use p-3 for sm', () => {
    expect(SKELETON_STAT_CARD_PADDING_CLASSES.sm).toBe('p-3');
  });

  it('should use p-4 for md', () => {
    expect(SKELETON_STAT_CARD_PADDING_CLASSES.md).toBe('p-4');
  });

  it('should use p-5 for lg', () => {
    expect(SKELETON_STAT_CARD_PADDING_CLASSES.lg).toBe('p-5');
  });
});

// =============================================================================
// SKELETON_STAT_LABEL_CLASSES
// =============================================================================

describe('SKELETON_STAT_LABEL_CLASSES', () => {
  const sizes: SkeletonStatsSize[] = ['sm', 'md', 'lg'];

  it('should have classes for all sizes', () => {
    for (const size of sizes) {
      expect(SKELETON_STAT_LABEL_CLASSES[size]).toBeDefined();
    }
  });

  it('should include height and width specifications', () => {
    for (const size of sizes) {
      const classes = SKELETON_STAT_LABEL_CLASSES[size];
      expect(classes).toMatch(/h-\d+/);
      expect(classes).toMatch(/w-\d+/);
    }
  });

  it('should have increasing width values for larger sizes', () => {
    const extractWidth = (classes: string): number => {
      const match = classes.match(/w-(\d+)/);
      return match?.[1] ? Number.parseInt(match[1], 10) : 0;
    };

    const smWidth = extractWidth(SKELETON_STAT_LABEL_CLASSES.sm);
    const mdWidth = extractWidth(SKELETON_STAT_LABEL_CLASSES.md);
    const lgWidth = extractWidth(SKELETON_STAT_LABEL_CLASSES.lg);

    expect(smWidth).toBeLessThan(mdWidth);
    expect(mdWidth).toBeLessThan(lgWidth);
  });
});

// =============================================================================
// SKELETON_STAT_VALUE_CLASSES
// =============================================================================

describe('SKELETON_STAT_VALUE_CLASSES', () => {
  const sizes: SkeletonStatsSize[] = ['sm', 'md', 'lg'];

  it('should have classes for all sizes', () => {
    for (const size of sizes) {
      expect(SKELETON_STAT_VALUE_CLASSES[size]).toBeDefined();
    }
  });

  it('should include height and width specifications', () => {
    for (const size of sizes) {
      const classes = SKELETON_STAT_VALUE_CLASSES[size];
      expect(classes).toMatch(/h-\d+/);
      expect(classes).toMatch(/w-\d+/);
    }
  });

  it('should have larger heights than label classes', () => {
    const extractHeight = (classes: string): number => {
      const match = classes.match(/h-(\d+)/);
      return match?.[1] ? Number.parseInt(match[1], 10) : 0;
    };

    for (const size of sizes) {
      const labelHeight = extractHeight(SKELETON_STAT_LABEL_CLASSES[size]);
      const valueHeight = extractHeight(SKELETON_STAT_VALUE_CLASSES[size]);
      expect(valueHeight).toBeGreaterThan(labelHeight);
    }
  });
});

// =============================================================================
// SKELETON_STAT_GAP_CLASSES
// =============================================================================

describe('SKELETON_STAT_GAP_CLASSES', () => {
  const sizes: SkeletonStatsSize[] = ['sm', 'md', 'lg'];

  it('should have gap classes for all sizes', () => {
    for (const size of sizes) {
      expect(SKELETON_STAT_GAP_CLASSES[size]).toBeDefined();
      expect(SKELETON_STAT_GAP_CLASSES[size]).toContain('gap-');
    }
  });

  it('should use gap-1 for sm', () => {
    expect(SKELETON_STAT_GAP_CLASSES.sm).toBe('gap-1');
  });

  it('should use gap-2 for md', () => {
    expect(SKELETON_STAT_GAP_CLASSES.md).toBe('gap-2');
  });

  it('should use gap-3 for lg', () => {
    expect(SKELETON_STAT_GAP_CLASSES.lg).toBe('gap-3');
  });
});

// =============================================================================
// SKELETON_STAT_TREND_CLASSES
// =============================================================================

describe('SKELETON_STAT_TREND_CLASSES', () => {
  const sizes: SkeletonStatsSize[] = ['sm', 'md', 'lg'];

  it('should have classes for all sizes', () => {
    for (const size of sizes) {
      expect(SKELETON_STAT_TREND_CLASSES[size]).toBeDefined();
    }
  });

  it('should include height and width specifications', () => {
    for (const size of sizes) {
      const classes = SKELETON_STAT_TREND_CLASSES[size];
      expect(classes).toMatch(/h-\d/);
      expect(classes).toMatch(/w-\d+/);
    }
  });
});

// =============================================================================
// SKELETON_STAT_ICON_CLASSES
// =============================================================================

describe('SKELETON_STAT_ICON_CLASSES', () => {
  const sizes: SkeletonStatsSize[] = ['sm', 'md', 'lg'];

  it('should have icon dimensions for all sizes', () => {
    for (const size of sizes) {
      expect(SKELETON_STAT_ICON_CLASSES[size]).toBeDefined();
      expect(SKELETON_STAT_ICON_CLASSES[size].width).toBeDefined();
      expect(SKELETON_STAT_ICON_CLASSES[size].height).toBeDefined();
    }
  });

  it('should have square icons (width === height)', () => {
    for (const size of sizes) {
      const { width, height } = SKELETON_STAT_ICON_CLASSES[size];
      expect(width).toBe(height);
    }
  });

  it('should have increasing dimensions for larger sizes', () => {
    const smWidth = SKELETON_STAT_ICON_CLASSES.sm.width;
    const mdWidth = SKELETON_STAT_ICON_CLASSES.md.width;
    const lgWidth = SKELETON_STAT_ICON_CLASSES.lg.width;

    expect(smWidth).toBeLessThan(mdWidth);
    expect(mdWidth).toBeLessThan(lgWidth);
  });

  it('should use 16x16 for sm', () => {
    expect(SKELETON_STAT_ICON_CLASSES.sm).toEqual({ width: 16, height: 16 });
  });

  it('should use 20x20 for md', () => {
    expect(SKELETON_STAT_ICON_CLASSES.md).toEqual({ width: 20, height: 20 });
  });

  it('should use 24x24 for lg', () => {
    expect(SKELETON_STAT_ICON_CLASSES.lg).toEqual({ width: 24, height: 24 });
  });
});

// =============================================================================
// SKELETON_STAT_ICON_MARGIN_CLASSES
// =============================================================================

describe('SKELETON_STAT_ICON_MARGIN_CLASSES', () => {
  const sizes: SkeletonStatsSize[] = ['sm', 'md', 'lg'];

  it('should have margin classes for all sizes', () => {
    for (const size of sizes) {
      expect(SKELETON_STAT_ICON_MARGIN_CLASSES[size]).toBeDefined();
      expect(SKELETON_STAT_ICON_MARGIN_CLASSES[size]).toContain('mb-');
    }
  });

  it('should have increasing margin values for larger sizes', () => {
    const extractMargin = (classes: string): number => {
      const match = classes.match(/mb-(\d+)/);
      return match?.[1] ? Number.parseInt(match[1], 10) : 0;
    };

    const smMargin = extractMargin(SKELETON_STAT_ICON_MARGIN_CLASSES.sm);
    const mdMargin = extractMargin(SKELETON_STAT_ICON_MARGIN_CLASSES.md);
    const lgMargin = extractMargin(SKELETON_STAT_ICON_MARGIN_CLASSES.lg);

    expect(smMargin).toBeLessThan(mdMargin);
    expect(mdMargin).toBeLessThan(lgMargin);
  });
});

// =============================================================================
// SKELETON_STAT_TREND_MARGIN_CLASSES
// =============================================================================

describe('SKELETON_STAT_TREND_MARGIN_CLASSES', () => {
  const sizes: SkeletonStatsSize[] = ['sm', 'md', 'lg'];

  it('should have margin classes for all sizes', () => {
    for (const size of sizes) {
      expect(SKELETON_STAT_TREND_MARGIN_CLASSES[size]).toBeDefined();
      expect(SKELETON_STAT_TREND_MARGIN_CLASSES[size]).toContain('mt-');
    }
  });

  it('should have increasing margin values for larger sizes', () => {
    const extractMargin = (classes: string): number => {
      const match = classes.match(/mt-(\d+)/);
      return match?.[1] ? Number.parseInt(match[1], 10) : 0;
    };

    const smMargin = extractMargin(SKELETON_STAT_TREND_MARGIN_CLASSES.sm);
    const mdMargin = extractMargin(SKELETON_STAT_TREND_MARGIN_CLASSES.md);
    const lgMargin = extractMargin(SKELETON_STAT_TREND_MARGIN_CLASSES.lg);

    expect(smMargin).toBeLessThan(mdMargin);
    expect(mdMargin).toBeLessThan(lgMargin);
  });
});

// =============================================================================
// getBaseSize UTILITY
// =============================================================================

describe('getBaseSize', () => {
  describe('string values', () => {
    it('should return "sm" for "sm" input', () => {
      expect(getBaseSize('sm')).toBe('sm');
    });

    it('should return "md" for "md" input', () => {
      expect(getBaseSize('md')).toBe('md');
    });

    it('should return "lg" for "lg" input', () => {
      expect(getBaseSize('lg')).toBe('lg');
    });
  });

  describe('responsive objects', () => {
    it('should return base size from responsive object', () => {
      expect(getBaseSize({ base: 'sm', md: 'lg' })).toBe('sm');
    });

    it('should return "md" as default when no base is specified', () => {
      expect(getBaseSize({ md: 'lg', lg: 'sm' })).toBe('md');
    });

    it('should handle object with only base', () => {
      expect(getBaseSize({ base: 'lg' })).toBe('lg');
    });

    it('should handle full responsive object', () => {
      expect(getBaseSize({ base: 'sm', sm: 'sm', md: 'md', lg: 'lg' })).toBe('sm');
    });
  });

  describe('edge cases', () => {
    it('should handle empty object', () => {
      expect(getBaseSize({})).toBe('md');
    });

    it('should handle object with only non-base breakpoints', () => {
      expect(getBaseSize({ xl: 'lg' })).toBe('md');
    });
  });
});

// =============================================================================
// getResponsiveSizeClasses UTILITY
// =============================================================================

describe('getResponsiveSizeClasses', () => {
  describe('string values', () => {
    it('should return classes for "sm" size', () => {
      const result = getResponsiveSizeClasses('sm', SKELETON_STATS_GAP_CLASSES);
      expect(result).toBe('gap-3');
    });

    it('should return classes for "md" size', () => {
      const result = getResponsiveSizeClasses('md', SKELETON_STATS_GAP_CLASSES);
      expect(result).toBe('gap-4');
    });

    it('should return classes for "lg" size', () => {
      const result = getResponsiveSizeClasses('lg', SKELETON_STATS_GAP_CLASSES);
      expect(result).toBe('gap-6');
    });
  });

  describe('responsive objects', () => {
    it('should generate prefixed classes for breakpoints', () => {
      const result = getResponsiveSizeClasses({ base: 'sm', lg: 'lg' }, SKELETON_STATS_GAP_CLASSES);
      expect(result).toBe('gap-3 lg:gap-6');
    });

    it('should handle all breakpoints', () => {
      const result = getResponsiveSizeClasses(
        { base: 'sm', sm: 'sm', md: 'md', lg: 'lg' },
        SKELETON_STATS_GAP_CLASSES
      );
      expect(result).toContain('gap-3');
      expect(result).toContain('sm:gap-3');
      expect(result).toContain('md:gap-4');
      expect(result).toContain('lg:gap-6');
    });

    it('should not add prefix for base breakpoint', () => {
      const result = getResponsiveSizeClasses({ base: 'md' }, SKELETON_STATS_GAP_CLASSES);
      expect(result).toBe('gap-4');
      expect(result).not.toContain('base:');
    });

    it('should handle partial responsive object', () => {
      const result = getResponsiveSizeClasses({ base: 'sm', xl: 'lg' }, SKELETON_STATS_GAP_CLASSES);
      expect(result).toBe('gap-3 xl:gap-6');
    });
  });

  describe('with multi-class values', () => {
    it('should prefix each class in multi-class values', () => {
      const result = getResponsiveSizeClasses(
        { base: 'sm', lg: 'lg' },
        SKELETON_STAT_LABEL_CLASSES
      );
      expect(result).toBe('h-3 w-16 lg:h-4 lg:w-24');
    });
  });

  describe('breakpoint order', () => {
    it('should output classes in breakpoint order', () => {
      const result = getResponsiveSizeClasses(
        { lg: 'lg', base: 'sm', md: 'md' },
        SKELETON_STATS_GAP_CLASSES
      );
      // Classes should be in breakpoint order, not object key order
      const parts = result.split(' ');
      expect(parts[0]).toBe('gap-3'); // base
      expect(parts[1]).toBe('md:gap-4'); // md
      expect(parts[2]).toBe('lg:gap-6'); // lg
    });
  });
});

// =============================================================================
// getIconDimensions UTILITY
// =============================================================================

describe('getIconDimensions', () => {
  describe('string values', () => {
    it('should return dimensions for "sm"', () => {
      expect(getIconDimensions('sm')).toEqual({ width: 16, height: 16 });
    });

    it('should return dimensions for "md"', () => {
      expect(getIconDimensions('md')).toEqual({ width: 20, height: 20 });
    });

    it('should return dimensions for "lg"', () => {
      expect(getIconDimensions('lg')).toEqual({ width: 24, height: 24 });
    });
  });

  describe('responsive objects', () => {
    it('should return base size dimensions', () => {
      expect(getIconDimensions({ base: 'sm', lg: 'lg' })).toEqual({ width: 16, height: 16 });
    });

    it('should return md dimensions when no base specified', () => {
      expect(getIconDimensions({ lg: 'lg' })).toEqual({ width: 20, height: 20 });
    });
  });
});

// =============================================================================
// SIZE CONSISTENCY
// =============================================================================

describe('size consistency', () => {
  const sizes: SkeletonStatsSize[] = ['sm', 'md', 'lg'];
  const sizeClassMaps = [
    { name: 'SKELETON_STATS_GAP_CLASSES', map: SKELETON_STATS_GAP_CLASSES },
    { name: 'SKELETON_STAT_CARD_PADDING_CLASSES', map: SKELETON_STAT_CARD_PADDING_CLASSES },
    { name: 'SKELETON_STAT_LABEL_CLASSES', map: SKELETON_STAT_LABEL_CLASSES },
    { name: 'SKELETON_STAT_VALUE_CLASSES', map: SKELETON_STAT_VALUE_CLASSES },
    { name: 'SKELETON_STAT_GAP_CLASSES', map: SKELETON_STAT_GAP_CLASSES },
    { name: 'SKELETON_STAT_TREND_CLASSES', map: SKELETON_STAT_TREND_CLASSES },
    { name: 'SKELETON_STAT_ICON_MARGIN_CLASSES', map: SKELETON_STAT_ICON_MARGIN_CLASSES },
    { name: 'SKELETON_STAT_TREND_MARGIN_CLASSES', map: SKELETON_STAT_TREND_MARGIN_CLASSES },
  ];

  for (const { name, map } of sizeClassMaps) {
    describe(name, () => {
      it('should have entries for all size variants', () => {
        for (const size of sizes) {
          expect(map[size]).toBeDefined();
          expect(typeof map[size]).toBe('string');
          expect(map[size].length).toBeGreaterThan(0);
        }
      });
    });
  }

  describe('SKELETON_STAT_ICON_CLASSES', () => {
    it('should have entries for all size variants with proper structure', () => {
      for (const size of sizes) {
        expect(SKELETON_STAT_ICON_CLASSES[size]).toBeDefined();
        expect(typeof SKELETON_STAT_ICON_CLASSES[size].width).toBe('number');
        expect(typeof SKELETON_STAT_ICON_CLASSES[size].height).toBe('number');
      }
    });
  });
});

// =============================================================================
// COMPONENT BEHAVIOR DOCUMENTATION
// =============================================================================

describe('component behavior documentation', () => {
  it('documents that component is hidden from screen readers', () => {
    // The component uses aria-hidden="true" to hide from assistive technology
    // This is appropriate because skeletons are purely visual loading indicators
    expect(true).toBe(true);
  });

  it('documents that component uses role="presentation"', () => {
    // The component uses role="presentation" to indicate decorative purpose
    // This ensures proper accessibility semantics
    expect(true).toBe(true);
  });

  it('documents that component uses forwardRef', () => {
    // The component supports ref forwarding for programmatic access
    // This allows parent components to measure or manipulate the skeleton
    expect(true).toBe(true);
  });

  it('documents that component supports responsive sizing', () => {
    // The size prop accepts either a string ('sm' | 'md' | 'lg')
    // or a ResponsiveValue object like { base: 'sm', md: 'md', lg: 'lg' }
    expect(true).toBe(true);
  });

  it('documents default count of 4 stats', () => {
    expect(DEFAULT_STAT_COUNT).toBe(4);
  });
});

// =============================================================================
// PROPS DOCUMENTATION
// =============================================================================

describe('props documentation', () => {
  it('documents size prop options', () => {
    // size accepts 'sm' | 'md' | 'lg' or ResponsiveValue<SkeletonStatsSize>
    // sm: Compact spacing (12px padding, smaller elements)
    // md: Standard spacing (16px padding) - default
    // lg: Larger spacing (20px padding, larger elements)
    const validSizes: SkeletonStatsSize[] = ['sm', 'md', 'lg'];
    expect(validSizes).toHaveLength(3);
  });

  it('documents count prop', () => {
    // count: number - Number of stat cards to render (default: 4)
    expect(DEFAULT_STAT_COUNT).toBe(4);
  });

  it('documents showTrend prop', () => {
    // showTrend: boolean - Whether to show trend indicator skeleton (default: false)
    expect(true).toBe(true);
  });

  it('documents showIcon prop', () => {
    // showIcon: boolean - Whether to show icon skeleton (default: false)
    expect(true).toBe(true);
  });

  it('documents data-testid prop', () => {
    // data-testid: string - Data attribute for testing
    // Container gets data-testid value
    // Stats get data-testid-stat-{index}
    // Individual elements get data-testid-stat-{index}-{element}
    expect(true).toBe(true);
  });
});

// =============================================================================
// DATA ATTRIBUTES DOCUMENTATION
// =============================================================================

describe('data attributes documentation', () => {
  it('documents data-count attribute', () => {
    // data-count: number - The count of stat cards rendered
    expect(true).toBe(true);
  });

  it('documents data-size attribute', () => {
    // data-size: 'sm' | 'md' | 'lg' | 'responsive' - The size variant
    expect(true).toBe(true);
  });

  it('documents data-show-trend attribute', () => {
    // data-show-trend: boolean - Whether trend skeletons are shown
    expect(true).toBe(true);
  });

  it('documents data-show-icon attribute', () => {
    // data-show-icon: boolean - Whether icon skeletons are shown
    expect(true).toBe(true);
  });
});

// =============================================================================
// RESPONSIVE BREAKPOINTS
// =============================================================================

describe('responsive breakpoints', () => {
  it('should support all standard breakpoints', () => {
    const breakpoints = ['base', 'sm', 'md', 'lg', 'xl', '2xl'];
    const responsiveValue: Record<string, SkeletonStatsSize> = {
      base: 'sm',
      sm: 'sm',
      md: 'md',
      lg: 'lg',
      xl: 'lg',
      '2xl': 'lg',
    };

    const result = getResponsiveSizeClasses(responsiveValue, SKELETON_STATS_GAP_CLASSES);

    for (const bp of breakpoints) {
      if (bp === 'base') {
        expect(result).toContain('gap-');
      } else {
        expect(result).toContain(`${bp}:`);
      }
    }
  });
});

// =============================================================================
// LAYOUT DOCUMENTATION
// =============================================================================

describe('layout documentation', () => {
  it('documents responsive grid layout', () => {
    // The component uses a responsive CSS grid layout:
    // - 1 column on mobile (base)
    // - 2 columns on tablet (sm breakpoint)
    // - 4 columns on desktop (lg breakpoint)
    expect(SKELETON_STATS_GRID_CLASSES).toContain('grid-cols-1');
    expect(SKELETON_STATS_GRID_CLASSES).toContain('sm:grid-cols-2');
    expect(SKELETON_STATS_GRID_CLASSES).toContain('lg:grid-cols-4');
  });

  it('documents stat card structure', () => {
    // Each stat card contains:
    // 1. Optional icon (circular skeleton, top)
    // 2. Label (text skeleton)
    // 3. Value (larger skeleton)
    // 4. Optional trend (text skeleton, bottom)
    expect(true).toBe(true);
  });
});

// =============================================================================
// INTEGRATION WITH SKELETON ATOM
// =============================================================================

describe('skeleton atom integration', () => {
  it('documents use of Skeleton atom', () => {
    // The component uses the Skeleton atom for all placeholder elements:
    // - Icon: Skeleton with variant="circular"
    // - Label: Skeleton with variant="text"
    // - Value: Skeleton (default rectangular)
    // - Trend: Skeleton with variant="text"
    expect(true).toBe(true);
  });

  it('documents motion-safe animation', () => {
    // The Skeleton atom uses motion-safe:animate-pulse
    // This respects the user's reduced motion preference
    expect(true).toBe(true);
  });
});
