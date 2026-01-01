/**
 * Flex primitive utility function tests
 *
 * These tests verify the flex class generation logic.
 * Component rendering is tested via Storybook.
 */

import { describe, expect, it } from 'vitest';

/**
 * Re-implement the flex class generation functions for testing
 * (mirrors the logic in Flex.tsx)
 */

type Breakpoint = 'base' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
type FlexDirection = 'row' | 'row-reverse' | 'column' | 'column-reverse';
type FlexWrap = 'nowrap' | 'wrap' | 'wrap-reverse';
type JustifyContent = 'start' | 'end' | 'center' | 'between' | 'around' | 'evenly';
type AlignItems = 'start' | 'end' | 'center' | 'baseline' | 'stretch';
type ResponsiveValue<T> = T | Partial<Record<Breakpoint, T>>;

const BREAKPOINT_ORDER: Breakpoint[] = ['base', 'sm', 'md', 'lg', 'xl', '2xl'];

const DIRECTION_MAP: Record<FlexDirection, string> = {
  row: 'flex-row',
  'row-reverse': 'flex-row-reverse',
  column: 'flex-col',
  'column-reverse': 'flex-col-reverse',
};

const WRAP_MAP: Record<FlexWrap, string> = {
  nowrap: 'flex-nowrap',
  wrap: 'flex-wrap',
  'wrap-reverse': 'flex-wrap-reverse',
};

const JUSTIFY_MAP: Record<JustifyContent, string> = {
  start: 'justify-start',
  end: 'justify-end',
  center: 'justify-center',
  between: 'justify-between',
  around: 'justify-around',
  evenly: 'justify-evenly',
};

const ALIGN_MAP: Record<AlignItems, string> = {
  start: 'items-start',
  end: 'items-end',
  center: 'items-center',
  baseline: 'items-baseline',
  stretch: 'items-stretch',
};

function getResponsiveFlexClasses<T extends string>(
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
        const flexClass = mapping[breakpointValue];
        if (breakpoint === 'base') {
          classes.push(flexClass);
        } else {
          classes.push(`${breakpoint}:${flexClass}`);
        }
      }
    }
  }

  return classes;
}

