import type { Commit } from '@openflow/generated';
import type { Meta, StoryObj } from '@storybook/react';
import { fn } from '@storybook/test';
import { useState } from 'react';
import {
  CommitList,
  CommitListError,
  CommitListSkeleton,
  DEFAULT_EMPTY_DESCRIPTION,
  DEFAULT_EMPTY_TITLE,
  DEFAULT_ERROR_RETRY_LABEL,
  DEFAULT_ERROR_TITLE,
  DEFAULT_LIST_LABEL,
  DEFAULT_SKELETON_COUNT,
  DEFAULT_VIEW_CHANGES_LABEL,
} from './CommitList';

const meta = {
  title: 'Organisms/CommitList',
  component: CommitList,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  args: {
    onCommitToggle: fn(),
    onViewCommit: fn(),
  },
  decorators: [
    (Story) => (
      <div className="h-[500px] w-full max-w-3xl border border-[rgb(var(--border))] rounded-lg overflow-hidden">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof CommitList>;

export default meta;
type Story = StoryObj<typeof meta>;

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Create a mock commit for testing
 */
function createCommit(
  shortHash: string,
  message: string,
  author: string,
  daysAgo: number,
  filesChanged: number,
  additions: number,
  deletions: number
): Commit {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);

  return {
    hash: `${shortHash}${'0'.repeat(33)}`,
    shortHash,
    message,
    author,
    authorEmail: `${author.toLowerCase().replace(' ', '.')}@example.com`,
    date: date.toISOString(),
    filesChanged,
    additions,
    deletions,
  };
}

// =============================================================================
// Sample Data
// =============================================================================

const firstCommit: Commit = createCommit(
  'abc1234',
  'feat: add user authentication with JWT tokens',
  'Alice Chen',
  0,
  8,
  245,
  12
);

const sampleCommits: Commit[] = [
  firstCommit,
  createCommit(
    'def5678',
    'fix: resolve race condition in data fetching',
    'Bob Smith',
    1,
    3,
    45,
    23
  ),
  createCommit(
    'ghi9012',
    'refactor: extract common utilities to shared module',
    'Carol Davis',
    2,
    12,
    180,
    156
  ),
  createCommit(
    'jkl3456',
    'docs: update API documentation with examples',
    'David Wilson',
    3,
    5,
    89,
    15
  ),
  createCommit('mno7890', 'test: add integration tests for auth flow', 'Eve Johnson', 5, 4, 312, 8),
  createCommit(
    'pqr1234',
    'chore: update dependencies to latest versions',
    'Frank Miller',
    7,
    2,
    45,
    45
  ),
];

const longMessageCommit: Commit = createCommit(
  'xyz9999',
  'feat(auth): implement OAuth2 with Google and GitHub providers including refresh token rotation and session management',
  'Grace Lee',
  1,
  15,
  520,
  45
);

const recentCommit: Commit = {
  ...createCommit('rec1111', 'fix: quick typo fix', 'Henry Brown', 0, 1, 1, 1),
  date: new Date(Date.now() - 5 * 60 * 1000).toISOString(), // 5 minutes ago
};

const oldCommit: Commit = createCommit(
  'old2222',
  'Initial commit',
  'Initial Author',
  365,
  50,
  2500,
  0
);

// =============================================================================
// Interactive Component
// =============================================================================

function InteractiveCommitList({
  commits,
  size,
}: {
  commits: Commit[];
  size?: 'sm' | 'md' | 'lg';
}) {
  const [expandedCommits, setExpandedCommits] = useState<Set<string>>(new Set());

  const handleToggle = (hash: string) => {
    setExpandedCommits((prev) => {
      const next = new Set(prev);
      if (next.has(hash)) {
        next.delete(hash);
      } else {
        next.add(hash);
      }
      return next;
    });
  };

  const handleViewCommit = (hash: string) => {
    alert(`View changes for commit: ${hash}`);
  };

  return (
    <CommitList
      commits={commits}
      expandedCommits={expandedCommits}
      onCommitToggle={handleToggle}
      onViewCommit={handleViewCommit}
      size={size}
    />
  );
}

// =============================================================================
// Basic Stories
// =============================================================================

/**
 * Default commit list with multiple commits
 */
export const Default: Story = {
  args: {
    commits: sampleCommits,
  },
};

/**
 * Interactive commit list with controlled expand/collapse state
 */
export const Interactive: Story = {
  args: {
    commits: sampleCommits,
  },
  render: (args) => <InteractiveCommitList commits={args.commits} />,
};

/**
 * Commit list with all commits expanded by default
 */
export const AllExpanded: Story = {
  args: {
    commits: sampleCommits.slice(0, 3),
    defaultExpanded: true,
  },
};

/**
 * Single commit
 */
export const SingleCommit: Story = {
  args: {
    commits: [firstCommit],
    defaultExpanded: true,
  },
};

/**
 * Commit with a long message (truncated in header, full in details)
 */
export const LongMessage: Story = {
  args: {
    commits: [longMessageCommit, ...sampleCommits.slice(0, 2)],
    defaultExpanded: false,
  },
};

// =============================================================================
// Time Format Stories
// =============================================================================

/**
 * Very recent commit (shows "just now" or minutes ago)
 */
export const RecentCommit: Story = {
  args: {
    commits: [recentCommit, ...sampleCommits.slice(0, 3)],
    defaultExpanded: false,
  },
};

/**
 * Old commit (shows date instead of relative time)
 */
export const OldCommit: Story = {
  args: {
    commits: [oldCommit],
    defaultExpanded: true,
  },
};

// =============================================================================
// Size Variants
// =============================================================================

/**
 * Small size variant
 */
export const SizeSmall: Story = {
  args: {
    commits: sampleCommits.slice(0, 3),
    size: 'sm',
    defaultExpanded: true,
  },
};

/**
 * Medium size variant (default)
 */
export const SizeMedium: Story = {
  args: {
    commits: sampleCommits.slice(0, 3),
    size: 'md',
    defaultExpanded: true,
  },
};

/**
 * Large size variant
 */
export const SizeLarge: Story = {
  args: {
    commits: sampleCommits.slice(0, 3),
    size: 'lg',
    defaultExpanded: true,
  },
};

/**
 * All sizes comparison
 */
export const AllSizes: Story = {
  args: {
    commits: sampleCommits.slice(0, 2),
  },
  render: (args) => (
    <div className="flex flex-col gap-8">
      <div>
        <h3 className="text-sm font-medium mb-2">Small</h3>
        <div className="border border-[rgb(var(--border))] rounded-lg overflow-hidden">
          <CommitList {...args} size="sm" />
        </div>
      </div>
      <div>
        <h3 className="text-sm font-medium mb-2">Medium</h3>
        <div className="border border-[rgb(var(--border))] rounded-lg overflow-hidden">
          <CommitList {...args} size="md" />
        </div>
      </div>
      <div>
        <h3 className="text-sm font-medium mb-2">Large</h3>
        <div className="border border-[rgb(var(--border))] rounded-lg overflow-hidden">
          <CommitList {...args} size="lg" />
        </div>
      </div>
    </div>
  ),
  decorators: [
    (Story) => (
      <div className="w-full max-w-3xl">
        <Story />
      </div>
    ),
  ],
};

/**
 * Responsive sizing - changes size based on viewport
 */
export const ResponsiveSizing: Story = {
  args: {
    commits: sampleCommits.slice(0, 3),
    size: { base: 'sm', md: 'md', lg: 'lg' },
    defaultExpanded: true,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Resize the viewport to see size changes: sm on mobile, md on tablet, lg on desktop.',
      },
    },
  },
};

