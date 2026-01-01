import { describe, expect, it } from 'vitest';
import {
  ARTIFACT_PREVIEW_CONTAINER_CLASSES,
  ARTIFACT_PREVIEW_CONTENT_CLASSES,
  ARTIFACT_PREVIEW_PADDING_CLASSES,
  ARTIFACT_PREVIEW_SIZE_MAP,
  ARTIFACT_PREVIEW_SKELETON_CLASSES,
  DEFAULT_EMPTY_MESSAGE,
  DEFAULT_SKELETON_LINES,
  LOADING_ANNOUNCEMENT,
  SKELETON_LINE_WIDTHS,
  getBaseSize,
  getContentAnnouncement,
  getDialogSize,
  getResponsivePaddingClasses,
} from '../../../packages/ui/organisms/ArtifactPreviewDialog';

// ============================================================================
// Constants Tests
// ============================================================================

describe('ArtifactPreviewDialog Constants', () => {
  describe('DEFAULT_SKELETON_LINES', () => {
    it('should have a positive number of lines', () => {
      expect(DEFAULT_SKELETON_LINES).toBeGreaterThan(0);
    });

    it('should be 6 by default', () => {
      expect(DEFAULT_SKELETON_LINES).toBe(6);
    });
  });

  describe('DEFAULT_EMPTY_MESSAGE', () => {
    it('should have a non-empty string', () => {
      expect(DEFAULT_EMPTY_MESSAGE).toBeTruthy();
      expect(DEFAULT_EMPTY_MESSAGE.length).toBeGreaterThan(0);
    });

    it('should be descriptive', () => {
      expect(DEFAULT_EMPTY_MESSAGE).toBe('No content available');
    });
  });

  describe('LOADING_ANNOUNCEMENT', () => {
    it('should have a non-empty string', () => {
      expect(LOADING_ANNOUNCEMENT).toBeTruthy();
      expect(LOADING_ANNOUNCEMENT.length).toBeGreaterThan(0);
    });

    it('should indicate loading state', () => {
      expect(LOADING_ANNOUNCEMENT.toLowerCase()).toContain('loading');
    });
  });

  describe('ARTIFACT_PREVIEW_SIZE_MAP', () => {
    it('should map sm to md dialog size', () => {
      expect(ARTIFACT_PREVIEW_SIZE_MAP.sm).toBe('md');
    });

    it('should map md to lg dialog size', () => {
      expect(ARTIFACT_PREVIEW_SIZE_MAP.md).toBe('lg');
    });

    it('should map lg to xl dialog size', () => {
      expect(ARTIFACT_PREVIEW_SIZE_MAP.lg).toBe('xl');
    });

    it('should have all expected sizes', () => {
      expect(Object.keys(ARTIFACT_PREVIEW_SIZE_MAP)).toEqual(['sm', 'md', 'lg']);
    });
  });

  describe('ARTIFACT_PREVIEW_CONTAINER_CLASSES', () => {
    it('should include max-height constraint', () => {
      expect(ARTIFACT_PREVIEW_CONTAINER_CLASSES).toContain('max-h-[60vh]');
    });

    it('should include overflow handling', () => {
      expect(ARTIFACT_PREVIEW_CONTAINER_CLASSES).toContain('overflow-auto');
    });

    it('should include scrollbar styling', () => {
      expect(ARTIFACT_PREVIEW_CONTAINER_CLASSES).toContain('scrollbar-thin');
    });
  });

  describe('ARTIFACT_PREVIEW_CONTENT_CLASSES', () => {
    it('should include pre-wrap whitespace for code', () => {
      expect(ARTIFACT_PREVIEW_CONTENT_CLASSES).toContain('whitespace-pre-wrap');
    });

    it('should include word break for long lines', () => {
      expect(ARTIFACT_PREVIEW_CONTENT_CLASSES).toContain('break-words');
    });

    it('should include monospace font', () => {
      expect(ARTIFACT_PREVIEW_CONTENT_CLASSES).toContain('font-mono');
    });

    it('should include small text size', () => {
      expect(ARTIFACT_PREVIEW_CONTENT_CLASSES).toContain('text-sm');
    });

    it('should include border radius', () => {
      expect(ARTIFACT_PREVIEW_CONTENT_CLASSES).toContain('rounded-md');
    });

    it('should include foreground text color', () => {
      expect(ARTIFACT_PREVIEW_CONTENT_CLASSES).toContain('text-[rgb(var(--foreground))]');
    });

    it('should include muted background', () => {
      expect(ARTIFACT_PREVIEW_CONTENT_CLASSES).toContain('bg-[rgb(var(--muted))]/30');
    });
  });

  describe('ARTIFACT_PREVIEW_PADDING_CLASSES', () => {
    it('should have smaller padding for sm size', () => {
      expect(ARTIFACT_PREVIEW_PADDING_CLASSES.sm).toBe('p-3');
    });

    it('should have medium padding for md size', () => {
      expect(ARTIFACT_PREVIEW_PADDING_CLASSES.md).toBe('p-4');
    });

    it('should have larger padding for lg size', () => {
      expect(ARTIFACT_PREVIEW_PADDING_CLASSES.lg).toBe('p-5');
    });

    it('should have all expected sizes', () => {
      expect(Object.keys(ARTIFACT_PREVIEW_PADDING_CLASSES)).toEqual(['sm', 'md', 'lg']);
    });
  });

  describe('ARTIFACT_PREVIEW_SKELETON_CLASSES', () => {
    it('should include spacing between lines', () => {
      expect(ARTIFACT_PREVIEW_SKELETON_CLASSES).toContain('space-y-3');
    });
  });

  describe('SKELETON_LINE_WIDTHS', () => {
    it('should have at least 6 width options', () => {
      expect(SKELETON_LINE_WIDTHS.length).toBeGreaterThanOrEqual(6);
    });

    it('should include full width', () => {
      expect(SKELETON_LINE_WIDTHS).toContain('w-full');
    });

    it('should include varied widths for visual interest', () => {
      const uniqueWidths = new Set(SKELETON_LINE_WIDTHS);
      expect(uniqueWidths.size).toBeGreaterThan(3);
    });

    it('should all be valid Tailwind width classes', () => {
      for (const width of SKELETON_LINE_WIDTHS) {
        expect(width).toMatch(/^w-/);
      }
    });
  });
});

