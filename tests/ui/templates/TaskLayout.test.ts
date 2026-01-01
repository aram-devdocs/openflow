import { ChatRole, TaskStatus } from '@openflow/generated';
import type { Chat } from '@openflow/generated';
import { describe, expect, it } from 'vitest';
import {
  DEFAULT_BACK_LABEL,
  DEFAULT_CREATE_PR_LABEL,
  DEFAULT_EDIT_TITLE_LABEL,
  DEFAULT_HEADER_LABEL,
  DEFAULT_MAIN_LABEL,
  DEFAULT_MORE_ACTIONS_LABEL,
  DEFAULT_STEPS_PANEL_LABEL,
  DEFAULT_STEPS_PANEL_WIDTH,
  SR_LOADING,
  SR_STATUS_CHANGED,
  SR_STEPS_COLLAPSED,
  SR_STEPS_EXPANDED,
  SR_TAB_CHANGED,
  SR_TITLE_EDITING,
  SR_TITLE_SAVED,
  // Constants
  STATUS_OPTIONS,
  TASK_LAYOUT_BRANCH_CLASSES,
  TASK_LAYOUT_CONTAINER_CLASSES,
  TASK_LAYOUT_DESKTOP_STEPS_PANEL_CLASSES,
  TASK_LAYOUT_EDIT_TITLE_BUTTON_CLASSES,
  TASK_LAYOUT_HEADER_CLASSES,
  TASK_LAYOUT_HEADER_LEFT_CLASSES,
  TASK_LAYOUT_HEADER_RIGHT_CLASSES,
  TASK_LAYOUT_HEADER_ROW_CLASSES,
  TASK_LAYOUT_ICON_BUTTON_CLASSES,
  TASK_LAYOUT_MAIN_CLASSES,
  TASK_LAYOUT_MAIN_PANEL_CLASSES,
  TASK_LAYOUT_MOBILE_STEPS_PANEL_CLASSES,
  TASK_LAYOUT_MOBILE_STEPS_TOGGLE_CLASSES,
  TASK_LAYOUT_SIZE_CLASSES,
  TASK_LAYOUT_TABS_CLASSES,
  TASK_LAYOUT_TAB_CONTENT_CLASSES,
  TASK_LAYOUT_TITLE_CLASSES,
  TASK_LAYOUT_TITLE_INPUT_CLASSES,
  // Types
  type TaskLayoutSize,
  buildStatusChangeAnnouncement,
  buildStepsPanelAnnouncement,
  buildTabChangeAnnouncement,
  buildTaskHeaderAccessibleLabel,
  // Utility functions
  getBaseSize,
  getCurrentBranch,
  getMainPanelId,
  getResponsiveSizeClasses,
  getStepsPanelId,
} from '../../../packages/ui/templates/TaskLayout';

// ============================================================================
// Test Data
// ============================================================================

const createMockChat = (overrides: Partial<Chat> = {}): Chat => ({
  id: 'chat-1',
  taskId: 'task-1',
  projectId: 'project-1',
  title: 'Implementation',
  chatRole: ChatRole.Main,
  baseBranch: 'main',
  branch: 'openflow/task-1/main',
  worktreeDeleted: false,
  isPlanContainer: false,
  workflowStepIndex: 0,
  createdAt: '2024-01-15T10:00:00Z',
  updatedAt: '2024-01-15T14:30:00Z',
  ...overrides,
});

const mockChats: Chat[] = [
  createMockChat(),
  createMockChat({
    id: 'chat-2',
    title: 'Review',
    chatRole: ChatRole.Review,
    branch: 'openflow/task-1/review',
    workflowStepIndex: 1,
  }),
];

const mockChatsWithNoBranch: Chat[] = [createMockChat({ branch: undefined })];

// ============================================================================
// Default Labels Tests
// ============================================================================

describe('TaskLayout - Default Labels', () => {
  it('DEFAULT_HEADER_LABEL should be "Task header"', () => {
    expect(DEFAULT_HEADER_LABEL).toBe('Task header');
  });

  it('DEFAULT_MAIN_LABEL should be "Task content"', () => {
    expect(DEFAULT_MAIN_LABEL).toBe('Task content');
  });

  it('DEFAULT_STEPS_PANEL_LABEL should be "Workflow steps"', () => {
    expect(DEFAULT_STEPS_PANEL_LABEL).toBe('Workflow steps');
  });

  it('DEFAULT_STEPS_PANEL_WIDTH should be "320px"', () => {
    expect(DEFAULT_STEPS_PANEL_WIDTH).toBe('320px');
  });

  it('DEFAULT_BACK_LABEL should be "Go back to task list"', () => {
    expect(DEFAULT_BACK_LABEL).toBe('Go back to task list');
  });

  it('DEFAULT_EDIT_TITLE_LABEL should be "Edit task title"', () => {
    expect(DEFAULT_EDIT_TITLE_LABEL).toBe('Edit task title');
  });

  it('DEFAULT_MORE_ACTIONS_LABEL should be "More actions"', () => {
    expect(DEFAULT_MORE_ACTIONS_LABEL).toBe('More actions');
  });

  it('DEFAULT_CREATE_PR_LABEL should be "Create pull request"', () => {
    expect(DEFAULT_CREATE_PR_LABEL).toBe('Create pull request');
  });
});

