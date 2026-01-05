import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import type { DbWorktreeSummary, DbWorktreeStatus } from '@openflow/generated';
import { WorktreeStatus, WorktreeList, WorktreeItem } from './WorktreeStatus';
import type { WorktreeStatusProps } from './WorktreeStatus';

// ============================================================================
// Mock Data
// ============================================================================

const createMockWorktree = (
  id: string,
  branchName: string,
  status: DbWorktreeStatus,
  mergedAt?: string
): DbWorktreeSummary => ({
  id,
  branchName,
  path: `/Users/dev/.openflow/worktrees/project-123/${branchName.replace(/\//g, '-')}`,
  status,
  mergedAt: mergedAt ?? null,
});

const activeWorktrees: DbWorktreeSummary[] = [
  createMockWorktree('wt-1', 'openflow/task-abc123/step-0', 'active'),
  createMockWorktree('wt-2', 'openflow/task-abc123/step-1', 'active'),
  createMockWorktree('wt-3', 'openflow/task-def456/step-0', 'active'),
];

const mixedWorktrees: DbWorktreeSummary[] = [
  createMockWorktree('wt-1', 'openflow/task-abc123/step-0', 'active'),
  createMockWorktree('wt-2', 'openflow/task-abc123/step-1', 'conflict'),
  createMockWorktree('wt-3', 'openflow/task-def456/step-0', 'merged', '2024-01-15T10:30:00Z'),
  createMockWorktree('wt-4', 'openflow/task-ghi789/step-0', 'deleted'),
];

const conflictWorktrees: DbWorktreeSummary[] = [
  createMockWorktree('wt-1', 'openflow/task-abc123/step-0', 'conflict'),
  createMockWorktree('wt-2', 'openflow/task-abc123/step-1', 'conflict'),
];

const mergedWorktrees: DbWorktreeSummary[] = [
  createMockWorktree('wt-1', 'openflow/task-old1/step-0', 'merged', '2024-01-14T08:00:00Z'),
  createMockWorktree('wt-2', 'openflow/task-old2/step-0', 'merged', '2024-01-13T15:30:00Z'),
  createMockWorktree('wt-3', 'openflow/task-old3/step-0', 'deleted'),
];

// ============================================================================
// Meta
// ============================================================================

const meta: Meta<typeof WorktreeStatus> = {
  title: 'Organisms/WorktreeStatus',
  component: WorktreeStatus,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
WorktreeStatus displays and manages git worktrees for parallel task execution.

## Features
- Displays active worktrees with branch names and paths
- Shows conflict states requiring resolution
- Merge and delete controls
- Collapsible history section for merged/deleted worktrees
- Responsive size variants

## Usage
\`\`\`tsx
import { WorktreeStatus } from '@openflow/ui';
import { useWorktreeSummaries, useMergeWorktree, useDeleteWorktree } from '@openflow/hooks';

function ProjectWorktrees({ projectId, repoPath, baseBranch }) {
  const { data: worktrees, isLoading } = useWorktreeSummaries(projectId);
  const mergeWorktree = useMergeWorktree();
  const deleteWorktree = useDeleteWorktree();

  return (
    <WorktreeStatus
      worktrees={worktrees ?? []}
      isLoading={isLoading}
      onMerge={(id) => mergeWorktree.mutate({ id, repoPath, baseBranch })}
      onDelete={(id) => deleteWorktree.mutate({ id, repoPath })}
      mergingWorktreeId={mergeWorktree.isPending ? mergeWorktree.variables?.id : undefined}
      showControls
    />
  );
}
\`\`\`
        `,
      },
    },
  },
  argTypes: {
    worktrees: {
      description: 'Array of worktree summaries to display',
      control: { type: 'object' },
    },
    isLoading: {
      description: 'Whether worktrees are loading',
      control: { type: 'boolean' },
    },
    showControls: {
      description: 'Whether to show merge/delete controls',
      control: { type: 'boolean' },
    },
    defaultExpanded: {
      description: 'Whether to start expanded',
      control: { type: 'boolean' },
    },
    size: {
      description: 'Size variant',
      control: { type: 'select' },
      options: ['sm', 'md', 'lg'],
    },
    onMerge: { action: 'merge' },
    onDelete: { action: 'delete' },
    onResolveConflict: { action: 'resolveConflict' },
  },
};

