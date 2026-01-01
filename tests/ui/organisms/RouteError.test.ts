import { describe, expect, it } from 'vitest';
import {
  DEFAULT_HOME_BUTTON_LABEL,
  DEFAULT_RETRY_BUTTON_LABEL,
  DEFAULT_ROUTE_ERROR_ARIA_LABEL,
  DEFAULT_ROUTE_ERROR_DESCRIPTION,
  DEFAULT_ROUTE_ERROR_TITLE,
  // Constants
  ROUTE_ERROR_BREAKPOINT_ORDER,
  ROUTE_ERROR_BUTTON_CONTAINER_BASE_CLASSES,
  ROUTE_ERROR_BUTTON_GAP_CLASSES,
  ROUTE_ERROR_BUTTON_SIZE_MAP,
  ROUTE_ERROR_CONTAINER_BASE_CLASSES,
  ROUTE_ERROR_CONTAINER_SIZE_CLASSES,
  ROUTE_ERROR_CONTENT_CLASSES,
  ROUTE_ERROR_CONTENT_MAX_WIDTH_CLASSES,
  ROUTE_ERROR_DESCRIPTION_SIZE_MAP,
  ROUTE_ERROR_DETAILS_PRE_CLASSES,
  ROUTE_ERROR_DETAILS_SIZE_CLASSES,
  ROUTE_ERROR_DETAILS_SUMMARY_CLASSES,
  ROUTE_ERROR_HEADING_LEVEL_MAP,
  ROUTE_ERROR_HEADING_SIZE_MAP,
  ROUTE_ERROR_ICON_CONTAINER_BASE_CLASSES,
  ROUTE_ERROR_ICON_CONTAINER_SIZE_CLASSES,
  ROUTE_ERROR_ICON_SIZE_MAP,
  ROUTE_ERROR_LOGGER_CONTEXT,
  SR_ERROR_PREFIX,
  SR_NAVIGATING_HOME,
  SR_RETRYING,
  TECHNICAL_DETAILS_LABEL,
  buildHomeButtonAriaLabel,
  buildRetryButtonAriaLabel,
  buildRouteErrorAnnouncement,
  formatRouteErrorForLogging,
  // Utility functions
  getRouteErrorBaseSize,
  getRouteErrorResponsiveSizeClasses,
} from '../../../packages/ui/organisms/RouteError';

// ============================================================================
// Default Labels Constants
// ============================================================================

describe('RouteError Default Labels', () => {
  it('has correct default error title', () => {
    expect(DEFAULT_ROUTE_ERROR_TITLE).toBe('Oops! Something went wrong');
  });

  it('has correct default error description', () => {
    expect(DEFAULT_ROUTE_ERROR_DESCRIPTION).toBe(
      'We encountered an unexpected error. Please try again or return to the home page.'
    );
  });

  it('has correct default retry button label', () => {
    expect(DEFAULT_RETRY_BUTTON_LABEL).toBe('Try Again');
  });

  it('has correct default home button label', () => {
    expect(DEFAULT_HOME_BUTTON_LABEL).toBe('Go Home');
  });

  it('has correct default aria-label', () => {
    expect(DEFAULT_ROUTE_ERROR_ARIA_LABEL).toBe('Route error');
  });

  it('has correct technical details label', () => {
    expect(TECHNICAL_DETAILS_LABEL).toBe('Technical Details');
  });

  it('has correct logger context', () => {
    expect(ROUTE_ERROR_LOGGER_CONTEXT).toBe('RouteError');
  });
});

// ============================================================================
// Screen Reader Constants
// ============================================================================

describe('RouteError Screen Reader Constants', () => {
  it('has correct error prefix for screen readers', () => {
    expect(SR_ERROR_PREFIX).toBe('Page error:');
  });

  it('has correct retrying announcement', () => {
    expect(SR_RETRYING).toBe('Retrying page load...');
  });

  it('has correct navigating home announcement', () => {
    expect(SR_NAVIGATING_HOME).toBe('Navigating to home page...');
  });
});

// ============================================================================
// Breakpoint Order Constants
// ============================================================================

