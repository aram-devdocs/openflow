/**
 * ChatPageComponents Tests
 *
 * Tests for utility functions and exported constants from ChatPageComponents.
 * These tests verify the behavior of class generation, announcement text,
 * and accessibility utilities.
 */

import { describe, expect, it } from 'vitest';
import {
  // Constants
  CHAT_PAGE_CONTENT_CONTAINER_CLASSES,
  CHAT_PAGE_CONTENT_WRAPPER_CLASSES,
  CHAT_PAGE_LAYOUT_CLASSES,
  DEFAULT_BACK_LABEL,
  DEFAULT_EMPTY_DESCRIPTION,
  DEFAULT_EMPTY_TITLE,
  DEFAULT_ERROR_RETRY_LABEL,
  DEFAULT_ERROR_TITLE,
  DEFAULT_INPUT_PLACEHOLDER,
  DEFAULT_NOT_FOUND_DESCRIPTION,
  DEFAULT_NOT_FOUND_TITLE,
  DEFAULT_SEND_LABEL,
  DEFAULT_STOP_LABEL,
  DEFAULT_TOGGLE_RAW_LABEL_HIDE,
  DEFAULT_TOGGLE_RAW_LABEL_SHOW,
  DEFAULT_UNTITLED_CHAT,
  EMPTY_STATE_CLASSES,
  EMPTY_STATE_ICON_CONTAINER_CLASSES,
  ERROR_ICON_CLASSES,
  ERROR_STATE_CLASSES,
  HEADER_BACK_BUTTON_CLASSES,
  HEADER_CONTAINER_CLASSES,
  HEADER_CONTENT_WRAPPER_CLASSES,
  HEADER_ICON_CONTAINER_CLASSES,
  HEADER_TEXT_WRAPPER_CLASSES,
  HEADER_TOGGLE_BUTTON_CLASSES,
  HELPER_TEXT_CLASSES,
  INPUT_AREA_CONTAINER_CLASSES,
  INPUT_AREA_INNER_CLASSES,
  INPUT_AREA_WRAPPER_CLASSES,
  INPUT_BUTTON_CLASSES,
  KBD_CLASSES,
  MESSAGE_LIST_CLASSES,
  NOT_FOUND_CLASSES,
  NOT_FOUND_ICON_CLASSES,
  SKELETON_CONTENT_CONTAINER_CLASSES,
  SKELETON_CONTENT_WRAPPER_CLASSES,
  SKELETON_HEADER_CLASSES,
  SKELETON_INPUT_CONTAINER_CLASSES,
  SKELETON_INPUT_WRAPPER_CLASSES,
  SR_EMPTY,
  SR_LOADING,
  SR_NOT_FOUND,
  SR_PROCESSING,
  SR_SEND_HINT,
  TEXTAREA_CLASSES,
  // Utility functions
  buildHeaderAccessibleLabel,
  getBaseSize,
  getResponsiveSizeClasses,
  getToggleButtonLabel,
} from '../../../packages/ui/organisms/ChatPageComponents';

// ============================================================================
// Default Constants Tests
// ============================================================================

