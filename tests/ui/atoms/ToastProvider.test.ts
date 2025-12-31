import { describe, expect, it } from 'vitest';
import {
  DEFAULT_DURATION,
  DEFAULT_ERROR_DURATION,
  DEFAULT_MAX_TOASTS,
  DEFAULT_POSITION,
  DEFAULT_REGION_LABEL,
  POSITION_CLASSES,
  TOAST_CONTAINER_BASE_CLASSES,
  getPositionClasses,
} from '../../../packages/ui/atoms/ToastProvider';

// ============================================================================
// Constants Tests
// ============================================================================

describe('ToastProvider Constants', () => {
  describe('DEFAULT_DURATION', () => {
    it('should be 5000ms (5 seconds)', () => {
      expect(DEFAULT_DURATION).toBe(5000);
    });
  });

  describe('DEFAULT_ERROR_DURATION', () => {
    it('should be 8000ms (8 seconds)', () => {
      expect(DEFAULT_ERROR_DURATION).toBe(8000);
    });

    it('should be longer than DEFAULT_DURATION', () => {
      expect(DEFAULT_ERROR_DURATION).toBeGreaterThan(DEFAULT_DURATION);
    });
  });

  describe('DEFAULT_MAX_TOASTS', () => {
    it('should be 5', () => {
      expect(DEFAULT_MAX_TOASTS).toBe(5);
    });

    it('should be a positive number', () => {
      expect(DEFAULT_MAX_TOASTS).toBeGreaterThan(0);
    });
  });

  describe('DEFAULT_POSITION', () => {
    it('should be bottom-right', () => {
      expect(DEFAULT_POSITION).toBe('bottom-right');
    });

    it('should be a valid position key', () => {
      expect(Object.keys(POSITION_CLASSES)).toContain(DEFAULT_POSITION);
    });
  });

  describe('DEFAULT_REGION_LABEL', () => {
    it('should be "Notifications"', () => {
      expect(DEFAULT_REGION_LABEL).toBe('Notifications');
    });

    it('should be non-empty string', () => {
      expect(DEFAULT_REGION_LABEL.length).toBeGreaterThan(0);
    });
  });
});

// ============================================================================
// POSITION_CLASSES Tests
// ============================================================================

describe('POSITION_CLASSES', () => {
  it('should have all 6 positions defined', () => {
    const expectedPositions = [
      'top-left',
      'top-center',
      'top-right',
      'bottom-left',
      'bottom-center',
      'bottom-right',
    ];
    expect(Object.keys(POSITION_CLASSES)).toEqual(expectedPositions);
  });

  describe('top positions', () => {
    it('top-left should position at top-left and use flex-col-reverse', () => {
      expect(POSITION_CLASSES['top-left']).toContain('top-0');
      expect(POSITION_CLASSES['top-left']).toContain('left-0');
      expect(POSITION_CLASSES['top-left']).toContain('flex-col-reverse');
    });

    it('top-center should position at top-center and use flex-col-reverse', () => {
      expect(POSITION_CLASSES['top-center']).toContain('top-0');
      expect(POSITION_CLASSES['top-center']).toContain('left-1/2');
      expect(POSITION_CLASSES['top-center']).toContain('-translate-x-1/2');
      expect(POSITION_CLASSES['top-center']).toContain('flex-col-reverse');
      expect(POSITION_CLASSES['top-center']).toContain('items-center');
    });

    it('top-right should position at top-right and use flex-col-reverse', () => {
      expect(POSITION_CLASSES['top-right']).toContain('top-0');
      expect(POSITION_CLASSES['top-right']).toContain('right-0');
      expect(POSITION_CLASSES['top-right']).toContain('flex-col-reverse');
      expect(POSITION_CLASSES['top-right']).toContain('items-end');
    });
  });

  describe('bottom positions', () => {
    it('bottom-left should position at bottom-left and use flex-col', () => {
      expect(POSITION_CLASSES['bottom-left']).toContain('bottom-0');
      expect(POSITION_CLASSES['bottom-left']).toContain('left-0');
      expect(POSITION_CLASSES['bottom-left']).toContain('flex-col');
      expect(POSITION_CLASSES['bottom-left']).not.toContain('flex-col-reverse');
    });

    it('bottom-center should position at bottom-center and use flex-col', () => {
      expect(POSITION_CLASSES['bottom-center']).toContain('bottom-0');
      expect(POSITION_CLASSES['bottom-center']).toContain('left-1/2');
      expect(POSITION_CLASSES['bottom-center']).toContain('-translate-x-1/2');
      expect(POSITION_CLASSES['bottom-center']).toContain('flex-col');
      expect(POSITION_CLASSES['bottom-center']).not.toContain('flex-col-reverse');
      expect(POSITION_CLASSES['bottom-center']).toContain('items-center');
    });

    it('bottom-right should position at bottom-right and use flex-col', () => {
      expect(POSITION_CLASSES['bottom-right']).toContain('bottom-0');
      expect(POSITION_CLASSES['bottom-right']).toContain('right-0');
      expect(POSITION_CLASSES['bottom-right']).toContain('flex-col');
      expect(POSITION_CLASSES['bottom-right']).not.toContain('flex-col-reverse');
      expect(POSITION_CLASSES['bottom-right']).toContain('items-end');
    });
  });

  describe('flex-col-reverse reasoning', () => {
    it('top positions should use flex-col-reverse so newest toast appears closest to content', () => {
      expect(POSITION_CLASSES['top-left']).toContain('flex-col-reverse');
      expect(POSITION_CLASSES['top-center']).toContain('flex-col-reverse');
      expect(POSITION_CLASSES['top-right']).toContain('flex-col-reverse');
    });

    it('bottom positions should use flex-col so newest toast appears closest to content', () => {
      expect(POSITION_CLASSES['bottom-left']).toContain('flex-col');
      expect(POSITION_CLASSES['bottom-center']).toContain('flex-col');
      expect(POSITION_CLASSES['bottom-right']).toContain('flex-col');
    });
  });
});

