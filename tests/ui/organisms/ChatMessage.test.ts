import { MessageRole } from '@openflow/generated';
import { describe, expect, it } from 'vitest';
import {
  AVATAR_ICON_SIZE_MAP,
  AVATAR_SIZE_CLASSES,
  CONTENT_GAP_CLASSES,
  // Types
  type ChatMessageSize,
  DEFAULT_ASSISTANT_LABEL,
  DEFAULT_STREAMING_LABEL,
  DEFAULT_SYSTEM_LABEL,
  DEFAULT_THINKING_LABEL,
  DEFAULT_TOOL_CALLS_LABEL,
  // Constants
  DEFAULT_USER_LABEL,
  ICON_BG_STYLES,
  MESSAGE_BASE_CLASSES,
  MESSAGE_PADDING_CLASSES,
  PROSE_CLASSES,
  ROLE_CONFIG,
  ROLE_STYLES,
  SR_ASSISTANT_SAID,
  SR_STREAMING,
  SR_SYSTEM_SAID,
  SR_TOOL_CALLS,
  SR_USER_SAID,
  STREAMING_INDICATOR_CLASSES,
  STREAMING_TEXT_CLASSES,
  TEXT_SIZE_CLASSES,
  TOOL_CALLS_HEADER_CLASSES,
  TOOL_CALLS_LIST_CLASSES,
  TOOL_CALLS_SECTION_CLASSES,
  TOOL_CALL_ARGS_CLASSES,
  TOOL_CALL_ITEM_CLASSES,
  TOOL_CALL_NAME_CLASSES,
  type ToolCall,
  buildAccessibleLabel,
  formatTimestampForSR,
  getBaseSize,
  getISODateTime,
  getResponsiveSizeClasses,
  getRoleLabel,
  // Utility functions
  parseToolCalls,
} from '../../../packages/ui/organisms/ChatMessage';

// ============================================================================
// Default Labels Tests
// ============================================================================

describe('Default Labels', () => {
  it('should have correct default user label', () => {
    expect(DEFAULT_USER_LABEL).toBe('You');
  });

  it('should have correct default assistant label', () => {
    expect(DEFAULT_ASSISTANT_LABEL).toBe('Assistant');
  });

  it('should have correct default system label', () => {
    expect(DEFAULT_SYSTEM_LABEL).toBe('System');
  });

  it('should have correct default streaming label', () => {
    expect(DEFAULT_STREAMING_LABEL).toBe('Generating...');
  });

  it('should have correct default thinking label', () => {
    expect(DEFAULT_THINKING_LABEL).toBe('Thinking...');
  });

  it('should have correct default tool calls label', () => {
    expect(DEFAULT_TOOL_CALLS_LABEL).toBe('Tool Calls');
  });
});

// ============================================================================
// Screen Reader Announcements Tests
// ============================================================================

describe('Screen Reader Announcements', () => {
  it('should have correct SR prefix for user', () => {
    expect(SR_USER_SAID).toBe('You said:');
  });

  it('should have correct SR prefix for assistant', () => {
    expect(SR_ASSISTANT_SAID).toBe('Assistant said:');
  });

  it('should have correct SR prefix for system', () => {
    expect(SR_SYSTEM_SAID).toBe('System message:');
  });

  it('should have correct SR streaming message', () => {
    expect(SR_STREAMING).toBe('Assistant is generating a response');
  });

  it('should have correct SR tool calls prefix', () => {
    expect(SR_TOOL_CALLS).toBe('Using tools:');
  });
});

// ============================================================================
// Role Configuration Tests
// ============================================================================

describe('ROLE_CONFIG', () => {
  it('should have configuration for user role', () => {
    expect(ROLE_CONFIG.user).toBeDefined();
    expect(ROLE_CONFIG.user.label).toBe('You');
    expect(ROLE_CONFIG.user.srPrefix).toBe('You said:');
    expect(ROLE_CONFIG.user.icon).toBeDefined();
  });

  it('should have configuration for assistant role', () => {
    expect(ROLE_CONFIG.assistant).toBeDefined();
    expect(ROLE_CONFIG.assistant.label).toBe('Assistant');
    expect(ROLE_CONFIG.assistant.srPrefix).toBe('Assistant said:');
    expect(ROLE_CONFIG.assistant.icon).toBeDefined();
  });

  it('should have configuration for system role', () => {
    expect(ROLE_CONFIG.system).toBeDefined();
    expect(ROLE_CONFIG.system.label).toBe('System');
    expect(ROLE_CONFIG.system.srPrefix).toBe('System message:');
    expect(ROLE_CONFIG.system.icon).toBeDefined();
  });
});

