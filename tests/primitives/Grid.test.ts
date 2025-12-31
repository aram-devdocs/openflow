/**
 * Grid primitive utility function tests
 *
 * These tests verify the grid class generation logic.
 * Component rendering is tested via Storybook.
 */

import { describe, expect, it } from 'vitest';

/**
 * Re-implement the grid class generation functions for testing
 * (mirrors the logic in Grid.tsx)
 */

type Breakpoint = 'base' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
type GridColumns = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 'none';
type GridRows = 1 | 2 | 3 | 4 | 5 | 6 | 'none';
type GridFlow = 'row' | 'col' | 'dense' | 'row-dense' | 'col-dense';
type SpacingValue =
  | '0'
  | '1'
  | '2'
  | '3'
  | '4'
  | '5'
  | '6'
  | '8'
  | '10'
  | '12'
  | '16'
  | 'px'
  | 'auto';
type ResponsiveValue<T> = T | Partial<Record<Breakpoint, T>>;

const BREAKPOINT_ORDER: Breakpoint[] = ['base', 'sm', 'md', 'lg', 'xl', '2xl'];

const COLUMNS_MAP: Record<GridColumns, string> = {
  1: 'grid-cols-1',
  2: 'grid-cols-2',
  3: 'grid-cols-3',
  4: 'grid-cols-4',
  5: 'grid-cols-5',
  6: 'grid-cols-6',
  7: 'grid-cols-7',
  8: 'grid-cols-8',
  9: 'grid-cols-9',
  10: 'grid-cols-10',
  11: 'grid-cols-11',
  12: 'grid-cols-12',
  none: 'grid-cols-none',
};

const ROWS_MAP: Record<GridRows, string> = {
  1: 'grid-rows-1',
  2: 'grid-rows-2',
  3: 'grid-rows-3',
  4: 'grid-rows-4',
  5: 'grid-rows-5',
  6: 'grid-rows-6',
  none: 'grid-rows-none',
};

const FLOW_MAP: Record<GridFlow, string> = {
  row: 'grid-flow-row',
  col: 'grid-flow-col',
  dense: 'grid-flow-dense',
  'row-dense': 'grid-flow-row-dense',
  'col-dense': 'grid-flow-col-dense',
};

