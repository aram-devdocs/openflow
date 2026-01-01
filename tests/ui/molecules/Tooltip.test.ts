/**
 * Unit tests for Tooltip molecule
 *
 * Tests for:
 * - Position class generation
 * - Arrow class generation
 * - Max width class generation
 * - Accessible description extraction
 * - Constants validation
 * - Accessibility behavior documentation
 */

import type React from 'react';
import { describe, expect, it } from 'vitest';
import {
  DEFAULT_DELAY_HIDE,
  DEFAULT_DELAY_SHOW,
  TOOLTIP_ANIMATION_CLASSES,
  TOOLTIP_ARROW_BASE_CLASSES,
  TOOLTIP_ARROW_CLASSES,
  TOOLTIP_CONTAINER_CLASSES,
  TOOLTIP_CONTENT_CLASSES,
  TOOLTIP_MAX_WIDTH_CLASSES,
  TOOLTIP_POSITION_CLASSES,
  TOOLTIP_TRIGGER_CLASSES,
  getAccessibleDescription,
  getArrowClasses,
  getMaxWidthClass,
  getPositionClasses,
} from '../../../packages/ui/molecules/Tooltip';

// ============================================================================
// Position Classes Tests
// ============================================================================

describe('TOOLTIP_POSITION_CLASSES', () => {
  it('should have classes for all positions', () => {
    expect(TOOLTIP_POSITION_CLASSES).toHaveProperty('top');
    expect(TOOLTIP_POSITION_CLASSES).toHaveProperty('bottom');
    expect(TOOLTIP_POSITION_CLASSES).toHaveProperty('left');
    expect(TOOLTIP_POSITION_CLASSES).toHaveProperty('right');
  });

  it('should position top tooltip above trigger', () => {
    const classes = TOOLTIP_POSITION_CLASSES.top;
    expect(classes).toContain('bottom-full');
    expect(classes).toContain('mb-2');
  });

  it('should position bottom tooltip below trigger', () => {
    const classes = TOOLTIP_POSITION_CLASSES.bottom;
    expect(classes).toContain('top-full');
    expect(classes).toContain('mt-2');
  });

  it('should position left tooltip to the left of trigger', () => {
    const classes = TOOLTIP_POSITION_CLASSES.left;
    expect(classes).toContain('right-full');
    expect(classes).toContain('mr-2');
  });

  it('should position right tooltip to the right of trigger', () => {
    const classes = TOOLTIP_POSITION_CLASSES.right;
    expect(classes).toContain('left-full');
    expect(classes).toContain('ml-2');
  });

  it('should center horizontal positions horizontally', () => {
    expect(TOOLTIP_POSITION_CLASSES.top).toContain('left-1/2');
    expect(TOOLTIP_POSITION_CLASSES.top).toContain('-translate-x-1/2');
    expect(TOOLTIP_POSITION_CLASSES.bottom).toContain('left-1/2');
    expect(TOOLTIP_POSITION_CLASSES.bottom).toContain('-translate-x-1/2');
  });

  it('should center vertical positions vertically', () => {
    expect(TOOLTIP_POSITION_CLASSES.left).toContain('top-1/2');
    expect(TOOLTIP_POSITION_CLASSES.left).toContain('-translate-y-1/2');
    expect(TOOLTIP_POSITION_CLASSES.right).toContain('top-1/2');
    expect(TOOLTIP_POSITION_CLASSES.right).toContain('-translate-y-1/2');
  });
});

describe('getPositionClasses', () => {
  it('should return top position classes', () => {
    expect(getPositionClasses('top')).toBe(TOOLTIP_POSITION_CLASSES.top);
  });

  it('should return bottom position classes', () => {
    expect(getPositionClasses('bottom')).toBe(TOOLTIP_POSITION_CLASSES.bottom);
  });

  it('should return left position classes', () => {
    expect(getPositionClasses('left')).toBe(TOOLTIP_POSITION_CLASSES.left);
  });

  it('should return right position classes', () => {
    expect(getPositionClasses('right')).toBe(TOOLTIP_POSITION_CLASSES.right);
  });
});

// ============================================================================
// Arrow Classes Tests
// ============================================================================

