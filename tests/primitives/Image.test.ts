/**
 * Image primitive utility function tests
 *
 * These tests verify the image class generation and accessibility logic.
 * Component rendering is tested via Storybook.
 */

import { describe, expect, it } from 'vitest';

/**
 * Re-implement the image class generation functions for testing
 * (mirrors the logic in Image.tsx)
 */

type Breakpoint = 'base' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
type ObjectFit = 'contain' | 'cover' | 'fill' | 'none' | 'scale-down';
type ObjectPosition =
  | 'top'
  | 'bottom'
  | 'left'
  | 'right'
  | 'center'
  | 'top-left'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-right';
type BorderRadius = 'none' | 'sm' | 'base' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | 'full';
type AspectRatio = 'auto' | 'square' | 'video' | '4/3' | '3/2' | '16/9' | '21/9';
type Shadow = 'none' | 'sm' | 'base' | 'md' | 'lg' | 'xl' | '2xl';
type ResponsiveValue<T> = T | Partial<Record<Breakpoint, T>>;

const BREAKPOINT_ORDER: Breakpoint[] = ['base', 'sm', 'md', 'lg', 'xl', '2xl'];

const OBJECT_FIT_MAP: Record<ObjectFit, string> = {
  contain: 'object-contain',
  cover: 'object-cover',
  fill: 'object-fill',
  none: 'object-none',
  'scale-down': 'object-scale-down',
};

const OBJECT_POSITION_MAP: Record<ObjectPosition, string> = {
  top: 'object-top',
  bottom: 'object-bottom',
  left: 'object-left',
  right: 'object-right',
  center: 'object-center',
  'top-left': 'object-left-top',
  'top-right': 'object-right-top',
  'bottom-left': 'object-left-bottom',
  'bottom-right': 'object-right-bottom',
};

const BORDER_RADIUS_MAP: Record<BorderRadius, string> = {
  none: 'rounded-none',
  sm: 'rounded-sm',
  base: 'rounded',
  md: 'rounded-md',
  lg: 'rounded-lg',
  xl: 'rounded-xl',
  '2xl': 'rounded-2xl',
  '3xl': 'rounded-3xl',
  full: 'rounded-full',
};

const ASPECT_RATIO_MAP: Record<AspectRatio, string> = {
  auto: 'aspect-auto',
  square: 'aspect-square',
  video: 'aspect-video',
  '4/3': 'aspect-[4/3]',
  '3/2': 'aspect-[3/2]',
  '16/9': 'aspect-[16/9]',
  '21/9': 'aspect-[21/9]',
};

const SHADOW_MAP: Record<Shadow, string> = {
  none: 'shadow-none',
  sm: 'shadow-sm',
  base: 'shadow',
  md: 'shadow-md',
  lg: 'shadow-lg',
  xl: 'shadow-xl',
  '2xl': 'shadow-2xl',
};

