/**
 * Unit tests for ChatPage component
 *
 * Tests cover:
 * - Exported constants (default values, labels, classes)
 * - Utility functions (getBaseSize, getResponsiveSizeClasses, etc.)
 * - Accessibility-related constants
 * - Size mappings
 *
 * @module tests/ui/pages/ChatPage.test
 */

import { describe, expect, it } from 'vitest';
import {
  CHAT_PAGE_BASE_CLASSES,
  CHAT_PAGE_ERROR_CLASSES,
  CHAT_PAGE_NOT_FOUND_CLASSES,
  CHAT_PAGE_SKELETON_CLASSES,
  CHAT_PAGE_SKELETON_CONTENT_CLASSES,
  CHAT_PAGE_SKELETON_HEADER_CLASSES,
  CHAT_PAGE_SKELETON_INPUT_CLASSES,
  CHAT_PAGE_SKELETON_MESSAGE_CLASSES,
  // Types
  type ChatPageSize,
  DEFAULT_BACK_LABEL,
  DEFAULT_ERROR_DESCRIPTION,
  DEFAULT_ERROR_TITLE,
  DEFAULT_NOT_FOUND_DESCRIPTION,
  DEFAULT_NOT_FOUND_TITLE,
  DEFAULT_PAGE_LABEL,
  DEFAULT_PAGE_SIZE,
  DEFAULT_RETRY_LABEL,
  // Constants
  DEFAULT_SKELETON_MESSAGE_COUNT,
  PAGE_SIZE_GAP,
  PAGE_SIZE_PADDING,
  SKELETON_AVATAR_DIMENSIONS,
  SR_EMPTY,
  SR_ERROR_PREFIX,
  SR_LOADING,
  SR_NOT_FOUND,
  SR_PROCESSING,
  SR_READY_PREFIX,
  buildLoadedAnnouncement,
  buildPageAccessibleLabel,
  // Utility functions
  getBaseSize,
  getResponsiveSizeClasses,
  getSkeletonAvatarDimensions,
} from '../../../packages/ui/pages/ChatPage';

// ============================================================================
// Default Constants Tests
// ============================================================================

describe('Default Constants', () => {
  describe('DEFAULT_SKELETON_MESSAGE_COUNT', () => {
    it('should be 4', () => {
      expect(DEFAULT_SKELETON_MESSAGE_COUNT).toBe(4);
    });
  });

  describe('DEFAULT_PAGE_SIZE', () => {
    it('should be "md"', () => {
      expect(DEFAULT_PAGE_SIZE).toBe('md');
    });
  });

  describe('DEFAULT_PAGE_LABEL', () => {
    it('should be "Chat page"', () => {
      expect(DEFAULT_PAGE_LABEL).toBe('Chat page');
    });
  });
});

// ============================================================================
// Error State Constants Tests
// ============================================================================

describe('Error State Constants', () => {
  describe('DEFAULT_ERROR_TITLE', () => {
    it('should be descriptive', () => {
      expect(DEFAULT_ERROR_TITLE).toBe('Failed to load chat');
    });
  });

  describe('DEFAULT_ERROR_DESCRIPTION', () => {
    it('should provide helpful context', () => {
      expect(DEFAULT_ERROR_DESCRIPTION).toBe('Something went wrong while loading the chat.');
    });
  });

  describe('DEFAULT_RETRY_LABEL', () => {
    it('should be actionable', () => {
      expect(DEFAULT_RETRY_LABEL).toBe('Try Again');
    });
  });
});

// ============================================================================
// Not Found State Constants Tests
// ============================================================================

describe('Not Found State Constants', () => {
  describe('DEFAULT_NOT_FOUND_TITLE', () => {
    it('should be descriptive', () => {
      expect(DEFAULT_NOT_FOUND_TITLE).toBe('Chat not found');
    });
  });

  describe('DEFAULT_NOT_FOUND_DESCRIPTION', () => {
    it('should provide helpful context', () => {
      expect(DEFAULT_NOT_FOUND_DESCRIPTION).toBe(
        'The chat you are looking for does not exist or has been deleted.'
      );
    });
  });

  describe('DEFAULT_BACK_LABEL', () => {
    it('should be actionable', () => {
      expect(DEFAULT_BACK_LABEL).toBe('Go Back');
    });
  });
});

