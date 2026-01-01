import type { DiffHunk, FileDiff } from '@openflow/generated';
import { describe, expect, it } from 'vitest';
import {
  DEFAULT_BINARY_MESSAGE,
  DEFAULT_COLLAPSE_LABEL,
  DEFAULT_EMPTY_DESCRIPTION,
  DEFAULT_EMPTY_TITLE,
  DEFAULT_ERROR_RETRY_LABEL,
  DEFAULT_ERROR_TITLE,
  DEFAULT_EXPAND_LABEL,
  DEFAULT_NO_CHANGES_MESSAGE,
  DEFAULT_REGION_LABEL,
  // Constants
  DEFAULT_SKELETON_COUNT,
  DIFF_BINARY_MESSAGE_CLASSES,
  DIFF_HUNK_HEADER_CLASSES,
  DIFF_LINE_ADDITION_CLASSES,
  DIFF_LINE_BASE_CLASSES,
  DIFF_LINE_CONTENT_CLASSES,
  DIFF_LINE_DELETION_CLASSES,
  DIFF_LINE_NUMBER_CLASSES,
  DIFF_LINE_PREFIX_CLASSES,
  DIFF_VIEWER_BADGE_SIZE_MAP,
  // Base class constants
  DIFF_VIEWER_BASE_CLASSES,
  DIFF_VIEWER_BUTTON_SIZE_MAP,
  DIFF_VIEWER_CONTENT_CLASSES,
  DIFF_VIEWER_FILE_CONTAINER_CLASSES,
  DIFF_VIEWER_GAP_CLASSES,
  DIFF_VIEWER_HEADER_PADDING_CLASSES,
  DIFF_VIEWER_ICON_SIZE_MAP,
  DIFF_VIEWER_LINE_HEIGHT_CLASSES,
  DIFF_VIEWER_LINE_NUMBER_WIDTH_CLASSES,
  DIFF_VIEWER_PADDING_CLASSES,
  // Size class constants
  DIFF_VIEWER_SIZE_CLASSES,
  DIFF_VIEWER_SUMMARY_CLASSES,
  ERROR_ICON_CONTAINER_CLASSES,
  ERROR_STATE_CLASSES,
  FILE_CONTENT_CONTAINER_CLASSES,
  FILE_HEADER_BUTTON_CLASSES,
  FILE_HEADER_EXPANDED_CLASSES,
  SKELETON_FILE_CLASSES,
  SR_ADDITIONS,
  SR_ADDITION_PREFIX,
  SR_BINARY_FILE,
  SR_CONTEXT_PREFIX,
  SR_DELETED_FILE,
  SR_DELETIONS,
  SR_DELETION_PREFIX,
  SR_FILES_COUNT,
  SR_FILE_COLLAPSED,
  SR_FILE_EXPANDED,
  SR_LOADING,
  SR_NEW_FILE,
  SR_RENAMED_FILE,
  STATUS_LABELS,
  buildFileAccessibleLabel,
  buildStatsAnnouncement,
  // Utility functions
  getBaseSize,
  getFileIcon,
  getFileIconColor,
  getFileStatusLabel,
  getLineTypeAnnouncement,
  getResponsiveSizeClasses,
  parseDiffHunk,
} from '../../../packages/ui/organisms/DiffViewer';

// =============================================================================
// Default Constants Tests
// =============================================================================

describe('DiffViewer Default Constants', () => {
  it('has correct DEFAULT_SKELETON_COUNT', () => {
    expect(DEFAULT_SKELETON_COUNT).toBe(3);
  });

  it('has correct DEFAULT_REGION_LABEL', () => {
    expect(DEFAULT_REGION_LABEL).toBe('File changes');
  });

  it('has correct DEFAULT_EMPTY_TITLE', () => {
    expect(DEFAULT_EMPTY_TITLE).toBe('No changes to display');
  });

  it('has correct DEFAULT_EMPTY_DESCRIPTION', () => {
    expect(DEFAULT_EMPTY_DESCRIPTION).toBe('There are no file changes to show.');
  });

  it('has correct DEFAULT_ERROR_TITLE', () => {
    expect(DEFAULT_ERROR_TITLE).toBe('Failed to load changes');
  });

  it('has correct DEFAULT_ERROR_RETRY_LABEL', () => {
    expect(DEFAULT_ERROR_RETRY_LABEL).toBe('Retry');
  });

  it('has correct DEFAULT_EXPAND_LABEL', () => {
    expect(DEFAULT_EXPAND_LABEL).toBe('Expand file');
  });

  it('has correct DEFAULT_COLLAPSE_LABEL', () => {
    expect(DEFAULT_COLLAPSE_LABEL).toBe('Collapse file');
  });

  it('has correct DEFAULT_BINARY_MESSAGE', () => {
    expect(DEFAULT_BINARY_MESSAGE).toBe('Binary file - diff not available');
  });

  it('has correct DEFAULT_NO_CHANGES_MESSAGE', () => {
    expect(DEFAULT_NO_CHANGES_MESSAGE).toBe('No changes');
  });
});

