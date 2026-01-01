/**
 * Stack primitive utility function tests
 *
 * These tests verify the stack class generation logic.
 * Component rendering is tested via Storybook.
 */

import { describe, expect, it } from 'vitest';

/**
 * Re-implement the stack class generation functions for testing
 * (mirrors the logic in Stack.tsx)
 */

type Breakpoint = 'base' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
type StackDirection = 'vertical' | 'horizontal';
type AlignItems = 'start' | 'end' | 'center' | 'baseline' | 'stretch';
type SpacingValue =
  | '0'
  | '0.5'
  | '1'
  | '1.5'
  | '2'
  | '2.5'
  | '3'
  | '3.5'
  | '4'
  | '5'
  | '6'
  | '7'
  | '8'
  | '9'
  | '10'
  | '11'
  | '12'
  | '14'
  | '16'
  | '20'
  | '24'
  | '28'
  | '32'
  | '36'
  | '40'
  | '44'
  | '48'
  | '52'
  | '56'
  | '60'
  | '64'
  | '72'
  | '80'
  | '96'
  | 'px'
  | 'auto';
type ResponsiveValue<T> = T | Partial<Record<Breakpoint, T>>;

const BREAKPOINT_ORDER: Breakpoint[] = ['base', 'sm', 'md', 'lg', 'xl', '2xl'];

const DIRECTION_MAP: Record<StackDirection, string> = {
  vertical: 'flex-col',
  horizontal: 'flex-row',
};

const ALIGN_MAP: Record<AlignItems, string> = {
  start: 'items-start',
  end: 'items-end',
  center: 'items-center',
  baseline: 'items-baseline',
  stretch: 'items-stretch',
};

function getResponsiveStackClasses<T extends string>(
  value: ResponsiveValue<T> | undefined,
  mapping: Record<T, string>
): string[] {
  if (value === undefined) return [];

  const classes: string[] = [];

  if (typeof value === 'string') {
    classes.push(mapping[value]);
  } else if (typeof value === 'object' && value !== null) {
    for (const breakpoint of BREAKPOINT_ORDER) {
      const breakpointValue = value[breakpoint];
      if (breakpointValue !== undefined) {
        const stackClass = mapping[breakpointValue];
        if (breakpoint === 'base') {
          classes.push(stackClass);
        } else {
          classes.push(`${breakpoint}:${stackClass}`);
        }
      }
    }
  }

  return classes;
}

function getSpacingClass(prefix: string, value: SpacingValue): string {
  if (value === 'auto') {
    return `${prefix}-auto`;
  }
  if (value === 'px') {
    return `${prefix}-px`;
  }
  return `${prefix}-${value}`;
}

function getResponsiveSpacingClasses(
  prefix: string,
  value: ResponsiveValue<SpacingValue>
): string[] {
  const classes: string[] = [];

  if (typeof value === 'string') {
    classes.push(getSpacingClass(prefix, value));
  } else if (typeof value === 'object' && value !== null) {
    for (const breakpoint of BREAKPOINT_ORDER) {
      const breakpointValue = value[breakpoint];
      if (breakpointValue !== undefined) {
        const spacingClass = getSpacingClass(prefix, breakpointValue);
        if (breakpoint === 'base') {
          classes.push(spacingClass);
        } else {
          classes.push(`${breakpoint}:${spacingClass}`);
        }
      }
    }
  }

  return classes;
}

function isHorizontalAtBase(direction: ResponsiveValue<StackDirection> | undefined): boolean {
  if (direction === undefined) return false;
  if (typeof direction === 'string') return direction === 'horizontal';
  if (typeof direction === 'object' && direction !== null) {
    return direction.base === 'horizontal';
  }
  return false;
}