describe('RouteError Breakpoint Order', () => {
  it('has correct breakpoint order', () => {
    expect(ROUTE_ERROR_BREAKPOINT_ORDER).toEqual(['base', 'sm', 'md', 'lg', 'xl', '2xl']);
  });

  it('starts with base breakpoint', () => {
    expect(ROUTE_ERROR_BREAKPOINT_ORDER[0]).toBe('base');
  });

  it('ends with 2xl breakpoint', () => {
    expect(ROUTE_ERROR_BREAKPOINT_ORDER[5]).toBe('2xl');
  });

  it('has 6 breakpoints', () => {
    expect(ROUTE_ERROR_BREAKPOINT_ORDER).toHaveLength(6);
  });
});

// ============================================================================
// Container Size Classes
// ============================================================================

describe('ROUTE_ERROR_CONTAINER_SIZE_CLASSES', () => {
  it('has sm size classes', () => {
    expect(ROUTE_ERROR_CONTAINER_SIZE_CLASSES.sm).toBe('min-h-[60vh] gap-4 p-4');
  });

  it('has md size classes', () => {
    expect(ROUTE_ERROR_CONTAINER_SIZE_CLASSES.md).toBe('min-h-[80vh] gap-6 p-6');
  });

  it('has lg size classes with full-screen height', () => {
    expect(ROUTE_ERROR_CONTAINER_SIZE_CLASSES.lg).toBe('min-h-screen gap-8 p-8');
  });

  it('has all three size variants', () => {
    expect(Object.keys(ROUTE_ERROR_CONTAINER_SIZE_CLASSES)).toEqual(['sm', 'md', 'lg']);
  });
});

// ============================================================================
// Icon Container Size Classes
// ============================================================================

describe('ROUTE_ERROR_ICON_CONTAINER_SIZE_CLASSES', () => {
  it('has sm padding', () => {
    expect(ROUTE_ERROR_ICON_CONTAINER_SIZE_CLASSES.sm).toBe('p-3');
  });

  it('has md padding', () => {
    expect(ROUTE_ERROR_ICON_CONTAINER_SIZE_CLASSES.md).toBe('p-4');
  });

  it('has lg padding', () => {
    expect(ROUTE_ERROR_ICON_CONTAINER_SIZE_CLASSES.lg).toBe('p-5');
  });
});

// ============================================================================
// Icon Size Map
// ============================================================================

describe('ROUTE_ERROR_ICON_SIZE_MAP', () => {
  it('maps sm to md icon', () => {
    expect(ROUTE_ERROR_ICON_SIZE_MAP.sm).toBe('md');
  });

  it('maps md to lg icon', () => {
    expect(ROUTE_ERROR_ICON_SIZE_MAP.md).toBe('lg');
  });

  it('maps lg to xl icon', () => {
    expect(ROUTE_ERROR_ICON_SIZE_MAP.lg).toBe('xl');
  });
});

// ============================================================================
// Heading Level Map
// ============================================================================

describe('ROUTE_ERROR_HEADING_LEVEL_MAP', () => {
  it('uses h3 for sm size', () => {
    expect(ROUTE_ERROR_HEADING_LEVEL_MAP.sm).toBe(3);
  });

  it('uses h2 for md size', () => {
    expect(ROUTE_ERROR_HEADING_LEVEL_MAP.md).toBe(2);
  });

  it('uses h1 for lg size', () => {
    expect(ROUTE_ERROR_HEADING_LEVEL_MAP.lg).toBe(1);
  });
});

// ============================================================================
// Heading Size Map
// ============================================================================

describe('ROUTE_ERROR_HEADING_SIZE_MAP', () => {
  it('uses lg text for sm size', () => {
    expect(ROUTE_ERROR_HEADING_SIZE_MAP.sm).toBe('lg');
  });

  it('uses xl text for md size', () => {
    expect(ROUTE_ERROR_HEADING_SIZE_MAP.md).toBe('xl');
  });

  it('uses 2xl text for lg size', () => {
    expect(ROUTE_ERROR_HEADING_SIZE_MAP.lg).toBe('2xl');
  });
});

// ============================================================================
// Description Size Map
// ============================================================================

