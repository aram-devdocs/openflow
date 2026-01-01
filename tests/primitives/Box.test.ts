/**
 * Box primitive utility function tests
 *
 * These tests verify the spacing class generation logic.
 * Component rendering is tested via Storybook.
 */

import { describe, expect, it } from 'vitest';

/**
 * Re-implement the spacing class generation functions for testing
 * (mirrors the logic in Box.tsx)
 */

type Breakpoint = 'base' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
type SpacingValue = string;
type ResponsiveValue<T> = T | Partial<Record<Breakpoint, T>>;

const BREAKPOINT_ORDER: Breakpoint[] = ['base', 'sm', 'md', 'lg', 'xl', '2xl'];

const SPACING_PREFIX_MAP: Record<string, string> = {
  p: 'p',
  px: 'px',
  py: 'py',
  pt: 'pt',
  pr: 'pr',
  pb: 'pb',
  pl: 'pl',
  m: 'm',
  mx: 'mx',
  my: 'my',
  mt: 'mt',
  mr: 'mr',
  mb: 'mb',
  ml: 'ml',
  gap: 'gap',
};

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

function extractSpacingClasses(
  props: Record<string, ResponsiveValue<SpacingValue> | undefined>
): string[] {
  const classes: string[] = [];

  for (const [prop, prefix] of Object.entries(SPACING_PREFIX_MAP)) {
    const value = props[prop];
    if (value !== undefined) {
      classes.push(...getResponsiveSpacingClasses(prefix, value));
    }
  }

  return classes;
}