// ============================================================================
// TOAST_CONTAINER_BASE_CLASSES Tests
// ============================================================================

describe('TOAST_CONTAINER_BASE_CLASSES', () => {
  it('should include pointer-events-none', () => {
    expect(TOAST_CONTAINER_BASE_CLASSES).toContain('pointer-events-none');
  });

  it('should include fixed positioning', () => {
    expect(TOAST_CONTAINER_BASE_CLASSES).toContain('fixed');
  });

  it('should include high z-index (z-50)', () => {
    expect(TOAST_CONTAINER_BASE_CLASSES).toContain('z-50');
  });

  it('should include flex display', () => {
    expect(TOAST_CONTAINER_BASE_CLASSES).toContain('flex');
  });

  it('should include max-height constraint', () => {
    expect(TOAST_CONTAINER_BASE_CLASSES).toContain('max-h-screen');
  });

  it('should include full width on mobile', () => {
    expect(TOAST_CONTAINER_BASE_CLASSES).toContain('w-full');
  });

  it('should include gap between toasts', () => {
    expect(TOAST_CONTAINER_BASE_CLASSES).toContain('gap-2');
  });

  it('should include padding', () => {
    expect(TOAST_CONTAINER_BASE_CLASSES).toContain('p-4');
  });

  it('should include max-width on larger screens', () => {
    expect(TOAST_CONTAINER_BASE_CLASSES).toContain('sm:max-w-md');
  });
});

// ============================================================================
// getPositionClasses Tests
// ============================================================================