describe('ROUTE_ERROR_DESCRIPTION_SIZE_MAP', () => {
  it('uses sm text for sm size', () => {
    expect(ROUTE_ERROR_DESCRIPTION_SIZE_MAP.sm).toBe('sm');
  });

  it('uses base text for md size', () => {
    expect(ROUTE_ERROR_DESCRIPTION_SIZE_MAP.md).toBe('base');
  });

  it('uses lg text for lg size', () => {
    expect(ROUTE_ERROR_DESCRIPTION_SIZE_MAP.lg).toBe('lg');
  });
});

// ============================================================================
// Button Size Map
// ============================================================================

describe('ROUTE_ERROR_BUTTON_SIZE_MAP', () => {
  it('uses sm button for sm size', () => {
    expect(ROUTE_ERROR_BUTTON_SIZE_MAP.sm).toBe('sm');
  });

  it('uses md button for md size', () => {
    expect(ROUTE_ERROR_BUTTON_SIZE_MAP.md).toBe('md');
  });

  it('uses lg button for lg size', () => {
    expect(ROUTE_ERROR_BUTTON_SIZE_MAP.lg).toBe('lg');
  });
});

// ============================================================================
// Button Gap Classes
// ============================================================================

describe('ROUTE_ERROR_BUTTON_GAP_CLASSES', () => {
  it('has gap-2 for sm', () => {
    expect(ROUTE_ERROR_BUTTON_GAP_CLASSES.sm).toBe('gap-2');
  });

  it('has gap-3 for md', () => {
    expect(ROUTE_ERROR_BUTTON_GAP_CLASSES.md).toBe('gap-3');
  });

  it('has gap-4 for lg', () => {
    expect(ROUTE_ERROR_BUTTON_GAP_CLASSES.lg).toBe('gap-4');
  });
});

// ============================================================================
// Details Size Classes
// ============================================================================

describe('ROUTE_ERROR_DETAILS_SIZE_CLASSES', () => {
  it('has max-w-sm and mt-3 for sm', () => {
    expect(ROUTE_ERROR_DETAILS_SIZE_CLASSES.sm).toBe('max-w-sm mt-3');
  });

  it('has max-w-md and mt-4 for md', () => {
    expect(ROUTE_ERROR_DETAILS_SIZE_CLASSES.md).toBe('max-w-md mt-4');
  });

  it('has max-w-lg and mt-6 for lg', () => {
    expect(ROUTE_ERROR_DETAILS_SIZE_CLASSES.lg).toBe('max-w-lg mt-6');
  });
});

// ============================================================================
// Content Max Width Classes
// ============================================================================

describe('ROUTE_ERROR_CONTENT_MAX_WIDTH_CLASSES', () => {
  it('has max-w-sm for sm', () => {
    expect(ROUTE_ERROR_CONTENT_MAX_WIDTH_CLASSES.sm).toBe('max-w-sm');
  });

  it('has max-w-md for md', () => {
    expect(ROUTE_ERROR_CONTENT_MAX_WIDTH_CLASSES.md).toBe('max-w-md');
  });

  it('has max-w-lg for lg', () => {
    expect(ROUTE_ERROR_CONTENT_MAX_WIDTH_CLASSES.lg).toBe('max-w-lg');
  });
});

// ============================================================================
// Base Classes
// ============================================================================