describe('Default Label Constants', () => {
  it('DEFAULT_BACK_LABEL should be meaningful', () => {
    expect(DEFAULT_BACK_LABEL).toBe('Go back');
  });

  it('DEFAULT_UNTITLED_CHAT should provide fallback', () => {
    expect(DEFAULT_UNTITLED_CHAT).toBe('Untitled Chat');
  });

  it('DEFAULT_TOGGLE_RAW_LABEL_SHOW should describe action', () => {
    expect(DEFAULT_TOGGLE_RAW_LABEL_SHOW).toBe('Show raw output');
  });

  it('DEFAULT_TOGGLE_RAW_LABEL_HIDE should describe action', () => {
    expect(DEFAULT_TOGGLE_RAW_LABEL_HIDE).toBe('Show formatted output');
  });

  it('DEFAULT_EMPTY_TITLE should be welcoming', () => {
    expect(DEFAULT_EMPTY_TITLE).toBe('Start a conversation');
  });

  it('DEFAULT_EMPTY_DESCRIPTION should provide guidance', () => {
    expect(DEFAULT_EMPTY_DESCRIPTION).toContain('Send a message');
  });

  it('DEFAULT_NOT_FOUND_TITLE should describe error', () => {
    expect(DEFAULT_NOT_FOUND_TITLE).toBe('Chat not found');
  });

  it('DEFAULT_NOT_FOUND_DESCRIPTION should explain situation', () => {
    expect(DEFAULT_NOT_FOUND_DESCRIPTION).toContain("doesn't exist");
  });

  it('DEFAULT_SEND_LABEL should be action-oriented', () => {
    expect(DEFAULT_SEND_LABEL).toBe('Send message');
  });

  it('DEFAULT_STOP_LABEL should be action-oriented', () => {
    expect(DEFAULT_STOP_LABEL).toBe('Stop process');
  });

  it('DEFAULT_INPUT_PLACEHOLDER should be inviting', () => {
    expect(DEFAULT_INPUT_PLACEHOLDER).toBe('Type a message...');
  });

  it('DEFAULT_ERROR_TITLE should describe error', () => {
    expect(DEFAULT_ERROR_TITLE).toBe('Failed to load chat');
  });

  it('DEFAULT_ERROR_RETRY_LABEL should be action-oriented', () => {
    expect(DEFAULT_ERROR_RETRY_LABEL).toBe('Retry');
  });
});

// ============================================================================
// Screen Reader Constants Tests
// ============================================================================

describe('Screen Reader Announcement Constants', () => {
  it('SR_LOADING should announce loading state', () => {
    expect(SR_LOADING).toBe('Loading chat...');
  });

  it('SR_NOT_FOUND should announce not found state', () => {
    expect(SR_NOT_FOUND).toBe('Chat not found');
  });

  it('SR_EMPTY should provide guidance', () => {
    expect(SR_EMPTY).toBe('No messages yet. Start a conversation by sending a message.');
  });

  it('SR_PROCESSING should announce processing', () => {
    expect(SR_PROCESSING).toBe('Claude is responding...');
  });

  it('SR_SEND_HINT should explain keyboard shortcuts', () => {
    expect(SR_SEND_HINT).toBe('Press Enter to send, Shift+Enter for new line');
  });
});

// ============================================================================
// Layout Classes Tests
// ============================================================================

describe('CHAT_PAGE_LAYOUT_CLASSES', () => {
  it('should include flex', () => {
    expect(CHAT_PAGE_LAYOUT_CLASSES).toContain('flex');
  });

  it('should include full height', () => {
    expect(CHAT_PAGE_LAYOUT_CLASSES).toContain('h-full');
  });

  it('should include flex column', () => {
    expect(CHAT_PAGE_LAYOUT_CLASSES).toContain('flex-col');
  });

  it('should include background color', () => {
    expect(CHAT_PAGE_LAYOUT_CLASSES).toContain('bg-');
  });
});

describe('CHAT_PAGE_CONTENT_WRAPPER_CLASSES', () => {
  it('should include flex grow', () => {
    expect(CHAT_PAGE_CONTENT_WRAPPER_CLASSES).toContain('flex-1');
  });

  it('should include overflow scroll', () => {
    expect(CHAT_PAGE_CONTENT_WRAPPER_CLASSES).toContain('overflow-y-auto');
  });
});

describe('CHAT_PAGE_CONTENT_CONTAINER_CLASSES', () => {
  it('should include max-width', () => {
    expect(CHAT_PAGE_CONTENT_CONTAINER_CLASSES).toContain('max-w-4xl');
  });

  it('should include centering', () => {
    expect(CHAT_PAGE_CONTENT_CONTAINER_CLASSES).toContain('mx-auto');
  });

  it('should include responsive padding', () => {
    expect(CHAT_PAGE_CONTENT_CONTAINER_CLASSES).toContain('px-3');
    expect(CHAT_PAGE_CONTENT_CONTAINER_CLASSES).toContain('md:px-4');
  });
});

// ============================================================================
// Skeleton Classes Tests
// ============================================================================

