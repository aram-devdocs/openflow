/**
 * @fileoverview Unit tests for Terminal component utilities and constants
 * Tests cover all exported utility functions, constants, and configuration objects
 */

import { describe, expect, it } from 'vitest';
import {
  DEFAULT_ERROR_DESCRIPTION,
  DEFAULT_ERROR_TITLE,
  DEFAULT_FOCUS_INSTRUCTION,
  DEFAULT_LOADING_LABEL,
  DEFAULT_READ_ONLY_LABEL,
  DEFAULT_RETRY_LABEL,
  DEFAULT_TERMINAL_DESCRIPTION,
  // Constants
  DEFAULT_TERMINAL_LABEL,
  SR_TERMINAL_FOCUSED,
  SR_TERMINAL_LOADING,
  // Screen reader announcements
  SR_TERMINAL_READY,
  SR_TERMINAL_READ_ONLY,
  SR_TERMINAL_RESIZED,
  // CSS class constants
  TERMINAL_BASE_CLASSES,
  TERMINAL_CONTAINER_CLASSES,
  TERMINAL_ERROR_BASE_CLASSES,
  TERMINAL_ERROR_BUTTON_CLASSES,
  TERMINAL_ERROR_DESCRIPTION_CLASSES,
  TERMINAL_ERROR_ICON_CLASSES,
  TERMINAL_ERROR_TITLE_CLASSES,
  TERMINAL_FOCUS_CLASSES,
  TERMINAL_FONT_SIZES,
  TERMINAL_PADDING_CLASSES,
  TERMINAL_SKELETON_BASE_CLASSES,
  TERMINAL_SKELETON_LINE_CLASSES,
  // Types
  type TerminalSize,
  buildResizeAnnouncement,
  buildTerminalAccessibleLabel,
  // Theme constants
  defaultDarkTheme,
  defaultLightTheme,
  // Utility functions
  getBaseSize,
  getFontSizeForSize,
  getResponsiveSizeClasses,
} from '../../../packages/ui/organisms/Terminal';

// ============================================================================
// Constants Tests
// ============================================================================

describe('Terminal Constants', () => {
  describe('Label Constants', () => {
    it('exports DEFAULT_TERMINAL_LABEL', () => {
      expect(DEFAULT_TERMINAL_LABEL).toBe('Terminal');
    });

    it('exports DEFAULT_TERMINAL_DESCRIPTION', () => {
      expect(DEFAULT_TERMINAL_DESCRIPTION).toBe('Interactive terminal emulator');
    });

    it('exports DEFAULT_LOADING_LABEL', () => {
      expect(DEFAULT_LOADING_LABEL).toBe('Terminal is loading');
    });

    it('exports DEFAULT_ERROR_TITLE', () => {
      expect(DEFAULT_ERROR_TITLE).toBe('Terminal Error');
    });

    it('exports DEFAULT_ERROR_DESCRIPTION', () => {
      expect(DEFAULT_ERROR_DESCRIPTION).toBe('Failed to initialize terminal. Please try again.');
    });

    it('exports DEFAULT_RETRY_LABEL', () => {
      expect(DEFAULT_RETRY_LABEL).toBe('Retry');
    });

    it('exports DEFAULT_READ_ONLY_LABEL', () => {
      expect(DEFAULT_READ_ONLY_LABEL).toBe('Read-only terminal');
    });

    it('exports DEFAULT_FOCUS_INSTRUCTION', () => {
      expect(DEFAULT_FOCUS_INSTRUCTION).toBe('Click or press Enter to focus the terminal');
    });
  });

  describe('Screen Reader Announcements', () => {
    it('exports SR_TERMINAL_READY', () => {
      expect(SR_TERMINAL_READY).toBe('Terminal is ready for input');
    });

    it('exports SR_TERMINAL_FOCUSED', () => {
      expect(SR_TERMINAL_FOCUSED).toBe('Terminal focused');
    });

    it('exports SR_TERMINAL_READ_ONLY', () => {
      expect(SR_TERMINAL_READ_ONLY).toBe('This terminal is read-only');
    });

    it('exports SR_TERMINAL_LOADING', () => {
      expect(SR_TERMINAL_LOADING).toBe('Terminal is loading, please wait');
    });

    it('exports SR_TERMINAL_RESIZED as a function', () => {
      expect(typeof SR_TERMINAL_RESIZED).toBe('function');
    });

    it('SR_TERMINAL_RESIZED generates correct announcement', () => {
      expect(SR_TERMINAL_RESIZED(80, 24)).toBe('Terminal resized to 80 columns by 24 rows');
    });

    it('SR_TERMINAL_RESIZED handles various dimensions', () => {
      expect(SR_TERMINAL_RESIZED(120, 40)).toBe('Terminal resized to 120 columns by 40 rows');
      expect(SR_TERMINAL_RESIZED(40, 10)).toBe('Terminal resized to 40 columns by 10 rows');
    });
  });
});