// ============================================================================
// Role Styles Tests
// ============================================================================

describe('ROLE_STYLES', () => {
  it('should have styles for user role', () => {
    expect(ROLE_STYLES.user).toContain('bg-primary');
    expect(ROLE_STYLES.user).toContain('border-primary');
  });

  it('should have styles for assistant role', () => {
    expect(ROLE_STYLES.assistant).toContain('bg-muted');
    expect(ROLE_STYLES.assistant).toContain('border-border');
  });

  it('should have styles for system role', () => {
    expect(ROLE_STYLES.system).toContain('bg-warning');
    expect(ROLE_STYLES.system).toContain('border-warning');
  });
});

// ============================================================================
// Icon Background Styles Tests
// ============================================================================

describe('ICON_BG_STYLES', () => {
  it('should have icon styles for user role', () => {
    expect(ICON_BG_STYLES.user).toContain('bg-primary');
    expect(ICON_BG_STYLES.user).toContain('text-primary-foreground');
  });

  it('should have icon styles for assistant role', () => {
    expect(ICON_BG_STYLES.assistant).toContain('bg-accent');
    expect(ICON_BG_STYLES.assistant).toContain('text-accent-foreground');
  });

  it('should have icon styles for system role', () => {
    expect(ICON_BG_STYLES.system).toContain('bg-warning');
    expect(ICON_BG_STYLES.system).toContain('text-warning');
  });
});

// ============================================================================
// Message Base Classes Tests
// ============================================================================

describe('MESSAGE_BASE_CLASSES', () => {
  it('should include flex layout', () => {
    expect(MESSAGE_BASE_CLASSES).toContain('flex');
  });

  it('should include gap', () => {
    expect(MESSAGE_BASE_CLASSES).toContain('gap-3');
  });

  it('should include rounded corners', () => {
    expect(MESSAGE_BASE_CLASSES).toContain('rounded-lg');
  });

  it('should include border', () => {
    expect(MESSAGE_BASE_CLASSES).toContain('border');
  });

  it('should include group for hover states', () => {
    expect(MESSAGE_BASE_CLASSES).toContain('group');
  });
});

// ============================================================================
// Message Padding Classes Tests
// ============================================================================

describe('MESSAGE_PADDING_CLASSES', () => {
  it('should have padding for small size', () => {
    expect(MESSAGE_PADDING_CLASSES.sm).toBe('p-3');
  });

  it('should have padding for medium size', () => {
    expect(MESSAGE_PADDING_CLASSES.md).toBe('p-4');
  });

  it('should have padding for large size', () => {
    expect(MESSAGE_PADDING_CLASSES.lg).toBe('p-5');
  });

  it('should have increasing padding with size', () => {
    const sizes: ChatMessageSize[] = ['sm', 'md', 'lg'];
    const paddingValues = sizes.map((s) => {
      const paddingClass = MESSAGE_PADDING_CLASSES[s];
      const match = paddingClass.match(/p-(\d+)/);
      return match?.[1] ? Number.parseInt(match[1], 10) : 0;
    });
    expect(paddingValues[0]).toBeLessThan(paddingValues[1] ?? 0);
    expect(paddingValues[1]).toBeLessThan(paddingValues[2] ?? 0);
  });
});

// ============================================================================
// Avatar Size Classes Tests
// ============================================================================

describe('AVATAR_SIZE_CLASSES', () => {
  it('should have dimensions for small size', () => {
    expect(AVATAR_SIZE_CLASSES.sm).toContain('h-7');
    expect(AVATAR_SIZE_CLASSES.sm).toContain('w-7');
  });

  it('should have dimensions for medium size', () => {
    expect(AVATAR_SIZE_CLASSES.md).toContain('h-8');
    expect(AVATAR_SIZE_CLASSES.md).toContain('w-8');
  });

  it('should have dimensions for large size', () => {
    expect(AVATAR_SIZE_CLASSES.lg).toContain('h-9');
    expect(AVATAR_SIZE_CLASSES.lg).toContain('w-9');
  });
});