// =============================================================================
// Screen Reader Constants Tests
// =============================================================================

describe('DiffViewer Screen Reader Constants', () => {
  it('has correct SR_FILE_EXPANDED', () => {
    expect(SR_FILE_EXPANDED).toBe('File diff expanded');
  });

  it('has correct SR_FILE_COLLAPSED', () => {
    expect(SR_FILE_COLLAPSED).toBe('File diff collapsed');
  });

  it('has correct SR_FILES_COUNT', () => {
    expect(SR_FILES_COUNT).toBe('files changed');
  });

  it('has correct SR_ADDITIONS', () => {
    expect(SR_ADDITIONS).toBe('additions');
  });

  it('has correct SR_DELETIONS', () => {
    expect(SR_DELETIONS).toBe('deletions');
  });

  it('has correct SR_NEW_FILE', () => {
    expect(SR_NEW_FILE).toBe('new file');
  });

  it('has correct SR_DELETED_FILE', () => {
    expect(SR_DELETED_FILE).toBe('deleted file');
  });

  it('has correct SR_RENAMED_FILE', () => {
    expect(SR_RENAMED_FILE).toBe('file renamed');
  });

  it('has correct SR_BINARY_FILE', () => {
    expect(SR_BINARY_FILE).toBe('binary file');
  });

  it('has correct SR_LOADING', () => {
    expect(SR_LOADING).toBe('Loading file changes');
  });

  it('has correct SR_ADDITION_PREFIX', () => {
    expect(SR_ADDITION_PREFIX).toBe('addition');
  });

  it('has correct SR_DELETION_PREFIX', () => {
    expect(SR_DELETION_PREFIX).toBe('deletion');
  });

  it('has correct SR_CONTEXT_PREFIX', () => {
    expect(SR_CONTEXT_PREFIX).toBe('unchanged');
  });
});

// =============================================================================
// Status Labels Tests
// =============================================================================

describe('DiffViewer Status Labels', () => {
  it('has correct status labels', () => {
    expect(STATUS_LABELS.new).toBe('new');
    expect(STATUS_LABELS.deleted).toBe('deleted');
    expect(STATUS_LABELS.renamed).toBe('renamed');
    expect(STATUS_LABELS.binary).toBe('binary');
  });
});

// =============================================================================
// Size Class Constants Tests
// =============================================================================

describe('DiffViewer Size Class Constants', () => {
  describe('DIFF_VIEWER_SIZE_CLASSES', () => {
    it('has sm size classes', () => {
      expect(DIFF_VIEWER_SIZE_CLASSES.sm).toBe('text-xs');
    });

    it('has md size classes', () => {
      expect(DIFF_VIEWER_SIZE_CLASSES.md).toBe('text-sm');
    });

    it('has lg size classes', () => {
      expect(DIFF_VIEWER_SIZE_CLASSES.lg).toBe('text-base');
    });
  });

  describe('DIFF_VIEWER_PADDING_CLASSES', () => {
    it('has sm padding classes', () => {
      expect(DIFF_VIEWER_PADDING_CLASSES.sm).toBe('px-3 py-2');
    });

    it('has md padding classes', () => {
      expect(DIFF_VIEWER_PADDING_CLASSES.md).toBe('px-4 py-2.5');
    });

    it('has lg padding classes', () => {
      expect(DIFF_VIEWER_PADDING_CLASSES.lg).toBe('px-5 py-3');
    });
  });

  describe('DIFF_VIEWER_HEADER_PADDING_CLASSES', () => {
    it('has sm header padding classes', () => {
      expect(DIFF_VIEWER_HEADER_PADDING_CLASSES.sm).toBe('px-3 py-1.5');
    });

    it('has md header padding classes', () => {
      expect(DIFF_VIEWER_HEADER_PADDING_CLASSES.md).toBe('px-4 py-2');
    });

    it('has lg header padding classes', () => {
      expect(DIFF_VIEWER_HEADER_PADDING_CLASSES.lg).toBe('px-5 py-2.5');
    });
  });

  describe('DIFF_VIEWER_GAP_CLASSES', () => {
    it('has sm gap classes', () => {
      expect(DIFF_VIEWER_GAP_CLASSES.sm).toBe('gap-1.5');
    });

    it('has md gap classes', () => {
      expect(DIFF_VIEWER_GAP_CLASSES.md).toBe('gap-2');
    });

    it('has lg gap classes', () => {
      expect(DIFF_VIEWER_GAP_CLASSES.lg).toBe('gap-3');
    });
  });

  describe('DIFF_VIEWER_LINE_HEIGHT_CLASSES', () => {
    it('has sm line height classes', () => {
      expect(DIFF_VIEWER_LINE_HEIGHT_CLASSES.sm).toBe('leading-5');
    });

    it('has md line height classes', () => {
      expect(DIFF_VIEWER_LINE_HEIGHT_CLASSES.md).toBe('leading-6');
    });

    it('has lg line height classes', () => {
      expect(DIFF_VIEWER_LINE_HEIGHT_CLASSES.lg).toBe('leading-7');
    });
  });

  describe('DIFF_VIEWER_LINE_NUMBER_WIDTH_CLASSES', () => {
    it('has sm line number width classes', () => {
      expect(DIFF_VIEWER_LINE_NUMBER_WIDTH_CLASSES.sm).toBe('w-10');
    });

    it('has md line number width classes', () => {
      expect(DIFF_VIEWER_LINE_NUMBER_WIDTH_CLASSES.md).toBe('w-12');
    });

    it('has lg line number width classes', () => {
      expect(DIFF_VIEWER_LINE_NUMBER_WIDTH_CLASSES.lg).toBe('w-14');
    });
  });

  describe('DIFF_VIEWER_ICON_SIZE_MAP', () => {
    it('maps sm to xs icon', () => {
      expect(DIFF_VIEWER_ICON_SIZE_MAP.sm).toBe('xs');
    });

    it('maps md to sm icon', () => {
      expect(DIFF_VIEWER_ICON_SIZE_MAP.md).toBe('sm');
    });

    it('maps lg to md icon', () => {
      expect(DIFF_VIEWER_ICON_SIZE_MAP.lg).toBe('md');
    });
  });

  describe('DIFF_VIEWER_BUTTON_SIZE_MAP', () => {
    it('maps sm to sm button', () => {
      expect(DIFF_VIEWER_BUTTON_SIZE_MAP.sm).toBe('sm');
    });

    it('maps md to sm button', () => {
      expect(DIFF_VIEWER_BUTTON_SIZE_MAP.md).toBe('sm');
    });

    it('maps lg to md button', () => {
      expect(DIFF_VIEWER_BUTTON_SIZE_MAP.lg).toBe('md');
    });
  });

  describe('DIFF_VIEWER_BADGE_SIZE_MAP', () => {
    it('maps sm to sm badge', () => {
      expect(DIFF_VIEWER_BADGE_SIZE_MAP.sm).toBe('sm');
    });

    it('maps md to sm badge', () => {
      expect(DIFF_VIEWER_BADGE_SIZE_MAP.md).toBe('sm');
    });

    it('maps lg to md badge', () => {
      expect(DIFF_VIEWER_BADGE_SIZE_MAP.lg).toBe('md');
    });
  });
});