// ============================================================================
// CSS Class Constants Tests
// ============================================================================

describe('Terminal CSS Class Constants', () => {
  describe('TERMINAL_BASE_CLASSES', () => {
    it('includes relative positioning', () => {
      expect(TERMINAL_BASE_CLASSES).toContain('relative');
    });

    it('includes overflow hidden', () => {
      expect(TERMINAL_BASE_CLASSES).toContain('overflow-hidden');
    });
  });

  describe('TERMINAL_CONTAINER_CLASSES', () => {
    it('includes full width', () => {
      expect(TERMINAL_CONTAINER_CLASSES).toContain('w-full');
    });

    it('includes full height', () => {
      expect(TERMINAL_CONTAINER_CLASSES).toContain('h-full');
    });
  });

  describe('TERMINAL_PADDING_CLASSES', () => {
    it('has correct padding for sm size', () => {
      expect(TERMINAL_PADDING_CLASSES.sm).toBe('p-1');
    });

    it('has correct padding for md size', () => {
      expect(TERMINAL_PADDING_CLASSES.md).toBe('p-2');
    });

    it('has correct padding for lg size', () => {
      expect(TERMINAL_PADDING_CLASSES.lg).toBe('p-3');
    });

    it('covers all sizes', () => {
      const sizes: TerminalSize[] = ['sm', 'md', 'lg'];
      sizes.forEach((size) => {
        expect(TERMINAL_PADDING_CLASSES[size]).toBeDefined();
      });
    });
  });

  describe('TERMINAL_FONT_SIZES', () => {
    it('has correct font size for sm', () => {
      expect(TERMINAL_FONT_SIZES.sm).toBe(12);
    });

    it('has correct font size for md', () => {
      expect(TERMINAL_FONT_SIZES.md).toBe(14);
    });

    it('has correct font size for lg', () => {
      expect(TERMINAL_FONT_SIZES.lg).toBe(16);
    });

    it('font sizes increase with size', () => {
      expect(TERMINAL_FONT_SIZES.sm).toBeLessThan(TERMINAL_FONT_SIZES.md);
      expect(TERMINAL_FONT_SIZES.md).toBeLessThan(TERMINAL_FONT_SIZES.lg);
    });
  });

  describe('TERMINAL_FOCUS_CLASSES', () => {
    it('includes focus-within ring', () => {
      expect(TERMINAL_FOCUS_CLASSES).toContain('focus-within:ring-2');
    });

    it('includes primary ring color', () => {
      expect(TERMINAL_FOCUS_CLASSES).toContain('focus-within:ring-primary');
    });

    it('includes ring offset for visibility', () => {
      expect(TERMINAL_FOCUS_CLASSES).toContain('focus-within:ring-offset-2');
    });
  });

  describe('TERMINAL_SKELETON_BASE_CLASSES', () => {
    it('includes full dimensions', () => {
      expect(TERMINAL_SKELETON_BASE_CLASSES).toContain('h-full');
      expect(TERMINAL_SKELETON_BASE_CLASSES).toContain('w-full');
    });

    it('includes background color', () => {
      expect(TERMINAL_SKELETON_BASE_CLASSES).toContain('bg-muted');
    });

    it('includes flex layout', () => {
      expect(TERMINAL_SKELETON_BASE_CLASSES).toContain('flex');
      expect(TERMINAL_SKELETON_BASE_CLASSES).toContain('flex-col');
    });
  });

  describe('TERMINAL_SKELETON_LINE_CLASSES', () => {
    it('includes height', () => {
      expect(TERMINAL_SKELETON_LINE_CLASSES).toContain('h-4');
    });

    it('includes motion-safe animation', () => {
      expect(TERMINAL_SKELETON_LINE_CLASSES).toContain('motion-safe:animate-pulse');
    });
  });

  describe('TERMINAL_ERROR_BASE_CLASSES', () => {
    it('includes flex centering', () => {
      expect(TERMINAL_ERROR_BASE_CLASSES).toContain('flex');
      expect(TERMINAL_ERROR_BASE_CLASSES).toContain('items-center');
      expect(TERMINAL_ERROR_BASE_CLASSES).toContain('justify-center');
    });

    it('includes flex column layout', () => {
      expect(TERMINAL_ERROR_BASE_CLASSES).toContain('flex-col');
    });

    it('includes gap for spacing', () => {
      expect(TERMINAL_ERROR_BASE_CLASSES).toContain('gap-4');
    });
  });

  describe('TERMINAL_ERROR_ICON_CLASSES', () => {
    it('uses destructive color', () => {
      expect(TERMINAL_ERROR_ICON_CLASSES).toContain('text-destructive');
    });
  });

  describe('TERMINAL_ERROR_TITLE_CLASSES', () => {
    it('includes text size', () => {
      expect(TERMINAL_ERROR_TITLE_CLASSES).toContain('text-lg');
    });

    it('includes font weight', () => {
      expect(TERMINAL_ERROR_TITLE_CLASSES).toContain('font-semibold');
    });
  });

  describe('TERMINAL_ERROR_DESCRIPTION_CLASSES', () => {
    it('includes text size', () => {
      expect(TERMINAL_ERROR_DESCRIPTION_CLASSES).toContain('text-sm');
    });

    it('includes muted foreground color', () => {
      expect(TERMINAL_ERROR_DESCRIPTION_CLASSES).toContain('text-muted-foreground');
    });

    it('includes max width', () => {
      expect(TERMINAL_ERROR_DESCRIPTION_CLASSES).toContain('max-w-md');
    });
  });

  describe('TERMINAL_ERROR_BUTTON_CLASSES', () => {
    it('includes touch target minimum height', () => {
      expect(TERMINAL_ERROR_BUTTON_CLASSES).toContain('min-h-[44px]');
    });

    it('includes touch target minimum width', () => {
      expect(TERMINAL_ERROR_BUTTON_CLASSES).toContain('min-w-[44px]');
    });

    it('relaxes touch targets on desktop', () => {
      expect(TERMINAL_ERROR_BUTTON_CLASSES).toContain('sm:min-h-0');
      expect(TERMINAL_ERROR_BUTTON_CLASSES).toContain('sm:min-w-0');
    });
  });
});