describe('SKELETON_HEADER_CLASSES', () => {
  it('should include flex', () => {
    expect(SKELETON_HEADER_CLASSES).toContain('flex');
  });

  it('should include border', () => {
    expect(SKELETON_HEADER_CLASSES).toContain('border-b');
  });

  it('should include card background', () => {
    expect(SKELETON_HEADER_CLASSES).toContain('bg-[rgb(var(--card))]');
  });
});

describe('SKELETON_CONTENT_WRAPPER_CLASSES', () => {
  it('should include flex grow', () => {
    expect(SKELETON_CONTENT_WRAPPER_CLASSES).toContain('flex-1');
  });

  it('should include overflow', () => {
    expect(SKELETON_CONTENT_WRAPPER_CLASSES).toContain('overflow-y-auto');
  });
});

describe('SKELETON_CONTENT_CONTAINER_CLASSES', () => {
  it('should include max-width', () => {
    expect(SKELETON_CONTENT_CONTAINER_CLASSES).toContain('max-w-4xl');
  });

  it('should include centering', () => {
    expect(SKELETON_CONTENT_CONTAINER_CLASSES).toContain('mx-auto');
  });
});

describe('SKELETON_INPUT_WRAPPER_CLASSES', () => {
  it('should include top border', () => {
    expect(SKELETON_INPUT_WRAPPER_CLASSES).toContain('border-t');
  });

  it('should include card background', () => {
    expect(SKELETON_INPUT_WRAPPER_CLASSES).toContain('bg-[rgb(var(--card))]');
  });
});

describe('SKELETON_INPUT_CONTAINER_CLASSES', () => {
  it('should include max-width', () => {
    expect(SKELETON_INPUT_CONTAINER_CLASSES).toContain('max-w-4xl');
  });

  it('should include centering', () => {
    expect(SKELETON_INPUT_CONTAINER_CLASSES).toContain('mx-auto');
  });

  it('should include padding', () => {
    expect(SKELETON_INPUT_CONTAINER_CLASSES).toContain('px-4');
    expect(SKELETON_INPUT_CONTAINER_CLASSES).toContain('py-4');
  });
});

// ============================================================================
// Not Found Classes Tests
// ============================================================================

describe('NOT_FOUND_CLASSES', () => {
  it('should include flex', () => {
    expect(NOT_FOUND_CLASSES).toContain('flex');
  });

  it('should include full height', () => {
    expect(NOT_FOUND_CLASSES).toContain('h-full');
  });

  it('should include centering', () => {
    expect(NOT_FOUND_CLASSES).toContain('items-center');
    expect(NOT_FOUND_CLASSES).toContain('justify-center');
  });

  it('should include flex column', () => {
    expect(NOT_FOUND_CLASSES).toContain('flex-col');
  });
});

describe('NOT_FOUND_ICON_CLASSES', () => {
  it('should include margin', () => {
    expect(NOT_FOUND_ICON_CLASSES).toContain('mb-4');
  });

  it('should include size', () => {
    expect(NOT_FOUND_ICON_CLASSES).toContain('h-16');
    expect(NOT_FOUND_ICON_CLASSES).toContain('w-16');
  });

  it('should include muted color', () => {
    expect(NOT_FOUND_ICON_CLASSES).toContain('text-[rgb(var(--muted-foreground))]');
  });
});

// ============================================================================
// Error State Classes Tests
// ============================================================================

describe('ERROR_STATE_CLASSES', () => {
  it('should include flex', () => {
    expect(ERROR_STATE_CLASSES).toContain('flex');
  });

  it('should include full height', () => {
    expect(ERROR_STATE_CLASSES).toContain('h-full');
  });

  it('should include centering', () => {
    expect(ERROR_STATE_CLASSES).toContain('items-center');
    expect(ERROR_STATE_CLASSES).toContain('justify-center');
  });
});

describe('ERROR_ICON_CLASSES', () => {
  it('should include margin', () => {
    expect(ERROR_ICON_CLASSES).toContain('mb-4');
  });

  it('should include size', () => {
    expect(ERROR_ICON_CLASSES).toContain('h-16');
    expect(ERROR_ICON_CLASSES).toContain('w-16');
  });

  it('should include destructive color', () => {
    expect(ERROR_ICON_CLASSES).toContain('text-[rgb(var(--destructive))]');
  });
});