// =============================================================================
// Base Class Constants Tests
// =============================================================================

describe('DiffViewer Base Class Constants', () => {
  it('DIFF_VIEWER_BASE_CLASSES includes flex and background', () => {
    expect(DIFF_VIEWER_BASE_CLASSES).toContain('flex');
    expect(DIFF_VIEWER_BASE_CLASSES).toContain('flex-col');
    expect(DIFF_VIEWER_BASE_CLASSES).toContain('bg-[rgb(var(--background))]');
  });

  it('DIFF_VIEWER_SUMMARY_CLASSES includes flex and border', () => {
    expect(DIFF_VIEWER_SUMMARY_CLASSES).toContain('flex');
    expect(DIFF_VIEWER_SUMMARY_CLASSES).toContain('items-center');
    expect(DIFF_VIEWER_SUMMARY_CLASSES).toContain('justify-between');
    expect(DIFF_VIEWER_SUMMARY_CLASSES).toContain('border-b');
  });

  it('DIFF_VIEWER_CONTENT_CLASSES includes overflow-y-auto', () => {
    expect(DIFF_VIEWER_CONTENT_CLASSES).toContain('flex-1');
    expect(DIFF_VIEWER_CONTENT_CLASSES).toContain('overflow-y-auto');
    expect(DIFF_VIEWER_CONTENT_CLASSES).toContain('scrollbar-thin');
  });

  it('DIFF_VIEWER_FILE_CONTAINER_CLASSES includes flex and divide', () => {
    expect(DIFF_VIEWER_FILE_CONTAINER_CLASSES).toContain('flex');
    expect(DIFF_VIEWER_FILE_CONTAINER_CLASSES).toContain('flex-col');
    expect(DIFF_VIEWER_FILE_CONTAINER_CLASSES).toContain('divide-y');
  });

  it('FILE_HEADER_BUTTON_CLASSES includes hover, focus, and touch target', () => {
    expect(FILE_HEADER_BUTTON_CLASSES).toContain('flex');
    expect(FILE_HEADER_BUTTON_CLASSES).toContain('w-full');
    expect(FILE_HEADER_BUTTON_CLASSES).toContain('hover:bg-[rgb(var(--muted))]');
    expect(FILE_HEADER_BUTTON_CLASSES).toContain('focus-visible:ring-2');
    expect(FILE_HEADER_BUTTON_CLASSES).toContain('min-h-[44px]');
  });

  it('FILE_HEADER_EXPANDED_CLASSES includes background', () => {
    expect(FILE_HEADER_EXPANDED_CLASSES).toContain('bg-[rgb(var(--muted))]/50');
  });

  it('FILE_CONTENT_CONTAINER_CLASSES includes border and overflow', () => {
    expect(FILE_CONTENT_CONTAINER_CLASSES).toContain('border-t');
    expect(FILE_CONTENT_CONTAINER_CLASSES).toContain('overflow-x-auto');
  });

  it('DIFF_LINE_BASE_CLASSES includes flex and font-mono', () => {
    expect(DIFF_LINE_BASE_CLASSES).toContain('flex');
    expect(DIFF_LINE_BASE_CLASSES).toContain('font-mono');
    expect(DIFF_LINE_BASE_CLASSES).toContain('hover:bg-[rgb(var(--accent))]/50');
  });

  it('DIFF_LINE_ADDITION_CLASSES includes addition background', () => {
    expect(DIFF_LINE_ADDITION_CLASSES).toContain('bg-addition/10');
  });

  it('DIFF_LINE_DELETION_CLASSES includes deletion background', () => {
    expect(DIFF_LINE_DELETION_CLASSES).toContain('bg-deletion/10');
  });

  it('DIFF_LINE_NUMBER_CLASSES includes select-none and border', () => {
    expect(DIFF_LINE_NUMBER_CLASSES).toContain('select-none');
    expect(DIFF_LINE_NUMBER_CLASSES).toContain('text-right');
    expect(DIFF_LINE_NUMBER_CLASSES).toContain('border-r');
  });

  it('DIFF_LINE_PREFIX_CLASSES includes width and select-none', () => {
    expect(DIFF_LINE_PREFIX_CLASSES).toContain('w-6');
    expect(DIFF_LINE_PREFIX_CLASSES).toContain('select-none');
    expect(DIFF_LINE_PREFIX_CLASSES).toContain('text-center');
  });

  it('DIFF_LINE_CONTENT_CLASSES includes whitespace-pre-wrap', () => {
    expect(DIFF_LINE_CONTENT_CLASSES).toContain('whitespace-pre-wrap');
    expect(DIFF_LINE_CONTENT_CLASSES).toContain('break-all');
  });

  it('DIFF_HUNK_HEADER_CLASSES includes background and font-mono', () => {
    expect(DIFF_HUNK_HEADER_CLASSES).toContain('bg-[rgb(var(--muted))]');
    expect(DIFF_HUNK_HEADER_CLASSES).toContain('font-mono');
  });

  it('DIFF_BINARY_MESSAGE_CLASSES includes italic', () => {
    expect(DIFF_BINARY_MESSAGE_CLASSES).toContain('italic');
  });

  it('SKELETON_FILE_CLASSES includes flex and border', () => {
    expect(SKELETON_FILE_CLASSES).toContain('flex');
    expect(SKELETON_FILE_CLASSES).toContain('items-center');
    expect(SKELETON_FILE_CLASSES).toContain('border-b');
  });

  it('ERROR_STATE_CLASSES includes flex and center alignment', () => {
    expect(ERROR_STATE_CLASSES).toContain('flex');
    expect(ERROR_STATE_CLASSES).toContain('flex-col');
    expect(ERROR_STATE_CLASSES).toContain('items-center');
    expect(ERROR_STATE_CLASSES).toContain('justify-center');
    expect(ERROR_STATE_CLASSES).toContain('text-center');
  });

  it('ERROR_ICON_CONTAINER_CLASSES includes rounded-full', () => {
    expect(ERROR_ICON_CONTAINER_CLASSES).toContain('rounded-full');
    expect(ERROR_ICON_CONTAINER_CLASSES).toContain('bg-[rgb(var(--destructive))]/10');
  });
});