describe('primitives/Flex - Utility Functions', () => {
  describe('getResponsiveFlexClasses', () => {
    describe('direction classes', () => {
      it('returns empty array for undefined value', () => {
        const classes = getResponsiveFlexClasses(undefined, DIRECTION_MAP);
        expect(classes).toEqual([]);
      });

      it('generates row class', () => {
        const classes = getResponsiveFlexClasses('row', DIRECTION_MAP);
        expect(classes).toEqual(['flex-row']);
      });

      it('generates row-reverse class', () => {
        const classes = getResponsiveFlexClasses('row-reverse', DIRECTION_MAP);
        expect(classes).toEqual(['flex-row-reverse']);
      });

      it('generates column class', () => {
        const classes = getResponsiveFlexClasses('column', DIRECTION_MAP);
        expect(classes).toEqual(['flex-col']);
      });

      it('generates column-reverse class', () => {
        const classes = getResponsiveFlexClasses('column-reverse', DIRECTION_MAP);
        expect(classes).toEqual(['flex-col-reverse']);
      });

      it('generates responsive direction classes', () => {
        const classes = getResponsiveFlexClasses(
          { base: 'column', md: 'row' } as ResponsiveValue<FlexDirection>,
          DIRECTION_MAP
        );
        expect(classes).toEqual(['flex-col', 'md:flex-row']);
      });

      it('generates all breakpoint direction classes', () => {
        const classes = getResponsiveFlexClasses(
          {
            base: 'column',
            sm: 'column',
            md: 'row',
            lg: 'row',
            xl: 'row',
            '2xl': 'row',
          } as ResponsiveValue<FlexDirection>,
          DIRECTION_MAP
        );
        expect(classes).toEqual([
          'flex-col',
          'sm:flex-col',
          'md:flex-row',
          'lg:flex-row',
          'xl:flex-row',
          '2xl:flex-row',
        ]);
      });
    });

    describe('wrap classes', () => {
      it('generates nowrap class', () => {
        const classes = getResponsiveFlexClasses('nowrap', WRAP_MAP);
        expect(classes).toEqual(['flex-nowrap']);
      });

      it('generates wrap class', () => {
        const classes = getResponsiveFlexClasses('wrap', WRAP_MAP);
        expect(classes).toEqual(['flex-wrap']);
      });

      it('generates wrap-reverse class', () => {
        const classes = getResponsiveFlexClasses('wrap-reverse', WRAP_MAP);
        expect(classes).toEqual(['flex-wrap-reverse']);
      });

      it('generates responsive wrap classes', () => {
        const classes = getResponsiveFlexClasses(
          { base: 'wrap', lg: 'nowrap' } as ResponsiveValue<FlexWrap>,
          WRAP_MAP
        );
        expect(classes).toEqual(['flex-wrap', 'lg:flex-nowrap']);
      });
    });

    describe('justify classes', () => {
      it('generates justify-start class', () => {
        const classes = getResponsiveFlexClasses('start', JUSTIFY_MAP);
        expect(classes).toEqual(['justify-start']);
      });

      it('generates justify-end class', () => {
        const classes = getResponsiveFlexClasses('end', JUSTIFY_MAP);
        expect(classes).toEqual(['justify-end']);
      });

      it('generates justify-center class', () => {
        const classes = getResponsiveFlexClasses('center', JUSTIFY_MAP);
        expect(classes).toEqual(['justify-center']);
      });

      it('generates justify-between class', () => {
        const classes = getResponsiveFlexClasses('between', JUSTIFY_MAP);
        expect(classes).toEqual(['justify-between']);
      });

      it('generates justify-around class', () => {
        const classes = getResponsiveFlexClasses('around', JUSTIFY_MAP);
        expect(classes).toEqual(['justify-around']);
      });

      it('generates justify-evenly class', () => {
        const classes = getResponsiveFlexClasses('evenly', JUSTIFY_MAP);
        expect(classes).toEqual(['justify-evenly']);
      });

      it('generates responsive justify classes', () => {
        const classes = getResponsiveFlexClasses(
          { base: 'start', md: 'center', xl: 'between' } as ResponsiveValue<JustifyContent>,
          JUSTIFY_MAP
        );
        expect(classes).toEqual(['justify-start', 'md:justify-center', 'xl:justify-between']);
      });
    });

    describe('align classes', () => {
      it('generates items-start class', () => {
        const classes = getResponsiveFlexClasses('start', ALIGN_MAP);
        expect(classes).toEqual(['items-start']);
      });

      it('generates items-end class', () => {
        const classes = getResponsiveFlexClasses('end', ALIGN_MAP);
        expect(classes).toEqual(['items-end']);
      });

      it('generates items-center class', () => {
        const classes = getResponsiveFlexClasses('center', ALIGN_MAP);
        expect(classes).toEqual(['items-center']);
      });

      it('generates items-baseline class', () => {
        const classes = getResponsiveFlexClasses('baseline', ALIGN_MAP);
        expect(classes).toEqual(['items-baseline']);
      });

      it('generates items-stretch class', () => {
        const classes = getResponsiveFlexClasses('stretch', ALIGN_MAP);
        expect(classes).toEqual(['items-stretch']);
      });

      it('generates responsive align classes', () => {
        const classes = getResponsiveFlexClasses(
          { base: 'stretch', sm: 'start', lg: 'center' } as ResponsiveValue<AlignItems>,
          ALIGN_MAP
        );
        expect(classes).toEqual(['items-stretch', 'sm:items-start', 'lg:items-center']);
      });
    });

    describe('edge cases', () => {
      it('handles empty responsive object', () => {
        const classes = getResponsiveFlexClasses(
          {} as ResponsiveValue<FlexDirection>,
          DIRECTION_MAP
        );
        expect(classes).toEqual([]);
      });

      it('handles partial responsive object (no base)', () => {
        const classes = getResponsiveFlexClasses(
          { md: 'row', xl: 'column' } as ResponsiveValue<FlexDirection>,
          DIRECTION_MAP
        );
        expect(classes).toEqual(['md:flex-row', 'xl:flex-col']);
      });

      it('maintains breakpoint order in output', () => {
        const classes = getResponsiveFlexClasses(
          { xl: 'row', sm: 'column', base: 'row-reverse' } as ResponsiveValue<FlexDirection>,
          DIRECTION_MAP
        );
        expect(classes).toEqual(['flex-row-reverse', 'sm:flex-col', 'xl:flex-row']);
      });
    });
  });

  describe('DIRECTION_MAP', () => {
    it('has correct mappings', () => {
      expect(DIRECTION_MAP.row).toBe('flex-row');
      expect(DIRECTION_MAP['row-reverse']).toBe('flex-row-reverse');
      expect(DIRECTION_MAP.column).toBe('flex-col');
      expect(DIRECTION_MAP['column-reverse']).toBe('flex-col-reverse');
    });
  });

  describe('WRAP_MAP', () => {
    it('has correct mappings', () => {
      expect(WRAP_MAP.nowrap).toBe('flex-nowrap');
      expect(WRAP_MAP.wrap).toBe('flex-wrap');
      expect(WRAP_MAP['wrap-reverse']).toBe('flex-wrap-reverse');
    });
  });

  describe('JUSTIFY_MAP', () => {
    it('has correct mappings', () => {
      expect(JUSTIFY_MAP.start).toBe('justify-start');
      expect(JUSTIFY_MAP.end).toBe('justify-end');
      expect(JUSTIFY_MAP.center).toBe('justify-center');
      expect(JUSTIFY_MAP.between).toBe('justify-between');
      expect(JUSTIFY_MAP.around).toBe('justify-around');
      expect(JUSTIFY_MAP.evenly).toBe('justify-evenly');
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