// =============================================================================
// Stats Variations
// =============================================================================

/**
 * Large additions (new feature)
 */
export const LargeAdditions: Story = {
  args: {
    commits: [
      createCommit(
        'big1234',
        'feat: implement complete dashboard module',
        'Developer',
        1,
        25,
        1500,
        50
      ),
    ],
    defaultExpanded: true,
  },
};

/**
 * Large deletions (cleanup/refactor)
 */
export const LargeDeletions: Story = {
  args: {
    commits: [
      createCommit(
        'del1234',
        'refactor: remove deprecated legacy code',
        'Developer',
        1,
        30,
        100,
        2500
      ),
    ],
    defaultExpanded: true,
  },
};

/**
 * Single file change
 */
export const SingleFileChange: Story = {
  args: {
    commits: [createCommit('one1234', 'fix: correct typo in README', 'Developer', 0, 1, 1, 1)],
    defaultExpanded: true,
  },
};

// =============================================================================
// States
// =============================================================================

/**
 * Empty commit list
 */
export const Empty: Story = {
  args: {
    commits: [],
  },
  parameters: {
    docs: {
      description: {
        story: `Shows empty state with title "${DEFAULT_EMPTY_TITLE}" and description "${DEFAULT_EMPTY_DESCRIPTION}".`,
      },
    },
  },
};

