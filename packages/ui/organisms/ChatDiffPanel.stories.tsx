import type { FileDiff } from '@openflow/generated';
import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import {
  CHAT_DIFF_PANEL_BASE_CLASSES,
  CHAT_DIFF_PANEL_CONTENT_CLASSES,
  CHAT_DIFF_PANEL_ERROR_CLASSES,
  CHAT_DIFF_PANEL_HEADER_CLASSES,
  CHAT_DIFF_PANEL_LOADING_CLASSES,
  ChatDiffPanel,
  DEFAULT_ERROR_TITLE,
  DEFAULT_LOADING_TEXT,
  DEFAULT_MAX_HEIGHT,
  DEFAULT_NO_CHANGES_TEXT,
  DEFAULT_PANEL_TITLE,
  DEFAULT_RETRY_LABEL,
  SR_LOADING,
  SR_PANEL_COLLAPSED,
  SR_PANEL_EXPANDED,
} from './ChatDiffPanel';

const meta: Meta<typeof ChatDiffPanel> = {
  title: 'Organisms/ChatDiffPanel',
  component: ChatDiffPanel,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
Collapsible git diff panel for chat sessions.

## Features

- Collapsible panel with expand/collapse animation
- File count and change summary in header
- Integrates with DiffViewer for actual diff display
- Loading and error states
- Full accessibility support

## Usage

\`\`\`tsx
<ChatDiffPanel
  diffs={fileDiffs}
  defaultExpanded={false}
  isLoading={isLoading}
  error={error}
  onRetry={refetch}
/>
\`\`\`
        `,
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    isLoading: {
      control: 'boolean',
      description: 'Whether the panel is loading',
    },
    defaultExpanded: {
      control: 'boolean',
      description: 'Whether the panel starts expanded',
    },
    maxHeight: {
      control: 'text',
      description: 'Maximum height for the diff content',
    },
  },
};

export default meta;
type Story = StoryObj<typeof ChatDiffPanel>;

// ============================================================================
// Mock Data
// ============================================================================

const mockDiffs: FileDiff[] = [
  {
    path: 'src/components/Button.tsx',
    status: 'modified',
    additions: 15,
    deletions: 5,
    hunks: [
      {
        oldStart: 1,
        oldLines: 10,
        newStart: 1,
        newLines: 15,
        header: '@@ -1,10 +1,15 @@',
        lines: [
          { type: 'context', content: 'import React from "react";', oldNumber: 1, newNumber: 1 },
          { type: 'deletion', content: 'export const Button = () => {', oldNumber: 2, newNumber: null },
          { type: 'addition', content: 'interface ButtonProps {', oldNumber: null, newNumber: 2 },
          { type: 'addition', content: '  variant?: "primary" | "secondary";', oldNumber: null, newNumber: 3 },
          { type: 'addition', content: '}', oldNumber: null, newNumber: 4 },
          { type: 'addition', content: '', oldNumber: null, newNumber: 5 },
          { type: 'addition', content: 'export const Button = ({ variant = "primary" }: ButtonProps) => {', oldNumber: null, newNumber: 6 },
          { type: 'context', content: '  return <button>Click me</button>;', oldNumber: 3, newNumber: 7 },
          { type: 'context', content: '};', oldNumber: 4, newNumber: 8 },
        ],
      },
    ],
    oldPath: null,
    newPath: null,
    isBinary: false,
  },
  {
    path: 'src/utils/helpers.ts',
    status: 'added',
    additions: 25,
    deletions: 0,
    hunks: [
      {
        oldStart: 0,
        oldLines: 0,
        newStart: 1,
        newLines: 25,
        header: '@@ -0,0 +1,25 @@',
        lines: [
          { type: 'addition', content: '/**', oldNumber: null, newNumber: 1 },
          { type: 'addition', content: ' * Utility functions for the application', oldNumber: null, newNumber: 2 },
          { type: 'addition', content: ' */', oldNumber: null, newNumber: 3 },
          { type: 'addition', content: '', oldNumber: null, newNumber: 4 },
          { type: 'addition', content: 'export function formatDate(date: Date): string {', oldNumber: null, newNumber: 5 },
          { type: 'addition', content: '  return date.toISOString();', oldNumber: null, newNumber: 6 },
          { type: 'addition', content: '}', oldNumber: null, newNumber: 7 },
        ],
      },
    ],
    oldPath: null,
    newPath: null,
    isBinary: false,
  },
  {
    path: 'src/old-file.ts',
    status: 'deleted',
    additions: 0,
    deletions: 30,
    hunks: [
      {
        oldStart: 1,
        oldLines: 30,
        newStart: 0,
        newLines: 0,
        header: '@@ -1,30 +0,0 @@',
        lines: [
          { type: 'deletion', content: '// This file is no longer needed', oldNumber: 1, newNumber: null },
          { type: 'deletion', content: 'export const oldFunction = () => {};', oldNumber: 2, newNumber: null },
        ],
      },
    ],
    oldPath: null,
    newPath: null,
    isBinary: false,
  },
];

// ============================================================================
// Basic Examples
// ============================================================================

/**
 * Default ChatDiffPanel with file changes.
 */
export const Default: Story = {
  args: {
    diffs: mockDiffs,
    defaultExpanded: false,
  },
  render: (args) => (
    <div className="w-[600px]">
      <ChatDiffPanel {...args} />
    </div>
  ),
};