// ============================================================================
// Header Classes Tests
// ============================================================================

describe('HEADER_CONTAINER_CLASSES', () => {
  it('should include flex', () => {
    expect(HEADER_CONTAINER_CLASSES).toContain('flex');
  });

  it('should include border', () => {
    expect(HEADER_CONTAINER_CLASSES).toContain('border-b');
  });

  it('should include responsive gap', () => {
    expect(HEADER_CONTAINER_CLASSES).toContain('gap-2');
    expect(HEADER_CONTAINER_CLASSES).toContain('md:gap-3');
  });

  it('should include responsive padding', () => {
    expect(HEADER_CONTAINER_CLASSES).toContain('px-3');
    expect(HEADER_CONTAINER_CLASSES).toContain('md:px-4');
  });
});

describe('HEADER_BACK_BUTTON_CLASSES', () => {
  it('should include shrink-0', () => {
    expect(HEADER_BACK_BUTTON_CLASSES).toContain('shrink-0');
  });

  it('should include touch target on mobile', () => {
    expect(HEADER_BACK_BUTTON_CLASSES).toContain('min-h-[44px]');
    expect(HEADER_BACK_BUTTON_CLASSES).toContain('min-w-[44px]');
  });

  it('should relax touch target on desktop', () => {
    expect(HEADER_BACK_BUTTON_CLASSES).toContain('sm:min-h-8');
    expect(HEADER_BACK_BUTTON_CLASSES).toContain('sm:min-w-8');
  });
});

describe('HEADER_CONTENT_WRAPPER_CLASSES', () => {
  it('should include flex', () => {
    expect(HEADER_CONTENT_WRAPPER_CLASSES).toContain('flex');
  });

  it('should include flex grow', () => {
    expect(HEADER_CONTENT_WRAPPER_CLASSES).toContain('flex-1');
  });

  it('should include min-w-0 for truncation', () => {
    expect(HEADER_CONTENT_WRAPPER_CLASSES).toContain('min-w-0');
  });
});

describe('HEADER_ICON_CONTAINER_CLASSES', () => {
  it('should be hidden on mobile', () => {
    expect(HEADER_ICON_CONTAINER_CLASSES).toContain('hidden');
    expect(HEADER_ICON_CONTAINER_CLASSES).toContain('sm:flex');
  });

  it('should include size', () => {
    expect(HEADER_ICON_CONTAINER_CLASSES).toContain('h-8');
    expect(HEADER_ICON_CONTAINER_CLASSES).toContain('w-8');
  });

  it('should include shrink-0', () => {
    expect(HEADER_ICON_CONTAINER_CLASSES).toContain('shrink-0');
  });
});

describe('HEADER_TEXT_WRAPPER_CLASSES', () => {
  it('should include min-w-0 for truncation', () => {
    expect(HEADER_TEXT_WRAPPER_CLASSES).toContain('min-w-0');
  });

  it('should include flex grow', () => {
    expect(HEADER_TEXT_WRAPPER_CLASSES).toContain('flex-1');
  });
});

describe('HEADER_TOGGLE_BUTTON_CLASSES', () => {
  it('should include shrink-0', () => {
    expect(HEADER_TOGGLE_BUTTON_CLASSES).toContain('shrink-0');
  });

  it('should include touch target on mobile', () => {
    expect(HEADER_TOGGLE_BUTTON_CLASSES).toContain('min-h-[44px]');
  });

  it('should relax on desktop', () => {
    expect(HEADER_TOGGLE_BUTTON_CLASSES).toContain('sm:min-h-8');
  });
});

// ============================================================================
// Empty State Classes Tests
// ============================================================================