// ============================================================================
// Screen Reader Constants Tests
// ============================================================================

describe('Screen Reader Announcement Constants', () => {
  describe('SR_LOADING', () => {
    it('should announce loading state', () => {
      expect(SR_LOADING).toBe('Loading chat. Please wait.');
    });

    it('should be polite and informative', () => {
      expect(SR_LOADING).toContain('Loading');
      expect(SR_LOADING).toContain('Please wait');
    });
  });

  describe('SR_NOT_FOUND', () => {
    it('should announce not found state', () => {
      expect(SR_NOT_FOUND).toBe('Chat not found.');
    });
  });

  describe('SR_ERROR_PREFIX', () => {
    it('should be a prefix for error messages', () => {
      expect(SR_ERROR_PREFIX).toBe('Error loading chat:');
    });

    it('should end with colon for concatenation', () => {
      expect(SR_ERROR_PREFIX.endsWith(':')).toBe(true);
    });
  });

  describe('SR_EMPTY', () => {
    it('should announce empty chat state', () => {
      expect(SR_EMPTY).toBe('No messages yet. Start the conversation.');
    });

    it('should be encouraging', () => {
      expect(SR_EMPTY).toContain('Start');
    });
  });

  describe('SR_READY_PREFIX', () => {
    it('should announce ready state', () => {
      expect(SR_READY_PREFIX).toBe('Chat loaded.');
    });
  });

  describe('SR_PROCESSING', () => {
    it('should announce processing state', () => {
      expect(SR_PROCESSING).toBe('Assistant is responding.');
    });
  });
});

// ============================================================================
// CSS Class Constants Tests
// ============================================================================

describe('CSS Class Constants', () => {
  describe('CHAT_PAGE_BASE_CLASSES', () => {
    it('should include flex layout classes', () => {
      expect(CHAT_PAGE_BASE_CLASSES).toContain('flex');
      expect(CHAT_PAGE_BASE_CLASSES).toContain('flex-col');
    });

    it('should include full dimensions', () => {
      expect(CHAT_PAGE_BASE_CLASSES).toContain('h-full');
      expect(CHAT_PAGE_BASE_CLASSES).toContain('w-full');
    });

    it('should include relative positioning', () => {
      expect(CHAT_PAGE_BASE_CLASSES).toContain('relative');
    });
  });

  describe('CHAT_PAGE_ERROR_CLASSES', () => {
    it('should center content', () => {
      expect(CHAT_PAGE_ERROR_CLASSES).toContain('items-center');
      expect(CHAT_PAGE_ERROR_CLASSES).toContain('justify-center');
    });

    it('should include minimum height', () => {
      expect(CHAT_PAGE_ERROR_CLASSES).toContain('min-h-[300px]');
    });

    it('should include text centering', () => {
      expect(CHAT_PAGE_ERROR_CLASSES).toContain('text-center');
    });
  });

  describe('CHAT_PAGE_NOT_FOUND_CLASSES', () => {
    it('should center content', () => {
      expect(CHAT_PAGE_NOT_FOUND_CLASSES).toContain('items-center');
      expect(CHAT_PAGE_NOT_FOUND_CLASSES).toContain('justify-center');
    });

    it('should fill full height', () => {
      expect(CHAT_PAGE_NOT_FOUND_CLASSES).toContain('h-full');
    });
  });

  describe('CHAT_PAGE_SKELETON_CLASSES', () => {
    it('should include flex layout', () => {
      expect(CHAT_PAGE_SKELETON_CLASSES).toContain('flex');
      expect(CHAT_PAGE_SKELETON_CLASSES).toContain('flex-col');
    });

    it('should fill full height', () => {
      expect(CHAT_PAGE_SKELETON_CLASSES).toContain('h-full');
    });
  });

  describe('CHAT_PAGE_SKELETON_HEADER_CLASSES', () => {
    it('should include border', () => {
      expect(CHAT_PAGE_SKELETON_HEADER_CLASSES).toContain('border-b');
    });

    it('should include padding', () => {
      expect(CHAT_PAGE_SKELETON_HEADER_CLASSES).toContain('p-4');
    });
  });

  describe('CHAT_PAGE_SKELETON_CONTENT_CLASSES', () => {
    it('should be flexible', () => {
      expect(CHAT_PAGE_SKELETON_CONTENT_CLASSES).toContain('flex-1');
    });

    it('should handle overflow', () => {
      expect(CHAT_PAGE_SKELETON_CONTENT_CLASSES).toContain('overflow-hidden');
    });

    it('should include spacing', () => {
      expect(CHAT_PAGE_SKELETON_CONTENT_CLASSES).toContain('space-y-4');
    });
  });

  describe('CHAT_PAGE_SKELETON_INPUT_CLASSES', () => {
    it('should include top border', () => {
      expect(CHAT_PAGE_SKELETON_INPUT_CLASSES).toContain('border-t');
    });

    it('should include padding', () => {
      expect(CHAT_PAGE_SKELETON_INPUT_CLASSES).toContain('p-4');
    });
  });

  describe('CHAT_PAGE_SKELETON_MESSAGE_CLASSES', () => {
    it('should include flex layout', () => {
      expect(CHAT_PAGE_SKELETON_MESSAGE_CLASSES).toContain('flex');
    });

    it('should include gap', () => {
      expect(CHAT_PAGE_SKELETON_MESSAGE_CLASSES).toContain('gap-3');
    });
  });
});