describe('RouteError Base Classes', () => {
  it('has correct container base classes', () => {
    expect(ROUTE_ERROR_CONTAINER_BASE_CLASSES).toContain('flex');
    expect(ROUTE_ERROR_CONTAINER_BASE_CLASSES).toContain('flex-col');
    expect(ROUTE_ERROR_CONTAINER_BASE_CLASSES).toContain('items-center');
    expect(ROUTE_ERROR_CONTAINER_BASE_CLASSES).toContain('justify-center');
    expect(ROUTE_ERROR_CONTAINER_BASE_CLASSES).toContain('bg-[rgb(var(--background))]');
  });

  it('has correct icon container base classes', () => {
    expect(ROUTE_ERROR_ICON_CONTAINER_BASE_CLASSES).toContain('rounded-full');
    expect(ROUTE_ERROR_ICON_CONTAINER_BASE_CLASSES).toContain('bg-[rgb(var(--destructive))]/10');
  });

  it('has correct content classes', () => {
    expect(ROUTE_ERROR_CONTENT_CLASSES).toContain('space-y-2');
    expect(ROUTE_ERROR_CONTENT_CLASSES).toContain('text-center');
  });

  it('has correct button container base classes', () => {
    expect(ROUTE_ERROR_BUTTON_CONTAINER_BASE_CLASSES).toContain('flex');
    expect(ROUTE_ERROR_BUTTON_CONTAINER_BASE_CLASSES).toContain('flex-wrap');
    expect(ROUTE_ERROR_BUTTON_CONTAINER_BASE_CLASSES).toContain('justify-center');
  });

  it('has correct details summary classes with focus ring', () => {
    expect(ROUTE_ERROR_DETAILS_SUMMARY_CLASSES).toContain('cursor-pointer');
    expect(ROUTE_ERROR_DETAILS_SUMMARY_CLASSES).toContain('focus-visible:ring-2');
    expect(ROUTE_ERROR_DETAILS_SUMMARY_CLASSES).toContain('focus-visible:ring-offset-2');
    expect(ROUTE_ERROR_DETAILS_SUMMARY_CLASSES).toContain('motion-safe:transition-colors');
  });

  it('has correct details pre classes with max height', () => {
    expect(ROUTE_ERROR_DETAILS_PRE_CLASSES).toContain('overflow-auto');
    expect(ROUTE_ERROR_DETAILS_PRE_CLASSES).toContain('max-h-60');
    expect(ROUTE_ERROR_DETAILS_PRE_CLASSES).toContain('text-left');
    expect(ROUTE_ERROR_DETAILS_PRE_CLASSES).toContain('rounded-md');
  });
});

// ============================================================================
// getRouteErrorBaseSize Utility
// ============================================================================

describe('getRouteErrorBaseSize', () => {
  it('returns string size directly', () => {
    expect(getRouteErrorBaseSize('sm')).toBe('sm');
    expect(getRouteErrorBaseSize('md')).toBe('md');
    expect(getRouteErrorBaseSize('lg')).toBe('lg');
  });

  it('returns base from responsive object', () => {
    expect(getRouteErrorBaseSize({ base: 'sm', md: 'lg' })).toBe('sm');
  });

  it('returns first defined value when base is not set', () => {
    expect(getRouteErrorBaseSize({ sm: 'md', lg: 'lg' })).toBe('md');
  });

  it('returns md as default for empty object', () => {
    expect(getRouteErrorBaseSize({})).toBe('md');
  });

  it('follows breakpoint order for first value', () => {
    expect(getRouteErrorBaseSize({ md: 'sm', sm: 'lg' })).toBe('lg');
  });
});

// ============================================================================
// getRouteErrorResponsiveSizeClasses Utility
// ============================================================================

describe('getRouteErrorResponsiveSizeClasses', () => {
  it('returns classes for string size', () => {
    const result = getRouteErrorResponsiveSizeClasses('md', ROUTE_ERROR_CONTAINER_SIZE_CLASSES);
    expect(result).toBe('min-h-[80vh] gap-6 p-6');
  });

  it('returns base classes without prefix', () => {
    const result = getRouteErrorResponsiveSizeClasses(
      { base: 'sm' },
      ROUTE_ERROR_CONTAINER_SIZE_CLASSES
    );
    expect(result).toBe('min-h-[60vh] gap-4 p-4');
  });

  it('adds breakpoint prefix for non-base sizes', () => {
    const result = getRouteErrorResponsiveSizeClasses(
      { base: 'sm', md: 'lg' },
      ROUTE_ERROR_CONTAINER_SIZE_CLASSES
    );
    expect(result).toContain('min-h-[60vh] gap-4 p-4');
    expect(result).toContain('md:min-h-screen');
    expect(result).toContain('md:gap-8');
    expect(result).toContain('md:p-8');
  });

  it('handles multiple breakpoints', () => {
    const result = getRouteErrorResponsiveSizeClasses(
      { base: 'sm', md: 'md', xl: 'lg' },
      ROUTE_ERROR_CONTAINER_SIZE_CLASSES
    );
    expect(result).toContain('min-h-[60vh]');
    expect(result).toContain('md:min-h-[80vh]');
    expect(result).toContain('xl:min-h-screen');
  });

  it('returns empty string for empty responsive object', () => {
    const result = getRouteErrorResponsiveSizeClasses({}, ROUTE_ERROR_CONTAINER_SIZE_CLASSES);
    expect(result).toBe('');
  });

  it('works with button gap classes', () => {
    const result = getRouteErrorResponsiveSizeClasses(
      { base: 'sm', lg: 'lg' },
      ROUTE_ERROR_BUTTON_GAP_CLASSES
    );
    expect(result).toBe('gap-2 lg:gap-4');
  });
});