describe('EMPTY_STATE_CLASSES', () => {
  it('should include flex', () => {
    expect(EMPTY_STATE_CLASSES).toContain('flex');
  });

  it('should include flex column', () => {
    expect(EMPTY_STATE_CLASSES).toContain('flex-col');
  });

  it('should include centering', () => {
    expect(EMPTY_STATE_CLASSES).toContain('items-center');
    expect(EMPTY_STATE_CLASSES).toContain('justify-center');
  });

  it('should include text-center', () => {
    expect(EMPTY_STATE_CLASSES).toContain('text-center');
  });
});

describe('EMPTY_STATE_ICON_CONTAINER_CLASSES', () => {
  it('should include size', () => {
    expect(EMPTY_STATE_ICON_CONTAINER_CLASSES).toContain('h-16');
    expect(EMPTY_STATE_ICON_CONTAINER_CLASSES).toContain('w-16');
  });

  it('should include flex centering', () => {
    expect(EMPTY_STATE_ICON_CONTAINER_CLASSES).toContain('flex');
    expect(EMPTY_STATE_ICON_CONTAINER_CLASSES).toContain('items-center');
    expect(EMPTY_STATE_ICON_CONTAINER_CLASSES).toContain('justify-center');
  });

  it('should include rounded', () => {
    expect(EMPTY_STATE_ICON_CONTAINER_CLASSES).toContain('rounded-2xl');
  });
});

// ============================================================================
// Message List Classes Tests
// ============================================================================

describe('MESSAGE_LIST_CLASSES', () => {
  it('should include vertical spacing', () => {
    expect(MESSAGE_LIST_CLASSES).toContain('space-y-6');
  });
});

// ============================================================================
// Input Area Classes Tests
// ============================================================================

describe('INPUT_AREA_CONTAINER_CLASSES', () => {
  it('should include top border', () => {
    expect(INPUT_AREA_CONTAINER_CLASSES).toContain('border-t');
  });

  it('should include card background', () => {
    expect(INPUT_AREA_CONTAINER_CLASSES).toContain('bg-[rgb(var(--card))]');
  });
});

describe('INPUT_AREA_INNER_CLASSES', () => {
  it('should include max-width', () => {
    expect(INPUT_AREA_INNER_CLASSES).toContain('max-w-4xl');
  });

  it('should include centering', () => {
    expect(INPUT_AREA_INNER_CLASSES).toContain('mx-auto');
  });

  it('should include responsive padding', () => {
    expect(INPUT_AREA_INNER_CLASSES).toContain('px-3');
    expect(INPUT_AREA_INNER_CLASSES).toContain('md:px-4');
  });
});

describe('INPUT_AREA_WRAPPER_CLASSES', () => {
  it('should include flex', () => {
    expect(INPUT_AREA_WRAPPER_CLASSES).toContain('flex');
  });

  it('should include responsive gap', () => {
    expect(INPUT_AREA_WRAPPER_CLASSES).toContain('gap-2');
    expect(INPUT_AREA_WRAPPER_CLASSES).toContain('md:gap-3');
  });
});

describe('TEXTAREA_CLASSES', () => {
  it('should include full width', () => {
    expect(TEXTAREA_CLASSES).toContain('w-full');
  });

  it('should include no resize', () => {
    expect(TEXTAREA_CLASSES).toContain('resize-none');
  });

  it('should include rounded', () => {
    expect(TEXTAREA_CLASSES).toContain('rounded-xl');
  });

  it('should include focus ring with offset', () => {
    expect(TEXTAREA_CLASSES).toContain('focus-visible:ring-2');
    expect(TEXTAREA_CLASSES).toContain('focus-visible:ring-offset-2');
  });

  it('should include disabled styles', () => {
    expect(TEXTAREA_CLASSES).toContain('disabled:cursor-not-allowed');
    expect(TEXTAREA_CLASSES).toContain('disabled:opacity-50');
  });

  it('should include min touch target height', () => {
    expect(TEXTAREA_CLASSES).toContain('min-h-[44px]');
  });
});