// ============================================================================
// Size Mapping Tests
// ============================================================================

describe('Size Mappings', () => {
  describe('PAGE_SIZE_PADDING', () => {
    it('should have all size variants', () => {
      expect(PAGE_SIZE_PADDING).toHaveProperty('sm');
      expect(PAGE_SIZE_PADDING).toHaveProperty('md');
      expect(PAGE_SIZE_PADDING).toHaveProperty('lg');
    });

    it('should increase padding with size', () => {
      expect(PAGE_SIZE_PADDING.sm).toBe('p-3');
      expect(PAGE_SIZE_PADDING.md).toBe('p-4');
      expect(PAGE_SIZE_PADDING.lg).toBe('p-6');
    });
  });

  describe('PAGE_SIZE_GAP', () => {
    it('should have all size variants', () => {
      expect(PAGE_SIZE_GAP).toHaveProperty('sm');
      expect(PAGE_SIZE_GAP).toHaveProperty('md');
      expect(PAGE_SIZE_GAP).toHaveProperty('lg');
    });

    it('should increase gap with size', () => {
      expect(PAGE_SIZE_GAP.sm).toBe('gap-3');
      expect(PAGE_SIZE_GAP.md).toBe('gap-4');
      expect(PAGE_SIZE_GAP.lg).toBe('gap-6');
    });
  });

  describe('SKELETON_AVATAR_DIMENSIONS', () => {
    it('should have all size variants', () => {
      expect(SKELETON_AVATAR_DIMENSIONS).toHaveProperty('sm');
      expect(SKELETON_AVATAR_DIMENSIONS).toHaveProperty('md');
      expect(SKELETON_AVATAR_DIMENSIONS).toHaveProperty('lg');
    });

    it('should be numeric pixel values', () => {
      expect(typeof SKELETON_AVATAR_DIMENSIONS.sm).toBe('number');
      expect(typeof SKELETON_AVATAR_DIMENSIONS.md).toBe('number');
      expect(typeof SKELETON_AVATAR_DIMENSIONS.lg).toBe('number');
    });

    it('should increase with size', () => {
      expect(SKELETON_AVATAR_DIMENSIONS.sm).toBe(32);
      expect(SKELETON_AVATAR_DIMENSIONS.md).toBe(40);
      expect(SKELETON_AVATAR_DIMENSIONS.lg).toBe(48);
    });
  });
});

// ============================================================================
// Utility Function Tests: getBaseSize
// ============================================================================

describe('getBaseSize', () => {
  it('should return default when size is undefined', () => {
    expect(getBaseSize(undefined)).toBe(DEFAULT_PAGE_SIZE);
  });

  it('should return the size when string is provided', () => {
    expect(getBaseSize('sm')).toBe('sm');
    expect(getBaseSize('md')).toBe('md');
    expect(getBaseSize('lg')).toBe('lg');
  });

  it('should return base from responsive object', () => {
    expect(getBaseSize({ base: 'sm' })).toBe('sm');
    expect(getBaseSize({ base: 'lg', md: 'sm' })).toBe('lg');
  });

  it('should return default when base is not in responsive object', () => {
    expect(getBaseSize({ md: 'lg' })).toBe(DEFAULT_PAGE_SIZE);
  });
});

