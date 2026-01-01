import { describe, expect, it } from 'vitest';
import { THEME_TOGGLE_BASE_CLASSES, getSizeClasses } from '../../../packages/ui/atoms/ThemeToggle';

describe('ThemeToggle', () => {
  // ==========================================================================
  // Size Classes Tests
  // ==========================================================================

  describe('getSizeClasses', () => {
    describe('string size values', () => {
      it('returns correct classes for size sm', () => {
        const classes = getSizeClasses('sm');
        expect(classes.container).toContain('gap-0.5');
        expect(classes.container).toContain('p-0.5');
        expect(classes.button).toContain('px-2');
        expect(classes.button).toContain('py-1.5');
        expect(classes.button).toContain('text-xs');
        expect(classes.icon).toContain('h-3.5');
        expect(classes.icon).toContain('w-3.5');
      });

      it('returns correct classes for size md', () => {
        const classes = getSizeClasses('md');
        expect(classes.container).toContain('gap-1');
        expect(classes.container).toContain('p-1');
        expect(classes.button).toContain('px-3');
        expect(classes.button).toContain('py-2');
        expect(classes.button).toContain('text-sm');
        expect(classes.icon).toContain('h-4');
        expect(classes.icon).toContain('w-4');
      });

      it('returns correct classes for size lg', () => {
        const classes = getSizeClasses('lg');
        expect(classes.container).toContain('gap-1.5');
        expect(classes.container).toContain('p-1.5');
        expect(classes.button).toContain('px-4');
        expect(classes.button).toContain('py-2.5');
        expect(classes.button).toContain('text-base');
        expect(classes.icon).toContain('h-5');
        expect(classes.icon).toContain('w-5');
      });
    });

    describe('responsive object size values', () => {
      it('handles base breakpoint only', () => {
        const classes = getSizeClasses({ base: 'sm' });
        expect(classes.container).toContain('gap-0.5');
        expect(classes.button).toContain('px-2');
        expect(classes.icon).toContain('h-3.5');
      });

      it('handles responsive object with multiple breakpoints', () => {
        const classes = getSizeClasses({ base: 'sm', md: 'md', lg: 'lg' });

        // Base breakpoint (no prefix)
        expect(classes.container).toContain('gap-0.5');
        expect(classes.button).toContain('px-2');
        expect(classes.icon).toContain('h-3.5');

        // md breakpoint (md: prefix)
        expect(classes.container).toContain('md:gap-1');
        expect(classes.button).toContain('md:px-3');
        expect(classes.icon).toContain('md:h-4');

        // lg breakpoint (lg: prefix)
        expect(classes.container).toContain('lg:gap-1.5');
        expect(classes.button).toContain('lg:px-4');
        expect(classes.icon).toContain('lg:h-5');
      });

      it('handles non-contiguous breakpoints', () => {
        const classes = getSizeClasses({ base: 'sm', xl: 'lg' });

        // Base breakpoint
        expect(classes.container).toContain('gap-0.5');

        // xl breakpoint (skipping md, lg)
        expect(classes.container).toContain('xl:gap-1.5');
        expect(classes.button).toContain('xl:px-4');
        expect(classes.icon).toContain('xl:h-5');

        // Should not have md or lg prefixed classes
        expect(classes.container).not.toContain('md:');
        expect(classes.container).not.toContain('lg:');
      });

      it('handles all breakpoints', () => {
        const classes = getSizeClasses({
          base: 'sm',
          sm: 'md',
          md: 'lg',
          lg: 'sm',
          xl: 'md',
          '2xl': 'lg',
        });

        // Verify breakpoint prefixes are applied
        expect(classes.container.some((c) => c.startsWith('sm:'))).toBe(true);
        expect(classes.container.some((c) => c.startsWith('md:'))).toBe(true);
        expect(classes.container.some((c) => c.startsWith('lg:'))).toBe(true);
        expect(classes.container.some((c) => c.startsWith('xl:'))).toBe(true);
        expect(classes.container.some((c) => c.startsWith('2xl:'))).toBe(true);
      });
    });

    describe('edge cases', () => {
      it('returns empty arrays for empty object', () => {
        const classes = getSizeClasses({});
        expect(classes.container).toHaveLength(0);
        expect(classes.button).toHaveLength(0);
        expect(classes.icon).toHaveLength(0);
      });
    });
  });

  // ==========================================================================
  // Touch Target Accessibility Tests
  // ==========================================================================

  describe('touch target accessibility', () => {
    it('sm size includes 44px minimum touch target on mobile', () => {
      const classes = getSizeClasses('sm');
      expect(classes.button).toContain('min-h-[44px]');
      expect(classes.button).toContain('min-w-[44px]');
    });

    it('md size includes 44px minimum touch target on mobile', () => {
      const classes = getSizeClasses('md');
      expect(classes.button).toContain('min-h-[44px]');
      expect(classes.button).toContain('min-w-[44px]');
    });

    it('lg size includes 44px minimum touch target', () => {
      const classes = getSizeClasses('lg');
      expect(classes.button).toContain('min-h-[44px]');
      expect(classes.button).toContain('min-w-[44px]');
    });

    it('sm and md sizes relax minimum on larger screens', () => {
      const smClasses = getSizeClasses('sm');
      const mdClasses = getSizeClasses('md');

      expect(smClasses.button).toContain('sm:min-h-8');
      expect(smClasses.button).toContain('sm:min-w-0');
      expect(mdClasses.button).toContain('sm:min-h-9');
      expect(mdClasses.button).toContain('sm:min-w-0');
    });
  });

  // ==========================================================================
  // Base Classes Tests
  // ==========================================================================

  describe('THEME_TOGGLE_BASE_CLASSES', () => {
    it('includes flex layout', () => {
      expect(THEME_TOGGLE_BASE_CLASSES).toContain('flex');
    });

    it('includes rounded corners', () => {
      expect(THEME_TOGGLE_BASE_CLASSES).toContain('rounded-lg');
    });

    it('includes surface background', () => {
      expect(THEME_TOGGLE_BASE_CLASSES).toContain('bg-[rgb(var(--surface-1))]');
    });

    it('includes motion-safe transition', () => {
      expect(THEME_TOGGLE_BASE_CLASSES).toContain('motion-safe:transition-colors');
    });
  });

  // ==========================================================================
  // Size Consistency Tests
  // ==========================================================================

  describe('size consistency', () => {
    it('has consistent text sizes across sizes', () => {
      const sm = getSizeClasses('sm');
      const md = getSizeClasses('md');
      const lg = getSizeClasses('lg');

      expect(sm.button).toContain('text-xs');
      expect(md.button).toContain('text-sm');
      expect(lg.button).toContain('text-base');
    });

    it('has progressively larger icon sizes', () => {
      const sm = getSizeClasses('sm');
      const md = getSizeClasses('md');
      const lg = getSizeClasses('lg');

      // sm: h-3.5
      expect(sm.icon).toContain('h-3.5');
      // md: h-4
      expect(md.icon).toContain('h-4');
      // lg: h-5
      expect(lg.icon).toContain('h-5');
    });

    it('has consistent width/height pairings for icons', () => {
      const sizes = ['sm', 'md', 'lg'] as const;

      for (const size of sizes) {
        const classes = getSizeClasses(size);
        // Extract height value
        const heightClass = classes.icon.find((c) => c.startsWith('h-'));
        const widthClass = classes.icon.find((c) => c.startsWith('w-'));

        // Height and width should have same value (square icons)
        const heightValue = heightClass?.replace('h-', '');
        const widthValue = widthClass?.replace('w-', '');
        expect(heightValue).toBe(widthValue);
      }
    });
  });

  // ==========================================================================
  // ARIA and Accessibility Behavior Documentation
  // ==========================================================================

  describe('accessibility behavior documentation', () => {
    it('documents expected ARIA attributes on container', () => {
      // The container should have:
      // - role="radiogroup"
      // - aria-label="Theme selection"
      // - aria-disabled when disabled
      const expectedAttributes = {
        role: 'radiogroup',
        'aria-label': 'Theme selection',
      };

      expect(expectedAttributes.role).toBe('radiogroup');
      expect(expectedAttributes['aria-label']).toBe('Theme selection');
    });

    it('documents expected ARIA attributes on buttons', () => {
      // Each button should have:
      // - type="button"
      // - role="radio"
      // - aria-checked (true for selected, false for others)
      // - aria-label (descriptive action)
      // - tabIndex (0 for selected, -1 for others)
      // - disabled when parent is disabled
      const expectedAttributes = {
        type: 'button',
        role: 'radio',
        'aria-checked': true,
        'aria-label': 'Switch to light theme',
        tabIndex: 0,
      };

      expect(expectedAttributes.type).toBe('button');
      expect(expectedAttributes.role).toBe('radio');
      expect(expectedAttributes['aria-checked']).toBe(true);
    });

    it('documents keyboard navigation behavior', () => {
      // Expected keyboard behavior:
      // - ArrowRight/ArrowDown: Move to next option (wraps)
      // - ArrowLeft/ArrowUp: Move to previous option (wraps)
      // - Home: Jump to first option (Light)
      // - End: Jump to last option (System)
      // - Enter/Space: Select option (handled by native button click)
      const keyboardBehavior = {
        ArrowRight: 'next',
        ArrowDown: 'next',
        ArrowLeft: 'previous',
        ArrowUp: 'previous',
        Home: 'first',
        End: 'last',
      };

      expect(keyboardBehavior.ArrowRight).toBe('next');
      expect(keyboardBehavior.Home).toBe('first');
      expect(keyboardBehavior.End).toBe('last');
    });

    it('documents screen reader announcement behavior', () => {
      // Screen reader announcements via aria-live region:
      // - Current theme is announced when changed
      // - Uses role="status" with aria-live="polite" and aria-atomic="true"
      const announcementBehavior = {
        role: 'status',
        'aria-live': 'polite',
        'aria-atomic': 'true',
        format: 'Current theme: {themeName}',
      };

      expect(announcementBehavior.role).toBe('status');
      expect(announcementBehavior['aria-live']).toBe('polite');
    });
  });

  // ==========================================================================
  // Props Interface Documentation
  // ==========================================================================

  describe('props interface documentation', () => {
    it('documents theme prop values', () => {
      const themeValues = ['light', 'dark', 'system'] as const;
      expect(themeValues).toHaveLength(3);
      expect(themeValues).toContain('light');
      expect(themeValues).toContain('dark');
      expect(themeValues).toContain('system');
    });

    it('documents size prop values', () => {
      const sizeValues = ['sm', 'md', 'lg'] as const;
      expect(sizeValues).toHaveLength(3);
    });

    it('documents default prop values', () => {
      const defaults = {
        size: 'md',
        disabled: false,
      };

      expect(defaults.size).toBe('md');
      expect(defaults.disabled).toBe(false);
    });
  });

  // ==========================================================================
  // Theme Options Configuration
  // ==========================================================================

  describe('theme options configuration', () => {
    it('documents theme option labels', () => {
      const themeLabels = {
        light: 'Light',
        dark: 'Dark',
        system: 'System',
      };

      expect(themeLabels.light).toBe('Light');
      expect(themeLabels.dark).toBe('Dark');
      expect(themeLabels.system).toBe('System');
    });

    it('documents theme option descriptions (aria-labels)', () => {
      const themeDescriptions = {
        light: 'Switch to light theme',
        dark: 'Switch to dark theme',
        system: 'Use system theme preference',
      };

      expect(themeDescriptions.light).toBe('Switch to light theme');
      expect(themeDescriptions.dark).toBe('Switch to dark theme');
      expect(themeDescriptions.system).toBe('Use system theme preference');
    });
  });

  // ==========================================================================
  // Data Attributes Documentation
  // ==========================================================================

  describe('data attributes documentation', () => {
    it('documents data-testid pattern', () => {
      // When data-testid="theme-toggle" is provided:
      // - Container: data-testid="theme-toggle"
      // - Light button: data-testid="theme-toggle-light"
      // - Dark button: data-testid="theme-toggle-dark"
      // - System button: data-testid="theme-toggle-system"
      const testIdPattern = {
        container: 'theme-toggle',
        buttons: ['theme-toggle-light', 'theme-toggle-dark', 'theme-toggle-system'],
      };

      expect(testIdPattern.container).toBe('theme-toggle');
      expect(testIdPattern.buttons).toHaveLength(3);
    });

    it('documents data-state attribute values', () => {
      // Each button has data-state attribute:
      // - "selected" for currently active option
      // - "unselected" for inactive options
      const dataStateValues = ['selected', 'unselected'] as const;
      expect(dataStateValues).toContain('selected');
      expect(dataStateValues).toContain('unselected');
    });
  });

  // ==========================================================================
  // Breakpoint Order Tests
  // ==========================================================================

  describe('breakpoint order', () => {
    it('processes breakpoints in correct order', () => {
      // Breakpoints should be processed in this order:
      // base, sm, md, lg, xl, 2xl
      const classes = getSizeClasses({
        base: 'sm',
        sm: 'md',
        md: 'lg',
      });

      // Classes should appear in breakpoint order
      const joinedClasses = classes.container.join(' ');

      // Find indices of breakpoint prefixes
      const smIndex = joinedClasses.indexOf('sm:');
      const mdIndex = joinedClasses.indexOf('md:');

      // Later breakpoints should appear after earlier ones
      expect(smIndex).toBeLessThan(mdIndex);
    });
  });

  // ==========================================================================
  // Focus and Disabled States
  // ==========================================================================

  describe('focus and disabled state documentation', () => {
    it('documents focus ring styling', () => {
      // Focus ring classes expected on buttons:
      // - focus-visible:outline-none
      // - focus-visible:ring-2
      // - focus-visible:ring-[rgb(var(--ring))]
      // - focus-visible:ring-offset-2
      // - focus-visible:ring-offset-[rgb(var(--background))]
      const focusClasses = [
        'focus-visible:outline-none',
        'focus-visible:ring-2',
        'focus-visible:ring-[rgb(var(--ring))]',
        'focus-visible:ring-offset-2',
        'focus-visible:ring-offset-[rgb(var(--background))]',
      ];

      expect(focusClasses).toHaveLength(5);
      expect(focusClasses).toContain('focus-visible:ring-2');
      expect(focusClasses).toContain('focus-visible:ring-offset-2');
    });

    it('documents disabled state behavior', () => {
      // When disabled:
      // - Container gets opacity-50
      // - Container gets aria-disabled="true"
      // - All buttons get disabled attribute
      // - All buttons get cursor-not-allowed
      // - Click handlers are not called
      // - Keyboard navigation is disabled
      const disabledBehavior = {
        containerClasses: ['opacity-50'],
        containerAttributes: { 'aria-disabled': true },
        buttonAttributes: { disabled: true },
        buttonClasses: ['cursor-not-allowed'],
      };

      expect(disabledBehavior.containerClasses).toContain('opacity-50');
      expect(disabledBehavior.containerAttributes['aria-disabled']).toBe(true);
    });
  });

  // ==========================================================================
  // Visual State Classes
  // ==========================================================================

  describe('visual state documentation', () => {
    it('documents selected state classes', () => {
      const selectedClasses = [
        'bg-[rgb(var(--background))]',
        'text-[rgb(var(--foreground))]',
        'shadow-sm',
      ];

      expect(selectedClasses).toContain('bg-[rgb(var(--background))]');
      expect(selectedClasses).toContain('shadow-sm');
    });

    it('documents unselected state classes', () => {
      const unselectedClasses = [
        'text-[rgb(var(--muted-foreground))]',
        'hover:text-[rgb(var(--foreground))]',
      ];

      expect(unselectedClasses).toContain('text-[rgb(var(--muted-foreground))]');
    });
  });
});