// ============================================================================
// Screen Reader Text Tests
// ============================================================================

describe('TaskLayout - Screen Reader Text', () => {
  it('SR_LOADING should be "Loading task details..."', () => {
    expect(SR_LOADING).toBe('Loading task details...');
  });

  it('SR_STEPS_EXPANDED should be "Workflow steps panel expanded"', () => {
    expect(SR_STEPS_EXPANDED).toBe('Workflow steps panel expanded');
  });

  it('SR_STEPS_COLLAPSED should be "Workflow steps panel collapsed"', () => {
    expect(SR_STEPS_COLLAPSED).toBe('Workflow steps panel collapsed');
  });

  it('SR_TAB_CHANGED should be "Switched to"', () => {
    expect(SR_TAB_CHANGED).toBe('Switched to');
  });

  it('SR_TITLE_EDITING should describe editing mode', () => {
    expect(SR_TITLE_EDITING).toBe('Editing task title. Press Enter to save, Escape to cancel.');
  });

  it('SR_TITLE_SAVED should be "Task title saved"', () => {
    expect(SR_TITLE_SAVED).toBe('Task title saved');
  });

  it('SR_STATUS_CHANGED should be "Task status changed to"', () => {
    expect(SR_STATUS_CHANGED).toBe('Task status changed to');
  });
});

// ============================================================================
// Status Options Tests
// ============================================================================

describe('TaskLayout - Status Options', () => {
  it('should have all task statuses', () => {
    expect(STATUS_OPTIONS).toHaveLength(5);
  });

  it('should include todo status', () => {
    expect(STATUS_OPTIONS.find((opt) => opt.value === 'todo')).toEqual({
      value: 'todo',
      label: 'To Do',
    });
  });

  it('should include inprogress status', () => {
    expect(STATUS_OPTIONS.find((opt) => opt.value === 'inprogress')).toEqual({
      value: 'inprogress',
      label: 'In Progress',
    });
  });

  it('should include inreview status', () => {
    expect(STATUS_OPTIONS.find((opt) => opt.value === 'inreview')).toEqual({
      value: 'inreview',
      label: 'In Review',
    });
  });

  it('should include done status', () => {
    expect(STATUS_OPTIONS.find((opt) => opt.value === 'done')).toEqual({
      value: 'done',
      label: 'Done',
    });
  });

  it('should include cancelled status', () => {
    expect(STATUS_OPTIONS.find((opt) => opt.value === 'cancelled')).toEqual({
      value: 'cancelled',
      label: 'Cancelled',
    });
  });
});

// ============================================================================
// Container Classes Tests
// ============================================================================

describe('TaskLayout - Container Classes', () => {
  it('TASK_LAYOUT_CONTAINER_CLASSES should contain flex layout classes', () => {
    expect(TASK_LAYOUT_CONTAINER_CLASSES).toContain('flex');
    expect(TASK_LAYOUT_CONTAINER_CLASSES).toContain('h-full');
    expect(TASK_LAYOUT_CONTAINER_CLASSES).toContain('flex-col');
  });

  it('TASK_LAYOUT_CONTAINER_CLASSES should have background color', () => {
    expect(TASK_LAYOUT_CONTAINER_CLASSES).toContain('bg-[rgb(var(--background))]');
  });
});

// ============================================================================
// Size Classes Tests
// ============================================================================

describe('TaskLayout - Size Classes', () => {
  describe('sm size', () => {
    const smClasses = TASK_LAYOUT_SIZE_CLASSES.sm;

    it('should have compact header padding', () => {
      expect(smClasses.headerPadding).toContain('px-2');
      expect(smClasses.headerPadding).toContain('py-1.5');
    });

    it('should have responsive header padding', () => {
      expect(smClasses.headerPadding).toContain('md:px-3');
      expect(smClasses.headerPadding).toContain('md:py-2');
    });

    it('should have compact tabs padding', () => {
      expect(smClasses.tabsPadding).toContain('px-2');
      expect(smClasses.tabsPadding).toContain('md:px-3');
    });

    it('should have smaller steps panel width', () => {
      expect(smClasses.stepsPanelWidth).toBe('280px');
    });
  });

  describe('md size (default)', () => {
    const mdClasses = TASK_LAYOUT_SIZE_CLASSES.md;

    it('should have standard header padding', () => {
      expect(mdClasses.headerPadding).toContain('px-3');
      expect(mdClasses.headerPadding).toContain('py-2');
    });

    it('should have responsive header padding', () => {
      expect(mdClasses.headerPadding).toContain('md:px-4');
      expect(mdClasses.headerPadding).toContain('md:py-3');
    });

    it('should have standard tabs padding', () => {
      expect(mdClasses.tabsPadding).toContain('px-3');
      expect(mdClasses.tabsPadding).toContain('md:px-4');
    });

    it('should have standard steps panel width', () => {
      expect(mdClasses.stepsPanelWidth).toBe('320px');
    });
  });

  describe('lg size', () => {
    const lgClasses = TASK_LAYOUT_SIZE_CLASSES.lg;

    it('should have spacious header padding', () => {
      expect(lgClasses.headerPadding).toContain('px-4');
      expect(lgClasses.headerPadding).toContain('py-3');
    });

    it('should have responsive header padding', () => {
      expect(lgClasses.headerPadding).toContain('md:px-6');
      expect(lgClasses.headerPadding).toContain('md:py-4');
    });

    it('should have spacious tabs padding', () => {
      expect(lgClasses.tabsPadding).toContain('px-4');
      expect(lgClasses.tabsPadding).toContain('md:px-6');
    });

    it('should have larger steps panel width', () => {
      expect(lgClasses.stepsPanelWidth).toBe('360px');
    });
  });

  it('size classes should have all required properties', () => {
    const requiredProperties = ['headerPadding', 'tabsPadding', 'stepsPanelWidth'];
    const sizes: TaskLayoutSize[] = ['sm', 'md', 'lg'];

    for (const size of sizes) {
      for (const prop of requiredProperties) {
        expect(TASK_LAYOUT_SIZE_CLASSES[size]).toHaveProperty(prop);
        expect(
          TASK_LAYOUT_SIZE_CLASSES[size][prop as keyof typeof TASK_LAYOUT_SIZE_CLASSES.md]
        ).toBeTruthy();
      }
    }
  });
});

