import { Bot, Terminal } from 'lucide-react';
import { describe, expect, it } from 'vitest';
import {
  BUTTON_RESPONSIVE_CLASSES,
  DEFAULT_AGENT_HELPER_CLASSES,
  DEFAULT_AGENT_LABEL,
  DEFAULT_AGENT_PLACEHOLDER,
  DEFAULT_CANCEL_LABEL,
  DEFAULT_CREATE_LABEL,
  // Constants
  DEFAULT_DIALOG_TITLE,
  DEFAULT_LOADING_TEXT,
  DEFAULT_NO_AGENTS_MESSAGE,
  DEFAULT_OPTIONAL_TEXT,
  DEFAULT_PROJECT_LABEL,
  DEFAULT_PROJECT_PLACEHOLDER,
  DEFAULT_TITLE_LABEL,
  DEFAULT_TITLE_PLACEHOLDER,
  FOOTER_LAYOUT_CLASSES,
  FORM_FIELD_CONTAINER_CLASSES,
  FORM_FIELD_GAP_CLASSES,
  LABEL_SIZE_MAP,
  MAX_TITLE_LENGTH,
  NO_AGENTS_CONTAINER_CLASSES,
  PROJECT_INFO_CONTAINER_CLASSES,
  SIZE_TO_DIALOG_SIZE,
  SR_DEFAULT_AGENT_MESSAGE,
  SR_DIALOG_OPENED,
  SR_SUBMITTING,
  SR_VALIDATION_ERROR,
  buildFormAccessibleLabel,
  // Utility functions
  getBaseSize,
  getDialogSize,
  getExecutorIcon,
  getResponsiveFormGapClasses,
  getValidationState,
} from '../../../packages/ui/organisms/NewChatDialog';

// ============================================================================
// Constants Tests
// ============================================================================

describe('NewChatDialog Constants', () => {
  describe('Default Labels', () => {
    it('should have correct dialog title', () => {
      expect(DEFAULT_DIALOG_TITLE).toBe('New Chat');
    });

    it('should have correct create button label', () => {
      expect(DEFAULT_CREATE_LABEL).toBe('Create Chat');
    });

    it('should have correct cancel button label', () => {
      expect(DEFAULT_CANCEL_LABEL).toBe('Cancel');
    });

    it('should have correct loading text', () => {
      expect(DEFAULT_LOADING_TEXT).toBe('Creating...');
    });

    it('should have correct field labels', () => {
      expect(DEFAULT_PROJECT_LABEL).toBe('Project');
      expect(DEFAULT_AGENT_LABEL).toBe('Agent');
      expect(DEFAULT_TITLE_LABEL).toBe('Title');
    });

    it('should have correct optional text', () => {
      expect(DEFAULT_OPTIONAL_TEXT).toBe('(optional)');
    });

    it('should have correct placeholders', () => {
      expect(DEFAULT_PROJECT_PLACEHOLDER).toBe('Select a project...');
      expect(DEFAULT_AGENT_PLACEHOLDER).toBe('Select an agent...');
      expect(DEFAULT_TITLE_PLACEHOLDER).toBe('Chat title...');
    });

    it('should have correct no agents message', () => {
      expect(DEFAULT_NO_AGENTS_MESSAGE).toBe('No agents configured');
    });

    it('should have correct max title length', () => {
      expect(MAX_TITLE_LENGTH).toBe(500);
    });
  });

  describe('Screen Reader Announcements', () => {
    it('should have dialog opened announcement', () => {
      expect(SR_DIALOG_OPENED).toBe('New chat dialog opened. Select a project to create a chat.');
    });

    it('should have submitting announcement', () => {
      expect(SR_SUBMITTING).toBe('Creating chat, please wait...');
    });

    it('should have validation error announcement', () => {
      expect(SR_VALIDATION_ERROR).toBe('Please select a project to continue.');
    });

    it('should have default agent message', () => {
      expect(SR_DEFAULT_AGENT_MESSAGE).toBe('Will use default agent:');
    });
  });

  describe('Size Configuration', () => {
    it('should map sizes to dialog sizes correctly', () => {
      expect(SIZE_TO_DIALOG_SIZE).toEqual({
        sm: 'sm',
        md: 'md',
        lg: 'lg',
      });
    });

    it('should have form field gap classes for all sizes', () => {
      expect(FORM_FIELD_GAP_CLASSES.sm).toBe('space-y-3');
      expect(FORM_FIELD_GAP_CLASSES.md).toBe('space-y-4');
      expect(FORM_FIELD_GAP_CLASSES.lg).toBe('space-y-5');
    });

    it('should have label size map for all sizes', () => {
      expect(LABEL_SIZE_MAP.sm).toBe('xs');
      expect(LABEL_SIZE_MAP.md).toBe('sm');
      expect(LABEL_SIZE_MAP.lg).toBe('base');
    });
  });

  describe('Layout Classes', () => {
    it('should have form field container classes', () => {
      expect(FORM_FIELD_CONTAINER_CLASSES).toBe('space-y-2');
    });

    it('should have project info container classes', () => {
      expect(PROJECT_INFO_CONTAINER_CLASSES).toContain('flex');
      expect(PROJECT_INFO_CONTAINER_CLASSES).toContain('items-center');
      expect(PROJECT_INFO_CONTAINER_CLASSES).toContain('gap-2');
    });

    it('should have no agents container classes', () => {
      expect(NO_AGENTS_CONTAINER_CLASSES).toContain('flex');
      expect(NO_AGENTS_CONTAINER_CLASSES).toContain('items-center');
    });

    it('should have default agent helper classes', () => {
      expect(DEFAULT_AGENT_HELPER_CLASSES).toContain('text-xs');
    });

    it('should have footer layout classes for responsive stacking', () => {
      expect(FOOTER_LAYOUT_CLASSES).toContain('flex-col');
      expect(FOOTER_LAYOUT_CLASSES).toContain('sm:flex-row');
    });

    it('should have button responsive classes for full width on mobile', () => {
      expect(BUTTON_RESPONSIVE_CLASSES).toContain('w-full');
      expect(BUTTON_RESPONSIVE_CLASSES).toContain('sm:w-auto');
    });
  });
});

