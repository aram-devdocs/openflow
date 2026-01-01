import type { DiffHunk, FileDiff } from '@openflow/generated';
import type { Meta, StoryObj } from '@storybook/react';
import { fn } from '@storybook/test';
import { useState } from 'react';
import {
  DEFAULT_EMPTY_TITLE,
  DEFAULT_ERROR_TITLE,
  DEFAULT_REGION_LABEL,
  // Constants for reference in stories
  DEFAULT_SKELETON_COUNT,
  DIFF_VIEWER_PADDING_CLASSES,
  // Size class constants
  DIFF_VIEWER_SIZE_CLASSES,
  DiffViewer,
  DiffViewerError,
  DiffViewerSkeleton,
  SR_ADDITION_PREFIX,
  SR_FILE_EXPANDED,
  STATUS_LABELS,
} from './DiffViewer';

const meta = {
  title: 'Organisms/DiffViewer',
  component: DiffViewer,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
DiffViewer displays git file diffs with full accessibility support.

## Features
- File-by-file diff display with collapsible sections
- Line numbers for old and new file versions
- Syntax highlighting for additions, deletions, and context
- File status indicators (new, deleted, renamed, binary)
- Change statistics (additions/deletions count)
- Loading and error states
- Screen reader announcements for state changes
- Responsive sizing via ResponsiveValue
- Touch targets ≥44px for mobile (WCAG 2.5.5)
- **Color-blind accessible:** +/- prefixes indicate changes beyond color

## Accessibility
- \`role="region"\` for the diff viewer container
- \`aria-expanded\` on expandable file headers
- \`aria-controls\` linking headers to content
- \`aria-live\` announcements for state changes
- \`role="table"\` for diff content with proper row/cell semantics
- Visual +/- prefixes for color-blind accessibility
- Keyboard navigation with Enter/Space to expand
        `,
      },
    },
  },
  tags: ['autodocs'],
  args: {
    onFileToggle: fn(),
  },
  decorators: [
    (Story) => (
      <div className="h-[600px] w-full max-w-4xl border border-[rgb(var(--border))] rounded-lg overflow-hidden">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof DiffViewer>;

export default meta;
type Story = StoryObj<typeof meta>;

// =============================================================================
// Helper Functions
// =============================================================================

function createHunk(
  oldStart: number,
  oldLines: number,
  newStart: number,
  newLines: number,
  content: string
): DiffHunk {
  return { oldStart, oldLines, newStart, newLines, content };
}

// =============================================================================
// Sample Diff Data
// =============================================================================

const buttonDiff: FileDiff = {
  path: 'src/components/Button.tsx',
  hunks: [
    createHunk(
      10,
      6,
      10,
      8,
      `@@ -10,6 +10,8 @@
 import { cn } from '../utils';

+export type ButtonVariant = 'primary' | 'secondary' | 'ghost';
+
 export interface ButtonProps {
-  variant?: 'primary' | 'secondary';
+  variant?: ButtonVariant;
   size?: 'sm' | 'md' | 'lg';
   children: React.ReactNode;
 }`
    ),
    createHunk(
      25,
      4,
      27,
      6,
      `@@ -25,4 +27,6 @@
   return (
-    <button className={cn(styles)}>
+    <button
+      className={cn(styles, className)}
+      {...props}
+    >
       {children}
     </button>
   );`
    ),
  ],
  additions: 6,
  deletions: 2,
  isBinary: false,
  isNew: false,
  isDeleted: false,
  isRenamed: false,
};

const newFileDiff: FileDiff = {
  path: 'src/hooks/useTheme.ts',
  hunks: [
    createHunk(
      1,
      0,
      1,
      15,
      `@@ -0,0 +1,15 @@
+import { useState, useEffect } from 'react';
+
+export function useTheme() {
+  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
+
+  useEffect(() => {
+    const saved = localStorage.getItem('theme');
+    if (saved) setTheme(saved as 'light' | 'dark');
+  }, []);
+
+  const toggleTheme = () => {
+    setTheme(t => t === 'light' ? 'dark' : 'light');
+  };
+
+  return { theme, toggleTheme };
+}`
    ),
  ],
  additions: 15,
  deletions: 0,
  isBinary: false,
  isNew: true,
  isDeleted: false,
  isRenamed: false,
};

const deletedFileDiff: FileDiff = {
  path: 'src/deprecated/oldUtils.ts',
  hunks: [
    createHunk(
      1,
      20,
      0,
      0,
      `@@ -1,20 +0,0 @@
-// Old utility functions - deprecated
-export function oldHelper() {
-  console.log('deprecated');
-}
-
-export function anotherOldHelper() {
-  return null;
-}
-
-export const LEGACY_CONSTANT = 42;
-
-// This file is no longer needed
-export default {
-  oldHelper,
-  anotherOldHelper,
-  LEGACY_CONSTANT,
-};`
    ),
  ],
  additions: 0,
  deletions: 17,
  isBinary: false,
  isNew: false,
  isDeleted: true,
  isRenamed: false,
};

const renamedFileDiff: FileDiff = {
  path: 'src/utils/helpers.ts',
  oldPath: 'src/lib/helpers.ts',
  hunks: [
    createHunk(
      1,
      5,
      1,
      5,
      `@@ -1,5 +1,5 @@
-// Helper utilities
+// Helper utilities (moved to utils folder)
 export function formatDate(date: Date): string {
   return date.toISOString();
 }
 `
    ),
  ],
  additions: 1,
  deletions: 1,
  isBinary: false,
  isNew: false,
  isDeleted: false,
  isRenamed: true,
};

const binaryFileDiff: FileDiff = {
  path: 'assets/logo.png',
  hunks: [],
  additions: 0,
  deletions: 0,
  isBinary: true,
  isNew: false,
  isDeleted: false,
  isRenamed: false,
};

const largeFileDiff: FileDiff = {
  path: 'src/services/api.ts',
  hunks: [
    createHunk(
      1,
      30,
      1,
      45,
      `@@ -1,30 +1,45 @@
 import axios from 'axios';
+import { API_BASE_URL } from '../config';

-const api = axios.create({
-  baseURL: 'http://localhost:3000',
+export const api = axios.create({
+  baseURL: API_BASE_URL,
+  timeout: 10000,
+  headers: {
+    'Content-Type': 'application/json',
+  },
 });

-export async function fetchUsers() {
-  const response = await api.get('/users');
-  return response.data;
+// Request interceptor for auth
+api.interceptors.request.use((config) => {
+  const token = localStorage.getItem('token');
+  if (token) {
+    config.headers.Authorization = \`Bearer \${token}\`;
+  }
+  return config;
+});
+
+// Response interceptor for errors
+api.interceptors.response.use(
+  (response) => response,
+  (error) => {
+    if (error.response?.status === 401) {
+      window.location.href = '/login';
+    }
+    return Promise.reject(error);
+  }
+);
+
+export async function fetchUsers(): Promise<User[]> {
+  const { data } = await api.get('/users');
+  return data;
 }

-export async function createUser(user) {
-  const response = await api.post('/users', user);
-  return response.data;
+export async function createUser(user: CreateUserRequest): Promise<User> {
+  const { data } = await api.post('/users', user);
+  return data;
 }

-export async function deleteUser(id) {
+export async function deleteUser(id: string): Promise<void> {
   await api.delete(\`/users/\${id}\`);
 }
 `
    ),
  ],
  additions: 35,
  deletions: 12,
  isBinary: false,
  isNew: false,
  isDeleted: false,
  isRenamed: false,
};

const sampleDiffs: FileDiff[] = [buttonDiff, newFileDiff, deletedFileDiff];

// =============================================================================
// Interactive Wrapper
// =============================================================================

function InteractiveDiffViewer({ diffs }: { diffs: FileDiff[] }) {
  const [expandedFiles, setExpandedFiles] = useState<Set<string>>(
    new Set(diffs.slice(0, 1).map((d) => d.path))
  );

  const handleToggle = (path: string) => {
    setExpandedFiles((prev) => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  };

  return <DiffViewer diffs={diffs} expandedFiles={expandedFiles} onFileToggle={handleToggle} />;
}

// =============================================================================
// Basic Stories
// =============================================================================

/**
 * Default diff viewer with multiple file changes
 */
export const Default: Story = {
  args: {
    diffs: sampleDiffs,
    defaultExpanded: true,
  },
};

/**
 * Interactive diff viewer with controlled expand/collapse state
 */
export const Interactive: Story = {
  args: {
    diffs: sampleDiffs,
  },
  render: (args) => <InteractiveDiffViewer {...args} />,
};

/**
 * Single file diff viewer
 */
export const SingleFile: Story = {
  args: {
    diffs: [buttonDiff],
    defaultExpanded: true,
  },
};

// =============================================================================
// File Status Stories
// =============================================================================

/**
 * Diff viewer showing only new files (additions)
 */
export const NewFilesOnly: Story = {
  args: {
    diffs: [newFileDiff],
    defaultExpanded: true,
  },
};

/**
 * Diff viewer showing only deleted files
 */
export const DeletedFilesOnly: Story = {
  args: {
    diffs: [deletedFileDiff],
    defaultExpanded: true,
  },
};

/**
 * Diff viewer with a renamed file
 */
export const WithRenamedFile: Story = {
  args: {
    diffs: [renamedFileDiff, buttonDiff],
    defaultExpanded: true,
  },
};

/**
 * Diff viewer with binary file
 */
export const WithBinaryFile: Story = {
  args: {
    diffs: [binaryFileDiff, buttonDiff],
    defaultExpanded: true,
  },
};

// =============================================================================
// Size Variant Stories
// =============================================================================

/**
 * Small size variant
 */
export const SizeSmall: Story = {
  args: {
    diffs: sampleDiffs,
    defaultExpanded: true,
    size: 'sm',
  },
};

/**
 * Medium size variant (default)
 */
export const SizeMedium: Story = {
  args: {
    diffs: sampleDiffs,
    defaultExpanded: true,
    size: 'md',
  },
};

/**
 * Large size variant
 */
export const SizeLarge: Story = {
  args: {
    diffs: sampleDiffs,
    defaultExpanded: true,
    size: 'lg',
  },
};

/**
 * Responsive sizing: small on mobile, medium on tablet, large on desktop
 */
export const ResponsiveSizing: Story = {
  args: {
    diffs: sampleDiffs,
    defaultExpanded: true,
    size: { base: 'sm', md: 'md', lg: 'lg' },
  },
  parameters: {
    docs: {
      description: {
        story: 'Resize the viewport to see the diff viewer adapt its size.',
      },
    },
  },
};

// =============================================================================
// Display Option Stories
// =============================================================================

/**
 * Diff viewer with all files collapsed
 */
export const AllCollapsed: Story = {
  args: {
    diffs: sampleDiffs,
    defaultExpanded: false,
  },
};

/**
 * Diff viewer without line numbers
 */
export const NoLineNumbers: Story = {
  args: {
    diffs: sampleDiffs,
    defaultExpanded: true,
    showLineNumbers: false,
  },
};

/**
 * Diff viewer with max height constraint
 */
export const WithMaxHeight: Story = {
  args: {
    diffs: [...sampleDiffs, largeFileDiff],
    defaultExpanded: true,
    maxHeight: '400px',
  },
  decorators: [
    (Story) => (
      <div className="w-full max-w-4xl">
        <Story />
      </div>
    ),
  ],
};

// =============================================================================
// Content Variation Stories
// =============================================================================

/**
 * Diff viewer with a large file diff
 */
export const LargeDiff: Story = {
  args: {
    diffs: [largeFileDiff],
    defaultExpanded: true,
  },
};

/**
 * Diff viewer with many files
 */
export const ManyFiles: Story = {
  args: {
    diffs: [
      ...sampleDiffs,
      largeFileDiff,
      renamedFileDiff,
      binaryFileDiff,
      {
        ...buttonDiff,
        path: 'src/components/Input.tsx',
        additions: 12,
        deletions: 3,
      },
      {
        ...buttonDiff,
        path: 'src/components/Card.tsx',
        additions: 8,
        deletions: 5,
      },
      {
        ...buttonDiff,
        path: 'src/components/Modal.tsx',
        additions: 25,
        deletions: 10,
      },
    ],
    defaultExpanded: false,
  },
};

/**
 * Empty diff viewer (no changes)
 */
export const Empty: Story = {
  args: {
    diffs: [],
  },
};

// =============================================================================
// Loading and Error State Stories
// =============================================================================

/**
 * Loading skeleton while fetching diffs
 */
export const Loading: Story = {
  args: {
    diffs: [],
  },
  render: () => <DiffViewerSkeleton count={3} />,
};

/**
 * Loading skeleton with different count
 */
export const LoadingFiveFiles: Story = {
  args: {
    diffs: [],
  },
  render: () => <DiffViewerSkeleton count={5} />,
};

/**
 * Error state with retry button
 */
export const ErrorState: Story = {
  args: {
    diffs: [],
  },
  render: () => (
    <DiffViewerError
      message="Unable to load the file changes. Please check your connection and try again."
      onRetry={() => console.log('Retry clicked')}
    />
  ),
};

/**
 * Error state without retry
 */
export const ErrorNoRetry: Story = {
  args: {
    diffs: [],
  },
  render: () => <DiffViewerError message="The diff data is not available." />,
};

// =============================================================================
// Accessibility Stories
// =============================================================================

/**
 * Demonstrates keyboard navigation:
 * - Tab to focus on file headers
 * - Enter/Space to expand/collapse
 */
export const KeyboardNavigation: Story = {
  args: {
    diffs: sampleDiffs,
    defaultExpanded: false,
  },
  parameters: {
    docs: {
      description: {
        story: `
**Keyboard navigation:**
- Tab to focus on file headers
- Enter or Space to expand/collapse a file
- All interactive elements are keyboard accessible
        `,
      },
    },
  },
  render: (args) => <InteractiveDiffViewer {...args} />,
};

/**
 * Demonstrates screen reader announcements:
 * - Stats summary announced on load
 * - Expand/collapse state changes announced
 * - Line types announced (addition/deletion/unchanged)
 */
export const ScreenReaderAccessibility: Story = {
  args: {
    diffs: sampleDiffs,
    defaultExpanded: true,
  },
  parameters: {
    docs: {
      description: {
        story: `
**Screen reader features:**
- Stats summary announced on load
- aria-expanded on file headers
- aria-controls linking headers to content
- aria-live announcements for state changes
- Line types announced (addition/deletion/unchanged)
- role="table" for diff content
        `,
      },
    },
  },
};

/**
 * Touch target accessibility - all interactive elements are ≥44px
 */
export const TouchTargetAccessibility: Story = {
  args: {
    diffs: sampleDiffs,
    defaultExpanded: false,
    size: 'lg',
  },
  parameters: {
    docs: {
      description: {
        story: `
**Touch target compliance (WCAG 2.5.5):**
- File headers have min-height of 44px
- All interactive elements meet the minimum touch target size
        `,
      },
    },
  },
};

/**
 * Focus ring visibility on all interactive elements
 */
export const FocusRingVisibility: Story = {
  args: {
    diffs: sampleDiffs,
    defaultExpanded: false,
  },
  parameters: {
    docs: {
      description: {
        story: `
**Focus indicators:**
- Tab through elements to see focus rings
- Focus rings use ring-offset for visibility on all backgrounds
- motion-safe transitions for reduced motion support
        `,
      },
    },
  },
  render: (args) => <InteractiveDiffViewer {...args} />,
};

/**
 * Color-blind accessible: +/- prefixes indicate changes beyond color
 */
export const ColorBlindAccessibility: Story = {
  args: {
    diffs: [buttonDiff],
    defaultExpanded: true,
  },
  parameters: {
    docs: {
      description: {
        story: `
**Color-blind accessibility:**
- Each line has a visual prefix (+/-/space) indicating its type
- Additions show + prefix
- Deletions show - prefix
- Context lines show space prefix
- This ensures changes are identifiable without relying on color alone
        `,
      },
    },
  },
};

// =============================================================================
// Data Attributes Stories
// =============================================================================

/**
 * Demonstrates data-testid support for automated testing
 */
export const DataTestId: Story = {
  args: {
    diffs: sampleDiffs,
    defaultExpanded: true,
    'data-testid': 'diff-viewer',
  },
  parameters: {
    docs: {
      description: {
        story: `
**Data attributes for testing:**
- data-testid on main container
- data-file-count on container
- data-size on container
- data-file-path on each file row
        `,
      },
    },
  },
};

/**
 * Demonstrates ref forwarding for programmatic access
 */
export const RefForwarding: Story = {
  args: {
    diffs: sampleDiffs,
    defaultExpanded: true,
  },
  render: (args) => {
    const ref = { current: null as HTMLDivElement | null };
    return (
      <div>
        <button
          type="button"
          onClick={() => {
            if (ref.current) {
              ref.current.scrollTop = 0;
              console.log('Scrolled to top via ref');
            }
          }}
          className="mb-4 px-4 py-2 bg-[rgb(var(--primary))] text-[rgb(var(--primary-foreground))] rounded"
        >
          Scroll to top via ref
        </button>
        <DiffViewer
          {...args}
          ref={(el) => {
            ref.current = el;
          }}
        />
      </div>
    );
  },
};

// =============================================================================
// Real-world Examples
// =============================================================================

/**
 * Pull request diff view
 */
export const PullRequestDiff: Story = {
  args: {
    diffs: [
      buttonDiff,
      newFileDiff,
      {
        ...buttonDiff,
        path: 'src/components/Input.tsx',
        additions: 45,
        deletions: 12,
      },
      {
        ...buttonDiff,
        path: 'tests/Button.test.tsx',
        additions: 30,
        deletions: 5,
      },
    ],
    defaultExpanded: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'Typical pull request diff view with multiple files.',
      },
    },
  },
  render: (args) => <InteractiveDiffViewer {...args} />,
};

/**
 * Code review diff with all files expanded
 */
export const CodeReviewDiff: Story = {
  args: {
    diffs: [buttonDiff, largeFileDiff],
    defaultExpanded: true,
    showLineNumbers: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Code review view with line numbers for referencing.',
      },
    },
  },
};