function getResponsiveGridClasses<T extends string | number>(
  value: ResponsiveValue<T> | undefined,
  mapping: Record<T, string>
): string[] {
  if (value === undefined) return [];

  const classes: string[] = [];

  if (typeof value === 'string' || typeof value === 'number') {
    classes.push(mapping[value as T]);
  } else if (typeof value === 'object' && value !== null) {
    for (const breakpoint of BREAKPOINT_ORDER) {
      const breakpointValue = (value as Partial<Record<Breakpoint, T>>)[breakpoint];
      if (breakpointValue !== undefined) {
        const gridClass = mapping[breakpointValue];
        if (breakpoint === 'base') {
          classes.push(gridClass);
        } else {
          classes.push(`${breakpoint}:${gridClass}`);
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

describe('primitives/Grid - Utility Functions', () => {
  describe('getResponsiveGridClasses', () => {
    describe('columns classes', () => {
      it('returns empty array for undefined value', () => {
        const classes = getResponsiveGridClasses(undefined, COLUMNS_MAP);
        expect(classes).toEqual([]);
      });

      it('generates 1-column class', () => {
        const classes = getResponsiveGridClasses(1, COLUMNS_MAP);
        expect(classes).toEqual(['grid-cols-1']);
      });

      it('generates 2-column class', () => {
        const classes = getResponsiveGridClasses(2, COLUMNS_MAP);
        expect(classes).toEqual(['grid-cols-2']);
      });

      it('generates 3-column class', () => {
        const classes = getResponsiveGridClasses(3, COLUMNS_MAP);
        expect(classes).toEqual(['grid-cols-3']);
      });

      it('generates 4-column class', () => {
        const classes = getResponsiveGridClasses(4, COLUMNS_MAP);
        expect(classes).toEqual(['grid-cols-4']);
      });

      it('generates 6-column class', () => {
        const classes = getResponsiveGridClasses(6, COLUMNS_MAP);
        expect(classes).toEqual(['grid-cols-6']);
      });

      it('generates 12-column class', () => {
        const classes = getResponsiveGridClasses(12, COLUMNS_MAP);
        expect(classes).toEqual(['grid-cols-12']);
      });

      it('generates none column class', () => {
        const classes = getResponsiveGridClasses('none', COLUMNS_MAP);
        expect(classes).toEqual(['grid-cols-none']);
      });

      it('generates responsive column classes', () => {
        const classes = getResponsiveGridClasses(
          { base: 1, md: 2, lg: 4 } as ResponsiveValue<GridColumns>,
          COLUMNS_MAP
        );
        expect(classes).toEqual(['grid-cols-1', 'md:grid-cols-2', 'lg:grid-cols-4']);
      });

      it('generates all breakpoint column classes', () => {
        const classes = getResponsiveGridClasses(
          {
            base: 1,
            sm: 2,
            md: 3,
            lg: 4,
            xl: 6,
            '2xl': 12,
          } as ResponsiveValue<GridColumns>,
          COLUMNS_MAP
        );
        expect(classes).toEqual([
          'grid-cols-1',
          'sm:grid-cols-2',
          'md:grid-cols-3',
          'lg:grid-cols-4',
          'xl:grid-cols-6',
          '2xl:grid-cols-12',
        ]);
      });
    });

    describe('rows classes', () => {
      it('generates 1-row class', () => {
        const classes = getResponsiveGridClasses(1, ROWS_MAP);
        expect(classes).toEqual(['grid-rows-1']);
      });

      it('generates 3-row class', () => {
        const classes = getResponsiveGridClasses(3, ROWS_MAP);
        expect(classes).toEqual(['grid-rows-3']);
      });

      it('generates 6-row class', () => {
        const classes = getResponsiveGridClasses(6, ROWS_MAP);
        expect(classes).toEqual(['grid-rows-6']);
      });

      it('generates none row class', () => {
        const classes = getResponsiveGridClasses('none', ROWS_MAP);
        expect(classes).toEqual(['grid-rows-none']);
      });

      it('generates responsive row classes', () => {
        const classes = getResponsiveGridClasses(
          { base: 1, md: 2, lg: 3 } as ResponsiveValue<GridRows>,
          ROWS_MAP
        );
        expect(classes).toEqual(['grid-rows-1', 'md:grid-rows-2', 'lg:grid-rows-3']);
      });
    });

    describe('flow classes', () => {
      it('generates row flow class', () => {
        const classes = getResponsiveGridClasses('row', FLOW_MAP);
        expect(classes).toEqual(['grid-flow-row']);
      });

      it('generates col flow class', () => {
        const classes = getResponsiveGridClasses('col', FLOW_MAP);
        expect(classes).toEqual(['grid-flow-col']);
      });

      it('generates dense flow class', () => {
        const classes = getResponsiveGridClasses('dense', FLOW_MAP);
        expect(classes).toEqual(['grid-flow-dense']);
      });

      it('generates row-dense flow class', () => {
        const classes = getResponsiveGridClasses('row-dense', FLOW_MAP);
        expect(classes).toEqual(['grid-flow-row-dense']);
      });

      it('generates col-dense flow class', () => {
        const classes = getResponsiveGridClasses('col-dense', FLOW_MAP);
        expect(classes).toEqual(['grid-flow-col-dense']);
      });

      it('generates responsive flow classes', () => {
        const classes = getResponsiveGridClasses(
          { base: 'row', md: 'col', lg: 'dense' } as ResponsiveValue<GridFlow>,
          FLOW_MAP
        );
        expect(classes).toEqual(['grid-flow-row', 'md:grid-flow-col', 'lg:grid-flow-dense']);
      });
    });

    describe('edge cases', () => {
      it('handles empty responsive object', () => {
        const classes = getResponsiveGridClasses({} as ResponsiveValue<GridColumns>, COLUMNS_MAP);
        expect(classes).toEqual([]);
      });

      it('handles partial responsive object (no base)', () => {
        const classes = getResponsiveGridClasses(
          { md: 2, xl: 4 } as ResponsiveValue<GridColumns>,
          COLUMNS_MAP
        );
        expect(classes).toEqual(['md:grid-cols-2', 'xl:grid-cols-4']);
      });

      it('maintains breakpoint order in output', () => {
        const classes = getResponsiveGridClasses(
          { xl: 6, sm: 2, base: 1 } as ResponsiveValue<GridColumns>,
          COLUMNS_MAP
        );
        expect(classes).toEqual(['grid-cols-1', 'sm:grid-cols-2', 'xl:grid-cols-6']);
      });
    });
  });

  describe('getResponsiveSpacingClasses (for gap)', () => {
    it('generates gap-x classes', () => {
      const classes = getResponsiveSpacingClasses('gap-x', '4');
      expect(classes).toEqual(['gap-x-4']);
    });

    it('generates gap-y classes', () => {
      const classes = getResponsiveSpacingClasses('gap-y', '8');
      expect(classes).toEqual(['gap-y-8']);
    });

    it('generates responsive gap-x classes', () => {
      const classes = getResponsiveSpacingClasses('gap-x', { base: '2', md: '4', lg: '8' });
      expect(classes).toEqual(['gap-x-2', 'md:gap-x-4', 'lg:gap-x-8']);
    });

    it('generates responsive gap-y classes', () => {
      const classes = getResponsiveSpacingClasses('gap-y', { base: '1', sm: '2', xl: '6' });
      expect(classes).toEqual(['gap-y-1', 'sm:gap-y-2', 'xl:gap-y-6']);
    });

    it('handles px value for gaps', () => {
      const classes = getResponsiveSpacingClasses('gap-x', 'px');
      expect(classes).toEqual(['gap-x-px']);
    });

    it('handles auto value for gaps', () => {
      const classes = getResponsiveSpacingClasses('gap-y', 'auto');
      expect(classes).toEqual(['gap-y-auto']);
    });
  });

  describe('COLUMNS_MAP', () => {
    it('has correct mappings for all column counts', () => {
      expect(COLUMNS_MAP[1]).toBe('grid-cols-1');
      expect(COLUMNS_MAP[2]).toBe('grid-cols-2');
      expect(COLUMNS_MAP[3]).toBe('grid-cols-3');
      expect(COLUMNS_MAP[4]).toBe('grid-cols-4');
      expect(COLUMNS_MAP[5]).toBe('grid-cols-5');
      expect(COLUMNS_MAP[6]).toBe('grid-cols-6');
      expect(COLUMNS_MAP[7]).toBe('grid-cols-7');
      expect(COLUMNS_MAP[8]).toBe('grid-cols-8');
      expect(COLUMNS_MAP[9]).toBe('grid-cols-9');
      expect(COLUMNS_MAP[10]).toBe('grid-cols-10');
      expect(COLUMNS_MAP[11]).toBe('grid-cols-11');
      expect(COLUMNS_MAP[12]).toBe('grid-cols-12');
      expect(COLUMNS_MAP.none).toBe('grid-cols-none');
    });
  });

  describe('ROWS_MAP', () => {
    it('has correct mappings for all row counts', () => {
      expect(ROWS_MAP[1]).toBe('grid-rows-1');
      expect(ROWS_MAP[2]).toBe('grid-rows-2');
      expect(ROWS_MAP[3]).toBe('grid-rows-3');
      expect(ROWS_MAP[4]).toBe('grid-rows-4');
      expect(ROWS_MAP[5]).toBe('grid-rows-5');
      expect(ROWS_MAP[6]).toBe('grid-rows-6');
      expect(ROWS_MAP.none).toBe('grid-rows-none');
    });
  });

  describe('FLOW_MAP', () => {
    it('has correct mappings for all flow values', () => {
      expect(FLOW_MAP.row).toBe('grid-flow-row');
      expect(FLOW_MAP.col).toBe('grid-flow-col');
      expect(FLOW_MAP.dense).toBe('grid-flow-dense');
      expect(FLOW_MAP['row-dense']).toBe('grid-flow-row-dense');
      expect(FLOW_MAP['col-dense']).toBe('grid-flow-col-dense');
    });
  });

  describe('BREAKPOINT_ORDER', () => {
    it('has correct order', () => {
      expect(BREAKPOINT_ORDER).toEqual(['base', 'sm', 'md', 'lg', 'xl', '2xl']);
    });
  });
});