describe('primitives/Box - Utility Functions', () => {
  describe('getSpacingClass', () => {
    it('generates correct padding class', () => {
      expect(getSpacingClass('p', '4')).toBe('p-4');
    });

    it('generates correct margin class', () => {
      expect(getSpacingClass('m', '8')).toBe('m-8');
    });

    it('handles auto value', () => {
      expect(getSpacingClass('mx', 'auto')).toBe('mx-auto');
    });

    it('handles px value', () => {
      expect(getSpacingClass('p', 'px')).toBe('p-px');
    });

    it('handles 0 value', () => {
      expect(getSpacingClass('m', '0')).toBe('m-0');
    });

    it('handles fractional values', () => {
      expect(getSpacingClass('p', '0.5')).toBe('p-0.5');
      expect(getSpacingClass('m', '1.5')).toBe('m-1.5');
    });

    it('handles large values', () => {
      expect(getSpacingClass('p', '96')).toBe('p-96');
    });

    it('handles all padding prefixes', () => {
      expect(getSpacingClass('px', '4')).toBe('px-4');
      expect(getSpacingClass('py', '4')).toBe('py-4');
      expect(getSpacingClass('pt', '4')).toBe('pt-4');
      expect(getSpacingClass('pr', '4')).toBe('pr-4');
      expect(getSpacingClass('pb', '4')).toBe('pb-4');
      expect(getSpacingClass('pl', '4')).toBe('pl-4');
    });

    it('handles all margin prefixes', () => {
      expect(getSpacingClass('mx', '4')).toBe('mx-4');
      expect(getSpacingClass('my', '4')).toBe('my-4');
      expect(getSpacingClass('mt', '4')).toBe('mt-4');
      expect(getSpacingClass('mr', '4')).toBe('mr-4');
      expect(getSpacingClass('mb', '4')).toBe('mb-4');
      expect(getSpacingClass('ml', '4')).toBe('ml-4');
    });

    it('handles gap prefix', () => {
      expect(getSpacingClass('gap', '4')).toBe('gap-4');
    });
  });

  describe('getResponsiveSpacingClasses', () => {
    it('generates single class for string value', () => {
      const classes = getResponsiveSpacingClasses('p', '4');
      expect(classes).toEqual(['p-4']);
    });

    it('generates base class for responsive object with base', () => {
      const classes = getResponsiveSpacingClasses('p', { base: '2' });
      expect(classes).toEqual(['p-2']);
    });

    it('generates breakpoint classes for responsive object', () => {
      const classes = getResponsiveSpacingClasses('p', { base: '2', md: '4', lg: '6' });
      expect(classes).toEqual(['p-2', 'md:p-4', 'lg:p-6']);
    });

    it('generates all breakpoint classes', () => {
      const classes = getResponsiveSpacingClasses('p', {
        base: '1',
        sm: '2',
        md: '3',
        lg: '4',
        xl: '5',
        '2xl': '6',
      });
      expect(classes).toEqual(['p-1', 'sm:p-2', 'md:p-3', 'lg:p-4', 'xl:p-5', '2xl:p-6']);
    });

    it('handles partial responsive objects (no base)', () => {
      const classes = getResponsiveSpacingClasses('p', { md: '4', xl: '8' });
      expect(classes).toEqual(['md:p-4', 'xl:p-8']);
    });

    it('maintains breakpoint order', () => {
      // Even if provided in different order, output should follow BREAKPOINT_ORDER
      const classes = getResponsiveSpacingClasses('p', { xl: '5', sm: '2', base: '1' });
      expect(classes).toEqual(['p-1', 'sm:p-2', 'xl:p-5']);
    });

    it('handles empty object', () => {
      const classes = getResponsiveSpacingClasses('p', {});
      expect(classes).toEqual([]);
    });
  });

  describe('extractSpacingClasses', () => {
    it('extracts padding classes', () => {
      const classes = extractSpacingClasses({ p: '4' });
      expect(classes).toContain('p-4');
    });

    it('extracts multiple padding classes', () => {
      const classes = extractSpacingClasses({ px: '4', py: '2' });
      expect(classes).toContain('px-4');
      expect(classes).toContain('py-2');
    });

    it('extracts margin classes', () => {
      const classes = extractSpacingClasses({ m: '4', mt: '2' });
      expect(classes).toContain('m-4');
      expect(classes).toContain('mt-2');
    });

    it('extracts gap classes', () => {
      const classes = extractSpacingClasses({ gap: '4' });
      expect(classes).toContain('gap-4');
    });

    it('handles responsive values', () => {
      const classes = extractSpacingClasses({
        p: { base: '2', md: '4' },
        mx: 'auto',
      });
      expect(classes).toContain('p-2');
      expect(classes).toContain('md:p-4');
      expect(classes).toContain('mx-auto');
    });

    it('ignores undefined values', () => {
      const classes = extractSpacingClasses({ p: '4', m: undefined });
      expect(classes).toEqual(['p-4']);
    });

    it('handles all spacing props together', () => {
      const classes = extractSpacingClasses({
        p: '4',
        px: '6',
        py: '2',
        m: { base: '2', lg: '4' },
        gap: '4',
      });
      expect(classes).toContain('p-4');
      expect(classes).toContain('px-6');
      expect(classes).toContain('py-2');
      expect(classes).toContain('m-2');
      expect(classes).toContain('lg:m-4');
      expect(classes).toContain('gap-4');
    });

    it('returns empty array for empty props', () => {
      const classes = extractSpacingClasses({});
      expect(classes).toEqual([]);
    });
  });

  describe('BREAKPOINT_ORDER', () => {
    it('has correct order', () => {
      expect(BREAKPOINT_ORDER).toEqual(['base', 'sm', 'md', 'lg', 'xl', '2xl']);
    });
  });

  describe('SPACING_PREFIX_MAP', () => {
    it('has all padding prefixes', () => {
      expect(SPACING_PREFIX_MAP.p).toBe('p');
      expect(SPACING_PREFIX_MAP.px).toBe('px');
      expect(SPACING_PREFIX_MAP.py).toBe('py');
      expect(SPACING_PREFIX_MAP.pt).toBe('pt');
      expect(SPACING_PREFIX_MAP.pr).toBe('pr');
      expect(SPACING_PREFIX_MAP.pb).toBe('pb');
      expect(SPACING_PREFIX_MAP.pl).toBe('pl');
    });

    it('has all margin prefixes', () => {
      expect(SPACING_PREFIX_MAP.m).toBe('m');
      expect(SPACING_PREFIX_MAP.mx).toBe('mx');
      expect(SPACING_PREFIX_MAP.my).toBe('my');
      expect(SPACING_PREFIX_MAP.mt).toBe('mt');
      expect(SPACING_PREFIX_MAP.mr).toBe('mr');
      expect(SPACING_PREFIX_MAP.mb).toBe('mb');
      expect(SPACING_PREFIX_MAP.ml).toBe('ml');
    });

    it('has gap prefix', () => {
      expect(SPACING_PREFIX_MAP.gap).toBe('gap');
    });
  });
});