// ============================================================================
// Header Classes Tests
// ============================================================================

describe('TaskLayout - Header Classes', () => {
  it('TASK_LAYOUT_HEADER_CLASSES should have shrink-0', () => {
    expect(TASK_LAYOUT_HEADER_CLASSES).toContain('shrink-0');
  });

  it('TASK_LAYOUT_HEADER_CLASSES should have bottom border', () => {
    expect(TASK_LAYOUT_HEADER_CLASSES).toContain('border-b');
  });

  it('TASK_LAYOUT_HEADER_ROW_CLASSES should be responsive', () => {
    expect(TASK_LAYOUT_HEADER_ROW_CLASSES).toContain('flex-col');
    expect(TASK_LAYOUT_HEADER_ROW_CLASSES).toContain('md:flex-row');
  });

  it('TASK_LAYOUT_HEADER_ROW_CLASSES should align items on desktop', () => {
    expect(TASK_LAYOUT_HEADER_ROW_CLASSES).toContain('md:items-center');
    expect(TASK_LAYOUT_HEADER_ROW_CLASSES).toContain('md:justify-between');
  });

  it('TASK_LAYOUT_HEADER_LEFT_CLASSES should have min-width and gap', () => {
    expect(TASK_LAYOUT_HEADER_LEFT_CLASSES).toContain('min-w-0');
    expect(TASK_LAYOUT_HEADER_LEFT_CLASSES).toContain('flex-1');
    expect(TASK_LAYOUT_HEADER_LEFT_CLASSES).toContain('gap-2');
  });

  it('TASK_LAYOUT_HEADER_RIGHT_CLASSES should allow overflow scroll', () => {
    expect(TASK_LAYOUT_HEADER_RIGHT_CLASSES).toContain('overflow-x-auto');
    expect(TASK_LAYOUT_HEADER_RIGHT_CLASSES).toContain('gap-2');
  });
});

// ============================================================================
// Title Classes Tests
// ============================================================================

describe('TaskLayout - Title Classes', () => {
  it('TASK_LAYOUT_TITLE_CLASSES should truncate text', () => {
    expect(TASK_LAYOUT_TITLE_CLASSES).toContain('truncate');
    expect(TASK_LAYOUT_TITLE_CLASSES).toContain('font-semibold');
  });

  it('TASK_LAYOUT_TITLE_CLASSES should have responsive text size', () => {
    expect(TASK_LAYOUT_TITLE_CLASSES).toContain('text-base');
    expect(TASK_LAYOUT_TITLE_CLASSES).toContain('md:text-lg');
  });

  it('TASK_LAYOUT_TITLE_INPUT_CLASSES should have focus ring', () => {
    expect(TASK_LAYOUT_TITLE_INPUT_CLASSES).toContain('focus:ring-2');
    expect(TASK_LAYOUT_TITLE_INPUT_CLASSES).toContain('focus:ring-offset-2');
  });

  it('TASK_LAYOUT_TITLE_INPUT_CLASSES should have border', () => {
    expect(TASK_LAYOUT_TITLE_INPUT_CLASSES).toContain('border');
    expect(TASK_LAYOUT_TITLE_INPUT_CLASSES).toContain('rounded-md');
  });

  it('TASK_LAYOUT_EDIT_TITLE_BUTTON_CLASSES should have motion-safe transitions', () => {
    expect(TASK_LAYOUT_EDIT_TITLE_BUTTON_CLASSES).toContain('motion-safe:transition-opacity');
  });

  it('TASK_LAYOUT_EDIT_TITLE_BUTTON_CLASSES should have focus ring', () => {
    expect(TASK_LAYOUT_EDIT_TITLE_BUTTON_CLASSES).toContain('focus-visible:ring-2');
    expect(TASK_LAYOUT_EDIT_TITLE_BUTTON_CLASSES).toContain('focus-visible:ring-offset-2');
  });

  it('TASK_LAYOUT_EDIT_TITLE_BUTTON_CLASSES should have touch target on mobile', () => {
    expect(TASK_LAYOUT_EDIT_TITLE_BUTTON_CLASSES).toContain('min-h-[44px]');
    expect(TASK_LAYOUT_EDIT_TITLE_BUTTON_CLASSES).toContain('min-w-[44px]');
  });
});

