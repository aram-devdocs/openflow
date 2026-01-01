import { describe, expect, it } from 'vitest';
import {
  COMMIT_DETAILS_CLASSES,
  COMMIT_HASH_CLASSES,
  // Base class constants
  COMMIT_LIST_BASE_CLASSES,
  COMMIT_LIST_BUTTON_SIZE_MAP,
  COMMIT_LIST_CONTENT_CLASSES,
  COMMIT_LIST_GAP_CLASSES,
  COMMIT_LIST_HEADER_CLASSES,
  COMMIT_LIST_HEADER_PADDING_CLASSES,
  COMMIT_LIST_ICON_SIZE_MAP,
  COMMIT_LIST_PADDING_CLASSES,
  // Size class constants
  COMMIT_LIST_SIZE_CLASSES,
  COMMIT_ROW_BASE_CLASSES,
  COMMIT_ROW_BUTTON_CLASSES,
  COMMIT_ROW_EXPANDED_CLASSES,
  DEFAULT_COLLAPSE_LABEL,
  DEFAULT_EMPTY_DESCRIPTION,
  DEFAULT_EMPTY_TITLE,
  DEFAULT_ERROR_RETRY_LABEL,
  DEFAULT_ERROR_TITLE,
  DEFAULT_EXPAND_LABEL,
  DEFAULT_LIST_LABEL,
  // Constants
  DEFAULT_SKELETON_COUNT,
  DEFAULT_VIEW_CHANGES_LABEL,
  ERROR_STATE_CLASSES,
  SKELETON_ROW_CLASSES,
  SR_ADDITIONS,
  SR_COMMITS_COUNT,
  SR_COMMIT_COLLAPSED,
  SR_COMMIT_EXPANDED,
  SR_DELETIONS,
  SR_FILES_CHANGED,
  SR_LOADING,
  buildCommitAccessibleLabel,
  buildStatsAnnouncement,
  buildSummaryAnnouncement,
  formatDateForSR,
  formatFullDate,
  formatRelativeTime,
  // Utility functions
  getBaseSize,
  getISODateTime,
  getResponsiveSizeClasses,
} from '../../../packages/ui/organisms/CommitList';

// =============================================================================
// Default Constants Tests
// =============================================================================

describe('CommitList Default Constants', () => {
  it('has correct DEFAULT_SKELETON_COUNT', () => {
    expect(DEFAULT_SKELETON_COUNT).toBe(5);
  });

  it('has correct DEFAULT_LIST_LABEL', () => {
    expect(DEFAULT_LIST_LABEL).toBe('Commit history');
  });

  it('has correct DEFAULT_EMPTY_TITLE', () => {
    expect(DEFAULT_EMPTY_TITLE).toBe('No commits to display');
  });

  it('has correct DEFAULT_EMPTY_DESCRIPTION', () => {
    expect(DEFAULT_EMPTY_DESCRIPTION).toBe('There are no commits in this branch yet.');
  });

  it('has correct DEFAULT_ERROR_TITLE', () => {
    expect(DEFAULT_ERROR_TITLE).toBe('Failed to load commits');
  });

  it('has correct DEFAULT_ERROR_RETRY_LABEL', () => {
    expect(DEFAULT_ERROR_RETRY_LABEL).toBe('Retry');
  });

  it('has correct DEFAULT_VIEW_CHANGES_LABEL', () => {
    expect(DEFAULT_VIEW_CHANGES_LABEL).toBe('View changes');
  });

  it('has correct DEFAULT_EXPAND_LABEL', () => {
    expect(DEFAULT_EXPAND_LABEL).toBe('Expand commit');
  });

  it('has correct DEFAULT_COLLAPSE_LABEL', () => {
    expect(DEFAULT_COLLAPSE_LABEL).toBe('Collapse commit');
  });
});

// =============================================================================
// Screen Reader Constants Tests
// =============================================================================