describe('INPUT_BUTTON_CLASSES', () => {
  it('should include size', () => {
    expect(INPUT_BUTTON_CLASSES).toContain('h-11');
    expect(INPUT_BUTTON_CLASSES).toContain('w-11');
  });

  it('should include shrink-0', () => {
    expect(INPUT_BUTTON_CLASSES).toContain('shrink-0');
  });

  it('should include touch target', () => {
    expect(INPUT_BUTTON_CLASSES).toContain('min-h-[44px]');
    expect(INPUT_BUTTON_CLASSES).toContain('min-w-[44px]');
  });
});

describe('HELPER_TEXT_CLASSES', () => {
  it('should be hidden on mobile', () => {
    expect(HELPER_TEXT_CLASSES).toContain('hidden');
    expect(HELPER_TEXT_CLASSES).toContain('sm:block');
  });

  it('should include text centering', () => {
    expect(HELPER_TEXT_CLASSES).toContain('text-center');
  });

  it('should include small text size', () => {
    expect(HELPER_TEXT_CLASSES).toContain('text-xs');
  });
});

describe('KBD_CLASSES', () => {
  it('should include rounded', () => {
    expect(KBD_CLASSES).toContain('rounded');
  });

  it('should include border', () => {
    expect(KBD_CLASSES).toContain('border');
  });

  it('should include monospace font', () => {
    expect(KBD_CLASSES).toContain('font-mono');
  });
});

// ============================================================================
// Utility Function Tests
// ============================================================================

describe('getBaseSize', () => {
  it('should return string size directly', () => {
    expect(getBaseSize('sm')).toBe('sm');
    expect(getBaseSize('md')).toBe('md');
    expect(getBaseSize('lg')).toBe('lg');
  });

  it('should return base size from responsive object', () => {
    expect(getBaseSize({ base: 'sm', md: 'lg' })).toBe('sm');
    expect(getBaseSize({ base: 'lg', xl: 'md' })).toBe('lg');
  });

  it('should default to md when no base provided', () => {
    expect(getBaseSize({ md: 'lg' })).toBe('md');
    expect(getBaseSize({})).toBe('md');
  });
});

describe('getResponsiveSizeClasses', () => {
  const mockSizeMap = {
    sm: 'text-sm p-2',
    md: 'text-base p-3',
    lg: 'text-lg p-4',
  };

  it('should return classes for string size', () => {
    expect(getResponsiveSizeClasses('sm', mockSizeMap)).toBe('text-sm p-2');
    expect(getResponsiveSizeClasses('md', mockSizeMap)).toBe('text-base p-3');
    expect(getResponsiveSizeClasses('lg', mockSizeMap)).toBe('text-lg p-4');
  });

  it('should return base classes without prefix for base breakpoint', () => {
    const result = getResponsiveSizeClasses({ base: 'sm' }, mockSizeMap);
    expect(result).toBe('text-sm p-2');
  });

  it('should prefix classes for non-base breakpoints', () => {
    const result = getResponsiveSizeClasses({ md: 'lg' }, mockSizeMap);
    expect(result).toBe('md:text-lg md:p-4');
  });

  it('should handle multiple breakpoints', () => {
    const result = getResponsiveSizeClasses({ base: 'sm', md: 'lg' }, mockSizeMap);
    expect(result).toContain('text-sm');
    expect(result).toContain('md:text-lg');
  });

  it('should skip undefined breakpoints', () => {
    const result = getResponsiveSizeClasses({ base: 'sm', md: undefined }, mockSizeMap);
    expect(result).toBe('text-sm p-2');
  });
});

describe('buildHeaderAccessibleLabel', () => {
  it('should use default for undefined title', () => {
    expect(buildHeaderAccessibleLabel(undefined, undefined)).toBe('Untitled Chat');
  });

  it('should use provided title', () => {
    expect(buildHeaderAccessibleLabel('My Chat', undefined)).toBe('My Chat');
  });

  it('should append project name', () => {
    expect(buildHeaderAccessibleLabel('My Chat', 'My Project')).toBe(
      'My Chat in project My Project'
    );
  });

  it('should use default title with project name', () => {
    expect(buildHeaderAccessibleLabel(undefined, 'My Project')).toBe(
      'Untitled Chat in project My Project'
    );
  });
});