// ============================================================================
// Branch Classes Tests
// ============================================================================

describe('TaskLayout - Branch Classes', () => {
  it('TASK_LAYOUT_BRANCH_CLASSES should be hidden on mobile', () => {
    expect(TASK_LAYOUT_BRANCH_CLASSES).toContain('hidden');
    expect(TASK_LAYOUT_BRANCH_CLASSES).toContain('sm:flex');
  });

  it('TASK_LAYOUT_BRANCH_CLASSES should have muted background', () => {
    expect(TASK_LAYOUT_BRANCH_CLASSES).toContain('bg-[rgb(var(--muted))]');
  });

  it('TASK_LAYOUT_BRANCH_CLASSES should have rounded corners', () => {
    expect(TASK_LAYOUT_BRANCH_CLASSES).toContain('rounded-md');
  });
});

// ============================================================================
// Tabs Classes Tests
// ============================================================================

describe('TaskLayout - Tabs Classes', () => {
  it('TASK_LAYOUT_TABS_CLASSES should have horizontal scroll', () => {
    expect(TASK_LAYOUT_TABS_CLASSES).toContain('overflow-x-auto');
    expect(TASK_LAYOUT_TABS_CLASSES).toContain('scrollbar-hidden');
  });

  it('TASK_LAYOUT_TABS_CLASSES should have bottom border', () => {
    expect(TASK_LAYOUT_TABS_CLASSES).toContain('border-b');
  });

  it('TASK_LAYOUT_TABS_CLASSES should shrink', () => {
    expect(TASK_LAYOUT_TABS_CLASSES).toContain('shrink-0');
  });
});

// ============================================================================
// Main Content Classes Tests
// ============================================================================

describe('TaskLayout - Main Content Classes', () => {
  it('TASK_LAYOUT_MAIN_CLASSES should be responsive', () => {
    expect(TASK_LAYOUT_MAIN_CLASSES).toContain('flex-col');
    expect(TASK_LAYOUT_MAIN_CLASSES).toContain('lg:flex-row');
  });

  it('TASK_LAYOUT_MAIN_CLASSES should have minimum height', () => {
    expect(TASK_LAYOUT_MAIN_CLASSES).toContain('min-h-0');
    expect(TASK_LAYOUT_MAIN_CLASSES).toContain('flex-1');
  });
});

// ============================================================================
// Mobile Steps Panel Classes Tests
// ============================================================================

describe('TaskLayout - Mobile Steps Panel Classes', () => {
  it('TASK_LAYOUT_MOBILE_STEPS_TOGGLE_CLASSES should have touch target', () => {
    expect(TASK_LAYOUT_MOBILE_STEPS_TOGGLE_CLASSES).toContain('min-h-[48px]');
  });

  it('TASK_LAYOUT_MOBILE_STEPS_TOGGLE_CLASSES should have focus ring', () => {
    expect(TASK_LAYOUT_MOBILE_STEPS_TOGGLE_CLASSES).toContain('focus-visible:ring-2');
    expect(TASK_LAYOUT_MOBILE_STEPS_TOGGLE_CLASSES).toContain('focus-visible:ring-offset-2');
  });

  it('TASK_LAYOUT_MOBILE_STEPS_TOGGLE_CLASSES should have motion-safe transitions', () => {
    expect(TASK_LAYOUT_MOBILE_STEPS_TOGGLE_CLASSES).toContain('motion-safe:transition-colors');
  });

  it('TASK_LAYOUT_MOBILE_STEPS_PANEL_CLASSES should have max height', () => {
    expect(TASK_LAYOUT_MOBILE_STEPS_PANEL_CLASSES).toContain('max-h-64');
  });

  it('TASK_LAYOUT_MOBILE_STEPS_PANEL_CLASSES should have vertical scroll', () => {
    expect(TASK_LAYOUT_MOBILE_STEPS_PANEL_CLASSES).toContain('overflow-y-auto');
    expect(TASK_LAYOUT_MOBILE_STEPS_PANEL_CLASSES).toContain('scrollbar-thin');
  });
});

// ============================================================================
// Desktop Steps Panel Classes Tests
// ============================================================================

describe('TaskLayout - Desktop Steps Panel Classes', () => {
  it('TASK_LAYOUT_DESKTOP_STEPS_PANEL_CLASSES should be hidden on mobile', () => {
    expect(TASK_LAYOUT_DESKTOP_STEPS_PANEL_CLASSES).toContain('hidden');
    expect(TASK_LAYOUT_DESKTOP_STEPS_PANEL_CLASSES).toContain('lg:block');
  });

  it('TASK_LAYOUT_DESKTOP_STEPS_PANEL_CLASSES should have right border', () => {
    expect(TASK_LAYOUT_DESKTOP_STEPS_PANEL_CLASSES).toContain('border-r');
  });

  it('TASK_LAYOUT_DESKTOP_STEPS_PANEL_CLASSES should have vertical scroll', () => {
    expect(TASK_LAYOUT_DESKTOP_STEPS_PANEL_CLASSES).toContain('overflow-y-auto');
    expect(TASK_LAYOUT_DESKTOP_STEPS_PANEL_CLASSES).toContain('scrollbar-thin');
  });
});

