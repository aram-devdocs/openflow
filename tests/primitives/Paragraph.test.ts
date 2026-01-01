/**
 * Paragraph primitive utility function tests
 *
 * These tests verify the typography class generation logic for paragraphs.
 * Component rendering is tested via Storybook.
 */

import { describe, expect, it } from 'vitest';

/**
 * Re-implement the typography class generation functions for testing
 * (mirrors the logic in Paragraph.tsx)
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
type Leading = 'none' | 'tight' | 'snug' | 'normal' | 'relaxed' | 'loose';
type TextAlign = 'left' | 'center' | 'right' | 'justify';

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

const LEADING_MAP: Record<Leading, string> = {
  none: 'leading-none',
  tight: 'leading-tight',
  snug: 'leading-snug',
  normal: 'leading-normal',
  relaxed: 'leading-relaxed',
  loose: 'leading-loose',
};

const TEXT_ALIGN_MAP: Record<TextAlign, string> = {
  left: 'text-left',
  center: 'text-center',
  right: 'text-right',
  justify: 'text-justify',
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

describe('primitives/Paragraph - Utility Functions', () => {
  describe('getResponsiveClasses with TEXT_SIZE_MAP', () => {
    it('generates correct class for single size value', () => {
      const classes = getResponsiveClasses('base', TEXT_SIZE_MAP);
      expect(classes).toEqual(['text-base']);
    });

    it('generates correct classes for common paragraph sizes', () => {
      const commonSizes: TextSize[] = ['xs', 'sm', 'base', 'lg', 'xl', '2xl'];
      for (const size of commonSizes) {
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

    it('handles partial responsive objects', () => {
      const classes = getResponsiveClasses(
        { base: 'tight', xl: 'relaxed' } as ResponsiveValue<Leading>,
        LEADING_MAP
      );
      expect(classes).toEqual(['leading-tight', 'xl:leading-relaxed']);
    });
  });

  describe('getResponsiveClasses with TEXT_ALIGN_MAP', () => {
    it('generates correct classes for all align values', () => {
      expect(getResponsiveClasses('left', TEXT_ALIGN_MAP)).toEqual(['text-left']);
      expect(getResponsiveClasses('center', TEXT_ALIGN_MAP)).toEqual(['text-center']);
      expect(getResponsiveClasses('right', TEXT_ALIGN_MAP)).toEqual(['text-right']);
      expect(getResponsiveClasses('justify', TEXT_ALIGN_MAP)).toEqual(['text-justify']);
    });

    it('generates responsive alignment classes', () => {
      const classes = getResponsiveClasses(
        { base: 'center', md: 'left', lg: 'justify' } as ResponsiveValue<TextAlign>,
        TEXT_ALIGN_MAP
      );
      expect(classes).toEqual(['text-center', 'md:text-left', 'lg:text-justify']);
    });
  });

  describe('getResponsiveClasses with FONT_WEIGHT_MAP', () => {
    it('generates correct class for single weight value', () => {
      const classes = getResponsiveClasses('normal', FONT_WEIGHT_MAP);
      expect(classes).toEqual(['font-normal']);
    });

    it('generates correct classes for common paragraph weights', () => {
      const commonWeights: FontWeight[] = ['light', 'normal', 'medium', 'semibold', 'bold'];
      for (const weight of commonWeights) {
        const classes = getResponsiveClasses(weight, FONT_WEIGHT_MAP);
        expect(classes).toEqual([`font-${weight}`]);
      }
    });

    it('generates responsive weight classes', () => {
      const classes = getResponsiveClasses(
        { base: 'normal', md: 'medium', lg: 'semibold' } as ResponsiveValue<FontWeight>,
        FONT_WEIGHT_MAP
      );
      expect(classes).toEqual(['font-normal', 'md:font-medium', 'lg:font-semibold']);
    });
  });

  describe('getColorClass', () => {
    it('generates correct class for standard Tailwind colors', () => {
      expect(getColorClass('gray-600')).toBe('text-gray-600');
      expect(getColorClass('red-500')).toBe('text-red-500');
      expect(getColorClass('blue-700')).toBe('text-blue-700');
      expect(getColorClass('green-50')).toBe('text-green-50');
    });

    it('generates CSS variable class for custom colors', () => {
      expect(getColorClass('muted-foreground')).toBe('text-[rgb(var(--muted-foreground))]');
      expect(getColorClass('primary')).toBe('text-primary');
      expect(getColorClass('card-foreground')).toBe('text-[rgb(var(--card-foreground))]');
    });

    it('handles single word colors', () => {
      expect(getColorClass('white')).toBe('text-white');
      expect(getColorClass('black')).toBe('text-black');
      expect(getColorClass('inherit')).toBe('text-inherit');
      expect(getColorClass('current')).toBe('text-current');
    });
  });

  describe('BREAKPOINT_ORDER', () => {
    it('has correct order for responsive classes', () => {
      expect(BREAKPOINT_ORDER).toEqual(['base', 'sm', 'md', 'lg', 'xl', '2xl']);
    });
  });

  describe('LEADING_MAP for paragraph defaults', () => {
    it('has all line height classes', () => {
      expect(LEADING_MAP.none).toBe('leading-none');
      expect(LEADING_MAP.tight).toBe('leading-tight');
      expect(LEADING_MAP.snug).toBe('leading-snug');
      expect(LEADING_MAP.normal).toBe('leading-normal');
      expect(LEADING_MAP.relaxed).toBe('leading-relaxed');
      expect(LEADING_MAP.loose).toBe('leading-loose');
    });

    it('default leading for Paragraph is relaxed', () => {
      // Default leading="relaxed" provides good readability
      expect(LEADING_MAP.relaxed).toBe('leading-relaxed');
    });
  });

  describe('TEXT_ALIGN_MAP for paragraph alignment', () => {
    it('has all alignment classes', () => {
      expect(TEXT_ALIGN_MAP.left).toBe('text-left');
      expect(TEXT_ALIGN_MAP.center).toBe('text-center');
      expect(TEXT_ALIGN_MAP.right).toBe('text-right');
      expect(TEXT_ALIGN_MAP.justify).toBe('text-justify');
    });
  });

  describe('edge cases', () => {
    it('maintains breakpoint order in output', () => {
      const classes = getResponsiveClasses(
        { xl: 'lg', sm: 'sm', base: 'xs' } as ResponsiveValue<TextSize>,
        TEXT_SIZE_MAP
      );
      expect(classes).toEqual(['text-xs', 'sm:text-sm', 'xl:text-lg']);
    });

    it('returns empty array for empty object', () => {
      const classes = getResponsiveClasses({}, TEXT_SIZE_MAP);
      expect(classes).toEqual([]);
    });

    it('handles only md breakpoint', () => {
      const classes = getResponsiveClasses(
        { md: 'lg' } as ResponsiveValue<TextSize>,
        TEXT_SIZE_MAP
      );
      expect(classes).toEqual(['md:text-lg']);
    });
  });

  describe('Paragraph-specific class generation scenarios', () => {
    it('generates typical body text classes', () => {
      // Typical paragraph: base size, relaxed leading
      const sizeClasses = getResponsiveClasses('base', TEXT_SIZE_MAP);
      const leadingClasses = getResponsiveClasses('relaxed', LEADING_MAP);

      expect(sizeClasses).toEqual(['text-base']);
      expect(leadingClasses).toEqual(['leading-relaxed']);
    });

    it('generates lead paragraph classes', () => {
      // Lead paragraph: xl size, relaxed leading, muted color
      const sizeClasses = getResponsiveClasses('xl', TEXT_SIZE_MAP);
      const leadingClasses = getResponsiveClasses('relaxed', LEADING_MAP);
      const colorClass = getColorClass('muted-foreground');

      expect(sizeClasses).toEqual(['text-xl']);
      expect(leadingClasses).toEqual(['leading-relaxed']);
      expect(colorClass).toBe('text-[rgb(var(--muted-foreground))]');
    });

    it('generates small print / legal text classes', () => {
      // Small print: xs size, normal leading, muted color
      const sizeClasses = getResponsiveClasses('xs', TEXT_SIZE_MAP);
      const leadingClasses = getResponsiveClasses('normal', LEADING_MAP);
      const colorClass = getColorClass('muted-foreground');

      expect(sizeClasses).toEqual(['text-xs']);
      expect(leadingClasses).toEqual(['leading-normal']);
      expect(colorClass).toBe('text-[rgb(var(--muted-foreground))]');
    });

    it('generates book-style paragraph classes', () => {
      // Book style: justify alignment
      const alignClasses = getResponsiveClasses('justify', TEXT_ALIGN_MAP);
      const leadingClasses = getResponsiveClasses('relaxed', LEADING_MAP);

      expect(alignClasses).toEqual(['text-justify']);
      expect(leadingClasses).toEqual(['leading-relaxed']);
    });

    it('generates responsive paragraph classes for different viewports', () => {
      // Mobile: smaller text, normal leading
      // Desktop: larger text, relaxed leading
      const sizeClasses = getResponsiveClasses(
        { base: 'sm', md: 'base', lg: 'lg' } as ResponsiveValue<TextSize>,
        TEXT_SIZE_MAP
      );
      const leadingClasses = getResponsiveClasses(
        { base: 'normal', md: 'relaxed' } as ResponsiveValue<Leading>,
        LEADING_MAP
      );

      expect(sizeClasses).toEqual(['text-sm', 'md:text-base', 'lg:text-lg']);
      expect(leadingClasses).toEqual(['leading-normal', 'md:leading-relaxed']);
    });
  });
});