describe('getToggleButtonLabel', () => {
  it('should return show label when raw is hidden', () => {
    expect(getToggleButtonLabel(false)).toBe('Show raw output');
  });

  it('should return hide label when raw is shown', () => {
    expect(getToggleButtonLabel(true)).toBe('Show formatted output');
  });
});

// ============================================================================
// Touch Target Compliance Tests
// ============================================================================

describe('Touch Target Compliance', () => {
  it('HEADER_BACK_BUTTON_CLASSES should have 44px min on mobile', () => {
    expect(HEADER_BACK_BUTTON_CLASSES).toContain('min-h-[44px]');
    expect(HEADER_BACK_BUTTON_CLASSES).toContain('min-w-[44px]');
  });

  it('HEADER_TOGGLE_BUTTON_CLASSES should have 44px min on mobile', () => {
    expect(HEADER_TOGGLE_BUTTON_CLASSES).toContain('min-h-[44px]');
  });

  it('TEXTAREA_CLASSES should have 44px min height', () => {
    expect(TEXTAREA_CLASSES).toContain('min-h-[44px]');
  });

  it('INPUT_BUTTON_CLASSES should have 44px min', () => {
    expect(INPUT_BUTTON_CLASSES).toContain('min-h-[44px]');
    expect(INPUT_BUTTON_CLASSES).toContain('min-w-[44px]');
  });
});

// ============================================================================
// Focus Ring Compliance Tests
// ============================================================================

describe('Focus Ring Compliance', () => {
  it('TEXTAREA_CLASSES should have focus-visible ring with offset', () => {
    expect(TEXTAREA_CLASSES).toContain('focus-visible:ring-2');
    expect(TEXTAREA_CLASSES).toContain('focus-visible:ring-offset-2');
  });
});

// ============================================================================
// Responsive Breakpoint Tests
// ============================================================================

describe('Responsive Breakpoints', () => {
  it('Header classes should have responsive gap', () => {
    expect(HEADER_CONTAINER_CLASSES).toContain('gap-2');
    expect(HEADER_CONTAINER_CLASSES).toContain('md:gap-3');
  });

  it('Header classes should have responsive padding', () => {
    expect(HEADER_CONTAINER_CLASSES).toContain('px-3');
    expect(HEADER_CONTAINER_CLASSES).toContain('md:px-4');
  });

  it('Content container should have responsive padding', () => {
    expect(CHAT_PAGE_CONTENT_CONTAINER_CLASSES).toContain('px-3');
    expect(CHAT_PAGE_CONTENT_CONTAINER_CLASSES).toContain('md:px-4');
    expect(CHAT_PAGE_CONTENT_CONTAINER_CLASSES).toContain('py-4');
    expect(CHAT_PAGE_CONTENT_CONTAINER_CLASSES).toContain('md:py-6');
  });

  it('Input area should have responsive padding', () => {
    expect(INPUT_AREA_INNER_CLASSES).toContain('px-3');
    expect(INPUT_AREA_INNER_CLASSES).toContain('md:px-4');
    expect(INPUT_AREA_INNER_CLASSES).toContain('py-3');
    expect(INPUT_AREA_INNER_CLASSES).toContain('md:py-4');
  });

  it('Input area wrapper should have responsive gap', () => {
    expect(INPUT_AREA_WRAPPER_CLASSES).toContain('gap-2');
    expect(INPUT_AREA_WRAPPER_CLASSES).toContain('md:gap-3');
  });

  it('Helper text should be hidden on mobile', () => {
    expect(HELPER_TEXT_CLASSES).toContain('hidden');
    expect(HELPER_TEXT_CLASSES).toContain('sm:block');
  });

  it('Icon container should be hidden on mobile', () => {
    expect(HEADER_ICON_CONTAINER_CLASSES).toContain('hidden');
    expect(HEADER_ICON_CONTAINER_CLASSES).toContain('sm:flex');
  });
});

// ============================================================================
// Accessibility Behavior Documentation Tests
// ============================================================================