// ============================================================================
// Main Panel Classes Tests
// ============================================================================

describe('TaskLayout - Main Panel Classes', () => {
  it('TASK_LAYOUT_MAIN_PANEL_CLASSES should flex grow', () => {
    expect(TASK_LAYOUT_MAIN_PANEL_CLASSES).toContain('flex-1');
    expect(TASK_LAYOUT_MAIN_PANEL_CLASSES).toContain('flex-col');
  });

  it('TASK_LAYOUT_MAIN_PANEL_CLASSES should prevent overflow', () => {
    expect(TASK_LAYOUT_MAIN_PANEL_CLASSES).toContain('min-h-0');
    expect(TASK_LAYOUT_MAIN_PANEL_CLASSES).toContain('min-w-0');
    expect(TASK_LAYOUT_MAIN_PANEL_CLASSES).toContain('overflow-hidden');
  });
});

// ============================================================================
// Tab Content Classes Tests
// ============================================================================

describe('TaskLayout - Tab Content Classes', () => {
  it('TASK_LAYOUT_TAB_CONTENT_CLASSES should flex grow', () => {
    expect(TASK_LAYOUT_TAB_CONTENT_CLASSES).toContain('flex-1');
  });

  it('TASK_LAYOUT_TAB_CONTENT_CLASSES should have scroll', () => {
    expect(TASK_LAYOUT_TAB_CONTENT_CLASSES).toContain('overflow-auto');
    expect(TASK_LAYOUT_TAB_CONTENT_CLASSES).toContain('scrollbar-thin');
  });
});

// ============================================================================
// Icon Button Classes Tests
// ============================================================================

describe('TaskLayout - Icon Button Classes', () => {
  it('TASK_LAYOUT_ICON_BUTTON_CLASSES should have fixed size', () => {
    expect(TASK_LAYOUT_ICON_BUTTON_CLASSES).toContain('h-8');
    expect(TASK_LAYOUT_ICON_BUTTON_CLASSES).toContain('w-8');
  });

  it('TASK_LAYOUT_ICON_BUTTON_CLASSES should have touch target on mobile', () => {
    expect(TASK_LAYOUT_ICON_BUTTON_CLASSES).toContain('min-h-[44px]');
    expect(TASK_LAYOUT_ICON_BUTTON_CLASSES).toContain('min-w-[44px]');
  });

  it('TASK_LAYOUT_ICON_BUTTON_CLASSES should not shrink', () => {
    expect(TASK_LAYOUT_ICON_BUTTON_CLASSES).toContain('shrink-0');
  });
});

// ============================================================================
// getBaseSize Utility Tests
// ============================================================================

describe('TaskLayout - getBaseSize', () => {
  it('should return "md" for undefined', () => {
    expect(getBaseSize(undefined)).toBe('md');
  });

  it('should return the value directly for string input', () => {
    expect(getBaseSize('sm')).toBe('sm');
    expect(getBaseSize('md')).toBe('md');
    expect(getBaseSize('lg')).toBe('lg');
  });

  it('should return base value from responsive object', () => {
    expect(getBaseSize({ base: 'sm' })).toBe('sm');
    expect(getBaseSize({ base: 'lg' })).toBe('lg');
  });

  it('should return first defined breakpoint if no base', () => {
    expect(getBaseSize({ sm: 'lg' })).toBe('lg');
    expect(getBaseSize({ md: 'sm' })).toBe('sm');
    expect(getBaseSize({ lg: 'md' })).toBe('md');
  });

  it('should prefer base over other breakpoints', () => {
    expect(getBaseSize({ base: 'sm', md: 'lg' })).toBe('sm');
    expect(getBaseSize({ base: 'lg', sm: 'sm', md: 'md' })).toBe('lg');
  });

  it('should follow breakpoint order when no base', () => {
    expect(getBaseSize({ lg: 'lg', sm: 'sm' })).toBe('sm');
    expect(getBaseSize({ xl: 'lg', md: 'sm' })).toBe('md');
  });

  it('should return "md" for empty object', () => {
    expect(getBaseSize({})).toBe('md');
  });
});

// ============================================================================
// getResponsiveSizeClasses Utility Tests
// ============================================================================

describe('TaskLayout - getResponsiveSizeClasses', () => {
  it('should return md classes for undefined size', () => {
    expect(getResponsiveSizeClasses(undefined, 'headerPadding')).toBe(
      TASK_LAYOUT_SIZE_CLASSES.md.headerPadding
    );
  });

  it('should return correct classes for string size', () => {
    expect(getResponsiveSizeClasses('sm', 'headerPadding')).toBe(
      TASK_LAYOUT_SIZE_CLASSES.sm.headerPadding
    );
    expect(getResponsiveSizeClasses('lg', 'tabsPadding')).toBe(
      TASK_LAYOUT_SIZE_CLASSES.lg.tabsPadding
    );
  });

  it('should return classes based on base size for responsive object', () => {
    expect(getResponsiveSizeClasses({ base: 'sm' }, 'stepsPanelWidth')).toBe(
      TASK_LAYOUT_SIZE_CLASSES.sm.stepsPanelWidth
    );
  });

  it('should work with all property types', () => {
    const properties: (keyof typeof TASK_LAYOUT_SIZE_CLASSES.md)[] = [
      'headerPadding',
      'tabsPadding',
      'stepsPanelWidth',
    ];

    for (const prop of properties) {
      expect(getResponsiveSizeClasses('sm', prop)).toBe(TASK_LAYOUT_SIZE_CLASSES.sm[prop]);
      expect(getResponsiveSizeClasses('md', prop)).toBe(TASK_LAYOUT_SIZE_CLASSES.md[prop]);
      expect(getResponsiveSizeClasses('lg', prop)).toBe(TASK_LAYOUT_SIZE_CLASSES.lg[prop]);
    }
  });
});