/**
 * Loading skeleton
 */
export const Loading: Story = {
  args: {
    commits: [],
  },
  render: () => (
    <CommitListSkeleton count={DEFAULT_SKELETON_COUNT} data-testid="commit-list-skeleton" />
  ),
  parameters: {
    docs: {
      description: {
        story: `Shows ${DEFAULT_SKELETON_COUNT} skeleton items by default.`,
      },
    },
  },
};

/**
 * Loading skeleton with custom count
 */
export const LoadingCustomCount: Story = {
  args: {
    commits: [],
  },
  render: () => <CommitListSkeleton count={3} size="md" />,
};

/**
 * Loading skeleton sizes
 */
export const LoadingAllSizes: Story = {
  args: {
    commits: [],
  },
  render: () => (
    <div className="flex flex-col gap-8">
      <div>
        <h3 className="text-sm font-medium mb-2">Small</h3>
        <CommitListSkeleton count={2} size="sm" />
      </div>
      <div>
        <h3 className="text-sm font-medium mb-2">Medium</h3>
        <CommitListSkeleton count={2} size="md" />
      </div>
      <div>
        <h3 className="text-sm font-medium mb-2">Large</h3>
        <CommitListSkeleton count={2} size="lg" />
      </div>
    </div>
  ),
  decorators: [
    (Story) => (
      <div className="w-full max-w-3xl">
        <Story />
      </div>
    ),
  ],
};

/**
 * Error state
 */
export const ErrorState: Story = {
  args: {
    commits: [],
  },
  render: () => (
    <CommitListError
      message="Unable to fetch commits from the repository."
      onRetry={() => alert('Retry clicked')}
      data-testid="commit-list-error"
    />
  ),
  parameters: {
    docs: {
      description: {
        story: `Shows error state with title "${DEFAULT_ERROR_TITLE}" and "${DEFAULT_ERROR_RETRY_LABEL}" button.`,
      },
    },
  },
};

/**
 * Error state without retry
 */
export const ErrorNoRetry: Story = {
  args: {
    commits: [],
  },
  render: () => (
    <CommitListError message="Repository access denied." data-testid="commit-list-error" />
  ),
};

// =============================================================================
// Layout Variations
// =============================================================================

/**
 * Commit list with max height constraint
 */
export const WithMaxHeight: Story = {
  args: {
    commits: [...sampleCommits, longMessageCommit, oldCommit],
    maxHeight: '300px',
  },
  decorators: [
    (Story) => (
      <div className="w-full max-w-3xl">
        <Story />
      </div>
    ),
  ],
};

/**
 * Many commits (scrollable list)
 */
export const ManyCommits: Story = {
  args: {
    commits: [
      ...sampleCommits,
      ...sampleCommits.map((c) => ({
        ...c,
        hash: `2${c.hash.slice(1)}`,
        shortHash: `2${c.shortHash.slice(1)}`,
      })),
      ...sampleCommits.map((c) => ({
        ...c,
        hash: `3${c.hash.slice(1)}`,
        shortHash: `3${c.shortHash.slice(1)}`,
      })),
    ],
    maxHeight: '400px',
  },
};

// =============================================================================
// Controlled State
// =============================================================================

/**
 * Controlled state with first commit expanded
 */
export const ControlledFirstExpanded: Story = {
  args: {
    commits: sampleCommits,
    expandedCommits: new Set(['abc12340000000000000000000000000000000000']),
  },
};