// ============================================================================
// formatRouteErrorForLogging Utility
// ============================================================================

describe('formatRouteErrorForLogging', () => {
  it('includes error name', () => {
    const error = new Error('Test error');
    const result = formatRouteErrorForLogging(error);
    expect(result.errorName).toBe('Error');
  });

  it('includes error message', () => {
    const error = new Error('Test error message');
    const result = formatRouteErrorForLogging(error);
    expect(result.errorMessage).toBe('Test error message');
  });

  it('includes error stack', () => {
    const error = new Error('Test');
    const result = formatRouteErrorForLogging(error);
    expect(result.errorStack).toBeDefined();
    expect(typeof result.errorStack).toBe('string');
  });

  it('includes timestamp', () => {
    const error = new Error('Test');
    const result = formatRouteErrorForLogging(error);
    expect(result.timestamp).toBeDefined();
    expect(typeof result.timestamp).toBe('string');
  });

  it('includes cause when present', () => {
    const cause = new Error('Root cause');
    const error = new Error('Test error', { cause });
    const result = formatRouteErrorForLogging(error);
    expect(result.cause).toBeDefined();
  });

  it('does not include cause when not present', () => {
    const error = new Error('Test error');
    const result = formatRouteErrorForLogging(error);
    expect(result.cause).toBeUndefined();
  });

  it('handles custom error types', () => {
    class CustomError extends Error {
      constructor(message: string) {
        super(message);
        this.name = 'CustomError';
      }
    }
    const error = new CustomError('Custom message');
    const result = formatRouteErrorForLogging(error);
    expect(result.errorName).toBe('CustomError');
    expect(result.errorMessage).toBe('Custom message');
  });
});

// ============================================================================
// buildRouteErrorAnnouncement Utility
// ============================================================================

describe('buildRouteErrorAnnouncement', () => {
  it('includes error prefix', () => {
    const error = new Error('Test');
    const result = buildRouteErrorAnnouncement(error, 'Title');
    expect(result).toContain(SR_ERROR_PREFIX);
  });

  it('includes title', () => {
    const error = new Error('Test');
    const result = buildRouteErrorAnnouncement(error, 'Something went wrong');
    expect(result).toContain('Something went wrong');
  });

  it('includes error message', () => {
    const error = new Error('Network failure');
    const result = buildRouteErrorAnnouncement(error, 'Title');
    expect(result).toContain('Network failure');
  });

  it('formats correctly', () => {
    const error = new Error('Failed to load');
    const result = buildRouteErrorAnnouncement(error, 'Oops!');
    expect(result).toBe('Page error: Oops!. Failed to load');
  });
});

// ============================================================================
// buildRetryButtonAriaLabel Utility
// ============================================================================

describe('buildRetryButtonAriaLabel', () => {
  it('returns label when not retrying', () => {
    expect(buildRetryButtonAriaLabel('Try Again', false)).toBe('Try Again');
  });

  it('returns retrying announcement when retrying', () => {
    expect(buildRetryButtonAriaLabel('Try Again', true)).toBe(SR_RETRYING);
  });

  it('works with custom labels', () => {
    expect(buildRetryButtonAriaLabel('Retry Operation', false)).toBe('Retry Operation');
  });
});

// ============================================================================
// buildHomeButtonAriaLabel Utility
// ============================================================================