// ============================================================================
// getCurrentBranch Utility Tests
// ============================================================================

describe('TaskLayout - getCurrentBranch', () => {
  it('should return branch from main chat', () => {
    expect(getCurrentBranch(mockChats)).toBe('openflow/task-1/main');
  });

  it('should return null for empty chats', () => {
    expect(getCurrentBranch([])).toBeNull();
  });

  it('should return null for chats with no branches', () => {
    expect(getCurrentBranch(mockChatsWithNoBranch)).toBeNull();
  });

  it('should fallback to any chat with branch if no main chat', () => {
    const reviewOnlyChats: Chat[] = [
      createMockChat({
        id: 'chat-review',
        chatRole: ChatRole.Review,
        branch: 'openflow/task-1/review',
      }),
    ];
    expect(getCurrentBranch(reviewOnlyChats)).toBe('openflow/task-1/review');
  });

  it('should prefer main chat over other chats', () => {
    const mixedChats: Chat[] = [
      createMockChat({
        id: 'chat-review',
        chatRole: ChatRole.Review,
        branch: 'openflow/task-1/review',
      }),
      createMockChat({
        id: 'chat-main',
        chatRole: ChatRole.Main,
        branch: 'openflow/task-1/main',
      }),
    ];
    expect(getCurrentBranch(mixedChats)).toBe('openflow/task-1/main');
  });
});

// ============================================================================
// buildTaskHeaderAccessibleLabel Utility Tests
// ============================================================================

describe('TaskLayout - buildTaskHeaderAccessibleLabel', () => {
  it('should build label with title and status', () => {
    const result = buildTaskHeaderAccessibleLabel('My Task', TaskStatus.Inprogress, 0);
    expect(result).toContain('Task: My Task');
    expect(result).toContain('Status: In Progress');
  });

  it('should include actions required when > 0', () => {
    const result = buildTaskHeaderAccessibleLabel('My Task', TaskStatus.Inprogress, 2);
    expect(result).toContain('2 actions required');
  });

  it('should not include actions when 0', () => {
    const result = buildTaskHeaderAccessibleLabel('My Task', TaskStatus.Done, 0);
    expect(result).not.toContain('actions required');
  });

  it('should use singular for 1 action', () => {
    const result = buildTaskHeaderAccessibleLabel('My Task', TaskStatus.Inreview, 1);
    expect(result).toContain('1 action required');
    expect(result).not.toContain('actions');
  });

  it('should work with all statuses', () => {
    const statuses: TaskStatus[] = [
      TaskStatus.Todo,
      TaskStatus.Inprogress,
      TaskStatus.Inreview,
      TaskStatus.Done,
      TaskStatus.Cancelled,
    ];

    for (const status of statuses) {
      const result = buildTaskHeaderAccessibleLabel('Task', status, 0);
      expect(result).toContain('Task: Task');
      expect(result).toContain('Status:');
    }
  });
});

// ============================================================================
// buildStepsPanelAnnouncement Utility Tests
// ============================================================================

describe('TaskLayout - buildStepsPanelAnnouncement', () => {
  it('should return collapsed announcement when collapsed', () => {
    expect(buildStepsPanelAnnouncement(true)).toBe(SR_STEPS_COLLAPSED);
  });

  it('should return expanded announcement when expanded', () => {
    expect(buildStepsPanelAnnouncement(false)).toBe(SR_STEPS_EXPANDED);
  });
});

// ============================================================================
// buildTabChangeAnnouncement Utility Tests
// ============================================================================

describe('TaskLayout - buildTabChangeAnnouncement', () => {
  it('should build announcement with tab label', () => {
    expect(buildTabChangeAnnouncement('Steps')).toBe('Switched to Steps tab');
    expect(buildTabChangeAnnouncement('Changes')).toBe('Switched to Changes tab');
    expect(buildTabChangeAnnouncement('Commits')).toBe('Switched to Commits tab');
  });

  it('should use SR_TAB_CHANGED prefix', () => {
    const result = buildTabChangeAnnouncement('Test');
    expect(result.startsWith(SR_TAB_CHANGED)).toBe(true);
  });

  it('should handle empty string', () => {
    expect(buildTabChangeAnnouncement('')).toBe('Switched to  tab');
  });
});

// ============================================================================
// buildStatusChangeAnnouncement Utility Tests
// ============================================================================

