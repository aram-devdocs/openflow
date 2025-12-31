/**
 * Text primitive utility function tests
 *
 * These tests verify the typography class generation logic.
 * Component rendering is tested via Storybook.
 */

import { describe, expect, it } from 'vitest';

/**
 * Re-implement the typography class generation functions for testing
 * (mirrors the logic in Text.tsx)
 */

type Breakpoint = 'base' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
type ResponsiveValue<T> = T | Partial<Record<Breakpoint, T>>;

type TextSize =
  | 'xs'
  | 'sm'
  | 'base'
  | 'lg'
  | 'xl'
  | '2xl'
  | '3xl'
  | '4xl'
  | '5xl'
  | '6xl'
  | '7xl'
  | '8xl'
  | '9xl';
type FontWeight =
  | 'thin'
  | 'extralight'
  | 'light'
  | 'normal'
  | 'medium'
  | 'semibold'
  | 'bold'
  | 'extrabold'
  | 'black';
type TextAlign = 'left' | 'center' | 'right' | 'justify';
type Tracking = 'tighter' | 'tight' | 'normal' | 'wide' | 'wider' | 'widest';
type Leading = 'none' | 'tight' | 'snug' | 'normal' | 'relaxed' | 'loose';
type LineClamp = 1 | 2 | 3 | 4 | 5 | 6;
type WordBreak = 'normal' | 'words' | 'all' | 'keep';
type WhiteSpace = 'normal' | 'nowrap' | 'pre' | 'pre-line' | 'pre-wrap' | 'break-spaces';

const BREAKPOINT_ORDER: Breakpoint[] = ['base', 'sm', 'md', 'lg', 'xl', '2xl'];

const TEXT_SIZE_MAP: Record<TextSize, string> = {
  xs: 'text-xs',
  sm: 'text-sm',
  base: 'text-base',
  lg: 'text-lg',
  xl: 'text-xl',
  '2xl': 'text-2xl',
  '3xl': 'text-3xl',
  '4xl': 'text-4xl',
  '5xl': 'text-5xl',
  '6xl': 'text-6xl',
  '7xl': 'text-7xl',
  '8xl': 'text-8xl',
  '9xl': 'text-9xl',
};

const FONT_WEIGHT_MAP: Record<FontWeight, string> = {
  thin: 'font-thin',
  extralight: 'font-extralight',
  light: 'font-light',
  normal: 'font-normal',
  medium: 'font-medium',
  semibold: 'font-semibold',
  bold: 'font-bold',
  extrabold: 'font-extrabold',
  black: 'font-black',
};

const TEXT_ALIGN_MAP: Record<TextAlign, string> = {
  left: 'text-left',
  center: 'text-center',
  right: 'text-right',
  justify: 'text-justify',
};

const TRACKING_MAP: Record<Tracking, string> = {
  tighter: 'tracking-tighter',
  tight: 'tracking-tight',
  normal: 'tracking-normal',
  wide: 'tracking-wide',
  wider: 'tracking-wider',
  widest: 'tracking-widest',
};

const LEADING_MAP: Record<Leading, string> = {
  none: 'leading-none',
  tight: 'leading-tight',
  snug: 'leading-snug',
  normal: 'leading-normal',
  relaxed: 'leading-relaxed',
  loose: 'leading-loose',
};

const LINE_CLAMP_MAP: Record<LineClamp, string> = {
  1: 'line-clamp-1',
  2: 'line-clamp-2',
  3: 'line-clamp-3',
  4: 'line-clamp-4',
  5: 'line-clamp-5',
  6: 'line-clamp-6',
};

const WORD_BREAK_MAP: Record<WordBreak, string> = {
  normal: 'break-normal',
  words: 'break-words',
  all: 'break-all',
  keep: 'break-keep',
};

const WHITE_SPACE_MAP: Record<WhiteSpace, string> = {
  normal: 'whitespace-normal',
  nowrap: 'whitespace-nowrap',
  pre: 'whitespace-pre',
  'pre-line': 'whitespace-pre-line',
  'pre-wrap': 'whitespace-pre-wrap',
  'break-spaces': 'whitespace-break-spaces',
};