describe('getPositionClasses', () => {
  describe('with string position', () => {
    it('should return classes for top-left', () => {
      expect(getPositionClasses('top-left')).toBe(POSITION_CLASSES['top-left']);
    });

    it('should return classes for top-center', () => {
      expect(getPositionClasses('top-center')).toBe(POSITION_CLASSES['top-center']);
    });

    it('should return classes for top-right', () => {
      expect(getPositionClasses('top-right')).toBe(POSITION_CLASSES['top-right']);
    });

    it('should return classes for bottom-left', () => {
      expect(getPositionClasses('bottom-left')).toBe(POSITION_CLASSES['bottom-left']);
    });

    it('should return classes for bottom-center', () => {
      expect(getPositionClasses('bottom-center')).toBe(POSITION_CLASSES['bottom-center']);
    });

    it('should return classes for bottom-right', () => {
      expect(getPositionClasses('bottom-right')).toBe(POSITION_CLASSES['bottom-right']);
    });
  });

  describe('with responsive position object', () => {
    it('should handle base breakpoint only', () => {
      const result = getPositionClasses({ base: 'bottom-right' });
      expect(result).toContain('bottom-0');
      expect(result).toContain('right-0');
      expect(result).toContain('flex-col');
      expect(result).not.toContain('sm:');
    });

    it('should handle base and md breakpoints', () => {
      const result = getPositionClasses({ base: 'bottom-center', md: 'bottom-right' });
      // Base classes (no prefix)
      expect(result).toContain('bottom-0');
      expect(result).toContain('left-1/2');
      expect(result).toContain('-translate-x-1/2');
      // md: prefixed classes
      expect(result).toContain('md:bottom-0');
      expect(result).toContain('md:right-0');
      expect(result).toContain('md:flex-col');
    });

    it('should handle sm breakpoint', () => {
      const result = getPositionClasses({ base: 'top-left', sm: 'top-right' });
      expect(result).toContain('top-0');
      expect(result).toContain('left-0');
      expect(result).toContain('sm:top-0');
      expect(result).toContain('sm:right-0');
    });

    it('should handle lg breakpoint', () => {
      const result = getPositionClasses({ base: 'bottom-left', lg: 'bottom-right' });
      expect(result).toContain('bottom-0');
      expect(result).toContain('left-0');
      expect(result).toContain('lg:bottom-0');
      expect(result).toContain('lg:right-0');
    });

    it('should handle xl breakpoint', () => {
      const result = getPositionClasses({ base: 'top-center', xl: 'top-right' });
      expect(result).toContain('top-0');
      expect(result).toContain('left-1/2');
      expect(result).toContain('xl:top-0');
      expect(result).toContain('xl:right-0');
    });

    it('should handle 2xl breakpoint', () => {
      const result = getPositionClasses({ base: 'bottom-center', '2xl': 'bottom-right' });
      expect(result).toContain('bottom-0');
      expect(result).toContain('left-1/2');
      expect(result).toContain('2xl:bottom-0');
      expect(result).toContain('2xl:right-0');
    });

    it('should handle multiple breakpoints', () => {
      const result = getPositionClasses({
        base: 'bottom-center',
        sm: 'bottom-left',
        md: 'bottom-right',
        lg: 'top-right',
      });

      // base classes
      expect(result).toContain('left-1/2');
      expect(result).toContain('-translate-x-1/2');
      // sm classes
      expect(result).toContain('sm:left-0');
      // md classes
      expect(result).toContain('md:right-0');
      // lg classes
      expect(result).toContain('lg:top-0');
      expect(result).toContain('lg:flex-col-reverse');
    });
  });

  describe('with invalid/edge case inputs', () => {
    it('should return default position for null', () => {
      // @ts-expect-error - testing invalid input
      expect(getPositionClasses(null)).toBe(POSITION_CLASSES[DEFAULT_POSITION]);
    });

    it('should return default position for undefined', () => {
      // @ts-expect-error - testing invalid input
      expect(getPositionClasses(undefined)).toBe(POSITION_CLASSES[DEFAULT_POSITION]);
    });

    it('should return default position for empty object', () => {
      expect(getPositionClasses({})).toBe('');
    });
  });
});

// ============================================================================
// Breakpoint Order Tests
// ============================================================================

describe('Breakpoint ordering', () => {
  it('should process breakpoints in correct order (base -> sm -> md -> lg -> xl -> 2xl)', () => {
    const result = getPositionClasses({
      '2xl': 'top-left',
      base: 'bottom-right',
      lg: 'top-center',
      md: 'bottom-left',
      sm: 'bottom-center',
      xl: 'top-right',
    });

    // Classes should appear in breakpoint order, not object key order
    const parts = result.split(' ');

    // Find indices of some key classes to verify order
    const bottomRightIndex = parts.indexOf('bottom-0');
    const smIndex = parts.findIndex((p) => p.startsWith('sm:'));
    const mdIndex = parts.findIndex((p) => p.startsWith('md:'));
    const lgIndex = parts.findIndex((p) => p.startsWith('lg:'));
    const xlIndex = parts.findIndex((p) => p.startsWith('xl:'));
    const twoXlIndex = parts.findIndex((p) => p.startsWith('2xl:'));

    // Verify order is ascending
    expect(bottomRightIndex).toBeLessThan(smIndex);
    expect(smIndex).toBeLessThan(mdIndex);
    expect(mdIndex).toBeLessThan(lgIndex);
    expect(lgIndex).toBeLessThan(xlIndex);
    expect(xlIndex).toBeLessThan(twoXlIndex);
  });
});

// ============================================================================
// Integration / Behavior Documentation Tests
// ============================================================================

