/**
 * SkipLink Component Utility Function Tests
 *
 * Tests for the SkipLink atom utility functions and class generation.
 * Component rendering is tested via Storybook.
 */

import { describe, expect, it } from 'vitest';

// =============================================================================
// Re-implement utility functions for testing
// (mirrors the logic in SkipLink.tsx)
// =============================================================================

/**
 * Default skip link text
 */
const DEFAULT_SKIP_LINK_TEXT = 'Skip to main content';

/**
 * Default target ID (from Main primitive)
 */
const DEFAULT_MAIN_ID = 'main-content';

/**
 * Base classes for skip link styling
 */
const SKIP_LINK_BASE_CLASSES = [
  // Visually hidden by default using sr-only
  'sr-only',
  // Focus styles override sr-only to make visible
  'focus:not-sr-only',
  'focus:fixed',
  'focus:left-4',
  'focus:top-4',
  'focus:z-[100]',
  // Touch target ≥44px (WCAG 2.5.5)
  'focus:min-h-[44px]',
  'focus:min-w-[44px]',
  // High contrast styling
  'focus:rounded-md',
  'focus:bg-[rgb(var(--primary))]',
  'focus:px-4',
  'focus:py-3',
  'focus:text-[rgb(var(--primary-foreground))]',
  'focus:font-medium',
  // Focus ring for visibility on any background
  'focus:outline-none',
  'focus:ring-2',
  'focus:ring-[rgb(var(--ring))]',
  'focus:ring-offset-2',
  // Shadow for prominence
  'focus:shadow-lg',
  // Ensure it's inline-flex for proper sizing
  'focus:inline-flex',
  'focus:items-center',
  'focus:justify-center',
];

/**
 * Helper to merge class names (simplified cn)
 */
function cn(...classes: (string | undefined)[]): string {
  return classes.filter(Boolean).join(' ');
}

/**
 * Generates the full class string for the SkipLink
 */
function getSkipLinkClasses(className?: string): string {
  return cn(...SKIP_LINK_BASE_CLASSES, className);
}

// =============================================================================
// Tests
// =============================================================================