function getResponsiveClasses<T extends string | number>(
  value: ResponsiveValue<T>,
  map: Record<T, string>
): string[] {
  const classes: string[] = [];

  if (typeof value === 'string' || typeof value === 'number') {
    const mappedClass = map[value as T];
    if (mappedClass) {
      classes.push(mappedClass);
    }
  } else if (typeof value === 'object' && value !== null) {
    for (const breakpoint of BREAKPOINT_ORDER) {
      const breakpointValue = (value as Partial<Record<Breakpoint, T>>)[breakpoint];
      if (breakpointValue !== undefined) {
        const mappedClass = map[breakpointValue];
        if (mappedClass) {
          if (breakpoint === 'base') {
            classes.push(mappedClass);
          } else {
            classes.push(`${breakpoint}:${mappedClass}`);
          }
        }
      }
    }
  }

  return classes;
}

function getColorClass(color: string): string {
  if (color.includes('-') && !color.match(/^\d/)) {
    const isStandardTailwind = /^[a-z]+-\d{2,3}$/.test(color);
    if (isStandardTailwind) {
      return `text-${color}`;
    }
    return `text-[rgb(var(--${color}))]`;
  }
  return `text-${color}`;
}

describe('primitives/Text - Utility Functions', () => {
  describe('getResponsiveClasses with TEXT_SIZE_MAP', () => {
    it('generates correct class for single size value', () => {
      const classes = getResponsiveClasses('base', TEXT_SIZE_MAP);
      expect(classes).toEqual(['text-base']);
    });

    it('generates correct classes for all size values', () => {
      const sizes: TextSize[] = [
        'xs',
        'sm',
        'base',
        'lg',
        'xl',
        '2xl',
        '3xl',
        '4xl',
        '5xl',
        '6xl',
        '7xl',
        '8xl',
        '9xl',
      ];
      for (const size of sizes) {
        const classes = getResponsiveClasses(size, TEXT_SIZE_MAP);
        expect(classes).toEqual([`text-${size}`]);
      }
    });

    it('generates responsive classes for object value', () => {
      const classes = getResponsiveClasses(
        { base: 'sm', md: 'base', lg: 'lg' } as ResponsiveValue<TextSize>,
        TEXT_SIZE_MAP
      );
      expect(classes).toEqual(['text-sm', 'md:text-base', 'lg:text-lg']);
    });

    it('generates all breakpoint classes', () => {
      const classes = getResponsiveClasses(
        {
          base: 'xs',
          sm: 'sm',
          md: 'base',
          lg: 'lg',
          xl: 'xl',
          '2xl': '2xl',
        } as ResponsiveValue<TextSize>,
        TEXT_SIZE_MAP
      );
      expect(classes).toEqual([
        'text-xs',
        'sm:text-sm',
        'md:text-base',
        'lg:text-lg',
        'xl:text-xl',
        '2xl:text-2xl',
      ]);
    });

    it('handles partial responsive objects (no base)', () => {
      const classes = getResponsiveClasses(
        { md: 'lg', xl: '2xl' } as ResponsiveValue<TextSize>,
        TEXT_SIZE_MAP
      );
      expect(classes).toEqual(['md:text-lg', 'xl:text-2xl']);
    });

    it('returns empty array for empty object', () => {
      const classes = getResponsiveClasses({}, TEXT_SIZE_MAP);
      expect(classes).toEqual([]);
    });
  });

  describe('getResponsiveClasses with FONT_WEIGHT_MAP', () => {
    it('generates correct class for single weight value', () => {
      const classes = getResponsiveClasses('bold', FONT_WEIGHT_MAP);
      expect(classes).toEqual(['font-bold']);
    });

    it('generates correct classes for all weight values', () => {
      const weights: FontWeight[] = [
        'thin',
        'extralight',
        'light',
        'normal',
        'medium',
        'semibold',
        'bold',
        'extrabold',
        'black',
      ];
      for (const weight of weights) {
        const classes = getResponsiveClasses(weight, FONT_WEIGHT_MAP);
        expect(classes).toEqual([`font-${weight}`]);
      }
    });

    it('generates responsive classes for object value', () => {
      const classes = getResponsiveClasses(
        { base: 'normal', md: 'medium', lg: 'bold' } as ResponsiveValue<FontWeight>,
        FONT_WEIGHT_MAP
      );
      expect(classes).toEqual(['font-normal', 'md:font-medium', 'lg:font-bold']);
    });
  });

  describe('getResponsiveClasses with TEXT_ALIGN_MAP', () => {
    it('generates correct classes for all align values', () => {
      const alignments: TextAlign[] = ['left', 'center', 'right', 'justify'];
      for (const align of alignments) {
        const classes = getResponsiveClasses(align, TEXT_ALIGN_MAP);
        expect(classes).toEqual([`text-${align}`]);
      }
    });

    it('generates responsive alignment classes', () => {
      const classes = getResponsiveClasses(
        { base: 'center', md: 'left', lg: 'right' } as ResponsiveValue<TextAlign>,
        TEXT_ALIGN_MAP
      );
      expect(classes).toEqual(['text-center', 'md:text-left', 'lg:text-right']);
    });
  });

  describe('getResponsiveClasses with TRACKING_MAP', () => {
    it('generates correct classes for all tracking values', () => {
      expect(getResponsiveClasses('tighter', TRACKING_MAP)).toEqual(['tracking-tighter']);
      expect(getResponsiveClasses('tight', TRACKING_MAP)).toEqual(['tracking-tight']);
      expect(getResponsiveClasses('normal', TRACKING_MAP)).toEqual(['tracking-normal']);
      expect(getResponsiveClasses('wide', TRACKING_MAP)).toEqual(['tracking-wide']);
      expect(getResponsiveClasses('wider', TRACKING_MAP)).toEqual(['tracking-wider']);
      expect(getResponsiveClasses('widest', TRACKING_MAP)).toEqual(['tracking-widest']);
    });

    it('generates responsive tracking classes', () => {
      const classes = getResponsiveClasses(
        { base: 'normal', lg: 'wide' } as ResponsiveValue<Tracking>,
        TRACKING_MAP
      );
      expect(classes).toEqual(['tracking-normal', 'lg:tracking-wide']);
    });
  });

  describe('getResponsiveClasses with LEADING_MAP', () => {
    it('generates correct classes for all leading values', () => {
      expect(getResponsiveClasses('none', LEADING_MAP)).toEqual(['leading-none']);
      expect(getResponsiveClasses('tight', LEADING_MAP)).toEqual(['leading-tight']);
      expect(getResponsiveClasses('snug', LEADING_MAP)).toEqual(['leading-snug']);
      expect(getResponsiveClasses('normal', LEADING_MAP)).toEqual(['leading-normal']);
      expect(getResponsiveClasses('relaxed', LEADING_MAP)).toEqual(['leading-relaxed']);
      expect(getResponsiveClasses('loose', LEADING_MAP)).toEqual(['leading-loose']);
    });

    it('generates responsive leading classes', () => {
      const classes = getResponsiveClasses(
        { base: 'normal', md: 'relaxed', lg: 'loose' } as ResponsiveValue<Leading>,
        LEADING_MAP
      );
      expect(classes).toEqual(['leading-normal', 'md:leading-relaxed', 'lg:leading-loose']);
    });
  });

  describe('LINE_CLAMP_MAP', () => {
    it('has correct line clamp classes', () => {
      expect(LINE_CLAMP_MAP[1]).toBe('line-clamp-1');
      expect(LINE_CLAMP_MAP[2]).toBe('line-clamp-2');
      expect(LINE_CLAMP_MAP[3]).toBe('line-clamp-3');
      expect(LINE_CLAMP_MAP[4]).toBe('line-clamp-4');
      expect(LINE_CLAMP_MAP[5]).toBe('line-clamp-5');
      expect(LINE_CLAMP_MAP[6]).toBe('line-clamp-6');
    });
  });

  describe('WORD_BREAK_MAP', () => {
    it('has correct word break classes', () => {
      expect(WORD_BREAK_MAP.normal).toBe('break-normal');
      expect(WORD_BREAK_MAP.words).toBe('break-words');
      expect(WORD_BREAK_MAP.all).toBe('break-all');
      expect(WORD_BREAK_MAP.keep).toBe('break-keep');
    });
  });

  describe('WHITE_SPACE_MAP', () => {
    it('has correct whitespace classes', () => {
      expect(WHITE_SPACE_MAP.normal).toBe('whitespace-normal');
      expect(WHITE_SPACE_MAP.nowrap).toBe('whitespace-nowrap');
      expect(WHITE_SPACE_MAP.pre).toBe('whitespace-pre');
      expect(WHITE_SPACE_MAP['pre-line']).toBe('whitespace-pre-line');
      expect(WHITE_SPACE_MAP['pre-wrap']).toBe('whitespace-pre-wrap');
      expect(WHITE_SPACE_MAP['break-spaces']).toBe('whitespace-break-spaces');
    });
  });

  describe('getColorClass', () => {
    it('generates correct class for standard Tailwind colors', () => {
      expect(getColorClass('red-500')).toBe('text-red-500');
      expect(getColorClass('blue-600')).toBe('text-blue-600');
      expect(getColorClass('green-50')).toBe('text-green-50');
      expect(getColorClass('purple-900')).toBe('text-purple-900');
    });

    it('generates CSS variable class for custom colors', () => {
      expect(getColorClass('muted-foreground')).toBe('text-[rgb(var(--muted-foreground))]');
      expect(getColorClass('primary')).toBe('text-primary');
      expect(getColorClass('accent-foreground')).toBe('text-[rgb(var(--accent-foreground))]');
    });

    it('handles single word colors', () => {
      expect(getColorClass('white')).toBe('text-white');
      expect(getColorClass('black')).toBe('text-black');
      expect(getColorClass('inherit')).toBe('text-inherit');
      expect(getColorClass('current')).toBe('text-current');
      expect(getColorClass('transparent')).toBe('text-transparent');
    });
  });

  describe('BREAKPOINT_ORDER', () => {
    it('has correct order', () => {
      expect(BREAKPOINT_ORDER).toEqual(['base', 'sm', 'md', 'lg', 'xl', '2xl']);
    });
  });

  describe('TEXT_SIZE_MAP', () => {
    it('has all text size classes', () => {
      expect(TEXT_SIZE_MAP.xs).toBe('text-xs');
      expect(TEXT_SIZE_MAP.sm).toBe('text-sm');
      expect(TEXT_SIZE_MAP.base).toBe('text-base');
      expect(TEXT_SIZE_MAP.lg).toBe('text-lg');
      expect(TEXT_SIZE_MAP.xl).toBe('text-xl');
      expect(TEXT_SIZE_MAP['2xl']).toBe('text-2xl');
      expect(TEXT_SIZE_MAP['3xl']).toBe('text-3xl');
      expect(TEXT_SIZE_MAP['4xl']).toBe('text-4xl');
      expect(TEXT_SIZE_MAP['5xl']).toBe('text-5xl');
      expect(TEXT_SIZE_MAP['6xl']).toBe('text-6xl');
      expect(TEXT_SIZE_MAP['7xl']).toBe('text-7xl');
      expect(TEXT_SIZE_MAP['8xl']).toBe('text-8xl');
      expect(TEXT_SIZE_MAP['9xl']).toBe('text-9xl');
    });
  });

  describe('FONT_WEIGHT_MAP', () => {
    it('has all font weight classes', () => {
      expect(FONT_WEIGHT_MAP.thin).toBe('font-thin');
      expect(FONT_WEIGHT_MAP.extralight).toBe('font-extralight');
      expect(FONT_WEIGHT_MAP.light).toBe('font-light');
      expect(FONT_WEIGHT_MAP.normal).toBe('font-normal');
      expect(FONT_WEIGHT_MAP.medium).toBe('font-medium');
      expect(FONT_WEIGHT_MAP.semibold).toBe('font-semibold');
      expect(FONT_WEIGHT_MAP.bold).toBe('font-bold');
      expect(FONT_WEIGHT_MAP.extrabold).toBe('font-extrabold');
      expect(FONT_WEIGHT_MAP.black).toBe('font-black');
    });
  });

  describe('edge cases', () => {
    it('maintains breakpoint order in output', () => {
      // Even if provided in different order, output should follow BREAKPOINT_ORDER
      const classes = getResponsiveClasses(
        { xl: 'xl', sm: 'sm', base: 'xs' } as ResponsiveValue<TextSize>,
        TEXT_SIZE_MAP
      );
      expect(classes).toEqual(['text-xs', 'sm:text-sm', 'xl:text-xl']);
    });

    it('handles numeric values in responsive objects', () => {
      // Testing with line clamp which uses numbers
      const value: ResponsiveValue<LineClamp> = { base: 1, md: 2, lg: 3 };
      const classes: string[] = [];

      for (const breakpoint of BREAKPOINT_ORDER) {
        const breakpointValue = value[breakpoint];
        if (breakpointValue !== undefined) {
          const mappedClass = LINE_CLAMP_MAP[breakpointValue];
          if (mappedClass) {
            if (breakpoint === 'base') {
              classes.push(mappedClass);
            } else {
              classes.push(`${breakpoint}:${mappedClass}`);
            }
          }
        }
      }

      expect(classes).toEqual(['line-clamp-1', 'md:line-clamp-2', 'lg:line-clamp-3']);
    });
  });
});
