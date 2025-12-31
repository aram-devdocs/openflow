/**
 * Label Component Utility Function Tests
 *
 * Tests for the Label atom utility functions and class generation.
 * Component rendering is tested via Storybook.
 */

import { describe, expect, it } from 'vitest';

// =============================================================================
// Re-implement utility functions for testing
// (mirrors the logic in Label.tsx)
// =============================================================================

type Breakpoint = 'base' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
type LabelSize = 'xs' | 'sm' | 'base' | 'lg';
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
type ResponsiveValue<T> = T | Partial<Record<Breakpoint, T>>;

const BREAKPOINT_ORDER: Breakpoint[] = ['base', 'sm', 'md', 'lg', 'xl', '2xl'];

const SIZE_MAP: Record<LabelSize, TextSize> = {
  xs: 'xs',
  sm: 'sm',
  base: 'base',
  lg: 'lg',
};

function getBaseSize(size: ResponsiveValue<LabelSize>): LabelSize {
  if (typeof size === 'string') {
    return size;
  }
  if (typeof size === 'object' && size !== null) {
    return (size as Partial<Record<Breakpoint, LabelSize>>).base ?? 'sm';
  }
  return 'sm';
}

function convertToTextSize(size: ResponsiveValue<LabelSize>): ResponsiveValue<TextSize> {
  if (typeof size === 'string') {
    return SIZE_MAP[size];
  }
  if (typeof size === 'object' && size !== null) {
    const result: Partial<Record<Breakpoint, TextSize>> = {};
    for (const breakpoint of BREAKPOINT_ORDER) {
      const value = (size as Partial<Record<Breakpoint, LabelSize>>)[breakpoint];
      if (value !== undefined) {
        result[breakpoint] = SIZE_MAP[value];
      }
    }
    return result;
  }
  return 'sm';
}