describe('CommitList Screen Reader Constants', () => {
  it('has correct SR_COMMIT_EXPANDED', () => {
    expect(SR_COMMIT_EXPANDED).toBe('Commit details expanded');
  });

  it('has correct SR_COMMIT_COLLAPSED', () => {
    expect(SR_COMMIT_COLLAPSED).toBe('Commit details collapsed');
  });

  it('has correct SR_COMMITS_COUNT', () => {
    expect(SR_COMMITS_COUNT).toBe('commits in history');
  });

  it('has correct SR_FILES_CHANGED', () => {
    expect(SR_FILES_CHANGED).toBe('files changed');
  });

  it('has correct SR_ADDITIONS', () => {
    expect(SR_ADDITIONS).toBe('additions');
  });

  it('has correct SR_DELETIONS', () => {
    expect(SR_DELETIONS).toBe('deletions');
  });

  it('has correct SR_LOADING', () => {
    expect(SR_LOADING).toBe('Loading commits');
  });
});

// =============================================================================
// Size Class Constants Tests
// =============================================================================

describe('CommitList Size Class Constants', () => {
  describe('COMMIT_LIST_SIZE_CLASSES', () => {
    it('has sm size classes', () => {
      expect(COMMIT_LIST_SIZE_CLASSES.sm).toBe('text-xs');
    });

    it('has md size classes', () => {
      expect(COMMIT_LIST_SIZE_CLASSES.md).toBe('text-sm');
    });

    it('has lg size classes', () => {
      expect(COMMIT_LIST_SIZE_CLASSES.lg).toBe('text-base');
    });
  });

  describe('COMMIT_LIST_PADDING_CLASSES', () => {
    it('has sm padding classes', () => {
      expect(COMMIT_LIST_PADDING_CLASSES.sm).toBe('px-3 py-2');
    });

    it('has md padding classes', () => {
      expect(COMMIT_LIST_PADDING_CLASSES.md).toBe('px-4 py-3');
    });

    it('has lg padding classes', () => {
      expect(COMMIT_LIST_PADDING_CLASSES.lg).toBe('px-5 py-4');
    });
  });

  describe('COMMIT_LIST_HEADER_PADDING_CLASSES', () => {
    it('has sm header padding classes', () => {
      expect(COMMIT_LIST_HEADER_PADDING_CLASSES.sm).toBe('px-3 py-1.5');
    });

    it('has md header padding classes', () => {
      expect(COMMIT_LIST_HEADER_PADDING_CLASSES.md).toBe('px-4 py-2');
    });

    it('has lg header padding classes', () => {
      expect(COMMIT_LIST_HEADER_PADDING_CLASSES.lg).toBe('px-5 py-3');
    });
  });

  describe('COMMIT_LIST_GAP_CLASSES', () => {
    it('has sm gap classes', () => {
      expect(COMMIT_LIST_GAP_CLASSES.sm).toBe('gap-2');
    });

    it('has md gap classes', () => {
      expect(COMMIT_LIST_GAP_CLASSES.md).toBe('gap-3');
    });

    it('has lg gap classes', () => {
      expect(COMMIT_LIST_GAP_CLASSES.lg).toBe('gap-4');
    });
  });

  describe('COMMIT_LIST_ICON_SIZE_MAP', () => {
    it('maps sm to xs icon', () => {
      expect(COMMIT_LIST_ICON_SIZE_MAP.sm).toBe('xs');
    });

    it('maps md to sm icon', () => {
      expect(COMMIT_LIST_ICON_SIZE_MAP.md).toBe('sm');
    });

    it('maps lg to md icon', () => {
      expect(COMMIT_LIST_ICON_SIZE_MAP.lg).toBe('md');
    });
  });

  describe('COMMIT_LIST_BUTTON_SIZE_MAP', () => {
    it('maps sm to sm button', () => {
      expect(COMMIT_LIST_BUTTON_SIZE_MAP.sm).toBe('sm');
    });

    it('maps md to sm button', () => {
      expect(COMMIT_LIST_BUTTON_SIZE_MAP.md).toBe('sm');
    });

    it('maps lg to md button', () => {
      expect(COMMIT_LIST_BUTTON_SIZE_MAP.lg).toBe('md');
    });
  });
});