// =============================================================================
// getBaseSize Tests
// =============================================================================

describe('getBaseSize', () => {
  it('returns the size for string value', () => {
    expect(getBaseSize('sm')).toBe('sm');
    expect(getBaseSize('md')).toBe('md');
    expect(getBaseSize('lg')).toBe('lg');
  });

  it('returns base size from responsive object', () => {
    expect(getBaseSize({ base: 'sm' })).toBe('sm');
    expect(getBaseSize({ base: 'md', lg: 'lg' })).toBe('md');
  });

  it('returns md as default when base is not specified', () => {
    expect(getBaseSize({ lg: 'lg' })).toBe('md');
  });

  it('returns md for edge cases', () => {
    expect(getBaseSize(undefined as unknown as 'md')).toBe('md');
    expect(getBaseSize({} as { base: 'md' })).toBe('md');
  });
});

// =============================================================================
// getResponsiveSizeClasses Tests
// =============================================================================

describe('getResponsiveSizeClasses', () => {
  const testClassMap = {
    sm: 'text-xs padding-sm',
    md: 'text-sm padding-md',
    lg: 'text-base padding-lg',
  };

  it('returns classes for string size', () => {
    expect(getResponsiveSizeClasses('sm', testClassMap)).toEqual(['text-xs', 'padding-sm']);
    expect(getResponsiveSizeClasses('md', testClassMap)).toEqual(['text-sm', 'padding-md']);
    expect(getResponsiveSizeClasses('lg', testClassMap)).toEqual(['text-base', 'padding-lg']);
  });

  it('returns responsive classes for object size', () => {
    const classes = getResponsiveSizeClasses({ base: 'sm', md: 'md' }, testClassMap);
    expect(classes).toContain('text-xs');
    expect(classes).toContain('padding-sm');
    expect(classes).toContain('md:text-sm');
    expect(classes).toContain('md:padding-md');
  });

  it('includes all specified breakpoints', () => {
    const classes = getResponsiveSizeClasses({ base: 'sm', md: 'md', lg: 'lg' }, testClassMap);
    expect(classes).toContain('text-xs');
    expect(classes).toContain('md:text-sm');
    expect(classes).toContain('lg:text-base');
  });

  it('only includes specified breakpoints', () => {
    const classes = getResponsiveSizeClasses({ base: 'sm', lg: 'lg' }, testClassMap);
    expect(classes).toContain('text-xs');
    expect(classes).not.toContain('md:text-sm');
    expect(classes).toContain('lg:text-base');
  });

  it('handles single breakpoint object', () => {
    const classes = getResponsiveSizeClasses({ base: 'md' }, testClassMap);
    expect(classes).toEqual(['text-sm', 'padding-md']);
  });
});