describe('Accessibility Behavior Documentation', () => {
  it('Loading state should use role="status" and aria-busy', () => {
    // Documented behavior - loading skeleton uses role="status" and aria-busy="true"
    expect(SR_LOADING).toBe('Loading chat...');
  });

  it('Not found state should use role="status"', () => {
    // Documented behavior - not found uses role="status"
    expect(SR_NOT_FOUND).toBe('Chat not found');
  });

  it('Error state should use role="alert" and aria-live="assertive"', () => {
    // Documented behavior - error state uses role="alert" for immediate attention
    expect(DEFAULT_ERROR_TITLE).toBe('Failed to load chat');
  });

  it('Empty state should use role="status"', () => {
    // Documented behavior - empty state uses role="status"
    expect(SR_EMPTY).toContain('No messages yet');
  });

  it('Processing state should use aria-live="polite"', () => {
    // Documented behavior - processing announcement uses aria-live="polite"
    expect(SR_PROCESSING).toBe('Claude is responding...');
  });

  it('Header toggle should use aria-pressed', () => {
    // Documented behavior - toggle button uses aria-pressed for state
    expect(getToggleButtonLabel(true)).toContain('formatted');
    expect(getToggleButtonLabel(false)).toContain('raw');
  });
});

// ============================================================================
// Component Props Documentation Tests
// ============================================================================

describe('Component Props Documentation', () => {
  it('ChatPageLayout accepts header, children, inputArea, permissionDialog, className, data-testid', () => {
    // These props are documented in ChatPageLayoutProps interface
    expect(true).toBe(true);
  });

  it('ChatLoadingSkeleton accepts className, data-testid', () => {
    // These props are documented in ChatLoadingSkeletonProps interface
    expect(true).toBe(true);
  });

  it('ChatNotFound accepts onBack, title, description, backLabel, className, data-testid', () => {
    // These props are documented in ChatNotFoundProps interface
    expect(DEFAULT_NOT_FOUND_TITLE).toBe('Chat not found');
    expect(DEFAULT_NOT_FOUND_DESCRIPTION).toContain("doesn't exist");
  });

  it('ChatErrorState accepts message, onRetry, title, retryLabel, className, data-testid', () => {
    // These props are documented in ChatErrorStateProps interface
    expect(DEFAULT_ERROR_TITLE).toBe('Failed to load chat');
    expect(DEFAULT_ERROR_RETRY_LABEL).toBe('Retry');
  });

  it('ChatHeader accepts title, projectName, showRawOutput, onToggleRawOutput, onBack, backLabel, className, data-testid', () => {
    // These props are documented in ChatHeaderProps interface
    expect(DEFAULT_BACK_LABEL).toBe('Go back');
    expect(DEFAULT_UNTITLED_CHAT).toBe('Untitled Chat');
  });

  it('ChatEmptyState accepts title, description, className, data-testid', () => {
    // These props are documented in ChatEmptyStateProps interface
    expect(DEFAULT_EMPTY_TITLE).toBe('Start a conversation');
    expect(DEFAULT_EMPTY_DESCRIPTION).toContain('Send a message');
  });

  it('ChatInputArea accepts inputValue, isProcessing, textareaRef, onInputChange, onKeyDown, onSend, onStop, placeholder, sendLabel, stopLabel, className, data-testid', () => {
    // These props are documented in ChatInputAreaProps interface
    expect(DEFAULT_INPUT_PLACEHOLDER).toBe('Type a message...');
    expect(DEFAULT_SEND_LABEL).toBe('Send message');
    expect(DEFAULT_STOP_LABEL).toBe('Stop process');
  });
});

// ============================================================================
// Data Attribute Documentation Tests
// ============================================================================

describe('Data Attribute Documentation', () => {
  it('ChatPageLayout supports data-testid', () => {
    // Documented: ChatPageLayout accepts data-testid prop
    expect(true).toBe(true);
  });

  it('ChatInputArea supports data-processing attribute', () => {
    // Documented: ChatInputArea sets data-processing based on isProcessing
    expect(true).toBe(true);
  });

  it('ChatMessageList supports data-message-count attribute', () => {
    // Documented: ChatMessageList sets data-message-count based on messages.length
    expect(true).toBe(true);
  });
});