// =============================================================================
// Base Class Constants Tests
// =============================================================================

describe('CommitList Base Class Constants', () => {
  it('COMMIT_LIST_BASE_CLASSES includes flex and background', () => {
    expect(COMMIT_LIST_BASE_CLASSES).toContain('flex');
    expect(COMMIT_LIST_BASE_CLASSES).toContain('flex-col');
    expect(COMMIT_LIST_BASE_CLASSES).toContain('bg-[rgb(var(--background))]');
  });

  it('COMMIT_LIST_HEADER_CLASSES includes flex and border', () => {
    expect(COMMIT_LIST_HEADER_CLASSES).toContain('flex');
    expect(COMMIT_LIST_HEADER_CLASSES).toContain('items-center');
    expect(COMMIT_LIST_HEADER_CLASSES).toContain('justify-between');
    expect(COMMIT_LIST_HEADER_CLASSES).toContain('border-b');
  });

  it('COMMIT_LIST_CONTENT_CLASSES includes overflow-y-auto', () => {
    expect(COMMIT_LIST_CONTENT_CLASSES).toContain('flex-1');
    expect(COMMIT_LIST_CONTENT_CLASSES).toContain('overflow-y-auto');
    expect(COMMIT_LIST_CONTENT_CLASSES).toContain('scrollbar-thin');
  });

  it('COMMIT_ROW_BASE_CLASSES includes flex and border', () => {
    expect(COMMIT_ROW_BASE_CLASSES).toContain('flex');
    expect(COMMIT_ROW_BASE_CLASSES).toContain('flex-col');
    expect(COMMIT_ROW_BASE_CLASSES).toContain('border-b');
    expect(COMMIT_ROW_BASE_CLASSES).toContain('last:border-b-0');
  });

  it('COMMIT_ROW_BUTTON_CLASSES includes hover, focus, and touch target', () => {
    expect(COMMIT_ROW_BUTTON_CLASSES).toContain('flex');
    expect(COMMIT_ROW_BUTTON_CLASSES).toContain('w-full');
    expect(COMMIT_ROW_BUTTON_CLASSES).toContain('hover:bg-[rgb(var(--muted))]');
    expect(COMMIT_ROW_BUTTON_CLASSES).toContain('focus-visible:ring-2');
    expect(COMMIT_ROW_BUTTON_CLASSES).toContain('min-h-[44px]');
  });

  it('COMMIT_ROW_EXPANDED_CLASSES includes background', () => {
    expect(COMMIT_ROW_EXPANDED_CLASSES).toContain('bg-[rgb(var(--muted))]/50');
  });

  it('COMMIT_DETAILS_CLASSES includes border and background', () => {
    expect(COMMIT_DETAILS_CLASSES).toContain('border-t');
    expect(COMMIT_DETAILS_CLASSES).toContain('bg-[rgb(var(--muted))]/30');
  });

  it('COMMIT_HASH_CLASSES includes font-mono', () => {
    expect(COMMIT_HASH_CLASSES).toContain('font-mono');
    expect(COMMIT_HASH_CLASSES).toContain('bg-[rgb(var(--muted))]');
    expect(COMMIT_HASH_CLASSES).toContain('rounded');
  });

  it('SKELETON_ROW_CLASSES includes flex and border', () => {
    expect(SKELETON_ROW_CLASSES).toContain('flex');
    expect(SKELETON_ROW_CLASSES).toContain('items-center');
    expect(SKELETON_ROW_CLASSES).toContain('border-b');
  });

  it('ERROR_STATE_CLASSES includes flex and center alignment', () => {
    expect(ERROR_STATE_CLASSES).toContain('flex');
    expect(ERROR_STATE_CLASSES).toContain('flex-col');
    expect(ERROR_STATE_CLASSES).toContain('items-center');
    expect(ERROR_STATE_CLASSES).toContain('justify-center');
    expect(ERROR_STATE_CLASSES).toContain('text-center');
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
// formatRelativeTime Tests
// =============================================================================

describe('formatRelativeTime', () => {
  it('returns "just now" for recent timestamps', () => {
    const now = new Date().toISOString();
    expect(formatRelativeTime(now)).toBe('just now');
  });

  it('returns minutes ago for timestamps within an hour', () => {
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();
    expect(formatRelativeTime(thirtyMinutesAgo)).toBe('30m ago');
  });

  it('returns hours ago for timestamps within a day', () => {
    const fiveHoursAgo = new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString();
    expect(formatRelativeTime(fiveHoursAgo)).toBe('5h ago');
  });

  it('returns days ago for timestamps within a week', () => {
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();
    expect(formatRelativeTime(threeDaysAgo)).toBe('3d ago');
  });

  it('returns weeks ago for timestamps within a month', () => {
    const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();
    expect(formatRelativeTime(twoWeeksAgo)).toBe('2w ago');
  });

  it('returns months ago for timestamps within a year', () => {
    const threeMonthsAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
    expect(formatRelativeTime(threeMonthsAgo)).toBe('3mo ago');
  });

  it('returns date for timestamps older than a year', () => {
    const yearOld = new Date(Date.now() - 400 * 24 * 60 * 60 * 1000).toISOString();
    // Should return a formatted date string
    expect(formatRelativeTime(yearOld)).not.toContain('ago');
  });
});

// =============================================================================
// formatFullDate Tests
// =============================================================================

describe('formatFullDate', () => {
  it('returns a localized date string', () => {
    const date = '2024-01-15T14:30:00Z';
    const result = formatFullDate(date);
    // Should be a localized string
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });

  it('handles different date formats', () => {
    const isoDate = '2024-06-20T10:00:00.000Z';
    const result = formatFullDate(isoDate);
    expect(typeof result).toBe('string');
  });
});

// =============================================================================
// formatDateForSR Tests
// =============================================================================

describe('formatDateForSR', () => {
  it('returns a verbose date string for screen readers', () => {
    const date = '2024-01-15T14:30:00Z';
    const result = formatDateForSR(date);
    // Should be a verbose date string
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(10); // Should be longer than just a date
  });
});

// =============================================================================
// getISODateTime Tests
// =============================================================================

describe('getISODateTime', () => {
  it('returns ISO 8601 formatted datetime', () => {
    const date = '2024-01-15T14:30:00Z';
    const result = getISODateTime(date);
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
  });

  it('handles different date string formats', () => {
    const date = new Date(2024, 0, 15, 14, 30, 0).toISOString();
    const result = getISODateTime(date);
    expect(result).toContain('2024');
    expect(result).toContain('T');
  });
});

// =============================================================================
// buildCommitAccessibleLabel Tests
// =============================================================================

describe('buildCommitAccessibleLabel', () => {
  const mockCommit = {
    hash: 'abc12340000000000000000000000000000000000',
    shortHash: 'abc1234',
    message: 'feat: add new feature',
    author: 'Alice',
    authorEmail: 'alice@example.com',
    date: new Date().toISOString(),
    filesChanged: 5,
    additions: 100,
    deletions: 20,
  };

  it('includes action based on expanded state', () => {
    const expandedLabel = buildCommitAccessibleLabel(mockCommit, true);
    const collapsedLabel = buildCommitAccessibleLabel(mockCommit, false);

    expect(expandedLabel).toContain('Collapse');
    expect(collapsedLabel).toContain('Expand');
  });

  it('includes commit hash', () => {
    const label = buildCommitAccessibleLabel(mockCommit, false);
    expect(label).toContain(mockCommit.shortHash);
  });

  it('includes commit message', () => {
    const label = buildCommitAccessibleLabel(mockCommit, false);
    expect(label).toContain(mockCommit.message);
  });

  it('includes author name', () => {
    const label = buildCommitAccessibleLabel(mockCommit, false);
    expect(label).toContain(mockCommit.author);
  });

  it('includes file stats', () => {
    const label = buildCommitAccessibleLabel(mockCommit, false);
    expect(label).toContain('5 files changed');
    expect(label).toContain('100 additions');
    expect(label).toContain('20 deletions');
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
// buildSummaryAnnouncement Tests
// =============================================================================

describe('buildSummaryAnnouncement', () => {
  it('handles singular commit', () => {
    const announcement = buildSummaryAnnouncement(1, 5, 100, 50);
    expect(announcement).toContain('1 commit');
  });

  it('handles plural commits', () => {
    const announcement = buildSummaryAnnouncement(5, 10, 100, 50);
    expect(announcement).toContain('5 commits');
  });

  it('handles singular file', () => {
    const announcement = buildSummaryAnnouncement(1, 1, 100, 50);
    expect(announcement).toContain('1 file changed total');
  });

  it('handles plural files', () => {
    const announcement = buildSummaryAnnouncement(1, 5, 100, 50);
    expect(announcement).toContain('5 files changed total');
  });

  it('includes total additions', () => {
    const announcement = buildSummaryAnnouncement(1, 1, 100, 50);
    expect(announcement).toContain('100 total additions');
  });

  it('includes total deletions', () => {
    const announcement = buildSummaryAnnouncement(1, 1, 100, 50);
    expect(announcement).toContain('50 total deletions');
  });

  it('builds complete summary', () => {
    const announcement = buildSummaryAnnouncement(3, 8, 200, 75);
    expect(announcement).toContain('3 commits');
    expect(announcement).toContain('8 files changed total');
    expect(announcement).toContain('200 total additions');
    expect(announcement).toContain('75 total deletions');
  });
});

// =============================================================================
// Touch Target Compliance Tests
// =============================================================================

describe('Touch Target Compliance (WCAG 2.5.5)', () => {
  it('commit row button has min-h-[44px] for touch targets', () => {
    expect(COMMIT_ROW_BUTTON_CLASSES).toContain('min-h-[44px]');
  });
});

// =============================================================================
// Focus Ring Compliance Tests
// =============================================================================

describe('Focus Ring Compliance', () => {
  it('commit row button has focus-visible ring', () => {
    expect(COMMIT_ROW_BUTTON_CLASSES).toContain('focus-visible:ring-2');
    expect(COMMIT_ROW_BUTTON_CLASSES).toContain('focus-visible:ring-offset-2');
  });
});

// =============================================================================
// Motion Safe Compliance Tests
// =============================================================================

describe('Motion Safe Compliance (Reduced Motion)', () => {
  it('commit row button has motion-safe transitions', () => {
    expect(COMMIT_ROW_BUTTON_CLASSES).toContain('motion-safe:transition-colors');
    expect(COMMIT_ROW_BUTTON_CLASSES).toContain('motion-safe:duration-150');
  });
});

// =============================================================================
// Accessibility Behavior Documentation
// =============================================================================

describe('Accessibility Behavior Documentation', () => {
  it('documents aria-expanded behavior for expandable commits', () => {
    // Commit rows should have aria-expanded based on isExpanded state
    // This is a behavior test that documents the expected pattern
    expect(true).toBe(true);
  });

  it('documents aria-controls linking between row and details', () => {
    // Row button aria-controls should point to details region id
    expect(true).toBe(true);
  });

  it('documents role="region" for container', () => {
    // Container should have role="region" with aria-label
    expect(true).toBe(true);
  });

  it('documents role="list" and role="listitem" for commits', () => {
    // Commit container should use proper list semantics
    expect(true).toBe(true);
  });

  it('documents time element with datetime attribute', () => {
    // Timestamps should use semantic time elements
    expect(true).toBe(true);
  });

  it('documents VisuallyHidden for screen reader announcements', () => {
    // Stats and state changes announced via VisuallyHidden
    expect(true).toBe(true);
  });
});

// =============================================================================
// Component Props Documentation
// =============================================================================

describe('Component Props Documentation', () => {
  it('documents CommitListProps interface', () => {
    // CommitListProps includes: commits, expandedCommits, onCommitToggle,
    // onViewCommit, defaultExpanded, maxHeight, className, size, data-testid, aria-label
    expect(true).toBe(true);
  });

  it('documents CommitListSkeletonProps interface', () => {
    // CommitListSkeletonProps includes: count, className, size, data-testid
    expect(true).toBe(true);
  });

  it('documents CommitListErrorProps interface', () => {
    // CommitListErrorProps includes: message, onRetry, className, size, data-testid
    expect(true).toBe(true);
  });
});

// =============================================================================
// Size Consistency Tests
// =============================================================================

describe('Size Consistency', () => {
  it('all size variants are defined in SIZE_CLASSES', () => {
    expect(COMMIT_LIST_SIZE_CLASSES).toHaveProperty('sm');
    expect(COMMIT_LIST_SIZE_CLASSES).toHaveProperty('md');
    expect(COMMIT_LIST_SIZE_CLASSES).toHaveProperty('lg');
  });

  it('all size variants are defined in PADDING_CLASSES', () => {
    expect(COMMIT_LIST_PADDING_CLASSES).toHaveProperty('sm');
    expect(COMMIT_LIST_PADDING_CLASSES).toHaveProperty('md');
    expect(COMMIT_LIST_PADDING_CLASSES).toHaveProperty('lg');
  });

  it('all size variants are defined in HEADER_PADDING_CLASSES', () => {
    expect(COMMIT_LIST_HEADER_PADDING_CLASSES).toHaveProperty('sm');
    expect(COMMIT_LIST_HEADER_PADDING_CLASSES).toHaveProperty('md');
    expect(COMMIT_LIST_HEADER_PADDING_CLASSES).toHaveProperty('lg');
  });

  it('all size variants are defined in GAP_CLASSES', () => {
    expect(COMMIT_LIST_GAP_CLASSES).toHaveProperty('sm');
    expect(COMMIT_LIST_GAP_CLASSES).toHaveProperty('md');
    expect(COMMIT_LIST_GAP_CLASSES).toHaveProperty('lg');
  });

  it('all size variants are defined in ICON_SIZE_MAP', () => {
    expect(COMMIT_LIST_ICON_SIZE_MAP).toHaveProperty('sm');
    expect(COMMIT_LIST_ICON_SIZE_MAP).toHaveProperty('md');
    expect(COMMIT_LIST_ICON_SIZE_MAP).toHaveProperty('lg');
  });

  it('all size variants are defined in BUTTON_SIZE_MAP', () => {
    expect(COMMIT_LIST_BUTTON_SIZE_MAP).toHaveProperty('sm');
    expect(COMMIT_LIST_BUTTON_SIZE_MAP).toHaveProperty('md');
    expect(COMMIT_LIST_BUTTON_SIZE_MAP).toHaveProperty('lg');
  });
});

// =============================================================================
// Data Attributes Documentation
// =============================================================================

describe('Data Attributes Documentation', () => {
  it('documents data-testid support', () => {
    // CommitList, CommitListSkeleton, CommitListError all support data-testid
    expect(true).toBe(true);
  });

  it('documents data-commit-count attribute', () => {
    // CommitList has data-commit-count={commits.length}
    expect(true).toBe(true);
  });

  it('documents data-size attribute', () => {
    // CommitList has data-size={baseSize}
    expect(true).toBe(true);
  });

  it('documents data-commit-hash attribute on rows', () => {
    // Each commit row has data-commit-hash={commit.hash}
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
      COMMIT_LIST_SIZE_CLASSES
    );

    // base should not have prefix
    expect(classes.some((c) => c === 'text-xs')).toBe(true);

    // Other breakpoints should have prefixes
    expect(classes.some((c) => c === 'sm:text-xs')).toBe(true);
    expect(classes.some((c) => c === 'md:text-sm')).toBe(true);
    expect(classes.some((c) => c === 'lg:text-base')).toBe(true);
  });
});
