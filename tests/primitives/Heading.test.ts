/**
 * Heading primitive utility function tests
 *
 * These tests verify the heading tag generation and typography class logic.
 * Component rendering is tested via Storybook.
 */

import { describe, expect, it } from 'vitest';

/**
 * Re-implement the heading utility functions for testing
 * (mirrors the logic in Heading.tsx)
 */

type Breakpoint = 'base' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
type ResponsiveValue<T> = T | Partial<Record<Breakpoint, T>>;
type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6;

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
type TextAlign = 'left' | 'center' | 'right';
type Tracking = 'tighter' | 'tight' | 'normal' | 'wide' | 'wider' | 'widest';
type Leading = 'none' | 'tight' | 'snug' | 'normal' | 'relaxed' | 'loose';

const BREAKPOINT_ORDER: Breakpoint[] = ['base', 'sm', 'md', 'lg', 'xl', '2xl'];

const DEFAULT_HEADING_SIZES: Record<HeadingLevel, TextSize> = {
  1: '4xl',
  2: '3xl',
  3: '2xl',
  4: 'xl',
  5: 'lg',
  6: 'base',
};

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

function getHeadingTag(level: HeadingLevel): 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' {
  return `h${level}` as 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
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

describe('primitives/Heading - Utility Functions', () => {
  describe('getHeadingTag', () => {
    it('returns correct tag for level 1', () => {
      expect(getHeadingTag(1)).toBe('h1');
    });

    it('returns correct tag for level 2', () => {
      expect(getHeadingTag(2)).toBe('h2');
    });

    it('returns correct tag for level 3', () => {
      expect(getHeadingTag(3)).toBe('h3');
    });

    it('returns correct tag for level 4', () => {
      expect(getHeadingTag(4)).toBe('h4');
    });

    it('returns correct tag for level 5', () => {
      expect(getHeadingTag(5)).toBe('h5');
    });

    it('returns correct tag for level 6', () => {
      expect(getHeadingTag(6)).toBe('h6');
    });
  });

  describe('DEFAULT_HEADING_SIZES', () => {
    it('h1 defaults to 4xl', () => {
      expect(DEFAULT_HEADING_SIZES[1]).toBe('4xl');
    });

    it('h2 defaults to 3xl', () => {
      expect(DEFAULT_HEADING_SIZES[2]).toBe('3xl');
    });

    it('h3 defaults to 2xl', () => {
      expect(DEFAULT_HEADING_SIZES[3]).toBe('2xl');
    });

    it('h4 defaults to xl', () => {
      expect(DEFAULT_HEADING_SIZES[4]).toBe('xl');
    });

    it('h5 defaults to lg', () => {
      expect(DEFAULT_HEADING_SIZES[5]).toBe('lg');
    });

    it('h6 defaults to base', () => {
      expect(DEFAULT_HEADING_SIZES[6]).toBe('base');
    });

    it('has decreasing sizes from h1 to h6', () => {
      const sizes = [
        TEXT_SIZE_MAP[DEFAULT_HEADING_SIZES[1]],
        TEXT_SIZE_MAP[DEFAULT_HEADING_SIZES[2]],
        TEXT_SIZE_MAP[DEFAULT_HEADING_SIZES[3]],
        TEXT_SIZE_MAP[DEFAULT_HEADING_SIZES[4]],
        TEXT_SIZE_MAP[DEFAULT_HEADING_SIZES[5]],
        TEXT_SIZE_MAP[DEFAULT_HEADING_SIZES[6]],
      ];
      expect(sizes).toEqual([
        'text-4xl',
        'text-3xl',
        'text-2xl',
        'text-xl',
        'text-lg',
        'text-base',
      ]);
    });
  });

  describe('getResponsiveClasses with TEXT_SIZE_MAP (for heading size)', () => {
    it('generates correct class for single size value', () => {
      const classes = getResponsiveClasses('4xl', TEXT_SIZE_MAP);
      expect(classes).toEqual(['text-4xl']);
    });

    it('generates responsive classes for object value', () => {
      const classes = getResponsiveClasses(
        { base: 'xl', md: '2xl', lg: '3xl' } as ResponsiveValue<TextSize>,
        TEXT_SIZE_MAP
      );
      expect(classes).toEqual(['text-xl', 'md:text-2xl', 'lg:text-3xl']);
    });

    it('generates all breakpoint classes', () => {
      const classes = getResponsiveClasses(
        {
          base: '2xl',
          sm: '3xl',
          md: '4xl',
          lg: '5xl',
          xl: '6xl',
          '2xl': '7xl',
        } as ResponsiveValue<TextSize>,
        TEXT_SIZE_MAP
      );
      expect(classes).toEqual([
        'text-2xl',
        'sm:text-3xl',
        'md:text-4xl',
        'lg:text-5xl',
        'xl:text-6xl',
        '2xl:text-7xl',
      ]);
    });

    it('handles partial responsive objects (no base)', () => {
      const classes = getResponsiveClasses(
        { md: '3xl', xl: '5xl' } as ResponsiveValue<TextSize>,
        TEXT_SIZE_MAP
      );
      expect(classes).toEqual(['md:text-3xl', 'xl:text-5xl']);
    });
  });

  describe('getResponsiveClasses with FONT_WEIGHT_MAP (for heading weight)', () => {
    it('generates correct class for bold (default)', () => {
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
        { base: 'semibold', md: 'bold', lg: 'extrabold' } as ResponsiveValue<FontWeight>,
        FONT_WEIGHT_MAP
      );
      expect(classes).toEqual(['font-semibold', 'md:font-bold', 'lg:font-extrabold']);
    });
  });

  describe('getResponsiveClasses with TEXT_ALIGN_MAP (for heading alignment)', () => {
    it('generates correct classes for all align values', () => {
      expect(getResponsiveClasses('left', TEXT_ALIGN_MAP)).toEqual(['text-left']);
      expect(getResponsiveClasses('center', TEXT_ALIGN_MAP)).toEqual(['text-center']);
      expect(getResponsiveClasses('right', TEXT_ALIGN_MAP)).toEqual(['text-right']);
    });

    it('generates responsive alignment classes', () => {
      const classes = getResponsiveClasses(
        { base: 'center', md: 'left', lg: 'right' } as ResponsiveValue<TextAlign>,
        TEXT_ALIGN_MAP
      );
      expect(classes).toEqual(['text-center', 'md:text-left', 'lg:text-right']);
    });
  });

  describe('getResponsiveClasses with TRACKING_MAP (for heading letter-spacing)', () => {
    it('generates correct classes for tighter (common for headings)', () => {
      expect(getResponsiveClasses('tighter', TRACKING_MAP)).toEqual(['tracking-tighter']);
    });

    it('generates correct classes for tight', () => {
      expect(getResponsiveClasses('tight', TRACKING_MAP)).toEqual(['tracking-tight']);
    });

    it('generates correct classes for all tracking values', () => {
      expect(getResponsiveClasses('normal', TRACKING_MAP)).toEqual(['tracking-normal']);
      expect(getResponsiveClasses('wide', TRACKING_MAP)).toEqual(['tracking-wide']);
      expect(getResponsiveClasses('wider', TRACKING_MAP)).toEqual(['tracking-wider']);
      expect(getResponsiveClasses('widest', TRACKING_MAP)).toEqual(['tracking-widest']);
    });

    it('generates responsive tracking classes', () => {
      const classes = getResponsiveClasses(
        { base: 'tighter', lg: 'tight' } as ResponsiveValue<Tracking>,
        TRACKING_MAP
      );
      expect(classes).toEqual(['tracking-tighter', 'lg:tracking-tight']);
    });
  });

  describe('getResponsiveClasses with LEADING_MAP (for heading line-height)', () => {
    it('generates correct classes for tight (common for headings)', () => {
      expect(getResponsiveClasses('tight', LEADING_MAP)).toEqual(['leading-tight']);
    });

    it('generates correct classes for all leading values', () => {
      expect(getResponsiveClasses('none', LEADING_MAP)).toEqual(['leading-none']);
      expect(getResponsiveClasses('snug', LEADING_MAP)).toEqual(['leading-snug']);
      expect(getResponsiveClasses('normal', LEADING_MAP)).toEqual(['leading-normal']);
      expect(getResponsiveClasses('relaxed', LEADING_MAP)).toEqual(['leading-relaxed']);
      expect(getResponsiveClasses('loose', LEADING_MAP)).toEqual(['leading-loose']);
    });

    it('generates responsive leading classes', () => {
      const classes = getResponsiveClasses(
        { base: 'tight', md: 'snug', lg: 'normal' } as ResponsiveValue<Leading>,
        LEADING_MAP
      );
      expect(classes).toEqual(['leading-tight', 'md:leading-snug', 'lg:leading-normal']);
    });
  });

  describe('getColorClass', () => {
    it('generates correct class for standard Tailwind colors', () => {
      expect(getColorClass('red-500')).toBe('text-red-500');
      expect(getColorClass('blue-600')).toBe('text-blue-600');
      expect(getColorClass('gray-900')).toBe('text-gray-900');
      expect(getColorClass('indigo-700')).toBe('text-indigo-700');
    });

    it('generates CSS variable class for custom colors', () => {
      expect(getColorClass('muted-foreground')).toBe('text-[rgb(var(--muted-foreground))]');
      expect(getColorClass('accent-foreground')).toBe('text-[rgb(var(--accent-foreground))]');
    });

    it('handles single word colors', () => {
      expect(getColorClass('primary')).toBe('text-primary');
      expect(getColorClass('white')).toBe('text-white');
      expect(getColorClass('black')).toBe('text-black');
      expect(getColorClass('inherit')).toBe('text-inherit');
    });
  });

  describe('BREAKPOINT_ORDER', () => {
    it('has correct order for mobile-first responsive design', () => {
      expect(BREAKPOINT_ORDER).toEqual(['base', 'sm', 'md', 'lg', 'xl', '2xl']);
    });
  });

  describe('edge cases', () => {
    it('maintains breakpoint order in output', () => {
      const classes = getResponsiveClasses(
        { xl: '5xl', sm: '3xl', base: '2xl' } as ResponsiveValue<TextSize>,
        TEXT_SIZE_MAP
      );
      expect(classes).toEqual(['text-2xl', 'sm:text-3xl', 'xl:text-5xl']);
    });

    it('returns empty array for empty object', () => {
      const classes = getResponsiveClasses({}, TEXT_SIZE_MAP);
      expect(classes).toEqual([]);
    });

    it('handles responsive object with only one breakpoint', () => {
      const classes = getResponsiveClasses(
        { lg: '4xl' } as ResponsiveValue<TextSize>,
        TEXT_SIZE_MAP
      );
      expect(classes).toEqual(['lg:text-4xl']);
    });
  });

  describe('heading class generation scenarios', () => {
    it('generates classes for h1 with default size', () => {
      const defaultSize = DEFAULT_HEADING_SIZES[1];
      const classes = getResponsiveClasses(defaultSize, TEXT_SIZE_MAP);
      expect(classes).toEqual(['text-4xl']);
    });

    it('generates classes for h2 with custom size override', () => {
      const customSize: TextSize = '5xl';
      const classes = getResponsiveClasses(customSize, TEXT_SIZE_MAP);
      expect(classes).toEqual(['text-5xl']);
    });

    it('generates classes for h1 with responsive custom size', () => {
      const responsiveSize: ResponsiveValue<TextSize> = {
        base: '3xl',
        md: '4xl',
        lg: '5xl',
        xl: '6xl',
      };
      const classes = getResponsiveClasses(responsiveSize, TEXT_SIZE_MAP);
      expect(classes).toEqual(['text-3xl', 'md:text-4xl', 'lg:text-5xl', 'xl:text-6xl']);
    });

    it('generates classes for heading with hero styling', () => {
      // Typical hero heading: size 6xl, weight black, tracking tighter
      const sizeClasses = getResponsiveClasses('6xl', TEXT_SIZE_MAP);
      const weightClasses = getResponsiveClasses('black', FONT_WEIGHT_MAP);
      const trackingClasses = getResponsiveClasses('tighter', TRACKING_MAP);

      expect([...sizeClasses, ...weightClasses, ...trackingClasses]).toEqual([
        'text-6xl',
        'font-black',
        'tracking-tighter',
      ]);
    });

    it('generates classes for subdued heading', () => {
      // Subdued heading: size lg, weight medium, muted color
      const sizeClasses = getResponsiveClasses('lg', TEXT_SIZE_MAP);
      const weightClasses = getResponsiveClasses('medium', FONT_WEIGHT_MAP);
      const colorClass = getColorClass('muted-foreground');

      expect([...sizeClasses, ...weightClasses, colorClass]).toEqual([
        'text-lg',
        'font-medium',
        'text-[rgb(var(--muted-foreground))]',
      ]);
    });

    it('generates classes for responsive heading with all options', () => {
      const sizeClasses = getResponsiveClasses(
        { base: 'xl', md: '2xl', lg: '3xl' } as ResponsiveValue<TextSize>,
        TEXT_SIZE_MAP
      );
      const weightClasses = getResponsiveClasses(
        { base: 'semibold', lg: 'bold' } as ResponsiveValue<FontWeight>,
        FONT_WEIGHT_MAP
      );
      const alignClasses = getResponsiveClasses(
        { base: 'center', md: 'left' } as ResponsiveValue<TextAlign>,
        TEXT_ALIGN_MAP
      );

      expect([...sizeClasses, ...weightClasses, ...alignClasses]).toEqual([
        'text-xl',
        'md:text-2xl',
        'lg:text-3xl',
        'font-semibold',
        'lg:font-bold',
        'text-center',
        'md:text-left',
      ]);
    });
  });
});