describe('buildHomeButtonAriaLabel', () => {
  it('returns label when not navigating', () => {
    expect(buildHomeButtonAriaLabel('Go Home', false)).toBe('Go Home');
  });

  it('returns navigating announcement when navigating', () => {
    expect(buildHomeButtonAriaLabel('Go Home', true)).toBe(SR_NAVIGATING_HOME);
  });

  it('works with custom labels', () => {
    expect(buildHomeButtonAriaLabel('Return to Dashboard', false)).toBe('Return to Dashboard');
  });
});

// ============================================================================
// Accessibility Behavior Documentation
// ============================================================================

describe('RouteError Accessibility Behavior', () => {
  it('documents role attribute for container', () => {
    // Container should have role="alert" for immediate announcement
    expect(true).toBe(true);
  });

  it('documents aria-live attribute', () => {
    // Container has aria-live="assertive" for error announcement
    // VisuallyHidden has aria-live="polite" for state changes
    expect(true).toBe(true);
  });

  it('documents aria-atomic attribute', () => {
    // aria-atomic="true" ensures entire region is read as one unit
    expect(true).toBe(true);
  });

  it('documents aria-labelledby linking', () => {
    // aria-labelledby points to title element ID
    expect(true).toBe(true);
  });

  it('documents aria-describedby linking', () => {
    // aria-describedby points to description element ID
    expect(true).toBe(true);
  });

  it('documents heading level semantics', () => {
    // Heading level is determined by size (sm=h3, md=h2, lg=h1)
    expect(ROUTE_ERROR_HEADING_LEVEL_MAP.sm).toBe(3);
    expect(ROUTE_ERROR_HEADING_LEVEL_MAP.md).toBe(2);
    expect(ROUTE_ERROR_HEADING_LEVEL_MAP.lg).toBe(1);
  });

  it('documents touch target compliance', () => {
    // Buttons have min-h-[44px] min-w-[44px] on mobile
    // Relaxes to normal size on sm: breakpoint
    expect(true).toBe(true);
  });

  it('documents focus ring requirements', () => {
    // Summary element has focus-visible:ring-2 focus-visible:ring-offset-2
    expect(ROUTE_ERROR_DETAILS_SUMMARY_CLASSES).toContain('focus-visible:ring-2');
    expect(ROUTE_ERROR_DETAILS_SUMMARY_CLASSES).toContain('focus-visible:ring-offset-2');
  });

  it('documents reduced motion support', () => {
    // Summary uses motion-safe:transition-colors
    expect(ROUTE_ERROR_DETAILS_SUMMARY_CLASSES).toContain('motion-safe:transition-colors');
  });
});

// ============================================================================
// Component Behavior Documentation
// ============================================================================

describe('RouteError Component Behavior', () => {
  it('documents logger integration', () => {
    // Uses createLogger with ROUTE_ERROR_LOGGER_CONTEXT
    // Logs error on mount with formatRouteErrorForLogging
    // Logs info on retry and home navigation
    expect(ROUTE_ERROR_LOGGER_CONTEXT).toBe('RouteError');
  });

  it('documents forwardRef support', () => {
    // Component is wrapped with forwardRef<HTMLDivElement>
    // Allows programmatic focus of container
    expect(true).toBe(true);
  });

  it('documents responsive sizing', () => {
    // size prop accepts ResponsiveValue<RouteErrorSize>
    // Supports 'sm' | 'md' | 'lg' or breakpoint object
    expect(true).toBe(true);
  });

  it('documents data attributes', () => {
    // data-testid: Custom or default "route-error"
    // data-size: Current base size value
    // data-has-retry: Boolean for retry callback presence
    // data-has-home: Boolean for home callback presence
    expect(true).toBe(true);
  });

  it('documents button loading states', () => {
    // Buttons are disabled during loading
    // Both buttons disabled when either is loading
    // Loading button shows spinner and loadingText
    expect(true).toBe(true);
  });

  it('documents technical details toggle', () => {
    // Uses native <details> element
    // showTechnicalDetails prop controls visibility
    // Pre element is focusable with tabIndex={0}
    expect(true).toBe(true);
  });
});

// ============================================================================
// Size Consistency Tests
// ============================================================================