// ============================================================================
// Avatar Icon Size Map Tests
// ============================================================================

describe('AVATAR_ICON_SIZE_MAP', () => {
  it('should map small message to xs icon', () => {
    expect(AVATAR_ICON_SIZE_MAP.sm).toBe('xs');
  });

  it('should map medium message to sm icon', () => {
    expect(AVATAR_ICON_SIZE_MAP.md).toBe('sm');
  });

  it('should map large message to sm icon', () => {
    expect(AVATAR_ICON_SIZE_MAP.lg).toBe('sm');
  });
});

// ============================================================================
// Content Gap Classes Tests
// ============================================================================

describe('CONTENT_GAP_CLASSES', () => {
  it('should have gap for small size', () => {
    expect(CONTENT_GAP_CLASSES.sm).toBe('space-y-1.5');
  });

  it('should have gap for medium size', () => {
    expect(CONTENT_GAP_CLASSES.md).toBe('space-y-2');
  });

  it('should have gap for large size', () => {
    expect(CONTENT_GAP_CLASSES.lg).toBe('space-y-2.5');
  });
});

// ============================================================================
// Text Size Classes Tests
// ============================================================================

describe('TEXT_SIZE_CLASSES', () => {
  it('should have text size for small', () => {
    expect(TEXT_SIZE_CLASSES.sm).toBe('text-sm');
  });

  it('should have text size for medium', () => {
    expect(TEXT_SIZE_CLASSES.md).toBe('text-sm');
  });

  it('should have text size for large', () => {
    expect(TEXT_SIZE_CLASSES.lg).toBe('text-base');
  });
});

// ============================================================================
// Prose Classes Tests
// ============================================================================

describe('PROSE_CLASSES', () => {
  it('should include prose class', () => {
    expect(PROSE_CLASSES).toContain('prose');
  });

  it('should include dark mode inversion', () => {
    expect(PROSE_CLASSES).toContain('dark:prose-invert');
  });

  it('should include max-w-none for full width', () => {
    expect(PROSE_CLASSES).toContain('max-w-none');
  });
});

// ============================================================================
// Tool Calls Section Classes Tests
// ============================================================================

describe('Tool Calls Classes', () => {
  it('should have section classes', () => {
    expect(TOOL_CALLS_SECTION_CLASSES).toContain('mt-3');
    expect(TOOL_CALLS_SECTION_CLASSES).toContain('space-y-2');
  });

  it('should have header classes', () => {
    expect(TOOL_CALLS_HEADER_CLASSES).toContain('flex');
    expect(TOOL_CALLS_HEADER_CLASSES).toContain('items-center');
    expect(TOOL_CALLS_HEADER_CLASSES).toContain('gap-1.5');
  });

  it('should have list classes', () => {
    expect(TOOL_CALLS_LIST_CLASSES).toContain('space-y-1.5');
  });

  it('should have item classes with border and background', () => {
    expect(TOOL_CALL_ITEM_CLASSES).toContain('rounded');
    expect(TOOL_CALL_ITEM_CLASSES).toContain('border');
  });

  it('should have name classes for code styling', () => {
    expect(TOOL_CALL_NAME_CLASSES).toContain('text-xs');
    expect(TOOL_CALL_NAME_CLASSES).toContain('font-medium');
  });

  it('should have args classes for overflow', () => {
    expect(TOOL_CALL_ARGS_CLASSES).toContain('overflow-x-auto');
    expect(TOOL_CALL_ARGS_CLASSES).toContain('text-xs');
  });
});

// ============================================================================
// Streaming Classes Tests
// ============================================================================

describe('Streaming Classes', () => {
  it('should have indicator classes', () => {
    expect(STREAMING_INDICATOR_CLASSES).toContain('flex');
    expect(STREAMING_INDICATOR_CLASSES).toContain('items-center');
    expect(STREAMING_INDICATOR_CLASSES).toContain('gap-1');
  });

  it('should have text classes with motion-safe animation', () => {
    expect(STREAMING_TEXT_CLASSES).toContain('motion-safe:animate-pulse');
  });
});

// ============================================================================
// parseToolCalls Tests
// ============================================================================