/**
 * Without view commit callback (hides the button)
 */
export const NoViewCallback: Story = {
  args: {
    commits: sampleCommits.slice(0, 3),
    defaultExpanded: true,
    onViewCommit: undefined,
  },
  parameters: {
    docs: {
      description: {
        story: `When onViewCommit is not provided, the "${DEFAULT_VIEW_CHANGES_LABEL}" button is hidden.`,
      },
    },
  },
};

// =============================================================================
// Accessibility
// =============================================================================

/**
 * Keyboard navigation demo
 */
export const KeyboardNavigation: Story = {
  args: {
    commits: sampleCommits.slice(0, 3),
  },
  render: (args) => <InteractiveCommitList commits={args.commits} />,
  parameters: {
    docs: {
      description: {
        story: `
Use keyboard to navigate:
- **Tab**: Move focus between commit rows
- **Enter/Space**: Expand/collapse commit details
- Commit rows have proper \`aria-expanded\` and \`aria-controls\` attributes
        `,
      },
    },
  },
};

/**
 * Screen reader accessibility demo
 */
export const ScreenReaderAccessibility: Story = {
  args: {
    commits: sampleCommits.slice(0, 2),
    defaultExpanded: true,
  },
  parameters: {
    docs: {
      description: {
        story: `
Screen reader features:
- Container has \`role="region"\` with \`aria-label="${DEFAULT_LIST_LABEL}"\`
- List uses \`role="list"\` with \`role="listitem"\` for each commit
- Each row has comprehensive \`aria-label\` describing the commit
- Commit details have \`role="region"\` with descriptive labels
- Time elements have \`datetime\` attributes and screen reader labels
- Stats are announced via VisuallyHidden text
- State changes (expand/collapse) are announced via \`aria-live\`
        `,
      },
    },
  },
};

/**
 * Focus ring visibility demo
 */
export const FocusRingVisibility: Story = {
  args: {
    commits: sampleCommits.slice(0, 3),
  },
  parameters: {
    docs: {
      description: {
        story:
          'Tab through commit rows to see the focus ring with ring-offset for visibility on all backgrounds.',
      },
    },
  },
};

/**
 * Touch target accessibility demo
 */
export const TouchTargetAccessibility: Story = {
  args: {
    commits: sampleCommits.slice(0, 2),
    defaultExpanded: true,
    size: 'sm',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Even at small size, commit rows maintain ≥44px touch targets for WCAG 2.5.5 compliance.',
      },
    },
  },
};

// =============================================================================
// Ref and Test ID
// =============================================================================

/**
 * With forwardRef
 */
export const WithForwardRef: Story = {
  args: {
    commits: sampleCommits.slice(0, 2),
  },
  render: (args) => {
    const handleRef = (ref: HTMLDivElement | null) => {
      if (ref) {
        console.log('CommitList ref:', ref);
        console.log('Commit count:', ref.dataset.commitCount);
      }
    };
    return <CommitList {...args} ref={handleRef} />;
  },
  parameters: {
    docs: {
      description: {
        story: 'CommitList supports forwardRef. Check console for ref logging.',
      },
    },
  },
};

/**
 * With data-testid
 */
export const WithTestId: Story = {
  args: {
    commits: sampleCommits.slice(0, 2),
    'data-testid': 'commit-list',
  },
  parameters: {
    docs: {
      description: {
        story:
          'CommitList, CommitListSkeleton, and CommitListError all support data-testid for automated testing.',
      },
    },
  },
};

// =============================================================================
// Real-World Examples
// =============================================================================

/**
 * PR commit history
 */
export const PRCommitHistory: Story = {
  args: {
    commits: [
      createCommit(
        'feat001',
        'feat(ui): add new dashboard widget layout',
        'Sarah Developer',
        0,
        5,
        234,
        12
      ),
      createCommit(
        'fix002',
        'fix: correct widget alignment on mobile',
        'Sarah Developer',
        0,
        2,
        15,
        8
      ),
      createCommit(
        'refac03',
        'refactor: extract widget config to separate file',
        'Sarah Developer',
        0,
        3,
        45,
        42
      ),
      createCommit(
        'test04',
        'test: add unit tests for widget components',
        'Sarah Developer',
        0,
        4,
        120,
        0
      ),
    ],
    'aria-label': 'Pull request #123 commits',
  },
  render: (args) => <InteractiveCommitList commits={args.commits} />,
  parameters: {
    docs: {
      description: {
        story: 'A typical pull request with multiple commits from the same author.',
      },
    },
  },
};