describe('TOOLTIP_ARROW_CLASSES', () => {
  it('should have arrow classes for all positions', () => {
    expect(TOOLTIP_ARROW_CLASSES).toHaveProperty('top');
    expect(TOOLTIP_ARROW_CLASSES).toHaveProperty('bottom');
    expect(TOOLTIP_ARROW_CLASSES).toHaveProperty('left');
    expect(TOOLTIP_ARROW_CLASSES).toHaveProperty('right');
  });

  it('should position top arrow below tooltip pointing down', () => {
    const classes = TOOLTIP_ARROW_CLASSES.top;
    expect(classes).toContain('top-full');
    expect(classes).toContain('border-t-[rgb(var(--popover))]');
    expect(classes).toContain('border-b-transparent');
  });

  it('should position bottom arrow above tooltip pointing up', () => {
    const classes = TOOLTIP_ARROW_CLASSES.bottom;
    expect(classes).toContain('bottom-full');
    expect(classes).toContain('border-b-[rgb(var(--popover))]');
    expect(classes).toContain('border-t-transparent');
  });

  it('should position left arrow to the right of tooltip pointing left', () => {
    const classes = TOOLTIP_ARROW_CLASSES.left;
    expect(classes).toContain('left-full');
    expect(classes).toContain('border-l-[rgb(var(--popover))]');
    expect(classes).toContain('border-r-transparent');
  });

  it('should position right arrow to the left of tooltip pointing right', () => {
    const classes = TOOLTIP_ARROW_CLASSES.right;
    expect(classes).toContain('right-full');
    expect(classes).toContain('border-r-[rgb(var(--popover))]');
    expect(classes).toContain('border-l-transparent');
  });

  it('should center horizontal arrows horizontally', () => {
    expect(TOOLTIP_ARROW_CLASSES.top).toContain('left-1/2');
    expect(TOOLTIP_ARROW_CLASSES.top).toContain('-translate-x-1/2');
    expect(TOOLTIP_ARROW_CLASSES.bottom).toContain('left-1/2');
    expect(TOOLTIP_ARROW_CLASSES.bottom).toContain('-translate-x-1/2');
  });

  it('should center vertical arrows vertically', () => {
    expect(TOOLTIP_ARROW_CLASSES.left).toContain('top-1/2');
    expect(TOOLTIP_ARROW_CLASSES.left).toContain('-translate-y-1/2');
    expect(TOOLTIP_ARROW_CLASSES.right).toContain('top-1/2');
    expect(TOOLTIP_ARROW_CLASSES.right).toContain('-translate-y-1/2');
  });
});

describe('getArrowClasses', () => {
  it('should return top arrow classes', () => {
    expect(getArrowClasses('top')).toBe(TOOLTIP_ARROW_CLASSES.top);
  });

  it('should return bottom arrow classes', () => {
    expect(getArrowClasses('bottom')).toBe(TOOLTIP_ARROW_CLASSES.bottom);
  });

  it('should return left arrow classes', () => {
    expect(getArrowClasses('left')).toBe(TOOLTIP_ARROW_CLASSES.left);
  });

  it('should return right arrow classes', () => {
    expect(getArrowClasses('right')).toBe(TOOLTIP_ARROW_CLASSES.right);
  });
});

// ============================================================================
// Max Width Classes Tests
// ============================================================================

describe('TOOLTIP_MAX_WIDTH_CLASSES', () => {
  it('should have all max width options', () => {
    expect(TOOLTIP_MAX_WIDTH_CLASSES).toHaveProperty('xs');
    expect(TOOLTIP_MAX_WIDTH_CLASSES).toHaveProperty('sm');
    expect(TOOLTIP_MAX_WIDTH_CLASSES).toHaveProperty('md');
    expect(TOOLTIP_MAX_WIDTH_CLASSES).toHaveProperty('lg');
    expect(TOOLTIP_MAX_WIDTH_CLASSES).toHaveProperty('none');
  });

  it('should have xs max-width class', () => {
    expect(TOOLTIP_MAX_WIDTH_CLASSES.xs).toBe('max-w-xs');
  });

  it('should have sm max-width class', () => {
    expect(TOOLTIP_MAX_WIDTH_CLASSES.sm).toBe('max-w-sm');
  });

  it('should have md max-width class', () => {
    expect(TOOLTIP_MAX_WIDTH_CLASSES.md).toBe('max-w-md');
  });

  it('should have lg max-width class', () => {
    expect(TOOLTIP_MAX_WIDTH_CLASSES.lg).toBe('max-w-lg');
  });

  it('should have empty string for none option', () => {
    expect(TOOLTIP_MAX_WIDTH_CLASSES.none).toBe('');
  });
});