// =============================================================================
// Constants Reference
// =============================================================================

/**
 * Reference story showing all exported constants
 */
export const ConstantsReference: Story = {
  args: {
    diffs: sampleDiffs,
    defaultExpanded: true,
  },
  parameters: {
    docs: {
      description: {
        story: `
## Exported Constants

### Default Values
- \`DEFAULT_SKELETON_COUNT\`: ${DEFAULT_SKELETON_COUNT}
- \`DEFAULT_REGION_LABEL\`: "${DEFAULT_REGION_LABEL}"
- \`DEFAULT_EMPTY_TITLE\`: "${DEFAULT_EMPTY_TITLE}"
- \`DEFAULT_ERROR_TITLE\`: "${DEFAULT_ERROR_TITLE}"

### Screen Reader Announcements
- \`SR_FILE_EXPANDED\`: "${SR_FILE_EXPANDED}"
- \`SR_ADDITION_PREFIX\`: "${SR_ADDITION_PREFIX}"

### Status Labels
- \`STATUS_LABELS.new\`: "${STATUS_LABELS.new}"
- \`STATUS_LABELS.deleted\`: "${STATUS_LABELS.deleted}"
- \`STATUS_LABELS.renamed\`: "${STATUS_LABELS.renamed}"
- \`STATUS_LABELS.binary\`: "${STATUS_LABELS.binary}"

### Size Class Maps
- \`DIFF_VIEWER_SIZE_CLASSES\`: ${JSON.stringify(DIFF_VIEWER_SIZE_CLASSES)}
- \`DIFF_VIEWER_PADDING_CLASSES\`: ${JSON.stringify(DIFF_VIEWER_PADDING_CLASSES)}

### Base Classes
- \`FILE_HEADER_BUTTON_CLASSES\` includes touch target and focus ring classes
        `,
      },
    },
  },
};

/**
 * Controlled first file expanded
 */
export const ControlledFirstExpanded: Story = {
  args: {
    diffs: sampleDiffs,
    expandedFiles: new Set(['src/components/Button.tsx']),
  },
};