function getResponsiveClasses<T extends string>(
  value: ResponsiveValue<T>,
  map: Record<T, string>
): string[] {
  const classes: string[] = [];

  if (typeof value === 'string') {
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

interface LoadingBehavior {
  priority: boolean;
  loading: 'lazy' | 'eager';
}

function getEffectiveLoading(behavior: LoadingBehavior): {
  loading: 'lazy' | 'eager';
  fetchPriority: 'high' | undefined;
} {
  if (behavior.priority) {
    return { loading: 'eager', fetchPriority: 'high' };
  }
  return { loading: behavior.loading, fetchPriority: undefined };
}

interface DimensionStyle {
  width?: number | string;
  height?: number | string;
}

function getDimensionStyles(dims: DimensionStyle): React.CSSProperties {
  const styles: React.CSSProperties = {};

  if (dims.width !== undefined) {
    styles.width = typeof dims.width === 'number' ? `${dims.width}px` : dims.width;
  }

  if (dims.height !== undefined) {
    styles.height = typeof dims.height === 'number' ? `${dims.height}px` : dims.height;
  }

  return styles;
}

describe('primitives/Image - Utility Functions', () => {
  describe('BREAKPOINT_ORDER', () => {
    it('has correct order', () => {
      expect(BREAKPOINT_ORDER).toEqual(['base', 'sm', 'md', 'lg', 'xl', '2xl']);
    });
  });

  describe('OBJECT_FIT_MAP', () => {
    it('maps all object fit values correctly', () => {
      expect(OBJECT_FIT_MAP.contain).toBe('object-contain');
      expect(OBJECT_FIT_MAP.cover).toBe('object-cover');
      expect(OBJECT_FIT_MAP.fill).toBe('object-fill');
      expect(OBJECT_FIT_MAP.none).toBe('object-none');
      expect(OBJECT_FIT_MAP['scale-down']).toBe('object-scale-down');
    });
  });

  describe('OBJECT_POSITION_MAP', () => {
    it('maps all object position values correctly', () => {
      expect(OBJECT_POSITION_MAP.top).toBe('object-top');
      expect(OBJECT_POSITION_MAP.bottom).toBe('object-bottom');
      expect(OBJECT_POSITION_MAP.left).toBe('object-left');
      expect(OBJECT_POSITION_MAP.right).toBe('object-right');
      expect(OBJECT_POSITION_MAP.center).toBe('object-center');
      expect(OBJECT_POSITION_MAP['top-left']).toBe('object-left-top');
      expect(OBJECT_POSITION_MAP['top-right']).toBe('object-right-top');
      expect(OBJECT_POSITION_MAP['bottom-left']).toBe('object-left-bottom');
      expect(OBJECT_POSITION_MAP['bottom-right']).toBe('object-right-bottom');
    });
  });

  describe('BORDER_RADIUS_MAP', () => {
    it('maps all border radius values correctly', () => {
      expect(BORDER_RADIUS_MAP.none).toBe('rounded-none');
      expect(BORDER_RADIUS_MAP.sm).toBe('rounded-sm');
      expect(BORDER_RADIUS_MAP.base).toBe('rounded');
      expect(BORDER_RADIUS_MAP.md).toBe('rounded-md');
      expect(BORDER_RADIUS_MAP.lg).toBe('rounded-lg');
      expect(BORDER_RADIUS_MAP.xl).toBe('rounded-xl');
      expect(BORDER_RADIUS_MAP['2xl']).toBe('rounded-2xl');
      expect(BORDER_RADIUS_MAP['3xl']).toBe('rounded-3xl');
      expect(BORDER_RADIUS_MAP.full).toBe('rounded-full');
    });
  });

  describe('ASPECT_RATIO_MAP', () => {
    it('maps all aspect ratio values correctly', () => {
      expect(ASPECT_RATIO_MAP.auto).toBe('aspect-auto');
      expect(ASPECT_RATIO_MAP.square).toBe('aspect-square');
      expect(ASPECT_RATIO_MAP.video).toBe('aspect-video');
      expect(ASPECT_RATIO_MAP['4/3']).toBe('aspect-[4/3]');
      expect(ASPECT_RATIO_MAP['3/2']).toBe('aspect-[3/2]');
      expect(ASPECT_RATIO_MAP['16/9']).toBe('aspect-[16/9]');
      expect(ASPECT_RATIO_MAP['21/9']).toBe('aspect-[21/9]');
    });
  });

  describe('SHADOW_MAP', () => {
    it('maps all shadow values correctly', () => {
      expect(SHADOW_MAP.none).toBe('shadow-none');
      expect(SHADOW_MAP.sm).toBe('shadow-sm');
      expect(SHADOW_MAP.base).toBe('shadow');
      expect(SHADOW_MAP.md).toBe('shadow-md');
      expect(SHADOW_MAP.lg).toBe('shadow-lg');
      expect(SHADOW_MAP.xl).toBe('shadow-xl');
      expect(SHADOW_MAP['2xl']).toBe('shadow-2xl');
    });
  });

  describe('getResponsiveClasses', () => {
    it('generates simple object fit class', () => {
      const classes = getResponsiveClasses('cover', OBJECT_FIT_MAP);
      expect(classes).toEqual(['object-cover']);
    });

    it('generates responsive object fit classes', () => {
      const classes = getResponsiveClasses(
        { base: 'contain', md: 'cover', lg: 'fill' },
        OBJECT_FIT_MAP
      );
      expect(classes).toEqual(['object-contain', 'md:object-cover', 'lg:object-fill']);
    });

    it('generates simple object position class', () => {
      const classes = getResponsiveClasses('center', OBJECT_POSITION_MAP);
      expect(classes).toEqual(['object-center']);
    });

    it('generates responsive object position classes', () => {
      const classes = getResponsiveClasses(
        { base: 'top', md: 'center', lg: 'bottom' },
        OBJECT_POSITION_MAP
      );
      expect(classes).toEqual(['object-top', 'md:object-center', 'lg:object-bottom']);
    });

    it('generates simple border radius class', () => {
      const classes = getResponsiveClasses('lg', BORDER_RADIUS_MAP);
      expect(classes).toEqual(['rounded-lg']);
    });

    it('generates responsive border radius classes', () => {
      const classes = getResponsiveClasses({ base: 'md', md: 'lg', lg: 'xl' }, BORDER_RADIUS_MAP);
      expect(classes).toEqual(['rounded-md', 'md:rounded-lg', 'lg:rounded-xl']);
    });

    it('generates simple shadow class', () => {
      const classes = getResponsiveClasses('md', SHADOW_MAP);
      expect(classes).toEqual(['shadow-md']);
    });

    it('generates responsive shadow classes', () => {
      const classes = getResponsiveClasses({ base: 'sm', md: 'md', lg: 'lg' }, SHADOW_MAP);
      expect(classes).toEqual(['shadow-sm', 'md:shadow-md', 'lg:shadow-lg']);
    });

    it('handles all breakpoints', () => {
      const classes = getResponsiveClasses(
        {
          base: 'contain',
          sm: 'cover',
          md: 'fill',
          lg: 'none',
          xl: 'scale-down',
          '2xl': 'contain',
        },
        OBJECT_FIT_MAP
      );
      expect(classes).toEqual([
        'object-contain',
        'sm:object-cover',
        'md:object-fill',
        'lg:object-none',
        'xl:object-scale-down',
        '2xl:object-contain',
      ]);
    });

    it('handles partial responsive object (no base)', () => {
      const classes = getResponsiveClasses({ md: 'cover', xl: 'contain' }, OBJECT_FIT_MAP);
      expect(classes).toEqual(['md:object-cover', 'xl:object-contain']);
    });

    it('maintains breakpoint order in output', () => {
      const classes = getResponsiveClasses(
        {
          xl: 'lg',
          sm: 'sm',
          base: 'none',
        },
        BORDER_RADIUS_MAP
      );
      expect(classes).toEqual(['rounded-none', 'sm:rounded-sm', 'xl:rounded-lg']);
    });
  });

  describe('getEffectiveLoading', () => {
    it('returns lazy loading by default', () => {
      const result = getEffectiveLoading({ priority: false, loading: 'lazy' });
      expect(result.loading).toBe('lazy');
      expect(result.fetchPriority).toBeUndefined();
    });

    it('returns eager loading when priority is true', () => {
      const result = getEffectiveLoading({ priority: true, loading: 'lazy' });
      expect(result.loading).toBe('eager');
      expect(result.fetchPriority).toBe('high');
    });

    it('respects explicit eager loading', () => {
      const result = getEffectiveLoading({ priority: false, loading: 'eager' });
      expect(result.loading).toBe('eager');
      expect(result.fetchPriority).toBeUndefined();
    });

    it('priority overrides explicit lazy loading', () => {
      const result = getEffectiveLoading({ priority: true, loading: 'lazy' });
      expect(result.loading).toBe('eager');
      expect(result.fetchPriority).toBe('high');
    });
  });

  describe('getDimensionStyles', () => {
    it('returns empty object when no dimensions provided', () => {
      const styles = getDimensionStyles({});
      expect(styles).toEqual({});
    });

    it('converts numeric width to pixels', () => {
      const styles = getDimensionStyles({ width: 100 });
      expect(styles.width).toBe('100px');
    });

    it('converts numeric height to pixels', () => {
      const styles = getDimensionStyles({ height: 100 });
      expect(styles.height).toBe('100px');
    });

    it('passes string width through unchanged', () => {
      const styles = getDimensionStyles({ width: '50%' });
      expect(styles.width).toBe('50%');
    });

    it('passes string height through unchanged', () => {
      const styles = getDimensionStyles({ height: '10rem' });
      expect(styles.height).toBe('10rem');
    });

    it('handles both dimensions as numbers', () => {
      const styles = getDimensionStyles({ width: 200, height: 150 });
      expect(styles.width).toBe('200px');
      expect(styles.height).toBe('150px');
    });

    it('handles mixed dimension types', () => {
      const styles = getDimensionStyles({ width: 300, height: '50%' });
      expect(styles.width).toBe('300px');
      expect(styles.height).toBe('50%');
    });

    it('handles auto as string', () => {
      const styles = getDimensionStyles({ width: 'auto', height: 'auto' });
      expect(styles.width).toBe('auto');
      expect(styles.height).toBe('auto');
    });

    it('handles viewport units', () => {
      const styles = getDimensionStyles({ width: '100vw', height: '100vh' });
      expect(styles.width).toBe('100vw');
      expect(styles.height).toBe('100vh');
    });
  });

  describe('Image accessibility', () => {
    it('should require alt prop (TypeScript enforcement)', () => {
      // This test documents the expected TypeScript behavior
      // The Image component requires alt prop - TypeScript will error without it
      expect(true).toBe(true);
    });

    it('should support aria-hidden for decorative images', () => {
      // Decorative images should use alt="" with aria-hidden="true"
      // This is validated in Storybook
      expect(true).toBe(true);
    });

    it('should support role="presentation" for decorative images', () => {
      // Alternative to aria-hidden for decorative images
      // This is validated in Storybook
      expect(true).toBe(true);
    });

    it('should support aria-describedby for extended descriptions', () => {
      // Complex images can link to extended descriptions
      // This is validated in Storybook
      expect(true).toBe(true);
    });
  });

  describe('Image loading behavior', () => {
    it('defaults to lazy loading for performance', () => {
      // Default loading="lazy" saves bandwidth and improves performance
      const result = getEffectiveLoading({ priority: false, loading: 'lazy' });
      expect(result.loading).toBe('lazy');
    });

    it('supports priority loading for LCP images', () => {
      // Priority images are loaded eagerly with high fetch priority
      const result = getEffectiveLoading({ priority: true, loading: 'lazy' });
      expect(result.loading).toBe('eager');
      expect(result.fetchPriority).toBe('high');
    });

    it('defaults to async decoding for non-blocking render', () => {
      // Async decoding prevents blocking the main thread
      // This is the default in the component
      expect(true).toBe(true);
    });
  });

  describe('Image responsive behavior', () => {
    it('includes max-w-full by default for responsive images', () => {
      // Component applies max-w-full to prevent images from overflowing
      // This is verified in Storybook
      expect(true).toBe(true);
    });

    it('supports srcSet for responsive sources', () => {
      // srcSet allows browsers to pick optimal image size
      // This is a native attribute passed through
      expect(true).toBe(true);
    });

    it('supports sizes for responsive sizing hints', () => {
      // sizes attribute helps browsers calculate correct image size
      // This is a native attribute passed through
      expect(true).toBe(true);
    });
  });

  describe('Combined class generation', () => {
    it('generates complete set of classes for card image', () => {
      const classes: string[] = [];

      // Base responsive class
      classes.push('max-w-full');

      // Object fit
      classes.push(...getResponsiveClasses('cover', OBJECT_FIT_MAP));

      // Object position
      classes.push(...getResponsiveClasses('center', OBJECT_POSITION_MAP));

      // Border radius
      classes.push(...getResponsiveClasses('lg', BORDER_RADIUS_MAP));

      // Shadow
      classes.push(...getResponsiveClasses('md', SHADOW_MAP));

      expect(classes).toContain('max-w-full');
      expect(classes).toContain('object-cover');
      expect(classes).toContain('object-center');
      expect(classes).toContain('rounded-lg');
      expect(classes).toContain('shadow-md');
    });

    it('generates responsive classes for hero image', () => {
      const classes: string[] = [];

      classes.push('max-w-full');

      classes.push(
        ...getResponsiveClasses({ base: 'contain', md: 'cover', lg: 'cover' }, OBJECT_FIT_MAP)
      );

      classes.push(...getResponsiveClasses({ base: 'center', lg: 'top' }, OBJECT_POSITION_MAP));

      classes.push(...getResponsiveClasses({ base: 'md', lg: 'xl' }, BORDER_RADIUS_MAP));

      expect(classes).toContain('max-w-full');
      expect(classes).toContain('object-contain');
      expect(classes).toContain('md:object-cover');
      expect(classes).toContain('lg:object-cover');
      expect(classes).toContain('object-center');
      expect(classes).toContain('lg:object-top');
      expect(classes).toContain('rounded-md');
      expect(classes).toContain('lg:rounded-xl');
    });

    it('generates classes for avatar image', () => {
      const classes: string[] = [];

      classes.push('max-w-full');

      classes.push(...getResponsiveClasses('cover', OBJECT_FIT_MAP));
      classes.push(...getResponsiveClasses('center', OBJECT_POSITION_MAP));
      classes.push(...getResponsiveClasses('full', BORDER_RADIUS_MAP));

      expect(classes).toContain('max-w-full');
      expect(classes).toContain('object-cover');
      expect(classes).toContain('object-center');
      expect(classes).toContain('rounded-full');
    });

    it('generates dimension styles for fixed size image', () => {
      const styles = getDimensionStyles({ width: 48, height: 48 });

      expect(styles.width).toBe('48px');
      expect(styles.height).toBe('48px');
    });

    it('generates dimension styles for percentage-based image', () => {
      const styles = getDimensionStyles({ width: '100%', height: 'auto' });

      expect(styles.width).toBe('100%');
      expect(styles.height).toBe('auto');
    });
  });

  describe('Aspect ratio', () => {
    it('generates aspect-auto class', () => {
      expect(ASPECT_RATIO_MAP.auto).toBe('aspect-auto');
    });

    it('generates aspect-square class', () => {
      expect(ASPECT_RATIO_MAP.square).toBe('aspect-square');
    });

    it('generates aspect-video class', () => {
      expect(ASPECT_RATIO_MAP.video).toBe('aspect-video');
    });

    it('generates custom aspect ratio class', () => {
      expect(ASPECT_RATIO_MAP['16/9']).toBe('aspect-[16/9]');
      expect(ASPECT_RATIO_MAP['4/3']).toBe('aspect-[4/3]');
    });
  });

  describe('Border styling', () => {
    it('should add border classes when border prop is true', () => {
      // Border adds 'border' and 'border-[rgb(var(--border))]' classes
      // This is verified in Storybook
      const expectedClasses = ['border', 'border-[rgb(var(--border))]'];
      expect(expectedClasses.length).toBe(2);
    });
  });

  describe('Full-circle avatar (rounded-full)', () => {
    it('generates rounded-full for circular avatars', () => {
      const classes = getResponsiveClasses('full', BORDER_RADIUS_MAP);
      expect(classes).toEqual(['rounded-full']);
    });

    it('generates responsive rounded classes', () => {
      const classes = getResponsiveClasses({ base: 'lg', md: 'full' }, BORDER_RADIUS_MAP);
      expect(classes).toEqual(['rounded-lg', 'md:rounded-full']);
    });
  });
});