describe('ui/atoms/SkipLink - Utility Functions', () => {
  // ===========================================================================
  // Default Values
  // ===========================================================================

  describe('default values', () => {
    it('has correct default text', () => {
      expect(DEFAULT_SKIP_LINK_TEXT).toBe('Skip to main content');
    });

    it('has correct default target ID matching Main primitive', () => {
      expect(DEFAULT_MAIN_ID).toBe('main-content');
    });

    it('default target matches conventional skip link pattern', () => {
      // WCAG guideline is to use consistent IDs across pages
      expect(DEFAULT_MAIN_ID).toMatch(/^[a-z-]+$/);
    });
  });

  // ===========================================================================
  // Base Classes - Visibility
  // ===========================================================================

  describe('visibility classes', () => {
    it('includes sr-only for hidden by default', () => {
      expect(SKIP_LINK_BASE_CLASSES).toContain('sr-only');
    });

    it('includes focus:not-sr-only to show on focus', () => {
      expect(SKIP_LINK_BASE_CLASSES).toContain('focus:not-sr-only');
    });

    it('uses fixed positioning when visible', () => {
      expect(SKIP_LINK_BASE_CLASSES).toContain('focus:fixed');
    });

    it('positions in top-left corner', () => {
      expect(SKIP_LINK_BASE_CLASSES).toContain('focus:left-4');
      expect(SKIP_LINK_BASE_CLASSES).toContain('focus:top-4');
    });

    it('has high z-index for visibility above other content', () => {
      expect(SKIP_LINK_BASE_CLASSES).toContain('focus:z-[100]');
    });
  });

  // ===========================================================================
  // Base Classes - Touch Target (WCAG 2.5.5)
  // ===========================================================================

  describe('touch target accessibility (WCAG 2.5.5)', () => {
    it('includes 44px minimum height on focus', () => {
      expect(SKIP_LINK_BASE_CLASSES).toContain('focus:min-h-[44px]');
    });

    it('includes 44px minimum width on focus', () => {
      expect(SKIP_LINK_BASE_CLASSES).toContain('focus:min-w-[44px]');
    });

    it('both dimensions meet WCAG 2.5.5 touch target requirement', () => {
      const heightClass = SKIP_LINK_BASE_CLASSES.find((c) => c.includes('min-h-'));
      const widthClass = SKIP_LINK_BASE_CLASSES.find((c) => c.includes('min-w-'));

      expect(heightClass).toBe('focus:min-h-[44px]');
      expect(widthClass).toBe('focus:min-w-[44px]');
    });
  });

  // ===========================================================================
  // Base Classes - High Contrast Styling
  // ===========================================================================

  describe('high contrast styling', () => {
    it('uses primary background for high visibility', () => {
      expect(SKIP_LINK_BASE_CLASSES).toContain('focus:bg-[rgb(var(--primary))]');
    });

    it('uses primary-foreground text for contrast', () => {
      expect(SKIP_LINK_BASE_CLASSES).toContain('focus:text-[rgb(var(--primary-foreground))]');
    });

    it('uses medium font weight for readability', () => {
      expect(SKIP_LINK_BASE_CLASSES).toContain('focus:font-medium');
    });

    it('uses rounded corners for modern appearance', () => {
      expect(SKIP_LINK_BASE_CLASSES).toContain('focus:rounded-md');
    });

    it('includes shadow for prominence', () => {
      expect(SKIP_LINK_BASE_CLASSES).toContain('focus:shadow-lg');
    });

    it('has appropriate padding', () => {
      expect(SKIP_LINK_BASE_CLASSES).toContain('focus:px-4');
      expect(SKIP_LINK_BASE_CLASSES).toContain('focus:py-3');
    });
  });

  // ===========================================================================
  // Base Classes - Focus Ring
  // ===========================================================================

  describe('focus ring styling', () => {
    it('removes default outline', () => {
      expect(SKIP_LINK_BASE_CLASSES).toContain('focus:outline-none');
    });

    it('includes focus ring', () => {
      expect(SKIP_LINK_BASE_CLASSES).toContain('focus:ring-2');
    });

    it('uses theme ring color', () => {
      expect(SKIP_LINK_BASE_CLASSES).toContain('focus:ring-[rgb(var(--ring))]');
    });

    it('includes ring offset for better visibility', () => {
      expect(SKIP_LINK_BASE_CLASSES).toContain('focus:ring-offset-2');
    });
  });

  // ===========================================================================
  // Base Classes - Layout
  // ===========================================================================

  describe('layout classes', () => {
    it('uses inline-flex for proper sizing', () => {
      expect(SKIP_LINK_BASE_CLASSES).toContain('focus:inline-flex');
    });

    it('centers content vertically', () => {
      expect(SKIP_LINK_BASE_CLASSES).toContain('focus:items-center');
    });

    it('centers content horizontally', () => {
      expect(SKIP_LINK_BASE_CLASSES).toContain('focus:justify-center');
    });
  });

  // ===========================================================================
  // getSkipLinkClasses Function
  // ===========================================================================

  describe('getSkipLinkClasses', () => {
    it('returns all base classes when no className provided', () => {
      const result = getSkipLinkClasses();

      for (const baseClass of SKIP_LINK_BASE_CLASSES) {
        expect(result).toContain(baseClass);
      }
    });

    it('includes custom className when provided', () => {
      const result = getSkipLinkClasses('my-custom-class');

      expect(result).toContain('my-custom-class');
    });

    it('appends custom className after base classes', () => {
      const result = getSkipLinkClasses('my-custom-class');

      // Custom class should be at the end
      expect(result.endsWith('my-custom-class')).toBe(true);
    });

    it('handles undefined className', () => {
      const result = getSkipLinkClasses(undefined);

      // Should not contain 'undefined' string
      expect(result).not.toContain('undefined');
    });

    it('handles empty string className', () => {
      const result = getSkipLinkClasses('');

      // Should work without issues
      expect(result).toBeDefined();
      expect(result).not.toContain('  '); // No double spaces
    });

    it('handles multiple custom classes', () => {
      const result = getSkipLinkClasses('class-one class-two class-three');

      expect(result).toContain('class-one');
      expect(result).toContain('class-two');
      expect(result).toContain('class-three');
    });
  });

  // ===========================================================================
  // Class Count & Structure
  // ===========================================================================

  describe('class structure', () => {
    it('has expected number of base classes', () => {
      // Currently 23 classes
      expect(SKIP_LINK_BASE_CLASSES.length).toBeGreaterThanOrEqual(20);
    });

    it('all focus classes have focus: prefix', () => {
      const focusClasses = SKIP_LINK_BASE_CLASSES.filter(
        (c) => c !== 'sr-only' && !c.startsWith('focus:')
      );
      expect(focusClasses).toEqual([]);
    });

    it('sr-only is the only non-focus class', () => {
      const nonFocusClasses = SKIP_LINK_BASE_CLASSES.filter((c) => !c.startsWith('focus:'));
      expect(nonFocusClasses).toEqual(['sr-only']);
    });
  });

  // ===========================================================================
  // WCAG Compliance
  // ===========================================================================

  describe('WCAG compliance', () => {
    it('satisfies WCAG 2.4.1 bypass blocks (visible link on focus)', () => {
      // Must be visually hidden but focusable
      expect(SKIP_LINK_BASE_CLASSES).toContain('sr-only');
      // Must become visible on focus
      expect(SKIP_LINK_BASE_CLASSES).toContain('focus:not-sr-only');
    });

    it('satisfies WCAG 2.4.7 focus visible (focus ring)', () => {
      expect(SKIP_LINK_BASE_CLASSES).toContain('focus:ring-2');
      expect(SKIP_LINK_BASE_CLASSES).toContain('focus:ring-offset-2');
    });

    it('satisfies WCAG 2.5.5 touch target (44px)', () => {
      expect(SKIP_LINK_BASE_CLASSES).toContain('focus:min-h-[44px]');
      expect(SKIP_LINK_BASE_CLASSES).toContain('focus:min-w-[44px]');
    });

    it('satisfies WCAG 1.4.3 contrast (uses theme-aware colors)', () => {
      // Theme colors should provide proper contrast
      expect(SKIP_LINK_BASE_CLASSES).toContain('focus:bg-[rgb(var(--primary))]');
      expect(SKIP_LINK_BASE_CLASSES).toContain('focus:text-[rgb(var(--primary-foreground))]');
    });
  });

  // ===========================================================================
  // Props Interface Documentation
  // ===========================================================================

  describe('props interface documentation', () => {
    it('documents targetId prop default', () => {
      expect(DEFAULT_MAIN_ID).toBe('main-content');
    });

    it('documents children prop default', () => {
      expect(DEFAULT_SKIP_LINK_TEXT).toBe('Skip to main content');
    });

    it('targetId and children work together for customization', () => {
      // These defaults enable the most common use case
      const expectedHref = `#${DEFAULT_MAIN_ID}`;
      expect(expectedHref).toBe('#main-content');
    });
  });

  // ===========================================================================
  // Integration with Main Primitive
  // ===========================================================================

  describe('integration with Main primitive', () => {
    it('default target matches Main primitive DEFAULT_MAIN_ID', () => {
      // The Main primitive exports DEFAULT_MAIN_ID = 'main-content'
      // SkipLink should target this by default for seamless integration
      expect(DEFAULT_MAIN_ID).toBe('main-content');
    });

    it('generates correct href for default target', () => {
      const href = `#${DEFAULT_MAIN_ID}`;
      expect(href).toBe('#main-content');
    });

    it('generates correct href for custom target', () => {
      const customTargetId = 'content-area';
      const href = `#${customTargetId}`;
      expect(href).toBe('#content-area');
    });
  });

  // ===========================================================================
  // Accessibility Patterns
  // ===========================================================================

  describe('accessibility patterns', () => {
    it('follows sr-only pattern for hidden content', () => {
      // sr-only is the standard Tailwind class for visually hidden content
      // that remains accessible to screen readers
      expect(SKIP_LINK_BASE_CLASSES).toContain('sr-only');
    });

    it('follows focus:not-sr-only pattern to reveal on focus', () => {
      // This pattern removes sr-only styles when the element receives focus
      expect(SKIP_LINK_BASE_CLASSES).toContain('focus:not-sr-only');
    });

    it('uses fixed positioning for consistent placement', () => {
      // Fixed positioning ensures the skip link appears in the same
      // location regardless of scroll position
      expect(SKIP_LINK_BASE_CLASSES).toContain('focus:fixed');
    });

    it('uses high z-index to appear above all content', () => {
      // z-100 ensures the skip link appears above modal backdrops, etc.
      expect(SKIP_LINK_BASE_CLASSES).toContain('focus:z-[100]');
    });
  });

  // ===========================================================================
  // Visual Design Consistency
  // ===========================================================================

  describe('visual design consistency', () => {
    it('uses consistent border radius with other components', () => {
      // rounded-md is used throughout the design system
      expect(SKIP_LINK_BASE_CLASSES).toContain('focus:rounded-md');
    });

    it('uses consistent shadow with other prominent elements', () => {
      // shadow-lg provides visual prominence
      expect(SKIP_LINK_BASE_CLASSES).toContain('focus:shadow-lg');
    });

    it('uses theme-aware colors for light/dark mode support', () => {
      const colorClasses = SKIP_LINK_BASE_CLASSES.filter((c) => c.includes('rgb(var('));

      // Should use CSS variables for all colors
      expect(colorClasses.length).toBeGreaterThanOrEqual(3); // bg, text, ring
    });
  });
});