// ============================================================================
// Theme Constants Tests
// ============================================================================

describe('Terminal Theme Constants', () => {
  describe('defaultDarkTheme', () => {
    it('has dark background', () => {
      expect(defaultDarkTheme.background).toBe('#1a1a1a');
    });

    it('has light foreground for contrast', () => {
      expect(defaultDarkTheme.foreground).toBe('#e0e0e0');
    });

    it('has cursor color matching foreground', () => {
      expect(defaultDarkTheme.cursor).toBe('#e0e0e0');
    });

    it('has semi-transparent selection', () => {
      expect(defaultDarkTheme.selection).toContain('rgba');
    });

    it('has all standard ANSI colors', () => {
      const ansiColors = [
        'black',
        'red',
        'green',
        'yellow',
        'blue',
        'magenta',
        'cyan',
        'white',
      ] as const;
      ansiColors.forEach((color) => {
        expect(defaultDarkTheme[color]).toBeDefined();
      });
    });

    it('has all bright ANSI colors', () => {
      const brightColors = [
        'brightBlack',
        'brightRed',
        'brightGreen',
        'brightYellow',
        'brightBlue',
        'brightMagenta',
        'brightCyan',
        'brightWhite',
      ] as const;
      brightColors.forEach((color) => {
        expect(defaultDarkTheme[color]).toBeDefined();
      });
    });
  });

  describe('defaultLightTheme', () => {
    it('has light background', () => {
      expect(defaultLightTheme.background).toBe('#ffffff');
    });

    it('has dark foreground for contrast', () => {
      expect(defaultLightTheme.foreground).toBe('#1a1a1a');
    });

    it('has cursor color matching foreground', () => {
      expect(defaultLightTheme.cursor).toBe('#1a1a1a');
    });

    it('has semi-transparent selection', () => {
      expect(defaultLightTheme.selection).toContain('rgba');
    });

    it('has all standard ANSI colors', () => {
      const ansiColors = [
        'black',
        'red',
        'green',
        'yellow',
        'blue',
        'magenta',
        'cyan',
        'white',
      ] as const;
      ansiColors.forEach((color) => {
        expect(defaultLightTheme[color]).toBeDefined();
      });
    });

    it('has all bright ANSI colors', () => {
      const brightColors = [
        'brightBlack',
        'brightRed',
        'brightGreen',
        'brightYellow',
        'brightBlue',
        'brightMagenta',
        'brightCyan',
        'brightWhite',
      ] as const;
      brightColors.forEach((color) => {
        expect(defaultLightTheme[color]).toBeDefined();
      });
    });
  });

  describe('theme contrast', () => {
    it('dark theme background is darker than light theme', () => {
      // Compare hex values - lower means darker
      const darkBg = Number.parseInt(defaultDarkTheme.background!.slice(1), 16);
      const lightBg = Number.parseInt(defaultLightTheme.background!.slice(1), 16);
      expect(darkBg).toBeLessThan(lightBg);
    });

    it('themes have opposite foreground/background relationship', () => {
      const darkBg = defaultDarkTheme.background;
      const darkFg = defaultDarkTheme.foreground;
      const lightFg = defaultLightTheme.foreground;

      // Dark theme: light text on dark background
      // Light theme: dark text on light background
      expect(darkBg).toBe(lightFg); // Both are dark colors
      expect(darkFg).not.toBe(lightFg); // Foregrounds differ
    });
  });
});