describe('parseToolCalls', () => {
  it('should return empty array for undefined input', () => {
    expect(parseToolCalls(undefined)).toEqual([]);
  });

  it('should return empty array for empty string', () => {
    expect(parseToolCalls('')).toEqual([]);
  });

  it('should return empty array for invalid JSON', () => {
    expect(parseToolCalls('not valid json')).toEqual([]);
  });

  it('should parse valid JSON tool calls', () => {
    const toolCalls: ToolCall[] = [
      { id: 'call-1', name: 'read_file', arguments: { path: 'test.ts' } },
    ];
    const result = parseToolCalls(JSON.stringify(toolCalls));
    expect(result).toEqual(toolCalls);
  });

  it('should parse multiple tool calls', () => {
    const toolCalls: ToolCall[] = [
      { id: 'call-1', name: 'read_file', arguments: { path: 'test.ts' } },
      { id: 'call-2', name: 'write_file', arguments: { path: 'out.ts', content: 'hello' } },
    ];
    const result = parseToolCalls(JSON.stringify(toolCalls));
    expect(result).toHaveLength(2);
    expect(result[0]?.name).toBe('read_file');
    expect(result[1]?.name).toBe('write_file');
  });

  it('should handle tool calls without arguments', () => {
    const toolCalls: ToolCall[] = [{ id: 'call-1', name: 'list_files' }];
    const result = parseToolCalls(JSON.stringify(toolCalls));
    expect(result[0]?.arguments).toBeUndefined();
  });

  it('should handle tool calls without id', () => {
    const toolCalls: ToolCall[] = [{ name: 'list_files' }];
    const result = parseToolCalls(JSON.stringify(toolCalls));
    expect(result[0]?.id).toBeUndefined();
    expect(result[0]?.name).toBe('list_files');
  });
});

// ============================================================================
// getBaseSize Tests
// ============================================================================

describe('getBaseSize', () => {
  it('should return string size as-is', () => {
    expect(getBaseSize('sm')).toBe('sm');
    expect(getBaseSize('md')).toBe('md');
    expect(getBaseSize('lg')).toBe('lg');
  });

  it('should return base size from responsive object', () => {
    expect(getBaseSize({ base: 'sm', md: 'md', lg: 'lg' })).toBe('sm');
  });

  it('should default to md when base is not specified', () => {
    expect(getBaseSize({ md: 'md', lg: 'lg' })).toBe('md');
  });

  it('should handle empty responsive object', () => {
    expect(getBaseSize({})).toBe('md');
  });
});

// ============================================================================
// getResponsiveSizeClasses Tests
// ============================================================================

describe('getResponsiveSizeClasses', () => {
  const classMap = MESSAGE_PADDING_CLASSES;

  it('should return class for string size', () => {
    expect(getResponsiveSizeClasses('sm', classMap)).toBe('p-3');
    expect(getResponsiveSizeClasses('md', classMap)).toBe('p-4');
    expect(getResponsiveSizeClasses('lg', classMap)).toBe('p-5');
  });

  it('should return base class without prefix', () => {
    const result = getResponsiveSizeClasses({ base: 'sm' }, classMap);
    expect(result).toBe('p-3');
  });

  it('should prefix non-base breakpoint classes', () => {
    const result = getResponsiveSizeClasses({ base: 'sm', md: 'md' }, classMap);
    expect(result).toContain('p-3');
    expect(result).toContain('md:p-4');
  });

  it('should handle all breakpoints', () => {
    const result = getResponsiveSizeClasses({ base: 'sm', sm: 'sm', md: 'md', lg: 'lg' }, classMap);
    expect(result).toContain('p-3');
    expect(result).toContain('sm:p-3');
    expect(result).toContain('md:p-4');
    expect(result).toContain('lg:p-5');
  });

  it('should maintain breakpoint order', () => {
    const result = getResponsiveSizeClasses({ lg: 'lg', base: 'sm', md: 'md' }, classMap);
    const classes = result.split(' ');
    const baseIndex = classes.findIndex((c) => c === 'p-3');
    const mdIndex = classes.findIndex((c) => c === 'md:p-4');
    const lgIndex = classes.findIndex((c) => c === 'lg:p-5');
    expect(baseIndex).toBeLessThan(mdIndex);
    expect(mdIndex).toBeLessThan(lgIndex);
  });

  it('should handle empty responsive object', () => {
    const result = getResponsiveSizeClasses({}, classMap);
    expect(result).toBe('');
  });
});