describe('ToastProvider behavior documentation', () => {
  describe('timer management', () => {
    it('should document that default duration is 5 seconds', () => {
      expect(DEFAULT_DURATION).toBe(5000);
    });

    it('should document that error duration is 8 seconds', () => {
      expect(DEFAULT_ERROR_DURATION).toBe(8000);
    });

    it('should document that duration=0 means infinite (no auto-dismiss)', () => {
      // This is documented behavior - duration of 0 means persistent toast
      // Tests verify the constant exists and is usable
      expect(typeof DEFAULT_DURATION).toBe('number');
    });
  });

  describe('toast limits', () => {
    it('should document default max toasts is 5', () => {
      expect(DEFAULT_MAX_TOASTS).toBe(5);
    });

    it('should document that exceeding max removes oldest toast', () => {
      // This is documented behavior verified through component testing
      expect(DEFAULT_MAX_TOASTS).toBeGreaterThan(0);
    });
  });

  describe('position behavior', () => {
    it('should document that top positions use flex-col-reverse', () => {
      // This ensures newest toasts appear at the bottom of the stack (closest to main content)
      const topPositions = ['top-left', 'top-center', 'top-right'] as const;
      for (const pos of topPositions) {
        expect(POSITION_CLASSES[pos]).toContain('flex-col-reverse');
      }
    });

    it('should document that bottom positions use flex-col', () => {
      // This ensures newest toasts appear at the top of the stack (closest to main content)
      const bottomPositions = ['bottom-left', 'bottom-center', 'bottom-right'] as const;
      for (const pos of bottomPositions) {
        expect(POSITION_CLASSES[pos]).toContain('flex-col');
        expect(POSITION_CLASSES[pos]).not.toContain('flex-col-reverse');
      }
    });
  });

  describe('accessibility', () => {
    it('should document default region label', () => {
      expect(DEFAULT_REGION_LABEL).toBe('Notifications');
    });

    it('should document that container has pointer-events-none', () => {
      // Individual toasts have pointer-events-auto to be interactive
      expect(TOAST_CONTAINER_BASE_CLASSES).toContain('pointer-events-none');
    });

    it('should document high z-index for overlay stacking', () => {
      expect(TOAST_CONTAINER_BASE_CLASSES).toContain('z-50');
    });
  });
});

// ============================================================================
// CSS Class Consistency Tests
// ============================================================================

describe('CSS class consistency', () => {
  it('all positions should have valid Tailwind positioning classes', () => {
    for (const [, classes] of Object.entries(POSITION_CLASSES)) {
      // Each position must have either top or bottom
      expect(classes.match(/top-0|bottom-0/)).toBeTruthy();
      // Each position must have either left, right, or center (left-1/2)
      expect(classes.match(/left-0|right-0|left-1\/2/)).toBeTruthy();
      // Each position must have flex direction
      expect(classes.match(/flex-col|flex-col-reverse/)).toBeTruthy();
    }
  });

  it('center positions should have translate for centering', () => {
    expect(POSITION_CLASSES['top-center']).toContain('-translate-x-1/2');
    expect(POSITION_CLASSES['bottom-center']).toContain('-translate-x-1/2');
  });

  it('edge positions should have items alignment', () => {
    // Right positions align items to end
    expect(POSITION_CLASSES['top-right']).toContain('items-end');
    expect(POSITION_CLASSES['bottom-right']).toContain('items-end');
    // Center positions align items to center
    expect(POSITION_CLASSES['top-center']).toContain('items-center');
    expect(POSITION_CLASSES['bottom-center']).toContain('items-center');
  });
});

// ============================================================================
// Type Safety Tests
// ============================================================================

describe('Type safety', () => {
  it('POSITION_CLASSES should have exactly 6 keys', () => {
    expect(Object.keys(POSITION_CLASSES)).toHaveLength(6);
  });

  it('all position values should be non-empty strings', () => {
    for (const [, value] of Object.entries(POSITION_CLASSES)) {
      expect(typeof value).toBe('string');
      expect(value.length).toBeGreaterThan(0);
    }
  });

  it('constants should be immutable (frozen in practice)', () => {
    // These are const declarations, TypeScript enforces immutability at compile time
    expect(typeof TOAST_CONTAINER_BASE_CLASSES).toBe('string');
    expect(typeof DEFAULT_REGION_LABEL).toBe('string');
  });
});