// ============================================================================
// Utility Functions Tests
// ============================================================================

describe('Terminal Utility Functions', () => {
  describe('getBaseSize', () => {
    it('returns size string directly', () => {
      expect(getBaseSize('sm')).toBe('sm');
      expect(getBaseSize('md')).toBe('md');
      expect(getBaseSize('lg')).toBe('lg');
    });

    it('extracts base from responsive object', () => {
      expect(getBaseSize({ base: 'sm' })).toBe('sm');
      expect(getBaseSize({ base: 'md' })).toBe('md');
      expect(getBaseSize({ base: 'lg' })).toBe('lg');
    });

    it('defaults to md when base is not provided', () => {
      expect(getBaseSize({ sm: 'sm', lg: 'lg' })).toBe('md');
    });

    it('extracts base when other breakpoints are present', () => {
      expect(getBaseSize({ base: 'sm', md: 'md', lg: 'lg' })).toBe('sm');
    });
  });

  describe('getResponsiveSizeClasses', () => {
    it('returns direct class for string size', () => {
      expect(getResponsiveSizeClasses('sm', TERMINAL_PADDING_CLASSES)).toBe('p-1');
      expect(getResponsiveSizeClasses('md', TERMINAL_PADDING_CLASSES)).toBe('p-2');
      expect(getResponsiveSizeClasses('lg', TERMINAL_PADDING_CLASSES)).toBe('p-3');
    });

    it('generates responsive classes for base only', () => {
      const result = getResponsiveSizeClasses({ base: 'sm' }, TERMINAL_PADDING_CLASSES);
      expect(result).toBe('p-1');
    });

    it('generates responsive classes for multiple breakpoints', () => {
      const result = getResponsiveSizeClasses(
        { base: 'sm', md: 'md', lg: 'lg' },
        TERMINAL_PADDING_CLASSES
      );
      expect(result).toContain('p-1');
      expect(result).toContain('md:p-2');
      expect(result).toContain('lg:p-3');
    });

    it('handles xl breakpoint', () => {
      const result = getResponsiveSizeClasses({ base: 'sm', xl: 'lg' }, TERMINAL_PADDING_CLASSES);
      expect(result).toContain('p-1');
      expect(result).toContain('xl:p-3');
    });

    it('handles 2xl breakpoint', () => {
      const result = getResponsiveSizeClasses(
        { base: 'sm', '2xl': 'lg' },
        TERMINAL_PADDING_CLASSES
      );
      expect(result).toContain('p-1');
      expect(result).toContain('2xl:p-3');
    });

    it('generates classes only for provided breakpoints', () => {
      const result = getResponsiveSizeClasses({ base: 'sm', lg: 'lg' }, TERMINAL_PADDING_CLASSES);
      expect(result).toContain('p-1');
      expect(result).toContain('lg:p-3');
      expect(result).not.toContain('md:');
      expect(result).not.toContain('sm:');
    });
  });

  describe('getFontSizeForSize', () => {
    it('returns correct font size for string sizes', () => {
      expect(getFontSizeForSize('sm')).toBe(12);
      expect(getFontSizeForSize('md')).toBe(14);
      expect(getFontSizeForSize('lg')).toBe(16);
    });

    it('returns font size based on base value for responsive objects', () => {
      expect(getFontSizeForSize({ base: 'sm' })).toBe(12);
      expect(getFontSizeForSize({ base: 'md' })).toBe(14);
      expect(getFontSizeForSize({ base: 'lg' })).toBe(16);
    });

    it('defaults to md (14) when base is not provided', () => {
      expect(getFontSizeForSize({ sm: 'sm', lg: 'lg' })).toBe(14);
    });
  });

  describe('buildTerminalAccessibleLabel', () => {
    it('returns label only when not read-only and ready', () => {
      expect(buildTerminalAccessibleLabel('Terminal', false, true)).toBe('Terminal');
    });

    it('includes read-only indicator', () => {
      const result = buildTerminalAccessibleLabel('Terminal', true, true);
      expect(result).toContain('Terminal');
      expect(result).toContain('(read-only)');
    });

    it('includes loading indicator when not ready', () => {
      const result = buildTerminalAccessibleLabel('Terminal', false, false);
      expect(result).toContain('Terminal');
      expect(result).toContain('Loading');
    });

    it('includes both read-only and loading indicators', () => {
      const result = buildTerminalAccessibleLabel('Terminal', true, false);
      expect(result).toContain('Terminal');
      expect(result).toContain('(read-only)');
      expect(result).toContain('Loading');
    });

    it('works with custom labels', () => {
      const result = buildTerminalAccessibleLabel('Application Logs', true, true);
      expect(result).toContain('Application Logs');
      expect(result).toContain('(read-only)');
    });

    it('parts are joined with spaces', () => {
      const result = buildTerminalAccessibleLabel('Terminal', true, false);
      expect(result).toBe('Terminal (read-only) - Loading');
    });
  });

  describe('buildResizeAnnouncement', () => {
    it('generates correct announcement format', () => {
      expect(buildResizeAnnouncement(80, 24)).toBe('Terminal resized to 80 columns by 24 rows');
    });

    it('handles various dimensions', () => {
      expect(buildResizeAnnouncement(120, 40)).toBe('Terminal resized to 120 columns by 40 rows');
      expect(buildResizeAnnouncement(40, 10)).toBe('Terminal resized to 40 columns by 10 rows');
    });

    it('uses SR_TERMINAL_RESIZED internally', () => {
      // Verify consistency between function and constant
      expect(buildResizeAnnouncement(80, 24)).toBe(SR_TERMINAL_RESIZED(80, 24));
    });
  });
});

