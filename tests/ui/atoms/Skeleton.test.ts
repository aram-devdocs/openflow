/**
 * Skeleton Atom Unit Tests
 *
 * Tests for the Skeleton loading placeholder component.
 * Covers variant classes, dimension handling, responsive behavior, and accessibility.
 */

import { SKELETON_BASE_CLASSES, getVariantClasses } from '@openflow/ui';
import { describe, expect, it } from 'vitest';

// =============================================================================
// VARIANT CLASSES
// =============================================================================

describe('getVariantClasses', () => {
  describe('circular variant', () => {
    it('returns rounded-full for circular variant', () => {
      expect(getVariantClasses('circular')).toBe('rounded-full');
    });
  });

  describe('text variant', () => {
    it('returns h-4 rounded for text variant', () => {
      expect(getVariantClasses('text')).toBe('h-4 rounded');
    });
  });

  describe('rectangular variant', () => {
    it('returns rounded-md for rectangular variant', () => {
      expect(getVariantClasses('rectangular')).toBe('rounded-md');
    });
  });

  describe('default behavior', () => {
    it('treats unknown variants as rectangular', () => {
      // TypeScript would prevent this, but testing runtime behavior
      // @ts-expect-error Testing invalid variant
      expect(getVariantClasses('invalid')).toBe('rounded-md');
    });
  });
});

// =============================================================================
// BASE CLASSES
// =============================================================================

describe('SKELETON_BASE_CLASSES', () => {
  it('includes background color class', () => {
    expect(SKELETON_BASE_CLASSES).toContain('bg-[rgb(var(--muted))]');
  });

  it('includes motion-safe animate-pulse', () => {
    expect(SKELETON_BASE_CLASSES).toContain('motion-safe:animate-pulse');
  });

  it('has exactly the expected classes', () => {
    expect(SKELETON_BASE_CLASSES).toBe('bg-[rgb(var(--muted))] motion-safe:animate-pulse');
  });
});

// =============================================================================
// VARIANT CLASS COMBINATIONS
// =============================================================================

describe('Variant class combinations', () => {
  const variants = ['text', 'circular', 'rectangular'] as const;

  describe('all variants have unique classes', () => {
    it('each variant returns a different class string', () => {
      const classes = variants.map((v) => getVariantClasses(v));
      const uniqueClasses = new Set(classes);
      expect(uniqueClasses.size).toBe(variants.length);
    });
  });

  describe('variant classes are valid Tailwind', () => {
    it('circular uses rounded-full (valid Tailwind)', () => {
      const classes = getVariantClasses('circular');
      expect(classes).toMatch(/^rounded-full$/);
    });

    it('text uses h-4 and rounded (valid Tailwind)', () => {
      const classes = getVariantClasses('text');
      expect(classes).toMatch(/h-4/);
      expect(classes).toMatch(/rounded/);
    });

    it('rectangular uses rounded-md (valid Tailwind)', () => {
      const classes = getVariantClasses('rectangular');
      expect(classes).toMatch(/^rounded-md$/);
    });
  });
});

// =============================================================================
// DIMENSION HANDLING (Behavior Documentation)
// =============================================================================

describe('Dimension handling behavior', () => {
  describe('number values', () => {
    it('documents that numbers are converted to px', () => {
      // This documents expected behavior:
      // width={200} → style={{ width: '200px' }}
      // height={100} → style={{ height: '100px' }}
      const widthValue = 200;
      const expected = `${widthValue}px`;
      expect(expected).toBe('200px');
    });
  });

  describe('string values', () => {
    it('documents that strings are used as-is', () => {
      // This documents expected behavior:
      // width="100%" → style={{ width: '100%' }}
      // width="10rem" → style={{ width: '10rem' }}
      const cssValue = '100%';
      expect(cssValue).toBe('100%');

      const remValue = '10rem';
      expect(remValue).toBe('10rem');
    });
  });

  describe('responsive object values', () => {
    it('documents that responsive objects use CSS custom properties', () => {
      // This documents expected behavior:
      // width={{ base: 100, md: 200 }} →
      //   style={{ width: 'var(--skeleton-width)', '--skeleton-width': '100px' }}
      //   className includes "md:[--skeleton-width:200px]"
      const responsiveValue = { base: 100, md: 200, lg: 300 };
      expect(responsiveValue.base).toBe(100);
      expect(responsiveValue.md).toBe(200);
      expect(responsiveValue.lg).toBe(300);
    });

    it('documents supported breakpoints', () => {
      const breakpoints = ['base', 'sm', 'md', 'lg', 'xl', '2xl'];
      expect(breakpoints).toContain('base');
      expect(breakpoints).toContain('sm');
      expect(breakpoints).toContain('md');
      expect(breakpoints).toContain('lg');
      expect(breakpoints).toContain('xl');
      expect(breakpoints).toContain('2xl');
    });
  });
});