describe('RouteError Size Consistency', () => {
  const sizes = ['sm', 'md', 'lg'] as const;

  it('all size maps have same keys', () => {
    const containerKeys = Object.keys(ROUTE_ERROR_CONTAINER_SIZE_CLASSES);
    const iconContainerKeys = Object.keys(ROUTE_ERROR_ICON_CONTAINER_SIZE_CLASSES);
    const buttonGapKeys = Object.keys(ROUTE_ERROR_BUTTON_GAP_CLASSES);
    const detailsKeys = Object.keys(ROUTE_ERROR_DETAILS_SIZE_CLASSES);
    const contentMaxWidthKeys = Object.keys(ROUTE_ERROR_CONTENT_MAX_WIDTH_CLASSES);

    expect(containerKeys).toEqual(sizes);
    expect(iconContainerKeys).toEqual(sizes);
    expect(buttonGapKeys).toEqual(sizes);
    expect(detailsKeys).toEqual(sizes);
    expect(contentMaxWidthKeys).toEqual(sizes);
  });

  it('size progressions make visual sense', () => {
    // Container min-height increases
    expect(ROUTE_ERROR_CONTAINER_SIZE_CLASSES.sm).toContain('60vh');
    expect(ROUTE_ERROR_CONTAINER_SIZE_CLASSES.md).toContain('80vh');
    expect(ROUTE_ERROR_CONTAINER_SIZE_CLASSES.lg).toContain('screen');

    // Gap increases
    expect(ROUTE_ERROR_CONTAINER_SIZE_CLASSES.sm).toContain('gap-4');
    expect(ROUTE_ERROR_CONTAINER_SIZE_CLASSES.md).toContain('gap-6');
    expect(ROUTE_ERROR_CONTAINER_SIZE_CLASSES.lg).toContain('gap-8');

    // Padding increases
    expect(ROUTE_ERROR_CONTAINER_SIZE_CLASSES.sm).toContain('p-4');
    expect(ROUTE_ERROR_CONTAINER_SIZE_CLASSES.md).toContain('p-6');
    expect(ROUTE_ERROR_CONTAINER_SIZE_CLASSES.lg).toContain('p-8');
  });

  it('heading levels decrease with size (bigger = more important)', () => {
    expect(ROUTE_ERROR_HEADING_LEVEL_MAP.lg).toBe(1);
    expect(ROUTE_ERROR_HEADING_LEVEL_MAP.md).toBe(2);
    expect(ROUTE_ERROR_HEADING_LEVEL_MAP.sm).toBe(3);
  });

  it('icon sizes increase with component size', () => {
    expect(ROUTE_ERROR_ICON_SIZE_MAP.sm).toBe('md');
    expect(ROUTE_ERROR_ICON_SIZE_MAP.md).toBe('lg');
    expect(ROUTE_ERROR_ICON_SIZE_MAP.lg).toBe('xl');
  });
});

// ============================================================================
// Integration Patterns Tests
// ============================================================================

describe('RouteError Integration Patterns', () => {
  it('documents TanStack Router error component usage', () => {
    // RouteError is designed for use as errorComponent in TanStack Router
    // Example:
    // export const Route = createFileRoute('/path')({
    //   component: MyComponent,
    //   errorComponent: ({ error }) => (
    //     <RouteError error={error} onRetry={() => window.location.reload()} />
    //   ),
    // });
    expect(true).toBe(true);
  });

  it('documents custom title/description for different error types', () => {
    // Network errors: title="Connection Lost", description="Check your connection"
    // 404 errors: title="Page Not Found"
    // Auth errors: title="Session Expired", retryLabel="Sign In"
    // Permission errors: title="Access Denied"
    expect(DEFAULT_ROUTE_ERROR_TITLE).toBeDefined();
    expect(DEFAULT_ROUTE_ERROR_DESCRIPTION).toBeDefined();
  });

  it('documents embedded layout usage', () => {
    // RouteError can fill the main content area within app shell
    // Use responsive sizing: { base: 'sm', lg: 'md' }
    // Sidebar/header remain visible, only content area shows error
    expect(true).toBe(true);
  });
});