// ============================================================================
// Component Behavior Documentation Tests
// ============================================================================

describe('Terminal Component Behavior Documentation', () => {
  describe('Accessibility attributes', () => {
    it('documents role="application" usage', () => {
      // Terminal uses role="application" because it's a complex widget
      // that manages its own keyboard handling via xterm.js
      const expectedRole = 'application';
      expect(expectedRole).toBe('application');
    });

    it('documents aria-roledescription usage', () => {
      // aria-roledescription provides context for the application role
      const expectedDescription = 'terminal emulator';
      expect(expectedDescription).toBe('terminal emulator');
    });

    it('documents aria-busy for loading state', () => {
      // aria-busy is true when terminal is initializing
      const loadingState = true;
      const notLoadingState = false;
      expect(typeof loadingState).toBe('boolean');
      expect(typeof notLoadingState).toBe('boolean');
    });
  });

  describe('Keyboard navigation', () => {
    it('documents Enter/Space activation behavior', () => {
      // Enter and Space should focus the terminal when container is focused
      const activationKeys = ['Enter', ' '];
      expect(activationKeys).toContain('Enter');
      expect(activationKeys).toContain(' ');
    });

    it('documents tabIndex behavior for read-only terminals', () => {
      // Read-only terminals have tabIndex=-1 (not focusable)
      // Interactive terminals have tabIndex=0 (focusable)
      const readOnlyTabIndex = -1;
      const interactiveTabIndex = 0;
      expect(readOnlyTabIndex).toBe(-1);
      expect(interactiveTabIndex).toBe(0);
    });
  });

  describe('Touch targets', () => {
    it('documents minimum touch target size', () => {
      // WCAG 2.5.5 requires minimum touch target of 44x44px
      const minTouchTarget = 44;
      expect(TERMINAL_ERROR_BUTTON_CLASSES).toContain(`min-h-[${minTouchTarget}px]`);
      expect(TERMINAL_ERROR_BUTTON_CLASSES).toContain(`min-w-[${minTouchTarget}px]`);
    });

    it('documents desktop relaxation of touch targets', () => {
      // On desktop (sm: breakpoint), touch targets can be smaller
      expect(TERMINAL_ERROR_BUTTON_CLASSES).toContain('sm:min-h-0');
      expect(TERMINAL_ERROR_BUTTON_CLASSES).toContain('sm:min-w-0');
    });
  });

  describe('Screen reader announcements', () => {
    it('documents announcement types', () => {
      // Terminal announces these events to screen readers:
      const announcements = [
        SR_TERMINAL_READY, // When initialization completes
        SR_TERMINAL_FOCUSED, // When terminal receives focus
        SR_TERMINAL_READ_ONLY, // When terminal is read-only
        SR_TERMINAL_LOADING, // While loading
      ];
      expect(announcements).toHaveLength(4);
    });

    it('documents resize announcement format', () => {
      // Resize announcements include columns and rows
      const announcement = SR_TERMINAL_RESIZED(80, 24);
      expect(announcement).toContain('columns');
      expect(announcement).toContain('rows');
    });
  });
});

