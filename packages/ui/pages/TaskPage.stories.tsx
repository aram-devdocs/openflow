/**
 * Storybook stories for TaskPage
 *
 * Demonstrates the complete task detail page in various states:
 * - Loading state with skeleton
 * - Not found state
 * - Error state with retry
 * - Ready state with different tabs
 * - With dialogs open
 * - Running executor
 * - Mobile viewport
 * - Responsive sizing
 * - Accessibility features
 *
 * @accessibility
 * - All states announce to screen readers via VisuallyHidden
 * - Error states use role="alert" with aria-live="assertive"
 * - Loading states use role="status" with aria-busy
 * - Touch targets meet WCAG 2.5.5 minimum of 44x44px on mobile
 * - Focus management for dialog interactions
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
import {
  // Constants for documentation
  DEFAULT_ERROR_DESCRIPTION,
  DEFAULT_ERROR_TITLE,
  DEFAULT_PAGE_SIZE,
  DEFAULT_SKELETON_MESSAGE_COUNT,
  DEFAULT_SKELETON_STEP_COUNT,
  SR_ERROR_PREFIX,
  SR_LOADING,
  SR_NOT_FOUND,
  SR_PROCESSING,
  SR_READY_PREFIX,
  SR_RUNNING,
  TaskPage,
  TaskPageError,
  type TaskPageProps,
  TaskPageSkeleton,
} from './TaskPage';

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

// ============================================================================
// Error State Stories
// ============================================================================

/**
 * Error state with retry button
 *
 * @accessibility
 * - Uses role="alert" for immediate announcement
 * - aria-live="assertive" for error urgency
 * - Retry button has minimum 44x44px touch target on mobile
 */
export const ErrorState: Story = {
  args: {
    state: 'error',
    errorMessage: 'Failed to load task data. The server returned an error.',
    onErrorRetry: noop,
    onNotFoundBack: noop,
  },
};

/**
 * Error state with only retry button (no back)
 */
export const ErrorRetryOnly: Story = {
  args: {
    state: 'error',
    errorMessage: 'Network connection failed. Please try again.',
    onErrorRetry: noop,
  },
};

/**
 * Error state with only back button (no retry)
 */
export const ErrorBackOnly: Story = {
  args: {
    state: 'error',
    errorMessage: 'This task has been deleted and cannot be recovered.',
    onNotFoundBack: noop,
  },
};

/**
 * Error state with default message
 */
export const ErrorDefault: Story = {
  args: {
    state: 'error',
    onErrorRetry: noop,
    onNotFoundBack: noop,
  },
};

// ============================================================================
// Responsive Size Stories
// ============================================================================

/**
 * Small size variant
 */
export const SizeSmall: Story = {
  args: createDefaultProps({
    size: 'sm',
  }),
};

/**
 * Medium size variant (default)
 */
export const SizeMedium: Story = {
  args: createDefaultProps({
    size: 'md',
  }),
};

/**
 * Large size variant
 */
export const SizeLarge: Story = {
  args: createDefaultProps({
    size: 'lg',
  }),
};

/**
 * Responsive size (changes with viewport)
 */
export const SizeResponsive: Story = {
  args: createDefaultProps({
    size: { base: 'sm', md: 'md', lg: 'lg' },
  }),
};

// ============================================================================
// Skeleton Sub-component Stories
// ============================================================================

/**
 * TaskPageSkeleton with default settings
 *
 * @accessibility
 * - Uses role="status" with aria-label for screen readers
 * - aria-busy="true" indicates loading state
 */
export const SkeletonDefault: StoryObj<typeof TaskPageSkeleton> = {
  render: () => (
    <div className="h-screen w-screen">
      <TaskPageSkeleton data-testid="task-page-skeleton" />
    </div>
  ),
};

/**
 * Skeleton with custom message and step count
 */
export const SkeletonCustomCounts: StoryObj<typeof TaskPageSkeleton> = {
  render: () => (
    <div className="h-screen w-screen">
      <TaskPageSkeleton messageCount={5} stepCount={6} data-testid="task-page-skeleton" />
    </div>
  ),
};

/**
 * Skeleton without steps panel
 */
export const SkeletonNoStepsPanel: StoryObj<typeof TaskPageSkeleton> = {
  render: () => (
    <div className="h-screen w-screen">
      <TaskPageSkeleton showStepsPanel={false} data-testid="task-page-skeleton" />
    </div>
  ),
};

/**
 * Skeleton with small size
 */
export const SkeletonSmall: StoryObj<typeof TaskPageSkeleton> = {
  render: () => (
    <div className="h-screen w-screen">
      <TaskPageSkeleton size="sm" data-testid="task-page-skeleton" />
    </div>
  ),
};

// ============================================================================
// Error Sub-component Stories
// ============================================================================

/**
 * TaskPageError with all options
 *
 * @accessibility
 * - Uses role="alert" for error announcement
 * - aria-describedby links error message to heading
 * - Buttons have minimum touch target on mobile
 */
export const ErrorComponentFull: StoryObj<typeof TaskPageError> = {
  render: () => (
    <div className="h-screen w-screen">
      <TaskPageError
        message="The task could not be loaded due to a server error."
        onRetry={noop}
        onBack={noop}
        data-testid="task-page-error"
      />
    </div>
  ),
};