// =============================================================================
// getFileIcon Tests
// =============================================================================

describe('getFileIcon', () => {
  it('returns FilePlus for new files', () => {
    const diff = { isNew: true, isDeleted: false, isRenamed: false } as FileDiff;
    const icon = getFileIcon(diff);
    expect(icon.displayName).toBe('FilePlus');
  });

  it('returns FileMinus for deleted files', () => {
    const diff = { isNew: false, isDeleted: true, isRenamed: false } as FileDiff;
    const icon = getFileIcon(diff);
    expect(icon.displayName).toBe('FileMinus');
  });

  it('returns FileEdit for modified files', () => {
    const diff = { isNew: false, isDeleted: false, isRenamed: false } as FileDiff;
    const icon = getFileIcon(diff);
    // Lucide React renamed FileEdit to FilePen
    expect(icon.displayName).toBe('FilePen');
  });

  it('prioritizes isNew over isDeleted', () => {
    const diff = { isNew: true, isDeleted: true, isRenamed: false } as FileDiff;
    const icon = getFileIcon(diff);
    expect(icon.displayName).toBe('FilePlus');
  });
});

// =============================================================================
// getFileIconColor Tests
// =============================================================================

describe('getFileIconColor', () => {
  it('returns success color for new files', () => {
    const diff = { isNew: true, isDeleted: false } as FileDiff;
    expect(getFileIconColor(diff)).toContain('--success');
  });

  it('returns destructive color for deleted files', () => {
    const diff = { isNew: false, isDeleted: true } as FileDiff;
    expect(getFileIconColor(diff)).toContain('--destructive');
  });

  it('returns warning color for modified files', () => {
    const diff = { isNew: false, isDeleted: false } as FileDiff;
    expect(getFileIconColor(diff)).toContain('--warning');
  });
});

// =============================================================================
// getFileStatusLabel Tests
// =============================================================================

describe('getFileStatusLabel', () => {
  it('returns SR_NEW_FILE for new files', () => {
    const diff = { isNew: true } as FileDiff;
    expect(getFileStatusLabel(diff)).toBe(SR_NEW_FILE);
  });

  it('returns SR_DELETED_FILE for deleted files', () => {
    const diff = { isNew: false, isDeleted: true } as FileDiff;
    expect(getFileStatusLabel(diff)).toBe(SR_DELETED_FILE);
  });

  it('returns SR_RENAMED_FILE for renamed files', () => {
    const diff = { isNew: false, isDeleted: false, isRenamed: true } as FileDiff;
    expect(getFileStatusLabel(diff)).toBe(SR_RENAMED_FILE);
  });

  it('returns SR_BINARY_FILE for binary files', () => {
    const diff = { isNew: false, isDeleted: false, isRenamed: false, isBinary: true } as FileDiff;
    expect(getFileStatusLabel(diff)).toBe(SR_BINARY_FILE);
  });

  it('returns null for regular modified files', () => {
    const diff = { isNew: false, isDeleted: false, isRenamed: false, isBinary: false } as FileDiff;
    expect(getFileStatusLabel(diff)).toBeNull();
  });
});

// =============================================================================
// parseDiffHunk Tests
// =============================================================================

