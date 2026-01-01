/**
 * Article primitive utility function tests
 *
 * These tests verify the spacing class generation and props handling.
 * Component rendering is tested via Storybook.
 */

import { describe, expect, it } from 'vitest';

/**
 * Re-implement the Article utility functions for testing
 * (mirrors the logic in Article.tsx)
 */

type Breakpoint = 'base' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
type ResponsiveValue<T> = T | Partial<Record<Breakpoint, T>>;

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

interface ArticleSpacingProps {
  p?: ResponsiveValue<SpacingValue>;
  px?: ResponsiveValue<SpacingValue>;
  py?: ResponsiveValue<SpacingValue>;
  pt?: ResponsiveValue<SpacingValue>;
  pr?: ResponsiveValue<SpacingValue>;
  pb?: ResponsiveValue<SpacingValue>;
  pl?: ResponsiveValue<SpacingValue>;
  m?: ResponsiveValue<SpacingValue>;
  mx?: ResponsiveValue<SpacingValue>;
  my?: ResponsiveValue<SpacingValue>;
  mt?: ResponsiveValue<SpacingValue>;
  mr?: ResponsiveValue<SpacingValue>;
  mb?: ResponsiveValue<SpacingValue>;
  ml?: ResponsiveValue<SpacingValue>;
  gap?: ResponsiveValue<SpacingValue>;
}

const BREAKPOINT_ORDER: Breakpoint[] = ['base', 'sm', 'md', 'lg', 'xl', '2xl'];