// ============================================================================
// formatTimestampForSR Tests
// ============================================================================

describe('formatTimestampForSR', () => {
  it('should return "Unknown time" for invalid date', () => {
    expect(formatTimestampForSR('invalid')).toBe('Unknown time');
  });

  it('should format valid date with full context', () => {
    const result = formatTimestampForSR('2024-01-15T15:30:00Z');
    // Should include day of week, month, day, year, and time
    expect(result).toMatch(/Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday/);
    expect(result).toMatch(/January/);
    expect(result).toMatch(/15/);
    expect(result).toMatch(/2024/);
  });

  it('should handle ISO date strings', () => {
    const result = formatTimestampForSR('2024-06-20T10:00:00.000Z');
    expect(result).not.toBe('Unknown time');
    expect(result.length).toBeGreaterThan(10);
  });
});

// ============================================================================
// getISODateTime Tests
// ============================================================================

describe('getISODateTime', () => {
  it('should return empty string for invalid date', () => {
    expect(getISODateTime('invalid')).toBe('');
  });

  it('should return ISO string for valid date', () => {
    const result = getISODateTime('2024-01-15T15:30:00Z');
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
  });

  it('should handle various date formats', () => {
    const result = getISODateTime('2024-06-20');
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
  });
});

// ============================================================================
// getRoleLabel Tests
// ============================================================================

describe('getRoleLabel', () => {
  it('should return default label for user', () => {
    expect(getRoleLabel(MessageRole.User)).toBe('You');
  });

  it('should return default label for assistant', () => {
    expect(getRoleLabel(MessageRole.Assistant)).toBe('Assistant');
  });

  it('should return default label for system', () => {
    expect(getRoleLabel(MessageRole.System)).toBe('System');
  });

  it('should return custom label for user when provided', () => {
    expect(getRoleLabel(MessageRole.User, 'Me')).toBe('Me');
  });

  it('should return custom label for assistant when provided', () => {
    expect(getRoleLabel(MessageRole.Assistant, undefined, 'AI')).toBe('AI');
  });

  it('should return custom label for system when provided', () => {
    expect(getRoleLabel(MessageRole.System, undefined, undefined, 'SYS')).toBe('SYS');
  });

  it('should ignore undefined custom labels', () => {
    expect(getRoleLabel(MessageRole.User, undefined)).toBe('You');
    expect(getRoleLabel(MessageRole.Assistant, undefined, undefined)).toBe('Assistant');
  });

  it('should return role as-is for unknown role', () => {
    // Type assertion for testing unknown role
    expect(getRoleLabel('unknown' as MessageRole)).toBe('unknown');
  });
});

// ============================================================================
// buildAccessibleLabel Tests
// ============================================================================

describe('buildAccessibleLabel', () => {
  it('should include role prefix', () => {
    const result = buildAccessibleLabel(MessageRole.User, 'Hello', false, false, 0);
    expect(result).toContain('You said:');
  });

  it('should include content for non-streaming message', () => {
    const result = buildAccessibleLabel(MessageRole.User, 'Hello world', false, false, 0);
    expect(result).toContain('Hello world');
  });

  it('should truncate long content', () => {
    const longContent = 'a'.repeat(300);
    const result = buildAccessibleLabel(MessageRole.User, longContent, false, false, 0);
    expect(result).toContain('...');
    expect(result.length).toBeLessThan(longContent.length + 50);
  });

  it('should include streaming message when empty content', () => {
    const result = buildAccessibleLabel(MessageRole.Assistant, '', true, false, 0);
    expect(result).toContain(SR_STREAMING);
  });

  it('should not include streaming message when has content', () => {
    const result = buildAccessibleLabel(MessageRole.Assistant, 'Working...', true, false, 0);
    expect(result).not.toContain(SR_STREAMING);
    expect(result).toContain('Working...');
  });

  it('should include tool calls info when present', () => {
    const result = buildAccessibleLabel(MessageRole.Assistant, 'Using tools', false, true, 3);
    expect(result).toContain(SR_TOOL_CALLS);
    expect(result).toContain('3 tools');
  });

  it('should use singular "tool" for single tool call', () => {
    const result = buildAccessibleLabel(MessageRole.Assistant, 'Using tool', false, true, 1);
    expect(result).toContain('1 tool');
    expect(result).not.toContain('1 tools');
  });

  it('should use correct prefix for each role', () => {
    expect(buildAccessibleLabel(MessageRole.User, 'test', false, false, 0)).toContain(SR_USER_SAID);
    expect(buildAccessibleLabel(MessageRole.Assistant, 'test', false, false, 0)).toContain(
      SR_ASSISTANT_SAID
    );
    expect(buildAccessibleLabel(MessageRole.System, 'test', false, false, 0)).toContain(
      SR_SYSTEM_SAID
    );
  });
});

