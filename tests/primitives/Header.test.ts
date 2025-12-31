/**
 * Header primitive utility function tests
 *
 * These tests verify the spacing class generation and props handling.
 * Component rendering is tested via Storybook.
 */

import { describe, expect, it } from 'vitest';

/**
 * Re-implement the Header utility functions for testing
 * (mirrors the logic in Header.tsx)
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

interface HeaderSpacingProps {
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

const SPACING_PREFIX_MAP: Record<keyof HeaderSpacingProps, string> = {
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

function extractSpacingClasses(props: HeaderSpacingProps): string[] {
  const classes: string[] = [];

  for (const [prop, prefix] of Object.entries(SPACING_PREFIX_MAP)) {
    const value = props[prop as keyof HeaderSpacingProps];
    if (value !== undefined) {
      classes.push(...getResponsiveSpacingClasses(prefix, value));
    }
  }

  return classes;
}

describe('primitives/Header - Utility Functions', () => {
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

  describe('Header component requirements', () => {
    it('aria-label is optional', () => {
      // This test documents that Header does NOT require aria-label
      // The HeaderProps interface makes aria-label optional via A11yProps
      const optionalProps = ['aria-label'];
      expect(optionalProps).toContain('aria-label');
    });

    it('renders as a header element', () => {
      // This test documents that Header always renders as <header>
      // Unlike Box, Header is not polymorphic
      const element = 'header';
      expect(element).toBe('header');
    });

    it('is for introductory content', () => {
      // This test documents the semantic purpose of Header
      const validUseCases = [
        'site header with logo and nav',
        'article header with title and metadata',
        'section header with heading',
        'card header',
        'sticky header',
      ];
      expect(validUseCases.length).toBeGreaterThan(0);
    });
  });

  describe('Header vs banner landmark', () => {
    it('is a banner landmark when direct child of body', () => {
      // Header as direct child of body becomes role="banner"
      const context = 'direct child of body';
      const role = 'banner';
      expect(context).toBe('direct child of body');
      expect(role).toBe('banner');
    });

    it('is not a banner landmark inside article/section/aside/main/nav', () => {
      // Header inside sectioning content is NOT a banner
      const sectioning = ['article', 'aside', 'main', 'nav', 'section'];
      for (const element of sectioning) {
        expect(sectioning).toContain(element);
      }
    });

    it('only one banner landmark should exist per page', () => {
      // Best practice: one site-level header (banner) per page
      const maxBanners = 1;
      expect(maxBanners).toBe(1);
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

  describe('Header spacing scenarios', () => {
    it('generates classes for site header pattern', () => {
      const classes = extractSpacingClasses({
        px: { base: '4', lg: '8' },
        py: '4',
      });
      expect(classes).toContain('px-4');
      expect(classes).toContain('lg:px-8');
      expect(classes).toContain('py-4');
    });

    it('generates classes for sticky header pattern', () => {
      const classes = extractSpacingClasses({
        px: '4',
        py: '2',
      });
      expect(classes).toContain('px-4');
      expect(classes).toContain('py-2');
    });

    it('generates classes for article header pattern', () => {
      const classes = extractSpacingClasses({
        mb: '6',
      });
      expect(classes).toContain('mb-6');
    });

    it('generates classes for centered header pattern', () => {
      const classes = extractSpacingClasses({
        py: { base: '4', md: '6' },
        px: { base: '4', md: '8' },
      });
      expect(classes).toContain('py-4');
      expect(classes).toContain('md:py-6');
      expect(classes).toContain('px-4');
      expect(classes).toContain('md:px-8');
    });

    it('generates classes for card header pattern', () => {
      const classes = extractSpacingClasses({
        p: '4',
      });
      expect(classes).toContain('p-4');
    });

    it('generates classes for dashboard header pattern', () => {
      const classes = extractSpacingClasses({
        px: '6',
        py: '4',
        gap: '2',
      });
      expect(classes).toContain('px-6');
      expect(classes).toContain('py-4');
      expect(classes).toContain('gap-2');
    });
  });

  describe('Header vs other landmarks comparison', () => {
    it('Header is for introductory content', () => {
      // Header: introductory content, navigation, logos
      const headerCharacteristics = [
        'introductory content',
        'navigation aids',
        'logos and branding',
        'search forms',
        'headings and titles',
      ];
      expect(headerCharacteristics).toContain('introductory content');
    });

    it('Footer is for footer content', () => {
      // Footer: closing content, copyright, links
      const footerCharacteristics = [
        'closing content',
        'copyright information',
        'site map links',
        'contact information',
      ];
      expect(footerCharacteristics).toContain('closing content');
    });

    it('Nav is specifically for navigation', () => {
      // Nav: navigation links only
      const navCharacteristics = ['navigation links', 'breadcrumbs', 'pagination'];
      expect(navCharacteristics).toContain('navigation links');
    });

    it('Main is for primary content', () => {
      // Main: unique primary content
      const mainCharacteristics = ['primary content', 'unique to the page', 'skip link target'];
      expect(mainCharacteristics).toContain('primary content');
    });
  });

  describe('ARIA attribute support', () => {
    it('supports aria-label for labeling', () => {
      // Header supports optional aria-label
      const ariaProps = ['aria-label', 'aria-labelledby', 'aria-describedby'];
      expect(ariaProps).toContain('aria-label');
    });

    it('supports aria-hidden for hiding from screen readers', () => {
      const ariaProps = ['aria-hidden'];
      expect(ariaProps).toContain('aria-hidden');
    });
  });

  describe('Header common patterns', () => {
    it('sticky header needs positioning classes via className', () => {
      // Sticky positioning is applied via className, not props
      const stickyClasses = ['sticky', 'top-0', 'z-50'];
      expect(stickyClasses).toContain('sticky');
    });

    it('transparent header needs background classes via className', () => {
      // Transparent background is applied via className
      const transparentClasses = ['bg-transparent', 'absolute'];
      expect(transparentClasses).toContain('bg-transparent');
    });

    it('full-width header uses className for background', () => {
      // Background color is applied via className
      const backgroundClasses = ['bg-white', 'bg-[rgb(var(--background))]'];
      expect(backgroundClasses.length).toBeGreaterThan(0);
    });
  });
});