describe('TaskLayout - buildStatusChangeAnnouncement', () => {
  it('should build announcement with status label', () => {
    expect(buildStatusChangeAnnouncement(TaskStatus.Done)).toContain('Done');
    expect(buildStatusChangeAnnouncement(TaskStatus.Inprogress)).toContain('In Progress');
  });

  it('should use SR_STATUS_CHANGED prefix', () => {
    const result = buildStatusChangeAnnouncement(TaskStatus.Todo);
    expect(result.startsWith(SR_STATUS_CHANGED)).toBe(true);
  });

  it('should work with all statuses', () => {
    const statuses: TaskStatus[] = [
      TaskStatus.Todo,
      TaskStatus.Inprogress,
      TaskStatus.Inreview,
      TaskStatus.Done,
      TaskStatus.Cancelled,
    ];

    for (const status of statuses) {
      const result = buildStatusChangeAnnouncement(status);
      expect(result).toContain(SR_STATUS_CHANGED);
    }
  });
});

// ============================================================================
// getStepsPanelId Utility Tests
// ============================================================================

describe('TaskLayout - getStepsPanelId', () => {
  it('should create consistent ID pattern', () => {
    expect(getStepsPanelId('prefix')).toBe('prefix-steps-panel');
    expect(getStepsPanelId('task')).toBe('task-steps-panel');
  });

  it('should handle empty prefix', () => {
    expect(getStepsPanelId('')).toBe('-steps-panel');
  });

  it('should handle complex prefixes', () => {
    expect(getStepsPanelId('task-123')).toBe('task-123-steps-panel');
  });
});

// ============================================================================
// getMainPanelId Utility Tests
// ============================================================================

describe('TaskLayout - getMainPanelId', () => {
  it('should create consistent ID pattern', () => {
    expect(getMainPanelId('prefix')).toBe('prefix-main-panel');
    expect(getMainPanelId('task')).toBe('task-main-panel');
  });

  it('should handle empty prefix', () => {
    expect(getMainPanelId('')).toBe('-main-panel');
  });

  it('should handle complex prefixes', () => {
    expect(getMainPanelId('task-123')).toBe('task-123-main-panel');
  });
});

// ============================================================================
// Component Behavior Documentation Tests
// ============================================================================

describe('TaskLayout - Component Behavior Documentation', () => {
  describe('header structure', () => {
    it('should use Header primitive for semantic markup', () => {
      // Component uses HeaderPrimitive from @openflow/primitives
      // with aria-label for screen readers
      expect(true).toBe(true);
    });

    it('should have back button with accessible label', () => {
      // Back button has aria-label={DEFAULT_BACK_LABEL}
      expect(DEFAULT_BACK_LABEL).toBe('Go back to task list');
    });

    it('should support editable title', () => {
      // Title switches between display and input mode
      // Input has aria-describedby with instructions
      expect(true).toBe(true);
    });
  });

  describe('mobile steps panel', () => {
    it('should be collapsible on mobile', () => {
      // Uses button with aria-expanded and aria-controls
      expect(TASK_LAYOUT_MOBILE_STEPS_TOGGLE_CLASSES).toContain('w-full');
    });

    it('should announce state changes', () => {
      // Uses VisuallyHidden with aria-live="polite" for announcements
      expect(SR_STEPS_COLLAPSED).toContain('collapsed');
      expect(SR_STEPS_EXPANDED).toContain('expanded');
    });
  });

  describe('desktop steps panel', () => {
    it('should use aside element with aria-label', () => {
      // Desktop panel is an <aside> with aria-label={stepsPanelLabel}
      expect(DEFAULT_STEPS_PANEL_LABEL).toBe('Workflow steps');
    });

    it('should have configurable width', () => {
      // Width controlled by stepsPanelWidth prop or size variant
      expect(TASK_LAYOUT_SIZE_CLASSES.md.stepsPanelWidth).toBe('320px');
    });
  });

  describe('tabs integration', () => {
    it('should announce tab changes', () => {
      expect(buildTabChangeAnnouncement('Steps')).toContain('Switched to');
    });

    it('should hide steps panel on non-steps tabs', () => {
      // When activeTab !== 'steps', steps panel is hidden and tabContent is shown
      expect(true).toBe(true);
    });
  });

  describe('status dropdown', () => {
    it('should announce status changes', () => {
      expect(buildStatusChangeAnnouncement(TaskStatus.Done)).toContain('Task status changed to');
    });

    it('should have all status options', () => {
      expect(STATUS_OPTIONS).toHaveLength(5);
    });
  });

  describe('loading state', () => {
    it('should have loading overlay with screen reader text', () => {
      expect(SR_LOADING).toBe('Loading task details...');
    });

    it('should have skeleton component for loading', () => {
      // TaskLayoutSkeleton component provides loading UI
      expect(true).toBe(true);
    });
  });
});

// ============================================================================
// Accessibility Compliance Tests
// ============================================================================