/**
 * Error component with only retry
 */
export const ErrorComponentRetryOnly: StoryObj<typeof TaskPageError> = {
  render: () => (
    <div className="h-screen w-screen">
      <TaskPageError message="Connection lost. Please retry." onRetry={noop} />
    </div>
  ),
};

/**
 * Error component with small size
 */
export const ErrorComponentSmall: StoryObj<typeof TaskPageError> = {
  render: () => (
    <div className="h-screen w-screen">
      <TaskPageError message="An error occurred." onRetry={noop} onBack={noop} size="sm" />
    </div>
  ),
};

/**
 * Error component with large size
 */
export const ErrorComponentLarge: StoryObj<typeof TaskPageError> = {
  render: () => (
    <div className="h-screen w-screen">
      <TaskPageError message="An error occurred." onRetry={noop} onBack={noop} size="lg" />
    </div>
  ),
};

// ============================================================================
// Accessibility Demo Stories
// ============================================================================

/**
 * Accessibility demo: Screen reader announcements
 *
 * This story demonstrates the screen reader announcements for different states.
 * Use a screen reader or browser dev tools to inspect the VisuallyHidden elements.
 *
 * @accessibility
 * Screen reader announcements:
 * - Loading: "Loading task details"
 * - Not found: "Task not found"
 * - Error: "Error loading task: [message]"
 * - Ready: "Task loaded: [title]. [n] workflow steps. Showing [tab] tab."
 * - Running: "Executor is running"
 * - Processing: "Processing message"
 */
export const AccessibilityScreenReader: Story = {
  args: createDefaultProps(),
  parameters: {
    docs: {
      description: {
        story: `
**Screen Reader Announcements:**
- \`${SR_LOADING}\` - Loading state
- \`${SR_NOT_FOUND}\` - Not found state
- \`${SR_ERROR_PREFIX} [message]\` - Error state
- \`${SR_READY_PREFIX} [title]. [n] workflow steps. Showing [tab] tab.\` - Ready state
- \`${SR_RUNNING}\` - When executor is running
- \`${SR_PROCESSING}\` - When processing a message

**Constants:**
- \`DEFAULT_SKELETON_MESSAGE_COUNT\`: ${DEFAULT_SKELETON_MESSAGE_COUNT}
- \`DEFAULT_SKELETON_STEP_COUNT\`: ${DEFAULT_SKELETON_STEP_COUNT}
- \`DEFAULT_PAGE_SIZE\`: "${DEFAULT_PAGE_SIZE}"
- \`DEFAULT_ERROR_TITLE\`: "${DEFAULT_ERROR_TITLE}"
- \`DEFAULT_ERROR_DESCRIPTION\`: "${DEFAULT_ERROR_DESCRIPTION}"
        `,
      },
    },
  },
};

/**
 * Touch target accessibility demo
 *
 * On mobile viewports, buttons have minimum 44x44px touch targets
 * per WCAG 2.5.5 Target Size guidelines.
 */
export const AccessibilityTouchTargets: Story = {
  args: {
    state: 'error',
    errorMessage: 'Touch targets demo - buttons have 44x44px minimum on mobile',
    onErrorRetry: noop,
    onNotFoundBack: noop,
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
    docs: {
      description: {
        story:
          'On mobile viewports, all interactive elements have minimum 44x44px touch targets per WCAG 2.5.5.',
      },
    },
  },
};

/**
 * Focus management demo
 *
 * When dialogs open, focus is trapped within the dialog.
 * When dialogs close, focus returns to the trigger element.
 */
export const AccessibilityFocusManagement: Story = {
  args: createDefaultProps({
    addStepDialog: {
      ...defaultAddStepDialog,
      isOpen: true,
      title: 'Focus is trapped in this dialog',
      description: 'Press Tab to cycle through focusable elements',
    },
  }),
  parameters: {
    docs: {
      description: {
        story:
          'Dialog components trap focus within themselves and return focus to the trigger when closed.',
      },
    },
  },
};

/**
 * ARIA attributes demo
 *
 * This story shows the data attributes added for testing and the ARIA attributes
 * used for accessibility.
 */
export const AccessibilityAriaAttributes: Story = {
  args: createDefaultProps(),
  parameters: {
    docs: {
      description: {
        story: `
**Data Attributes (for testing):**
- \`data-testid\`: Test identifier
- \`data-state\`: Current page state ("loading" | "not-found" | "error" | "ready")
- \`data-task-id\`: Task ID when ready
- \`data-task-status\`: Task status when ready
- \`data-active-tab\`: Currently active tab
- \`data-step-count\`: Number of workflow steps
- \`data-chat-count\`: Number of chats
- \`data-size\`: Current size variant
- \`data-running\`: Whether executor is running
- \`data-processing\`: Whether processing a message

**ARIA Attributes:**
- \`aria-label\`: Accessible label for the page (includes task title and status)
- \`aria-live\`: Announces state changes to screen readers
- \`aria-busy\`: Indicates loading state
- \`role="status"\`: For loading/ready announcements
- \`role="alert"\`: For error announcements
        `,
      },
    },
  },
};