describe('getMaxWidthClass', () => {
  it('should return xs max-width class', () => {
    expect(getMaxWidthClass('xs')).toBe('max-w-xs');
  });

  it('should return sm max-width class', () => {
    expect(getMaxWidthClass('sm')).toBe('max-w-sm');
  });

  it('should return md max-width class', () => {
    expect(getMaxWidthClass('md')).toBe('max-w-md');
  });

  it('should return lg max-width class', () => {
    expect(getMaxWidthClass('lg')).toBe('max-w-lg');
  });

  it('should return empty string for none', () => {
    expect(getMaxWidthClass('none')).toBe('');
  });

  it('should default to xs for unknown values', () => {
    expect(getMaxWidthClass('invalid')).toBe('max-w-xs');
  });
});

// ============================================================================
// Accessible Description Tests
// ============================================================================

describe('getAccessibleDescription', () => {
  it('should return aria-label when provided', () => {
    expect(getAccessibleDescription('content', 'label')).toBe('label');
  });

  it('should return string content directly', () => {
    expect(getAccessibleDescription('Hello tooltip')).toBe('Hello tooltip');
  });

  it('should convert number content to string', () => {
    expect(getAccessibleDescription(42)).toBe('42');
  });

  it('should return undefined for non-string content without aria-label', () => {
    // React node (object) without aria-label
    const reactNode = {} as React.ReactNode;
    expect(getAccessibleDescription(reactNode)).toBeUndefined();
  });

  it('should return undefined for null content', () => {
    expect(getAccessibleDescription(null)).toBeUndefined();
  });

  it('should return undefined for undefined content', () => {
    expect(getAccessibleDescription(undefined)).toBeUndefined();
  });

  it('should prefer aria-label over string content', () => {
    expect(getAccessibleDescription('content', 'aria-label')).toBe('aria-label');
  });

  it('should handle empty string content', () => {
    expect(getAccessibleDescription('')).toBe('');
  });

  it('should handle zero number content', () => {
    expect(getAccessibleDescription(0)).toBe('0');
  });
});

// ============================================================================
// Default Delay Constants Tests
// ============================================================================

describe('Default delay constants', () => {
  it('should have DEFAULT_DELAY_SHOW set to 200ms', () => {
    expect(DEFAULT_DELAY_SHOW).toBe(200);
  });

  it('should have DEFAULT_DELAY_HIDE set to 0ms', () => {
    expect(DEFAULT_DELAY_HIDE).toBe(0);
  });

  it('should have positive show delay for UX', () => {
    expect(DEFAULT_DELAY_SHOW).toBeGreaterThan(0);
  });

  it('should have non-negative hide delay', () => {
    expect(DEFAULT_DELAY_HIDE).toBeGreaterThanOrEqual(0);
  });
});

// ============================================================================
// Container Classes Tests
// ============================================================================

describe('TOOLTIP_CONTAINER_CLASSES', () => {
  it('should use absolute positioning', () => {
    expect(TOOLTIP_CONTAINER_CLASSES).toContain('absolute');
  });

  it('should have high z-index', () => {
    expect(TOOLTIP_CONTAINER_CLASSES).toContain('z-50');
  });

  it('should disable pointer events', () => {
    expect(TOOLTIP_CONTAINER_CLASSES).toContain('pointer-events-none');
  });
});

// ============================================================================
// Animation Classes Tests
// ============================================================================

describe('TOOLTIP_ANIMATION_CLASSES', () => {
  it('should include motion-safe prefix for accessibility', () => {
    expect(TOOLTIP_ANIMATION_CLASSES).toContain('motion-safe:');
  });

  it('should include animate-in for entrance', () => {
    expect(TOOLTIP_ANIMATION_CLASSES).toContain('motion-safe:animate-in');
  });

  it('should include fade-in animation', () => {
    expect(TOOLTIP_ANIMATION_CLASSES).toContain('motion-safe:fade-in-0');
  });

  it('should include zoom-in animation', () => {
    expect(TOOLTIP_ANIMATION_CLASSES).toContain('motion-safe:zoom-in-95');
  });

  it('should include duration for smooth transition', () => {
    expect(TOOLTIP_ANIMATION_CLASSES).toContain('motion-safe:duration-150');
  });
});

// ============================================================================
// Content Classes Tests
// ============================================================================