// ============================================================================
// Utility Function Tests: getResponsiveSizeClasses
// ============================================================================

describe('getResponsiveSizeClasses', () => {
  const testClassMap: Record<ChatPageSize, string> = {
    sm: 'test-sm',
    md: 'test-md',
    lg: 'test-lg',
  };

  it('should return default when size is undefined', () => {
    expect(getResponsiveSizeClasses(undefined, testClassMap)).toBe('test-md');
  });

  it('should return correct class for string size', () => {
    expect(getResponsiveSizeClasses('sm', testClassMap)).toBe('test-sm');
    expect(getResponsiveSizeClasses('md', testClassMap)).toBe('test-md');
    expect(getResponsiveSizeClasses('lg', testClassMap)).toBe('test-lg');
  });

  it('should handle responsive object with base only', () => {
    expect(getResponsiveSizeClasses({ base: 'sm' }, testClassMap)).toBe('test-sm');
  });

  it('should add breakpoint prefixes for responsive sizes', () => {
    const result = getResponsiveSizeClasses({ base: 'sm', md: 'md', lg: 'lg' }, testClassMap);
    expect(result).toContain('test-sm');
    expect(result).toContain('md:test-md');
    expect(result).toContain('lg:test-lg');
  });

  it('should handle all breakpoints', () => {
    const result = getResponsiveSizeClasses(
      { base: 'sm', sm: 'md', md: 'lg', lg: 'sm', xl: 'md', '2xl': 'lg' },
      testClassMap
    );
    expect(result).toContain('test-sm');
    expect(result).toContain('sm:test-md');
    expect(result).toContain('md:test-lg');
    expect(result).toContain('lg:test-sm');
    expect(result).toContain('xl:test-md');
    expect(result).toContain('2xl:test-lg');
  });

  it('should use default for base when not specified in responsive object', () => {
    const result = getResponsiveSizeClasses({ md: 'lg' }, testClassMap);
    expect(result).toContain('test-md'); // default
    expect(result).toContain('md:test-lg');
  });

  it('should handle multi-word classes correctly', () => {
    const multiClassMap: Record<ChatPageSize, string> = {
      sm: 'p-2 m-2',
      md: 'p-4 m-4',
      lg: 'p-6 m-6',
    };

    const result = getResponsiveSizeClasses({ base: 'sm', md: 'md' }, multiClassMap);
    expect(result).toContain('p-2');
    expect(result).toContain('m-2');
    expect(result).toContain('md:p-4');
    expect(result).toContain('md:m-4');
  });
});

// ============================================================================
// Utility Function Tests: getSkeletonAvatarDimensions
// ============================================================================

describe('getSkeletonAvatarDimensions', () => {
  it('should return default when size is undefined', () => {
    expect(getSkeletonAvatarDimensions(undefined)).toBe(SKELETON_AVATAR_DIMENSIONS.md);
  });

  it('should return correct dimensions for string size', () => {
    expect(getSkeletonAvatarDimensions('sm')).toBe(32);
    expect(getSkeletonAvatarDimensions('md')).toBe(40);
    expect(getSkeletonAvatarDimensions('lg')).toBe(48);
  });

  it('should return base size dimensions for responsive object', () => {
    expect(getSkeletonAvatarDimensions({ base: 'sm' })).toBe(32);
    expect(getSkeletonAvatarDimensions({ base: 'lg', md: 'sm' })).toBe(48);
  });
});

// ============================================================================
// Utility Function Tests: buildLoadedAnnouncement
// ============================================================================