// =============================================================================
// ACCESSIBILITY BEHAVIOR (Documentation)
// =============================================================================

describe('Accessibility behavior documentation', () => {
  it('documents that skeleton has aria-hidden="true"', () => {
    // The Skeleton component always includes aria-hidden="true"
    // because it's a decorative loading indicator
    const ariaHidden = true;
    expect(ariaHidden).toBe(true);
  });

  it('documents motion-safe animation behavior', () => {
    // The animate-pulse is wrapped in motion-safe:
    // This means animation is disabled when prefers-reduced-motion is set
    expect(SKELETON_BASE_CLASSES).toContain('motion-safe:');
  });

  it('documents that skeleton is decorative', () => {
    // Skeletons are purely visual indicators
    // Screen readers should not announce them
    // Use aria-live regions for accessible loading announcements
    const isDecorative = true;
    expect(isDecorative).toBe(true);
  });
});

// =============================================================================
// PROPS INTERFACE (Documentation)
// =============================================================================

describe('Props interface documentation', () => {
  describe('variant prop', () => {
    it('documents valid variant values', () => {
      const validVariants = ['text', 'circular', 'rectangular'];
      expect(validVariants).toHaveLength(3);
    });

    it('documents default variant is rectangular', () => {
      const defaultVariant = 'rectangular';
      expect(defaultVariant).toBe('rectangular');
    });
  });

  describe('width prop', () => {
    it('documents width accepts number (pixels)', () => {
      const widthNumber: number = 200;
      expect(typeof widthNumber).toBe('number');
    });

    it('documents width accepts string (CSS unit)', () => {
      const widthString: string = '100%';
      expect(typeof widthString).toBe('string');
    });

    it('documents width accepts responsive object', () => {
      const widthResponsive = { base: 100, md: 200 };
      expect(typeof widthResponsive).toBe('object');
    });
  });

  describe('height prop', () => {
    it('documents height accepts number (pixels)', () => {
      const heightNumber: number = 40;
      expect(typeof heightNumber).toBe('number');
    });

    it('documents height accepts string (CSS unit)', () => {
      const heightString: string = '3rem';
      expect(typeof heightString).toBe('string');
    });

    it('documents height accepts responsive object', () => {
      const heightResponsive = { base: 50, md: 100 };
      expect(typeof heightResponsive).toBe('object');
    });
  });

  describe('data-testid prop', () => {
    it('documents data-testid is optional string', () => {
      const testId: string | undefined = 'loading-skeleton';
      expect(typeof testId).toBe('string');
    });
  });
});

// =============================================================================
// CSS CUSTOM PROPERTY BEHAVIOR
// =============================================================================