export default meta;
type Story = StoryObj<typeof WorktreeStatus>;

// ============================================================================
// Basic States
// ============================================================================

export const Empty: Story = {
  args: {
    worktrees: [],
    showControls: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Empty state when no worktrees exist.',
      },
    },
  },
};

export const Loading: Story = {
  args: {
    worktrees: [],
    isLoading: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Loading state while fetching worktrees.',
      },
    },
  },
};

export const Active: Story = {
  args: {
    worktrees: activeWorktrees,
    showControls: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Multiple active worktrees ready to be merged.',
      },
    },
  },
};

export const WithConflicts: Story = {
  args: {
    worktrees: conflictWorktrees,
    showControls: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Worktrees with merge conflicts that need resolution.',
      },
    },
  },
};

export const Mixed: Story = {
  args: {
    worktrees: mixedWorktrees,
    showControls: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Mix of active, conflict, merged, and deleted worktrees.',
      },
    },
  },
};

export const HistoryOnly: Story = {
  args: {
    worktrees: mergedWorktrees,
    showControls: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'Only merged/deleted worktrees in history.',
      },
    },
  },
};

// ============================================================================
// Control States
// ============================================================================

export const NoControls: Story = {
  args: {
    worktrees: activeWorktrees,
    showControls: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'Display without controls (read-only view).',
      },
    },
  },
};

export const Merging: Story = {
  args: {
    worktrees: activeWorktrees,
    showControls: true,
    mergingWorktreeId: 'wt-1',
  },
  parameters: {
    docs: {
      description: {
        story: 'First worktree is being merged.',
      },
    },
  },
};

export const Deleting: Story = {
  args: {
    worktrees: activeWorktrees,
    showControls: true,
    deletingWorktreeId: 'wt-2',
  },
  parameters: {
    docs: {
      description: {
        story: 'Second worktree is being deleted.',
      },
    },
  },
};

// ============================================================================
// Size Variants
// ============================================================================

export const Small: Story = {
  args: {
    worktrees: mixedWorktrees,
    showControls: true,
    size: 'sm',
  },
};

export const Medium: Story = {
  args: {
    worktrees: mixedWorktrees,
    showControls: true,
    size: 'md',
  },
};

export const Large: Story = {
  args: {
    worktrees: mixedWorktrees,
    showControls: true,
    size: 'lg',
  },
};

export const AllSizes: Story = {
  render: () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Small</h3>
        <WorktreeStatus
          worktrees={activeWorktrees.slice(0, 2)}
          showControls
          size="sm"
        />
      </div>
      <div>
        <h3 className="text-lg font-semibold mb-2">Medium (default)</h3>
        <WorktreeStatus
          worktrees={activeWorktrees.slice(0, 2)}
          showControls
          size="md"
        />
      </div>
      <div>
        <h3 className="text-lg font-semibold mb-2">Large</h3>
        <WorktreeStatus
          worktrees={activeWorktrees.slice(0, 2)}
          showControls
          size="lg"
        />
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Comparison of all size variants.',
      },
    },
  },
};

// ============================================================================
// Collapsed State
// ============================================================================

export const Collapsed: Story = {
  args: {
    worktrees: activeWorktrees,
    showControls: true,
    defaultExpanded: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'Component starts in collapsed state.',
      },
    },
  },
};

// ============================================================================
// Sub-components
// ============================================================================

export const WorktreeListOnly: Story = {
  render: () => (
    <WorktreeList
      worktrees={activeWorktrees}
      showControls
      size="md"
      onMerge={(id) => console.log('Merge:', id)}
      onDelete={(id) => console.log('Delete:', id)}
    />
  ),
  parameters: {
    docs: {
      description: {
        story: 'WorktreeList component used standalone.',
      },
    },
  },
};

// ============================================================================
// Interactive Demo
// ============================================================================