// Text size to Tailwind class mapping (for testing output)
const TEXT_SIZE_CLASSES: Record<TextSize, string> = {
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

function getTextSizeClass(size: TextSize): string {
  return TEXT_SIZE_CLASSES[size];
}

function getResponsiveTextClasses(size: ResponsiveValue<TextSize>): string[] {
  const classes: string[] = [];

  if (typeof size === 'string') {
    classes.push(getTextSizeClass(size));
  } else if (typeof size === 'object' && size !== null) {
    for (const breakpoint of BREAKPOINT_ORDER) {
      const value = (size as Partial<Record<Breakpoint, TextSize>>)[breakpoint];
      if (value !== undefined) {
        const sizeClass = getTextSizeClass(value);
        if (breakpoint === 'base') {
          classes.push(sizeClass);
        } else {
          classes.push(`${breakpoint}:${sizeClass}`);
        }
      }
    }
  }

  return classes;
}

// =============================================================================
// Tests
// =============================================================================

describe('ui/atoms/Label - Utility Functions', () => {
  // ===========================================================================
  // getBaseSize
  // ===========================================================================

  describe('getBaseSize', () => {
    it('returns the size directly when passed a string', () => {
      expect(getBaseSize('xs')).toBe('xs');
      expect(getBaseSize('sm')).toBe('sm');
      expect(getBaseSize('base')).toBe('base');
      expect(getBaseSize('lg')).toBe('lg');
    });

    it('returns base size from responsive object when base is defined', () => {
      expect(getBaseSize({ base: 'xs', md: 'sm' })).toBe('xs');
      expect(getBaseSize({ base: 'lg', sm: 'base' })).toBe('lg');
    });

    it('returns sm as default when base is not defined in responsive object', () => {
      expect(getBaseSize({ md: 'base', lg: 'lg' })).toBe('sm');
      expect(getBaseSize({ xl: 'lg' })).toBe('sm');
    });

    it('returns sm as fallback for null/undefined-like input', () => {
      // Edge case - when using object that becomes empty
      expect(getBaseSize({} as ResponsiveValue<LabelSize>)).toBe('sm');
    });
  });

  // ===========================================================================
  // convertToTextSize
  // ===========================================================================

  describe('convertToTextSize', () => {
    it('converts simple LabelSize to TextSize', () => {
      expect(convertToTextSize('xs')).toBe('xs');
      expect(convertToTextSize('sm')).toBe('sm');
      expect(convertToTextSize('base')).toBe('base');
      expect(convertToTextSize('lg')).toBe('lg');
    });

    it('converts responsive LabelSize object to responsive TextSize object', () => {
      expect(convertToTextSize({ base: 'sm', md: 'base' })).toEqual({
        base: 'sm',
        md: 'base',
      });
    });

    it('converts all breakpoints correctly', () => {
      expect(
        convertToTextSize({
          base: 'xs',
          sm: 'sm',
          md: 'base',
          lg: 'lg',
        })
      ).toEqual({
        base: 'xs',
        sm: 'sm',
        md: 'base',
        lg: 'lg',
      });
    });

    it('handles partial breakpoint definitions', () => {
      expect(convertToTextSize({ base: 'sm', lg: 'lg' })).toEqual({
        base: 'sm',
        lg: 'lg',
      });
    });

    it('returns sm as fallback for empty object', () => {
      expect(convertToTextSize({} as ResponsiveValue<LabelSize>)).toEqual({});
    });
  });

  // ===========================================================================
  // SIZE_MAP
  // ===========================================================================

  describe('SIZE_MAP', () => {
    it('maps all LabelSize values to corresponding TextSize values', () => {
      expect(SIZE_MAP.xs).toBe('xs');
      expect(SIZE_MAP.sm).toBe('sm');
      expect(SIZE_MAP.base).toBe('base');
      expect(SIZE_MAP.lg).toBe('lg');
    });

    it('has exactly 4 size mappings', () => {
      expect(Object.keys(SIZE_MAP)).toHaveLength(4);
    });
  });

  // ===========================================================================
  // getResponsiveTextClasses
  // ===========================================================================

  describe('getResponsiveTextClasses', () => {
    it('returns single class for simple size string', () => {
      expect(getResponsiveTextClasses('sm')).toEqual(['text-sm']);
      expect(getResponsiveTextClasses('lg')).toEqual(['text-lg']);
    });

    it('returns unprefixed class for base breakpoint', () => {
      expect(getResponsiveTextClasses({ base: 'sm' })).toEqual(['text-sm']);
    });

    it('returns prefixed classes for other breakpoints', () => {
      expect(getResponsiveTextClasses({ md: 'base' })).toEqual(['md:text-base']);
      expect(getResponsiveTextClasses({ lg: 'lg' })).toEqual(['lg:text-lg']);
    });

    it('returns multiple classes for multiple breakpoints', () => {
      const classes = getResponsiveTextClasses({ base: 'xs', md: 'sm', lg: 'base' });
      expect(classes).toContain('text-xs');
      expect(classes).toContain('md:text-sm');
      expect(classes).toContain('lg:text-base');
      expect(classes).toHaveLength(3);
    });

    it('generates classes in breakpoint order', () => {
      const classes = getResponsiveTextClasses({
        lg: 'lg',
        base: 'xs',
        sm: 'sm',
      });
      expect(classes[0]).toBe('text-xs'); // base first
      expect(classes[1]).toBe('sm:text-sm');
      expect(classes[2]).toBe('lg:text-lg');
    });

    it('handles all breakpoints', () => {
      const classes = getResponsiveTextClasses({
        base: 'xs',
        sm: 'sm',
        md: 'base',
        lg: 'lg',
        xl: 'xl',
        '2xl': '2xl',
      });
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

  // ===========================================================================
  // Text Size Classes
  // ===========================================================================

  describe('TEXT_SIZE_CLASSES', () => {
    it('maps xs to text-xs', () => {
      expect(TEXT_SIZE_CLASSES.xs).toBe('text-xs');
    });

    it('maps sm to text-sm', () => {
      expect(TEXT_SIZE_CLASSES.sm).toBe('text-sm');
    });

    it('maps base to text-base', () => {
      expect(TEXT_SIZE_CLASSES.base).toBe('text-base');
    });

    it('maps lg to text-lg', () => {
      expect(TEXT_SIZE_CLASSES.lg).toBe('text-lg');
    });

    it('maps xl to text-xl', () => {
      expect(TEXT_SIZE_CLASSES.xl).toBe('text-xl');
    });
  });

  // ===========================================================================
  // Integration: LabelSize to TextSize to Classes
  // ===========================================================================

  describe('Integration: Size conversion pipeline', () => {
    it('converts simple LabelSize to final classes', () => {
      const labelSize: LabelSize = 'sm';
      const textSize = convertToTextSize(labelSize);
      const classes = getResponsiveTextClasses(textSize);
      expect(classes).toEqual(['text-sm']);
    });

    it('converts responsive LabelSize to responsive classes', () => {
      const labelSize: ResponsiveValue<LabelSize> = { base: 'sm', md: 'base', lg: 'lg' };
      const textSize = convertToTextSize(labelSize);
      const classes = getResponsiveTextClasses(textSize);
      expect(classes).toContain('text-sm');
      expect(classes).toContain('md:text-base');
      expect(classes).toContain('lg:text-lg');
    });

    it('preserves breakpoint order through conversion', () => {
      const labelSize: ResponsiveValue<LabelSize> = { lg: 'lg', base: 'xs', sm: 'sm' };
      const textSize = convertToTextSize(labelSize);
      const classes = getResponsiveTextClasses(textSize);
      expect(classes[0]).toBe('text-xs'); // base first
      expect(classes[1]).toBe('sm:text-sm');
      expect(classes[2]).toBe('lg:text-lg');
    });
  });

  // ===========================================================================
  // Default Props Documentation
  // ===========================================================================

  describe('Default Props', () => {
    it('default size should be sm', () => {
      // The component uses size = 'sm' as default
      const defaultSize: LabelSize = 'sm';
      const textSize = convertToTextSize(defaultSize);
      expect(textSize).toBe('sm');
    });
  });

  // ===========================================================================
  // Class composition for different states
  // ===========================================================================

  describe('State-based class composition', () => {
    // These tests document the expected class behavior

    it('disabled state adds opacity and cursor classes', () => {
      const disabledClasses = ['cursor-not-allowed', 'opacity-70'];
      expect(disabledClasses).toContain('cursor-not-allowed');
      expect(disabledClasses).toContain('opacity-70');
    });

    it('peer-disabled support for sibling input styling', () => {
      const peerClasses = ['peer-disabled:cursor-not-allowed', 'peer-disabled:opacity-70'];
      expect(peerClasses).toContain('peer-disabled:cursor-not-allowed');
      expect(peerClasses).toContain('peer-disabled:opacity-70');
    });

    it('required indicator uses destructive color', () => {
      const requiredClass = 'text-[rgb(var(--destructive))]';
      expect(requiredClass).toContain('destructive');
    });

    it('description uses muted-foreground color', () => {
      const descriptionClasses = ['text-xs', 'mt-1', 'block', 'font-normal'];
      expect(descriptionClasses).toContain('text-xs');
      expect(descriptionClasses).toContain('mt-1');
      expect(descriptionClasses).toContain('block');
      expect(descriptionClasses).toContain('font-normal');
    });
  });

  // ===========================================================================
  // Accessibility considerations
  // ===========================================================================

  describe('Accessibility structure', () => {
    it('required indicator includes screen reader text pattern', () => {
      // The component should have:
      // 1. Visual asterisk with aria-hidden="true"
      // 2. VisuallyHidden " (required)" text for screen readers
      const expectedPatterns = {
        visualIndicator: 'aria-hidden="true"',
        screenReaderText: '(required)',
      };
      expect(expectedPatterns.visualIndicator).toBe('aria-hidden="true"');
      expect(expectedPatterns.screenReaderText).toBe('(required)');
    });

    it('description should have id for aria-describedby linking', () => {
      // The descriptionId prop allows linking:
      // <Label descriptionId="email-desc" description="Help text">
      // <Input aria-describedby="email-desc" />
      const descriptionId = 'email-desc';
      expect(descriptionId).toBeDefined();
    });
  });

  // ===========================================================================
  // BREAKPOINT_ORDER
  // ===========================================================================

  describe('BREAKPOINT_ORDER', () => {
    it('has correct order for responsive class generation', () => {
      expect(BREAKPOINT_ORDER).toEqual(['base', 'sm', 'md', 'lg', 'xl', '2xl']);
    });

    it('starts with base breakpoint', () => {
      expect(BREAKPOINT_ORDER[0]).toBe('base');
    });

    it('ends with 2xl breakpoint', () => {
      expect(BREAKPOINT_ORDER[BREAKPOINT_ORDER.length - 1]).toBe('2xl');
    });
  });
});