/**
 * Branch comparison
 */
export const BranchComparison: Story = {
  args: {
    commits: sampleCommits,
    'aria-label': 'Commits ahead of main branch',
    maxHeight: '350px',
  },
  render: (args) => (
    <div className="space-y-4">
      <div className="text-sm text-[rgb(var(--muted-foreground))]">
        feature/new-dashboard is <strong>6 commits</strong> ahead of main
      </div>
      <InteractiveCommitList commits={args.commits} />
    </div>
  ),
  decorators: [
    (Story) => (
      <div className="w-full max-w-3xl">
        <Story />
      </div>
    ),
  ],
};

/**
 * Loading transition demo
 */
export const LoadingTransitionDemo: Story = {
  args: {
    commits: sampleCommits,
  },
  render: (args) => {
    const [isLoading, setIsLoading] = useState(true);
    const [hasError, setHasError] = useState(false);

    const handleRetry = () => {
      setHasError(false);
      setIsLoading(true);
      setTimeout(() => setIsLoading(false), 1500);
    };

    return (
      <div className="space-y-4">
        <div className="flex gap-2">
          <button
            type="button"
            className="px-3 py-1 text-sm bg-[rgb(var(--primary))] text-[rgb(var(--primary-foreground))] rounded"
            onClick={() => {
              setHasError(false);
              setIsLoading(true);
              setTimeout(() => setIsLoading(false), 1500);
            }}
          >
            Load Commits
          </button>
          <button
            type="button"
            className="px-3 py-1 text-sm bg-[rgb(var(--destructive))] text-[rgb(var(--destructive-foreground))] rounded"
            onClick={() => {
              setIsLoading(false);
              setHasError(true);
            }}
          >
            Simulate Error
          </button>
        </div>
        {isLoading ? (
          <CommitListSkeleton count={4} />
        ) : hasError ? (
          <CommitListError
            message="Failed to load commits from the repository."
            onRetry={handleRetry}
          />
        ) : (
          <InteractiveCommitList commits={args.commits} />
        )}
      </div>
    );
  },
  decorators: [
    (Story) => (
      <div className="w-full max-w-3xl">
        <Story />
      </div>
    ),
  ],
};

// =============================================================================
// Constants Reference
// =============================================================================

/**
 * Constants reference
 */
export const ConstantsReference: Story = {
  args: {
    commits: [],
  },
  render: () => (
    <div className="space-y-4 text-sm">
      <h3 className="font-medium">Default Constants</h3>
      <dl className="grid grid-cols-2 gap-2">
        <dt className="font-mono text-xs">DEFAULT_SKELETON_COUNT</dt>
        <dd>{DEFAULT_SKELETON_COUNT}</dd>
        <dt className="font-mono text-xs">DEFAULT_LIST_LABEL</dt>
        <dd>"{DEFAULT_LIST_LABEL}"</dd>
        <dt className="font-mono text-xs">DEFAULT_EMPTY_TITLE</dt>
        <dd>"{DEFAULT_EMPTY_TITLE}"</dd>
        <dt className="font-mono text-xs">DEFAULT_ERROR_TITLE</dt>
        <dd>"{DEFAULT_ERROR_TITLE}"</dd>
        <dt className="font-mono text-xs">DEFAULT_ERROR_RETRY_LABEL</dt>
        <dd>"{DEFAULT_ERROR_RETRY_LABEL}"</dd>
        <dt className="font-mono text-xs">DEFAULT_VIEW_CHANGES_LABEL</dt>
        <dd>"{DEFAULT_VIEW_CHANGES_LABEL}"</dd>
      </dl>
    </div>
  ),
  decorators: [
    (Story) => (
      <div className="p-4 border border-[rgb(var(--border))] rounded-lg">
        <Story />
      </div>
    ),
  ],
};