export const Interactive: Story = {
  render: function InteractiveDemo() {
    const [worktrees, setWorktrees] = useState<DbWorktreeSummary[]>(mixedWorktrees);
    const [mergingId, setMergingId] = useState<string | undefined>();
    const [deletingId, setDeletingId] = useState<string | undefined>();

    const handleMerge = (id: string) => {
      setMergingId(id);
      // Simulate merge operation
      setTimeout(() => {
        setWorktrees((prev) =>
          prev.map((wt) =>
            wt.id === id
              ? { ...wt, status: 'merged' as const, mergedAt: new Date().toISOString() }
              : wt
          )
        );
        setMergingId(undefined);
      }, 1500);
    };

    const handleDelete = (id: string) => {
      setDeletingId(id);
      // Simulate delete operation
      setTimeout(() => {
        setWorktrees((prev) =>
          prev.map((wt) =>
            wt.id === id
              ? { ...wt, status: 'deleted' as const }
              : wt
          )
        );
        setDeletingId(undefined);
      }, 1000);
    };

    const handleResolveConflict = (id: string) => {
      // Simulate conflict resolution
      setWorktrees((prev) =>
        prev.map((wt) =>
          wt.id === id
            ? { ...wt, status: 'merged' as const, mergedAt: new Date().toISOString() }
            : wt
        )
      );
    };

    return (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Click Merge, Delete, or Mark Resolved to see the interactive state changes.
        </p>
        <WorktreeStatus
          worktrees={worktrees}
          showControls
          onMerge={handleMerge}
          onDelete={handleDelete}
          onResolveConflict={handleResolveConflict}
          mergingWorktreeId={mergingId}
          deletingWorktreeId={deletingId}
        />
        <button
          type="button"
          onClick={() => setWorktrees(mixedWorktrees)}
          className="text-sm text-primary underline"
        >
          Reset
        </button>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Interactive demo showing merge, delete, and conflict resolution.',
      },
    },
  },
};

// ============================================================================
// Edge Cases
// ============================================================================

export const ManyWorktrees: Story = {
  args: {
    worktrees: Array.from({ length: 10 }, (_, i) =>
      createMockWorktree(
        `wt-${i + 1}`,
        `openflow/task-${String.fromCharCode(97 + i)}bc123/step-${i % 3}`,
        i < 6 ? 'active' : i < 8 ? 'merged' : 'deleted',
        i >= 6 ? '2024-01-15T10:30:00Z' : undefined
      )
    ),
    showControls: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Many worktrees to test scrolling and performance.',
      },
    },
  },
};

export const LongBranchNames: Story = {
  args: {
    worktrees: [
      createMockWorktree(
        'wt-1',
        'openflow/very-long-task-id-that-might-overflow-the-container-abc123/step-0',
        'active'
      ),
      createMockWorktree(
        'wt-2',
        'feature/another-incredibly-long-branch-name-for-testing-purposes',
        'active'
      ),
    ],
    showControls: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Handles long branch names gracefully.',
      },
    },
  },
};

// ============================================================================
// Accessibility
// ============================================================================

export const KeyboardNavigation: Story = {
  args: {
    worktrees: activeWorktrees,
    showControls: true,
  },
  parameters: {
    docs: {
      description: {
        story: `
Keyboard navigation support:
- Tab: Navigate between interactive elements
- Enter/Space: Activate buttons and expand/collapse
- Focus indicators visible for all interactive elements
        `,
      },
    },
  },
};

// ============================================================================
// Integration Context
// ============================================================================

export const InProjectContext: Story = {
  render: () => (
    <div className="max-w-2xl space-y-4">
      <div className="border-b border-border pb-4">
        <h2 className="text-xl font-semibold">Project Settings</h2>
        <p className="text-sm text-muted-foreground">
          Manage git worktrees for parallel task execution
        </p>
      </div>

      <WorktreeStatus
        worktrees={mixedWorktrees}
        showControls
        onMerge={(id) => console.log('Merge:', id)}
        onDelete={(id) => console.log('Delete:', id)}
        onResolveConflict={(id) => console.log('Resolve:', id)}
      />

      <div className="text-sm text-muted-foreground">
        <p>
          <strong>Note:</strong> Worktrees are automatically created when running
          parallel task steps. You can merge them back to the base branch or
          delete them when no longer needed.
        </p>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'WorktreeStatus in a realistic project settings context.',
      },
    },
  },
};