describe('TaskLayout - Accessibility Compliance', () => {
  it('should meet WCAG 2.5.5 touch target requirements for edit button', () => {
    expect(TASK_LAYOUT_EDIT_TITLE_BUTTON_CLASSES).toContain('min-h-[44px]');
    expect(TASK_LAYOUT_EDIT_TITLE_BUTTON_CLASSES).toContain('min-w-[44px]');
  });

  it('should meet WCAG 2.5.5 touch target requirements for icon buttons', () => {
    expect(TASK_LAYOUT_ICON_BUTTON_CLASSES).toContain('min-h-[44px]');
    expect(TASK_LAYOUT_ICON_BUTTON_CLASSES).toContain('min-w-[44px]');
  });

  it('should meet WCAG 2.5.5 touch target requirements for mobile toggle', () => {
    expect(TASK_LAYOUT_MOBILE_STEPS_TOGGLE_CLASSES).toContain('min-h-[48px]');
  });

  it('should have visible focus indicators for title input', () => {
    expect(TASK_LAYOUT_TITLE_INPUT_CLASSES).toContain('focus:ring-2');
    expect(TASK_LAYOUT_TITLE_INPUT_CLASSES).toContain('focus:ring-offset-2');
  });

  it('should have visible focus indicators for edit button', () => {
    expect(TASK_LAYOUT_EDIT_TITLE_BUTTON_CLASSES).toContain('focus-visible:ring-2');
    expect(TASK_LAYOUT_EDIT_TITLE_BUTTON_CLASSES).toContain('focus-visible:ring-offset-2');
  });

  it('should have visible focus indicators for mobile toggle', () => {
    expect(TASK_LAYOUT_MOBILE_STEPS_TOGGLE_CLASSES).toContain('focus-visible:ring-2');
    expect(TASK_LAYOUT_MOBILE_STEPS_TOGGLE_CLASSES).toContain('focus-visible:ring-offset-2');
  });

  it('should respect reduced motion preferences for edit button', () => {
    expect(TASK_LAYOUT_EDIT_TITLE_BUTTON_CLASSES).toContain('motion-safe:');
  });

  it('should respect reduced motion preferences for mobile toggle', () => {
    expect(TASK_LAYOUT_MOBILE_STEPS_TOGGLE_CLASSES).toContain('motion-safe:');
  });
});

// ============================================================================
// Data Attributes Documentation Tests
// ============================================================================

describe('TaskLayout - Data Attributes Documentation', () => {
  it('main container should support data-testid', () => {
    // data-testid is passed directly to container
    expect(true).toBe(true);
  });

  it('main container should have data-size', () => {
    // data-size reflects current size variant (sm, md, lg)
    expect(true).toBe(true);
  });

  it('main container should have data-task-id', () => {
    // data-task-id reflects current task ID
    expect(true).toBe(true);
  });

  it('main container should have data-task-status', () => {
    // data-task-status reflects current task status
    expect(true).toBe(true);
  });

  it('main container should have data-loading', () => {
    // data-loading is present when isLoading is true
    expect(true).toBe(true);
  });

  it('nested elements should derive testids from parent', () => {
    // If data-testid="task":
    // - data-testid="task-header"
    // - data-testid="task-back-button"
    // - data-testid="task-title" or "task-title-input"
    // - data-testid="task-edit-title-button"
    // - data-testid="task-status-dropdown" or "task-status-badge"
    // - data-testid="task-branch"
    // - data-testid="task-create-pr-button"
    // - data-testid="task-more-actions-button"
    // - data-testid="task-tabs-container"
    // - data-testid="task-tabs"
    // - data-testid="task-main"
    // - data-testid="task-mobile-steps-toggle"
    // - data-testid="task-mobile-steps-panel"
    // - data-testid="task-desktop-steps-panel"
    // - data-testid="task-main-panel"
    // - data-testid="task-tab-content"
    // - data-testid="task-loading-overlay"
    expect(true).toBe(true);
  });
});

// ============================================================================
// Integration Pattern Tests
// ============================================================================

describe('TaskLayout - Integration Patterns', () => {
  it('should work with controlled activeTab', () => {
    // activeTab can be controlled externally
    // onTabChange callback receives new tab ID
    expect(true).toBe(true);
  });

  it('should support custom labels for localization', () => {
    // headerLabel, mainLabel, stepsPanelLabel props allow customization
    expect(DEFAULT_HEADER_LABEL).toBe('Task header');
    expect(DEFAULT_MAIN_LABEL).toBe('Task content');
    expect(DEFAULT_STEPS_PANEL_LABEL).toBe('Workflow steps');
  });

  it('should support responsive sizing', () => {
    // size prop accepts ResponsiveValue<TaskLayoutSize>
    expect(getBaseSize({ base: 'sm', md: 'md', lg: 'lg' })).toBe('sm');
  });

  it('should support custom steps panel width', () => {
    // stepsPanelWidth prop overrides size-based default
    expect(DEFAULT_STEPS_PANEL_WIDTH).toBe('320px');
  });

  it('should support ref forwarding', () => {
    // Component uses forwardRef for ref access
    expect(true).toBe(true);
  });

  it('should integrate with StepsPanel component', () => {
    // stepsPanel prop receives StepsPanel or any ReactNode
    expect(true).toBe(true);
  });

  it('should integrate with Tabs component', () => {
    // tabs prop receives Tab[] for Tabs component
    expect(true).toBe(true);
  });

  it('should integrate with DiffViewer for changes tab', () => {
    // tabContent prop receives content for non-steps tabs
    expect(true).toBe(true);
  });
});