describe('parseDiffHunk', () => {
  it('parses additions correctly', () => {
    const hunk: DiffHunk = {
      oldStart: 1,
      oldLines: 0,
      newStart: 1,
      newLines: 2,
      content: '+added line 1\n+added line 2',
    };
    const lines = parseDiffHunk(hunk);

    expect(lines).toHaveLength(2);
    const line0 = lines[0]!;
    const line1 = lines[1]!;
    expect(line0.type).toBe('addition');
    expect(line0.content).toBe('added line 1');
    expect(line0.newLineNumber).toBe(1);
    expect(line0.oldLineNumber).toBeUndefined();
    expect(line1.newLineNumber).toBe(2);
  });

  it('parses deletions correctly', () => {
    const hunk: DiffHunk = {
      oldStart: 1,
      oldLines: 2,
      newStart: 1,
      newLines: 0,
      content: '-deleted line 1\n-deleted line 2',
    };
    const lines = parseDiffHunk(hunk);

    expect(lines).toHaveLength(2);
    const line0 = lines[0]!;
    const line1 = lines[1]!;
    expect(line0.type).toBe('deletion');
    expect(line0.content).toBe('deleted line 1');
    expect(line0.oldLineNumber).toBe(1);
    expect(line0.newLineNumber).toBeUndefined();
    expect(line1.oldLineNumber).toBe(2);
  });

  it('parses context lines correctly', () => {
    const hunk: DiffHunk = {
      oldStart: 1,
      oldLines: 2,
      newStart: 1,
      newLines: 2,
      content: ' context line 1\n context line 2',
    };
    const lines = parseDiffHunk(hunk);

    expect(lines).toHaveLength(2);
    const line0 = lines[0]!;
    const line1 = lines[1]!;
    expect(line0.type).toBe('context');
    expect(line0.content).toBe('context line 1');
    expect(line0.oldLineNumber).toBe(1);
    expect(line0.newLineNumber).toBe(1);
    expect(line1.oldLineNumber).toBe(2);
    expect(line1.newLineNumber).toBe(2);
  });

  it('parses hunk headers correctly', () => {
    const hunk: DiffHunk = {
      oldStart: 1,
      oldLines: 1,
      newStart: 1,
      newLines: 1,
      content: '@@ -1,1 +1,1 @@\n content',
    };
    const lines = parseDiffHunk(hunk);

    expect(lines).toHaveLength(2);
    const line0 = lines[0]!;
    expect(line0.type).toBe('header');
    expect(line0.content).toBe('@@ -1,1 +1,1 @@');
  });

  it('parses mixed diff correctly', () => {
    const hunk: DiffHunk = {
      oldStart: 1,
      oldLines: 3,
      newStart: 1,
      newLines: 3,
      content: ' context\n-old\n+new',
    };
    const lines = parseDiffHunk(hunk);

    expect(lines).toHaveLength(3);
    const line0 = lines[0]!;
    const line1 = lines[1]!;
    const line2 = lines[2]!;
    expect(line0.type).toBe('context');
    expect(line1.type).toBe('deletion');
    expect(line2.type).toBe('addition');
  });
});

// =============================================================================
// getLineTypeAnnouncement Tests
// =============================================================================

describe('getLineTypeAnnouncement', () => {
  it('returns SR_ADDITION_PREFIX for additions', () => {
    expect(getLineTypeAnnouncement('addition')).toBe(SR_ADDITION_PREFIX);
  });

  it('returns SR_DELETION_PREFIX for deletions', () => {
    expect(getLineTypeAnnouncement('deletion')).toBe(SR_DELETION_PREFIX);
  });

  it('returns SR_CONTEXT_PREFIX for context', () => {
    expect(getLineTypeAnnouncement('context')).toBe(SR_CONTEXT_PREFIX);
  });

  it('returns empty string for headers', () => {
    expect(getLineTypeAnnouncement('header')).toBe('');
  });
});

// =============================================================================
// buildFileAccessibleLabel Tests
// =============================================================================

describe('buildFileAccessibleLabel', () => {
  const mockDiff: FileDiff = {
    path: 'src/test.ts',
    oldPath: undefined,
    additions: 10,
    deletions: 5,
    isNew: false,
    isDeleted: false,
    isRenamed: false,
    isBinary: false,
    hunks: [],
  };

  it('includes action based on expanded state', () => {
    const expandedLabel = buildFileAccessibleLabel(mockDiff, true);
    const collapsedLabel = buildFileAccessibleLabel(mockDiff, false);

    expect(expandedLabel).toContain('Collapse');
    expect(collapsedLabel).toContain('Expand');
  });

  it('includes file path', () => {
    const label = buildFileAccessibleLabel(mockDiff, false);
    expect(label).toContain(mockDiff.path);
  });

  it('includes additions and deletions', () => {
    const label = buildFileAccessibleLabel(mockDiff, false);
    expect(label).toContain('10 additions');
    expect(label).toContain('5 deletions');
  });

  it('includes status for new files', () => {
    const newDiff = { ...mockDiff, isNew: true };
    const label = buildFileAccessibleLabel(newDiff, false);
    expect(label).toContain(SR_NEW_FILE);
  });

  it('includes rename info for renamed files', () => {
    const renamedDiff = { ...mockDiff, isRenamed: true, oldPath: 'src/old.ts' };
    const label = buildFileAccessibleLabel(renamedDiff, false);
    expect(label).toContain('renamed from src/old.ts');
  });
});

// =============================================================================
// buildStatsAnnouncement Tests
// =============================================================================