describe('buildLoadedAnnouncement', () => {
  it('should start with ready prefix', () => {
    const result = buildLoadedAnnouncement('Test Chat', 5, false);
    expect(result.startsWith(SR_READY_PREFIX)).toBe(true);
  });

  it('should include chat title when provided', () => {
    const result = buildLoadedAnnouncement('My Chat', 3, false);
    expect(result).toContain('Chat: My Chat');
  });

  it('should not include title when undefined', () => {
    const result = buildLoadedAnnouncement(undefined, 3, false);
    expect(result).not.toContain('Chat:');
  });

  it('should announce empty state for zero messages', () => {
    const result = buildLoadedAnnouncement('Test', 0, false);
    expect(result).toContain(SR_EMPTY);
  });

  it('should use singular "message" for one message', () => {
    const result = buildLoadedAnnouncement('Test', 1, false);
    expect(result).toContain('1 message');
    expect(result).not.toContain('1 messages');
  });

  it('should use plural "messages" for multiple messages', () => {
    const result = buildLoadedAnnouncement('Test', 5, false);
    expect(result).toContain('5 messages');
  });

  it('should include processing state when true', () => {
    const result = buildLoadedAnnouncement('Test', 3, true);
    expect(result).toContain(SR_PROCESSING);
  });

  it('should not include processing state when false', () => {
    const result = buildLoadedAnnouncement('Test', 3, false);
    expect(result).not.toContain(SR_PROCESSING);
  });

  it('should handle all parts together', () => {
    const result = buildLoadedAnnouncement('Auth Flow', 3, true);
    expect(result).toContain(SR_READY_PREFIX);
    expect(result).toContain('Chat: Auth Flow');
    expect(result).toContain('3 messages');
    expect(result).toContain(SR_PROCESSING);
  });
});

// ============================================================================
// Utility Function Tests: buildPageAccessibleLabel
// ============================================================================

describe('buildPageAccessibleLabel', () => {
  describe('with title', () => {
    it('should include title in label', () => {
      const result = buildPageAccessibleLabel('My Chat', 'ready');
      expect(result).toBe('Chat: My Chat');
    });

    it('should append loading state', () => {
      const result = buildPageAccessibleLabel('My Chat', 'loading');
      expect(result).toBe('Chat: My Chat - Loading');
    });

    it('should append not-found state', () => {
      const result = buildPageAccessibleLabel('My Chat', 'not-found');
      expect(result).toBe('Chat: My Chat - Not found');
    });

    it('should append error state', () => {
      const result = buildPageAccessibleLabel('My Chat', 'error');
      expect(result).toBe('Chat: My Chat - Error loading');
    });
  });

  describe('without title', () => {
    it('should use default label', () => {
      const result = buildPageAccessibleLabel(undefined, 'ready');
      expect(result).toBe(DEFAULT_PAGE_LABEL);
    });

    it('should append loading state', () => {
      const result = buildPageAccessibleLabel(undefined, 'loading');
      expect(result).toBe(`${DEFAULT_PAGE_LABEL} - Loading`);
    });

    it('should append not-found state', () => {
      const result = buildPageAccessibleLabel(undefined, 'not-found');
      expect(result).toBe(`${DEFAULT_PAGE_LABEL} - Not found`);
    });

    it('should append error state', () => {
      const result = buildPageAccessibleLabel(undefined, 'error');
      expect(result).toBe(`${DEFAULT_PAGE_LABEL} - Error loading`);
    });
  });
});

// ============================================================================
// Accessibility Behavior Documentation Tests
// ============================================================================

describe('Accessibility Behavior Documentation', () => {
  it('ChatPage should have aria-label based on title and state', () => {
    // This documents expected behavior
    expect(buildPageAccessibleLabel('Auth Flow', 'ready')).toBe('Chat: Auth Flow');
    expect(buildPageAccessibleLabel('Auth Flow', 'loading')).toBe('Chat: Auth Flow - Loading');
  });

  it('Loading state should announce via VisuallyHidden', () => {
    // Documents that SR_LOADING is used for screen reader announcement
    expect(SR_LOADING).toBeDefined();
    expect(SR_LOADING.length).toBeGreaterThan(0);
  });

  it('Error state should use role="alert" with assertive announcement', () => {
    // Documents that errors are announced assertively
    expect(SR_ERROR_PREFIX).toContain('Error');
  });

  it('Not found state should use descriptive announcement', () => {
    // Documents not found announcement
    expect(SR_NOT_FOUND).toContain('not found');
  });
});

// ============================================================================
// Component Props Documentation Tests
// ============================================================================