describe('primitives/Stack - Utility Functions', () => {
  describe('getResponsiveStackClasses', () => {
    describe('direction classes', () => {
      it('returns empty array for undefined value', () => {
        const classes = getResponsiveStackClasses(undefined, DIRECTION_MAP);
        expect(classes).toEqual([]);
      });

      it('generates vertical class (flex-col)', () => {
        const classes = getResponsiveStackClasses('vertical', DIRECTION_MAP);
        expect(classes).toEqual(['flex-col']);
      });

      it('generates horizontal class (flex-row)', () => {
        const classes = getResponsiveStackClasses('horizontal', DIRECTION_MAP);
        expect(classes).toEqual(['flex-row']);
      });

      it('generates responsive direction classes', () => {
        const classes = getResponsiveStackClasses(
          { base: 'vertical', md: 'horizontal' } as ResponsiveValue<StackDirection>,
          DIRECTION_MAP
        );
        expect(classes).toEqual(['flex-col', 'md:flex-row']);
      });

      it('generates all breakpoint direction classes', () => {
        const classes = getResponsiveStackClasses(
          {
            base: 'vertical',
            sm: 'vertical',
            md: 'horizontal',
            lg: 'horizontal',
            xl: 'vertical',
            '2xl': 'horizontal',
          } as ResponsiveValue<StackDirection>,
          DIRECTION_MAP
        );
        expect(classes).toEqual([
          'flex-col',
          'sm:flex-col',
          'md:flex-row',
          'lg:flex-row',
          'xl:flex-col',
          '2xl:flex-row',
        ]);
      });
    });

    describe('align classes', () => {
      it('generates items-start class', () => {
        const classes = getResponsiveStackClasses('start', ALIGN_MAP);
        expect(classes).toEqual(['items-start']);
      });

      it('generates items-end class', () => {
        const classes = getResponsiveStackClasses('end', ALIGN_MAP);
        expect(classes).toEqual(['items-end']);
      });

      it('generates items-center class', () => {
        const classes = getResponsiveStackClasses('center', ALIGN_MAP);
        expect(classes).toEqual(['items-center']);
      });

      it('generates items-baseline class', () => {
        const classes = getResponsiveStackClasses('baseline', ALIGN_MAP);
        expect(classes).toEqual(['items-baseline']);
      });

      it('generates items-stretch class', () => {
        const classes = getResponsiveStackClasses('stretch', ALIGN_MAP);
        expect(classes).toEqual(['items-stretch']);
      });

      it('generates responsive align classes', () => {
        const classes = getResponsiveStackClasses(
          { base: 'stretch', sm: 'start', lg: 'center' } as ResponsiveValue<AlignItems>,
          ALIGN_MAP
        );
        expect(classes).toEqual(['items-stretch', 'sm:items-start', 'lg:items-center']);
      });
    });

    describe('edge cases', () => {
      it('handles empty responsive object', () => {
        const classes = getResponsiveStackClasses(
          {} as ResponsiveValue<StackDirection>,
          DIRECTION_MAP
        );
        expect(classes).toEqual([]);
      });

      it('handles partial responsive object (no base)', () => {
        const classes = getResponsiveStackClasses(
          { md: 'horizontal', xl: 'vertical' } as ResponsiveValue<StackDirection>,
          DIRECTION_MAP
        );
        expect(classes).toEqual(['md:flex-row', 'xl:flex-col']);
      });

      it('maintains breakpoint order in output', () => {
        const classes = getResponsiveStackClasses(
          {
            xl: 'horizontal',
            sm: 'vertical',
            base: 'horizontal',
          } as ResponsiveValue<StackDirection>,
          DIRECTION_MAP
        );
        expect(classes).toEqual(['flex-row', 'sm:flex-col', 'xl:flex-row']);
      });
    });
  });

  describe('getSpacingClass', () => {
    it('generates gap-0 class', () => {
      expect(getSpacingClass('gap', '0')).toBe('gap-0');
    });

    it('generates gap-4 class', () => {
      expect(getSpacingClass('gap', '4')).toBe('gap-4');
    });

    it('generates gap-auto class', () => {
      expect(getSpacingClass('gap', 'auto')).toBe('gap-auto');
    });

    it('generates gap-px class', () => {
      expect(getSpacingClass('gap', 'px')).toBe('gap-px');
    });

    it('generates gap-0.5 class', () => {
      expect(getSpacingClass('gap', '0.5')).toBe('gap-0.5');
    });
  });

  describe('getResponsiveSpacingClasses', () => {
    it('generates simple gap class', () => {
      const classes = getResponsiveSpacingClasses('gap', '4');
      expect(classes).toEqual(['gap-4']);
    });

    it('generates responsive gap classes', () => {
      const classes = getResponsiveSpacingClasses('gap', { base: '2', md: '4', lg: '6' });
      expect(classes).toEqual(['gap-2', 'md:gap-4', 'lg:gap-6']);
    });

    it('handles gap-auto in responsive', () => {
      const classes = getResponsiveSpacingClasses('gap', { base: '4', md: 'auto' });
      expect(classes).toEqual(['gap-4', 'md:gap-auto']);
    });

    it('handles gap-px in responsive', () => {
      const classes = getResponsiveSpacingClasses('gap', { base: 'px', lg: '4' });
      expect(classes).toEqual(['gap-px', 'lg:gap-4']);
    });
  });

  describe('isHorizontalAtBase', () => {
    it('returns false for undefined', () => {
      expect(isHorizontalAtBase(undefined)).toBe(false);
    });

    it('returns false for vertical string', () => {
      expect(isHorizontalAtBase('vertical')).toBe(false);
    });

    it('returns true for horizontal string', () => {
      expect(isHorizontalAtBase('horizontal')).toBe(true);
    });

    it('returns false for vertical base in responsive object', () => {
      expect(isHorizontalAtBase({ base: 'vertical', md: 'horizontal' })).toBe(false);
    });

    it('returns true for horizontal base in responsive object', () => {
      expect(isHorizontalAtBase({ base: 'horizontal', md: 'vertical' })).toBe(true);
    });

    it('returns false for responsive object without base', () => {
      expect(isHorizontalAtBase({ md: 'horizontal' })).toBe(false);
    });

    it('returns false for empty responsive object', () => {
      expect(isHorizontalAtBase({})).toBe(false);
    });
  });

  describe('DIRECTION_MAP', () => {
    it('has correct mappings', () => {
      expect(DIRECTION_MAP.vertical).toBe('flex-col');
      expect(DIRECTION_MAP.horizontal).toBe('flex-row');
    });
  });

  describe('ALIGN_MAP', () => {
    it('has correct mappings', () => {
      expect(ALIGN_MAP.start).toBe('items-start');
      expect(ALIGN_MAP.end).toBe('items-end');
      expect(ALIGN_MAP.center).toBe('items-center');
      expect(ALIGN_MAP.baseline).toBe('items-baseline');
      expect(ALIGN_MAP.stretch).toBe('items-stretch');
    });
  });

  describe('BREAKPOINT_ORDER', () => {
    it('has correct order', () => {
      expect(BREAKPOINT_ORDER).toEqual(['base', 'sm', 'md', 'lg', 'xl', '2xl']);
    });
  });
});