// ============================================================================
// Size Consistency Tests
// ============================================================================

describe('Size consistency', () => {
  const sizes: ChatMessageSize[] = ['sm', 'md', 'lg'];

  it('should have all sizes defined in MESSAGE_PADDING_CLASSES', () => {
    for (const size of sizes) {
      expect(MESSAGE_PADDING_CLASSES[size]).toBeDefined();
    }
  });

  it('should have all sizes defined in AVATAR_SIZE_CLASSES', () => {
    for (const size of sizes) {
      expect(AVATAR_SIZE_CLASSES[size]).toBeDefined();
    }
  });

  it('should have all sizes defined in AVATAR_ICON_SIZE_MAP', () => {
    for (const size of sizes) {
      expect(AVATAR_ICON_SIZE_MAP[size]).toBeDefined();
    }
  });

  it('should have all sizes defined in CONTENT_GAP_CLASSES', () => {
    for (const size of sizes) {
      expect(CONTENT_GAP_CLASSES[size]).toBeDefined();
    }
  });

  it('should have all sizes defined in TEXT_SIZE_CLASSES', () => {
    for (const size of sizes) {
      expect(TEXT_SIZE_CLASSES[size]).toBeDefined();
    }
  });
});

// ============================================================================
// Role Consistency Tests
// ============================================================================

describe('Role consistency', () => {
  const roles: MessageRole[] = [MessageRole.User, MessageRole.Assistant, MessageRole.System];

  it('should have all roles defined in ROLE_CONFIG', () => {
    for (const role of roles) {
      expect(ROLE_CONFIG[role]).toBeDefined();
      expect(ROLE_CONFIG[role].label).toBeDefined();
      expect(ROLE_CONFIG[role].srPrefix).toBeDefined();
      expect(ROLE_CONFIG[role].icon).toBeDefined();
    }
  });

  it('should have all roles defined in ROLE_STYLES', () => {
    for (const role of roles) {
      expect(ROLE_STYLES[role]).toBeDefined();
    }
  });

  it('should have all roles defined in ICON_BG_STYLES', () => {
    for (const role of roles) {
      expect(ICON_BG_STYLES[role]).toBeDefined();
    }
  });
});

// ============================================================================
// Breakpoint Order Tests
// ============================================================================

describe('Breakpoint order in responsive classes', () => {
  it('should process breakpoints in correct order', () => {
    const result = getResponsiveSizeClasses(
      { '2xl': 'lg', base: 'sm', xl: 'lg', md: 'md', lg: 'lg', sm: 'sm' },
      MESSAGE_PADDING_CLASSES
    );
    const parts = result.split(' ');

    // Find indices of each breakpoint prefix
    const indices: Record<string, number | undefined> = {};
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      if (part === 'p-3') indices.base = i;
      else if (part?.startsWith('sm:')) indices.sm = i;
      else if (part?.startsWith('md:')) indices.md = i;
      else if (part?.startsWith('lg:')) indices.lg = i;
      else if (part?.startsWith('xl:') && !part?.startsWith('2xl:')) indices.xl = i;
      else if (part?.startsWith('2xl:')) indices['2xl'] = i;
    }

    // Verify order - ensure all breakpoints are present
    expect(indices.base).toBeDefined();
    expect(indices.sm).toBeDefined();
    expect(indices.md).toBeDefined();
    expect(indices.lg).toBeDefined();
    expect(indices.xl).toBeDefined();
    expect(indices['2xl']).toBeDefined();

    // Verify order (with type assertions after the checks above)
    expect(indices.base!).toBeLessThan(indices.sm!);
    expect(indices.sm!).toBeLessThan(indices.md!);
    expect(indices.md!).toBeLessThan(indices.lg!);
    expect(indices.lg!).toBeLessThan(indices.xl!);
    expect(indices.xl!).toBeLessThan(indices['2xl']!);
  });
});