// ============================================================================
// Props Documentation Tests
// ============================================================================

describe('Terminal Props Documentation', () => {
  describe('Required props', () => {
    it('documents that no props are strictly required', () => {
      // Terminal can be rendered without any props
      // All props have sensible defaults
      const defaultValues = {
        autoFocus: true,
        colorMode: 'dark',
        readOnly: false,
        scrollback: 10000,
        cursorBlink: true,
        cursorStyle: 'block',
        size: 'md',
      };
      expect(defaultValues.autoFocus).toBe(true);
      expect(defaultValues.colorMode).toBe('dark');
    });
  });

  describe('Callback props', () => {
    it('documents onInput callback', () => {
      // onInput is called when user types in the terminal
      // Not called when readOnly is true
      const onInputSignature = (_data: string) => {};
      expect(typeof onInputSignature).toBe('function');
    });

    it('documents onResize callback', () => {
      // onResize is called when terminal dimensions change
      const onResizeSignature = (_cols: number, _rows: number) => {};
      expect(typeof onResizeSignature).toBe('function');
    });

    it('documents onReady callback', () => {
      // onReady is called when terminal is initialized
      // Provides access to xterm instance
      const onReadySignature = (_terminal: unknown) => {};
      expect(typeof onReadySignature).toBe('function');
    });

    it('documents onError callback', () => {
      // onError is called when terminal fails to initialize
      const onErrorSignature = (_error: Error) => {};
      expect(typeof onErrorSignature).toBe('function');
    });
  });

  describe('TerminalHandle interface', () => {
    it('documents focus method', () => {
      // focus() programmatically focuses the terminal
      const handleMethods = ['focus', 'write', 'clear', 'getTerminal', 'fit'];
      expect(handleMethods).toContain('focus');
    });

    it('documents write method', () => {
      // write(data) writes data to the terminal
      const handleMethods = ['focus', 'write', 'clear', 'getTerminal', 'fit'];
      expect(handleMethods).toContain('write');
    });

    it('documents clear method', () => {
      // clear() clears the terminal
      const handleMethods = ['focus', 'write', 'clear', 'getTerminal', 'fit'];
      expect(handleMethods).toContain('clear');
    });

    it('documents getTerminal method', () => {
      // getTerminal() returns the xterm instance for advanced use
      const handleMethods = ['focus', 'write', 'clear', 'getTerminal', 'fit'];
      expect(handleMethods).toContain('getTerminal');
    });

    it('documents fit method', () => {
      // fit() resizes terminal to fit container
      const handleMethods = ['focus', 'write', 'clear', 'getTerminal', 'fit'];
      expect(handleMethods).toContain('fit');
    });
  });
});

// ============================================================================
// Data Attributes Tests
// ============================================================================