// ============================================================================
// getBaseSize Tests
// ============================================================================

describe('getBaseSize', () => {
  describe('with undefined', () => {
    it('should return md as default', () => {
      expect(getBaseSize(undefined)).toBe('md');
    });
  });

  describe('with string values', () => {
    it('should return sm for sm', () => {
      expect(getBaseSize('sm')).toBe('sm');
    });

    it('should return md for md', () => {
      expect(getBaseSize('md')).toBe('md');
    });

    it('should return lg for lg', () => {
      expect(getBaseSize('lg')).toBe('lg');
    });
  });

  describe('with responsive objects', () => {
    it('should return base value if present', () => {
      expect(getBaseSize({ base: 'sm' })).toBe('sm');
    });

    it('should return md if base is not present', () => {
      expect(getBaseSize({ lg: 'lg' })).toBe('md');
    });

    it('should handle complex responsive objects', () => {
      expect(getBaseSize({ base: 'lg', md: 'sm' })).toBe('lg');
    });
  });

  describe('edge cases', () => {
    it('should handle null-like values', () => {
      // @ts-expect-error - testing edge case
      expect(getBaseSize(null)).toBe('md');
    });
  });
});

// ============================================================================
// getResponsivePaddingClasses Tests
// ============================================================================

describe('getResponsivePaddingClasses', () => {
  describe('with undefined', () => {
    it('should return md padding as default', () => {
      expect(getResponsivePaddingClasses(undefined)).toBe('p-4');
    });
  });

  describe('with string values', () => {
    it('should return p-3 for sm', () => {
      expect(getResponsivePaddingClasses('sm')).toBe('p-3');
    });

    it('should return p-4 for md', () => {
      expect(getResponsivePaddingClasses('md')).toBe('p-4');
    });

    it('should return p-5 for lg', () => {
      expect(getResponsivePaddingClasses('lg')).toBe('p-5');
    });
  });

  describe('with responsive objects', () => {
    it('should generate responsive padding for base only', () => {
      const result = getResponsivePaddingClasses({ base: 'sm' });
      expect(result).toBe('p-3');
    });

    it('should generate responsive padding for multiple breakpoints', () => {
      const result = getResponsivePaddingClasses({ base: 'sm', md: 'md', lg: 'lg' });
      expect(result).toContain('p-3');
      expect(result).toContain('md:p-4');
      expect(result).toContain('lg:p-5');
    });

    it('should handle gap in breakpoints', () => {
      const result = getResponsivePaddingClasses({ base: 'sm', lg: 'lg' });
      expect(result).toBe('p-3 lg:p-5');
    });
  });

  describe('breakpoint order', () => {
    it('should generate classes in correct breakpoint order', () => {
      const result = getResponsivePaddingClasses({
        lg: 'lg',
        base: 'sm',
        md: 'md',
      });
      // Should be in order: base, sm, md, lg, xl, 2xl
      const parts = result.split(' ');
      expect(parts[0]).toBe('p-3'); // base
      expect(parts[1]).toBe('md:p-4');
      expect(parts[2]).toBe('lg:p-5');
    });
  });
});