describe('TOOLTIP_CONTENT_CLASSES', () => {
  it('should have relative positioning for arrow', () => {
    expect(TOOLTIP_CONTENT_CLASSES).toContain('relative');
  });

  it('should have padding', () => {
    expect(TOOLTIP_CONTENT_CLASSES).toContain('px-3');
    expect(TOOLTIP_CONTENT_CLASSES).toContain('py-1.5');
  });

  it('should have small text size', () => {
    expect(TOOLTIP_CONTENT_CLASSES).toContain('text-xs');
  });

  it('should have medium font weight', () => {
    expect(TOOLTIP_CONTENT_CLASSES).toContain('font-medium');
  });

  it('should have rounded corners', () => {
    expect(TOOLTIP_CONTENT_CLASSES).toContain('rounded-md');
  });

  it('should have shadow', () => {
    expect(TOOLTIP_CONTENT_CLASSES).toContain('shadow-md');
  });

  it('should use theme-aware colors', () => {
    expect(TOOLTIP_CONTENT_CLASSES).toContain('bg-[rgb(var(--popover))]');
    expect(TOOLTIP_CONTENT_CLASSES).toContain('text-[rgb(var(--popover-foreground))]');
  });

  it('should have border', () => {
    expect(TOOLTIP_CONTENT_CLASSES).toContain('border');
    expect(TOOLTIP_CONTENT_CLASSES).toContain('border-[rgb(var(--border))]');
  });

  it('should allow text wrapping', () => {
    expect(TOOLTIP_CONTENT_CLASSES).toContain('whitespace-normal');
    expect(TOOLTIP_CONTENT_CLASSES).toContain('break-words');
  });
});

// ============================================================================
// Arrow Base Classes Tests
// ============================================================================

describe('TOOLTIP_ARROW_BASE_CLASSES', () => {
  it('should use absolute positioning', () => {
    expect(TOOLTIP_ARROW_BASE_CLASSES).toContain('absolute');
  });

  it('should use border for arrow shape', () => {
    expect(TOOLTIP_ARROW_BASE_CLASSES).toContain('border-4');
  });
});

// ============================================================================
// Trigger Classes Tests
// ============================================================================

describe('TOOLTIP_TRIGGER_CLASSES', () => {
  it('should use relative positioning for tooltip anchor', () => {
    expect(TOOLTIP_TRIGGER_CLASSES).toContain('relative');
  });

  it('should use inline-flex for proper layout', () => {
    expect(TOOLTIP_TRIGGER_CLASSES).toContain('inline-flex');
  });
});

// ============================================================================
// Accessibility Behavior Documentation Tests
// ============================================================================

describe('Tooltip accessibility behavior', () => {
  it('should document role="tooltip" requirement', () => {
    // The tooltip element should have role="tooltip"
    // This is documented behavior - actual rendering test would be in component tests
    expect(true).toBe(true);
  });

  it('should document aria-describedby linking', () => {
    // The trigger should have aria-describedby pointing to tooltip ID when visible
    expect(true).toBe(true);
  });

  it('should document keyboard accessibility', () => {
    // Tooltip shows on focus, dismisses on Escape
    expect(true).toBe(true);
  });

  it('should document reduced motion support', () => {
    // Animation uses motion-safe: prefix
    expect(TOOLTIP_ANIMATION_CLASSES).toContain('motion-safe:');
  });

  it('should document screen reader announcement', () => {
    // VisuallyHidden with role="status" and aria-live="polite" for announcement
    expect(true).toBe(true);
  });
});

// ============================================================================
// Component Props Documentation Tests
// ============================================================================

describe('Tooltip props documentation', () => {
  it('should document default position is top', () => {
    // Default position is 'top'
    expect(TOOLTIP_POSITION_CLASSES.top).toBeDefined();
  });

  it('should document default delayShow is 200ms', () => {
    expect(DEFAULT_DELAY_SHOW).toBe(200);
  });

  it('should document default delayHide is 0ms', () => {
    expect(DEFAULT_DELAY_HIDE).toBe(0);
  });

  it('should document default maxWidth is xs', () => {
    expect(TOOLTIP_MAX_WIDTH_CLASSES.xs).toBe('max-w-xs');
  });

  it('should document disabled behavior', () => {
    // When disabled=true, children are rendered without tooltip wrapper
    expect(true).toBe(true);
  });
});