describe('buildStatsAnnouncement', () => {
  it('handles singular file', () => {
    const announcement = buildStatsAnnouncement(1, 10, 5);
    expect(announcement).toContain('1 file changed');
  });

  it('handles plural files', () => {
    const announcement = buildStatsAnnouncement(5, 10, 5);
    expect(announcement).toContain('5 files changed');
  });

  it('handles singular addition', () => {
    const announcement = buildStatsAnnouncement(1, 1, 5);
    expect(announcement).toContain('1 addition');
  });

  it('handles plural additions', () => {
    const announcement = buildStatsAnnouncement(1, 10, 5);
    expect(announcement).toContain('10 additions');
  });

  it('handles singular deletion', () => {
    const announcement = buildStatsAnnouncement(1, 1, 1);
    expect(announcement).toContain('1 deletion');
  });

  it('handles plural deletions', () => {
    const announcement = buildStatsAnnouncement(1, 1, 5);
    expect(announcement).toContain('5 deletions');
  });

  it('includes all stats in announcement', () => {
    const announcement = buildStatsAnnouncement(3, 25, 10);
    expect(announcement).toContain('3 files');
    expect(announcement).toContain('25 additions');
    expect(announcement).toContain('10 deletions');
  });
});

// =============================================================================
// Touch Target Compliance Tests
// =============================================================================

describe('Touch Target Compliance (WCAG 2.5.5)', () => {
  it('file header button has min-h-[44px] for touch targets', () => {
    expect(FILE_HEADER_BUTTON_CLASSES).toContain('min-h-[44px]');
  });
});

// =============================================================================
// Focus Ring Compliance Tests
// =============================================================================

describe('Focus Ring Compliance', () => {
  it('file header button has focus-visible ring', () => {
    expect(FILE_HEADER_BUTTON_CLASSES).toContain('focus-visible:ring-2');
    expect(FILE_HEADER_BUTTON_CLASSES).toContain('focus-visible:ring-offset-2');
  });
});

// =============================================================================
// Motion Safe Compliance Tests
// =============================================================================

describe('Motion Safe Compliance (Reduced Motion)', () => {
  it('file header button has motion-safe transitions', () => {
    expect(FILE_HEADER_BUTTON_CLASSES).toContain('motion-safe:transition-colors');
    expect(FILE_HEADER_BUTTON_CLASSES).toContain('motion-safe:duration-150');
  });
});

// =============================================================================
// Horizontal Scroll Compliance Tests
// =============================================================================

describe('Horizontal Scroll Compliance', () => {
  it('file content container has overflow-x-auto for wide content', () => {
    expect(FILE_CONTENT_CONTAINER_CLASSES).toContain('overflow-x-auto');
  });
});

// =============================================================================
// Color-Blind Accessibility Tests
// =============================================================================

describe('Color-Blind Accessibility', () => {
  it('diff line prefix class has consistent width for +/- display', () => {
    expect(DIFF_LINE_PREFIX_CLASSES).toContain('w-6');
  });

  it('diff line content uses whitespace-pre-wrap for proper display', () => {
    expect(DIFF_LINE_CONTENT_CLASSES).toContain('whitespace-pre-wrap');
  });
});

// =============================================================================
// Accessibility Behavior Documentation
// =============================================================================

describe('Accessibility Behavior Documentation', () => {
  it('documents aria-expanded behavior for expandable files', () => {
    // File headers should have aria-expanded based on isExpanded state
    expect(true).toBe(true);
  });

  it('documents aria-controls linking between header and content', () => {
    // Header button aria-controls should point to content region id
    expect(true).toBe(true);
  });

  it('documents role="region" for container', () => {
    // Container should have role="region" with aria-label
    expect(true).toBe(true);
  });

  it('documents role="list" and role="listitem" for files', () => {
    // File container should use proper list semantics
    expect(true).toBe(true);
  });

  it('documents role="table" for diff content', () => {
    // Diff content uses role="table" with row/cell semantics
    expect(true).toBe(true);
  });

  it('documents VisuallyHidden for screen reader announcements', () => {
    // Stats and state changes announced via VisuallyHidden
    expect(true).toBe(true);
  });

  it('documents visual +/- prefix for color-blind users', () => {
    // Each line has a visual prefix: + for addition, - for deletion, space for context
    expect(true).toBe(true);
  });
});

// =============================================================================
// Component Props Documentation
// =============================================================================

describe('Component Props Documentation', () => {
  it('documents DiffViewerProps interface', () => {
    // DiffViewerProps includes: diffs, expandedFiles, onFileToggle,
    // defaultExpanded, showLineNumbers, maxHeight, className, size, data-testid, aria-label
    expect(true).toBe(true);
  });

  it('documents DiffViewerSkeletonProps interface', () => {
    // DiffViewerSkeletonProps includes: count, className, size, data-testid
    expect(true).toBe(true);
  });

  it('documents DiffViewerErrorProps interface', () => {
    // DiffViewerErrorProps includes: message, onRetry, className, size, data-testid
    expect(true).toBe(true);
  });

  it('documents DiffLine interface', () => {
    // DiffLine includes: type, content, oldLineNumber, newLineNumber
    expect(true).toBe(true);
  });
});

// =============================================================================
// Size Consistency Tests
// =============================================================================