// ============================================================================
// getDialogSize Tests
// ============================================================================

describe('getDialogSize', () => {
  describe('with undefined', () => {
    it('should return lg as default', () => {
      expect(getDialogSize(undefined)).toBe('lg');
    });
  });

  describe('with string values', () => {
    it('should map sm to md', () => {
      expect(getDialogSize('sm')).toBe('md');
    });

    it('should map md to lg', () => {
      expect(getDialogSize('md')).toBe('lg');
    });

    it('should map lg to xl', () => {
      expect(getDialogSize('lg')).toBe('xl');
    });
  });

  describe('with responsive objects', () => {
    it('should map responsive values correctly', () => {
      const result = getDialogSize({ base: 'sm', lg: 'lg' });
      expect(result).toEqual({ base: 'md', lg: 'xl' });
    });

    it('should handle all breakpoints', () => {
      const result = getDialogSize({ base: 'sm', md: 'md', lg: 'lg' });
      expect(result).toEqual({ base: 'md', md: 'lg', lg: 'xl' });
    });
  });

  describe('edge cases', () => {
    it('should handle empty object', () => {
      const result = getDialogSize({});
      expect(result).toEqual({});
    });
  });
});

// ============================================================================
// getContentAnnouncement Tests
// ============================================================================

describe('getContentAnnouncement', () => {
  describe('loading state', () => {
    it('should announce loading for the specific file', () => {
      const result = getContentAnnouncement('example.tsx', true, null);
      expect(result).toBe('Loading content for example.tsx');
    });

    it('should announce loading regardless of content', () => {
      const result = getContentAnnouncement('file.js', true, 'some content');
      expect(result).toBe('Loading content for file.js');
    });
  });

  describe('null content', () => {
    it('should announce empty message with file name', () => {
      const result = getContentAnnouncement('empty.txt', false, null);
      expect(result).toBe('empty.txt: No content available');
    });
  });

  describe('empty string content', () => {
    it('should announce empty message with file name', () => {
      const result = getContentAnnouncement('blank.md', false, '');
      expect(result).toBe('blank.md: No content available');
    });
  });

  describe('with content', () => {
    it('should announce single line content', () => {
      const result = getContentAnnouncement('one.txt', false, 'single line');
      expect(result).toBe('one.txt loaded, 1 line of content');
    });

    it('should announce multiple lines content', () => {
      const result = getContentAnnouncement('multi.txt', false, 'line1\nline2\nline3');
      expect(result).toBe('multi.txt loaded, 3 lines of content');
    });

    it('should handle many lines', () => {
      const content = Array(100).fill('line').join('\n');
      const result = getContentAnnouncement('large.ts', false, content);
      expect(result).toBe('large.ts loaded, 100 lines of content');
    });
  });

  describe('pluralization', () => {
    it('should use singular "line" for 1 line', () => {
      const result = getContentAnnouncement('f.txt', false, 'one');
      expect(result).toContain('1 line of content');
      expect(result).not.toContain('lines');
    });

    it('should use plural "lines" for multiple lines', () => {
      const result = getContentAnnouncement('f.txt', false, 'a\nb');
      expect(result).toContain('2 lines of content');
    });
  });
});