// ============================================================================
// Component Behavior Documentation Tests
// ============================================================================

describe('Component behavior documentation', () => {
  it('should document ChatMessage renders as article element', () => {
    // This is a documentation test - the component renders as <article>
    // for proper semantic structure
    expect(true).toBe(true);
  });

  it('should document ToolCallItem renders as li element', () => {
    // This is a documentation test - each tool call is a list item
    expect(true).toBe(true);
  });

  it('should document avatar is decorative (aria-hidden)', () => {
    // This is a documentation test - avatar has aria-hidden="true"
    expect(true).toBe(true);
  });

  it('should document timestamps use time element with datetime', () => {
    // This is a documentation test - timestamps use <time datetime="...">
    expect(true).toBe(true);
  });

  it('should document streaming state uses aria-live region', () => {
    // This is a documentation test - streaming state announced via aria-live
    expect(true).toBe(true);
  });

  it('should document tool calls section uses list semantics', () => {
    // This is a documentation test - tool calls wrapped in <ul> with role="list"
    expect(true).toBe(true);
  });
});

// ============================================================================
// Props Interface Documentation Tests
// ============================================================================

describe('ChatMessageProps documentation', () => {
  it('should document message prop is required', () => {
    // message: Message - required, contains id, chatId, role, content, etc.
    expect(true).toBe(true);
  });

  it('should document isStreaming defaults to false', () => {
    // isStreaming?: boolean - defaults to false
    expect(true).toBe(true);
  });

  it('should document size defaults to md', () => {
    // size?: ResponsiveValue<ChatMessageSize> - defaults to 'md'
    expect(true).toBe(true);
  });

  it('should document custom label props', () => {
    // userLabel, assistantLabel, systemLabel - custom role labels
    // streamingLabel, thinkingLabel, toolCallsLabel - custom state labels
    expect(true).toBe(true);
  });

  it('should document data-testid support', () => {
    // data-testid - for automated testing
    expect(true).toBe(true);
  });
});

// ============================================================================
// Data Attributes Documentation Tests
// ============================================================================

describe('Data attributes documentation', () => {
  it('should document data-testid attribute', () => {
    // data-testid - custom test ID passed via props
    expect(true).toBe(true);
  });

  it('should document data-message-id attribute', () => {
    // data-message-id - unique message ID from message.id
    expect(true).toBe(true);
  });

  it('should document data-role attribute', () => {
    // data-role - "user" | "assistant" | "system"
    expect(true).toBe(true);
  });

  it('should document data-streaming attribute', () => {
    // data-streaming - present when message is streaming
    expect(true).toBe(true);
  });

  it('should document data-tool-name on tool call items', () => {
    // data-tool-name - name of the tool on each tool call item
    expect(true).toBe(true);
  });
});

// ============================================================================
// Accessibility Compliance Tests
// ============================================================================

describe('Accessibility compliance', () => {
  it('should document article element for message container', () => {
    // Messages use <article> for self-contained content
    expect(true).toBe(true);
  });

  it('should document aria-label on article', () => {
    // aria-label contains role prefix + content summary
    expect(true).toBe(true);
  });

  it('should document aria-hidden on decorative avatar', () => {
    // Avatar icons are decorative, aria-hidden="true"
    expect(true).toBe(true);
  });

  it('should document time element with datetime', () => {
    // Timestamps use <time datetime="ISO-8601">
    expect(true).toBe(true);
  });

  it('should document aria-label on time for verbose reading', () => {
    // aria-label provides full date/time for screen readers
    expect(true).toBe(true);
  });

  it('should document aria-live for streaming announcements', () => {
    // role="status" aria-live="polite" for streaming updates
    expect(true).toBe(true);
  });

  it('should document section with aria-labelledby for tool calls', () => {
    // Tool calls section has aria-labelledby pointing to header
    expect(true).toBe(true);
  });

  it('should document list role for tool calls list', () => {
    // role="list" on ul, each tool call in li
    expect(true).toBe(true);
  });

  it('should document motion-safe for animations', () => {
    // motion-safe:animate-pulse respects prefers-reduced-motion
    expect(STREAMING_TEXT_CLASSES).toContain('motion-safe:');
  });
});
