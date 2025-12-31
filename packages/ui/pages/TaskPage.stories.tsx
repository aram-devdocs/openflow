/**
 * Storybook stories for TaskPage
 *
 * Demonstrates the complete task detail page in various states:
 * - Loading state
 * - Not found state
 * - Ready state with different tabs
 * - With dialogs open
 * - Running executor
 * - Mobile viewport
 */

import type {
  Chat,
  Commit,
  ExecutorProfile,
  FileDiff,
  Message,
  Task,
  WorkflowStep,
} from '@openflow/generated';
import { ChatRole, MessageRole, TaskStatus, WorkflowStepStatus } from '@openflow/generated';
import type { Meta, StoryObj } from '@storybook/react';
import { FileCode2, FileText, GitCommit } from 'lucide-react';
import type { ArtifactFile } from '../organisms/ArtifactsPanel';
import type { ClaudeEvent } from '../organisms/ClaudeEventRenderer';
import { TaskPage, type TaskPageProps } from './TaskPage';

const meta: Meta<typeof TaskPage> = {
  title: 'Pages/TaskPage',
  component: TaskPage,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div className="h-screen w-screen">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof TaskPage>;

// ============================================================================
// Mock Data
// ============================================================================

const mockTask: Task = {
  id: 'task-1',
  projectId: 'project-1',
  title: 'Implement user authentication',
  description: 'Add login and signup functionality with OAuth support',
  status: TaskStatus.Inprogress,
  actionsRequiredCount: 2,
  autoStartNextStep: true,
  createdAt: '2024-01-15T10:00:00Z',
  updatedAt: '2024-01-15T14:30:00Z',
};

const mockChats: Chat[] = [
  {
    id: 'chat-1',
    projectId: 'project-1',
    taskId: 'task-1',
    title: 'Requirements Analysis',
    chatRole: ChatRole.Main,
    baseBranch: 'main',
    branch: 'openflow/task-1/main',
    worktreeDeleted: false,
    isPlanContainer: false,
    workflowStepIndex: 0,
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T10:30:00Z',
  },
  {
    id: 'chat-2',
    projectId: 'project-1',
    taskId: 'task-1',
    title: 'Implementation',
    chatRole: ChatRole.Main,
    baseBranch: 'main',
    worktreeDeleted: false,
    isPlanContainer: false,
    workflowStepIndex: 1,
    createdAt: '2024-01-15T11:00:00Z',
    updatedAt: '2024-01-15T14:30:00Z',
  },
];

const mockWorkflowSteps: WorkflowStep[] = [
  {
    index: 0,
    name: 'Requirements',
    description: 'Analyze requirements and create specification',
    status: WorkflowStepStatus.Completed,
    chatId: 'chat-1',
  },
  {
    index: 1,
    name: 'Implementation',
    description: 'Implement the feature according to spec',
    status: WorkflowStepStatus.InProgress,
    chatId: 'chat-2',
  },
  {
    index: 2,
    name: 'Testing',
    description: 'Write tests and verify functionality',
    status: WorkflowStepStatus.Pending,
  },
  {
    index: 3,
    name: 'Review',
    description: 'Code review and documentation',
    status: WorkflowStepStatus.Pending,
  },
];

const mockMessages: Message[] = [
  {
    id: 'msg-1',
    chatId: 'chat-2',
    role: MessageRole.User,
    content: 'Please implement the login form with email and password fields',
    isStreaming: false,
    createdAt: '2024-01-15T11:00:00Z',
  },
  {
    id: 'msg-2',
    chatId: 'chat-2',
    role: MessageRole.Assistant,
    content:
      'I will implement a login form component with the following features:\n\n1. Email input with validation\n2. Password input with visibility toggle\n3. Remember me checkbox\n4. Submit button with loading state\n\nLet me create the component now.',
    isStreaming: false,
    createdAt: '2024-01-15T11:01:00Z',
  },
];

const mockClaudeEvents: ClaudeEvent[] = [
  {
    type: 'user',
    message: {
      content: [{ type: 'tool_result', tool_use_id: 'init', content: 'Starting task' }],
    },
  },
  {
    type: 'assistant',
    message: {
      content: [
        {
          type: 'text',
          text: 'I will implement a login form component with the following features:\n\n1. Email input with validation\n2. Password input with visibility toggle\n3. Remember me checkbox\n4. Submit button with loading state',
        },
        {
          type: 'tool_use',
          id: 'tool-1',
          name: 'Write',
          input: { path: 'src/components/LoginForm.tsx' },
        },
      ],
    },
  },
];

const mockExecutorProfiles: ExecutorProfile[] = [
  {
    id: 'profile-1',
    name: 'Claude Code',
    description: 'Default Claude Code executor',
    command: 'claude',
    isDefault: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'profile-2',
    name: 'Gemini CLI',
    description: 'Google Gemini CLI executor',
    command: 'gemini',
    isDefault: false,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
];

const mockArtifacts: ArtifactFile[] = [
  {
    name: 'requirements.md',
    path: '.zenflow/tasks/task-1/requirements.md',
    isDirectory: false,
    size: 2048,
    modifiedAt: '2024-01-15T10:00:00Z',
  },
  {
    name: 'spec.md',
    path: '.zenflow/tasks/task-1/spec.md',
    isDirectory: false,
    size: 4096,
    modifiedAt: '2024-01-15T11:00:00Z',
  },
  {
    name: 'plan.md',
    path: '.zenflow/tasks/task-1/plan.md',
    isDirectory: false,
    size: 1024,
    modifiedAt: '2024-01-15T12:00:00Z',
  },
];

const mockDiffs: FileDiff[] = [
  {
    path: 'src/components/LoginForm.tsx',
    hunks: [
      {
        oldStart: 0,
        oldLines: 0,
        newStart: 1,
        newLines: 45,
        content:
          '+import React from "react";\n+import { useState } from "react";\n+\n+export function LoginForm() {\n+  const [email, setEmail] = useState("");\n+  const [password, setPassword] = useState("");\n+\n+  return (\n+    <form>\n+      <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />\n+      <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />\n+      <button type="submit">Login</button>\n+    </form>\n+  );\n+}',
      },
    ],
    additions: 45,
    deletions: 0,
    isBinary: false,
    isNew: true,
    isDeleted: false,
    isRenamed: false,
  },
  {
    path: 'src/pages/login.tsx',
    hunks: [
      {
        oldStart: 5,
        oldLines: 3,
        newStart: 5,
        newLines: 5,
        content:
          ' import { Layout } from "../components/Layout";\n+import { LoginForm } from "../components/LoginForm";\n \n export function LoginPage() {\n   return (\n     <Layout>\n-      <div>Login page placeholder</div>\n+      <LoginForm />\n     </Layout>\n   );\n }',
      },
    ],
    additions: 3,
    deletions: 1,
    isBinary: false,
    isNew: false,
    isDeleted: false,
    isRenamed: false,
  },
];

const mockCommits: Commit[] = [
  {
    hash: 'abc123def456abc123def456abc123def456abc1',
    shortHash: 'abc123d',
    message: 'feat: add LoginForm component',
    author: 'Claude',
    authorEmail: 'noreply@anthropic.com',
    date: '2024-01-15T14:00:00Z',
    filesChanged: 2,
    additions: 48,
    deletions: 1,
  },
  {
    hash: 'def456abc123def456abc123def456abc123def4',
    shortHash: 'def456a',
    message: 'feat: integrate LoginForm into login page',
    author: 'Claude',
    authorEmail: 'noreply@anthropic.com',
    date: '2024-01-15T14:30:00Z',
    filesChanged: 1,
    additions: 3,
    deletions: 1,
  },
];

// ============================================================================
// Helper functions
// ============================================================================

const noop = () => {};
const noopNumber = (_n: number) => {};
const noopBoolean = (_b: boolean) => {};
const noopString = (_s: string) => {};
const noopStatus = (_status: TaskStatus) => {};

// ============================================================================
// Default Props Factory
// ============================================================================

// Default sub-props extracted for reuse without non-null assertions
const defaultHeader = {
  onBack: noop,
  onStatusChange: noopStatus,
  onTitleEditToggle: noop,
  isTitleEditing: false,
  titleInputValue: mockTask.title,
  onTitleInputChange: noopString,
  onTitleEditSubmit: noop,
  onTitleEditCancel: noop,
  onCreatePR: noop,
  onMoreActions: noop,
};

const defaultTabs = {
  tabs: [
    { id: 'artifacts', label: 'Artifacts', icon: FileText, badge: 3 },
    { id: 'changes', label: 'Changes', icon: FileCode2, badge: 2 },
    { id: 'commits', label: 'Commits', icon: GitCommit, badge: 2 },
  ],
  activeTab: 'artifacts',
  onTabChange: noopString,
};

const defaultStepsPanel = {
  steps: mockWorkflowSteps,
  activeStepIndex: 1,
  onStartStep: noopNumber,
  onToggleStep: (_i: number, _c: boolean) => {},
  onSelectStep: noopNumber,
  onAddStep: noop,
  autoStart: true,
  onAutoStartChange: noopBoolean,
};

const defaultMainPanel = {
  claudeEvents: mockClaudeEvents,
  rawOutput: [] as string[],
  isRunning: false,
  showRawOutput: false,
  onToggleRawOutput: noop,
  messages: mockMessages,
  onSendMessage: noopString,
  isProcessing: false,
  onStopProcess: noop,
  executorProfiles: mockExecutorProfiles,
  selectedExecutorProfileId: 'profile-1',
};

const defaultArtifactsTab = {
  artifacts: mockArtifacts,
  loading: false,
  onOpenArtifact: (_a: ArtifactFile) => {},
  onPreviewArtifact: (_a: ArtifactFile) => {},
};

const defaultChangesTab = {
  diffs: mockDiffs,
  expandedFiles: new Set(['src/components/LoginForm.tsx']),
  onFileToggle: noopString,
};

const defaultCommitsTab = {
  commits: mockCommits,
  expandedCommits: new Set<string>(),
  onCommitToggle: noopString,
  onViewCommit: noopString,
};

const defaultAddStepDialog = {
  isOpen: false,
  onClose: noop,
  title: '',
  description: '',
  onTitleChange: noopString,
  onDescriptionChange: noopString,
  onCreateStep: noopBoolean,
  isCreating: false,
};

function createDefaultProps(overrides?: Partial<TaskPageProps>): TaskPageProps {
  return {
    state: 'ready',
    task: mockTask,
    chats: mockChats,
    header: defaultHeader,
    tabs: defaultTabs,
    stepsPanel: defaultStepsPanel,
    mainPanel: defaultMainPanel,
    artifactsTab: defaultArtifactsTab,
    changesTab: defaultChangesTab,
    commitsTab: defaultCommitsTab,
    addStepDialog: defaultAddStepDialog,
    artifactPreviewDialog: {
      isOpen: false,
      onClose: noop,
      fileName: '',
      content: null,
      loading: false,
    },
    moreMenu: {
      isOpen: false,
      position: { x: 0, y: 0 },
      onClose: noop,
      onArchive: noop,
      onDelete: noop,
    },
    confirmDialog: {
      isOpen: false,
      onClose: noop,
      onConfirm: noop,
      title: '',
      description: '',
    },
    ...overrides,
  };
}

// ============================================================================
// Stories
// ============================================================================

/**
 * Default task page with artifacts tab active
 */
export const Default: Story = {
  args: createDefaultProps(),
};

/**
 * Loading state
 */
export const Loading: Story = {
  args: {
    state: 'loading',
  },
};

/**
 * Not found state
 */
export const NotFound: Story = {
  args: {
    state: 'not-found',
    onNotFoundBack: noop,
  },
};

/**
 * Changes tab active showing file diffs
 */
export const ChangesTab: Story = {
  args: createDefaultProps({
    tabs: {
      ...defaultTabs,
      activeTab: 'changes',
    },
  }),
};

/**
 * Commits tab active
 */
export const CommitsTab: Story = {
  args: createDefaultProps({
    tabs: {
      ...defaultTabs,
      activeTab: 'commits',
    },
  }),
};

/**
 * Task with executor running
 */
export const ExecutorRunning: Story = {
  args: createDefaultProps({
    mainPanel: {
      ...defaultMainPanel,
      isRunning: true,
      isProcessing: true,
      claudeEvents: [
        ...mockClaudeEvents,
        {
          type: 'assistant',
          message: {
            content: [
              {
                type: 'tool_use',
                id: 'tool-2',
                name: 'Edit',
                input: { path: 'src/components/LoginForm.tsx' },
              },
            ],
          },
        },
      ],
    },
  }),
};

/**
 * Task with raw output visible
 */
export const RawOutputVisible: Story = {
  args: createDefaultProps({
    mainPanel: {
      ...defaultMainPanel,
      showRawOutput: true,
      rawOutput: [
        '$ claude --print "implement login form"',
        'Reading project context...',
        'Analyzing requirements...',
        'Creating LoginForm.tsx...',
        'Updating login.tsx...',
        'Done!',
      ],
    },
  }),
};

/**
 * Title being edited
 */
export const TitleEditing: Story = {
  args: createDefaultProps({
    header: {
      ...defaultHeader,
      isTitleEditing: true,
      titleInputValue: 'Implement user auth with OAuth',
    },
  }),
};

/**
 * Add step dialog open
 */
export const AddStepDialogOpen: Story = {
  args: createDefaultProps({
    addStepDialog: {
      ...defaultAddStepDialog,
      isOpen: true,
      title: 'Documentation',
      description: 'Update README with API documentation',
    },
  }),
};

/**
 * Add step dialog with creating state
 */
export const AddStepDialogCreating: Story = {
  args: createDefaultProps({
    addStepDialog: {
      ...defaultAddStepDialog,
      isOpen: true,
      title: 'Documentation',
      description: 'Update README with API documentation',
      isCreating: true,
    },
  }),
};

/**
 * Artifact preview dialog open
 */
export const ArtifactPreviewOpen: Story = {
  args: createDefaultProps({
    artifactPreviewDialog: {
      isOpen: true,
      onClose: noop,
      fileName: 'requirements.md',
      content:
        '# Requirements\n\n## User Authentication\n\n1. Email/password login\n2. OAuth integration (Google, GitHub)\n3. Password reset flow\n4. Remember me functionality',
      loading: false,
    },
  }),
};

/**
 * Artifact preview loading
 */
export const ArtifactPreviewLoading: Story = {
  args: createDefaultProps({
    artifactPreviewDialog: {
      isOpen: true,
      onClose: noop,
      fileName: 'requirements.md',
      content: null,
      loading: true,
    },
  }),
};

/**
 * More actions menu open
 */
export const MoreMenuOpen: Story = {
  args: createDefaultProps({
    moreMenu: {
      isOpen: true,
      position: { x: 100, y: 50 },
      onClose: noop,
      onArchive: noop,
      onDelete: noop,
    },
  }),
};

/**
 * Confirm delete dialog open
 */
export const ConfirmDeleteOpen: Story = {
  args: createDefaultProps({
    confirmDialog: {
      isOpen: true,
      onClose: noop,
      onConfirm: noop,
      title: 'Delete Task',
      description:
        'Are you sure you want to delete "Implement user authentication"? This action cannot be undone.',
      confirmLabel: 'Delete',
      cancelLabel: 'Cancel',
      variant: 'destructive',
    },
  }),
};

/**
 * Confirm archive dialog open
 */
export const ConfirmArchiveOpen: Story = {
  args: createDefaultProps({
    confirmDialog: {
      isOpen: true,
      onClose: noop,
      onConfirm: noop,
      title: 'Archive Task',
      description:
        'Are you sure you want to archive "Implement user authentication"? You can restore it later from the Archive.',
      confirmLabel: 'Archive',
      cancelLabel: 'Cancel',
      variant: 'warning',
    },
  }),
};

/**
 * Task in done status
 */
export const DoneStatus: Story = {
  args: createDefaultProps({
    task: {
      ...mockTask,
      status: TaskStatus.Done,
    },
    stepsPanel: {
      ...defaultStepsPanel,
      steps: mockWorkflowSteps.map((s) => ({ ...s, status: WorkflowStepStatus.Completed })),
      activeStepIndex: 3,
    },
  }),
};

/**
 * Task in review status
 */
export const InReviewStatus: Story = {
  args: createDefaultProps({
    task: {
      ...mockTask,
      status: TaskStatus.Inreview,
    },
    stepsPanel: {
      ...defaultStepsPanel,
      steps: mockWorkflowSteps.map((s, i) =>
        i < 3
          ? { ...s, status: WorkflowStepStatus.Completed }
          : { ...s, status: WorkflowStepStatus.InProgress }
      ),
      activeStepIndex: 3,
    },
  }),
};

/**
 * Loading artifacts
 */
export const LoadingArtifacts: Story = {
  args: createDefaultProps({
    artifactsTab: {
      ...defaultArtifactsTab,
      loading: true,
      artifacts: [],
    },
  }),
};

/**
 * Empty artifacts
 */
export const EmptyArtifacts: Story = {
  args: createDefaultProps({
    artifactsTab: {
      ...defaultArtifactsTab,
      artifacts: [],
    },
    tabs: {
      ...defaultTabs,
      tabs: [
        { id: 'artifacts', label: 'Artifacts', icon: FileText },
        { id: 'changes', label: 'Changes', icon: FileCode2, badge: 2 },
        { id: 'commits', label: 'Commits', icon: GitCommit, badge: 2 },
      ],
    },
  }),
};

/**
 * No changes
 */
export const NoChanges: Story = {
  args: createDefaultProps({
    tabs: {
      ...defaultTabs,
      activeTab: 'changes',
      tabs: [
        { id: 'artifacts', label: 'Artifacts', icon: FileText, badge: 3 },
        { id: 'changes', label: 'Changes', icon: FileCode2 },
        { id: 'commits', label: 'Commits', icon: GitCommit, badge: 2 },
      ],
    },
    changesTab: {
      ...defaultChangesTab,
      diffs: [],
    },
  }),
};

/**
 * Mobile viewport
 */
export const Mobile: Story = {
  args: createDefaultProps(),
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
};