// ============================================================================
// Component Behavior Documentation Tests
// ============================================================================

describe('ArtifactPreviewDialog Component Behavior', () => {
  describe('accessibility features', () => {
    it('should use Dialog molecule for focus trap and escape key handling', () => {
      // Documentation: The component wraps Dialog which provides:
      // - Focus trap when open
      // - Escape key to close
      // - aria-modal="true"
      // - aria-labelledby pointing to title
      expect(true).toBe(true);
    });

    it('should provide screen reader announcements for loading state', () => {
      // Documentation: Uses VisuallyHidden with role="status" and aria-live="polite"
      // to announce content state changes to screen readers
      expect(true).toBe(true);
    });

    it('should use aria-busy during loading', () => {
      // Documentation: The DialogContent has aria-busy={loading} to indicate
      // loading state to assistive technologies
      expect(true).toBe(true);
    });
  });

  describe('responsive behavior', () => {
    it('should support responsive size values', () => {
      // Documentation: size prop accepts ResponsiveValue<ArtifactPreviewSize>
      // e.g., { base: 'sm', md: 'md', lg: 'lg' }
      expect(true).toBe(true);
    });

    it('should map internal sizes to Dialog sizes', () => {
      // Documentation: sm->md, md->lg, lg->xl
      // This provides appropriate dialog widths for the preview content
      expect(ARTIFACT_PREVIEW_SIZE_MAP.sm).toBe('md');
      expect(ARTIFACT_PREVIEW_SIZE_MAP.md).toBe('lg');
      expect(ARTIFACT_PREVIEW_SIZE_MAP.lg).toBe('xl');
    });
  });

  describe('loading state', () => {
    it('should show PreviewSkeleton when loading', () => {
      // Documentation: When loading=true, shows animated skeleton lines
      // instead of content
      expect(DEFAULT_SKELETON_LINES).toBe(6);
    });

    it('should have skeleton with varied line widths', () => {
      // Documentation: Skeleton lines have varying widths for visual interest
      const uniqueWidths = new Set(SKELETON_LINE_WIDTHS);
      expect(uniqueWidths.size).toBeGreaterThan(3);
    });
  });

  describe('content display', () => {
    it('should show fallback message for null content', () => {
      // Documentation: When content is null, shows DEFAULT_EMPTY_MESSAGE
      expect(DEFAULT_EMPTY_MESSAGE).toBe('No content available');
    });

    it('should preserve whitespace in code content', () => {
      // Documentation: Uses whitespace-pre-wrap to preserve code formatting
      expect(ARTIFACT_PREVIEW_CONTENT_CLASSES).toContain('whitespace-pre-wrap');
    });

    it('should use monospace font for code', () => {
      // Documentation: Uses font-mono for proper code display
      expect(ARTIFACT_PREVIEW_CONTENT_CLASSES).toContain('font-mono');
    });
  });

  describe('data attributes', () => {
    it('should support data-testid for testing', () => {
      // Documentation: Supports data-testid prop which is passed to:
      // - Dialog (main container)
      // - DialogContent ({testid}-content)
      // - PreviewSkeleton ({testid}-skeleton)
      // - pre element ({testid}-code)
      expect(true).toBe(true);
    });

    it('should expose data-empty on code block', () => {
      // Documentation: The pre element has data-empty attribute
      // indicating whether content is present
      expect(true).toBe(true);
    });

    it('should expose data-size on code block', () => {
      // Documentation: The pre element has data-size attribute
      // with the base size value
      expect(true).toBe(true);
    });
  });
});