/**
 * ChatDiffPanel expanded by default.
 */
export const DefaultExpanded: Story = {
  args: {
    diffs: mockDiffs,
    defaultExpanded: true,
  },
  render: (args) => (
    <div className="w-[600px]">
      <ChatDiffPanel {...args} />
    </div>
  ),
};

/**
 * ChatDiffPanel with no changes (renders nothing).
 */
export const NoChanges: Story = {
  render: () => (
    <div className="w-[600px] p-4 border rounded bg-muted">
      <p className="text-sm text-muted-foreground mb-4">
        When there are no diffs, the component renders nothing:
      </p>
      <ChatDiffPanel diffs={[]} />
      <p className="text-sm text-muted-foreground mt-4">(Nothing rendered above)</p>
    </div>
  ),
};

// ============================================================================
// Loading & Error States
// ============================================================================

/**
 * ChatDiffPanel in loading state.
 */
export const Loading: Story = {
  args: {
    diffs: [],
    isLoading: true,
    defaultExpanded: true,
  },
  render: (args) => (
    <div className="w-[600px]">
      <ChatDiffPanel {...args} />
    </div>
  ),
};

/**
 * ChatDiffPanel with error state.
 */
export const Error: Story = {
  render: () => {
    const [retryCount, setRetryCount] = useState(0);

    return (
      <div className="w-[600px]">
        <ChatDiffPanel
          diffs={[]}
          error="Failed to load git diff: repository not found"
          onRetry={() => setRetryCount((c) => c + 1)}
          defaultExpanded={true}
        />
        <p className="text-sm text-muted-foreground mt-2">Retry count: {retryCount}</p>
      </div>
    );
  },
};

// ============================================================================
// Single File Types
// ============================================================================

/**
 * Single modified file.
 */
export const SingleModifiedFile: Story = {
  args: {
    diffs: [mockDiffs[0] as FileDiff],
    defaultExpanded: true,
  },
  render: (args) => (
    <div className="w-[600px]">
      <ChatDiffPanel {...args} />
    </div>
  ),
};

/**
 * Single added file.
 */
export const SingleAddedFile: Story = {
  args: {
    diffs: [mockDiffs[1] as FileDiff],
    defaultExpanded: true,
  },
  render: (args) => (
    <div className="w-[600px]">
      <ChatDiffPanel {...args} />
    </div>
  ),
};

/**
 * Single deleted file.
 */
export const SingleDeletedFile: Story = {
  args: {
    diffs: [mockDiffs[2] as FileDiff],
    defaultExpanded: true,
  },
  render: (args) => (
    <div className="w-[600px]">
      <ChatDiffPanel {...args} />
    </div>
  ),
};

// ============================================================================
// Customization
// ============================================================================

/**
 * Custom max height.
 */
export const CustomMaxHeight: Story = {
  args: {
    diffs: mockDiffs,
    defaultExpanded: true,
    maxHeight: '200px',
  },
  render: (args) => (
    <div className="w-[600px]">
      <ChatDiffPanel {...args} />
    </div>
  ),
};

// ============================================================================
// Constants Reference
// ============================================================================

/**
 * Reference for all exported constants.
 */
export const ConstantsReference: Story = {
  render: () => (
    <div className="p-8 space-y-6 max-w-2xl">
      <div>
        <h3 className="text-lg font-semibold mb-2">Default Values</h3>
        <pre className="text-xs bg-muted p-4 rounded overflow-auto">
          {`DEFAULT_MAX_HEIGHT: "${DEFAULT_MAX_HEIGHT}"
DEFAULT_PANEL_TITLE: "${DEFAULT_PANEL_TITLE}"
DEFAULT_LOADING_TEXT: "${DEFAULT_LOADING_TEXT}"
DEFAULT_ERROR_TITLE: "${DEFAULT_ERROR_TITLE}"
DEFAULT_RETRY_LABEL: "${DEFAULT_RETRY_LABEL}"
DEFAULT_NO_CHANGES_TEXT: "${DEFAULT_NO_CHANGES_TEXT}"`}
        </pre>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-2">Screen Reader Announcements</h3>
        <pre className="text-xs bg-muted p-4 rounded overflow-auto">
          {`SR_PANEL_EXPANDED: "${SR_PANEL_EXPANDED}"
SR_PANEL_COLLAPSED: "${SR_PANEL_COLLAPSED}"
SR_LOADING: "${SR_LOADING}"`}
        </pre>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-2">CSS Class Constants</h3>
        <pre className="text-xs bg-muted p-4 rounded overflow-auto whitespace-pre-wrap">
          {`CHAT_DIFF_PANEL_BASE_CLASSES:
"${CHAT_DIFF_PANEL_BASE_CLASSES}"

CHAT_DIFF_PANEL_HEADER_CLASSES:
"${CHAT_DIFF_PANEL_HEADER_CLASSES}"

CHAT_DIFF_PANEL_CONTENT_CLASSES:
"${CHAT_DIFF_PANEL_CONTENT_CLASSES}"

CHAT_DIFF_PANEL_LOADING_CLASSES:
"${CHAT_DIFF_PANEL_LOADING_CLASSES}"

CHAT_DIFF_PANEL_ERROR_CLASSES:
"${CHAT_DIFF_PANEL_ERROR_CLASSES}"`}
        </pre>
      </div>
    </div>
  ),
};