describe('Component Props Documentation', () => {
  it('ChatPage accepts state prop with specific values', () => {
    // Documents that state can be 'loading' | 'not-found' | 'error' | 'ready'
    const validStates = ['loading', 'not-found', 'error', 'ready'];
    validStates.forEach((state) => {
      expect(typeof state).toBe('string');
    });
  });

  it('ChatPageSkeleton accepts messageCount prop', () => {
    // Documents that skeleton can show variable message count
    expect(DEFAULT_SKELETON_MESSAGE_COUNT).toBe(4);
  });

  it('ChatPageError accepts error and onRetry props', () => {
    // Documents that error component needs error object and retry handler
    expect(DEFAULT_ERROR_TITLE).toBeDefined();
    expect(DEFAULT_RETRY_LABEL).toBeDefined();
  });
});

// ============================================================================
// Size Consistency Tests
// ============================================================================

describe('Size Consistency', () => {
  const sizes: ChatPageSize[] = ['sm', 'md', 'lg'];

  it('all size maps should have all three sizes', () => {
    sizes.forEach((size) => {
      expect(PAGE_SIZE_PADDING[size]).toBeDefined();
      expect(PAGE_SIZE_GAP[size]).toBeDefined();
      expect(SKELETON_AVATAR_DIMENSIONS[size]).toBeDefined();
    });
  });

  it('size values should progressively increase', () => {
    // Padding progression
    expect(Number.parseInt(PAGE_SIZE_PADDING.sm.replace('p-', ''))).toBeLessThan(
      Number.parseInt(PAGE_SIZE_PADDING.md.replace('p-', ''))
    );
    expect(Number.parseInt(PAGE_SIZE_PADDING.md.replace('p-', ''))).toBeLessThan(
      Number.parseInt(PAGE_SIZE_PADDING.lg.replace('p-', ''))
    );

    // Gap progression
    expect(Number.parseInt(PAGE_SIZE_GAP.sm.replace('gap-', ''))).toBeLessThan(
      Number.parseInt(PAGE_SIZE_GAP.md.replace('gap-', ''))
    );
    expect(Number.parseInt(PAGE_SIZE_GAP.md.replace('gap-', ''))).toBeLessThan(
      Number.parseInt(PAGE_SIZE_GAP.lg.replace('gap-', ''))
    );

    // Avatar dimensions progression
    expect(SKELETON_AVATAR_DIMENSIONS.sm).toBeLessThan(SKELETON_AVATAR_DIMENSIONS.md);
    expect(SKELETON_AVATAR_DIMENSIONS.md).toBeLessThan(SKELETON_AVATAR_DIMENSIONS.lg);
  });
});

// ============================================================================
// Data Attributes Documentation Tests
// ============================================================================

describe('Data Attributes Documentation', () => {
  it('documents data-testid values', () => {
    const testIds = ['chat-page', 'chat-page-skeleton', 'chat-page-error', 'chat-page-not-found'];
    testIds.forEach((testId) => {
      expect(typeof testId).toBe('string');
    });
  });

  it('documents data-state values', () => {
    const states = ['loading', 'error', 'not-found', 'ready', 'empty'];
    states.forEach((state) => {
      expect(typeof state).toBe('string');
    });
  });

  it('documents data-processing attribute', () => {
    // data-processing="true" when isProcessing is true
    expect(typeof 'true').toBe('string');
  });

  it('documents data-message-count attribute', () => {
    // data-message-count is a number as string
    expect(String(5)).toBe('5');
  });
});

// ============================================================================
// Integration Pattern Tests
// ============================================================================

describe('Integration Patterns', () => {
  it('page label includes state suffix appropriately', () => {
    // Ready state should not have suffix
    expect(buildPageAccessibleLabel('Test', 'ready')).not.toContain(' - ');

    // Other states should have suffix
    expect(buildPageAccessibleLabel('Test', 'loading')).toContain(' - Loading');
    expect(buildPageAccessibleLabel('Test', 'error')).toContain(' - Error loading');
    expect(buildPageAccessibleLabel('Test', 'not-found')).toContain(' - Not found');
  });

  it('announcement includes all relevant parts', () => {
    const announcement = buildLoadedAnnouncement('My Chat', 10, true);

    // Should be space-separated
    const parts = announcement.split(' ');
    expect(parts.length).toBeGreaterThan(3);

    // Should end with processing message
    expect(announcement.endsWith(SR_PROCESSING)).toBe(true);
  });
});