// ============================================================================
// Utility Function Tests
// ============================================================================

describe('getBaseSize', () => {
  it('should return md for undefined', () => {
    expect(getBaseSize(undefined)).toBe('md');
  });

  it('should return the string value directly', () => {
    expect(getBaseSize('sm')).toBe('sm');
    expect(getBaseSize('md')).toBe('md');
    expect(getBaseSize('lg')).toBe('lg');
  });

  it('should return base value from responsive object', () => {
    expect(getBaseSize({ base: 'sm', md: 'lg' })).toBe('sm');
  });

  it('should return md if base not specified in responsive object', () => {
    expect(getBaseSize({ md: 'lg' })).toBe('md');
  });

  it('should handle all breakpoint combinations', () => {
    expect(getBaseSize({ base: 'lg', sm: 'md', md: 'sm' })).toBe('lg');
  });
});

describe('getResponsiveFormGapClasses', () => {
  it('should return md gap classes for undefined', () => {
    expect(getResponsiveFormGapClasses(undefined)).toBe('space-y-4');
  });

  it('should return correct gap classes for string size', () => {
    expect(getResponsiveFormGapClasses('sm')).toBe('space-y-3');
    expect(getResponsiveFormGapClasses('md')).toBe('space-y-4');
    expect(getResponsiveFormGapClasses('lg')).toBe('space-y-5');
  });

  it('should generate responsive classes from object', () => {
    const result = getResponsiveFormGapClasses({ base: 'sm', md: 'lg' });
    expect(result).toContain('space-y-3');
    expect(result).toContain('md:space-y-5');
  });

  it('should handle all breakpoints', () => {
    const result = getResponsiveFormGapClasses({ base: 'sm', sm: 'md', lg: 'lg' });
    expect(result).toContain('space-y-3');
    expect(result).toContain('sm:space-y-4');
    expect(result).toContain('lg:space-y-5');
  });
});

describe('getDialogSize', () => {
  it('should return md for undefined', () => {
    expect(getDialogSize(undefined)).toBe('md');
  });

  it('should convert string size to dialog size', () => {
    expect(getDialogSize('sm')).toBe('sm');
    expect(getDialogSize('md')).toBe('md');
    expect(getDialogSize('lg')).toBe('lg');
  });

  it('should convert responsive object', () => {
    const result = getDialogSize({ base: 'sm', md: 'lg' });
    expect(result).toEqual({ base: 'sm', md: 'lg' });
  });

  it('should handle all breakpoints in responsive object', () => {
    const result = getDialogSize({ base: 'sm', sm: 'md', lg: 'lg', xl: 'lg' });
    expect(result).toEqual({ base: 'sm', sm: 'md', lg: 'lg', xl: 'lg' });
  });
});