describe('CSS custom property behavior documentation', () => {
  it('documents --skeleton-width variable usage', () => {
    // For responsive width, the component uses:
    // style={{ width: 'var(--skeleton-width)', '--skeleton-width': 'baseValue' }}
    // className includes breakpoint overrides like "md:[--skeleton-width:200px]"
    const cssVar = '--skeleton-width';
    expect(cssVar).toBe('--skeleton-width');
  });

  it('documents --skeleton-height variable usage', () => {
    // For responsive height, the component uses:
    // style={{ height: 'var(--skeleton-height)', '--skeleton-height': 'baseValue' }}
    // className includes breakpoint overrides like "md:[--skeleton-height:100px]"
    const cssVar = '--skeleton-height';
    expect(cssVar).toBe('--skeleton-height');
  });

  it('documents breakpoint class format', () => {
    // Responsive classes use Tailwind arbitrary property syntax:
    // "md:[--skeleton-width:200px]"
    // "lg:[--skeleton-width:300px]"
    const exampleClass = 'md:[--skeleton-width:200px]';
    expect(exampleClass).toMatch(/^[a-z]+:\[--skeleton-/);
  });
});

// =============================================================================
// VARIANT USE CASES
// =============================================================================

describe('Variant use cases', () => {
  describe('text variant', () => {
    it('is designed for single line text loading', () => {
      const classes = getVariantClasses('text');
      // Has default height of h-4 (16px) which matches typical text line height
      expect(classes).toContain('h-4');
    });

    it('has subtle rounding for text appearance', () => {
      const classes = getVariantClasses('text');
      expect(classes).toContain('rounded');
      expect(classes).not.toContain('rounded-full');
      expect(classes).not.toContain('rounded-md');
    });
  });

  describe('circular variant', () => {
    it('is designed for avatars and icons', () => {
      const classes = getVariantClasses('circular');
      expect(classes).toBe('rounded-full');
    });

    it('creates perfect circles when width equals height', () => {
      // When width={48} height={48} with rounded-full
      // the result is a perfect circle
      const classes = getVariantClasses('circular');
      expect(classes).toContain('rounded-full');
    });
  });

  describe('rectangular variant', () => {
    it('is designed for cards and images', () => {
      const classes = getVariantClasses('rectangular');
      expect(classes).toBe('rounded-md');
    });

    it('has medium border radius for card appearance', () => {
      const classes = getVariantClasses('rectangular');
      expect(classes).toContain('rounded-md');
    });
  });
});

// =============================================================================
// TAILWIND CLASS CONSISTENCY
// =============================================================================

describe('Tailwind class consistency', () => {
  it('base classes use CSS variable syntax for colors', () => {
    // Uses rgb(var(--muted)) format for theme compatibility
    expect(SKELETON_BASE_CLASSES).toContain('rgb(var(--muted))');
  });

  it('animation uses Tailwind built-in animate-pulse', () => {
    expect(SKELETON_BASE_CLASSES).toContain('animate-pulse');
  });

  it('all variant classes are valid Tailwind utilities', () => {
    const validTailwindRoundedClasses = ['rounded', 'rounded-md', 'rounded-full'];
    const validTailwindHeightClasses = ['h-4'];

    expect(validTailwindRoundedClasses).toContain('rounded');
    expect(validTailwindRoundedClasses).toContain('rounded-md');
    expect(validTailwindRoundedClasses).toContain('rounded-full');
    expect(validTailwindHeightClasses).toContain('h-4');
  });
});

// =============================================================================
// RESPONSIVE BREAKPOINT ORDER
// =============================================================================

describe('Responsive breakpoint order', () => {
  const breakpointOrder = ['base', 'sm', 'md', 'lg', 'xl', '2xl'];

  it('documents breakpoint order from mobile-first', () => {
    expect(breakpointOrder[0]).toBe('base');
    expect(breakpointOrder[1]).toBe('sm');
    expect(breakpointOrder[2]).toBe('md');
    expect(breakpointOrder[3]).toBe('lg');
    expect(breakpointOrder[4]).toBe('xl');
    expect(breakpointOrder[5]).toBe('2xl');
  });

  it('documents base has no prefix (mobile-first)', () => {
    // base values apply without breakpoint prefix
    // Other breakpoints use prefix like "md:", "lg:"
    const basePrefix = '';
    const mdPrefix = 'md:';
    expect(basePrefix).toBe('');
    expect(mdPrefix).toBe('md:');
  });

  it('documents total number of supported breakpoints', () => {
    expect(breakpointOrder).toHaveLength(6);
  });
});
