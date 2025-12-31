import type { DiffHunk, FileDiff } from '@openflow/generated';
import type { Meta, StoryObj } from '@storybook/react';
import { fn } from '@storybook/test';
import { useState } from 'react';
import { DiffViewer } from './DiffViewer';

const meta = {
  title: 'Organisms/DiffViewer',
  component: DiffViewer,
  parameters: {
    layout: 'padded',
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

// Helper to create a hunk
function createHunk(
  oldStart: number,
  oldLines: number,
  newStart: number,
  newLines: number,
  content: string
): DiffHunk {
  return { oldStart, oldLines, newStart, newLines, content };
}

// Named sample diffs for stories
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

// Array of sample diffs for stories that need multiple
const sampleDiffs: FileDiff[] = [buttonDiff, newFileDiff, deletedFileDiff];

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
+      // Handle unauthorized
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

// Interactive wrapper for controlled expand/collapse
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
 * Diff viewer with a renamed file
 */
export const WithRenamedFile: Story = {
  args: {
    diffs: [renamedFileDiff, ...sampleDiffs.slice(0, 1)],
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
 * Empty diff viewer (no changes)
 */
export const Empty: Story = {
  args: {
    diffs: [],
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
 * Single file diff viewer
 */
export const SingleFile: Story = {
  args: {
    diffs: [buttonDiff],
    defaultExpanded: true,
  },
};

/**
 * Diff viewer with controlled state and first file expanded
 */
export const ControlledFirstExpanded: Story = {
  args: {
    diffs: sampleDiffs,
    expandedFiles: new Set(['src/components/Button.tsx']),
  },
};