describe('getValidationState', () => {
  it('should return invalid state when projectId is undefined', () => {
    const result = getValidationState(undefined);
    expect(result.isValid).toBe(false);
    expect(result.errorMessage).toBe(SR_VALIDATION_ERROR);
  });

  it('should return invalid state when projectId is empty string', () => {
    const result = getValidationState('');
    expect(result.isValid).toBe(false);
    expect(result.errorMessage).toBe(SR_VALIDATION_ERROR);
  });

  it('should return valid state when projectId is provided', () => {
    const result = getValidationState('project-1');
    expect(result.isValid).toBe(true);
    expect(result.errorMessage).toBeUndefined();
  });
});

describe('getExecutorIcon', () => {
  it('should return Bot icon for claude commands', () => {
    expect(getExecutorIcon('claude')).toBe(Bot);
    expect(getExecutorIcon('claude-code')).toBe(Bot);
    expect(getExecutorIcon('/usr/bin/claude')).toBe(Bot);
  });

  it('should return Terminal icon for non-claude commands', () => {
    expect(getExecutorIcon('gemini')).toBe(Terminal);
    expect(getExecutorIcon('codex')).toBe(Terminal);
    expect(getExecutorIcon('gpt')).toBe(Terminal);
  });
});

describe('buildFormAccessibleLabel', () => {
  it('should return base label when no selections', () => {
    expect(buildFormAccessibleLabel(undefined, undefined, '')).toBe('New chat form');
  });

  it('should include project name when selected', () => {
    const project = {
      id: '1',
      name: 'OpenFlow',
      gitRepoPath: '/path',
      baseBranch: 'main',
      setupScript: '',
      devScript: '',
      icon: 'folder',
      workflowsFolder: '',
      createdAt: '',
      updatedAt: '',
    };
    expect(buildFormAccessibleLabel(project, undefined, '')).toBe(
      'New chat form. Project: OpenFlow'
    );
  });

  it('should include agent name when selected', () => {
    const profile = {
      id: '1',
      name: 'Claude Code',
      description: '',
      command: 'claude',
      isDefault: true,
      createdAt: '',
      updatedAt: '',
    };
    expect(buildFormAccessibleLabel(undefined, profile, '')).toBe(
      'New chat form. Agent: Claude Code'
    );
  });

  it('should include title when provided', () => {
    expect(buildFormAccessibleLabel(undefined, undefined, 'My Chat')).toBe(
      'New chat form. Title: My Chat'
    );
  });

  it('should trim title whitespace', () => {
    expect(buildFormAccessibleLabel(undefined, undefined, '  My Chat  ')).toBe(
      'New chat form. Title: My Chat'
    );
  });

  it('should not include empty title', () => {
    expect(buildFormAccessibleLabel(undefined, undefined, '   ')).toBe('New chat form');
  });

  it('should include all parts when all selected', () => {
    const project = {
      id: '1',
      name: 'OpenFlow',
      gitRepoPath: '/path',
      baseBranch: 'main',
      setupScript: '',
      devScript: '',
      icon: 'folder',
      workflowsFolder: '',
      createdAt: '',
      updatedAt: '',
    };
    const profile = {
      id: '1',
      name: 'Claude Code',
      description: '',
      command: 'claude',
      isDefault: true,
      createdAt: '',
      updatedAt: '',
    };
    expect(buildFormAccessibleLabel(project, profile, 'My Chat')).toBe(
      'New chat form. Project: OpenFlow. Agent: Claude Code. Title: My Chat'
    );
  });
});

// ============================================================================
// Size Consistency Tests
// ============================================================================

describe('Size Consistency', () => {
  const sizes = ['sm', 'md', 'lg'] as const;

  it('should have all sizes in SIZE_TO_DIALOG_SIZE', () => {
    for (const size of sizes) {
      expect(SIZE_TO_DIALOG_SIZE[size]).toBeDefined();
    }
  });

  it('should have all sizes in FORM_FIELD_GAP_CLASSES', () => {
    for (const size of sizes) {
      expect(FORM_FIELD_GAP_CLASSES[size]).toBeDefined();
    }
  });

  it('should have all sizes in LABEL_SIZE_MAP', () => {
    for (const size of sizes) {
      expect(LABEL_SIZE_MAP[size]).toBeDefined();
    }
  });
});