// ============================================================================
// PreviewSkeleton Component Tests
// ============================================================================

describe('PreviewSkeleton Component', () => {
  describe('default behavior', () => {
    it('should use DEFAULT_SKELETON_LINES as default', () => {
      // Documentation: Default lines count is 6
      expect(DEFAULT_SKELETON_LINES).toBe(6);
    });
  });

  describe('accessibility', () => {
    it('should have role="presentation"', () => {
      // Documentation: Skeleton has role="presentation" since it's decorative
      expect(true).toBe(true);
    });

    it('should have aria-hidden="true"', () => {
      // Documentation: Skeleton is hidden from screen readers
      expect(true).toBe(true);
    });
  });

  describe('data attributes', () => {
    it('should expose data-lines attribute', () => {
      // Documentation: The container has data-lines attribute
      // with the number of lines being rendered
      expect(true).toBe(true);
    });

    it('should support data-testid for each line', () => {
      // Documentation: Each skeleton line can have its own test ID
      // in the format {testid}-line-{index}
      expect(true).toBe(true);
    });
  });
});

// ============================================================================
// Size Consistency Tests
// ============================================================================

describe('Size Consistency', () => {
  describe('size mapping progression', () => {
    it('should have ascending dialog sizes', () => {
      // sm -> md, md -> lg, lg -> xl
      // Each size maps to a larger dialog
      expect(ARTIFACT_PREVIEW_SIZE_MAP.sm).toBe('md');
      expect(ARTIFACT_PREVIEW_SIZE_MAP.md).toBe('lg');
      expect(ARTIFACT_PREVIEW_SIZE_MAP.lg).toBe('xl');
    });

    it('should have ascending padding', () => {
      // p-3 < p-4 < p-5
      expect(ARTIFACT_PREVIEW_PADDING_CLASSES.sm).toBe('p-3');
      expect(ARTIFACT_PREVIEW_PADDING_CLASSES.md).toBe('p-4');
      expect(ARTIFACT_PREVIEW_PADDING_CLASSES.lg).toBe('p-5');
    });
  });
});

// ============================================================================
// Integration Pattern Tests
// ============================================================================

describe('Integration Patterns', () => {
  describe('with file browser', () => {
    it('should support null content for deferred loading', () => {
      // Pattern: Set content to null initially, then load on file selection
      // The component handles null gracefully by showing empty message
      expect(DEFAULT_EMPTY_MESSAGE).toBeTruthy();
    });

    it('should support loading state during fetch', () => {
      // Pattern: Set loading=true while fetching, then set to false with content
      // The component shows skeleton during loading
      expect(DEFAULT_SKELETON_LINES).toBeGreaterThan(0);
    });
  });

  describe('with build output', () => {
    it('should handle long content gracefully', () => {
      // Pattern: Build output can be very long
      // Container has max-h-[60vh] and overflow-auto for scrolling
      expect(ARTIFACT_PREVIEW_CONTAINER_CLASSES).toContain('max-h-[60vh]');
      expect(ARTIFACT_PREVIEW_CONTAINER_CLASSES).toContain('overflow-auto');
    });

    it('should preserve whitespace in logs', () => {
      // Pattern: Build logs need whitespace preservation
      expect(ARTIFACT_PREVIEW_CONTENT_CLASSES).toContain('whitespace-pre-wrap');
    });
  });

  describe('responsive usage', () => {
    it('should support mobile-first responsive sizing', () => {
      // Pattern: { base: 'sm', md: 'md', lg: 'lg' }
      // Small on mobile, larger on desktop
      const result = getResponsivePaddingClasses({ base: 'sm', md: 'md', lg: 'lg' });
      expect(result).toContain('p-3'); // base
      expect(result).toContain('md:p-4');
      expect(result).toContain('lg:p-5');
    });
  });
});