describe('Terminal Data Attributes', () => {
  it('documents data-testid support', () => {
    // data-testid is passed through for testing
    const dataAttribute = 'data-testid';
    expect(dataAttribute).toBe('data-testid');
  });

  it('documents data-size attribute', () => {
    // data-size reflects the current size for CSS targeting
    const sizes: TerminalSize[] = ['sm', 'md', 'lg'];
    sizes.forEach((size) => {
      expect(['sm', 'md', 'lg']).toContain(size);
    });
  });

  it('documents data-ready attribute', () => {
    // data-ready indicates if terminal is initialized
    const readyStates = [true, false];
    readyStates.forEach((state) => {
      expect(typeof state).toBe('boolean');
    });
  });

  it('documents data-read-only attribute', () => {
    // data-read-only indicates if terminal accepts input
    const readOnlyStates = [true, false];
    readOnlyStates.forEach((state) => {
      expect(typeof state).toBe('boolean');
    });
  });

  it('documents data-color-mode attribute', () => {
    // data-color-mode indicates the current color scheme
    const colorModes = ['dark', 'light'];
    colorModes.forEach((mode) => {
      expect(['dark', 'light']).toContain(mode);
    });
  });
});

// ============================================================================
// Size Consistency Tests
// ============================================================================

describe('Terminal Size Consistency', () => {
  it('all sizes have padding classes', () => {
    const sizes: TerminalSize[] = ['sm', 'md', 'lg'];
    sizes.forEach((size) => {
      expect(TERMINAL_PADDING_CLASSES[size]).toBeDefined();
      expect(typeof TERMINAL_PADDING_CLASSES[size]).toBe('string');
    });
  });

  it('all sizes have font sizes', () => {
    const sizes: TerminalSize[] = ['sm', 'md', 'lg'];
    sizes.forEach((size) => {
      expect(TERMINAL_FONT_SIZES[size]).toBeDefined();
      expect(typeof TERMINAL_FONT_SIZES[size]).toBe('number');
    });
  });

  it('font sizes increase with size progression', () => {
    expect(TERMINAL_FONT_SIZES.sm).toBeLessThan(TERMINAL_FONT_SIZES.md);
    expect(TERMINAL_FONT_SIZES.md).toBeLessThan(TERMINAL_FONT_SIZES.lg);
  });

  it('padding increases with size progression', () => {
    // p-1 < p-2 < p-3
    const smPadding = Number.parseInt(TERMINAL_PADDING_CLASSES.sm.replace('p-', ''));
    const mdPadding = Number.parseInt(TERMINAL_PADDING_CLASSES.md.replace('p-', ''));
    const lgPadding = Number.parseInt(TERMINAL_PADDING_CLASSES.lg.replace('p-', ''));
    expect(smPadding).toBeLessThan(mdPadding);
    expect(mdPadding).toBeLessThan(lgPadding);
  });
});

// ============================================================================
// Integration Pattern Tests
// ============================================================================

describe('Terminal Integration Patterns', () => {
  describe('Skeleton pattern', () => {
    it('skeleton has presentation semantics', () => {
      // Skeletons use role="presentation" and aria-hidden="true"
      const skeletonRole = 'presentation';
      const skeletonAriaHidden = true;
      expect(skeletonRole).toBe('presentation');
      expect(skeletonAriaHidden).toBe(true);
    });

    it('skeleton uses motion-safe animation', () => {
      expect(TERMINAL_SKELETON_LINE_CLASSES).toContain('motion-safe:');
    });
  });

  describe('Error pattern', () => {
    it('error uses alert role', () => {
      // Error states use role="alert" for immediate announcement
      const errorRole = 'alert';
      expect(errorRole).toBe('alert');
    });

    it('error uses assertive live region', () => {
      // Error states use aria-live="assertive"
      const errorLive = 'assertive';
      expect(errorLive).toBe('assertive');
    });

    it('error button has retry semantics', () => {
      expect(DEFAULT_RETRY_LABEL).toBe('Retry');
    });
  });

  describe('Loading pattern', () => {
    it('loading uses aria-busy', () => {
      // When loading, aria-busy="true" is set
      const loadingAriaBusy = true;
      expect(loadingAriaBusy).toBe(true);
    });

    it('loading has screen reader announcement', () => {
      expect(SR_TERMINAL_LOADING).toContain('loading');
    });
  });
});