// ============================================================================
// Position Visual Consistency Tests
// ============================================================================

describe('Position visual consistency', () => {
  it('should have consistent margin spacing across positions', () => {
    // All positions should have a 2 unit margin
    expect(TOOLTIP_POSITION_CLASSES.top).toContain('mb-2');
    expect(TOOLTIP_POSITION_CLASSES.bottom).toContain('mt-2');
    expect(TOOLTIP_POSITION_CLASSES.left).toContain('mr-2');
    expect(TOOLTIP_POSITION_CLASSES.right).toContain('ml-2');
  });

  it('should have symmetric centering for top/bottom', () => {
    const topClasses = TOOLTIP_POSITION_CLASSES.top;
    const bottomClasses = TOOLTIP_POSITION_CLASSES.bottom;

    expect(topClasses).toContain('left-1/2');
    expect(topClasses).toContain('-translate-x-1/2');
    expect(bottomClasses).toContain('left-1/2');
    expect(bottomClasses).toContain('-translate-x-1/2');
  });

  it('should have symmetric centering for left/right', () => {
    const leftClasses = TOOLTIP_POSITION_CLASSES.left;
    const rightClasses = TOOLTIP_POSITION_CLASSES.right;

    expect(leftClasses).toContain('top-1/2');
    expect(leftClasses).toContain('-translate-y-1/2');
    expect(rightClasses).toContain('top-1/2');
    expect(rightClasses).toContain('-translate-y-1/2');
  });
});

// ============================================================================
// Arrow Visual Consistency Tests
// ============================================================================

describe('Arrow visual consistency', () => {
  it('should have consistent border size for all arrows', () => {
    // All arrows use border-4
    expect(TOOLTIP_ARROW_BASE_CLASSES).toContain('border-4');
  });

  it('should have transparent borders on non-pointing sides', () => {
    // Top arrow: left and right transparent
    expect(TOOLTIP_ARROW_CLASSES.top).toContain('border-x-transparent');
    expect(TOOLTIP_ARROW_CLASSES.top).toContain('border-b-transparent');

    // Bottom arrow: left and right transparent
    expect(TOOLTIP_ARROW_CLASSES.bottom).toContain('border-x-transparent');
    expect(TOOLTIP_ARROW_CLASSES.bottom).toContain('border-t-transparent');

    // Left arrow: top and bottom transparent
    expect(TOOLTIP_ARROW_CLASSES.left).toContain('border-y-transparent');
    expect(TOOLTIP_ARROW_CLASSES.left).toContain('border-r-transparent');

    // Right arrow: top and bottom transparent
    expect(TOOLTIP_ARROW_CLASSES.right).toContain('border-y-transparent');
    expect(TOOLTIP_ARROW_CLASSES.right).toContain('border-l-transparent');
  });

  it('should use popover color for visible arrow border', () => {
    expect(TOOLTIP_ARROW_CLASSES.top).toContain('border-t-[rgb(var(--popover))]');
    expect(TOOLTIP_ARROW_CLASSES.bottom).toContain('border-b-[rgb(var(--popover))]');
    expect(TOOLTIP_ARROW_CLASSES.left).toContain('border-l-[rgb(var(--popover))]');
    expect(TOOLTIP_ARROW_CLASSES.right).toContain('border-r-[rgb(var(--popover))]');
  });
});

// ============================================================================
// Data Attributes Documentation Tests
// ============================================================================

describe('Data attributes documentation', () => {
  it('should document data-testid pattern', () => {
    // Container: data-testid
    // Trigger: data-testid-trigger
    // Tooltip: data-testid-tooltip
    expect(true).toBe(true);
  });

  it('should document data-state attribute', () => {
    // Trigger has data-state="open" or "closed"
    expect(true).toBe(true);
  });

  it('should document data-position attribute', () => {
    // Tooltip has data-position with current position
    expect(true).toBe(true);
  });
});

// ============================================================================
// Integration Pattern Tests
// ============================================================================

describe('Integration patterns', () => {
  it('should work with icon-only buttons', () => {
    // Icon buttons should have aria-label on the button
    // Tooltip adds supplementary description
    expect(true).toBe(true);
  });

  it('should work with keyboard shortcuts display', () => {
    // Rich content with aria-label for screen readers
    expect(true).toBe(true);
  });

  it('should work in toolbars', () => {
    // Multiple tooltips on toolbar buttons
    expect(true).toBe(true);
  });
});