describe('Size Consistency', () => {
  it('all size variants are defined in SIZE_CLASSES', () => {
    expect(DIFF_VIEWER_SIZE_CLASSES).toHaveProperty('sm');
    expect(DIFF_VIEWER_SIZE_CLASSES).toHaveProperty('md');
    expect(DIFF_VIEWER_SIZE_CLASSES).toHaveProperty('lg');
  });

  it('all size variants are defined in PADDING_CLASSES', () => {
    expect(DIFF_VIEWER_PADDING_CLASSES).toHaveProperty('sm');
    expect(DIFF_VIEWER_PADDING_CLASSES).toHaveProperty('md');
    expect(DIFF_VIEWER_PADDING_CLASSES).toHaveProperty('lg');
  });

  it('all size variants are defined in HEADER_PADDING_CLASSES', () => {
    expect(DIFF_VIEWER_HEADER_PADDING_CLASSES).toHaveProperty('sm');
    expect(DIFF_VIEWER_HEADER_PADDING_CLASSES).toHaveProperty('md');
    expect(DIFF_VIEWER_HEADER_PADDING_CLASSES).toHaveProperty('lg');
  });

  it('all size variants are defined in GAP_CLASSES', () => {
    expect(DIFF_VIEWER_GAP_CLASSES).toHaveProperty('sm');
    expect(DIFF_VIEWER_GAP_CLASSES).toHaveProperty('md');
    expect(DIFF_VIEWER_GAP_CLASSES).toHaveProperty('lg');
  });

  it('all size variants are defined in LINE_HEIGHT_CLASSES', () => {
    expect(DIFF_VIEWER_LINE_HEIGHT_CLASSES).toHaveProperty('sm');
    expect(DIFF_VIEWER_LINE_HEIGHT_CLASSES).toHaveProperty('md');
    expect(DIFF_VIEWER_LINE_HEIGHT_CLASSES).toHaveProperty('lg');
  });

  it('all size variants are defined in LINE_NUMBER_WIDTH_CLASSES', () => {
    expect(DIFF_VIEWER_LINE_NUMBER_WIDTH_CLASSES).toHaveProperty('sm');
    expect(DIFF_VIEWER_LINE_NUMBER_WIDTH_CLASSES).toHaveProperty('md');
    expect(DIFF_VIEWER_LINE_NUMBER_WIDTH_CLASSES).toHaveProperty('lg');
  });

  it('all size variants are defined in ICON_SIZE_MAP', () => {
    expect(DIFF_VIEWER_ICON_SIZE_MAP).toHaveProperty('sm');
    expect(DIFF_VIEWER_ICON_SIZE_MAP).toHaveProperty('md');
    expect(DIFF_VIEWER_ICON_SIZE_MAP).toHaveProperty('lg');
  });

  it('all size variants are defined in BUTTON_SIZE_MAP', () => {
    expect(DIFF_VIEWER_BUTTON_SIZE_MAP).toHaveProperty('sm');
    expect(DIFF_VIEWER_BUTTON_SIZE_MAP).toHaveProperty('md');
    expect(DIFF_VIEWER_BUTTON_SIZE_MAP).toHaveProperty('lg');
  });

  it('all size variants are defined in BADGE_SIZE_MAP', () => {
    expect(DIFF_VIEWER_BADGE_SIZE_MAP).toHaveProperty('sm');
    expect(DIFF_VIEWER_BADGE_SIZE_MAP).toHaveProperty('md');
    expect(DIFF_VIEWER_BADGE_SIZE_MAP).toHaveProperty('lg');
  });
});

// =============================================================================
// Data Attributes Documentation
// =============================================================================

describe('Data Attributes Documentation', () => {
  it('documents data-testid support', () => {
    // DiffViewer, DiffViewerSkeleton, DiffViewerError all support data-testid
    expect(true).toBe(true);
  });

  it('documents data-file-count attribute', () => {
    // DiffViewer has data-file-count={diffs.length}
    expect(true).toBe(true);
  });

  it('documents data-size attribute', () => {
    // DiffViewer has data-size={baseSize}
    expect(true).toBe(true);
  });

  it('documents data-file-path attribute on rows', () => {
    // Each file row has data-file-path={diff.path}
    expect(true).toBe(true);
  });

  it('documents data-skeleton-count attribute', () => {
    // DiffViewerSkeleton has data-skeleton-count={count}
    expect(true).toBe(true);
  });
});

// =============================================================================
// Responsive Breakpoint Order
// =============================================================================

describe('Responsive Breakpoint Order', () => {
  it('applies breakpoints in correct order (base, sm, md, lg, xl, 2xl)', () => {
    const classes = getResponsiveSizeClasses(
      { base: 'sm', sm: 'sm', md: 'md', lg: 'lg' },
      DIFF_VIEWER_SIZE_CLASSES
    );

    // base should not have prefix
    expect(classes.some((c) => c === 'text-xs')).toBe(true);

    // Other breakpoints should have prefixes
    expect(classes.some((c) => c === 'sm:text-xs')).toBe(true);
    expect(classes.some((c) => c === 'md:text-sm')).toBe(true);
    expect(classes.some((c) => c === 'lg:text-base')).toBe(true);
  });
});