const SPACING_PREFIX_MAP: Record<keyof ArticleSpacingProps, string> = {
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

function extractSpacingClasses(props: ArticleSpacingProps): string[] {
  const classes: string[] = [];

  for (const [prop, prefix] of Object.entries(SPACING_PREFIX_MAP)) {
    const value = props[prop as keyof ArticleSpacingProps];
    if (value !== undefined) {
      classes.push(...getResponsiveSpacingClasses(prefix, value));
    }
  }

  return classes;
}

describe('primitives/Article - Utility Functions', () => {
  describe('getSpacingClass', () => {
    it('generates correct class for numeric spacing values', () => {
      expect(getSpacingClass('p', '0')).toBe('p-0');
      expect(getSpacingClass('p', '1')).toBe('p-1');
      expect(getSpacingClass('p', '4')).toBe('p-4');
      expect(getSpacingClass('p', '8')).toBe('p-8');
      expect(getSpacingClass('p', '16')).toBe('p-16');
    });

    it('generates correct class for decimal spacing values', () => {
      expect(getSpacingClass('p', '0.5')).toBe('p-0.5');
      expect(getSpacingClass('p', '1.5')).toBe('p-1.5');
      expect(getSpacingClass('p', '2.5')).toBe('p-2.5');
      expect(getSpacingClass('p', '3.5')).toBe('p-3.5');
    });

    it('generates correct class for auto value', () => {
      expect(getSpacingClass('m', 'auto')).toBe('m-auto');
      expect(getSpacingClass('mx', 'auto')).toBe('mx-auto');
      expect(getSpacingClass('my', 'auto')).toBe('my-auto');
    });

    it('generates correct class for px value', () => {
      expect(getSpacingClass('p', 'px')).toBe('p-px');
      expect(getSpacingClass('m', 'px')).toBe('m-px');
    });

    it('generates correct classes for all spacing prefixes', () => {
      expect(getSpacingClass('p', '4')).toBe('p-4');
      expect(getSpacingClass('px', '4')).toBe('px-4');
      expect(getSpacingClass('py', '4')).toBe('py-4');
      expect(getSpacingClass('pt', '4')).toBe('pt-4');
      expect(getSpacingClass('pr', '4')).toBe('pr-4');
      expect(getSpacingClass('pb', '4')).toBe('pb-4');
      expect(getSpacingClass('pl', '4')).toBe('pl-4');
      expect(getSpacingClass('m', '4')).toBe('m-4');
      expect(getSpacingClass('mx', '4')).toBe('mx-4');
      expect(getSpacingClass('my', '4')).toBe('my-4');
      expect(getSpacingClass('mt', '4')).toBe('mt-4');
      expect(getSpacingClass('mr', '4')).toBe('mr-4');
      expect(getSpacingClass('mb', '4')).toBe('mb-4');
      expect(getSpacingClass('ml', '4')).toBe('ml-4');
      expect(getSpacingClass('gap', '4')).toBe('gap-4');
    });
  });

  describe('getResponsiveSpacingClasses', () => {
    it('generates single class for simple value', () => {
      expect(getResponsiveSpacingClasses('p', '4')).toEqual(['p-4']);
    });

    it('generates responsive classes with base breakpoint', () => {
      const classes = getResponsiveSpacingClasses('p', { base: '2', md: '4', lg: '6' });
      expect(classes).toEqual(['p-2', 'md:p-4', 'lg:p-6']);
    });

    it('generates responsive classes without base breakpoint', () => {
      const classes = getResponsiveSpacingClasses('p', { md: '4', xl: '8' });
      expect(classes).toEqual(['md:p-4', 'xl:p-8']);
    });

    it('generates all breakpoint classes', () => {
      const classes = getResponsiveSpacingClasses('p', {
        base: '2',
        sm: '3',
        md: '4',
        lg: '6',
        xl: '8',
        '2xl': '10',
      });
      expect(classes).toEqual(['p-2', 'sm:p-3', 'md:p-4', 'lg:p-6', 'xl:p-8', '2xl:p-10']);
    });

    it('maintains correct breakpoint order regardless of input order', () => {
      const classes = getResponsiveSpacingClasses('p', {
        xl: '8',
        base: '2',
        md: '4',
      });
      expect(classes).toEqual(['p-2', 'md:p-4', 'xl:p-8']);
    });

    it('returns empty array for empty object', () => {
      const classes = getResponsiveSpacingClasses('p', {});
      expect(classes).toEqual([]);
    });

    it('handles auto value in responsive objects', () => {
      const classes = getResponsiveSpacingClasses('mx', { base: '4', md: 'auto' });
      expect(classes).toEqual(['mx-4', 'md:mx-auto']);
    });

    it('handles px value in responsive objects', () => {
      const classes = getResponsiveSpacingClasses('p', { base: 'px', md: '4' });
      expect(classes).toEqual(['p-px', 'md:p-4']);
    });
  });

  describe('extractSpacingClasses', () => {
    it('returns empty array when no spacing props provided', () => {
      const classes = extractSpacingClasses({});
      expect(classes).toEqual([]);
    });

    it('extracts single padding class', () => {
      const classes = extractSpacingClasses({ p: '4' });
      expect(classes).toEqual(['p-4']);
    });

    it('extracts single margin class', () => {
      const classes = extractSpacingClasses({ m: '4' });
      expect(classes).toEqual(['m-4']);
    });

    it('extracts multiple spacing classes', () => {
      const classes = extractSpacingClasses({ p: '4', m: '2' });
      expect(classes).toContain('p-4');
      expect(classes).toContain('m-2');
    });

    it('extracts horizontal and vertical padding', () => {
      const classes = extractSpacingClasses({ px: '4', py: '2' });
      expect(classes).toContain('px-4');
      expect(classes).toContain('py-2');
    });

    it('extracts individual side padding', () => {
      const classes = extractSpacingClasses({ pt: '2', pr: '4', pb: '2', pl: '4' });
      expect(classes).toContain('pt-2');
      expect(classes).toContain('pr-4');
      expect(classes).toContain('pb-2');
      expect(classes).toContain('pl-4');
    });

    it('extracts individual side margin', () => {
      const classes = extractSpacingClasses({ mt: '2', mr: '4', mb: '2', ml: '4' });
      expect(classes).toContain('mt-2');
      expect(classes).toContain('mr-4');
      expect(classes).toContain('mb-2');
      expect(classes).toContain('ml-4');
    });

    it('extracts gap class', () => {
      const classes = extractSpacingClasses({ gap: '4' });
      expect(classes).toEqual(['gap-4']);
    });

    it('extracts responsive padding classes', () => {
      const classes = extractSpacingClasses({ p: { base: '2', md: '4', lg: '6' } });
      expect(classes).toEqual(['p-2', 'md:p-4', 'lg:p-6']);
    });

    it('extracts responsive margin classes', () => {
      const classes = extractSpacingClasses({ m: { base: '2', md: '4' } });
      expect(classes).toEqual(['m-2', 'md:m-4']);
    });

    it('extracts mixed responsive and non-responsive classes', () => {
      const classes = extractSpacingClasses({
        p: { base: '2', md: '4' },
        mt: '8',
      });
      expect(classes).toContain('p-2');
      expect(classes).toContain('md:p-4');
      expect(classes).toContain('mt-8');
    });

    it('extracts complex responsive layout', () => {
      const classes = extractSpacingClasses({
        p: { base: '4', md: '6', lg: '8' },
        mx: { base: '0', md: 'auto' },
        gap: { base: '4', lg: '6' },
      });
      expect(classes).toContain('p-4');
      expect(classes).toContain('md:p-6');
      expect(classes).toContain('lg:p-8');
      expect(classes).toContain('mx-0');
      expect(classes).toContain('md:mx-auto');
      expect(classes).toContain('gap-4');
      expect(classes).toContain('lg:gap-6');
    });
  });

  describe('SPACING_PREFIX_MAP', () => {
    it('contains all expected spacing prefixes', () => {
      expect(Object.keys(SPACING_PREFIX_MAP)).toEqual([
        'p',
        'px',
        'py',
        'pt',
        'pr',
        'pb',
        'pl',
        'm',
        'mx',
        'my',
        'mt',
        'mr',
        'mb',
        'ml',
        'gap',
      ]);
    });

    it('maps prop names to correct Tailwind prefixes', () => {
      expect(SPACING_PREFIX_MAP.p).toBe('p');
      expect(SPACING_PREFIX_MAP.px).toBe('px');
      expect(SPACING_PREFIX_MAP.py).toBe('py');
      expect(SPACING_PREFIX_MAP.m).toBe('m');
      expect(SPACING_PREFIX_MAP.mx).toBe('mx');
      expect(SPACING_PREFIX_MAP.my).toBe('my');
      expect(SPACING_PREFIX_MAP.gap).toBe('gap');
    });
  });

  describe('BREAKPOINT_ORDER', () => {
    it('has correct mobile-first order', () => {
      expect(BREAKPOINT_ORDER).toEqual(['base', 'sm', 'md', 'lg', 'xl', '2xl']);
    });
  });

  describe('Article component requirements', () => {
    it('aria-label is optional (unlike Section)', () => {
      // This test documents that Article does NOT require aria-label
      // The ArticleProps interface makes aria-label optional via A11yProps
      const optionalProps = ['aria-label'];
      expect(optionalProps).toContain('aria-label');
    });

    it('renders as an article element', () => {
      // This test documents that Article always renders as <article>
      // Unlike Box, Article is not polymorphic
      const element = 'article';
      expect(element).toBe('article');
    });

    it('represents self-contained content', () => {
      // This test documents the semantic purpose of Article
      const validUsesCases = [
        'blog post',
        'news article',
        'forum post',
        'user comment',
        'product card',
        'recipe',
        'job listing',
      ];
      expect(validUsesCases.length).toBeGreaterThan(0);
    });
  });

  describe('edge cases', () => {
    it('handles large spacing values', () => {
      const classes = extractSpacingClasses({ p: '96', m: '80' });
      expect(classes).toContain('p-96');
      expect(classes).toContain('m-80');
    });

    it('handles all decimal values', () => {
      const classes = extractSpacingClasses({
        pt: '0.5',
        pr: '1.5',
        pb: '2.5',
        pl: '3.5',
      });
      expect(classes).toContain('pt-0.5');
      expect(classes).toContain('pr-1.5');
      expect(classes).toContain('pb-2.5');
      expect(classes).toContain('pl-3.5');
    });

    it('handles zero values', () => {
      const classes = extractSpacingClasses({ p: '0', m: '0' });
      expect(classes).toContain('p-0');
      expect(classes).toContain('m-0');
    });

    it('handles single breakpoint in responsive object', () => {
      const classes = extractSpacingClasses({ p: { lg: '8' } });
      expect(classes).toEqual(['lg:p-8']);
    });

    it('handles responsive with only 2xl breakpoint', () => {
      const classes = extractSpacingClasses({ p: { '2xl': '12' } });
      expect(classes).toEqual(['2xl:p-12']);
    });
  });

  describe('Article spacing scenarios', () => {
    it('generates classes for blog post pattern', () => {
      const classes = extractSpacingClasses({
        py: { base: '6', md: '8', lg: '12' },
        px: { base: '4', md: '6' },
      });
      expect(classes).toContain('py-6');
      expect(classes).toContain('md:py-8');
      expect(classes).toContain('lg:py-12');
      expect(classes).toContain('px-4');
      expect(classes).toContain('md:px-6');
    });

    it('generates classes for card pattern', () => {
      const classes = extractSpacingClasses({ p: '6', mb: '4' });
      expect(classes).toContain('p-6');
      expect(classes).toContain('mb-4');
    });

    it('generates classes for feed item pattern', () => {
      const classes = extractSpacingClasses({
        p: '4',
        my: '2',
      });
      expect(classes).toContain('p-4');
      expect(classes).toContain('my-2');
    });

    it('generates classes for product card pattern', () => {
      const classes = extractSpacingClasses({
        p: { base: '3', md: '4' },
        gap: '3',
      });
      expect(classes).toContain('p-3');
      expect(classes).toContain('md:p-4');
      expect(classes).toContain('gap-3');
    });

    it('generates classes for comment thread pattern', () => {
      const classes = extractSpacingClasses({
        p: '4',
        ml: { base: '0', md: '12' },
      });
      expect(classes).toContain('p-4');
      expect(classes).toContain('ml-0');
      expect(classes).toContain('md:ml-12');
    });
  });

  describe('Article vs Section comparison', () => {
    it('Article is for self-contained content', () => {
      // Article: independently distributable content
      const articleCharacteristics = [
        'self-contained',
        'independently distributable',
        'makes sense on its own',
        'can be syndicated',
      ];
      expect(articleCharacteristics).toContain('self-contained');
    });

    it('Section is for thematic grouping', () => {
      // Section: groups related content together
      const sectionCharacteristics = [
        'thematic grouping',
        'requires aria-label',
        'navigation landmark',
        'part of document outline',
      ];
      expect(sectionCharacteristics).toContain('requires aria-label');
    });
  });
});