// ============================================================================
// Accessibility Documentation Tests
// ============================================================================

describe('Accessibility Documentation', () => {
  it('should have screen reader announcements for key states', () => {
    expect(SR_DIALOG_OPENED).toBeTruthy();
    expect(SR_SUBMITTING).toBeTruthy();
    expect(SR_VALIDATION_ERROR).toBeTruthy();
    expect(SR_DEFAULT_AGENT_MESSAGE).toBeTruthy();
  });

  it('should have descriptive validation error message', () => {
    expect(SR_VALIDATION_ERROR).toContain('project');
    expect(SR_VALIDATION_ERROR.length).toBeGreaterThan(10);
  });

  it('should have informative dialog opened announcement', () => {
    expect(SR_DIALOG_OPENED).toContain('dialog');
    expect(SR_DIALOG_OPENED).toContain('project');
  });
});

// ============================================================================
// Component Behavior Documentation Tests
// ============================================================================

describe('Component Behavior Documentation', () => {
  it('should document default size as md', () => {
    expect(getBaseSize(undefined)).toBe('md');
  });

  it('should document that project selection is required', () => {
    expect(getValidationState(undefined).isValid).toBe(false);
    expect(getValidationState('project-id').isValid).toBe(true);
  });

  it('should document responsive footer layout', () => {
    expect(FOOTER_LAYOUT_CLASSES).toContain('flex-col');
    expect(FOOTER_LAYOUT_CLASSES).toContain('sm:flex-row');
  });

  it('should document button responsive behavior', () => {
    expect(BUTTON_RESPONSIVE_CLASSES).toContain('w-full');
    expect(BUTTON_RESPONSIVE_CLASSES).toContain('sm:w-auto');
  });
});

// ============================================================================
// Type Safety Tests
// ============================================================================

describe('Type Safety', () => {
  it('should handle type-safe size values', () => {
    const validSizes: Array<'sm' | 'md' | 'lg'> = ['sm', 'md', 'lg'];
    for (const size of validSizes) {
      expect(() => getBaseSize(size)).not.toThrow();
      expect(() => getResponsiveFormGapClasses(size)).not.toThrow();
      expect(() => getDialogSize(size)).not.toThrow();
    }
  });

  it('should handle responsive objects safely', () => {
    const responsiveValue = { base: 'sm' as const, md: 'lg' as const };
    expect(() => getBaseSize(responsiveValue)).not.toThrow();
    expect(() => getResponsiveFormGapClasses(responsiveValue)).not.toThrow();
    expect(() => getDialogSize(responsiveValue)).not.toThrow();
  });
});

// ============================================================================
// Integration Pattern Tests
// ============================================================================

describe('Integration Patterns', () => {
  it('should support form validation flow', () => {
    // Start invalid
    let state = getValidationState(undefined);
    expect(state.isValid).toBe(false);
    expect(state.errorMessage).toBeTruthy();

    // Select project - becomes valid
    state = getValidationState('project-1');
    expect(state.isValid).toBe(true);
    expect(state.errorMessage).toBeUndefined();
  });

  it('should support accessible label building', () => {
    // Build up label as form is filled
    let label = buildFormAccessibleLabel(undefined, undefined, '');
    expect(label).toBe('New chat form');

    const project = {
      id: '1',
      name: 'Test',
      gitRepoPath: '',
      baseBranch: '',
      setupScript: '',
      devScript: '',
      icon: '',
      workflowsFolder: '',
      createdAt: '',
      updatedAt: '',
    };
    label = buildFormAccessibleLabel(project, undefined, '');
    expect(label).toContain('Project: Test');

    label = buildFormAccessibleLabel(project, undefined, 'My Title');
    expect(label).toContain('Title: My Title');
  });

  it('should map executor commands to appropriate icons', () => {
    // Claude-based agents get Bot icon
    expect(getExecutorIcon('claude')).toBe(Bot);
    expect(getExecutorIcon('claude-code')).toBe(Bot);

    // Other agents get Terminal icon
    expect(getExecutorIcon('gemini')).toBe(Terminal);
    expect(getExecutorIcon('codex')).toBe(Terminal);
    expect(getExecutorIcon('custom-agent')).toBe(Terminal);
  });
});
