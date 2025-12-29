import type { Commit } from '@openflow/generated';
import type { Meta, StoryObj } from '@storybook/react';
import { fn } from '@storybook/test';
import { useState } from 'react';
import { CommitList } from './CommitList';

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

// Helper to create a commit
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

// Sample commits for stories
const sampleCommits: Commit[] = [
  createCommit(
    'abc1234',
    'feat: add user authentication with JWT tokens',
    'Alice Chen',
    0,
    8,
    245,
    12
  ),
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

// Interactive wrapper for controlled expand/collapse
function InteractiveCommitList({ commits }: { commits: Commit[] }) {
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
    />
  );
}

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
  render: (args) => <InteractiveCommitList {...args} />,
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
    commits: [sampleCommits[0]],
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

/**
 * Empty commit list
 */
export const Empty: Story = {
  args: {
    commits: [],
  },
};

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
};
